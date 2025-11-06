# STATE.md

## Developer Task Progression Guide

This document provides a comprehensive guide for developers on how to approach the implementation of the booking platform, including task order, prerequisites, environment setup, verification steps, and onboarding procedures.

## Overview

The booking platform implementation is organized into 12 major task files located in the TASKS directory. These tasks must be completed in a specific order due to dependencies between components. This guide provides the recommended progression path and ensures developers have the necessary context and setup for each task.

## Project Phases

The implementation is divided into three overlapping phases:

**Phase 1: Foundation (Weeks 1-8)**
- Infrastructure setup
- Core backend services (auth, booking engine)
- Basic frontend (admin UI, booking UI)
- Database and API foundations

**Phase 2: Features (Weeks 6-14)**
- Calendar functionality
- Payment integration
- Notifications system
- Analytics and reporting

**Phase 3: Integration and Polish (Weeks 12-20)**
- External calendar sync
- Testing and QA
- Performance optimization
- Documentation completion

## Task Dependency Graph

The following diagram shows task dependencies (arrows indicate "depends on"):

```
infrastructure-deployment (start)
    ↓
testing-qa-strategy (parallel, ongoing)
    ↓
auth-and-tenancy-backend
    ↓
booking-engine-backend ← calendar-logic-backend
    ↓                         ↓
notifications-backend    calendar-ui-frontend
    ↓                         ↓
admin-ui-frontend → booking-ui-frontend
    ↓
payment-integration
    ↓
reporting-analytics
    ↓
calendar-sync-integration
```

## Recommended Task Order

### Setup Phase (Week 1-2)

#### Task 0: Environment Setup and Onboarding
**Duration:** 2-3 days per developer
**Prerequisites:** None
**File Reference:** See Onboarding Checklist below

**Steps:**
1. Complete local development environment setup
2. Verify all tools installed and working
3. Run seed data scripts
4. Execute test suites successfully
5. Complete first practice task (bug fix or small feature)

**Verification:**
- Development server runs locally without errors
- All tests pass (npm run test)
- Can create and view seed data in database
- Can make API calls to local backend
- Can view frontend in browser

**Mark as Done:**
- Create onboarding completion PR with small change
- Get PR approved by tech lead
- Document any setup issues encountered in team wiki

---

#### Task 1: Infrastructure and Deployment Pipeline
**Duration:** 6-8 weeks (1 Senior DevOps Engineer)
**Prerequisites:** AWS account access, Terraform, Kubernetes knowledge
**File Reference:** TASKS/infrastructure-deployment.md
**Owner:** DevOps Engineer

**Steps:**
1. Set up AWS account structure (dev, staging, prod)
2. Create Terraform modules for VPC, EKS, RDS, Redis, S3
3. Apply Terraform to provision infrastructure
4. Configure Kubernetes cluster and namespaces
5. Set up CI/CD pipeline with GitHub Actions
6. Configure monitoring (Prometheus, Grafana)
7. Set up logging (ELK stack or CloudWatch)
8. Implement backup and disaster recovery procedures
9. Document runbooks and access procedures

**Environment Setup:**
- AWS CLI configured with appropriate IAM role
- Terraform installed (version 1.5+)
- kubectl installed and configured
- Access to GitHub repository with Actions enabled
- PagerDuty account for alerting

**Verification:**
- Infrastructure provisioned successfully (terraform plan shows no changes)
- Kubernetes cluster accessible (kubectl get nodes)
- CI/CD pipeline runs successfully on sample commit
- Monitoring dashboards accessible and showing metrics
- Test deployment to staging succeeds
- Backup restore test passes

**Mark as Done:**
- All infrastructure in Terraform state
- CI/CD pipeline documentation complete
- Monitoring dashboards configured
- Runbooks created and reviewed
- DR drill completed successfully
- Handoff session with development team

**Parallel Work:** While infrastructure is being set up, backend developers can work on Task 2 (testing strategy) and begin Task 3 (auth) using local development environment.

---

#### Task 2: Testing and QA Strategy
**Duration:** 6-8 weeks (1 QA Engineer + 1 Developer, ongoing)
**Prerequisites:** Basic project structure, test framework decisions
**File Reference:** TASKS/testing-qa-strategy.md
**Owner:** QA Engineer with support from developers

**Steps:**
1. Set up testing frameworks (Jest, Playwright)
2. Configure test databases and CI integration
3. Create test data factories and fixtures
4. Write initial unit test examples
5. Create integration test infrastructure
6. Set up E2E test framework with page objects
7. Configure code coverage reporting
8. Establish QA processes and documentation
9. Set up performance testing (k6)
10. Configure security scanning tools

**Environment Setup:**
- Test database created (booking_test)
- Jest configuration in place
- Playwright browsers installed
- Test data seed scripts
- CI pipeline includes test execution

