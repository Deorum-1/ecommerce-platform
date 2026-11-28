import { Module } from '@nestjs/common';
import { ClerkModule } from '../clerk/clerk.module';
import { DatabaseModule } from '../database/database.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { OrderNotificationsService } from './order-notifications.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PaystackService } from './paystack.service';
import { PaystackWebhookController } from './paystack-webhook.controller';
import { StorefrontController } from './storefront.controller';

@Module({
  imports: [DatabaseModule, ClerkModule, TenancyModule],
  controllers: [
    StorefrontController,
    OrdersController,
    PaystackWebhookController,
  ],
  providers: [OrdersService, PaystackService, OrderNotificationsService],
})
export class OrdersModule {}
