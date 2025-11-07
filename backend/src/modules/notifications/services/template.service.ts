import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationTemplate } from '../entities/notification-template.entity';
import { NotificationChannel, NotificationType } from '../entities/notification.entity';
import * as Handlebars from 'handlebars';

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);

  constructor(
    @InjectRepository(NotificationTemplate)
    private readonly templateRepository: Repository<NotificationTemplate>,
  ) {
    // Register custom Handlebars helpers
    this.registerHelpers();
  }

  /**
   * Get template for a specific notification type, channel, and language
   * Prefers business-specific > tenant-specific > system templates
   */
  async getTemplate(
    tenantId: string,
    notificationType: NotificationType,
    channel: NotificationChannel,
    businessId?: string,
    language = 'en',
  ): Promise<NotificationTemplate> {
    // Try business-specific template first
    if (businessId) {
      const businessTemplate = await this.templateRepository.findOne({
        where: {
          business_id: businessId,
          notification_type: notificationType,
          channel,
          language,
          is_active: true,
        },
      });

      if (businessTemplate) {
        return businessTemplate;
      }
    }

    // Try tenant-specific template
    const tenantTemplate = await this.templateRepository.findOne({
      where: {
        tenant_id: tenantId,
        business_id: null,
        notification_type: notificationType,
        channel,
        language,
        is_active: true,
      },
    });

    if (tenantTemplate) {
      return tenantTemplate;
    }

    // Fall back to system template
    const systemTemplate = await this.templateRepository.findOne({
      where: {
        tenant_id: null,
        business_id: null,
        notification_type: notificationType,
        channel,
        language,
        is_system_template: true,
        is_active: true,
      },
    });

    if (systemTemplate) {
      return systemTemplate;
    }

    throw new NotFoundException(
      `No template found for ${notificationType} on ${channel} in ${language}`,
    );
  }

  /**
   * Render template with variables using Handlebars
   */
  renderTemplate(
    templateBody: string,
    variables: Record<string, any>,
  ): string {
    try {
      const template = Handlebars.compile(templateBody);
      return template(variables);
    } catch (error) {
      this.logger.error(
        `Template rendering error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Render subject and body from template
   */
  renderTemplateWithSubject(
    template: NotificationTemplate,
    variables: Record<string, any>,
  ): { subject?: string; body: string } {
    const renderedBody = this.renderTemplate(template.body_template, variables);

    const result: { subject?: string; body: string } = {
      body: renderedBody,
    };

    if (template.subject) {
      result.subject = this.renderTemplate(template.subject, variables);
    }

    return result;
  }

  /**
   * Preview template with sample variables
   */
  previewTemplate(
    template: NotificationTemplate,
    sampleVariables: Record<string, any>,
  ): { subject?: string; body: string } {
    return this.renderTemplateWithSubject(template, sampleVariables);
  }

  /**
   * Validate template syntax (ensure it compiles)
   */
  validateTemplate(templateBody: string): { valid: boolean; error?: string } {
    try {
      Handlebars.compile(templateBody);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
      };
    }
  }

  /**
   * Register custom Handlebars helpers
   */
  private registerHelpers(): void {
    // Format date helper
    Handlebars.registerHelper('formatDate', (date: Date | string, format: string) => {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      // Simple date formatting (could use dayjs for more options)
      if (format === 'short') {
        return dateObj.toLocaleDateString();
      } else if (format === 'long') {
        return dateObj.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      } else if (format === 'time') {
        return dateObj.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        });
      }
      return dateObj.toString();
    });

    // Uppercase helper
    Handlebars.registerHelper('uppercase', (str: string) => {
      return str?.toUpperCase() || '';
    });

    // Lowercase helper
    Handlebars.registerHelper('lowercase', (str: string) => {
      return str?.toLowerCase() || '';
    });

    // Currency helper
    Handlebars.registerHelper('currency', (amount: number, currency = 'USD') => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
      }).format(amount);
    });

    // Default value helper
    Handlebars.registerHelper('default', (value: any, defaultValue: any) => {
      return value !== undefined && value !== null ? value : defaultValue;
    });
  }
}
