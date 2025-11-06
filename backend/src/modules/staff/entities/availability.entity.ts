import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { StaffMember } from './staff-member.entity';

export enum AvailabilityType {
  RECURRING = 'recurring',
  ONE_TIME = 'one_time',
  TIME_OFF = 'time_off',
}

@Entity('availabilities')
@Index(['tenant_id'])
@Index(['staff_member_id', 'type'])
@Index(['start_date', 'end_date'])
export class Availability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  staff_member_id: string;

  @Column({ type: 'enum', enum: AvailabilityType })
  type: AvailabilityType;

  @Column({ type: 'int', nullable: true })
  day_of_week: number;

  @Column({ type: 'date', nullable: true })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date: Date;

  @Column({ type: 'time' })
  start_time: string;

  @Column({ type: 'time' })
  end_time: string;

  @Column({ default: 'UTC' })
  timezone: string;

  @Column({ default: true })
  is_available: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  recurrence_rule: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => StaffMember)
  @JoinColumn({ name: 'staff_member_id' })
  staffMember: StaffMember;
}
