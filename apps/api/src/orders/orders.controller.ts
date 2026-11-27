import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClerkAuthGuard } from '../clerk/clerk-auth.guard';
import { Roles } from '../tenancy/roles.decorator';
import { RolesGuard } from '../tenancy/roles.guard';
import { TenantGuard } from '../tenancy/tenant.guard';
import type { TenantRequest } from '../tenancy/tenant-request.interface';
import { UpdateOrderStatusDto } from './update-order-status.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(ClerkAuthGuard, TenantGuard)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  list(@Req() request: TenantRequest) {
    return this.orders.listOrders(request.tenantId!);
  }

  @Get(':orderId')
  get(@Param('orderId') orderId: string, @Req() request: TenantRequest) {
    return this.orders.getOrder(request.tenantId!, orderId);
  }

  @Patch(':orderId/status')
  @UseGuards(RolesGuard)
  @Roles('org:admin')
  updateStatus(
    @Param('orderId') orderId: string,
    @Body() dto: UpdateOrderStatusDto,
    @Req() request: TenantRequest,
  ) {
    return this.orders.updateOrderStatus(
      request.tenantId!,
      orderId,
      dto.status,
    );
  }
}
