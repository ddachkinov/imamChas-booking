# calendar-sync-integration.md

## Task Title

Integrate External Calendar Synchronization

## Task Description

Implement bidirectional calendar synchronization with external calendar providers (Google Calendar, Microsoft Outlook, Apple iCloud) to keep appointments synchronized across systems. This integration allows staff members to connect their personal calendars and automatically sync appointments both ways: appointments created in the booking platform appear in their external calendar, and busy times from their external calendar block availability in the booking platform. The integration must handle OAuth authentication, respect privacy by only syncing relevant appointment data, manage conflict resolution when appointments are modified in multiple places, and provide reliable sync with error recovery mechanisms.

Calendar synchronization is essential for staff who manage their schedule across multiple systems and prevents double-booking by reflecting their complete availability. The system must handle the complexity of recurring events, timezone conversions, and varying calendar provider APIs while maintaining data consistency.

## Acceptance Criteria

### Calendar Provider Connection

- Staff members can connect external calendar from their profile settings page
- Supported providers: Google Calendar, Microsoft Outlook (Office 365, Outlook.com), Apple iCloud Calendar
- Connection flow uses OAuth 2.0 authorization with appropriate scopes for calendar read/write access
- OAuth flow opens provider authorization page in popup window or redirect
- After authorization, platform receives authorization code and exchanges for access token and refresh token
- Platform stores encrypted access token, refresh token, provider type, connected calendar ID, and user email for each connection
- Connection status displayed in settings: Connected (green badge with last sync time), Disconnected, Error (red with reconnect option)
- Staff can disconnect calendar with confirmation dialog warning about stopping sync
- Multiple calendar connections allowed per staff member (e.g., work and personal Google calendars)
- Primary calendar designation: staff can mark one calendar as primary for creating new appointments

### OAuth Scope and Permissions

- Google Calendar OAuth scopes: calendar.events (read/write access to events), calendar.readonly (read-only access to calendars list)
- Microsoft OAuth scopes: Calendars.ReadWrite (read/write access to calendars), offline_access (refresh token)
- Apple iCloud uses CalDAV protocol with app-specific password (different from OAuth, documented separately)
- Platform requests minimal necessary scopes to respect user privacy
- OAuth consent screen clearly explains what data will be accessed and why
- Users can revoke access from provider settings, platform detects revocation and shows disconnected status
- Token refresh implemented to maintain long-term access (refresh tokens before expiry)

### Appointment Export to External Calendar

- When appointment created or updated in booking platform, event automatically created or updated in connected external calendar
- External calendar event includes: appointment title (client name or "Blocked" for privacy), start time, end time, location (business address), description (service name, notes), attendees (client email if provided)
- Event title customizable by staff for privacy: options include "Full Details" (client name + service), "Service Only" (service name), "Busy" (no details)
- Event color/category set to distinguish booking platform appointments from other events (uses calendar provider color API)
- Event includes unique identifier in description or custom field linking back to booking platform appointment
- Cancelled appointments in booking platform delete corresponding events in external calendar
- Rescheduled appointments update event time in external calendar
- Status changes (completed, no-show) optionally update event description or delete event after completion
- Export queue ensures reliable delivery: failed exports retried with exponential backoff (1min, 5min, 15min, 1hr)
- Sync status indicator per appointment: Synced (checkmark), Syncing (spinner), Sync Failed (warning icon with retry button)

### Availability Import from External Calendar

- Platform periodically fetches busy times from connected external calendars to block availability
- Fetch frequency: every 15 minutes by default, configurable (5min, 15min, 30min, 1hr)
- Busy times from external calendar prevent appointments from being booked during those periods
- Platform queries external calendar for events within rolling window (today + next 90 days)
- Only free/busy information imported, not event details (respects privacy unless staff opts in to full import)
- Imported busy times appear in booking platform calendar as gray blocked time labeled "External Calendar - Busy"
- Staff can configure which calendars block availability (e.g., import from work calendar but not personal)
- All-day events in external calendar optionally block entire day in booking platform
- Recurring events in external calendar expanded and imported as individual blocked times
- Deleted events in external calendar remove corresponding blocked times in booking platform
- Import errors logged and staff notified if calendar sync fails (email alert after 3 consecutive failures)

### Bidirectional Sync and Conflict Resolution

- Changes made in either system (booking platform or external calendar) propagate to the other
- Platform detects conflicts when appointment modified in both places simultaneously
- Conflict resolution strategy: Last Write Wins (most recent change takes precedence) with notification to staff
- Conflict notification shows both versions and allows staff to manually reconcile if automatic resolution incorrect
- Sync log accessible from settings shows recent sync activity: events created, updated, deleted, conflicts resolved
- Sync timestamps stored for each appointment to determine modification order
- Idempotency ensures same event not created multiple times if sync runs repeatedly
- Platform tracks sync status per appointment: Never Synced, Sync Pending, Synced, Sync Error, Conflict
- Manual sync button allows forcing immediate synchronization without waiting for scheduled sync

