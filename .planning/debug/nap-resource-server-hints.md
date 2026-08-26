---
status: resolved
trigger: "chase NAP-RESOURCE; server hints have been added to the resource envelope"
created: 2026-08-22
updated: 2026-08-26T11:43:15+01:00
---

# Debug Session: nap-resource-server-hints

## Symptoms

- Expected behavior: napplet packages and the Phase 162 Blossom-resource path implement the NAP-RESOURCE server-hint amendment at canonical commit `7531258`, including single-request `servers`, per-resource bulk requests, `maxServers`, and spec-defined fallback/security semantics where this repository owns them.
- Actual behavior: the current branch predates the amendment and still needs a graph-backed impact audit; existing resource APIs are expected to carry only URLs and therefore cannot preserve advisory Blossom locations.
- Error messages: none reported; this is living-spec drift rather than a runtime exception.
- Timeline: the NAP-RESOURCE amendment was committed on 2026-08-22 after PR #205 completed Phase 162 verification.
- Reproduction: type or send `resource.bytes` with `servers`, or `resource.bytesMany` with per-resource `{ url, servers }` entries, then inspect whether the SDK/shim/core/runtime path preserves the canonical wire envelope and behavior.

## Current Focus

- hypothesis: resolved — the dedicated protocol slice preserves the canonical `servers`/per-resource `requests` contract across repository-owned public APIs, transport, conformance, tests, and docs. The Vite optimizer observations remain historical evidence and stay with PR #205.
- test: complete — the original combined implementation passed exact literal/code-graph audits, focused and workspace regression suites, root type-check/build, assembled-site links, tutorial conformance, release checks, causal revert-and-reconfirm, release-metadata validation, secret scan, and the pinned AI-slop gate. This branch reruns the dedicated protocol slice separately.
- expecting: live resource-capable hosts receive valid envelopes; their advisory-origin acceptance, ordered fallback, network policy, and hash enforcement are downstream NAP-RESOURCE runtime responsibilities not implemented in this repository.
- next_action: local protocol branch ready for orchestrator-managed push and a dedicated PR; optional live-host observation is an external integration check, not a repository-owned blocker.

reasoning_checkpoint:
  hypothesis: "The Vite optimizer sends invalid bulk resource envelopes because its private ResourceDomain and emitted loader retained pre-amendment string-array parameters, so `bytesMany` passes raw URI strings instead of NAP-RESOURCE's ResourceBytesRequest objects."
  confirming_evidence:
    - "Live `origin/nap-resource` head `9511232` says `bytesMany` accepts a non-empty list of `ResourceBytesRequest` and each entry must be processed as `bytes(request.url, { servers: request.servers })`."
    - "`packages/vite-plugin/src/optimizer/loader.ts` declares `bytesMany(uris: string[])` and maps missing entries to `entry.uri`; its emitted loader repeats the same raw-string call."
    - "The focused Vite suite passes while its mocks and expectations accept strings, whereas the conformance validator now rejects non-object `requests` entries."
  falsification_test: "After the change, direct and emitted loader batch paths must call `bytesMany([{ url: uri }])`; observing any raw string request entry would disprove the fix."
  fix_rationale: "Wrap each optimizer-owned canonical URI as `{ url: entry.uri }` at the direct and generated batch boundaries, retaining no server metadata because the optimizer does not own or receive such hints."
  blind_spots: "The optimizer has no canonical server-hint source and must not manufacture one; live host fallback/security remains downstream runtime behavior after the payload is correctly shaped."
  candidate_causes:
    - "code: the optimizer's handwritten private ResourceDomain signature and emitted JavaScript template escaped the shared public API migration."
    - "config: conformance validation covered the shared transport but did not exercise the optimizer's private template against that contract."
  and_gate: "no — the same stale string-array assumption in the source and generated template is one source-level migration omission, not a combination of runtime conditions."

