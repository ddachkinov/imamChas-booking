# SaaS Implementation: Step-by-Step Guide

This guide provides **actionable steps** to transform your booking platform into a multi-tenant SaaS application.

## Quick Overview

**What you're building:**
- Multiple salons/businesses can sign up
- Each gets their own isolated environment (subdomain)
- Different pricing tiers with feature restrictions
- Automated billing through Stripe
- Self-service onboarding

**Timeline:** 6-8 weeks (1-2 developers)

**Skills needed:**
- Backend: NestJS, TypeORM, PostgreSQL
- Frontend: React, TypeScript
- Billing: Stripe API
- DevOps: Basic DNS, deployment

---

## Phase 1: Database Multi-Tenancy (Week 1)

### Step 1.1: Create Tenants Table

```bash
cd backend
npm run migration:create -- CreateTenantsTable
```

Edit the generated migration file:

```typescript
// backend/src/migrations/XXXXX-CreateTenantsTable.ts
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateTenantsTable1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'tenants',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'slug',
            type: 'varchar',
            length: '100',
            isUnique: true,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'subscription_plan',
            type: 'varchar',
            length: '50',
            default: "'starter'",
          },
          {
            name: 'subscription_status',
            type: 'varchar',
            length: '50',
            default: "'trial'",
          },
          {
            name: 'trial_ends_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'stripe_customer_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
            isUnique: true,
          },
          {
            name: 'stripe_subscription_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
            isUnique: true,
          },
          {
            name: 'settings',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'tenants',
      new TableIndex({
        name: 'IDX_TENANTS_SLUG',
        columnNames: ['slug'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('tenants');
  }
}
```

Run migration:
```bash
npm run migration:run
```

### Step 1.2: Add tenant_id to Existing Tables

```bash
npm run migration:create -- AddTenantIdToTables
```

```typescript
// backend/src/migrations/XXXXX-AddTenantIdToTables.ts
import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AddTenantIdToTables1234567891 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tables = ['users', 'appointments', 'services', 'customers', 'calendar_events'];

    for (const tableName of tables) {
      // Add tenant_id column
      await queryRunner.addColumn(
        tableName,
        new TableColumn({
          name: 'tenant_id',
          type: 'uuid',
          isNullable: true, // Temporary, will be NOT NULL after data migration
        }),
      );

      // Add foreign key
      await queryRunner.createForeignKey(
        tableName,
        new TableForeignKey({
          columnNames: ['tenant_id'],
          referencedTableName: 'tenants',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );

      // Add index
      await queryRunner.createIndex(
        tableName,
        new TableIndex({
          name: `IDX_${tableName.toUpperCase()}_TENANT_ID`,
          columnNames: ['tenant_id'],
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tables = ['users', 'appointments', 'services', 'customers', 'calendar_events'];

    for (const tableName of tables) {
      const table = await queryRunner.getTable(tableName);
      const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf('tenant_id') !== -1);
      if (foreignKey) {
        await queryRunner.dropForeignKey(tableName, foreignKey);
      }
      await queryRunner.dropColumn(tableName, 'tenant_id');
    }
  }
}
```

### Step 1.3: Create Tenant Entity

```typescript
// backend/src/tenants/entities/tenant.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 100, unique: true })
  slug: string;

  @Column({ length: 255 })
  email: string;

  @Column({ length: 50, nullable: true })
  phone?: string;

  @Column({ length: 50, default: 'starter' })
  subscription_plan: 'starter' | 'professional' | 'enterprise';

  @Column({ length: 50, default: 'trial' })
  subscription_status: 'trial' | 'active' | 'past_due' | 'canceled';

  @Column({ type: 'timestamp', nullable: true })
  trial_ends_at?: Date;

  @Column({ length: 255, nullable: true, unique: true })
  stripe_customer_id?: string;

  @Column({ length: 255, nullable: true, unique: true })
  stripe_subscription_id?: string;

  @Column({ type: 'jsonb', default: {} })
  settings: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  branding: Record<string, any>;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  onboarding_completed: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => User, user => user.tenant)
  users: User[];
}
```

