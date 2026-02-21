# Outbox: Tech Lead

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
