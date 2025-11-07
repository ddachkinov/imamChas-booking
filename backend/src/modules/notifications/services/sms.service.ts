import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

export interface SendSmsOptions {
  to: string;
  body: string;
  from?: string;
}

export interface SmsResult {
  success: boolean;
  messageSid?: string;
  error?: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly client: Twilio;
  private readonly fromNumber: string;
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.fromNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER', '');

    if (accountSid && authToken) {
      this.client = new Twilio(accountSid, authToken);
      this.enabled = true;
    } else {
      this.logger.warn('Twilio credentials not configured - SMS will not be sent');
      this.enabled = false;
    }
  }

  /**
   * Send SMS via Twilio
   */
  async sendSms(options: SendSmsOptions): Promise<SmsResult> {
    if (!this.enabled) {
      this.logger.warn('SMS service not enabled - skipping send');
      return {
        success: false,
        error: 'SMS service not configured',
      };
    }

    try {
      // Validate phone number format
      const validatedPhone = this.validatePhoneNumber(options.to);
      if (!validatedPhone) {
        return {
          success: false,
          error: 'Invalid phone number format',
        };
      }

      // Check SMS length (Twilio handles concatenation but we should warn)
      if (options.body.length > 160) {
        this.logger.warn(
          `SMS body exceeds 160 characters (${options.body.length}). Will be sent as multiple segments.`,
        );
      }

      const message = await this.client.messages.create({
        body: options.body,
        to: validatedPhone,
        from: options.from || this.fromNumber,
      });

      this.logger.log(`SMS sent successfully to ${validatedPhone}: ${message.sid}`);

      return {
        success: true,
        messageSid: message.sid,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send SMS to ${options.to}: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        error: this.parseErrorMessage(error),
      };
    }
  }

  /**
   * Get SMS delivery status from Twilio
   */
  async getSmsStatus(messageSid: string): Promise<{
    status: string;
    errorCode?: string;
    errorMessage?: string;
  }> {
    if (!this.enabled) {
      return {
        status: 'unknown',
        errorMessage: 'SMS service not configured',
      };
    }

    try {
      const message = await this.client.messages(messageSid).fetch();

      return {
        status: message.status,
        errorCode: message.errorCode?.toString(),
        errorMessage: message.errorMessage || undefined,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch SMS status: ${error.message}`);
      return {
        status: 'unknown',
        errorMessage: error.message,
      };
    }
  }

  /**
   * Validate and format phone number
   * Ensures E.164 format (+1234567890)
   */
  validatePhoneNumber(phone: string): string | null {
    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');

    // If no + prefix, assume US number and add +1
    if (!cleaned.startsWith('+')) {
      // If 10 digits, assume US
      if (cleaned.length === 10) {
        cleaned = '+1' + cleaned;
      } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
        cleaned = '+' + cleaned;
      } else {
        return null; // Invalid format
      }
    }

    // Validate E.164 format: + followed by 1-15 digits
    const e164Regex = /^\+\d{1,15}$/;
    if (!e164Regex.test(cleaned)) {
      return null;
    }

    return cleaned;
  }

  /**
   * Truncate SMS body to fit within character limit
   * Preserves whole words when possible
   */
  truncateSmsBody(body: string, maxLength = 160): string {
    if (body.length <= maxLength) {
      return body;
    }

    // Find last space before maxLength
    const truncated = body.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');

    if (lastSpace > maxLength * 0.8) {
      // If last space is reasonably close, truncate there
      return truncated.substring(0, lastSpace) + '...';
    }

    // Otherwise hard truncate
    return truncated.substring(0, maxLength - 3) + '...';
  }

  /**
   * Parse Twilio error response
   */
  private parseErrorMessage(error: any): string {
    if (error.code) {
      return `Twilio Error ${error.code}: ${error.message}`;
    }
    return error.message || 'Unknown error';
  }

  /**
   * Check if error is permanent (should not retry)
   */
  isPermanentError(error: string): boolean {
    // Twilio error codes for permanent failures
    const permanentErrors = [
      '21211', // Invalid 'To' phone number
      '21612', // Cannot route to this number
      '21614', // Invalid mobile number
      '21408', // Permission to send to this number denied
      'unsubscribed',
      'invalid',
      'blocked',
    ];

    return permanentErrors.some((err) =>
      error.toLowerCase().includes(err.toLowerCase()),
    );
  }

  /**
   * Check if error is transient (should retry)
   */
  isTransientError(error: string): boolean {
    const transientErrors = [
      '20429', // Too many requests (rate limit)
      '21610', // Message cannot be sent at this time
      'timeout',
      'network',
      'temporarily',
    ];

    return transientErrors.some((err) =>
      error.toLowerCase().includes(err.toLowerCase()),
    );
  }

  /**
   * Estimate SMS cost (approximate, actual cost depends on destination)
   */
  estimateCost(body: string): number {
    const segments = Math.ceil(body.length / 160);
    const costPerSegment = 0.0075; // Approximate US cost in USD
    return segments * costPerSegment;
  }
}
