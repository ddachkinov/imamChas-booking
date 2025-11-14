import { AppDataSource } from '../data-source';
import { Tenant, SubscriptionTier, SubscriptionStatus } from '../../modules/tenants/entities/tenant.entity';
import { User } from '../../modules/users/entities/user.entity';
import { Role } from '../../modules/users/entities/role.entity';
import { Permission } from '../../modules/users/entities/permission.entity';
import { RolePermission } from '../../modules/users/entities/role-permission.entity';
import { UserRole } from '../../modules/users/entities/user-role.entity';
import * as argon2 from 'argon2';

async function seed() {
  console.log('🌱 Starting database seeding...');

  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    const tenantRepo = AppDataSource.getRepository(Tenant);
    const userRepo = AppDataSource.getRepository(User);
    const roleRepo = AppDataSource.getRepository(Role);
    const permissionRepo = AppDataSource.getRepository(Permission);
    const rolePermissionRepo = AppDataSource.getRepository(RolePermission);
    const userRoleRepo = AppDataSource.getRepository(UserRole);

    // Check if seed data already exists
    const existingTenant = await tenantRepo.findOne({ where: { slug: 'demo' } });
    if (existingTenant) {
      console.log('ℹ️  Seed data already exists. Skipping...');
      await AppDataSource.destroy();
      return;
    }

    console.log('📝 Creating demo tenant...');
    const tenant = await tenantRepo.save({
      slug: 'demo',
      subdomain: 'demo',
      name: 'Demo Booking Platform',
      subscription_tier: SubscriptionTier.PROFESSIONAL,
      subscription_status: SubscriptionStatus.ACTIVE,
      subscription_starts_at: new Date(),
      settings: {
        timezone: 'UTC',
        language: 'en',
        currency: 'USD',
      },
    });
    console.log(`✅ Created tenant: ${tenant.name} (${tenant.slug})`);

    console.log('📝 Creating system roles...');
    const roles = await roleRepo.save([
      {
        tenant_id: tenant.id,
        name: 'Super Admin',
        description: 'Full system access',
        is_system_role: true,
      },
      {
        tenant_id: tenant.id,
        name: 'Tenant Admin',
        description: 'Tenant administration',
        is_system_role: true,
      },
      {
        tenant_id: tenant.id,
        name: 'Business Owner',
        description: 'Business owner with full business access',
        is_system_role: true,
      },
      {
        tenant_id: tenant.id,
        name: 'Manager',
        description: 'Business manager with limited access',
        is_system_role: true,
      },
      {
        tenant_id: tenant.id,
        name: 'Staff',
        description: 'Staff member',
        is_system_role: true,
      },
      {
        tenant_id: tenant.id,
        name: 'Client',
        description: 'End customer/client',
        is_system_role: true,
      },
    ]);
    console.log(`✅ Created ${roles.length} system roles`);

    console.log('📝 Creating system permissions...');
    const permissionData = [
      // User management
      { name: 'user:create', resource: 'user', action: 'create', description: 'Create users' },
      { name: 'user:read', resource: 'user', action: 'read', description: 'View users' },
      { name: 'user:update', resource: 'user', action: 'update', description: 'Update users' },
      { name: 'user:delete', resource: 'user', action: 'delete', description: 'Delete users' },

      // Business management
      { name: 'business:create', resource: 'business', action: 'create', description: 'Create businesses' },
      { name: 'business:read', resource: 'business', action: 'read', description: 'View businesses' },
      { name: 'business:update', resource: 'business', action: 'update', description: 'Update business' },
      { name: 'business:delete', resource: 'business', action: 'delete', description: 'Delete business' },

      // Appointment management
      { name: 'appointment:create', resource: 'appointment', action: 'create', description: 'Book appointments' },
      { name: 'appointment:read', resource: 'appointment', action: 'read', description: 'View appointments' },
      { name: 'appointment:update', resource: 'appointment', action: 'update', description: 'Update appointments' },
      { name: 'appointment:delete', resource: 'appointment', action: 'delete', description: 'Cancel appointments' },

      // Payment management
      { name: 'payment:create', resource: 'payment', action: 'create', description: 'Process payments' },
      { name: 'payment:read', resource: 'payment', action: 'read', description: 'View payments' },
    ];

    const permissions = await permissionRepo.save(permissionData);
    console.log(`✅ Created ${permissions.length} system permissions`);

    console.log('📝 Assigning permissions to roles...');

    // Super Admin gets all permissions
    const superAdminRole = roles.find(r => r.name === 'Super Admin');
    await rolePermissionRepo.save(
      permissions.map(p => ({
        role_id: superAdminRole.id,
        permission_id: p.id,
      })),
    );

    // Tenant Admin gets most permissions
    const tenantAdminRole = roles.find(r => r.name === 'Tenant Admin');
    await rolePermissionRepo.save(
      permissions.map(p => ({
        role_id: tenantAdminRole.id,
        permission_id: p.id,
      })),
    );

    console.log('✅ Assigned permissions to roles');

    console.log('📝 Creating admin user...');
    const passwordHash = await argon2.hash('Admin123!', {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const adminUser = await userRepo.save({
      tenant_id: tenant.id,
      email: 'admin@demo.ic-booking.groundpoint.net',
      password_hash: passwordHash,
      first_name: 'Demo',
      last_name: 'Admin',
      email_verified: true,
      is_active: true,
      locale: 'en',
      timezone: 'UTC',
    });
    console.log(`✅ Created admin user: ${adminUser.email}`);

    console.log('📝 Assigning Super Admin role to admin user...');
    await userRoleRepo.save({
      user_id: adminUser.id,
      role_id: superAdminRole.id,
    });
    console.log('✅ Assigned Super Admin role');

    console.log('');
    console.log('✅ ================================');
    console.log('✅ Seeding completed successfully!');
    console.log('✅ ================================');
    console.log('');
    console.log('📧 Admin Login Credentials:');
    console.log(`   Email:    admin@demo.ic-booking.groundpoint.net`);
    console.log(`   Password: Admin123!`);
    console.log('');
    console.log(`🏢 Default Tenant: ${tenant.name} (${tenant.slug})`);
    console.log(`👥 Roles Created: ${roles.length}`);
    console.log(`🔐 Permissions Created: ${permissions.length}`);
    console.log('');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

seed();
