import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DiscountType, OrderStatus, Prisma } from '@repo/database';
import { PrismaService } from '../database/prisma.service';
import { CreateDiscountDto } from './create-discount.dto';
import { UpdateStoreSettingsDto } from './update-store-settings.dto';
import { UpdateDiscountDto } from './update-discount.dto';

const revenueStatuses: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(tenantId: string) {
    const [orders, products, recentOrders, lowStock, lowStockCount] =
      await Promise.all([
        this.prisma.order.findMany({
          where: { tenantId },
          select: { status: true, total: true, currency: true },
        }),
        this.prisma.product.count({
          where: { tenantId, status: { not: 'ARCHIVED' } },
        }),
        this.prisma.order.findMany({
          where: { tenantId },
          include: { items: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        this.prisma.product.findMany({
          where: {
            tenantId,
            status: { not: 'ARCHIVED' },
            inventoryQuantity: { lte: 5 },
          },
          orderBy: { inventoryQuantity: 'asc' },
          take: 10,
          select: {
            id: true,
            name: true,
            inventoryQuantity: true,
            currency: true,
          },
        }),
        this.prisma.product.count({
          where: {
            tenantId,
            status: { not: 'ARCHIVED' },
            inventoryQuantity: { lte: 5 },
          },
        }),
      ]);
    const paidOrders = orders.filter((order) =>
      revenueStatuses.includes(order.status),
    );
    const currency = orders[0]?.currency ?? 'NGN';
    return {
      revenue: paidOrders.reduce(
        (sum, order) => sum + order.total.toNumber(),
        0,
      ),
      orders: orders.length,
      paidOrders: paidOrders.length,
      products,
      lowStockCount,
      lowStock,
      recentOrders,
      currency,
    };
  }

  async analytics(tenantId: string) {
    const since = new Date();
    since.setDate(since.getDate() - 29);
    since.setHours(0, 0, 0, 0);
    const [orders, itemGroups] = await Promise.all([
      this.prisma.order.findMany({
        where: { tenantId, createdAt: { gte: since } },
        select: { createdAt: true, total: true, status: true, currency: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          tenantId,
          order: { status: { in: revenueStatuses } },
        },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ]);
    const grouped = new Map<string, { orders: number; revenue: number }>();
    for (const order of orders) {
      const key = order.createdAt.toISOString().slice(0, 10);
      const value = grouped.get(key) ?? { orders: 0, revenue: 0 };
      value.orders += 1;
      if (revenueStatuses.includes(order.status))
        value.revenue += order.total.toNumber();
      grouped.set(key, value);
    }
    const products = itemGroups.length
      ? await this.prisma.product.findMany({
          where: {
            tenantId,
            id: { in: itemGroups.map((item) => item.productId) },
            status: { not: 'ARCHIVED' },
          },
          select: { id: true, name: true, currency: true },
        })
      : [];
    const productById = new Map(
      products.map((product) => [product.id, product]),
    );
    return {
      daily: Array.from(grouped, ([date, values]) => ({ date, ...values })),
      topProducts: itemGroups.flatMap((item) => {
        const product = productById.get(item.productId);
        return product
          ? [{ ...product, quantity: item._sum.quantity ?? 0 }]
          : [];
      }),
      currency: orders[0]?.currency ?? 'NGN',
    };
  }

  listCustomers(tenantId: string) {
    return this.prisma.customer
      .findMany({
        where: { tenantId },
        include: {
          _count: { select: { orders: true } },
          orders: {
            where: { status: { in: revenueStatuses } },
            select: { total: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      })
      .then((customers) =>
        customers.map(({ orders, ...customer }) => ({
          ...customer,
          lifetimeValue: orders.reduce(
            (total, order) => total + order.total.toNumber(),
            0,
          ),
        })),
      );
  }

  listDiscounts(tenantId: string) {
    return this.prisma.discount.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  createDiscount(tenantId: string, dto: CreateDiscountDto) {
    this.validateDiscount(dto);
    return this.prisma.discount
      .create({
        data: {
          tenantId,
          code: dto.code.trim().toUpperCase(),
          type: dto.type,
          value: dto.value,
          active: dto.active ?? true,
          startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
          endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
          usageLimit: dto.usageLimit,
          minimumSubtotal: dto.minimumSubtotal,
        },
      })
      .catch((error: unknown) => {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new BadRequestException('That coupon code is already in use');
        }
        throw error;
      });
  }

  async updateDiscount(tenantId: string, id: string, dto: UpdateDiscountDto) {
    const existing = await this.requireDiscount(tenantId, id);
    this.validateDiscount({
      type: dto.type ?? existing.type,
      value: dto.value ?? existing.value.toNumber(),
      startsAt:
        dto.startsAt === undefined
          ? existing.startsAt?.toISOString()
          : dto.startsAt,
      endsAt:
        dto.endsAt === undefined ? existing.endsAt?.toISOString() : dto.endsAt,
    });
    return this.prisma.discount.update({
      where: { tenantId_id: { tenantId, id } },
      data: {
        ...(dto.code !== undefined
          ? { code: dto.code.trim().toUpperCase() }
          : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.value !== undefined ? { value: dto.value } : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
        ...(dto.startsAt !== undefined
          ? { startsAt: dto.startsAt ? new Date(dto.startsAt) : null }
          : {}),
        ...(dto.endsAt !== undefined
          ? { endsAt: dto.endsAt ? new Date(dto.endsAt) : null }
          : {}),
        ...(dto.usageLimit !== undefined ? { usageLimit: dto.usageLimit } : {}),
        ...(dto.minimumSubtotal !== undefined
          ? { minimumSubtotal: dto.minimumSubtotal }
          : {}),
      },
    });
  }

  async deleteDiscount(tenantId: string, id: string) {
    await this.requireDiscount(tenantId, id);
    await this.prisma.discount.delete({
      where: { tenantId_id: { tenantId, id } },
    });
  }

  getSettings(tenantId: string) {
    return this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        currency: true,
        description: true,
        contactEmail: true,
        website: true,
      },
    });
  }

  async updateSettings(tenantId: string, dto: UpdateStoreSettingsDto) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.logoUrl !== undefined ? { logoUrl: dto.logoUrl || null } : {}),
        ...(dto.currency !== undefined
          ? { currency: dto.currency.toUpperCase() }
          : {}),
        ...(dto.description !== undefined
          ? { description: dto.description.trim() || null }
          : {}),
        ...(dto.contactEmail !== undefined
          ? { contactEmail: dto.contactEmail || null }
          : {}),
        ...(dto.website !== undefined ? { website: dto.website || null } : {}),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        currency: true,
        description: true,
        contactEmail: true,
        website: true,
      },
    });
  }

  private async requireDiscount(tenantId: string, id: string) {
    const discount = await this.prisma.discount.findUnique({
      where: { tenantId_id: { tenantId, id } },
    });
    if (!discount) throw new NotFoundException('Discount not found');
    return discount;
  }

  private validateDiscount(
    dto: Pick<CreateDiscountDto, 'type' | 'value'> &
      Partial<Pick<CreateDiscountDto, 'startsAt' | 'endsAt'>>,
  ) {
    if (dto.type === DiscountType.PERCENTAGE && dto.value > 100) {
      throw new BadRequestException('Percentage discounts cannot exceed 100');
    }
    if (
      dto.startsAt &&
      dto.endsAt &&
      new Date(dto.endsAt) <= new Date(dto.startsAt)
    ) {
      throw new BadRequestException('End date must be after start date');
    }
  }
}
