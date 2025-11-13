#!/bin/bash

# =============================================================================
# Interactive Environment Configuration Script
# =============================================================================
# This script helps you configure .env.production interactively

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_info() { echo -e "${YELLOW}ℹ  $1${NC}"; }
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }

prompt() {
    local var_name=$1
    local description=$2
    local default=$3
    local is_secret=${4:-false}

    echo ""
    echo -e "${YELLOW}$description${NC}"
    if [ -n "$default" ]; then
        echo -e "${YELLOW}Default: $default${NC}"
    fi

    if [ "$is_secret" = true ]; then
        read -s -p "> " value
        echo ""
    else
        read -p "> " value
    fi

    if [ -z "$value" ] && [ -n "$default" ]; then
        value=$default
    fi

    eval "$var_name='$value'"
}

generate_secret() {
    openssl rand -base64 $1
}

echo ""
print_header "Booking Platform - Environment Configuration"
echo ""
print_info "This script will help you configure your production environment."
print_info "Press Enter to use default values (shown in yellow)."
echo ""

# Check if .env.production.example exists
if [ ! -f .env.production.example ]; then
    print_error ".env.production.example not found!"
    exit 1
fi

# Domain Configuration
print_header "Domain Configuration"
prompt MAIN_DOMAIN "Enter your domain (e.g., mybookingapp.com):" "mybookingapp.com"
prompt ACME_EMAIL "Enter your email for SSL certificates:" "admin@$MAIN_DOMAIN"

# Security Secrets
print_header "Security Configuration"
print_info "Generating secure passwords and secrets..."

DB_PASSWORD=$(generate_secret 32)
print_success "Database password generated"

REDIS_PASSWORD=$(generate_secret 32)
print_success "Redis password generated"

JWT_SECRET=$(generate_secret 64)
print_success "JWT secret generated"

REFRESH_TOKEN_SECRET=$(generate_secret 64)
print_success "Refresh token secret generated"

# Stripe
print_header "Stripe Configuration"
print_info "Get these from: https://dashboard.stripe.com/apikeys"
prompt STRIPE_SECRET_KEY "Stripe Secret Key (starts with sk_):" "" true
prompt STRIPE_PUBLIC_KEY "Stripe Public Key (starts with pk_):"
prompt STRIPE_WEBHOOK_SECRET "Stripe Webhook Secret (starts with whsec_) [can add later]:" ""

print_info "Now, enter your Stripe Price IDs (created via Stripe CLI or Dashboard)"
prompt STRIPE_STARTER_PRICE_ID "Starter Plan Price ID (e.g., price_1Abc...):" ""
prompt STRIPE_PROFESSIONAL_PRICE_ID "Professional Plan Price ID:" ""
prompt STRIPE_ENTERPRISE_PRICE_ID "Enterprise Plan Price ID:" ""

# SendGrid
print_header "Email Configuration (SendGrid)"
print_info "Get API key from: https://app.sendgrid.com/settings/api_keys"
prompt SENDGRID_API_KEY "SendGrid API Key (starts with SG.):" "" true
prompt EMAIL_FROM "Email 'From' address:" "noreply@$MAIN_DOMAIN"
prompt EMAIL_FROM_NAME "Email 'From' name:" "MyBooking Platform"

# Optional: Twilio
print_header "SMS Configuration (Twilio) - OPTIONAL"
print_info "Press Enter to skip if you don't need SMS"
prompt TWILIO_ACCOUNT_SID "Twilio Account SID (or press Enter to skip):" ""
if [ -n "$TWILIO_ACCOUNT_SID" ]; then
    prompt TWILIO_AUTH_TOKEN "Twilio Auth Token:" "" true
    prompt TWILIO_PHONE_NUMBER "Twilio Phone Number (e.g., +1234567890):"
else
    TWILIO_AUTH_TOKEN=""
    TWILIO_PHONE_NUMBER=""
fi

# Optional: AWS S3
print_header "File Storage (AWS S3) - OPTIONAL"
print_info "Press Enter to skip if you don't need file uploads"
prompt AWS_ACCESS_KEY_ID "AWS Access Key ID (or press Enter to skip):" ""
if [ -n "$AWS_ACCESS_KEY_ID" ]; then
    prompt AWS_SECRET_ACCESS_KEY "AWS Secret Access Key:" "" true
    prompt S3_BUCKET_NAME "S3 Bucket Name:" "${MAIN_DOMAIN//./-}-files"
    AWS_REGION="us-east-1"
    S3_PUBLIC_URL="https://${S3_BUCKET_NAME}.s3.amazonaws.com"
else
    AWS_SECRET_ACCESS_KEY=""
    S3_BUCKET_NAME=""
    AWS_REGION="us-east-1"
    S3_PUBLIC_URL=""
fi

# Optional: Sentry
print_header "Error Monitoring (Sentry) - OPTIONAL"
print_info "Press Enter to skip if you don't need error tracking"
prompt SENTRY_DSN "Sentry DSN (or press Enter to skip):" ""
VITE_SENTRY_DSN="$SENTRY_DSN"

