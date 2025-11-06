# admin-ui-frontend.md

## Task Title

Build Admin UI Frontend for Business Management

## Task Description

Develop a comprehensive admin dashboard interface for business owners and staff to manage their booking business. This interface enables configuration of business profiles, locations, services, staff members, client database, and analytics viewing. The admin UI must be responsive, accessible (WCAG 2.1 Level AA), and support role-based access control to show appropriate features based on user permissions.

The admin UI serves as the primary management interface for business owners after they complete onboarding. It must provide efficient workflows for common tasks such as adding new services, managing staff schedules, viewing client information, and monitoring business performance through analytics.

## Acceptance Criteria

### Business Profile Management

- Business owners can view and edit their business profile including name, description, contact information, business hours, and timezone
- Business profile form validates required fields (name, timezone, business type) before submission
- Changes to business profile are saved via API call to PUT /api/businesses/:businessId with optimistic UI updates
- Business profile displays current subscription tier and feature limits
- Business branding configuration allows upload of logo (max 2MB, PNG/JPG) and selection of primary brand color
- Business profile shows tenant isolation context (displays correct business data for multi-tenant users)
- Business profile changes trigger success notification with undo option available for 5 seconds

### Location Management

- Business owners can view list of all locations in a table or card grid view
- Location list displays name, address, phone, status (active/inactive), and quick action buttons
- Business owners can add new location via modal form with fields: name, address (autocomplete using Google Places API), phone, email, business hours per day, timezone
- Location form validates address format and ensures timezone is set
- Business owners can edit existing location with same form fields, pre-populated with current values
- Business owners can deactivate location (soft delete) with confirmation dialog warning about impact on future appointments
- Location details view shows associated staff members and services available at that location
- Multi-location businesses can set a primary location that appears as default in booking flows

### Service Catalog Management

- Business owners can view all services in a searchable, filterable table with columns: name, duration, price, category, status
- Service list supports filtering by category, status (active/inactive), and price range
- Service list supports sorting by name, duration, price, created date
- Business owners can add new service via form with fields: name, description, duration (15-min increments), price, category (from predefined list), buffer before/after, booking restrictions
- Service form validates required fields (name, duration, price) and ensures duration is between 15 minutes and 8 hours
- Business owners can edit existing service with all fields editable except service ID
- Business owners can duplicate service to create similar service with modified attributes
- Business owners can deactivate service with confirmation, preventing new bookings but preserving historical appointment data
- Service details view shows pricing tiers if applicable, staff members who can perform the service, and booking statistics (total bookings, revenue)
- Bulk actions allow deactivating or changing category for multiple services at once

### Staff Member Management

- Business owners can view all staff members in a list with avatar, name, role, email, phone, status, and availability indicator
- Staff list supports filtering by role (admin, staff, receptionist) and status (active/inactive/on-leave)
- Business owners can invite new staff member by email, specifying role and permissions
- Staff invitation flow sends email with invitation link, tracks invitation status (pending/accepted/expired)
- Business owners can edit staff member details including name, email, phone, role, permissions
- Business owners can assign services to staff member, specifying which services they are qualified to perform
- Business owners can assign locations to staff member, specifying which locations they work at
- Business owners can view staff member schedule and time-off requests
- Business owners can deactivate staff member with confirmation, which removes them from future scheduling but preserves historical data
- Staff member detail view shows statistics: upcoming appointments, completed appointments, average rating, total revenue generated
- Permission management UI allows granular control over staff capabilities (view-only, book-appointments, manage-clients, view-reports)

### Client Database

