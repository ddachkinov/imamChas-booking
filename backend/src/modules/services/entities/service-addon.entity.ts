import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Service } from './service.entity';

export enum AddonStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('service_addons')
@Index(['service_id', 'status'])
export class ServiceAddon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  service_id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int' })
  additional_duration_minutes: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  additional_price: number;

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  @Column({
    type: 'enum',
    enum: AddonStatus,
    default: AddonStatus.ACTIVE,
  })
  status: AddonStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => Service)
  @JoinColumn({ name: 'service_id' })
  service: Service;
}
