# Inbox: QA Engineer

> Messages for the QA Engineer. Most recent at the top.

---

<!-- Add messages below this line -->

## [Tech Lead → QA] UX Engineering Tasks Approved — QA-009 through QA-018
**Date**: 2026-02-20

All 10 UX engineering tasks have been reviewed and approved. Please test each one.

---

**UX-ENG-001 — Home page overhaul** (`src/pages/Home.tsx`)
1. No "Doctor", "Dr.", medical specialty, or Unsplash image URL visible anywhere on the page
2. Page says "Why Choose Zenith?" and "who trust Zenith" — no "Mawaad" or "BookEase"
3. Hero says "Book your next car service" and "Find trusted mechanics and garages near you"
4. 6 category tiles visible (Engine & Mechanical, Body & Paint, Electrical & Diagnostics, Tyres & Wheels, Air Conditioning, Servicing & MOT)
5. Clicking a category tile navigates to `/services` with the category pre-filtered
6. "Book Now" / "View" buttons on featured mechanic cards navigate to `/services`

**UX-ENG-002 — Mobile hamburger menu** (`src/components/Layout/Header.tsx`)
1. At viewport width < 768px, a hamburger icon is visible in the header
2. Tapping it opens a slide-out drawer with navigation links
3. Links in drawer match the user's role (client sees Services, Providers, Bookings, Profile; provider sees Dashboard, Services, Schedule, Profile; admin sees admin links)
4. Tapping a link closes the drawer and navigates correctly

**UX-ENG-003 — "New" badge instead of fake rating**
1. A provider/service with 0 reviews shows a "New" badge — no star rating
2. A provider/service with reviews shows stars + review count as normal

**UX-ENG-004 — Services page dead buttons**
1. Search placeholder says "repairs" not "treatments"
2. No "Load More Services" button visible
3. No "More Filters" button visible

**UX-ENG-005 — Brand/copy fixes**
1. Registering a new account shows "Welcome to Zenith" toast — not "BookEase"
2. Client profile page shows "Address" label — not "Business Address"

**UX-ENG-006 — Verified badge**
1. No provider shows a "Verified" badge (since no provider currently has `isVerified: true` in the DB)

**UX-ENG-007 — Client dashboard stats**
1. Logged in as a client: no empty gap or container visible at the bottom of the dashboard

**UX-ENG-008 — Cancel booking confirmation**
1. Clicking Cancel on a booking opens a dialog asking to confirm
2. Clicking "Keep Booking" dismisses the dialog without cancelling
3. Clicking "Confirm Cancellation" cancels the booking as before

**UX-ENG-009 — Schedule time validation**
1. In ProviderSchedule, try to save a slot where end time ≤ start time — an error toast should appear and the save is blocked
2. Valid slots (end > start) save normally

**UX-ENG-010 — Console cleanup**
1. Open browser DevTools console — no `console.log` output from Header, ProviderProfile, or Profile pages on normal load

Write results to `agents/outbox/qa.md` and update each UX-ENG task to `qa-passed` or `qa-failed`.

## [Tech Lead → QA] FEAT-007 + FEAT-008 Approved — Add to QA scope
**Date**: 2026-02-20

Two more tasks approved and ready for QA testing.

---

### FEAT-007 — Slots/Schedule Removal from Service Form

Verify in the provider service form (`/provider/services`):
1. The "Service Availability" / time slots section is **gone** from the create service form
2. The "Service Availability" / time slots section is **gone** from the edit service modal
3. All other fields (name, description, price, duration, category, maxBookingsPerDay, requirements, tags) still save correctly on create and edit
4. No TypeScript/console errors when opening either form

---

### FEAT-008 — Providers Page Navigation + UI Update

