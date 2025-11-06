# calendar-ui-frontend.md

## Task Title

Build Calendar UI Frontend for Appointment Management

## Task Description

Develop an interactive calendar interface for business owners and staff to view, manage, and organize appointments. The calendar must support multiple view modes (day, week, month, resource/staff), provide intuitive appointment management through drag-and-drop and quick actions, display real-time updates as bookings occur, and offer efficient workflows for common tasks such as creating appointments, rescheduling, blocking time off, and updating appointment status. The calendar serves as the central operational hub for day-to-day business management.

The calendar UI must balance information density with usability, allowing staff to quickly understand their schedule at a glance while providing easy access to detailed appointment information. Real-time collaboration is critical as multiple staff members may view and update the schedule simultaneously.

## Acceptance Criteria

### View Mode Selection

- Calendar toolbar provides view mode selector with options: Day, Week, Month, Resource (multi-staff view)
- Selected view mode persists in user preferences, remembered on next login
- View mode changes smoothly with loading animation, no full page reload
- Each view mode optimized for different use cases: Day for detailed schedule, Week for weekly planning, Month for availability overview, Resource for multi-staff coordination
- Mobile displays simplified view selector with icons instead of labels

### Day View

- Day view displays single day schedule from business opening to closing hours
- Time axis shows hourly markers (8:00 AM, 9:00 AM, etc.) with 15-minute gridlines
- Current time indicator shows as horizontal red line that updates every minute
- Appointments displayed as colored blocks positioned at their start time with height proportional to duration
- Appointment blocks show client name, service name, and status badge (confirmed, pending, checked-in, completed, cancelled)
- Clicking appointment block opens appointment detail sidebar
- Empty time slots allow clicking to create new appointment (quick create popover)
- Blocked time (time-off, breaks) shown as hatched gray blocks with reason label
- Day navigation arrows (previous, next) or date picker for jumping to specific date
- Today button jumps to current date
- Multiple staff appointments shown in separate columns side-by-side (up to 3 staff, more requires Resource view)
- Day view scrolls to current time on load (8 AM if before opening, 5 PM if after closing)
- Day view performs smoothly with 50+ appointments per day (virtualization if needed)

### Week View

- Week view displays 7 days (Sunday-Saturday or Monday-Sunday based on locale) in columns
- Days labeled with day name and date number (Mon 6, Tue 7, etc.)
- Current day column highlighted with subtle background color
- Each day column shows appointments as blocks similar to day view but condensed
- Appointment blocks in week view show client name only or icon if space constrained
- Hovering appointment shows tooltip with full details (client, service, time, status)
- Clicking appointment opens detail sidebar
- Empty time slots clickable for quick appointment creation
- Week navigation arrows (previous week, next week) or date picker
- Week view shows hours from earliest appointment to latest closing time (dynamic range)
- All-day events or blocked days shown at top of day column
- Week view loads in under 2 seconds even with 200+ appointments across week

### Month View

- Month view displays full month in grid layout with 5-6 rows of weeks
- Each date cell shows day number and count of appointments (e.g., "3 appointments")
- Date cells with appointments show colored dots representing appointment statuses (green confirmed, yellow pending, red cancelled)
- Clicking date cell opens day view for that date or shows popover with appointment list
- Current date highlighted with border or background color
- Navigation arrows (previous month, next month) or month/year picker dropdown
- Days outside current month shown in lighter color (previous/next month overflow)
- Month view shows availability at a glance (busy days vs open days)
- Month view optionally shows blocked dates (holidays, time-off) with special marker
- Month view loads quickly even for months with 500+ total appointments

### Resource (Multi-Staff) View

- Resource view displays multiple staff schedules side-by-side in columns
- Staff columns show staff avatar, name, and role at column header
- Each staff column functions like individual day view with appointment blocks
- Staff columns can be filtered/hidden via staff selector in toolbar (toggle staff on/off)
- Resource view supports horizontal scrolling for 10+ staff members
- Staff order can be reordered via drag-and-drop on column headers
- Resource view useful for receptionists coordinating multiple staff schedules
- Clicking appointment in resource view opens detail sidebar showing staff assignment
- Empty slots in resource view allow creating appointment and assigning to specific staff
- Resource view shows which staff are available vs fully booked at specific times (visual comparison)
- Resource view optionally groups staff by location if multi-location business

### Appointment Display and Interaction

- Appointment blocks color-coded by status: Blue (confirmed), Yellow (pending), Green (checked-in), Purple (in-progress), Gray (completed), Red (cancelled)
- Appointment blocks show client name (truncated if long), service name or icon, time (start-end)
- Appointment blocks display status badge in corner (small colored dot or icon)
- Hovering appointment block shows tooltip with full details: client, service, staff, time, price, notes
- Right-clicking appointment opens context menu with quick actions: View Details, Reschedule, Cancel, Mark No-Show, Mark Completed
- Double-clicking appointment opens appointment detail sidebar for full editing
- Appointment blocks support keyboard navigation: Tab to next appointment, Enter to open, Arrow keys to move selection
- Long appointments (2+ hours) show full details within block, short appointments (15-30 min) show abbreviated info
- Conflicting appointments (overlapping time slots) stack horizontally or show warning indicator

