---
gsd_state_version: 1.0
milestone: v0.25.0
milestone_name: Config NUB
status: completed
stopped_at: Completed 113-01-PLAN.md — @napplet/nub-config shim.ts landed (371 LOC); type-check green. Plan 113-02 (barrel + SDK) ready.
last_updated: "2026-04-17T11:40:53.192Z"
last_activity: 2026-04-17
progress:
  total_phases: 6
  completed_phases: 2
  total_plans: 8
  completed_plans: 7
  percent: 88
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-17)

**Core value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol -- and ship the spec + SDK so others can build on it.
**Current focus:** Phase 112 — NUB Config Package Scaffold

## Current Position

Phase: 113
Plan: 2 of 2
Status: Phase 113 Plan 01 complete — @napplet/nub-config src/shim.ts landed (371 LOC: installConfigShim + handleConfigMessage + manifest-meta schema read + ref-counted subscribers + correlation-id Maps + onSchemaError fan-out). Type-check green. Plan 113-02 (barrel expansion + SDK wrappers) ready.
Last activity: 2026-04-17

Progress: [█████████░] 88% (2/6 phases complete, 7/8 plans complete)

**Phase execution order:** 111 → 112 → 113 → 114 (can parallel 113) → 115 → 116

| # | Phase | Scope |
|---|-------|-------|
| 111 | NUB-CONFIG Spec | Public napplet/nubs#13 draft — SPEC-01..08 |
| 112 | NUB Config Package Scaffold | Types + tsup/tsconfig/package.json + barrel — NUB-01, NUB-02, NUB-05, NUB-06 |
| 113 | NUB Config Shim + SDK | Installer + ref-counted subscribers + SDK wrappers — NUB-03, NUB-04 |
| 114 | Vite-Plugin Extension | configSchema option, manifest tag, aggregateHash, meta injection, build guards — VITE-01..07 |
| 115 | Core / Shim / SDK Integration + Wire | NubDomain, NappletGlobal, routing, SDK re-exports, capability probing — WIRE-01..06, CORE-01..02, SHIM-01, SDK-01, CAP-01 |
| 116 | Documentation | nub-config README + NIP-5D Known NUBs + 4 package READMEs — DOC-01..06 |

## Performance Metrics

**Velocity:**

- Total plans completed: 6 (Phase 111: 4, Phase 112: 2)
- Average duration: ~3 min
- Total execution time: ~16.5 min

**By Phase:**

| Phase | Plans | Total   | Avg/Plan |
|-------|-------|---------|----------|
| 111   | 4     | 12min   | 3min     |
| 112   | 2/2   | 4.5min  | 2.25min  |
| Phase 113 P01 | 10min | 1 tasks | 1 files |

## Accumulated Context

| Phase 111 P01 | 4min   | 2 tasks | 1 files |
| Phase 111 P02 | 2 min  | 1 tasks | 1 files |
| Phase 111 P03 | 3min   | 2 tasks | 1 files |
| Phase 111 P04 | 3min   | 4 tasks | 2 files |
| Phase 112 P01 | 2min   | 2 tasks | 4 files |
| Phase 112 P02 | 2m29s  | 2 tasks | 2 files |

### Decisions

