---
gsd_state_version: 1.0
milestone: v0.20.0
milestone_name: Keys NUB
status: ready-to-plan
stopped_at: null
last_updated: "2026-04-09"
last_activity: 2026-04-09
progress:
  total_phases: 5
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-09)

**Core value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol -- and ship the spec + SDK so others can build on it.
**Current focus:** Phase 88 -- NUB Type Package

## Current Position

Phase: 88 (1 of 5 in v0.20.0) -- NUB Type Package
Plan: --
Status: Ready to plan
Last activity: 2026-04-09 -- Roadmap created for v0.20.0 Keys NUB

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: --
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.

- v0.18.0: keyboard.forward marked for spec amendment (GAP-07)
- v0.18.0: keybind TOPICS (6) deferred -- may inform keys NUB design
- v0.19.0: All unspecced code removed from core -- clean baseline
- v0.20.0: Keys NUB follows NUB-KEYS spec at napplet/nubs#9

### Blockers/Concerns

- CARRIED: npm publish blocked on human npm auth (PUB-04). Run `npm login` then `pnpm publish-packages`.
- CARRIED: NIP number conflict with Scrolls PR#2281 (RES-01) -- unresolved.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260409-gkz | Reformat napplet/nubs PR #9 body to match other NUB PR format | 2026-04-09 | n/a (no code) | [260409-gkz-reformat-napplet-nubs-pr-9-body-to-match](./quick/260409-gkz-reformat-napplet-nubs-pr-9-body-to-match/) |

## Session Continuity

Last session: 2026-04-09
Stopped at: Roadmap created for v0.20.0 Keys NUB (5 phases, 88-92)
Resume: `/gsd:plan-phase 88` to plan NUB Type Package
