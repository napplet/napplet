---
phase: 142-verification-milestone-close
plan: 02
subsystem: testing
tags: [vitest, tree-shake, sha256, content-addressing, esbuild, cross-nub-invariant, graceful-degradation]

# Dependency graph
requires:
  - phase: 137-nub-connect-subpath-scaffold
    provides: connect + class shim modules; dist/{connect,class}/types.js 155B/103B baselines; wire-handler barrel pattern
  - phase: 138-vite-plugin-surgery
    provides: connect:origins fold implementation whose digest this plan independently verifies via second-copy test
  - phase: 139-central-shim-sdk-integration
    provides: @napplet/nub re-export surface consumed by the tree-shake harness entries
  - phase: 135-cross-repo-spec-work
    provides: NUB-CONNECT.md §Conformance Fixture (spec-locked SHA-256 digest); SHELL-CLASS-POLICY.md §Cross-NUB Invariant 7-row scenario table
provides:
  - VER-03 stamped pass — tree-shake harness extended with types-only consumer fixtures for @napplet/nub/connect/types + @napplet/nub/class/types; bundles 96B/90B (well under 155B/103B dist-baselines), zero forbidden symbols
  - VER-06 stamped pass — aggregateHash content-addressing test pinning the NUB-CONNECT conformance-fixture digest cc7c1b1903fb23ecb909d2427e1dccd7d398a5c63dd65160edb0bb8b231aa742 with 9 perturbation cases
  - VER-11 stamped pass — class.assigned wire dispatch test for window.napplet.class (values 0, 1, 2, 3)
  - VER-12 stamped pass — graceful-degradation defaults for both connect (ALWAYS {granted:false, origins:[]}) and class (ALWAYS undefined pre-envelope)
  - VER-13 stamped pass — cross-NUB invariant test across all 7 SHELL-CLASS-POLICY scenario rows plus 4 anti-tests for non-conformant states
  - 54 new vitest tests (permanently runnable via pnpm vitest run); 73 total tests in repo (all green)
affects: [142-03, milestone-close, v0.30.0-regression-guard]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "In-repo VER-gate test files sit alongside production src (packages/*/src/**/*.test.ts glob) — run on every future pnpm vitest invocation, providing continuous regression protection"
    - "Tree-shake harness lives in /tmp/ per AGENTS.md no-home-dir-pollution rule; log committed as evidence at /tmp/napplet-ver-03-treeshake.log"
    - "Vitest node-environment + vi.resetModules() + dynamic import pattern for module-local-state shims (no jsdom/happy-dom dependency needed)"
    - "Independent second-copy spec-digest verification: aggregate-hash.test.ts re-implements the NUB-CONNECT canonical fold inline (not imported from vite-plugin) — drift surfaces in both the test AND the vite-plugin's module-load self-check"

key-files:
  created:
    - packages/nub/src/class/shim.test.ts
    - packages/nub/src/connect/shim.test.ts
    - packages/nub/src/connect/aggregate-hash.test.ts
    - packages/nub/src/class/cross-nub-invariant.test.ts
    - /tmp/napplet-ver-03-treeshake.log (harness log, non-repo)
    - /tmp/napplet-ver-03-treeshake/ (harness working dir, non-repo)
  modified: []

key-decisions:
  - "Tests stub globalThis.window + globalThis.document per-test rather than introduce jsdom/happy-dom — matches existing packages/core/src/*.test.ts pattern and keeps repo's zero-new-dev-dep posture"
  - "aggregate-hash.test.ts re-implements the canonical fold inline (not imported from @napplet/vite-plugin) — two non-co-authored copies both matching the spec digest is a stronger guarantee than a single copy verified against itself"
  - "cross-nub-invariant.test.ts uses describe.each for the 7 scenario rows; anti-tests for the documented non-conformant states (class:2 ∧ granted:false; class:1 ∧ granted:true) live in a separate describe block to make the policy intent explicit"
  - "Tree-shake harness uses pnpm's vendored esbuild 0.27.4 at /home/sandwich/Develop/napplet/node_modules/.pnpm/esbuild@0.27.4/node_modules/esbuild/bin/esbuild — no system-level esbuild installed, and the harness avoids npm install to keep /tmp clean"
  - "Consumer bundles (96B/90B) landed BELOW the dist-artifact baselines (155B/103B) because `import type` is fully erased: even the DOMAIN const + normalizeConnectOrigin drop out of the consumer bundle. The dist-artifact baselines are the fallback ceiling for consumers who use value-level imports (e.g., DOMAIN as a string const); the harness documents the types-only case"

