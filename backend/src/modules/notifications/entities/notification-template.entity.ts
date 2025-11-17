import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { NotificationChannel, NotificationType } from './notification.entity';

@Entity('notification_templates')
@Index(['tenant_id', 'name'], { unique: true })
@Index(['tenant_id', 'notification_type', 'channel', 'language'])
@Index(['business_id', 'is_active'])
export class NotificationTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { nullable: true })
  tenant_id: string; // null for system templates

  @Column('uuid', { nullable: true })
  business_id: string; // null for tenant-wide or system templates

  @Column()
  name: string;

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

  @Column({ default: 'bg' })
  language: string; // ISO 639-1 language code

  @Column({ nullable: true })
  subject: string; // For email templates

  @Column('text')
  body_template: string; // Template with {{placeholders}}

  @Column({ default: false })
  is_system_template: boolean;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;
}
