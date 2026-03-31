---
phase: 12-core-package
plan: 01
subsystem: core
tags: [typescript, protocol, types, constants, topics, esm, zero-dep]

requires: []
provides:
  - "@napplet/core package at packages/core/"
  - "NostrEvent, NostrFilter, Capability types"
  - "BusKind, AUTH_KIND, SHELL_BRIDGE_URI, PROTOCOL_VERSION, REPLAY_WINDOW_SECONDS, DESTRUCTIVE_KINDS constants"
  - "ALL_CAPABILITIES array"
  - "TOPICS constant with state operation topics"
  - "TopicKey, TopicValue, BusKindValue type aliases"
affects: [shell, shim, runtime, acl]

tech-stack:
  added: []
  patterns: ["zero-dep core package with re-exportable types and constants"]

key-files:
  created:
    - packages/core/package.json
    - packages/core/tsconfig.json
    - packages/core/tsup.config.ts
    - packages/core/src/index.ts
    - packages/core/src/types.ts
    - packages/core/src/constants.ts
    - packages/core/src/topics.ts
  modified: []

key-decisions:
  - "TOPICS includes state operation entries (STATE_GET, STATE_SET, etc.) that were previously hardcoded strings in enforce.ts and state-shim.ts"
  - "tsconfig uses lib: ['ES2022'] only — no DOM lib, ensuring the package is environment-agnostic"

patterns-established:
  - "Zero-dependency protocol package: @napplet/core has no external dependencies"
  - "Barrel export pattern: index.ts re-exports from types.js, constants.js, topics.js with explicit type vs value exports"

requirements-completed: [CORE-01, CORE-02, CORE-03, CORE-04, CORE-05, CORE-06, CORE-09]

duration: 3min
completed: 2026-03-31
---

# Plan 12-01: Create @napplet/core Package Summary

**Zero-dep @napplet/core package with all shared protocol types, constants, and topic definitions**

## Performance

- **Duration:** 3 min
- **Tasks:** 8
- **Files created:** 7

## Accomplishments
- Created packages/core/ with package.json, tsconfig.json, tsup.config.ts
- Extracted NostrEvent, NostrFilter, Capability types and ALL_CAPABILITIES from shell/shim duplicates
- Consolidated BusKind, AUTH_KIND, SHELL_BRIDGE_URI, PROTOCOL_VERSION, REPLAY_WINDOW_SECONDS, DESTRUCTIVE_KINDS
- Added state operation topics (STATE_GET, STATE_SET, etc.) to TOPICS constant alongside existing shell topics
- Package builds and type-checks with zero dependencies

## Task Commits

1. **Tasks 1-7: Create core package files** - `9702a15` (feat)
2. **Task 8: Build and type-check** - verified in same commit

## Files Created/Modified
- `packages/core/package.json` - Zero-dep package manifest
- `packages/core/tsconfig.json` - ES2022-only (no DOM)
- `packages/core/tsup.config.ts` - ESM build config
- `packages/core/src/types.ts` - NostrEvent, NostrFilter, Capability, ALL_CAPABILITIES
- `packages/core/src/constants.ts` - BusKind, AUTH_KIND, SHELL_BRIDGE_URI, PROTOCOL_VERSION, REPLAY_WINDOW_SECONDS, DESTRUCTIVE_KINDS
- `packages/core/src/topics.ts` - TOPICS with all shell and state operation entries
- `packages/core/src/index.ts` - Barrel export with explicit type/value separation

## Decisions Made
None - followed plan as specified

## Deviations from Plan
None - plan executed exactly as written

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- @napplet/core ready for shell and shim to import from

---
*Phase: 12-core-package*
*Completed: 2026-03-31*
