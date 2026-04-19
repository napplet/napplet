---
gsd_state_version: 1.0
milestone: v0.27.0
milestone_name: IFC Terminology Lock-In
status: executing
stopped_at: Completed 123-01-PLAN.md (Phase 123 README Sweep)
last_updated: "2026-04-19T22:41:52.297Z"
last_activity: 2026-04-19
progress:
  total_phases: 3
  completed_phases: 1
  total_plans: 4
  completed_plans: 2
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-19)

**Core value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.
**Current focus:** Phase 123 — Documentation Sweep

## Current Position

Phase: 123 (Documentation Sweep) — EXECUTING
Plan: 2 of 3
Status: Ready to execute
Last activity: 2026-04-19

Progress: [██████████] 100%

## Phase Map

| Phase | Name | Requirements | Status |
|-------|------|--------------|--------|
| 122 | Source Rename | API-01, API-02, SRC-01 | Complete (ready for verification) |
| 123 | Documentation Sweep | DOC-01, DOC-02, PLAN-01 | Executing (Plan 01 complete; DOC-01 satisfied) |
| 124 | Verification & Sign-Off | VER-01, VER-02 | Not started |

## Performance Metrics

**Velocity:**

- Total plans completed (v0.27.0): 2
- Previous milestone (v0.26.0): 5 phases, 9 plans, ~2-3 min/plan average

| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 122   | 01   | 3min     | 5     | 6     |
| 123   | 01   | 7min     | 3     | 4     |

*Updated after each plan completion.*

## Accumulated Context

### Decisions (carried from prior milestones)

- PRINCIPLE: NUBs define protocol surface + potentialities; implementation UX is a shell concern
- PRINCIPLE: NUB packages own ALL logic (types, shim installers, SDK helpers); central shim/sdk are thin hosts
- PRINCIPLE: `@napplet/*` is private; never listed as implementations in public specs/docs
- v0.26.0: Consolidated `@napplet/nub-*` packages into single `@napplet/nub` with 34 subpath exports; deprecated packages ship as 1-line re-export shims for one release cycle
- v0.27.0: The NUB domain is already named `ifc` (`@napplet/nub/ifc`, `shell.supports('nub:ifc')`, NUB-IFC spec). This milestone renames the remaining developer-facing surface — `window.napplet.ipc`, `@napplet/sdk` `ipc` export, JSDoc, READMEs, skill file, and active planning docs.
- v0.27.0: Hard break — no backward-compat alias on `window.napplet.ipc` (confirmed at milestone kickoff).
- v0.27.0: Archived `.planning/milestones/` and `.planning/quick/` directories are left unchanged; they are historical record, not current docs.
- v0.27.0: Historical "Shipped: vX.Y.Z" changelog lines in READMEs that mention `IPC_PEER` as a past decision are history, not current docs — they stay.
- v0.27.0 Phase 122 Plan 01: Runtime API surface renamed ipc -> ifc across @napplet/core (NappletGlobal.ifc), @napplet/shim (installer key), @napplet/sdk (const ifc export), and @napplet/nub/ifc (requireIfc guard + Error string). Hard break, no alias. Localized build + type-check green across the 4 affected packages; zero IPC leakage across 6 in-scope source files.
- v0.27.0 Phase 123 Plan 01: Published READMEs (root + core + shim + sdk) swept to IFC terminology via 20 literal token-swap edits (23 raw line-deletions). Zero structural rewrites; preserved already-IFC-correct regions byte-stable (shim Wire Format code fences, sdk ifc.emit/ifc.event JSON envelope examples, IfcNubMessage type references, IFC_DOMAIN constant). No source, .planning/, or skills/ files touched. Zero-leakage grep across 4 READMEs passes (exit 1). DOC-01 satisfied.

### Pending Todos

None yet.

### Blockers/Concerns

- CARRIED: npm publish blocked on human npm auth (PUB-04).
- CARRIED: NIP number conflict with Scrolls PR#2281 (RES-01) — unresolved.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260419-i6c | Republish napplet packages as 0.2.1 with resolved workspace:* deps | 2026-04-19 | ec677fb | [260419-i6c-republish-napplet-packages-as-0-2-1-with](./quick/260419-i6c-republish-napplet-packages-as-0-2-1-with/) |

## Session Continuity

Last session: 2026-04-19T22:41:52.294Z
Stopped at: Completed 123-01-PLAN.md (Phase 123 README Sweep)
Resume: Phase 123 Plan 01 complete (DOC-01 satisfied). Plan 02 (skill sweep) runs in parallel Wave 1; Plan 03 (active planning) in Wave 2. Phase 124 verification after all Phase 123 plans ship.
