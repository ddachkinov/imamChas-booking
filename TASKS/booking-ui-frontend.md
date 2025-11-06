# booking-ui-frontend.md

## Task Title

Build Customer-Facing Booking UI Frontend

## Task Description

Develop a customer-facing booking interface that allows clients to discover services, check availability, and book appointments with businesses. This interface must work as both a standalone booking page (unique URL per business) and an embeddable widget that businesses can integrate into their own websites via a simple JavaScript snippet. The booking UI must be optimized for conversion, mobile-responsive, accessible, and provide a seamless booking experience from service selection through confirmation.

The booking interface is the primary customer touchpoint and directly impacts booking conversion rates. It must minimize friction, clearly communicate available options, handle edge cases gracefully (no availability, fully booked), and provide confidence through clear confirmation and calendar integration.

## Acceptance Criteria

### Multi-Step Booking Flow

- Booking interface presents clear multi-step flow with visual progress indicator showing: Service, Date & Time, Details, Confirmation
- Each step is numbered and shows completion state (completed, current, upcoming)
- Users can navigate back to previous steps to change selections without losing data
- Forward navigation is blocked until current step is valid (required fields completed)
- On step navigation, page scrolls to top of booking interface smoothly
- Mobile view shows simplified progress indicator with step numbers only, no labels
- Booking state persists in browser session storage so page refresh preserves selections
- Abandoned bookings tracked via analytics to identify drop-off points in funnel

### Step 1: Service Selection

- Service selection screen displays all active services for the business in a grid or list layout
- Each service card shows service name, duration, price, and optional thumbnail image
- Services can be filtered by category using horizontal scrollable category chips (All, Haircut, Color, Spa, etc.)
- Service cards show "Popular" badge for most frequently booked services
- Clicking service card selects service and advances to next step
- If business has multiple locations, location selector appears before service selection
- Location selector shows location name, address, distance from user (if location permission granted), and phone
- Selected service and location shown in sticky header or sidebar throughout booking flow
- If no services available, show message "No services available at this time. Please contact us directly." with business phone/email

### Step 2: Staff Selection (Optional)

- If business has multiple staff members who can perform selected service, staff selection step appears
- Staff selection shows each qualified staff member with avatar, name, title, and optional bio
- Staff cards show "Soonest Available" label for staff member with nearest available slot
- "First Available" option appears at top, allowing system to select any available staff member
- If business owner disabled staff selection in settings, this step is skipped and system always uses first available
- Selected staff member shown in booking summary sidebar
- If only one staff member can perform service, this step is skipped and staff auto-selected

### Step 3: Date and Time Selection

- Date selection shows monthly calendar view with clearly marked available days (bold), partially available days (light), and unavailable days (disabled/grayed)
- Current date is highlighted with distinct style (blue border or background)
- User can navigate between months using previous/next arrows
- Selecting date loads available time slots for that date
- Time slot selector shows available slots in 15-minute increments (or service duration increments) in a vertical scrollable list
- Each time slot button shows time in 12-hour format (9:00 AM, 2:30 PM)
- Time slots grouped by time of day with headers: Morning (6 AM - 12 PM), Afternoon (12 PM - 5 PM), Evening (5 PM - 9 PM)
- If no slots available for selected date, show message "No availability on this date. Please choose another date."
- If no availability within next 30 days, show message "Fully booked for the next month. Please call us for availability." with business phone
- Loading state shows skeleton time slots while fetching availability
- Selected date and time shown in booking summary sidebar
- Timezone of business location displayed clearly (All times in Eastern Time)
- Optional "Flexible Time" toggle allows showing slots across multiple days (next 7 days with soonest available first)

### Step 4: Client Details

- Client details form collects first name (required), last name (required), email (required), phone (required)
- Email field validates format in real-time with inline error message
- Phone field auto-formats as user types (formats to US format: (555) 555-5555, international formats supported)
- Optional notes field allows client to add special requests or comments (max 500 characters, shows character count)
- If client is returning customer (identified by email), form pre-fills with existing client data
- Returning customer sees message "Welcome back, [FirstName]!" with pre-filled information
- Checkbox "Send me appointment reminders via SMS" (checked by default) for SMS opt-in
- Checkbox "I agree to the cancellation policy and terms of service" (required, links open in modal)
- Cancellation policy shown in modal with clear explanation of cancellation deadline (24/48/72 hours) and fees
- Form validation prevents submission until all required fields valid and terms checkbox checked
- "Book Appointment" button is prominent, using business brand color if configured

