---
gsd_state_version: 1.0
milestone: v0.4.0
milestone_name: Feature Negotiation & Service Discovery
status: planning
stopped_at: Phase 18 context gathered
last_updated: "2026-03-31T15:47:29.703Z"
last_activity: 2026-03-31 — Roadmap created for v0.4.0
progress:
  total_phases: 5
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-31)

**Core value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.
**Current focus:** Phase 18 — Core Types & Runtime Dispatch

## Current Position

Phase: 18 of 22 (Core Types & Runtime Dispatch)
Plan: — (not yet planned)
Status: Ready to plan
Last activity: 2026-03-31 — Roadmap created for v0.4.0

Progress: [..........] 0%

## Performance Metrics

**Velocity:**

- Total plans completed: 0 (this milestone)
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [v0.2.0]: Target architecture: acl -> core -> runtime -> shell (multi-shell support)
- [v0.3.0]: Service extension is design-only — stub interfaces, no implementation until v0.4.0
- [v0.3.0]: ServiceDescriptor, ServiceHandler, ServiceRegistry interfaces defined in @napplet/shell types
- [v0.3.0]: SPEC.md Section 11 defines kind 29010 service discovery protocol (OPEN status)
- [v0.3.0]: Two-layer model — ACL = permission, service discovery = availability
- [v0.4.0]: ServiceDescriptor moves to @napplet/core; ServiceHandler/ServiceRegistry move to @napplet/runtime
- [v0.4.0]: Audio topic migration (shell:audio-* to audio:*) must be backwards-compatible with dual-prefix handling

### Pending Todos

None yet.

### Blockers/Concerns

- CARRIED: npm publish still blocked on human npm auth. Deferred to post-v0.4.0 per REQUIREMENTS.md.

## Session Continuity

Last session: 2026-03-31T15:47:29.700Z
Stopped at: Phase 18 context gathered
Resume file: .planning/phases/18-core-types-runtime-dispatch/18-CONTEXT.md
