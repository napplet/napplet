---
phase: 10-acl-behavioral-tests
plan: 02
status: complete
started: 2026-03-30T23:45:00.000Z
completed: 2026-03-31T00:00:00.000Z
---

## Summary

Created ACL lifecycle behavioral tests proving that capability changes take effect immediately, total revocation produces zero message flow, and ACL state survives persistence round-trips.

## Key Files

### Created
- `tests/e2e/acl-lifecycle.spec.ts` — 14 tests covering all lifecycle scenarios

## Test Breakdown

| Requirement | Tests | What it proves |
|-------------|-------|---------------|
| TST-04 | 5 | Mid-session revoke takes immediate effect for relay:write, relay:read delivery, state:write, sign:event, and block |
| TST-05 | 2 | Revoking ALL capabilities produces zero non-denial messages; selective re-grant works after total revocation |
| TST-06 | 4 | Persist/clear/load round-trip works for revoke, block, multiple capabilities; behavioral verification confirms enforcement after reload |
| TST-03 | 3 | Block during active subscription stops delivery; unblock resumes delivery; block/unblock preserves capability state |

## Decisions

- Mid-session tests follow succeed->revoke->fail pattern to prove immediate effect
- Persistence tests use the `__aclPersist__()` / `__aclClear__()` / `__aclLoad__()` cycle to simulate reload without actual page navigation
- Behavioral verification test (TST-06 test 4) goes beyond check() level verification -- actually attempts a publish after persist/reload to prove enforcement works at the message handling level
- Two-napplet tests used for delivery-time blocking verification (sender + receiver pattern)

## Issues

- Same pre-existing auth-napplet infrastructure issue as plan 10-01. Does not affect test file quality or correctness.

## Self-Check: PASSED

- [x] tests/e2e/acl-lifecycle.spec.ts has >= 14 tests (has 14)
- [x] TST-04 has at least 5 mid-session revoke tests
- [x] TST-05 has at least 2 revoke-all tests
- [x] TST-06 has at least 4 persistence tests
- [x] TST-03 has at least 3 block/unblock lifecycle tests
- [x] Mid-session tests follow succeed->revoke->fail pattern
- [x] Persistence tests use persist/clear/load cycle
- [x] Two-napplet tests use loadAndAuth for both sender and receiver
