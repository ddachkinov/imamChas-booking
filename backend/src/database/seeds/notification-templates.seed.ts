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
      name: 'Потвърждение на среща (Имейл)',
      notification_type: NotificationType.APPOINTMENT_CONFIRMATION,
      channel: NotificationChannel.EMAIL,
      language: 'bg',
      subject: 'Срещата е потвърдена - {{business_name}}',
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
      <h1>Срещата е потвърдена</h1>
    </div>
    <div class="content">
      <p>Здравейте {{client_name}},</p>
      <p>Вашата среща е потвърдена!</p>

      <div class="details">
        <h3>Детайли на срещата</h3>
        <p><strong>Услуга:</strong> {{service_name}}</p>
        <p><strong>Дата и час:</strong> {{appointment_datetime}}</p>
        <p><strong>Продължителност:</strong> {{service_duration}} минути</p>
        <p><strong>Със:</strong> {{staff_name}}</p>
        <p><strong>Локация:</strong> {{location_name}}<br>{{location_address}}</p>
      </div>

      <p>Очакваме ви с нетърпение!</p>

      <p style="text-align: center;">
        <a href="{{booking_url}}" class="button">Преглед на срещата</a>
      </p>
    </div>
    <div class="footer">
      <p>Нужда от промени? <a href="{{manage_url}}">Управление на срещата</a></p>
      <p>&copy; {{business_name}}. Всички права запазени.</p>
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
      name: 'Потвърждение на среща (SMS)',
      notification_type: NotificationType.APPOINTMENT_CONFIRMATION,
      channel: NotificationChannel.SMS,
      language: 'bg',
      subject: null,
      body_template: '{{business_name}}: Среща потвърдена за {{appointment_date}} в {{appointment_time}} със {{staff_name}}.',
      is_system_template: true,
      is_active: true,
    },

    // Appointment Reminder 24H - Email
    {
      tenant_id: null,
      business_id: null,
      name: 'Напомняне за среща 24ч (Имейл)',
      notification_type: NotificationType.APPOINTMENT_REMINDER_24H,
      channel: NotificationChannel.EMAIL,
      language: 'bg',
      subject: 'Напомняне: Среща утре - {{business_name}}',
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
      <h1>📅 Напомняне за среща</h1>
    </div>
    <div class="content">
      <p>Здравейте {{client_name}},</p>
      <p>Това е напомняне за вашата предстояща среща утре.</p>

      <div class="details">
        <h3>Детайли на срещата</h3>
        <p><strong>Услуга:</strong> {{service_name}}</p>
        <p><strong>Дата и час:</strong> {{appointment_datetime}}</p>
        <p><strong>Със:</strong> {{staff_name}}</p>
        <p><strong>Локация:</strong> {{location_name}}</p>
      </div>

      <p>Очакваме ви с нетърпение!</p>

      <p style="text-align: center;">
        <a href="{{reschedule_url}}" class="button">Пренасрочване</a>
        <a href="{{cancel_url}}" class="button" style="background-color: #EF4444;">Отмяна</a>
      </p>
    </div>
    <div class="footer">
      <p>&copy; {{business_name}}. Всички права запазени.</p>
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
      name: 'Напомняне за среща 24ч (SMS)',
      notification_type: NotificationType.APPOINTMENT_REMINDER_24H,
      channel: NotificationChannel.SMS,
      language: 'bg',
      subject: null,
      body_template: '{{business_name}}: Напомняне - Среща утре в {{appointment_time}} със {{staff_name}} на {{location_name}}.',
      is_system_template: true,
      is_active: true,
    },

    // Appointment Reminder 1H - Email
    {
      tenant_id: null,
      business_id: null,
      name: 'Напомняне за среща 1ч (Имейл)',
      notification_type: NotificationType.APPOINTMENT_REMINDER_1H,
      channel: NotificationChannel.EMAIL,
      language: 'bg',
      subject: 'Започва скоро: Вашата среща след 1 час - {{business_name}}',
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
      <h1>⏰ Започва скоро!</h1>
    </div>
    <div class="content">
      <p>Здравейте {{client_name}},</p>
      <p>Вашата среща започва след 1 час.</p>

      <div class="details">
        <h3>Детайли на срещата</h3>
        <p><strong>Час:</strong> {{appointment_time}}</p>
        <p><strong>Услуга:</strong> {{service_name}}</p>
        <p><strong>Със:</strong> {{staff_name}}</p>
        <p><strong>Локация:</strong> {{location_name}}<br>{{location_address}}</p>
      </div>

      <p>До скоро!</p>
    </div>
    <div class="footer">
      <p>&copy; {{business_name}}. Всички права запазени.</p>
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
      name: 'Напомняне за среща 1ч (SMS)',
      notification_type: NotificationType.APPOINTMENT_REMINDER_1H,
      channel: NotificationChannel.SMS,
      language: 'bg',
      subject: null,
      body_template: '{{business_name}}: Вашата среща започва след 1 час ({{appointment_time}}) със {{staff_name}}. До скоро!',
      is_system_template: true,
      is_active: true,
    },

    // Appointment Cancelled - Email
    {
      tenant_id: null,
      business_id: null,
      name: 'Отменена среща (Имейл)',
      notification_type: NotificationType.APPOINTMENT_CANCELLED,
      channel: NotificationChannel.EMAIL,
      language: 'bg',
      subject: 'Срещата е отменена - {{business_name}}',
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
      <h1>Срещата е отменена</h1>
    </div>
    <div class="content">
      <p>Здравейте {{client_name}},</p>
      <p>Вашата среща е отменена.</p>

      <div class="details">
        <h3>Отменена среща</h3>
        <p><strong>Услуга:</strong> {{service_name}}</p>
        <p><strong>Беше планирана за:</strong> {{appointment_datetime}}</p>
        <p><strong>Със:</strong> {{staff_name}}</p>
        {{#if cancellation_reason}}
        <p><strong>Причина:</strong> {{cancellation_reason}}</p>
        {{/if}}
      </div>

      <p>Надяваме се скоро да ви видим отново!</p>

      <p style="text-align: center;">
        <a href="{{book_again_url}}" class="button">Резервирайте друга среща</a>
      </p>
    </div>
    <div class="footer">
      <p>&copy; {{business_name}}. Всички права запазени.</p>
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
      name: 'Нулиране на парола (Имейл)',
      notification_type: NotificationType.PASSWORD_RESET,
      channel: NotificationChannel.EMAIL,
      language: 'bg',
      subject: 'Нулиране на вашата парола',
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
      <h1>🔒 Нулиране на парола</h1>
    </div>
    <div class="content">
      <p>Здравейте {{client_name}},</p>
      <p>Получихме заявка за нулиране на вашата парола. Кликнете на бутона по-долу, за да създадете нова парола:</p>

      <p style="text-align: center;">
        <a href="{{reset_link}}" class="button">Нулирай паролата</a>
      </p>

      <p>Тази връзка ще изтече след 1 час.</p>
      <p>Ако не сте заявили нулиране на парола, можете спокойно да игнорирате този имейл.</p>
    </div>
    <div class="footer">
      <p>От съображения за сигурност, никога не споделяйте този имейл с никого.</p>
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
