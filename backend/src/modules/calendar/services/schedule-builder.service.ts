import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { StaffMember } from '../../staff/entities/staff-member.entity';
import { Availability } from '../../staff/entities/availability.entity';
import { ScheduleSummary } from '../types/calendar-responses';
import * as dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

@Injectable()
export class ScheduleBuilderService {
  private readonly logger = new Logger(ScheduleBuilderService.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(StaffMember)
    private readonly staffMemberRepository: Repository<StaffMember>,
    @InjectRepository(Availability)
    private readonly availabilityRepository: Repository<Availability>,
  ) {}

  /**
   * Generate schedule summary for staff member on specific date
   */
  async generateScheduleSummary(
    tenantId: string,
    staffMemberId: string,
    date: Date,
  ): Promise<ScheduleSummary> {
    const startOfDay = dayjs(date).startOf('day').toDate();
    const endOfDay = dayjs(date).endOf('day').toDate();

    // Get appointments for the day
    const appointments = await this.appointmentRepository.find({
      where: {
        tenant_id: tenantId,
        staff_member_id: staffMemberId,
        start_time: Between(startOfDay, endOfDay),
      },
      relations: ['service'],
      order: { start_time: 'ASC' },
    });

    // Get staff availability for the day
    const dayOfWeek = dayjs(date).day(); // 0=Sunday
    const availability = await this.availabilityRepository.find({
      where: {
        staff_member_id: staffMemberId,
        day_of_week: dayOfWeek,
        is_available: true,
      },
    });

    // Calculate hours worked (sum of appointment durations)
    const hoursWorked = appointments.reduce((sum, apt) => {
      return sum + (apt.duration_minutes || 0);
    }, 0) / 60;

    // Calculate total revenue
    const totalRevenue = appointments.reduce((sum, apt) => {
      return sum + parseFloat(apt.price?.toString() || '0');
    }, 0);

    // Calculate available hours from staff availability
    let availableHours = 0;
    for (const avail of availability) {
      const start = dayjs(avail.start_time, 'HH:mm');
      const end = dayjs(avail.end_time, 'HH:mm');
      const diff = end.diff(start, 'minute') / 60;
      availableHours += diff;
    }

    // Default to 8 hours if no availability set
    if (availableHours === 0) {
      availableHours = 8;
    }

    // Calculate utilization percentage
    const utilizationPercent = availableHours > 0 ? (hoursWorked / availableHours) * 100 : 0;

    // Find gaps in schedule
    const gaps = this.findScheduleGaps(appointments);

    return {
      date: dayjs(date).format('YYYY-MM-DD'),
      hours_worked: Math.round(hoursWorked * 100) / 100,
      appointments_count: appointments.length,
      total_revenue: Math.round(totalRevenue * 100) / 100,
      utilization_percent: Math.round(utilizationPercent * 100) / 100,
      gaps,
    };
  }

  /**
   * Find gaps between appointments in schedule
   */
  private findScheduleGaps(
    appointments: Appointment[],
  ): Array<{ start: string; end: string; duration_minutes: number }> {
    const gaps: Array<{ start: string; end: string; duration_minutes: number }> = [];

    // Sort appointments by start time
    const sorted = [...appointments].sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    );

    // Find gaps between consecutive appointments
    for (let i = 0; i < sorted.length - 1; i++) {
      const currentEnd = dayjs(sorted[i].end_time);
      const nextStart = dayjs(sorted[i + 1].start_time);

      const gapMinutes = nextStart.diff(currentEnd, 'minute');

      // Only consider gaps of 15 minutes or more
      if (gapMinutes >= 15) {
        gaps.push({
          start: currentEnd.toISOString(),
          end: nextStart.toISOString(),
          duration_minutes: gapMinutes,
        });
      }
    }

    return gaps;
  }

  /**
   * Generate schedule summaries for date range
   */
  async generateScheduleRange(
    tenantId: string,
    staffMemberId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ScheduleSummary[]> {
    const summaries: ScheduleSummary[] = [];
    let current = dayjs(startDate);
    const end = dayjs(endDate);

    while (current.isSameOrBefore(end, 'day')) {
      const summary = await this.generateScheduleSummary(
        tenantId,
        staffMemberId,
        current.toDate(),
      );
      summaries.push(summary);
      current = current.add(1, 'day');
    }

    return summaries;
  }

  /**
   * Calculate average utilization for staff member over period
   */
  async calculateAverageUtilization(
    tenantId: string,
    staffMemberId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const summaries = await this.generateScheduleRange(
      tenantId,
      staffMemberId,
      startDate,
      endDate,
    );

    if (summaries.length === 0) {
      return 0;
    }

    const totalUtilization = summaries.reduce(
      (sum, summary) => sum + summary.utilization_percent,
      0,
    );

    return Math.round((totalUtilization / summaries.length) * 100) / 100;
  }
}