**Verification:**
- Unit tests run successfully (npm run test:unit)
- Integration tests run with test database (npm run test:integration)
- E2E tests execute in headless mode (npm run test:e2e)
- Code coverage report generated
- CI pipeline fails on test failure
- Test documentation accessible

**Mark as Done:**
- Test infrastructure fully functional
- Sample tests written for each test type
- Code coverage thresholds enforced (80%)
- QA process documented
- Team trained on testing practices

**Ongoing:** Testing is ongoing throughout development. As each feature is implemented, corresponding tests must be written. This task establishes the foundation; test writing continues through all subsequent tasks.

---

### Backend Foundation (Week 3-6)

#### Task 3: Authentication and Multi-Tenancy Backend
**Duration:** 3-4 weeks (2 Backend Developers)
**Prerequisites:** Infrastructure setup (Task 1), Testing framework (Task 2)
**File Reference:** TASKS/auth-and-tenancy-backend.md
**Owner:** Backend Developer with security expertise

**Steps:**
1. Design and implement User and Tenant database schema
2. Implement user registration with email verification
3. Build login endpoint with JWT token generation
4. Implement password reset flow
5. Build multi-factor authentication (TOTP and SMS)
6. Integrate OAuth providers (Google, Facebook, Apple)
7. Implement tenant context middleware
8. Build role-based access control (RBAC) system
9. Create session management endpoints
10. Implement account lockout mechanism
11. Write comprehensive unit and integration tests
12. Document API endpoints

**Environment Setup:**
- PostgreSQL database with auth schema
- Redis for session storage
- Email service configured (SendGrid test account)
- SMS service configured (Twilio test account)
- OAuth apps created for Google, Facebook, Apple

**Verification:**
- User can register and receive verification email
- Login returns valid JWT tokens
- Password reset flow works end-to-end
- MFA can be enabled and verified
- OAuth login works for all providers
- Tenant isolation verified (users can only access their tenant data)
- RBAC permissions enforced on protected endpoints
- All tests pass with 80%+ coverage
- API documentation generated

**Mark as Done:**
- All acceptance criteria from task file met
- Code reviewed and merged to main branch
- API documentation published
- Integration tests passing in CI
- Deployed to staging environment
- QA sign-off received

**Database Migrations:**
- Create migration for users table
- Create migration for tenants table
- Create migration for roles and permissions tables
- Document rollback procedures

---

#### Task 4: Booking Engine Backend
**Duration:** 4-5 weeks (2 Backend Developers)
**Prerequisites:** Auth backend (Task 3)
**File Reference:** TASKS/booking-engine-backend.md
**Owner:** Backend Developer with algorithm experience

**Steps:**
1. Design appointment, service, staff, client database schema
2. Implement availability calculation algorithm
3. Build appointment booking endpoint with conflict detection
4. Implement optimistic locking for concurrent booking prevention
5. Build appointment status management (transitions)
6. Implement recurring appointment logic with RRULE
7. Build group booking functionality
8. Implement buffer time handling
9. Build cancellation endpoint with policy enforcement
10. Implement no-show tracking
11. Write comprehensive tests including edge cases
12. Performance test availability algorithm

**Environment Setup:**
- Database with booking schema
- Test data with multiple businesses, services, staff
- Load testing setup for concurrent booking scenarios

**Verification:**
- Availability calculation returns correct slots (<500ms)
- Appointment booking succeeds with valid data
- Double-booking prevented (concurrent booking test passes)
- Appointment status transitions follow workflow
- Recurring appointments created correctly (8 weekly instances)
- Cancellation policy enforced
- All tests pass with 80%+ coverage
- Performance benchmarks met (availability <500ms, 100 concurrent bookings)

**Mark as Done:**
- All acceptance criteria met
- Availability algorithm optimized and tested
- Concurrent booking stress test passes
- Code reviewed and merged
- API documentation complete
- Deployed to staging
- QA sign-off received

**Performance Notes:**
- Monitor database query performance for availability calculation
- Index optimization on appointments table (start_time, end_time, staff_id)
- Consider caching strategies for frequently queried availability

---

#### Task 5: Calendar Logic Backend
**Duration:** 2-3 weeks (1-2 Backend Developers)
**Prerequisites:** Booking engine (Task 4)
**File Reference:** TASKS/calendar-logic-backend.md
**Owner:** Backend Developer

**Steps:**
1. Design blocked time database schema
2. Implement day view endpoint
3. Implement week view endpoint
4. Implement month view endpoint
5. Implement resource (multi-staff) view endpoint
6. Build WebSocket real-time update mechanism
7. Implement blocked time CRUD operations
8. Build schedule builder service
9. Implement iCal export functionality
10. Build calendar filtering logic
11. Write tests for all view types
12. Test WebSocket real-time updates

**Environment Setup:**
- WebSocket server configured
- Test data with appointments and blocked time
- iCalendar library integrated

