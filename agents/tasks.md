# Zenith — Shared Task Board

## Task Statuses
- `pending` — not started
- `in_progress` — being worked on
- `review` — submitted by engineer, awaiting Tech Lead review
- `qa` — approved by Tech Lead, sent to QA
- `qa-passed` — QA approved, ready to ship
- `qa-failed` — QA found issues, sent back to engineer
- `done` — shipped

---

## Sprint 1 — Bug Fix Sprint (2026-02-20)

---

### TECH LEAD TASKS

---

**[TL-001] Triage QA bug report and assign all bugs to engineers**
- **Assigned to**: tech-lead
- **Status**: done
- **Description**: Read `agents/outbox/qa.md`, prioritise all 15 bugs, assign to senior-eng-1 and senior-eng-2, write assignments to their inboxes and to `agents/outbox/tech-lead.md`
- **Acceptance criteria**:
  - [x] All bugs assigned with clear priority order
  - [x] Each engineer has a populated inbox
  - [x] tasks.md updated with full bug list

---

**[TL-002] Review senior-eng-1 fixes and approve for QA**
- **Assigned to**: tech-lead
- **Status**: done
- **Blocked by**: BUG-001, BUG-002, BUG-003, BUG-004, BUG-006, BUG-007
- **Description**: Read `agents/outbox/senior-eng-1.md` when engineer marks work complete. Review the described code changes in `src/hooks/useBookings.ts`, `src/contexts/AuthContext.tsx`, `src/hooks/useDashboard.ts`, `src/pages/Profile.tsx`. Approve or request changes. If approved, update task statuses to `qa` and write to `agents/inbox/qa.md`.
- **Acceptance criteria**:
  - [ ] All assigned bugs reviewed
  - [ ] Code follows TypeScript strict, no `any`, uses service pattern
  - [ ] Either approved for QA or change requests written to senior-eng-1 inbox

---

**[TL-003] Review senior-eng-2 fixes and approve for QA**
- **Assigned to**: tech-lead
- **Status**: pending
- **Blocked by**: BUG-005, BUG-008, BUG-009, BUG-010, BUG-011, BUG-014
- **Description**: Read `agents/outbox/senior-eng-2.md` when engineer marks work complete. Review described changes in `server/models/Booking.js`, `server/routes/provider.js`, `server/routes/bookings.js`, `server/routes/client.js`, `src/pages/Dashboard.tsx`, `src/pages/Services.tsx`. Approve or request changes. If approved, update task statuses to `qa` and write to `agents/inbox/qa.md`.
- **Acceptance criteria**:
  - [ ] All assigned bugs reviewed
  - [ ] Server-side fixes include proper error responses and no regressions
  - [ ] Either approved for QA or change requests written to senior-eng-2 inbox

---

**[TL-004] Final sign-off after QA passes all bugs**
- **Assigned to**: tech-lead
- **Status**: pending
- **Blocked by**: QA-003, QA-004
- **Description**: Read `agents/outbox/qa.md` final re-test results. If all bugs are `qa-passed`, mark sprint complete and update tasks to `done`. If any are `qa-failed`, re-assign to the relevant engineer.
- **Acceptance criteria**:
  - [ ] All critical and major bugs are `qa-passed`
  - [ ] Sprint 1 marked complete in this file

---

### QA TASKS

---

**[QA-001] Full app audit — discover and document all bugs**
- **Assigned to**: qa
- **Status**: done
- **Description**: Manually review all source files across `src/` and `server/`. Document every bug found with file, line, severity, steps to reproduce, expected vs actual. Write full report to `agents/outbox/qa.md` and summary to `agents/inbox/tech-lead.md`.
- **Acceptance criteria**:
  - [x] All pages and components reviewed
  - [x] All API routes reviewed
  - [x] Bug report written with severity ratings
  - [x] Tech Lead inbox notified

---

**[QA-002] Write Playwright test cases for all critical bugs**
- **Assigned to**: qa
- **Status**: pending
- **Description**: For each critical bug (BUG-001 through BUG-004), write a failing Playwright test in `tests/e2e/` that reproduces the bug. These tests should fail now and pass after the engineer's fix.
- **Files to create**:
  - `tests/e2e/provider-navigation.spec.ts` — covers BUG-001
  - `tests/e2e/auth-refresh.spec.ts` — covers BUG-002
  - `tests/e2e/booking-creation.spec.ts` — covers BUG-003
  - `tests/e2e/dashboard-error-state.spec.ts` — covers BUG-004
- **Acceptance criteria**:
  - [ ] Each test file created with at least one test case per bug
  - [ ] Tests run with `npx playwright test`
  - [ ] Tests currently fail (confirming the bug exists)

---

**[QA-003] Re-test senior-eng-1 fixes after Tech Lead approval**
- **Assigned to**: qa
- **Status**: pending
- **Blocked by**: TL-002
- **Description**: After Tech Lead approves senior-eng-1's fixes, re-test BUG-001, 002, 003, 004, 006, 007. Run the Playwright tests written in QA-002. Manually verify each acceptance criterion. Write results to `agents/outbox/qa.md` and update task statuses to `qa-passed` or `qa-failed`.
- **Acceptance criteria**:
  - [ ] All 6 bugs manually tested against acceptance criteria
  - [ ] Playwright tests for critical bugs pass
  - [ ] Results written to outbox with pass/fail per bug

---

**[QA-004] Re-test senior-eng-2 fixes after Tech Lead approval**
- **Assigned to**: qa
- **Status**: pending
- **Blocked by**: TL-003
- **Description**: After Tech Lead approves senior-eng-2's fixes, re-test BUG-005, 008, 009, 010, 011, 014. Test server-side fixes using API calls (curl or Playwright). Write results to `agents/outbox/qa.md` and update task statuses.
- **Acceptance criteria**:
  - [ ] All 6 bugs tested against acceptance criteria
  - [ ] Server routes tested with valid and invalid inputs
  - [ ] Results written to outbox with pass/fail per bug

---

### CRITICAL

---

**[BUG-001] Broken provider navigation links go to /provider/undefined**
- **Assigned to**: senior-eng-1
- **Status**: qa
- **Severity**: critical
- **Files**: `src/hooks/useBookings.ts:36-40`, `src/pages/MyBookings.tsx:217`
- **Description**: The `useBookings` hook maps the provider object but omits the `id` field. Every provider link navigates to `/provider/undefined`.
- **Fix**: Add `id: booking.providerId?._id` to the provider mapping in `useBookings.ts`
- **Acceptance criteria**:
  - [ ] Clicking a provider name in My Bookings navigates to the correct `/provider/<id>` route
  - [ ] No TypeScript errors
  - [ ] Existing booking data still displays correctly

---

**[BUG-002] Auth race condition — loading=false before user is set**
- **Assigned to**: senior-eng-1
- **Status**: qa
- **Severity**: critical
- **File**: `src/contexts/AuthContext.tsx:34-58`
- **Description**: `setLoading(false)` is called in the `finally` block before the async `setUser()` resolves, causing a flash of unauthenticated UI on page refresh.
- **Fix**: Move `setLoading(false)` to after `setUser()` inside the try block, not in finally
- **Acceptance criteria**:
  - [ ] Refreshing the page while logged in shows no unauthenticated flash
  - [ ] Loading spinner shows until user is confirmed
  - [ ] Unauthenticated users still redirected correctly

---

**[BUG-003] Hardcoded localhost API URL in useCreateBooking**
- **Assigned to**: senior-eng-1
- **Status**: qa
- **Severity**: critical
- **File**: `src/hooks/useBookings.ts:64`
- **Description**: `useCreateBooking` hardcodes `http://localhost:3001/api/bookings` instead of using `VITE_API_URL`. Booking creation will fail in any non-localhost environment.
- **Fix**: Replace with `const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'`
- **Acceptance criteria**:
  - [ ] Booking API call uses `VITE_API_URL` when set
  - [ ] Falls back to `localhost:3001` when env var is absent
  - [ ] Consistent with pattern used in other hooks in the same file

---

**[BUG-004] Dashboard stats fail silently — no error shown to user**
- **Assigned to**: senior-eng-1
- **Status**: qa
- **Severity**: critical
- **Files**: `src/hooks/useDashboard.ts:64-78`, `src/pages/Dashboard.tsx:63`
- **Description**: When the stats API call fails, the error is swallowed. The dashboard shows zeros with no indication data failed to load.
- **Fix**: Expose `isError` from `useDashboardStats`; show error message/toast in `Dashboard.tsx`
- **Acceptance criteria**:
  - [ ] Error state is visible to the user when stats fail to load
  - [ ] Dashboard does not silently show zeros on API failure
  - [ ] No regression on successful data load

---

### MAJOR

---

**[BUG-005] ObjectId type mismatch causes empty booking query results**
- **Assigned to**: senior-eng-2
- **Status**: pending
- **Severity**: major
- **File**: `server/models/Booking.js:139-167`
- **Description**: `getUpcomingForClient` keeps the `clientId` as a string. MongoDB ObjectId comparison may silently return empty results even when bookings exist.
- **Fix**: Cast to ObjectId when valid: `new mongoose.Types.ObjectId(clientId)`
- **Acceptance criteria**:
  - [ ] Upcoming bookings return correctly for all valid client IDs
  - [ ] No crash when an invalid ID is passed
  - [ ] Existing tests still pass

---

**[BUG-006] useUpcomingBookings crashes when data.bookings is undefined**
- **Assigned to**: senior-eng-1
- **Status**: qa
- **Severity**: major
- **File**: `src/hooks/useDashboard.ts:105-113`
- **Description**: `data.bookings.map(...)` throws a TypeError if `data.bookings` is undefined (e.g. on API error). Populated refs like `clientId?.fullName` also render blank silently.
- **Fix**: Use `(data?.bookings ?? []).map(...)` and add null fallbacks
- **Acceptance criteria**:
  - [ ] No crash when API returns error or missing `bookings` key
  - [ ] Renders empty state gracefully

---

**[BUG-007] Corrupted schedule slots silently dropped in Profile.tsx**
- **Assigned to**: senior-eng-1
- **Status**: qa
- **Severity**: major
- **File**: `src/pages/Profile.tsx:65-75`
- **Description**: If a slot string fails JSON.parse, it is silently dropped with only a `console.warn`. The user has no idea their schedule is incomplete.
- **Fix**: Track failed parses and show a toast after the forEach if any failed
- **Acceptance criteria**:
  - [ ] User sees a toast warning if any slots could not be loaded
  - [ ] Successful slots still display correctly

---

**[BUG-008] S3 upload URL not validated before DB write**
- **Assigned to**: senior-eng-2
- **Status**: pending
- **Severity**: major
- **File**: `server/routes/provider.js:102-109`
- **Description**: If `req.s3Upload` exists but its `url` property is undefined, the value `undefined` is stored in the database as the profile photo URL.
- **Fix**: Guard with `if (req.s3Upload && !req.s3Upload.url) return res.status(500).json({error: 'Upload failed'})`
- **Acceptance criteria**:
  - [ ] API returns 500 if S3 upload object is missing URL
  - [ ] `undefined` is never written to DB as a photo URL

---

**[BUG-009] no_show booking status is not treated as terminal**
- **Assigned to**: senior-eng-2
- **Status**: pending
- **Severity**: major
- **File**: `server/routes/bookings.js:436-438`
- **Description**: The terminal state guard only checks for `completed` and `cancelled`. Bookings with status `no_show` can still be updated.
- **Fix**: Add `booking.status === 'no_show'` to the terminal state condition
- **Acceptance criteria**:
  - [ ] PATCH request on a `no_show` booking returns 400
  - [ ] `completed` and `cancelled` guards still work

---

**[BUG-010] dayOfWeek accepts invalid values (outside 0-6)**
- **Assigned to**: senior-eng-2
- **Status**: pending
- **Severity**: major
- **File**: `server/routes/client.js:173-176`
- **Description**: A slot with `dayOfWeek: 8` or `-1` passes validation and gets stored. This is invalid and will cause undefined behaviour in schedule rendering.
- **Fix**: Add `if (parsed.dayOfWeek < 0 || parsed.dayOfWeek > 6) return res.status(400).json({error: 'Invalid dayOfWeek'})`
- **Acceptance criteria**:
  - [ ] dayOfWeek values outside 0-6 return 400
  - [ ] Valid values (0-6) still accepted

---

### MINOR (next sprint)

---

**[BUG-011] Dashboard monthlyGrowth fallback object missing shape**
- **Assigned to**: senior-eng-2
- **Status**: pending
- **Severity**: minor
- **File**: `src/hooks/useDashboard.ts`, `src/pages/Dashboard.tsx:261-266`
- **Description**: The fallback stats object may not include `monthlyGrowth`, making optional chaining unreliable as a safety net.
- **Fix**: Ensure fallback includes `monthlyGrowth: { revenue: 0, bookings: 0 }`

---

**[BUG-012] Inconsistent booking status naming (no_show vs noShow)**
- **Assigned to**: senior-eng-2
- **Status**: pending
- **Severity**: minor
- **Files**: `server/routes/bookings.js`, `src/pages/MyBookings.tsx`
- **Description**: Audit and standardise status naming — confirm `no_show` is used consistently everywhere.

---

**[BUG-013] Profile slot parse error — no UI feedback (duplicate of BUG-007 UX)**
- **Assigned to**: senior-eng-1
- **Status**: qa
- **Severity**: minor
- **Note**: Covered by BUG-007 fix — closed.

---

**[BUG-014] Service._id not validated before booking modal opens**
- **Assigned to**: senior-eng-2
- **Status**: pending
- **Severity**: minor
- **File**: `src/pages/Services.tsx:238-240`
- **Description**: `handleBookNow(service)` does not check that `service._id` exists before opening the modal.
- **Fix**: Add early return with toast if `!service._id`

---

**[BUG-015] provider.js middleware chain has no explicit next() guard**
- **Assigned to**: senior-eng-2
- **Status**: pending
- **Severity**: minor
- **File**: `server/routes/provider.js:33-39`
- **Description**: If `requireRole` calls `next(err)`, the route handler may still execute depending on error middleware ordering. Low risk but worth hardening.

---

## Completed

<!-- Move tasks here when status reaches `done` -->

---

---

## Sprint 2 — Feature Sprint (2026-02-20)

### Features
1. **FEAT-IMG** — Add business image to provider profile and service listings
2. **FEAT-CAR** — Rebrand app to car mechanic / car repair / car body shop only

---

### UX DESIGNER TASKS

---

**[UX-001] Full UI audit — identify UX issues across all screens**
- **Assigned to**: senior-ux-designer
- **Status**: done
- **Description**: Read and review all pages in `src/pages/` and key components in `src/components/`. For each screen, document UX problems: poor visual hierarchy, missing feedback states, confusing interactions, accessibility issues, mobile layout problems. Write findings to `agents/outbox/ux-designer.md` in a prioritised list. Notify Tech Lead when done.
- **Pages to review**: `Home.tsx`, `Services.tsx`, `Providers.tsx`, `MyBookings.tsx`, `Profile.tsx`, `Dashboard.tsx`, `Register.tsx`, `Login.tsx`, `provider/ProviderProfile.tsx`, `provider/ProviderServices.tsx`, `provider/ProviderSchedule.tsx`
- **Acceptance criteria**:
  - [ ] All listed pages reviewed
  - [ ] UX issues documented with page, description, and severity (critical / major / minor)
  - [ ] Findings written to `agents/outbox/ux-designer.md`
  - [ ] Tech Lead notified via `agents/inbox/tech-lead.md`

