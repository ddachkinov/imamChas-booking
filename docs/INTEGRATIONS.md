# INTEGRATIONS.md

## Third-Party Integrations Specification

This document provides detailed specifications for all third-party service integrations in the booking platform, including configuration, implementation approaches, feature toggles, and tenant-level customization.

## Integration Philosophy

The booking platform follows these principles for third-party integrations:

**Modularity:** Each integration is self-contained and can be enabled/disabled independently

**Tenant Control:** Business owners control which integrations to use for their tenant

**Graceful Degradation:** System functions without integrations enabled (core features remain available)

**Multi-Provider Support:** Where applicable, support multiple providers for the same functionality (e.g., multiple email providers)

**Security:** All API keys and credentials stored encrypted, never logged or exposed

**Monitoring:** Integration health monitored, failures tracked and alerted

**Cost Transparency:** Business owners understand costs associated with each integration

---

## Integration Categories

### Core Integrations (Required for Full Functionality)
- Payment processing (Stripe, Adyen, PayPal)
- Email delivery (SendGrid, Mailgun, SMTP)
- SMS notifications (Twilio, MessageBird)

### Optional Integrations (Enhance Features)
- Calendar synchronization (Google Calendar, Microsoft Outlook, Apple iCloud)
- Analytics (Google Analytics, Mixpanel, Segment)
- Customer relationship management (Salesforce, HubSpot)
- Review collection (Trustpilot, Google Reviews)

### Platform Integrations (Advanced Features)
- AI-powered features (OpenAI, custom ML models)
- Video conferencing (Zoom, Google Meet)
- Accounting (QuickBooks, Xero)
- Marketing automation (Mailchimp, Klaviyo)

---

## Calendar Synchronization

### Overview

Calendar sync enables bidirectional synchronization between the booking platform and external calendar providers. Staff members connect their personal calendars to automatically sync appointments and block availability based on external busy times.

### Supported Providers

#### Google Calendar

**Authentication:** OAuth 2.0
**API:** Google Calendar API v3
**Documentation:** https://developers.google.com/calendar/api/v3/reference

**Setup Requirements:**
- Google Cloud project created
- Google Calendar API enabled
- OAuth consent screen configured
- OAuth credentials (client ID, client secret) generated
- Authorized redirect URIs configured

**OAuth Scopes:**
- calendar.events: Read/write access to calendar events
- calendar.readonly: Read-only access to calendar list

**API Rate Limits:**
- 1,000,000 queries per day default
- 10 queries per second per user

**Implementation Approach:**
- Use googleapis npm package for API calls
- Implement OAuth 2.0 authorization code flow
- Store access token and refresh token encrypted in database
- Refresh token automatically before expiration (1 hour)
- Use incremental sync with sync tokens for efficiency
- Implement webhook push notifications for real-time updates

**Event Sync Strategy:**
- Export appointments to Google Calendar as calendar events
- Import busy times from Google Calendar to block availability
- Event properties synced: title, start time, end time, location, description
- Privacy levels: full details (client name), service only, busy block
- Event colors: Use specific color (e.g., color 9) to identify booking platform events

**Webhook Configuration:**
- Register webhook channel for calendar notifications
- Webhook endpoint: POST /api/webhooks/google-calendar
- Verify webhook signature using channel token
- Renew webhook before expiration (max 1 week duration)

**Error Handling:**
- Token expired: Automatically refresh using refresh token
- Token revoked: Notify user to reconnect calendar
- Rate limit exceeded: Implement exponential backoff
- API errors: Log and retry with backoff

**Testing:**
- Test mode: Use test Google account
- Automated tests: Mock Google Calendar API responses
- Integration tests: Use real Google Calendar API in test mode

---

#### Microsoft Outlook (Office 365, Outlook.com)

**Authentication:** OAuth 2.0 with Microsoft Identity Platform
**API:** Microsoft Graph API (Calendar endpoints)
**Documentation:** https://docs.microsoft.com/en-us/graph/api/resources/calendar

**Setup Requirements:**
- Azure AD app registration
- OAuth credentials configured
- API permissions granted: Calendars.ReadWrite, offline_access
- Redirect URIs configured

**OAuth Endpoints:**
- Authorization: https://login.microsoftonline.com/common/oauth2/v2.0/authorize
- Token: https://login.microsoftonline.com/common/oauth2/v2.0/token

**API Rate Limits:**
- 10,000 requests per 10 minutes per user

**Implementation Approach:**
- Use @microsoft/microsoft-graph-client npm package
- Implement OAuth 2.0 flow similar to Google
- Use delta queries for incremental sync
- Store deltaLink for next sync request

