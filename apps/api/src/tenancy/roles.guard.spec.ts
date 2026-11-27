import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import type { TenantRequest } from './tenant-request.interface';

class StaffController {
  @Roles('org:admin')
  invite(this: void) {}
}

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());

  function executionContext(organizationRole: string): ExecutionContext {
    const request: Partial<TenantRequest> = {
      user: { userId: 'user-123', organizationRole },
    };

    return new ExecutionContextHost(
      [request],
      StaffController,
      StaffController.prototype.invite,
    );
  }

  it('allows owners to perform owner-only actions', () => {
    expect(guard.canActivate(executionContext('org:admin'))).toBe(true);
  });

  it('denies staff access to owner-only actions', () => {
    expect(() => guard.canActivate(executionContext('org:member'))).toThrow(
      ForbiddenException,
    );
  });
});
