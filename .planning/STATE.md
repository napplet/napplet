---
gsd_state_version: 1.0
milestone: v0.4.0
milestone_name: Feature Negotiation & Service Discovery
status: verifying
stopped_at: All phases discussed
last_updated: "2026-03-31T17:55:50.099Z"
last_activity: 2026-03-31
progress:
  total_phases: 6
  completed_phases: 5
  total_plans: 19
  completed_plans: 19
  percent: 17
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-31)

**Core value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.
**Current focus:** Phase 22 — negotiation-compatibility

## Current Position

Phase: 22.1
Plan: Not started
Status: Phase complete — ready for verification
Last activity: 2026-03-31

Progress: [██░░░░░░░░] 17%

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

### Roadmap Evolution

- Phase 22.1 inserted after Phase 22: Core Infrastructure Services — Migrate relay pool, cache, signer from RuntimeHooks to registered services (URGENT)

### Pending Todos

None yet.

### Blockers/Concerns

- CARRIED: npm publish still blocked on human npm auth. Deferred to post-v0.4.0 per REQUIREMENTS.md.
- RESOLVED: Phase 18 replanned with handleMessage(windowId, message, send) interface per Phase 19 D-01. Services receive raw NIP-01 arrays, respond via send callback.

## Session Continuity

Last session: 2026-03-31T16:48:41.481Z
Stopped at: All phases discussed
Resume file: .planning/phases/22.1-core-infrastructure-services/22.1-CONTEXT.md
