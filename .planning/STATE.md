---
gsd_state_version: 1.0
milestone: v0.4.0
milestone_name: Feature Negotiation & Service Discovery
status: executing
stopped_at: Phase 20 context gathered
last_updated: "2026-03-31T16:23:16.834Z"
last_activity: 2026-03-31 — Phase 18 replanned (handleMessage interface)
progress:
  total_phases: 5
  completed_phases: 0
  total_plans: 3
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
Plan: 3 plans in 2 waves
Status: Replanned — ready to execute
Last activity: 2026-03-31 — Phase 18 replanned (handleMessage interface)

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
- RESOLVED: Phase 18 replanned with handleMessage(windowId, message, send) interface per Phase 19 D-01. Services receive raw NIP-01 arrays, respond via send callback.

## Session Continuity

Last session: 2026-03-31T16:23:16.832Z
Stopped at: Phase 20 context gathered
Resume file: .planning/phases/20-concrete-services/20-CONTEXT.md
