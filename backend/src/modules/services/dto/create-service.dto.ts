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
  Max,
  MaxLength,
  IsUUID,
  IsUrl,
  Matches,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
} from 'class-validator';
import { ServiceStatus, DepositType } from '../entities/service.entity';

export enum ServiceCategory {
  HAIRCUT = 'haircut',
  COLORING = 'coloring',
  STYLING = 'styling',
  TREATMENT = 'treatment',
  MASSAGE = 'massage',
  FACIAL = 'facial',
  CONSULTATION = 'consultation',
  OTHER = 'other',
}

@ValidatorConstraint({ name: 'isDurationIncrement', async: false })
export class IsDurationIncrementConstraint implements ValidatorConstraintInterface {
  validate(duration: number, args: ValidationArguments) {
    return duration % 15 === 0;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Duration must be in 15-minute increments';
  }
}

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

  @ApiPropertyOptional({ enum: ServiceCategory })
  @IsOptional()
  @IsEnum(ServiceCategory)
  category?: ServiceCategory;

  @ApiProperty()
  @IsInt()
  @IsPositive()
  @Min(15, { message: 'Duration must be at least 15 minutes' })
  @Max(480, { message: 'Duration cannot exceed 8 hours (480 minutes)' })
  @Validate(IsDurationIncrementConstraint)
  duration_minutes: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120, { message: 'Buffer before cannot exceed 120 minutes' })
  buffer_before_minutes?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120, { message: 'Buffer after cannot exceed 120 minutes' })
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
