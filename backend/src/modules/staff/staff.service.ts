import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StaffMember, StaffStatus } from './entities/staff-member.entity';
import { CreateStaffMemberDto } from './dto/create-staff-member.dto';
import { UpdateStaffMemberDto } from './dto/update-staff-member.dto';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(StaffMember)
    private readonly staffRepository: Repository<StaffMember>,
  ) {}

  async create(tenantId: string, createStaffDto: CreateStaffMemberDto): Promise<StaffMember> {
    const staff = this.staffRepository.create({
      ...createStaffDto,
      tenant_id: tenantId,
    });
    return this.staffRepository.save(staff);
  }

  async findAll(tenantId: string, businessId?: string, includeInactive: boolean = false): Promise<StaffMember[]> {
    const query = this.staffRepository
      .createQueryBuilder('staff')
      .leftJoinAndSelect('staff.user', 'user')
      .where('staff.tenant_id = :tenantId', { tenantId });

    if (businessId) {
      query.andWhere('staff.business_id = :businessId', { businessId });
    }

    if (!includeInactive) {
      query.andWhere('staff.status = :status', { status: StaffStatus.ACTIVE });
    }

    query.orderBy('staff.created_at', 'DESC');

    return query.getMany();
  }

  async findOne(tenantId: string, id: string): Promise<StaffMember> {
    const staff = await this.staffRepository.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['user'],
    });

    if (!staff) {
      throw new NotFoundException(`Staff member with ID ${id} not found`);
    }

    return staff;
  }

  async update(tenantId: string, id: string, updateStaffDto: UpdateStaffMemberDto): Promise<StaffMember> {
    const staff = await this.findOne(tenantId, id);
    Object.assign(staff, updateStaffDto);
    return this.staffRepository.save(staff);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const staff = await this.findOne(tenantId, id);
    await this.staffRepository.softRemove(staff);
  }
}
