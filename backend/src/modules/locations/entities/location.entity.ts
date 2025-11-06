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
import { Business } from '../../businesses/entities/business.entity';

export enum LocationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TEMPORARILY_CLOSED = 'temporarily_closed',
}

export interface OperatingHours {
  monday?: { open: string; close: string; closed: boolean };
  tuesday?: { open: string; close: string; closed: boolean };
  wednesday?: { open: string; close: string; closed: boolean };
  thursday?: { open: string; close: string; closed: boolean };
  friday?: { open: string; close: string; closed: boolean };
  saturday?: { open: string; close: string; closed: boolean };
  sunday?: { open: string; close: string; closed: boolean };
}

@Entity('locations')
@Index(['tenant_id'])
@Index(['business_id'])
@Index(['business_id', 'status'])
export class Location {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  business_id: string;

  @Column()
  name: string;

  @Column()
  address_line1: string;

  @Column({ nullable: true })
  address_line2: string;

  @Column()
  city: string;

  @Column({ nullable: true })
  state_province: string;

  @Column()
  postal_code: string;

  @Column({ length: 2 })
  country: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ nullable: true })
  phone_number: string;

  @Column({ nullable: true })
  email: string;

  @Column({ default: 'UTC' })
  timezone: string;

  @Column({ type: 'jsonb', default: {} })
  operating_hours: OperatingHours;

  @Column({
    type: 'enum',
    enum: LocationStatus,
    default: LocationStatus.ACTIVE,
  })
  status: LocationStatus;

  @Column({ type: 'jsonb', nullable: true })
  settings: Record<string, any>;

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

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'business_id' })
  business: Business;
}