---

**[UX-002] Design spec — business image on service cards and detail modal**
- **Assigned to**: senior-ux-designer
- **Status**: done
- **Blocked by**: UX-001
- **Description**: FEAT-004 adds a business image banner to service cards (`src/pages/Services.tsx`) and the service detail modal (`src/components/modals/ServiceDetailModal.tsx`). Review the implementation once FEAT-004 is in `review` status. Check: image dimensions, aspect ratio, placeholder appearance, mobile layout at 375px, text readability over the image, and whether the service-specific image in the modal has a clear visual hierarchy. Write an approval or a list of specific change requests to `agents/outbox/ux-designer.md`. Notify Senior Engineer 1.
- **Acceptance criteria**:
  - [ ] Service card image banner reviewed (height, fit, fallback placeholder)
  - [ ] Modal header image reviewed (height, fit, overlay legibility)
  - [ ] Service-specific image placement in modal reviewed
  - [ ] Mobile 375px layout checked
  - [ ] Verdict written: approved or changes needed with exact Tailwind class fixes

---

**[UX-003] Design spec — car mechanic rebrand: home page + service filters + provider profile**
- **Assigned to**: senior-ux-designer
- **Status**: done
- **Blocked by**: UX-001
- **Description**: Review FEAT-005 implementation once it is in `review` status. Check: (1) Home page category tiles — do icons, labels, and card layout convey a car mechanic context clearly? (2) Service filter chips — are the 6 car category labels readable and scannable? (3) Provider profile — does the category/subcategory dropdown section feel appropriate for a car business? Write specific change requests or approval to `agents/outbox/ux-designer.md`.
- **Acceptance criteria**:
  - [ ] Home page category tiles reviewed
  - [ ] Service filter chips reviewed
  - [ ] Provider profile category section reviewed
  - [ ] Any icon or copy changes specified with exact values
  - [ ] Verdict written: approved or changes needed

---

**[UX-004] Design spec — provider profile business image upload UI**
- **Assigned to**: senior-ux-designer
- **Status**: done
- **Blocked by**: UX-001
- **Description**: Review FEAT-003 implementation once it is in `review` status. The business image upload section was added to `src/pages/provider/ProviderProfile.tsx`. Check: (1) Is the section clearly labelled and visually distinct from the profile photo upload? (2) Is the image preview the right size? (3) Is the upload button placement intuitive? (4) Are success/error states visible? Write approval or change requests to `agents/outbox/ux-designer.md`.
- **Acceptance criteria**:
  - [ ] Upload section label and layout reviewed
  - [ ] Preview dimensions and appearance reviewed
  - [ ] Upload button placement and copy reviewed
  - [ ] Success and error feedback reviewed
  - [ ] Verdict written: approved or changes needed

---

**[UX-005] Design spec — tech lead to review and action UX findings from UX-001**
- **Assigned to**: tech-lead
- **Status**: done
- **Blocked by**: UX-001
- **Description**: After UX-001 audit is complete, read `agents/outbox/ux-designer.md` and triage the UX findings. Create new tasks in `agents/tasks.md` for any issues that need engineering work. Assign to Senior Eng 1 (frontend) as appropriate.
- **Acceptance criteria**:
  - [x] UX-001 findings read and triaged
  - [x] New engineering tasks created for critical and major UX issues
  - [x] UX designer notified of which issues will be actioned

---

### UX ENGINEERING TASKS

---

**[UX-ENG-001] Frontend: Home page overhaul — fake content, branding, hero copy, category tiles**
- **Assigned to**: senior-eng-1
- **Status**: qa
- **Covers**: UX-C01, UX-C02, UX-C04, UX-C05, UX-M08, UX-N09
- **File**: `src/pages/Home.tsx`
- **What to fix**:
  1. **(UX-C01)** Remove the hardcoded "Top-Rated Doctors" section (Dr. Sarah Johnson, Dr. Michael Chen, Dr. Emily Rodriguez — Unsplash photos, fake data). Replace the section title with "Featured Garages" or "Top-Rated Mechanics". Replace the three hardcoded provider cards with car mechanic placeholder data (e.g. "Mike's Auto Repair — Engine & Mechanical", "City Body Shop — Body & Paint", "QuickFit Tyres — Tyres & Wheels") or fetch real featured providers from the API.
  2. **(UX-C02)** Fix brand name inconsistency — the page currently says "Why Choose Mawaad?" (line 115) and "who trust BookEase" (line 184). Change both to **"Zenith"**.
  3. **(UX-C04)** Add all **6** car mechanic categories to the Home tiles (currently only 4). Make each tile a `<Link>` to `/services?category=<name>` so clicking a category navigates to the Services page pre-filtered. The Services page already reads the `category` filter from state — wire up the query param so the URL pre-selects it.
  4. **(UX-C05)** Update hero copy: change "Book your next appointment" → "Book your next car service"; "Find and book with top-rated providers near you" → "Find trusted mechanics and garages near you"; "Join as Provider" → "Join as a Mechanic".
  5. **(UX-M08)** "Book Now" buttons on the provider cards (even placeholder ones) must link to `/services` rather than doing nothing.
  6. **(UX-N09)** Remove external Unsplash image URLs — do not hotlink third-party images. Use `/placeholder.svg` or local assets instead.
- **Acceptance criteria**:
  - [ ] No doctor names, medical specialties, or Unsplash image URLs anywhere on the page
  - [ ] "Zenith" used consistently — no "Mawaad" or "BookEase"
  - [ ] Hero copy is car-specific
  - [ ] Home shows all 6 car mechanic category tiles
  - [ ] Each category tile navigates to `/services` with correct category filter
  - [ ] "Book Now" / "View" buttons on provider cards navigate somewhere (at minimum `/services`)
  - [ ] No TypeScript errors

---

**[UX-ENG-002] Frontend: Mobile navigation — add hamburger menu to Header**
- **Assigned to**: senior-eng-1
- **Status**: qa
- **Covers**: UX-C03
- **File**: `src/components/Layout/Header.tsx`
- **What to fix**: The nav links are inside a `hidden md:flex` container — on mobile there is no way to navigate. Add a hamburger icon button (`md:hidden`) that toggles a mobile nav drawer or sheet. The drawer should contain the same links as the desktop nav, respecting role (client vs provider vs admin). Use the shadcn `Sheet` component (already used in `Providers.tsx`) for the drawer.
- **Acceptance criteria**:
  - [ ] Hamburger icon visible on screens below 768px (md breakpoint)
  - [ ] Clicking hamburger opens a nav drawer with all relevant links
  - [ ] Drawer links respect user role (same logic as desktop nav)
  - [ ] Closing the drawer works (click outside or close button)
  - [ ] No TypeScript errors

---

**[UX-ENG-003] Frontend: Fix fake 4.8 star rating — show "New" badge when no reviews**
- **Assigned to**: senior-eng-1
- **Status**: qa
- **Covers**: UX-C06
- **Files**: `src/pages/Services.tsx` (~line 237), `src/pages/Providers.tsx` (~line 395)
- **What to fix**: `service.providerId?.averageRating || 4.8` and similar patterns show a fake 4.8 for providers with zero reviews. Change the logic: if `averageRating` is 0 or null **and** `totalReviews` is 0, render a `<Badge>New</Badge>` (or a "New" text label) instead of stars. Only show the star rating and review count when `totalReviews > 0`.
- **Acceptance criteria**:
  - [ ] Providers with 0 reviews show "New" instead of a star rating
  - [ ] Providers with actual reviews still show stars + count correctly
  - [ ] Change applied in both Services.tsx and Providers.tsx
  - [ ] No TypeScript errors

---

**[UX-ENG-004] Frontend: Remove dead buttons and fix search placeholder in Services page**
- **Assigned to**: senior-eng-1
- **Status**: qa
- **Covers**: UX-M01, UX-M02, UX-M03
- **File**: `src/pages/Services.tsx`
- **What to fix**:
  1. **(UX-M01)** Search input placeholder says "Search services, providers, or treatments..." — change "treatments" to "repairs": `"Search services, providers, or repairs..."`
  2. **(UX-M02)** Remove the "Load More Services" button entirely (it has no handler and does nothing). If pagination is needed in future it will be a separate task.
  3. **(UX-M03)** Remove the "More Filters" button or connect it to the existing filter UI. The simplest fix is removal — Providers.tsx's advanced filter sheet is the pattern to follow if it gets implemented later.
- **Acceptance criteria**:
  - [ ] Search placeholder says "repairs" not "treatments"
  - [ ] No "Load More" button visible
  - [ ] No dead "More Filters" button visible
  - [ ] No TypeScript errors

---

**[UX-ENG-005] Frontend: Brand/copy fixes — Register toast and Profile address label**
- **Assigned to**: senior-eng-1
- **Status**: qa
- **Covers**: UX-M09, UX-M04
- **Files**: `src/pages/Register.tsx` (~line 86), `src/pages/Profile.tsx` (~line 399)
- **What to fix**:
  1. **(UX-M09)** Registration success toast says "Welcome to BookEase!" — change to "Welcome to Zenith!"
  2. **(UX-M04)** Client profile address field is labelled "Business Address" — change to "Address"
- **Acceptance criteria**:
  - [ ] Register success toast says "Welcome to Zenith!"
  - [ ] Client profile address label says "Address" not "Business Address"
  - [ ] No TypeScript errors

---

**[UX-ENG-006] Frontend: Gate "Verified" badge on actual provider verification status**
- **Assigned to**: senior-eng-1
- **Status**: qa
- **Covers**: UX-M06
- **Files**: `src/pages/Providers.tsx` (~line 426), `src/pages/ProviderDetail.tsx` (~line 164)
- **What to fix**: The "Verified" badge is rendered unconditionally for every provider. Change to only render it when `provider.isVerified === true`. If the `isVerified` field is not yet on the provider type/model, add `isVerified?: boolean` to the frontend type — the badge simply won't show until the backend adds the field.
- **Acceptance criteria**:
  - [ ] "Verified" badge only visible for providers where `isVerified === true`
  - [ ] Providers without verified status show no badge (no placeholder, no "Unverified" text)
  - [ ] Change applied in both Providers.tsx and ProviderDetail.tsx
  - [ ] No TypeScript errors

---

**[UX-ENG-007] Frontend: Fix empty stats section on client Dashboard**
- **Assigned to**: senior-eng-1
- **Status**: qa
- **Covers**: UX-M05
- **File**: `src/pages/Dashboard.tsx` (~lines 250-254)
- **What to fix**: The stats grid section renders an empty container for client users (no stat cards, just a `max-w-md mx-auto` div). Either: (a) add 2–3 client-relevant stat cards (e.g. total bookings made, upcoming appointments count), or (b) remove the stats section entirely for client users. Option (b) is simpler and acceptable.
- **Acceptance criteria**:
  - [ ] Client dashboard shows no empty gap/container where stats would be
  - [ ] Provider dashboard stats are unaffected
  - [ ] No TypeScript errors

---

**[UX-ENG-008] Frontend: Add confirmation dialog before cancelling a booking**
- **Assigned to**: senior-eng-1
- **Status**: qa
- **Covers**: UX-M13
- **File**: `src/pages/MyBookings.tsx`
- **What to fix**: The cancel button immediately fires the cancel action with no confirmation. Wrap in an `AlertDialog` (shadcn component — already available in the project) with "Are you sure you want to cancel this booking?" and Cancel / Confirm Cancellation buttons. Only call the cancel API on confirmation.
- **Acceptance criteria**:
  - [ ] Clicking Cancel opens an AlertDialog confirmation
  - [ ] Confirming in the dialog cancels the booking as before
  - [ ] Dismissing the dialog does nothing
  - [ ] No TypeScript errors

---

**[UX-ENG-009] Frontend: Add time validation to ProviderSchedule (end time must be after start)**
- **Assigned to**: senior-eng-1
- **Status**: qa
- **Covers**: UX-M12
- **File**: `src/pages/provider/ProviderSchedule.tsx`
- **What to fix**: There is no validation that end time is after start time. Add validation on save: if `endTime <= startTime` for any slot, show an inline error message or a toast and block submission. Validation on blur is also acceptable.
- **Acceptance criteria**:
  - [ ] Saving a slot where end time ≤ start time shows an error and blocks save
  - [ ] Valid slots save as before
  - [ ] No TypeScript errors

---

**[UX-ENG-010] Frontend: Code cleanup — remove console.logs and debug comments**
- **Assigned to**: senior-eng-1
- **Status**: qa
- **Covers**: UX-N01, UX-N02
- **Files**: `src/components/Layout/Header.tsx` (line 19), `src/pages/provider/ProviderProfile.tsx` (lines 59-65, 96-97, 103-121, 139, 253-275), `src/pages/Profile.tsx` (line 191)
- **What to fix**:
  1. Remove all `console.log(...)` statements from Header.tsx and ProviderProfile.tsx
  2. Remove the debug comment `//88888888` from Profile.tsx line 191
- **Acceptance criteria**:
  - [ ] No `console.log` in Header.tsx, ProviderProfile.tsx, or Profile.tsx
  - [ ] Debug comment removed from Profile.tsx
  - [ ] No TypeScript errors

---

### TECH LEAD TASKS

---

**[TL-005] Architecture review — business image upload**
- **Assigned to**: tech-lead
- **Status**: done
- **Description**: Review the proposed approach for adding business images before engineers start. The S3 service already exists (`server/services/s3Service.js`). Decide and document in `agents/outbox/tech-lead.md`:
  1. Should a business image be a new field on `ServiceProvider` (separate from `profilePhoto`) or reuse `profilePhoto`?
  2. Should `Service` model get its own `imageUrl` field, or should service listings just display the provider's business image?
  3. What S3 folder path should business images go into? (e.g. `${environment}/business-images`)
  4. Should the upload middleware in `server/middleware/upload.js` be extended with a new `uploadBusinessImage` export, or is a separate file better?
- **Acceptance criteria**:
  - [ ] Decision written to `agents/outbox/tech-lead.md`
  - [ ] Engineers unblocked with clear direction
  - [ ] Approach is consistent with existing S3 + multer pattern

---

**[TL-006] Architecture review — car mechanic rebrand**
- **Assigned to**: tech-lead
- **Status**: done
- **Description**: Define exactly what "car mechanic only" means for the codebase. Review `src/pages/Services.tsx:68-85` (6 hardcoded category filters), `src/pages/Home.tsx:21-26` (4 hardcoded category icons), `src/pages/provider/ProviderProfile.tsx:417-505` (category/specialization selectors). Document decisions:
  1. What are the new category names? (e.g. "Engine & Mechanical", "Body & Paint", "Electrical", "Tyres & Wheels", "Diagnostics & MOT")
  2. What subcategories/specializations go under each?
  3. Should there be a DB seed script update, or is it frontend-only?
  4. What UI copy and icons change? (The Health & Wellness special-case logic at line 445 must be replaced)
