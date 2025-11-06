# payment-integration.md

## Task Title

Integrate Stripe Payment Processing System

## Task Description

Implement comprehensive payment processing integration with Stripe to handle appointment payments, deposits, refunds, and subscription billing. The payment system must support multiple payment scenarios: upfront full payment before appointment, deposit payment with balance due later, payment at appointment completion, and refunds for cancellations. Integration must be PCI-compliant by using Stripe Elements or Checkout for card data collection, ensuring no sensitive payment information touches the platform servers. The system must handle webhooks for asynchronous payment events, manage payment methods for repeat customers, and provide clear payment status tracking throughout the appointment lifecycle.

The payment integration is critical for revenue collection and must be reliable, secure, and provide excellent user experience. Payment failures must be handled gracefully with clear error messages and recovery paths. The system must support both one-time payments for appointments and recurring subscription billing for businesses on premium plans.

## Acceptance Criteria

### Stripe Account Connection

- Business owners can connect their Stripe account via OAuth flow from admin settings page
- OAuth connection flow opens Stripe Connect authorization page in new window or redirect
- After authorization, platform receives authorization code and exchanges for access token and refresh token
- Platform securely stores Stripe account ID (connected account ID), access token (encrypted), and refresh token for each business
- Connection status displayed in admin settings: Connected (green badge), Not Connected (gray), Error (red with reconnect option)
- Business owners can disconnect Stripe account with confirmation dialog warning about impact on payment processing
- Platform validates Stripe account is fully activated and can accept payments before allowing live transactions
- Test mode toggle allows using Stripe test keys for development and testing without affecting live payments
- Connection errors (invalid credentials, authorization denied, network timeout) show clear error messages with troubleshooting steps

### Payment Configuration

- Business owners can configure payment settings per service or globally
- Payment options: No Payment Required (free services or pay later), Deposit Required (fixed amount or percentage), Full Payment Required (entire service price upfront)
- Deposit configuration allows specifying either fixed dollar amount (e.g., 25 dollars) or percentage (e.g., 50 percent)
- Balance due calculation: Service price minus deposit equals balance due at appointment
- Payment timing: At Booking (customer pays when booking online), At Appointment (customer pays in-person), At Completion (customer pays after service rendered)
- Cancellation refund policy: Full Refund, Partial Refund (keep deposit), No Refund, with deadline (24/48/72 hours before appointment)
- No-show policy: Charge Full Amount, Charge Deposit, No Charge
- Payment configuration validates sensible rules (deposit cannot exceed service price, percentages between 1-100)
- Configuration changes apply to future appointments, existing appointments retain original payment terms

### Customer Payment Flow (Booking)

- When booking appointment with payment required, customer proceeds to payment step after client details
- Payment step displays clear summary: Service name, price, deposit/full payment amount, business name
- Payment UI uses Stripe Payment Element (embedded form) for secure card input with PCI-compliant iframe
- Payment Element supports credit/debit cards, Apple Pay, Google Pay, and other Stripe-supported methods
- Card input validates in real-time (card number format, expiry date, CVV length, postal code)
- "Save payment method for future bookings" checkbox allows customers to save card securely with Stripe
- Payment submission creates Stripe Payment Intent with amount, currency, customer ID, metadata (appointment ID, business ID)
- Payment processing shows loading spinner with message "Processing payment..." and disables submit button to prevent double-submission
- Successful payment shows confirmation screen with payment receipt, appointment details, and option to download/email receipt
- Failed payment shows error message extracted from Stripe error response (e.g., "Card declined. Please use a different card.") with option to retry or use different payment method
- Payment error codes mapped to user-friendly messages: insufficient_funds = "Insufficient funds", expired_card = "Card expired", incorrect_cvc = "Incorrect security code"
- 3D Secure (SCA) authentication handled automatically by Stripe Payment Element, customer redirected to bank authentication if required
- Payment success triggers appointment confirmation, sends confirmation email with receipt, and creates payment record

### Payment Intent Lifecycle Management

- Platform creates Stripe Payment Intent when customer initiates payment with status "requires_payment_method"
- Payment Intent amount matches deposit or full payment based on configuration, in smallest currency unit (cents for USD)
- Payment Intent metadata includes appointment ID, client ID, business ID, service ID for linking payment to booking
- After customer submits payment, Payment Intent transitions to "requires_confirmation" or "requires_action" (for 3D Secure)
- Stripe confirms payment automatically or prompts customer for additional authentication
- Payment Intent transitions to "succeeded" on successful payment, appointment created and confirmed
- Payment Intent transitions to "requires_payment_method" on failed payment, customer prompted to retry
- Payment Intent transitions to "canceled" if customer abandons booking or booking times out after 15 minutes
- Platform polls Payment Intent status or listens to webhooks for status updates
- Idempotency keys used for all Stripe API calls to prevent duplicate charges if requests retried

### Saved Payment Methods

- Returning customers who saved payment method during previous booking see saved cards in payment step
- Saved payment methods displayed as "Visa ending in 4242, expires 12/2026" with last 4 digits and expiry
- Customer can select saved payment method or add new card
- Saved payment methods stored in Stripe Customer object, platform only stores Stripe Payment Method ID (not card details)
- Customer can manage saved payment methods from client portal: view all cards, set default, remove cards
- Removing payment method deletes from Stripe and platform database
- Platform creates Stripe Customer object on first payment, links to client profile, reuses for future payments
- Saved payment methods make repeat bookings faster (one-click payment) increasing conversion
- Payment methods automatically updated by Stripe if card issuer provides updated expiry or card details

