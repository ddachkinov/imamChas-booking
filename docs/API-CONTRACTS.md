# API-CONTRACTS.md

## 1. Overview

This document defines the API contracts for the booking platform. All APIs follow RESTful conventions with JSON request/response bodies. The platform exposes separate API sets for different consumers:

- **Public API**: Booking widgets, client-facing operations (no authentication for viewing, authentication for booking)
- **Business API**: Business management, staff operations (authentication required)
- **Admin API**: Platform administration, tenant management (admin authentication required)
- **Webhook API**: Inbound webhooks from third-party services

### Base URL Structure

**Multi-Tenant SaaS:**
- `https://api.platform.com/v1` - Primary API endpoint
- Tenant identified via `X-Tenant-ID` header or JWT claim

**Single-Tenant:**
- `https://your-domain.com/api/v1` - Self-hosted API endpoint
- Single tenant implicit

### Common Headers

**Request Headers:**
- `Authorization`: Bearer token (JWT)
- `X-Tenant-ID`: Tenant identifier (optional, extracted from token if not provided)
- `X-Correlation-ID`: Request tracking ID (optional, auto-generated if not provided)
- `Accept-Language`: Preferred language (e.g., "en", "bg")
- `Content-Type`: application/json (for POST/PUT/PATCH)
- `X-API-Version`: API version override (optional)

**Response Headers:**
- `X-Request-ID`: Unique request identifier for support
- `X-RateLimit-Limit`: Maximum requests per window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Timestamp when rate limit resets
- `X-Response-Time`: Server processing time in milliseconds

### Pagination

List endpoints support cursor-based pagination:

**Query Parameters:**
- `limit`: Number of records per page (default: 20, max: 100)
- `cursor`: Opaque pagination cursor from previous response
- `sort`: Sort field and direction (e.g., "created_at:desc")

**Response Structure:**
```
{
  "data": [...],
  "pagination": {
    "cursor": "opaque-cursor-string",
    "has_more": true,
    "total_count": 1523 (optional, may be expensive to compute)
  }
}
```

### Filtering and Search

List endpoints support filtering via query parameters:

**Common Filters:**
- `status`: Filter by status (comma-separated for multiple)
- `created_after`: ISO 8601 timestamp
- `created_before`: ISO 8601 timestamp
- `search`: Full-text search query
- `ids`: Comma-separated list of IDs

**Example:**
`GET /v1/appointments?status=confirmed,pending&created_after=2025-01-01T00:00:00Z&limit=50`

### Error Response Format

All error responses follow consistent structure:

```
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": [
      {
        "field": "email",
        "message": "Email address is invalid",
        "code": "INVALID_FORMAT"
      }
    ],
    "request_id": "req_abc123",
    "documentation_url": "https://docs.platform.com/errors/ERROR_CODE"
  }
}
```

### Standard HTTP Status Codes

- `200 OK`: Successful GET request
- `201 Created`: Successful POST creating new resource
- `204 No Content`: Successful DELETE or PUT with no response body
- `400 Bad Request`: Invalid request parameters or body
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Authenticated but insufficient permissions
- `404 Not Found`: Resource does not exist
- `409 Conflict`: Resource conflict (e.g., double booking)
- `422 Unprocessable Entity`: Validation errors
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Temporary unavailability (maintenance, overload)

---

## 2. Authentication & Authorization

### 2.1 Register New User

**Endpoint:** `POST /v1/auth/register`

**Purpose:** Register a new user account

**Authentication:** None (public endpoint)

**Authorization:** None

**Request Fields:**
- `email` (string, required): User email address
- `password` (string, required): Password (min 8 chars, must include uppercase, lowercase, number)
- `first_name` (string, required): First name
- `last_name` (string, required): Last name
- `phone_number` (string, optional): Phone number in E.164 format
- `language` (string, optional): ISO 639-1 language code (default: "en")
- `timezone` (string, optional): IANA timezone (default: detected from request)
- `marketing_consent` (boolean, optional): Opt-in for marketing emails (default: false)

**Response Fields (201 Created):**
- `user_id` (string): Unique user identifier
- `email` (string): Registered email
- `email_verified` (boolean): Always false on registration
- `verification_token_sent` (boolean): Whether verification email was sent
- `access_token` (string): JWT access token (1 hour expiry)
- `refresh_token` (string): JWT refresh token (30 days expiry)

**Error Responses:**
- `400 Bad Request`: Invalid input format
- `409 Conflict`: Email already registered
- `422 Unprocessable Entity`: Password does not meet requirements

---

### 2.2 Login

**Endpoint:** `POST /v1/auth/login`

**Purpose:** Authenticate user and receive access tokens

**Authentication:** None (public endpoint)

**Authorization:** None

**Request Fields:**
- `email` (string, required): User email
- `password` (string, required): User password
- `mfa_code` (string, optional): MFA code if MFA is enabled

**Response Fields (200 OK):**
- `access_token` (string): JWT access token
- `refresh_token` (string): JWT refresh token
- `expires_in` (integer): Access token expiry in seconds
- `token_type` (string): Always "Bearer"
- `user` (object): User profile summary
  - `id` (string): User ID
  - `email` (string): Email
  - `first_name` (string): First name
  - `last_name` (string): Last name
  - `roles` (array): Array of role objects with scope

**Error Responses:**
- `401 Unauthorized`: Invalid credentials
- `403 Forbidden`: Account suspended or requires email verification
- `422 Unprocessable Entity`: MFA code required but not provided

---

### 2.3 Refresh Token

**Endpoint:** `POST /v1/auth/refresh`

**Purpose:** Obtain new access token using refresh token

**Authentication:** Refresh token in request body

**Authorization:** Valid refresh token

**Request Fields:**
- `refresh_token` (string, required): Valid refresh token

**Response Fields (200 OK):**
- `access_token` (string): New JWT access token
- `refresh_token` (string): New refresh token (rotated)
- `expires_in` (integer): Access token expiry in seconds

**Error Responses:**
- `401 Unauthorized`: Invalid or expired refresh token

---

### 2.4 Logout

**Endpoint:** `POST /v1/auth/logout`

**Purpose:** Invalidate current session tokens

**Authentication:** Bearer token required

**Authorization:** Any authenticated user

**Request Fields:**
- `refresh_token` (string, optional): Refresh token to invalidate

**Response (204 No Content):** Empty response

**Error Responses:**
- `401 Unauthorized`: Invalid authentication

---

### 2.5 Request Password Reset

**Endpoint:** `POST /v1/auth/password-reset/request`

**Purpose:** Request password reset email

**Authentication:** None (public endpoint)

**Authorization:** None

**Request Fields:**
- `email` (string, required): User email address

**Response (200 OK):**
- `message` (string): Confirmation message (always returns success to prevent email enumeration)
- `reset_token_sent` (boolean): Always true in response

**Error Responses:**
- `429 Too Many Requests`: Too many reset attempts

**Note:** For security, always returns success even if email doesn't exist

---

### 2.6 Reset Password

**Endpoint:** `POST /v1/auth/password-reset/confirm`

**Purpose:** Set new password using reset token

**Authentication:** None (public endpoint)

**Authorization:** Valid reset token

**Request Fields:**
- `reset_token` (string, required): Token from email
- `new_password` (string, required): New password meeting requirements

**Response (200 OK):**
- `message` (string): Success message
- `password_changed` (boolean): Always true

**Error Responses:**
- `400 Bad Request`: Invalid or expired reset token
- `422 Unprocessable Entity`: Password does not meet requirements

---

### 2.7 Verify Email

**Endpoint:** `POST /v1/auth/email/verify`

**Purpose:** Verify user email address

**Authentication:** None (public endpoint)

**Authorization:** Valid verification token

**Request Fields:**
- `verification_token` (string, required): Token from verification email

**Response (200 OK):**
- `message` (string): Success message
- `email_verified` (boolean): Always true
- `access_token` (string): Optional auto-login token

**Error Responses:**
- `400 Bad Request`: Invalid or expired verification token

---

### 2.8 Enable MFA

**Endpoint:** `POST /v1/auth/mfa/enable`

**Purpose:** Enable multi-factor authentication

**Authentication:** Bearer token required

**Authorization:** Own user account only

**Request Fields:**
- `method` (string, required): "totp" or "sms"
- `phone_number` (string, required if method=sms): Phone for SMS delivery

**Response (200 OK):**
- `method` (string): MFA method enabled
- `secret` (string): TOTP secret (for QR code generation) if method=totp
- `backup_codes` (array): Array of one-time backup codes
- `qr_code_url` (string): Optional pre-generated QR code URL

**Error Responses:**
- `400 Bad Request`: Invalid method or missing phone number
- `409 Conflict`: MFA already enabled

---

### 2.9 Verify MFA Setup

**Endpoint:** `POST /v1/auth/mfa/verify`

**Purpose:** Confirm MFA setup with test code

**Authentication:** Bearer token required

**Authorization:** Own user account only

**Request Fields:**
- `mfa_code` (string, required): 6-digit code from authenticator app or SMS

**Response (200 OK):**
- `mfa_verified` (boolean): Always true
- `message` (string): Confirmation message

**Error Responses:**
- `400 Bad Request`: Invalid MFA code
- `404 Not Found`: MFA not configured

---

### 2.10 OAuth Login

**Endpoint:** `GET /v1/auth/oauth/{provider}`

**Purpose:** Initiate OAuth flow (Google, Facebook, Apple)

**Authentication:** None (public endpoint)

**Authorization:** None

**Path Parameters:**
- `provider` (string): "google", "facebook", or "apple"

**Query Parameters:**
- `redirect_uri` (string, required): Callback URL after OAuth
- `state` (string, optional): State parameter for CSRF protection

**Response:** HTTP 302 redirect to OAuth provider

**Error Responses:**
- `400 Bad Request`: Invalid provider or redirect_uri

---

### 2.11 OAuth Callback

**Endpoint:** `GET /v1/auth/oauth/{provider}/callback`

**Purpose:** Handle OAuth provider callback

**Authentication:** None (public endpoint)

**Authorization:** OAuth code from provider

**Path Parameters:**
- `provider` (string): OAuth provider name

**Query Parameters:**
- `code` (string, required): Authorization code from provider
- `state` (string, optional): State parameter for verification

**Response (200 OK):**
- `access_token` (string): JWT access token
- `refresh_token` (string): JWT refresh token
- `user` (object): User profile
- `is_new_user` (boolean): Whether user was just created

**Error Responses:**
- `400 Bad Request`: Invalid OAuth code or state
- `401 Unauthorized`: OAuth authorization failed

---

## 3. User Management

### 3.1 Get Current User Profile

**Endpoint:** `GET /v1/users/me`

**Purpose:** Retrieve authenticated user's profile

**Authentication:** Bearer token required

**Authorization:** Any authenticated user

**Response Fields (200 OK):**
- `id` (string): User ID
- `email` (string): Email address
- `email_verified` (boolean): Email verification status
- `phone_number` (string): Phone number
- `phone_verified` (boolean): Phone verification status
- `first_name` (string): First name
- `last_name` (string): Last name
- `display_name` (string): Preferred display name
- `avatar_url` (string): Profile picture URL
- `language` (string): Preferred language
- `timezone` (string): User timezone
- `status` (string): Account status
- `mfa_enabled` (boolean): MFA status
- `mfa_method` (string): MFA method if enabled
- `roles` (array): Array of role assignments with scope
- `created_at` (string): ISO 8601 timestamp
- `last_login_at` (string): ISO 8601 timestamp

**Error Responses:**
- `401 Unauthorized`: Invalid or expired token

---

### 3.2 Update Current User Profile

**Endpoint:** `PATCH /v1/users/me`

**Purpose:** Update authenticated user's profile

**Authentication:** Bearer token required

**Authorization:** Own user account only

**Request Fields (all optional):**
- `first_name` (string): First name
- `last_name` (string): Last name
- `display_name` (string): Preferred display name
- `phone_number` (string): Phone number
- `language` (string): Preferred language
- `timezone` (string): IANA timezone
- `avatar_url` (string): Profile picture URL
- `notification_preferences` (object): Notification settings
  - `email` (object): Email notification preferences
  - `sms` (object): SMS notification preferences
  - `push` (object): Push notification preferences

