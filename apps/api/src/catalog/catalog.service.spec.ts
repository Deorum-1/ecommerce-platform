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
        delete: jest.fn(),
      },
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
                tenantId: 'tenant-123',
                name: 'Black / 42',
                inventoryQuantity: 4,
              }),
            ],
          },
        }),
      }),
    );
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
                tenantId: 'tenant-123',
                name: 'Blue / M',
                inventoryQuantity: 3,
              }),
            ],
          },
        }),
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
});
