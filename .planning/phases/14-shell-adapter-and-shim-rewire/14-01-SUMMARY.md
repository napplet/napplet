---
phase: 14-shell-adapter-and-shim-rewire
plan: 01
subsystem: shell
tags: [adapter-pattern, runtime-delegation, hooks-adapter, browser-bridge]

requires:
  - phase: 13-runtime-package
    provides: createRuntime factory, RuntimeHooks interface, Runtime interface

provides:
  - hooks-adapter.ts converting ShellHooks to RuntimeHooks
  - Thin shell-bridge.ts delegating to createRuntime
  - adaptHooks export for advanced integrators

affects: [phase-16-verification, hyprgate-integration]

tech-stack:
  added: []
  patterns: [adapter-pattern for browser-to-runtime hook translation]

key-files:
  created:
    - packages/shell/src/hooks-adapter.ts
  modified:
    - packages/shell/src/shell-bridge.ts
    - packages/shell/src/index.ts
    - packages/shell/package.json
    - pnpm-lock.yaml

key-decisions:
  - "hooks-adapter uses originRegistry.getIframeWindow for all Window lookups, keeping browser API confined to the adapter layer"
  - "Shell retains local enforce.ts, acl-store, napp-key-registry, manifest-cache, state-proxy, audio-manager as browser-specific modules"
  - "ShellBridge.runtime getter exposed for advanced use cases (accessing nappKeyRegistry, aclState, manifestCache from runtime)"

patterns-established:
  - "Adapter pattern: adaptHooks(ShellHooks, BrowserDeps) -> RuntimeHooks"
  - "Shell as thin browser adapter: handleMessage extracts Window -> windowId, delegates to runtime"

requirements-completed: [SHELL-01, SHELL-02, SHELL-03, SHELL-04, SHELL-05, SHELL-06, SHELL-07]

duration: 10min
completed: 2026-03-31
---

# Plan 14-01: Shell Adapter Summary

**createShellBridge() rewired to delegate to createRuntime(adaptHooks(hooks)) — shell-bridge.ts reduced from 746 to 180 lines**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-31T11:00:00Z
- **Completed:** 2026-03-31T11:10:00Z
- **Tasks:** 4
- **Files modified:** 5

## Accomplishments

- Created hooks-adapter.ts that converts browser-oriented ShellHooks into environment-agnostic RuntimeHooks
- Rewrote shell-bridge.ts as a thin browser adapter that delegates all protocol logic to @napplet/runtime
- Preserved all existing exports and the ShellBridge interface unchanged
- Added @napplet/runtime as a workspace dependency

## Task Commits

All four tasks completed in a single atomic commit (tasks were tightly coupled):

1. **Task 1: Create hooks-adapter.ts** - `135aaed` (refactor)
2. **Task 2: Rewrite shell-bridge.ts** - `135aaed` (refactor)
3. **Task 3: Update index.ts exports** - `135aaed` (refactor)
4. **Task 4: Verify browser modules remain** - verified in commit

## Files Created/Modified

- `packages/shell/src/hooks-adapter.ts` - Converts ShellHooks to RuntimeHooks with browser deps bridging
- `packages/shell/src/shell-bridge.ts` - Thin adapter: MessageEvent -> windowId -> runtime.handleMessage
- `packages/shell/src/index.ts` - Added adaptHooks and BrowserDeps exports
- `packages/shell/package.json` - Added @napplet/runtime workspace dependency
- `pnpm-lock.yaml` - Updated lockfile

## Decisions Made

- Combined all 4 tasks into one atomic commit since they are tightly interdependent
- Exposed `runtime` getter on ShellBridge for advanced use cases (test harness, debugging)
- Kept shell's local enforce.ts rather than re-exporting from runtime to minimize import chain disruption

## Deviations from Plan

None - plan executed as specified.

## Issues Encountered

None - full monorepo builds and type-checks pass cleanly.

## Next Phase Readiness

- Shell is now a thin adapter over runtime
- Ready for Phase 16 verification testing
- Existing test harness imports (createShellBridge, originRegistry, aclStore) all still work

---
*Phase: 14-shell-adapter-and-shim-rewire*
*Completed: 2026-03-31*
