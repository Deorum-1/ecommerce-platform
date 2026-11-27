import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { Prisma } from '@repo/database';
import { ClerkService } from '../clerk/clerk.service';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clerk: ClerkService,
  ) {}

  async registerCompany(userId: string, name: string, requestedSlug?: string) {
    const companyName = name.trim();
    const slug = this.slugify(requestedSlug || companyName);

    if (!slug || slug.length > 48) {
      throw new BadRequestException('Enter a valid company name or slug');
    }

    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (existingTenant) {
      throw new ConflictException('That store address is already in use');
    }

    const organization =
      await this.clerk.client.organizations.createOrganization({
        name: companyName,
        createdBy: userId,
      });

    try {
      const tenant = await this.prisma.tenant.create({
        data: {
          name: companyName,
          slug,
          clerkOrganizationId: organization.id,
          members: {
            create: {
              clerkUserId: userId,
              role: 'OWNER',
            },
          },
        },
        select: { id: true, name: true, slug: true },
      });

      return {
        tenantId: tenant.id,
        organizationId: organization.id,
        name: tenant.name,
        slug: tenant.slug,
      };
    } catch (error) {
      try {
        await this.clerk.client.organizations.deleteOrganization(
          organization.id,
        );
      } catch (cleanupError) {
        throw new AggregateError(
          [error, cleanupError],
          'Tenant creation failed and the Clerk organization could not be removed',
        );
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('That store address is already in use');
      }

      throw error;
    }
  }

  private slugify(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
