---
phase: 120-documentation-update
plan: 02
subsystem: docs
tags: [readme, nub-consolidation, @napplet/nub, documentation-migration]

# Dependency graph
requires:
  - phase: 117-nub-package-foundation
    provides: "Canonical @napplet/nub package with 34 subpath exports"
  - phase: 118-deprecation-shims
    provides: "Deprecated @napplet/nub-<domain> packages as 1-line re-export shims"
  - phase: 119-consumer-migration
    provides: "Shim + SDK source/manifest/lockfile migrated to @napplet/nub/<domain> subpaths"
provides:
  - "Root README.md references single @napplet/nub package (5-box dep graph, no defunct signer refs)"
  - "packages/core/README.md integration note uses @napplet/nub/<domain> subpaths"
  - "packages/shim/README.md Shim-vs-SDK deps row collapsed to single @napplet/nub entry"
  - "packages/sdk/README.md peerDep note + 8-row type-to-package table use @napplet/nub/<domain> barrels"
affects: [121-any-future-docs-phase, downstream-consumers-reading-github-landing-page]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Bare @napplet/nub in prose for the package itself"
    - "@napplet/nub/<domain> for barrel subpath references"
    - "@napplet/nub/<domain>/<layer> for granular (types/shim/sdk) subpath references"

key-files:
  created: []
  modified:
    - "README.md"
    - "packages/core/README.md"
    - "packages/shim/README.md"
    - "packages/sdk/README.md"

key-decisions:
  - "Root README package table: 5 per-nub rows collapsed to 1 @napplet/nub row; defunct signer row removed"
  - "Root README dep graph: 10-box shape replaced with 5-box post-consolidation topology (shim+sdk → nub → core, vite-plugin leaf)"
  - "Core README integration note calls out theme's types-only status explicitly (no registerNub side effect)"
  - "Shim README deps row notes that granular /shim subpaths are used internally, but user-facing dep is just @napplet/nub"
  - "SDK README keeps 'NUB Package' column header unchanged (values are still of the @napplet/nub package; subpath form is obvious from the cell contents)"

patterns-established:
  - "Documentation migration pattern: user-facing READMEs show bare @napplet/nub and @napplet/nub/<domain>; granular /shim and /sdk subpaths only surface as internal implementation detail"

requirements-completed: [DOC-02]

# Metrics
duration: 2min
completed: 2026-04-19
---

# Phase 120 Plan 02: README Migration Summary

**Four user-facing READMEs (root + core + shim + sdk) migrated off the deprecated `@napplet/nub-<domain>` names to the consolidated `@napplet/nub` package and its subpath surface, with the defunct `@napplet/nub-signer` references cleaned up in the process.**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-19T14:33:12Z
- **Completed:** 2026-04-19T14:35:06Z
- **Tasks:** 4
- **Files modified:** 4

## Accomplishments

- Root README package table now has a single `[@napplet/nub](packages/nub)` row (down from 5 per-nub rows) and links to `packages/nub/README.md` for the per-domain detail.
- Root README dep graph shrunk from the old 10-box `core + 9 nubs` shape to the post-consolidation 5-box shape: `@napplet/shim + @napplet/sdk → @napplet/nub → @napplet/core`, with `@napplet/vite-plugin` as an independent build-time leaf.
- All references to the DEFUNCT `@napplet/nub-signer` (removed in v0.24.0) have been purged from the root README.
- `packages/core/README.md` integration note now enumerates `@napplet/nub/<domain>` subpaths for the 8 domains that call `registerNub`, with a parenthetical noting that `@napplet/nub/theme` is types-only and skips `registerNub`.
- `packages/shim/README.md` Shim-vs-SDK comparison table's Dependencies row collapsed to a single `@napplet/nub` entry (with a note that `/shim` subpaths are used internally).
- `packages/sdk/README.md` `FromSchema` peerDep note now cites `@napplet/nub` (scoped to the `@napplet/nub/config` domain), and all 8 rows of the NUB-message-type-to-package mapping table use `@napplet/nub/<domain>` barrel subpaths.
- Cross-file invariant holds: `grep -c "@napplet/nub-" README.md packages/core/README.md packages/shim/README.md packages/sdk/README.md` returns `0` across all four files.

## Task Commits

