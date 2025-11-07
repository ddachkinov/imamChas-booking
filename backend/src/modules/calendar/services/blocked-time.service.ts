import { Injectable, Logger, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { BlockedTime } from '../entities/blocked-time.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { CreateBlockedTimeDto } from '../dto/create-blocked-time.dto';
import * as dayjs from 'dayjs';

@Injectable()
export class BlockedTimeService {
  private readonly logger = new Logger(BlockedTimeService.name);

  constructor(
    @InjectRepository(BlockedTime)
    private readonly blockedTimeRepository: Repository<BlockedTime>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
  ) {}

  /**
   * Create blocked time period
   */
  async create(
    tenantId: string,
    userId: string,
    dto: CreateBlockedTimeDto,
  ): Promise<BlockedTime | BlockedTime[]> {
    // Check for conflicts with existing appointments
    const conflicts = await this.checkConflicts(
      tenantId,
      dto.staff_member_id,
      new Date(dto.start_time),
      new Date(dto.end_time),
    );

    if (conflicts.length > 0) {
      throw new ConflictException(
        `Cannot create blocked time: conflicts with ${conflicts.length} existing appointment(s)`,
      );
    }

    if (dto.is_recurring && dto.recurrence_rule) {
      // TODO: Parse recurrence rule and create multiple blocked times
      // For now, just create single blocked time
      this.logger.warn('Recurring blocked time not fully implemented - creating single instance');
    }

    const blockedTime = this.blockedTimeRepository.create({
      tenant_id: tenantId,
      staff_member_id: dto.staff_member_id,
      location_id: dto.location_id,
      title: dto.title,
      description: dto.description,
      start_time: new Date(dto.start_time),
      end_time: new Date(dto.end_time),
      is_recurring: dto.is_recurring || false,
      recurrence_rule: dto.recurrence_rule,
      color: dto.color || '#9CA3AF',
      created_by: userId,
    });

    const saved = await this.blockedTimeRepository.save(blockedTime);

    this.logger.log(`Created blocked time ${saved.id} for staff ${dto.staff_member_id}`);

    return saved;
  }

  /**
   * Get blocked times for staff member and date range
   */
  async getBlockedTimes(
    tenantId: string,
    staffMemberId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<BlockedTime[]> {
    return this.blockedTimeRepository.find({
      where: {
        tenant_id: tenantId,
        staff_member_id: staffMemberId,
        start_time: Between(startDate, endDate),
      },
      order: { start_time: 'ASC' },
    });
  }

  /**
   * Delete blocked time
   */
  async delete(
    tenantId: string,
    blockedTimeId: string,
  ): Promise<void> {
    const blockedTime = await this.blockedTimeRepository.findOne({
      where: { id: blockedTimeId, tenant_id: tenantId },
    });

    if (!blockedTime) {
      throw new NotFoundException('Blocked time not found');
    }

    await this.blockedTimeRepository.softDelete(blockedTimeId);

    this.logger.log(`Deleted blocked time ${blockedTimeId}`);
  }

  /**
   * Check for conflicts between blocked time and existing appointments
   */
  private async checkConflicts(
    tenantId: string,
    staffMemberId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<Appointment[]> {
    // Find appointments that overlap with the blocked time
    const appointments = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.tenant_id = :tenantId', { tenantId })
      .andWhere('appointment.staff_member_id = :staffMemberId', { staffMemberId })
      .andWhere('appointment.start_time < :endTime', { endTime })
      .andWhere('appointment.end_time > :startTime', { startTime })
      .andWhere("appointment.status NOT IN ('cancelled', 'no_show')")
      .getMany();

    return appointments;
  }

  /**
   * Update blocked time
   */
  async update(
    tenantId: string,
    blockedTimeId: string,
    updates: Partial<CreateBlockedTimeDto>,
  ): Promise<BlockedTime> {
    const blockedTime = await this.blockedTimeRepository.findOne({
      where: { id: blockedTimeId, tenant_id: tenantId },
    });

    if (!blockedTime) {
      throw new NotFoundException('Blocked time not found');
    }

    // Check for conflicts if times are being updated
    if (updates.start_time || updates.end_time) {
      const newStartTime = updates.start_time
        ? new Date(updates.start_time)
        : blockedTime.start_time;
      const newEndTime = updates.end_time
        ? new Date(updates.end_time)
        : blockedTime.end_time;

      const conflicts = await this.checkConflicts(
        tenantId,
        blockedTime.staff_member_id,
        newStartTime,
        newEndTime,
      );

      if (conflicts.length > 0) {
        throw new ConflictException(
          `Cannot update blocked time: conflicts with ${conflicts.length} existing appointment(s)`,
        );
      }
    }

    Object.assign(blockedTime, {
      ...(updates.title && { title: updates.title }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.start_time && { start_time: new Date(updates.start_time) }),
      ...(updates.end_time && { end_time: new Date(updates.end_time) }),
      ...(updates.color && { color: updates.color }),
    });

    return this.blockedTimeRepository.save(blockedTime);
  }
}
