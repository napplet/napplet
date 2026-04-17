---
phase: 112-nub-config-package-scaffold
plan: 02
subsystem: nubs
tags: [nub-config, types, json-schema, wire-protocol, discriminated-union, barrel]

# Dependency graph
requires:
  - phase: 111-nub-config-spec
    provides: "Merged NUB-CONFIG.md spec (napplet/nubs#13) — authoritative wire-message table, Error Envelopes, Schema Contract, and Standardized Extensions"
  - phase: 112-01
    provides: "packages/nubs/config/ scaffold with package.json + tsup.config.ts + tsconfig.json + stub DOMAIN barrel — enabled this plan to land types.ts against a resolvable, buildable package"
provides:
  - "packages/nubs/config/src/types.ts — 321 LOC: 8 wire-message interfaces + 4 type aliases + NappletConfigSchemaExtensions potentiality + ConfigMessage base + DOMAIN constant + 3 discriminated unions"
  - "packages/nubs/config/src/index.ts — full barrel re-exporting all 15 type symbols + DOMAIN"
  - "Buildable @napplet/nub-config@0.2.0 npm package with complete type surface (no shim/sdk yet — phase 113)"
  - "dist/index.d.ts 9.68 KB — 16 declarations emitted; no runtime cost beyond the DOMAIN string constant"
affects: [113, 114, 115, 116]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "DOMAIN relocation: stub barrel (plan N-01) → types.ts canonical (plan N-02) matches identity NUB precedent at packages/nubs/identity/src/types.ts line 19"
    - "8-wire-message / 3-discriminated-union layout: ConfigRequestMessage (5 requests) | ConfigResultMessage (3 results) | ConfigNubMessage (all) mirrors identity's IdentityRequestMessage/ResultMessage/NubMessage three-layer pattern"
    - "Optional correlation-id field for dual-use messages: config.values.id? distinguishes correlated response (`config.get` answer) from subscription push"

key-files:
  created:
    - "packages/nubs/config/src/types.ts — all NUB-CONFIG wire types + schema/values aliases + extension potentialities + DOMAIN + discriminated unions"
  modified:
    - "packages/nubs/config/src/index.ts — expanded from DOMAIN-only stub to full barrel re-exporting 15 type symbols + DOMAIN"

key-decisions:
  - "Followed merged spec at /home/sandwich/Develop/nubs/NUB-CONFIG.md (not ARCHITECTURE.md research draft) — correlation field is `id`, not `requestId`. The research draft floated `requestId` but the merged spec locked `id` to match nub-identity convention."
  - "ConfigSchemaErrorCode union has 8 literals — excludes `unknown-section` from spec's Error Envelopes table. Per spec text, `unknown-section` is non-normative and shells MUST NOT surface it as a wire error, so it has no place in the TS union."
  - "NappletConfigSchemaExtensions interface declares only 3 keys (x-napplet-secret, x-napplet-section, x-napplet-order). Per plan instructions — spec lists two additional annotative keys (deprecationMessage, markdownDescription) which are standard JSON Schema / VS Code annotations and don't need their own potentiality type."
  - "ConfigSchema type alias retained alongside NappletConfigSchema for spec-name alignment — the NUB-CONFIG public API Surface uses bare ConfigSchema; NappletConfigSchema is our internal-ish fully-namespaced name. Both resolve to JSONSchema7."
  - "config.registerSchema uses positive-ACK pattern: ConfigRegisterSchemaResultMessage has `ok: boolean` required, `code?: ConfigSchemaErrorCode` + `error?: string` optional (populated only on ok:false). This matches the spec's explicit 'it is never error-only' note."
  - "config.values.id is optional per dual-use contract: present → correlated response to config.get; absent → subscription push (initial snapshot or change notification). Flagged with JSDoc on the property."
  - "DOMAIN moved from index.ts stub (plan 01) to types.ts canonical (this plan) per identity NUB convention at packages/nubs/identity/src/types.ts line 19. Barrel re-exports via `export { DOMAIN } from './types.js'`."
  - "No registerNub(DOMAIN, ...) call in barrel — phase 115 integration work. Keeping package side-effect-free for now (matches sideEffects: false in package.json)."
  - "No shim.ts or sdk.ts files created — explicit non-goals per plan. Those land in phase 113."

