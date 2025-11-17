# Comprehensive Bug Fix Prompt for IC Booking Platform

## Context
I'm working on an IC Booking Platform (multi-tenant SaaS booking system) with a NestJS backend and React frontend. I've completed QA testing and identified critical bugs across multiple modules. I need you to systematically fix all issues to get the application production-ready.

## Project Structure
```
/backend
  /src
    /modules
      /auth - JWT authentication, multi-tenant
      /services - Service management (haircuts, massages, etc.)
      /staff - Staff member management
      /calendar - Appointment/booking management
      /businesses - Business/tenant management

/frontend
  /src
    /pages
      /auth - Login, registration
      /admin - Admin dashboard, services, staff, calendar
    /services - API client
    /contexts - Auth context, state management
```

## Technology Stack
- **Backend:** NestJS, TypeORM, PostgreSQL, JWT, Passport
- **Frontend:** React, TypeScript, React Router, TailwindCSS
- **Deployment:** DigitalOcean droplet at 167.172.102.50
- **URLs:**
  - Frontend: https://demo.ic-booking.groundpoint.net
  - Backend: https://api.ic-booking.groundpoint.net

## Critical Issues Found (Must Fix First)

### 🔴 PRIORITY 1: Calendar Page Blank Screen (CRITICAL)

**Issue:** The calendar page at `/calendar` renders completely blank - no UI components, buttons, or calendar grid visible. This is a complete outage of core functionality.

**Location:** `frontend/src/pages/admin/CalendarPage.tsx`

**What to Fix:**
1. Investigate why CalendarPage renders blank
2. Check for JavaScript errors in component initialization
3. Verify API endpoints are being called correctly
4. Ensure proper error handling shows error messages instead of blank page
5. Test with credentials: `admin@demo.ic-booking.groundpoint.net / Admin123!`

**Expected Result:** Calendar page shows weekly view with time slots, service dropdown, and "New Appointment" button

---

### 🔴 PRIORITY 2: Services API Endpoint Failures (CRITICAL)

**Issue:** Three critical endpoints are missing, breaking core functionality:

#### Missing Endpoint 1: Duplicate Service
- **Frontend calls:** `POST /api/services/:id/duplicate`
- **Status:** 404 Not Found
- **Impact:** Duplicate button completely non-functional
- **File:** `backend/src/modules/services/services.controller.ts`

**What to Add:**
```typescript
@Post(':id/duplicate')
async duplicateService(
  @Param('id') id: string,
  @CurrentUser() user: any,
): Promise<Service> {
  // 1. Find original service
  // 2. Create new service with copied data
  // 3. Append "(Copy)" to name
  // 4. Return new service
}
```

#### Missing Endpoint 2: Bulk Deactivate
- **Frontend calls:** `POST /api/services/bulk/deactivate`
- **Status:** 404 Not Found
- **Impact:** Bulk operations completely broken
- **File:** `backend/src/modules/services/services.controller.ts`

**What to Add:**
```typescript
@Post('bulk/deactivate')
async bulkDeactivate(
  @Body() dto: { serviceIds: string[] },
  @CurrentUser() user: any,
): Promise<void> {
  // Update multiple services set is_active = false
}
```

#### Missing Feature 3: Search and Filters
- **Frontend sends:** `search`, `category`, `is_active`, `min_price`, `max_price` query params
- **Backend only implements:** `businessId`, `includeInactive`
- **Impact:** Search bar and all filters non-functional
- **File:** `backend/src/modules/services/services.service.ts` (findAll method)

**What to Fix:**
Update the `findAll` method to support:
- Text search on name/description
- Category filtering
- Active/inactive filtering
- Price range filtering (min_price, max_price)

---

### 🔴 PRIORITY 3: Staff Management API Endpoint Mismatch (CRITICAL)

**Issue:** Staff list returns 404 because frontend and backend use different endpoint patterns.

- **Frontend calls:** `GET /api/businesses/:businessId/staff`
- **Backend expects:** `GET /api/staff?businessId=:businessId`
- **Impact:** Cannot view staff list at all
- **File:** `backend/src/modules/staff/staff.controller.ts`

**What to Fix (choose one approach):**

