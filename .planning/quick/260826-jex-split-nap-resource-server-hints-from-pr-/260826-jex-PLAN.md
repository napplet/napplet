---
phase: quick-260826-jex
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - .changeset/bright-frogs-remember.md
  - .planning/debug/nap-resource-server-hints.md
  - apps/docs/naps/index.md
  - apps/docs/packages/sdk.md
  - packages/conformance/src/run/boot.test.ts
  - packages/conformance/src/run/boot.ts
  - packages/conformance/src/shell/reference-responses.ts
  - packages/conformance/src/shell/reference-shell.test.ts
  - packages/conformance/src/validators/envelope-specs.ts
  - packages/conformance/src/validators/envelope-types.ts
  - packages/conformance/src/validators/envelope-validation.ts
  - packages/conformance/src/validators/envelope.test.ts
  - packages/core/src/index.ts
  - packages/core/src/types.ts
  - packages/core/src/types/global.ts
  - packages/core/src/types/global/runtime-api.ts
  - packages/nap/README.md
  - packages/nap/src/resource/index.ts
  - packages/nap/src/resource/resource-transport.ts
  - packages/nap/src/resource/sdk.ts
  - packages/nap/src/resource/shim.test.ts
  - packages/nap/src/resource/shim.ts
  - packages/nap/src/resource/types.ts
  - packages/sdk/README.md
  - packages/sdk/src/config.ts
  - packages/sdk/src/nap-types-foundation.ts
  - packages/shim/README.md
  - specs/SHELL-RESOURCE-POLICY.md
autonomous: true
requirements:
  - QUICK-260826-jex
must_haves:
  truths:
    - "The main-based `feat/nap-resource-server-hints` branch carries the NAP-RESOURCE server-hint protocol, public runtime API, conformance, test, and documentation changes from source commit `bfaa2428` as a dedicated concern."
    - "`resource.bytes` preserves optional advisory `servers`, `resource.bytesMany` carries ordered per-resource `requests`, `ResourceBytesRequest` is public, and `ResourceInfo` exposes optional `maxServers`."
    - "Conformance validates and preserves the canonical envelope shape without inventing host network policy; accepted-server filtering, fallback, SSRF defenses, and Blossom hash verification remain runtime responsibilities defined by the live NAP."
    - "No `packages/vite-plugin/src/optimizer/` path or `@napplet/vite-plugin` release entry is part of this dedicated protocol branch."
    - "Minor release entries remain for `@napplet/core`, `@napplet/nap`, `@napplet/sdk`, `@napplet/shim`, and `@napplet/conformance`, whose shipped contracts or output change."
    - "The branch is locally committed and fully verified for the orchestrator to push and open as a PR targeting `main`; the executor does not edit PR #205 or perform any remote branch/PR operation."
  artifacts:
    - path: "packages/core/src/types/global/runtime-api.ts"
      provides: "Public `ResourceBytesRequest`, `ResourceInfo.maxServers`, and amended `ResourceApi` signatures"
      contains: "ResourceBytesRequest"
    - path: "packages/nap/src/resource/resource-transport.ts"
      provides: "Canonical single and bulk NAP-RESOURCE request-envelope construction"
      contains: "requests"
    - path: "packages/nap/src/resource/shim.test.ts"
      provides: "Regression coverage for single-request server hints and per-resource bulk request objects"
    - path: "packages/conformance/src/validators/envelope-validation.ts"
      provides: "Structural validation for optional server lists and non-empty resource request objects"
    - path: ".changeset/bright-frogs-remember.md"
      provides: "Minor release metadata for the five publishable packages changed by the dedicated protocol PR"
    - path: ".planning/debug/nap-resource-server-hints.md"
      provides: "Resolved investigation provenance with an explicit note about the later PR split"
  key_links:
    - from: "packages/core/src/types/global/runtime-api.ts"
      to: "packages/nap/src/resource/shim.ts"
      via: "The runtime API request type and options are implemented by the injected resource shim"
      pattern: "ResourceBytesRequest|servers|maxServers"
    - from: "packages/nap/src/resource/shim.ts"
      to: "packages/nap/src/resource/resource-transport.ts"
      via: "The public shim forwards canonical single and bulk payloads to the transport"
      pattern: "sendBytesRequest|sendBytesManyRequest"
    - from: "packages/nap/src/resource/types.ts"
      to: "packages/conformance/src/validators/envelope-validation.ts"
      via: "Wire interfaces and conformance validators agree on `servers` and per-resource `requests`"
      pattern: "ResourceBytesRequest|requests|servers"
    - from: "packages/conformance/src/run/boot.ts"
      to: "packages/conformance/src/shell/reference-responses.ts"
      via: "Injected runtime requests are preserved and answered by the structural reference shell"
      pattern: "resource.bytesMany|requests"
