import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1699000000000 implements MigrationInterface {
    name = 'InitialSchema1699000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable UUID extension
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // Create tenants table
        await queryRunner.query(`
            CREATE TABLE "tenants" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "name" varchar NOT NULL,
                "slug" varchar NOT NULL UNIQUE,
                "subdomain" varchar NOT NULL UNIQUE,
                "status" varchar NOT NULL DEFAULT 'active',
                "subscription_tier" varchar NOT NULL DEFAULT 'starter',
                "subscription_status" varchar NOT NULL DEFAULT 'trial',
                "trial_ends_at" timestamp,
                "subscription_starts_at" timestamp,
                "subscription_ends_at" timestamp,
                "stripe_customer_id" varchar,
                "stripe_subscription_id" varchar,
                "settings" jsonb DEFAULT '{}',
                "created_at" timestamp NOT NULL DEFAULT now(),
                "updated_at" timestamp NOT NULL DEFAULT now()
            )
        `);

        // Create users table
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "tenant_id" uuid NOT NULL,
                "email" varchar NOT NULL,
                "password_hash" varchar,
                "first_name" varchar NOT NULL,
                "last_name" varchar NOT NULL,
                "phone" varchar,
                "avatar_url" varchar,
                "timezone" varchar DEFAULT 'UTC',
                "locale" varchar DEFAULT 'en',
                "email_verified" boolean DEFAULT false,
                "email_verified_at" timestamp,
                "last_login_at" timestamp,
                "is_active" boolean DEFAULT true,
                "created_at" timestamp NOT NULL DEFAULT now(),
                "updated_at" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_tenant_email" UNIQUE ("tenant_id", "email"),
                CONSTRAINT "FK_users_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_users_tenant_id" ON "users" ("tenant_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);

        // Create roles table
        await queryRunner.query(`
            CREATE TABLE "roles" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "tenant_id" uuid NOT NULL,
                "name" varchar NOT NULL,
                "description" text,
                "is_system_role" boolean DEFAULT false,
                "created_at" timestamp NOT NULL DEFAULT now(),
                "updated_at" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_tenant_role_name" UNIQUE ("tenant_id", "name"),
                CONSTRAINT "FK_roles_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
            )
        `);

        // Create permissions table
        await queryRunner.query(`
            CREATE TABLE "permissions" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "name" varchar NOT NULL UNIQUE,
                "description" text,
                "resource" varchar NOT NULL,
                "action" varchar NOT NULL,
                "created_at" timestamp NOT NULL DEFAULT now()
            )
        `);

        // Create role_permissions junction table
        await queryRunner.query(`
            CREATE TABLE "role_permissions" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "role_id" uuid NOT NULL,
                "permission_id" uuid NOT NULL,
                "created_at" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_role_permission" UNIQUE ("role_id", "permission_id"),
                CONSTRAINT "FK_role_permissions_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_role_permissions_permission" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE
            )
        `);

        // Create user_roles junction table
        await queryRunner.query(`
            CREATE TABLE "user_roles" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "role_id" uuid NOT NULL,
                "assigned_at" timestamp NOT NULL DEFAULT now(),
                "assigned_by" uuid,
                CONSTRAINT "UQ_user_role" UNIQUE ("user_id", "role_id"),
                CONSTRAINT "FK_user_roles_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_user_roles_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE
            )
        `);

        // Create businesses table
        await queryRunner.query(`
            CREATE TABLE "businesses" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "tenant_id" uuid NOT NULL,
                "name" varchar NOT NULL,
                "slug" varchar NOT NULL,
                "description" text,
                "logo_url" varchar,
                "cover_image_url" varchar,
                "phone" varchar,
                "email" varchar,
                "website" varchar,
                "timezone" varchar DEFAULT 'UTC',
                "currency" varchar DEFAULT 'USD',
                "accepts_online_bookings" boolean DEFAULT true,
                "requires_approval" boolean DEFAULT false,
                "cancellation_policy" text,
                "deposit_policy" jsonb,
                "settings" jsonb DEFAULT '{}',
                "created_at" timestamp NOT NULL DEFAULT now(),
                "updated_at" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_tenant_business_slug" UNIQUE ("tenant_id", "slug"),
                CONSTRAINT "FK_businesses_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
            )
        `);

        // Create locations table
        await queryRunner.query(`
            CREATE TABLE "locations" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "tenant_id" uuid NOT NULL,
                "business_id" uuid NOT NULL,
                "name" varchar NOT NULL,
                "address_line1" varchar NOT NULL,
                "address_line2" varchar,
                "city" varchar NOT NULL,
                "state" varchar,
                "postal_code" varchar NOT NULL,
                "country" varchar NOT NULL DEFAULT 'US',
                "latitude" decimal(10, 8),
                "longitude" decimal(11, 8),
                "phone" varchar,
                "email" varchar,
                "timezone" varchar DEFAULT 'UTC',
                "is_primary" boolean DEFAULT false,
                "status" varchar DEFAULT 'active',
                "operating_hours" jsonb,
                "created_at" timestamp NOT NULL DEFAULT now(),
                "updated_at" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "FK_locations_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_locations_business" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_locations_tenant_id" ON "locations" ("tenant_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_locations_business_id" ON "locations" ("business_id")`);

        // Create services table
        await queryRunner.query(`
            CREATE TABLE "services" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "tenant_id" uuid NOT NULL,
                "business_id" uuid NOT NULL,
                "name" varchar NOT NULL,
                "description" text,
                "category" varchar,
                "duration_minutes" integer NOT NULL,
                "buffer_before_minutes" integer DEFAULT 0,
                "buffer_after_minutes" integer DEFAULT 0,
                "price" decimal(10, 2) NOT NULL,
                "deposit_amount" decimal(10, 2),
                "max_capacity" integer DEFAULT 1,
                "is_group_service" boolean DEFAULT false,
                "requires_approval" boolean DEFAULT false,
                "accepts_online_bookings" boolean DEFAULT true,
                "is_active" boolean DEFAULT true,
                "image_url" varchar,
                "created_at" timestamp NOT NULL DEFAULT now(),
                "updated_at" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "FK_services_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_services_business" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_services_tenant_id" ON "services" ("tenant_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_services_business_id" ON "services" ("business_id")`);

        // Create service_addons table
        await queryRunner.query(`
            CREATE TABLE "service_addons" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "tenant_id" uuid NOT NULL,
                "service_id" uuid NOT NULL,
                "name" varchar NOT NULL,
                "description" text,
                "additional_price" decimal(10, 2) NOT NULL,
                "additional_duration_minutes" integer DEFAULT 0,
                "is_active" boolean DEFAULT true,
                "display_order" integer DEFAULT 0,
                "created_at" timestamp NOT NULL DEFAULT now(),
                "updated_at" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "FK_service_addons_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_service_addons_service" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE
            )
        `);

        // Create location_services junction table
        await queryRunner.query(`
            CREATE TABLE "location_services" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "tenant_id" uuid NOT NULL,
                "location_id" uuid NOT NULL,
                "service_id" uuid NOT NULL,
                "is_available" boolean DEFAULT true,
                "created_at" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_location_service" UNIQUE ("location_id", "service_id"),
                CONSTRAINT "FK_location_services_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_location_services_location" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_location_services_service" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE
            )
        `);

        // Create staff_members table
        await queryRunner.query(`
            CREATE TABLE "staff_members" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "tenant_id" uuid NOT NULL,
                "user_id" uuid NOT NULL,
                "business_id" uuid NOT NULL,
                "location_id" uuid,
                "display_name" varchar NOT NULL,
                "title" varchar,
                "bio" text,
                "profile_image_url" varchar,
                "phone" varchar,
                "email" varchar,
                "accepts_online_bookings" boolean DEFAULT true,
                "status" varchar DEFAULT 'active',
                "default_buffer_before_minutes" integer DEFAULT 0,
                "default_buffer_after_minutes" integer DEFAULT 0,
                "created_at" timestamp NOT NULL DEFAULT now(),
                "updated_at" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "FK_staff_members_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_staff_members_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_staff_members_business" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_staff_members_location" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_staff_members_tenant_id" ON "staff_members" ("tenant_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_staff_members_business_id" ON "staff_members" ("business_id")`);

        // Create staff_skills junction table
        await queryRunner.query(`
            CREATE TABLE "staff_skills" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "tenant_id" uuid NOT NULL,
                "staff_member_id" uuid NOT NULL,
                "service_id" uuid NOT NULL,
                "proficiency_level" integer DEFAULT 5,
                "created_at" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_staff_skill" UNIQUE ("staff_member_id", "service_id"),
                CONSTRAINT "FK_staff_skills_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_staff_skills_staff" FOREIGN KEY ("staff_member_id") REFERENCES "staff_members"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_staff_skills_service" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE
            )
        `);

        // Create staff_availability table
        await queryRunner.query(`
            CREATE TABLE "staff_availability" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "tenant_id" uuid NOT NULL,
                "staff_member_id" uuid NOT NULL,
                "day_of_week" integer NOT NULL,
                "start_time" time NOT NULL,
                "end_time" time NOT NULL,
                "is_available" boolean DEFAULT true,
                "created_at" timestamp NOT NULL DEFAULT now(),
                "updated_at" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "FK_staff_availability_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_staff_availability_staff" FOREIGN KEY ("staff_member_id") REFERENCES "staff_members"("id") ON DELETE CASCADE
            )
        `);

        // Create client_profiles table
        await queryRunner.query(`
            CREATE TABLE "client_profiles" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "tenant_id" uuid NOT NULL,
                "user_id" uuid,
                "business_id" uuid NOT NULL,
                "first_name" varchar NOT NULL,
                "last_name" varchar NOT NULL,
                "email" varchar NOT NULL,
                "phone" varchar,
                "date_of_birth" date,
                "address_line1" varchar,
                "address_line2" varchar,
                "city" varchar,
                "state" varchar,
                "postal_code" varchar,
                "country" varchar,
                "notes" text,
                "preferences" jsonb DEFAULT '{}',
                "marketing_consent" boolean DEFAULT false,
                "total_bookings" integer DEFAULT 0,
                "total_spent" decimal(10, 2) DEFAULT 0,
                "lifetime_value" decimal(10, 2) DEFAULT 0,
                "last_appointment_date" timestamp,
                "created_at" timestamp NOT NULL DEFAULT now(),
                "updated_at" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_tenant_business_client_email" UNIQUE ("tenant_id", "business_id", "email"),
                CONSTRAINT "FK_client_profiles_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_client_profiles_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL,
                CONSTRAINT "FK_client_profiles_business" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_client_profiles_tenant_id" ON "client_profiles" ("tenant_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_client_profiles_business_id" ON "client_profiles" ("business_id")`);

        // Create appointments table
        await queryRunner.query(`
            CREATE TABLE "appointments" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "tenant_id" uuid NOT NULL,
                "business_id" uuid NOT NULL,
                "location_id" uuid NOT NULL,
                "client_id" uuid NOT NULL,
                "staff_member_id" uuid NOT NULL,
                "service_id" uuid NOT NULL,
                "appointment_number" varchar NOT NULL,
                "start_time" timestamp NOT NULL,
                "end_time" timestamp NOT NULL,
                "timezone" varchar NOT NULL DEFAULT 'UTC',
                "duration_minutes" integer NOT NULL,
                "buffer_before_minutes" integer DEFAULT 0,
                "buffer_after_minutes" integer DEFAULT 0,
                "status" varchar NOT NULL DEFAULT 'confirmed',
                "is_group_booking" boolean DEFAULT false,
                "group_size" integer DEFAULT 1,
                "notes" text,
                "internal_notes" text,
                "cancellation_reason" varchar,
                "cancelled_at" timestamp,
                "cancelled_by" uuid,
                "check_in_time" timestamp,
                "completion_time" timestamp,
                "created_at" timestamp NOT NULL DEFAULT now(),
                "updated_at" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_tenant_appointment_number" UNIQUE ("tenant_id", "appointment_number"),
                CONSTRAINT "FK_appointments_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_appointments_business" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_appointments_location" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_appointments_client" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_appointments_staff" FOREIGN KEY ("staff_member_id") REFERENCES "staff_members"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_appointments_service" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_appointments_tenant_id" ON "appointments" ("tenant_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_appointments_start_time" ON "appointments" ("start_time")`);
        await queryRunner.query(`CREATE INDEX "IDX_appointments_staff_member_id" ON "appointments" ("staff_member_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_appointments_status" ON "appointments" ("status")`);

        // Create appointment_addons table
        await queryRunner.query(`
            CREATE TABLE "appointment_addons" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "tenant_id" uuid NOT NULL,
                "appointment_id" uuid NOT NULL,
                "service_addon_id" uuid NOT NULL,
                "price" decimal(10, 2) NOT NULL,
                "created_at" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "FK_appointment_addons_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_appointment_addons_appointment" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_appointment_addons_addon" FOREIGN KEY ("service_addon_id") REFERENCES "service_addons"("id") ON DELETE CASCADE
            )
        `);

        // Create blocked_times table
        await queryRunner.query(`
            CREATE TABLE "blocked_times" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "tenant_id" uuid NOT NULL,
                "staff_member_id" uuid NOT NULL,
                "start_time" timestamp NOT NULL,
                "end_time" timestamp NOT NULL,
                "reason" varchar,
                "is_recurring" boolean DEFAULT false,
                "recurrence_rule" jsonb,
                "created_by" uuid,
                "created_at" timestamp NOT NULL DEFAULT now(),
                "updated_at" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "FK_blocked_times_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_blocked_times_staff" FOREIGN KEY ("staff_member_id") REFERENCES "staff_members"("id") ON DELETE CASCADE
            )
        `);

        // Create notifications table
        await queryRunner.query(`
            CREATE TABLE "notifications" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "tenant_id" uuid NOT NULL,
                "user_id" uuid NOT NULL,
                "type" varchar NOT NULL,
                "title" varchar NOT NULL,
                "message" text NOT NULL,
                "data" jsonb,
                "read" boolean DEFAULT false,
                "read_at" timestamp,
                "sent_via_email" boolean DEFAULT false,
                "sent_via_sms" boolean DEFAULT false,
                "created_at" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "FK_notifications_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_notifications_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_notifications_user_id" ON "notifications" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_notifications_read" ON "notifications" ("read")`);

        // Create notification_templates table
        await queryRunner.query(`
            CREATE TABLE "notification_templates" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "tenant_id" uuid NOT NULL,
                "name" varchar NOT NULL,
                "type" varchar NOT NULL,
                "channel" varchar NOT NULL,
                "subject" varchar,
                "body_template" text NOT NULL,
                "variables" jsonb,
                "is_active" boolean DEFAULT true,
                "created_at" timestamp NOT NULL DEFAULT now(),
                "updated_at" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_tenant_template_name_type" UNIQUE ("tenant_id", "name", "type"),
                CONSTRAINT "FK_notification_templates_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
            )
        `);

        // Create email_verification_tokens table
        await queryRunner.query(`
            CREATE TABLE "email_verification_tokens" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "token" varchar NOT NULL UNIQUE,
                "expires_at" timestamp NOT NULL,
                "used_at" timestamp,
                "created_at" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "FK_email_verification_tokens_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_email_verification_tokens_token" ON "email_verification_tokens" ("token")`);

        // Create password_reset_tokens table
        await queryRunner.query(`
            CREATE TABLE "password_reset_tokens" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "token" varchar NOT NULL UNIQUE,
                "expires_at" timestamp NOT NULL,
                "used_at" timestamp,
                "created_at" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "FK_password_reset_tokens_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_password_reset_tokens_token" ON "password_reset_tokens" ("token")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop tables in reverse order
        await queryRunner.query(`DROP TABLE "password_reset_tokens"`);
        await queryRunner.query(`DROP TABLE "email_verification_tokens"`);
        await queryRunner.query(`DROP TABLE "notification_templates"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TABLE "blocked_times"`);
        await queryRunner.query(`DROP TABLE "appointment_addons"`);
        await queryRunner.query(`DROP TABLE "appointments"`);
        await queryRunner.query(`DROP TABLE "client_profiles"`);
        await queryRunner.query(`DROP TABLE "staff_availability"`);
        await queryRunner.query(`DROP TABLE "staff_skills"`);
        await queryRunner.query(`DROP TABLE "staff_members"`);
        await queryRunner.query(`DROP TABLE "location_services"`);
        await queryRunner.query(`DROP TABLE "service_addons"`);
        await queryRunner.query(`DROP TABLE "services"`);
        await queryRunner.query(`DROP TABLE "locations"`);
        await queryRunner.query(`DROP TABLE "businesses"`);
        await queryRunner.query(`DROP TABLE "user_roles"`);
        await queryRunner.query(`DROP TABLE "role_permissions"`);
        await queryRunner.query(`DROP TABLE "permissions"`);
        await queryRunner.query(`DROP TABLE "roles"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "tenants"`);
    }
}
