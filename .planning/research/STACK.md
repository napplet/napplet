# Technology Stack: v0.4.0 Feature Negotiation & Service Discovery

**Project:** Napplet Protocol SDK v0.4.0
**Researched:** 2026-03-31
**Scope:** Stack additions/changes for NEW capabilities only. Existing stack (TypeScript 5.9, tsup 8.5, turborepo 2.5, pnpm 10.8, Vitest 4, Playwright, nostr-tools 2.23, changesets) is validated and not re-evaluated.

## Executive Decision

**Zero new runtime dependencies.** Service discovery, feature negotiation, and compatibility reporting are implemented entirely with existing infrastructure plus one small utility addition to `@napplet/core`. The semver version matching requirement is constrained enough to implement inline (~60 lines) rather than importing an external library.

## Existing Stack (Unchanged)

| Technology | Version | Purpose |
|------------|---------|---------|
| TypeScript | 5.9.3 | Language, strict ESM-only |
| tsup | 8.5.0 | Per-package bundling |
| turborepo | 2.5.0+ | Monorepo task orchestration |
| pnpm | 10.8.0 | Package manager with workspaces |
| changesets | 2.30.0 | Versioning and npm publishing |
| nostr-tools | 2.23.3 | Crypto primitives (peer dep) |
| Vitest | 4.x | Test runner (unit + integration) |
| Playwright | 1.58.x | Browser-based protocol tests |

## Package Dependency DAG (Unchanged)

```
@napplet/core (0 deps)
  |
  +-- @napplet/acl (0 deps)
  |
  +-- @napplet/runtime (core + acl)
  |       |
  |       +-- @napplet/shell (core + runtime + nostr-tools peer)
  |
  +-- @napplet/shim (core + nostr-tools peer)
  |
  +-- @napplet/vite-plugin (nostr-tools direct dep)
```

No new packages. No new dependencies. No new peer dependencies.

## New Production Code

### Per-Package Additions

| What | Where | Purpose | Dependencies |
|------|-------|---------|--------------|
| Semver satisfies utility | `@napplet/core/src/semver.ts` | Version range matching for service `requires` tags | None (keeps core zero-dep) |
| Service descriptor + requirement types | `@napplet/core/src/types.ts` | Shared protocol types for discovery | None |
| Service discovery handler | `@napplet/runtime/src/service-discovery.ts` | Handle kind 29010 REQ, generate descriptor events | Uses existing core types |
| Service dispatch router | `@napplet/runtime/src/service-dispatch.ts` | Route INTER_PANE events to ServiceHandler by topic prefix | Uses existing core types |
| `services?` field on RuntimeHooks | `@napplet/runtime/src/types.ts` | Optional service registry hook | None |
| Audio service wrapper | `@napplet/shell/src/audio-service.ts` | Wraps existing audioManager as ServiceHandler | Uses existing audioManager |
| Discovery API module | `@napplet/shim/src/discovery.ts` | Shim-side `discoverServices()` and `checkCompatibility()` | Uses existing `subscribe()` |
| Compatibility reporter | `@napplet/shim/src/compatibility.ts` | Surface missing/incompatible services to napplet developer | Uses core semver + types |
| Manifest requires injection | `@napplet/vite-plugin/src/index.ts` | Inject `<meta name="napplet-requires">` into HTML + manifest tags | None |

## Semver Library Decision: Implement Inline

### Why NOT Import a Library

Three external candidates were evaluated:

| Library | Version | Size (gzipped) | Deps | ESM | `satisfies()` |
|---------|---------|----------------|------|-----|---------------|
| `compare-versions` | 6.1.1 | ~1.7KB | 0 | Yes | Yes (^, ~, >=, ||) |
| `semver` (npm official) | 7.x | ~15KB | 0 | Partial (CJS-first) | Yes (full range syntax) |
| `semver-ts` | 1.x | ~10KB | 0 | Yes (tree-shakeable) | No (removed in fork) |

`compare-versions@6.1.1` is the strongest candidate: zero deps, small, ESM-native, has `satisfies()` with full range support.

**But we should not use it because:**

1. **@napplet/core must stay zero-dep.** This is a hard architectural constraint validated across three milestones (v0.1.0, v0.2.0, v0.3.0). Core is WASM-ready and importable by any consumer. Adding even a small dependency breaks this contract. The semver utility belongs in core because both shim and runtime need it.

