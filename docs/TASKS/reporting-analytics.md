# reporting-analytics.md

## Task Title

Build Comprehensive Reporting and Analytics System

## Task Description

Develop a robust reporting and analytics system that provides business owners with actionable insights into their operations, revenue, customer behavior, and staff performance. The system must generate real-time dashboards, scheduled reports, custom report builders, and data exports to support business decision-making. Analytics should cover key areas including revenue analysis, appointment metrics, client retention, staff productivity, service performance, booking sources, and operational efficiency. The reporting system must handle large datasets efficiently, provide drill-down capabilities, support comparison periods, and offer data visualization through charts and graphs. Reports must be accessible through the web interface and optionally delivered via email or API for third-party integrations.

The analytics system is critical for business growth as it enables data-driven decisions around pricing, staffing, marketing, and capacity planning. The system must balance comprehensiveness with usability, presenting complex data in digestible formats suitable for non-technical business owners.

## Acceptance Criteria

### Dashboard Overview

- Main analytics dashboard displays key performance indicators (KPIs) in card layout
- KPIs include: Total Revenue (current period), Total Appointments (count), New Clients (first-time bookings), Average Appointment Value, Occupancy Rate (booked time / available time)
- Each KPI card shows primary value, comparison to previous period with percentage change, and trend indicator (up/down arrow with color)
- Dashboard date range selector with presets: Today, Yesterday, This Week, Last Week, This Month, Last Month, This Quarter, This Year, Custom Range
- Custom date range picker allows selecting arbitrary start and end dates
- Dashboard auto-refreshes data every 5 minutes or on manual refresh button click
- Quick filters: Filter by Location, Filter by Staff, Filter by Service Category
- Dashboard loading state shows skeleton cards while data fetches
- Dashboard supports responsive layout: desktop shows 4 KPIs per row, tablet 2 per row, mobile stacks vertically

### Revenue Analytics

- Revenue dashboard shows total revenue with breakdown by payment status: Paid, Pending, Refunded
- Revenue trend chart displays daily revenue over selected period as area or bar chart
- Revenue by service category shown in pie chart or donut chart with percentages
- Revenue by staff member shown in horizontal bar chart (top 10 staff if many)
- Revenue by location shown in comparison chart (if multi-location)
- Average transaction value calculated and displayed with trend
- Revenue forecast (optional advanced feature) predicts next month revenue based on historical data
- Revenue goals feature allows setting monthly targets and tracking progress
- Payment method breakdown: percentage via card, cash, other
- Discount and coupon impact analysis: total discounts given, average discount percentage
- Year-over-year comparison: compare current period to same period last year
- Export revenue data as CSV or PDF report

### Appointment Analytics

- Total appointments with breakdown by status: Completed, Cancelled, No-Show, Upcoming
- Appointment volume trend chart showing appointments per day/week/month
- Cancellation rate calculation: cancelled appointments / total appointments as percentage
- No-show rate calculation: no-show appointments / total appointments as percentage
- Average lead time: average days between booking date and appointment date
- Appointment distribution by day of week: bar chart showing which days busiest
- Appointment distribution by time of day: heatmap or histogram showing peak hours
- Booking source attribution: online bookings vs manual staff bookings vs walk-ins
- Average appointment duration calculated across all services
- Appointment completion rate: completed / (completed + cancelled + no-show)
- Rebooking rate: percentage of clients who book again within 90 days
- Same-day booking percentage: appointments booked within 24 hours of start time

### Client Analytics

- Total clients count with breakdown: New Clients (first appointment this period), Returning Clients, Active Clients (appointment in last 90 days), Lapsed Clients (no appointment in 90+ days)
- Client acquisition chart: new clients over time as line chart
- Client retention rate: percentage of clients with multiple appointments
- Client lifetime value (CLV): average total revenue per client over all time
- Client frequency distribution: histogram showing clients by appointment count (1, 2-5, 6-10, 11+ appointments)
- Average appointments per client calculated
- Client churn rate: percentage of clients who haven't booked in 6+ months
- Top clients list: clients by total revenue or appointment count with details
- Client demographics (optional if collected): age ranges, gender, location distribution
- Client notes sentiment analysis (advanced feature): positive/negative/neutral note categorization
- Client referral tracking: clients acquired via referral source
- Client communication preferences: email vs SMS opt-in percentages

### Staff Performance Analytics

- Staff productivity dashboard showing metrics per staff member
- Total appointments per staff member with breakdown by status
- Revenue generated per staff member (attributed to appointments they performed)
- Average rating per staff member (if review system implemented)
- Utilization rate per staff member: booked hours / available hours as percentage
- Staff comparison table: sortable columns for appointments, revenue, utilization, ratings
- Staff schedule efficiency: gaps in schedule, back-to-back booking rate
- Staff no-show rate: no-shows per staff member to identify patterns
- Staff overtime tracking: appointments outside normal business hours
- Staff skill distribution: which services each staff member performs most
- Staff availability patterns: days/times each staff member most booked
- Staff growth trends: month-over-month appointment and revenue growth per staff

### Service Performance Analytics

