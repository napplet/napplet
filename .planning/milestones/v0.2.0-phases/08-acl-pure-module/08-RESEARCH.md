# Phase 8: ACL Pure Module - Research

**Researched:** 2026-03-30
**Phase:** 8 — ACL Pure Module
**Requirement IDs:** ACL-01, ACL-02, ACL-03, ACL-04, ACL-05, ACL-06

## Research Question

What do I need to know to PLAN the extraction of ACL logic into a standalone, pure, WASM-ready module with zero side effects?

---

## 1. Current ACL Implementation Analysis

### Source: `packages/shell/src/acl-store.ts`

The current implementation is a **mutable singleton** backed by a module-level `Map<string, InternalAclEntry>`:

```typescript
const store = new Map<string, InternalAclEntry>();
```

**Key characteristics of the current design:**
- **Singleton pattern**: One global `aclStore` object exported with methods that mutate the shared `store` Map
- **Mutable state**: `grant()`, `revoke()`, `block()`, `unblock()` all mutate entries in-place
- **Set-based capabilities**: `capabilities: Set<Capability>` where `Capability` is a string union type
- **localStorage coupling**: `persist()` and `load()` methods directly call `localStorage.setItem/getItem`
- **Permissive default**: `check()` returns `true` when no entry exists (Pitfall 1 from PITFALLS.md)
- **Mixed concerns**: Pure logic (check, grant, revoke) mixed with persistence (persist, load) and UI concerns (requiresPrompt)

### Functions to Extract (Pure Logic)

| Function | Current Signature | Behavior |
|----------|------------------|----------|
| `check` | `(pubkey, dTag, hash, cap) -> boolean` | Returns true if no entry (permissive), false if blocked, else checks Set membership |
| `grant` | `(pubkey, dTag, hash, cap) -> void` | Adds capability to Set (mutates) |
| `revoke` | `(pubkey, dTag, hash, cap) -> void` | Removes capability from Set (mutates) |
| `block` | `(pubkey, dTag, hash) -> void` | Sets blocked flag (mutates) |
| `unblock` | `(pubkey, dTag, hash) -> void` | Clears blocked flag (mutates) |
| `aclKey` | `(pubkey, dTag, hash) -> string` | Pure composite key computation |
| `getStateQuota` | `(pubkey, dTag, hash) -> number` | Reads quota from entry |

### Functions That Stay in Shell

| Function | Reason |
|----------|--------|
| `persist()` | localStorage dependency |
| `load()` | localStorage dependency |
| `requiresPrompt()` | Shell-specific consent logic |
| `getEntry()` | Returns shell-specific `AclEntry` type (could be adapted) |
| `getAllEntries()` | Serialization helper for shell commands |
| `clear()` | Combines store clear + localStorage removal |

### How ACL Is Used in pseudo-relay.ts

The `checkAcl` helper in pseudo-relay.ts wraps `aclStore.check()`:

```typescript
function checkAcl(pubkey: string, capability: Capability): boolean {
  const entry = nappKeyRegistry.getEntry(pubkey);
  const dTag = entry?.dTag ?? '';
  const hash = entry?.aggregateHash ?? '';
  return aclStore.check(pubkey, dTag, hash, capability);
}
```

This is called from:
1. `deliverToSubscriptions()` — checks `relay:read` on recipient
2. `handleEvent()` — checks `relay:write` on sender
3. `handleReq()` — checks `relay:read` on requester
4. `handleSignerRequest()` — checks `sign:event` on requester
5. `handleEvent()` hotkey branch — checks `hotkey:forward`

Shell command handlers (`shell:acl-revoke`, `shell:acl-grant`, etc.) directly call `aclStore.grant/revoke/block/unblock` followed by `aclStore.persist()`.

---

## 2. Bitfield Design Analysis

### Decision from CONTEXT.md (D-01, D-02)

The context specifies a bitfield approach:

```
relay:read   = 0b00000001 (1)
relay:write  = 0b00000010 (2)
sign:event   = 0b00000100 (4)
sign:nip04   = 0b00001000 (8)
sign:nip44   = 0b00010000 (16)
state:read   = 0b00100000 (32)
state:write  = 0b01000000 (64)
```

**Note:** The current `Capability` type in `types.ts` has **10 capabilities** (including `cache:read`, `cache:write`, `hotkey:forward`), but the context only lists **7** in the bitfield. The context does not include `cache:read`, `cache:write`, or `hotkey:forward`.

**Resolution needed:** The context decision appears to have omitted `hotkey:forward` (listed in REQUIREMENTS.md TST-01 as one of 8 capabilities). The `cache:read` and `cache:write` capabilities may have been intentionally dropped or need inclusion.

