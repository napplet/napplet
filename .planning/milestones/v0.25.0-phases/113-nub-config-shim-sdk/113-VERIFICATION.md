---
status: passed
phase: 113-nub-config-shim-sdk
score: 12/12
date: 2026-04-17
method: manual (verifier agent rate-limited; orchestrator ran grep + build/type-check gates)
---

# Phase 113 Verification — NUB Config Shim + SDK

## Phase Goal
The `@napplet/nub-config` package exports `shim.ts` (installer + message handlers + subscriber ref-counting + manifest-meta schema read) and `sdk.ts` (named convenience wrappers), completing the modular NUB pattern.

## Must-Haves — 12/12 Passed

1. ✓ `packages/nubs/config/src/shim.ts` exists (371 LOC)
2. ✓ `installConfigShim()` exported
3. ✓ `handleConfigMessage()` exported
4. ✓ Mounts `window.napplet.config` with full API (verified via plan 113-01 acceptance greps)
5. ✓ Reads `<meta name="napplet-config-schema">` synchronously (grep-confirmed)
6. ✓ Subscriber Set ref-counted (0→1 / 1→0 transitions — plan acceptance + SUMMARY)
7. ✓ Correlation-ID Map with 30s timeout (plan 113-01 SUMMARY)
8. ✓ `packages/nubs/config/src/sdk.ts` exists with exactly 5 named `export function`s (get, subscribe, openSettings, registerSchema, onSchemaError)
9. ✓ `requireNapplet` guard present in sdk.ts
10. ✓ Barrel `src/index.ts` re-exports shim + SDK + types + DOMAIN (plan 113-02 acceptance)
11. ✓ `pnpm --filter @napplet/nub-config build` → exit 0, produces dist/index.js (5.4 KB) + dist/index.d.ts (13.79 KB) + sourcemap
12. ✓ `pnpm --filter @napplet/nub-config type-check` → exit 0

## Negative Checks
- ✓ No `registerNub(` calls in `packages/nubs/config/src/` (phase 115 concern, correctly absent)

## Requirement Coverage
- NUB-03 (shim + subscriber mgmt + meta tag read) → plan 113-01
- NUB-04 (SDK wrappers) → plan 113-02

## Outstanding Observations
- Minor harmonization noted by executor: `onSchemaError` returns `() => void` (plan-locked) vs spec sketch `Subscription`. Either works; phase 115 can reconcile if integration friction surfaces.
- `registerSchema` typed `Promise<void>` aligns with the positive-ACK wire behavior; spec TS sketch had `void` signature but ACK semantics demand a Promise.

**Status: passed** — Phase 113 goal achieved. Proceed to Phase 114.
