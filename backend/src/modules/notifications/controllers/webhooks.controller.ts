import { Controller, Post, Body, Headers, Logger, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationStatus } from '../entities/notification.entity';

@ApiTags('Webhooks')
@Controller('notifications/webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  /**
   * SendGrid webhook handler
   * Receives delivery status events from SendGrid
   */
  @Post('sendgrid')
  @HttpCode(200)
  @ApiExcludeEndpoint() // Exclude from public API docs
  async handleSendGridWebhook(
    @Body() events: any[],
    @Headers('x-twilio-email-event-webhook-signature') signature?: string,
  ): Promise<{ processed: number }> {
    this.logger.log(`Received SendGrid webhook with ${events.length} events`);

    // TODO: Verify webhook signature for security
    // const isValid = this.verifySendGridSignature(events, signature);
    // if (!isValid) {
    //   throw new UnauthorizedException('Invalid webhook signature');
    // }

    let processed = 0;

    for (const event of events) {
      try {
        await this.processSendGridEvent(event);
        processed++;
      } catch (error) {
        this.logger.error(
          `Failed to process SendGrid event: ${error.message}`,
          error.stack,
        );
      }
    }

    return { processed };
  }

  /**
   * Twilio webhook handler
   * Receives SMS delivery status updates from Twilio
   */
  @Post('twilio')
  @HttpCode(200)
  @ApiExcludeEndpoint()
  async handleTwilioWebhook(
    @Body() event: any,
  ): Promise<{ success: boolean }> {
    this.logger.log(`Received Twilio webhook: ${event.MessageStatus}`);

    try {
      await this.processTwilioEvent(event);
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to process Twilio event: ${error.message}`,
        error.stack,
      );
      return { success: false };
    }
  }

  /**
   * Process SendGrid event and update notification status
   */
  private async processSendGridEvent(event: any): Promise<void> {
    const { event: eventType, sg_message_id, email, timestamp } = event;

    // Find notification by SendGrid message ID
    const notification = await this.notificationRepository.findOne({
      where: { gateway_message_id: sg_message_id },
    });

    if (!notification) {
      this.logger.warn(
        `Notification not found for SendGrid message ID: ${sg_message_id}`,
      );
      return;
    }

    // Update status based on event type
    switch (eventType) {
      case 'delivered':
        notification.status = NotificationStatus.DELIVERED;
        notification.delivered_at = new Date(timestamp * 1000);
        break;

      case 'bounce':
      case 'blocked':
        notification.status = NotificationStatus.BOUNCED;
        notification.failed_reason = event.reason || 'Email bounced';
        break;

      case 'dropped':
        notification.status = NotificationStatus.FAILED;
        notification.failed_reason = event.reason || 'Email dropped';
        break;

      case 'open':
        if (notification.status === NotificationStatus.DELIVERED) {
          notification.status = NotificationStatus.OPENED;
          notification.opened_at = new Date(timestamp * 1000);
        }
        break;

      case 'click':
        if (notification.status !== NotificationStatus.CLICKED) {
          notification.status = NotificationStatus.CLICKED;
          notification.clicked_at = new Date(timestamp * 1000);
        }
        break;

      case 'spamreport':
      case 'unsubscribe':
        this.logger.warn(
          `User ${email} reported spam or unsubscribed`,
        );
        // TODO: Update user preferences to opt-out
        break;

      default:
        this.logger.debug(`Unhandled SendGrid event type: ${eventType}`);
        return;
    }

    await this.notificationRepository.save(notification);

    this.logger.log(
      `Updated notification ${notification.id} status to ${notification.status}`,
    );
  }

  /**
   * Process Twilio event and update notification status
   */
  private async processTwilioEvent(event: any): Promise<void> {
    const { MessageSid, MessageStatus, ErrorCode, To } = event;

    // Find notification by Twilio message SID
    const notification = await this.notificationRepository.findOne({
      where: { gateway_message_id: MessageSid },
    });

    if (!notification) {
      this.logger.warn(
        `Notification not found for Twilio message SID: ${MessageSid}`,
      );
      return;
    }

    // Update status based on Twilio status
    switch (MessageStatus) {
      case 'queued':
      case 'sending':
        notification.status = NotificationStatus.SENT;
        if (!notification.sent_at) {
          notification.sent_at = new Date();
        }
        break;

      case 'sent':
      case 'delivered':
        notification.status = NotificationStatus.DELIVERED;
        notification.delivered_at = new Date();
        break;

      case 'undelivered':
      case 'failed':
        notification.status = NotificationStatus.FAILED;
        notification.failed_reason = ErrorCode
          ? `Twilio Error ${ErrorCode}`
          : 'SMS failed';
        break;

      default:
        this.logger.debug(`Unhandled Twilio status: ${MessageStatus}`);
        return;
    }

    await this.notificationRepository.save(notification);

    this.logger.log(
      `Updated notification ${notification.id} status to ${notification.status}`,
    );
  }

  /**
   * Verify SendGrid webhook signature (for security)
   */
  private verifySendGridSignature(
    payload: any,
    signature: string,
  ): boolean {
    // TODO: Implement signature verification
    // See: https://docs.sendgrid.com/for-developers/tracking-events/getting-started-event-webhook-security-features
    return true;
  }

  /**
   * Verify Twilio webhook signature (for security)
   */
  private verifyTwilioSignature(
    url: string,
    params: any,
    signature: string,
  ): boolean {
    // TODO: Implement signature verification
    // See: https://www.twilio.com/docs/usage/security#validating-requests
    return true;
  }
}
