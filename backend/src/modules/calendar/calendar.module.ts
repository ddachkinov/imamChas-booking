import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockedTime } from './entities/blocked-time.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { StaffMember } from '../staff/entities/staff-member.entity';
import { Availability } from '../staff/entities/availability.entity';
import { Location } from '../locations/entities/location.entity';
import { Service } from '../services/entities/service.entity';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './services/calendar.service';
import { BlockedTimeService } from './services/blocked-time.service';
import { ScheduleBuilderService } from './services/schedule-builder.service';
import { CalendarExportService } from './services/calendar-export.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BlockedTime,
      Appointment,
      StaffMember,
      Availability,
      Location,
      Service,
    ]),
  ],
  controllers: [CalendarController],
  providers: [
    CalendarService,
    BlockedTimeService,
    ScheduleBuilderService,
    CalendarExportService,
    // TODO: Add RealTimeCalendarGateway for WebSocket updates
  ],
  exports: [
    CalendarService,
    BlockedTimeService,
    ScheduleBuilderService,
    CalendarExportService,
  ],
})
export class CalendarModule {}