**Response Fields (200 OK):**
- Same as Get Current User Profile

**Error Responses:**
- `400 Bad Request`: Invalid input format
- `401 Unauthorized`: Invalid authentication
- `422 Unprocessable Entity`: Validation errors

---

### 3.3 Change Password

**Endpoint:** `POST /v1/users/me/password`

**Purpose:** Change user password

**Authentication:** Bearer token required

**Authorization:** Own user account only

**Request Fields:**
- `current_password` (string, required): Current password
- `new_password` (string, required): New password meeting requirements

**Response (200 OK):**
- `message` (string): Success message
- `password_changed_at` (string): ISO 8601 timestamp

**Error Responses:**
- `400 Bad Request`: Current password incorrect
- `422 Unprocessable Entity`: New password does not meet requirements

---

### 3.4 Delete Account

**Endpoint:** `DELETE /v1/users/me`

**Purpose:** Request account deletion (GDPR right to erasure)

**Authentication:** Bearer token required

**Authorization:** Own user account only

**Request Fields:**
- `password` (string, required): Password confirmation
- `reason` (string, optional): Deletion reason
- `immediate` (boolean, optional): Skip grace period (default: false)

**Response (200 OK):**
- `message` (string): Confirmation message
- `deletion_scheduled_at` (string): ISO 8601 timestamp
- `grace_period_days` (integer): Days until permanent deletion

**Error Responses:**
- `400 Bad Request`: Incorrect password
- `401 Unauthorized`: Invalid authentication

**Note:** User data is soft-deleted immediately, with permanent deletion after grace period (default 30 days)

---

### 3.5 Export User Data

**Endpoint:** `POST /v1/users/me/export`

**Purpose:** Request data export (GDPR data portability)

**Authentication:** Bearer token required

**Authorization:** Own user account only

**Request Fields:**
- `format` (string, optional): "json" or "csv" (default: "json")
- `include_appointments` (boolean, optional): Include appointment history (default: true)
- `include_payments` (boolean, optional): Include payment history (default: true)

**Response (202 Accepted):**
- `export_id` (string): Export request identifier
- `status` (string): "processing"
- `estimated_completion` (string): ISO 8601 timestamp

**Error Responses:**
- `401 Unauthorized`: Invalid authentication
- `429 Too Many Requests`: Export already in progress

**Note:** Export is generated asynchronously. Download link sent via email when ready.

---

### 3.6 Get Export Status

**Endpoint:** `GET /v1/users/me/exports/{export_id}`

**Purpose:** Check data export status

**Authentication:** Bearer token required

**Authorization:** Own user account only

**Path Parameters:**
- `export_id` (string): Export request ID

**Response Fields (200 OK):**
- `export_id` (string): Export identifier
- `status` (string): "processing", "completed", "failed"
- `download_url` (string): Temporary download URL (if completed)
- `expires_at` (string): Download link expiry (if completed)
- `created_at` (string): ISO 8601 timestamp
- `completed_at` (string): ISO 8601 timestamp (if completed)

**Error Responses:**
- `404 Not Found`: Export request not found

---

## 4. Business Management

### 4.1 Create Business

**Endpoint:** `POST /v1/businesses`

**Purpose:** Create a new business (usually done during tenant setup)

**Authentication:** Bearer token required

**Authorization:** Tenant owner or admin

**Request Fields:**
- `name` (string, required): Business name
- `legal_name` (string, optional): Legal entity name
- `tax_id` (string, optional): Tax identification number
- `description` (string, optional): Business description
- `website` (string, optional): Business website URL
- `currency` (string, required): ISO 4217 currency code
- `default_timezone` (string, required): IANA timezone
- `primary_color` (string, optional): Brand color hex code
- `secondary_color` (string, optional): Brand color hex code
- `booking_policy` (object, optional): Cancellation policy and booking rules
  - `cancellation_hours` (integer): Hours before appointment cancellation allowed
  - `no_show_fee_percentage` (number): Percentage fee for no-shows
  - `advance_booking_days` (integer): Maximum days in advance for booking
  - `same_day_booking_allowed` (boolean): Allow same-day bookings

**Response Fields (201 Created):**
- `id` (string): Business ID
- `tenant_id` (string): Parent tenant ID
- `name` (string): Business name
- `status` (string): "active"
- `currency` (string): Currency code
- `default_timezone` (string): Timezone
- `created_at` (string): ISO 8601 timestamp
- All other submitted fields

**Error Responses:**
- `400 Bad Request`: Invalid input format
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `422 Unprocessable Entity`: Validation errors

---

### 4.2 Get Business Details

**Endpoint:** `GET /v1/businesses/{business_id}`

**Purpose:** Retrieve business information

**Authentication:** Bearer token required (or none for public-facing details)

**Authorization:** Business member or public endpoint

**Path Parameters:**
- `business_id` (string): Business identifier

**Query Parameters:**
- `include_locations` (boolean, optional): Include location list (default: false)
- `include_services` (boolean, optional): Include service list (default: false)

**Response Fields (200 OK):**
- `id` (string): Business ID
- `tenant_id` (string): Tenant ID
- `name` (string): Business name
- `description` (string): Description
- `website` (string): Website URL
- `logo_url` (string): Logo URL
- `primary_color` (string): Brand color
- `secondary_color` (string): Brand color
- `currency` (string): Currency code
- `default_timezone` (string): Timezone
- `booking_policy` (object): Booking policies
- `status` (string): Business status
- `locations` (array, optional): Location list if requested
- `services` (array, optional): Service list if requested
- `created_at` (string): ISO 8601 timestamp

**Error Responses:**
- `404 Not Found`: Business not found
- `403 Forbidden`: Insufficient permissions for private details

---

### 4.3 Update Business

**Endpoint:** `PATCH /v1/businesses/{business_id}`

**Purpose:** Update business information

**Authentication:** Bearer token required

**Authorization:** Business owner or manager with settings permission

**Path Parameters:**
- `business_id` (string): Business identifier

**Request Fields (all optional):**
- Same fields as Create Business

**Response Fields (200 OK):**
- Same as Get Business Details

**Error Responses:**
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Business not found
- `422 Unprocessable Entity`: Validation errors

---

### 4.4 List Businesses

**Endpoint:** `GET /v1/businesses`

**Purpose:** List all businesses for authenticated user's tenant

**Authentication:** Bearer token required

**Authorization:** Any authenticated user within tenant

**Query Parameters:**
- Standard pagination and filtering parameters
- `status` (string, optional): Filter by status

**Response Fields (200 OK):**
- `data` (array): Array of business objects
- `pagination` (object): Pagination metadata

**Error Responses:**
- `401 Unauthorized`: Invalid authentication

---

### 4.5 Delete Business

**Endpoint:** `DELETE /v1/businesses/{business_id}`

**Purpose:** Soft-delete a business

**Authentication:** Bearer token required

**Authorization:** Tenant owner only

**Path Parameters:**
- `business_id` (string): Business identifier

**Request Fields:**
- `confirmation` (string, required): Business name for confirmation
- `transfer_data_to_business_id` (string, optional): Business ID to transfer data to

**Response (204 No Content):** Empty response

**Error Responses:**
- `400 Bad Request`: Confirmation mismatch or has active appointments
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Business not found

---

## 5. Location Management

### 5.1 Create Location

**Endpoint:** `POST /v1/businesses/{business_id}/locations`

**Purpose:** Create a new business location

**Authentication:** Bearer token required

**Authorization:** Business owner or manager

**Path Parameters:**
- `business_id` (string): Parent business ID

**Request Fields:**
- `name` (string, required): Location name
- `address_line1` (string, required): Street address
- `address_line2` (string, optional): Additional address info
- `city` (string, required): City
- `state_province` (string, optional): State/province
- `postal_code` (string, required): Postal code
- `country` (string, required): ISO 3166-1 alpha-2 country code
- `latitude` (number, optional): Geocoordinate latitude
- `longitude` (number, optional): Geocoordinate longitude
- `phone_number` (string, optional): Location phone
- `email` (string, optional): Location email
- `timezone` (string, required): IANA timezone
- `operating_hours` (object, required): Weekly operating schedule
  - `monday` through `sunday` (object): Each day's schedule
    - `open` (string): Opening time (HH:MM format)
    - `close` (string): Closing time (HH:MM format)
    - `closed` (boolean): Whether location is closed this day

**Response Fields (201 Created):**
- `id` (string): Location ID
- `business_id` (string): Parent business ID
- `name` (string): Location name
- `full_address` (string): Formatted address
- `timezone` (string): Timezone
- `status` (string): "active"
- `created_at` (string): ISO 8601 timestamp
- All other submitted fields

**Error Responses:**
- `400 Bad Request`: Invalid input format
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Business not found
- `422 Unprocessable Entity`: Validation errors

---

### 5.2 Get Location Details

**Endpoint:** `GET /v1/locations/{location_id}`

**Purpose:** Retrieve location information

**Authentication:** Bearer token required (or none for public information)

**Authorization:** Business member or public endpoint

**Path Parameters:**
- `location_id` (string): Location identifier

**Query Parameters:**
- `include_staff` (boolean, optional): Include staff list (default: false)
- `include_services` (boolean, optional): Include available services (default: false)

**Response Fields (200 OK):**
- `id` (string): Location ID
- `business_id` (string): Parent business ID
- `name` (string): Location name
- `address_line1` (string): Street address
- `address_line2` (string): Additional address
- `city` (string): City
- `state_province` (string): State/province
- `postal_code` (string): Postal code
- `country` (string): Country code
- `latitude` (number): Latitude
- `longitude` (number): Longitude
- `phone_number` (string): Phone
- `email` (string): Email
- `timezone` (string): Timezone
- `operating_hours` (object): Operating schedule
- `status` (string): Status
- `staff` (array, optional): Staff list if requested
- `services` (array, optional): Service list if requested
- `created_at` (string): ISO 8601 timestamp

**Error Responses:**
- `404 Not Found`: Location not found
- `403 Forbidden`: Insufficient permissions for private details

---

### 5.3 Update Location

**Endpoint:** `PATCH /v1/locations/{location_id}`

**Purpose:** Update location information

**Authentication:** Bearer token required

**Authorization:** Business owner, manager, or location manager

**Path Parameters:**
- `location_id` (string): Location identifier

**Request Fields (all optional):**
- Same fields as Create Location

**Response Fields (200 OK):**
- Same as Get Location Details

**Error Responses:**
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Location not found
- `422 Unprocessable Entity`: Validation errors

---

### 5.4 List Locations

**Endpoint:** `GET /v1/businesses/{business_id}/locations`

**Purpose:** List all locations for a business

**Authentication:** Bearer token required (or none for public list)

**Authorization:** Business member or public endpoint

**Path Parameters:**
- `business_id` (string): Business identifier

**Query Parameters:**
- Standard pagination and filtering parameters
- `status` (string, optional): Filter by status
- `near` (string, optional): Lat,long for proximity search
- `radius_km` (number, optional): Search radius in kilometers (requires near)

**Response Fields (200 OK):**
- `data` (array): Array of location objects
- `pagination` (object): Pagination metadata

**Error Responses:**
- `404 Not Found`: Business not found

---

### 5.5 Delete Location

**Endpoint:** `DELETE /v1/locations/{location_id}`

**Purpose:** Soft-delete a location

**Authentication:** Bearer token required

**Authorization:** Business owner only

**Path Parameters:**
- `location_id` (string): Location identifier

**Request Fields:**
- `confirmation` (string, required): Location name for confirmation

**Response (204 No Content):** Empty response

**Error Responses:**
- `400 Bad Request`: Confirmation mismatch or has future appointments
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Location not found

---

## 6. Service Management

### 6.1 Create Service

**Endpoint:** `POST /v1/businesses/{business_id}/services`

**Purpose:** Create a new bookable service

