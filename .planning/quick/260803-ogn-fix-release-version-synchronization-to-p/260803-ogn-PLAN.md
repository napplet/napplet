---
phase: quick-260803-ogn
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - scripts/sync-jsr-versions.mjs
  - scripts/sync-jsr-versions.test.mjs
  - package.json
autonomous: true
requirements:
  - QUICK-260803-ogn
must_haves:
  truths:
    - "`pnpm version-packages` can synchronize the release after `@napplet/skills` exposes npm asset subpaths through `./skills/*`."
    - "The npm `@napplet/skills/skills/*` wildcard remains published from `packages/skills/package.json`, while `packages/skills/jsr.json` continues to expose only concrete TypeScript module entry points."
    - "Concrete npm module exports still regenerate matching JSR source exports, and a missing concrete source file still stops synchronization."
    - "The wildcard regression is exercised by the repository's normal test entry point without changing protocol behavior or publishable package output."
  artifacts:
    - path: "scripts/sync-jsr-versions.mjs"
      provides: "Importable and executable JSR version/export synchronizer that distinguishes concrete modules from npm wildcard assets"
      exports: ["syncJsrVersions"]
    - path: "scripts/sync-jsr-versions.test.mjs"
      provides: "Fixture-backed regression coverage for wildcard preservation, concrete export regeneration, and missing-source rejection"
    - path: "package.json"
      provides: "Root release-tooling test command included in the normal repository test chain"
  key_links:
    - from: "scripts/sync-jsr-versions.test.mjs"
      to: "scripts/sync-jsr-versions.mjs"
      via: "imports `syncJsrVersions` and runs it against isolated temporary package trees"
      pattern: "syncJsrVersions"
    - from: "scripts/sync-jsr-versions.mjs"
      to: "packages/skills/package.json"
      via: "regenerates only concrete source-module exports and leaves npm wildcard asset mappings in the npm manifest"
      pattern: "subpath.*includes.*\\*|jsEntry.*includes.*\\*"
    - from: "package.json"
      to: "scripts/sync-jsr-versions.test.mjs"
      via: "a dedicated release-tooling test script invoked by the root `test` command"
      pattern: "test:release-tooling"
---

<objective>
Fix release version synchronization so npm-only wildcard asset exports do not become fictitious JSR source files.

Purpose: Publish run `30832804324` failed in `pnpm version-packages` because `scripts/sync-jsr-versions.mjs` interpreted `@napplet/skills` export `./skills/*` -> `./skills/*` as one literal source path. Make the export regeneration rule distinguish concrete modules from npm wildcard assets, preserve the npm package contract, and keep strict validation for real JSR source exports.

Output: A testable synchronizer, a regression test wired into the root test chain, and successful focused release-tooling verification. This is release plumbing only; do not add, remove, or reinterpret NIP-5D, NIP-5A, NAP, manifest, loading, transport, or runtime behavior.
</objective>

<execution_context>
@/Users/sandwich/.codex/gsd-core/workflows/execute-plan.md
@/Users/sandwich/.codex/gsd-core/templates/summary.md
</execution_context>

<context>
@AGENTS.md
@.planning/STATE.md
@package.json
@scripts/sync-jsr-versions.mjs
@scripts/check-jsr-exports.mjs
@packages/skills/package.json
@packages/skills/jsr.json

<interfaces>
Existing contracts to preserve:

- Root `package.json#scripts.version-packages` runs `changeset version` followed by `node scripts/sync-jsr-versions.mjs`; the synchronizer must remain directly executable with the same zero-argument CLI behavior.
- `packages/skills/package.json#exports` contains concrete JavaScript module entries for `.` and `./cli`, plus the npm asset mapping `./skills/*` -> `./skills/*`.
- `packages/skills/jsr.json#exports` intentionally contains only `.` -> `./src/index.ts` and `./cli` -> `./src/cli.ts`; no JSR wildcard source entry exists or should be created.
- The synchronizer currently updates `jsr.json`/`deno.json` versions, rewrites internal `@napplet/*` JSR constraints, regenerates object-form JSR exports, skips the npm-only `@napplet/shim/prelude.global` artifact, and throws when a concrete mapped source file is absent.
- Branch `fix/jsr-wildcard-exports` starts from merged main commit `b17e9447`. `.codebase-memory/`, `packages/cli/dist-bin/`, and `workshop/` are user-owned untracked paths and must remain untouched and untracked.
</interfaces>
</context>

<tasks>

<task type="tracer" tdd="true">
  <name>Task 1: Preserve npm wildcard assets through the release synchronizer</name>
  <files>scripts/sync-jsr-versions.mjs, scripts/sync-jsr-versions.test.mjs, package.json</files>
  <behavior>
    - A temporary `@napplet/skills` fixture with concrete `.`/`./cli` module exports and the npm `./skills/*` asset export synchronizes successfully.
    - Synchronization leaves the fixture's npm wildcard export unchanged and produces no wildcard entry in `jsr.json`.
    - Concrete dist JavaScript targets continue to map to existing src TypeScript targets in `jsr.json`.
    - A concrete export whose translated source file is absent still throws a diagnostic naming the package, subpath, and missing source target.
    - Version fields, internal `@napplet/*` JSR constraints, Deno-first package synchronization, console summaries, and the script's zero-argument CLI behavior remain intact.
  </behavior>
  <action>Write `scripts/sync-jsr-versions.test.mjs` first with `node:test`, strict assertions, `mkdtemp`, and cleanup in `t.after`/`finally`. Import an exported `syncJsrVersions` function and exercise isolated package trees rather than changing live release versions. Seed the primary fixture from the same `@napplet/skills` export shape: two concrete module targets with matching `src/*.ts` files and one wildcard Markdown asset target. Assert both sides of the contract—the npm manifest retains its wildcard mapping byte-for-value, while the synchronized JSR export object contains only concrete source modules—and also cover version/internal-import rewriting. Add a second fixture proving that a missing concrete source target still rejects; do not weaken that integrity check to make the wildcard case pass.

