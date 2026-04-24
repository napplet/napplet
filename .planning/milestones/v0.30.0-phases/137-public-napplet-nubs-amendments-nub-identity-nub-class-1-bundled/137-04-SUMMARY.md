---
phase: 137-public-napplet-nubs-amendments-nub-identity-nub-class-1-bundled
plan: "04"
subsystem: verification
tags: [nubs, napplet-nubs, NUB-IDENTITY, NUB-CLASS-1, hygiene-grep, conformance-grep, verification, phase-notes, cross-repo, ship-gate]

# Dependency graph
requires:
  - phase: 137-01
    provides: Amendment branch `nub-identity-decrypt` on `~/Develop/nubs` at merge commit `031c7fa`
  - phase: 137-02
    provides: NUB-CLASS-1 amendment body committed as `c020479` — report-to SHOULD + violation-correlation MUST + Security Considerations subsection
  - phase: 137-03
    provides: NUB-IDENTITY amendment body committed as `45cdf39` — identity.decrypt envelope triad + 8-code error vocabulary + 4 shell MUSTs + 3-concern Security Considerations subsection

provides:
  - "`/tmp/napplet-137-hygiene-grep.log` (VER-02 evidence) with `VER02_EXIT=0` stamp across 3 channels: branch diff + commit log + PR body preview — all zero-match"
  - "`/tmp/napplet-137-conformance-grep.log` (VER-03 evidence) with `VER03_EXIT=0` stamp; `TOTAL_FAIL_COUNT=0`; all 7 groups green (8 error codes + 4 MUSTs + filename-citation discipline + 3 Security Considerations concerns + 7 Phase 136 substrate literals + NUB-CLASS-1 amendment literals + GATE-04 shim observability)"
  - "`/tmp/napplet-137-pr-body-preview.md` — prepared draft PR body for the human to reuse with `gh pr create --body-file`; hygiene-clean by construction (Channel 3 of VER-02)"
  - "`137-PHASE-NOTES.md` — 132-line Phase 137 synthesis with Phase 138 handoff, branch-state summary, VER-02/VER-03 evidence citations, and zero-push/zero-PR assertion"
  - "Phase 137 ship gate certified: diff authored, hygiene-clean, conformance-clean on un-pushed branch — ready for human to `git push` + `gh pr create --draft`"

affects:
  - "Phase 138 (NIP-5D in-repo amendment + docs + VER-06) — can cite the committed amendment text by filename on branch `nub-identity-decrypt` of `~/Develop/nubs`, with the audit-copy artifacts `137-NUB-IDENTITY-AMENDMENT.md` + `137-NUB-CLASS-1-AMENDMENT.md` as in-repo planning context for adapting prose to local voice"
  - "Future verification phases that borrow the VER-02/VER-03 pattern — the `count_fixed` / `count_regex` / `head -n1 | tr -d '[:space:]'` helper pattern established here is the integer-safe fix for the `grep -c ... || echo 0` gotcha"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "3-channel hygiene grep: branch diff + branch commit log + PR body preview file — closes the three surfaces where forbidden tokens could leak into the public PR when the human opens it"
    - "7-group conformance grep with per-group PASS/FAIL bookkeeping: error codes / MUSTs / citation discipline / security concerns / substrate literals / amendment literals / observability framing — maps directly to REQ groups in REQUIREMENTS.md for traceability"
    - "Integer-safe bash grep count helpers: wrap `grep -c` output with `head -n1 | tr -d '[:space:]'` to guarantee single-integer result; avoids `0\\n0` parse failures when `|| echo 0` fallback is redundantly emitted"
    - "Self-reference quoting discipline: audit artifacts describing a hygiene-grep MUST describe the forbidden-token pattern semantically, not quote the alternation regex verbatim, else the artifact itself trips the very check it describes"

