---
phase: 03-core-protocol-tests
plan: 02
status: complete
started: 2026-03-30
completed: 2026-03-30
---

# Plan 03-02 Summary: AUTH Tests (AUTH-01 through AUTH-09)

## What was built

9 Playwright tests proving all NIP-42 AUTH handshake scenarios: valid handshake succeeds, and each of the 8 rejection paths produces the correct error response.

## Key files

### Created
- `tests/e2e/auth.spec.ts` -- 9 AUTH behavioral tests using pure-napplet for controlled AUTH injection
- `tests/fixtures/napplets/pure-napplet/src/index.html` -- Minimal napplet without @napplet/shim (no auto-AUTH)
- `tests/fixtures/napplets/pure-napplet/package.json` -- Build config for pure-napplet fixture

### Modified
- `packages/shell/src/pseudo-relay.ts` -- Strict validation: reject AUTH events missing type tag or aggregateHash tag (AUTH-08/09)
- `package.json` -- Added @test/pure-napplet to test:build pipeline

## Key decisions

- Used pure-napplet (no shim) for AUTH-02 through AUTH-09 to avoid race condition with shim's auto-AUTH response. AUTH-01 still uses auth-napplet (with shim) to prove the full happy path.
- AUTH-08 and AUTH-09 required a production code change: pseudo-relay.ts now rejects missing type/aggregateHash tags instead of defaulting to 'unknown'/'' (per CONTEXT D-02).

## Self-Check: PASSED

- [x] tests/e2e/auth.spec.ts exists with 9 test cases
- [x] AUTH-01: valid handshake -> OK true
- [x] AUTH-02: bad signature -> OK false "invalid signature"
- [x] AUTH-03: expired timestamp -> OK false "too far from now"
- [x] AUTH-04: future timestamp -> OK false "too far from now"
- [x] AUTH-05: wrong challenge -> OK false "challenge mismatch"
- [x] AUTH-06: wrong relay tag -> OK false "relay tag"
- [x] AUTH-07: wrong kind -> OK false "22242"
- [x] AUTH-08: missing type tag -> OK false (strict)
- [x] AUTH-09: missing aggregateHash -> OK false (strict)
- [x] All 9 tests pass on 2 consecutive runs (no flakiness)
- [x] Phase 2 tests still pass (7 tests)
- [x] `pnpm build` succeeds

## Deviations

- Plan suggested using setupForDefectiveAuth with sendChallenge() to create fresh challenges after initial AUTH. This had a race condition with the shim auto-responding. Created pure-napplet fixture instead for reliable control.