**Authentication:** Bearer token required

**Authorization:** Business owner or manager

**Path Parameters:**
- `business_id` (string): Parent business ID

**Request Fields:**
- `name` (string, required): Service name
- `description` (string, optional): Service description
- `category` (string, optional): Service category
- `duration_minutes` (integer, required): Service duration
- `buffer_before_minutes` (integer, optional): Buffer before appointment (default: 0)
- `buffer_after_minutes` (integer, optional): Buffer after appointment (default: 0)
- `price` (number, required): Base price
- `deposit_amount` (number, optional): Required deposit
- `deposit_type` (string, optional): "fixed" or "percentage"
- `tax_rate` (number, optional): Tax rate as decimal
- `image_url` (string, optional): Service image
- `color` (string, optional): Calendar color hex code
- `is_group_booking_allowed` (boolean, optional): Allow group bookings (default: false)
- `max_group_size` (integer, optional): Max clients per group (required if group booking allowed)
- `requires_approval` (boolean, optional): Manual approval required (default: false)
- `booking_advance_min_hours` (integer, optional): Min advance booking time (default: 0)
- `booking_advance_max_days` (integer, optional): Max advance booking time
- `cancellation_allowed_hours` (integer, optional): Cancellation cutoff before appointment
- `location_ids` (array, optional): Location IDs where service is offered
- `sort_order` (integer, optional): Display order

**Response Fields (201 Created):**
- `id` (string): Service ID
- `business_id` (string): Parent business ID
- `name` (string): Service name
- `duration_minutes` (integer): Duration
- `price` (number): Price
- `status` (string): "active"
- `created_at` (string): ISO 8601 timestamp
- All other submitted fields

**Error Responses:**
- `400 Bad Request`: Invalid input format
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Business not found
- `422 Unprocessable Entity`: Validation errors

---

### 6.2 Get Service Details

**Endpoint:** `GET /v1/services/{service_id}`

**Purpose:** Retrieve service information

**Authentication:** Bearer token required (or none for public information)

**Authorization:** Business member or public endpoint

**Path Parameters:**
- `service_id` (string): Service identifier

**Query Parameters:**
- `include_staff` (boolean, optional): Include qualified staff list (default: false)
- `include_addons` (boolean, optional): Include available add-ons (default: false)

**Response Fields (200 OK):**
- `id` (string): Service ID
- `business_id` (string): Business ID
- `name` (string): Service name
- `description` (string): Description
- `category` (string): Category
- `duration_minutes` (integer): Duration
- `buffer_before_minutes` (integer): Buffer before
- `buffer_after_minutes` (integer): Buffer after
- `price` (number): Price
- `price_currency` (string): Currency code
- `deposit_amount` (number): Deposit
- `deposit_type` (string): Deposit type
- `tax_rate` (number): Tax rate
- `image_url` (string): Image URL
- `color` (string): Calendar color
- `is_group_booking_allowed` (boolean): Group booking flag
- `max_group_size` (integer): Max group size
- `requires_approval` (boolean): Approval required
- `booking_advance_min_hours` (integer): Min advance time
- `booking_advance_max_days` (integer): Max advance time
- `cancellation_allowed_hours` (integer): Cancellation cutoff
- `status` (string): Status
- `staff` (array, optional): Qualified staff if requested
- `addons` (array, optional): Add-ons if requested
- `created_at` (string): ISO 8601 timestamp

**Error Responses:**
- `404 Not Found`: Service not found

---

### 6.3 Update Service

**Endpoint:** `PATCH /v1/services/{service_id}`

**Purpose:** Update service information

**Authentication:** Bearer token required

**Authorization:** Business owner or manager

**Path Parameters:**
- `service_id` (string): Service identifier

**Request Fields (all optional):**
- Same fields as Create Service

**Response Fields (200 OK):**
- Same as Get Service Details

**Error Responses:**
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Service not found
- `422 Unprocessable Entity`: Validation errors

---

### 6.4 List Services

**Endpoint:** `GET /v1/businesses/{business_id}/services`

**Purpose:** List all services for a business

**Authentication:** Bearer token required (or none for public list)

**Authorization:** Business member or public endpoint

**Path Parameters:**
- `business_id` (string): Business identifier

**Query Parameters:**
- Standard pagination and filtering parameters
- `status` (string, optional): Filter by status
- `category` (string, optional): Filter by category
- `location_id` (string, optional): Filter by location availability
- `min_duration` (integer, optional): Minimum duration in minutes
- `max_duration` (integer, optional): Maximum duration in minutes
- `min_price` (number, optional): Minimum price
- `max_price` (number, optional): Maximum price

**Response Fields (200 OK):**
- `data` (array): Array of service objects
- `pagination` (object): Pagination metadata

**Error Responses:**
- `404 Not Found`: Business not found

---

### 6.5 Delete Service

**Endpoint:** `DELETE /v1/services/{service_id}`

**Purpose:** Soft-delete a service

**Authentication:** Bearer token required

**Authorization:** Business owner or manager

**Path Parameters:**
- `service_id` (string): Service identifier

**Response (204 No Content):** Empty response

**Error Responses:**
- `400 Bad Request`: Has future appointments
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Service not found

**Note:** Service is archived rather than deleted. Historical appointments retain service information.

---

### 6.6 Create Service Add-on

**Endpoint:** `POST /v1/services/{service_id}/addons`

**Purpose:** Create optional add-on for a service

**Authentication:** Bearer token required

**Authorization:** Business owner or manager

**Path Parameters:**
- `service_id` (string): Parent service ID

**Request Fields:**
- `name` (string, required): Add-on name
- `description` (string, optional): Add-on description
- `additional_duration_minutes` (integer, required): Added duration
- `additional_price` (number, required): Added cost
- `sort_order` (integer, optional): Display order

**Response Fields (201 Created):**
- `id` (string): Add-on ID
- `service_id` (string): Parent service ID
- `name` (string): Add-on name
- `additional_duration_minutes` (integer): Duration
- `additional_price` (number): Price
- `status` (string): "active"
- `created_at` (string): ISO 8601 timestamp

**Error Responses:**
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Service not found

---

## 7. Staff Management

### 7.1 Create Staff Member

**Endpoint:** `POST /v1/businesses/{business_id}/staff`

**Purpose:** Add staff member to business

**Authentication:** Bearer token required

**Authorization:** Business owner or manager with staff permission

**Path Parameters:**
- `business_id` (string): Business identifier

**Request Fields:**
- `user_id` (string, optional): Existing user ID (if inviting existing user)
- `email` (string, required if no user_id): Email to invite new staff member
- `first_name` (string, required if no user_id): First name
- `last_name` (string, required if no user_id): Last name
- `location_id` (string, required): Primary location assignment
- `title` (string, optional): Job title
- `bio` (string, optional): Staff biography
- `photo_url` (string, optional): Staff photo URL
- `calendar_color` (string, optional): Calendar color hex code
- `commission_rate` (number, optional): Commission percentage
- `hourly_rate` (number, optional): Hourly rate
- `hire_date` (string, optional): ISO 8601 date
- `accepts_online_bookings` (boolean, optional): Accept online bookings (default: true)
- `default_buffer_before_minutes` (integer, optional): Default buffer before
- `default_buffer_after_minutes` (integer, optional): Default buffer after
- `role_id` (string, optional): Role to assign
- `service_ids` (array, optional): Service IDs staff can perform

**Response Fields (201 Created):**
- `id` (string): Staff member ID
- `user_id` (string): Associated user ID
- `business_id` (string): Business ID
- `location_id` (string): Location ID
- `email` (string): Email address
- `first_name` (string): First name
- `last_name` (string): Last name
- `title` (string): Job title
- `status` (string): "active" or "pending_invitation"
- `invitation_sent` (boolean): Whether invitation email sent
- `created_at` (string): ISO 8601 timestamp
- All other submitted fields

**Error Responses:**
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Business or location not found
- `409 Conflict`: User already staff member
- `422 Unprocessable Entity`: Validation errors

---

### 7.2 Get Staff Member Details

**Endpoint:** `GET /v1/staff/{staff_id}`

**Purpose:** Retrieve staff member information

**Authentication:** Bearer token required

**Authorization:** Business member or public endpoint (limited info)

**Path Parameters:**
- `staff_id` (string): Staff member identifier

**Query Parameters:**
- `include_availability` (boolean, optional): Include availability schedule (default: false)
- `include_services` (boolean, optional): Include service skills (default: false)
- `include_statistics` (boolean, optional): Include performance stats (default: false, requires permissions)

**Response Fields (200 OK):**
- `id` (string): Staff member ID
- `user_id` (string): User ID
- `business_id` (string): Business ID
- `location_id` (string): Location ID
- `first_name` (string): First name
- `last_name` (string): Last name
- `title` (string): Job title
- `bio` (string): Biography
- `photo_url` (string): Photo URL
- `calendar_color` (string): Calendar color
- `status` (string): Status
- `accepts_online_bookings` (boolean): Online booking flag
- `availability` (array, optional): Availability rules if requested
- `services` (array, optional): Service skills if requested
- `statistics` (object, optional): Performance statistics if requested
  - `total_appointments` (integer): Total appointments completed
  - `average_rating` (number): Average client rating
  - `total_revenue` (number): Total revenue generated
- `created_at` (string): ISO 8601 timestamp

**Error Responses:**
- `404 Not Found`: Staff member not found
- `403 Forbidden`: Insufficient permissions for private details

**Note:** Sensitive fields like commission_rate and hourly_rate only visible to business owner/manager

---

### 7.3 Update Staff Member

**Endpoint:** `PATCH /v1/staff/{staff_id}`

**Purpose:** Update staff member information

**Authentication:** Bearer token required

**Authorization:** Business owner, manager, or own staff profile (limited fields)

**Path Parameters:**
- `staff_id` (string): Staff member identifier

**Request Fields (all optional):**
- Same fields as Create Staff Member (except user_id, email)
- `status` (string): Update status ("active", "inactive", "on_leave")
- `termination_date` (string): ISO 8601 date (owner/manager only)

**Response Fields (200 OK):**
- Same as Get Staff Member Details

**Error Responses:**
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Staff member not found
- `422 Unprocessable Entity`: Validation errors

---

### 7.4 List Staff Members

**Endpoint:** `GET /v1/businesses/{business_id}/staff`

**Purpose:** List staff members for a business

**Authentication:** Bearer token required (or none for public list)

**Authorization:** Business member or public endpoint (limited info)

**Path Parameters:**
- `business_id` (string): Business identifier

**Query Parameters:**
- Standard pagination and filtering parameters
- `location_id` (string, optional): Filter by location
- `status` (string, optional): Filter by status
- `service_id` (string, optional): Filter by service capability
- `accepts_online_bookings` (boolean, optional): Filter by online booking acceptance

**Response Fields (200 OK):**
- `data` (array): Array of staff member objects
- `pagination` (object): Pagination metadata

**Error Responses:**
- `404 Not Found`: Business not found

---

### 7.5 Delete Staff Member

**Endpoint:** `DELETE /v1/staff/{staff_id}`

**Purpose:** Remove staff member from business

**Authentication:** Bearer token required

**Authorization:** Business owner or manager

**Path Parameters:**
- `staff_id` (string): Staff member identifier

**Request Fields:**
- `transfer_appointments_to_staff_id` (string, optional): Staff ID to reassign future appointments
- `cancel_future_appointments` (boolean, optional): Cancel all future appointments (default: false)

**Response (204 No Content):** Empty response

**Error Responses:**
- `400 Bad Request`: Has future appointments and no transfer/cancel option specified
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Staff member not found

---

### 7.6 Set Staff Availability

**Endpoint:** `POST /v1/staff/{staff_id}/availability`

**Purpose:** Define staff availability schedule

**Authentication:** Bearer token required

**Authorization:** Business owner, manager, or own staff profile

**Path Parameters:**
- `staff_id` (string): Staff member identifier

