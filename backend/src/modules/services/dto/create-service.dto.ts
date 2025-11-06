import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsInt,
  IsPositive,
  Min,
  MaxLength,
  IsUUID,
  IsUrl,
  Matches,
} from 'class-validator';
import { ServiceStatus, DepositType } from '../entities/service.entity';

export class CreateServiceDto {
  @ApiProperty()
  @IsUUID()
  business_id: string;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiProperty()
  @IsInt()
  @IsPositive()
  duration_minutes: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  buffer_before_minutes?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  buffer_after_minutes?: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ default: 'USD' })
  @IsString()
  price_currency: string = 'USD';

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  deposit_amount?: number;

  @ApiPropertyOptional({ enum: DepositType })
  @IsOptional()
  @IsEnum(DepositType)
  deposit_type?: DepositType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  tax_rate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  image_url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  color?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  is_group_booking_allowed?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsPositive()
  max_group_size?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  requires_approval?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  booking_advance_min_hours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsPositive()
  booking_advance_max_days?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsPositive()
  cancellation_allowed_hours?: number;

  @ApiPropertyOptional({ enum: ServiceStatus, default: ServiceStatus.ACTIVE })
  @IsOptional()
  @IsEnum(ServiceStatus)
  status?: ServiceStatus;
}
