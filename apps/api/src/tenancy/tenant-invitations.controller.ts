import {
  Body,
  Controller,
  ForbiddenException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClerkAuthGuard } from '../clerk/clerk-auth.guard';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { TenantGuard } from './tenant.guard';
import type { TenantRequest } from './tenant-request.interface';
import { CreateStaffInvitationDto } from './create-staff-invitation.dto';
import { TenantInvitationsService } from './tenant-invitations.service';

@Controller('tenants/invitations')
@UseGuards(ClerkAuthGuard, TenantGuard, RolesGuard)
export class TenantInvitationsController {
  constructor(private readonly invitationService: TenantInvitationsService) {}

  @Post()
  @Roles('org:admin')
  inviteStaff(
    @Body() dto: CreateStaffInvitationDto,
    @Req() request: TenantRequest,
  ) {
    const user = request.user;
    if (!user?.organizationId) {
      throw new ForbiddenException('An active organization is required');
    }

    return this.invitationService.inviteStaff(
      user.organizationId,
      user.userId,
      dto.emailAddress,
    );
  }
}