### Step 5: Confirmation

- Confirmation screen shows success message "Your appointment is booked!" with checkmark icon
- Confirmation displays complete booking details: service name, staff member name, date and time, location address
- Unique appointment number displayed prominently for reference
- Confirmation message "A confirmation email has been sent to [email]" with option to resend
- "Add to Calendar" buttons for Google Calendar, Apple Calendar, Outlook, with direct links or downloadable ICS file
- Google Calendar link opens Google Calendar with pre-filled event details
- "Download Calendar Invite" button generates ICS file with appointment details
- "What's Next" section explains next steps: check email for confirmation, arrive 10 minutes early, contact info for questions
- Business contact information displayed: phone, email, location address with Google Maps link
- Optional: If payment required, redirect to payment step before showing confirmation
- Social sharing buttons (optional) "Share your appointment" for Facebook, Twitter (low priority)
- "Book Another Appointment" button returns to service selection step
- "Go to Business Website" button links back to business website (if configured)

### Embeddable Widget Mode

- Widget can be embedded in any website using simple JavaScript snippet provided in admin UI
- Snippet format: <script src="https://booking.example.com/widget.js" data-business-id="abc123"></script> followed by <div id="booking-widget"></div>
- Widget renders within the specified div, inheriting business branding (colors, logo)
- Widget is responsive and adapts to container width (min width 320px for mobile, max width 800px)
- Widget uses iframe for isolation or shadow DOM to prevent CSS conflicts with parent site
- Widget height adjusts dynamically as user progresses through steps (no fixed height causing scrollbars)
- Widget loading shows branded spinner with business logo if available
- Widget communicates with parent page via postMessage for events (booking_started, booking_completed, booking_cancelled)
- Parent page can listen to events and trigger custom actions (e.g., show thank you message, track conversion in analytics)
- Widget supports light and dark mode based on parent page preference or business configuration
- Widget configuration options passed via data attributes: data-service-id (pre-select service), data-location-id (pre-select location), data-theme (light/dark/auto)

### Standalone Booking Page

- Each business has unique booking page URL: https://booking.example.com/[business-slug] or custom domain
- Standalone page shows business branding: logo, name, tagline, cover image at top
- Page is fully SEO optimized with proper meta tags: title, description, Open Graph tags for social sharing
- Page includes business description and contact information below booking interface
- Page footer shows "Powered by [Platform Name]" with link to main website (can be removed for premium plans)
- Page loads quickly (Lighthouse score 90+) with optimized images and minimal JavaScript
- Page supports deep linking: URLs can include pre-selected service, location (e.g., /acme-salon?service=haircut&location=downtown)
- Page uses business-configured subdomain if available (acme-salon.booking.example.com) or custom domain (book.acmesalon.com)

### Real-Time Availability Updates

- Time slot availability refreshes automatically every 60 seconds while user is on date/time step
- If selected time slot becomes unavailable while user is on details step, show warning banner "Your selected time is no longer available. Please choose another time."
- User must return to date/time step to select new slot before proceeding
- Real-time updates use polling or WebSocket connection to check availability
- If another client books same slot during checkout, first to submit wins, second sees conflict error and must select new time

### Mobile Optimization

- Entire booking flow optimized for mobile devices (320px width and up)
- Touch targets are minimum 44x44 pixels for easy tapping
- Form inputs use appropriate mobile keyboard types (email, tel, number)
- Date picker uses native mobile date picker when available for better UX
- Time slot selector uses mobile-optimized scrollable list with larger tap targets
- Booking summary shown in expandable panel on mobile to save screen space
- Progress indicator simplified on mobile (dots instead of labeled steps)
- Navigation buttons fixed at bottom of screen on mobile for easy access

### Accessibility

