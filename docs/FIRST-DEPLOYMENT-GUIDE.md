# Your First Deployment - Complete Walkthrough

This guide will walk you through deploying your SaaS booking platform from scratch. Follow along step-by-step!

## Overview

**What we'll do:**
1. ✅ Get a server ($12/mo)
2. ✅ Setup the server (10 min)
3. ✅ Configure DNS (5 min)
4. ✅ Configure environment variables (15 min)
5. ✅ Deploy the application (5 min)
6. ✅ Test everything (5 min)

**Total time: ~40 minutes**
**Total cost: ~$12/mo**

---

## Phase 1: Get a Server

### Option A: DigitalOcean (Recommended for beginners)

1. **Sign up at DigitalOcean**
   - Go to: https://www.digitalocean.com/
   - Click "Sign Up"
   - You'll get $200 credit for 60 days (perfect for testing!)

2. **Create a Droplet**
   - Click "Create" → "Droplets"
   - **Choose Image**: Ubuntu 22.04 LTS
   - **Choose Plan**:
     - Basic
     - Regular (not Premium)
     - $12/mo - 2 GB RAM / 1 CPU
   - **Choose Region**: Pick one closest to your users
     - If US-based: New York or San Francisco
     - If Europe: Frankfurt or Amsterdam
   - **Authentication**:
     - Select "SSH Key" (more secure)
     - Or "Password" (easier but less secure)
   - **Hostname**: `booking-platform-prod`
   - Click "Create Droplet"

3. **Note Your Server IP**
   ```
   Wait 60 seconds for creation...
   You'll see: 142.93.123.45 (example)
   WRITE THIS DOWN! ✍️
   ```

### Option B: Hetzner (Cheapest option)

1. Go to: https://www.hetzner.com/cloud
2. Sign up
3. Create a server:
   - Location: Germany (or nearest)
   - Image: Ubuntu 22.04
   - Type: CX21 (€4.51/mo - 2 vCPU, 4GB RAM)
4. Note the IP address

### Option C: Already Have a Server?

If you already have a VPS or server:
- **Requirements**: Ubuntu 20.04 or 22.04, 2GB+ RAM, 20GB+ disk
- **Works on**: Any cloud provider (AWS, GCP, Azure, Linode, Vultr, etc.)

---

## Phase 2: Server Setup

### Step 1: Connect to Your Server

**On Mac/Linux:**
```bash
# Replace with YOUR server IP
ssh root@142.93.123.45
```

**On Windows:**
- Download PuTTY: https://www.putty.org/
- Enter your server IP
- Click "Open"
- Login as "root" with your password

**First time connecting:**
```
The authenticity of host '142.93.123.45' can't be established.
Are you sure you want to continue connecting (yes/no)?
```
Type: `yes` and press Enter

### Step 2: Run Server Setup Script

Once connected to your server, run:

```bash
# Install git first
apt update && apt install -y git

# Clone repository to access the script
cd /tmp
git clone https://github.com/ddachkinov/imamChas-booking.git
cd imamChas-booking

# For PRIVATE repositories, use a token:
# Get token from: https://github.com/settings/tokens (select 'repo' scope)
# git clone https://YOUR_GITHUB_TOKEN@github.com/ddachkinov/imamChas-booking.git

# Run the setup script
bash scripts/server-setup.sh
```

**What this does:**
- ✅ Updates all system packages
- ✅ Installs Docker & Docker Compose
- ✅ Sets up firewall (allows ports 22, 80, 443)
- ✅ Creates application directory: `/opt/booking-platform`
- ✅ Enables automatic security updates
- ✅ Installs monitoring tools
- ✅ Optimizes system for containers

**This takes 5-10 minutes.** You'll see lots of output - that's normal!

When it's done, you'll see:
```
========================================
  Server Setup Complete!
========================================
```

### Step 3: Verify Installation

```bash
# Check Docker
docker --version
# Should show: Docker version 24.x.x

# Check Docker Compose
docker compose version
# Should show: Docker Compose version v2.x.x

# Check firewall
ufw status
# Should show: Status: active
```

If all three commands work, you're ready! ✅

---

## Phase 3: DNS Configuration

You need a domain name. If you don't have one:

### Get a Domain (if needed)

