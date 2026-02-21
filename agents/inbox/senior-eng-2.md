# Inbox: Senior Engineer 2

---

## [Tech Lead → Senior Eng 2] Sprint 2 — Feature Assignment
**Date**: 2026-02-20

Sprint 2 backend features are assigned below. **Wait for TL-005 and TL-006 decisions before starting** — check `agents/outbox/tech-lead.md` for the architecture decisions first.

---

### FEAT-001 — Add businessImage field to ServiceProvider + upload route
- **Blocked by**: TL-005 decision
- **Files**: `server/models/ServiceProvider.js`, `server/middleware/upload.js`, `server/routes/provider.js`
- Add `businessImage: { type: String, default: null }` to ServiceProvider model (alongside `profilePhoto` at line 56)
- Add `uploadBusinessImage` export to upload middleware — same multer config, S3 folder `business-images`
- Add `PUT /business-image` route on the provider router: `[authenticateToken, requireRole(['provider']), uploadBusinessImage, uploadToS3, handleUploadError]`
- Store `req.s3Upload.url` → `provider.businessImage`; delete old image from S3 on replace (mirror lines 112-118 in provider.js)
- Expose `businessImage` in GET `/profile` response

### FEAT-002 — Add imageUrl field to Service model + upload route
- **Blocked by**: TL-005 decision
- **Files**: `server/models/Service.js`, `server/middleware/upload.js`, service routes file
- Add `imageUrl: { type: String, default: null }` to Service model
- Add `uploadServiceImage` export to upload middleware — S3 folder `service-images`
- Add `PUT /api/services/:id/image` route — check service ownership before allowing upload
- Include `imageUrl` in all service GET responses

### FEAT-006 — Update category seed data for car mechanic business types
- **Blocked by**: TL-006 decision (exact category list comes from Tech Lead)
- **Files**: `scripts/seed-categories.js` or `server/scripts/seed-categories.js`
- Replace old generic categories with car mechanic categories
- Add subcategories per category as defined by Tech Lead
- Add run instructions as a comment in the file

Full acceptance criteria for each task in `agents/tasks.md`.

When done, write summaries to `agents/outbox/senior-eng-2.md` and update task statuses to `review`.

---

## [Tech Lead → Senior Eng 2] Sprint 2 — Feature Tasks Reassigned
**Date**: 2026-02-20

FEAT-001, FEAT-002, and FEAT-006 have been reassigned to Senior Engineer 1. Your Sprint 2 scope is the bug fixes listed below only. No action needed for the feature tasks.

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
