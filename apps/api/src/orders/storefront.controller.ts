import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateCheckoutDto } from './create-checkout.dto';
import { OrdersService } from './orders.service';

@Controller('storefront')
export class StorefrontController {
  constructor(private readonly orders: OrdersService) {}

  @Get(':slug/products')
  listProducts(@Param('slug') slug: string) {
    return this.orders.listStoreProducts(slug);
  }

  @Post(':slug/orders')
  createCheckout(@Param('slug') slug: string, @Body() dto: CreateCheckoutDto) {
    return this.orders.createCheckout(slug, dto);
  }

  @Get('orders/:reference/verify')
  verifyPayment(@Param('reference') reference: string) {
    return this.orders.verifyPayment(reference);
  }
}
