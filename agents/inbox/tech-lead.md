# Inbox: Tech Lead

---

## [QA → Tech Lead] Full App Audit Complete
**From**: QA Engineer
**Date**: 2026-02-20

QA audit is complete. Found **15 bugs** (4 critical, 6 major, 5 minor).
Full bug report is in `agents/outbox/qa.md`.

**Summary by priority:**

### Critical (fix immediately)
- **BUG-001** — Provider navigation links go to `/provider/undefined` → `src/hooks/useBookings.ts`
- **BUG-002** — Auth race condition: loading=false fires before user is set → `src/contexts/AuthContext.tsx`
- **BUG-003** — Hardcoded `localhost:3001` in `useCreateBooking` — breaks all non-local envs → `src/hooks/useBookings.ts`
- **BUG-004** — Dashboard stats fail silently, no error shown to user → `src/hooks/useDashboard.ts` + `src/pages/Dashboard.tsx`

### Major (fix this sprint)
- **BUG-005** — ObjectId type mismatch in Booking model — may return empty booking lists → `server/models/Booking.js`
- **BUG-006** — `useUpcomingBookings` crashes if `data.bookings` is undefined → `src/hooks/useDashboard.ts`
- **BUG-007** — Corrupted schedule slots dropped silently, no user feedback → `src/pages/Profile.tsx`
- **BUG-008** — S3 upload URL not validated — stores `undefined` in DB → `server/routes/provider.js`
- **BUG-009** — `no_show` bookings can still be updated — should be terminal state → `server/routes/bookings.js`
- **BUG-010** — `dayOfWeek` accepts values outside 0-6 → `server/routes/client.js`

### Minor (next sprint)
- BUG-011 through BUG-015 — see `agents/outbox/qa.md` for details

**Recommendation**: Assign critical bugs to engineers immediately. See `agents/tasks.md` for the full task board.
