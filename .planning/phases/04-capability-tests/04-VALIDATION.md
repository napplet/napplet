---
phase: 4
slug: capability-tests
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-30
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright (real Chromium) |
| **Config file** | `playwright.config.ts` |
| **Quick run command** | `pnpm test:e2e --grep "ACL\|STR\|SGN\|IPC"` |
| **Full suite command** | `pnpm test:e2e` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test:e2e`
- **After every plan wave:** Run `pnpm test:e2e` (full suite includes Phase 2/3 tests as regression)
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | - | harness | `pnpm --filter @test/harness build` | existing | pending |
| 04-01-02 | 01 | 1 | D-02 | code fix | `pnpm build` | existing | pending |
| 04-02-01 | 02 | 2 | ACL-01 | e2e | `pnpm test:e2e --grep "ACL-01"` | W0 | pending |
| 04-02-02 | 02 | 2 | ACL-02 | e2e | `pnpm test:e2e --grep "ACL-02"` | W0 | pending |
| 04-02-03 | 02 | 2 | ACL-03 | e2e | `pnpm test:e2e --grep "ACL-03"` | W0 | pending |
| 04-02-04 | 02 | 2 | ACL-04 | e2e | `pnpm test:e2e --grep "ACL-04"` | W0 | pending |
| 04-02-05 | 02 | 2 | ACL-05 | e2e | `pnpm test:e2e --grep "ACL-05"` | W0 | pending |
| 04-02-06 | 02 | 2 | ACL-06 | e2e | `pnpm test:e2e --grep "ACL-06"` | W0 | pending |
| 04-02-07 | 02 | 2 | ACL-07 | e2e | `pnpm test:e2e --grep "ACL-07"` | W0 | pending |
| 04-02-08 | 02 | 2 | ACL-08 | e2e | `pnpm test:e2e --grep "ACL-08"` | W0 | pending |
| 04-02-09 | 02 | 2 | ACL-09 | e2e | `pnpm test:e2e --grep "ACL-09"` | W0 | pending |
| 04-03-01 | 03 | 2 | STR-01 | e2e | `pnpm test:e2e --grep "STR-01"` | W0 | pending |
| 04-03-02 | 03 | 2 | STR-02 | e2e | `pnpm test:e2e --grep "STR-02"` | W0 | pending |
| 04-03-03 | 03 | 2 | STR-03 | e2e | `pnpm test:e2e --grep "STR-03"` | W0 | pending |
| 04-03-04 | 03 | 2 | STR-04 | e2e | `pnpm test:e2e --grep "STR-04"` | W0 | pending |
| 04-03-05 | 03 | 2 | STR-05 | e2e | `pnpm test:e2e --grep "STR-05"` | W0 | pending |
| 04-03-06 | 03 | 2 | STR-06 | e2e | `pnpm test:e2e --grep "STR-06"` | W0 | pending |
| 04-03-07 | 03 | 2 | STR-07 | e2e | `pnpm test:e2e --grep "STR-07"` | W0 | pending |
| 04-03-08 | 03 | 2 | STR-08 | e2e | `pnpm test:e2e --grep "STR-08"` | W0 | pending |
| 04-03-09 | 03 | 2 | STR-09 | e2e | `pnpm test:e2e --grep "STR-09"` | W0 | pending |
| 04-04-01 | 04 | 2 | SGN-01 | e2e | `pnpm test:e2e --grep "SGN-01"` | W0 | pending |
| 04-04-02 | 04 | 2 | SGN-02 | e2e | `pnpm test:e2e --grep "SGN-02"` | W0 | pending |
| 04-04-03 | 04 | 2 | SGN-03 | e2e | `pnpm test:e2e --grep "SGN-03"` | W0 | pending |
| 04-04-04 | 04 | 2 | SGN-04 | e2e | `pnpm test:e2e --grep "SGN-04"` | W0 | pending |
| 04-04-05 | 04 | 2 | SGN-05 | e2e | `pnpm test:e2e --grep "SGN-05"` | W0 | pending |
| 04-04-06 | 04 | 2 | SGN-06 | e2e | `pnpm test:e2e --grep "SGN-06"` | W0 | pending |
| 04-04-07 | 04 | 2 | SGN-07 | e2e | `pnpm test:e2e --grep "SGN-07"` | W0 | pending |
| 04-05-01 | 05 | 2 | IPC-01 | e2e | `pnpm test:e2e --grep "IPC-01"` | W0 | pending |
| 04-05-02 | 05 | 2 | IPC-02 | e2e | `pnpm test:e2e --grep "IPC-02"` | W0 | pending |
| 04-05-03 | 05 | 2 | IPC-03 | e2e | `pnpm test:e2e --grep "IPC-03"` | W0 | pending |
| 04-05-04 | 05 | 2 | IPC-04 | e2e | `pnpm test:e2e --grep "IPC-04"` | W0 | pending |
| 04-05-05 | 05 | 2 | IPC-05 | e2e | `pnpm test:e2e --grep "IPC-05"` | W0 | pending |
| 04-05-06 | 05 | 2 | IPC-06 | e2e | `pnpm test:e2e --grep "IPC-06"` | W0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `tests/e2e/harness/harness.ts` — extended with ACL, storage, signer, and registry access globals
- [ ] `packages/shell/src/storage-proxy.ts` — quota calculation fixed (Blob to TextEncoder)
- [ ] Existing test infrastructure (harness, helpers, napplets) from Phase 2/3 covers remaining needs

*Wave 0 is Plan 01 (harness extensions + code fix).*

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
