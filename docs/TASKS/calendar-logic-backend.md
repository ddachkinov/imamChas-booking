# Task: Calendar Logic Backend

## Task Title
Implement Calendar View Generation and Schedule Management

## Description

Build the calendar and scheduling system that generates various calendar views (day, week, month, resource), manages time slots, handles blocked time, and provides real-time schedule updates via WebSocket. The calendar system is a critical user-facing component that must be fast, accurate, and support multiple visualization modes.

The implementation must support:
- Multiple calendar view types (day, week, month, resource/multi-staff)
- Real-time updates when appointments change
- Efficient data aggregation for display
- Blocked time management (breaks, meetings, maintenance)
- Calendar filtering and search
- Timezone-aware rendering
- Export to external calendars (iCal format)
- Conflict visualization
- Resource utilization metrics

This task depends on the authentication system, appointment booking engine, and staff management modules.

## Acceptance Criteria

### Day View

- [ ] Generate day view for single staff member
- [ ] Day view shows time slots from business opening to closing
- [ ] Day view displays all appointments for the day with correct times
- [ ] Day view shows appointment details (client name, service, duration)
- [ ] Day view shows blocked time periods (breaks, time-off)
- [ ] Day view highlights current time indicator (if viewing today)
- [ ] Day view shows available slots vs booked slots
- [ ] Day view supports filtering by staff member
- [ ] Day view loads in < 1 second
- [ ] Day view updates in real-time when appointments created/modified
- [ ] Day view respects user timezone for display

### Week View

- [ ] Generate week view showing Monday through Sunday (or configurable week start)
- [ ] Week view shows all staff members in separate columns (resource view variant)
- [ ] Week view shows appointments as blocks positioned by time
- [ ] Week view displays appointments spanning multiple hours correctly
- [ ] Week view allows navigation to previous/next week
- [ ] Week view shows day headers with date and day name
- [ ] Week view highlights today's column
- [ ] Week view shows appointment count per day
- [ ] Week view loads in < 2 seconds even with 50+ appointments
- [ ] Week view supports filtering by location or staff

### Month View

- [ ] Generate month view showing calendar grid
- [ ] Month view shows appointment count per day (dots or numbers)
- [ ] Month view allows clicking day to see day's appointments in detail
- [ ] Month view highlights days with high booking density
- [ ] Month view shows days outside business operating hours as disabled
- [ ] Month view allows navigation to previous/next month
- [ ] Month view shows current day highlighted
- [ ] Month view loads in < 1 second
- [ ] Month view shows summary statistics (total appointments, revenue)

### Resource View

- [ ] Generate resource view showing multiple staff side-by-side
- [ ] Resource view shows all staff for a location or business
- [ ] Resource view displays time slots on Y-axis, staff on X-axis
- [ ] Resource view shows appointments as blocks in correct staff column and time row
- [ ] Resource view shows staff availability (working hours)
- [ ] Resource view shows conflicts visually (overlapping appointments)
- [ ] Resource view supports drag-and-drop to reassign or reschedule (frontend consumes this data)
- [ ] Resource view loads in < 2 seconds for 10 staff members
- [ ] Resource view supports horizontal scrolling for many staff

### Appointment Display

- [ ] Appointments displayed with color coding (by status, service, or staff)
- [ ] Appointments show client name (or initials for privacy)
- [ ] Appointments show service name
- [ ] Appointments show duration visually (block height proportional to duration)
- [ ] Appointments show status indicator (pending, confirmed, completed, etc.)
- [ ] Recurring appointments indicated with icon or badge
- [ ] Group bookings show participant count
- [ ] Appointment details available on hover or click (API returns full details)

### Blocked Time Management

- [ ] Staff can create blocked time periods (breaks, meetings, personal time)
- [ ] Blocked time prevents appointments from being booked
- [ ] Blocked time displayed differently from appointments (gray out, different pattern)
- [ ] Blocked time can be recurring (e.g., lunch break every day 12-1pm)
- [ ] Blocked time can be one-time (e.g., staff meeting on specific date)
- [ ] Blocked time can be deleted
- [ ] Blocked time respects staff permissions (staff can only block own time)

### Calendar Filtering

