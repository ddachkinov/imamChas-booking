# DOMAIN-MODEL.md

## 1. Overview

This document provides a detailed domain model for the booking platform, including all entities, their attributes, relationships, and key constraints. The model supports both multi-tenant SaaS and single-tenant deployments with appropriate isolation mechanisms.

## 2. Core Entities

### 2.1 Tenant

Represents a top-level account in the system. In multi-tenant mode, all data is scoped to a tenant. In single-tenant mode, a single tenant record exists.

**Attributes:**
- `id` (UUID, PK): Unique identifier
- `slug` (String, unique): URL-safe identifier (e.g., "hairsalon123")
- `name` (String): Display name
- `subscription_tier` (Enum): FREE, BASIC, PROFESSIONAL, ENTERPRISE
- `subscription_status` (Enum): TRIAL, ACTIVE, SUSPENDED, CANCELLED
- `subscription_started_at` (Timestamp)
- `subscription_expires_at` (Timestamp, nullable)
- `feature_flags` (JSONB): Toggleable features per tenant
- `settings` (JSONB): Global tenant settings (timezone, locale, currency)
- `data_residency_region` (String): EU, US, UK, etc.
- `is_self_hosted` (Boolean): True for single-tenant deployments
- `created_at` (Timestamp)
- `updated_at` (Timestamp)
- `deleted_at` (Timestamp, nullable, soft delete)

**Relationships:**
- Has many: Business, User, AuditLog
- Has one: TenantSettings (embedded as JSONB or separate table)

**Indexes:**
- Primary key on `id`
- Unique index on `slug`
- Index on `subscription_status`

**Constraints:**
- `slug` must be URL-safe (lowercase alphanumeric, hyphens)
- `subscription_expires_at` must be after `subscription_started_at`

---

### 2.2 User

Represents any person who interacts with the system (business owners, staff, clients).

**Attributes:**
- `id` (UUID, PK): Unique identifier
- `tenant_id` (UUID, FK, indexed): Reference to Tenant (null for cross-tenant clients in marketplace mode)
- `email` (String, unique per tenant): Primary contact email
- `email_verified` (Boolean): Email verification status
- `phone_number` (String, nullable): Contact phone
- `phone_verified` (Boolean): Phone verification status
- `password_hash` (String, nullable): Hashed password (null for OAuth-only users)
- `password_salt` (String, nullable)
- `password_last_changed_at` (Timestamp, nullable)
- `first_name` (String)
- `last_name` (String)
- `display_name` (String, nullable): Preferred name
- `avatar_url` (String, nullable): Profile picture URL
- `language` (String): ISO 639-1 code (e.g., "en", "bg")
- `timezone` (String): IANA timezone (e.g., "Europe/Sofia")
- `status` (Enum): ACTIVE, INACTIVE, SUSPENDED, DELETED
- `last_login_at` (Timestamp, nullable)
- `mfa_enabled` (Boolean): Multi-factor authentication status
- `mfa_method` (Enum, nullable): TOTP, SMS
- `mfa_secret` (String, nullable, encrypted): MFA secret key
- `oauth_provider` (String, nullable): google, facebook, apple
- `oauth_provider_id` (String, nullable): External OAuth user ID
- `metadata` (JSONB, nullable): Additional flexible attributes
- `created_at` (Timestamp)
- `updated_at` (Timestamp)
- `deleted_at` (Timestamp, nullable, soft delete)

**Relationships:**
- Belongs to: Tenant (nullable for marketplace clients)
- Has many: UserRole, Appointment (as client), AuditLog
- Has one: StaffMember (if user is staff)
- Has one: ClientProfile (if user is client)

**Indexes:**
- Primary key on `id`
- Unique index on `tenant_id, email`
- Index on `tenant_id, status`
- Index on `oauth_provider, oauth_provider_id`

**Constraints:**
- Either `password_hash` or `oauth_provider` must be set
- `email` must be valid email format
- `phone_number` must be valid E.164 format

---

### 2.3 Role

Defines a set of permissions that can be assigned to users.

**Attributes:**
- `id` (UUID, PK): Unique identifier
- `tenant_id` (UUID, FK, indexed): Reference to Tenant
- `name` (String): Role name (e.g., "Owner", "Manager", "Receptionist", "Stylist")
- `description` (String, nullable): Role description
- `is_system_role` (Boolean): True for built-in roles that cannot be deleted
- `scope` (Enum): TENANT, BUSINESS, LOCATION
- `created_at` (Timestamp)
- `updated_at` (Timestamp)
- `deleted_at` (Timestamp, nullable, soft delete)

**Relationships:**
- Belongs to: Tenant
- Has many: RolePermission, UserRole

**Indexes:**
- Primary key on `id`
- Unique index on `tenant_id, name`
- Index on `tenant_id, scope`

**Constraints:**
- System roles cannot be modified or deleted
- Name must be unique per tenant

---

### 2.4 Permission

Granular access control rule.

**Attributes:**
- `id` (UUID, PK): Unique identifier
- `resource` (String): Resource type (e.g., "appointment", "client", "staff", "settings")
- `action` (String): Action allowed (e.g., "create", "read", "update", "delete", "export")
- `scope` (Enum): TENANT, BUSINESS, LOCATION, OWN
- `description` (String, nullable)
- `is_system_permission` (Boolean): True for built-in permissions
- `created_at` (Timestamp)

**Relationships:**
- Has many: RolePermission

**Indexes:**
- Primary key on `id`
- Unique index on `resource, action, scope`

**Constraints:**
- System permissions cannot be deleted
- Resource and action must be from predefined lists

**Examples:**
- `appointment:read:location` - Can view appointments for assigned location
- `staff:update:business` - Can modify staff for entire business
- `settings:update:tenant` - Can modify tenant-level settings
- `appointment:delete:own` - Can delete only own appointments

---

### 2.5 UserRole

Junction table linking users to roles with scope.

**Attributes:**
- `id` (UUID, PK): Unique identifier
- `user_id` (UUID, FK, indexed): Reference to User
- `role_id` (UUID, FK, indexed): Reference to Role
- `scope_type` (Enum): TENANT, BUSINESS, LOCATION
- `scope_id` (UUID, nullable, indexed): ID of Business or Location if scoped
- `granted_by` (UUID, FK, nullable): User who granted this role
- `granted_at` (Timestamp)
- `expires_at` (Timestamp, nullable): Optional expiration
- `created_at` (Timestamp)

**Relationships:**
- Belongs to: User, Role

**Indexes:**
- Primary key on `id`
- Unique index on `user_id, role_id, scope_type, scope_id`
- Index on `user_id`
- Index on `role_id`
- Index on `scope_type, scope_id`

**Constraints:**
- If `scope_type` is BUSINESS or LOCATION, `scope_id` must be set
- `expires_at` must be in the future if set

---

### 2.6 RolePermission

Junction table linking roles to permissions.

**Attributes:**
- `id` (UUID, PK): Unique identifier
- `role_id` (UUID, FK, indexed): Reference to Role
- `permission_id` (UUID, FK, indexed): Reference to Permission
- `created_at` (Timestamp)

**Relationships:**
- Belongs to: Role, Permission

**Indexes:**
- Primary key on `id`
- Unique index on `role_id, permission_id`
- Index on `role_id`
- Index on `permission_id`

---

### 2.7 Business

Represents the service provider organization (one per tenant in most cases, but supports multiple for franchises).