### Step 1.4: Update Existing Entities

Example for User entity:

```typescript
// backend/src/users/entities/user.entity.ts
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';

@Entity('users')
export class User {
  // ... existing columns ...

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ length: 50, default: 'staff' })
  role: 'owner' | 'admin' | 'staff';

  @ManyToOne(() => Tenant, tenant => tenant.users)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // ... rest of entity ...
}
```

**Repeat for all entities**: `Appointment`, `Service`, `Customer`, etc.

---

## Phase 2: Tenant Context Middleware (Week 1)

### Step 2.1: Create Tenant Service

```bash
cd backend/src
mkdir tenants
cd tenants
touch tenants.service.ts tenants.controller.ts tenants.module.ts
```

```typescript
// backend/src/tenants/tenants.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private tenantsRepository: Repository<Tenant>,
  ) {}

  async findBySlug(slug: string): Promise<Tenant> {
    const tenant = await this.tenantsRepository.findOne({ where: { slug } });
    if (!tenant) {
      throw new NotFoundException(`Tenant with slug ${slug} not found`);
    }
    return tenant;
  }

  async findBySlugOrDomain(slug: string, domain: string): Promise<Tenant> {
    const tenant = await this.tenantsRepository.findOne({
      where: [{ slug }, { custom_domain: domain }],
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  async create(data: Partial<Tenant>): Promise<Tenant> {
    const tenant = this.tenantsRepository.create(data);
    return await this.tenantsRepository.save(tenant);
  }

  async update(id: string, data: Partial<Tenant>): Promise<Tenant> {
    await this.tenantsRepository.update(id, data);
    return await this.findOne(id);
  }

  async findOne(id: string): Promise<Tenant> {
    return await this.tenantsRepository.findOne({ where: { id } });
  }
}
```

### Step 2.2: Create Tenant Middleware

```typescript
// backend/src/common/middleware/tenant.middleware.ts
import { Injectable, NestMiddleware, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantsService } from '../../tenants/tenants.service';

declare global {
  namespace Express {
    interface Request {
      tenant?: any;
    }
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private tenantsService: TenantsService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const hostname = req.hostname;

    // Skip tenant resolution for certain routes
    if (
      req.path.startsWith('/health') ||
      req.path.startsWith('/auth/signup') ||
      req.path.startsWith('/billing/webhook')
    ) {
      return next();
    }

    // Extract subdomain or check for custom domain
    const parts = hostname.split('.');
    let slug: string;

    if (parts.length >= 3) {
      slug = parts[0]; // e.g., salon-name from salon-name.yourbrand.com
    } else {
      // For development or when using custom domain
      slug = req.headers['x-tenant-slug'] as string || 'demo';
    }

    try {
      const tenant = await this.tenantsService.findBySlugOrDomain(slug, hostname);

      // Check if tenant is active
      if (!tenant.is_active) {
        throw new ForbiddenException('This account has been suspended');
      }

      // Check subscription status
      if (tenant.subscription_status === 'canceled') {
        throw new ForbiddenException('This account subscription has been canceled');
      }

      // Check trial expiration
      if (
        tenant.subscription_status === 'trial' &&
        tenant.trial_ends_at &&
        new Date() > new Date(tenant.trial_ends_at)
      ) {
        throw new ForbiddenException('Trial period has ended. Please subscribe to continue.');
      }

      // Attach tenant to request
      req.tenant = tenant;

      next();
    } catch (error) {
      if (error instanceof NotFoundException) {
        return res.status(404).json({ message: 'Tenant not found' });
      }
      throw error;
    }
  }
}
```

### Step 2.3: Apply Middleware Globally

```typescript
// backend/src/app.module.ts
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { TenantsModule } from './tenants/tenants.module';

@Module({
  imports: [
    TenantsModule,
    // ... other modules
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes('*');
  }
}
```

