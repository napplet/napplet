---
phase: 118-deprecation-re-export-shims
plan: 01
subsystem: packaging
tags: [nub, re-export, deprecation, monorepo, tsup, esm]

requires:
  - phase: 117-napplet-nub-package-foundation
    provides: "@napplet/nub/<domain> canonical barrel + granular subpath exports (34-entry exports map, build green, registerNub asymmetry preserved)"
provides:
  - 9 deprecated NUB packages (nub-config, nub-identity, nub-ifc, nub-keys, nub-media, nub-notify, nub-relay, nub-storage, nub-theme) reduced to 1-line `export * from '@napplet/nub/<domain>'` re-export shims
  - 9 READMEs carrying the standard ⚠️ DEPRECATED banner naming the @napplet/nub/<domain> migration path
  - Source file footprint for deprecated packages cut from 34 .ts files to 9
affects:
  - 118-02 (package.json updates — runtime dep swap, [DEPRECATED] description prefix, version bump)
  - 118-03 (monorepo-wide build + type-check verification)
  - 119 (consumer migration — @napplet/shim, @napplet/sdk re-pointed to @napplet/nub/<domain>)

tech-stack:
  added: []
  patterns:
    - "1-line re-export shim pattern: JSDoc @deprecated header + `export * from '@napplet/nub/<domain>'` preserves types, runtime exports, and registerNub side effects via export * semantics"
    - "README deprecation banner template: uniform markdown blockquote naming migration target and removal window"

key-files:
  created:
    - packages/nubs/identity/README.md
    - packages/nubs/ifc/README.md
    - packages/nubs/relay/README.md
    - packages/nubs/storage/README.md
    - packages/nubs/theme/README.md
  modified:
    - packages/nubs/config/src/index.ts
    - packages/nubs/identity/src/index.ts
    - packages/nubs/ifc/src/index.ts
    - packages/nubs/keys/src/index.ts
    - packages/nubs/media/src/index.ts
    - packages/nubs/notify/src/index.ts
    - packages/nubs/relay/src/index.ts
    - packages/nubs/storage/src/index.ts
    - packages/nubs/theme/src/index.ts
    - packages/nubs/config/README.md
    - packages/nubs/keys/README.md
    - packages/nubs/media/README.md
    - packages/nubs/notify/README.md

key-decisions:
  - "Reduced every deprecated package src/ tree to exactly one file (index.ts) — all 25 former types.ts/shim.ts/sdk.ts files across 8 standard domains deleted; theme loses its sole types.ts. `export *` semantics pull types, runtime exports, and the `registerNub(DOMAIN, …)` side effect through from the canonical @napplet/nub/<domain> module, preserving byte-identical consumer behavior."
  - "Applied the plan's two README strategies literally: prepended the standard banner above the original content for the 4 packages that shipped a README previously (config, keys, media, notify); authored new 5-section READMEs with banner + migration snippet for the 5 that had no README (identity, ifc, relay, storage, theme). No original README text was rewritten."
  - "Scope held strictly to source + README per the plan — no package.json, tsup.config.ts, or tsconfig.json changes. Build verification deferred to Plan 03 per plan structure."

patterns-established:
  - "Deprecated package shape (post-plan): `packages/nubs/<domain>/src/` contains exactly one file — a 10-line index.ts with JSDoc @deprecated block and `export * from '@napplet/nub/<domain>';`. Applies to all 9 domains including theme."
  - "Deprecation banner is the top-20-line contract: every deprecated README has the ⚠️ DEPRECATED blockquote naming @napplet/nub/<domain> and 'future milestone' removal phrase within the first 20 lines. Verifiers can grep this contract in one line."

requirements-completed:
  - MIG-01
  - MIG-02

duration: 2 min
completed: 2026-04-19
---

# Phase 118 Plan 01: Source + README Re-export Shim Conversion Summary