**Attributes:**
- `id` (UUID, PK): Unique identifier
- `tenant_id` (UUID, FK, indexed): Reference to Tenant
- `name` (String): Business name
- `legal_name` (String, nullable): Legal entity name
- `tax_id` (String, nullable): Tax identification number
- `description` (Text, nullable): Business description
- `website` (String, nullable): Business website URL
- `logo_url` (String, nullable): Logo image URL
- `primary_color` (String, nullable): Brand color (hex code)
- `secondary_color` (String, nullable): Brand color (hex code)
- `currency` (String): ISO 4217 code (e.g., "USD", "EUR", "BGN")
- `default_timezone` (String): IANA timezone
- `booking_policy` (JSONB): Cancellation policy, advance booking limits, etc.
- `status` (Enum): ACTIVE, INACTIVE, SUSPENDED
- `metadata` (JSONB, nullable)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)
- `deleted_at` (Timestamp, nullable, soft delete)

**Relationships:**
- Belongs to: Tenant
- Has many: Location, Service, StaffMember, Client, EmailCampaign

**Indexes:**
- Primary key on `id`
- Index on `tenant_id`
- Index on `tenant_id, status`

**Constraints:**
- At least one business required per tenant
- `currency` must be valid ISO 4217 code

---

### 2.8 Location

Physical or virtual business location where services are provided.

**Attributes:**
- `id` (UUID, PK): Unique identifier
- `tenant_id` (UUID, FK, indexed): Reference to Tenant
- `business_id` (UUID, FK, indexed): Reference to Business
- `name` (String): Location name
- `address_line1` (String)
- `address_line2` (String, nullable)
- `city` (String)
- `state_province` (String, nullable)
- `postal_code` (String)
- `country` (String): ISO 3166-1 alpha-2 code
- `latitude` (Decimal, nullable): Geocoordinate
- `longitude` (Decimal, nullable): Geocoordinate
- `phone_number` (String, nullable)
- `email` (String, nullable): Location-specific contact email
- `timezone` (String): IANA timezone
- `operating_hours` (JSONB): Weekly schedule with open/close times per day
- `status` (Enum): ACTIVE, INACTIVE, TEMPORARILY_CLOSED
- `settings` (JSONB): Location-specific settings (override business defaults)
- `metadata` (JSONB, nullable)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)
- `deleted_at` (Timestamp, nullable, soft delete)

**Relationships:**
- Belongs to: Tenant, Business
- Has many: StaffMember, Appointment, Resource
- Has many through: Service (via LocationService)

**Indexes:**
- Primary key on `id`
- Index on `tenant_id`
- Index on `business_id`
- Index on `business_id, status`
- Spatial index on `latitude, longitude`

**Constraints:**
- At least one location required per business
- `country` must be valid ISO 3166-1 code

**Operating Hours JSONB Schema Example:**
```
{
  "monday": { "open": "09:00", "close": "18:00", "closed": false },
  "tuesday": { "open": "09:00", "close": "18:00", "closed": false },
  "wednesday": { "open": "09:00", "close": "18:00", "closed": false },
  "thursday": { "open": "09:00", "close": "20:00", "closed": false },
  "friday": { "open": "09:00", "close": "20:00", "closed": false },
  "saturday": { "open": "10:00", "close": "16:00", "closed": false },
  "sunday": { "closed": true }
}
```

---

### 2.9 Service

A bookable service offered by the business.

**Attributes:**
- `id` (UUID, PK): Unique identifier
- `tenant_id` (UUID, FK, indexed): Reference to Tenant
- `business_id` (UUID, FK, indexed): Reference to Business
- `name` (String): Service name
- `description` (Text, nullable): Service description
- `category` (String, nullable): Service category (e.g., "Hair", "Nails", "Massage")
- `duration_minutes` (Integer): Default service duration
- `buffer_before_minutes` (Integer, default 0): Buffer time before appointment
- `buffer_after_minutes` (Integer, default 0): Buffer time after appointment
- `price` (Decimal): Base price
- `price_currency` (String): ISO 4217 code
- `deposit_amount` (Decimal, nullable): Required deposit
- `deposit_type` (Enum, nullable): FIXED, PERCENTAGE
- `tax_rate` (Decimal, nullable): Tax rate as decimal (e.g., 0.20 for 20%)
- `image_url` (String, nullable): Service image
- `color` (String, nullable): Calendar color (hex code)
- `is_group_booking_allowed` (Boolean, default false): Allow multiple clients per slot
- `max_group_size` (Integer, nullable): Maximum clients per group booking
- `requires_approval` (Boolean, default false): Booking needs manual approval
- `booking_advance_min_hours` (Integer, default 0): Minimum advance booking time
- `booking_advance_max_days` (Integer, nullable): Maximum advance booking time
- `cancellation_allowed_hours` (Integer, nullable): Cancellation cutoff
- `status` (Enum): ACTIVE, INACTIVE, ARCHIVED
- `sort_order` (Integer): Display order
- `metadata` (JSONB, nullable)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)
- `deleted_at` (Timestamp, nullable, soft delete)

**Relationships:**
- Belongs to: Tenant, Business
- Has many: Appointment, ServiceAddon
- Has many through: Location (via LocationService)
- Has many through: StaffMember (via StaffSkill)

**Indexes:**
- Primary key on `id`
- Index on `tenant_id`
- Index on `business_id, status`
- Index on `business_id, category`

**Constraints:**
- `duration_minutes` must be positive
- `price` must be non-negative
- If `is_group_booking_allowed`, `max_group_size` must be set and > 1

---

### 2.10 ServiceAddon

Optional add-ons to services (e.g., "Deep conditioning" for haircut).

**Attributes:**
- `id` (UUID, PK): Unique identifier
- `tenant_id` (UUID, FK, indexed): Reference to Tenant
- `service_id` (UUID, FK, indexed): Reference to Service
- `name` (String): Addon name
- `description` (Text, nullable)
- `additional_duration_minutes` (Integer): Added time
- `additional_price` (Decimal): Added cost
- `sort_order` (Integer)
- `status` (Enum): ACTIVE, INACTIVE
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Relationships:**
- Belongs to: Service

**Indexes:**
- Primary key on `id`
- Index on `service_id, status`

---

### 2.11 LocationService

Junction table linking locations to available services (a service may be offered at some locations but not others).

**Attributes:**
- `id` (UUID, PK): Unique identifier
- `tenant_id` (UUID, FK, indexed): Reference to Tenant
- `location_id` (UUID, FK, indexed): Reference to Location
- `service_id` (UUID, FK, indexed): Reference to Service
- `price_override` (Decimal, nullable): Location-specific price
- `is_available` (Boolean, default true)
- `created_at` (Timestamp)

**Relationships:**
- Belongs to: Location, Service

**Indexes:**
- Primary key on `id`
- Unique index on `location_id, service_id`
- Index on `tenant_id`

---

### 2.12 StaffMember

A user who provides services (linked to User).