Looking at the current types.ts:
```typescript
export type Capability =
  | 'relay:read' | 'relay:write'
  | 'cache:read' | 'cache:write'
  | 'hotkey:forward'
  | 'sign:event' | 'sign:nip04' | 'sign:nip44'
  | 'state:read' | 'state:write';
```

That is 10 capabilities. The bitfield needs at minimum 10 bits. A single `number` (32-bit in JS bitwise ops) is sufficient.

**Recommendation:** Include all 10 capabilities in the bitfield. Use bits 0-9:
```
relay:read    = 1 << 0  = 1
relay:write   = 1 << 1  = 2
cache:read    = 1 << 2  = 4
cache:write   = 1 << 3  = 8
hotkey:forward = 1 << 4 = 16
sign:event    = 1 << 5  = 32
sign:nip04    = 1 << 6  = 64
sign:nip44    = 1 << 7  = 128
state:read    = 1 << 8  = 256
state:write   = 1 << 9  = 512
```

### Bitfield Operations

- **Check**: `(entry.caps & bit) !== 0`
- **Grant**: `entry.caps | bit` (returns new value)
- **Revoke**: `entry.caps & ~bit` (returns new value)
- **All caps**: `(1 << 10) - 1 = 1023` (all bits set for 10 capabilities)

### WASM Compatibility

Bitfield operations map directly to WASM i32 instructions:
- `i32.and` for check and revoke mask
- `i32.or` for grant
- `i32.xor` with `i32.const -1` for complement (revoke)

No floating point, no string operations, no heap allocation needed for the core check path.

---

## 3. Immutable State Design

### Decision from CONTEXT.md (D-05, D-08)

```typescript
interface AclState {
  defaultPolicy: 'permissive' | 'restrictive';
  entries: Record<string, {
    caps: number;
    blocked: boolean;
    quota: number;
  }>;
}
```

**Immutability enforcement via `Readonly<>`:**

```typescript
type AclState = Readonly<{
  defaultPolicy: 'permissive' | 'restrictive';
  entries: Readonly<Record<string, Readonly<{
    caps: number;
    blocked: boolean;
    quota: number;
  }>>>;
}>;
```

**Mutation pattern — spread + override:**

```typescript
function grant(state: AclState, identity: Identity, cap: number): AclState {
  const key = toKey(identity);
  const entry = state.entries[key] ?? defaultEntry(state);
  return {
    ...state,
    entries: {
      ...state.entries,
      [key]: { ...entry, caps: entry.caps | cap },
    },
  };
}
```

This creates a new object per mutation. For the napplet use case (small number of entries, infrequent mutations), this is acceptable. ACL mutations happen on:
- AUTH success (implicit grant of defaults)
- Shell command (user-initiated grant/revoke/block/unblock)
- Napp update (capability migration)

These are all low-frequency operations. The hot path is `check()`, which only reads state and never allocates.

---

## 4. Package Structure

### Decision from CONTEXT.md (D-10)

New package: `packages/acl/` with `@napplet/acl` npm name.

```
packages/acl/
  src/
    index.ts       — public API re-exports
    types.ts       — AclState, Identity, capability bit constants
    check.ts       — check function
    mutations.ts   — grant, revoke, block, unblock, setQuota, getQuota
  tsconfig.json    — strict, NO lib: ["DOM"] or lib: ["DOM.Iterable"]
  tsup.config.ts   — ESM only, zero externals
  package.json     — zero dependencies, zero peerDependencies
```

### tsconfig.json — WASM-readiness enforcement

