import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { TenantContext } from './tenant-context';
import { TenantGuard } from './tenant.guard';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [DatabaseModule],
  providers: [TenantContext, TenantGuard, RolesGuard],
  exports: [TenantContext, TenantGuard, RolesGuard],
})
export class TenancyModule {}
