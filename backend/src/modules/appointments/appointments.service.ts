import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { AppointmentAddon } from './entities/appointment-addon.entity';
import { Service } from '../services/entities/service.entity';
import { ServiceAddon } from '../services/entities/service-addon.entity';
import { StaffMember } from '../staff/entities/staff-member.entity';
import { ClientProfile } from '../clients/entities/client-profile.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { ConflictResolverService } from './services/conflict-resolver.service';
import * as dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { v4 as uuidv4 } from 'uuid';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(AppointmentAddon)
    private readonly appointmentAddonRepository: Repository<AppointmentAddon>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(ServiceAddon)
    private readonly serviceAddonRepository: Repository<ServiceAddon>,
    @InjectRepository(StaffMember)
    private readonly staffRepository: Repository<StaffMember>,
    @InjectRepository(ClientProfile)
    private readonly clientRepository: Repository<ClientProfile>,
    private readonly conflictResolver: ConflictResolverService,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    tenantId: string,
    userId: string,
    createDto: CreateAppointmentDto,
  ): Promise<Appointment> {
    // 1. Get service details
    const service = await this.serviceRepository.findOne({
      where: { id: createDto.service_id, tenant_id: tenantId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // 2. Get or create client
    let clientId = createDto.client_id;
    if (!clientId) {
      // TODO: Create guest client or use current user's client profile
      // For now, require client_id
      throw new BadRequestException('Client ID is required');
    }

    // 3. Get or assign staff member
    let staffMemberId = createDto.staff_member_id;
    if (!staffMemberId) {
      // Auto-assign first available staff
      const staff = await this.staffRepository.findOne({
        where: {
          business_id: createDto.business_id,
          tenant_id: tenantId,
          status: 'active',
          accepts_online_bookings: true,
        },
      });

      if (!staff) {
        throw new NotFoundException('No available staff found');
      }

      staffMemberId = staff.id;
    }

    const staff = await this.staffRepository.findOne({
      where: { id: staffMemberId, tenant_id: tenantId },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    // 4. Calculate appointment times
    const startTime = dayjs(createDto.start_time).tz(createDto.timezone).toDate();
    const endTime = dayjs(startTime).add(service.duration_minutes, 'minute').toDate();
    const bufferBefore = staff.default_buffer_before_minutes || service.buffer_before_minutes;
    const bufferAfter = staff.default_buffer_after_minutes || service.buffer_after_minutes;

    // 5. Check for conflicts (with database locking)
    await this.conflictResolver.validateSlotAvailable(
      staffMemberId,
      startTime,
      endTime,
      bufferBefore,
      bufferAfter,
    );

    // 6. Create appointment in transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Generate appointment number
      const appointmentNumber = await this.generateAppointmentNumber(tenantId);

      // Create appointment
      const appointment = queryRunner.manager.create(Appointment, {
        tenant_id: tenantId,
        business_id: createDto.business_id,
        location_id: createDto.location_id,
        client_id: clientId,
        staff_member_id: staffMemberId,
        service_id: service.id,
        appointment_number: appointmentNumber,
        start_time: startTime,
        end_time: endTime,
        timezone: createDto.timezone,
        duration_minutes: service.duration_minutes,
        buffer_before_minutes: bufferBefore,
        buffer_after_minutes: bufferAfter,
        status: service.requires_approval ? AppointmentStatus.PENDING : AppointmentStatus.CONFIRMED,
        is_group_booking: (createDto.group_size || 1) > 1,
        group_size: createDto.group_size || 1,
        notes: createDto.notes,
      });

      const savedAppointment = await queryRunner.manager.save(appointment);

      // Add service addons if specified
      if (createDto.addon_ids && createDto.addon_ids.length > 0) {
        for (const addonId of createDto.addon_ids) {
          const addon = await this.serviceAddonRepository.findOne({
            where: { id: addonId, service_id: service.id, tenant_id: tenantId },
          });

          if (addon) {
            const appointmentAddon = queryRunner.manager.create(AppointmentAddon, {
              tenant_id: tenantId,
              appointment_id: savedAppointment.id,
              service_addon_id: addon.id,
              price: addon.additional_price,
            });

            await queryRunner.manager.save(appointmentAddon);
          }
        }
      }

      await queryRunner.commitTransaction();

      // TODO: Send confirmation email/notification

      return savedAppointment;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    tenantId: string,
    filters: {
      businessId?: string;
      locationId?: string;
      staffMemberId?: string;
      clientId?: string;
      status?: AppointmentStatus;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<Appointment[]> {
    const query = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.client', 'client')
      .leftJoinAndSelect('appointment.staffMember', 'staff')
      .leftJoinAndSelect('appointment.service', 'service')
      .leftJoinAndSelect('appointment.location', 'location')
      .where('appointment.tenant_id = :tenantId', { tenantId });

    if (filters.businessId) {
      query.andWhere('appointment.business_id = :businessId', { businessId: filters.businessId });
    }

    if (filters.locationId) {
      query.andWhere('appointment.location_id = :locationId', { locationId: filters.locationId });
    }

    if (filters.staffMemberId) {
      query.andWhere('appointment.staff_member_id = :staffMemberId', { staffMemberId: filters.staffMemberId });
    }

    if (filters.clientId) {
      query.andWhere('appointment.client_id = :clientId', { clientId: filters.clientId });
    }

    if (filters.status) {
      query.andWhere('appointment.status = :status', { status: filters.status });
    }

    if (filters.startDate && filters.endDate) {
      query.andWhere('appointment.start_time BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    query.orderBy('appointment.start_time', 'ASC');

    return query.getMany();
  }

  async findOne(tenantId: string, id: string): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['client', 'staffMember', 'service', 'location', 'client.user', 'staffMember.user'],
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return appointment;
  }

  async update(
    tenantId: string,
    id: string,
    updateDto: UpdateAppointmentDto,
  ): Promise<Appointment> {
    const appointment = await this.findOne(tenantId, id);

    // If rescheduling, validate new time slot
    if (updateDto.start_time) {
      const newStartTime = dayjs(updateDto.start_time).toDate();
      const newEndTime = dayjs(newStartTime).add(appointment.duration_minutes, 'minute').toDate();

      await this.conflictResolver.validateReschedule(
        id,
        appointment.staff_member_id,
        newStartTime,
        newEndTime,
        appointment.buffer_before_minutes,
        appointment.buffer_after_minutes,
      );

      appointment.start_time = newStartTime;
      appointment.end_time = newEndTime;
    }

    // If reassigning staff, validate availability
    if (updateDto.staff_member_id && updateDto.staff_member_id !== appointment.staff_member_id) {
      await this.conflictResolver.validateSlotAvailable(
        updateDto.staff_member_id,
        appointment.start_time,
        appointment.end_time,
        appointment.buffer_before_minutes,
        appointment.buffer_after_minutes,
      );

      appointment.staff_member_id = updateDto.staff_member_id;
    }

    if (updateDto.notes !== undefined) {
      appointment.notes = updateDto.notes;
    }

    if (updateDto.internal_notes !== undefined) {
      appointment.internal_notes = updateDto.internal_notes;
    }

    if (updateDto.status) {
      this.validateStatusTransition(appointment.status, updateDto.status);
      appointment.status = updateDto.status;

      if (updateDto.status === AppointmentStatus.CHECKED_IN) {
        appointment.check_in_time = new Date();
      } else if (updateDto.status === AppointmentStatus.COMPLETED) {
        appointment.completion_time = new Date();
      }
    }

    return this.appointmentRepository.save(appointment);
  }

  async cancel(
    tenantId: string,
    id: string,
    userId: string,
    cancelDto: CancelAppointmentDto,
  ): Promise<Appointment> {
    const appointment = await this.findOne(tenantId, id);

    // Check cancellation policy
    const hoursUntilAppointment = dayjs(appointment.start_time).diff(dayjs(), 'hour');
    // TODO: Get cancellation policy from service/business
    const cancellationCutoff = 24; // Default 24 hours

    if (hoursUntilAppointment < cancellationCutoff) {
      // TODO: Check if user has permission to override
      throw new ForbiddenException(
        `Cannot cancel within ${cancellationCutoff} hours of appointment. Please contact staff.`,
      );
    }

    appointment.status = AppointmentStatus.CANCELLED;
    appointment.cancellation_reason = cancelDto.cancellation_reason;
    appointment.cancelled_at = new Date();
    appointment.cancelled_by = userId;

    // TODO: Process refund if applicable
    // TODO: Send cancellation notification

    return this.appointmentRepository.save(appointment);
  }

  private async generateAppointmentNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.appointmentRepository.count({
      where: { tenant_id: tenantId },
    });

    return `APT-${year}-${String(count + 1).padStart(6, '0')}`;
  }

  private validateStatusTransition(currentStatus: AppointmentStatus, newStatus: AppointmentStatus): void {
    const validTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
      [AppointmentStatus.PENDING]: [AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED],
      [AppointmentStatus.CONFIRMED]: [
        AppointmentStatus.CHECKED_IN,
        AppointmentStatus.CANCELLED,
        AppointmentStatus.NO_SHOW,
      ],
      [AppointmentStatus.CHECKED_IN]: [AppointmentStatus.IN_PROGRESS, AppointmentStatus.CANCELLED],
      [AppointmentStatus.IN_PROGRESS]: [AppointmentStatus.COMPLETED],
      [AppointmentStatus.COMPLETED]: [],
      [AppointmentStatus.CANCELLED]: [],
      [AppointmentStatus.NO_SHOW]: [],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }
}