### Drag-and-Drop Rescheduling

- Appointments can be dragged to new time slots within calendar to reschedule
- While dragging, appointment block follows cursor with semi-transparent style
- Valid drop zones highlight with green border, invalid zones (conflicts, outside business hours) show red
- Dropping appointment triggers reschedule confirmation modal showing old vs new time
- Reschedule modal allows sending notification to client about change
- Backend validates reschedule on drop, reverts drag if conflict or validation error
- Drag-and-drop works within day view and week view (not month view due to space constraints)
- Dragging appointment to different staff column (in resource view) reassigns staff member
- Drag-and-drop supports touch gestures on tablets (long-press to initiate drag)
- Optimistic update shows appointment in new position immediately, reverts on API error

### Quick Appointment Creation

- Clicking empty time slot opens quick create popover positioned near click location
- Quick create popover shows fields: Client (searchable dropdown), Service (dropdown), Staff (dropdown, pre-filled if clicked in staff column), Time (pre-filled from click), Notes
- Client search supports type-ahead with existing clients, or "Create New Client" option
- Service selection shows duration, automatically calculates end time
- Quick create popover has Save and Cancel buttons
- Pressing Enter saves, Escape cancels
- Quick create closes after successful save, shows success toast, appointment appears in calendar immediately
- Quick create validation prevents double-booking, shows error if conflict
- Quick create is optimized for speed, minimal clicks (3 clicks: select time, select client, save)
- Alternative: Quick create button in toolbar opens full appointment form modal for complex bookings

### Appointment Detail Sidebar

- Clicking appointment opens detail sidebar sliding from right side of screen
- Sidebar shows complete appointment information: appointment number, client details (name, email, phone), service details (name, duration, price), staff member, location, date and time, status, notes
- Sidebar includes client history section showing past appointments with this client
- Sidebar provides action buttons: Edit, Reschedule, Cancel, Mark No-Show, Mark Completed, Check In, Send Reminder
- Edit button opens full appointment edit form within sidebar
- Reschedule button opens date/time picker to select new slot
- Cancel button opens confirmation dialog with cancellation reason and refund options
- Status action buttons (Check In, Mark Completed) update status immediately with optimistic update
- Sidebar shows appointment timeline: created, confirmed, checked-in, completed timestamps
- Sidebar shows payment status: paid, unpaid, refunded, with payment method and amount
- Sidebar allows adding internal notes visible only to staff
- Sidebar has close button (X) or clicking outside sidebar closes it
- Sidebar content scrollable for long appointment details

### Appointment Creation Form (Full)

- Full appointment creation form available via "New Appointment" button in toolbar
- Form opens in modal or sidebar with comprehensive fields
- Required fields: Client, Service, Staff, Date, Start Time
- Optional fields: Location (multi-location), End Time (auto-calculated from service duration), Price Override, Deposit Amount, Internal Notes, Send Confirmation Email checkbox
- Client field supports searching existing clients or creating new client inline (expands to show name, email, phone fields)
- Service field dropdown with search, shows duration and price per service
- Staff field shows only staff qualified for selected service
- Date field uses calendar picker, Time field uses time picker or dropdown with 15-minute increments
- Location field shows only if business has multiple locations
- Price Override allows one-time pricing adjustments (discounts, special offers)
- Form validates for conflicts before submission, shows availability conflicts with option to proceed anyway (overbooking)
- Form submission creates appointment, sends confirmation email/SMS if checked, closes form, shows appointment in calendar
- Form supports keyboard shortcuts: Ctrl+Enter to save, Escape to cancel
- Form autosaves draft to local storage every 30 seconds (recoverable if browser crashes)

### Status Management

- Appointment status transitions follow workflow: Pending → Confirmed → Checked-In → In Progress → Completed
- Status can also transition to Cancelled or No-Show from any state
- Status changes available via context menu, detail sidebar, or bulk actions
- Bulk status update: Select multiple appointments (checkbox or Shift+Click), apply status change to all
- Status change triggers notifications: Cancelled sends cancellation email, Rescheduled sends update email
- Completed status prompts for review request (optional feature)
- No-Show status prompts for no-show policy action (fee charge, rebooking restriction)
- Status filtering in toolbar: Show All, Show Pending, Show Confirmed, Show Today, Show Cancelled
- Status badge on appointment blocks updates immediately when status changed
- Calendar view can filter by status to show only specific appointment types

### Time Blocking and Availability Management

- Staff can block time on calendar for breaks, lunch, time-off, holidays, meetings
- Blocked time created by clicking empty slot and selecting "Block Time" option
- Blocked time form shows: Reason (dropdown: Break, Lunch, Time Off, Meeting, Other), Start Time, End Time, Applies to Staff (select which staff), Recurrence (optional, daily/weekly)
- Blocked time appears as gray hatched blocks with reason label
- Blocked time prevents appointments from being booked during those periods
- Blocked time can be edited or deleted via right-click context menu
- Recurring blocked time (lunch every day 12-1 PM) creates series of blocks with option to edit single instance or entire series
- Calendar view can toggle visibility of blocked time (hide to declutter view)
- Time-off requests from staff members appear in calendar with "Pending Approval" badge until business owner approves

