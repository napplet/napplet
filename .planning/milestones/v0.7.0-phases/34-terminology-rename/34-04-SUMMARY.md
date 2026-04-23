---
plan: 04
phase: 34
status: complete
completed: 2026-04-01
commit: 08f2653
---

# Plan 34-04 Summary: Shim, Services, and Vite-Plugin Updates

## What Was Done

Updated the shim package, services package, and vite-plugin package to use the new terminology.

### Shim Package Changes

**`packages/shim/src/state-shim.ts`:**
- `nappletState` canonical export (was `nappState`)
- `export const nappState = nappletState` as `@deprecated` alias
- `export const nappStorage = nappletState` as `@deprecated` alias

**`packages/shim/src/index.ts`:**
- Imports `loadOrCreateKeypair` from `./napplet-keypair.js`
- `getNappletType()` function (was `getNappType()`) with dual meta attribute query: queries `meta[name="napplet-type"]` first, then falls back to `meta[name="napplet-napp-type"]`
- Exports `nappletState`, `nappState`, `nappStorage`

**`packages/shim/src/keyboard-shim.ts`** and **`packages/shim/src/nipdb-shim.ts`:**
- Import `NappletKeypair` type from `./napplet-keypair.js`
- Parameter and variable types updated

### Services Package Changes

**`packages/services/src/types.ts`:**
- `AudioSource.nappletClass: string` (was `nappClass`)
- JSDoc updated: "napplet class/type" throughout

**`packages/services/src/audio-service.ts`:**
- `nappletClass` field used in `sources.set()`
- `createResponseEvent('napplet:audio-muted', ...)` topic

### Vite-Plugin Changes

**`packages/vite-plugin/src/index.ts`:**
- Injects BOTH `<meta name="napplet-type">` (new canonical) AND `<meta name="napplet-napp-type">` (deprecated backward compat) in `transformIndexHtml()`
- JSDoc updated: "Napplet type/dtag identifier"

## Verification

- `pnpm type-check`: 14 successful, 14 total
- Both meta tags injected for backward compatibility
- Deprecated `nappState`/`nappStorage` aliases present
