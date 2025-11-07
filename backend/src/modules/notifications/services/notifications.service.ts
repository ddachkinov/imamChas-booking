import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationChannel, NotificationStatus, NotificationType } from '../entities/notification.entity';
import { User } from '../../users/entities/user.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { SendNotificationDto } from '../dto/send-notification.dto';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { PushService } from './push.service';
import { TemplateService } from './template.service';
import { PreferencesService } from './preferences.service';
import * as dayjs from 'dayjs';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly pushService: PushService,
    private readonly templateService: TemplateService,
    private readonly preferencesService: PreferencesService,
  ) {}

  /**
   * Send notification (immediate or scheduled)
   */
  async sendNotification(
    tenantId: string,
    dto: SendNotificationDto,
  ): Promise<Notification[]> {
    const notifications: Notification[] = [];

    // Get recipient information
    const user = await this.userRepository.findOne({
      where: { id: dto.recipient_user_id, tenant_id: tenantId },
    });

    if (!user) {
      throw new NotFoundException('Recipient user not found');
    }

    // Get appointment if specified (for context and template variables)
    let appointment: Appointment | null = null;
    if (dto.appointment_id) {
      appointment = await this.appointmentRepository.findOne({
        where: { id: dto.appointment_id, tenant_id: tenantId },
        relations: ['service', 'staffMember', 'staffMember.user', 'location', 'client', 'client.user'],
      });
    }

    // Build template variables
    const templateVariables = this.buildTemplateVariables(
      user,
      appointment,
      dto.template_variables || {},
    );

    // Send via each requested channel
    for (const channel of dto.channels) {
      try {
        const notification = await this.sendViaChannel(
          tenantId,
          user,
          channel,
          dto.notification_type,
          dto.subject,
          dto.body,
          dto.template_id,
          templateVariables,
          dto.appointment_id,
          dto.scheduled_for,
          dto.metadata,
        );

        if (notification) {
          notifications.push(notification);
        }
      } catch (error) {
        this.logger.error(
          `Failed to send notification via ${channel}: ${error.message}`,
          error.stack,
        );
      }
    }

    return notifications;
  }

  /**
   * Send notification via specific channel
   */
  private async sendViaChannel(
    tenantId: string,
    user: User,
    channel: NotificationChannel,
    notificationType: NotificationType,
    subject?: string,
    body?: string,
    templateId?: string,
    templateVariables?: Record<string, any>,
    appointmentId?: string,
    scheduledFor?: string,
    metadata?: Record<string, any>,
  ): Promise<Notification | null> {
    // Check user preferences
    const shouldSend = await this.preferencesService.shouldSendNotification(
      user.id,
      notificationType,
      channel,
    );

    if (!shouldSend) {
      this.logger.log(
        `User ${user.id} opted out of ${notificationType} via ${channel}`,
      );

      // Create notification record with SKIPPED status
      return this.createNotificationRecord(
        tenantId,
        user.id,
        notificationType,
        channel,
        '',
        subject || '',
        body || '',
        templateId,
        NotificationStatus.SKIPPED,
        appointmentId,
        scheduledFor,
        null,
        'User opted out',
        metadata,
      );
    }

    // Get recipient address (email, phone, device token)
    const recipientAddress = this.getRecipientAddress(user, channel);
    if (!recipientAddress) {
      this.logger.warn(
        `No ${channel} address found for user ${user.id}`,
      );
      return null;
    }

    // Get rendered content (from template or direct)
    let renderedSubject = subject;
    let renderedBody = body;

    if (templateId || !body) {
      // Use template
      try {
        const template = templateId
          ? await this.templateService.getTemplate(tenantId, notificationType, channel)
          : await this.templateService.getTemplate(tenantId, notificationType, channel);

        const rendered = this.templateService.renderTemplateWithSubject(
          template,
          templateVariables || {},
        );

        renderedSubject = rendered.subject || renderedSubject;
        renderedBody = rendered.body;
      } catch (error) {
        this.logger.error(`Template rendering failed: ${error.message}`);
        if (!body) {
          throw error; // No fallback body
        }
      }
    }

    // Create notification record
    const notification = await this.createNotificationRecord(
      tenantId,
      user.id,
      notificationType,
      channel,
      recipientAddress,
      renderedSubject || '',
      renderedBody || '',
      templateId,
      scheduledFor ? NotificationStatus.PENDING : NotificationStatus.PENDING,
      appointmentId,
      scheduledFor,
      null,
      null,
      metadata,
    );

    // If scheduled, don't send now
    if (scheduledFor) {
      this.logger.log(
        `Notification ${notification.id} scheduled for ${scheduledFor}`,
      );
      return notification;
    }

    // Send immediately
    await this.sendImmediately(notification);

    return notification;
  }

  /**
   * Send notification immediately
   */
  async sendImmediately(notification: Notification): Promise<void> {
    try {
      let result: { success: boolean; messageId?: string; error?: string };

      switch (notification.channel) {
        case NotificationChannel.EMAIL:
          result = await this.emailService.sendEmail({
            to: notification.recipient_address,
            subject: notification.subject,
            htmlBody: notification.body,
          });
          break;

        case NotificationChannel.SMS:
          result = await this.smsService.sendSms({
            to: notification.recipient_address,
            body: notification.body,
          });
          break;

        case NotificationChannel.PUSH:
          result = await this.pushService.sendPush({
            token: notification.recipient_address,
            title: notification.subject,
            body: notification.body,
            data: notification.metadata,
          });
          break;

        default:
          throw new Error(`Unsupported channel: ${notification.channel}`);
      }

      // Update notification status
      if (result.success) {
        notification.status = NotificationStatus.SENT;
        notification.sent_at = new Date();
        notification.gateway_message_id = result.messageId;
      } else {
        notification.status = NotificationStatus.FAILED;
        notification.failed_reason = result.error;

        // Check if should retry
        if (this.shouldRetry(notification, result.error)) {
          // Schedule retry
          await this.scheduleRetry(notification);
        }
      }

      await this.notificationRepository.save(notification);
    } catch (error) {
      this.logger.error(
        `Failed to send notification ${notification.id}: ${error.message}`,
        error.stack,
      );

      notification.status = NotificationStatus.FAILED;
      notification.failed_reason = error.message;
      await this.notificationRepository.save(notification);
    }
  }

  /**
   * Create notification record in database
   */
  private async createNotificationRecord(
    tenantId: string,
    recipientUserId: string,
    notificationType: NotificationType,
    channel: NotificationChannel,
    recipientAddress: string,
    subject: string,
    body: string,
    templateId?: string,
    status: NotificationStatus = NotificationStatus.PENDING,
    appointmentId?: string,
    scheduledFor?: string,
    gatewayMessageId?: string,
    failedReason?: string,
    metadata?: Record<string, any>,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      tenant_id: tenantId,
      recipient_user_id: recipientUserId,
      notification_type: notificationType,
      channel,
      recipient_address: recipientAddress,
      subject,
      body,
      template_id: templateId,
      status,
      appointment_id: appointmentId,
      scheduled_for: scheduledFor ? new Date(scheduledFor) : null,
      gateway_message_id: gatewayMessageId,
      failed_reason: failedReason,
      metadata,
    });

    return this.notificationRepository.save(notification);
  }

  /**
   * Build template variables from context
   */
  private buildTemplateVariables(
    user: User,
    appointment: Appointment | null,
    customVariables: Record<string, any>,
  ): Record<string, any> {
    const variables: Record<string, any> = {
      client_name: `${user.first_name} ${user.last_name}`,
      client_first_name: user.first_name,
      client_email: user.email,
      ...customVariables,
    };

    if (appointment) {
      variables.appointment_date = dayjs(appointment.start_time).format('MMMM D, YYYY');
      variables.appointment_time = dayjs(appointment.start_time).format('h:mm A');
      variables.appointment_datetime = dayjs(appointment.start_time).format('MMMM D, YYYY [at] h:mm A');
      variables.service_name = appointment.service?.name;
      variables.service_duration = appointment.duration_minutes;
      variables.staff_name = appointment.staffMember?.user
        ? `${appointment.staffMember.user.first_name} ${appointment.staffMember.user.last_name}`
        : 'Staff';
      variables.location_name = appointment.location?.name;
      variables.location_address = appointment.location?.address;
    }

    return variables;
  }

  /**
   * Get recipient address for channel
   */
  private getRecipientAddress(
    user: User,
    channel: NotificationChannel,
  ): string | null {
    switch (channel) {
      case NotificationChannel.EMAIL:
        return user.email;
      case NotificationChannel.SMS:
        return user.phone || null;
      case NotificationChannel.PUSH:
        // TODO: Get device token from user device registration
        return null;
      default:
        return null;
    }
  }

  /**
   * Determine if notification should be retried
   */
  private shouldRetry(notification: Notification, error?: string): boolean {
    const maxRetries = notification.channel === NotificationChannel.EMAIL ? 3 : 2;

    if (notification.retry_count >= maxRetries) {
      return false;
    }

    if (!error) {
      return true; // Unknown error, try again
    }

    // Check if error is permanent
    if (notification.channel === NotificationChannel.EMAIL) {
      if (this.emailService.isPermanentError(error)) {
        return false;
      }
    } else if (notification.channel === NotificationChannel.SMS) {
      if (this.smsService.isPermanentError(error)) {
        return false;
      }
    } else if (notification.channel === NotificationChannel.PUSH) {
      // Don't retry push notifications (invalid token)
      return false;
    }

    return true;
  }

  /**
   * Schedule notification retry with exponential backoff
   */
  private async scheduleRetry(notification: Notification): Promise<void> {
    notification.retry_count += 1;

    // Exponential backoff: 2^retry_count minutes
    const delayMinutes = Math.pow(2, notification.retry_count - 1);
    const scheduledFor = dayjs().add(delayMinutes, 'minute').toDate();

    notification.scheduled_for = scheduledFor;
    notification.status = NotificationStatus.PENDING;

    await this.notificationRepository.save(notification);

    this.logger.log(
      `Notification ${notification.id} scheduled for retry #${notification.retry_count} at ${scheduledFor}`,
    );
  }

  /**
   * Get notification history for user
   */
  async getNotificationHistory(
    tenantId: string,
    userId: string,
    limit = 50,
  ): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: {
        tenant_id: tenantId,
        recipient_user_id: userId,
      },
      order: {
        created_at: 'DESC',
      },
      take: limit,
    });
  }

  /**
   * Get notifications for appointment
   */
  async getAppointmentNotifications(
    tenantId: string,
    appointmentId: string,
  ): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: {
        tenant_id: tenantId,
        appointment_id: appointmentId,
      },
      order: {
        created_at: 'ASC',
      },
    });
  }

  /**
   * Cancel scheduled notifications
   */
  async cancelScheduledNotifications(
    tenantId: string,
    appointmentId: string,
  ): Promise<void> {
    await this.notificationRepository.update(
      {
        tenant_id: tenantId,
        appointment_id: appointmentId,
        status: NotificationStatus.PENDING,
      },
      {
        status: NotificationStatus.CANCELLED,
      },
    );

    this.logger.log(
      `Cancelled scheduled notifications for appointment ${appointmentId}`,
    );
  }
}
