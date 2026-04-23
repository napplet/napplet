---
phase: 135-first-party-types-sdk-plumbing
plan: 04
subsystem: verification
tags: [verification, gating-gate, tree-shake, esbuild, symbol-absence, ver-01, ver-05, types-06, workspace-build, workspace-type-check]

# Dependency graph
requires:
  - phase: 135
    plan: 01
    provides: "Types layer — UnsignedEvent + Rumor on @napplet/core; IdentityDecryptMessage / .result / .error + IdentityDecryptErrorCode on @napplet/nub/identity; NappletGlobal.identity.decrypt method type"
  - phase: 135
    plan: 02
    provides: "Shim runtime — decrypt(event) function + identity.decrypt.result branch in @napplet/nub/identity/shim; window.napplet.identity.decrypt mount on @napplet/shim"
  - phase: 135
    plan: 03
    provides: "SDK runtime — identityDecrypt bare-name helper on @napplet/nub/identity; identity.decrypt namespace method + Rumor/UnsignedEvent + 4 decrypt types + identityDecrypt helper re-exports on @napplet/sdk"
  - phase: 134
    plan: 01
    provides: "v0.28.0 VER-07 tree-shake methodology (74-byte precedent; symbol-absence as the load-bearing signal rather than byte-count)"
provides:
  - "Phase 135 shipping-gate stamp: VER-01 workspace-wide `pnpm -r build` + `pnpm -r type-check` both exit 0 across 14 packages"
  - "TYPES-06 discriminated-union exhaustiveness + type-check closure stamp (same gate as VER-01)"
  - "VER-05 identity-types-only tree-shake bundle empirically proven: 129-byte bundle contains ZERO occurrences of all 7 forbidden runtime symbols (handleIdentityMessage, installIdentityShim, identityDecrypt, identityGetPublicKey, sendRequest, requireIdentity, pendingRequests)"
  - "Built dist artifacts on disk (packages/nub/dist/identity/{shim.js, sdk.js, types.d.ts, index.js}) confirmed reflect Plans 01–03 additions"
  - "Evidence logs persisted to /tmp/ per AGENTS.md — zero home-directory pollution, zero repo .log files committed"
affects:
  - 137  # Public NUB-IDENTITY amendment authors may cite shipped, verified first-party surface (not hypothetical code)
  - 138  # Docs sweep (README / SKILL.md) layers on verified surface; VER-06 grep gate downstream

# Tech tracking
tech-stack:
  added: []  # verification-only; zero source changes; zero new runtime deps
  patterns:
    - "Symbol-absence tree-shake methodology (v0.28.0 VER-07 precedent): bundle types-only consumer with esbuild --tree-shaking=true, grep for forbidden runtime symbol names, assert all COUNT=0 — bundle size is informational, not the gate"
    - "Evidence-logs-to-/tmp/ for verification plans (AGENTS.md no-home-pollution rule): every artifact path in the plan's frontmatter files_modified resolves under /tmp/, giving the plan zero repo footprint prior to the final SUMMARY/STATE/ROADMAP commit"
    - "Bundle size comparison point preserved: v0.28.0 VER-07 relay-types-only bundle = 74 bytes (makeStub function only); v0.29.0 VER-05 identity-types-only bundle = 129 bytes (2 makeStub functions). Byte-count drift is expected and not load-bearing; symbol-absence is"

key-files:
  created:
    - "/tmp/napplet-135-ver-01.log — BUILD_EXIT + TC_EXIT + PACKAGE_COUNT + tails of underlying logs"
    - "/tmp/napplet-135-ver-01-build.log — raw pnpm -r build output (all 14 packages)"
    - "/tmp/napplet-135-ver-01-typecheck.log — raw pnpm -r type-check output (all 14 packages)"
    - "/tmp/napplet-135-ver-05-treeshake/ — tree-shake consumer fixture (package.json, entry.ts, node_modules/@napplet/{nub,core}, bundle.js, esbuild.err)"
    - "/tmp/napplet-135-ver-05-treeshake.log — bundle inspection: size + content + per-symbol grep counts + VER05_EXIT"
  modified: []  # no source files modified in this plan

