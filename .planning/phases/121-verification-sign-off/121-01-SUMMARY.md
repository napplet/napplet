---
phase: 121-verification-sign-off
plan: 01
subsystem: verification
tags: [tree-shaking, esbuild, tsc, deprecation-shims, acceptance-gate]

requires:
  - phase: 117-napplet-nub-package-foundation
    provides: "@napplet/nub 34-entry exports map, sideEffects:false"
  - phase: 118-deprecation-re-export-shims
    provides: "9 @napplet/nub-<domain> re-export shims with @deprecated metadata"
  - phase: 119-internal-consumer-migration
    provides: "shim+sdk importing from @napplet/nub/<domain> subpaths only"
  - phase: 120-documentation-update
    provides: "All READMEs + specs migrated to @napplet/nub/<domain> paths"
provides:
  - "Acceptance evidence that v0.26.0 Better Packages milestone is complete"
  - "VER-01: pnpm -r build + pnpm -r type-check green across 14 workspace packages"
  - "VER-02: @napplet/nub/relay/types tree-shakes to 39 bytes (zero registerNub, zero cross-domain)"
  - "VER-03: 9/9 deprecated packages type-round-trip cleanly under tsc --noEmit"
affects: [milestone-v0.26.0-closure, future-deprecation-removal-phase]

tech-stack:
  added: []
  patterns:
    - "/tmp/napplet-* harness directories for out-of-tree consumer probes (Phase 117-03 and 119-02 pattern)"
    - "npm file: deps for out-of-tree consumers of workspace packages (pnpm can't honor workspace:* externally)"
    - "Local node_modules/.bin/tsc invocation for harness type-checks (tsc is not a standalone npm package)"

key-files:
  created:
    - ".planning/phases/121-verification-sign-off/121-01-SUMMARY.md"
  modified: []

key-decisions:
  - "VER-02 tree-shake harness uses esbuild 0.24 with --bundle --minify --format=esm --platform=neutral"
  - "VER-03 harnesses use the 2 CONTEXT-flagged type substitutions: NappletConfigSchema (not NappletConfig), MediaSessionCreateMessage (not MediaCreateSessionMessage)"
  - "Rule 3 - Blocking deviation: plan's `npx -y tsc@5.9.3 --noEmit` is broken (no tsc package on npm) — fixed by invoking local node_modules/.bin/tsc from each harness devDependency install"

patterns-established:
  - "Tree-shake verification: npm-installed out-of-tree consumer + esbuild bundle + grep-based assertions on registerNub count + cross-domain string literals"
  - "Deprecation shim type round-trip verification: pinned-name consumer per domain with file: deps to both the deprecated shim AND canonical @napplet/nub (npm can't resolve workspace:* outside the monorepo) + tsc --noEmit"

requirements-completed: [VER-01, VER-02, VER-03]

duration: 3 min
completed: 2026-04-19
---

# Phase 121 Plan 01: Verification & Sign-Off Summary

**v0.26.0 Better Packages milestone acceptance gate passed: monorepo builds green across 14 packages, @napplet/nub/relay/types tree-shakes to a 39-byte bundle with zero registerNub and zero cross-domain refs, and all 9 deprecated @napplet/nub-<domain> shims type-round-trip cleanly.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-19T14:49:10Z
- **Completed:** 2026-04-19T14:52:56Z
- **Tasks:** 3 (all `type="auto"`, no checkpoints)
- **Files created:** 1 (this SUMMARY.md — zero first-party edits)

## Accomplishments

- **VER-01 SATISFIED.** `pnpm -r build` and `pnpm -r type-check` both exit 0 across "14 of 15 workspace projects" (the 15th is the repo root, which has no build/type-check scripts — correctly skipped). Phase 117 non-regression preserved: `packages/nub/dist/` still emits exactly 34 `.js` + 34 `.d.ts` entry-point files. Phase 118 non-regression preserved: all 9 `packages/nubs/<domain>/dist/index.js` shims are 2 lines (single `export * from "@napplet/nub/<domain>";` + sourcemap comment).
- **VER-02 SATISFIED.** A minimal consumer importing only `import type { RelaySubscribeMessage } from '@napplet/nub/relay/types'` bundled via `esbuild --bundle --minify --format=esm` produces a **39-byte** output (literally `var r=e=>e.subId;export{r as handler};`). Zero `registerNub` references. Zero runtime references to any of the 8 non-relay domains. Phase 117's `sideEffects: false` contract holds.
- **VER-03 SATISFIED.** All 9 deprecated `@napplet/nub-<domain>` packages round-trip their types correctly through the Phase 118 re-export shims. Every pinned-name consumer installs cleanly via `file:` deps and `tsc --noEmit` exits 0.
- **Zero changes to first-party code.** `git status --porcelain -- packages/ pnpm-lock.yaml ':(top)*.json'` returns empty. The only dirty files are planning artifacts under `.planning/`.

