# SPEC.md

## 1. Application Description

### 1.1 Overview

This application is a comprehensive booking and appointment management platform designed to connect service-based businesses with their clients. The platform serves appointment-driven small to medium businesses including hair salons, barbershops, beauty spas, medical clinics, fitness studios, and similar service providers.

### 1.2 Business Goals

**Primary Goals:**
- Enable service businesses to efficiently manage appointments, staff, and resources through a unified platform
- Reduce no-shows and scheduling conflicts through intelligent automation and reminders
- Provide clients with a seamless, modern booking experience across all devices
- Generate recurring revenue through SaaS subscriptions while offering self-hosted flexibility
- Scale to support thousands of businesses with millions of appointments

**Secondary Goals:**
- Increase average booking value through upselling and cross-selling features
- Improve customer retention through loyalty programs and automated marketing
- Reduce administrative overhead with automated workflows and integrations
- Provide actionable business intelligence through analytics and reporting
- Enable businesses to maintain brand consistency through white-label options

### 1.3 Target Personas

**Business Owner/Administrator:**
- Age: 30-55
- Tech-savvy level: Moderate
- Needs: Complete control over business operations, staff management, financial insights, growth tools
- Pain points: Double bookings, no-shows, manual scheduling, payment tracking, staff coordination

**Business Manager/Receptionist:**
- Age: 25-50
- Tech-savvy level: Basic to Moderate
- Needs: Quick appointment scheduling, client information access, daily schedule overview
- Pain points: Phone interruptions, calendar conflicts, client miscommunication, payment collection

**Service Provider/Staff:**
- Age: 20-60
- Tech-savvy level: Basic
- Needs: View personal schedule, manage availability, track earnings, client notes
- Pain points: Schedule uncertainty, client no-shows, unclear service requirements

**End Client/Customer:**
- Age: 18-65
- Tech-savvy level: Basic to Advanced
- Needs: Easy booking, flexible rescheduling, payment options, appointment reminders
- Pain points: Phone tag, limited availability visibility, inflexible booking policies

### 1.4 Key Constraints

**Technical Constraints:**
- Must support both multi-tenant SaaS architecture and single-tenant deployments
- Data isolation between tenants must be enforced at database and network levels
- Must function offline (PWA) with automatic synchronization when connectivity resumes
- Must scale horizontally to support 10,000+ concurrent tenants
- Must maintain sub-second response times for booking operations
- Must support real-time updates for calendar operations

**Compliance Constraints:**
- GDPR compliance mandatory (right to erasure, data portability, consent management)
- PCI-DSS compliance for payment processing
- HIPAA-ready architecture for healthcare providers (optional feature)
- Complete audit trail for all data modifications
- Data retention and deletion policies configurable per tenant

**Business Constraints:**
- Support for Bulgarian language and Cyrillic script mandatory
- Multi-currency support with real-time exchange rates
- Custom branding per tenant (white-label capability)
- All third-party integrations must be toggleable per tenant
- Self-hosted version must not require cloud dependencies

**Operational Constraints:**
- Granular role-based access control with per-location permissions
- Shared calendar must prevent double-bookings through optimistic locking
- Buffer times and resource constraints must be enforced automatically
- System must handle timezone conversions correctly across all features
- Must support businesses with multiple locations (franchise model)

## 2. Unique Selling Points

### 2.1 Proposed USPs

**USP #1: AI-Powered Smart Scheduling (PRIMARY)**

An intelligent scheduling engine that learns from historical booking data to optimize operations and increase revenue.

**Core Capabilities:**
- No-show prediction based on client history, weather, day of week, and booking patterns
- Dynamic buffer time adjustment per service and staff member based on actual completion times
- Intelligent slot recommendations that maximize daily revenue and minimize gaps
- Automated upsell suggestions based on client history and complementary services
- Demand-based pricing recommendations for premium time slots
- Staff skill matching that considers expertise level, client preferences, and workload balance

