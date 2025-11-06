# SECURITY-PRIVACY.md

## 1. Overview

This document defines the security and privacy architecture for the booking platform, covering authentication, authorization, data protection, GDPR compliance, accessibility, and audit logging. The platform prioritizes security and privacy by design, implementing defense-in-depth strategies across all layers.

### Security Principles

**Defense in Depth:**
Multiple layers of security controls to protect against various attack vectors.

**Least Privilege:**
Users and services granted minimum permissions necessary for their function.

**Zero Trust:**
No implicit trust based on network location; all requests authenticated and authorized.

**Privacy by Design:**
Privacy considerations integrated into system architecture from inception.

**Secure by Default:**
Security features enabled by default; insecure configurations require explicit action.

**Separation of Duties:**
Critical operations require multiple parties or approvals.

---

## 2. Authentication Strategy

### 2.1 Authentication Methods

**Primary Authentication: JWT (JSON Web Tokens)**

**Access Tokens:**
- Lifetime: 1 hour
- Algorithm: RS256 (RSA signature with SHA-256)
- Payload includes:
  - User ID
  - Tenant ID
  - Roles and permissions (cached for performance)
  - Issued at timestamp
  - Expiration timestamp
  - Token ID (for revocation)
- Stored: Client-side (memory or sessionStorage, never localStorage for security)

**Refresh Tokens:**
- Lifetime: 30 days (configurable per tenant)
- Rotation: New refresh token issued on each refresh operation
- Storage: Secure HTTP-only cookie or encrypted client storage
- Revocation: Immediate via token blacklist in Redis
- One-time use: Previous refresh token invalidated upon use

**Token Signing:**
- Private key stored in Hardware Security Module (HSM) or encrypted key management service
- Public key distributed for verification
- Key rotation every 90 days with overlap period for gradual transition
- Separate key pairs per environment (production, staging, development)

**Session Management:**
- Concurrent session limit: 5 per user (configurable)
- Idle timeout: 30 minutes of inactivity
- Absolute timeout: 24 hours maximum session duration
- Session tracking: Redis-based session store with TTL
- Device fingerprinting: Browser and device identification for suspicious activity detection

**Secondary Authentication Methods:**

**OAuth 2.0 / OpenID Connect:**
- Supported providers: Google, Facebook, Apple, Microsoft
- Authorization code flow with PKCE (Proof Key for Code Exchange)
- State parameter for CSRF protection
- Scope limiting: Request only necessary permissions
- Token storage: Same security standards as primary authentication
- Account linking: Associate OAuth accounts with existing email-based accounts

**API Keys (for integrations):**
- Format: Prefix-based for identification (e.g., pk_live_, sk_test_)
- Storage: Hashed in database using bcrypt (cost factor 12)
- Scope limitation: API keys restricted to specific operations
- Rate limiting: Stricter limits than user sessions
- Rotation: Manual rotation with grace period for migration
- Revocation: Immediate via blacklist

**Magic Links (passwordless):**
- One-time use tokens
- Lifetime: 15 minutes
- Delivery: Email only (verified addresses)
- Rate limiting: Maximum 3 requests per hour per email
- Token binding: IP address and user agent verification

### 2.2 Multi-Factor Authentication (MFA)

**MFA Implementation:**

**Time-Based One-Time Passwords (TOTP):**
- Algorithm: RFC 6238 TOTP
- Time step: 30 seconds
- Digits: 6
- Supported apps: Google Authenticator, Authy, Microsoft Authenticator, 1Password
- Secret generation: Cryptographically secure random 160-bit secret
- QR code generation: Server-side with expiration after initial scan
- Backup codes: 10 single-use recovery codes, securely hashed

**SMS-Based OTP:**
- Delivery: via Twilio or similar provider
- Code: 6 digits, numeric
- Lifetime: 10 minutes
- Rate limiting: Maximum 5 SMS per hour per number
- Cost consideration: SMS costs may apply, premium feature or charged per use

**MFA Enforcement:**
- Optional by default for clients
- Mandatory for business owners and managers (configurable)
- Mandatory for platform administrators
- Grace period: 7 days for users to set up after enforcement
- Remember device: 30-day trusted device cookie (encrypted, signed)
- Backup codes: Required setup before MFA can be enabled

**MFA Bypass (Emergency Access):**
- Account recovery via identity verification
- Support team escalation with approval workflow
- Audit log entry for all MFA bypass operations
- Temporary bypass only (maximum 24 hours)

### 2.3 Password Policy

**Requirements:**
- Minimum length: 8 characters (recommended: 12+)
- Complexity: At least one uppercase, one lowercase, one number
- Special characters: Encouraged but not required
- No common passwords: Check against list of 100,000 most common passwords
- No personal information: Prevent use of email, name, phone in password
- No previous passwords: Last 5 passwords remembered and blocked

**Password Hashing:**
- Algorithm: Argon2id (memory-hard function, resistant to GPU/ASIC attacks)
- Parameters:
  - Memory: 64 MB
  - Iterations: 3
  - Parallelism: 4 threads
  - Salt: 128-bit cryptographically random salt per password
- Fallback: bcrypt (cost factor 12) for legacy compatibility
- Pepper: Additional secret key stored separately from database
- Migration: Automatic rehashing on successful login when algorithm updated

**Password Reset:**
- Reset token: 256-bit cryptographically random token
- Token lifetime: 1 hour
- Token storage: Hashed in database
- Single use: Token invalidated after use
- Rate limiting: Maximum 5 reset requests per hour per email
- Notification: Email sent to account on password change
- Old password invalidation: Immediate logout from all sessions

**Account Lockout:**
- Failed attempts threshold: 5 consecutive failures
- Lockout duration: 15 minutes (progressive backoff: 15min, 30min, 1hr, 24hr)
- Lockout scope: Per account (not per IP to prevent DoS)
- Unlock methods: Time-based automatic unlock, password reset, support intervention
- Notification: Email alert on account lockout

### 2.4 API Authentication

**Bearer Token Authentication:**
- Header format: `Authorization: Bearer <token>`
- Token validation on every request
- Token verification:
  - Signature verification using public key
  - Expiration check
  - Revocation check (Redis lookup)
  - Issuer validation
  - Audience validation (API endpoint)
- Performance: Token verification < 10ms (cached public key, Redis revocation check)

**API Key Authentication:**
- Header format: `X-API-Key: <key>` or `Authorization: Bearer <api_key>`
- Key prefix identification for routing (public vs. secret keys)
- Scope enforcement: API key permissions subset of user permissions
- Environment separation: Separate keys for production/sandbox
- Key metadata: Last used timestamp, request count, IP restrictions

