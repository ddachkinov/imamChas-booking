# Task: Authentication and Tenancy Backend

## Task Title
Implement Authentication, Authorization, and Multi-Tenant Context Management

## Description

Build the complete authentication and authorization system for the booking platform, including user registration, login, JWT token management, password reset, multi-factor authentication (MFA), OAuth integration, role-based access control (RBAC), and tenant context isolation. This system forms the security foundation for the entire platform.

The implementation must support:
- Email/password authentication with secure password hashing
- JWT-based session management with access and refresh tokens
- Multi-factor authentication (TOTP and SMS)
- OAuth 2.0 integration (Google, Facebook, Apple)
- Tenant context isolation for multi-tenant architecture
- Role-based access control with granular permissions
- Session management with concurrent session limits
- Password reset flow with secure tokens
- Account lockout after failed login attempts

This task is critical path and must be completed before other modules can properly implement authorization checks.

## Acceptance Criteria

### User Registration
- [ ] User can register with email, password, first name, last name
- [ ] Email must be unique within tenant
- [ ] Password must meet complexity requirements (min 8 chars, uppercase, lowercase, number)
- [ ] Password is hashed using Argon2id with appropriate cost parameters
- [ ] Verification email sent within 5 minutes of registration
- [ ] User account marked as unverified until email confirmed
- [ ] Registration API returns JWT tokens for immediate login after registration
- [ ] Duplicate email registration returns 409 Conflict error

### Email Verification
- [ ] Verification token is 256-bit cryptographically random
- [ ] Verification token expires after 24 hours
- [ ] Verification token is single-use (invalidated after verification)
- [ ] Successful verification marks user email_verified as true
- [ ] Expired or invalid token returns clear error message
- [ ] User can request new verification email (rate limited to 3 per hour)

### Email/Password Login
- [ ] User can login with email and password
- [ ] Login returns access token (1 hour expiry) and refresh token (30 days expiry)
- [ ] Access token is JWT signed with RS256 algorithm
- [ ] Access token includes user ID, tenant ID, roles, and permissions
- [ ] Refresh token is stored in database with expiry timestamp
- [ ] Invalid credentials return 401 Unauthorized
- [ ] Unverified email can login but receives warning in response
- [ ] Failed login attempts are tracked per user
- [ ] Account locked after 5 consecutive failed attempts (15 minute lockout)

### JWT Token Management
- [ ] Access tokens signed with RSA private key
- [ ] Public key available for token verification
- [ ] Token verification checks signature, expiry, issuer, audience
- [ ] Revoked tokens stored in Redis with expiry matching token TTL
- [ ] Token revocation check occurs on every authenticated request
- [ ] Token refresh endpoint accepts refresh token and returns new access/refresh token pair
- [ ] Old refresh token invalidated when new one issued (token rotation)
- [ ] Refresh token can only be used once
- [ ] Invalid or expired refresh token returns 401 Unauthorized

### Password Reset
- [ ] User can request password reset via email
- [ ] Reset token is 256-bit cryptographically random
- [ ] Reset token expires after 1 hour
- [ ] Reset token is single-use (invalidated after password change)
- [ ] Reset email sent within 5 minutes of request
- [ ] Password reset rate limited to 5 requests per hour per email
- [ ] Reset request always returns success to prevent email enumeration
- [ ] New password must meet complexity requirements
- [ ] New password cannot match previous 5 passwords
- [ ] Successful password reset invalidates all existing sessions
- [ ] User notified via email when password changed

### Multi-Factor Authentication (MFA)
- [ ] User can enable TOTP-based MFA
- [ ] TOTP secret is 160-bit cryptographically random
- [ ] QR code generated for TOTP secret
- [ ] User must verify TOTP code before MFA is enabled
- [ ] 10 backup codes generated when MFA enabled (single-use)
- [ ] Backup codes are hashed before storage
- [ ] Login with MFA requires TOTP code after password
- [ ] Invalid MFA code returns 401 Unauthorized
- [ ] MFA code is 6 digits, valid for 30 second window
- [ ] User can disable MFA with current password and TOTP code
- [ ] SMS-based MFA supported as alternative (Phase 2)

