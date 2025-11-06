import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { AvailabilityService } from './services/availability.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { AppointmentStatus } from './entities/appointment.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Appointments')
@ApiBearerAuth()
@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly availabilityService: AvailabilityService,
  ) {}

  @Get('availability')
  @ApiOperation({ summary: 'Check available time slots for booking' })
  @ApiResponse({ status: 200, description: 'List of available slots' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async checkAvailability(
    @Request() req,
    @Query('business_id') businessId: string,
    @Query('service_id') serviceId: string,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Query('location_id') locationId?: string,
    @Query('staff_member_id') staffMemberId?: string,
    @Query('timezone') timezone?: string,
    @Query('group_size') groupSize?: number,
  ) {
    const dto: CheckAvailabilityDto = {
      business_id: businessId,
      service_id: serviceId,
      start_date: startDate,
      end_date: endDate,
      location_id: locationId,
      staff_member_id: staffMemberId,
      timezone,
      group_size: groupSize ? parseInt(String(groupSize)) : 1,
    };

    return this.availabilityService.checkAvailability(req.user.tenant_id, dto);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new appointment' })
  @ApiResponse({ status: 201, description: 'Appointment created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Time slot conflict' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Request() req, @Body() createDto: CreateAppointmentDto) {
    return this.appointmentsService.create(req.user.tenant_id, req.user.user_id, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all appointments with optional filters' })
  @ApiQuery({ name: 'businessId', required: false, type: String })
  @ApiQuery({ name: 'locationId', required: false, type: String })
  @ApiQuery({ name: 'staffMemberId', required: false, type: String })
  @ApiQuery({ name: 'clientId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: AppointmentStatus })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of appointments' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Request() req,
    @Query('businessId') businessId?: string,
    @Query('locationId') locationId?: string,
    @Query('staffMemberId') staffMemberId?: string,
    @Query('clientId') clientId?: string,
    @Query('status') status?: AppointmentStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.appointmentsService.findAll(req.user.tenant_id, {
      businessId,
      locationId,
      staffMemberId,
      clientId,
      status,
      startDate,
      endDate,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get appointment by ID' })
  @ApiResponse({ status: 200, description: 'Appointment found' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(@Request() req, @Param('id') id: string) {
    return this.appointmentsService.findOne(req.user.tenant_id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update/reschedule appointment' })
  @ApiResponse({ status: 200, description: 'Appointment updated successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @ApiResponse({ status: 409, description: 'Time slot conflict' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(req.user.tenant_id, id, updateDto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel appointment' })
  @ApiResponse({ status: 200, description: 'Appointment cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @ApiResponse({ status: 403, description: 'Cancellation not allowed (policy violation)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async cancel(
    @Request() req,
    @Param('id') id: string,
    @Body() cancelDto: CancelAppointmentDto,
  ) {
    return this.appointmentsService.cancel(req.user.tenant_id, id, req.user.user_id, cancelDto);
  }

  @Post(':id/check-in')
  @ApiOperation({ summary: 'Check in client for appointment' })
  @ApiResponse({ status: 200, description: 'Client checked in successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async checkIn(@Request() req, @Param('id') id: string) {
    return this.appointmentsService.update(req.user.tenant_id, id, {
      status: AppointmentStatus.CHECKED_IN,
    });
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Start appointment (service in progress)' })
  @ApiResponse({ status: 200, description: 'Appointment started' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async start(@Request() req, @Param('id') id: string) {
    return this.appointmentsService.update(req.user.tenant_id, id, {
      status: AppointmentStatus.IN_PROGRESS,
    });
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete appointment' })
  @ApiResponse({ status: 200, description: 'Appointment completed' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async complete(@Request() req, @Param('id') id: string) {
    return this.appointmentsService.update(req.user.tenant_id, id, {
      status: AppointmentStatus.COMPLETED,
    });
  }

  @Post(':id/no-show')
  @ApiOperation({ summary: 'Mark appointment as no-show' })
  @ApiResponse({ status: 200, description: 'Appointment marked as no-show' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markNoShow(@Request() req, @Param('id') id: string) {
    return this.appointmentsService.update(req.user.tenant_id, id, {
      status: AppointmentStatus.NO_SHOW,
    });
  }
}
