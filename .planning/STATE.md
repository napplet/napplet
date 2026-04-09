---
gsd_state_version: 1.0
milestone: v0.19.0
milestone_name: Spec Gap Drops
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
**Current focus:** Defining requirements for v0.19.0

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-04-09 — Milestone v0.19.0 started

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

- v0.18.0: 7 code items marked for drop (Capability, TOPICS superseded/config/relay, SHELL_BRIDGE_URI, REPLAY_WINDOW_SECONDS, PROTOCOL_VERSION)
- v0.18.0: 5 items deferred (future NUB topics, keybinds, wm, audio, nostrdb)
- v0.18.0: keyboard.forward marked for spec amendment

### Blockers/Concerns

- CARRIED: npm publish blocked on human npm auth (PUB-04). Run `npm login` then `pnpm publish-packages`.
- NIP number conflict with Scrolls PR#2281 (RES-01) -- unresolved, carry forward.

## Session Continuity

Last session: 2026-04-09
Stopped at: Milestone v0.19.0 started — defining requirements
Resume: Continue with requirements definition
