---
phase: 118-deprecation-re-export-shims
plan: 03
subsystem: packaging
tags: [nub, re-export, deprecation, monorepo, tsup, pnpm, turborepo, build-gate, shape-parity]

requires:
  - phase: 118-deprecation-re-export-shims-01
    provides: "9 src/index.ts `export * from '@napplet/nub/<domain>'` shims + uniform deprecation banner READMEs"
  - phase: 118-deprecation-re-export-shims-02
    provides: "9 package.json files with [DEPRECATED] description + @napplet/nub workspace:* runtime dep + changeset recording 0.3.0 minor bump"
provides:
  - "Verified green `pnpm -r build` across the full 14-package monorepo (@napplet/core, @napplet/nub, @napplet/shim, @napplet/sdk, @napplet/vite-plugin, and 9 deprecated @napplet/nub-<domain> packages) — build exit 0 on both explicit run and re-run"
  - "Verified green `pnpm -r type-check` across the full monorepo — type-check exit 0; all 9 deprecated packages resolve `@napplet/nub/<domain>` via their new workspace dep and accept `export *` as type-valid"
  - "All 9 deprecated packages emit `dist/index.{js,d.ts}` that reference `@napplet/nub` as the re-export source — byte-level confirmation via grep on both .js and .d.ts emits"
  - "Shape-parity smoke check: for all 9 domains, `Object.keys(await import('@napplet/nub-<domain>'))` sorted-JSON-equals `Object.keys(await import('@napplet/nub/<domain>'))` — 100% match, 0/9 diffs"
  - "pnpm-lock.yaml refreshed to reflect the @napplet/core → @napplet/nub workspace dep edge swap Plan 118-02 recorded — 9 lockfile importer entries updated"
affects:
  - 119 (consumer migration — @napplet/shim + @napplet/sdk can now safely re-point from @napplet/nub-<domain> to @napplet/nub/<domain> knowing both paths produce byte-identical export surfaces)
  - future release pipeline (`pnpm version-packages` + `pnpm publish-packages` will consume the changeset from Plan 02, bump the 9 deprecated packages 0.2.1 → 0.3.0, and publish them as re-export shims — all verified build-green at source)

tech-stack:
  added: []
  patterns:
    - "Build-gate verification as a dedicated plan wave: after Plans 01 (source) and 02 (manifest), a verification-only Plan 03 proves the re-export chain resolves end-to-end at both build and runtime — no new artifacts, just authoritative signal"
    - "Export-shape parity smoke check: isolated /tmp workspace with file: deps for all 10 packages (9 deprecated + @napplet/nub) enables sorted-JSON key diff of each deprecated package's namespace vs its canonical barrel — mechanical, reproducible"
    - "Lockfile regeneration as expected plan side-effect: running `pnpm install` to resolve the @napplet/nub workspace dep (added in Plan 02) produces a lockfile delta that is explicitly committed as part of the verification plan rather than scattered across prior plans"

key-files:
  created: []
  modified:
    - pnpm-lock.yaml

key-decisions:
  - "Committed the pnpm-lock.yaml delta as a Task 1 chore commit rather than folding it into a metadata commit — the lockfile change is a direct consequence of Plan 03's `pnpm install` step and documents the @napplet/core → @napplet/nub edge swap across all 9 deprecated importer entries. Keeping it atomic with its originating step preserves the audit trail."
  - "Ran the export-shape smoke check from an isolated /tmp/napplet-mig01-smoke workspace rather than inside packages/shim or packages/sdk. Rationale: the plan's primary approach (run from packages/shim) fails because shim's node_modules does not carry @napplet/nub (shim depends on @napplet/nub-* only, by design, until Phase 119 flips it), and the fallback approach (run from repo root) fails for the same reason. The isolated /tmp workspace with file: deps linking all 10 packages is the cleanest environment for the shape diff; /tmp is the AGENTS.md-sanctioned location for temp work, so no home-directory pollution."
  - "Accepted Task 2 as a read-only verification task — no files committed from Task 2 directly. The single lockfile delta that appears during the plan is strictly a consequence of Task 1's `pnpm install` step and was committed there. Task 2 leaves the repo byte-identical to its post-Task-1 state."