patterns-established:
  - "NUB type surface before shim/SDK pattern: scaffold → types → (optional checkpoint for phase 113) → shim+SDK. Types ARE the protocol contract; getting them right prevents a rippling rewrite across later phases."

requirements-completed: [NUB-02, NUB-05]

# Metrics
duration: 2m29s
completed: 2026-04-17
---

# Phase 112 Plan 02: NUB Config Types + Barrel Summary

**Landed the full `packages/nubs/config/src/types.ts` — 321 LOC containing all 8 NUB-CONFIG wire messages, schema/values/extension types, the ConfigSchemaErrorCode 8-literal union, the relocated DOMAIN constant, and 3 discriminated unions — plus the full barrel re-exporting 15 type symbols. Package build + type-check green; full monorepo type-check green across all 13 packages. Package surface is now ready for Phase 113's shim+SDK code.**

## Performance

- **Duration:** 2m 29s
- **Started:** 2026-04-17T11:21:22Z
- **Completed:** 2026-04-17T11:23:51Z
- **Tasks:** 2
- **Files created:** 1 (types.ts)
- **Files modified:** 1 (index.ts — stub → full barrel)

## Accomplishments

### All 8 NUB-CONFIG wire messages match the merged spec table

Transcribed from `/home/sandwich/Develop/nubs/NUB-CONFIG.md` Wire Protocol section:

| # | Type | Direction | Interface |
|---|------|-----------|-----------|
| 1 | `config.registerSchema` | napplet → shell | `ConfigRegisterSchemaMessage` |
| 2 | `config.get` | napplet → shell | `ConfigGetMessage` |
| 3 | `config.subscribe` | napplet → shell | `ConfigSubscribeMessage` |
| 4 | `config.unsubscribe` | napplet → shell | `ConfigUnsubscribeMessage` |
| 5 | `config.openSettings` | napplet → shell | `ConfigOpenSettingsMessage` |
| 6 | `config.registerSchema.result` | shell → napplet | `ConfigRegisterSchemaResultMessage` |
| 7 | `config.values` | shell → napplet | `ConfigValuesMessage` |
| 8 | `config.schemaError` | shell → napplet | `ConfigSchemaErrorMessage` |

Plus `ConfigMessage` base extending `NappletMessage` with `type: \`config.${string}\`` — total 9 exported interfaces (plan required ≥9).

### Schema + Values type aliases

- `NappletConfigSchema = JSONSchema7` (from `json-schema` module)
- `ConfigSchema = NappletConfigSchema` (spec-name alias)
- `ConfigValues = Record<string, unknown>`
- `ConfigSchemaErrorCode` — 8-literal union: `invalid-schema | unsupported-draft | ref-not-allowed | pattern-not-allowed | secret-with-default | schema-too-deep | version-conflict | no-schema`

### Standardized extension potentialities

`NappletConfigSchemaExtensions` interface declares the 3 x-napplet-* keys authors will most often write: `'x-napplet-secret'?`, `'x-napplet-section'?`, `'x-napplet-order'?` — each JSDoc'd with the spec's shell behavior expectation.

### Discriminated unions

Three-layer pattern matching identity NUB:
- `ConfigRequestMessage` — 5 napplet → shell requests
- `ConfigResultMessage` — 3 shell → napplet results / pushes
- `ConfigNubMessage` — all messages (full discriminated union on `type` field)

### DOMAIN relocation

`export const DOMAIN = 'config' as const` moved from the plan-01 stub in `src/index.ts` to its canonical location in `src/types.ts` (line 24), matching `packages/nubs/identity/src/types.ts` line 19 exactly. Barrel now re-exports via `export { DOMAIN } from './types.js'`.

### Barrel

`src/index.ts` expanded from 11 LOC stub → 57 LOC full barrel. Exports the DOMAIN value and 15 type symbols grouped into:
- Schema + values aliases (4)
- Schema extension potentialities (1)
- Base message type (1)
- Napplet → Shell request messages (5)
- Shell → Napplet result / push messages (3)
- Discriminated unions (3)

