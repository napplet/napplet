---
phase: 03-core-protocol-tests
plan: 05
status: complete
started: 2026-03-30
completed: 2026-03-30
---

# Plan 03-05 Summary: Lifecycle & Edge Cases Tests (LCY-01 through LCY-05)

## What was built

5 Playwright tests proving lifecycle correctness: pre-AUTH message queuing and replay, AUTH rejection queue clearing with NOTICE, cleanup() state reset, and graceful handling of malformed or sourceless messages.

## Key files

### Created
- `tests/e2e/lifecycle.spec.ts` -- 5 lifecycle and edge case behavioral tests

## Key decisions

- LCY-01 and LCY-02: Used pure-napplet to control AUTH timing. This allows injecting messages before AUTH and then manually completing or failing AUTH.
- LCY-02: Verified the exact NOTICE format: "N queued message(s) dropped due to auth failure"
- LCY-03: Verified cleanup() by creating a subscription, calling cleanup(), then injecting an event and confirming no delivery
- LCY-04: Used `window.dispatchEvent(new MessageEvent(...))` with string data (not array) to test the guard
- LCY-05: Used `source: null` in MessageEvent constructor to test the null source guard

## Self-Check: PASSED

- [x] tests/e2e/lifecycle.spec.ts exists with 5 test cases
- [x] LCY-01: Pre-AUTH REQ replayed after AUTH success
- [x] LCY-02: AUTH rejection clears queue, NOTICE sent, queued REQ not active
- [x] LCY-03: cleanup() removes subscriptions (no events delivered after)
- [x] LCY-04: Non-array postMessage -> no response, no crash
- [x] LCY-05: Null source -> no response, no crash
- [x] All 5 tests pass on 2 consecutive runs (no flakiness)
- [x] Full test suite: 35 tests pass (7 Phase 2 + 28 Phase 3)
- [x] `pnpm test` exits 0
- [x] `pnpm build` succeeds

## Deviations

None -- implemented as planned.
