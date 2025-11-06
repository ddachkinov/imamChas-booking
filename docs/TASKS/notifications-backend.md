# Task: Notifications Backend

## Task Title
Implement Multi-Channel Notification System with Templating and Scheduling

## Description

Build a comprehensive notification system that handles email, SMS, and push notifications across the platform. The system must support templating, scheduling, delivery tracking, retry logic, and user preferences. Notifications are critical for user engagement, appointment reminders, and business communication.

The implementation must support:
- Email notifications via SendGrid or AWS SES
- SMS notifications via Twilio
- Push notifications via Firebase Cloud Messaging (FCM)
- Template management with variable substitution
- Scheduled notifications (reminders sent at specific times)
- Immediate notifications (booking confirmations)
- Delivery status tracking
- Retry logic for failed deliveries
- Rate limiting per channel
- User notification preferences (opt-in/opt-out)
- Notification history and audit trail
- Bulk notifications (email campaigns in Phase 3)

This task depends on the authentication system and integrates with appointment booking, but can be developed in parallel with other modules.

## Acceptance Criteria

### Email Notifications

- [ ] Email can be sent via SendGrid API
- [ ] Email supports HTML and plain text versions
- [ ] Email includes business branding (logo, colors)
- [ ] Email templates support variable substitution (client name, appointment details)
- [ ] Email sent for appointment confirmation within 5 minutes
- [ ] Email sent for appointment cancellation within 5 minutes
- [ ] Email sent for appointment reminder (24 hours before, 1 hour before)
- [ ] Email sent for password reset with secure link
- [ ] Email sent for email verification with verification link
- [ ] Email delivery status tracked (sent, delivered, bounced, opened, clicked)
- [ ] Failed email delivery retried up to 3 times with exponential backoff
- [ ] Email rate limiting enforced (prevent spam)
- [ ] Email unsubscribe link included in marketing emails
- [ ] Email respects user preferences (can opt-out of certain types)

### SMS Notifications

- [ ] SMS can be sent via Twilio API
- [ ] SMS supports text messages up to 160 characters (or concatenated messages)
- [ ] SMS sent for appointment confirmation within 5 minutes
- [ ] SMS sent for appointment reminder (24 hours before, 1 hour before)
- [ ] SMS sent for appointment cancellation
- [ ] SMS sent for MFA verification code
- [ ] SMS includes business name and essential details only
- [ ] SMS delivery status tracked (queued, sent, delivered, failed)
- [ ] Failed SMS delivery retried up to 2 times
- [ ] SMS rate limiting enforced (cost control)
- [ ] SMS respects user preferences (must opt-in for SMS)
- [ ] SMS opt-out link or keyword (STOP) supported
- [ ] SMS cost tracked per business (for billing in Phase 3+)

### Push Notifications

- [ ] Push notifications sent via FCM to mobile devices
- [ ] Push notifications sent for appointment reminder
- [ ] Push notifications sent for appointment status change (confirmed, cancelled)
- [ ] Push notifications sent for new message or update
- [ ] Push notifications include title, body, and data payload
- [ ] Push notifications support deep linking (open specific screen in app)
- [ ] Push notifications delivery status tracked
- [ ] Failed push delivery handled gracefully (device token may be invalid)
- [ ] Push notifications respect user preferences (can disable per category)

### Template Management

- [ ] Email templates stored in database
- [ ] SMS templates stored in database
- [ ] Templates support variable substitution using placeholders (e.g., {{client_name}})
- [ ] Templates can be customized per business
- [ ] System templates provided as defaults
- [ ] Template preview available before sending
- [ ] Templates support multiple languages (i18n)
- [ ] Templates versioned (track changes over time)
- [ ] Invalid template variables logged but don't crash sending

### Scheduled Notifications

- [ ] Appointment reminder scheduled for 24 hours before appointment
- [ ] Appointment reminder scheduled for 1 hour before appointment
- [ ] Scheduled notifications stored in queue
- [ ] Background job processes scheduled notifications at correct time
- [ ] Cancelled appointments result in cancelled scheduled notifications
- [ ] Rescheduled appointments update scheduled notifications
- [ ] Scheduled notifications can be viewed (for admin/debugging)
- [ ] Failed scheduled notifications retried or logged

### Notification Preferences

