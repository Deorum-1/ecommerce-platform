import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma, ProductStatus } from '@repo/database';
import { createHmac } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';
import { CreateCategoryDto } from './create-category.dto';
import { UpdateCategoryDto } from './update-category.dto';
import { CreateProductDto } from './create-product.dto';
import { UpdateProductDto } from './update-product.dto';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  listCategories(tenantId: string) {
    return this.prisma.category.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(tenantId: string, dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        tenantId,
        name: dto.name.trim(),
        slug: this.slugify(dto.slug || dto.name),
      },
    }).catch((error) => this.handleUniqueError(error));
  }

  async updateCategory(
    tenantId: string,
    categoryId: string,
    dto: UpdateCategoryDto,
  ) {
    await this.findCategory(tenantId, categoryId);
    return this.prisma.category
      .update({
        where: { tenantId_id: { tenantId, id: categoryId } },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.slug !== undefined || dto.name !== undefined
            ? { slug: this.slugify(dto.slug || dto.name || '') }
            : {}),
        },
      })
      .catch((error) => this.handleUniqueError(error));
  }

  async deleteCategory(tenantId: string, categoryId: string) {
    await this.findCategory(tenantId, categoryId);
    await this.prisma.category.delete({
      where: { tenantId_id: { tenantId, id: categoryId } },
    });
  }

  listProducts(tenantId: string) {
    return this.prisma.product.findMany({
      where: { tenantId },
      include: { category: true, variants: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProduct(tenantId: string, productId: string) {
    return this.findProduct(tenantId, productId);
  }

  async createProduct(tenantId: string, dto: CreateProductDto) {
    if (dto.categoryId) {
      await this.findCategory(tenantId, dto.categoryId);
    }

    const variants = dto.variants?.map((variant) => ({
      tenantId,
      name: variant.name.trim(),
      sku: variant.sku?.trim() || null,
      price: variant.price,
      inventoryQuantity: variant.inventoryQuantity,
    }));

    return this.prisma.product
      .create({
        data: {
          tenantId,
          categoryId: dto.categoryId,
          name: dto.name.trim(),
          slug: this.slugify(dto.slug || dto.name),
          description: dto.description?.trim(),
          price: dto.price,
          currency: dto.currency?.toUpperCase() || 'NGN',
          status: dto.status,
          inventoryQuantity: dto.inventoryQuantity,
          imageUrls: dto.imageUrls,
          variants: variants?.length ? { create: variants } : undefined,
        },
        include: { category: true, variants: true },
      })
      .catch((error) => this.handleUniqueError(error));
  }

  async updateProduct(
    tenantId: string,
    productId: string,
    dto: UpdateProductDto,
  ) {
    await this.findProduct(tenantId, productId);
    if (dto.categoryId) {
      await this.findCategory(tenantId, dto.categoryId);
    }

    return this.prisma.product
      .update({
        where: { tenantId_id: { tenantId, id: productId } },
        data: {
          ...(dto.categoryId !== undefined
            ? { categoryId: dto.categoryId || null }
            : {}),
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.slug !== undefined || dto.name !== undefined
            ? { slug: this.slugify(dto.slug || dto.name || '') }
            : {}),
          ...(dto.description !== undefined
            ? { description: dto.description?.trim() }
            : {}),
          ...(dto.price !== undefined ? { price: dto.price } : {}),
          ...(dto.currency !== undefined
            ? { currency: dto.currency.toUpperCase() }
            : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          ...(dto.inventoryQuantity !== undefined
            ? { inventoryQuantity: dto.inventoryQuantity }
            : {}),
          ...(dto.imageUrls !== undefined ? { imageUrls: dto.imageUrls } : {}),
          ...(dto.variants !== undefined
            ? {
                variants: {
                  deleteMany: {},
                  ...(dto.variants.length
                    ? {
                        create: dto.variants.map((variant) => ({
                          tenantId,
                          name: variant.name.trim(),
                          sku: variant.sku?.trim() || null,
                          price: variant.price,
                          inventoryQuantity: variant.inventoryQuantity,
                        })),
                      }
                    : {}),
                },
              }
            : {}),
        },
        include: { category: true, variants: true },
      })
      .catch((error) => this.handleUniqueError(error));
  }

  async deleteProduct(tenantId: string, productId: string) {
    await this.findProduct(tenantId, productId);
    await this.prisma.product.delete({
      where: { tenantId_id: { tenantId, id: productId } },
    });
  }

  async importProducts(tenantId: string, rows: Record<string, unknown>[]) {
    if (!Array.isArray(rows) || rows.length === 0 || rows.length > 250) {
      throw new BadRequestException('Import between 1 and 250 product rows');
    }

    const categories = await this.prisma.category.findMany({
      where: { tenantId },
    });
    const categoryByName = new Map(
      categories.map((category) => [category.name.trim().toLowerCase(), category]),
    );
    const errors: { row: number; message: string }[] = [];
    let imported = 0;

    for (const [index, row] of rows.entries()) {
      try {
        if (!row || typeof row !== 'object' || Array.isArray(row)) {
          throw new BadRequestException('Row must contain product fields');
        }

        const name = this.rowString(row.name);
        const price = this.rowNumber(row.price, 'price');
        const inventoryQuantity =
          row.inventoryQuantity === undefined || row.inventoryQuantity === ''
            ? 0
            : this.rowNumber(row.inventoryQuantity, 'inventoryQuantity');
        if (!Number.isInteger(inventoryQuantity)) {
          throw new BadRequestException('inventoryQuantity must be a whole number');
        }
        if (!name) {
          throw new BadRequestException('name is required');
        }
        if (name.length > 180) {
          throw new BadRequestException('name must be 180 characters or fewer');
        }

        const categoryName = this.rowString(row.category ?? row.categoryName);
        const category = categoryName
          ? categoryByName.get(categoryName.toLowerCase())
          : undefined;
        if (categoryName && !category) {
          throw new BadRequestException(`Category "${categoryName}" was not found`);
        }

        const status = this.rowString(row.status).toUpperCase() || 'DRAFT';
        if (!['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) {
          throw new BadRequestException('status must be DRAFT, PUBLISHED, or ARCHIVED');
        }
        const currency = this.rowString(row.currency).toUpperCase() || 'NGN';
        if (currency.length !== 3) {
          throw new BadRequestException('currency must be a 3-letter code');
        }

        let imageUrls: string[] = [];
        const images = row.imageUrls ?? row.images;
        if (Array.isArray(images)) {
          imageUrls = images.map((image) => String(image).trim()).filter(Boolean);
        } else if (typeof images === 'string' && images.trim()) {
          imageUrls = images.split('|').map((image) => image.trim()).filter(Boolean);
        }
        if (imageUrls.length > 10) {
          throw new BadRequestException('A product can have at most 10 images');
        }
        if (imageUrls.some((url) => !/^https?:\/\/\S+$/i.test(url))) {
          throw new BadRequestException('imageUrls must contain valid http(s) URLs');
        }

        let variants = row.variants;
        if (typeof variants === 'string' && variants.trim()) {
          try {
            variants = JSON.parse(variants);
          } catch {
            throw new BadRequestException('variants must be valid JSON');
          }
        }
        if (variants !== undefined && variants !== '') {
          if (!Array.isArray(variants)) {
            throw new BadRequestException('variants must be a JSON array');
          }
          variants = variants.map((variant) => {
            if (!variant || typeof variant !== 'object' || Array.isArray(variant)) {
              throw new BadRequestException('Each variant must be an object');
            }
            const value = variant as Record<string, unknown>;
            const variantName = this.rowString(value.name);
            if (!variantName) {
              throw new BadRequestException('Each variant needs a name');
            }
            const quantity =
              value.inventoryQuantity === undefined ||
              value.inventoryQuantity === ''
                ? 0
                : this.rowNumber(value.inventoryQuantity, 'variant inventoryQuantity');
            if (!Number.isInteger(quantity)) {
              throw new BadRequestException(
                'variant inventoryQuantity must be a whole number',
              );
            }
            const variantPrice =
              value.price === undefined || value.price === ''
                ? undefined
                : this.rowNumber(value.price, 'variant price');
            return {
              name: variantName,
              sku: this.rowString(value.sku) || undefined,
              price: variantPrice,
              inventoryQuantity: quantity,
            };
          });
        }

        await this.createProduct(tenantId, {
          name,
          slug: this.rowString(row.slug) || undefined,
          description: this.rowString(row.description) || undefined,
          price,
          currency,
          status: ProductStatus[status as keyof typeof ProductStatus],
          categoryId: category?.id,
          inventoryQuantity,
          imageUrls,
          variants: variants as
            | {
                name: string;
                sku?: string;
                price?: number;
                inventoryQuantity: number;
              }[]
            | undefined,
        });
        imported += 1;
      } catch (error) {
        if (!(error instanceof HttpException)) throw error;
        errors.push({
          row: index + 2,
          message: error.message,
        });
      }
    }

    return { imported, failed: errors.length, errors };
  }

  async createImageUploadSignature(tenantId: string) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      throw new ServiceUnavailableException(
        'Cloudinary image uploads are not configured',
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = `ecommerce-platform/${tenantId}/products`;
    const allowedFormats = 'jpg,png,webp,gif';
    const signature = createHmac('sha1', apiSecret)
      .update(
        `allowed_formats=${allowedFormats}&folder=${folder}&timestamp=${timestamp}`,
      )
      .digest('hex');
    return { cloudName, apiKey, timestamp, folder, allowedFormats, signature };
  }

  async seedSampleData(tenantId: string) {
    const samples = [
      {
        categoryName: 'Accessories',
        categorySlug: 'sample-accessories',
        name: 'Everyday Tote',
        slug: 'sample-everyday-tote',
        price: 8500,
        inventoryQuantity: 24,
        variant: { name: 'Natural', sku: 'SAMPLE-TOTE-NATURAL', inventoryQuantity: 12 },
      },
      {
        categoryName: 'Apparel',
        categorySlug: 'sample-apparel',
        name: 'Classic Cotton Tee',
        slug: 'sample-classic-cotton-tee',
        price: 12000,
        inventoryQuantity: 18,
        variant: { name: 'Black / M', sku: 'SAMPLE-TEE-BLACK-M', inventoryQuantity: 8 },
      },
      {
        categoryName: 'Home',
        categorySlug: 'sample-home',
        name: 'Stoneware Mug',
        slug: 'sample-stoneware-mug',
        price: 6500,
        inventoryQuantity: 30,
        variant: { name: 'Cream', sku: 'SAMPLE-MUG-CREAM', inventoryQuantity: 15 },
      },
    ];
    let created = 0;

    for (const sample of samples) {
      let category = await this.prisma.category.findUnique({
        where: { tenantId_slug: { tenantId, slug: sample.categorySlug } },
      });
      if (!category) {
        category = await this.createCategory(tenantId, {
          name: sample.categoryName,
          slug: sample.categorySlug,
        });
      }

      const existing = await this.prisma.product.findUnique({
        where: { tenantId_slug: { tenantId, slug: sample.slug } },
      });
      if (existing) continue;

      await this.createProduct(tenantId, {
        name: sample.name,
        slug: sample.slug,
        price: sample.price,
        currency: 'NGN',
        status: 'DRAFT',
        categoryId: category.id,
        inventoryQuantity: sample.inventoryQuantity,
        variants: [sample.variant],
      });
      created += 1;
    }

    return { created };
  }

  private rowString(value: unknown): string {
    return typeof value === 'string' || typeof value === 'number'
      ? String(value).trim()
      : '';
  }

  private rowNumber(value: unknown, field: string): number {
    if (typeof value === 'string' && !value.trim()) {
      throw new BadRequestException(`${field} is required`);
    }
    const number = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(number) || number < 0) {
      throw new BadRequestException(`${field} must be a non-negative number`);
    }
    return number;
  }

  private findCategory(tenantId: string, categoryId: string) {
    return this.prisma.category
      .findUnique({
        where: { tenantId_id: { tenantId, id: categoryId } },
      })
      .then((category) => {
        if (!category) {
          throw new NotFoundException('Category not found');
        }
        return category;
      });
  }

  private findProduct(tenantId: string, productId: string) {
    return this.prisma.product
      .findUnique({
        where: { tenantId_id: { tenantId, id: productId } },
        include: { category: true, variants: true },
      })
      .then((product) => {
        if (!product) {
          throw new NotFoundException('Product not found');
        }
        return product;
      });
  }

  private handleUniqueError(error: unknown): never {
    if (
      (error instanceof Prisma.PrismaClientKnownRequestError ||
        typeof error === 'object') &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('That name, slug, or SKU is already in use');
    }
    throw error;
  }

  private slugify(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