## Task Commits

1. **Task 1: VER-01 — monorepo build + type-check gate** — committed with plan metadata (no source changes)
2. **Task 2: VER-02 — tree-shake bundle test** — committed with plan metadata (no source changes)
3. **Task 3: VER-03 — 9-domain pinned-consumer smoke loop** — committed with plan metadata (no source changes)

**Plan metadata commit:** captured in the final `docs(121):` commit alongside `.planning/STATE.md`, `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md` updates. No per-task commits because this plan modifies zero first-party files — all three verifications produce artifacts only under `/tmp/` (cleaned up after evidence capture) and this single SUMMARY.md.

## Files Created/Modified

- `.planning/phases/121-verification-sign-off/121-01-SUMMARY.md` — this file; sole artifact of Phase 121.

No changes to any file under `packages/`, `pnpm-lock.yaml`, or root `*.json`.

---

## VER-01 — Monorepo Build + Type-Check Gate

### Exit codes

```
BUILD_EXIT=0
TYPECHECK_EXIT=0
```

### Workspace scope lines (from captured logs)

```
/tmp/napplet-ver01/build.log:Scope: 14 of 15 workspace projects
/tmp/napplet-ver01/type-check.log:Scope: 14 of 15 workspace projects
```

The 15th workspace project is the repo root (`/home/sandwich/Develop/napplet` itself, per `pnpm -r ls --depth -1 --parseable`). The root has no `build` or `type-check` script, so pnpm correctly scopes to the 14 packages that do: `@napplet/core`, `@napplet/nub`, `@napplet/shim`, `@napplet/sdk`, `@napplet/vite-plugin`, and 9 deprecated `@napplet/nub-<domain>` packages (`config`, `identity`, `ifc`, `keys`, `media`, `notify`, `relay`, `storage`, `theme`). All 14 pass both commands.

### Verbatim log excerpts

**Build tail** (last 15 lines):

```
packages/shim build: ESM dist/index.js     7.88 KB
packages/shim build: ESM dist/index.js.map 18.38 KB
packages/shim build: ESM ⚡️ Build success in 8ms
packages/nubs/theme build: DTS Build start
packages/sdk build: DTS Build start
packages/shim build: DTS Build start
packages/nubs/theme build: DTS ⚡️ Build success in 424ms
packages/nubs/theme build: DTS dist/index.d.ts 36.00 B
packages/nubs/theme build: Done
packages/shim build: DTS ⚡️ Build success in 518ms
packages/shim build: DTS dist/index.d.ts 128.00 B
packages/shim build: Done
packages/sdk build: DTS ⚡️ Build success in 566ms
packages/sdk build: DTS dist/index.d.ts 22.72 KB
packages/sdk build: Done
```

**Type-check tail** (last 15 lines):

```
packages/nubs/identity type-check: Done
packages/nubs/notify type-check$ tsc --noEmit
packages/nubs/relay type-check$ tsc --noEmit
packages/nubs/config type-check: Done
packages/nubs/storage type-check$ tsc --noEmit
packages/nubs/media type-check: Done
packages/nubs/theme type-check$ tsc --noEmit
packages/nubs/notify type-check: Done
packages/sdk type-check$ tsc --noEmit
packages/nubs/storage type-check: Done
packages/nubs/relay type-check: Done
packages/shim type-check$ tsc --noEmit
packages/nubs/theme type-check: Done
packages/sdk type-check: Done
packages/shim type-check: Done
```

Every `type-check: Done` line corresponds to a package whose `tsc --noEmit` returned 0 diagnostics.

### Non-regression checks

**Phase 117 baseline (@napplet/nub dist):**

```
find packages/nub/dist -name '*.js' ! -name 'chunk-*' ! -name '*.map' | wc -l  →  34
find packages/nub/dist -name '*.d.ts'                                   | wc -l  →  34
```

**Phase 118 baseline (deprecated shim line counts):**

```
config dist/index.js lines=2
identity dist/index.js lines=2
ifc dist/index.js lines=2
keys dist/index.js lines=2
media dist/index.js lines=2
notify dist/index.js lines=2
relay dist/index.js lines=2
storage dist/index.js lines=2
theme dist/index.js lines=2
```

(Line 1: `export * from "@napplet/nub/<domain>";` · Line 2: sourcemap comment `//# sourceMappingURL=index.js.map`.)

Sample verbatim shim (relay):