- [ ] User can set email notification preferences (per notification type)
- [ ] User can set SMS notification preferences (per notification type)
- [ ] User can set push notification preferences (per notification type)
- [ ] Default preferences set on account creation (opt-in for transactional, opt-out for marketing)
- [ ] Preferences API allows fetching and updating
- [ ] Preferences respected before sending each notification
- [ ] Marketing emails require explicit opt-in
- [ ] Transactional notifications (booking confirmation) cannot be disabled (required for service)

### Delivery Tracking

- [ ] Notification record created for each notification sent
- [ ] Notification status tracked: pending, sent, delivered, failed, bounced, opened, clicked
- [ ] Notification history available per user
- [ ] Notification history available per appointment
- [ ] Notification delivery events received from providers (webhooks)
- [ ] Delivery metrics aggregated (delivery rate, open rate, click rate)
- [ ] Failed notifications logged with error details

### Retry Logic

- [ ] Failed email notifications retried 3 times with exponential backoff (1min, 5min, 15min)
- [ ] Failed SMS notifications retried 2 times with backoff (1min, 5min)
- [ ] Failed push notifications not retried (device token likely invalid)
- [ ] Max retry limit prevents infinite retry loops
- [ ] Permanent failures (invalid email, number) marked and not retried
- [ ] Transient failures (rate limit, network error) retried

### Rate Limiting

- [ ] Email rate limited to 100 per minute per tenant (configurable)
- [ ] SMS rate limited to 10 per minute per tenant (configurable)
- [ ] Push notifications rate limited to 1000 per minute per tenant
- [ ] Rate limits prevent abuse and control costs
- [ ] Rate limit exceeded results in queueing (not rejection)
- [ ] Rate limits configurable per subscription tier

### Notification Types

**Supported Notification Types:**
- APPOINTMENT_CONFIRMATION: Booking confirmed
- APPOINTMENT_REMINDER_24H: 24 hours before appointment
- APPOINTMENT_REMINDER_1H: 1 hour before appointment
- APPOINTMENT_CANCELLED: Appointment cancelled
- APPOINTMENT_RESCHEDULED: Appointment time changed
- PAYMENT_RECEIPT: Payment confirmation
- PASSWORD_RESET: Password reset link
- EMAIL_VERIFICATION: Email verification link
- MFA_CODE: MFA verification code (SMS only)
- MARKETING: Promotional emails (Phase 3)
- SYSTEM: System announcements

## Implementation Details

### Components to Build

**Notifications Module Structure:**
- notifications.module.ts: NestJS module definition
- notifications.controller.ts: Notification management endpoints
- notifications.service.ts: Core notification orchestration
- email.service.ts: Email sending via SendGrid
- sms.service.ts: SMS sending via Twilio
- push.service.ts: Push notifications via FCM
- template.service.ts: Template management and rendering
- scheduler.service.ts: Notification scheduling
- preferences.service.ts: User notification preferences
- delivery-tracking.service.ts: Track delivery status
- jobs/send-email.job.ts: Background job for email sending
- jobs/send-sms.job.ts: Background job for SMS sending
- jobs/send-reminder.job.ts: Background job for scheduled reminders
- webhooks/sendgrid-webhook.controller.ts: SendGrid delivery webhooks
- webhooks/twilio-webhook.controller.ts: Twilio delivery webhooks
- entities/notification.entity.ts: Notification database entity
- entities/notification-template.entity.ts: Template entity
- dto/send-notification.dto.ts: Send notification DTO
- dto/schedule-notification.dto.ts: Schedule notification DTO
- dto/notification-preferences.dto.ts: Preferences DTO

### Database Entities

**Notification Entity:**
- Fields: id (UUID), tenant_id (UUID), recipient_user_id (UUID), appointment_id (UUID nullable), notification_type (enum), channel (enum: EMAIL, SMS, PUSH, IN_APP), recipient_address (string: email, phone, or device token), subject (string nullable for email), body (text), template_id (UUID nullable), status (enum: PENDING, SENT, DELIVERED, FAILED, BOUNCED, OPENED, CLICKED), scheduled_for (timestamp nullable), sent_at (timestamp nullable), delivered_at (timestamp nullable), opened_at (timestamp nullable), clicked_at (timestamp nullable), failed_reason (string nullable), gateway_message_id (string nullable: external provider ID), retry_count (integer default 0), metadata (JSONB nullable), created_at (timestamp), updated_at (timestamp)
- Indexes: Index on tenant_id + status, Index on recipient_user_id, Index on appointment_id, Index on scheduled_for + status (for scheduler), Index on gateway_message_id
- Relationships: Belongs to Tenant, User, Appointment (nullable), NotificationTemplate (nullable)

