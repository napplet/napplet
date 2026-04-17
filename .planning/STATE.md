---
gsd_state_version: 1.0
milestone: v0.25.0
milestone_name: Config NUB
status: executing
stopped_at: Completed 111-02 -- Schema Contract section added to NUB-CONFIG.md on nub-config branch (commit 4a480d7); ready for 111-03 guarantees-and-antifeatures
last_updated: "2026-04-17T10:50:18.836Z"
last_activity: 2026-04-17
progress:
  total_phases: 6
  completed_phases: 0
  total_plans: 4
  completed_plans: 2
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-17)

**Core value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol -- and ship the spec + SDK so others can build on it.
**Current focus:** Phase 111 — NUB-CONFIG Spec

## Current Position

Phase: 111 (NUB-CONFIG Spec) — EXECUTING
Plan: 3 of 4
Status: Ready to execute
Last activity: 2026-04-17

Progress: [░░░░░░░░░░] 0% (0/6 phases complete)

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

- Total plans completed: 0
- Average duration: --
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

## Accumulated Context

| Phase 111 P01 | 4min | 2 tasks | 1 files |
| Phase 111 P02 | 2 min | 1 tasks | 1 files |

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

### Blockers/Concerns

- CARRIED: npm publish blocked on human npm auth (PUB-04).
- CARRIED: NIP number conflict with Scrolls PR#2281 (RES-01) -- unresolved.

## Session Continuity

Last session: 2026-04-17T10:50:18.833Z
Stopped at: Completed 111-02 -- Schema Contract section added to NUB-CONFIG.md on nub-config branch (commit 4a480d7); ready for 111-03 guarantees-and-antifeatures
Resume: `/gsd:plan-phase 111`
