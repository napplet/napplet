---
gsd_state_version: 1.0
milestone: v0.17.0
milestone_name: Capability Cleanup
status: defining-requirements
last_updated: "2026-04-08"
last_activity: 2026-04-08
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-08)

**Core value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol -- and ship the spec + SDK so others can build on it.
**Current focus:** Defining requirements for v0.17.0

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-04-08 — Milestone v0.17.0 started

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.

- v0.17.0: Namespaced shell.supports() with nub:/perm:/svc: prefixes — replaces flat NubDomain | string
- v0.17.0: No backward compatibility — unreleased monorepo, clean breaks only
- v0.17.0: legacy.ts deletion is safe — DESTRUCTIVE_KINDS already migrated to nub-signer

### Blockers/Concerns

- CARRIED: npm publish blocked on human npm auth (PUB-04). Run `npm login` then `pnpm publish-packages`.
- NIP number conflict with Scrolls PR#2281 (RES-01) -- unresolved, carry forward.

## Session Continuity

Last session: 2026-04-08
Stopped at: Defining requirements
Resume: Continue milestone setup