**Option A - Update Backend (Recommended):**
```typescript
// Add nested route in staff.controller.ts
@Get('/businesses/:businessId/staff')
async getStaffByBusiness(
  @Param('businessId') businessId: string,
): Promise<StaffMember[]> {
  return this.staffService.findAll({ businessId });
}
```

**Option B - Update Frontend:**
```typescript
// In frontend/src/services/admin.api.ts, change:
return this.get(`/businesses/${businessId}/staff`);
// To:
return this.get(`/staff?businessId=${businessId}`);
```

---

### 🔴 PRIORITY 4: Missing Staff Invitation System (CRITICAL)

**Issue:** Frontend has complete invitation UI but backend endpoint doesn't exist.

- **Frontend calls:** `POST /api/staff/invite`
- **Status:** 404 Not Found
- **Impact:** Cannot add new staff members
- **File:** `backend/src/modules/staff/staff.controller.ts`

**What to Add:**
```typescript
@Post('invite')
async inviteStaff(
  @Body() dto: InviteStaffDto,
  @CurrentUser() user: any,
): Promise<{ invitationSent: boolean }> {
  // 1. Validate email doesn't already exist
  // 2. Generate invitation token
  // 3. Create pending staff member record
  // 4. Send invitation email
  // 5. Return success
}
```

**Create DTO:**
```typescript
// create-staff-invitation.dto.ts
export class InviteStaffDto {
  @IsEmail()
  email: string;

  @IsString()
  first_name: string;

  @IsString()
  last_name: string;

  @IsUUID()
  business_id: string;

  @IsOptional()
  @IsString()
  role?: string;
}
```

---

### 🔴 PRIORITY 5: Staff Database Schema Missing Fields (HIGH)

**Issue:** Frontend expects fields that don't exist in database:
- `role` (string) - Missing column
- `permissions` (array) - Missing relation
- `service_ids` (array) - Missing junction table
- `location_ids` (array) - Missing junction table

**What to Fix:**

**Migration 1 - Add role column:**
```typescript
// Create migration: add-staff-role-column
await queryRunner.query(`
  ALTER TABLE staff_members
  ADD COLUMN role VARCHAR(50) DEFAULT 'staff';
`);
```

**Migration 2 - Create junction tables:**
```typescript
// staff_services junction table
await queryRunner.query(`
  CREATE TABLE staff_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(staff_id, service_id)
  );
`);

// staff_locations junction table (if locations exist)
await queryRunner.query(`
  CREATE TABLE staff_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(staff_id, location_id)
  );
`);
```

**Update Entity:**
```typescript
// staff-member.entity.ts
@Column({ type: 'varchar', length: 50, default: 'staff' })
role: string;

@ManyToMany(() => Service)
@JoinTable({
  name: 'staff_services',
  joinColumn: { name: 'staff_id', referencedColumnName: 'id' },
  inverseJoinColumn: { name: 'service_id', referencedColumnName: 'id' },
})
services: Service[];
```

---

## High Priority Issues (Fix After Critical)

### 🟠 Issue 6: Services Currency Field Missing

**Problem:** Frontend expects `currency: string` but database/entity doesn't have it.

**Fix:**
```typescript
// Migration
ALTER TABLE services ADD COLUMN currency VARCHAR(3) DEFAULT 'USD';

// Entity (service.entity.ts)
@Column({ type: 'varchar', length: 3, default: 'USD' })
currency: string;

// DTO (create-service.dto.ts)
@IsOptional()
@IsString()
@Length(3, 3)
currency?: string = 'USD';
```

---

### 🟠 Issue 7: Services Missing Advanced Fields in Frontend Form

**Problem:** Backend supports `deposit_amount`, `max_capacity`, `requires_approval`, `cancellation_policy` but frontend ServiceFormModal doesn't expose them.