**Implementation Approach:**
- Phase 1: Data collection framework, basic pattern recognition (6-9 months historical data)
- Phase 2: Predictive models for no-shows and completion times using logistic regression and time series analysis
- Phase 3: Recommendation engine using collaborative filtering for upsells
- Phase 4: Advanced optimization using constraint programming for daily schedule optimization
- Privacy-first approach: All ML models run on aggregated, anonymized data; tenant data never leaves their instance in self-hosted mode

**Differentiation:**
Most booking platforms offer static scheduling rules. This system continuously learns and adapts, providing ROI through reduced gaps, higher show rates, and increased average booking value.

**USP #2: Collaborative Booking & Negotiation**

A unique two-way booking system where clients can request preferred time slots and staff/businesses can counter-propose alternatives.

**Core Capabilities:**
- Clients submit booking requests with preferred times, staff, and service combinations
- Businesses receive requests and can accept, decline, or counter-propose with alternative times
- Premium time slot bidding during high-demand periods (optional feature)
- Automated suggestion engine proposes win-win alternatives when conflicts occur
- Request expiration and automatic escalation to prevent indefinite pending states

**Differentiation:**
Transforms booking from one-way transaction to collaborative scheduling, especially valuable for high-value services where flexibility exists on both sides.

**USP #3: Unified Multi-Business Client Passport**

A client-centric profile system that works across all businesses on the platform, creating a marketplace effect.

**Core Capabilities:**
- Single client profile usable across all subscribed businesses
- Universal appointment history and preferences
- Cross-business discovery with personalized recommendations
- Shared loyalty points or credits redeemable at participating businesses
- Privacy controls allowing clients to choose what information to share per business

**Differentiation:**
Creates network effects where the platform becomes more valuable as more businesses join, improving client retention for all participants.

### 2.2 Selected Primary USP

**AI-Powered Smart Scheduling** is selected as the primary differentiator because:

1. **Immediate ROI**: Businesses can quantify value through reduced no-shows and optimized schedules
2. **Continuous Improvement**: System becomes more valuable over time as it learns
3. **Broad Appeal**: Benefits all business types, sizes, and verticals
4. **Technical Moat**: Requires significant ML expertise and data to replicate
5. **Scalable Implementation**: Can be delivered incrementally from basic to advanced features

## 3. High-Level Architecture

### 3.1 Architecture Overview

The platform follows a modular, event-driven architecture with clear separation between multi-tenant and single-tenant deployment modes.

**Deployment Models:**

**Multi-Tenant SaaS:**
- Shared infrastructure with tenant isolation at application and database levels
- Tenant identification via subdomain or custom domain
- Shared services with per-tenant configuration
- Horizontal scaling with tenant-aware load balancing

**Single-Tenant Self-Hosted:**
- Complete application stack deployable via Docker Compose or Kubernetes
- No external dependencies (except optional integrations)
- Local data storage with backup/restore utilities
- Simplified configuration for single-business operation

### 3.2 Core Components

**Frontend Layer:**
- Progressive Web Application (PWA) with offline support
- Responsive design supporting desktop, tablet, and mobile
- Client booking portal (public-facing)
- Business administration portal (authenticated)
- White-label embeddable booking widget
- Technologies: Modern JavaScript framework with state management, service workers, IndexedDB for offline storage

**API Gateway:**
- RESTful API for client applications
- GraphQL API for flexible data queries (optional)
- WebSocket support for real-time calendar updates
- Rate limiting and throttling per tenant
- API versioning and backward compatibility
- Authentication/authorization enforcement

