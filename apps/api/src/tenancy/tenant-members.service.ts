import { randomBytes } from 'node:crypto';
import { ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClerkService } from '../clerk/clerk.service';

@Injectable()
export class TenantMembersService {
  constructor(
    private readonly clerk: ClerkService,
    private readonly configService: ConfigService,
  ) {}

  async createStaffAccount(
    organizationId: string,
    emailAddress: string,
    firstName: string,
    lastName: string,
  ) {
    const user = await this.clerk.client.users
      .createUser({
        emailAddress: [emailAddress],
        firstName,
        lastName,
        password: randomBytes(32).toString('base64url'),
      })
      .catch((error: unknown) => {
        if (isDuplicateEmailError(error)) {
          throw new ConflictException(
            'An account with this email address already exists.',
          );
        }
        throw error;
      });

    let membershipCreated = false;
    let signInTokenId: string | undefined;

    try {
      await this.clerk.client.organizations.createOrganizationMembership({
        organizationId,
        userId: user.id,
        role: 'org:member',
      });
      membershipCreated = true;

      const signInToken =
        await this.clerk.client.signInTokens.createSignInToken({
          userId: user.id,
          orgId: organizationId,
          expiresInSeconds: 24 * 60 * 60,
        });
      signInTokenId = signInToken.id;

      const adminUrl = this.configService.getOrThrow<string>('ADMIN_URL');

      return {
        id: user.id,
        emailAddress,
        role: 'org:member',
        setupUrl: `${adminUrl.replace(/\/+$/, '')}/account/setup#ticket=${encodeURIComponent(signInToken.token)}`,
      };
    } catch (error) {
      const cleanupErrors: unknown[] = [];

      if (signInTokenId) {
        try {
          await this.clerk.client.signInTokens.revokeSignInToken(signInTokenId);
        } catch (cleanupError) {
          cleanupErrors.push(cleanupError);
        }
      }
      if (membershipCreated) {
        try {
          await this.clerk.client.organizations.deleteOrganizationMembership({
            organizationId,
            userId: user.id,
          });
        } catch (cleanupError) {
          cleanupErrors.push(cleanupError);
        }
      }
      try {
        await this.clerk.client.users.deleteUser(user.id);
      } catch (cleanupError) {
        cleanupErrors.push(cleanupError);
      }

      if (cleanupErrors.length) {
        throw new AggregateError(
          [error, ...cleanupErrors],
          'Staff account creation failed and the new account could not be fully removed',
        );
      }

      throw error;
    }
  }
}

function isDuplicateEmailError(error: unknown): boolean {
  if (!isRecord(error) || !Array.isArray(error.errors)) {
    return false;
  }

  return error.errors.some(
    (item: unknown) =>
      isRecord(item) &&
      (item.code === 'form_identifier_exists' ||
        item.code === 'email_address_taken'),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