**Fix:** Add these fields to `frontend/src/pages/admin/ServiceFormModal.tsx`:
```tsx
{/* Add in form after duration field */}

<div>
  <label className="block text-sm font-medium text-gray-700">
    Deposit Amount (Optional)
  </label>
  <input
    type="number"
    step="0.01"
    min="0"
    value={formData.deposit_amount || ''}
    onChange={(e) => setFormData({ ...formData, deposit_amount: parseFloat(e.target.value) })}
    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
  />
</div>

<div>
  <label className="block text-sm font-medium text-gray-700">
    Max Capacity
  </label>
  <input
    type="number"
    min="1"
    value={formData.max_capacity || 1}
    onChange={(e) => setFormData({ ...formData, max_capacity: parseInt(e.target.value) })}
    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
  />
</div>

<div className="flex items-center">
  <input
    type="checkbox"
    checked={formData.requires_approval || false}
    onChange={(e) => setFormData({ ...formData, requires_approval: e.target.checked })}
    className="h-4 w-4 text-blue-600"
  />
  <label className="ml-2 block text-sm text-gray-900">
    Requires Admin Approval
  </label>
</div>

<div>
  <label className="block text-sm font-medium text-gray-700">
    Cancellation Policy
  </label>
  <textarea
    rows={3}
    value={formData.cancellation_policy || ''}
    onChange={(e) => setFormData({ ...formData, cancellation_policy: e.target.value })}
    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
    placeholder="E.g., 24 hours notice required for cancellation"
  />
</div>
```

---

### 🟠 Issue 8: "Remember Me" Feature Not Implemented

**Problem:** Checkbox exists but does nothing - token always expires in 1 hour.

**Fix Frontend (LoginPage.tsx):**
```typescript
const [rememberMe, setRememberMe] = useState(false);

// Update checkbox
<input
  id="remember-me"
  type="checkbox"
  checked={rememberMe}
  onChange={(e) => setRememberMe(e.target.checked)}
  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
/>

// Update login call
await login(email, password, rememberMe);
```

**Fix Backend (auth.controller.ts & auth.service.ts):**
```typescript
// DTO
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}

// Service - update generateTokens method
generateTokens(user: User, rememberMe: boolean = false) {
  const accessTokenExpiry = rememberMe ? '7d' : '1h';
  const refreshTokenExpiry = rememberMe ? '30d' : '7d';

  const accessToken = this.jwtService.sign(payload, { expiresIn: accessTokenExpiry });
  const refreshToken = this.jwtService.sign(payload, { expiresIn: refreshTokenExpiry });

  return { accessToken, refreshToken };
}
```

---

### 🟠 Issue 9: Forgot Password Link Not Connected

**Problem:** Link exists but goes to `#` - backend endpoints ready but no frontend page.

**Fix:**
1. Create `frontend/src/pages/auth/PasswordResetPage.tsx`
2. Add route in App.tsx: `<Route path="/auth/reset-password" element={<PasswordResetPage />} />`
3. Update link in LoginPage.tsx: `<Link to="/auth/reset-password">Forgot your password?</Link>`

**Password Reset Page Template:**
```tsx
import React, { useState } from 'react';
import { authApi } from '../../services/admin.api';
import { toast } from '../../components/Toast';

export const PasswordResetPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await authApi.requestPasswordReset(email);
      setEmailSent(true);
      toast.success('Reset Email Sent', 'Check your inbox for reset instructions');
    } catch (error) {
      toast.error('Request Failed', error.message || 'Could not send reset email');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Check Your Email</h2>
          <p className="text-gray-600 mb-4">
            We've sent password reset instructions to {email}
          </p>
          <Link to="/admin/login" className="text-blue-600 hover:underline">
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Reset Your Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">Email address</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Email address"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>

          <div className="text-center">
            <Link to="/admin/login" className="text-sm text-blue-600 hover:underline">
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
```

---

## Medium Priority Issues

### Issue 10: Staff Edit Functionality Missing

**Problem:** StaffDetailsPage shows "TODO: Implement edit modal" but no implementation.

**Fix:** Create edit functionality similar to services:
```tsx
// In StaffDetailsPage.tsx
const [isEditModalOpen, setIsEditModalOpen] = useState(false);

const handleEdit = async (updatedData: Partial<StaffMember>) => {
  try {
    await adminApi.updateStaff(staff.id, updatedData);
    toast.success('Staff Updated', 'Staff member updated successfully');
    // Refresh data
    const updated = await adminApi.getStaff(staff.id);
    setStaff(updated);
    setIsEditModalOpen(false);
  } catch (error) {
    toast.error('Update Failed', error.message);
  }
};

// In JSX
<button onClick={() => setIsEditModalOpen(true)}>
  Edit Staff
</button>

{isEditModalOpen && (
  <StaffEditModal
    staff={staff}
    onClose={() => setIsEditModalOpen(false)}
    onSave={handleEdit}
  />
)}
```

