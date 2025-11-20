# Studio24-Inspired Platform Redesign Specification

## Executive Summary

This document outlines a comprehensive redesign of the booking platform to match the functionality, user experience, and design aesthetic of Studio24.bg - a successful beauty services booking platform in Bulgaria.

**Created**: 2025-11-20
**Branch**: `claude/studio24-inspired-redesign`
**Status**: Planning Phase

---

## 1. Platform Overview

### 1.1 Studio24.bg Analysis

Based on research, Studio24.bg provides:

**Core Features:**
- Real-time availability checking and instant booking confirmation
- Service-based search (find studios by service type, date, and time)
- Quick booking flow ("book in just a minute")
- Email reminders and notifications
- Review system for verified bookings only
- Mobile apps (iOS/Android) + web platform (likely PWA)
- Studio management tools (Studio24 Pro)
- Calendar synchronization

**User Experience:**
- Public marketplace for discovering studios
- Fast, streamlined booking process
- Mobile-first design
- Clean, modern aesthetic
- Emphasis on visual discovery (studio photos, portfolios)

**Business Model:**
- B2B2C platform (businesses use it to get customers)
- Subscription model for studio owners (Studio24 Pro)
- Commission or booking fees (likely)

---

## 2. Current Platform vs Studio24

### 2.1 Current Architecture

**Frontend:**
- React 18 + TypeScript + Vite
- TailwindCSS for styling
- React Router v6
- Zustand + React Query for state
- Admin-focused interface

**Backend:**
- NestJS + TypeScript
- PostgreSQL + TypeORM
- Redis for caching
- JWT authentication
- Stripe payments

**Current Focus:**
- ✅ Staff and appointment management
- ✅ Calendar views (day/week/month)
- ✅ Client management
- ✅ Real-time updates (WebSockets)
- ❌ Public marketplace
- ❌ Studio discovery
- ❌ Quick public booking flow
- ❌ PWA support
- ❌ Mobile apps

### 2.2 Gap Analysis

| Feature | Current | Studio24 | Priority |
|---------|---------|----------|----------|
| Public Studio Listings | ❌ | ✅ | **HIGH** |
| Quick Booking Flow | Partial | ✅ | **HIGH** |
| Search & Filter | ❌ | ✅ | **HIGH** |
| PWA Support | ❌ | ✅ | **HIGH** |
| Studio Profiles | ❌ | ✅ | **HIGH** |
| Review System | ❌ | ✅ | MEDIUM |
| Mobile Apps | ❌ | ✅ | MEDIUM |
| Email Reminders | Partial | ✅ | MEDIUM |

---

## 3. Redesign Goals

### 3.1 Primary Objectives

1. **Transform into a B2B2C Platform**
   - Public marketplace for studio discovery
   - Dual interface: public booking + admin management
   - SEO-optimized studio pages

2. **Optimize Booking Flow**
   - Reduce booking to 3-4 steps max
   - Real-time availability display
   - Guest booking (no account required)
   - Instant confirmation

3. **Mobile-First Design**
   - Progressive Web App (PWA)
   - Responsive layouts for all screen sizes
   - Touch-optimized interactions
   - Offline support for basic features

4. **Visual Discovery**
   - Studio photo galleries
   - Staff portfolios
   - Service showcases
   - Before/after examples

### 3.2 User Personas

**Persona 1: End Customer (Maria)**
- Age: 25-45
- Needs: Quick, convenient booking
- Pain points: Limited time, wants to see availability instantly
- Goals: Book appointment in under 2 minutes

**Persona 2: Studio Owner (Ivan)**
- Age: 30-55
- Needs: Manage bookings, staff, and schedule
- Pain points: Double bookings, no-shows, manual scheduling
- Goals: Increase bookings, reduce admin time

**Persona 3: Service Provider (Elena)**
- Age: 22-50
- Needs: View schedule, manage appointments
- Pain points: Schedule conflicts, last-minute changes
- Goals: Clear schedule visibility, easy rescheduling

---

## 4. New Information Architecture

### 4.1 Public Routes (Customer-Facing)

```
/                          → Homepage (studio search/discovery)
/studios                   → Browse all studios
/studios/:slug             → Studio profile page
/studios/:slug/booking     → Booking wizard
/booking/confirm/:id       → Booking confirmation
/search                    → Search results
/categories/:category      → Browse by category
/login                     → Customer login
/signup                    → Customer signup
/my-bookings               → User's booking history
/reviews/:bookingId        → Leave review
```

