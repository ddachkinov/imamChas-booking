import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  IsObject,
  IsNumber,
  IsLatitude,
  IsLongitude,
  IsUUID,
  MaxLength,
  Length,
  Matches,
} from 'class-validator';
import { LocationStatus, OperatingHours } from '../entities/location.entity';

export class CreateLocationDto {
  @ApiProperty({ description: 'Business ID' })
  @IsUUID()
  business_id: string;

  @ApiProperty({ description: 'Location name' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Address line 1' })
  @IsString()
  @MaxLength(255)
  address_line1: string;

  @ApiPropertyOptional({ description: 'Address line 2' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address_line2?: string;

  @ApiProperty({ description: 'City' })
  @IsString()
  @MaxLength(100)
  city: string;

  @ApiPropertyOptional({ description: 'State or province' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state_province?: string;

  @ApiProperty({ description: 'Postal/ZIP code' })
  @IsString()
  @MaxLength(20)
  postal_code: string;

  @ApiProperty({ description: 'Country code (ISO 3166-1 alpha-2)', example: 'US' })
  @IsString()
  @Length(2, 2)
  @Matches(/^[A-Z]{2}$/, { message: 'Country must be a valid ISO 3166-1 alpha-2 code' })
  country: string;

  @ApiPropertyOptional({ description: 'Latitude coordinate' })
  @IsOptional()
  @IsNumber()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude coordinate' })
  @IsOptional()
  @IsNumber()
  @IsLongitude()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone_number?: string;

  @ApiPropertyOptional({ description: 'Contact email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Timezone (IANA)', example: 'America/New_York', default: 'UTC' })
  @IsString()
  timezone: string = 'UTC';

  @ApiPropertyOptional({
    description: 'Weekly operating hours',
    example: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '20:00', closed: false },
      friday: { open: '09:00', close: '20:00', closed: false },
      saturday: { open: '10:00', close: '16:00', closed: false },
      sunday: { closed: true },
    },
  })
  @IsOptional()
  @IsObject()
  operating_hours?: OperatingHours;

  @ApiPropertyOptional({ description: 'Location status', enum: LocationStatus, default: LocationStatus.ACTIVE })
  @IsOptional()
  @IsEnum(LocationStatus)
  status?: LocationStatus;

  @ApiPropertyOptional({ description: 'Location-specific settings' })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