key-files:
  created:
    - "/tmp/napplet-137-hygiene-grep.log (VER-02 evidence, not repo-committed per AGENTS.md)"
    - "/tmp/napplet-137-conformance-grep.log (VER-03 evidence, not repo-committed)"
    - "/tmp/napplet-137-pr-body-preview.md (draft PR body for human reuse, not repo-committed)"
    - ".planning/phases/137-public-napplet-nubs-amendments-nub-identity-nub-class-1-bundled/137-PHASE-NOTES.md (132 lines — Phase 138 handoff)"
    - ".planning/phases/137-public-napplet-nubs-amendments-nub-identity-nub-class-1-bundled/137-04-SUMMARY.md"
  modified: []
  # Two audit-copy artifacts (137-NUB-IDENTITY-AMENDMENT.md, 137-NUB-CLASS-1-AMENDMENT.md) were created by Plans 02 and 03 and left untracked per their summaries; Plan 04's metadata commit bundles them into the repo per plan objective.

key-decisions:
  - "VER-02 3-channel design holds: the one surface NOT naturally under a git-diff grep — the PR body — is covered by writing it to a disk file FIRST (under the same forbidden-token grep), THEN instructing the human to reuse that file via `--body-file`. The hygiene grep then certifies all three surfaces (diff, commits, PR body) simultaneously."
  - "Integer-parse bug in the `check_absent` / `check_present` helpers (`grep -cE ... || echo 0` can emit `0\\n0` producing `[: integer expression expected`) treated as Rule 1 — the spec content was always clean; only the evidence-generator was broken. Fixed by piping through `head -n1 | tr -d '[:space:]'` which guarantees exactly one integer."
  - "Self-reference hygiene-grep trap in PHASE-NOTES treated as Rule 1 — rephrasing quoting lines semantically (matching the Plan 03 Review Checklist precedent) preserves descriptive intent without tripping the grep. The quoted forbidden tokens remain verbatim in `/tmp/napplet-137-hygiene-grep.log` for anyone auditing what the check actually searched for."
  - "Audit-copy artifacts (137-NUB-CLASS-1-AMENDMENT.md, 137-NUB-IDENTITY-AMENDMENT.md) committed by THIS plan's metadata commit per plan objective — Plans 02/03 deliberately deferred them to this plan's bundle. Doing it here keeps both audit copies together in one commit, easier to review."

patterns-established:
  - "Integer-safe count helper pattern: `count_fixed() { grep -Fc -- \"$PATTERN\" \"$FILE\" 2>/dev/null | head -n1 | tr -d '[:space:]' || echo 0 }` — reusable for any future bash verification script that needs counts under `|| echo 0` fallback semantics without the `0\\n0` trap"
  - "Self-reference quoting discipline for audit artifacts: describe forbidden patterns semantically (e.g., \"first-party private package names + legacy internal project identifiers\") not by quoting the regex; keep the literal pattern only in the evidence log, which is the only place that needs to self-describe"
  - "Phase-notes handoff structure (mirrored from 136-PHASE-NOTES.md): Summary + numbered Sections (Branch State → VER-02 → VER-03 → PR Body Preview → Next Phase Handoff → Evidence Files → Zero-Unintended-Changes Confirmation) — reusable for future cross-repo verification phases"

requirements-completed:
  - NUB-IDENTITY-06
  - NUB-IDENTITY-07
  - VER-02
  - VER-03

# Metrics
duration: 5min
completed: 2026-04-23
---

# Phase 137 Plan 04: Verification Gates + Phase-Notes Synthesis Summary

**VER-02 (3-channel hygiene grep) stamps pass zero matches across branch diff + commit log + PR body preview; VER-03 (7-group conformance grep) stamps pass zero FAILs across 40+ literal-string checks; `137-PHASE-NOTES.md` synthesizes the Phase 138 handoff; Phase 137 ship gate certified — `nub-identity-decrypt` is ready for human `git push` + draft PR open.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-23T14:42:43Z
- **Completed:** 2026-04-23T14:48:23Z
- **Tasks:** 3 (Task 1: VER-02 hygiene grep + PR body preview write; Task 2: VER-03 conformance grep; Task 3: PHASE-NOTES synthesis)
- **Files created on `~/Develop/napplet`:** 5 (3 in `/tmp/` as evidence; 2 in `.planning/phases/137-.../` as planning artifacts: `137-PHASE-NOTES.md`, `137-04-SUMMARY.md`)
- **Files modified:** 0 (no source code, no repo-committed file edits outside `.planning/`)
- **Commits on `~/Develop/nubs`:** 0 (this plan is verification-only; zero nubs-repo mutations)

