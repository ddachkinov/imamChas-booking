# Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the booking platform in development and production environments.

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- PostgreSQL 15+ (if not using Docker)
- Redis 7+ (if not using Docker)
- Git

## Development Environment Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd imamChas-booking
```

### 2. Backend Setup

```bash
cd backend
npm install
```

### 3. Generate RSA Keys for JWT

The application uses RS256 algorithm for JWT tokens, which requires RSA key pairs:

```bash
# Generate private key (2048-bit)
openssl genrsa -out private.key 2048

# Generate public key from private key
openssl rsa -in private.key -pubout -out public.key

# Secure the private key
chmod 600 private.key
```

**Important:**
- Keep `private.key` secure and never commit to version control
- Both keys are already in `.gitignore`
- In production, use environment variables or secure vaults (AWS Secrets Manager, HashiCorp Vault)

### 4. Environment Configuration

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

**Required environment variables:**

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=<secure-password>
DATABASE_NAME=booking_dev

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_PRIVATE_KEY_PATH=./private.key
JWT_PUBLIC_KEY_PATH=./public.key
JWT_REFRESH_SECRET=<generate-secure-random-string>

# Email (SendGrid)
SENDGRID_API_KEY=<your-sendgrid-api-key>
FROM_EMAIL=noreply@yourdomain.com

# SMS (Twilio) - Optional
TWILIO_ACCOUNT_SID=<your-twilio-sid>
TWILIO_AUTH_TOKEN=<your-twilio-token>
TWILIO_PHONE_NUMBER=<your-twilio-number>

# Stripe
STRIPE_SECRET_KEY=<your-stripe-secret-key>
STRIPE_WEBHOOK_SECRET=<your-stripe-webhook-secret>

# Frontend
FRONTEND_URL=http://localhost:3001
```

### 5. Start Docker Services

```bash
cd ..  # Return to project root
docker-compose up -d postgres redis
```

**Verify services are running:**

```bash
docker-compose ps

# Should show:
# booking-postgres  running  0.0.0.0:5432->5432/tcp
# booking-redis     running  0.0.0.0:6379->6379/tcp
```

**Check service health:**

```bash
# PostgreSQL
docker exec booking-postgres pg_isready -U postgres

# Redis
docker exec booking-redis redis-cli ping
# Should return: PONG
```

### 6. Generate and Run Database Migrations

```bash
cd backend

# Generate migration from entities
npm run migration:generate -- src/database/migrations/InitialSchema

# Review the generated migration file in:
# backend/src/database/migrations/

# Run migrations
npm run migration:run

# Verify migrations were applied
npm run migration:show
```

**Migration Commands:**

```bash
# Generate new migration
npm run migration:generate -- src/database/migrations/MigrationName

# Create empty migration
npm run migration:create -- src/database/migrations/MigrationName

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Show migration status
npm run migration:show
```

### 7. Seed Database

```bash
# Run seed script
npm run seed

# This will create:
# - Default tenant (PROFESSIONAL tier)
# - 6 system roles (Super Admin, Tenant Admin, Business Owner, Manager, Staff, Client)
# - 45+ granular permissions
# - Admin user (admin@booking.local / Admin123!)
```

**Default Admin Credentials:**
- Email: `admin@booking.local`
- Password: `Admin123!`

**Important:** Change the admin password immediately after first login in production!

### 8. Start Backend Server

```bash
# Development mode with hot reload
npm run start:dev

# The server will start on http://localhost:3000
# Swagger API documentation: http://localhost:3000/api/docs
```

### 9. Frontend Setup

```bash
cd ../frontend
npm install

# Copy environment file
cp .env.example .env

# Edit frontend .env
# VITE_API_URL=http://localhost:3000/api

# Start development server
npm run dev

# Frontend will be available at http://localhost:3001
```

## Database Schema

The application uses 24 entities across 11 modules:

### Authentication & Authorization (8 entities)
- `tenant` - Multi-tenant isolation
- `user` - User accounts with OAuth support
- `role` - Role definitions
- `permission` - Granular permissions
- `user_role` - User-role assignments
- `role_permission` - Role-permission assignments
- `password_reset_token` - Password reset tokens
- `email_verification_token` - Email verification tokens

### Business Management (4 entities)
- `business` - Business profiles
- `location` - Physical locations
- `service` - Service catalog
- `staff_member` - Staff management

### Booking & Scheduling (3 entities)
- `client` - Client database
- `appointment` - Appointment bookings
- `appointment_addon` - Additional services

