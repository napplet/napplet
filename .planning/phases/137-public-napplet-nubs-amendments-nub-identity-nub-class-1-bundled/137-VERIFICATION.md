---
phase: 137-public-napplet-nubs-amendments-nub-identity-nub-class-1-bundled
verified: 2026-04-23T17:10:00Z
status: passed
score: 7/7 must-haves verified
re_verification: false
gaps: []
human_verification:
  - test: "Push branch and open draft PR on napplet/nubs"
    expected: "PR created with nub-identity-decrypt as head, master as base, PR body from /tmp/napplet-137-pr-body-preview.md, --draft flag"
    why_human: "Shared-state write to a public repo; automation is explicitly excluded per feedback_no_private_refs_commits + NUB-IDENTITY-07 + CLASS1-03. Ship gate per ROADMAP SC7 is 'diff authored and hygiene-clean on branch' — this is satisfied. PR-open is a post-phase human action."
---

# Phase 137: Public napplet/nubs Amendments — NUB-IDENTITY + NUB-CLASS-1 Bundled — Verification Report

**Phase Goal:** A single draft PR on public `napplet/nubs` amends `NUB-IDENTITY.md` with the `identity.decrypt` envelope triad + Security Considerations, AND amends `NUB-CLASS-1.md` with the `report-to` SHOULD row and violation-correlation MUST. The PR is opened by the human; this milestone authors the diff. Public-repo hygiene verified clean. Filename citations (`NUB-CLASS-1.md`) replace abstract phrases (`Class 1`) as primary references.

