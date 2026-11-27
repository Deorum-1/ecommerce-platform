import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClerkClient } from '@clerk/backend';

@Injectable()
export class ClerkService {
  private clerkClient?: ReturnType<typeof createClerkClient>;

  constructor(private readonly configService: ConfigService) {}

  get client(): ReturnType<typeof createClerkClient> {
    this.clerkClient ??= createClerkClient({
      secretKey: this.configService.getOrThrow<string>('CLERK_SECRET_KEY'),
    });

    return this.clerkClient;
  }
}