- All interactive elements keyboard navigable with visible focus indicators
- Form inputs have associated labels and ARIA attributes
- Error messages announced to screen readers via aria-live regions
- Calendar navigation accessible via keyboard (arrow keys to navigate dates, Enter to select)
- Color contrast meets WCAG 2.1 Level AA (4.5:1 for text)
- Skip link allows keyboard users to skip directly to booking form
- All images have alt text, decorative images have empty alt attribute
- Modal dialogs (cancellation policy, terms) trap focus and closable with Escape key

### Performance

- Initial booking page load completes in under 2 seconds on 3G connection
- Service list loads immediately, availability fetched in background
- Time slot availability API call returns in under 500ms
- Booking submission (creating appointment) completes in under 1 second
- Images lazy loaded and compressed (WebP format with JPEG fallback)
- JavaScript bundle size under 150KB gzipped for fast load on slow connections
- Widget script loads asynchronously and doesn't block parent page rendering

### Branding and Customization

- Booking interface uses business-configured brand colors for primary buttons and accents
- Business logo appears in header of standalone page and widget
- Business name and tagline displayed prominently
- Optional cover image or background pattern for visual appeal
- Font selection from predefined list (optional advanced feature)
- Custom CSS injection for businesses with premium plans (advanced customization)
- Preview mode in admin UI allows business owner to see booking interface before publishing

## Implementation Details

### Technology Stack

- React 18 with TypeScript for component development
- React Router for standalone booking page routing (not needed for widget)
- React Query for server state management and caching
- Tailwind CSS for styling with custom theme configuration per business
- Headless UI for accessible calendar and modal components
- React Hook Form with Zod validation for client details form
- Date-fns for date manipulation and formatting with timezone support
- React DatePicker or custom calendar component for date selection
- Iframe or Shadow DOM for widget isolation

### Component Structure

The booking UI should be organized into a self-contained module that works in both standalone and widget modes:

- booking: Main booking flow components
  - BookingApp: Main application wrapper, handles standalone vs widget mode
  - BookingWizard: Multi-step wizard with state management
  - ProgressIndicator: Step progress visualization
  - BookingSummary: Sticky sidebar or expandable panel showing selections
  - BackButton: Navigate to previous step

- steps: Individual booking steps
  - LocationSelectionStep: Multi-location picker (conditional)
  - ServiceSelectionStep: Service grid with category filters
  - StaffSelectionStep: Staff member selection (conditional)
  - DateTimeSelectionStep: Calendar and time slot picker
  - ClientDetailsStep: Client information form
  - ConfirmationStep: Booking confirmation and next steps

- components: Reusable booking UI components
  - ServiceCard: Individual service display with image, name, price, duration
  - CategoryFilter: Horizontal scrollable category chips
  - Calendar: Monthly calendar with available/unavailable dates
  - TimeSlotPicker: Scrollable list of available time slots
  - StaffCard: Staff member card with avatar, name, bio
  - ClientForm: Client details form with validation
  - CancellationPolicyModal: Terms and cancellation policy display
  - AddToCalendarButtons: Calendar integration buttons
  - RealTimeAvailabilityIndicator: Shows when availability last updated
  - BusinessHeader: Business branding display (logo, name, cover)
  - LoadingSpinner: Branded loading indicator

- widget: Widget-specific components
  - WidgetContainer: Iframe or shadow DOM container
  - WidgetLoader: Initial loading state for widget
  - WidgetPostMessage: Parent-child communication handler

- hooks: Custom React hooks
  - useBookingState: Manages booking flow state (selected service, staff, date, time, client info)
  - useAvailability: Fetches and caches availability data with real-time updates
  - useBusinessConfig: Fetches business configuration (branding, settings, policies)
  - useStepValidation: Validates current step before allowing navigation
  - useAutoSave: Persists booking state to session storage
  - useTimezoneConverter: Converts times to business timezone

### Booking Flow State Management

Booking state stored in React Context or Zustand store with the following structure:

