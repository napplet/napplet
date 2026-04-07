---
phase: 75-package-architecture
plan: 02
subsystem: infra
tags: [nub, scaffold, workspace, tsup, typescript, monorepo]

# Dependency graph
requires:
  - phase: 75-package-architecture/01
    provides: "NappletMessage envelope types in @napplet/core"
provides:
  - "4 NUB scaffold packages: @napplet/nub-relay, @napplet/nub-signer, @napplet/nub-storage, @napplet/nub-ifc"
  - "Canonical NUB module pattern: package.json + tsconfig.json + tsup.config.ts + src/types.ts + src/index.ts"
  - "Domain-specific message interfaces with template literal type constraints"
  - "pnpm-workspace.yaml updated with packages/nubs/* glob"
affects: [77-nub-specs, 78-shim-rewire, nub-governance]

# Tech tracking
tech-stack:
  added: []
  patterns: ["NUB module scaffold: types.ts exports {Domain}Message extending NappletMessage, index.ts barrel re-exports"]

key-files:
  created:
    - packages/nubs/relay/package.json
    - packages/nubs/relay/src/types.ts
    - packages/nubs/relay/src/index.ts
    - packages/nubs/signer/package.json
    - packages/nubs/signer/src/types.ts
    - packages/nubs/signer/src/index.ts
    - packages/nubs/storage/package.json
    - packages/nubs/storage/src/types.ts
    - packages/nubs/storage/src/index.ts
    - packages/nubs/ifc/package.json
    - packages/nubs/ifc/src/types.ts
    - packages/nubs/ifc/src/index.ts
    - packages/core/src/envelope.ts
  modified:
    - pnpm-workspace.yaml
    - packages/core/src/index.ts

key-decisions:
  - "NUB packages live at packages/nubs/{domain}/ with npm name @napplet/nub-{domain}"
  - "Each NUB message interface constrains type field to `{domain}.${string}` template literal"
  - "Created envelope.ts prerequisite from Wave 1 spec since parallel execution"

patterns-established:
  - "NUB scaffold pattern: package.json (workspace:* core dep), tsconfig.json (extends root), tsup.config.ts (ESM+DTS), src/types.ts (domain message + DOMAIN const), src/index.ts (barrel)"

requirements-completed: [CORE-01, CORE-02]

# Metrics
duration: 3min
completed: 2026-04-07
---

# Phase 75 Plan 02: NUB Package Scaffolds Summary

**4 NUB scaffold packages (relay, signer, storage, ifc) with domain-specific message types extending NappletMessage and template literal type constraints**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-07T11:01:17Z
- **Completed:** 2026-04-07T11:04:28Z
- **Tasks:** 2
- **Files modified:** 23

## Accomplishments
- Created packages/nubs/ directory with 4 NUB domain packages (relay, signer, storage, ifc)
- Each NUB exports a domain-specific message interface (RelayMessage, SignerMessage, StorageMessage, IfcMessage) extending NappletMessage
- Template literal type constraint ensures all messages use `{domain}.${string}` format per NIP-5D
- Full monorepo build (19 packages) and type-check (20 tasks) pass clean

## Task Commits

Each task was committed atomically:

1. **Task 1: Workspace config and NUB package scaffolds** - `6915c25` (feat)
2. **Task 2: NUB module type scaffolds and barrel exports** - `b003d08` (feat)

## Files Created/Modified
- `pnpm-workspace.yaml` - Added packages/nubs/* workspace glob
- `packages/core/src/envelope.ts` - NappletMessage, NubMessage, NubDomain, NUB_DOMAINS base types
- `packages/core/src/index.ts` - Added envelope type exports
- `packages/nubs/relay/package.json` - @napplet/nub-relay package config
- `packages/nubs/relay/tsconfig.json` - TypeScript config extending root
- `packages/nubs/relay/tsup.config.ts` - ESM build with DTS generation
- `packages/nubs/relay/src/types.ts` - RelayMessage interface with `relay.${string}` type
- `packages/nubs/relay/src/index.ts` - Barrel export for relay NUB
- `packages/nubs/signer/package.json` - @napplet/nub-signer package config
- `packages/nubs/signer/tsconfig.json` - TypeScript config extending root
- `packages/nubs/signer/tsup.config.ts` - ESM build with DTS generation
- `packages/nubs/signer/src/types.ts` - SignerMessage interface with `signer.${string}` type
- `packages/nubs/signer/src/index.ts` - Barrel export for signer NUB
- `packages/nubs/storage/package.json` - @napplet/nub-storage package config
- `packages/nubs/storage/tsconfig.json` - TypeScript config extending root
- `packages/nubs/storage/tsup.config.ts` - ESM build with DTS generation
- `packages/nubs/storage/src/types.ts` - StorageMessage interface with `storage.${string}` type
- `packages/nubs/storage/src/index.ts` - Barrel export for storage NUB
- `packages/nubs/ifc/package.json` - @napplet/nub-ifc package config
- `packages/nubs/ifc/tsconfig.json` - TypeScript config extending root
- `packages/nubs/ifc/tsup.config.ts` - ESM build with DTS generation
- `packages/nubs/ifc/src/types.ts` - IfcMessage interface with `ifc.${string}` type
- `packages/nubs/ifc/src/index.ts` - Barrel export for ifc NUB

## Decisions Made
- NUB packages use flat @napplet/nub-{domain} naming (not @napplet/nubs/{domain}) per important_context
- Each domain exports a DOMAIN constant alongside the message type for runtime dispatch
- tsconfig.json paths use `../../../tsconfig.json` (3 levels up from packages/nubs/{domain}/)
- Created envelope.ts as blocking dependency from Wave 1 (parallel execution)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created envelope.ts prerequisite from Wave 1**
- **Found during:** Task 1 (before creating NUB scaffolds)
- **Issue:** Plan depends on NappletMessage from packages/core/src/envelope.ts (created by 75-01), but Wave 1 has not completed in this worktree (parallel execution)
- **Fix:** Created envelope.ts with NappletMessage, NubMessage, NubDomain, NUB_DOMAINS matching the interface spec from the plan. Updated core's index.ts to export envelope types.
- **Files modified:** packages/core/src/envelope.ts, packages/core/src/index.ts
- **Verification:** pnpm build and type-check pass, all NUB packages resolve NappletMessage import
- **Committed in:** 6915c25 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking dependency)
**Impact on plan:** Necessary for parallel execution. No scope creep. Wave 1 merge will reconcile.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- 4 NUB scaffold packages ready for real message type population (Phase 77)
- Pattern established: future NUB modules follow the same structure
- Wave 1 merge may require reconciling the envelope.ts file

## Self-Check: PASSED

All 13 created files verified on disk. Both task commits (6915c25, b003d08) found in git log.

---
*Phase: 75-package-architecture*
*Completed: 2026-04-07*
