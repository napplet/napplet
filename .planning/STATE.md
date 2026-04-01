---
gsd_state_version: 1.0
milestone: v0.8.0
milestone_name: Shim/SDK Split
status: planning
stopped_at: defining requirements
last_updated: "2026-04-02T00:00:00.000Z"
last_activity: 2026-04-02
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-01 — Milestone v0.7.0 started)

**Core value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.
**Current focus:** Planning next milestone (v0.8.0)

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-04-02 — Milestone v0.8.0 started

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**

- Total plans completed: 0 (v0.7.0)
- Average duration: —
- Total execution time: —

*Updated after each plan completion*

## Accumulated Context

### Roadmap Evolution

- v0.7.0 roadmap created: 6 phases (34-39), 17 requirements mapped
- Phase order: TERM (34) -> WIRE (35) -> TYPE (36) -> API (37) -> SESS (38) -> DOC (39)
- TERM pass is largest blast radius (87+ occurrences across 19 files)
- TYPE fixes happen before API rename to avoid compounding type errors

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260401-w49 | Fix KINDS.INTER_PANE regression and @napplet/runtime module resolution in demo | 2026-04-01 | ff91cb9 | [260401-w49-fix-kinds-inter-pane-regression-and-napp](.planning/quick/260401-w49-fix-kinds-inter-pane-regression-and-napp/) |

### Blockers/Concerns

- CARRIED: npm publish blocked on human npm auth. Target for future milestone.
- NOTE: `napp-state:` localStorage migration requires dual-read fallback (TERM-02)
- NOTE: RuntimeHooks/ShellHooks deprecated aliases must survive one release cycle before v0.9.0 removal (API-01, API-02)

## Session Continuity

Last session: 2026-04-01T19:43:20.419Z
Stopped at: Phase 37 context gathered
Resume file: .planning/phases/37-api-alignment/37-CONTEXT.md
