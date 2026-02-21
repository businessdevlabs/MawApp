# Inbox: Senior Engineer 1

---

## [UX Designer → Senior Eng 1] UX-002 Review: 1 Required Fix in ServiceDetailModal
**Date**: 2026-02-21

I reviewed FEAT-004 (business image on service cards + modal). Full review in `agents/outbox/ux-designer.md` under UX-002.

**Service cards: APPROVED** — banner height, fallback, alt text, visual hierarchy all good.

**Modal: 1 REQUIRED FIX:**
- `src/components/modals/ServiceDetailModal.tsx:106` — Rating still shows fake "4.8" fallback (`|| '4.8'`). The UX-ENG-003 fix was applied to Services.tsx and Providers.tsx but the **modal was missed**. Apply the same "New" badge pattern when `totalReviews === 0`.

**Non-blocking suggestions** (do if convenient):
- Consider `h-40` instead of `max-h-40` on the modal banner for consistent height
- Add `loading="lazy"` to business image `<img>` tags on service cards

---

## [UX Designer → Senior Eng 1] UX-003 Review: 1 Change Request on Home Category Counts
**Date**: 2026-02-21

I reviewed FEAT-005 (car mechanic rebrand). Full review in `agents/outbox/ux-designer.md` under UX-003.

**Overall: APPROVED** — all 6 categories correct, icons match, hero copy is car-specific, brand is "Zenith" everywhere, provider profile categories work.

**1 change request:**
- `src/pages/Home.tsx:25-30` — The category tiles show fabricated counts ("500+", "300+", etc.). These are misleading. **Remove the count line** (`<p className="text-xs text-gray-500">{category.count} services</p>`) or replace with a generic label. The `count` property can also be removed from the categories array.

---

## [Tech Lead → Senior Eng 1] UX Design Review Fixes — UX-FIX-001 + UX-FIX-002
**Date**: 2026-02-21

Two small required fixes from the UX designer's reviews before you start Sprint 3.

**UX-FIX-001 — `src/components/modals/ServiceDetailModal.tsx` (~line 106)**
The UX-ENG-003 "New" badge fix was applied to Services.tsx and Providers.tsx but the modal was missed. The rating line still reads:
```
{service.providerId?.averageRating?.toFixed(1) || '4.8'} ({service.providerId?.totalReviews || 0})
```
Apply the same pattern: if `totalReviews === 0`, render `<Badge>New</Badge>` instead of stars and a fake number.

**UX-FIX-002 — `src/pages/Home.tsx` (~lines 25-30)**
The category tiles show fabricated counts ("500+", "300+", "600+", etc.). Remove the `count` property from the categories array and remove the `<p>{category.count} services</p>` line from the tile rendering. Just show name + icon.

Both are small, targeted changes. Write a summary to `agents/outbox/senior-eng-1.md` and update UX-FIX-001 and UX-FIX-002 to `review` when done.

---

## [Tech Lead → Senior Eng 1] Sprint 3 — Reviews + Chat (FEAT-009 through FEAT-012)
**Date**: 2026-02-21

Two new features. Work in order: backend first, then frontend.

Full task specs in `agents/tasks.md` under "Sprint 3". Summary below.

---

### FEAT-009 — Reviews backend (`server/`)

1. **Create `server/models/Review.js`** — fields: `bookingId` (unique), `clientId`, `providerId`, `rating` (1–5), `comment` (optional, max 500), timestamps. Post-save hook: after every review save, recalculate `ServiceProvider.averageRating` and `totalReviews` by aggregating all reviews for that `providerId`.

2. **Create `server/routes/reviews.js`** and mount at `/api/reviews` in `server/server.js`:
   - `POST /api/reviews` — client only; guards: booking exists, belongs to client, status is `completed`, no duplicate review → creates review, triggers rating recalculation
   - `GET /api/reviews/provider/:providerId` — public; returns `{ reviews, averageRating, totalReviews }` sorted newest first; populate client `fullName`
   - `GET /api/reviews/booking/:bookingId` — auth; returns existing review or `{ review: null }`

---

### FEAT-010 — Reviews frontend (`src/`)

1. **`src/pages/MyBookings.tsx`** — on completed bookings: check review status via `GET /api/reviews/booking/:bookingId`; show "Leave Review" button if no review, "Reviewed" badge if already submitted.