### OAuth Integration
- [ ] Google OAuth login redirects to Google authorization URL
- [ ] Google OAuth callback exchanges code for tokens
- [ ] User profile retrieved from Google API
- [ ] New user created automatically on first OAuth login
- [ ] Existing user linked if email matches
- [ ] OAuth tokens stored securely (encrypted)
- [ ] OAuth refresh token used to maintain access
- [ ] Facebook and Apple OAuth supported with same flow
- [ ] OAuth login returns same JWT tokens as email/password login

### Tenant Context Management
- [ ] Tenant ID extracted from JWT token on every request
- [ ] Tenant context set in request scope (thread-local or similar)
- [ ] All database queries automatically filtered by tenant ID
- [ ] Missing tenant ID in token returns 401 Unauthorized
- [ ] Invalid tenant ID returns 403 Forbidden
- [ ] Suspended tenant returns 403 Forbidden with specific error message
- [ ] Tenant context middleware runs early in request pipeline
- [ ] Tenant isolation enforced at ORM level (query filters)

### Role-Based Access Control
- [ ] User can have multiple roles across different scopes (tenant, business, location)
- [ ] Roles assigned via UserRole junction table
- [ ] Permissions checked on every protected endpoint
- [ ] Permission format: resource:action:scope (e.g., appointment:create:location)
- [ ] Permission resolution checks explicit deny, explicit allow, inherited permissions, default deny
- [ ] Insufficient permissions return 403 Forbidden with specific permission required
- [ ] Permissions cached in JWT token for performance
- [ ] Permission changes trigger token revocation and re-login

### Session Management
- [ ] User can have maximum 5 concurrent sessions (configurable)
- [ ] Oldest session automatically terminated when limit exceeded
- [ ] Session tracking stored in Redis with user ID and device fingerprint
- [ ] Logout invalidates current session token
- [ ] Logout all sessions endpoint revokes all user's refresh tokens
- [ ] Session idle timeout: 30 minutes (configurable)
- [ ] Session absolute timeout: 24 hours (configurable)
- [ ] Device fingerprint includes user agent and IP address

### Account Lockout
- [ ] Failed login attempts tracked per user in Redis
- [ ] Counter increments on failed login
- [ ] Counter resets on successful login
- [ ] After 5 failures, account locked for 15 minutes
- [ ] Progressive lockout: 15min, 30min, 1hr, 24hr on repeated violations
- [ ] Lockout notification sent via email
- [ ] Admin or password reset can unlock account
- [ ] Lockout status checked before password verification

## Implementation Details

### Components to Build

**Auth Module Structure:**
- auth.module.ts: NestJS module definition
- auth.controller.ts: Authentication endpoints
- auth.service.ts: Core authentication logic
- jwt.service.ts: JWT token generation, verification, revocation
- password.service.ts: Password hashing, validation, reset tokens
- mfa.service.ts: MFA setup, verification, backup codes
- oauth.controller.ts: OAuth callback endpoints
- oauth.service.ts: OAuth provider integration
- guards/jwt-auth.guard.ts: Request authentication guard
- guards/roles.guard.ts: Role-based authorization guard
- guards/permissions.guard.ts: Permission-based authorization guard
- strategies/jwt.strategy.ts: Passport JWT strategy
- strategies/google.strategy.ts: Passport Google OAuth strategy
- strategies/facebook.strategy.ts: Passport Facebook OAuth strategy
- decorators/current-user.decorator.ts: Extract current user from request
- decorators/permissions.decorator.ts: Define required permissions

**Tenants Module Structure:**
- tenants.module.ts: NestJS module definition
- tenants.service.ts: Tenant management operations
- tenant-context.service.ts: Tenant context management
- middleware/tenant-context.middleware.ts: Extract and set tenant context
- guards/tenant-isolation.guard.ts: Enforce tenant isolation

**Users Module Structure:**
- users.module.ts: NestJS module definition
- users.controller.ts: User management endpoints
- users.service.ts: User CRUD operations
- entities/user.entity.ts: User database entity
- entities/user-role.entity.ts: User-role junction entity
- entities/role.entity.ts: Role entity
- entities/permission.entity.ts: Permission entity
- entities/role-permission.entity.ts: Role-permission junction entity

### Database Entities

