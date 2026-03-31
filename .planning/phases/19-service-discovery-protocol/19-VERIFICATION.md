---
status: passed
phase: 19-service-discovery-protocol
verifier: inline (Task tool unavailable)
verified: 2026-03-31
---

# Phase 19 Verification: Service Discovery Protocol

## Phase Goal

> A napplet can send a kind 29010 REQ and receive one EVENT per registered service followed by EOSE — the runtime synthesizes discovery responses from its registry

## Must-Have Verification

### DISC-01: kind 29010 REQ returns one EVENT per service + EOSE

**Truth 1:** `packages/runtime/src/service-discovery.ts` exists with `createServiceDiscoveryEvent()` and `handleDiscoveryReq()`
- VERIFIED: `test -f packages/runtime/src/service-discovery.ts` → exists
- VERIFIED: Both functions exported from the file

**Truth 2:** `handleReq()` in runtime.ts intercepts REQs where all filters contain `kinds: [29010]`
- VERIFIED: `isDiscoveryReq(filters)` call at line 359 in runtime.ts, BEFORE relay pool queries
- VERIFIED: Returns early after calling `handleDiscoveryReq()`

**Truth 3:** `handleDiscoveryReq()` iterates every service, creates one EVENT per service with s/v/d tags, then sends EOSE
- VERIFIED: Test "DISC-01: responds with one EVENT per service then EOSE" passes with 2 services → 2 EVENTs + 1 EOSE
- VERIFIED: EOSE ordering test also passes

**Truth 4:** Synthetic events use sentinel values: pubkey='0'.repeat(64), sig='0'.repeat(128), random hex id
- VERIFIED: Test "DISC-02: synthetic events use sentinel pubkey and sig" passes (all 13/13 tests pass)

**Truth 5 (DISC-04):** Empty registry sends EOSE immediately with zero EVENTs
- VERIFIED: Test "responds with EOSE immediately and zero EVENTs" passes

**Truth 6 (D-10):** Open discovery subscriptions receive new EVENTs when `registerService()` is called
- VERIFIED: Test "registerService pushes new EVENT to open discovery subscriptions" passes

**Truth 7:** `registerService()` pushes synthetic EVENT to all open discovery subscriptions
- VERIFIED: Test result + `createServiceDiscoveryEvent` call at line 721 in runtime.ts

**Truth 8:** CLOSE removes discovery subscription from tracking
- VERIFIED: `discoverySubscriptions.delete(subKey)` at line 430 in handleClose()
- VERIFIED: Test "CLOSE stops live discovery updates" passes

**Truth 9:** `pnpm build` succeeds
- VERIFIED: All 13 packages built successfully

**Truth 10:** `pnpm type-check` passes
- VERIFIED: 12 packages, zero errors

## Phase Goal Success Criteria

1. **When a napplet sends a REQ filtering for kind 29010, the runtime responds with one synthetic EVENT per registered service containing s (name), v (version), and optional d (description) tags**
   - VERIFIED: Tests DISC-01, DISC-02 pass

2. **A shell with no registered services responds with EOSE immediately and zero EVENTs**
   - VERIFIED: Test DISC-04 passes

3. **Both core infrastructure services and optional services appear in the same discovery response**
   - VERIFIED: Test DISC-03 passes (relay-pool, cache, audio in same response)

## Requirements Coverage

| Requirement | Verified By |
|-------------|-------------|
| DISC-01 | Tests: "DISC-01: responds with one EVENT per service then EOSE", "DISC-01: subscription ID is echoed" |
| DISC-02 | Tests: "DISC-02: discovery events contain s, v, and optional d tags", "DISC-02: synthetic events use sentinel pubkey and sig" |
| DISC-03 | Test: "core infrastructure and optional services appear in same response" |
| DISC-04 | Test: "responds with EOSE immediately and zero EVENTs" |

## Automated Test Results

- **Unit tests (discovery.test.ts):** 13/13 passed
- **Full test suite:** 122/122 passed — no regressions

## Human Verification Items

None required. All functionality is fully automated.
