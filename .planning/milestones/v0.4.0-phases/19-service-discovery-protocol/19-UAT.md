---
status: complete
phase: 19-service-discovery-protocol
source: 19-01-SUMMARY.md, 19-02-SUMMARY.md
started: 2026-03-31T17:40:00Z
updated: 2026-03-31T17:40:00Z
---

## Current Test

[testing complete]

## Tests

### 1. kind 29010 REQ returns one EVENT per service then EOSE
expected: Run `pnpm --filter @napplet/runtime exec vitest run src/discovery.test.ts` — all 13 tests pass covering DISC-01 through DISC-04.
result: pass

### 2. Empty registry sends EOSE with zero EVENTs
expected: A shell with no registered services responds to a kind 29010 REQ with EOSE immediately and zero EVENTs. Covered by test suite (DISC-04).
result: pass

### 3. Live subscriptions receive push when new service registered
expected: If a napplet has an open kind 29010 subscription and the shell calls `registerService()`, the napplet receives a new EVENT for that service without re-sending REQ. Covered by D-10 test.
result: pass

### 4. Mixed-kind filters do NOT trigger discovery
expected: A REQ with filters `[{kinds:[1,29010]}]` does NOT get the synthetic discovery response — only pure `{kinds:[29010]}` REQs are intercepted. Covered by edge case tests.
result: pass

## Summary

total: 4
passed: 4
issues: 0
pending: 0
skipped: 0

## Gaps

[none yet]
