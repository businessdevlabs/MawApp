# Outbox: Tech Lead

---

## 2026-02-21 — Code Review: FEAT-013, UX-FIX-001, UX-FIX-002 + TL-010 Redesign Triage

### FEAT-013 ✅ APPROVED
- `Providers.tsx:95` — `id: category._id` ✅ (category filter now sends ObjectId)
- `providers.js` — `andConditions` + `query.$and` pattern ✅; `$ne` duplicate key bug also fixed ✅
- `Providers.tsx` — Asc/Desc sort toggle button ✅
- `Providers.tsx` — Maximum Rating slider in Advanced Filters ✅
- `providers.js` — `effectiveRating` `$addFields` removed from both pipeline and count pipeline ✅; `|| 4.8` fallback removed from single provider endpoint too ✅

### UX-FIX-001 ✅ APPROVED
`ServiceDetailModal.tsx:104-113` — `<Badge>New</Badge>` when `totalReviews === 0` ✅; no `|| '4.8'` ✅

### UX-FIX-002 ✅ APPROVED
`Home.tsx` — `count` property removed from categories array ✅; count `<p>` element removed from tile rendering ✅

---

### TL-010 — UX-REDESIGN Tasks Triaged

Reviewed UX-REDESIGN-001 through UX-REDESIGN-010. All tasks are well-specified. Confirmed implementation order (002 must go first as it unblocks everything):

| Order | Task | Priority | Status |
|-------|------|----------|--------|
| 1 | UX-REDESIGN-002 — Fix `--primary` CSS variable | Critical | pending |
| 2 | UX-REDESIGN-003 — Global inline style sweep | Critical | pending |
| 3 | UX-REDESIGN-004 — Remove inline fontFamily | Major | pending |
| 4 | UX-REDESIGN-005 — Standardize icon sizing | Major | pending |
| 5 | UX-REDESIGN-006 — Services page polish parity | Major | pending |
| 6 | UX-REDESIGN-007 — ProviderDetail business image banner | Major | pending |
| 7 | UX-REDESIGN-008 — Loading skeleton shapes | Minor | pending |
| 8 | UX-REDESIGN-009 — MyBookings card styling | Minor | pending |
| 9 | UX-REDESIGN-010 — Empty states with CTAs | Minor | pending |
| — | UX-REDESIGN-001 — Providers page card simplification | (in review) | review |

All assigned to senior-eng-1. Notified via inbox.

---

## 2026-02-21 — UX Design Reviews: UX-002, UX-003, UX-004

### UX-004 ✅ APPROVED
Provider profile business image upload UI is well-implemented. No engineering action required. Non-blocking suggestions (placeholder area, query invalidation on success) noted for future iteration.

### UX-003 ✅ APPROVED — 1 fix required
Car mechanic rebrand fully correct. One change request actioned: fake service counts on Home category tiles must be removed (UX-FIX-002 assigned to SE1).

### UX-002 ⚠️ CHANGES NEEDED — 1 required fix
`ServiceDetailModal.tsx:106` still shows fake "4.8" rating fallback — the UX-ENG-003 fix was missed on the modal. Fix assigned to SE1 as UX-FIX-001. Non-blocking suggestions (fixed `h-40` on modal banner, `loading="lazy"` on card images) deferred.

---

## 2026-02-21 — Architecture Decision: Sprint 3 — Reviews + Chat

### Feature 1: Client Reviews

**Data model** — new `Review` document (not embedded on ServiceProvider):
- Fields: `bookingId` (unique ref → Booking), `clientId` (ref → User), `providerId` (ref → ServiceProvider), `rating` (1–5 integer), `comment` (String, optional, max 500), timestamps
- One review per booking enforced via unique index on `bookingId`
- Reviews only allowed when `booking.status === 'completed'` and `booking.clientId === reviewer`
- After save: post-save hook recalculates `ServiceProvider.averageRating` and `ServiceProvider.totalReviews` by aggregating all reviews for that provider. This keeps the existing fields accurate without extra queries on read.

