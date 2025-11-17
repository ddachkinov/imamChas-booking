# Docker Quick Start Guide

Get your SaaS booking platform running in **30 minutes** with Docker!

## What You Need

1. **A Server** ($12/mo)
   - [DigitalOcean](https://digitalocean.com) - $12/mo droplet
   - [Hetzner](https://hetzner.com) - €4.51/mo VPS
   - [Vultr](https://vultr.com) - $12/mo instance
   - Specs: 2GB RAM, 20GB disk, Ubuntu 22.04

2. **A Domain Name** ($10/year)
   - Buy from: Namecheap, GoDaddy, Google Domains, etc.

3. **Email Service** (Free tier available)
   - [SendGrid](https://sendgrid.com) - 100 emails/day free

4. **Payment Processing**
   - [Stripe](https://stripe.com) account

## Step 1: Setup Your Server (5 minutes)

### Create a Server

**DigitalOcean Example:**
1. Sign up at digitalocean.com
2. Create → Droplets
3. Choose:
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: Basic ($12/mo - 2GB RAM)
   - **Datacenter**: Choose closest to your users
4. Add your SSH key
5. Create Droplet
6. **Note the IP address** (e.g., 142.93.123.45)

### SSH into Your Server

```bash
ssh root@YOUR_SERVER_IP
```

### Run the Setup Script

```bash
# Install git
apt update && apt install -y git

# Clone repository
cd /tmp
git clone https://github.com/ddachkinov/imamChas-booking.git
cd imamChas-booking

# For PRIVATE repositories:
# Get token from: https://github.com/settings/tokens
# git clone https://YOUR_TOKEN@github.com/ddachkinov/imamChas-booking.git

# Run server setup
bash scripts/server-setup.sh

# This will:
# - Install Docker & Docker Compose
# - Configure firewall
# - Setup automatic security updates
# - Create application directory at /opt/booking-platform
# - Optimize system for Docker
```

## Step 2: Configure DNS (5 minutes)

Point your domain to your server IP:

### In Your DNS Provider (Namecheap, GoDaddy, CloudFlare, etc.)

Add these DNS records:

```
Type: A
Name: @
Value: YOUR_SERVER_IP
TTL: Automatic

Type: A
Name: *
Value: YOUR_SERVER_IP
TTL: Automatic

Type: A
Name: api
Value: YOUR_SERVER_IP
TTL: Automatic
```

### Verify DNS (wait 5-10 minutes for propagation)

```bash
# Check if DNS is working
dig yourdomain.com
dig api.yourdomain.com
dig test.yourdomain.com

# All should return YOUR_SERVER_IP
```

## Step 3: Deploy the Application (10 minutes)

### Clone Repository

```bash
cd /opt/booking-platform
git clone https://github.com/yourusername/booking-platform.git .

# Or upload your code via SCP if private repo
```

### Configure Environment

```bash
# Copy example environment file
cp .env.production.example .env.production

# Edit with your values
nano .env.production
```

**Minimum required configuration:**

```bash
# Domain
MAIN_DOMAIN=yourdomain.com
ACME_EMAIL=admin@yourdomain.com

# Generate strong passwords
DB_PASSWORD=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)
REFRESH_TOKEN_SECRET=$(openssl rand -base64 64)

# Add your Stripe keys
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLIC_KEY=pk_live_xxxxx

# Add SendGrid API key
SENDGRID_API_KEY=SG.xxxxx
EMAIL_FROM=noreply@yourdomain.com
```

**Generate Traefik Dashboard Password:**

```bash
# Install apache2-utils
apt install apache2-utils

# Generate password hash
htpasswd -nb admin your-password-here

# Copy output to .env.production
# TRAEFIK_DASHBOARD_AUTH=admin:$apr1$...
```

### Make Scripts Executable

```bash
chmod +x deploy.sh
chmod +x scripts/*.sh
```

### Deploy!

```bash
./deploy.sh
```

This single command will:
1. ✅ Check prerequisites
2. ✅ Build Docker images
3. ✅ Start all services (Traefik, PostgreSQL, Redis, Backend, Frontend)
4. ✅ Get SSL certificates automatically (Let's Encrypt)
5. ✅ Run database migrations
6. ✅ Configure subdomain routing

**That's it!** Your app is now live! 🎉

### Verify Deployment

```bash
# Check backend health
curl https://api.yourdomain.com/health

# Check frontend
curl https://yourdomain.com

# View service status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

## Step 4: Setup Stripe Products (5 minutes)

### Install Stripe CLI

```bash
# On your local machine
brew install stripe/stripe-cli/stripe

# Or download from: https://stripe.com/docs/stripe-cli
```

### Create Products & Prices

```bash
# Login to Stripe
stripe login

# Create Starter Plan
stripe products create \
  --name="Starter Plan" \
  --description="Perfect for small businesses"

# Note the product ID: prod_XXXXX

# Create monthly price for Starter
stripe prices create \
  --product=prod_XXXXX \
  --unit-amount=2900 \
  --currency=usd \
  --recurring[interval]=month

# Note the price ID: price_XXXXX

# Repeat for Professional ($79) and Enterprise ($199)
```

### Add Price IDs to Environment

```bash
# On your server
nano .env.production

# Add:
STRIPE_STARTER_PRICE_ID=price_xxxxx
STRIPE_PROFESSIONAL_PRICE_ID=price_xxxxx
STRIPE_ENTERPRISE_PRICE_ID=price_xxxxx

# Restart backend
docker compose -f docker-compose.prod.yml restart backend
```

### Setup Stripe Webhook

```bash
# In Stripe Dashboard:
# 1. Go to: https://dashboard.stripe.com/webhooks
# 2. Add endpoint
# 3. URL: https://api.yourdomain.com/billing/webhook
# 4. Events to send:
#    - customer.subscription.created
#    - customer.subscription.updated
#    - customer.subscription.deleted
#    - invoice.payment_succeeded
#    - invoice.payment_failed
# 5. Copy webhook signing secret

# Add to .env.production
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Restart backend
docker compose -f docker-compose.prod.yml restart backend
```

## Step 5: Test Your SaaS (5 minutes)

### 1. Test Marketing Site

Visit: `https://yourdomain.com`

Should see your landing page with SSL ✅

### 2. Test Signup Flow

1. Go to signup page
2. Enter:
   - Business Name: "Test Salon"
   - Email: test@example.com
   - Password: testpass123
3. Click "Start Free Trial"
4. Should redirect to: `https://test-salon.yourdomain.com` ✅

### 3. Test Backend API

```bash
curl https://api.yourdomain.com/health
# Should return: {"status":"ok","timestamp":"..."}
```

### 4. Test Subdomain Routing

Visit different subdomains - each should load the app:
- `https://test-salon.yourdomain.com`
- `https://another-business.yourdomain.com`

### 5. Test Billing

1. Login to test tenant
2. Go to Billing page
3. Click "Upgrade to Professional"
4. Should open Stripe Checkout ✅
5. Use test card: `4242 4242 4242 4242`
6. Complete payment
7. Should redirect back with success ✅

## Common Commands

### View Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f traefik
```

### Restart Services

```bash
# All services
docker compose -f docker-compose.prod.yml restart

# Specific service
docker compose -f docker-compose.prod.yml restart backend
```

### Scale Backend

```bash
# Run 5 backend instances instead of 3
docker compose -f docker-compose.prod.yml up -d --scale backend=5
```

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
./deploy.sh
```

### Database Backup

```bash
# Create backup
./scripts/backup.sh

# Backups are saved to: ./backups/backup_TIMESTAMP.sql.gz
```

### Database Restore

```bash
# List available backups
ls -lh ./backups/

# Restore from backup
./scripts/restore.sh ./backups/backup_20251112_120000.sql.gz
```

### View Resource Usage

```bash
# All containers
docker stats

# Disk space
df -h

# Memory
free -h
```

### Clean Up

```bash
# Remove old Docker images
docker system prune -a --volumes -f

# Removes unused: images, containers, volumes, networks
```

## Monitoring

### Traefik Dashboard

Visit: `https://traefik.yourdomain.com`

- Login with credentials from `TRAEFIK_DASHBOARD_AUTH`
- See all routes, services, SSL certificates

### Netdata Monitoring

Visit: `http://YOUR_SERVER_IP:19999`

- Real-time system metrics
- CPU, memory, disk, network usage
- Container statistics

### Application Logs

```bash
# Live logs
docker compose -f docker-compose.prod.yml logs -f backend

# Last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100 backend
```

## Troubleshooting

### Issue: Can't access the site

**Check DNS:**
```bash
dig yourdomain.com
# Should return your server IP
```

**Check services:**
```bash
docker compose -f docker-compose.prod.yml ps
# All should be "Up"
```

**Check Traefik logs:**
```bash
docker compose -f docker-compose.prod.yml logs traefik
```

### Issue: SSL certificate not working

**Wait a few minutes** - Let's Encrypt can take 1-5 minutes.

**Check Traefik logs:**
```bash
docker compose -f docker-compose.prod.yml logs traefik | grep -i certificate
```

**Verify DNS is correct:**
```bash
dig yourdomain.com
dig *.yourdomain.com
```

### Issue: Database connection errors

**Check if PostgreSQL is running:**
```bash
docker compose -f docker-compose.prod.yml ps postgres
```

**Check database logs:**
```bash
docker compose -f docker-compose.prod.yml logs postgres
```

**Restart database:**
```bash
docker compose -f docker-compose.prod.yml restart postgres
```

### Issue: Out of disk space

**Clean Docker:**
```bash
docker system prune -a --volumes -f
```

**Check disk usage:**
```bash
df -h
du -sh /var/lib/docker/*
```

**Clean old backups:**
```bash
find ./backups -name "*.sql.gz" -mtime +30 -delete
```

## Maintenance

### Daily

- Check error rates in Sentry (if configured)
- Monitor server resources

### Weekly

- Review application logs
- Check disk space
- Update dependencies (minor versions)

### Monthly

- Run `npm audit` and fix vulnerabilities
- Review slow database queries
- Test backup restoration
- Update system packages

### Automated

Setup automatic backups:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /opt/booking-platform && ./scripts/backup.sh >> /var/log/backup.log 2>&1

# Add weekly updates on Sunday at 3 AM
0 3 * * 0 cd /opt/booking-platform && git pull && ./deploy.sh >> /var/log/deploy.log 2>&1
```

## Security Best Practices

1. **Change default SSH port:**
   ```bash
   nano /etc/ssh/sshd_config
   # Change: Port 22 → Port 2222
   systemctl restart sshd

   # Don't forget to allow new port in firewall
   ufw allow 2222/tcp
   ```

2. **Disable password authentication:**
   ```bash
   nano /etc/ssh/sshd_config
   # Change: PasswordAuthentication yes → no
   systemctl restart sshd
   ```

3. **Enable automatic security updates:**
   Already configured by server-setup.sh ✅

4. **Regular backups:**
   Setup automated daily backups ✅

5. **Monitor logs:**
   Check Traefik and application logs regularly

## Cost Breakdown

### Initial Setup (One-time)

- Domain name: $10/year
- Time investment: 1 hour

### Monthly Costs (Starting)

| Item | Cost |
|------|------|
| Server (2GB RAM) | $12 |
| Domain (prorated) | $1 |
| SendGrid (free tier) | $0 |
| **Total** | **$13/mo** |

### Monthly Costs (Growing - 100 customers)

| Item | Cost |
|------|------|
| Server (4GB RAM) | $24 |
| SendGrid (Essentials) | $15 |
| S3 Storage | $5 |
| **Total** | **$44/mo** |

### Revenue Example

- 50 customers × $29/mo = **$1,450/mo**
- Costs: $44/mo
- **Net profit: $1,406/mo** 💰

## Need Help?

- Check logs: `docker compose -f docker-compose.prod.yml logs`
- Review troubleshooting section
- Check Docker documentation
- Verify environment variables in `.env.production`

## Next Steps

1. ✅ Application is deployed and running
2. ✅ SSL certificates are working
3. ✅ Subdomains are routing correctly
4. ✅ Billing is integrated

**Now focus on:**
- Adding content to your marketing site
- Creating documentation for users
- Building out features
- Getting your first customers!

---

**Congratulations!** 🎉 Your SaaS platform is live!

Visit: `https://yourdomain.com`