**NotificationTemplate Entity:**
- Fields: id (UUID), tenant_id (UUID nullable: null for system templates), business_id (UUID nullable), name (string), notification_type (enum), channel (enum), language (string: ISO 639-1), subject (string nullable for email), body_template (text: with placeholders), is_system_template (boolean), is_active (boolean default true), created_at (timestamp), updated_at (timestamp), deleted_at (timestamp nullable)
- Indexes: Unique on tenant_id + name, Index on tenant_id + notification_type + channel + language, Index on business_id + is_active
- Relationships: Belongs to Tenant (nullable), Business (nullable)

**NotificationPreferences (embedded in User or separate table):**
- Approach 1: JSONB field in User entity
- Approach 2: Separate NotificationPreferences entity
- Fields (if separate table): id (UUID), user_id (UUID unique), email_preferences (JSONB), sms_preferences (JSONB), push_preferences (JSONB), created_at (timestamp), updated_at (timestamp)

**NotificationPreferences JSONB Structure:**
```
{
  "email": {
    "appointment_confirmation": true,
    "appointment_reminder": true,
    "appointment_cancelled": true,
    "appointment_rescheduled": true,
    "payment_receipt": true,
    "marketing": false
  },
  "sms": {
    "appointment_reminder": true,
    "appointment_cancelled": false,
    "mfa_code": true
  },
  "push": {
    "appointment_reminder": true,
    "new_message": true
  }
}
```

### Interfaces and DTOs

**SendNotificationDto:**
- recipient_user_id: string (required)
- notification_type: string (required, enum)
- channel: string (required, enum: email, sms, push, or array for multi-channel)
- subject: string (optional, for email)
- body: string (optional, if not using template)
- template_id: string (optional, if using template)
- template_variables: object (optional, key-value pairs for variable substitution)
- appointment_id: string (optional, for context)
- scheduled_for: string (optional, ISO 8601 timestamp for delayed send)

**ScheduleNotificationDto:**
- Same as SendNotificationDto but scheduled_for is required

**NotificationPreferencesDto:**
- email: object (notification type to boolean map)
- sms: object (notification type to boolean map)
- push: object (notification type to boolean map)

**CreateTemplateDto:**
- name: string (required)
- notification_type: string (required)
- channel: string (required)
- language: string (required)
- subject: string (optional, for email)
- body_template: string (required, with placeholders)
- business_id: string (optional, for business-specific template)

**NotificationStatus:**
- PENDING: Queued, not yet sent
- SENT: Sent to gateway, awaiting delivery confirmation
- DELIVERED: Confirmed delivered by gateway
- FAILED: Sending failed, will retry
- BOUNCED: Permanently failed (invalid address)
- OPENED: Email opened (tracked via pixel)
- CLICKED: Link in email/SMS clicked (tracked via redirect)

### Dependencies

**External Libraries:**
- @sendgrid/mail: SendGrid email API client
- twilio: Twilio SMS API client
- firebase-admin: Firebase Cloud Messaging for push notifications
- handlebars or mustache: Template rendering with variable substitution
- bullmq: Job queue for background notification processing
- ioredis: Redis client for job queue

**External Services:**
- SendGrid: Email delivery service (API key required)
- Twilio: SMS delivery service (Account SID, Auth Token, Phone Number required)
- Firebase Cloud Messaging: Push notifications (Service Account JSON required)

**Internal Dependencies:**
- Auth module: User information, tenant context
- Users module: User contact details (email, phone)
- Appointments module: Appointment details for notifications
- Business module: Business branding (logo, name)
- Audit module: Log all notification sends

**Database:**
- PostgreSQL for notification records and templates
- Redis for job queue (BullMQ)

### Key Algorithms

**Notification Sending Algorithm:**

Inputs: recipient_user_id, notification_type, channel, template_variables

Process:
1. Check user notification preferences
   - If user opted out of this notification type and channel, skip
