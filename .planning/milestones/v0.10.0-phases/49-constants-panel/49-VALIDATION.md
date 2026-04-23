---
phase: 49
slug: constants-panel
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-03
validated: 2026-04-03
---

# Phase 49 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (unit) + manual browser verification |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm vitest run tests/unit/demo-config-model.test.ts tests/unit/demo-config-overrides.test.ts` |
| **Full suite command** | `pnpm vitest run` |
| **Estimated runtime** | ~5 seconds |

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
| 49-01-01 | 01 | 1 | TRANS-01 | unit | `pnpm vitest run tests/unit/demo-config-model.test.ts` | tests/unit/demo-config-model.test.ts | ✅ green |
| 49-01-02 | 01 | 1 | TRANS-01 | unit | `pnpm vitest run tests/unit/demo-config-model.test.ts` | tests/unit/demo-config-model.test.ts | ✅ green |
| 49-02-01 | 02 | 1 | TRANS-01, TRANS-02 | unit | `pnpm vitest run tests/unit/demo-config-model.test.ts` | tests/unit/demo-config-model.test.ts | ✅ green |
| 49-03-01 | 03 | 2 | TRANS-02 | unit | `pnpm vitest run tests/unit/demo-config-overrides.test.ts` | tests/unit/demo-config-overrides.test.ts | ✅ green |
| 49-04-01 | 04 | 2 | TRANS-01, TRANS-02 | unit | `pnpm vitest run tests/unit/demo-config-overrides.test.ts` | tests/unit/demo-config-overrides.test.ts | ✅ green |

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

## Validation Audit 2026-04-03

| Metric | Count |
|--------|-------|
| Gaps found | 4 |
| Resolved | 4 |
| Escalated | 0 |

### Tests Generated

| File | Tests | Status |
|------|-------|--------|
| `tests/unit/demo-config-model.test.ts` | DemoConfig data model, getAllDefs, getByPackage, getByDomain, renderConstantsPanel HTML | ✅ green |
| `tests/unit/demo-config-overrides.test.ts` | DemoConfig set/reset/subscribe, clamping, RuntimeConfigOverrides, lazy getters | ✅ green |

**Total: 69 tests, 0 failures**

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** complete (2026-04-03)