- Service popularity ranking: services by total bookings
- Service revenue analysis: total revenue per service, average price per booking
- Service utilization: each service as percentage of total appointments
- Service trend chart: bookings per service over time as multi-line chart
- Service duration accuracy: actual time vs scheduled time (if tracked)
- Service cancellation rate: cancellations per service to identify problem services
- Service profitability: revenue minus estimated costs (if cost data available)
- Service pairing analysis: which services often booked together (bundle opportunities)
- Service pricing optimization: average price vs demand to identify underpriced/overpriced services
- Service waitlist demand: how many clients request unavailable time slots per service
- New service performance: track adoption of recently added services
- Service seasonality: identify seasonal patterns in service demand

### Operational Efficiency Metrics

- Occupancy rate: booked time slots / total available time slots as percentage
- Average gap between appointments: time wasted between bookings
- Peak hours identification: busiest hours to optimize staffing
- Slow hours identification: least busy hours for potential promotions
- Resource utilization: per-location or per-room utilization rates
- Booking conversion rate: completed bookings / booking attempts (if tracked)
- Average time to booking: how far in advance clients book
- Schedule optimization score: efficiency of calendar utilization
- Wait time analysis: clients waiting beyond appointment time (if check-in tracked)
- Appointment duration variance: over/under running appointments
- Multi-service booking rate: single client booking multiple services
- Group booking frequency: group appointments vs individual

### Marketing and Growth Metrics

- Booking sources breakdown: online widget, direct booking page, phone, walk-in, social media, referral
- Marketing channel attribution: if UTM parameters tracked, show traffic source effectiveness
- Conversion funnel: booking page views → booking started → booking completed
- Abandoned booking rate: bookings started but not completed
- Client acquisition cost (if marketing spend data available): marketing spend / new clients
- Return on marketing investment: revenue from marketing channels vs spend
- Review and rating trends: average rating over time, review volume
- Social media impact: bookings from social media links
- Email campaign effectiveness: bookings from email promotions
- Promotion and coupon usage: redemption rates, revenue impact
- Search ranking impact: organic search traffic and bookings
- Referral program performance: referrals generated, conversion rate

### Custom Report Builder

- Custom report interface allows selecting metrics, dimensions, filters, and date ranges
- Metric selection: checkboxes for all available metrics (revenue, appointments, clients, etc.)
- Dimension selection: group by day/week/month, by staff, by service, by location
- Filter builder: add multiple filters with AND/OR logic (status equals completed, service category equals hair)
- Date range selector with relative dates (last 30 days, last quarter)
- Report preview shows data in table format with sortable columns
- Chart type selector: bar chart, line chart, pie chart, table
- Save custom reports for future use with descriptive names
- Scheduled reports: configure report to run automatically (daily, weekly, monthly) and email to recipients
- Report sharing: generate shareable link with view-only access (no business account required)
- Export options: CSV, Excel, PDF with formatting and branding
- Report templates: pre-built report templates for common use cases (monthly performance, staff comparison, service analysis)

### Scheduled Reports and Alerts

- Automated report delivery via email on configured schedule
- Report schedules: daily at specific time, weekly on specific day, monthly on specific date
- Report recipients: multiple email addresses supported, separate list per report
- Email report format: PDF attachment, Excel attachment, or HTML email with embedded charts
- Report email includes summary highlights and link to full interactive report
- Performance alerts: notify when metrics exceed thresholds (revenue drops 20%, cancellation rate above 15%, occupancy below 50%)
- Alert configuration: set metric, threshold, comparison period, notification channels (email, in-app)
- Alert frequency: immediate, daily digest, weekly digest to prevent notification fatigue
- Alert recipients: business owner, specific staff members, or custom email addresses
- Alert history log: track all alerts triggered with timestamps and metric values

### Data Export and API

- Bulk data export from analytics page: export all data behind current view
- Export formats: CSV (for Excel/Google Sheets), JSON (for developers), PDF (for presentations)
- CSV export includes headers and properly formatted dates, currency, percentages
- API endpoints for analytics data: programmatic access for third-party integrations
- API authentication: requires API key with analytics read scope
- API rate limiting: 100 requests per minute to prevent abuse
- API response format: JSON with metadata (period, filters applied, generated_at)
- API documentation: comprehensive docs with example requests/responses
- Webhook notifications for significant events: daily revenue threshold, monthly goals achieved
- Data export scheduling: configure automatic exports to email or FTP server

### Comparative Analysis

- Period comparison: compare current period to previous period (this month vs last month)
- Year-over-year comparison: compare to same period last year
- Multi-period comparison: overlay multiple periods on same chart (last 3 months)
- Benchmark comparison: compare metrics to industry averages (if available)
- Location comparison: side-by-side metrics for multiple locations
- Staff comparison: side-by-side metrics for multiple staff members
- Service comparison: side-by-side metrics for multiple services
- Comparison highlighting: color-code improvements (green) and declines (red)
- Variance analysis: show absolute and percentage differences between compared periods
- Trend annotations: mark significant events on charts (promotion started, new staff hired)

### Visualization and Charts

