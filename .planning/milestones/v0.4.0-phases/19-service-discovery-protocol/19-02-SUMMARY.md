---
plan: 19-02
phase: 19-service-discovery-protocol
title: "Discovery protocol unit tests"
status: complete
completed: 2026-03-31
---

# Summary: Plan 19-02

## What Was Built

Comprehensive vitest unit test suite for the kind 29010 service discovery protocol.

## Key Files Created

- **packages/runtime/src/discovery.test.ts** (new) — 13 tests across 6 describe blocks

## Test Coverage

| Requirement | Test | Status |
|-------------|------|--------|
| DISC-01 | Responds with one EVENT per service then EOSE | PASS |
| DISC-01 | Subscription ID echoed in EVENT and EOSE | PASS |
| DISC-02 | Discovery events contain s, v, and optional d tags | PASS |
| DISC-02 | Sentinel pubkey (64 zeros) and sig (128 zeros) | PASS |
| DISC-03 | Core infra + optional services in same unified response | PASS |
| DISC-04 | Empty registry yields EOSE with zero EVENTs | PASS |
| D-10 | registerService() pushes EVENT to open subscriptions | PASS |
| CLOSE | Closing subscription stops live updates | PASS |
| Auth | Unauthenticated window gets no events (pre-auth queue) | PASS |
| Edge | Multiple filters all kind 29010 triggers discovery | PASS |
| Edge | Mixed kinds (1 + 29010) does NOT trigger discovery | PASS |
| Edge | Discovery events have unique IDs | PASS |
| Edge | Multiple independent discovery REQs from same window | PASS |

## Test Run Results

- pnpm --filter @napplet/runtime exec vitest run src/discovery.test.ts: 13/13 passed
- pnpm test (full suite): 122/122 passed — no regressions

## Self-Check: PASSED

- All 13 discovery tests pass
- No regressions in existing 109-test suite
- Test file imports createRuntime, createMockRuntimeHooks, BusKind, AUTH_KIND, SHELL_BRIDGE_URI, ServiceHandler
- AUTH handshake helper uses same pattern as dispatch.test.ts

## Key-Files Created

```yaml
key-files:
  created:
    - packages/runtime/src/discovery.test.ts
```
