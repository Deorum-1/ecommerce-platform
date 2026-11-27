import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type PaystackTransaction = {
  reference: string;
  status: string;
  amount: number;
  currency: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

@Injectable()
export class PaystackService {
  constructor(private readonly config: ConfigService) {}

  async initialize(
    email: string,
    amount: number,
    reference: string,
    callbackUrl: string,
  ): Promise<string> {
    const data = await this.request('transaction/initialize', {
      email,
      amount,
      currency: 'NGN',
      reference,
      callback_url: callbackUrl,
    });

    if (
      !isRecord(data) ||
      typeof data.authorization_url !== 'string' ||
      typeof data.reference !== 'string' ||
      data.reference !== reference
    ) {
      throw new BadGatewayException(
        'Paystack returned an invalid checkout response',
      );
    }

    return data.authorization_url;
  }

  async verify(reference: string): Promise<PaystackTransaction> {
    const data = await this.request(
      `transaction/verify/${encodeURIComponent(reference)}`,
    );

    if (
      !isRecord(data) ||
      data.reference !== reference ||
      typeof data.status !== 'string' ||
      typeof data.amount !== 'number' ||
      typeof data.currency !== 'string'
    ) {
      throw new BadGatewayException(
        'Paystack returned an invalid verification response',
      );
    }

    return {
      reference: data.reference,
      status: data.status,
      amount: data.amount,
      currency: data.currency,
    };
  }

  private async request(
    path: string,
    body?: Record<string, string | number>,
  ): Promise<unknown> {
    const secretKey = this.config.getOrThrow<string>('PAYSTACK_SECRET_KEY');
    const response = await fetch(`https://api.paystack.co/${path}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(15_000),
    });

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new BadGatewayException('Paystack returned an unreadable response');
    }

    if (!response.ok || !isRecord(payload) || payload.status !== true) {
      throw new BadGatewayException(
        'Paystack could not process the payment request',
      );
    }

    return payload.data;
  }
}
