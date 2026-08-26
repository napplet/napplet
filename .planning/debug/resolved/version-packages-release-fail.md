---
status: resolved
trigger: "Version Packages (#207) caused Publish #210, Publish to JSR #186, and CI #521 to fail on main"
created: 2026-08-26
updated: 2026-08-26T15:14:00+01:00
---

# Debug Session: version-packages-release-fail

## Symptoms

- Expected behavior: merging Version Packages PR #207 publishes the updated napplet packages through npm and JSR while CI remains green.
- Actual behavior: commit `de1cb7e` on `main` fails Publish #210, Publish to JSR #186, and CI #521. AI Slop Score #465 and Conformance #389 pass.
- Error messages: not visible in the supplied workflow-list screenshot; failed job logs must be inspected.
- Timeline: began immediately after Version Packages PR #207 was merged and commit `de1cb7e` was pushed to `main` on 2026-08-26.
- Reproduction: run the npm Publish, Publish to JSR, and CI workflows against commit `de1cb7e`.

## Current Focus

- outcome: resolved repository-owned defects; the remaining npm Publish #210 E404 is an external NPM_TOKEN/scope escalation, not a code change.
- next_action: archive this session and commit the scoped repository fixes with their regression coverage.

## Evidence

- timestamp: 2026-08-26T13:48:47+01:00 observation: the supplied GitHub Actions screenshot shows three red runs for the same `de1cb7e` push—Publish #210, Publish to JSR #186, and CI #521—while AI Slop Score #465 and Conformance #389 are green. implication: authentication alone is unlikely to explain all failures; inspect the shared pre-publish/CI path first.
- timestamp: 2026-08-26T14:03:00+01:00 checked: `.planning/debug/knowledge-base.md` found: it contains only an unrelated UI scroll/resize resolution. implication: no known-pattern candidate applies; continue with direct workflow evidence.
- timestamp: 2026-08-26T14:05:00+01:00 checked: `gh run list --commit de1cb7eb` found: no runs returned. implication: the abbreviated-SHA query did not resolve the supplied workflow references; verify the full SHA and query explicit repository metadata before drawing conclusions.
- timestamp: 2026-08-26T14:07:00+01:00 checked: explicit `napplet/napplet` `main` workflow metadata found: commit `de1cb7ebb94c4acb76e5671babcf077247170af1` has Publish #210 (run `32976078639`), Publish to JSR #186 (run `32976078582`), and CI #521 (run `32976078516`) failed; the corresponding #206 runs at `19e0029b` passed. implication: the failure is deterministic and its regression window is the Version Packages #207 merge.
- timestamp: 2026-08-26T14:10:00+01:00 checked: failed-job logs for Publish #210, Publish to JSR #186, and CI #521 found: CI fails at `scripts/test-tutorial.mjs` because tutorial `@napplet/sdk` is `^0.27.0` and workspace SDK is `0.28.0`; JSR fails at `packages/core/jsr.json` with “Config file must be a member of the workspace”; npm fails on `PUT @napplet/core@0.32.0` with npm `E404`. implication: the failures have distinct mechanisms, refuting a single shared build-artifact hypothesis; investigate each branch independently and fix only tracked causes.
- timestamp: 2026-08-26T14:16:00+01:00 checked: `package.json` and tutorial source found: `version-packages` runs only `changeset version` and `sync-jsr-versions`; it does not synchronize tutorial package declarations. The embedded tutorial `package.json` and install command both retain `@napplet/sdk@^0.27.0`. Root `deno.json` lists only boilerplate, skills, and cli despite JSR workflow publishing core, nap, sdk, shim, vite-plugin, and conformance. implication: both CI and JSR failure mechanisms are directly attributable to tracked repository configuration/tooling.
- timestamp: 2026-08-26T14:20:00+01:00 checked: local reproductions found: `pnpm test:tutorial` fails with the identical `^0.27.0` versus `0.28.0` error, and `packages/core` JSR dry-run fails with the identical workspace-membership error. `SBFL` was skipped: there is no per-test coverage spectrum for these configuration/document-generation failures. implication: both repository branches are deterministic Bohrbugs; test-first, targeted fixes are appropriate.
- timestamp: 2026-08-26T14:23:00+01:00 checked: isolated JSR counterfactual found: copying only `packages/core` into a disposable repository and adding `./packages/core` as the sole root Deno workspace member changes the exact JSR command from the membership error to `Success Dry run complete`. implication: the omitted workspace entry is the direct cause of JSR #186, not an external JSR publishing permission.
- timestamp: 2026-08-26T14:30:00+01:00 checked: RED regression tests found: the Deno workspace contract reports missing conformance, core, nap, sdk, shim, and vite-plugin; the tutorial synchronization test cannot import a non-existent implementation. implication: both planned fixes are independently regression-protected before behavior changes.
- timestamp: 2026-08-26T14:34:00+01:00 checked: first implementation run found: the JSR workspace contract passes, but the tutorial synchronizer updates only `pnpm add` declarations and leaves the embedded JSON manifest stale. implication: the code fix was incomplete; extend its matching to the source-of-truth tutorial manifest before accepting it.
- timestamp: 2026-08-26T14:37:00+01:00 checked: corrected implementation found: both focused regression tests pass and the synchronizer updates the tutorial SDK install command and embedded manifest to `^0.28.0`, while preserving still-compatible package ranges. implication: the two fixes now satisfy their direct unit-level contracts; verify integration behavior next.
- timestamp: 2026-08-26T14:41:00+01:00 checked: focused integration command found: `test:release-tooling` passes; tutorial unit tests pass, but the tutorial build integration cannot begin because this isolated worktree lacks `node_modules/typescript`. implication: this is an environment setup gap, not a source regression; install the frozen lockfile before rerunning the integration and broader gates.
- timestamp: 2026-08-26T14:46:00+01:00 checked: build, type-check, release-tooling, tutorial, and JSR-export checks found: all pass after frozen-lockfile install; tutorial now builds and passes conformance. The JSR dry-run was invoked without the workflow’s `--allow-dirty` flag and therefore stopped only on expected uncommitted changes. implication: source verification is green so far; rerun the exact workflow argument vector before accepting JSR behavior.
- timestamp: 2026-08-26T15:01:00+01:00 checked: exact JSR dry-run and full test suite found: core `npx jsr publish --dry-run --allow-slow-types --allow-dirty` succeeds; `pnpm test` passes its JSR export, release-tooling, 23-package unit, tutorial build, and conformance checks. `pnpm build` and `pnpm type-check` also pass. implication: target and adjacent functional checks are green across the repository.
- timestamp: 2026-08-26T15:07:00+01:00 checked: AI-slop and mutation availability found: the workflow’s `npx aislop@0.12.0 scan` scores 81/100, above its configured 70-point threshold; all five findings are pre-existing package vulnerability or size warnings outside this change. No Stryker/mutation configuration exists, so mutation testing is unavailable. `deno.lock` gained only generated workspace package dependency records after the Deno workspace expansion and belongs with that configuration change. implication: quality gate passes without unrelated remediation; mutation signal is skipped with documented reason.
- timestamp: 2026-08-26T15:10:00+01:00 checked: revert-and-reconfirm (stash/reapply) found: with the entire uncommitted fix stashed, `pnpm test:tutorial` returns the exact stale SDK-range error and the core JSR dry-run returns the exact workspace-membership error; restoring the stash succeeds cleanly. implication: the original failures return when—and only when—the scoped repository changes are removed.
- timestamp: 2026-08-26T15:12:00+01:00 checked: re-applied target checks found: after restoring the scoped changes, tutorial build/conformance passes and the core JSR dry-run completes successfully with the workflow’s `--allow-slow-types --allow-dirty` arguments. implication: revert-and-reconfirm passes for both independent repository-owned root causes.

