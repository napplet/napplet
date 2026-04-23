---
phase: 41-shim-restructure
plan: 02
status: complete
started: 2026-04-02T16:46:00.000Z
completed: 2026-04-02T16:48:00.000Z
---

# Plan 41-02 Summary: Verification

## What Was Verified

Confirmed that the shim restructure from Plan 01 is complete and correct across all 7 core packages.

## Verification Results

### Task 1: pnpm build
- All 7 core packages (@napplet/core, acl, runtime, shim, shell, services, vite-plugin) build clean
- Demo napplets and test fixtures fail as expected (Phase 43 scope -- they still use old named exports)

### Task 2: Shim dist output
- `packages/shim/dist/index.d.ts` contains `declare global { interface Window { napplet: NappletGlobal } }`
- Zero named export declarations (no `export declare function`, no `export type {`, no `export {}`)
- Only content is the NappletGlobal import and Window augmentation

### Task 3: Core dist output
- `packages/core/dist/index.d.ts` exports `NappletGlobal`, `Subscription`, `EventTemplate`, `ServiceInfo`
- All four types present with full JSDoc

### Task 4: Requirement verifications
- PKG-01: PASS -- zero named exports from shim index.ts
- WIN-01: PASS -- relay sub-object present (1 hit)
- WIN-02: PASS -- ipc sub-object present (1 hit)
- WIN-03: PASS -- services sub-object present (1 hit)
- WIN-04: PASS -- storage sub-object present (1 hit)
- DEP-01: PASS -- no discoverServices/hasService/hasServiceVersion exports
- DEP-02: PASS -- no nappletState/nappState/nappStorage exports
- NappletGlobal in core: PASS
- Window augmentation: PASS
- clear() removed: PASS

### Task 5: Core unit tests
- @napplet/core has no test script (pure types/constants package)
- `pnpm type-check` serves as validation -- passes with zero errors

## Expected Failures (Phase 43 Scope)

- Demo napplet builds (demo-chat, demo-bot) fail because they still import named exports from @napplet/shim
- Test fixture builds (publish-napplet, auth-napplet) fail for the same reason
- These are expected and will be migrated in Phase 43: Demo & Test Migration

## Self-Check: PASSED

All Phase 41 requirements verified. The shim is now a pure side-effect window installer.
