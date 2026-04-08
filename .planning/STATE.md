---
gsd_state_version: 1.0
milestone: v0.18.0
milestone_name: Spec Conformance Audit
status: ready-to-plan
stopped_at: null
last_updated: "2026-04-08"
last_activity: 2026-04-08
progress:
  total_phases: 4
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-08)

**Core value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol -- and ship the spec + SDK so others can build on it.
**Current focus:** v0.18.0 Phase 83 (Dead Code Removal)

## Current Position

Phase: 1 of 4 (Phase 83: Dead Code Removal)
Plan: 0 of 0 in current phase
Status: Ready to plan
Last activity: 2026-04-08 -- Roadmap created for v0.18.0

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: --
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.

- v0.17.0: Namespaced shell.supports() with nub:/perm:/svc: prefixes -- replaces flat NubDomain | string
- v0.17.0: No backward compatibility -- unreleased monorepo, clean breaks only
- v0.17.0: legacy.ts deletion is safe -- DESTRUCTIVE_KINDS already migrated to nub-signer
- v0.17.0: Dead code removal + backward compat removal combined into one phase (both are deletions)

### Blockers/Concerns

- CARRIED: npm publish blocked on human npm auth (PUB-04). Run `npm login` then `pnpm publish-packages`.
- NIP number conflict with Scrolls PR#2281 (RES-01) -- unresolved, carry forward.

## Session Continuity

Last session: 2026-04-08
Stopped at: Roadmap created for v0.18.0 Spec Conformance Audit
Resume: `/gsd:plan-phase 83` to plan the first phase
