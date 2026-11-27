import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ClerkService } from '../clerk/clerk.service';
import { TenantMembersService } from './tenant-members.service';

describe('TenantMembersService', () => {
  let service: TenantMembersService;
  let createUser: jest.Mock;
  let createMembership: jest.Mock;
  let createSignInToken: jest.Mock;
  let deleteUser: jest.Mock;
  let deleteMembership: jest.Mock;
  let revokeSignInToken: jest.Mock;

  beforeEach(async () => {
    createUser = jest.fn().mockResolvedValue({ id: 'user-123' });
    createMembership = jest.fn().mockResolvedValue({});
    createSignInToken = jest.fn().mockResolvedValue({
      id: 'token-123',
      token: 'ticket-secret',
    });
    deleteUser = jest.fn().mockResolvedValue({});
    deleteMembership = jest.fn().mockResolvedValue({});
    revokeSignInToken = jest.fn().mockResolvedValue({});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantMembersService,
        {
          provide: ClerkService,
          useValue: {
            client: {
              users: { createUser, deleteUser },
              organizations: {
                createOrganizationMembership: createMembership,
                deleteOrganizationMembership: deleteMembership,
              },
              signInTokens: {
                createSignInToken,
                revokeSignInToken,
              },
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

    service = module.get<TenantMembersService>(TenantMembersService);
  });

  it('creates a staff account and returns a one-time setup link', async () => {
    await expect(
      service.createStaffAccount(
        'org-123',
        'staff@example.com',
        'Staff',
        'Member',
      ),
    ).resolves.toEqual({
      id: 'user-123',
      emailAddress: 'staff@example.com',
      role: 'org:member',
      setupUrl: 'http://localhost:3002/account/setup#ticket=ticket-secret',
    });

    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        emailAddress: ['staff@example.com'],
        firstName: 'Staff',
        lastName: 'Member',
      }),
    );
    expect(createMembership).toHaveBeenCalledWith({
      organizationId: 'org-123',
      userId: 'user-123',
      role: 'org:member',
    });
    expect(createSignInToken).toHaveBeenCalledWith({
      userId: 'user-123',
      orgId: 'org-123',
      expiresInSeconds: 86400,
    });
  });

  it('removes the newly created user when membership creation fails', async () => {
    const error = new Error('Membership creation failed');
    createMembership.mockRejectedValue(error);

    await expect(
      service.createStaffAccount(
        'org-123',
        'staff@example.com',
        'Staff',
        'Member',
      ),
    ).rejects.toBe(error);
    expect(deleteUser).toHaveBeenCalledWith('user-123');
    expect(createSignInToken).not.toHaveBeenCalled();
  });

  it('cleans up the membership and user when setup-token creation fails', async () => {
    const error = new Error('Token creation failed');
    createSignInToken.mockRejectedValue(error);

    await expect(
      service.createStaffAccount(
        'org-123',
        'staff@example.com',
        'Staff',
        'Member',
      ),
    ).rejects.toBe(error);
    expect(deleteMembership).toHaveBeenCalledWith({
      organizationId: 'org-123',
      userId: 'user-123',
    });
    expect(deleteUser).toHaveBeenCalledWith('user-123');
  });
});
