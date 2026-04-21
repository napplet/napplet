---
gsd_state_version: 1.0
milestone: v0.29.0
milestone_name: NUB-CONNECT + Shell as CSP Authority
status: executing
stopped_at: Completed 135-01-PLAN.md (NUB-CLASS track authoring)
last_updated: "2026-04-21T12:46:31.210Z"
last_activity: 2026-04-21 -- Plan 135-02 complete (NIP-5D NUB-neutral amendment)
progress:
  total_phases: 8
  completed_phases: 0
  total_plans: 4
  completed_plans: 2
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-21)

**Core value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.
**Current focus:** Phase 135 — Cross-Repo Spec Work

## Current Position

Phase: 135 (Cross-Repo Spec Work) — EXECUTING
Plan: 1 of 4 (Plan 02 complete in parallel Wave 1)
Status: Executing Phase 135
Last activity: 2026-04-21 -- Plan 135-02 complete (NIP-5D NUB-neutral amendment)

## Phase Map (v0.29.0)

| Phase | Name | Requirements | Depends On |
|-------|------|--------------|------------|
| 135 | Cross-Repo Spec Work | SPEC-01..05, NIP5D-01, NIP5D-02 | — |
| 136 | Core Type Surface | CORE-01..03 | — |
| 137 | `@napplet/nub/connect` Subpath Scaffold | NUB-01..07 | 136 |
| 138 | `@napplet/vite-plugin` Surgery | VITE-01..10 | 136, 137 (shared normalizer) |
| 139 | Central Shim + SDK Integration | SHIM-01, SHIM-02, SDK-01 | 137 |
| 140 | `specs/SHELL-CONNECT-POLICY.md` | POLICY-01..10 | 135 |
| 141 | Documentation Sweep | DOC-01..07 | 138, 139 |
| 142 | Verification & Milestone Close | VER-01..10 | all prior |

**Critical path:** 136 → 137 → 139 → 141 → 142.
**Parallel lanes:** 135 (spec) + 140 (policy doc) + 136/137/138 (code) can overlap.

## Accumulated Context

### Decisions (carried from prior milestones)

- PRINCIPLE: NUBs define protocol surface + potentialities; implementation UX is a shell concern
- PRINCIPLE: NUB packages own ALL logic (types, shim installers, SDK helpers); central shim/sdk are thin hosts
- PRINCIPLE: `@napplet/*` is private; never listed as implementations in public specs/docs
- v0.26.0: Consolidated `@napplet/nub-*` packages into single `@napplet/nub` with 34 subpath exports; deprecated packages ship as 1-line re-export shims for one release cycle
- v0.27.0: Runtime API surface uses IFC terminology (`window.napplet.ifc`, `@napplet/sdk` `ifc` export); hard break, no backward-compat alias
- v0.28.0: Browser-enforced isolation via strict CSP; single `resource.bytes(url)` primitive with scheme-pluggable URL space; `data:` decoded inline; sidecar pre-resolution opt-in default OFF for privacy; shell-side SVG rasterization MUST; `perm:strict-csp` capability orthogonal to `nub:resource`; demos delegated to downstream shell repo (Option B)
- v0.29.0: Shell is sole runtime CSP authority (every napplet). Two new NUBs: NUB-CLASS (abstract posture authority via wire `class.assigned`, `window.napplet.class`, owns `NUB-CLASS-$N` sub-track) and NUB-CONNECT (user-gated direct network access via manifest `connect` tags, self-sufficient `window.napplet.connect.{granted,origins}` surface). Napplet-class distinction removed entirely from NIP-5D into NUB-CLASS's sub-track. Class-1 = strict baseline; Class-2 = user-approved explicit-origin CSP; each defined as its own doc (`NUB-CLASS-1.md`, `NUB-CLASS-2.md`). Inline scripts forbidden for all napplets under the unified CSP model. Grants keyed on `(dTag, aggregateHash)` with `connect` origins folded into aggregateHash via synthetic `connect:origins` entry. NUBs expose independent runtime surfaces (no cross-NUB state collapse); cross-NUB invariants documented as shell responsibilities.

### Open Decisions for Plan Phases

Surfaced by research (informational — each belongs to a specific phase plan):

1. Inline-script detection: parse5/htmlparser2 dev-dep vs zero-dep regex — Phase 138
2. `packages/vite-plugin/src/csp.ts`: delete vs retain dev-only helper vs split-by-concern — Phase 138
3. `strictCsp` option: hard-remove vs `@deprecated` accept-but-warn for one cycle — Phase 138
4. Inline-script diagnostic: warn vs hard-error (design leans hard-error) — Phase 138
5. `sdk.ts` for connect: omit (types-only like theme) vs readonly getters — Phase 137
6. Meta tag name: `napplet-connect-granted` (verbose, recommended) vs terse — Phase 137
7. NIP-5D amendment: one-line pointer vs richer section (design leans one-line) — Phase 135
8. IPv6 literal / bare IPv4 acceptance in origin format — Phase 137/138

### Pending Todos

- Start Phase 135 via `/gsd:plan-phase 135`

### Blockers/Concerns

- CARRIED: npm publish blocked on human npm auth (PUB-04 from prior milestones)
- CARRIED: NIP number conflict with Scrolls PR#2281 (RES-01 from v0.12.0 era)
- CARRIED: Manual cross-repo PR opening — v0.29.0 adds a NUB-CONNECT draft PR to the existing pattern; human creates branch, pushes, opens PR (Phase 135)

## Session Continuity

Last session: 2026-04-21T12:46:31.207Z
Stopped at: Completed 135-01-PLAN.md (NUB-CLASS track authoring)
Resume: Plans 135-03 (NUB-CONNECT) and 135-04 (zero-grep hygiene + phase commit) remain
