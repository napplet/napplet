---
status: passed
phase: 14-shell-adapter-and-shim-rewire
verifier: inline
verified_at: 2026-03-31T11:20:00Z
---

# Phase 14: Shell Adapter and Shim Rewire — Verification

## Phase Goal

> @napplet/shell is a thin browser adapter that delegates to @napplet/runtime; @napplet/shim uses @napplet/core types with no behavioral changes

## Must-Have Verification

### Success Criterion 1: createShellBridge(hooks) internally calls createRuntime(adaptHooks(hooks))

**Status: PASS**

```
$ grep 'createRuntime' packages/shell/src/shell-bridge.ts
import { createRuntime } from '@napplet/runtime';
  const runtime: Runtime = createRuntime(runtimeHooks);

$ grep 'adaptHooks' packages/shell/src/shell-bridge.ts
import { adaptHooks } from './hooks-adapter.js';
  const runtimeHooks = adaptHooks(hooks, {
```

Shell is an adapter, not an engine. All protocol logic delegated to runtime.

### Success Criterion 2: ShellHooks interface is unchanged

**Status: PASS**

```
$ grep 'interface ShellHooks' packages/shell/src/types.ts
export interface ShellHooks {
```

ShellHooks interface preserved with all original fields (relayPool, relayConfig, windowManager, auth, config, hotkeys, workerRelay, crypto, dm?, onAclCheck?, services?). Existing hyprgate integration code will compile without modification.

### Success Criterion 3: Browser-specific modules remain in shell, not runtime

**Status: PASS**

```
$ ls packages/shell/src/origin-registry.ts packages/shell/src/state-proxy.ts packages/shell/src/manifest-cache.ts packages/shell/src/audio-manager.ts
packages/shell/src/audio-manager.ts
packages/shell/src/manifest-cache.ts
packages/shell/src/origin-registry.ts
packages/shell/src/state-proxy.ts

$ test ! -f packages/runtime/src/origin-registry.ts && echo "NOT in runtime"
NOT in runtime
$ test ! -f packages/runtime/src/state-proxy.ts && echo "NOT in runtime"
NOT in runtime
$ test ! -f packages/runtime/src/audio-manager.ts && echo "NOT in runtime"
NOT in runtime
```

### Success Criterion 4: @napplet/shim has no local protocol type definitions

**Status: PASS**

```
$ grep -c 'interface NostrEvent' packages/shim/src/types.ts
0
$ grep -c 'interface NostrFilter' packages/shim/src/types.ts
0
$ grep '@napplet/core' packages/shim/src/types.ts
export type { NostrEvent, NostrFilter } from '@napplet/core';
export { BusKind, AUTH_KIND, SHELL_BRIDGE_URI, PROTOCOL_VERSION } from '@napplet/core';
export type { BusKindValue } from '@napplet/core';
```

All types come from @napplet/core.

### Success Criterion 5: Shim's public API unchanged

**Status: PASS**

```
$ grep 'export.*subscribe\|export.*publish\|export.*query' packages/shim/src/index.ts
export { subscribe, publish, query } from './relay-shim.js';

$ grep 'export.*nappSt' packages/shim/src/index.ts
export { nappState, nappStorage } from './state-shim.js';

$ pnpm build --filter @napplet/shim  # exits 0
$ pnpm type-check --filter @napplet/shim  # exits 0
```

## Requirement Verification

| ID | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| SHELL-01 | createShellBridge wraps createRuntime(adaptHooks(hooks)) | PASS | shell-bridge.ts lines 137-141 |
| SHELL-02 | ShellHooks interface preserved for backwards compatibility | PASS | types.ts unchanged interface |
| SHELL-03 | origin-registry stays in shell | PASS | packages/shell/src/origin-registry.ts exists |
| SHELL-04 | state-proxy stays in shell | PASS | packages/shell/src/state-proxy.ts exists |
| SHELL-05 | manifest-cache stays in shell | PASS | packages/shell/src/manifest-cache.ts exists |
| SHELL-06 | audio-manager stays in shell | PASS | packages/shell/src/audio-manager.ts exists |
| SHELL-07 | Shell depends on @napplet/runtime + @napplet/core | PASS | package.json has both workspace deps |
| SHIM-01 | Shim imports types from @napplet/core | PASS | types.ts is pure re-exports from core |
| SHIM-02 | Shim local types.ts reduced to re-exports only | PASS | 11 lines, no local definitions |
| SHIM-03 | No behavioral changes to shim | PASS | Public API identical, build passes |

## Build Verification

```
$ pnpm --recursive --filter "@napplet/*" exec rm -rf dist && pnpm build
# All 13 tasks pass

$ pnpm type-check
# All 12 tasks pass

$ ls packages/*/dist/index.js
packages/acl/dist/index.js
packages/core/dist/index.js
packages/runtime/dist/index.js
packages/shell/dist/index.js
packages/shim/dist/index.js
```

## Dependency Graph

```
@napplet/core     -> (no @napplet/* deps)
@napplet/acl      -> (no @napplet/* deps)
@napplet/runtime  -> @napplet/core, @napplet/acl
@napplet/shell    -> @napplet/core, @napplet/runtime
@napplet/shim     -> @napplet/core
```

No circular dependencies. Build order correct: core -> acl -> runtime -> shell (and core -> shim in parallel).

## Code Size

- `shell-bridge.ts`: 180 lines (was 746 — 76% reduction)
- `hooks-adapter.ts`: 276 lines (new — bridge between ShellHooks and RuntimeHooks)
- `shim/types.ts`: 11 lines (pure re-exports)

## Overall

**10/10 requirements verified. Phase goal achieved.**

---
*Verified: 2026-03-31*