**Request Fields:**
- `type` (string, required): "recurring", "one_time", or "time_off"
- `day_of_week` (integer, optional): 0-6 (required for recurring)
- `start_date` (string, optional): ISO 8601 date (required for one_time/time_off)
- `end_date` (string, optional): ISO 8601 date (required for one_time/time_off)
- `start_time` (string, required): Time in HH:MM format
- `end_time` (string, required): Time in HH:MM format
- `timezone` (string, required): IANA timezone
- `is_available` (boolean, required): True for available, false for time-off
- `notes` (string, optional): Availability notes
- `recurrence_rule` (string, optional): iCalendar RRULE for complex patterns

**Response Fields (201 Created):**
- `id` (string): Availability rule ID
- `staff_member_id` (string): Staff member ID
- `type` (string): Rule type
- `day_of_week` (integer): Day of week
- `start_date` (string): Start date
- `end_date` (string): End date
- `start_time` (string): Start time
- `end_time` (string): End time
- `timezone` (string): Timezone
- `is_available` (boolean): Availability flag
- `created_at` (string): ISO 8601 timestamp

**Error Responses:**
- `400 Bad Request`: Invalid input or time range conflicts
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Staff member not found
- `422 Unprocessable Entity`: Validation errors

---

### 7.7 Get Staff Availability

**Endpoint:** `GET /v1/staff/{staff_id}/availability`

**Purpose:** Retrieve staff availability schedule

**Authentication:** Bearer token required (or none for public availability)

**Authorization:** Business member or public endpoint

**Path Parameters:**
- `staff_id` (string): Staff member identifier

**Query Parameters:**
- `start_date` (string, optional): ISO 8601 date to filter from
- `end_date` (string, optional): ISO 8601 date to filter to
- `type` (string, optional): Filter by type

**Response Fields (200 OK):**
- `data` (array): Array of availability rule objects
- `pagination` (object): Pagination metadata

**Error Responses:**
- `404 Not Found`: Staff member not found

---

### 7.8 Update Staff Availability

**Endpoint:** `PATCH /v1/staff/{staff_id}/availability/{availability_id}`

**Purpose:** Update availability rule

**Authentication:** Bearer token required

**Authorization:** Business owner, manager, or own staff profile

**Path Parameters:**
- `staff_id` (string): Staff member identifier
- `availability_id` (string): Availability rule identifier

**Request Fields (all optional):**
- Same fields as Set Staff Availability

**Response Fields (200 OK):**
- Same as Set Staff Availability

**Error Responses:**
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Staff member or availability rule not found
- `422 Unprocessable Entity`: Validation errors

---

### 7.9 Delete Staff Availability

**Endpoint:** `DELETE /v1/staff/{staff_id}/availability/{availability_id}`

**Purpose:** Remove availability rule

**Authentication:** Bearer token required

**Authorization:** Business owner, manager, or own staff profile

**Path Parameters:**
- `staff_id` (string): Staff member identifier
- `availability_id` (string): Availability rule identifier

**Response (204 No Content):** Empty response

**Error Responses:**
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Staff member or availability rule not found

---

### 7.10 Assign Service to Staff

**Endpoint:** `POST /v1/staff/{staff_id}/services`

**Purpose:** Assign service skill to staff member

**Authentication:** Bearer token required

**Authorization:** Business owner or manager

**Path Parameters:**
- `staff_id` (string): Staff member identifier

**Request Fields:**
- `service_id` (string, required): Service identifier
- `proficiency_level` (string, required): "trainee", "competent", "proficient", or "expert"
- `duration_override_minutes` (integer, optional): Staff-specific duration
- `price_override` (number, optional): Staff-specific pricing
- `is_preferred` (boolean, optional): Highlight for this service (default: false)

**Response Fields (201 Created):**
- `id` (string): Staff skill ID
- `staff_member_id` (string): Staff member ID
- `service_id` (string): Service ID
- `proficiency_level` (string): Proficiency level
- `duration_override_minutes` (integer): Duration override
- `price_override` (number): Price override
- `is_preferred` (boolean): Preferred flag
- `created_at` (string): ISO 8601 timestamp

**Error Responses:**
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Staff member or service not found
- `409 Conflict`: Service already assigned
- `422 Unprocessable Entity`: Validation errors

---

## 8. Client Management

### 8.1 Create Client Profile

**Endpoint:** `POST /v1/businesses/{business_id}/clients`

**Purpose:** Create client profile for business

**Authentication:** Bearer token required

**Authorization:** Business staff member

**Path Parameters:**
- `business_id` (string): Business identifier

**Request Fields:**
- `user_id` (string, optional): Existing user ID
- `email` (string, required): Client email
- `first_name` (string, required): First name
- `last_name` (string, required): Last name
- `phone_number` (string, optional): Phone number
- `date_of_birth` (string, optional): ISO 8601 date
- `gender` (string, optional): Gender
- `address_line1` (string, optional): Street address
- `address_line2` (string, optional): Additional address
- `city` (string, optional): City
- `state_province` (string, optional): State/province
- `postal_code` (string, optional): Postal code
- `country` (string, optional): Country code
- `preferred_location_id` (string, optional): Preferred location ID
- `preferred_staff_member_id` (string, optional): Preferred staff ID
- `notes` (string, optional): Staff notes about client
- `tags` (array, optional): Array of tag strings
- `marketing_consent` (boolean, optional): Marketing opt-in (default: false)

**Response Fields (201 Created):**
- `id` (string): Client profile ID
- `user_id` (string): Associated user ID
- `business_id` (string): Business ID
- `email` (string): Email
- `first_name` (string): First name
- `last_name` (string): Last name
- `phone_number` (string): Phone
- `preferred_location_id` (string): Preferred location
- `preferred_staff_member_id` (string): Preferred staff
- `loyalty_points` (integer): Initial loyalty points (0)
- `total_spent` (number): Initial total spent (0)
- `status` (string): "active"
- `created_at` (string): ISO 8601 timestamp

**Error Responses:**
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Business not found
- `409 Conflict`: Client already exists for this business
- `422 Unprocessable Entity`: Validation errors

---

### 8.2 Get Client Profile

**Endpoint:** `GET /v1/clients/{client_id}`

**Purpose:** Retrieve client profile

**Authentication:** Bearer token required

**Authorization:** Business staff or own client profile

**Path Parameters:**
- `client_id` (string): Client profile identifier

**Query Parameters:**
- `include_appointments` (boolean, optional): Include appointment history (default: false)
- `include_statistics` (boolean, optional): Include statistics (default: false)

**Response Fields (200 OK):**
- `id` (string): Client profile ID
- `user_id` (string): User ID
- `business_id` (string): Business ID
- `email` (string): Email
- `first_name` (string): First name
- `last_name` (string): Last name
- `phone_number` (string): Phone
- `date_of_birth` (string): Date of birth
- `gender` (string): Gender
- `address_line1` (string): Address
- `address_line2` (string): Address line 2
- `city` (string): City
- `state_province` (string): State/province
- `postal_code` (string): Postal code
- `country` (string): Country
- `preferred_location_id` (string): Preferred location
- `preferred_staff_member_id` (string): Preferred staff
- `loyalty_points` (integer): Loyalty points
- `total_spent` (number): Total spent
- `no_show_count` (integer): No-show count
- `cancellation_count` (integer): Cancellation count
- `notes` (string): Staff notes
- `tags` (array): Tags
- `status` (string): Status
- `marketing_consent` (boolean): Marketing opt-in
- `appointments` (array, optional): Appointment history if requested
- `statistics` (object, optional): Client statistics if requested
  - `total_appointments` (integer): Total appointments
  - `completed_appointments` (integer): Completed appointments
  - `average_rating_given` (number): Average rating
  - `most_booked_service` (string): Service name
  - `last_appointment_date` (string): ISO 8601 date
- `created_at` (string): ISO 8601 timestamp

**Error Responses:**
- `404 Not Found`: Client profile not found
- `403 Forbidden`: Insufficient permissions

---

### 8.3 Update Client Profile

**Endpoint:** `PATCH /v1/clients/{client_id}`

**Purpose:** Update client profile

**Authentication:** Bearer token required

**Authorization:** Business staff or own client profile (limited fields)

**Path Parameters:**
- `client_id` (string): Client profile identifier

**Request Fields (all optional):**
- Same fields as Create Client Profile (except user_id, email)
- `status` (string): Update status (staff only)

**Response Fields (200 OK):**
- Same as Get Client Profile

**Error Responses:**
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Client profile not found
- `422 Unprocessable Entity`: Validation errors

---

### 8.4 List Clients

**Endpoint:** `GET /v1/businesses/{business_id}/clients`

**Purpose:** List clients for a business

**Authentication:** Bearer token required

**Authorization:** Business staff member

**Path Parameters:**
- `business_id` (string): Business identifier

**Query Parameters:**
- Standard pagination and filtering parameters
- `status` (string, optional): Filter by status
- `tags` (string, optional): Comma-separated tags
- `search` (string, optional): Search by name, email, phone
- `has_upcoming_appointments` (boolean, optional): Filter by upcoming appointments
- `last_visit_before` (string, optional): ISO 8601 date
- `last_visit_after` (string, optional): ISO 8601 date
- `min_total_spent` (number, optional): Minimum total spent
- `min_loyalty_points` (integer, optional): Minimum loyalty points

**Response Fields (200 OK):**
- `data` (array): Array of client profile objects
- `pagination` (object): Pagination metadata

**Error Responses:**
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Business not found

---

### 8.5 Delete Client Profile

**Endpoint:** `DELETE /v1/clients/{client_id}`

**Purpose:** Delete client profile (GDPR compliance)

**Authentication:** Bearer token required

**Authorization:** Business owner or own client profile

**Path Parameters:**
- `client_id` (string): Client profile identifier

**Request Fields:**
- `anonymize_only` (boolean, optional): Anonymize instead of hard delete (default: true)

**Response (204 No Content):** Empty response

**Error Responses:**
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Client profile not found

**Note:** Default behavior anonymizes PII while retaining appointment records for business analytics. Hard delete only allowed by tenant owner.

---

### 8.6 Add Client Note

**Endpoint:** `POST /v1/clients/{client_id}/notes`

**Purpose:** Add note about client

**Authentication:** Bearer token required

**Authorization:** Business staff member

**Path Parameters:**
- `client_id` (string): Client profile identifier

**Request Fields:**
- `content` (string, required): Note content
- `is_pinned` (boolean, optional): Pin to top (default: false)
- `is_private` (boolean, optional): Visible only to author (default: false)

**Response Fields (201 Created):**
- `id` (string): Note ID
- `client_id` (string): Client profile ID
- `author_id` (string): Author user ID
- `author_name` (string): Author name
- `content` (string): Note content
- `is_pinned` (boolean): Pinned flag
- `is_private` (boolean): Private flag
- `created_at` (string): ISO 8601 timestamp

**Error Responses:**
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Client profile not found

---

### 8.7 Tag Client

**Endpoint:** `POST /v1/clients/{client_id}/tags`

**Purpose:** Add tag to client

**Authentication:** Bearer token required

**Authorization:** Business staff member

**Path Parameters:**
- `client_id` (string): Client profile identifier

**Request Fields:**
- `tag_name` (string, required): Tag name

**Response Fields (201 Created):**
- `tag_id` (string): Tag ID
- `tag_name` (string): Tag name
- `tag_color` (string): Tag color

**Error Responses:**
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Client profile not found

---

## 9. Appointment Management

### 9.1 Check Availability

**Endpoint:** `GET /v1/availability`

**Purpose:** Check available appointment slots

**Authentication:** Optional (public endpoint supports anonymous checking)

**Authorization:** None for basic availability, authenticated for personalized recommendations

**Query Parameters:**
- `business_id` (string, required): Business identifier
- `location_id` (string, optional): Specific location
- `service_id` (string, required): Service identifier
- `staff_member_id` (string, optional): Specific staff member
- `start_date` (string, required): ISO 8601 date range start
- `end_date` (string, required): ISO 8601 date range end
- `timezone` (string, optional): Client timezone for display (default: location timezone)
- `group_size` (integer, optional): Number of clients (default: 1)

