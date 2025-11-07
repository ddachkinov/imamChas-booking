import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

export interface PreferencesByType {
  appointment_confirmation?: boolean;
  appointment_reminder?: boolean;
  appointment_cancelled?: boolean;
  appointment_rescheduled?: boolean;
  payment_receipt?: boolean;
  marketing?: boolean;
  system?: boolean;
}

export class NotificationPreferencesDto {
  @ApiProperty({
    description: 'Email notification preferences by type',
    type: 'object',
    example: {
      appointment_confirmation: true,
      appointment_reminder: true,
      marketing: false,
    },
  })
  @IsObject()
  email: PreferencesByType;

  @ApiProperty({
    description: 'SMS notification preferences by type',
    type: 'object',
    example: {
      appointment_reminder: true,
      appointment_cancelled: false,
    },
  })
  @IsObject()
  sms: PreferencesByType;

  @ApiProperty({
    description: 'Push notification preferences by type',
    type: 'object',
    example: {
      appointment_reminder: true,
      new_message: true,
    },
  })
  @IsObject()
  push: PreferencesByType;
}