---

<objective>
Extract the NAP-RESOURCE Blossom server-hint amendment from PR #205 into its own branch based on `origin/main`.

Purpose: keep PR #205 focused on Vite Blossom optimization while making the alpha protocol amendment independently reviewable and releasable against the living NAP-RESOURCE interface.

Output: a locally committed and verified `feat/nap-resource-server-hints` branch containing the non-optimizer portion of `bfaa2428503d1e9d7fa4677998500e6a0b188b28`, corrected release metadata, and scope-accurate debug provenance. The orchestrator owns removal from PR #205, restoration of its fixture hashes/body, pushes, and PR creation/update.
</objective>

<execution_context>
@/Users/sandwich/.codex/gsd-core/workflows/execute-plan.md
@/Users/sandwich/.codex/gsd-core/templates/summary.md
</execution_context>

<canonical_refs>
Protocol behavior is derived from the living proposal, not from repository code or the source commit:

- Live NAP-RESOURCE proposal: `/Users/sandwich/Develop/naps/naps/NAP-RESOURCE.md`
- Verified proposal branch revision: `9511232f69313aa7953d110e35d32cc28d506f66`
- Server-hint semantic revision: `7531258`

Per the user's alpha-development decision, proposed NAP pull-request interfaces are implementable before merge. The proposal defines `resource.bytes` payload `{ id, url, servers? }`, `resource.bytesMany` payload `{ id, requests }`, per-resource `ResourceBytesRequest { url, servers? }`, and optional `ResourceInfo.maxServers`. Hints apply only to `blossom:` resolution and are advisory; host runtimes retain origin validation, ordered fallback, network policy, cache, and hash-verification responsibility.
</canonical_refs>

<context>
@AGENTS.md
@.planning/STATE.md
@packages/core/src/types/global/runtime-api.ts
@packages/nap/src/resource/types.ts
@packages/nap/src/resource/resource-transport.ts
@packages/nap/src/resource/shim.ts
@packages/nap/src/resource/shim.test.ts
@packages/conformance/src/validators/envelope-validation.ts

<interfaces>
Execution boundaries:

- Work only in `/tmp/napplet-nap-resource-server-hints.mpOMEL` on `feat/nap-resource-server-hints`; its base is `origin/main`.
- Use commit `bfaa2428503d1e9d7fa4677998500e6a0b188b28` from the shared Git object store as the source split, while resolving protocol meaning against the live proposal above.
- Transfer every source-commit path listed in this plan except the four Vite optimizer paths. Those optimizer files are absent from `main` and remain owned by PR #205: `loader.ts`, `loader.test.ts`, `large-fixture.ts`, and `large-fixture.evidence.json` under `packages/vite-plugin/src/optimizer/`.
- The changeset must list only `@napplet/core`, `@napplet/nap`, `@napplet/sdk`, `@napplet/shim`, and `@napplet/conformance`, each as a minor release.
- Keep the primary checkout and all unrelated user-owned changes outside this plan. Do not switch, reset, stash, or edit the primary worktree.
- Do not push, force-push, create/edit a PR, mutate `feat/vite-plugin-blossom-optimization`, remove `bfaa2428` from PR #205, or restore PR #205 fixture hashes/body. The orchestrator performs those operations after execution.
</interfaces>
</context>

