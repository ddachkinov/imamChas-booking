import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { AppointmentStatus } from '../entities/appointment.entity';

export class UpdateAppointmentDto {
  @ApiPropertyOptional({ description: 'New appointment start time (for rescheduling)' })
  @IsOptional()
  @IsDateString()
  start_time?: string;

  @ApiPropertyOptional({ description: 'Reassign to different staff member' })
  @IsOptional()
  @IsUUID()
  staff_member_id?: string;

  @ApiPropertyOptional({ description: 'Client notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Internal notes (staff only)' })
  @IsOptional()
  @IsString()
  internal_notes?: string;

  @ApiPropertyOptional({ description: 'Appointment status', enum: AppointmentStatus })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;
}
