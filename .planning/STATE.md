---
gsd_state_version: 1.0
milestone: v0.27.0
milestone_name: IFC Terminology Lock-In
status: ready-to-plan
stopped_at: Roadmap created (Phases 122-124)
last_updated: "2026-04-19T00:00:00.000Z"
last_activity: 2026-04-19
progress:
  total_phases: 3
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-19)

**Core value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.
**Current focus:** v0.27.0 IFC Terminology Lock-In — Phase 122 (Source Rename) ready to plan

## Current Position

Phase: 122 of 124 (Source Rename)
Plan: — (not yet planned)
Status: Ready to plan
Last activity: 2026-04-19 — Roadmap created for v0.27.0 (Phases 122-124)

Progress: [░░░░░░░░░░] 0%

## Phase Map

| Phase | Name | Requirements | Status |
|-------|------|--------------|--------|
| 122 | Source Rename | API-01, API-02, SRC-01 | Not started |
| 123 | Documentation Sweep | DOC-01, DOC-02, PLAN-01 | Not started |
| 124 | Verification & Sign-Off | VER-01, VER-02 | Not started |

## Performance Metrics

**Velocity:**
- Total plans completed (v0.27.0): 0
- Previous milestone (v0.26.0): 5 phases, 9 plans, ~2-3 min/plan average

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

Last session: 2026-04-19
Stopped at: Created ROADMAP.md for v0.27.0 (Phases 122-124) with 100% requirement coverage
Resume: Run `/gsd:plan-phase 122` to decompose Phase 122 (Source Rename) into plans. All 8 requirements mapped; traceability in REQUIREMENTS.md.