- Chart library provides interactive visualizations: hover for details, click to drill down
- Line charts for time-series data: revenue over time, appointments per day
- Bar charts for categorical comparisons: revenue by staff, appointments by service
- Pie/donut charts for composition: appointment status breakdown, payment methods
- Area charts for cumulative metrics: total revenue accumulation over period
- Heatmaps for time-based patterns: appointment density by day and hour
- Funnel charts for conversion tracking: booking funnel stages
- Gauge charts for goal tracking: revenue vs target with colored zones
- Sparklines for compact trends: mini line charts in KPI cards
- Chart legends with toggle: click legend item to show/hide series
- Chart zoom and pan: zoom into specific date ranges, pan across time
- Chart export: download individual charts as PNG or SVG

### Performance and Optimization

- Analytics queries optimized with database indexes on frequently queried fields
- Materialized views or summary tables for expensive aggregations (daily/weekly summaries pre-calculated)
- Query result caching: cache analytics data for 5 minutes to reduce database load
- Incremental data loading: initial page load shows current period, historical data loaded on demand
- Large dataset pagination: table views paginate to 100 rows per page
- Background job for daily metric calculation: runs nightly to pre-compute common metrics
- Database query timeout protection: cancel queries exceeding 30 seconds
- Progressive data loading: show partial results while additional data loads
- Query optimization: use proper indexes, EXPLAIN ANALYZE for slow queries, optimize joins

### Access Control and Privacy

- Analytics access restricted by role: business owners see all data, staff see limited data, receptionists see operational metrics only
- Staff members cannot see other staff members' revenue or ratings unless explicitly granted
- Multi-location businesses: location managers see only their location data
- Client-level data anonymized in reports: show aggregate statistics, not individual client details (unless in dedicated client report)
- GDPR compliance: honor data deletion requests by removing client from historical analytics
- Audit log: track who viewed which reports and when for compliance
- Export restrictions: limit who can export bulk data based on role
- Sensitive metrics: flag sensitive metrics (staff ratings, client complaints) as confidential

## Implementation Details

### Technology Stack

- Backend: Node.js with NestJS for analytics API endpoints
- Database: PostgreSQL with TimescaleDB extension for time-series data optimization
- Caching: Redis for query result caching
- Background jobs: BullMQ for scheduled report generation and metric calculation
- Frontend: React with TypeScript for analytics dashboard
- Charting library: Recharts or Chart.js for data visualizations
- Data export: ExcelJS for Excel generation, PDFKit or Puppeteer for PDF reports
- Email delivery: SendGrid or similar for scheduled report emails
- API documentation: Swagger/OpenAPI for analytics API docs

### Database Schema

Analytics data primarily queries existing transactional tables (appointments, payments, clients) with optimized indexes:

Indexes for analytics performance:
- appointments: (business_id, created_at), (business_id, status, start_time), (staff_id, start_time), (service_id, status)
- payments: (business_id, created_at, status), (appointment_id, status)
- clients: (business_id, created_at), (business_id, updated_at)

Materialized views for pre-computed metrics:

daily_metrics materialized view:
- business_id, date, location_id, staff_id
- total_revenue, total_appointments, completed_appointments, cancelled_appointments, no_show_appointments
- new_clients_count, returning_clients_count
- average_appointment_value, occupancy_rate
- refreshed nightly via scheduled job

weekly_metrics materialized view:
- business_id, week_start_date, location_id
- aggregated weekly metrics similar to daily

monthly_metrics materialized view:
- business_id, month_start_date, location_id
- aggregated monthly metrics

custom_reports table:
- id, user_id, business_id, report_name, report_config (jsonb), schedule (enum), recipients (text array), created_at

report_runs table:
- id, custom_report_id, execution_time, status, result_data (jsonb), error_message

analytics_cache table:
- cache_key (hash of query parameters), result_data (jsonb), expires_at, created_at

### Analytics Service Architecture

AnalyticsModule:
- AnalyticsController: API endpoints for fetching analytics data
- DashboardService: Dashboard KPIs and summary metrics
- RevenueAnalyticsService: Revenue-specific calculations and queries
- AppointmentAnalyticsService: Appointment metrics and trends
- ClientAnalyticsService: Client retention, CLV, churn calculations
- StaffAnalyticsService: Staff performance and productivity metrics
- ServiceAnalyticsService: Service popularity and performance
- CustomReportService: Custom report builder and execution
- ScheduledReportService: Scheduled report generation and delivery
- ReportExportService: Export to CSV, Excel, PDF
- AnalyticsCacheService: Query result caching with Redis
- MetricCalculationService: Background jobs for pre-computing metrics

### Key Metric Calculations

Total Revenue calculation:
- Query: SELECT SUM(amount) FROM payments WHERE business_id = ? AND status = 'succeeded' AND created_at BETWEEN ? AND ?
- Include: Completed payments only (status succeeded)
- Exclude: Refunded payments (subtract refund amounts)
- Currency: Format according to business currency setting

Occupancy Rate calculation:
- Booked minutes: SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 60) FROM appointments WHERE status IN ('confirmed', 'completed') AND business_id = ? AND start_time BETWEEN ? AND ?
- Available minutes: Business hours per day * days in period * 60 * number of staff
- Occupancy rate: (booked minutes / available minutes) * 100
- Complexity: Account for staff time-off, blocked time, varying business hours per day