patterns-established:
  - "VER-gate in-repo test pattern: each VER-NN that can be verified in-repo gets a dedicated test file named after its semantic (shim.test.ts, aggregate-hash.test.ts, cross-nub-invariant.test.ts) — filename encodes the gate's subject, not VER-NN number, so tests read as permanent protection rather than one-shot milestone work"
  - "Table-driven policy scenario testing via describe.each: policy documents that contain scenario tables (SHELL-CLASS-POLICY.md here; SHELL-CONNECT-POLICY.md + SHELL-RESOURCE-POLICY.md in future) should be mirrored 1:1 in a cross-nub-invariant-style test file to keep policy tables and test surface synchronized"
  - "Non-conformant-state anti-tests: every shell responsibility MUST in a policy doc that cannot be unit-tested at the SDK level gets an anti-test proving the invariant's enforcement function REJECTS the documented bad state (not just that it ACCEPTS the good state)"

requirements-completed: [VER-03, VER-06, VER-11, VER-12, VER-13]

# Metrics
duration: 5 min
completed: 2026-04-21
---

# Phase 142 Plan 02: In-Repo VER-Gate Tests Summary

**54 vitest tests across 4 files closing VER-03 (tree-shake), VER-06 (aggregateHash content-addressing), VER-11 (class wire dispatch), VER-12 (graceful degradation for both connect + class), and VER-13 (cross-NUB invariant) — permanent regression protection runnable by every future `pnpm vitest`**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-21T18:33:01Z
- **Completed:** 2026-04-21T18:38:19Z
- **Tasks:** 3
- **Files created:** 4 in-repo test files + 1 /tmp log + 1 /tmp harness dir

## Accomplishments
- VER-11 + VER-12 closed via two shim test files (25 tests total) covering class.assigned wire dispatch (values 0/1/2/3, last-write-wins, invalid-shape drops) and graceful-degradation defaults for both class (undefined) and connect ({granted:false, origins:[]})
- VER-06 closed via aggregate-hash.test.ts (9 tests) pinning the spec-locked SHA-256 digest `cc7c1b1903fb23ecb909d2427e1dccd7d398a5c63dd65160edb0bb8b231aa742` AND verifying the content-addressing property (add/remove/casing flips the hash; reorder preserves it)
- VER-13 closed via cross-nub-invariant.test.ts (16 tests) iterating all 7 SHELL-CLASS-POLICY.md scenario rows via describe.each, plus 4 anti-tests for the two documented non-conformant states
- VER-03 closed via extended tree-shake harness under /tmp/napplet-ver-03-treeshake/ — both types-only consumer bundles land at 96B (connect) and 90B (class), well under the 155B/103B dist-artifact baselines, with ZERO occurrences of installConnectShim / installClassShim / registerNub / handleClassMessage
- Full repo vitest suite 73/73 passes (up from 12 → 66 in scope of this plan + pre-existing)

## Task Commits

Each task was committed atomically:

1. **Task 1: VER-11 + VER-12 shim tests (class + connect)** — `03944d4` (test)
2. **Task 2: VER-06 aggregateHash + VER-13 cross-NUB invariant tests** — `fa7a6c9` (test)
3. **Task 3: VER-03 tree-shake harness extension** — no repo commit (artifacts live at `/tmp/napplet-ver-03-treeshake/` + `/tmp/napplet-ver-03-treeshake.log` per AGENTS.md no-home-dir-pollution; evidence captured in this SUMMARY)

**Plan metadata:** (committed with SUMMARY + STATE/ROADMAP updates)

## Files Created/Modified

### Created (in-repo)
- `packages/nub/src/class/shim.test.ts` (14 tests) — class.assigned wire dispatch + graceful-degradation + cleanup
- `packages/nub/src/connect/shim.test.ts` (11 tests) — meta-tag-reading + graceful-degradation + idempotency + cleanup
- `packages/nub/src/connect/aggregate-hash.test.ts` (9 tests) — spec-locked digest + perturbation cases + VER-06 content-addressing end-to-end
- `packages/nub/src/class/cross-nub-invariant.test.ts` (16 tests) — 7-scenario table + 4 anti-tests + 2 coverage meta-tests

### Created (outside repo, per AGENTS.md)
- `/tmp/napplet-ver-03-treeshake/` — harness dir: package.json, entry-connect.ts, entry-class.ts, node_modules/@napplet/{nub,core}/, bundle-connect.js (96B), bundle-class.js (90B)
- `/tmp/napplet-ver-03-treeshake.log` — VER-03 evidence: bundle sizes, forbidden-symbol grep results, SIZE_BUDGET=PASS, VER03_EXIT=0
- `/tmp/napplet-ver-11-12.log` — VER-11 + VER-12 vitest output (25 tests pass)
- `/tmp/napplet-ver-06-13.log` — VER-06 + VER-13 vitest output (29 tests pass)

## VER-03 Evidence (from /tmp/napplet-ver-03-treeshake.log)

```
--- bundle-connect.js ---
BUNDLE_SIZE_CONNECT=96
BASELINE_CONNECT=155  (dist/connect/types.js from Phase 137-03)
Forbidden symbol check (all MUST be 0):
  connect-bundle: installConnectShim: 0
  connect-bundle: installClassShim: 0
  connect-bundle: registerNub: 0
  connect-bundle: handleClassMessage: 0

--- bundle-class.js ---
BUNDLE_SIZE_CLASS=90
BASELINE_CLASS=103  (dist/class/types.js from Phase 137-03)
Forbidden symbol check (all MUST be 0):
  class-bundle: installConnectShim: 0
  class-bundle: installClassShim: 0
  class-bundle: registerNub: 0
  class-bundle: handleClassMessage: 0

SIZE_BUDGET=PASS (connect=96B, class=90B; budget=500B each)
VER03_EXIT=0
```

