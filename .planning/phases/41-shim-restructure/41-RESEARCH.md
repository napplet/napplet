# Phase 41: Shim Restructure - Research

**Researched:** 2026-04-02
**Domain:** @napplet/shim window installer restructure, TypeScript global augmentation, ESM side-effect modules
**Confidence:** HIGH

## Summary

Phase 41 converts `@napplet/shim` from a named-export relay library into a pure side-effect window installer. The transformation is a code reorganization with no new functionality — the existing `subscribe/publish/query/emit/on/nappletState` implementations are preserved but moved from named exports to properties of a fully namespaced `window.napplet` global. The `window.nostr` and `window.nostrdb` installers are unchanged.

**Transformation map:**
- `window.napplet.relay.subscribe/publish/query` ← `relay-shim.ts` functions (unchanged behavior)
- `window.napplet.ipc.emit/on` ← `emit()` / `on()` in `index.ts` (unchanged behavior)
- `window.napplet.services.list/has` ← new wrappers around `discoverServices()` / merged `hasService/hasServiceVersion` (same implementation)
- `window.napplet.storage.getItem/setItem/removeItem/keys` ← `nappletState.*` methods (unchanged, `clear()` dropped per D-05)
- `@napplet/core` gets new `NappletGlobal` interface + Window augmentation

All deprecated symbols (`nappState`, `nappStorage`, `nappletState`, `discoverServices`, `hasService`, `hasServiceVersion`, typed shim exports) are removed entirely. After this phase, `import '@napplet/shim'` is strictly side-effect-only.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PKG-01 | `@napplet/shim` has zero named exports — pure window installer | D-01: no value exports, no type exports; all existing exports removed |
| WIN-01 | `window.napplet.relay` exposes `{ subscribe, publish, query }` | relay-shim.ts functions unchanged; re-assigned as sub-object properties |
| WIN-02 | `window.napplet.ipc` exposes `{ emit, on }` | emit()/on() lifted from module-scope to sub-object; same body |
| WIN-03 | `window.napplet.services` exposes `{ list, has }` | discoverServices() → list(); hasService/hasServiceVersion merged → has(name, version?) |
| WIN-04 | `window.napplet.storage` exposes `{ getItem, setItem, removeItem, keys }` | nappletState.* methods; clear() dropped per D-05 |
| DEP-01 | `discoverServices`, `hasService`, `hasServiceVersion` removed from all exports | replace with list/has on services sub-object |
| DEP-02 | `nappState`, `nappStorage`, `nappletState` removed from all exports | replace with storage sub-object; clear() not available |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- ESM-only (no CJS output)
- Zero framework dependencies
- TypeScript strict mode; `verbatimModuleSyntax: true` — explicit `import type` required
- `pnpm type-check` must pass across all packages
- All public API exports require JSDoc (moot here — shim has zero exports post-phase)
- 2-space indentation, semicolons required
- Side-effect-only shim: `window.napplet.*` is the entire API surface

## Standard Stack

No new libraries or dependencies. TypeScript `declare global { interface Window { ... } }` is a standard TS pattern.

### Tools Used
| Tool | Purpose |
|------|---------|
| `pnpm type-check` | TypeScript validation gate (turbo run type-check across all packages) |
| `pnpm build` | Build all packages to confirm tsup output is correct |
| `grep -r` | Verification that old named exports are eliminated |

## Architecture Patterns

### NappletGlobal Interface Location
Per decision D-03/D-04 and the context notes, `NappletGlobal` belongs in `@napplet/core` (zero-dep shared types layer). Both shim (for its Window augmentation) and SDK (Phase 42) can then import the canonical interface without cross-dependency between siblings.

`@napplet/core/src/types.ts` gains:
```typescript
export interface NappletGlobal {
  relay: {
    subscribe(filters: NostrFilter | NostrFilter[], onEvent: (e: NostrEvent) => void, onEose: () => void, options?: { relay?: string; group?: string }): { close(): void };
    publish(template: EventTemplate, options?: { relay?: boolean }): Promise<NostrEvent>;
    query(filters: NostrFilter | NostrFilter[]): Promise<NostrEvent[]>;
  };
  ipc: {
    emit(topic: string, extraTags?: string[][], content?: string): void;
    on(topic: string, callback: (payload: unknown, event: NostrEvent) => void): { close(): void };
  };
  services: {
    list(): Promise<ServiceInfo[]>;
    has(name: string, version?: string): Promise<boolean>;
  };
  storage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
    keys(): Promise<string[]>;
  };
}
```

