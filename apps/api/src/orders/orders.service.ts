import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, Prisma } from '@repo/database';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';
import { CreateCheckoutDto } from './create-checkout.dto';
import {
  OrderNotification,
  OrderNotificationsService,
} from './order-notifications.service';
import { PaystackService } from './paystack.service';

const orderWithItems = {
  items: true,
} satisfies Prisma.OrderInclude;

type OrderWithItems = Prisma.OrderGetPayload<{
  include: typeof orderWithItems;
}>;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly paystack: PaystackService,
    private readonly notifications: OrderNotificationsService,
  ) {}

  async listStoreProducts(tenantSlug: string) {
    const tenant = await this.findTenantBySlug(tenantSlug);
    await this.releaseExpiredOrders(tenant.id);

    return this.prisma.product.findMany({
      where: { tenantId: tenant.id, status: 'PUBLISHED' },
      include: { category: true, variants: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCheckout(tenantSlug: string, dto: CreateCheckoutDto) {
    const tenant = await this.findTenantBySlug(tenantSlug);
    await this.releaseExpiredOrders(tenant.id);

    const itemKeys = dto.items.map(
      (item) => `${item.productId}:${item.variantId || ''}`,
    );
    if (new Set(itemKeys).size !== itemKeys.length) {
      throw new BadRequestException(
        'Each product variant can only appear once',
      );
    }

    const reference = `ep_${randomBytes(16).toString('hex')}`;
    const order = await this.prisma.$transaction(async (transaction) => {
      const products = await transaction.product.findMany({
        where: {
          tenantId: tenant.id,
          id: { in: [...new Set(dto.items.map((item) => item.productId))] },
          status: 'PUBLISHED',
        },
        include: { variants: true },
      });
      const productById = new Map(
        products.map((product) => [product.id, product]),
      );
      const lines = dto.items.map((item) => {
        const product = productById.get(item.productId);
        if (!product) {
          throw new BadRequestException('A selected product is unavailable');
        }

        const variant = item.variantId
          ? product.variants.find(
              (candidate) => candidate.id === item.variantId,
            )
          : undefined;
        if (item.variantId && !variant) {
          throw new BadRequestException(
            'A selected product variant is unavailable',
          );
        }
        if (product.variants.length > 0 && !variant) {
          throw new BadRequestException(
            `Choose a variant for ${product.name} before checkout`,
          );
        }
        if (product.currency !== 'NGN') {
          throw new BadRequestException(
            'Paystack checkout currently supports NGN products only',
          );
        }

        const unitPrice =
          variant?.price?.toNumber() ?? product.price.toNumber();
        return {
          product,
          variant,
          quantity: item.quantity,
          unitPrice,
          lineAmountKobo: Math.round(unitPrice * 100) * item.quantity,
        };
      });
      const totalKobo = lines.reduce(
        (total, line) => total + line.lineAmountKobo,
        0,
      );
      if (totalKobo < 100) {
        throw new BadRequestException('The order total must be at least ₦1.00');
      }

      for (const line of lines) {
        const stockUpdate = line.variant
          ? await transaction.productVariant.updateMany({
              where: {
                tenantId: tenant.id,
                id: line.variant.id,
                productId: line.product.id,
                inventoryQuantity: { gte: line.quantity },
              },
              data: { inventoryQuantity: { decrement: line.quantity } },
            })
          : await transaction.product.updateMany({
              where: {
                tenantId: tenant.id,
                id: line.product.id,
                inventoryQuantity: { gte: line.quantity },
              },
              data: { inventoryQuantity: { decrement: line.quantity } },
            });
        if (stockUpdate.count !== 1) {
          throw new ConflictException(
            `There is not enough stock for ${line.product.name}`,
          );
        }
      }

      const customerEmail = dto.customerEmail.trim().toLowerCase();
      const customer = await transaction.customer.upsert({
        where: {
          tenantId_email: { tenantId: tenant.id, email: customerEmail },
        },
        create: {
          tenantId: tenant.id,
          email: customerEmail,
          name: dto.customerName.trim(),
          phone: dto.customerPhone.trim(),
        },
        update: {
          name: dto.customerName.trim(),
          phone: dto.customerPhone.trim(),
        },
        select: { id: true },
      });

      return transaction.order.create({
        data: {
          tenantId: tenant.id,
          customerId: customer.id,
          customerName: dto.customerName.trim(),
          customerEmail,
          customerPhone: dto.customerPhone.trim(),
          shippingAddress: dto.shippingAddress.trim(),
          shippingCity: dto.shippingCity.trim(),
          shippingState: dto.shippingState.trim(),
          paymentReference: reference,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
          total: new Prisma.Decimal((totalKobo / 100).toFixed(2)),
          currency: 'NGN',
          items: {
            create: lines.map((line) => ({
              tenantId: tenant.id,
              productId: line.product.id,
              productName: line.product.name,
              variantId: line.variant?.id,
              variantName: line.variant?.name,
              sku: line.variant?.sku,
              quantity: line.quantity,
              unitPrice: new Prisma.Decimal(line.unitPrice.toFixed(2)),
            })),
          },
        },
        include: orderWithItems,
      });
    });

    const storefrontUrl =
      this.config.get<string>('STOREFRONT_URL') || 'http://localhost:3000';
    let authorizationUrl: string;
    try {
      const callbackUrl = new URL('/checkout/complete', storefrontUrl);
      callbackUrl.searchParams.set('store', tenant.slug);
      authorizationUrl = await this.paystack.initialize(
        order.customerEmail || '',
        Math.round(order.total.toNumber() * 100),
        reference,
        callbackUrl.toString(),
      );
    } catch (error) {
      await this.cancelPendingOrder(tenant.id, order.id);
      throw error;
    }

    this.notifications.orderPlaced(this.toNotificationOrder(order));
    return {
      orderId: order.id,
      reference,
      authorizationUrl,
      amount: order.total.toNumber(),
      currency: order.currency,
    };
  }

  async verifyPayment(reference: string) {
    const order = await this.prisma.order.findUnique({
      where: { paymentReference: reference },
      include: orderWithItems,
    });
    if (!order)
      throw new NotFoundException('Order payment reference not found');
    if (order.status === OrderStatus.PAID) {
      return { status: 'paid', orderId: order.id };
    }
    if (order.status !== OrderStatus.PENDING) {
      return { status: 'cancelled', orderId: order.id };
    }
    if (order.expiresAt && order.expiresAt <= new Date()) {
      await this.cancelPendingOrder(order.tenantId, order.id);
      return { status: 'expired', orderId: order.id };
    }

    const transaction = await this.paystack.verify(reference);
    if (
      transaction.reference !== reference ||
      transaction.currency !== order.currency ||
      transaction.amount !== Math.round(order.total.toNumber() * 100)
    ) {
      throw new ConflictException(
        'Paystack payment details do not match this order',
      );
    }
    if (transaction.status !== 'success') {
      return { status: transaction.status, orderId: order.id };
    }

    const updated = await this.prisma.order.updateMany({
      where: {
        tenantId: order.tenantId,
        id: order.id,
        status: OrderStatus.PENDING,
        inventoryReleasedAt: null,
      },
      data: { status: OrderStatus.PAID, paidAt: new Date() },
    });
    const paidOrder = await this.prisma.order.findUnique({
      where: { tenantId_id: { tenantId: order.tenantId, id: order.id } },
      include: orderWithItems,
    });
    if (!paidOrder) throw new NotFoundException('Order not found');
    if (updated.count) {
      this.notifications.orderPaid(this.toNotificationOrder(paidOrder));
    }
    return {
      status: paidOrder.status === OrderStatus.PAID ? 'paid' : 'cancelled',
      orderId: paidOrder.id,
    };
  }

  async handlePaystackWebhook(reference: string) {
    return this.verifyPayment(reference);
  }

  listOrders(tenantId: string) {
    return this.prisma.order.findMany({
      where: { tenantId },
      include: { customer: true, items: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getOrder(tenantId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { tenantId_id: { tenantId, id: orderId } },
      include: { customer: true, items: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateOrderStatus(
    tenantId: string,
    orderId: string,
    status: OrderStatus,
  ) {
    const order = await this.getOrder(tenantId, orderId);
    if (status === order.status) return order;

    if (status === OrderStatus.CANCELLED) {
      if (order.status !== OrderStatus.PENDING) {
        throw new BadRequestException(
          'Only unpaid orders can be cancelled here; paid orders require a refund',
        );
      }
      await this.cancelPendingOrder(tenantId, order.id);
      return this.getOrder(tenantId, order.id);
    }

    const allowedNextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
      [OrderStatus.PAID]: OrderStatus.PROCESSING,
      [OrderStatus.PROCESSING]: OrderStatus.SHIPPED,
      [OrderStatus.SHIPPED]: OrderStatus.DELIVERED,
    };
    if (allowedNextStatus[order.status] !== status) {
      throw new BadRequestException(
        'That order status transition is not allowed',
      );
    }

    return this.prisma.order.update({
      where: { tenantId_id: { tenantId, id: orderId } },
      data: { status },
      include: { customer: true, items: true },
    });
  }

  private async findTenantBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true },
    });
    if (!tenant) throw new NotFoundException('Store not found');
    return tenant;
  }

  private async releaseExpiredOrders(tenantId: string): Promise<void> {
    const expired = await this.prisma.order.findMany({
      where: {
        tenantId,
        status: OrderStatus.PENDING,
        inventoryReleasedAt: null,
        expiresAt: { lte: new Date() },
      },
      select: { id: true },
    });
    for (const order of expired) {
      await this.cancelPendingOrder(tenantId, order.id);
    }
  }

  private async cancelPendingOrder(
    tenantId: string,
    orderId: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const order = await transaction.order.findUnique({
        where: { tenantId_id: { tenantId, id: orderId } },
        include: orderWithItems,
      });
      if (
        !order ||
        order.status !== OrderStatus.PENDING ||
        order.inventoryReleasedAt
      ) {
        return;
      }

      const cancellation = await transaction.order.updateMany({
        where: {
          tenantId,
          id: orderId,
          status: OrderStatus.PENDING,
          inventoryReleasedAt: null,
        },
        data: {
          status: OrderStatus.CANCELLED,
          inventoryReleasedAt: new Date(),
        },
      });
      if (cancellation.count !== 1) return;

      for (const item of order.items) {
        if (item.variantId) {
          await transaction.productVariant.updateMany({
            where: {
              tenantId,
              productId: item.productId,
              id: item.variantId,
            },
            data: { inventoryQuantity: { increment: item.quantity } },
          });
        } else {
          await transaction.product.updateMany({
            where: { tenantId, id: item.productId },
            data: { inventoryQuantity: { increment: item.quantity } },
          });
        }
      }
    });
  }

  private toNotificationOrder(order: OrderWithItems): OrderNotification {
    return {
      id: order.id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      total: order.total.toFixed(2),
      currency: order.currency,
      items: order.items.map((item) => ({
        productName: item.productName,
        variantName: item.variantName,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
      })),
    };
  }
}