**Routes** — new file `server/routes/reviews.js`, mounted at `/api/reviews`:
- `POST /api/reviews` — client only, creates review, triggers rating recalculation
- `GET /api/reviews/provider/:providerId` — public, lists reviews with client first name
- `GET /api/reviews/booking/:bookingId` — auth any, check if review already exists

**Frontend** — "Leave Review" button on completed bookings in MyBookings; `ReviewModal` with star picker + comment; reviews list in ProviderDetail.

---

### Feature 2: Client ↔ Provider Chat

**Architecture: Socket.io + REST hybrid**
- REST for sending messages and loading history (reliable, easy to implement, works without WebSocket connection)
- Socket.io for receiving messages in real-time (server emits `new_message` to the conversation room after a REST POST saves the message)

**Data models** — two new collections:
- `Conversation`: `clientId`, `providerId`, `lastMessage`, `lastMessageAt`, `clientUnread`, `providerUnread`. Unique compound index `{ clientId, providerId }` — one conversation per pair.
- `Message`: `conversationId`, `senderId`, `senderRole` ('client'|'provider'), `content` (max 2000), `read`, timestamps. Index `{ conversationId, createdAt }`.

**Server changes** — wrap Express in `http.createServer(app)` to support Socket.io. Replace `app.listen(PORT)` with `httpServer.listen(PORT)`. Socket events: `join_conversation` (join room), `leave_conversation` (leave room). New message event emitted server-side after REST POST saves the message.

**Routes** — new file `server/routes/chat.js`, mounted at `/api/chat`:
- `POST /api/chat/conversations` — find or create conversation
- `GET /api/chat/conversations` — list user's conversations
- `GET /api/chat/conversations/:id/messages` — load history + mark read
- `POST /api/chat/conversations/:id/messages` — save + emit `new_message`

**Frontend** — new `/messages` page, `src/lib/socket.ts` singleton, "Message" button on ProviderDetail, Messages nav link with unread badge.

**Dependency** — `socket.io` (server), `socket.io-client` (client).

---

## 2026-02-20 — Code Review: UX Engineering Tasks (UX-ENG-001 through UX-ENG-010)

All 10 verified against source files. All approved.

| Task | Files | Verdict |
|------|-------|---------|
| UX-ENG-001 | `Home.tsx` | ✅ Doctors gone, "Zenith" × 2, car hero copy, 6 category `<Link>` tiles, "Book Now" → `/services` |
| UX-ENG-002 | `Header.tsx` | ✅ `Sheet` drawer with `mobileOpen` state, `Menu` icon trigger `md:hidden`, role-aware links |
| UX-ENG-003 | `Services.tsx`, `Providers.tsx` | ✅ `totalReviews === 0` → `<Badge>New</Badge>` in both files |
| UX-ENG-004 | `Services.tsx` | ✅ placeholder "repairs", no "Load More", no "More Filters" |
| UX-ENG-005 | `Register.tsx`, `en.json` | ✅ toast → "Welcome to Zenith", address label → "Address" via i18n key |
| UX-ENG-006 | `Providers.tsx`, `ProviderDetail.tsx` | ✅ `isVerified === true` guard in both files |
| UX-ENG-007 | `Dashboard.tsx` | ✅ stats grid wrapped in `{(isProvider \|\| isAdmin) && ...}` |
| UX-ENG-008 | `MyBookings.tsx` | ✅ `AlertDialog` with "Keep Booking" / "Confirm Cancellation" |
| UX-ENG-009 | `ProviderSchedule.tsx` | ✅ `startTime >= endTime` validation → destructive toast + early return |
| UX-ENG-010 | `Header.tsx`, `ProviderProfile.tsx`, `Profile.tsx` | ✅ all `console.log` removed; `//88888888` removed |

**Decision: All 10 UX-ENG tasks approved — sending to QA.**

---

## 2026-02-20 — UX-005 Triage: UX-001 Audit Findings

