---
status: passed
phase: 115-core-shim-sdk-integration
score: 11/11
date: 2026-04-17
method: manual (orchestrator — acceptance greps + full monorepo build + type-check)
---

# Phase 115 Verification — Core / Shim / SDK Integration + Wire

## Phase Goal
`'config'` is a first-class NUB domain throughout the monorepo — registered in core, routed by shim, re-exported by SDK, probeable via `shell.supports()` — and the full wire surface round-trips cleanly.

## Must-Haves — 11/11 Passed

| REQ | Verified |
|-----|----------|
| CORE-01 | ✓ `'config'` in NubDomain union + NUB_DOMAINS array (2 occurrences in envelope.ts) |
| CORE-02 | ✓ `config` namespace in NappletGlobal (packages/core/src/types.ts) with inline structural types |
| SHIM-01 | ✓ `@napplet/nub-config` workspace dep in shim/package.json; `installConfigShim` imported + mounted in shim/src/index.ts |
| SDK-01 | ✓ `@napplet/nub-config` workspace dep in sdk/package.json; config namespace re-exported + CONFIG_DOMAIN + installConfigShim |
| CAP-01 | ✓ `shell.supports('config')` + `shell.supports('nub:config')` resolve via NamespacedCapability template literal (verified by executor's standalone type test) |
| WIRE-01..06 | ✓ All 6 wire messages round-trip — shim routes `config.*` to handleConfigMessage; full monorepo type-check green across 13 packages |

## Negative Check
- ✓ `@napplet/nub-config` NOT imported in `packages/core/src/*.ts` — core stays decoupled

## Build/Type-Check Gate
- `pnpm type-check` (full monorepo, 13 packages) → FULL TURBO cache, all green
- Executor-run `pnpm build` → 13/13 packages build clean

## File State
- `packages/core/src/envelope.ts`, `packages/core/src/types.ts` — `'config'` integrated
- `packages/shim/package.json`, `packages/shim/src/index.ts` — mounted + routed
- `packages/sdk/package.json`, `packages/sdk/src/index.ts` — namespace + types re-exported
- `pnpm-lock.yaml` — workspace links refreshed

**Status: passed** — Phase 115 goal achieved. Proceed to Phase 116 (Documentation — final phase of v0.25.0).
