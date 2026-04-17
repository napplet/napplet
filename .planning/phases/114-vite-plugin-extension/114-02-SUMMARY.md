---
phase: 114-vite-plugin-extension
plan: 02
subsystem: infra
tags: [vite-plugin, nub-config, json-schema, build-guards, redos, nip-5a]

# Dependency graph
requires:
  - phase: 114-01-vite-plugin-discovery
    provides: "resolvedSchema: JSONSchema7 | null + resolvedSchemaSource: string | null closure vars populated in async configResolved"
  - phase: 111-nub-config-spec
    provides: "NUB-CONFIG Schema Contract / Exclusions — error-code vocabulary (invalid-schema, pattern-not-allowed, ref-not-allowed, secret-with-default) surfaced to build-time"
provides:
  - "validateConfigSchema(schema: unknown): { ok: true } | { ok: false, errors: string[] } — pure, zero-dep, recursive structural guard in packages/vite-plugin/src/index.ts"
  - "walk(node, path, errors) internal helper recursing into properties / items / additionalProperties / patternProperties / oneOf / anyOf / allOf / not / definitions / $defs"
  - "Build-abort semantics: malformed schemas throw a multi-line Error from configResolved BEFORE transformIndexHtml or closeBundle can read resolvedSchema"
  - "Backward-compat preserved: napplets with no declared schema (resolvedSchema === null) skip validation entirely"
