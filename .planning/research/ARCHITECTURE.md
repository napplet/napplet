# Architecture Patterns: Keys NUB Integration

**Domain:** Napplet Protocol SDK -- Keys NUB
**Researched:** 2026-04-09
**Confidence:** HIGH (all conclusions derived from direct codebase analysis, no external sources needed)

## Recommended Architecture

The keys NUB replaces the ad-hoc `keyboard.forward` message in `keyboard-shim.ts` with a proper NUB domain following the established pattern of relay, signer, storage, ifc, and theme. The integration touches four layers: NUB type package, core envelope types, shim installation, and SDK re-exports.

### High-Level Integration Map

```
@napplet/nub-keys (NEW)        -- typed message definitions
       |
@napplet/core                  -- NubDomain union gains 'keys', NUB_DOMAINS gains entry
       |
@napplet/shim                  -- keyboard-shim.ts replaced by keys-shim.ts;
       |                          index.ts wires window.napplet.keys namespace
       |
@napplet/sdk                   -- re-exports keys NUB types + KEYS_DOMAIN constant;
                                  adds keys namespace wrapper
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `@napplet/nub-keys` | Typed message interfaces, DOMAIN constant, discriminated unions | `@napplet/core` (extends NappletMessage) |
| `@napplet/core` envelope.ts | NubDomain type union, NUB_DOMAINS array | All consumers of NubDomain |
| `@napplet/core` types.ts | NappletGlobal.keys namespace type | Shim (implements), SDK (wraps) |
| `@napplet/shim` keys-shim.ts | Capture-phase keydown listener, keys.* message sender, action registry, shell response handler | Shell via postMessage |
| `@napplet/shim` index.ts | Wires window.napplet.keys, calls installKeysShim() | keys-shim.ts |
| `@napplet/sdk` index.ts | Re-exports keys types, keys namespace wrapper | `@napplet/nub-keys`, window.napplet.keys |

### Data Flow

**Outbound (Napplet -> Shell):**

```
1. Napplet registers actions:
   window.napplet.keys.registerAction({ id: 'save', label: 'Save', binding: { key: 's', ctrl: true } })
   OR: import { keys } from '@napplet/sdk'; keys.registerAction(...)

2. keys-shim.ts stores action in local registry AND sends to shell:
   { type: 'keys.register', id: <uuid>, actions: [{ id: 'save', label: 'Save', binding: ... }] }

3. Shell registers bindings, replies:
   { type: 'keys.register.result', id: <uuid> }

4. User presses key in iframe:
   a. Capture-phase keydown listener fires in keys-shim.ts
   b. Check local action registry for matching binding
   c. If bound: preventDefault(), call local callback, send to shell:
      { type: 'keys.action', actionId: 'save' }
   d. If unbound AND not in text input AND not modifier-only:
      forward to shell for WM hotkeys:
      { type: 'keys.forward', key, code, ctrl, alt, shift, meta }
   e. If unbound AND in text input: do nothing (let napplet handle typing)
```

**Inbound (Shell -> Napplet):**

```
1. Shell triggers a napplet action via its own keybinding or UI:
   { type: 'keys.trigger', actionId: 'save' }
   -> keys-shim.ts dispatches to registered action callback

2. Shell pushes binding overrides (shell-preferred bindings):
   { type: 'keys.bindings', actions: [{ id: 'save', binding: { key: 's', ctrl: true, shift: true } }] }
   -> keys-shim.ts updates local binding registry
```

## New Components

### 1. `packages/nubs/keys/` -- @napplet/nub-keys (NEW PACKAGE)

Follows the exact scaffold of @napplet/nub-theme (simplest existing NUB):

```
packages/nubs/keys/
  package.json          -- @napplet/nub-keys, deps: @napplet/core
  tsconfig.json         -- extends ../../../tsconfig.json
  tsup.config.ts        -- entry: src/index.ts, format: esm, dts: true
  src/
    types.ts            -- message interfaces, DOMAIN constant, unions
    index.ts            -- barrel re-exports + domain registration with core dispatch