**User Entity:**
- Fields: id (UUID), tenant_id (UUID), email (string), email_verified (boolean), password_hash (string), password_salt (string), first_name (string), last_name (string), display_name (string), phone_number (string), phone_verified (boolean), language (string), timezone (string), status (enum), mfa_enabled (boolean), mfa_method (enum), mfa_secret (string encrypted), oauth_provider (string), oauth_provider_id (string), last_login_at (timestamp), created_at (timestamp), updated_at (timestamp), deleted_at (timestamp nullable)
- Indexes: Unique on tenant_id + email, Index on tenant_id + status, Index on oauth_provider + oauth_provider_id
- Relationships: Belongs to Tenant, Has many UserRole

**UserRole Entity:**
- Fields: id (UUID), user_id (UUID), role_id (UUID), scope_type (enum: TENANT, BUSINESS, LOCATION), scope_id (UUID nullable), granted_by (UUID), granted_at (timestamp), expires_at (timestamp nullable), created_at (timestamp)
- Indexes: Unique on user_id + role_id + scope_type + scope_id, Index on user_id, Index on role_id
- Relationships: Belongs to User, Belongs to Role

**Role Entity:**
- Fields: id (UUID), tenant_id (UUID), name (string), description (string), is_system_role (boolean), scope (enum: TENANT, BUSINESS, LOCATION), created_at (timestamp), updated_at (timestamp), deleted_at (timestamp nullable)
- Indexes: Unique on tenant_id + name, Index on tenant_id + scope
- Relationships: Belongs to Tenant, Has many RolePermission, Has many UserRole

**Permission Entity:**
- Fields: id (UUID), resource (string), action (string), scope (enum: TENANT, BUSINESS, LOCATION, OWN), description (string), is_system_permission (boolean), created_at (timestamp)
- Indexes: Unique on resource + action + scope
- Relationships: Has many RolePermission

**RolePermission Entity:**
- Fields: id (UUID), role_id (UUID), permission_id (UUID), created_at (timestamp)
- Indexes: Unique on role_id + permission_id, Index on role_id, Index on permission_id
- Relationships: Belongs to Role, Belongs to Permission

**Tenant Entity:**
- Fields: id (UUID), slug (string unique), name (string), subscription_tier (enum), subscription_status (enum), subscription_started_at (timestamp), subscription_expires_at (timestamp nullable), feature_flags (JSONB), settings (JSONB), data_residency_region (string), is_self_hosted (boolean), created_at (timestamp), updated_at (timestamp), deleted_at (timestamp nullable)
- Indexes: Unique on slug, Index on subscription_status
- Relationships: Has many User, Has many Business

**Session Entity (Redis):**
- Key: session:{user_id}:{device_fingerprint}
- Value: JSON object with user_id, token_id, device_info, created_at, last_accessed_at, expires_at
- TTL: Session absolute timeout (24 hours)

**TokenRevocation (Redis):**
- Key: revoked_token:{token_id}
- Value: revoked_at timestamp
- TTL: Token expiry time (1 hour for access tokens)

**FailedLoginAttempts (Redis):**
- Key: failed_login:{user_id}
- Value: attempt count
- TTL: Lockout duration (15 minutes)

**PasswordResetToken (Database):**
- Fields: id (UUID), user_id (UUID), token_hash (string), expires_at (timestamp), used (boolean), created_at (timestamp)
- Indexes: Index on user_id, Index on token_hash
- Single-use tokens, expired tokens cleaned up by scheduled job

**EmailVerificationToken (Database):**
- Fields: id (UUID), user_id (UUID), token_hash (string), expires_at (timestamp), used (boolean), created_at (timestamp)
- Indexes: Index on user_id, Index on token_hash

### Interfaces and DTOs

**RegisterDto:**
- email: string (required, email format)
- password: string (required, min 8 chars)
- first_name: string (required)
- last_name: string (required)
- phone_number: string (optional, E.164 format)
- language: string (optional, ISO 639-1)
- timezone: string (optional, IANA timezone)
- marketing_consent: boolean (optional, default false)

**LoginDto:**
- email: string (required)
- password: string (required)
- mfa_code: string (optional)

**PasswordResetRequestDto:**
- email: string (required)

**PasswordResetConfirmDto:**
- reset_token: string (required)
- new_password: string (required)

**EnableMfaDto:**
- method: string (required, enum: totp, sms)
- phone_number: string (required if method=sms)

**VerifyMfaDto:**
- mfa_code: string (required, 6 digits)

**JwtPayload Interface:**
- user_id: string
- tenant_id: string
- email: string
- roles: array of role objects with scope
- permissions: array of permission strings
- iat: number (issued at)
- exp: number (expiry)
- jti: string (token ID for revocation)

