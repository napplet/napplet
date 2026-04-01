---
plan: 02
phase: 34
status: complete
completed: 2026-04-01
commit: 0ce95d9
---

# Plan 34-02 Summary: File Renames

## What Was Done

Renamed three source files to use the new terminology and created their replacements with updated exports and deprecated aliases.

### Files Deleted
- `packages/shim/src/napp-keypair.ts`
- `packages/runtime/src/napp-key-registry.ts`
- `packages/shell/src/napp-key-registry.ts`

### Files Created

**`packages/shim/src/napplet-keypair.ts`:**
- `NappletKeypair` interface (was `NappKeypair`)
- `export type NappKeypair = NappletKeypair` as `@deprecated` alias
- `loadOrCreateKeypair(_nappType)` function (behavior unchanged)

**`packages/runtime/src/session-registry.ts`:**
- `SessionRegistry` interface (was `NappKeyRegistry`)
- `export type NappKeyRegistry = SessionRegistry` as `@deprecated` alias
- `createSessionRegistry(notifier?)` factory function
- `export const createNappKeyRegistry = createSessionRegistry` as `@deprecated` alias

**`packages/shell/src/session-registry.ts`:**
- `sessionRegistry` object (was `nappKeyRegistry`)
- `export const nappKeyRegistry = sessionRegistry` as `@deprecated` alias

## Verification

- `pnpm type-check`: 14 successful, 14 total
- All imports updated to reference new file paths
