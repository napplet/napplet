---
plan: 03
phase: 34
status: complete
completed: 2026-04-01
commit: e7b0f9f
---

# Plan 34-03 Summary: Runtime and Shell Consumer Updates

## What Was Done

Updated all consumers of the renamed types in the runtime and shell packages.

### Runtime Package Changes

**`packages/runtime/src/runtime.ts`:**
- Imports updated to `createSessionRegistry`, `SessionRegistry`, `SessionEntry`
- Local vars: `nappType→nappletType`, `nappPubkey→nappletPubkey`, `nappEntry→nappletEntry`, `nappEntries→nappletEntries`, `nappInfoMap→nappletInfoMap`

**`packages/runtime/src/state-handler.ts`:**
- `sessionRegistry: SessionRegistry` parameter (was `nappKeyRegistry: NappKeyRegistry`)
- `scopedKey()` returns `napplet-state:` prefix (was `napp-state:`)
- `'napplet:state-response'` topic (was `'napp:state-response'`)
- Dual-read fallback: GET case tries new `napplet-state:` key first, falls back to old `napp-state:` key for migration
- `cleanupNappState` uses `napplet-state:` prefix for scan

**`packages/runtime/src/event-buffer.ts`**, **`packages/runtime/src/enforce.ts`**, **`packages/runtime/src/manifest-cache.ts`:**
- Import path and type name updates; JSDoc terminology updates

**`packages/runtime/src/index.ts`:**
- Added `SessionEntry`, `SessionRegistry`, `NappKeyRegistry`, `createSessionRegistry`, `createNappKeyRegistry` exports

### Shell Package Changes

**`packages/shell/src/state-proxy.ts`:** All `napp-state:` → `napplet-state:`; `sessionRegistry` usage

**`packages/shell/src/shell-bridge.ts`:** Import `sessionRegistry` (plus re-export deprecated `nappKeyRegistry`)

**`packages/shell/src/hooks-adapter.ts`:** Type updated for `sessionRegistry`

**`packages/shell/src/index.ts`:** Added `SessionEntry`, `sessionRegistry`, `nappKeyRegistry` exports

**`packages/shell/src/audio-manager.ts`:** `nappClass` → `nappletClass`; `'napplet:audio-muted'` topic

**`packages/shell/src/acl-store.ts`**, **`packages/shell/src/manifest-cache.ts`**, **`packages/shell/src/origin-registry.ts`:** JSDoc terminology updates

## Verification

- `pnpm type-check`: 14 successful, 14 total
- Dual-read migration logic present in `state-handler.ts`
- Deprecated aliases preserved for backward compat
