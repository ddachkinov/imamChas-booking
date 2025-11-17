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

@Entity('users')
@Index(['tenant_id', 'email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  tenant_id: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  password_hash: string;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  avatar_url: string;

  @Column({ default: 'UTC' })
  timezone: string;

  @Column({ default: 'en' })
  locale: string;

  @Column({ default: false })
  email_verified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  email_verified_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_login_at: Date;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

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
