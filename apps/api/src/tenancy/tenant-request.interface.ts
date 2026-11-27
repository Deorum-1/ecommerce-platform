import { Request } from 'express';

export interface TenantRequest extends Request {
  user?: {
    userId: string;
    organizationId?: string;
    organizationRole?: string;
    tenantId?: string;
  };
  tenantId?: string;
}