- **Acceptance criteria**:
  - [ ] New category list and subcategories defined
  - [ ] Decision on DB seed update documented
  - [ ] Engineers unblocked with exact values to use

---

**[TL-007] Review FEAT-IMG implementation (senior-eng-1 + senior-eng-2)**
- **Assigned to**: tech-lead
- **Status**: done
- **Blocked by**: FEAT-001, FEAT-002, FEAT-003, FEAT-004
- **Description**: After both engineers submit their image feature work, review:
  - Backend: new model fields, upload middleware, routes
  - Frontend: upload UI in ProviderProfile, display in Services.tsx and ServiceDetailModal
  - Confirm no `any` types, S3 URL stored correctly, old image deleted on replace
- **Acceptance criteria**:
  - [ ] Backend model and route changes reviewed
  - [ ] Frontend image upload and display reviewed
  - [ ] Approved for QA or change requests sent

---

**[TL-008] Review FEAT-CAR rebrand (senior-eng-1 + senior-eng-2)**
- **Assigned to**: tech-lead
- **Status**: done
- **Blocked by**: FEAT-005, FEAT-006
- **Description**: Review all category-related changes. Confirm new car mechanic categories appear correctly in dropdowns, filters, and home page. Confirm Health & Wellness special-case logic is fully removed.
- **Acceptance criteria**:
  - [ ] Category values in frontend match agreed list from TL-006
  - [ ] No references to old categories remain
  - [ ] Seed script updated if needed
  - [ ] Approved for QA or change requests sent

---

**[TL-009] Final sign-off Sprint 2**
- **Assigned to**: tech-lead
- **Status**: pending
- **Blocked by**: QA-005, QA-006
- **Description**: Read QA re-test results for all Sprint 2 features. Mark sprint complete if all pass.
- **Acceptance criteria**:
  - [ ] All FEAT tasks are `qa-passed`
  - [ ] Sprint 2 marked complete

---

### QA TASKS

---

**[QA-005] Write test plan for business image upload feature**
- **Assigned to**: qa
- **Status**: pending
- **Description**: Once Tech Lead confirms the image upload approach, write a Playwright test file at `tests/e2e/business-image-upload.spec.ts` covering:
  - Provider can upload a business image in their profile
  - Business image appears on the service listing card
  - Business image appears in the service detail modal
  - Uploading a new image replaces the old one (no broken image links)
  - Non-image file upload is rejected with an error message
  - Image over size limit is rejected with an error message
- **Acceptance criteria**:
  - [ ] Test file created at `tests/e2e/business-image-upload.spec.ts`
  - [ ] All 6 scenarios covered
  - [ ] Tests run with `npx playwright test`

---

**[QA-006] Write test plan for car mechanic rebrand**
- **Assigned to**: qa
- **Status**: pending
- **Description**: Write a Playwright test file at `tests/e2e/car-mechanic-categories.spec.ts` covering:
  - Service filter page shows only car mechanic categories (no Beauty, Health, etc.)
  - Home page shows car-specific category tiles
  - Provider profile category dropdown shows only car mechanic categories
  - Provider profile subcategory dropdown shows correct car-specific options per category
  - No old generic category text appears anywhere on the visible UI
- **Acceptance criteria**:
  - [ ] Test file created at `tests/e2e/car-mechanic-categories.spec.ts`
  - [ ] All 5 scenarios covered

---

**[QA-007] Re-test business image upload after Tech Lead approval**
- **Assigned to**: qa
- **Status**: pending
- **Blocked by**: TL-007
- **Description**: After Tech Lead approves image feature, run `tests/e2e/business-image-upload.spec.ts` and manually verify:
  - Image uploads to S3 successfully (check provider profile shows new image)
  - Service listing cards display the business image
  - Service detail modal displays the business image
  - Old image removed from S3 when replaced
  - Write results to `agents/outbox/qa.md`
- **Acceptance criteria**:
  - [ ] All Playwright tests pass
  - [ ] Manual checks completed
  - [ ] Results written to outbox, each FEAT task updated to `qa-passed` or `qa-failed`

---

**[QA-008] Re-test car mechanic rebrand after Tech Lead approval**
- **Assigned to**: qa
- **Status**: pending
- **Blocked by**: TL-008
- **Description**: After Tech Lead approves rebrand changes, run `tests/e2e/car-mechanic-categories.spec.ts` and manually verify the full app UI shows no traces of old categories. Write results to `agents/outbox/qa.md`.
- **Acceptance criteria**:
  - [ ] All Playwright tests pass
  - [ ] No old category names visible anywhere in the UI
  - [ ] Results written to outbox

---

### FEATURE TASKS — FEAT-IMG (Business Image Upload)

---

**[FEAT-001] Backend: Add businessImage field to ServiceProvider model + upload route**
- **Assigned to**: senior-eng-1
- **Status**: qa
- **Description**:
  1. Add `businessImage: { type: String, default: null }` field to `server/models/ServiceProvider.js` (alongside existing `profilePhoto` field)
  2. In `server/middleware/upload.js`, add a new export `uploadBusinessImage` — same multer config as `uploadProfilePhoto` but with destination key `business-images`
  3. In `server/routes/provider.js`, add `PUT /business-image` route using `[authenticateToken, requireRole(['provider']), uploadBusinessImage, uploadToS3, handleUploadError]`. Store `req.s3Upload.url` to `provider.businessImage`. Delete old image from S3 if one exists (same pattern as profile photo at lines 112-118).
  4. Expose `businessImage` in the GET `/profile` response so frontend can read it
- **Files to change**:
  - `server/models/ServiceProvider.js`
  - `server/middleware/upload.js`
  - `server/routes/provider.js`
- **Acceptance criteria**:
  - [ ] `PUT /api/provider/business-image` accepts an image file and returns the new S3 URL
  - [ ] `businessImage` field persisted to DB
  - [ ] Old business image deleted from S3 on replace
  - [ ] `GET /api/provider/profile` includes `businessImage` in response
  - [ ] Non-image or oversized files rejected with 400

---

**[FEAT-002] Backend: Add imageUrl field to Service model + upload route**
- **Assigned to**: senior-eng-1
- **Status**: qa
- **Description**:
  1. Add `imageUrl: { type: String, default: null }` to `server/models/Service.js`
  2. In `server/middleware/upload.js`, add `uploadServiceImage` export with S3 folder `service-images`
  3. Add `PUT /api/services/:id/image` route in `server/routes/` (check ownership — only the provider who owns the service can upload). Store S3 URL to `service.imageUrl`. Delete old image on replace.
  4. Include `imageUrl` in all service GET responses
- **Files to change**:
  - `server/models/Service.js`
  - `server/middleware/upload.js`
  - `server/routes/services.js` (or wherever service routes live)
- **Acceptance criteria**:
  - [ ] `PUT /api/services/:id/image` stores image and returns S3 URL
  - [ ] Only the owning provider can upload (401/403 otherwise)
  - [ ] `imageUrl` included in service list and detail responses
  - [ ] Old image deleted from S3 on replace

---

**[FEAT-003] Frontend: Business image upload UI in ProviderProfile**
- **Assigned to**: senior-eng-1
- **Status**: qa
- **Blocked by**: FEAT-001
- **Description**: In `src/pages/provider/ProviderProfile.tsx`, add a "Business Image" upload section below the existing profile photo upload. Use the same pattern as the current `handlePhotoChange` (lines 155-187) but call `PUT /api/provider/business-image`. Show a preview of the current `businessImage` from the provider profile data. Show upload progress and success/error toast.
- **Files to change**:
  - `src/pages/provider/ProviderProfile.tsx`
  - `src/services/providerService.ts` (or equivalent) — add `uploadBusinessImage(file: File)` function
- **Acceptance criteria**:
  - [ ] Business image upload button and preview visible in provider profile
  - [ ] Upload calls the correct API endpoint
  - [ ] Success toast on upload, error toast on failure
  - [ ] Current business image shown as preview if one exists
  - [ ] No TypeScript errors

---

**[FEAT-004] Frontend: Display business image on service cards and detail modal**
- **Assigned to**: senior-eng-1
- **Status**: qa
- **Blocked by**: FEAT-003
- **Description**:
  1. In `src/pages/Services.tsx` (lines 172-246), update the service card to show `service.businessImage` (from the provider) as a banner/header image above the card content. If no business image, show a placeholder (use `/placeholder.svg` from public/).
  2. In `src/components/modals/ServiceDetailModal.tsx` (lines 50-122), display the business image as a header banner in the modal. If no image, show a styled placeholder.
  3. Also display `service.imageUrl` (the service-specific image) if present — show it in a secondary position in the modal below the business image.
- **Files to change**:
  - `src/pages/Services.tsx`
  - `src/components/modals/ServiceDetailModal.tsx`
- **Acceptance criteria**:
  - [ ] Service cards show business image as banner
  - [ ] Placeholder shown when no image set
  - [ ] Detail modal shows business image header
  - [ ] Service-specific image shown in modal if set
  - [ ] No layout breakage on mobile (375px)

---

### FEATURE TASKS — FEAT-MISC

---

**[FEAT-007] Frontend: Remove slots/schedule section from the service form**
- **Assigned to**: senior-eng-1
- **Status**: qa
- **File**: `src/pages/provider/ProviderServices.tsx`
- **Description**: The service create and edit forms contain a full "Time Slots" / schedule section that lets providers define per-service availability windows. This is redundant with the provider-level schedule and should be removed from the UI entirely. The `slots` field on the backend `Service` model does not need to change — only the frontend form and related code should be cleaned up.
- **What to remove**:
  1. `ServiceSlots` interface (lines ~44-48)
  2. `parseServiceSlotsToServiceSlots` helper function (lines ~49-68)
  3. `convertServiceSlotsToArray` helper function (lines ~70-80)
  4. `useProviderSchedule` import and its usage (`providerSchedule` data, `availableDays` memo — lines ~88, 112-121)
  5. `slots` field from `formData` state and its type definition (line ~107, `192`)
  6. `addTimeSlot`, `removeTimeSlot`, `updateTimeSlot` handlers (lines ~123-155)
  7. `slots` reset in `resetForm` (line ~172)
  8. Slots parsing in `handleAIServiceGenerated` (lines ~211-227)
  9. Slots validation block in form submit (lines ~275-287)
  10. `slots: convertServiceSlotsToArray(formData.slots)` from the create and update API payloads (lines ~313, 351)
  11. Slots parsing when opening the edit form (line ~382)
  12. The entire time slots UI section in the **create form** (lines ~597-647)
  13. The entire time slots UI section in the **edit/modal form** (lines ~930-980)
  14. `Schedule` icon import from `@mui/icons-material` if it is only used in the removed sections (check line 23 — verify no other usage before removing)
- **Acceptance criteria**:
  - [ ] No slots/schedule section visible in the service create form
  - [ ] No slots/schedule section visible in the service edit form/modal
  - [ ] No TypeScript errors (`tsc --noEmit` passes)
  - [ ] No unused imports remain (`useProviderSchedule`, `ServiceSlots`, helper functions)
  - [ ] Service create and edit still work correctly (name, description, category, price, duration, maxBookingsPerDay, requirements, tags all still save)
  - [ ] No references to `slots` remain in the component state, handlers, or payloads
- **Notes**: Do not touch `server/models/Service.js` or any API routes — backend `slots` field stays. This is UI cleanup only.

---

### FEATURE TASKS — FEAT-CAR (Car Mechanic Rebrand)

---

**[FEAT-005] Frontend: Replace all hardcoded categories with car mechanic categories**
- **Assigned to**: senior-eng-1
- **Status**: qa
- **Blocked by**: FEAT-006
- **Description**:
  1. **`src/pages/Services.tsx:68-85`** — Replace the 6 generic category filter chips with car mechanic categories (exact values from Tech Lead decision TL-006). Update any associated icons.
  2. **`src/pages/Home.tsx:21-26`** — Replace the 4 generic category tiles with car-specific ones. Update labels and icons.
  3. **`src/pages/provider/ProviderProfile.tsx:417-505`** — Update the category dropdown options and subcategory options. Remove the `Health & Wellness` special-case logic at line 445 and replace with equivalent car-specific logic if needed (e.g. "Body & Paint" requiring a paint type specialization).
  4. Do a global search for any remaining references to old category names ("Beauty", "Health", "Wellness", "Fitness", "Technology Services", "Professional Services", "Home & Maintenance", "Education") and update or remove them.
- **Files to change**:
  - `src/pages/Services.tsx`
  - `src/pages/Home.tsx`
  - `src/pages/provider/ProviderProfile.tsx`
  - Any other files surfaced by the search
- **Acceptance criteria**:
  - [ ] No old generic category names visible in the UI
  - [ ] Car mechanic categories display correctly in filters, home page, and provider profile
  - [ ] Subcategory dropdown shows correct options per selected category
  - [ ] No TypeScript errors

---

**[FEAT-006] Backend: Update category seed data for car mechanic business types**
- **Assigned to**: senior-eng-1
- **Status**: qa
- **Description**:
  1. Update or create `server/scripts/seed-categories.js` (or `scripts/seed-categories.js`) with the new car mechanic categories and subcategories defined by Tech Lead in TL-006.
  2. Remove or archive old category seed data.
  3. Update the `ServiceCategory` model if any fields need to change to support car-specific data (e.g. a `vehicleType` field — only if Tech Lead approves).
  4. Add a script comment explaining how to run the seed: `node server/scripts/seed-categories.js`
- **Files to change**:
  - `scripts/seed-categories.js` or `server/scripts/seed-categories.js`
  - `server/models/ServiceCategory.js` (only if model changes needed)
- **Acceptance criteria**:
  - [ ] Seed script creates car mechanic categories in DB
  - [ ] Old generic categories removed from seed
  - [ ] Script is runnable without errors
  - [ ] Categories match what the frontend expects (same names)

---

**[FEAT-008] Frontend: Show Providers page in navigation and update it to match Services page**
- **Assigned to**: senior-eng-1
- **Status**: qa
- **Description**: The `/providers` route and `Providers.tsx` page already exist but are not visible to users because the nav link is commented out in Header.tsx. The page also uses old category icons and is missing the business image banner that was added to service cards in FEAT-004. This task brings Providers up to parity with Services.
- **Files to change**:
  - `src/components/Layout/Header.tsx` (~lines 121-123)
  - `src/pages/Providers.tsx` (~lines 17-33, 94-111, 339-341)
