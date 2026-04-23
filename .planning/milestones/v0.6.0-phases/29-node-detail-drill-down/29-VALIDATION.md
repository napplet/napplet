---
phase: 29
slug: node-detail-drill-down
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-01
---

# Phase 29 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + Playwright + targeted demo build + manual inspector walkthrough |
| **Config file** | `vitest.config.ts`, `playwright.config.ts` |
| **Quick run command** | `pnpm --filter @napplet/demo build` |
| **Full suite command** | `pnpm vitest run tests/unit/demo-node-details-model.test.ts tests/unit/demo-node-inspector-render.test.ts && pnpm playwright test tests/e2e/demo-node-inspector.spec.ts && pnpm --filter @napplet/demo build` |
| **Estimated runtime** | ~30-90 seconds depending on the new e2e inspector coverage |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @napplet/demo build`
- **After every plan wave:** Run that wave's targeted test command plus `pnpm --filter @napplet/demo build`
- **Before `$gsd-verify-work`:** all Phase 29 unit/e2e coverage and the demo build must be green, plus one manual walkthrough of shell, ACL, runtime, napplet, and service drill-down behavior
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 29-01-01 | 01 | 1 | NODE-01 | unit/model | `pnpm vitest run tests/unit/demo-node-details-model.test.ts` | no | pending |
| 29-01-02 | 01 | 1 | NODE-01 | build/render | `pnpm --filter @napplet/demo build` | n/a | pending |
| 29-01-03 | 01 | 1 | NODE-01 | unit/model | `pnpm vitest run tests/unit/demo-node-details-model.test.ts` | no | pending |
| 29-02-01 | 02 | 2 | NODE-02 | render/state | `pnpm vitest run tests/unit/demo-node-inspector-render.test.ts` | no | pending |
| 29-02-02 | 02 | 2 | NODE-01, NODE-02 | build | `pnpm --filter @napplet/demo build` | n/a | pending |
| 29-02-03 | 02 | 2 | NODE-02 | manual/layout | Manual demo walkthrough of right-side inspector and debugger coexistence | n/a | pending |
| 29-03-01 | 03 | 3 | NODE-01 | unit/activity | `pnpm vitest run tests/unit/demo-node-details-model.test.ts tests/unit/demo-node-inspector-render.test.ts` | mixed | pending |
| 29-03-02 | 03 | 3 | NODE-01, NODE-02 | build/render | `pnpm --filter @napplet/demo build` | n/a | pending |
| 29-03-03 | 03 | 3 | NODE-02 | e2e/interaction | `pnpm playwright test tests/e2e/demo-node-inspector.spec.ts` | no | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- Existing Vitest and Playwright infrastructure is sufficient for Phase 29.
- Add `tests/unit/demo-node-details-model.test.ts` to lock role coverage, summary generation, and recent-activity projection.
- Add `tests/unit/demo-node-inspector-render.test.ts` to lock inspector layout and debugger coexistence.
- Add `tests/e2e/demo-node-inspector.spec.ts` if no current e2e test exercises the right-side inspector behavior directly.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Compact summaries are informative without becoming cluttered | NODE-01 | Human judgment is required for information density and skim-ability | Open the demo and confirm each node shows a small number of role-relevant facts instead of a dense mini-dashboard |
| Right-side inspector preserves the debugger | NODE-02 | Visual/layout quality matters beyond DOM assertions | Open a node inspector and confirm the bottom debugger remains visible and usable |
| Inspector reads as a node-local view, not a debugger duplicate | NODE-01, NODE-02 | Clarity of observability boundaries is user-facing | Trigger protocol activity, inspect a node, and confirm the inspector shows local current state plus recent activity while the debugger remains the full global event stream |

---

## Validation Sign-Off

- [x] All tasks have automated verify or explicit manual verification
- [x] Sampling continuity: every wave includes a quick build check
- [x] Wave 0 additions are specific and repo-local
- [x] No watch-mode flags
- [x] Feedback latency < 90s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