## Accomplishments

- **Task 1 (VER-02, NUB-IDENTITY-06):** 3-channel hygiene grep stamped `VER02_EXIT=0` with `TOTAL_FORBIDDEN_MATCHES=0`:
  - Channel 1 (branch diff `master..nub-identity-decrypt` -- NUB-IDENTITY.md + NUB-CLASS-1.md): 0 matches
  - Channel 2 (branch commit log `master..nub-identity-decrypt --format="%s%n%b"`): 0 matches
  - Channel 3 (`/tmp/napplet-137-pr-body-preview.md`): 0 matches
  Plus the PR body preview file itself is prepared with the exact `--body-file` content the human will paste into `gh pr create`, hygiene-verified to be clean.

- **Task 2 (VER-03):** 7-group conformance grep stamped `VER03_EXIT=0` with `TOTAL_FAIL_COUNT=0`:
  - **Group A** — all 8 `IdentityDecryptErrorCode` values present (class-forbidden: 7, signer-denied: 2, signer-unavailable: 2, decrypt-failed: 2, malformed-wrap: 5, impersonation: 4, unsupported-encryption: 3, policy-denied: 2)
  - **Group B** — 4 shell MUSTs all anchored: class-gating (`class: 1` x5 + `NUB-CLASS-1.md` cited 7 times, well above the ≥3 floor), outer-sig-verify (`outer` x8 + `signature` x8), impersonation-check (`seal.pubkey` x3 + `rumor.pubkey` x5), outer-`created_at`-hiding (`created_at` x7 + `±2` x2)
  - **Group C** — filename-citation discipline: free-standing `Class 1` phrase regex-count = 0 (absent as required)
  - **Group D** — all 3 Security Considerations concern-anchors present: NIP-17, `all_frames`, `script-src`, `world:`, `chrome.scripting.executeScript`, `connect-src 'none'`
  - **Group E** — all 7 Phase 136 substrate literals present across combined corpus: `world:`, `chrome.scripting.executeScript`, `connect-src 'none'`, `MAY refuse-to-serve`, `shell MAY reject`, `(dTag, aggregateHash)`, violation-variant (both `violatedDirective` x2 AND `script-src-elem` x2 — either suffices; both present)
  - **Group F** — NUB-CLASS-1 amendment literals in NUB-CLASS-1.md: `report-to` x3, `Report-To` x1, `(dTag, aggregateHash)` x2, `script-src-elem` x1
  - **Group G** — GATE-04 shim observability framing: `observability` x1, `trust boundary` x1

- **Task 3 (handoff synthesis):** `137-PHASE-NOTES.md` written (132 lines) covering Phase 137 Summary + 7 sections: Branch State → VER-02 Gate → VER-03 Gate → Prepared PR Body Preview → Phase 138 Handoff → Evidence Files → Zero-Unintended-Changes Confirmation. Mirrors the v0.29.0 Phase 136 PHASE-NOTES.md structure per plan directive. Cites both NUB filenames (`NUB-IDENTITY.md`, `NUB-CLASS-1.md`) and branch name (`nub-identity-decrypt`) repeatedly for Phase 138 reusability. Hygiene-clean against the same forbidden-token grep (0 matches after the Rule 1 self-reference-trap fix below).

- **Ship gate certified:** `gh pr list --head nub-identity-decrypt --repo napplet/nubs --state all` returns empty list `[]`; `git config --get branch.nub-identity-decrypt.remote` returns `NO_REMOTE_CONFIGURED`; branch HEAD `45cdf39` unchanged from Plan 03 tip. The phase ships "diff authored, hygiene-clean, conformance-clean, un-pushed, no-PR-opened" — final shared-state actions (push + PR create) remain human-gated per `feedback_no_private_refs_commits`.

## Task Commits

