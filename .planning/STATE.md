---
gsd_state_version: 1.0
milestone: v0.26.0
milestone_name: Better Packages
status: executing
stopped_at: Completed 117-02-PLAN.md
last_updated: "2026-04-19T13:06:54.384Z"
last_activity: 2026-04-19
progress:
  total_phases: 5
  completed_phases: 0
  total_plans: 3
  completed_plans: 2
  percent: 67
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-19)

**Core value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.
**Current focus:** Phase 117 — @napplet/nub Package Foundation

## Current Position

Phase: 117 (@napplet/nub Package Foundation) — EXECUTING
Plan: 3 of 3
Status: Ready to execute
Last activity: 2026-04-19

Progress: [███████░░░] 67%

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
- v0.26.0 (Phase 117-01): Enforce EXP-04 by omitting `.` from exports AND omitting top-level main/module/types fields — belt-and-suspenders making root import unresolvable by design
- v0.26.0 (Phase 117-01): `@napplet/nub` tsconfig extends `../../tsconfig.json` (2 levels), not `../../../` — packages/nub/ sits directly under packages/, unlike packages/nubs/<domain>/ which is 3 levels deep
- v0.26.0 (Phase 117-02): Theme NUB is types-only today (index.ts + types.ts only). Total @napplet/nub exports = 34, not 36. Phantom `./theme/shim` and `./theme/sdk` entries removed from Plan 117-01's package.json + tsup.config.ts in the same commit as the 34-file source copy. Option A selected at checkpoint — matches upstream reality, preserves Phase 117 "no behavioral migration" boundary. Supersedes the earlier v0.26.0 "36 subpath exports" decision above.
- v0.26.0 (Phase 117-02): registerNub asymmetry preserved — 8/9 domain barrels call `registerNub(DOMAIN, ...)` (identity, ifc, keys, media, notify, relay, storage, theme); config stays side-effect-free (integration happens in central shim per @napplet/nub-config pattern). Theme barrel registers normally.

### Blockers/Concerns

- CARRIED: npm publish blocked on human npm auth (PUB-04).
- CARRIED: NIP number conflict with Scrolls PR#2281 (RES-01) — unresolved.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260419-i6c | Republish napplet packages as 0.2.1 with resolved workspace:* deps | 2026-04-19 | ec677fb | [260419-i6c-republish-napplet-packages-as-0-2-1-with](./quick/260419-i6c-republish-napplet-packages-as-0-2-1-with/) |

## Session Continuity

Last session: 2026-04-19T13:06:54.381Z
Stopped at: Completed 117-02-PLAN.md
Resume: Run `/gsd:execute-phase 117` to execute plan 3 of 3 (first build of @napplet/nub via tsup).
