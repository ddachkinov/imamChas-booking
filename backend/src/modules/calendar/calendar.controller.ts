import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  Res,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CalendarService } from './services/calendar.service';
import { BlockedTimeService } from './services/blocked-time.service';
import { ScheduleBuilderService } from './services/schedule-builder.service';
import { CalendarExportService } from './services/calendar-export.service';
import { CalendarViewDto } from './dto/calendar-view.dto';
import { CreateBlockedTimeDto } from './dto/create-blocked-time.dto';
import { ExportCalendarDto } from './dto/export-calendar.dto';
import {
  DayViewResponse,
  WeekViewResponse,
  MonthViewResponse,
  ResourceViewResponse,
  ScheduleSummary,
} from './types/calendar-responses';
import { BlockedTime } from './entities/blocked-time.entity';

@ApiTags('Calendar')
@ApiBearerAuth()
@Controller('calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(
    private readonly calendarService: CalendarService,
    private readonly blockedTimeService: BlockedTimeService,
    private readonly scheduleBuilderService: ScheduleBuilderService,
    private readonly calendarExportService: CalendarExportService,
  ) {}

  /**
   * Get calendar view (day, week, month, or resource)
   */
  @Get('view')
  @ApiOperation({ summary: 'Get calendar view' })
  @ApiResponse({
    status: 200,
    description: 'Calendar view retrieved',
  })
  async getCalendarView(
    @Request() req,
    @Query() query: CalendarViewDto,
  ): Promise<DayViewResponse | WeekViewResponse | MonthViewResponse | ResourceViewResponse> {
    const tenantId = req.user.tenantId;

    return this.calendarService.getCalendarView(tenantId, query);
  }

  /**
   * Get day view
   */
  @Get('day')
  @ApiOperation({ summary: 'Get day view for staff member' })
  @ApiResponse({
    status: 200,
    description: 'Day view retrieved',
    type: DayViewResponse,
  })
  async getDayView(
    @Request() req,
    @Query() query: CalendarViewDto,
  ): Promise<DayViewResponse> {
    const tenantId = req.user.tenantId;
    query.view_type = 'day' as any;

    return this.calendarService.getDayView(tenantId, query);
  }

  /**
   * Get week view
   */
  @Get('week')
  @ApiOperation({ summary: 'Get week view' })
  @ApiResponse({
    status: 200,
    description: 'Week view retrieved',
    type: WeekViewResponse,
  })
  async getWeekView(
    @Request() req,
    @Query() query: CalendarViewDto,
  ): Promise<WeekViewResponse> {
    const tenantId = req.user.tenantId;
    query.view_type = 'week' as any;

    return this.calendarService.getWeekView(tenantId, query);
  }

  /**
   * Get month view
   */
  @Get('month')
  @ApiOperation({ summary: 'Get month view' })
  @ApiResponse({
    status: 200,
    description: 'Month view retrieved',
    type: MonthViewResponse,
  })
  async getMonthView(
    @Request() req,
    @Query() query: CalendarViewDto,
  ): Promise<MonthViewResponse> {
    const tenantId = req.user.tenantId;
    query.view_type = 'month' as any;

    return this.calendarService.getMonthView(tenantId, query);
  }

  /**
   * Get resource view
   */
  @Get('resource')
  @ApiOperation({ summary: 'Get resource view (multiple staff)' })
  @ApiResponse({
    status: 200,
    description: 'Resource view retrieved',
    type: ResourceViewResponse,
  })
  async getResourceView(
    @Request() req,
    @Query() query: CalendarViewDto,
  ): Promise<ResourceViewResponse> {
    const tenantId = req.user.tenantId;
    query.view_type = 'resource' as any;

    return this.calendarService.getResourceView(tenantId, query);
  }

  /**
   * Create blocked time
   */
  @Post('blocked-time')
  @ApiOperation({ summary: 'Create blocked time period' })
  @ApiResponse({
    status: 201,
    description: 'Blocked time created',
    type: BlockedTime,
  })
  async createBlockedTime(
    @Request() req,
    @Body() createDto: CreateBlockedTimeDto,
  ): Promise<BlockedTime | BlockedTime[]> {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;

    return this.blockedTimeService.create(tenantId, userId, createDto);
  }

  /**
   * Get blocked times for staff member
   */
  @Get('blocked-time')
  @ApiOperation({ summary: 'Get blocked times for staff member' })
  @ApiResponse({
    status: 200,
    description: 'Blocked times retrieved',
    type: [BlockedTime],
  })
  async getBlockedTimes(
    @Request() req,
    @Query('staff_member_id') staffMemberId: string,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ): Promise<BlockedTime[]> {
    const tenantId = req.user.tenantId;

    return this.blockedTimeService.getBlockedTimes(
      tenantId,
      staffMemberId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  /**
   * Delete blocked time
   */
  @Delete('blocked-time/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete blocked time' })
  @ApiResponse({ status: 204, description: 'Blocked time deleted' })
  async deleteBlockedTime(
    @Request() req,
    @Param('id') id: string,
  ): Promise<void> {
    const tenantId = req.user.tenantId;

    return this.blockedTimeService.delete(tenantId, id);
  }

  /**
   * Update blocked time
   */
  @Patch('blocked-time/:id')
  @ApiOperation({ summary: 'Update blocked time' })
  @ApiResponse({
    status: 200,
    description: 'Blocked time updated',
    type: BlockedTime,
  })
  async updateBlockedTime(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateBlockedTimeDto>,
  ): Promise<BlockedTime> {
    const tenantId = req.user.tenantId;

    return this.blockedTimeService.update(tenantId, id, updateDto);
  }

  /**
   * Get schedule summary for staff member
   */
  @Get('schedule/summary')
  @ApiOperation({ summary: 'Get schedule summary for staff member and date' })
  @ApiResponse({
    status: 200,
    description: 'Schedule summary retrieved',
    type: ScheduleSummary,
  })
  async getScheduleSummary(
    @Request() req,
    @Query('staff_member_id') staffMemberId: string,
    @Query('date') date: string,
  ): Promise<ScheduleSummary> {
    const tenantId = req.user.tenantId;

    return this.scheduleBuilderService.generateScheduleSummary(
      tenantId,
      staffMemberId,
      new Date(date),
    );
  }

  /**
   * Get schedule summaries for date range
   */
  @Get('schedule/range')
  @ApiOperation({ summary: 'Get schedule summaries for date range' })
  @ApiResponse({
    status: 200,
    description: 'Schedule summaries retrieved',
    type: [ScheduleSummary],
  })
  async getScheduleRange(
    @Request() req,
    @Query('staff_member_id') staffMemberId: string,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ): Promise<ScheduleSummary[]> {
    const tenantId = req.user.tenantId;

    return this.scheduleBuilderService.generateScheduleRange(
      tenantId,
      staffMemberId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  /**
   * Export calendar
   */
  @Post('export')
  @ApiOperation({ summary: 'Export calendar to iCal, CSV, or PDF' })
  @ApiResponse({
    status: 200,
    description: 'Calendar exported',
  })
  async exportCalendar(
    @Request() req,
    @Body() exportDto: ExportCalendarDto,
    @Res() res: Response,
  ): Promise<void> {
    const tenantId = req.user.tenantId;

    const { content, filename, mimeType } = await this.calendarExportService.exportCalendar(
      tenantId,
      exportDto,
    );

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
  }

  /**
   * Export single appointment to iCal
   */
  @Get('export/appointment/:id')
  @ApiOperation({ summary: 'Export single appointment to iCal' })
  @ApiResponse({
    status: 200,
    description: 'Appointment exported to iCal',
  })
  async exportAppointment(
    @Request() req,
    @Param('id') appointmentId: string,
    @Res() res: Response,
  ): Promise<void> {
    const tenantId = req.user.tenantId;

    const { content, filename, mimeType } =
      await this.calendarExportService.exportAppointment(tenantId, appointmentId);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
  }

  /**
   * Get calendar metrics for dashboard
   */
  @Get('metrics')
  @ApiOperation({ summary: 'Get calendar metrics for specific date' })
  @ApiResponse({
    status: 200,
    description: 'Calendar metrics retrieved',
  })
  async getCalendarMetrics(
    @Request() req,
    @Query('business_id') businessId: string,
    @Query('date') date: string,
    @Query('staff_id') staffId?: string,
  ): Promise<any> {
    const tenantId = req.user.tenantId;

    return this.calendarService.getCalendarMetrics(
      tenantId,
      date,
      staffId,
    );
  }
}