Then create `StaffEditModal.tsx` component similar to `ServiceFormModal.tsx`.

---

### Issue 11: Staff Statistics Not Calculated

**Problem:** StaffDetailsPage always shows "0 bookings this month" and "0 total earnings".

**Fix Backend:**
```typescript
// In staff.service.ts
async getStaffStatistics(staffId: string): Promise<StaffStatistics> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const bookingsThisMonth = await this.bookingRepository.count({
    where: {
      staff_id: staffId,
      created_at: MoreThanOrEqual(startOfMonth),
      status: Not('cancelled'),
    },
  });

  const totalEarnings = await this.bookingRepository
    .createQueryBuilder('booking')
    .select('SUM(booking.total_price)', 'total')
    .where('booking.staff_id = :staffId', { staffId })
    .andWhere('booking.status != :status', { status: 'cancelled' })
    .getRawOne();

  return {
    bookingsThisMonth,
    totalEarnings: parseFloat(totalEarnings?.total || '0'),
  };
}

// Add to controller
@Get(':id/statistics')
async getStatistics(@Param('id') id: string) {
  return this.staffService.getStaffStatistics(id);
}
```

**Fix Frontend:**
```typescript
// In StaffDetailsPage.tsx
const [statistics, setStatistics] = useState({ bookingsThisMonth: 0, totalEarnings: 0 });

useEffect(() => {
  const fetchStatistics = async () => {
    const stats = await adminApi.getStaffStatistics(id);
    setStatistics(stats);
  };
  fetchStatistics();
}, [id]);

// Update display
<p className="text-2xl font-bold">{statistics.bookingsThisMonth}</p>
<p className="text-2xl font-bold">${statistics.totalEarnings.toFixed(2)}</p>
```

---

### Issue 12: No Pagination for Services/Staff Lists

**Problem:** Large businesses with 100+ services/staff will have performance issues.

**Fix Backend (services.service.ts):**
```typescript
async findAll(filters: {
  businessId: string;
  page?: number;
  limit?: number;
  // ... other filters
}): Promise<{ data: Service[]; total: number; page: number; totalPages: number }> {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const [data, total] = await this.serviceRepository.findAndCount({
    where: { /* your filters */ },
    skip,
    take: limit,
    order: { created_at: 'DESC' },
  });

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}
```

**Fix Frontend (ServiceListPage.tsx):**
```tsx
const [page, setPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);

const loadServices = async () => {
  const response = await adminApi.getServices(businessId, { page, limit: 20, ...filters });
  setServices(response.data);
  setTotalPages(response.totalPages);
};

// Add pagination UI
<div className="flex justify-center mt-4 space-x-2">
  <button
    onClick={() => setPage(p => Math.max(1, p - 1))}
    disabled={page === 1}
  >
    Previous
  </button>
  <span>Page {page} of {totalPages}</span>
  <button
    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
    disabled={page === totalPages}
  >
    Next
  </button>
</div>
```

---

## Testing Instructions

After implementing fixes, test in this order:

### 1. Test Services Module
```bash
# Login at https://demo.ic-booking.groundpoint.net/admin/login
# Credentials: admin@demo.ic-booking.groundpoint.net / Admin123!

# Navigate to Services
# ✅ Should see list of services
# ✅ Search should filter results
# ✅ Category filter should work
# ✅ Click "Duplicate" on a service - should create copy
# ✅ Select multiple services, click "Deactivate Selected" - should work
# ✅ Create new service with all fields including deposit_amount, max_capacity
```

### 2. Test Staff Module
```bash
# Navigate to Staff
# ✅ Should see list of staff (not 404)
# ✅ Click "Invite Staff" - should send invitation
# ✅ Click on a staff member - should show details
# ✅ Should show actual bookings count (not always 0)
# ✅ Should show actual earnings (not always $0)
# ✅ Edit button should open modal and save changes
# ✅ Should see assigned services
```

### 3. Test Calendar Module
```bash
# Navigate to Calendar
# ✅ Should show weekly view (not blank page)
# ✅ Should show time slots
# ✅ Service dropdown should load
# ✅ Click "New Appointment" should open modal
# ✅ Should be able to create booking
# ✅ Should be able to edit booking
# ✅ Should be able to delete booking
```

