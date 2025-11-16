import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  JoinColumn,
  VersionColumn,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Location } from '../../locations/entities/location.entity';
import { ClientProfile } from '../../clients/entities/client-profile.entity';
import { StaffMember } from '../../staff/entities/staff-member.entity';
import { Service } from '../../services/entities/service.entity';
import { User } from '../../users/entities/user.entity';

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CHECKED_IN = 'checked_in',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

@Entity('appointments')
@Index(['tenant_id', 'appointment_number'], { unique: true })
@Index(['tenant_id', 'status'])
@Index(['location_id', 'start_time', 'end_time'])
@Index(['staff_member_id', 'start_time', 'end_time'])
@Index(['client_id', 'status'])
@Index(['start_time'])
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  business_id: string;

  @Column('uuid')
  location_id: string;

  @Column('uuid')
  client_id: string;

  @Column('uuid')
  staff_member_id: string;

  @Column('uuid')
  service_id: string;

  @Column({ unique: true })
  appointment_number: string;

  @Column({ type: 'timestamp with time zone' })
  start_time: Date;

  @Column({ type: 'timestamp with time zone' })
  end_time: Date;

  @Column({ default: 'UTC' })
  timezone: string;

  @Column({ type: 'int' })
  duration_minutes: number;

  @Column({ type: 'int', default: 0 })
  buffer_before_minutes: number;

  @Column({ type: 'int', default: 0 })
  buffer_after_minutes: number;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING,
  })
  status: AppointmentStatus;

  @Column({ nullable: true })
  cancellation_reason: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  cancelled_at: Date;

  @Column('uuid', { nullable: true })
  cancelled_by: string;

  @Column({ default: false })
  is_group_booking: boolean;

  @Column({ type: 'int', default: 1 })
  group_size: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  internal_notes: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  check_in_time: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  completion_time: Date;

  @Column({ default: false })
  no_show_notified: boolean;

  @Column({ type: 'timestamp with time zone', nullable: true })
  reminder_sent_at: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;

  @VersionColumn()
  version: number;

  // Relationships
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @ManyToOne(() => Location)
  @JoinColumn({ name: 'location_id' })
  location: Location;

  @ManyToOne(() => ClientProfile)
  @JoinColumn({ name: 'client_id' })
  client: ClientProfile;

  @ManyToOne(() => StaffMember)
  @JoinColumn({ name: 'staff_member_id' })
  staffMember: StaffMember;

  @ManyToOne(() => Service)
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'cancelled_by' })
  cancelledByUser: User;
}
