# Task: Booking Engine Backend

## Task Title
Implement Core Booking Engine with Availability Checking and Conflict Resolution

## Description

Build the complete booking engine that powers the appointment system, including intelligent availability checking, appointment booking with conflict detection and resolution, appointment lifecycle management (status transitions), recurring appointments, group bookings, cancellation with policy enforcement, and no-show tracking.

The booking engine is the heart of the platform and must be:
- **Reliable:** No double-bookings under any circumstances
- **Fast:** Availability checks complete in < 500ms even with complex schedules
- **Flexible:** Support single, recurring, and group bookings
- **Policy-Aware:** Enforce cancellation policies, buffer times, advance booking windows
- **Concurrent-Safe:** Handle simultaneous booking attempts gracefully

This task depends on the authentication system and staff/service management, but is critical path for MVP.

## Acceptance Criteria

### Availability Checking

- [ ] Client can query available slots for a given service, date range, and location
- [ ] Availability considers staff working hours (from Availability entity)
- [ ] Availability excludes staff time-off and breaks
- [ ] Availability excludes existing appointments
- [ ] Availability respects service duration and buffer times
- [ ] Availability respects business operating hours
- [ ] Availability returns slots in 15-minute increments by default (configurable)
- [ ] Availability optionally filters by specific staff member
- [ ] Availability supports multi-day queries (e.g., next 7 days)
- [ ] Availability calculation completes in < 500ms for typical queries
- [ ] Availability considers multiple staff members if not specified
- [ ] Availability shows staff member assigned to each slot
- [ ] Availability excludes slots in the past
- [ ] Availability respects minimum advance booking time (e.g., cannot book within 2 hours)
- [ ] Availability respects maximum advance booking window (e.g., cannot book beyond 90 days)

### Appointment Booking

- [ ] Client can book appointment with service, staff, location, date/time
- [ ] Booking validates that slot is still available at creation time
- [ ] Booking uses database transaction for atomicity
- [ ] Booking prevents double-booking via optimistic locking or database constraints
- [ ] Booking creates appointment with status PENDING or CONFIRMED (based on business settings)
- [ ] Booking stores appointment with timezone information
- [ ] Booking calculates end time based on service duration
- [ ] Booking applies buffer times (before and after)
- [ ] Booking validates that client and staff are in same tenant
- [ ] Booking validates that service is offered at selected location
- [ ] Booking validates that staff can perform selected service
- [ ] Booking generates unique appointment number
- [ ] Booking triggers notification (email confirmation)
- [ ] Booking allows optional notes from client
- [ ] Booking supports service add-ons
- [ ] Booking returns appointment ID and confirmation details

### Concurrent Booking Handling

- [ ] If two clients attempt to book same slot simultaneously, only one succeeds
- [ ] Failed booking returns clear error message (slot no longer available)
- [ ] Optimistic locking using version field or database row locking
- [ ] Retry logic suggests alternative slots if chosen slot becomes unavailable
- [ ] Race condition tests pass (100 simultaneous bookings for same slot)

### Appointment Status Management