## Eliminated

## Resolution

- root_cause: `version-packages` did not synchronize version-sensitive tutorial declarations after Changesets bumps; root `deno.json` omitted package directories published from `jsr.json`, so JSR rejected their configs as non-members.
- fix: Added a tutorial-range synchronizer after Changesets versioning, updated the current tutorial’s incompatible SDK range, and added all JSR-published packages to the root Deno workspace with regression contracts.
- oracle_type: derived (the tutorial range must include each workspace package version; every JSR config must be a Deno workspace member, matching JSR CLI validation)
- verification:
    target_test: { result: pass, suites_run: [scripts/sync-tutorial-package-versions.test.mjs, scripts/jsr-workspace-membership.test.mjs] }
    mutation_check: { result: skipped, reason_if_skipped: no Stryker or mutation runner is configured }
    no_op_deletion: { result: pass, deletion_justified_by_rca: false, evidence: additive source/config/test changes only }
    adjacent_tests: { result: pass, suites_run: [pnpm build, pnpm type-check, pnpm test, pnpm test:tutorial, pnpm check:jsr, core-jsr-dry-run] }
    revert_and_reconfirm: { result: pass, bug_returned_on_revert: true, fixed_on_reapply: true }
    quality_gate: { result: pass, check: 'npx aislop@0.12.0 scan', score: 81, configured_minimum: 70, note: pre-existing findings remain outside scope }
    guardrail_verdict: accepted
    external_follow_up: npm Publish #210 requires NPM_TOKEN scope/owner remediation; repository code cannot prove or repair that credential state.
- files_changed:
  - apps/docs/guide/build-note-drafts-napplet.md
  - deno.json
  - deno.lock
  - package.json
  - scripts/sync-tutorial-package-versions.mjs
  - scripts/sync-tutorial-package-versions.test.mjs
  - scripts/jsr-workspace-membership.test.mjs