```

**Message types to define in `types.ts`:**

| Message | Direction | Has `id` | Purpose |
|---------|-----------|----------|---------|
| `keys.register` | Napplet -> Shell | Yes | Register action bindings |
| `keys.register.result` | Shell -> Napplet | Yes | Confirm registration |
| `keys.unregister` | Napplet -> Shell | No | Remove actions by ID |
| `keys.forward` | Napplet -> Shell | No | Forward unbound keystroke (replaces keyboard.forward) |
| `keys.action` | Napplet -> Shell | No | Napplet-side bound key triggered |
| `keys.trigger` | Shell -> Napplet | No | Shell invokes napplet action |
| `keys.bindings` | Shell -> Napplet | No | Shell pushes binding overrides |

7 message types total (comparable to theme's 3, relay's 9, signer's 14).

**Payload types to define:**

```typescript
/** A key combination (e.g., Ctrl+S, Alt+1). */
export interface KeyBinding {
  key: string;        // KeyboardEvent.key value
  code?: string;      // KeyboardEvent.code value (optional, for physical key matching)
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
}

/** An action that a napplet registers with the shell. */
export interface KeyAction {
  /** Unique action identifier (e.g., 'save', 'undo', 'format-bold'). */
  id: string;
  /** Human-readable label for keybinding UI. */
  label: string;
  /** Requested key binding (shell may override). */
  binding?: KeyBinding;
}
```

### 2. Modified: `packages/core/src/envelope.ts`

Two changes:

```typescript
// NubDomain: add 'keys' to the union
export type NubDomain = 'relay' | 'signer' | 'storage' | 'ifc' | 'theme' | 'keys';