**Attributes:**
- `id` (UUID, PK): Unique identifier
- `tenant_id` (UUID, FK, indexed): Reference to Tenant
- `user_id` (UUID, FK, indexed, unique): Reference to User
- `business_id` (UUID, FK, indexed): Reference to Business
- `location_id` (UUID, FK, indexed, nullable): Primary location assignment
- `title` (String, nullable): Job title (e.g., "Senior Stylist")
- `bio` (Text, nullable): Staff biography
- `photo_url` (String, nullable): Staff photo
- `calendar_color` (String, nullable): Calendar display color (hex code)
- `commission_rate` (Decimal, nullable): Commission percentage
- `hourly_rate` (Decimal, nullable): For payroll calculation
- `status` (Enum): ACTIVE, INACTIVE, ON_LEAVE
- `hire_date` (Date, nullable)
- `termination_date` (Date, nullable)
- `accepts_online_bookings` (Boolean, default true)
- `default_buffer_before_minutes` (Integer, default 0)
- `default_buffer_after_minutes` (Integer, default 0)
- `metadata` (JSONB, nullable)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)
- `deleted_at` (Timestamp, nullable, soft delete)

**Relationships:**
- Belongs to: Tenant, User, Business, Location
- Has many: Availability, Appointment, StaffSkill

**Indexes:**
- Primary key on `id`
- Unique index on `user_id`
- Index on `tenant_id`
- Index on `business_id, status`
- Index on `location_id`

**Constraints:**
- `user_id` must be unique (one staff profile per user)
- `commission_rate` and `hourly_rate` must be non-negative if set

---

### 2.13 StaffSkill

Junction table linking staff to services they can provide with proficiency level.

**Attributes:**
- `id` (UUID, PK): Unique identifier
- `tenant_id` (UUID, FK, indexed): Reference to Tenant
- `staff_member_id` (UUID, FK, indexed): Reference to StaffMember
- `service_id` (UUID, FK, indexed): Reference to Service
- `proficiency_level` (Enum): TRAINEE, COMPETENT, PROFICIENT, EXPERT
- `duration_override_minutes` (Integer, nullable): Staff-specific duration
- `price_override` (Decimal, nullable): Staff-specific pricing
- `is_preferred` (Boolean, default false): Highlighted for this service
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Relationships:**
- Belongs to: StaffMember, Service

**Indexes:**
- Primary key on `id`
- Unique index on `staff_member_id, service_id`
- Index on `tenant_id`
- Index on `service_id`

**Constraints:**
- A staff member can only have one skill record per service

---

### 2.14 Availability

Defines when a staff member is available for bookings.

**Attributes:**
- `id` (UUID, PK): Unique identifier
- `tenant_id` (UUID, FK, indexed): Reference to Tenant
- `staff_member_id` (UUID, FK, indexed): Reference to StaffMember
- `type` (Enum): RECURRING, ONE_TIME, TIME_OFF
- `day_of_week` (Integer, nullable): 0=Sunday, 1=Monday, ..., 6=Saturday (for recurring)
- `start_date` (Date, nullable): For one-time or time-off
- `end_date` (Date, nullable): For one-time or time-off
- `start_time` (Time): Daily start time
- `end_time` (Time): Daily end time
- `timezone` (String): IANA timezone
- `is_available` (Boolean): True for availability, false for time-off
- `notes` (Text, nullable): Reason for time-off or special notes
- `recurrence_rule` (String, nullable): iCalendar RRULE format for complex patterns
- `created_at` (Timestamp)
- `updated_at` (Timestamp)
- `deleted_at` (Timestamp, nullable, soft delete)

**Relationships:**
- Belongs to: Tenant, StaffMember

**Indexes:**
- Primary key on `id`
- Index on `tenant_id`
- Index on `staff_member_id, type`
- Index on `start_date, end_date`

**Constraints:**
- If `type` is RECURRING, `day_of_week` must be set
- If `type` is ONE_TIME or TIME_OFF, `start_date` and `end_date` must be set
- `end_time` must be after `start_time`

**Examples:**
- Recurring: Staff available every Monday 9am-5pm
- One-time: Staff available on 2025-12-15 from 10am-2pm
- Time-off: Staff unavailable 2025-12-20 to 2025-12-27

---

### 2.15 ClientProfile

Extended profile information for clients (linked to User).

**Attributes:**
- `id` (UUID, PK): Unique identifier
- `tenant_id` (UUID, FK, indexed): Reference to Tenant
- `user_id` (UUID, FK, indexed, unique): Reference to User
- `business_id` (UUID, FK, indexed): Reference to Business
- `date_of_birth` (Date, nullable)
- `gender` (String, nullable)
- `address_line1` (String, nullable)
- `address_line2` (String, nullable)
- `city` (String, nullable)
- `state_province` (String, nullable)
- `postal_code` (String, nullable)
- `country` (String, nullable)
- `preferred_location_id` (UUID, FK, nullable): Preferred Location
- `preferred_staff_member_id` (UUID, FK, nullable): Preferred StaffMember
- `notification_preferences` (JSONB): Email, SMS, push notification settings
- `marketing_consent` (Boolean, default false): Opt-in for marketing emails
- `loyalty_points` (Integer, default 0): Accumulated loyalty points
- `total_spent` (Decimal, default 0): Lifetime spend with business
- `no_show_count` (Integer, default 0): Number of no-shows
- `cancellation_count` (Integer, default 0): Number of cancellations
- `notes` (Text, nullable): Staff notes about client
- `tags` (JSONB): Array of tags (e.g., ["VIP", "Allergy-Latex"])
- `status` (Enum): ACTIVE, BLOCKED, DELETED
- `created_at` (Timestamp)
- `updated_at` (Timestamp)
- `deleted_at` (Timestamp, nullable, soft delete)

**Relationships:**
- Belongs to: Tenant, User, Business
- Has many: Appointment

**Indexes:**
- Primary key on `id`
- Unique index on `user_id, business_id`
- Index on `tenant_id`
- Index on `business_id, status`

**Constraints:**
- `loyalty_points` must be non-negative
- `total_spent` must be non-negative

**Notification Preferences JSONB Schema Example:**
```
{
  "email": {
    "appointment_confirmation": true,
    "appointment_reminder": true,
    "appointment_cancelled": true,
    "marketing": false
  },
  "sms": {
    "appointment_reminder": true,
    "appointment_cancelled": false
  },
  "push": {
    "appointment_reminder": true
  }
}
```

---

### 2.16 Appointment

Core booking entity representing a scheduled appointment.

**Attributes:**
- `id` (UUID, PK): Unique identifier
- `tenant_id` (UUID, FK, indexed): Reference to Tenant
- `business_id` (UUID, FK, indexed): Reference to Business
- `location_id` (UUID, FK, indexed): Reference to Location
- `client_id` (UUID, FK, indexed): Reference to ClientProfile
- `staff_member_id` (UUID, FK, indexed): Reference to StaffMember
- `service_id` (UUID, FK, indexed): Reference to Service
- `appointment_number` (String, unique per tenant): Human-readable ID (e.g., "APT-2025-00123")
- `start_time` (Timestamp with timezone): Appointment start
- `end_time` (Timestamp with timezone): Appointment end
- `timezone` (String): IANA timezone for display
- `duration_minutes` (Integer): Actual duration (including buffers)
- `buffer_before_minutes` (Integer): Buffer before
- `buffer_after_minutes` (Integer): Buffer after
- `status` (Enum): PENDING, CONFIRMED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW
- `cancellation_reason` (String, nullable)
- `cancelled_at` (Timestamp, nullable)
- `cancelled_by` (UUID, FK, nullable): User who cancelled
- `is_recurring` (Boolean, default false): Part of recurring series
- `recurring_group_id` (UUID, nullable, indexed): Links recurring appointments
- `recurrence_rule` (String, nullable): iCalendar RRULE format
- `is_group_booking` (Boolean, default false): Group appointment flag
- `group_size` (Integer, default 1): Number of clients
- `notes` (Text, nullable): Client-facing notes
- `internal_notes` (Text, nullable): Staff-only notes
- `check_in_time` (Timestamp, nullable)
- `completion_time` (Timestamp, nullable)
- `no_show_notified` (Boolean, default false)
- `reminder_sent_at` (Timestamp, nullable)
- `metadata` (JSONB, nullable)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)
- `deleted_at` (Timestamp, nullable, soft delete)
- `version` (Integer, default 1): Optimistic locking version

