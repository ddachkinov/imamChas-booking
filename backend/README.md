# Booking Platform Backend

RESTful API for a multi-tenant booking and appointment management platform built with NestJS, TypeORM, and PostgreSQL.

## Features

- **Multi-tenant Architecture**: Complete tenant isolation with tenant-scoped data
- **Authentication & Authorization**: JWT-based auth with RS256, RBAC, and granular permissions
- **Business Management**: Businesses, locations, services, staff, and client management
- **Appointment Booking**: Full booking engine with availability calculation and conflict detection
- **Calendar System**: Day/week/month views, blocked time, and schedule management
- **Notifications**: Multi-channel notifications (Email, SMS, Push) with templating
- **Analytics**: Business metrics and reporting (planned)
- **Payments**: Payment processing integration (planned)

## Tech Stack

- **Framework**: NestJS 10.x
- **Language**: TypeScript 5.x (strict mode)
- **Database**: PostgreSQL 15+ with TypeORM
- **Cache**: Redis 7+
- **Authentication**: JWT (RS256), Passport, Argon2id
- **Queue**: BullMQ
- **Logging**: Winston
- **API Documentation**: Swagger/OpenAPI
- **Testing**: Jest

## Architecture

### Database Entities (22 entities across 11 modules)

#### 1. Authentication & Authorization
- `User` - User accounts with OAuth providers, MFA, email verification
- `Tenant` - Multi-tenant isolation with subscription management
- `Role` - Role definitions with scoped assignments
- `Permission` - Granular permissions (resource:action:scope)
- `UserRole` - User-role junction table
- `RolePermission` - Role-permission junction table
- `PasswordResetToken` - Password reset tokens (SHA-256 hashed)
- `EmailVerificationToken` - Email verification tokens

#### 2. Business Management
- `Business` - Business profiles
- `Location` - Physical locations with business hours
- `Service` - Service catalog with pricing and duration
- `ServiceAddon` - Additional services
- `LocationService` - Location-service junction table
- `StaffMember` - Staff management with roles
- `StaffSkill` - Staff skills and certifications
- `Availability` - Staff availability patterns

#### 3. Client Management
- `ClientProfile` - Client information and preferences

#### 4. Booking & Scheduling
- `Appointment` - Appointment bookings
- `AppointmentAddon` - Appointment add-ons
- `BlockedTime` - Time blocks (breaks, time-off, meetings)

#### 5. Notifications
- `Notification` - Notification records
- `NotificationTemplate` - Notification templates

## API Modules

### 1. AuthModule
**Endpoints:**
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout single session
- `POST /auth/logout-all` - Logout all sessions
- `POST /auth/password-reset/request` - Request password reset
- `POST /auth/password-reset/confirm` - Confirm password reset
- `POST /auth/verify-email` - Verify email address
- `GET /auth/me` - Get current user

**Features:**
- RS256 JWT signing with RSA keys
- Refresh token rotation (single-use)
- Account lockout after 5 failed attempts (15 min)
- Password reset rate limiting (5/hour)
- Token revocation in Redis

### 2. UsersModule
**Endpoints:**
- `GET /users` - List users (paginated)
- `GET /users/:id` - Get user by ID
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user (soft delete)
- `GET /users/:id/permissions` - Get user permissions

### 3. TenantsModule
**Endpoints:**
- `POST /tenants` - Create tenant
- `GET /tenants/:id` - Get tenant
- `PATCH /tenants/:id` - Update tenant
- `GET /tenants/:id/subscription` - Get subscription info

### 4. BusinessesModule
**Endpoints:**
- `POST /businesses` - Create business
- `GET /businesses` - List businesses
- `GET /businesses/:id` - Get business
- `PATCH /businesses/:id` - Update business
- `DELETE /businesses/:id` - Delete business

### 5. LocationsModule
**Endpoints:**
- `POST /locations` - Create location
- `GET /locations` - List locations
- `GET /locations/:id` - Get location
- `PATCH /locations/:id` - Update location
- `DELETE /locations/:id` - Delete location
- `POST /locations/:id/set-primary` - Set primary location

### 6. ServicesModule
**Endpoints:**
- `POST /services` - Create service
- `GET /services` - List services (with filters)
- `GET /services/:id` - Get service
- `PATCH /services/:id` - Update service
- `DELETE /services/:id` - Delete service
- `POST /services/bulk-deactivate` - Bulk deactivate services

