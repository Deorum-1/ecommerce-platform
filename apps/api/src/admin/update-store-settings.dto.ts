import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class UpdateStoreSettingsDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/.*\S.*/)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  @Matches(/^[a-zA-Z]{3}$/)
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  @ValidateIf((_object, value) => value !== '')
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  logoUrl?: string;

  @IsOptional()
  @ValidateIf((_object, value) => value !== '')
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @ValidateIf((_object, value) => value !== '')
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  website?: string;
}
