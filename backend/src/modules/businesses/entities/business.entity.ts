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
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';

export enum BusinessStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export interface BookingPolicy {
  cancellation_hours?: number;
  min_advance_booking_hours?: number;
  max_advance_booking_days?: number;
  requires_approval?: boolean;
  cancellation_fee_percentage?: number;
  no_show_fee_percentage?: number;
}

@Entity('businesses')
@Index(['tenant_id'])
@Index(['tenant_id', 'status'])
export class Business {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  legal_name: string;

  @Column({ nullable: true })
  tax_id: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  logo_url: string;

  @Column({ nullable: true })
  primary_color: string;

  @Column({ nullable: true })
  secondary_color: string;

  @Column({ default: 'USD' })
  currency: string;

  @Column({ default: 'UTC' })
  default_timezone: string;

  @Column({ type: 'jsonb', default: {} })
  booking_policy: BookingPolicy;

  @Column({
    type: 'enum',
    enum: BusinessStatus,
    default: BusinessStatus.ACTIVE,
  })
  status: BusinessStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;

  // Relationships
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