### Real-Time Updates and Collaboration

- Calendar receives real-time updates via WebSocket connection when appointments are created, modified, or cancelled
- New appointments from online bookings appear in calendar immediately with subtle animation
- Updates made by other users (receptionists, other staff) reflect in real-time without page refresh
- Real-time update shows toast notification: "New appointment booked: John Smith at 2:00 PM"
- Toast notifications dismissible and don't interrupt user workflow
- If user is editing appointment that another user also edits, show conflict warning with option to view other user's changes
- Real-time presence indicators show which appointments are currently being viewed by other users (small avatar badge)
- WebSocket connection resilient to network issues, automatically reconnects on disconnect, queues updates during offline period

### Calendar Filters and Search

- Toolbar provides filter options: Filter by Status, Filter by Staff, Filter by Service, Filter by Location
- Filters can be combined (e.g., show only confirmed appointments for staff member Sarah)
- Search bar allows searching appointments by client name, phone, email, appointment number
- Search results highlight matching appointments in calendar view or show list view
- Filter and search state persists in URL query parameters for shareable links
- Clear Filters button resets all active filters
- Filter dropdown shows count of appointments matching each filter option
- Filtered calendar view maintains responsiveness even with complex filter combinations

### Print and Export

- Print button in toolbar formats calendar for printing (removes UI chrome, optimizes for paper)
- Print preview shows day/week view in printer-friendly layout
- Export button allows downloading calendar data as PDF, CSV, or iCal format
- PDF export generates formatted schedule suitable for physical posting or sharing
- CSV export includes all appointment fields for import into spreadsheet or external system
- iCal export generates ICS file for importing into Google Calendar, Outlook, Apple Calendar
- Export options allow selecting date range and which appointments to include (status filters)

### Mobile Calendar Experience

- Mobile calendar uses single-day view as default (week/month too cramped on small screens)
- Mobile day view stacks appointments vertically with larger touch targets
- Mobile toolbar collapses into hamburger menu with view selection and filters
- Date navigation on mobile uses swipe gestures (swipe left for next day, swipe right for previous day)
- Mobile appointment blocks expand on tap to show full details (no sidebar, uses full-screen modal)
- Quick create on mobile opens full-screen form rather than popover
- Mobile calendar optimizes for portrait orientation, landscape shows more compact layout
- Mobile performance prioritized: aggressive caching, lazy loading, smooth scrolling

### Accessibility

- All calendar interactions keyboard accessible (arrow keys navigate dates/appointments, Enter to select, Escape to cancel)
- Time grid has proper ARIA labels and roles for screen readers
- Appointment blocks have descriptive aria-labels: "Appointment with John Smith for Haircut at 2:00 PM, confirmed"
- Focus indicators clearly visible on all interactive elements
- Color-coded appointments also have text labels for colorblind users
- High contrast mode supported for better visibility
- Screen reader announces real-time updates (new appointments, status changes)
- Keyboard shortcuts documented and available via Help modal (? key opens shortcuts)

### Performance

- Day view loads in under 1 second with 50+ appointments
- Week view loads in under 2 seconds with 200+ appointments
- Month view loads in under 1 second with 500+ appointments
- Calendar scrolling maintains 60fps even with many appointments
- Real-time updates don't cause UI janking or performance degradation
- Calendar uses virtualization for views with many appointments (only renders visible portion)
- Images (client avatars, staff avatars) lazy loaded and cached
- Calendar data cached locally with React Query, background refetch every 60 seconds

## Implementation Details

### Technology Stack

- React 18 with TypeScript for component development
- React Query for server state management and caching
- Tailwind CSS for styling with calendar-specific custom classes
- React Big Calendar or FullCalendar (if licensing allows) as calendar component foundation, or custom calendar implementation
- DnD Kit or React DnD for drag-and-drop functionality
- Date-fns for date manipulation and formatting with timezone support
- WebSocket client (Socket.io or native WebSocket) for real-time updates
- React Hook Form with Zod for appointment creation/edit forms
- Radix UI or Headless UI for accessible popovers, dropdowns, modals

### Component Structure

The calendar UI should be organized into feature-based modules:

- calendar: Main calendar components
  - CalendarPage: Main page container with toolbar and calendar area
  - CalendarToolbar: View selector, date navigation, filters, search, actions
  - CalendarGrid: Main calendar rendering component
  - DayView: Day view layout with time grid and appointments
  - WeekView: Week view layout with multiple day columns
  - MonthView: Month grid layout with date cells
  - ResourceView: Multi-staff column layout

- appointments: Appointment components
  - AppointmentBlock: Single appointment card/block in calendar
  - AppointmentTooltip: Hover tooltip with appointment details
  - AppointmentContextMenu: Right-click menu with quick actions
  - AppointmentDetailSidebar: Full appointment details panel
  - AppointmentForm: Create/edit appointment form
  - QuickCreatePopover: Quick appointment creation popover

