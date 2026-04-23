---
phase: 03-core-protocol-tests
plan: 03
status: complete
started: 2026-03-30
completed: 2026-03-30
---

# Plan 03-03 Summary: Message Routing Tests (MSG-01 through MSG-09)

## What was built

9 Playwright tests proving the full subscription lifecycle (REQ/EVENT/CLOSE/EOSE), inter-pane routing rules (sender exclusion, p-tag targeting), and edge cases (pre-AUTH queue replay, blocked napp denial).

## Key files

### Created
- `tests/e2e/routing.spec.ts` -- 9 message routing behavioral tests

## Key decisions

- MSG-05 (EOSE): Overrode mock relayPool.getRelayPool to return null, forcing the "no pool" immediate EOSE path. This avoids the 15s fallback timer in the mock pool setup.
- MSG-06 (sender exclusion): The current code excludes sender from ALL kinds, not just kind 29003 per CONTEXT D-07. Tests verify the behavior for kind 29003 as required.
- MSG-07 (p-tag targeting): Used wid1 as sender to publish p-tagged event. This tests both sender exclusion and p-tag filtering in one assertion.
- MSG-08 (pre-AUTH queue): Used pure-napplet to manually control AUTH timing, ensuring the REQ is injected before AUTH completes.
- MSG-09 (blocked napp): Used shell:acl-revoke command protocol to revoke relay:read capability, then verified CLOSED response.

## Self-Check: PASSED

- [x] tests/e2e/routing.spec.ts exists with 9 test cases
- [x] MSG-01: REQ creates subscription, buffered events delivered
- [x] MSG-02: Matching EVENT delivered to subscriber
- [x] MSG-03: Non-matching EVENT not delivered
- [x] MSG-04: CLOSE stops delivery of subsequent events
- [x] MSG-05: EOSE sent after buffer scan
- [x] MSG-06: Sender excluded from own kind 29003 delivery
- [x] MSG-07: p-tag event delivered only to targeted napp
- [x] MSG-08: Pre-AUTH REQ queued and replayed after AUTH success
- [x] MSG-09: Blocked napp receives CLOSED with denial reason
- [x] All 9 tests pass on 2 consecutive runs (no flakiness)
- [x] Phase 2 tests still pass

## Deviations

- MSG-04: Initial test failed because AUTH auth:identity-changed event was in the buffer and delivered on subscription creation. Fixed by clearing messages after subscription is created and before injection of post-CLOSE event.