Client Lifetime Value calculation:
- Query: SELECT client_id, SUM(amount) as total_revenue, COUNT(*) as appointment_count FROM payments JOIN appointments ON payments.appointment_id = appointments.id WHERE business_id = ? GROUP BY client_id
- CLV: Average of total_revenue per client
- Segmentation: Calculate CLV by client cohort (new clients this year, all-time clients)

Cancellation Rate calculation:
- Cancelled: COUNT(*) FROM appointments WHERE status = 'cancelled' AND business_id = ? AND created_at BETWEEN ? AND ?
- Total: COUNT(*) FROM appointments WHERE business_id = ? AND created_at BETWEEN ? AND ?
- Rate: (cancelled / total) * 100
- Exclude: Cancelled by business (optional filter), only count client-initiated cancellations

Client Retention Rate calculation:
- Cohort method: Clients acquired in period N, what percentage booked again in period N+1
- Repeat client rate: Clients with 2+ appointments / total clients
- Complex: Track retention over multiple periods (3-month, 6-month, 12-month retention)

### Query Optimization Strategies

Index usage:
- All date range queries use indexes on (business_id, date_column)
- Composite indexes on frequently filtered combinations
- Partial indexes for common filters (WHERE status = 'completed')

Materialized views:
- Pre-compute expensive aggregations nightly
- Refresh strategy: full refresh for monthly, incremental for daily
- Query materialized views for historical data, live queries for current day

Query caching:
- Cache key: hash of (business_id, metric_name, date_range, filters)
- TTL: 5 minutes for dashboard, 1 hour for reports
- Cache invalidation: clear cache on data changes (new appointment, payment)

Query batching:
- Dashboard fetches multiple metrics in single API call
- Backend executes queries in parallel using Promise.all
- Return combined results to minimize round-trips

Pagination:
- Large result sets paginated with LIMIT and OFFSET
- Cursor-based pagination for better performance on large offsets
- Return total count separately (may be cached)

### Custom Report Builder Implementation

Report configuration stored as JSON:
- metrics: array of metric names (revenue, appointments, new_clients)
- dimensions: array of grouping dimensions (date, staff_id, service_id)
- filters: array of filter objects {field, operator, value}
- date_range: {start_date, end_date} or {relative: "last_30_days"}
- chart_type: bar, line, pie, table
- sort: {field, direction}

Query generation:
- Build SQL dynamically based on configuration
- SELECT clause: requested metrics with aggregations (SUM, COUNT, AVG)
- FROM clause: base table (appointments) with necessary JOINs
- WHERE clause: business_id, date range, custom filters
- GROUP BY clause: selected dimensions
- ORDER BY clause: sort configuration
- Use query builder library (Knex.js) or ORM with query construction
- Validate query to prevent SQL injection

Report execution:
- Parse report configuration
- Generate SQL query
- Execute with timeout protection
- Format results for display
- Apply chart configuration
- Return data and visualization config to frontend

### Scheduled Report Implementation

Report scheduling:
- Cron expressions for schedules: daily (0 0 * * *), weekly (0 0 * * 1), monthly (0 0 1 * *)
- Background job scheduled using BullMQ with cron
- Job payload includes report_id and execution date
- Job executes report query for configured date range (e.g., previous week)

Report generation:
- Execute custom report configuration
- Format data as PDF or Excel using template
- Include business branding: logo, colors, name
- Add report metadata: generated date, period covered, filters applied
- Generate summary section: key highlights, notable changes

Report delivery:
- Send email to configured recipients
- Email subject: "Weekly Report: [Report Name] for [Business Name]"
- Email body: Summary text with key metrics
- Attachment: PDF or Excel file
- Delivery tracking: log email sent, track opens/clicks if supported

Error handling:
- If report execution fails, retry once after 5 minutes
- If still fails, send error notification to business owner
- Log error details for debugging
- Mark report run as failed in database

### Export Implementation

CSV export:
- Query data based on current filters and date range
- Stream results to CSV format using csv-writer library
- Include headers with human-readable column names
- Format dates (YYYY-MM-DD), currency (with symbol), percentages (with % sign)
- Handle special characters and commas in data (quote fields)
- Set HTTP headers for download: Content-Type: text/csv, Content-Disposition: attachment

Excel export:
- Use ExcelJS library to create workbook
- Create sheet with report data
- Apply formatting: bold headers, currency format for revenue columns, percentage format
- Add summary row at bottom with totals
- Auto-size columns for readability
- Include metadata sheet with report parameters
- Set HTTP headers for download: Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

PDF export:
- Use Puppeteer to render HTML report and convert to PDF
- Create HTML template with report data and charts
- Include business branding: logo in header, colors
- Apply CSS for print-friendly layout
- Generate PDF with proper page breaks
- Optimize PDF size by compressing images
- Set HTTP headers for download: Content-Type: application/pdf

### Analytics API Implementation

API endpoints:

GET /api/analytics/dashboard:
- Query params: start_date, end_date, location_id (optional)
- Returns: object with KPIs {total_revenue, total_appointments, new_clients, avg_value, occupancy_rate, comparison}