### In-Person Payment Processing

- Staff can mark appointment as paid via admin calendar or appointment detail page
- In-person payment recording shows payment method options: Card (via terminal), Cash, Check, Other
- If Card selected, staff can process payment through Stripe Terminal integration (future enhancement) or mark as externally processed
- Payment recording captures amount paid, payment method, transaction reference (if available), timestamp
- Partial payment supported for appointments where deposit paid online and balance due in-person
- Balance due calculation shown clearly: Total price minus deposit equals amount to collect
- Overpayment and underpayment handling: staff can record actual amount received, system tracks variance
- Payment receipt generated automatically, can be printed or emailed to customer
- In-person payments create payment record with status "paid" and appropriate payment method

### Refund Processing

- Business owners can issue refunds from appointment detail page or payment record
- Refund options: Full Refund (entire payment), Partial Refund (specify amount or keep deposit), No Refund
- Refund form shows original payment amount, amount to refund, reason for refund (dropdown and optional notes)
- Refund reasons: Customer Request, Cancellation by Business, Service Not Rendered, Other
- Refund submission creates Stripe Refund via API linked to original Payment Intent
- Refund processing shows loading spinner, prevents duplicate submissions
- Successful refund updates payment record status to "refunded" or "partially_refunded", sends refund confirmation email to customer
- Refund typically appears in customer account within 5-10 business days (Stripe timeline), customer informed of timeline in email
- Failed refund shows error message (e.g., "Original payment not yet settled, try again later"), allows retry
- Refund history tracked with timestamps, amounts, reasons for audit trail
- Automated refunds triggered by policy: appointment cancelled 48+ hours before with full refund policy auto-processes refund

### Payment Status Tracking

- Each appointment has payment status: Pending, Paid, Partially Paid, Refunded, Failed
- Payment status displayed in calendar appointment blocks with badge (green = paid, yellow = pending, red = failed)
- Appointment detail page shows payment summary: Amount due, amount paid, amount refunded, outstanding balance
- Payment history timeline shows all payment events: payment received, refund issued, payment failed, with timestamps and amounts
- Outstanding balance highlighted if customer has unpaid balance after appointment
- Business owners can filter calendar and appointments by payment status
- Payment status changes trigger notifications: payment received sends receipt, payment failed sends alert
- Reports show payment metrics: total revenue, pending payments, refunded amounts, by date range

### Subscription Billing for Businesses

- Platform charges businesses subscription fees monthly or annually via Stripe Billing
- Subscription plans: Free (limited features), Basic (monthly fee), Pro (monthly fee with more features), Enterprise (custom pricing)
- Business owner selects plan during onboarding or from billing settings page
- Subscription creation creates Stripe Subscription with plan price, billing interval, trial period (if applicable)
- Payment method collection for subscription: business owner enters card details via Stripe Checkout or Payment Element
- First charge occurs immediately or after trial period ends
- Recurring charges processed automatically by Stripe on billing anniversary date
- Subscription invoices generated by Stripe and emailed to business owner automatically
- Business owner can view subscription details in billing settings: current plan, next billing date, amount, payment method
- Business owner can upgrade or downgrade plan, changes take effect immediately or at next billing cycle (configurable)
- Proration handled automatically by Stripe for mid-cycle plan changes
- Business owner can update payment method from billing settings using Stripe Billing Portal or custom UI
- Failed subscription payment triggers retry attempts by Stripe (automatic retry schedule), business notified of failure
- After multiple failed payments, subscription moves to "past_due" or "unpaid" status, account features restricted until payment resolved
- Business owner can cancel subscription with confirmation, access remains until end of current billing period
- Cancelled subscriptions marked as "cancelled" status, customer data retained but features downgraded to free tier

### Webhook Event Handling

- Platform receives webhook events from Stripe at endpoint POST /api/webhooks/stripe
- Webhook endpoint verifies signature using Stripe webhook secret to ensure events authentic and unmodified
- Signature verification failure rejects webhook with 401 Unauthorized, logs security event
- Webhook events processed asynchronously using job queue to prevent blocking response and handle high volume
- Key webhook events handled:
  - payment_intent.succeeded: Mark payment as successful, confirm appointment, send confirmation email
  - payment_intent.payment_failed: Mark payment as failed, send failure notification, prevent appointment confirmation
  - charge.refunded: Update payment status to refunded, send refund confirmation email
  - customer.subscription.updated: Update business subscription status, adjust feature access
  - customer.subscription.deleted: Mark subscription as cancelled, downgrade account to free tier
  - invoice.payment_succeeded: Record successful subscription payment, send receipt
  - invoice.payment_failed: Alert business owner of failed payment, trigger retry or restriction
- Webhook processing idempotent: duplicate events (same event ID) ignored to prevent double-processing
- Webhook processing errors logged with event details for debugging, failed events retried with exponential backoff
- Webhook endpoint returns 200 OK immediately after queuing event, Stripe expects 2xx response within 30 seconds
- Webhook events older than 24 hours ignored to prevent processing stale events after system downtime