Per plan convention Tasks 1-3 are verification-only (no source-file edits; all evidence lives in `/tmp/` per AGENTS.md no-home-pollution) so no per-task commits landed during execution. The plan's three artifacts that DO live in the repo — `137-PHASE-NOTES.md`, `137-04-SUMMARY.md`, plus the two deferred audit-copy files from Plans 02 and 03 (`137-NUB-CLASS-1-AMENDMENT.md`, `137-NUB-IDENTITY-AMENDMENT.md`) — land together in the plan-metadata commit alongside STATE.md, ROADMAP.md, REQUIREMENTS.md updates.

1. **Task 1: Run VER-02 3-channel hygiene grep + write PR body preview** — verification-only; no commit (evidence in `/tmp/`)
2. **Task 2: Run VER-03 7-group spec-conformance grep** — verification-only; no commit (evidence in `/tmp/`)
3. **Task 3: Write 137-PHASE-NOTES.md** — content lands via plan-metadata commit below

**Plan metadata commit** will bundle on `~/Develop/napplet`:
- `.planning/phases/137-.../137-PHASE-NOTES.md` (new, 132 lines)
- `.planning/phases/137-.../137-04-SUMMARY.md` (new, this file)
- `.planning/phases/137-.../137-NUB-CLASS-1-AMENDMENT.md` (untracked from Plan 02; now tracked)
- `.planning/phases/137-.../137-NUB-IDENTITY-AMENDMENT.md` (untracked from Plan 03; now tracked)
- `.planning/STATE.md` (position + decisions updates)
- `.planning/ROADMAP.md` (phase 137 progress updates)
- `.planning/REQUIREMENTS.md` (4 REQ-IDs marked complete)

## Files Created/Modified

### On `~/Develop/napplet` (this repo, napplet planning)

- `.planning/phases/137-public-napplet-nubs-amendments-nub-identity-nub-class-1-bundled/137-PHASE-NOTES.md` (132 lines) — Phase 138 handoff document
- `.planning/phases/137-public-napplet-nubs-amendments-nub-identity-nub-class-1-bundled/137-04-SUMMARY.md` (this file)

### On `/tmp/` (evidence; per AGENTS.md no-home-pollution; not repo-committed)

- `/tmp/napplet-137-hygiene-grep.log` — VER-02 evidence with `VER02_EXIT=0` stamp + 3 per-channel counts
- `/tmp/napplet-137-conformance-grep.log` — VER-03 evidence with `VER03_EXIT=0` stamp + 40+ per-literal PASS lines across 7 groups + `TOTAL_FAIL_COUNT=0`
- `/tmp/napplet-137-pr-body-preview.md` — draft PR body for the human to pass via `gh pr create --body-file`

### On `~/Develop/nubs` (public repo, branch `nub-identity-decrypt`)

- No changes. Working tree clean. HEAD unchanged at `45cdf39` from Plan 03.

## Decisions Made

All plan-time locked decisions executed verbatim except for the two Rule 1 auto-fix deviations below (both tooling bugs; spec content never touched).

Plan-executed locked decisions (re-stated for traceability):

- **3-channel hygiene grep spans diff + commits + PR body preview** — locked in plan Task 1. Executed verbatim.
- **7-group conformance grep with explicit per-literal count checks** — locked in plan Task 2. Executed verbatim (40+ literal checks across Groups A-G).
- **PHASE-NOTES mirrors v0.29.0 Phase 136 PHASE-NOTES.md structure** — locked in plan Task 3. Executed verbatim: Summary + 7 numbered sections + Evidence Files block + Zero-Unintended-Changes Confirmation.
- **Zero push / zero PR discipline** — locked by phase success criteria + NUB-IDENTITY-07. Executed verbatim (no `git push`, no `gh pr create`; final shared-state actions gated to human).
- **Audit copies from Plans 02/03 bundled into THIS plan's metadata commit** — locked by both upstream summaries' "Commit: not yet committed (Plan 04 bundles ...)" notes. Executed verbatim.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Verification-script integer-parse failure in `check_absent` / `check_present` helpers**
- **Found during:** Task 2 initial run (Group C — filename-citation-discipline check)
- **Issue:** The helper functions used `grep -cE ... 2>/dev/null || echo 0` as a fallback for missing-file cases. On some invocations (when grep successfully returned `0` from a valid file), bash emitted a literal `0\n0` token that the `[ "$COUNT" -eq 0 ]` integer-comparator rejected with `integer expression expected`. Consequence: Group C falsely logged a FAIL with `count=0\n0`, and `TOTAL_FAIL_COUNT` incremented — despite the spec content being entirely compliant (actual count = 0, as expected).
- **Fix:** Rewrote both helpers to pipe every `grep -c` output through `head -n1 | tr -d '[:space:]'`, guaranteeing exactly one integer regardless of grep's stdout behavior or the `|| echo 0` fallback. Re-ran Task 2 from scratch; all 7 groups PASS, `TOTAL_FAIL_COUNT=0`, `VER03_EXIT=0`.
- **Files modified:** `/tmp/napplet-137-conformance-grep.log` (regenerated — no repo files touched)
- **Verification:** Re-run shows zero FAIL lines via `grep '^FAIL' /tmp/napplet-137-conformance-grep.log` returning empty.
- **Committed in:** N/A (evidence regeneration only; log file lives in `/tmp/`)