**Relationships:**
- Belongs to: Tenant, Business, Location, ClientProfile, StaffMember, Service
- Has one: Payment
- Has many: Notification, AppointmentAddon

**Indexes:**
- Primary key on `id`
- Unique index on `tenant_id, appointment_number`
- Index on `tenant_id, status`
- Index on `location_id, start_time, end_time`
- Index on `staff_member_id, start_time, end_time`
- Index on `client_id, status`
- Index on `recurring_group_id`
- Index on `start_time` (for date range queries)

**Constraints:**
- `end_time` must be after `start_time`
- `duration_minutes` must equal (end_time - start_time) in minutes
- Cannot overlap with another appointment for same staff member (enforced via optimistic locking)
- If `is_recurring`, `recurring_group_id` and `recurrence_rule` must be set
- If `is_group_booking`, `group_size` must be > 1

**Status Transitions:**
```
PENDING -> CONFIRMED -> CHECKED_IN -> IN_PROGRESS -> COMPLETED
       \-> CANCELLED
       \-> NO_SHOW
```

---

### 2.17 AppointmentAddon

Links appointments to service add-ons.

**Attributes:**
- `id` (UUID, PK): Unique identifier
- `tenant_id` (UUID, FK, indexed): Reference to Tenant
- `appointment_id` (UUID, FK, indexed): Reference to Appointment
- `service_addon_id` (UUID, FK, indexed): Reference to ServiceAddon
- `price` (Decimal): Addon price at time of booking
- `created_at` (Timestamp)

**Relationships:**
- Belongs to: Appointment, ServiceAddon

**Indexes:**
- Primary key on `id`
- Index on `appointment_id`

---

### 2.18 Payment

Payment transaction for an appointment.

**Attributes:**
- `id` (UUID, PK): Unique identifier
- `tenant_id` (UUID, FK, indexed): Reference to Tenant
- `appointment_id` (UUID, FK, indexed, unique): Reference to Appointment
- `client_id` (UUID, FK, indexed): Reference to ClientProfile
- `amount` (Decimal): Total amount
- `currency` (String): ISO 4217 code
- `amount_paid` (Decimal, default 0): Amount received
- `amount_refunded` (Decimal, default 0): Amount refunded
- `payment_type` (Enum): FULL, DEPOSIT
- `payment_method` (Enum): CARD, CASH, BANK_TRANSFER, GIFT_CARD, OTHER
- `payment_gateway` (String, nullable): stripe, paypal, etc.
- `gateway_transaction_id` (String, nullable): External transaction ID
- `gateway_payment_intent_id` (String, nullable): Stripe PaymentIntent ID
- `status` (Enum): PENDING, AUTHORIZED, CAPTURED, FAILED, REFUNDED, PARTIALLY_REFUNDED
- `paid_at` (Timestamp, nullable)
- `refunded_at` (Timestamp, nullable)
- `discount_amount` (Decimal, default 0): Coupon/discount applied
- `tax_amount` (Decimal, default 0): Tax charged
- `tip_amount` (Decimal, default 0): Tip/gratuity
- `notes` (Text, nullable)
- `metadata` (JSONB, nullable): Gateway-specific data
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Relationships:**
- Belongs to: Tenant, Appointment, ClientProfile
- Has many: PaymentLineItem, Refund

**Indexes:**
- Primary key on `id`
- Unique index on `appointment_id`
- Index on `tenant_id, status`
- Index on `client_id`
- Index on `gateway_transaction_id`

**Constraints:**
- `amount_paid` + `amount_refunded` <= `amount`
- `discount_amount` >= 0
- `tax_amount` >= 0
- `tip_amount` >= 0

---

### 2.19 PaymentLineItem

Breakdown of payment (service, addons, tips, etc.).

**Attributes:**
- `id` (UUID, PK): Unique identifier
- `payment_id` (UUID, FK, indexed): Reference to Payment
- `item_type` (Enum): SERVICE, ADDON, TIP, TAX, DISCOUNT
- `description` (String)
- `quantity` (Integer, default 1)
- `unit_price` (Decimal)
- `total_price` (Decimal): quantity * unit_price
- `created_at` (Timestamp)

**Relationships:**
- Belongs to: Payment

**Indexes:**
- Primary key on `id`
- Index on `payment_id`

---

### 2.20 Refund

Refund record for a payment.

**Attributes:**
- `id` (UUID, PK): Unique identifier
- `tenant_id` (UUID, FK, indexed): Reference to Tenant
- `payment_id` (UUID, FK, indexed): Reference to Payment
- `amount` (Decimal): Refund amount
- `reason` (String, nullable)
- `refunded_by` (UUID, FK, nullable): User who initiated refund
- `gateway_refund_id` (String, nullable): External refund ID
- `status` (Enum): PENDING, COMPLETED, FAILED
- `refunded_at` (Timestamp, nullable)
- `created_at` (Timestamp)

**Relationships:**
- Belongs to: Tenant, Payment

**Indexes:**
- Primary key on `id`
- Index on `payment_id`
- Index on `gateway_refund_id`

---

### 2.21 Coupon

Discount code for promotions.

**Attributes:**
- `id` (UUID, PK): Unique identifier
- `tenant_id` (UUID, FK, indexed): Reference to Tenant
- `business_id` (UUID, FK, indexed): Reference to Business
- `code` (String, unique per tenant): Coupon code
- `description` (String, nullable)
- `discount_type` (Enum): PERCENTAGE, FIXED_AMOUNT
- `discount_value` (Decimal): Percentage (0-100) or fixed amount
- `currency` (String, nullable): For FIXED_AMOUNT type
- `min_purchase_amount` (Decimal, nullable): Minimum spend required
- `max_discount_amount` (Decimal, nullable): Cap for percentage discounts
- `applies_to` (Enum): ALL_SERVICES, SPECIFIC_SERVICES, SPECIFIC_CATEGORIES
- `applicable_service_ids` (JSONB, nullable): Array of service IDs
- `usage_limit` (Integer, nullable): Total uses allowed
- `usage_count` (Integer, default 0): Times used
- `usage_limit_per_client` (Integer, nullable): Per-client limit
- `valid_from` (Timestamp): Coupon activation date
- `valid_until` (Timestamp, nullable): Expiration date
- `status` (Enum): ACTIVE, INACTIVE, EXPIRED
- `created_by` (UUID, FK, nullable): User who created coupon
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Relationships:**
- Belongs to: Tenant, Business

**Indexes:**
- Primary key on `id`
- Unique index on `tenant_id, code`
- Index on `business_id, status`

**Constraints:**
- `code` must be uppercase alphanumeric
- `discount_value` must be positive
- If `discount_type` is PERCENTAGE, value must be 0-100
- `usage_count` <= `usage_limit` if set