**Verification:**
- Day view loads in <1 second
- Week view loads in <2 seconds
- Month view loads in <1 second
- Resource view loads in <2 seconds for 10 staff
- WebSocket updates deliver in <500ms
- Blocked time prevents appointment booking
- iCal export generates valid RFC 5545 format
- All tests pass

**Mark as Done:**
- All view endpoints functional
- Real-time updates working
- iCal export tested with external calendar apps
- Performance benchmarks met
- Code reviewed and merged
- Deployed to staging
- QA sign-off received

---

#### Task 6: Notifications Backend
**Duration:** 2-3 weeks (1-2 Backend Developers)
**Prerequisites:** Booking engine (Task 4)
**File Reference:** TASKS/notifications-backend.md
**Owner:** Backend Developer

**Steps:**
1. Design notification and template database schema
2. Implement email service integration (SendGrid)
3. Implement SMS service integration (Twilio)
4. Implement push notification service (FCM)
5. Build template management system
6. Implement scheduled notifications (reminders)
7. Build delivery tracking with webhooks
8. Implement retry logic for failed notifications
9. Build user preferences management
10. Implement rate limiting
11. Write tests for all notification channels
12. Test webhook delivery status updates

**Environment Setup:**
- SendGrid API key configured
- Twilio account and phone number set up
- Firebase Cloud Messaging project created
- Background job queue (BullMQ) configured

**Verification:**
- Email sent successfully via SendGrid
- SMS sent successfully via Twilio
- Push notification delivered to test device
- Template rendering with variables works
- Scheduled reminders sent at correct time (24h, 1h before)
- Delivery status tracked from webhooks
- Retry logic executes on failure
- Rate limiting enforced (100 email/min, 10 SMS/min)
- All tests pass

**Mark as Done:**
- All notification channels functional
- Template system working
- Scheduled reminders tested
- Webhook handlers implemented
- Code reviewed and merged
- Deployed to staging
- QA sign-off received

---

### Frontend Development (Week 5-12)

#### Task 7: Admin UI Frontend
**Duration:** 5-6 weeks (2 Frontend Developers)
**Prerequisites:** Auth backend (Task 3), Booking engine (Task 4), Calendar logic (Task 5)
**File Reference:** TASKS/admin-ui-frontend.md
**Owner:** Frontend Developer with React expertise

**Steps:**
1. Set up React project structure with TypeScript
2. Configure routing and layout components
3. Implement authentication flow (login, registration)
4. Build business profile management UI
5. Build location management UI
6. Build service catalog UI
7. Build staff management UI
8. Build client database UI
9. Build analytics dashboard UI
10. Build settings pages
11. Implement responsive design for mobile/tablet
12. Ensure WCAG 2.1 Level AA accessibility
13. Write component tests
14. Integrate with backend APIs

**Environment Setup:**
- React development environment
- Tailwind CSS configured
- React Query for API state management
- API mocking for development (MSW)
- Storybook for component development

**Verification:**
- Business owner can log in and manage profile
- All CRUD operations work (locations, services, staff, clients)
- Analytics dashboard displays correct data
- Responsive layout works on mobile, tablet, desktop
- Accessibility audit passes (axe-core)
- All components have tests
- Integration with backend APIs successful
- Performance: initial load <2s, navigation feels instant

**Mark as Done:**
- All acceptance criteria met
- UI/UX review approved
- Accessibility audit passed
- Component tests passing
- E2E tests for critical flows passing
- Code reviewed and merged
- Deployed to staging
- QA sign-off received

**Design Assets:**
- Ensure design system/mockups available before starting
- Design tokens (colors, typography, spacing) defined
- Component library decisions made (Headless UI, Radix UI)

---

#### Task 8: Customer Booking UI Frontend
**Duration:** 4-5 weeks (2 Frontend Developers)
**Prerequisites:** Booking engine (Task 4), Calendar logic (Task 5)
**File Reference:** TASKS/booking-ui-frontend.md
**Owner:** Frontend Developer with UX focus

**Steps:**
1. Build multi-step booking wizard component
2. Implement service selection step
3. Implement date and time selection step
4. Implement client details form step
5. Implement confirmation step
6. Build embeddable widget version
7. Build standalone booking page
8. Implement real-time availability updates
9. Implement mobile-optimized layouts
10. Add calendar integration buttons (Google, Apple, Outlook)
11. Ensure accessibility compliance
12. Write component and E2E tests
13. Optimize for conversion

**Environment Setup:**
- React development environment
- Widget build configuration (separate bundle)
- iframe or shadow DOM setup for widget
- Test booking flows with mock data

**Verification:**
- Multi-step booking flow works smoothly
- Service, date, time selection functional
- Client form validation works
- Confirmation shows appointment details
- Widget embeds in test website without CSS conflicts
- Standalone page loads quickly (Lighthouse 90+)
- Mobile experience optimized (touch-friendly)
- Accessibility audit passes
- Conversion funnel tracked in tests
- Real-time availability prevents double-booking

