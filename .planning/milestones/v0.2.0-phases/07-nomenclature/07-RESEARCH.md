# Phase 7: Nomenclature - Research

**Researched:** 2026-03-30
**Status:** Complete

## Objective

Map every file and reference that must change for the pseudo-relay to ShellBridge rename and the storage to state completion. This is a mechanical rename phase with no behavioral changes.

## 1. ShellBridge Rename — Full Inventory

### 1.1 Source Files (packages/shell)

**File rename:**
- `packages/shell/src/pseudo-relay.ts` -> `packages/shell/src/shell-bridge.ts`

**Inside `packages/shell/src/shell-bridge.ts` (currently pseudo-relay.ts):**
- Line 2: JSDoc comment references "pseudo-relay.ts" and "pseudo-relay"
- Line 4: JSDoc references "pseudo-relay instance"
- Line 13: Import of `PSEUDO_RELAY_URI` -> `SHELL_BRIDGE_URI`
- Line 25: `export interface PseudoRelay` -> `export interface ShellBridge`
- Line 39: JSDoc "Create a pseudo-relay instance"
- Line 42: JSDoc "@returns A PseudoRelay instance"
- Line 44: `export function createPseudoRelay(hooks: ShellHooks): PseudoRelay` -> `export function createShellBridge(hooks: ShellHooks): ShellBridge`
- Line 164: `PSEUDO_RELAY_URI` reference -> `SHELL_BRIDGE_URI`
- Line 607: `const relay: PseudoRelay` -> `const relay: ShellBridge`

**`packages/shell/src/index.ts`:**
- Line 5: `export { createPseudoRelay } from './pseudo-relay.js'` -> `export { createShellBridge } from './shell-bridge.js'`
- Line 6: `export type { PseudoRelay } from './pseudo-relay.js'` -> `export type { ShellBridge } from './shell-bridge.js'`
- Line 42: `PSEUDO_RELAY_URI` in exports -> `SHELL_BRIDGE_URI`

**`packages/shell/src/types.ts`:**
- Line 8: `export const PSEUDO_RELAY_URI = 'napplet://shell' as const` -> `export const SHELL_BRIDGE_URI = 'napplet://shell' as const`

**`packages/shell/src/napp-key-registry.ts`:**
- Line 4: Comment references "pseudo-relay"

**`packages/shell/src/origin-registry.ts`:**
- Line 4: Comment references "pseudo-relay"

### 1.2 Source Files (packages/shim)

**`packages/shim/src/types.ts`:**
- Line 29: Comment references "pseudo-relay"
- Line 47: JSDoc references "pseudo-relay URI"
- Line 48: `export const PSEUDO_RELAY_URI = 'napplet://shell' as const` -> `export const SHELL_BRIDGE_URI = 'napplet://shell' as const`

**`packages/shim/src/index.ts`:**
- Line 3: Comment references "shell pseudo-relay"
- Line 13: Import `PSEUDO_RELAY_URI` -> `SHELL_BRIDGE_URI`
- Line 29: JSDoc references "shell pseudo-relay"
- Line 213: Usage of `PSEUDO_RELAY_URI` -> `SHELL_BRIDGE_URI`

**`packages/shim/src/relay-shim.ts`:**
- Line 2: Comment references "shell pseudo-relay"

**`packages/shim/src/nipdb-shim.ts`:**
- Line 3: Comment references "shell pseudo-relay"

### 1.3 Demo App

**`apps/demo/src/shell-host.ts`:**
- Line 9: Import `createPseudoRelay` -> `createShellBridge`
- Line 13: Import `type PseudoRelay` -> `type ShellBridge`
- Line 245: `export let relay: PseudoRelay` -> `export let relay: ShellBridge`
- Line 251: Comment references "pseudo-relay"
- Line 253: Return type `PseudoRelay` -> `ShellBridge`
- Line 275: `relay = createPseudoRelay(hooks)` -> `relay = createShellBridge(hooks)`

### 1.4 Test Files

**`tests/e2e/harness/harness.ts`:**
- Line 14: Import `createPseudoRelay` -> `createShellBridge`
- Line 15: Import `type PseudoRelay` -> `type ShellBridge`
- Line 29: `__getRelay__: () => PseudoRelay` -> `__getRelay__: () => ShellBridge`
- Line 66: Comment references "pseudo-relay"
- Line 124: `const relay = createPseudoRelay(mockResult.hooks)` -> `const relay = createShellBridge(mockResult.hooks)`