### Build + type-check gate

- `pnpm --filter @napplet/nub-config build` → exit 0; produced `dist/index.js` (93 B — just the DOMAIN string), `dist/index.d.ts` (9.68 KB, 16 declarations), and sourcemap
- `pnpm --filter @napplet/nub-config type-check` → exit 0
- `pnpm type-check` (full monorepo, 13 packages) → exit 0, 22/22 turbo tasks successful (21 cached + 1 new for nub-config)

### Negative-grep sanity

Confirmed across both `src/types.ts` and `src/index.ts`:
- Zero `requestId` references (correlation uses `id` per spec)
- Zero `shim.js` / `sdk.js` imports (those are phase 113)
- Zero `registerNub` calls (that is phase 115)
- Zero `window.napplet` references (SDK/shim concern, not types)

## Task Commits

Each task was committed atomically:

1. **Task 1: Write src/types.ts with all 8 NUB-CONFIG wire types** — `1c23853` (feat)
2. **Task 2: Expand @napplet/nub-config barrel — full type surface** — `149c735` (feat)

## Files Created/Modified

- **Created:** `packages/nubs/config/src/types.ts` (321 LOC) — file header JSDoc, type-only imports from `@napplet/core` and `json-schema`, DOMAIN constant, 4 type aliases (NappletConfigSchema, ConfigSchema, ConfigValues, ConfigSchemaErrorCode), NappletConfigSchemaExtensions interface with the 3 x-napplet-* keys, ConfigMessage base extending NappletMessage, 5 request interfaces, 3 result interfaces, 3 discriminated unions. Every exported symbol has JSDoc; every message type has an `@example` block showing construction.
- **Modified:** `packages/nubs/config/src/index.ts` (11 → 57 LOC) — replaced stub `export const DOMAIN` + package JSDoc with full barrel: package-level JSDoc (with updated `@example` importing multiple symbols), `export { DOMAIN } from './types.js'` value re-export, and a grouped `export type { ... } from './types.js'` block covering all 15 type symbols.

## Decisions Made

- **Merged spec wins over research draft.** `.planning/research/ARCHITECTURE.md` floated `requestId` as the correlation field, but the merged `/home/sandwich/Develop/nubs/NUB-CONFIG.md` locked `id`. Used `id` throughout — matches nub-identity convention at `packages/nubs/identity/src/types.ts` (every IdentityGet*Message uses `id`). Tracked as a plan-level deviation from ARCHITECTURE.md below.
- **`unknown-section` error code omitted from the union.** The spec's Error Envelopes table lists `unknown-section` but the spec text explicitly says it is non-normative and shells MUST NOT surface it as a wire error. With no wire message carrying the code, there is no place for it in the union. Keeping the union tight at 8 literals.
- **`NappletConfigSchemaExtensions` declares 3 keys, not 5.** Per plan's Specific Ideas snippet — the 3 x-napplet-* keys napplet authors will most often declare. The 2 additional standardized extensions the spec mentions (`deprecationMessage`, `markdownDescription`) are standard JSON Schema / VS Code annotations and don't need their own potentiality type.
- **Dual-use `config.values` modeled with optional `id`.** `id?: string` with JSDoc explaining: present → correlated response to `config.get`; absent → subscription push. Avoids splitting into two separate interfaces and keeps the wire contract crisp.
- **`config.registerSchema.result` positive-ACK shape enforced in types.** `ok: boolean` required, `code?: ConfigSchemaErrorCode` and `error?: string` optional — matches spec text "every call receives a `config.registerSchema.result` with `ok: true`, or `ok: false` accompanied by `code` and `error`... it is never error-only."
- **DOMAIN relocated to types.ts.** Matches identity NUB convention exactly. Barrel pattern is `export { DOMAIN } from './types.js'` — the single value export in an otherwise types-only barrel.
- **No shim/sdk/registerNub references anywhere.** Plan non-goals honored literally. The package is fully side-effect-free (matches `"sideEffects": false` in package.json). Phase 113 adds shim.ts + sdk.ts; phase 115 adds the core `registerNub(DOMAIN, ...)` call at integration time.