**Mark as Done:**
- All acceptance criteria met
- Booking flow tested end-to-end
- Widget tested in various website contexts
- Mobile UX approved
- Accessibility audit passed
- E2E tests for booking flow passing
- Code reviewed and merged
- Deployed to staging
- QA sign-off received

**Conversion Optimization:**
- Track abandonment rate at each step
- A/B test variations if time permits
- Minimize friction (optional fields, autofill)

---

#### Task 9: Calendar UI Frontend
**Duration:** 5-6 weeks (2 Frontend Developers)
**Prerequisites:** Calendar logic backend (Task 5)
**File Reference:** TASKS/calendar-ui-frontend.md
**Owner:** Frontend Developer with calendar/scheduling expertise

**Steps:**
1. Set up calendar component foundation
2. Implement day view with time grid
3. Implement week view with multiple days
4. Implement month view with date cells
5. Implement resource (multi-staff) view
6. Build appointment block rendering with positioning
7. Implement drag-and-drop rescheduling
8. Build quick appointment creation popover
9. Build appointment detail sidebar
10. Implement appointment status management
11. Build time blocking functionality
12. Integrate WebSocket for real-time updates
13. Implement print and export functionality
14. Optimize mobile calendar experience
15. Ensure keyboard accessibility
16. Write component and integration tests

**Environment Setup:**
- Calendar library evaluation (FullCalendar, custom)
- Drag-and-drop library (DnD Kit)
- WebSocket client configured
- Print CSS optimizations

**Verification:**
- Day view renders correctly with appointments
- Week view shows 7 days with proper layout
- Month view shows full month grid
- Resource view shows multiple staff side-by-side
- Drag-and-drop rescheduling works smoothly
- Quick create adds appointment to calendar immediately
- Real-time updates appear within seconds
- Print layout formatted properly
- Mobile calendar functional and touch-optimized
- Keyboard navigation works (Tab, Enter, arrows)
- Performance: 60fps scrolling, <1s view load

**Mark as Done:**
- All calendar views functional
- Drag-and-drop tested thoroughly
- Real-time updates working
- Mobile experience approved
- Accessibility audit passed
- Performance benchmarks met
- Code reviewed and merged
- Deployed to staging
- QA sign-off received

**Performance Optimization:**
- Virtualization for large datasets
- Memoization of expensive calculations
- Debouncing of frequent operations

---

### Integrations (Week 8-16)

#### Task 10: Payment Integration
**Duration:** 4-5 weeks (1 Backend Developer + 1 Frontend Developer)
**Prerequisites:** Booking engine (Task 4), Admin UI (Task 7), Booking UI (Task 8)
**File Reference:** TASKS/payment-integration.md
**Owner:** Full-Stack Developer with payments experience

**Steps:**
1. Set up Stripe account and API keys
2. Implement Stripe Connect OAuth flow
3. Build payment configuration management
4. Integrate Stripe Payment Element in booking UI
5. Implement Payment Intent lifecycle
6. Build saved payment methods functionality
7. Implement in-person payment recording
8. Build refund processing
9. Implement subscription billing for businesses
10. Build webhook handlers for Stripe events
11. Implement receipt generation
12. Ensure PCI compliance
13. Write comprehensive payment tests
14. Test with Stripe test mode

**Environment Setup:**
- Stripe test account
- Stripe CLI for webhook testing
- Test credit cards
- SSL certificates (required for Stripe)

**Verification:**
- Business can connect Stripe account via OAuth
- Customer can pay for appointment with test card
- Payment succeeds and appointment confirmed
- Saved payment methods work for returning customers
- Refunds process successfully
- Subscription billing charges correctly
- Webhooks received and processed
- Receipts generated with correct information
- All payment tests pass
- Security scan shows no vulnerabilities

**Mark as Done:**
- All acceptance criteria met
- Payment flows tested extensively
- Webhook handlers robust
- PCI compliance verified
- Code reviewed and merged
- Deployed to staging
- QA sign-off received
- Security audit passed

**Security Critical:**
- Never log credit card details
- Use HTTPS everywhere
- Validate webhook signatures
- Follow Stripe best practices

---

#### Task 11: Reporting and Analytics
**Duration:** 6-7 weeks (1 Backend Developer + 1 Frontend Developer)
**Prerequisites:** All backend services operational, Admin UI (Task 7)
**File Reference:** TASKS/reporting-analytics.md
**Owner:** Full-Stack Developer with data/analytics experience

**Steps:**
1. Design analytics database schema (materialized views)
2. Implement dashboard KPI calculations
3. Build revenue analytics endpoints
4. Build appointment analytics endpoints
5. Build client analytics endpoints
6. Build staff performance endpoints
7. Build service performance endpoints
8. Implement custom report builder backend
9. Build scheduled report system
10. Implement data export (CSV, Excel, PDF)
11. Build analytics dashboard UI
12. Build custom report builder UI
13. Implement chart visualizations
14. Optimize query performance
15. Write analytics tests

