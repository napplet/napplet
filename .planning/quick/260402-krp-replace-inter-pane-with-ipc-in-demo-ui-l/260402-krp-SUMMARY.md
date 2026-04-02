---
phase: quick
plan: 260402-krp
subsystem: ui
tags: [demo, terminology, ipc, inter-pane, rename]

requires: []
provides:
  - Consistent ipc terminology across all demo UI labels, logs, and comments
affects: []

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - apps/demo/napplets/chat/src/main.ts
    - apps/demo/napplets/bot/src/main.ts
    - apps/demo/src/main.ts
    - apps/demo/src/acl-panel.ts
    - apps/demo/src/sequence-diagram.ts
    - apps/demo/src/debugger.ts
    - apps/demo/src/shell-host.ts

key-decisions:
  - "Used lowercase 'ipc' for log messages and comments, uppercase 'IPC' for title-case UI labels"

patterns-established: []

requirements-completed: []

duration: 3min
completed: 2026-04-02
---

# Quick Task 260402-krp: Replace inter-pane with ipc in Demo UI Summary

**Replaced all 'inter-pane' terminology in 7 demo files with 'ipc'/'IPC' to match the BusKind.IPC_PEER protocol rename from Phase 35**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-02T12:59:44Z
- **Completed:** 2026-04-02T13:02:48Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Replaced all lowercase "inter-pane" occurrences in chat and bot napplet source files (comments, log messages, pending ack strings)
- Replaced all "inter-pane" / "Inter-Pane" occurrences in 5 shell UI modules (main.ts, acl-panel.ts, sequence-diagram.ts, debugger.ts, shell-host.ts)
- Zero occurrences of "inter-pane" remain in apps/demo/ (verified with grep -rci)
- Build passes cleanly with no errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace inter-pane with ipc in napplet demo sources (chat + bot)** - `8a8c5f9` (chore)
2. **Task 2: Replace inter-pane with ipc in demo shell UI modules** - `320ef58` (chore)

## Files Created/Modified
- `apps/demo/napplets/chat/src/main.ts` - Updated comments, log messages, and pending ack strings from inter-pane to ipc
- `apps/demo/napplets/bot/src/main.ts` - Updated comments and log messages from inter-pane to ipc
- `apps/demo/src/main.ts` - Updated debugger log label from inter-pane to ipc
- `apps/demo/src/acl-panel.ts` - Updated capability labels and hints from Inter-Pane/inter-pane to IPC/ipc
- `apps/demo/src/sequence-diagram.ts` - Updated diagram labels from inter-pane to ipc
- `apps/demo/src/debugger.ts` - Updated path category names from inter-pane-send/receive to ipc-send/receive
- `apps/demo/src/shell-host.ts` - Updated DemoProtocolPath type values, path names, and explanation strings

## Decisions Made
- Used lowercase "ipc" for log messages, comments, and hint strings (matching the lowercase context of surrounding text)
- Used uppercase "IPC" for the title-case capability label in acl-panel.ts ("Relay Publish / IPC Send")
- Preserved all INTER_PANE code constant references unchanged (these are correct enum member names)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Self-Check: PASSED

All 8 files verified present. Both task commits (8a8c5f9, 320ef58) verified in git log.

---
*Plan: quick-260402-krp*
*Completed: 2026-04-02*
