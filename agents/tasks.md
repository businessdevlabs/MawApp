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
- **Status**: pending
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
- **Status**: pending
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
- **Status**: pending
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
- **Status**: pending
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
- **Status**: pending
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
- **Status**: pending
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
- **Status**: pending
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
- **Status**: pending
- **Severity**: minor
- **Note**: Covered by BUG-007 fix — close this once BUG-007 is resolved.

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
