import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClerkService } from '../clerk/clerk.service';
import { PrismaService } from '../database/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let findTenant: jest.Mock;
  let createTenant: jest.Mock;
  let createOrganization: jest.Mock;
  let deleteOrganization: jest.Mock;

  beforeEach(async () => {
    findTenant = jest.fn().mockResolvedValue(null);
    createTenant = jest.fn().mockResolvedValue({
      id: 'tenant-123',
      name: 'Acme Shop',
      slug: 'acme-shop',
    });
    createOrganization = jest.fn().mockResolvedValue({ id: 'org-123' });
    deleteOrganization = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            tenant: { findUnique: findTenant, create: createTenant },
          },
        },
        {
          provide: ClerkService,
          useValue: {
            client: {
              organizations: { createOrganization, deleteOrganization },
            },
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('creates a Clerk organization and an owner tenant membership', async () => {
    await expect(
      service.registerCompany('user-123', 'Acme Shop'),
    ).resolves.toEqual({
      tenantId: 'tenant-123',
      organizationId: 'org-123',
      name: 'Acme Shop',
      slug: 'acme-shop',
    });

    expect(createOrganization).toHaveBeenCalledWith({
      name: 'Acme Shop',
      createdBy: 'user-123',
    });
    expect(createTenant).toHaveBeenCalledWith({
      data: {
        name: 'Acme Shop',
        slug: 'acme-shop',
        clerkOrganizationId: 'org-123',
        members: {
          create: { clerkUserId: 'user-123', role: 'OWNER' },
        },
      },
      select: { id: true, name: true, slug: true },
    });
  });

  it('rejects duplicate store slugs before creating a Clerk organization', async () => {
    findTenant.mockResolvedValue({ id: 'existing-tenant' });

    await expect(
      service.registerCompany('user-123', 'Acme Shop', 'acme-shop'),
    ).rejects.toThrow(ConflictException);
    expect(createOrganization).not.toHaveBeenCalled();
    expect(createTenant).not.toHaveBeenCalled();
  });

  it('removes the Clerk organization if tenant persistence fails', async () => {
    const databaseError = new Error('Database unavailable');
    createTenant.mockRejectedValue(databaseError);

    await expect(service.registerCompany('user-123', 'Acme Shop')).rejects.toBe(
      databaseError,
    );
    expect(deleteOrganization).toHaveBeenCalledWith('org-123');
  });
});
