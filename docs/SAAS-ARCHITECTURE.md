# Multi-Tenant SaaS Architecture Guide

## Overview

This guide transforms the booking platform from a single-tenant application into a **Multi-Tenant SaaS Platform** where multiple businesses can subscribe, pay, and get their own isolated booking system.

## Table of Contents

1. [SaaS Business Model](#saas-business-model)
2. [Multi-Tenancy Architecture](#multi-tenancy-architecture)
3. [Database Design](#database-design)
4. [Subscription & Billing](#subscription--billing)
5. [Tenant Onboarding](#tenant-onboarding)
6. [Domain Management](#domain-management)
7. [Feature Gating](#feature-gating)
8. [Implementation Steps](#implementation-steps)
9. [Deployment Architecture](#deployment-architecture)
10. [Scaling Strategy](#scaling-strategy)

---

## SaaS Business Model

### Pricing Tiers Example

| Feature | Starter ($29/mo) | Professional ($79/mo) | Enterprise ($199/mo) |
|---------|------------------|----------------------|---------------------|
| Appointments/month | 100 | 500 | Unlimited |
| Staff Members | 2 | 10 | Unlimited |
| SMS Notifications | ❌ | ✅ | ✅ |
| Email Notifications | ✅ | ✅ | ✅ |
| Custom Branding | ❌ | ✅ | ✅ |
| Analytics Dashboard | Basic | Advanced | Advanced + Export |
| API Access | ❌ | ❌ | ✅ |
| Custom Domain | ❌ | ✅ | ✅ |
| Priority Support | ❌ | ✅ | ✅ (24/7) |
| White Label | ❌ | ❌ | ✅ |

### Revenue Model

```
Monthly Recurring Revenue (MRR) =
  (Starter subscribers × $29) +
  (Professional subscribers × $79) +
  (Enterprise subscribers × $199)
```

---

## Multi-Tenancy Architecture

### Architecture Pattern: Shared Database, Shared Schema

**Pros**: Cost-effective, easy to maintain, efficient resource usage
**Cons**: Requires careful data isolation

```
┌─────────────────────────────────────────────────┐
│              Marketing Website                  │
│         (yourbrand.com - Public)               │
└──────────────────┬──────────────────────────────┘
                   │
       ┌───────────┴───────────┐
       │                       │
┌──────▼─────┐         ┌──────▼─────┐
│   Signup   │         │   Login    │
│   Flow     │         │   Portal   │
└──────┬─────┘         └──────┬─────┘
       │                      │
       └──────────┬───────────┘
                  │
    ┌─────────────▼─────────────┐
    │    Tenant Router/Resolver │
    │   (Identifies tenant by   │
    │   subdomain/domain/token) │
    └─────────────┬─────────────┘
                  │
    ┌─────────────▼─────────────┐
    │    Application Backend     │
    │  (NestJS with Tenant      │
    │   Context Middleware)      │
    └─────────────┬─────────────┘
                  │
    ┌─────────────▼─────────────┐
    │  Shared PostgreSQL DB      │
    │  (All tenants, filtered   │
    │   by tenant_id)            │
    └────────────────────────────┘
```

### Tenant Isolation Strategy

Every database query MUST include `tenant_id` filter:

```sql
-- ❌ WRONG - No tenant isolation
SELECT * FROM appointments WHERE date = '2025-11-11';

-- ✅ CORRECT - Tenant-scoped query
SELECT * FROM appointments
WHERE tenant_id = 'current-tenant-uuid'
AND date = '2025-11-11';
```

---

## Database Design

### Core Schema Changes

#### 1. New Tables

```sql
-- Tenants (Organizations/Businesses)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL, -- For subdomain: salon-name.yourbrand.com
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),

    -- Subscription
    subscription_plan VARCHAR(50) NOT NULL DEFAULT 'starter', -- starter, professional, enterprise
    subscription_status VARCHAR(50) NOT NULL DEFAULT 'trial', -- trial, active, past_due, canceled
    trial_ends_at TIMESTAMP,
    subscription_started_at TIMESTAMP,
    subscription_ends_at TIMESTAMP,

    -- Billing
    stripe_customer_id VARCHAR(255) UNIQUE,
    stripe_subscription_id VARCHAR(255) UNIQUE,

    -- Settings
    settings JSONB DEFAULT '{}', -- Custom settings per tenant
    branding JSONB DEFAULT '{}', -- Logo, colors, etc.

    -- Domain
    custom_domain VARCHAR(255) UNIQUE,
    domain_verified BOOLEAN DEFAULT FALSE,

    -- Limits (based on plan)
    max_staff INTEGER DEFAULT 2,
    max_appointments_per_month INTEGER DEFAULT 100,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    onboarding_completed BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Subscription Plans
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,

    -- Pricing
    monthly_price_cents INTEGER NOT NULL,
    yearly_price_cents INTEGER, -- Optional yearly pricing
    currency VARCHAR(3) DEFAULT 'USD',

    -- Stripe
    stripe_price_id VARCHAR(255),
    stripe_product_id VARCHAR(255),

    -- Features
    features JSONB NOT NULL, -- JSON array of features
    limits JSONB NOT NULL, -- {max_staff: 10, max_appointments: 500}

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_visible BOOLEAN DEFAULT TRUE, -- Show on pricing page

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Subscription History (audit log)
CREATE TABLE subscription_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),

    old_plan VARCHAR(50),
    new_plan VARCHAR(50) NOT NULL,

    reason VARCHAR(255), -- upgrade, downgrade, canceled, trial_ended

    -- Billing event
    stripe_event_id VARCHAR(255),

    created_at TIMESTAMP DEFAULT NOW()
);

-- Usage Tracking (for limits)
CREATE TABLE tenant_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),

    metric VARCHAR(100) NOT NULL, -- appointments_created, sms_sent, emails_sent
    value INTEGER NOT NULL DEFAULT 0,

    -- Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(tenant_id, metric, period_start)
);

-- Invitations (for team members)
CREATE TABLE tenant_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),

    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'staff', -- admin, staff

    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP,

    invited_by UUID REFERENCES users(id),

    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. Modify Existing Tables

Add `tenant_id` to ALL domain tables:

```sql
-- Users
ALTER TABLE users ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'staff'; -- owner, admin, staff
CREATE INDEX idx_users_tenant_id ON users(tenant_id);

-- Appointments
ALTER TABLE appointments ADD COLUMN tenant_id UUID REFERENCES tenants(id);
CREATE INDEX idx_appointments_tenant_id ON appointments(tenant_id);

-- Services
ALTER TABLE services ADD COLUMN tenant_id UUID REFERENCES tenants(id);
CREATE INDEX idx_services_tenant_id ON services(tenant_id);

-- Customers
ALTER TABLE customers ADD COLUMN tenant_id UUID REFERENCES tenants(id);
CREATE INDEX idx_customers_tenant_id ON customers(tenant_id);

-- Calendar Events
ALTER TABLE calendar_events ADD COLUMN tenant_id UUID REFERENCES tenants(id);
CREATE INDEX idx_calendar_events_tenant_id ON calendar_events(tenant_id);

-- Add NOT NULL constraint after migrating existing data
-- ALTER TABLE users ALTER COLUMN tenant_id SET NOT NULL;
```

#### 3. Row-Level Security (PostgreSQL)

For extra security, enable RLS:

```sql
-- Enable RLS on all tenant tables
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY tenant_isolation_policy ON appointments
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_policy ON users
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Repeat for all tables
```

---

## Subscription & Billing

### Stripe Integration

#### 1. Create Products & Prices in Stripe

```bash
# Create products via Stripe CLI or Dashboard
stripe products create \
  --name="Starter Plan" \
  --description="Perfect for small salons"

stripe prices create \
  --product=prod_XXX \
  --unit-amount=2900 \
  --currency=usd \
  --recurring[interval]=month
```

#### 2. Backend Implementation

```typescript
// backend/src/billing/billing.service.ts
import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { TenantsService } from '../tenants/tenants.service';

@Injectable()
export class BillingService {
  private stripe: Stripe;

  constructor(private tenantsService: TenantsService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
  }

  async createSubscription(tenantId: string, planId: string, paymentMethodId: string) {
    const tenant = await this.tenantsService.findOne(tenantId);

    let customerId = tenant.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: tenant.email,
        metadata: { tenant_id: tenantId },
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
      customerId = customer.id;
      await this.tenantsService.update(tenantId, { stripe_customer_id: customerId });
    }

    // Get plan details
    const plan = await this.getSubscriptionPlan(planId);

    // Create subscription
    const subscription = await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: plan.stripe_price_id }],
      trial_period_days: 14, // 14-day free trial
      metadata: { tenant_id: tenantId },
    });

    // Update tenant
    await this.tenantsService.update(tenantId, {
      stripe_subscription_id: subscription.id,
      subscription_plan: plan.slug,
      subscription_status: 'trial',
      trial_ends_at: new Date(subscription.trial_end * 1000),
    });

    return subscription;
  }

  async handleWebhook(signature: string, payload: Buffer) {
    const event = this.stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );

    switch (event.type) {
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionCanceled(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;
    }
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const tenantId = subscription.metadata.tenant_id;

    await this.tenantsService.update(tenantId, {
      subscription_status: subscription.status,
      subscription_ends_at: new Date(subscription.current_period_end * 1000),
    });
  }

  private async handleSubscriptionCanceled(subscription: Stripe.Subscription) {
    const tenantId = subscription.metadata.tenant_id;

    await this.tenantsService.update(tenantId, {
      subscription_status: 'canceled',
      is_active: false,
    });
  }
}
```

#### 3. Webhook Controller

```typescript
// backend/src/billing/billing.controller.ts
import { Controller, Post, Headers, RawBodyRequest, Req } from '@nestjs/common';
import { Request } from 'express';
import { BillingService } from './billing.service';

@Controller('billing')
export class BillingController {
  constructor(private billingService: BillingService) {}

  @Post('webhook')
  async webhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
  ) {
    await this.billingService.handleWebhook(signature, request.rawBody);
    return { received: true };
  }
}
```

---

## Tenant Onboarding

### Signup Flow

```typescript
// backend/src/onboarding/onboarding.service.ts
import { Injectable } from '@nestjs/common';
import { TenantsService } from '../tenants/tenants.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class OnboardingService {
  constructor(
    private tenantsService: TenantsService,
    private usersService: UsersService,
  ) {}

  async signup(data: {
    businessName: string;
    email: string;
    password: string;
    phone?: string;
  }) {
    // 1. Generate unique slug
    const slug = await this.generateUniqueSlug(data.businessName);

    // 2. Create tenant
    const tenant = await this.tenantsService.create({
      name: data.businessName,
      slug,
      email: data.email,
      phone: data.phone,
      subscription_plan: 'starter',
      subscription_status: 'trial',
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    });

    // 3. Create owner user
    const user = await this.usersService.create({
      email: data.email,
      password: data.password,
      tenant_id: tenant.id,
      role: 'owner',
      is_active: true,
    });

    // 4. Send welcome email
    await this.sendWelcomeEmail(user.email, tenant.slug);

    // 5. Return access credentials
    return {
      tenant,
      user,
      access_url: `https://${slug}.yourbrand.com`,
    };
  }

  private async generateUniqueSlug(businessName: string): Promise<string> {
    let slug = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    let counter = 1;
    let uniqueSlug = slug;

    while (await this.tenantsService.findBySlug(uniqueSlug)) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    return uniqueSlug;
  }
}
```

### Onboarding Wizard

```typescript
// frontend/src/pages/Onboarding.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const OnboardingSteps = {
  BUSINESS_INFO: 1,
  SERVICES: 2,
  STAFF: 3,
  SCHEDULE: 4,
  PAYMENT: 5,
};

export const Onboarding: React.FC = () => {
  const [step, setStep] = useState(OnboardingSteps.BUSINESS_INFO);
  const navigate = useNavigate();

  const handleComplete = async () => {
    await api.post('/onboarding/complete');
    navigate('/dashboard');
  };

  return (
    <div className="onboarding-wizard">
      {step === OnboardingSteps.BUSINESS_INFO && (
        <BusinessInfoStep onNext={() => setStep(OnboardingSteps.SERVICES)} />
      )}
      {step === OnboardingSteps.SERVICES && (
        <ServicesStep
          onNext={() => setStep(OnboardingSteps.STAFF)}
          onBack={() => setStep(OnboardingSteps.BUSINESS_INFO)}
        />
      )}
      {/* ... other steps */}
    </div>
  );
};
```

---

## Domain Management

### Subdomain Strategy

Each tenant gets: `{tenant-slug}.yourbrand.com`

#### DNS Configuration (Cloudflare)

```
Type: A
Name: *
Content: [Your server IP or load balancer]
Proxy: Yes (Orange cloud)
```

#### Backend Tenant Resolution

```typescript
// backend/src/common/middleware/tenant.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantsService } from '../../tenants/tenants.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private tenantsService: TenantsService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Get hostname: salon-name.yourbrand.com
    const hostname = req.hostname;

    // Extract subdomain
    const subdomain = hostname.split('.')[0];

    // Skip for main domain or API routes
    if (subdomain === 'www' || subdomain === 'api' || subdomain === 'yourbrand') {
      return next();
    }

    // Find tenant by slug or custom domain
    const tenant = await this.tenantsService.findBySlugOrDomain(subdomain, hostname);

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Check if tenant is active
    if (!tenant.is_active || tenant.subscription_status === 'canceled') {
      return res.status(403).json({ message: 'Account suspended' });
    }

    // Attach tenant to request
    req['tenant'] = tenant;

    next();
  }
}
```

#### Apply Globally

```typescript
// backend/src/app.module.ts
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes('*'); // Apply to all routes
  }
}
```

### Custom Domain Support

```typescript
// backend/src/tenants/tenants.service.ts
async addCustomDomain(tenantId: string, domain: string) {
  // 1. Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');

  // 2. Update tenant
  await this.tenantsRepository.update(tenantId, {
    custom_domain: domain,
    domain_verified: false,
    domain_verification_token: verificationToken,
  });

  // 3. Return DNS instructions
  return {
    message: 'Add the following DNS records:',
    records: [
      {
        type: 'CNAME',
        name: domain,
        value: 'yourbrand.com',
      },
      {
        type: 'TXT',
        name: `_verification.${domain}`,
        value: verificationToken,
      },
    ],
  };
}