**2. [Rule 1 - Bug] Self-reference hygiene-grep trap in initial `137-PHASE-NOTES.md` draft**
- **Found during:** Task 3 post-write verify gate
- **Issue:** The initial PHASE-NOTES draft quoted the forbidden-token alternation regex literally (twice: once in Summary section, once in Section 2 VER-02 block) when describing the hygiene grep's three-channel scope. Task 3's own negative-grep verify precondition (which re-uses the same forbidden-token alternation) therefore FAILED against THIS file, despite the quoting being purely descriptive — this is the same self-reference trap Plan 03 hit in its Review Checklist.
- **Fix:** Rephrased both quoting lines semantically to match the Plan 03 precedent ("first-party private package names + two legacy internal project identifiers — see the VER-02 evidence log for the exact pattern"). Content loss: zero — the quoted tokens remain verbatim in `/tmp/napplet-137-hygiene-grep.log` (cited in the PHASE-NOTES), which is the sole location that needs to self-describe the check for auditability.
- **Files modified:** `137-PHASE-NOTES.md` (2 lines rephrased)
- **Verification:** Re-run of the full Task 3 verify gate (negated `grep -qE` of the forbidden-token alternation against the file) exits 0; counted matches on the file return 0.
- **Committed in:** part of plan-metadata commit below.

---

**Total deviations:** 2 auto-fixed (both Rule 1, both tooling/self-reference bugs — spec content never touched)
**Impact on plan:** Both deviations are evidence-generation / documentation-self-reference artifacts. Neither touched the `nub-identity-decrypt` branch. The nubs-repo amendment state is identical to what Plans 02 and 03 delivered.

## Issues Encountered

- **Rule 1 deviations above** (verification-script integer-parse + PHASE-NOTES self-reference trap) — both auto-fixed inline; see Deviations section.

No other issues. All 3 tasks executed against their acceptance criteria first-pass apart from the two tooling bugs above.

## Authentication Gates

**None.** This plan runs entirely locally: reads from `~/Develop/nubs` (git operations on an existing branch — no network), writes to `/tmp/` (evidence files) and `.planning/` (PHASE-NOTES + SUMMARY). No environment variables, no external service auth, no GitHub API writes.

## Push + PR Gate (Human Action — Phase 137 Ship Boundary)

Per `feedback_no_private_refs_commits` + NUB-IDENTITY-07 + CLASS1-03: Phase 137 ships "diff authored, hygiene-clean, and conformance-clean on a local branch." The following actions are explicitly NOT PERFORMED by this plan and remain human-gated as shared-state writes:

```bash
# Reusable human commands (NOT RUN by any automation in this phase):
git -C /home/sandwich/Develop/nubs push -u origin nub-identity-decrypt
gh pr create --repo napplet/nubs --base master --head nub-identity-decrypt \
  --title "NUB-IDENTITY + NUB-CLASS-1: class-gated receive-side decrypt + CSP violation reporting" \
  --body-file /tmp/napplet-137-pr-body-preview.md \
  --draft
```

Draft flag per nubs-repo convention (existing NUB PRs are draft until maintainer signals merge-readiness). The human decides whether to push first or let `gh pr create` do it.

## Next Phase Readiness

