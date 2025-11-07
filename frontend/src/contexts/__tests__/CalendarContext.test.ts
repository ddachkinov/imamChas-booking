import {
  getDateRange,
  formatDateRange,
  generateTimeSlots,
  calculateAppointmentPosition,
  timeRangesOverlap,
  getStatusColor,
  getStatusLabel,
  filterAppointments,
} from '../CalendarContext';
import type { CalendarFilters } from '@/types/calendar.types';

describe('CalendarContext Utilities', () => {
  describe('getDateRange', () => {
    const testDate = new Date('2025-11-10T10:00:00Z'); // Monday, November 10, 2025

    it('returns same date for day view', () => {
      const { start, end } = getDateRange('day', testDate);

      expect(start).toEqual(testDate);
      expect(end).toEqual(testDate);
    });

    it('returns week range for week view (Sunday to Saturday)', () => {
      const { start, end } = getDateRange('week', testDate);

      // November 10, 2025 is Monday
      // Week should start on Sunday, Nov 9
      // Week should end on Saturday, Nov 15
      expect(start.getDay()).toBe(0); // Sunday
      expect(end.getDay()).toBe(6); // Saturday
      expect(start.getDate()).toBe(9);
      expect(end.getDate()).toBe(15);
    });

    it('returns month range for month view', () => {
      const { start, end } = getDateRange('month', testDate);

      // November 2025 starts on Saturday, Nov 1
      // November 2025 ends on Sunday, Nov 30
      expect(start.getDate()).toBe(1);
      expect(end.getDate()).toBe(30);
      expect(start.getMonth()).toBe(10); // November (0-indexed)
      expect(end.getMonth()).toBe(10); // November
    });

    it('returns same date for resource view', () => {
      const { start, end } = getDateRange('resource', testDate);

      expect(start).toEqual(testDate);
      expect(end).toEqual(testDate);
    });
  });

  describe('formatDateRange', () => {
    const testDate = new Date('2025-11-10T10:00:00Z'); // Monday, November 10, 2025

    it('formats day view as full date', () => {
      const formatted = formatDateRange('day', testDate);

      expect(formatted).toBe('Monday, November 10, 2025');
    });

    it('formats week view as date range', () => {
      const formatted = formatDateRange('week', testDate);

      // Week of Nov 9-15, 2025
      expect(formatted).toBe('Nov 9 - 15, 2025');
    });

    it('formats week view spanning two months', () => {
      const endOfMonth = new Date('2025-11-30T10:00:00Z'); // Sunday, Nov 30
      const formatted = formatDateRange('week', endOfMonth);

      // Week spans November and December
      expect(formatted).toContain('Nov');
      expect(formatted).toContain('Dec');
    });

    it('formats month view as month and year', () => {
      const formatted = formatDateRange('month', testDate);

      expect(formatted).toBe('November 2025');
    });
  });

  describe('generateTimeSlots', () => {
    it('generates time slots with default parameters (8 AM - 8 PM, 15-min intervals)', () => {
      const slots = generateTimeSlots();

      // 12 hours * 4 slots per hour + 1 for end hour = 49 slots
      expect(slots.length).toBe(49);

      // First slot should be 8:00 AM
      expect(slots[0].hour).toBe(8);
      expect(slots[0].minute).toBe(0);
      expect(slots[0].label).toBe('8:00 AM');

      // Last slot should be 8:00 PM
      const lastSlot = slots[slots.length - 1];
      expect(lastSlot.hour).toBe(20);
      expect(lastSlot.minute).toBe(0);
      expect(lastSlot.label).toBe('8:00 PM');
    });

    it('generates hourly slots when interval is 60 minutes', () => {
      const slots = generateTimeSlots(8, 20, 60);

      // 8 AM to 8 PM = 13 slots (including both endpoints)
      expect(slots.length).toBe(13);

      // Check some specific slots
      expect(slots[0].label).toBe('8:00 AM');
      expect(slots[1].label).toBe('9:00 AM');
      expect(slots[12].label).toBe('8:00 PM');
    });

    it('generates 30-minute intervals correctly', () => {
      const slots = generateTimeSlots(9, 11, 30);

      // 9:00, 9:30, 10:00, 10:30, 11:00 = 5 slots
      expect(slots.length).toBe(5);

      expect(slots[0].label).toBe('9:00 AM');
      expect(slots[1].label).toBe('9:30 AM');
      expect(slots[2].label).toBe('10:00 AM');
      expect(slots[3].label).toBe('10:30 AM');
      expect(slots[4].label).toBe('11:00 AM');
    });

    it('handles noon transition correctly', () => {
      const slots = generateTimeSlots(11, 13, 60);

      expect(slots[0].label).toBe('11:00 AM');
      expect(slots[1].label).toBe('12:00 PM'); // Noon
      expect(slots[2].label).toBe('1:00 PM'); // 1 PM
    });

    it('generates correct 24-hour time format', () => {
      const slots = generateTimeSlots(8, 10, 60);

      expect(slots[0].time).toBe('08:00:00');
      expect(slots[1].time).toBe('09:00:00');
      expect(slots[2].time).toBe('10:00:00');
    });
  });

  describe('calculateAppointmentPosition', () => {
    it('calculates correct position for appointment at grid start', () => {
      const { top, height } = calculateAppointmentPosition('08:00:00', '09:00:00', 8, 20);

      // Appointment at start of grid (8 AM)
      expect(top).toBe(0);

      // 1-hour appointment in 12-hour grid = 8.33%
      expect(height).toBeCloseTo(8.33, 1);
    });

    it('calculates correct position for appointment at grid end', () => {
      const { top, height } = calculateAppointmentPosition('19:00:00', '20:00:00', 8, 20);

      // Appointment at end of grid (7 PM - 8 PM)
      // 11 hours from start = 91.67%
      expect(top).toBeCloseTo(91.67, 1);

      // 1-hour appointment = 8.33%
      expect(height).toBeCloseTo(8.33, 1);
    });

    it('calculates correct position for midday appointment', () => {
      const { top, height } = calculateAppointmentPosition('12:00:00', '13:30:00', 8, 20);

      // 12 PM is 4 hours from 8 AM start = 33.33%
      expect(top).toBeCloseTo(33.33, 1);

      // 1.5-hour appointment = 12.5%
      expect(height).toBe(12.5);
    });

    it('handles 15-minute appointments correctly', () => {
      const { top, height } = calculateAppointmentPosition('10:00:00', '10:15:00', 8, 20);

      // 2 hours from start = 16.67%
      expect(top).toBeCloseTo(16.67, 1);

      // 15 minutes in 12-hour grid = 2.08%
      expect(height).toBeCloseTo(2.08, 1);
    });

    it('handles 30-minute appointments correctly', () => {
      const { top, height } = calculateAppointmentPosition('14:30:00', '15:00:00', 8, 20);

      // 6.5 hours from start = 54.17%
      expect(top).toBeCloseTo(54.17, 1);

      // 30 minutes = 4.17%
      expect(height).toBeCloseTo(4.17, 1);
    });

    it('returns zero for positions before grid start', () => {
      const { top } = calculateAppointmentPosition('06:00:00', '07:00:00', 8, 20);

      // Should clamp to 0 for appointments before grid
      expect(top).toBe(0);
    });
  });

  describe('timeRangesOverlap', () => {
    it('detects overlap when ranges partially overlap', () => {
      const overlaps = timeRangesOverlap('10:00:00', '11:00:00', '10:30:00', '11:30:00');

      expect(overlaps).toBe(true);
    });

    it('detects overlap when one range contains another', () => {
      const overlaps = timeRangesOverlap('10:00:00', '12:00:00', '10:30:00', '11:00:00');

      expect(overlaps).toBe(true);
    });

    it('detects no overlap when ranges are consecutive', () => {
      const overlaps = timeRangesOverlap('10:00:00', '11:00:00', '11:00:00', '12:00:00');

      expect(overlaps).toBe(false);
    });

    it('detects no overlap when ranges are separate', () => {
      const overlaps = timeRangesOverlap('10:00:00', '11:00:00', '14:00:00', '15:00:00');

      expect(overlaps).toBe(false);
    });

    it('handles exact overlap', () => {
      const overlaps = timeRangesOverlap('10:00:00', '11:00:00', '10:00:00', '11:00:00');

      expect(overlaps).toBe(true);
    });
  });

  describe('getStatusColor', () => {
    it('returns correct color for each status', () => {
      expect(getStatusColor('pending')).toBe('bg-yellow-500');
      expect(getStatusColor('confirmed')).toBe('bg-blue-500');
      expect(getStatusColor('checked_in')).toBe('bg-green-500');
      expect(getStatusColor('in_progress')).toBe('bg-purple-500');
      expect(getStatusColor('completed')).toBe('bg-gray-400');
      expect(getStatusColor('cancelled')).toBe('bg-red-500');
      expect(getStatusColor('no_show')).toBe('bg-orange-500');
    });

    it('returns default color for unknown status', () => {
      expect(getStatusColor('unknown' as any)).toBe('bg-gray-500');
    });
  });

  describe('getStatusLabel', () => {
    it('returns correct label for each status', () => {
      expect(getStatusLabel('pending')).toBe('Pending');
      expect(getStatusLabel('confirmed')).toBe('Confirmed');
      expect(getStatusLabel('checked_in')).toBe('Checked In');
      expect(getStatusLabel('in_progress')).toBe('In Progress');
      expect(getStatusLabel('completed')).toBe('Completed');
      expect(getStatusLabel('cancelled')).toBe('Cancelled');
      expect(getStatusLabel('no_show')).toBe('No Show');
    });

    it('returns status as-is for unknown status', () => {
      expect(getStatusLabel('custom_status' as any)).toBe('custom_status');
    });
  });

  describe('filterAppointments', () => {
    const mockAppointments = [
      {
        id: '1',
        client_name: 'John Doe',
        client_email: 'john@example.com',
        client_phone: '+1234567890',
        service_name: 'Haircut',
        service_id: 's1',
        staff_name: 'Jane Smith',
        staff_id: 'st1',
        status: 'confirmed',
        appointment_number: 'APT-001',
      },
      {
        id: '2',
        client_name: 'Alice Johnson',
        client_email: 'alice@example.com',
        client_phone: '+1987654321',
        service_name: 'Massage',
        service_id: 's2',
        staff_name: 'Bob Williams',
        staff_id: 'st2',
        status: 'pending',
        appointment_number: 'APT-002',
      },
      {
        id: '3',
        client_name: 'Charlie Brown',
        client_email: 'charlie@example.com',
        client_phone: '+1555555555',
        service_name: 'Haircut',
        service_id: 's1',
        staff_name: 'Jane Smith',
        staff_id: 'st1',
        status: 'completed',
        appointment_number: 'APT-003',
      },
    ];

    it('returns all appointments when no filters applied', () => {
      const filters: CalendarFilters = {
        status: [],
        staff_ids: [],
        service_ids: [],
        location_ids: [],
        search_query: '',
      };

      const filtered = filterAppointments(mockAppointments, filters);

      expect(filtered).toHaveLength(3);
    });

    it('filters by single status', () => {
      const filters: CalendarFilters = {
        status: ['confirmed'],
        staff_ids: [],
        service_ids: [],
        location_ids: [],
        search_query: '',
      };

      const filtered = filterAppointments(mockAppointments, filters);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].status).toBe('confirmed');
    });

    it('filters by multiple statuses', () => {
      const filters: CalendarFilters = {
        status: ['confirmed', 'completed'],
        staff_ids: [],
        service_ids: [],
        location_ids: [],
        search_query: '',
      };

      const filtered = filterAppointments(mockAppointments, filters);

      expect(filtered).toHaveLength(2);
      expect(filtered.map(a => a.status)).toEqual(['confirmed', 'completed']);
    });

    it('filters by staff ID', () => {
      const filters: CalendarFilters = {
        status: [],
        staff_ids: ['st1'],
        service_ids: [],
        location_ids: [],
        search_query: '',
      };

      const filtered = filterAppointments(mockAppointments, filters);

      expect(filtered).toHaveLength(2);
      expect(filtered.every(a => a.staff_id === 'st1')).toBe(true);
    });

    it('filters by service ID', () => {
      const filters: CalendarFilters = {
        status: [],
        staff_ids: [],
        service_ids: ['s2'],
        location_ids: [],
        search_query: '',
      };

      const filtered = filterAppointments(mockAppointments, filters);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].service_id).toBe('s2');
    });

    it('filters by search query matching client name', () => {
      const filters: CalendarFilters = {
        status: [],
        staff_ids: [],
        service_ids: [],
        location_ids: [],
        search_query: 'john',
      };

      const filtered = filterAppointments(mockAppointments, filters);

      expect(filtered).toHaveLength(2); // John Doe and Alice Johnson
    });

    it('filters by search query matching email', () => {
      const filters: CalendarFilters = {
        status: [],
        staff_ids: [],
        service_ids: [],
        location_ids: [],
        search_query: 'alice@example.com',
      };

      const filtered = filterAppointments(mockAppointments, filters);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].client_email).toBe('alice@example.com');
    });

    it('filters by search query matching service name', () => {
      const filters: CalendarFilters = {
        status: [],
        staff_ids: [],
        service_ids: [],
        location_ids: [],
        search_query: 'haircut',
      };

      const filtered = filterAppointments(mockAppointments, filters);

      expect(filtered).toHaveLength(2);
      expect(filtered.every(a => a.service_name === 'Haircut')).toBe(true);
    });

    it('filters by search query matching appointment number', () => {
      const filters: CalendarFilters = {
        status: [],
        staff_ids: [],
        service_ids: [],
        location_ids: [],
        search_query: 'APT-002',
      };

      const filtered = filterAppointments(mockAppointments, filters);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].appointment_number).toBe('APT-002');
    });

    it('combines multiple filters (status + staff)', () => {
      const filters: CalendarFilters = {
        status: ['confirmed', 'completed'],
        staff_ids: ['st1'],
        service_ids: [],
        location_ids: [],
        search_query: '',
      };

      const filtered = filterAppointments(mockAppointments, filters);

      expect(filtered).toHaveLength(2);
      expect(filtered.every(a => a.staff_id === 'st1')).toBe(true);
      expect(filtered.every(a => ['confirmed', 'completed'].includes(a.status))).toBe(true);
    });

    it('combines all filters together', () => {
      const filters: CalendarFilters = {
        status: ['confirmed'],
        staff_ids: ['st1'],
        service_ids: ['s1'],
        location_ids: [],
        search_query: 'john',
      };

      const filtered = filterAppointments(mockAppointments, filters);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });

    it('returns empty array when no matches found', () => {
      const filters: CalendarFilters = {
        status: [],
        staff_ids: [],
        service_ids: [],
        location_ids: [],
        search_query: 'nonexistent',
      };

      const filtered = filterAppointments(mockAppointments, filters);

      expect(filtered).toHaveLength(0);
    });

    it('is case-insensitive for search query', () => {
      const filters: CalendarFilters = {
        status: [],
        staff_ids: [],
        service_ids: [],
        location_ids: [],
        search_query: 'JOHN DOE',
      };

      const filtered = filterAppointments(mockAppointments, filters);

      expect(filtered).toHaveLength(2); // John Doe and Alice Johnson (matches "John")
    });
  });
});