- v0.25.0: NUB-CONFIG is per-napplet schema-driven config (inverts the dropped v0.19.0 shell:config-* topics)
- v0.25.0: Schema format = JSON Schema (draft-07+)
- v0.25.0: Storage is separate from NUB-STORAGE at the spec surface; shells MAY back with NUB-STORAGE internally
- v0.25.0: Shell is sole writer; napplet reads/subscribes/requests-settings-open only
- v0.25.0: Value access pattern = subscribe-live (initial snapshot + push updates)
- v0.25.0: Schema declaration = manifest (authoritative, via vite-plugin) + runtime config.registerSchema (escape hatch)
- v0.25.0: `$version` field in schema is a potentiality; migration is shell-resolved
- v0.25.0: Standardized JSON Schema extensions as potentialities: `x-napplet-secret`, `x-napplet-section`, `x-napplet-order`
- v0.25.0: MUST-level guarantees: values validate, defaults apply, storage scoped by (dTag, aggregateHash), shell is sole writer
- v0.25.0: UI surface = shell-chrome owns; napplet may call `config.openSettings({ section? })` to deep-link
- v0.25.0: Phase 111 is drafted in the PUBLIC napplet/nubs repo — no `@napplet/*` references allowed in spec
- v0.25.0: Phases 112-116 are in this (private) repo, matching the v0.22/v0.23/v0.24 spec-first-then-SDK pattern exactly
- PRINCIPLE: NUBs define protocol surface + potentialities; implementation UX is a shell concern
- [Phase 111]: 111-01: Scaffolded NUB-CONFIG.md on public nubs repo nub-config branch — header, API surface (NappletConfig + ConfigSchema/ConfigValues/ConfigSchemaError/Subscription), wire protocol table (9 message types), 8 envelope examples. Zero @napplet/ refs. Single scaffold commit 29baaac.
- [Phase 111]: 111-02: Locked NUB-CONFIG Core Subset -- types/keywords/constraints, additionalProperties:false override, deterministic default-resolution rule, x-napplet-* extensions table, $version potentiality, pattern excluded citing CVE-2025-69873, $ref forbidden in all forms, depth limit 4, secret-with-default prohibition.
- [Phase 111]: Lowercased napplet-rendered/napplet-supplied in Anti-Features to match plan verification greps; prose reads naturally either way
- [Phase 111]: Retained unknown-section as non-normative error-code row; shells SHOULD silently ignore per Shell Guarantees, but code reserved for future telemetry paths
- [Phase 111]: PR number confirmed as #13 — matches roadmap sequential reservation (NUB-MEDIA #10, NUB-NOTIFY #11, NUB-IDENTITY #12). No README link amendment required.
- [Phase 111]: Human-gated push + PR pattern upheld: agent stopped at Task 3, presented verbatim instructions, awaited resume signal. Agent never autonomously ran git push or gh pr create.
- [Phase 112]: 112-01: Scaffolded `@napplet/nub-config` package (13th monorepo package, 9th NUB) mirroring `@napplet/nub-identity` template exactly — package.json + tsconfig.json + tsup.config.ts + stub src/index.ts. Declares `@napplet/core` as only runtime dep, `@types/json-schema@^7.0.15` as devDep, `json-schema-to-ts@^3.1.1` as optional peerDep (flagged `peerDependenciesMeta.optional: true`). Build + type-check green. Commits d2ea20a (chore) + cba9fdf (feat).
- [Phase 112]: `json-schema-to-ts` declared as optional peerDependency (not devDep) so authors who don't want `FromSchema<typeof schema>` inference skip the ~1.5MB transitive install; consumers omitting it get no pnpm warnings thanks to the `optional: true` meta flag.
- [Phase 112]: `DOMAIN = 'config' as const` temporarily lives in `src/index.ts` rather than `src/types.ts` — plan 02 moves it to types.ts alongside the full 6-message type surface to match the identity NUB pattern (`packages/nubs/identity/src/types.ts` line 19 convention).
- [Phase 112]: 112-02: Landed full @napplet/nub-config src/types.ts (321 LOC, 8 wire-message interfaces + 3 discriminated unions + ConfigSchemaErrorCode 8-literal union + NappletConfigSchemaExtensions potentiality + DOMAIN relocated to types.ts per identity convention) + full barrel (15 type symbols + DOMAIN). Build + type-check green, full monorepo type-check green (22/22). Commits 1c23853 (feat) + 149c735 (feat).
- [Phase 112]: 112-02: Followed merged NUB-CONFIG.md spec over ARCHITECTURE.md research draft — correlation field is `id` (not `requestId`). Research floated requestId; merged spec locked id to match nub-identity convention across NUBs.
- [Phase 112]: 112-02: ConfigSchemaErrorCode union omits `unknown-section` (8 literals, not 9). Spec explicitly marks unknown-section as non-normative and says shells MUST NOT surface it as a wire error, so no place in TS union.
- [Phase 113]: 113-01: Shipped packages/nubs/config/src/shim.ts (371 LOC). installConfigShim() idempotent; reads <meta name='napplet-config-schema'> synchronously at install; mounts window.napplet.config with registerSchema/get/subscribe/openSettings/onSchemaError + readonly schema accessor (defineProperty configurable:false). handleConfigMessage() routes config.registerSchema.result / config.values (dual-use) / config.schemaError. Ref-counted subscriber Set (wire subscribe on 0->1, unsubscribe on 1->0). Correlation-ID Maps for get + registerSchema (30s timeout). Late subscribers receive cached lastValues via queueMicrotask. Commit 5b8b96a. Type-check green.
- [Phase 113]: 113-01: registerSchema typed Promise<void> (not void) — plan must-haves override the spec's API sketch; positive-ACK wire behavior is spec-consistent. onSchemaError returns plain () => void teardown (not Subscription) — followed plan action step 8 explicit instruction. These two divergences flagged for harmonization in 113-02 SDK wrappers or phase 115 integration.
- [Phase 113]: 113-01: Pattern established — ref-counted wire subscription (local Set<cb>; emit wire subscribe on 0->1; unsubscribe on 1->0) + dual-use message router branch (lookupPending via id presence, else fan-out) + last-snapshot cache for late-subscriber microtask delivery. Template for future push-stream NUBs.

### Blockers/Concerns

- CARRIED: npm publish blocked on human npm auth (PUB-04).
- CARRIED: NIP number conflict with Scrolls PR#2281 (RES-01) -- unresolved.

## Session Continuity

Last session: 2026-04-17T11:40:36.450Z
Stopped at: Completed 113-01-PLAN.md — @napplet/nub-config shim.ts landed (371 LOC); type-check green. Plan 113-02 (barrel + SDK) ready.
Resume: `/gsd:execute-phase 113` (NUB Config Shim + SDK — phase 112 complete)
