import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Notification } from './entities/notification.entity';
import { NotificationTemplate } from './entities/notification-template.entity';
import { User } from '../users/entities/user.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { NotificationsController } from './controllers/notifications.controller';
import { WebhooksController } from './controllers/webhooks.controller';
import { NotificationsService } from './services/notifications.service';
import { EmailService } from './services/email.service';
import { SmsService } from './services/sms.service';
import { PushService } from './services/push.service';
import { TemplateService } from './services/template.service';
import { SchedulerService } from './services/scheduler.service';
import { PreferencesService } from './services/preferences.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      NotificationTemplate,
      User,
      Appointment,
    ]),
    ScheduleModule.forRoot(), // Enable cron jobs
  ],
  controllers: [NotificationsController, WebhooksController],
  providers: [
    NotificationsService,
    EmailService,
    SmsService,
    PushService,
    TemplateService,
    SchedulerService,
    PreferencesService,
  ],
  exports: [
    NotificationsService,
    SchedulerService,
    PreferencesService,
    // Export for use by other modules (like Appointments)
  ],
})
export class NotificationsModule {}
