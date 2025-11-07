import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { NotificationChannel, NotificationType } from '../entities/notification.entity';

export class CreateTemplateDto {
  @ApiProperty({ description: 'Template name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Notification type', enum: NotificationType })
  @IsEnum(NotificationType)
  notification_type: NotificationType;

  @ApiProperty({ description: 'Notification channel', enum: NotificationChannel })
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @ApiPropertyOptional({ description: 'Language code (ISO 639-1)', default: 'en' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ description: 'Email subject (for email templates)' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty({ description: 'Template body with {{placeholders}}' })
  @IsString()
  body_template: string;

  @ApiPropertyOptional({ description: 'Business ID for business-specific template' })
  @IsOptional()
  @IsUUID()
  business_id?: string;

  @ApiPropertyOptional({ description: 'Is template active', default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
