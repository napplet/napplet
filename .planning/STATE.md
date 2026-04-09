---
gsd_state_version: 1.0
milestone: v0.21.0
milestone_name: NUB Modularization
status: defining-requirements
stopped_at: null
last_updated: "2026-04-09"
last_activity: 2026-04-09
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-09)

**Core value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol -- and ship the spec + SDK so others can build on it.
**Current focus:** Defining requirements for v0.21.0

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-04-09 — Milestone v0.21.0 started

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: —
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.

- v0.21.0: NUB packages must contain ALL domain logic — types, shim installer, SDK helpers
- v0.21.0: Shim and SDK become plugin hosts with registration hooks
- v0.21.0: Adding/removing a NUB requires zero source edits to shim or SDK

### Blockers/Concerns

- CARRIED: npm publish blocked on human npm auth (PUB-04). Run `npm login` then `pnpm publish-packages`.
- NIP number conflict with Scrolls PR#2281 (RES-01) -- unresolved, carry forward.

## Session Continuity

Last session: 2026-04-09
Stopped at: Milestone v0.21.0 started — defining requirements
Resume: Continue with requirements definition
