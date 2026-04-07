---
phase: 74-nip-5d-rewrite
plan: 01
subsystem: spec
tags: [nip-5d, json-envelope, wire-format, nub, transport, identity, manifest]

# Dependency graph
requires:
  - phase: 72-nip-5d-update
    provides: NIP-5D v3 with simplified wire protocol (AUTH/handshake removed)
provides:
  - NIP-5D v4 with generic JSON envelope wire format
  - Transport, identity, manifest, and NUB negotiation spec (no protocol messages)
  - NUB Extension Framework table defining 4 capability domains
affects: [75-nub-specifications, 76-core-envelope-types, 77-shim-envelope-migration, 78-documentation-update]

# Tech tracking
tech-stack:
  added: []
  patterns: ["domain.action type discriminant for JSON envelope messages"]

key-files:
  created: []
  modified: ["specs/NIP-5D.md"]

key-decisions:
  - "JSON envelope { type: domain.action, ...payload } replaces NIP-01 arrays as sole wire format"
  - "NIP-5D defines transport, identity, manifest, NUB negotiation only -- zero protocol messages"
  - "Sandbox attribute is allow-scripts only; shell MAY add more tokens per policy"
  - "NUB short names (relay, signer, storage, ifc) in manifest requires tags, not spec IDs"
  - "window.napplet.shell.supports() covers both NUB capabilities and sandbox permissions"
  - "Services keep separate API: window.napplet.services.has()"

patterns-established:
  - "domain.action: message type discriminant format for JSON envelope (e.g., relay.subscribe, signer.sign)"
  - "NUB-per-domain: each NUB owns a message domain and defines all type strings for it"

requirements-completed: [SPEC-01, SPEC-02, SPEC-03, SPEC-04]

# Metrics
duration: 2min
completed: 2026-04-07
---

# Phase 74 Plan 01: NIP-5D Rewrite Summary

**NIP-5D v4 rewritten as transport+identity+manifest+NUB-negotiation spec with generic JSON envelope { type, ...payload } wire format -- zero protocol message definitions, 122 lines**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-07T09:59:41Z
- **Completed:** 2026-04-07T10:02:04Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Replaced NIP-01 array wire format with generic JSON envelope `{ type: "domain.action", ...payload }`
- Removed all verb tables (EVENT/REQ/CLOSE/COUNT/OK/EOSE/CLOSED/NOTICE) and protocol message definitions
- Added Identity section with shell-assigned identity via MessageEvent.source (no handshake/AUTH)
- Added Manifest and NUB Negotiation section with requires tags and shell.supports() runtime query
- Added NUB Extension Framework table defining 4 domains: relay, signer, storage, ifc
- Passed all 8 internal consistency checks (no NIP-01 remnants, no stale refs, correct section order)

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite NIP-5D spec** - `08176ce` (feat)
2. **Task 2: Verify spec internal consistency** - verification-only, all 8 checks passed, no changes needed

## Files Created/Modified
- `specs/NIP-5D.md` - Complete rewrite: transport+identity+manifest+NUB-negotiation spec (122 lines)

## Decisions Made
- JSON envelope `{ type: "domain.action", ...payload }` is the sole wire format (per CONTEXT.md)
- Sandbox MUST says `allow-scripts` only; additional tokens are shell policy (per CONTEXT.md D: Sandbox Policy)
- NIP-42 and NIP-45 removed from References (AUTH removed in v0.15.0; COUNT is NUB-RELAY concern)
- NIP-46 mentioned inline without hyperlink (not a core dependency, just a signer variant)
- Short NUB names in requires tags (`relay` not `NUB-RELAY`) per CONTEXT.md D: NUB Negotiation
- Services API (`window.napplet.services.has()`) kept separate from shell.supports() per CONTEXT.md

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- NIP-5D v4 is the foundation for Phase 75 (NUB Specifications)
- The 4 NUB domains (relay, signer, storage, ifc) and domain.action type format are defined and ready for NUB spec authoring
- No blockers for Phase 75

## Self-Check: PASSED

- specs/NIP-5D.md: FOUND
- .planning/phases/74-nip-5d-rewrite/74-01-SUMMARY.md: FOUND
- Commit 08176ce: FOUND
- No stubs detected

---
*Phase: 74-nip-5d-rewrite*
*Completed: 2026-04-07*
