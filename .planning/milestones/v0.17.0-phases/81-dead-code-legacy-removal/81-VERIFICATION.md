---
status: passed
phase: 81-dead-code-legacy-removal
verified: 2026-04-08
---

# Phase 81: Dead Code & Legacy Removal - Verification

## Must-Haves

| # | Truth | Status |
|---|-------|--------|
| 1 | discovery-shim.ts does not exist in @napplet/shim | PASS |
| 2 | window.napplet.services is gone from shim | PASS |
| 3 | ServiceDescriptor and ServiceInfo do not exist in @napplet/core | PASS |
| 4 | NappletGlobal.services property removed from types.ts | PASS |
| 5 | legacy.ts does not exist in @napplet/core | PASS |
| 6 | core/src/index.ts has zero legacy re-exports | PASS |
| 7 | core/src/index.test.ts has no BusKind/DESTRUCTIVE_KINDS/BusKindValue | PASS |
| 8 | napplet-napp-type meta tag not read by shim | PASS |
| 9 | napplet-napp-type not injected by vite-plugin | PASS |
| 10 | pnpm build passes with zero errors | PASS |
| 11 | pnpm type-check passes with zero errors | PASS |
| 12 | Core tests pass (26/26) | PASS |

## Requirements Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| DEAD-01 | PASS | discovery-shim.ts deleted |
| DEAD-02 | PASS | services block removed from shim index.ts |
| DEAD-03 | PASS | ServiceDescriptor/ServiceInfo removed from types.ts and index.ts |
| DEAD-04 | PASS | NappletGlobal.services property removed |
| DEAD-05 | PASS | legacy.ts deleted |
| DEAD-06 | PASS | Legacy re-exports removed from index.ts |
| DEAD-07 | PASS | BusKind/DESTRUCTIVE_KINDS tests removed |
| COMPAT-01 | PASS | napplet-napp-type fallback removed from shim |
| COMPAT-02 | PASS | napplet-napp-type injection removed from vite-plugin |

## Deletions Summary

- 2 files deleted (legacy.ts, discovery-shim.ts)
- ~370 lines removed across 6 files
- 0 new code added (pure deletion milestone)