- **Phase 138 (in-repo NIP-5D amendment + docs + VER-06) UNBLOCKED** — the committed `NUB-IDENTITY.md` and `NUB-CLASS-1.md` amendment text on `nub-identity-decrypt` is citable by filename; the two in-repo audit artifacts `137-NUB-IDENTITY-AMENDMENT.md` + `137-NUB-CLASS-1-AMENDMENT.md` provide planning-side prose snippets Phase 138 can adapt for local voice when drafting NIP5D-02's Security Considerations subsection.
- **Phase 138 can start before or after human PR open** — the amendment is "published prose" the moment it lands on the branch; PR open is not a prerequisite for Phase 138's reading of it.
- **Phase 138 DOES NOT touch `~/Develop/nubs`** — per `feedback_spec_branch_hygiene` Phase 138's NIP-5D edits land on napplet's master (or own PR), never bundled into `nub-identity-decrypt` or any NUB-WORD branch.
- **No blockers** — working tree clean on both repos; branch state unchanged since Plan 03; evidence complete; no push; no PR.

## Self-Check

Automated verification of SUMMARY claims:

```bash
# Evidence files exist in /tmp/ with correct stamps
test -f /tmp/napplet-137-hygiene-grep.log                                  → FOUND
grep -qF "VER02_EXIT=0"    /tmp/napplet-137-hygiene-grep.log               → FOUND
grep -qF "VER02_RESULT=PASS" /tmp/napplet-137-hygiene-grep.log             → FOUND
grep -qF "TOTAL_FORBIDDEN_MATCHES=0" /tmp/napplet-137-hygiene-grep.log     → FOUND
test -f /tmp/napplet-137-conformance-grep.log                              → FOUND
grep -qF "VER03_EXIT=0"    /tmp/napplet-137-conformance-grep.log           → FOUND
grep -qF "VER03_RESULT=PASS" /tmp/napplet-137-conformance-grep.log         → FOUND
grep -qF "TOTAL_FAIL_COUNT=0" /tmp/napplet-137-conformance-grep.log        → FOUND
! grep -qE "^FAIL  " /tmp/napplet-137-conformance-grep.log                 → TRUE (zero FAIL lines)
test -f /tmp/napplet-137-pr-body-preview.md                                → FOUND
forbidden-token alternation absent in /tmp/napplet-137-pr-body-preview.md   → TRUE

# Repo-tracked artifacts
test -f .planning/phases/137-.../137-PHASE-NOTES.md                        → FOUND (132 lines)
grep -qF "VER02_EXIT=0" .planning/phases/137-.../137-PHASE-NOTES.md        → FOUND (2x)
grep -qF "VER03_EXIT=0" .planning/phases/137-.../137-PHASE-NOTES.md        → FOUND (2x)
grep -qF "nub-identity-decrypt" .planning/phases/137-.../137-PHASE-NOTES.md → FOUND (11x)
grep -qF "Phase 138" .planning/phases/137-.../137-PHASE-NOTES.md           → FOUND (11x)
forbidden-token alternation absent in .planning/phases/137-.../137-PHASE-NOTES.md → TRUE

# Ship gate status
git -C ~/Develop/nubs rev-parse --abbrev-ref HEAD                          → nub-identity-decrypt
git -C ~/Develop/nubs rev-parse HEAD                                       → 45cdf39 (unchanged)
git -C ~/Develop/nubs config --get branch.nub-identity-decrypt.remote      → NO_REMOTE_CONFIGURED
gh pr list --head nub-identity-decrypt --repo napplet/nubs --state all     → [] (empty)
```

## Self-Check: PASSED

All 22 verification claims validated against filesystem + git state + gh API. No missing artifacts, no drift from plan-stated outcomes, zero push, zero PR, zero hygiene violations (after Rule 1 #2 fix), zero conformance failures (after Rule 1 #1 fix), Phase 137 ship gate certified.

---
*Phase: 137-public-napplet-nubs-amendments-nub-identity-nub-class-1-bundled*
*Plan: 04 — VER-02 hygiene gate + VER-03 conformance gate + PHASE-NOTES synthesis*
*Completed: 2026-04-23*