- **What to do**:
  1. **`src/components/Layout/Header.tsx`** — Replace the commented-out Providers link (lines 121-123) with an active link visible only to client users:
     ```tsx
     {user && isClient && (
       <Link to="/providers" className={getLinkClasses("/providers")} style={getLinkStyle("/providers")}>
         Providers
       </Link>
     )}
     ```
  2. **`src/pages/Providers.tsx`** — Update MUI icon imports (lines 17-33): remove `ContentCut`, `FitnessCenter`, `Favorite`; add `Build`, `Palette`, `ElectricBolt`, `DonutLarge`, `AcUnit`, `Settings`.
  3. **`src/pages/Providers.tsx`** — Update `getIconForCategory` (lines 94-111) to match the 6 car mechanic categories — identical mapping to `Services.tsx`:
     ```ts
     case 'Engine & Mechanical':       return Build;
     case 'Body & Paint':              return Palette;
     case 'Electrical & Diagnostics':  return ElectricBolt;
     case 'Tyres & Wheels':            return DonutLarge;
     case 'Air Conditioning':          return AcUnit;
     case 'Servicing & MOT':           return Settings;
     default:                          return Build;
     ```
  4. **`src/pages/Providers.tsx`** — Add a business image banner above the blue provider card header (before line 341). Mirror the pattern from `Services.tsx:178-183`:
     ```tsx
     <img
       src={provider.businessImage || '/placeholder.svg'}
       alt="Business"
       className="w-full h-32 object-cover"
     />
     ```
     Note: `provider.businessImage` comes from the `useAllProviders` hook response — it is already on the `ServiceProvider` model (added in FEAT-001). Check the type returned by `useAllProviders` and add `businessImage?: string` to the provider type if it is not already present.
- **Acceptance criteria**:
  - [ ] Providers nav link appears in the header for client users when logged in
  - [ ] Providers nav link does NOT appear for provider or admin users
  - [ ] Category filter chips on Providers page show car mechanic icons (no old `ContentCut`/`FitnessCenter`/`Favorite` icons)
  - [ ] Each provider card shows a business image banner (h-32) above the blue header; falls back to `/placeholder.svg` when no image is set
  - [ ] No TypeScript errors (`tsc --noEmit` passes)
  - [ ] No unused imports remain
- **Notes**: `isClient` is already defined in Header.tsx at line 34. Do not show the Providers link for unauthenticated users or providers — client-only.

---

## Sprint 3 — Reviews + Chat (2026-02-21)

---

### UX DESIGN REVIEW FIXES

---

**[UX-FIX-001] Frontend: Fix fake 4.8 rating in ServiceDetailModal (missed from UX-ENG-003)**
- **Assigned to**: senior-eng-1
- **Status**: qa
- **Covers**: UX-002 required fix
- **File**: `src/components/modals/ServiceDetailModal.tsx` (~line 106)
- **What to fix**: The modal rating line still reads `|| '4.8'` fallback. Apply the same "New" badge pattern from UX-ENG-003: if `totalReviews === 0`, show `<Badge>New</Badge>` instead of stars + fake rating.
- **Acceptance criteria**:
  - [ ] ServiceDetailModal shows "New" badge when provider has 0 reviews
  - [ ] Star rating shows correctly when reviews > 0
  - [ ] No TypeScript errors

---

**[UX-FIX-002] Frontend: Remove fake service counts from Home category tiles**
- **Assigned to**: senior-eng-1
- **Status**: qa
- **Covers**: UX-003 change request
- **File**: `src/pages/Home.tsx` (~lines 25-30)
- **What to fix**: Category tiles show fabricated counts ("500+", "300+", etc.). Remove the count line (`<p className="text-xs text-gray-500">{category.count} services</p>`) and the `count` property from the categories array.
- **Acceptance criteria**:
  - [ ] No fake service counts visible on Home category tiles
  - [ ] Category tiles still show name and icon correctly
  - [ ] No TypeScript errors

---

### FEATURE TASKS — FEAT-PROVIDERS

---

**[FEAT-013] Fix broken filters on Providers listing page**
- **Assigned to**: senior-eng-1
- **Status**: qa
- **Files**: `src/pages/Providers.tsx`, `server/routes/providers.js`
- **Description**: The Providers page has several filter bugs — category filtering returns no results, sort order has no UI, maxRating slider is missing, and there is a `$or` conflict in the backend query builder. Fix all of them.

**Bug 1 — Category filter broken (backend + frontend)**
- **Root cause**: `Providers.tsx` builds `displayCategories` with `id: category.name` (a string like "Engine & Mechanical"). This string is sent as the `category` query param. The backend then does `query.category = category` where `ServiceProvider.category` is a MongoDB `ObjectId` — a string name can never match an ObjectId, so all category filters return 0 results.
- **Fix**: In `Providers.tsx` change the `displayCategories` mapping to use `id: category._id` instead of `id: category.name`. The `selectedCategory` state will then hold an ObjectId string. The `filters.category` passed to `useAllProviders` sends this ObjectId to the backend, which correctly matches the `ObjectId` field on `ServiceProvider`.
  - Also update the `setSelectedCategory('all')` reset in `clearAllFilters` — no change needed there since `'all'` is still the "no filter" sentinel.
  - Update the active category chip highlight condition: `selectedCategory === category.id` still works since `id` is now the `_id`.

**Bug 2 — `$or` conflict between `search` and `hasWebsite=false`/`hasPhone=false`** (`server/routes/providers.js:55-73`)
- **Root cause**: When `search` is set, it writes `query.$or = [...]`. If `hasWebsite === 'false'` is also set, it overwrites `query.$or` with website conditions, silently dropping the search.
- **Fix**: Use `query.$and` to combine multiple `$or` conditions when both are present. Replace lines 55-73 with logic that pushes each condition into a `query.$and` array:
  ```js
  const andConditions = [];
  if (search) {
    andConditions.push({ $or: [{ businessName: ... }, { businessDescription: ... }, { businessAddress: ... }] });
  }
  if (hasWebsite === 'true') { query.website = { $exists: true, $ne: '' }; }
  else if (hasWebsite === 'false') { andConditions.push({ $or: [{ website: null }, { website: '' }] }); }
  if (hasPhone === 'true') { query.businessPhone = { $exists: true, $ne: '' }; }
  else if (hasPhone === 'false') { andConditions.push({ $or: [{ businessPhone: null }, { businessPhone: '' }] }); }
  if (andConditions.length > 0) query.$and = andConditions;
  ```

**Bug 3 — `sortOrder` has no UI control** (`src/pages/Providers.tsx`)
- **Root cause**: `sortOrder` state exists but there is no button/toggle to change it — it's always `'desc'`.
- **Fix**: Add an Asc/Desc icon toggle button next to the sort dropdown. Use MUI `ArrowUpward`/`ArrowDownward` icons. Clicking toggles `sortOrder` between `'asc'` and `'desc'`.

**Bug 4 — `maxRating` slider missing from Advanced Filters** (`src/pages/Providers.tsx`)
- **Root cause**: `maxRating` state exists and is sent to the API but there is no slider for it in the Advanced Filters sheet — only `minRating` is shown.
- **Fix**: Add a second `Slider` for "Maximum Rating" below the minimum rating slider in the Advanced Filters sheet. Same pattern as `minRating`. Also add `maxRating` to `clearAllFilters` (already there: `setMaxRating([5])`).

**Bug 5 — Backend aggregation pipeline still computes fake 4.8 effectiveRating** (`server/routes/providers.js:107-122, 180-189`)
- The `$addFields` stage replaces `averageRating` with 4.8 when it is 0 or null — this means the minimum rating filter can match providers who have no real ratings. Remove the fake 4.8 fallback from the pipeline; use the real `averageRating` value (0 is fine). Update both `$addFields` stages (the effectiveRating one and the `$project` averageRating one).

- **Acceptance criteria**:
  - [ ] Clicking a category chip actually filters the provider list to that category
  - [ ] Searching while also filtering by hasWebsite or hasPhone works correctly (no results dropped)
  - [ ] Asc/Desc toggle button appears next to the sort dropdown and changes sort direction
  - [ ] Max Rating slider appears in Advanced Filters and limits results to providers at or below that rating
  - [ ] Backend no longer injects fake 4.8 for providers with 0 reviews
  - [ ] No TypeScript errors

---

**[FEAT-014] Add map view to Providers listing page**
- **Assigned to**: senior-eng-1
- **Status**: review
- **Blocked by**: FEAT-013 (category filter must work before map is useful)
- **Description**: Add an interactive map showing provider locations as pins. Use `react-leaflet` + `leaflet` (free, open-source, no API key needed). The backend already returns `coordinates: { lat, lng }` for each provider in the API response.

**Install**:
```bash
npm install react-leaflet leaflet
npm install -D @types/leaflet
```

**CSS** — import Leaflet's CSS in `src/main.tsx` or `src/index.css`:
```ts
import 'leaflet/dist/leaflet.css';
```

**Leaflet default icon fix** — Leaflet's default marker icons break with bundlers. Add this fix in a new `src/lib/leaflet-icons.ts` and import it once in the map component:
```ts
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });
```

**UI changes in `src/pages/Providers.tsx`**:

1. Add a **List / Map toggle** button group above the providers grid (right-aligned, next to the results count). Use two icon buttons: `ViewList` and `Map` MUI icons. State: `const [viewMode, setViewMode] = useState<'list' | 'map'>('list')`.

2. **List view** — existing provider grid, unchanged.

3. **Map view** — render a `<MapContainer>` from `react-leaflet` filling the page area (`h-[600px] w-full rounded-lg`). Center on the average lat/lng of visible providers (or default to UK: `[54.5, -3.5]` zoom 6 if no providers have coordinates). For each provider that has `coordinates.lat` and `coordinates.lng`, render a `<Marker>` with a `<Popup>`:
   ```tsx
   <Popup>
     <div className="min-w-[180px]">
       <p className="font-semibold">{provider.businessName}</p>
       <p className="text-sm text-gray-500">{provider.category?.name}</p>
       <p className="text-sm">⭐ {provider.averageRating?.toFixed(1)} ({provider.totalReviews} reviews)</p>
       <button onClick={() => handleViewProvider(provider._id)} className="mt-2 text-sm text-blue-600 underline">View Profile</button>
     </div>
   </Popup>
   ```

4. Show a notice if there are providers in the list without coordinates: "N providers are not shown on the map because their location is not set."

5. Filters still work in map view — the same `providers` array (from the API, already filtered) is used for both views.

- **Acceptance criteria**:
  - [ ] List/Map toggle buttons appear above the results
  - [ ] Switching to Map view shows a Leaflet map with provider pins
  - [ ] Clicking a pin opens a popup with provider name, category, rating, and "View Profile" link
  - [ ] "View Profile" in popup navigates to the provider detail page
  - [ ] Applying filters (category, search, rating) updates the map pins in real time
  - [ ] Providers without coordinates are excluded from the map (no crash)
  - [ ] List view still works unchanged
  - [ ] Map tiles load (OpenStreetMap default tiles — no API key needed)
  - [ ] No TypeScript errors, no `any` types

---

### FEATURE TASKS — FEAT-REVIEWS

---

**[FEAT-009] Backend: Reviews model + API routes**
- **Assigned to**: senior-eng-1
- **Status**: pending
- **Description**: Create the Review system backend. A client can leave one review per completed booking.

**Model** — create `server/models/Review.js`:
```js
bookingId:  { type: ObjectId, ref: 'Booking', required: true, unique: true }
clientId:   { type: ObjectId, ref: 'User', required: true }
providerId: { type: ObjectId, ref: 'ServiceProvider', required: true }
rating:     { type: Number, required: true, min: 1, max: 5 }
comment:    { type: String, trim: true, maxlength: 500, default: '' }
timestamps: true
```
Indexes: `{ providerId: 1, createdAt: -1 }`, `{ clientId: 1 }`.

After each review save, recalculate `ServiceProvider.averageRating` and `ServiceProvider.totalReviews` using a post-save hook (aggregate over all reviews for that provider).

**Routes** — create `server/routes/reviews.js` and mount at `/api/reviews` in `server/server.js`:

- `POST /api/reviews`
  - Auth: `authenticateToken`, `requireRole(['client'])`
  - Body: `{ bookingId, rating, comment? }`
  - Guards: booking must exist, `booking.clientId === req.user._id`, `booking.status === 'completed'`, no existing review for this bookingId
  - Returns `{ message: 'Review submitted', review }`

- `GET /api/reviews/provider/:providerId`
  - Public (no auth required)
  - Returns `{ reviews: [...], averageRating, totalReviews }` — populate `clientId` with `fullName` only
  - Sort by `createdAt: -1`, limit 50

- `GET /api/reviews/booking/:bookingId`
  - Auth: `authenticateToken`
  - Returns `{ review }` or `{ review: null }` — lets frontend know if review already submitted for this booking

- **Acceptance criteria**:
  - [ ] `POST /api/reviews` creates a review and updates provider averageRating + totalReviews
  - [ ] Duplicate review for same booking returns 409
  - [ ] Non-completed booking returns 400
  - [ ] `GET /api/reviews/provider/:providerId` returns reviews list publicly
  - [ ] `GET /api/reviews/booking/:bookingId` returns existing review or null
  - [ ] No TypeScript errors

---

**[FEAT-010] Frontend: Review submission UI + reviews display**
- **Assigned to**: senior-eng-1
- **Status**: pending
- **Blocked by**: FEAT-009
- **Description**: Add review functionality to the client-facing UI.

**1. "Leave Review" button in `src/pages/MyBookings.tsx`:**
- On completed bookings, show a "Leave Review" button (or "View Review" if already submitted)
- Use `GET /api/reviews/booking/:bookingId` on load to check existing review state per booking
- Clicking "Leave Review" opens a `ReviewModal`

**2. New `src/components/modals/ReviewModal.tsx`:**
- Star picker (1–5 stars, clickable — use MUI `Star`/`StarBorder` icons or simple buttons)
- Optional comment textarea (maxlength 500, show character count)
- Submit button calling `POST /api/reviews`
- Success toast: "Review submitted!" — closes modal and updates the booking row to show "Reviewed"
- Error toast on failure

**3. Reviews list in `src/pages/ProviderDetail.tsx`:**
- Below the existing provider info, add a "Reviews" section
- Fetch from `GET /api/reviews/provider/:providerId`
- Show average rating (stars + number) and total review count at the top
- List each review: client name (first name only), star rating, comment, date
- Show "No reviews yet" if empty

**Add to `src/services/api.ts`:**
- `submitReview(bookingId, rating, comment?)` — POST /api/reviews
- `getProviderReviews(providerId)` — GET /api/reviews/provider/:providerId
- `getBookingReview(bookingId)` — GET /api/reviews/booking/:bookingId

- **Acceptance criteria**:
  - [ ] Completed bookings in MyBookings show "Leave Review" button
  - [ ] Already-reviewed bookings show "Reviewed" (no button)
  - [ ] ReviewModal star picker works (1–5 selection)
  - [ ] Submitting a review shows success toast and updates the UI
  - [ ] ProviderDetail shows reviews list with average rating
  - [ ] No TypeScript errors, no `any` types

---

### FEATURE TASKS — FEAT-CHAT

---

**[FEAT-011] Backend: Chat — Conversation + Message models + Socket.io + REST routes**
- **Assigned to**: senior-eng-1
- **Status**: pending
- **Description**: Real-time chat between clients and providers using Socket.io.

**Install dependency** (in `server/`):
```bash
npm install socket.io
```

**Update `server/server.js`** — wrap Express app in an HTTP server to support Socket.io:
```js
import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:8080', credentials: true }
});
// Replace app.listen(...) with httpServer.listen(...)
```

