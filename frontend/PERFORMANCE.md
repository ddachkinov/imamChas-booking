# Frontend Performance Optimizations

This document outlines all performance optimizations implemented in the booking platform frontend and provides guidelines for maintaining optimal performance.

## Table of Contents

- [Implemented Optimizations](#implemented-optimizations)
- [Performance Metrics](#performance-metrics)
- [Build Optimization](#build-optimization)
- [Runtime Optimization](#runtime-optimization)
- [Network Optimization](#network-optimization)
- [Monitoring](#monitoring)
- [Future Improvements](#future-improvements)

## Implemented Optimizations

### 1. Code Splitting & Lazy Loading ✅

**Implementation:** All routes use `React.lazy()` with `Suspense` boundaries.

**Files:**
- `src/routes/AdminRoutes.tsx` - 14 admin pages lazy loaded
- `src/App.tsx` - 2 booking pages lazy loaded

**Benefits:**
- ~30-40% reduction in initial bundle size
- Faster Time to Interactive (TTI)
- Routes loaded on-demand

**Example:**
```typescript
const DashboardPage = lazy(() =>
  import('@/pages/admin/DashboardPage')
    .then(m => ({ default: m.DashboardPage }))
);

<Route
  path="/dashboard"
  element={
    <Suspense fallback={<PageLoader />}>
      <DashboardPage />
    </Suspense>
  }
/>
```

### 2. React Query Caching ✅

**Configuration:** `src/App.tsx`

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});
```

**Benefits:**
- Reduces unnecessary API calls
- Improves perceived performance
- Automatic background refetching
- Optimistic updates

### 3. Production Build Optimization ✅

**Vite Configuration:** `vite.config.ts`

```typescript
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'ui-vendor': ['@headlessui/react', '@heroicons/react'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
        },
      },
    },
  },
});
```

**Benefits:**
- Better caching (vendor chunks change less frequently)
- Parallel download of chunks
- Smaller individual chunk sizes

### 4. Asset Optimization ✅

**Implemented:**
- SVG icons via Heroicons (optimized, tree-shakeable)
- No large images in repository
- Tailwind CSS purging in production

**Tailwind Config:**
```javascript
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  // Automatically purges unused CSS in production
};
```

### 5. Development Tools Optimization ✅

**React Query Devtools:** Only loaded in development

```typescript
<ReactQueryDevtools initialIsOpen={false} />
```

**Benefits:**
- No devtools in production build
- Smaller production bundle

## Performance Metrics

### Expected Lighthouse Scores

Based on current optimizations:

- **Performance:** 85-95
- **Accessibility:** 90-100
- **Best Practices:** 85-95
- **SEO:** 80-90

### Bundle Size Estimates

**Before Lazy Loading:**
- Initial bundle: ~500-600KB (gzipped)
- Total size: ~1.5-2MB (gzipped)

**After Lazy Loading:**
- Initial bundle: ~200-300KB (gzipped)
- Largest route chunk: ~150-200KB (gzipped)
- Total size: ~1.5-2MB (gzipped, but loaded on-demand)

### Load Time Targets

On fast 3G connection:
- **First Contentful Paint (FCP):** < 2s
- **Time to Interactive (TTI):** < 3.5s
- **Largest Contentful Paint (LCP):** < 2.5s
- **Cumulative Layout Shift (CLS):** < 0.1

## Build Optimization

### Production Build

```bash
npm run build
```

**Optimizations Applied:**
- Minification (Vite's esbuild)
- Tree shaking
- CSS purging (Tailwind)
- Code splitting
- Source map generation (for debugging)

### Build Analysis

To analyze bundle size:

```bash
npm run build
npx vite-bundle-visualizer
```

**Action Items:**
- Review chunks > 200KB
- Check for duplicate dependencies
- Identify opportunities for further code splitting

## Runtime Optimization

### 1. React Component Memoization

**When to use:**
- Components with expensive render calculations
- Components that receive complex props
- Lists with many items

**Example:**
```typescript
const ExpensiveComponent = React.memo(({ data }) => {
  // Expensive rendering logic
  return <div>{/* ... */}</div>;
});
```

**Currently Used In:**
- Service cards in booking flow
- Calendar appointment blocks
- Dashboard metric cards

### 2. useCallback & useMemo

**Current Usage:**
- Calendar context actions (useCallback)
- Filtered appointment lists (useMemo)
- Date calculations (useMemo)

**Example:**
```typescript
const filteredAppointments = useMemo(() => {
  return appointments.filter(/* expensive filter */);
}, [appointments, filters]);
```

### 3. Virtual Scrolling

**Recommendation:** Implement for long lists (100+ items)

**Libraries:**
- `react-virtual` (recommended)
- `react-window`

**Use Cases:**
- Appointment list with 500+ appointments
- Client list with 1000+ clients
- Service catalog with many services

### 4. Image Optimization

**Implemented:**
- No images currently in app
- Avatar component uses initials

**Future Recommendations:**
- Use WebP format for photos
- Implement lazy loading for images
- Use responsive images with srcset
- Consider image CDN (Cloudinary, Imgix)

## Network Optimization

### 1. API Request Optimization ✅

**React Query Features:**
```typescript
useQuery({
  queryKey: ['appointments', filters],
  queryFn: fetchAppointments,
  staleTime: 1000 * 60 * 5,     // Don't refetch for 5 minutes
  cacheTime: 1000 * 60 * 30,    // Keep in cache for 30 minutes
  refetchOnWindowFocus: false,   // Don't refetch on tab focus
});
```

### 2. Parallel Requests

**Example in Dashboard:**
```typescript
const { data: metrics } = useQuery(['dashboard-metrics']);
const { data: revenue } = useQuery(['dashboard-revenue']);
const { data: appointments } = useQuery(['dashboard-appointments']);
// All requests run in parallel
```

### 3. Request Debouncing ✅

**Implemented in:**
- Calendar search (300ms debounce)
- Client search
- Service filter

### 4. Pagination

**Currently Implemented:**
- Appointment list pagination
- Client list pagination
- Service list pagination

**Configuration:**
```typescript
const { data } = useQuery({
  queryKey: ['appointments', page, limit],
  queryFn: () => api.getAppointments({ page, limit: 20 }),
});
```

## Monitoring

### 1. Performance Monitoring Setup

**Recommended Tools:**
- **Sentry** - Error tracking + performance monitoring
- **LogRocket** - Session replay + performance
- **Google Analytics 4** - User metrics
- **Web Vitals** - Core Web Vitals tracking

**Implementation Example:**
```typescript
// src/utils/performance.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric: any) {
  // Send to your analytics service
  console.log(metric);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### 2. React Query Devtools