---

### 2.22 GiftCard

Prepaid service credits.

**Attributes:**
- `id` (UUID, PK): Unique identifier
- `tenant_id` (UUID, FK, indexed): Reference to Tenant
- `business_id` (UUID, FK, indexed): Reference to Business
- `code` (String, unique): Gift card code
- `initial_value` (Decimal): Original value
- `current_value` (Decimal): Remaining balance
- `currency` (String): ISO 4217 code
- `purchased_by_client_id` (UUID, FK, nullable): Purchaser
- `recipient_email` (String, nullable)
- `recipient_name` (String, nullable)
- `message` (Text, nullable): Personal message
- `purchased_at` (Timestamp, nullable)
- `expires_at` (Timestamp, nullable)
- `status` (Enum): ACTIVE, REDEEMED, EXPIRED, CANCELLED
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Relationships:**
- Belongs to: Tenant, Business
- Has many: GiftCardTransaction

**Indexes:**
- Primary key on `id`
- Unique index on `code`
- Index on `tenant_id`
- Index on `business_id, status`

**Constraints:**
- `current_value` <= `initial_value`
- `current_value` >= 0

---

### 2.23 GiftCardTransaction

Usage history for gift cards.

**Attributes:**
- `id` (UUID, PK): Unique identifier
- `gift_card_id` (UUID, FK, indexed): Reference to GiftCard
- `appointment_id` (UUID, FK, nullable): Reference to Appointment if used for booking
- `transaction_type` (Enum): PURCHASE, REDEMPTION, REFUND, ADJUSTMENT
- `amount` (Decimal): Amount added or deducted
- `balance_after` (Decimal): Balance after transaction
- `notes` (String, nullable)
- `created_at` (Timestamp)

**Relationships:**
- Belongs to: GiftCard, Appointment (nullable)

**Indexes:**
- Primary key on `id`
- Index on `gift_card_id`

---

### 2.24 Membership

Recurring subscription plans for clients (e.g., monthly massage package).

**Attributes:**
- `id` (UUID, PK): Unique identifier
- `tenant_id` (UUID, FK, indexed): Reference to Tenant
- `business_id` (UUID, FK, indexed): Reference to Business
- `name` (String): Membership name
- `description` (Text, nullable)
- `price` (Decimal): Recurring price
- `currency` (String): ISO 4217 code
- `billing_interval` (Enum): MONTHLY, QUARTERLY, ANNUALLY
- `benefits` (JSONB): Membership benefits (e.g., discounts, free services)
- `included_services` (JSONB, nullable): Array of service IDs and quantities
- `discount_percentage` (Decimal, nullable): Discount on all services
- `status` (Enum): ACTIVE, INACTIVE, ARCHIVED
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Relationships:**
- Belongs to: Tenant, Business
- Has many: ClientMembership

**Indexes:**
- Primary key on `id`
- Index on `tenant_id`
- Index on `business_id, status`

**Benefits JSONB Schema Example:**
```
{
  "discounts": { "all_services": 15 },
  "included_services": [
    { "service_id": "uuid", "quantity_per_month": 2 }
  ],
  "priority_booking": true,
  "no_cancellation_fee": true
}
```

---

### 2.25 ClientMembership

Client enrollment in a membership plan.

**Attributes:**
- `id` (UUID, PK): Unique identifier
- `tenant_id` (UUID, FK, indexed): Reference to Tenant
- `client_id` (UUID, FK, indexed): Reference to ClientProfile
- `membership_id` (UUID, FK, indexed): Reference to Membership
- `status` (Enum): ACTIVE, PAUSED, CANCELLED, EXPIRED
- `started_at` (Timestamp): Enrollment date
- `paused_at` (Timestamp, nullable)
- `cancelled_at` (Timestamp, nullable)
- `expires_at` (Timestamp, nullable)
- `next_billing_date` (Date)
- `payment_method_id` (String, nullable): Gateway payment method token
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Relationships:**
- Belongs to: Tenant, ClientProfile, Membership
- Has many: MembershipTransaction

**Indexes:**
- Primary key on `id`
- Unique index on `client_id, membership_id` (one active membership per client per type)
- Index on `tenant_id`
- Index on `next_billing_date, status`

---

### 2.26 MembershipTransaction

Billing history for memberships.

**Attributes:**
- `id` (UUID, PK): Unique identifier
- `client_membership_id` (UUID, FK, indexed): Reference to ClientMembership
- `transaction_type` (Enum): CHARGE, REFUND
- `amount` (Decimal)
- `currency` (String)
- `gateway_transaction_id` (String, nullable)
- `status` (Enum): PENDING, SUCCEEDED, FAILED
- `billing_period_start` (Date)
- `billing_period_end` (Date)
- `attempted_at` (Timestamp)
- `succeeded_at` (Timestamp, nullable)
- `created_at` (Timestamp)

**Relationships:**
- Belongs to: ClientMembership

**Indexes:**
- Primary key on `id`
- Index on `client_membership_id`

---

### 2.27 Notification

Communication records (email, SMS, push).

**Attributes:**
- `id` (UUID, PK): Unique identifier
- `tenant_id` (UUID, FK, indexed): Reference to Tenant
- `recipient_user_id` (UUID, FK, indexed): Reference to User
- `appointment_id` (UUID, FK, nullable, indexed): Related Appointment
- `notification_type` (Enum): APPOINTMENT_CONFIRMATION, APPOINTMENT_REMINDER, APPOINTMENT_CANCELLED, APPOINTMENT_RESCHEDULED, PAYMENT_RECEIPT, MARKETING, SYSTEM
- `channel` (Enum): EMAIL, SMS, PUSH, IN_APP
- `recipient_address` (String): Email address, phone number, or device token
- `subject` (String, nullable): For email
- `body` (Text): Message content
- `template_id` (UUID, FK, nullable): Reference to NotificationTemplate
- `status` (Enum): PENDING, SENT, DELIVERED, FAILED, BOUNCED
- `scheduled_for` (Timestamp, nullable): Scheduled send time
- `sent_at` (Timestamp, nullable)
- `delivered_at` (Timestamp, nullable)
- `opened_at` (Timestamp, nullable): For email tracking
- `clicked_at` (Timestamp, nullable): For link tracking
- `failed_reason` (String, nullable)
- `gateway_message_id` (String, nullable): External provider message ID
- `retry_count` (Integer, default 0)
- `metadata` (JSONB, nullable)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Relationships:**
- Belongs to: Tenant, User, Appointment (nullable), NotificationTemplate (nullable)

**Indexes:**
- Primary key on `id`
- Index on `tenant_id, status`
- Index on `recipient_user_id`
- Index on `appointment_id`
- Index on `scheduled_for, status`

**Constraints:**
- `retry_count` must be non-negative

---

### 2.28 NotificationTemplate

Reusable message templates.

**Attributes:**
- `id` (UUID, PK): Unique identifier
- `tenant_id` (UUID, FK, indexed): Reference to Tenant
- `business_id` (UUID, FK, indexed, nullable): Reference to Business (null for system templates)
- `name` (String): Template name
- `notification_type` (Enum): APPOINTMENT_CONFIRMATION, etc.
- `channel` (Enum): EMAIL, SMS, PUSH
- `language` (String): ISO 639-1 code
- `subject` (String, nullable): For email
- `body_template` (Text): Message with placeholders (e.g., "{{client_name}}")
- `is_system_template` (Boolean): True for built-in templates
- `is_active` (Boolean, default true)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Relationships:**
- Belongs to: Tenant, Business (nullable)

