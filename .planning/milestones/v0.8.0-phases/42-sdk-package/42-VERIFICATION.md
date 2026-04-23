---
status: passed
phase: 42
phase_name: sdk-package
verified: 2026-04-02T13:30:00Z
---

# Phase 42: SDK Package — Verification

## Goal Verification

**Phase Goal:** Bundler-consuming developers can `import { relay, ipc } from '@napplet/sdk'` and get typed wrappers around window.napplet without depending on the shim

**Result:** PASSED -- all success criteria met.

## Success Criteria

### SC1: Package exists with config files
**Status:** PASSED
- `packages/sdk/package.json` -- exists, name `@napplet/sdk`, version `0.1.0`
- `packages/sdk/tsconfig.json` -- exists, extends root, DOM lib included
- `packages/sdk/tsup.config.ts` -- exists, ESM-only, dts, sourcemap

### SC2: Named exports delegate to window.napplet.*
**Status:** PASSED
- `import { relay, ipc, services, storage } from '@napplet/sdk'` -- all four exported
- Each method calls `requireNapplet()` at invocation time (12 call sites)
- Runtime guard throws clear error: `"window.napplet not installed -- import @napplet/shim first"`

### SC3: import * produces structurally identical object
**Status:** PASSED
- `import * as napplet from '@napplet/sdk'` produces `{ relay, ipc, services, storage }` plus type re-exports
- Structure mirrors `window.napplet` shape from `NappletGlobal` interface

### SC4: No dependency on @napplet/shim
**Status:** PASSED
- `package.json` dependencies: only `@napplet/core: workspace:*`
- No peer or dev dependency on `@napplet/shim`
- Source file has zero imports from `@napplet/shim`

### SC5: All public protocol types re-exported
**Status:** PASSED
- `NostrEvent` -- re-exported from @napplet/core
- `NostrFilter` -- re-exported from @napplet/core
- `ServiceInfo` -- re-exported from @napplet/core
- `Subscription` -- re-exported from @napplet/core
- `EventTemplate` -- re-exported from @napplet/core
- All visible in `dist/index.d.ts` (line 2)

## Requirement Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| PKG-02 | Verified | `packages/sdk/` exists with package.json, tsconfig.json, tsup.config.ts |
| PKG-03 | Verified | No `@napplet/shim` in any dependency field |
| SDK-01 | Verified | `relay`, `ipc`, `services`, `storage` exported, each delegates to window.napplet.* |
| SDK-02 | Verified | NostrEvent, NostrFilter, ServiceInfo, Subscription, EventTemplate in dist/index.d.ts |
| SDK-03 | Verified | `import *` produces `{ relay, ipc, services, storage }` -- structurally identical to window.napplet |

## Build Verification

- `pnpm install` -- exits 0, SDK package wired into workspace
- `tsup` -- produces `dist/index.js` (3.51 KB), `dist/index.d.ts` (5.52 KB), `dist/index.js.map` (8.99 KB)
- `tsc --noEmit` -- zero errors
- ESM-only output confirmed

## Known Issues

- Demo napplets (`demo-chat`, `demo-bot`) and `publish-napplet` test fixture fail to build because they still import named exports from `@napplet/shim` (removed in Phase 41). This is expected -- Phase 43 (Demo & Test Migration) addresses this.

## must_haves

- [x] `@napplet/sdk` workspace package with package.json, tsconfig.json, tsup.config.ts
- [x] `relay`, `ipc`, `services`, `storage` named exports delegating to window.napplet.*
- [x] Runtime guard (requireNapplet) with clear error message
- [x] All five protocol types re-exported from @napplet/core
- [x] Window type augmentation with NappletGlobal
- [x] No @napplet/shim dependency
- [x] Build produces ESM + DTS + source maps
- [x] Type-check passes
