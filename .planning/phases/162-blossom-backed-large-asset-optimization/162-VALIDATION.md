---
phase: 162
slug: blossom-backed-large-asset-optimization
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-08-21
---

# Phase 162 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 for `@napplet/vite-plugin` and `@napplet/build-tools`; Deno test for cross-runtime and existing CLI regressions; Node test for the secret scanner |
| **Config file** | `packages/vite-plugin/vitest.config.ts`; `packages/build-tools/package.json`; `packages/cli/deno.json` |
| **Quick run command** | The targeted `<automated>` command for the active task |
| **Full suite command** | `pnpm -r test:unit` |
| **Estimated runtime** | ~30 seconds quick; ~120 seconds full |

---

## Sampling Rate

- **After every task commit:** Run that task's targeted command below before its atomic commit.
- **After Waves 2–4:** Run `pnpm --filter @napplet/vite-plugin test:unit`, `pnpm --filter @napplet/build-tools test:unit`, and the touched Deno CLI files.
- **After Wave 5:** Run the generated fixture, secret scan, complete Deno CLI suite, `pnpm build`, `pnpm type-check`, `pnpm -r test:unit`, docs/link/JSR/release checks, and the pinned AI-slop gate.
- **Before `$gsd-verify-work`:** Full suite must be green.
- **Max feedback latency:** 30 seconds for the quick suite.

---

## Per-Task Verification Map

