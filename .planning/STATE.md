---
gsd_state_version: 1.0
milestone: v0.24.0
milestone_name: Identity NUB + Kill NIP-07
status: planning
stopped_at: Roadmap created for v0.24.0 (6 phases, 16 requirements mapped)
last_updated: "2026-04-09T15:10:00.616Z"
last_activity: 2026-04-09
progress:
  total_phases: 6
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-09)

**Core value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol -- and ship the spec + SDK so others can build on it.
**Current focus:** v0.24.0 Identity NUB + Kill NIP-07 -- Phase 105 ready to plan

## Current Position

Phase: 105 (Kill NIP-07 + Signer) -- first of 6 phases
Plan: None yet -- ready to plan
Status: Ready to plan
Last activity: 2026-04-09

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

## Accumulated Context

### Decisions

- v0.24.0: Remove window.nostr entirely -- napplets never sign or encrypt
- v0.24.0: Delete signer NUB -- replaced by identity NUB (read-only)
- v0.24.0: Identity NUB: getPublicKey, getRelays, getProfile, getFollows, getList(type), getZaps, getMutes, getBlocked, getBadges
- v0.24.0: relay.publishEncrypted -- cleartext + recipient + method (NIP-44 default, NIP-04 supported)
- v0.24.0: Shell auto-decrypts incoming encrypted events before delivery
- v0.24.0: Security rationale: napplets are untrusted, crypto primitives enable data exfiltration

### Blockers/Concerns

- CARRIED: npm publish blocked on human npm auth (PUB-04).
- CARRIED: NIP number conflict with Scrolls PR#2281 (RES-01) -- unresolved.

## Session Continuity

Last session: 2026-04-09
Stopped at: Roadmap created for v0.24.0 (6 phases, 16 requirements mapped)
Resume: `/gsd:plan-phase 105` to begin Kill NIP-07 + Signer