**AuthResponse Interface:**
- access_token: string
- refresh_token: string
- expires_in: number
- token_type: string (always "Bearer")
- user: UserProfile object

### Dependencies

**External Libraries:**
- @nestjs/jwt: JWT generation and verification
- @nestjs/passport: Authentication middleware
- passport-jwt: JWT passport strategy
- passport-google-oauth20: Google OAuth strategy
- passport-facebook: Facebook OAuth strategy
- argon2: Password hashing (preferred over bcrypt)
- otplib: TOTP generation and verification
- qrcode: QR code generation for TOTP
- crypto: Built-in Node.js crypto for secure random tokens
- ioredis: Redis client for session and cache management
- class-validator: DTO validation
- class-transformer: DTO transformation

**Internal Dependencies:**
- Database connection (TypeORM or Prisma)
- Redis connection
- Email service (for verification and reset emails)
- Audit log service (log all auth events)
- Configuration service (JWT secrets, OAuth credentials, etc.)

### Key Algorithms

**Password Hashing:**
- Algorithm: Argon2id
- Parameters: memory=64MB, iterations=3, parallelism=4
- Salt: 128-bit cryptographically random per password
- Output: Argon2 hash string stored in password_hash field

**JWT Token Generation:**
- Algorithm: RS256 (RSA with SHA-256)
- Private key: 2048-bit RSA key stored securely
- Payload: JwtPayload interface
- Access token expiry: 1 hour
- Refresh token expiry: 30 days

**TOTP Generation:**
- Algorithm: HMAC-SHA1
- Secret: 160-bit (20 bytes) random
- Time step: 30 seconds
- Digits: 6
- Window: ±1 time step for verification (allows clock skew)

**Token Generation (Reset, Verification):**
- Algorithm: crypto.randomBytes(32) for 256-bit token
- Encoding: Base64 URL-safe encoding
- Storage: SHA-256 hash of token stored in database

**Permission Resolution:**
1. Check explicit deny (if any deny exists, reject)
2. Check explicit allow at user level
3. Check role permissions (direct role assignment)
4. Check inherited permissions (parent scope)
5. Default deny if no allow found

### Configuration

**JWT Configuration:**
- JWT_SECRET: RSA private key (PEM format)
- JWT_PUBLIC_KEY: RSA public key (PEM format)
- JWT_ACCESS_TOKEN_EXPIRY: 3600 (1 hour in seconds)
- JWT_REFRESH_TOKEN_EXPIRY: 2592000 (30 days in seconds)
- JWT_ISSUER: booking-platform
- JWT_AUDIENCE: booking-platform-api

**Password Policy:**
- PASSWORD_MIN_LENGTH: 8
- PASSWORD_REQUIRE_UPPERCASE: true
- PASSWORD_REQUIRE_LOWERCASE: true
- PASSWORD_REQUIRE_NUMBER: true
- PASSWORD_REQUIRE_SPECIAL: false
- PASSWORD_HISTORY_COUNT: 5

**Account Lockout:**
- MAX_FAILED_ATTEMPTS: 5
- LOCKOUT_DURATION_MINUTES: 15
- LOCKOUT_PROGRESSIVE: true

**Session Management:**
- MAX_CONCURRENT_SESSIONS: 5
- SESSION_IDLE_TIMEOUT_MINUTES: 30
- SESSION_ABSOLUTE_TIMEOUT_HOURS: 24

**OAuth Configuration:**
- GOOGLE_CLIENT_ID: from Google Cloud Console
- GOOGLE_CLIENT_SECRET: from Google Cloud Console
- GOOGLE_CALLBACK_URL: /auth/oauth/google/callback
- FACEBOOK_APP_ID: from Facebook Developer Portal
- FACEBOOK_APP_SECRET: from Facebook Developer Portal
- FACEBOOK_CALLBACK_URL: /auth/oauth/facebook/callback

## Test Scenarios

### Unit Tests

**Password Service Tests:**
- Test: hashPassword creates valid Argon2id hash
  - Input: password="Test1234"
  - Expected: Hash starts with $argon2id$, is 96+ characters
  - Edge case: Empty password should throw validation error
  - Edge case: Very long password (1000+ chars) should work

- Test: verifyPassword validates correct password
  - Input: password="Test1234", hash from hashPassword
  - Expected: Returns true
  - Edge case: Wrong password returns false
  - Edge case: Slightly different password (Test1235) returns false

