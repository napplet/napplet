---
gsd_state_version: 1.0
milestone: v0.29.0
milestone_name: NUB-CONNECT + Shell as CSP Authority
status: Defining requirements
stopped_at: ""
last_updated: "2026-04-21T11:00:00.000Z"
last_activity: 2026-04-21
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-21)

**Core value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.
**Current focus:** v0.29.0 NUB-CONNECT + Shell as CSP Authority — defining requirements

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-04-21 — Milestone v0.29.0 started

## Accumulated Context

### Decisions (carried from prior milestones)

- PRINCIPLE: NUBs define protocol surface + potentialities; implementation UX is a shell concern
- PRINCIPLE: NUB packages own ALL logic (types, shim installers, SDK helpers); central shim/sdk are thin hosts
- PRINCIPLE: `@napplet/*` is private; never listed as implementations in public specs/docs
- v0.26.0: Consolidated `@napplet/nub-*` packages into single `@napplet/nub` with 34 subpath exports; deprecated packages ship as 1-line re-export shims for one release cycle
- v0.27.0: Runtime API surface uses IFC terminology (`window.napplet.ifc`, `@napplet/sdk` `ifc` export); hard break, no backward-compat alias
- v0.28.0: Browser-enforced isolation via strict CSP; single `resource.bytes(url)` primitive with scheme-pluggable URL space; `data:` decoded inline; sidecar pre-resolution opt-in default OFF for privacy; shell-side SVG rasterization MUST; `perm:strict-csp` capability orthogonal to `nub:resource`; demos delegated to downstream shell repo (Option B)
- v0.29.0: Shell is sole runtime CSP authority (every napplet, not just network-access ones); NUB-CONNECT expresses user-gated direct network access via manifest `connect` tags; napplet-class distinction (Class 1 strict / Class 2 network-access) delegated out of NIP-5D into the NUBs track; inline scripts forbidden for all napplets under the unified CSP model; grants keyed on `(dTag, aggregateHash)` with `connect` origins folded into aggregateHash via a synthetic `connect:origins` entry

### Pending Todos

None for v0.29.0 yet — roadmap pending.

### Blockers/Concerns

- CARRIED: npm publish blocked on human npm auth (PUB-04 from prior milestones)
- CARRIED: NIP number conflict with Scrolls PR#2281 (RES-01 from v0.12.0 era)
- CARRIED: Manual cross-repo PR opening — v0.29.0 will add a NUB-CONNECT draft PR to the existing pattern; human creates branch, pushes, opens PR

## Session Continuity

Last session: 2026-04-21T11:00:00.000Z
Stopped at: v0.29.0 started; PROJECT.md updated with Current Milestone section
Resume: continue `/gsd:new-milestone` workflow (research decision → requirements → roadmap)