### Payment Receipt and Invoicing

- Payment receipt generated automatically after successful payment with receipt number, date, business name, customer name, payment details
- Receipt includes itemized breakdown: Service name, price, deposit paid, balance paid, total paid, payment method (last 4 digits)
- Receipt includes business information: name, address, phone, email, tax ID (if configured)
- Receipt available in customer booking confirmation email as PDF attachment or link
- Customer can download receipt from booking confirmation page or client portal
- Business owner can view and download receipts from payment records in admin dashboard
- Business owner can resend receipt to customer via email from payment record
- Invoice generation for business-to-business bookings: similar to receipt but labeled "Invoice" with due date and payment terms
- Invoice supports line items for multiple services if booking includes add-ons or packages
- Receipts and invoices stored as PDF files in cloud storage (S3) with 7-year retention for tax/audit purposes
- Receipts and invoices accessible via API for integrations with accounting software

### PCI Compliance and Security

- Platform never touches raw card data, all card input handled by Stripe Elements or Checkout (PCI-compliant embeds)
- No card numbers, CVVs, or PINs stored in platform database
- Only tokenized references (Payment Method IDs, Customer IDs) stored, tokens useless outside Stripe context
- Stripe API keys stored encrypted in database using AES-256 encryption
- API keys separated by environment (test and live keys) with clear labeling to prevent accidental live charges in development
- Access to payment settings and Stripe configuration restricted to business owners only (role-based access control)
- Payment webhooks validate signature to prevent spoofed events
- All API calls to Stripe made over HTTPS with TLS 1.2+
- Payment-related logs sanitized to remove sensitive data before storage
- Platform complies with PCI DSS by using Stripe as payment processor (Stripe is Level 1 PCI DSS certified)
- Security best practices: no card data in URLs, no card data in logs, no card data in error messages
- Regular security audits of payment flow and Stripe integration

### Error Handling and Retry Logic

- Transient Stripe API errors (network timeout, 500 errors) retried automatically up to 3 times with exponential backoff
- Permanent errors (invalid request, authentication failure) not retried, logged and reported to user
- Payment failures categorized by type: card errors (user can fix by trying different card), rate limit errors (retry automatically), API errors (alert engineering team)
- Card errors shown to user with actionable guidance: "Card declined" → "Try different card", "Insufficient funds" → "Add funds or use different card"
- Webhook processing failures retry with increasing delays: 1 minute, 5 minutes, 30 minutes, 2 hours (handled by Stripe retry logic)
- Failed webhook events after all retries logged to error tracking system for manual investigation
- Payment Intent timeout: if payment not completed within 15 minutes, Intent cancelled automatically and booking abandoned
- Idempotency key conflicts indicate duplicate request, return original result without re-executing (safe retry)

### Multi-Currency Support

- Platform supports multiple currencies based on business location: USD, EUR, GBP, CAD, AUD, others as needed
- Business owner selects currency during onboarding or in business settings
- All prices for services, deposits, payments displayed in business-configured currency
- Currency symbol and formatting follows locale conventions (USD: dollar sign prefix, EUR: euro sign suffix)
- Stripe Payment Intent created with currency matching business configuration
- Exchange rate handling: if customer pays in different currency than business expects (rare), Stripe handles conversion
- Currency changes restricted after business has processed payments to prevent confusion in financial records

### Testing and Sandbox Mode

- Stripe test mode allows full integration testing without processing real payments
- Test mode uses Stripe test API keys (starting with sk_test, pk_test)
- Test payment methods available in Stripe documentation: test card number 4242 4242 4242 4242 always succeeds
- Test mode clearly indicated in UI with prominent banner "Test Mode - Payments will not be charged"
- Business owners can toggle between test and live mode from admin settings (requires re-authentication for security)
- All payment features available in test mode: payments, refunds, webhooks, subscriptions
- Test mode data completely separate from live mode data
- Before going live, business completes Stripe account activation checklist: verify identity, add bank account, configure business details

## Implementation Details

### Technology Stack

- Stripe Node.js SDK (stripe npm package) for backend API calls
- Stripe React library (stripe/react-stripe-js) for frontend Payment Element integration
- Stripe Checkout for hosted payment page option (simpler integration for some flows)
- Stripe Webhooks for event handling
- Stripe Connect for multi-tenant marketplace (businesses receive funds directly)
- BullMQ job queue for asynchronous webhook processing
- Database tables: payments, payment_methods, stripe_accounts, stripe_events, subscription_records

### Backend Architecture

Modules and services:

- payments module:
  - PaymentsController: API endpoints for payment operations
  - PaymentsService: Business logic for payment processing
  - StripeService: Wrapper for Stripe API calls
  - RefundsService: Refund processing logic
  - PaymentIntentService: Payment Intent lifecycle management
  - WebhookService: Webhook event processing
  - ReceiptService: Receipt generation

- stripe-connect module:
  - StripeConnectController: OAuth flow endpoints
  - StripeConnectService: Account connection management
  - StripeAccountRepository: Database operations for Stripe accounts

- subscriptions module:
  - SubscriptionsController: Subscription management endpoints
  - SubscriptionsService: Subscription lifecycle
  - BillingService: Billing and invoicing logic

Database schema:

