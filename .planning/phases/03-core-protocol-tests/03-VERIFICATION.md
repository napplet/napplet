---
status: passed
phase: 03-core-protocol-tests
verified: 2026-03-30
---

# Phase 03: Core Protocol Tests -- Verification

## Phase Goal

The fundamental protocol mechanics -- authentication, message routing, replay protection, and lifecycle management -- are proven correct by automated tests.

## Must-Have Verification

### 1. All 9 AUTH scenarios pass

**Status: PASSED**

- AUTH-01: Valid handshake -> OK true, napp registered
- AUTH-02: Bad signature -> OK false "invalid signature"
- AUTH-03: Expired timestamp -> OK false "too far from now"
- AUTH-04: Future timestamp -> OK false "too far from now"
- AUTH-05: Wrong challenge -> OK false "challenge mismatch"
- AUTH-06: Wrong relay tag -> OK false "relay tag"
- AUTH-07: Wrong kind -> OK false "22242"
- AUTH-08: Missing type tag -> OK false (strict, per D-02)
- AUTH-09: Missing aggregateHash -> OK false (strict, per D-02)

Evidence: `npx playwright test auth.spec.ts` -- 9 passed

### 2. REQ/EVENT/CLOSE/EOSE lifecycle works end-to-end

**Status: PASSED**

- MSG-01: REQ creates subscription, buffered events delivered
- MSG-02: Matching EVENT delivered to subscriber
- MSG-03: Non-matching EVENT not delivered
- MSG-04: CLOSE stops delivery
- MSG-05: EOSE sent after buffer scan

Evidence: `npx playwright test routing.spec.ts` -- MSG-01 through MSG-05 pass

### 3. Inter-pane routing rules enforced

**Status: PASSED**

- MSG-06: Sender excluded from own kind 29003 delivery
- MSG-07: p-tag event delivered only to targeted napp
- MSG-08: Pre-AUTH REQ queued and replayed after AUTH
- MSG-09: Blocked napp receives CLOSED with denial reason

Evidence: `npx playwright test routing.spec.ts` -- MSG-06 through MSG-09 pass

### 4. Replay detection rejects old/future/duplicate and cleans up

**Status: PASSED**

- RPL-01: Old timestamp (>30s) rejected with "too old"
- RPL-02: Future timestamp (>10s) rejected with "in the future"
- RPL-03: Duplicate event ID rejected with "already processed"
- RPL-04: Seen ID cleanup verified via time mock
- RPL-05: Unregistered window message silently ignored

Evidence: `npx playwright test replay.spec.ts` -- 5 passed

### 5. Lifecycle edge cases handled

**Status: PASSED**

- LCY-01: Pre-AUTH REQ replayed after successful AUTH
- LCY-02: AUTH rejection clears queue, NOTICE sent
- LCY-03: cleanup() removes all state
- LCY-04: Non-array postMessage silently ignored
- LCY-05: Null source window silently ignored

Evidence: `npx playwright test lifecycle.spec.ts` -- 5 passed

## Requirement Coverage

All 28 Phase 3 requirements verified:
- AUTH-01 through AUTH-09 (9 requirements)
- MSG-01 through MSG-09 (9 requirements)
- RPL-01 through RPL-05 (5 requirements)
- LCY-01 through LCY-05 (5 requirements)

## Test Suite

Total: 35 e2e tests (7 Phase 2 + 28 Phase 3)
Command: `pnpm test` -- exits 0
No flaky tests on repeated runs.

## Production Code Changes

- `packages/shell/src/pseudo-relay.ts`: Strict tag validation for AUTH-08/AUTH-09 (missing type/aggregateHash tags now reject instead of defaulting)

## Artifacts Created

- `tests/e2e/auth.spec.ts` -- 9 AUTH tests
- `tests/e2e/routing.spec.ts` -- 9 message routing tests
- `tests/e2e/replay.spec.ts` -- 5 replay protection tests
- `tests/e2e/lifecycle.spec.ts` -- 5 lifecycle tests
- `tests/fixtures/napplets/pure-napplet/` -- Test napplet without shim (for controlled AUTH)
