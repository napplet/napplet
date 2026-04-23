---
phase: 50-acl-detail-panel
plan: 01
subsystem: runtime, demo
tags: [acl, enforce, ring-buffer, audit]

requires:
  - phase: 49-constants-panel
    provides: demo-config infrastructure for editable constants
provides:
  - AclCheckEvent.message field for full NIP-01 message context on ACL checks
  - Per-napplet ACL event ring buffer (acl-history.ts)
  - onAclCheck wiring in demo shell-host
affects: [50-02, 50-03, 50-04, 52]

tech-stack:
  added: []
  patterns: [ring-buffer-per-entity, acl-audit-callback]

key-files:
  created: [apps/demo/src/acl-history.ts]
  modified: [packages/runtime/src/types.ts, packages/runtime/src/enforce.ts, packages/runtime/src/runtime.ts, packages/runtime/src/event-buffer.ts, packages/shell/src/types.ts, apps/demo/src/shell-host.ts]

key-decisions:
  - "Extended AclCheckEvent in both runtime and shell types.ts to keep them in sync"
  - "Used synthetic ['EVENT', event] for recipient-side delivery checks in event-buffer.ts"
  - "Global ring size is 4x per-napplet ring size for cross-napplet ACL node view"

patterns-established:
  - "ACL audit ring buffer pattern: pushAclEvent captures every enforce() decision"

requirements-completed: [TRANS-03]

duration: 5min
completed: 2026-04-03
---

# Plan 50-01: Extend AclCheckEvent and Wire ACL Audit Summary

**AclCheckEvent now carries the triggering NIP-01 message, and every enforce() decision is captured in a per-napplet ring buffer**

## Performance

- **Duration:** 5 min
- **Tasks:** 4
- **Files modified:** 7

## Accomplishments
- Added optional `message` field to AclCheckEvent (runtime + shell)
- Updated all enforce() call sites in runtime.ts, event-buffer.ts to pass message context
- Created acl-history.ts with per-napplet and global ring buffers
- Wired onAclCheck callback in shell-host.ts with pubkey-to-windowId resolution

## Task Commits

1. **Task 1-4 (combined):** `e20880a` (feat)

## Files Created/Modified
- `packages/runtime/src/types.ts` - Added message?: unknown[] to AclCheckEvent
- `packages/runtime/src/enforce.ts` - Updated enforce signature and onAclCheck call
- `packages/runtime/src/runtime.ts` - Pass msg at all enforce() call sites
- `packages/runtime/src/event-buffer.ts` - Updated enforce signature, synthetic message for delivery checks
- `packages/shell/src/types.ts` - Mirrored AclCheckEvent message field
- `apps/demo/src/acl-history.ts` - New ring buffer module
- `apps/demo/src/shell-host.ts` - onAclCheck callback wiring

## Decisions Made
- Extended both runtime and shell AclCheckEvent to stay in sync
- Used synthetic `['EVENT', event]` for recipient-side delivery checks

## Deviations from Plan
None - plan executed exactly as written

## Issues Encountered
None

## Next Phase Readiness
Ring buffer ready for inspector rendering (Plan 50-03) and config wiring (Plan 50-04)

---
*Phase: 50-acl-detail-panel*
*Completed: 2026-04-03*
