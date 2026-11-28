import { BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { PaystackService } from './paystack.service';

describe('PaystackService', () => {
  let service: PaystackService;
  let fetchSpy: jest.SpyInstance;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PaystackService,
        {
          provide: ConfigService,
          useValue: { getOrThrow: () => 'test-secret' },
        },
      ],
    }).compile();
    service = moduleRef.get(PaystackService);
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('initializes a checkout with the server-calculated amount and reference', async () => {
    fetchSpy.mockResolvedValue(
      new Response(
        JSON.stringify({
          status: true,
          data: {
            authorization_url: 'https://checkout.paystack.com/example',
            reference: 'order-reference',
          },
        }),
        { status: 200 },
      ),
    );

    await expect(
      service.initialize(
        'buyer@example.com',
        125000,
        'order-reference',
        'http://localhost:3000/checkout/complete',
      ),
    ).resolves.toBe('https://checkout.paystack.com/example');
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.paystack.co/transaction/initialize',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          email: 'buyer@example.com',
          amount: 125000,
          currency: 'NGN',
          reference: 'order-reference',
          callback_url: 'http://localhost:3000/checkout/complete',
        }),
      }),
    );
  });

  it('rejects a verification response for a different payment reference', async () => {
    fetchSpy.mockResolvedValue(
      new Response(
        JSON.stringify({
          status: true,
          data: {
            reference: 'another-order',
            status: 'success',
            amount: 125000,
            currency: 'NGN',
          },
        }),
        { status: 200 },
      ),
    );

    await expect(service.verify('order-reference')).rejects.toThrow(
      BadGatewayException,
    );
  });
});
