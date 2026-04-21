---
gsd_state_version: 1.0
milestone: v0.28.0
milestone_name: Browser-Enforced Resource Isolation
status: Shipped — milestone archived
stopped_at: "v0.28.0 complete: 10 phases, 10 plans, 32 tasks; 65/65 REQ-IDs satisfied; milestone audit passed; ROADMAP/REQUIREMENTS/audit + 10 phase directories archived to .planning/milestones/v0.28.0-*; PROJECT.md updated; tag pending."
last_updated: "2026-04-21T10:35:00.000Z"
last_activity: 2026-04-21
progress:
  total_phases: 10
  completed_phases: 10
  total_plans: 10
  completed_plans: 10
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-21)

**Core value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.
**Current focus:** v0.28.0 shipped — ready for `/gsd:new-milestone`

## Current Position

Phase: — (no active phase)
Plan: —
Status: Shipped — milestone archived
Last activity: 2026-04-21 — v0.28.0 milestone archived

Progress: [██████████] 100% (10/10 phases of v0.28.0 complete and archived)

## Accumulated Context

### Decisions (carried from prior milestones)

- PRINCIPLE: NUBs define protocol surface + potentialities; implementation UX is a shell concern
- PRINCIPLE: NUB packages own ALL logic (types, shim installers, SDK helpers); central shim/sdk are thin hosts
- PRINCIPLE: `@napplet/*` is private; never listed as implementations in public specs/docs
- v0.26.0: Consolidated `@napplet/nub-*` packages into single `@napplet/nub` with 34 subpath exports; deprecated packages ship as 1-line re-export shims for one release cycle
- v0.27.0: Runtime API surface uses IFC terminology (`window.napplet.ifc`, `@napplet/sdk` `ifc` export); hard break, no backward-compat alias
- v0.28.0: Browser-enforced isolation via strict CSP; single `resource.bytes(url)` primitive with scheme-pluggable URL space; `data:` decoded inline; sidecar pre-resolution opt-in default OFF for privacy; shell-side SVG rasterization MUST; `perm:strict-csp` capability orthogonal to `nub:resource`; demos delegated to downstream shell repo (Option B)

### Pending Todos

None — v0.28.0 archived, ready for `/gsd:new-milestone`.

### Blockers/Concerns

- CARRIED: npm publish blocked on human npm auth (PUB-04 from prior milestones)
- CARRIED: NIP number conflict with Scrolls PR#2281 (RES-01 from v0.12.0 era)
- CARRIED: Manual cross-repo PR opening for the 4 napplet/nubs drafts (NUB-RESOURCE + NUB-RELAY/IDENTITY/MEDIA amendments) — drafts authored in `.planning/milestones/v0.28.0-phases/132-cross-repo-nubs-prs/drafts/`; user creates branches, pushes, opens PRs

## Session Continuity

Last session: 2026-04-21T10:35:00.000Z
Stopped at: v0.28.0 milestone archive complete (ROADMAP collapsed, REQUIREMENTS deleted, 10 phase directories moved to milestones/v0.28.0-phases/, audit + roadmap + requirements snapshots in milestones/)
Resume: `/gsd:new-milestone` to start v0.29.0