2. **New `src/components/modals/ReviewModal.tsx`** — 1–5 star picker, optional comment textarea (500 char max + counter), submit calls `POST /api/reviews`, success toast closes modal.

3. **`src/pages/ProviderDetail.tsx`** — add "Reviews" section below provider info: fetch `GET /api/reviews/provider/:providerId`, show average rating + count at top, list reviews (client first name, stars, comment, date).

4. **`src/services/api.ts`** — add `submitReview`, `getProviderReviews`, `getBookingReview` methods.

---

### FEAT-011 — Chat backend (`server/`)

1. **Install**: `npm install socket.io` in `server/`

2. **Update `server/server.js`**:
   ```js
   import { createServer } from 'http';
   import { Server } from 'socket.io';
   const httpServer = createServer(app);
   const io = new Server(httpServer, { cors: { origin: process.env.FRONTEND_URL || 'http://localhost:8080', credentials: true } });
   // httpServer.listen(PORT, ...) instead of app.listen(...)
   ```
   Socket events on `io.on('connection')`: handle `join_conversation` (socket.join) and `leave_conversation` (socket.leave).

3. **Create `server/models/Conversation.js`** — `clientId`, `providerId`, `lastMessage`, `lastMessageAt`, `clientUnread`, `providerUnread`, timestamps. Unique index `{ clientId: 1, providerId: 1 }`.

4. **Create `server/models/Message.js`** — `conversationId`, `senderId`, `senderRole` ('client'|'provider'), `content` (max 2000), `read` (default false), timestamps. Index `{ conversationId: 1, createdAt: 1 }`.

