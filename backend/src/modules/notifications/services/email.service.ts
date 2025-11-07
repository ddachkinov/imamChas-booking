import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';

export interface SendEmailOptions {
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  from?: {
    email: string;
    name: string;
  };
  replyTo?: string;
  attachments?: Array<{
    content: string;
    filename: string;
    type: string;
  }>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');

    if (apiKey) {
      sgMail.setApiKey(apiKey);
    } else {
      this.logger.warn('SendGrid API key not configured - emails will not be sent');
    }

    this.fromEmail = this.configService.get<string>(
      'SENDGRID_FROM_EMAIL',
      'noreply@booking-platform.com',
    );
    this.fromName = this.configService.get<string>(
      'SENDGRID_FROM_NAME',
      'Booking Platform',
    );
  }

  /**
   * Send email via SendGrid
   */
  async sendEmail(options: SendEmailOptions): Promise<EmailResult> {
    try {
      const msg: sgMail.MailDataRequired = {
        to: options.to,
        from: options.from || {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject: options.subject,
        html: options.htmlBody,
        text: options.textBody || this.stripHtml(options.htmlBody),
      };

      if (options.replyTo) {
        msg.replyTo = options.replyTo;
      }

      if (options.attachments) {
        msg.attachments = options.attachments;
      }

      const [response] = await sgMail.send(msg);

      const messageId = response.headers['x-message-id'] as string;

      this.logger.log(`Email sent successfully to ${options.to}: ${messageId}`);

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${options.to}: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        error: this.parseErrorMessage(error),
      };
    }
  }

  /**
   * Send bulk emails (batch processing)
   */
  async sendBulkEmails(
    emails: SendEmailOptions[],
  ): Promise<EmailResult[]> {
    const results: EmailResult[] = [];

    // SendGrid allows up to 1000 emails per request
    // We'll send in batches of 100 for better error handling
    const batchSize = 100;

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);

      for (const email of batch) {
        const result = await this.sendEmail(email);
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Validate email address format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Strip HTML tags to create plain text version
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<style[^>]*>.*<\/style>/gm, '')
      .replace(/<script[^>]*>.*<\/script>/gm, '')
      .replace(/<[^>]+>/gm, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Parse SendGrid error response
   */
  private parseErrorMessage(error: any): string {
    if (error.response?.body?.errors) {
      return error.response.body.errors
        .map((err: any) => err.message)
        .join('; ');
    }
    return error.message || 'Unknown error';
  }

  /**
   * Check if error is permanent (should not retry)
   */
  isPermanentError(error: string): boolean {
    const permanentErrors = [
      'invalid email',
      'does not contain a valid address',
      'unsubscribed',
      'bounced',
      'blocked',
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
      'timeout',
      'network',
      'rate limit',
      'temporarily',
      'try again',
    ];

    return transientErrors.some((err) =>
      error.toLowerCase().includes(err),
    );
  }
}