key-decisions:
  - "Task 1 produced no repo deltas (evidence lives entirely in /tmp/ per AGENTS.md) — atomic per-task commit for Task 1 is skipped; no staged changes"
  - "Task 2 likewise produced no repo deltas — tree-shake fixture entirely under /tmp/napplet-135-ver-05-treeshake/"
  - "Symbol-absence (not byte-count) is the load-bearing signal for VER-05 — 129-byte identity-types-only bundle vs 74-byte relay-types-only precedent reflects 2 stub functions vs 1, not a regression"
  - "VER-01 + TYPES-06 + VER-05 collapse into 2 execution steps (one workspace build+tc pair, one esbuild fixture) because Plans 02–03 already empirically landed workspace green state as a side effect"

patterns-established:
  - "For verification-only plans: record all artifacts under /tmp/ via paths declared in the plan frontmatter (plan metadata carries paths; AGENTS.md prohibits home/repo pollution). Final SUMMARY + STATE + ROADMAP commit is the only repo-touching step."
  - "Tree-shake symbol-absence test template for additive first-party-surface phases: (1) copy packages/{nub,core}/dist into a fixture node_modules/@napplet/ tree; (2) entry.ts imports ONLY `<package>/<subpath>/types`; (3) esbuild --bundle --format=esm --platform=neutral --tree-shaking=true; (4) grep for every runtime symbol from shim.js and sdk.js by name; (5) assert all COUNT=0. Byte count is informational."

requirements-completed: [TYPES-06, VER-01, VER-05]

# Metrics
duration: 2min
completed: 2026-04-23
---

# Phase 135 Plan 04: Shipping-Gate Verification — Workspace Build + Tree-Shake Symbol Absence Summary

**Stamped Phase 135 shipping gates: `pnpm -r build` + `pnpm -r type-check` both exit 0 across 14 packages (VER-01 + TYPES-06); identity-types-only esbuild tree-shake bundle is 129 bytes and contains ZERO occurrences of 7 forbidden runtime symbols (VER-05). All evidence under `/tmp/` per AGENTS.md; zero repo source changes.**

## Performance

- **Duration:** ~2 min (start 2026-04-23T11:50:24Z → end 2026-04-23T11:52:11Z, 107s)
- **Started:** 2026-04-23T11:50:24Z
- **Completed:** 2026-04-23T11:52:11Z
- **Tasks:** 2
- **Files modified (repo):** 0 — verification-only plan; evidence lives at `/tmp/napplet-135-*`

## Accomplishments