async verifyCustomDomain(tenantId: string) {
  const tenant = await this.findOne(tenantId);

  // Check TXT record
  const txtRecords = await dns.resolveTxt(`_verification.${tenant.custom_domain}`);
  const verified = txtRecords.some(record =>
    record.includes(tenant.domain_verification_token)
  );

  if (verified) {
    await this.tenantsRepository.update(tenantId, { domain_verified: true });
    return { verified: true };
  }

  return { verified: false };
}
```

---

## Feature Gating

### Decorator-Based Feature Control

```typescript
// backend/src/common/decorators/requires-feature.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const REQUIRES_FEATURE_KEY = 'requires_feature';
export const RequiresFeature = (...features: string[]) =>
  SetMetadata(REQUIRES_FEATURE_KEY, features);
```

### Feature Guard

```typescript
// backend/src/common/guards/feature.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRES_FEATURE_KEY } from '../decorators/requires-feature.decorator';

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredFeatures = this.reflector.getAllAndOverride<string[]>(
      REQUIRES_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredFeatures) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const tenant = request.tenant;

    // Check if tenant's plan includes required features
    const hasFeature = requiredFeatures.every(feature =>
      this.tenantHasFeature(tenant, feature)
    );

    if (!hasFeature) {
      throw new ForbiddenException(
        'This feature is not available in your current plan. Please upgrade.'
      );
    }

    return true;
  }

  private tenantHasFeature(tenant: any, feature: string): boolean {
    const planFeatures = {
      starter: ['email_notifications', 'basic_analytics'],
      professional: ['email_notifications', 'sms_notifications', 'advanced_analytics', 'custom_branding'],
      enterprise: ['email_notifications', 'sms_notifications', 'advanced_analytics', 'custom_branding', 'api_access', 'white_label'],
    };

    return planFeatures[tenant.subscription_plan]?.includes(feature) || false;
  }
}
```

### Usage in Controllers

```typescript
// backend/src/appointments/appointments.controller.ts
import { Controller, Post, UseGuards } from '@nestjs/common';
import { RequiresFeature } from '../common/decorators/requires-feature.decorator';
import { FeatureGuard } from '../common/guards/feature.guard';