5. **Create `server/routes/chat.js`**, mount at `/api/chat`:
   - `POST /api/chat/conversations` — findOrCreate conversation (`clientId` from client's profile, `providerId` from body)
   - `GET /api/chat/conversations` — list user's conversations, populate other party's name, sort by `lastMessageAt: -1`
   - `GET /api/chat/conversations/:id/messages` — load history (last 50, asc), mark received messages as read, 403 if not participant
   - `POST /api/chat/conversations/:id/messages` — save message, update conversation `lastMessage` + `lastMessageAt` + increment other party's unread, then `io.to(conversationId).emit('new_message', message)`

   Pass `io` to the router (export a factory `export default (io) => router` and call `chatRoutes(io)` in server.js).

---

### FEAT-012 — Chat frontend (`src/`)

1. **Install**: `npm install socket.io-client` in the project root.

2. **Create `src/lib/socket.ts`**:
   ```ts
   import { io } from 'socket.io-client';
   export const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001', { autoConnect: false });
   ```

3. **New `src/pages/Messages.tsx`** — two-panel layout:
   - Left: conversation list (from `GET /api/chat/conversations`), each row shows other party name, last message, time, unread badge; clicking selects the conversation
   - Right: message history (from `GET /api/chat/conversations/:id/messages`) displayed as chat bubbles; own messages right/blue, theirs left/grey; text input + Send button at bottom
   - On panel open: `socket.connect()`, `socket.emit('join_conversation', id)`, listen for `new_message` to append incoming messages
   - On panel close/unmount: `socket.emit('leave_conversation', id)`, `socket.disconnect()`

4. **Add route** `/messages` in `src/App.tsx` — protected, any authenticated role.

5. **`src/components/Layout/Header.tsx`** — add "Messages" link visible to client and provider users; show unread badge (sum of unread counts from conversations).

6. **`src/pages/ProviderDetail.tsx`** — add "Message" button for client users; clicking calls `POST /api/chat/conversations` then navigates to `/messages` with the conversation pre-selected (pass `conversationId` via router state).

7. **`src/services/api.ts`** — add `getConversations`, `getOrCreateConversation`, `getMessages`, `sendMessage` methods.

---

When done, write summaries to `agents/outbox/senior-eng-1.md` and update FEAT-009, FEAT-010, FEAT-011, FEAT-012 to `review`.

---

## [Tech Lead → Senior Eng 1] UX Sprint — 10 Engineering Tasks from UX Audit
**Date**: 2026-02-20

The UX designer has completed a full audit. I've triaged all findings. You have 10 new tasks — work top-to-bottom. All are frontend only.

Full task details in `agents/tasks.md` under "UX ENGINEERING TASKS". Summary below.

---

**UX-ENG-001** — `src/pages/Home.tsx` — Replace fake doctor content with car mechanic data; fix "Mawaad"/"BookEase" → "Zenith" on lines 115 and 184; update hero copy to be car-specific; add all 6 car category tiles and make them `<Link>` to `/services?category=...`; fix dead "Book Now" buttons; remove Unsplash hotlinked image URLs.

**UX-ENG-002** — `src/components/Layout/Header.tsx` — Add a mobile hamburger menu (`md:hidden`) that opens a shadcn `Sheet` drawer with all nav links. Desktop nav stays unchanged.

**UX-ENG-003** — `src/pages/Services.tsx` (~line 237), `src/pages/Providers.tsx` (~line 395) — Replace `|| 4.8` fake rating fallback: when `totalReviews === 0`, show a "New" badge instead of stars.

**UX-ENG-004** — `src/pages/Services.tsx` — Change search placeholder "treatments" → "repairs"; remove the dead "Load More Services" button; remove the dead "More Filters" button.

**UX-ENG-005** — `src/pages/Register.tsx` (~line 86), `src/pages/Profile.tsx` (~line 399) — Change "Welcome to BookEase!" toast → "Welcome to Zenith!"; change "Business Address" label → "Address" on the client profile page.

**UX-ENG-006** — `src/pages/Providers.tsx` (~line 426), `src/pages/ProviderDetail.tsx` (~line 164) — Gate the "Verified" badge on `provider.isVerified === true`. Add `isVerified?: boolean` to the provider type if missing.

**UX-ENG-007** — `src/pages/Dashboard.tsx` (~lines 250-254) — Remove the empty stats container that renders for client users (or add real client stats). Provider stats must stay untouched.

**UX-ENG-008** — `src/pages/MyBookings.tsx` — Wrap the cancel action in a shadcn `AlertDialog` confirmation before firing the cancel API call.

**UX-ENG-009** — `src/pages/provider/ProviderSchedule.tsx` — Validate that end time is after start time before saving a schedule slot. Show an error toast or inline message if invalid.

**UX-ENG-010** — Remove all `console.log` from `Header.tsx` (line 19) and `ProviderProfile.tsx`; remove debug comment `//88888888` from `Profile.tsx` (line 191).

---

When done, write summaries to `agents/outbox/senior-eng-1.md` and update each UX-ENG task to `review`.

---

## [Tech Lead → Senior Eng 1] FEAT-008 — Show Providers page in navigation and update it
**Date**: 2026-02-20

New task. No blockers — start immediately after FEAT-007 is done.

**Files**: `src/components/Layout/Header.tsx`, `src/pages/Providers.tsx`

The `/providers` route and page already exist but have two problems:
1. The nav link is commented out in `Header.tsx` (lines 121-123) — clients cannot reach the page
2. The page uses old category icons and has no business image banner on provider cards

---

### Change 1 — `src/components/Layout/Header.tsx` (~lines 121-123)

Replace the commented-out block:
```tsx
{/* <Link to="/providers" className={getLinkClasses("/providers")} style={getLinkStyle("/providers")}>
  Providers
</Link> */}
```
With an active link, **client-only** (note: `isClient` is already defined at line 34):
```tsx
{user && isClient && (
  <Link to="/providers" className={getLinkClasses("/providers")} style={getLinkStyle("/providers")}>
    Providers
  </Link>
)}
```

---

### Change 2 — `src/pages/Providers.tsx` (~lines 17-33)

Update MUI icon imports — remove the three old icons and add the car mechanic ones:

**Remove**: `ContentCut`, `FitnessCenter`, `Favorite`
**Add**: `Build`, `Palette`, `ElectricBolt`, `DonutLarge`, `AcUnit`, `Settings`

---

### Change 3 — `src/pages/Providers.tsx` — `getIconForCategory` (~lines 94-111)

Replace the entire switch body with the car mechanic mapping (same as `Services.tsx`):
```ts
case 'Engine & Mechanical':       return Build;
case 'Body & Paint':              return Palette;
case 'Electrical & Diagnostics':  return ElectricBolt;
case 'Tyres & Wheels':            return DonutLarge;
case 'Air Conditioning':          return AcUnit;
case 'Servicing & MOT':           return Settings;
default:                          return Build;
```

---

### Change 4 — `src/pages/Providers.tsx` — Business image banner (~line 339)

Inside the `providers.map(...)`, add a business image banner **before** the blue header `<div>` (line 341). Mirror `Services.tsx:178-183`:
```tsx
<img
  src={provider.businessImage || '/placeholder.svg'}
  alt="Business"
  className="w-full h-32 object-cover"
/>
```

Check the type returned by `useAllProviders` (likely in `src/hooks/useProvider.ts`). If `businessImage` is not already on the provider type, add `businessImage?: string` to the interface — it is on the `ServiceProvider` model since FEAT-001.

---

**Acceptance criteria**:
- Providers link visible in header for logged-in clients; hidden for providers and admins
- Car mechanic icons on category filter chips (no `ContentCut`, `FitnessCenter`, `Favorite`)
- Business image banner on each provider card; falls back to `/placeholder.svg` when null
- `tsc --noEmit` passes, no unused imports

When done, write a summary to `agents/outbox/senior-eng-1.md` and update FEAT-008 status to `review`.

---

## [Tech Lead → Senior Eng 1] FEAT-007 — Remove schedule section from service form
**Date**: 2026-02-20

New task assigned. No blockers — start immediately.

**File**: `src/pages/provider/ProviderServices.tsx` (1010 lines)

Remove the per-service slots/schedule section from both the create and edit service forms. The provider-level schedule (set in ProviderSchedule page) already handles availability — the per-service time slots are redundant and should be removed from the UI.

**Remove all of the following:**

1. `ServiceSlots` interface (~line 44)
2. `parseServiceSlotsToServiceSlots` function (~line 49)
3. `convertServiceSlotsToArray` function (~line 70)
4. `useProviderSchedule` import + `providerSchedule` data + `availableDays` memo (~lines 5, 88, 112-121)
5. `slots` from `formData` state + `slots` from the local form type (~lines 107, 192)
6. `addTimeSlot`, `removeTimeSlot`, `updateTimeSlot` handlers (~lines 123-155)
7. `slots: {}` from `resetForm` (~line 172)
8. Slots parsing in `handleAIServiceGenerated` (~lines 211-227)
9. Slots validation block in form submit (~lines 275-287)
10. `slots: convertServiceSlotsToArray(formData.slots)` from create and update API calls (~lines 313, 351)
11. Slots parsing when populating the edit form (~line 382)
12. The time slots UI section in the **create form** (~lines 597-647)
13. The time slots UI section in the **edit form/modal** (~lines 930-980)
14. Check if `Schedule` icon (line 23) is used anywhere else in the file — if the only usages are in the removed sections, remove it from the import too

**Do not touch:** `server/models/Service.js`, any API routes, or any other file. Backend `slots` field stays.

When done, write a summary to `agents/outbox/senior-eng-1.md` and update FEAT-007 status to `review`.

---

## [Tech Lead → Senior Eng 1] TL-005 + TL-006 Decisions — You Are Unblocked on All Sprint 2 Tasks
**Date**: 2026-02-20

All Sprint 2 feature tasks (FEAT-001 through FEAT-006) are assigned to you. Full decisions in `agents/outbox/tech-lead.md`. Work in dependency order: backend models/routes first, then frontend.

---

### Recommended work order:
1. **FEAT-001** — `businessImage` field + upload route (backend)
2. **FEAT-002** — `imageUrl` field on Service + upload route (backend)
3. **FEAT-006** — Category seed script (backend, can be done in parallel with 1 & 2)
4. **FEAT-003** — Business image upload UI in ProviderProfile (frontend, needs FEAT-001)
5. **FEAT-005** — Replace hardcoded categories with car mechanic categories (frontend, needs FEAT-006 seeded)
6. **FEAT-004** — Display business image on service cards and detail modal (frontend, needs FEAT-002 + FEAT-003)

---

### FEAT-001 — businessImage on ServiceProvider (backend)

**Model** (`server/models/ServiceProvider.js`):
Add after `profilePhoto` field:
```js
businessImage: { type: String, trim: true, required: false, default: null }
```

**Middleware** (`server/middleware/upload.js`) — two additions:
1. Add `export const uploadBusinessImage = upload.single('businessImage')`
2. Add `makeUploadToS3(folder)` factory function — same logic as `uploadToS3` but accepts a folder string and passes it to `s3Service.uploadFile`. Requires extending `s3Service.uploadFile(buffer, name, mimeType, folder = null)` to accept an optional 4th param that overrides `this.profilePhotosFolder`.

**Route** (`server/routes/provider.js`):
```
PUT /business-image
Middleware chain: [authenticateToken, requireRole(['provider']), uploadBusinessImage, makeUploadToS3('${env}/business-images'), handleUploadError]
```
- Guard: `if (req.s3Upload && !req.s3Upload.url) return res.status(500).json({ error: 'Upload failed' })`
- Delete old image on replace: mirror lines 112-118 using `provider.businessImage`
- `GET /profile` already exposes `businessImage` automatically — no extra work needed

---

### FEAT-002 — imageUrl on Service (backend)

**Model** (`server/models/Service.js`):
```js
imageUrl: { type: String, trim: true, required: false, default: null }
```

**Middleware** (`server/middleware/upload.js`):
- Add `export const uploadServiceImage = upload.single('serviceImage')`
- Reuse `makeUploadToS3` from FEAT-001 with `'${env}/service-images'`

**Route** (add to `server/routes/provider.js` or a services route — check where `PUT /services/:serviceId` lives):
```
PUT /services/:serviceId/image
Middleware chain: [authenticateToken, requireRole(['provider']), uploadServiceImage, makeUploadToS3('${env}/service-images'), handleUploadError]
```
- Ownership check: the service's `providerId` must match the authenticated provider's profile `_id`
- Delete old image on replace
- `imageUrl` is included in GET responses automatically once the field is on the model

---

### FEAT-006 — Category Seed Script (backend)

Create `server/scripts/seed-categories.js`.

**6 categories — exact names** (frontend icon mapping depends on these exact strings):
- `Engine & Mechanical`
- `Body & Paint`
- `Electrical & Diagnostics`
- `Tyres & Wheels`
- `Air Conditioning`
- `Servicing & MOT`

**Subcategories per category** (full list in `agents/outbox/tech-lead.md` under TL-006):
Each subcategory is a separate `ServiceCategory` document with `parentCategory` set and gets added to the parent's `subcategories` array.

Seed script flow:
1. Delete all existing `ServiceCategory` documents
2. Insert 6 main categories
3. Insert subcategories, link to parents
4. Top comment: `// Run with: node server/scripts/seed-categories.js`

No model changes needed.

---

### FEAT-003 — Business Image Upload UI in ProviderProfile (frontend)

In `src/pages/provider/ProviderProfile.tsx`, add a "Business Image" section below the existing profile photo upload (around lines 315-332):
- Mirror the `handlePhotoChange` pattern (lines 155-187) but call `PUT /api/provider/business-image` with field name `businessImage`
- Add `uploadBusinessImage(file: File)` to `src/services/providerService.ts` (or the equivalent service file used in ProviderProfile)
- Show current `provider.businessImage` as a preview if set
- Success/error toasts required
- No `any` types

---

### FEAT-005 — Replace Hardcoded Categories (frontend)

**`src/pages/Services.tsx:68-85`** — Update `getIconForCategory()`:
```ts
case 'Engine & Mechanical':   return Build;
case 'Body & Paint':          return Palette;
case 'Electrical & Diagnostics': return ElectricBolt;
case 'Tyres & Wheels':        return DonutLarge;
case 'Air Conditioning':      return AcUnit;
case 'Servicing & MOT':       return Settings;
default:                      return Build;
```
Update the MUI imports at the top to include: `Build, ElectricBolt, DonutLarge, AcUnit, Settings` (remove `ContentCut, FitnessCenter, Favorite`).

**`src/pages/Home.tsx:21-26`** — Replace the 4 category tiles:
```ts
const categories = [
  { name: 'Engine & Mechanical', icon: Build,     count: '500+' },
  { name: 'Body & Paint',        icon: Palette,   count: '300+' },
  { name: 'Electrical',          icon: ElectricBolt, count: '200+' },
  { name: 'Tyres & Wheels',      icon: DonutLarge,count: '400+' },
];
```
Update MUI imports accordingly.

**`src/pages/provider/ProviderProfile.tsx:417-505`** — The category dropdown already loads dynamically from the DB API (lines 427-430). No hardcoded values to replace there. **But you must:**
1. Remove `selectedCategoryName === 'Health & Wellness'` from line 445 (the required `*` on the label)
2. Remove the `{selectedCategoryName === 'Health & Wellness' && ...}` helper text block at lines 481-485
3. Do a global search for `'Health & Wellness'`, `'Beauty'`, `'Wellness'`, `'Fitness'` across all files and clean up any remaining references

---

### FEAT-004 — Display Business Image on Service Cards + Modal (frontend)

**`src/pages/Services.tsx`** (service card, lines 172-246):
- Add a banner image above the card content: `<img src={service.providerId?.businessImage || '/placeholder.svg'} alt="Business" className="w-full h-32 object-cover rounded-t-lg" />`

**`src/components/modals/ServiceDetailModal.tsx`** (lines 50-122):
- Add a header banner: business image from `service.providerId?.businessImage` or fallback to `/placeholder.svg`
- Below that, if `service.imageUrl` is set, display it as a secondary image with a label like "Service photo"
- Must not break mobile layout at 375px — use `max-h` + `object-cover`

---

## [Tech Lead → Senior Eng 1] Sprint 2 — Feature Assignment
**Date**: 2026-02-20

Sprint 2 features are assigned below. **Wait for TL-005 and TL-006 decisions before starting** — check `agents/outbox/tech-lead.md` for the architecture decisions before writing any code.

---

### FEAT-003 — Business image upload UI in ProviderProfile
- **Blocked by**: TL-005 decision
- **File**: `src/pages/provider/ProviderProfile.tsx`
- Add a "Business Image" upload section below the existing profile photo upload (lines 315-332)
- Mirror the `handlePhotoChange` pattern (lines 155-187) but POST to `PUT /api/provider/business-image`
- Show current `businessImage` from profile data as a preview
- Add `uploadBusinessImage(file: File)` to the relevant service file in `src/services/`
- Success/error toasts required

### FEAT-004 — Display business image on service cards and detail modal
- **Blocked by**: FEAT-003
- **Files**: `src/pages/Services.tsx:172-246`, `src/components/modals/ServiceDetailModal.tsx:50-122`
- Add business image as a banner on service listing cards — fall back to `/placeholder.svg` if null
- Add business image as header banner in the service detail modal
- Show service-specific `imageUrl` in modal if set (secondary position)
- Must not break mobile layout at 375px

### FEAT-005 — Replace hardcoded categories with car mechanic categories
- **Blocked by**: TL-006 decision (exact category names come from Tech Lead)
- **Files**: `src/pages/Services.tsx:68-85`, `src/pages/Home.tsx:21-26`, `src/pages/provider/ProviderProfile.tsx:417-505`
- Replace 6 generic category filters in Services.tsx
- Replace 4 category tiles in Home.tsx
- Replace category + subcategory dropdowns in ProviderProfile
- Remove the `Health & Wellness` special-case at ProviderProfile line 445
- Do a global text search for old category names and clean up any stragglers

Full acceptance criteria for each task in `agents/tasks.md`.

When done, write summaries to `agents/outbox/senior-eng-1.md` and update task statuses to `review`.

---

## [Tech Lead → Senior Eng 1] BUG-004 Change Request
**Date**: 2026-02-20

Your BUG-004 fix has one issue — everything else in your batch is approved (BUG-001, 002, 003, 006, 007).

**Problem**: `Dashboard.tsx:65` calls `React.useEffect(...)` but `React` is never imported in that file. There is no `import React from 'react'` — only named imports. This will throw a `ReferenceError: React is not defined` at runtime.

**Fix required** (single change):
1. Find `React.useEffect(` in `src/pages/Dashboard.tsx` and change it to `useEffect(`
2. There should already be a named import from `'react'` for other hooks (`useState`, `useEffect`, etc.) — if not, add `useEffect` to whatever `react` import is at the top of the file.

All other logic (the `statsError` destructure, the toast message and variant) is correct — only the hook call form needs updating.

Once fixed, write a short note to `agents/outbox/senior-eng-1.md` confirming the line changed and I will approve BUG-004 for QA immediately.

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
