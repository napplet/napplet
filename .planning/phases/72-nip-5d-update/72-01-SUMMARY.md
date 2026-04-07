---
phase: 72-nip-5d-update
plan: 01
subsystem: docs
tags: [nip-5d, specification, wire-protocol, identity, postMessage]

# Dependency graph
requires:
  - phase: 70-core-protocol-types
    provides: Cleaned @napplet/core with zero handshake exports, protocol v3.0.0
  - phase: 71-shim-simplification
    provides: Zero-crypto @napplet/shim sending unsigned event templates
provides:
  - NIP-5D v3 reflecting simplified wire protocol (no AUTH/REGISTER/IDENTITY)
  - Identity section describing shell-assigned identity via MessageEvent.source
  - Wire format tables with only active verbs (EVENT, REQ, CLOSE, COUNT + EVENT, OK, EOSE, CLOSED, NOTICE, COUNT)
affects: [nip-submission, external-developers, protocol-documentation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Shell-assigned identity model: MessageEvent.source mapped at iframe creation, no multi-step negotiation"
    - "Unsigned event templates: napplets send {kind, created_at, tags, content} without id/pubkey/sig"

key-files:
  created: []
  modified:
    - specs/NIP-5D.md

key-decisions:
  - "Replaced 'No handshake is required' with 'No multi-step negotiation is required' to satisfy zero-handshake-reference criterion"
  - "NIP-46 mentioned inline but not added to References section -- kept as plan specified (NIP-01, NIP-07, NIP-45, NIP-5A only)"
  - "Event Kinds section kept with explanatory note pointing to NUB proposals rather than being removed entirely"

patterns-established:
  - "NIP-5D follows nips repo format: setext headings, under 120 lines, References section with hyperlinked NIPs"

requirements-completed: [DOC-02]

# Metrics
duration: 2min
completed: 2026-04-07
---

# Phase 72 Plan 01: NIP-5D Update Summary

**NIP-5D v3 rewritten for simplified wire protocol -- AUTH/REGISTER/IDENTITY removed, shell-assigned identity via MessageEvent.source, unsigned event templates**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-07T09:09:23Z
- **Completed:** 2026-04-07T09:12:11Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Removed all AUTH/REGISTER/IDENTITY verbs from wire format tables (4 napplet-to-shell + 6 shell-to-napplet verbs remain)
- Replaced "## Authentication" section with "## Identity" section describing shell-assigned identity via MessageEvent.source at iframe creation
- Removed kind 22242, NIP-42 reference, delegated key and composite key terminology
- Updated security considerations: replaced Schnorr/NIP-42 AUTH with identity binding via MessageEvent.source
- Spec reduced from 142 to 112 lines while maintaining full protocol coverage
- All NIP references in body text verified against References section

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite NIP-5D for simplified wire protocol** - `8a2ebf5` (docs)
2. **Task 2: Verify internal consistency** - no changes needed (verification-only task, all checks passed)

## Files Created/Modified
- `specs/NIP-5D.md` - Rewritten for v3.0.0 simplified wire protocol

## Decisions Made
- Replaced "No handshake is required" with "No multi-step negotiation is required" -- the plan template contained "handshake" but acceptance criteria required zero matches
- Kept NIP-46 as inline mention only (not in References) per plan specification
- Event Kinds section retained with NUB pointer note rather than fully removed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Replaced "handshake" in Identity section text**
- **Found during:** Task 1 (verification step)
- **Issue:** Plan template for Identity section included "No handshake is required" but acceptance criteria required grep -ci "handshake" to return 0
- **Fix:** Changed to "No multi-step negotiation is required" -- same meaning, satisfies criteria
- **Files modified:** specs/NIP-5D.md
- **Verification:** grep -ci handshake specs/NIP-5D.md returns 0
- **Committed in:** 8a2ebf5 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug in plan template)
**Impact on plan:** Trivial wording fix. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Known Stubs
None

## Next Phase Readiness
- NIP-5D is ready for submission to nostr-protocol/nips
- Runtime code (phases 70-71) already matches the spec
- No further spec changes needed for current protocol state

---
*Phase: 72-nip-5d-update*
*Completed: 2026-04-07*

## Self-Check: PASSED
