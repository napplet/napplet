---
phase: 118-deprecation-re-export-shims
plan: 02
subsystem: packaging
tags: [nub, deprecation, changesets, monorepo, pnpm, workspace, semver]

requires:
  - phase: 118-deprecation-re-export-shims-01
    provides: "9 src/index.ts re-export shims + uniform deprecation banner READMEs — package.json + changeset surfaces left untouched per plan boundary"
provides:
  - "9 deprecated packages/nubs/<domain>/package.json files with [DEPRECATED] description prefix naming the @napplet/nub/<domain> migration path (MIG-03 @deprecated metadata surface)"
  - "@napplet/nub workspace:* declared as the sole runtime dep on all 9 deprecated packages — direct @napplet/core dep dropped (MIG-01 runtime wiring so Plan 01's re-export resolves at build time)"
  - "@napplet/nub-config peerDependencies.json-schema-to-ts, peerDependenciesMeta.json-schema-to-ts.optional, and devDependencies.@types/json-schema preserved byte-identical (API-surface contract for FromSchema consumers)"
  - "Single .changeset/deprecate-nub-domain-packages.md file recording minor 0.2.1→0.3.0 bumps for all 9 deprecated packages (intent recorded; `pnpm version-packages` applies at release time)"
affects:
  - 118-03 (monorepo-wide build + type-check verification — @napplet/nub workspace dep must resolve on pnpm install; changeset must be idle until release time)
  - 119 (consumer migration — @napplet/shim, @napplet/sdk re-pointed; downstream pnpm install will pick up the new dep edge without surprise)
  - future release pipeline (`pnpm version-packages` consumes the changeset, bumps 9 versions, rewrites CHANGELOG.md entries, deletes the .changeset file)

tech-stack:
  added: []
  patterns:
    - "Minimal package.json rewrite for deprecation shim: only description + single dependency key change; name, exports, scripts, repository, keywords, license, files, sideEffects, publishConfig, version left byte-identical"
    - "Config special case: three API-surface fields (peerDeps + peerDepsMeta + @types/json-schema devDep) survive deprecation transformation unchanged — shim must not drop optional type helpers"
    - "Version bump via changeset, not direct package.json edit: aligns with repo's existing `pnpm version-packages` / `pnpm publish-packages` pipeline — single .changeset file covers all 9 minor bumps"

key-files:
  created:
    - .changeset/deprecate-nub-domain-packages.md
  modified:
    - packages/nubs/config/package.json
    - packages/nubs/identity/package.json
    - packages/nubs/ifc/package.json
    - packages/nubs/keys/package.json
    - packages/nubs/media/package.json
    - packages/nubs/notify/package.json
    - packages/nubs/relay/package.json
    - packages/nubs/storage/package.json
    - packages/nubs/theme/package.json

key-decisions:
  - "Applied the plan's rewrite rules via targeted Edit diffs rather than whole-file rewrites — preserves the existing field order and byte-identity of everything except description + dependencies. Passes acceptance criterion that non-target fields are byte-identical to upstream."
  - "Version bump recorded exclusively in .changeset/deprecate-nub-domain-packages.md — zero package.json version fields touched (all still 0.2.1). Release time `pnpm version-packages` will apply 0.3.0 and rewrite CHANGELOG.md entries. Plan 02 records intent only; never runs version-packages."
  - "Single changeset file covering all 9 packages rather than 9 individual files — matches the repo's existing changeset convention (quick task 260419-i6c used a similar aggregated pattern). baseBranch: main + access: public already configured in .changeset/config.json."
  - "Selected `minor` over `patch` and `major`: shim conversion is semver-major in spirit but produces zero observable API changes for pinned consumers (every export survives via `export *`). Minor matches milestone-wide v0.26.0 cadence and CONTEXT.md's 'prefer 0.3.0 for a clear signal' guidance."

patterns-established:
  - "9-way parallel package.json edit pattern: Edit tool applied 2 diffs per file (description prefix + dependency key swap) × 9 files = 18 atomic edits in a single task — fast, reviewable, and reversible. No whole-file rewrites. No JSON parse/stringify round-trip that could reorder fields."
  - "Changeset as version-bump recorder: .changeset/*.md frontmatter is authoritative for the next release; direct package.json version edits are forbidden during plan execution. Release pipeline (`pnpm version-packages` → `pnpm publish-packages`) applies the bump atomically."

requirements-completed:
  - MIG-01
  - MIG-03

duration: 2 min
completed: 2026-04-19
---

# Phase 118 Plan 02: Package Runtime Dep + Deprecation Metadata Summary