**Environment Setup:**
- Analytics test database with sample data
- Redis for query caching
- Chart library (Recharts or Chart.js)
- PDF generation library

**Verification:**
- Dashboard loads with correct KPIs
- All chart visualizations render correctly
- Custom reports can be created and saved
- Scheduled reports deliver via email
- Data exports work (CSV, Excel, PDF)
- Query performance meets targets (<2s)
- Analytics data accurate (manual verification)
- All tests pass

**Mark as Done:**
- All acceptance criteria met
- Analytics queries optimized
- Dashboard UI approved
- Custom reports functional
- Export formats tested
- Code reviewed and merged
- Deployed to staging
- QA sign-off received

**Performance Critical:**
- Use materialized views for expensive aggregations
- Implement query result caching
- Add proper database indexes
- Consider read replicas for analytics queries

---

#### Task 12: Calendar Sync Integration
**Duration:** 5-6 weeks (2 Backend Developers)
**Prerequisites:** Calendar logic (Task 5), Calendar UI (Task 9)
**File Reference:** TASKS/calendar-sync-integration.md
**Owner:** Backend Developer with OAuth and calendar API experience

**Steps:**
1. Implement Google Calendar OAuth flow
2. Implement Microsoft Outlook OAuth flow
3. Implement Apple iCloud CalDAV integration
4. Build appointment export to external calendars
5. Build busy time import from external calendars
6. Implement bidirectional sync logic
7. Build conflict resolution mechanism
8. Handle recurring events properly
9. Implement timezone conversion
10. Build webhook handlers for push notifications
11. Implement sync error handling and retry
12. Build sync logging and monitoring
13. Write comprehensive integration tests

**Environment Setup:**
- Google Cloud project with Calendar API enabled
- Microsoft Azure app registration
- Apple developer account
- Test calendar accounts for each provider
- iCalendar library for RRULE parsing

**Verification:**
- Staff can connect Google Calendar successfully
- Appointments export to Google Calendar
- Busy times from Google Calendar block availability
- Bidirectional sync works without data loss
- Conflicts resolved correctly (Last Write Wins)
- Recurring events sync properly
- Timezones converted correctly (DST tested)
- Webhooks receive and process notifications
- Token refresh works automatically
- All tests pass including edge cases

**Mark as Done:**
- All three calendar providers functional
- Bidirectional sync tested extensively
- Conflict resolution verified
- Timezone handling correct
- Code reviewed and merged
- Deployed to staging
- QA sign-off received

**Integration Testing:**
- Test with real calendar accounts
- Verify sync with actual appointments
- Test DST transitions
- Test recurring event edge cases

---

## Verification Checklist Per Task

For each task, the following verification steps should be completed before marking as done:

### Code Quality
- [ ] Code follows project style guide (ESLint passes)
- [ ] All functions and classes have TypeScript types
- [ ] No TypeScript any types unless absolutely necessary
- [ ] Complex logic has explanatory comments
- [ ] No hardcoded values (use configuration)
- [ ] Error handling implemented for all failure cases
- [ ] Logging added for important operations

### Testing
- [ ] Unit tests written and passing (80%+ coverage)
- [ ] Integration tests written and passing
- [ ] E2E tests written for critical paths
- [ ] Edge cases tested and handled
- [ ] Error cases tested
- [ ] Performance tests pass benchmarks

### Documentation
- [ ] API endpoints documented (Swagger/OpenAPI)
- [ ] README updated if new setup required
- [ ] Database migrations documented
- [ ] Configuration options documented
- [ ] Troubleshooting guide updated if needed

### Code Review
- [ ] Pull request created with clear description
- [ ] Self-review completed (checklist reviewed)
- [ ] Peer review completed (at least 1 approval)
- [ ] All review comments addressed
- [ ] CI checks passing (tests, lint, build)

### Deployment
- [ ] Merged to main branch
- [ ] Deployed to staging environment
- [ ] Smoke tests pass on staging
- [ ] QA testing completed on staging
- [ ] QA sign-off received
- [ ] Monitoring and alerts configured

### Security
- [ ] Security scan passing (no critical vulnerabilities)
- [ ] Authentication and authorization tested
- [ ] Input validation implemented
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified
- [ ] Sensitive data not logged

---

## How to Mark Tasks as Done

### In Project Management Tool

If using Jira, GitHub Projects, or similar:

1. Update task status to "In Review" when PR created
2. Update to "In QA" when deployed to staging
3. Update to "Done" when all verification criteria met
4. Add comment with PR link, deployment date, QA signoff

### In Git Repository

Tag completed milestones:

- Create Git tag when task fully complete: `git tag -a task-3-auth-complete -m "Auth and tenancy backend complete"`
- Push tags: `git push origin --tags`
- Document in CHANGELOG.md with task name and completion date

### In Documentation

Update this STATE.md file:

