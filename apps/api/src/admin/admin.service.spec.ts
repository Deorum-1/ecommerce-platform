import { AdminService } from './admin.service';
import { PrismaService } from '../database/prisma.service';

describe('AdminService', () => {
  const prisma = {
    order: { findMany: jest.fn() },
    orderItem: { groupBy: jest.fn() },
    product: { count: jest.fn(), findMany: jest.fn() },
  };
  let service: AdminService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdminService(prisma as unknown as PrismaService);
  });

  it('returns tenant-scoped overview metrics and low-stock inventory', async () => {
    prisma.order.findMany
      .mockResolvedValueOnce([
        { status: 'PAID', total: { toNumber: () => 120 }, currency: 'NGN' },
        { status: 'PENDING', total: { toNumber: () => 30 }, currency: 'NGN' },
      ])
      .mockResolvedValueOnce([{ id: 'order-1', items: [] }]);
    prisma.product.count.mockResolvedValueOnce(4).mockResolvedValueOnce(2);
    prisma.product.findMany.mockResolvedValueOnce([
      {
        id: 'product-1',
        name: 'Low stock item',
        inventoryQuantity: 2,
        currency: 'NGN',
      },
    ]);

    const result = await service.overview('tenant-a');

    expect(result).toMatchObject({
      revenue: 120,
      orders: 2,
      paidOrders: 1,
      products: 4,
      lowStockCount: 2,
      lowStock: [{ id: 'product-1', inventoryQuantity: 2 }],
    });
    expect(prisma.order.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ where: { tenantId: 'tenant-a' } }),
    );
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId: 'tenant-a',
          status: { not: 'ARCHIVED' },
          inventoryQuantity: { lte: 5 },
        },
      }),
    );
    expect(prisma.product.count).toHaveBeenNthCalledWith(1, {
      where: { tenantId: 'tenant-a', status: { not: 'ARCHIVED' } },
    });
  });

  it('excludes archived products from analytics rankings', async () => {
    prisma.order.findMany.mockResolvedValue([
      {
        createdAt: new Date('2026-11-27T12:00:00.000Z'),
        total: { toNumber: () => 120 },
        status: 'PAID',
        currency: 'NGN',
      },
    ]);
    prisma.orderItem.groupBy.mockResolvedValue([
      { productId: 'current-product', _sum: { quantity: 3 } },
      { productId: 'archived-product', _sum: { quantity: 5 } },
    ]);
    prisma.product.findMany.mockResolvedValue([
      { id: 'current-product', name: 'Imported item', currency: 'NGN' },
    ]);

    const result = await service.analytics('tenant-a');

    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-a',
        id: { in: ['current-product', 'archived-product'] },
        status: { not: 'ARCHIVED' },
      },
      select: { id: true, name: true, currency: true },
    });
    expect(result.topProducts).toEqual([
      {
        id: 'current-product',
        name: 'Imported item',
        currency: 'NGN',
        quantity: 3,
      },
    ]);
  });
});