### Step 2.4: Update All Services to Use Tenant Context

Example for Appointments Service:

```typescript
// backend/src/appointments/appointments.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
  ) {}

  // OLD: No tenant filtering
  // async findAll() {
  //   return await this.appointmentsRepository.find();
  // }

  // NEW: With tenant filtering
  async findAll(tenantId: string) {
    return await this.appointmentsRepository.find({
      where: { tenant_id: tenantId },
    });
  }

  async create(tenantId: string, createDto: CreateAppointmentDto) {
    const appointment = this.appointmentsRepository.create({
      ...createDto,
      tenant_id: tenantId,
    });
    return await this.appointmentsRepository.save(appointment);
  }

  async findOne(id: string, tenantId: string) {
    return await this.appointmentsRepository.findOne({
      where: { id, tenant_id: tenantId },
    });
  }

  async update(id: string, tenantId: string, updateDto: UpdateAppointmentDto) {
    await this.appointmentsRepository.update(
      { id, tenant_id: tenantId },
      updateDto,
    );
    return await this.findOne(id, tenantId);
  }

  async remove(id: string, tenantId: string) {
    await this.appointmentsRepository.delete({ id, tenant_id: tenantId });
  }
}
```

Update controller to extract tenant:

```typescript
// backend/src/appointments/appointments.controller.ts
import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import { AppointmentsService } from './appointments.service';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  async findAll(@Req() req: Request) {
    return await this.appointmentsService.findAll(req.tenant.id);
  }

  @Post()
  async create(@Req() req: Request, @Body() createDto: CreateAppointmentDto) {
    return await this.appointmentsService.create(req.tenant.id, createDto);
  }

  // ... other methods
}
```

**🚨 CRITICAL:** Update ALL services and controllers this way!

---

## Phase 3: Subscription & Billing (Week 2)

### Step 3.1: Install Stripe

```bash
cd backend
npm install stripe
```

### Step 3.2: Create Billing Module

```bash
cd src
mkdir billing
cd billing
touch billing.service.ts billing.controller.ts billing.module.ts
```

### Step 3.3: Setup Stripe Products

```bash
# Install Stripe CLI
# macOS
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Create products
stripe products create \
  --name="Starter Plan" \
  --description="Perfect for small salons"

# Note the product ID: prod_XXXXX

# Create price
stripe prices create \
  --product=prod_XXXXX \
  --unit-amount=2900 \
  --currency=usd \
  --recurring[interval]=month

# Note the price ID: price_XXXXX

# Repeat for Professional ($79) and Enterprise ($199)
```

### Step 3.4: Implement Billing Service

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
      apiVersion: '2024-11-20.acacia',
    });
  }

  async createCheckoutSession(tenantId: string, priceId: string) {
    const tenant = await this.tenantsService.findOne(tenantId);

    const session = await this.stripe.checkout.sessions.create({
      customer_email: tenant.email,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `https://${tenant.slug}.yourbrand.com/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://${tenant.slug}.yourbrand.com/billing/cancel`,
      metadata: {
        tenant_id: tenantId,
      },
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          tenant_id: tenantId,
        },
      },
    });

    return { url: session.url };
  }

  async handleWebhook(signature: string, payload: Buffer) {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
    }

    return { received: true };
  }

  private async handleCheckoutComplete(session: Stripe.Checkout.Session) {
    const tenantId = session.metadata.tenant_id;
    const subscription = await this.stripe.subscriptions.retrieve(
      session.subscription as string,
    );

    await this.tenantsService.update(tenantId, {
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: subscription.id,
      subscription_status: 'active',
    });
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const tenantId = subscription.metadata.tenant_id;

    await this.tenantsService.update(tenantId, {
      subscription_status: subscription.status as any,
    });
  }

  private async handleSubscriptionCanceled(subscription: Stripe.Subscription) {
    const tenantId = subscription.metadata.tenant_id;

    await this.tenantsService.update(tenantId, {
      subscription_status: 'canceled',
      is_active: false,
    });
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    const subscription = await this.stripe.subscriptions.retrieve(
      invoice.subscription as string,
    );
    const tenantId = subscription.metadata.tenant_id;

    await this.tenantsService.update(tenantId, {
      subscription_status: 'past_due',
    });

    // TODO: Send payment failed email
  }
}
```

### Step 3.5: Create Webhook Endpoint

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
    return await this.billingService.handleWebhook(signature, request.rawBody);
  }

  @Post('create-checkout-session')
  async createCheckoutSession(
    @Req() req: Request,
    @Body() body: { priceId: string },
  ) {
    return await this.billingService.createCheckoutSession(
      req.tenant.id,
      body.priceId,
    );
  }
}
```