- [ ] Filter appointments by status (confirmed, pending, cancelled, etc.)
- [ ] Filter appointments by service
- [ ] Filter appointments by staff member
- [ ] Filter appointments by location
- [ ] Filter appointments by date range
- [ ] Filter appointments by client (search by name or email)
- [ ] Multiple filters can be combined (AND logic)
- [ ] Filter results update in real-time

### Real-Time Updates

- [ ] Calendar subscribes to appointment changes via WebSocket
- [ ] When appointment created, calendar updates without refresh
- [ ] When appointment modified (status, time), calendar updates
- [ ] When appointment cancelled, calendar removes appointment
- [ ] Updates scoped to current view (don't update if appointment outside visible range)
- [ ] Multiple users viewing same calendar see same updates
- [ ] Updates include optimistic UI handling (immediate feedback before confirmation)

### Schedule Building

- [ ] Generate staff schedule for given date range
- [ ] Schedule shows daily summary (hours worked, appointments count, revenue)
- [ ] Schedule shows gaps in schedule (available time between appointments)
- [ ] Schedule calculates utilization percentage (booked time / available time)
- [ ] Schedule exports to CSV or PDF format
- [ ] Schedule respects staff availability rules
- [ ] Schedule respects location operating hours

### iCal Export

- [ ] Generate iCal format (RFC 5545) for appointment export
- [ ] iCal includes all appointment details (summary, description, location, time)
- [ ] iCal supports timezone information
- [ ] iCal can be generated for single appointment or date range
- [ ] iCal file downloadable by client or staff
- [ ] iCal compatible with Google Calendar, Apple Calendar, Outlook

### Performance

- [ ] Day view loads in < 1 second
- [ ] Week view loads in < 2 seconds
- [ ] Month view loads in < 1 second
- [ ] Resource view (10 staff) loads in < 2 seconds
- [ ] Real-time updates delivered in < 500ms after change
- [ ] Calendar queries optimized with database indexes
- [ ] Large date ranges paginated or limited

## Implementation Details

### Components to Build

**Calendar Module Structure:**
- calendar.module.ts: NestJS module definition
- calendar.controller.ts: Calendar view endpoints
- calendar.service.ts: Core calendar logic
- schedule-builder.service.ts: Schedule generation and aggregation
- blocked-time.service.ts: Blocked time management
- calendar-export.service.ts: Export to iCal, CSV, PDF
- real-time-calendar.gateway.ts: WebSocket gateway for real-time updates
- dto/calendar-view.dto.ts: Calendar query parameters
- dto/create-blocked-time.dto.ts: Blocked time creation
- dto/export-calendar.dto.ts: Export parameters

### Database Entities

**BlockedTime Entity:**
- Fields: id (UUID), tenant_id (UUID), staff_member_id (UUID), location_id (UUID nullable), title (string), description (text nullable), start_time (timestamp with timezone), end_time (timestamp with timezone), is_recurring (boolean default false), recurrence_rule (string nullable), color (string nullable), created_by (UUID), created_at (timestamp), updated_at (timestamp), deleted_at (timestamp nullable)
- Indexes: Index on staff_member_id + start_time + end_time, Index on tenant_id + start_time + end_time, Index on location_id
- Relationships: Belongs to Tenant, StaffMember, Location, User (created_by)

**No new primary entities needed - calendar views built from:**
- Appointments (existing)
- BlockedTime (new)
- Staff Availability (existing)
- Location Operating Hours (existing)

### Interfaces and DTOs

**CalendarViewDto:**
- view_type: string (required, enum: day, week, month, resource)
- date: string (required, ISO 8601 date for day/week/month, start date for resource)
- end_date: string (optional, for resource view with date range)
- business_id: string (optional)
- location_id: string (optional)
- staff_member_ids: array of strings (optional, filter specific staff)
- include_blocked_time: boolean (optional, default true)
- include_availability: boolean (optional, default true)
- timezone: string (optional, defaults to user timezone)

**DayViewResponse:**
- date: string (ISO 8601 date)
- timezone: string
- business_hours: object (start and end time)
- time_slots: array of TimeSlot objects
- appointments: array of AppointmentSummary objects
- blocked_times: array of BlockedTime objects
- staff_member: StaffSummary object

**WeekViewResponse:**
- start_date: string (ISO 8601 date, Monday)
- end_date: string (ISO 8601 date, Sunday)
- timezone: string
- days: array of DayColumn objects
- staff_members: array of StaffSummary objects (for resource view)

**MonthViewResponse:**
- year: number
- month: number
- timezone: string
- weeks: array of Week objects (array of Day objects)
- appointment_counts: object (map of date to appointment count)
- summary: object (total appointments, total revenue)

**ResourceViewResponse:**
- start_time: string (ISO 8601 timestamp)
- end_time: string (ISO 8601 timestamp)
- timezone: string
- time_slots: array of time strings
- staff_resources: array of StaffResource objects
  - staff_id, staff_name, availability, appointments, blocked_times
- conflicts: array of Conflict objects (overlapping appointments)

**AppointmentSummary:**
- id: string
- appointment_number: string
- client_name: string
- client_initials: string
- service_name: string
- start_time: string (ISO 8601 timestamp)
- end_time: string (ISO 8601 timestamp)
- duration_minutes: number
- status: string
- color: string (for display)
- recurring_icon: boolean
- group_size: number (if group booking)

**TimeSlot:**
- time: string (HH:MM format)
- timestamp: string (ISO 8601 timestamp)
- is_available: boolean
- is_past: boolean
- appointments: array of AppointmentSummary (if any)
- blocked_time: BlockedTime object (if any)

**CreateBlockedTimeDto:**
- staff_member_id: string (required)
- title: string (required)
- description: string (optional)
- start_time: string (required, ISO 8601 timestamp)
- end_time: string (required, ISO 8601 timestamp)
- is_recurring: boolean (optional, default false)
- recurrence_rule: string (optional, iCalendar RRULE)
- color: string (optional, hex color for display)

**ExportCalendarDto:**
- format: string (required, enum: ical, csv, pdf)
- start_date: string (required)
- end_date: string (required)
- staff_member_id: string (optional)
- location_id: string (optional)
- include_cancelled: boolean (optional, default false)

### Dependencies

**External Libraries:**
- date-fns: Date manipulation and formatting
- ical-generator: iCalendar format generation
- @nestjs/websockets: WebSocket support for real-time updates
- socket.io: WebSocket library

**Internal Dependencies:**
- Auth module: Authentication and tenant context
- Appointments module: Appointment data
- Staff module: Staff availability and information
- Locations module: Operating hours
- Services module: Service details for display

**Database:**
- PostgreSQL for appointment and blocked time queries
- Redis for WebSocket connection management and real-time updates

### Key Algorithms

**Day View Generation Algorithm:**

Inputs: date, staff_member_id, timezone

Process:
1. Get business operating hours for date
2. Get staff availability for date
3. Generate time slots from open to close (15-minute increments)
4. Query appointments for staff on date
5. Query blocked times for staff on date
6. For each time slot:
   a. Check if appointment exists at that time
   b. Check if blocked time exists at that time
   c. Mark slot as available, booked, or blocked
7. Add current time indicator if date is today
8. Return day view with slots, appointments, blocked times

Time Complexity: O(T + A + B) where T=time slots, A=appointments, B=blocked times
Target: < 1 second for typical day (8-10 hours, 32-40 slots)

**Week View Generation Algorithm:**

Inputs: start_date (Monday), location_id, staff_member_ids, timezone

Process:
1. Generate array of 7 dates (Mon-Sun)
2. For each date:
   a. Get appointments for all specified staff
   b. Get blocked times
   c. Get availability
3. Aggregate appointments by day and staff
4. Calculate daily appointment count
5. Identify days with high booking density
6. Return week structure with days, appointments, summary

Time Complexity: O(7 * (A + B + S)) where A=appointments per day, B=blocked times, S=staff count
Target: < 2 seconds for week with 5 staff and 50 appointments

**Month View Generation Algorithm:**

Inputs: year, month, location_id, timezone

Process:
1. Generate calendar grid (weeks array with day objects)
2. Query all appointments for month and location
3. Aggregate appointment counts by date
4. Calculate summary statistics (total appointments, revenue)
5. Mark days outside operating hours as disabled
6. Highlight current day if viewing current month
7. Return month structure with appointment counts and summary

Time Complexity: O(A) where A=appointments in month
Target: < 1 second for month with 200 appointments

**Resource View Generation Algorithm:**

Inputs: start_time, end_time, staff_member_ids, timezone

Process:
1. Generate time slot array (e.g., 9:00am, 9:15am, ..., 5:00pm)
2. For each staff member:
   a. Get availability for date range
   b. Get appointments
   c. Get blocked times
   d. Map appointments to time slots
   e. Detect conflicts (overlapping appointments)
3. Build matrix: [time_slot][staff_member] = appointment or null
4. Return resource view with staff columns, time rows, appointments, conflicts

Time Complexity: O(T * S + A * S) where T=time slots, S=staff count, A=appointments
Target: < 2 seconds for 10 staff, 8 hours, 32 slots

**Blocked Time Creation Algorithm:**

Inputs: staff_member_id, start_time, end_time, recurrence_rule (optional)

Process:
1. Validate staff member exists and user has permission
2. Check for conflicts with existing appointments
3. If recurring:
   a. Parse recurrence rule
   b. Generate all occurrences up to max date
   c. Create blocked time records for each occurrence
4. If one-time:
   a. Create single blocked time record
5. Emit WebSocket event for calendar refresh
6. Return created blocked time(s)

**Real-Time Update Handling:**

When appointment changes:
1. Appointment service emits event (AppointmentCreated, AppointmentUpdated, AppointmentCancelled)
2. Calendar gateway receives event
3. Gateway determines affected calendars (by location, staff, date)
4. Gateway emits WebSocket message to connected clients viewing those calendars
5. Clients update local state without full refresh

Message Format:
- event_type: string (appointment_created, appointment_updated, appointment_cancelled)
- appointment: AppointmentSummary object
- affected_date: string (ISO 8601 date)
- affected_staff_ids: array of strings

### Configuration

**Calendar Configuration:**
- DEFAULT_TIME_SLOT_MINUTES: 15
- WEEK_START_DAY: 1 (Monday, 0=Sunday)
- MONTH_START_WEEK: first (or last, configures week containing 1st of month)
- MAX_RESOURCE_VIEW_DAYS: 7
- MAX_EXPORT_DAYS: 365
- WEBSOCKET_RECONNECT_INTERVAL: 5000 (milliseconds)

**Display Configuration:**
- SHOW_PAST_APPOINTMENTS: true (in current day view)
- SHOW_CANCELLED_IN_CALENDAR: false (exclude cancelled by default)
- DEFAULT_APPOINTMENT_COLOR: #3B82F6 (blue)
- BLOCKED_TIME_COLOR: #9CA3AF (gray)

### Optimization Strategies

**Database Query Optimization:**
- Single query to fetch all appointments for date range (avoid N+1)
- Composite indexes on (staff_member_id, start_time, end_time)
- Composite indexes on (location_id, start_time, end_time)
- Query only necessary fields for summary views

**Caching:**
- Cache staff availability rules (15-minute TTL)
- Cache location operating hours (1-hour TTL)
- Cache service details (1-hour TTL)
- Do NOT cache appointment data (must be real-time)

**WebSocket Optimization:**
- Room-based subscriptions (clients join rooms for specific dates/locations)
- Broadcast only to affected rooms
- Throttle high-frequency updates (debounce 500ms)
- Disconnect inactive connections after timeout

**Frontend Data Structure:**
- Return pre-formatted data structure matching UI needs
- Minimize client-side processing
- Include all display information (names, colors, etc.) in response

## Test Scenarios

### Unit Tests

**Calendar Service Tests:**

- Test: Generate day view with appointments
  - Input: Date 2025-06-01, Staff ID, 3 appointments
  - Expected: Day view with 3 appointments in correct time slots
  - Edge case: Empty day (no appointments)

- Test: Generate week view for multiple staff
  - Input: Week starting 2025-06-01, 2 staff members, 10 appointments
  - Expected: Week view with 7 days, appointments distributed correctly
  - Edge case: Staff with no appointments shows as available

- Test: Generate month view with appointment counts
  - Input: June 2025, Location ID
  - Expected: Month grid with appointment counts per day
  - Verify: Summary statistics (total appointments, revenue) calculated correctly

- Test: Generate resource view showing staff side-by-side
  - Input: 2025-06-01 9am-5pm, 3 staff members
  - Expected: Matrix with time slots and staff columns, appointments positioned correctly

- Test: Handle timezone conversions in views
  - Input: Calendar in EST, User timezone PST
  - Expected: Appointments displayed in PST, times converted correctly

**Schedule Builder Tests:**

- Test: Calculate staff utilization
  - Setup: Staff available 8 hours, has 4 hours of appointments
  - Expected: 50% utilization
  - Edge case: 100% utilization (fully booked)
  - Edge case: 0% utilization (no appointments)

- Test: Identify schedule gaps
  - Setup: Appointments at 9am-10am, 11am-12pm, 2pm-3pm
  - Expected: Gaps at 10am-11am, 12pm-2pm identified
  - Use case: AI optimization can suggest filling gaps

- Test: Generate daily summary
  - Setup: Staff with 5 appointments, total duration 6 hours, total revenue $500
  - Expected: Summary with count, hours, revenue
  - Include: Buffer times in total time calculation

**Blocked Time Service Tests:**

- Test: Create one-time blocked time
  - Input: Staff ID, 2025-06-01 12pm-1pm (lunch break)
  - Expected: Blocked time created, appointments cannot be booked during this time

- Test: Create recurring blocked time
  - Input: Staff ID, Mon-Fri 12pm-1pm (daily lunch)
  - Expected: Blocked time created for all weekdays in date range

- Test: Detect conflicts between blocked time and appointments
  - Setup: Existing appointment at 12pm-1pm
  - Input: Attempt to create blocked time 12pm-1pm
  - Expected: Conflict error or warning

- Test: Delete blocked time
  - Input: Blocked time ID
  - Expected: Blocked time removed, slots become available

**iCal Export Tests:**

- Test: Generate iCal for single appointment
  - Input: Appointment ID
  - Expected: iCal file with VEVENT containing appointment details
  - Verify: START, END, SUMMARY, DESCRIPTION, LOCATION fields populated

- Test: Generate iCal for date range
  - Input: Start date, end date, staff ID
  - Expected: iCal file with multiple VEVENT entries
  - Verify: Timezone information included (VTIMEZONE)

- Test: iCal compatibility
  - Action: Import generated iCal into Google Calendar (simulated)
  - Expected: Appointment displays correctly with all details

### Integration Tests

**Calendar View API Tests:**

- Test: GET /calendar/day view
  - Action: GET /calendar/day?date=2025-06-01&staff_id=X
  - Expected: 200 OK, day view JSON with time slots and appointments
  - Verify: Appointments have correct times and details
  - Verify: Current time indicator present if today

- Test: GET /calendar/week view
  - Action: GET /calendar/week?start_date=2025-06-01&location_id=X
  - Expected: 200 OK, week view JSON with 7 days
  - Verify: All appointments for week included
  - Verify: Days outside operating hours marked correctly

- Test: GET /calendar/month view
  - Action: GET /calendar/month?year=2025&month=6&location_id=X
  - Expected: 200 OK, month view JSON with appointment counts
  - Verify: Summary statistics calculated correctly

- Test: GET /calendar/resource view
  - Action: GET /calendar/resource?start_time=2025-06-01T09:00&end_time=2025-06-01T17:00&staff_ids=X,Y,Z
  - Expected: 200 OK, resource view JSON with staff columns
  - Verify: Appointments positioned in correct staff column and time slot

**Blocked Time Management Tests:**

- Test: Create blocked time
  - Action: POST /calendar/blocked-time with staff_id, start_time, end_time
  - Expected: 201 Created, blocked time object returned
  - Verify: GET /calendar/day includes blocked time

- Test: Create recurring blocked time
  - Action: POST /calendar/blocked-time with recurrence_rule=daily
  - Expected: 201 Created, multiple blocked time entries created
  - Verify: All recurring instances visible in respective day views

- Test: Delete blocked time
  - Action: DELETE /calendar/blocked-time/:id
  - Expected: 204 No Content
  - Verify: Blocked time no longer appears in calendar

**Calendar Filtering Tests:**

- Test: Filter by status
  - Action: GET /calendar/week?status=confirmed
  - Expected: Only confirmed appointments in response

- Test: Filter by service
  - Action: GET /calendar/day?service_id=X
  - Expected: Only appointments for specified service

- Test: Combine filters
  - Action: GET /calendar/week?status=confirmed&service_id=X&staff_id=Y
  - Expected: Appointments matching all filters

**Real-Time Updates Tests:**

- Test: WebSocket connection and subscription
  - Action: Client connects to WebSocket, subscribes to calendar room
  - Expected: Connection successful, client added to room

- Test: Real-time appointment creation
  - Setup: Client A subscribed to calendar, Client B creates appointment
  - Expected: Client A receives WebSocket message with new appointment
  - Verify: Message delivered in < 500ms

- Test: Real-time appointment cancellation
  - Setup: Client A viewing calendar with appointment X
  - Action: Appointment X cancelled by Client B
  - Expected: Client A receives update, appointment removed from view

- Test: Multiple clients receive same update
  - Setup: 10 clients viewing same calendar
  - Action: New appointment created
  - Expected: All 10 clients receive update simultaneously

### End-to-End Tests

**Staff Viewing Daily Schedule:**
- Scenario: Staff logs in and views their schedule for today
  - Action: Login as staff member
  - Action: Navigate to calendar, select day view
  - Expected: Day view shows staff's appointments for today
  - Expected: Current time indicator shows current position in day
  - Action: Appointment checked in by receptionist
  - Expected: Appointment status updates in real-time without refresh

**Business Owner Viewing Resource Schedule:**
- Scenario: Owner views all staff schedules side-by-side
  - Action: Login as business owner
  - Action: Navigate to calendar, select resource view
  - Expected: All staff members shown in columns
  - Expected: Appointments displayed in correct staff column and time
  - Expected: Gaps in schedule visible (available slots)
  - Action: Click available slot to create new appointment
  - Expected: Booking form opens with pre-selected time and staff

**Calendar Export and Import:**
- Scenario: Client exports appointments to personal calendar
  - Action: Client views upcoming appointments
  - Action: Click export to iCal
  - Expected: iCal file downloaded
  - Action: Import into Google Calendar (simulated)
  - Expected: All appointments appear in Google Calendar with correct times
  - Verify: Appointment updates in platform do not automatically sync (one-way export)

**Blocked Time Preventing Booking:**
- Scenario: Staff blocks lunch time, client attempts to book
  - Action: Staff creates blocked time 12pm-1pm
  - Action: Client checks availability
  - Expected: 12pm-1pm slot not shown as available
  - Action: Client attempts to book at 12:30pm (direct API call)
  - Expected: Booking rejected with "Staff unavailable" error

### Performance Tests

**Day View Load Time:**
- Test: Load day view with 20 appointments
  - Expected: Response in < 500ms
  - Measurement: p95 < 1 second

**Week View Load Time:**
- Test: Load week view with 5 staff, 50 appointments
  - Expected: Response in < 1 second
  - Measurement: p95 < 2 seconds

**Month View Load Time:**
- Test: Load month view with 200 appointments
  - Expected: Response in < 800ms
  - Measurement: p95 < 1 second

**Resource View Load Time:**
- Test: Load resource view with 10 staff, 8-hour window, 80 appointments
  - Expected: Response in < 1.5 seconds
  - Measurement: p95 < 2 seconds

**WebSocket Message Delivery:**
- Test: Broadcast update to 100 connected clients
  - Expected: All clients receive message in < 500ms
  - Expected: No message loss

**Concurrent Calendar Viewers:**
- Test: 50 users viewing calendar simultaneously
  - Expected: All views load successfully
  - Expected: No performance degradation

### Edge Case Tests

**Timezone Edge Cases:**
- Test: Appointment at midnight
  - Setup: Appointment at 12:00am
  - Expected: Displayed correctly in day view, doesn't appear in previous day

- Test: Calendar view crossing DST boundary
  - Setup: Week view spanning DST change
  - Expected: Time slots adjust correctly after DST

- Test: User in different timezone than location
  - Setup: Location in EST, User in PST
  - Expected: Appointments displayed in user's timezone, but respect location hours

**Data Edge Cases:**
- Test: Day with no appointments
  - Expected: Day view shows available slots, no appointments

- Test: Staff with no availability
  - Expected: Day view shows "Staff unavailable" message

- Test: Appointment spanning midnight (e.g., 11pm-1am)
  - Expected: Appointment appears in both days' views

- Test: Very long appointment (e.g., 8 hours)
  - Expected: Appointment block sized correctly in view

**Concurrent Update Edge Cases:**
- Test: Appointment deleted while client viewing
  - Expected: Client receives delete event, appointment removed from view

- Test: Multiple rapid updates to same appointment
  - Expected: Client receives all updates or most recent state

## Caveats and Risks

### Performance Risks

**Risk: Slow Calendar Queries with Many Appointments**
- Impact: High - Poor user experience
- Mitigation: Database indexes, query optimization, pagination, denormalization
- Measurement: Monitor query time, alert if p95 > 2 seconds

**Risk: WebSocket Connection Overload**
- Impact: Medium - Real-time updates fail or delayed
- Mitigation: Connection limits per user, room-based broadcasting, throttling
- Measurement: Monitor WebSocket connection count and message delivery time

**Risk: Large Month View Performance**
- Impact: Medium - Slow month view load
- Mitigation: Aggregate queries, caching of appointment counts, lazy loading details
- Alternative: Show appointment count only, details on click

### Data Consistency Risks

**Risk: Stale Calendar Data**
- Impact: Medium - Users see outdated appointment status
- Mitigation: WebSocket real-time updates, fallback to polling if WebSocket fails
- Detection: Monitor WebSocket disconnection rate

**Risk: Timezone Conversion Errors**
- Impact: High - Appointments displayed at wrong times
- Mitigation: Always store UTC, convert on display, comprehensive timezone tests
- Detection: Monitor for appointments outside business hours

**Risk: Blocked Time Not Preventing Bookings**
- Impact: Medium - Double bookings despite blocked time
- Mitigation: Blocked time checked in availability calculation and booking validation
- Detection: Monitor for overlapping appointments and blocked times

### Scalability Risks

**Risk: Too Many WebSocket Connections**
- Impact: High - Server resource exhaustion
- Mitigation: Connection limits, horizontal scaling, load balancing
- Measurement: Monitor active connection count

**Risk: High Message Broadcast Frequency**
- Impact: Medium - Network and CPU load
- Mitigation: Throttle/debounce updates, batch messages, compress data
- Measurement: Monitor message rate and bandwidth

### UI/UX Risks

**Risk: Calendar Overlap Visualization Complexity**
- Impact: Low - Confusing UI if appointments overlap
- Mitigation: Clear visual design (staggered display or split columns)
- Note: Backend provides conflict detection, frontend handles display

**Risk: Blocked Time Confusion**
- Impact: Low - Users confused about unavailable slots
- Mitigation: Clear visual distinction, hover tooltips explaining why unavailable
- Note: Backend provides blocked time data, frontend displays clearly

### Data Integrity Risks

**Risk: Orphaned Blocked Times**
- Impact: Low - Blocked times for deleted staff
- Mitigation: Soft delete staff, cascade delete or mark blocked times inactive
- Detection: Periodic integrity check

**Risk: Invalid Recurring Blocked Times**
- Impact: Low - Recurrence rule parsing errors
- Mitigation: Use battle-tested library (rrule), validate recurrence rules
- Detection: Log parsing errors, alert on failures

## Estimated Effort

**Size: Medium (2-3 weeks for 1-2 developers)**

**Breakdown:**
- Database schema for blocked time: 1 day
- Day view generation logic: 2 days
- Week view generation logic: 2 days
- Month view generation logic: 2 days
- Resource view generation logic: 3 days
- Blocked time management: 2 days
- iCal export: 2 days
- WebSocket real-time updates: 3 days
- Calendar filtering: 1 day
- Schedule builder and utilization: 2 days
- Unit tests: 3 days
- Integration tests: 3 days
- Performance testing and optimization: 2 days
- Edge case handling: 2 days
- Documentation: 1 day
- Buffer: 3 days

**Dependencies:**
- Auth module complete
- Appointments module complete (booking engine)
- Staff module complete
- Locations module complete

**Parallel Work Opportunities:**
- iCal export can be done in parallel with real-time updates
- Different view types (day, week, month) can be implemented in parallel

## Owner Role

**Primary: Backend Developer (Mid-Level)**

**Skills Required:**
- Experience with data aggregation and query optimization
- Understanding of WebSocket/real-time communication
- Date/time handling including timezones
- Algorithm design for calendar generation
- NestJS or similar Node.js framework
- TypeScript
- PostgreSQL
- Redis (for WebSocket rooms)
- Socket.io or similar WebSocket library

**Secondary Roles:**
- Frontend Developer: Work closely on calendar data format and real-time updates
- QA Engineer: Test various calendar views, timezone scenarios, real-time updates

**Knowledge Transfer Required:**
- Document calendar generation algorithms
- Document WebSocket event flow
- Document timezone handling approach
- Create troubleshooting guide for real-time update issues