<tasks>

<task type="tracer">
  <name>Task 1: Replay the canonical server-hint path across public APIs, transport, conformance, tests, and docs</name>
  <files>apps/docs/naps/index.md, apps/docs/packages/sdk.md, packages/conformance/src/run/boot.test.ts, packages/conformance/src/run/boot.ts, packages/conformance/src/shell/reference-responses.ts, packages/conformance/src/shell/reference-shell.test.ts, packages/conformance/src/validators/envelope-specs.ts, packages/conformance/src/validators/envelope-types.ts, packages/conformance/src/validators/envelope-validation.ts, packages/conformance/src/validators/envelope.test.ts, packages/core/src/index.ts, packages/core/src/types.ts, packages/core/src/types/global.ts, packages/core/src/types/global/runtime-api.ts, packages/nap/README.md, packages/nap/src/resource/index.ts, packages/nap/src/resource/resource-transport.ts, packages/nap/src/resource/sdk.ts, packages/nap/src/resource/shim.test.ts, packages/nap/src/resource/shim.ts, packages/nap/src/resource/types.ts, packages/sdk/README.md, packages/sdk/src/config.ts, packages/sdk/src/nap-types-foundation.ts, packages/shim/README.md, specs/SHELL-RESOURCE-POLICY.md</files>
  <precondition>The current branch is `feat/nap-resource-server-hints`, `origin/main` is an ancestor of HEAD, and the working directory contains no unrelated edits outside the quick-plan artifact.</precondition>
  <action>Inspect the path-scoped diff of source commit `bfaa2428503d1e9d7fa4677998500e6a0b188b28` against its first parent, then reproduce its listed non-optimizer code, tests, and documentation changes with `apply_patch`. Preserve the source commit's contract consistently across every public layer: export `ResourceBytesRequest { url: string; servers?: string[] }` from core/NAP/SDK barrels; add optional `ResourceInfo.maxServers`; make single-request APIs accept `{ servers?, signal? }`; make bulk APIs accept `ResourceBytesRequest[]` and emit `requests`; preserve server arrays through the shim transport; update the injected conformance prelude, reference responders, validators, envelope specifications, and tests; and align all public examples and non-normative operator guidance.

Keep validation structural: require string arrays when `servers` is present, require a non-empty bulk list of objects with string `url`, and preserve optional per-entry hints. Do not implement or claim client-side origin acceptance, fallback, network policy, cache-key changes, or hash verification because the live NAP assigns those to a resource-capable runtime and this repository does not contain that production host. Preserve the source commit's retirement of stale strict-CSP and undocumented capability claims encountered in the touched resource docs, while retaining explicit deference to the living NIP-5D/NAP sources. Do not materialize, modify, stage, or test any Vite optimizer path as part of this task. Commit this task atomically as `feat(resource)!: adopt Blossom server hints`, with a `BREAKING CHANGE:` trailer describing the `ResourceBytesRequest[]`/`requests` migration and a `Co-Authored-By: Codex &lt;noreply@openai.com&gt;` trailer.</action>
  <verify>
    <automated>pnpm --filter @napplet/nap test:unit -- src/resource/shim.test.ts &amp;&amp; pnpm --filter @napplet/conformance test:unit &amp;&amp; pnpm --filter @napplet/core type-check &amp;&amp; pnpm --filter @napplet/sdk type-check &amp;&amp; pnpm --filter @napplet/shim test:unit &amp;&amp; git diff --check</automated>
  </verify>
  <done>The public API, transport, conformance prelude/reference/validator, regressions, and documentation all carry the live proposal's server-hint envelope end to end, focused affected-package checks pass, and the diff contains no Vite optimizer file.</done>