2. Get recipient contact info (email, phone, or device token based on channel)
3. Validate contact info exists and is valid format
4. Get template (system or business-specific)
5. Render template with variables (substitute placeholders)
6. Create notification record in database (status=PENDING)
7. Queue notification for sending (background job)
8. Background job:
   a. Send via appropriate service (email, SMS, push)
   b. Update notification status based on result
   c. If failed, schedule retry (if retries remaining)
9. Handle delivery webhooks from providers
   a. Update notification status (delivered, bounced, opened, clicked)

**Template Rendering Algorithm:**

Inputs: template_body, template_variables

Process:
1. Parse template body for placeholders (e.g., {{client_name}})
2. For each placeholder:
   a. Look up variable in template_variables object
   b. If found, replace with value
   c. If not found, replace with empty string or default, log warning
3. Return rendered string

Example:
```
Template: "Hello {{client_name}}, your appointment with {{staff_name}} is confirmed for {{appointment_time}}."
Variables: {client_name: "John", staff_name: "Jane", appointment_time: "June 1, 2025 at 10:00 AM"}
Result: "Hello John, your appointment with Jane is confirmed for June 1, 2025 at 10:00 AM."
```

**Reminder Scheduling Algorithm:**

Trigger: On appointment creation or rescheduling

Process:
1. Calculate reminder times:
   - 24-hour reminder: appointment.start_time - 24 hours
   - 1-hour reminder: appointment.start_time - 1 hour
2. For each reminder time:
   a. If reminder time is in the future, create scheduled notification
   b. Store notification with status=PENDING, scheduled_for=reminder_time
3. Background job runs every minute:
   a. Query notifications where scheduled_for <= now AND status=PENDING
   b. For each notification, queue for sending
4. On appointment cancellation:
   a. Cancel scheduled notifications (mark status=CANCELLED or delete)
5. On appointment rescheduling:
   a. Cancel old scheduled notifications
   b. Create new scheduled notifications with updated times

**Retry Algorithm:**

Trigger: Notification send failure

Process:
1. Check retry_count < max_retries (3 for email, 2 for SMS)
2. Determine failure type:
   - Transient (network error, rate limit): Retry
   - Permanent (invalid email, number): Don't retry, mark as BOUNCED
3. Calculate retry delay: exponential backoff (2^retry_count minutes)
4. Schedule retry job for (now + retry_delay)
5. Increment retry_count
6. If max retries exceeded, mark as FAILED permanently

**Rate Limiting Algorithm:**

Approach: Token bucket or sliding window

Implementation:
1. Use Redis to track notification count per tenant per channel per minute
2. Before sending, check count < limit
3. If over limit, queue notification for next available slot
4. Decrement count after successful send or when minute window resets

Redis Keys:
- rate_limit:email:tenant_id:minute_timestamp -> count
- rate_limit:sms:tenant_id:minute_timestamp -> count

**Delivery Tracking via Webhooks:**

SendGrid Webhook:
- Endpoint: POST /notifications/webhooks/sendgrid
- Payload: includes event type (delivered, bounce, open, click), message ID, timestamp
- Process:
  1. Verify webhook signature (security)
  2. Find notification by gateway_message_id
  3. Update notification status based on event
  4. Update delivered_at, opened_at, or clicked_at timestamp
  5. Log event for analytics

Twilio Webhook:
- Similar process for SMS delivery status

### Configuration

**Email Configuration:**
- SENDGRID_API_KEY: API key from SendGrid
- SENDGRID_FROM_EMAIL: Default from email (e.g., noreply@booking-platform.com)
- SENDGRID_FROM_NAME: Default from name (e.g., Booking Platform)
- EMAIL_RATE_LIMIT: 100 per minute per tenant
- EMAIL_MAX_RETRIES: 3

**SMS Configuration:**
- TWILIO_ACCOUNT_SID: Account SID from Twilio
- TWILIO_AUTH_TOKEN: Auth Token from Twilio
- TWILIO_PHONE_NUMBER: Twilio phone number for sending
- SMS_RATE_LIMIT: 10 per minute per tenant
- SMS_MAX_RETRIES: 2

**Push Configuration:**
- FCM_SERVICE_ACCOUNT_JSON: Firebase service account credentials
- PUSH_RATE_LIMIT: 1000 per minute per tenant