GET /api/analytics/revenue:
- Query params: start_date, end_date, group_by (day/week/month), filters
- Returns: array of {date, revenue, payment_count} and summary statistics

GET /api/analytics/appointments:
- Query params: start_date, end_date, group_by, filters
- Returns: array of {date, total, completed, cancelled, no_show} and metrics

GET /api/analytics/clients:
- Query params: date_range, metrics (retention, clv, churn)
- Returns: client metrics and segmentation data

GET /api/analytics/staff:
- Query params: date_range, staff_ids (optional)
- Returns: array of staff performance metrics

GET /api/analytics/services:
- Query params: date_range, service_ids (optional)
- Returns: array of service performance metrics

POST /api/analytics/custom-report:
- Body: report configuration JSON
- Returns: report results matching configuration

GET /api/analytics/export:
- Query params: report_type, format (csv/excel/pdf), filters
- Returns: file download

API response format:
- Consistent structure: {success: true, data: {...}, metadata: {generated_at, period, filters}}
- Error format: {success: false, error: {code, message}}
- Pagination metadata: {total, page, per_page, total_pages}

API authentication:
- Requires valid JWT token in Authorization header
- Additional API key support for scheduled jobs and integrations
- Rate limiting per API key or user

### Frontend Dashboard Implementation

Dashboard components:
- DashboardPage: Main container with date selector and KPI grid
- KPICard: Individual metric card with value, comparison, trend
- RevenueChart: Area or bar chart for revenue over time
- AppointmentVolumeChart: Line chart for appointments
- ServicePerformanceChart: Pie chart or bar chart for services
- StaffLeaderboard: Table or list of top-performing staff
- DateRangePicker: Dropdown with presets and custom range selector
- FilterPanel: Side panel with filter checkboxes
- ExportButton: Dropdown menu with export format options

State management:
- React Query for server state: fetch analytics data, cache results
- Local state for UI: selected date range, active filters, chart view type
- Query keys: ['analytics', 'dashboard', {dateRange, filters}]
- Automatic refetch on date range or filter change

Data visualization:
- Use Recharts library for charts with responsive containers
- Chart configurations: colors matching business brand, tooltips with formatted values
- Chart interactions: click bar to drill down, hover for details
- Chart legends: toggle series on/off by clicking legend items
- Loading states: skeleton charts while data fetches
- Empty states: helpful messages when no data available

### Performance Monitoring

Analytics performance metrics tracked:
- Query execution time: log slow queries (>1 second)
- Cache hit rate: percentage of cached vs fresh queries
- Dashboard load time: time from request to render
- Report generation time: scheduled reports execution duration
- API response time: p50, p95, p99 percentiles
- Database CPU and memory usage during analytics queries

Optimization alerts:
- Alert when cache hit rate drops below 60%
- Alert when average query time exceeds 2 seconds
- Alert when dashboard load time exceeds 5 seconds
- Alert when report generation fails repeatedly

Performance improvements:
- Add indexes based on slow query log analysis
- Optimize materialized view refresh schedule
- Increase cache TTL for less frequently changing data
- Implement query result pagination for large datasets
- Use database read replicas for analytics queries (separate from transactional load)

## Test Scenarios

### Unit Tests

Revenue Calculation:
- Input: 5 payments (100, 150, 200, 50, 75 dollars), all succeeded status
- Expected Output: Total revenue 575 dollars
- Edge Cases: Include refunded payment (should subtract refund amount), exclude pending payments, handle multiple currencies

Occupancy Rate Calculation:
- Input: Business hours 8 AM - 8 PM (12 hours), 2 staff, 7 days, 10 hours booked
- Available: 12 hours * 2 staff * 7 days = 168 hours
- Booked: 10 hours
- Expected Output: Occupancy rate = (10 / 168) * 100 = 5.95%
- Edge Cases: Account for staff time-off (reduce available hours), account for blocked time

Client Lifetime Value:
- Input: 10 clients with total revenue: 100, 200, 150, 300, 50, 175, 225, 400, 125, 275 dollars
- Expected Output: CLV = average = 2000 / 10 = 200 dollars
- Edge Cases: Handle clients with zero revenue (cancelled before payment), handle outliers (VIP clients with very high CLV)

Cancellation Rate:
- Input: 100 total appointments, 15 cancelled
- Expected Output: Cancellation rate = 15%
- Edge Cases: Exclude cancelled by business (if filtering), handle zero appointments (undefined rate)

Period Comparison:
- Input: Current period revenue 5000 dollars, previous period revenue 4000 dollars
- Expected Output: Change = +1000 dollars, percentage change = +25%, trend up
- Edge Cases: Previous period zero (infinite percentage), negative change, equal values (0% change)

### Integration Tests

Dashboard KPI Fetching:
- Input: GET /api/analytics/dashboard?start_date=2025-11-01&end_date=2025-11-30
- Expected Query: Aggregate data from appointments, payments, clients for November 2025
- Expected Output: JSON with total_revenue, total_appointments, new_clients, avg_value, occupancy_rate, each with comparison to October 2025
- Edge Cases: Date range spanning multiple months, single-day date range, future dates return zero

