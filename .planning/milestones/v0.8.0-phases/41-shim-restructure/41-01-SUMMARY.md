---
phase: 41-shim-restructure
plan: 01
status: complete
started: 2026-04-02T16:40:00.000Z
completed: 2026-04-02T16:45:00.000Z
---

# Plan 41-01 Summary: Shim Restructure — Window Installer

## What Was Built

Transformed `@napplet/shim` from a named-export library into a pure side-effect window installer. After this change, `import '@napplet/shim'` installs `window.napplet` with four namespaced sub-objects (`relay`, `ipc`, `services`, `storage`) and zero importable names.

## Key Changes

### @napplet/core (types.ts, index.ts)
- Added `Subscription`, `EventTemplate`, `ServiceInfo` (type alias for ServiceDescriptor), `NappletGlobal` interface
- `NappletGlobal` has full JSDoc and typed relay/ipc/services/storage sub-objects
- All four types exported from core index

### @napplet/shim (relay-shim.ts)
- Removed local `Subscription` and `EventTemplate` interface definitions
- Now imports both types from `@napplet/core`

### @napplet/shim (discovery-shim.ts)
- Removed local `ServiceInfo` interface
- Imports `ServiceInfo` from `@napplet/core`
- `discoverServices` kept as internal export only (for index.ts to wire to `window.napplet.services.list`)
- `hasService` and `hasServiceVersion` made private (logic inlined in index.ts `services.has()`)

### @napplet/shim (state-shim.ts)
- Removed `export` from `nappletState`
- Removed deprecated aliases `nappState` and `nappStorage`
- Removed `clear()` method
- Added `_nappletStorage` internal export for index.ts

### @napplet/shim (index.ts)
- Removed entire "Public API exports" section (12 lines of `export` statements)
- Added `declare global { interface Window { napplet: NappletGlobal } }` type augmentation
- Removed `export` from `emit()` and `on()` functions
- Replaced 3-key `window.napplet` assignment with full 4-sub-object shape
- `services.has(name, version?)` inlines the old hasService/hasServiceVersion logic

## Verification

- `pnpm type-check` passes with zero errors across all 14 packages
- `pnpm build` succeeds for all packages
- Zero `^export ` lines in `packages/shim/src/index.ts`

## Key Files

### Created
(none)

### Modified
- `packages/core/src/types.ts` — NappletGlobal, Subscription, EventTemplate, ServiceInfo
- `packages/core/src/index.ts` — re-exports new types
- `packages/shim/src/relay-shim.ts` — imports types from core
- `packages/shim/src/discovery-shim.ts` — imports from core, private functions
- `packages/shim/src/state-shim.ts` — private nappletState, removed deprecated exports
- `packages/shim/src/index.ts` — zero named exports, Window augmentation, namespaced window.napplet

## Self-Check: PASSED

All 6 tasks executed and verified. `pnpm type-check` green.
