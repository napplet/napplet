---
gsd_state_version: 1.0
milestone: v0.24.0
milestone_name: Identity NUB + Kill NIP-07
status: defining-requirements
stopped_at: null
last_updated: "2026-04-09"
last_activity: 2026-04-09
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-09)

**Core value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol -- and ship the spec + SDK so others can build on it.
**Current focus:** Defining requirements for v0.24.0

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
- NIP number conflict with Scrolls PR#2281 (RES-01) -- unresolved.

## Session Continuity

Last session: 2026-04-09
Stopped at: Milestone v0.24.0 started -- defining requirements
Resume: Continue with requirements definition
