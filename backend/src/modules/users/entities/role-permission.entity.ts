import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Role } from './role.entity';
import { Permission } from './permission.entity';

@Entity('role_permissions')
@Index(['role_id', 'permission_id'], { unique: true })
@Index(['role_id'])
@Index(['permission_id'])
export class RolePermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  role_id: string;

  @Column('uuid')
  permission_id: string;

  @CreateDateColumn()
  created_at: Date;

  // Relationships
  @ManyToOne(() => Role, (role) => role.rolePermissions)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => Permission, (permission) => permission.rolePermissions)
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;
}
