import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@repo/database';
import { PrismaService } from '../database/prisma.service';
import { OrderNotificationsService } from './order-notifications.service';
import { OrdersService } from './orders.service';
import { PaystackService } from './paystack.service';

describe('OrdersService', () => {
  const product = {
    id: 'product-1',
    name: 'Stoneware mug',
    price: new Prisma.Decimal('25.00'),
    currency: 'NGN',
    inventoryQuantity: 4,
    variants: [],
  };
  const createdOrder = {
    id: 'order-1',
    customerName: 'Buyer',
    customerEmail: 'buyer@example.com',
    customerPhone: '+2348012345678',
    total: new Prisma.Decimal('50.00'),
    currency: 'NGN',
    items: [
      {
        productName: 'Stoneware mug',
        variantName: null,
        quantity: 2,
        unitPrice: new Prisma.Decimal('25.00'),
      },
    ],
  };

  it('reserves tenant-scoped stock and initializes payment using database prices', async () => {
    const productFindMany = jest.fn().mockResolvedValue([product]);
    const productUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
    const orderCreate = jest.fn().mockResolvedValue(createdOrder);
    const transaction = {
      product: { findMany: productFindMany, updateMany: productUpdateMany },
      productVariant: { updateMany: jest.fn() },
      customer: { upsert: jest.fn().mockResolvedValue({ id: 'customer-1' }) },
      order: { create: orderCreate },
    };
    const prisma = {
      tenant: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 'tenant-1', name: 'Shop', slug: 'shop' }),
      },
      order: { findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest.fn(
        (work: (client: typeof transaction) => Promise<unknown>) =>
          work(transaction),
      ),
    };
    const paystack = {
      initialize: jest
        .fn()
        .mockResolvedValue('https://checkout.paystack.com/x'),
    };
    const notifications = { orderPlaced: jest.fn() };
    const service = new OrdersService(
      prisma as unknown as PrismaService,
      { get: () => 'http://localhost:3000' } as unknown as ConfigService,
      paystack as unknown as PaystackService,
      notifications as unknown as OrderNotificationsService,
    );

    await expect(
      service.createCheckout('shop', {
        customerName: 'Buyer',
        customerEmail: 'BUYER@example.com',
        customerPhone: '+2348012345678',
        shippingAddress: '1 Market Road',
        shippingCity: 'Lagos',
        shippingState: 'Lagos',
        items: [{ productId: 'product-1', quantity: 2 }],
      }),
    ).resolves.toMatchObject({
      orderId: 'order-1',
      amount: 50,
      currency: 'NGN',
      authorizationUrl: 'https://checkout.paystack.com/x',
    });

    expect(productFindMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        id: { in: ['product-1'] },
        status: 'PUBLISHED',
      },
      include: { variants: true },
    });
    expect(productUpdateMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        id: 'product-1',
        inventoryQuantity: { gte: 2 },
      },
      data: { inventoryQuantity: { decrement: 2 } },
    });
    expect(paystack.initialize).toHaveBeenCalledWith(
      'buyer@example.com',
      5000,
      expect.stringMatching(/^ep_/),
      'http://localhost:3000/checkout/complete?store=shop',
    );
    expect(notifications.orderPlaced).toHaveBeenCalled();
  });

  it('rejects products that have variants when the buyer does not select one', async () => {
    const productFindMany = jest.fn().mockResolvedValue([
      {
        ...product,
        variants: [
          {
            id: 'variant-1',
            name: 'Cream',
            price: null,
            inventoryQuantity: 2,
          },
        ],
      },
    ]);
    const transaction = {
      product: { findMany: productFindMany, updateMany: jest.fn() },
      productVariant: { updateMany: jest.fn() },
      customer: { upsert: jest.fn() },
      order: { create: jest.fn() },
    };
    const prisma = {
      tenant: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 'tenant-1', name: 'Shop', slug: 'shop' }),
      },
      order: { findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest.fn(
        (work: (client: typeof transaction) => Promise<unknown>) =>
          work(transaction),
      ),
    };
    const service = new OrdersService(
      prisma as unknown as PrismaService,
      { get: () => 'http://localhost:3000' } as unknown as ConfigService,
      { initialize: jest.fn() } as unknown as PaystackService,
      { orderPlaced: jest.fn() } as unknown as OrderNotificationsService,
    );

    await expect(
      service.createCheckout('shop', {
        customerName: 'Buyer',
        customerEmail: 'buyer@example.com',
        customerPhone: '+2348012345678',
        shippingAddress: '1 Market Road',
        shippingCity: 'Lagos',
        shippingState: 'Lagos',
        items: [{ productId: 'product-1', quantity: 1 }],
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
