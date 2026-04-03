---
phase: 50
slug: acl-detail-panel
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-03
---

# Phase 50 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual UI verification (demo app) + TypeScript type-check |
| **Config file** | `tsconfig.json` (root) |
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
| 50-01-01 | 01 | 1 | TRANS-03 | type-check | `pnpm type-check` | N/A | pending |
| 50-01-02 | 01 | 1 | TRANS-03 | type-check | `pnpm type-check` | N/A | pending |
| 50-02-01 | 02 | 1 | TRANS-03, TRANS-04 | build | `pnpm build` | N/A | pending |
| 50-02-02 | 02 | 1 | TRANS-04 | build+grep | `grep "DEMO_CAPABILITY_LABELS" apps/demo/src/acl-modal.ts` | N/A | pending |
| 50-03-01 | 03 | 2 | TRANS-03 | build+grep | `grep "renderRejectionHistory" apps/demo/src/node-details.ts` | N/A | pending |
| 50-03-02 | 03 | 2 | TRANS-04 | build+grep | `grep "renderAclSummary" apps/demo/src/node-details.ts` | N/A | pending |
| 50-04-01 | 04 | 2 | TRANS-03, TRANS-04 | build | `pnpm build && pnpm type-check` | N/A | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test framework needed — this is a demo UI phase validated by build + type-check + visual inspection.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Policy modal shows green/red/gray cells | TRANS-04 | Visual rendering | Open demo, click ACL node, click "Open Policy", verify grid cells match capability state |
| Rejection history shows event context | TRANS-03 | Visual rendering | Revoke a capability, trigger a message, verify rejection entry shows kind + capability + reason |
| Raw toggle expands full NIP-01 message | TRANS-03 | Interactive UI | Click expand toggle on a rejection entry, verify full message JSON is shown |
| Ring buffer drops oldest entries | TRANS-03 | Behavioral | Generate >50 ACL events, verify only last 50 are shown |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
