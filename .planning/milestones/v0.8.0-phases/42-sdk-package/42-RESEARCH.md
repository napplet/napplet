# Phase 42: SDK Package - Research

**Researched:** 2026-04-02
**Researcher:** Claude Opus 4.6

## Objective

Research how to implement Phase 42: SDK Package — a standalone `@napplet/sdk` workspace package that provides typed named exports wrapping `window.napplet.*` for bundler-consuming developers.

## 1. Current Codebase State

### Shim Package (will be transformed by Phase 41)

The current `packages/shim/src/index.ts` exports named functions (`subscribe`, `publish`, `query`, `emit`, `on`) and state objects (`nappletState`, `nappState`, `nappStorage`), plus service discovery functions. Phase 41 will eliminate all named exports and convert the shim into a pure side-effect window installer.

After Phase 41:
- `import '@napplet/shim'` installs `window.napplet` with `relay`, `ipc`, `services`, `storage` sub-objects
- Zero named exports from `@napplet/shim`
- Types (`NostrEvent`, `NostrFilter`, etc.) no longer re-exported from shim

### Core Package

`packages/core/src/types.ts` currently exports:
- `NostrEvent` — NIP-01 event interface
- `NostrFilter` — NIP-01 subscription filter interface
- `Capability` — capability string union
- `ServiceDescriptor` — service metadata interface
- `ALL_CAPABILITIES` — readonly capabilities array

After Phase 41, core will also export:
- `NappletGlobal` — the interface describing `window.napplet` shape (per 41-CONTEXT.md D-03/D-04)

### Types NOT in Core (currently in shim)

Two types currently live in shim-specific modules:
- `Subscription` — in `packages/shim/src/relay-shim.ts` (interface with `close(): void`)
- `EventTemplate` — in `packages/shim/src/relay-shim.ts` (unsigned event template)
- `ServiceInfo` — in `packages/shim/src/discovery-shim.ts` (parsed service info)

**Key finding:** Phase 41 will need to move these types to `@napplet/core` (or define equivalent types in core) so that:
1. The `NappletGlobal` interface can reference them
2. SDK can re-export them without depending on shim

This is consistent with 42-CONTEXT.md which says "Types come from `@napplet/core`" (D-04).

## 2. Package Scaffolding Requirements

### Workspace Package Structure

Every workspace package follows this pattern (observed from shim, core, services, etc.):

```
packages/sdk/
  package.json       — name, type: "module", exports map, sideEffects: false
  tsconfig.json      — extends root, adds DOM lib
  tsup.config.ts     — ESM-only, dts: true, sourcemap: true
  src/
    index.ts         — single entry point
```

### package.json Pattern

From `packages/shim/package.json` and `packages/core/package.json`:
- `"type": "module"` — ESM-only
- `"sideEffects": false` — SDK has NO side effects (unlike shim which is `true`)
- `"exports"` map with `types` + `import` conditions
- `"files": ["dist"]` — only ship built output
- `"publishConfig": { "access": "public" }` — scoped package
- Dependencies: `"@napplet/core": "workspace:*"` only (per D-04)
- No `nostr-tools` peer dep — SDK delegates to window.napplet at runtime
- DevDependencies: `tsup`, `typescript`

### tsconfig.json

Must include `"lib": ["ES2022", "DOM", "DOM.Iterable"]` since SDK references `window` in its runtime guards.

### turbo.json

No changes needed — `packages/*` glob already covers `packages/sdk`. The `"dependsOn": ["^build"]` pattern means SDK's build auto-depends on core's build.

### pnpm-workspace.yaml

No changes needed — `packages/*` glob already covers `packages/sdk`.

## 3. SDK Implementation Design

### Wrapper Pattern

Per 42-CONTEXT.md, the SDK uses explicit static objects with methods that lazily access `window.napplet.*` at call time. NOT Proxy-based.

Each method:
1. Checks `window.napplet` exists
2. Throws actionable error if missing: `"window.napplet not installed -- import @napplet/shim first"`
3. Delegates to the corresponding `window.napplet.*` method

### Runtime Guard

Per D-01 from 42-CONTEXT.md: a shared guard function used by all methods:

```typescript
function requireNapplet(): NappletGlobal {
  const w = window as Window & { napplet?: NappletGlobal };
  if (!w.napplet) {
    throw new Error('window.napplet not installed -- import @napplet/shim first');
  }
  return w.napplet;
}
```

### Export Surface

Per D-03 from 42-CONTEXT.md, single entry point only:

```typescript
// Namespaced runtime objects
export const relay = { subscribe, publish, query };
export const ipc = { emit, on };
export const services = { list, has };
export const storage = { getItem, setItem, removeItem, keys };

// Protocol types (re-exported from core)
export type { NostrEvent, NostrFilter, ServiceInfo, Subscription, EventTemplate };
```