**Model 1** — create `server/models/Conversation.js`:
```js
clientId:      { type: ObjectId, ref: 'User', required: true }
providerId:    { type: ObjectId, ref: 'ServiceProvider', required: true }
lastMessage:   { type: String, default: '' }
lastMessageAt: { type: Date, default: Date.now }
clientUnread:  { type: Number, default: 0 }
providerUnread:{ type: Number, default: 0 }
timestamps: true
```
Unique compound index: `{ clientId: 1, providerId: 1 }`.

**Model 2** — create `server/models/Message.js`:
```js
conversationId: { type: ObjectId, ref: 'Conversation', required: true }
senderId:       { type: ObjectId, ref: 'User', required: true }
senderRole:     { type: String, enum: ['client', 'provider'], required: true }
content:        { type: String, required: true, trim: true, maxlength: 2000 }
read:           { type: Boolean, default: false }
timestamps: true
```
Index: `{ conversationId: 1, createdAt: 1 }`.

**REST routes** — create `server/routes/chat.js`, mount at `/api/chat` in `server/server.js`:

- `POST /api/chat/conversations` — auth any role — find or create a conversation between `clientId` + `providerId`. Body: `{ providerId }` (client calls this). Returns `{ conversation }`.
- `GET /api/chat/conversations` — auth any role — list all conversations for the current user (as client or provider). Populate the other party's name. Sort by `lastMessageAt: -1`.
- `GET /api/chat/conversations/:conversationId/messages` — auth (must be participant) — return last 50 messages, sorted `createdAt: asc`. Also mark all messages as `read` where `senderId !== req.user._id`.
- `POST /api/chat/conversations/:conversationId/messages` — auth (must be participant) — create a message, update conversation's `lastMessage` + `lastMessageAt` + increment the other party's unread count. Emit `new_message` Socket.io event to the conversation room.

**Socket.io events** in `server/server.js` (after route setup):
```js
io.on('connection', (socket) => {
  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
  });
  socket.on('leave_conversation', (conversationId) => {
    socket.leave(conversationId);
  });
});
```
The `new_message` event is emitted from the REST route (not via socket directly), so the client can use REST to send and Socket.io to receive.

- **Acceptance criteria**:
  - [ ] `POST /api/chat/conversations` finds or creates a conversation
  - [ ] `GET /api/chat/conversations` returns conversations for the current user
  - [ ] `GET /api/chat/conversations/:id/messages` returns message history and marks messages read
  - [ ] `POST /api/chat/conversations/:id/messages` saves message and emits `new_message` to room
  - [ ] Socket.io `join_conversation` / `leave_conversation` events handled
  - [ ] Non-participants cannot read or post to a conversation (403)
  - [ ] Server restarts cleanly with httpServer.listen

---

**[FEAT-012] Frontend: Chat UI — Messages page + conversation view**
- **Assigned to**: senior-eng-1
- **Status**: pending
- **Blocked by**: FEAT-011
- **Description**: Full chat UI for clients and providers.

**Install dependency** (in project root):
```bash
npm install socket.io-client
```

**New page** — `src/pages/Messages.tsx`:
- Left panel: list of conversations (fetched from `GET /api/chat/conversations`)
  - Each row: other party's name, last message preview, time, unread badge
  - Clicking a row loads that conversation in the right panel
- Right panel: `ConversationView` component
  - Message bubbles (own messages right-aligned blue, their messages left-aligned grey)
  - Input field + Send button at the bottom
  - On mount: fetch message history, join Socket.io room (`join_conversation`)
  - On new message sent: `POST /api/chat/conversations/:id/messages` — optimistically append to UI
  - On `new_message` socket event: append incoming message to the list
  - On unmount: emit `leave_conversation`
- Show "Select a conversation" placeholder in right panel when none selected

**Add route** in `src/App.tsx`: `/messages` — protected (auth required, any role).

**Add "Messages" nav link** in `src/components/Layout/Header.tsx`:
- Show for client and provider users (both roles can chat)
- Show an unread badge count if there are unread messages (sum of unread from conversations list)

**"Message" button on `src/pages/ProviderDetail.tsx`**:
- Client users see a "Message" button on the provider detail page
- Clicking calls `POST /api/chat/conversations` with the provider's ID, then navigates to `/messages` with that conversation pre-selected (pass via router state or query param)

**Add to `src/services/api.ts`**:
- `getConversations()` — GET /api/chat/conversations
- `getOrCreateConversation(providerId)` — POST /api/chat/conversations
- `getMessages(conversationId)` — GET /api/chat/conversations/:id/messages
- `sendMessage(conversationId, content)` — POST /api/chat/conversations/:id/messages

**Socket.io client setup** — create `src/lib/socket.ts`:
```ts
import { io } from 'socket.io-client';
export const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001', {
  autoConnect: false,
});
```
Connect on `/messages` page mount, disconnect on unmount.

- **Acceptance criteria**:
  - [ ] `/messages` page shows conversation list on the left
  - [ ] Clicking a conversation loads message history on the right
  - [ ] Sending a message appends it immediately and saves via REST
  - [ ] Incoming messages appear in real-time via Socket.io (test with two browser tabs)
  - [ ] "Message" button on ProviderDetail navigates to `/messages` with conversation open
  - [ ] Messages nav link shows unread count badge when there are unread messages
  - [ ] Messages nav link visible for both client and provider users
  - [ ] No TypeScript errors, no `any` types

---

## Sprint 4 — UI Polish (2026-02-21)

---

### UX DESIGN TASKS

---

**[UX-REDESIGN-001] Providers listing page redesign — simplify cards, fix styling, add polish**
- **Assigned to**: senior-eng-1
- **Status**: review
- **Covers**: Card overload, hardcoded colors, inconsistent icons, redundant UI, missing background, no hover polish
- **File**: `src/pages/Providers.tsx`
- **Description**: The Providers page is the most information-dense page in the app at 473 lines with 8-10 data elements per card, inconsistent styling, and a cluttered layout. By comparison, the Services page (290 lines) and Home page (225 lines) are much cleaner. This task aligns the Providers page with their quality level.
- **What to fix**:
  1. **Simplify cards** — reduce from 8-10 elements to 6 clean elements per card:
     - **Keep**: business image banner (h-32), blue header with avatar + name + category, description (2-line clamp), location row, rating + "View Profile" button row
     - **Remove**: phone number row (available on detail page), service count, website badge, subcategory badge
     - **Move**: verified badge inline next to business name as a small checkmark icon
  2. **Replace hardcoded colors** — all `style={{backgroundColor: '#025bae'}}` → `className="bg-primary"`, all `style={{ fontSize: 16, color: '#025bae' }}` → `className="w-4 h-4 text-primary"`, all `style={{color: '#025bae'}}` → `className="text-primary"`
  3. **Standardize icon sizing** — replace all `style={{ fontSize: 16 }}` with `className="w-4 h-4"`
  4. **Add page background** — change outer `<div className="py-8">` to `<div className="min-h-screen bg-gray-50 py-8">` to match Services page
  5. **Remove redundant clear filters button** — remove the standalone "Clear all (N)" ghost button outside the Sheet; the "Clear All" inside Advanced Filters is sufficient
  6. **Add card hover polish** — `hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200` replacing `hover:shadow-md transition-shadow duration-200`
  7. **Fix header typography** — remove inline `style={{fontFamily: ...}}` from h1
- **Acceptance criteria**:
  - [ ] Cards show 6 elements: image, name/category header, description, location, rating, View Profile button
  - [ ] No inline `#025bae` colors remain — all use Tailwind `bg-primary`/`text-primary`
  - [ ] Hover effect lifts cards slightly with shadow
  - [ ] Category filter buttons use `bg-primary` not inline styles
  - [ ] Advanced Filters Sheet still opens and functions
  - [ ] Empty state still renders correctly
  - [ ] Mobile responsive: 1-col mobile, 2-col md, 3-col lg
  - [ ] Loading skeleton still renders with `bg-gray-50` background
  - [ ] No TypeScript errors

---

### UX DESIGN ANALYSIS — Commercial-Grade Polish (2026-02-21)

> **Context**: Full cross-page design audit comparing every screen against commercial SaaS standards (Calendly, Treatwell, ServiceTitan). The app has solid bones — shadcn/ui components, consistent grid layouts, responsive breakpoints — but several systemic issues prevent it from feeling like a shipped product.

---

**[UX-REDESIGN-002] Fix the CSS design system — `--primary` is the wrong color**
- **Assigned to**: senior-eng-1
- **Status**: pending
- **Priority**: critical — this is the root cause of 80+ hardcoded `#025bae` inline styles across the app
- **File**: `src/index.css` (line 63)
- **Description**: The `--primary` CSS variable is set to `222.2 47.4% 11.2%` which resolves to a near-black dark navy (`hsl(222, 47%, 11%)` ≈ `#0f172a`). This does NOT match the brand color `#025bae` (`hsl(207, 98%, 35%)`). Because `bg-primary` renders as near-black instead of brand blue, every engineer has been forced to use `style={{backgroundColor: '#025bae'}}` as a workaround. Fixing this one variable will make `bg-primary` and `text-primary` match the brand and allow bulk replacement of inline styles across the entire codebase.
- **What to fix**:
  1. Change `--primary` from `222.2 47.4% 11.2%` to `207 98% 35%` (which is `#025bae` in HSL)
  2. Change `--primary-foreground` to `0 0% 100%` (white text on blue)
  3. Change `--ring` to `207 98% 35%` (focus ring should match brand)
- **Acceptance criteria**:
  - [ ] `bg-primary` renders as `#025bae` blue, not near-black
  - [ ] `text-primary` renders as brand blue
  - [ ] All shadcn `<Button>` default variants render with brand blue background
  - [ ] Focus rings on inputs and buttons are brand blue
  - [ ] No visual regressions on existing components using `variant="default"`

---

**[UX-REDESIGN-003] App-wide: Replace all hardcoded `#025bae` inline styles with Tailwind classes**
- **Assigned to**: senior-eng-1
- **Status**: pending
- **Blocked by**: UX-REDESIGN-002 (primary must be correct first)
- **Priority**: critical
- **Description**: After fixing `--primary`, do a global sweep to replace every inline `style={{backgroundColor: '#025bae'}}`, `style={{color: '#025bae'}}`, `style={{borderLeftColor: '#025bae'}}`, and `style={{ fontSize: N, color: '#025bae' }}` with Tailwind equivalents. Also replace `#4a90e2` (secondary blue used on Dashboard stat cards) — either define a `--secondary-blue` token or use `bg-primary/80`.
- **Files to change** (all affected):
  - `src/pages/Services.tsx` — ~6 inline styles (card headers, icons, buttons, category chips, price)
  - `src/pages/ProviderDetail.tsx` — ~10 inline styles (header, service card headers, icons, buttons)
  - `src/pages/MyBookings.tsx` — ~8 inline styles (card headers, borders, links, icons, skeletons)
  - `src/pages/Dashboard.tsx` — ~12 inline styles (headers, stat cards, icons, activity borders, stat values)
  - `src/pages/Messages.tsx` — ~5 inline styles (headers, badges, bubbles, send button)
  - `src/components/Layout/Header.tsx` — `getLinkStyle()` returns `{color: '#025bae'}` for active links; logo text uses inline `fontFamily`
  - `src/components/modals/ServiceDetailModal.tsx` — check for inline styles
  - `src/components/modals/ReviewModal.tsx` — check for inline styles
- **Replacement rules**:
  - `style={{backgroundColor: '#025bae'}}` → `className="bg-primary"`
  - `style={{color: '#025bae'}}` → `className="text-primary"`
  - `style={{borderLeftColor: '#025bae'}}` → `className="border-l-primary"`
  - `style={{ fontSize: 16, color: '#025bae' }}` → `className="w-4 h-4 text-primary"`
  - `style={{ fontSize: 12, color: '#025bae' }}` → `className="w-3 h-3 text-primary"`
  - `style={{backgroundColor: '#4a90e2'}}` → `className="bg-primary/80"` (or define a secondary token)
  - `style={{color: '#025bae'}}` on stat values → `className="text-primary"`
- **Acceptance criteria**:
  - [ ] `git grep '#025bae' src/` returns 0 results
  - [ ] `git grep '#4a90e2' src/` returns 0 results
  - [ ] All blue headers, buttons, icons, borders still render as brand blue
  - [ ] No TypeScript errors

---

**[UX-REDESIGN-004] App-wide: Remove all inline `fontFamily` declarations**
- **Assigned to**: senior-eng-1
- **Status**: pending
- **Priority**: major
- **Description**: Six files use `style={{fontFamily: 'Red Hat Display, system-ui, -apple-system, sans-serif'}}` inline. This font is never imported via `@font-face` or Google Fonts, so it silently falls back to system fonts anyway. The inline declarations add noise and create a false impression that the font is applied. Either import the font properly and set it globally, or remove all inline references and let the system font stack handle it.
- **Recommended approach**: Remove all inline `fontFamily` styles. If Red Hat Display is wanted, add a single `@import url(...)` in `src/index.css` and set `font-family` on `body` in the base layer — never inline.
- **Files affected**:
  - `src/pages/MyBookings.tsx:181`
  - `src/pages/Messages.tsx:151`
  - `src/pages/Dashboard.tsx:84`
  - `src/components/Layout/Header.tsx:75` (logo)
- **Acceptance criteria**:
  - [ ] `git grep 'fontFamily' src/` returns 0 results
  - [ ] Page titles render with consistent font (system or imported)
  - [ ] No visual regression

---

**[UX-REDESIGN-005] App-wide: Standardize all MUI icon sizing to Tailwind classes**
- **Assigned to**: senior-eng-1
- **Status**: pending
- **Blocked by**: UX-REDESIGN-003
- **Priority**: major
- **Description**: Icons across the app use three different sizing approaches: (1) `className="w-4 h-4"` (correct Tailwind way), (2) `style={{ fontSize: 16 }}` (MUI inline), (3) `style={{ fontSize: 12 }}` (MUI inline smaller). Standardize everything to Tailwind `w-N h-N` classes.
- **Replacement rules**:
  - `style={{ fontSize: 16 }}` → `className="w-4 h-4"` (and merge with any existing className)
  - `style={{ fontSize: 12 }}` → `className="w-3 h-3"`
  - `style={{ fontSize: 16, color: '#025bae' }}` → `className="w-4 h-4 text-primary"` (handled by UX-REDESIGN-003, but verify none remain)
- **Files**: Same set as UX-REDESIGN-003, plus `src/pages/ProviderDetail.tsx` review stars at line 386
- **Acceptance criteria**:
  - [ ] `git grep 'fontSize' src/` returns 0 results (for icon styling)
  - [ ] All icons render at correct sizes
  - [ ] No TypeScript errors

---

