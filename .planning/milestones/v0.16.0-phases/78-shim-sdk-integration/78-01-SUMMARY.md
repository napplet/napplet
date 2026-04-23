---
phase: 78-shim-sdk-integration
plan: 01
subsystem: shim
tags: [json-envelope, wire-format, postmessage, nub, relay, signer, storage, ifc]

# Dependency graph
requires:
  - phase: 77-nub-module-scaffold
    provides: NUB message type definitions (relay, signer, storage, ifc)
provides:
  - "@napplet/shim sends JSON envelope objects via postMessage instead of NIP-01 arrays"
  - "@napplet/shim receives and dispatches JSON envelope messages from shell"
  - "window.napplet API signatures unchanged (backward compatible)"
affects: [78-02, shell-envelope-migration, kehto-runtime]

# Tech tracking
tech-stack:
  added: ["@napplet/nub-relay", "@napplet/nub-signer", "@napplet/nub-storage", "@napplet/nub-ifc"]
  patterns: [json-envelope-dispatch, typed-envelope-messages, correlation-id-request-response]

key-files:
  modified:
    - packages/shim/src/relay-shim.ts
    - packages/shim/src/state-shim.ts
    - packages/shim/src/index.ts
    - packages/shim/src/keyboard-shim.ts
    - packages/shim/src/nipdb-shim.ts
    - packages/shim/src/types.ts
    - packages/shim/src/discovery-shim.ts
    - packages/shim/package.json

key-decisions:
  - "query() uses dedicated relay.query message instead of subscribe+collect+close for cleaner protocol"
  - "state-shim posts storage.* messages directly (no IPC-PEER indirection)"
  - "on() constructs synthetic NostrEvent from IFC envelope for backward compat with NappletGlobal type"
  - "keyboard and nostrdb use local envelope types (not NUB domains)"

patterns-established:
  - "Envelope dispatch: central handler routes on msg.type prefix (signer.*, ifc.*, etc.)"
  - "Typed message construction: each outbound call builds a typed envelope satisfying NUB interfaces"
  - "Correlation-based request/response: id field on request, matched on .result response"

requirements-completed: [SHIM-01, SHIM-02, SHIM-03]

# Metrics
duration: 7min
completed: 2026-04-07
---

# Phase 78 Plan 01: Shim Wire Format Migration Summary

**All 6 shim source files migrated from NIP-01 array wire format to JSON envelope messages using NUB module types, with window.napplet API signatures unchanged**

## Performance

- **Duration:** 7 min
- **Started:** 2026-04-07T12:35:17Z
- **Completed:** 2026-04-07T12:41:53Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments
- relay-shim.ts sends relay.subscribe/publish/close/query envelope messages and dispatches on msg.type
- state-shim.ts sends storage.get/set/remove/keys directly (removed IPC-PEER indirection layer)
- Signer proxy sends typed signer.* envelopes and handles signer.*.result responses
- IFC emit/on uses ifc.emit/subscribe/unsubscribe/event envelope messages with topic handler registry
- keyboard-shim and nipdb-shim use local envelope types (keyboard.forward, nostrdb.request/result)
- BusKind eliminated from all shim source files; types.ts stripped to minimal re-exports

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate relay-shim.ts to JSON envelope wire format** - `6f3b117` (feat)
2. **Task 2: Migrate state-shim, signer, and IFC to envelope format** - `ce6828f` (feat)
3. **Task 3: Migrate peripheral shims, update types.ts, remove BusKind** - `74c4024` (feat)

## Files Created/Modified
- `packages/shim/src/relay-shim.ts` - Relay subscribe/publish/query/close via JSON envelopes
- `packages/shim/src/state-shim.ts` - Storage get/set/remove/keys via direct postMessage envelopes
- `packages/shim/src/index.ts` - Central envelope dispatcher, signer.* and ifc.* envelope messages
- `packages/shim/src/keyboard-shim.ts` - keyboard.forward envelope instead of kind 29004 event
- `packages/shim/src/nipdb-shim.ts` - nostrdb.request/result/event-push envelopes
- `packages/shim/src/types.ts` - BusKind removed, minimal re-exports retained
- `packages/shim/src/discovery-shim.ts` - Inline kind constant instead of BusKind import
- `packages/shim/package.json` - Added 4 NUB workspace dependencies

## Decisions Made
- **query() uses relay.query message**: Cleaner one-shot protocol instead of subscribe+collect+close pattern
- **state-shim sends directly**: Removed _sendInterPaneEvent indirection -- storage.* messages go straight to window.parent.postMessage
- **Synthetic NostrEvent in on()**: IFC events don't carry NostrEvent, but NappletGlobal type requires it; constructed minimal synthetic event for backward compatibility
- **Local envelope types for non-NUB domains**: keyboard and nostrdb define local interfaces since they aren't NUB-governed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added NUB dependencies early (in Task 2 instead of Task 3)**
- **Found during:** Task 2 (state-shim and signer migration)
- **Issue:** Task 2 imports from @napplet/nub-signer and @napplet/nub-ifc, but package.json dependencies were planned for Task 3
- **Fix:** Added all 4 NUB workspace dependencies in Task 2 commit
- **Files modified:** packages/shim/package.json, pnpm-lock.yaml
- **Verification:** Build succeeds
- **Committed in:** ce6828f (Task 2 commit)

**2. [Rule 3 - Blocking] Fixed discovery-shim.ts BusKind import**
- **Found during:** Task 3 (types.ts BusKind removal)
- **Issue:** discovery-shim.ts imported BusKind.SERVICE_DISCOVERY from types.ts, which was removed
- **Fix:** Replaced with inline constant `SERVICE_DISCOVERY_KIND = 29010`
- **Files modified:** packages/shim/src/discovery-shim.ts
- **Verification:** Build succeeds
- **Committed in:** 74c4024 (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both auto-fixes necessary to maintain build. No scope creep.

## Issues Encountered
None -- all tasks executed cleanly after the blocking fixes above.

## User Setup Required
None -- no external service configuration required.

## Known Stubs
- `packages/shim/src/index.ts:352` - `shell.supports()` always returns false (pre-existing, not introduced by this plan; TODO comment indicates shell should populate capabilities at iframe creation)

## Next Phase Readiness
- Shim wire format migration complete -- ready for 78-02 (SDK integration)
- Shell-side (kehto) must implement matching envelope handlers to complete the protocol migration
- All window.napplet API signatures unchanged -- consumers do not need updates

## Self-Check: PASSED

All 8 modified files confirmed on disk. All 3 task commit hashes verified in git log.

---
*Phase: 78-shim-sdk-integration*
*Completed: 2026-04-07*
