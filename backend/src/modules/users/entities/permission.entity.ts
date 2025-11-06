import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { RolePermission } from './role-permission.entity';

export enum PermissionScope {
  TENANT = 'tenant',
  BUSINESS = 'business',
  LOCATION = 'location',
  OWN = 'own',
}

@Entity('permissions')
@Index(['resource', 'action', 'scope'], { unique: true })
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  resource: string; // e.g., 'appointment', 'client', 'staff'

  @Column()
  action: string; // e.g., 'create', 'read', 'update', 'delete'

  @Column({
    type: 'enum',
    enum: PermissionScope,
  })
  scope: PermissionScope;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: false })
  is_system_permission: boolean;

  @CreateDateColumn()
  created_at: Date;

  // Relationships
  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.permission)
  rolePermissions: RolePermission[];

  // Virtual field for permission string
  get permissionString(): string {
    return `${this.resource}:${this.action}:${this.scope}`;
  }
}