Phase 162 has no ROADMAP/REQUIREMENTS IDs, so the spec-less probe fallback was visibly skipped and generated no predicates. The `Requirement` column therefore cites the controlling decision range or canonical-boundary predicate rather than inventing an ID. Every final plan/task ID is listed below.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 162-01-01 | 01 | 1 | D-01–D-04, D-14–D-21 | T-162-01–06 | Tracer proves exact threshold, deterministic render/selection, verified fake upload, reversible commit, canonical private rewrite, and fake NAP byte recovery | unit + tracer integration | `pnpm --filter @napplet/vite-plugin test:unit -- optimizer/pipeline.test.ts` | ❌ W0 | ⬜ pending |
| 162-02-01 | 02 | 2 | D-06–D-08 | T-162-07–10 | Shared NIP-46 signer is least-authority, signature-verified, abortable, and redaction-safe | unit | `pnpm --filter @napplet/build-tools test:unit -- signer.test.ts` | ❌ W0 | ⬜ pending |
| 162-02-02 | 02 | 2 | D-05, D-07, D-27 | T-162-07–11 | QR/paste race, protected persistence, platform stores, and cross-runtime adapters are deterministic and secret-safe | unit + cross-runtime | `pnpm --filter @napplet/build-tools test:unit -- secret-store.test.ts terminal.test.ts` | ❌ W0 | ⬜ pending |
| 162-02-03 | 02 | 2 | D-08, D-27 | T-162-SC | Package builds/imports under Node and Deno with audited dependencies and no consumer cycle | build + type + Deno | `pnpm --filter @napplet/build-tools build && pnpm --filter @napplet/build-tools type-check && deno check packages/build-tools/src/index.ts` | ❌ W0 | ⬜ pending |
| 162-03-01 | 03 | 3 | D-05, D-08 | T-162-12–14 | Existing CLI QR/paste behavior delegates to shared signer and closes all Deno resources | Deno regression | `deno test --allow-env --allow-read packages/cli/tests/nostr_connect_test.ts` | ⚠️ partial | ⬜ pending |
| 162-03-02 | 03 | 3 | D-06, D-07 | T-162-12–15 | Existing protected stores and deploy branches use verified BuildSigner results | Deno regression | `deno test --allow-env --allow-read --allow-write --allow-run packages/cli/tests/key_store_test.ts packages/cli/tests/deploy_signer_test.ts` | ⚠️ partial | ⬜ pending |
| 162-03-03 | 03 | 3 | D-08 | T-162-12–16 | Complete existing CLI regression suite proves compatibility after extraction | Deno regression | `deno test --allow-all packages/cli/tests` | ✅ existing | ⬜ pending |
| 162-04-01 | 04 | 3 | D-09–D-13 | T-162-17–19, T-162-22–23 | Signed newest events, corrected write-relay direction, ordered server list, no-list result, SSRF and rebinding defenses | unit | `pnpm --filter @napplet/build-tools test:unit -- discovery.test.ts network-policy.test.ts` | ❌ W0 | ⬜ pending |
| 162-04-02 | 04 | 3 | D-14, D-15, D-28, D-29 | T-162-20–23 | Exact BUD upload authorization, descriptor binding, direct secondary policy, bounds, and partial failure | local HTTP integration | `pnpm --filter @napplet/build-tools test:unit -- blossom.test.ts` | ❌ W0 | ⬜ pending |
| 162-05-01 | 05 | 4 | D-09–D-13 | T-162-24 | CLI suggestions prove the corrected shared discovery direction and explicit no-list behavior | Deno regression | `deno test --allow-env --allow-read --allow-net packages/cli/tests/suggestions_test.ts` | ⚠️ partial | ⬜ pending |
| 162-05-02 | 05 | 4 | D-14, D-28, D-29 | T-162-25–28 | CLI deploy uses shared exact-byte upload, URL policy, direct secondary and failed-batch semantics | Deno regression | `deno test --allow-all packages/cli/tests/deploy_network_test.ts packages/cli/tests/deploy_plan_test.ts` | ⚠️ partial | ⬜ pending |
| 162-06-01 | 06 | 3 | D-20 | T-162-29, T-162-33–34, T-162-SC | Parser-backed supported-form matrix and byte-preserving ineligibility for unsupported/mixed forms | unit | `pnpm --filter @napplet/vite-plugin test:unit -- optimizer/references.test.ts` | ❌ W0 | ⬜ pending |
| 162-06-02 | 06 | 3 | D-19–D-21, D-29 | T-162-30–32 | Loader uses only whole-Blob resource methods, checks association/hash/size, and bounds memory/object URLs | browser unit | `pnpm --filter @napplet/vite-plugin test:unit -- optimizer/loader.test.ts` | ❌ W0 | ⬜ pending |
| 162-06-03 | 06 | 3 | D-02–D-04, D-20 | T-162-29, T-162-34 | Complete reference support is required before selection and unsupported cost remains in actual renders | unit | `pnpm --filter @napplet/vite-plugin test:unit -- optimizer/pipeline.test.ts optimizer/references.test.ts optimizer/loader.test.ts` | ❌ W0 | ⬜ pending |
| 162-07-01 | 07 | 4 | D-05–D-10 | T-162-35–38, T-162-SC | Node platform adapters are lazy, fakeable, abortable, protected-store backed, and secret-safe | unit | `pnpm --filter @napplet/vite-plugin test:unit -- optimizer/node-services.test.ts` | ❌ W0 | ⬜ pending |
| 162-07-02 | 07 | 4 | D-01–D-15 | T-162-35–42 | Automatic live flow is lazy and every unavailable/conflicting/failing condition preserves an inline artifact | integration | `pnpm --filter @napplet/vite-plugin test:unit -- optimizer/pipeline.test.ts optimizer/node-services.test.ts` | ❌ W0 | ⬜ pending |
| 162-07-03 | 07 | 4 | D-16–D-21 | T-162-35–41 | Transaction/manifest/security matrix prevents secret, substitution, SSRF, partial commit, and premature hash failures | integration + security | `pnpm --filter @napplet/vite-plugin test:unit -- index.test.ts optimizer/security.test.ts` | ❌ W0 | ⬜ pending |
| 162-08-01 | 08 | 5 | D-22–D-24 | T-162-43–46 | Generated 50 MiB+ bounded assets prove real trigger, signed discovery/upload, final size, aggregate hash, and exact NAP recovery | generated local integration | `pnpm --filter @napplet/vite-plugin test:unit -- optimizer/large-fixture.test.ts` | ❌ W0 | ⬜ pending |
| 162-08-02 | 08 | 5 | D-24 | T-162-48 | Docs and package examples match canonical boundaries and the declared support/opt-out matrix | docs + build | `pnpm check:links && pnpm --filter @napplet/vite-plugin build && pnpm --filter @napplet/build-tools build` | ❌ W0 | ⬜ pending |
| 162-08-03 | 08 | 5 | D-25 | T-162-45, T-162-47, T-162-SC | Secret, full repo, release, docs, slop, diff, push, and PR gates provide durable evidence | full gate | `node --test scripts/check-build-secret-leaks.test.mjs && node scripts/check-build-secret-leaks.mjs && deno check packages/build-tools/src/index.ts && deno test --allow-all packages/cli/tests && pnpm build && pnpm type-check && pnpm -r test:unit && pnpm check:links && pnpm check:jsr && pnpm test:release-tooling && npx --yes aislop@0.12.0 scan --changes --base origin/main && git diff --check` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Before production logic in 162-01-01: create `packages/vite-plugin/src/optimizer/pipeline.test.ts` for boundary, selection, upload seam, rollback, and recovery.
- [ ] Before production logic in 162-02-01/02: create `packages/build-tools/src/signer.test.ts`, `secret-store.test.ts`, and `terminal.test.ts`.
- [ ] Before production logic in 162-04-01/02: create `discovery.test.ts`, `network-policy.test.ts`, and `blossom.test.ts` with forged/stale, SSRF/rebinding, descriptor, and partial-batch vectors.
- [ ] Before production logic in 162-06-01/02: create `references.test.ts` and `loader.test.ts` for every supported/ineligible form and whole-Blob boundary.
- [ ] Before live wiring in 162-07-01/02/03: create `node-services.test.ts` and `security.test.ts`, including existing `experimental.renderBuiltUrl` behavior and every high-severity threat.
- [ ] Before phase sign-off in 162-08-01: create the deterministic generated 50 MiB+ local relay/Blossom plus fake NAP-RESOURCE fixture using multiple individually bounded blobs.
- [ ] Before phase sign-off in 162-08-03: create the secret scanner/tests covering final HTML, manifest, temporary build files, reports, config/cache-facing artifacts, and captured logs.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Terminal QR legibility and real remote-signer pairing | D-05–D-07 | Automated tests can validate URI, QR renderer calls, paste fallback, reconnect, and redaction, but cannot guarantee a particular terminal or third-party signer UI | Run the optimized generated example without a stored signer, scan the displayed `nostrconnect://` QR with a NIP-46 signer, authorize only `get_public_key` and kind `24242` signing, rebuild, and confirm stored reconnect avoids a second pairing prompt |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify and named test-first dependencies where production behavior is added.
- [x] Sampling continuity: every task has an automated verify command.
- [x] Wave 0 identifies every missing test artifact before dependent implementation.
- [x] No watch-mode flags.
- [x] Targeted feedback latency is planned below 30 seconds except the intentionally generated large fixture and final full gates.
- [x] `nyquist_compliant: true` set in frontmatter.

**Approval:** planned; `wave_0_complete` remains false until the named tests are created and observed red during execution.