- [ ] Appointment status can transition: PENDING → CONFIRMED
- [ ] Appointment status can transition: CONFIRMED → CHECKED_IN
- [ ] Appointment status can transition: CHECKED_IN → IN_PROGRESS
- [ ] Appointment status can transition: IN_PROGRESS → COMPLETED
- [ ] Appointment status can transition: PENDING/CONFIRMED → CANCELLED
- [ ] Appointment status can transition: CONFIRMED → NO_SHOW
- [ ] Invalid status transitions return error (e.g., COMPLETED → PENDING)
- [ ] Status transitions logged in audit log
- [ ] Status transitions trigger notifications
- [ ] Staff can complete appointments (mark as COMPLETED)
- [ ] Staff can mark appointments as NO_SHOW (if client doesn't arrive)
- [ ] Client can check-in via app (status → CHECKED_IN)

### Appointment Modification

- [ ] Client can reschedule appointment (change date/time)
- [ ] Rescheduling validates new slot availability
- [ ] Rescheduling respects cancellation policy (e.g., 24 hours notice)
- [ ] Rescheduling triggers notification
- [ ] Staff can reassign appointment to different staff member
- [ ] Reassignment validates new staff can perform service
- [ ] Reassignment validates new staff is available
- [ ] Client can update appointment notes
- [ ] Staff can update internal notes (not visible to client)

### Appointment Cancellation

- [ ] Client can cancel appointment if within cancellation window
- [ ] Cancellation policy enforced (e.g., cannot cancel within 24 hours)
- [ ] Cancellation outside policy window returns error or requires approval
- [ ] Staff can cancel appointment on behalf of client (no restrictions)
- [ ] Business owner can cancel any appointment
- [ ] Cancellation frees up slot immediately (available for rebooking)
- [ ] Cancellation triggers refund if payment made (based on policy)
- [ ] Cancellation reason captured (optional)
- [ ] Cancellation notification sent to client and staff
- [ ] Cancelled appointments retained in database (soft delete or status change)
- [ ] Client's cancellation count incremented (for tracking frequent cancellers)

### Recurring Appointments

- [ ] Client can book recurring appointments (weekly, bi-weekly, monthly)
- [ ] Recurring booking specifies end date or number of occurrences
- [ ] Recurring booking creates all instances at once (atomic transaction)
- [ ] Recurring instances linked via recurring_group_id
- [ ] Recurring instances store recurrence_rule (iCalendar RRULE format)
- [ ] System validates all recurring slots available before creating any
- [ ] If any recurring slot conflicts, entire recurring booking fails
- [ ] Client can cancel single instance in recurring series
- [ ] Client can cancel all future instances in recurring series
- [ ] Client can modify recurrence pattern (e.g., change from weekly to bi-weekly)
- [ ] Modification creates new recurring group, cancels old instances
- [ ] Recurring appointments properly handle daylight saving time changes

### Group Bookings

- [ ] Service can be configured to allow group bookings
- [ ] Group booking specifies number of participants (up to max_group_size)
- [ ] Group booking occupies single staff time slot
- [ ] Group booking can collect names of all participants
- [ ] Group booking links to multiple clients (if all have accounts)
- [ ] Group booking payment can be split or collected from one person
- [ ] Group cancellation policy applies to entire group
- [ ] Group booking updates affect all participants

### Buffer Times

- [ ] Each service has default buffer_before_minutes and buffer_after_minutes
- [ ] Staff can override buffer times (staff-specific buffers)
- [ ] Buffer times prevent bookings too close together
- [ ] Buffer times included in availability calculation
- [ ] Buffer times not shown to client (internal scheduling constraint)
- [ ] Back-to-back appointments respect combined buffer time (end buffer + start buffer)

### Booking Policies

- [ ] Business can set minimum advance booking time (e.g., 2 hours)
- [ ] Bookings within minimum advance time are rejected
- [ ] Business can set maximum advance booking window (e.g., 90 days)
- [ ] Bookings beyond maximum window are rejected
- [ ] Business can require approval for bookings (status starts as PENDING)
- [ ] Approval required bookings can be approved or rejected by staff
- [ ] Business can set cancellation cutoff (e.g., 24 hours before)
- [ ] Cancellations within cutoff trigger fee or require approval

### No-Show Handling

- [ ] Staff can mark appointment as NO_SHOW after appointment time
- [ ] No-show increments client's no_show_count
- [ ] Business can configure no-show fee (percentage or fixed amount)
- [ ] No-show fee charged to client's payment method (if stored)
- [ ] Client with high no-show count can be flagged or restricted
- [ ] No-show notification sent to business owner

### Business Rules Validation

- [ ] Cannot book appointment outside business operating hours
- [ ] Cannot book appointment when location is closed
- [ ] Cannot book appointment for staff on time-off
- [ ] Cannot book appointment before current time
- [ ] Cannot book service not offered at selected location
- [ ] Cannot book with staff who cannot perform selected service
- [ ] Cannot book for client in different tenant than business
- [ ] All validation errors return clear, actionable error messages

## Implementation Details

### Components to Build

**Appointments Module Structure:**
- appointments.module.ts: NestJS module definition
- appointments.controller.ts: Appointment CRUD endpoints
- appointments.service.ts: Core appointment business logic
- availability.controller.ts: Availability checking endpoints
- availability.service.ts: Availability calculation logic
- conflict-resolver.service.ts: Conflict detection and resolution
- booking-validator.service.ts: Business rules validation
- recurring-appointments.service.ts: Recurring appointment logic
- entities/appointment.entity.ts: Appointment database entity
- entities/appointment-addon.entity.ts: Appointment add-on junction entity
- dto/create-appointment.dto.ts: Appointment creation DTO
- dto/update-appointment.dto.ts: Appointment update DTO
- dto/check-availability.dto.ts: Availability query DTO
- dto/cancel-appointment.dto.ts: Cancellation DTO
- dto/reschedule-appointment.dto.ts: Rescheduling DTO

### Database Entities

**Appointment Entity:**
- Fields: id (UUID), tenant_id (UUID), business_id (UUID), location_id (UUID), client_id (UUID), staff_member_id (UUID), service_id (UUID), appointment_number (string unique per tenant), start_time (timestamp with timezone), end_time (timestamp with timezone), timezone (string), duration_minutes (integer), buffer_before_minutes (integer), buffer_after_minutes (integer), status (enum: PENDING, CONFIRMED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW), cancellation_reason (string nullable), cancelled_at (timestamp nullable), cancelled_by (UUID nullable), is_recurring (boolean default false), recurring_group_id (UUID nullable), recurrence_rule (string nullable), is_group_booking (boolean default false), group_size (integer default 1), notes (text nullable), internal_notes (text nullable), check_in_time (timestamp nullable), completion_time (timestamp nullable), no_show_notified (boolean default false), reminder_sent_at (timestamp nullable), metadata (JSONB nullable), created_at (timestamp), updated_at (timestamp), deleted_at (timestamp nullable), version (integer default 1 for optimistic locking)

- Indexes: Unique on tenant_id + appointment_number, Index on tenant_id + status, Index on location_id + start_time + end_time, Index on staff_member_id + start_time + end_time, Index on client_id + status, Index on recurring_group_id, Index on start_time (for date range queries)

- Unique Constraints: Cannot have overlapping appointments for same staff member (enforced via database constraint or application logic with locking)

- Relationships: Belongs to Tenant, Business, Location, ClientProfile, StaffMember, Service; Has many AppointmentAddon

**AppointmentAddon Entity:**
- Fields: id (UUID), tenant_id (UUID), appointment_id (UUID), service_addon_id (UUID), price (decimal), created_at (timestamp)
- Indexes: Index on appointment_id
- Relationships: Belongs to Appointment, ServiceAddon

**RecurringGroup (implicit via recurring_group_id):**
- Not a separate table, but appointments linked by recurring_group_id
- Query all appointments with same recurring_group_id to get series

### Interfaces and DTOs

**CheckAvailabilityDto:**
- business_id: string (required)
- location_id: string (optional)
- service_id: string (required)
- staff_member_id: string (optional)
- start_date: string (required, ISO 8601 date)
- end_date: string (required, ISO 8601 date)
- timezone: string (optional, defaults to location timezone)
- group_size: integer (optional, default 1)

**AvailableSlot Interface:**
- start_time: string (ISO 8601 timestamp)
- end_time: string (ISO 8601 timestamp)
- staff_member_id: string
- staff_member_name: string
- location_id: string
- price: number
- deposit_amount: number (if required)
- recommended: boolean (for AI recommendations, Phase 4)

**CreateAppointmentDto:**
- business_id: string (required)
- location_id: string (required)
- service_id: string (required)
- staff_member_id: string (optional, auto-assigned if not provided)
- start_time: string (required, ISO 8601 timestamp)
- timezone: string (required)
- client_id: string (optional for staff booking on behalf of client)
- guest_email: string (optional for guest booking)
- guest_first_name: string (optional)
- guest_last_name: string (optional)
- guest_phone_number: string (optional)
- addon_ids: array of strings (optional)
- group_size: integer (optional, default 1)
- notes: string (optional)
- recurrence_rule: string (optional, iCalendar RRULE format)
- recurrence_end_date: string (optional, ISO 8601 date)

**UpdateAppointmentDto:**
- start_time: string (optional, for rescheduling)
- staff_member_id: string (optional, for reassignment)
- notes: string (optional)
- internal_notes: string (optional, staff only)
- status: string (optional, limited transitions allowed)

**CancelAppointmentDto:**
- cancellation_reason: string (optional)
- cancel_recurring_series: boolean (optional, default false)

**AppointmentStatusTransitionDto:**
- new_status: string (required)
- notes: string (optional)

### Dependencies

**External Libraries:**
- date-fns or moment-timezone: Date/time manipulation with timezone support
- rrule: Parsing and generating iCalendar recurrence rules
- uuid: Generate UUIDs for entities

**Internal Dependencies:**
- Auth module: User authentication and tenant context
- Staff module: Staff availability, skills, assignments
- Services module: Service duration, buffer times, pricing
- Locations module: Operating hours, timezone
- Clients module: Client profiles
- Payments module: Deposit collection (if required)
- Notifications module: Send booking confirmations, reminders, cancellations
- Audit module: Log all booking actions

**Database:**
- PostgreSQL with timezone support
- Transactional support for atomic operations
- Row-level locking or optimistic locking for conflict prevention

### Key Algorithms

**Availability Calculation Algorithm:**

Inputs: service_id, start_date, end_date, location_id, staff_member_id (optional)

Process:
1. Get service details (duration, buffer times)
2. Get location operating hours for date range
3. Get staff members who can perform service at location (if staff not specified)
4. For each staff member:
   a. Get staff availability rules (recurring and one-time)
   b. Generate available time blocks based on availability rules
   c. Remove time-off blocks
   d. Remove existing appointments (with buffers)
   e. Apply business operating hours constraints
   f. Split blocks into slots of service duration
5. Aggregate all available slots across staff members
6. Sort slots by start time
7. Optionally rank/prioritize slots (AI optimization in Phase 4)

Output: Array of AvailableSlot objects

Time Complexity: O(D * S * A * E) where D=days, S=staff count, A=availability rules, E=existing appointments
Target: < 500ms for typical query (7 days, 5 staff, 50 appointments)

**Conflict Detection Algorithm:**

Inputs: Proposed appointment (start_time, end_time, staff_member_id)

Process:
1. Calculate effective start (start_time - buffer_before)
2. Calculate effective end (end_time + buffer_after)
3. Query existing appointments for staff member overlapping [effective_start, effective_end]
4. If any overlapping appointments found, return conflict error
5. Use database-level locking or optimistic locking to prevent race conditions

Database Query:
```
SELECT * FROM appointments
WHERE staff_member_id = ?
AND status NOT IN ('CANCELLED', 'NO_SHOW')
AND (
  (start_time <= ? AND end_time > ?) OR  -- new apt starts during existing
  (start_time < ? AND end_time >= ?) OR  -- new apt ends during existing
  (start_time >= ? AND end_time <= ?)    -- new apt fully contains existing
)
FOR UPDATE  -- row-level locking
```

**Recurring Appointment Creation Algorithm:**

Inputs: Base appointment details, recurrence_rule, recurrence_end_date

Process:
1. Parse recurrence_rule using rrule library
2. Generate all occurrence dates between start and end_date
3. For each occurrence:
   a. Create appointment object with same details but different start_time
   b. Link to recurring_group_id (same for all instances)
   c. Set recurrence_rule field
4. In single database transaction:
   a. Check availability for ALL occurrences
   b. If any conflict, rollback entire transaction
   c. If all clear, insert all appointments atomically
5. Return recurring_group_id and count of created instances

**Cancellation Policy Enforcement Algorithm:**

Inputs: Appointment, cancellation_time, cancellation_policy

Process:
1. Get business cancellation policy (hours before appointment)
2. Calculate cutoff time (appointment.start_time - policy.hours)
3. If cancellation_time > cutoff_time: Allow cancellation, no fee
4. If cancellation_time <= cutoff_time:
   a. Check if override allowed (staff/admin can override)
   b. Apply cancellation fee if configured
   c. Mark appointment as CANCELLED with reason
5. Process refund (if applicable)
6. Free up time slot
7. Send cancellation notification

### Configuration

**Booking Configuration:**
- DEFAULT_SLOT_INCREMENT_MINUTES: 15
- MIN_ADVANCE_BOOKING_HOURS: 2
- MAX_ADVANCE_BOOKING_DAYS: 90
- DEFAULT_BUFFER_BEFORE_MINUTES: 0
- DEFAULT_BUFFER_AFTER_MINUTES: 0
- CANCELLATION_CUTOFF_HOURS: 24
- CANCELLATION_FEE_PERCENTAGE: 50
- NO_SHOW_FEE_PERCENTAGE: 100
- REQUIRE_APPROVAL: false
- MAX_RECURRING_OCCURRENCES: 52 (one year of weekly)
- AVAILABILITY_QUERY_MAX_DAYS: 30

**Appointment Status:**
- PENDING: Awaiting approval or payment
- CONFIRMED: Confirmed by client or automatically
- CHECKED_IN: Client has checked in
- IN_PROGRESS: Service being provided
- COMPLETED: Service completed successfully
- CANCELLED: Cancelled by client or business
- NO_SHOW: Client did not show up

### Optimization Strategies

**Caching:**
- Cache staff availability rules (15 minute TTL)
- Cache location operating hours (1 hour TTL)
- Cache service details (1 hour TTL)
- Do NOT cache appointment data (must be real-time)

**Database Indexes:**
- Composite index on (staff_member_id, start_time, end_time) for conflict checks
- Index on (tenant_id, status, start_time) for queries
- Index on recurring_group_id for recurring series lookups

**Query Optimization:**
- Use database-level date functions for timezone conversion
- Minimize round trips (batch queries where possible)
- Use database connection pooling
- Consider read replicas for availability queries (eventual consistency acceptable)

**Concurrency Handling:**
- Use optimistic locking (version field) or pessimistic locking (FOR UPDATE)
- Retry logic for transient conflicts
- Queue-based booking for high-contention scenarios (optional Phase 2)

## Test Scenarios

### Unit Tests

**Availability Service Tests:**

- Test: Calculate available slots for staff with simple schedule
  - Input: Staff available Mon-Fri 9am-5pm, service duration 30 min, query Mon 9am-5pm
  - Expected: 16 slots (8 hours * 2 slots per hour)
  - Edge case: No slots if staff unavailable

- Test: Exclude existing appointments from availability
  - Setup: Staff has appointment 10am-10:30am
  - Input: Query 9am-11am
  - Expected: Slots 9:00, 9:15, 9:30, 9:45, 10:30, 10:45 (10:00, 10:15 excluded)

- Test: Respect buffer times
  - Setup: Service has 15min buffer before and after, existing appointment 10am-10:30am
  - Input: Query 9am-11am
  - Expected: 9:45am slot excluded (15min before 10am), 10:30am slot excluded (15min after 10:30am)

- Test: Handle timezone conversions
  - Setup: Location in EST, query in PST
  - Input: Query 9am-5pm PST (12pm-8pm EST)
  - Expected: Slots returned in PST, but calculated based on EST availability

- Test: Multi-day availability query
  - Input: Query next 7 days
  - Expected: Slots returned for each day, sorted chronologically
  - Performance: Complete in < 500ms

- Test: No available slots edge case
  - Setup: Staff fully booked
  - Expected: Empty array returned

**Conflict Resolver Service Tests:**

- Test: Detect overlapping appointments
  - Setup: Existing appointment 10am-11am
  - Input: New appointment 10:30am-11:30am (overlaps)
  - Expected: Conflict detected, returns error

- Test: Allow non-overlapping appointments
  - Setup: Existing appointments 9am-10am, 11am-12pm
  - Input: New appointment 10am-11am (fits perfectly)
  - Expected: No conflict

- Test: Respect buffer times in conflict detection
  - Setup: Existing appointment 10am-10:30am with 15min buffer after
  - Input: New appointment 10:30am-11am
  - Expected: Conflict detected (buffer overlaps)

- Test: Handle concurrent booking attempts
  - Setup: Same slot available
  - Action: 2 clients attempt to book simultaneously
  - Expected: One succeeds, one gets conflict error
  - Note: Requires transaction isolation testing

**Recurring Appointments Service Tests:**

- Test: Generate weekly recurring appointments
  - Input: Every Monday at 10am for 4 weeks
  - Expected: 4 appointments created, all linked via recurring_group_id

- Test: Validate all occurrences available
  - Setup: Conflict on 3rd occurrence
  - Input: Weekly recurring, 4 occurrences
  - Expected: Transaction rolled back, no appointments created, error message includes conflicting date

- Test: Parse iCalendar RRULE
  - Input: "FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=12"
  - Expected: 12 appointments on Mon, Wed, Fri over 4 weeks

- Test: Handle daylight saving time changes
  - Setup: Recurring appointment crosses DST boundary
  - Input: Weekly at 10am, spanning DST change
  - Expected: All appointments at 10am local time (absolute time shifts)

**Booking Validator Service Tests:**

- Test: Validate booking within operating hours
  - Setup: Business open 9am-5pm
  - Input: Appointment at 8am
  - Expected: ValidationError (outside operating hours)

- Test: Validate minimum advance booking
  - Setup: Min advance 2 hours
  - Input: Appointment 1 hour from now
  - Expected: ValidationError (too soon)

- Test: Validate maximum advance booking
  - Setup: Max advance 90 days
  - Input: Appointment 100 days from now
  - Expected: ValidationError (too far in future)

- Test: Validate staff can perform service
  - Setup: Staff without skill for service
  - Input: Appointment with that staff and service
  - Expected: ValidationError (staff cannot perform service)

- Test: Validate service offered at location
  - Setup: Service not enabled at location
  - Input: Appointment at that location
  - Expected: ValidationError (service not available at location)

### Integration Tests

**Complete Booking Flow:**
- Test: Check availability and book appointment
  - Step 1: GET /availability?service_id=X&start_date=Y&end_date=Z
  - Expected: 200 OK, array of available slots
  - Step 2: POST /appointments with selected slot
  - Expected: 201 Created, appointment object returned
  - Step 3: GET /availability again
  - Expected: Booked slot no longer in available slots

**Concurrent Booking Attempts:**
- Test: Two clients book same slot simultaneously
  - Setup: One available slot at 10am
  - Action: Client A and Client B POST /appointments for 10am slot at same time (within 100ms)
  - Expected: One request returns 201 Created, other returns 409 Conflict
  - Verify: Only one appointment exists in database

**Recurring Appointment Creation:**
- Test: Create weekly recurring appointments
  - Action: POST /appointments with recurrence_rule=weekly, count=4
  - Expected: 201 Created, recurring_group_id returned
  - Verify: GET /appointments?recurring_group_id=X returns 4 appointments
  - Verify: All 4 appointments have same service, staff, time (different dates)

**Appointment Cancellation:**
- Test: Cancel appointment within policy window
  - Setup: Appointment 48 hours from now, policy allows 24hr cancellation
  - Action: POST /appointments/:id/cancel
  - Expected: 200 OK, appointment status=CANCELLED
  - Verify: Slot becomes available again
  - Verify: Cancellation notification sent

- Test: Attempt cancellation outside policy window
  - Setup: Appointment 12 hours from now, policy requires 24hr notice
  - Action: POST /appointments/:id/cancel (as client)
  - Expected: 403 Forbidden with policy error message
  - Alternative: Staff can override and cancel
  - Expected: 200 OK, cancellation successful

**Appointment Rescheduling:**
- Test: Reschedule to available slot
  - Setup: Existing appointment at 10am, available slot at 2pm
  - Action: PATCH /appointments/:id with new start_time=2pm
  - Expected: 200 OK, appointment updated
  - Verify: 10am slot becomes available
  - Verify: 2pm slot no longer available
  - Verify: Reschedule notification sent

**Group Booking:**
- Test: Create group booking
  - Setup: Service allows group bookings, max size 5
  - Action: POST /appointments with group_size=3
  - Expected: 201 Created, appointment with group_size=3
  - Verify: Only one appointment occupies staff time
  - Verify: Cancellation affects all 3 participants

**Status Transitions:**
- Test: Complete appointment lifecycle
  - Step 1: Create appointment (status=PENDING or CONFIRMED)
  - Step 2: POST /appointments/:id/check-in
  - Expected: status=CHECKED_IN
  - Step 3: POST /appointments/:id/start
  - Expected: status=IN_PROGRESS
  - Step 4: POST /appointments/:id/complete
  - Expected: status=COMPLETED, completion_time set

**No-Show Handling:**
- Test: Mark appointment as no-show
  - Setup: Appointment time has passed, client didn't show up
  - Action: POST /appointments/:id/no-show (staff only)
  - Expected: 200 OK, status=NO_SHOW
  - Verify: Client no_show_count incremented
  - Verify: No-show fee charged (if configured)
  - Verify: No-show notification sent

### End-to-End Tests

**Complete Client Booking Journey:**
- Scenario: Client finds available slot and books appointment
  - Action: Login as client
  - Action: Navigate to booking page, select service
  - Action: View available slots for next week
  - Expected: Calendar shows available times
  - Action: Select slot, provide notes, confirm booking
  - Expected: Booking confirmation shown, email received
  - Action: View upcoming appointments
  - Expected: New appointment appears in list

**Staff Managing Schedule:**
- Scenario: Staff views schedule and completes appointment
  - Action: Login as staff member
  - Action: View calendar for today
  - Expected: Scheduled appointments displayed
  - Action: Client arrives, mark as checked-in
  - Expected: Status updated, client sees updated status
  - Action: After service, mark as completed
  - Expected: Status=COMPLETED, slot freed in past

**Business Owner Managing Cancellation:**
- Scenario: Client requests cancellation, owner approves
  - Setup: Appointment within cancellation cutoff (requires approval)
  - Action: Client attempts to cancel
  - Expected: Request sent to business owner
  - Action: Owner reviews cancellation request
  - Action: Owner approves cancellation
  - Expected: Appointment cancelled, refund processed, notifications sent

**Recurring Appointment Management:**
- Scenario: Client books recurring appointments and modifies series
  - Action: Client books weekly appointment for 8 weeks
  - Expected: 8 appointments created
  - Action: After 3 appointments, client changes to bi-weekly
  - Expected: Remaining 5 appointments cancelled, new bi-weekly series created
  - Action: Client cancels single instance
  - Expected: One appointment cancelled, others unaffected

### Performance Tests

**Availability Query Performance:**
- Test: Query availability for 7 days, 5 staff members
  - Setup: 5 staff with typical schedules, 50 existing appointments
  - Action: GET /availability?start_date=now&end_date=now+7days
  - Expected: Response in < 500ms
  - Measurement: p95 < 500ms, p99 < 1000ms

**Concurrent Booking Load:**
- Test: 100 clients attempting to book at once
  - Setup: 20 available slots
  - Action: 100 simultaneous POST /appointments requests
  - Expected: 20 succeed, 80 fail with clear conflict errors
  - Expected: No double-bookings (verify in database)
  - Performance: All requests complete in < 5 seconds

**Recurring Appointment Creation Performance:**
- Test: Create weekly recurring for 1 year (52 occurrences)
  - Action: POST /appointments with 52 occurrences
  - Expected: All 52 created in < 2 seconds
  - Expected: Single database transaction

**Calendar Query Performance:**
- Test: Load full month of appointments for busy location
  - Setup: Location with 10 staff, 500 appointments in month
  - Action: GET /appointments?location_id=X&start_date=month_start&end_date=month_end
  - Expected: Response in < 1 second
  - Note: Pagination recommended for large result sets

### Edge Case Tests

**Timezone Edge Cases:**
- Test: Appointment crossing DST boundary
  - Setup: Recurring appointment weekly at 10am
  - Action: Create series spanning DST change
  - Expected: All appointments at 10am local time (not 9am or 11am after DST)

- Test: Booking from different timezone than location
  - Setup: Client in EST, Location in PST
  - Action: Client books appointment at "2pm my time"
  - Expected: Appointment stored correctly in PST, client sees EST time

**Buffer Time Edge Cases:**
- Test: Zero buffer times
  - Setup: Service with 0 buffer before and after
  - Expected: Appointments can be back-to-back with no gap

- Test: Large buffer times
  - Setup: Service with 60min buffer before and after (e.g., surgery)
  - Expected: 2-hour gap required between appointments

**Availability Edge Cases:**
- Test: Staff with no availability rules
  - Expected: No slots available (cannot book)

- Test: Staff with overnight availability (e.g., 8pm-2am)
  - Expected: Slots span midnight correctly

- Test: Location closed on public holiday
  - Expected: No slots available on that day

**Concurrent Modification Edge Cases:**
- Test: Client reschedules while staff cancels
  - Action: Client and staff modify same appointment simultaneously
  - Expected: One operation succeeds, other gets conflict error

- Test: Recurring series modified while instance is cancelled
  - Action: Client modifies series, staff cancels one instance
  - Expected: Graceful handling (either order succeeds)

## Caveats and Risks

### Concurrency Risks

**Risk: Double-Booking Due to Race Condition**
- Impact: Critical - Two clients booked for same slot, major customer satisfaction issue
- Mitigation: Use database-level locking (FOR UPDATE), optimistic locking (version field), thorough concurrent testing
- Detection: Monitor for appointments with overlapping times for same staff, alert immediately

**Risk: Deadlock in Concurrent Transactions**
- Impact: High - Booking requests hang or fail
- Mitigation: Keep transactions short, acquire locks in consistent order, set transaction timeout
- Detection: Monitor database for deadlocks, retry on deadlock error

**Risk: Lost Updates in Optimistic Locking**
- Impact: Medium - Update lost silently
- Mitigation: Check version field before update, return conflict error if version changed, client retries
- Detection: Log optimistic lock failures

### Performance Risks

**Risk: Slow Availability Queries**
- Impact: High - Poor user experience, timeouts
- Mitigation: Database indexes, query optimization, caching of static data (staff, services), read replicas
- Measurement: Target p95 < 500ms, alert if > 1 second

**Risk: Recurring Appointment Creation Timeout**
- Impact: Medium - Large recurring series fails to create
- Mitigation: Limit max occurrences (52 weeks), batch inserts, transaction timeout
- Alternative: Create first occurrence immediately, create rest asynchronously (queue)

**Risk: Calendar Query Performance Degradation**
- Impact: Medium - Slow calendar loads
- Mitigation: Pagination, date range limits, indexes, denormalization (cache commonly accessed fields)
- Measurement: Target < 1 second for month view

### Business Logic Risks

**Risk: Complex Cancellation Policy Edge Cases**
- Impact: Medium - Inconsistent policy enforcement, customer disputes
- Mitigation: Clear policy documentation, comprehensive tests, flexible override mechanism for staff
- Detection: Monitor cancellation disputes, refine policy based on feedback

**Risk: Timezone Handling Errors**
- Impact: High - Appointments booked at wrong time, major customer satisfaction issue
- Mitigation: Store all times in UTC, always include timezone, thorough timezone testing, display times in client and location timezones
- Detection: Monitor for appointments booked at unusual hours, timezone-related support tickets

**Risk: Recurring Appointment Complexity**
- Impact: Medium - Bugs in recurrence logic, DST issues
- Mitigation: Use battle-tested library (rrule), extensive tests including DST changes, limit supported recurrence patterns initially
- Detection: Monitor recurring appointments across DST boundaries, validate recurrence generation

**Risk: Buffer Time Conflicts**
- Impact: Low - Schedule gaps or overlaps
- Mitigation: Clear buffer time semantics, thorough tests, visual representation in calendar
- Detection: Monitor for complaints about scheduling tightness

### Data Integrity Risks

**Risk: Orphaned Appointments**
- Impact: Low - Appointments with deleted staff/services
- Mitigation: Soft delete staff and services, prevent deletion if future appointments exist
- Detection: Periodic integrity checks, alert on orphaned appointments

**Risk: Inconsistent Recurring Series**
- Impact: Low - Missing or extra instances in series
- Mitigation: Atomic transaction for series creation, validation of all instances
- Detection: Count instances per recurring_group_id, alert on unexpected counts

**Risk: Status Transition Violations**
- Impact: Low - Appointments in invalid states
- Mitigation: Enforce valid state transitions, use database constraints or enums
- Detection: Monitor for appointments in unexpected states

### Scalability Risks

**Risk: High Booking Volume**
- Impact: Performance degradation under load
- Mitigation: Database connection pooling, horizontal API scaling, read replicas, caching
- Measurement: Load testing target 1000 bookings/hour per instance

**Risk: Large Recurring Series**
- Impact: Database bloat, slow queries
- Mitigation: Limit max occurrences, archive completed appointments, pagination
- Alternative: Store recurrence rule only, generate instances on-demand (more complex)

## Estimated Effort

**Size: Large (4-5 weeks for 2 developers)**

**Breakdown:**
- Database schema and migrations: 2 days
- Availability calculation logic: 4 days
- Conflict detection and locking: 3 days
- Appointment CRUD operations: 3 days
- Recurring appointments: 4 days
- Group bookings: 2 days
- Status transitions and lifecycle: 2 days
- Cancellation and rescheduling: 3 days
- Policy enforcement: 2 days
- No-show handling: 1 day
- Unit tests: 5 days
- Integration tests: 4 days
- E2E tests: 3 days
- Performance testing and optimization: 3 days
- Edge case handling and bug fixes: 3 days
- Documentation: 2 days
- Buffer for unexpected complexity: 5 days

**Dependencies:**
- Auth module complete
- Staff module complete (availability management)
- Services module complete
- Locations module complete
- Clients module complete
- Notifications module (at least basic email)

**Critical Path:**
- Availability checking is blocking for booking
- Booking engine is blocking for calendar views
- Must be completed for MVP launch

## Owner Role

**Primary: Backend Developer (Senior or Mid-Level with strong concurrency knowledge)**

**Skills Required:**
- Strong understanding of relational databases and transactions
- Experience with concurrency and race condition prevention
- Database locking mechanisms (optimistic and pessimistic)
- Date/time handling including timezones
- Algorithm design and optimization
- Experience with booking or scheduling systems (preferred)
- NestJS or similar Node.js framework
- TypeScript
- PostgreSQL
- Unit, integration, and performance testing

**Secondary Roles:**
- Senior Backend Developer: Code review, concurrency architecture
- QA Engineer: Comprehensive concurrent testing, edge cases
- Product Manager: Define and validate booking policies

**Knowledge Transfer Required:**
- Document availability calculation algorithm with diagrams
- Document conflict detection and locking strategy
- Document recurring appointment generation process
- Create runbook for handling double-booking incidents (if they occur)
- Create runbook for appointment data recovery