**Recommended registrars:**
- Namecheap: https://www.namecheap.com (~$10/year)
- Google Domains: https://domains.google.com (~$12/year)
- Cloudflare: https://www.cloudflare.com/products/registrar/ (~$8/year)

For this guide, I'll use **Namecheap** as an example, but the process is similar everywhere.

### Configure DNS Records

Let's say:
- Your domain is: **mybookingapp.com**
- Your server IP is: **142.93.123.45**

#### In Namecheap Dashboard:

1. Go to "Domain List"
2. Click "Manage" next to your domain
3. Go to "Advanced DNS"
4. Delete any existing A Records
5. Add these records:

```
Type: A Record
Host: @
Value: 142.93.123.45
TTL: Automatic
```

```
Type: A Record
Host: *
Value: 142.93.123.45
TTL: Automatic
```

```
Type: A Record
Host: api
Value: 142.93.123.45
TTL: Automatic
```

**What each does:**
- `@` → Main domain (mybookingapp.com)
- `*` → Wildcard (any-tenant.mybookingapp.com)
- `api` → API subdomain (api.mybookingapp.com)

#### In Cloudflare (if using):

1. Add your domain
2. Add DNS records:
   - Type: A, Name: @, Content: 142.93.123.45, Proxy: Off (gray cloud)
   - Type: A, Name: *, Content: 142.93.123.45, Proxy: Off (gray cloud)
   - Type: A, Name: api, Content: 142.93.123.45, Proxy: Off (gray cloud)

**Note:** Keep proxy OFF initially. Enable after SSL is working.

### Verify DNS Propagation

DNS can take 5-60 minutes to propagate. Check if it's ready:

```bash
# On your local machine (not the server)
dig mybookingapp.com
dig api.mybookingapp.com
dig test.mybookingapp.com

# All should return: 142.93.123.45
```

**Or use online tools:**
- https://www.whatsmydns.net/
- Enter your domain, select "A", click "Search"
- Should show your IP globally

**Wait until DNS is propagating before continuing!** ⏳

---

## Phase 4: Clone & Configure

### Step 1: Clone Repository

```bash
# Still on your server via SSH
cd /opt/booking-platform

# Clone the repository
git clone https://github.com/ddachkinov/imamChas-booking.git .

# If private repository, you'll need to authenticate:
# 1. Generate GitHub Personal Access Token
# 2. Use: git clone https://TOKEN@github.com/ddachkinov/imamChas-booking.git .
```

### Step 2: Create Environment File

```bash
# Copy the example file
cp .env.production.example .env.production

# Open it for editing
nano .env.production
```

**You're now editing the environment file!**

---

## Phase 5: Configure Environment Variables

I'll walk you through each variable. Fill them in as we go.

### 🌍 Domain Configuration

```bash
# Replace with YOUR domain
MAIN_DOMAIN=mybookingapp.com
ACME_EMAIL=admin@mybookingapp.com
```

**What it does:**
- `MAIN_DOMAIN`: Your domain for the app
- `ACME_EMAIL`: Email for Let's Encrypt SSL certificates (you'll get renewal notices here)

---

### 🔐 Security Secrets

**Generate strong passwords ON YOUR SERVER:**

```bash
# Open a new terminal tab (keep nano open in the other)
# SSH into your server again
ssh root@142.93.123.45

# Generate database password
openssl rand -base64 32
# Copy the output

# Generate Redis password
openssl rand -base64 32
# Copy the output

# Generate JWT secret
openssl rand -base64 64
# Copy the output

# Generate refresh token secret
openssl rand -base64 64
# Copy the output
```

**Paste into .env.production:**

```bash
# Database
DB_NAME=booking_platform
DB_USER=postgres
DB_PASSWORD=paste_first_generated_password_here

# Redis
REDIS_PASSWORD=paste_second_generated_password_here

# JWT Authentication
JWT_SECRET=paste_third_generated_secret_here
REFRESH_TOKEN_SECRET=paste_fourth_generated_secret_here
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
```

**Example (yours will be different):**
```bash
DB_PASSWORD=K7mP2vF9wQ3xR5tY8nL1cB4aD6eH0jG2
REDIS_PASSWORD=X9mN2vC5wP3xR8tY1nL4cB7aD0eH6jG9
JWT_SECRET=A3mP9vF2wQ8xR5tY1nL7cB4aD0eH6jG3kN5pS8rT2uV9wY1xZ4bC7dE0fG3hJ6
REFRESH_TOKEN_SECRET=B8mN4vC7wP1xR9tY2nL5cB3aD6eH0jG4kN8pS2rT5uV1wY3xZ7bC0dE4fG9hJ2
```