```
// src/index.ts
export * from "@napplet/nub/relay";
//# sourceMappingURL=index.js.map
```

### First-party edit check

```
git status --porcelain -- packages/ pnpm-lock.yaml ':(top)*.json'
# (empty output — zero first-party edits)
```

**VER-01 result: SATISFIED.**

---

## VER-02 — Tree-Shaking Bundle Test

### Harness

Built at `/tmp/napplet-treeshake-verify/`, installed via `npm install` (pnpm is not usable for file: deps outside a workspace), bundled with `npx -y esbuild@0.24 --bundle --minify --format=esm --platform=neutral --target=es2022 src/consumer.ts --outfile=bundle.js`.

`src/consumer.ts`:

```ts
// Types-only import from the relay subpath.
import type { RelaySubscribeMessage } from '@napplet/nub/relay/types';

export const handler = (msg: RelaySubscribeMessage): string => {
  return msg.subId;
};
```

`package.json` dependencies (both `file:` specifiers into the monorepo):

```json
{
  "@napplet/nub": "file:/home/sandwich/Develop/napplet/packages/nub",
  "@napplet/core": "file:/home/sandwich/Develop/napplet/packages/core"
}
```

### Assertion outputs

```
bundle_bytes=39
ASSERT_BYTES_LT_1024=PASS

registerNub_count=0
ASSERT_REGISTERNUB_EQ_0=PASS

cross_domain_hits[config]=0
cross_domain_hits[identity]=0
cross_domain_hits[ifc]=0
cross_domain_hits[keys]=0
cross_domain_hits[media]=0
cross_domain_hits[notify]=0
cross_domain_hits[storage]=0
cross_domain_hits[theme]=0
cross_domain_total=0
ASSERT_CROSS_EQ_0=PASS
```

All three assertions pass by wide margins:
- Bundle size is 39 bytes (< 1024 required) — the entire type import vanishes at build time.
- Zero `registerNub` calls — Phase 117's `sideEffects: false` + the fact that `types.ts` is runtime-pure (no side-effect imports) means esbuild correctly elides the relay barrel.
- Zero `"config" | 'config' | ... | 'theme'` string-literal matches across all 8 non-relay domains — no cross-domain code leaked into the bundle via shared chunks.

### Verbatim bundle.js (full body)

```
var r=e=>e.subId;export{r as handler};
```

That is the entire minified ESM bundle: a single arrow function `r` (the `handler` export) which returns `msg.subId`. The `RelaySubscribeMessage` type is erased. No runtime code from `@napplet/nub` is present because none is needed — the consumer only uses a type.

### esbuild output

```
  bundle.js  39b 

⚡ Done in 1ms
```

**VER-02 result: SATISFIED.**

---

## VER-03 — 9-Domain Pinned-Consumer Smoke Loop

### Harness pattern (9 instances)

For each `d` in `{config, identity, ifc, keys, media, notify, relay, storage, theme}`, stood up a fresh consumer at `/tmp/napplet-pinned-$d/` with:

- `package.json` with three `file:` dependencies: `@napplet/nub-$d`, `@napplet/nub`, `@napplet/core` (all pointing into the monorepo). The deprecated shim only declares `@napplet/nub: workspace:*`, which npm cannot resolve outside the workspace — the harness supplies the canonical package directly.
- Minimal `tsconfig.json` with `strict: true`, `moduleResolution: bundler`, `noEmit: true`.
- Generated `src/consumer.ts` that imports 1–2 representative named exports from the deprecated `@napplet/nub-<domain>` name, forces them into runtime/type references so `tsc` can't elide them, and re-exports the references.

### Result table (9/9 PASS)

| Domain   | Runtime import            | Type import                                  | tsc exit | Status   |
|----------|---------------------------|----------------------------------------------|:--------:|:--------:|
| config   | `installConfigShim`       | `NappletConfigSchema`, `ConfigValues`        | 0        | **PASS** |
| identity | `installIdentityShim`     | `IdentityGetPublicKeyMessage`                | 0        | **PASS** |
| ifc      | `installIfcShim`          | `IfcEventMessage`                            | 0        | **PASS** |
| keys     | `installKeysShim`         | `KeysRegisterActionMessage`                  | 0        | **PASS** |
| media    | `installMediaShim`        | `MediaSessionCreateMessage`, `MediaMetadata` | 0        | **PASS** |
| notify   | `installNotifyShim`       | `NotifySendMessage`                          | 0        | **PASS** |
| relay    | `installRelayShim`        | `RelaySubscribeMessage`                      | 0        | **PASS** |
| storage  | `installStorageShim`      | `StorageGetMessage`                          | 0        | **PASS** |
| theme    | _(none — types-only)_     | `ThemeGetMessage`, `Theme`                   | 0        | **PASS** |

