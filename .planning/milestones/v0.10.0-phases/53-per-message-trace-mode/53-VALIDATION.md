---
phase: 53
slug: per-message-trace-mode
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-03
---

# Phase 53 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual browser verification (demo app) |
| **Config file** | none — UI-only phase with visual animation |
| **Quick run command** | `pnpm type-check` |
| **Full suite command** | `pnpm build && pnpm type-check` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm type-check`
- **After every plan wave:** Run `pnpm build && pnpm type-check`
- **Before `/gsd:verify-work`:** Full build must pass + manual browser check
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 53-01-01 | 01 | 1 | COLOR-03 | type-check | `pnpm type-check` | N/A | pending |
| 53-01-02 | 01 | 1 | COLOR-03 | type-check | `pnpm type-check` | N/A | pending |
| 53-02-01 | 02 | 1 | COLOR-03 | type-check | `pnpm type-check` | N/A | pending |
| 53-03-01 | 03 | 2 | COLOR-03 | type-check + build | `pnpm build && pnpm type-check` | N/A | pending |
| 53-03-02 | 03 | 2 | COLOR-03 | type-check + build | `pnpm build && pnpm type-check` | N/A | pending |
| 53-04-01 | 04 | 2 | COLOR-03 | manual | Browser visual check | N/A | pending |

*Status: pending*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. This is a demo UI phase — TypeScript compilation and build success are the automated gates. Visual behavior is verified manually.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Hop-by-hop edge sweep animation | COLOR-03 | Visual animation timing cannot be automated without Playwright | 1. Open demo, 2. Click "trace" in color mode toggle, 3. Send a chat message, 4. Verify edges light up sequentially along the path |
| Overlapping animations | COLOR-03 | Visual overlap behavior requires human judgment | 1. Enable trace mode, 2. Send multiple messages rapidly, 3. Verify multiple sweeps are visible simultaneously |
| Failure point color split | COLOR-03 | Visual directional color requires human verification | 1. Enable trace mode, 2. Revoke a capability to trigger denial, 3. Verify green before failure, red/amber at/after |
| Mode switch cleanup | COLOR-03 | State transition behavior | 1. Enable trace mode, 2. Send message mid-animation, 3. Switch to "rolling", 4. Verify no lingering trace colors |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