### Step 3.6: Setup Stripe Webhook

```bash
# Test locally with Stripe CLI
stripe listen --forward-to localhost:3000/billing/webhook

# Copy the webhook signing secret to .env
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# For production, add webhook in Stripe Dashboard:
# https://dashboard.stripe.com/webhooks
# URL: https://api.yourbrand.com/billing/webhook
```

---

## Phase 4: Onboarding Flow (Week 3)

### Step 4.1: Create Onboarding Service

```typescript
// backend/src/onboarding/onboarding.service.ts
import { Injectable, ConflictException } from '@nestjs/common';
import { TenantsService } from '../tenants/tenants.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

interface SignupDto {
  businessName: string;
  email: string;
  password: string;
  phone?: string;
}

@Injectable()
export class OnboardingService {
  constructor(
    private tenantsService: TenantsService,
    private usersService: UsersService,
  ) {}

  async signup(data: SignupDto) {
    // Check if email already exists
    const existingUser = await this.usersService.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Generate unique slug
    const slug = await this.generateSlug(data.businessName);

    // Calculate trial end date (14 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    // Create tenant
    const tenant = await this.tenantsService.create({
      name: data.businessName,
      slug,
      email: data.email,
      phone: data.phone,
      subscription_plan: 'starter',
      subscription_status: 'trial',
      trial_ends_at: trialEndsAt,
      is_active: true,
      onboarding_completed: false,
    });

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create owner user
    const user = await this.usersService.create({
      email: data.email,
      password: hashedPassword,
      tenant_id: tenant.id,
      role: 'owner',
      is_active: true,
    });

    // TODO: Send welcome email

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
      user: {
        id: user.id,
        email: user.email,
      },
      access_url: `https://${slug}.yourbrand.com`,
      trial_ends_at: trialEndsAt,
    };
  }

  private async generateSlug(businessName: string): Promise<string> {
    // Convert to slug format
    let slug = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Ensure uniqueness
    let counter = 1;
    let uniqueSlug = slug;

    while (true) {
      try {
        await this.tenantsService.findBySlug(uniqueSlug);
        // Slug exists, try next
        uniqueSlug = `${slug}-${counter}`;
        counter++;
      } catch {
        // Slug doesn't exist, use it
        break;
      }
    }

    return uniqueSlug;
  }

  async completeOnboarding(tenantId: string) {
    await this.tenantsService.update(tenantId, {
      onboarding_completed: true,
    });
  }
}
```

### Step 4.2: Create Signup Controller

```typescript
// backend/src/onboarding/onboarding.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';

@Controller('onboarding')
export class OnboardingController {
  constructor(private onboardingService: OnboardingService) {}

  @Post('signup')
  async signup(
    @Body() body: {
      businessName: string;
      email: string;
      password: string;
      phone?: string;
    },
  ) {
    return await this.onboardingService.signup(body);
  }