```
[config] TSC_PASS
[identity] TSC_PASS
[ifc] TSC_PASS
[keys] TSC_PASS
[media] TSC_PASS
[notify] TSC_PASS
[relay] TSC_PASS
[storage] TSC_PASS
[theme] TSC_PASS

pass=9
fail=0
VER-03 = PASS
```

### Substitutions vs the CONTEXT.md-suggested names

The plan's `<interfaces>` block flagged two substitutions vs the looser names in `121-CONTEXT.md`. Both are confirmed correct against `packages/nub/src/*/types.ts`:

| Domain  | CONTEXT suggestion          | Authoritative export used                    |
|---------|-----------------------------|----------------------------------------------|
| config  | `NappletConfig`             | `NappletConfigSchema`                        |
| media   | `MediaCreateSessionMessage` | `MediaSessionCreateMessage`                  |

No other substitutions were needed — every other CONTEXT-suggested export name resolved as-written.

### Theme special case

The theme harness omits the runtime installer import (theme has no `shim.ts` / no `sdk.ts` per Phase 117 Option A — it is a barrel-only, types-only domain). Only the 2-type import line is emitted. `tsc --noEmit` still exits 0 because `@napplet/nub-theme`'s 1-line re-export (`export * from '@napplet/nub/theme'`) correctly forwards the `ThemeGetMessage` and `Theme` type declarations through the Phase 117 canonical types file.

Theme consumer.ts:

```ts
import type { ThemeGetMessage, Theme } from "@napplet/nub-theme";

export const _type_ThemeGetMessage: ThemeGetMessage = undefined as any as ThemeGetMessage;
export const _type_Theme: Theme = undefined as any as Theme;
```

**VER-03 result: SATISFIED.**

---

## Phase 121 Result: PASSED

All 7 truths in `must_haves.truths` verified:

1. **VER-01** — `pnpm -r build` exit 0 across 14 workspace packages. ✓
2. **VER-01** — `pnpm -r type-check` exit 0 across 14 workspace packages. ✓
3. **VER-02** — `@napplet/nub/relay/types` consumer bundles to 39 bytes (< 1024). ✓
4. **VER-02** — Zero `registerNub` refs in bundle. ✓
5. **VER-02** — Zero runtime references to any of the 8 non-relay domains. ✓
6. **VER-03** — 9/9 deprecated `@napplet/nub-<domain>` shims type-check cleanly via pinned consumers. ✓
7. **First-party non-regression** — `git status --porcelain -- packages/ pnpm-lock.yaml ':(top)*.json'` empty. ✓

v0.26.0 Better Packages is ready for `/gsd:verify-work 121` and milestone retrospective.

---

## Decisions Made

- **Tree-shake harness uses esbuild 0.24 via npx.** Per CONTEXT.md: a clear, minimal bundler is the right evidence for the sideEffects:false contract. esbuild's `--bundle --minify --format=esm --platform=neutral` produces a single output file that's trivial to byte-count and grep. No need for Vite or webpack ceremony for this proof.
- **npm (not pnpm) for out-of-tree harnesses.** `pnpm` refuses to cleanly resolve `file:` deps outside the monorepo workspace. The harness lives in `/tmp/napplet-*` and consumes the packages as external `file:` installs — `npm install` handles this out of the box.
- **Local `node_modules/.bin/tsc` (not `npx tsc@5.9.3`).** The plan's as-written `npx -y tsc@5.9.3 --noEmit` is broken because `tsc` is not a standalone npm package — it's the CLI inside the `typescript` package. Fixed by invoking each harness's local `node_modules/.bin/tsc` (installed via the `typescript: "^5.9.3"` devDependency). Confirmed version 5.9.3 on all 9 harnesses before running. (See Deviations section below.)

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] Plan's `npx -y tsc@5.9.3 --noEmit` command is non-functional**

- **Found during:** Task 3 (VER-03 9-domain smoke loop)
- **Issue:** The plan's action block and the `<verify><automated>` gate both invoke `npx -y tsc@5.9.3 --noEmit`. `tsc` is not a standalone npm package — no version exists on the registry. `npx` returned `npm error code ETARGET / No matching version found for tsc@5.9.3`. All 9 harnesses failed this way on the first pass (not a type error; an infrastructure error).
- **Fix:** Invoked each harness's local `node_modules/.bin/tsc` directly. The harness `devDependencies` already declares `typescript: "^5.9.3"`, so `npm install` correctly places a working `tsc` v5.9.3 at `node_modules/.bin/tsc`. Verified version on all 9 harnesses before re-running.
- **Files modified:** None in the repo — only the in-task command invocation.
- **Verification:** All 9 harnesses reported `Version 5.9.3` and then `tsc --noEmit` exit 0. Matches the plan's intent exactly (TypeScript 5.9.3 strict type-check).
- **Commit:** No separate commit — this is a command-level fix for a broken invocation string; the outcome (9/9 TSC_PASS) is the same as the plan intended.