- Business owners can view all clients in a searchable table with columns: name, email, phone, total appointments, last appointment date, lifetime value
- Client list supports search by name, email, or phone with debounced API calls
- Client list supports filtering by total appointments (new/regular/VIP), last visit date range, and lifetime value range
- Client list supports sorting by name, last appointment, total appointments, lifetime value
- Business owners can view client detail page showing full profile, appointment history, notes, and preferences
- Client detail page displays appointment timeline with past and upcoming appointments
- Client detail page shows client notes (visible to all staff) with creation timestamp and author
- Business owners can add note to client profile with rich text support (bold, italic, lists)
- Business owners can manually add new client via form (name, email, phone, notes) for walk-in or phone bookings
- Business owners can edit client contact information
- Business owners can merge duplicate client profiles with conflict resolution for mismatched data
- Client detail page shows cancellation rate and no-show rate to identify problematic clients
- Bulk export allows downloading client list as CSV with selected fields

### Analytics Dashboard

- Dashboard displays key metrics in card layout: total revenue (current month), total appointments (current month), new clients (current month), average appointment value
- Each metric card shows comparison to previous period with percentage change and trend indicator (up/down arrow)
- Dashboard shows revenue chart with daily/weekly/monthly granularity toggle, displaying bar chart of revenue over time
- Dashboard shows appointment volume chart with daily/weekly/monthly granularity, displaying line chart of appointment count
- Dashboard shows top services by revenue in a horizontal bar chart (top 5 services)
- Dashboard shows top staff members by appointment count in a horizontal bar chart (top 5 staff)
- Dashboard shows client acquisition funnel: new clients, returning clients, lapsed clients (no appointment in 90 days)
- Dashboard shows appointment status breakdown in pie chart: completed, cancelled, no-show, upcoming
- Dashboard shows average booking lead time (days between booking and appointment) as single metric
- Dashboard allows date range selection with presets (today, this week, this month, last month, custom range)
- All charts support hover tooltips showing exact values
- Dashboard auto-refreshes data every 5 minutes or on manual refresh button click
- Dashboard is responsive and adapts layout for tablet and desktop views

### Settings and Configuration

- Settings page provides navigation to different configuration sections: business, notifications, integrations, billing
- Notification settings allow toggling email/SMS notifications for different event types (new booking, cancellation, reminder, review request)
- Notification settings show notification templates with preview and edit capability
- Integration settings display connected third-party services (Google Calendar, payment processors) with connection status and disconnect option
- Integration settings provide OAuth connection flow for Google Calendar, Facebook, Apple Sign-In
- Billing settings show current subscription tier, feature usage vs. limits, and upgrade/downgrade options
- Billing settings display payment method on file (last 4 digits of card) with option to update
- Billing settings show billing history with invoices downloadable as PDF
- Settings changes are saved immediately (auto-save) with visual confirmation
- Settings support role-based access: only business owners can access billing and integrations, staff can view notifications

### Navigation and Layout

- Admin UI uses sidebar navigation with collapsible menu showing main sections: Dashboard, Calendar, Appointments, Clients, Services, Staff, Analytics, Settings
- Navigation highlights current active section
- Top navigation bar shows business name, current user avatar with dropdown (profile, logout), and notification bell with unread count
- Notification panel shows recent activity (new bookings, cancellations, reviews) with timestamp and link to relevant detail page
- Layout is responsive: sidebar collapses to hamburger menu on mobile/tablet, content area takes full width
- All pages include breadcrumb navigation showing current location in hierarchy
- Loading states show skeleton screens for tables and content areas, not full-page spinners
- Error states show user-friendly error messages with retry actions where applicable

### Accessibility and UX

- All interactive elements have keyboard navigation support with visible focus indicators
- All form inputs have associated labels and error messages announced by screen readers
- Color contrast meets WCAG 2.1 Level AA requirements (4.5:1 for normal text, 3:1 for large text)
- All images and icons have appropriate alt text or aria-labels
- Modal dialogs trap focus and can be dismissed with Escape key
- Tables support keyboard navigation and screen reader table semantics
- Form validation shows inline error messages that are associated with inputs via aria-describedby
- Confirmation dialogs clearly explain the action and consequences
- Success/error notifications are announced to screen readers via aria-live regions

