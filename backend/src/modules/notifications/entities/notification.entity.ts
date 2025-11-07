import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { NotificationTemplate } from './notification-template.entity';

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  BOUNCED = 'bounced',
  OPENED = 'opened',
  CLICKED = 'clicked',
  CANCELLED = 'cancelled',
  SKIPPED = 'skipped',
}

export enum NotificationType {
  APPOINTMENT_CONFIRMATION = 'appointment_confirmation',
  APPOINTMENT_REMINDER_24H = 'appointment_reminder_24h',
  APPOINTMENT_REMINDER_1H = 'appointment_reminder_1h',
  APPOINTMENT_CANCELLED = 'appointment_cancelled',
  APPOINTMENT_RESCHEDULED = 'appointment_rescheduled',
  PAYMENT_RECEIPT = 'payment_receipt',
  PASSWORD_RESET = 'password_reset',
  EMAIL_VERIFICATION = 'email_verification',
  MFA_CODE = 'mfa_code',
  MARKETING = 'marketing',
  SYSTEM = 'system',
}

@Entity('notifications')
@Index(['tenant_id', 'status'])
@Index(['recipient_user_id'])
@Index(['appointment_id'])
@Index(['scheduled_for', 'status'])
@Index(['gateway_message_id'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  recipient_user_id: string;

  @Column('uuid', { nullable: true })
  appointment_id: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  notification_type: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
  })
  channel: NotificationChannel;

  @Column()
  recipient_address: string; // Email, phone, or device token

  @Column({ nullable: true })
  subject: string; // For email

  @Column('text')
  body: string;

  @Column('uuid', { nullable: true })
  template_id: string;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @Column({ type: 'timestamp with time zone', nullable: true })
  scheduled_for: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  sent_at: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  delivered_at: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  opened_at: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  clicked_at: Date;

  @Column({ nullable: true })
  failed_reason: string;

  @Column({ nullable: true })
  gateway_message_id: string; // External provider ID (SendGrid, Twilio, FCM)

  @Column({ type: 'int', default: 0 })
  retry_count: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'recipient_user_id' })
  recipient: User;

  @ManyToOne(() => Appointment, { nullable: true })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  @ManyToOne(() => NotificationTemplate, { nullable: true })
  @JoinColumn({ name: 'template_id' })
  template: NotificationTemplate;
}