**[UX-REDESIGN-006] Services page: Bring up to same polish level as Providers page**
- **Assigned to**: senior-eng-1
- **Status**: pending
- **Blocked by**: UX-REDESIGN-002, UX-REDESIGN-003
- **Priority**: major
- **File**: `src/pages/Services.tsx`
- **Description**: Services.tsx still has the pre-redesign card styling that Providers.tsx just got cleaned up. Apply the same polish:
  1. **Card hover**: Change `hover:shadow-md transition-shadow duration-200` to `hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`
  2. **Category chip styling**: Replace the inline `style` on category buttons (lines 153-156) with the same Tailwind pattern from Providers: `className={selected ? "... bg-primary hover:bg-primary/90" : "..."}`
  3. **Description clamp**: Add `line-clamp-2` to the service description (line 211) to keep cards uniform height
  4. **Results count alignment**: Wrap the `{filteredServices.length} services found` in the same `flex justify-between` pattern as Providers, to leave room for future controls
- **Acceptance criteria**:
  - [ ] Service cards have the same hover lift effect as Provider cards
  - [ ] Category buttons use Tailwind, no inline `style`
  - [ ] Descriptions are clamped to 2 lines
  - [ ] No TypeScript errors

---

**[UX-REDESIGN-007] ProviderDetail page: Add business image banner and visual hierarchy**
- **Assigned to**: senior-eng-1
- **Status**: pending
- **Blocked by**: UX-REDESIGN-002
- **Priority**: major
- **File**: `src/pages/ProviderDetail.tsx`
- **Description**: The ProviderDetail page goes straight from the page background into a blue card header with no visual impact. Compare to the provider cards on the listing page which show a business image banner above the blue header — the detail page should be at least as rich.
- **What to fix**:
  1. Add a `provider.businessImage` banner above the blue header card (full-width, `h-48 object-cover` with a subtle gradient overlay at the bottom for text legibility). Fall back to a gradient placeholder if no image.
  2. Overlap the avatar slightly onto the banner (negative margin, `ring-4 ring-white`) for a professional profile look — same pattern used by LinkedIn/Google Business profiles.
  3. The business hours card at line 288 uses `className='p-8'` with no shadow, no border-0, no overflow-hidden — it looks different from every other card on the page. Match it to the standard pattern: `className="shadow-sm border-0 overflow-hidden"` with a blue header strip.
  4. Service sub-cards use `#4a90e2` for their header — after UX-REDESIGN-003 this will be `bg-primary/80`. Ensure there is still a visual distinction between main provider header and sub-service headers.
- **Acceptance criteria**:
  - [ ] Business image banner appears above the provider header
  - [ ] Avatar overlaps the banner/header boundary
  - [ ] Business hours card matches the styling pattern of other cards
  - [ ] No TypeScript errors

---

**[UX-REDESIGN-008] Loading skeletons: Match the card layout they replace**
- **Assigned to**: senior-eng-1
- **Status**: pending
- **Priority**: minor
- **Description**: The loading skeletons on Providers, Services, and ProviderDetail pages are generic rectangles that don't match the shape of the actual cards (image banner + blue header + content). This causes a visible layout shift when data loads. Update skeletons to mimic the real card structure:
  1. **Providers/Services** (listing pages): Skeleton should show: a `h-32` gray block (image), a `h-12 bg-primary/20` block (blue header area), then content lines. This matches the real card.
  2. **ProviderDetail**: Skeleton should show: `h-48` gray block (banner), `h-16 bg-primary/20` block (header), then content blocks.
- **Files**: `src/pages/Providers.tsx:139-149`, `src/pages/Services.tsx:108-118`, `src/pages/ProviderDetail.tsx:94-111`
- **Acceptance criteria**:
  - [ ] Loading skeletons visually resemble the real card layout
  - [ ] No layout shift when data loads
  - [ ] No TypeScript errors

---

**[UX-REDESIGN-009] MyBookings: Replace heavy border-left cards with cleaner card styling**
- **Assigned to**: senior-eng-1
- **Status**: pending
- **Blocked by**: UX-REDESIGN-003
- **Priority**: minor
- **File**: `src/pages/MyBookings.tsx`
- **Description**: Booking items use `border-l-4 bg-gray-50` with inline `borderLeftColor` which looks dated (2016-era Material Design). Professional booking apps (Calendly, Acuity) use full cards with a subtle status indicator. Modernize:
  1. Replace `border-l-4 bg-gray-50` items with `rounded-lg border border-gray-200 bg-white` cards with a small colored status dot or status badge in the top-right corner
  2. Add `hover:shadow-sm transition-all duration-150` for subtle interaction feedback
  3. The completed bookings section uses `opacity-75` which makes everything look disabled — instead use full opacity with a muted status badge to distinguish from active bookings
- **Acceptance criteria**:
  - [ ] Booking items use modern card styling, no heavy left-border
  - [ ] Status clearly visible via badge/dot, not border color
  - [ ] Completed bookings are distinguishable but not washed out
  - [ ] No TypeScript errors

---

**[UX-REDESIGN-010] Empty states: Make them actionable and branded**
- **Assigned to**: senior-eng-1
- **Status**: pending
- **Priority**: minor
- **Description**: Empty states across the app use raw MUI icons at reduced opacity and generic text. Professional apps use this real estate for onboarding. Improve:
  1. Every empty state should have a clear CTA button (not just text). For example:
     - "No upcoming appointments" → add "Browse Services" button
     - "No conversations yet" → add "Find a Mechanic" button
     - "No reviews yet" → "Be the first to review" is already there, keep it
  2. Use the brand blue for the empty state icon instead of gray: `text-primary/30` instead of `text-gray-300`/`text-gray-400`
  3. Empty state copy should be specific to the car mechanic domain, not generic. E.g. "No upcoming appointments" → "No upcoming services — find a mechanic to get started"
- **Files**: `src/pages/MyBookings.tsx` (2 empty states), `src/pages/Dashboard.tsx` (2 empty states), `src/pages/Messages.tsx` (2 empty states), `src/pages/ProviderDetail.tsx` (2 empty states)
- **Acceptance criteria**:
  - [ ] Every empty state has at least one CTA button
  - [ ] Icons use brand color at low opacity, not gray
  - [ ] Copy is domain-specific (mentions car/mechanic/garage where appropriate)
  - [ ] No TypeScript errors

---

### TECH LEAD REVIEW TASKS

---

**[TL-010] Review and prioritize UX-REDESIGN tasks**
- **Assigned to**: tech-lead
- **Status**: done
- **Description**: Review the UX-REDESIGN-002 through UX-REDESIGN-010 tasks above. The recommended implementation order is:
  1. **UX-REDESIGN-002** (fix `--primary`) — unblocks everything else
  2. **UX-REDESIGN-003** (global inline style sweep) — biggest single improvement
  3. **UX-REDESIGN-004** (remove fontFamily) — quick cleanup
  4. **UX-REDESIGN-005** (icon sizing) — quick cleanup
  5. **UX-REDESIGN-006** (Services parity) — medium effort
  6. **UX-REDESIGN-007** (ProviderDetail banner) — medium effort, high visual impact
  7. **UX-REDESIGN-008** (skeletons) — minor polish
  8. **UX-REDESIGN-009** (MyBookings cards) — minor polish
  9. **UX-REDESIGN-010** (empty states) — minor polish
- **Acceptance criteria**:
  - [ ] Tasks triaged and assigned
  - [ ] Implementation order confirmed or adjusted
  - [ ] Engineers notified via inbox

---

## Sprint 5 — Static Code Removal + Form Logging + Form Validation (2026-02-21)

> **Context**: Full audit of `Home.tsx` and all form pages revealed hardcoded data arrays, debug `console.log` statements that expose user data, and insufficient form validation. This sprint fixes all three.

---

### STATIC CODE REMOVAL — HOME PAGE

---

