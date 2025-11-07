import { DataSource } from 'typeorm';
import { NotificationTemplate } from '../../modules/notifications/entities/notification-template.entity';
import { NotificationChannel, NotificationType } from '../../modules/notifications/entities/notification.entity';

export async function seedNotificationTemplates(dataSource: DataSource): Promise<void> {
  const templateRepository = dataSource.getRepository(NotificationTemplate);

  // System templates (tenant_id = null, business_id = null)
  const systemTemplates: Partial<NotificationTemplate>[] = [
    // Appointment Confirmation - Email
    {
      tenant_id: null,
      business_id: null,
      name: 'Appointment Confirmation (Email)',
      notification_type: NotificationType.APPOINTMENT_CONFIRMATION,
      channel: NotificationChannel.EMAIL,
      language: 'en',
      subject: 'Appointment Confirmed - {{business_name}}',
      body_template: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9fafb; }
    .details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Appointment Confirmed</h1>
    </div>
    <div class="content">
      <p>Hi {{client_name}},</p>
      <p>Your appointment has been confirmed!</p>

      <div class="details">
        <h3>Appointment Details</h3>
        <p><strong>Service:</strong> {{service_name}}</p>
        <p><strong>Date & Time:</strong> {{appointment_datetime}}</p>
        <p><strong>Duration:</strong> {{service_duration}} minutes</p>
        <p><strong>With:</strong> {{staff_name}}</p>
        <p><strong>Location:</strong> {{location_name}}<br>{{location_address}}</p>
      </div>

      <p>We look forward to seeing you!</p>

      <p style="text-align: center;">
        <a href="{{booking_url}}" class="button">View Appointment</a>
      </p>
    </div>
    <div class="footer">
      <p>Need to make changes? <a href="{{manage_url}}">Manage your appointment</a></p>
      <p>&copy; {{business_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
      `,
      is_system_template: true,
      is_active: true,
    },

    // Appointment Confirmation - SMS
    {
      tenant_id: null,
      business_id: null,
      name: 'Appointment Confirmation (SMS)',
      notification_type: NotificationType.APPOINTMENT_CONFIRMATION,
      channel: NotificationChannel.SMS,
      language: 'en',
      subject: null,
      body_template: '{{business_name}}: Appt confirmed for {{appointment_date}} at {{appointment_time}} with {{staff_name}}. Reply STOP to unsubscribe.',
      is_system_template: true,
      is_active: true,
    },

    // Appointment Reminder 24H - Email
    {
      tenant_id: null,
      business_id: null,
      name: 'Appointment Reminder 24H (Email)',
      notification_type: NotificationType.APPOINTMENT_REMINDER_24H,
      channel: NotificationChannel.EMAIL,
      language: 'en',
      subject: 'Reminder: Appointment Tomorrow - {{business_name}}',
      body_template: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #10B981; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9fafb; }
    .details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #10B981; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📅 Appointment Reminder</h1>
    </div>
    <div class="content">
      <p>Hi {{client_name}},</p>
      <p>This is a friendly reminder about your upcoming appointment tomorrow.</p>

      <div class="details">
        <h3>Appointment Details</h3>
        <p><strong>Service:</strong> {{service_name}}</p>
        <p><strong>Date & Time:</strong> {{appointment_datetime}}</p>
        <p><strong>With:</strong> {{staff_name}}</p>
        <p><strong>Location:</strong> {{location_name}}</p>
      </div>

      <p>Looking forward to seeing you!</p>

      <p style="text-align: center;">
        <a href="{{reschedule_url}}" class="button">Reschedule</a>
        <a href="{{cancel_url}}" class="button" style="background-color: #EF4444;">Cancel</a>
      </p>
    </div>
    <div class="footer">
      <p>&copy; {{business_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
      `,
      is_system_template: true,
      is_active: true,
    },

    // Appointment Reminder 24H - SMS
    {
      tenant_id: null,
      business_id: null,
      name: 'Appointment Reminder 24H (SMS)',
      notification_type: NotificationType.APPOINTMENT_REMINDER_24H,
      channel: NotificationChannel.SMS,
      language: 'en',
      subject: null,
      body_template: '{{business_name}}: Reminder - Appt tomorrow {{appointment_time}} with {{staff_name}} at {{location_name}}.',
      is_system_template: true,
      is_active: true,
    },

    // Appointment Reminder 1H - Email
    {
      tenant_id: null,
      business_id: null,
      name: 'Appointment Reminder 1H (Email)',
      notification_type: NotificationType.APPOINTMENT_REMINDER_1H,
      channel: NotificationChannel.EMAIL,
      language: 'en',
      subject: 'Starting Soon: Your Appointment in 1 Hour - {{business_name}}',
      body_template: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #F59E0B; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9fafb; }
    .details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Starting Soon!</h1>
    </div>
    <div class="content">
      <p>Hi {{client_name}},</p>
      <p>Your appointment starts in 1 hour.</p>

      <div class="details">
        <h3>Appointment Details</h3>
        <p><strong>Time:</strong> {{appointment_time}}</p>
        <p><strong>Service:</strong> {{service_name}}</p>
        <p><strong>With:</strong> {{staff_name}}</p>
        <p><strong>Location:</strong> {{location_name}}<br>{{location_address}}</p>
      </div>

      <p>See you soon!</p>
    </div>
    <div class="footer">
      <p>&copy; {{business_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
      `,
      is_system_template: true,
      is_active: true,
    },

    // Appointment Reminder 1H - SMS
    {
      tenant_id: null,
      business_id: null,
      name: 'Appointment Reminder 1H (SMS)',
      notification_type: NotificationType.APPOINTMENT_REMINDER_1H,
      channel: NotificationChannel.SMS,
      language: 'en',
      subject: null,
      body_template: '{{business_name}}: Your appt starts in 1 hour ({{appointment_time}}) with {{staff_name}}. See you soon!',
      is_system_template: true,
      is_active: true,
    },

    // Appointment Cancelled - Email
    {
      tenant_id: null,
      business_id: null,
      name: 'Appointment Cancelled (Email)',
      notification_type: NotificationType.APPOINTMENT_CANCELLED,
      channel: NotificationChannel.EMAIL,
      language: 'en',
      subject: 'Appointment Cancelled - {{business_name}}',
      body_template: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #EF4444; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9fafb; }
    .details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Appointment Cancelled</h1>
    </div>
    <div class="content">
      <p>Hi {{client_name}},</p>
      <p>Your appointment has been cancelled.</p>

      <div class="details">
        <h3>Cancelled Appointment</h3>
        <p><strong>Service:</strong> {{service_name}}</p>
        <p><strong>Was scheduled for:</strong> {{appointment_datetime}}</p>
        <p><strong>With:</strong> {{staff_name}}</p>
        {{#if cancellation_reason}}
        <p><strong>Reason:</strong> {{cancellation_reason}}</p>
        {{/if}}
      </div>

      <p>We hope to see you again soon!</p>

      <p style="text-align: center;">
        <a href="{{book_again_url}}" class="button">Book Another Appointment</a>
      </p>
    </div>
    <div class="footer">
      <p>&copy; {{business_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
      `,
      is_system_template: true,
      is_active: true,
    },

    // Password Reset - Email
    {
      tenant_id: null,
      business_id: null,
      name: 'Password Reset (Email)',
      notification_type: NotificationType.PASSWORD_RESET,
      channel: NotificationChannel.EMAIL,
      language: 'en',
      subject: 'Reset Your Password',
      body_template: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #6366F1; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9fafb; }
    .button { display: inline-block; padding: 12px 24px; background-color: #6366F1; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔒 Password Reset</h1>
    </div>
    <div class="content">
      <p>Hi {{client_name}},</p>
      <p>We received a request to reset your password. Click the button below to create a new password:</p>

      <p style="text-align: center;">
        <a href="{{reset_link}}" class="button">Reset Password</a>
      </p>

      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request a password reset, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      <p>For security reasons, never share this email with anyone.</p>
    </div>
  </div>
</body>
</html>
      `,
      is_system_template: true,
      is_active: true,
    },
  ];

  // Create or update templates
  for (const templateData of systemTemplates) {
    const existing = await templateRepository.findOne({
      where: {
        name: templateData.name,
        is_system_template: true,
      },
    });

    if (existing) {
      // Update existing template
      Object.assign(existing, templateData);
      await templateRepository.save(existing);
    } else {
      // Create new template
      const template = templateRepository.create(templateData);
      await templateRepository.save(template);
    }
  }

  console.log(`Seeded ${systemTemplates.length} notification templates`);
}