- Test: Password complexity validation
  - Input: password="weak" - Expected: ValidationError (too short)
  - Input: password="NoNumbers" - Expected: ValidationError (no numbers)
  - Input: password="nonumbers1" - Expected: ValidationError (no uppercase)
  - Input: password="NONUMBERS1" - Expected: ValidationError (no lowercase)
  - Input: password="Test1234" - Expected: Valid

- Test: Password history check
  - Setup: User with 5 previous passwords
  - Input: New password matches 3rd previous password
  - Expected: ValidationError (password used recently)
  - Edge case: New password matches 6th previous password (allowed)

**JWT Service Tests:**
- Test: generateAccessToken creates valid JWT
  - Input: user with id, tenant_id, roles
  - Expected: JWT with valid signature, correct payload, expiry in 1 hour
  - Edge case: User with no roles should have empty roles array

- Test: generateRefreshToken creates and stores token
  - Input: user_id
  - Expected: Refresh token stored in database, returns token string
  - Edge case: User with existing refresh tokens, count incremented

- Test: verifyAccessToken validates signature and expiry
  - Input: Valid unexpired token
  - Expected: Returns decoded payload
  - Edge case: Expired token throws TokenExpiredError
  - Edge case: Invalid signature throws JsonWebTokenError
  - Edge case: Revoked token throws TokenRevokedError

- Test: revokeToken adds to revocation list
  - Input: token_id from JWT
  - Expected: Redis key created with TTL matching token expiry
  - Edge case: Already revoked token (idempotent operation)

**MFA Service Tests:**
- Test: generateMfaSecret creates valid TOTP secret
  - Expected: 160-bit (32 character base32) secret
  - Edge case: Multiple calls generate different secrets

- Test: generateQrCode creates QR code data URL
  - Input: secret, user email
  - Expected: Data URL starting with "data:image/png;base64,"
  - Edge case: Special characters in email handled correctly

- Test: verifyMfaCode validates correct TOTP
  - Input: secret, valid current TOTP code
  - Expected: Returns true
  - Edge case: Code from 30 seconds ago (previous window) returns true
  - Edge case: Code from 60 seconds ago returns false
  - Edge case: Invalid code (wrong digits) returns false

- Test: generateBackupCodes creates 10 unique codes
  - Expected: Array of 10 codes, each 8 characters, all unique
  - Edge case: Codes are cryptographically random

**Auth Service Tests:**
- Test: register creates user and sends verification email
  - Input: RegisterDto with valid data
  - Expected: User created in database, verification email queued
  - Edge case: Duplicate email returns ConflictException
  - Edge case: Invalid email format returns ValidationException

- Test: login with valid credentials returns tokens
  - Input: email, correct password
  - Expected: Access token and refresh token returned
  - Edge case: Unverified email returns tokens but includes warning
  - Edge case: Wrong password returns UnauthorizedException
  - Edge case: Non-existent email returns UnauthorizedException (same as wrong password to prevent enumeration)

- Test: login with MFA enabled requires MFA code
  - Input: email, correct password, no MFA code
  - Expected: Returns 401 with "MFA required" message
  - Input: email, correct password, valid MFA code
  - Expected: Tokens returned

- Test: refreshToken exchanges refresh token for new tokens
  - Input: Valid refresh token
  - Expected: New access token and refresh token, old refresh token invalidated
  - Edge case: Invalid refresh token returns UnauthorizedException
  - Edge case: Using same refresh token twice returns UnauthorizedException

- Test: Failed login attempts trigger lockout
  - Setup: User with 0 failed attempts
  - Action: 5 consecutive failed logins
  - Expected: 6th attempt returns 403 with "Account locked" message
  - Edge case: Successful login between failures resets counter
  - Edge case: After lockout duration, login allowed

**Tenant Context Service Tests:**
- Test: extractTenantId gets tenant from JWT
  - Input: Request with valid JWT containing tenant_id
  - Expected: Returns tenant_id
  - Edge case: Request without JWT throws UnauthorizedException
  - Edge case: JWT without tenant_id throws UnauthorizedException

- Test: validateTenant checks tenant status
  - Input: Tenant ID of active tenant
  - Expected: Returns tenant object
  - Edge case: Suspended tenant throws ForbiddenException
  - Edge case: Non-existent tenant throws NotFoundException

