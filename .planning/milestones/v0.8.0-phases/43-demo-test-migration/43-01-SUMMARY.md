---
phase: 43
plan: 1
status: complete
started: 2026-04-02T13:30:00.000Z
completed: 2026-04-02T13:35:00.000Z
---

# Summary: 43-01 Migrate Demo Napplets to SDK Imports

## What was built

Migrated both demo napplets (chat and bot) from old named-export shim imports to the new namespaced SDK API:

- **Chat napplet**: `publish()` -> `relay.publish()`, `subscribe()` -> `relay.subscribe()`, `emit()`/`on()` -> `ipc.emit()`/`ipc.on()`, `nappState` -> `storage`
- **Bot napplet**: `emit()`/`on()` -> `ipc.emit()`/`ipc.on()`, `nappState` -> `storage`
- Both now use `import '@napplet/shim'` (side-effect) + `import { relay, ipc, storage } from '@napplet/sdk'`
- Updated package.json with `@napplet/sdk` workspace dependency
- Added Vite resolve aliases for `@napplet/shim` and `@napplet/sdk`

## Key files

### key-files.created
(none)

### key-files.modified
- apps/demo/napplets/chat/src/main.ts
- apps/demo/napplets/bot/src/main.ts
- apps/demo/napplets/chat/package.json
- apps/demo/napplets/bot/package.json
- apps/demo/napplets/chat/vite.config.ts
- apps/demo/napplets/bot/vite.config.ts

## Deviations

None.

## Self-Check: PASSED