### Performance

- Initial page load (dashboard) completes in under 2 seconds on 3G connection
- Navigation between pages feels instant with optimistic UI updates and background data fetching
- Tables with large datasets (100+ items) use virtual scrolling or pagination to maintain 60fps scroll performance
- Images (logos, avatars) are lazy-loaded and compressed
- API calls are debounced for search inputs (300ms delay)
- Data tables cache results and only refetch on explicit user action or 5-minute staleness

## Implementation Details

### Technology Stack

- React 18 with TypeScript for type safety
- React Router for client-side routing with nested routes for admin sections
- React Query (TanStack Query) for server state management, caching, and optimistic updates
- Tailwind CSS for styling with custom design system configuration
- Headless UI for accessible component primitives (modals, dropdowns, tabs)
- React Hook Form with Zod validation for form management
- Recharts or Chart.js for analytics visualizations
- React Table (TanStack Table) for data tables with sorting, filtering, pagination
- Date-fns for date manipulation and formatting with timezone support

### Component Structure

The admin UI should be organized into feature-based modules:

- app: Main application shell with routing and layout
  - AdminLayout: Sidebar, top nav, notification panel
  - ProtectedRoute: Authentication and authorization wrapper
  - ErrorBoundary: Global error handling with fallback UI

- features/business: Business profile management
  - BusinessProfilePage: Main page component
  - BusinessProfileForm: Editable form with validation
  - BusinessBrandingSection: Logo upload and color picker
  - BusinessHoursEditor: Weekly hours configuration

- features/locations: Location management
  - LocationListPage: Table/grid view of locations
  - LocationFormModal: Add/edit location form
  - LocationDetailsPage: Single location view with staff and services
  - AddressAutocomplete: Google Places integration component

- features/services: Service catalog management
  - ServiceListPage: Searchable, filterable table
  - ServiceFormModal: Add/edit service form
  - ServiceDetailsPage: Service details with statistics
  - ServiceCategorySelect: Category dropdown with icons
  - BulkActionsToolbar: Bulk operations for selected services

- features/staff: Staff member management
  - StaffListPage: Staff member cards or table
  - StaffInviteModal: Email invitation form
  - StaffDetailsPage: Staff profile with schedule and stats
  - StaffPermissionsEditor: Granular permission checkboxes
  - ServiceAssignmentPanel: Assign services to staff
  - LocationAssignmentPanel: Assign locations to staff

- features/clients: Client database
  - ClientListPage: Searchable, filterable table
  - ClientDetailsPage: Full client profile and history
  - ClientFormModal: Add/edit client manually
  - ClientNotesPanel: Notes timeline with rich text editor
  - ClientMergeModal: Duplicate resolution UI
  - AppointmentHistoryTimeline: Past and upcoming appointments

- features/analytics: Analytics dashboard
  - AnalyticsDashboardPage: Main dashboard layout
  - MetricCard: Single metric with trend indicator
  - RevenueChart: Bar chart component
  - AppointmentVolumeChart: Line chart component
  - TopServicesChart: Horizontal bar chart
  - TopStaffChart: Horizontal bar chart
  - DateRangePicker: Custom date range selector

- features/settings: Settings and configuration
  - SettingsPage: Settings navigation and routing
  - NotificationSettings: Notification toggle configuration
  - NotificationTemplateEditor: Template customization
  - IntegrationSettings: OAuth connections display
  - BillingSettings: Subscription and payment management
  - InvoiceList: Billing history table

- shared/components: Reusable UI components
  - Button: Primary, secondary, danger variants
  - Input: Text, email, phone, number inputs with validation states
  - Select: Dropdown with search support
  - Modal: Accessible modal dialog
  - Table: Data table with sorting, filtering, pagination
  - Tabs: Tab navigation component
  - Badge: Status indicators
  - Avatar: User/business avatar with fallback initials
  - Toast: Success/error/info notifications
  - ConfirmDialog: Confirmation modal
  - FileUpload: Drag-and-drop file upload
  - RichTextEditor: WYSIWYG editor for notes

