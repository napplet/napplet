---
phase: 49
slug: constants-panel
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-03
---

# Phase 49 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual browser verification (demo UI phase) |
| **Config file** | none — demo UI testing is manual |
| **Quick run command** | `pnpm build && pnpm type-check` |
| **Full suite command** | `pnpm build && pnpm type-check` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm build && pnpm type-check`
- **After every plan wave:** Run `pnpm build && pnpm type-check`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 49-01-01 | 01 | 1 | TRANS-01 | build | `pnpm build && pnpm type-check` | N/A | ⬜ pending |
| 49-01-02 | 01 | 1 | TRANS-01 | build | `pnpm build && pnpm type-check` | N/A | ⬜ pending |
| 49-02-01 | 02 | 1 | TRANS-01, TRANS-02 | build | `pnpm build && pnpm type-check` | N/A | ⬜ pending |
| 49-03-01 | 03 | 2 | TRANS-02 | build | `pnpm build && pnpm type-check` | N/A | ⬜ pending |
| 49-04-01 | 04 | 2 | TRANS-01, TRANS-02 | build+manual | `pnpm build && pnpm type-check` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. No test framework changes needed — this is a demo UI phase validated by build checks and manual browser verification.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Constants panel displays all magic numbers | TRANS-01 | UI rendering in browser | Open demo, click Constants tab, verify all 25+ constants listed with values |
| Editing a constant takes immediate effect | TRANS-02 | Requires observing runtime behavior | Edit FLASH_DURATION, trigger a message, verify flash timing changed |
| Session persistence (panel close/reopen) | TRANS-02 | Browser session state | Edit a value, close panel, reopen, verify edited value persists |
| Page reload resets to defaults | TRANS-02 | Browser lifecycle | Edit a value, reload page, verify value reset |
| Search/filter works across grouping modes | TRANS-01 | Interactive UI | Type "timeout" in search, verify only timeout constants shown |
| Per-constant and global reset | TRANS-02 | Interactive UI | Edit values, click reset icon, verify defaults restored |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
