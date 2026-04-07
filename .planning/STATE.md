---
gsd_state_version: 1.0
milestone: v0.15.0
milestone_name: Protocol Simplification
status: executing
stopped_at: Roadmap created for v0.15.0 (4 phases, 15 requirements)
last_updated: "2026-04-07T09:14:01.791Z"
last_activity: 2026-04-07
progress:
  total_phases: 4
  completed_phases: 3
  total_plans: 3
  completed_plans: 3
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-07)

**Core value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol -- and ship the spec + SDK so others can build on it.
**Current focus:** Phase 72 — NIP-5D Update

## Current Position

Phase: 73
Plan: Not started
Status: Executing Phase 72
Last activity: 2026-04-07

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: —
- Total execution time: 0 hours

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.

- v0.15.0: Napplets send unsigned messages; shell identifies via message.source at iframe creation time
- v0.15.0: RT-01..RT-04 manifest in @napplet as core type removals; runtime stamping logic lives in kehto

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260407-0i8 | Remove stale root files — move RUNTIME-SPEC.md to kehto, skills to kehto, nub specs to nubs, delete PNGs and artifacts | 2026-04-07 | e16ed87 | [260407-0i8-remove-stale-root-files-from-napplet](.planning/quick/260407-0i8-remove-stale-root-files-from-napplet/) |

### Blockers/Concerns

- CARRIED: npm publish blocked on human npm auth (PUB-04). Run `npm login` then `pnpm publish-packages`.
- KEHTO-04 partial: kehto workspace override for @napplet/core pending npm publish.
- NIP number conflict with Scrolls PR#2281 (RES-01) -- unresolved, carry forward.
- Core type changes will break kehto downstream -- kehto must update after @napplet/core v0.15.0.

## Session Continuity

Last session: 2026-04-07
Stopped at: Roadmap created for v0.15.0 (4 phases, 15 requirements)
Resume: /gsd:plan-phase 70
