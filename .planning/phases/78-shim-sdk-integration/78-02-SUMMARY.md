---
phase: 78-shim-sdk-integration
plan: 02
subsystem: sdk
tags: [nub, type-re-exports, json-envelope, domain-constants, sdk]

# Dependency graph
requires:
  - phase: 78-shim-sdk-integration
    plan: 01
    provides: Shim wire format migration with NUB envelope types
  - phase: 77-nub-module-scaffold
    provides: NUB message type definitions (relay, signer, storage, ifc)
provides:
  - "@napplet/sdk re-exports all NUB message types as named exports"
  - "@napplet/sdk re-exports core envelope types (NappletMessage, NubDomain, ShellSupports)"
  - "@napplet/sdk exports aliased domain constants (RELAY_DOMAIN, SIGNER_DOMAIN, etc.)"
  - "Full monorepo build and type-check passes with NUB integration"
affects: [kehto-runtime, napplet-consumers, downstream-sdk-users]

# Tech tracking
tech-stack:
  added: []
  patterns: [type-re-export-aggregation, aliased-domain-constants]

key-files:
  modified:
    - packages/sdk/src/index.ts
    - packages/sdk/package.json

key-decisions:
  - "Domain constants aliased (RELAY_DOMAIN, SIGNER_DOMAIN, etc.) to avoid naming conflicts with multiple DOMAIN imports"
  - "NUB packages added as direct dependencies (not peerDeps) since SDK owns the re-export surface"

patterns-established:
  - "SDK aggregates NUB types: consumers import from @napplet/sdk instead of individual NUB packages"
  - "Aliased re-exports for domain constants prevent DOMAIN name collisions"

requirements-completed: [SHIM-03]

# Metrics
duration: 1min
completed: 2026-04-07
---

# Phase 78 Plan 02: SDK NUB Type Integration Summary

**SDK re-exports all 62 NUB message types, 4 aliased domain constants, and core envelope types -- `import { RelaySubscribeMessage, relay } from '@napplet/sdk'` works**

## Performance

- **Duration:** 1 min
- **Started:** 2026-04-07T12:44:19Z
- **Completed:** 2026-04-07T12:45:30Z
- **Tasks:** 1
- **Files modified:** 3

## Accomplishments
- SDK re-exports all NUB message types from relay (13 types), signer (18 types), storage (12 types), and ifc (19 types)
- Core envelope types (NappletMessage, NubDomain, ShellSupports) and NUB_DOMAINS constant exported
- Domain constants aliased as RELAY_DOMAIN, SIGNER_DOMAIN, STORAGE_DOMAIN, IFC_DOMAIN plus DESTRUCTIVE_KINDS
- Full monorepo build (8 packages) and type-check (13 tasks) pass clean

## Task Commits

Each task was committed atomically:

1. **Task 1: Add NUB type re-exports to SDK and add NUB dependencies** - `84fa29f` (feat)

## Files Created/Modified
- `packages/sdk/src/index.ts` - Added NUB type re-exports, core envelope types, aliased domain constants
- `packages/sdk/package.json` - Added 4 NUB workspace dependencies
- `pnpm-lock.yaml` - Updated with new workspace links

## Decisions Made
- Domain constants aliased (RELAY_DOMAIN instead of DOMAIN) to prevent naming conflicts when multiple NUB modules are imported through the same barrel export
- NUB packages listed as direct dependencies rather than peerDependencies since the SDK owns the aggregated re-export surface

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None -- no external service configuration required.

## Known Stubs
None -- all exports are concrete type re-exports and value re-exports.

## Next Phase Readiness
- SDK integration complete -- @napplet/sdk is the single-import surface for both window.napplet wrappers and typed NUB envelope messages
- Phase 78 (Shim & SDK Integration) is fully complete
- Shell-side (kehto) must implement matching envelope handlers to complete the protocol migration

## Self-Check: PASSED

All 2 modified files confirmed on disk. Task commit hash 84fa29f verified in git log.

---
*Phase: 78-shim-sdk-integration*
*Completed: 2026-04-07*