**Response Fields (200 OK):**
- `available_slots` (array): Array of available time slots
  - `start_time` (string): ISO 8601 timestamp
  - `end_time` (string): ISO 8601 timestamp
  - `staff_member_id` (string): Available staff member
  - `staff_member_name` (string): Staff name
  - `location_id` (string): Location ID
  - `price` (number): Appointment price
  - `deposit_amount` (number): Required deposit
  - `recommended` (boolean): AI recommendation flag (if authenticated)
  - `recommendation_reason` (string): Reason for recommendation
- `business_hours` (object): Business operating hours for date range
- `timezone` (string): Timezone for display

**Error Responses:**
- `400 Bad Request`: Invalid query parameters
- `404 Not Found`: Business or service not found

**Note:** Returns slots considering staff availability, existing appointments, buffer times, and business hours

---

### 9.2 Create Appointment

**Endpoint:** `POST /v1/appointments`

**Purpose:** Book a new appointment

**Authentication:** Bearer token required (or optional for guest bookings if enabled)

**Authorization:** Client, business staff, or guest

**Request Fields:**
- `business_id` (string, required): Business identifier
- `location_id` (string, required): Location identifier
- `service_id` (string, required): Service identifier
- `staff_member_id` (string, optional): Preferred staff (auto-assigned if not provided)
- `start_time` (string, required): ISO 8601 timestamp
- `timezone` (string, required): Client timezone
- `client_id` (string, optional): Client profile ID (staff booking for client)
- `guest_email` (string, optional): Email for guest booking
- `guest_first_name` (string, optional): First name for guest booking
- `guest_last_name` (string, optional): Last name for guest booking
- `guest_phone_number` (string, optional): Phone for guest booking
- `addon_ids` (array, optional): Array of service addon IDs
- `group_size` (integer, optional): Number of clients (default: 1)
- `notes` (string, optional): Client notes for appointment
- `recurrence_rule` (string, optional): iCalendar RRULE for recurring appointments
- `recurrence_end_date` (string, optional): End date for recurring series
- `coupon_code` (string, optional): Discount coupon code
- `payment_method` (string, optional): Payment method for deposit
- `payment_method_id` (string, optional): Stored payment method token

**Response Fields (201 Created):**
- `id` (string): Appointment ID
- `appointment_number` (string): Human-readable appointment number
- `business_id` (string): Business ID
- `location_id` (string): Location ID
- `service_id` (string): Service ID
- `staff_member_id` (string): Assigned staff ID
- `client_id` (string): Client profile ID
- `start_time` (string): ISO 8601 timestamp
- `end_time` (string): ISO 8601 timestamp
- `timezone` (string): Timezone
- `duration_minutes` (integer): Total duration
- `status` (string): "pending" or "confirmed"
- `payment` (object): Payment information
  - `id` (string): Payment ID
  - `amount` (number): Total amount
  - `amount_paid` (number): Deposit paid
  - `amount_due` (number): Remaining balance
  - `status` (string): Payment status
- `recurring_group_id` (string): Recurring series ID (if applicable)
- `recurrence_instances_created` (integer): Number of recurring appointments created
- `confirmation_sent` (boolean): Whether confirmation email sent
- `created_at` (string): ISO 8601 timestamp

**Error Responses:**
- `400 Bad Request`: Invalid input or slot no longer available
- `401 Unauthorized`: Invalid authentication (if auth required)
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Business, location, service, or staff not found
- `409 Conflict`: Time slot conflict (already booked)
- `422 Unprocessable Entity`: Validation errors (e.g., outside business hours, invalid recurrence rule)

**Note:** Appointment requires approval if service has `requires_approval` set to true. Deposit may be required based on service settings.

---

### 9.3 Get Appointment Details

**Endpoint:** `GET /v1/appointments/{appointment_id}`

**Purpose:** Retrieve appointment information

**Authentication:** Bearer token required

**Authorization:** Appointment client, business staff, or appointment participant

**Path Parameters:**
- `appointment_id` (string): Appointment identifier

**Response Fields (200 OK):**
- `id` (string): Appointment ID
- `appointment_number` (string): Appointment number
- `business_id` (string): Business ID
- `business_name` (string): Business name
- `location_id` (string): Location ID
- `location_name` (string): Location name
- `location_address` (string): Location address
- `service_id` (string): Service ID
- `service_name` (string): Service name
- `service_duration` (integer): Service duration minutes
- `staff_member_id` (string): Staff member ID
- `staff_member_name` (string): Staff name
- `staff_member_photo_url` (string): Staff photo
- `client_id` (string): Client profile ID
- `client_name` (string): Client name
- `client_email` (string): Client email
- `client_phone` (string): Client phone
- `start_time` (string): ISO 8601 timestamp
- `end_time` (string): ISO 8601 timestamp
- `timezone` (string): Timezone
- `duration_minutes` (integer): Total duration
- `buffer_before_minutes` (integer): Buffer before
- `buffer_after_minutes` (integer): Buffer after
- `status` (string): Appointment status
- `is_recurring` (boolean): Recurring flag
- `recurring_group_id` (string): Recurring series ID
- `is_group_booking` (boolean): Group booking flag
- `group_size` (integer): Group size
- `notes` (string): Client notes
- `internal_notes` (string): Staff notes (staff only)
- `addons` (array): Service add-ons
- `payment` (object): Payment details
- `cancellation_policy` (object): Cancellation policy
  - `cancellation_allowed_until` (string): ISO 8601 timestamp
  - `cancellation_fee_percentage` (number): Fee percentage
- `check_in_time` (string): Check-in timestamp (if checked in)
- `completion_time` (string): Completion timestamp (if completed)
- `created_at` (string): ISO 8601 timestamp
- `updated_at` (string): ISO 8601 timestamp

**Error Responses:**
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Appointment not found

---

### 9.4 Update Appointment

**Endpoint:** `PATCH /v1/appointments/{appointment_id}`

**Purpose:** Modify appointment details

**Authentication:** Bearer token required

**Authorization:** Appointment client (limited fields) or business staff

**Path Parameters:**
- `appointment_id` (string): Appointment identifier

**Request Fields (all optional):**
- `start_time` (string): New start time (reschedule)
- `staff_member_id` (string): Reassign to different staff
- `notes` (string): Update client notes
- `internal_notes` (string): Update staff notes (staff only)
- `status` (string): Update status (staff only, limited transitions)

**Response Fields (200 OK):**
- Same as Get Appointment Details

**Error Responses:**
- `400 Bad Request`: Invalid input or new time slot unavailable
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions or invalid status transition
- `404 Not Found`: Appointment not found
- `409 Conflict`: Time slot conflict for reschedule
- `422 Unprocessable Entity`: Validation errors

**Note:** Rescheduling subject to cancellation policy. May require approval. Notification sent on significant changes.

---

### 9.5 Cancel Appointment

**Endpoint:** `POST /v1/appointments/{appointment_id}/cancel`

**Purpose:** Cancel an appointment

**Authentication:** Bearer token required

**Authorization:** Appointment client or business staff

**Path Parameters:**
- `appointment_id` (string): Appointment identifier

**Request Fields:**
- `cancellation_reason` (string, optional): Reason for cancellation
- `cancel_recurring_series` (boolean, optional): Cancel entire recurring series (default: false)

**Response Fields (200 OK):**
- `id` (string): Appointment ID
- `status` (string): "cancelled"
- `cancelled_at` (string): ISO 8601 timestamp
- `cancelled_by` (string): User ID who cancelled
- `cancellation_reason` (string): Cancellation reason
- `refund` (object): Refund information
  - `refund_amount` (number): Amount refunded
  - `refund_status` (string): Refund status
  - `cancellation_fee` (number): Fee charged
- `recurring_instances_cancelled` (integer): Number of recurring instances cancelled (if series)

**Error Responses:**
- `400 Bad Request`: Cannot cancel (too late, already completed, etc.)
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Appointment not found

**Note:** Cancellation policy applied. Refund issued if paid deposit minus cancellation fee.

---

### 9.6 Check In Appointment

**Endpoint:** `POST /v1/appointments/{appointment_id}/check-in`

**Purpose:** Mark client as checked in

**Authentication:** Bearer token required

**Authorization:** Business staff member

**Path Parameters:**
- `appointment_id` (string): Appointment identifier

**Request Fields:**
- None (timestamp auto-generated)

**Response Fields (200 OK):**
- `id` (string): Appointment ID
- `status` (string): "checked_in"
- `check_in_time` (string): ISO 8601 timestamp

**Error Responses:**
- `400 Bad Request`: Appointment not in eligible status
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Appointment not found

---

### 9.7 Complete Appointment

**Endpoint:** `POST /v1/appointments/{appointment_id}/complete`

**Purpose:** Mark appointment as completed

**Authentication:** Bearer token required

**Authorization:** Business staff member

**Path Parameters:**
- `appointment_id` (string): Appointment identifier

**Request Fields:**
- `actual_duration_minutes` (integer, optional): Actual duration (for AI learning)
- `services_performed` (array, optional): Actual services performed (may differ from booked)
- `internal_notes` (string, optional): Staff notes about appointment

**Response Fields (200 OK):**
- `id` (string): Appointment ID
- `status` (string): "completed"
- `completion_time` (string): ISO 8601 timestamp
- `payment_required` (boolean): Whether payment still due
- `payment_amount_due` (number): Remaining balance

**Error Responses:**
- `400 Bad Request`: Appointment not in eligible status
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Appointment not found

---

### 9.8 Mark No-Show

**Endpoint:** `POST /v1/appointments/{appointment_id}/no-show`

**Purpose:** Mark appointment as no-show

**Authentication:** Bearer token required

**Authorization:** Business staff member

**Path Parameters:**
- `appointment_id` (string): Appointment identifier

**Request Fields:**
- `notes` (string, optional): Notes about no-show

**Response Fields (200 OK):**
- `id` (string): Appointment ID
- `status` (string): "no_show"
- `no_show_recorded_at` (string): ISO 8601 timestamp
- `no_show_fee_charged` (boolean): Whether fee applied
- `no_show_fee_amount` (number): Fee amount

**Error Responses:**
- `400 Bad Request`: Appointment not in eligible status
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Appointment not found

**Note:** Client's no-show count incremented. Policy-based fee may be charged. Future booking may be restricted based on business rules.

---

### 9.9 List Appointments

**Endpoint:** `GET /v1/appointments`

**Purpose:** List appointments with filtering

**Authentication:** Bearer token required

**Authorization:** Business staff or own appointments for clients

**Query Parameters:**
- Standard pagination and filtering parameters
- `business_id` (string, optional): Filter by business
- `location_id` (string, optional): Filter by location
- `staff_member_id` (string, optional): Filter by staff
- `client_id` (string, optional): Filter by client
- `service_id` (string, optional): Filter by service
- `status` (string, optional): Comma-separated statuses
- `start_time_after` (string, optional): ISO 8601 timestamp
- `start_time_before` (string, optional): ISO 8601 timestamp
- `is_recurring` (boolean, optional): Filter recurring appointments
- `recurring_group_id` (string, optional): Filter by recurring series

**Response Fields (200 OK):**
- `data` (array): Array of appointment objects (summary format)
- `pagination` (object): Pagination metadata

**Error Responses:**
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions

---

### 9.10 Get Recurring Appointments

**Endpoint:** `GET /v1/appointments/recurring/{recurring_group_id}`

**Purpose:** Get all appointments in recurring series

**Authentication:** Bearer token required

**Authorization:** Business staff or client who created series

**Path Parameters:**
- `recurring_group_id` (string): Recurring series identifier

**Query Parameters:**
- `include_past` (boolean, optional): Include past appointments (default: false)
- `include_cancelled` (boolean, optional): Include cancelled appointments (default: false)

**Response Fields (200 OK):**
- `recurring_group_id` (string): Series ID
- `recurrence_rule` (string): iCalendar RRULE
- `total_instances` (integer): Total appointments in series
- `completed_instances` (integer): Completed count
- `cancelled_instances` (integer): Cancelled count
- `upcoming_instances` (integer): Upcoming count
- `appointments` (array): Array of appointment objects
- `next_occurrence` (string): ISO 8601 timestamp of next appointment