payments table:
- id (uuid, primary key)
- appointment_id (uuid, foreign key to appointments)
- business_id (uuid, foreign key to businesses)
- client_id (uuid, foreign key to clients)
- stripe_payment_intent_id (string, unique)
- amount (integer, amount in cents)
- currency (string, ISO currency code)
- status (enum: pending, succeeded, failed, refunded, partially_refunded)
- payment_method (enum: card, cash, check, other)
- stripe_customer_id (string)
- stripe_payment_method_id (string)
- metadata (jsonb, flexible data)
- created_at, updated_at

refunds table:
- id (uuid, primary key)
- payment_id (uuid, foreign key to payments)
- stripe_refund_id (string, unique)
- amount (integer, refund amount in cents)
- reason (string)
- status (enum: pending, succeeded, failed)
- created_at, updated_at

stripe_accounts table:
- id (uuid, primary key)
- business_id (uuid, foreign key to businesses, unique)
- stripe_account_id (string, connected account ID)
- access_token (text, encrypted)
- refresh_token (text, encrypted)
- scope (string, OAuth scopes)
- status (enum: connected, disconnected, error)
- test_mode (boolean)
- created_at, updated_at

stripe_events table:
- id (uuid, primary key)
- event_id (string, Stripe event ID, unique)
- event_type (string, event type like payment_intent.succeeded)
- payload (jsonb, full event data)
- processed (boolean, processed flag)
- processed_at (timestamp)
- created_at

subscriptions table:
- id (uuid, primary key)
- business_id (uuid, foreign key to businesses)
- stripe_subscription_id (string, unique)
- stripe_customer_id (string)
- plan (enum: free, basic, pro, enterprise)
- status (enum: active, trialing, past_due, cancelled, unpaid)
- current_period_start (timestamp)
- current_period_end (timestamp)
- created_at, updated_at

### Stripe Connect Integration

OAuth flow for connecting business Stripe accounts:

1. Business owner clicks "Connect Stripe" button in admin settings
2. Frontend redirects to Stripe Connect OAuth URL with parameters:
   - client_id: platform's Stripe Connect application ID
   - scope: read_write (full access to connected account)
   - redirect_uri: callback URL on platform
   - state: CSRF token for security
3. Business owner logs in to Stripe or creates Stripe account
4. Business owner authorizes platform to access their Stripe account
5. Stripe redirects back to platform callback URL with authorization code
6. Backend exchanges authorization code for access token via POST to Stripe token endpoint
7. Backend stores access token, refresh token, and Stripe account ID encrypted in database
8. Backend returns success response, frontend shows "Connected" status