UX-001 audit reviewed. 6 critical, 13 major, 10 minor issues found. Engineering tasks created for all critical and most major issues. Minor style/consistency issues deferred.

### Actioned (engineering tasks created → Senior Eng 1)

| Task | Covers | Summary |
|------|--------|---------|
| UX-ENG-001 | UX-C01, C02, C04, C05, M08, N09 | Home page overhaul: fake doctor content, branding, hero copy, category tiles |
| UX-ENG-002 | UX-C03 | Mobile hamburger nav in Header |
| UX-ENG-003 | UX-C06 | Fake 4.8 rating → "New" badge when no reviews |
| UX-ENG-004 | UX-M01, M02, M03 | Services page dead buttons + search placeholder |
| UX-ENG-005 | UX-M09, M04 | "BookEase" toast → "Zenith"; "Business Address" → "Address" |
| UX-ENG-006 | UX-M06 | "Verified" badge gated on `isVerified === true` |
| UX-ENG-007 | UX-M05 | Remove empty stats section for client dashboard |
| UX-ENG-008 | UX-M13 | Cancel confirmation AlertDialog in MyBookings |
| UX-ENG-009 | UX-M12 | End time > start time validation in ProviderSchedule |
| UX-ENG-010 | UX-N01, N02 | Remove console.logs + debug comment |

### Deferred

- **UX-M07** (card rounding inconsistency) — minor visual, not blocking
- **UX-M10** (forgot password) — requires backend password reset flow, out of current sprint scope
- **UX-M11** (footer) — larger scope, separate sprint item
- **UX-N03–N05** (colour/font style consistency) — design system work, deferred
- **UX-N06–N08** (mobile grid, register layout, remove photo button) — minor, deferred
- **UX-N10** (404 / error boundary) — infrastructure task, deferred

---

## 2026-02-20 — Code Review: FEAT-007 + FEAT-008 (TL-009)

### FEAT-007 ✅ APPROVED
`src/pages/provider/ProviderServices.tsx` — All slots/schedule code removed cleanly:
- `ServiceSlots`, `TimeRange` interfaces gone; `DAYS_OF_WEEK` constant gone
- `parseServiceSlotsToServiceSlots`, `convertServiceSlotsToArray` helpers gone
- `useProviderSchedule`, `useMemo` imports gone; `availableDays` memo gone
- `slots` field removed from `formData` state, `resetForm`, both API payloads, and `openEditDialog`
- Slot handlers (`handleAddTimeRange`, `handleRemoveTimeRange`, `handleTimeRangeChange`) gone
- Slots validation block gone; `slots` field removed from `GeneratedService` interface
- Both "Service Availability" UI sections (create form + edit modal) gone
- `Schedule` icon correctly kept — still used for duration display on service cards
- `tsc --noEmit` passes, no unused imports ✅

### FEAT-008 ✅ APPROVED
- `src/components/Layout/Header.tsx:121-125` — Providers link active, gated with `user && isClient` ✅; hidden for providers, admins, and unauthenticated users ✅
- `src/pages/Providers.tsx:17-34` — Old icons (`ContentCut`, `FitnessCenter`, `Favorite`, `FilterList`, `Schedule`) removed; car icons (`Build`, `Palette`, `ElectricBolt`, `DonutLarge`, `AcUnit`, `Settings`) added ✅
- `src/pages/Providers.tsx:95-105` — `getIconForCategory` maps all 6 car mechanic categories correctly; `default: return Build` ✅
- `src/pages/Providers.tsx:335-339` — Business image banner `w-full h-32 object-cover` with `/placeholder.svg` fallback, positioned above blue header ✅

**Decision: FEAT-007 and FEAT-008 approved — sending to QA.**

---

## 2026-02-20 — Code Review: Sprint 2 Features (TL-007 + TL-008) + BUG-004 Re-approval

### BUG-004 ✅ RE-APPROVED
`src/pages/Dashboard.tsx:10` — `import { useEffect } from 'react'` present as a named import. `React.useEffect` is gone. Change request resolved.