**Indexes:**
- Primary key on `id`
- Index on `tenant_id, notification_type, channel, language`
- Index on `business_id, is_active`

**Constraints:**
- System templates cannot be deleted
- Placeholders must follow format: {{variable_name}}

---

### 2.29 EmailCampaign

Marketing campaign management.

**Attributes:**
- `id` (UUID, PK): Unique identifier
- `tenant_id` (UUID, FK, indexed): Reference to Tenant
- `business_id` (UUID, FK, indexed): Reference to Business
- `name` (String): Campaign name
- `subject` (String): Email subject
- `body_html` (Text): HTML email content
- `body_text` (Text, nullable): Plain text fallback
- `sender_name` (String): From name
- `sender_email` (String): From email
- `recipient_filter` (JSONB): Criteria for selecting recipients (e.g., clients who visited in last 90 days)
- `status` (Enum): DRAFT, SCHEDULED, SENDING, SENT, CANCELLED
- `scheduled_for` (Timestamp, nullable)
- `sent_at` (Timestamp, nullable)
- `recipient_count` (Integer): Number of recipients
- `delivered_count` (Integer, default 0)
- `opened_count` (Integer, default 0)
- `clicked_count` (Integer, default 0)
- `created_by` (UUID, FK, nullable): User who created campaign
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Relationships:**
- Belongs to: Tenant, Business
- Has many: EmailCampaignRecipient

**Indexes:**
- Primary key on `id`
- Index on `tenant_id`
- Index on `business_id, status`
- Index on `scheduled_for, status`

**Constraints:**
- Cannot send if `status` is DRAFT
- `recipient_count` must match actual recipients

**Recipient Filter JSONB Schema Example:**
```
{
  "conditions": [
    { "field": "last_appointment_date", "operator": "within_days", "value": 90 },
    { "field": "total_spent", "operator": "greater_than", "value": 100 },
    { "field": "marketing_consent", "operator": "equals", "value": true }
  ],
  "logic": "AND"
}
```

---

### 2.30 EmailCampaignRecipient

Tracks campaign delivery per recipient.

**Attributes:**
- `id` (UUID, PK): Unique identifier
- `campaign_id` (UUID, FK, indexed): Reference to EmailCampaign
- `client_id` (UUID, FK, indexed): Reference to ClientProfile
- `email` (String): Recipient email (denormalized)
- `status` (Enum): PENDING, SENT, DELIVERED, OPENED, CLICKED, FAILED, BOUNCED, UNSUBSCRIBED
- `sent_at` (Timestamp, nullable)
- `delivered_at` (Timestamp, nullable)
- `opened_at` (Timestamp, nullable)
- `clicked_at` (Timestamp, nullable)
- `failed_reason` (String, nullable)
- `gateway_message_id` (String, nullable)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Relationships:**
- Belongs to: EmailCampaign, ClientProfile

**Indexes:**
- Primary key on `id`
- Unique index on `campaign_id, client_id`
- Index on `status`

---

### 2.31 Resource

Non-staff bookable resources (equipment, rooms, etc.).

**Attributes:**
- `id` (UUID, PK): Unique identifier
- `tenant_id` (UUID, FK, indexed): Reference to Tenant
- `location_id` (UUID, FK, indexed): Reference to Location
- `name` (String): Resource name
- `type` (Enum): ROOM, EQUIPMENT, VEHICLE, OTHER
- `description` (Text, nullable)
- `capacity` (Integer, nullable): Max concurrent uses
- `status` (Enum): AVAILABLE, UNAVAILABLE, MAINTENANCE
- `metadata` (JSONB, nullable)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Relationships:**
- Belongs to: Tenant, Location
- Has many: AppointmentResource, ResourceAvailability

**Indexes:**
- Primary key on `id`
- Index on `tenant_id`
- Index on `location_id, status`

---

### 2.32 AppointmentResource

Links appointments to required resources.

**Attributes:**
- `id` (UUID, PK): Unique identifier
- `appointment_id` (UUID, FK, indexed): Reference to Appointment
- `resource_id` (UUID, FK, indexed): Reference to Resource
- `created_at` (Timestamp)

**Relationships:**
- Belongs to: Appointment, Resource

**Indexes:**
- Primary key on `id`
- Unique index on `appointment_id, resource_id`

---

### 2.33 ResourceAvailability

Defines when resources are available.

**Attributes:**
- `id` (UUID, PK): Unique identifier
- `tenant_id` (UUID, FK, indexed): Reference to Tenant
- `resource_id` (UUID, FK, indexed): Reference to Resource
- `type` (Enum): RECURRING, ONE_TIME, MAINTENANCE
- `day_of_week` (Integer, nullable)
- `start_date` (Date, nullable)
- `end_date` (Date, nullable)
- `start_time` (Time)
- `end_time` (Time)
- `is_available` (Boolean)
- `notes` (Text, nullable)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Relationships:**
- Belongs to: Tenant, Resource

**Indexes:**
- Primary key on `id`
- Index on `tenant_id`
- Index on `resource_id, type`

---

### 2.34 AuditLog

Immutable log of all system changes for compliance and debugging.

**Attributes:**
- `id` (UUID, PK): Unique identifier
- `tenant_id` (UUID, FK, indexed): Reference to Tenant
- `user_id` (UUID, FK, nullable, indexed): User who performed action (null for system)
- `action` (Enum): CREATE, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT, etc.
- `entity_type` (String): Table/entity name (e.g., "appointment", "user")
- `entity_id` (UUID): ID of affected entity
- `changes` (JSONB, nullable): Before/after values for UPDATE actions
- `ip_address` (String, nullable): Request IP
- `user_agent` (String, nullable): Request user agent
- `correlation_id` (UUID): Groups related actions in single request
- `created_at` (Timestamp)

**Relationships:**
- Belongs to: Tenant, User (nullable)

**Indexes:**
- Primary key on `id`
- Index on `tenant_id, created_at DESC`
- Index on `user_id, created_at DESC`
- Index on `entity_type, entity_id`
- Index on `correlation_id`

**Constraints:**
- Records are immutable (no updates or deletes)
- Retention period: 7 years (configurable)

**Changes JSONB Schema Example:**
```
{
  "before": {
    "status": "confirmed",
    "start_time": "2025-06-01T14:00:00Z"
  },
  "after": {
    "status": "cancelled",
    "start_time": "2025-06-01T14:00:00Z",
    "cancelled_at": "2025-05-28T10:30:00Z"
  }
}
```

---

### 2.35 Integration

Configuration for external integrations.

**Attributes:**
- `id` (UUID, PK): Unique identifier
- `tenant_id` (UUID, FK, indexed): Reference to Tenant
- `business_id` (UUID, FK, indexed, nullable): Business-specific integration
- `integration_type` (Enum): GOOGLE_CALENDAR, APPLE_CALENDAR, OUTLOOK, STRIPE, PAYPAL, QUICKBOOKS, MAILCHIMP, ZAPIER, etc.
- `is_enabled` (Boolean, default false)
- `configuration` (JSONB, encrypted): API keys, tokens, settings
- `oauth_access_token` (String, nullable, encrypted)
- `oauth_refresh_token` (String, nullable, encrypted)
- `oauth_expires_at` (Timestamp, nullable)
- `last_sync_at` (Timestamp, nullable)
- `last_sync_status` (Enum, nullable): SUCCESS, FAILED
- `last_sync_error` (Text, nullable)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Relationships:**
- Belongs to: Tenant, Business (nullable)

