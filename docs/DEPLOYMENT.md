# Deployment Guide

This guide covers deploying the booking platform to production, including frontend, backend, database, and infrastructure setup.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Backend Deployment](#backend-deployment)
6. [Frontend Deployment](#frontend-deployment)
7. [Docker Deployment](#docker-deployment)
8. [CI/CD Pipeline](#cicd-pipeline)
9. [Monitoring and Logging](#monitoring-and-logging)
10. [Security Checklist](#security-checklist)
11. [Troubleshooting](#troubleshooting)

## Architecture Overview

### Production Architecture

```
                    ┌─────────────────┐
                    │   CloudFlare    │
                    │      CDN        │
                    └────────┬────────┘
                             │
        ┌────────────────────┴────────────────────┐
        │                                         │
┌───────▼────────┐                       ┌───────▼────────┐
│   Frontend     │                       │    Backend     │
│   (Vercel)     │                       │   (Railway)    │
│   React + Vite │───────HTTP───────────▶│    NestJS      │
└────────────────┘                       └───────┬────────┘
                                                 │
                                    ┌────────────┴────────────┐
                                    │                         │
                            ┌───────▼────────┐       ┌───────▼────────┐
                            │   PostgreSQL   │       │     Redis      │
                            │   (Supabase)   │       │   (Upstash)    │
                            └────────────────┘       └────────────────┘
```

### Recommended Services

| Component | Service | Alternative |
|-----------|---------|-------------|
| Frontend Hosting | Vercel | Netlify, AWS Amplify |
| Backend Hosting | Railway | Render, Heroku, AWS ECS |
| Database | Supabase | Railway PostgreSQL, AWS RDS |
| Redis | Upstash | Railway Redis, AWS ElastiCache |
| File Storage | AWS S3 | Cloudinary, DigitalOcean Spaces |
| Email | SendGrid | Mailgun, AWS SES |
| SMS | Twilio | - |
| Monitoring | Sentry | LogRocket, Datadog |
| Analytics | PostHog | Mixpanel, Amplitude |


## Prerequisites

### Required Tools

```bash
# Node.js 18+ and npm/yarn
node -v  # Should be 18.x or higher
npm -v

# Docker and Docker Compose
docker --version
docker-compose --version

# Git
git --version

# CLI tools for cloud providers
vercel --version  # For Vercel deployment
railway --version  # For Railway deployment
```

### Accounts Required

- [ ] GitHub account (for code repository)
- [ ] Vercel account (for frontend hosting)
- [ ] Railway/Render account (for backend hosting)
- [ ] Supabase account (for database)
- [ ] Upstash account (for Redis)
- [ ] AWS account (for S3 storage)
- [ ] SendGrid account (for email)
- [ ] Twilio account (for SMS)
- [ ] Sentry account (for error monitoring)

## Environment Configuration

### Backend Environment Variables

Create `.env.production` in the backend directory:

```bash
# Node Environment
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
DB_SSL_ENABLED=true

# Redis
REDIS_URL=redis://default:password@host:6379
REDIS_TLS_ENABLED=true

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key
REFRESH_TOKEN_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# File Upload (AWS S3)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
S3_BUCKET_NAME=your-bucket-name
S3_PUBLIC_URL=https://your-bucket.s3.amazonaws.com

# Email (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Your Business Name

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Payment (Stripe)
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
STRIPE_PUBLIC_KEY=pk_live_your-stripe-public-key

# Calendar Integration (Google)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://api.yourdomain.com/auth/google/callback

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# Feature Flags
ENABLE_WEBSOCKET=true
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_SMS_NOTIFICATIONS=true
```

### Frontend Environment Variables

Create `.env.production` in the frontend directory:

```bash
# API URLs
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com

# Public Keys
VITE_STRIPE_PUBLIC_KEY=pk_live_your-stripe-public-key
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_TRACKING=true

# Sentry
VITE_SENTRY_DSN=https://your-sentry-dsn
VITE_SENTRY_ENVIRONMENT=production

# Analytics
VITE_POSTHOG_KEY=your-posthog-key
VITE_POSTHOG_HOST=https://app.posthog.com
```

### Environment Variable Security

**IMPORTANT**: Never commit environment files to git.

```bash
# .gitignore should include:
.env
.env.*
!.env.example
```

Store production secrets in:
- **Railway/Render**: Dashboard → Environment Variables
- **Vercel**: Dashboard → Project Settings → Environment Variables
- **Local Development**: Use `.env.local` (gitignored)

## Database Setup

### Using Supabase (Recommended)

1. **Create Project**: Visit https://supabase.com/dashboard → New Project
2. **Get Connection String**: Settings → Database → Connection string (Transaction mode)
3. **Run Migrations**:
   ```bash
   cd backend
   export DATABASE_URL="your-supabase-connection-string"
   npm run migration:run
   ```
4. **Seed Database**:
   ```bash
   npm run seed
   ```

### Using Railway PostgreSQL

1. **Add Database**: Railway Dashboard → New → Database → PostgreSQL
2. **Copy DATABASE_URL**: From Variables tab
3. **Run Migrations**: Same as above

### Database Backups

```bash
# Manual backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup-20251107.sql

# Automated backups:
# - Supabase: Automatic daily backups (7-day retention)
# - Railway: Set up using Railway CLI or manual cron
```

## Backend Deployment

### Deploy to Railway

1. **Install CLI**:
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Initialize Project**:
   ```bash
   cd backend
   railway init
   ```

3. **Set Environment Variables** (in Railway Dashboard):
   - Go to project → Variables tab
   - Add all variables from `.env.production`

4. **Deploy**:
   ```bash
   railway up
   ```

5. **Custom Domain** (Optional):
   ```bash
   railway domain add api.yourdomain.com
   # Add CNAME record: api.yourdomain.com → [railway-domain]
   ```

### Deploy to Render

1. **Create Web Service**: Dashboard → New → Web Service
2. **Settings**:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start:prod`
3. **Environment**: Add all production variables
4. **Deploy**: Click "Create Web Service"

### Health Check Endpoint

```typescript
// backend/src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
```

## Frontend Deployment

### Deploy to Vercel

1. **Install CLI**:
   ```bash
   npm install -g vercel
   vercel login
   ```

2. **Deploy**:
   ```bash
   cd frontend
   vercel --prod
   ```

3. **Environment Variables** (in Vercel Dashboard):
   - Project Settings → Environment Variables
   - Add all `VITE_*` variables
   - Redeploy after adding variables

4. **Custom Domain**:
   ```bash
   vercel domains add yourdomain.com
   # Add DNS records as instructed
   ```

### Deploy to Netlify

1. **Create `netlify.toml`**:
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. **Deploy**:
   ```bash
   npm install -g netlify-cli
   netlify login
   netlify init
   netlify deploy --prod
   ```

## Docker Deployment

### Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: booking_platform
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/booking_platform
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      NODE_ENV: production
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      VITE_API_URL: http://backend:3000
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:
```

### Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
RUN addgroup -g 1001 nodejs && adduser -S nestjs -u 1001
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
USER nestjs
EXPOSE 3000
CMD ["node", "dist/main"]
```

### Frontend Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Deploy

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Test Backend
        run: |
          cd backend
          npm ci
          npm run test
      - name: Test Frontend
        run: |
          cd frontend
          npm ci
          npm run test

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: backend

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: frontend
```

### Required Secrets

Add in GitHub Settings → Secrets:
- `RAILWAY_TOKEN`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## Monitoring and Logging

### Sentry Error Tracking

1. **Install**:
   ```bash
   # Backend
   npm install @sentry/node

   # Frontend
   npm install @sentry/react
   ```

2. **Backend Setup**:
   ```typescript
   // backend/src/main.ts
   import * as Sentry from '@sentry/node';

   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: process.env.NODE_ENV,
   });
   ```

3. **Frontend Setup**:
   ```typescript
   // frontend/src/main.tsx
   import * as Sentry from '@sentry/react';

   Sentry.init({
     dsn: import.meta.env.VITE_SENTRY_DSN,
     environment: import.meta.env.VITE_SENTRY_ENVIRONMENT,
   });
   ```

### Application Logs

```typescript
// backend/src/logger/logger.service.ts
import { Injectable, LoggerService } from '@nestjs/common';

@Injectable()
export class AppLogger implements LoggerService {
  log(message: string, context?: string) {
    console.log(`[${context}] ${message}`);
  }

  error(message: string, trace?: string, context?: string) {
    console.error(`[${context}] ${message}`, trace);
  }

  warn(message: string, context?: string) {
    console.warn(`[${context}] ${message}`);
  }
}
```

## Security Checklist

### Pre-Deployment

- [ ] All environment variables use strong, unique values
- [ ] JWT secrets are cryptographically secure (32+ characters)
- [ ] Database uses SSL/TLS connections
- [ ] API uses HTTPS (TLS 1.2+)
- [ ] CORS configured with specific origins (not `*`)
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection protection (ORM)
- [ ] XSS protection enabled
- [ ] File upload validation
- [ ] Dependencies scanned (`npm audit`)
- [ ] Error messages don't leak sensitive data
- [ ] Admin endpoints require authentication

### Security Headers

```nginx
# nginx.conf
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Strict-Transport-Security "max-age=31536000" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
```

### SSL Certificate

```bash
# Using Let's Encrypt
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (cron)
0 12 * * * /usr/bin/certbot renew --quiet
```

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL

# Enable SSL
psql "$DATABASE_URL?sslmode=require"

# Common fixes:
# - Enable SSL in database settings
# - Whitelist backend IP
# - Check connection pool settings
```

### CORS Errors

```typescript
// Ensure CORS is properly configured
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS.split(','),
  credentials: true,
});
```

### Memory Issues

```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=2048" node dist/main.js
```

### Build Failures

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node version
node -v  # Should be 18.x
```

### Deployment Verification

```bash
# Check backend health
curl https://api.yourdomain.com/health

# Check frontend
curl https://yourdomain.com

# Test API
curl https://api.yourdomain.com/api/appointments

# Check SSL
openssl s_client -connect yourdomain.com:443
```

### Rollback

**Vercel**:
```bash
vercel rollback [deployment-url]
```

**Railway**:
```bash
# Redeploy previous commit
git revert HEAD
git push
```

**Database**:
```bash
# Restore from backup
psql $DATABASE_URL < backup-20251107.sql
```

## Post-Deployment Checklist

- [ ] Frontend loads at production URL
- [ ] Backend health check returns 200
- [ ] Database migrations applied
- [ ] Can log in with test account
- [ ] Can create appointment (full flow)
- [ ] Email notifications work
- [ ] SMS notifications work (if enabled)
- [ ] Payment processing works
- [ ] Real-time updates work (WebSocket)
- [ ] File uploads work
- [ ] Analytics tracking enabled
- [ ] Error tracking captures errors
- [ ] SSL certificate valid
- [ ] No console errors
- [ ] No server errors in logs
- [ ] Performance acceptable
- [ ] Mobile responsive
- [ ] Cross-browser compatible

## Maintenance

### Regular Tasks

**Daily**:
- Monitor error rates in Sentry
- Check server resource usage
- Review application logs

**Weekly**:
- Review database performance
- Check backup integrity
- Update dependencies (patch versions)

**Monthly**:
- Security audit (`npm audit`)
- Review slow queries
- Database maintenance (vacuum, reindex)
- Update documentation

### Scaling

**When to scale**:
- CPU usage >70%
- Memory usage >80%
- Response times >1s
- Connection pool exhausted

**Horizontal scaling**:
- Increase replicas in platform dashboard
- Requires stateless backend (sessions in Redis)
- Load balancer (automatic in most platforms)

**Vertical scaling**:
- Upgrade instance size
- Increase database resources
- Add read replicas

## Conclusion

This deployment guide covers production deployment essentials:

1. Use managed services for easier operations
2. Implement monitoring and logging
3. Follow security best practices
4. Automate with CI/CD
5. Test thoroughly
6. Have rollback procedures ready
7. Monitor post-deployment
8. Plan for scaling

For more information:
- [NestJS Deployment](https://docs.nestjs.com/deployment)
- [Vite Deployment](https://vitejs.dev/guide/static-deploy.html)
- Platform-specific docs (Railway, Vercel, etc.)
