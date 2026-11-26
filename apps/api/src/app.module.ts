import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ClerkModule } from './clerk/clerk.module';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { TenancyModule } from './tenancy/tenancy.module';
import { TenantInvitationsModule } from './tenancy/tenant-invitations.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../../.env' }),
    ClerkModule,
    AuthModule,
    DatabaseModule,
    RedisModule,
    TenancyModule,
    TenantInvitationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