BookingState:
- businessId: string (required)
- locationId: string or null (null if single location)
- serviceId: string or null (selected service)
- staffId: string or null (null for "first available")
- appointmentDate: Date or null (selected date)
- appointmentTime: string or null (selected time slot)
- clientInfo: object with firstName, lastName, email, phone, notes, smsOptIn
- step: number (current step: 1-5)
- confirmedAppointment: object or null (appointment details after successful booking)

State transitions:
- Service selection sets serviceId, advances to staff/date-time step
- Staff selection sets staffId, advances to date-time step
- Date selection sets appointmentDate, loads time slots
- Time selection sets appointmentTime, advances to client details
- Form submission creates appointment, advances to confirmation
- Back button decrements step, preserves selections
- Session storage persists entire state object on every change

### API Integration

API calls use public and authenticated endpoints from API-CONTRACTS.md:

Business configuration: GET /api/public/businesses/:businessSlug (returns business details, branding, locations, settings)
Services: GET /api/public/businesses/:businessId/services (returns active services with filtering)
Staff: GET /api/public/services/:serviceId/staff (returns staff qualified for service, conditionally shown)
Availability: GET /api/public/availability?businessId=&serviceId=&staffId=&locationId=&date= (returns available time slots)
Create appointment: POST /api/public/appointments (creates appointment with client details, service, staff, time)
Client lookup: GET /api/public/clients/lookup?email= (returns existing client data for pre-fill)

Availability API response format:
- Array of available time slots with start time, end time, available capacity
- Slot format: {startTime: "2025-11-06T14:00:00Z", endTime: "2025-11-06T15:00:00Z", available: true}
- Timezone: All times in business timezone, converted to UTC for API calls

Appointment creation request format:
- businessId, locationId, serviceId, staffId (or null), startTime, endTime
- client: {firstName, lastName, email, phone, notes, smsOptIn}
- source: "widget" or "booking_page"
- Returns: Appointment object with appointmentNumber, confirmationStatus, id

Error handling:
- Network errors show friendly message with retry button
- Validation errors show inline on form fields
- Availability conflicts show warning banner with action to reselect time
- 409 Conflict (double booking) returns user to date/time step with error message
- 400 Bad Request shows specific validation errors from API response

### Widget Implementation

Widget deployment:
- Widget script (widget.js) loads asynchronously via script tag
- Script reads data attributes from script tag or div: data-business-id, data-service-id, data-location-id, data-theme
- Script creates iframe or shadow DOM inside target div
- Iframe source points to widget route: /widget/:businessId with query params for pre-selections
- Widget rendered as separate React app with same booking components

Widget communication:
- Widget posts messages to parent window: {type: "booking_started", data: {serviceId}}, {type: "booking_completed", data: {appointmentNumber}}, {type: "booking_cancelled"}
- Parent window listens: window.addEventListener("message", (event) => {if (event.data.type === "booking_completed") {track conversion}})
- Widget listens for messages from parent: {type: "set_theme", theme: "dark"}, {type: "preselect_service", serviceId: "123"}

Widget styling:
- Widget inherits business brand colors from API configuration
- Widget CSS scoped to prevent conflicts with parent page styles
- Shadow DOM encapsulation ensures complete style isolation
- Widget supports CSS custom properties for color overrides: --primary-color, --secondary-color

Widget embedding example admin UI provides:
- Code snippet with business ID pre-filled
- Visual preview of widget in iframe
- Configuration options: pre-select service, hide staff selection, theme, language
- Installation instructions for different platforms (WordPress, Shopify, Wix, custom HTML)

### Validation Rules

Client details form validation using Zod:

- firstName: Required, 2-50 characters, letters, spaces, hyphens, apostrophes only
- lastName: Required, 2-50 characters, letters, spaces, hyphens, apostrophes only
- email: Required, valid email format (RFC 5322), max 254 characters
- phone: Required, valid phone format, supports international formats with country code
- notes: Optional, max 500 characters
- smsOptIn: Boolean, default true
- termsAccepted: Required, must be true to submit

Validation triggers:
- Real-time validation on blur for each field
- Form-wide validation on submit
- Inline error messages below each invalid field
- Submit button disabled until all validations pass

### Timezone Handling

