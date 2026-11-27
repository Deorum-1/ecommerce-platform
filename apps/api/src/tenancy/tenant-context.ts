import {
  Inject,
  Injectable,
  Scope,
  UnauthorizedException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { TenantRequest } from './tenant-request.interface';

@Injectable({ scope: Scope.REQUEST })
export class TenantContext {
  constructor(@Inject(REQUEST) private readonly request: TenantRequest) {}

  get tenantId(): string {
    if (!this.request.tenantId) {
      throw new UnauthorizedException('Tenant scope has not been established');
    }

    return this.request.tenantId;
  }
}
