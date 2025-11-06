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
import { StaffMember } from './staff-member.entity';
import { Service } from '../../services/entities/service.entity';

export enum ProficiencyLevel {
  TRAINEE = 'trainee',
  COMPETENT = 'competent',
  PROFICIENT = 'proficient',
  EXPERT = 'expert',
}

@Entity('staff_skills')
@Index(['staff_member_id', 'service_id'], { unique: true })
@Index(['tenant_id'])
@Index(['service_id'])
export class StaffSkill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  staff_member_id: string;

  @Column('uuid')
  service_id: string;

  @Column({ type: 'enum', enum: ProficiencyLevel })
  proficiency_level: ProficiencyLevel;

  @Column({ type: 'int', nullable: true })
  duration_override_minutes: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price_override: number;

  @Column({ default: false })
  is_preferred: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => StaffMember)
  @JoinColumn({ name: 'staff_member_id' })
  staffMember: StaffMember;

  @ManyToOne(() => Service)
  @JoinColumn({ name: 'service_id' })
  service: Service;
}