@Controller('appointments')
@UseGuards(FeatureGuard)
export class AppointmentsController {

  @Post('send-sms-reminder')
  @RequiresFeature('sms_notifications')
  async sendSmsReminder() {
    // Only professional and enterprise plans can use this
  }

  @Post('export-analytics')
  @RequiresFeature('advanced_analytics')
  async exportAnalytics() {
    // Only professional and enterprise plans
  }
}
```

### Frontend Feature Gating

```typescript
// frontend/src/hooks/useFeature.ts
import { useTenant } from './useTenant';

export const useFeature = (feature: string): boolean => {
  const { tenant } = useTenant();

  const planFeatures = {
    starter: ['email_notifications', 'basic_analytics'],
    professional: ['email_notifications', 'sms_notifications', 'advanced_analytics', 'custom_branding'],
    enterprise: ['email_notifications', 'sms_notifications', 'advanced_analytics', 'custom_branding', 'api_access', 'white_label'],
  };

  return planFeatures[tenant?.subscription_plan]?.includes(feature) || false;
};

// Usage in components
import { useFeature } from '../hooks/useFeature';

const SmsSettings = () => {
  const hasSms = useFeature('sms_notifications');

  if (!hasSms) {
    return (
      <UpgradePrompt
        feature="SMS Notifications"
        requiredPlan="Professional"
      />
    );
  }

  return <SmsSettingsForm />;
};
```

---

## Implementation Steps

### Phase 1: Core Infrastructure (Week 1-2)

1. **Database Migration**
   ```bash
   # Create migration
   npm run migration:create -- AddMultiTenancy

   # Apply changes
   npm run migration:run
   ```

2. **Tenant Middleware**
   - Implement tenant resolution
   - Add tenant context to requests
   - Test isolation

3. **Update All Queries**
   - Add `tenant_id` filter to all database queries
   - Update TypeORM repositories
   - Add indexes

### Phase 2: Subscription System (Week 2-3)

1. **Stripe Integration**
   - Create products/prices
   - Implement subscription creation
   - Set up webhooks
   - Test payment flows

2. **Billing Portal**
   - Subscription management UI
   - Payment method updates
   - Invoice history

### Phase 3: Onboarding (Week 3-4)

1. **Signup Flow**
   - Tenant registration
   - Owner account creation
   - Email verification
   - Trial activation

2. **Onboarding Wizard**
   - Business setup
   - Service configuration
   - Staff invitations
   - Initial settings

### Phase 4: Feature Gating (Week 4)

1. **Backend Guards**
   - Feature decorators
   - Usage tracking
   - Limit enforcement

2. **Frontend Components**
   - Feature checks
   - Upgrade prompts
   - Plan comparison

### Phase 5: Domain Management (Week 5)

1. **Subdomain Routing**
   - Wildcard DNS
   - Tenant resolution
   - SSL certificates

2. **Custom Domains**
   - Domain verification
   - DNS management
   - SSL provisioning

### Phase 6: Admin Dashboard (Week 5-6)

1. **Super Admin Panel**
   - Tenant management
   - Usage analytics
   - Billing overview
   - Support tools

### Phase 7: Testing & Launch (Week 6-7)

1. **Load Testing**
2. **Security Audit**
3. **Beta Launch**
4. **Marketing Site**

---

## Deployment Architecture

### Recommended Stack for SaaS

```
┌───────────────────────────────────────────────────────┐
│                 Marketing Site                        │
│           (Next.js on Vercel/Netlify)                │
│           yourbrand.com - Public facing              │
└───────────────────┬───────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼──────┐       ┌───────▼──────┐
│ App Platform │       │   API/Backend│
│  (Multi-tenant)│       │   (NestJS)   │
│ *.yourbrand.com│◄─────▶│  Railway/ECS │
│  Vercel/Netlify│       │              │
└────────────────┘       └──────┬───────┘
                                │
                    ┌───────────┼───────────┐
                    │           │           │
            ┌───────▼───┐  ┌────▼────┐ ┌───▼──────┐
            │PostgreSQL │  │  Redis  │ │   S3     │
            │ (Supabase)│  │(Upstash)│ │  (AWS)   │
            │  + Pooling│  │         │ │          │
            └───────────┘  └─────────┘ └──────────┘