### 4. Test Auth Features
```bash
# Logout
# Login with "Remember me" checked
# ✅ Token should have longer expiry (7 days)

# Logout
# Click "Forgot password"
# ✅ Should navigate to reset page (not #)
# ✅ Enter email and submit
# ✅ Should show success message
```

---

## Deployment Checklist

Before deploying fixes to production:

1. **Run Tests:**
   ```bash
   cd backend && npm run test
   cd frontend && npm run test
   ```

2. **Run Database Migrations:**
   ```bash
   cd backend
   npm run migration:run
   ```

3. **Build Both Projects:**
   ```bash
   cd backend && npm run build
   cd frontend && npm run build
   ```

4. **Deploy to Server:**
   ```bash
   # SSH into server
   ssh root@167.172.102.50

   # Navigate to project
   cd /opt/booking-platform

   # Pull latest changes
   git pull

   # Install dependencies
   cd backend && npm install
   cd ../frontend && npm install

   # Run migrations
   cd backend && npm run migration:run

   # Rebuild
   cd backend && npm run build
   cd ../frontend && npm run build

   # Restart services
   pm2 restart all
   ```

5. **Verify Production:**
   - Visit https://demo.ic-booking.groundpoint.net
   - Login and test all critical flows
   - Check browser console for errors
   - Check network tab for failed requests

---

## Files You'll Need to Modify

### Backend Files
1. `backend/src/modules/services/services.controller.ts` - Add duplicate & bulk endpoints
2. `backend/src/modules/services/services.service.ts` - Add search/filter logic
3. `backend/src/modules/services/service.entity.ts` - Add currency column
4. `backend/src/modules/staff/staff.controller.ts` - Fix endpoint patterns, add invite
5. `backend/src/modules/staff/staff.service.ts` - Add statistics calculation
6. `backend/src/modules/staff/staff-member.entity.ts` - Add role, services relation
7. `backend/src/modules/auth/auth.controller.ts` - Add rememberMe support
8. `backend/src/modules/auth/auth.service.ts` - Variable token expiry
9. Create migrations for database schema changes

### Frontend Files
1. `frontend/src/pages/admin/CalendarPage.tsx` - Fix blank page rendering
2. `frontend/src/pages/admin/ServiceFormModal.tsx` - Add advanced fields
3. `frontend/src/pages/admin/StaffDetailsPage.tsx` - Add edit modal, fix statistics
4. `frontend/src/pages/auth/LoginPage.tsx` - Wire up "Remember me"
5. `frontend/src/pages/auth/PasswordResetPage.tsx` - Create new file
6. `frontend/src/services/admin.api.ts` - May need endpoint URL updates
7. `frontend/src/App.tsx` - Add password reset route

---

## Expected Outcome

After all fixes:
- ✅ Calendar page loads and shows appointments
- ✅ Services search/filter/duplicate/bulk operations work
- ✅ Staff list loads, invite works, statistics accurate
- ✅ "Remember me" extends session
- ✅ Password reset flow complete
- ✅ No 404 errors in network tab
- ✅ No console errors
- ✅ All features functional

**Estimated Total Fix Time:** 8-12 hours of development work

---

## Support Documentation

All QA reports are available at:
- `BOOKING_CALENDAR_QA_FINAL_REPORT.md` - Calendar testing
- `SERVICES_MANAGEMENT_QA_REPORT.md` - Services testing
- `STAFF_MANAGEMENT_QA_REPORT.md` - Staff testing
- `FRONTEND_LOGIN_FIX_REPORT.md` - Auth testing
- `STAFF_QA_QUICK_FIX_GUIDE.md` - Quick reference for staff fixes

---

## Questions to Ask Me If Anything is Unclear

1. Which database ORM methods should I use for the queries?
2. Should I create the migrations automatically or manually?
3. What email service should I use for password reset emails?
4. Should pagination default to 20 or 50 items per page?
5. Do you want me to add loading spinners for async operations?
6. Should I add TypeScript type safety for all API responses?
7. Do you need error logging/monitoring integration?

---

Good luck! Fix these issues in order of priority (1-5 first, then 6-12) and test thoroughly before deploying to production.
