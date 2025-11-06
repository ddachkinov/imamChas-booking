import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CancelAppointmentDto {
  @ApiPropertyOptional({ description: 'Reason for cancellation' })
  @IsOptional()
  @IsString()
  cancellation_reason?: string;

  @ApiPropertyOptional({ description: 'Cancel entire recurring series', default: false })
  @IsOptional()
  @IsBoolean()
  cancel_recurring_series?: boolean;
}
