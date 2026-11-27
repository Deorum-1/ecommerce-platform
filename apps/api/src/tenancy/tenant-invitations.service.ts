import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClerkService } from '../clerk/clerk.service';

@Injectable()
export class TenantInvitationsService {
  constructor(
    private readonly clerk: ClerkService,
    private readonly configService: ConfigService,
  ) {}

  async inviteStaff(
    organizationId: string,
    inviterUserId: string,
    emailAddress: string,
  ) {
    const invitation =
      await this.clerk.client.organizations.createOrganizationInvitation({
        organizationId,
        emailAddress,
        role: 'org:member',
        inviterUserId,
        redirectUrl: `${this.configService.getOrThrow<string>('ADMIN_URL')}/dashboard`,
      });

    return {
      id: invitation.id,
      emailAddress: invitation.emailAddress,
      role: invitation.role,
      status: invitation.status,
    };
  }
}