Revenue Chart Data:
- Input: GET /api/analytics/revenue?start_date=2025-11-01&end_date=2025-11-07&group_by=day
- Expected Output: Array of 7 objects [{date: "2025-11-01", revenue: 500}, {date: "2025-11-02", revenue: 750}, ...]
- Edge Cases: Days with no revenue show zero, weekends may have different patterns, holidays

Custom Report Execution:
- Input: POST /api/analytics/custom-report with config {metrics: ["revenue", "appointments"], dimensions: ["staff_id"], filters: [{field: "status", operator: "equals", value: "completed"}]}
- Expected Query: SELECT staff_id, SUM(payments.amount) as revenue, COUNT(appointments.id) as appointments FROM appointments JOIN payments WHERE status = 'completed' GROUP BY staff_id
- Expected Output: Array of {staff_id, staff_name, revenue, appointments} for each staff member
- Edge Cases: No data matching filters returns empty array, invalid metric name returns error, SQL injection attempts blocked

Scheduled Report Generation:
- Input: Scheduled report configured for weekly delivery, runs Monday 8 AM
- Expected Flow:
  1. Cron job triggers at configured time
  2. Report query executes for previous week (Mon-Sun)
  3. Data formatted as PDF with charts
  4. Email sent to configured recipients with PDF attachment
  5. Report run logged with success status
- Expected Output: Email received with report, report_runs table has new entry
- Edge Cases: Query timeout retries once, email delivery failure logged, no data for period shows message

CSV Export:
- Input: GET /api/analytics/export?report_type=revenue&format=csv&start_date=2025-11-01&end_date=2025-11-30
- Expected Response: CSV file download with headers (Date, Revenue, Payment Count) and data rows
- Expected Content: Properly formatted dates, currency values, special characters escaped
- Edge Cases: Large datasets stream correctly, non-ASCII characters in data handled, empty results return headers only

Analytics Cache:
- Input: First request to GET /api/analytics/dashboard with specific date range
- Expected Flow:
  1. Cache miss, query executes against database
  2. Result stored in Redis with 5-minute TTL
  3. Second identical request within 5 minutes retrieves from cache (fast)
  4. After 5 minutes, cache expires, next request queries database
- Expected Output: First request slower (database query), subsequent requests faster (cache hit)
- Verification: Check cache hit/miss metrics, ensure cache invalidation on data changes

### End-to-End Tests

Business Owner Views Monthly Performance:
- Input: Business owner logs in, navigates to analytics dashboard
- Steps:
  1. Dashboard loads with current month date range by default
  2. KPI cards show: Total Revenue 12,500 dollars (+15% vs last month), Total Appointments 85 (+10%), New Clients 25 (+20%)
  3. Revenue chart displays daily revenue bars for current month
  4. Staff leaderboard shows top 3 staff by revenue
  5. Business owner clicks "Last Month" preset
  6. Dashboard updates to show previous month data
  7. KPI comparisons now compare to 2 months ago
- Expected Outcome: Business owner gains insights into monthly performance, identifies growth trends
- Verification: Dashboard data matches database queries, comparisons calculated correctly

Staff Member Views Personal Performance:
- Input: Staff member logs in with limited analytics access
- Steps:
  1. Staff navigates to analytics dashboard
  2. Dashboard filtered to show only their personal data
  3. Cannot see other staff members' metrics or revenue
  4. Views own appointment count, completion rate, client feedback
  5. Attempts to access full business revenue report
  6. Access denied message shown (403 Forbidden)
- Expected Outcome: Staff sees own performance only, business data protected
- Verification: Role-based access control enforced, API returns filtered data

Creating and Saving Custom Report:
- Input: Business owner wants to analyze service performance by location
- Steps:
  1. Navigate to custom report builder
  2. Select metrics: Revenue, Appointment Count, Cancellation Rate
  3. Select dimensions: Service Category, Location
  4. Add filter: Date Range = Last Quarter
  5. Select chart type: Grouped Bar Chart
  6. Preview report, data loads and chart renders
  7. Click "Save Report" button
  8. Enter report name "Quarterly Service Performance by Location"
  9. Report saved to saved reports list
  10. Next time, load report from saved list, data updates with current quarter
- Expected Outcome: Custom report created, saved, reusable with updated data
- Verification: custom_reports table has new entry, report config JSON stored correctly

Scheduling Weekly Email Report:
- Input: Business owner wants weekly revenue report emailed every Monday
- Steps:
  1. Create custom report: Revenue breakdown by day for previous week
  2. Click "Schedule Report" button
  3. Select frequency: Weekly, day: Monday, time: 8:00 AM
  4. Add recipients: owner@business.com, manager@business.com
  5. Select format: PDF with charts
  6. Save scheduled report
  7. On next Monday at 8 AM, scheduled job runs
  8. Report generated for previous Mon-Sun
  9. Email sent to both recipients with PDF attachment
  10. Recipients receive email with subject "Weekly Report: Revenue Breakdown"
- Expected Outcome: Report delivered automatically on schedule, recipients informed
- Verification: report_runs table shows successful execution, email logs confirm delivery

