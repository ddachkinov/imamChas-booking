import { Test } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConfigModule } from '@nestjs/config';

// Import all entities
import { Service } from '../modules/services/entities/service.entity';
import { Appointment } from '../modules/appointments/entities/appointment.entity';
import { ClientProfile } from '../modules/clients/entities/client-profile.entity';
import { StaffMember } from '../modules/staff/entities/staff-member.entity';
import { Business } from '../modules/businesses/entities/business.entity';
import { Location } from '../modules/locations/entities/location.entity';

/**
 * Schema Validation Tests
 *
 * These tests ensure that TypeORM entities match the actual database schema.
 * This prevents runtime errors caused by schema mismatches.
 */
describe('Schema Validation', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT) || 5432,
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_DATABASE,
          entities: [__dirname + '/../**/*.entity.{ts,js}'],
          synchronize: false, // Never synchronize in tests!
        }),
      ],
    }).compile();

    dataSource = module.get(DataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  /**
   * Helper function to get table columns from database
   */
  async function getTableColumns(tableName: string): Promise<Set<string>> {
    const query = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = $1
      AND table_schema = 'public'
    `;
    const result = await dataSource.query(query, [tableName]);
    return new Set(result.map((row) => row.column_name));
  }

  /**
   * Helper function to get entity columns from TypeORM metadata
   */
  function getEntityColumns(entityClass: any): Set<string> {
    const metadata = dataSource.getMetadata(entityClass);
    return new Set(metadata.columns.map((col) => col.databaseName));
  }

  describe('Service Entity', () => {
    it('should have all columns that exist in database', async () => {
      const dbColumns = await getTableColumns('services');
      const entityColumns = getEntityColumns(Service);

      const missingInEntity = Array.from(dbColumns).filter(
        (col) => !entityColumns.has(col)
      );

      expect(missingInEntity).toEqual([]);
    });

    it('should not have columns that do not exist in database', async () => {
      const dbColumns = await getTableColumns('services');
      const entityColumns = getEntityColumns(Service);

      const extraInEntity = Array.from(entityColumns).filter(
        (col) => !dbColumns.has(col)
      );

      expect(extraInEntity).toEqual([]);
    });
  });

  describe('Appointment Entity', () => {
    it('should have all columns that exist in database', async () => {
      const dbColumns = await getTableColumns('appointments');
      const entityColumns = getEntityColumns(Appointment);

      const missingInEntity = Array.from(dbColumns).filter(
        (col) => !entityColumns.has(col)
      );

      expect(missingInEntity).toEqual([]);
    });

    it('should not have columns that do not exist in database', async () => {
      const dbColumns = await getTableColumns('appointments');
      const entityColumns = getEntityColumns(Appointment);

      const extraInEntity = Array.from(entityColumns).filter(
        (col) => !dbColumns.has(col)
      );

      expect(extraInEntity).toEqual([]);
    });
  });

  describe('ClientProfile Entity', () => {
    it('should have all columns that exist in database', async () => {
      const dbColumns = await getTableColumns('client_profiles');
      const entityColumns = getEntityColumns(ClientProfile);

      const missingInEntity = Array.from(dbColumns).filter(
        (col) => !entityColumns.has(col)
      );

      expect(missingInEntity).toEqual([]);
    });

    it('should not have columns that do not exist in database', async () => {
      const dbColumns = await getTableColumns('client_profiles');
      const entityColumns = getEntityColumns(ClientProfile);

      const extraInEntity = Array.from(entityColumns).filter(
        (col) => !dbColumns.has(col)
      );

      expect(extraInEntity).toEqual([]);
    });
  });

  describe('StaffMember Entity', () => {
    it('should have all columns that exist in database', async () => {
      const dbColumns = await getTableColumns('staff_members');
      const entityColumns = getEntityColumns(StaffMember);

      const missingInEntity = Array.from(dbColumns).filter(
        (col) => !entityColumns.has(col)
      );

      expect(missingInEntity).toEqual([]);
    });

    it('should not have columns that do not exist in database', async () => {
      const dbColumns = await getTableColumns('staff_members');
      const entityColumns = getEntityColumns(StaffMember);

      const extraInEntity = Array.from(entityColumns).filter(
        (col) => !dbColumns.has(col)
      );

      expect(extraInEntity).toEqual([]);
    });
  });

  describe('Business Entity', () => {
    it('should have all columns that exist in database', async () => {
      const dbColumns = await getTableColumns('businesses');
      const entityColumns = getEntityColumns(Business);

      const missingInEntity = Array.from(dbColumns).filter(
        (col) => !entityColumns.has(col)
      );

      expect(missingInEntity).toEqual([]);
    });

    it('should not have columns that do not exist in database', async () => {
      const dbColumns = await getTableColumns('businesses');
      const entityColumns = getEntityColumns(Business);

      const extraInEntity = Array.from(entityColumns).filter(
        (col) => !dbColumns.has(col)
      );

      expect(extraInEntity).toEqual([]);
    });
  });

  describe('Location Entity', () => {
    it('should have all columns that exist in database', async () => {
      const dbColumns = await getTableColumns('locations');
      const entityColumns = getEntityColumns(Location);

      const missingInEntity = Array.from(dbColumns).filter(
        (col) => !entityColumns.has(col)
      );

      expect(missingInEntity).toEqual([]);
    });

    it('should not have columns that do not exist in database', async () => {
      const dbColumns = await getTableColumns('locations');
      const entityColumns = getEntityColumns(Location);

      const extraInEntity = Array.from(entityColumns).filter(
        (col) => !dbColumns.has(col)
      );

      expect(extraInEntity).toEqual([]);
    });
  });
});
