---
phase: 12-core-package
plan: 02
subsystem: shell
tags: [typescript, imports, refactor, protocol, topics]

requires:
  - phase: 12-01
    provides: "@napplet/core package with all protocol types and constants"
provides:
  - "Shell imports all protocol types from @napplet/core"
  - "Shell types.ts contains only shell-specific interfaces"
  - "Shell topics.ts is thin re-export from core"
  - "enforce.ts and state-proxy.ts use TOPICS constants instead of hardcoded strings"
affects: [shell, runtime]

tech-stack:
  added: []
  patterns: ["re-export protocol types for backwards compatibility", "TOPICS constants for string-free topic references"]

key-files:
  created: []
  modified:
    - packages/shell/package.json
    - packages/shell/src/types.ts
    - packages/shell/src/topics.ts
    - packages/shell/src/enforce.ts
    - packages/shell/src/shell-bridge.ts
    - packages/shell/src/acl-store.ts
    - packages/shell/src/index.ts
    - packages/shell/src/state-proxy.ts

key-decisions:
  - "Shell types.ts re-exports protocol types from @napplet/core for backwards compatibility"
  - "Topics.ts reduced to thin re-export rather than deleted to preserve existing import paths"
  - "Removed DESTRUCTIVE_KINDS re-export from acl-store.ts — now comes from @napplet/core via index.ts"

patterns-established:
  - "Protocol imports from @napplet/core, shell-specific types from ./types.js"
  - "Use TOPICS.STATE_GET etc. instead of hardcoded 'shell:state-get' strings"

requirements-completed: [CORE-07]

duration: 5min
completed: 2026-03-31
---

# Plan 12-02: Rewire @napplet/shell Summary

**Shell imports all protocol types from @napplet/core — 232 lines of duplicate definitions removed**

## Performance

- **Duration:** 5 min
- **Tasks:** 9
- **Files modified:** 8

## Accomplishments
- Replaced all local protocol type definitions in shell with imports from @napplet/core
- Shell types.ts reduced from 369 to ~195 lines (shell-specific types only)
- Shell topics.ts reduced from 53 to 8 lines (thin re-export)
- Replaced 5 hardcoded state topic strings in enforce.ts with TOPICS constants
- Replaced 6 hardcoded state topic strings in state-proxy.ts with TOPICS constants
- All packages build and type-check cleanly

## Task Commits

1. **Tasks 1-8: Rewire shell imports** - `f62e208` (refactor)
2. **Task 9: Build and type-check** - verified (all pass)

## Files Created/Modified
- `packages/shell/package.json` - Added @napplet/core workspace dependency
- `packages/shell/src/types.ts` - Protocol types re-exported from core; shell-specific types retained
- `packages/shell/src/topics.ts` - Thin re-export from @napplet/core
- `packages/shell/src/enforce.ts` - Uses TOPICS constants and @napplet/core imports
- `packages/shell/src/shell-bridge.ts` - Protocol imports from @napplet/core
- `packages/shell/src/acl-store.ts` - Capability and constants from @napplet/core
- `packages/shell/src/index.ts` - Protocol re-exports sourced from @napplet/core
- `packages/shell/src/state-proxy.ts` - Uses TOPICS constants for all state operations

## Decisions Made
- Needed to add local `import type { ... } from '@napplet/core'` alongside `export type { ... }` re-exports because `verbatimModuleSyntax` doesn't bind re-exported types locally

## Deviations from Plan

### Auto-fixed Issues

**1. [Build fix] Added NostrFilter to local import in types.ts**
- **Found during:** Task 9 (build verification)
- **Issue:** `export type { NostrFilter } from '@napplet/core'` doesn't bind the name locally for use in interface definitions with verbatimModuleSyntax
- **Fix:** Added `NostrFilter` to the separate `import type` statement
- **Verification:** Shell build and type-check pass

---

**Total deviations:** 1 auto-fixed
**Impact on plan:** Necessary for TypeScript correctness with verbatimModuleSyntax. No scope creep.

## Issues Encountered
None beyond the auto-fix above

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Shell fully rewired to @napplet/core
- Ready for runtime package extraction in phase 13

---
*Phase: 12-core-package*
*Completed: 2026-03-31*
