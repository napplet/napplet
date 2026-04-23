---
phase: 20-concrete-services
plan: 01
subsystem: infra
tags: [typescript, tsup, monorepo, pnpm-workspace, services]

requires:
  - phase: 18-core-types-runtime-dispatch
    provides: ServiceHandler interface in @napplet/runtime
  - phase: 19-service-discovery-protocol
    provides: ServiceDescriptor type in @napplet/core

provides:
  - "@napplet/services package scaffold (package.json, tsconfig.json, tsup.config.ts)"
  - "AudioSource, AudioServiceOptions types"
  - "Notification, NotificationServiceOptions types"
  - "Initial barrel export at src/index.ts"

affects: [20-02, 20-03, 20-04]

tech-stack:
  added: ["@napplet/services v0.1.0 package"]
  patterns: ["factory function service pattern (createXxxService)", "onChange callback for shell UI notification"]

key-files:
  created:
    - packages/services/package.json
    - packages/services/tsconfig.json
    - packages/services/tsup.config.ts
    - packages/services/src/types.ts
    - packages/services/src/index.ts
  modified:
    - pnpm-lock.yaml

key-decisions:
  - "Package depends on @napplet/core and @napplet/runtime (workspace:*), NOT @napplet/shell — browser-agnostic by design"
  - "onChange callbacks use ReadonlyMap (audio) and readonly array (notifications) to prevent mutation by callers"
  - "types.ts contains only state model types, NOT NIP-01 wire types"

requirements-completed: []

duration: 2min
completed: 2026-03-31
---

# Phase 20 Plan 01: Create @napplet/services Package Scaffolding Summary

**New `@napplet/services` monorepo package scaffolded with ESM-only build tooling and shared state model types (AudioSource, Notification) for the two reference ServiceHandler implementations**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-31T17:30:25Z
- **Completed:** 2026-03-31T17:32:29Z
- **Tasks:** 5
- **Files modified:** 5

## Accomplishments
- Created `@napplet/services` package with proper monorepo configuration matching established patterns
- Defined `AudioSource` and `Notification` state model types with full JSDoc + field comments
- Package depends on `@napplet/core` and `@napplet/runtime` (workspace:*), NOT `@napplet/shell`
- Initial build succeeds — `dist/index.js` and `dist/index.d.ts` generated via tsup
- pnpm workspace recognizes new package (3 packages added to lockfile)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create package.json** - `620be51` (chore)
2. **Task 2: Create tsconfig.json** - `e514e54` (chore)
3. **Task 3: Create tsup.config.ts** - `03644e0` (chore)
4. **Task 4: Create src/types.ts** - `c29dd4a` (feat)
5. **Task 5: Create src/index.ts + build** - `0ae4a8f` (feat)

## Files Created/Modified
- `packages/services/package.json` — @napplet/services v0.1.0, deps on core+runtime
- `packages/services/tsconfig.json` — extends root, strict, ES2022
- `packages/services/tsup.config.ts` — ESM-only, dts, sourcemap
- `packages/services/src/types.ts` — AudioSource, AudioServiceOptions, Notification, NotificationServiceOptions
- `packages/services/src/index.ts` — barrel export (types only initially)
- `pnpm-lock.yaml` — updated with new workspace package

## Decisions Made
- Matched `packages/runtime/tsconfig.json` pattern exactly (no project references needed since types-only initially)
- `onChange` callbacks typed as `ReadonlyMap` and `readonly[]` to prevent accidental mutation in shell host callbacks
- `dist/` is gitignored per monorepo convention (all packages exclude built artifacts)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `@napplet/services` package is scaffolded and builds successfully
- Shared types (`AudioSource`, `Notification`) are available for Plans 20-02 and 20-03
- Wave 2 (audio service + notification service) can proceed in parallel

---
*Phase: 20-concrete-services*
*Completed: 2026-03-31*