**Application Services:**
- Booking Service: Appointment creation, modification, cancellation with conflict detection
- Calendar Service: Availability calculation, resource allocation, conflict resolution
- User Management Service: Authentication, authorization, role/permission management
- Business Management Service: Tenant configuration, location management, service definitions
- Payment Service: Transaction processing, refunds, payment gateway integration
- Notification Service: Email, SMS, push notifications with template management
- Analytics Service: Data aggregation, reporting, dashboard metrics
- AI/ML Service: Predictive models, recommendation engine (primary USP)
- Integration Service: External calendar sync, third-party API connectors

**Data Layer:**
- Primary Database: Relational database for transactional data (tenant-partitioned in multi-tenant mode)
- Cache Layer: In-memory cache for frequently accessed data
- Search Index: Full-text search for clients, services, appointments
- Blob Storage: File uploads (images, documents)
- Time-Series Database: Analytics and metrics storage (optional)

**Infrastructure Services:**
- Message Queue: Asynchronous job processing, event distribution
- Background Jobs: Scheduled tasks (reminders, reports, data cleanup)
- Audit Log Service: Immutable event logging
- Backup Service: Automated backups with point-in-time recovery

**External Integrations:**
- Payment Gateways: Stripe, PayPal, others
- Email/SMS Providers: SendGrid, Twilio, etc.
- Calendar Sync: Google Calendar, Apple Calendar, Microsoft Outlook
- Analytics: Google Analytics, Mixpanel (optional)
- Accounting: QuickBooks, Xero (optional)

### 3.3 Data Isolation Strategy

**Multi-Tenant Mode:**
- Tenant ID included in all database queries (enforced at ORM level)
- Row-level security policies in database
- Separate database schemas per tenant (optional for enterprise tier)
- Network-level isolation for enterprise tenants
- Tenant-specific encryption keys for sensitive data

**Single-Tenant Mode:**
- Complete database instance per deployment
- No tenant ID required in queries
- Full data ownership and control
- Air-gapped deployment option for regulated industries

### 3.4 Security Architecture

- HTTPS/TLS encryption for all communications
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC) with per-resource permissions
- API rate limiting and DDoS protection
- SQL injection and XSS prevention
- CSRF protection for state-changing operations
- Security headers (CSP, HSTS, X-Frame-Options)
- Regular security audits and dependency updates
- Secrets management with rotation
- Multi-factor authentication (MFA) support

## 4. Core Domain Model

### 4.1 Primary Entities

**Tenant:**
- Represents a business account in multi-tenant mode
- Contains global settings, subscription tier, feature flags
- Parent entity for all business data

**User:**
- Persons who interact with the system
- Can have multiple roles across different contexts
- Types: Business Owner, Staff, Client

**Business:**
- The service provider organization
- May have multiple locations
- Contains branding, policies, operating hours

**Location:**
- Physical or virtual business location
- Has its own settings, staff assignments, services
- May inherit settings from parent Business

**Service:**
- Bookable service offered by the business
- Has duration, price, resource requirements
- Can be categorized and tagged

**StaffMember:**
- User with service provider role
- Has skills, availability, location assignment
- Linked to calendar and appointments

**Client:**
- User with customer role
- Has contact information, preferences, history
- Can belong to multiple businesses

**Appointment:**
- Core booking entity
- Links Client, StaffMember, Service, Location
- Has status, time slot, payment information

**Calendar:**
- Shared or individual schedule view
- Aggregates availability and bookings
- Supports multiple view modes

**Availability:**
- Defines when staff/resources are available
- Supports recurring patterns and exceptions
- Includes buffer times and breaks

**Payment:**
- Transaction record for appointments
- Links to payment gateway
- Supports deposits, full payments, refunds

**Notification:**
- Communication record
- Links to appointment or business event
- Tracks delivery status across channels

### 4.2 Entity Relationships

