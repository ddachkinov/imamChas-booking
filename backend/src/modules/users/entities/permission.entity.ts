import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { RolePermission } from './role-permission.entity';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string; // e.g., 'user:create', 'business:read'

  @Column()
  resource: string; // e.g., 'appointment', 'client', 'staff'

  @Column()
  action: string; // e.g., 'create', 'read', 'update', 'delete'

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  created_at: Date;

  // Relationships
  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.permission)
  rolePermissions: RolePermission[];

  // Virtual field for permission string
  get permissionString(): string {
    return `${this.resource}:${this.action}`;
  }
}
