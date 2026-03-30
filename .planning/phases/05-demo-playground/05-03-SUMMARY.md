---
phase: 05-demo-playground
plan: 03
status: complete
started: 2026-03-30T18:10:00.000Z
completed: 2026-03-30T18:25:00.000Z
---

# Plan 05-03 Summary: Chat and Bot Napplets

## What was built
Implemented full protocol capability usage in both demo napplets:
- Chat napplet: message input, relay pub/sub, storage history, inter-pane emit
- Bot napplet: teachable auto-responder with /teach command, inter-pane listener, storage

## Key files modified
- `apps/demo/napplets/chat/src/main.ts` -- publish, subscribe, emit, on, nappStorage
- `apps/demo/napplets/chat/index.html` -- dark terminal chat UI
- `apps/demo/napplets/bot/src/main.ts` -- on, emit, nappStorage, /teach command
- `apps/demo/napplets/bot/index.html` -- dark terminal bot log UI

## Protocol capabilities exercised
- Chat: relay:write (publish), relay:read (subscribe), sign:event, storage:read/write, inter-pane emit
- Bot: sign:event (emit response), storage:read/write (rules), inter-pane on/emit

## Verification
- [x] Chat uses publish(), subscribe(), emit(), on(), nappStorage
- [x] Bot uses on(), emit(), nappStorage
- [x] Bot supports /teach command
- [x] Both napplets build successfully

## Self-Check: PASSED
