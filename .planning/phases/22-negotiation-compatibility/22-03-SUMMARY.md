---
phase: 22-negotiation-compatibility
plan: "03"
subsystem: runtime
tags: [compatibility, auth, manifest-cache, service-registry, negotiation]
provides:
  - checkCompatibility() function integrated into AUTH success flow
  - getRequires() on ManifestCache
  - registeredServices Map tracking for compatibility checks
  - cacheManifest() helper preserving requires during AUTH updates
  - CompatibilityReport and ServiceInfo exported from runtime barrel
affects:
  - packages/runtime/src/runtime.ts
  - packages/runtime/src/manifest-cache.ts
  - packages/runtime/src/index.ts
tech-stack:
  patterns:
    - Pre-populate registeredServices from hooks.services at init
    - cacheManifest helper for DRY manifest updates with requires preservation
key-files:
  modified:
    - packages/runtime/src/runtime.ts
    - packages/runtime/src/manifest-cache.ts
    - packages/runtime/src/index.ts
key-decisions:
  - "registeredServices is a separate Map from serviceRegistry — decouples compatibility info from dispatch logic"
  - "cacheManifest helper preserves pre-populated requires when AUTH overwrites cache entry"
  - "Compatibility check placed AFTER nappKeyRegistry.register so identity is established, BEFORE OK true so strict mode can block"
  - "In strict mode: sends OK false (inside checkCompatibility), then returns without dispatching queue"
requirements-completed:
  - NEG-01
  - NEG-02
  - NEG-03
  - NEG-04
  - COMPAT-03
duration: "4 min"
completed: "2026-03-31"
---

# Phase 22 Plan 03: Runtime compatibility check after AUTH — Summary

Implemented the core negotiation logic in `packages/runtime/src/runtime.ts`: after AUTH succeeds and the napp is registered, the runtime calls `checkCompatibility()` which reads the napplet's manifest requires from the cache, checks them against `registeredServices`, builds a `CompatibilityReport`, calls `onCompatibilityIssue` if services are missing, and either blocks (strict mode) or allows loading (permissive mode). Added `getRequires()` to `ManifestCache`, and a `cacheManifest()` helper that preserves pre-populated requires when AUTH updates the cache.

**Duration:** 4 min | **Tasks:** 9 | **Files:** 3

## Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | Add getRequires to manifest cache | 6ae4bd7 | Done |
| 2 | Add CompatibilityReport/ServiceInfo imports | c9a0a99 | Done |
| 3 | Add registeredServices Map to runtime state | c9a0a99 | Done |
| 4 | Add checkCompatibility function | c9a0a99 | Done |
| 5 | Integrate compatibility check into AUTH success flow | c9a0a99 | Done |
| 6 | Add cacheManifest helper preserving requires | c9a0a99 | Done |
| 7 | Populate registeredServices via registerService/unregisterService | c9a0a99 | Done |
| 8 | Export CompatibilityReport and ServiceInfo from index | c9a0a99 | Done |
| 9 | Build and type-check runtime | c9a0a99 | Done |

## Verification

- `grep "checkCompatibility" packages/runtime/src/runtime.ts` — PASS
- `grep "getRequires" packages/runtime/src/manifest-cache.ts` — PASS
- `grep "registeredServices" packages/runtime/src/runtime.ts` — PASS
- `grep "registerService" packages/runtime/src/runtime.ts` — PASS
- AUTH flow: register → compatibility check → strict block or OK true + queue dispatch — PASS
- `pnpm --filter @napplet/runtime build` — PASS (exits 0)

## Deviations from Plan

**[Rule 2 - Missing Critical]** Pre-populate registeredServices from hooks.services — The plan's Task 3 only mentioned adding the Map and populating on registerService calls, but `hooks.services` can contain services pre-registered at init time. Added a loop to pre-populate from `Object.entries(serviceRegistry)` at init. No new interfaces needed.

## Issues Encountered

None.

## Self-Check: PASSED
