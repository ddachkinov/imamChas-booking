import { AppDataSource } from './data-source';

async function runMigrations() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();

    console.log('Running migrations...');
    const migrations = await AppDataSource.runMigrations();

    console.log(`Successfully ran ${migrations.length} migrations`);
    migrations.forEach(migration => {
      console.log(`  - ${migration.name}`);
    });

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

runMigrations();
