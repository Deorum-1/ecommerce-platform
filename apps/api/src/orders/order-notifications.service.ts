import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

export type OrderNotification = {
  id: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  total: string;
  currency: string;
  items: {
    productName: string | null;
    variantName: string | null;
    quantity: number;
    unitPrice: string;
  }[];
};

@Injectable()
export class OrderNotificationsService {
  private readonly logger = new Logger(OrderNotificationsService.name);

  constructor(private readonly config: ConfigService) {}

  orderPlaced(order: OrderNotification): void {
    this.schedule('order placed', order, [
      [
        'Termii SMS',
        () =>
          this.sendSms(
            order,
            `We received order ${order.id}. Payment is pending.`,
          ),
      ],
    ]);
  }

  orderPaid(order: OrderNotification): void {
    this.schedule('order paid', order, [
      ['SMTP email', () => this.sendEmail(order)],
      [
        'Termii SMS',
        () =>
          this.sendSms(
            order,
            `Payment received for order ${order.id}. Thank you!`,
          ),
      ],
    ]);
  }

  private schedule(
    event: string,
    order: OrderNotification,
    notifications: [string, () => Promise<void>][],
  ): void {
    for (const [channel, send] of notifications) {
      void send().catch((error: unknown) => {
        const detail = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(
          `${channel} ${event} notification failed for order ${order.id}: ${detail}`,
        );
      });
    }
  }

  private async sendEmail(order: OrderNotification): Promise<void> {
    if (!order.customerEmail) return;

    const host = this.config.get<string>('SMTP_HOST');
    const from = this.config.get<string>('SMTP_FROM');
    if (!host || !from) {
      this.logger.warn(
        'SMTP is not configured; order confirmation email was skipped.',
      );
      return;
    }

    const port = Number(this.config.get<string>('SMTP_PORT') || '587');
    const user = this.config.get<string>('SMTP_USER');
    const password = this.config.get<string>('SMTP_PASSWORD');
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      ...(user && password ? { auth: { user, pass: password } } : {}),
    });
    const lines = order.items.map((item) => {
      const variant = item.variantName ? ` (${item.variantName})` : '';
      return `${item.quantity} × ${item.productName || 'Product'}${variant} — ${order.currency} ${item.unitPrice}`;
    });

    await transporter.sendMail({
      from,
      to: order.customerEmail,
      subject: `Order ${order.id} confirmed`,
      text: [
        `Hello ${order.customerName || 'there'},`,
        '',
        `Your payment is confirmed. Order ${order.id} is being prepared.`,
        ...lines,
        '',
        `Total: ${order.currency} ${order.total}`,
      ].join('\n'),
    });
  }

  private async sendSms(
    order: OrderNotification,
    message: string,
  ): Promise<void> {
    if (!order.customerPhone) return;

    const apiKey = this.config.get<string>('TERMII_API_KEY');
    const senderId = this.config.get<string>('TERMII_SENDER_ID');
    if (!apiKey || !senderId) {
      this.logger.warn('Termii is not configured; order SMS was skipped.');
      return;
    }

    const response = await fetch('https://api.ng.termii.com/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        to: this.normalizePhone(order.customerPhone),
        from: senderId,
        sms: message,
        type: 'plain',
        channel: 'generic',
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      throw new Error(`Termii returned HTTP ${response.status}`);
    }
  }

  private normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    return digits.startsWith('0') ? `234${digits.slice(1)}` : digits;
  }
}
