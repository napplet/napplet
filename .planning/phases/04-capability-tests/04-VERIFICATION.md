---
status: passed
phase: 04-capability-tests
verified: 2026-03-30
---

# Phase 4: Capability Tests — Verification

## Phase Goal

All delegated capabilities -- ACL enforcement, storage isolation, signer proxy, and inter-pane communication -- are proven correct by automated tests.

## Must-Haves Verification

### 1. ACL enforcement works

| Criterion | Test | Status |
|-----------|------|--------|
| Default permissive allows unknown napps | ACL-01 | PASS |
| Explicit grants take effect | ACL-02 | PASS |
| Revokes take effect immediately | ACL-03 | PASS |
| Blocking denies all operations | ACL-04 | PASS |
| Unblocking restores access | ACL-05 | PASS |
| ACL state survives persist/load | ACL-09 | PASS |

Evidence: `npx playwright test acl-enforcement.spec.ts` -- 9 passed

### 2. Storage isolation is airtight

| Criterion | Test | Status |
|-----------|------|--------|
| CRUD operations work correctly | STR-01, STR-02, STR-03, STR-04, STR-05 | PASS |
| Napp A cannot see napp B's keys | STR-06 | PASS |
| Quota enforcement rejects writes over 512KB | STR-07, STR-08 | PASS |
| Values survive shell reload | STR-09 | PASS |

Evidence: `npx playwright test storage-isolation.spec.ts` -- 9 passed

### 3. Signer delegation works

| Criterion | Test | Status |
|-----------|------|--------|
| getPublicKey returns host key | SGN-01 | PASS |
| signEvent succeeds for non-destructive kinds | SGN-02 | PASS |
| Consent flow gates destructive kinds (approve) | SGN-03 | PASS |
| Consent flow gates destructive kinds (deny) | SGN-04 | PASS |
| Missing signer returns clear error | SGN-05 | PASS |
| Never-resolving signer produces no premature response | SGN-06 | PASS |
| Concurrent requests resolve independently | SGN-07 | PASS |

Evidence: `npx playwright test signer-delegation.spec.ts` -- 7 passed

### 4. Inter-pane communication works

| Criterion | Test | Status |
|-----------|------|--------|
| emit/on delivers events with correct payload | IPC-01 | PASS |
| Topic filtering excludes unsubscribed topics | IPC-02 | PASS |
| Multiple subscribers all receive | IPC-03 | PASS |
| Unsubscribe stops delivery | IPC-04 | PASS |
| Malformed content produces graceful passthrough | IPC-05 | PASS |
| Shell-injected events reach matching subscribers | IPC-06 | PASS |

Evidence: `npx playwright test inter-pane.spec.ts` -- 6 passed

## Regression Check

All 35 prior-phase tests (9 AUTH + 9 MSG + 5 RPL + 5 LCY + 4 harness + 3 smoke) continue to pass.

Total test suite: **66 tests, 0 failures**.

Evidence: `pnpm test:e2e` -- 66 passed (9.7s)

## Requirements Coverage

All 31 Phase 4 requirements verified:
- ACL-01 through ACL-09 (9/9)
- STR-01 through STR-09 (9/9)
- SGN-01 through SGN-07 (7/7)
- IPC-01 through IPC-06 (6/6)

## Additional Deliverables

- Storage quota calculation fixed to use TextEncoder (D-02) -- now consistent UTF-8 byte counting
- Test harness extended with 20 new window globals across 4 capability areas

## Test Files

- `tests/e2e/acl-enforcement.spec.ts` -- 9 ACL enforcement tests
- `tests/e2e/storage-isolation.spec.ts` -- 9 storage isolation tests
- `tests/e2e/signer-delegation.spec.ts` -- 7 signer delegation tests
- `tests/e2e/inter-pane.spec.ts` -- 6 inter-pane communication tests
- `tests/e2e/harness/harness.ts` -- Extended with capability test globals
- `packages/shell/src/storage-proxy.ts` -- Fixed quota calculation