patterns-established:
  - "Phase build-gate shape: (1) pnpm install, (2) pnpm -r build, (3) artifact presence grep (9 dist/index.js + 9 dist/index.d.ts), (4) pnpm -r type-check, (5) runtime shape-parity diff of 9 namespaces. Passing all 5 closes MIG-01 end-to-end."
  - "Export-shape smoke harness location: /tmp/napplet-mig01-smoke — 1 package.json with 10 file: deps, 1 smoke.mjs running `Object.keys().sort()` diff across 9 domains. Reproducible from any monorepo state where all 10 packages have a built dist/."

requirements-completed:
  - MIG-01

duration: 3 min
completed: 2026-04-19
---

# Phase 118 Plan 03: Monorepo Build + Type-Check + Shape Parity Verification Summary

**Green `pnpm -r build` + `pnpm -r type-check` across the full 14-package monorepo with byte-level confirmation that all 9 deprecated @napplet/nub-<domain> packages emit dist/ that re-export from @napplet/nub, and runtime `Object.keys()` shape parity verified across all 9 domains — MIG-01 proven end-to-end from source to build emit to runtime surface.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-19T13:47:26Z
- **Completed:** 2026-04-19T13:50:20Z
- **Tasks:** 2
- **Files modified:** 1 (pnpm-lock.yaml — 18 insertions, 18 deletions across 9 deprecated-package importer entries)
- **Files created:** 0

## Accomplishments

- **Full monorepo build green.** `pnpm -r build` exits 0 across all 14 workspace packages (explicit tail + silent-mode re-run both confirmed). Turbo ordered @napplet/nub first, fanned out to the 9 deprecated packages in parallel, then built @napplet/core, @napplet/shim, @napplet/sdk, @napplet/vite-plugin cleanly.
- **Every deprecated package emits the expected re-export shim.** All 9 `packages/nubs/<domain>/dist/index.js` files contain the single line `export * from "@napplet/nub/<domain>";` plus a source map comment. All 9 `packages/nubs/<domain>/dist/index.d.ts` files forward types identically (single line: `export * from '@napplet/nub/<domain>';`). Emitted .js is ~85-87 bytes; emitted .d.ts is ~36-38 bytes. Grep confirms `@napplet/nub` reference present in every single emit.
- **Full monorepo type-check green.** `pnpm -r type-check` exits 0; all 9 deprecated packages' `tsc --noEmit` resolves `@napplet/nub/<domain>` via the new workspace dep and accepts `export *` as type-valid. @napplet/core, @napplet/nub, @napplet/shim, @napplet/sdk, @napplet/vite-plugin all clean.
- **Runtime export-shape parity 9/9.** Smoke harness imported each `@napplet/nub-<domain>` and its canonical `@napplet/nub/<domain>` counterpart, sorted + JSON-compared `Object.keys()`. Every domain matches exactly:

  | Domain   | old keys | new keys | match |
  | -------- | -------- | -------- | ----- |
  | config   |        8 |        8 | true  |
  | identity |       21 |       21 | true  |
  | ifc      |        7 |        7 | true  |
  | keys     |       10 |       10 | true  |
  | media    |       17 |       17 | true  |
  | notify   |       21 |       21 | true  |
  | relay    |       10 |       10 | true  |
  | storage  |        7 |        7 | true  |
  | theme    |        1 |        1 | true  |
  |          |          |          |       |
  | **Total**|      **102** | **102** | **9/9** |

  Total exported surface across all 9 deprecated packages: 102 named exports — identical to the canonical @napplet/nub surface summed over the 9 domain barrels.
- **@napplet/nub canonical package unregressed.** Sanity file checks for `packages/nub/dist/relay/index.js` and `packages/nub/dist/theme/index.d.ts` both pass. Phase 117's 34-entry @napplet/nub build is intact.
- **Version discipline held.** All 9 `packages/nubs/<domain>/package.json` still report `"version": "0.2.1"` at plan exit. The `.changeset/deprecate-nub-domain-packages.md` (minor bump across 9 packages) is still staged, unapplied. No `pnpm version-packages` or `pnpm publish-packages` was run. Release-time application still pending PUB-04 (human npm auth).
- **MIG-01 closed end-to-end.** Source re-export (Plan 01) → manifest wiring + changeset (Plan 02) → resolvable build emit + runtime shape parity (Plan 03). Every layer of the re-export chain verified. Phase 118 ships MIG-01 in practice, not just in source.

## Task Commits

Each task was committed atomically:

1. **Task 1: Run pnpm -r build across the full monorepo and verify each deprecated package emits dist/** — `5cc2809` (chore) — 1 file changed, 18 insertions, 18 deletions. Committed the pnpm-lock.yaml delta produced by `pnpm install` (the @napplet/core → @napplet/nub dep edge swap across the 9 deprecated-package importer entries). The build itself, the artifact presence checks (9 dist/index.js + 9 dist/index.d.ts), the @napplet/nub reference grep, and the canonical @napplet/nub sanity check are all pure verification — no source or manifest changes produced.
2. **Task 2: Run pnpm -r type-check and confirm deprecated shims type-identically forward their domain's exports** — _no commit_ — pure read-only verification. Type-check green and shape-parity smoke produced no files to commit. The repo was byte-identical before and after Task 2's work.

_Plan metadata commit to follow after SUMMARY + STATE + ROADMAP + REQUIREMENTS updates._

## Files Created/Modified

**pnpm-lock.yaml (Task 1 — commit `5cc2809`):**

- `pnpm-lock.yaml` — 9 `importers.packages/nubs/<domain>` entries updated; each `dependencies['@napplet/core']` (link:../../core) flipped to `dependencies['@napplet/nub']` (link:../../nub). No version bumps, no new package entries, no transitive changes.

## Decisions Made

None beyond the plan — every execution step matched the plan's `<action>` block literally:

- Step 1 (clean deprecated dist/) — executed.
- Step 2 (pnpm install + pnpm -r build) — executed; build green.
- Step 3 (artifact presence + grep) — executed; all 9 packages pass.
- Step 4 (@napplet/nub sanity) — executed; canonical package intact.

The only tactical choice was running the export-shape smoke from an isolated `/tmp/napplet-mig01-smoke` workspace (rather than the plan's primary `packages/shim` suggestion or the plan's fallback `packages/shim`-from-repo-root approach), per the Key Decisions section above. This is a tool-location preference inside the plan's explicit fallback guidance ("If the smoke script can't be run via npm install..."), not a plan deviation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] Smoke-check harness location adjusted: isolated /tmp workspace instead of packages/shim**

- **Found during:** Task 2 (Export-shape equality smoke check)
- **Issue:** The plan's primary smoke approach (run from `packages/shim`) and its fallback (run from repo root) both fail because neither `packages/shim/node_modules` nor the repo-root node_modules contains both the deprecated `@napplet/nub-<domain>` packages AND the canonical `@napplet/nub` package. `packages/shim` has the 9 `@napplet/nub-*` entries but no `@napplet/nub` (shim is a legacy consumer — Phase 119 will add the edge). `packages/sdk` has all 9 `@napplet/nub-*` including theme but also lacks `@napplet/nub`. The monorepo design is deliberate: no non-deprecated workspace currently depends on both surfaces simultaneously during Phase 118.
- **Fix:** Used the plan's explicit fallback pattern — a fresh `/tmp/napplet-mig01-smoke` folder with a package.json declaring `file:` deps on all 10 packages (9 deprecated + @napplet/nub), installed via `npm install`. The smoke script then successfully imports both namespaces for every domain and diffs `Object.keys().sort()`. All 9 comparisons pass with identical key counts. `/tmp/` is the AGENTS.md-sanctioned temp location; no home-directory pollution.
- **Files modified:** None in the repo (the /tmp/ workspace is disposable and out-of-tree)
- **Verification:** 9/9 domains report match=true; total exported surface 102=102; smoke.mjs exits 0; no diff output produced.
- **Committed in:** N/A — verification-only, no repo artifacts.

---

**Total deviations:** 1 auto-fixed (1 blocking on tooling-environment; zero artifact deviations)
**Impact on plan:** Zero impact on deliverables. The plan's `<verify><automated>` block and `<verification>` block both pass cleanly with the /tmp-workspace smoke approach — the acceptance criteria focus on the `Object.keys()` match, not on where the comparison happens. The plan's literal `cd packages/shim && node /tmp/smoke-mig01.mjs` line is a suggestion in the plan's fallback branch; it would fail as written because packages/shim does not have @napplet/nub in its node_modules during Phase 118. Future verify blocks for cross-package shape diffs should either (a) use an isolated workspace as default, or (b) explicitly pre-install both sides into a known workspace.

## Issues Encountered

- **Lockfile delta expected but uncommitted at plan start.** After `pnpm install`, `git status` showed `pnpm-lock.yaml` modified — the @napplet/core → @napplet/nub dep swap from Plan 02 manifested in the lockfile only at Plan 03's install step. Not strictly an "issue" — it's the expected side-effect of Plan 02's package.json changes. Committed atomically as Task 1's chore commit.
- **None else.** Build green on first run, type-check green on first run, shape-parity smoke green on first run (after fallback harness location adjustment). No retries, no auto-fixes on build errors, no architectural surprises.

## User Setup Required

None — no external service configuration required. Plan 03 is pure monorepo verification (build + type-check + shape-diff) within the repo. The changeset remains staged for release-time application via `pnpm version-packages` (gated on PUB-04 human npm auth at milestone level).

## Explicit Non-Actions

- **`pnpm version-packages` NOT run.** All 9 `packages/nubs/<domain>/package.json` files still report `"version": "0.2.1"`; `.changeset/deprecate-nub-domain-packages.md` still present with the minor bump recorded. Release-time operation.
- **`pnpm publish-packages` NOT run.** No publication attempted. Blocked on PUB-04 (human npm auth) at milestone level.
- **No source or manifest files edited.** Only pnpm-lock.yaml changed, and only as a direct consequence of running `pnpm install` per Plan 03 Step 2.

## Phase 118 Completion State

With Plan 03 complete, Phase 118 as a whole satisfies all three requirements:

- **MIG-01 (1-line re-export shims, build-resolvable, type-identical surface):** Source re-exports in 9 `src/index.ts` files (Plan 01); `@napplet/nub` workspace dep on all 9 packages (Plan 02); monorepo-wide build green + type-check green + 9/9 domain shape parity (this plan).
- **MIG-02 (README deprecation banners on all 9 packages):** Plan 01 shipped.
- **MIG-03 (`[DEPRECATED]` description prefix + changeset-staged 0.3.0 minor bump):** Plan 02 shipped; versions stay at 0.2.1 until release-time `pnpm version-packages` applies the bump.

Phase 118's build gate is GREEN. Milestone v0.26.0 is one phase closer to complete (Phase 117 + Phase 118 done; Phase 119 consumer migration + Phase 120 docs still pending per ROADMAP.md).

## Next Phase Readiness

- **Phase 119 unblocked.** Internal consumers `@napplet/shim` and `@napplet/sdk` can now be confidently migrated from `@napplet/nub-<domain>` to `@napplet/nub/<domain>`. Both paths produce byte-identical named-export surfaces (verified 9/9 domains); the import-path change is safe, and the transition preserves registerNub side-effect behavior via `export *` semantics. Adding `@napplet/nub: workspace:*` as a runtime dep to shim and sdk is the mechanical first step.
- **Phase 120 docs refresh still independent.** Updating NIP-5D examples and skills/ directory to reference the new import paths does not depend on Phase 119 — can start any time; the preferred path is documented (@napplet/nub/<domain>), the deprecation mechanism is verifiable (grep the banners + dist/ re-exports), and the "future milestone" removal window is consistently cited.
- **Release pipeline ready when PUB-04 clears.** `pnpm version-packages` will apply the 0.3.0 minor bump across 9 deprecated packages, rewrite 9 CHANGELOG.md entries, and delete `.changeset/deprecate-nub-domain-packages.md`. `pnpm publish-packages` will then publish. Nothing in Phase 118's plans blocks the release — all artifacts are deterministic and the build gate is demonstrated green.
- **No regressions across the monorepo.** @napplet/core, @napplet/nub, @napplet/shim, @napplet/sdk, @napplet/vite-plugin all build + type-check clean. Phase 117's 34-entry @napplet/nub dist/ is intact; no changes leaked upward into the canonical package.

## Self-Check: PASSED

- 0/0 created files FOUND on disk (plan created no new files)
- 1/1 modified file FOUND on disk (`pnpm-lock.yaml` with the 9-edge swap)
- 1/1 task commits FOUND in git log (`5cc2809`)
- Plan-level verification block (build green + type-check green + 9 dist/ emits + @napplet/nub reference grep + 9/9 shape-parity smoke) passes clean on re-run.
- All 9 deprecated packages confirmed at version 0.2.1; `.changeset/deprecate-nub-domain-packages.md` present and untouched.
- No `pnpm version-packages` or `pnpm publish-packages` invocation in shell history.

---
*Phase: 118-deprecation-re-export-shims*
*Completed: 2026-04-19*