**Rate Limiting by Authentication Method:**
- Authenticated users: 1000 requests per 15 minutes per user
- API keys: 5000 requests per 15 minutes per key (configurable)
- Anonymous (public endpoints): 100 requests per 15 minutes per IP
- Burst allowance: 20% over limit for short bursts
- Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## 3. Authorization Strategy

### 3.1 Role-Based Access Control (RBAC)

**Role Hierarchy:**

**Platform Roles (Multi-Tenant SaaS only):**
- Platform Administrator: Full system access, tenant management, infrastructure control
- Platform Support: Read-only access across tenants for support purposes
- Platform Developer: Access to logs, metrics, debugging tools

**Tenant-Level Roles:**
- Tenant Owner: Full control over tenant, billing, subscription, all businesses
- Tenant Administrator: Administrative access to all businesses, cannot modify subscription

**Business-Level Roles:**
- Business Owner: Full control over business, locations, staff, settings
- Business Manager: Manage operations, appointments, staff schedules, view reports
- Business Accountant: View financial reports, manage payments, limited operational access
- Marketing Manager: Manage campaigns, view analytics, limited operational access

**Location-Level Roles:**
- Location Manager: Manage single location operations, staff at location, appointments
- Receptionist: Book appointments, check-in clients, limited client management
- Staff Member: View own schedule, manage own availability, complete appointments
- Service Provider: Same as Staff Member plus client notes access

**Client Roles:**
- Client: Book appointments, manage own profile, view own appointment history
- Guest: Limited booking capabilities, no persistent profile

**Role Assignment:**
- Multiple roles: Users can have different roles across different scopes
- Role scope: Roles applied at tenant, business, or location level
- Inheritance: Location roles inherit business permissions (configurable)
- Role expiration: Time-limited role assignments for temporary access

### 3.2 Permission Model

**Permission Structure:**
- Format: `<resource>:<action>:<scope>`
- Example: `appointment:create:location` - Can create appointments at assigned location

**Resource Types:**
- `appointment` - Appointments
- `client` - Client profiles
- `staff` - Staff members
- `service` - Services and add-ons
- `location` - Locations
- `business` - Business settings
- `payment` - Payments and refunds
- `report` - Analytics and reports
- `user` - User accounts
- `role` - Roles and permissions
- `integration` - Third-party integrations
- `settings` - Configuration

**Actions:**
- `create` - Create new resource
- `read` - View resource
- `update` - Modify resource
- `delete` - Delete resource
- `export` - Export data
- `approve` - Approve pending resource
- `manage` - Full management (create, read, update, delete)

**Scopes:**
- `tenant` - All resources in tenant
- `business` - All resources in business
- `location` - Resources at specific location
- `own` - Own resources only
- `assigned` - Resources assigned to user
- `all` - No scope restriction

**Permission Examples:**
- `appointment:read:location` - View appointments at assigned location
- `appointment:create:location` - Book appointments at location
- `appointment:update:own` - Reschedule own appointments only
- `client:manage:business` - Full client management across business
- `payment:read:location` - View payments at location
- `payment:refund:business` - Issue refunds across business
- `report:export:business` - Export reports for business
- `settings:update:tenant` - Modify tenant-level settings

**Permission Checking:**
- Check on every API request
- Permission resolution order:
  1. Check explicit deny (denies take precedence)
  2. Check explicit allow
  3. Check inherited permissions from parent scope
  4. Default deny
- Caching: Permissions cached in JWT for performance, cache invalidation on role change
- Dynamic permissions: Special logic for resource ownership (e.g., user can always update own profile)

### 3.3 Attribute-Based Access Control (ABAC)

**Context-Aware Authorization:**

**User Attributes:**
- User role and permissions
- User location assignment
- User employment status (active, on leave, terminated)
- MFA status
- Email verification status
- Account age and trustworthiness score

**Resource Attributes:**
- Resource owner
- Resource status (draft, active, completed, cancelled)
- Resource visibility (public, private, business-only)
- Resource location
- Resource creation date

**Environmental Attributes:**
- Time of day and day of week
- Request IP address and geolocation
- Device type and fingerprint
- Network (internal vs. external)
- Tenant subscription tier and features enabled

**Policy Examples:**
- Clients can only cancel appointments more than 24 hours in advance
- Staff can only complete appointments during business hours
- Financial reports only accessible from trusted networks (optional)
- Refunds over certain amount require manager approval
- Client data export requires MFA verification
- Off-hours access requires additional authentication

**Policy Enforcement:**
- Policy engine: Open Policy Agent (OPA) or custom policy service
- Policy language: Declarative policy definitions (OPA Rego or similar)
- Policy versioning: Track changes to authorization policies
- Policy testing: Automated testing of policy changes before deployment

### 3.4 Data-Level Authorization

**Row-Level Security:**
- Tenant isolation: All queries automatically filtered by tenant_id
- Business scope: Users only access businesses they're assigned to
- Location scope: Users only access locations they're authorized for
- Ownership: Users have enhanced access to resources they own

**Implementation:**
- Database-level: PostgreSQL Row-Level Security (RLS) policies
- Application-level: ORM query filters (Prisma, GORM)
- Double-check: Both database and application enforce isolation

**Field-Level Security:**
- Sensitive fields masked based on permissions
- Examples:
  - Client SSN/tax ID: Only visible to business owner
  - Staff salary and commission: Only visible to owner and accountant
  - Payment details: Only visible to authorized financial staff
  - Client notes: Only visible to staff who created or assigned
- Redaction: Sensitive fields returned as null or masked value (e.g., "***-**-1234")

**Query Authorization:**
- Parameterized queries: Prevent SQL injection
- Query complexity limits: Prevent denial of service via expensive queries
- Relation traversal limits: Prevent unauthorized data access via deep joins
- Rate limiting: Per-user query rate limits

---

## 4. Tenant Isolation

### 4.1 Multi-Tenant Isolation Strategies

**Database Isolation:**

**Strategy 1: Shared Database with Tenant ID (Default)**
- Single PostgreSQL database with tenant_id column on all tables
- Row-Level Security (RLS) policies enforce tenant filtering
- Indexes include tenant_id for performance
- Tenant ID in all foreign keys
- Application enforces tenant context on all queries

**Advantages:**
- Cost-effective for large number of tenants
- Simplified backups and maintenance
- Efficient resource utilization

**Disadvantages:**
- Risk of data leakage if isolation fails
- Noisy neighbor problem (one tenant affects others)
- Cannot customize database schema per tenant

**Mitigation:**
- Comprehensive automated testing of tenant isolation
- Query monitoring for missing tenant_id filters
- Database-level RLS as fallback
- Regular security audits and penetration testing

