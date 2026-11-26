import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ClerkService } from '../clerk/clerk.service';
import { TenantInvitationsService } from './tenant-invitations.service';

describe('TenantInvitationsService', () => {
  let service: TenantInvitationsService;
  let createInvitation: jest.Mock;

  beforeEach(async () => {
    createInvitation = jest.fn().mockResolvedValue({
      id: 'orginv-123',
      emailAddress: 'staff@example.com',
      role: 'org:member',
      status: 'pending',
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantInvitationsService,
        {
          provide: ClerkService,
          useValue: {
            client: {
              organizations: { createOrganizationInvitation: createInvitation },
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('http://localhost:3002'),
          },
        },
      ],
    }).compile();

    service = module.get<TenantInvitationsService>(TenantInvitationsService);
  });

  it('sends an organization-scoped staff invitation with the member role', async () => {
    await expect(
      service.inviteStaff('org-123', 'owner-123', 'staff@example.com'),
    ).resolves.toEqual({
      id: 'orginv-123',
      emailAddress: 'staff@example.com',
      role: 'org:member',
      status: 'pending',
    });

    expect(createInvitation).toHaveBeenCalledWith({
      organizationId: 'org-123',
      emailAddress: 'staff@example.com',
      role: 'org:member',
      inviterUserId: 'owner-123',
      redirectUrl: 'http://localhost:3002/dashboard',
    });
  });
});