---

**Total deviations:** 1 auto-fixed (1 blocking infrastructure fix).
**Impact on plan:** Zero — the plan's intent (tsc 5.9.3 strict no-emit type-check across 9 domains) was fully achieved; only the invocation method changed.

## Issues Encountered

None beyond the single Rule 3 deviation documented above.

## User Setup Required

None — no external service configuration required.

## Commands Run (audit log)

All commands run from `/home/sandwich/Develop/napplet` unless noted.

```bash
# VER-01
mkdir -p /tmp/napplet-ver01
pnpm -r build 2>&1 | tee /tmp/napplet-ver01/build.log                            # exit 0
pnpm -r type-check 2>&1 | tee /tmp/napplet-ver01/type-check.log                  # exit 0
grep -E "Scope: [0-9]+ of [0-9]+ workspace projects" /tmp/napplet-ver01/*.log
find packages/nub/dist -name '*.js' ! -name 'chunk-*' ! -name '*.map' | wc -l    # → 34
find packages/nub/dist -name '*.d.ts' | wc -l                                    # → 34
for d in config identity ifc keys media notify relay storage theme; do
  wc -l < "packages/nubs/$d/dist/index.js"                                       # → 2 each
done
git status --porcelain -- packages/ pnpm-lock.yaml ':(top)*.json'                # → empty

# VER-02
HARNESS=/tmp/napplet-treeshake-verify
mkdir -p "$HARNESS/src"
# (wrote package.json, tsconfig.json, src/consumer.ts per plan)
cd "$HARNESS" && npm install --silent --no-audit --no-fund --prefer-offline      # exit 0
npx -y esbuild@0.24 --bundle --minify --format=esm --platform=neutral \
  --target=es2022 src/consumer.ts --outfile=bundle.js                            # exit 0; 39 bytes
wc -c < bundle.js                                                                # → 39
grep -c "registerNub" bundle.js                                                  # → 0
for d in config identity ifc keys media notify storage theme; do
  grep -c -E "\"$d\"|'$d'" bundle.js                                             # → 0 each
done

# VER-03 (9 domains)
for d in config identity ifc keys media notify relay storage theme; do
  HARNESS="/tmp/napplet-pinned-$d"
  mkdir -p "$HARNESS/src"
  # (wrote package.json, tsconfig.json, src/consumer.ts per plan + domain imports)
  cd "$HARNESS" && npm install --silent --no-audit --no-fund --prefer-offline    # exit 0
  "$HARNESS/node_modules/.bin/tsc" --noEmit                                      # exit 0  ← Rule 3 fix
done
```

## Next Phase Readiness

- **Milestone closure unblocked.** v0.26.0 Better Packages is feature-complete and acceptance-verified end-to-end. All 5 phases (117, 118, 119, 120, 121) have passed their VERIFICATION.md gates or will in the next verifier run.
- **Ready for:** `/gsd:verify-work 121` → then `/gsd:complete-milestone` to archive the milestone and promote v0.26.0 to Shipped.
- **No blockers or concerns from this phase.** Pre-existing milestone-level blockers remain: `PUB-04` (npm publish human auth), `RES-01` (NIP number conflict) — neither in scope for this verification gate.

---

## Self-Check: PASSED

- `.planning/phases/121-verification-sign-off/121-01-SUMMARY.md` exists on disk.
- Required headers confirmed: `## VER-01`, `## VER-02`, `## VER-03`, `## Phase 121 Result: PASSED` (4/4).
- Phase-level `git status --porcelain -- packages/ pnpm-lock.yaml ':(top)*.json'` returns empty — zero first-party edits.
- All `/tmp/napplet-ver01/`, `/tmp/napplet-treeshake-verify/`, `/tmp/napplet-pinned-<domain>/` (×9), and `/tmp/napplet-ver03-*.txt|*.log` harness artifacts cleaned up after evidence capture.
- No task-level per-commit hashes in this plan: zero first-party files were modified, so no per-task commits were made; the single `docs(121):` plan metadata commit captures SUMMARY.md + STATE.md + ROADMAP.md + REQUIREMENTS.md.

---

*Phase: 121-verification-sign-off*
*Completed: 2026-04-19*