reasoning_checkpoint:
  hypothesis: "The pre-amendment URL-only resource model causes server hints to be erased because all repository-owned request adapters still declare/send `urls` rather than the canonical `servers` and per-resource `requests` fields."
  confirming_evidence:
    - "Live proposed NAP-RESOURCE head `9511232` requires `resource.bytes` `{ id, url, servers? }`, `resource.bytesMany` `{ id, requests }`, `ResourceBytesRequest`, and `ResourceInfo.maxServers?`."
    - "Current `packages/nap/src/resource/resource-transport.ts` emits `{ type: 'resource.bytes', id, url }` and `{ type: 'resource.bytesMany', id, urls }`; current type/API/test/validator/reference-prelude paths declare the same old shapes."
    - "Focused `@napplet/nap` and `@napplet/conformance` suites pass only because they assert/validate the obsolete `urls` shape."
  falsification_test: "If the unchanged shim posts `servers` on a single request and `requests` entries on a bulk request when the canonical regression runs, this hypothesis is false."
  fix_rationale: "Update the shared public types and every repository-owned adapter to carry the defined fields unchanged; expose only the defined optional `maxServers` capability. Do not add URL parameters, batch-wide hints, client-side fallback, or policy validation."
  blind_spots: "This repository has no production Blossom resource runtime, so live DNS/HTTPS origin validation, fallback, and hash behavior cannot be executed here; the shim must only preserve the canonical envelope and the reference shell must model it structurally."
  candidate_causes:
    - "code: resource types, API signatures, transport construction, and conformance responders were not migrated after the NAP-RESOURCE amendment."
    - "config: conformance's static envelope-spec table and injected runtime prelude still configure the pre-amendment `urls` payload."
  and_gate: "no — all observed failures stem from one missing source-level contract migration; no environment or input condition is needed to erase hints."

## Evidence