- **VER-01 stamped pass.** Workspace-wide `pnpm -r build` exits 0 across all 14 packages (5 first-party + 9 deprecated nubs re-export shims). `pnpm -r type-check` exits 0 across the same 14 packages. `PACKAGE_COUNT=14` cross-check recorded in `/tmp/napplet-135-ver-01.log`.
- **TYPES-06 stamped pass.** Same workspace-wide `pnpm -r type-check` gate (discriminated-union exhaustiveness closed across `IdentityRequestMessage` 10-member and `IdentityResultMessage` 11-member unions after Plan 01's additions, shim/sdk runtime bindings after Plans 02–03).
- **VER-05 stamped pass.** Identity-types-only consumer bundled with esbuild 0.28.0 via `--tree-shaking=true --format=esm --platform=neutral` produces a 129-byte bundle containing only the two no-op stub functions (`makeStub1`, `makeStub2`) and the ESM `export { ... }` block. All 7 forbidden runtime symbols report COUNT=0.
- **Built dist artifacts confirmed current on disk.** `packages/nub/dist/identity/{shim.js,sdk.js,types.d.ts,index.js}` all present after the Task 1 build pass, matching Plans 01–03 additions (decrypt function in shim.js; identityDecrypt in sdk.js; 4 new interfaces + IdentityDecryptErrorCode in types.d.ts).
- **Zero home-directory pollution.** All 5 evidence artifacts live under `/tmp/napplet-135-*` per AGENTS.md. Zero `.log` files committed to repo.

## Task Commits

This plan is verification-only — **Tasks 1 and 2 each produced zero repo changes** (all evidence lives under `/tmp/` per the plan's `files_modified` frontmatter and AGENTS.md no-pollution rule). Atomic per-task commits were therefore skipped — there was nothing to stage. The only repo-touching commit is the final plan-metadata commit that captures this SUMMARY.md + STATE.md + ROADMAP.md + REQUIREMENTS.md.

**Plan metadata commit:** (captured below after commit)

## Files Created/Modified

### Evidence files (under /tmp/ — not committed; cleaned on reboot per AGENTS.md)

- `/tmp/napplet-135-ver-01.log` — BUILD_EXIT=0, TC_EXIT=0, PACKAGE_COUNT=14, plus 20-line tails of underlying build and type-check output.
- `/tmp/napplet-135-ver-01-build.log` — Full `pnpm -r build` output (14 packages; success across all).
- `/tmp/napplet-135-ver-01-typecheck.log` — Full `pnpm -r type-check` output (14 packages; `Done` across all).
- `/tmp/napplet-135-ver-05-treeshake/` — Fixture directory:
  - `package.json` — `file:` dependency on `packages/nub`; `esbuild` dev dep
  - `entry.ts` — 4 lines: 2 type-only imports from `@napplet/nub/identity/types` + 2 `makeStub*` exports
  - `node_modules/@napplet/nub/{dist,package.json}` — copied from the repo
  - `node_modules/@napplet/core/{dist,package.json}` — copied from the repo
  - `node_modules/.bin/esbuild` — installed via `npm install --no-save esbuild`
  - `bundle.js` — 129 bytes; the tree-shake output
  - `esbuild.err` — empty (clean build, `⚡ Done in 1ms`)
- `/tmp/napplet-135-ver-05-treeshake.log` — Bundle inspection: size + full content + esbuild stderr + per-symbol grep counts + `VER05_EXIT=0` stamp.

### Repo files modified by this plan

**None.** Source code, dist artifacts, planning documents, and configuration are all byte-identical to pre-plan state. The SUMMARY.md below (this document), STATE.md position advance, ROADMAP.md progress update, and REQUIREMENTS.md traceability updates are the only repo writes — all handled in the single plan-metadata commit per GSD convention.

## Decisions Made

- **Symbol-absence over byte-count.** The 129-byte identity-types-only bundle is larger than v0.28.0's 74-byte relay-types-only precedent — but entry.ts here declares TWO stub functions (`makeStub1` for `IdentityDecryptMessage`, `makeStub2` for `IdentityGetPublicKeyMessage` as the regression canary), while the v0.28.0 fixture declared one. The extra 55 bytes is two `function makeStub2() { return null; }` + one `export { ... }` member — all non-identity-runtime. Symbol absence is the load-bearing signal per v0.28.0 STATE.md decision; the `VER-05` acceptance clause in `REQUIREMENTS.md:85` explicitly phrases the contract as "identity-types-only consumer does not pull shim/sdk runtime symbols" rather than a byte cap.
- **No per-task commits.** This is an execute plan with verification-only tasks (both tasks' `files_modified` frontmatter entries resolve under `/tmp/`). Staging and committing evidence logs to the repo would violate AGENTS.md's no-pollution rule; staging nothing means no per-task commit is possible. Final plan-metadata commit carries the SUMMARY / STATE / ROADMAP / REQUIREMENTS updates atomically.
- **Regression canary in the fixture.** `entry.ts` imports `IdentityGetPublicKeyMessage` in addition to the new `IdentityDecryptMessage` — this lets the identical fixture prove BOTH the new surface AND the existing pre-Plan-01 surface tree-shake cleanly. If Plan 01's changes had accidentally leaked a value-level import into the existing types.ts surface, `identityGetPublicKey: 0` would have regressed to nonzero. It did not.
- **esbuild 0.28.0 via `npm install --no-save`.** System `esbuild` is not on PATH; the plan's fallback-install branch fired and installed esbuild into `/tmp/napplet-135-ver-05-treeshake/node_modules/.bin/esbuild` (same methodology as v0.28.0 Phase 134 VER-07). No repo `package.json` was touched.

## Deviations from Plan

None — plan executed exactly as written. No auto-fixed bugs, no missing critical functionality gaps, no blocking issues, no architectural changes, no authentication gates.

The only notable execution friction was the shell-specific detail that `${PIPESTATUS[0]}` semantics differ between zsh (default login shell on this system) and bash — the plan's inline commands assumed bash, so the first attempt captured empty exit codes. Resolution was to invoke the capture block under an explicit `bash -c '...'` wrapper, which gave reliable `$?` values for both the build and type-check phases. This is execution hygiene, not a plan deviation; the captured numbers (`BUILD_EXIT=0`, `TC_EXIT=0`) are identical to what the zsh-run attempt would have produced with correct syntax.

## Issues Encountered

- **Shell-dialect friction on exit-code capture.** As noted above: zsh's `${PIPESTATUS[0]}` behavior differed from bash expectation. Resolved by wrapping the capture in `bash -c '...'`. Zero functional impact — the underlying `pnpm -r build` and `pnpm -r type-check` invocations both genuinely exited 0.
- **esbuild not on system PATH.** Expected per the plan; fallback branch (`npm install --no-save esbuild`) executed cleanly. Installed esbuild 0.28.0.

## VER-01 / TYPES-06 Evidence Summary (Task 1)

As required by plan `<output>` spec:

| Metric         | Value | Source                                 |
| -------------- | ----- | -------------------------------------- |
| `BUILD_EXIT`   | `0`   | `/tmp/napplet-135-ver-01.log` line 1   |
| `TC_EXIT`      | `0`   | `/tmp/napplet-135-ver-01.log` line 2   |
| `PACKAGE_COUNT`| `14`  | `ls packages/*/package.json packages/nubs/*/package.json \| wc -l` |

All 14 packages build and type-check clean:

- `@napplet/core`, `@napplet/nub`, `@napplet/sdk`, `@napplet/shim`, `@napplet/vite-plugin` (5 first-party)
- `@napplet/nub-config`, `@napplet/nub-identity`, `@napplet/nub-ifc`, `@napplet/nub-keys`, `@napplet/nub-media`, `@napplet/nub-notify`, `@napplet/nub-relay`, `@napplet/nub-storage`, `@napplet/nub-theme` (9 deprecated re-export shims)

Built dist artifact presence confirmed (Task 1 `<verify>` automated check):

- `packages/nub/dist/identity/shim.js` — present
- `packages/nub/dist/identity/types.d.ts` — present
- `packages/nub/dist/identity/sdk.js` — present
- `packages/nub/dist/identity/index.js` — present

## VER-05 Evidence Summary (Task 2)

**Bundle size:** 129 bytes (informational; v0.28.0 VER-07 relay-types-only precedent was 74 bytes with 1 stub function — the 55-byte delta is the second `makeStub2` regression-canary function).

**Bundle content (full, 129 bytes):**

```javascript
// entry.ts
function makeStub1() {
  return null;
}
function makeStub2() {
  return null;
}
export {
  makeStub1,
  makeStub2
};
```

**esbuild stderr:** Clean — no warnings, no errors. `⚡ Done in 1ms`.

### Forbidden runtime symbol table (MUST all be COUNT=0)

| Symbol                   | Count | Origin                                      | Canary significance                                                                                                                 |
| ------------------------ | ----- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `handleIdentityMessage`  | **0** | `packages/nub/src/identity/shim.ts` central dispatcher | Core shim routing function — would signal full shim module leaked                                                                    |
| `installIdentityShim`    | **0** | `packages/nub/src/identity/shim.ts` installer          | Shim install entry — would signal shim module leaked                                                                                 |
| `identityDecrypt`        | **0** | `packages/nub/src/identity/sdk.ts` (Plan 03) bare-name helper | NEW surface added Plan 03 — would signal SDK module leaked to types-only consumer                                                    |
| `identityGetPublicKey`   | **0** | `packages/nub/src/identity/sdk.ts` pre-existing | Regression canary — this helper existed pre-Plan-01; still 0 ⇒ Plan 01's type additions did NOT accidentally couple existing types to sdk |
| `sendRequest`            | **0** | `packages/nub/src/identity/shim.ts` internal helper | Shim internal — would signal shim module leaked                                                                                      |
| `requireIdentity`        | **0** | `packages/nub/src/identity/sdk.ts` internal guard | SDK internal — would signal SDK module leaked                                                                                        |
| `pendingRequests`        | **0** | `packages/nub/src/identity/shim.ts` module-level Map | Shim runtime state — would signal shim module leaked                                                                                 |

**`VER05_EXIT=0`** stamped at the tail of `/tmp/napplet-135-ver-05-treeshake.log`.

### Bundle size comparison (v0.28.0 VER-07 precedent vs. v0.29.0 VER-05 current)

| Milestone | Test                          | Stubs | Bundle size | Symbol-absence contract |
| --------- | ----------------------------- | ----- | ----------- | ----------------------- |
| v0.28.0 (Phase 134) | relay-types-only tree-shake | 1 | 74 bytes    | PASS (per v0.28.0 SUMMARY §132) |
| v0.29.0 (this plan) | identity-types-only tree-shake | 2 | 129 bytes   | **PASS** (7 symbols × COUNT=0) |

The byte delta (74 → 129 = +55) matches a second stub function (one identifier, one body, one export member). Neither fixture carries more than ~30 bytes of per-stub overhead after esbuild's tree-shake+minify-identifiers pass. Symbol absence remains the contract; byte count is documentary.

## Confirmations for Downstream Plans / Phases

- **Phase 137 may cite shipped, verified first-party surface.** The v0.29.0 NUB-IDENTITY amendment authors can point at specific line numbers in `packages/nub/src/identity/{types.ts, shim.ts, sdk.ts}` and `packages/sdk/src/index.ts` as live, type-checked, tree-shake-clean implementations of the envelope triad. Not hypothetical code.
- **Phase 138 docs may cite by named import.** `import { identityDecrypt } from '@napplet/sdk'` and `import { identity } from '@napplet/sdk'; identity.decrypt(event)` and `import type { IdentityDecryptMessage, IdentityDecryptErrorCode, Rumor } from '@napplet/sdk'` — all resolve cleanly post-build.
- **Phase 136 (empirical CSP) may proceed in parallel.** Phase 135 is now effectively frozen as a shipping-gate pass; Phase 137 waits on BOTH 135 and 136, so parallel execution of 136 is unblocked.
- **Tree-shake contract preserved across milestone-level additions.** v0.28.0 VER-07 (relay publishEncrypted) established symbol-absence as the contract; v0.29.0 VER-05 reaffirms it at the identity NUB. For future phases adding first-party surface to an existing NUB, the template in this plan's frontmatter files_modified is directly reusable (copy fixture, swap NUB name + symbol list, run).

## User Setup Required

None — verification-only plan; no new services, no credentials, no sudo commands, no npm/config changes.

## Next Phase Readiness

- **Phase 135 is ready for Phase 137 consumption.** Shipping gates are stamped; amendment authors have a verified first-party reference to cite.
- **Phase 136 (Empirical CSP Injection-Block Verification) may be planned in parallel with this phase.** 136 is independent (empirical Playwright fixture only; does not touch SDK surface).
- **Phase 137 blocks on both 135 (this phase) AND 136** — per STATE.md dependency graph (135 ‖ 136 → 137 → 138). 137 MUST wait until 136 also lands.
- **No blockers introduced.** Workspace is green; dist artifacts reflect all Plan 01–03 additions; tree-shake regression canary (`identityGetPublicKey: 0`) confirms the existing pre-Plan-01 surface is also still clean.

## Self-Check: PASSED

- `/tmp/napplet-135-ver-01.log` exists and contains `BUILD_EXIT=0` — FOUND
- `/tmp/napplet-135-ver-01.log` contains `TC_EXIT=0` — FOUND
- `/tmp/napplet-135-ver-01.log` contains `PACKAGE_COUNT=14` — FOUND
- `/tmp/napplet-135-ver-01-build.log` exists — FOUND
- `/tmp/napplet-135-ver-01-typecheck.log` exists — FOUND
- `/tmp/napplet-135-ver-05-treeshake/bundle.js` exists (129 bytes) — FOUND
- `/tmp/napplet-135-ver-05-treeshake.log` exists and contains `VER05_EXIT=0` — FOUND
- `/tmp/napplet-135-ver-05-treeshake.log` contains `handleIdentityMessage: 0`, `installIdentityShim: 0`, `identityDecrypt: 0`, `identityGetPublicKey: 0`, `sendRequest: 0`, `requireIdentity: 0`, `pendingRequests: 0` — ALL FOUND
- `packages/nub/dist/identity/shim.js` exists — FOUND
- `packages/nub/dist/identity/types.d.ts` exists — FOUND
- `packages/nub/dist/identity/sdk.js` exists — FOUND
- `packages/nub/dist/identity/index.js` exists — FOUND
- Zero repo source files modified by this plan (`git status --short` shows only the SUMMARY/STATE/ROADMAP/REQUIREMENTS delta) — VERIFIED
- Zero new files under `/home/sandwich/` (outside `Develop/`) — VERIFIED

---
*Phase: 135-first-party-types-sdk-plumbing*
*Completed: 2026-04-23*