2. **The protocol constrains the version matching scope.** Service `requires` tags use `^major.minor.patch` (caret range) because service versions are semver and napplets want "compatible with 1.x". We do NOT need tilde ranges, hyphen ranges, `||` unions, pre-release comparison, or build metadata parsing. The spec should explicitly constrain this.

3. **The matching runs once per session.** After AUTH + discovery, the shim compares discovered service versions against manifest requirements exactly once. This is not a hot path.

4. **~60 lines of tested code vs. a dependency.** A `satisfiesCaret(version, range)` function that handles `^1.0.0`, `>=1.0.0`, and exact `1.0.0` matching is straightforward to implement and exhaustively test.

### What We Implement

```typescript
// @napplet/core/src/semver.ts — ~60 lines

/** Parse "1.2.3" into [1, 2, 3]. Returns null on invalid input. */
export function parseSemver(v: string): [number, number, number] | null;

/** Compare two parsed semver tuples. Returns -1, 0, or 1. */
export function compareSemver(a: [number, number, number], b: [number, number, number]): -1 | 0 | 1;

/** Check if version satisfies a caret range "^1.2.3". */
export function satisfiesCaret(version: string, range: string): boolean;

/**
 * Check if version satisfies a range string.
 * Supported range formats: "^1.0.0", ">=1.0.0", "1.0.0" (exact match).
 * Returns false for unparseable input.
 */
export function satisfies(version: string, range: string): boolean;
```

**Caret matching rules (from semver.org):**
- `^1.2.3` := `>=1.2.3 <2.0.0` (leftmost non-zero is major)
- `^0.2.3` := `>=0.2.3 <0.3.0` (leftmost non-zero is minor)
- `^0.0.3` := `>=0.0.3 <0.0.4` (leftmost non-zero is patch)

**Confidence: HIGH.** Grounded in existing architectural constraints, protocol-level scope limitation, and the fact that semver caret logic is well-specified and trivial to implement correctly with comprehensive test coverage.

### Escape Hatch

If a future version needs full npm range matching, `compare-versions@6.1.1` is the right choice. It would go in `@napplet/runtime` (not core) since runtime already has dependencies. This is a v0.5.0+ concern at earliest.

## Type Migrations

Types that need to move to support the layered architecture:

| Type | Current Location | Target Location | Reason |
|------|-----------------|-----------------|--------|
| `ServiceDescriptor` | `@napplet/shell/types.ts` | `@napplet/core/types.ts` | Shim needs it for discovery results. Core types are shared. |
| `ServiceRequirement` | (new) | `@napplet/core/types.ts` | `{ name: string; version: string }` -- both shim and runtime need it |
| `DiscoveryResult` | (new) | `@napplet/core/types.ts` | `{ services: ServiceDescriptor[]; missing: ServiceRequirement[]; incompatible: ... }` |
| `CompatibilityStatus` | (new) | `@napplet/core/types.ts` | `'compatible' | 'degraded' | 'incompatible'` enum for napplet developers |

Types that stay put:
- `ServiceHandler` moves to `@napplet/runtime/types.ts` -- only the runtime dispatches to handlers
- `ServiceRegistry` moves to `@napplet/runtime/types.ts` (re-exported by shell) -- only host apps provide it

Shell re-exports both for backwards compatibility.

## Integration Points with Existing Protocol

### Kind 29010 Service Discovery (SPEC Section 11.2)

Integrates into existing `handleReq` function in `runtime.ts`. The current `isBusKind` check (line 340) already identifies bus-range subscriptions and skips relay pool. A new branch intercepts kind 29010 specifically:

```
REQ with kinds: [29010]
  -> check AUTH (reject if not authenticated)
  -> iterate hooks.services entries
  -> for each: construct kind 29010 EVENT with [s, v, d] tags
  -> send one EVENT per service
  -> send EOSE
```

No architectural changes. The runtime already has the pattern of generating synthetic events for bus-kind REQs (signer responses work the same way).

### INTER_PANE Service Dispatch (SPEC Section 11.3)

Modifies the existing topic-prefix switch in `runtime.ts:288-306`. Current flow:

```
INTER_PANE -> "shell:state-*" -> state handler
           -> "shell:audio-*" -> forward raw
           -> "shell:*"       -> shell command handler
           -> default         -> buffer and deliver
```

New flow inserts service dispatch AFTER state but BEFORE generic shell commands:

```
INTER_PANE -> "shell:state-*"     -> state handler (unchanged, core protocol)
           -> ServiceRegistry match -> service dispatch (NEW)
           -> "shell:*"            -> shell command handler (unchanged)
           -> default              -> buffer and deliver (unchanged)
```

The audio service handler catches `audio:register`, `audio:unregister`, `audio:state-changed` via the service dispatch. The old `shell:audio-*` prefix is supported via dual-prefix matching in the audio ServiceHandler for backwards compatibility with existing hyprgate napplets.

### Shim-side Discovery API

Post-AUTH currently opens two subscriptions (signer, nipdb). Discovery adds a third:

```
After AUTH OK:
  -> open signer subscription (existing, SIGNER_SUB_ID)
  -> open nipdb subscription (existing, NIPDB_SUB_ID)
  -> open service discovery subscription (NEW, __svc_discovery__)
  -> collect kind 29010 EVENTs
  -> on EOSE: parse descriptors, resolve discoverServices() promise
  -> read requires meta tag, run satisfies() comparisons
  -> produce CompatibilityReport
```

The `discoverServices()` function returns a Promise that resolves after EOSE. It uses the existing `subscribe()` function from relay-shim.ts. The subscription is one-shot: opened on first call, closed after EOSE, result cached for session lifetime.

### Manifest `requires` Tags

Vite-plugin extends `transformIndexHtml` to inject an additional meta tag:

```html
<!-- existing -->
<meta name="napplet-aggregate-hash" content="deadbeef...">
<meta name="napplet-napp-type" content="chat">
<!-- new -->
<meta name="napplet-requires" content="audio:^1.0.0,notifications:^1.0.0">
```

Format: comma-separated `name:range` pairs. Shim reads this with the same `document.querySelector` pattern as existing `getAggregateHash()` and `getNappType()`.

The kind 35128 manifest event gets corresponding `requires` tags:
```json
["requires", "audio", "^1.0.0"],
["requires", "notifications", "^1.0.0"]
```

New plugin config option:
```typescript
nip5aManifest({
  nappType: 'chat',
  requires: [{ name: 'audio', version: '^1.0.0' }],
})
```

## What NOT to Add

| Do NOT Add | Why Not |
|------------|---------|
| Semver library as dependency | Breaks core zero-dep constraint. Protocol scope is narrow enough for inline implementation. |
| Manifest parsing / JSON Schema library | Tags are `string[][]` -- standard Nostr pattern. Three tag types do not justify a schema library. |
| UI framework for compatibility reporting | Shim must remain framework-agnostic. Return `CompatibilityReport` data object, not UI. Napplet developer decides presentation. |
| EventEmitter / pub-sub library | Already have `on()`/`emit()` for inter-pane events plus Promise for one-shot discovery. |
| New `@napplet/compat` cross-cutting package | Would create import cycle pressure and violate established layering. Logic splits naturally across core (semver + types), runtime (discovery response + dispatch), and shim (discovery client + compatibility check). |
| Full npm range syntax (`~`, `||`, hyphen) | Over-engineering. Protocol explicitly constrains to `^` and `>=` ranges. Document this in SPEC Section 11. |
| Dynamic service registration API | Services are known at shell startup and do not change during a session. Static `hooks.services` is sufficient. Dynamic registration adds lifecycle complexity for zero current benefit. |
| Service-level ACL capabilities | SPEC Section 11.6 explicitly defers this. Individual services MAY implement their own checks within handlers. |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Semver matching | Inline ~60-line utility in core | `compare-versions@6.1.1` | Breaks core zero-dep constraint. |
| Semver matching | Inline ~60-line utility in core | `semver@7.x` (npm official) | 70KB, CJS-first, not tree-shakeable. |
| Semver matching | Inline ~60-line utility in core | `semver-ts@1.x` | Still a dependency in core. No `satisfies()`. |
| Version matching | Semver caret + gte + exact | Name-only presence check | Insufficient. Different service versions may have incompatible APIs. The point of feature negotiation is version-aware compatibility. |
| Discovery transport | Kind 29010 REQ/EVENT/EOSE | New protocol verb | Reusing NIP-01 REQ is simpler, already works, matches SPEC Section 11.2. |
| Discovery caching | Module-level promise cache in shim | Live subscription (stay open) | Services do not change during a session. One-shot query is sufficient. |
| Audio migration | Dual prefix (audio: + shell:audio-) | Hard rename to audio: only | Breaks existing hyprgate napplets. Backwards compatibility required. |
| Service types | Core (descriptor) + Runtime (handler) | All types in runtime | Shim needs ServiceDescriptor. Putting it in runtime would add runtime as shim dependency, breaking the DAG. |
| Compat reporting | Promise + data object | Custom event system | Existing `on()` covers async case. Promise covers sync case. No new abstraction needed. |

