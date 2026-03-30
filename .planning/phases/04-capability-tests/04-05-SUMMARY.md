---
phase: 04-capability-tests
plan: 05
status: complete
started: 2026-03-30T17:15:00.000Z
completed: 2026-03-30T17:25:00.000Z
---

## Summary

Implemented 6 inter-pane communication tests covering all IPC-01 through IPC-06 requirements.

## What was built

`tests/e2e/inter-pane.spec.ts` with 6 tests:
- IPC-01: emit + subscribe -- subscriber receives event with correct payload (sender exclusion verified)
- IPC-02: Topic filtering -- unsubscribed topic does not fire callback
- IPC-03: Multiple subscribers -- both B and C receive broadcast event
- IPC-04: Unsubscribe (CLOSE) -- no further events received after closing subscription
- IPC-05: Malformed content -- non-JSON content passes through unchanged
- IPC-06: Shell-injected events -- injectEvent delivered to matching subscribers with zero pubkey

## Key files

- `tests/e2e/inter-pane.spec.ts` — 6 inter-pane communication behavioral tests

## Technical details

- IPC events use kind 29003 (INTER_PANE) with ['t', topic] tag
- Subscriptions use NIP-01 tag filter: { kinds: [29003], '#t': [topic] }
- Multi-napplet tests load 2-3 auth-napplets, each getting unique identity
- Helper loadAndAuth tracks AUTH OK count to detect completion of each napplet
- Sender exclusion (deliverToSubscriptions skips sender windowId) verified in IPC-01
- Shell-injected events use zero pubkey ('0'.repeat(64)) and null senderId (no exclusion)

## Self-Check: PASSED

- [x] All 6 IPC tests pass
- [x] Full suite (66 tests) passes with zero regressions
