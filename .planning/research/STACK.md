# Stack Research: NUB-CONFIG (v0.25.0)

**Domain:** Napplet protocol — per-napplet declarative configuration NUB (spec + SDK package + vite-plugin extension)
**Researched:** 2026-04-17
**Confidence:** HIGH

## Executive Summary (read this first)

**No runtime dependencies need to be added to any @napplet/* package for NUB-CONFIG.** The entire feature is expressible with:

1. `@napplet/nub-config` — a 13th package that mirrors `@napplet/nub-identity` exactly in structure (`types.ts + shim.ts + sdk.ts + index.ts`, `workspace:*` on `@napplet/core` as its only dependency).
2. `@napplet/vite-plugin` — gains **one optional field** in `Nip5aManifestOptions` (`configSchema?: unknown`) and emits it as a `["config", JSON.stringify(schema)]` tag in the NIP-5A kind 35128 event. No new npm deps.
3. `@napplet/core` — one-line `NubDomain` + `NUB_DOMAINS` addition, plus the `config` namespace typed on `NappletGlobal`.

**TypeScript inference from a JSON Schema literal (the author-DX carrot) is delivered via `json-schema-to-ts@3.1.1` as a `peerDependencies` (optional) on `@napplet/nub-config`, not a direct `dependencies`.** This is important and explained below — the package ships runtime helpers (1.1MB + babel-runtime transitively) that napplet authors do NOT need. Shipping it as an optional peer lets authors who want `FromSchema<typeof schema>` install it themselves; authors who are happy with `unknown`/`Record<string, unknown>` pay nothing.

Validators (ajv, etc.) are explicitly **not** recommended anywhere in the SDK surface. Shell validates per the NUB-CONFIG spec MUST; the shim forwards and subscribes, nothing more. Build-time schema sanity checks in the vite-plugin can be done with a ~40-line hand-written guard rather than pulling a 500KB validator into the dev toolchain.

## Recommended Stack

### Core Technologies (unchanged from existing milestones)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| TypeScript | 5.9.3 | Strict ESM-only sources for types, shim, sdk | Already the repo-wide pin. No reason to diverge. |
| tsup | 8.5.0 | ESM bundling for the new `@napplet/nub-config` package and the modified `@napplet/vite-plugin` | Verbatim copy of every other NUB package's `tsup.config.ts`. |
| turborepo | 2.5.0 | Monorepo orchestration; picks up the new package automatically via pnpm workspace glob | No config change needed — `pipeline.build` already covers it. |
| pnpm | 10.8.0 | Workspace linking (`workspace:*`) | Same as every other NUB dep edge. |
| changesets | 2.30.0 | Version bump + publish for the new package | Standard milestone flow — add a `@napplet/nub-config` changeset in Phase N. |
| nostr-tools | 2.23.3 | Used only by `@napplet/vite-plugin` for kind 35128 event signing | Unchanged. Config schema embedding does **not** require nostr-tools; it adds a tag to the existing unsigned template before `finalizeEvent()`. |

### New Supporting Library (optional peer only)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `json-schema-to-ts` | **3.1.1** | Compile-time `FromSchema<typeof schema>` type inference from a literal JSON Schema with `as const` | **Only** as an optional `peerDependencies` on `@napplet/nub-config`. Napplet authors who want typed `config.values` opt in by installing it themselves. Ships with `@babel/runtime` + `ts-algebra` runtime deps (~1.5MB transitive) that we do NOT want to force on authors who don't care. |

Caveat: the `json-schema-to-ts` package *does* export three runtime helpers (`asConst`, `wrapCompilerAsTypeGuard`, `wrapValidatorAsTypeGuard`). The `FromSchema` export is type-only and gets erased. `@napplet/nub-config` MUST only use `import type { FromSchema } from 'json-schema-to-ts'` and the tsconfig's `verbatimModuleSyntax: true` (already set repo-wide) will enforce that at compile time.

### Development Tools (no change)

| Tool | Purpose | Notes |
|------|---------|-------|
| tsup | Build `packages/nubs/config/` | Config file identical to `packages/nubs/notify/tsup.config.ts` — copy verbatim. |
| typescript --noEmit | `type-check` script in each package | Already per-package pattern; just add the script to the new package.json. |
| changesets | Version + publish | `pnpm changeset` captures the new package at v0.2.0 alongside the minor bump for `core`/`shim`/`sdk`/`vite-plugin`. |

## Installation

The reference implementation workspace changes:

```bash
# No new root-level installs. Package-local devDeps only:
# 1. Create packages/nubs/config/ mirroring packages/nubs/identity/ structure
# 2. Copy package.json, tsup.config.ts, tsconfig.json from nubs/identity/
# 3. Add dependency edges in packages/shim/package.json and packages/sdk/package.json:
#       "@napplet/nub-config": "workspace:*"

pnpm install    # resolves the new workspace link
pnpm build      # turborepo builds the new package in topo order
```

Napplet authors who want typed config:

```bash
# Optional — only if author wants FromSchema<typeof schema> inference
pnpm add -D json-schema-to-ts
```

## Answering the Specific Questions

### 1. JSON Schema TypeScript inference — which option, and does it cost anything?

**Recommendation: `json-schema-to-ts@3.1.1` as an optional peer dependency, used with `import type { FromSchema }`.**

| Option | Runtime cost to napplet | DX value | Verdict |
|--------|-------------------------|----------|---------|
| `@types/json-schema@7.0.15` | **Zero** (types-only, no runtime code at all) | Provides `JSONSchema7` type only — NOT instance inference. Author writes `const schema: JSONSchema7 = {...}` and `config.values` stays `Record<string, unknown>`. | Ship this as `devDependencies` in `@napplet/nub-config` and re-export `JSONSchema7` as a convenience type. Enables authors to get autocomplete on their schema definition without any instance-type inference. |
| `json-schema-to-ts@3.1.1` | Zero **at runtime** when only `FromSchema` is imported as `type`. Non-zero if author pulls in `asConst`/`wrapCompilerAsTypeGuard` (which we do NOT expose). Transitive install cost: `@babel/runtime` + `ts-algebra` ≈ 1.5MB `node_modules` footprint. | Full instance type inference: `type Config = FromSchema<typeof schema>` gives `{ theme: 'light' | 'dark'; fontSize: number }` from a literal schema. Major author-DX win for the "write schema → get typed values" workflow. | Ship as `peerDependencies` + `peerDependenciesMeta.optional: true`. Authors opt in; those who don't bear zero cost. |
| `ajv@8.18.0` | Runtime — ~120KB minified+gzipped, brings `fast-uri`, `fast-deep-equal`, etc. | Full runtime validation. Irrelevant to SDK — shell validates per the spec MUST. | **Do not add.** The reference shim MUST NOT duplicate shell-side validation. Keeps the "zero runtime deps on napplet side" invariant intact. |
| `typebox` | Runtime (5–15KB) — creates JSON Schema objects in code that also infer as TS types. | Alternative author-DX: write a TypeBox definition instead of a JSON Schema literal, get types for free, serialize to JSON Schema for the manifest. | **Do not ship**, but document as an allowed author choice: authors can use TypeBox on their own and pass `Type.Object({...})` output to `nip5aManifest({ configSchema: ... })` — works today with no SDK changes. |
| Hand-rolled `FromSchema`-ish generic | Zero | Very limited — re-implementing `json-schema-to-ts` is 2,000+ lines across `ts-algebra` and the schema traversal; not justified. | **Do not attempt.** |

**Final call:** `@napplet/nub-config` declares `@types/json-schema@7.0.15` in `devDependencies` (for internal use + convenience re-export of the `JSONSchema7` type) and `json-schema-to-ts@3.1.1` in `peerDependencies` as **optional**. The package's `types.ts` uses `import type { JSONSchema7 } from 'json-schema-to-ts'` so the FromSchema import site tree-shakes to nothing. README documents both paths.

### 2. Vite-plugin changes — do we need a schema validator at build time?

**Recommendation: No library. Write a ~40-line structural guard inline.**

The vite-plugin already has zero JSON-Schema-aware code. What needs to happen:

1. `Nip5aManifestOptions` gains one optional field:
   ```ts
   /** Optional JSON Schema (draft-07+) for napplet configuration, embedded in the NIP-5A manifest. */
   configSchema?: JSONSchema7 | Record<string, unknown>;
   ```
2. If present, a build-time sanity check confirms:
   - Value is a plain object (not null, not array)
   - `type: 'object'` at the root (config is always an object of named fields)
   - `properties` is a plain object if present
   - Nothing in the schema uses unsupported shapes (e.g., remote `$ref` which the shell cannot resolve)
3. On pass, the schema is JSON-stringified and added as a tag: `['config', JSON.stringify(schema)]` in the kind 35128 `tags` array.
4. On fail, `this.error(...)` aborts the build with a pointer to the offending field.

**Why no library:**
- Ajv would be a devDep, not shipped — but it's still ~500KB in `node_modules` and ~2s in CI install time for a check that a 40-line function does correctly.
- The "malformed schema" cases we care about (null, array, missing `type`, non-object `properties`, remote `$ref`) are trivially detectable. We do not need to re-validate that the JSON Schema itself conforms to the meta-schema — that's the schema author's problem and a JSON Schema-aware editor will catch it long before Vite runs.
- Keeps the vite-plugin's dep graph stable. Currently: `nostr-tools` + `@types/node` (dev). Adding `ajv` for a 40-line check is a regression.

**If authors want strict meta-schema conformance at build time**, the correct UX is: document `pnpm dlx ajv compile -s config.schema.json --strict` as a pre-flight check. Keeps it a one-off developer opt-in, not a protocol-level requirement.

### 3. Zero-runtime-dep constraint — can we ship?

**Yes, fully, with the structure already documented:**

| Package | Added runtime deps | Added dev deps | Added peer deps |
|---------|-------------------|----------------|-----------------|
| `@napplet/core` | none | none | none |
| `@napplet/nub-config` | `@napplet/core: workspace:*` (same as every NUB) | `tsup@8.5.0`, `typescript@5.9.3`, `@types/json-schema@7.0.15` | `json-schema-to-ts@3.1.1` (optional) |
| `@napplet/shim` | `@napplet/nub-config: workspace:*` (same pattern as existing NUB shim imports) | none | none |
| `@napplet/sdk` | `@napplet/nub-config: workspace:*` | none | none |
| `@napplet/vite-plugin` | none added | none added | none added |

Net external-npm additions for the monorepo: **0 direct runtime deps, 1 dev-only type package (`@types/json-schema`), 1 optional peer (`json-schema-to-ts`).** The optional peer is only pulled when a downstream author opts in — neither CI nor publish consumers pay for it.

### 4. Precedent check — which NUB does nub-config most resemble?

**Closest match: `@napplet/nub-notify` (similar wire shape) + `@napplet/nub-keys` (push-subscription pattern).**

- **Structurally identical to `nub-notify`:** `types.ts` + `shim.ts` + `sdk.ts` + `index.ts` with a `DOMAIN = 'notify' as const` constant. Same `package.json` boilerplate (just swap name/description/keywords). Same `tsup.config.ts` — copy verbatim.
- **Subscription semantics cribbed from `nub-keys`:** `config.subscribe` and `config.values` push model parallels the `keys.bind` / `keys.config` push pattern. Shim maintains a listener map keyed by subscription ID, shell pushes `config.values` on change, shim fans out to local subscribers.
- **Request/result pairs cribbed from `nub-identity`:** `config.get` / `config.get.result` and `config.registerSchema` / `config.registerSchema.result` are RPC pairs with a correlation `id` — exactly the `IdentityGet*Message` / `IdentityGet*ResultMessage` pattern already used 9 times in nub-identity.

**Concrete checklist for the package scaffolding phase** (no research required — this is pure template copy):

1. Copy `packages/nubs/notify/` → `packages/nubs/config/`.
2. Rewrite `package.json`: name `@napplet/nub-config`, description "NUB-CONFIG message types and shim methods for per-napplet declarative configuration", keywords `['nostr', 'napplet', 'nub', 'config']`, add `devDependencies["@types/json-schema"]: "^7.0.15"` and `peerDependencies["json-schema-to-ts"]: "^3.1.1"` with `peerDependenciesMeta."json-schema-to-ts".optional: true`.
3. Replace `src/types.ts` with config message definitions (`DOMAIN = 'config' as const`, `ConfigRegisterSchemaMessage`, `ConfigGetMessage`, `ConfigSubscribeMessage`, `ConfigValuesMessage`, `ConfigOpenSettingsMessage` + their `.result` variants; plus `ConfigSchema` type re-exporting `JSONSchema7` as a convenience alias).
4. `src/shim.ts` mirrors `nub-notify/shim.ts` for RPCs + `nub-keys/shim.ts` for the subscribe-live fan-out.
5. `src/sdk.ts` mirrors `nub-identity/sdk.ts` — `requireConfig()` guard + one named export per method.
6. `src/index.ts` — barrel re-exports and `registerNub(DOMAIN, ...)` stub exactly like every other NUB.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `json-schema-to-ts` optional peer | Hardcode `ConfigValues = Record<string, unknown>` and make authors cast | Valid for a truly minimal first cut. Downside: eliminates the killer DX demo ("change schema, values type updates automatically"). Document but default to the peer-dep route. |
| `json-schema-to-ts` optional peer | Ship `json-schema-to-ts` as direct `dependencies` | Never — forces `@babel/runtime` + `ts-algebra` into every downstream consumer's `node_modules`, violates the zero-runtime-deps invariant. |
| Inline schema sanity check | `ajv` in vite-plugin devDeps for build-time validation | If the spec grows to require draft-2020-12 features the hand-written guard can't cover (e.g., `$dynamicRef` resolution), reconsider. Not needed for v0.25.0. |
| `@types/json-schema@7.0.15` | `json-schema-typed` (enum-ish pkg) | No benefit — `@types/json-schema` is the DefinitelyTyped canonical and widely known. |
| Embed schema as `['config', JSON.stringify(schema)]` tag | Embed as a separate kind 35129 event | Overkill. The NIP-5A manifest is already the single authoritative per-napplet event; schema belongs there. A tag is the standard NIP pattern. |
| Author chooses TypeBox independently | `typebox` as a direct dep of `@napplet/nub-config` | Forcing TypeBox on authors who prefer hand-written JSON Schemas adds a runtime footprint for nothing. Authors who like TypeBox install it themselves; the config NUB API accepts any JSON Schema object. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `ajv` (any version) as a direct dep of `@napplet/nub-config` or `@napplet/shim` | Shell validates per the NUB-CONFIG MUST. Shim duplication violates separation of concerns, bloats the napplet bundle (~50KB gzipped on the napplet side of the sandbox), and invites drift between shim-side and shell-side validation semantics. | Nothing. The shim forwards values that the shell has already validated. |
| `@rjsf/core`, `@rjsf/validator-ajv8`, `formkit`, or any form renderer | The settings UI is a **shell concern** per the locked decision. Referencing a renderer in the SDK or vite-plugin leaks shell UX opinions into the spec. | Shell implementations pick their own renderer. `@napplet/nub-config` ships zero UI. |
| `zod`, `valibot`, `yup`, `io-ts` | These are alternative schema systems, not JSON Schema. NUB-CONFIG has locked JSON Schema (draft-07+) as the wire format. Bringing in a second schema DSL confuses authors and fragments the ecosystem. | `json-schema-to-ts` (optional peer) for TS inference. Authors who prefer Zod can still call `zodToJsonSchema()` themselves and pass the result. |
| `json-schema-to-typescript` (bcherny) | Code-generation library (writes `.d.ts` files from schemas). Solves a different problem — it's for authors who want to regenerate TS types as a build step rather than infer them in-place. Adds a CLI step to the author workflow. | `json-schema-to-ts` gives in-place inference without a codegen step. |
| `json-schema-to-ts` as direct `dependencies` on `@napplet/nub-config` | Transitively pulls `@babel/runtime` (~1.1MB) and `ts-algebra` (~452KB) into every consumer, even those that don't use `FromSchema`. | Optional `peerDependencies` — opt-in only. |
| `typescript-json-schema` / `ts-json-schema-generator` in the vite-plugin | These generate JSON Schema *from* TypeScript source. Opposite direction — we want authors to author JSON Schema (the wire contract) and optionally derive TS types from it, not the other way around. | Vite-plugin takes a JSON Schema literal; authors author it directly or via TypeBox. |
| A new `@napplet/config-util` or `@napplet/schema-util` helper package | Over-packaging. Every NUB keeps its logic in its NUB package — see v0.21.0 modularization decision. Validators/utilities live inside `nub-config` if needed at all. | Put any helpers inside `packages/nubs/config/src/`. |

## Stack Patterns by Variant

**If the spec stays at MVP scope (get/subscribe/openSettings/registerSchema + values push):**
- Use exactly the pattern above. No additional files beyond `types.ts`, `shim.ts`, `sdk.ts`, `index.ts`.
- The vite-plugin change is ~30 lines + the new option field.

**If the spec later adds partial-update semantics (`config.patch` style RPCs):**
- Still no new runtime deps. Add message types to `types.ts`, handlers to `shim.ts`. Shell is still sole writer — any `config.patch` is just a shell-side operation dispatched by the UI.

**If `$version` migration becomes a runtime concern for the shim:**
- The decided answer is "shell-resolved" — shim never sees old values. No change needed. If that decision reverses later, consider a minimal migration helper inside `nub-config`, still zero-runtime-dep.

**If author DX feedback demands richer schema utilities (e.g., schema → form preview for development):**
- Ship that as a separate `@napplet/config-devtools` package outside this milestone. Do not pollute `@napplet/nub-config`.

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `@napplet/nub-config@0.2.0` | `@napplet/core@workspace:*` | Same monorepo-wide pin as every NUB. |
| `json-schema-to-ts@3.1.1` | `typescript@>=4.7`, repo pin `5.9.3` is comfortably in range | Requires `verbatimModuleSyntax: true` + `import type` to avoid pulling runtime helpers. Repo `tsconfig.json` already sets this. |
| `@types/json-schema@7.0.15` | Any TypeScript ≥4.0 | Last published Nov 2023. Stable — JSON Schema draft-07 types don't drift. |
| `vite@>=5.0.0` peer (existing) | `vite@6.3.0` used in demos | Unchanged. Schema-tag injection is a pure build-phase addition inside `closeBundle()`. |
| `nostr-tools@2.23.3` | `vite-plugin` dep (unchanged) | Config schema goes into `manifest.tags` before `finalizeEvent()`. Signing works identically to today; the new tag is just more bytes in the event payload. |

## Sources

- [json-schema-to-ts on GitHub](https://github.com/ThomasAribart/json-schema-to-ts) — verified 3.1.1 is current; README confirms `FromSchema` is type-only and can be used as a dev-dependency. HIGH.
- `npm view json-schema-to-ts version dependencies` (live registry) — confirms `@babel/runtime ^7.18.3` and `ts-algebra ^2.0.0` as direct runtime deps of the package itself. HIGH.
- Package ESM entry inspection (`lib/esm/index.js`) — confirms three runtime exports (`asConst`, `wrapCompilerAsTypeGuard`, `wrapValidatorAsTypeGuard`) exist but `FromSchema` is type-only. HIGH.
- `npm view @types/json-schema version` — 7.0.15 (current stable). HIGH.
- `npm view ajv version dependencies` — 8.18.0; confirmed supports draft-04/06/07/2019-09/2020-12 but explicitly excluded from SDK scope per the locked decision that shell validates. HIGH.
- [Ajv JSON schema validator docs](https://ajv.js.org/json-schema.html) — confirms draft-07 is the safe interoperable baseline. HIGH (for the draft-07 choice already locked in STATE.md).
- Existing codebase, primary source:
  - `packages/nubs/identity/` — closest structural precedent. HIGH.
  - `packages/nubs/notify/` — similar RPC shape; same package.json boilerplate. HIGH.
  - `packages/nubs/keys/src/shim.ts` — subscribe-live / push-update pattern for `config.values`. HIGH.
  - `packages/vite-plugin/src/index.ts` — exact insertion point for `configSchema` tag is between the `x` tags and `requires` tags in the `manifest.tags` array construction (lines 145–152). HIGH.
  - `packages/core/src/envelope.ts` — `NubDomain` union + `NUB_DOMAINS` array location. HIGH.
  - `packages/core/src/types.ts` — `NappletGlobal` interface location for the new `config` namespace. HIGH.
- Prior milestone research `.planning/research/STACK.md` (v0.20.0 Keys NUB) — established the "no-deps NUB" pattern and the rationale for keeping utility code inside NUB packages. HIGH.

---
*Stack research for: v0.25.0 NUB-CONFIG (spec + SDK + vite-plugin)*
*Researched: 2026-04-17*