- timeBlocking: Time blocking components
  - BlockedTimeBlock: Blocked time display in calendar
  - BlockTimeForm: Create/edit blocked time form
  - TimeOffRequestModal: Time-off request submission and approval

- shared: Shared calendar components
  - DatePicker: Calendar date picker
  - TimePicker: Time selection dropdown
  - TimeGrid: Reusable time axis grid (hourly markers, gridlines)
  - StatusBadge: Appointment status indicator
  - ClientSearchDropdown: Type-ahead client search
  - ServiceSelectDropdown: Service selection with details
  - StaffSelectDropdown: Staff member selection
  - CurrentTimeIndicator: Moving red line showing current time
  - LoadingSpinner: Calendar-specific loading states
  - EmptyState: Empty calendar state (no appointments)

- realtime: Real-time functionality
  - WebSocketProvider: WebSocket connection context
  - useRealtimeUpdates: Hook for subscribing to real-time events
  - RealtimeNotification: Toast notification for real-time updates
  - PresenceIndicator: Show which users are viewing appointments

- hooks: Custom React hooks
  - useCalendarData: Fetches and caches calendar appointments
  - useViewMode: Manages current view mode (day/week/month/resource)
  - useDateNavigation: Handles date navigation (previous, next, jump to date)
  - useAppointmentDragDrop: Implements drag-and-drop logic
  - useAppointmentActions: CRUD operations for appointments
  - useStatusTransitions: Handles appointment status changes
  - useCalendarFilters: Manages active filters and search
  - useCalendarExport: Handles export functionality
  - useKeyboardShortcuts: Implements keyboard navigation

### State Management

Calendar state managed with combination of React Query (server state) and local state (UI state):

Server state (React Query):
- Appointments query key: ["calendar", "appointments", {businessId, startDate, endDate, staffId, status}]
- Query fetches appointments for current view range (day, week, month)
- Query invalidated on appointment mutations (create, update, delete, status change)
- Optimistic updates applied immediately, reverted on error
- Background refetch every 60 seconds to catch external changes

Local state (React Context or Zustand):
- currentView: "day" | "week" | "month" | "resource"
- currentDate: Date (selected date for day view, or start of week/month)
- selectedAppointmentId: string or null (for detail sidebar)
- filters: {status: [], staffId: [], serviceId: [], locationId: []}
- searchQuery: string
- sidebarOpen: boolean
- selectedStaffIds: string[] (for resource view)

### Calendar Rendering Logic

Day View rendering:
- Calculate time slots from business opening to closing (e.g., 8 AM - 8 PM)
- Divide into 15-minute increments (48 slots for 12-hour day)
- Render time axis labels on left (8:00 AM, 8:15 AM, 8:30 AM, etc.)
- For each appointment, calculate position: top = (minutes from start / total minutes) * height, height = (duration / total minutes) * container height
- Handle overlapping appointments: detect conflicts, stack horizontally with reduced width
- Render blocked time blocks similarly to appointments but with different styling
- Update current time indicator every minute using setInterval

Week View rendering:
- Similar to day view but create 7 columns (one per day)
- Each column is mini day view with shared time axis
- Calculate appointment positions per day column
- Optimize by only rendering visible hours (earliest appointment to latest closing)

Month View rendering:
- Create 5-6 rows of 7 columns (35-42 cells for month grid)
- Each cell represents one day
- Fill in dates starting from first day of month, including overflow from previous/next months
- For each day cell, query appointments and show count or dots
- Clicking cell navigates to day view for that date

Resource View rendering:
- Similar to day view but create N columns (one per staff member)
- Each column shows that staff member's appointments
- Share time axis across all columns
- Allow horizontal scrolling if many staff members

### Drag-and-Drop Implementation

Using DnD Kit or React DnD:
- Make appointment blocks draggable with useDraggable hook
- Make time slots droppable with useDroppable hook
- On drag start, capture appointment ID and original time
- On drag over, calculate new time based on drop position (snap to 15-minute increments)
- Show drop indicator (green outline) on valid drop zone
- On drop, calculate new start time, call reschedule API with optimistic update
- On drag over different staff column (resource view), prepare to reassign staff
- Validate drop: check for conflicts, business hours, staff availability
- Revert drag on validation failure or API error with animation

### API Integration

API calls use endpoints from API-CONTRACTS.md:

Calendar data: GET /api/calendar?businessId=&view=&startDate=&endDate=&staffId=&locationId=
- Returns appointments, blocked times, business hours for date range
- Day view: fetch single day, Week view: fetch 7 days, Month view: fetch full month

Create appointment: POST /api/appointments with body {clientId, serviceId, staffId, locationId, startTime, endTime, notes, status}
Update appointment: PUT /api/appointments/:appointmentId with updated fields
Delete appointment: DELETE /api/appointments/:appointmentId
Reschedule appointment: PUT /api/appointments/:appointmentId/reschedule with {startTime, endTime, sendNotification}
Update status: PUT /api/appointments/:appointmentId/status with {status}

