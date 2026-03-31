---
gsd_state_version: 1.0
milestone: v0.4.0
milestone_name: Feature Negotiation & Service Discovery
status: defining-requirements
stopped_at: Milestone started
last_updated: "2026-03-31"
last_activity: 2026-03-31
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-31)

**Core value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.
**Current focus:** Defining requirements for v0.4.0

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-03-31 — Milestone v0.4.0 started

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [v0.2.0]: Target architecture: acl -> core -> runtime -> shell (multi-shell support)
- [v0.3.0]: Service extension is design-only — stub interfaces, no implementation until v0.4.0
- [v0.3.0]: ServiceDescriptor, ServiceHandler, ServiceRegistry interfaces defined in @napplet/shell types
- [v0.3.0]: SPEC.md Section 11 defines kind 29010 service discovery protocol (OPEN status)
- [v0.3.0]: Two-layer model — ACL = permission, service discovery = availability

### Pending Todos

None yet.

### Blockers/Concerns

- CARRIED: npm publish still blocked on human npm auth. Deferred to v0.4.0+ per REQUIREMENTS.md.