### Recurring Event Handling

- Recurring appointments in booking platform export as recurring events to external calendar using iCalendar RRULE format
- Recurring events from external calendar imported as series of individual blocked times (expansion required due to booking complexity)
- Modifications to single instance of recurring series handled correctly: exception dates in RRULE
- Deleting single occurrence of recurring appointment removes only that instance from external calendar
- Bulk rescheduling of recurring series updates all future instances in external calendar
- Platform supports common recurrence patterns: daily, weekly, biweekly, monthly, yearly, with end date or occurrence count
- Complex recurrence patterns (e.g., every second Tuesday) handled correctly via RRULE parsing
- Timezone handling for recurring events: events created in correct timezone with DST awareness

### Timezone Conversion

- All times converted correctly between booking platform timezone and external calendar timezone
- Platform stores times in UTC internally, converts to external calendar timezone for export
- External calendar events created with timezone information (TZID in iCalendar format)
- Staff member's preferred timezone from external calendar respected
- Daylight saving time transitions handled correctly: events don't shift by 1 hour during DST change
- Multi-timezone support: staff traveling or relocating sees appointments adjust to new timezone
- Timezone conversion errors logged and debugged with detailed timezone information

### Privacy and Data Filtering

- Staff can configure privacy level for exported events: Full Details, Service Only, Busy Block
- Sensitive client information (phone, email, notes) never exported unless staff explicitly enables
- HIPAA or confidential services flagged and exported as generic "Appointment" regardless of setting
- Staff can exclude certain appointment types from sync (e.g., internal meetings, blocked time)
- Calendar sync settings include granular controls: sync all appointments, sync confirmed only, sync specific services
- Client consent: optional setting requires client consent before adding their email as attendee in external calendar event
- Data minimization: only necessary fields exported to external calendar, bulk data not transferred

### Error Handling and Retry Logic

- Transient errors (network timeout, rate limit) retried automatically with exponential backoff
- Permanent errors (token revoked, calendar deleted, permission denied) stop retry and notify staff
- Error notification email sent after 3 consecutive sync failures with troubleshooting steps
- Staff can view error details in sync log: error message, timestamp, affected appointment
- Retry button in UI allows manual retry of failed sync for specific appointment
- Token refresh failures trigger re-authentication flow: staff receives email to reconnect calendar
- Rate limit handling: platform backs off when hitting provider API rate limits, queues requests
- Webhook or push notification support (Google Calendar push notifications) reduces polling frequency and improves real-time sync

### Calendar Selection and Filtering

- If staff has multiple calendars in external account, platform allows selecting which calendar to sync
- Calendar picker shown during connection: dropdown of available calendars from account
- Staff can change selected calendar after connection without reconnecting entire account
- Support for calendar groups or shared calendars (e.g., team calendar in Microsoft 365)
- Read-only calendars detected and marked: appointments not exported to read-only calendars
- Calendar color syncing: optionally import calendar color from external calendar to colorize appointments in booking platform

### Sync Performance and Scalability

- Initial sync after connection processes efficiently: batch fetching of existing events
- Initial sync shows progress indicator: "Syncing 45 of 120 events..."
- Incremental sync only fetches changed events since last sync using provider sync tokens or change tracking
- Batch API operations used where supported (Google Calendar batch requests, Microsoft Graph batching)
- Sync operations run asynchronously via background job queue, don't block UI
- Database indexes on sync status and timestamp fields for efficient querying
- Sync concurrency limited to prevent API rate limit exhaustion: max 5 concurrent sync jobs per provider
- Large calendar sync (100+ events) split into chunks to prevent timeout

### Calendar Provider Specific Features

Google Calendar:
- Support for multiple calendars per account
- Primary calendar detection and default selection
- Event color selection (11 predefined colors)
- Attendee management (add client as attendee if consented)
- Event reminders inherited from calendar defaults or set explicitly (15min before)
- Push notification support via webhook for real-time updates (reduces polling)

