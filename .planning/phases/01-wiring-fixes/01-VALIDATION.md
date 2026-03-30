---
phase: 1
slug: wiring-fixes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-30
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pnpm build + pnpm type-check (compilation verification) + Playwright (e2e smoke) |
| **Config file** | turbo.json (existing), playwright config created in Wave 3 |
| **Quick run command** | `pnpm build && pnpm type-check` |
| **Full suite command** | `pnpm build && pnpm type-check && npx playwright test tests/e2e/` |
| **Estimated runtime** | ~15 seconds (build+typecheck), ~30 seconds (with Playwright) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm build && pnpm type-check`
- **After every plan wave:** Run `pnpm build && pnpm type-check`
- **Before `/gsd:verify-work`:** Full suite including Playwright smoke test must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | FIX-02 | build | `pnpm build && pnpm type-check` | existing | pending |
| 01-02-01 | 02 | 1 | FIX-03 | build | `pnpm build && pnpm type-check` | existing | pending |
| 01-03-01 | 03 | 1 | FIX-04 | build+grep | `pnpm build && grep -r 'hyprgate' packages/*/src/ --include='*.ts'` | existing | pending |
| 01-04-01 | 04 | 2 | FIX-01 | build | `pnpm build && pnpm type-check` | existing | pending |
| 01-05-01 | 05 | 3 | FIX-05 | e2e | `npx playwright test tests/e2e/` | created in plan | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- Existing `pnpm build` and `pnpm type-check` cover compilation verification for all code changes
- No test framework install needed for Waves 1-2 (compilation is sufficient verification)
- Wave 3 (FIX-05) creates the Playwright smoke test as part of its deliverable

*Existing infrastructure covers Waves 1-2. Wave 3 is self-bootstrapping.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| hyprgate sweep completeness | FIX-04 | Docs and non-TS files need manual review | Run `grep -ri 'hyprgate' packages/ --include='*.ts' --include='*.md'` and verify only documentation references remain |
| AUTH rejection NOTICE message | FIX-01 | NOTICE content is informational | Read handleAuth() and verify each rejection path sends NOTICE with queue drop count |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
