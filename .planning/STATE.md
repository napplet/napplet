---
gsd_state_version: 1.0
milestone: v0.16.0
milestone_name: Wire Format & NUB Architecture
status: Ready to plan
stopped_at: Roadmap created, ready to plan Phase 74
last_updated: "2026-04-07T00:00:00.000Z"
last_activity: 2026-04-07
progress:
  total_phases: 5
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-07)

**Core value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol -- and ship the spec + SDK so others can build on it.
**Current focus:** v0.16.0 Wire Format & NUB Architecture -- Phase 74 (NIP-5D Rewrite)

## Current Position

Phase: 74 (1 of 5) — NIP-5D Rewrite
Plan: --
Status: Ready to plan
Last activity: 2026-04-07 -- Roadmap created for v0.16.0

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: --
- Total execution time: 0 hours

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.

- v0.16.0: Spec-first ordering -- NIP-5D rewrite before NUB specs before code changes
- v0.16.0: NIP-5D becomes transport+identity+manifest+NUB-negotiation only; no protocol messages
- v0.16.0: Generic JSON envelope `{ type, ...payload }` replaces NIP-01 arrays
- v0.16.0: NUB-IFC merges NUB-IPC + NUB-PIPES with dispatch (per-message ACL) and channel (ACL at open) modes
- v0.16.0: Runtime translation layer is kehto's concern, not this repo

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260407-0i8 | Remove stale root files -- move RUNTIME-SPEC.md to kehto, skills to kehto, nub specs to nubs, delete PNGs and artifacts | 2026-04-07 | e16ed87 | [260407-0i8-remove-stale-root-files-from-napplet](.planning/quick/260407-0i8-remove-stale-root-files-from-napplet/) |

### Blockers/Concerns

- CARRIED: npm publish blocked on human npm auth (PUB-04). Run `npm login` then `pnpm publish-packages`.
- KEHTO-04 partial: kehto workspace override for @napplet/core pending npm publish.
- NIP number conflict with Scrolls PR#2281 (RES-01) -- unresolved, carry forward.
- Core type changes will break kehto downstream -- kehto must update after @napplet/core v0.16.0.

## Session Continuity

Last session: 2026-04-07
Stopped at: Roadmap created for v0.16.0 (5 phases, 14 requirements)
Resume: `/gsd:plan-phase 74`