Each task was committed atomically (all with `--no-verify` per parallel-executor protocol):

1. **Task 1: Update root README.md (table + dep graph + remove defunct signer refs)** — `d29b9f2` (docs)
2. **Task 2: Update packages/core/README.md line 353 integration note** — `80366cb` (docs)
3. **Task 3: Update packages/shim/README.md line 426 dep-comparison row** — `6039111` (docs)
4. **Task 4: Update packages/sdk/README.md peerDep note + type-to-package table** — `24a0289` (docs)

**Plan metadata:** (final commit written after STATE.md + ROADMAP.md updates below)

## Files Created/Modified

- `README.md` — package table row collapsed + dep graph redrawn + defunct signer refs removed
- `packages/core/README.md` — integration note (line 353) rewritten to reference `@napplet/nub/<domain>` subpaths with theme-types-only parenthetical
- `packages/shim/README.md` — Shim-vs-SDK table dependencies row (line 426) collapsed to single `@napplet/nub` entry
- `packages/sdk/README.md` — peerDep note (line 178) rewritten + 8 type-to-package table rows (lines 296-303) migrated to barrel subpaths

## Decisions Made

- **Keep the root README's "Napplet-Side Communication" diagram unchanged.** It references `relay/signer/storage` NUB dispatch at an architectural level (not a package-level reference), and the plan scope explicitly fenced it off. The `signer` here is conceptual/historical prose about dispatch, not a package name. Post-audit: grep confirms zero `@napplet/nub-` matches remain regardless — the diagram is safe.
- **Shim README granular-subpath wording.** Plan-text suggested `@napplet/nub/<domain>/shim` inside backticks in the deps row; kept that exact form since it makes the user-facing dep (`@napplet/nub`) distinct from the internal routing detail (`/shim` layer).
- **SDK table header unchanged.** Plan gave discretion to rename "NUB Package" to "Subpath"/"Source Subpath"; kept "NUB Package" because every value in the column is a subpath of the same `@napplet/nub` package, and the header disambiguation is unnecessary with the new values.

## Deviations from Plan

None — plan executed exactly as written.

All four tasks landed their edits on the first attempt, and every task's verification script passed on the first run. Cross-file invariant (`grep -c "@napplet/nub-"` across all 4 files → 0) holds. No auto-fix rules triggered.

## Issues Encountered

None. The parallel-executor scope boundary (stay out of `packages/nub/README.md`, which Wave 1 Plan 3's companion agent owns) was respected; all four files modified here are distinct from the companion agent's scope.

## User Setup Required

None.

## Next Phase Readiness

- DOC-02 satisfied end-to-end: every user-facing README referencing NUB paths now uses the consolidated `@napplet/nub` surface.
- Root README is publish-ready — anyone landing on the GitHub repo sees the post-consolidation package layout with no stale nor defunct package names.
- Phase 120 Plan 01 (the companion wave-1 agent writing `packages/nub/README.md`) and this plan together complete the user-facing doc migration. Remaining phase work (Plans 03+ if any for specs/skills) is orthogonal and already preflight-verified to have 0 matches.
- No blockers. No open questions. Ready for `/gsd:verify-work 120` once all Phase 120 plans are shipped.

## Self-Check: PASSED

Verified all artifacts exist on disk:

- `README.md` (FOUND; 0 `@napplet/nub-` matches; contains `[@napplet/nub](packages/nub)` + 5-box dep graph)
- `packages/core/README.md` (FOUND; 0 `@napplet/nub-` matches; contains 8 `@napplet/nub/<domain>` refs + theme-exception parenthetical)
- `packages/shim/README.md` (FOUND; 0 `@napplet/nub-` matches; contains single `@napplet/nub` deps entry + `/shim` subpath note)
- `packages/sdk/README.md` (FOUND; 0 `@napplet/nub-` matches; contains peerDep note of `@napplet/nub` + 8 barrel-subpath table rows)

Verified all task commits exist in git log:

- `d29b9f2` (FOUND) — Task 1 root README
- `80366cb` (FOUND) — Task 2 core README
- `6039111` (FOUND) — Task 3 shim README
- `24a0289` (FOUND) — Task 4 sdk README

---
*Phase: 120-documentation-update*
*Completed: 2026-04-19*
