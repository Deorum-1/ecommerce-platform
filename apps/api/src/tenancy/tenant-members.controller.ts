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
import { CreateStaffAccountDto } from './create-staff-account.dto';
import { TenantMembersService } from './tenant-members.service';

@Controller('tenants/members')
@UseGuards(ClerkAuthGuard, TenantGuard, RolesGuard)
export class TenantMembersController {
  constructor(private readonly members: TenantMembersService) {}

  @Post()
  @Roles('org:admin')
  createStaffAccount(
    @Body() dto: CreateStaffAccountDto,
    @Req() request: TenantRequest,
  ) {
    const user = request.user;
    if (!user?.organizationId) {
      throw new ForbiddenException('An active organization is required');
    }

    return this.members.createStaffAccount(
      user.organizationId,
      dto.emailAddress,
      dto.firstName,
      dto.lastName,
    );
  }
}