# Traefik Dashboard
print_header "Traefik Dashboard Authentication"
print_info "Installing apache2-utils for password generation..."
apt-get update -qq && apt-get install -y -qq apache2-utils > /dev/null 2>&1 || true

prompt TRAEFIK_PASSWORD "Set Traefik dashboard password:" "" true
TRAEFIK_DASHBOARD_AUTH=$(htpasswd -nb admin "$TRAEFIK_PASSWORD" | sed 's/\$/\$\$/g')

# Generate .env.production
print_header "Generating Configuration File"

cat > .env.production << EOF
# =============================================================================
# PRODUCTION ENVIRONMENT VARIABLES
# =============================================================================
# Generated on: $(date)
# DO NOT COMMIT THIS FILE TO GIT!

# =============================================================================
# DOMAIN CONFIGURATION
# =============================================================================
MAIN_DOMAIN=$MAIN_DOMAIN
ACME_EMAIL=$ACME_EMAIL

# =============================================================================
# DATABASE
# =============================================================================
DB_NAME=booking_platform
DB_USER=postgres
DB_PASSWORD=$DB_PASSWORD

# =============================================================================
# REDIS
# =============================================================================
REDIS_PASSWORD=$REDIS_PASSWORD

# =============================================================================
# JWT AUTHENTICATION
# =============================================================================
JWT_SECRET=$JWT_SECRET
REFRESH_TOKEN_SECRET=$REFRESH_TOKEN_SECRET
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# =============================================================================
# STRIPE PAYMENT PROCESSING
# =============================================================================
STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
STRIPE_PUBLIC_KEY=$STRIPE_PUBLIC_KEY
STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET
STRIPE_STARTER_PRICE_ID=$STRIPE_STARTER_PRICE_ID
STRIPE_PROFESSIONAL_PRICE_ID=$STRIPE_PROFESSIONAL_PRICE_ID
STRIPE_ENTERPRISE_PRICE_ID=$STRIPE_ENTERPRISE_PRICE_ID

# =============================================================================
# EMAIL (SendGrid)
# =============================================================================
SENDGRID_API_KEY=$SENDGRID_API_KEY
EMAIL_FROM=$EMAIL_FROM
EMAIL_FROM_NAME=$EMAIL_FROM_NAME

# =============================================================================
# SMS (Twilio) - Optional
# =============================================================================
TWILIO_ACCOUNT_SID=$TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=$TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER=$TWILIO_PHONE_NUMBER

# =============================================================================
# FILE STORAGE (AWS S3) - Optional
# =============================================================================
AWS_REGION=$AWS_REGION
AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
S3_BUCKET_NAME=$S3_BUCKET_NAME
S3_PUBLIC_URL=$S3_PUBLIC_URL

# =============================================================================
# MONITORING (Sentry) - Optional
# =============================================================================
SENTRY_DSN=$SENTRY_DSN
VITE_SENTRY_DSN=$VITE_SENTRY_DSN
LOG_LEVEL=info

# =============================================================================
# FEATURE FLAGS
# =============================================================================
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_TRACKING=true

# =============================================================================
# TRAEFIK DASHBOARD
# =============================================================================
TRAEFIK_DASHBOARD_AUTH=$TRAEFIK_DASHBOARD_AUTH

# =============================================================================
# RATE LIMITING
# =============================================================================
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
EOF

print_success "Configuration file created: .env.production"
echo ""

# Summary
print_header "Configuration Summary"
echo ""
echo "Domain: $MAIN_DOMAIN"
echo "SSL Email: $ACME_EMAIL"
echo "Database Password: [hidden]"
echo "Redis Password: [hidden]"
echo "Stripe: $([ -n "$STRIPE_SECRET_KEY" ] && echo "✓ Configured" || echo "✗ Not configured")"
echo "SendGrid: $([ -n "$SENDGRID_API_KEY" ] && echo "✓ Configured" || echo "✗ Not configured")"
echo "Twilio SMS: $([ -n "$TWILIO_ACCOUNT_SID" ] && echo "✓ Configured" || echo "✗ Skipped")"
echo "AWS S3: $([ -n "$AWS_ACCESS_KEY_ID" ] && echo "✓ Configured" || echo "✗ Skipped")"
echo "Sentry: $([ -n "$SENTRY_DSN" ] && echo "✓ Configured" || echo "✗ Skipped")"
echo ""

# Warnings
if [ -z "$STRIPE_SECRET_KEY" ]; then
    print_error "WARNING: Stripe not configured. Payments will not work!"
fi

if [ -z "$SENDGRID_API_KEY" ]; then
    print_error "WARNING: SendGrid not configured. Emails will not be sent!"
fi

if [ -z "$STRIPE_WEBHOOK_SECRET" ]; then
    print_info "Remember to add Stripe webhook secret after deployment!"
    print_info "Add endpoint: https://api.$MAIN_DOMAIN/billing/webhook"
fi

echo ""
print_success "Configuration complete!"
print_info "Next steps:"
echo "  1. Review .env.production file"
echo "  2. Run: ./deploy.sh"
echo ""
