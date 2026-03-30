---
phase: 9
slug: acl-enforcement-gate
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-30
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (via Playwright for e2e) |
| **Config file** | `tests/e2e/vite.config.ts` |
| **Quick run command** | `pnpm type-check` |
| **Full suite command** | `pnpm build && pnpm type-check` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm type-check`
- **After every plan wave:** Run `pnpm build && pnpm type-check`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | ENF-01 | type-check | `pnpm type-check` | N/A (new) | pending |
| 09-01-02 | 01 | 1 | ENF-01 | type-check | `pnpm type-check` | N/A (new) | pending |
| 09-01-03 | 01 | 1 | ENF-01 | type-check | `pnpm type-check` | N/A (new) | pending |
| 09-02-01 | 02 | 2 | ENF-02, ENF-03 | type-check + build | `pnpm build` | N/A (modify) | pending |
| 09-02-02 | 02 | 2 | ENF-02, ENF-03 | type-check + build | `pnpm build` | N/A (modify) | pending |
| 09-02-03 | 02 | 2 | ENF-02 | type-check + build | `pnpm build` | N/A (modify) | pending |
| 09-02-04 | 02 | 2 | ENF-04, ENF-05 | type-check + build | `pnpm build` | N/A (modify) | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test framework or config needed. Phase 10 will add the behavioral test matrix; this phase focuses on structural enforcement that can be verified via type-check and build.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| No ACL bypass paths | ENF-03 | Requires codebase audit (grep) | `grep -r 'aclStore\.' packages/shell/src/` returns 0 results after migration |
| Denial prefix consistency | ENF-04 | Requires string pattern audit | `grep -r "denied:" packages/shell/src/` — all denial messages use `denied:` prefix |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
