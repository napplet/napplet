---
phase: 02-test-infrastructure
plan: 06
status: complete
started: 2026-03-30
completed: 2026-03-30
---

## Summary

Created integration verification tests proving the entire test infrastructure works end-to-end. Removed old smoke test from prior phase.

## What was built

- `tests/e2e/harness-smoke.spec.ts` - 4 smoke tests verifying harness boots correctly
- `tests/e2e/auth-handshake.spec.ts` - 3 integration tests verifying AUTH handshake completes
- Removed old `tests/e2e/smoke.spec.ts` (stale test from pre-phase-2 setup)

## Test results

7 tests, 7 passed, 0 failed (consistent across multiple runs)

### harness-smoke.spec.ts (4 tests)
- Shell boots and sets __SHELL_READY__ flag
- Exposes __loadNapplet__ function
- Exposes __TEST_MESSAGES__ array (initially empty)
- Exposes __clearMessages__ function

### auth-handshake.spec.ts (3 tests)
- auth-napplet completes AUTH handshake (verifies challenge -> response -> OK sequence with correct ordering)
- Message tap captures all protocol messages (verifies structure and completeness)
- clearMessages resets the message buffer

## Key design decisions

- Uses `expect.poll()` for async message waiting (avoids closure issues in page.evaluate)
- 15-second timeouts for AUTH completion (accounts for iframe load + crypto verification)
- Tests verify message ordering (challenge.index < response.index < ok.index)
- Tests verify NIP-42 AUTH kind (22242) in response

## Key files

- `tests/e2e/harness-smoke.spec.ts`
- `tests/e2e/auth-handshake.spec.ts`

## Verification

- `pnpm test` exits 0 (builds, unit tests, and e2e tests all pass)
- `pnpm test:e2e` exits 0 independently
- Tests pass consistently across 3 consecutive runs
