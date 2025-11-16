import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, Not } from 'typeorm';
import { Appointment, AppointmentStatus } from '../../appointments/entities/appointment.entity';
import { StaffMember } from '../../staff/entities/staff-member.entity';
import { Location } from '../../locations/entities/location.entity';
import { Service } from '../../services/entities/service.entity';
import { BlockedTime } from '../entities/blocked-time.entity';
import {
  DayViewResponse,
  WeekViewResponse,
  MonthViewResponse,
  ResourceViewResponse,
  AppointmentSummary,
  TimeSlot,
  BusinessHours,
  StaffSummary,
  DayColumn,
  DayCell,
  Week,
  MonthSummary,
  StaffResource,
  Conflict,
} from '../types/calendar-responses';
import { CalendarViewDto, CalendarViewType } from '../dto/calendar-view.dto';
import * as dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(StaffMember)
    private readonly staffMemberRepository: Repository<StaffMember>,
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(BlockedTime)
    private readonly blockedTimeRepository: Repository<BlockedTime>,
  ) {}

  /**
   * Get calendar view based on type
   */
  async getCalendarView(
    tenantId: string,
    dto: CalendarViewDto,
  ): Promise<DayViewResponse | WeekViewResponse | MonthViewResponse | ResourceViewResponse> {
    switch (dto.view) {
      case CalendarViewType.DAY:
        return this.getDayView(tenantId, dto);
      case CalendarViewType.WEEK:
        return this.getWeekView(tenantId, dto);
      case CalendarViewType.MONTH:
        return this.getMonthView(tenantId, dto);
      case CalendarViewType.RESOURCE:
        return this.getResourceView(tenantId, dto);
      default:
        throw new Error(`Unsupported view type: ${dto.view}`);
    }
  }

  /**
   * Generate day view for a single staff member
   */
  async getDayView(tenantId: string, dto: CalendarViewDto): Promise<DayViewResponse> {
    const tz = dto.timezone || 'UTC';
    const date = dayjs(dto.start_date).tz(tz);

    // Get staff member (use first from filter or find default)
    const staffId = dto.staff_member_ids?.[0];
    if (!staffId) {
      throw new Error('Staff member ID required for day view');
    }

    const staff = await this.staffMemberRepository.findOne({
      where: { id: staffId, tenant_id: tenantId },
      relations: ['user'],
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    // Get business hours
    let businessHours: BusinessHours = { open: '09:00', close: '17:00', is_closed: false };
    if (dto.location_id) {
      const location = await this.locationRepository.findOne({
        where: { id: dto.location_id, tenant_id: tenantId },
      });

      if (location?.operating_hours) {
        const dayName = date.format('dddd').toLowerCase();
        const dayHours = location.operating_hours[dayName];
        if (dayHours) {
          businessHours = {
            open: dayHours.open || '09:00',
            close: dayHours.close || '17:00',
            is_closed: dayHours.closed || false,
          };
        }
      }
    }

    // Get appointments for the day
    const startOfDay = date.startOf('day').toDate();
    const endOfDay = date.endOf('day').toDate();

    const appointments = await this.appointmentRepository.find({
      where: {
        tenant_id: tenantId,
        staff_member_id: staffId,
        start_time: Between(startOfDay, endOfDay),
        status: Not(In([AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW])),
      },
      relations: ['client', 'client.user', 'service'],
      order: { start_time: 'ASC' },
    });

    // Get blocked times
    let blockedTimes = [];
    if (dto.include_blocked_time) {
      blockedTimes = await this.blockedTimeRepository.find({
        where: {
          tenant_id: tenantId,
          staff_member_id: staffId,
          start_time: Between(startOfDay, endOfDay),
        },
        order: { start_time: 'ASC' },
      });
    }

    // Generate time slots
    const timeSlots = this.generateTimeSlots(
      businessHours.open,
      businessHours.close,
      date,
      tz,
      appointments,
      blockedTimes,
    );

    // Map appointments to summaries
    const appointmentSummaries = appointments.map((apt) =>
      this.mapToAppointmentSummary(apt),
    );

    return {
      date: date.format('YYYY-MM-DD'),
      timezone: tz,
      business_hours: businessHours,
      time_slots: timeSlots,
      appointments: appointmentSummaries,
      blocked_times: blockedTimes,
      staff_member: {
        id: staff.id,
        name: staff.user ? `${staff.user.first_name} ${staff.user.last_name}` : 'Staff',
        color: this.getStaffColor(staff.id),
      },
    };
  }

  /**
   * Generate week view showing Monday through Sunday
   */
  async getWeekView(tenantId: string, dto: CalendarViewDto): Promise<WeekViewResponse> {
    const tz = dto.timezone || 'UTC';
    const startDate = dayjs(dto.start_date).tz(tz).startOf('week').add(1, 'day'); // Monday
    const endDate = startDate.add(6, 'day'); // Sunday

    const days: DayColumn[] = [];

    // Get appointments for the entire week
    const appointments = await this.appointmentRepository.find({
      where: {
        tenant_id: tenantId,
        start_time: Between(startDate.toDate(), endDate.toDate()),
        ...(dto.staff_member_ids?.length && {
          staff_member_id: In(dto.staff_member_ids),
        }),
        ...(dto.location_id && { location_id: dto.location_id }),
      },
      relations: ['client', 'client.user', 'service', 'staffMember', 'staffMember.user'],
      order: { start_time: 'ASC' },
    });

    // Generate day columns
    for (let i = 0; i < 7; i++) {
      const currentDate = startDate.add(i, 'day');
      const dayStart = currentDate.startOf('day');
      const dayEnd = currentDate.endOf('day');

      // Filter appointments for this day
      const dayAppointments = appointments.filter((apt) =>
        dayjs(apt.start_time).isBetween(dayStart, dayEnd, null, '[]'),
      );

      days.push({
        date: currentDate.format('YYYY-MM-DD'),
        day_name: currentDate.format('dddd'),
        is_today: currentDate.isSame(dayjs(), 'day'),
        appointment_count: dayAppointments.length,
        appointments: dayAppointments.map((apt) => this.mapToAppointmentSummary(apt)),
        business_hours: { open: '09:00', close: '17:00', is_closed: false },
      });
    }

    // Get staff members
    let staffMembers: StaffSummary[] = [];
    if (dto.staff_member_ids?.length) {
      const staff = await this.staffMemberRepository.find({
        where: {
          id: In(dto.staff_member_ids),
          tenant_id: tenantId,
        },
        relations: ['user'],
      });

      staffMembers = staff.map((s) => ({
        id: s.id,
        name: s.user ? `${s.user.first_name} ${s.user.last_name}` : 'Staff',
        color: this.getStaffColor(s.id),
      }));
    }

    return {
      start_date: startDate.format('YYYY-MM-DD'),
      end_date: endDate.format('YYYY-MM-DD'),
      timezone: tz,
      days,
      staff_members: staffMembers,
    };
  }

  /**
   * Generate month view showing calendar grid
   */
  async getMonthView(tenantId: string, dto: CalendarViewDto): Promise<MonthViewResponse> {
    const tz = dto.timezone || 'UTC';
    const date = dayjs(dto.start_date).tz(tz);
    const year = date.year();
    const month = date.month() + 1; // 1-12

    const firstDayOfMonth = date.startOf('month');
    const lastDayOfMonth = date.endOf('month');

    // Get all appointments for the month
    const appointments = await this.appointmentRepository.find({
      where: {
        tenant_id: tenantId,
        start_time: Between(firstDayOfMonth.toDate(), lastDayOfMonth.toDate()),
        ...(dto.location_id && { location_id: dto.location_id }),
      },
      relations: ['service'],
    });

    // Count appointments by date
    const appointmentCounts: Record<string, number> = {};
    let totalRevenue = 0;

    for (const apt of appointments) {
      const dateKey = dayjs(apt.start_time).format('YYYY-MM-DD');
      appointmentCounts[dateKey] = (appointmentCounts[dateKey] || 0) + 1;

      // Assume price is stored in appointment or service
      if (apt.price) {
        totalRevenue += parseFloat(apt.price.toString());
      }
    }

    // Generate calendar grid (weeks)
    const weeks: Week[] = [];
    let currentDate = firstDayOfMonth.startOf('week').add(1, 'day'); // Start from Monday

    while (currentDate.isBefore(lastDayOfMonth.endOf('week'))) {
      const week: Week = { days: [] };

      for (let i = 0; i < 7; i++) {
        const dateKey = currentDate.format('YYYY-MM-DD');

        week.days.push({
          date: dateKey,
          day: currentDate.date(),
          is_today: currentDate.isSame(dayjs(), 'day'),
          is_current_month: currentDate.month() === firstDayOfMonth.month(),
          is_disabled: false,
          appointment_count: appointmentCounts[dateKey] || 0,
        });

        currentDate = currentDate.add(1, 'day');
      }

      weeks.push(week);
    }

    const summary: MonthSummary = {
      total_appointments: appointments.length,
      total_revenue: totalRevenue,
      average_per_day: appointments.length / lastDayOfMonth.date(),
    };

    return {
      year,
      month,
      timezone: tz,
      weeks,
      appointment_counts: appointmentCounts,
      summary,
    };
  }

  /**
   * Generate resource view showing multiple staff side-by-side
   */
  async getResourceView(tenantId: string, dto: CalendarViewDto): Promise<ResourceViewResponse> {
    const tz = dto.timezone || 'UTC';
    const startTime = dayjs(dto.start_date).tz(tz);
    const endTime = dto.end_date ? dayjs(dto.end_date).tz(tz) : startTime.endOf('day');

    if (!dto.staff_member_ids?.length) {
      throw new Error('Staff member IDs required for resource view');
    }

    // Get staff members
    const staff = await this.staffMemberRepository.find({
      where: {
        id: In(dto.staff_member_ids),
        tenant_id: tenantId,
      },
      relations: ['user'],
    });

    // Get appointments for all staff in time range
    const appointments = await this.appointmentRepository.find({
      where: {
        tenant_id: tenantId,
        staff_member_id: In(dto.staff_member_ids),
        start_time: Between(startTime.toDate(), endTime.toDate()),
      },
      relations: ['client', 'client.user', 'service'],
      order: { start_time: 'ASC' },
    });

    // Get blocked times
    const blockedTimes = await this.blockedTimeRepository.find({
      where: {
        tenant_id: tenantId,
        staff_member_id: In(dto.staff_member_ids),
        start_time: Between(startTime.toDate(), endTime.toDate()),
      },
    });

    // Generate time slots (15-minute increments)
    const timeSlots: string[] = [];
    let current = startTime.startOf('hour');
    const end = endTime.endOf('hour');

    while (current.isBefore(end)) {
      timeSlots.push(current.format('HH:mm'));
      current = current.add(15, 'minute');
    }

    // Build staff resources
    const staffResources: StaffResource[] = staff.map((s) => {
      const staffAppointments = appointments.filter(
        (apt) => apt.staff_member_id === s.id,
      );
      const staffBlockedTimes = blockedTimes.filter((bt) => bt.staff_member_id === s.id);

      return {
        staff_id: s.id,
        staff_name: s.user ? `${s.user.first_name} ${s.user.last_name}` : 'Staff',
        color: this.getStaffColor(s.id),
        availability: [], // TODO: Get from staff availability
        appointments: staffAppointments.map((apt) => this.mapToAppointmentSummary(apt)),
        blocked_times: staffBlockedTimes,
      };
    });

    // Detect conflicts (overlapping appointments for same staff)
    const conflicts: Conflict[] = this.detectConflicts(appointments);

    return {
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      timezone: tz,
      time_slots: timeSlots,
      staff_resources: staffResources,
      conflicts,
    };
  }

  /**
   * Generate time slots for day view
   */
  private generateTimeSlots(
    openTime: string,
    closeTime: string,
    date: dayjs.Dayjs,
    timezone: string,
    appointments: Appointment[],
    blockedTimes: any[],
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const [openHour, openMinute] = openTime.split(':').map(Number);
    const [closeHour, closeMinute] = closeTime.split(':').map(Number);

    let current = date.hour(openHour).minute(openMinute).second(0);
    const end = date.hour(closeHour).minute(closeMinute).second(0);

    while (current.isBefore(end)) {
      const slotStart = current;
      const slotEnd = current.add(15, 'minute');

      // Check if appointments overlap this slot
      const slotAppointments = appointments.filter((apt) =>
        this.timeRangesOverlap(
          slotStart.toDate(),
          slotEnd.toDate(),
          apt.start_time,
          apt.end_time,
        ),
      );

      // Check if blocked time overlaps this slot
      const blockedTime = blockedTimes.find((bt) =>
        this.timeRangesOverlap(
          slotStart.toDate(),
          slotEnd.toDate(),
          bt.start_time,
          bt.end_time,
        ),
      );

      slots.push({
        time: current.format('HH:mm'),
        timestamp: current.toISOString(),
        is_available: slotAppointments.length === 0 && !blockedTime,
        is_past: current.isBefore(dayjs()),
        appointments: slotAppointments.map((apt) => this.mapToAppointmentSummary(apt)),
        blocked_time: blockedTime,
      });

      current = current.add(15, 'minute');
    }

    return slots;
  }

  /**
   * Map appointment to summary format
   */
  private mapToAppointmentSummary(appointment: Appointment): AppointmentSummary {
    const clientName = appointment.client?.user
      ? `${appointment.client.user.first_name} ${appointment.client.user.last_name}`
      : 'Client';

    const initials = clientName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();

    return {
      id: appointment.id,
      appointment_number: appointment.appointment_number,
      client_name: clientName,
      client_initials: initials,
      service_name: appointment.service?.name || 'Service',
      start_time: dayjs(appointment.start_time).toISOString(),
      end_time: dayjs(appointment.end_time).toISOString(),
      duration_minutes: appointment.duration_minutes,
      status: appointment.status,
      color: this.getAppointmentColor(appointment.status),
      recurring_icon: appointment.is_recurring,
      group_size: appointment.group_size || 1,
    };
  }

  /**
   * Check if two time ranges overlap
   */
  private timeRangesOverlap(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date,
  ): boolean {
    return dayjs(start1).isBefore(end2) && dayjs(end1).isAfter(start2);
  }

  /**
   * Detect conflicts (overlapping appointments)
   */
  private detectConflicts(appointments: Appointment[]): Conflict[] {
    const conflicts: Conflict[] = [];
    const grouped = new Map<string, Appointment[]>();

    // Group by staff
    for (const apt of appointments) {
      if (!grouped.has(apt.staff_member_id)) {
        grouped.set(apt.staff_member_id, []);
      }
      grouped.get(apt.staff_member_id).push(apt);
    }

    // Check for overlaps within each staff
    for (const [staffId, staffApts] of grouped.entries()) {
      for (let i = 0; i < staffApts.length; i++) {
        for (let j = i + 1; j < staffApts.length; j++) {
          if (
            this.timeRangesOverlap(
              staffApts[i].start_time,
              staffApts[i].end_time,
              staffApts[j].start_time,
              staffApts[j].end_time,
            )
          ) {
            conflicts.push({
              staff_id: staffId,
              appointment_ids: [staffApts[i].id, staffApts[j].id],
              time: dayjs(staffApts[i].start_time).toISOString(),
              message: 'Overlapping appointments',
            });
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Get color for staff (deterministic based on ID)
   */
  private getStaffColor(staffId: string): string {
    const colors = [
      '#3B82F6', // blue
      '#10B981', // green
      '#F59E0B', // amber
      '#EF4444', // red
      '#8B5CF6', // purple
      '#06B6D4', // cyan
      '#F97316', // orange
      '#EC4899', // pink
    ];

    // Simple hash function
    const hash = staffId
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }

  /**
   * Get color for appointment based on status
   */
  private getAppointmentColor(status: AppointmentStatus): string {
    const colorMap = {
      [AppointmentStatus.PENDING]: '#F59E0B', // amber
      [AppointmentStatus.CONFIRMED]: '#3B82F6', // blue
      [AppointmentStatus.CHECKED_IN]: '#8B5CF6', // purple
      [AppointmentStatus.IN_PROGRESS]: '#10B981', // green
      [AppointmentStatus.COMPLETED]: '#6B7280', // gray
      [AppointmentStatus.CANCELLED]: '#EF4444', // red
      [AppointmentStatus.NO_SHOW]: '#DC2626', // dark red
    };

    return colorMap[status] || '#3B82F6';
  }
}