- Test: setTenantContext sets context for request
  - Input: tenant_id
  - Expected: Tenant context available in request scope
  - Edge case: Nested async operations maintain correct tenant context

### Integration Tests

**User Registration Flow:**
- Test: Complete registration and verification flow
  - Step 1: POST /auth/register with valid data
  - Expected: 201 Created, user in database, tokens returned
  - Step 2: Check email verification token created
  - Expected: Token exists in database with 24hr expiry
  - Step 3: POST /auth/verify-email with token
  - Expected: 200 OK, user.email_verified = true
  - Step 4: Login with credentials
  - Expected: 200 OK, tokens returned

**Login Flow:**
- Test: Login with email and password
  - Setup: User with verified email
  - Action: POST /auth/login with email and password
  - Expected: 200 OK, access_token and refresh_token in response
  - Verify: JWT payload contains user_id, tenant_id, roles
  - Verify: Session created in Redis

**Password Reset Flow:**
- Test: Request and complete password reset
  - Step 1: POST /auth/password-reset/request with email
  - Expected: 200 OK (always), reset email sent if user exists
  - Step 2: Check reset token created in database
  - Expected: Token exists with 1hr expiry
  - Step 3: POST /auth/password-reset/confirm with token and new password
  - Expected: 200 OK, password updated
  - Step 4: Login with new password
  - Expected: 200 OK, tokens returned
  - Verify: All previous sessions invalidated

**MFA Setup and Login Flow:**
- Test: Enable MFA and login with MFA
  - Step 1: POST /auth/mfa/enable with method=totp
  - Expected: 200 OK, secret and QR code returned
  - Step 2: POST /auth/mfa/verify with TOTP code
  - Expected: 200 OK, MFA enabled, backup codes returned
  - Step 3: Logout
  - Step 4: POST /auth/login with email and password
  - Expected: 401 with "MFA required"
  - Step 5: POST /auth/login with email, password, and valid TOTP code
  - Expected: 200 OK, tokens returned

**OAuth Login Flow:**
- Test: Google OAuth login (mocked)
  - Step 1: GET /auth/oauth/google
  - Expected: Redirect to Google authorization URL
  - Step 2: Simulate Google callback with code
  - Expected: 200 OK, tokens returned, user created or linked
  - Verify: User in database with oauth_provider = "google"
  - Verify: OAuth tokens stored encrypted

**Token Refresh Flow:**
- Test: Refresh access token
  - Step 1: Login to get tokens
  - Step 2: POST /auth/refresh with refresh_token
  - Expected: 200 OK, new access_token and refresh_token
  - Verify: Old refresh token invalidated
  - Step 3: Attempt to reuse old refresh token
  - Expected: 401 Unauthorized

**Permission-Based Access Control:**
- Test: Endpoint requires specific permission
  - Setup: User with role that has "appointment:read:location" permission
  - Action: GET /appointments with location_id
  - Expected: 200 OK, appointments returned
  - Setup: User without permission
  - Action: GET /appointments
  - Expected: 403 Forbidden with specific permission error

**Tenant Isolation:**
- Test: Users cannot access other tenant's data
  - Setup: User from Tenant A, User from Tenant B
  - Action: User A attempts to access User B's profile
  - Expected: 404 Not Found (not 403, to prevent enumeration)
  - Verify: Database query automatically filtered by tenant_id

### End-to-End Tests

**Complete User Onboarding:**
- Scenario: New business owner signs up and sets up first business
  - Action: POST /auth/register
  - Expected: Account created, verification email sent
  - Action: Click verification link
  - Expected: Email verified, redirected to dashboard
  - Action: Create business profile
  - Expected: Business created, user assigned Owner role for business
  - Action: Add first location
  - Expected: Location created under business
  - Verify: User has appropriate permissions for business and location

**Account Lockout and Recovery:**
- Scenario: User forgets password and tries multiple times
  - Action: 5 failed login attempts
  - Expected: Account locked, lockout email sent
  - Action: Wait 15 minutes (simulated)
  - Expected: Account unlocked
  - Action: Login with correct password
  - Expected: Success, failed attempt counter reset
  - Alternative: Request password reset during lockout
  - Expected: Password reset email sent, account unlocked after reset

