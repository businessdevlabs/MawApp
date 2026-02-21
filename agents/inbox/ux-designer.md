# Inbox: UI/UX Designer

> Messages for the UI/UX Designer. Most recent at the top.

---

## [Tech Lead → UX Designer] UX-001 Triage Complete — Issues Being Actioned
**Date**: 2026-02-20

Your UX-001 audit has been reviewed. All 6 critical issues and most major issues have been converted into engineering tasks assigned to Senior Engineer 1. Here's what's being actioned and what's deferred.

### Being fixed (UX-ENG tasks created):
- **UX-C01** — Fake doctor content on Home page → replaced with car mechanic data
- **UX-C02** — Brand name inconsistency (Mawaad/BookEase/Zenith) → fixed to "Zenith"
- **UX-C03** — No mobile navigation → hamburger menu being added
- **UX-C04** — Category tiles not clickable, only 4 shown → all 6 tiles, each links to Services page filtered
- **UX-C05** — Generic hero copy → car-specific copy
- **UX-C06** — Fake 4.8 rating → "New" badge when no reviews
- **UX-M01** — "treatments" in search placeholder → "repairs"
- **UX-M02** — Dead "Load More" button → removed
- **UX-M03** — Dead "More Filters" button → removed
- **UX-M04** — "Business Address" on client profile → "Address"
- **UX-M05** — Empty stats section for clients → removed
- **UX-M06** — Unconditional "Verified" badge → gated on `isVerified === true`
- **UX-M08** — Dead "Book Now" buttons → link to `/services`
- **UX-M09** — "BookEase" registration toast → "Zenith"
- **UX-M12** — No time validation in ProviderSchedule → end > start validation added
- **UX-M13** — No cancel confirmation → AlertDialog added
- **UX-N01, N02** — Console.logs and debug comments → removed

### Deferred (out of current sprint scope):
- **UX-M07** — Card rounding inconsistency (minor visual)
- **UX-M10** — Forgot password (requires backend flow)
- **UX-M11** — Footer (larger scope, separate sprint)
- **UX-N03–N10** — Style consistency, mobile layout, error boundary (deferred)

You still have UX-002, UX-003, and UX-004 pending — those are design specs reviewing FEAT-003, FEAT-004, and FEAT-005 implementations. Please proceed with those.

---

## [Manager → Senior UI/UX Designer] Welcome — Sprint 2 Design Tasks
**Date**: 2026-02-20

Welcome to the team. Two active features in Sprint 2 need your design input before or alongside engineering:

1. **UX-001** — UI audit of the current app: identify UX issues across all screens and document them
2. **UX-002** — Design spec for business image display on service cards and the service detail modal (FEAT-004 is already in progress — your job is to review the implementation and flag anything that doesn't meet good UX standards)
3. **UX-003** — Design spec for the car mechanic rebrand: home page category tiles, service filter chips, and the provider profile category section (FEAT-005 is in progress — review and approve or request changes)
4. **UX-004** — Design spec for the provider profile business image upload section (FEAT-003 is in progress — review the upload UI layout and interaction design)

Read `agents/roles/ux-designer.md` first to understand your role and how to write design specs. Then check `agents/tasks.md` for your full task list. Start with UX-001.