```
Tenant (1) ←→ (N) Business
Business (1) ←→ (N) Location
Business (1) ←→ (N) User
Business (1) ←→ (N) Service
Business (1) ←→ (N) Client
Location (1) ←→ (N) StaffMember
Location (1) ←→ (N) Appointment
StaffMember (1) ←→ (N) Availability
StaffMember (1) ←→ (N) Appointment
StaffMember (N) ←→ (N) Service (via StaffSkills)
Client (1) ←→ (N) Appointment
Appointment (1) ←→ (1) Payment
Appointment (1) ←→ (N) Notification
Service (1) ←→ (N) Appointment
User (N) ←→ (N) Role (via UserRole)
Role (N) ←→ (N) Permission (via RolePermission)
```

### 4.3 Supporting Entities

**Role:** Defines permission sets for users
**Permission:** Granular access control rules
**AuditLog:** Immutable record of all changes
**Template:** Reusable appointment configurations
**Coupon:** Discount codes and promotions
**GiftCard:** Prepaid service credits
**Membership:** Recurring subscription plans
**EmailCampaign:** Marketing automation
**Report:** Saved analytics configurations
**Integration:** External service connections
**Widget:** Embeddable booking interfaces
**Tag:** Categorization and filtering
**Note:** Staff notes about clients or appointments
**Resource:** Bookable equipment or rooms (beyond staff)
**Tax:** Tax rules and calculations
**TimeZone:** Location-specific time handling

## 5. Non-Functional Requirements

### 5.1 Performance

- API response time: p95 < 500ms, p99 < 1000ms
- Calendar page load: < 2 seconds on 3G connection
- Booking flow completion: < 10 seconds end-to-end
- Real-time calendar updates: < 500ms latency
- Support 1000+ concurrent users per tenant
- Database query time: p95 < 100ms
- Search results: < 200ms for typical queries

### 5.2 Scalability

- Horizontal scaling for all application services
- Support 10,000+ tenants on shared infrastructure
- Handle 100,000+ appointments per day globally
- Storage growth: 1TB+ per year with efficient archival
- Read replica support for reporting queries
- CDN integration for static assets and white-label widgets

### 5.3 Availability

- 99.9% uptime SLA for multi-tenant SaaS (excludes planned maintenance)
- Graceful degradation during partial outages
- Zero-downtime deployments using blue-green or canary strategies
- Automated failover for database and critical services
- Self-hosted: Availability depends on customer infrastructure

### 5.4 Reliability

- Automatic retry for transient failures
- Circuit breakers for external service dependencies
- Idempotent API operations
- Transaction support for multi-step operations
- Data backup: Daily full, hourly incremental
- Point-in-time recovery up to 30 days
- Disaster recovery: RTO < 4 hours, RPO < 1 hour

### 5.5 Security

- OWASP Top 10 compliance
- Regular penetration testing
- Dependency vulnerability scanning
- Encryption at rest for sensitive data
- Encryption in transit (TLS 1.3)
- Audit logs retained for 7 years (configurable)
- Password policy enforcement
- Session management with automatic timeout
- IP whitelisting support for enterprise tenants

### 5.6 Usability

- WCAG 2.1 AA accessibility compliance
- Mobile-first responsive design
- Support for screen readers
- Keyboard navigation support
- Consistent UI patterns across platform
- Inline help and tooltips
- Onboarding wizard for new businesses
- Maximum 3 clicks to complete common tasks

### 5.7 Maintainability

- Modular architecture with clear service boundaries
- Comprehensive API documentation (OpenAPI/Swagger)
- Automated testing: 80%+ code coverage
- CI/CD pipeline with automated quality gates
- Infrastructure as Code (IaC)
- Structured logging with correlation IDs
- Monitoring and alerting for critical metrics
- Feature flags for gradual rollout

### 5.8 Compliance

- GDPR: Data portability, right to erasure, consent management
- PCI-DSS: No storage of card data, tokenization via payment gateway
- HIPAA-ready: Encrypted data, audit logs, access controls (optional addon)
- SOC 2 Type II compliance for enterprise tier
- Data residency options (EU, US, UK)

### 5.9 Internationalization