## Deviations from Plan

### Auto-fixed Issues

None — no Rule 1/2/3 auto-fixes triggered. The plan's `<interfaces>` block was comprehensive enough that every wire shape, type alias, and union was spec'd out; implementation was transcription with JSDoc fleshing.

### Spec-driven departure from research notes (already noted in plan)

**1. Correlation field is `id`, not `requestId`**
- **Source of truth:** `/home/sandwich/Develop/nubs/NUB-CONFIG.md` Wire Protocol table + Key design notes ("All correlation uses `id`.")
- **Superseded:** `.planning/research/ARCHITECTURE.md` Wire Message Definitions section, which floated `requestId`
- **Why:** The merged spec locked `id` to match nub-identity convention. This was called out in the plan's `<interfaces>` block — implementation followed plan, not research.

Plan executed exactly as written. All success criteria met on first pass; verify blocks for Task 1 and Task 2 passed verbatim; full monorepo type-check clean (no upstream breakage).

## Issues Encountered

None. `tsup`'s `clean: true` handled stale dist from plan 01's stub without intervention. `pnpm type-check` finished in 619ms (21 cache hits, 1 new build for nub-config).

## Authentication Gates

None — pure local type-code work. No external services, no credentials.

## Next Plan Readiness

- **Phase 113 (NUB Config Shim + SDK) unblocked.** Package types surface is locked; shim.ts can `import { handleConfigMessage, installConfigShim }` against a stable type API, and sdk.ts can wrap `window.napplet.config.*` with the typed payloads defined here.
- **Phase 114 (Vite-Plugin Extension) unblocked for the type side.** `@napplet/vite-plugin` will `import type { NappletConfigSchema } from '@napplet/nub-config'` and use it as the type for the new `configSchema` option.
- **Phase 115 (Core / Shim / SDK Integration + Wire) unblocked for the dispatch side.** Once phase 113's shim.ts lands, phase 115 adds `'config'` to the `NubDomain` union in `packages/core/src/envelope.ts` and routes `config.*` envelopes via the imported `handleConfigMessage`.
- **Phase 116 (Documentation) unblocked for the API surface section.** The final API shape is now visible in `dist/index.d.ts`; doc writers can inspect it directly.

### Handoff Note for Phase 113

> Package types surface is locked. Phase 113 adds `shim.ts` (installConfigShim + handleConfigMessage + ref-counted subscribers + manifest meta-tag schema read from `<meta name="napplet-config-schema">`) and `sdk.ts` (named convenience wrappers — `get()`, `subscribe(cb)`, `openSettings({ section? })`, `registerSchema(schema, version?)`, `onSchemaError(cb)`). Phase 115 registers `'config'` in core `NubDomain`, mounts `window.napplet.config` at install time in the shim, and wires the dispatcher branch.

## Self-Check: PASSED

All claims verified against disk and git log:

- `packages/nubs/config/src/types.ts` — FOUND (321 LOC, matches required min_lines: 200)
- `packages/nubs/config/src/index.ts` — FOUND (57 LOC, full barrel)
- `packages/nubs/config/dist/index.d.ts` — FOUND (9.68 KB, 16 declarations)
- `packages/nubs/config/dist/index.js` — FOUND (93 B, DOMAIN-only runtime)
- Commit `1c23853` (Task 1 — feat) — FOUND in git log
- Commit `149c735` (Task 2 — feat) — FOUND in git log
- `pnpm --filter @napplet/nub-config build` — exit 0 (verified via tsup output, dist files emitted)
- `pnpm --filter @napplet/nub-config type-check` — exit 0 (verified via tsc --noEmit)
- `pnpm type-check` (full monorepo) — exit 0, 22/22 turbo tasks successful
- Zero `requestId` in types.ts, index.ts, OR dist/index.d.ts (confirmed via grep)
- Zero `shim.js`, `sdk.js`, `registerNub`, `window.napplet` references in barrel
- All 15 type symbols + DOMAIN confirmed exported in `dist/index.d.ts`

---
*Phase: 112-nub-config-package-scaffold*
*Completed: 2026-04-17*