### 7. StaffModule
**Endpoints:**
- `POST /staff/invite` - Invite staff member
- `GET /staff` - List staff members
- `GET /staff/:id` - Get staff member
- `PATCH /staff/:id` - Update staff member
- `DELETE /staff/:id` - Remove staff member
- `GET /staff/:id/availability` - Get staff availability
- `POST /staff/:id/availability` - Set staff availability

### 8. ClientsModule
**Endpoints:**
- `POST /clients` - Create client
- `GET /clients` - List clients (with search)
- `GET /clients/:id` - Get client
- `PATCH /clients/:id` - Update client
- `DELETE /clients/:id` - Delete client
- `POST /clients/:id/notes` - Add note
- `GET /clients/:id/notes` - Get notes
- `GET /clients/export/csv` - Export clients to CSV

### 9. AppointmentsModule
**Endpoints:**
- `POST /appointments` - Create appointment
- `GET /appointments` - List appointments
- `GET /appointments/:id` - Get appointment
- `PATCH /appointments/:id` - Update appointment
- `DELETE /appointments/:id` - Cancel appointment
- `POST /appointments/check-availability` - Check time slot availability
- `POST /appointments/:id/reschedule` - Reschedule appointment
- `POST /appointments/:id/confirm` - Confirm appointment
- `POST /appointments/:id/complete` - Mark as completed

### 10. CalendarModule
**Endpoints:**
- `GET /calendar/view` - Get calendar view (any type)
- `GET /calendar/day` - Get day view
- `GET /calendar/week` - Get week view
- `GET /calendar/month` - Get month view
- `GET /calendar/resource` - Get resource view (multi-staff)
- `POST /calendar/blocked-time` - Create blocked time
- `GET /calendar/blocked-time` - List blocked times
- `PATCH /calendar/blocked-time/:id` - Update blocked time
- `DELETE /calendar/blocked-time/:id` - Delete blocked time
- `GET /calendar/schedule/summary` - Get schedule summary
- `GET /calendar/schedule/range` - Get schedule for date range
- `POST /calendar/export` - Export calendar (iCal, CSV)
- `GET /calendar/export/appointment/:id` - Export single appointment

**Features:**
- Multiple calendar views with 15-minute time slots
- Color-coded appointments by status
- Staff color coding (deterministic)
- Conflict detection for overlapping appointments
- Utilization percentage calculation
- Gap analysis between appointments
- iCalendar export (RFC 5545 format)
- CSV export

### 11. NotificationsModule
**Endpoints:**
- `POST /notifications/send` - Send notification
- `GET /notifications` - List notifications
- `GET /notifications/:id` - Get notification
- `PATCH /notifications/:id/read` - Mark as read
- `GET /notifications/templates` - List templates
- `POST /notifications/templates` - Create template
- `PATCH /notifications/templates/:id` - Update template

**Channels:**
- Email (SendGrid)
- SMS (Twilio)
- Push (Firebase Cloud Messaging)

## Security Features

### Password Security
- **Argon2id** hashing (64MB memory, 3 iterations, parallelism 4)
- Password complexity validation
- Password reset with SHA-256 hashed tokens (256-bit entropy)
- Rate limiting on password reset (5 requests/hour)

### JWT Security
- **RS256** algorithm (2048-bit RSA keys)
- Access token expiry: 1 hour
- Refresh token expiry: 30 days
- Refresh token rotation (single-use)
- Token revocation list in Redis
- Revocation check on every authenticated request

### Account Security
- Account lockout after 5 failed login attempts
- 15-minute lockout duration with exponential backoff
- Email verification requirement
- Failed attempt tracking in Redis

### Multi-Tenant Security
- Tenant-scoped data access
- Tenant ID in JWT payload
- All queries filtered by tenant_id
- Row-level security via TypeORM

## Database Indexes

All entities have optimized indexes:
- `tenant_id` on all tenant-scoped tables
- Composite indexes for common queries
- Unique constraints (tenant+email, tenant+role, etc.)
- B-tree indexes for timestamps
- Hash indexes for lookup fields

## Environment Variables

See `.env.example` for all required variables:

**Required:**
- `DATABASE_*` - PostgreSQL connection
- `REDIS_*` - Redis connection
- `JWT_PRIVATE_KEY_PATH` - Path to RSA private key
- `JWT_PUBLIC_KEY_PATH` - Path to RSA public key