### 4.2 Admin Routes (Studio Management)

```
/admin                     → Admin dashboard
/admin/login              → Admin login
/admin/calendar           → Calendar management
/admin/appointments       → Appointment list
/admin/clients            → Client management
/admin/staff              → Staff management
/admin/services           → Service management
/admin/settings           → Studio settings
/admin/analytics          → Analytics & reports
/admin/profile            → Public profile editor
```

### 4.3 Studio Pro Routes (Staff Portal)

```
/pro                      → Staff dashboard
/pro/schedule             → Personal schedule
/pro/appointments         → My appointments
/pro/availability         → Set availability
```

---

## 5. Design System

### 5.1 Color Palette

Inspired by modern booking platforms with a professional, trustworthy feel:

```css
/* Primary Colors */
--primary-50: #f0f9ff;
--primary-100: #e0f2fe;
--primary-500: #0ea5e9;   /* Main brand color */
--primary-600: #0284c7;
--primary-700: #0369a1;
--primary-900: #0c4a6e;

/* Accent Colors */
--accent-500: #8b5cf6;    /* Highlight actions */
--success-500: #10b981;   /* Confirmed bookings */
--warning-500: #f59e0b;   /* Pending status */
--error-500: #ef4444;     /* Cancellations */

/* Neutral Colors */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-500: #6b7280;
--gray-700: #374151;
--gray-900: #111827;
```

### 5.2 Typography

```css
/* Font Families */
--font-display: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Font Sizes */
--text-xs: 0.75rem;     /* 12px */
--text-sm: 0.875rem;    /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */
--text-4xl: 2.25rem;    /* 36px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### 5.3 Spacing & Layout

```css
/* Spacing Scale (Tailwind-based) */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */

/* Container Widths */
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;

/* Border Radius */
--radius-sm: 0.25rem;
--radius-md: 0.5rem;
--radius-lg: 0.75rem;
--radius-xl: 1rem;
--radius-full: 9999px;
```

### 5.4 Component Library

**New Components to Build:**

1. **StudioCard** - Display studio in listings
2. **ServiceCard** - Show individual services
3. **StaffCard** - Staff member profiles
4. **TimeSlotPicker** - Available time selection
5. **ImageGallery** - Studio photo viewer
6. **ReviewCard** - Customer reviews
7. **SearchBar** - Global search component
8. **CategoryFilter** - Filter by service category
9. **AvailabilityCalendar** - Month view with available dates
10. **BookingStepper** - Progress indicator
11. **MapView** - Studio location (Google Maps)
12. **PriceTag** - Service pricing display

---

## 6. Public Booking Flow

### 6.1 User Journey

```
1. Discovery
   ├─ Homepage search
   ├─ Browse categories
   └─ Search by service/location

2. Studio Selection
   ├─ View studio profile
   ├─ Browse services
   ├─ Check reviews
   └─ View portfolio

3. Service Selection
   ├─ Choose service(s)
   ├─ Select staff member (optional)
   └─ See total price/duration

4. Date & Time Selection
   ├─ View available dates
   ├─ Select time slot
   └─ Real-time availability check

5. Customer Details
   ├─ Name, email, phone
   ├─ Special requests (optional)
   └─ Login or continue as guest

6. Confirmation
   ├─ Review booking details
   ├─ Payment (if required)
   └─ Receive confirmation email

7. Post-Booking
   ├─ Email reminder (24h before)
   ├─ SMS reminder (optional)
   └─ Review after appointment
