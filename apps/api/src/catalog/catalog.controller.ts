import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClerkAuthGuard } from '../clerk/clerk-auth.guard';
import { Roles } from '../tenancy/roles.decorator';
import { RolesGuard } from '../tenancy/roles.guard';
import { TenantGuard } from '../tenancy/tenant.guard';
import type { TenantRequest } from '../tenancy/tenant-request.interface';
import { CatalogService } from './catalog.service';
import { CreateCategoryDto } from './create-category.dto';
import { UpdateCategoryDto } from './update-category.dto';
import { CreateProductDto } from './create-product.dto';
import { UpdateProductDto } from './update-product.dto';

@Controller('catalog')
@UseGuards(ClerkAuthGuard, TenantGuard)
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('categories')
  listCategories(@Req() request: TenantRequest) {
    return this.catalog.listCategories(request.tenantId!);
  }

  @Post('categories')
  @UseGuards(RolesGuard)
  @Roles('org:admin')
  createCategory(
    @Body() dto: CreateCategoryDto,
    @Req() request: TenantRequest,
  ) {
    return this.catalog.createCategory(request.tenantId!, dto);
  }

  @Patch('categories/:categoryId')
  @UseGuards(RolesGuard)
  @Roles('org:admin')
  updateCategory(
    @Param('categoryId') categoryId: string,
    @Body() dto: UpdateCategoryDto,
    @Req() request: TenantRequest,
  ) {
    return this.catalog.updateCategory(request.tenantId!, categoryId, dto);
  }

  @Delete('categories/:categoryId')
  @UseGuards(RolesGuard)
  @Roles('org:admin')
  deleteCategory(
    @Param('categoryId') categoryId: string,
    @Req() request: TenantRequest,
  ) {
    return this.catalog.deleteCategory(request.tenantId!, categoryId);
  }

  @Get('products')
  listProducts(@Req() request: TenantRequest) {
    return this.catalog.listProducts(request.tenantId!);
  }

  @Get('products/:productId')
  getProduct(
    @Param('productId') productId: string,
    @Req() request: TenantRequest,
  ) {
    return this.catalog.getProduct(request.tenantId!, productId);
  }

  @Post('products')
  @UseGuards(RolesGuard)
  @Roles('org:admin')
  createProduct(
    @Body() dto: CreateProductDto,
    @Req() request: TenantRequest,
  ) {
    return this.catalog.createProduct(request.tenantId!, dto);
  }

  @Post('products/import')
  @UseGuards(RolesGuard)
  @Roles('org:admin')
  importProducts(
    @Body() body: { rows: Record<string, unknown>[] },
    @Req() request: TenantRequest,
  ) {
    return this.catalog.importProducts(request.tenantId!, body.rows);
  }

  @Post('images/sign')
  @UseGuards(RolesGuard)
  @Roles('org:admin')
  signImageUpload(@Req() request: TenantRequest) {
    return this.catalog.createImageUploadSignature(request.tenantId!);
  }

  @Patch('products/:productId')
  @UseGuards(RolesGuard)
  @Roles('org:admin')
  updateProduct(
    @Param('productId') productId: string,
    @Body() dto: UpdateProductDto,
    @Req() request: TenantRequest,
  ) {
    return this.catalog.updateProduct(request.tenantId!, productId, dto);
  }

  @Delete('products/:productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles('org:admin')
  deleteProduct(
    @Param('productId') productId: string,
    @Req() request: TenantRequest,
  ) {
    return this.catalog.deleteProduct(request.tenantId!, productId);
  }
}