**Optional:**
- `SENDGRID_API_KEY` - Email notifications
- `TWILIO_*` - SMS notifications
- `GOOGLE_*` - OAuth login
- `STRIPE_*` - Payment processing

## Installation

```bash
# Install dependencies
npm install

# Generate RSA keys
openssl genrsa -out private.key 2048
openssl rsa -in private.key -pubout -out public.key

# Create .env file
cp .env.example .env
# Edit .env with your configuration

# Start Docker services
cd ..
docker-compose up -d postgres redis

# Run migrations
npm run migration:run

# Seed database
npm run seed
```

## Development

```bash
# Start in development mode (with hot reload)
npm run start:dev

# API will be available at:
# - http://localhost:3000/api
# - http://localhost:3000/api/docs (Swagger)
```

## Testing

```bash
# Run unit tests
npm run test

# Run tests with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e

# Watch mode
npm run test:watch
```

## Database Migrations

```bash
# Generate migration from entity changes
npm run migration:generate -- src/database/migrations/MigrationName

# Create empty migration
npm run migration:create -- src/database/migrations/MigrationName

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Show migration status
npm run typeorm migration:show
```

## Production Build

```bash
# Build for production
npm run build

# Start production server
npm run start:prod
```

## API Documentation

Swagger documentation is available at `/api/docs` when the server is running.

Features:
- Interactive API testing
- Request/response schemas
- Authentication testing with Bearer tokens
- All endpoints documented with examples

## Project Structure

```
src/
├── app.module.ts           # Root module
├── main.ts                 # Application entry point
├── common/                 # Shared utilities
│   ├── decorators/         # Custom decorators
│   ├── dtos/              # Common DTOs
│   ├── enums/             # Enums
│   ├── filters/           # Exception filters
│   ├── guards/            # Auth guards
│   ├── interceptors/      # Response interceptors
│   └── interfaces/        # Common interfaces
├── config/                # Configuration
│   ├── database.config.ts # Database config
│   └── logger.config.ts   # Winston config
├── database/              # Database
│   ├── data-source.ts    # TypeORM data source
│   ├── migrations/        # Migrations
│   └── seeds/            # Seed data
└── modules/              # Feature modules
    ├── auth/             # Authentication
    ├── users/            # User management
    ├── tenants/          # Tenant management
    ├── businesses/       # Business management
    ├── locations/        # Location management
    ├── services/         # Service catalog
    ├── staff/            # Staff management
    ├── clients/          # Client database
    ├── appointments/     # Appointment booking
    ├── calendar/         # Calendar system
    ├── notifications/    # Notifications
    ├── payments/         # Payment processing (planned)
    └── analytics/        # Analytics (planned)
```

Each module follows this structure:
```
module-name/
├── module-name.module.ts    # Module definition
├── module-name.controller.ts # REST endpoints
├── module-name.service.ts    # Business logic
├── entities/                 # TypeORM entities
├── dto/                      # Data transfer objects
├── guards/                   # Module-specific guards
└── module-name.service.spec.ts # Unit tests
```

## Code Quality

### TypeScript
- Strict mode enabled
- Path aliases configured (@/, @modules/, @common/, @config/)
- Full type coverage
- No implicit any

### Linting
```bash
npm run lint        # Run ESLint
npm run format      # Run Prettier
```

### Testing
- Unit tests for services
- E2E tests for controllers
- Test coverage reporting

## Performance

### Database
- Connection pooling (max: 10, min: 2)
- Query optimization with indexes
- Efficient joins with TypeORM relations
- Soft deletes for tenant data

### Caching
- Redis for session data
- Token revocation list
- Account lockout tracking
- Rate limit counters

### API
- Global validation pipe
- Response transformation
- Request timeout handling
- Efficient pagination

## Logging

Winston logger with:
- Console transport (development)
- File transports (error.log, combined.log)
- Structured logging (JSON format)
- Log levels: error, warn, info, debug
- Request/response logging
- Error stack traces

## Health Checks

```bash
# Application health
GET /health

# Database health
GET /health/db

# Redis health
GET /health/redis
```

## Troubleshooting

See [DEPLOYMENT.md](../docs/DEPLOYMENT.md) for common issues and solutions.

## Contributing

1. Create feature branch from `main`
2. Make changes with tests
3. Run linting: `npm run lint`
4. Run tests: `npm run test`
5. Submit pull request

## License

UNLICENSED - Private project