**Notification Scheduling:**
- REMINDER_24H_ENABLED: true
- REMINDER_1H_ENABLED: true
- SCHEDULER_JOB_INTERVAL: 60000 (milliseconds, 1 minute)

**Retry Configuration:**
- RETRY_BACKOFF_BASE: 2 (exponential base)
- MAX_EMAIL_RETRIES: 3
- MAX_SMS_RETRIES: 2
- MAX_PUSH_RETRIES: 0 (no retry for push)

### Default Templates

**Appointment Confirmation (Email):**
- Subject: "Appointment Confirmed - {{business_name}}"
- Body: HTML template with business logo, appointment details (date, time, service, staff, location), cancellation link

**Appointment Confirmation (SMS):**
- Body: "{{business_name}}: Appt confirmed for {{date}} at {{time}} with {{staff_name}}. Reply STOP to unsubscribe."

**Appointment Reminder 24H (Email):**
- Subject: "Reminder: Appointment Tomorrow - {{business_name}}"
- Body: HTML with appointment details, option to reschedule or cancel

**Appointment Reminder 24H (SMS):**
- Body: "{{business_name}}: Reminder - Appt tomorrow {{time}} with {{staff_name}}."

**Appointment Cancelled (Email):**
- Subject: "Appointment Cancelled - {{business_name}}"
- Body: Cancellation confirmation, reason (if provided), refund info (if applicable)

## Test Scenarios

### Unit Tests

**Email Service Tests:**

- Test: Send email via SendGrid
  - Input: recipient email, subject, HTML body
  - Expected: SendGrid API called, returns message ID
  - Mock: SendGrid API response
  - Edge case: Invalid email format returns error

- Test: Render email template with variables
  - Input: Template "Hello {{name}}", variables {name: "John"}
  - Expected: "Hello John"
  - Edge case: Missing variable replaced with empty string

- Test: Include business branding in email
  - Input: Business with logo and colors
  - Expected: Email HTML includes logo image and custom colors

**SMS Service Tests:**

- Test: Send SMS via Twilio
  - Input: recipient phone (+1234567890), body text
  - Expected: Twilio API called, returns message SID
  - Mock: Twilio API response
  - Edge case: Invalid phone number returns error

- Test: SMS character limit handling
  - Input: Message > 160 characters
  - Expected: Twilio sends as concatenated message or error
  - Note: Twilio handles concatenation automatically

- Test: SMS opt-out keyword handling
  - Input: User sends "STOP" reply
  - Expected: User's SMS preferences updated to opt-out

**Push Service Tests:**

