---
phase: 52
slug: service-capability-toggles
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-03
---

# Phase 52 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pnpm build + pnpm type-check (no runtime test suite for demo UI) |
| **Config file** | tsconfig.json (root), apps/demo/tsconfig.json |
| **Quick run command** | `pnpm build && pnpm type-check` |
| **Full suite command** | `pnpm build && pnpm type-check` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm build && pnpm type-check`
- **After every plan wave:** Run `pnpm build && pnpm type-check`
- **Before `/gsd:verify-work`:** Full build must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 52-01-01 | 01 | 1 | TOGL-01 | build+grep | `pnpm build && grep "serviceHandlerStore" apps/demo/src/shell-host.ts` | N/A (modify) | pending |
| 52-01-02 | 01 | 1 | TOGL-01 | build+grep | `pnpm build && grep "toggleService" apps/demo/src/shell-host.ts` | N/A (modify) | pending |
| 52-02-01 | 02 | 1 | TOGL-02 | build+grep | `pnpm build && grep "addEventListener.*click" apps/demo/src/acl-modal.ts` | N/A (modify) | pending |
| 52-02-02 | 02 | 1 | TOGL-01, TOGL-02 | build+grep | `pnpm build && grep "Services" apps/demo/src/acl-modal.ts` | N/A (modify) | pending |
| 52-03-01 | 03 | 2 | TOGL-01 | build+grep | `pnpm build && grep "service-toggle-icon" apps/demo/src/topology.ts` | N/A (modify) | pending |
| 52-03-02 | 03 | 2 | TOGL-01 | build+grep | `pnpm build && grep "service-disabled" apps/demo/src/topology.ts` | N/A (modify) | pending |
| 52-04-01 | 04 | 2 | TOGL-03 | build+type | `pnpm build && pnpm type-check` | N/A | pending |

*Status: pending*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. This is a demo UI extension phase — no new test framework or fixtures needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Service toggle dims topology node | TOGL-01 | Visual rendering | Toggle signer service off; verify node appears dimmed |
| Capability toggle cycles state in modal | TOGL-02 | Click interaction | Open modal; click capability cell; verify visual state changes |
| Disabled service rejects messages | TOGL-03 | Runtime message flow | Disable signer; send sign:event from napplet; verify rejection in ACL history |

---

## Validation Sign-Off

- [x] All tasks have automated verify (build + grep)
- [x] Sampling continuity: build run after every task
- [x] Wave 0 covers all MISSING references (none missing)
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
