import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import type { TenantRequest } from './tenant-request.interface';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<TenantRequest>();
    const user = request.user;
    const organizationId = user?.organizationId;

    if (!user || !organizationId) {
      throw new ForbiddenException('An active Clerk organization is required');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { clerkOrganizationId: organizationId },
      select: { id: true },
    });

    if (!tenant) {
      throw new ForbiddenException('This organization has no registered store');
    }

    request.tenantId = tenant.id;
    user.tenantId = tenant.id;
    return true;
  }
}