**Error Responses:**
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Recurring series not found

---

### 9.11 Cancel Recurring Series

**Endpoint:** `POST /v1/appointments/recurring/{recurring_group_id}/cancel`

**Purpose:** Cancel entire recurring appointment series

**Authentication:** Bearer token required

**Authorization:** Client who created series or business staff

**Path Parameters:**
- `recurring_group_id` (string): Recurring series identifier

**Request Fields:**
- `cancellation_reason` (string, optional): Reason for cancellation
- `cancel_future_only` (boolean, optional): Only cancel future appointments (default: true)

**Response Fields (200 OK):**
- `recurring_group_id` (string): Series ID
- `cancelled_count` (integer): Number of appointments cancelled
- `refund_total` (number): Total refund amount
- `message` (string): Confirmation message

**Error Responses:**
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Recurring series not found

---

## 10. Calendar & Scheduling

### 10.1 Get Calendar View

**Endpoint:** `GET /v1/calendar`

**Purpose:** Retrieve calendar data for various views (day/week/month/resource)

**Authentication:** Bearer token required

**Authorization:** Business staff member

**Query Parameters:**
- `business_id` (string, required): Business identifier
- `location_id` (string, optional): Filter by location
- `view_type` (string, required): "day", "week", "month", or "resource"
- `start_date` (string, required): ISO 8601 date
- `end_date` (string, optional): ISO 8601 date (auto-calculated for day/week views)
- `staff_member_ids` (string, optional): Comma-separated staff IDs to include
- `timezone` (string, optional): Display timezone (default: location timezone)

**Response Fields (200 OK):**
- `view_type` (string): Calendar view type
- `start_date` (string): ISO 8601 date
- `end_date` (string): ISO 8601 date
- `timezone` (string): Display timezone
- `appointments` (array): Array of appointment objects
  - `id` (string): Appointment ID
  - `appointment_number` (string): Appointment number
  - `client_name` (string): Client name
  - `service_name` (string): Service name
  - `staff_member_id` (string): Staff ID
  - `staff_member_name` (string): Staff name
  - `start_time` (string): ISO 8601 timestamp
  - `end_time` (string): ISO 8601 timestamp
  - `duration_minutes` (integer): Duration
  - `status` (string): Status
  - `color` (string): Display color
- `staff_members` (array): Staff member objects (for resource view)
  - `id` (string): Staff ID
  - `name` (string): Staff name
  - `calendar_color` (string): Calendar color
  - `availability` (array): Availability blocks for date range
- `business_hours` (object): Business operating hours
- `blocked_time` (array): Time-off and unavailable blocks

**Error Responses:**
- `400 Bad Request`: Invalid query parameters
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Business or location not found

---

### 10.2 Get Staff Schedule

**Endpoint:** `GET /v1/staff/{staff_id}/schedule`

**Purpose:** Get individual staff member's schedule

**Authentication:** Bearer token required

**Authorization:** Business staff or own schedule

**Path Parameters:**
- `staff_id` (string): Staff member identifier

**Query Parameters:**
- `start_date` (string, required): ISO 8601 date
- `end_date` (string, required): ISO 8601 date
- `timezone` (string, optional): Display timezone

**Response Fields (200 OK):**
- `staff_member_id` (string): Staff ID
- `staff_member_name` (string): Staff name
- `start_date` (string): ISO 8601 date
- `end_date` (string): ISO 8601 date
- `timezone` (string): Display timezone
- `appointments` (array): Scheduled appointments
- `availability` (array): Availability blocks
- `time_off` (array): Time-off blocks
- `daily_summary` (array): Summary per day
  - `date` (string): ISO 8601 date
  - `total_appointments` (integer): Count
  - `total_duration_minutes` (integer): Total working time
  - `total_revenue` (number): Revenue for day
  - `first_appointment` (string): Start time
  - `last_appointment` (string): End time

**Error Responses:**
- `400 Bad Request`: Invalid query parameters
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Staff member not found

---

### 10.3 Block Time Slot

**Endpoint:** `POST /v1/calendar/block-time`

**Purpose:** Block time slot to prevent bookings (meetings, breaks, etc.)

**Authentication:** Bearer token required

**Authorization:** Business staff member

**Request Fields:**
- `business_id` (string, required): Business identifier
- `location_id` (string, required): Location identifier
- `staff_member_id` (string, optional): Staff member (if personal block)
- `start_time` (string, required): ISO 8601 timestamp
- `end_time` (string, required): ISO 8601 timestamp
- `timezone` (string, required): Timezone
- `reason` (string, optional): Block reason ("meeting", "break", "personal", "other")
- `title` (string, optional): Block title/description
- `is_recurring` (boolean, optional): Recurring block (default: false)
- `recurrence_rule` (string, optional): iCalendar RRULE

**Response Fields (201 Created):**
- `id` (string): Time block ID
- `staff_member_id` (string): Staff ID (if applicable)
- `start_time` (string): ISO 8601 timestamp
- `end_time` (string): ISO 8601 timestamp
- `reason` (string): Block reason
- `title` (string): Block title
- `created_at` (string): ISO 8601 timestamp

**Error Responses:**
- `400 Bad Request`: Invalid input or conflicts with existing appointment
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `409 Conflict`: Time slot already has appointment
- `422 Unprocessable Entity`: Validation errors

---

### 10.4 Remove Time Block

**Endpoint:** `DELETE /v1/calendar/block-time/{block_id}`

**Purpose:** Remove blocked time slot

**Authentication:** Bearer token required

**Authorization:** Business staff member or block creator

**Path Parameters:**
- `block_id` (string): Time block identifier

**Response (204 No Content):** Empty response

**Error Responses:**
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Time block not found

---

## 11. Payment Management

### 11.1 Create Payment

**Endpoint:** `POST /v1/payments`

**Purpose:** Process payment for appointment

**Authentication:** Bearer token required

**Authorization:** Client or business staff

**Request Fields:**
- `appointment_id` (string, required): Appointment identifier
- `amount` (number, required): Payment amount
- `payment_method` (string, required): "card", "cash", "bank_transfer", "gift_card", "other"
- `payment_method_id` (string, optional): Stored payment method token (for card)
- `payment_type` (string, required): "deposit" or "full"
- `tip_amount` (number, optional): Tip/gratuity amount (default: 0)
- `gift_card_code` (string, optional): Gift card code (if applicable)
- `save_payment_method` (boolean, optional): Save card for future use (default: false)

**Response Fields (201 Created):**
- `id` (string): Payment ID
- `appointment_id` (string): Appointment ID
- `amount` (number): Total amount
- `amount_paid` (number): Amount paid
- `payment_type` (string): Payment type
- `payment_method` (string): Payment method
- `status` (string): "pending", "authorized", "captured"
- `gateway_transaction_id` (string): External transaction ID
- `payment_intent_id` (string): Payment intent ID (Stripe)
- `client_secret` (string): Client secret for payment confirmation (if card)
- `requires_action` (boolean): Whether additional action required (3D Secure)
- `paid_at` (string): ISO 8601 timestamp (if completed)
- `created_at` (string): ISO 8601 timestamp

**Error Responses:**
- `400 Bad Request`: Invalid input or payment already processed
- `401 Unauthorized`: Invalid authentication
- `402 Payment Required`: Payment failed
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Appointment not found
- `422 Unprocessable Entity`: Validation errors

---

### 11.2 Get Payment Details

**Endpoint:** `GET /v1/payments/{payment_id}`

**Purpose:** Retrieve payment information

**Authentication:** Bearer token required

**Authorization:** Payment client, business staff, or business owner

**Path Parameters:**
- `payment_id` (string): Payment identifier

**Response Fields (200 OK):**
- `id` (string): Payment ID
- `appointment_id` (string): Appointment ID
- `client_id` (string): Client profile ID
- `amount` (number): Total amount
- `currency` (string): Currency code
- `amount_paid` (number): Amount paid
- `amount_refunded` (number): Amount refunded
- `payment_type` (string): Payment type
- `payment_method` (string): Payment method
- `payment_gateway` (string): Gateway used
- `gateway_transaction_id` (string): External transaction ID
- `status` (string): Payment status
- `paid_at` (string): ISO 8601 timestamp
- `refunded_at` (string): ISO 8601 timestamp (if refunded)
- `discount_amount` (number): Discount applied
- `tax_amount` (number): Tax charged
- `tip_amount` (number): Tip amount
- `line_items` (array): Payment breakdown
  - `description` (string): Item description
  - `quantity` (integer): Quantity
  - `unit_price` (number): Unit price
  - `total_price` (number): Total
- `refunds` (array): Refund history
- `created_at` (string): ISO 8601 timestamp

**Error Responses:**
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Payment not found

---

### 11.3 Refund Payment

**Endpoint:** `POST /v1/payments/{payment_id}/refund`

**Purpose:** Issue refund for payment

**Authentication:** Bearer token required

**Authorization:** Business owner or manager

**Path Parameters:**
- `payment_id` (string): Payment identifier

**Request Fields:**
- `amount` (number, optional): Refund amount (default: full refund)
- `reason` (string, optional): Refund reason

**Response Fields (200 OK):**
- `refund_id` (string): Refund identifier
- `payment_id` (string): Payment ID
- `amount` (number): Refund amount
- `reason` (string): Refund reason
- `status` (string): "pending", "completed", "failed"
- `gateway_refund_id` (string): External refund ID
- `refunded_at` (string): ISO 8601 timestamp (if completed)
- `created_at` (string): ISO 8601 timestamp

**Error Responses:**
- `400 Bad Request`: Invalid refund amount or payment not refundable
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Payment not found
- `422 Unprocessable Entity`: Validation errors

---

### 11.4 List Payments

**Endpoint:** `GET /v1/payments`

**Purpose:** List payments with filtering

**Authentication:** Bearer token required

**Authorization:** Business staff or own payments

**Query Parameters:**
- Standard pagination and filtering parameters
- `business_id` (string, optional): Filter by business
- `client_id` (string, optional): Filter by client
- `appointment_id` (string, optional): Filter by appointment
- `status` (string, optional): Comma-separated statuses
- `payment_method` (string, optional): Filter by payment method
- `paid_after` (string, optional): ISO 8601 timestamp
- `paid_before` (string, optional): ISO 8601 timestamp
- `min_amount` (number, optional): Minimum amount
- `max_amount` (number, optional): Maximum amount

**Response Fields (200 OK):**
- `data` (array): Array of payment objects (summary format)
- `pagination` (object): Pagination metadata
- `total_amount` (number): Sum of payment amounts in result set
- `total_count` (integer): Total matching payments

**Error Responses:**
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions

---

## 12. Coupons & Promotions

### 12.1 Create Coupon

**Endpoint:** `POST /v1/businesses/{business_id}/coupons`

**Purpose:** Create discount coupon

**Authentication:** Bearer token required

**Authorization:** Business owner or manager

**Path Parameters:**
- `business_id` (string): Business identifier

**Request Fields:**
- `code` (string, required): Coupon code (uppercase alphanumeric)
- `description` (string, optional): Coupon description
- `discount_type` (string, required): "percentage" or "fixed_amount"
- `discount_value` (number, required): Discount value
- `currency` (string, optional): Currency for fixed amount (default: business currency)
- `min_purchase_amount` (number, optional): Minimum purchase required
- `max_discount_amount` (number, optional): Cap for percentage discounts
- `applies_to` (string, required): "all_services", "specific_services", "specific_categories"
- `applicable_service_ids` (array, optional): Service IDs (if specific_services)
- `usage_limit` (integer, optional): Total usage limit
- `usage_limit_per_client` (integer, optional): Per-client usage limit
- `valid_from` (string, required): ISO 8601 timestamp
- `valid_until` (string, optional): ISO 8601 timestamp

