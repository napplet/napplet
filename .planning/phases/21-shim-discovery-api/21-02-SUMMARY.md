---
phase: 21-shim-discovery-api
plan: 02
subsystem: api
tags: [nostr, service-discovery, typescript, shim, window-global]

requires:
  - phase: 21-shim-discovery-api/21-01
    provides: discovery-shim.ts with ServiceInfo, discoverServices, hasService, hasServiceVersion

provides:
  - window.napplet global installed at shim load time
  - discoverServices, hasService, hasServiceVersion exported from @napplet/shim public API
  - ServiceInfo type exported from @napplet/shim public API

affects: [shim-consumers, demo-app]

tech-stack:
  added: []
  patterns:
    - window global installation via (window as unknown as { X: unknown }).X cast
    - Public API barrel export pattern for discovery module

key-files:
  created: []
  modified:
    - packages/shim/src/index.ts

key-decisions:
  - "window.napplet installed in dedicated section before Initialize block (parallel to window.nostr)"
  - "ServiceInfo exported as type (not value) per verbatimModuleSyntax convention"
  - "Discovery functions re-exported directly from discovery-shim.js via barrel export"

patterns-established:
  - "New globals get a dedicated named section comment: window.X installation"

requirements-completed: [SHIM-01, SHIM-02, SHIM-03, SHIM-04]

duration: 10min
completed: 2026-03-31
---

# Plan 21-02: Install window.napplet Global and Public API Exports Summary

**window.napplet global installed and discoverServices/hasService/hasServiceVersion exported from @napplet/shim with zero build errors**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-31
- **Completed:** 2026-03-31
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- `window.napplet` global installed during shim initialization using same cast pattern as `window.nostr`
- All three discovery functions re-exported from `@napplet/shim` public API barrel
- `ServiceInfo` type exported as `export type` per `verbatimModuleSyntax` convention
- `pnpm build` passes 14/14 tasks with zero type errors and zero warnings

## Task Commits

1. **Task 1+2: Add discovery imports/exports and window.napplet, verify build** - `3069a47` (feat)

## Files Created/Modified
- `packages/shim/src/index.ts` — Added discovery import, public API exports, window.napplet installation block

## Decisions Made
- `window.napplet` installation placed in a dedicated named section before the Initialize block, parallel to the `window.nostr` installation section above it
- Re-used exact same `(window as unknown as { X: unknown }).X = { ... }` cast pattern for type safety

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
- Attempted to stage `packages/shim/dist/` for commit but it is gitignored (correct behavior — build artifacts are not committed). Committed only source files.

## Next Phase Readiness
- Phase 21 complete: napplet code can call `window.napplet.discoverServices()` and `import { discoverServices } from '@napplet/shim'`
- ServiceInfo type is available for consumers
- Ready for Phase 22 (or downstream work that builds on service discovery)

---
*Phase: 21-shim-discovery-api*
*Completed: 2026-03-31*
