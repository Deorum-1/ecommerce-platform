import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { verifyToken } from '@clerk/backend';
import { Test, TestingModule } from '@nestjs/testing';
import { ClerkAuthGuard } from './clerk-auth.guard';
import type { TenantRequest } from '../tenancy/tenant-request.interface';

jest.mock('@clerk/backend', () => ({
  verifyToken: jest.fn(),
}));

describe('ClerkAuthGuard', () => {
  let guard: ClerkAuthGuard;
  const mockedVerifyToken = jest.mocked(verifyToken);

  beforeEach(async () => {
    mockedVerifyToken.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClerkAuthGuard,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) =>
              key === 'ADMIN_URL' ? 'http://localhost:3002' : 'test-secret',
            ),
          },
        },
      ],
    }).compile();

    guard = module.get(ClerkAuthGuard);
  });

  function executionContext(authorization?: string): ExecutionContext {
    const request = {
      headers: { authorization },
    } satisfies Pick<TenantRequest, 'headers'>;
    return new ExecutionContextHost([request]);
  }

  it('rejects requests without a Clerk bearer token', async () => {
    await expect(guard.canActivate(executionContext())).rejects.toThrow(
      UnauthorizedException,
    );
    expect(mockedVerifyToken).not.toHaveBeenCalled();
  });

  it('returns 401 when Clerk rejects a bearer token', async () => {
    mockedVerifyToken.mockRejectedValue(new Error('Token expired'));

    await expect(
      guard.canActivate(executionContext('Bearer expired-token')),
    ).rejects.toThrow(UnauthorizedException);
  });
});
