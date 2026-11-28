import {
  BadRequestException,
  Controller,
  Headers,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { OrdersService } from './orders.service';

@Controller('payments/paystack')
export class PaystackWebhookController {
  constructor(
    private readonly config: ConfigService,
    private readonly orders: OrdersService,
  ) {}

  @Post('webhook')
  async receive(
    @Headers('x-paystack-signature') signature: string | undefined,
    @Req() request: RawBodyRequest<Request>,
  ) {
    const secret = this.config.getOrThrow<string>('PAYSTACK_SECRET_KEY');
    const rawBody = request.rawBody;
    if (!signature || !rawBody || !/^[\da-f]{128}$/i.test(signature)) {
      throw new UnauthorizedException('Invalid Paystack webhook signature');
    }

    const expected = createHmac('sha512', secret).update(rawBody).digest();
    const received = Buffer.from(signature, 'hex');
    if (
      received.length !== expected.length ||
      !timingSafeEqual(received, expected)
    ) {
      throw new UnauthorizedException('Invalid Paystack webhook signature');
    }

    const body: unknown = request.body;
    if (
      typeof body !== 'object' ||
      body === null ||
      !('event' in body) ||
      typeof body.event !== 'string'
    ) {
      throw new BadRequestException('Invalid Paystack webhook payload');
    }
    if (body.event !== 'charge.success') return { received: true };

    if (
      !('data' in body) ||
      typeof body.data !== 'object' ||
      body.data === null ||
      !('reference' in body.data) ||
      typeof body.data.reference !== 'string'
    ) {
      throw new BadRequestException('Paystack webhook is missing a reference');
    }

    await this.orders.handlePaystackWebhook(body.data.reference);
    return { received: true };
  }
}
