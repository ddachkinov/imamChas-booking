import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../users/entities/user.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Location } from '../../locations/entities/location.entity';
import { StaffMember } from '../../staff/entities/staff-member.entity';

export enum ClientStatus {
  ACTIVE = 'active',
  BLOCKED = 'blocked',
  DELETED = 'deleted',
}

@Entity('client_profiles')
@Index(['user_id', 'business_id'], { unique: true })
@Index(['tenant_id'])
@Index(['business_id', 'status'])
export class ClientProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  user_id: string;

  @Column('uuid')
  business_id: string;

  @Column({ type: 'date', nullable: true })
  date_of_birth: Date;

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  address_line1: string;

  @Column({ nullable: true })
  address_line2: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state_province: string;

  @Column({ nullable: true })
  postal_code: string;

  @Column({ nullable: true })
  country: string;

  @Column('uuid', { nullable: true })
  preferred_location_id: string;

  @Column('uuid', { nullable: true })
  preferred_staff_member_id: string;

  @Column({ type: 'jsonb', default: {} })
  notification_preferences: Record<string, any>;

  @Column({ default: false })
  marketing_consent: boolean;

  @Column({ type: 'int', default: 0 })
  loyalty_points: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_spent: number;

  @Column({ type: 'int', default: 0 })
  no_show_count: number;

  @Column({ type: 'int', default: 0 })
  cancellation_count: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', default: [] })
  tags: string[];

  @Column({
    type: 'enum',
    enum: ClientStatus,
    default: ClientStatus.ACTIVE,
  })
  status: ClientStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @ManyToOne(() => Location)
  @JoinColumn({ name: 'preferred_location_id' })
  preferredLocation: Location;

  @ManyToOne(() => StaffMember)
  @JoinColumn({ name: 'preferred_staff_member_id' })
  preferredStaffMember: StaffMember;
}