- Test: Send push notification via FCM
  - Input: device token, title, body, data payload
  - Expected: FCM API called, returns message ID
  - Mock: FCM API response
  - Edge case: Invalid token returns error (don't retry)

- Test: Push notification with deep link
  - Input: Deep link to appointment details screen
  - Expected: Notification payload includes deep link data

**Template Service Tests:**

- Test: Render template with all variables provided
  - Input: Template with {{var1}} and {{var2}}, both provided
  - Expected: Both variables substituted correctly

- Test: Render template with missing variable
  - Input: Template with {{var1}} and {{var2}}, only var1 provided
  - Expected: var1 substituted, var2 replaced with empty string, warning logged

- Test: Get business-specific template (overrides system template)
  - Setup: System template and business-specific template for same notification type
  - Expected: Business-specific template returned

- Test: Fall back to system template if no business template
  - Setup: Only system template exists
  - Expected: System template returned

**Scheduler Service Tests:**

- Test: Schedule reminder for future time
  - Input: Notification, scheduled_for in future
  - Expected: Notification created with status=PENDING, not sent immediately

- Test: Process due scheduled notifications
  - Setup: Notifications with scheduled_for <= now
  - Action: Run scheduler job
  - Expected: Notifications queued for sending, status updated to SENT

- Test: Cancel scheduled notifications for cancelled appointment
  - Setup: Appointment with scheduled reminders
  - Action: Cancel appointment
  - Expected: Scheduled notifications marked as CANCELLED

- Test: Update scheduled notifications on reschedule
  - Setup: Appointment with reminders scheduled
  - Action: Reschedule appointment to different time
  - Expected: Old reminders cancelled, new reminders scheduled for new time

**Preferences Service Tests:**

- Test: Check user preferences before sending
  - Setup: User opted out of SMS reminders
  - Action: Attempt to send SMS reminder
  - Expected: Notification skipped, logged

- Test: Transactional notifications cannot be disabled
  - Setup: User attempts to opt-out of appointment confirmation
  - Expected: Error or warning, preference not saved (confirmation is required)

- Test: Marketing notifications require opt-in
  - Setup: User has default preferences (marketing opt-out)
  - Action: Attempt to send marketing email
  - Expected: Notification skipped

**Retry Logic Tests:**

- Test: Retry on transient failure
  - Setup: Email send fails with network error, retry_count=0
  - Expected: Notification queued for retry in 2^0=1 minute

- Test: No retry on permanent failure
  - Setup: Email send fails with "invalid email", retry_count=0
  - Expected: Notification marked as BOUNCED, not retried

- Test: Max retries exceeded
  - Setup: Email send fails, retry_count=3 (max)
  - Expected: Notification marked as FAILED permanently

- Test: Exponential backoff calculation
  - retry_count=0: 2^0=1 minute
  - retry_count=1: 2^1=2 minutes (wait 1 min after first failure)
  - retry_count=2: 2^2=4 minutes (wait 2 min after second failure)

### Integration Tests

**Email Notification Flow:**

- Test: Send appointment confirmation email
  - Setup: New appointment created
  - Action: Appointment service triggers notification
  - Expected: Notification record created, email sent via SendGrid
  - Verify: Notification status=SENT, gateway_message_id stored
  - Verify: SendGrid API called with correct parameters

- Test: Email delivery webhook updates status
  - Setup: Email sent, notification status=SENT
  - Action: POST /notifications/webhooks/sendgrid with delivered event
  - Expected: Notification status updated to DELIVERED, delivered_at timestamp set

**SMS Notification Flow:**

- Test: Send appointment reminder SMS
  - Setup: Appointment 1 hour from now, scheduler job runs
  - Expected: SMS notification created and sent via Twilio
  - Verify: Notification status=SENT, gateway_message_id stored

- Test: SMS delivery status updated
  - Setup: SMS sent
  - Action: Twilio delivery webhook received
  - Expected: Notification status updated to DELIVERED

**Push Notification Flow:**

- Test: Send push notification to mobile device
  - Setup: User has device token registered
  - Action: Appointment confirmed
  - Expected: Push notification sent via FCM
  - Verify: Notification includes title, body, deep link data

**Template Rendering Flow:**

- Test: Use system template for notification
  - Setup: No business-specific template
  - Action: Send appointment confirmation
  - Expected: System template used, variables substituted

- Test: Use business-specific template
  - Setup: Business has custom template
  - Action: Send appointment confirmation
  - Expected: Business template used instead of system template

**Scheduled Reminder Flow:**

- Test: Complete reminder lifecycle
  - Step 1: Create appointment 48 hours from now
  - Expected: Two reminders scheduled (24h and 1h before)
  - Step 2: Wait (simulated) 24 hours
  - Expected: Scheduler job sends 24h reminder
  - Step 3: Wait (simulated) 23 more hours
  - Expected: Scheduler job sends 1h reminder

**Notification Preferences Flow:**

- Test: Respect user opt-out
  - Setup: User opts out of SMS reminders
  - Action: Scheduler attempts to send SMS reminder
  - Expected: SMS skipped, notification record created with status=SKIPPED or not created

- Test: Multi-channel notification with preferences
  - Setup: User opts in to email, opts out of SMS
  - Action: Send confirmation (both channels)
  - Expected: Email sent, SMS skipped

**Retry Flow:**

- Test: Failed email retried successfully
  - Step 1: Email send fails with transient error
  - Expected: Notification status=PENDING, retry scheduled
  - Step 2: Wait (simulated) retry delay
  - Expected: Retry job sends email, succeeds, status=SENT

- Test: Email bounces after retries
  - Step 1: Email send fails permanently (invalid email)
  - Expected: Notification status=BOUNCED, no retry

### End-to-End Tests

**Client Booking Journey with Notifications:**
- Scenario: Client books appointment and receives notifications
  - Action: Client creates appointment
  - Expected: Confirmation email sent within 5 minutes
  - Expected: Confirmation SMS sent within 5 minutes (if opted in)
  - Verify: Client receives email with appointment details
  - Verify: Email includes cancellation link
  - Action: Wait (simulated) until 24 hours before appointment
  - Expected: Reminder email sent
  - Expected: Reminder SMS sent
  - Action: Client cancels appointment
  - Expected: Cancellation email sent
  - Expected: Future reminders cancelled

**Business Owner Managing Notifications:**
- Scenario: Owner customizes notification templates
  - Action: Owner logs in, navigates to notification settings
  - Action: Owner edits appointment confirmation email template
  - Expected: Custom template saved
  - Action: Appointment created
  - Expected: Confirmation email uses custom template
  - Verify: Email includes customizations (custom text, branding)

**Client Managing Preferences:**
- Scenario: Client controls notification preferences
  - Action: Client navigates to notification settings
  - Action: Client opts out of SMS reminders, keeps email reminders
  - Expected: Preferences saved
  - Action: Appointment created
  - Expected: Email reminder sent, SMS reminder NOT sent

**Notification Delivery Tracking:**
- Scenario: Admin views notification delivery status
  - Action: Admin views notification history for appointment
  - Expected: List of notifications sent (confirmation, reminders)
  - Expected: Delivery status shown (sent, delivered, opened)
  - Expected: Timestamps shown (sent_at, delivered_at, opened_at)

### Performance Tests

**Email Sending Performance:**
- Test: Send 100 emails in parallel
  - Expected: All queued in < 5 seconds
  - Expected: All sent within 60 seconds (respecting rate limit)

**SMS Sending Performance:**
- Test: Send 50 SMS in parallel
  - Expected: All queued in < 2 seconds
  - Expected: All sent within 300 seconds (respecting SMS rate limit of 10/min)

**Scheduler Job Performance:**
- Test: Process 1000 due scheduled notifications
  - Expected: All queued for sending in < 30 seconds
  - Expected: Scheduler job completes in < 60 seconds

**Template Rendering Performance:**
- Test: Render 1000 templates with 10 variables each
  - Expected: All rendered in < 10 seconds (< 10ms per render)

### Edge Case Tests

**Missing Contact Information:**
- Test: User has no email address
  - Action: Attempt to send email notification
  - Expected: Notification skipped or failed with clear error

- Test: User has no phone number
  - Action: Attempt to send SMS notification
  - Expected: Notification skipped or failed

**Invalid Contact Information:**
- Test: User email is malformed
  - Action: Send email
  - Expected: Validation error, notification failed immediately (not retried)

- Test: User phone number is invalid format
  - Action: Send SMS
  - Expected: Twilio API rejects, notification marked as BOUNCED

**Timezone Handling:**
- Test: Send reminder at correct local time
  - Setup: Appointment at 10am EST, user in PST
  - Expected: 24h reminder sent at 10am EST (7am PST for user)
  - Note: Reminder time based on appointment timezone, not user timezone

**High Volume:**
- Test: 1000 appointments created simultaneously
  - Action: 1000 confirmation emails queued
  - Expected: All queued successfully, sent over time respecting rate limit
  - Expected: No dropped notifications

**Webhook Security:**
- Test: Webhook with invalid signature
  - Action: POST to webhook with incorrect signature
  - Expected: 401 Unauthorized, request rejected

- Test: Replay attack on webhook
  - Action: Resend same webhook payload
  - Expected: Idempotent handling (duplicate event ignored or handled gracefully)

## Caveats and Risks

### Delivery Risks

**Risk: Email Deliverability Issues**
- Impact: High - Users don't receive important notifications
- Mitigation: Use reputable service (SendGrid), proper SPF/DKIM/DMARC setup, monitor bounce rates
- Detection: Track delivery rates, alert if < 95%

**Risk: SMS Delivery Failures**
- Impact: Medium - Users miss reminders
- Mitigation: Use reliable provider (Twilio), validate phone numbers, monitor delivery status
- Detection: Track SMS delivery rates, alert if < 90%

**Risk: Push Notification Device Token Expiry**
- Impact: Low - Push notifications not delivered to some devices
- Mitigation: Handle invalid token errors gracefully, remove expired tokens
- Detection: Track failed push notifications, clean up invalid tokens

### Cost Risks

**Risk: Unexpected SMS Costs**
- Impact: High - SMS more expensive than email
- Mitigation: Rate limiting, user must opt-in, monitor usage, set budget alerts
- Measurement: Track SMS count per business, alert on unusual spikes

**Risk: SendGrid Cost Overruns**
- Impact: Medium - High email volume increases costs
- Mitigation: Monitor email volume, tier-based limits, alert on threshold
- Alternative: AWS SES for lower cost at scale

### Performance Risks

**Risk: Notification Queue Backlog**
- Impact: Medium - Notifications delayed
- Mitigation: Horizontal scaling of workers, monitor queue depth, alert on backlog
- Detection: Track queue length, alert if > 1000 jobs pending

**Risk: Database Performance with High Notification Volume**
- Impact: Medium - Slow queries, database load
- Mitigation: Database indexes, archiving old notifications, read replicas
- Measurement: Monitor notification table size and query time

### Compliance Risks

**Risk: CAN-SPAM Act Violations**
- Impact: High - Legal penalties
- Mitigation: Unsubscribe links in marketing emails, honor opt-outs immediately, clear sender identification
- Detection: Regular compliance audits

**Risk: GDPR Violations (Marketing Without Consent)**
- Impact: High - Regulatory penalties
- Mitigation: Explicit opt-in for marketing, clear privacy policy, easy opt-out
- Detection: Audit opt-in records, review marketing send lists

**Risk: TCPA Violations (SMS Without Consent)**
- Impact: High - Legal penalties (up to $1500 per violation)
- Mitigation: SMS requires explicit opt-in, "STOP" keyword supported, clear consent language
- Detection: Audit SMS opt-in records

### Data Integrity Risks

**Risk: Notification Sent to Wrong Recipient**
- Impact: High - Privacy breach
- Mitigation: Careful validation of recipient before sending, test with multiple users
- Detection: Monitor for user complaints, audit notification sends

**Risk: Template Variables Exposed**
- Impact: Medium - Sensitive data in logs
- Mitigation: Sanitize logs (don't log full template variables), secure log access
- Detection: Regular security audits

**Risk: Duplicate Notifications**
- Impact: Low - Poor user experience
- Mitigation: Idempotency checks, deduplication logic
- Detection: Monitor for duplicate gateway_message_ids

### Operational Risks

**Risk: Webhook Downtime**
- Impact: Low - Delivery status not updated
- Mitigation: Webhooks optional (poll status as fallback), retry webhook delivery from provider
- Detection: Monitor webhook failure rate

**Risk: Rate Limit Exceeded**
- Impact: Low - Notifications delayed
- Mitigation: Queue overflow notifications, process in order
- Detection: Monitor rate limit hits

## Estimated Effort

**Size: Medium (2-3 weeks for 1-2 developers)**

**Breakdown:**
- Database schema for notifications and templates: 1 day
- Email service integration (SendGrid): 2 days
- SMS service integration (Twilio): 2 days
- Push notification integration (FCM): 2 days
- Template management and rendering: 2 days
- Notification scheduling (background jobs): 3 days
- User preferences management: 1 day
- Delivery tracking and webhooks: 2 days
- Retry logic: 2 days
- Rate limiting: 1 day
- Default templates creation: 1 day
- Unit tests: 3 days
- Integration tests: 3 days
- E2E tests: 2 days
- Documentation: 1 day
- Buffer: 3 days

**Dependencies:**
- Auth module complete
- Users module complete
- Appointments module complete
- Background job infrastructure (BullMQ, Redis)
- External service accounts (SendGrid, Twilio, Firebase)

**Parallel Work Opportunities:**
- Email, SMS, and Push services can be implemented in parallel
- Template system can be developed in parallel with delivery services
- Different notification types can be added incrementally

## Owner Role

**Primary: Backend Developer (Mid-Level)**

**Skills Required:**
- Experience with third-party API integrations
- Understanding of asynchronous job processing
- Email/SMS delivery best practices
- Template rendering
- NestJS or similar Node.js framework
- TypeScript
- PostgreSQL
- Redis and job queues (BullMQ)
- Unit and integration testing

**Secondary Roles:**
- DevOps: Set up external service accounts, configure API keys securely
- QA Engineer: Test notification delivery across channels, edge cases
- Compliance Specialist: Review marketing email and SMS compliance

**Knowledge Transfer Required:**
- Document notification flow diagrams (send, schedule, retry)
- Document webhook handling and security
- Document template variable naming conventions
- Create troubleshooting guide for delivery issues
- Create runbook for managing rate limits and costs