- Support for 20+ languages initially (including Bulgarian)
- RTL language support (Arabic, Hebrew)
- Multi-currency with real-time exchange rates
- Locale-specific date/time/number formatting
- Translatable email and SMS templates
- Currency conversion for reporting

### 5.10 Offline Support

- PWA with service worker caching
- Offline mode for viewing schedules
- Queue operations for background sync when connection resumes
- Conflict detection and resolution UI for offline changes
- Local storage limits: 50MB per tenant
- Automatic sync status indicators

## 6. Tech Stack Recommendations

### 6.1 Frontend

**Framework: React with TypeScript**

*Rationale:*
- Strong ecosystem with extensive library support
- TypeScript provides type safety reducing runtime errors
- React Query for efficient server state management
- Large talent pool for hiring and maintenance
- Excellent PWA support with Workbox
- Component reusability for white-label widgets

**State Management: Zustand or Redux Toolkit**

*Rationale:*
- Zustand: Lightweight, minimal boilerplate, suitable if state complexity is moderate
- Redux Toolkit: More robust for complex state with time-travel debugging capabilities
- Both support TypeScript well

**UI Framework: Tailwind CSS + Headless UI or Material-UI**

*Rationale:*
- Tailwind CSS: Utility-first, highly customizable, small bundle size with PurgeCSS
- Headless UI: Unstyled accessible components, full design control
- Material-UI: If faster development with pre-built components is priority
- Strong accessibility features built-in

**Calendar UI: React Big Calendar or FullCalendar**

*Rationale:*
- Both support day/week/month/resource views
- Customizable and themeable
- Good performance with large datasets
- FullCalendar has better resource scheduling features (commercial license required)

**Build Tool: Vite**

*Rationale:*
- Extremely fast HMR during development
- Optimized production builds with Rollup
- Native ES modules support
- Better DX than Webpack

### 6.2 Backend

**Runtime: Node.js with TypeScript OR Go**

*Node.js Rationale:*
- Shared language with frontend reduces context switching
- Excellent async I/O for high-concurrency booking operations
- Vast ecosystem for integrations (payment gateways, email, SMS)
- Strong support for WebSocket (real-time calendar updates)
- Frameworks: NestJS (enterprise-grade with DI, modular) or Express (lightweight)

*Go Rationale:*
- Superior performance and lower resource consumption
- Built-in concurrency primitives ideal for high-load operations
- Strongly typed, compiled language reduces runtime errors
- Smaller deployment footprint for self-hosted version
- Excellent for building high-performance APIs
- Frameworks: Gin or Echo for HTTP, GORM for ORM

*Recommendation:* Node.js with NestJS for Phase 1 due to faster development, easier integration, and shared codebase language. Consider Go for performance-critical services (AI/ML, calendar engine) in later phases.

**API Layer:**
- REST API with OpenAPI 3.0 specification
- GraphQL API (optional) for flexible client queries using Apollo Server
- WebSocket support using Socket.io (Node.js) or Gorilla WebSocket (Go)

### 6.3 Database

**Primary Database: PostgreSQL 15+**

*Rationale:*
- Robust ACID compliance for transactional booking operations
- Row-level security for multi-tenant isolation
- JSON/JSONB support for flexible schema sections (tenant settings)
- Excellent performance with proper indexing
- Supports full-text search (pg_trgm, GIN indexes)
- Rich date/time handling with timezone support
- Mature replication and backup tools
- Open-source with strong community

**Alternative: MySQL 8+ (if team expertise exists)**

*Consideration:* Similar capabilities, but PostgreSQL has better JSON support and more advanced features.

**ORM: Prisma (Node.js) or GORM (Go)**

*Rationale:*
- Type-safe database access
- Migration management
- Multi-database support for flexibility
- Prisma: Excellent DX with schema-first approach
- GORM: Mature, feature-rich for Go applications

### 6.4 Caching

**Redis 7+**