```

### Infrastructure Costs (Estimated)

**Initial Stage (0-100 tenants)**:
- Backend (Railway): $20-50/mo
- Database (Supabase Pro): $25/mo
- Redis (Upstash): $10/mo
- Frontend (Vercel Pro): $20/mo
- Storage (S3): $5-20/mo
- Email (SendGrid): $15/mo
- **Total: ~$95-140/mo**

**Growth Stage (100-1000 tenants)**:
- Backend (Multiple instances): $200-500/mo
- Database (Supabase Team + Read replicas): $100-300/mo
- Redis (Upstash Pro): $50-100/mo
- CDN (CloudFlare Pro): $20/mo
- Storage (S3): $50-200/mo
- **Total: ~$420-1,120/mo**

**Breakeven Analysis**:
- 10 customers × $29 = $290/mo (✅ Profitable)
- 50 customers × $29 = $1,450/mo (💰 Good margin)

---

## Scaling Strategy

### Vertical Scaling (Initial)

1. **Database Optimization**
   - Connection pooling (PgBouncer)
   - Read replicas
   - Proper indexing
   - Query optimization

2. **Caching Strategy**
   ```typescript
   // Cache tenant data
   const tenant = await cache.wrap(`tenant:${slug}`, async () => {
     return await tenantsRepository.findOne({ where: { slug } });
   }, { ttl: 300 }); // 5 minutes
   ```

3. **CDN for Static Assets**
   - CloudFlare for caching
   - Image optimization
   - Asset compression

### Horizontal Scaling (Growth)

1. **Load Balancer**
   ```yaml
   # Multiple backend instances
   services:
     backend-1:
       image: booking-backend
       replicas: 3
   ```

2. **Database Sharding** (Advanced)
   - Shard by `tenant_id`
   - Separate high-value customers
   - Geographic distribution

3. **Microservices** (Optional)
   - Separate billing service
   - Separate notification service
   - API gateway (Kong/Nginx)

### Monitoring

```typescript
// Track tenant usage
async trackUsage(tenantId: string, metric: string) {
  await usageRepository.increment({
    tenant_id: tenantId,
    metric,
    period_start: startOfMonth(new Date()),
    period_end: endOfMonth(new Date()),
  });
}