- timestamp: 2026-08-22T16:26:02+01:00 observation: canonical local NAP checkout commit `7531258` changes `resource.bytes` to carry optional `servers`, changes `resource.bytesMany` from `urls` to per-resource `requests`, adds `ResourceBytesRequest` and `ResourceInfo.maxServers`, and specifies ordered advisory Blossom fallback. implication: downstream URL-only resource envelopes are stale.
- timestamp: 2026-08-22T16:26:02+01:00 observation: current napplet branch is open PR #205, `feat/vite-plugin-blossom-optimization`, whose shipped concern is Blossom-backed resources. implication: the spec chase belongs on the existing branch/PR rather than a separate unrelated branch.
- timestamp: 2026-08-22T16:41:00+01:00 observation: no entry in `.planning/debug/knowledge-base.md` matches resource envelopes, Blossom locations, or server hints. implication: there is no durable prior-resolution candidate; investigation proceeds from canonical source and direct code evidence.
- timestamp: 2026-08-22T16:44:00+01:00 observation: canonical `naps/NAP-RESOURCE.md` at `7531258` defines `resource.bytes` with optional top-level `servers`, `resource.bytesMany` with required per-resource `requests`, `ResourceInfo.maxServers?`, and server hints as advisory metadata only for `blossom:` URLs. implication: consumers must preserve server hints verbatim in the defined envelope fields; cache keys and blossom fallback/security policy are runtime responsibilities only where this repository implements that runtime.
- timestamp: 2026-08-22T16:49:00+01:00 observation: code-graph snippets show `ResourceBytesMessage` has only `url`, `ResourceBytesManyMessage` uses `urls`, `ResourceApi.bytes/bytesMany` and resource SDK wrappers accept only URL strings, and the conformance reference shell maps `e.urls`. implication: the repository cannot emit or preserve the amended envelopes; the likely fix scope includes `packages/nap`, `packages/core`, and repository-owned conformance support.
- timestamp: 2026-08-22T16:54:00+01:00 observation: complete implementation and test reads confirm `resource-transport.ts` emits only `{ url }` and `{ urls }`, `shim.test.ts` asserts those obsolete shapes, and the conformance envelope validator requires `urls`. implication: this is deterministic protocol-shape drift (Bohrbug); code and conformance checks must change in tandem, while no repository component was found that implements live Blossom host fetching policy.
- timestamp: 2026-08-22T16:59:00+01:00 observation: the live `origin/nap-resource` head is `9511232f69313aa7953d110e35d32cc28d506f66`; its only change after `7531258` records the amendment in the changelog. implication: live canonical source confirms the original semantic diff exactly; stale `nub-resource` is not an authority for this investigation.
- timestamp: 2026-08-22T17:04:00+01:00 observation: the existing focused package test suites pass (`@napplet/nap`: 180 tests; `@napplet/conformance`: 70 tests) while asserting the obsolete URL-only bulk shape. implication: deterministic reproduction is established by a now-passing old-contract test suite; SBFL is skipped because there is no failing test and therefore no valid suspiciousness spectrum.
- timestamp: 2026-08-22T17:11:00+01:00 observation: exact-literal search found stale API/prelude/validator/reference-shell uses in `packages/core`, `packages/nap`, `packages/sdk`, `packages/conformance`, and four SDK/NAP documentation pages. The Phase 162 Blossom target independently reads manifest `server` tags to fetch `/index.html`; it neither emits nor consumes `resource.*` envelopes. implication: align the listed public/resource surfaces only; do not repurpose manifest server tags or modify independent Phase 162 fetch logic.
- timestamp: 2026-08-22T17:18:00+01:00 observation: GitHub reports no separate open PR with head `nap-resource`; the verified pushed proposal is `origin/nap-resource` at `9511232` (with `7531258` as its semantic commit), while #80 remains on a stale branch. implication: per the project governance direction, the live proposed branch is the implementation authority and merge status is not a blocker.
- timestamp: 2026-08-22T17:24:00+01:00 observation: after replacing stale shim expectations with canonical single `servers` and bulk `requests` shapes, the unchanged code fails both assertions: single envelopes omit `servers`; bulk envelopes emit `urls` containing request objects. implication: the falsification test confirms the root cause directly, and the specified-oracle regression now prevents this exact drift from recurring.
- timestamp: 2026-08-22T17:44:00+01:00 observation: the canonical migration makes the previously RED resource-shim regression green, and full affected `@napplet/nap` (181 tests) and `@napplet/conformance` (71 tests) unit suites pass. The new conformance checks validate optional string-list hints and non-empty per-resource request entries without attempting runtime-owned origin/fallback policy. implication: the public API, wire transport, test prelude, and reference shell now share the defined server-hint envelope.
- timestamp: 2026-08-22T17:49:00+01:00 observation: root `pnpm type-check` stopped at `@napplet/core`: `src/index.ts` re-exports `ResourceBytesRequest`, but the intermediate `src/types.ts` barrel did not. implication: this is a single missing public-barrel re-export, not evidence against the root-cause hypothesis; add it before resuming verification.
- timestamp: 2026-08-22T17:52:00+01:00 observation: after adding `ResourceBytesRequest` to the existing core types barrel, root `pnpm type-check` succeeds across all 21 workspace tasks and root `pnpm -r test:unit` succeeds, including 181 `@napplet/nap` and 71 `@napplet/conformance` tests. implication: the amended public type is correctly visible to all package consumers and the directly affected suites remain green.
- timestamp: 2026-08-22T18:01:00+01:00 observation: root `pnpm build` succeeds (14 workspace build tasks), including generated package declarations, the conformance application, and the documentation site. implication: the amended types and documentation compile into the published/build artifacts.
- timestamp: 2026-08-22T18:03:00+01:00 observation: repository and package-script searches find neither a Stryker configuration/dependency nor an executable AI-slop gate; `git diff --check` is clean. The inspected resource diff adds type fields and envelope construction/validation rather than deleting or short-circuiting behavior. implication: mutation testing and the mandated slop command are unavailable and must be recorded as skipped, while the no-op/deletion detector passes by direct diff inspection.
- timestamp: 2026-08-22T18:05:00+01:00 observation: after an explicitly scoped stash removed only the implementation paths, the unchanged agent-authored resource-shim regression failed exactly twice: `resource.bytes` omitted `servers`, and `resource.bytesMany` sent `urls` rather than `requests`. implication: the regression is causally sensitive to this migration, satisfying the pre-restoration half of revert-and-reconfirm.
- timestamp: 2026-08-22T18:06:00+01:00 observation: `git stash pop` restored all explicitly stashed implementation paths without conflict, and the unchanged resource-shim suite then passed all 181 tests. implication: the exact migration is both necessary and sufficient for the specified-envelope regression to pass, completing revert-and-reconfirm.
- timestamp: 2026-08-22T18:08:00+01:00 observation: the final literal audit found all wire/API usages migrated to `requests`, but a JSDoc example in `packages/core/src/types/global.ts` still passes a URL array to `bytesMany`. implication: this is documentation-only drift in an exported public type and must be aligned before handoff.
- timestamp: 2026-08-23T00:00:00+01:00 observation: after updating the core global JSDoc, the final literal audit finds no `urls` identifier in the public resource/core/SDK/conformance source or documentation targets, and `git diff --check` is clean. implication: the old bulk payload has been fully removed from the repository-owned active surface without whitespace errors.
- timestamp: 2026-08-23T00:20:00+01:00 observation: code-graph search identifies the resource shim, SDK façade, typed public API, and conformance reference shell as the only resource request-path implementations. The independently discovered `apps/conformance` and CLI Blossom helpers read manifest `server` tags or upload deployment payloads; neither consumes `resource.*` envelopes. implication: no production resource-capable host or host-side NAP-RESOURCE fallback policy is implemented in this repository.
- timestamp: 2026-08-23T00:22:00+01:00 observation: `.github/workflows/ai-slop.yml` tracks the `sandwichfarm/aislop-badge@v1` quality gate with `aislop-version: "0.12.0"`, a minimum score of 70, and no failure on external dependency advisories. `pnpm dlx aislop@0.12.0 scan --json .` exits 0 at score 99 with zero format, lint, AI-slop, and security findings; its only diagnostics are two unrelated non-fixable code-quality style warnings in `packages/cli/src/cli.ts` and `scripts/sync-jsr-versions.mjs`. implication: the earlier unavailable-gate claim is false; the gate is runnable and passes its configured CI threshold without a defect in this migration.
- timestamp: 2026-08-23T00:25:00+01:00 observation: the focused `@napplet/nap` resource shim suite passes 181/181 tests. Current conformance tests assert single `servers`, bulk per-resource `requests`, malformed-entry rejection, and injected runtime preservation; the literal audit reports no old `urls` payload in active resource/core/SDK/conformance/docs paths. implication: the repository-owned envelope contract has direct regression coverage and no stale wire shape remains.
- timestamp: 2026-08-23T00:30:00+01:00 observation: the final code-path audit finds `packages/vite-plugin/src/optimizer/loader.ts` emits a generated `resourceBytesMany(uris)` helper and calls it with `missing.map((entry) => entry.uri)`. The public `ResourceApi.bytesMany` now accepts `ResourceBytesRequest[]`, and the migrated shim serializes `requests` verbatim. implication: optimized artifacts send invalid bulk request entries despite the package/core/conformance migration; this is a remaining repository-owned implementation and test gap, so human host observation cannot be classified as the only outstanding check.
- timestamp: 2026-08-23T00:35:00+01:00 observation: live canonical `naps/NAP-RESOURCE.md` at `origin/nap-resource` head `9511232` requires `bytesMany` entries to be `ResourceBytesRequest` objects and per-entry processing equivalent to `bytes(request.url, { servers: request.servers })`. The unmodified focused Vite loader suite passes 79/79 with string-array mocks and expectations. implication: direct source comparison and a green-but-wrong focused suite confirm both the implementation defect and missing regression oracle.
- timestamp: 2026-08-23T00:45:00+01:00 observation: after the direct and emitted loader are migrated, `@napplet/core` resource and conformance suites pass (181 and 71 tests) and Vite type-check passes, but the Vite optimizer suite fails in `large-fixture.test.ts`: its `large-fixture.ts` test adapter still returns results from string request values. implication: the contract migration also requires this test-only fixture adapter; the failure is a precise stale-mock signal, not a regression in the corrected loader.
- timestamp: 2026-08-23T00:50:00+01:00 observation: after migrating the fixture adapter, Vite type-check passes and all behavioral loader tests pass; the sole remaining Vite failure is the deterministic fixture's expected final HTML hash, because the generated loader now contains canonical request-object code. implication: refresh the paired fixture hash evidence after verifying the new artifact output; this is a byte-expectation update, not a behavioral defect.
- timestamp: 2026-08-23T00:55:00+01:00 observation: `@napplet/vite-plugin` passes all 79 unit tests; the workspace unit suite, root type-check, and root build all pass. The rerun pinned AI-slop gate exits 0 at score 99 with zero AI-slop, format, lint, and security diagnostics, retaining only two pre-existing non-fixable unrelated style warnings. implication: all executable quality gates for the changed code pass; only causal verification and release metadata remain.
- timestamp: 2026-08-23T00:58:00+01:00 observation: `.changeset/bright-frogs-remember.md` covers core, nap, sdk, and conformance but omits `@napplet/vite-plugin`, even though this closeout fix changes its emitted loader bytes and deterministic artifact hashes. implication: update the same release metadata so every package with changed shipped output receives a release entry.
- timestamp: 2026-08-23T01:05:00+01:00 observation: a scoped stash removed only `loader.ts`, `large-fixture.ts`, and its deterministic evidence while retaining the new loader regression. The direct Vite loader test then failed exactly at both bulk request assertions because the reverted implementation handed string values to object-shaped mocks. implication: the optimizer migration is causally necessary for the specified request-object behavior; restore the scoped paths and reconfirm green.
- timestamp: 2026-08-23T01:08:00+01:00 observation: restoring the scoped paths returns the unchanged direct Vite regression to green (7/7). The Vite suite passes 79/79, the workspace unit suite passes, and root type-check/build pass; the rerun pinned `aislop@0.12.0` scan exits 0 at score 99 with zero AI-slop, format, lint, and security findings and two unrelated non-fixable style warnings. implication: the fix-acceptance guardrail is satisfied for every applicable repository-owned signal.
- timestamp: 2026-08-23T01:10:00+01:00 observation: final literal audit finds no string-array `bytesMany` request caller or stale resource `urls` envelope in the active resource/core/SDK/conformance/Vite paths; `git diff --check` is clean. Changeset status includes a minor `@napplet/vite-plugin` release with the resource packages. Code-graph and source audits find only the napplet shim and structural conformance reference shell as `resource.*` handlers, not a production resource-capable host. implication: no repository-owned implementation or test gap remains; live advisory-origin acceptance/fallback/security observation is downstream and out of scope for this repository.
- timestamp: 2026-08-26T11:20:00+01:00 observation: independent root audit found `packages/shim/README.md` still documented `resource.bytesMany` with `urls`, both shim/SDK package READMEs repeated the retired strict-CSP loading model, and `specs/SHELL-RESOURCE-POLICY.md` advertised undocumented `nap:resource`, `resource:scheme:*`, and `perm:strict-csp` capabilities. implication: the delegated literal audit was too narrowly scoped; these active protocol docs had to be migrated or retired before completion.
- timestamp: 2026-08-26T11:30:00+01:00 observation: package docs now include `resource.info`, optional single-request `servers`, per-resource bulk `requests`, and the complete error vocabulary; the operator checklist uses only `shell.supports('resource')` plus `resource.info()`, records server-hint integration points, and links the live NIP-5D source. `@napplet/shim` was added to the changeset because its bundled browser prelude ships the amended resource API. implication: all shipped documentation and release metadata now move with the changed contract without retaining invented capability surface.
- timestamp: 2026-08-26T11:43:15+01:00 observation: final root verification passed the build secret scanner (5/5 plus 128-input outward scan), `pnpm build`, `pnpm type-check`, `pnpm -r test:unit`, an assembled-site crawl of 23 internal URLs, `pnpm check:jsr`, release-tooling tests, tutorial reconstruction/conformance (5 pass, 0 fail, 5 documented skips), `pnpm lint` (no configured tasks), `aislop@0.12.0 --changes --base origin/main` at 100/100, and `git diff --check`. implication: code, generated optimizer bytes, docs, package exports, release metadata, and repository quality gates all accept the amendment.