*Rationale:*
- In-memory performance for frequently accessed data (availability, user sessions)
- Pub/Sub for real-time notifications
- Distributed locking for appointment conflict prevention
- Session storage
- Rate limiting counters
- Cache invalidation strategies well-supported

### 6.5 Message Queue

**RabbitMQ or AWS SQS (for cloud deployments)**

*Rationale:*
- Reliable message delivery for async operations (emails, notifications, reports)
- Dead-letter queues for error handling
- Priority queues for urgent notifications
- RabbitMQ: Self-hosted friendly, feature-rich
- AWS SQS: Managed service, scales automatically (cloud-only)

*Alternative: BullMQ (Redis-backed queue for Node.js)*

*Rationale:*
- Simpler setup for self-hosted deployments
- Built on Redis, reduces infrastructure complexity
- Good scheduling and retry capabilities

### 6.6 Search

**Elasticsearch OR PostgreSQL Full-Text Search**

*Elasticsearch Rationale:*
- Advanced full-text search across clients, services, appointments
- Faceted search and filtering
- Scales independently
- Good for analytics queries

*PostgreSQL Full-Text Search Rationale:*
- Simpler architecture (no additional service)
- Sufficient for most search needs
- Lower operational overhead
- Good performance with proper indexing

*Recommendation:* Start with PostgreSQL full-text search, migrate to Elasticsearch if search becomes a bottleneck.

### 6.7 File Storage

**AWS S3 OR MinIO (self-hosted)**

*Rationale:*
- S3: Industry standard, highly durable, CDN integration
- MinIO: S3-compatible, self-hosted option, same API
- Supports pre-signed URLs for secure direct uploads
- Versioning and lifecycle policies

### 6.8 Background Jobs

**BullMQ (Node.js) OR Temporal (language-agnostic)**

*BullMQ Rationale:*
- Redis-backed job queue
- Scheduled jobs for reminders, reports
- Job prioritization and retries
- Good UI for monitoring (Bull Board)

*Temporal Rationale:*
- Durable execution for long-running workflows
- Built-in retry and timeout handling
- Excellent for complex multi-step processes
- Steeper learning curve but more robust

*Recommendation:* BullMQ for initial implementation, consider Temporal for complex workflows later.

### 6.9 Real-Time Communication

**Socket.io (Node.js) OR WebSocket native (Go)**

*Rationale:*
- Real-time calendar updates across multiple users
- Fallback to long-polling for restricted networks
- Room-based broadcasting for tenant isolation
- Connection state management

### 6.10 AI/ML Stack

**Python with FastAPI + scikit-learn/PyTorch**

*Rationale:*
- Python: De facto standard for ML development
- FastAPI: High-performance API framework, async support, auto-generated docs
- scikit-learn: Traditional ML models (logistic regression, random forests)
- PyTorch: Deep learning if needed for advanced features
- Deployable as separate microservice
- Can be containerized and called via API

**Alternative: Node.js with TensorFlow.js**

*Consideration:* Keeps entire stack in JavaScript but limited ML library ecosystem compared to Python.

### 6.11 Testing

**Frontend:**
- Unit: Jest + React Testing Library
- Integration: Playwright or Cypress
- Visual regression: Chromatic or Percy

**Backend:**
- Unit: Jest (Node.js) or Go's built-in testing
- Integration: Supertest (Node.js) or httptest (Go)
- E2E: Playwright or Postman/Newman
- Load testing: k6 or Artillery

### 6.12 Monitoring & Observability

**Metrics: Prometheus + Grafana**

*Rationale:*
- Open-source, self-hosted friendly
- Rich ecosystem of exporters
- Powerful query language (PromQL)
- Grafana provides excellent dashboards

**Logging: ELK Stack (Elasticsearch, Logstash, Kibana) OR Loki**

*Rationale:*
- Centralized logging with full-text search
- Loki: Lighter weight, integrates well with Grafana
- Structured logging with correlation IDs

