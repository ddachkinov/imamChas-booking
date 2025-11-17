# Staff Management - Quick Fix Guide

**For Developers: Start Here**

This is your quick reference for fixing the staff management module. For full details, see `STAFF_MANAGEMENT_QA_REPORT.md`.

---

## 5 Critical Issues to Fix (in order)

### 1. Fix API Endpoint Mismatch ⚡ 2-4 hours

**Problem:** Frontend calls `/businesses/:id/staff`, backend has `/staff`

**Fix:**
```typescript
// Option A: Update frontend (EASIEST)
// File: frontend/src/services/admin.api.ts line 118-126

// Change from:
return apiService.get<StaffMember[]>(`/businesses/${businessId}/staff...`);

// To:
return apiService.get<StaffMember[]>(`/staff?businessId=${businessId}&...`);
```

OR

```typescript
// Option B: Update backend
// File: backend/src/modules/staff/staff.controller.ts

// Add new route:
@Get('/businesses/:businessId/staff')
findAllByBusiness(
  @Request() req,
  @Param('businessId') businessId: string,
  @Query() filters: any
) {
  return this.staffService.findAll(req.user.tenant_id, businessId, filters);
}
```

**Test:** Navigate to `/admin/staff` - should load without 404

---

### 2. Add Role Field to Database ⚡ 4-6 hours

**Problem:** No `role` column in staff_members table

**Fix:**

**Step 1: Create Migration**
```bash
cd backend
npm run migration:create -- -n AddRoleToStaffMembers
```

**Step 2: Write Migration**
```typescript
// backend/src/database/migrations/TIMESTAMP-AddRoleToStaffMembers.ts
export class AddRoleToStaffMembers1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE staff_role_enum AS ENUM ('owner', 'admin', 'staff', 'receptionist');

      ALTER TABLE staff_members
      ADD COLUMN role staff_role_enum NOT NULL DEFAULT 'staff';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE staff_members DROP COLUMN role;
      DROP TYPE staff_role_enum;
    `);
  }
}
```

**Step 3: Update Entity**
```typescript
// backend/src/modules/staff/entities/staff-member.entity.ts

export enum StaffRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  STAFF = 'staff',
  RECEPTIONIST = 'receptionist',
}

@Entity('staff_members')
export class StaffMember {
  // ... existing fields ...

  @Column({
    type: 'enum',
    enum: StaffRole,
    default: StaffRole.STAFF,
  })
  role: StaffRole;
}
```

**Step 4: Update DTO**
```typescript
// backend/src/modules/staff/dto/create-staff-member.dto.ts

export class CreateStaffMemberDto {
  // ... existing fields ...

  @ApiProperty({ enum: StaffRole })
  @IsEnum(StaffRole)
  role: StaffRole;
}
```

**Step 5: Run Migration**
```bash
npm run migration:run
```

**Test:** Role filter and role badges should now work

---

### 3. Implement Staff-Service Associations ⚡ 1-2 days

**Problem:** No way to assign services to staff

**Fix:**

**Step 1: Create Junction Table Migration**
```typescript
export class CreateStaffServices1234567891 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE staff_services (
        staff_id UUID NOT NULL,
        service_id UUID NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT pk_staff_services PRIMARY KEY (staff_id, service_id),
        CONSTRAINT fk_staff_services_staff FOREIGN KEY (staff_id)
          REFERENCES staff_members(id) ON DELETE CASCADE,
        CONSTRAINT fk_staff_services_service FOREIGN KEY (service_id)
          REFERENCES services(id) ON DELETE CASCADE
      );
    `);
  }
}
```

**Step 2: Create Entity**
```typescript
// backend/src/modules/staff/entities/staff-service.entity.ts
@Entity('staff_services')
export class StaffService {
  @PrimaryColumn('uuid')
  staff_id: string;

  @PrimaryColumn('uuid')
  service_id: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => StaffMember)
  @JoinColumn({ name: 'staff_id' })
  staff: StaffMember;

  @ManyToOne(() => Service)
  @JoinColumn({ name: 'service_id' })
  service: Service;
}
```

**Step 3: Add Relation to StaffMember**
```typescript
// In staff-member.entity.ts
@OneToMany(() => StaffService, staffService => staffService.staff)
staffServices: StaffService[];
```

**Step 4: Add Controller Endpoints**
```typescript
// In staff.controller.ts

@Put(':id/services')
async assignServices(
  @Request() req,
  @Param('id') id: string,
  @Body() body: { service_ids: string[] }
) {
  return this.staffService.assignServices(req.user.tenant_id, id, body.service_ids);
}

@Get(':id/services')
getServices(@Request() req, @Param('id') id: string) {
  return this.staffService.getStaffServices(req.user.tenant_id, id);
}

@Delete(':id/services/:serviceId')
removeService(
  @Request() req,
  @Param('id') id: string,
  @Param('serviceId') serviceId: string
) {
  return this.staffService.removeService(req.user.tenant_id, id, serviceId);
}
```