**`tests/helpers/message-tap.ts`:**
- Line 178: Comment references "pseudo-relay's"
- Line 216: Comment references "pseudo-relay"

**`tests/e2e/inter-pane.spec.ts`:**
- Line 4: Comment references "pseudo-relay's"

**`tests/e2e/replay.spec.ts`:**
- Line 4: Comment references "pseudo-relay's"

### 1.5 Documentation

**`SPEC.md`:**
- Line 30: "acting as a NIP-01 pseudo-relay"
- Line 244: "the shell's configured pseudo-relay URI"
- Line 1200: "pseudo-relay.ts" in file reference

**`packages/shell/README.md`:**
- Lines 5, 17, 20, 31, 76, 98, 100, 108, 110, 138, 156, 174: Multiple references to `createPseudoRelay`, `PseudoRelay`, `PSEUDO_RELAY_URI`, and "pseudo-relay"

**`CLAUDE.md` (project root):**
- Line 12: "createPseudoRelay factory"
- Line 125: "pseudo-relay.ts"
- Line 128: "createPseudoRelay()"
- Line 132: "createPseudoRelay()"
- Line 137: "PseudoRelay"
- Line 177: "pseudo-relay.ts"
- Line 185: "createPseudoRelay(): PseudoRelay"
- Line 219: "pseudo-relay.ts"
- Line 238: "createPseudoRelay(hooks)"

## 2. Storage to State — Remaining Work

### 2.1 Already Done
- All source packages (shell, shim) use `state:read`/`state:write` and `shell:state-*` topics
- SPEC.md uses `state:read`/`state:write` and `shell:state-*` topics
- Demo app uses `state:read`/`state:write`
- `storage-isolation.spec.ts` internally already uses `shell:state-*` topics

### 2.2 Still Needed

**File rename:**
- `tests/e2e/storage-isolation.spec.ts` -> `tests/e2e/state-isolation.spec.ts`

**`tests/e2e/acl-enforcement.spec.ts`:**
- Line 236: `['t', 'shell:storage-get']` -> `['t', 'shell:state-get']`
- Line 287: `['t', 'shell:storage-set']` -> `['t', 'shell:state-set']`

### 2.3 Not In Scope (already correct)
- All `storage:read`/`storage:write` capability strings in tests are already `state:read`/`state:write`
- All test assertions already use `state:read capability denied` / `state:write capability denied`

## 3. Build and Test Impact

- **tsup build**: Must pass after file rename (`pseudo-relay.ts` -> `shell-bridge.ts`) and all import updates
- **TypeScript type-check**: Must pass with new type names
- **66 existing tests**: Must all pass (number from roadmap success criteria)
- **Import resolution**: `@napplet/shell` barrel export changes from `./pseudo-relay.js` to `./shell-bridge.js`
- **No runtime behavior changes**: Value of URI constant stays `'napplet://shell'`, only the constant name changes

## 4. Risk Analysis

**Low risk** — this is a mechanical rename with:
- No behavioral changes
- No API shape changes (same functions, same parameters, same return types)
- Pre-v1, no external consumers to break
- All changes are find-and-replace verifiable

**Key ordering constraint:** The shell package must build successfully before tests can run, since tests import from `@napplet/shell` (the built package).

## 5. Recommended Plan Structure

Two plans in one wave (since they are independent rename tracks):

1. **Plan 07-01: ShellBridge rename** — Rename file, update all source code, update test harness, update demo, update docs (SPEC.md, README, CLAUDE.md)
2. **Plan 07-02: State rename completion** — Rename test file, fix 2 remaining topic strings in acl-enforcement.spec.ts

Both can be wave 1 since they modify different files (no overlap). However, 07-01 should be done first or in the same wave because the build must pass before tests run, and 07-01 changes the shell package barrel export.

Actually, since they modify different files within the same package (07-01 changes shell-bridge.ts/index.ts/types.ts, 07-02 changes only test files), they can safely be wave 1 together. The build will need to happen after 07-01 completes.

## RESEARCH COMPLETE
