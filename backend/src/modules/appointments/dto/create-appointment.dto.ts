import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsInt,
  IsEmail,
  IsArray,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({ description: 'Business ID' })
  @IsUUID()
  business_id: string;

  @ApiProperty({ description: 'Location ID' })
  @IsUUID()
  location_id: string;

  @ApiProperty({ description: 'Service ID' })
  @IsUUID()
  service_id: string;

  @ApiPropertyOptional({ description: 'Staff member ID (auto-assigned if not provided)' })
  @IsOptional()
  @IsUUID()
  staff_member_id?: string;

  @ApiProperty({ description: 'Appointment start time (ISO 8601)', example: '2025-11-10T10:00:00Z' })
  @IsDateString()
  start_time: string;

  @ApiProperty({ description: 'Timezone (IANA)', example: 'America/New_York' })
  @IsString()
  timezone: string;

  @ApiPropertyOptional({ description: 'Client ID (for staff booking on behalf of client)' })
  @IsOptional()
  @IsUUID()
  client_id?: string;

  @ApiPropertyOptional({ description: 'Guest email (for guest booking without account)' })
  @IsOptional()
  @IsEmail()
  guest_email?: string;

  @ApiPropertyOptional({ description: 'Guest first name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  guest_first_name?: string;

  @ApiPropertyOptional({ description: 'Guest last name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  guest_last_name?: string;

  @ApiPropertyOptional({ description: 'Guest phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  guest_phone_number?: string;

  @ApiPropertyOptional({ description: 'Array of service addon IDs' })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  addon_ids?: string[];

  @ApiPropertyOptional({ description: 'Group size (for group bookings)', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  group_size?: number;

  @ApiPropertyOptional({ description: 'Client notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Recurrence rule (iCalendar RRULE format)', example: 'FREQ=WEEKLY;COUNT=10' })
  @IsOptional()
  @IsString()
  recurrence_rule?: string;

  @ApiPropertyOptional({ description: 'Recurrence end date (ISO 8601)', example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  recurrence_end_date?: string;
}