**Strategy 2: Separate Schema per Tenant (Enterprise Tier)**
- Each tenant has dedicated PostgreSQL schema within shared database
- Complete logical separation
- Custom schema per tenant possible
- Simplified data export and migration

**Advantages:**
- Strong logical isolation
- Per-tenant schema customization
- Easier compliance audits (data clearly separated)
- Simplified tenant data export/deletion

**Disadvantages:**
- Schema limit per database (PostgreSQL: ~10,000 schemas practical)
- Increased connection overhead
- More complex migrations

**Strategy 3: Separate Database per Tenant (Premium/Regulated)**
- Each tenant has dedicated PostgreSQL database instance
- Maximum isolation
- Per-tenant backup and restore
- Regulatory compliance for sensitive industries (healthcare, finance)

**Advantages:**
- Complete isolation (no shared-fate risk)
- Per-tenant performance tuning
- Independent scaling
- Easiest compliance demonstration

**Disadvantages:**
- Higher infrastructure cost
- More complex operational overhead
- Slower global queries across tenants (analytics)

**Tenant Context Enforcement:**

**Request Processing:**
1. Extract tenant ID from JWT, subdomain, or custom domain
2. Validate tenant exists and subscription is active
3. Set tenant context in request scope (thread-local or context variable)
4. All database queries automatically include tenant filter
5. Response validation: Ensure no cross-tenant data leakage

**Middleware Enforcement:**
- Tenant context middleware runs early in request pipeline
- Reject requests without valid tenant context
- Log all tenant context changes
- Audit anomalies (e.g., tenant ID mismatch between token and URL)

**ORM Integration:**
- Prisma: Global query filters with tenant ID
- GORM: Scope chains with tenant filter
- Query builder: Automatic tenant ID injection
- Raw queries: Linting rules to prevent missing tenant filters

### 4.2 Network Isolation

**Virtual Private Cloud (VPC):**
- Dedicated VPC per environment (production, staging, development)
- Private subnets for databases and internal services
- Public subnets for load balancers and API gateways
- NAT gateways for outbound internet access from private subnets

**Network Segmentation:**
- Frontend layer: Load balancers, CDN
- Application layer: API servers (private subnet)
- Data layer: Databases, caches (private subnet, no internet access)
- Management layer: Bastion hosts, monitoring (restricted access)

**Security Groups and Firewall Rules:**
- Principle of least privilege: Only required ports open
- Source IP restrictions: Database only accessible from application servers
- Egress filtering: Restrict outbound connections
- No direct database access from internet

**Enterprise Tenant Network Isolation (Optional):**
- Dedicated VPC for high-value enterprise tenants
- VPC peering for isolated tenant infrastructure
- PrivateLink for private connectivity
- Dedicated IP ranges and domains

**DDoS Protection:**
- CloudFlare, AWS Shield, or similar service
- Rate limiting at edge
- WAF (Web Application Firewall) for application-layer attacks
- Auto-scaling to absorb traffic spikes

### 4.3 Application-Level Isolation

**Process Isolation:**
- Containerized services (Docker/Kubernetes)
- Resource limits per container (CPU, memory)
- Separate container images for different tenant tiers (optional)
- Pod security policies (Kubernetes): Restrict privileged operations

**Cache Isolation:**
- Redis namespacing by tenant ID
- Key format: `tenant:{tenant_id}:{resource}:{id}`
- Cache quota per tenant (prevent cache exhaustion)
- Separate Redis instances for enterprise tenants (optional)

**Queue Isolation:**
- Queue naming with tenant ID prefix
- Separate worker pools per tenant tier
- Priority queues for premium tenants
- Rate limiting on job enqueuing

**Storage Isolation:**
- S3/blob storage: Key prefix with tenant ID
- Separate buckets for enterprise tenants
- Storage quota enforcement per tenant
- Object ACLs: Tenant-scoped access only

**Logging and Monitoring Isolation:**
- Log entries tagged with tenant ID
- Separate log streams per tenant (optional for enterprise)
- Metrics labeled with tenant ID
- Tenant-specific alerting

### 4.4 Self-Hosted (Single-Tenant) Deployment

**Isolation Model:**
- No tenant ID required (single tenant implicit)
- Simplified database schema (no tenant_id columns)
- Full database instance per deployment
- Customer-controlled infrastructure

**Deployment Options:**

**Docker Compose:**
- Single-server deployment
- All services in docker-compose.yml
- Persistent volumes for data
- Suitable for small businesses (< 100 concurrent users)

**Kubernetes:**
- Multi-server deployment
- Helm charts for easy installation
- Horizontal scaling capability
- Suitable for medium to large businesses

**Cloud Marketplace:**
- One-click deployment on AWS, GCP, Azure
- Pre-configured infrastructure
- Managed services (RDS, ElastiCache)
- Automatic updates (optional)

**On-Premise:**
- Customer-hosted infrastructure
- Air-gapped deployment support
- Manual updates via package delivery
- Support for regulated environments

**Data Sovereignty:**
- All data stored in customer-controlled environment
- No phone-home or telemetry to SaaS platform
- Optional analytics with customer consent
- Customer owns encryption keys

---

## 5. Data Protection

### 5.1 Encryption

**Encryption at Rest:**

**Database Encryption:**
- Full database encryption: PostgreSQL Transparent Data Encryption (TDE) or AWS RDS encryption
- Encryption key management: AWS KMS, HashiCorp Vault, or similar
- Key rotation: Automatic every 90 days
- Backup encryption: All backups encrypted with separate keys

**Application-Level Encryption (for highly sensitive fields):**
- Fields: Password hashes, MFA secrets, OAuth tokens, payment tokens, SSN/tax ID
- Algorithm: AES-256-GCM (authenticated encryption)
- Key derivation: PBKDF2 or Argon2 for password-based keys
- Key hierarchy: Master key encrypts data encryption keys (DEK)
- Per-tenant encryption keys for enterprise tier

**File Storage Encryption:**
- S3 server-side encryption (SSE-S3 or SSE-KMS)
- Client-side encryption for highly sensitive files
- Encryption in transit to storage (TLS)

**Backup Encryption:**
- Database backups: Encrypted with separate keys from production
- Key escrow: Backup encryption keys stored securely with recovery procedures
- Backup testing: Regular restore tests to verify encryption doesn't prevent recovery

**Encryption in Transit:**