```

### 6.2 Booking Wizard Steps

**Step 1: Service Selection**
```tsx
- Display all services with photos
- Show price, duration, description
- Multi-select support (if enabled)
- Visual service cards with hover effects
```

**Step 2: Staff Selection**
```tsx
- Show available staff for selected service
- Display staff photos, bios, ratings
- "No preference" option
- Staff availability indicators
```

**Step 3: Date & Time**
```tsx
- Month calendar with available dates highlighted
- Time slots in 15-min intervals
- Show staff availability
- Real-time updates via WebSocket
```

**Step 4: Customer Details**
```tsx
- Phone number (primary)
- Name and email
- Special requests (textarea)
- Marketing consent (opt-in)
- Option to create account
```

**Step 5: Confirmation**
```tsx
- Summary card (service, staff, date/time, price)
- Cancellation policy
- Payment (if deposit required)
- Book button with loading state
```

---

## 7. Studio Profile Page

### 7.1 Page Sections

```tsx
<StudioProfilePage>
  <StudioHeader>
    - Studio name & logo
    - Rating & review count
    - Location & contact
    - "Book Now" CTA
  </StudioHeader>

  <StudioGallery>
    - Hero image
    - Photo gallery (lightbox)
    - Video tour (optional)
  </StudioGallery>

  <QuickBooking>
    - Service selection dropdown
    - Date picker
    - "Check Availability" button
  </QuickBooking>

  <ServicesSection>
    - Categorized service list
    - Prices & durations
    - "Book" buttons
  </ServicesSection>

  <StaffSection>
    - Staff member cards
    - Photos & bios
    - Specialties
    - Book with specific staff
  </StaffSection>

  <ReviewsSection>
    - Average rating
    - Review cards (verified bookings only)
    - Pagination
    - Sort options
  </ReviewsSection>

  <LocationSection>
    - Google Maps embed
    - Address & directions
    - Opening hours
    - Parking info
  </LocationSection>

  <AboutSection>
    - Studio description
    - Amenities
    - Policies
    - FAQs
  </AboutSection>
</StudioProfilePage>
```

### 7.2 SEO Optimization

```typescript
// Meta tags for each studio
<head>
  <title>{studio.name} - Book Online | Platform Name</title>
  <meta name="description" content={studio.description} />
  <meta property="og:title" content={studio.name} />
  <meta property="og:image" content={studio.coverImage} />
  <meta property="og:type" content="business.business" />
  <link rel="canonical" href={`/studios/${studio.slug}`} />

  {/* JSON-LD structured data */}
  <script type="application/ld+json">
    {{
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "{studio.name}",
      "address": {...},
      "telephone": "{studio.phone}",
      "openingHours": {...}
    }}
  </script>
</head>
```

---

## 8. Homepage Design

### 8.1 Layout Structure

```tsx
<Homepage>
  <HeroSection>
    <SearchBar>
      - Service search input
      - Location input (city/area)
      - Date picker
      - "Search" button
    </SearchBar>
    <PopularCategories>
      - Hair Salon
      - Barbershop
      - Nail Studio
      - Spa & Massage
      - Beauty Salon
      - Fitness
    </PopularCategories>
  </HeroSection>

  <FeaturedStudios>
    - Top-rated studios
    - 4-6 studio cards
    - "View All" link
  </FeaturedStudios>

  <HowItWorks>
    1. Search for service
    2. Choose time & staff
    3. Book instantly
  </HowItWorks>

  <ForBusinesses>
    - CTA for studio owners
    - "List Your Business" button
    - Benefits overview
  </ForBusinesses>

  <Footer>
    - Links (About, Help, Terms)
    - Social media
    - Download app buttons
  </Footer>
</Homepage>
```

---

## 9. Progressive Web App (PWA)

### 9.1 PWA Features

**Offline Support:**
```typescript
// Service Worker strategy
- Cache-first for static assets
- Network-first for API calls
- Offline page fallback
- Background sync for bookings
```

**Installation:**
```typescript
// manifest.json
{
  "name": "BookingPlatform",
  "short_name": "Booking",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0ea5e9",
  "icons": [...]
}
```

**Features:**
- Add to home screen
- Push notifications (appointment reminders)
- Offline booking queue
- App-like navigation
- Fast loading (< 3s)

### 9.2 Performance Targets

```
Lighthouse Scores:
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 95
- SEO: > 95
- PWA: 100