**Event Sync Strategy:**
- Export appointments as Outlook calendar events
- Import busy times from Outlook
- Support Outlook categories for event organization
- Handle meeting vs appointment distinction (appointments don't require attendees)

**Webhook Configuration:**
- Create subscription via POST /subscriptions
- Webhook endpoint: POST /api/webhooks/microsoft-graph
- Validate webhook with validation token on subscription creation
- Renew subscription before expiration (max 3 days for calendar)

**Error Handling:**
- Similar to Google Calendar
- Handle Microsoft-specific error codes
- Implement retry logic with exponential backoff

---

#### Apple iCloud Calendar

**Authentication:** CalDAV with app-specific password
**Protocol:** CalDAV (Calendar Distributed Authoring and Versioning)
**Documentation:** https://developer.apple.com/documentation/calendarkit

**Setup Requirements:**
- Apple ID
- App-specific password generated from Apple ID account settings
- CalDAV server URL: caldav.icloud.com

**Implementation Approach:**
- Use caldav-adapter npm package or custom CalDAV client
- Authenticate using HTTP Basic Auth with app-specific password
- Discover calendar collections via PROPFIND request
- CRUD operations via CalDAV methods (PUT for create/update, DELETE for delete)

**Event Sync Strategy:**
- Export appointments as iCalendar (.ics) events
- Store events via PUT to calendar URL
- Import events via REPORT calendar-query
- Use iCalendar format (RFC 5545) for event data

**Challenges:**
- No OAuth support (uses app-specific password)
- No webhook support (must poll for changes)
- Sync frequency: Poll every 15-30 minutes

**Error Handling:**
- Authentication failures: Prompt user to regenerate app-specific password
- Network errors: Retry with exponential backoff
- Invalid iCalendar data: Validate before sending

---

### Calendar Sync Configuration

**Per-Tenant Settings:**
```
calendar_sync_enabled: boolean (default: false)
```

**Per-Staff Settings:**
```
connected_calendars: Array of:
  - provider: google | microsoft | apple
  - connection_id: UUID
  - calendar_id: Provider-specific calendar ID
  - calendar_name: Display name
  - sync_direction: export_only | import_only | bidirectional
  - privacy_level: full_details | service_only | busy
  - status: connected | error | disconnected
  - last_sync_at: timestamp
```

**Sync Frequency:**
- Real-time: Via webhooks (Google, Microsoft) - seconds latency
- Polling: Every 15 minutes for providers without webhooks (Apple)
- Manual: On-demand sync button for immediate refresh

**Conflict Resolution:**
- Strategy: Last Write Wins (most recent modification timestamp)
- Notification: Staff notified of conflicts with details
- Manual override: Staff can manually resolve if automatic resolution incorrect

**Toggle Implementation:**
```
Database table: integration_settings
Columns:
  - business_id: UUID
  - integration_type: 'calendar_sync'
  - enabled: boolean
  - configuration: JSONB (provider settings, credentials)
  - created_at, updated_at

UI Toggle:
  - Location: Settings > Integrations > Calendar Sync
  - Enable/Disable switch per business
  - Per-staff connection management within staff profile
```

---

## Payment Processing

### Overview

Payment processing enables businesses to accept payments from customers for appointments. The platform supports multiple payment providers with similar feature sets, allowing businesses to choose based on geographic availability, pricing, and preferences.

### Supported Providers

#### Stripe

**Primary Use:** Online payments, subscription billing
**Website:** https://stripe.com
**Documentation:** https://stripe.com/docs/api

**Features:**
- Credit/debit cards (Visa, Mastercard, Amex, Discover)
- Digital wallets (Apple Pay, Google Pay)
- Bank transfers (ACH, SEPA)
- Buy now, pay later (Afterpay, Klarna)
- Recurring billing for subscriptions
- Strong customer authentication (SCA) / 3D Secure
- Comprehensive fraud detection (Stripe Radar)

**Integration Model:** Stripe Connect (Platform/Marketplace)
- Platform connects businesses via OAuth
- Businesses receive funds directly to their Stripe account
- Platform can take application fee (optional)

**Setup Requirements:**
- Stripe Connect platform account
- OAuth application credentials
- Webhook endpoint configured
- PCI compliance (handled by Stripe Elements)

**API Endpoints Used:**
- Payment Intents API for one-time payments
- Setup Intents API for saving payment methods
- Customers API for customer management
- Subscriptions API for recurring billing
- Refunds API for refund processing
- Connect API for account management

**Payment Flow:**
1. Business owner connects Stripe account via OAuth
2. Customer enters payment details in Stripe Element (PCI-compliant)
3. Platform creates Payment Intent with connected account
4. Stripe processes payment, holds funds
5. Stripe transfers funds to business account (2-day payout cycle)
6. Platform receives webhook confirmation
7. Appointment confirmed and customer notified

**Webhooks:**
- payment_intent.succeeded: Payment completed successfully
- payment_intent.payment_failed: Payment failed
- charge.refunded: Refund processed
- customer.subscription.created: Subscription created
- customer.subscription.deleted: Subscription cancelled

**Pricing:**
- Per transaction: 2.9% + $0.30 (US cards)
- Additional 1% for international cards
- Additional 1% for currency conversion
- No setup fees or monthly fees

**Testing:**
- Test mode with test API keys
- Test credit card: 4242 4242 4242 4242
- Test 3D Secure: 4000 0027 6000 3184

**Error Handling:**
- Card declined: Prompt for different payment method
- Insufficient funds: Show specific error message
- Rate limit: Implement exponential backoff
- Network errors: Retry with idempotency keys

---

#### Adyen

**Primary Use:** International payments, enterprise-grade
**Website:** https://www.adyen.com
**Documentation:** https://docs.adyen.com

**Features:**
- 250+ payment methods globally
- Extensive international coverage (Asia, Europe, Latin America)
- Advanced risk management
- Revenue optimization tools
- Unified commerce (online and in-person)

**Integration Model:** Marketplace model
- Businesses onboarded as sub-accounts
- Split payments with commission

**Setup Requirements:**
- Adyen merchant account
- API credentials
- Webhook configuration
- Hosted Payment Page or Web Components

**Payment Flow:**
- Similar to Stripe with Adyen-specific APIs
- Use Adyen Checkout for payment collection
- Payment sessions for security

**Pricing:**
- Custom pricing based on volume
- Typically competitive with Stripe for high volume
- Interchange++ pricing model

**Testing:**
- Test environment with test credentials
- Test card numbers specific to payment methods

---

#### PayPal

**Primary Use:** PayPal account payments, broad recognition
**Website:** https://www.paypal.com
**Documentation:** https://developer.paypal.com/docs/api/overview/

**Features:**
- PayPal account payments
- Credit/debit cards via PayPal
- PayPal Credit
- Venmo (US only)
- Strong buyer protection
- High customer trust

**Integration Model:** PayPal Commerce Platform
- Businesses connect PayPal account
- Referral-based onboarding

**Setup Requirements:**
- PayPal business account
- REST API credentials
- Webhook listeners

**Payment Flow:**
- Customer redirects to PayPal for authentication
- Returns to platform after payment
- Or inline PayPal Checkout buttons

**Pricing:**
- 2.9% + $0.30 per transaction (US)
- International fees vary
- PayPal account transfers: 2.9% (no fixed fee)

**Testing:**
- Sandbox environment
- Test PayPal accounts

---

### Payment Provider Comparison

| Feature | Stripe | Adyen | PayPal |
|---------|--------|-------|--------|
| International coverage | Excellent | Excellent | Excellent |
| Payment methods | 40+ | 250+ | 10+ |
| Recurring billing | Yes | Yes | Yes |
| Setup complexity | Easy | Moderate | Easy |
| Developer experience | Excellent | Good | Moderate |
| Pricing transparency | High | Medium | High |
| Best for | SMB to Enterprise | Enterprise | SMB, PayPal preference |

### Payment Configuration

**Per-Tenant Settings:**
```
payment_enabled: boolean (default: false)
payment_provider: stripe | adyen | paypal | null
provider_account_id: Provider-specific account ID
provider_credentials: Encrypted credentials (access token, refresh token)
payment_mode: test | live
default_currency: ISO 4217 code (USD, EUR, GBP, etc.)
```

**Payment Policies Per Service:**
```
payment_timing: at_booking | at_appointment | at_completion
payment_type: no_payment | deposit | full_payment
deposit_amount: Fixed amount or percentage
deposit_percentage: 1-100 if percentage-based
cancellation_policy: full_refund | partial_refund | no_refund
cancellation_deadline_hours: Hours before appointment for refund
no_show_policy: charge_full | charge_deposit | no_charge
```

**Toggle Implementation:**
```
UI Location: Settings > Payments > Provider Configuration
Enable/Disable: Switch to enable payment processing
Provider Selection: Radio buttons or dropdown for provider choice
Connection Flow: OAuth redirect for Stripe, guided setup for Adyen/PayPal
Per-Service Config: In service creation/edit form
Test Mode: Toggle between test and live credentials with warning
```

**Feature Flags:**
```
PAYMENT_ENABLED: Global feature flag for payment module
STRIPE_ENABLED: Stripe-specific flag
ADYEN_ENABLED: Adyen-specific flag
PAYPAL_ENABLED: PayPal-specific flag
```

---

## Email Delivery

### Overview

Email delivery service sends transactional emails (confirmations, reminders, receipts) and marketing emails (promotions, newsletters) to customers.

### Supported Providers

#### SendGrid

**Primary Use:** Transactional and marketing emails
**Website:** https://sendgrid.com
**Documentation:** https://docs.sendgrid.com

**Features:**
- 100 emails/day free tier
- Email templates with dynamic content
- Email tracking (opens, clicks, bounces)
- Dedicated IP addresses (paid plans)
- Delivery optimization
- Marketing campaigns
- Email validation API

**Setup Requirements:**
- SendGrid account
- API key generated
- Sender authentication (domain verification)
- SPF and DKIM records configured

**API Integration:**
- Send API: v3/mail/send (REST API)
- Templates API for templated emails
- Webhooks for delivery events

**Email Types:**
- Appointment confirmation
- Appointment reminder (24 hours, 1 hour before)
- Appointment cancellation
- Appointment rescheduled
- Payment receipt
- Password reset
- Email verification
- Welcome email
- Review request

**Webhook Events:**
- delivered: Email successfully delivered
- open: Email opened by recipient
- click: Link clicked in email
- bounce: Email bounced
- dropped: Email dropped due to policy
- spam_report: Marked as spam

**Pricing:**
- Free: 100 emails/day forever
- Essentials: $19.95/month (50k emails)
- Pro: $89.95/month (1.5M emails)

**Testing:**
- Sandbox mode for testing without sending
- Test email addresses for different scenarios

---

#### Mailgun

**Primary Use:** Transactional emails, developer-friendly
**Website:** https://www.mailgun.com
**Documentation:** https://documentation.mailgun.com

**Features:**
- Simple API
- Email validation
- Detailed logs
- Email parsing (inbound)
- SMTP or API sending
- Webhooks for events

**Setup Requirements:**
- Mailgun account
- Domain verification
- API key
- SPF/DKIM configuration

**Pricing:**
- Free trial: 5,000 emails for 3 months
- Foundation: $35/month (50k emails)
- Growth: $80/month (100k emails)

---

#### SMTP (Generic)

**Primary Use:** Custom SMTP server, self-hosted email
**Protocol:** SMTP (Simple Mail Transfer Protocol)

**Setup Requirements:**
- SMTP server host
- SMTP port (25, 587, 465)
- Authentication credentials
- TLS/SSL configuration

**Use Cases:**
- Organizations with existing email infrastructure
- Self-hosted email servers
- Corporate email providers (Office 365, Google Workspace)

**Limitations:**
- No tracking features (opens, clicks)
- No template management
- Manual bounce handling
- Lower deliverability than specialized providers

**Configuration:**
```
smtp_host: string
smtp_port: number
smtp_secure: boolean (TLS/SSL)
smtp_user: string
smtp_password: string (encrypted)
from_email: string
from_name: string
```

---

### Email Configuration

**Per-Tenant Settings:**
```
email_enabled: boolean (default: true)
email_provider: sendgrid | mailgun | smtp
provider_configuration: Provider-specific settings
from_email: Sender email address
from_name: Sender name
reply_to_email: Reply-to address
branding: Logo URL, colors for email templates
```

**Email Templates:**
```
Template types:
- appointment_confirmation
- appointment_reminder
- appointment_cancelled
- appointment_rescheduled
- payment_receipt
- password_reset
- email_verification

Template variables:
- {{business_name}}
- {{client_name}}
- {{appointment_date}}
- {{appointment_time}}
- {{service_name}}
- {{staff_name}}
- {{location_address}}
- {{appointment_link}}
- {{cancellation_link}}
```

**Toggle Implementation:**
```
UI Location: Settings > Notifications > Email
Provider Selection: Dropdown with provider options
Configuration Forms: Provider-specific fields shown based on selection
Template Management: Visual editor for customizing email templates
Test Email: Send test email button to verify configuration
```

---

## SMS Notifications

### Overview

SMS notifications send text messages for appointment reminders and status updates. SMS has higher open rates than email (98% vs 20%) but higher cost.

### Supported Providers

#### Twilio

**Primary Use:** SMS, voice, video communications
**Website:** https://www.twilio.com
**Documentation:** https://www.twilio.com/docs/sms

**Features:**
- Global SMS coverage (180+ countries)
- Programmable SMS API
- Delivery tracking
- Two-way messaging
- Short codes and long codes
- MMS support (images)
- Message scheduling

**Setup Requirements:**
- Twilio account
- Phone number purchased ($1/month)
- API credentials (Account SID, Auth Token)
- Verify destination phone numbers (test mode)

**API Integration:**
- Messages API: Create message via POST
- Webhooks for delivery status
- Bulk messaging support

**SMS Flow:**
1. Platform creates message via Twilio API
2. Twilio delivers SMS to carrier
3. Carrier delivers to recipient device
4. Twilio sends webhook with delivery status
5. Platform updates message status

**Webhook Events:**
- sent: Message sent to carrier
- delivered: Message delivered to device
- failed: Message failed to deliver
- undelivered: Message not delivered

**Pricing:**
- US outbound SMS: $0.0079 per message
- US inbound SMS: $0.0079 per message
- International rates vary by country
- Phone number: $1/month

**Character Limits:**
- Standard SMS: 160 characters
- Unicode (emojis): 70 characters
- Longer messages: Automatically split into segments

**Testing:**
- Test credentials for sandbox
- Test phone numbers return success without sending

---

#### MessageBird

**Primary Use:** SMS, voice, chat apps
**Website:** https://www.messagebird.com
**Documentation:** https://developers.messagebird.com

**Features:**
- Global SMS coverage
- Competitive pricing
- WhatsApp Business API integration
- Omnichannel messaging
- Number lookup for validation

**Setup Requirements:**
- MessageBird account
- API key
- Sender ID or phone number

**Pricing:**
- Slightly cheaper than Twilio in many markets
- US SMS: ~$0.007 per message
- Volume discounts available

---

### SMS Configuration

**Per-Tenant Settings:**
```
sms_enabled: boolean (default: false)
sms_provider: twilio | messagebird
provider_configuration:
  - account_sid (Twilio)
  - auth_token (Twilio, encrypted)
  - from_phone_number: E.164 format
sms_opt_in_required: boolean (default: true)
```

**SMS Templates:**
```
Reminder template:
"Hi {{client_name}}, reminder: {{service_name}} appt tomorrow at {{time}} with {{business_name}}. Reply CANCEL to cancel."

Confirmation template:
"{{business_name}}: Your {{service_name}} appt is confirmed for {{date}} at {{time}}. Location: {{address}}."

Cancellation template:
"Your {{service_name}} appt on {{date}} at {{time}} has been cancelled. Rebook at {{booking_url}}"

Character limit: 160 characters recommended to avoid multi-part messages
```

**Opt-In Compliance:**
```
Requirements:
- Obtain explicit consent before sending SMS
- Checkbox on booking form: "Send me appointment reminders via SMS"
- Honor opt-out requests (STOP keyword)
- Maintain opt-in status per client
- TCPA compliance (US): Written consent required for marketing, informational OK
```

**Toggle Implementation:**
```
UI Location: Settings > Notifications > SMS
Enable Switch: Master toggle for SMS feature
Provider Selection: Radio buttons for Twilio vs MessageBird
Configuration Form: Account credentials, from number
Test SMS: Send test message to verify setup
Opt-In Management: View client opt-in status, bulk opt-in tools
```

**Cost Management:**
```
Cost visibility: Show estimated monthly SMS cost based on appointment volume
Budget limits: Set monthly SMS budget, alert at 80%
Selective sending: Choose which notifications to send via SMS vs email
  - High priority: Appointment reminders (always SMS)
  - Medium priority: Confirmation (SMS or email)
  - Low priority: Review requests (email only)
```

---

## Analytics Integrations

### Overview

Analytics integrations track user behavior, marketing attribution, and business performance metrics through third-party analytics platforms.

### Supported Platforms

#### Google Analytics

**Primary Use:** Website and app analytics
**Version:** Google Analytics 4 (GA4)
**Documentation:** https://developers.google.com/analytics/devguides/collection/ga4

**Features:**
- Pageview tracking
- Event tracking
- E-commerce tracking
- User demographics
- Traffic source attribution
- Conversion tracking
- Custom dimensions and metrics

**Setup Requirements:**
- Google Analytics 4 property created
- Measurement ID (G-XXXXXXXXXX)
- gtag.js or Google Tag Manager installed

**Implementation:**
- Install gtag.js in booking page and admin UI
- Track key events:
  - page_view: Page navigation
  - booking_started: User begins booking flow
  - booking_step_completed: Each step in booking wizard
  - booking_completed: Appointment booked
  - payment_completed: Payment processed
  - user_signup: New user registration
  - search: Search performed

**Custom Dimensions:**
- business_id: Identify which business
- service_category: Service type booked
- booking_source: widget | standalone | app
- user_role: customer | staff | owner

**E-commerce Tracking:**
- Transaction: Appointment booking as transaction
- Revenue: Service price as transaction value
- Product: Service name and details

**Toggle Implementation:**
```
Per-Tenant Configuration:
- google_analytics_enabled: boolean
- google_analytics_measurement_id: string (G-XXXXXXXXXX)

Implementation:
- If enabled, inject gtag.js with measurement ID in booking page
- Admin UI: Always use platform-level GA for platform analytics
- Privacy: Respect GDPR, honor Do Not Track
```

---

#### Mixpanel

**Primary Use:** Product analytics, user behavior analysis
**Documentation:** https://developer.mixpanel.com/docs

**Features:**
- Event-based analytics
- User profiles and segmentation
- Funnel analysis
- Retention analysis
- A/B testing
- Push notifications

**Setup Requirements:**
- Mixpanel project created
- Project token
- JavaScript SDK installed

**Implementation:**
- Track similar events as Google Analytics
- Richer event properties for analysis
- User identification with user IDs

**Toggle Implementation:**
```
Per-Tenant Configuration:
- mixpanel_enabled: boolean
- mixpanel_project_token: string

Use case: Businesses wanting deeper product analytics beyond GA
```

---

#### Segment

**Primary Use:** Customer data platform, unifies analytics
**Documentation:** https://segment.com/docs

**Features:**
- Single API for multiple analytics tools
- Data routing to destinations (GA, Mixpanel, etc.)
- Data warehousing
- Customer data consolidation

**Setup Requirements:**
- Segment workspace
- Write key
- Destinations configured (GA, Mixpanel, etc.)

**Implementation:**
- Install Segment Analytics.js
- Track events once, routed to all destinations
- Simplifies multi-tool analytics setup

**Toggle Implementation:**
```
Platform-Level (Not Per-Tenant):
- segment_enabled: boolean
- segment_write_key: string

Use case: Platform wants to aggregate analytics across all tenants
```

---

### Analytics Configuration

**Event Tracking Standard:**
```
All events follow naming convention: noun_verb
Examples: booking_started, payment_completed, user_signed_up

Event properties always include:
- timestamp: ISO 8601 timestamp
- user_id: Logged-in user ID or anonymous ID
- business_id: Tenant identifier
- session_id: User session identifier
```

**Privacy Considerations:**
```
- Anonymize IP addresses in GA
- Honor GDPR consent (don't track if consent not given)
- Honor Do Not Track browser header
- Provide opt-out mechanism in privacy policy
- Don't send PII (email, phone) to analytics platforms
```

---

## AI-Powered Features

### Overview

AI-powered features enhance the booking platform with intelligent automation, personalization, and insights. These are optional premium features requiring additional configuration and potentially costs.

### Supported AI Features

#### AI-Powered Smart Scheduling

**Feature:** Predictive appointment scheduling optimization
**Provider:** OpenAI GPT-4 API or custom ML model
**Documentation:** https://platform.openai.com/docs

**Functionality:**
- No-show prediction: Predict likelihood client will no-show based on historical data
- Optimal slot recommendation: Suggest best time slots based on client preferences, history, staff performance
- Buffer time optimization: Recommend buffer times based on service complexity and staff efficiency
- Demand forecasting: Predict busy periods for staffing optimization

**Implementation Approach:**
- Train custom model on historical appointment data
- Features: day of week, time of day, client history, weather, season, lead time
- Use model to score time slots for recommendations
- Continuously retrain model with new data

**Data Requirements:**
- Minimum 6 months of historical appointment data
- At least 500 appointments for reasonable accuracy
- Client features: appointment count, cancellation rate, no-show rate
- Staff features: on-time rate, service quality ratings

**API Integration:**
- If using OpenAI: Send features to GPT-4 API for predictions
- If custom model: Deploy ML model as separate service (Python Flask/FastAPI)
- Cache predictions for performance

**Pricing Considerations:**
- OpenAI API: ~$0.03 per 1K tokens (predictions)
- Custom model hosting: ~$100-500/month depending on traffic

**Toggle Implementation:**
```
Per-Tenant Configuration:
- ai_scheduling_enabled: boolean (default: false)
- ai_provider: openai | custom
- ai_features:
  - no_show_prediction: boolean
  - optimal_slot_recommendation: boolean
  - buffer_optimization: boolean
  - demand_forecasting: boolean

UI Location: Settings > Advanced Features > AI Scheduling
Requires: Pro or Enterprise plan subscription
```

---

#### AI-Powered Client Insights

**Feature:** Intelligent client profiling and recommendations
**Provider:** OpenAI GPT-4 or custom NLP model

**Functionality:**
- Sentiment analysis: Analyze client notes for satisfaction/dissatisfaction
- Client segmentation: Automatically categorize clients (VIP, at-risk, new, loyal)
- Service recommendations: Suggest services client might like based on history
- Personalized communications: Generate personalized email/SMS content

**Implementation:**
- Sentiment analysis: NLP on client notes and feedback
- Segmentation: Clustering algorithm (K-means) on RFM features (Recency, Frequency, Monetary)
- Recommendations: Collaborative filtering or content-based recommendations

**Toggle Implementation:**
```
Per-Tenant Configuration:
- ai_client_insights_enabled: boolean (default: false)
- ai_features:
  - sentiment_analysis: boolean
  - client_segmentation: boolean
  - service_recommendations: boolean
```

---

#### Chatbot / Virtual Assistant

**Feature:** AI-powered chatbot for customer inquiries
**Provider:** OpenAI GPT-4 API, Dialogflow, or custom

**Functionality:**
- Answer FAQs (business hours, services, pricing)
- Help with booking (guide through booking process)
- Appointment modifications (reschedule, cancel)
- Business information lookup

**Implementation:**
- Train chatbot on business-specific knowledge (services, policies)
- Integrate with booking API to perform actions
- Fallback to human support for complex queries

**Toggle Implementation:**
```
Per-Tenant Configuration:
- chatbot_enabled: boolean (default: false)
- chatbot_provider: openai | dialogflow | custom
- chatbot_avatar_url: string (optional)
- chatbot_name: string (e.g., "Sarah")

UI Location: Booking widget includes chat bubble if enabled
```

---

#### Automated Marketing Content

**Feature:** AI-generated marketing content
**Provider:** OpenAI GPT-4 API

**Functionality:**
- Generate email campaign content
- Generate social media posts
- Generate promotional offer descriptions
- A/B test content variations

**Implementation:**
- Prompt engineering for GPT-4 to generate marketing copy
- Business owner provides key points, AI expands
- Human review before sending

**Toggle Implementation:**
```
Per-Tenant Configuration:
- ai_marketing_enabled: boolean (default: false)

UI Location: Marketing > Content Generator
Requires: Pro or Enterprise plan
```

---

### AI Configuration

**Global AI Settings:**
```
Platform-Level (Environment Variables):
- OPENAI_API_KEY: OpenAI API key (encrypted)
- AI_MODEL_VERSION: gpt-4-turbo, gpt-4, etc.
- AI_RATE_LIMIT: Max API calls per minute
- AI_COST_LIMIT: Max monthly spend on AI APIs
```

**Per-Tenant Settings:**
```
ai_features_enabled: boolean (default: false)
ai_subscription_tier: none | starter | pro | enterprise
ai_monthly_budget: number (max spend on AI per month)
ai_feature_flags:
  - smart_scheduling: boolean
  - client_insights: boolean
  - chatbot: boolean
  - marketing_content: boolean
```

**Cost Management:**
```
- Track AI API usage per tenant
- Alert when approaching budget limit
- Pause AI features if budget exceeded
- Provide usage dashboard showing API calls and cost
```

**Privacy and Ethics:**
```
- Data minimization: Only send necessary data to AI APIs
- No PII to third-party AI: Strip sensitive information
- Data retention: AI API providers may retain data temporarily
- Transparency: Disclose AI usage in privacy policy
- Human oversight: Critical decisions reviewed by humans
```

---

## Integration Toggle Mechanisms

### Database Schema

**integration_settings table:**
```
Columns:
- id: UUID primary key
- business_id: UUID foreign key (tenants)
- integration_type: ENUM (calendar_sync, payment, email, sms, analytics, ai)
- provider: string (stripe, sendgrid, twilio, openai, etc.)
- enabled: boolean
- configuration: JSONB (provider-specific settings, encrypted credentials)
- status: ENUM (active, error, disconnected)
- last_sync_at: timestamp (for sync-based integrations)
- error_message: text (if status = error)
- created_at: timestamp
- updated_at: timestamp

Indexes:
- (business_id, integration_type) for quick lookup
- (business_id, enabled) for filtering active integrations
```

**integration_usage table:**
```
Columns:
- id: UUID primary key
- business_id: UUID
- integration_type: string
- usage_date: date
- api_calls: integer
- cost: decimal (estimated cost)
- created_at: timestamp

Purpose: Track usage and cost per integration per tenant
```

### API Endpoints

**Integration Management:**
```
GET /api/businesses/:id/integrations
- List all integrations for business
- Returns: array of integration objects with status

GET /api/businesses/:id/integrations/:type
- Get specific integration details
- Returns: integration configuration (credentials masked)

POST /api/businesses/:id/integrations/:type/enable
- Enable integration
- Body: { provider, configuration }
- Returns: integration object

PUT /api/businesses/:id/integrations/:type/configure
- Update integration configuration
- Body: { configuration }
- Returns: updated integration object

POST /api/businesses/:id/integrations/:type/disable
- Disable integration
- Returns: success message

POST /api/businesses/:id/integrations/:type/test
- Test integration connection
- Returns: { success, message, details }

DELETE /api/businesses/:id/integrations/:type
- Delete integration and disconnect
- Returns: success message
```

### UI Components

**Integration Settings Page:**
```
Location: Settings > Integrations

Layout:
- Sidebar with integration categories (Calendar, Payments, Communications, Analytics, AI)
- Main content area with integration cards

Integration Card:
- Icon and name
- Short description
- Status badge (Connected, Disconnected, Error)
- Enable/Disable toggle
- Configure button (opens modal)

Configuration Modal:
- Provider selection (if multiple providers)
- Provider-specific fields
- Test connection button
- Save and Cancel buttons
- Help text and documentation links
```

**Integration Status Indicators:**
```
Visual feedback:
- Green check: Integration active and healthy
- Yellow warning: Integration active but issues (API rate limit approaching)
- Red error: Integration error (credentials invalid, API down)
- Gray disconnected: Integration disabled

Hover tooltip:
- Last sync: timestamp of last successful sync
- Status message: e.g., "Connected to Google Calendar"
- Action links: Configure, Disconnect
```

### Feature Flags

**Environment-Level Flags:**
```
# .env or environment variables
FEATURE_CALENDAR_SYNC_ENABLED=true
FEATURE_PAYMENT_STRIPE_ENABLED=true
FEATURE_PAYMENT_ADYEN_ENABLED=false (not yet ready)
FEATURE_AI_FEATURES_ENABLED=true
```

**Application-Level Flags:**
```
# Feature flag service (LaunchDarkly, custom)
Use for gradual rollout of new integrations:
- Enable for subset of tenants (beta testers)
- A/B test integration variations
- Kill switch for problematic integrations
```

**Per-Tenant Flags:**
```
# In integration_settings table
enabled: boolean (tenant has enabled integration)

# In business subscription_tier
Determine which integrations available:
- Free tier: Basic email, no integrations
- Starter tier: Email, SMS
- Pro tier: All integrations except AI
- Enterprise tier: All integrations including AI
```

### Gradual Rollout Strategy

**Phase 1: Internal Testing**
- Enable integration for test tenant only
- Thorough testing by team
- Fix bugs discovered

**Phase 2: Beta Testing**
- Enable for 5-10 early adopter tenants
- Gather feedback
- Monitor error rates and usage

**Phase 3: Gradual Rollout**
- Enable for 10% of tenants (feature flag)
- Monitor performance and errors
- If issues, rollback or pause
- Gradually increase to 25%, 50%, 100%

**Phase 4: General Availability**
- Integration available to all tenants
- Announcement and documentation
- Support team trained

---

## Integration Monitoring and Health

### Health Checks

**Per Integration Health Check:**
```
- Endpoint: GET /api/health/integrations/:type
- Checks:
  - API credentials valid
  - API endpoint reachable
  - Rate limits not exceeded
  - Recent sync success (for sync integrations)
  - No repeated errors (error rate < 1%)
- Returns: { status: healthy | degraded | down, details }
```

**Dashboard Monitoring:**
```
Metrics tracked:
- Integration uptime (% time healthy)
- API call success rate
- API call latency (p50, p95, p99)
- Error rate by error type
- Usage trends (API calls over time)
- Cost trends (spending over time)

Alerts:
- Integration down: Alert immediately (PagerDuty)
- High error rate: Alert if > 5% errors in 5 minutes
- Rate limit approaching: Alert at 80% of rate limit
- Cost overrun: Alert if 150% of expected cost
```

### Error Handling

**Retry Strategy:**
```
Transient errors (network, timeout, rate limit):
- Retry with exponential backoff: 1s, 2s, 4s, 8s, 16s
- Max retries: 5 attempts
- After max retries: Mark as error, alert

Permanent errors (invalid credentials, not found):
- Don't retry
- Mark integration as error status
- Notify business owner via email and in-app notification
```

**Fallback Mechanisms:**
```
If integration fails:
- Email fails: Queue for retry, fallback to SMTP if configured
- SMS fails: Queue for retry, fallback to email
- Calendar sync fails: Show warning, allow manual sync
- Payment fails: Show error to customer, suggest alternative payment method
- AI feature fails: Fallback to non-AI version of feature (e.g., manual scheduling)
```

---

## Integration Security

### Credential Storage

**Encryption:**
- All API keys, tokens, passwords encrypted at rest using AES-256
- Encryption keys managed by AWS KMS or similar
- Credentials never logged or displayed in UI (masked)

**Access Control:**
- Only business owners can configure integrations
- API credentials accessible only to backend services
- Credentials never sent to frontend (use backend proxy)

**Rotation:**
- Regular rotation of API keys (quarterly recommended)
- Notification when credentials expiring
- Automated rotation where supported (OAuth refresh tokens)

### API Communication

**Transport Security:**
- All API calls over HTTPS (TLS 1.3)
- Certificate validation enforced
- No fallback to HTTP

**Authentication:**
- API keys in Authorization header (never in URL)
- OAuth tokens with short expiration (1 hour)
- Webhook signatures verified using HMAC

**Rate Limiting:**
- Respect provider rate limits
- Implement client-side rate limiting to avoid hitting limits
- Graceful handling of rate limit errors (exponential backoff)

---

## Summary

This document provides comprehensive integration specifications for all third-party services in the booking platform. Each integration follows a consistent pattern:

1. **Purpose:** Clear use case and benefits
2. **Providers:** Multiple options where applicable
3. **Setup:** Step-by-step configuration requirements
4. **Implementation:** Technical approach and APIs used
5. **Configuration:** Tenant-level and platform-level settings
6. **Toggle Mechanism:** UI and database implementation for enabling/disabling
7. **Monitoring:** Health checks and error handling
8. **Security:** Credential storage and API communication security

Integrations are modular and optional, allowing businesses to customize their booking platform based on needs and budget. The toggle mechanisms provide granular control at platform, tenant, and feature levels.
