import { format } from 'date-fns';
import type { CalendarAppointment } from '@/types/calendar.types';

/**
 * Generate iCal (.ics) file content from appointments
 * Compatible with Google Calendar, Apple Calendar, Outlook, etc.
 */
export const generateICalFile = (
  appointments: CalendarAppointment[],
  businessName: string
): string => {
  const lines: string[] = [];

  // iCal header
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//Booking Platform//Calendar Export//EN');
  lines.push('CALSCALE:GREGORIAN');
  lines.push('METHOD:PUBLISH');
  lines.push(`X-WR-CALNAME:${businessName} Appointments`);
  lines.push('X-WR-TIMEZONE:UTC');

  // Add each appointment as an event
  appointments.forEach((appointment) => {
    const startDateTime = new Date(`${appointment.date}T${appointment.start_time}`);
    const endDateTime = new Date(`${appointment.date}T${appointment.end_time}`);

    // Format dates for iCal (YYYYMMDDTHHMMSSZ)
    const formatICalDate = (date: Date): string => {
      return format(date, "yyyyMMdd'T'HHmmss'Z'");
    };

    // Create event
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:appointment-${appointment.id}@booking-platform`);
    lines.push(`DTSTAMP:${formatICalDate(new Date())}`);
    lines.push(`DTSTART:${formatICalDate(startDateTime)}`);
    lines.push(`DTEND:${formatICalDate(endDateTime)}`);
    lines.push(`SUMMARY:${escapeICalText(appointment.service_name)} - ${escapeICalText(appointment.client_name)}`);

    // Description with all details
    const description = [
      `Client: ${appointment.client_name}`,
      appointment.client_email ? `Email: ${appointment.client_email}` : '',
      appointment.client_phone ? `Phone: ${appointment.client_phone}` : '',
      `Service: ${appointment.service_name}`,
      appointment.staff_name ? `Staff: ${appointment.staff_name}` : '',
      `Status: ${appointment.status}`,
      appointment.notes ? `Notes: ${appointment.notes}` : '',
    ]
      .filter(Boolean)
      .join('\\n');

    lines.push(`DESCRIPTION:${escapeICalText(description)}`);

    // Location if available
    if (appointment.location_name) {
      lines.push(`LOCATION:${escapeICalText(appointment.location_name)}`);
    }

    // Status mapping
    const statusMap: Record<string, string> = {
      pending: 'TENTATIVE',
      confirmed: 'CONFIRMED',
      checked_in: 'CONFIRMED',
      in_progress: 'CONFIRMED',
      completed: 'CONFIRMED',
      cancelled: 'CANCELLED',
      no_show: 'CANCELLED',
    };
    lines.push(`STATUS:${statusMap[appointment.status] || 'CONFIRMED'}`);

    lines.push('END:VEVENT');
  });

  // iCal footer
  lines.push('END:VCALENDAR');

  return lines.join('\r\n');
};

/**
 * Escape special characters for iCal format
 */
const escapeICalText = (text: string): string => {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
};

/**
 * Generate CSV file content from appointments
 * Compatible with Excel, Google Sheets, etc.
 */
export const generateCSVFile = (appointments: CalendarAppointment[]): string => {
  const headers = [
    'Appointment Number',
    'Date',
    'Start Time',
    'End Time',
    'Duration (min)',
    'Client Name',
    'Client Email',
    'Client Phone',
    'Service',
    'Service Price',
    'Staff',
    'Location',
    'Status',
    'Notes',
    'Created At',
  ];

  const rows = appointments.map((appointment) => {
    const startDateTime = new Date(`${appointment.date}T${appointment.start_time}`);
    const endDateTime = new Date(`${appointment.date}T${appointment.end_time}`);
    const durationMinutes = Math.round(
      (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60)
    );

    return [
      appointment.appointment_number || '',
      format(new Date(appointment.date), 'yyyy-MM-dd'),
      appointment.start_time,
      appointment.end_time,
      durationMinutes.toString(),
      appointment.client_name,
      appointment.client_email || '',
      appointment.client_phone || '',
      appointment.service_name,
      appointment.service_price?.toString() || '',
      appointment.staff_name || '',
      appointment.location_name || '',
      appointment.status,
      appointment.notes || '',
      appointment.created_at ? format(new Date(appointment.created_at), 'yyyy-MM-dd HH:mm:ss') : '',
    ].map(escapeCSVField);
  });

  // Combine headers and rows
  const csvLines = [headers.join(','), ...rows.map((row) => row.join(','))];

  return csvLines.join('\n');
};

/**
 * Escape and quote CSV fields
 */
const escapeCSVField = (field: string): string => {
  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
};

/**
 * Download file to user's computer
 */
export const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Generate filename with current date
 */
export const generateExportFilename = (
  prefix: string,
  extension: string,
  dateRange?: string
): string => {
  const timestamp = format(new Date(), 'yyyy-MM-dd');
  const sanitizedRange = dateRange?.replace(/[^a-zA-Z0-9-]/g, '-') || timestamp;
  return `${prefix}-${sanitizedRange}.${extension}`;
};

/**
 * Export appointments to iCal format
 */
export const exportToICalendar = (
  appointments: CalendarAppointment[],
  businessName: string,
  dateRange?: string
): void => {
  const icalContent = generateICalFile(appointments, businessName);
  const filename = generateExportFilename('appointments', 'ics', dateRange);
  downloadFile(icalContent, filename, 'text/calendar;charset=utf-8');
};

/**
 * Export appointments to CSV format
 */
export const exportToCSV = (
  appointments: CalendarAppointment[],
  dateRange?: string
): void => {
  const csvContent = generateCSVFile(appointments);
  const filename = generateExportFilename('appointments', 'csv', dateRange);
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8');
};

/**
 * Get printable HTML content for appointments
 */
export const generatePrintableHTML = (
  appointments: CalendarAppointment[],
  title: string,
  businessName: string
): string => {
  const appointmentRows = appointments
    .map(
      (apt) => `
    <tr>
      <td>${format(new Date(apt.date), 'MMM d, yyyy')}</td>
      <td>${apt.start_time} - ${apt.end_time}</td>
      <td>${apt.client_name}</td>
      <td>${apt.service_name}</td>
      <td>${apt.staff_name || 'N/A'}</td>
      <td><span class="status-badge status-${apt.status}">${apt.status}</span></td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${businessName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      margin: 20px;
      color: #1f2937;
    }
    h1 {
      font-size: 24px;
      margin-bottom: 8px;
      color: #111827;
    }
    .subtitle {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 24px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
    }
    th {
      background-color: #f3f4f6;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      color: #374151;
      border-bottom: 2px solid #e5e7eb;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }
    tr:last-child td {
      border-bottom: none;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      text-transform: capitalize;
    }
    .status-pending { background-color: #fef3c7; color: #92400e; }
    .status-confirmed { background-color: #dbeafe; color: #1e40af; }
    .status-checked_in { background-color: #d1fae5; color: #065f46; }
    .status-in_progress { background-color: #e9d5ff; color: #6b21a8; }
    .status-completed { background-color: #f3f4f6; color: #374151; }
    .status-cancelled { background-color: #fee2e2; color: #991b1b; }
    .status-no_show { background-color: #fecaca; color: #7f1d1d; }
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="subtitle">${businessName} - Generated on ${format(new Date(), 'MMMM d, yyyy')}</div>

  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Time</th>
        <th>Client</th>
        <th>Service</th>
        <th>Staff</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${appointmentRows}
    </tbody>
  </table>

  <div class="subtitle" style="margin-top: 24px;">
    Total Appointments: ${appointments.length}
  </div>
</body>
</html>
  `;
};

/**
 * Print appointments in browser
 */
export const printAppointments = (
  appointments: CalendarAppointment[],
  title: string,
  businessName: string
): void => {
  const htmlContent = generatePrintableHTML(appointments, title, businessName);

  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};
