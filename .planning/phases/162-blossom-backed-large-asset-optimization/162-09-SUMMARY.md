---
phase: 162-blossom-backed-large-asset-optimization
plan: "09"
subsystem: vite-plugin
tags: [vite, blossom, nip-5a, nap-resource, asset-optimization]
dependency_graph:
  requires: [162-08]
  provides: [lazy-live-optimization, conditional-resource-requirement, post-commit-aggregate]
  affects: [packages/vite-plugin]
tech_stack:
  added: []
  patterns: [lazy-node-service-loading, verified-upload-then-commit, effective-requirements]
key_files:
  created: [packages/vite-plugin/src/optimizer/security.test.ts]
  modified: [packages/vite-plugin/src/types.ts, packages/vite-plugin/src/index.ts, packages/vite-plugin/src/requirements.ts, packages/vite-plugin/src/manifest.ts, packages/vite-plugin/src/optimizer/pipeline.ts, packages/vite-plugin/src/optimizer/pipeline.test.ts, packages/vite-plugin/src/index.test.ts]
decisions:
  - "Measure the would-be single-file artifact against a fixed 2 MiB threshold before lazily loading any Node-backed Blossom service."
  - "Derive the canonical NIP-5A resource requirement solely from committedResourceCount after a complete local artifact transaction."
metrics:
  duration: "~24 minutes"
  completed: "2026-08-21"
  tasks_completed: 2
  files_changed: 8
status: complete
---

# Phase 162 Plan 09: Live Optimizer Orchestration Summary

The Vite plugin now lazily performs verified Blossom offloads only for a would-be single-file HTML artifact that exceeds 2 MiB, while retaining a safe inline artifact for every no-op and external failure path.

## Delivered

- Added the public `largeAssetOptimization?: 'auto' | false` option, defaulting to automatic optimization with a fixed exact 2 MiB threshold.
- Defers Node-only signer, relay-discovery, and upload service construction until the retained inline artifact is actually over target; disabled, at-target, incompatible callback, unavailable signer/server/capability, exhausted, and failed cases preserve inline output with a visible safe status.
- Uploads exact selected bytes through the existing verified Blossom service, validates the complete evidence, then permits the existing transactional rewrite, private mapping, runtime resource validation, and late selected-file deletion.
- Includes inlined JavaScript and CSS references in retained artifact planning so real Vite outputs can become eligible without widening protocol surface.
- Adds deterministic `effectiveRequirements()` handling that emits exactly one canonical `['requires', 'resource']` tag only after one or more offloads commit; private resource-table mapping data stays in signed HTML and out of manifest tags and fields.
- Calculates the NIP-5A aggregate hash after the final committed artifact and its effective requirements are established.

## Verification

- `pnpm --filter @napplet/vite-plugin test:unit -- optimizer/pipeline.test.ts optimizer/node-services.test.ts index.test.ts optimizer/security.test.ts` — 6 files, 73 tests passed.
- `pnpm --filter @napplet/vite-plugin build` — passed.
- `pnpm --filter @napplet/vite-plugin type-check` — passed.
- `pnpm build` — passed.
- `pnpm type-check` — passed.
- `pnpm -r test:unit` — passed.
- `git diff --check` — passed.
- `pnpm dlx aislop@0.12.0 scan --json packages/vite-plugin/src` — no format, lint, AI-slop, or security findings; one pre-existing style-only warning is deferred below.

## Commits

- `102dc234` `test(162-09): add live optimizer orchestration coverage`
- `b2c726ac` `feat(162-09): orchestrate lazy large asset optimization`
- `ecf32782` `test(162-09): cover conditional resource manifest security`
- `386b2860` `feat(162-09): gate resource manifests on committed offloads`
- `ce207039` `fix(162-09): avoid secret-like upload marker`

## Decisions Made

- The threshold is not configurable: the live path begins only when recomputed single-file HTML is greater than exactly 2 MiB.
- `resource` remains an existing NIP-5A capability tag and is omitted unless the local offload transaction has committed at least one mapping; the mapping itself is private artifact implementation data, not manifest surface.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Retained Vite script and stylesheet bytes were absent from eligibility planning.**
- **Found during:** Task 2.
- **Issue:** The generated inline JS/CSS sources were rendered into HTML but were not represented in the retained artifact list, so an otherwise eligible real Vite asset could not be selected for offload.
- **Fix:** Added retained artifact inventory entries for inlined JS and CSS references before invoking the existing selection plan.
- **Files modified:** `packages/vite-plugin/src/manifest.ts`.
- **Commit:** `386b2860`.

**2. [Rule 2 - Security] Replaced a secret-like local upload marker.**
- **Found during:** Final AI-slop security scan.
- **Issue:** The non-secret local transaction marker resembled a credential and triggered the secret-output guard.
- **Fix:** Replaced it with the neutral internal acknowledgement value `ok`; no external authentication or protocol behavior changed.
- **Files modified:** `packages/vite-plugin/src/optimizer/pipeline.ts`.
- **Commit:** `ce207039`.

## Deferred Issues

- The package-wide AI-slop scan reports one pre-existing style-only `complexity/function-too-long` warning for `createNodeOptimizationServices` in `packages/vite-plugin/src/optimizer/node-services.ts:107`, a Plan 162-08 file outside this plan's ownership. It is recorded in `.planning/WINDOWS.md` and `deferred-items.md` without altering sibling-plan code.

## Known Stubs

None.

## Self-Check: PASSED

Verified all listed implementation and test files exist and all five 162-09 task commits are present in Git history.
