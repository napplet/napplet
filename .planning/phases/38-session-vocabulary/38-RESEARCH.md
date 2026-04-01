# Phase 38: Session Vocabulary — Research

**Gathered:** 2026-04-01
**Status:** Complete

## Summary

Phase 38 is a small, focused rename with a narrow blast radius. Total 3 files modified.
The research pass confirmed exact line counts, identified the one test file consumer, and
clarified the boundary between in-scope runtime renames and out-of-scope shell deprecated aliases.

---

## Change Inventory

### packages/runtime/src/runtime.ts — 20 occurrences

All occurrences of `nappKeyRegistry` in `runtime.ts` are renamed to `sessionRegistry`.
This covers two distinct uses of the name:

1. **Local variable** (line 170): `const nappKeyRegistry = createSessionRegistry(...)`
   — renamed to `const sessionRegistry = createSessionRegistry(...)`
   — 18 references throughout the function body follow automatically

2. **Public interface property** (line 111 in `Runtime` interface):
   `readonly nappKeyRegistry: SessionRegistry`
   — renamed to `readonly sessionRegistry: SessionRegistry`

3. **Public getter** (line 956):
   `get nappKeyRegistry() { return nappKeyRegistry; }`
   — renamed to `get sessionRegistry() { return sessionRegistry; }`

Full set of lines: 111, 170, 179, 187, 275, 281, 282, 288, 308, 388, 390, 434,
469, 483, 511, 627, 735, 755, 855, 956

### packages/runtime/src/dispatch.test.ts — 1 occurrence

Line 106: `runtime.nappKeyRegistry.getPubkey(WINDOW_ID)`
→ `runtime.sessionRegistry.getPubkey(WINDOW_ID)`

This is the only test file consumer of the runtime's public `nappKeyRegistry` property.

### packages/shim/src/napplet-keypair.ts — TODO comment added

Add a `// TODO(SEED-001):` block comment immediately before `loadOrCreateKeypair`:

```ts
// TODO(SEED-001): This placeholder always generates a random keypair.
// The correct design: shell derives a deterministic key from
// SHA256(salt + aggregateHash + dTag + nappletAuthorPubkey) and sends it
// to the napplet via an init message. See .planning/seeds/SEED-001-deterministic-napplet-keypair.md
```

The function itself is NOT renamed. `loadOrCreateKeypair` stays as-is pending SEED-001.

---

## NOT In Scope (Phase 34 deprecated aliases — leave unchanged)

| File | Line | Value | Why Unchanged |
|------|------|-------|---------------|
| `packages/shell/src/session-registry.ts` | 170 | `export const nappKeyRegistry = sessionRegistry` | Deprecated alias from Phase 34; survives until v0.9.0 |
| `packages/shell/src/index.ts` | 44 | `export { sessionRegistry, nappKeyRegistry }` | Re-export of deprecated alias |
| `packages/shell/src/hooks-adapter.ts` | 47 | `nappKeyRegistry: typeof SessionRegistryType` in `BrowserDeps` | Names the deprecated singleton, not the runtime property |
| `packages/shell/src/shell-bridge.ts` | 143 | `nappKeyRegistry` passed to `adaptHooks` | Passes the deprecated singleton (correct as-is) |

The shell-side `BrowserDeps.nappKeyRegistry` field in `hooks-adapter.ts` refers to the deprecated
singleton from `session-registry.ts`, which stays named `nappKeyRegistry` intentionally. This is
a completely separate identifier from the runtime's return property. The shell files
do NOT need updating.

---

## Additional Finding: hooks-adapter unused field

`hooks-adapter.ts:74` only destructures `originRegistry` from `deps`:
```ts
const { originRegistry } = deps;
```

`deps.nappKeyRegistry` is declared in `BrowserDeps` but never accessed inside `adaptHooks`.
This is an existing issue, not introduced by Phase 38. Leave for a future cleanup phase.

---

## Verification Approach

After the rename:

1. `pnpm type-check` — TypeScript will catch any missed occurrences
2. `pnpm test:unit` (in runtime package) — dispatch.test.ts must pass
3. Grep check: `grep -rn 'nappKeyRegistry' packages/runtime/` should return 0 hits
4. Shell deprecated aliases still present: `grep -n 'nappKeyRegistry' packages/shell/src/session-registry.ts` should still show line 170

---

*Phase: 38-session-vocabulary*
*Research gathered: 2026-04-01*
