import { Module } from '@nestjs/common';
import { ClerkModule } from '../clerk/clerk.module';
import { DatabaseModule } from '../database/database.module';
import { TenancyModule } from './tenancy.module';
import { TenantInvitationsController } from './tenant-invitations.controller';
import { TenantInvitationsService } from './tenant-invitations.service';

@Module({
  imports: [ClerkModule, DatabaseModule, TenancyModule],
  controllers: [TenantInvitationsController],
  providers: [TenantInvitationsService],
})
export class TenantInvitationsModule {}
