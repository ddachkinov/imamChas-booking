import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import * as dayjs from 'dayjs';

@Injectable()
export class ConflictResolverService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
  ) {}

  /**
   * Check if a time slot is available for booking (no conflicts)
   * Uses database-level locking to prevent race conditions
   */
  async validateSlotAvailable(
    staffMemberId: string,
    startTime: Date,
    endTime: Date,
    bufferBefore: number,
    bufferAfter: number,
    excludeAppointmentId?: string,
  ): Promise<void> {
    // Calculate effective time range including buffers
    const effectiveStart = dayjs(startTime).subtract(bufferBefore, 'minute').toDate();
    const effectiveEnd = dayjs(endTime).add(bufferAfter, 'minute').toDate();

    // Query for overlapping appointments with pessimistic locking
    const queryBuilder = this.appointmentRepository
      .createQueryBuilder('appointment')
      .setLock('pessimistic_write') // Database row lock
      .where('appointment.staff_member_id = :staffMemberId', { staffMemberId })
      .andWhere('appointment.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
      })
      .andWhere(
        `(
          (appointment.start_time <= :effectiveEnd AND appointment.end_time > :effectiveStart) OR
          (appointment.start_time < :effectiveEnd AND appointment.end_time >= :effectiveStart) OR
          (appointment.start_time >= :effectiveStart AND appointment.end_time <= :effectiveEnd)
        )`,
        { effectiveStart, effectiveEnd },
      );

    if (excludeAppointmentId) {
      queryBuilder.andWhere('appointment.id != :excludeId', { excludeId: excludeAppointmentId });
    }

    const conflicts = await queryBuilder.getMany();

    if (conflicts.length > 0) {
      // Build helpful error message
      const conflictTimes = conflicts.map((apt) =>
        `${dayjs(apt.start_time).format('HH:mm')}-${dayjs(apt.end_time).format('HH:mm')}`
      ).join(', ');

      throw new ConflictException(
        `Time slot is no longer available. Conflicts with existing appointments at: ${conflictTimes}`,
      );
    }
  }

  /**
   * Check for conflicts when rescheduling an appointment
   */
  async validateReschedule(
    appointmentId: string,
    staffMemberId: string,
    newStartTime: Date,
    newEndTime: Date,
    bufferBefore: number,
    bufferAfter: number,
  ): Promise<void> {
    await this.validateSlotAvailable(
      staffMemberId,
      newStartTime,
      newEndTime,
      bufferBefore,
      bufferAfter,
      appointmentId, // Exclude the appointment being rescheduled
    );
  }

  /**
   * Validate recurring appointment slots (all instances)
   */
  async validateRecurringSlots(
    staffMemberId: string,
    appointmentSlots: Array<{ startTime: Date; endTime: Date }>,
    bufferBefore: number,
    bufferAfter: number,
  ): Promise<void> {
    for (const slot of appointmentSlots) {
      try {
        await this.validateSlotAvailable(
          staffMemberId,
          slot.startTime,
          slot.endTime,
          bufferBefore,
          bufferAfter,
        );
      } catch (error) {
        throw new ConflictException(
          `Recurring series cannot be booked. Conflict found at ${dayjs(slot.startTime).format('YYYY-MM-DD HH:mm')}. ${error.message}`,
        );
      }
    }
  }

  /**
   * Get overlapping appointments for display purposes (no locking)
   */
  async getOverlappingAppointments(
    staffMemberId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<Appointment[]> {
    return this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.staff_member_id = :staffMemberId', { staffMemberId })
      .andWhere('appointment.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
      })
      .andWhere(
        '(appointment.start_time < :endTime AND appointment.end_time > :startTime)',
        { startTime, endTime },
      )
      .orderBy('appointment.start_time', 'ASC')
      .getMany();
  }
}