**MFA Backup Code Usage:**
- Scenario: User enables MFA but loses authenticator app
  - Action: Enable MFA, save backup codes
  - Action: Login with email and password
  - Expected: MFA required
  - Action: Provide backup code instead of TOTP
  - Expected: Login successful, backup code marked as used
  - Action: Attempt to reuse same backup code
  - Expected: 401 Unauthorized

**Concurrent Session Management:**
- Scenario: User logs in from multiple devices
  - Action: Login from Device 1
  - Expected: Session 1 created
  - Action: Login from Devices 2, 3, 4, 5
  - Expected: Sessions 2-5 created
  - Action: Login from Device 6
  - Expected: Session 6 created, Session 1 (oldest) invalidated
  - Verify: Device 1 receives 401 on next request

**OAuth Account Linking:**
- Scenario: User has email/password account, then logs in via Google
  - Setup: User registered with email test@example.com
  - Action: Login via Google OAuth with same email
  - Expected: Google account linked to existing user
  - Verify: User can login with both email/password and Google
  - Verify: Single user record in database

### Performance Tests

**Token Generation Performance:**
- Test: Generate 1000 access tokens
  - Expected: < 100ms total (< 0.1ms per token)

**Token Verification Performance:**
- Test: Verify 1000 access tokens
  - Expected: < 50ms total (< 0.05ms per token)

**Password Hashing Performance:**
- Test: Hash 100 passwords
  - Expected: < 10 seconds total (< 100ms per hash)
  - Note: Argon2id is intentionally slow to prevent brute force

**Login Performance:**
- Test: Complete login flow (password verify, token generation, session creation)
  - Expected: < 200ms for p95
  - Edge case: With MFA verification, < 250ms

**Permission Check Performance:**
- Test: Check 1000 permission combinations
  - Expected: < 100ms total (< 0.1ms per check)
  - Note: Permissions cached in JWT, minimal database queries

### Security Tests

**SQL Injection Prevention:**
- Test: Login with SQL injection attempt in email
  - Input: email="admin'; DROP TABLE users; --"
  - Expected: Login fails gracefully, no SQL injection
  - Verify: Users table still exists

**JWT Signature Tampering:**
- Test: Modify JWT payload without re-signing
  - Setup: Valid JWT with user_id=123
  - Action: Change payload to user_id=456, keep same signature
  - Expected: Token verification fails with invalid signature error

**Token Replay Attack:**
- Test: Reuse revoked access token
  - Setup: Valid access token
  - Action: Logout (revokes token)
  - Action: Attempt to use revoked token
  - Expected: 401 Unauthorized with "Token revoked" message

**Brute Force Password Attack:**
- Test: Rapid login attempts
  - Action: 100 login attempts in 10 seconds
  - Expected: Rate limiting kicks in, requests throttled
  - Expected: After 5 failures, account locked

**Session Hijacking Prevention:**
- Test: Use token from different IP/User-Agent
  - Setup: Login from IP 1.2.3.4 with User Agent A
  - Action: Use token from IP 5.6.7.8 with User Agent B
  - Expected: Token works (no IP binding by default)
  - Note: Device fingerprint stored for audit, not enforced (would break mobile apps)

**Timing Attack on Password Verification:**
- Test: Measure password verification time for valid vs invalid users
  - Action: 1000 logins with valid usernames, wrong passwords
  - Action: 1000 logins with invalid usernames
  - Expected: Timing difference < 10ms (constant-time comparison)

## Caveats and Risks

### Security Risks

**Risk: Private Key Compromise**
- Impact: Attacker can forge valid JWT tokens
- Mitigation: Store private key in HSM or encrypted key management service, rotate keys every 90 days
- Detection: Monitor for unusual token generation patterns

**Risk: Password Hash Leakage**
- Impact: Attacker can crack passwords offline
- Mitigation: Use strong hashing (Argon2id), pepper in addition to salt, detect and respond to database breaches quickly
- Detection: Database access monitoring, regular security audits

**Risk: Session Fixation**
- Impact: Attacker can hijack user session
- Mitigation: Generate new session on login, invalidate old sessions, use secure session storage
- Detection: Monitor for unusual session patterns

**Risk: Insufficient Tenant Isolation**
- Impact: Critical - Users could access other tenants' data
- Mitigation: Comprehensive testing, Row-Level Security in database, automated tests, regular penetration testing
- Detection: Audit log analysis, anomaly detection

