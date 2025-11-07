import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Notification, NotificationChannel, NotificationStatus, NotificationType } from '../entities/notification.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { NotificationsService } from './notifications.service';
import * as dayjs from 'dayjs';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Process scheduled notifications every minute
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processScheduledNotifications(): Promise<void> {
    try {
      // Get notifications that are due to be sent
      const dueNotifications = await this.notificationRepository.find({
        where: {
          status: NotificationStatus.PENDING,
          scheduled_for: LessThanOrEqual(new Date()),
        },
        take: 100, // Process in batches
      });

      if (dueNotifications.length === 0) {
        return;
      }

      this.logger.log(
        `Processing ${dueNotifications.length} scheduled notifications`,
      );

      for (const notification of dueNotifications) {
        try {
          await this.notificationsService.sendImmediately(notification);
        } catch (error) {
          this.logger.error(
            `Failed to send scheduled notification ${notification.id}: ${error.message}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Error processing scheduled notifications: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Schedule appointment reminders (24h and 1h before)
   */
  async scheduleAppointmentReminders(
    tenantId: string,
    appointmentId: string,
  ): Promise<void> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId, tenant_id: tenantId },
      relations: ['client', 'client.user'],
    });

    if (!appointment || !appointment.client) {
      this.logger.warn(
        `Cannot schedule reminders - appointment or client not found: ${appointmentId}`,
      );
      return;
    }

    const startTime = dayjs(appointment.start_time);
    const now = dayjs();

    // Schedule 24-hour reminder
    const reminder24h = startTime.subtract(24, 'hour');
    if (reminder24h.isAfter(now)) {
      await this.createReminderNotification(
        tenantId,
        appointment,
        NotificationType.APPOINTMENT_REMINDER_24H,
        reminder24h.toDate(),
      );

      this.logger.log(
        `Scheduled 24h reminder for appointment ${appointmentId} at ${reminder24h.format()}`,
      );
    }

    // Schedule 1-hour reminder
    const reminder1h = startTime.subtract(1, 'hour');
    if (reminder1h.isAfter(now)) {
      await this.createReminderNotification(
        tenantId,
        appointment,
        NotificationType.APPOINTMENT_REMINDER_1H,
        reminder1h.toDate(),
      );

      this.logger.log(
        `Scheduled 1h reminder for appointment ${appointmentId} at ${reminder1h.format()}`,
      );
    }
  }

  /**
   * Create a scheduled reminder notification
   */
  private async createReminderNotification(
    tenantId: string,
    appointment: Appointment,
    reminderType: NotificationType,
    scheduledFor: Date,
  ): Promise<void> {
    const userId = appointment.client.user_id;

    // Create placeholder notifications (will be rendered when sent)
    // Email reminder
    const emailNotification = this.notificationRepository.create({
      tenant_id: tenantId,
      recipient_user_id: userId,
      appointment_id: appointment.id,
      notification_type: reminderType,
      channel: NotificationChannel.EMAIL,
      recipient_address: appointment.client.user?.email || '',
      subject: 'Appointment Reminder',
      body: '', // Will be rendered from template when sent
      status: NotificationStatus.PENDING,
      scheduled_for: scheduledFor,
    });

    await this.notificationRepository.save(emailNotification);

    // SMS reminder
    if (appointment.client.user?.phone) {
      const smsNotification = this.notificationRepository.create({
        tenant_id: tenantId,
        recipient_user_id: userId,
        appointment_id: appointment.id,
        notification_type: reminderType,
        channel: NotificationChannel.SMS,
        recipient_address: appointment.client.user.phone,
        subject: '',
        body: '', // Will be rendered from template when sent
        status: NotificationStatus.PENDING,
        scheduled_for: scheduledFor,
      });

      await this.notificationRepository.save(smsNotification);
    }
  }

  /**
   * Reschedule appointment reminders (when appointment is rescheduled)
   */
  async rescheduleAppointmentReminders(
    tenantId: string,
    appointmentId: string,
  ): Promise<void> {
    // Cancel existing scheduled reminders
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

    // Schedule new reminders
    await this.scheduleAppointmentReminders(tenantId, appointmentId);

    this.logger.log(
      `Rescheduled reminders for appointment ${appointmentId}`,
    );
  }

  /**
   * Cancel scheduled appointment reminders
   */
  async cancelAppointmentReminders(
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
      `Cancelled reminders for appointment ${appointmentId}`,
    );
  }
}
