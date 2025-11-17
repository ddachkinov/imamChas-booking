import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * End-to-End Calendar Tests
 *
 * These tests simulate real user workflows through the calendar system.
 */
describe('Calendar E2E Tests', () => {
  let app: INestApplication;
  let authToken: string;
  let tenantId: string;
  let businessId: string;
  let staffMemberId: string;
  let serviceId: string;
  let clientId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'admin@demo.ic-booking.groundpoint.net',
        password: 'Admin123!',
      })
      .expect(200);

    authToken = loginResponse.body.access_token;
    tenantId = loginResponse.body.user.tenant_id;
    businessId = loginResponse.body.user.business_id;

    // Get first staff member
    const staffResponse = await request(app.getHttpServer())
      .get('/api/staff')
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-Tenant-ID', tenantId)
      .query({ business_id: businessId })
      .expect(200);

    staffMemberId = staffResponse.body[0]?.id;

    // Get first service
    const servicesResponse = await request(app.getHttpServer())
      .get('/api/services')
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-Tenant-ID', tenantId)
      .query({ business_id: businessId })
      .expect(200);

    serviceId = servicesResponse.body[0]?.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Complete Booking Workflow', () => {
    let appointmentId: string;

    it('Step 1: User views calendar week view', async () => {
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

      expect(response.body.appointments).toBeDefined();
      expect(Array.isArray(response.body.appointments)).toBe(true);
    });

    it('Step 2: User checks availability for service', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/appointments/availability')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenantId)
        .query({
          service_id: serviceId,
          staff_member_id: staffMemberId,
          date: '2025-11-20',
        })
        .expect(200);

      expect(response.body).toHaveProperty('available_slots');
      expect(Array.isArray(response.body.available_slots)).toBe(true);
    });

    it('Step 3: User creates new appointment', async () => {
      // First create a client if needed
      const clientResponse = await request(app.getHttpServer())
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenantId)
        .send({
          business_id: businessId,
          first_name: 'Test',
          last_name: 'Client',
          email: 'test.client@example.com',
          phone: '+1234567890',
        })
        .expect(201);

      clientId = clientResponse.body.id;

      // Create appointment
      const response = await request(app.getHttpServer())
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenantId)
        .send({
          business_id: businessId,
          location_id: businessId, // Using business_id as location for demo
          client_id: clientId,
          staff_member_id: staffMemberId,
          service_id: serviceId,
          start_time: '2025-11-20T14:00:00Z',
          notes: 'E2E test appointment',
        })
        .expect(201);

      appointmentId = response.body.id;
      expect(response.body).toHaveProperty('appointment_number');
      expect(response.body.status).toBe('scheduled');
    });

    it('Step 4: User views calendar and sees new appointment', async () => {
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

      const appointment = response.body.appointments.find(
        (apt: any) => apt.id === appointmentId
      );

      expect(appointment).toBeDefined();
      expect(appointment.client_name).toContain('Test Client');
    });

    it('Step 5: User checks in the appointment', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/appointments/${appointmentId}/check-in`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenantId)
        .expect(200);

      expect(response.body.status).toBe('checked_in');
    });

    it('Step 6: User starts the appointment', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/appointments/${appointmentId}/start`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenantId)
        .expect(200);

      expect(response.body.status).toBe('in_progress');
    });

    it('Step 7: User completes the appointment', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/appointments/${appointmentId}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenantId)
        .expect(200);

      expect(response.body.status).toBe('completed');
      expect(response.body.completion_time).toBeDefined();
    });

    it('Step 8: User views schedule summary', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/calendar/schedule/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenantId)
        .query({
          staff_member_id: staffMemberId,
          date: '2025-11-20',
        })
        .expect(200);

      expect(response.body.appointments_count).toBeGreaterThan(0);
    });
  });

  describe('Blocked Time Workflow', () => {
    let blockedTimeId: string;

    it('should create blocked time', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/calendar/blocked-time')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenantId)
        .send({
          staff_member_id: staffMemberId,
          start_time: '2025-11-21T12:00:00Z',
          end_time: '2025-11-21T13:00:00Z',
          reason: 'Lunch Break',
          is_recurring: false,
        })
        .expect(201);

      blockedTimeId = response.body.id;
    });

    it('should see blocked time in calendar', async () => {
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

      const blockedTime = response.body.blocked_times.find(
        (bt: any) => bt.id === blockedTimeId
      );

      expect(blockedTime).toBeDefined();
    });

    it('should delete blocked time', async () => {
      await request(app.getHttpServer())
        .delete(`/api/calendar/blocked-time/${blockedTimeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenantId)
        .expect(204);
    });
  });

  describe('Calendar Export Workflow', () => {
    it('should export calendar to iCal format', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/calendar/export')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenantId)
        .send({
          format: 'ical',
          view: 'week',
          start_date: '2025-11-16',
          end_date: '2025-11-22',
          business_id: businessId,
        })
        .expect(200);

      expect(response.headers['content-type']).toContain('text/calendar');
    });
  });
});