Block time: POST /api/blocked-time with {staffId, reason, startTime, endTime, recurrence}
Update blocked time: PUT /api/blocked-time/:blockId
Delete blocked time: DELETE /api/blocked-time/:blockId

Search appointments: GET /api/appointments/search?q=&businessId=

Export calendar: GET /api/calendar/export?format=&startDate=&endDate=&staffId=
- Formats: pdf, csv, ical
- Returns file download or data for client-side generation

### WebSocket Integration

Real-time updates via WebSocket:

Connection: wss://api.example.com/calendar?businessId=&token=
Events received:
- appointment.created: New appointment booked
- appointment.updated: Appointment modified
- appointment.cancelled: Appointment cancelled
- appointment.status_changed: Status updated
- blocked_time.created: Time blocked
- user.viewing: Another user viewing appointment (presence)

Event handling:
- On event, invalidate React Query cache for affected date range
- Show toast notification for user awareness
- Animate new/updated appointments in calendar view
- Update presence indicators for collaborative editing

Connection management:
- Auto-reconnect on disconnect with exponential backoff
- Queue events received during disconnect, replay on reconnect
- Heartbeat ping every 30 seconds to keep connection alive
- Graceful degradation: if WebSocket fails, fall back to polling (60s interval)

### Keyboard Shortcuts

Implement keyboard shortcuts for power users:

Navigation:
- Arrow Left: Previous day/week/month
- Arrow Right: Next day/week/month
- T: Jump to Today
- D: Switch to Day view
- W: Switch to Week view
- M: Switch to Month view
- R: Switch to Resource view

Actions:
- N: New appointment
- /: Focus search
- F: Open filters
- P: Print calendar
- Escape: Close modal/sidebar
- ?: Show keyboard shortcuts help

Appointment selection:
- Tab: Navigate to next appointment
- Shift+Tab: Navigate to previous appointment
- Enter: Open selected appointment details
- E: Edit selected appointment
- Delete: Cancel selected appointment

### Timezone Handling

All calendar times displayed in business timezone:
- Backend returns times in UTC
- Frontend converts to business timezone using date-fns-tz
- Business timezone stored in business configuration
- Time axis labels show timezone indicator (e.g., "8:00 AM PST")
- User's local timezone not used (prevents confusion)
- Calendar export (iCal) includes timezone information

### Error Handling

Network errors:
- Show error toast with retry button
- Cache last successful data, display stale data during outage
- Indicate stale data with banner "Last updated 5 minutes ago"

Validation errors:
- Double-booking attempt: Show error modal with conflict details, allow force-booking or select different time
- Outside business hours: Highlight invalid drop zone in red, prevent drop
- Staff unavailable: Show error, suggest alternative staff or time

Optimistic update failures:
- Revert UI changes with animation
- Show error toast explaining failure
- Preserve user's intended action for easy retry

WebSocket disconnection:
- Show banner "Connection lost. Retrying..."
- Fall back to polling while reconnecting
- Show success banner when reconnected

### Caching Strategy

React Query caching configuration:
- Calendar data: staleTime 60 seconds, cacheTime 5 minutes
- Optimistic updates applied instantly to cache
- Background refetch on window focus
- Invalidate cache on mutations
- Prefetch adjacent date ranges (week view prefetches previous/next weeks)

## Test Scenarios

### Unit Tests

Appointment Position Calculation:
- Input: Appointment from 9:00 AM to 10:00 AM, business hours 8 AM - 8 PM (12 hours = 720 minutes)
- Expected Output: Top position = (60 minutes / 720 minutes) * 100% = 8.33%, Height = (60 minutes / 720 minutes) * 100% = 8.33%
- Edge Cases: Appointment at start of day (top = 0%), appointment at end (top = 91.67%), 2-hour appointment (height = 16.67%)

Drag-and-Drop Time Calculation:
- Input: Drag appointment to position 200px from top, container height 720px, business hours 8 AM - 8 PM
- Expected Output: New start time = 8 AM + (200 / 720) * 720 minutes = 8 AM + 200 minutes = 11:20 AM, snapped to 11:15 AM (nearest 15-min)
- Edge Cases: Drag to position 0 = 8:00 AM, drag to position 720 = 8:00 PM, drag outside container rejected

Appointment Conflict Detection:
- Input: Existing appointment 2:00 PM - 3:00 PM, attempt to create appointment 2:30 PM - 3:30 PM (same staff)
- Expected Output: Conflict detected, returns {conflict: true, existingAppointment: {...}}
- Edge Cases: Back-to-back appointments (3:00 PM - 4:00 PM after 2:00 PM - 3:00 PM) = no conflict, overlapping by 1 minute = conflict

Date Navigation:
- Input: Current date November 6, 2025, user clicks "Next Day"
- Expected Output: Current date updates to November 7, 2025, calendar fetches appointments for Nov 7
- Edge Cases: Last day of month navigates to first day of next month, leap year February 29 handled correctly

### Integration Tests