### Method Signatures

SDK methods must mirror `window.napplet.*` signatures exactly. Based on current shim code and Phase 41 context:

**relay:**
- `subscribe(filters, onEvent, onEose, options?)` → `Subscription`
- `publish(template, options?)` → `Promise<NostrEvent>`
- `query(filters)` → `Promise<NostrEvent[]>`

**ipc:**
- `emit(topic, extraTags?, content?)` → `void`
- `on(topic, callback)` → `{ close(): void }`

**services:**
- `list()` → `Promise<ServiceInfo[]>`
- `has(name, version?)` → `Promise<boolean>`

**storage:**
- `getItem(key)` → `Promise<string | null>`
- `setItem(key, value)` → `Promise<void>`
- `removeItem(key)` → `Promise<void>`
- `keys()` → `Promise<string[]>`

### Window Type Augmentation

Per D-02 from 42-CONTEXT.md, SDK also includes the global Window augmentation in its `.d.ts` output:

```typescript
declare global {
  interface Window {
    napplet: NappletGlobal;
  }
}
```

This ensures TypeScript consumers who import only SDK (not shim) get `window.napplet.*` autocompletion.

### SDK-03 Compliance

`import * as napplet from '@napplet/sdk'` must produce an object structurally identical to `window.napplet`. This means the four exported objects (`relay`, `ipc`, `services`, `storage`) have the same shape as `window.napplet.relay`, `window.napplet.ipc`, etc.

The namespace import collects all named exports, so `napplet.relay`, `napplet.ipc`, `napplet.services`, `napplet.storage` all resolve correctly. The type re-exports are type-only and don't appear at runtime.

## 4. Dependencies and Build Order

### Package Dependency Graph

```
@napplet/sdk
  └── @napplet/core (workspace:*)   // for NappletGlobal, NostrEvent, NostrFilter, etc.
```

No dependency on `@napplet/shim` (PKG-03).
No `nostr-tools` peer dependency (D-04 from 42-CONTEXT.md).

### Build Pipeline

turborepo `"dependsOn": ["^build"]` ensures core builds before SDK. No special config needed.

## 5. Type Dependencies After Phase 41

Phase 41 is expected to add to `@napplet/core`:
- `NappletGlobal` interface — the complete `window.napplet` shape
- `Subscription` type (currently in shim's relay-shim.ts)
- `EventTemplate` type (currently in shim's relay-shim.ts)
- `ServiceInfo` type (currently in shim's discovery-shim.ts, or derived from `ServiceDescriptor`)

SDK imports all of these from `@napplet/core` and re-exports the public-facing types.

If Phase 41 uses different type names (e.g., `ServiceDescriptor` vs `ServiceInfo`), SDK should re-export with the developer-facing name.

## 6. Risk Analysis

### Low Risk

- **Package scaffolding**: Well-established pattern from 7 existing packages. Copy and adapt.
- **Build pipeline**: turborepo handles it automatically via `packages/*` glob.
- **Wrapper implementation**: Thin delegation, no complex logic.

### Medium Risk

- **Type availability from core after Phase 41**: SDK depends on `NappletGlobal`, `Subscription`, `EventTemplate`, and `ServiceInfo` being exported from `@napplet/core`. If Phase 41 doesn't move all these types to core, SDK's type imports will break. Mitigated by the 41-CONTEXT.md commitment to define NappletGlobal in core.

### No Risks

- No breaking changes to existing packages
- No runtime behavior changes
- No new protocol features

## 7. Validation Architecture

### What to Validate

1. **Package exists and builds**: `pnpm build` succeeds with `packages/sdk/dist/` populated
2. **Type-check passes**: `pnpm type-check` succeeds
3. **Export shape**: `import { relay, ipc, services, storage } from '@napplet/sdk'` compiles
4. **Star import shape**: `import * as napplet from '@napplet/sdk'` has `relay`, `ipc`, `services`, `storage` properties
5. **Type re-exports**: `import type { NostrEvent, NostrFilter, ServiceInfo, Subscription, EventTemplate } from '@napplet/sdk'` compiles
6. **No shim dependency**: `packages/sdk/package.json` does NOT contain `@napplet/shim`
7. **Runtime guard**: calling any SDK method without `window.napplet` installed throws the expected error message

### How to Validate

- `pnpm build` and `pnpm type-check` for build correctness
- `grep` assertions on `package.json` for dependency checks
- TypeScript compilation of test snippets for export shape
- The runtime guard behavior is verified by the method implementation pattern — each method calls `requireNapplet()` which throws if `window.napplet` is absent

## RESEARCH COMPLETE

Research artifacts cover all aspects needed for planning Phase 42. The implementation is well-scoped: scaffold a new workspace package, implement thin wrapper objects with runtime guards, re-export types from core, and add Window type augmentation.
