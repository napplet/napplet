---
phase: 40
slug: remaining-rename-gaps
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-01
---

# Phase 40 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (type-check) + grep verification |
| **Config file** | `packages/*/tsconfig.json` |
| **Quick run command** | `pnpm type-check` |
| **Full suite command** | `pnpm type-check` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm type-check`
- **After every plan wave:** Run `pnpm type-check` + all grep verifications
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| SESS-03 | 01 | 1 | SESS-03 | grep | `grep -r 'loadOrCreateKeypair' packages/ \| grep -v node_modules \| grep -v dist` → 0 hits | N/A (grep) | ⬜ pending |
| TERM-01 | 01 | 1 | TERM-01 | grep + type-check | `grep 'nappType' packages/vite-plugin/src/index.ts` → 0 hits; `pnpm type-check` passes | N/A (grep) | ⬜ pending |
| TERM-04 | 01 | 1 | TERM-04 | grep | `grep -E 'napp:state-response\|napp:audio-muted\|napp-state:' SPEC.md` → 0 hits | N/A (grep) | ⬜ pending |
| WIRE-02 | 01 | 1 | WIRE-02 | grep | `grep -E 'INTER.PANE\|INTER_PANE' SPEC.md` → 0 hits (already passing) | N/A (grep) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*None — existing infrastructure covers all phase requirements. Verification is grep-based string absence checks plus TypeScript compilation. No new test files needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `napp-state:` fallback in `state-handler.ts:93` unchanged | TERM-04 | Must NOT change this migration fallback | Confirm `grep 'napp-state:' packages/runtime/src/state-handler.ts` still returns the fallback line |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
