import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsDateString,
  IsOptional,
  IsUUID,
  IsBoolean,
} from 'class-validator';

export enum ExportFormat {
  ICAL = 'ical',
  CSV = 'csv',
  PDF = 'pdf',
}

export class ExportCalendarDto {
  @ApiProperty({ description: 'Export format', enum: ExportFormat })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiProperty({ description: 'Start date (ISO 8601)' })
  @IsDateString()
  start_date: string;

  @ApiProperty({ description: 'End date (ISO 8601)' })
  @IsDateString()
  end_date: string;

  @ApiPropertyOptional({ description: 'Staff member ID filter' })
  @IsOptional()
  @IsUUID()
  staff_member_id?: string;

  @ApiPropertyOptional({ description: 'Location ID filter' })
  @IsOptional()
  @IsUUID()
  location_id?: string;

  @ApiPropertyOptional({ description: 'Include cancelled appointments', default: false })
  @IsOptional()
  @IsBoolean()
  include_cancelled?: boolean;
}
