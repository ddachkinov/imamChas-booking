# Testing Strategy for ImamChas Booking Platform

## Overview

This document outlines the comprehensive testing strategy to prevent bugs and ensure system reliability.

## Problem Analysis

Recent issues encountered:
1. **Entity Schema Mismatches**: TypeORM entities didn't match database schema
2. **Data Structure Incompatibilities**: Frontend expected different data structures than backend returned
3. **Missing Validation**: No tests to catch these issues before deployment

## Testing Layers

### 1. Schema Validation Tests (`backend/src/test/schema-validation.spec.ts`)

**Purpose**: Ensure TypeORM entities match actual database schema

**What it tests**:
- Every entity column exists in the database
- No extra columns in entities that don't exist in database
- Prevents runtime `QueryFailedError: column does not exist` errors

**How to run**:
```bash
cd backend
npm run test:schema
```

**When to run**:
- Before every deployment
- After any entity changes
- As part of CI/CD pipeline

### 2. API Integration Tests

**Purpose**: Test individual API endpoints

**Files**:
- `backend/src/modules/calendar/calendar.integration.spec.ts`
- `backend/src/modules/appointments/appointments.integration.spec.ts` (to be created)
- `backend/src/modules/services/services.integration.spec.ts` (to be created)

**What it tests**:
- Endpoint returns correct status codes
- Response has expected data structure
- Error handling works correctly
- Authentication/authorization works

**How to run**:
```bash
cd backend
npm run test:integration
```

### 3. End-to-End Tests (`backend/test/e2e-calendar.spec.ts`)

**Purpose**: Test complete user workflows

**What it tests**:
- Full booking workflow (view calendar → check availability → create appointment → complete)
- Blocked time management workflow
- Calendar export workflow
- Multi-step operations work together

**How to run**:
```bash
cd backend
npm run test:e2e
```

### 4. Frontend Component Tests (To be implemented)

**Purpose**: Test React components in isolation

**What to test**:
- Components handle different data structures
- Loading states display correctly
- Error states display correctly
- User interactions work as expected

**Location**: `frontend/src/**/*.test.tsx`

**How to run**:
```bash
cd frontend
npm run test
```

### 5. Frontend E2E Tests with Playwright (To be implemented)

**Purpose**: Test actual user interactions in real browser

**What to test**:
- Login flow
- Calendar navigation (Day/Week/Month views)
- Creating appointments
- Editing appointments
- Calendar search and filtering

**Location**: `e2e/**/*.spec.ts`

**How to run**:
```bash
npm run test:e2e:frontend
```

## Test Execution Strategy

### Local Development

Before committing code:
```bash
# Run schema validation
cd backend && npm run test:schema

# Run unit tests
npm run test

# Run integration tests for changed modules
npm run test:integration -- calendar
```

### Pre-Deployment Checklist

1. ✅ All schema validation tests pass
2. ✅ All integration tests pass
3. ✅ All E2E tests pass
4. ✅ Manual smoke test on staging environment

### CI/CD Pipeline (Recommended)

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: booking_test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci

      - name: Run schema validation tests
        run: cd backend && npm run test:schema
        env:
          DB_HOST: localhost
          DB_PORT: 5432
          DB_USERNAME: postgres
          DB_PASSWORD: postgres
          DB_DATABASE: booking_test

      - name: Run integration tests
        run: cd backend && npm run test:integration

      - name: Run E2E tests
        run: cd backend && npm run test:e2e

      - name: Run frontend tests
        run: cd frontend && npm run test
```

## Common Issues and Solutions

### Issue 1: Schema Mismatch Errors

**Symptom**: `QueryFailedError: column XYZ does not exist`

**Solution**:
1. Run schema validation tests: `npm run test:schema`
2. Compare entity with database schema using `\d table_name` in psql
3. Update entity to match database
4. Or create migration to update database

**Prevention**: Always run schema tests before deployment

### Issue 2: Data Structure Mismatches

**Symptom**: Frontend shows "Cannot read property X of undefined"

**Solution**:
1. Check API integration tests for response structure
2. Update backend to return expected structure
3. Or update frontend to handle actual structure

**Prevention**: Write integration tests that verify response structure

### Issue 3: Broken User Workflows

**Symptom**: Multi-step processes fail at certain points

**Solution**:
1. Run E2E tests to identify which step fails
2. Check integration tests for individual endpoints
3. Fix the failing endpoint

**Prevention**: Write E2E tests for all critical workflows

## Adding New Tests

### For New Entities

1. Add to schema validation tests:
```typescript
describe('NewEntity Entity', () => {
  it('should have all columns that exist in database', async () => {
    const dbColumns = await getTableColumns('new_table');
    const entityColumns = getEntityColumns(NewEntity);

    const missingInEntity = Array.from(dbColumns).filter(
      (col) => !entityColumns.has(col)
    );

    expect(missingInEntity).toEqual([]);
  });
});
```

### For New API Endpoints

1. Create integration test file: `module-name.integration.spec.ts`
2. Test all HTTP methods and response structures
3. Test error cases (401, 400, 404, 500)

### For New User Workflows

1. Add to E2E test file
2. Test happy path (everything works)
3. Test error paths (what happens when things fail)

## Monitoring and Alerts

### Recommended Setup

1. **Sentry** for error tracking
2. **DataDog** or **New Relic** for performance monitoring
3. **GitHub Actions** for automated testing
4. **Slack/Discord** notifications for test failures

## Testing Best Practices

1. **Write tests before fixing bugs**: Turn every bug into a test case
2. **Test edge cases**: Empty arrays, null values, missing fields
3. **Use realistic test data**: Match production data patterns
4. **Keep tests independent**: Each test should work in isolation
5. **Mock external services**: Don't rely on external APIs in tests
6. **Clean up after tests**: Delete test data to avoid pollution

## Next Steps

1. ✅ Create schema validation tests
2. ✅ Create calendar integration tests
3. ✅ Create calendar E2E tests
4. ⏳ Create tests for all other modules (appointments, services, staff, clients)
5. ⏳ Add frontend component tests
6. ⏳ Add Playwright E2E tests
7. ⏳ Set up CI/CD pipeline
8. ⏳ Configure error monitoring

## Resources

- [NestJS Testing Documentation](https://docs.nestjs.com/fundamentals/testing)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
