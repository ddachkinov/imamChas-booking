import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AvailabilityService } from './services/availability.service';
import { ConflictResolverService } from './services/conflict-resolver.service';
import { Appointment } from './entities/appointment.entity';
import { AppointmentAddon } from './entities/appointment-addon.entity';
import { Service } from '../services/entities/service.entity';
import { ServiceAddon } from '../services/entities/service-addon.entity';
import { StaffMember } from '../staff/entities/staff-member.entity';
import { StaffSkill } from '../staff/entities/staff-skill.entity';
import { Availability } from '../staff/entities/availability.entity';
import { ClientProfile } from '../clients/entities/client-profile.entity';
import { Location } from '../locations/entities/location.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      AppointmentAddon,
      Service,
      ServiceAddon,
      StaffMember,
      StaffSkill,
      Availability,
      ClientProfile,
      Location,
    ]),
  ],
  controllers: [AppointmentsController],
  providers: [
    AppointmentsService,
    AvailabilityService,
    ConflictResolverService,
  ],
  exports: [
    AppointmentsService,
    AvailabilityService,
    TypeOrmModule,
  ],
})
export class AppointmentsModule {}
