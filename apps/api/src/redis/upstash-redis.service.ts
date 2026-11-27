import { ServiceUnavailableException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from '@upstash/redis';

@Injectable()
export class UpstashRedisService {
  private redis?: Redis;

  constructor(private readonly configService: ConfigService) {}

  get client(): Redis {
    if (!this.redis) {
      const url = this.configService.get<string>('UPSTASH_REDIS_REST_URL');
      const token = this.configService.get<string>('UPSTASH_REDIS_REST_TOKEN');

      if (!url || !token) {
        throw new ServiceUnavailableException(
          'Upstash Redis is not configured',
        );
      }

      this.redis = new Redis({ url, token });
    }

    return this.redis;
  }
}
