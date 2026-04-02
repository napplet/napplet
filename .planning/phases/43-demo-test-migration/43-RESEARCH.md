# Phase 43: Demo & Test Migration - Research

**Researched:** 2026-04-02
**Requirements:** ECO-01, ECO-02

## Research Summary

Phase 43 migrates demo napplets and test fixtures from old named-export shim imports to the new namespaced `window.napplet` API (via SDK for demos, via raw globals for test fixtures).

## Migration Inventory

### Files Requiring Code Changes

| File | Current Imports | Target Pattern | Scope |
|------|----------------|---------------|-------|
| `apps/demo/napplets/chat/src/main.ts` | `import { publish, subscribe, emit, on, nappState } from '@napplet/shim'` + `import type { EventTemplate } from '@napplet/shim'` | `import '@napplet/shim'` + `import { relay, ipc, storage, type EventTemplate } from '@napplet/sdk'` | 12 call sites |
| `apps/demo/napplets/bot/src/main.ts` | `import { emit, on, nappState } from '@napplet/shim'` | `import '@napplet/shim'` + `import { ipc, storage } from '@napplet/sdk'` | 9 call sites |
| `tests/fixtures/napplets/publish-napplet/src/main.ts` | `import { publish } from '@napplet/shim'` | `import '@napplet/shim'` + `window.napplet.relay.publish(...)` | 1 call site |

### Files Requiring No Code Changes

| File | Reason |
|------|--------|
| `tests/fixtures/napplets/auth-napplet/src/main.ts` | Already `import '@napplet/shim'` side-effect only |
| `tests/e2e/test-napplet.html` | Already `import '@napplet/shim'` side-effect only |
| `tests/e2e/harness/harness.ts` | Uses `@napplet/shell` imports, not shim |
| All `tests/e2e/*.spec.ts` files | Use postMessage harness, no shim API references |
| All `tests/unit/*.test.ts` files | Test host-side components, no shim API references |

### Config Files Requiring Updates

| File | Change | Reason |
|------|--------|--------|
| `apps/demo/napplets/chat/package.json` | Add `"@napplet/sdk": "workspace:*"` to dependencies | Demo uses SDK imports |
| `apps/demo/napplets/bot/package.json` | Add `"@napplet/sdk": "workspace:*"` to dependencies | Demo uses SDK imports |
| `apps/demo/napplets/chat/vite.config.ts` | Add `@napplet/sdk` resolve alias | Dev mode source resolution |
| `apps/demo/napplets/bot/vite.config.ts` | Add `@napplet/sdk` resolve alias | Dev mode source resolution |
| `tests/e2e/vite.config.ts` | Add `@napplet/sdk` resolve alias | E2e test build resolution |

## API Mapping

### Chat Napplet (SDK imports)

| Old Call | New Call |
|----------|---------|
| `publish(template, [])` | `relay.publish(template, [])` |
| `subscribe(filters, onEvent, onEose)` | `relay.subscribe(filters, onEvent, onEose)` |
| `emit('chat:message', [], payload)` | `ipc.emit('chat:message', [], payload)` |
| `on('bot:response', handler)` | `ipc.on('bot:response', handler)` |
| `nappState.getItem(key)` | `storage.getItem(key)` |
| `nappState.setItem(key, value)` | `storage.setItem(key, value)` |

### Bot Napplet (SDK imports)

| Old Call | New Call |
|----------|---------|
| `emit('notifications:create', [], payload)` | `ipc.emit('notifications:create', [], payload)` |
| `emit('bot:response', [], payload)` | `ipc.emit('bot:response', [], payload)` |
| `on('chat:message', handler)` | `ipc.on('chat:message', handler)` |
| `nappState.getItem(key)` | `storage.getItem(key)` |
| `nappState.setItem(key, value)` | `storage.setItem(key, value)` |

### Publish-Napplet Fixture (raw window.napplet)

| Old Call | New Call |
|----------|---------|
| `publish({ kind, content, tags, created_at })` | `window.napplet.relay.publish({ kind, content, tags, created_at })` |

## Vite Config Alias Pattern

Existing alias pattern from `tests/e2e/vite.config.ts`:
```typescript
'@napplet/shim': path.resolve(__dirname, '../../packages/shim/src/index.ts'),
```

SDK alias follows the same pattern:
```typescript
'@napplet/sdk': path.resolve(__dirname, '../../packages/sdk/src/index.ts'),
```

For demo napplets (`apps/demo/napplets/{name}/vite.config.ts`), the current config uses the `@napplet/vite-plugin` but does NOT have resolve aliases — they rely on workspace resolution via pnpm. Since demos need SDK imports and the vite-plugin already provides build-time features, we need to add resolve aliases for both `@napplet/shim` and `@napplet/sdk` to support the dev server pointing to source.

## Risk Analysis

### Low Risk
- Demo and test fixture migrations are mechanical find-and-replace with namespace prefixes
- E2e tests don't reference shim API — they test via postMessage which is unchanged
- Unit tests don't reference shim API — they test host-side components

### Medium Risk
- Demo vite configs currently lack `@napplet/shim` aliases (unlike e2e config) — adding SDK alias might also require adding shim alias for dev-mode source resolution
- `publish-napplet` fixture switches from named import to `window.napplet.relay.publish()` — needs to confirm `window.napplet` is populated before use (shim side-effect import runs first, synchronous)

### Verification Strategy
- `pnpm build` must succeed (all packages including demos compile)
- `pnpm type-check` must pass (TypeScript validates new import paths)
- E2e test suite (`pnpm test:e2e`) exercises demo napplets and test fixtures through the real browser pipeline
- Grep verification: zero remaining references to old named imports from shim in demo/test code

## Validation Architecture

### Pre-conditions
- Phase 41 (shim restructure) complete: `window.napplet` global installed with `relay`, `ipc`, `services`, `storage`
- Phase 42 (SDK package) complete: `@napplet/sdk` exists with named exports

### Post-conditions
- Zero named imports from `@napplet/shim` in demo or test code (only side-effect `import '@napplet/shim'`)
- All demo napplets use SDK imports (`@napplet/sdk`)
- All test fixtures use raw `window.napplet.*` globals
- Build passes, type-check passes, e2e tests pass

---

*Phase: 43-demo-test-migration*
*Research completed: 2026-04-02*
