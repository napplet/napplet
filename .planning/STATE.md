---
gsd_state_version: 1.0
milestone: v0.20.0
milestone_name: Keys NUB
status: completed
stopped_at: Completed 92-01-PLAN.md
last_updated: "2026-04-09T11:22:00Z"
last_activity: 2026-04-09
progress:
  total_phases: 5
  completed_phases: 5
  total_plans: 5
  completed_plans: 5
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-09)

**Core value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol -- and ship the spec + SDK so others can build on it.
**Current focus:** Phase 92 -- Documentation (complete)

## Current Position

Phase: 92 of 5 (documentation)
Plan: 1 of 1 complete
Status: All phases complete -- v0.20.0 ready for milestone closure
Last activity: 2026-04-09

Progress: [██████████] 100%

## Performance Metrics

**Velocity:**

- Total plans completed: 1
- Average duration: 2min
- Total execution time: 0.03 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 88-nub-type-package | 1 | 2min | 2min |

*Updated after each plan completion*
| Phase 89 P01 | 1min | 2 tasks | 2 files |
| Phase 90 P01 | 2min | 1 tasks | 0 files |
| Phase 91 P01 | 1min | 1 tasks | 1 files |
| Phase 92 P01 | 2min | 2 tasks | 1 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.

- v0.18.0: keyboard.forward marked for spec amendment (GAP-07)
- v0.18.0: keybind TOPICS (6) deferred -- may inform keys NUB design
- v0.19.0: All unspecced code removed from core -- clean baseline
- v0.20.0: Keys NUB follows NUB-KEYS spec at napplet/nubs#9
- v0.20.0: @napplet/nub-keys follows exact pattern of existing NUB packages (theme as template)
- [Phase 89]: Inline structural types used for keys namespace in NappletGlobal (core cannot depend on NUB packages)
- [Phase 90]: Verification-only plan -- cross-phase code validated against all acceptance criteria without changes
- [Phase 91]: Added keys.register() convenience to SDK -- combines registerAction + onAction + cleanup handle

### Blockers/Concerns

- CARRIED: npm publish blocked on human npm auth (PUB-04). Run `npm login` then `pnpm publish-packages`.
- CARRIED: NIP number conflict with Scrolls PR#2281 (RES-01) -- unresolved.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260409-gkz | Reformat napplet/nubs PR #9 body to match other NUB PR format | 2026-04-09 | n/a (no code) | [260409-gkz-reformat-napplet-nubs-pr-9-body-to-match](./quick/260409-gkz-reformat-napplet-nubs-pr-9-body-to-match/) |

## Session Continuity

Last session: 2026-04-09T11:22:00Z
Stopped at: Completed 92-01-PLAN.md
Resume: `/gsd:complete-milestone` to close v0.20.0