**Tracing: Jaeger or OpenTelemetry**

*Rationale:*
- Distributed tracing across microservices
- Performance bottleneck identification
- OpenTelemetry: Vendor-neutral, future-proof

**Error Tracking: Sentry**

*Rationale:*
- Automatic error capture with stack traces
- Release tracking
- Performance monitoring
- Self-hosted option available

### 6.13 CI/CD

**GitHub Actions OR GitLab CI**

*Rationale:*
- Integrated with source control
- Flexible pipeline definitions
- Good ecosystem of actions/runners
- Free tier suitable for startups

**Containerization: Docker + Docker Compose (dev) / Kubernetes (production)**

*Rationale:*
- Docker: Consistent environments across dev/staging/prod
- Docker Compose: Simple orchestration for self-hosted single-tenant
- Kubernetes: Robust orchestration for multi-tenant SaaS, auto-scaling, self-healing

**Alternative for Kubernetes: AWS ECS/Fargate, Google Cloud Run**

*Consideration:* Managed container platforms reduce operational overhead but cloud-specific.

### 6.14 Infrastructure as Code

**Terraform OR Pulumi**

*Rationale:*
- Version-controlled infrastructure
- Multi-cloud support
- Pulumi: Use TypeScript/Go for infrastructure code (same language as app)
- Terraform: More mature, larger ecosystem

### 6.15 Authentication

**JWT + OAuth 2.0 / OpenID Connect**

*Implementation Options:*
- DIY: Auth service using Passport.js (Node.js) or golang-jwt (Go)
- Managed: Auth0, Firebase Auth, AWS Cognito (cloud dependencies)
- Self-hosted: Keycloak, Ory Kratos

*Recommendation:* DIY auth service for full control in self-hosted mode, with optional Auth0 integration for SaaS mode convenience.

### 6.16 Payment Processing

**Stripe (primary) + PayPal (optional)**

*Rationale:*
- Stripe: Best-in-class API, extensive features, PCI compliance handled
- Strong multi-currency support
- Subscription billing for memberships
- Connect API for marketplace scenarios
- Self-hosted compatible (API-based, no cloud lock-in)

### 6.17 Communication

**Email: SendGrid OR AWS SES**

*Rationale:*
- Reliable delivery, templates, tracking
- SendGrid: Easier setup, better UI
- AWS SES: More cost-effective at scale

**SMS: Twilio**

*Rationale:*
- Global coverage, reliable API
- Programmable SMS with templates
- Two-way messaging support

**Push Notifications: Firebase Cloud Messaging (FCM) OR OneSignal**

*Rationale:*
- FCM: Free, supports iOS and Android web push
- OneSignal: More features, better segmentation

### 6.18 Calendar Integration

**Google Calendar API + Microsoft Graph API + CalDAV**

*Rationale:*
- Google: Largest user base
- Microsoft: Outlook/Office 365 support
- CalDAV: Apple Calendar and open standard

### 6.19 Development Environment

**IDE: VS Code**

*Rationale:*
- Excellent TypeScript support
- Rich extension ecosystem
- Integrated debugging
- Free and open-source

**Version Control: Git + GitHub/GitLab**

*Rationale:*
- Industry standard
- Pull request workflows
- Issue tracking integration

**Package Management:**
- Node.js: pnpm (faster, more efficient than npm/yarn)
- Go: Built-in go modules

### 6.20 Documentation

**API Documentation: OpenAPI/Swagger UI**

*Rationale:*
- Interactive API exploration
- Auto-generated from code annotations
- Client SDK generation

**Developer Docs: Docusaurus OR VitePress**

*Rationale:*
- Static site generator for docs
- Markdown-based, version-controlled
- Search and navigation built-in

## 7. Implementation Phases

