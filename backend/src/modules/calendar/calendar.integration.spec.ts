import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';

/**
 * Calendar Integration Tests
 *
 * Tests all calendar endpoints to ensure they return the correct data structure
 * and handle errors properly.
 */
describe('Calendar API (Integration)', () => {
  let app: INestApplication;
  let authToken: string;
  let tenantId: string;
  let businessId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login to get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: process.env.TEST_USER_EMAIL || 'admin@demo.ic-booking.groundpoint.net',
        password: process.env.TEST_USER_PASSWORD || 'Admin123!',
      })
      .expect(200);

    authToken = loginResponse.body.access_token;
    tenantId = loginResponse.body.user.tenant_id;
    businessId = loginResponse.body.user.business_id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/calendar', () => {
    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .get('/api/calendar')
        .query({
          business_id: businessId,
          view: 'week',
          start_date: '2025-11-16',
          end_date: '2025-11-22',
        })
        .expect(401);
    });

    it('should return 400 with invalid view type', () => {
      return request(app.getHttpServer())
        .get('/api/calendar')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenantId)
        .query({
          business_id: businessId,
          view: 'invalid',
          start_date: '2025-11-16',
          end_date: '2025-11-22',
        })
        .expect(400);
    });

    it('should return 400 with missing required parameters', () => {
      return request(app.getHttpServer())
        .get('/api/calendar')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenantId)
        .query({
          view: 'week',
        })
        .expect(400);
    });

    it('should return week view with correct data structure', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/calendar')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenantId)
        .query({
          business_id: businessId,
          view: 'week',
          start_date: '2025-11-16',
          end_date: '2025-11-22',
        })
        .expect(200);

      // Verify response structure
      expect(response.body).toHaveProperty('start_date');
      expect(response.body).toHaveProperty('end_date');
      expect(response.body).toHaveProperty('timezone');
      expect(response.body).toHaveProperty('days');
      expect(response.body).toHaveProperty('appointments'); // Flat array
      expect(response.body).toHaveProperty('blocked_times'); // Flat array
      expect(response.body).toHaveProperty('staff_members');

      // Verify days structure
      expect(Array.isArray(response.body.days)).toBe(true);
      expect(response.body.days.length).toBe(7);

      response.body.days.forEach((day: any) => {
        expect(day).toHaveProperty('date');
        expect(day).toHaveProperty('day_name');
        expect(day).toHaveProperty('is_today');
        expect(day).toHaveProperty('appointment_count');
        expect(day).toHaveProperty('appointments');
        expect(day).toHaveProperty('business_hours');
      });

      // Verify flat arrays are present
      expect(Array.isArray(response.body.appointments)).toBe(true);
      expect(Array.isArray(response.body.blocked_times)).toBe(true);
      expect(Array.isArray(response.body.staff_members)).toBe(true);
    });

    it('should return day view with correct data structure', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/calendar')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenantId)
        .query({
          business_id: businessId,
          view: 'day',
          start_date: '2025-11-17',
          end_date: '2025-11-17',
        })
        .expect(200);

      expect(response.body).toHaveProperty('date');
      expect(response.body).toHaveProperty('timezone');
      expect(response.body).toHaveProperty('business_hours');
      expect(response.body).toHaveProperty('time_slots');
      expect(response.body).toHaveProperty('appointments');
      expect(response.body).toHaveProperty('blocked_times');
    });

    it('should return month view with correct data structure', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/calendar')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenantId)
        .query({
          business_id: businessId,
          view: 'month',
          start_date: '2025-11-01',
          end_date: '2025-11-30',
        })
        .expect(200);

      expect(response.body).toHaveProperty('year');
      expect(response.body).toHaveProperty('month');
      expect(response.body).toHaveProperty('timezone');
      expect(response.body).toHaveProperty('weeks');
      expect(response.body).toHaveProperty('appointment_counts');
      expect(response.body).toHaveProperty('summary');
    });
  });

  describe('GET /api/calendar/week', () => {
    it('should return week view', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/calendar/week')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenantId)
        .query({
          business_id: businessId,
          start_date: '2025-11-16',
          end_date: '2025-11-22',
        })
        .expect(200);

      expect(response.body).toHaveProperty('days');
      expect(response.body.days.length).toBe(7);
    });
  });

  describe('POST /api/calendar/blocked-time', () => {
    it('should create blocked time', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/calendar/blocked-time')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenantId)
        .send({
          staff_member_id: 'valid-staff-id', // Replace with actual ID
          start_time: '2025-11-20T10:00:00Z',
          end_time: '2025-11-20T11:00:00Z',
          reason: 'Lunch break',
          is_recurring: false,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('reason', 'Lunch break');
    });
  });

  describe('GET /api/calendar/schedule/summary', () => {
    it('should return schedule summary for staff member', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/calendar/schedule/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenantId)
        .query({
          staff_member_id: 'valid-staff-id', // Replace with actual ID
          date: '2025-11-17',
        })
        .expect(200);

      expect(response.body).toHaveProperty('date');
      expect(response.body).toHaveProperty('hours_worked');
      expect(response.body).toHaveProperty('appointments_count');
      expect(response.body).toHaveProperty('total_revenue');
      expect(response.body).toHaveProperty('utilization_percent');
    });
  });
});
