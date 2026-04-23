---
phase: 02-test-infrastructure
plan: 03
status: complete
started: 2026-03-30
completed: 2026-03-30
---

## Summary

Created the message tap -- a transparent postMessage interceptor that captures all NIP-01 protocol traffic between shell and napplet iframes.

## What was built

- `tests/helpers/message-tap.ts` - `createMessageTap()` factory with full NIP-01 verb parsing
- Updated `tests/helpers/index.ts` barrel export with message tap types

## Key capabilities

- `install(window)` captures inbound (napplet->shell) messages via capture-phase addEventListener
- `recordOutbound(msg)` captures outbound (shell->napplet) messages when called by harness
- `waitForMessage(criteria, timeout)` async wait with descriptive timeout errors
- `filter(criteria)` returns matching messages from captured buffer
- `onMessage(callback)` real-time subscription for new messages
- Parsed metadata: subId, eventKind, eventId, topic, success, reason, pubkey
- Handles all NIP-01 verbs: EVENT, REQ, CLOSE, AUTH, OK, EOSE, NOTICE, CLOSED, COUNT

## Key files

- `tests/helpers/message-tap.ts` - Message tap implementation

## Verification

- Shell-side only (no injection into napplet iframes)
- Uses capture phase for priority over relay handler
- `pnpm build` succeeds