### Phase 1: MVP Core (Months 1-4)
- User authentication and role management
- Basic business and location setup
- Service definition and management
- Staff management with basic availability
- Simple appointment booking (single service, single client)
- Basic calendar views (day/week/month)
- Email notifications
- Payment integration (Stripe deposits)
- Responsive web UI

### Phase 2: Advanced Booking (Months 5-7)
- Recurring appointments
- Group bookings
- Appointment templates
- Buffer times and conflict resolution
- White-label widget
- SMS notifications
- Coupon and tax support
- Client profile and history
- No-show tracking

### Phase 3: Business Tools (Months 8-10)
- Analytics dashboards
- Reporting tools
- Email marketing campaigns
- Gift cards
- Memberships
- Advanced role and permission management
- Multi-location management
- External calendar sync (Google/Apple)

### Phase 4: AI and Optimization (Months 11-14)
- Data collection framework
- Basic ML models for no-show prediction
- Smart buffer time adjustments
- Intelligent upsell recommendations
- Demand forecasting
- Automated schedule optimization

### Phase 5: Scale and Polish (Months 15-18)
- Performance optimization
- Advanced PWA features and offline mode
- Comprehensive audit logs
- GDPR tooling (data export, deletion)
- Advanced integrations (accounting, analytics)
- Self-hosted deployment package
- Security hardening and compliance certifications

## 8. Success Metrics

### Business Metrics
- Monthly Recurring Revenue (MRR) growth
- Customer Acquisition Cost (CAC)
- Customer Lifetime Value (LTV)
- Churn rate < 5% monthly
- Net Promoter Score (NPS) > 50

### Product Metrics
- Appointments booked per business per month
- No-show rate reduction (target: 20% improvement)
- Average booking value increase (target: 15% via upsells)
- Time to complete booking (target: < 2 minutes)
- Widget adoption rate (target: 60% of businesses)

### Technical Metrics
- API uptime > 99.9%
- p95 response time < 500ms
- Error rate < 0.1%
- Mobile Lighthouse score > 90
- Test coverage > 80%

## 9. Risks and Mitigations

### Technical Risks
- **Risk:** Calendar conflict resolution at scale
  - *Mitigation:* Optimistic locking, retry logic, WebSocket updates, comprehensive testing

- **Risk:** Data isolation breach in multi-tenant architecture
  - *Mitigation:* Row-level security, automated tests for tenant isolation, regular security audits

- **Risk:** Offline sync conflicts
  - *Mitigation:* Clear conflict resolution UI, last-write-wins with notifications, operation queuing

### Business Risks
- **Risk:** Payment gateway dependency
  - *Mitigation:* Support multiple gateways, abstract payment logic, clear customer communication

- **Risk:** AI/ML features underperform or take too long
  - *Mitigation:* Phase AI as enhancement not core feature, start with rule-based alternatives

- **Risk:** Self-hosted version cannibalizes SaaS revenue
  - *Mitigation:* Premium features for SaaS only, managed hosting tier, enterprise support packages

### Compliance Risks
- **Risk:** GDPR enforcement actions
  - *Mitigation:* Privacy by design, regular compliance audits, legal review, clear data policies

- **Risk:** PCI-DSS breach
  - *Mitigation:* Never store card data, use tokenization, regular security scans

## 10. Open Questions for Stakeholder Decision

1. **Pricing Model:** Freemium vs. free trial? Per-appointment fees vs. flat monthly?
2. **Mobile Apps:** Native iOS/Android apps or PWA sufficient initially?
3. **AI Features:** How much historical data required before enabling? Opt-in or opt-out?
4. **Marketplace (USP #3):** Implement in Phase 1 or defer to Phase 4+?
5. **HIPAA Compliance:** Required from day one or premium addon?
6. **Geographic Focus:** Initial launch in specific regions or global from start?
7. **White-Label Depth:** How much customization (CSS only vs. full rebrand)?
8. **Support Model:** Email only, chat, phone? In-house vs. outsourced?