`ServiceInfo` also moves to `@napplet/core` (currently defined locally in `discovery-shim.ts`). It is structurally identical to `ServiceDescriptor` already in core — but per the decisions, the shim uses `ServiceInfo` name. Best approach: define `ServiceInfo` as an alias for `ServiceDescriptor` in core, or simply add it as a separate named export. Given that `ServiceDescriptor` is already the authoritative name in core/types.ts and `ServiceInfo` is the shim's consumer-facing name (simpler, no `description` required), the cleanest approach is to export `ServiceInfo` as an alias: `export type ServiceInfo = ServiceDescriptor;` in core.

The Window augmentation goes in `@napplet/shim/src/index.ts` (or a new `globals.d.ts` within the shim package):
```typescript
declare global {
  interface Window {
    napplet: NappletGlobal;
  }
}
```

### services.has() Merged Signature
Old: `hasService(name)` + `hasServiceVersion(name, version)` — two separate functions.
New: `has(name, version?)` — single function with optional `version` parameter:
- If `version` is omitted: `services.some(s => s.name === name)` (same as old `hasService`)
- If `version` is provided: `services.some(s => s.name === name && s.version === version)` (same as old `hasServiceVersion`)

### Module Structure After Transformation

`packages/shim/src/index.ts` changes:
1. Remove all `export { ... }` and `export function` / `export type` declarations
2. The `emit()` and `on()` functions become local functions (no longer exported) — same implementation
3. `window.napplet` assignment expands from the 3-key discovery-only object to the full 4-sub-object shape
4. `_setInterPaneEventSender(emit)` continues to work because `emit` is still a local function reference

`packages/shim/src/state-shim.ts` changes:
1. Remove `export const nappletState`, `export const nappState`, `export const nappStorage`
2. The `nappletState` object still exists internally (module-level) — it becomes the implementation backing `window.napplet.storage`
3. `clear()` is dropped from the internal `nappletState` object (D-05)
4. `installStateShim()` and `_setInterPaneEventSender()` remain exported (they are used by index.ts)

`packages/shim/src/discovery-shim.ts` changes:
1. `discoverServices()`, `hasService()`, `hasServiceVersion()` become module-internal (no longer exported)
2. `ServiceInfo` interface moves to `@napplet/core` and is imported from there
3. A new `list()` function is a thin alias for `discoverServices()` — or rename inline
4. A new `has(name, version?)` merges the two old functions — inlined into `window.napplet.services`

`packages/core/src/types.ts` changes:
1. Add `ServiceInfo` type export (alias for ServiceDescriptor or standalone)
2. Add `NappletGlobal` interface
3. Import `EventTemplate` and `Subscription` from where they currently live (relay-shim.ts) — but since those are currently *shim-only* types and shim can't export them anymore, they should move to core as well

**Important:** `Subscription` and `EventTemplate` are currently defined in `relay-shim.ts` and exported from shim. Per D-02, they are no longer exported from shim. They must move to `@napplet/core` so `NappletGlobal` can reference them in its type definitions. This is a prerequisite for `NappletGlobal` being expressible in core without a dependency on shim.

`packages/core/src/index.ts` changes:
1. Re-export `ServiceInfo`, `NappletGlobal`, `Subscription`, `EventTemplate`

### Exported vs. Not Exported from Shim
After this phase, `packages/shim/src/index.ts` has exactly **zero** named exports:
- No `export function`
- No `export const`
- No `export type`
- No `export { ... }`
- The global Window augmentation (`declare global { interface Window { napplet: NappletGlobal } }`) IS present in the `.d.ts` output (D-03) — this activates on `import '@napplet/shim'`
- `_setInterPaneEventSender` and `installStateShim` remain as internal module boundaries (still exported from `state-shim.ts` for import in `index.ts`) — they are not shim public API

## Don't Hand-Roll

- `declare global { interface Window { ... } }` — standard TypeScript module augmentation. Works in `.ts` files when the file has at least one import/export (it does). No third-party library needed.
- `ServiceInfo` as alias for `ServiceDescriptor` — if the types are identical, alias is cleaner than a separate definition

## Common Pitfalls

