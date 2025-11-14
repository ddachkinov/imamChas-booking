import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import { Service } from '../../services/entities/service.entity';
import { StaffMember } from '../../staff/entities/staff-member.entity';
import { StaffSkill } from '../../staff/entities/staff-skill.entity';
import { Availability, AvailabilityType } from '../../staff/entities/availability.entity';
import { Location } from '../../locations/entities/location.entity';
import { CheckAvailabilityDto, AvailableSlot } from '../dto/check-availability.dto';
import * as dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(StaffMember)
    private readonly staffRepository: Repository<StaffMember>,
    @InjectRepository(StaffSkill)
    private readonly staffSkillRepository: Repository<StaffSkill>,
    @InjectRepository(Availability)
    private readonly availabilityRepository: Repository<Availability>,
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
  ) {}

  async checkAvailability(
    tenantId: string,
    dto: CheckAvailabilityDto,
  ): Promise<AvailableSlot[]> {
    // 1. Get service details
    const service = await this.serviceRepository.findOne({
      where: { id: dto.service_id, tenant_id: tenantId },
    });

    if (!service) {
      throw new Error('Service not found');
    }

    // 2. Get location (use provided or get primary location)
    const location = dto.location_id
      ? await this.locationRepository.findOne({
          where: { id: dto.location_id, tenant_id: tenantId },
        })
      : await this.locationRepository.findOne({
          where: { business_id: dto.business_id, tenant_id: tenantId },
          order: { created_at: 'ASC' },
        });

    if (!location) {
      throw new Error('Location not found');
    }

    // 3. Get staff members who can perform this service
    const staffQuery = this.staffSkillRepository
      .createQueryBuilder('skill')
      .leftJoinAndSelect('skill.staffMember', 'staff')
      .leftJoinAndSelect('staff.user', 'user')
      .where('skill.service_id = :serviceId', { serviceId: service.id })
      .andWhere('skill.tenant_id = :tenantId', { tenantId })
      .andWhere('staff.status = :status', { status: 'active' })
      .andWhere('staff.accepts_online_bookings = :accepts', { accepts: true });

    if (dto.staff_member_id) {
      staffQuery.andWhere('staff.id = :staffId', { staffId: dto.staff_member_id });
    }

    const staffSkills = await staffQuery.getMany();

    if (staffSkills.length === 0) {
      return []; // No staff available for this service
    }

    // 4. Generate slots for each day in range
    const startDate = dayjs(dto.start_date).tz(dto.timezone || location.timezone);
    const endDate = dayjs(dto.end_date).tz(dto.timezone || location.timezone);
    const allSlots: AvailableSlot[] = [];

    // Process each day
    for (let date = startDate; date.isBefore(endDate) || date.isSame(endDate, 'day'); date = date.add(1, 'day')) {
      const dayOfWeek = date.day(); // 0 = Sunday
      const dateStr = date.format('YYYY-MM-DD');

      // Get operating hours for this day
      const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek];
      const operatingHours = location.operating_hours?.[dayName];

      if (!operatingHours || operatingHours.closed) {
        continue; // Location closed on this day
      }

      // For each staff member, calculate their available slots
      for (const staffSkill of staffSkills) {
        const staff = staffSkill.staffMember;

        // Get staff availability for this day
        const staffAvailability = await this.getStaffAvailabilityForDate(
          staff.id,
          date.toDate(),
          dayOfWeek,
        );

        if (!staffAvailability.length) {
          continue; // Staff not available this day
        }

        // Get existing appointments for this staff member on this day
        const dayStart = date.startOf('day').toDate();
        const dayEnd = date.endOf('day').toDate();

        const existingAppointments = await this.appointmentRepository.find({
          where: {
            staff_member_id: staff.id,
            tenant_id: tenantId,
            start_time: Between(dayStart, dayEnd),
            status: Between(AppointmentStatus.PENDING, AppointmentStatus.IN_PROGRESS),
          },
          order: { start_time: 'ASC' },
        });

        // Generate slots for this staff member
        const staffSlots = this.generateSlotsForStaff(
          date,
          operatingHours,
          staffAvailability,
          existingAppointments,
          service,
          staff,
          location,
          dto.timezone || location.timezone,
        );

        allSlots.push(...staffSlots);
      }
    }

    // Sort by start time
    return allSlots.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }

  private async getStaffAvailabilityForDate(
    staffId: string,
    date: Date,
    dayOfWeek: number,
  ): Promise<Availability[]> {
    const dateStr = dayjs(date).format('YYYY-MM-DD');

    // Get recurring availability for this day of week
    const recurring = await this.availabilityRepository.find({
      where: {
        staff_member_id: staffId,
        type: AvailabilityType.RECURRING,
        day_of_week: dayOfWeek,
        is_available: true,
      },
    });

    // Get one-time availability for this specific date
    const oneTime = await this.availabilityRepository.find({
      where: {
        staff_member_id: staffId,
        type: AvailabilityType.ONE_TIME,
        start_date: Between(new Date(dateStr), new Date(dateStr + 'T23:59:59')),
        is_available: true,
      },
    });

    // Get time-off for this date
    const timeOff = await this.availabilityRepository.find({
      where: {
        staff_member_id: staffId,
        type: AvailabilityType.TIME_OFF,
        is_available: false,
      },
    });

    // Check if there's time-off that covers this date
    const hasTimeOff = timeOff.some((off) => {
      const offStart = dayjs(off.start_date);
      const offEnd = dayjs(off.end_date);
      const checkDate = dayjs(date);
      return checkDate.isSame(offStart, 'day') || checkDate.isSame(offEnd, 'day') ||
             (checkDate.isAfter(offStart) && checkDate.isBefore(offEnd));
    });

    if (hasTimeOff) {
      return []; // Staff on time-off
    }

    // One-time availability overrides recurring
    if (oneTime.length > 0) {
      return oneTime;
    }

    return recurring;
  }

  private generateSlotsForStaff(
    date: dayjs.Dayjs,
    operatingHours: { open: string; close: string },
    staffAvailability: Availability[],
    existingAppointments: Appointment[],
    service: Service,
    staff: StaffMember,
    location: Location,
    timezone: string,
  ): AvailableSlot[] {
    const slots: AvailableSlot[] = [];
    const slotIncrement = 15; // 15-minute increments
    const serviceDuration = service.duration_minutes;
    const bufferBefore = staff.default_buffer_before_minutes || service.buffer_before_minutes;
    const bufferAfter = staff.default_buffer_after_minutes || service.buffer_after_minutes;

    // For each availability block
    for (const availability of staffAvailability) {
      // Parse availability times
      const [availStartHour, availStartMin] = availability.start_time.split(':').map(Number);
      const [availEndHour, availEndMin] = availability.end_time.split(':').map(Number);

      let slotStart = date.hour(availStartHour).minute(availStartMin).second(0);
      const blockEnd = date.hour(availEndHour).minute(availEndMin).second(0);

      // Also respect operating hours
      const [opStartHour, opStartMin] = operatingHours.open.split(':').map(Number);
      const [opEndHour, opEndMin] = operatingHours.close.split(':').map(Number);
      const opStart = date.hour(opStartHour).minute(opStartMin);
      const opEnd = date.hour(opEndHour).minute(opEndMin);

      // Use the more restrictive start/end times
      if (slotStart.isBefore(opStart)) {
        slotStart = opStart;
      }
      const effectiveEnd = blockEnd.isAfter(opEnd) ? opEnd : blockEnd;

      // Generate slots in increments
      while (slotStart.add(serviceDuration, 'minute').isBefore(effectiveEnd) ||
             slotStart.add(serviceDuration, 'minute').isSame(effectiveEnd)) {
        const slotEnd = slotStart.add(serviceDuration, 'minute');

        // Check if this slot conflicts with existing appointments
        const hasConflict = existingAppointments.some((apt) => {
          const aptStart = dayjs(apt.start_time).subtract(bufferBefore, 'minute');
          const aptEnd = dayjs(apt.end_time).add(bufferAfter, 'minute');
          return slotStart.isBefore(aptEnd) && slotEnd.isAfter(aptStart);
        });

        if (!hasConflict && slotStart.isAfter(dayjs())) {
          // Slot is available and in the future
          slots.push({
            start_time: slotStart.tz(timezone).toISOString(),
            end_time: slotEnd.tz(timezone).toISOString(),
            staff_member_id: staff.id,
            staff_member_name: `${staff.user.first_name} ${staff.user.last_name}`,
            location_id: location.id,
            price: service.price,
            deposit_amount: service.deposit_amount || 0,
          });
        }

        slotStart = slotStart.add(slotIncrement, 'minute');
      }
    }

    return slots;
  }
}