Day View Rendering:
- Input: Load calendar with businessId, view=day, date=2025-11-06
- Expected API Call: GET /api/calendar?businessId=123&view=day&startDate=2025-11-06&endDate=2025-11-06
- Expected Output: Calendar renders with time axis 8 AM - 8 PM, 5 appointments displayed at correct positions
- Edge Cases: No appointments shows empty state, 50+ appointments renders performantly, API error shows error message

Appointment Drag-and-Drop Reschedule:
- Input: Drag appointment from 2:00 PM to 4:00 PM time slot in day view
- Expected API Call: PUT /api/appointments/:id/reschedule with {startTime: "2025-11-06T16:00:00Z", endTime: "2025-11-06T17:00:00Z", sendNotification: false}
- Expected Output: Appointment moves to 4:00 PM position immediately (optimistic), confirmation toast appears
- Edge Cases: Drop on conflicting slot shows error, drops outside business hours rejected, API error reverts position

Quick Create Appointment:
- Input: Click empty slot at 10:00 AM, select client "John Smith", select service "Haircut" (30 min), click Save
- Expected API Call: POST /api/appointments with {clientId, serviceId, staffId, startTime: "2025-11-06T10:00:00Z", endTime: "2025-11-06T10:30:00Z", status: "confirmed"}
- Expected Output: Popover closes, new appointment appears at 10:00 AM with blue color (confirmed), success toast
- Edge Cases: Conflict on save shows error, missing required field prevents save, pressing Escape cancels

Status Change Flow:
- Input: Right-click appointment, select "Mark Completed" from context menu
- Expected API Call: PUT /api/appointments/:id/status with {status: "completed"}
- Expected Output: Appointment color changes to gray, status badge updates to "Completed", confirmation toast appears
- Edge Cases: Status change to cancelled prompts confirmation, status change fails shows error and reverts

Real-Time Update Handling:
- Input: WebSocket receives event {type: "appointment.created", data: {appointmentId, startTime: "2025-11-06T15:00:00Z", clientName: "Jane Doe"}}
- Expected Output: New appointment appears at 3:00 PM in calendar with slide-in animation, toast notification "New appointment booked: Jane Doe at 3:00 PM"
- Edge Cases: Multiple rapid updates batched, updates for different dates ignored if not in current view, WebSocket disconnect falls back to polling

Week View Navigation:
- Input: User in week view showing Nov 3-9, clicks "Next Week" button
- Expected API Call: GET /api/calendar?businessId=123&view=week&startDate=2025-11-10&endDate=2025-11-16
- Expected Output: Calendar updates to show Nov 10-16 with smooth transition, 7 day columns loaded with appointments
- Edge Cases: Week spanning two months handled correctly, year boundary (Dec 30 - Jan 5) works

Month View Interaction:
- Input: User views month November 2025, clicks date cell "November 15"
- Expected Output: View switches to day view for November 15, calendar loads appointments for that day
- Edge Cases: Clicking date in overflow (previous/next month) navigates to that month, date with no appointments shows empty state in day view

Block Time Creation:
- Input: Click empty slot at 12:00 PM, select "Block Time", choose reason "Lunch", set duration 1 hour, click Save
- Expected API Call: POST /api/blocked-time with {staffId, reason: "lunch", startTime: "2025-11-06T12:00:00Z", endTime: "2025-11-06T13:00:00Z"}
- Expected Output: Gray hatched block appears at 12:00 PM labeled "Lunch", blocked time prevents appointments from being created in that slot
- Edge Cases: Blocked time overlapping existing appointment shows warning, recurring block time creates series

### End-to-End Tests

Daily Schedule Management:
- Input: Business owner logs in to view today's schedule
- Steps:
  1. Calendar loads in day view showing today's date
  2. Current time indicator shows red line at current time (e.g., 10:30 AM)
  3. User sees 8 appointments throughout the day
  4. User clicks appointment at 2:00 PM, detail sidebar opens
  5. User clicks "Check In" button, status changes to checked-in
  6. User closes sidebar, appointment color changes to green
  7. User scrolls down to 5:00 PM, clicks empty slot
  8. Quick create popover opens, user selects walk-in client, selects service, saves
  9. New appointment appears immediately at 5:00 PM
- Expected Outcome: Business owner manages schedule efficiently, status updates reflected, new appointment created
- Verification: All API calls succeed, UI updates immediately, no page refreshes needed

Multi-Staff Coordination:
- Input: Receptionist needs to schedule appointment considering availability of multiple staff members
- Steps:
  1. Receptionist switches to resource view, sees 4 staff columns
  2. User scans 2:00 PM time slot across all staff, sees 3 available, 1 busy
  3. User clicks available slot in "Sarah" column
  4. Quick create popover opens with Sarah pre-selected
  5. User fills client and service, saves appointment
  6. Appointment appears in Sarah's column at 2:00 PM
  7. User switches to week view, confirms appointment visible in Sarah's schedule
- Expected Outcome: Receptionist efficiently assigns appointment to available staff, coordination simplified
- Verification: Appointment assigned to correct staff member, visible in all views

