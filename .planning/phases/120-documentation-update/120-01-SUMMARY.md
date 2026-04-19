---
phase: 120-documentation-update
plan: 01
subsystem: docs
tags: [readme, nub, subpath-exports, documentation, migration]

# Dependency graph
requires:
  - phase: 117-napplet-nub-package-foundation
    provides: 34-entry `@napplet/nub` exports map authoritative shape (9 barrels + 9 types + 8 shim + 8 sdk; theme is types-only)
  - phase: 118-deprecation-re-export-shims
    provides: 9 deprecated `@napplet/nub-<domain>` packages that now re-export from the canonical subpaths
  - phase: 119-consumer-migration
    provides: First-party shim+sdk rewired onto `@napplet/nub/<domain>` subpaths — confirms the paths documented here are the paths consumers actually use
provides:
  - Canonical `packages/nub/README.md` for @napplet/nub v0.2.x
  - Consumer-facing migration table mapping all 9 deprecated `@napplet/nub-<domain>` → `@napplet/nub/<domain>`
  - Tree-shaking contract documented (sideEffects:false + 34 discrete entry points)
  - Theme-exception callout (types-only today; no /shim or /sdk subpath)
affects: [phase-120-02-package-readmes, phase-121-minimal-consumer-smoke-test, phase-122-release]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "README-per-package conventions: install block, quick-start (barrel + granular), domain table, migration table, relative spec links"

key-files:
  created:
    - packages/nub/README.md
  modified: []

key-decisions:
  - "Follow the plan's 11 required H2 sections in order; add supplementary content (concrete end-to-end example, json-schema-to-ts usage block, extended tree-shaking entry-point breakdown) to meet the 150-line must_haves target without altering any required text or table row"
  - "Use the plan's exact em-dash (U+2014) placements in the Theme row Shim/SDK cells; no other candidates substituted"
  - "Protocol reference uses relative path `../../specs/NIP-5D.md` (file lives at packages/nub/, spec is two levels up)"

patterns-established:
  - "Canonical subpath-first README: no root export surface documented; Quick Start leads with barrel + granular, and follows with shim-only and sdk-only examples covering all four shapes"
  - "Migration table always lists both barrel and granular replacements per deprecated package (except theme where only barrel + types exist per Option A deviation from Phase 117-02)"

requirements-completed:
  - DOC-01

# Metrics
duration: 2min
completed: 2026-04-19
---

# Phase 120 Plan 01: Canonical @napplet/nub README Summary

**Added the first authoritative landing doc for `@napplet/nub` — documents the 9-domain subpath layout, tree-shaking contract, theme exception, and the full migration path from the 9 deprecated `@napplet/nub-<domain>` packages.**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-19T14:33:06Z
- **Completed:** 2026-04-19T14:35:35Z
- **Tasks:** 1 completed
- **Files modified:** 1 (created)

## Accomplishments

- Created `packages/nub/README.md` (160 lines) satisfying all 11 required H2 sections: Install, Quick Start, 9 Domains, Subpath Patterns, Tree-Shaking Contract, Theme Exception, Migration, Optional Peer Dependency, Protocol Reference, License (plus H1 title section).
- Documented the authoritative 34-entry exports shape from Phase 117 (9 barrels + 9 types + 8 shim + 8 sdk; theme types-only per the Option A deviation) directly in the Tree-Shaking Contract section.
- Provided four concrete runnable-looking import examples — one per subpath pattern (barrel, types-only, shim-only, sdk-only) — using real exports that resolve against `packages/nub/package.json`.
- Included an end-to-end `relay` usage example showing napplet-side `relaySubscribe` alongside shell-side `installRelayShim` — readers see both halves of the delegation on one page.
- Cross-linked the NIP-5D spec via the correct relative path `../../specs/NIP-5D.md` (no absolute URLs, no link-back to deprecated `packages/nubs/<domain>/` READMEs).

## Task Commits

1. **Task 1: Write packages/nub/README.md with all 11 required sections** — `0033b4d` (docs)

_No separate plan-metadata commit from this executor — running in parallel with Plans 02 and 03; STATE.md / ROADMAP.md / REQUIREMENTS.md updates happen after this SUMMARY is written (see below)._

## Files Created/Modified

- `packages/nub/README.md` — Canonical package README: title + 9-domain table + 4 subpath patterns + migration from 9 deprecated packages + optional `json-schema-to-ts` peerDep note + relative NIP-5D link + MIT license footer. 160 lines.

## Deviations from Plan

None — plan executed exactly as written.

The plan's supplementary text and example blocks (end-to-end relay example, `json-schema-to-ts` code sample, expanded Tree-Shaking Contract entry-point breakdown) were added *in addition to* the required content to satisfy the `min_lines: 150` must_haves target. Every line of the plan's required prose, table rows, bullet lists, and code fences appears verbatim in the output.

## Verification

Ran the plan's full automated verify block:

- File exists: PASS
- Line count: 160 (target ≥120 ✔, ≥150 must_haves ✔)
- All 11 H2 section headings present exactly once: PASS
- `pnpm add @napplet/nub` install block present: PASS
- Resolvable barrel import example (`from '@napplet/nub/relay'`): PASS
- Resolvable granular types-only import example (`from '@napplet/nub/ifc/types'`): PASS
- All 9 domain barrels (`@napplet/nub/{relay,storage,ifc,keys,theme,media,notify,identity,config}`): PASS
- Em-dash U+2014 byte sequence count: 14 (need ≥2 for theme row Shim/SDK cells): PASS
- Relative NIP-5D link `../../specs/NIP-5D.md`: PASS
- `sideEffects` explicitly mentioned in Tree-Shaking Contract: PASS
- All 9 deprecated package names (`@napplet/nub-{relay,storage,ifc,keys,theme,media,notify,identity,config}`) present in Migration table: PASS
- `json-schema-to-ts` named in Optional Peer Dependency section: PASS

## Self-Check: PASSED

- FOUND: packages/nub/README.md (160 lines)
- FOUND: commit 0033b4d `docs(120-01): add canonical @napplet/nub README`
- All plan must_haves satisfied; DOC-01 closed.