### Pitfall 1: verbatimModuleSyntax breaks `export type` from tsup
**What goes wrong:** `verbatimModuleSyntax: true` requires `export type { X }` not `export { X }` for type-only exports. Since shim will have zero exports, this is not an issue for shim itself. But `@napplet/core` will gain new `export type` statements — these must use `export type` syntax.
**How to avoid:** Always use `export type` for interface/type exports in core.

### Pitfall 2: NappletGlobal references types from shim (circular dependency)
**What goes wrong:** `NappletGlobal` references `Subscription`, `EventTemplate`, `ServiceInfo`, `NostrFilter`, `NostrEvent`. If `Subscription` and `EventTemplate` stay in `relay-shim.ts`, then `@napplet/core` cannot import them (core → shim would be a circular dep since shim → core).
**How to avoid:** Move `Subscription` and `EventTemplate` to `@napplet/core` before defining `NappletGlobal` there. Then shim imports them from core.

### Pitfall 3: state-shim.ts private exports become broken imports
**What goes wrong:** `installStateShim` and `_setInterPaneEventSender` are exported from `state-shim.ts` and imported in `index.ts`. They must remain exported from `state-shim.ts` (they are internal module exports, not public shim exports).
**How to avoid:** "Zero named exports" means zero exports from `packages/shim/src/index.ts` to the outside world. Internal cross-file exports within the shim package are not affected.

### Pitfall 4: tsup.config.ts includes entry point check
**What goes wrong:** If tsup is configured to emit `.d.ts` files but the only export is a global augmentation with no named exports, some bundler configs may strip the type output.
**How to avoid:** Ensure `packages/shim/tsup.config.ts` keeps `dts: true`. The global augmentation will be included in the `.d.ts` output because it is a module-level `declare global` statement. Verify with `pnpm build` that `packages/shim/dist/index.d.ts` contains the `declare global` block.

### Pitfall 5: Missing `export {}` in index.ts for module context
**What goes wrong:** `declare global` is only valid in a TypeScript module (a file with at least one `import` or `export`). If `index.ts` somehow lost all imports, the global declaration would be in ambient context instead of module context.
**How to avoid:** `index.ts` already has many imports — this is not a risk. The file will always be a module.

### Pitfall 6: Forgetting to remove discovery-shim.ts re-exports from index.ts
**What goes wrong:** `index.ts` line 28 currently has `export { discoverServices, hasService, hasServiceVersion } from './discovery-shim.js';` and `export type { ServiceInfo } from './discovery-shim.js';`. These must be removed.
**How to avoid:** Comprehensive list of export lines to remove (see File Inventory).

