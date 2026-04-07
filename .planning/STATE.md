---
gsd_state_version: 1.0
milestone: v0.16.0
milestone_name: Wire Format & NUB Architecture
status: verifying
stopped_at: Completed 79-01-PLAN.md
last_updated: "2026-04-07T13:46:17.165Z"
last_activity: 2026-04-07
progress:
  total_phases: 6
  completed_phases: 6
  total_plans: 10
  completed_plans: 10
  percent: 17
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-07)

**Core value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol -- and ship the spec + SDK so others can build on it.
**Current focus:** Phase 79 — Documentation Update

## Current Position

Phase: 79
Plan: Not started
Status: Phase complete — ready for verification
Last activity: 2026-04-07

Progress: [█░░░░░░░░░] 17%

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: --
- Total execution time: 0 hours

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.

- v0.16.0: Spec-first ordering -- NIP-5D rewrite before NUB specs before code changes
- v0.16.0: NIP-5D becomes transport+identity+manifest+NUB-negotiation only; no protocol messages
- v0.16.0: Generic JSON envelope `{ type, ...payload }` replaces NIP-01 arrays
- v0.16.0: NUB-IFC merges NUB-IPC + NUB-PIPES with dispatch (per-message ACL) and channel (ACL at open) modes
- v0.16.0: Runtime translation layer is kehto's concern, not this repo
- [Phase 78]: query() uses dedicated relay.query envelope instead of subscribe+collect+close
- [Phase 78]: state-shim sends storage.* messages directly (no IPC-PEER indirection)
- [Phase 78]: Non-NUB domains (keyboard, nostrdb) use local envelope types
- [Phase 78]: Domain constants aliased (RELAY_DOMAIN, SIGNER_DOMAIN) to avoid naming conflicts in SDK barrel export
- [Phase 79-documentation-update]: SDK README and root README updated for JSON envelope + NUB architecture without code changes
- [Phase 79-01]: BusKind legacy constants kept in README with explicit deprecated callout block - they still exist in code and need migration docs
- [Phase 79-01]: Full Wire Format section added to shim README (all outbound/inbound JSON envelope messages) as protocol reference ground truth

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260407-0i8 | Remove stale root files -- move RUNTIME-SPEC.md to kehto, skills to kehto, nub specs to nubs, delete PNGs and artifacts | 2026-04-07 | e16ed87 | [260407-0i8-remove-stale-root-files-from-napplet](.planning/quick/260407-0i8-remove-stale-root-files-from-napplet/) |
| Phase 78 P01 | 7min | 3 tasks | 8 files |
| Phase 78 P02 | 1min | 1 tasks | 3 files |
| Phase 79-documentation-update P02 | 3 | 2 tasks | 2 files |
| Phase 79-documentation-update P01 | 3 | 2 tasks | 2 files |

### Blockers/Concerns

- CARRIED: npm publish blocked on human npm auth (PUB-04). Run `npm login` then `pnpm publish-packages`.
- KEHTO-04 partial: kehto workspace override for @napplet/core pending npm publish.
- NIP number conflict with Scrolls PR#2281 (RES-01) -- unresolved, carry forward.
- Core type changes will break kehto downstream -- kehto must update after @napplet/core v0.16.0.
- **BLOCKING Phase 77+**: NUB specs (RELAY, SIGNER, STORAGE, IFC) live in nubs repo. Must be finalized before NUB module code can be written. User will seed current state when ready.

## Session Continuity

Last session: 2026-04-07T12:58:13.841Z
Stopped at: Completed 79-01-PLAN.md
Resume: `/gsd:plan-phase 75` (Package Architecture) or `/gsd:autonomous` to run 75-76
