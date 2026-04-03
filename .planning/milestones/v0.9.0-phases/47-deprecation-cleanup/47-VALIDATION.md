---
phase: 47
slug: deprecation-cleanup
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-02
---

# Phase 47 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (existing) |
| **Config file** | `packages/runtime/vitest.config.ts` |
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
| 47-01-01 | 01 | 1 | DEP-03 | build | `pnpm type-check` | N/A | pending |
| 47-01-02 | 01 | 1 | DEP-04 | build | `pnpm type-check` | N/A | pending |
| 47-01-03 | 01 | 1 | DEP-03 | grep | `grep -r "RuntimeHooks" packages/ --include="*.ts" \| wc -l` returns 0 | N/A | pending |
| 47-01-04 | 01 | 1 | DEP-04 | grep | `grep -r "ShellHooks" packages/ --include="*.ts" \| wc -l` returns 0 | N/A | pending |

*Status: pending*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test files needed — this phase is pure deletion.

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [x] All tasks have automated verify
- [x] Sampling continuity: all tasks have automated verify
- [x] Wave 0 covers all MISSING references (N/A — no new tests needed)
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
