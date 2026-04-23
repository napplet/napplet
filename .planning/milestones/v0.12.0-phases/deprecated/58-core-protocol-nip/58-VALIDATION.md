---
phase: 58
slug: core-protocol-nip
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-05
---

# Phase 58 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual verification (spec writing phase, no code tests) |
| **Config file** | none |
| **Quick run command** | `wc -l specs/NIP-5D.md && grep -c 'MUST\|MAY\|SHOULD' specs/NIP-5D.md` |
| **Full suite command** | `wc -l specs/NIP-5D.md && grep -cE '^\#{2,3} ' specs/NIP-5D.md && grep -c 'MUST\|MAY\|SHOULD' specs/NIP-5D.md` |
| **Estimated runtime** | ~1 second |

---

## Sampling Rate

- **After every task commit:** Run `wc -l specs/NIP-5D.md`
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green + manual section review
- **Max feedback latency:** 1 second

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 58-01-01 | 01 | 1 | SPEC-01,SPEC-02,SPEC-03,SPEC-04,SPEC-05,SPEC-06,CAP-01-06 | file + grep | `test -f specs/NIP-5D.md && wc -l specs/NIP-5D.md` | N/A (creates file) | pending |

*Status: pending*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. This phase creates a specification document (markdown), not code. Validation is structural: file exists, line count under 500, required sections present, no banned implementation terms.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| NIP format conformance | SPEC-06 | Setext headings, draft badge, style require visual review | Compare NIP-5D header format against NIP-5A |
| Wire protocol completeness | SPEC-01, SPEC-02 | Semantic completeness cannot be grep-verified | Read AUTH and relay proxy sections against SPEC.md |
| No implementation details | SC-3 | Subtle leakage requires human judgment | Read entire NIP for internal terms: RuntimeAdapter, ShellAdapter, ring buffer, SessionRegistry |
| Security section adequacy | SPEC-05 | Threat model completeness is a judgment call | Verify postMessage `*`, sandbox, delegated keys, Window reference all addressed |

---

## Validation Sign-Off

- [x] All tasks have automated verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 1s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
