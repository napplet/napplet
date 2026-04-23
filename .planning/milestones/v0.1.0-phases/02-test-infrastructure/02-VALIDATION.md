---
phase: 2
slug: test-infrastructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-30
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest ^4.1.2 (unit) + playwright ^1.58.2 (protocol) |
| **Config file** | `vitest.config.ts` (root) + `playwright.config.ts` (root) |
| **Quick run command** | `pnpm vitest run --filter=@napplet/shell` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~15-30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run --filter=@napplet/shell`
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | TEST-01 | config | `pnpm vitest run --passWithNoTests` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | TEST-02 | config | `pnpm vitest run --passWithNoTests` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | TEST-03 | unit | `pnpm vitest run tests/helpers/mock-hooks.test.ts` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 1 | TEST-04 | unit | `pnpm vitest run tests/helpers/message-tap.test.ts` | ❌ W0 | ⬜ pending |
| 02-04-01 | 04 | 2 | TEST-05 | build | `pnpm build --filter=auth-napplet` | ❌ W0 | ⬜ pending |
| 02-04-02 | 04 | 2 | TEST-05 | build | `pnpm build --filter=publish-napplet` | ❌ W0 | ⬜ pending |
| 02-05-01 | 05 | 2 | TEST-06 | e2e | `npx playwright test tests/e2e/harness.spec.ts` | ❌ W0 | ⬜ pending |
| 02-06-01 | 06 | 3 | TEST-01,TEST-06 | e2e | `pnpm test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — root vitest configuration
- [ ] `playwright.config.ts` — root playwright configuration
- [ ] `tests/helpers/mock-hooks.ts` — mock ShellHooks factory
- [ ] `tests/helpers/message-tap.ts` — postMessage interceptor utility

*These must exist before any task verification can run.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sandboxed iframe loads without CORS error | TEST-06 | Browser-specific sandbox behavior | Open harness in Chrome, verify iframe loads and AUTH completes in DevTools console |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
