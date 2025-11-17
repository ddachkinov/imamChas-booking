import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsInt,
  IsPositive,
  Min,
  Max,
  MaxLength,
  IsUUID,
  IsUrl,
  IsEnum,
  Matches,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
} from 'class-validator';

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  deposit_amount?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  max_capacity?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  is_group_service?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  requires_approval?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  accepts_online_bookings?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  image_url?: string;
}
