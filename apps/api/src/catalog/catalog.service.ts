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
      where: {
        tenantId,
        products: { some: { status: { not: 'ARCHIVED' } } },
      },
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
      where: { tenantId, status: { not: 'ARCHIVED' } },
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
    const importedSlugs = new Set<string>();
    let imported = 0;

    for (const [index, row] of rows.entries()) {
      try {
        if (!row || typeof row !== 'object' || Array.isArray(row)) {
          throw new BadRequestException('Row must contain product fields');
        }

      const productRow = this.normalizeImportRow(row);
      const name = this.rowString(productRow.name);
      const price = this.rowNumber(productRow.price, 'price');
        const inventoryQuantity =
        productRow.inventoryQuantity === undefined ||
        productRow.inventoryQuantity === ''
            ? 0
          : this.rowNumber(productRow.inventoryQuantity, 'inventoryQuantity');
        if (!Number.isInteger(inventoryQuantity)) {
          throw new BadRequestException('inventoryQuantity must be a whole number');
        }
        if (!name) {
          throw new BadRequestException('name is required');
        }
        if (name.length > 180) {
          throw new BadRequestException('name must be 180 characters or fewer');
        }

        const categoryName = this.rowString(
          productRow.category ?? productRow.categoryName,
        );
        const status = this.normalizeImportStatus(productRow.status);
        const currency =
          this.rowString(productRow.currency).toUpperCase() || 'NGN';
        if (currency.length !== 3) {
          throw new BadRequestException('currency must be a 3-letter code');
        }

        let imageUrls: string[] = [];
        const images = productRow.imageUrls ?? productRow.images;
        if (Array.isArray(images)) {
          imageUrls = images.map((image) => String(image).trim()).filter(Boolean);
        } else if (typeof images === 'string' && images.trim()) {
          imageUrls = images
            .split(/[|;,\r\n]+/)
            .map((image) => image.trim())
            .filter(Boolean);
        }
        if (imageUrls.length > 10) {
          throw new BadRequestException('A product can have at most 10 images');
        }
        if (imageUrls.some((url) => !/^https?:\/\/\S+$/i.test(url))) {
          throw new BadRequestException('imageUrls must contain valid http(s) URLs');
        }

        let variants = productRow.variants;
        if (typeof variants === 'string') {
          if (variants.trim()) {
            try {
              variants = JSON.parse(variants);
            } catch {
              throw new BadRequestException('variants must be valid JSON');
            }
          } else {
            variants = undefined;
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
            const value = this.normalizeImportRow(
              variant as Record<string, unknown>,
            );
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

        const categoryKey = categoryName.toLowerCase();
        let category = categoryKey
          ? categoryByName.get(categoryKey)
          : undefined;
        if (categoryName && !category) {
          category = await this.createCategory(tenantId, { name: categoryName });
          categoryByName.set(categoryKey, category);
        }

        const importSlug = this.slugify(
          this.rowString(productRow.slug) || name,
        );
        importedSlugs.add(importSlug);
        const existingProduct = await this.prisma.product.findUnique({
          where: { tenantId_slug: { tenantId, slug: importSlug } },
        });
        const productData: CreateProductDto = {
          name,
          slug: this.rowString(productRow.slug) || undefined,
          description: this.rowString(productRow.description) || undefined,
          price,
          currency,
          status,
          categoryId: category?.id,
          inventoryQuantity,
          imageUrls,
          variants: Array.isArray(variants)
            ? (variants as CreateProductDto['variants'])
            : undefined,
        };

        if (existingProduct) {
          const update: UpdateProductDto = {
            name,
            slug: this.rowString(productRow.slug) || existingProduct.slug,
            price,
            ...(Object.hasOwn(productRow, 'description')
              ? { description: this.rowString(productRow.description) }
              : {}),
            categoryId: category?.id ?? null,
            ...(this.rowString(productRow.currency)
              ? { currency }
              : {}),
            ...(this.rowString(productRow.status)
              ? { status }
              : {}),
            ...(Object.hasOwn(productRow, 'inventoryQuantity')
              ? { inventoryQuantity }
              : {}),
            ...(Object.hasOwn(productRow, 'imageUrls') ? { imageUrls } : {}),
            ...(Array.isArray(variants)
              ? { variants: variants as CreateProductDto['variants'] }
              : {}),
          };
          await this.updateProduct(tenantId, existingProduct.id, update);
        } else {
          await this.createProduct(tenantId, productData);
        }
        imported += 1;
      } catch (error) {
        if (!(error instanceof HttpException)) throw error;
        errors.push({
          row: index + 2,
          message: error.message,
        });
      }
    }

    if (errors.length === 0) {
      const existingProducts = await this.prisma.product.findMany({
        where: { tenantId },
        select: {
          id: true,
          slug: true,
          _count: { select: { orderItems: true } },
        },
      });
      const staleProducts = existingProducts.filter(
        (product) => !importedSlugs.has(product.slug),
      );
      const productsToArchive = staleProducts
        .filter((product) => product._count.orderItems > 0)
        .map((product) => product.id);
      const productsToDelete = staleProducts
        .filter((product) => product._count.orderItems === 0)
        .map((product) => product.id);

      if (productsToArchive.length > 0 || productsToDelete.length > 0) {
        await this.prisma.$transaction(async (transaction) => {
          if (productsToArchive.length > 0) {
            await transaction.product.updateMany({
              where: { tenantId, id: { in: productsToArchive } },
              data: { status: 'ARCHIVED' },
            });
          }
          if (productsToDelete.length > 0) {
            await transaction.product.deleteMany({
              where: { tenantId, id: { in: productsToDelete } },
            });
          }
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

  private rowString(value: unknown): string {
    return typeof value === 'string' || typeof value === 'number'
      ? String(value).trim()
      : '';
  }

  private normalizeImportStatus(value: unknown): ProductStatus {
    if (value === true) return ProductStatus.PUBLISHED;
    if (value === false) return ProductStatus.DRAFT;

    const status = this.rowString(value)
      .toUpperCase()
      .replace(/[\s_-]+/g, ' ');
    const aliases: Record<string, ProductStatus> = {
      DRAFT: ProductStatus.DRAFT,
      PENDING: ProductStatus.DRAFT,
      INACTIVE: ProductStatus.DRAFT,
      DISABLED: ProductStatus.DRAFT,
      HIDDEN: ProductStatus.DRAFT,
      UNPUBLISHED: ProductStatus.DRAFT,
      FALSE: ProductStatus.DRAFT,
      NO: ProductStatus.DRAFT,
      '0': ProductStatus.DRAFT,
      PUBLISHED: ProductStatus.PUBLISHED,
      PUBLISH: ProductStatus.PUBLISHED,
      ACTIVE: ProductStatus.PUBLISHED,
      ENABLED: ProductStatus.PUBLISHED,
      LIVE: ProductStatus.PUBLISHED,
      AVAILABLE: ProductStatus.PUBLISHED,
      YES: ProductStatus.PUBLISHED,
      TRUE: ProductStatus.PUBLISHED,
      '1': ProductStatus.PUBLISHED,
      ARCHIVE: ProductStatus.ARCHIVED,
      ARCHIVED: ProductStatus.ARCHIVED,
      DISCONTINUED: ProductStatus.ARCHIVED,
    };

    if (!status) return ProductStatus.DRAFT;
    const normalized = aliases[status];
    if (normalized) return normalized;

    throw new BadRequestException(
      `status "${this.rowString(value)}" must be DRAFT, PUBLISHED, or ARCHIVED`,
    );
  }

  private normalizeImportRow(
    row: Record<string, unknown>,
  ): Record<string, unknown> {
    const aliases: Record<string, string> = {
      name: 'name',
      product: 'name',
      productname: 'name',
      producttitle: 'name',
      item: 'name',
      itemname: 'name',
      title: 'name',
      price: 'price',
      unitprice: 'price',
      sellingprice: 'price',
      saleprice: 'price',
      retailprice: 'price',
      regularprice: 'price',
      productprice: 'price',
      itemprice: 'price',
      amount: 'price',
      currency: 'currency',
      currencycode: 'currency',
      status: 'status',
      productstatus: 'status',
      published: 'status',
      publishedstatus: 'status',
      publicationstatus: 'status',
      availability: 'status',
      availabilitystatus: 'status',
      visibility: 'status',
      description: 'description',
      productdescription: 'description',
      details: 'description',
      slug: 'slug',
      producthandle: 'slug',
      handle: 'slug',
      category: 'category',
      categoryname: 'category',
      productcategory: 'category',
      type: 'category',
      producttype: 'category',
      inventoryquantity: 'inventoryQuantity',
      quantity: 'inventoryQuantity',
      qty: 'inventoryQuantity',
      stock: 'inventoryQuantity',
      stockquantity: 'inventoryQuantity',
      stockqty: 'inventoryQuantity',
      stocklevel: 'inventoryQuantity',
      availablestock: 'inventoryQuantity',
      availablequantity: 'inventoryQuantity',
      quantityavailable: 'inventoryQuantity',
      onhandquantity: 'inventoryQuantity',
      imageurls: 'imageUrls',
      image: 'imageUrls',
      imageurl: 'imageUrls',
      imagesrc: 'imageUrls',
      productimageurl: 'imageUrls',
      images: 'imageUrls',
      photourl: 'imageUrls',
      photos: 'imageUrls',
      variants: 'variants',
      sku: 'sku',
      variantname: 'name',
      variantprice: 'price',
      variantsku: 'sku',
      variantquantity: 'inventoryQuantity',
      variantinventoryqty: 'inventoryQuantity',
      variantinventoryquantity: 'inventoryQuantity',
    };
    const normalized: Record<string, unknown> = {};

    for (const [field, value] of Object.entries(row)) {
      const key = field.toLowerCase().replace(/[^a-z0-9]/g, '');
      const normalizedField = aliases[key] || field;
      const currentValue = normalized[normalizedField];
      const currentIsEmpty =
        currentValue === undefined ||
        currentValue === null ||
        (typeof currentValue === 'string' && currentValue.trim() === '');
      const nextIsEmpty =
        value === undefined ||
        value === null ||
        (typeof value === 'string' && value.trim() === '');

      if (
        !(normalizedField in normalized) ||
        (currentIsEmpty && !nextIsEmpty)
      ) {
        normalized[normalizedField] = value;
      }
    }

    return normalized;
  }

  private rowNumber(value: unknown, field: string): number {
    if (typeof value === 'string' && !value.trim()) {
      throw new BadRequestException(`${field} is required`);
    }
    const number =
      typeof value === 'number'
        ? value
        : Number(this.normalizeImportNumber(String(value)));
    if (!Number.isFinite(number) || number < 0) {
      throw new BadRequestException(`${field} must be a non-negative number`);
    }
    return number;
  }

  private normalizeImportNumber(value: string): string {
    const cleaned = value
      .trim()
      .replace(/^[A-Z]{3}\s*/i, '')
      .replace(/\s*[A-Z]{3}$/i, '')
      .replace(/[\p{Sc}\s\u00a0\u202f]/gu, '');
    const commaIndex = cleaned.lastIndexOf(',');
    const dotIndex = cleaned.lastIndexOf('.');
    const decimalIndex = Math.max(commaIndex, dotIndex);

    if (decimalIndex < 0) return cleaned;

    const fraction = cleaned.slice(decimalIndex + 1);
    const hasBothSeparators = commaIndex >= 0 && dotIndex >= 0;
    if (!hasBothSeparators && fraction.length === 3) {
      const groups = cleaned.split(/[,.]/);
      const standardGrouping =
        groups[0].length <= 3 &&
        groups.slice(1).every((group) => group.length === 3);
      const indianGrouping =
        groups.length > 2 &&
        groups[0].length <= 3 &&
        groups.slice(1, -1).every((group) => group.length === 2) &&
        groups.at(-1)?.length === 3;
      if (standardGrouping || indianGrouping) return groups.join('');
    }

    const whole = cleaned.slice(0, decimalIndex).replace(/[,.]/g, '');
    const decimals = fraction.replace(/[,.]/g, '');
    return `${whole}.${decimals}`;
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
