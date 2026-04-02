---
phase: 42
slug: sdk-package
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-02
---

# Phase 42 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | TypeScript compiler (tsc) + pnpm build |
| **Config file** | `packages/sdk/tsconfig.json`, `packages/sdk/tsup.config.ts` |
| **Quick run command** | `cd packages/sdk && pnpm build` |
| **Full suite command** | `pnpm build && pnpm type-check` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd packages/sdk && pnpm build`
- **After every plan wave:** Run `pnpm build && pnpm type-check`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 42-01-01 | 01 | 1 | PKG-02 | build | `ls packages/sdk/package.json packages/sdk/tsup.config.ts packages/sdk/tsconfig.json` | ❌ W0 | ⬜ pending |
| 42-01-02 | 01 | 1 | PKG-03 | grep | `grep -L '@napplet/shim' packages/sdk/package.json` | ❌ W0 | ⬜ pending |
| 42-02-01 | 02 | 1 | SDK-01 | build | `cd packages/sdk && pnpm build` | ❌ W0 | ⬜ pending |
| 42-02-02 | 02 | 1 | SDK-02 | type-check | `pnpm type-check` | ❌ W0 | ⬜ pending |
| 42-02-03 | 02 | 1 | SDK-03 | build | `cd packages/sdk && pnpm build && ls dist/index.js dist/index.d.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing infrastructure covers all phase requirements. Package scaffolding and build are the validation mechanism (TypeScript compiler catches type errors, tsup verifies ESM output). No test framework installation needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Runtime guard throws actionable error | SDK-01 (D-01) | Requires browser/DOM context | Call `relay.subscribe()` without importing shim; verify error message contains "window.napplet not installed" |
| Star import shape matches window.napplet | SDK-03 | Structural shape comparison | `import * as napplet from '@napplet/sdk'` should have `relay`, `ipc`, `services`, `storage` properties |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
