import { Module } from '@nestjs/common';
import { ClerkModule } from '../clerk/clerk.module';
import { DatabaseModule } from '../database/database.module';
import { TenancyModule } from './tenancy.module';
import { TenantMembersController } from './tenant-members.controller';
import { TenantMembersService } from './tenant-members.service';

@Module({
  imports: [ClerkModule, DatabaseModule, TenancyModule],
  controllers: [TenantMembersController],
  providers: [TenantMembersService],
})
export class TenantMembersModule {}