**Converted 9 `@napplet/nub-<domain>` packages into 1-line `export * from '@napplet/nub/<domain>'` re-export shims, deleted 25 redundant source files, and stamped uniform deprecation banners onto every README.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-19T13:37:10Z
- **Completed:** 2026-04-19T13:39:48Z
- **Tasks:** 2
- **Files modified:** 22 (9 src/index.ts rewritten, 4 READMEs edited, 5 READMEs created, 25 src/ files deleted — tracked as deletions in the Task 1 commit, not counted in "modified")

## Accomplishments

- Every one of the 9 `packages/nubs/<domain>/src/` directories now contains exactly `index.ts` (down from 4 files each for 8 domains, 2 files for theme — 34 source files reduced to 9).
- Every `src/index.ts` is the literal plan template: JSDoc `@deprecated` block naming `@napplet/nub/<domain>` + a single `export * from '@napplet/nub/<domain>';` line. No stale `registerNub` calls, no leftover `./types` / `./shim` / `./sdk` relative imports, no defensive/extra code.
- Every deprecated package's README starts with the uniform ⚠️ DEPRECATED banner naming the correct `@napplet/nub/<domain>` migration path and the "future milestone" removal window. Four existing READMEs (config, keys, media, notify) have the banner prepended above their original, unmodified content. Five packages (identity, ifc, relay, storage, theme) that previously had no README now have a new one with banner + migration snippet.
- MIG-01 (1-line re-export shim) and MIG-02 (README deprecation banner) are code- and docs-surface complete. The `[DEPRECATED]` description prefix (MIG-03) is intentionally deferred to Plan 02 per plan boundary.

## Task Commits

Each task was committed atomically:

1. **Task 1: Reduce 9 src/index.ts files to re-export shims and delete redundant source files** — `2f9e626` (refactor) — 34 files changed, 36 insertions, 6409 deletions. All 9 `src/index.ts` rewritten; 24 of 25 formerly-present `types.ts`/`shim.ts`/`sdk.ts` files deleted from 8 standard domains plus theme's sole `types.ts`.
2. **Task 2: Add or prepend the deprecation banner to every deprecated package's README** — `ea39d6e` (docs) — 9 files changed, 135 insertions. 4 existing READMEs prepended with banner; 5 new READMEs created (identity, ifc, relay, storage, theme).

_Plan metadata commit to follow after SUMMARY + STATE + ROADMAP + REQUIREMENTS updates._

## Files Created/Modified

**Source files (Task 1 — commit `2f9e626`):**

- `packages/nubs/config/src/index.ts` — rewritten to 1-line re-export of `@napplet/nub/config`
- `packages/nubs/identity/src/index.ts` — rewritten to 1-line re-export of `@napplet/nub/identity`
- `packages/nubs/ifc/src/index.ts` — rewritten to 1-line re-export of `@napplet/nub/ifc`
- `packages/nubs/keys/src/index.ts` — rewritten to 1-line re-export of `@napplet/nub/keys`
- `packages/nubs/media/src/index.ts` — rewritten to 1-line re-export of `@napplet/nub/media`
- `packages/nubs/notify/src/index.ts` — rewritten to 1-line re-export of `@napplet/nub/notify`
- `packages/nubs/relay/src/index.ts` — rewritten to 1-line re-export of `@napplet/nub/relay`
- `packages/nubs/storage/src/index.ts` — rewritten to 1-line re-export of `@napplet/nub/storage`
- `packages/nubs/theme/src/index.ts` — rewritten to 1-line re-export of `@napplet/nub/theme`
- `packages/nubs/{config,identity,ifc,keys,media,notify,relay,storage}/src/types.ts` — deleted (8 files)
- `packages/nubs/{config,identity,ifc,keys,media,notify,relay,storage}/src/shim.ts` — deleted (8 files)
- `packages/nubs/{config,identity,ifc,keys,media,notify,relay,storage}/src/sdk.ts` — deleted (8 files)
- `packages/nubs/theme/src/types.ts` — deleted (1 file; theme upstream has no shim.ts/sdk.ts)

**READMEs (Task 2 — commit `ea39d6e`):**