**TLS Configuration:**
- Protocol: TLS 1.3 (minimum TLS 1.2)
- Cipher suites: Strong ciphers only (AEAD ciphers: AES-GCM, ChaCha20-Poly1305)
- Perfect forward secrecy: Ephemeral key exchange (ECDHE)
- Certificate: Wildcard or SAN certificate for all subdomains
- Certificate rotation: Automatic via Let's Encrypt or AWS ACM
- HSTS: HTTP Strict Transport Security header enforced
- Certificate pinning: For mobile apps and critical integrations

**Internal Service Communication:**
- mTLS (mutual TLS) between microservices
- Service mesh (Istio, Linkerd) for automatic mTLS
- Certificate rotation: Automatic via service mesh

**Database Connections:**
- PostgreSQL SSL mode: require or verify-full
- Connection pooling: PgBouncer with SSL
- Certificate verification: Server certificate validated

**Third-Party API Calls:**
- All external API calls over HTTPS
- Certificate validation enforced
- Certificate pinning for critical integrations (payment gateways)

### 5.2 Data Anonymization and Masking

**Personally Identifiable Information (PII):**

**PII Fields:**
- Direct identifiers: Name, email, phone, address, SSN, tax ID, date of birth
- Indirect identifiers: IP address, device ID, user agent
- Sensitive data: Health information, appointment notes, payment details

**Data Masking (for non-production environments):**
- Development/staging databases use masked production data
- Masking techniques:
  - Email: Replace domain, keep format (user123@example.com)
  - Phone: Replace all but last 4 digits
  - Name: Use fake name generator (Faker library)
  - Address: Replace with random addresses
  - Dates: Shift dates by random offset (preserve relative timing)
  - IDs: Maintain referential integrity
- Automated masking: Scripts run on database refresh
- No production data in development without masking

**Anonymization (for analytics):**
- Aggregated analytics: No individual user data
- Hashing: One-way hash for user IDs in analytics
- K-anonymity: Ensure data cannot identify individual (k >= 5)
- Differential privacy: Add noise to prevent re-identification

**Pseudonymization:**
- Replace direct identifiers with pseudonyms
- Mapping stored separately with restricted access
- Used for research, machine learning, support investigations
- Reversible with proper authorization

### 5.3 Data Retention and Deletion

**Retention Policies:**

**Active Data:**
- User accounts: Retained while account active
- Appointments: Retained for 3 years after completion (configurable)
- Payments: Retained for 7 years (tax/legal requirement)
- Audit logs: Retained for 7 years (compliance requirement)
- Backups: Retained for 30 days (point-in-time recovery)

**Archived Data:**
- Old appointments (> 3 years): Moved to cold storage
- Archived tenants: Full data export, then deletion after 90 days
- Compliance: Meet data minimization principle

**Deletion Procedures:**

**Soft Delete (Reversible):**
- User account deletion: Mark deleted, retain 30-day grace period
- Appointment cancellation: Soft delete, can be restored
- Business closure: Soft delete, retain for recovery

**Hard Delete (Permanent):**
- After grace period, data permanently deleted
- Multi-step process: Soft delete → grace period → hard delete
- Verification: Confirmation required for irreversible deletion
- Logging: Audit log entry for all deletions

**Secure Deletion:**
- Database: DELETE statement, followed by VACUUM (PostgreSQL)
- Backups: Deletion propagates to backups after retention window
- Object storage: S3 object deletion, with versioning disabled
- Encryption keys: Key deletion renders data unrecoverable

**Right to Erasure (GDPR):**
- User-initiated deletion via account settings
- Deletion within 30 days of request
- Data export provided before deletion
- Exceptions: Legal obligations (payment records), legitimate business interests
- Anonymization: Alternative to deletion where records must be retained

### 5.4 Data Loss Prevention (DLP)

**Monitoring:**
- Database activity monitoring: Log all queries, detect anomalies
- File access monitoring: Track downloads of bulk data
- API monitoring: Detect unusual data export patterns
- Alerts: Immediate notification for suspicious activity

**Controls:**
- Bulk export restrictions: Require approval for large data exports
- Rate limiting: Prevent rapid data extraction
- Watermarking: Add tenant ID to exported files
- Access logging: All data access logged with user, timestamp, purpose

**Incident Response:**
- Detection: Automated alerts for DLP violations
- Investigation: Security team reviews suspicious activity
- Containment: Disable compromised accounts, revoke API keys
- Notification: Inform affected users and authorities if breach confirmed
- Remediation: Patch vulnerabilities, enhance controls

---

## 6. GDPR Compliance

### 6.1 Legal Basis for Processing

**Legitimate Bases:**

**Consent:**
- Marketing communications: Explicit opt-in required
- Optional features: Clear consent for data usage
- Withdrawal: Easy one-click unsubscribe
- Records: Consent timestamp, IP, method logged

**Contract Performance:**
- Appointment booking: Necessary to provide service
- Payment processing: Required to complete transaction
- Service delivery: Staff scheduling, notifications

**Legal Obligation:**
- Tax records: Required by law to retain payment data
- Audit logs: Regulatory compliance in certain industries
- Court orders: Compliance with lawful requests

**Legitimate Interest:**
- Fraud prevention: Detect and prevent fraudulent bookings
- Service improvement: Anonymized analytics
- Security: Monitor for unauthorized access
- Balance test: Ensure not overridden by data subject rights

### 6.2 Data Subject Rights

**Right to Access (Article 15):**
- Self-service: User data export in account settings
- Format: JSON, CSV, or PDF
- Contents: All personal data, processing purposes, recipients, retention period
- Timeline: Provided immediately via self-service, or within 30 days if manual retrieval needed
- Verification: Authentication required to prevent unauthorized access

**Right to Rectification (Article 16):**
- Self-service: Users can update profile information
- Request: Submit correction request via support
- Timeline: Corrections within 7 days
- Notification: Inform third parties if data shared

**Right to Erasure (Article 17):**
- Self-service: Account deletion in settings
- Process: Soft delete (30 days grace) → hard delete
- Exceptions:
  - Payment records retained for 7 years (legal obligation)
  - Appointment records anonymized (remove PII, retain for analytics)
  - Audit logs retained (legitimate interest in security)
- Timeline: Deletion within 30 days
- Confirmation: Email confirmation of deletion

**Right to Restriction of Processing (Article 18):**
- Temporary suspension of data processing
- Use cases: Disputing accuracy, contesting lawfulness
- Implementation: Flag account, prevent marketing, maintain data for legal claims
- Notification: Inform user before lifting restriction

**Right to Data Portability (Article 20):**
- Machine-readable format: JSON, CSV
- Structured data: User profile, appointments, payments
- Scope: Data provided by user or generated by usage
- Direct transfer: Option to send directly to another service (if technically feasible)
- Timeline: Immediate via self-service

