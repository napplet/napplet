---
phase: 27
slug: demo-audit-correctness
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-01
---

# Phase 27 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + Playwright + targeted manual demo verification |
| **Config file** | `vitest.config.ts`, `playwright.config.ts` |
| **Quick run command** | `pnpm --filter @napplet/demo build` |
| **Full suite command** | `pnpm test && pnpm --filter @napplet/demo build` |
| **Estimated runtime** | ~30-90 seconds depending on Playwright coverage added |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @napplet/demo build`
- **After every plan wave:** Run the wave's targeted test command plus `pnpm --filter @napplet/demo build`
- **Before `$gsd-verify-work`:** `pnpm test && pnpm --filter @napplet/demo build` must be green, plus one manual walkthrough of the chat/bot ACL confusion scenarios
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 27-01-01 | 01 | 1 | DEMO-01 | build | `pnpm --filter @napplet/demo build` | n/a | pending |
| 27-01-02 | 01 | 1 | DEMO-01, DEMO-03 | unit/integration | `pnpm vitest run tests/unit/shell-runtime-integration.test.ts packages/runtime/src/dispatch.test.ts` | yes | pending |
| 27-01-03 | 01 | 1 | DEMO-01 | targeted integration | `pnpm vitest run tests/unit/demo-host-audit.test.ts` | no | pending |
| 27-02-01 | 02 | 2 | DEMO-02, DEMO-03 | build | `pnpm --filter @napplet/demo build` | n/a | pending |
| 27-02-02 | 02 | 2 | DEMO-02, DEMO-03 | e2e/demo integration | `pnpm playwright test tests/e2e/demo-audit-correctness.spec.ts` | no | pending |
| 27-02-03 | 02 | 2 | DEMO-02 | visual | Manual ACL-path walkthrough in demo UI | n/a | pending |
| 27-03-01 | 03 | 3 | DEMO-03 | unit/doc | `pnpm vitest run tests/unit/demo-host-audit.test.ts tests/unit/shell-runtime-integration.test.ts` | mixed | pending |
| 27-03-02 | 03 | 3 | DEMO-03 | doc/build | `test -f .planning/phases/27-demo-audit-correctness/27-AUDIT-NOTES.md && pnpm --filter @napplet/demo build` | no | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- Existing Vitest and Playwright infrastructure covers Phase 27.
- Add `tests/unit/demo-host-audit.test.ts` if no demo-host-focused integration test exists yet.
- Add `tests/e2e/demo-audit-correctness.spec.ts` if current e2e coverage does not exercise debugger/path-reporting behavior directly.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Chat revoke scenario is understandable | DEMO-02, DEMO-03 | Requires reading demo UI/debugger copy, not just protocol traffic | Revoke chat `relay:write`, send a message, confirm the UI shows bot inter-pane response separately from relay publish denial |
| ACL labels match real path semantics | DEMO-02 | Final wording/affordance quality is user-facing | Inspect ACL panel labels/tooltips and verify they describe relay/state/signer behavior precisely |
| Debugger can distinguish UI wording bug vs runtime denial | DEMO-03 | Human judgment on clarity still matters | Trigger one relay denial, one state denial, and one signer denial; verify each is labeled as a different path with the runtime reason preserved |

---

## Validation Sign-Off

- [x] All tasks have automated verify or explicit manual verification
- [x] Sampling continuity: every wave includes a quick build check
- [x] Wave 0 not required beyond adding targeted tests in-repo
- [x] No watch-mode flags
- [x] Feedback latency < 90s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