### State Management

- React Query manages all server state with query keys organized by feature (businesses, locations, services, staff, clients, analytics)
- Optimistic updates for mutations: UI updates immediately on user action, reverts on API error
- Query invalidation triggers refetch after mutations to ensure data consistency
- Global UI state (sidebar open/closed, modal visibility) managed with React Context or Zustand
- Form state managed locally in components using React Hook Form
- Auth state (current user, permissions) provided via AuthContext from parent app

### API Integration

All API calls use the endpoints defined in API-CONTRACTS.md:

- Business profile: GET/PUT /api/businesses/:businessId
- Business branding: POST /api/businesses/:businessId/branding (multipart form data for logo upload)
- Locations: GET /api/businesses/:businessId/locations, POST /api/businesses/:businessId/locations, PUT /api/locations/:locationId, DELETE /api/locations/:locationId
- Services: GET /api/businesses/:businessId/services, POST /api/businesses/:businessId/services, PUT /api/services/:serviceId, DELETE /api/services/:serviceId
- Staff: GET /api/businesses/:businessId/staff, POST /api/businesses/:businessId/staff/invite, PUT /api/staff/:staffId, DELETE /api/staff/:staffId
- Staff services: PUT /api/staff/:staffId/services (assign services)
- Staff locations: PUT /api/staff/:staffId/locations (assign locations)
- Clients: GET /api/businesses/:businessId/clients, GET /api/clients/:clientId, POST /api/clients, PUT /api/clients/:clientId
- Client notes: GET/POST /api/clients/:clientId/notes
- Client merge: POST /api/clients/merge
- Analytics: GET /api/businesses/:businessId/analytics with query params for date range and metrics
- Notifications settings: GET/PUT /api/businesses/:businessId/settings/notifications
- Integrations: GET /api/businesses/:businessId/integrations, POST /api/integrations/:provider/connect, DELETE /api/integrations/:integrationId
- Billing: GET /api/businesses/:businessId/billing, GET /api/businesses/:businessId/billing/invoices

API client configuration:
- Base URL from environment variable
- Authorization header with JWT Bearer token
- X-Tenant-ID header for multi-tenant isolation
- X-Correlation-ID header for request tracing
- Retry logic for network errors (3 retries with exponential backoff)
- Error handling with user-friendly error messages extracted from API error responses

### Routing Structure

Admin UI routes nested under /admin:

- /admin/dashboard - Analytics dashboard
- /admin/business - Business profile
- /admin/locations - Location list
- /admin/locations/:locationId - Location details
- /admin/services - Service list
- /admin/services/:serviceId - Service details
- /admin/staff - Staff list
- /admin/staff/:staffId - Staff details
- /admin/clients - Client list
- /admin/clients/:clientId - Client details
- /admin/analytics - Full analytics page
- /admin/settings - Settings with nested routes
- /admin/settings/notifications - Notification settings
- /admin/settings/integrations - Integration settings
- /admin/settings/billing - Billing settings

All routes protected by authentication guard that redirects to login if user not authenticated. Role-based guards restrict access to certain routes (billing only for business owners).

### Validation Rules

Form validation using Zod schemas:

Business profile validation:
- name: Required, 2-100 characters, no special characters except hyphen/apostrophe
- timezone: Required, must be valid IANA timezone
- phone: Optional, valid phone format (E.164)
- email: Required, valid email format
- businessType: Required, from predefined enum

Location validation:
- name: Required, 2-100 characters
- address: Required, must include street, city, state, postal code, country
- phone: Required, valid phone format
- timezone: Required, valid IANA timezone
- businessHours: Array of 7 day objects, each with isOpen boolean and hours array

