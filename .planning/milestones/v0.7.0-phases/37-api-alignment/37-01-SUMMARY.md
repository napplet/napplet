---
plan: 37-01
status: complete
completed_at: 2026-04-01
---

# Summary: API Alignment — 37-01

## What was done

Renamed all public integration interfaces across `@napplet/runtime` and `@napplet/shell` from `*Hooks` to `*Adapter`, with deprecated backward-compat aliases for one release cycle (removal in v0.9.0).

## Changes

### packages/runtime/src/types.ts
- Renamed `RuntimeHooks` → `RuntimeAdapter` (primary interface)
- Added `export type RuntimeHooks = RuntimeAdapter` deprecated alias with `@deprecated` JSDoc
- Renamed all 13 sub-interfaces: `RuntimeRelayPoolHooks` → `RelayPoolAdapter`, `RuntimeCacheHooks` → `CacheAdapter`, `RuntimeAuthHooks` → `AuthAdapter`, `RuntimeSigner` → `Signer`, `RuntimeConfigHooks` → `ConfigAdapter`, `RuntimeHotkeyHooks` → `HotkeyAdapter`, `RuntimeAclPersistence` → `AclPersistence`, `RuntimeManifestPersistence` → `ManifestPersistence`, `RuntimeStatePersistence` → `StatePersistence`, `RuntimeCryptoHooks` → `CryptoAdapter`, `RuntimeWindowManagerHooks` → `WindowManagerAdapter`, `RuntimeRelayConfigHooks` → `RelayConfigAdapter`, `RuntimeDmHooks` → `DmAdapter`
- Added naming-convention comment block before sub-interfaces explaining *Adapter vs *Hooks distinction

### packages/runtime/src/index.ts
- Exports `RuntimeAdapter` as primary, `RuntimeHooks` kept with deprecation comment
- All 13 sub-interface new names exported; old names removed from explicit export (still accessible via deprecated alias)

### packages/runtime/src/runtime.ts
- `createRuntime(hooks: RuntimeHooks)` → `createRuntime(hooks: RuntimeAdapter)`

### packages/runtime/src/test-utils.ts
- `createMockRuntimeHooks` → `createMockRuntimeAdapter` (primary)
- Added `createMockRuntimeHooks` deprecated wrapper delegating to primary
- All internal type annotations updated to new names

### packages/runtime/src/state-handler.ts, manifest-cache.ts, acl-state.ts
- Updated imports to use new sub-interface names

### packages/shell/src/types.ts
- Renamed `ShellHooks` → `ShellAdapter`
- Added `export type ShellHooks = ShellAdapter` deprecated alias
- Shell sub-interfaces (`RelayPoolHooks`, `AuthHooks`, etc.) unchanged — intentional

### packages/shell/src/shell-bridge.ts
- `createShellBridge(hooks: ShellHooks)` → `createShellBridge(hooks: ShellAdapter)`

### packages/shell/src/index.ts
- Exports `ShellAdapter` as primary, `ShellHooks` kept with deprecation comment

### packages/shell/src/hooks-adapter.ts
- `adaptHooks(shellHooks: ShellHooks, deps): RuntimeHooks` → `adaptHooks(shellHooks: ShellAdapter, deps): RuntimeAdapter`
- All 13 local variable type annotations updated

### packages/services/src/signer-service.ts, signer-service.test.ts
- Updated `RuntimeSigner` → `Signer` (caught during build verification)

## Verification

- `pnpm build` exits 0
- `pnpm type-check` exits 0