  @Post('complete')
  async completeOnboarding(@Req() req: Request) {
    await this.onboardingService.completeOnboarding(req.tenant.id);
    return { success: true };
  }
}
```

### Step 4.3: Frontend Signup Page

```typescript
// frontend/src/pages/Signup.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    businessName: '',
    email: '',
    password: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        'https://api.yourbrand.com/onboarding/signup',
        formData,
      );

      // Redirect to tenant subdomain
      window.location.href = response.data.access_url + '/onboarding';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <h1>Start Your Free 14-Day Trial</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Business Name"
          value={formData.businessName}
          onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />
        <input
          type="tel"
          placeholder="Phone (optional)"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
        {error && <div className="error">{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Start Free Trial'}
        </button>
      </form>
    </div>
  );
};
```

---

## Phase 5: Feature Gating (Week 3-4)

### Step 5.1: Create Feature Guard

```typescript
// backend/src/common/guards/feature.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const REQUIRES_FEATURE_KEY = 'requires_feature';

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

    const planFeatures = this.getPlanFeatures(tenant.subscription_plan);

    for (const feature of requiredFeatures) {
      if (!planFeatures.includes(feature)) {
        throw new ForbiddenException(
          `This feature requires ${this.getRequiredPlan(feature)} plan or higher`,
        );
      }
    }

    return true;
  }

  private getPlanFeatures(plan: string): string[] {
    const features = {
      starter: ['basic_appointments', 'email_notifications'],
      professional: [
        'basic_appointments',
        'email_notifications',
        'sms_notifications',
        'custom_branding',
        'advanced_analytics',
      ],
      enterprise: [
        'basic_appointments',
        'email_notifications',
        'sms_notifications',
        'custom_branding',
        'advanced_analytics',
        'api_access',
        'white_label',
      ],
    };

    return features[plan] || [];
  }

  private getRequiredPlan(feature: string): string {
    if (['api_access', 'white_label'].includes(feature)) return 'Enterprise';
    if (['sms_notifications', 'custom_branding', 'advanced_analytics'].includes(feature))
      return 'Professional';
    return 'Starter';
  }
}
```

### Step 5.2: Create Decorator

```typescript
// backend/src/common/decorators/requires-feature.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const REQUIRES_FEATURE_KEY = 'requires_feature';
export const RequiresFeature = (...features: string[]) =>
  SetMetadata(REQUIRES_FEATURE_KEY, features);
```

### Step 5.3: Use in Controllers

```typescript
// backend/src/appointments/appointments.controller.ts
import { UseGuards } from '@nestjs/common';
import { FeatureGuard } from '../common/guards/feature.guard';
import { RequiresFeature } from '../common/decorators/requires-feature.decorator';

@Controller('appointments')
@UseGuards(FeatureGuard)
export class AppointmentsController {

  @Post('send-sms')
  @RequiresFeature('sms_notifications')
  async sendSmsReminder() {
    // Only Professional and Enterprise can access
  }

  @Get('analytics/export')
  @RequiresFeature('advanced_analytics')
  async exportAnalytics() {
    // Only Professional and Enterprise can access
  }
}
```

---

## Phase 6: Deployment Configuration (Week 4-5)

### Step 6.1: Environment Variables

Update `.env.production`:

```bash
# Multi-tenant
MAIN_DOMAIN=yourbrand.com
SUBDOMAIN_SUFFIX=.yourbrand.com

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_STARTER_PRICE_ID=price_xxxxx
STRIPE_PROFESSIONAL_PRICE_ID=price_xxxxx
STRIPE_ENTERPRISE_PRICE_ID=price_xxxxx

# Existing vars...
```

### Step 6.2: DNS Configuration

In your DNS provider (e.g., Cloudflare):

```
Type: A
Name: @
Content: [Your server IP]
Proxy: Yes

Type: A
Name: *
Content: [Your server IP]
Proxy: Yes

Type: CNAME
Name: api
Content: your-backend.railway.app
Proxy: Yes
```

### Step 6.3: Deploy Backend

```bash
cd backend

# Add environment variables in Railway dashboard
railway vars set MAIN_DOMAIN=yourbrand.com
railway vars set STRIPE_SECRET_KEY=sk_live_xxxxx
# ... add all vars