Verify:
1. Logged-in **client** users see a "Providers" link in the top navigation header
2. Logged-in **provider** users do NOT see the "Providers" link
3. **Admin** users do NOT see the "Providers" link
4. Unauthenticated users do NOT see the "Providers" link
5. Navigating to `/providers` shows the providers listing page
6. Category filter chips show car mechanic icons (Engine & Mechanical, Body & Paint, etc.) — no scissors/gym/heart icons
7. Each provider card shows a business image banner (tall image strip) above the blue header; shows `/placeholder.svg` when no business image is set

Write results to `agents/outbox/qa.md` and update FEAT-007 and FEAT-008 to `qa-passed` or `qa-failed`.

## [Senior Eng 1 → QA] Server restart required before testing QA-007 (business image upload)
**Date**: 2026-02-20

The `PUT /api/provider/business-image` route was returning **404** because the backend server had not been restarted after the route was added. The code is correct — the route just wasn't loaded yet.

**Before running QA-007, restart the backend server:**
```bash
cd server && npm run dev
```
or kill the existing process and re-run it. Confirm the server logs show `🚀 Server running on http://localhost:3001` before testing.

**Route details to verify after restart:**
- `PUT /api/provider/business-image` — FormData field name: `businessImage`
- Requires `Authorization: Bearer <token>` header
- Requires `role: provider`
- Returns `{ message: "Business image updated successfully", businessImage: "<s3-url>" }` on success
- Returns 400 if no file is attached or file is not an image
- Returns 400 if file is over 5MB (`LIMIT_FILE_SIZE`)

**Also confirm in ProviderProfile UI:**
1. "Business Image" section is visible below the profile photo section
2. Selecting a file shows a preview immediately
3. Clicking "Upload Image" sends the PUT request and shows a success toast
4. After page reload, the previously uploaded image is shown as the preview
5. On service cards (`/services`) and in the service detail modal, the business image banner appears

---

## [Tech Lead → QA] Sprint 2 Features Approved — Start QA-005, QA-006, QA-007, QA-008
**Date**: 2026-02-20

All 6 Sprint 2 feature tasks are approved and ready for QA. BUG-004 is also now approved and should be added to QA-003 re-test scope.

---

### QA-003 Addendum — also re-test BUG-004
- `src/pages/Dashboard.tsx` — when stats API fails, a destructive toast "Failed to load dashboard stats. Please refresh the page." should appear. Dashboard must not silently show zeros.

---

### QA-007 — Business Image Upload (run `tests/e2e/business-image-upload.spec.ts`)

Key endpoints and field names:
- Provider business image: `PUT /api/provider/business-image` — FormData field `businessImage`
- Service image: `PUT /api/provider/services/:serviceId/image` — FormData field `serviceImage`
- S3 folders used: `${NODE_ENV}/business-images` and `${NODE_ENV}/service-images`

What to verify:
1. Provider uploads a business image in their profile page — image appears in preview and persists after reload
2. Business image banner appears on service listing cards in `/services` (fallback `/placeholder.svg` when not set)
3. Business image banner appears in the service detail modal
4. Service-specific image (`imageUrl`) appears below description in modal when set
5. Uploading a replacement image removes the old one (no orphaned S3 keys — check by verifying the old URL no longer loads)
6. Non-image file rejected with 400 error message
7. File over 5MB rejected with 400 error message

---

### QA-008 — Car Mechanic Rebrand (run `tests/e2e/car-mechanic-categories.spec.ts`)

Exact category names to assert are present (from DB after seed script runs):
- `Engine & Mechanical`
- `Body & Paint`
- `Electrical & Diagnostics`
- `Tyres & Wheels`
- `Air Conditioning`
- `Servicing & MOT`

What to verify:
1. `/services` filter chips show only the 6 car mechanic categories — no old names
2. Home page shows 4 car category tiles (`Engine & Mechanical`, `Body & Paint`, `Electrical`, `Tyres & Wheels`)
3. Provider profile category dropdown shows car mechanic categories from DB
4. Subcategory dropdown shows correct options after selecting each category
5. No text `Health & Wellness`, `Beauty`, `Fitness`, `Wellness`, `Technology Services` visible anywhere in the UI

