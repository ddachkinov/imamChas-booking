import { generateICalFile, generateCSVFile } from '../export.utils';
import type { CalendarAppointment } from '@/types/calendar.types';

describe('Export Utils', () => {
  const mockAppointments: CalendarAppointment[] = [
    {
      id: 'apt1',
      appointment_number: 'APT-001',
      client_name: 'John Doe',
      client_email: 'john@example.com',
      client_phone: '+1234567890',
      service_name: 'Haircut',
      staff_name: 'Jane Smith',
      location_name: 'Downtown Branch',
      start_time: '2025-11-10T10:00:00Z',
      end_time: '2025-11-10T10:45:00Z',
      duration: 45,
      status: 'confirmed',
      price: 50,
      notes: 'Client prefers shorter cut',
      created_at: '2025-11-01T09:00:00Z',
      updated_at: '2025-11-01T09:00:00Z',
    },
    {
      id: 'apt2',
      appointment_number: 'APT-002',
      client_name: 'Alice Johnson',
      client_email: 'alice@example.com',
      client_phone: '+1987654321',
      service_name: 'Massage',
      staff_name: 'Bob Williams',
      location_name: 'Spa Center',
      start_time: '2025-11-10T14:00:00Z',
      end_time: '2025-11-10T15:00:00Z',
      duration: 60,
      status: 'pending',
      price: 80,
      notes: 'Deep tissue massage',
      created_at: '2025-11-02T10:00:00Z',
      updated_at: '2025-11-02T10:00:00Z',
    },
  ];

  describe('generateICalFile', () => {
    it('generates valid iCal file with correct structure', () => {
      const icalContent = generateICalFile(mockAppointments, 'Test Business');

      // Check for required iCal headers
      expect(icalContent).toContain('BEGIN:VCALENDAR');
      expect(icalContent).toContain('VERSION:2.0');
      expect(icalContent).toContain('PRODID:-//Test Business//Booking Calendar//EN');
      expect(icalContent).toContain('END:VCALENDAR');
    });

    it('includes all appointments as VEVENT entries', () => {
      const icalContent = generateICalFile(mockAppointments, 'Test Business');

      // Should have 2 VEVENT entries
      const eventCount = (icalContent.match(/BEGIN:VEVENT/g) || []).length;
      expect(eventCount).toBe(2);
    });

    it('formats appointment details correctly', () => {
      const icalContent = generateICalFile(mockAppointments, 'Test Business');

      // Check first appointment details
      expect(icalContent).toContain('SUMMARY:Haircut with Jane Smith');
      expect(icalContent).toContain('LOCATION:Downtown Branch');
      expect(icalContent).toContain('STATUS:CONFIRMED');

      // Check second appointment details
      expect(icalContent).toContain('SUMMARY:Massage with Bob Williams');
      expect(icalContent).toContain('LOCATION:Spa Center');
      expect(icalContent).toContain('STATUS:TENTATIVE'); // pending maps to TENTATIVE
    });

    it('includes client information in description', () => {
      const icalContent = generateICalFile(mockAppointments, 'Test Business');

      expect(icalContent).toContain('Client: John Doe');
      expect(icalContent).toContain('Email: john@example.com');
      expect(icalContent).toContain('Phone: +1234567890');
    });

    it('escapes special characters in iCal format', () => {
      const appointmentsWithSpecialChars: CalendarAppointment[] = [
        {
          ...mockAppointments[0],
          notes: 'Client notes with, commas; semicolons and\nnewlines',
        },
      ];

      const icalContent = generateICalFile(appointmentsWithSpecialChars, 'Test Business');

      // Commas should be escaped
      expect(icalContent).toContain('\\,');
      // Semicolons should be escaped
      expect(icalContent).toContain('\\;');
      // Newlines should be escaped
      expect(icalContent).toContain('\\n');
    });

    it('maps appointment statuses to iCal statuses correctly', () => {
      const appointmentsWithStatuses: CalendarAppointment[] = [
        { ...mockAppointments[0], status: 'confirmed' },
        { ...mockAppointments[0], id: '2', status: 'pending' },
        { ...mockAppointments[0], id: '3', status: 'cancelled' },
        { ...mockAppointments[0], id: '4', status: 'completed' },
      ];

      const icalContent = generateICalFile(appointmentsWithStatuses, 'Test Business');

      expect(icalContent).toContain('STATUS:CONFIRMED');
      expect(icalContent).toContain('STATUS:TENTATIVE');
      expect(icalContent).toContain('STATUS:CANCELLED');
    });

    it('formats dates in iCal format (YYYYMMDDTHHMMSSZ)', () => {
      const icalContent = generateICalFile(mockAppointments, 'Test Business');

      // Check date format (should be compact with no separators)
      expect(icalContent).toMatch(/DTSTART:20251110T100000Z/);
      expect(icalContent).toMatch(/DTEND:20251110T104500Z/);
    });
  });

  describe('generateCSVFile', () => {
    it('generates valid CSV with headers', () => {
      const csvContent = generateCSVFile(mockAppointments);

      const lines = csvContent.split('\n');
      const headers = lines[0];

      // Check all expected headers are present
      expect(headers).toContain('Appointment Number');
      expect(headers).toContain('Date');
      expect(headers).toContain('Time');
      expect(headers).toContain('Client Name');
      expect(headers).toContain('Client Email');
      expect(headers).toContain('Service');
      expect(headers).toContain('Staff');
      expect(headers).toContain('Status');
      expect(headers).toContain('Price');
    });

    it('includes all appointments as rows', () => {
      const csvContent = generateCSVFile(mockAppointments);

      const lines = csvContent.split('\n').filter(line => line.trim());

      // Should have 1 header + 2 appointment rows
      expect(lines.length).toBe(3);
    });

    it('formats appointment data correctly', () => {
      const csvContent = generateCSVFile(mockAppointments);

      const lines = csvContent.split('\n');
      const firstRow = lines[1];

      // Check first appointment data
      expect(firstRow).toContain('APT-001');
      expect(firstRow).toContain('John Doe');
      expect(firstRow).toContain('john@example.com');
      expect(firstRow).toContain('Haircut');
      expect(firstRow).toContain('Jane Smith');
      expect(firstRow).toContain('confirmed');
    });

    it('quotes fields containing commas', () => {
      const appointmentsWithCommas: CalendarAppointment[] = [
        {
          ...mockAppointments[0],
          client_name: 'Doe, John',
          notes: 'Special request: cut short, not too short',
        },
      ];

      const csvContent = generateCSVFile(appointmentsWithCommas);

      // Fields with commas should be quoted
      expect(csvContent).toContain('"Doe, John"');
      expect(csvContent).toContain('"Special request: cut short, not too short"');
    });

    it('escapes double quotes in fields', () => {
      const appointmentsWithQuotes: CalendarAppointment[] = [
        {
          ...mockAppointments[0],
          notes: 'Client said "make it short"',
        },
      ];

      const csvContent = generateCSVFile(appointmentsWithQuotes);

      // Double quotes should be escaped with double double quotes
      expect(csvContent).toContain('""make it short""');
    });

    it('formats price with currency symbol', () => {
      const csvContent = generateCSVFile(mockAppointments);

      expect(csvContent).toContain('$50.00');
      expect(csvContent).toContain('$80.00');
    });

    it('formats date and time in readable format', () => {
      const csvContent = generateCSVFile(mockAppointments);

      // Should format date as MM/DD/YYYY
      expect(csvContent).toMatch(/11\/10\/2025/);

      // Should format time in 12-hour format with AM/PM
      expect(csvContent).toMatch(/10:00 AM/);
      expect(csvContent).toMatch(/2:00 PM/);
    });

    it('capitalizes status values', () => {
      const csvContent = generateCSVFile(mockAppointments);

      expect(csvContent).toContain('Confirmed');
      expect(csvContent).toContain('Pending');
    });

    it('handles missing optional fields gracefully', () => {
      const appointmentsWithMissingData: CalendarAppointment[] = [
        {
          ...mockAppointments[0],
          notes: undefined,
          client_phone: undefined,
        },
      ];

      const csvContent = generateCSVFile(appointmentsWithMissingData);

      // Should not throw error
      expect(csvContent).toBeDefined();

      // Should have empty fields for missing data
      const lines = csvContent.split('\n');
      const dataRow = lines[1];

      // Count commas to ensure structure is maintained
      const commaCount = (dataRow.match(/,/g) || []).length;
      expect(commaCount).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty appointments array', () => {
      const icalContent = generateICalFile([], 'Test Business');
      const csvContent = generateCSVFile([]);

      // iCal should still have valid structure
      expect(icalContent).toContain('BEGIN:VCALENDAR');
      expect(icalContent).toContain('END:VCALENDAR');

      // CSV should have headers
      expect(csvContent).toContain('Appointment Number');
    });

    it('handles very long notes', () => {
      const longNotes = 'A'.repeat(500);
      const appointmentsWithLongNotes: CalendarAppointment[] = [
        {
          ...mockAppointments[0],
          notes: longNotes,
        },
      ];

      const icalContent = generateICalFile(appointmentsWithLongNotes, 'Test Business');
      const csvContent = generateCSVFile(appointmentsWithLongNotes);

      // Should not throw error
      expect(icalContent).toBeDefined();
      expect(csvContent).toBeDefined();
    });

    it('handles special characters in business name', () => {
      const icalContent = generateICalFile(
        mockAppointments,
        'Test & Business, Inc.'
      );

      // Should escape special characters
      expect(icalContent).toContain('PRODID:-//Test & Business\\, Inc.//Booking Calendar//EN');
    });
  });
});
