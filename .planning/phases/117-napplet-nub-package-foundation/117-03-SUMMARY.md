---
phase: 117-napplet-nub-package-foundation
plan: 03
subsystem: infra
tags: [build, tsup, monorepo, typescript, esm, exports-map, verification, nub]

# Dependency graph
requires:
  - phase: 117-01
    provides: packages/nub/ scaffold (package.json + tsconfig + tsup.config, 34-entry exports map)
  - phase: 117-02
    provides: packages/nub/src/ populated with 34 TypeScript source files across 9 domains; theme types-only (Option A resolved)
provides:
  - packages/nub/dist/ populated with 34 ESM .js + 34 .d.ts entry-point files (plus 25 shared chunk-*.js files emitted by tsup code-splitting)
  - Runtime-verified EXP-04: bare `@napplet/nub` import fails with ERR_PACKAGE_PATH_NOT_EXPORTED from a real consumer context
  - Runtime-verified subpath resolution: barrel / types / shim / sdk all resolve correctly for representative domains; theme barrel + types resolve while theme/shim + theme/sdk correctly fail (Option A)
  - Runtime-verified purity: all 9 <domain>/types.js emits are free of @napplet/core runtime imports
  - Runtime-verified registerNub asymmetry: 8 of 9 barrels register at module load (identity, ifc, keys, media, notify, relay, storage, theme); config barrel stays side-effect-free
affects:
  - 118 (re-export shim migration — now has a real built @napplet/nub to re-export from)
  - 119 (flip @napplet/shim + @napplet/sdk to import from @napplet/nub/<domain>)
  - Closes Phase 117 (@napplet/nub Package Foundation)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Multi-entry tsup ESM build with code-splitting: 34 entry points produce 34 .js + 34 .d.ts plus 25 shared chunk-*.js files for common DOMAIN/runtime helpers — maintains tree-shaking while deduplicating shared symbols"
    - "EXP-04 verified at true runtime resolution context (temp consumer package with file: dep), not just by inspecting package.json — confirms ERR_PACKAGE_PATH_NOT_EXPORTED from Node's exports resolver"
    - "Amendment-aware verification: plan originally said '36 entries' but Plan 117-02's Option A resolution left 34. Verification checklist was updated in-flight to assert 34, including the negative assertion that theme/shim + theme/sdk must fail to resolve"

key-files:
  created:
    - .planning/phases/117-napplet-nub-package-foundation/117-03-SUMMARY.md
  modified: []
  deleted: []
  generated-not-tracked:
    - packages/nub/dist/ (tsup output — .gitignored, not committed)

key-decisions:
  - "Verification performed from a real consumer context (temp /tmp probe dir with file:/ dependency on packages/nub) — repo-root node has no @napplet/nub linked (ERR_MODULE_NOT_FOUND), so EXP-04's ERR_PACKAGE_PATH_NOT_EXPORTED can only be distinguished from a context where the package IS installed but no '.' export exists"
  - "Plan's stated '36 entries' figure treated as '34' per amendment: theme ships types-only (Option A from Plan 117-02). All verification assertions adjusted accordingly"
  - "tsup's chunk-*.js files (25 of them) are an expected code-splitting artifact, not entry points; the 34-entry contract is satisfied by the structured <domain>/<file>.js files"

patterns-established:
  - "Phase-closing plans with no source/config changes: dist/ is .gitignored, so no task-level code commit. Only metadata commit (SUMMARY + STATE + ROADMAP + REQUIREMENTS) is made"
  - "EXP-04 runtime verification protocol: install the local package via file: dep into a temp consumer, then probe import of '.' and representative subpaths from that context"

requirements-completed:
  - BUILD-01
  - BUILD-02

# Metrics
duration: 2 min
completed: 2026-04-19
---

# Phase 117 Plan 03: @napplet/nub First Build + Runtime Verification Summary

**`pnpm --filter @napplet/nub build` green; 34 ESM entries + 34 .d.ts files emitted (plus 25 shared chunks from tsup code-splitting); all 9 runtime-resolution invariants verified from a real consumer context — EXP-04 fires ERR_PACKAGE_PATH_NOT_EXPORTED, all subpath categories resolve, theme/shim + theme/sdk correctly fail, types-only emits are runtime-pure, and the 8-of-9 registerNub asymmetry is preserved exactly.**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-19T13:09:12Z
- **Completed:** 2026-04-19T13:11:03Z
- **Tasks:** 1 (atomic: build + type-check + 9-step verification)
- **Files created:** 1 (SUMMARY)
- **Files modified:** 0
- **Generated artifacts (not tracked):** 34 .js + 34 .d.ts + 25 chunk-*.js + sourcemaps under `packages/nub/dist/`

