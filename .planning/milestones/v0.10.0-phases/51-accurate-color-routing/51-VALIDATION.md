---
phase: 51
slug: accurate-color-routing
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-03
---

# Phase 51 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual browser verification (demo UI phase) |
| **Config file** | none — demo UI with no automated test framework |
| **Quick run command** | `pnpm build && pnpm type-check` |
| **Full suite command** | `pnpm build && pnpm type-check` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm build && pnpm type-check`
- **After every plan wave:** Run `pnpm build && pnpm type-check`
- **Before `/gsd:verify-work`:** Full build must pass + manual browser verification
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 51-01-01 | 01 | 1 | COLOR-01 | build | `pnpm build && pnpm type-check` | N/A | pending |
| 51-01-02 | 01 | 1 | COLOR-01 | build | `pnpm build && pnpm type-check` | N/A | pending |
| 51-02-01 | 02 | 1 | COLOR-01 | build | `pnpm build && pnpm type-check` | N/A | pending |
| 51-02-02 | 02 | 1 | COLOR-01, COLOR-02 | build | `pnpm build && pnpm type-check` | N/A | pending |
| 51-03-01 | 03 | 2 | COLOR-01, COLOR-02 | build+manual | `pnpm build && pnpm type-check` | N/A | pending |
| 51-04-01 | 04 | 2 | COLOR-01, COLOR-02 | build+manual | `pnpm build && pnpm type-check` | N/A | pending |

*Status: pending*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. This is a demo UI phase — TypeScript build + type-check catches structural errors. Visual correctness requires manual browser verification.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Edge directional coloring | COLOR-01 | Visual LeaderLine color changes are runtime SVG mutations | Send messages from chat napplet, verify -out and -in lines have different colors when ACL denial occurs |
| Node composite border | COLOR-02 | CSS split-border visual effect | After mixed pass/fail messages, verify node shows green on one half and red/amber on the other |
| Persistence modes | COLOR-01 | State accumulation behavior is visual | Toggle between rolling window/decay/last-message, verify color behavior differs |
| Decay fade | COLOR-01 | Time-based visual transition | Set decay mode, send a message, wait for decay duration, verify color returns to resting |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