- Mark task as ✅ COMPLETE in this document
- Add completion date
- Add any notes or lessons learned
- Update dependency information if changed

Example:
```
#### Task 3: Authentication and Multi-Tenancy Backend ✅ COMPLETE
**Completed:** 2025-11-15
**Notes:** Implemented additional rate limiting not in original spec. OAuth integration took longer than estimated (5 weeks vs 4 weeks).
```

### In Team Communication

Announce completion:

- Post in team Slack/Discord channel
- Highlight achievements and challenges
- Share key learnings
- Thank contributors
- Link to documentation

---

## New Developer Onboarding Checklist

### Prerequisites (Before Starting)

- [ ] Received access to GitHub repository
- [ ] Added to team Slack/Discord channel
- [ ] Access to project management tool (Jira/GitHub Projects)
- [ ] AWS access granted (if needed)
- [ ] Added to PagerDuty rotation (if applicable)
- [ ] Attended team introduction meeting

### Development Environment Setup

#### Install Required Software

- [ ] Node.js (version 18+ LTS)
- [ ] npm or yarn package manager
- [ ] PostgreSQL (version 15+)
- [ ] Redis (version 7+)
- [ ] Git
- [ ] Docker and Docker Compose
- [ ] IDE (VS Code recommended) with extensions:
  - ESLint
  - Prettier
  - TypeScript
  - GitLens
  - Docker
  - PostgreSQL
- [ ] Postman or Insomnia for API testing

#### Clone and Setup Repository

```
Step 1: Clone repository
- Run: git clone [repository-url]
- Navigate: cd booking-platform

Step 2: Install dependencies
- Run: npm install
- Verify: npm list (shows installed packages)

Step 3: Environment configuration
- Copy .env.example to .env
- Update database connection string
- Update Redis connection string
- Add API keys (SendGrid, Twilio, Stripe test keys)
- Verify: env vars loaded (console.log in app startup)

Step 4: Database setup
- Create database: createdb booking_dev
- Run migrations: npm run migrate
- Verify: psql booking_dev -c "\dt" (shows tables)

Step 5: Seed data
- Run seed script: npm run seed
- Verify: Database has test business, users, services
- Note: Default credentials for test users

Step 6: Start development server
- Run backend: npm run dev (starts on port 3000)
- Run frontend: cd frontend && npm run dev (starts on port 3001)
- Verify: Backend health check http://localhost:3000/health returns 200
- Verify: Frontend loads at http://localhost:3001
```

#### Verify Installation

- [ ] Development server starts without errors
- [ ] Can access backend API (GET /health returns 200)
- [ ] Can access frontend (loads in browser)
- [ ] Database connection successful (queries work)
- [ ] Redis connection successful (cache works)

### Testing Setup

- [ ] Run unit tests: `npm run test:unit` (all pass)
- [ ] Run integration tests: `npm run test:integration` (all pass)
- [ ] Create test database: `createdb booking_test`
- [ ] Run test migrations: `npm run migrate:test`
- [ ] E2E tests setup: `npx playwright install`
- [ ] Run E2E tests: `npm run test:e2e` (all pass)
- [ ] Code coverage report: `npm run test:coverage` (view in browser)

### Seed Data Understanding

Default seed data includes:

**Test Business:**
- Name: Acme Salon
- Owner: owner@acmesalon.com / password123
- Staff: staff1@acmesalon.com / password123, staff2@acmesalon.com / password123

**Services:**
- Haircut (30 min, $50)
- Color (90 min, $120)
- Blowout (45 min, $40)

**Appointments:**
- Sample appointments for next 7 days
- Various statuses (confirmed, completed, cancelled)

**Clients:**
- 10 test clients with appointment history

### Git Workflow

#### Branch Strategy

- [ ] Understand branch structure:
  - `main`: Production-ready code
  - `develop`: Integration branch for features
  - `feature/*`: Feature branches
  - `bugfix/*`: Bug fix branches
  - `hotfix/*`: Emergency production fixes

#### Creating Feature Branch

```
Step 1: Ensure on develop branch
- Run: git checkout develop
- Pull latest: git pull origin develop

Step 2: Create feature branch
- Format: feature/[task-number]-[short-description]
- Example: feature/AUTH-123-add-mfa
- Run: git checkout -b feature/AUTH-123-add-mfa

Step 3: Make changes
- Commit frequently with clear messages
- Message format: "[TASK-123] Add MFA support for user authentication"

Step 4: Keep branch updated
- Periodically: git merge develop
- Resolve conflicts as they arise
```

#### Creating Pull Request

- [ ] Understand PR process:
  1. Push branch: `git push origin feature/AUTH-123-add-mfa`
  2. Create PR in GitHub (feature branch → develop)
  3. Fill PR template completely
  4. Link to task/ticket
  5. Request reviewers
  6. Address review comments
  7. Ensure CI checks pass
  8. Obtain approval (minimum 1)
  9. Squash and merge to develop

