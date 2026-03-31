---
phase: 11
plan: 1
title: "Method naming, API surface, and internal visibility cleanup"
status: complete
started: 2026-03-30
completed: 2026-03-30
---

# Summary: Plan 11-01

## What was built
Renamed all public ShellBridge methods to follow verb-noun naming convention, minimized the public API surface exported from @napplet/shell, and removed export keywords from internal-only helpers.

## Key changes
1. Renamed `onConsentNeeded` to `registerConsentHandler` (verb-noun convention)
2. Renamed `cleanup()` to `destroy()` (standard lifecycle method)
3. Renamed internal `storeAndRoute` to `bufferAndDeliver` (clearer intent)
4. Removed `export` from `aclKey()` in acl-store.ts (only used within file)
5. Removed `export` from `getPendingUpdateVersion()` in napp-key-registry.ts (only used within file)
6. Organized index.ts with "Public API" and "Internal re-exports" sections
7. Updated all consumers: demo app, test harness, lifecycle tests

## Key files
- packages/shell/src/shell-bridge.ts — renamed methods on interface and implementation
- packages/shell/src/index.ts — organized exports into public/internal sections
- packages/shell/src/acl-store.ts — removed export from aclKey
- packages/shell/src/napp-key-registry.ts — removed export from getPendingUpdateVersion
- apps/demo/src/shell-host.ts — updated to use new method names
- tests/e2e/harness/harness.ts — updated to use registerConsentHandler
- tests/e2e/lifecycle.spec.ts — updated to use destroy()

## Self-Check: PASSED
- All 122 tests pass
- Build succeeds
- Type-check succeeds
- No `onConsentNeeded` or `storeAndRoute` in shell source
- All ShellBridge methods follow verb-noun naming