Subsequent API calls:
- All Stripe API calls for business use connected account via Stripe-Account header or account parameter
- Platform acts on behalf of business for creating charges, refunds, managing customers
- Funds flow directly to business Stripe account (platform doesn't hold funds)

### Payment Intent Creation

When customer proceeds to payment step during booking:

1. Frontend calls backend API: POST /api/payments/create-intent with {appointmentDetails, amount, businessId}
2. Backend validates request, retrieves business Stripe account from database
3. Backend creates Stripe Payment Intent via Stripe API:
   - Amount: in cents (e.g., 50 dollars = 5000 cents)
   - Currency: from business configuration
   - Customer: existing Stripe Customer ID if returning customer, or create new Customer
   - Payment method types: card, apple_pay, google_pay
   - Metadata: appointment_id, client_id, business_id, service_id
   - Stripe-Account header: business connected account ID (charge goes to business)
4. Stripe returns Payment Intent with client_secret
5. Backend stores Payment Intent ID in database with status "pending"
6. Backend returns client_secret to frontend
7. Frontend initializes Stripe Payment Element with client_secret
8. Customer enters card details in Payment Element
9. Customer clicks "Pay Now", frontend calls stripe.confirmPayment method
10. Stripe processes payment, performs 3D Secure if required
11. Payment succeeds or fails, Stripe sends webhook event
12. Webhook handler updates payment status, confirms appointment if payment succeeded

### Webhook Event Processing

Webhook endpoint implementation:

1. Stripe sends POST request to /api/webhooks/stripe with event data
2. Endpoint retrieves Stripe-Signature header from request
3. Endpoint verifies signature using Stripe webhook secret and raw request body
4. If signature invalid, return 401 Unauthorized and log security alert
5. If signature valid, parse event JSON
6. Check stripe_events table for duplicate event_id, ignore if already processed
7. Queue event for asynchronous processing using BullMQ job queue
8. Return 200 OK to Stripe immediately (within 1 second)
9. Background job processes event:
   - payment_intent.succeeded: update payment status to succeeded, confirm appointment, send confirmation email
   - payment_intent.payment_failed: update payment status to failed, send failure notification
   - charge.refunded: update payment status to refunded, send refund confirmation
   - (handle other event types similarly)
10. Mark event as processed in stripe_events table
11. If processing fails, retry job up to 5 times with exponential backoff
12. After all retries exhausted, log error for manual investigation

### Frontend Payment Component

React component for payment collection using Stripe Elements:

PaymentForm component:
- Loads Stripe.js library asynchronously
- Initializes Stripe with publishable key (pk_test or pk_live based on mode)
- Wraps Payment Element in Elements provider with client_secret
- Payment Element renders card input, Apple Pay, Google Pay buttons
- Payment Element handles validation, error display, PCI compliance
- "Save payment method" checkbox controls setup_future_usage parameter
- Submit button calls stripe.confirmPayment method with return_url or callback
- Success callback confirms appointment, shows confirmation screen
- Error callback displays error message, allows retry
- Loading state shows spinner and disables form during processing

Alternative: Stripe Checkout
- Redirect customer to Stripe-hosted checkout page
- Simpler integration but less customization
- Stripe handles entire payment flow, returns to platform with session_id
- Platform retrieves session to confirm payment status

### Refund Implementation

Refund processing flow:

1. Business owner navigates to payment record in admin dashboard
2. Business owner clicks "Issue Refund" button
3. Refund form appears with amount pre-filled (full refund) and reason dropdown
4. Business owner adjusts amount for partial refund if desired, selects reason
5. Business owner clicks "Confirm Refund"
6. Frontend calls backend API: POST /api/payments/:paymentId/refund with {amount, reason}
7. Backend validates refund amount (cannot exceed original payment)
8. Backend retrieves original Payment Intent ID from payment record
9. Backend calls Stripe API to create refund: stripe.refunds.create with payment_intent, amount, reason
10. Stripe processes refund, returns refund object with status
11. Backend creates refund record in database with stripe_refund_id
12. Backend updates payment status to refunded or partially_refunded
13. Backend sends refund confirmation email to customer with receipt
14. Backend returns success response to frontend
15. Frontend shows success message and updates payment UI
16. Stripe sends webhook event charge.refunded (already processed in step 11-12 but used for redundancy)

### Subscription Billing Implementation

Creating subscription for business:

1. Business owner selects plan (Basic/Pro) from billing settings page
2. Frontend redirects to Stripe Billing Portal or shows payment form
3. Business owner enters payment method (card details) via Stripe Checkout or Payment Element
4. Backend receives payment method token from Stripe
5. Backend creates or retrieves Stripe Customer for business
6. Backend attaches payment method to Stripe Customer
7. Backend creates Stripe Subscription with:
   - Customer: business's Stripe Customer ID
   - Items: plan price ID from Stripe product catalog
   - Trial period: 14 days if applicable
   - Payment behavior: error_if_incomplete (require successful payment before activating)
8. Stripe processes first payment (or starts trial)
9. Stripe returns Subscription object with status "active" or "trialing"
10. Backend creates subscription record in database
11. Backend updates business feature access based on plan
12. Backend returns success to frontend, shows "Subscription Active" message
13. On billing anniversary, Stripe automatically charges payment method
14. Stripe sends webhook invoice.payment_succeeded or invoice.payment_failed
15. Webhook handler updates subscription status, sends invoice email to business owner

### Error Handling Strategies

Stripe API errors categorized:

Card errors (decline, insufficient_funds, expired_card):
- User-facing error message extracted from Stripe error
- Allow user to retry with same or different payment method
- Log error for analytics (track decline rates)

Rate limit errors (too many requests):
- Retry automatically after delay specified in Retry-After header
- Implement exponential backoff if multiple rate limits hit
- Log warning for monitoring

API errors (invalid_request_error, authentication_error):
- Do not retry (user cannot fix)
- Log error with full details for debugging
- Show generic error to user "Payment processing error. Please contact support."
- Alert engineering team via error tracking system (Sentry)

Network errors (timeout, connection_refused):
- Retry up to 3 times with exponential backoff (1s, 2s, 4s)
- After retries exhausted, show error to user with retry button
- Use idempotency keys to prevent duplicate charges on retry

Webhook errors (signature verification failure, processing exception):
- Return 401 for signature failure, log security alert
- Return 200 for processing exception but queue retry
- Retry failed webhook processing up to 5 times
- After retries exhausted, create manual task for investigation

### Security Considerations

API key management:
- Store Stripe API keys in environment variables, never commit to code
- Separate test and live keys with clear naming (STRIPE_TEST_SECRET_KEY, STRIPE_LIVE_SECRET_KEY)
- Rotate API keys periodically (quarterly)
- Restrict API key permissions using Stripe restricted keys if needed

Access control:
- Only business owners can connect Stripe account, view API keys, modify payment settings
- Staff can record in-person payments but cannot issue refunds without permission
- API endpoints protected with authentication and tenant isolation

Webhook security:
- Always verify webhook signature before processing
- Use webhook secret unique per endpoint for maximum security
- Reject webhooks with invalid timestamp (older than 5 minutes) to prevent replay attacks

PCI compliance:
- Never log, store, or transmit raw card numbers
- Use Stripe Elements or Checkout for all card input
- Ensure all payment pages served over HTTPS
- Regular security audits and penetration testing

### Testing Strategy

Unit tests:
- Test Stripe API wrapper methods (mock Stripe SDK)
- Test payment status transitions
- Test refund calculation logic
- Test webhook signature verification
- Test error handling and retry logic

Integration tests:
- Test full payment flow using Stripe test mode
- Test webhook event processing end-to-end
- Test subscription creation and cancellation
- Test refund processing
- Test payment method saving and retrieval

End-to-end tests:
- Test customer booking with payment using Stripe test cards
- Test payment failure scenarios (card_declined test card)
- Test 3D Secure authentication flow
- Test in-person payment recording by staff
- Test subscription billing for business plan

Stripe testing resources:
- Use test API keys for all testing
- Use Stripe test card numbers: 4242 4242 4242 4242 (succeeds), 4000 0000 0000 9995 (declines)
- Use Stripe CLI to trigger webhook events locally during development
- Use Stripe Dashboard test mode to view all test transactions

## Test Scenarios

### Unit Tests

Payment Intent Amount Calculation:
- Input: Service price 100 dollars, deposit 50 percent
- Expected Output: Payment Intent amount = 5000 cents (50 dollars)
- Edge Cases: Service price 75 dollars deposit 25 dollars = 2500 cents, service price 100 dollars full payment = 10000 cents

Refund Amount Validation:
- Input: Original payment 10000 cents, refund request 12000 cents
- Expected Output: Validation error "Refund amount cannot exceed original payment"
- Edge Cases: Refund 10000 cents (full refund) = valid, refund 5000 cents (partial) = valid, refund 0 cents = invalid

Webhook Signature Verification:
- Input: Valid webhook payload, correct signature, webhook secret
- Expected Output: Signature verification succeeds, returns true
- Edge Cases: Invalid signature = verification fails, expired timestamp = verification fails, wrong secret = verification fails

Payment Status Transition:
- Input: Payment with status "pending", event "payment_intent.succeeded"
- Expected Output: Payment status updates to "succeeded"
- Edge Cases: Payment already succeeded, duplicate event ignored, failed payment cannot transition to succeeded

### Integration Tests

Complete Payment Flow:
- Input: Customer books appointment with full payment required (service price 100 dollars)
- Expected API Calls:
  1. POST /api/payments/create-intent → returns client_secret
  2. Stripe API: Create Payment Intent with amount 10000 cents
  3. Frontend: stripe.confirmPayment with test card 4242 4242 4242 4242
  4. Webhook: payment_intent.succeeded event received
  5. Payment record updated to succeeded, appointment confirmed
- Expected Output: Payment record with status "succeeded", appointment status "confirmed", confirmation email sent
- Edge Cases: Payment failure with test card 4000 0000 0000 9995 = status "failed", appointment not confirmed

Refund Processing:
- Input: Business owner issues full refund for payment of 100 dollars
- Expected API Calls:
  1. POST /api/payments/:id/refund with {amount: 10000, reason: "Customer request"}
  2. Stripe API: Create refund for Payment Intent
  3. Refund record created with status "succeeded"
  4. Payment record updated to "refunded"
- Expected Output: Refund confirmation email sent, customer receives refund in 5-10 days
- Edge Cases: Partial refund of 50 dollars = payment status "partially_refunded", refund on unsettled payment = error

Webhook Event Processing:
- Input: Stripe sends payment_intent.succeeded webhook event
- Expected Flow:
  1. POST /api/webhooks/stripe with event payload and signature
  2. Signature verified successfully
  3. Event queued for processing
  4. Background job updates payment status
  5. Appointment confirmed, confirmation email sent
  6. Event marked as processed in database
- Expected Output: Payment status "succeeded", no duplicate processing if event received again
- Edge Cases: Invalid signature = 401 response, duplicate event = ignored, processing failure = retried

Saved Payment Method Usage:
- Input: Returning customer with saved payment method books new appointment
- Expected API Calls:
  1. POST /api/payments/create-intent with customer_id
  2. Stripe API: Create Payment Intent with customer and setup_future_usage
  3. Frontend: stripe.confirmPayment with saved payment method ID
  4. Payment succeeds using saved card
- Expected Output: Payment processed without re-entering card details, faster checkout
- Edge Cases: Saved card expired = payment fails, customer uses different card = new payment method saved

Subscription Creation:
- Input: Business owner selects Pro plan (29 dollars/month)
- Expected API Calls:
  1. POST /api/subscriptions with plan "pro"
  2. Stripe Checkout session created or Payment Element shown
  3. Business owner enters card details
  4. Stripe API: Create Customer and Subscription
  5. First payment processed (29 dollars)
  6. Webhook: customer.subscription.created event received
- Expected Output: Subscription record created with status "active", business features upgraded, confirmation email sent
- Edge Cases: Payment failure = subscription status "incomplete", trial period = status "trialing", upgrade from Basic = prorated charge

### End-to-End Tests

Customer Booking with Payment:
- Input: Customer visits booking page, selects service (100 dollars), proceeds to payment
- Steps:
  1. Customer fills client details form
  2. Payment step shows Stripe Payment Element
  3. Customer enters test card 4242 4242 4242 4242
  4. Customer checks "Save payment method" checkbox
  5. Customer clicks "Pay Now"
  6. Payment processing spinner appears
  7. Payment succeeds, confirmation screen shown
  8. Customer receives confirmation email with receipt
  9. Appointment appears in business calendar as confirmed
- Expected Outcome: Appointment booked, payment succeeded, customer and business notified
- Verification: Database shows payment record with status "succeeded", Stripe Dashboard shows charge, appointment confirmed

Payment Failure and Retry:
- Input: Customer attempts payment with test card 4000 0000 0000 9995 (always declines)
- Steps:
  1. Customer enters declining test card details
  2. Customer clicks "Pay Now"
  3. Payment fails with error "Your card was declined"
  4. Error message displayed with option to try different card
  5. Customer enters valid test card 4242 4242 4242 4242
  6. Customer clicks "Pay Now" again
  7. Payment succeeds, confirmation shown
- Expected Outcome: First payment fails gracefully, customer retries successfully, appointment booked
- Verification: Database shows one failed payment and one succeeded payment for same appointment attempt

In-Person Payment Recording:
- Input: Staff member checks in customer for appointment, collects payment in cash
- Steps:
  1. Staff opens appointment detail page from calendar
  2. Staff clicks "Record Payment" button
  3. Payment form shows total due (100 dollars)
  4. Staff selects payment method "Cash"
  5. Staff enters amount received (100 dollars)
  6. Staff clicks "Save Payment"
  7. Payment recorded, appointment marked as paid
  8. Optional: Staff prints receipt for customer
- Expected Outcome: Payment record created with method "cash", appointment status updated, receipt available
- Verification: Database shows payment with status "succeeded" and method "cash", no Stripe transaction

Cancellation with Refund:
- Input: Customer requests cancellation 3 days before appointment (within refund policy window)
- Steps:
  1. Business owner locates appointment in calendar
  2. Business owner clicks "Cancel Appointment"
  3. Cancellation form shows refund options
  4. Business owner selects "Full Refund" per policy
  5. Business owner clicks "Confirm Cancellation"
  6. Appointment cancelled, refund processed automatically
  7. Customer receives cancellation and refund confirmation emails
- Expected Outcome: Appointment cancelled, full refund issued, funds returned to customer card in 5-10 days
- Verification: Appointment status "cancelled", payment status "refunded", Stripe Dashboard shows refund

Subscription Billing Failure:
- Input: Business owner's subscription payment fails (card expired)
- Steps:
  1. Stripe attempts to charge expired card on billing anniversary
  2. Payment fails, Stripe sends invoice.payment_failed webhook
  3. Platform receives webhook, updates subscription status to "past_due"
  4. Platform sends email to business owner alerting of payment failure
  5. Business owner updates payment method from billing settings
  6. Stripe retries payment with new card
  7. Payment succeeds, subscription status returns to "active"
- Expected Outcome: Business notified of failure, account temporarily restricted, restored after payment update
- Verification: Subscription status transitions past_due → active, invoice marked as paid in Stripe

Deposit and Balance Payment:
- Input: Service requires 50 dollar deposit (100 dollar service), balance due at appointment
- Steps:
  1. Customer books online, pays 50 dollar deposit
  2. Deposit payment succeeds, appointment confirmed
  3. Customer arrives for appointment
  4. Staff checks appointment, sees 50 dollar balance due
  5. Staff collects 50 dollar balance (card, cash, or online)
  6. Staff records payment, appointment marked fully paid
- Expected Outcome: Two payment records (deposit and balance), appointment fully paid after second payment
- Verification: Database shows two payments totaling 100 dollars, payment status "paid", no outstanding balance

Stripe Account Connection:
- Input: New business owner needs to connect Stripe account
- Steps:
  1. Business owner navigates to billing settings
  2. Business owner clicks "Connect Stripe" button
  3. Redirected to Stripe Connect OAuth page
  4. Business owner logs in to existing Stripe account or creates new one
  5. Business owner authorizes platform access
  6. Redirected back to platform
  7. Connection confirmed, status shows "Connected"
  8. Business owner can now accept payments
- Expected Outcome: Stripe account connected, access token stored, business ready for payments
- Verification: Database shows stripe_accounts record with status "connected", test payment succeeds

3D Secure Authentication:
- Input: Customer uses test card requiring 3D Secure (4000 0027 6000 3184)
- Steps:
  1. Customer enters card details for 3DS required card
  2. Customer clicks "Pay Now"
  3. Stripe redirects to 3D Secure authentication page
  4. Customer completes authentication (test always succeeds)
  5. Returns to platform
  6. Payment confirmed, appointment booked
- Expected Outcome: 3D Secure flow handled seamlessly, payment succeeds, customer authenticated
- Verification: Payment record shows successful 3DS authentication, Stripe logs show authentication event

## Caveats and Risks

### Technical Risks

Stripe API Downtime:
- Risk: Stripe service outage prevents payment processing, blocking bookings
- Mitigation: Display clear message to customers about payment issues, allow booking without payment with "pay later" option, monitor Stripe status page
- Fallback: Implement queue for failed payments, retry automatically when Stripe recovers, allow manual payment entry

Webhook Delivery Failures:
- Risk: Webhooks may not be delivered due to network issues or platform downtime, causing payment status desynchronization
- Mitigation: Implement webhook retry logic, poll Payment Intent status as backup, log all webhook delivery failures
- Fallback: Manual reconciliation process to identify missing webhooks, background job to check payment statuses periodically

Payment Intent Timeout:
- Risk: Customer abandons payment after starting, leaving orphaned Payment Intents
- Mitigation: Automatically cancel Payment Intents after 15-minute timeout, clean up stale Intents with scheduled job
- Impact: May incur small fees for abandoned Intents, need monitoring

Token Refresh Failures:
- Risk: OAuth access tokens expire or are revoked, breaking payment processing for business
- Mitigation: Implement token refresh logic using refresh tokens, detect authentication errors and prompt re-connection
- Fallback: Email business owner if connection broken, require manual re-authentication

Idempotency Key Collisions:
- Risk: Reusing idempotency keys incorrectly may prevent retries or cause unexpected behavior
- Mitigation: Generate unique idempotency keys per operation (UUID + operation type), never reuse keys across different requests
- Impact: Rare, but can prevent successful retry if keys not unique

### Business Risks

Payment Processing Fees:
- Risk: Stripe transaction fees (2.9 percent + 0.30 cents per transaction) reduce business revenue
- Mitigation: Clearly communicate fees during business onboarding, allow businesses to pass fees to customers (surcharging where legal)
- Impact: May make platform less attractive if fees too high, need competitive pricing

Refund Abuse:
- Risk: Customers may abuse refund policies by booking and cancelling repeatedly
- Mitigation: Implement refund policy enforcement (no refunds within 24 hours), track refund frequency per customer, flag suspicious patterns
- Fallback: Allow businesses to restrict bookings from problem customers, charge cancellation fees

Chargebacks and Disputes:
- Risk: Customers may dispute charges with bank (chargebacks), causing revenue loss and fees
- Mitigation: Collect detailed appointment notes, send clear receipts and confirmations, respond to disputes with evidence
- Impact: Chargebacks incur fees (15 dollars per chargeback) and can lead to Stripe account restrictions if excessive

PCI Compliance Violations:
- Risk: Improper handling of card data may violate PCI DSS, causing fines and security breaches
- Mitigation: Never store raw card data, use Stripe Elements exclusively, regular security audits, staff training
- Consequence: Serious regulatory and legal consequences, platform shutdown risk

Multi-Currency Complexity:
- Risk: Businesses operating internationally may require multi-currency support, adding complexity
- Mitigation: Phase 1 supports single currency per business, document multi-currency as future enhancement
- Limitation: May limit international business adoption

Subscription Billing Edge Cases:
- Risk: Proration, upgrades, downgrades, and cancellations create complex scenarios
- Mitigation: Leverage Stripe Billing to handle proration automatically, test all subscription lifecycle scenarios
- Fallback: Provide manual adjustment capabilities for edge cases, customer support for billing questions

### Regulatory Risks

GDPR and Payment Data:
- Risk: Payment data includes personal information subject to GDPR
- Mitigation: Store minimal payment data (only Stripe IDs and metadata), implement data retention policies, support data deletion requests
- Compliance: Stripe is GDPR-compliant, platform inherits compliance by using Stripe

Sales Tax Collection:
- Risk: Platform may be required to collect sales tax on subscription fees depending on jurisdiction
- Mitigation: Integrate Stripe Tax for automatic tax calculation and collection, consult with tax professionals
- Fallback: Manual tax reporting, geofencing to supported regions only

AML and Fraud Prevention:
- Risk: Platform may be used for money laundering or fraudulent transactions
- Mitigation: Leverage Stripe Radar for fraud detection, implement transaction monitoring, report suspicious activity
- Compliance: Stripe handles most AML compliance as payment processor, platform should monitor for abuse

## Estimated Effort

Large - 4 to 5 weeks for 1 backend developer and 1 frontend developer

Breakdown by feature:
- Stripe account connection (OAuth flow): 3-4 days (backend + frontend)
- Payment Intent creation and processing: 4-5 days (backend + frontend)
- Stripe Payment Element integration: 3-4 days (frontend)
- Payment configuration (admin settings): 2-3 days (backend + frontend)
- Saved payment methods: 3-4 days (backend + frontend)
- In-person payment recording: 2-3 days (backend + frontend)
- Refund processing: 3-4 days (backend + frontend)
- Payment status tracking and UI: 2-3 days (frontend)
- Webhook event handling: 5-6 days (backend, complex)
- Subscription billing for businesses: 5-6 days (backend + frontend)
- Receipt and invoice generation: 3-4 days (backend)
- Error handling and retry logic: 2-3 days (backend)
- PCI compliance and security review: 2-3 days (backend + frontend)
- Testing (unit, integration, E2E): 5-6 days (both)
- Bug fixes and edge cases: 3-4 days (both)

Total: 48-60 days, approximately 4-5 weeks with 2 developers working in parallel

## Owner Role

Full-Stack Developer with Payment Integration experience

Required skills:
- Strong backend development skills (Node.js, TypeScript, NestJS)
- Experience with Stripe API and Stripe Elements/Checkout
- Understanding of payment processing concepts (Payment Intents, webhooks, refunds, subscriptions)
- Knowledge of PCI DSS compliance requirements
- Experience with OAuth 2.0 flows (for Stripe Connect)
- Strong security mindset (encryption, secure token storage, vulnerability prevention)
- Experience with webhook processing and async job queues
- Frontend skills for integrating Stripe Elements (React, TypeScript)
- Database design skills for payment records and transactions
- Understanding of financial concepts (refunds, proration, chargebacks)
- Testing experience including integration testing with external APIs

Nice to have:
- Experience building multi-tenant payment systems or marketplaces
- Familiarity with Stripe Connect and platform/marketplace models
- Experience with payment reconciliation and financial reporting
- Understanding of international payment regulations (GDPR, PSD2)
- Knowledge of fraud prevention and detection techniques
- Experience with subscription billing and recurring payment models
- Familiarity with accounting integrations (QuickBooks, Xero)
