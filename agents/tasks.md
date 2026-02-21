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
- **Status**: review
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
- **Status**: review
- **Covers**: UX-003 change request
- **File**: `src/pages/Home.tsx` (~lines 25-30)
- **What to fix**: Category tiles show fabricated counts ("500+", "300+", etc.). Remove the count line (`<p className="text-xs text-gray-500">{category.count} services</p>`) and the `count` property from the categories array.
- **Acceptance criteria**:
  - [ ] No fake service counts visible on Home category tiles
  - [ ] Category tiles still show name and icon correctly
  - [ ] No TypeScript errors

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
