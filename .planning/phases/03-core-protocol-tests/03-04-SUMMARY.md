---
phase: 03-core-protocol-tests
plan: 04
status: complete
started: 2026-03-30
completed: 2026-03-30
---

# Plan 03-04 Summary: Replay Protection Tests (RPL-01 through RPL-05)

## What was built

5 Playwright tests proving the pseudo-relay's replay detection: rejects old timestamps (>30s), future timestamps (>10s ahead), duplicate event IDs, verifies seen ID cleanup after expiry, and confirms unregistered window messages are silently ignored.

## Key files

### Created
- `tests/e2e/replay.spec.ts` -- 5 replay protection behavioral tests

## Key decisions

- RPL-04 (seen ID cleanup): Used `Date.now` override in browser context to advance time by 35 seconds. Trigger event must be constructed inside `page.evaluate` to use the mocked `Date.now`, not the Node.js `Date.now`.
- RPL-05 (unregistered window): Created a fake iframe via `document.createElement` and dispatched a MessageEvent with its contentWindow as source. This proves the `originRegistry.getWindowId` guard silently drops unknown sources.

## Self-Check: PASSED

- [x] tests/e2e/replay.spec.ts exists with 5 test cases
- [x] RPL-01: Old timestamp event (60s ago) -> OK false "too old"
- [x] RPL-02: Future timestamp event (30s ahead) -> OK false "in the future"
- [x] RPL-03: Duplicate event ID -> OK false "already processed"
- [x] RPL-04: Seen ID cleanup verified via time mock + trigger event
- [x] RPL-05: Unregistered window message -> no response, no crash
- [x] All 5 tests pass on 2 consecutive runs (no flakiness)

## Deviations

- RPL-04: Initial implementation constructed the trigger event in Node.js context which used unmocked Date.now. Fixed by moving event construction into page.evaluate.