The key constraint: **no DOM or Node types in the lib array**.

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "lib": ["ES2022"]
  },
  "include": ["src"]
}
```

By omitting `DOM` and `DOM.Iterable` from `lib`, any accidental use of `localStorage`, `window`, `document`, `console`, `setTimeout`, etc. will produce a TypeScript compilation error. This is the strongest enforcement mechanism available without a custom lint rule.

**Caveat:** `console` is technically in the `ES2022` lib since TypeScript 5.x includes it in the ES lib. However, the ACL module should not use console at all — logging is the shell's responsibility.

### package.json — zero dependencies

```json
{
  "name": "@napplet/acl",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "sideEffects": false,
  "dependencies": {},
  "peerDependencies": {}
}
```

Zero `dependencies`, zero `peerDependencies`. This is the physical enforcement of ACL-04.

### Monorepo integration

- `pnpm-workspace.yaml` already includes `packages/*`, so `packages/acl/` is auto-discovered
- `turbo.json` `build` task has `"dependsOn": ["^build"]`, so `@napplet/shell` building after `@napplet/acl` is automatic once shell's `package.json` depends on `@napplet/acl`
- `@napplet/shell` would add `"@napplet/acl": "workspace:*"` to its dependencies

---

## 5. Identity Model

### Decision from CONTEXT.md (D-09)

```typescript
interface Identity {
  pubkey: string;
  dTag: string;
  hash: string;
}
```

Internal composite key: `${pubkey}:${dTag}:${hash}`

This matches the current `aclKey()` function signature exactly.

---

## 6. Default Policy Behavior

### Current behavior

`check()` returns `true` for unknown entries (permissive default, hardcoded).

### New behavior (D-06)

`defaultPolicy` is part of `AclState`:
- **Permissive**: Unknown identity → all capabilities granted (current behavior)
- **Restrictive**: Unknown identity → all capabilities denied

The `check()` function becomes:
```typescript
function check(state: AclState, identity: Identity, cap: number): boolean {
  const key = toKey(identity);
  const entry = state.entries[key];
  if (!entry) {
    return state.defaultPolicy === 'permissive';
  }
  if (entry.blocked) return false;
  return (entry.caps & cap) !== 0;
}
```

This directly addresses Pitfall 1 from PITFALLS.md — the permissive default is now explicit in the state, and restrictive mode is available.

---

## 7. Serialization for Persistence Adapter

### Decision from CONTEXT.md — Claude's discretion

The context suggests considering `serialize(state): string` and `deserialize(json: string): AclState`. These are pure functions (no DOM dependency) that would live in the ACL module.

**Recommendation:** Include them. The persistence adapter in `@napplet/shell` would use:
```typescript
import { serialize, deserialize } from '@napplet/acl';
// persist: localStorage.setItem('napplet:acl', serialize(state));
// load:    const state = deserialize(localStorage.getItem('napplet:acl') ?? '');
```

The `serialize` function is just `JSON.stringify` on AclState. The `deserialize` function validates the JSON structure and returns a valid AclState (with `Readonly<>` enforcement).

---

## 8. Migration Path

### How @napplet/shell adapts

After extraction, `@napplet/shell` needs to:

1. **Import from `@napplet/acl`** instead of using local `acl-store.ts`
2. **Hold ACL state** as a `let state: AclState` variable (or in a closure) rather than using a global singleton Map
3. **Replace mutation calls**: `aclStore.grant(...)` becomes `state = grant(state, identity, cap)`
4. **Move persistence** to shell: `localStorage.setItem(KEY, serialize(state))`
5. **Move `requiresPrompt()`** to shell (stays in shell, not ACL)
6. **Map string capabilities** to bitfield constants at the shell boundary

However, this migration is **Phase 9's responsibility** (ACL Enforcement Gate). Phase 8 only creates the standalone module. The shell will NOT be modified in Phase 8.

---

## 9. Validation Architecture

### Test Strategy for Pure Module

Since the ACL module is pure functions with no side effects, testing is straightforward with standard unit testing (vitest in Node.js mode — no browser needed).

**Test categories:**
1. **check()** — permissive default, restrictive default, granted cap, revoked cap, blocked identity
2. **grant()/revoke()** — verify new state returned, original unchanged, bitfield correctness
3. **block()/unblock()** — blocked overrides all caps, unblock restores access
4. **setQuota()/getQuota()** — quota storage and retrieval
5. **createState()** — default policy, empty entries
6. **Immutability** — verify original state object is never modified after any mutation
7. **Identity key composition** — composite key format correctness
8. **Serialization** — round-trip serialize/deserialize preserves state exactly
9. **Edge cases** — empty identity fields, zero caps, all caps, multiple identities

### Build Verification

- `tsc --noEmit` with no DOM lib → proves zero DOM/Node dependencies
- `tsup` produces clean ESM bundle → no require(), no __dirname
- Zero `import` statements referencing external packages → proves ACL-04

---

## 10. Risk Assessment

### Low Risk
- **Bitfield design** is well-understood, widely used pattern
- **Immutable state** with spread operators is idiomatic TypeScript
- **Package scaffolding** follows established patterns from existing packages

### Medium Risk
- **Capability count mismatch** — CONTEXT.md lists 7 capabilities, current code has 10. Must resolve before implementation.
- **API surface creep** — temptation to add convenience functions that break purity (e.g., logging, event emission)

### Addressed by Design
- **DOM dependency** — tsconfig `lib: ["ES2022"]` (no DOM) catches this at compile time
- **Mutation bugs** — `Readonly<>` types catch this at compile time
- **Accidental nostr-tools import** — zero dependencies in package.json means pnpm won't resolve it

---

## RESEARCH COMPLETE

Research covers all requirements (ACL-01 through ACL-06) and provides sufficient detail for planning. Key finding: capability count needs reconciliation between CONTEXT.md (7) and current types.ts (10). Recommend including all 10 capabilities in the bitfield.
