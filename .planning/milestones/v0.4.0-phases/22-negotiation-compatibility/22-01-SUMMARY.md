---
phase: 22-negotiation-compatibility
plan: "01"
subsystem: vite-plugin
tags: [manifest, requires, vite-plugin, nip5a]
provides:
  - Nip5aManifestOptions.requires field
  - napplet-requires meta tag injection in transformIndexHtml
  - ["requires","service-name"] tags in kind 35128 manifest event
affects:
  - packages/vite-plugin/src/index.ts
tech-stack:
  patterns:
    - Optional field with backward-compat default (requires ?? [])
key-files:
  modified:
    - packages/vite-plugin/src/index.ts
key-decisions:
  - "No requiresTags when requires is empty/omitted — zero backward-compat impact"
  - "Log line added to report requires at build time for developer visibility"
requirements-completed:
  - COMPAT-01
duration: "1 min"
completed: "2026-03-31"
---

# Phase 22 Plan 01: Vite plugin requires injection — Summary

Added `requires?: string[]` to `Nip5aManifestOptions` and implemented two injection points: `transformIndexHtml` injects a `<meta name="napplet-requires" content="audio,notifications">` tag for dev-mode reading, and `closeBundle` appends `["requires", "service-name"]` tags to the kind 35128 NIP-5A manifest event alongside existing `d` and `x` tags.

**Duration:** 1 min | **Tasks:** 4 | **Files:** 1

## Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | Add requires field to Nip5aManifestOptions | f3e3bf0 | Done |
| 2 | Inject napplet-requires meta tag in transformIndexHtml | f3e3bf0 | Done |
| 3 | Inject requires tags into manifest event in closeBundle | f3e3bf0 | Done |
| 4 | Build and type-check vite-plugin | f3e3bf0 | Done |

## Verification

- `grep "requires?: string" packages/vite-plugin/src/index.ts` — PASS
- `grep "napplet-requires" packages/vite-plugin/src/index.ts` — PASS
- `grep "requiresTags" packages/vite-plugin/src/index.ts` — PASS
- `pnpm --filter @napplet/vite-plugin build` — PASS (exits 0)

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Self-Check: PASSED