**Verified:** 2026-04-23T17:10:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | NUB-IDENTITY amendment contains envelope triad + 8-code error vocabulary + auto-detect + 4 shell MUSTs (class-gating cites NUB-CLASS-1.md, outer-sig-verify, impersonation-check, outer-created_at-hiding) | VERIFIED | `identity.decrypt`: 19 hits; `.result`: 2 hits; `.error`: 5 hits; all 8 error codes present; `seal.pubkey`: 3; `NUB-CLASS-1.md`: 7; `created_at`: 7; auto-detect SHOULD on line 297 |
| 2 | Filename citation discipline: `NUB-CLASS-1.md` as primary reference; free-standing "Class 1" absent | VERIFIED | `NUB-CLASS-1.md` count=7 in NUB-IDENTITY.md; regex `(^|[^-a-zA-Z_0-9.])Class 1([^-a-zA-Z_0-9.]|$)` count=0 |
| 3 | Security Considerations subsection names 3 concerns (gift-wrap impersonation MUSTs; NIP-07 all_frames injection + nonce-based script-src; world:'MAIN' residual + connect-src 'none' structural mitigation) | VERIFIED | Lines 312, 314, 316 in NUB-IDENTITY.md: NIP-17, all_frames, script-src, world:, chrome.scripting.executeScript, connect-src all present |
| 4 | NUB-CLASS-1 amendment bundled in same branch (SHOULD report-to + MUST violation-correlation) | VERIFIED | commit c020479 on nub-identity-decrypt; NUB-CLASS-1.md 60→68 lines; `report-to`:3, `Report-To`:1, `(dTag, aggregateHash)`:2, `script-src-elem`:1 |
| 5 | Cross-repo public-hygiene grep clean: 0/0/0 for @napplet/* / kehto / hyprgate (VER-02) | VERIFIED | Branch diff: 0 matches; commit log: 0 matches; PR body preview: 0 matches; VER02_EXIT=0, TOTAL_FORBIDDEN_MATCHES=0 in /tmp/napplet-137-hygiene-grep.log |
| 6 | Shim-side defense-in-depth documented as OBSERVABILITY not trust boundary (GATE-04) | VERIFIED | NUB-IDENTITY.md line 318: "Shim-side observability, not a trust boundary" subsection present with explicit "NOT a trust boundary" language |
| 7 | PR branched from nub-identity as nub-identity-decrypt; diff authored + hygiene-clean on branch (ship gate per SC7) | VERIFIED | Branch `nub-identity-decrypt` at HEAD `45cdf39`; 3 amendment commits (031c7fa bundle, c020479 NUB-CLASS-1, 45cdf39 NUB-IDENTITY); NO_REMOTE_CONFIGURED; no PR opened (human-gated) |

**Score:** 7/7 truths verified

---

### Required Artifacts

| Artifact | Description | Status | Details |
|----------|-------------|--------|---------|
| `~/Develop/nubs/NUB-IDENTITY.md` (322 lines) | Identity NUB with identity.decrypt amendment | VERIFIED | 212→322 lines; 112 insertions, 2 documented replacements; all required literals present |
| `~/Develop/nubs/NUB-CLASS-1.md` (68 lines) | Class-1 NUB with report-to/violation-correlation amendment | VERIFIED | 60→68 lines; 8 insertions, 0 deletions; all required literals present |
| `/tmp/napplet-137-hygiene-grep.log` | VER-02 evidence file | VERIFIED | Exists; VER02_EXIT=0; VER02_RESULT=PASS; TOTAL_FORBIDDEN_MATCHES=0 |
| `/tmp/napplet-137-conformance-grep.log` | VER-03 evidence file | VERIFIED | Exists; VER03_EXIT=0; VER03_RESULT=PASS; TOTAL_FAIL_COUNT=0; 0 FAIL lines |
| `/tmp/napplet-137-pr-body-preview.md` | PR body draft for human reuse | VERIFIED | Exists; hygiene-clean (0 forbidden token matches) |
| `.planning/phases/137-.../137-NUB-CLASS-1-AMENDMENT.md` | Audit copy, 45 lines | VERIFIED | 45 lines; hygiene-clean; committed in 39af8b1 |
| `.planning/phases/137-.../137-NUB-IDENTITY-AMENDMENT.md` | Audit copy, 82 lines | VERIFIED | 82 lines; hygiene-clean; committed in 39af8b1 |
| `.planning/phases/137-.../137-PHASE-NOTES.md` | Phase 138 handoff, 131 lines | VERIFIED | 131 lines; hygiene-clean; Phase 138 handoff content present; VER-02/VER-03 citations present |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| NUB-IDENTITY.md Shell Behavior | NUB-CLASS-1.md | Filename citation `NUB-CLASS-1.md` | WIRED | 7 citations in NUB-IDENTITY.md; class-gating MUST on line 293 explicitly cites by filename |
| NUB-CLASS-1.md MUST row | `(dTag, aggregateHash)` correlation | violation-report processing prose | WIRED | Both terms present; correlation mechanism described in Shell Responsibilities bullet 7 |
| Security Considerations (b) | Phase 136 empirical substrate | Chromium-specific literals | WIRED | `script-src-elem`, `violatedDirective`, `all_frames`, `world:`, `chrome.scripting.executeScript` all present |
| Branch diff | PR body preview | VER-02 3-channel hygiene | WIRED | All 3 channels: diff + commit log + PR body preview all pass at 0 forbidden matches |

---

### Data-Flow Trace (Level 4)

Not applicable — this phase produces spec documents (Markdown), not runnable code. There are no state variables, data fetches, or render pipelines to trace.

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Branch exists with 3 amendment commits | `git -C ~/Develop/nubs log --oneline master..nub-identity-decrypt` | 8 commits; 031c7fa, c020479, 45cdf39 present | PASS |
| NUB-IDENTITY.md is 322 lines | `wc -l ~/Develop/nubs/NUB-IDENTITY.md` | 322 | PASS |
| NUB-CLASS-1.md is 68 lines | `wc -l ~/Develop/nubs/NUB-CLASS-1.md` | 68 | PASS |
| All 8 error codes present | `grep -cF "<code>" NUB-IDENTITY.md` for each | All 8 present (counts 2–7) | PASS |
| Hygiene zero across diff+log | `git diff master..nub-identity-decrypt | grep -iE "@napplet/..."` | 0 | PASS |
| Free-standing "Class 1" absent | `grep -cE "Class 1" NUB-IDENTITY.md` (word-boundary pattern) | 0 | PASS |
| VER-02 log stamped PASS | `grep VER02_EXIT /tmp/napplet-137-hygiene-grep.log` | VER02_EXIT=0 | PASS |
| VER-03 log stamped PASS | `grep VER03_EXIT /tmp/napplet-137-conformance-grep.log` | VER03_EXIT=0; TOTAL_FAIL_COUNT=0 | PASS |
| No FAIL lines in VER-03 log | `grep "^FAIL" /tmp/napplet-137-conformance-grep.log` | 0 lines | PASS |
| Branch has no remote tracking | `git config --get branch.nub-identity-decrypt.remote` | NO_REMOTE_CONFIGURED | PASS |
| No napplet packages/ changes | `git show --stat 39af8b1 ... \| grep packages/` | 0 files | PASS |
| No specs/ changes | `git show --stat 39af8b1 ... \| grep specs/` | 0 files | PASS |
| Evidence files in /tmp not home | `ls /tmp/napplet-137-*` | 3 files in /tmp | PASS |

---

### Requirements Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| DEC-01 (identity.decrypt request envelope) | SATISFIED | Wire Protocol table row present; TypeScript interface has `decrypt(event)` |
| DEC-02 (identity.decrypt.result envelope with rumor+sender) | SATISFIED | `.result` envelope in Wire Protocol; `{ rumor: Rumor; sender: string }` return type |
| DEC-03 (identity.decrypt.error envelope) | SATISFIED | `.error` envelope in Wire Protocol; `IdentityDecryptError` typed error envelope |
| DEC-04 (8-code IdentityDecryptErrorCode vocabulary) | SATISFIED | All 8 codes present: class-forbidden, signer-denied, signer-unavailable, decrypt-failed, malformed-wrap, impersonation, unsupported-encryption, policy-denied |
| DEC-05 (message? optional field discipline) | SATISFIED | message? field documented in Error Codes subsection |
| DEC-06 (outer-created_at hiding MUST) | SATISFIED | Shell Behavior bullet + Note on `created_at` (lines 127, 296) |
| DEC-07 (impersonation-check MUST: seal.pubkey === rumor.pubkey) | SATISFIED | Shell Behavior bullet (line 295); Security Considerations (a) |
| DEC-08 (outer-sig-verify MUST: malformed-wrap on fail) | SATISFIED | Shell Behavior bullets; `malformed-wrap` error code table entry |
| GATE-01 (class-gating MUST: NUB-CLASS-1.md cited) | SATISFIED | Shell Behavior bullet (line 293); NUB-CLASS-1.md cited by filename 7 times |
| GATE-02 (class-gating enforcement semantics) | SATISFIED | Shell Behavior class-forbidden MUST; error code table |
| GATE-03 (class-gating wire-timing: MUST NOT re-derive per envelope) | SATISFIED | Shell Behavior bullet (line 293): "MUST NOT re-derive class per envelope" |
| GATE-04 (shim-side defense-in-depth as OBSERVABILITY not trust) | SATISFIED | Line 318: "Shim-side observability, not a trust boundary" subsection |
| NUB-IDENTITY-01 (envelope triad present) | SATISFIED | identity.decrypt + .result + .error all present |
| NUB-IDENTITY-02 (auto-detect SHOULD) | SATISFIED | Line 297: "shell SHOULD auto-detect the encryption mode from the event shape" |
| NUB-IDENTITY-03 (shape-selection field SHOULD reject with unsupported-encryption) | SATISFIED | Line 297: "shell SHOULD reject it with `unsupported-encryption`" |
| NUB-IDENTITY-04 (filename citation discipline: NUB-CLASS-1.md as primary) | SATISFIED | count=7 in NUB-IDENTITY.md; free-standing "Class 1" count=0 |
| NUB-IDENTITY-05 (3-concern Security Considerations subsection) | SATISFIED | Lines 312, 314, 316: 3 named concerns present |
| NUB-IDENTITY-06 (VER-02: hygiene grep clean) | SATISFIED | VER02_EXIT=0; TOTAL_FORBIDDEN_MATCHES=0 across 3 channels |
| NUB-IDENTITY-07 (branch authored locally, human opens PR) | SATISFIED | Branch local; NO_REMOTE_CONFIGURED; ship gate met per SC7 |
| CLASS1-01 (SHOULD report-to row) | SATISFIED | NUB-CLASS-1.md Shell Responsibilities bullet 6 |
| CLASS1-02 (MUST violation-correlation row) | SATISFIED | NUB-CLASS-1.md Shell Responsibilities bullet 7; `(dTag, aggregateHash)` present |
| CLASS1-03 (bundled in same PR branch) | SATISFIED | Both amendments on single branch `nub-identity-decrypt` |
| VER-02 (hygiene grep gate) | SATISFIED | /tmp/napplet-137-hygiene-grep.log: VER02_EXIT=0 |
| VER-03 (conformance grep gate) | SATISFIED | /tmp/napplet-137-conformance-grep.log: VER03_EXIT=0; TOTAL_FAIL_COUNT=0 |

All 24 requirement IDs: SATISFIED.

---

### Anti-Patterns Found

No anti-patterns found. Verification scan of phase artifacts:

- NUB-IDENTITY.md: 0 forbidden tokens; 0 free-standing "Class 1" references; normative content substantive (322 lines, all spec-relevant prose)
- NUB-CLASS-1.md: 0 forbidden tokens; additive-only edit confirmed (8 insertions, 0 deletions vs nub-class-1 branch)
- 137-NUB-CLASS-1-AMENDMENT.md: 0 forbidden tokens; 45 lines substantive audit content
- 137-NUB-IDENTITY-AMENDMENT.md: 0 forbidden tokens; 0 free-standing "Class 1"; 82 lines substantive audit content
- 137-PHASE-NOTES.md: 0 forbidden tokens; 131 lines substantive handoff content
- Evidence files correctly in /tmp/ per AGENTS.md no-home-pollution rule; no random files created in ~

One known pattern requiring attention, handled correctly by the phase: the self-reference trap (audit artifacts describing a hygiene-grep must describe the forbidden-token pattern semantically, not quote the alternation regex verbatim). Plans 03 and 04 both encountered and resolved this correctly.

---

### Phase Boundary Check

| Boundary | Status | Evidence |
|----------|--------|----------|
| No @napplet/* source changes | CLEAN | git show --stat on all 4 phase commits: 0 packages/ files touched |
| No specs/NIP-5D.md changes (Phase 138 territory) | CLEAN | git show --stat: 0 specs/ files touched |
| Evidence files in /tmp/ not home dir | CLEAN | /tmp/napplet-137-*.{log,md} in /tmp; no new files in /home/sandwich/ |
| No push to remote | CLEAN | NO_REMOTE_CONFIGURED; branch local only |
| No PR opened | CLEAN | Human-gated per feedback_no_private_refs_commits |

---

### Human Verification Required

#### 1. Push and open draft PR on napplet/nubs

**Test:** Run the following commands when ready to publish:
```bash
git -C /home/sandwich/Develop/nubs push -u origin nub-identity-decrypt
gh pr create --repo napplet/nubs --base master --head nub-identity-decrypt \
  --title "NUB-IDENTITY + NUB-CLASS-1: class-gated receive-side decrypt + CSP violation reporting" \
  --body-file /tmp/napplet-137-pr-body-preview.md \
  --draft
```

**Expected:** PR created as draft; branch pushed; PR body populated from the hygiene-verified preview file.

**Why human:** Shared-state write to a public repository. Per `feedback_no_private_refs_commits` + ROADMAP SC7, the ship gate for Phase 137 is "diff authored and hygiene-clean on branch" — that gate is passed. PR-open is a post-phase human action explicitly out of scope for this phase's automated work.

---

### Gaps Summary

No gaps. All 7 observable truths are verified against actual file content and git state. The phase goal — authoring a hygiene-clean, conformance-clean bundled amendment diff on a local branch — is fully achieved.

The sole remaining action (push + open PR) is a human-gated post-phase step per ROADMAP SC7 and is not a gap against phase success criteria.

---

_Verified: 2026-04-23T17:10:00Z_
_Verifier: Claude (gsd-verifier)_