**Development Only:**
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<ReactQueryDevtools initialIsOpen={false} />
```

**Features:**
- Query inspection
- Cache inspection
- Refetch triggers
- Query invalidation

### 3. Performance Budgets

**Recommended Budgets:**
- Initial bundle: < 300KB (gzipped)
- Individual chunks: < 200KB (gzipped)
- Total JS: < 2MB (gzipped)
- Total CSS: < 100KB (gzipped)

## Future Improvements

### High Priority

#### 1. Implement Service Worker (PWA)

**Benefits:**
- Offline support
- Faster subsequent visits
- Background sync

**Implementation:**
```bash
npm install workbox-cli workbox-webpack-plugin
```

#### 2. Prefetching

**Next.js style prefetching:**
```typescript
// Prefetch likely next pages
<Link to="/appointments" prefetch>
  Appointments
</Link>
```

**Manual prefetching:**
```typescript
const prefetchAppointments = () => {
  queryClient.prefetchQuery(['appointments'], fetchAppointments);
};

// Prefetch on hover
<button onMouseEnter={prefetchAppointments}>
  View Appointments
</button>
```

#### 3. Web Workers

**Use Cases:**
- Large data processing (CSV export)
- Complex calculations (analytics)
- Background sync

**Example:**
```typescript
// workers/export.worker.ts
self.addEventListener('message', (e) => {
  const csvData = generateLargeCSV(e.data);
  self.postMessage(csvData);
});
```

#### 4. Implement Virtual Scrolling

**For Appointment List:**
```typescript
import { useVirtual } from 'react-virtual';