**Right to Object (Article 21):**
- Marketing objection: Unsubscribe links, preference center
- Profiling objection: Opt-out of AI recommendations
- Implementation: Respect objection immediately
- No detriment: Service continues without objected processing

**Rights Related to Automated Decision-Making (Article 22):**
- No fully automated decisions with legal/significant effect
- AI recommendations: Human review required for appointment approvals/denials
- Transparency: Explain AI-based no-show predictions and recommendations
- Appeal: Users can request human review of automated decisions

### 6.3 Privacy by Design

**Data Minimization:**
- Collect only necessary data: No excessive data collection
- Optional fields: Mark clearly, no service denial if not provided
- Default settings: Most privacy-protective settings by default
- Regular review: Audit data collection, delete unnecessary fields

**Purpose Limitation:**
- Clear purposes: Data use limited to stated purposes
- No repurposing: Additional uses require new consent
- Segmentation: Separate data stores for different purposes

**Storage Limitation:**
- Retention periods: Define and enforce retention limits
- Automatic deletion: Scheduled jobs delete expired data
- Archival: Move old data to cold storage, delete after retention

**Integrity and Confidentiality:**
- Encryption: All data encrypted at rest and in transit
- Access controls: Strict RBAC and ABAC enforcement
- Audit logs: Track all data access and modifications

**Accountability:**
- Privacy policies: Clear, accessible, plain language
- Data processing agreements (DPA): With all processors
- Records of processing: Document all processing activities
- Training: Regular privacy training for employees
- Privacy team: Dedicated privacy officers and DPO (if required)

### 6.4 Cross-Border Data Transfers

**Data Residency:**
- EU region: Dedicated infrastructure for EU customers
- US region: Separate infrastructure for US customers
- UK region: Post-Brexit compliance
- Other regions: As needed based on customer base

**Transfer Mechanisms:**

**Standard Contractual Clauses (SCC):**
- EU Commission approved SCCs for transfers outside EU/EEA
- Contracts with all sub-processors
- Transfer impact assessment (TIA) for high-risk transfers

**Adequacy Decisions:**
- Rely on EU adequacy decisions where available
- Monitor for changes in adequacy status

**Binding Corporate Rules (BCR):**
- Internal data transfer framework (if applicable for large organizations)
- Approved by data protection authorities

**Consent:**
- Explicit consent for transfers where no other mechanism available
- Clear disclosure of destination and risks

**Implementation:**
- Customer choice: Select data residency region
- Data localization: Option to keep all data within specific region
- No cross-region transfer: Unless explicitly authorized
- Sub-processor disclosure: List of sub-processors and locations

### 6.5 Data Protection Impact Assessment (DPIA)

**When Required:**
- High-risk processing: Large-scale profiling, sensitive data, automated decisions
- New technologies: Implementing new AI/ML features
- Systematic monitoring: Extensive client behavior tracking

**DPIA Process:**
1. Describe processing: Purpose, data, retention, recipients
2. Assess necessity: Justify processing, consider alternatives
3. Identify risks: Privacy risks to data subjects
4. Mitigation measures: Technical and organizational measures
5. Consultation: Involve stakeholders, DPO, data subjects
6. Approval: Senior management or DPO approval
7. Review: Regular review and update

**Consultation with DPO:**
- Mandatory for high-risk processing
- DPO advises on DPIA, compliance, safeguards
- DPO contact: Available for data subjects and authorities

### 6.6 Breach Notification

**Detection:**
- Security monitoring: 24/7 monitoring for breaches
- Incident response plan: Documented procedures
- Breach definition: Unauthorized access, loss, disclosure, alteration

**Assessment (within 24 hours):**
- Scope: Number of affected users, data types
- Severity: Risk to rights and freedoms
- Likelihood: Probability of harm
- Mitigation: Measures taken to contain and remediate

**Notification to Supervisory Authority (within 72 hours):**
- Required if risk to rights and freedoms
- Contents: Nature of breach, data subjects affected, consequences, measures taken
- Channel: Online form, email, or designated portal
- Documentation: Record all breaches, including low-risk ones

**Notification to Data Subjects (without undue delay):**
- Required if high risk to rights and freedoms
- Contents: Description, contact point, consequences, measures taken
- Channel: Email, in-app notification, public announcement (if many affected)
- Exceptions: Encrypted data (key not compromised), measures reduce risk, disproportionate effort (public announcement instead)

**Post-Breach:**
- Root cause analysis: Determine how breach occurred
- Remediation: Patch vulnerabilities, enhance security
- Monitoring: Increased monitoring for affected accounts
- Lessons learned: Update security practices
- Documentation: Maintain breach register

---

## 7. Security Best Practices

### 7.1 Secure Development Lifecycle (SDL)

**Threat Modeling:**
- Identify assets: Data, systems, users
- Identify threats: STRIDE model (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege)
- Assess risks: Likelihood and impact
- Mitigation: Design security controls
- Review: Regular threat model updates

**Secure Coding Standards:**
- OWASP Top 10: Address all top vulnerabilities
- Input validation: Validate all user inputs, whitelist approach
- Output encoding: Prevent XSS attacks
- Parameterized queries: Prevent SQL injection
- Error handling: No sensitive information in error messages
- Cryptography: Use established libraries, no custom crypto
- Logging: Log security events, no sensitive data in logs

**Code Review:**
- Peer review: All code changes reviewed by another developer
- Security review: High-risk changes reviewed by security team
- Automated review: Static analysis tools in CI/CD pipeline
- Checklists: Security checklist for reviewers

**Static Application Security Testing (SAST):**
- Tools: SonarQube, Semgrep, CodeQL
- Integration: Run on every commit, block merge if critical issues
- Language-specific: Tailored rules for Node.js, Go, TypeScript
- False positive management: Suppress known false positives, track suppressions

**Dynamic Application Security Testing (DAST):**
- Tools: OWASP ZAP, Burp Suite
- Frequency: Weekly scans of staging environment
- Coverage: All authenticated and public endpoints
- Findings: Prioritize and remediate based on severity

**Dependency Management:**
- Dependency scanning: Snyk, npm audit, Dependabot
- Automated updates: Minor/patch version auto-updates
- Vulnerability monitoring: Alerts for new CVEs in dependencies
- License compliance: Track open source licenses

### 7.2 Infrastructure Security

**Server Hardening:**
- Minimal installation: Only required packages installed
- Automatic updates: Security patches applied automatically
- Firewall: UFW, iptables, or cloud security groups
- SSH hardening: Key-based auth only, disable root login, change default port
- Intrusion detection: Fail2ban, OSSEC, or cloud-native IDS

