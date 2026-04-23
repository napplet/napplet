---
phase: 28
slug: architecture-topology-view
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-01
---

# Phase 28 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + targeted demo build + manual topology walkthrough |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm --filter @napplet/demo build` |
| **Full suite command** | `pnpm vitest run tests/unit/demo-topology-model.test.ts tests/unit/demo-topology-render.test.ts && pnpm --filter @napplet/demo build` |
| **Estimated runtime** | ~20-60 seconds depending on whether DOM-oriented tests are added |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @napplet/demo build`
- **After every plan wave:** Run the wave's targeted Vitest command plus `pnpm --filter @napplet/demo build`
- **Before `$gsd-verify-work`:** `pnpm --filter @napplet/demo build` and all new topology tests must be green, plus one manual architecture-readability walkthrough
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 28-01-01 | 01 | 1 | ARCH-01, ARCH-02 | unit/model | `pnpm vitest run tests/unit/demo-topology-model.test.ts` | no | pending |
| 28-01-02 | 01 | 1 | ARCH-01, ARCH-02 | build | `pnpm --filter @napplet/demo build` | n/a | pending |
| 28-01-03 | 01 | 1 | ARCH-02 | DOM/render | `pnpm vitest run tests/unit/demo-topology-render.test.ts` | no | pending |
| 28-02-01 | 02 | 2 | ARCH-01, ARCH-02 | unit/animation | `pnpm vitest run tests/unit/demo-topology-model.test.ts tests/unit/demo-topology-render.test.ts` | mixed | pending |
| 28-02-02 | 02 | 2 | ARCH-01 | build | `pnpm --filter @napplet/demo build` | n/a | pending |
| 28-02-03 | 02 | 2 | ARCH-02 | visual/manual | Manual demo walkthrough of topology hierarchy and service branching | n/a | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- Existing Vitest infrastructure is sufficient for Phase 28.
- Add `tests/unit/demo-topology-model.test.ts` to lock topology nodes, service enumeration, and parent-child relationships.
- Add `tests/unit/demo-topology-render.test.ts` or equivalent DOM-oriented coverage if no current test asserts the architecture view's rendered hierarchy.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Architecture is understandable at a glance | ARCH-02 | Human judgment is required for whether the hierarchy teaches the system accurately | Open the demo and confirm the eye path reads napplets -> shell -> ACL -> runtime -> services without needing the debugger |
| ACL reads like a checkpoint, not a container | ARCH-02 | Visual semantics matter beyond raw DOM structure | Inspect the topology and confirm ACL is presented as a distinct gate/layer, not merged into shell or runtime |
| Only real services appear | ARCH-01 | Depends on live host wiring, not only static markup | Confirm the service branch shows currently registered demo services only and does not include placeholder nodes |

---

## Validation Sign-Off

- [x] All tasks have automated verify or explicit manual verification
- [x] Sampling continuity: every wave includes a quick build check
- [x] Wave 0 additions are specific and repo-local
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