**Step 5: Implement Service Methods**
```typescript
// In staff.service.ts

async assignServices(tenantId: string, staffId: string, serviceIds: string[]): Promise<void> {
  const staff = await this.findOne(tenantId, staffId);

  // Remove existing
  await this.staffServiceRepository.delete({ staff_id: staffId });

  // Add new
  const staffServices = serviceIds.map(serviceId =>
    this.staffServiceRepository.create({
      staff_id: staffId,
      service_id: serviceId,
    })
  );

  await this.staffServiceRepository.save(staffServices);
}

async getStaffServices(tenantId: string, staffId: string): Promise<Service[]> {
  const staff = await this.staffRepository
    .createQueryBuilder('staff')
    .leftJoinAndSelect('staff.staffServices', 'staffServices')
    .leftJoinAndSelect('staffServices.service', 'service')
    .where('staff.id = :staffId', { staffId })
    .andWhere('staff.tenant_id = :tenantId', { tenantId })
    .getOne();

  return staff?.staffServices.map(ss => ss.service) || [];
}
```

**Test:** Should be able to assign services to staff in UI

---

### 4. Implement Staff Invitation System ⚡ 1-2 days

**Problem:** No invitation endpoint

**Quick Implementation:**

```typescript
// backend/src/modules/staff/staff.controller.ts

@Post('/businesses/:businessId/invite')
async inviteStaff(
  @Request() req,
  @Param('businessId') businessId: string,
  @Body() inviteDto: { email: string; role: StaffRole }
) {
  // Generate invitation token
  const token = crypto.randomBytes(32).toString('hex');

  // Store invitation (you'll need an invitations table)
  const invitation = await this.invitationService.create({
    email: inviteDto.email,
    role: inviteDto.role,
    business_id: businessId,
    tenant_id: req.user.tenant_id,
    token,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });

  // Send email (implement email service)
  await this.emailService.sendInvitation(inviteDto.email, token);

  return { invitation_id: invitation.id };
}
```

**Note:** Full implementation requires:
- Invitations table and entity
- Email service integration
- Invitation acceptance endpoint
- Token validation

---

### 5. Fix Data Model Alignment ⚡ 4-6 hours

**Problem:** Entity has `display_name`, DTO doesn't

**Fix:**

```typescript
// backend/src/modules/staff/dto/create-staff-member.dto.ts

export class CreateStaffMemberDto {
  @ApiProperty()
  @IsUUID()
  user_id: string;

  @ApiProperty()
  @IsUUID()
  business_id: string;

  // ADD THIS:
  @ApiProperty()
  @IsString()
  @MaxLength(100)
  display_name: string;

  // RENAME THIS:
  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  profile_image_url?: string;  // was photo_url

  // ... rest of fields
}
```

OR generate display_name automatically:

```typescript
// In staff.service.ts create method:
async create(tenantId: string, createStaffDto: CreateStaffMemberDto): Promise<StaffMember> {
  // Fetch user to get name
  const user = await this.userRepository.findOne({
    where: { id: createStaffDto.user_id }
  });

  const staff = this.staffRepository.create({
    ...createStaffDto,
    tenant_id: tenantId,
    display_name: `${user.first_name} ${user.last_name}`,  // Auto-generate
  });

  return this.staffRepository.save(staff);
}
```

---

## Quick Test Checklist

After each fix, test:

1. **After Fix #1:**
   - [ ] Navigate to /admin/staff
   - [ ] Page loads without 404
   - [ ] Staff list renders (even if empty)

2. **After Fix #2:**
   - [ ] Role badges display correctly
   - [ ] Role filter dropdown works
   - [ ] Can create staff with role

3. **After Fix #3:**
   - [ ] Can view staff services
   - [ ] Can assign services
   - [ ] Services persist after refresh

4. **After Fix #4:**
   - [ ] Can click "Invite Staff"
   - [ ] Form submits successfully
   - [ ] Email is sent (check logs)

5. **After Fix #5:**
   - [ ] Can create staff successfully
   - [ ] Staff appears in list
   - [ ] No console errors

---

## Common Issues During Implementation

### Issue: Migration fails
**Solution:** Check PostgreSQL user has CREATE TYPE permission

### Issue: TypeORM circular dependency
**Solution:** Use `() => EntityName` in relations

### Issue: Frontend still shows 404
**Solution:** Clear browser cache and rebuild frontend

### Issue: Types mismatch in frontend
**Solution:** Update `frontend/src/types/admin.types.ts` to match backend

---

## Testing Commands

```bash
# Backend tests
cd backend
npm run test:e2e -- --testPathPattern=staff

# Run specific migration
npm run migration:run

# Revert migration
npm run migration:revert

# Frontend build
cd frontend
npm run build

# Start dev server
npm run dev
```

---

## Need More Detail?

- **Full technical analysis:** See `STAFF_MANAGEMENT_QA_REPORT.md`
- **Executive summary:** See `STAFF_MANAGEMENT_QA_SUMMARY.md`
- **All 19 issues documented:** Full report has complete details

---

## Estimated Timeline

| Phase | Time | Result |
|-------|------|--------|
| Fix #1 | 2-4 hours | Staff list works |
| Fix #2 | 4-6 hours | Roles work |
| Fix #3 | 1-2 days | Service assignment works |
| Fix #4 | 1-2 days | Invitation works |
| Fix #5 | 4-6 hours | Staff creation works |
| **Total** | **3-5 days** | **Basic functionality complete** |

---

**Questions?** See full QA report for detailed explanations and alternatives.
