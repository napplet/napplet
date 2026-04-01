# SDK Naming Pitfalls

**Domain:** Naming convention risks for ontology audit
**Researched:** 2026-04-01

## Critical Pitfalls

### Pitfall 1: "Hooks" React Connotation
**What goes wrong:** Developers encountering `RuntimeHooks` expect React-style hooks (`useRuntime()`, composable per-feature functions). They look for a `useRuntimeHooks()` hook or assume the interface is framework-specific.
**Why it happens:** React popularized "hooks" to mean composable stateful functions. The napplet SDK uses "hooks" to mean "callback-based DI interface" -- a different concept.
**Consequences:** Confusion in docs, issues, and onboarding. Developers may assume the SDK is React-coupled despite being framework-agnostic.
**Prevention:** Rename to `RuntimeAdapter` / `ShellAdapter`. "Adapter" is the established term for platform integration interfaces (Prisma, Auth.js, tRPC).
**Detection:** Look for "is this React-only?" questions in issues or Discord.

### Pitfall 2: Renaming Too Much At Once
**What goes wrong:** A comprehensive rename across 7 packages breaks every downstream consumer simultaneously. The hyprgate reference implementation, skills files, SPEC.md, all tests, and any external tutorials all break.
**Why it happens:** Enthusiasm for consistency leads to renaming everything in one pass without considering the blast radius.
**Consequences:** Massive PR, difficult code review, impossible to bisect regressions.
**Prevention:** Prioritize renames by impact. Do `*Hooks` -> `*Adapter` first (highest value). Ship with `@deprecated` aliases for one release cycle.
**Detection:** If a rename PR touches more than 3 packages or more than 50 files, split it.

## Moderate Pitfalls

### Pitfall 3: Over-Genericizing Domain Vocabulary
**What goes wrong:** Replacing `shell`/`napplet` with generic `host`/`client` removes protocol-specific meaning. Future documentation becomes ambiguous ("which host? the browser? the server?").
**Prevention:** Keep domain-specific terms where they add precision. Document the vocabulary mapping in a glossary: "shell = the host application that provides NIP-01 relay proxying, signing, ACL enforcement, and services to embedded napplets."

### Pitfall 4: Inconsistent Prefix Stripping
**What goes wrong:** Some sub-interfaces drop the `Runtime` prefix and others don't, creating an inconsistent API surface.
**Prevention:** Apply the rule uniformly: top-level composites keep the prefix (`RuntimeAdapter`), nested sub-interfaces drop it (`RelayPoolAdapter`, not `RuntimeRelayPoolAdapter`). Document the convention.

### Pitfall 5: "Bridge" vs "Adapter" Role Confusion
**What goes wrong:** After rename, developers confuse `ShellBridge` (the cross-boundary mediator object returned by `createShellBridge()`) with `ShellAdapter` (the DI interface provided BY the shell host TO the bridge). "Isn't the adapter the bridge?"
**Prevention:** Document clearly: "The `ShellAdapter` describes WHAT your shell provides. The `ShellBridge` is the runtime object that USES those capabilities to mediate between shell and napplet."

## Minor Pitfalls

### Pitfall 6: Deprecation Alias Accumulation
**What goes wrong:** Adding `@deprecated` type aliases (`RuntimeHooks = RuntimeAdapter`) that are never removed. The codebase accumulates dead names.
**Prevention:** Set a concrete removal version (e.g., "RuntimeHooks alias removed in v0.9.0"). Track in a deprecation schedule.

### Pitfall 7: nappStorage/nappState Naming Ambiguity
**What goes wrong:** External developers don't know if `nappStorage` and `nappState` are the same thing, aliases, or different APIs.
**Prevention:** The ontology audit should resolve this to ONE canonical name. If they're aliases, pick one and deprecate the other.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| *Hooks -> *Adapter rename | Breaking change blast radius | Ship with deprecated aliases for one release |
| Sub-interface prefix cleanup | Inconsistent application | Apply uniformly; document the convention |
| shell/napplet vocabulary decision | Over-genericizing | Keep domain terms; add glossary |
| SPEC.md updates | Spec/code terminology drift | Update spec and code in same PR |
