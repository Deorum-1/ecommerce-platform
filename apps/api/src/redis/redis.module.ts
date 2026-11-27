import { Module } from '@nestjs/common';
import { UpstashRedisService } from './upstash-redis.service';

@Module({
  providers: [UpstashRedisService],
  exports: [UpstashRedisService],
})
export class RedisModule {}