Business timezone from business configuration determines all displayed times:
- API returns times in UTC
- Frontend converts UTC to business timezone using date-fns-tz
- Calendar shows dates in business timezone
- Time slots show times in business timezone with timezone indicator (e.g., "2:00 PM EST")
- Appointment confirmation shows date and time in business timezone
- Calendar invites (ICS files) include timezone information for proper conversion

### Error Handling and Edge Cases

No availability scenarios:
- Selected date has no slots: Show message on time slot picker, suggest nearby dates with availability
- Next 30 days fully booked: Show contact information, suggest calling for waitlist
- Service discontinued: Show error on service selection, remove from list
- Staff member no longer available: Fall back to "first available" or show error if no other staff

Booking conflicts:
- Slot selected by another user before submission: Show error banner, force reselect time slot
- Staff member goes on leave after slot shown: Slot becomes unavailable, force reselect
- Location closes unexpectedly: Show error, redirect to location selection

Form abandonment recovery:
- State persisted to session storage every 5 seconds
- On return, show prompt "Would you like to continue your booking?" with option to resume or start over
- Session expires after 24 hours
- Clear session storage after successful booking

Payment required bookings:
- If service requires upfront payment, show payment step after client details
- Payment step uses payment integration (Stripe) before creating appointment
- Payment failure allows retry or returns to previous step
- Successful payment creates appointment atomically (payment + appointment in transaction)

## Test Scenarios

### Unit Tests

Service Card Component:
- Input: Service object {name: "Haircut", duration: 30, price: 50, category: "Hair"}
- Expected Output: Card renders with name, "30 min", "$50.00"
- Edge Cases: Missing price shows "Contact for pricing", missing image shows placeholder, long service name truncates with ellipsis

Calendar Date Selection:
- Input: User clicks date November 15, 2025
- Expected Output: Date selected, state updates, time slot API called with date parameter
- Edge Cases: Clicking disabled date does nothing, clicking current selected date does nothing, clicking different date replaces selection

Time Slot Availability Display:
- Input: API returns 10 available slots for selected date
- Expected Output: 10 time slot buttons rendered, grouped by time of day (Morning, Afternoon, Evening)
- Edge Cases: No slots shows message, 100+ slots scrollable, loading shows skeleton, API error shows retry button

Client Details Form Validation:
- Input: User enters firstName "John", lastName "Smith", email "john@example", phone "555-1234"
- Expected Output: firstName and lastName valid (green checkmark), email invalid (format error), phone invalid (too short)
- Edge Cases: Empty required fields show "Required" error, email "test@test" invalid (no TLD), phone "(555) 555-5555" valid (formatted)

### Integration Tests

Complete Booking Flow:
- Input: User selects service "Haircut", selects date tomorrow, selects time 2:00 PM, fills client form, submits
- Expected API Calls:
  1. GET /api/public/businesses/:businessSlug (on load)
  2. GET /api/public/businesses/:businessId/services (on service step)
  3. GET /api/public/availability?serviceId=&date= (on date selection)
  4. POST /api/public/appointments with complete booking data
- Expected Output: Confirmation screen shows appointment number, email confirmation sent
- Edge Cases: Network error on any step shows retry, validation error shows inline messages, availability conflict shows reselect prompt

Location and Service Selection:
- Input: Business with 2 locations, user selects "Downtown" location, sees 5 services, selects "Massage"
- Expected API Calls:
  1. GET /api/public/businesses/:businessSlug (returns locations)
  2. GET /api/public/businesses/:businessId/services?locationId=downtown (filters services by location)
- Expected Output: Service selection shows only services available at Downtown location
- Edge Cases: Location with no services shows "No services available at this location"

Staff Selection Flow:
- Input: Service can be performed by 3 staff members, user views staff cards, selects "Sarah"
- Expected Output: Staff selection advances to date/time step, availability filtered to Sarah's schedule
- Expected API Call: GET /api/public/availability?serviceId=&staffId=sarah&date=
- Edge Cases: "First Available" shows slots from all staff, business with one staff skips step entirely