**Indexes:**
- Primary key on `id`
- Unique index on `tenant_id, business_id, integration_type`
- Index on `last_sync_at`

**Constraints:**
- Only one integration per type per business
- Sensitive fields must be encrypted at rest

---

### 2.36 Widget

Embeddable booking widget configuration.

**Attributes:**
- `id` (UUID, PK): Unique identifier
- `tenant_id` (UUID, FK, indexed): Reference to Tenant
- `business_id` (UUID, FK, indexed): Reference to Business
- `location_id` (UUID, FK, indexed, nullable): Scope widget to location
- `name` (String): Widget name for internal reference
- `widget_key` (String, unique): Public identifier for embed code
- `theme` (JSONB): Colors, fonts, styling
- `settings` (JSONB): Widget behavior (default view, services to show, etc.)
- `allowed_domains` (JSONB): Array of domains where widget can be embedded
- `is_active` (Boolean, default true)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Relationships:**
- Belongs to: Tenant, Business, Location (nullable)

**Indexes:**
- Primary key on `id`
- Unique index on `widget_key`
- Index on `tenant_id`
- Index on `business_id, is_active`

**Theme JSONB Schema Example:**
```
{
  "primary_color": "#3B82F6",
  "secondary_color": "#10B981",
  "font_family": "Inter, sans-serif",
  "border_radius": "8px"
}
```

---

### 2.37 Report

Saved analytics and reporting configurations.

**Attributes:**
- `id` (UUID, PK): Unique identifier
- `tenant_id` (UUID, FK, indexed): Reference to Tenant
- `business_id` (UUID, FK, indexed, nullable): Business-specific report
- `created_by` (UUID, FK, nullable): User who created report
- `name` (String): Report name
- `description` (Text, nullable)
- `report_type` (Enum): REVENUE, APPOINTMENTS, CLIENTS, STAFF_PERFORMANCE, NO_SHOWS, etc.
- `parameters` (JSONB): Date ranges, filters, groupings
- `schedule` (String, nullable): Cron expression for automatic generation
- `recipients` (JSONB, nullable): Email addresses for scheduled reports
- `is_public` (Boolean, default false): Shareable with other users
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Relationships:**
- Belongs to: Tenant, Business (nullable), User (created_by)

**Indexes:**
- Primary key on `id`
- Index on `tenant_id`
- Index on `business_id, is_public`

---

### 2.38 Tag

Flexible tagging system for various entities.

**Attributes:**
- `id` (UUID, PK): Unique identifier
- `tenant_id` (UUID, FK, indexed): Reference to Tenant
- `name` (String): Tag name
- `color` (String, nullable): Display color (hex code)
- `entity_type` (Enum): CLIENT, APPOINTMENT, SERVICE, STAFF, etc.
- `created_at` (Timestamp)

**Relationships:**
- Belongs to: Tenant
- Has many through: EntityTag

**Indexes:**
- Primary key on `id`
- Unique index on `tenant_id, name, entity_type`

---

### 2.39 EntityTag

Junction table for tagging entities.

**Attributes:**
- `id` (UUID, PK): Unique identifier
- `tag_id` (UUID, FK, indexed): Reference to Tag
- `entity_type` (String): Entity table name
- `entity_id` (UUID): ID of tagged entity
- `created_at` (Timestamp)

**Relationships:**
- Belongs to: Tag

**Indexes:**
- Primary key on `id`
- Unique index on `tag_id, entity_type, entity_id`
- Index on `entity_type, entity_id`

---

### 2.40 Note

Staff notes about clients or appointments.

**Attributes:**
- `id` (UUID, PK): Unique identifier
- `tenant_id` (UUID, FK, indexed): Reference to Tenant
- `author_id` (UUID, FK, indexed): User who wrote note
- `entity_type` (Enum): CLIENT, APPOINTMENT, STAFF
- `entity_id` (UUID, indexed): ID of related entity
- `content` (Text): Note content
- `is_pinned` (Boolean, default false): Pin to top
- `is_private` (Boolean, default false): Visible only to author
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Relationships:**
- Belongs to: Tenant, User (author)

**Indexes:**
- Primary key on `id`
- Index on `tenant_id`
- Index on `entity_type, entity_id`
- Index on `author_id`

---

## 3. AI/ML Domain Extensions

These entities support the AI-Powered Smart Scheduling USP.

### 3.1 PredictionModel

Tracks ML model versions and metadata.

**Attributes:**
- `id` (UUID, PK): Unique identifier
- `tenant_id` (UUID, FK, indexed, nullable): Null for global models
- `model_type` (Enum): NO_SHOW_PREDICTOR, DURATION_PREDICTOR, DEMAND_FORECASTER, UPSELL_RECOMMENDER
- `model_version` (String): Semantic version (e.g., "1.2.3")
- `algorithm` (String): logistic_regression, random_forest, neural_network, etc.
- `training_data_start` (Date): Training period start
- `training_data_end` (Date): Training period end
- `training_sample_count` (Integer): Number of samples used
- `metrics` (JSONB): Accuracy, precision, recall, F1, etc.
- `hyperparameters` (JSONB): Model configuration
- `artifact_url` (String): Cloud storage URL for model file
- `is_active` (Boolean): Currently deployed model
- `trained_at` (Timestamp)
- `created_at` (Timestamp)

**Relationships:**
- Belongs to: Tenant (nullable for global models)
- Has many: Prediction

**Indexes:**
- Primary key on `id`
- Index on `tenant_id, model_type, is_active`

**Metrics JSONB Schema Example:**
```
{
  "accuracy": 0.87,
  "precision": 0.85,
  "recall": 0.82,
  "f1_score": 0.835,
  "auc_roc": 0.91
}
```

---

### 3.2 Prediction

Stores predictions made by ML models.

**Attributes:**
- `id` (UUID, PK): Unique identifier
- `tenant_id` (UUID, FK, indexed): Reference to Tenant
- `model_id` (UUID, FK, indexed): Reference to PredictionModel
- `entity_type` (Enum): APPOINTMENT
- `entity_id` (UUID, indexed): ID of predicted entity
- `prediction_type` (Enum): NO_SHOW_PROBABILITY, ACTUAL_DURATION, UPSELL_SUGGESTION
- `predicted_value` (JSONB): Prediction output (probability, duration, list of service IDs)
- `confidence_score` (Decimal, nullable): 0-1 confidence level
- `features_used` (JSONB, nullable): Input features for explainability
- `actual_outcome` (JSONB, nullable): Ground truth for model evaluation
- `predicted_at` (Timestamp)
- `outcome_recorded_at` (Timestamp, nullable)
- `created_at` (Timestamp)

**Relationships:**
- Belongs to: Tenant, PredictionModel

**Indexes:**
- Primary key on `id`
- Index on `tenant_id, entity_type, entity_id`
- Index on `model_id, predicted_at`

**Predicted Value JSONB Schema Examples:**
```
// No-show prediction
{
  "no_show_probability": 0.32,
  "risk_level": "medium"
}

// Duration prediction
{
  "predicted_minutes": 47,
  "confidence_interval": [42, 52]
}

// Upsell suggestion
{
  "recommended_services": ["service-uuid-1", "service-uuid-2"],
  "expected_acceptance_rate": 0.45
}
```