Core Web Vitals:
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1
```

---

## 10. Backend Enhancements

### 10.1 New Database Schema

**Studio Table:**
```sql
CREATE TABLE studios (
  id UUID PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cover_image VARCHAR(500),
  category VARCHAR(100),
  address JSONB,
  phone VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(255),
  opening_hours JSONB,
  amenities JSONB,
  policies JSONB,
  rating DECIMAL(2,1),
  review_count INTEGER,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE INDEX idx_studios_slug ON studios(slug);
CREATE INDEX idx_studios_category ON studios(category);
```

**Reviews Table:**
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY,
  studio_id UUID REFERENCES studios(id),
  booking_id UUID REFERENCES bookings(id),
  customer_id UUID REFERENCES users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP
);

CREATE INDEX idx_reviews_studio ON reviews(studio_id);
```

**Gallery Table:**
```sql
CREATE TABLE studio_gallery (
  id UUID PRIMARY KEY,
  studio_id UUID REFERENCES studios(id),
  image_url VARCHAR(500),
  caption VARCHAR(255),
  display_order INTEGER,
  created_at TIMESTAMP
);
```

### 10.2 New API Endpoints

**Public Endpoints:**
```typescript
GET    /api/v1/public/studios                 // List studios
GET    /api/v1/public/studios/:slug            // Studio profile
GET    /api/v1/public/studios/:slug/services   // Studio services
GET    /api/v1/public/studios/:slug/staff      // Studio staff
GET    /api/v1/public/studios/:slug/reviews    // Studio reviews
POST   /api/v1/public/studios/:slug/availability // Check availability
POST   /api/v1/public/bookings                 // Create booking (guest)
GET    /api/v1/public/bookings/:id             // Booking details
POST   /api/v1/public/reviews                  // Submit review
GET    /api/v1/public/search                   // Search studios/services
GET    /api/v1/public/categories               // Service categories
```

**Admin Endpoints (new):**
```typescript
PUT    /api/v1/admin/studio/profile           // Update public profile
POST   /api/v1/admin/studio/gallery           // Upload gallery images
PUT    /api/v1/admin/studio/settings          // Update studio settings
GET    /api/v1/admin/reviews                  // Manage reviews
PUT    /api/v1/admin/reviews/:id/respond      // Respond to review
```

### 10.3 Search Implementation

**ElasticSearch Integration:**
```typescript
// Add ElasticSearch for advanced search
- Full-text search on studio names, descriptions, services
- Geo-spatial search (find studios near location)
- Faceted search (filter by category, rating, price)
- Auto-complete suggestions
- Search relevance scoring
```

**Alternative: PostgreSQL Full-Text Search:**
```sql
-- Add full-text search columns
ALTER TABLE studios ADD COLUMN search_vector tsvector;

CREATE INDEX idx_studios_search
  ON studios USING gin(search_vector);

-- Update search vector on changes
CREATE TRIGGER studios_search_update
  BEFORE INSERT OR UPDATE ON studios
  FOR EACH ROW EXECUTE FUNCTION
  tsvector_update_trigger(search_vector, 'pg_catalog.english',
    name, description);
```

---

## 11. Mobile App Strategy

### 11.1 PWA vs Native Apps

**Phase 1: PWA (Priority)**
- ✅ Works on iOS and Android
- ✅ No app store submission
- ✅ Instant updates
- ✅ Lower development cost
- ✅ Single codebase
- ❌ Limited native features

**Phase 2: Native Apps (Optional)**
- Framework: React Native or Flutter
- Reuse React components (React Native)
- Native features: push notifications, calendar integration
- App store presence

### 11.2 PWA Implementation Plan

**Week 1-2: PWA Basics**
```bash
npm install workbox-webpack-plugin
npm install @vite-pwa/plugin
```

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default {
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {...},
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [...]
      }
    })
  ]
}
```

---

## 12. Implementation Roadmap

### 12.1 Phase 1: Foundation (Weeks 1-2)

**Goals:**
- Set up new design system
- Create component library
- Implement PWA basics

**Tasks:**
1. ✅ Create new branch
2. Set up Tailwind config with new colors
3. Build core UI components
4. Add PWA plugin and manifest
5. Implement service worker basics

### 12.2 Phase 2: Public Interface (Weeks 3-5)

**Goals:**
- Build public-facing pages
- Implement studio profiles
- Create booking flow

**Tasks:**
1. Homepage with search
2. Studio listing page
3. Studio profile page
4. Booking wizard (5 steps)
5. Guest booking support
6. Search functionality

### 12.3 Phase 3: Backend Enhancements (Weeks 6-7)

**Goals:**
- Add public API endpoints
- Implement reviews
- Add search backend

**Tasks:**
1. Public studio endpoints
2. Review system (API + DB)
3. Gallery management
4. PostgreSQL full-text search
5. Email notifications
6. SMS reminders (Twilio)

### 12.4 Phase 4: Admin Updates (Week 8)

**Goals:**
- Update admin to manage public profile
- Add analytics
- Review management

**Tasks:**
1. Studio profile editor
2. Gallery uploader
3. Review moderation
4. Public booking management
5. Enhanced analytics

### 12.5 Phase 5: Polish & Launch (Weeks 9-10)

**Goals:**
- Testing and optimization
- SEO implementation
- Performance tuning

**Tasks:**
1. E2E tests for booking flow
2. Performance optimization
3. SEO meta tags
4. Accessibility audit
5. Mobile testing
6. Production deployment

---

## 13. Success Metrics

### 13.1 User Metrics

**Booking Funnel:**
- Studio page views → Booking starts: > 15%
- Booking starts → Completions: > 70%
- Time to complete booking: < 3 minutes
- Mobile booking rate: > 50%

**Engagement:**
- Returning customer rate: > 30%
- Average bookings per customer: > 2
- Review submission rate: > 20%

### 13.2 Technical Metrics

**Performance:**
- Page load time (mobile): < 3s
- API response time (p95): < 500ms
- Uptime: > 99.9%

**SEO:**
- Studio pages indexed: 100%
- Average organic traffic growth: 20% MoM
- Search rankings: Top 10 for "{city} {service}"

---

## 14. Technology Stack Updates

### 14.1 New Frontend Dependencies

```json
{
  "dependencies": {
    // Existing
    "react": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "tailwindcss": "^3.3.6",

    // New
    "@vite-pwa/plugin": "^0.17.0",           // PWA support
    "workbox-window": "^7.0.0",              // Service worker
    "react-image-gallery": "^1.3.0",         // Image galleries
    "react-day-picker": "^8.9.1",            // Date picker
    "framer-motion": "^10.16.0",             // Animations
    "react-intersection-observer": "^9.5.0", // Lazy loading
    "sharp": "^0.33.0"                       // Image optimization
  }
}
```

### 14.2 Backend Dependencies

```json
{
  "dependencies": {
    // New
    "@elastic/elasticsearch": "^8.11.0",  // Search (optional)
    "@nestjs/throttler": "^5.0.0",        // Rate limiting
    "sitemap": "^7.1.0",                   // SEO sitemaps
    "compression": "^1.7.4"                // Response compression
  }
}
```

---

## 15. Security & Privacy

### 15.1 Data Protection

**GDPR Compliance:**
- Cookie consent banner
- Data export functionality
- Right to be forgotten
- Privacy policy
- Terms of service

**Security Measures:**
- Rate limiting (booking endpoints)
- CAPTCHA for guest bookings
- SQL injection prevention (already in place)
- XSS protection
- HTTPS only
- CSP headers

---

## 16. Next Steps

### Immediate Actions (This Week)

1. ✅ Create design spec (this document)
2. Review spec with stakeholders
3. Set up new Tailwind config
4. Create design system components
5. Build first prototype (homepage)

### Questions to Resolve

1. **Business Model**: Commission-based or subscription?
2. **Payment Flow**: Deposit required? When to charge?
3. **Multi-language**: Bulgarian only or multi-language?
4. **Mobile Apps**: PWA only or also native apps?
5. **Search**: PostgreSQL FTS or ElasticSearch?

---

## 17. Resources & References

**Design Inspiration:**
- Studio24.bg (primary reference)
- Fresha.com
- Booksy.com
- Treatwell.com
- ClassPass.com

**Technical Resources:**
- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Tailwind UI Components](https://tailwindui.com/)
- [React Performance](https://react.dev/learn/render-and-commit)
- [NestJS Best Practices](https://docs.nestjs.com/techniques/performance)

---

## Conclusion

This redesign transforms the platform from an admin-focused booking system into a comprehensive B2B2C marketplace like Studio24.bg. The phased approach allows for incremental delivery while maintaining the existing admin functionality.

**Estimated Timeline**: 10 weeks
**Team Size**: 2-3 developers
**Total Effort**: ~600-800 hours

**Key Differentiators:**
1. Mobile-first PWA with offline support
2. Sub-3-minute booking flow
3. Real-time availability checking
4. Visual discovery (photos, portfolios)
5. Verified review system
6. SEO-optimized studio pages

The platform will be positioned as a modern, user-friendly alternative for booking beauty and wellness services, with potential to expand into other service categories (fitness, healthcare, etc.).
