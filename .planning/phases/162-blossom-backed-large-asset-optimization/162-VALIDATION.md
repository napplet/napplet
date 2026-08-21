---
phase: 162
slug: blossom-backed-large-asset-optimization
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-21
---

# Phase 162 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 for `@napplet/vite-plugin`; Deno test for existing CLI regressions |
| **Config file** | `packages/vite-plugin/vitest.config.ts`; `packages/cli/deno.json` |
| **Quick run command** | `pnpm --filter @napplet/vite-plugin test:unit` |
| **Full suite command** | `pnpm -r test:unit` |
| **Estimated runtime** | ~30 seconds quick; ~120 seconds full |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @napplet/vite-plugin test:unit` plus any touched shared-service tests.
- **After every plan wave:** Run `pnpm -r test:unit` and the targeted Deno signer/upload regression suite.
- **Before `$gsd-verify-work`:** Full suite must be green.
- **Max feedback latency:** 30 seconds for the quick suite.

---

## Per-Task Verification Map

Task IDs and plan allocation are provisional until the planner writes the executable plans; every row must be reconciled against the final task graph before execution.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 162-01-01 | TBD | 0 | TBD-01 | T-162-01 | Threshold branch does not contact signer or network at or below 2 MiB | unit | `pnpm --filter @napplet/vite-plugin test:unit` | ❌ W0 | ⬜ pending |
| 162-01-02 | TBD | 0 | TBD-02 | Selection is deterministic and failure preserves emitted assets | unit | `pnpm --filter @napplet/vite-plugin test:unit` | ❌ W0 | ⬜ pending |
| 162-01-03 | TBD | 0 | TBD-03 | Signer secrets remain in the OS credential store and are redacted everywhere else | unit + Deno regression | `pnpm --filter @napplet/vite-plugin test:unit && deno test --allow-read --allow-write --allow-run --allow-env packages/cli/tests/nostr_connect_test.ts packages/cli/tests/deploy_signer_test.ts` | ⚠️ partial | ⬜ pending |
| 162-01-04 | TBD | 0 | TBD-04 | Only verified signer-authored events are accepted; kind 10063 is queried on write/unmarked relays | unit | `pnpm --filter @napplet/vite-plugin test:unit` | ❌ W0 | ⬜ pending |
| 162-01-05 | TBD | 0 | TBD-05 | Upload authorization is hash/server scoped and descriptor hashes must match exact bytes | local integration + Deno regression | `pnpm --filter @napplet/vite-plugin test:unit && deno test --allow-read --allow-write --allow-run --allow-env packages/cli/tests/deploy_network_test.ts` | ⚠️ partial | ⬜ pending |
| 162-01-06 | TBD | 0 | TBD-06 | Loader uses only NAP-RESOURCE, rechecks result association, and never grants raw Blossom networking | unit + DOM integration | `pnpm --filter @napplet/vite-plugin test:unit` | ❌ W0 | ⬜ pending |
| 162-01-07 | TBD | 0 | TBD-07 | Generated 50 MiB fixture proves exact uploads, final size, mapping, and byte-identical recovery | local integration | `pnpm --filter @napplet/vite-plugin test:unit` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/vite-plugin/src/optimizer/*.test.ts` — exact boundary, selection order, rollback, discovery, and loader tests.
- [ ] Node adapter tests for extracted NIP-46, key-store, relay, and Blossom upload services.
- [ ] A deterministic generated 50 MiB local relay/Blossom plus fake NAP-RESOURCE integration fixture using several individually bounded blobs.
- [ ] A fixture covering composition or safe bypass when a user already supplies Vite `experimental.renderBuiltUrl` behavior.
- [ ] Secret-scanning assertions for final HTML, manifest, temporary build files, and captured logs.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Terminal QR legibility and real remote-signer pairing | TBD-03 | Automated tests can validate URI, QR renderer calls, paste fallback, reconnect, and redaction, but cannot guarantee a particular terminal or third-party signer UI | Run the optimized fixture without a stored signer, scan the displayed `nostrconnect://` QR with a NIP-46 signer, authorize only `get_public_key` and kind `24242` signing, rebuild, and confirm stored reconnect avoids a second pairing prompt |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies.
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify.
- [ ] Wave 0 covers all MISSING references.
- [ ] No watch-mode flags.
- [ ] Feedback latency < 30 seconds.
- [ ] `nyquist_compliant: true` set in frontmatter.

**Approval:** pending
