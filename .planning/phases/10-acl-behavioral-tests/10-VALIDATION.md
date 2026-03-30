---
phase: 10
slug: acl-behavioral-tests
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-30
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright Test (existing) |
| **Config file** | `tests/e2e/vite.config.ts` |
| **Quick run command** | `npx playwright test --grep "ACL Matrix"` |
| **Full suite command** | `npx playwright test tests/e2e/acl-*.spec.ts` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx playwright test --grep "ACL Matrix"`
- **After every plan wave:** Run `npx playwright test tests/e2e/acl-*.spec.ts`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | TST-01, TST-02 | e2e | `npx playwright test acl-matrix-relay` | ❌ W1 | ⬜ pending |
| 10-01-02 | 01 | 1 | TST-01, TST-02 | e2e | `npx playwright test acl-matrix-signer` | ❌ W1 | ⬜ pending |
| 10-01-03 | 01 | 1 | TST-01, TST-02 | e2e | `npx playwright test acl-matrix-state` | ❌ W1 | ⬜ pending |
| 10-01-04 | 01 | 1 | TST-01, TST-02 | e2e | `npx playwright test acl-matrix-hotkey` | ❌ W1 | ⬜ pending |
| 10-02-01 | 02 | 2 | TST-03, TST-04, TST-05, TST-06 | e2e | `npx playwright test acl-lifecycle` | ❌ W2 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. The test harness (tests/e2e/harness/harness.ts) already exposes all needed ACL control functions and the message tap.

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [x] All tasks have automated verify commands
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
