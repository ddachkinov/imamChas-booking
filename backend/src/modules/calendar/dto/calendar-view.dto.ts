import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsDateString,
  IsOptional,
  IsUUID,
  IsArray,
  IsBoolean,
} from 'class-validator';

export enum CalendarViewType {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  RESOURCE = 'resource',
}

export class CalendarViewDto {
  @ApiProperty({ description: 'View type', enum: CalendarViewType })
  @IsEnum(CalendarViewType)
  view: CalendarViewType;

  @ApiProperty({ description: 'Start date for view (ISO 8601 date)' })
  @IsDateString()
  start_date: string;

  @ApiProperty({ description: 'End date for view (ISO 8601 date)' })
  @IsDateString()
  end_date: string;

  @ApiPropertyOptional({ description: 'Business ID filter' })
  @IsOptional()
  @IsUUID()
  business_id?: string;

  @ApiPropertyOptional({ description: 'Location ID filter' })
  @IsOptional()
  @IsUUID()
  location_id?: string;

  @ApiPropertyOptional({ description: 'Staff member IDs filter', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  staff_member_ids?: string[];

  @ApiPropertyOptional({ description: 'Include blocked time', default: true })
  @IsOptional()
  @IsBoolean()
  include_blocked_time?: boolean;

  @ApiPropertyOptional({ description: 'Include availability', default: true })
  @IsOptional()
  @IsBoolean()
  include_availability?: boolean;

  @ApiPropertyOptional({ description: 'Timezone for display', default: 'UTC' })
  @IsOptional()
  @IsString()
  timezone?: string;
}
