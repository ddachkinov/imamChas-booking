import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';

export class CheckAvailabilityDto {
  @ApiProperty({ description: 'Business ID' })
  @IsUUID()
  business_id: string;

  @ApiPropertyOptional({ description: 'Location ID (optional)' })
  @IsOptional()
  @IsUUID()
  location_id?: string;

  @ApiProperty({ description: 'Service ID' })
  @IsUUID()
  service_id: string;

  @ApiPropertyOptional({ description: 'Specific staff member ID (optional)' })
  @IsOptional()
  @IsUUID()
  staff_member_id?: string;

  @ApiProperty({ description: 'Start date (ISO 8601)', example: '2025-11-10' })
  @IsDateString()
  start_date: string;

  @ApiProperty({ description: 'End date (ISO 8601)', example: '2025-11-17' })
  @IsDateString()
  end_date: string;

  @ApiPropertyOptional({ description: 'Timezone (IANA)', example: 'America/New_York' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ description: 'Group size', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  group_size?: number;
}

export interface AvailableSlot {
  start_time: string; // ISO 8601 timestamp
  end_time: string; // ISO 8601 timestamp
  staff_member_id: string;
  staff_member_name: string;
  location_id: string;
  price: number;
  deposit_amount: number;
  recommended?: boolean; // For future AI recommendations
}
