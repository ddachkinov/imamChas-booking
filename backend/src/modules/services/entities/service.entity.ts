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
import { Business } from '../../businesses/entities/business.entity';

export enum ServiceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

export enum DepositType {
  FIXED = 'fixed',
  PERCENTAGE = 'percentage',
}

@Entity('services')
@Index(['tenant_id'])
@Index(['business_id', 'status'])
@Index(['business_id', 'category'])
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  business_id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  category: string;

  @Column({ type: 'int' })
  duration_minutes: number;

  @Column({ type: 'int', default: 0 })
  buffer_before_minutes: number;

  @Column({ type: 'int', default: 0 })
  buffer_after_minutes: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ default: 'USD' })
  price_currency: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  deposit_amount: number;

  @Column({ type: 'enum', enum: DepositType, nullable: true })
  deposit_type: DepositType;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  tax_rate: number;

  @Column({ nullable: true })
  image_url: string;

  @Column({ nullable: true })
  color: string;

  @Column({ default: false })
  is_group_booking_allowed: boolean;

  @Column({ type: 'int', nullable: true })
  max_group_size: number;

  @Column({ default: false })
  requires_approval: boolean;

  @Column({ type: 'int', default: 0 })
  booking_advance_min_hours: number;

  @Column({ type: 'int', nullable: true })
  booking_advance_max_days: number;

  @Column({ type: 'int', nullable: true })
  cancellation_allowed_hours: number;

  @Column({
    type: 'enum',
    enum: ServiceStatus,
    default: ServiceStatus.ACTIVE,
  })
  status: ServiceStatus;

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'business_id' })
  business: Business;
}
