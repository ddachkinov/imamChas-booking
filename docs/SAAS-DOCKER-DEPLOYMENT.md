# SaaS Deployment with Docker - The Easy Way

## Why Docker Makes This 10x Easier

Instead of managing:
- ❌ Vercel for frontend
- ❌ Railway for backend
- ❌ Supabase for database
- ❌ Upstash for Redis
- ❌ Complex DNS configuration
- ❌ Multiple deployment tools

You get:
- ✅ **Single server** (even a $12/mo VPS works!)
- ✅ **One command deployment**: `docker-compose up -d`
- ✅ **Automatic SSL** with Let's Encrypt
- ✅ **Automatic subdomain routing** with Traefik
- ✅ **Easy scaling**: Just add more containers
- ✅ **Built-in monitoring** and logs
- ✅ **Cost**: $12-40/mo vs $100-500/mo

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture](#architecture)
3. [Setup Guide](#setup-guide)
4. [Development Environment](#development-environment)
5. [Production Deployment](#production-deployment)
6. [Scaling](#scaling)
7. [Maintenance](#maintenance)
8. [Cost Comparison](#cost-comparison)

---

## Quick Start

### Prerequisites

```bash
# Server requirements
- Ubuntu 22.04 LTS or similar
- 2GB RAM minimum (4GB recommended)
- 20GB disk space
- Docker & Docker Compose installed

# Domain
- yourbrand.com pointed to your server IP
- Wildcard DNS: *.yourbrand.com → server IP
```

### 5-Minute Setup

```bash
# 1. Clone your repo
git clone https://github.com/yourusername/booking-platform.git
cd booking-platform

# 2. Configure environment
cp .env.example .env.production
nano .env.production  # Edit with your values

# 3. Start everything
docker-compose -f docker-compose.prod.yml up -d

# 4. Done! Your app is live at:
# - https://yourbrand.com (marketing site)
# - https://api.yourbrand.com (API)
# - https://*.yourbrand.com (tenant subdomains)
```

That's it! SSL certificates are automatic, subdomains work instantly.

---

## Architecture

### Simple Single-Server Architecture

```
                    ┌─────────────────────────┐
                    │      CloudFlare         │
                    │    (Optional CDN)       │
                    └───────────┬─────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │   Your Server ($12/mo)  │
                    │   DigitalOcean/Hetzner  │
                    └───────────┬─────────────┘
                                │
            ┌───────────────────┼───────────────────┐
            │                                       │
┌───────────▼──────────┐              ┌────────────▼────────┐
│   Traefik (Reverse   │              │   Docker Containers │
│   Proxy + SSL)       │              │   - Frontend        │
│   - Auto SSL         │◄────────────▶│   - Backend (3x)    │
│   - Load Balancer    │              │   - PostgreSQL      │
│   - Subdomain Router │              │   - Redis           │
└──────────────────────┘              │   - Worker          │
                                      └─────────────────────┘
```

### Container Structure

```
booking-platform/
├── traefik/              # Reverse proxy + SSL
├── frontend/             # React app
├── backend/              # NestJS API (multiple instances)
├── postgres/             # Database
├── redis/                # Cache & sessions
├── worker/               # Background jobs
└── docker-compose.yml    # Orchestration
```

---

## Setup Guide

### Step 1: Get a Server

**Recommended Providers:**

| Provider | Cost | Specs | Notes |
|----------|------|-------|-------|
| **Hetzner** | €4.51/mo | 2 vCPU, 4GB RAM | Best value, EU |
| **DigitalOcean** | $12/mo | 2 vCPU, 2GB RAM | Easy to use, global |
| **Vultr** | $12/mo | 2 vCPU, 4GB RAM | Good performance |
| **Linode** | $12/mo | 2 vCPU, 4GB RAM | Reliable |

**Create a Droplet/Instance:**
```bash
# Example with DigitalOcean
# 1. Go to digitalocean.com
# 2. Create Droplet
# 3. Choose:
#    - Ubuntu 22.04 LTS
#    - Basic plan ($12/mo)
#    - Choose datacenter near your users
# 4. Add your SSH key
# 5. Create

# Save the server IP: xxx.xxx.xxx.xxx
```

### Step 2: Configure DNS

**In your domain registrar or CloudFlare:**

```
Type: A
Name: @
Content: xxx.xxx.xxx.xxx
Proxy: No (or Yes if using CloudFlare CDN)

Type: A
Name: *
Content: xxx.xxx.xxx.xxx
Proxy: No (or Yes if using CloudFlare CDN)

Type: A
Name: api
Content: xxx.xxx.xxx.xxx
Proxy: No
```

**Verify DNS propagation:**
```bash
dig yourbrand.com
dig api.yourbrand.com
dig test.yourbrand.com  # Should all return your server IP
```

### Step 3: Install Docker on Server

```bash
# SSH into your server
ssh root@xxx.xxx.xxx.xxx

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version

# Enable Docker to start on boot
systemctl enable docker
```

### Step 4: Clone and Setup Project

```bash
# Create app directory
mkdir -p /opt/booking-platform
cd /opt/booking-platform

# Clone repository
git clone https://github.com/yourusername/booking-platform.git .

# Or upload files via SCP if private repo
# scp -r ./booking-platform root@xxx.xxx.xxx.xxx:/opt/booking-platform
```

---

## Development Environment

### Local Development with Docker

Create `docker-compose.dev.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: booking-postgres-dev
    environment:
      POSTGRES_DB: booking_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: devpassword123
    ports:
      - "5432:5432"
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
    networks:
      - booking-network

  redis:
    image: redis:7-alpine
    container_name: booking-redis-dev
    command: redis-server --requirepass devredispass
    ports:
      - "6379:6379"
    volumes:
      - redis_dev_data:/data
    networks:
      - booking-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    container_name: booking-backend-dev
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://postgres:devpassword123@postgres:5432/booking_dev
      REDIS_URL: redis://:devredispass@redis:6379
      JWT_SECRET: dev-secret-key-change-in-production
      PORT: 3000
    ports:
      - "3000:3000"
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis
    networks:
      - booking-network
    command: npm run start:dev

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    container_name: booking-frontend-dev
    environment:
      VITE_API_URL: http://localhost:3000
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend
    networks:
      - booking-network
    command: npm run dev -- --host

networks:
  booking-network:
    driver: bridge

volumes:
  postgres_dev_data:
  redis_dev_data:
```

### Development Dockerfiles

**Backend Dockerfile.dev:**
```dockerfile
# backend/Dockerfile.dev
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
```

**Frontend Dockerfile.dev:**
```dockerfile
# frontend/Dockerfile.dev
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
```

### Start Development Environment

```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f backend

# Run migrations
docker-compose -f docker-compose.dev.yml exec backend npm run migration:run

# Stop all services
docker-compose -f docker-compose.dev.yml down

# Stop and remove volumes (clean slate)
docker-compose -f docker-compose.dev.yml down -v
```

---

## Production Deployment

### Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  traefik:
    image: traefik:v2.10
    container_name: traefik
    restart: unless-stopped
    command:
      - "--api.dashboard=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.email=admin@yourbrand.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
      # Redirect HTTP to HTTPS
      - "--entrypoints.web.http.redirections.entrypoint.to=websecure"
      - "--entrypoints.web.http.redirections.entrypoint.scheme=https"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik-certificates:/letsencrypt
    networks:
      - booking-network
    labels:
      # Dashboard
      - "traefik.enable=true"
      - "traefik.http.routers.dashboard.rule=Host(`traefik.yourbrand.com`)"
      - "traefik.http.routers.dashboard.service=api@internal"
      - "traefik.http.routers.dashboard.entrypoints=websecure"
      - "traefik.http.routers.dashboard.tls.certresolver=letsencrypt"
      - "traefik.http.routers.dashboard.middlewares=dashboard-auth"
      - "traefik.http.middlewares.dashboard-auth.basicauth.users=admin:$$apr1$$..."  # htpasswd generated

  postgres:
    image: postgres:15-alpine
    container_name: booking-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_NAME:-booking_platform}
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - booking-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-postgres}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: booking-redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD} --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    networks:
      - booking-network
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${DB_USER:-postgres}:${DB_PASSWORD}@postgres:5432/${DB_NAME:-booking_platform}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      JWT_SECRET: ${JWT_SECRET}
      REFRESH_TOKEN_SECRET: ${REFRESH_TOKEN_SECRET}
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
      STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET}
      SENDGRID_API_KEY: ${SENDGRID_API_KEY}
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
      S3_BUCKET_NAME: ${S3_BUCKET_NAME}
      SENTRY_DSN: ${SENTRY_DSN}
      MAIN_DOMAIN: ${MAIN_DOMAIN:-yourbrand.com}
    deploy:
      replicas: 3  # Run 3 instances for load balancing
      restart_policy:
        condition: on-failure
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - booking-network
    labels:
      - "traefik.enable=true"
      # API subdomain
      - "traefik.http.routers.api.rule=Host(`api.${MAIN_DOMAIN:-yourbrand.com}`)"
      - "traefik.http.routers.api.entrypoints=websecure"
      - "traefik.http.routers.api.tls.certresolver=letsencrypt"
      - "traefik.http.services.api.loadbalancer.server.port=3000"
      # Wildcard for tenant subdomains (backend API)
      - "traefik.http.routers.tenants-api.rule=Host(`{subdomain:[a-z0-9-]+}.${MAIN_DOMAIN:-yourbrand.com}`) && PathPrefix(`/api`)"
      - "traefik.http.routers.tenants-api.entrypoints=websecure"
      - "traefik.http.routers.tenants-api.tls.certresolver=letsencrypt"
      - "traefik.http.routers.tenants-api.tls.domains[0].main=${MAIN_DOMAIN:-yourbrand.com}"
      - "traefik.http.routers.tenants-api.tls.domains[0].sans=*.${MAIN_DOMAIN:-yourbrand.com}"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_URL: https://api.${MAIN_DOMAIN:-yourbrand.com}
        VITE_STRIPE_PUBLIC_KEY: ${STRIPE_PUBLIC_KEY}
        VITE_SENTRY_DSN: ${VITE_SENTRY_DSN}
    restart: unless-stopped
    networks:
      - booking-network
    labels:
      - "traefik.enable=true"
      # Marketing site (main domain)
      - "traefik.http.routers.marketing.rule=Host(`${MAIN_DOMAIN:-yourbrand.com}`) || Host(`www.${MAIN_DOMAIN:-yourbrand.com}`)"
      - "traefik.http.routers.marketing.entrypoints=websecure"
      - "traefik.http.routers.marketing.tls.certresolver=letsencrypt"
      - "traefik.http.services.marketing.loadbalancer.server.port=80"
      # Tenant subdomains (frontend app)
      - "traefik.http.routers.tenants.rule=Host(`{subdomain:[a-z0-9-]+}.${MAIN_DOMAIN:-yourbrand.com}`)"
      - "traefik.http.routers.tenants.entrypoints=websecure"
      - "traefik.http.routers.tenants.tls.certresolver=letsencrypt"
      - "traefik.http.routers.tenants.tls.domains[0].main=${MAIN_DOMAIN:-yourbrand.com}"
      - "traefik.http.routers.tenants.tls.domains[0].sans=*.${MAIN_DOMAIN:-yourbrand.com}"

  worker:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: booking-worker
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${DB_USER:-postgres}:${DB_PASSWORD}@postgres:5432/${DB_NAME:-booking_platform}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      SENDGRID_API_KEY: ${SENDGRID_API_KEY}
      TWILIO_ACCOUNT_SID: ${TWILIO_ACCOUNT_SID}
      TWILIO_AUTH_TOKEN: ${TWILIO_AUTH_TOKEN}
    depends_on:
      - postgres
      - redis
    networks:
      - booking-network
    command: ["node", "dist/worker.js"]  # Separate worker process

networks:
  booking-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
  traefik-certificates:
```

### Production Dockerfiles

**Backend Dockerfile:**
```dockerfile
# backend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source
COPY . .

# Build
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy built app and dependencies
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/main.js"]
```

**Frontend Dockerfile:**
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Build args for environment variables
ARG VITE_API_URL
ARG VITE_STRIPE_PUBLIC_KEY
ARG VITE_SENTRY_DSN

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_STRIPE_PUBLIC_KEY=$VITE_STRIPE_PUBLIC_KEY
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Production image with nginx
FROM nginx:alpine

# Copy built app
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**Frontend nginx.conf:**
```nginx
# frontend/nginx.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }
}
```

### Environment Configuration

Create `.env.production`:

```bash
# Domain
MAIN_DOMAIN=yourbrand.com

# Database
DB_NAME=booking_platform
DB_USER=postgres
DB_PASSWORD=CHANGE_THIS_TO_STRONG_PASSWORD_32_CHARS

# Redis
REDIS_PASSWORD=CHANGE_THIS_TO_STRONG_PASSWORD_32_CHARS

# JWT
JWT_SECRET=CHANGE_THIS_TO_RANDOM_STRING_64_CHARS
REFRESH_TOKEN_SECRET=CHANGE_THIS_TO_DIFFERENT_RANDOM_STRING_64_CHARS

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLIC_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_STARTER_PRICE_ID=price_xxxxx
STRIPE_PROFESSIONAL_PRICE_ID=price_xxxxx
STRIPE_ENTERPRISE_PRICE_ID=price_xxxxx

# SendGrid
SENDGRID_API_KEY=SG.xxxxx

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAxxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
S3_BUCKET_NAME=booking-platform-files

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+1234567890

# Sentry
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
VITE_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

**Generate secure passwords:**
```bash
# Generate database password
openssl rand -base64 32

# Generate Redis password
openssl rand -base64 32

# Generate JWT secrets
openssl rand -base64 64
```

### Deploy to Production

```bash
# On your server
cd /opt/booking-platform

# Create .env.production file
nano .env.production
# Paste your configuration

# Pull latest code (if using git)
git pull origin main

# Build and start all services
docker compose -f docker-compose.prod.yml up -d --build

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Run database migrations
docker compose -f docker-compose.prod.yml exec backend npm run migration:run

# Check service status
docker compose -f docker-compose.prod.yml ps

# Your app is now live at:
# https://yourbrand.com
# https://api.yourbrand.com
# https://*.yourbrand.com
```

### Verify Deployment

```bash
# Check health
curl https://api.yourbrand.com/health

# Check SSL certificate
curl -vI https://yourbrand.com 2>&1 | grep -i "SSL certificate"

# View backend logs
docker compose -f docker-compose.prod.yml logs backend

# View all containers
docker ps
```

---

## Scaling

### Horizontal Scaling (More Containers)

```yaml
# In docker-compose.prod.yml, adjust replicas:
backend:
  deploy:
    replicas: 5  # Increase from 3 to 5
```

```bash
# Apply changes
docker compose -f docker-compose.prod.yml up -d --scale backend=5
```

Traefik automatically load balances across all backend instances!

### Vertical Scaling (Bigger Server)

```bash
# Upgrade your server
# DigitalOcean: Resize droplet (takes ~1 minute)
# From: 2GB RAM → 4GB RAM
# From: $12/mo → $24/mo

# No code changes needed!
```

### Multi-Server Setup (Advanced)

Use **Docker Swarm** for multiple servers:

```bash
# Initialize swarm on main server
docker swarm init --advertise-addr xxx.xxx.xxx.xxx

# On additional servers, join the swarm
docker swarm join --token SWMTKN-xxxxx xxx.xxx.xxx.xxx:2377

# Deploy stack
docker stack deploy -c docker-compose.prod.yml booking

# Scale across servers
docker service scale booking_backend=10
```

---

## Maintenance

### Backup Database

```bash
# Create backup script
cat > /opt/booking-platform/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/booking-platform/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

docker compose -f /opt/booking-platform/docker-compose.prod.yml exec -T postgres \
  pg_dump -U postgres booking_platform | gzip > "$BACKUP_DIR/backup_$TIMESTAMP.sql.gz"

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: backup_$TIMESTAMP.sql.gz"
EOF

chmod +x /opt/booking-platform/backup.sh

# Schedule daily backups
crontab -e
# Add line:
0 2 * * * /opt/booking-platform/backup.sh >> /var/log/backup.log 2>&1
```

### Restore Database

```bash
# Restore from backup
gunzip -c backups/backup_20251112_020000.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U postgres booking_platform
```

### Update Application

```bash
# Pull latest code
cd /opt/booking-platform
git pull origin main

# Rebuild and restart (zero-downtime with replicas)
docker compose -f docker-compose.prod.yml up -d --build --no-deps backend
docker compose -f docker-compose.prod.yml up -d --build --no-deps frontend

# Run new migrations
docker compose -f docker-compose.prod.yml exec backend npm run migration:run
```

### Monitor Resources

```bash
# View resource usage
docker stats

# View logs
docker compose -f docker-compose.prod.yml logs -f --tail=100

# Check disk space
df -h

# Clean up old images
docker system prune -a --volumes -f
```

### SSL Certificate Renewal

Traefik handles this automatically! Certificates renew automatically via Let's Encrypt.

To verify:
```bash
# Check certificate expiry
echo | openssl s_client -servername yourbrand.com -connect yourbrand.com:443 2>/dev/null | openssl x509 -noout -dates
```

---

## Cost Comparison

### Docker Approach (Single Server)

| Component | Service | Cost |
|-----------|---------|------|
| **Server** | Hetzner/DigitalOcean | $12-24/mo |
| **Domain** | Namecheap | $10/year |
| **Email** | SendGrid (100 emails/day free) | $0-15/mo |
| **Storage** | S3 (if needed) | $5-10/mo |
| **Monitoring** | Sentry free tier | $0 |
| **SSL** | Let's Encrypt (free) | $0 |
| **CDN** | CloudFlare (optional) | $0 |
| **Total** | | **$12-40/mo** |

### Traditional Multi-Service Approach

| Component | Service | Cost |
|-----------|---------|------|
| Frontend | Vercel Pro | $20/mo |
| Backend | Railway | $20-50/mo |
| Database | Supabase Pro | $25/mo |
| Redis | Upstash | $10/mo |
| Email | SendGrid | $15/mo |
| Monitoring | Sentry | $26/mo |
| **Total** | | **$116-146/mo** |

**Docker saves you $100-130/mo!** 💰

### At Scale (1000+ tenants)

**Docker Multi-Server:**
- 3x Servers (4GB RAM): $72/mo
- Load balancer: $10/mo
- Total: **~$80-100/mo**

**Traditional:**
- Multiple paid tiers: **$500-1000/mo**

---

## Advanced Features

### Auto-Scaling with Docker Swarm

```yaml
# docker-compose.swarm.yml
version: '3.8'

services:
  backend:
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
        max_attempts: 3
      resources:
        limits:
          cpus: '0.50'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

### Monitoring Stack

Add Prometheus + Grafana:

```yaml
# Add to docker-compose.prod.yml

  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    networks:
      - booking-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.prometheus.rule=Host(`metrics.yourbrand.com`)"

  grafana:
    image: grafana/grafana
    volumes:
      - grafana_data:/var/lib/grafana
    networks:
      - booking-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.grafana.rule=Host(`grafana.yourbrand.com`)"
```

### Automated Deployment with GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.SERVER_IP }}
          username: root
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/booking-platform
            git pull origin main
            docker compose -f docker-compose.prod.yml up -d --build
            docker compose -f docker-compose.prod.yml exec -T backend npm run migration:run
```

---

## Troubleshooting

### Issue: Containers won't start

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs

# Check specific service
docker compose -f docker-compose.prod.yml logs backend

# Restart service
docker compose -f docker-compose.prod.yml restart backend
```

### Issue: Can't connect to database

```bash
# Check if postgres is running
docker compose -f docker-compose.prod.yml ps postgres

# Check database logs
docker compose -f docker-compose.prod.yml logs postgres

# Connect to database
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d booking_platform
```

### Issue: SSL not working

```bash
# Check Traefik logs
docker compose -f docker-compose.prod.yml logs traefik

# Verify DNS is correct
dig yourbrand.com
dig *.yourbrand.com

# Check certificate status
docker compose -f docker-compose.prod.yml exec traefik cat /letsencrypt/acme.json
```

### Issue: Out of disk space

```bash
# Clean up Docker
docker system prune -a --volumes -f

# Check disk usage
df -h
du -sh /var/lib/docker/*

# Remove old logs
docker compose -f docker-compose.prod.yml logs --tail=0 -f > /dev/null
```

---

## Security Best Practices

### 1. Firewall Configuration

```bash
# Install UFW
apt install ufw

# Allow SSH, HTTP, HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

### 2. Secure Environment Variables

```bash
# Never commit .env.production
echo ".env.production" >> .gitignore

# Use Docker secrets (Swarm mode)
echo "my-secret-value" | docker secret create db_password -
```

### 3. Regular Updates

```bash
# Create update script
cat > /opt/booking-platform/update.sh << 'EOF'
#!/bin/bash
apt update && apt upgrade -y
docker compose -f /opt/booking-platform/docker-compose.prod.yml pull
docker compose -f /opt/booking-platform/docker-compose.prod.yml up -d
docker system prune -f
EOF

chmod +x /opt/booking-platform/update.sh

# Schedule weekly updates
crontab -e
# Add:
0 3 * * 0 /opt/booking-platform/update.sh >> /var/log/update.log 2>&1
```

### 4. Limit Access

```bash
# Disable root SSH login
nano /etc/ssh/sshd_config
# Change: PermitRootLogin no

# Create admin user
adduser admin
usermod -aG docker admin
usermod -aG sudo admin

# Use SSH keys only
# Copy your public key to: ~/.ssh/authorized_keys
```

---

## Quick Reference Commands

```bash
# Start services
docker compose -f docker-compose.prod.yml up -d

# Stop services
docker compose -f docker-compose.prod.yml down

# View logs
docker compose -f docker-compose.prod.yml logs -f [service]

# Restart service
docker compose -f docker-compose.prod.yml restart [service]

# Scale service
docker compose -f docker-compose.prod.yml up -d --scale backend=5

# Execute command in container
docker compose -f docker-compose.prod.yml exec backend [command]

# View resource usage
docker stats

# Clean up
docker system prune -a --volumes -f

# Backup database
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres booking_platform > backup.sql

# Restore database
docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres booking_platform < backup.sql

# Update application
git pull && docker compose -f docker-compose.prod.yml up -d --build
```

---

## Summary: Why Docker is Better

| Feature | Docker Approach | Traditional Approach |
|---------|----------------|---------------------|
| **Cost** | $12-40/mo | $100-500/mo |
| **Setup Time** | 30 minutes | 4-6 hours |
| **Complexity** | Low (one config file) | High (multiple services) |
| **Deployment** | `docker compose up` | Multiple CLIs & dashboards |
| **SSL** | Automatic (Traefik) | Manual setup |
| **Scaling** | One command | Upgrade multiple services |
| **Portability** | Works anywhere | Vendor lock-in |
| **Local Dev** | Identical to production | Different environments |
| **Backups** | Simple scripts | Multiple backup strategies |
| **Monitoring** | Built-in (Docker stats) | Need separate tools |

**Bottom line:** Docker is simpler, cheaper, and more flexible! 🚀

---

## Next Steps

1. **Get a server** ($12/mo DigitalOcean droplet)
2. **Configure DNS** (point to server IP)
3. **Clone this repo** and configure `.env.production`
4. **Run** `docker compose -f docker-compose.prod.yml up -d`
5. **Done!** Your SaaS is live

Need help with any step? Just ask!
