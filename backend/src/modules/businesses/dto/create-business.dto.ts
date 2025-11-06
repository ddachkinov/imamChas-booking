import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUrl,
  IsEnum,
  IsObject,
  MaxLength,
  Matches,
  Length,
} from 'class-validator';
import { BusinessStatus, BookingPolicy } from '../entities/business.entity';

export class CreateBusinessDto {
  @ApiProperty({ description: 'Business name' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Legal entity name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  legal_name?: string;

  @ApiPropertyOptional({ description: 'Tax identification number' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  tax_id?: string;

  @ApiPropertyOptional({ description: 'Business description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Business website URL' })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({ description: 'Logo image URL' })
  @IsOptional()
  @IsUrl()
  logo_url?: string;

  @ApiPropertyOptional({ description: 'Primary brand color (hex code)', example: '#FF5733' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Primary color must be a valid hex color code' })
  primary_color?: string;

  @ApiPropertyOptional({ description: 'Secondary brand color (hex code)', example: '#33FF57' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Secondary color must be a valid hex color code' })
  secondary_color?: string;

  @ApiProperty({ description: 'Currency (ISO 4217 code)', example: 'USD', default: 'USD' })
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/, { message: 'Currency must be a valid ISO 4217 code' })
  currency: string = 'USD';

  @ApiProperty({ description: 'Default timezone (IANA)', example: 'America/New_York', default: 'UTC' })
  @IsString()
  default_timezone: string = 'UTC';

  @ApiPropertyOptional({
    description: 'Booking policy settings',
    example: {
      cancellation_hours: 24,
      min_advance_booking_hours: 2,
      max_advance_booking_days: 90,
      requires_approval: false,
      cancellation_fee_percentage: 50,
      no_show_fee_percentage: 100,
    },
  })
  @IsOptional()
  @IsObject()
  booking_policy?: BookingPolicy;

  @ApiPropertyOptional({ description: 'Business status', enum: BusinessStatus, default: BusinessStatus.ACTIVE })
  @IsOptional()
  @IsEnum(BusinessStatus)
  status?: BusinessStatus;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
