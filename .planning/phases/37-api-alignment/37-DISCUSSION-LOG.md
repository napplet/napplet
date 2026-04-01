# Phase 37: API Alignment - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-01
**Phase:** 37-api-alignment
**Areas discussed:** Sub-interface deprecated aliases, Non-Hooks sub-interface naming, Shell sub-interfaces naming

---

## Sub-interface deprecated aliases

| Option | Description | Selected |
|--------|-------------|----------|
| Clean rename only | No deprecated aliases for sub-interfaces — they are implementation details of RuntimeHooks | ✓ |
| Ship @deprecated aliases for all sub-interfaces | Full migration story for any code importing sub-interfaces directly | |
| You decide | Claude judges based on external usage | |

**User's choice:** Clean rename only.
**Notes:** Sub-interfaces are internal enough that deprecated aliases are not warranted. The top-level RuntimeHooks/ShellHooks deprecated aliases cover the main migration surface.

---

## Non-Hooks sub-interface naming

| Option | Description | Selected |
|--------|-------------|----------|
| Drop Runtime prefix, keep existing suffix | RuntimeAclPersistence → AclPersistence, RuntimeSigner → Signer | ✓ |
| Add Adapter suffix to all | RuntimeAclPersistence → AclPersistenceAdapter, RuntimeSigner → SignerAdapter | |
| Exclude non-Hooks interfaces from Phase 37 | Only rename *Hooks interfaces | |

**User's choice:** Drop Runtime prefix, keep existing suffix.
**Notes:** Consistent rule: always drop 'Runtime' prefix, keep the rest unchanged.

---

## Shell sub-interfaces naming

| Option | Description | Selected |
|--------|-------------|----------|
| Keep *Hooks | RelayPoolHooks, AuthHooks, CryptoHooks etc stay as-is | ✓ |
| Rename to *Adapter | RelayPoolAdapter, AuthAdapter, CryptoAdapter etc | |

**User's choice:** Keep *Hooks.
**Notes:** User agreed with Claude's analysis. Key arguments:
1. Shell sub-interfaces describe what the host app *provides* (hooks/callbacks). Runtime sub-interfaces describe what the protocol engine *requires* (env abstraction). Different semantic role → different suffix.
2. Naming collision prevention: `RelayPoolAdapter` (runtime) vs `RelayPoolHooks` (shell) are self-evidently from different packages. If both became `RelayPoolAdapter`, package origin would be ambiguous.

---

## Claude's Discretion

- Whether `createMockRuntimeHooks()` in test-utils.ts gets renamed to `createMockRuntimeAdapter()` or keeps old name with alias.
- Brief inline comment in types.ts explaining the Adapter (runtime) vs Hooks (shell) suffix distinction for future contributors.

## Deferred Ideas

None.