**Response Fields (201 Created):**
- `id` (string): Coupon ID
- `business_id` (string): Business ID
- `code` (string): Coupon code
- `description` (string): Description
- `discount_type` (string): Discount type
- `discount_value` (number): Discount value
- `usage_limit` (integer): Usage limit
- `usage_count` (integer): Times used (0)
- `status` (string): "active"
- `valid_from` (string): ISO 8601 timestamp
- `valid_until` (string): ISO 8601 timestamp
- `created_at` (string): ISO 8601 timestamp

**Error Responses:**
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `409 Conflict`: Coupon code already exists
- `422 Unprocessable Entity`: Validation errors

---

### 12.2 Validate Coupon

**Endpoint:** `POST /v1/coupons/validate`

**Purpose:** Check if coupon is valid for purchase

**Authentication:** Bearer token optional (public endpoint for widget)

**Authorization:** None

**Request Fields:**
- `code` (string, required): Coupon code
- `business_id` (string, required): Business identifier
- `service_ids` (array, required): Services in cart
- `purchase_amount` (number, required): Total before discount

**Response Fields (200 OK):**
- `valid` (boolean): Whether coupon is valid
- `coupon_id` (string): Coupon ID
- `discount_type` (string): Discount type
- `discount_value` (number): Discount value
- `discount_amount` (number): Calculated discount for this purchase
- `final_amount` (number): Amount after discount
- `message` (string): Validation message or error

**Error Responses:**
- `400 Bad Request`: Invalid coupon code
- `404 Not Found`: Business not found

**Note:** Always returns 200 with `valid: false` for invalid coupons to prevent enumeration

---

### 12.3 List Coupons

**Endpoint:** `GET /v1/businesses/{business_id}/coupons`

**Purpose:** List coupons for business

**Authentication:** Bearer token required

**Authorization:** Business owner or manager

**Path Parameters:**
- `business_id` (string): Business identifier

**Query Parameters:**
- Standard pagination and filtering parameters
- `status` (string, optional): Filter by status
- `valid_now` (boolean, optional): Filter currently valid coupons

**Response Fields (200 OK):**
- `data` (array): Array of coupon objects
- `pagination` (object): Pagination metadata

**Error Responses:**
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Business not found

---

### 12.4 Update Coupon

**Endpoint:** `PATCH /v1/coupons/{coupon_id}`

**Purpose:** Update coupon details

**Authentication:** Bearer token required

**Authorization:** Business owner or manager

**Path Parameters:**
- `coupon_id` (string): Coupon identifier

**Request Fields (all optional):**
- Same fields as Create Coupon (except code)
- `status` (string): Update status ("active", "inactive", "expired")

**Response Fields (200 OK):**
- Same as Create Coupon response

**Error Responses:**
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Coupon not found
- `422 Unprocessable Entity`: Validation errors

---

### 12.5 Delete Coupon

**Endpoint:** `DELETE /v1/coupons/{coupon_id}`

**Purpose:** Delete coupon

**Authentication:** Bearer token required

**Authorization:** Business owner or manager

**Path Parameters:**
- `coupon_id` (string): Coupon identifier

**Response (204 No Content):** Empty response

**Error Responses:**
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Coupon not found

---

## 13. Analytics & Reporting

### 13.1 Get Dashboard Metrics

**Endpoint:** `GET /v1/analytics/dashboard`

**Purpose:** Retrieve key business metrics for dashboard

**Authentication:** Bearer token required

**Authorization:** Business owner or manager

**Query Parameters:**
- `business_id` (string, required): Business identifier
- `location_id` (string, optional): Filter by location
- `start_date` (string, required): ISO 8601 date
- `end_date` (string, required): ISO 8601 date
- `compare_previous_period` (boolean, optional): Include comparison (default: false)

**Response Fields (200 OK):**
- `period` (object): Date range
  - `start_date` (string): ISO 8601 date
  - `end_date` (string): ISO 8601 date
- `metrics` (object): Key metrics
  - `total_revenue` (number): Total revenue
  - `total_appointments` (integer): Appointment count
  - `completed_appointments` (integer): Completed count
  - `cancelled_appointments` (integer): Cancelled count
  - `no_show_appointments` (integer): No-show count
  - `new_clients` (integer): New client count
  - `returning_clients` (integer): Returning client count
  - `average_appointment_value` (number): Average revenue per appointment
  - `cancellation_rate` (number): Percentage
  - `no_show_rate` (number): Percentage
  - `occupancy_rate` (number): Percentage of available slots booked
  - `most_booked_service` (string): Service name
  - `top_performing_staff` (string): Staff member name
- `comparison` (object, optional): Previous period comparison
  - `revenue_change_percentage` (number): Change percentage
  - `appointments_change_percentage` (number): Change percentage
  - `new_clients_change` (integer): Change count

**Error Responses:**
- `400 Bad Request`: Invalid date range
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Business not found

---

### 13.2 Get Revenue Report

**Endpoint:** `GET /v1/analytics/revenue`

**Purpose:** Detailed revenue breakdown

**Authentication:** Bearer token required

**Authorization:** Business owner or manager

**Query Parameters:**
- `business_id` (string, required): Business identifier
- `location_id` (string, optional): Filter by location
- `start_date` (string, required): ISO 8601 date
- `end_date` (string, required): ISO 8601 date
- `group_by` (string, optional): "day", "week", "month", "service", "staff" (default: "day")

**Response Fields (200 OK):**
- `period` (object): Date range
- `total_revenue` (number): Total revenue
- `total_payments` (integer): Payment count
- `total_refunds` (number): Total refunded
- `breakdown` (array): Revenue breakdown by grouping
  - `group_key` (string): Group identifier (date, service name, staff name)
  - `revenue` (number): Revenue for group
  - `appointment_count` (integer): Appointments in group
  - `average_value` (number): Average per appointment
- `payment_methods` (array): Revenue by payment method
  - `method` (string): Payment method
  - `amount` (number): Amount
  - `percentage` (number): Percentage of total
- `top_services` (array): Top services by revenue
  - `service_id` (string): Service ID
  - `service_name` (string): Service name
  - `revenue` (number): Revenue
  - `booking_count` (integer): Bookings

**Error Responses:**
- `400 Bad Request`: Invalid parameters
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Business not found

---

### 13.3 Get Client Analytics

**Endpoint:** `GET /v1/analytics/clients`

**Purpose:** Client behavior and retention metrics

**Authentication:** Bearer token required

**Authorization:** Business owner or manager

**Query Parameters:**
- `business_id` (string, required): Business identifier
- `location_id` (string, optional): Filter by location
- `start_date` (string, required): ISO 8601 date
- `end_date` (string, required): ISO 8601 date

**Response Fields (200 OK):**
- `period` (object): Date range
- `total_clients` (integer): Total unique clients
- `new_clients` (integer): New clients in period
- `returning_clients` (integer): Returning clients
- `client_retention_rate` (number): Percentage
- `average_visits_per_client` (number): Average
- `average_client_lifetime_value` (number): CLV
- `client_acquisition` (array): New clients by date/period
- `churn_risk_clients` (array): Clients at risk of churning
  - `client_id` (string): Client ID
  - `client_name` (string): Client name
  - `last_visit_date` (string): ISO 8601 date
  - `days_since_last_visit` (integer): Days
  - `risk_score` (number): 0-1 churn probability
- `top_clients` (array): Highest value clients
  - `client_id` (string): Client ID
  - `client_name` (string): Client name
  - `total_spent` (number): Total revenue
  - `visit_count` (integer): Total visits

**Error Responses:**
- `400 Bad Request`: Invalid parameters
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Business not found

---

### 13.4 Get Staff Performance Report

**Endpoint:** `GET /v1/analytics/staff`

**Purpose:** Staff performance metrics

**Authentication:** Bearer token required

**Authorization:** Business owner or manager

**Query Parameters:**
- `business_id` (string, required): Business identifier
- `location_id` (string, optional): Filter by location
- `start_date` (string, required): ISO 8601 date
- `end_date` (string, required): ISO 8601 date

**Response Fields (200 OK):**
- `period` (object): Date range
- `staff_performance` (array): Performance by staff member
  - `staff_id` (string): Staff ID
  - `staff_name` (string): Staff name
  - `total_appointments` (integer): Appointment count
  - `completed_appointments` (integer): Completed count
  - `cancelled_appointments` (integer): Cancelled count
  - `no_show_appointments` (integer): No-show count
  - `total_revenue` (number): Revenue generated
  - `average_appointment_value` (number): Average revenue
  - `utilization_rate` (number): Percentage of available time booked
  - `client_rating` (number): Average client rating
  - `new_clients_acquired` (integer): New clients
- `top_performer` (object): Best performing staff
- `improvement_opportunities` (array): Staff needing support

**Error Responses:**
- `400 Bad Request`: Invalid parameters
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Business not found

---

### 13.5 Export Report

**Endpoint:** `POST /v1/analytics/export`

**Purpose:** Export analytics data to file

**Authentication:** Bearer token required

**Authorization:** Business owner or manager

**Request Fields:**
- `report_type` (string, required): "revenue", "appointments", "clients", "staff"
- `business_id` (string, required): Business identifier
- `location_id` (string, optional): Filter by location
- `start_date` (string, required): ISO 8601 date
- `end_date` (string, required): ISO 8601 date
- `format` (string, optional): "csv", "xlsx", "pdf" (default: "csv")
- `email_to` (string, optional): Email address to send report

**Response Fields (202 Accepted):**
- `export_id` (string): Export job identifier
- `status` (string): "processing"
- `estimated_completion` (string): ISO 8601 timestamp
- `download_url` (string): URL for download (when ready)

**Error Responses:**
- `400 Bad Request`: Invalid parameters
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Business not found
- `429 Too Many Requests`: Export already in progress

**Note:** Export generated asynchronously. Poll export status or receive email when ready.

---

## 14. Notifications

### 14.1 Get Notification Preferences

**Endpoint:** `GET /v1/users/me/notifications/preferences`

**Purpose:** Retrieve user notification preferences

**Authentication:** Bearer token required

**Authorization:** Own user account

**Response Fields (200 OK):**
- `email` (object): Email notification settings
  - `appointment_confirmation` (boolean): Enable/disable
  - `appointment_reminder` (boolean): Enable/disable
  - `appointment_cancelled` (boolean): Enable/disable
  - `appointment_rescheduled` (boolean): Enable/disable
  - `payment_receipt` (boolean): Enable/disable
  - `marketing` (boolean): Enable/disable
- `sms` (object): SMS notification settings
  - `appointment_reminder` (boolean): Enable/disable
  - `appointment_cancelled` (boolean): Enable/disable
- `push` (object): Push notification settings
  - `appointment_reminder` (boolean): Enable/disable
  - `new_message` (boolean): Enable/disable

**Error Responses:**
- `401 Unauthorized`: Invalid authentication

---

### 14.2 Update Notification Preferences

**Endpoint:** `PATCH /v1/users/me/notifications/preferences`

**Purpose:** Update notification preferences

**Authentication:** Bearer token required

**Authorization:** Own user account

**Request Fields (all optional):**
- Same structure as Get Notification Preferences

**Response Fields (200 OK):**
- Same as Get Notification Preferences

**Error Responses:**
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Invalid authentication
- `422 Unprocessable Entity`: Validation errors

---

### 14.3 List Notifications

**Endpoint:** `GET /v1/notifications`

**Purpose:** List notifications sent to user

**Authentication:** Bearer token required

**Authorization:** Own notifications or business notifications (if staff)

**Query Parameters:**
- Standard pagination and filtering parameters
- `type` (string, optional): Filter by notification type
- `channel` (string, optional): Filter by channel ("email", "sms", "push")
- `status` (string, optional): Filter by status
- `appointment_id` (string, optional): Filter by appointment

**Response Fields (200 OK):**
- `data` (array): Array of notification objects
  - `id` (string): Notification ID
  - `type` (string): Notification type
  - `channel` (string): Delivery channel
  - `recipient_address` (string): Email/phone/device token
  - `subject` (string): Email subject
  - `body` (string): Message body
  - `status` (string): Delivery status
  - `scheduled_for` (string): ISO 8601 timestamp
  - `sent_at` (string): ISO 8601 timestamp
  - `delivered_at` (string): ISO 8601 timestamp
  - `opened_at` (string): ISO 8601 timestamp
  - `created_at` (string): ISO 8601 timestamp