# Deploy
railway up
```

### Step 6.4: Deploy Frontend

```bash
cd frontend

# Update VITE_API_URL to point to api.yourbrand.com
# In Vercel dashboard, add environment variable:
VITE_API_URL=https://api.yourbrand.com

# Deploy
vercel --prod

# Configure domain in Vercel
# Add both:
# - yourbrand.com
# - *.yourbrand.com (wildcard)
```

---

## Phase 7: Testing & Launch (Week 5-6)

### Step 7.1: Test Signup Flow

1. Visit `https://yourbrand.com`
2. Click "Start Free Trial"
3. Enter business details
4. Should redirect to `https://[slug].yourbrand.com`
5. Complete onboarding wizard

### Step 7.2: Test Tenant Isolation

```bash
# Create two test tenants
curl -X POST https://api.yourbrand.com/onboarding/signup \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Test Salon 1",
    "email": "salon1@test.com",
    "password": "password123"
  }'

curl -X POST https://api.yourbrand.com/onboarding/signup \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Test Salon 2",
    "email": "salon2@test.com",
    "password": "password123"
  }'

# Login to each and verify data isolation
```

### Step 7.3: Test Subscription Flow

1. Login as tenant
2. Go to Billing page
3. Click "Upgrade to Professional"
4. Complete Stripe checkout
5. Verify subscription status updates
6. Test feature unlocking

### Step 7.4: Test Webhook Handling

```bash
# Use Stripe CLI to send test webhooks
stripe trigger customer.subscription.updated
stripe trigger invoice.payment_failed
```

---

## Checklist: Are You Ready to Launch?

### Backend
- [ ] All tables have `tenant_id` column
- [ ] All queries filter by `tenant_id`
- [ ] Tenant middleware is working
- [ ] Stripe integration tested
- [ ] Webhooks configured and tested
- [ ] Feature guards implemented
- [ ] Email notifications working
- [ ] Database migrations successful

### Frontend
- [ ] Signup flow complete
- [ ] Onboarding wizard implemented
- [ ] Billing page with Stripe Checkout
- [ ] Feature gating UI (upgrade prompts)
- [ ] Subdomain routing works
- [ ] Responsive design
- [ ] Error handling

### Infrastructure
- [ ] DNS configured (wildcard A record)
- [ ] SSL certificates for wildcard domain
- [ ] Backend deployed and healthy
- [ ] Frontend deployed and healthy
- [ ] Environment variables set
- [ ] Database backups configured
- [ ] Monitoring setup (Sentry)

### Legal & Business
- [ ] Terms of Service written
- [ ] Privacy Policy written
- [ ] Pricing page published
- [ ] Payment processing compliant
- [ ] GDPR considerations addressed

---

## Post-Launch Tasks

### Week 1
- Monitor signups closely
- Fix critical bugs immediately
- Respond to customer feedback
- Track key metrics (signups, conversions)

### Week 2-4
- Iterate based on feedback
- Add requested features
- Improve onboarding flow
- Start marketing campaigns

### Month 2+
- Scale infrastructure as needed
- Add integrations (QuickBooks, etc.)
- Build mobile apps
- Expand feature set

---

## Common Issues & Solutions

### Issue: Tenant data leaking between accounts
**Solution**: Add comprehensive tests for tenant isolation. Review ALL queries.

### Issue: Stripe webhook not firing
**Solution**: Check webhook URL is correct, verify webhook secret, check endpoint logs.

### Issue: Subdomain not routing correctly
**Solution**: Verify DNS wildcard record, check middleware logic, test with different subdomains.

### Issue: Performance degradation with many tenants
**Solution**: Add database indexes on `tenant_id`, implement caching, optimize queries.

---

## Need Help?

Stuck on any step? Ask for help with:
- Code examples for specific features
- Debugging tenant isolation issues
- Stripe integration problems
- DNS configuration
- Deployment issues

Ready to start? Begin with **Phase 1: Database Multi-Tenancy**!