**Stamped [DEPRECATED] description + `@napplet/nub` runtime dep onto all 9 deprecated nub package.json files and recorded the 0.3.0 minor bump via a single changeset — Plan 01's re-export shims now resolve at build time.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-19T13:42:37Z
- **Completed:** 2026-04-19T13:44:27Z
- **Tasks:** 2
- **Files modified:** 9 (all `packages/nubs/<domain>/package.json`)
- **Files created:** 1 (`.changeset/deprecate-nub-domain-packages.md`)

## Accomplishments

- All 9 `packages/nubs/<domain>/package.json` files now carry the literal `[DEPRECATED] Use @napplet/nub/<domain> instead. ` prefix on `description` and declare `@napplet/nub: workspace:*` as their sole runtime dependency. The direct `@napplet/core` dep is gone everywhere — transitively satisfied through `@napplet/nub`.
- `@napplet/nub-config` preserved byte-identical: `peerDependencies.json-schema-to-ts@^3.1.1`, `peerDependenciesMeta.json-schema-to-ts.optional: true`, and `devDependencies.@types/json-schema@^7.0.15` survive the rewrite. The other 8 packages still have no `peerDependencies` / `peerDependenciesMeta` fields (verified explicitly in the plan's Task 1 verify block).
- `.changeset/deprecate-nub-domain-packages.md` records a minor bump for all 9 deprecated packages (0.2.1 → 0.3.0). The root `@napplet/nub` package is intentionally omitted — frozen this phase per CONTEXT.md. `@napplet/core`, `@napplet/shim`, `@napplet/sdk`, `@napplet/vite-plugin` also untouched.
- Every `packages/nubs/<domain>/package.json` still reports `"version": "0.2.1"` — the bump is recorded only in the changeset; `pnpm version-packages` applies it at release time per repo convention.
- MIG-03 (`@deprecated` metadata — description prefix) and MIG-01 (runtime dep wiring for the re-export to resolve) satisfied. Plan 03's monorepo-wide build + type-check is now unblocked.

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite all 9 deprecated package.json files with new deps plus DEPRECATED description prefix** — `2accd36` (chore) — 9 files changed, 18 insertions, 18 deletions. Description prefix + `@napplet/core` → `@napplet/nub` dependency swap applied to config, identity, ifc, keys, media, notify, relay, storage, theme.
2. **Task 2: Create the changeset file recording the 0.3.0 minor bump across all 9 deprecated packages** — `2914d72` (chore) — 1 file created, 21 insertions. Single .changeset/*.md file covering all 9 packages with `minor` bump.

_Plan metadata commit to follow after SUMMARY + STATE + ROADMAP + REQUIREMENTS updates._

## Files Created/Modified

**package.json rewrites (Task 1 — commit `2accd36`):**

- `packages/nubs/config/package.json` — `[DEPRECATED]` prefix + `@napplet/core` → `@napplet/nub` dep swap; peerDependencies + peerDependenciesMeta + @types/json-schema preserved byte-identical
- `packages/nubs/identity/package.json` — `[DEPRECATED]` prefix + `@napplet/core` → `@napplet/nub` dep swap
- `packages/nubs/ifc/package.json` — `[DEPRECATED]` prefix + `@napplet/core` → `@napplet/nub` dep swap
- `packages/nubs/keys/package.json` — `[DEPRECATED]` prefix + `@napplet/core` → `@napplet/nub` dep swap
- `packages/nubs/media/package.json` — `[DEPRECATED]` prefix + `@napplet/core` → `@napplet/nub` dep swap
- `packages/nubs/notify/package.json` — `[DEPRECATED]` prefix + `@napplet/core` → `@napplet/nub` dep swap
- `packages/nubs/relay/package.json` — `[DEPRECATED]` prefix + `@napplet/core` → `@napplet/nub` dep swap
- `packages/nubs/storage/package.json` — `[DEPRECATED]` prefix + `@napplet/core` → `@napplet/nub` dep swap
- `packages/nubs/theme/package.json` — `[DEPRECATED]` prefix + `@napplet/core` → `@napplet/nub` dep swap; preserved the non-sandwichfarm repository URL (`git+https://github.com/napplet/napplet.git`) per the plan's explicit instruction

**Changeset file (Task 2 — commit `2914d72`):**

- `.changeset/deprecate-nub-domain-packages.md` — YAML frontmatter listing all 9 deprecated packages with `minor` bump, followed by the authoritative summary paragraph + 5-point bullet list describing the deprecation transformation. Alphabetical ordering of entries. Body copied verbatim from the plan's Task 2 literal content block.

## Decisions Made

None beyond the plan — all four decisions (minor over patch/major, single changeset file, target edits rather than whole-file rewrites, leaving version at 0.2.1) were pre-specified in the plan's `<templates>` and `<action>` blocks. Execution followed the literal rules byte-for-byte.

## Deviations from Plan

None - plan executed exactly as written.

- Both verify blocks (Task 1 + Task 2) passed on the first run with no adjustments.
- The plan-level verification block passed clean: 9 packages transformed correctly, config special case intact, changeset file present with all 9 entries.
- No rules 1-4 triggered during execution. No scope-adjacent issues discovered. No auth gates encountered (all file edits; no network/CLI operations).

---

**Total deviations:** 0 auto-fixed
**Impact on plan:** Zero deviation from plan artifacts. All 10 files (9 package.json + 1 changeset) match the plan's literal transformation rules and verbatim changeset body. Scope boundary held — no source code, tsup config, tsconfig, build run, or version-packages execution touched. @napplet/nub (root), @napplet/core, @napplet/shim, @napplet/sdk, @napplet/vite-plugin, and root package.json all untouched.

## Issues Encountered

None — execution was mechanical and every verification gate passed on the first run.

## User Setup Required

None — no external service configuration required. Plan 02 is pure monorepo manifest work within the repo. The changeset will be consumed at release time by the existing `pnpm version-packages` / `pnpm publish-packages` scripts (root `package.json`), which require human npm auth (tracked as PUB-04 at the milestone level, not scoped to this phase).

## Explicit Deferrals

- **`pnpm version-packages` NOT run.** The 0.3.0 bump is recorded in the changeset only; applying it to each package.json `version` field is a release-time operation, not a plan-execution operation. The changeset file will be consumed and deleted by `pnpm version-packages` when the next release is cut. All 9 `packages/nubs/<domain>/package.json` files still report `"version": "0.2.1"` — verified in both the Task 2 automated check and the plan-level verification.
- **`pnpm install` NOT run.** Refreshing the pnpm lockfile to reflect the new `@napplet/nub` dep edge is Plan 03's responsibility, bundled with its monorepo-wide build + type-check. Plan 02 only records the intent at the manifest level.
- **`pnpm build` / `pnpm type-check` NOT run.** Monorepo-wide verification is Plan 03 per the plan boundary (`<output>` block explicitly defers build).

## Next Phase Readiness

- **Plan 03 unblocked:** `@napplet/nub` workspace dep is now declared on all 9 deprecated packages, so `pnpm install` + `pnpm build` can resolve the re-export chain from Plan 01 (`packages/nubs/<domain>/src/index.ts` → `@napplet/nub/<domain>` → `@napplet/nub/dist/<domain>/index.js`). The transitive `@napplet/core` dep flows through `@napplet/nub`'s own `dependencies` field (verified in Phase 117-03 summary: @napplet/nub declares `@napplet/core: workspace:*`).
- **Release pipeline ready:** `.changeset/deprecate-nub-domain-packages.md` is idempotent — it records intent but does not mutate state. Running `pnpm version-packages` at release time will bump the 9 deprecated packages to 0.3.0, rewrite each CHANGELOG.md, and delete the changeset file. Running `pnpm publish-packages` then publishes the new versions. Both operations are gated on human npm auth (PUB-04) and out of scope for Plan 02 and Plan 03.
- **No downstream work invalidated:** `@napplet/shim` and `@napplet/sdk` still import from `@napplet/nub-<domain>` names — those imports resolve through the 1-line shim (Plan 01) to `@napplet/nub/<domain>` at build time (Plan 03 verifies). Phase 119 will re-point those central packages directly at `@napplet/nub/<domain>` subpaths.
- **Config package API surface intact:** `FromSchema` type helper from json-schema-to-ts continues to resolve for anyone pinning `@napplet/nub-config` — the optional peerDep + `@types/json-schema` devDep edge is unchanged, so type-only imports of the schema-inference helpers keep working behind the shim.

## Self-Check: PASSED

- 1/1 created file FOUND on disk (`.changeset/deprecate-nub-domain-packages.md`)
- 9/9 modified files FOUND on disk (all `packages/nubs/<domain>/package.json`)
- 2/2 task commits FOUND in git log (`2accd36`, `2914d72`)
- Plan-level verification block (9 packages transformed correctly, config peerDep chain intact, changeset with 9 minor-bump entries) passes clean.
- Node-parsed JSON validity confirmed for all 9 package.json files.
- Field-order byte-identity preserved vs. upstream state (only `description` value and `dependencies.@napplet/core` → `dependencies.@napplet/nub` key changed — no reordering of keys, no touched whitespace on unrelated lines).

---
*Phase: 118-deprecation-re-export-shims*
*Completed: 2026-04-19*