**Container Security:**
- Base images: Use official minimal images (alpine, distroless)
- Vulnerability scanning: Scan images on build (Trivy, Clair)
- No root: Run containers as non-root user
- Read-only filesystem: Where possible
- Resource limits: CPU and memory limits enforced
- Secret management: Use Kubernetes secrets, not environment variables

**Kubernetes Security:**
- RBAC: Least privilege for service accounts
- Network policies: Restrict pod-to-pod communication
- Pod security policies: Enforce security standards
- Admission controllers: Validate deployments (OPA Gatekeeper)
- Secret encryption: Encrypt secrets at rest in etcd
- API server hardening: Disable anonymous auth, enable audit logging

**Database Security:**
- Authentication: Strong passwords, key-based where possible
- Network isolation: No public access
- Encryption: TLS for connections, encryption at rest
- Least privilege: Application users have minimal privileges
- Backup security: Encrypted backups, separate credentials
- Audit logging: Enable audit logs, monitor for suspicious queries

**Secret Management:**
- No secrets in code: Absolutely no hardcoded secrets
- Secret rotation: Regular rotation (90 days)
- Encryption: Secrets encrypted in vault
- Access control: Strict access to secret management system
- Audit: All secret access logged
- Tools: HashiCorp Vault, AWS Secrets Manager, Azure Key Vault

### 7.3 Application Security

**Input Validation:**
- Server-side: All validation on server (never trust client)
- Type checking: Strongly typed languages (TypeScript, Go)
- Length limits: Enforce maximum lengths
- Format validation: Regex patterns for structured data
- Whitelist: Allow known-good inputs, block everything else
- Sanitization: Remove dangerous characters before processing

**Output Encoding:**
- Context-aware: HTML, JavaScript, URL, CSS encoding
- Libraries: Use framework-provided encoding (React auto-escaping)
- Content-Type: Set correct Content-Type header
- X-Content-Type-Options: Set to nosniff

**SQL Injection Prevention:**
- Parameterized queries: Always use prepared statements
- ORM: Use ORM (Prisma, GORM) to avoid raw SQL
- Input validation: Additional layer of defense
- Least privilege: Database users have minimal privileges
- Error messages: No database errors exposed to user

**Cross-Site Scripting (XSS) Prevention:**
- Auto-escaping: React, Vue automatically escape
- Content Security Policy (CSP): Restrict script sources
- HTTPOnly cookies: Prevent JavaScript access to session cookies
- Sanitization: Use DOMPurify for user-generated HTML

**Cross-Site Request Forgery (CSRF) Prevention:**
- CSRF tokens: Unique token per session/form
- SameSite cookies: Set SameSite=Lax or Strict
- Double-submit cookies: Additional validation
- Custom headers: Require custom header for state-changing requests

**Clickjacking Prevention:**
- X-Frame-Options: DENY or SAMEORIGIN
- CSP frame-ancestors: Specify allowed embedding origins

**Server-Side Request Forgery (SSRF) Prevention:**
- URL validation: Whitelist allowed domains for external requests
- No user-controlled URLs: For internal requests
- Network segmentation: Restrict application access to internal services
- Metadata service protection: Block access to cloud metadata endpoints

**XML External Entity (XXE) Prevention:**
- Disable external entities: In XML parsers
- Use JSON: Prefer JSON over XML
- Input validation: Validate XML structure

**Insecure Deserialization Prevention:**
- Avoid deserialization: Of untrusted data
- Type checking: Validate deserialized object types
- Use JSON: Instead of language-specific serialization

### 7.4 API Security

**Authentication:**
- OAuth 2.0: For third-party integrations
- API keys: For server-to-server
- JWT: For user sessions
- No basic auth: Unless over TLS with strong passwords

**Authorization:**
- Endpoint-level: Check permissions on every endpoint
- Resource-level: Verify ownership of resources
- Deny by default: Explicit allow required

**Rate Limiting:**
- Per-user: Prevent abuse by single user
- Per-IP: Prevent distributed abuse
- Per-endpoint: Protect expensive operations
- Graceful degradation: Return 429 with Retry-After header

**Input Validation:**
- Schema validation: JSON Schema, OpenAPI
- Type checking: Validate data types
- Range checking: Min/max values
- Length limits: String and array length

**Error Handling:**
- Generic errors: Don't expose internal details
- Consistent format: Standardized error response structure
- Error codes: Use error codes for programmatic handling
- Logging: Log detailed errors server-side

**API Versioning:**
- Version in URL: /v1/, /v2/
- Deprecation: Announce deprecation well in advance
- Sunset: Remove old versions after transition period
- Backward compatibility: Maintain compatibility within version

**CORS (Cross-Origin Resource Sharing):**
- Whitelist origins: Allow specific origins, not wildcard
- Credentials: Only if necessary
- Preflight: Properly handle OPTIONS requests
- Headers: Restrict allowed headers

**Security Headers:**
- Strict-Transport-Security: Force HTTPS
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY or SAMEORIGIN
- Content-Security-Policy: Restrict content sources
- X-XSS-Protection: Enable browser XSS protection (legacy)
- Referrer-Policy: Control referrer information

---

## 8. Accessibility (WCAG Compliance)

### 8.1 WCAG 2.1 Level AA Compliance

**Perceivable:**

**Text Alternatives (1.1):**
- Alt text: All images have descriptive alt text
- Icons: Icon buttons include aria-label or visible text
- Decorative images: Use empty alt="" or aria-hidden
- Charts: Provide data tables as alternative

**Time-Based Media (1.2):**
- Captions: Videos include closed captions
- Transcripts: Audio content has text transcripts
- Video descriptions: Descriptive audio or text descriptions

**Adaptable (1.3):**
- Semantic HTML: Use proper heading hierarchy (h1-h6)
- Landmarks: nav, main, aside, footer for page structure
- Forms: Associated labels for all inputs
- Tables: Proper thead, tbody, th, td with scope
- Reading order: Logical DOM order matches visual order
- Instructions: Don't rely on sensory characteristics (shape, color, position) alone

**Distinguishable (1.4):**
- Color contrast: Minimum 4.5:1 for normal text, 3:1 for large text
- Resize text: Text can scale to 200% without loss of functionality
- Images of text: Avoid, use actual text when possible
- Reflow: Content reflows at 320px width (mobile)
- Non-text contrast: 3:1 for UI components and graphics
- Text spacing: Allow user to adjust spacing without breaking layout
- Focus visible: Clear focus indicators for keyboard navigation

**Operable:**

**Keyboard Accessible (2.1):**
- Keyboard navigation: All functionality via keyboard
- No keyboard trap: Users can navigate away from all components
- Shortcuts: Provide keyboard shortcuts, allow rebinding
- Focus order: Logical tab order
- Skip links: "Skip to main content" link