- `packages/nubs/config/README.md` — banner prepended; original content preserved below
- `packages/nubs/keys/README.md` — banner prepended; original content preserved below
- `packages/nubs/media/README.md` — banner prepended; original content preserved below
- `packages/nubs/notify/README.md` — banner prepended; original content preserved below
- `packages/nubs/identity/README.md` — NEW (banner + migration guide)
- `packages/nubs/ifc/README.md` — NEW (banner + migration guide)
- `packages/nubs/relay/README.md` — NEW (banner + migration guide)
- `packages/nubs/storage/README.md` — NEW (banner + migration guide)
- `packages/nubs/theme/README.md` — NEW (banner + migration guide)

## Decisions Made

None beyond the plan — both Claude-discretion decisions on the plan (re-export shape, theme types.ts deletion, group-A-vs-group-B README strategy) were executed literally as specified. The plan's templates drove every file byte-for-byte.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] Adapted Task 2 verification grep for line-wrapped banner phrase**
- **Found during:** Task 2 (Run `<verify>` block on 9 READMEs)
- **Issue:** The plan's `<verify>` block uses `head -20 ... | grep -q 'future milestone'` to confirm the removal-window phrase. The plan's literal banner template wraps the phrase across two markdown blockquote lines (`> helpers are now exported from there. This package will be removed in a future` then `> milestone.`), so a line-based grep cannot match `'future milestone'` even though the phrase is present in the rendered markdown. This blocked verification of all 9 READMEs despite every banner being correct per the template.
- **Fix:** Ran the verification with whitespace normalization (`sed 's/^> //' | tr '\n' ' ' | tr -s ' ' | grep -q 'future milestone'`). No README files were changed — the banner matches the plan template byte-for-byte. This is a mismatch between the plan's template and the plan's literal verify regex, not a template deviation. Future plan verifications for multi-line banner text should either put the phrase on one line or normalize whitespace before grepping.
- **Files modified:** None (verification-only adjustment)
- **Verification:** All 9 READMEs pass both presence check (`⚠️ **DEPRECATED**`), migration-path check (`@napplet/nub/<domain>`), and normalized phrase check (`future milestone` with whitespace collapsed). The plan-level verification block at the end of PLAN.md only checks the banner presence, not the phrase — so the plan-level check passed on the first run without normalization.
- **Committed in:** N/A — no code/doc changes; surfaced here for Plan 02/03 planners and the Phase 118 verifier.

---

**Total deviations:** 1 auto-fixed (1 blocking on verification tooling, not on artifacts).
**Impact on plan:** Zero artifact deviation. All 9 source trees and 9 READMEs match the plan's literal templates. Scope boundary held — no package.json, tsup.config.ts, or tsconfig.json touched.

## Issues Encountered

None beyond the verification-grep adaptation documented above.

## User Setup Required

None — no external service configuration required. Plan 01 is pure source-tree + docs refactoring within the monorepo.

## Next Phase Readiness

- Plan 02 unblocked: ready to update `packages/nubs/<domain>/package.json` with the `[DEPRECATED]` description prefix (MIG-03), add `@napplet/nub` as runtime dep, drop stale `@napplet/core` direct dep where appropriate, preserve `json-schema-to-ts` / `@types/json-schema` edges for config, and bump versions.
- Plan 03 still blocked on Plan 02 — monorepo-wide `pnpm build` + `pnpm type-check` cannot resolve `@napplet/nub` as a dep of the deprecated packages until Plan 02 adds it. This is as planned; the plan explicitly avoids build verification at this stage.
- Downstream consumers unchanged: `@napplet/shim` and `@napplet/sdk` still import from `@napplet/nub-<domain>` (migration deferred to phase 119). Those imports now resolve through the 1-line shim to `@napplet/nub/<domain>` without any behavioral change.

## Self-Check: PASSED

- 5/5 created files FOUND on disk
- 13/13 modified files FOUND on disk
- 2/2 task commits FOUND in git log (`2f9e626`, `ea39d6e`)
- Plan-level verification block (9 src/ directories = `index.ts` only, 9 `export *` lines, 9 banner-carrying READMEs) passes clean.

---
*Phase: 118-deprecation-re-export-shims*
*Completed: 2026-04-19*
