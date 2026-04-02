---
gsd_state_version: 1.0
milestone: v0.8.0
milestone_name: Shim/SDK Split
status: executing
stopped_at: Phase 42 planned
last_updated: "2026-04-02T11:29:23.008Z"
last_activity: 2026-04-02 -- Phase 43 execution started
progress:
  total_phases: 4
  completed_phases: 2
  total_plans: 10
  completed_plans: 4
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-02 — Milestone v0.8.0 started)

**Core value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.
**Current focus:** Phase 43 — demo-test-migration

## Current Position

Phase: 43 (demo-test-migration) — EXECUTING
Plan: 1 of 3
Status: Executing Phase 43
Last activity: 2026-04-02 -- Phase 43 execution started

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**

- Total plans completed: 0 (v0.8.0)
- Average duration: --
- Total execution time: --

*Updated after each plan completion*

## Accumulated Context

### Roadmap Evolution

- v0.8.0 roadmap created: 4 phases (41-44), 17 requirements mapped
- Phase order: Shim Restructure (41) -> SDK Package (42) -> Demo & Test Migration (43) -> Documentation (44)
- Phase 41 is the largest (7 requirements) — namespacing + deprecation removal are tightly coupled
- Phase 42 depends on window.napplet shape being final from Phase 41

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260401-w49 | Fix KINDS.INTER_PANE regression and @napplet/runtime module resolution in demo | 2026-04-01 | ff91cb9 | [260401-w49-fix-kinds-inter-pane-regression-and-napp](.planning/quick/260401-w49-fix-kinds-inter-pane-regression-and-napp/) |

### Blockers/Concerns

- CARRIED: npm publish blocked on human npm auth. Target for future milestone.
- NOTE: RuntimeHooks/ShellHooks deprecated aliases must survive one release cycle before v0.9.0 removal (API-01, API-02)

## Session Continuity

Last session: 2026-04-02T12:00:00.000Z
Stopped at: Phase 42 planned
Resume file: .planning/phases/42-sdk-package/42-01-PLAN.md
