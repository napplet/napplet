---
phase: 64-demo-test-migration
plan: 02
subsystem: testing
tags: [vitest, kehto, unit-tests, migration]

requires:
  - phase: 64-01
    provides: Demo source files migrated to kehto with import rewrites
provides:
  - Root vitest.config.ts with @kehto/* and @napplet/core aliases
  - 10 migrated unit tests verifying kehto package chain and demo source
  - pnpm test:unit script at kehto root running all 252 tests
affects: [64-03, kehto-publish]

tech-stack:
  added: [vitest 4.1.2, "@vitest/coverage-v8 4.1.2", "nostr-tools 2.23.3 (root devDep)"]
  patterns: [root-level vitest with workspace package aliases, relative imports for demo source]

key-files:
  created:
    - /home/sandwich/Develop/kehto/vitest.config.ts
    - /home/sandwich/Develop/kehto/tests/unit/shell-runtime-integration.test.ts
    - /home/sandwich/Develop/kehto/tests/unit/demo-host-audit.test.ts
    - /home/sandwich/Develop/kehto/tests/unit/demo-config-model.test.ts
    - /home/sandwich/Develop/kehto/tests/unit/demo-config-overrides.test.ts
    - /home/sandwich/Develop/kehto/tests/unit/demo-topology-model.test.ts
    - /home/sandwich/Develop/kehto/tests/unit/demo-topology-render.test.ts
    - /home/sandwich/Develop/kehto/tests/unit/demo-node-details-model.test.ts
    - /home/sandwich/Develop/kehto/tests/unit/demo-node-inspector-render.test.ts
    - /home/sandwich/Develop/kehto/tests/unit/nip46-client.test.ts
    - /home/sandwich/Develop/kehto/tests/unit/signer-connection.test.ts
  modified:
    - /home/sandwich/Develop/kehto/package.json

key-decisions:
  - "Used absolute path to napplet core source for @napplet/core alias -- more reliable than node_modules link resolution"
  - "Updated demo-host-audit test assertions to match kehto's ipc-send/ipc-receive naming (already migrated in Plan 01)"
  - "Updated demo-config-model test to check editable constants only -- kehto renderConstantsPanel filters to editable"

patterns-established:
  - "Root vitest.config.ts with resolve.alias for all @kehto/* packages pointing to src/index.ts"
  - "Cross-repo @napplet/core alias via absolute path to napplet repo source"

requirements-completed: [KEHTO-06]

duration: 5min
completed: 2026-04-06
---

# Phase 64 Plan 02: Unit Test Migration Summary

**10 unit tests migrated from napplet to kehto with @kehto/* import rewrites -- 252 tests passing via root vitest config**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-06T16:56:57Z
- **Completed:** 2026-04-06T17:02:11Z
- **Tasks:** 1
- **Files modified:** 13

## Accomplishments
- Root vitest.config.ts created with @kehto/acl, @kehto/runtime, @kehto/services, @kehto/shell, and @napplet/core aliases
- 10 unit test files copied from napplet and import-rewritten for @kehto packages
- shell-runtime-integration.test.ts proves the full @napplet/core -> @kehto/acl -> @kehto/runtime -> @kehto/shell chain
- All 252 tests green (14 test files: 4 in-package + 10 migrated)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create vitest config and copy unit tests** - `ea191c9` (feat) -- committed in kehto repo

## Files Created/Modified
- `vitest.config.ts` - Root vitest config with @kehto/* aliases and @napplet/core cross-repo resolution
- `tests/unit/shell-runtime-integration.test.ts` - Integration test proving core->acl->runtime->shell chain via @kehto packages
- `tests/unit/demo-host-audit.test.ts` - Demo host audit metadata assertions (updated for kehto ipc naming)
- `tests/unit/demo-config-model.test.ts` - DemoConfig data model and renderConstantsPanel tests (updated for editable-only rendering)
- `tests/unit/demo-config-overrides.test.ts` - DemoConfig mutation and runtime config overrides tests
- `tests/unit/demo-topology-model.test.ts` - Demo topology model structure tests
- `tests/unit/demo-topology-render.test.ts` - Demo topology render output and signer states tests
- `tests/unit/demo-node-details-model.test.ts` - Node detail adapter coverage for all topology roles
- `tests/unit/demo-node-inspector-render.test.ts` - Inspector layout invariants and selection hooks tests
- `tests/unit/nip46-client.test.ts` - NIP-46 URI parsing and client creation tests
- `tests/unit/signer-connection.test.ts` - Signer connection state model and NIP-07 flow tests
- `package.json` - Added vitest, @vitest/coverage-v8, nostr-tools devDependencies and test:unit script

## Decisions Made
- Used absolute path `/home/sandwich/Develop/napplet/packages/core/src/index.ts` for @napplet/core alias rather than relying on node_modules link resolution -- more reliable and explicit
- Updated demo-host-audit test assertions to use `ipc-send`/`ipc-receive` and `IPC Send` to match kehto's already-migrated demo source (Plan 01 renamed these from inter-pane)
- Updated demo-config-model test to check only editable constants have `data-const-key` attributes, since kehto's `renderConstantsPanel()` filters to editable-only

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated demo-host-audit test assertions for kehto IPC naming**
- **Found during:** Task 1 (import rewrite and test run)
- **Issue:** Kehto demo source uses `ipc-send`/`ipc-receive` and `IPC Send` labels (migrated in Plan 01), but copied test still expected `inter-pane-send`/`inter-pane-receive` and `Inter-Pane Send`
- **Fix:** Updated 5 assertions in demo-host-audit.test.ts to match kehto's naming
- **Files modified:** tests/unit/demo-host-audit.test.ts
- **Verification:** All 4 demo-host-audit tests pass
- **Committed in:** ea191c9

**2. [Rule 1 - Bug] Updated demo-config-model test for editable-only rendering**
- **Found during:** Task 1 (test run)
- **Issue:** Kehto's `renderConstantsPanel()` only renders editable constants, but test expected `data-const-key` for ALL constants including read-only protocol constants
- **Fix:** Changed test to filter `demoConfig.getAllDefs()` to editable-only before checking data attributes
- **Files modified:** tests/unit/demo-config-model.test.ts
- **Verification:** All 32 demo-config-model tests pass
- **Committed in:** ea191c9

---

**Total deviations:** 2 auto-fixed (2 bugs -- test assertions mismatched kehto source)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All unit tests passing in kehto (252 tests, 14 files)
- Ready for Plan 03 (e2e test migration) if applicable
- kehto repo has complete test infrastructure: vitest config, in-package tests, and migrated unit tests

## Self-Check: PASSED

- All 11 created files verified present
- Commit ea191c9 verified in kehto git log
- 252 tests passing (14 test files)
- Zero stale @napplet/{acl,runtime,shell,services} imports in tests/unit/

---
*Phase: 64-demo-test-migration*
*Completed: 2026-04-06*