## Testing Additions

| Test Type | Framework | What |
|-----------|-----------|------|
| Semver unit tests | Vitest | `parseSemver`, `compareSemver`, `satisfiesCaret`, `satisfies` -- edge cases for `^0.x`, `^0.0.x`, exact match, `>=`, invalid input |
| Discovery protocol e2e | Playwright | Napplet sends REQ 29010, receives service descriptors, gets EOSE |
| Empty discovery e2e | Playwright | Shell with no services responds with immediate EOSE |
| Compatibility reporting e2e | Playwright | Napplet with `requires` tags gets report showing missing/incompatible services |
| Service dispatch unit | Vitest | INTER_PANE with `audio:register` topic routes to audio handler |
| Backwards compat unit | Vitest | INTER_PANE with `shell:audio-register` topic still works via dual-prefix |
| Vite plugin unit | Vitest | `requires` option injects correct meta tag and adds requires tags to manifest |
| Discovery timeout | Vitest | `discoverServices()` resolves even if EOSE never arrives (timeout fallback) |

## Installation Changes

```bash
# No new packages to install.
# All changes are internal to existing packages.
```

## Build Configuration

No changes to `tsup.config.ts`, `turbo.json`, or `tsconfig.json` in any package. New modules are picked up by existing glob patterns. Build order unchanged: core -> acl -> runtime -> shell | shim | vite-plugin.

## Sources

- [compare-versions on GitHub](https://github.com/omichelsen/compare-versions) -- Evaluated as escape hatch (v6.1.1, zero deps, ESM, satisfies with ^/~/>=)
- [npm/node-semver](https://github.com/npm/node-semver) -- Reference for caret range semantics
- [Semantic Versioning 2.0.0](https://semver.org/) -- Authoritative spec for version comparison rules and caret behavior
- [compare-versions npm registry](https://www.npmjs.com/package/compare-versions) -- Version 6.1.1 confirmed via registry API
- SPEC.md Section 11 (local, lines 806-906) -- Service discovery protocol definition (kind 29010 REQ/EVENT/EOSE)
- SPEC.md Section 11.6 (local, line 900) -- Service-level ACL deferred to future version
- SPEC.md Section 15.3 (local, lines 1114-1159) -- NIP-5A manifest format (kind 35128)
- SPEC.md line 1336 (local) -- Service dependency `requires` tags listed as future work item
- `packages/core/src/constants.ts` (local) -- `BusKind.SERVICE_DISCOVERY = 29010` already defined
- `packages/core/src/types.ts` (local) -- Core protocol types (NostrEvent, NostrFilter, Capability)
- `packages/shell/src/types.ts` (local) -- ServiceDescriptor, ServiceHandler, ServiceRegistry stubs already defined
- `packages/runtime/src/runtime.ts:288-306` (local) -- Current INTER_PANE dispatch flow with topic prefix matching
- `packages/runtime/src/runtime.ts:340` (local) -- Current isBusKind check that skips relay pool for ephemeral kinds
- `packages/shim/src/index.ts:222-225` (local) -- Current post-AUTH subscription pattern (signer + nipdb)
- `packages/vite-plugin/src/index.ts:74-86` (local) -- Current transformIndexHtml meta tag injection pattern

---

*Stack research complete. Zero new dependencies. ~60 lines of semver utility is the only "new technology" addition.*
