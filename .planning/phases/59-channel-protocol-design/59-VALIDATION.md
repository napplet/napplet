---
phase: 59
slug: channel-protocol-design
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-05
---

# Phase 59 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual review + grep validation (spec-writing phase, no code) |
| **Config file** | none — documentation phase |
| **Quick run command** | `grep -c "PIPE_" .planning/phases/59-channel-protocol-design/59-01-PLAN.md` |
| **Full suite command** | `bash -c 'for f in .planning/phases/59-channel-protocol-design/59-*-PLAN.md; do echo "=== $f ==="; grep -c "PIPE_\|window.napplet.pipes\|PIPE_BROADCAST\|PIPE_OPEN\|PIPE_ACK\|PIPE_CLOSE" "$f"; done'` |
| **Estimated runtime** | ~1 second |

---

## Sampling Rate

- **After every task commit:** Verify grep patterns present in output files
- **After every plan wave:** Check all acceptance criteria via file content inspection
- **Before `/gsd:verify-work`:** All NIP section content reviewed for completeness
- **Max feedback latency:** 2 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 59-01-01 | 01 | 1 | CHAN-01 | content | `grep "PIPE_OPEN" <output>` | ❌ W0 | ⬜ pending |
| 59-01-02 | 01 | 1 | CHAN-01 | content | `grep "PIPE_ACK" <output>` | ❌ W0 | ⬜ pending |
| 59-01-03 | 01 | 1 | CHAN-02 | content | `grep "PIPE_BROADCAST" <output>` | ❌ W0 | ⬜ pending |
| 59-01-04 | 01 | 1 | CHAN-05 | content | `grep "window.napplet.pipes" <output>` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. This is a documentation/spec-writing phase — output files are the deliverables themselves.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Wire format examples are valid JSON | CHAN-01 | JSON validity in markdown code blocks | Parse each JSON example from the NIP section |
| Sequence diagram is ASCII art, not Mermaid | CHAN-01 | Format compliance | Visual inspection of the pipe lifecycle diagram |
| NIP section under 200 words | CHAN-05 | Word count target | `wc -w` on the pipes section extracted from NIP draft |
| "Pipes" used consistently, never "channels" | CHAN-01 | Naming consistency | `grep -i "channel" <output>` should only match NIP-28 reference context |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 2s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
