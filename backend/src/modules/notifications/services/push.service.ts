import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

export interface SendPushOptions {
  token: string; // Device token
  title: string;
  body: string;
  data?: Record<string, string>; // Custom data payload
  imageUrl?: string;
  clickAction?: string; // Deep link
}

export interface PushResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    const serviceAccountJson = this.configService.get<string>(
      'FCM_SERVICE_ACCOUNT_JSON',
    );

    if (serviceAccountJson) {
      try {
        const serviceAccount = JSON.parse(serviceAccountJson);

        // Initialize Firebase Admin SDK if not already initialized
        if (!admin.apps.length) {
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
        }

        this.enabled = true;
        this.logger.log('Firebase Cloud Messaging initialized successfully');
      } catch (error) {
        this.logger.error(
          `Failed to initialize Firebase Admin SDK: ${error.message}`,
        );
        this.enabled = false;
      }
    } else {
      this.logger.warn(
        'Firebase service account not configured - push notifications will not be sent',
      );
      this.enabled = false;
    }
  }

  /**
   * Send push notification via FCM
   */
  async sendPush(options: SendPushOptions): Promise<PushResult> {
    if (!this.enabled) {
      this.logger.warn('Push service not enabled - skipping send');
      return {
        success: false,
        error: 'Push service not configured',
      };
    }

    try {
      const message: admin.messaging.Message = {
        token: options.token,
        notification: {
          title: options.title,
          body: options.body,
        },
        data: options.data || {},
      };

      // Add image if provided
      if (options.imageUrl) {
        message.notification.imageUrl = options.imageUrl;
      }

      // Add click action (deep link) for Android
      if (options.clickAction) {
        message.android = {
          notification: {
            clickAction: options.clickAction,
          },
        };

        // For iOS, add deep link to data
        if (message.data) {
          message.data.clickAction = options.clickAction;
        }
      }

      const messageId = await admin.messaging().send(message);

      this.logger.log(`Push notification sent successfully: ${messageId}`);

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send push notification: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        error: this.parseErrorMessage(error),
      };
    }
  }

  /**
   * Send push notification to multiple tokens
   */
  async sendMulticast(
    tokens: string[],
    notification: {
      title: string;
      body: string;
      data?: Record<string, string>;
    },
  ): Promise<{
    successCount: number;
    failureCount: number;
    results: PushResult[];
  }> {
    if (!this.enabled) {
      this.logger.warn('Push service not enabled - skipping multicast');
      return {
        successCount: 0,
        failureCount: tokens.length,
        results: tokens.map(() => ({
          success: false,
          error: 'Push service not configured',
        })),
      };
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data || {},
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      this.logger.log(
        `Multicast push sent: ${response.successCount} succeeded, ${response.failureCount} failed`,
      );

      const results: PushResult[] = response.responses.map((resp, idx) => {
        if (resp.success) {
          return {
            success: true,
            messageId: resp.messageId,
          };
        } else {
          return {
            success: false,
            error: this.parseErrorMessage(resp.error),
          };
        }
      });

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        results,
      };
    } catch (error) {
      this.logger.error(`Multicast push failed: ${error.message}`);

      return {
        successCount: 0,
        failureCount: tokens.length,
        results: tokens.map(() => ({
          success: false,
          error: this.parseErrorMessage(error),
        })),
      };
    }
  }

  /**
   * Subscribe tokens to a topic (for broadcast notifications)
   */
  async subscribeToTopic(
    tokens: string[],
    topic: string,
  ): Promise<{ successCount: number; failureCount: number }> {
    if (!this.enabled) {
      return { successCount: 0, failureCount: tokens.length };
    }

    try {
      const response = await admin
        .messaging()
        .subscribeToTopic(tokens, topic);

      this.logger.log(
        `Topic subscription: ${response.successCount} succeeded, ${response.failureCount} failed`,
      );

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      this.logger.error(`Topic subscription failed: ${error.message}`);
      return { successCount: 0, failureCount: tokens.length };
    }
  }

  /**
   * Send notification to a topic
   */
  async sendToTopic(
    topic: string,
    notification: {
      title: string;
      body: string;
      data?: Record<string, string>;
    },
  ): Promise<PushResult> {
    if (!this.enabled) {
      return {
        success: false,
        error: 'Push service not configured',
      };
    }

    try {
      const message: admin.messaging.Message = {
        topic,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data || {},
      };

      const messageId = await admin.messaging().send(message);

      this.logger.log(`Topic notification sent successfully: ${messageId}`);

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      this.logger.error(`Topic notification failed: ${error.message}`);
      return {
        success: false,
        error: this.parseErrorMessage(error),
      };
    }
  }

  /**
   * Parse FCM error response
   */
  private parseErrorMessage(error: any): string {
    if (error?.code) {
      // FCM error codes
      switch (error.code) {
        case 'messaging/invalid-registration-token':
          return 'Invalid device token';
        case 'messaging/registration-token-not-registered':
          return 'Device token not registered';
        case 'messaging/invalid-argument':
          return 'Invalid message argument';
        case 'messaging/authentication-error':
          return 'Authentication error';
        default:
          return `FCM Error ${error.code}: ${error.message}`;
      }
    }
    return error?.message || 'Unknown error';
  }

  /**
   * Check if error is permanent (invalid token, should remove from database)
   */
  isPermanentError(error: string): boolean {
    const permanentErrors = [
      'invalid-registration-token',
      'registration-token-not-registered',
      'invalid device token',
      'device token not registered',
    ];

    return permanentErrors.some((err) =>
      error.toLowerCase().includes(err),
    );
  }

  /**
   * Check if error is transient (should retry)
   */
  isTransientError(error: string): boolean {
    const transientErrors = [
      'unavailable',
      'internal',
      'timeout',
      'network',
    ];

    return transientErrors.some((err) =>
      error.toLowerCase().includes(err),
    );
  }
}