</task>

<task type="auto">
  <name>Task 2: Correct release/provenance metadata and prove the dedicated-PR boundary</name>
  <files>.changeset/bright-frogs-remember.md, .planning/debug/nap-resource-server-hints.md</files>
  <action>Add the source commit's changeset, but remove the Vite package entry and optimizer wording. Keep minor entries for `@napplet/core`, `@napplet/nap`, `@napplet/sdk`, `@napplet/shim`, and `@napplet/conformance`; describe the breaking bulk request-object change, optional single-request hints, optional `maxServers`, and conformance alignment.

Include the resolved debug artifact from the source commit because project quick/debug artifacts are committed provenance. Add a concise PR-split note and make its Current Focus and Resolution summary scope-accurate: optimizer-specific observations remain historical evidence from the original investigation, but their four files and release entry stay with PR #205 and are not part of this branch. Do not erase or rewrite timestamped observations as though they did not occur. Audit the product/release diff against the 28-path allowlist in this plan while excluding `.planning/quick/` workflow artifacts, verify no optimizer path appears, and verify the only publishable packages named by the changeset are the five required packages. Run the complete repository quality chain, then commit the release/provenance metadata atomically with a conventional commit and a `Co-Authored-By: Codex &lt;noreply@openai.com&gt;` trailer. Stop after the local commits and quick-task summary; remote and PR operations belong to the orchestrator.</action>
  <verify>
    <automated>test -z "$(git diff --name-only origin/main -- packages/vite-plugin/src/optimizer)" &amp;&amp; node --test scripts/check-build-secret-leaks.test.mjs &amp;&amp; node scripts/check-build-secret-leaks.mjs &amp;&amp; pnpm build &amp;&amp; pnpm type-check &amp;&amp; pnpm -r test:unit &amp;&amp; pnpm lint &amp;&amp; pnpm check:jsr &amp;&amp; pnpm test:release-tooling &amp;&amp; pnpm test:tutorial &amp;&amp; pnpm dlx aislop@0.12.0 scan --changes --base origin/main . &amp;&amp; git diff --check</automated>
  </verify>
  <done>The main-based local branch contains exactly the dedicated server-hint protocol/runtime/conformance/docs slice plus accurate release/debug metadata, all focused and repository gates pass, the changeset names only the five affected packages, the optimizer subtree is absent from the branch diff, and no remote or primary-worktree state was changed.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Napplet -> runtime resource envelope | Napplet-controlled URLs and advisory server strings cross into a host-owned fetch/security boundary. |
| Public TypeScript API -> postMessage wire | Core/NAP/SDK signatures must serialize the same field names and nesting validated by conformance. |
| Source commit -> dedicated branch | A mixed source commit must be separated without leaking PR-#205-only optimizer changes or dropping protocol consumers. |
| Changeset -> package release automation | Release metadata determines which public packages publish the breaking alpha-interface change. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-QJEX-01 | Spoofing / SSRF | Advisory Blossom server hints | high | transfer | Preserve hints as untrusted metadata only; document that live NAP-RESOURCE host runtimes must validate public HTTPS origins and enforce the Default Resource Policy. Do not add weaker client-side policy. |
| T-QJEX-02 | Tampering | Resource envelope serialization and validation | high | mitigate | Share `ResourceBytesRequest` through public barrels, assert exact single/bulk payload shapes, and run NAP plus conformance regressions. |
| T-QJEX-03 | Tampering | Path-scoped split from `bfaa2428` | medium | mitigate | Use the explicit 28-path allowlist and fail the boundary audit if the optimizer subtree appears in the `origin/main` diff. |
| T-QJEX-04 | Repudiation | Debug provenance after PR split | low | mitigate | Retain timestamped evidence and add a scope note rather than deleting optimizer investigation history. |
| T-QJEX-05 | Denial of Service | Release automation | medium | mitigate | Keep minor changesets for exactly the five packages with changed shipped contracts/output and run build, JSR, release-tooling, and full unit gates. |
</threat_model>

