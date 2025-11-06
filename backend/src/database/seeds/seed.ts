import { AppDataSource } from '../data-source';

async function seed() {
  console.log('🌱 Starting database seeding...');

  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    // TODO: Add seed data here
    console.log('📝 Seed data will be added in future tasks');

    await AppDataSource.destroy();
    console.log('✅ Seeding completed successfully');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

seed();