#### PR Template Checklist

When creating PR, ensure:

- [ ] Title describes change clearly
- [ ] Description explains what and why
- [ ] Related ticket/task linked
- [ ] Screenshots for UI changes
- [ ] Testing performed listed
- [ ] Breaking changes called out
- [ ] Database migrations included (if applicable)
- [ ] Documentation updated
- [ ] Reviewers assigned

### Code Style Guidelines

- [ ] Read team code style guide
- [ ] ESLint configuration understood
- [ ] Prettier configuration understood
- [ ] TypeScript strict mode enabled
- [ ] Run linter before committing: `npm run lint`
- [ ] Run formatter: `npm run format`

#### Naming Conventions

**Files:**
- Components: PascalCase (UserProfile.tsx)
- Services: camelCase (appointmentService.ts)
- Tests: [name].spec.ts or [name].test.tsx

**Code:**
- Variables/functions: camelCase (getUserById)
- Classes: PascalCase (AppointmentService)
- Constants: UPPER_SNAKE_CASE (MAX_RETRY_ATTEMPTS)
- Interfaces: PascalCase with I prefix (IUserRepository)

**Database:**
- Tables: snake_case (user_accounts, appointment_slots)
- Columns: snake_case (created_at, first_name)

### First Task Assignment

- [ ] Assigned starter task by tech lead
- [ ] Task complexity: Small (1-2 days)
- [ ] Task type: Bug fix or small feature
- [ ] Pair programming session scheduled
- [ ] Completed task, created PR
- [ ] PR reviewed and merged
- [ ] Celebrated first contribution! 🎉

### Project Documentation Review

