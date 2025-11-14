import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum SubscriptionTier {
  FREE = 'free',
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  TRIAL = 'trial',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  slug: string;

  @Column({ unique: true })
  @Index()
  subdomain: string;

  @Column()
  name: string;

  @Column({ default: 'active' })
  status: string;

  @Column({
    type: 'enum',
    enum: SubscriptionTier,
    default: SubscriptionTier.FREE,
  })
  subscription_tier: SubscriptionTier;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.TRIAL,
  })
  @Index()
  subscription_status: SubscriptionStatus;

  @Column({ type: 'timestamp', nullable: true })
  subscription_starts_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  subscription_ends_at: Date;

  @Column({ type: 'jsonb', default: {} })
  feature_flags: Record<string, boolean>;

  @Column({ type: 'jsonb', default: {} })
  settings: Record<string, any>;

  @Column({ nullable: true })
  data_residency_region: string;

  @Column({ default: false })
  is_self_hosted: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn({ nullable: true })
  deleted_at: Date;

  // Relationships
  @OneToMany(() => User, (user) => user.tenant)
  users: User[];
}
