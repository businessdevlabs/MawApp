# Inbox: Senior Engineer 2

---

## [Tech Lead → Senior Eng 2] Sprint Assignment
**Date**: 2026-02-20

You have been assigned the following bugs in priority order. Work top-to-bottom. Mark each task `in_progress` in `agents/tasks.md` when you start, and write your completion summary to `agents/outbox/senior-eng-2.md`.

---

### 1. BUG-005 — ObjectId Type Mismatch in Booking Queries [MAJOR]
- **File**: `server/models/Booking.js:139-167`
- **Problem**: `getUpcomingForClient` keeps `clientId` as a string — MongoDB ObjectId comparison may silently return empty results
- **Fix**: When the string is a valid ObjectId, cast it: `queryClientId = new mongoose.Types.ObjectId(clientId)`

---

### 2. BUG-008 — S3 URL Not Validated Before DB Write [MAJOR]
- **File**: `server/routes/provider.js:102-109`
- **Problem**: If `req.s3Upload` exists but lacks a `url` property, `undefined` gets stored in the DB
- **Fix**: Add a guard — if `req.s3Upload && !req.s3Upload.url`, return a 500 error before writing to DB

---

### 3. BUG-009 — no_show Bookings Can Be Updated [MAJOR]
- **File**: `server/routes/bookings.js:436-438`
- **Problem**: Only `completed` and `cancelled` are treated as terminal states — `no_show` can still be updated
- **Fix**: Add `booking.status === 'no_show'` to the terminal state guard condition

---

### 4. BUG-010 — dayOfWeek Accepts Invalid Values [MAJOR]
- **File**: `server/routes/client.js:173-176`
- **Problem**: Slot with `dayOfWeek: 8` or `-1` passes validation and gets stored
- **Fix**: After parsing each slot, check `if (parsed.dayOfWeek < 0 || parsed.dayOfWeek > 6)` → return 400

---

### 5. BUG-011 — Dashboard monthlyGrowth Null Guard [MINOR]
- **File**: `src/pages/Dashboard.tsx:261-266`
- **Problem**: `stats?.monthlyGrowth?.revenue` optional chain works but fallback `stats` object may not have `monthlyGrowth` defined
- **Fix**: Ensure the fallback stats object in `useDashboard.ts` includes `monthlyGrowth: { revenue: 0, bookings: 0 }`

---

### 6. BUG-014 — Service _id Not Validated Before Modal [MINOR]
- **File**: `src/pages/Services.tsx:238-240`
- **Problem**: `handleBookNow(service)` does not verify `service._id` exists before opening the booking modal
- **Fix**: Add a guard — if `!service._id`, show a toast error and return early

---

When done, write a summary to `agents/outbox/senior-eng-2.md` with:
- Which bugs are fixed
- File + line numbers changed
- Any issues or follow-ups
