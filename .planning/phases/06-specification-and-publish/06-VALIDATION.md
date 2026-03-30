---
phase: 6
slug: specification-and-publish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-30
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | publint + @arethetypeswrong/cli + grep-based spec verification |
| **Config file** | none — tools run on package tarballs |
| **Quick run command** | `pnpm build && npx publint ./packages/shim` |
| **Full suite command** | `pnpm build && for pkg in shim shell vite-plugin; do npx publint ./packages/$pkg; done` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm build && npx publint ./packages/shim`
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green + all README sections present
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | SPEC-01 | grep | `grep 'shell://' SPEC.md` | N/A | pending |
| 06-01-02 | 01 | 1 | SPEC-02 | grep | `grep -c '### .*Message' SPEC.md` | N/A | pending |
| 06-01-03 | 01 | 1 | SPEC-03 | grep | `grep 'blocked:' SPEC.md` | N/A | pending |
| 06-01-04 | 01 | 1 | SPEC-04 | grep | `grep 'aggregate hash' SPEC.md` | N/A | pending |
| 06-02-01 | 02 | 1 | PUB-01 | cli | `npx publint ./packages/shim` exits 0 | N/A | pending |
| 06-02-02 | 02 | 1 | PUB-02 | cli | `npx @arethetypeswrong/cli ./packages/shim` exits 0 | N/A | pending |
| 06-03-01 | 03 | 2 | PUB-04 | grep | `grep '## Getting Started' packages/shim/README.md` | N/A | pending |
| 06-03-02 | 03 | 2 | PUB-04 | grep | `grep '## API Reference' packages/shell/README.md` | N/A | pending |
| 06-04-01 | 04 | 3 | PUB-03 | cli | `npm view @napplet/shim@alpha version` | N/A | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `pnpm build` — all packages must build cleanly before validation
- [ ] `npx publint` — install as needed (npx handles)
- [ ] `npx @arethetypeswrong/cli` — install as needed (npx handles)

*Existing infrastructure covers framework needs. Only CLI validation tools needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| npm publish succeeds | PUB-03 | Requires npm auth token + network | Run `npm publish --tag alpha --dry-run` first, then real publish |
| Package installable in clean project | PUB-01 | End-to-end verification | `mkdir /tmp/test-napplet && cd /tmp/test-napplet && npm init -y && npm install @napplet/shim@alpha` |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