Appointment Rescheduling:
- Input: Client calls to reschedule appointment from 2:00 PM to 4:00 PM
- Steps:
  1. Staff member searches client name in calendar search bar
  2. Appointment highlights in calendar (2:00 PM slot)
  3. Staff member drags appointment block to 4:00 PM slot
  4. Reschedule confirmation modal appears showing time change
  5. Staff member checks "Send notification to client" checkbox, clicks Confirm
  6. Appointment moves to 4:00 PM, reschedule email sent
  7. Client receives email with updated appointment time
- Expected Outcome: Appointment successfully rescheduled, client notified, calendar updated
- Verification: Appointment database record updated with new time, email sent log shows notification

Real-Time Collaboration:
- Input: Two staff members viewing calendar simultaneously, one makes changes
- Steps:
  1. Staff A and Staff B both have calendar open in day view
  2. Online booking creates new appointment at 3:00 PM
  3. Both calendars receive WebSocket update
  4. Both calendars show new appointment appear with animation
  5. Both users see toast notification "New appointment booked: John Doe at 3:00 PM"
  6. Staff A drags appointment to 3:30 PM
  7. Staff B's calendar updates to show appointment at 3:30 PM in real-time
- Expected Outcome: Real-time updates keep both users synchronized, no conflicts or stale data
- Verification: WebSocket events received and processed, optimistic updates applied, no page refreshes

Time-Off Request Management:
- Input: Staff member requests time off, business owner reviews and approves
- Steps:
  1. Staff member creates blocked time for full day (Nov 15) with reason "Vacation"
  2. Blocked time appears in calendar with "Pending Approval" badge
  3. Business owner receives notification of time-off request
  4. Business owner opens calendar, sees pending block time
  5. Business owner right-clicks block time, selects "Approve"
  6. Block time color changes to approved status, staff member receives approval notification
  7. Appointments can no longer be booked for staff member on Nov 15
- Expected Outcome: Time-off request workflow completed, staff schedule updated, appointments prevented
- Verification: Blocked time record updated with approved status, availability API excludes Nov 15

Month-to-Month Planning:
- Input: Business owner reviews next month's schedule to identify slow days
- Steps:
  1. User switches to month view, navigates to December 2025
  2. Month grid shows appointment counts per day (some days 10+, some days 2-3)
  3. User identifies Dec 10 as slow day (only 2 appointments)
  4. User considers running promotion for that day
  5. User clicks Dec 10 to open day view
  6. Day view shows large gaps in schedule confirming low bookings
  7. User notes this information for marketing planning
- Expected Outcome: Business owner gains insights into busy vs slow periods, makes informed decisions
- Verification: Month view accurately shows appointment counts, day view drill-down works

Mobile Calendar Usage:
- Input: Staff member checks schedule on mobile phone while away from desk
- Steps:
  1. Staff member opens calendar on iPhone Safari
  2. Calendar loads in mobile-optimized day view
  3. Staff member swipes left to view tomorrow's schedule
  4. Staff member taps appointment to view details
  5. Full-screen modal opens with appointment info
  6. Staff member taps "Check In" button to check in client
  7. Modal closes, appointment status updated, success toast appears
- Expected Outcome: Mobile calendar provides essential functionality, touch interactions work smoothly
- Verification: Mobile layout responsive, swipe gestures functional, no horizontal scrolling issues

Print Calendar for Front Desk:
- Input: Business owner wants to print weekly schedule to post at front desk
- Steps:
  1. User switches to week view for current week
  2. User clicks "Print" button in toolbar
  3. Print preview opens showing printer-friendly layout
  4. Week schedule formatted for portrait printing
  5. UI elements (toolbar, sidebars) removed from print layout
  6. User sends to printer, physical schedule printed
  7. User posts schedule at front desk for staff reference
- Expected Outcome: Printed schedule readable and professional, includes all necessary information
- Verification: Print layout optimized, all appointments visible, page breaks appropriate

## Caveats and Risks

### Technical Risks

Calendar Performance with Large Datasets:
- Risk: Rendering hundreds of appointments in week or month view may cause performance issues
- Mitigation: Implement virtualization to render only visible portion, lazy load appointment details, optimize React rendering with memoization
- Fallback: If performance poor, limit calendar view to smaller date ranges or reduce appointment detail shown in compact views

Drag-and-Drop Browser Compatibility:
- Risk: Touch-based drag-and-drop may not work consistently across mobile browsers
- Mitigation: Use well-tested drag-and-drop library (DnD Kit) with touch support, test on major mobile browsers
- Fallback: If drag-and-drop unreliable on mobile, disable feature and provide alternative reschedule button

WebSocket Connection Reliability:
- Risk: WebSocket connections may be blocked by firewalls or proxies, or drop frequently on mobile networks
- Mitigation: Implement auto-reconnect with exponential backoff, fall back to HTTP polling if WebSocket fails
- Fallback: Show user indicator when real-time updates unavailable, rely on periodic polling (60s interval)

Timezone Edge Cases:
- Risk: Daylight saving time transitions or timezone changes may cause appointment times to display incorrectly
- Mitigation: Use robust date library (date-fns-tz) that handles DST, always store times in UTC, test around DST transition dates
- Fallback: If timezone issues occur, provide manual override for business owners to correct displayed times