The consumer bundles are smaller than the dist-artifact baselines because `import type { NappletConnect }` / `import type { ClassAssignedMessage }` are fully erased at build time, dropping even the DOMAIN consts and the pure `normalizeConnectOrigin` validator. The 155B/103B baselines remain the ceiling for value-level consumers (e.g., someone importing DOMAIN as a runtime string); the harness documents that the type-only path erases to near-zero.

## Per-File Test Counts

- `packages/nub/src/class/shim.test.ts`: 14 tests pass (graceful-degradation, wire dispatch, invalid-shape drops, cleanup)
- `packages/nub/src/connect/shim.test.ts`: 11 tests pass (graceful-degradation, meta-reading, origins frozen, idempotency, cleanup)
- `packages/nub/src/connect/aggregate-hash.test.ts`: 9 tests pass (spec digest, joined-bytes-shape, perturbation × 5, empty-list boundary, VER-06 end-to-end, order-invariance)
- `packages/nub/src/class/cross-nub-invariant.test.ts`: 20 tests pass (7 scenarios × 2 assertions + 4 anti-tests + 2 coverage meta = 20)

**Full suite at repo root:** `pnpm vitest run` → 73 tests pass (6 test files; up from 2 files / 12 tests pre-plan, exclusive of plan 142-01's changeset-only scope).

## Decisions Made

See frontmatter `key-decisions` — principal choices were (a) stubbing globalThis.window/document in node env instead of introducing jsdom, (b) independently re-implementing the canonical fold inline in the aggregate-hash test rather than importing the vite-plugin copy, (c) keeping the tree-shake harness entirely in /tmp per AGENTS.md, and (d) using describe.each for the scenario-table-driven VER-13 test so future scenario additions are a one-row append.

## Deviations from Plan

None — plan executed exactly as written. All 4 test files landed at the planned paths with the planned test coverage patterns; the harness log landed at the planned /tmp path with VER03_EXIT=0 on first build. No auto-fixes (Rule 1/2/3) triggered because the production shims already matched the spec — the tests validate existing correct behavior rather than drive any code changes.

## Issues Encountered

- `grep -c` returning 1 (no matches → exit 1) combined with `|| echo 0` in bash produced a cosmetic double-"0" in the first harness-log draft. Fixed by using `grep -c ... 2>/dev/null; [ -z "$COUNT" ] && COUNT=0` pattern. Functional behavior was unchanged — the forbidden-symbol check logic was always correct — but the log is now cleaner.
- No system-level `esbuild` on PATH. Resolved by using the pnpm-vendored binary at `/home/sandwich/Develop/napplet/node_modules/.pnpm/esbuild@0.27.4/node_modules/esbuild/bin/esbuild`, avoiding a `npm install esbuild` into /tmp (which would have polluted the harness with extra transitive deps).

## User Setup Required

None — this plan is pure test-adding work with no external services, no new dependencies, and no configuration changes.

## Next Phase Readiness

- Plan 142-03 (documented-fixture tests for downstream shell repo + milestone-close docs) can now run in Wave 2 with VER-03/06/11/12/13 already closed — Plan 142-03 addresses VER-04/05/07/09/10 (the shell-dependent gates + changeset + tracking-issue confirmation), complementary scope.
- The 4 new test files auto-detect under the existing `packages/*/src/**/*.test.ts` vitest include glob, so Phase 143+ regression protection is continuous and zero-maintenance.
- The tree-shake harness is a one-shot /tmp artifact — it does not persist as a CI gate. If Phase 143+ wants to promote it to a permanent test, the harness scripts can move into a committed `packages/nub/test-tree-shake.sh` or similar (deferred decision; not needed for v0.29.0 milestone close).

## Self-Check: PASSED

Verified:
- `packages/nub/src/class/shim.test.ts` — FOUND
- `packages/nub/src/connect/shim.test.ts` — FOUND
- `packages/nub/src/connect/aggregate-hash.test.ts` — FOUND
- `packages/nub/src/class/cross-nub-invariant.test.ts` — FOUND
- `/tmp/napplet-ver-03-treeshake.log` — FOUND (contains VER03_EXIT=0)
- commit `03944d4` (Task 1) — FOUND in git log
- commit `fa7a6c9` (Task 2) — FOUND in git log
- Full vitest suite: 73/73 tests pass; 4 new test files all green
- VER-03 harness: bundle-connect.js=96B, bundle-class.js=90B, zero forbidden symbols, SIZE_BUDGET=PASS

---
*Phase: 142-verification-milestone-close*
*Plan: 02*
*Completed: 2026-04-21*
