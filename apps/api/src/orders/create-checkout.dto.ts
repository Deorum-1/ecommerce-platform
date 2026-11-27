import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CheckoutItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  variantId?: string;

  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number;
}

export class CreateCheckoutDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  customerName: string;

  @IsEmail()
  @MaxLength(254)
  customerEmail: string;

  @IsString()
  @Matches(/^\+?[0-9\s()-]{8,24}$/)
  customerPhone: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  shippingAddress: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  shippingCity: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  shippingState: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items: CheckoutItemDto[];
}