Complex Appointment Overlaps:
- Risk: Multiple overlapping appointments (triple-booked or more) may not render properly with limited space
- Mitigation: Implement smart stacking algorithm that prioritizes important appointments, allow horizontal scrolling for overflow
- Fallback: Show overlap indicator with appointment count, require clicking to expand and view all overlapping appointments

### UX Risks

Information Overload:
- Risk: Calendar with many appointments, filters, and features may overwhelm users
- Mitigation: Provide clean default view with minimal clutter, hide advanced features behind progressive disclosure, offer tooltips and onboarding
- Fallback: Provide simplified view mode with essential features only for less technical users

Mobile Calendar Limitations:
- Risk: Mobile calendar may be too constrained to show useful information, frustrating users
- Mitigation: Design mobile-first with focus on essential workflows (view today, check in, quick reschedule), avoid cramming too much info
- Fallback: Recommend desktop usage for complex scheduling tasks, provide mobile app as alternative with native UI

Appointment Status Confusion:
- Risk: Users may not understand appointment status workflow or what actions to take
- Mitigation: Provide clear status labels, tooltips explaining each status, automated status transitions where appropriate
- Fallback: Simplify status model to fewer states (confirmed, completed, cancelled) if full workflow too complex

Real-Time Update Fatigue:
- Risk: Constant notifications for every small change may distract users
- Mitigation: Batch notifications, allow users to configure notification preferences, only show high-priority updates
- Fallback: Make real-time notifications opt-in rather than default, or only show for user's own appointments

Keyboard Shortcut Discoverability:
- Risk: Power users may not discover keyboard shortcuts, missing productivity benefits
- Mitigation: Show keyboard shortcut hints in UI (e.g., "Press N for new appointment"), provide shortcuts cheat sheet modal
- Fallback: Ensure all actions accessible via mouse/touch, shortcuts are enhancement not requirement

### Business Risks

Calendar Sync with External Calendars:
- Risk: Users may expect two-way sync with Google Calendar or Outlook, which is complex to implement
- Mitigation: Phase 1 provides one-way export (iCal), document two-way sync as future feature
- Impact: May lose users who require bidirectional calendar sync

Multi-Timezone Business Operations:
- Risk: Businesses operating across multiple timezones may struggle with single-timezone calendar
- Mitigation: Display all times in primary business timezone with clear labeling, document multi-timezone support as advanced feature
- Fallback: Provide timezone converter tool within calendar for staff reference

Offline Calendar Access:
- Risk: Staff may need to access calendar without internet connection (mobile in poor coverage areas)
- Mitigation: Implement service worker caching for recent calendar data, show stale data with clear indication
- Limitation: Offline mode read-only, no appointment creation/editing, changes sync when connection restored

Calendar Customization Expectations:
- Risk: Different businesses may expect different calendar layouts or workflows
- Mitigation: Provide configuration options for common preferences (view mode default, time slot intervals, color schemes)
- Limitation: Highly custom workflows may not be supported, encourage feature requests for consideration

## Estimated Effort

Large - 5 to 6 weeks for 2 frontend developers

Breakdown by feature:
- Calendar grid rendering (day, week, month views): 6-7 days
- Resource view (multi-staff): 3-4 days
- Appointment blocks and styling: 3-4 days
- Drag-and-drop functionality: 5-6 days (complex)
- Quick create popover and full form: 4-5 days
- Appointment detail sidebar: 3-4 days
- Status management and workflow: 3-4 days
- Time blocking functionality: 3-4 days
- Real-time updates (WebSocket integration): 5-6 days
- Filters, search, and navigation: 4-5 days
- Print and export functionality: 3-4 days
- Mobile calendar optimization: 5-6 days
- Keyboard shortcuts and accessibility: 4-5 days
- API integration and error handling: 3-4 days
- Testing (unit, integration, E2E): 5-6 days
- Performance optimization: 3-4 days
- Bug fixes and polish: 3-4 days

Total: 57-72 days, approximately 5-6 weeks with 2 developers working in parallel (some features sequential)

## Owner Role

Frontend Developer with React and Calendar UI expertise

Required skills:
- Strong proficiency in React, TypeScript, and modern JavaScript (ES6+)
- Experience with React Query or similar server state management
- Deep understanding of complex UI layouts and positioning (CSS Grid, Flexbox)
- Experience with drag-and-drop libraries (DnD Kit, React DnD)
- Experience building calendar or scheduling interfaces
- Understanding of date/time handling and timezone complexity
- Knowledge of WebSocket or real-time communication patterns
- Strong performance optimization skills (virtualization, memoization, lazy loading)
- Experience with accessibility standards (WCAG 2.1 Level AA)
- Experience with testing frameworks (Jest, React Testing Library, Cypress/Playwright)
- Attention to detail for precise positioning and user interactions

Nice to have:
- Experience with FullCalendar or similar calendar libraries
- Understanding of appointment scheduling domain and workflows
- Experience with collaborative real-time applications
- Knowledge of printing and PDF generation from web UIs
- Experience with mobile touch interactions and gestures
- Familiarity with calendar standards (iCalendar, ICS format)