Returning Client Pre-fill:
- Input: User enters email "existing@example.com" that matches existing client
- Expected API Call: GET /api/public/clients/lookup?email=existing@example.com
- Expected Output: Form pre-fills firstName "Jane", lastName "Doe", phone "(555) 123-4567", shows "Welcome back, Jane!"
- Edge Cases: New email shows empty form, API error shows form without pre-fill, client can edit pre-filled data

Real-Time Availability Conflict:
- Input: User selects time slot 2:00 PM, proceeds to details step, slot becomes unavailable (booked by someone else)
- Expected Flow: Availability polling detects conflict, warning banner appears "Your selected time is no longer available"
- Expected Output: User must click "Choose New Time" button, returns to date/time step, 2:00 PM slot no longer shown
- Edge Cases: Multiple slots become unavailable, user notified for each, selected date fully books shows message

Session Recovery:
- Input: User selects service "Haircut", date tomorrow, time 3:00 PM, closes browser
- Expected Storage: Session storage contains {serviceId, date, time, step: 3}
- Expected Output: User returns, prompt shows "Continue your booking for Haircut on [date] at 3:00 PM?", clicking yes resumes at step 3
- Edge Cases: Session older than 24 hours doesn't prompt, user clicks "Start over" clears storage, successful booking clears storage

### End-to-End Tests

First-Time Customer Booking Journey:
- Input: New customer visits standalone booking page for first time
- Steps:
  1. Page loads with business branding (logo, name, cover image)
  2. User views service list, filters by "Hair" category
  3. User selects "Women's Haircut"
  4. User selects date (tomorrow), sees 15 available time slots
  5. User selects time 10:00 AM
  6. User fills client form (new customer, no pre-fill)
  7. User checks SMS opt-in and terms checkbox
  8. User clicks "Book Appointment"
  9. Confirmation screen appears with appointment number
  10. User clicks "Add to Google Calendar", opens Google Calendar with event
- Expected Outcome: Appointment created, confirmation email sent, calendar invite works, user satisfied
- Verification: Database shows new appointment with correct details, new client profile created, email sent log shows confirmation

Returning Customer Booking:
- Input: Returning customer with booking history visits page
- Steps:
  1. User enters email on client details step
  2. Form pre-fills with existing data
  3. User sees "Welcome back, Sarah!" message
  4. User edits notes to add "Please use organic products"
  5. User completes booking
  6. Confirmation shows appointment history "Your 5th visit with us!"
- Expected Outcome: Existing client updated with new notes, appointment linked to existing client profile
- Verification: Client profile shows 5 appointments total, new notes saved, no duplicate client created

Multi-Location Business Booking:
- Input: Business with 3 locations (Downtown, Uptown, Mall), each with different services and staff
- Steps:
  1. User sees location selector as first step
  2. User views location cards showing address and distance
  3. User selects "Downtown" location
  4. Service list shows 8 services available at Downtown
  5. User selects service, proceeds through flow
  6. Confirmation shows correct location address
- Expected Outcome: Appointment created with correct location, staff assigned from Downtown location only
- Verification: Appointment.locationId matches Downtown, staff member assigned to Downtown location

Staff Selection Preference:
- Input: User has preference for specific staff member "Jessica"
- Steps:
  1. User selects service "Facial"
  2. Staff selection step shows 3 qualified staff
  3. User sees "Soonest Available" badge on "Michael" (has slot today)
  4. User selects "Jessica" despite later availability (tomorrow)
  5. Date/time step shows Jessica's availability only
  6. User books appointment with Jessica for tomorrow
- Expected Outcome: Appointment assigned to Jessica, not Michael
- Verification: Appointment.staffId matches Jessica's ID, confirmation email mentions Jessica

No Availability Scenario:
- Input: Popular business fully booked for next 30 days
- Steps:
  1. User selects service "Popular Service"
  2. Calendar shows next 30 days, all dates grayed out or marked as unavailable
  3. User clicks various dates, all show "No availability on this date"
  4. Message appears "Fully booked for the next month. Please call us at (555) 123-4567"
  5. User clicks phone number, initiates phone call (mobile) or copies number
- Expected Outcome: User understands no online availability, has clear path to contact business
- Verification: No errors thrown, graceful degradation, business contact info displayed

