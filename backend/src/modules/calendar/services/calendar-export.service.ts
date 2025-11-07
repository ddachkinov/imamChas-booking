import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { ExportCalendarDto, ExportFormat } from '../dto/export-calendar.dto';
import * as ical from 'ical-generator';
import * as dayjs from 'dayjs';

@Injectable()
export class CalendarExportService {
  private readonly logger = new Logger(CalendarExportService.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
  ) {}

  /**
   * Export calendar to specified format
   */
  async exportCalendar(
    tenantId: string,
    dto: ExportCalendarDto,
  ): Promise<{ content: string; filename: string; mimeType: string }> {
    // Get appointments in date range
    const appointments = await this.appointmentRepository.find({
      where: {
        tenant_id: tenantId,
        start_time: Between(new Date(dto.start_date), new Date(dto.end_date)),
        ...(dto.staff_member_id && { staff_member_id: dto.staff_member_id }),
        ...(dto.location_id && { location_id: dto.location_id }),
      },
      relations: ['client', 'client.user', 'service', 'staffMember', 'staffMember.user', 'location'],
      order: { start_time: 'ASC' },
    });

    // Filter out cancelled if not included
    const filteredAppointments = dto.include_cancelled
      ? appointments
      : appointments.filter((apt) => apt.status !== 'cancelled');

    switch (dto.format) {
      case ExportFormat.ICAL:
        return this.exportToICal(filteredAppointments);
      case ExportFormat.CSV:
        return this.exportToCSV(filteredAppointments);
      case ExportFormat.PDF:
        // PDF export would require additional library (pdfkit, puppeteer, etc.)
        throw new Error('PDF export not yet implemented');
      default:
        throw new Error(`Unsupported export format: ${dto.format}`);
    }
  }

  /**
   * Export appointments to iCalendar format (RFC 5545)
   */
  private exportToICal(
    appointments: Appointment[],
  ): { content: string; filename: string; mimeType: string } {
    const calendar = ical({
      name: 'Booking Calendar',
      timezone: 'UTC',
    });

    for (const apt of appointments) {
      const clientName = apt.client?.user
        ? `${apt.client.user.first_name} ${apt.client.user.last_name}`
        : 'Client';

      const staffName = apt.staffMember?.user
        ? `${apt.staffMember.user.first_name} ${apt.staffMember.user.last_name}`
        : 'Staff';

      const locationName = apt.location?.name || 'Location';
      const locationAddress = apt.location?.address || '';

      calendar.createEvent({
        start: new Date(apt.start_time),
        end: new Date(apt.end_time),
        summary: `${apt.service?.name || 'Appointment'} - ${clientName}`,
        description: `
Appointment Number: ${apt.appointment_number}
Client: ${clientName}
Staff: ${staffName}
Service: ${apt.service?.name || 'N/A'}
Status: ${apt.status}
        `.trim(),
        location: `${locationName}\n${locationAddress}`.trim(),
        uid: apt.id,
        sequence: 0,
        status: this.mapStatusToICal(apt.status),
      });
    }

    const content = calendar.toString();
    const filename = `calendar-${dayjs().format('YYYY-MM-DD')}.ics`;

    return {
      content,
      filename,
      mimeType: 'text/calendar',
    };
  }

  /**
   * Export appointments to CSV format
   */
  private exportToCSV(
    appointments: Appointment[],
  ): { content: string; filename: string; mimeType: string } {
    const headers = [
      'Appointment Number',
      'Date',
      'Start Time',
      'End Time',
      'Client Name',
      'Staff Member',
      'Service',
      'Duration (min)',
      'Status',
      'Location',
    ];

    const rows = appointments.map((apt) => {
      const clientName = apt.client?.user
        ? `${apt.client.user.first_name} ${apt.client.user.last_name}`
        : 'Client';

      const staffName = apt.staffMember?.user
        ? `${apt.staffMember.user.first_name} ${apt.staffMember.user.last_name}`
        : 'Staff';

      return [
        apt.appointment_number,
        dayjs(apt.start_time).format('YYYY-MM-DD'),
        dayjs(apt.start_time).format('HH:mm'),
        dayjs(apt.end_time).format('HH:mm'),
        clientName,
        staffName,
        apt.service?.name || 'N/A',
        apt.duration_minutes.toString(),
        apt.status,
        apt.location?.name || 'N/A',
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const filename = `appointments-${dayjs().format('YYYY-MM-DD')}.csv`;

    return {
      content: csvContent,
      filename,
      mimeType: 'text/csv',
    };
  }

  /**
   * Map appointment status to iCalendar status
   */
  private mapStatusToICal(status: string): ical.EventStatus {
    const statusMap: Record<string, ical.EventStatus> = {
      pending: ical.EventStatus.TENTATIVE,
      confirmed: ical.EventStatus.CONFIRMED,
      checked_in: ical.EventStatus.CONFIRMED,
      in_progress: ical.EventStatus.CONFIRMED,
      completed: ical.EventStatus.CONFIRMED,
      cancelled: ical.EventStatus.CANCELLED,
      no_show: ical.EventStatus.CANCELLED,
    };

    return statusMap[status] || ical.EventStatus.TENTATIVE;
  }

  /**
   * Export single appointment to iCal
   */
  async exportAppointment(
    tenantId: string,
    appointmentId: string,
  ): Promise<{ content: string; filename: string; mimeType: string }> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId, tenant_id: tenantId },
      relations: ['client', 'client.user', 'service', 'staffMember', 'staffMember.user', 'location'],
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    return this.exportToICal([appointment]);
  }
}
