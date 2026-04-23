---
phase: 73-sdk-readme-update
plan: 01
subsystem: docs
tags: [readme, nip-5d, protocol-v3, no-crypto]

# Dependency graph
requires:
  - phase: 70-core-protocol-types
    provides: Removed AUTH_KIND, BusKind.REGISTRATION, updated PROTOCOL_VERSION to 3.0.0
  - phase: 71-shim-simplification
    provides: Removed nostr-tools from shim, eliminated AUTH handshake
  - phase: 72-nip-5d-update
    provides: NIP-5D spec updated for v3.0.0 simplified wire protocol
provides:
  - All 5 READMEs accurately reflect v0.15.0 no-crypto wire protocol
  - NIP-5D links replace all RUNTIME-SPEC.md references
  - Core README documents current BusKind enum and PROTOCOL_VERSION 3.0.0
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - packages/shim/README.md
    - packages/sdk/README.md
    - packages/core/README.md
    - README.md
    - packages/vite-plugin/README.md

key-decisions:
  - "Shim README Dependencies row changed from nostr-tools (peer) to None (types from @napplet/core) to match actual package.json"
  - "Root README Architecture diagram uses Identity via message.source instead of NIP-42 AUTH handshake"

patterns-established: []

requirements-completed: [DOC-03]

# Metrics
duration: 5min
completed: 2026-04-07
---

# Phase 73 Plan 01: SDK README Update Summary

**All 5 package READMEs updated to reflect v0.15.0 no-crypto wire protocol: removed AUTH/keypair/nostr-tools/NIP-42 references, added message.source identity model, replaced RUNTIME-SPEC.md links with NIP-5D**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-07T09:18:08Z
- **Completed:** 2026-04-07T09:22:56Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Eliminated all stale AUTH handshake, nostr-tools, keypair, NIP-42 references from shim, sdk, and root READMEs
- Updated core README to match actual exports: no AUTH_KIND, no BusKind.REGISTRATION, PROTOCOL_VERSION 3.0.0, BusKind.IPC_PEER
- Replaced all RUNTIME-SPEC.md links with NIP-5D references across all 5 READMEs
- Updated vite-plugin README dev mode description from AUTH handshake to shell registration

## Task Commits

Each task was committed atomically:

1. **Task 1: Update shim, sdk, and core README files** - `76dbd9e` (docs)
2. **Task 2: Update root README and vite-plugin README** - `9b32ea4` (docs)

## Files Created/Modified
- `packages/shim/README.md` - Removed nostr-tools/AUTH/keypair/NIP-42 references, added zero-crypto description, updated Shim vs SDK table
- `packages/sdk/README.md` - Removed nostr-tools install, updated SDK vs Shim table, replaced RUNTIME-SPEC.md with NIP-5D
- `packages/core/README.md` - Removed AUTH_KIND/BusKind.REGISTRATION/INTER_PANE, updated PROTOCOL_VERSION to 3.0.0, replaced RUNTIME-SPEC.md with NIP-5D
- `README.md` - Updated shim description, architecture diagram, and Origin section
- `packages/vite-plugin/README.md` - Replaced RUNTIME-SPEC.md link with NIP-5D, updated dev mode text

## Decisions Made
- Shim README Dependencies row changed from "nostr-tools (peer)" to "None (types from @napplet/core)" to match the actual package.json after nostr-tools removal
- Root README Architecture diagram uses "Identity via message.source" to describe the simplified identity model

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All package READMEs now accurately reflect the v0.15.0 protocol simplification
- No further documentation updates needed for the no-crypto migration

## Self-Check: PASSED

- All 5 modified files exist on disk
- Both task commits (76dbd9e, 9b32ea4) found in git log
- No stubs detected in modified files

---
*Phase: 73-sdk-readme-update*
*Completed: 2026-04-07*
