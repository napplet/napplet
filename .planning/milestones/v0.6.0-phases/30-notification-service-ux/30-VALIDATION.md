---
phase: 30
slug: notification-service-ux
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-01
---

# Phase 30 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest + Playwright |
| **Config file** | `packages/services/vitest.config.ts`, `playwright.config.ts` |
| **Quick run command** | `pnpm --filter @napplet/services test:unit -- notification-service && pnpm --filter @napplet/demo build && pnpm type-check` |
| **Full suite command** | `pnpm --filter @napplet/services test:unit && npx playwright test tests/e2e/demo-notification-service.spec.ts` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @napplet/services test:unit -- notification-service && pnpm --filter @napplet/demo build && pnpm type-check`
- **After every plan wave:** Run `pnpm --filter @napplet/services test:unit && npx playwright test tests/e2e/demo-notification-service.spec.ts`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 30-01-01 | 01 | 1 | NOTF-01 | grep | `grep -n "notifications: createNotificationService" apps/demo/src/shell-host.ts` | N/A | ⬜ pending |
| 30-01-02 | 01 | 1 | NOTF-01 | build | `pnpm --filter @napplet/demo build && pnpm type-check` | N/A | ⬜ pending |
| 30-02-01 | 02 | 2 | NOTF-01 | grep | `grep -n "notification" apps/demo/index.html` | N/A | ⬜ pending |
| 30-02-02 | 02 | 2 | NOTF-03 | grep | `grep -n "mark read\\|dismiss\\|list" apps/demo/src/main.ts apps/demo/src/notification-demo.ts` | N/A | ⬜ pending |
| 30-02-03 | 02 | 2 | NOTF-02 | e2e | `npx playwright test tests/e2e/demo-notification-service.spec.ts --grep "node controls"` | ❌ W0 | ⬜ pending |
| 30-03-01 | 03 | 3 | NOTF-02 | unit | `pnpm --filter @napplet/services test:unit -- notification-service` | ❌ W0 | ⬜ pending |
| 30-03-02 | 03 | 3 | NOTF-02 | e2e | `npx playwright test tests/e2e/demo-notification-service.spec.ts --grep "napplet-driven"` | ❌ W0 | ⬜ pending |
| 30-03-03 | 03 | 3 | NOTF-03 | e2e | `npx playwright test tests/e2e/demo-notification-service.spec.ts --grep "inspector lifecycle"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/services/src/notification-service.test.ts` — add lifecycle tests for create/read/dismiss/list and `maxPerWindow`
- [ ] `tests/e2e/demo-notification-service.spec.ts` — add demo notification UX coverage for node, toasts, and inspector controls

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Toast copy teaches the notification-service path without feeling debugger-only | NOTF-02 | Copy clarity and “educational but usable” tone are subjective | Run the demo, trigger one node-driven toast and one napplet-driven toast, and confirm the labels clearly connect the toast to the notification service/path |
| Compact node summary stays skim-friendly while the inspector owns detail density | NOTF-03 | Visual density and scanability still need human review | Open the demo, verify the notification node shows counts/summary only, then inspect the right-side panel for the full list and item actions |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
