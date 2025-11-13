# 🚀 Quick Deployment Guide

## Current Status
Your infrastructure is ready:
- ✅ Server: 167.172.102.50
- ✅ Domain: ic-booking.groundpoint.net
- ✅ PostgreSQL + Redis: Running
- ✅ Caddy: Running with HTTPS
- ❌ Backend: Not deployed yet
- ❌ Frontend: Not deployed yet

## Deploy in 5 Minutes

### Step 1: SSH into your server
```bash
ssh root@167.172.102.50
cd /opt/booking-platform
```

### Step 2: Pull latest changes
```bash
git fetch origin
git checkout claude/deployment-guide-setup-011CUwuTridpzaUvppwbdCji
git pull origin claude/deployment-guide-setup-011CUwuTridpzaUvppwbdCji
```

### Step 3: Check if .env.production exists
```bash
ls -la .env.production
```

**If it doesn't exist**, create it with the essential values:
```bash
cat > .env.production << 'EOF'
# Domain
MAIN_DOMAIN=ic-booking.groundpoint.net
ACME_EMAIL=ddachkinov@gmail.com

# Database (use existing values from your .env file if you have one)
DB_NAME=booking_platform
DB_USER=postgres
DB_PASSWORD=YOUR_DB_PASSWORD_HERE

# Redis
REDIS_PASSWORD=YOUR_REDIS_PASSWORD_HERE

# JWT Secrets
JWT_SECRET=$(openssl rand -hex 64)
REFRESH_TOKEN_SECRET=$(openssl rand -hex 64)
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Optional services (can be empty for now)
STRIPE_SECRET_KEY=
STRIPE_PUBLIC_KEY=
STRIPE_WEBHOOK_SECRET=
SENDGRID_API_KEY=
EMAIL_FROM=noreply@ic-booking.groundpoint.net
EMAIL_FROM_NAME=IC Booking
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET_NAME=
AWS_REGION=us-east-1
S3_PUBLIC_URL=
SENTRY_DSN=
VITE_SENTRY_DSN=
LOG_LEVEL=info
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ERROR_TRACKING=false
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
STRIPE_STARTER_PRICE_ID=
STRIPE_PROFESSIONAL_PRICE_ID=
STRIPE_ENTERPRISE_PRICE_ID=
EOF
```

**Important**: Replace `YOUR_DB_PASSWORD_HERE` and `YOUR_REDIS_PASSWORD_HERE` with the actual passwords from your existing `.env` file.

To find them:
```bash
# Check existing containers for the passwords
docker ps
docker exec booking-postgres env | grep POSTGRES_PASSWORD
docker exec booking-redis redis-cli --version  # Redis password is in the command
```

Or generate new ones:
```bash
# Generate new secure passwords
echo "DB_PASSWORD=$(openssl rand -hex 32)"
echo "REDIS_PASSWORD=$(openssl rand -hex 32)"
```

### Step 4: Stop old Caddy (if running standalone)
```bash
# Check if old caddy container exists
docker ps -a | grep caddy

# If you see a standalone caddy container (not from compose), stop it
docker stop caddy 2>/dev/null || true
docker rm caddy 2>/dev/null || true
```

### Step 5: Deploy everything
```bash
# Build and start all services (this will take 5-10 minutes first time)
docker compose -f docker-compose.prod.yml up -d --build

# Watch the build progress
docker compose -f docker-compose.prod.yml logs -f
```

Press `Ctrl+C` to stop watching logs (containers keep running).

### Step 6: Wait for services to be healthy
```bash
# Check status (wait until all show "healthy")
docker compose -f docker-compose.prod.yml ps
```

You should see:
```
NAME                IMAGE                 STATUS
booking-backend     ...                   Up (healthy)
booking-frontend    ...                   Up (healthy)
booking-postgres    postgres:15-alpine    Up (healthy)
booking-redis       redis:7-alpine        Up (healthy)
caddy               caddy:2.8-alpine      Up
```

### Step 7: Run database migrations
```bash
# Once backend is healthy, run migrations
docker compose -f docker-compose.prod.yml exec backend npm run migration:run
```

