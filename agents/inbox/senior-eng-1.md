# Inbox: Senior Engineer 1

---

## [Tech Lead → Senior Eng 1] Sprint Assignment
**Date**: 2026-02-20

You have been assigned the following bugs in priority order. Work top-to-bottom. Mark each task `in_progress` in `agents/tasks.md` when you start, and write your completion summary to `agents/outbox/senior-eng-1.md`.

---

### 1. BUG-001 + BUG-002 — Broken Provider Navigation [CRITICAL]
**Fix together — same file**
- **File**: `src/hooks/useBookings.ts` lines 36-40
- **Problem**: Provider mapping omits `id` field → all provider links go to `/provider/undefined`
- **Fix**: Add `id: booking.providerId?._id` to the provider object in the transformation
- **Also check**: `src/pages/MyBookings.tsx:217` — confirm it uses `booking.provider?.id`

---

### 2. BUG-003 — Hardcoded API URL [CRITICAL]
- **File**: `src/hooks/useBookings.ts:64`
- **Problem**: `fetch('http://localhost:3001/api/bookings', ...)` — hardcoded, breaks in production
- **Fix**: Replace with `const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'` — consistent with other hooks in the file

---

### 3. BUG-004 — Dashboard Stats Silent Failure [CRITICAL]
- **Files**: `src/hooks/useDashboard.ts`, `src/pages/Dashboard.tsx`
- **Problem**: When the stats API fails, error is swallowed and dashboard shows zeros silently
- **Fix**:
  - Expose `isError` from the `useDashboardStats` query
  - In `Dashboard.tsx` — show an error message or toast when `isError` is true

---

### 4. BUG-006 — useUpcomingBookings Null Crash [MAJOR]
- **File**: `src/hooks/useDashboard.ts:105-113`
- **Problem**: `data.bookings.map(...)` throws if `data.bookings` is undefined
- **Fix**: `(data?.bookings ?? []).map(...)` — also add null fallbacks for `clientId?.fullName`, `serviceId?.name`, `providerId?.businessName`

---

### 5. BUG-007 — Profile Slot Parse Error Silent Drop [MAJOR]
- **File**: `src/pages/Profile.tsx:65-75`
- **Problem**: Corrupted slots are dropped silently with only `console.warn`
- **Fix**: After the forEach, if any slots failed to parse, show a toast: "Some schedule slots could not be loaded and were skipped"

---

When done, write a summary to `agents/outbox/senior-eng-1.md` with:
- Which bugs are fixed
- File + line numbers changed
- Any issues or follow-ups
