import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Role, RoleScope } from './role.entity';

@Entity('user_roles')
@Index(['user_id', 'role_id', 'scope_type', 'scope_id'], { unique: true })
@Index(['user_id'])
@Index(['role_id'])
export class UserRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  user_id: string;

  @Column('uuid')
  role_id: string;

  @Column({
    type: 'enum',
    enum: RoleScope,
  })
  scope_type: RoleScope;

  @Column('uuid', { nullable: true })
  scope_id: string; // null for TENANT scope, business_id or location_id for others

  @Column('uuid')
  granted_by: string; // User ID who granted this role

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  granted_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date;

  @CreateDateColumn()
  created_at: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.userRoles)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Role, (role) => role.userRoles)
  @JoinColumn({ name: 'role_id' })
  role: Role;
}
