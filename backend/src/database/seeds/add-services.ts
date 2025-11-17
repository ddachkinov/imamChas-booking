import { AppDataSource } from '../data-source';
import { Tenant } from '../../modules/tenants/entities/tenant.entity';
import { User } from '../../modules/users/entities/user.entity';
import { Role } from '../../modules/users/entities/role.entity';
import { UserRole } from '../../modules/users/entities/user-role.entity';
import { Business } from '../../modules/businesses/entities/business.entity';
import { StaffMember, StaffStatus } from '../../modules/staff/entities/staff-member.entity';
import { Service } from '../../modules/services/entities/service.entity';
import * as argon2 from 'argon2';

async function addServices() {
  console.log('🌱 Adding services and staff to existing tenant...');

  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    const tenantRepo = AppDataSource.getRepository(Tenant);
    const userRepo = AppDataSource.getRepository(User);
    const roleRepo = AppDataSource.getRepository(Role);
    const userRoleRepo = AppDataSource.getRepository(UserRole);
    const businessRepo = AppDataSource.getRepository(Business);
    const staffMemberRepo = AppDataSource.getRepository(StaffMember);
    const serviceRepo = AppDataSource.getRepository(Service);

    // Get existing tenant
    console.log('📝 Finding existing tenant...');
    const tenant = await tenantRepo.findOne({ where: { slug: 'demo' } });
    if (!tenant) {
      throw new Error('Demo tenant not found. Please run the seed script first.');
    }
    console.log(`✅ Found tenant: ${tenant.name}`);

    // Get existing business
    console.log('📝 Finding existing business...');
    const business = await businessRepo.findOne({ where: { tenant_id: tenant.id } });
    if (!business) {
      throw new Error('Business not found for demo tenant');
    }
    console.log(`✅ Found business: ${business.name}`);

    // Get existing admin staff member
    console.log('📝 Finding existing staff member...');
    const adminStaffMember = await staffMemberRepo.findOne({
      where: { business_id: business.id },
      order: { created_at: 'ASC' }
    });
    if (!adminStaffMember) {
      throw new Error('Admin staff member not found');
    }
    console.log('✅ Found admin staff member');

    // Check if services already exist
    const existingServicesCount = await serviceRepo.count({ where: { business_id: business.id } });
    if (existingServicesCount > 0) {
      console.log(`⚠️  Services already exist (${existingServicesCount} found). Skipping service creation...`);
      await AppDataSource.destroy();
      return;
    }

    // Get Staff role
    const staffRole = await roleRepo.findOne({
      where: { tenant_id: tenant.id, name: 'Staff' }
    });
    if (!staffRole) {
      throw new Error('Staff role not found');
    }

    console.log('📝 Creating additional staff members...');

    const staffUser1 = await userRepo.save({
      tenant_id: tenant.id,
      email: 'sarah.johnson@demo.ic-booking.groundpoint.net',
      password_hash: await argon2.hash('Staff123!', {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
      }),
      first_name: 'Sarah',
      last_name: 'Johnson',
      email_verified: true,
      is_active: true,
      locale: 'en',
      timezone: 'UTC',
    });

    await userRoleRepo.save({
      user_id: staffUser1.id,
      role_id: staffRole.id,
    });

    const staffMember1 = await staffMemberRepo.save({
      tenant_id: tenant.id,
      user_id: staffUser1.id,
      business_id: business.id,
      title: 'Senior Therapist',
      status: StaffStatus.ACTIVE,
      accepts_online_bookings: true,
    });

    const staffUser2 = await userRepo.save({
      tenant_id: tenant.id,
      email: 'michael.chen@demo.ic-booking.groundpoint.net',
      password_hash: await argon2.hash('Staff123!', {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
      }),
      first_name: 'Michael',
      last_name: 'Chen',
      email_verified: true,
      is_active: true,
      locale: 'en',
      timezone: 'UTC',
    });

    await userRoleRepo.save({
      user_id: staffUser2.id,
      role_id: staffRole.id,
    });

    const staffMember2 = await staffMemberRepo.save({
      tenant_id: tenant.id,
      user_id: staffUser2.id,
      business_id: business.id,
      title: 'Massage Therapist',
      status: StaffStatus.ACTIVE,
      accepts_online_bookings: true,
    });

    console.log('✅ Created 2 additional staff members');

    console.log('📝 Creating demo services...');

    const service1 = await serviceRepo.save({
      tenant_id: tenant.id,
      business_id: business.id,
      name: 'Deep Tissue Massage',
      description: 'A therapeutic massage targeting muscle tension and knots. Ideal for chronic pain relief.',
      duration_minutes: 60,
      price: 89.99,
      is_active: true,
      accepts_online_bookings: true,
      buffer_time_minutes: 15,
      max_capacity: 1,
      is_group_service: false,
    });

    const service2 = await serviceRepo.save({
      tenant_id: tenant.id,
      business_id: business.id,
      name: 'Swedish Massage',
      description: 'A relaxing full-body massage using gentle, flowing strokes to promote relaxation.',
      duration_minutes: 60,
      price: 79.99,
      is_active: true,
      accepts_online_bookings: true,
      buffer_time_minutes: 15,
      max_capacity: 1,
      is_group_service: false,
    });

    const service3 = await serviceRepo.save({
      tenant_id: tenant.id,
      business_id: business.id,
      name: 'Hot Stone Therapy',
      description: 'Combines heated stones with massage techniques for deep relaxation and muscle relief.',
      duration_minutes: 90,
      price: 119.99,
      is_active: true,
      accepts_online_bookings: true,
      buffer_time_minutes: 20,
      max_capacity: 1,
      is_group_service: false,
    });

    const service4 = await serviceRepo.save({
      tenant_id: tenant.id,
      business_id: business.id,
      name: 'Aromatherapy Session',
      description: 'Gentle massage with essential oils tailored to your wellness needs.',
      duration_minutes: 45,
      price: 69.99,
      is_active: true,
      accepts_online_bookings: true,
      buffer_time_minutes: 10,
      max_capacity: 1,
      is_group_service: false,
    });

    const service5 = await serviceRepo.save({
      tenant_id: tenant.id,
      business_id: business.id,
      name: 'Couples Massage',
      description: 'Relaxing massage session for two people in the same room.',
      duration_minutes: 60,
      price: 149.99,
      is_active: true,
      accepts_online_bookings: true,
      buffer_time_minutes: 15,
      max_capacity: 2,
      is_group_service: true,
    });

    console.log('✅ Created 5 services');
    console.log('ℹ️  Note: Staff-service assignments should be configured via the admin UI or staff_skills table');

    console.log('');
    console.log('✅ ================================');
    console.log('✅ Services added successfully!');
    console.log('✅ ================================');
    console.log('');
    console.log('👥 Staff Login Credentials:');
    console.log(`   Email:    sarah.johnson@demo.ic-booking.groundpoint.net`);
    console.log(`   Password: Staff123!`);
    console.log(`   Email:    michael.chen@demo.ic-booking.groundpoint.net`);
    console.log(`   Password: Staff123!`);
    console.log('');
    console.log(`👤 Staff Members: 3 total`);
    console.log(`💼 Services Created: 5`);
    console.log('');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error adding services:', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

addServices();