// NUB_DOMAINS: add 'keys' to the array
export const NUB_DOMAINS: readonly NubDomain[] = [
  'relay', 'signer', 'storage', 'ifc', 'theme', 'keys',
] as const;
```

This is the **only change to @napplet/core's envelope module**. The NamespacedCapability type auto-derives from NubDomain, so `'nub:keys'` and bare `'keys'` become valid automatically.

### 3. Modified: `packages/core/src/types.ts`

Add `keys` namespace to `NappletGlobal`. The key design question: where do `KeyAction` and `KeyBinding` types live?

**Decision: Define them in `@napplet/nub-keys` only.** Core's NappletGlobal.keys uses inline structural types to avoid a dependency on the NUB package:

```typescript
export interface NappletGlobal {
  relay: { ... };
  ipc: { ... };
  storage: { ... };
  shell: NappletGlobalShell;
  keys: {
    registerAction(action: {
      id: string;
      label: string;
      binding?: { key: string; code?: string; ctrl?: boolean; alt?: boolean; shift?: boolean; meta?: boolean };
    }): Promise<void>;
    registerActions(actions: Array<{
      id: string;
      label: string;
      binding?: { key: string; code?: string; ctrl?: boolean; alt?: boolean; shift?: boolean; meta?: boolean };
    }>): Promise<void>;
    unregisterAction(actionId: string): void;
    onAction(actionId: string, callback: () => void): { close(): void };
  };
}
```

This preserves core's zero-dependency-on-NUBs invariant. The NUB package defines the canonical `KeyAction` and `KeyBinding` types; the core types structurally match but do not import them.

### 4. NEW: `packages/shim/src/keys-shim.ts`

Replaces `keyboard-shim.ts`. Retains `isTextInput()` and `isModifierOnly()` helpers. New responsibilities:

1. **Action registry**: `Map<string, { binding?: KeyBinding; callback?: () => void }>` for locally registered actions
2. **Smart keydown handler**: Check if keystroke matches any registered action binding. If yes: preventDefault, call callback, send `keys.action`. If no and not text input: send `keys.forward`.
3. **Inbound message handler**: Listen for `keys.trigger` (dispatch to callback) and `keys.bindings` (update local registry)
4. **Registration API**: `registerAction()`, `registerActions()`, `unregisterAction()`, `onAction()`
5. **Pending request tracking**: `Map<string, PendingRequest>` for `keys.register` -> `keys.register.result` correlation

Exports:
- `installKeysShim(): () => void` -- install keydown listener + inbound message listener
- `_nappletKeys` -- the namespace object for wiring into window.napplet.keys

Following the state-shim.ts pattern: installKeysShim adds its own `window.addEventListener('message', ...)` for inbound keys messages.

### 5. Modified: `packages/shim/src/index.ts`

Replace import:
```typescript
// OLD:
import { installKeyboardShim } from './keyboard-shim.js';
// NEW:
import { installKeysShim, _nappletKeys } from './keys-shim.js';
```

Wire window.napplet.keys in the global installation block:
```typescript
keys: {
  registerAction: _nappletKeys.registerAction.bind(_nappletKeys),
  registerActions: _nappletKeys.registerActions.bind(_nappletKeys),
  unregisterAction: _nappletKeys.unregisterAction.bind(_nappletKeys),
  onAction: _nappletKeys.onAction.bind(_nappletKeys),
},
```

Replace initialization call:
```typescript
// OLD:
installKeyboardShim();
// NEW:
installKeysShim();
```

### 6. Modified: `packages/shim/package.json`

Add dependency:
```json
"@napplet/nub-keys": "workspace:*"
```

### 7. Modified: `packages/sdk/src/index.ts`

Add keys namespace wrapper:
```typescript
export const keys = {
  registerAction(action: KeyAction): Promise<void> {
    return requireNapplet().keys.registerAction(action);
  },
  registerActions(actions: KeyAction[]): Promise<void> {
    return requireNapplet().keys.registerActions(actions);
  },
  unregisterAction(actionId: string): void {
    requireNapplet().keys.unregisterAction(actionId);
  },
  onAction(actionId: string, callback: () => void): Subscription {
    return requireNapplet().keys.onAction(actionId, callback);
  },
};
```

Add type re-exports (following existing NUB re-export pattern):
```typescript
// Keys NUB
export type {
  KeyBinding,
  KeyAction,
  KeysMessage,
  KeysRegisterMessage,
  KeysRegisterResultMessage,
  KeysUnregisterMessage,
  KeysForwardMessage,
  KeysActionMessage,
  KeysTriggerMessage,
  KeysBindingsMessage,
  KeysOutboundMessage,
  KeysInboundMessage,
  KeysNubMessage,
} from '@napplet/nub-keys';