---

### TL-007 — FEAT-IMG Review

**FEAT-001 ✅ APPROVED**
- `server/models/ServiceProvider.js:61-66` — `businessImage` field correct
- `server/services/s3Service.js:64,68-69` — `uploadFile` extended cleanly with `folder = null` param; uses `folder || this.profilePhotosFolder`; backward compatible
- `server/middleware/upload.js:31-62` — `uploadBusinessImage`, `uploadServiceImage` multer exports clean; `makeUploadToS3(folder)` factory correctly mirrors `uploadToS3` logic; existing `uploadToS3` untouched
- `server/routes/provider.js:722-761` — `PUT /business-image`: `env` const correct, BUG-008 guard applied (`!req.s3Upload.url` → 500), no-file guard (`!req.s3Upload` → 400), old image deleted via `extractKeyFromUrl` + `deleteFile`, `provider.businessImage` set and saved

**FEAT-002 ✅ APPROVED**
- `server/models/Service.js:55-60` — `imageUrl` field correct
- `server/routes/provider.js:763-805` — `PUT /services/:serviceId/image`: guards consistent with FEAT-001, ownership check via `{ _id, providerId: provider._id }` ✅, old image deletion correct

**FEAT-003 ✅ APPROVED**
- `src/services/api.ts` — `businessImage?: string` on `ServiceProvider` interface; `uploadBusinessImage(file)` calls correct endpoint with correct FormData field name
- `src/pages/provider/ProviderProfile.tsx:49-51,205-240,418-459` — state, handlers, and UI all correct; file type/size validated client-side before upload; loading state and toasts present
- One non-blocking note: on success, `businessImagePreview` is not cleared and the provider query is not invalidated — so within the same session the preview stays as the local data URL until a refresh. Not blocking (image displays correctly) but a future improvement would be: call `setBusinessImagePreview(null)` on success and `queryClient.invalidateQueries(['providerProfile'])`

**FEAT-004 ✅ APPROVED**
- `src/pages/Services.tsx:178-183` — banner `h-32 object-cover` with fallback to `/placeholder.svg` ✅
- `src/components/modals/ServiceDetailModal.tsx:53-58` — banner `max-h-40 object-cover` ✅; `imageUrl` section at lines 121-130 renders only when present ✅
- `Service` interface in modal correctly typed with `imageUrl?` and `providerId.businessImage?` ✅
- `selectedService` in Services.tsx typed as `Service | null` (no `any`) ✅

---

### TL-008 — FEAT-CAR Review

**FEAT-005 ✅ APPROVED**
- `src/pages/Services.tsx:14-27,71-87` — old icons removed, car icons imported, `getIconForCategory` correctly maps all 6 categories with `Build` as default
- `src/pages/Home.tsx:21-26` — 4 car category tiles with correct names and icons
- Global grep confirms zero remaining `Health & Wellness`, `Beauty`, `Wellness`, `Fitness`, `ContentCut`, `FitnessCenter` in any `.tsx` file ✅

**FEAT-006 ✅ APPROVED**
- `server/scripts/seed-categories.js` — run comment at top ✅; 6 categories with exact names from TL-006 ✅; clean-slate `deleteMany` first ✅; subcategories created with `parentCategory` ref and parent's `subcategories` array updated ✅; clean disconnect on completion ✅

---

**Decision: All 6 Sprint 2 FEAT tasks and BUG-004 are APPROVED — sending to QA.**

---

## 2026-02-20 — Architecture Decision: TL-006 — Car Mechanic Rebrand

### New Category List (exact names — must match DB seed AND frontend)

| # | Category Name | MUI Icon | Notes |
|---|--------------|----------|-------|
| 1 | Engine & Mechanical | `Build` | Includes brakes, suspension, clutch |
| 2 | Body & Paint | `Palette` | Dents, paint, panels, glass |
| 3 | Electrical & Diagnostics | `ElectricBolt` | Battery, ECU, wiring, sensors |
| 4 | Tyres & Wheels | `DonutLarge` | Fitting, alignment, balancing, alloys |
| 5 | Air Conditioning | `AcUnit` | Regas, compressor, cabin filter |
| 6 | Servicing & MOT | `Build` (or `Settings`) | Full/interim service, oil change, MOT |

