---
phase: 60
slug: channel-protocol-implementation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-05
---

# Phase 60 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `packages/runtime/vitest.config.ts` (per-package) and `vitest.config.ts` (root) |
| **Quick run command** | `pnpm vitest run packages/runtime/src/pipe-handler.test.ts` |
| **Full suite command** | `pnpm test:unit` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run packages/runtime/src/pipe-handler.test.ts`
- **After every plan wave:** Run `pnpm test:unit && pnpm type-check`
- **Before `/gsd:verify-work`:** Full suite must be green + `pnpm build`
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 60-01-01 | 01 | 1 | CHAN-03 | type-check | `pnpm type-check` | N/A | pending |
| 60-01-02 | 01 | 1 | CHAN-03 | type-check | `pnpm type-check` | N/A | pending |
| 60-02-01 | 02 | 1 | CHAN-03 | unit | `pnpm vitest run packages/runtime/src/pipe-handler.test.ts` | W0 | pending |
| 60-02-02 | 02 | 1 | CHAN-03 | type-check | `pnpm type-check` | N/A | pending |
| 60-03-01 | 03 | 2 | CHAN-03 | build | `pnpm build` | N/A | pending |
| 60-03-02 | 03 | 2 | CHAN-03 | type-check | `pnpm type-check` | N/A | pending |
| 60-04-01 | 04 | 2 | CHAN-04 | unit | `pnpm vitest run packages/runtime/src/pipe-handler.test.ts` | W0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `packages/runtime/src/pipe-handler.test.ts` — test stubs for pipe lifecycle, broadcast, error cases
- [ ] Existing `test-utils.ts` mock adapter covers pipe needs (no new fixtures needed)

*Existing vitest infrastructure covers all phase requirements. No framework install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| window.napplet.pipes namespace exists | CHAN-03 | Requires browser environment | Import @napplet/shim in a test HTML page, check `typeof window.napplet.pipes` |

*One manual verification — full e2e with multiple iframes deferred per CONTEXT D-03.*

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
