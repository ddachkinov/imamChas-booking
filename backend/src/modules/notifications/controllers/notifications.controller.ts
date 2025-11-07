import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  Patch,
} from '@nestjs/swagger';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { NotificationsService } from '../services/notifications.service';
import { TemplateService } from '../services/template.service';
import { PreferencesService } from '../services/preferences.service';
import { SchedulerService } from '../services/scheduler.service';
import { SendNotificationDto } from '../dto/send-notification.dto';
import { NotificationPreferencesDto } from '../dto/notification-preferences.dto';
import { CreateTemplateDto } from '../dto/create-template.dto';
import { Notification } from '../entities/notification.entity';
import { NotificationTemplate } from '../entities/notification-template.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly templateService: TemplateService,
    private readonly preferencesService: PreferencesService,
    private readonly schedulerService: SchedulerService,
    @InjectRepository(NotificationTemplate)
    private readonly templateRepository: Repository<NotificationTemplate>,
  ) {}

  /**
   * Send notification
   */
  @Post()
  @ApiOperation({ summary: 'Send notification to user' })
  @ApiResponse({
    status: 201,
    description: 'Notification(s) sent successfully',
    type: [Notification],
  })
  async sendNotification(
    @Request() req,
    @Body() sendDto: SendNotificationDto,
  ): Promise<Notification[]> {
    const tenantId = req.user.tenantId;

    return this.notificationsService.sendNotification(tenantId, sendDto);
  }

  /**
   * Get notification history for current user
   */
  @Get('history')
  @ApiOperation({ summary: 'Get notification history for current user' })
  @ApiResponse({
    status: 200,
    description: 'Notification history retrieved',
    type: [Notification],
  })
  async getHistory(
    @Request() req,
    @Query('limit') limit?: number,
  ): Promise<Notification[]> {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;

    return this.notificationsService.getNotificationHistory(
      tenantId,
      userId,
      limit || 50,
    );
  }

  /**
   * Get notifications for specific appointment
   */
  @Get('appointment/:appointmentId')
  @ApiOperation({ summary: 'Get notifications for appointment' })
  @ApiResponse({
    status: 200,
    description: 'Appointment notifications retrieved',
    type: [Notification],
  })
  async getAppointmentNotifications(
    @Request() req,
    @Param('appointmentId') appointmentId: string,
  ): Promise<Notification[]> {
    const tenantId = req.user.tenantId;

    return this.notificationsService.getAppointmentNotifications(
      tenantId,
      appointmentId,
    );
  }

  /**
   * Get user notification preferences
   */
  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences for current user' })
  @ApiResponse({
    status: 200,
    description: 'Preferences retrieved',
    type: NotificationPreferencesDto,
  })
  async getPreferences(@Request() req): Promise<NotificationPreferencesDto> {
    const userId = req.user.userId;

    return this.preferencesService.getPreferences(userId);
  }

  /**
   * Update user notification preferences
   */
  @Patch('preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  @ApiResponse({
    status: 200,
    description: 'Preferences updated',
    type: NotificationPreferencesDto,
  })
  async updatePreferences(
    @Request() req,
    @Body() preferencesDto: NotificationPreferencesDto,
  ): Promise<NotificationPreferencesDto> {
    const userId = req.user.userId;

    return this.preferencesService.updatePreferences(userId, preferencesDto);
  }

  /**
   * Opt out of marketing notifications
   */
  @Post('preferences/opt-out-marketing')
  @ApiOperation({ summary: 'Opt out of all marketing communications' })
  @ApiResponse({ status: 200, description: 'Opted out successfully' })
  async optOutMarketing(@Request() req): Promise<{ success: boolean }> {
    const userId = req.user.userId;

    await this.preferencesService.optOutOfMarketing(userId);

    return { success: true };
  }

  /**
   * Opt out of SMS notifications (STOP handler)
   */
  @Post('preferences/opt-out-sms')
  @ApiOperation({ summary: 'Opt out of all SMS notifications' })
  @ApiResponse({ status: 200, description: 'Opted out of SMS' })
  async optOutSms(@Request() req): Promise<{ success: boolean }> {
    const userId = req.user.userId;

    await this.preferencesService.optOutOfSms(userId);

    return { success: true };
  }

  /**
   * Create notification template
   */
  @Post('templates')
  @ApiOperation({ summary: 'Create notification template' })
  @ApiResponse({
    status: 201,
    description: 'Template created',
    type: NotificationTemplate,
  })
  async createTemplate(
    @Request() req,
    @Body() createDto: CreateTemplateDto,
  ): Promise<NotificationTemplate> {
    const tenantId = req.user.tenantId;

    const template = this.templateRepository.create({
      ...createDto,
      tenant_id: tenantId,
      language: createDto.language || 'en',
      is_active: createDto.is_active !== false,
    });

    return this.templateRepository.save(template);
  }

  /**
   * Get all templates for tenant
   */
  @Get('templates')
  @ApiOperation({ summary: 'Get all notification templates' })
  @ApiResponse({
    status: 200,
    description: 'Templates retrieved',
    type: [NotificationTemplate],
  })
  async getTemplates(@Request() req): Promise<NotificationTemplate[]> {
    const tenantId = req.user.tenantId;

    return this.templateRepository.find({
      where: [
        { tenant_id: tenantId },
        { is_system_template: true },
      ],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Get specific template
   */
  @Get('templates/:id')
  @ApiOperation({ summary: 'Get notification template by ID' })
  @ApiResponse({
    status: 200,
    description: 'Template retrieved',
    type: NotificationTemplate,
  })
  async getTemplate(
    @Request() req,
    @Param('id') id: string,
  ): Promise<NotificationTemplate> {
    const tenantId = req.user.tenantId;

    return this.templateRepository.findOne({
      where: [
        { id, tenant_id: tenantId },
        { id, is_system_template: true },
      ],
    });
  }

  /**
   * Preview template with sample data
   */
  @Post('templates/:id/preview')
  @ApiOperation({ summary: 'Preview template with sample variables' })
  @ApiResponse({
    status: 200,
    description: 'Template preview generated',
  })
  async previewTemplate(
    @Request() req,
    @Param('id') id: string,
    @Body() variables: Record<string, any>,
  ): Promise<{ subject?: string; body: string }> {
    const template = await this.getTemplate(req, id);

    return this.templateService.previewTemplate(template, variables);
  }

  /**
   * Update template
   */
  @Patch('templates/:id')
  @ApiOperation({ summary: 'Update notification template' })
  @ApiResponse({
    status: 200,
    description: 'Template updated',
    type: NotificationTemplate,
  })
  async updateTemplate(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateTemplateDto>,
  ): Promise<NotificationTemplate> {
    const template = await this.getTemplate(req, id);

    // Only allow updating tenant's own templates, not system templates
    if (template.is_system_template) {
      throw new Error('Cannot modify system templates');
    }

    Object.assign(template, updateDto);

    return this.templateRepository.save(template);
  }

  /**
   * Schedule appointment reminders
   */
  @Post('schedule-reminders/:appointmentId')
  @ApiOperation({
    summary: 'Schedule appointment reminders (24h and 1h before)',
  })
  @ApiResponse({ status: 200, description: 'Reminders scheduled' })
  async scheduleReminders(
    @Request() req,
    @Param('appointmentId') appointmentId: string,
  ): Promise<{ success: boolean }> {
    const tenantId = req.user.tenantId;

    await this.schedulerService.scheduleAppointmentReminders(
      tenantId,
      appointmentId,
    );

    return { success: true };
  }

  /**
   * Cancel scheduled reminders for appointment
   */
  @Post('cancel-reminders/:appointmentId')
  @ApiOperation({ summary: 'Cancel scheduled appointment reminders' })
  @ApiResponse({ status: 200, description: 'Reminders cancelled' })
  async cancelReminders(
    @Request() req,
    @Param('appointmentId') appointmentId: string,
  ): Promise<{ success: boolean }> {
    const tenantId = req.user.tenantId;

    await this.schedulerService.cancelAppointmentReminders(
      tenantId,
      appointmentId,
    );

    return { success: true };
  }
}