### Subcategories per Category

**Engine & Mechanical**
- Engine repair & rebuild
- Transmission & gearbox
- Clutch repair
- Exhaust & catalytic converter
- Suspension & steering
- Brakes

**Body & Paint**
- Dent & scratch repair
- Full respray
- Panel replacement
- Bumper repair
- Window & glass repair

**Electrical & Diagnostics**
- Battery & charging system
- ECU diagnostics
- Wiring & electrics
- Starter motor & alternator
- Sensors & modules

**Tyres & Wheels**
- Tyre fitting & replacement
- Wheel alignment & balancing
- Puncture repair
- Alloy wheel refurbishment

**Air Conditioning**
- A/C regas & recharge
- A/C compressor repair
- Climate control service
- Cabin air filter replacement

**Servicing & MOT**
- Full service
- Interim service
- Oil & filter change
- MOT test
- MOT preparation check

### DB Seed Decision
**Yes — update the seed script.** Frontend loads categories dynamically from the API, so DB must have the new names. No changes to `ServiceCategory.js` model — existing fields (name, subcategories, commonServices, isActive) cover everything needed. No new `vehicleType` field required.

### Health & Wellness Special-Case Removal
Remove all `selectedCategoryName === 'Health & Wellness'` references from `ProviderProfile.tsx`. No car mechanic category has a required specialization, so the `*` required marker and "Required for medical providers" helper text are both removed. Do not add an equivalent for any car category.

### Icons Import Note
`DonutLarge`, `Build`, `Palette`, `ElectricBolt`, `AcUnit` are all standard `@mui/icons-material` exports. If `ElectricBolt` is not available in the installed version, use `FlashOn` as fallback.

---

## 2026-02-20 — Architecture Decision: TL-005 — Business Image Upload

### 1. Field Structure
- **`businessImage`** — add as a **new, separate field** on `ServiceProvider` alongside `profilePhoto` (line 56). Do not reuse `profilePhoto`. They serve different purposes: `profilePhoto` is the owner headshot shown on their account; `businessImage` is the shop/garage banner image shown on service listings and the provider detail page.
- **`imageUrl`** — add as a **new field** on `Service`. Individual services can have their own specific images (e.g. a photo of a brake job). `businessImage` from the provider is the display fallback when no service-specific image is set.

### 2. S3 Folder Paths
- Business images: `${environment}/business-images`
- Service images: `${environment}/service-images`
Where `environment` = `process.env.NODE_ENV || 'development'` (consistent with how `s3Service` currently sets `profilePhotosFolder`).

### 3. Upload Middleware — Extend `upload.js`, no new file
Add to `server/middleware/upload.js`:
```js
// New multer field-name exports
export const uploadBusinessImage = upload.single('businessImage');
export const uploadServiceImage  = upload.single('serviceImage');

// Parameterised S3 upload factory — returns an uploadToS3-style middleware
// targeting a specific folder instead of the default profilePhotosFolder.
export const makeUploadToS3 = (folder) => async (req, res, next) => {
  // same logic as uploadToS3 but calls s3Service.uploadFile(..., folder)
};
```

Also extend `s3Service.uploadFile` signature:
```js
async uploadFile(fileBuffer, originalName, mimeType, folder = null)
// folder param overrides this.profilePhotosFolder when provided
```

The existing `uploadToS3` export and all its callers stay **unchanged** — backward compatible.

Middleware chains for new routes:
- `PUT /api/provider/business-image` → `[authenticateToken, requireRole(['provider']), uploadBusinessImage, makeUploadToS3('${env}/business-images'), handleUploadError]`
- `PUT /api/services/:id/image`      → `[authenticateToken, requireRole(['provider']), uploadServiceImage, makeUploadToS3('${env}/service-images'), handleUploadError]`