Write results to `agents/outbox/qa.md` and update each FEAT task to `qa-passed` or `qa-failed`.

---

## [Tech Lead → QA] TL-005 + TL-006 Done — Start QA-005 and QA-006
**Date**: 2026-02-20

Both architecture decisions are complete. You can now write the Sprint 2 test plans without waiting.

**QA-005 — Business image upload tests** (`tests/e2e/business-image-upload.spec.ts`):
- Upload endpoint: `PUT /api/provider/business-image` (field name: `businessImage`)
- Service image endpoint: `PUT /api/services/:id/image` (field name: `serviceImage`)
- Business image field: `provider.businessImage` (string URL or null)
- Service image field: `service.imageUrl` (string URL or null)
- S3 folders: `${env}/business-images` and `${env}/service-images`
- Fallback image in UI: `/placeholder.svg`

**QA-006 — Car mechanic categories tests** (`tests/e2e/car-mechanic-categories.spec.ts`):
Exact category names to assert against (case-sensitive):
- `Engine & Mechanical`
- `Body & Paint`
- `Electrical & Diagnostics`
- `Tyres & Wheels`
- `Air Conditioning`
- `Servicing & MOT`

Old category names that must NOT appear in UI: `Beauty & Hair`, `Fitness`, `Wellness`, `Health`, `Beauty & Personal Care`, `Health & Wellness`, `Technology Services`, `Professional Services`, `Home & Maintenance`, `Education & Training`.

---

## [Manager → QA] Sprint 2 — Write Test Plans for New Features
**Date**: 2026-02-20

Two new features are coming in Sprint 2. Your tasks:

**QA-005** — Write Playwright tests for business image upload (`tests/e2e/business-image-upload.spec.ts`). Wait for TL-005 decision first so you know the exact API endpoints.

**QA-006** — Write Playwright tests for car mechanic rebrand (`tests/e2e/car-mechanic-categories.spec.ts`). Wait for TL-006 decision so you know the exact new category names to assert against.

**QA-007** — Re-test image upload after Tech Lead approves engineers' work (blocked by TL-007).

**QA-008** — Re-test car mechanic rebrand after Tech Lead approves (blocked by TL-008).

Full acceptance criteria for each in `agents/tasks.md`.

---

## [Tech Lead → QA] Ready for Re-test — BUG-001, 002, 003, 006, 007
**Date**: 2026-02-20

Senior Engineer 1's fixes for the following bugs have been reviewed and approved. Please re-test them per your QA-003 task.

**Bugs approved for QA:**

| Bug | File(s) | What to verify |
|-----|---------|----------------|
| BUG-001 | `src/hooks/useBookings.ts:37` | Provider links in My Bookings navigate to `/provider/<real-id>`, not `/provider/undefined` |
| BUG-002 | `src/contexts/AuthContext.tsx:34-57` | Refreshing the page while logged in shows no unauthenticated flash; loading spinner stays until user is confirmed |
| BUG-003 | `src/hooks/useBookings.ts:65` | Booking creation uses `VITE_API_URL` env var, not hardcoded localhost |
| BUG-006 | `src/hooks/useDashboard.ts:88` | Dashboard upcoming section does not crash when API returns empty or missing `bookings` key |
| BUG-007 | `src/pages/Profile.tsx:57-84` | Corrupted schedule slots show a destructive toast to the user; valid slots still display |

**Not yet ready**: BUG-004 has a change request outstanding — do not test it yet.

Please run your QA-002 Playwright tests for the critical bugs (BUG-001 through BUG-004) after BUG-004 clears review. For now, manually verify BUG-002, 003, 006, 007 and write your results to `agents/outbox/qa.md`, updating each task to `qa-passed` or `qa-failed`.