---

### 3.3 FeatureStore

Stores computed features for ML models.

**Attributes:**
- `id` (UUID, PK): Unique identifier
- `tenant_id` (UUID, FK, indexed): Reference to Tenant
- `entity_type` (Enum): CLIENT, STAFF_MEMBER, SERVICE, APPOINTMENT
- `entity_id` (UUID, indexed): ID of entity
- `feature_set` (String): Feature group name (e.g., "client_behavior_v1")
- `features` (JSONB): Key-value pairs of computed features
- `computed_at` (Timestamp): When features were calculated
- `valid_until` (Timestamp): Feature expiration for caching
- `created_at` (Timestamp)

**Relationships:**
- Belongs to: Tenant

**Indexes:**
- Primary key on `id`
- Unique index on `tenant_id, entity_type, entity_id, feature_set`
- Index on `computed_at`

**Features JSONB Schema Example (Client):**
```
{
  "total_appointments": 23,
  "no_show_count": 2,
  "no_show_rate": 0.087,
  "avg_booking_lead_time_hours": 72,
  "last_appointment_days_ago": 15,
  "total_spent": 1250.00,
  "avg_appointment_value": 54.35,
  "preferred_day_of_week": 3,
  "preferred_time_of_day": "afternoon",
  "avg_rating_given": 4.8
}
```

---

## 4. Entity Relationship Summary

### Primary Relationships
- Tenant → Business (1:N)
- Business → Location (1:N)
- Location → StaffMember (1:N)
- Location → Appointment (1:N)
- StaffMember → Appointment (1:N)
- Service → Appointment (1:N)
- ClientProfile → Appointment (1:N)
- Appointment → Payment (1:1)
- User → ClientProfile (1:N, across businesses)
- User → StaffMember (1:1)

### Many-to-Many Relationships
- StaffMember ↔ Service (via StaffSkill)
- Location ↔ Service (via LocationService)
- Appointment ↔ ServiceAddon (via AppointmentAddon)
- Appointment ↔ Resource (via AppointmentResource)
- User ↔ Role (via UserRole with scope)
- Role ↔ Permission (via RolePermission)
- Tag ↔ Various Entities (via EntityTag)

### Recurring/Template Relationships
- Appointment → Appointment (via recurring_group_id for series)

### Audit/Tracking Relationships
- All entities → AuditLog (1:N)
- Appointment → Notification (1:N)

### AI/ML Relationships
- Tenant → PredictionModel (1:N)
- PredictionModel → Prediction (1:N)
- Various entities → FeatureStore (1:N)

## 5. Data Lifecycle & Retention

### Soft Deletes
Entities with `deleted_at` field support soft deletion for data recovery and audit purposes:
- Tenant, User, Business, Location, Service, StaffMember, ClientProfile, Appointment, Availability

### Hard Deletes
These entities are permanently deleted when removed:
- Sessions, temporary tokens, cache entries

### Data Retention Policies
- AuditLog: 7 years (configurable, compliance requirement)
- Appointment: 3 years after completion (configurable)
- Payment: 7 years (tax/legal requirement)
- Notification: 1 year
- FeatureStore: 90 days (recomputed as needed)
- Prediction: 2 years (for model evaluation)

### GDPR Compliance
When a user requests data deletion:
1. Soft delete User record
2. Anonymize ClientProfile (replace PII with "DELETED_USER")
3. Retain Appointment records with anonymized client reference (legal requirement)
4. Delete or anonymize Notification records
5. Retain Payment records with anonymized reference (financial/tax requirement)
6. Mark in AuditLog with erasure event
7. Remove from all marketing lists
8. Invalidate sessions and tokens

## 6. Indexing Strategy

### Critical Performance Indexes
- All foreign keys indexed
- Composite indexes for common queries:
  - `(tenant_id, status, created_at)` on most entities
  - `(location_id, staff_member_id, start_time, end_time)` on Appointment
  - `(client_id, status, start_time)` on Appointment
  - `(tenant_id, email)` on User
  - `(entity_type, entity_id)` on various junction tables

### Full-Text Search Indexes
- User: `(first_name, last_name, email)`
- ClientProfile: `(notes, tags)`
- Service: `(name, description, category)`
- Appointment: `(notes, internal_notes)`

### Spatial Indexes
- Location: `(latitude, longitude)` for proximity search

## 7. Security & Encryption

### Encrypted Fields
Fields containing sensitive data encrypted at rest:
- User.password_hash (hashed with salt)
- User.mfa_secret
- Integration.configuration
- Integration.oauth_access_token
- Integration.oauth_refresh_token
- Payment.gateway_payment_intent_id (depending on gateway requirements)

### Row-Level Security
Multi-tenant mode enforces tenant_id filtering at database level using PostgreSQL RLS policies.

### Personally Identifiable Information (PII)
PII fields requiring special handling:
- User: email, phone_number, first_name, last_name
- ClientProfile: date_of_birth, address fields
- Appointment: notes (may contain health information)
- Payment: all fields

## 8. Validation Rules Summary

### Common Validations
- All email fields: RFC 5322 format
- All phone_number fields: E.164 format
- All currency fields: ISO 4217 codes
- All country fields: ISO 3166-1 alpha-2 codes
- All language fields: ISO 639-1 codes
- All timezone fields: IANA timezone database names
- All URL fields: Valid HTTP/HTTPS URLs
- All UUID fields: Valid UUID v4 format

### Business Logic Validations
- Appointments cannot overlap for same staff member (enforced via optimistic locking)
- Appointments must fall within staff availability windows
- Appointments must respect service buffer times
- Appointments must be within business operating hours
- Payment amount_paid + amount_refunded <= amount
- Coupon usage_count <= usage_limit
- Gift card current_value <= initial_value
- Membership billing dates computed based on interval
- Recurring appointments must have valid RRULE

## 9. Event Sourcing Considerations

While not fully event-sourced, key entities emit domain events for async processing:

### Domain Events
- AppointmentCreated
- AppointmentConfirmed
- AppointmentCancelled
- AppointmentCompleted
- AppointmentNoShow
- PaymentCaptured
- PaymentRefunded
- ClientRegistered
- MembershipEnrolled
- NotificationScheduled

Events are published to message queue for consumption by:
- Notification Service
- Analytics Service
- AI/ML Service (feature computation)
- Integration Service (calendar sync, webhooks)
- Audit Service

## 10. Scalability Patterns

### Database Sharding
Multi-tenant mode supports tenant-based sharding:
- Shard key: tenant_id
- Each shard contains complete data for subset of tenants
- Coordinating service routes queries to correct shard

### Read Replicas
- Reporting and analytics queries routed to read replicas
- Eventually consistent (acceptable for dashboards)
- Primary database for transactional operations

### Caching Strategy
Cached entities and TTL:
- Tenant settings: 1 hour
- Business/Location data: 15 minutes
- Service catalog: 15 minutes
- Staff availability (computed): 5 minutes
- Appointment data: No caching (real-time consistency required)
- User sessions: 24 hours

### Partitioning
Time-series data partitioned by date:
- AuditLog: Monthly partitions
- Notification: Monthly partitions
- Appointment: Quarterly partitions (older data archived)
- Payment: Yearly partitions

---

**End of Domain Model**
