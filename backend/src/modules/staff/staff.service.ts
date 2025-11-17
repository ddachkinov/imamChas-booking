import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StaffMember, StaffStatus } from './entities/staff-member.entity';
import { CreateStaffMemberDto } from './dto/create-staff-member.dto';
import { UpdateStaffMemberDto } from './dto/update-staff-member.dto';
import { User, UserStatus } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(StaffMember)
    private readonly staffRepository: Repository<StaffMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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

  async inviteStaffMember(tenantId: string, invitedByUserId: string, inviteDto: any): Promise<{ invitation_id: string; message: string }> {
    const { email, role, business_id, service_ids, location_ids } = inviteDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email, tenant_id: tenantId },
    });

    if (existingUser) {
      // Check if they're already a staff member
      const existingStaff = await this.staffRepository.findOne({
        where: { user_id: existingUser.id, tenant_id: tenantId },
      });

      if (existingStaff) {
        throw new ConflictException('This user is already a staff member');
      }
    }

    // Generate a temporary password or invitation token
    const temporaryPassword = uuidv4().substring(0, 12);
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Create or use existing user
    let user: User;
    if (existingUser) {
      user = existingUser;
    } else {
      user = this.userRepository.create({
        email,
        password_hash: hashedPassword,
        first_name: email.split('@')[0], // Temporary first name
        last_name: '', // Will be set when they accept invitation
        tenant_id: tenantId,
        status: UserStatus.PENDING,
        email_verified: false,
      });
      user = await this.userRepository.save(user);
    }

    // Create staff member record
    const staffMember = this.staffRepository.create({
      user_id: user.id,
      tenant_id: tenantId,
      business_id,
      status: StaffStatus.ACTIVE,
      metadata: {
        invited_by: invitedByUserId,
        invited_at: new Date().toISOString(),
        role,
        service_ids: service_ids || [],
        location_ids: location_ids || [],
      },
    });

    await this.staffRepository.save(staffMember);

    // In a real implementation, you would send an email invitation here
    // For now, return the invitation details
    return {
      invitation_id: staffMember.id,
      message: `Invitation sent to ${email}. Temporary password: ${temporaryPassword}`,
    };
  }
}