### Calendar & Notifications (3 entities)
- `blocked_time` - Time blocks (breaks, time-off)
- `notification` - Multi-channel notifications
- `notification_template` - Notification templates

### Analytics (6 entities)
- Various analytics and reporting tables

## Entity Relationships

```
tenant (1) ──< (many) user
tenant (1) ──< (many) business
business (1) ──< (many) location
business (1) ──< (many) service
business (1) ──< (many) staff_member
business (1) ──< (many) client
location (1) ──< (many) appointment
service (1) ──< (many) appointment
staff_member (1) ──< (many) appointment
client (1) ──< (many) appointment
staff_member (1) ──< (many) blocked_time
```

## Production Deployment

### Environment Preparation

1. **Update Environment Variables**

```env
NODE_ENV=production
DATABASE_PASSWORD=<strong-random-password>
JWT_REFRESH_SECRET=<strong-random-secret>
REDIS_PASSWORD=<strong-random-password>
```

2. **Security Checklist**

- [ ] Change default admin password
- [ ] Use strong database password
- [ ] Enable Redis password authentication
- [ ] Store RSA keys in secure vault
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable logging and monitoring
- [ ] Configure backup strategy
- [ ] Set up SSL/TLS for database connections

3. **Database Backup**

```bash
# Backup database
docker exec booking-postgres pg_dump -U postgres booking_prod > backup.sql

# Restore database
docker exec -i booking-postgres psql -U postgres booking_prod < backup.sql
```

4. **Build for Production**

```bash
cd backend
npm run build

# Backend will be built to dist/
# Start with: npm run start:prod
```

5. **Docker Production Deployment**

```bash
# Build production image
docker build -f backend/Dockerfile -t booking-backend:latest .

# Run with docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

### Monitoring

1. **Health Checks**

```bash
# Application health
curl http://localhost:3000/health

# Database connection
curl http://localhost:3000/health/db

# Redis connection
curl http://localhost:3000/health/redis
```

2. **Logs**

```bash
# View backend logs
tail -f backend/logs/error.log
tail -f backend/logs/combined.log

# Docker logs
docker logs -f booking-backend
docker logs -f booking-postgres
docker logs -f booking-redis
```

### Performance Optimization

1. **Database Indexes**

All critical queries have indexes defined in entity decorators:
- `tenant_id` on all tenant-scoped tables
- Composite indexes for common query patterns
- Unique constraints on email, role names, etc.

2. **Redis Caching**

- Session data cached in Redis
- Token revocation list in Redis
- Account lockout tracking in Redis

3. **Connection Pooling**

TypeORM connection pool configured in `database.config.ts`:
```typescript
max: 10,              // Maximum connections
min: 2,               // Minimum connections
idle: 10000,          // Idle timeout
acquire: 30000,       // Acquire timeout
evict: 1000           // Eviction check interval
```

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check PostgreSQL logs
docker logs booking-postgres

# Test connection
psql -h localhost -U postgres -d booking_dev
```

### Redis Connection Issues

```bash
# Check if Redis is running
docker ps | grep redis

# Test connection
redis-cli ping

# Check Redis logs
docker logs booking-redis
```

### Migration Issues

```bash
# Reset database (CAUTION: destroys all data)
npm run migration:revert  # Revert all migrations
npm run migration:run     # Re-run migrations

# Or drop and recreate database
docker-compose down
docker volume rm imamchas-booking_postgres_data
docker-compose up -d postgres
npm run migration:run
npm run seed
```

### Common Errors

**Error: "Private key not found"**
- Solution: Generate RSA keys using openssl commands above

**Error: "Cannot connect to database"**
- Check `DATABASE_HOST` in .env
- Verify PostgreSQL is running: `docker ps`
- Check credentials match docker-compose.yml

**Error: "Redis connection failed"**
- Check `REDIS_HOST` in .env
- Verify Redis is running: `docker ps`
- Test with: `redis-cli ping`

## API Documentation

Once the backend is running, access Swagger documentation:

```
http://localhost:3000/api/docs
```

## Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Run tests with coverage
npm run test:cov
```

## Continuous Integration

Example GitHub Actions workflow:

```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_DB: booking_test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd backend
          npm ci

      - name: Generate RSA keys
        run: |
          cd backend
          openssl genrsa -out private.key 2048
          openssl rsa -in private.key -pubout -out public.key

      - name: Run migrations
        run: |
          cd backend
          npm run migration:run

      - name: Run tests
        run: |
          cd backend
          npm run test:e2e
```

## Support

For issues and questions:
- GitHub Issues: [Link to repository issues]
- Documentation: [Link to full documentation]
- Email: support@yourdomain.com
