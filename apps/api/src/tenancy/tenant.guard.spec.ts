import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import { TenantGuard } from './tenant.guard';
import type { TenantRequest } from './tenant-request.interface';

describe('TenantGuard', () => {
  let guard: TenantGuard;
  let request: Partial<TenantRequest>;
  let findTenant: jest.Mock;

  beforeEach(async () => {
    findTenant = jest.fn().mockResolvedValue({ id: 'tenant-123' });
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantGuard,
        {
          provide: PrismaService,
          useValue: { tenant: { findUnique: findTenant } },
        },
      ],
    }).compile();

    guard = module.get<TenantGuard>(TenantGuard);
    request = {};
  });

  function executionContext(): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
  }

  it('resolves the verified Clerk organization to a tenant', async () => {
    request.user = {
      userId: 'user-123',
      organizationId: 'org-123',
      organizationRole: 'org:admin',
    };

    await expect(guard.canActivate(executionContext())).resolves.toBe(true);
    expect(findTenant).toHaveBeenCalledWith({
      where: { clerkOrganizationId: 'org-123' },
      select: { id: true },
    });
    expect(request.tenantId).toBe('tenant-123');
    expect(request.user.tenantId).toBe('tenant-123');
  });

  it('rejects authenticated requests without an active organization', async () => {
    request.user = { userId: 'user-123' };

    await expect(guard.canActivate(executionContext())).rejects.toThrow(
      ForbiddenException,
    );
    expect(findTenant).not.toHaveBeenCalled();
  });

  it('rejects organizations that are not linked to a tenant', async () => {
    request.user = { userId: 'user-123', organizationId: 'org-unknown' };
    findTenant.mockResolvedValue(null);

    await expect(guard.canActivate(executionContext())).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('does not trust a tenant id supplied outside the verified identity', async () => {
    request.tenantId = 'tenant-from-request';

    await expect(guard.canActivate(executionContext())).rejects.toThrow(
      ForbiddenException,
    );
    expect(findTenant).not.toHaveBeenCalled();
  });
});