Booking Conflict Handling:
- Input: Two users simultaneously attempt to book last available slot at 2:00 PM
- Steps:
  1. User A selects 2:00 PM slot, proceeds to client details
  2. User B selects 2:00 PM slot (still shown as available), proceeds to client details
  3. User A submits booking first (API call succeeds)
  4. User B submits booking (API returns 409 Conflict)
  5. User B sees error banner "This time is no longer available. Please choose another time."
  6. User B returns to date/time step, 2:00 PM slot no longer shown
  7. User B selects 3:00 PM slot, completes booking successfully
- Expected Outcome: Only one booking at 2:00 PM (User A), User B successfully books alternative time
- Verification: Database shows one appointment at 2:00 PM, one at 3:00 PM, no double booking

Widget Embedding in External Website:
- Input: Business owner embeds widget on their WordPress website
- Steps:
  1. Admin copies widget snippet from admin UI
  2. Admin pastes snippet into WordPress page HTML widget
  3. Page publishes, widget loads on business website
  4. Customer visits business website, sees embedded booking widget
  5. Customer completes booking through widget
  6. Confirmation appears within widget, no redirect
  7. Parent page analytics tracks booking_completed event via postMessage
- Expected Outcome: Widget works seamlessly in external site, styled consistently, no CSS conflicts
- Verification: Booking created with source "widget", parent page received postMessage event, widget isolated in iframe/shadow DOM

Mobile Booking Experience:
- Input: User books appointment on mobile device (360px width screen)
- Steps:
  1. Page loads quickly on mobile network (3G)
  2. Service cards stack vertically, easy to tap
  3. Calendar uses mobile date picker (native or custom optimized)
  4. Time slots display in large tap-friendly buttons
  5. Form inputs use mobile keyboard types (email keyboard, phone keyboard)
  6. Booking summary expandable panel saves screen space
  7. "Book Appointment" button fixed at bottom for easy access
  8. Confirmation screen formats well on small screen
- Expected Outcome: Entire flow optimized for mobile, high conversion rate
- Verification: Lighthouse mobile score 90+, touch targets meet 44px minimum, no horizontal scroll

## Caveats and Risks

### Technical Risks

Widget Cross-Domain Issues:
- Risk: Browsers may block widget functionality due to third-party cookie restrictions or CORS issues
- Mitigation: Use iframe with proper CORS headers, ensure all API calls from widget domain, store session in iframe context not parent
- Fallback: If widget has issues, provide "Book Now" button that opens standalone page in new tab

Real-Time Availability Race Conditions:
- Risk: Availability can change between display and booking submission, leading to conflicts
- Mitigation: Implement optimistic locking on backend, show clear error on conflict with easy recovery path
- Fallback: If conflicts frequent, reduce availability polling frequency or show warning "Availability may have changed"

Calendar Integration Reliability:
- Risk: Add to Calendar links may fail for some email clients or calendar apps
- Mitigation: Provide universal ICS file download, test with major clients (Gmail, Outlook, Apple Calendar)
- Fallback: Show manual instructions for adding to calendar with date/time/location details to copy

Session Storage Limitations:
- Risk: Private browsing or browser settings may disable session storage, breaking state persistence
- Mitigation: Detect storage availability on load, fallback to in-memory state if unavailable
- Impact: Users lose progress on page refresh, but flow still works within single session

Third-Party Script Blocking:
- Risk: Ad blockers or privacy tools may block widget script from loading
- Mitigation: Host widget on same domain as API to avoid being flagged as tracking script, use descriptive script name (booking-widget.js not tracking.js)
- Fallback: Detect widget load failure, show fallback "Book Now" link to standalone page

### UX Risks

Complex Location/Service Combinations:
- Risk: Multi-location businesses with many services may overwhelm users with choices
- Mitigation: Provide search and filtering, show popular services first, allow deep linking to pre-select options
- Fallback: Business can configure simplified booking mode with fewer options, or hide less popular services

