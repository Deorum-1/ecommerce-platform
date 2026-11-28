import {
  Body,
  Controller,
  Delete,
  Get,
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
import { AdminService } from './admin.service';
import { CreateDiscountDto } from './create-discount.dto';
import { UpdateDiscountDto } from './update-discount.dto';
import { UpdateStoreSettingsDto } from './update-store-settings.dto';

@Controller('admin')
@UseGuards(ClerkAuthGuard, TenantGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('overview')
  overview(@Req() req: TenantRequest) {
    return this.admin.overview(req.tenantId!);
  }

  @Get('analytics')
  analytics(@Req() req: TenantRequest) {
    return this.admin.analytics(req.tenantId!);
  }

  @Get('customers')
  customers(@Req() req: TenantRequest) {
    return this.admin.listCustomers(req.tenantId!);
  }

  @Get('discounts')
  discounts(@Req() req: TenantRequest) {
    return this.admin.listDiscounts(req.tenantId!);
  }

  @Post('discounts')
  @UseGuards(RolesGuard)
  @Roles('org:admin')
  createDiscount(@Body() dto: CreateDiscountDto, @Req() req: TenantRequest) {
    return this.admin.createDiscount(req.tenantId!, dto);
  }

  @Patch('discounts/:id')
  @UseGuards(RolesGuard)
  @Roles('org:admin')
  updateDiscount(
    @Param('id') id: string,
    @Body() dto: UpdateDiscountDto,
    @Req() req: TenantRequest,
  ) {
    return this.admin.updateDiscount(req.tenantId!, id, dto);
  }

  @Delete('discounts/:id')
  @UseGuards(RolesGuard)
  @Roles('org:admin')
  deleteDiscount(@Param('id') id: string, @Req() req: TenantRequest) {
    return this.admin.deleteDiscount(req.tenantId!, id);
  }

  @Get('settings')
  settings(@Req() req: TenantRequest) {
    return this.admin.getSettings(req.tenantId!);
  }

  @Patch('settings')
  @UseGuards(RolesGuard)
  @Roles('org:admin')
  updateSettings(
    @Body() dto: UpdateStoreSettingsDto,
    @Req() req: TenantRequest,
  ) {
    return this.admin.updateSettings(req.tenantId!, dto);
  }
}