Exporting Year-End Revenue Report:
- Input: Business owner needs year-end revenue for tax purposes
- Steps:
  1. Navigate to revenue analytics page
  2. Set date range: Jan 1 2025 - Dec 31 2025
  3. Filter by payment status: Paid only
  4. Review revenue breakdown by month in dashboard
  5. Click "Export" button, select format Excel
  6. Excel file downloads with all revenue data
  7. Open Excel file, verify data accuracy
  8. File includes summary sheet with total revenue, payment counts
  9. Share file with accountant
- Expected Outcome: Complete accurate revenue data exported for accounting
- Verification: Excel data matches dashboard and database queries

Comparing Multi-Location Performance:
- Input: Business owner with 3 locations wants to compare performance
- Steps:
  1. Navigate to analytics dashboard
  2. Select date range: This Quarter
  3. Group by: Location
  4. Dashboard shows comparison table with 3 rows (one per location)
  5. Columns: Location, Revenue, Appointments, Occupancy Rate, New Clients
  6. Sort by Revenue descending
  7. Identify top-performing location (Downtown: 45,000 dollars revenue)
  8. Identify underperforming location (Mall: 18,000 dollars revenue)
  9. Drill down into Mall location to analyze issues
  10. View Mall staff utilization, service mix, client retention
  11. Identify low occupancy rate (45%) as opportunity for marketing push
- Expected Outcome: Business owner identifies performance gaps between locations, takes action
- Verification: Location comparison data accurate, drill-down functionality works

Setting Revenue Goal and Tracking Progress:
- Input: Business owner sets monthly revenue goal of 20,000 dollars
- Steps:
  1. Navigate to revenue analytics
  2. Click "Set Goal" button
  3. Enter goal amount: 20,000 dollars, period: Monthly
  4. Save goal
  5. Dashboard now shows revenue gauge chart with goal target
  6. Current month revenue: 14,500 dollars (72.5% of goal)
  7. Gauge shows green zone (0-100% of goal) and red zone (below goal)
  8. Projection line estimates end-of-month revenue based on current pace
  9. If projection falls short of goal, alert notification shown
  10. Business owner reviews conversion opportunities to reach goal
- Expected Outcome: Visual goal tracking motivates performance, early warning if falling short
- Verification: Goal stored in database, calculations accurate, alerts trigger appropriately

Analyzing Client Retention Trends:
- Input: Business owner concerned about client churn
- Steps:
  1. Navigate to client analytics page
  2. View retention rate metric: 65% (clients with 2+ appointments)
  3. View churn rate: 35% (clients with no appointment in 6+ months)
  4. View cohort retention chart: 3-month, 6-month, 12-month retention curves
  5. Identify that 6-month retention drops to 40% (concerning)
  6. Drill into lapsed clients segment
  7. View lapsed client list with last appointment date, total lifetime value
  8. Export lapsed client list for re-engagement campaign
  9. Note that high-value clients (CLV over 500 dollars) have better retention (80%)
  10. Create marketing campaign targeting at-risk clients
- Expected Outcome: Data-driven insights drive retention strategies, identify high-value segments
- Verification: Retention calculations accurate, cohort analysis correct, export contains right data

## Caveats and Risks

### Technical Risks

Query Performance at Scale:
- Risk: Analytics queries on millions of appointments may become slow, degrading user experience
- Mitigation: Implement materialized views for pre-computed metrics, add proper indexes, use query result caching, consider read replicas
- Fallback: If queries too slow, limit date ranges (max 1 year), paginate results, run expensive reports asynchronously

Data Accuracy and Consistency:
- Risk: Cached data or materialized views may become stale, showing incorrect metrics
- Mitigation: Implement cache invalidation on data changes, refresh materialized views frequently, show "as of" timestamps on dashboards
- Verification: Regular data reconciliation jobs compare cached vs fresh queries, alert on discrepancies

Complex Metric Calculations:
- Risk: Business logic for metrics like occupancy rate, CLV may have edge cases that produce incorrect results
- Mitigation: Comprehensive unit tests for all calculations, validate against manual calculations, document assumptions clearly
- Review: Periodic audits of metric accuracy by comparing to external reports or manual analysis

Date and Timezone Handling:
- Risk: Date ranges and timezone conversions may cause off-by-one errors or incorrect period comparisons
- Mitigation: Store all times in UTC, convert to business timezone for display, test thoroughly around DST transitions
- Edge Cases: Appointments spanning midnight, multi-timezone businesses, historical data with timezone changes

Memory Usage for Large Exports:
- Risk: Exporting millions of rows to Excel or PDF may exhaust server memory
- Mitigation: Stream data to file instead of loading all into memory, implement export size limits (max 100k rows), use background jobs for large exports
- Fallback: For very large datasets, provide CSV only (most efficient), or split into multiple files

### Business Risks

Metric Interpretation:
- Risk: Business owners may misinterpret metrics or draw incorrect conclusions
- Mitigation: Provide clear definitions and explanations for each metric, include tooltips with calculation methodology, offer example scenarios
- Education: Create help documentation, video tutorials, tooltips explaining what each metric means and how to use it

Privacy and Confidentiality:
- Risk: Staff performance reports may be misused or violate employment privacy expectations
- Mitigation: Implement role-based access control, provide aggregated views when appropriate, document acceptable use policies
- Communication: Transparent communication with staff about what metrics are tracked and how they're used

