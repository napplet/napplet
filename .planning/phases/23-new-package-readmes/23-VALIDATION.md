---
phase: 23
slug: new-package-readmes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-31
---

# Phase 23 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — documentation phase, no automated test framework |
| **Config file** | none |
| **Quick run command** | `grep -c '## API Reference' packages/acl/README.md packages/core/README.md packages/runtime/README.md packages/services/README.md` |
| **Full suite command** | `ls packages/acl/README.md packages/core/README.md packages/runtime/README.md packages/services/README.md` |
| **Estimated runtime** | ~1 second |

---

## Sampling Rate

- **After every task commit:** Run `grep -c '## API Reference' packages/{acl,core,runtime,services}/README.md`
- **After every plan wave:** Run `ls packages/{acl,core,runtime,services}/README.md`
- **Before `/gsd:verify-work`:** All 4 README files exist and contain required sections
- **Max feedback latency:** 2 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 23-01-01 | 01 | 1 | README-05 | file | `test -f packages/acl/README.md` | ❌ W0 | ⬜ pending |
| 23-02-01 | 02 | 1 | README-06 | file | `test -f packages/core/README.md` | ❌ W0 | ⬜ pending |
| 23-03-01 | 03 | 1 | README-07 | file | `test -f packages/runtime/README.md` | ❌ W0 | ⬜ pending |
| 23-04-01 | 04 | 1 | README-08 | file | `test -f packages/services/README.md` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

None — no test infrastructure to install. This is a documentation-only phase. All verification is file-existence checks and content grep.

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| README prose is clear and accurate | README-05 through README-08 | Content quality is subjective | Read each README end-to-end and verify accuracy of code examples against source |
| Cross-references between packages are correct | README-05 through README-08 | Link accuracy not grep-checkable | Follow each cross-reference link/mention and verify target exists |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 2s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