Refactor `scripts/sync-jsr-versions.mjs` only enough to export `syncJsrVersions(repoRoot = REPO_ROOT)` and invoke it behind an ESM direct-execution guard, retaining the current zero-argument command used by `version-packages`, `publish-jsr`, and GitHub Actions. During object-form export regeneration, recognize a wildcard in either the npm subpath or selected import/default target as an npm pattern rather than a concrete JSR source module: omit that mapping from regenerated JSR exports, leave `package.json` untouched, and never translate or existence-check the pattern as a literal path. Keep the explicit `@napplet/shim/prelude.global` skip, concrete dist-to-src translation, missing-source error, version/import updates, Deno pass, and summary output behavior unchanged.

Add a root `test:release-tooling` script that runs the new Node test and include it in the existing root `test` chain so CI exercises the regression. Do not modify either `packages/skills` manifest, do not add a changeset because only private root release tooling/tests change, and do not touch `.codebase-memory/`, `packages/cli/dist-bin/`, or `workshop/`.</action>
  <verify>
    <automated>pnpm test:release-tooling &amp;&amp; node scripts/sync-jsr-versions.mjs &amp;&amp; pnpm check:jsr &amp;&amp; git diff --check</automated>
  </verify>
  <done>The exact `@napplet/skills` wildcard shape synchronizes without error, remains npm-only, concrete JSR source validation still fails closed, the regression runs through the root test chain, and the focused live synchronizer/check gates pass without package-version changes.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Workspace manifests -> release synchronizer | Checked-in package export maps drive writes to JSR/Deno publish configuration and can block or corrupt release metadata if classified incorrectly. |
| Synchronizer -> registry workflows | `version-packages` and JSR publishing consume the generated configuration; a false success can ship an invalid package, while a false failure blocks all pending releases. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-QOGN-01 | Tampering | `scripts/sync-jsr-versions.mjs` export regeneration | high | mitigate | Skip only syntactic wildcard patterns; retain concrete source existence checks and assert exact regenerated exports in isolated fixtures. |
| T-QOGN-02 | Denial of Service | `pnpm version-packages` release path | high | mitigate | Reproduce the failing `@napplet/skills` shape in a root-wired regression and run the live synchronizer plus JSR export checker. |
| T-QOGN-03 | Repudiation | Release-tooling regression coverage | low | mitigate | Give the test a dedicated root command and include it in `pnpm test` so CI records the proof on future release changes. |
</threat_model>

## Source Coverage Audit

| Source | ID | Feature / Constraint | Task | Status | Notes |
|--------|----|----------------------|------|--------|-------|
| GOAL | — | Preserve wildcard package exports and unblock official CLI release synchronization | 1 | COVERED | Wildcards remain npm-only while the synchronizer completes. |
| REQ | QUICK-260803-ogn | Do not interpret `./skills/*` as a literal JSR source file | 1 | COVERED | Pattern detection happens before source translation/existence checking. |
| REQ | QUICK-260803-ogn | Preserve npm `@napplet/skills/skills/*` without inventing a JSR source export | 1 | COVERED | The regression asserts both manifests' distinct contracts. |
| REQ | QUICK-260803-ogn | Add regression coverage and verify the release synchronizer | 1 | COVERED | Node fixtures, root test wiring, live sync, and `check:jsr` are explicit. |
| REQ | QUICK-260803-ogn | Make no protocol behavior changes | 1 | COVERED | Scope is limited to private root release tooling and tests. |
| RESEARCH | — | No RESEARCH.md exists for this quick task | — | N/A | Level 0 discovery: existing Node release script and repository test conventions only; no dependency or external API changes. |
| CONTEXT | — | No CONTEXT.md or D-XX decisions exist for this quick task | — | N/A | The supplied failure facts and preservation constraints control the plan. |

<verification>
1. `pnpm test:release-tooling` reproduces the upstream wildcard shape in isolation and covers the strict concrete-source failure path.
2. `node scripts/sync-jsr-versions.mjs` completes against the real workspace without changing `packages/skills/package.json` or adding a wildcard to `packages/skills/jsr.json`.
3. `pnpm check:jsr` confirms every resulting JSR export points to a publish-included source file.
4. `pnpm test` exercises the new release regression alongside the existing repository suites; `git diff --check` and the changed-file AI-slop gate remain clean before shipping.
5. `git status --short` still lists `.codebase-memory/`, `packages/cli/dist-bin/`, and `workshop/` only as untouched user-owned untracked paths outside the plan diff.
</verification>

<success_criteria>
- The synchronizer completes for the current `@napplet/skills` npm/JSR manifest pair.
- `packages/skills/package.json` retains `./skills/*` -> `./skills/*` and `packages/skills/jsr.json` contains no fabricated wildcard entry.
- Concrete source-module exports, version synchronization, internal dependency constraints, and Deno-first synchronization retain their previous behavior.
- The new test fails under the pre-fix literal-path behavior and runs from the normal root `pnpm test` chain.
- No changeset or protocol/package runtime change is introduced.
</success_criteria>

<output>
Create `.planning/quick/260803-ogn-fix-release-version-synchronization-to-p/260803-ogn-SUMMARY.md` when done.
</output>
