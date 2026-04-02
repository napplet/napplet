---
phase: 42
plan: 2
title: Implement SDK wrapper exports and type re-exports
status: complete
started: 2026-04-02T13:24:00Z
completed: 2026-04-02T13:28:00Z
---

# Summary: 42-02 Implement SDK wrapper exports and type re-exports

## What was built

Created the SDK entry point (`packages/sdk/src/index.ts`) with four namespaced export objects that delegate to `window.napplet.*` at call time, plus type re-exports from `@napplet/core`.

## Key files

### Created
- `packages/sdk/src/index.ts` — Full SDK implementation (~246 lines)

## Architecture

- **Runtime guard:** `requireNapplet()` checks `window.napplet` at call time (not import time), throwing a clear error if the shim hasn't been imported
- **Export objects:** `relay`, `ipc`, `services`, `storage` — each with explicit typed methods that delegate to `window.napplet.*`
- **Type re-exports:** `NostrEvent`, `NostrFilter`, `ServiceInfo`, `Subscription`, `EventTemplate` from `@napplet/core`
- **Window augmentation:** `declare global { interface Window { napplet: NappletGlobal } }` for autocompletion

## Build verification

- `packages/sdk/dist/index.js` — 3.51 KB ESM output
- `packages/sdk/dist/index.d.ts` — 5.52 KB type declarations
- `tsc --noEmit` passes with zero errors
- All four namespace exports and five protocol types verified in `.d.ts`

## Known pre-existing issues

- Demo napplets (`demo-chat`, `demo-bot`) and `publish-napplet` test fixture fail to build because they still import named exports from `@napplet/shim` which Phase 41 removed. This is expected — Phase 43 (Demo & Test Migration) will update these.

## Self-Check: PASSED

All acceptance criteria verified:
- Four export objects with correct method signatures
- requireNapplet() guard called in every method (12 call sites)
- All five protocol types re-exported
- Window type augmentation with NappletGlobal
- No imports from @napplet/shim
- Build produces ESM + DTS + source maps
- Type-check passes cleanly