**[HOME-001] Frontend: Replace hardcoded `topProviders` array in Home.tsx with real API data**
- **Assigned to**: senior-eng-1
- **Status**: pending
- **File**: `src/pages/Home.tsx` (~lines 56-84)
- **Description**: The Home page has a hardcoded `topProviders` array with three fake providers (Mike's Auto Repair, City Body Shop, QuickFit Tyres) with fake ratings (4.9/4.8), fake review counts (312/187/254), and fake distances ("0.5 mi", "1.2 mi"). Replace this with a real API call.

**What to do:**
1. Remove the hardcoded `topProviders` array (lines ~56-84) and the `TopProvider` interface above it
2. Use the existing `useAllProviders` hook (imported from `src/hooks/useProvider.ts`) with `{ limit: 3, sortBy: 'rating', sortOrder: 'desc' }` params — or whatever filter params the hook accepts — to fetch the top 3 rated providers
3. In the "Featured Garages" / "Top-Rated Mechanics" section, render the real providers from the API response
4. Show a loading skeleton while fetching (use shadcn `Skeleton` component, 3 cards)
5. Show an empty state ("No providers available yet") if the API returns no results
6. Each provider card should show: `provider.businessName`, `provider.category?.name`, `provider.averageRating` (with "New" badge if `totalReviews === 0`, same pattern as Providers.tsx), `provider.businessImage` (with `/placeholder.svg` fallback), and a "View Profile" button linking to `/providers/:id`
7. Remove fake distance strings entirely — distance is not available from the API

- **Acceptance criteria**:
  - [ ] No hardcoded `topProviders` array in `Home.tsx`
  - [ ] Real providers fetched from API (top 3 by rating)
  - [ ] Loading skeleton shows while data loads
  - [ ] Empty state if no providers
  - [ ] "New" badge when `totalReviews === 0` (no fake rating)
  - [ ] "View Profile" links to correct `/providers/:id`
  - [ ] No fake distances shown
  - [ ] No TypeScript errors

---

**[HOME-002] Frontend: Replace hardcoded `categories` array in Home.tsx with API data**
- **Assigned to**: senior-eng-1
- **Status**: pending
- **Blocked by**: HOME-001 (can be done in parallel — just don't conflict on same file)
- **File**: `src/pages/Home.tsx` (~lines 24-31)
- **Description**: The Home page has a hardcoded `categories` array (Engine & Mechanical, Body & Paint, Electrical, Tyres & Wheels) with only 4 of the 6 car mechanic categories. `Services.tsx` and `ProviderProfile.tsx` already use the `useServiceCategories()` hook to load categories dynamically from the API. Home should do the same.

**What to do:**
1. Remove the hardcoded `categories` array (lines ~24-31) and import `useServiceCategories` from the same hook file used in `Services.tsx`
2. Use `const { data: categories, isLoading } = useServiceCategories()` (or equivalent)
3. In the category tiles section, map over the real `categories` array from the API
4. Reuse the existing `getIconForCategory` pattern (same icon mapping as `Services.tsx`) — define a local helper or import it
5. Each category tile should remain a `<Link>` to `/services?category=<category.name>` (or `<category._id>` — check how Services.tsx reads it from URL) — preserving the filter navigation added in UX-ENG-001
6. Show a loading skeleton (6 placeholder tiles) while fetching

- **Acceptance criteria**:
  - [ ] No hardcoded `categories` array — loaded from API via `useServiceCategories()`
  - [ ] All 6 car mechanic categories shown (not just 4)
  - [ ] Category tiles still link to `/services` with correct filter
  - [ ] Icons match the 6 car mechanic categories
  - [ ] Loading skeleton shown while fetching
  - [ ] No TypeScript errors

---

**[HOME-003] Frontend: Remove fake stat text from Home.tsx**
- **Assigned to**: senior-eng-1
- **Status**: pending
- **File**: `src/pages/Home.tsx` (~line 204)
- **Description**: The Home page "Why Choose Zenith?" section contains the text "thousands of satisfied customers" (or similar vague stat) that is fabricated. There is no API that provides a real user/booking count. Either remove the stat entirely or replace it with a non-numerical claim that does not imply a specific volume.

**What to do:**
1. Find the stat text (e.g. "10,000+ customers", "thousands of satisfied customers", or similar) in the "Why Choose Zenith?" features section
2. Option A (preferred): Remove the stat number/text entirely — keep the feature description but drop the fake quantifier. E.g. "Join our growing community of car owners" instead of "Join 10,000+ satisfied customers"
3. Option B: If other stats in that section are also fake (e.g. "500+ mechanics"), remove those too and replace with non-numerical copy ("A growing network of trusted mechanics")
4. Do NOT replace with different fake numbers — remove or rephrase

- **Acceptance criteria**:
  - [ ] No fabricated numbers (e.g. "10,000+", "thousands of") on the Home page
  - [ ] Copy still reads naturally without the fake stats
  - [ ] No TypeScript errors

---

### FORM LOGGING + FORM VALIDATION TASKS

---

**[FORM-001] Frontend: Add inline validation errors to Login.tsx**
- **Assigned to**: senior-eng-1
- **Status**: pending
- **File**: `src/pages/Login.tsx`
- **Description**: Login form currently relies on HTML5 browser validation (`type="email"`, `required`) and shows errors only as toasts. Add inline field-level error messages so users see what is wrong immediately.

**What to do:**
1. Wrap the form with React Hook Form (`useForm`) — import from `'react-hook-form'` (already a project dependency)
2. Add a Zod schema using `zodResolver`:
   ```ts
   const loginSchema = z.object({
     email: z.string().email('Enter a valid email address'),
     password: z.string().min(1, 'Password is required'),
   });
   ```
3. Register each input with React Hook Form's `register` and display `formState.errors.<field>.message` below each input using a `<p className="text-sm text-red-500 mt-1">` element
4. The existing `onSubmit` handler + toast error on API failure stays unchanged
5. Remove the `required` HTML attributes (React Hook Form handles this)

- **Acceptance criteria**:
  - [ ] Submitting with empty email shows "Enter a valid email address" inline below the email field
  - [ ] Submitting with invalid email format shows inline error
  - [ ] Submitting with empty password shows "Password is required" inline
  - [ ] API errors still shown as toasts (unchanged)
  - [ ] No TypeScript errors

---

**[FORM-002] Frontend: Register.tsx — remove data-exposing console.logs + improve validation**
- **Assigned to**: senior-eng-1
- **Status**: pending
- **File**: `src/pages/Register.tsx`
- **Description**: Register form logs user email and name to the browser console (`console.log('Attempting registration with data:', {...})` at ~line 76, `console.error('Registration error details:', error)` at ~line 91). It also has no minimum-length validation on the name field and does not trim the email before submission.

**What to do:**
1. **Remove both console statements** — line ~76 (`console.log`) and line ~91 (`console.error`). The API error is already shown as a toast — the `console.error` is redundant and exposes sensitive data
2. **Add name min-length validation**: If using React Hook Form + Zod, add `name: z.string().min(2, 'Name must be at least 2 characters').max(100)` to the schema. If the form uses plain state, add a check before submission
3. **Trim email before submission**: `email: data.email.trim().toLowerCase()` — prevents accounts being created with leading/trailing spaces that make login fail

- **Acceptance criteria**:
  - [ ] `console.log` with user data removed (line ~76)
  - [ ] `console.error` with error details removed (line ~91)
  - [ ] Name shorter than 2 characters shows an inline validation error
  - [ ] Email is trimmed (`.trim().toLowerCase()`) before the API call
  - [ ] No TypeScript errors

---

**[FORM-003] Frontend: Profile.tsx — remove debug console.logs + add phone/address validation**
- **Assigned to**: senior-eng-1
- **Status**: pending
- **File**: `src/pages/Profile.tsx`
- **Description**: Profile form has multiple debug console.logs that log full form data to the browser console (`console.log('Form data before submit:', data)` at ~line 174, and AI schedule debug logs at ~lines 206 and 224). The phone field also has no validation rules, allowing any input including letters.

**What to do:**
1. **Remove all three console.log statements**: line ~174, line ~206, line ~224. Replace none of them — these were debug-only
2. **Add phone validation**: The phone field uses `register('phone')` with no rules. Add:
   ```ts
   register('phone', {
     pattern: {
       value: /^[+\d\s()\-]{7,20}$/,
       message: 'Enter a valid phone number',
     },
   })
   ```
   And show `errors.phone?.message` below the field
3. **Add address validation**: The address field should have a minimum length. Add `minLength: { value: 5, message: 'Enter a complete address' }` rule or equivalent
4. Display both inline error messages below their respective fields using `<p className="text-sm text-red-500 mt-1">`

- **Acceptance criteria**:
  - [ ] `console.log('Form data before submit:', ...)` removed
  - [ ] AI schedule debug console.logs removed (lines ~206, ~224)
  - [ ] Phone field rejects non-phone input (letters, short strings) with inline error
  - [ ] Address field rejects very short input with inline error
  - [ ] No TypeScript errors

---

**[FORM-004] Frontend: ProviderProfile.tsx — remove emoji console.logs + add Zod phone/URL validation**
- **Assigned to**: senior-eng-1
- **Status**: pending
- **File**: `src/pages/provider/ProviderProfile.tsx`
- **Description**: ProviderProfile has 9+ `console.log` statements with emoji prefixes scattered across the file (lines ~114, ~228-255, ~342-348) that dump full form state, API responses, and image upload data to the console. The existing Zod schema also accepts any string for `businessPhone` (no format check) and any string for `website` (no URL format check).

**What to do:**
1. **Remove all emoji console.logs** — search for `console.log('🔍`, `console.log('✅`, `console.log('❌`, `console.log('📤`, `console.log('🎯`, `console.log('📋` and any other emoji-prefixed logs in the file. Remove every one. The UX-ENG-010 task may have already removed some — only remove what still remains
2. **Add phone regex to Zod schema**: Find the `providerProfileSchema` (or equivalent). Change the `businessPhone` field to:
   ```ts
   businessPhone: z.string()
     .regex(/^[+\d\s()\-]{7,20}$/, 'Enter a valid phone number (digits, spaces, +, - only)')
     .optional()
     .or(z.literal(''))
   ```
3. **Add URL validation to Zod schema**: Change the `website` field to:
   ```ts
   website: z.string()
     .url('Enter a valid URL starting with https://')
     .optional()
     .or(z.literal(''))
   ```
   This allows empty string (no website) but rejects strings that are not valid URLs
4. Show both validation errors inline below their fields (they will display automatically via React Hook Form if the schema is wired up correctly)

- **Acceptance criteria**:
  - [ ] No emoji console.logs in ProviderProfile.tsx
  - [ ] `businessPhone` field rejects strings like "not-a-phone" or "abc" with an inline error
  - [ ] `website` field rejects strings like "google.com" (no protocol) or "not a url" with an inline error
  - [ ] Empty `website` field (blank) is still valid
  - [ ] No TypeScript errors

---

**[FORM-005] Frontend: ProviderSchedule.tsx — remove debug logs + add real-time validation + overlap detection**
- **Assigned to**: senior-eng-1
- **Status**: pending
- **File**: `src/pages/provider/ProviderSchedule.tsx`
- **Description**: ProviderSchedule has debug console.logs at ~lines 218, 234, 280, 317 that log schedule state changes. Time validation (end time > start time) exists at submit only — there is no real-time feedback as the provider types. There is also no detection of overlapping time slots on the same day (e.g. two Monday slots 09:00-12:00 and 11:00-14:00).

**What to do:**
1. **Remove debug console.logs** at lines ~218, ~234, ~280, ~317 — these log schedule slot state. Remove all of them
2. **Add real-time end-time validation**: On the end time input, add an `onChange` or `onBlur` handler that immediately checks `endTime > startTime`. If invalid, show an inline `<p className="text-sm text-red-500">End time must be after start time</p>` below the end time field. Clear the error when the condition is satisfied. Do NOT wait until submit to show this error
3. **Add overlap detection on save**: Before calling the save API, check if any two slots for the same `dayOfWeek` have overlapping time ranges. Two slots overlap if `slot1.startTime < slot2.endTime && slot2.startTime < slot1.endTime`. If an overlap is found, show a toast: "Time slots on [day name] overlap — please adjust the times" and block submission. Do not silently save overlapping slots

- **Acceptance criteria**:
  - [ ] Debug console.logs removed
  - [ ] Changing end time to be before start time shows inline error immediately (no submit needed)
  - [ ] Saving overlapping slots on the same day shows a toast and blocks the API call
  - [ ] Valid slots still save correctly
  - [ ] No TypeScript errors

---

**[FORM-006] Frontend: ProviderServices.tsx — add missing validation rules**
- **Assigned to**: senior-eng-1
- **Status**: pending
- **File**: `src/pages/provider/ProviderServices.tsx`
- **Description**: The service form has good validation for most fields but is missing constraints on `maxBookingsPerDay`, price upper bound, and duration upper bound — allowing providers to submit nonsensical values (e.g. price of £9,999,999 or duration of 99,999 minutes).

**What to do:**
1. **`maxBookingsPerDay` validation**: This field currently has no validation rules. Add:
   - Required (must be set when the field is shown)
   - Integer only (no decimals)
   - Min: 1 (at least 1 booking per day)
   - Max: 50 (reasonable upper limit)
   - Inline error: "Must be a whole number between 1 and 50"
2. **Price upper limit**: Add a max constraint: `price: z.number().min(0, 'Price cannot be negative').max(10000, 'Price cannot exceed £10,000')`. Currently only a min of 0 exists
3. **Duration upper limit**: Add a max constraint: `duration: z.number().min(5, 'Minimum 5 minutes').max(480, 'Maximum 8 hours (480 minutes)')`. Currently no max exists, allowing e.g. duration: 99999
4. Show all new validation errors inline below their fields

- **Acceptance criteria**:
  - [ ] `maxBookingsPerDay` of 0 or 51 shows an inline error
  - [ ] `maxBookingsPerDay` accepts 1 through 50
  - [ ] Price above £10,000 shows inline error
  - [ ] Duration above 480 minutes shows inline error
  - [ ] Existing validation (price ≥ 0, duration ≥ 5) still works
  - [ ] No TypeScript errors

---

**[FORM-007] Frontend: BookingForm.tsx — remove console.error + add date/slot/notes validation**
- **Assigned to**: senior-eng-1
- **Status**: pending
- **File**: `src/components/booking/BookingForm.tsx`
- **Description**: BookingForm has a `console.error('Booking error:', error)` at ~line 104 that exposes error details to the console. It also allows selecting past dates, does not validate that the selected time slot is not already booked (the `bookedSlots` array is populated but never checked in `handleSubmit`), and does not trim the `notes` field before submission.

**What to do:**
1. **Remove `console.error`** at ~line 104. The booking error is already shown as a toast — the console.error is redundant and may expose internal error details
2. **Add past-date validation**: Before submitting, check that the selected date is today or in the future. If the date is in the past, show a toast: "Please select a future date" and block submission. Also, if the date picker allows past dates to be selected in the UI, add a `minDate` or `disabled` prop to prevent selecting them
3. **Validate selected slot against `bookedSlots`**: The component already has a `bookedSlots` array. In `handleSubmit`, before calling the booking API, check if `selectedTimeSlot` is in `bookedSlots`. If it is, show a toast: "This time slot is already booked — please choose another" and block submission. This prevents race conditions where the slot was booked by another user between page load and submission
4. **Trim `notes` before submission**: Change `notes: data.notes` to `notes: data.notes?.trim()` in the API payload

- **Acceptance criteria**:
  - [ ] `console.error` at ~line 104 removed
  - [ ] Selecting a past date and submitting shows an error toast and blocks the API call
  - [ ] Selecting an already-booked time slot and submitting shows an error toast and blocks the API call
  - [ ] `notes` is trimmed before being sent to the API
  - [ ] Valid bookings (future date, available slot) still submit correctly
  - [ ] No TypeScript errors

---

## Sprint 6 — Providers Page UI Improvements (2026-02-21)

---

**[PROV-001] Frontend: Make provider cards more compact**
- **Assigned to**: senior-eng-1
- **Status**: pending
- **File**: `src/pages/Providers.tsx`
- **Description**: The provider cards are too tall. Reduce the size of every element so more cards fit in the viewport without scrolling.

**What to change** (all changes within the `providers.map(...)` card JSX):
1. **Business image banner**: reduce from `h-32` → `h-20`
2. **Blue header section**: reduce from `px-4 py-3` → `px-3 py-2`
3. **Avatar circle**: reduce from `w-10 h-10` → `w-8 h-8`
4. **Business name**: reduce from `text-lg` → `text-sm font-semibold`
5. **Category text**: reduce from `text-sm` → `text-xs`
6. **CardContent**: reduce from `p-4` with `space-y-3` → `p-3` with `space-y-2`
7. **Description**: keep `text-sm line-clamp-2` but reduce to `line-clamp-1` to save height
8. **Grid gap**: reduce from `gap-6` → `gap-4`
9. **Loading skeleton**: reduce `Skeleton className="h-48 w-full"` → `h-28 w-full` to match new banner height

- **Acceptance criteria**:
  - [ ] Cards are visibly more compact (less vertical height per card)
  - [ ] All card content still readable (name, category, location, rating, button)
  - [ ] 3-column grid still applies at lg breakpoint
  - [ ] Loading skeletons match new card proportions
  - [ ] No TypeScript errors

---

**[PROV-002] Frontend: Show business image inside the circular avatar badge**
- **Assigned to**: senior-eng-1
- **Status**: pending
- **File**: `src/pages/Providers.tsx` (~lines 457-471)
- **Description**: The card header currently has two separate elements: (1) a `h-32` banner image above the blue header, and (2) a small circular avatar inside the blue header that shows either a `profilePhoto` or a letter badge. The user wants the business image to appear in the circular avatar. Remove the separate banner image and instead display `businessImage` (falling back to `profilePhoto`, then falling back to the letter) inside the circular badge.

**What to change**:
1. **Remove the business image banner** — remove the entire `<img src={provider.businessImage || '/placeholder.svg'} ... className="w-full h-20 object-cover" />` block (after PROV-001 this is `h-20`, originally `h-32`)
2. **Update the avatar circle** — change the avatar logic to show the businessImage first, then profilePhoto, then the letter:
   ```tsx
   <div className="flex-shrink-0">
     {(provider.businessImage || provider.profilePhoto) ? (
       <img
         src={provider.businessImage || provider.profilePhoto}
         alt={provider.businessName}
         className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
       />
     ) : (
       <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
         <span className="text-white font-semibold text-sm">
           {provider.businessName?.charAt(0)?.toUpperCase() || 'P'}
         </span>
       </div>
     )}
   </div>
   ```
   Note: if PROV-001 reduced the avatar to `w-8 h-8`, apply the same size here — keep consistent with PROV-001
3. **Also update the loading skeleton** — remove the top `Skeleton className="h-28 w-full"` (the banner skeleton) since there is no longer a banner

- **Acceptance criteria**:
  - [ ] No separate banner image above the blue header
  - [ ] Circular avatar shows `businessImage` when available
  - [ ] Falls back to `profilePhoto` when no businessImage
  - [ ] Falls back to first-letter badge when neither image exists
  - [ ] Card layout looks clean without the banner (blue header starts immediately)
  - [ ] No TypeScript errors

---

**[PROV-003] Frontend: Make business name clickable — navigate to provider detail**
- **Assigned to**: senior-eng-1
- **Status**: pending
- **File**: `src/pages/Providers.tsx` (~lines 472-478)
- **Description**: The business name (`<h3>`) in the card header is plain text. Make it a clickable element that navigates to the provider detail page, the same way the "View Profile" button does.

**What to change**:
1. Wrap the business name text in a `<button>` that calls `handleViewProvider(provider._id)`:
   ```tsx
   <button
     onClick={() => handleViewProvider(provider._id)}
     className="font-semibold text-sm truncate flex items-center gap-1.5 text-left hover:underline cursor-pointer"
   >
     {provider.businessName || 'Business Name'}
     {(provider as { isVerified?: boolean }).isVerified === true && (
       <Verified className="w-4 h-4 text-white/90 flex-shrink-0" />
     )}
   </button>
   ```
2. The `<h3>` wrapper can be kept or replaced — the important thing is the name text itself is clickable and shows `cursor-pointer` + `hover:underline` to signal it is a link
3. The "View Profile" button at the bottom of the card stays — both the name and the button navigate to the same place

- **Acceptance criteria**:
  - [ ] Clicking the business name navigates to `/provider/:id` (or triggers login redirect if unauthenticated)
  - [ ] Cursor changes to pointer on hover over the name
  - [ ] Hover shows underline on the name text
  - [ ] Verified badge still appears next to the name
  - [ ] "View Profile" button still works as before
  - [ ] No TypeScript errors

---

**[PROV-004] Frontend: Show map always on top above the provider list (remove List/Map toggle)**
- **Assigned to**: senior-eng-1
- **Status**: pending
- **File**: `src/pages/Providers.tsx`
- **Description**: Currently the map is a toggle — users see either the map OR the list. The user wants the map to always be visible at the top of the page, with the provider list shown below it. Remove the List/Map toggle buttons entirely and render both map and list simultaneously.

**What to change**:
1. **Remove the `viewMode` state** — delete `const [viewMode, setViewMode] = useState<'list' | 'map'>('list')`
2. **Remove the List/Map toggle buttons** — delete the entire `<div className="flex items-center border rounded-md overflow-hidden">` block containing the `ViewList` and `Map` icon buttons (~lines 360-381)
3. **Remove the `ViewList` and `Map` icon imports** from `@mui/icons-material` (lines 38-39) if not used elsewhere
4. **Move the map above the list** — change the render order so the map renders first, then the provider grid below it. The map should always be visible regardless of whether there are results
5. **Reduce map height** — change from `h-[600px]` to `h-[350px]` so it takes less space when shown alongside the list
6. **Remove the `viewMode === 'map'` and `viewMode === 'list'` conditions** — always render both sections:
   ```tsx
   {/* Map — always visible */}
   {(() => {
     const mappable = providers.filter(p => p.coordinates?.lat && p.coordinates?.lng);
     // ... existing map logic
     return (
       <div className="mb-6">
         {/* existing MapContainer with h-[350px] */}
       </div>
     );
   })()}

   {/* Provider list — always visible below map */}
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
     {providers.map(...)}
   </div>
   ```
7. Keep the "N providers not shown on map" notice — it's still useful

- **Acceptance criteria**:
  - [ ] Map is always visible at the top of the results area (no toggle needed)
  - [ ] Provider card list is always visible below the map
  - [ ] Map height is `h-[350px]` (not `h-[600px]`)
  - [ ] List/Map toggle buttons are gone
  - [ ] `viewMode` state is removed
  - [ ] Applying filters updates both map pins and list simultaneously
  - [ ] "N providers not shown on map" notice still appears when applicable
  - [ ] No TypeScript errors

---

## Sprint 7 — MyBookings Page Redesign (2026-02-21)

> **Design Analysis — MyBookings.tsx (Client View)**
>
> **What it does well:**
> - Splits upcoming vs completed bookings into separate sections (good IA)
> - AlertDialog for cancel confirmation (safe destructive action)
> - Review CTA on completed bookings (good post-visit flow)
> - Header shows avatar + count badges (useful summary)
>
> **What makes it look amateur:**
>
> 1. **Every section is a blue-header card** — the page is 3 stacked blue bars (header, upcoming, completed). This "blue bar → white content → blue bar → white content" rhythm is monotonous and looks like a dashboard admin template, not a consumer booking app. Professional booking apps (Calendly, Treatwell, Acuity) use white/neutral page headers with color used sparingly for accents.
>
> 2. **`border-l-4` booking items** — thick left-bordered rows were a Material Design v1 pattern (~2015). Modern booking UIs use discrete cards with rounded corners, subtle borders, and a status badge/pill rather than a colored bar.
>
> 3. **`opacity-75` on completed bookings** — makes the entire section look broken/disabled. Users may think the page failed to load. Professional apps use full opacity with a muted badge (e.g. "Completed" in gray pill) to distinguish past from active.
>
> 4. **Header card is heavy** — a full-width blue card with avatar + counts feels like an entire "page hero" for what is essentially a list page. Calendly and Treatwell use a simple `h1 + subtitle` text header with filter tabs below — no card, no background.
>
> 5. **No tabs or filter** — upcoming and completed are two separate card sections requiring scroll. Professional apps use tabs (Upcoming | Past | Cancelled) so users can switch views without scrolling past an empty section.
>
> 6. **Status shown 3 different ways** — the `getStatusBadge()` function exists but is never called. Instead, status is shown via: (a) a colored dot + uppercase text label, (b) the `border-l-4` color, and (c) different section placement. Pick one.
>
> 7. **No "Book Again" on completed** — a common pattern in booking apps. Users who completed a service should be able to rebook with one click.
>
> 8. **Notes section uses a different visual language** — `bg-blue-50 border-l-2` nested inside `bg-gray-50 border-l-4` creates a double-border visual that looks unpolished.
>
> **Proposed Theme: Clean white card layout with tab navigation**
> Move away from the "blue header card" pattern used everywhere else. MyBookings should feel like a personal space — lighter, calmer, with white backgrounds and color used only for status badges and CTAs. Think: Notion task list, Linear issues, Calendly upcoming.

---

### MYBOOKINGS REDESIGN TASKS

---

**[BOOK-001] MyBookings: Replace blue-bar card header with a clean text header + summary stats**
- **Assigned to**: senior-eng-1
- **Status**: pending
- **File**: `src/pages/MyBookings.tsx` (lines 167-197)
- **Description**: The current header is a full-width Card with a blue `#025bae` header strip containing an avatar, "My Bookings" title, and badge counts. This pattern is used on every page in the app — it makes MyBookings feel indistinguishable from Dashboard, Messages, etc. Replace with a lighter, more personal header.
- **What to replace it with**:
  1. Remove the entire `<Card>` wrapper around the header. Replace with a simple flex container:
     ```tsx
     <div className="flex items-center justify-between mb-6">
       <div>
         <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
         <p className="text-gray-500 text-sm mt-1">Manage your appointments and service history</p>
       </div>
       <div className="flex items-center gap-3">
         <div className="text-center px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
           <p className="text-2xl font-bold text-primary">{upcomingBookings.length}</p>
           <p className="text-xs text-gray-500">Upcoming</p>
         </div>
         <div className="text-center px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
           <p className="text-2xl font-bold text-gray-700">{completedBookings.length}</p>
           <p className="text-xs text-gray-500">Completed</p>
         </div>
       </div>
     </div>
     ```
  2. Remove the Avatar from the header — it's already shown in the global nav; duplicating it here is redundant.
  3. Remove the inline `fontFamily` style.
- **Acceptance criteria**:
  - [ ] Header is a simple text heading + stat boxes, no blue card
  - [ ] Avatar removed from header
  - [ ] No inline `fontFamily`
  - [ ] Count stats are visible and accurate
  - [ ] No TypeScript errors

---

**[BOOK-002] MyBookings: Replace blue section headers with tab navigation (Upcoming | Completed | Cancelled)**
- **Assigned to**: senior-eng-1
- **Status**: pending
- **Blocked by**: BOOK-001
- **File**: `src/pages/MyBookings.tsx` (lines 200-386)
- **Description**: Currently, "Upcoming Appointments" and "Completed Appointments" are two separate cards with blue headers, requiring the user to scroll past one to see the other. If upcoming is empty, the user sees a big empty card before reaching completed. Replace with a tab bar.
- **What to do**:
  1. Add a `const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming')` state.
  2. Add a third filter for cancelled/no-show bookings:
     ```ts
     const cancelledBookings = bookings?.filter(b =>
       b.status === 'cancelled' || b.status === 'no_show'
     ) || [];
     ```
  3. Replace both blue-header `<Card>` sections with a single section:
     ```tsx
     {/* Tab bar */}
     <div className="flex items-center gap-1 border-b border-gray-200 mb-6">
       {[
         { id: 'upcoming', label: 'Upcoming', count: upcomingBookings.length },
         { id: 'completed', label: 'Completed', count: completedBookings.length },
         { id: 'cancelled', label: 'Cancelled', count: cancelledBookings.length },
       ].map(tab => (
         <button
           key={tab.id}
           onClick={() => setActiveTab(tab.id)}
           className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
             activeTab === tab.id
               ? 'border-primary text-primary'
               : 'border-transparent text-gray-500 hover:text-gray-700'
           }`}
         >
           {tab.label}
           {tab.count > 0 && (
             <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
               activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'
             }`}>
               {tab.count}
             </span>
           )}
         </button>
       ))}
     </div>

     {/* Tab content */}
     <div className="space-y-3">
       {activeTab === 'upcoming' && (/* render upcoming list or empty state */)}
       {activeTab === 'completed' && (/* render completed list or empty state */)}
       {activeTab === 'cancelled' && (/* render cancelled list or empty state */)}
     </div>
     ```
  4. Remove the two separate `<Card>` wrappers with blue headers. The booking items themselves are rendered directly, no wrapping card needed.
  5. Add a cancelled empty state: "No cancelled bookings — that's a good sign!"
- **Acceptance criteria**:
  - [ ] Tab bar with Upcoming, Completed, Cancelled tabs
  - [ ] Active tab shows count badge and underline in primary color
  - [ ] Switching tabs shows the correct bookings
  - [ ] No blue section header cards remain
  - [ ] Cancelled tab shows cancelled + no_show bookings
  - [ ] Each tab has an empty state
  - [ ] No TypeScript errors

---

**[BOOK-003] MyBookings: Replace `border-l-4` booking items with modern discrete cards**
- **Assigned to**: senior-eng-1
- **Status**: pending
- **Blocked by**: BOOK-002
- **File**: `src/pages/MyBookings.tsx`
- **Description**: Replace the thick-left-bordered rows with clean individual cards. This is the core visual change that makes the page feel modern.
- **What each booking card should look like**:
  ```tsx
  <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-all duration-150">
    {/* Row 1: Status + Date */}
    <div className="flex items-center justify-between mb-3">
      <Badge variant="outline" className={statusClasses}>
        {statusIcon} {statusLabel}
      </Badge>
      <span className="text-sm text-gray-500">
        {format(parseISO(booking.appointment_date), 'EEE, MMM d, yyyy')}
      </span>
    </div>

    {/* Row 2: Service name (large) */}
    <h3 className="font-semibold text-gray-900 text-base mb-1">{booking.service?.name}</h3>

    {/* Row 3: Provider link */}
    <p className="text-sm text-gray-500 mb-3">
      <Link to={`/provider/${booking.provider?.id}`} className="text-primary hover:underline">
        {booking.provider?.business_name}
      </Link>
    </p>

    {/* Row 4: Time + Price + Actions */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <span className="flex items-center gap-1">
          <Schedule className="w-4 h-4 text-gray-400" />
          {booking.appointment_time}
        </span>
        <span className="font-medium text-gray-900">${booking.total_price}</span>
      </div>
      {/* CTA buttons: Cancel (upcoming) or Review (completed) */}
    </div>

    {/* Notes (if present) */}
    {booking.notes && (
      <div className="mt-3 px-3 py-2 bg-gray-50 rounded-md text-xs text-gray-600">
        <strong>Notes:</strong> {booking.notes}
      </div>
    )}
  </div>
  ```
- **Key changes from current**:
  1. `bg-white rounded-lg border border-gray-200` instead of `bg-gray-50 border-l-4`
  2. No inline `borderLeftColor` styles
  3. Status shown as a `<Badge>` (use the existing `getStatusBadge()` function, which is currently defined but never used)
  4. Date formatted with day name: `EEE, MMM d, yyyy` → "Fri, Feb 21, 2026"
  5. Notes section: `bg-gray-50 rounded-md` instead of `bg-blue-50 border-l-2`
  6. Remove `opacity-75` from completed bookings — use full opacity with a muted badge
  7. Icons use `text-gray-400` instead of `text-primary` — keeps the cards neutral, color only on CTAs
- **Acceptance criteria**:
  - [ ] Booking items are `rounded-lg border` cards, not `border-l-4` rows
  - [ ] No inline `style` on booking items (no `borderLeftColor`, no `color: '#025bae'`)
  - [ ] Status shown via the `getStatusBadge()` function
  - [ ] Completed bookings at full opacity
  - [ ] Notes section uses `bg-gray-50 rounded-md`
  - [ ] Date includes day name
  - [ ] No TypeScript errors

---

**[BOOK-004] MyBookings: Add "Book Again" button on completed bookings**
- **Assigned to**: senior-eng-1
- **Status**: pending
- **Blocked by**: BOOK-003
- **File**: `src/pages/MyBookings.tsx`
- **Description**: Completed bookings currently show only "Leave Review" (or "Reviewed ✓"). Add a "Book Again" button that navigates to the provider's detail page, where the user can rebook.
- **What to do**:
  1. Next to the "Leave Review" button on completed bookings, add:
     ```tsx
     <Button
       size="sm"
       variant="outline"
       className="text-xs"
       onClick={() => navigate(`/provider/${booking.provider?.id}`)}
     >
       Book Again
     </Button>
     ```
  2. Group both buttons in a `flex gap-2` container.
  3. If the provider id is missing, don't show "Book Again".
- **Acceptance criteria**:
  - [ ] Completed bookings show a "Book Again" button
  - [ ] Clicking "Book Again" navigates to `/provider/:id`
  - [ ] "Leave Review" still works alongside "Book Again"
  - [ ] Button not shown if `booking.provider?.id` is falsy
  - [ ] No TypeScript errors

---

**[BOOK-005] MyBookings: Improve empty states to be actionable and on-brand**
- **Assigned to**: senior-eng-1
- **Status**: pending
- **Blocked by**: BOOK-002
- **File**: `src/pages/MyBookings.tsx`
- **Description**: Current empty states use a gray icon and generic text with no CTA button. Make them actionable and domain-specific.
- **What to change**:
  1. **Upcoming empty state**:
     ```tsx
     <div className="py-12 text-center">
       <CalendarToday className="w-12 h-12 text-primary/20 mx-auto mb-4" />
       <h3 className="text-base font-medium text-gray-900 mb-1">No upcoming appointments</h3>
       <p className="text-sm text-gray-500 mb-4">Browse our services to find a mechanic near you</p>
       <Button onClick={() => navigate('/services')} className="bg-primary hover:bg-primary/90">
         Browse Services
       </Button>
     </div>
     ```
  2. **Completed empty state**:
     ```tsx
     <div className="py-12 text-center">
       <CheckCircle className="w-12 h-12 text-primary/20 mx-auto mb-4" />
       <h3 className="text-base font-medium text-gray-900 mb-1">No completed services yet</h3>
       <p className="text-sm text-gray-500">Your service history will appear here after your first visit</p>
     </div>
     ```
  3. **Cancelled empty state** (new, for BOOK-002):
     ```tsx
     <div className="py-12 text-center">
       <Close className="w-12 h-12 text-primary/20 mx-auto mb-4" />
       <h3 className="text-base font-medium text-gray-900 mb-1">No cancelled bookings</h3>
       <p className="text-sm text-gray-500">That's a good sign — keep it up!</p>
     </div>
     ```
- **Key changes**: icons use `text-primary/20` not `text-gray-400`, copy is car-domain-specific, CTAs are buttons not links.
- **Acceptance criteria**:
  - [ ] Upcoming empty state has "Browse Services" button
  - [ ] Icons use `text-primary/20`
  - [ ] Copy mentions car/mechanic/service domain
  - [ ] Cancelled empty state exists and has friendly copy
  - [ ] No TypeScript errors

---

**[BOOK-006] MyBookings: Update loading skeleton to match new card layout**
- **Assigned to**: senior-eng-1
- **Status**: pending
- **Blocked by**: BOOK-001, BOOK-003
- **File**: `src/pages/MyBookings.tsx` (lines 108-144)
- **Description**: The current loading skeleton shows blue-header cards, which no longer match the redesigned layout (text header + tabs + white cards). Update the skeleton to match.
- **What to replace it with**:
  ```tsx
  <div className="min-h-screen bg-gray-50 py-8">
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Skeleton className="h-7 w-40 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-16 w-20 rounded-lg" />
            <Skeleton className="h-16 w-20 rounded-lg" />
          </div>
        </div>
        {/* Tab skeleton */}
        <Skeleton className="h-10 w-80 mb-6" />
        {/* Booking card skeletons */}
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex justify-between mb-3">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-5 w-48 mb-2" />
            <Skeleton className="h-4 w-32 mb-3" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
  ```
- **Acceptance criteria**:
  - [ ] Loading skeleton matches the text header + tab + card layout
  - [ ] No blue header bars in the skeleton
  - [ ] Skeleton cards look like the actual booking cards
  - [ ] No TypeScript errors

---

### TECH LEAD REVIEW

---

**[TL-011] Review and prioritize MyBookings redesign tasks**
- **Assigned to**: tech-lead
- **Status**: pending
- **Description**: Review BOOK-001 through BOOK-006. Recommended implementation order:
  1. **BOOK-001** (clean text header) — removes the blue card header
  2. **BOOK-002** (tab navigation) — replaces the two blue section headers
  3. **BOOK-003** (modern cards) — replaces border-l-4 items
  4. **BOOK-005** (empty states) — depends on tabs existing
  5. **BOOK-004** (Book Again button) — small addition
  6. **BOOK-006** (skeleton update) — final polish
- **Acceptance criteria**:
  - [ ] Tasks reviewed and assigned
  - [ ] Implementation order confirmed
  - [ ] Engineers notified via inbox