**Enough Time (2.2):**
- Timing adjustable: Allow users to extend or disable time limits
- Pause/stop: Auto-updating content can be paused
- Session timeout: Warn before timeout, allow extension
- No time limit: On reading or interacting (or very generous limits)

**Seizures (2.3):**
- No flashing: Nothing flashes more than 3 times per second
- Animation: Option to disable animations (prefers-reduced-motion)

**Navigable (2.4):**
- Page title: Unique, descriptive page titles
- Focus order: Logical focus order
- Link purpose: Clear link text or context
- Multiple ways: More than one way to find pages (menu, search, sitemap)
- Headings: Descriptive headings and labels
- Focus visible: Keyboard focus indicator always visible

**Input Modalities (2.5):**
- Touch targets: Minimum 44x44 pixels
- Pointer gestures: Provide alternatives for complex gestures
- Label in name: Visible label matches accessible name
- Motion actuation: Alternative to device motion (shake, tilt)

**Understandable:**

**Readable (3.1):**
- Language: HTML lang attribute set
- Parts: Mark language changes within page
- Unusual words: Provide definitions or glossary
- Abbreviations: Expand or explain abbreviations

**Predictable (3.2):**
- On focus: No context change on focus alone
- On input: No unexpected context changes on input
- Consistent navigation: Navigation appears consistently
- Consistent identification: Components with same function labeled consistently

**Input Assistance (3.3):**
- Error identification: Clearly identify errors
- Labels or instructions: Provide labels for all inputs
- Error suggestion: Suggest corrections for errors
- Error prevention: Confirmation step for legal/financial transactions
- Help: Context-sensitive help available

**Robust:**

**Compatible (4.1):**
- Valid HTML: Properly nested, closed tags, unique IDs
- Name, role, value: All components have accessible name, role, and value
- Status messages: Use aria-live for dynamic updates

### 8.2 Assistive Technology Support

**Screen Readers:**
- JAWS: Test with JAWS on Windows
- NVDA: Test with NVDA on Windows
- VoiceOver: Test with VoiceOver on macOS and iOS
- TalkBack: Test with TalkBack on Android

**ARIA (Accessible Rich Internet Applications):**
- Landmarks: role="navigation", role="main", role="complementary"
- Live regions: aria-live for dynamic content updates
- States: aria-expanded, aria-selected, aria-checked
- Properties: aria-label, aria-labelledby, aria-describedby
- Roles: Custom widget roles (dialog, tooltip, tab, tabpanel)
- Hide decorative: aria-hidden="true" for decorative elements
- Alert: role="alert" for important messages
- ARIA best practices: Follow WAI-ARIA Authoring Practices

**Keyboard Navigation:**
- Tab order: Logical tab order through interactive elements
- Arrow keys: Arrow key navigation for lists, tabs, menus
- Enter/Space: Activate buttons and links
- Escape: Close modals, menus, and overlays
- Focus management: Move focus to opened modals, returned to trigger on close
- Skip links: Bypass repetitive content

### 8.3 Testing and Compliance

**Automated Testing:**
- Tools: Axe, WAVE, Lighthouse accessibility audits
- CI/CD integration: Run accessibility tests on every build
- Coverage: Test all pages and interactive components
- Thresholds: Block deployment if critical issues found

**Manual Testing:**
- Keyboard-only: Navigate entire application with keyboard
- Screen reader: Test with at least two screen readers
- Zoom: Test at 200% zoom level
- Color contrast: Verify all text meets contrast ratios
- Responsive: Test at various screen sizes and orientations

**User Testing:**
- Diverse users: Include users with disabilities in testing
- Real scenarios: Test actual user workflows
- Feedback: Collect accessibility feedback from users
- Iteration: Continuously improve based on feedback

**Compliance Documentation:**
- VPAT (Voluntary Product Accessibility Template): Document conformance
- Accessibility statement: Publish accessibility statement
- Contact: Provide accessibility contact for issues
- Roadmap: Publish plan for improving accessibility

---

## 9. Audit Logging

### 9.1 Audit Log Requirements

**Events to Log:**

**Authentication Events:**
- Successful login (user ID, timestamp, IP, device)
- Failed login (email, timestamp, IP, reason)
- Logout (user ID, timestamp)
- Password change (user ID, timestamp)
- Password reset request (email, timestamp, IP)
- MFA enabled/disabled (user ID, timestamp)
- MFA verification (user ID, timestamp, success/failure)
- OAuth login (user ID, provider, timestamp)

**Authorization Events:**
- Permission denied (user ID, resource, action, timestamp)
- Role assigned/revoked (target user, role, by whom, timestamp)
- Permission modified (role, permission, by whom, timestamp)

**Data Access Events:**
- Client profile viewed (user ID, client ID, timestamp)
- Client data exported (user ID, client ID, timestamp, format)
- Payment viewed (user ID, payment ID, timestamp)
- Bulk data export (user ID, resource type, count, timestamp)

**Data Modification Events:**
- Record created (user ID, resource type, resource ID, timestamp, data)
- Record updated (user ID, resource type, resource ID, timestamp, changes)
- Record deleted (user ID, resource type, resource ID, timestamp, data)
- Business settings changed (user ID, setting name, old value, new value, timestamp)

**Appointment Events:**
- Appointment created (user ID, appointment ID, timestamp, data)
- Appointment updated (user ID, appointment ID, timestamp, changes)
- Appointment cancelled (user ID, appointment ID, timestamp, reason)
- Appointment completed (user ID, appointment ID, timestamp)
- Appointment no-show (user ID, appointment ID, timestamp)

**Payment Events:**
- Payment processed (user ID, payment ID, amount, method, timestamp)
- Refund issued (user ID, refund ID, amount, reason, timestamp)
- Payment failed (user ID, payment ID, reason, timestamp)

**System Events:**
- System configuration change (user ID, config key, old value, new value)
- Integration enabled/disabled (user ID, integration type, timestamp)
- Backup created (automated/manual, timestamp, size)
- Backup restored (user ID, timestamp, backup date)
- User impersonation started/ended (admin user, target user, timestamp)

**Security Events:**
- Account locked (user ID, reason, timestamp)
- Suspicious activity detected (user ID, activity type, timestamp, details)
- MFA bypass (user ID, by whom, reason, timestamp)
- Data breach detected (scope, timestamp, impact)
- Security policy violation (user ID, policy, timestamp)

### 9.2 Audit Log Structure

**Log Entry Fields:**

