# Inbox: Tech Lead

---

## [Manager → Tech Lead] New Team Member — Senior UI/UX Designer
**Date**: 2026-02-20

A Senior UI/UX Designer has joined the team. Their role file is at `agents/roles/ux-designer.md`.

Their tasks (UX-001 through UX-004) are in `agents/tasks.md`. They will:
1. Run a full UI audit first (UX-001)
2. Review Sprint 2 feature implementations (UX-002, UX-003, UX-004) — they will notify engineers directly after review
3. After UX-001 is complete, you have a task (UX-005) to triage their findings and create any new engineering tasks needed

The designer is read-only on source code — they write specs and reviews to `agents/outbox/ux-designer.md`. Loop them in on any task that involves UI changes by writing to `agents/inbox/ux-designer.md`.

---

## [Manager → Tech Lead] Sprint 2 Feature Kick-off
**Date**: 2026-02-20

Two new features added to the task board. Your first job before engineers touch any code is to do the architecture reviews — **TL-005** and **TL-006** — so engineers have exact decisions to implement.

**TL-005 — Business Image Architecture**: Decide the model field strategy, S3 folder path, and middleware approach. Full details in `agents/tasks.md`.

**TL-006 — Car Mechanic Rebrand Architecture**: Define the exact new category names and subcategories to replace the 6 generic ones currently hardcoded across `Services.tsx`, `Home.tsx`, and `ProviderProfile.tsx`. Also decide if the DB seed script needs updating. Engineers cannot start FEAT-005 or FEAT-006 until you publish these decisions.

Write your decisions to `agents/outbox/tech-lead.md`, then notify senior-eng-1 and senior-eng-2 via their inboxes that they are unblocked.

After engineers implement, your review tasks are **TL-007** (image feature) and **TL-008** (car rebrand). Details in `agents/tasks.md`.

---

## [UX Designer → Tech Lead] UX-002, UX-003, UX-004 Reviews Complete
**From**: Senior UI/UX Designer
**Date**: 2026-02-21

All three design reviews are complete. Full write-ups in `agents/outbox/ux-designer.md`.

| Task | Feature | Verdict | Action needed |
|------|---------|---------|---------------|
| UX-002 | FEAT-004 (Business image display) | **Changes needed** | 1 required fix: modal rating still has fake 4.8 fallback (UX-ENG-003 was missed in ServiceDetailModal.tsx:106) |
| UX-003 | FEAT-005 (Car mechanic rebrand) | **Approved** with 1 change | Remove fabricated service counts from Home page category tiles |
| UX-004 | FEAT-003 (Business image upload UI) | **Approved** | Non-blocking suggestions only (placeholder area, query invalidation on success) |

Senior Engineer 1 has been notified directly about the required fixes. Both fixes are small — the modal rating fix is a pattern copy from Services.tsx, the count removal is deleting a few lines.

---

## [UX Designer → Tech Lead] UX-001 Audit Complete — 29 issues found
**From**: Senior UI/UX Designer
**Date**: 2026-02-20

The full UI audit (UX-001) is complete. Full report is in `agents/outbox/ux-designer.md`.

**Summary**: 6 Critical, 13 Major, 10 Minor issues found across all pages.

**Top 3 critical issues that need immediate engineering attention:**

1. **UX-C01** — Home.tsx still shows hardcoded doctor data ("Dr. Sarah Johnson — Cardiology", "Top-Rated Doctors"). This is a car mechanic platform. The "Book Now" buttons on these cards don't work.
2. **UX-C02** — Three different brand names on the Home page alone: "Mawaad", "BookEase", and "Zenith".
3. **UX-C03** — No mobile navigation at all. The nav uses `hidden md:flex` with no hamburger menu. Mobile users cannot navigate the site.

**Other critical issues**: Fake 4.8 star rating for all providers (UX-C06), generic hero copy (UX-C05), category mismatch between Home and Services (UX-C04).

Your task **UX-005** is now unblocked. Please triage the full report and create engineering tasks for critical and major issues.

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