---

### 💳 Stripe (Payment Processing)

**Setup Stripe:**

1. **Create Stripe account**: https://dashboard.stripe.com/register
2. **Activate your account** (they'll ask for business details)
3. **Get API Keys**:
   - Go to: https://dashboard.stripe.com/test/apikeys
   - **For testing**: Use test keys (start with `sk_test_` and `pk_test_`)
   - **For production**: Click "View test data" toggle to OFF, then copy live keys

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_51Abc...xyz  # Copy from Stripe dashboard
STRIPE_PUBLIC_KEY=pk_test_51Abc...xyz  # Copy from Stripe dashboard
STRIPE_WEBHOOK_SECRET=whsec_xxx        # We'll set this up later
```

**Create Products & Prices:**

```bash
# On your LOCAL machine (not the server)
# Install Stripe CLI
brew install stripe/stripe-cli/stripe  # Mac
# Or download from: https://stripe.com/docs/stripe-cli

# Login
stripe login

# Create Starter Plan Product
stripe products create \
  --name="Starter Plan" \
  --description="Perfect for small businesses - 100 appointments/month, 2 staff members"

# Copy the product ID (prod_xxxxx)

# Create price for Starter ($29/month)
stripe prices create \
  --product=prod_xxxxx \
  --unit-amount=2900 \
  --currency=usd \
  --recurring[interval]=month

# Copy price ID (price_xxxxx) and add to .env.production:
STRIPE_STARTER_PRICE_ID=price_xxxxx
```

**Repeat for other plans:**

```bash
# Professional Plan ($79/month)
stripe products create --name="Professional Plan" --description="500 appointments/month, 10 staff, SMS notifications"
stripe prices create --product=prod_yyyyy --unit-amount=7900 --currency=usd --recurring[interval]=month

# Enterprise Plan ($199/month)
stripe products create --name="Enterprise Plan" --description="Unlimited everything"
stripe prices create --product=prod_zzzzz --unit-amount=19900 --currency=usd --recurring[interval]=month
```

Add to `.env.production`:
```bash
STRIPE_STARTER_PRICE_ID=price_xxxxx
STRIPE_PROFESSIONAL_PRICE_ID=price_yyyyy
STRIPE_ENTERPRISE_PRICE_ID=price_zzzzz
```

**We'll setup webhook later after deployment.**

---

### 📧 Email (SendGrid)

**Setup SendGrid:**

1. **Create account**: https://signup.sendgrid.com/
2. **Verify email address**
3. **Create Sender Identity**:
   - Settings → Sender Authentication
   - Click "Get Started" under "Verify a Single Sender"
   - Fill in your details
   - Use: noreply@mybookingapp.com
   - Verify the email they send you
4. **Create API Key**:
   - Settings → API Keys
   - Click "Create API Key"
   - Name: "Booking Platform Production"
   - Permissions: "Full Access"
   - Click "Create & View"
   - **Copy the key NOW** (you can't see it again!)

```bash
# Email Configuration
SENDGRID_API_KEY=SG.abc123xyz...  # Paste your API key
EMAIL_FROM=noreply@mybookingapp.com
EMAIL_FROM_NAME=MyBooking Platform
```

---

### 💬 SMS (Twilio) - OPTIONAL

**If you want SMS notifications:**

1. **Create account**: https://www.twilio.com/try-twilio
2. **Get a phone number**: Console → Phone Numbers → Buy a Number
3. **Get credentials**: Console → Account Info
   - Copy Account SID
   - Copy Auth Token

```bash
# SMS Configuration (optional - leave blank if not using)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

**Skip this for now if you want to test without SMS.**

---

### 📁 File Storage (AWS S3) - OPTIONAL

**If you want file uploads (profile pictures, documents):**

1. **Create AWS account**: https://aws.amazon.com/
2. **Create S3 Bucket**:
   - Go to S3 console
   - Click "Create bucket"
   - Name: `mybookingapp-files` (must be globally unique)
   - Region: us-east-1
   - Uncheck "Block all public access" (we need public read)
   - Create bucket
3. **Create IAM User**:
   - Go to IAM → Users → Add user
   - Name: `booking-platform-s3`
   - Access type: Programmatic access
   - Attach policy: AmazonS3FullAccess
   - Copy Access Key ID and Secret Access Key

```bash
# Storage Configuration (optional - leave blank if not using)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXX
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=mybookingapp-files
S3_PUBLIC_URL=https://mybookingapp-files.s3.amazonaws.com
```

**Or skip this and use local file storage for now.**

---

### 📊 Monitoring (Sentry) - OPTIONAL

**For error tracking:**

1. **Create account**: https://sentry.io/signup/
2. **Create project**:
   - Choose "Node.js" for backend
   - Choose "React" for frontend
3. **Copy DSN** from project settings

```bash
# Monitoring (optional - leave blank to disable)
SENTRY_DSN=https://xxxxx@o123456.ingest.sentry.io/7891234
VITE_SENTRY_DSN=https://xxxxx@o123456.ingest.sentry.io/7891234
LOG_LEVEL=info
```

**Skip this for first deployment if you want.**

---

### 🔑 Traefik Dashboard Password

**Generate password for Traefik dashboard:**

```bash
# On your server
apt install apache2-utils -y

# Generate password (replace 'your-secure-password' with your actual password)
htpasswd -nb admin your-secure-password

# Copy the output, it looks like:
# admin:$apr1$h8GzEJCM$U7V7KoKBmCnPrXKu7rVqc1
```

Add to `.env.production`:
```bash
TRAEFIK_DASHBOARD_AUTH=admin:$apr1$h8GzEJCM$U7V7KoKBmCnPrXKu7rVqc1
```

**Important:** Keep the dollar signs as `$$` in the file (double them)!

---

### ✅ Final .env.production Example

Here's what your complete file might look like:

```bash
# =============================================================================
# DOMAIN
# =============================================================================
MAIN_DOMAIN=mybookingapp.com
ACME_EMAIL=admin@mybookingapp.com

# =============================================================================
# DATABASE
# =============================================================================
DB_NAME=booking_platform
DB_USER=postgres
DB_PASSWORD=K7mP2vF9wQ3xR5tY8nL1cB4aD6eH0jG2

# =============================================================================
# REDIS
# =============================================================================
REDIS_PASSWORD=X9mN2vC5wP3xR8tY1nL4cB7aD0eH6jG9

# =============================================================================
# JWT AUTHENTICATION
# =============================================================================
JWT_SECRET=A3mP9vF2wQ8xR5tY1nL7cB4aD0eH6jG3kN5pS8rT2uV9wY1xZ4bC7dE0fG3hJ6
REFRESH_TOKEN_SECRET=B8mN4vC7wP1xR9tY2nL5cB3aD6eH0jG4kN8pS2rT5uV1wY3xZ7bC0dE4fG9hJ2
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# =============================================================================
# STRIPE
# =============================================================================
STRIPE_SECRET_KEY=sk_test_51Abc...xyz
STRIPE_PUBLIC_KEY=pk_test_51Abc...xyz
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_STARTER_PRICE_ID=price_1abc123
STRIPE_PROFESSIONAL_PRICE_ID=price_2def456
STRIPE_ENTERPRISE_PRICE_ID=price_3ghi789

# =============================================================================
# EMAIL
# =============================================================================
SENDGRID_API_KEY=SG.abc123xyz...
EMAIL_FROM=noreply@mybookingapp.com
EMAIL_FROM_NAME=MyBooking Platform

# =============================================================================
# SMS (Optional)
# =============================================================================
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# =============================================================================
# STORAGE (Optional)
# =============================================================================
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET_NAME=
S3_PUBLIC_URL=

# =============================================================================
# MONITORING (Optional)
# =============================================================================
SENTRY_DSN=
VITE_SENTRY_DSN=
LOG_LEVEL=info

# =============================================================================
# FEATURE FLAGS
# =============================================================================
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_TRACKING=true

# =============================================================================
# TRAEFIK DASHBOARD
# =============================================================================
TRAEFIK_DASHBOARD_AUTH=admin:$$apr1$$h8GzEJCM$$U7V7KoKBmCnPrXKu7rVqc1

# =============================================================================
# RATE LIMITING
# =============================================================================
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

### Save the File

In nano:
- Press `Ctrl + X`
- Press `Y` (yes, save)
- Press `Enter` (confirm filename)

**Your environment is now configured!** ✅

---

## Phase 6: Deploy!

### Make Scripts Executable

```bash
chmod +x deploy.sh
chmod +x scripts/*.sh
```

### Run the Deployment

```bash
./deploy.sh
```

**What you'll see:**

```
=========================================
  Booking Platform Deployment
=========================================

ℹ Checking prerequisites...
✓ All prerequisites met
Do you want to continue with deployment? (y/n)
```

Type: `y` and press Enter

**The script will:**
1. ✓ Check Docker is installed
2. ✓ Create database backup (skipped first time)
3. ✓ Pull latest code
4. ✓ Build Docker images (takes 5-10 minutes first time)
5. ✓ Start all containers
6. ✓ Wait for services to be healthy
7. ✓ Run database migrations
8. ✓ Check application health

**This takes 10-15 minutes the first time** (building images). Subsequent deployments take only 1-2 minutes!

### Watch the Progress

You'll see output like:
```
ℹ Building Docker images...
[+] Building 234.5s (45/45) FINISHED
✓ Images built successfully

ℹ Deploying application...
Creating network "booking-network"
Creating volume "postgres_data"
Creating volume "redis_data"
Creating traefik ... done
Creating booking-postgres ... done
Creating booking-redis ... done
Creating booking-backend ... done
Creating booking-frontend ... done
Creating booking-worker ... done

✓ Application deployed

ℹ Running database migrations...
✓ Migrations completed

ℹ Checking application health...
✓ Backend is healthy
✓ Frontend is accessible

✓ Deployment completed successfully!

=========================================
  Access your application at:
  https://mybookingapp.com
  https://api.mybookingapp.com
=========================================
```

**If you see this, congratulations! 🎉**

---

## Phase 7: Setup Stripe Webhook

Now that your app is deployed, setup the Stripe webhook:

### Create Webhook Endpoint

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com/webhooks
2. **Click** "Add endpoint"
3. **Endpoint URL**: `https://api.mybookingapp.com/billing/webhook`
4. **Description**: "Booking Platform Production"
5. **Events to send**, select:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
6. **Click** "Add endpoint"
7. **Copy** the "Signing secret" (starts with `whsec_`)

### Update Environment

```bash
# On your server
nano .env.production

# Update this line:
STRIPE_WEBHOOK_SECRET=whsec_your_actual_secret_here

# Save: Ctrl+X, Y, Enter

# Restart backend
docker-compose -f docker-compose.prod.yml restart backend
```

---

## Phase 8: Test Everything!

### Test 1: Main Site

**Visit**: https://mybookingapp.com

You should see:
- ✅ HTTPS padlock (SSL certificate working!)
- ✅ Your landing page loads
- ✅ No errors in browser console (press F12)

### Test 2: API Health

```bash
curl https://api.mybookingapp.com/health

# Should return:
{"status":"ok","timestamp":"2025-11-13T..."}
```

### Test 3: Create Test Tenant

**Visit**: https://mybookingapp.com/signup

Fill in:
- Business Name: `Test Salon`
- Email: `test@example.com`
- Password: `testpass123`

Click "Start Free Trial"

You should:
- ✅ Be redirected to: `https://test-salon.mybookingapp.com`
- ✅ See the onboarding wizard or dashboard
- ✅ Be logged in

### Test 4: Different Subdomain

**Visit**: `https://another-business.mybookingapp.com`

- ✅ Should load the app (will show login/signup since no tenant with that name exists yet)
- ✅ Should have HTTPS

### Test 5: View Traefik Dashboard

**Visit**: `https://traefik.mybookingapp.com`

- Login with username: `admin` and the password you set
- You should see:
  - All your routes (api, marketing, tenants)
  - SSL certificates
  - Service health

### Test 6: Check Containers

```bash
# On your server
docker-compose -f docker-compose.prod.yml ps

# Should show all services "Up":
NAME                  STATUS
traefik               Up (healthy)
booking-postgres      Up (healthy)
booking-redis         Up (healthy)
booking-backend       Up
booking-frontend      Up
booking-worker        Up
```

### Test 7: View Logs

```bash
# Backend logs
docker-compose -f docker-compose.prod.yml logs backend

# Should show:
[Nest] INFO [NestFactory] Starting Nest application...
[Nest] INFO [InstanceLoader] AppModule dependencies initialized
...
[Nest] INFO Application is running on: http://0.0.0.0:3000
```

---

## Troubleshooting

### Issue: Site not loading

**Check DNS:**
```bash
dig mybookingapp.com
# Should return your server IP
```

**Check containers:**
```bash
docker-compose -f docker-compose.prod.yml ps
# All should be "Up"
```

**Check Traefik logs:**
```bash
docker-compose -f docker-compose.prod.yml logs traefik | tail -50
```

### Issue: SSL not working

**Wait 2-5 minutes** for Let's Encrypt to issue certificate.

**Check Traefik logs:**
```bash
docker-compose -f docker-compose.prod.yml logs traefik | grep -i certificate
```

**Common fix:** Make sure DNS is pointing to your server!

### Issue: Can't signup/create account

**Check backend logs:**
```bash
docker-compose -f docker-compose.prod.yml logs backend | tail -50
```

**Check database:**
```bash
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d booking_platform -c "SELECT COUNT(*) FROM tenants;"
```

### Issue: Environment variable not working

**Verify it's set:**
```bash
cat .env.production | grep STRIPE_SECRET_KEY
```

**Restart services:**
```bash
docker-compose -f docker-compose.prod.yml restart backend
```

---

## Next Steps

### 1. Secure Your Server

```bash
# Change SSH port (optional but recommended)
nano /etc/ssh/sshd_config
# Change: Port 22 → Port 2222
systemctl restart sshd

# Update firewall
ufw allow 2222/tcp
ufw delete allow 22/tcp

# Disable password authentication
nano /etc/ssh/sshd_config
# Change: PasswordAuthentication yes → no
systemctl restart sshd
```

### 2. Setup Automatic Backups

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /opt/booking-platform && ./scripts/backup.sh >> /var/log/backup.log 2>&1
```

### 3. Enable Monitoring

**Access Netdata:**
- Visit: `http://YOUR_SERVER_IP:19999`
- See real-time CPU, memory, disk, network stats

**Setup alerts** (optional):
- Configure Netdata to send alerts via email/Slack
- https://learn.netdata.cloud/docs/configure/health

### 4. Go Live with Stripe

When ready for real payments:

1. **Activate Stripe account** (complete business verification)
2. **Get live API keys** (Dashboard → API Keys → toggle off "Test mode")
3. **Update .env.production** with live keys
4. **Restart backend**: `docker-compose -f docker-compose.prod.yml restart backend`
5. **Update webhook** to production endpoint

### 5. Add More Features

Start implementing the multi-tenant features from `docs/SAAS-IMPLEMENTATION-STEPS.md`:
- Tenant middleware
- Feature gating
- Usage limits
- Subscription management

---

## Maintenance Commands

### View all logs
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

### Restart a service
```bash
docker-compose -f docker-compose.prod.yml restart backend
```

### Update application
```bash
git pull
./deploy.sh
```

### Backup database manually
```bash
./scripts/backup.sh
```

### Check resource usage
```bash
docker stats
```

### Clean up disk space
```bash
docker system prune -a --volumes -f
```

---

## Success Checklist

- [  ] Server is running and accessible
- [  ] DNS is configured and propagating
- [  ] All environment variables are set
- [  ] Application is deployed (all containers "Up")
- [  ] SSL certificates are working (HTTPS)
- [  ] Can access main site: https://mybookingapp.com
- [  ] Can access API: https://api.mybookingapp.com/health
- [  ] Can create test tenant (signup works)
- [  ] Subdomain routing works: https://test-salon.mybookingapp.com
- [  ] Stripe webhook is configured
- [  ] Email sending works (SendGrid)
- [  ] Automatic backups are scheduled

---

## You Did It! 🎉

Your SaaS booking platform is now:
- ✅ **Deployed** and running on your own server
- ✅ **Secured** with automatic SSL certificates
- ✅ **Configured** with all integrations
- ✅ **Ready** to accept signups and payments
- ✅ **Costing** only $12/mo (vs $100-500/mo!)

**What's next?**
1. Build your marketing site/landing page
2. Implement the multi-tenant features
3. Add your first real customers
4. Scale as needed!

Need help? Just ask! 🚀
