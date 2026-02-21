# Outbox: QA Engineer

> Bug reports and test results. Most recent at the top.

---

## QA Report — Full App Audit
**Date:** 2026-02-20
**Status:** Complete — 15 bugs found (4 critical, 6 major, 5 minor)

---

### BUG-001 — Broken Provider Navigation Links [CRITICAL]
- **Files**: `src/pages/MyBookings.tsx:217`, `src/hooks/useBookings.ts:36`
- **Steps to reproduce**: Go to My Bookings → click a provider name link
- **Expected**: Navigates to `/provider/<id>`
- **Actual**: Navigates to `/provider/undefined`
- **Root cause**: `useBookings.ts` maps the provider object but omits the `id` field. `booking.provider?.id` is always undefined.
- **Fix needed in**: `src/hooks/useBookings.ts` — add `id: booking.providerId?._id` to the provider mapping

---

### BUG-002 — Race Condition in Auth Token Validation [CRITICAL]
- **File**: `src/contexts/AuthContext.tsx:34-58`
- **Steps to reproduce**: Refresh the page while logged in → observe brief flash of unauthenticated UI
- **Expected**: App waits for token validation before rendering protected content
- **Actual**: `setLoading(false)` fires in the `finally` block before `setUser()` resolves, so components briefly see `loading=false, user=null`
- **Fix needed in**: `src/contexts/AuthContext.tsx` — move `setLoading(false)` to after `setUser()` completes inside the try block, not in finally

---

### BUG-003 — Hardcoded API URL in useCreateBooking [CRITICAL]
- **File**: `src/hooks/useBookings.ts:64`
- **Steps to reproduce**: Deploy to any non-localhost environment → attempt to book a service
- **Expected**: Booking API call goes to the configured `VITE_API_URL`
- **Actual**: Always calls `http://localhost:3001/api/bookings` regardless of environment
- **Fix needed in**: `src/hooks/useBookings.ts` — use `import.meta.env.VITE_API_URL || 'http://localhost:3001/api'` consistent with other hooks

---

### BUG-004 — Silent Dashboard Stats Failure [CRITICAL]
- **File**: `src/hooks/useDashboard.ts:64-78`, `src/pages/Dashboard.tsx:63`
- **Steps to reproduce**: Disconnect backend → open Dashboard
- **Expected**: Error message shown to user
- **Actual**: Dashboard silently shows zeros with no indication the data failed to load
- **Fix needed in**: `src/hooks/useDashboard.ts` — expose `isError` state; `src/pages/Dashboard.tsx` — show error UI when `isError` is true

---

### BUG-005 — ObjectId Type Mismatch in Booking Queries [MAJOR]
- **File**: `server/models/Booking.js:139-167`
- **Steps to reproduce**: Fetch upcoming bookings for a client using a string client ID
- **Expected**: Returns the client's bookings
- **Actual**: May return empty results — MongoDB ObjectId vs string comparison can fail silently
- **Fix needed in**: `server/models/Booking.js` — wrap `clientId` with `new mongoose.Types.ObjectId(clientId)` when valid

---

### BUG-006 — Missing Error Handling in useUpcomingBookings [MAJOR]
- **File**: `src/hooks/useDashboard.ts:105-113`
- **Steps to reproduce**: API returns an error or unpopulated booking refs
- **Expected**: Graceful handling, partial data shown or error state
- **Actual**: `data.bookings.map(...)` throws if `data.bookings` is undefined; `clientId?.fullName` renders as blank without warning
- **Fix needed in**: `src/hooks/useDashboard.ts` — add null check `(data?.bookings ?? []).map(...)`

---

### BUG-007 — Unhandled JSON Parse Error Silently Drops Schedule Slots [MAJOR]
- **File**: `src/pages/Profile.tsx:65-75`
- **Steps to reproduce**: Save a profile with one corrupted slot → re-open profile
- **Expected**: User is informed that some slots could not be saved
- **Actual**: Malformed slots are silently dropped with only a `console.warn`
- **Fix needed in**: `src/pages/Profile.tsx` — surface parse errors to the user via toast

---

### BUG-008 — S3 Upload URL Not Validated Before DB Write [MAJOR]
- **File**: `server/routes/provider.js:102-109`
- **Steps to reproduce**: S3 upload partially fails (returns object without `url`) → save profile
- **Expected**: Error returned to client, no DB write
- **Actual**: `undefined` stored as `profilePhotoUrl` in the database
- **Fix needed in**: `server/routes/provider.js` — validate `req.s3Upload.url` exists before using it

---

### BUG-009 — No 'no_show' Status Guard on Booking Updates [MAJOR]
- **File**: `server/routes/bookings.js:436-438`
- **Steps to reproduce**: Update a booking with status `no_show` via API
- **Expected**: 400 error — booking is in a terminal state
- **Actual**: Update goes through — `no_show` is not treated as immutable
- **Fix needed in**: `server/routes/bookings.js` — add `booking.status === 'no_show'` to the terminal state check

---

### BUG-010 — Missing dayOfWeek Range Validation [MAJOR]
- **File**: `server/routes/client.js:173-176`
- **Steps to reproduce**: Send a schedule slot with `dayOfWeek: 8` via API
- **Expected**: 400 validation error
- **Actual**: Slot accepted and stored with invalid day value
- **Fix needed in**: `server/routes/client.js` — add check `if (parsed.dayOfWeek < 0 || parsed.dayOfWeek > 6)`

---

### BUG-011 — Dashboard Stats Missing Null Guard on monthlyGrowth [MINOR]
- **File**: `src/pages/Dashboard.tsx:261-266`
- **Severity**: MINOR
- **Issue**: `stats?.monthlyGrowth?.revenue` optional chain is correct but `stats` fallback object shape may not include `monthlyGrowth`, causing silent undefined

---

### BUG-012 — Inconsistent Status Naming Across Codebase [MINOR]
- **File**: Multiple — `server/routes/bookings.js`, `src/pages/MyBookings.tsx`
- **Severity**: MINOR
- **Issue**: Some places use `no_show`, others may use `noShow` — needs audit for consistency

---

### BUG-013 — Profile.tsx: Silent Slot Parse Failure Has No User Feedback [MINOR]
- **File**: `src/pages/Profile.tsx`
- **Severity**: MINOR
- **Issue**: Duplicate of BUG-007 UX side — no toast or UI indication when parse fails

---

### BUG-014 — Missing Null Check on Service _id in Services.tsx [MINOR]
- **File**: `src/pages/Services.tsx:238-240`
- **Severity**: MINOR
- **Issue**: `handleBookNow(service)` passes service without verifying `service._id` exists; modal receives invalid data

---

### BUG-015 — Provider.js Middleware Chain Has No Explicit next() After requireRole [MINOR]
- **File**: `server/routes/provider.js:33-39`
- **Severity**: MINOR
- **Issue**: If `requireRole` fails and calls `next(err)`, the route handler may still execute depending on error middleware ordering

---

## Summary
| Severity | Count |
|----------|-------|
| Critical | 4 |
| Major | 6 |
| Minor | 5 |
| **Total** | **15** |
