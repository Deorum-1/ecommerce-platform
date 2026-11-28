import { Module } from '@nestjs/common';
import { ClerkModule } from '../clerk/clerk.module';
import { DatabaseModule } from '../database/database.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';

@Module({
  imports: [ClerkModule, DatabaseModule, TenancyModule],
  controllers: [CatalogController],
  providers: [CatalogService],
})
export class CatalogModule {}