## Eliminated

## Resolution

- root_cause: The repository retained NAP-RESOURCE's pre-amendment URL-only resource contract in its public types, request transport, SDK facades, conformance prelude/validator/reference shell, and examples; consequently `servers` could not be represented or sent and bulk requests emitted obsolete `urls`. The original combined investigation also found a separate Vite optimizer migration omission, which is intentionally retained in PR #205 rather than this dedicated protocol branch.
- fix: Added `ResourceBytesRequest` and `ResourceInfo.maxServers?`; changed single request options to carry optional `servers`; replaced bulk `urls` with per-resource `requests`; updated the nap shim/SDK, injected shim prelude documentation, SDK facade, conformance validator/prelude/reference shell, examples, operator guidance, and release metadata. Removed undocumented strict-CSP and capability-discovery claims encountered in the touched NAP-RESOURCE surface. Validation checks only defined payload shape; it leaves advisory-server origin acceptance, fallback, cache behavior, and network security to host runtimes. The optimizer direct/generated loader, fixture, and `@napplet/vite-plugin` release entry remain in PR #205.
- verification:
    target_test: { result: pass, suites: ["pnpm --filter @napplet/nap test:unit -- src/resource/shim.test.ts (181/181)", "pnpm --dir packages/vite-plugin exec vitest run --config vitest.config.ts src/optimizer/loader.test.ts (7/7)", "pnpm --filter @napplet/vite-plugin test:unit (79/79)"], detail: "the exact resource-envelope and optimizer request-object regressions pass" }
    mutation_check: { result: skipped, reason_if_skipped: "no Stryker dependency or configuration exists in the repository" }
    no_op_deletion: { result: pass, deletion_justified_by_rca: false, evidence: "clean diff check; contract migration adds fields, transport preservation, tests, and docs without bypassing request behavior" }
    adjacent_tests: { result: pass, suites_run: ["pnpm --filter @napplet/conformance test:unit (71/71)", "pnpm --filter @napplet/shim test:unit (15/15)", "pnpm -r test:unit", "pnpm type-check", "pnpm build", "assembled-site link crawl (23 URLs)", "pnpm check:jsr", "pnpm test:release-tooling", "pnpm test:tutorial"] }
    revert_and_reconfirm: { result: pass, bug_returned_on_revert: true, fixed_on_reapply: true, detail: "scoped Vite implementation stash caused the two exact request-object failures; restoring it returned the unchanged direct regression to green (7/7)" }
    build: { result: pass, command: "pnpm build", tasks: "14 successful" }
    ai_slop_gate: { result: pass, command: "pnpm dlx aislop@0.12.0 scan --changes --base origin/main .", detail: "score 100 / Healthy; zero findings across AI-slop, format, code quality, lint, and security" }
    guardrail_verdict: accepted
