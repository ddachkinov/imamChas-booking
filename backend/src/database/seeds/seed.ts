import { AppDataSource } from '../data-source';
import { Tenant, SubscriptionTier, SubscriptionStatus } from '../../modules/tenants/entities/tenant.entity';
import { User, UserStatus } from '../../modules/users/entities/user.entity';
import { Role, RoleScope } from '../../modules/users/entities/role.entity';
import { Permission, PermissionScope } from '../../modules/users/entities/permission.entity';
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
      name: 'Demo Booking Platform',
      subscription_tier: SubscriptionTier.PROFESSIONAL,
      subscription_status: SubscriptionStatus.ACTIVE,
      subscription_starts_at: new Date(),
      feature_flags: {
        appointments: true,
        calendar_sync: true,
        payments: true,
        notifications: true,
        analytics: true,
      },
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
        scope: RoleScope.TENANT,
      },
      {
        tenant_id: tenant.id,
        name: 'Tenant Admin',
        description: 'Tenant administration',
        is_system_role: true,
        scope: RoleScope.TENANT,
      },
      {
        tenant_id: tenant.id,
        name: 'Business Owner',
        description: 'Business owner with full business access',
        is_system_role: true,
        scope: RoleScope.BUSINESS,
      },
      {
        tenant_id: tenant.id,
        name: 'Manager',
        description: 'Business manager with limited access',
        is_system_role: true,
        scope: RoleScope.BUSINESS,
      },
      {
        tenant_id: tenant.id,
        name: 'Staff',
        description: 'Staff member',
        is_system_role: true,
        scope: RoleScope.LOCATION,
      },
      {
        tenant_id: tenant.id,
        name: 'Client',
        description: 'End customer/client',
        is_system_role: true,
        scope: RoleScope.TENANT,
      },
    ]);
    console.log(`✅ Created ${roles.length} system roles`);

    console.log('📝 Creating system permissions...');
    const permissionData = [
      // User management
      { resource: 'user', action: 'create', scope: PermissionScope.TENANT, description: 'Create users' },
      { resource: 'user', action: 'read', scope: PermissionScope.TENANT, description: 'View users' },
      { resource: 'user', action: 'update', scope: PermissionScope.TENANT, description: 'Update users' },
      { resource: 'user', action: 'delete', scope: PermissionScope.TENANT, description: 'Delete users' },
      { resource: 'user', action: 'read', scope: PermissionScope.OWN, description: 'View own profile' },
      { resource: 'user', action: 'update', scope: PermissionScope.OWN, description: 'Update own profile' },

      // Business management
      { resource: 'business', action: 'create', scope: PermissionScope.TENANT, description: 'Create businesses' },
      { resource: 'business', action: 'read', scope: PermissionScope.TENANT, description: 'View businesses' },
      { resource: 'business', action: 'update', scope: PermissionScope.BUSINESS, description: 'Update business' },
      { resource: 'business', action: 'delete', scope: PermissionScope.BUSINESS, description: 'Delete business' },

      // Location management
      { resource: 'location', action: 'create', scope: PermissionScope.BUSINESS, description: 'Create locations' },
      { resource: 'location', action: 'read', scope: PermissionScope.BUSINESS, description: 'View locations' },
      { resource: 'location', action: 'update', scope: PermissionScope.LOCATION, description: 'Update location' },
      { resource: 'location', action: 'delete', scope: PermissionScope.LOCATION, description: 'Delete location' },

      // Service management
      { resource: 'service', action: 'create', scope: PermissionScope.BUSINESS, description: 'Create services' },
      { resource: 'service', action: 'read', scope: PermissionScope.BUSINESS, description: 'View services' },
      { resource: 'service', action: 'update', scope: PermissionScope.BUSINESS, description: 'Update services' },
      { resource: 'service', action: 'delete', scope: PermissionScope.BUSINESS, description: 'Delete services' },

      // Staff management
      { resource: 'staff', action: 'create', scope: PermissionScope.BUSINESS, description: 'Add staff' },
      { resource: 'staff', action: 'read', scope: PermissionScope.BUSINESS, description: 'View staff' },
      { resource: 'staff', action: 'update', scope: PermissionScope.BUSINESS, description: 'Update staff' },
      { resource: 'staff', action: 'delete', scope: PermissionScope.BUSINESS, description: 'Remove staff' },

      // Client management
      { resource: 'client', action: 'create', scope: PermissionScope.BUSINESS, description: 'Add clients' },
      { resource: 'client', action: 'read', scope: PermissionScope.BUSINESS, description: 'View clients' },
      { resource: 'client', action: 'update', scope: PermissionScope.BUSINESS, description: 'Update clients' },
      { resource: 'client', action: 'delete', scope: PermissionScope.BUSINESS, description: 'Delete clients' },

      // Appointment management
      { resource: 'appointment', action: 'create', scope: PermissionScope.BUSINESS, description: 'Book appointments' },
      { resource: 'appointment', action: 'read', scope: PermissionScope.BUSINESS, description: 'View appointments' },
      { resource: 'appointment', action: 'update', scope: PermissionScope.BUSINESS, description: 'Update appointments' },
      { resource: 'appointment', action: 'delete', scope: PermissionScope.BUSINESS, description: 'Cancel appointments' },
      { resource: 'appointment', action: 'read', scope: PermissionScope.OWN, description: 'View own appointments' },
      { resource: 'appointment', action: 'create', scope: PermissionScope.OWN, description: 'Book own appointments' },
      { resource: 'appointment', action: 'delete', scope: PermissionScope.OWN, description: 'Cancel own appointments' },

      // Calendar management
      { resource: 'calendar', action: 'read', scope: PermissionScope.BUSINESS, description: 'View calendar' },
      { resource: 'calendar', action: 'update', scope: PermissionScope.BUSINESS, description: 'Manage calendar' },

      // Payment management
      { resource: 'payment', action: 'create', scope: PermissionScope.BUSINESS, description: 'Process payments' },
      { resource: 'payment', action: 'read', scope: PermissionScope.BUSINESS, description: 'View payments' },
      { resource: 'payment', action: 'update', scope: PermissionScope.BUSINESS, description: 'Update payments' },

      // Analytics
      { resource: 'analytics', action: 'read', scope: PermissionScope.BUSINESS, description: 'View analytics' },

      // Settings
      { resource: 'settings', action: 'read', scope: PermissionScope.BUSINESS, description: 'View settings' },
      { resource: 'settings', action: 'update', scope: PermissionScope.BUSINESS, description: 'Update settings' },
    ];

    const permissions = await permissionRepo.save(
      permissionData.map(p => ({
        ...p,
        is_system_permission: true,
      })),
    );
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

    // Tenant Admin gets most permissions (excluding super admin specific ones)
    const tenantAdminRole = roles.find(r => r.name === 'Tenant Admin');
    const tenantAdminPermissions = permissions.filter(
      p => !['user:delete:tenant'].includes(`${p.resource}:${p.action}:${p.scope}`),
    );
    await rolePermissionRepo.save(
      tenantAdminPermissions.map(p => ({
        role_id: tenantAdminRole.id,
        permission_id: p.id,
      })),
    );

    // Business Owner gets business-scoped permissions
    const businessOwnerRole = roles.find(r => r.name === 'Business Owner');
    const businessOwnerPermissions = permissions.filter(
      p => p.scope === PermissionScope.BUSINESS || p.scope === PermissionScope.LOCATION,
    );
    await rolePermissionRepo.save(
      businessOwnerPermissions.map(p => ({
        role_id: businessOwnerRole.id,
        permission_id: p.id,
      })),
    );

    // Staff gets limited permissions
    const staffRole = roles.find(r => r.name === 'Staff');
    const staffPermissions = permissions.filter(
      p => p.resource === 'appointment' && (p.action === 'read' || p.action === 'create' || p.action === 'update') &&
           (p.scope === PermissionScope.LOCATION || p.scope === PermissionScope.BUSINESS) ||
           p.resource === 'calendar' && p.action === 'read' ||
           p.resource === 'client' && (p.action === 'read' || p.action === 'create'),
    );
    await rolePermissionRepo.save(
      staffPermissions.map(p => ({
        role_id: staffRole.id,
        permission_id: p.id,
      })),
    );

    // Client gets only own permissions
    const clientRole = roles.find(r => r.name === 'Client');
    const clientPermissions = permissions.filter(
      p => p.scope === PermissionScope.OWN,
    );
    await rolePermissionRepo.save(
      clientPermissions.map(p => ({
        role_id: clientRole.id,
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
      status: UserStatus.ACTIVE,
      language: 'en',
      timezone: 'UTC',
    });
    console.log(`✅ Created admin user: ${adminUser.email}`);

    console.log('📝 Assigning Super Admin role to admin user...');
    await userRoleRepo.save({
      user_id: adminUser.id,
      role_id: superAdminRole.id,
      scope_type: RoleScope.TENANT,
      scope_id: null,
      granted_by: adminUser.id,
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
