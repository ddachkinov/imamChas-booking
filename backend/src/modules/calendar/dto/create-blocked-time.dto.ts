import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsDateString,
  IsOptional,
  IsBoolean,
  Matches,
} from 'class-validator';

export class CreateBlockedTimeDto {
  @ApiProperty({ description: 'Staff member ID' })
  @IsUUID()
  staff_member_id: string;

  @ApiProperty({ description: 'Block title (e.g., "Lunch Break", "Meeting")' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Optional description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Start time (ISO 8601 timestamp)' })
  @IsDateString()
  start_time: string;

  @ApiProperty({ description: 'End time (ISO 8601 timestamp)' })
  @IsDateString()
  end_time: string;

  @ApiPropertyOptional({ description: 'Is recurring block', default: false })
  @IsOptional()
  @IsBoolean()
  is_recurring?: boolean;

  @ApiPropertyOptional({
    description: 'Recurrence rule (iCalendar RRULE format)',
    example: 'FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR',
  })
  @IsOptional()
  @IsString()
  recurrence_rule?: string;

  @ApiPropertyOptional({
    description: 'Color for display (hex)',
    example: '#9CA3AF',
  })
  @IsOptional()
  @Matches(/^#[0-9A-F]{6}$/i)
  color?: string;

  @ApiPropertyOptional({ description: 'Location ID (optional)' })
  @IsOptional()
  @IsUUID()
  location_id?: string;
}
