# Phase 41: Shim Restructure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-02
**Phase:** 41-shim-restructure
**Areas discussed:** Type exports strictness, Window global TypeScript types, storage.clear() inclusion

---

## Type exports strictness

| Option | Description | Selected |
|--------|-------------|----------|
| Strict: zero exports including export type | Shim is purely a side-effect. Types come from @napplet/sdk or @napplet/core. Enforces the cleanest package contract. | ✓ |
| Permissive: zero value exports, export type allowed | `import type { NostrEvent } from '@napplet/shim'` still works for legacy convenience. Slightly blurs the package contract but no runtime cost. | |
| You decide | Claude picks based on the shim/sdk split intent and existing project conventions. | |

**User's choice:** Strict: zero exports including export type

---

### Types source (follow-up)

| Option | Description | Selected |
|--------|-------------|----------|
| @napplet/core owns the types | `import type { NostrEvent } from '@napplet/core'` — core already has zero-dep shared types. | |
| @napplet/sdk re-exports them | `import type { NostrEvent } from '@napplet/sdk'` — sdk is the bundler-friendly package, natural place for type consumers. | ✓ |
| Both: core owns, sdk re-exports | Core is canonical; SDK re-exports for convenience. | |

**User's choice:** @napplet/sdk re-exports them

---

## Window global TypeScript types

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — shim owns the global augmentation | When you import '@napplet/shim' (side-effect), the type augmentation activates and window.napplet.* is typed. Best DX for shim-only users. | ✓ |
| No — SDK owns the type declarations | No global augmentation in shim. TypeScript users who want window.napplet types must use @napplet/sdk. | |
| Yes — both shim and SDK augment the Window interface | Side-by-side augmentation: either package activates the global type. | |

**User's choice:** Yes — shim owns the global augmentation

---

### NappletGlobal interface location (follow-up)

| Option | Description | Selected |
|--------|-------------|----------|
| Defined inline in shim's types.ts | Shim defines NappletGlobal locally — self-contained. | |
| Defined in @napplet/core, used by shim and SDK | NappletGlobal lives in @napplet/core as a shared type. Both shim and SDK reference it. | |
| You decide | Claude picks what fits best with existing core type structure. | ✓ |

**User's choice:** You decide (Claude's discretion)
**Notes:** Claude to place NappletGlobal in @napplet/core per the package boundary convention (core is the zero-dep shared types layer).

---

## storage.clear() inclusion

| Option | Description | Selected |
|--------|-------------|----------|
| Exclude — follow WIN-04 exactly | Only getItem/setItem/removeItem/keys. Spec is authoritative, minimal surface. | ✓ |
| Include — add clear() to WIN-04 | The localStorage analogy is strong. clear() rounds out the API. | |
| You decide | Claude picks based on API surface principles. | |

**User's choice:** Exclude — follow WIN-04 exactly

---

## Claude's Discretion

- `NappletGlobal` interface location: user deferred to Claude. Decision: define in `@napplet/core` so both shim (Window augmentation) and SDK (Phase 42 re-exports) reference the same canonical type without cross-package dependency.

## Deferred Ideas

None.
