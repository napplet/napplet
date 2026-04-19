---
gsd_state_version: 1.0
milestone: v0.26.0
milestone_name: Better Packages
status: ready_to_plan
stopped_at: "Roadmap drafted — Phase 117 ready to plan"
last_updated: "2026-04-19T00:00:00.000Z"
last_activity: 2026-04-19
progress:
  total_phases: 5
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-19)

**Core value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.
**Current focus:** v0.26.0 Better Packages — consolidate 9 `@napplet/nub-*` packages into single tree-shakable `@napplet/nub` with layered subpath exports.

## Current Position

Phase: 117 of 121 (@napplet/nub Package Foundation)
Plan: —
Status: Ready to plan
Last activity: 2026-04-19 — Roadmap drafted; 22 requirements mapped to 5 phases (117-121)

Progress: [░░░░░░░░░░] 0%

## Accumulated Context

### Decisions (carried from prior milestones)

- v0.25.0: NUB-CONFIG is per-napplet schema-driven config (inverts the dropped v0.19.0 shell:config-* topics)
- v0.25.0: Schema format = JSON Schema (draft-07+)
- v0.25.0: Shell is sole writer; napplet reads/subscribes/requests-settings-open only
- v0.25.0: Value access pattern = subscribe-live (initial snapshot + push updates)
- v0.25.0: Schema declaration = manifest (authoritative, via vite-plugin) + runtime config.registerSchema (escape hatch)
- v0.25.0: Standardized JSON Schema extensions as potentialities: `x-napplet-secret`, `x-napplet-section`, `x-napplet-order`
- v0.25.0: MUST-level guarantees: values validate, defaults apply, storage scoped by (dTag, aggregateHash), shell is sole writer
- PRINCIPLE: NUBs define protocol surface + potentialities; implementation UX is a shell concern
- PRINCIPLE: NUB packages own ALL logic (types, shim installers, SDK helpers); central shim/sdk are thin hosts
- PRINCIPLE: `@napplet/*` is private; never listed as implementations in public specs/docs
- v0.26.0: Consolidate 9 `@napplet/nub-*` packages into single `@napplet/nub` with 36 subpath exports (9 barrels + 27 granular)
- v0.26.0: No root `@napplet/nub` import — consumers MUST use a domain subpath (prevents whole-tree imports)
- v0.26.0: Deprecated packages ship as 1-line re-export shims for one release cycle (removal deferred to later milestone)

### Blockers/Concerns

- CARRIED: npm publish blocked on human npm auth (PUB-04).
- CARRIED: NIP number conflict with Scrolls PR#2281 (RES-01) — unresolved.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260419-i6c | Republish napplet packages as 0.2.1 with resolved workspace:* deps | 2026-04-19 | ec677fb | [260419-i6c-republish-napplet-packages-as-0-2-1-with](./quick/260419-i6c-republish-napplet-packages-as-0-2-1-with/) |

## Session Continuity

Last session: 2026-04-19T00:00:00Z
Stopped at: Roadmap drafted for v0.26.0 (Phases 117-121). 22 requirements mapped 1:1 to phases with full coverage.
Resume: Run `/gsd:plan-phase 117` to plan the `@napplet/nub` package foundation.