## Source Coverage Audit

| Source | ID | Feature / Constraint | Task | Status | Notes |
|--------|----|----------------------|------|--------|-------|
| GOAL | — | Split NAP-RESOURCE server hints from PR #205 into a dedicated PR-ready branch based on `main` | 1, 2 | COVERED | Task 1 transfers the behavior; Task 2 proves and commits the branch boundary for orchestrator shipping. |
| REQ | QUICK-260826-jex | Carry server-hint protocol/runtime/conformance/docs changes from `bfaa2428` | 1 | COVERED | All 26 code/test/doc paths are explicitly listed and aligned to the live proposal. |
| REQ | QUICK-260826-jex | Exclude the four PR-#205-only Vite optimizer files | 1, 2 | COVERED | The executor never materializes them and runs a branch-diff boundary assertion. |
| REQ | QUICK-260826-jex | Remove `@napplet/vite-plugin` from release metadata while preserving five required minor entries | 2 | COVERED | Exact allowed package set is stated in the task and success criteria. |
| REQ | QUICK-260826-jex | Include the existing debug artifact where project conventions support it | 2 | COVERED | Artifact is retained with truthful PR-split scoping and untouched historical observations. |
| REQ | QUICK-260826-jex | Leave PR #205 cleanup, pushes, and PR creation/update to the orchestrator | 2 | COVERED | Executor stops at a local commit and summary; remote mutations are prohibited. |
| REQ | QUICK-260826-jex | Keep unrelated primary-worktree changes out of scope | 1, 2 | COVERED | Work is confined to the named isolated worktree and explicit file allowlist. |
| RESEARCH | — | No RESEARCH.md exists for this quick task | — | N/A | Discovery Level 0: the exact implementation commit, living proposal, and existing repository patterns fully determine the split; no dependency or API choice is introduced. |
| CONTEXT | — | No quick-task CONTEXT.md or D-XX decision artifact exists | — | N/A | The user's direct decisions—dedicated PR and alpha PR interfaces are implementable—are captured in objective, canonical references, and execution boundaries. |

<verification>
1. Focused NAP, conformance, core, SDK, and shim checks prove the amended public API and exact wire envelopes.
2. The product/release portion of `git diff --name-only origin/main`, excluding `.planning/quick/` workflow artifacts, matches the plan's 28-file allowlist and contains no Vite optimizer path.
3. `.changeset/bright-frogs-remember.md` has exactly five minor package entries: core, nap, sdk, shim, and conformance.
4. `pnpm build`, `pnpm type-check`, recursive unit tests, docs-inclusive build/tutorial checks, JSR/release checks, secret scans, lint, AI-slop at the pinned project version, and `git diff --check` pass.
5. Git history ends with atomic local server-hint and release/provenance commits on `feat/nap-resource-server-hints`; no push, PR edit, or primary-worktree mutation occurred.
</verification>

<success_criteria>
- A reviewer can assess the NAP-RESOURCE server-hint amendment independently of PR #205's optimizer work.
- The branch emits and validates only the living proposal's defined `servers`, `requests`, `ResourceBytesRequest`, and `maxServers` surface.
- The old bulk string-array contract is removed from every transferred active API, transport, conformance, and documentation path.
- Release metadata covers the five changed packages and excludes the Vite plugin.
- Optimizer code and deterministic fixture hashes remain absent from the dedicated branch.
- All repository gates pass and the local branch is ready for orchestrator-managed push and PR creation against `main`.
</success_criteria>

<output>
Create `.planning/quick/260826-jex-split-nap-resource-server-hints-from-pr-/260826-jex-SUMMARY.md` when done.
</output>
