import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/backend';
import type { TenantRequest } from '../tenancy/tenant-request.interface';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<TenantRequest>();
    const authorization = request.headers.authorization;
    const match =
      typeof authorization === 'string'
        ? /^Bearer\s+(\S+)$/i.exec(authorization)
        : null;

    if (!match) {
      throw new UnauthorizedException('A Clerk bearer token is required');
    }

    const token = await verifyToken(match[1], {
      secretKey: this.configService.getOrThrow<string>('CLERK_SECRET_KEY'),
      authorizedParties: [this.configService.getOrThrow<string>('ADMIN_URL')],
    });

    const claims = token.data;
    if (
      !claims ||
      typeof claims !== 'object' ||
      !('sub' in claims) ||
      typeof claims.sub !== 'string'
    ) {
      throw new UnauthorizedException('The Clerk session token is invalid');
    }

    request.user = {
      userId: claims.sub,
      organizationId:
        'org_id' in claims && typeof claims.org_id === 'string'
          ? claims.org_id
          : undefined,
      organizationRole:
        'org_role' in claims && typeof claims.org_role === 'string'
          ? claims.org_role
          : undefined,
    };

    return true;
  }
}
