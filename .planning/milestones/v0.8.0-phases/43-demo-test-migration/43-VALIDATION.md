---
phase: 43
slug: demo-test-migration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-02
---

# Phase 43 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright (e2e) + Vitest (unit) + TypeScript compiler |
| **Config file** | `playwright.config.ts`, `vitest.config.ts`, `tsconfig.json` |
| **Quick run command** | `pnpm type-check` |
| **Full suite command** | `pnpm build && pnpm type-check && pnpm test:e2e` |
| **Estimated runtime** | ~60 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm type-check`
- **After every plan wave:** Run `pnpm build && pnpm type-check`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 43-01-01 | 01 | 1 | ECO-01 | type-check + grep | `pnpm type-check && grep -r "from '@napplet/shim'" apps/demo/` | ✅ | ⬜ pending |
| 43-01-02 | 01 | 1 | ECO-01 | type-check | `pnpm type-check` | ✅ | ⬜ pending |
| 43-02-01 | 02 | 1 | ECO-02 | type-check + grep | `pnpm type-check && grep -r "from '@napplet/shim'" tests/fixtures/` | ✅ | ⬜ pending |
| 43-02-02 | 02 | 1 | ECO-02 | type-check | `pnpm type-check` | ✅ | ⬜ pending |
| 43-03-01 | 03 | 2 | ECO-01, ECO-02 | build + e2e | `pnpm build && pnpm test:e2e` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. E2e test suite, type-check, and build pipeline are already in place from prior phases.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Demo UI visually unchanged | ECO-01 | Layout/visual regression not automated | Load demo in browser, verify chat and bot panels render and function identically to before migration |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