You should see:
```
query: SELECT * FROM "information_schema"."tables" WHERE "table_schema" = current_schema() AND "table_name" = 'migrations'
query: CREATE TABLE "migrations" ...
query: SELECT * FROM "migrations" ...
Migration InitialSchema1699000000000 has been executed successfully.
```

### Step 8: Create first tenant (in database)
```bash
# Connect to database
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d booking_platform

# In psql, run:
INSERT INTO tenants (id, name, slug, subdomain, status, subscription_tier, subscription_status)
VALUES (
  gen_random_uuid(),
  'Test Salon',
  'test-salon',
  'test-salon',
  'active',
  'professional',
  'active'
);

# Exit psql
\q
```

### Step 9: Test your deployment
Open your browser:

1. **Main Site**: https://ic-booking.groundpoint.net
   - Should show the React frontend (login/signup page)

2. **API Health**: https://api.ic-booking.groundpoint.net/health
   - Should return: `{"status":"ok"}`

3. **Tenant Site**: https://test-salon.ic-booking.groundpoint.net
   - Should show the booking interface for test-salon

## Troubleshooting

### Backend fails to start
```bash
# Check backend logs
docker compose -f docker-compose.prod.yml logs backend

# Common issues:
# - Database connection: Check DB_PASSWORD matches
# - Redis connection: Check REDIS_PASSWORD matches
# - Missing JWT_SECRET: Make sure it's in .env.production
```

### Frontend shows 404
```bash
# Check if frontend is running
docker compose -f docker-compose.prod.yml ps frontend

# Check frontend logs
docker compose -f docker-compose.prod.yml logs frontend

# Restart frontend
docker compose -f docker-compose.prod.yml restart frontend
```

### Caddy not routing correctly
```bash
# Check Caddyfile syntax
docker compose -f docker-compose.prod.yml exec caddy caddy validate --config /etc/caddy/Caddyfile

# Reload Caddy config
docker compose -f docker-compose.prod.yml exec caddy caddy reload --config /etc/caddy/Caddyfile

# Check Caddy logs
docker compose -f docker-compose.prod.yml logs caddy
```

### Out of memory during build
```bash
# Stop non-essential containers temporarily
docker compose -f docker-compose.prod.yml stop postgres redis caddy

# Build one service at a time
docker compose -f docker-compose.prod.yml build backend
docker compose -f docker-compose.prod.yml build frontend

# Start everything
docker compose -f docker-compose.prod.yml up -d
```

### Start over completely
```bash
# Nuclear option: remove everything and start fresh
docker compose -f docker-compose.prod.yml down -v
docker compose -f docker-compose.prod.yml up -d --build
```

## What's Running Where

After successful deployment:

- **Caddy** (port 80, 443): Reverse proxy with automatic HTTPS
  - Routes `ic-booking.groundpoint.net` → frontend:80
  - Routes `api.ic-booking.groundpoint.net` → backend:3000
  - Routes `*.ic-booking.groundpoint.net` → frontend:80 (and /api/* → backend:3000)

- **Backend** (internal port 3000): NestJS API
  - Health check: http://localhost:3000/health
  - API docs: http://localhost:3000/api/docs (if enabled)

- **Frontend** (internal port 80): React app served by Nginx
  - Serves static files
  - Routes all requests to index.html (SPA routing)

- **PostgreSQL** (internal port 5432): Database
  - Database: booking_platform
  - User: postgres

- **Redis** (internal port 6379): Cache and sessions
  - Used for JWT token blacklist and caching

## Next Steps

After deployment is successful:

1. **Create admin user**: Use the backend API to register the first user
2. **Set up business**: Create business, locations, services via admin UI
3. **Configure payments**: Add Stripe keys when ready
4. **Set up email**: Add SendGrid key when ready
5. **Custom domain**: Update DNS if you want a different domain

## Support

If you run into issues:
1. Check the logs: `docker compose -f docker-compose.prod.yml logs [service-name]`
2. Check service health: `docker compose -f docker-compose.prod.yml ps`
3. Check environment variables are loaded: `docker compose -f docker-compose.prod.yml config`
