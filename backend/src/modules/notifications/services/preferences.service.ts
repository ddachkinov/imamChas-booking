import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { NotificationChannel, NotificationType } from '../entities/notification.entity';
import { NotificationPreferencesDto } from '../dto/notification-preferences.dto';

@Injectable()
export class PreferencesService {
  private readonly logger = new Logger(PreferencesService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Get user notification preferences
   */
  async getPreferences(userId: string): Promise<NotificationPreferencesDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get preferences from user's JSONB field or return defaults
    return this.getPreferencesOrDefaults(user);
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(
    userId: string,
    preferences: NotificationPreferencesDto,
  ): Promise<NotificationPreferencesDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Validate that transactional notifications cannot be disabled
    preferences = this.enforceTransactionalPreferences(preferences);

    // Store in user's metadata field (assuming metadata is JSONB)
    if (!user.metadata) {
      user.metadata = {};
    }

    user.metadata['notification_preferences'] = preferences;

    await this.userRepository.save(user);

    this.logger.log(`Updated notification preferences for user ${userId}`);

    return preferences;
  }

  /**
   * Check if notification should be sent based on user preferences
   */
  async shouldSendNotification(
    userId: string,
    notificationType: NotificationType,
    channel: NotificationChannel,
  ): Promise<boolean> {
    // Transactional notifications are always sent
    if (this.isTransactional(notificationType)) {
      return true;
    }

    const preferences = await this.getPreferences(userId);

    const channelPrefs = preferences[channel];
    if (!channelPrefs) {
      return true; // Default to sending if no preferences set
    }

    // Map notification type to preference key
    const prefKey = this.getPreferenceKey(notificationType);

    if (prefKey && channelPrefs[prefKey] !== undefined) {
      return channelPrefs[prefKey] === true;
    }

    // Default to sending if no specific preference
    return true;
  }

  /**
   * Get preferences from user or return defaults
   */
  private getPreferencesOrDefaults(user: User): NotificationPreferencesDto {
    const stored = user.metadata?.['notification_preferences'];

    if (stored) {
      return stored as NotificationPreferencesDto;
    }

    // Return default preferences
    return this.getDefaultPreferences();
  }

  /**
   * Get default notification preferences
   * Opt-in for transactional, opt-out for marketing
   */
  private getDefaultPreferences(): NotificationPreferencesDto {
    return {
      email: {
        appointment_confirmation: true,
        appointment_reminder: true,
        appointment_cancelled: true,
        appointment_rescheduled: true,
        payment_receipt: true,
        marketing: false,
        system: true,
      },
      sms: {
        appointment_reminder: true,
        appointment_cancelled: false,
        appointment_confirmation: false,
      },
      push: {
        appointment_reminder: true,
        appointment_cancelled: true,
        appointment_confirmation: true,
      },
    };
  }

  /**
   * Enforce that transactional notifications cannot be disabled
   */
  private enforceTransactionalPreferences(
    preferences: NotificationPreferencesDto,
  ): NotificationPreferencesDto {
    // Ensure critical transactional notifications are always enabled for email
    if (preferences.email) {
      preferences.email.appointment_confirmation = true;
      preferences.email.payment_receipt = true;
    }

    return preferences;
  }

  /**
   * Check if notification type is transactional (cannot be disabled)
   */
  private isTransactional(notificationType: NotificationType): boolean {
    const transactional = [
      NotificationType.APPOINTMENT_CONFIRMATION,
      NotificationType.PAYMENT_RECEIPT,
      NotificationType.PASSWORD_RESET,
      NotificationType.EMAIL_VERIFICATION,
      NotificationType.MFA_CODE,
    ];

    return transactional.includes(notificationType);
  }

  /**
   * Map notification type to preference key
   */
  private getPreferenceKey(
    notificationType: NotificationType,
  ): string | null {
    const mapping: Record<string, string> = {
      [NotificationType.APPOINTMENT_CONFIRMATION]: 'appointment_confirmation',
      [NotificationType.APPOINTMENT_REMINDER_24H]: 'appointment_reminder',
      [NotificationType.APPOINTMENT_REMINDER_1H]: 'appointment_reminder',
      [NotificationType.APPOINTMENT_CANCELLED]: 'appointment_cancelled',
      [NotificationType.APPOINTMENT_RESCHEDULED]: 'appointment_rescheduled',
      [NotificationType.PAYMENT_RECEIPT]: 'payment_receipt',
      [NotificationType.MARKETING]: 'marketing',
      [NotificationType.SYSTEM]: 'system',
    };

    return mapping[notificationType] || null;
  }

  /**
   * Opt user out of all marketing communications
   */
  async optOutOfMarketing(userId: string): Promise<void> {
    const preferences = await this.getPreferences(userId);

    preferences.email.marketing = false;
    preferences.sms = preferences.sms || {};
    preferences.sms.marketing = false;

    await this.updatePreferences(userId, preferences);

    this.logger.log(`User ${userId} opted out of marketing`);
  }

  /**
   * Opt user out of SMS (STOP keyword handler)
   */
  async optOutOfSms(userId: string): Promise<void> {
    const preferences = await this.getPreferences(userId);

    // Disable all SMS except transactional
    preferences.sms = {
      appointment_reminder: false,
      appointment_cancelled: false,
      appointment_rescheduled: false,
      marketing: false,
    };

    await this.updatePreferences(userId, preferences);

    this.logger.log(`User ${userId} opted out of SMS`);
  }
}
