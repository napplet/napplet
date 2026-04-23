---
phase: 11
slug: shell-code-cleanup
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-31
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (via Playwright e2e) |
| **Config file** | `tests/e2e/vite.config.ts` |
| **Quick run command** | `pnpm build && pnpm type-check` |
| **Full suite command** | `pnpm build && pnpm type-check` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm build && pnpm type-check`
- **After every plan wave:** Run `pnpm build && pnpm type-check`
- **Before `/gsd:verify-work`:** Full build + type-check must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | CLN-01 | grep | `grep -rn 'function\|method' packages/shell/src/shell-bridge.ts` | N/A | ⬜ pending |
| 11-01-02 | 01 | 1 | CLN-03 | grep | `grep -c '^export' packages/shell/src/index.ts` | N/A | ⬜ pending |
| 11-02-01 | 02 | 1 | CLN-02 | grep | `grep -c '@param\|@returns\|@example' packages/shell/src/*.ts` | N/A | ⬜ pending |
| 11-02-02 | 02 | 1 | CLN-04 | grep | `grep -rn 'console\.' packages/shell/src/` | N/A | ⬜ pending |
| 11-02-03 | 02 | 1 | CLN-05 | grep | `grep -n 'catch {' packages/shell/src/*.ts` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. This phase is code cleanup — no new test infrastructure needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Public API surface matches documentation | CLN-03 | Requires human judgment on what "minimal" means | Compare index.ts exports against intended public API list |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