- [ ] Read README.md (project overview)
- [ ] Read SPEC.md (technical specification)
- [ ] Read DOMAIN-MODEL.md (data model)
- [ ] Read API-CONTRACTS.md (API documentation)
- [ ] Read SECURITY-PRIVACY.md (security requirements)
- [ ] Read this STATE.md (task progression)
- [ ] Review TASKS/*.md files (implementation details)

### Team Practices Understanding

- [ ] Daily standup time and format
- [ ] Sprint planning process
- [ ] Sprint retrospective process
- [ ] Code review expectations
- [ ] Pair programming approach
- [ ] Communication channels (Slack channels, who to ask)
- [ ] On-call rotation (if applicable)
- [ ] Deployment process and schedule
- [ ] Incident response procedures

### Access and Permissions

- [ ] GitHub repository (read/write)
- [ ] Project management tool (Jira/GitHub Projects)
- [ ] AWS console (if needed for role)
- [ ] Staging environment access
- [ ] Production logs (read-only)
- [ ] Monitoring dashboards (Grafana)
- [ ] Error tracking (Sentry)
- [ ] API documentation (Swagger UI)
- [ ] Design assets (Figma)

### Knowledge Transfer Sessions

Schedule sessions with:

- [ ] Tech lead: Architecture overview
- [ ] Backend lead: Backend architecture and patterns
- [ ] Frontend lead: Frontend architecture and components
- [ ] DevOps: Infrastructure and deployment
- [ ] QA lead: Testing strategy and QA process
- [ ] Product manager: Product vision and roadmap

### Resources and References

- [ ] Bookmark project documentation
- [ ] Bookmark internal wiki/Confluence
- [ ] Save links to frequently used tools
- [ ] Join relevant Slack channels
- [ ] Subscribe to repository notifications
- [ ] Add team calendar to calendar app

### 30-Day Check-in

After 30 days, assess:

- [ ] Comfortable with codebase
- [ ] Completed 3+ tasks independently
- [ ] Understand development workflow
- [ ] Can deploy to staging
- [ ] Know who to ask for help
- [ ] Familiar with team practices
- [ ] Provided feedback on onboarding process

---

## Task Status Tracking

Use this section to track overall project progress. Update as tasks complete.

### Foundation Phase
- [ ] Task 0: Environment Setup and Onboarding
- [ ] Task 1: Infrastructure and Deployment Pipeline
- [ ] Task 2: Testing and QA Strategy

### Backend Development
- [ ] Task 3: Authentication and Multi-Tenancy Backend
- [ ] Task 4: Booking Engine Backend
- [ ] Task 5: Calendar Logic Backend
- [ ] Task 6: Notifications Backend

### Frontend Development
- [ ] Task 7: Admin UI Frontend
- [ ] Task 8: Customer Booking UI Frontend
- [ ] Task 9: Calendar UI Frontend

### Integrations
- [ ] Task 10: Payment Integration
- [ ] Task 11: Reporting and Analytics
- [ ] Task 12: Calendar Sync Integration

---

## Troubleshooting Common Issues

### Database Connection Issues

**Problem:** Cannot connect to PostgreSQL database

**Solutions:**
- Verify PostgreSQL is running: `pg_isready`
- Check .env database connection string
- Ensure database exists: `psql -l`
- Check PostgreSQL logs: `/var/log/postgresql/`
- Verify pg_hba.conf allows local connections

### Redis Connection Issues

**Problem:** Cannot connect to Redis

**Solutions:**
- Verify Redis is running: `redis-cli ping` (should return PONG)
- Check .env Redis connection string
- Ensure Redis port not in use: `lsof -i :6379`
- Try connecting with redis-cli: `redis-cli`

### Test Failures

**Problem:** Tests failing locally

**Solutions:**
- Ensure test database exists and migrated
- Clear test database: `npm run test:db:reset`
- Check for port conflicts (test server already running)
- Verify environment variables loaded: `console.log(process.env.NODE_ENV)`
- Run single test to isolate issue: `npm test -- path/to/test.spec.ts`

### Module Not Found Errors

**Problem:** Import errors or module not found

**Solutions:**
- Delete node_modules: `rm -rf node_modules`
- Delete package-lock.json: `rm package-lock.json`
- Reinstall dependencies: `npm install`
- Check TypeScript path mappings in tsconfig.json
- Verify import paths (case-sensitive)

### Build Errors

**Problem:** Build fails with TypeScript errors

**Solutions:**
- Run type check: `npm run type-check`
- Check for any type usage (should be minimal)
- Verify all imports have types
- Update @types packages: `npm update @types/*`
- Clear TypeScript cache: `rm -rf dist/`

### Port Already in Use

**Problem:** Cannot start dev server, port in use

**Solutions:**
- Find process using port: `lsof -i :3000`
- Kill process: `kill -9 [PID]`
- Use different port: `PORT=3002 npm run dev`
- Check for zombie processes

### Seed Data Not Loading

**Problem:** Database empty after running seed script

**Solutions:**
- Check seed script for errors: `npm run seed -- --verbose`
- Verify migrations ran: `npm run migrate:status`
- Check database connection in seed script
- Look for foreign key violations in logs
- Try resetting database: `npm run db:reset`

---

## Development Best Practices

### Before Starting Task

1. Read task file completely (TASKS/*.md)
2. Review acceptance criteria
3. Check for prerequisite tasks completed
4. Set up necessary environment/tools
5. Create feature branch from develop
6. Update task status to "In Progress"

### During Development

1. Commit frequently with clear messages
2. Run tests regularly (not just at end)
3. Keep branch updated with develop (merge regularly)
4. Document complex logic with comments
5. Add logging for important operations
6. Handle errors gracefully
7. Write tests alongside implementation (TDD encouraged)

### Before Submitting PR

1. Run full test suite: `npm test`
2. Run linter: `npm run lint`
3. Run type check: `npm run type-check`
4. Test manually in UI (if applicable)
5. Review own code (self-review checklist)
6. Ensure no debug code or console.logs
7. Update documentation if needed
8. Create clear PR description

### After PR Merged

1. Deploy to staging
2. Run smoke tests on staging
3. Notify QA for testing
4. Monitor logs for errors
5. Update task status to "Done"
6. Document any lessons learned

---

## Getting Help

### When Stuck

1. Spend 15-30 minutes trying to solve independently
2. Search codebase for similar implementations
3. Check project documentation
4. Search team wiki/Confluence
5. Ask in team Slack channel
6. Schedule pairing session if complex
7. Don't stay stuck for hours - ask for help!

### Who to Ask

- **General questions:** Team Slack channel
- **Architecture decisions:** Tech lead
- **Backend questions:** Backend lead
- **Frontend questions:** Frontend lead
- **DevOps/infrastructure:** DevOps engineer
- **Testing questions:** QA lead
- **Product questions:** Product manager
- **Design questions:** Designer

### Useful Commands Quick Reference

```
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Testing
npm test                 # Run all tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:e2e         # E2E tests only
npm run test:coverage    # Coverage report
npm run test:watch       # Watch mode

# Database
npm run migrate          # Run migrations
npm run migrate:rollback # Rollback last migration
npm run seed             # Seed database
npm run db:reset         # Reset database (drop, create, migrate, seed)

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format           # Run Prettier
npm run type-check       # TypeScript type check

# Git
git checkout develop     # Switch to develop
git pull origin develop  # Pull latest
git checkout -b feature/[name] # Create feature branch
git add .                # Stage changes
git commit -m "[message]" # Commit
git push origin [branch] # Push to remote

# Docker
docker-compose up        # Start all services
docker-compose down      # Stop all services
docker-compose logs [service] # View logs
docker-compose exec [service] bash # Access container
```

---

## Summary

This document provides a comprehensive guide for implementing the booking platform. Follow the recommended task order, complete all verification steps, and mark tasks as done only when all acceptance criteria are met. New developers should complete the onboarding checklist before starting task work. Refer to individual TASKS/*.md files for detailed implementation guidance for each task.

Regular communication with the team, following best practices, and asking for help when stuck are keys to successful implementation. Good luck!
