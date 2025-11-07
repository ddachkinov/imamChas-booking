import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsEnum,
  IsOptional,
  IsObject,
  IsDateString,
  IsArray,
} from 'class-validator';
import { NotificationChannel, NotificationType } from '../entities/notification.entity';

export class SendNotificationDto {
  @ApiProperty({ description: 'Recipient user ID' })
  @IsUUID()
  recipient_user_id: string;

  @ApiProperty({ description: 'Type of notification', enum: NotificationType })
  @IsEnum(NotificationType)
  notification_type: NotificationType;

  @ApiProperty({
    description: 'Notification channel(s)',
    enum: NotificationChannel,
    isArray: true,
  })
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels: NotificationChannel[];

  @ApiPropertyOptional({ description: 'Email subject (for email channel)' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ description: 'Notification body (if not using template)' })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ description: 'Template ID to use' })
  @IsOptional()
  @IsUUID()
  template_id?: string;

  @ApiPropertyOptional({
    description: 'Variables for template substitution',
    type: 'object',
  })
  @IsOptional()
  @IsObject()
  template_variables?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Associated appointment ID' })
  @IsOptional()
  @IsUUID()
  appointment_id?: string;

  @ApiPropertyOptional({ description: 'Schedule notification for future time (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  scheduled_for?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