Mobile Form Input Frustration:
- Risk: Mobile users may struggle with form input, leading to abandonment
- Mitigation: Use mobile-optimized keyboards, implement autofill, minimize required fields, show clear validation
- Fallback: Offer "Book by Phone" option prominently for users who prefer phone booking

Timezone Confusion:
- Risk: Customers may confuse booking time with their local timezone vs business timezone
- Mitigation: Clearly display business timezone on every screen showing times, show timezone conversion for out-of-area customers
- Fallback: Send confirmation email with time in both business timezone and customer timezone (if detectable)

Fully Booked Frustration:
- Risk: Users may be frustrated if no availability shown, leading to negative perception
- Mitigation: Show next available date prominently, offer waitlist or notification when slot opens
- Fallback: Provide clear contact information for phone booking or cancellation waitlist

Abandoned Booking Communication:
- Risk: Users may start booking but abandon, business misses opportunity to recover
- Mitigation: Capture email early in flow (optional), send abandoned booking reminder with link to resume
- Caveat: Privacy concerns with capturing data before booking confirmed, may require consent

### Business Risks

Conversion Rate Optimization:
- Risk: Poor booking flow design may lead to low conversion rates, hurting business
- Mitigation: A/B test different flows, minimize steps, reduce friction, provide clear progress
- Measurement: Track funnel drop-off at each step, identify problematic steps, iterate

Browser Compatibility:
- Risk: Older browsers may not support modern React features or CSS, breaking booking flow
- Mitigation: Test on major browsers, provide polyfills, show browser upgrade prompt for unsupported
- Fallback: Define minimum browser versions (Chrome 90+, Safari 14+), show degraded experience or phone booking option

Accessibility Compliance:
- Risk: Booking flow may not be fully accessible, excluding users with disabilities and risking legal compliance
- Mitigation: Follow WCAG 2.1 Level AA guidelines, test with screen readers, ensure keyboard navigation
- Verification: Automated accessibility testing with Axe, manual testing with VoiceOver/NVDA

Brand Consistency:
- Risk: Generic booking interface may not match business brand, reducing trust
- Mitigation: Allow extensive customization (colors, logo, fonts), provide preview before publishing
- Limitation: Advanced customization may require premium plan, basic plan has limited options

## Estimated Effort

Large - 4 to 5 weeks for 2 frontend developers

Breakdown by feature:
- Multi-step wizard and state management: 4-5 days
- Service selection step with filtering: 3-4 days
- Date and time selection (calendar and slots): 6-7 days (complex)
- Staff selection step: 2-3 days
- Client details form with validation: 3-4 days
- Confirmation step and calendar integration: 3-4 days
- Real-time availability updates: 2-3 days
- Widget implementation (iframe/shadow DOM): 5-6 days
- Standalone booking page: 2-3 days
- Branding and customization: 3-4 days
- Mobile optimization: 4-5 days
- Accessibility implementation: 3-4 days
- API integration and error handling: 3-4 days
- Testing (unit, integration, E2E): 5-6 days
- Bug fixes and polish: 3-4 days

Total: 47-60 days, approximately 4-5 weeks with 2 developers working in parallel (some tasks sequential)

## Owner Role

Frontend Developer with React and UX expertise

Required skills:
- Strong proficiency in React, TypeScript, and modern JavaScript (ES6+)
- Experience with React Query or similar state management
- Deep understanding of responsive design and mobile-first development
- Experience with Tailwind CSS and component libraries
- Strong UX intuition for optimizing conversion funnels
- Experience building embeddable widgets or third-party integrations
- Understanding of cross-domain communication (postMessage, CORS)
- Knowledge of accessibility standards (WCAG 2.1 Level AA)
- Experience with form validation libraries (React Hook Form, Zod)
- Understanding of date/time handling and timezone conversion
- Experience with testing frameworks (Jest, React Testing Library, Cypress/Playwright)
- Attention to detail for error handling and edge cases

Nice to have:
- Experience building booking or e-commerce checkout flows
- Understanding of calendar integration (iCalendar format, ICS files)
- Experience with iframe security and shadow DOM
- Knowledge of conversion rate optimization techniques
- Experience with A/B testing and analytics integration
- Familiarity with payment integration flows (for future payment step)
