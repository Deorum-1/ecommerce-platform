import { Module } from '@nestjs/common';
import { ClerkModule } from '../clerk/clerk.module';
import { DatabaseModule } from '../database/database.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [DatabaseModule, ClerkModule, TenancyModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
