import {
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ClerkAuthGuard } from '../clerk/clerk-auth.guard';
import type { TenantRequest } from '../tenancy/tenant-request.interface';
import { CreateCompanyDto } from './create-company.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register-company')
  @UseGuards(ClerkAuthGuard)
  registerCompany(
    @Body() dto: CreateCompanyDto,
    @Req() request: TenantRequest,
  ) {
    const userId = request.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('A signed-in Clerk user is required');
    }

    return this.authService.registerCompany(userId, dto.name, dto.slug);
  }
}