## Accomplishments

- `pnpm --filter @napplet/nub build` exits 0. tsup emits 34 structured entry-point .js files under `packages/nub/dist/<domain>/<file>.js`, 34 co-located `.d.ts` files, and 25 shared `chunk-*.js` files (code-splitting for common helpers like `DOMAIN` constants and shim runtime).
- `pnpm --filter @napplet/nub type-check` exits 0. Zero TypeScript diagnostics.
- Every one of the 34 exports-map entries in `packages/nub/package.json` has a matching `.js` + `.d.ts` on disk — 68 paired files verified via script.
- EXP-04 verified at true runtime from a consumer context: bare `import('@napplet/nub')` fails with `ERR_PACKAGE_PATH_NOT_EXPORTED` (Node's exports resolver refuses the '.' path because no '.' key exists in `exports`).
- Positive subpath resolution verified for all four category types (barrel / types / shim / sdk) using the `relay` domain as representative, plus theme barrel + theme types. Theme's non-existent `/shim` and `/sdk` subpaths correctly fail with `ERR_PACKAGE_PATH_NOT_EXPORTED` (Option A from Plan 117-02).
- All 9 `<domain>/types.js` emits are free of runtime `@napplet/core` imports — `import type` is erased at compile time as expected; no regressions.
- registerNub asymmetry preserved exactly: 8 of 9 domain barrels (identity, ifc, keys, media, notify, relay, storage, theme) contain `registerNub` at module load; only config does not. This matches the upstream `@napplet/nub-*` posture and the Plan 117-02 source-copy invariant.

## Task Commits

Per-task code commit: **none**. Phase 117 Plan 03 is a build + verify-only plan — `dist/` is `.gitignored` by design, and no source/config was modified. The only commit for this plan is the final metadata commit (SUMMARY + STATE + ROADMAP + REQUIREMENTS).

## Files Created/Modified

### Created (tracked, 1)

- `.planning/phases/117-napplet-nub-package-foundation/117-03-SUMMARY.md` — this file.

### Generated (not tracked, in `packages/nub/dist/`)

- 34 entry-point `.js` files: `{config,identity,ifc,keys,media,notify,relay,storage,theme}/index.js` (9 barrels) + `/types.js` (9 types) + `/shim.js` (8 shims — no theme) + `/sdk.js` (8 sdks — no theme) = 34.
- 34 co-located `.d.ts` files, same layout.
- 25 shared `chunk-*.js` files + maps (tsup code-splitting for shared `DOMAIN` constants, shim/SDK helpers, SubscriptionHandle plumbing, etc.).
- 34 `.js.map` sourcemaps and 25 `chunk-*.js.map` sourcemaps.

## Decisions Made

- **Verification performed from a real consumer context.** At repo root, Node reports `ERR_MODULE_NOT_FOUND` for `@napplet/nub` because pnpm workspaces aren't linked into the repo root's `node_modules`. To distinguish this from the actual EXP-04 error (`ERR_PACKAGE_PATH_NOT_EXPORTED`), the verification created `/tmp/nub-exp04-probe/` with a `package.json` declaring `"@napplet/nub": "file:/home/sandwich/Develop/napplet/packages/nub"`, ran `npm install`, then probed imports from that context. This yielded the correct `ERR_PACKAGE_PATH_NOT_EXPORTED` — EXP-04 is enforced at true Node runtime, not just by package.json inspection. Probe dir removed after verification.
- **"34 entries" treated as the authoritative count.** Plan 117-03 as written assumed 36 entries, but Plan 117-02's Option A resolution landed at 34 (theme ships types-only). All verification assertions and counts in this summary use 34.
- **Shared chunks (25 `chunk-*.js` files) accepted as expected tsup output.** Multi-entry ESM builds in tsup use code-splitting to deduplicate shared symbols — this does not violate the 34-entry contract (which concerns `<domain>/<file>.js` entry points), and it does not break tree-shaking (`sideEffects: false` at the package root + per-import granularity preserve it).

## Deviations from Plan

### Amendment-aware execution (not a new deviation)

**1. [Plan Amendment Acknowledged] 34 entries, not 36**

- **Source:** Plan 117-02's Option A resolution (checkpoint decision) reduced the exports map + tsup entry object from 36 to 34 entries. Plan 117-03 as written still references 36; the execution prompt explicitly amended this to 34.
- **Impact on this plan's verification:** Every `36` assertion in the plan body was treated as `34`: `find packages/nub/dist -name '*.d.ts' | wc -l` must equal 34 (not 36); every-exports-entry-has-matching-files script iterates 34 entries (not 36); the expected list of resolvable subpaths excludes `@napplet/nub/theme/shim` and `@napplet/nub/theme/sdk`, and those two were asserted to FAIL with `ERR_PACKAGE_PATH_NOT_EXPORTED`.
- **Verification evidence:**
  - `node -e "const p=require('./packages/nub/package.json'); console.log(Object.keys(p.exports).length)"` → `34`
  - `find packages/nub/dist -type f -name '*.js' ! -name '*.map' ! -name 'chunk-*.js' | wc -l` → `34`
  - `find packages/nub/dist -type f -name '*.d.ts' | wc -l` → `34`
  - Probe for `@napplet/nub/theme/shim` → `ERR_PACKAGE_PATH_NOT_EXPORTED` (correct — doesn't exist)
  - Probe for `@napplet/nub/theme/sdk` → `ERR_PACKAGE_PATH_NOT_EXPORTED` (correct — doesn't exist)
- **No new issues introduced.** This amendment was already recorded in Plan 117-02's summary; this plan simply honored it.

**No auto-fix rule deviations. No architectural decisions. No authentication gates.**

## Issues Encountered

None. Build + type-check + 9 verification steps all passed on first execution.

One minor verification methodology nuance: the repo-root Node context returns `ERR_MODULE_NOT_FOUND` (package not linked in repo root's node_modules) rather than `ERR_PACKAGE_PATH_NOT_EXPORTED`. Both are in the accepted list per the verification checklist, but the stronger guarantee — actual EXP-04 enforcement via `exports` resolver — was demonstrated from `/tmp/nub-exp04-probe/` where the package IS installed.

## Verification

All 9 verification checklist items from the execution prompt were checked. Results inline:

### 1. Build exits 0 — PASS

```
pnpm --filter @napplet/nub build > /tmp/nub-build.log 2>&1; echo "BUILD_EXIT=$?"
BUILD_EXIT=0
```

tsup reports: `ESM Build success in 25ms`, `DTS Build success in 2179ms`. Requirement **BUILD-01** satisfied.

### 2. Type-check clean — PASS

```
pnpm --filter @napplet/nub type-check > /tmp/nub-typecheck.log 2>&1; echo "TYPECHECK_EXIT=$?"
TYPECHECK_EXIT=0
```

`tsc --noEmit` exits 0 with zero diagnostics. Requirement **BUILD-02** satisfied.

### 3. Exactly 34 entry-point .js + 34 .d.ts files emitted — PASS

```
find packages/nub/dist -type f -name '*.js' ! -name '*.map' ! -name 'chunk-*.js' | wc -l  # → 34
find packages/nub/dist -type f -name '*.d.ts' | wc -l                                      # → 34
find packages/nub/dist -type f -name 'chunk-*.js' | wc -l                                  # → 25 (shared chunks, expected)
```

34 entries × 2 emits = 68 primary files, plus 25 shared chunks for deduplication.

### 4. Per-entry file existence — PASS

All 34 exports-map entries in `packages/nub/package.json` have paired `.js` + `.d.ts` files on disk. Verified via:

```
node -e "const fs=require('fs'); const path=require('path'); const pkg=require('./packages/nub/package.json'); const miss=[]; for(const [k,v] of Object.entries(pkg.exports)){const i=path.join('packages/nub',v.import);const t=path.join('packages/nub',v.types);if(!fs.existsSync(i))miss.push('import '+k+' -> '+i);if(!fs.existsSync(t))miss.push('types '+k+' -> '+t);} console.log('exports:', Object.keys(pkg.exports).length, 'missing:', miss.length);"
# → exports: 34 missing: 0
```

All 34 barrels (9) + types granular (9) + shim granular (8) + sdk granular (8) resolved to existing files.

### 5. EXP-04 runtime probe — PASS (ERR_PACKAGE_PATH_NOT_EXPORTED)

From `/tmp/nub-exp04-probe/` (real consumer context with `@napplet/nub` installed via `file:` dep):

```
cd /tmp/nub-exp04-probe && node --input-type=module -e "try { await import('@napplet/nub'); ... } catch (e) { console.log('OK:', e.code, '--', e.message); }"
# → OK: root import fails with ERR_PACKAGE_PATH_NOT_EXPORTED -- No "exports" main defined in /tmp/nub-exp04-probe/node_modules/@napplet/nub/package.json
```

EXP-04 enforced at true Node runtime via the `exports` resolver refusing the '.' path.

### 6. Positive runtime probes — PASS (all six categories)

From the same consumer context:

- **Barrel** — `import('@napplet/nub/relay')` → `DOMAIN='relay'` ✓
- **Types granular** — `import('@napplet/nub/relay/types')` → `{ DOMAIN }` exported ✓
- **Shim granular** — `import('@napplet/nub/relay/shim')` → `installRelayShim` is `function` ✓
- **SDK granular** — `import('@napplet/nub/relay/sdk')` → `relaySubscribe`, `relayPublish`, `relayPublishEncrypted`, `relayQuery` all exported ✓
- **Theme barrel** — `import('@napplet/nub/theme')` → `DOMAIN='theme'` ✓
- **Theme types** — `import('@napplet/nub/theme/types')` → `{ DOMAIN }` exported ✓
- **Theme shim (negative)** — `import('@napplet/nub/theme/shim')` → `ERR_PACKAGE_PATH_NOT_EXPORTED` ✓ (Option A: doesn't exist)
- **Theme sdk (negative)** — `import('@napplet/nub/theme/sdk')` → `ERR_PACKAGE_PATH_NOT_EXPORTED` ✓ (Option A: doesn't exist)

### 7. Types-only subpath runtime purity — PASS

```
for d in config identity ifc keys media notify relay storage theme; do
  grep -qE "require\\('@napplet/core'\\)|from '@napplet/core'" "packages/nub/dist/$d/types.js" && { echo FAIL; exit 1; } || true
done
echo OK
# → OK: all 9 types.js files free of runtime @napplet/core imports
```

Confirms `import type` was erased as expected. Example: `dist/relay/types.js` content is 6 lines (`import { DOMAIN } from "../chunk-ZNPUIQRI.js"; export { DOMAIN };`) — no runtime core import.

### 8. registerNub asymmetry preservation — PASS (8-of-9)

```
for d in config identity ifc keys media notify relay storage theme; do
  if grep -q "registerNub" "packages/nub/dist/$d/index.js"; then echo "REGISTERS: $d"; else echo "NO-REGISTER: $d"; fi
done
# → NO-REGISTER: config
# → REGISTERS: identity
# → REGISTERS: ifc
# → REGISTERS: keys
# → REGISTERS: media
# → REGISTERS: notify
# → REGISTERS: relay
# → REGISTERS: storage
# → REGISTERS: theme
```

Exactly 8 domains register, exactly 1 (`config`) does not. Theme registers — matches upstream. Asymmetry preserved across the build.

### 9. Commit — PENDING at end of this summary

The metadata commit (SUMMARY + STATE + ROADMAP + REQUIREMENTS) will carry these verification results in its body; no per-task code commit since `dist/` is gitignored.

---

### Concrete verification output (commit message body)

```
Phase 117 Plan 03 verification results:

BUILD-01: pnpm --filter @napplet/nub build  → exit 0
BUILD-02: pnpm --filter @napplet/nub type-check → exit 0

dist/ emits:
  - 34 entry .js files (9 barrels + 9 types + 8 shims + 8 sdks)
  - 34 entry .d.ts files
  - 25 shared chunk-*.js files (tsup code-splitting)

Exports map: 34/34 entries resolve to on-disk .js + .d.ts

EXP-04 (runtime-verified from /tmp consumer):
  - await import('@napplet/nub') → ERR_PACKAGE_PATH_NOT_EXPORTED

Positive probes (all from /tmp consumer):
  - '@napplet/nub/relay'        → DOMAIN=relay          [barrel]
  - '@napplet/nub/relay/types'  → { DOMAIN } exported   [types]
  - '@napplet/nub/relay/shim'   → installRelayShim fn   [shim]
  - '@napplet/nub/relay/sdk'    → relaySubscribe fn     [sdk]
  - '@napplet/nub/theme'        → DOMAIN=theme          [theme barrel]
  - '@napplet/nub/theme/types'  → { DOMAIN } exported   [theme types]

Negative probes (Option A correctness):
  - '@napplet/nub/theme/shim'   → ERR_PACKAGE_PATH_NOT_EXPORTED ✓
  - '@napplet/nub/theme/sdk'    → ERR_PACKAGE_PATH_NOT_EXPORTED ✓

types.js purity: all 9 domains free of runtime @napplet/core imports
registerNub asymmetry: 8 domains register (identity/ifc/keys/media/notify/relay/storage/theme), config does not
```

## User Setup Required

None.

## Next Phase Readiness

- **Phase 117 complete.** `@napplet/nub` builds cleanly, type-checks cleanly, and every runtime invariant the milestone depends on is verified — including the three non-negotiables: no root export (EXP-04), per-domain subpath resolution, and types-only subpath purity.
- **Ready for Phase 118 (Deprecation Re-Export Shims):** the 9 existing `@napplet/nub-*` packages can be converted into 1-line re-exports of `@napplet/nub/<domain>`. Theme's re-export will need to only re-export the barrel + types path (no shim/sdk upstream), matching what `@napplet/nub-theme` already ships.
- **Ready for Phase 119 (Internal Consumer Migration):** `@napplet/shim` and `@napplet/sdk` can flip their imports from `@napplet/nub-<domain>` to `@napplet/nub/<domain>/shim` and `@napplet/nub/<domain>` respectively, using the now-built subpaths.
- **No blockers.** The Plan 117-02 "36 vs 34" boundary is fully reconciled at build + runtime.
- **Note on tsup shared chunks:** the 25 `chunk-*.js` files are an implementation detail of tsup's ESM code-splitting. They do not affect tree-shaking (each entry point still only pulls in the chunks it references), and downstream Phase 118/119 work does not need to know about them.

## Self-Check

- .planning/phases/117-napplet-nub-package-foundation/117-03-SUMMARY.md: FOUND (this file)
- packages/nub/dist/ (directory): FOUND
- packages/nub/dist/relay/index.js: FOUND (contains `registerNub`)
- packages/nub/dist/relay/index.d.ts: FOUND
- packages/nub/dist/relay/types.js: FOUND (no runtime @napplet/core)
- packages/nub/dist/relay/types.d.ts: FOUND
- packages/nub/dist/relay/shim.js: FOUND
- packages/nub/dist/relay/shim.d.ts: FOUND
- packages/nub/dist/relay/sdk.js: FOUND
- packages/nub/dist/relay/sdk.d.ts: FOUND
- packages/nub/dist/storage/{index,types,shim,sdk}.{js,d.ts}: FOUND (8 files)
- packages/nub/dist/ifc/{index,types,shim,sdk}.{js,d.ts}: FOUND (8 files)
- packages/nub/dist/keys/{index,types,shim,sdk}.{js,d.ts}: FOUND (8 files)
- packages/nub/dist/media/{index,types,shim,sdk}.{js,d.ts}: FOUND (8 files)
- packages/nub/dist/notify/{index,types,shim,sdk}.{js,d.ts}: FOUND (8 files)
- packages/nub/dist/identity/{index,types,shim,sdk}.{js,d.ts}: FOUND (8 files)
- packages/nub/dist/config/{index,types,shim,sdk}.{js,d.ts}: FOUND (8 files)
- packages/nub/dist/config/index.js: FOUND (NO `registerNub` call — side-effect-free)
- packages/nub/dist/theme/index.js: FOUND (contains `registerNub`)
- packages/nub/dist/theme/index.d.ts: FOUND
- packages/nub/dist/theme/types.js: FOUND (no runtime @napplet/core)
- packages/nub/dist/theme/types.d.ts: FOUND
- packages/nub/dist/theme/shim.{js,d.ts}: CORRECTLY ABSENT (Option A)
- packages/nub/dist/theme/sdk.{js,d.ts}: CORRECTLY ABSENT (Option A)
- Entry .js count: 34 (expected 34)
- Entry .d.ts count: 34 (expected 34)
- Shared chunk-*.js count: 25 (tsup code-splitting — expected, not part of entry contract)
- EXP-04 runtime verification: ERR_PACKAGE_PATH_NOT_EXPORTED (confirmed from /tmp consumer context)
- All 9 types.js runtime-pure (no @napplet/core imports): PASS
- registerNub presence: 8/9 (config abstains, theme registers): PASS

## Self-Check: PASSED

---
*Phase: 117-napplet-nub-package-foundation*
*Completed: 2026-04-19*
