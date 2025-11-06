import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { StaffMember } from './entities/staff-member.entity';
import { Availability } from './entities/availability.entity';
import { StaffSkill } from './entities/staff-skill.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StaffMember, Availability, StaffSkill])],
  controllers: [StaffController],
  providers: [StaffService],
  exports: [StaffService, TypeOrmModule],
})
export class StaffModule {}
