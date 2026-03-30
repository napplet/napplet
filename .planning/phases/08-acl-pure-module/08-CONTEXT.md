# Phase 8: ACL Pure Module - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Extract ACL logic into a new `@napplet/acl` package — a standalone, pure, WASM-ready module with zero side effects. The package boundary enforces zero dependencies (no DOM, no Node, no nostr-tools). All functions are pure: state in, state out. No mutations.

</domain>

<decisions>
## Implementation Decisions

### State Model — Bitfield Capabilities
- **D-01:** Capabilities are a bitfield (single number). Each capability maps to a bit position:
  - `relay:read   = 0b00000001` (1)
  - `relay:write  = 0b00000010` (2)
  - `sign:event   = 0b00000100` (4)
  - `sign:nip04   = 0b00001000` (8)
  - `sign:nip44   = 0b00010000` (16)
  - `state:read   = 0b00100000` (32)
  - `state:write  = 0b01000000` (64)
- **D-02:** Check is `(caps & BIT) !== 0`. Grant is `caps | BIT`. Revoke is `caps & ~BIT`. Fast, compact, WASM-natural.
- **D-03:** Blocked is a separate boolean flag, not a bit in the caps field. Blocked is orthogonal to capabilities — a blocked napp preserves its caps but all checks fail.
- **D-04:** State quota (`stateQuota: number`) stays in ACL entries. It's per-identity, stored alongside capabilities.

### State Structure
- **D-05:** Full ACL state:
  ```typescript
  interface AclState {
    defaultPolicy: 'permissive' | 'restrictive';
    entries: Record<string, {   // keyed by composite 'pubkey:dTag:hash'
      caps: number;              // bitfield of granted capabilities
      blocked: boolean;          // orthogonal block flag
      quota: number;             // state quota in bytes
    }>;
  }
  ```
- **D-06:** Default policy is part of the state, not hardcoded. Shell configures it when creating the state. Supports both permissive and restrictive modes.

### Check Function Signature
- **D-07:** `check(state: AclState, identity: Identity, cap: number): boolean` — returns true (allow) or false (deny). No "prompt" return — consent for destructive kinds is the shell's concern, not the ACL module's.
- **D-08:** All pure functions return new state objects. No mutations. Type system enforces immutability via `Readonly<>`.

### Identity Format
- **D-09:** Public API takes a structured object: `{ pubkey: string, dTag: string, hash: string }`. Module internally converts to composite key string `'pubkey:dTag:hash'`. Type-safe API, string-based internals.

### Module Boundary
- **D-10:** Own package: `@napplet/acl` in `packages/acl/`. Package boundary physically enforces zero dependencies — tsconfig has no DOM/Node types. `@napplet/shell` depends on `@napplet/acl`.
- **D-11:** Persistence (localStorage) is NOT in `@napplet/acl`. It's a separate adapter in `@napplet/shell` that serializes/deserializes `AclState` to/from localStorage.

### Pure Functions (complete API)
- **D-12:** The module exports exactly these functions:
  - `createState(policy?: 'permissive' | 'restrictive'): AclState`
  - `check(state, identity, cap): boolean`
  - `grant(state, identity, cap): AclState`
  - `revoke(state, identity, cap): AclState`
  - `block(state, identity): AclState`
  - `unblock(state, identity): AclState`
  - `setQuota(state, identity, bytes): AclState`
  - `getQuota(state, identity): number`
  - Capability bit constants (`CAP_RELAY_READ`, `CAP_RELAY_WRITE`, etc.)

### Claude's Discretion
- Package scaffolding (tsconfig, tsup, package.json)
- Whether to use TypeScript `Readonly<>` or `as const` for immutability
- Internal helper structure within the module
- Whether to export a `serialize`/`deserialize` pair for the state (useful for persistence adapter)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Current ACL Implementation
- `packages/shell/src/acl-store.ts` — Current mutable singleton ACL. This is what we're replacing.
- `packages/shell/src/types.ts` — `Capability`, `AclEntry`, `ALL_CAPABILITIES`, `DESTRUCTIVE_KINDS` type definitions.

### Prior Phase Context
- `.planning/phases/07-nomenclature/07-CONTEXT.md` — ShellBridge rename (D-01..D-05), state rename completion (D-06..D-09)

### Research
- `.planning/research/PITFALLS.md` — Pitfall 1: permissive ACL default is highest-risk architectural decision

</canonical_refs>

<code_context>
## Existing Code Insights

### What to Extract
- `check()` logic: `if (!entry) return defaultPolicy; if (entry.blocked) return false; return entry.capabilities.has(cap);`
- `grant()` / `revoke()` / `block()` / `unblock()` — straightforward mutations → convert to immutable returns
- `aclKey()` composite key computation
- `ALL_CAPABILITIES` and `DESTRUCTIVE_KINDS` constants

### What Stays in @napplet/shell
- `persist()` / `load()` — localStorage adapter
- `requiresPrompt()` — consent logic (shell concern)
- The singleton instance / runtime container

### New Package Structure
```
packages/acl/
  src/
    index.ts       — public API
    types.ts       — AclState, Identity, capability constants
    check.ts       — check function
    mutations.ts   — grant, revoke, block, unblock, setQuota
  tsconfig.json    — no DOM, no Node types
  tsup.config.ts   — ESM only
  package.json     — zero dependencies
```

</code_context>

<specifics>
## Specific Ideas

- The bitfield approach means capability checks are a single bitwise AND — this will be trivially compilable to a single WASM instruction.
- The `Readonly<AclState>` type prevents accidental mutation in TypeScript, and the immutable return pattern (spread + override) maps naturally to WASM's value semantics.
- Consider exporting `serialize(state): string` and `deserialize(json: string): AclState` for the persistence adapter's convenience — these are still pure functions.

</specifics>

<deferred>
## Deferred Ideas

- **WASM compilation** — v0.3.0. Module is designed for it but not compiled yet.
- **Restrictive default enforcement** — The module supports it via `defaultPolicy`, but v0.2.0 shell will still default to permissive. Restrictive mode is a UX/migration concern.
- **Per-capability quota** — Currently quota is per-identity. Could be per-capability (e.g., different limits for state vs relay). Deferred.

</deferred>

---

*Phase: 08-acl-pure-module*
*Context gathered: 2026-03-30*
