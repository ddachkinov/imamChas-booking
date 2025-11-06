import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Appointment } from './appointment.entity';
import { ServiceAddon } from '../../services/entities/service-addon.entity';

@Entity('appointment_addons')
@Index(['appointment_id'])
export class AppointmentAddon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  appointment_id: string;

  @Column('uuid')
  service_addon_id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => Appointment)
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  @ManyToOne(() => ServiceAddon)
  @JoinColumn({ name: 'service_addon_id' })
  serviceAddon: ServiceAddon;
}
