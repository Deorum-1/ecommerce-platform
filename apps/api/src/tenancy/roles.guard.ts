import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import type { TenantRequest } from './tenant-request.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<TenantRequest>();
    if (!request.user?.organizationRole) {
      throw new ForbiddenException('An organization role is required');
    }

    if (!roles.includes(request.user.organizationRole)) {
      throw new ForbiddenException('You do not have permission to do this');
    }

    return true;
  }
}