Microsoft Outlook:
- Support for Office 365 and Outlook.com accounts
- Outlook category assignment for booking platform events
- Meeting/appointment distinction (appointments don't require attendees)
- Room resource booking if location has associated room
- Outlook mobile app deep linking for event details
- Microsoft Graph API batch operations for efficiency

Apple iCloud:
- CalDAV protocol support with app-specific password
- iCloud calendar sharing and family calendar support
- Color-coding via calendar selection
- macOS Calendar and iOS Calendar app compatibility
- Push notification via CalDAV PUSH extension if supported

### Calendar Disconnection and Cleanup

- When staff disconnects calendar, option to clean up: Keep Events (events remain in external calendar), Delete Events (all synced events deleted)
- Delete option removes only events created by booking platform (identified by unique marker)
- Disconnection logged in sync history with timestamp and reason (user action, token revoked, error)
- Blocked times from disconnected calendar removed from booking platform after grace period (24 hours)
- Reconnecting same calendar resumes sync, deduplicates events based on unique identifiers
- Staff can temporarily pause sync without disconnecting: useful during vacation or calendar maintenance

## Implementation Details

### Technology Stack

- Backend: Node.js with NestJS for API endpoints and background jobs
- Google Calendar API: googleapis npm package
- Microsoft Graph API: @microsoft/microsoft-graph-client npm package
- Apple iCloud: caldav-adapter npm package or custom CalDAV implementation
- OAuth 2.0: passport-google-oauth20, passport-microsoft for authentication
- iCalendar parsing: ical.js or node-ical for RRULE and VEVENT parsing
- Background jobs: BullMQ for sync queue management
- Database: PostgreSQL with tables for calendar_connections, sync_logs, external_events

### Database Schema

calendar_connections table:
- id (uuid, primary key)
- user_id (uuid, foreign key to users/staff)
- provider (enum: google, microsoft, apple)
- provider_account_id (string, external user ID)
- provider_calendar_id (string, external calendar ID)
- calendar_name (string, display name)
- access_token (text, encrypted)
- refresh_token (text, encrypted)
- token_expires_at (timestamp)
- scopes (text array, granted OAuth scopes)
- status (enum: connected, disconnected, error)
- privacy_level (enum: full_details, service_only, busy)
- sync_direction (enum: export_only, import_only, bidirectional)
- last_sync_at (timestamp)
- last_sync_token (string, incremental sync cursor)
- settings (jsonb, provider-specific settings)
- created_at, updated_at

external_events table:
- id (uuid, primary key)
- calendar_connection_id (uuid, foreign key)
- external_event_id (string, provider event ID)
- event_type (enum: appointment_export, busy_import, recurring_instance)
- appointment_id (uuid, foreign key to appointments, nullable)
- blocked_time_id (uuid, foreign key to blocked_times, nullable)
- start_time (timestamp with timezone)
- end_time (timestamp with timezone)
- is_all_day (boolean)
- recurrence_rule (text, RRULE if recurring)
- sync_status (enum: pending, synced, error)
- last_synced_at (timestamp)
- error_message (text, nullable)
- created_at, updated_at

sync_logs table:
- id (uuid, primary key)
- calendar_connection_id (uuid, foreign key)
- sync_type (enum: export, import, bidirectional)
- status (enum: success, partial, failure)
- events_created (integer)
- events_updated (integer)
- events_deleted (integer)
- errors_count (integer)
- started_at (timestamp)
- completed_at (timestamp)
- error_details (jsonb, array of error objects)

### Service Architecture

CalendarSyncModule:
- CalendarConnectionsController: API endpoints for connecting/disconnecting calendars
- CalendarSyncController: Manual sync triggers and sync status endpoints
- GoogleCalendarService: Google Calendar API wrapper
- MicrosoftCalendarService: Microsoft Graph API wrapper
- AppleCalendarService: CalDAV protocol implementation
- CalendarSyncService: Orchestrates sync operations across providers
- EventExportService: Exports booking platform appointments to external calendars
- EventImportService: Imports busy times from external calendars
- ConflictResolutionService: Handles sync conflicts
- OAuthService: OAuth flow management and token refresh
- SyncScheduler: Scheduled jobs for periodic sync
- WebhookHandler: Processes push notifications from calendar providers

### OAuth Implementation Flow

Google Calendar OAuth:
1. User clicks "Connect Google Calendar" button
2. Backend generates OAuth authorization URL with client_id, redirect_uri, scope, state (CSRF token)
3. Frontend redirects to Google authorization URL
4. User grants permission, Google redirects to callback URL with authorization code
5. Backend endpoint receives code, exchanges for access token and refresh token via POST to Google token endpoint
6. Backend stores encrypted tokens in calendar_connections table
7. Backend fetches user's calendar list to show calendar picker
8. User selects calendar, connection marked as active
9. Initial sync job queued to import existing events

Microsoft OAuth:
- Similar flow using Microsoft identity platform
- Authorize endpoint: login.microsoftonline.com/common/oauth2/v2.0/authorize
- Token endpoint: login.microsoftonline.com/common/oauth2/v2.0/token
- Scopes: Calendars.ReadWrite, offline_access

Apple iCloud CalDAV:
- User provides Apple ID and app-specific password (generated from Apple ID settings)
- Backend connects to CalDAV server: caldav.icloud.com
- Discovers calendar collections via CalDAV PROPFIND request
- Stores calendar URL and credentials encrypted
- No OAuth, uses HTTP Basic Auth with app-specific password

### Token Refresh Strategy

- Access tokens have limited lifespan (1 hour for Google/Microsoft)
- Refresh token used to obtain new access token before expiry
- Token refresh attempted automatically before each API call if token expires within 10 minutes
- Refresh token API call: POST to provider token endpoint with grant_type=refresh_token, refresh_token, client_id, client_secret
- New access token and potentially new refresh token returned
- Database updated with new tokens and expiry time
- If refresh fails (token revoked, invalid), connection marked as error status, user notified to reconnect
- Refresh operations logged for debugging token issues

### Export Implementation

Appointment created/updated workflow:
1. Appointment saved in booking platform database
2. After-save hook or event listener triggers export job
3. Export job queued in BullMQ with appointment ID and calendar connection IDs (for staff assigned)
4. Background worker processes export job:
   a. Fetch appointment details from database
   b. Fetch calendar connections for staff member(s)
   c. Format event data according to privacy settings
   d. Call provider API to create/update event
   e. Store external event ID and mapping in external_events table
   f. Update sync status to "synced"
5. If API call fails, job retried with exponential backoff
6. After max retries, mark as error and log failure

Event formatting:
- Title: Based on privacy level setting
- Start/End: Convert UTC to staff timezone
- Location: Business address or location name
- Description: Service name, client notes (if full details), link to appointment in booking platform
- Attendees: Client email (if consented and full details)
- Reminders: Default 15 minutes before
- Color: Provider-specific color code for booking appointments

### Import Implementation

Scheduled import workflow:
1. Cron job runs every 15 minutes (configurable)
2. Job fetches all active calendar connections
3. For each connection:
   a. Check last sync time and sync token
   b. Call provider API to fetch changed events since last sync
   c. Filter for busy times in next 90 days
   d. Parse event start/end times
   e. Create or update blocked_time records in booking platform
   f. Mark imported events in external_events table
   g. Update last_sync_at and sync_token
4. Remove blocked times for events deleted in external calendar
5. Log import results in sync_logs

Google Calendar incremental sync:
- Use sync tokens for efficient delta queries
- Initial sync: GET /calendars/{calendarId}/events with singleEvents=true, maxResults=2500
- Response includes syncToken for next request
- Incremental sync: GET /calendars/{calendarId}/events with syncToken parameter
- Returns only added, updated, deleted events since last sync

Microsoft incremental sync:
- Use delta queries in Microsoft Graph
- Initial sync: GET /me/calendars/{id}/events with $top=100 pagination
- Response includes @odata.deltaLink for next request
- Incremental sync: GET delta link URL
- Returns only changed events

### Conflict Resolution Logic

Conflict detection:
- Appointment updated in booking platform after last sync (updated_at > last_synced_at)
- External event updated in calendar (detected via incremental sync)
- Both timestamps recent (within 5 minutes)

Resolution strategy:
- Compare modification timestamps from both systems
- Most recent change wins (Last Write Wins)
- Apply winning change to losing system
- Create sync_log entry with conflict flag and details
- Notify staff via in-app notification and email
- Notification includes: appointment details, conflicting changes, resolution taken
- Staff can manually override resolution from sync log

Example conflict:
- Appointment rescheduled in booking platform: 2 PM → 3 PM
- Same appointment moved in Google Calendar: 2 PM → 4 PM
- Both changes within 5 minutes
- Booking platform updated_at: 10:05 AM, Google event updated: 10:03 AM
- Resolution: Booking platform change (3 PM) wins
- Google event updated to 3 PM
- Staff notified of conflict and resolution

### Recurring Event Handling

Export recurring appointments:
- Booking platform recurring appointment has recurrence rule (daily, weekly, etc.)
- Generate iCalendar RRULE string: "FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=10"
- Create recurring event in external calendar with RRULE
- Single API call creates entire series
- Modifications to single instance: create exception with EXDATE or modified instance

Import recurring events:
- External calendar recurring event has RRULE
- Parse RRULE and expand into individual occurrences using ical.js
- Create individual blocked_time record for each occurrence in next 90 days
- Link occurrences to parent recurring event via external_event_id
- Re-expand periodically (weekly) to catch new occurrences beyond initial window
- Handle EXDATE (exception dates) by not creating blocked time for those dates

### Error Handling Patterns

Network errors (timeout, connection refused):
- Retry up to 5 times with exponential backoff: 1min, 2min, 5min, 15min, 1hr
- Log each retry attempt
- After max retries, mark as permanent error and notify staff

Authentication errors (401, token expired):
- Attempt token refresh using refresh token
- If refresh succeeds, retry original request
- If refresh fails, mark connection as error and notify staff to reconnect
- Don't retry with invalid token (prevents account lockout)

Rate limit errors (429 Too Many Requests):
- Extract Retry-After header from response
- Delay retry by specified duration (typically 1-60 seconds)
- Implement request queuing with rate limiting
- Monitor rate limit usage and throttle requests proactively

Permission errors (403 Forbidden):
- Check if user revoked permissions
- Mark connection as disconnected
- Notify staff to reconnect with proper permissions
- Log detailed error for debugging

Not found errors (404):
- Calendar or event deleted externally
- Remove connection or event mapping from database
- Log deletion for audit trail
- Don't retry

Validation errors (400 Bad Request):
- Log full error response for debugging
- Don't retry (request is malformed)
- Alert engineering team via error tracking
- May indicate API changes or bugs

### Provider-Specific Implementations

Google Calendar API calls:
- List calendars: GET /users/me/calendarList
- Create event: POST /calendars/{calendarId}/events with JSON body
- Update event: PUT /calendars/{calendarId}/events/{eventId}
- Delete event: DELETE /calendars/{calendarId}/events/{eventId}
- List events: GET /calendars/{calendarId}/events with time filters
- Batch requests: POST /batch with multipart body (up to 50 requests)

Microsoft Graph API calls:
- List calendars: GET /me/calendars
- Create event: POST /me/calendars/{calendarId}/events with JSON body
- Update event: PATCH /me/events/{eventId}
- Delete event: DELETE /me/events/{eventId}
- List events: GET /me/calendars/{calendarId}/events with $filter
- Batch requests: POST /$batch with JSON array of requests (up to 20 requests)

Apple iCloud CalDAV:
- Discover calendars: PROPFIND to caldav.icloud.com/[dsnumber]/calendars/
- Create event: PUT to calendar URL/[event-uid].ics with iCalendar data
- Update event: PUT to same URL with modified iCalendar data
- Delete event: DELETE to event URL
- List events: REPORT method with calendar-query and time-range filter
- No batch operations, sequential requests required

### Webhook and Push Notifications

Google Calendar push notifications:
- Register webhook via POST to /calendars/{calendarId}/events/watch
- Provide notification endpoint URL and expiration (max 1 week)
- Receive notifications at webhook endpoint when events change
- Verify notification signature using channel token
- Process notification by triggering incremental sync
- Renew webhook registration before expiration

Microsoft Graph webhooks:
- Create subscription via POST to /subscriptions
- Provide notification URL, resource (calendar), expiration (max 3 days)
- Validate notification endpoint ownership via validation token
- Receive notifications for event changes
- Renew subscription before expiration via PATCH

Benefits of webhooks:
- Near real-time sync (seconds instead of minutes)
- Reduced API polling, lower rate limit usage
- Better user experience with faster updates
- Lower server load from reduced periodic jobs

## Test Scenarios

### Unit Tests

OAuth Token Refresh:
- Input: Expired access token, valid refresh token
- Expected Output: New access token obtained, database updated with new token and expiry
- Edge Cases: Refresh token expired returns error, refresh token revoked marks connection as error

iCalendar RRULE Parsing:
- Input: RRULE string "FREQ=WEEKLY;BYDAY=MO,WE;COUNT=8"
- Expected Output: Array of 8 dates: next 8 Mondays and Wednesdays
- Edge Cases: Monthly recurrence on 31st (not all months have 31 days), yearly on Feb 29 (leap year handling)

Timezone Conversion:
- Input: Appointment at 2025-11-06T14:00:00Z (UTC), staff timezone "America/New_York"
- Expected Output: Event created in Google Calendar at 9:00 AM EST
- Edge Cases: DST transition dates, timezone abbreviation conflicts, UTC offset changes

Event Privacy Formatting:
- Input: Appointment with client "John Smith", service "Consultation", privacy level "Service Only"
- Expected Output: Event title "Consultation", description contains service but not client name
- Edge Cases: Privacy level "Busy" shows only "Busy", "Full Details" shows client name and service

Conflict Resolution Last Write Wins:
- Input: Booking platform updated_at 10:05:00, external event updated 10:03:00
- Expected Output: Booking platform version wins, external event updated to match
- Edge Cases: Same second timestamp uses tiebreaker (booking platform wins), very old changes ignored (24+ hours)

### Integration Tests

Complete OAuth Connection Flow:
- Input: Staff member initiates Google Calendar connection
- Expected API Calls:
  1. GET OAuth authorization URL with state token
  2. User approves, Google redirects with authorization code
  3. POST to Google token endpoint exchanges code for tokens
  4. GET /users/me/calendarList fetches available calendars
  5. Staff selects primary calendar
  6. Connection saved with encrypted tokens
- Expected Output: Calendar connection active, ready for sync
- Edge Cases: User denies permission shows error, invalid code returns 400, network timeout retries

Appointment Export to Google Calendar:
- Input: New appointment created in booking platform for staff with connected Google Calendar
- Expected API Calls:
  1. Export job queued
  2. Fetch appointment and calendar connection from database
  3. POST /calendars/{id}/events creates event in Google Calendar
  4. external_events record created with Google event ID
- Expected Output: Event appears in Google Calendar within 1 minute, sync status "synced"
- Edge Cases: API failure retries with backoff, duplicate export prevented by idempotency, privacy settings applied correctly

Busy Time Import from Outlook:
- Input: Staff has meeting in Outlook calendar from 2 PM to 3 PM
- Expected API Calls:
  1. Scheduled import job runs every 15 minutes
  2. GET /me/calendars/{id}/events with delta query
  3. Parse events and filter for busy times
  4. Create blocked_time record in booking platform
- Expected Output: 2-3 PM blocked in booking platform calendar, appointments cannot be booked during this time
- Edge Cases: All-day event blocks entire day, deleted Outlook event removes block, overlapping events merge into single block

Bidirectional Sync Conflict:
- Input: Appointment rescheduled in booking platform (2 PM → 3 PM) and in Google Calendar (2 PM → 4 PM) within 5 minutes
- Expected Flow:
  1. Export job attempts to update Google event to 3 PM
  2. Import job detects Google event at 4 PM
  3. Conflict detected (both updated recently)
  4. Last Write Wins: compare timestamps
  5. Booking platform change newer, wins
  6. Google event updated to 3 PM
  7. Conflict logged and staff notified
- Expected Output: Both systems show 3 PM, staff receives conflict notification
- Edge Cases: Exact same time change no conflict, very old change (hours apart) no conflict, network during conflict retries

Token Refresh Before API Call:
- Input: Access token expires in 5 minutes, sync job about to run
- Expected API Calls:
  1. Check token expiry before API call
  2. POST to token endpoint with refresh_token
  3. Receive new access token
  4. Update database with new token
  5. Proceed with original API call using new token
- Expected Output: Sync succeeds without interruption, no authentication errors
- Edge Cases: Refresh fails marks connection error, refresh during API call handles race condition

Recurring Event Export:
- Input: Weekly recurring appointment every Monday for 8 weeks in booking platform
- Expected API Call: POST /calendars/{id}/events with RRULE "FREQ=WEEKLY;BYDAY=MO;COUNT=8"
- Expected Output: Single recurring event created in Google Calendar with 8 occurrences
- Edge Cases: Modifying single instance creates exception, deleting single instance adds EXDATE, timezone preserved in RRULE

Webhook Push Notification:
- Input: Google Calendar sends webhook notification of event change
- Expected Flow:
  1. POST to /api/webhooks/google-calendar with notification payload
  2. Verify notification signature using channel token
  3. Trigger incremental sync for affected calendar
  4. Fetch changed events using sync token
  5. Update booking platform blocked times
- Expected Output: Changes reflected in booking platform within seconds
- Edge Cases: Invalid signature rejected, duplicate notification ignored, webhook renewal before expiry

### End-to-End Tests

Staff Connects Google Calendar and Books Appointment:
- Input: New staff member with existing Google Calendar schedule
- Steps:
  1. Staff navigates to profile settings, clicks "Connect Google Calendar"
  2. Redirected to Google, grants permission to booking platform
  3. Returns to platform, selects primary calendar from list
  4. Initial sync imports existing meetings as blocked times (10 meetings)
  5. Staff views booking platform calendar, sees gray blocks for imported meetings
  6. Receptionist books appointment for staff at 2 PM slot (available in both systems)
  7. Appointment appears in Google Calendar within 30 seconds
  8. Client name and service shown based on staff's privacy setting
- Expected Outcome: Staff availability accurate, bookings sync to Google Calendar, no double-booking
- Verification: Google Calendar shows booking platform event, booking platform shows imported blocks, databases synced

Appointment Rescheduled in Both Systems:
- Input: Appointment at 2 PM, staff wants to move to 3 PM but client requests 4 PM
- Steps:
  1. Staff drags appointment to 3 PM in booking platform
  2. Export updates Google Calendar event to 3 PM
  3. Client emails requesting 4 PM, staff moves in Google Calendar to 4 PM
  4. Import detects change, conflict with recent booking platform change
  5. Conflict resolution applies Last Write Wins (Google change newer)
  6. Booking platform updated to 4 PM
  7. Staff sees conflict notification explaining resolution
  8. Staff confirms 4 PM time with client
- Expected Outcome: Both systems show 4 PM, staff aware of conflict, appointment time correct
- Verification: Sync logs show conflict, notification sent, final time 4 PM in both systems

Recurring Weekly Appointment Syncs:
- Input: Client books weekly massage every Thursday for 8 weeks
- Steps:
  1. Receptionist creates recurring appointment in booking platform
  2. Export creates recurring event in staff's Outlook calendar with RRULE
  3. Staff views Outlook, sees 8 Thursday appointments series
  4. After 3 weeks, client cancels 4th week only
  5. Receptionist cancels single instance in booking platform
  6. Export updates Outlook event with EXDATE for 4th week
  7. Staff views Outlook, 4th occurrence removed, others remain
- Expected Outcome: Recurring series synced correctly, exception handled properly
- Verification: Outlook shows 7 occurrences (8 minus 1 cancelled), booking platform matches

Staff Disconnects Calendar:
- Input: Staff leaving company, disconnecting calendar
- Steps:
  1. Staff navigates to settings, clicks "Disconnect Google Calendar"
  2. Dialog asks "Keep events in Google Calendar or delete?"
  3. Staff selects "Delete synced events"
  4. Platform deletes all events created by booking platform (identified by marker)
  5. Connection removed from database
  6. Blocked times from Google Calendar removed from booking platform
  7. Future bookings no longer sync to Google Calendar
- Expected Outcome: Clean disconnection, synced events cleaned up, no orphaned data
- Verification: Google Calendar events deleted, calendar_connections record deleted, no blocked times remain

Token Expired and Auto-Refresh:
- Input: Staff connected calendar 60 days ago, access token expired
- Steps:
  1. Scheduled sync job attempts to fetch events
  2. Pre-flight check detects token expires in 2 minutes
  3. Token refresh triggered automatically
  4. New access token obtained using refresh token
  5. Database updated with new token and expiry
  6. Original sync proceeds with new token
  7. Events synced successfully
  8. No error notifications sent to staff
- Expected Outcome: Sync succeeds transparently, staff unaware of token refresh, calendar stays connected
- Verification: Sync logs show successful sync, new token in database, no error entries

Multi-Calendar Staff Member:
- Input: Staff member has personal and work Google Calendars
- Steps:
  1. Staff connects first calendar (work calendar) for booking appointments
  2. Staff connects second calendar (personal calendar) for blocking availability only
  3. Staff configures work calendar: bidirectional sync, full details
  4. Staff configures personal calendar: import only, no export
  5. Appointments export to work calendar, appear in Google with details
  6. Personal calendar busy times imported as generic blocks
  7. Staff books vacation in personal calendar
  8. Vacation days blocked in booking platform automatically
  9. Receptionist sees blocked days, doesn't book appointments
- Expected Outcome: Work and personal calendars synced independently, privacy maintained, availability accurate
- Verification: Work calendar has booking events, personal calendar unchanged, blocked times from both calendars

Webhook Real-Time Sync:
- Input: Staff using booking platform and Google Calendar simultaneously
- Steps:
  1. Google Calendar webhook registered and active
  2. Staff creates meeting in Google Calendar at 10 AM
  3. Google sends webhook notification within seconds
  4. Platform receives notification, triggers import
  5. 10 AM slot blocked in booking platform within 5 seconds
  6. Receptionist attempts to book 10 AM slot
  7. Availability check shows slot unavailable (blocked)
  8. Receptionist selects different time
- Expected Outcome: Near real-time sync via webhook, fast updates, accurate availability
- Verification: Webhook logs show notification received, blocked time created within seconds, appointment prevented

Calendar Provider API Outage:
- Input: Google Calendar API experiences outage during scheduled sync
- Steps:
  1. Sync job attempts to fetch events from Google Calendar
  2. API returns 503 Service Unavailable
  3. Job retries after 1 minute (exponential backoff)
  4. API still unavailable, retry after 2 minutes
  5. After 3 retries over 7 minutes, API recovers
  6. Sync succeeds on 4th attempt
  7. Events imported successfully
  8. No error notification sent (transient error resolved)
- Expected Outcome: Sync resilient to temporary outages, automatic recovery, minimal impact
- Verification: Sync logs show retries, eventual success, staff not notified of transient error

## Caveats and Risks

### Technical Risks

Calendar Provider API Changes:
- Risk: Google, Microsoft, or Apple may change APIs without notice, breaking integration
- Mitigation: Use stable API versions with long-term support, monitor provider changelogs, implement version detection
- Fallback: Maintain legacy API support temporarily, notify staff if calendar sync affected by changes

OAuth Token Revocation:
- Risk: Users may revoke access from provider settings, breaking sync silently until detected
- Mitigation: Implement proactive token validation, detect 401 errors immediately, notify staff to reconnect
- Impact: Sync stops until staff reconnects, appointments may not export during downtime

Rate Limiting at Scale:
- Risk: Large deployments with thousands of staff may hit provider rate limits
- Mitigation: Implement request queuing with rate limit awareness, use batch APIs, stagger sync times
- Fallback: Increase sync interval during high load, prioritize critical sync operations

Recurring Event Complexity:
- Risk: Complex recurrence patterns may not translate correctly between systems
- Mitigation: Support common patterns (daily, weekly, monthly), log unsupported patterns, fallback to individual events
- Limitation: Very complex patterns (e.g., "first Monday of every quarter") may require manual handling

Timezone Edge Cases:
- Risk: DST transitions, timezone changes, historical timezone data may cause time shifts
- Mitigation: Use robust timezone library (date-fns-tz, moment-timezone), test around DST transitions, validate all conversions
- Impact: Incorrect times could lead to missed appointments or double-booking

Data Synchronization Lag:
- Risk: Polling-based import (15-minute intervals) may miss rapid changes
- Mitigation: Implement webhook push notifications for real-time updates where available, allow manual sync
- Limitation: Apple CalDAV lacks push notifications, 15-minute lag acceptable tradeoff

### Business Risks

Privacy and Data Exposure:
- Risk: Exporting client details to personal calendars may violate privacy regulations or client expectations
- Mitigation: Default to privacy-safe export (service only or busy), require explicit staff opt-in for full details
- Compliance: Document privacy controls in terms of service, ensure GDPR compliance

Calendar Access Scope:
- Risk: Broad OAuth scopes may grant excessive access to user's personal calendar data
- Mitigation: Request minimal necessary scopes, clearly explain access in consent screen
- Trust: Users may decline connection if perceived as too invasive, balance features vs. privacy

Conflict Resolution Accuracy:
- Risk: Automated conflict resolution may incorrectly choose wrong version, upsetting client
- Mitigation: Implement conservative Last Write Wins with notification, allow manual override
- Fallback: Provide conflict review UI for staff to correct automated resolutions

Sync Reliability Perception:
- Risk: Occasional sync failures may erode trust in platform reliability
- Mitigation: Monitor sync success rates, alert engineering on patterns, communicate status to users
- Measurement: Track sync success rate (target 99.5%), mean time to resolution for failures

Third-Party Dependency:
- Risk: Platform availability partially dependent on calendar provider uptime
- Mitigation: Implement graceful degradation, cache last known availability, allow manual override
- Communication: Status page showing calendar sync health, provider outage notifications

OAuth Consent Abandonment:
- Risk: Staff may abandon OAuth flow due to complexity or confusion
- Mitigation: Provide clear instructions, show progress through flow, offer help documentation
- Optimization: Streamline flow, minimize clicks, show value proposition before starting

### Scalability Risks

Background Job Queue Growth:
- Risk: Export/import jobs may accumulate faster than processed, causing backlog
- Mitigation: Monitor queue depth, scale workers horizontally, implement job prioritization
- Alert: Notify engineering if queue depth exceeds threshold (1000 jobs)

Database Query Performance:
- Risk: Sync queries on large datasets (100k+ appointments) may slow down
- Mitigation: Implement proper indexes on sync fields, use incremental sync tokens, archive old sync logs
- Monitoring: Track query performance, optimize slow queries, consider partitioning

Concurrent Sync Conflicts:
- Risk: Multiple sync jobs updating same appointment simultaneously may cause race conditions
- Mitigation: Implement optimistic locking on appointment records, use row-level locks for critical sections
- Retry: Detect lock conflicts, retry with backoff

Token Storage Encryption:
- Risk: Storing thousands of encrypted tokens may impact database performance
- Mitigation: Use efficient encryption (AES-256-GCM), index on non-encrypted fields only
- Rotation: Implement key rotation schedule for encryption keys

Webhook Scalability:
- Risk: Webhook endpoint may be overwhelmed by high volume of notifications
- Mitigation: Implement webhook queue, rate limit processing, validate and drop duplicates early
- Monitoring: Track webhook processing latency, alert on delays

## Estimated Effort

Large - 5 to 6 weeks for 2 backend developers

Breakdown by feature:
- OAuth integration for Google, Microsoft, Apple: 6-7 days
- Token refresh and credential management: 2-3 days
- Appointment export implementation: 5-6 days
- Busy time import implementation: 4-5 days
- Bidirectional sync and conflict resolution: 5-6 days
- Recurring event handling: 4-5 days
- Timezone conversion and DST handling: 3-4 days
- Webhook/push notification support: 4-5 days
- Privacy controls and data filtering: 2-3 days
- Error handling and retry logic: 3-4 days
- Background job queue setup: 2-3 days
- Sync logging and monitoring: 2-3 days
- Manual sync and calendar management UI: 3-4 days
- API endpoint implementation: 2-3 days
- Database schema and migrations: 2-3 days
- Testing (unit, integration, E2E): 6-7 days
- Performance optimization: 2-3 days
- Bug fixes and edge cases: 3-4 days

Total: 55-71 days, approximately 5-6 weeks with 2 developers working in parallel

## Owner Role

Backend Developer with Calendar Integration and OAuth expertise

Required skills:
- Strong proficiency in Node.js, TypeScript, and NestJS
- Experience with OAuth 2.0 flows and token management
- Experience with Google Calendar API and Microsoft Graph API
- Understanding of iCalendar format (RFC 5545) and RRULE parsing
- Knowledge of CalDAV protocol (for Apple iCloud integration)
- Experience with background job processing (BullMQ or similar)
- Strong understanding of timezone handling and date manipulation
- Experience with encryption and secure credential storage
- Knowledge of webhook implementation and push notification patterns
- Experience with API rate limiting and throttling strategies
- Database design skills for sync state management
- Testing experience including mocking external APIs
- Strong debugging skills for async distributed systems

Nice to have:
- Experience building calendar applications or scheduling systems
- Familiarity with other calendar providers (Zimbra, Exchange on-premise)
- Understanding of conflict resolution algorithms
- Experience with event sourcing for audit trails
- Knowledge of calendar synchronization protocols (CalDAV, CardDAV, SyncML)
- Experience with multi-tenant systems and data isolation
- Understanding of GDPR and privacy considerations for calendar data
