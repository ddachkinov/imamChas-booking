import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { StaffMember, StaffStatus } from './entities/staff-member.entity';
import { CreateStaffMemberDto } from './dto/create-staff-member.dto';
import { UpdateStaffMemberDto } from './dto/update-staff-member.dto';
import { User } from '../users/entities/user.entity';
import { Appointment, AppointmentStatus } from '../appointments/entities/appointment.entity';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(StaffMember)
    private readonly staffRepository: Repository<StaffMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
  ) {}

  async create(tenantId: string, createStaffDto: CreateStaffMemberDto): Promise<StaffMember> {
    const staff = this.staffRepository.create({
      ...createStaffDto,
      tenant_id: tenantId,
    });
    return this.staffRepository.save(staff);
  }

  async findAll(
    tenantId: string,
    businessId?: string,
    includeInactive: boolean = false,
    limit?: number,
    offset?: number,
  ): Promise<StaffMember[]> {
    const query = this.buildStaffQuery(tenantId, businessId, includeInactive);

    query.orderBy('staff.created_at', 'DESC');

    if (limit !== undefined) {
      query.limit(limit);
    }

    if (offset !== undefined) {
      query.offset(offset);
    }

    return query.getMany();
  }

  async count(
    tenantId: string,
    businessId?: string,
    includeInactive: boolean = false,
  ): Promise<number> {
    const query = this.buildStaffQuery(tenantId, businessId, includeInactive);
    return query.getCount();
  }

  private buildStaffQuery(
    tenantId: string,
    businessId?: string,
    includeInactive: boolean = false,
  ) {
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

    return query;
  }

  async findOne(tenantId: string, id: string): Promise<any> {
    const staff = await this.staffRepository.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['user'],
    });

    if (!staff) {
      throw new NotFoundException(`Staff member with ID ${id} not found`);
    }

    // Calculate statistics
    const stats = await this.calculateStaffStatistics(tenantId, id);

    return {
      ...staff,
      stats,
    };
  }

  /**
   * Calculate statistics for a staff member
   */
  private async calculateStaffStatistics(tenantId: string, staffId: string): Promise<any> {
    const now = new Date();

    // Get all appointments for this staff member
    const allAppointments = await this.appointmentRepository.find({
      where: {
        tenant_id: tenantId,
        staff_member_id: staffId,
      },
    });

    // Get upcoming appointments
    const upcomingAppointments = allAppointments.filter(
      apt => new Date(apt.start_time) >= now &&
             apt.status !== AppointmentStatus.CANCELLED &&
             apt.status !== AppointmentStatus.NO_SHOW
    );

    // Get completed appointments
    const completedAppointments = allAppointments.filter(
      apt => apt.status === AppointmentStatus.COMPLETED
    );

    // Calculate total revenue from completed appointments
    const totalRevenue = completedAppointments.reduce((sum, apt) => {
      return sum + (apt.price ? parseFloat(apt.price.toString()) : 0);
    }, 0);

    // Calculate average rating (placeholder - would need ratings table)
    const averageRating = null; // TODO: Implement when ratings system is added

    return {
      upcoming_appointments: upcomingAppointments.length,
      completed_appointments: completedAppointments.length,
      total_revenue: totalRevenue,
      average_rating: averageRating,
      total_appointments: allAppointments.length,
    };
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
    const hashedPassword = await argon2.hash(temporaryPassword);

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
        is_active: false, // Will be activated when they accept invitation
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
      // TODO: Store invitation details (invited_by, role, service_ids, location_ids) when metadata field is added
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