// Usage limits check
async checkLimit(tenantId: string, metric: string) {
  const usage = await this.getCurrentUsage(tenantId, metric);
  const limit = await this.getTenantLimit(tenantId, metric);

  if (usage >= limit) {
    throw new ForbiddenException(`You've reached your monthly ${metric} limit`);
  }
}
```

---

## Marketing Website Structure

### Landing Page Sections

1. **Hero**: Value proposition + CTA
2. **Features**: Key benefits for salons
3. **Pricing**: Tier comparison table
4. **Testimonials**: Social proof
5. **Demo**: Video or interactive tour
6. **FAQ**: Common questions
7. **CTA**: Start free trial

### Tech Stack for Marketing Site

- **Framework**: Next.js (SEO-friendly)
- **Styling**: Tailwind CSS
- **CMS**: Contentful or Strapi
- **Analytics**: PostHog or Plausible
- **A/B Testing**: Vercel Edge Config

### Example Landing Page Code

```typescript
// marketing-site/src/pages/index.tsx
export default function Home() {
  return (
    <>
      <Hero />
      <Features />
      <Pricing plans={pricingPlans} />
      <Testimonials />
      <Demo />
      <FAQ />
      <CTASection />
    </>
  );
}

// Pricing component
const Pricing = ({ plans }) => (
  <section className="pricing">
    <h2>Simple, Transparent Pricing</h2>
    <div className="plans">
      {plans.map(plan => (
        <PricingCard key={plan.id} plan={plan}>
          <Button href={`/signup?plan=${plan.slug}`}>
            Start {plan.trial_days}-Day Free Trial
          </Button>
        </PricingCard>
      ))}
    </div>
  </section>
);
```

---

## Security Considerations for SaaS

1. **Tenant Isolation**
   - ALWAYS filter by `tenant_id`
   - Use RLS policies
   - Audit all queries

2. **Data Privacy**
   - GDPR compliance
   - Data export functionality
   - Tenant deletion (hard delete)

3. **Rate Limiting**
   - Per-tenant limits
   - Protect against abuse
   - Fair usage policy

4. **Authentication**
   - JWT with tenant claim
   - MFA for high-value accounts
   - Session management

5. **PCI Compliance** (if handling payments)
   - Use Stripe hosted checkout
   - Never store card details
   - Follow PCI DSS guidelines

---

## Legal & Compliance

### Required Documents

1. **Terms of Service**
2. **Privacy Policy**
3. **SLA (Service Level Agreement)**
4. **Data Processing Agreement** (GDPR)
5. **Acceptable Use Policy**

### Compliance Checklist

- [ ] GDPR compliance (EU data)
- [ ] CCPA compliance (California data)
- [ ] SOC 2 Type II (for enterprise)
- [ ] Data encryption at rest and in transit
- [ ] Regular security audits
- [ ] Incident response plan
- [ ] Data backup and recovery procedures

---

## Go-To-Market Strategy

### Launch Phases

**Phase 1: Private Beta (Month 1-2)**
- 10-20 selected salons
- Free access
- Gather feedback
- Fix critical bugs

**Phase 2: Public Beta (Month 3)**
- Open registration
- Extended free trial (30 days)
- Limited features
- Build case studies

**Phase 3: Official Launch (Month 4)**
- Full feature set
- Standard trial (14 days)
- Marketing campaign
- Press release

### Marketing Channels

1. **Content Marketing**
   - Blog posts (salon management tips)
   - SEO for "salon booking software"
   - YouTube tutorials

2. **Paid Ads**
   - Google Ads (intent-based)
   - Facebook/Instagram (salon owners)
   - LinkedIn (professional market)

3. **Partnerships**
   - Salon associations
   - Beauty industry events
   - Equipment suppliers

4. **Referral Program**
   - Existing customers refer new ones
   - Incentives (1 month free)

---

## Success Metrics

### Key Performance Indicators (KPIs)

1. **Acquisition**
   - Signups per month
   - Trial-to-paid conversion (target: 20-30%)
   - Customer Acquisition Cost (CAC)

2. **Retention**
   - Monthly churn rate (target: <5%)
   - Customer Lifetime Value (LTV)
   - Net Promoter Score (NPS)

3. **Revenue**
   - Monthly Recurring Revenue (MRR)
   - Average Revenue Per User (ARPU)
   - LTV:CAC ratio (target: >3:1)

4. **Usage**
   - Daily/Monthly Active Users
   - Feature adoption rates
   - Average session duration

---

## Next Steps

1. **Validate the Market**
   - Talk to 20+ salon owners
   - Understand pain points
   - Validate pricing

2. **Build MVP**
   - Focus on core features
   - Get first 5 paying customers
   - Iterate based on feedback

3. **Scale Gradually**
   - Don't over-engineer initially
   - Add features based on demand
   - Monitor costs closely

4. **Build Community**
   - Customer success team
   - Active support channels
   - User forums/groups

---

## Conclusion

Transforming this into a SaaS platform requires:
1. ✅ Multi-tenant architecture
2. ✅ Subscription billing
3. ✅ Tenant isolation
4. ✅ Feature gating
5. ✅ Scalable infrastructure
6. ✅ Marketing strategy

**Estimated Timeline**: 6-8 weeks for MVP
**Initial Investment**: $5-10K (development + infrastructure)
**Break-even**: ~10-15 customers

Ready to start building? I can help implement any of these components!
