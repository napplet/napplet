---
phase: 46
slug: shell-assigned-keypair-handshake
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-02
---

# Phase 46 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright (e2e) + vitest (unit via runtime dispatch.test.ts) |
| **Config file** | `tests/e2e/vite.config.ts` / `packages/runtime/vitest.config.ts` |
| **Quick run command** | `pnpm test -- --grep "auth\|storage\|state"` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm build && pnpm type-check`
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 46-01-01 | 01 | 1 | AUTH-01 | e2e | `pnpm test -- --grep "REGISTER"` | W0 | pending |
| 46-01-02 | 01 | 1 | AUTH-02 | e2e | `pnpm test -- --grep "IDENTITY"` | W0 | pending |
| 46-01-03 | 01 | 1 | AUTH-03 | e2e | `pnpm test -- --grep "AUTH.*delegated"` | W0 | pending |
| 46-01-04 | 01 | 1 | AUTH-04 | unit | `pnpm test -- --grep "shellSecret"` | W0 | pending |
| 46-02-01 | 02 | 1 | STORE-01 | unit | `pnpm test -- --grep "scopedKey"` | Exists (state-isolation) | pending |
| 46-02-02 | 02 | 1 | STORE-02 | e2e | `pnpm test -- --grep "storage.*reload"` | W0 | pending |
| 46-02-03 | 02 | 1 | STORE-03 | e2e | `pnpm test -- --grep "storage.*isolation"` | Exists | pending |
| 46-03-01 | 03 | 2 | VERIFY-01 | unit | `pnpm test -- --grep "aggregate.*hash"` | W0 | pending |
| 46-03-02 | 03 | 2 | VERIFY-02 | unit | `pnpm test -- --grep "hash.*mismatch"` | W0 | pending |
| 46-03-03 | 03 | 2 | VERIFY-03 | unit | `pnpm test -- --grep "verification.*cache"` | W0 | pending |
| 46-04-01 | 04 | 2 | INST-01 | e2e | `pnpm test -- --grep "GUID"` | W0 | pending |
| 46-05-01 | 05 | 2 | SEC-01 | e2e | `pnpm test -- --grep "delegated.*relay"` | W0 | pending |
| 46-05-02 | 05 | 2 | SEC-02 | e2e | `pnpm test -- --grep "signer.*publish"` | W0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] Update `tests/e2e/auth-handshake.spec.ts` — add REGISTER/IDENTITY test cases
- [ ] Update `tests/e2e/state-isolation.spec.ts` — add persistence-across-reload tests
- [ ] Update `tests/e2e/harness/` — test harness must support new message types

*Existing infrastructure covers most framework needs; test stubs needed for new protocol messages.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Hash mismatch user warning | VERIFY-02 | UI behavior depends on host app | Send REGISTER with wrong hash, verify onHashMismatch callback fires |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