- files_changed:
  - packages/core/src/types/global/runtime-api.ts
  - packages/core/src/types.ts
  - packages/core/src/types/global.ts
  - packages/core/src/index.ts
  - packages/nap/src/resource/types.ts
  - packages/nap/src/resource/index.ts
  - packages/nap/src/resource/resource-transport.ts
  - packages/nap/src/resource/shim.ts
  - packages/nap/src/resource/sdk.ts
  - packages/nap/src/resource/shim.test.ts
  - packages/sdk/src/config.ts
  - packages/sdk/src/nap-types-foundation.ts
  - packages/vite-plugin/src/optimizer/loader.ts
  - packages/vite-plugin/src/optimizer/loader.test.ts
  - packages/vite-plugin/src/optimizer/large-fixture.ts
  - packages/vite-plugin/src/optimizer/large-fixture.evidence.json
  - packages/conformance/src/validators/envelope-types.ts
  - packages/conformance/src/validators/envelope-validation.ts
  - packages/conformance/src/validators/envelope-specs.ts
  - packages/conformance/src/validators/envelope.test.ts
  - packages/conformance/src/shell/reference-responses.ts
  - packages/conformance/src/shell/reference-shell.test.ts
  - packages/conformance/src/run/boot.ts
  - packages/conformance/src/run/boot.test.ts
  - apps/docs/naps/index.md
  - apps/docs/packages/sdk.md
  - packages/nap/README.md
  - packages/sdk/README.md
  - packages/shim/README.md
  - specs/SHELL-RESOURCE-POLICY.md
  - .changeset/bright-frogs-remember.md
- oracle_type: specified (the exact live NAP-RESOURCE proposed interface at `origin/nap-resource` head `9511232`)

## PR Split

- 2026-08-26: The original combined commit was split after review direction into this dedicated NAP-RESOURCE server-hint branch and PR #205's optimizer branch. This artifact retains its timestamped optimizer observations as investigation provenance, but this branch contains neither the four `packages/vite-plugin/src/optimizer/` files nor an `@napplet/vite-plugin` changeset entry.