Note: The `env` prefix must be read from `process.env.NODE_ENV` at request time (or set once during startup as a const). Look at how `s3Service.profilePhotosFolder` does it — mirror that pattern.

### 4. Old Image Deletion on Replace
Mirror the pattern at `server/routes/provider.js:112-118`:
- On business image upload: if `provider.businessImage` exists, extract the S3 key with `s3Service.extractKeyFromUrl()` and call `s3Service.deleteFile(key)` before saving the new URL.
- Same pattern for service image on `service.imageUrl`.

### 5. GET Response Exposure
- `GET /api/provider/profile` already returns `{ provider }` — since `businessImage` is on the model, it will be included automatically by Mongoose. No extra work needed.
- Service routes: confirm `imageUrl` appears in the populated service objects returned by `GET /api/services` and `GET /api/services/:id`.

---

## 2026-02-20 — Code Review: Senior Engineer 1 Sprint 1 Fixes (TL-002)

Reviewed `agents/outbox/senior-eng-1.md` and verified all 6 bugs against the actual source files.

### BUG-001 ✅ APPROVED
`src/hooks/useBookings.ts:37` — `id: booking.providerId?._id` correctly added. Fix is present and accurate.

### BUG-002 ✅ APPROVED
`src/contexts/AuthContext.tsx:44,49,52,56` — `setLoading(false)` moved out of `finally` and into each branch. No `finally` block remains. Race condition resolved.

### BUG-003 ✅ APPROVED
`src/hooks/useBookings.ts:65` — `VITE_API_URL` env var used in `useCreateBooking`. Consistent with every other hook in the file.

### BUG-004 ❌ CHANGE REQUESTED
`src/pages/Dashboard.tsx:65` — Engineer used `React.useEffect(...)` but **there is no `import React from 'react'`** in this file. This will cause a ReferenceError at runtime.

**Required fix**: Use `useEffect` as a named import instead of `React.useEffect`. Add `useEffect` to the react import at the top of the file (or wherever react is first imported). The toast logic and `statsError` destructuring are correct — only the hook call form needs to change.

### BUG-006 ✅ APPROVED
`src/hooks/useDashboard.ts:88` — `(data?.bookings ?? []).map(...)` with `?? ''` null fallbacks. Correct.

### BUG-007 + BUG-013 ✅ APPROVED
`src/pages/Profile.tsx:57-84,129-135` — `onParseError` callback, `failedCount` counter, and toast call site are all correct.

**Decision**: BUG-001, 002, 003, 006, 007, 013 → approved, moving to QA. BUG-004 → change requested, returned to senior-eng-1.

---

## [Tech Lead] Bug Triage & Sprint Assignment
**Date**: 2026-02-20

QA audit reviewed. Bugs triaged and assigned. See `agents/tasks.md` for full task board.

### Assignments

**Senior Engineer 1** — owns frontend critical bugs:
- BUG-001 + BUG-002 (related — both in useBookings.ts, fix together)
- BUG-003 (hardcoded API URL — quick fix)
- BUG-004 (dashboard silent failure — add error state)
- BUG-006 (useUpcomingBookings null crash — defensive coding)
- BUG-007 (profile slot parse error — surface to user via toast)

**Senior Engineer 2** — owns backend + minor frontend bugs:
- BUG-005 (ObjectId type mismatch in Booking model)
- BUG-008 (S3 URL validation before DB write)
- BUG-009 (no_show terminal state guard)
- BUG-010 (dayOfWeek range validation)
- BUG-011, BUG-014 (minor null checks in Dashboard + Services)

### Review Protocol
1. Engineers submit work summaries to their outbox
2. I will review the diff described and approve or request changes
3. Only after Tech Lead approval does QA re-test

### Standards Reminder
- No `any` types — use proper interfaces
- All API calls via `src/services/` or existing hook patterns
- Error states must be surfaced to user via toast (sonner)
- Do not break existing passing tests