const parentRef = useRef();
const rowVirtualizer = useVirtual({
  size: appointments.length,
  parentRef,
  estimateSize: useCallback(() => 80, []),
});
```

### Medium Priority

#### 5. Optimize Re-renders

**Use React DevTools Profiler:**
- Identify components with frequent re-renders
- Add memoization where beneficial
- Use React.memo for pure components

#### 6. Implement Error Boundaries

**Already implemented:**
- Top-level ErrorBoundary in App.tsx

**Add per-route boundaries:**
```typescript
<Suspense fallback={<PageLoader />}>
  <ErrorBoundary fallback={<ErrorPage />}>
    <DashboardPage />
  </ErrorBoundary>
</Suspense>
```

#### 7. Font Optimization

**Current:** Using system fonts

**Recommendation:** If custom fonts needed:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### Low Priority

#### 8. HTTP/2 Server Push

**When deploying:**
- Configure server to push critical resources
- Push main CSS
- Push main JS bundle

#### 9. CDN for Static Assets

**Recommended CDNs:**
- Cloudflare
- AWS CloudFront
- Vercel Edge Network (if deploying to Vercel)

#### 10. Compression

**Server Configuration:**
- Enable Brotli compression (better than gzip)
- Configure appropriate compression levels
- Cache compressed assets

## Performance Testing

### Local Testing

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Run Lighthouse
npx lighthouse http://localhost:4173 --view
```

### CI/CD Integration

**GitHub Actions Example:**
```yaml
name: Performance
on: [push]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            http://localhost:4173
            http://localhost:4173/book/test-business
          uploadArtifacts: true
```

### Performance Checklist

Before deploying:

- [ ] Run production build
- [ ] Check bundle size (< 300KB initial)
- [ ] Run Lighthouse audit (Performance > 85)
- [ ] Test on slow 3G network
- [ ] Verify lazy loading works
- [ ] Check React Query cache behavior
- [ ] Test error boundaries
- [ ] Verify service worker (if implemented)
- [ ] Check console for errors/warnings
- [ ] Validate Core Web Vitals

## Best Practices

### Component Development

1. **Keep components small and focused**
2. **Use React.memo for expensive pure components**
3. **Avoid inline function definitions in render**
4. **Use useCallback for event handlers passed to children**
5. **Use useMemo for expensive calculations**

### Data Fetching

1. **Always use React Query for server state**
2. **Set appropriate staleTime based on data volatility**
3. **Use pagination for large datasets**
4. **Implement optimistic updates for better UX**
5. **Batch related requests when possible**

### State Management

1. **Use Zustand for global client state**
2. **Keep state as close to where it's used as possible**
3. **Avoid unnecessary re-renders**
4. **Use context sparingly (can cause re-renders)**

### Code Organization

1. **Split large components into smaller ones**
2. **Extract reusable logic into custom hooks**
3. **Keep bundle chunks balanced**
4. **Avoid circular dependencies**

## Resources

- [Web Vitals](https://web.dev/vitals/)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Vite Performance](https://vitejs.dev/guide/performance.html)
- [React Query Performance](https://tanstack.com/query/latest/docs/react/guides/performance)
- [Bundle Size Analysis](https://bundlephobia.com/)

## Conclusion

The booking platform frontend is optimized for performance with lazy loading, code splitting, efficient caching, and modern build tools. Continue monitoring performance metrics and implement future improvements as the application grows.

**Target Lighthouse Score:** 90+
**Target Initial Load:** < 3s on 3G
**Target Bundle Size:** < 300KB initial (gzipped)
