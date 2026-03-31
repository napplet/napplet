---
phase: 22-negotiation-compatibility
plan: "02"
subsystem: runtime
tags: [types, compatibility, consent, manifest, runtime-hooks]
provides:
  - ServiceInfo interface
  - CompatibilityReport interface
  - Extended ConsentRequest with type discriminator
  - ManifestCacheEntry.requires field
  - RuntimeHooks.onCompatibilityIssue callback
  - RuntimeHooks.strictMode flag
affects:
  - packages/runtime/src/types.ts
tech-stack:
  patterns:
    - Discriminated union type for ConsentRequest (backwards-compatible optional type field)
    - Optional fields on existing interfaces to preserve backwards-compat
key-files:
  modified:
    - packages/runtime/src/types.ts
key-decisions:
  - "ConsentRequest.type is optional (not required) so existing callers don't need updates"
  - "ManifestCacheEntry.requires is optional — cached entries without requires still work"
  - "RuntimeHooks.strictMode defaults to undefined (falsy) = permissive mode"
requirements-completed:
  - NEG-06
  - COMPAT-02
duration: "3 min"
completed: "2026-03-31"
---

# Phase 22 Plan 02: Runtime types for negotiation and compatibility — Summary

Added all Phase 22 type infrastructure to `packages/runtime/src/types.ts`: `ServiceInfo` and `CompatibilityReport` for the compatibility check result, extended `ConsentRequest` with a backwards-compatible `type` discriminator and `serviceName` field for undeclared service consent, extended `ManifestCacheEntry` with `requires?: string[]`, and added `onCompatibilityIssue` callback and `strictMode` flag to `RuntimeHooks`.

**Duration:** 3 min | **Tasks:** 6 | **Files:** 1

## Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | Add ServiceInfo interface | 5f0ba1c | Done |
| 2 | Add CompatibilityReport interface | 5f0ba1c | Done |
| 3 | Extend ConsentRequest with type discriminator | 5f0ba1c | Done |
| 4 | Extend ManifestCacheEntry with requires field | 5f0ba1c | Done |
| 5 | Add onCompatibilityIssue and strictMode to RuntimeHooks | 5f0ba1c | Done |
| 6 | Build and type-check runtime | 5f0ba1c | Done |

## Verification

- `grep "export interface CompatibilityReport" packages/runtime/src/types.ts` — PASS
- `grep "export interface ServiceInfo" packages/runtime/src/types.ts` — PASS
- `grep "undeclared-service" packages/runtime/src/types.ts` — PASS
- `grep "onCompatibilityIssue" packages/runtime/src/types.ts` — PASS
- `grep "strictMode" packages/runtime/src/types.ts` — PASS
- `pnpm --filter @napplet/runtime build` — PASS (exits 0)

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Self-Check: PASSED