- `pagination` (object): Pagination metadata

**Error Responses:**
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions

---

## 15. Integrations

### 15.1 List Integrations

**Endpoint:** `GET /v1/integrations`

**Purpose:** List available integrations for tenant

**Authentication:** Bearer token required

**Authorization:** Business owner or manager

**Query Parameters:**
- `business_id` (string, optional): Filter by business

**Response Fields (200 OK):**
- `data` (array): Array of integration objects
  - `id` (string): Integration ID
  - `integration_type` (string): Type (e.g., "google_calendar", "stripe")
  - `is_enabled` (boolean): Whether enabled
  - `last_sync_at` (string): ISO 8601 timestamp
  - `last_sync_status` (string): Sync status
  - `configuration_complete` (boolean): Whether fully configured

**Error Responses:**
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions

---

### 15.2 Enable Integration

**Endpoint:** `POST /v1/integrations/{integration_type}/enable`

**Purpose:** Enable and configure integration

**Authentication:** Bearer token required

**Authorization:** Business owner or manager

**Path Parameters:**
- `integration_type` (string): Integration type

**Request Fields:**
- `business_id` (string, optional): Business ID (for business-specific integrations)
- `configuration` (object, varies by integration): Integration-specific config
- `oauth_code` (string, optional): OAuth authorization code (if applicable)

**Response Fields (201 Created):**
- `id` (string): Integration ID
- `integration_type` (string): Integration type
- `is_enabled` (boolean): True
- `oauth_authorization_url` (string, optional): URL to complete OAuth (if needed)
- `configuration_complete` (boolean): Whether configuration is complete

**Error Responses:**
- `400 Bad Request`: Invalid configuration
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions or integration not available for subscription tier
- `409 Conflict`: Integration already enabled
- `422 Unprocessable Entity`: Validation errors

---

### 15.3 Sync Integration

**Endpoint:** `POST /v1/integrations/{integration_id}/sync`

**Purpose:** Trigger manual sync with external service

**Authentication:** Bearer token required

**Authorization:** Business owner or manager

**Path Parameters:**
- `integration_id` (string): Integration identifier

**Request Fields:**
- `sync_direction` (string, optional): "push", "pull", or "bidirectional" (default: configured direction)

**Response Fields (202 Accepted):**
- `sync_job_id` (string): Sync job identifier
- `status` (string): "processing"

**Error Responses:**
- `400 Bad Request`: Integration not properly configured
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Integration not found
- `429 Too Many Requests`: Sync already in progress

---

### 15.4 Disable Integration

**Endpoint:** `POST /v1/integrations/{integration_id}/disable`

**Purpose:** Disable integration

**Authentication:** Bearer token required

**Authorization:** Business owner or manager

**Path Parameters:**
- `integration_id` (string): Integration identifier

**Response Fields (200 OK):**
- `id` (string): Integration ID
- `is_enabled` (boolean): False
- `disabled_at` (string): ISO 8601 timestamp

**Error Responses:**
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Integration not found

---

## 16. Webhooks (Outbound)

### 16.1 Create Webhook

**Endpoint:** `POST /v1/webhooks`

**Purpose:** Register webhook endpoint for event notifications

**Authentication:** Bearer token required

**Authorization:** Business owner or developer

**Request Fields:**
- `business_id` (string, optional): Business ID (business-specific webhook)
- `url` (string, required): Webhook endpoint URL (must be HTTPS)
- `events` (array, required): Array of event types to subscribe to
- `description` (string, optional): Webhook description
- `secret` (string, optional): Webhook signing secret (auto-generated if not provided)
- `is_active` (boolean, optional): Enable webhook (default: true)

**Event Types:**
- `appointment.created`
- `appointment.updated`
- `appointment.cancelled`
- `appointment.completed`
- `appointment.no_show`
- `payment.captured`
- `payment.refunded`
- `client.created`
- `client.updated`

**Response Fields (201 Created):**
- `id` (string): Webhook ID
- `url` (string): Webhook URL
- `events` (array): Subscribed events
- `secret` (string): Webhook signing secret
- `is_active` (boolean): Active status
- `created_at` (string): ISO 8601 timestamp

**Error Responses:**
- `400 Bad Request`: Invalid URL or events
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `422 Unprocessable Entity`: Validation errors

**Note:** Webhooks deliver JSON payload with event data and HMAC signature for verification

---

### 16.2 List Webhooks

**Endpoint:** `GET /v1/webhooks`

**Purpose:** List registered webhooks

**Authentication:** Bearer token required

**Authorization:** Business owner or developer

**Query Parameters:**
- `business_id` (string, optional): Filter by business

**Response Fields (200 OK):**
- `data` (array): Array of webhook objects

**Error Responses:**
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions

---

### 16.3 Delete Webhook

**Endpoint:** `DELETE /v1/webhooks/{webhook_id}`

**Purpose:** Remove webhook registration

**Authentication:** Bearer token required

**Authorization:** Business owner or developer

**Path Parameters:**
- `webhook_id` (string): Webhook identifier

**Response (204 No Content):** Empty response

**Error Responses:**
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Webhook not found

---

## 17. Admin & Tenant Management

### 17.1 Create Tenant (Platform Admin Only)

**Endpoint:** `POST /v1/admin/tenants`

**Purpose:** Create new tenant account

**Authentication:** Bearer token required

**Authorization:** Platform administrator only

**Request Fields:**
- `slug` (string, required): URL-safe tenant identifier
- `name` (string, required): Tenant name
- `subscription_tier` (string, required): Subscription tier
- `owner_email` (string, required): Owner email
- `owner_first_name` (string, required): Owner first name
- `owner_last_name` (string, required): Owner last name
- `data_residency_region` (string, optional): Data residency region

**Response Fields (201 Created):**
- `id` (string): Tenant ID
- `slug` (string): Tenant slug
- `name` (string): Tenant name
- `subscription_tier` (string): Subscription tier
- `subscription_status` (string): Status
- `owner_user_id` (string): Owner user ID
- `created_at` (string): ISO 8601 timestamp

**Error Responses:**
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Not platform administrator
- `409 Conflict`: Slug already exists
- `422 Unprocessable Entity`: Validation errors

---

### 17.2 Get Tenant Details (Platform Admin Only)

**Endpoint:** `GET /v1/admin/tenants/{tenant_id}`

**Purpose:** Retrieve tenant information

**Authentication:** Bearer token required

**Authorization:** Platform administrator only

**Path Parameters:**
- `tenant_id` (string): Tenant identifier

**Response Fields (200 OK):**
- Full tenant details including subscription, usage statistics, and configuration

**Error Responses:**
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Not platform administrator
- `404 Not Found`: Tenant not found

---

### 17.3 Update Tenant Subscription (Platform Admin Only)

**Endpoint:** `PATCH /v1/admin/tenants/{tenant_id}/subscription`

**Purpose:** Update tenant subscription

**Authentication:** Bearer token required

**Authorization:** Platform administrator only

**Path Parameters:**
- `tenant_id` (string): Tenant identifier

**Request Fields:**
- `subscription_tier` (string, optional): New subscription tier
- `subscription_status` (string, optional): New status
- `subscription_expires_at` (string, optional): Expiration date

**Response Fields (200 OK):**
- Updated tenant subscription details

**Error Responses:**
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Invalid authentication
- `403 Forbidden`: Not platform administrator
- `404 Not Found`: Tenant not found

---

## 18. Widget Embedding API

### 18.1 Get Widget Configuration

**Endpoint:** `GET /v1/widgets/{widget_key}`

**Purpose:** Retrieve widget configuration for embedding

**Authentication:** None (public endpoint)

**Authorization:** None

**Path Parameters:**
- `widget_key` (string): Widget public key

**Response Fields (200 OK):**
- `widget_key` (string): Widget key
- `business_id` (string): Business ID
- `business_name` (string): Business name
- `location_id` (string): Location ID (if scoped)
- `theme` (object): Widget theme configuration
- `settings` (object): Widget behavior settings
- `allowed_domains` (array): Allowed embedding domains

**Error Responses:**
- `404 Not Found`: Widget not found
- `403 Forbidden`: Domain not whitelisted

---

### 18.2 Widget Availability Check

**Endpoint:** `GET /v1/widgets/{widget_key}/availability`

**Purpose:** Check availability through widget

**Authentication:** None (public endpoint)

**Authorization:** None

**Path Parameters:**
- `widget_key` (string): Widget public key

**Query Parameters:**
- Same as standard availability check

**Response Fields (200 OK):**
- Same as standard availability check response

**Error Responses:**
- `404 Not Found`: Widget not found
- `403 Forbidden`: Domain not whitelisted

---

### 18.3 Widget Create Appointment

**Endpoint:** `POST /v1/widgets/{widget_key}/appointments`

**Purpose:** Create appointment through widget

**Authentication:** None (public endpoint, guest booking)

**Authorization:** None

**Path Parameters:**
- `widget_key` (string): Widget public key

**Request/Response Fields:**
- Same as standard appointment creation

**Error Responses:**
- Same as standard appointment creation
- `403 Forbidden`: Domain not whitelisted

---

## 19. Health & Status

### 19.1 Health Check

**Endpoint:** `GET /v1/health`

**Purpose:** Check API health status

**Authentication:** None

**Authorization:** None

**Response Fields (200 OK):**
- `status` (string): "healthy" or "degraded"
- `version` (string): API version
- `timestamp` (string): ISO 8601 timestamp

**Error Responses:**
- `503 Service Unavailable`: Service unhealthy

---

### 19.2 API Version

**Endpoint:** `GET /v1/version`

**Purpose:** Get API version information

**Authentication:** None

**Authorization:** None

**Response Fields (200 OK):**
- `api_version` (string): Current API version
- `supported_versions` (array): Array of supported versions
- `deprecated_versions` (array): Deprecated versions with sunset dates
- `changelog_url` (string): URL to changelog

---

## 20. Error Codes Reference

### Common Error Codes

**Authentication & Authorization:**
- `AUTH_001`: Invalid credentials
- `AUTH_002`: Token expired
- `AUTH_003`: Token invalid
- `AUTH_004`: Insufficient permissions
- `AUTH_005`: Account suspended
- `AUTH_006`: Email not verified
- `AUTH_007`: MFA required
- `AUTH_008`: MFA code invalid

**Validation:**
- `VAL_001`: Missing required field
- `VAL_002`: Invalid field format
- `VAL_003`: Field value out of range
- `VAL_004`: Invalid date/time
- `VAL_005`: Invalid email format
- `VAL_006`: Invalid phone format
- `VAL_007`: Password does not meet requirements

**Business Logic:**
- `BIZ_001`: Time slot unavailable
- `BIZ_002`: Staff member unavailable
- `BIZ_003`: Outside business hours
- `BIZ_004`: Booking window exceeded
- `BIZ_005`: Service not offered at location
- `BIZ_006`: Cancellation deadline passed
- `BIZ_007`: Appointment already completed
- `BIZ_008`: Payment required
- `BIZ_009`: Insufficient balance
- `BIZ_010`: Coupon invalid or expired
- `BIZ_011`: Coupon usage limit reached
- `BIZ_012`: Maximum group size exceeded

**Resource:**
- `RES_001`: Resource not found
- `RES_002`: Resource already exists
- `RES_003`: Resource conflict
- `RES_004`: Resource in use (cannot delete)

**Rate Limiting:**
- `RATE_001`: Rate limit exceeded
- `RATE_002`: Too many authentication attempts
- `RATE_003`: Too many requests for resource

**System:**
- `SYS_001`: Internal server error
- `SYS_002`: Service temporarily unavailable
- `SYS_003`: External service error
- `SYS_004`: Database error
- `SYS_005`: Network timeout

---

**End of API Contracts**