Service validation:
- name: Required, 2-100 characters
- duration: Required, multiple of 15, between 15 and 480 (8 hours)
- price: Required, positive number with max 2 decimal places
- category: Required, from predefined category list
- bufferBefore: Optional, 0-60 minutes
- bufferAfter: Optional, 0-60 minutes

Staff validation:
- email: Required, valid email format, unique
- firstName: Required, 2-50 characters
- lastName: Required, 2-50 characters
- phone: Optional, valid phone format
- role: Required, from enum (admin, staff, receptionist)

Client validation:
- firstName: Required, 2-50 characters
- lastName: Optional, 2-50 characters
- email: Optional, valid email format
- phone: Required, valid phone format
- Must provide either email or phone (at least one contact method)

### Error Handling

- Network errors show toast notification with retry button
- Validation errors display inline below form fields with red border and error icon
- API errors extract error message from response body and show in toast or inline
- Unauthorized errors (401) redirect to login page
- Forbidden errors (403) show permission denied message with contact admin option
- Not found errors (404) show friendly "Resource not found" with navigation to relevant list
- Server errors (500) show generic error message with request ID for support
- Optimistic update failures revert UI to previous state and show error toast

## Test Scenarios

### Unit Tests

Business Profile Form:
- Input: User enters business name "Acme Salon"
- Expected Output: Form state updates, no validation errors
- Edge Cases: Empty name shows required error, 101-character name shows length error, special characters (!@#) show invalid format error

Service Duration Validation:
- Input: User enters duration 45 minutes
- Expected Output: Validation passes, value accepted
- Edge Cases: Duration 10 minutes shows error "must be multiple of 15", duration 500 minutes shows error "max 8 hours", non-numeric input shows error "must be number"

Location Address Autocomplete:
- Input: User types "123 Main St, New"
- Expected Output: Dropdown shows matching addresses from Google Places API
- Edge Cases: Empty input shows no suggestions, API error shows fallback message "Type address manually", selection populates all address fields (street, city, state, postal, country)

Staff Permission Checkboxes:
- Input: Business owner checks "manage-clients" permission
- Expected Output: Checkbox checked, permission added to staff member permissions array
- Edge Cases: Unchecking permission removes from array, disabling admin role shows warning "Cannot modify owner permissions"

### Integration Tests

Business Profile Update Flow:
- Input: User edits business name from "Acme" to "Acme Salon" and clicks Save
- Expected API Call: PUT /api/businesses/:businessId with body {"name": "Acme Salon"}
- Expected Output: Success toast "Business profile updated", UI shows new name, no page refresh
- Edge Cases: API returns 400 shows error toast with message, network error shows retry button, concurrent edit by another user shows conflict resolution dialog

Location Creation Flow:
- Input: User fills location form (name "Downtown", address via autocomplete, phone, hours) and clicks Create
- Expected API Call: POST /api/businesses/:businessId/locations with complete location object
- Expected Output: Success toast "Location added", modal closes, location list refetches and shows new location at top
- Edge Cases: Duplicate location name shows warning, missing required field prevents submission, API error shows error message in modal without closing

Service Bulk Deactivation:
- Input: User selects 5 services from table and clicks "Deactivate Selected"
- Expected Confirmation: Dialog shows "Deactivate 5 services? Future bookings will be prevented."
- Expected API Calls: 5 DELETE requests to /api/services/:serviceId (or single batch endpoint)
- Expected Output: Success toast "5 services deactivated", table refetches, deactivated services removed from view (if filtered for active)
- Edge Cases: One API call fails shows partial success message "4 of 5 services deactivated, 1 failed", network error allows retry

Staff Invitation Flow:
- Input: User enters staff email "john@example.com", selects role "staff", assigns 3 services, and clicks Send Invitation
- Expected API Call: POST /api/businesses/:businessId/staff/invite with email, role, serviceIds
- Expected Output: Success toast "Invitation sent to john@example.com", staff list shows pending invitation with status badge
- Edge Cases: Invalid email shows validation error, duplicate email shows "User already exists", invitation expires after 7 days shown in UI

Client Search and Filter:
- Input: User types "Smith" in search box, selects filter "VIP clients" (10+ appointments)
- Expected API Calls: GET /api/businesses/:businessId/clients?search=Smith&minAppointments=10 (debounced 300ms after typing stops)
- Expected Output: Table shows matching clients with highlighted search term, result count displayed
- Edge Cases: No results shows empty state "No clients found matching 'Smith'", clearing search refetches all clients, API error shows error message in table area

Analytics Date Range Change:
- Input: User changes date range from "This Month" to "Last Month"
- Expected API Call: GET /api/businesses/:businessId/analytics?startDate=2025-10-01&endDate=2025-10-31
- Expected Output: All charts and metrics update to show last month's data, comparison shows change from previous month (September)
- Edge Cases: Future date range shows warning, custom range with start after end shows validation error, loading shows skeleton screens on all charts

Client Note Addition:
- Input: User enters note "Client prefers morning appointments" with bold formatting and clicks Save
- Expected API Call: POST /api/clients/:clientId/notes with body containing note text and HTML formatting
- Expected Output: Note appears at top of notes timeline with current timestamp and current user as author, rich text formatting preserved
- Edge Cases: Empty note prevents submission, note exceeds 5000 characters shows warning, API error shows error toast and note not added

Integration OAuth Connection:
- Input: User clicks "Connect Google Calendar" button in integration settings
- Expected Flow: New window opens with Google OAuth consent screen, user approves, window closes, callback received
- Expected API Call: POST /api/integrations/google-calendar/connect with OAuth authorization code
- Expected Output: Success toast "Google Calendar connected", integration status changes to connected with green badge
- Edge Cases: User denies consent shows info message "Connection cancelled", OAuth error shows error message, token exchange fails shows "Failed to connect, try again"

### End-to-End Tests

Complete Business Setup Journey:
- Input: New business owner logs in for first time after registration
- Steps:
  1. Dashboard shows onboarding prompt "Complete your business setup"
  2. User navigates to business profile, fills in all required fields, uploads logo
  3. User navigates to locations, adds first location with address and hours
  4. User navigates to services, adds 3 services (Haircut, Color, Blowout)
  5. User navigates to staff, invites 2 staff members with service assignments
  6. Dashboard now shows "Setup complete" and ready to accept bookings
- Expected Outcome: Business is fully configured, ready for customers to book, onboarding checklist marked complete
- Verification: API calls verify business profile exists, location exists, 3 services exist, 2 staff invitations sent

Staff Management Workflow:
- Input: Business owner needs to add new staff member, assign services, and configure schedule
- Steps:
  1. Navigate to staff list, click "Invite Staff Member"
  2. Enter email, select role "staff", click Send
  3. Staff member receives email, clicks invitation link, completes registration
  4. Business owner navigates to staff member details page
  5. Assign 5 services from service list
  6. Assign 2 locations from location list
  7. View staff member schedule, verify assigned services appear in calendar
- Expected Outcome: Staff member can log in, see assigned services, appears in calendar for bookings
- Verification: Staff member can access system, bookings can be made for their assigned services

Client Lifecycle Management:
- Input: Business owner needs to manage client from first booking through repeat visits
- Steps:
  1. New booking creates client profile automatically (first appointment)
  2. Navigate to clients list, search for client by name
  3. Open client details page, view appointment history showing 1 completed appointment
  4. Add note "Allergic to certain products" to client profile
  5. Client books second appointment (returning client)
  6. View client details, history shows 2 appointments, lifetime value increased
  7. Client misses appointment, marked as no-show
  8. View client details, no-show rate now 33% (1 of 3)
- Expected Outcome: Complete client history tracked, notes preserved, metrics accurate
- Verification: Client profile shows all appointments, notes visible to all staff, metrics calculated correctly

Analytics and Reporting:
- Input: Business owner wants to review monthly performance and identify top services
- Steps:
  1. Navigate to analytics dashboard
  2. Verify date range set to "This Month"
  3. View total revenue metric, compare to last month (shows +15% growth)
  4. View appointment volume chart, identify busiest day of week
  5. View top services chart, see "Haircut" generates most revenue
  6. View top staff chart, see "Sarah" has most appointments
  7. Export revenue chart as image for presentation
  8. Change date range to "Last 3 Months" to see trend
- Expected Outcome: Business owner gains insights into performance, identifies top performers, makes data-driven decisions
- Verification: Metrics match raw appointment and payment data, charts render correctly, date range changes update all visualizations

Permission-Based Access Control:
- Input: Business owner and staff member with different roles access admin UI
- Steps (Business Owner):
  1. Log in as business owner, navigate to settings
  2. Access billing settings, view subscription and payment method
  3. Access integration settings, connect payment processor
  4. Navigate to staff list, edit staff permissions
- Steps (Staff Member):
  1. Log in as staff member with "staff" role
  2. Navigate to calendar (allowed), view assigned appointments
  3. Navigate to clients (allowed), view client details
  4. Attempt to navigate to billing settings, shows 403 forbidden
  5. Attempt to navigate to staff list, can view but cannot edit
  6. Attempt to change business settings, shows permission denied
- Expected Outcome: Business owner has full access, staff member has restricted access based on role
- Verification: API returns 403 for unauthorized requests, UI hides restricted navigation items, permission checks prevent actions

Multi-Location Service Assignment:
- Input: Business with 3 locations needs to configure which services are available at each
- Steps:
  1. Navigate to locations list, view all 3 locations
  2. Select "Downtown" location, open details
  3. In services tab, enable 5 services for this location
  4. Navigate to "Uptown" location, enable 3 different services
  5. Navigate to services list, view per-service location availability
  6. Customer booking flow shows only services available at selected location
- Expected Outcome: Service availability configured per location, booking respects location constraints
- Verification: Service detail page shows assigned locations, booking API validates location-service relationship

## Caveats and Risks

### Technical Risks

State Management Complexity:
- Risk: Admin UI has many interconnected entities (staff, services, locations) that need to stay synchronized
- Mitigation: Use React Query cache invalidation to automatically refetch related data after mutations, implement clear dependency graph for query invalidation
- Fallback: If cache invalidation becomes too complex, simplify by refetching all related queries after any mutation (performance trade-off)

Image Upload and Storage:
- Risk: Logo uploads may fail due to size limits, slow networks, or storage service outages
- Mitigation: Implement client-side image compression before upload, show upload progress indicator, provide retry mechanism
- Fallback: Allow business owners to use external image URL instead of uploading, or provide default placeholder logos

Analytics Performance:
- Risk: Analytics queries on large datasets may be slow, causing dashboard to load slowly
- Mitigation: Implement backend query optimization with proper indexes, use database materialized views for common metrics, cache results for 5 minutes
- Fallback: If dashboard load exceeds 3 seconds, show loading states for each metric independently so fast metrics appear first

Google Places API Rate Limits:
- Risk: Address autocomplete may hit Google Places API rate limits or incur high costs
- Mitigation: Debounce autocomplete requests (300ms), cache recent lookups in browser, only send requests for 3+ character inputs
- Fallback: Allow manual address entry without autocomplete, or integrate alternative geocoding service as backup

Third-Party Integration Reliability:
- Risk: OAuth flows for Google Calendar, payment processors may fail or change unexpectedly
- Mitigation: Implement error handling for all OAuth steps, provide clear error messages, log integration failures for debugging
- Fallback: Allow business owners to manually enter credentials for some integrations, or skip optional integrations

### UX Risks

Onboarding Complexity:
- Risk: New business owners may be overwhelmed by amount of configuration required before accepting bookings
- Mitigation: Implement onboarding wizard that guides through minimal setup (business profile, one location, one service), allow skipping optional steps
- Fallback: Provide demo mode with pre-populated data so owners can explore before configuring

Mobile Responsiveness:
- Risk: Admin UI has complex tables and forms that may be difficult to use on mobile devices
- Mitigation: Design mobile-first layouts with collapsible sidebars, vertical stacking of form fields, simplified mobile table views (cards instead of tables)
- Fallback: If mobile UX is suboptimal, display prominent message recommending desktop usage for admin tasks

Bulk Operations Performance:
- Risk: Bulk operations (deactivating 50 services) may take long time and block UI
- Mitigation: Show progress indicator during bulk operations, allow cancelling in-progress operations, show partial success results
- Fallback: Limit bulk operations to smaller batches (max 20 items), or move to background job with email notification on completion

Permission Confusion:
- Risk: Staff members may not understand why they cannot access certain features
- Mitigation: Show clear permission denied messages explaining role requirements, provide link to "Request Access" that notifies business owner
- Fallback: Simplify permission model to basic roles (owner, staff) instead of granular permissions if confusion persists

Client Data Privacy:
- Risk: Staff members may have excessive access to client personal data
- Mitigation: Implement role-based client data masking (staff see partial phone/email), audit log all client data access
- Fallback: Provide business owner setting to restrict client contact info visibility to certain roles

### Business Risks

Feature Scope Creep:
- Risk: Business owners may request many additional features that expand scope significantly
- Mitigation: Clearly define MVP feature set, create backlog for future enhancements, prioritize based on user impact
- Impact: May delay timeline if scope increases, need to balance feature requests with maintaining schedule

Browser Compatibility:
- Risk: Business owners may use outdated browsers that don't support modern React features
- Mitigation: Test on all major browsers (Chrome, Firefox, Safari, Edge), provide polyfills for older browser versions, show browser upgrade prompt for unsupported browsers
- Fallback: Define minimum browser versions (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+) and show unsupported message for older versions

Data Migration:
- Risk: Business owners switching from other booking systems need to import existing data
- Mitigation: Provide CSV import for clients and services, document import format requirements, validate data before import
- Fallback: If automated import proves complex, offer manual data entry or professional services for migration

## Estimated Effort

Large - 5 to 6 weeks for 2 frontend developers

Breakdown by feature:
- Business profile and settings: 3-4 days
- Location management: 3-4 days
- Service catalog: 5-6 days (includes bulk actions)
- Staff management: 5-6 days (includes invitation flow and permissions)
- Client database: 5-6 days (includes search, merge, notes)
- Analytics dashboard: 6-7 days (includes charts and date range)
- Shared components and layout: 4-5 days
- Integration with backend APIs: 3-4 days
- Responsive design and accessibility: 4-5 days
- Testing (unit, integration, E2E): 5-6 days
- Bug fixes and polish: 3-4 days

Total: 46-56 days, approximately 5-6 weeks with 2 developers working in parallel

## Owner Role

Frontend Developer with React expertise

Required skills:
- Strong proficiency in React, TypeScript, and modern JavaScript (ES6+)
- Experience with React Query or similar server state management libraries
- Experience with Tailwind CSS and responsive design
- Understanding of accessibility standards (WCAG 2.1 Level AA)
- Experience with form validation libraries (React Hook Form, Zod)
- Experience with data visualization libraries (Recharts, Chart.js)
- Understanding of RESTful API integration and error handling
- Experience with testing frameworks (Jest, React Testing Library, Cypress/Playwright)
- Familiarity with OAuth flows and third-party integrations
- Strong attention to UX details and design implementation

Nice to have:
- Experience building admin dashboards or SaaS applications
- Understanding of booking or scheduling domain
- Experience with Google Places API or geocoding services
- Knowledge of performance optimization techniques
- Experience with monorepo tooling if frontend and backend in same repo