**Required Fields:**
- `audit_id` (UUID): Unique identifier for audit entry
- `tenant_id` (UUID): Tenant identifier
- `timestamp` (ISO 8601): When event occurred
- `event_type` (string): Category of event (authentication, data_access, etc.)
- `event_action` (string): Specific action (login, create, update, delete)
- `user_id` (UUID): User who performed action (null for system)
- `resource_type` (string): Type of resource affected (appointment, client, etc.)
- `resource_id` (UUID): Specific resource identifier
- `outcome` (string): Success, failure, or partial_success
- `correlation_id` (UUID): Groups related actions in single operation

**Optional Fields:**
- `user_email` (string): User email (denormalized for easy search)
- `user_name` (string): User name (denormalized)
- `ip_address` (string): Request IP address
- `user_agent` (string): Request user agent
- `changes` (JSONB): Before/after values for updates
- `metadata` (JSONB): Additional context-specific information
- `severity` (string): Info, warning, critical
- `error_message` (string): Error details if failure
- `session_id` (string): Session identifier

**Example Entry:**
```
{
  "audit_id": "550e8400-e29b-41d4-a716-446655440000",
  "tenant_id": "123e4567-e89b-12d3-a456-426614174000",
  "timestamp": "2025-06-01T14:30:00Z",
  "event_type": "data_modification",
  "event_action": "appointment.update",
  "user_id": "789e0123-e89b-12d3-a456-426614174111",
  "user_email": "staff@hairsalon.com",
  "resource_type": "appointment",
  "resource_id": "appointment-uuid",
  "outcome": "success",
  "ip_address": "203.0.113.45",
  "changes": {
    "before": {"status": "confirmed", "start_time": "2025-06-05T10:00:00Z"},
    "after": {"status": "cancelled", "start_time": "2025-06-05T10:00:00Z"}
  },
  "metadata": {
    "cancellation_reason": "Client requested",
    "refund_issued": true
  },
  "correlation_id": "request-uuid"
}
```

### 9.3 Audit Log Storage and Retention

**Storage:**
- Database: PostgreSQL table for recent logs (90 days)
- Time-series database: InfluxDB or TimescaleDB for long-term storage
- Object storage: S3 for archived logs (compression, encryption)
- Search index: Elasticsearch for full-text search and analytics

**Partitioning:**
- Time-based partitioning: Monthly partitions
- Automatic archival: Move old partitions to cold storage
- Retention enforcement: Automated deletion after retention period

**Retention:**
- Active: 90 days in hot storage (fast queries)
- Archive: 7 years in cold storage (compliance)
- Deletion: Permanent deletion after 7 years (or per tenant policy)

**Immutability:**
- Append-only: No updates or deletes of audit logs
- Integrity: Cryptographic hash chain (each entry includes hash of previous)
- Tampering detection: Verify hash chain to detect modifications
- Write-once storage: Use immutable storage (S3 Object Lock)

### 9.4 Audit Log Access and Monitoring

**Access Control:**
- Restricted access: Only authorized users can view audit logs
- Separation of duties: Admins cannot delete their own audit entries
- Read-only: Audit logs cannot be modified
- Logging of log access: All audit log access is itself logged

**Search and Reporting:**
- Full-text search: Search by user, resource, action, date range
- Filtering: Filter by event type, outcome, severity
- Aggregation: Daily/weekly/monthly summaries
- Exports: CSV, JSON export for compliance audits
- Dashboards: Real-time audit activity dashboards

**Alerting:**
- Suspicious activity: Alert on multiple failed logins, unusual data access
- Policy violations: Alert on unauthorized access attempts
- High-severity events: Immediate notification for critical events
- Anomaly detection: Machine learning for unusual patterns
- Compliance alerts: Alert on GDPR-related events (deletions, exports)

**Integration:**
- SIEM integration: Send logs to Security Information and Event Management system
- Log aggregation: Centralized logging (ELK stack, Splunk, Datadog)
- Correlation: Correlate with application logs, system logs
- Compliance tools: Export for compliance auditing tools

---

## 10. Incident Response

### 10.1 Incident Response Plan

**Preparation:**
- Incident response team: Designated team members with roles
- Contact list: 24/7 contact information
- Runbooks: Documented procedures for common incidents
- Tools: Access to monitoring, logging, forensics tools
- Training: Regular incident response drills

**Detection:**
- Monitoring: 24/7 monitoring for security events
- Alerting: Automated alerts for suspicious activity
- User reports: Easy reporting mechanism for users
- Threat intelligence: Subscribe to threat feeds

**Analysis:**
- Severity assessment: Determine impact and urgency
- Scope: Identify affected systems and data
- Root cause: Investigate how incident occurred
- Indicators of Compromise (IoC): Identify attack patterns
- Timeline: Reconstruct sequence of events

**Containment:**
- Immediate containment: Isolate affected systems
- Short-term: Stop spread, preserve evidence
- Long-term: Patch vulnerabilities, harden systems
- Backup: Create forensic copies before remediation

**Eradication:**
- Remove threat: Delete malware, close backdoors
- Patch vulnerabilities: Apply security updates
- Credential rotation: Rotate compromised credentials
- Verification: Ensure threat completely removed

**Recovery:**
- Restore systems: Bring systems back online
- Verify integrity: Ensure systems clean and functional
- Monitor: Enhanced monitoring for re-infection
- Gradual restoration: Phased return to normal operations

**Post-Incident:**
- Lessons learned: Document what went well, what didn't
- Root cause analysis: In-depth analysis of incident
- Remediation: Implement preventive measures
- Update procedures: Improve incident response plan
- Training: Share learnings with team

### 10.2 Business Continuity and Disaster Recovery

**Backup Strategy:**
- Frequency: Daily full backups, hourly incremental
- Retention: 30 days of backups
- Testing: Monthly restore tests
- Offsite: Backups stored in separate geographic region
- Encryption: All backups encrypted

**Recovery Objectives:**
- RTO (Recovery Time Objective): 4 hours for critical systems
- RPO (Recovery Point Objective): 1 hour (maximum data loss)
- Testing: Quarterly disaster recovery drills
- Documentation: Detailed recovery procedures

**High Availability:**
- Multi-AZ deployment: Services across multiple availability zones
- Auto-scaling: Automatic scaling based on demand
- Load balancing: Distribute traffic across instances
- Health checks: Automatic instance replacement on failure
- Database replication: Real-time replication to standby

**Disaster Scenarios:**
- Data center outage: Failover to secondary region
- Database corruption: Restore from backup
- Ransomware attack: Restore from clean backup, isolate infected systems
- DDoS attack: Absorb traffic with CDN and auto-scaling
- Insider threat: Immediate revocation of access, forensic investigation

---

**End of Security & Privacy Documentation**
