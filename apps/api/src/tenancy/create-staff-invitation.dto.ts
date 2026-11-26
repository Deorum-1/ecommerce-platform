import { Transform } from 'class-transformer';
import { IsEmail, MaxLength } from 'class-validator';

function normalizeEmail(value: unknown): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export class CreateStaffInvitationDto {
  @Transform(({ value }) => normalizeEmail(value))
  @IsEmail()
  @MaxLength(254)
  emailAddress!: string;
}
