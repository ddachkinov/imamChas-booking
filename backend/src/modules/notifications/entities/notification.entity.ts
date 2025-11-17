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
@Index(['tenant_id'])
@Index(['user_id'])
@Index(['read'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  user_id: string;

  @Column()
  type: string;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, any>;

  @Column({ default: false })
  read: boolean;

  @Column({ type: 'timestamp without time zone', nullable: true })
  read_at: Date;

  @Column({ default: false })
  sent_via_email: boolean;

  @Column({ default: false })
  sent_via_sms: boolean;

  @CreateDateColumn()
  created_at: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
