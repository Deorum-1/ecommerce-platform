import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import { CatalogService } from './catalog.service';

describe('CatalogService', () => {
  let service: CatalogService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      category: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      product: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(
        async (callback: (transaction: any) => Promise<unknown>) =>
          callback(prisma),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(CatalogService);
  });

  it('creates a tenant-scoped product with variants and inventory', async () => {
    prisma.product.create.mockResolvedValue({
      id: 'product-123',
      tenantId: 'tenant-123',
      name: 'Canvas Shoes',
      slug: 'canvas-shoes',
      inventoryQuantity: 12,
      variants: [{ name: 'Black / 42', inventoryQuantity: 4 }],
    });

    await expect(
      service.createProduct('tenant-123', {
        name: 'Canvas Shoes',
        price: 45000,
        inventoryQuantity: 12,
        variants: [{ name: 'Black / 42', inventoryQuantity: 4 }],
      }),
    ).resolves.toMatchObject({
      id: 'product-123',
      inventoryQuantity: 12,
    });

    expect(prisma.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 'tenant-123',
          name: 'Canvas Shoes',
          slug: 'canvas-shoes',
          inventoryQuantity: 12,
          variants: {
            create: [
              expect.objectContaining({
                name: 'Black / 42',
                inventoryQuantity: 4,
              }),
            ],
          },
        }),
      }),
    );
    expect(
      prisma.product.create.mock.calls[0][0].data.variants.create[0],
    ).not.toHaveProperty('tenantId');
  });

  it('rejects a missing product as tenant-scoped', async () => {
    prisma.product.findUnique.mockResolvedValue(null);

    await expect(
      service.getProduct('tenant-123', 'missing-product'),
    ).rejects.toThrow(NotFoundException);
  });

  it('maps database uniqueness errors to conflict responses', async () => {
    prisma.category.create.mockRejectedValue({
      code: 'P2002',
    });

    await expect(
      service.createCategory('tenant-123', { name: 'Shoes' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('replaces variant rows and saves image URLs when updating a product', async () => {
    prisma.product.findUnique.mockResolvedValue({
      id: 'product-123',
      tenantId: 'tenant-123',
    });
    prisma.product.update.mockResolvedValue({
      id: 'product-123',
      imageUrls: ['https://images.example.com/product.png'],
      variants: [{ name: 'Blue / M', inventoryQuantity: 3 }],
    });

    await service.updateProduct('tenant-123', 'product-123', {
      imageUrls: ['https://images.example.com/product.png'],
      variants: [{ name: 'Blue / M', inventoryQuantity: 3 }],
    });

    expect(prisma.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          imageUrls: ['https://images.example.com/product.png'],
          variants: {
            deleteMany: {},
            create: [
              expect.objectContaining({
                name: 'Blue / M',
                inventoryQuantity: 3,
              }),
            ],
          },
        }),
      }),
    );
    expect(
      prisma.product.update.mock.calls[0][0].data.variants.create[0],
    ).not.toHaveProperty('tenantId');
  });

  it('lists only non-archived products and categories used by them', () => {
    service.listProducts('tenant-123');
    service.listCategories('tenant-123');

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: 'tenant-123', status: { not: 'ARCHIVED' } },
      }),
    );
    expect(prisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId: 'tenant-123',
          products: { some: { status: { not: 'ARCHIVED' } } },
        },
      }),
    );
  });

  it('imports valid product rows and reports invalid rows independently', async () => {
    prisma.category.findMany.mockResolvedValue([]);
    prisma.product.create.mockResolvedValue({ id: 'product-123' });

    await expect(
      service.importProducts('tenant-123', [
        { name: 'Canvas Shoes', price: '45000', inventoryQuantity: '12' },
        { name: 'Invalid Product', price: '', inventoryQuantity: 1 },
      ]),
    ).resolves.toEqual({
      imported: 1,
      failed: 1,
      errors: [{ row: 3, message: 'price is required' }],
    });
    expect(prisma.product.create).toHaveBeenCalledTimes(1);
  });

  it('normalizes alternate import headers and formatted numeric values', async () => {
    prisma.category.findMany.mockResolvedValue([]);
    prisma.product.create.mockResolvedValue({ id: 'product-123' });
    prisma.product.findMany.mockResolvedValue([]);

    await expect(
      service.importProducts('tenant-123', [
        {
          'Product Name': 'Canvas Shoes',
          'Unit Price': '₦ 45,000.00',
          'Stock Qty': '1,200',
        },
      ]),
    ).resolves.toEqual({ imported: 1, failed: 0, errors: [] });

    expect(prisma.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Canvas Shoes',
          price: 45000,
          inventoryQuantity: 1200,
        }),
      }),
    );
  });

  it('creates categories from imported rows and normalizes common status values', async () => {
    prisma.category.findMany.mockResolvedValue([]);
    prisma.product.findMany.mockResolvedValue([]);
    prisma.category.create.mockResolvedValue({
      id: 'category-123',
      tenantId: 'tenant-123',
      name: 'Clothing',
      slug: 'clothing',
    });
    prisma.category.findUnique.mockResolvedValue({
      id: 'category-123',
      tenantId: 'tenant-123',
      name: 'Clothing',
      slug: 'clothing',
    });
    prisma.product.create.mockResolvedValue({ id: 'product-123' });

    await expect(
      service.importProducts('tenant-123', [
        {
          'Product Name': 'Canvas Shirt',
          Price: '45000',
          Category: 'Clothing',
          Status: 'Active',
        },
        {
          'Product Name': 'Jeans',
          Price: '60000',
          Category: 'clothing',
          Status: 'Enabled',
        },
        {
          'Product Name': 'Stoneware Mug',
          Price: '30',
          Category: 'Home & Kitchen',
          Status: 'Available',
        },
      ]),
    ).resolves.toEqual({ imported: 3, failed: 0, errors: [] });

    expect(prisma.category.create).toHaveBeenCalledTimes(2);
    expect(prisma.category.create).toHaveBeenNthCalledWith(1, {
      data: {
        tenantId: 'tenant-123',
        name: 'Clothing',
        slug: 'clothing',
      },
    });
    expect(prisma.category.create).toHaveBeenNthCalledWith(2, {
      data: {
        tenantId: 'tenant-123',
        name: 'Home & Kitchen',
        slug: 'home-kitchen',
      },
    });
    expect(prisma.product.create).toHaveBeenCalledTimes(3);
  });

  it('overwrites stock when an imported slug matches an existing product', async () => {
    prisma.category.findMany.mockResolvedValue([]);
    prisma.product.findMany.mockResolvedValue([]);
    prisma.product.findUnique.mockResolvedValue({
      id: 'product-123',
      tenantId: 'tenant-123',
      slug: 'canvas-shoes',
      inventoryQuantity: 40,
    });
    prisma.product.update.mockResolvedValue({
      id: 'product-123',
      inventoryQuantity: 7,
    });

    await expect(
      service.importProducts('tenant-123', [
        {
          name: 'Canvas Shoes',
          slug: 'canvas-shoes',
          price: '45000',
          inventoryQuantity: '7',
        },
      ]),
    ).resolves.toEqual({ imported: 1, failed: 0, errors: [] });

    expect(prisma.product.create).not.toHaveBeenCalled();
    expect(prisma.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Canvas Shoes',
          slug: 'canvas-shoes',
          price: 45000,
          inventoryQuantity: 7,
          categoryId: null,
        }),
      }),
    );
  });

  it('deletes stale products and archives stale products linked to orders', async () => {
    prisma.category.findMany.mockResolvedValue([]);
    prisma.product.create.mockResolvedValue({ id: 'new-product' });
    prisma.product.findMany.mockResolvedValue([
      { id: 'stale-product', slug: 'old-item', _count: { orderItems: 0 } },
      { id: 'ordered-product', slug: 'ordered-item', _count: { orderItems: 2 } },
    ]);

    await expect(
      service.importProducts('tenant-123', [
        { name: 'New Item', price: 2500 },
      ]),
    ).resolves.toEqual({ imported: 1, failed: 0, errors: [] });

    expect(prisma.product.updateMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-123', id: { in: ['ordered-product'] } },
      data: { status: 'ARCHIVED' },
    });
    expect(prisma.product.deleteMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-123', id: { in: ['stale-product'] } },
    });
  });

  it('does not clear existing products when any imported row is invalid', async () => {
    prisma.category.findMany.mockResolvedValue([]);
    prisma.product.create.mockResolvedValue({ id: 'product-123' });

    await service.importProducts('tenant-123', [
      { name: 'Valid Product', price: 25 },
      { name: 'Invalid Product', price: '' },
    ]);

    expect(prisma.product.findMany).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