**Risk: MFA Bypass**
- Impact: Attacker can bypass MFA protection
- Mitigation: Require MFA for sensitive operations, backup codes properly secured, rate limit MFA attempts
- Detection: Monitor for MFA bypass attempts, alert on backup code usage

### Performance Risks

**Risk: Argon2id Hashing Too Slow**
- Impact: Login endpoint slow, poor user experience
- Mitigation: Tune Argon2id parameters (memory, iterations), consider CPU vs memory trade-off, horizontal scaling
- Measurement: Target < 200ms for login including hashing

**Risk: Redis Unavailability**
- Impact: Token revocation checks fail, session management broken
- Mitigation: Redis cluster with replication, circuit breaker pattern, graceful degradation (skip revocation check temporarily)
- Detection: Monitor Redis health, alert on connection failures

**Risk: Database Query Performance on Permission Checks**
- Impact: Slow API responses
- Mitigation: Cache permissions in JWT token, database indexes on role/permission tables, periodic permission refresh
- Measurement: Target < 50ms for permission resolution

### Implementation Risks

**Risk: Complex Permission System**
- Impact: Difficult to implement correctly, bugs in authorization
- Mitigation: Start with simple RBAC, add granular permissions incrementally, comprehensive tests
- Testing: Permission matrix testing (all role/permission combinations)

**Risk: OAuth Integration Complexity**
- Impact: OAuth login failures, poor user experience
- Mitigation: Use battle-tested libraries (Passport.js), comprehensive error handling, fallback to email/password
- Testing: Mock OAuth providers in tests, test error scenarios

**Risk: Token Rotation Logic Errors**
- Impact: Users logged out unexpectedly, or old tokens still work
- Mitigation: Clear token lifecycle documentation, thorough testing, monitoring
- Testing: Simulate concurrent token refresh attempts, race conditions

### Operational Risks

**Risk: Key Rotation Downtime**
- Impact: All tokens invalid during key rotation
- Mitigation: Support multiple public keys simultaneously (key versioning), gradual rollout, overlap period
- Process: Add new key, use new key for signing, old key still validates, retire old key after token expiry

**Risk: Account Lockout False Positives**
- Impact: Legitimate users locked out
- Mitigation: Clear error messages, easy unlock process (password reset), support escalation path
- Monitoring: Track lockout rates, alert on spikes

**Risk: MFA Setup Complexity**
- Impact: Users abandon MFA setup, security reduced
- Mitigation: Clear UI/UX, QR code AND manual entry option, backup codes explained, help documentation
- Monitoring: Track MFA adoption rate

## Estimated Effort

**Size: Large (3-4 weeks for 2 developers)**

**Breakdown:**
- Database schema and migrations: 2 days
- Basic auth (register, login, JWT): 3 days
- Password management (reset, complexity, history): 2 days
- MFA implementation (TOTP, backup codes): 3 days
- OAuth integration (Google, Facebook, Apple): 4 days
- Tenant context and isolation: 2 days
- RBAC and permissions system: 4 days
- Session management and lockout: 2 days
- Unit tests: 3 days
- Integration tests: 3 days
- E2E tests: 2 days
- Security testing and hardening: 2 days
- Documentation: 2 days
- Buffer for unexpected issues: 4 days

**Dependencies:**
- Database infrastructure setup (PostgreSQL, migrations)
- Redis setup for session and cache
- Email service integration
- Configuration management (environment variables, secrets)

**Parallel Work Opportunities:**
- OAuth integration can be done in parallel with MFA
- Permission system can be done in parallel with session management
- Testing can overlap with feature development

## Owner Role

**Primary: Backend Developer (Full-Stack acceptable with strong backend experience)**

**Skills Required:**
- Strong understanding of authentication and authorization concepts
- Experience with JWT, OAuth 2.0, TOTP
- Cryptography basics (hashing, signing, random number generation)
- Security best practices (OWASP Top 10)
- NestJS or similar Node.js framework
- TypeScript
- PostgreSQL and Redis
- Unit and integration testing (Jest)

**Secondary Roles:**
- Security Specialist: Review implementation for security vulnerabilities
- DevOps: Set up Redis, configure secrets management
- QA Engineer: Comprehensive security and E2E testing

**Knowledge Transfer Required:**
- Document authentication flow diagrams
- Document permission resolution algorithm
- Document key rotation process
- Create runbook for account lockout handling
- Create runbook for security incident response