affects: [114-03-vite-plugin-emit, 115-core-shim-sdk-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Hand-rolled recursive JSON-Schema walker as the build-time gate — no external validator dependency (no ajv / @cfworker / zod)"
    - "Violation accumulator pattern — collect every rejection into errors[], return as one batch so developers fix all problems in one build cycle"
    - "Error-code vocabulary alignment — build-time and shell-side validators use identical NUB-CONFIG spec literals (invalid-schema / pattern-not-allowed / ref-not-allowed / secret-with-default) so developers see one consistent error taxonomy"
    - "Dot-joined JSON-Pointer-ish path threading (`$.properties.foo.items`) for locatable violation messages in deep schemas"

key-files:
  created: []
  modified:
    - packages/vite-plugin/src/index.ts

key-decisions:
  - "validateConfigSchema is module-internal (not exported) — tsup drops it from dist/index.d.ts, keeping the public surface identical to 114-01; build-time behavior is the contract, not the function signature."
  - "Error-code vocabulary surfaces as PREFIXES in error strings ('pattern-not-allowed: <detail>') rather than structured { code, message } objects — keeps the validator's return type minimal (string[]) while still delivering machine-greppable spec codes + human-readable context in one line."
  - "Walk recurses into spec-excluded features (oneOf/anyOf/allOf/not/definitions/$defs) too — nested violations through combinators still surface at build time, even though the shell-side Core Subset enforcer will reject those combinators outright at config.registerSchema time. Build-time guard stays narrow on WHICH rules it enforces (4) but wide on WHERE it enforces them (every schema sub-tree)."
  - "Root-shape failure short-circuits the walk — a schema whose root is not { type: \"object\", ... } returns immediately with a single invalid-schema error. No point walking a malformed tree."
  - "configResolved throws a plain Error (not a Vite-specific diagnostic type) — Vite surfaces the message and fails the build with the correct exit code; no need for @rollup/pluginutils or Vite internals."

patterns-established:
  - "Structural build-time guard pattern: configResolved -> discover -> validate -> throw-or-continue. Template for any future build-time content guard (manifest tag validation, aggregateHash pre-checks, etc.)."
  - "Error message format: `<code>: <human explanation> [<path hint>]` — code as prefix for grep/tooling, path for developer context. Reusable for the 114-03 emission hooks if they need similar rejection surfaces."
  - "LOC budget for a single-file guard: ~160 LOC (JSDoc + two functions) fits comfortably in the main plugin file without needing extraction. Further guards can reuse the walk() helper verbatim."

requirements-completed: [VITE-07]

# Metrics
duration: 2min
completed: 2026-04-17
---

# Phase 114 Plan 02: validateConfigSchema Build-Time Structural Guard Summary

**Added a pure, zero-dependency recursive structural guard to `@napplet/vite-plugin` that rejects NUB-CONFIG schemas violating any of the four build-time-detectable rules (root-shape, external `$ref`, `pattern` keyword, `x-napplet-secret`+`default` coexistence) before the manifest is emitted, wired via `configResolved` so malformed schemas fail the Vite build with a single multi-line diagnostic naming every violation at once.**

## Performance

- **Duration:** ~2min
- **Started:** 2026-04-17T13:27:56Z
- **Completed:** 2026-04-17T13:30:02Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- `validateConfigSchema(schema: unknown): { ok: true } | { ok: false, errors: string[] }` landed in `packages/vite-plugin/src/index.ts` (~31 LOC for the top-level validator + ~89 LOC for the `walk` internal + JSDoc ≈ 162 LOC block total).
- Four rejection rules enforced with literal NUB-CONFIG spec error-code prefixes:
  - `invalid-schema`: root is not `{ type: "object", ... }` (null, array, primitive, wrong `type` value — all rejected; short-circuits the walk).
  - `pattern-not-allowed`: any `pattern` key anywhere in the tree (CVE-2025-69873 / ReDoS class).
  - `ref-not-allowed`: any `$ref` whose value does not start with `#/` (external reference ban; same-doc refs are flagged by shell-side Core Subset enforcer at `config.registerSchema` time).
  - `secret-with-default`: any property object with both `x-napplet-secret === true` and a `default` key.
- `walk` recurses into every JSON-Schema child-carrying keyword the guard might see: `properties`, `items`, `additionalProperties` (object form), `patternProperties`, `oneOf`, `anyOf`, `allOf`, `not`, `definitions`, `$defs`. Each recursion threads a dot-joined path (`$.properties.foo.items.oneOf[0]...`) so every error message names the exact schema location.
- Violations accumulate into a single `errors[]` array — one build cycle reports every problem; developers fix once and the build succeeds on the next run.
- `configResolved` mutated: after `discoverConfigSchema` returns a non-null schema, `validateConfigSchema` runs immediately. On `{ ok: false }` the hook throws a plain `Error` whose message is:
  ```
  [nip5a-manifest] configSchema validation failed (source: <source>)
    - invalid-schema: ...
    - pattern-not-allowed: `pattern` keyword found at $.properties.username — ...
    - ref-not-allowed: `$ref` at $.properties.widget must start with `#/` — ...
    - secret-with-default: property at $.properties.apiKey declares both ...
  ```
  Vite surfaces the message via `rollup`, the build exits non-zero, and downstream hooks (`transformIndexHtml`, `closeBundle`) never run.
- Clean-path logging: when validation passes, the existing `[nip5a-manifest] <type>: config schema discovered via <source>` log line now reads `... via <source> — validated`, giving developers a visual confirmation that the build-time guard ran and approved the schema.
- Backward compat fully preserved: napplets without a declared schema (`resolvedSchema === null`) skip validation entirely. Existing napplets continue to build with zero changes.
- Package gates clean: `pnpm --filter @napplet/vite-plugin type-check` exits 0; `pnpm --filter @napplet/vite-plugin build` exits 0 (tsup ESM 10.38 KB + DTS 2.66 KB — DTS unchanged from 114-01 because `validateConfigSchema` is internal). Full monorepo `pnpm -r type-check` green across all 13 packages.
- Negative-path sanity smoke (one-shot, not persisted): a fixture schema declaring `{ type: 'string' }` root produces exactly 1 rejection (`invalid-schema`, short-circuits); a fixture with root `{ type: 'object' }` plus `properties.a.pattern`, `properties.b.$ref: 'https://evil'`, and `properties.c.{ x-napplet-secret: true, default: 'leaked' }` produces exactly 3 rejections, one per rule, in deterministic order.

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement validateConfigSchema + wire it into configResolved** — `3789578` (feat)

Plan metadata commit to follow this summary write.

## Files Created/Modified

- `packages/vite-plugin/src/index.ts` — Added the `validateConfigSchema` pure guard (~31 LOC) + `walk` recursive helper (~89 LOC) + ~30 lines of JSDoc documenting the four rules and the walker's traversal surface (~162 LOC block). Mutated the existing `configResolved` async hook (added 13 lines): after `discoverConfigSchema` returns a non-null schema, runs `validateConfigSchema`, throws a multi-line error on `ok: false`, updates the success log suffix to `— validated`. No changes to `transformIndexHtml` (still the 114-01 shape), `closeBundle` (unchanged), `walkDir`, `sha256File`, `computeAggregateHash`, or `discoverConfigSchema`. File grew from 328 -> 504 lines (+176 net).

## Decisions Made

- **Validator is module-internal (not exported).** tsup drops unexported symbols from `dist/index.d.ts`; consumers still see only `nip5aManifest` + `Nip5aManifestOptions` in the public type surface. The contract exposed to plan 114-03 is behavioral (configResolved either throws or leaves a structurally-valid schema in the closure), not a named function. This keeps the public API stable.
- **Error codes embedded as string PREFIXES, not as a structured discriminated union.** Every error string begins with one of the four spec literals followed by `: <human explanation>`. Machine-greppable without forcing the validator to return richer objects. Kept the return type at `string[]` so the integration site (configResolved) can `.join('\n')` directly.
- **Walk recurses into schema features the spec forbids** (`oneOf`/`anyOf`/`allOf`/`not`/`definitions`/`$defs`/`patternProperties`). Rationale: the build-time guard's job is to catch the FOUR structural rules early, not to enforce the full Core Subset. A napplet that (incorrectly) uses `oneOf: [..., { pattern: ... }]` will still have its `pattern` flagged at build time. The shell-side enforcer at `config.registerSchema` time is the canonical Core Subset gatekeeper and will reject the combinator shape outright. Two guards in layered defense, different granularities.
- **Root-shape failure short-circuits the walk.** Recursing into a schema whose root is not `{ type: "object", ... }` produces nothing meaningful — possibly `Array.prototype.properties` accesses on a string, etc. Short-circuit keeps the error surface predictable ("one rejection when the shape is fundamentally wrong, four when the shape is right but the contents violate rules 2-4").
- **`configResolved` throws a plain `Error`, not a Vite-specific diagnostic type.** Vite surfaces plain Error messages via `rollup` with correct exit codes; no need for `@rollup/pluginutils.error()` or Vite internals. Keeps the plugin dependency-free on Vite internal APIs.

## Deviations from Plan

None — plan executed exactly as written. All acceptance greps passed; standalone + monorepo type-check green on first attempt; tsup build clean on first attempt; negative-path smoke produced exactly the expected counts for both malformed-root and compound-violation fixtures.

## Behavioral Contract for Plan 114-03

Plan 03 (manifest tag + meta injection + `config:schema` aggregateHash contribution) inherits this guarantee:

> **When plan 114-03's `closeBundle` and `transformIndexHtml` hooks read `resolvedSchema`, it is guaranteed to be either `null` (no schema declared — skip emission) or a structurally valid schema that has passed all four build-time rejection rules.** No additional validation or error-path handling is needed in the emission hooks — they can assume the schema is safe to `JSON.stringify` and embed verbatim.

This preserves the closure-variable hand-off pattern established in 114-01: each plan populates/reads the closure vars but does not duplicate discovery or guard logic.

## Issues Encountered

None.

## User Setup Required

None — pure build-time code change, no external service configuration.

## Next Phase Readiness

- **114-03 (manifest tag + meta + aggregateHash / VITE-04/05/06):** Can read `resolvedSchema` in `closeBundle` for the `['config', JSON.stringify(schema)]` manifest tag + synthetic `config:schema` aggregateHash path, and in `transformIndexHtml` for the `<meta name="napplet-config-schema">` head injection. Every non-null `resolvedSchema` is structurally valid at that point.
- **Contract surface is frozen:** `resolvedSchema: JSONSchema7 | null` + "null OR structurally valid" invariant. Plan 03 does not need to know about the four rules or the NUB-CONFIG spec vocabulary — that's entirely owned by plan 02.

## Self-Check: PASSED

Verified:
- `packages/vite-plugin/src/index.ts` FOUND (modified, 504 LOC)
- `grep "function validateConfigSchema"` FOUND
- `grep "'invalid-schema'"` FOUND (JSDoc line 176)
- `grep "'pattern-not-allowed'"` FOUND (JSDoc line 177)
- `grep "'ref-not-allowed'"` FOUND (JSDoc line 180)
- `grep "'secret-with-default'"` FOUND (JSDoc line 184)
- `grep "validateConfigSchema(resolvedSchema"` FOUND (configResolved integration)
- `grep "x-napplet-secret"` FOUND (rule 4)
- Commit `3789578` FOUND (`feat(114-02): add validateConfigSchema structural guard + configResolved integration`)
- `pnpm --filter @napplet/vite-plugin type-check` exit 0
- `pnpm --filter @napplet/vite-plugin build` exit 0 (ESM 10.38 KB + DTS 2.66 KB)
- `pnpm -r type-check` exit 0 across all 13 packages
- Negative-path smoke: fixture with 4 violations produced the expected 1 (short-circuit) / 3 (compound) rejection counts with matching path strings

---
*Phase: 114-vite-plugin-extension*
*Completed: 2026-04-17*