### Pitfall 7: state-shim.ts clear() still present
**What goes wrong:** D-05 drops `clear()` from `window.napplet.storage`. But the internal `nappletState` object in state-shim.ts currently has a `clear()` method. If `window.napplet.storage` is assigned as `nappletState` directly (spread or reference), `clear()` would remain accessible.
**How to avoid:** Assign `window.napplet.storage` explicitly with only the four required methods: `{ getItem, setItem, removeItem, keys }` pulled from the internal `nappletState` implementation. Do NOT spread the whole `nappletState` object. Alternatively, remove `clear()` from the internal `nappletState` object in state-shim.ts (since it's no longer needed anywhere).

## Code Examples

### NappletGlobal in @napplet/core

```typescript
// packages/core/src/types.ts (additions)
import type { NostrEvent, NostrFilter } from './types.js'; // already here

/** Subscription handle returned by relay.subscribe(). */
export interface Subscription {
  close(): void;
}

/** Unsigned event template for relay.publish(). */
export interface EventTemplate {
  kind: number;
  content: string;
  tags: string[][];
  created_at: number;
}

/** ServiceInfo describes an available shell service (used by window.napplet.services). */
export type ServiceInfo = ServiceDescriptor;

/** The window.napplet global installed by @napplet/shim. */
export interface NappletGlobal {
  relay: {
    subscribe(
      filters: NostrFilter | NostrFilter[],
      onEvent: (event: NostrEvent) => void,
      onEose: () => void,
      options?: { relay?: string; group?: string },
    ): Subscription;
    publish(template: EventTemplate, options?: { relay?: boolean }): Promise<NostrEvent>;
    query(filters: NostrFilter | NostrFilter[]): Promise<NostrEvent[]>;
  };
  ipc: {
    emit(topic: string, extraTags?: string[][], content?: string): void;
    on(topic: string, callback: (payload: unknown, event: NostrEvent) => void): Subscription;
  };
  services: {
    list(): Promise<ServiceInfo[]>;
    has(name: string, version?: string): Promise<boolean>;
  };
  storage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
    keys(): Promise<string[]>;
  };
}
```

### Window augmentation in shim index.ts

```typescript
// packages/shim/src/index.ts — add after imports, remove all export statements
import type { NappletGlobal } from '@napplet/core';

declare global {
  interface Window {
    napplet: NappletGlobal;
  }
}
```

### window.napplet assignment in shim index.ts

```typescript
// packages/shim/src/index.ts — replaces the current 3-key assignment at line 319-323
window.napplet = {
  relay: {
    subscribe,
    publish,
    query,
  },
  ipc: {
    emit,
    on,
  },
  services: {
    list: discoverServices,
    has: async (name: string, version?: string): Promise<boolean> => {
      const services = await discoverServices();
      if (version !== undefined) {
        return services.some(s => s.name === name && s.version === version);
      }
      return services.some(s => s.name === name);
    },
  },
  storage: {
    getItem: nappletStorage.getItem.bind(nappletStorage),
    setItem: nappletStorage.setItem.bind(nappletStorage),
    removeItem: nappletStorage.removeItem.bind(nappletStorage),
    keys: nappletStorage.keys.bind(nappletStorage),
  },
};
```

Note: Internal variable rename from `nappletState` to `nappletStorage` in state-shim.ts makes the import cleaner and avoids confusion with the old deprecated export name.

### state-shim.ts key change — drop deprecated exports and clear()

```typescript
// state-shim.ts: rename internal object, drop clear(), remove deprecated exports
// BEFORE:
export const nappletState = { getItem, setItem, removeItem, clear, keys };
export const nappState = nappletState;
export const nappStorage = nappletState;

// AFTER: (internal only, not exported from state-shim.ts)
const storageImpl = { getItem, setItem, removeItem, keys };
// Export only for index.ts consumption:
export { storageImpl as nappletStorageImpl };
// Or simpler: keep as nappletState internally, just remove the exports
```

Simplest approach: keep the internal object as-is, remove the `export const` keywords, and import by destructuring in index.ts.

## Complete File Inventory

### Files Requiring Code Changes

| File | Change |
|------|--------|
| `packages/core/src/types.ts` | Add `Subscription`, `EventTemplate`, `ServiceInfo`, `NappletGlobal` interfaces |
| `packages/core/src/index.ts` | Re-export the 4 new types |
| `packages/shim/src/index.ts` | Remove all named exports; add Window augmentation; expand window.napplet to 4-sub-object shape |
| `packages/shim/src/state-shim.ts` | Remove `export const nappletState/nappState/nappStorage`; remove `clear()` method; keep internal implementation |
| `packages/shim/src/discovery-shim.ts` | Remove `export interface ServiceInfo`; remove `export async function discoverServices/hasService/hasServiceVersion`; import ServiceInfo from @napplet/core; keep internal implementations |
| `packages/shim/src/relay-shim.ts` | Remove `export interface Subscription`; remove `export interface EventTemplate`; import them from @napplet/core instead |

### Files NOT to Change

| File | Reason |
|------|--------|
| `packages/shim/src/keyboard-shim.ts` | Unchanged per CONTEXT domain boundary |
| `packages/shim/src/nipdb-shim.ts` | Unchanged per CONTEXT domain boundary |
| `packages/shim/src/napplet-keypair.ts` | Unchanged — internal shim implementation detail |
| `packages/shim/src/types.ts` | Unchanged — pass-through re-exports from core; still valid |
| `packages/shell/*` | Not in scope — shell uses RuntimeAdapter, not the shim |
| `packages/runtime/*` | Not in scope |
| `apps/demo/*` | Deferred to Phase 43 |
| `tests/*` | Deferred to Phase 43 |

## State of the Art

| Old Approach | New Approach | Rationale |
|--------------|-------------|-----------|
| Named exports from `@napplet/shim` | Zero named exports; side-effect import only | PKG-01: shim is a window installer, not a library |
| `subscribe/publish/query` as named exports | `window.napplet.relay.subscribe/publish/query` | WIN-01: fully namespaced |
| `emit/on` as named exports from index.ts | `window.napplet.ipc.emit/on` | WIN-02: fully namespaced |
| `discoverServices/hasService/hasServiceVersion` | `window.napplet.services.list/has` | WIN-03, DEP-01: merged + namespaced |
| `nappletState/nappState/nappStorage` named exports | `window.napplet.storage.*` (no clear()) | WIN-04, DEP-02: namespaced, clear() dropped |
| `ServiceInfo` in discovery-shim.ts | `ServiceInfo` in @napplet/core | Canonical type location for SDK (Phase 42) |
| `Subscription`/`EventTemplate` in relay-shim.ts | Both in @napplet/core | Required for NappletGlobal definition in core |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright (e2e) + vitest (unit) |
| Quick run command | `pnpm type-check` |
| Full suite command | `pnpm test` (not in Phase 41 scope — tests use old API until Phase 43) |
| Build verification | `pnpm build` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Verification Method |
|--------|----------|---------------------|
| PKG-01 | Zero named exports | `grep -r 'export ' packages/shim/src/index.ts` — only `declare global` remains (no value or type exports) |
| WIN-01 | relay sub-object | `grep 'window.napplet.relay' packages/shim/src/index.ts` — confirms assignment |
| WIN-02 | ipc sub-object | `grep 'window.napplet.ipc' packages/shim/src/index.ts` — confirms assignment; also `window.napplet.ipc.emit` and `.on` |
| WIN-03 | services sub-object | `grep 'window.napplet.services' packages/shim/src/index.ts` — confirms assignment |
| WIN-04 | storage sub-object | `grep 'window.napplet.storage' packages/shim/src/index.ts` — confirms assignment |
| DEP-01 | discoverServices etc. gone | `grep -r 'export.*discoverServices\|export.*hasService' packages/shim/` — 0 hits |
| DEP-02 | nappletState etc. gone | `grep -r 'export const nappletState\|export const nappState\|export const nappStorage' packages/shim/` — 0 hits |

### Phase Gate
`pnpm type-check` green across all packages + `pnpm build` clean.

Note: Playwright e2e tests may fail during Phase 41 because the tests still reference old named exports (e.g., `subscribe()`, `nappletState`). This is expected and tracked — Phase 43 updates the tests. The `pnpm type-check` gate is the only automated gate for Phase 41.

## Open Questions

1. **internal nappletState export name in state-shim.ts**
   - The internal object that backs `window.napplet.storage` doesn't need to be exported with a specific name — `index.ts` imports it. The simplest approach is to keep the internal `nappletState` identifier but make it module-private (remove the `export const`) and export just the 4 methods, or export the internal object under a different name.
   - **Recommendation:** Remove `export const nappletState/nappState/nappStorage`. Keep the internal `nappletState` object as a module-scoped constant (no `export`). Export only `installStateShim` and `_setInterPaneEventSender` from state-shim.ts. In `index.ts`, import the storage methods via a new named export from state-shim.ts: `export { nappletState as _nappletStorageImpl }` or destructure the methods individually. The cleanest: add `export { getItem, setItem, removeItem, keys } from './state-shim.js'` style, but that's verbose. **Simplest: export the internal `nappletState` object renamed to a private-signalling name `_storageImpl` and import it in index.ts.**

2. **clear() in state-shim.ts**
   - Per D-05, `clear()` is dropped. It can be removed from the internal object, or just omitted from the `window.napplet.storage` assignment.
   - **Recommendation:** Remove `clear()` from the internal object entirely in state-shim.ts. This is cleaner than keeping dead code.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection of all 6 affected files
- `.planning/phases/41-shim-restructure/41-CONTEXT.md` — all decisions and canonical refs
- `.planning/REQUIREMENTS.md` — PKG-01, WIN-01–04, DEP-01–02 exact definitions
- `packages/core/src/types.ts` — confirmed `ServiceDescriptor` already exists
- `packages/shim/src/index.ts`, `state-shim.ts`, `discovery-shim.ts`, `relay-shim.ts` — full current implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new deps, standard TypeScript patterns
- Architecture: HIGH — complete file inventory; no structural ambiguity
- Pitfalls: HIGH — all cross-file dependencies mapped
- File inventory: HIGH — every affected file inspected directly

**Research date:** 2026-04-02
**Valid until:** Execution of Phase 41