export { DOMAIN as KEYS_DOMAIN } from '@napplet/nub-keys';
```

### 8. Modified: `packages/sdk/package.json`

Add dependency:
```json
"@napplet/nub-keys": "workspace:*"
```

## Integration Changeset Summary

### New Files (6)

| File | Purpose |
|------|---------|
| `packages/nubs/keys/package.json` | Package manifest |
| `packages/nubs/keys/tsconfig.json` | TypeScript config (extends root) |
| `packages/nubs/keys/tsup.config.ts` | Build config (ESM, dts, sourcemap) |
| `packages/nubs/keys/src/types.ts` | Message interfaces, DOMAIN, KeyBinding, KeyAction, unions |
| `packages/nubs/keys/src/index.ts` | Barrel exports + domain registration |
| `packages/shim/src/keys-shim.ts` | Keys shim implementation |

### Modified Files (7)

| File | Change |
|------|--------|
| `packages/core/src/envelope.ts` | Add `'keys'` to NubDomain union and NUB_DOMAINS array |
| `packages/core/src/types.ts` | Add `keys` namespace to NappletGlobal interface |
| `packages/core/src/index.ts` | Re-export any new types if needed (may be a no-op) |
| `packages/shim/src/index.ts` | Import keys-shim, wire window.napplet.keys, replace installKeyboardShim |
| `packages/shim/package.json` | Add `@napplet/nub-keys` dependency |
| `packages/sdk/src/index.ts` | Add keys namespace wrapper + type re-exports + KEYS_DOMAIN |
| `packages/sdk/package.json` | Add `@napplet/nub-keys` dependency |

### Deleted Files (1)

| File | Reason |
|------|--------|
| `packages/shim/src/keyboard-shim.ts` | Replaced by keys-shim.ts using proper NUB message types |

### Workspace Config (no change needed)

`pnpm-workspace.yaml` already includes `packages/nubs/*`, so `packages/nubs/keys` is automatically discovered.

## Patterns to Follow

### Pattern 1: NUB Type Package Skeleton
**What:** Every NUB package follows: types.ts (DOMAIN const + message interfaces) -> index.ts (re-exports + registerNub call).
**When:** Creating @napplet/nub-keys.
**Evidence:** All 5 existing NUB packages follow this exact pattern.

### Pattern 2: Request/Result Correlation
**What:** Messages requiring a response include a correlation `id: string` field (generated via `crypto.randomUUID()`). The responder echoes the same `id`. Fire-and-forget messages have no `id`.
**When:** `keys.register` needs confirmation (has `id`). `keys.forward` and `keys.action` are fire-and-forget (no `id`).
**Evidence:** Signer (all 7 request types have `id`), storage (all 4 request types have `id`), relay (`subscribe`, `close`, `publish`, `query` have `id`).

### Pattern 3: Discriminated Unions (Outbound/Inbound/All)
**What:** Every NUB defines three union types: `*OutboundMessage` (napplet->shell), `*InboundMessage` (shell->napplet), `*NubMessage` (all).
**When:** Always. The relay, signer, storage, and ifc NUBs all define this triple.
**Evidence:** `RelayOutboundMessage | RelayInboundMessage = RelayNubMessage`, etc.

### Pattern 4: Shim Install + Namespace Export
**What:** Shim files export an `install*()` function for the message listener and a `_namespace` object for wiring into `window.napplet.*`.
**When:** keys-shim.ts follows the state-shim.ts pattern.
**Evidence:** `state-shim.ts` exports `installStateShim()` + `_nappletStorage`. `nipdb-shim.ts` exports `installNostrDb()`.

### Pattern 5: SDK Lazy Delegation via requireNapplet()
**What:** SDK namespace methods call `requireNapplet()` at invocation time, not at module load time. This allows shim and SDK to be imported in any order.
**When:** The `keys` namespace in SDK must follow this pattern.
**Evidence:** Every SDK namespace method (`relay.subscribe`, `ipc.emit`, `storage.getItem`) calls `requireNapplet()` first.

### Pattern 6: Base Message Interface With Type Narrowing
**What:** Each NUB defines a base interface `extends NappletMessage` with `type: \`domain.${string}\``, then concrete messages narrow to literal types.
**When:** KeysMessage should extend NappletMessage with `type: \`keys.${string}\``.
**Evidence:** `ThemeMessage { type: \`theme.${string}\` }`, `SignerMessage { type: \`signer.${string}\` }`, etc.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Circular Dependency Between Core and NUB Packages
**What:** Importing `KeyAction` from `@napplet/nub-keys` into `@napplet/core`.
**Why bad:** Core has zero dependencies on NUB packages. NUB packages depend on core. Reversing this creates a cycle that breaks the build.
**Instead:** Use inline structural types in NappletGlobal or define a minimal type in core. The NUB package can export a richer `KeyAction` that structurally extends the core type.

### Anti-Pattern 2: Non-NUB Domain Prefix
**What:** The current `keyboard.forward` uses `keyboard` as a domain prefix, but `keyboard` is not in NubDomain.
**Why bad:** Messages with unregistered domains are silently dropped by `dispatch()`. The `keyboard.forward` bypasses the dispatch system entirely via raw postMessage.
**Instead:** Use `keys` as the domain. All messages route through standard NUB dispatch.

### Anti-Pattern 3: Overloading keyboard-shim.ts
**What:** Adding NUB features to the existing keyboard-shim.ts file.
**Why bad:** The file uses a local `KeyboardForwardMessage` type outside the NUB system. It cannot be incrementally upgraded because the message type string changes from `keyboard.forward` to `keys.forward`.
**Instead:** Delete keyboard-shim.ts entirely. Create keys-shim.ts from scratch using NUB types from `@napplet/nub-keys`.

### Anti-Pattern 4: Defining KeyAction in @napplet/core
**What:** Adding `KeyAction`, `KeyBinding` interfaces to core's types.ts.
**Why tempting:** NappletGlobal lives in core, so putting the param types there seems natural.
**Why bad:** Core is the minimal shared foundation. Adding domain-specific types (action registrations, key bindings) to core bloats it and sets a precedent. The relay NUB doesn't put `NostrFilter` in core (it was already there for historical reasons). New domain-specific types belong in their NUB package.
**Instead:** NappletGlobal uses inline structural types. @napplet/nub-keys exports the canonical `KeyAction` and `KeyBinding` types.

## Build Order (Dependency-Constrained)

Turborepo's `dependsOn: ["^build"]` handles this automatically, but the logical phases for development are:

### Phase 1: NUB Type Package (@napplet/nub-keys)
Create package scaffold + all message types. Leaf dependency on `@napplet/core` only. Can be built and type-checked independently.

**Rationale:** Types are the contract. Everything else imports from here.

### Phase 2: Core Envelope Update (@napplet/core)
Add `'keys'` to NubDomain and NUB_DOMAINS. Add NappletGlobal.keys type to types.ts.

**Rationale:** Must happen before shim/SDK can reference the keys domain or window.napplet.keys type. Small, surgical change -- 2 lines in envelope.ts, ~15 lines in types.ts.

### Phase 3: Shim Implementation (@napplet/shim)
Delete keyboard-shim.ts, create keys-shim.ts, update index.ts wiring, add dependency.

**Rationale:** The shim is the real runtime implementation. Depends on phases 1-2 for types. This is the largest phase by code volume.

### Phase 4: SDK Re-exports (@napplet/sdk)
Add keys namespace wrapper, type re-exports, KEYS_DOMAIN constant, add dependency.

**Rationale:** SDK is a thin wrapper. Depends on phase 2 for NappletGlobal.keys type, phase 1 for re-export types. Small phase.

### Phase 5: Documentation + NIP-5D Update
Update READMEs, NIP-5D reference to keys NUB.

**Rationale:** Always last -- documents what was built.

## Scalability Considerations

| Concern | Current (6 NUBs) | At 10 NUBs | At 20+ NUBs |
|---------|-------------------|------------|-------------|
| NubDomain union size | 6 literals, manageable | Fine | Consider auto-generation from NUB packages |
| Shim message listeners | Per-shim listeners (5 active) | Fine | Consider centralizing into single dispatcher |
| SDK re-exports | ~80 types in one file | ~120 types | Split into per-domain re-export files |
| Build time | Fast (<10s total) | Fine | Turborepo caching handles it |

## Sources

- Direct source code analysis of all 5 existing NUB packages (relay, signer, storage, ifc, theme)
- Direct source code analysis of 4 shim implementations (relay-shim, state-shim, keyboard-shim, nipdb-shim)
- Core dispatch infrastructure (dispatch.ts, envelope.ts, types.ts)
- SDK re-export patterns (sdk/src/index.ts)
- Package dependency graph (shim/package.json, sdk/package.json, pnpm-workspace.yaml, turbo.json)
