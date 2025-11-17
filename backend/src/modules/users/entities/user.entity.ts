import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { UserRole } from './user-role.entity';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}

export enum MfaMethod {
  NONE = 'none',
  TOTP = 'totp',
  SMS = 'sms',
}

export enum OAuthProvider {
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  APPLE = 'apple',
}

@Entity('users')
@Index(['tenant_id', 'email'], { unique: true })
@Index(['tenant_id', 'status'])
@Index(['oauth_provider', 'oauth_provider_id'], { unique: true, where: 'oauth_provider IS NOT NULL' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  tenant_id: string;

  @Column()
  email: string;

  @Column({ default: false })
  email_verified: boolean;

  @Column({ nullable: true })
  password_hash: string;

  @Column({ nullable: true })
  password_salt: string;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ nullable: true })
  display_name: string;

  @Column({ nullable: true })
  phone_number: string;

  @Column({ default: false })
  phone_verified: boolean;

  @Column({ default: 'bg' })
  language: string;

  @Column({ default: 'UTC' })
  timezone: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING_VERIFICATION,
  })
  status: UserStatus;

  @Column({ default: false })
  mfa_enabled: boolean;

  @Column({
    type: 'enum',
    enum: MfaMethod,
    default: MfaMethod.NONE,
  })
  mfa_method: MfaMethod;

  @Column({ nullable: true, select: false })
  mfa_secret: string; // Encrypted TOTP secret

  @Column({
    type: 'enum',
    enum: OAuthProvider,
    nullable: true,
  })
  oauth_provider: OAuthProvider;

  @Column({ nullable: true })
  oauth_provider_id: string;

  @Column({ type: 'timestamp', nullable: true })
  last_login_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn({ nullable: true })
  deleted_at: Date;

  // Relationships
  @ManyToOne(() => Tenant, (tenant) => tenant.users)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles: UserRole[];

  // Virtual field
  get fullName(): string {
    return `${this.first_name} ${this.last_name}`;
  }
}