Data Retention and GDPR:
- Risk: Analytics data may include personal information subject to GDPR, retention limits
- Mitigation: Anonymize client details in aggregate reports, support data deletion requests, implement data retention policies (7 years for financial, 3 years for operational)
- Compliance: Document data processing purposes, obtain consent where required, honor right to erasure

Performance Pressure:
- Risk: Staff may feel excessive pressure from performance metrics, leading to stress or gaming the system
- Mitigation: Balance quantitative metrics with qualitative feedback, avoid using analytics as sole performance measure, focus on team goals
- Culture: Foster culture of learning and improvement rather than punishment for low metrics

Comparative Benchmarks:
- Risk: Comparing to industry averages may demoralize or mislead if benchmarks not applicable to specific business
- Mitigation: Clearly label benchmarks as general guidance, allow disabling benchmarks, focus primarily on self-improvement over time
- Context: Provide context for benchmarks (source, sample size, applicability)

Report Overload:
- Risk: Too many reports and alerts may overwhelm business owners, reducing effectiveness
- Mitigation: Start with essential reports only, provide templates for common use cases, allow customization and turning off unwanted reports
- Design: Progressive disclosure of advanced features, simple default dashboard for most users

### Scalability Risks

Database Growth:
- Risk: Historical data accumulation may slow down queries and increase storage costs
- Mitigation: Implement data archival strategy, move old data to cold storage, summarize historical data for analytics (keep daily rollups, archive raw data)
- Monitoring: Track database size growth, project future storage needs, plan for scaling

Concurrent Query Load:
- Risk: Many users running analytics simultaneously may overwhelm database
- Mitigation: Use connection pooling, implement query queue, rate limit analytics API, use read replicas
- Optimization: Encourage off-peak report generation, batch scheduled reports to avoid peak hours

Real-Time vs Batch Trade-offs:
- Risk: Requirement for real-time metrics conflicts with performance optimization of batch processing
- Mitigation: Use near-real-time (5-minute refresh) as acceptable compromise, pre-compute common metrics, cache aggressively
- Clarification: Set expectations that some reports may have 5-15 minute lag for performance reasons

Export Generation Load:
- Risk: Multiple large exports running simultaneously may impact server performance
- Mitigation: Queue export jobs, limit concurrent exports, implement background processing, notify user when export ready
- Limits: Enforce maximum export size, rate limit exports per user (5 per hour)

Third-Party Integration Load:
- Risk: External systems polling analytics API may create excessive load
- Mitigation: Implement API rate limiting, require API keys, monitor usage patterns, charge for high-volume API access if needed
- Communication: Provide API usage guidelines, suggest polling intervals (max once per 5 minutes)

## Estimated Effort

Large - 6 to 7 weeks for 1 backend developer and 1 frontend developer

Breakdown by feature:
- Database schema and indexes: 2-3 days
- Materialized views for metrics: 3-4 days
- Dashboard KPI endpoints: 4-5 days
- Revenue analytics endpoints: 3-4 days
- Appointment analytics endpoints: 3-4 days
- Client analytics endpoints: 4-5 days
- Staff performance endpoints: 3-4 days
- Service performance endpoints: 2-3 days
- Custom report builder backend: 5-6 days
- Scheduled report system: 4-5 days
- Data export (CSV, Excel, PDF): 5-6 days
- Analytics API with documentation: 2-3 days
- Query caching with Redis: 2-3 days
- Background jobs for metric calculation: 3-4 days
- Frontend dashboard UI: 6-7 days
- Chart visualizations: 5-6 days
- Custom report builder UI: 5-6 days
- Date range picker and filters: 2-3 days
- Export functionality UI: 2-3 days
- Performance optimization: 4-5 days
- Testing (unit, integration, E2E): 6-7 days
- Bug fixes and polish: 4-5 days

Total: 76-94 days, approximately 6-7 weeks with 2 developers working in parallel (some features sequential)

## Owner Role

Full-Stack Developer with Analytics and Data Visualization expertise

Required skills:
- Strong backend development skills (Node.js, TypeScript, NestJS)
- Advanced SQL skills for complex queries, aggregations, joins
- Experience with PostgreSQL optimization (indexes, EXPLAIN ANALYZE, query planning)
- Understanding of data warehouse and analytics concepts
- Experience with charting/visualization libraries (Recharts, Chart.js, D3.js)
- Frontend development skills (React, TypeScript)
- Experience with caching strategies (Redis)
- Knowledge of background job processing (BullMQ)
- Experience with report generation (PDF, Excel)
- Understanding of business metrics and KPIs
- Testing experience for complex data transformations
- Performance optimization skills for data-heavy applications

Nice to have:
- Experience with business intelligence tools (Tableau, Looker, Metabase)
- Understanding of data modeling and dimensional modeling (star schema, fact tables)
- Experience with time-series databases (TimescaleDB, InfluxDB)
- Knowledge of statistical analysis and data science concepts
- Experience with data visualization best practices
- Familiarity with OLAP concepts (Online Analytical Processing)
- Understanding of booking/scheduling industry metrics
- Experience with real-time analytics and streaming data
