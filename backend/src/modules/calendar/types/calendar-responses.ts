import { ApiProperty } from '@nestjs/swagger';

export class AppointmentSummary {
  @ApiProperty() id: string;
  @ApiProperty() appointment_number: string;
  @ApiProperty() client_name: string;
  @ApiProperty() client_initials: string;
  @ApiProperty() service_name: string;
  @ApiProperty() start_time: string; // ISO 8601
  @ApiProperty() end_time: string; // ISO 8601
  @ApiProperty() duration_minutes: number;
  @ApiProperty() status: string;
  @ApiProperty() color: string;
  @ApiProperty() recurring_icon: boolean;
  @ApiProperty() group_size: number;
}

export class TimeSlot {
  @ApiProperty() time: string; // HH:MM format
  @ApiProperty() timestamp: string; // ISO 8601
  @ApiProperty() is_available: boolean;
  @ApiProperty() is_past: boolean;
  @ApiProperty({ type: [AppointmentSummary] }) appointments: AppointmentSummary[];
  @ApiProperty() blocked_time?: any; // BlockedTime object
}

export class BusinessHours {
  @ApiProperty() open: string; // HH:MM format
  @ApiProperty() close: string; // HH:MM format
  @ApiProperty() is_closed: boolean;
}

export class StaffSummary {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() color: string;
  @ApiProperty() avatar_url?: string;
}

export class DayViewResponse {
  @ApiProperty() date: string; // ISO 8601 date
  @ApiProperty() timezone: string;
  @ApiProperty() business_hours: BusinessHours;
  @ApiProperty({ type: [TimeSlot] }) time_slots: TimeSlot[];
  @ApiProperty({ type: [AppointmentSummary] }) appointments: AppointmentSummary[];
  @ApiProperty({ type: [Object] }) blocked_times: any[]; // BlockedTime objects
  @ApiProperty() staff_member: StaffSummary;
}

export class DayColumn {
  @ApiProperty() date: string; // ISO 8601 date
  @ApiProperty() day_name: string; // Monday, Tuesday, etc.
  @ApiProperty() is_today: boolean;
  @ApiProperty() appointment_count: number;
  @ApiProperty({ type: [AppointmentSummary] }) appointments: AppointmentSummary[];
  @ApiProperty() business_hours: BusinessHours;
}

export class WeekViewResponse {
  @ApiProperty() start_date: string; // ISO 8601 date (Monday)
  @ApiProperty() end_date: string; // ISO 8601 date (Sunday)
  @ApiProperty() timezone: string;
  @ApiProperty({ type: [DayColumn] }) days: DayColumn[];
  @ApiProperty({ type: [AppointmentSummary] }) appointments: AppointmentSummary[]; // Flat array for frontend compatibility
  @ApiProperty({ type: [Object] }) blocked_times: any[]; // Flat array of blocked times
  @ApiProperty({ type: [StaffSummary] }) staff_members?: StaffSummary[];
  @ApiProperty() business_hours?: any[]; // Business hours array
}

export class DayCell {
  @ApiProperty() date: string; // ISO 8601 date
  @ApiProperty() day: number; // Day of month
  @ApiProperty() is_today: boolean;
  @ApiProperty() is_current_month: boolean;
  @ApiProperty() is_disabled: boolean; // Outside operating hours
  @ApiProperty() appointment_count: number;
}

export class Week {
  @ApiProperty({ type: [DayCell] }) days: DayCell[];
}

export class MonthSummary {
  @ApiProperty() total_appointments: number;
  @ApiProperty() total_revenue: number;
  @ApiProperty() average_per_day: number;
}

export class MonthViewResponse {
  @ApiProperty() year: number;
  @ApiProperty() month: number; // 1-12
  @ApiProperty() timezone: string;
  @ApiProperty({ type: [Week] }) weeks: Week[];
  @ApiProperty() appointment_counts: Record<string, number>; // date -> count
  @ApiProperty() summary: MonthSummary;
}

export class StaffResource {
  @ApiProperty() staff_id: string;
  @ApiProperty() staff_name: string;
  @ApiProperty() color: string;
  @ApiProperty({ type: [Object] }) availability: any[]; // Availability periods
  @ApiProperty({ type: [AppointmentSummary] }) appointments: AppointmentSummary[];
  @ApiProperty({ type: [Object] }) blocked_times: any[]; // BlockedTime objects
}

export class Conflict {
  @ApiProperty() staff_id: string;
  @ApiProperty() appointment_ids: string[];
  @ApiProperty() time: string; // ISO 8601
  @ApiProperty() message: string;
}

export class ResourceViewResponse {
  @ApiProperty() start_time: string; // ISO 8601
  @ApiProperty() end_time: string; // ISO 8601
  @ApiProperty() timezone: string;
  @ApiProperty({ type: [String] }) time_slots: string[]; // Array of time strings
  @ApiProperty({ type: [StaffResource] }) staff_resources: StaffResource[];
  @ApiProperty({ type: [Conflict] }) conflicts: Conflict[];
}

export class ScheduleSummary {
  @ApiProperty() date: string;
  @ApiProperty() hours_worked: number;
  @ApiProperty() appointments_count: number;
  @ApiProperty() total_revenue: number;
  @ApiProperty() utilization_percent: number;
  @ApiProperty() gaps: Array<{ start: string; end: string; duration_minutes: number }>;
}
