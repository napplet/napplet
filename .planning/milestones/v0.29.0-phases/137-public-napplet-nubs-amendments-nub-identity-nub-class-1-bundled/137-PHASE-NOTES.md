# Phase 137 Phase Notes — Public napplet/nubs Amendments (NUB-IDENTITY + NUB-CLASS-1 bundled)

**Authored:** 2026-04-23
**Phase:** 137 — Public napplet/nubs Amendments (NUB-IDENTITY + NUB-CLASS-1 bundled)
**Milestone:** v0.29.0 Class-Gated Decrypt Surface
**Status:** Diff authored on local branch; hygiene + conformance gates green; awaiting human PR open

## Summary

A single amendment branch `nub-identity-decrypt` on `~/Develop/nubs` carries the bundled Phase 137 amendment. Two adjacent edits: `NUB-IDENTITY.md` gains the `identity.decrypt` envelope triad + 8-code error vocabulary + 4 shell MUSTs + 3-concern Security Considerations subsection (DEC-01..08, GATE-01..04, NUB-IDENTITY-01..05); `NUB-CLASS-1.md` gains a `report-to` SHOULD row + violation-correlation MUST row + a Security Considerations subsection (CLASS1-01, CLASS1-02). Both amendments live on one branch per CLASS1-03's bundle clause so one PR opens them together.

The plan ran as 4 waves: Wave 1 (Plan 01) created the amendment branch (merge commit `031c7fa`); Wave 2 (Plan 02) committed the NUB-CLASS-1 amendment (commit `c020479`); Wave 3 (Plan 03) committed the NUB-IDENTITY amendment (commit `45cdf39`) — serialized after Wave 2 to avoid a concurrent-write race on the shared branch; Wave 4 (this plan) ran the verification gates.

Cross-repo public-repo hygiene (VER-02) stamps pass: the forbidden-token regex (first-party private package names + two legacy internal project identifiers) matches zero times across the branch diff, the branch commit log, and the prepared PR body preview. Spec conformance (VER-03) stamps pass: all 8 `IdentityDecryptErrorCode` values present, all 4 shell MUSTs present, `NUB-CLASS-1.md` filename citation appears 7 times in `NUB-IDENTITY.md` (≥ 3 required), free-standing `Class 1` phrase absent, Security Considerations 3-concern structure present, all 7 Phase 136 empirical substrate literals present across the combined corpus.

The phase ships "diff authored, hygiene-clean, conformance-clean on local branch, un-pushed, no-PR-opened". The human opens the PR as the gated shared-state action per `feedback_no_private_refs_commits`.

## 1. Branch State (NUB-IDENTITY-07, CLASS1-03)

Branch: `nub-identity-decrypt` on `~/Develop/nubs` — created by Plan 01 via:
- `git checkout -b nub-identity-decrypt nub-identity`
- `git merge --no-ff nub-class-1` (brings `NUB-CLASS-1.md` onto the branch)

Both source draft branches (`nub-identity`, `nub-class-1`) are unchanged. Master is also unchanged (it has NEITHER file — both NUBs live on PR branches only per nubs-repo convention).

Branch HEAD after all plans: `45cdf39605da41e840dd4691014221b81e7ec24e`.

Commits on branch since master (8 total; 3 authored by this milestone, 5 inherited from the two draft branches pre-bundle):

- `45cdf39` — NUB-IDENTITY: add identity.decrypt envelope + class-gating MUSTs + error vocabulary (Plan 03, Wave 3)
- `c020479` — NUB-CLASS-1: add report-to SHOULD and violation-correlation MUST rows (Plan 02, Wave 2)
- `031c7fa` — chore: bundle nub-identity + nub-class-1 branches for Phase 137 amendment (Plan 01, Wave 1)
- `abcccf3` — docs: clarify picture/banner URLs flow through NUB-RESOURCE (inherited from `nub-identity`)
- `31c89af` — fix: update NUB-CLASS-1 registry link to PR #17 (inherited from `nub-class-1`)
- `9bf7437` — docs: add NUB-CLASS-1 spec (strict baseline posture) (inherited from `nub-class-1`)
- `d05c19e` — Merge branch 'master' into nub-identity (inherited from `nub-identity`)
- `56795c9` — spec: add NUB-IDENTITY -- read-only user identity queries (inherited from `nub-identity`)

No `git push` was run. No `gh pr create` was run. `git config --get branch.nub-identity-decrypt.remote` returns `NO_REMOTE_CONFIGURED`.

## 2. VER-02 Hygiene Gate (NUB-IDENTITY-06)

Evidence: `/tmp/napplet-137-hygiene-grep.log` — stamp `VER02_EXIT=0`.

3 grep channels all returned 0 matches for the forbidden-token regex (first-party private package names + two legacy internal project identifiers — see the VER-02 evidence log for the exact pattern):

- **Channel 1:** `git diff master..nub-identity-decrypt -- NUB-IDENTITY.md NUB-CLASS-1.md` → `DIFF_FORBIDDEN_MATCHES=0`
- **Channel 2:** `git log master..nub-identity-decrypt --format="%s%n%b"` → `COMMIT_LOG_FORBIDDEN_MATCHES=0`
- **Channel 3:** `/tmp/napplet-137-pr-body-preview.md` (the PR body the human will paste) → `PR_BODY_FORBIDDEN_MATCHES=0`

`TOTAL_FORBIDDEN_MATCHES=0` stamped on the log. Phase 137 ships cross-repo hygiene-clean on every channel that can carry content into the public `napplet/nubs` repository when the human opens the PR.

## 3. VER-03 Spec Conformance Gate

Evidence: `/tmp/napplet-137-conformance-grep.log` — stamp `VER03_EXIT=0`.

Per-group summary (every check PASSED; `TOTAL_FAIL_COUNT=0`):

- **Group A — 8 IdentityDecryptErrorCode values** (DEC-04, NUB-IDENTITY-03): `class-forbidden` (7), `signer-denied` (2), `signer-unavailable` (2), `decrypt-failed` (2), `malformed-wrap` (5), `impersonation` (4), `unsupported-encryption` (3), `policy-denied` (2) — all present in `NUB-IDENTITY.md`
- **Group B — 4 shell MUSTs** (DEC-06..08, GATE-01..03, NUB-IDENTITY-02): class-gating (with `class: 1` at 5 occurrences + `NUB-CLASS-1.md` filename cited 7 times); outer-sig-verify (with `outer` at 8 + `signature` at 8); impersonation-check (with `seal.pubkey` at 3 + `rumor.pubkey` at 5); outer-created_at-hiding (with `created_at` at 7 + `±2` day-randomize wording at 2)
- **Group C — Filename citation discipline** (NUB-IDENTITY-04): free-standing `Class 1` phrase ABSENT (regex-flanked count = 0 in `NUB-IDENTITY.md`)
- **Group D — Security Considerations 3 concerns** (NUB-IDENTITY-05): `NIP-17` (11), `all_frames` (1), `script-src` (2), `world:` (1), `chrome.scripting.executeScript` (1), `connect-src 'none'` (2) — all present
- **Group E — Phase 136 empirical substrate (7 literals)**: `world:` (2), `chrome.scripting.executeScript` (2), `connect-src 'none'` (11), `MAY refuse-to-serve` (2), `shell MAY reject` (2), `(dTag, aggregateHash)` (3), violation-variant (`violatedDirective` at 2 + `script-src-elem` at 2 — both present) — all present across combined corpus
- **Group F — NUB-CLASS-1 amendment literals** (CLASS1-01, CLASS1-02): `report-to` (3), `Report-To` (1), `(dTag, aggregateHash)` (2), `script-src-elem` (1) — all present in `NUB-CLASS-1.md`
- **Group G — Shim observability note** (GATE-04): `observability` (1) + `trust boundary` (1) — both present (GATE-04 documented as observability NOT trust boundary per NUB-IDENTITY-05)

### Deviations (2 × Rule 1 — tooling bugs; spec content unchanged)

Two Rule 1 auto-fixes landed in this plan; both touched only planning/evidence artifacts, not the nubs-repo amendment content:

1. **Verification-script integer-parse bug** — The initial Task 2 run produced a false FAIL on Group C (filename-citation-discipline) because the helper function's `grep -cE ... || echo 0` fallback emitted a `0\n0` token on some invocations that the `[ "$COUNT" -eq 0 ]` test could not parse. The underlying spec content was always clean; the defect was in the evidence-generating script. Fixed inline by rewriting the count helpers to pipe through `head -n1 | tr -d '[:space:]'` guaranteeing exactly one integer. Re-run was all-PASS. Only the `/tmp` log was regenerated.
2. **Self-reference hygiene-grep trap in this PHASE-NOTES** — The initial PHASE-NOTES draft quoted the forbidden-token alternation regex literally when describing the VER-02 hygiene result (the same self-reference trap Plan 03 hit in its Review Checklist). That caused Task 3's own hygiene check — a negative-grep precondition matching the same forbidden alternation — to fail against THIS file, despite the quoting being purely descriptive. Rephrased both quoting lines semantically ("first-party private package names + two legacy internal project identifiers") matching the Plan 03 precedent. No content loss; the quoted tokens remain present verbatim in the cited `/tmp/napplet-137-hygiene-grep.log`.

## 4. Prepared PR Body Preview (for human reuse)

Path: `/tmp/napplet-137-pr-body-preview.md`

Contents: title + 2-section body (NUB-IDENTITY amendment + NUB-CLASS-1 amendment summaries) + Why-Bundled rationale + Empirical-Substrate cite + Backward-Compatibility note. Hygiene-clean by construction (Task 1 greps it as Channel 3; `PR_BODY_FORBIDDEN_MATCHES=0`).

When the human is ready to open the PR, they can reuse this file verbatim:

```bash
# Human-gated shared-state actions (NOT RUN by this phase):
git -C /home/sandwich/Develop/nubs push -u origin nub-identity-decrypt
gh pr create --repo napplet/nubs --base master --head nub-identity-decrypt \
  --title "NUB-IDENTITY + NUB-CLASS-1: class-gated receive-side decrypt + CSP violation reporting" \
  --body-file /tmp/napplet-137-pr-body-preview.md \
  --draft
```

The `--draft` flag follows the in-repo convention (existing NUB PRs are draft until the maintainer signals merge-readiness). The human decides whether to push first or let `gh pr create` do it.

## 5. Phase 138 Handoff

Phase 138 (in-repo NIP-5D amendment + docs + final verification) consumes this phase's output:

- **NIP5D-01:** Local `specs/NIP-5D.md` needs sync against napplet/nubs master post-PR-15 (`window.nostr` removal merged 2026-04-21). Phase 138 owns the sync as a prerequisite to layering any v0.29.0 amendment on top of the local copy.
- **NIP5D-02:** Local `specs/NIP-5D.md` Security Considerations subsection layers on top of the sync'd baseline. Phase 138 owns drafting this subsection. It MUST cite `NUB-IDENTITY.md` and `NUB-CLASS-1.md` by filename (per NUB-CLASS §Citation), and MUST mention `world: 'MAIN'` residual honestly. Phase 138 can reuse the prose from this phase's `137-NUB-IDENTITY-AMENDMENT.md` and `137-NUB-CLASS-1-AMENDMENT.md` audit copies when adapting for in-repo voice.
- **NIP5D-03:** Cross-references in NIP-5D Security Considerations cite both amended NUBs by filename; matches the filename-citation discipline this phase enforced.
- **NIP5D-04:** NIP-5D edits land on master or their own PR, never bundled into the `nub-identity-decrypt` branch or any other long-lived NUB-WORD branch (per `feedback_spec_branch_hygiene`). Phase 137's nubs-repo branch is disjoint from Phase 138's napplet-repo spec work.
- **DOC-01..04:** Phase 138 updates `packages/nub/README.md`, `packages/sdk/README.md`, root `README.md`, `skills/build-napplet/SKILL.md` for the `identity.decrypt` surface. Source material: Phase 135 SUMMARYs (the shipped first-party surface — private-repo-appropriate doc language) + this phase's local audit artifacts (for class-gating expectations language aligned with the public spec).
- **VER-06:** `specs/NIP-5D.md` grep gate mirrors this phase's VER-02/VER-03 pattern but targets the in-repo file. The verification helper bug fixed under Rule 1 above is a precedent Phase 138's gate author should borrow — use `head -n1 | tr -d '[:space:]'` around `grep -c` output to avoid the same integer-parse trap.

Phase 138 may run AFTER the human opens the PR (which makes the amendment "published prose" for downstream in-repo docs to reference, even while the PR is still draft). Phase 138 does NOT block on PR merge — the amendment is citable as an open draft by filename.

### Not Phase 138's territory (explicitly excluded)

- Pushing `nub-identity-decrypt` to origin — human gated (this phase + Phase 138 both abstain)
- Opening the PR — human gated
- Merging the PR upstream — maintainer (dskvr) gated per nubs-repo governance
- Any further edits to `NUB-IDENTITY.md` or `NUB-CLASS-1.md` after the PR opens — review-feedback gated; if review requests changes, the planner opens a short follow-up phase rather than reopening Phase 137

## 6. Evidence Files

All evidence lives in `/tmp/` per AGENTS.md no-home-pollution rule:

- `/tmp/napplet-137-hygiene-grep.log` — VER-02 evidence + `VER02_EXIT=0` stamp + per-channel counts
- `/tmp/napplet-137-conformance-grep.log` — VER-03 evidence + `VER03_EXIT=0` stamp + per-literal PASS list + `TOTAL_FAIL_COUNT=0`
- `/tmp/napplet-137-pr-body-preview.md` — prepared PR body for human reuse (not git-tracked)

Reproducible: re-running Task 1 and Task 2 of Plan 04 regenerates both grep logs from the current branch state; the scripts are self-contained and can be dropped into a CI check if this verification pattern extends to other milestones.

## 7. Confirmation: Zero Unintended Changes

On `~/Develop/napplet` this phase modified only `.planning/` files (PLANs + SUMMARYs + PHASE-NOTES + REQUIREMENTS + ROADMAP + STATE + the 2 committed audit-copy artifacts `137-NUB-IDENTITY-AMENDMENT.md` and `137-NUB-CLASS-1-AMENDMENT.md`). `packages/`, `specs/`, `skills/`, `src/` directories are untouched. Phase 137 touches no first-party source — all first-party code work shipped in Phase 135.

On `~/Develop/nubs` the working tree is clean; all amendment commits landed on `nub-identity-decrypt`; master is unchanged; the two source draft branches (`nub-identity`, `nub-class-1`) are unchanged.

---

*Phase 137 ships "diff authored, hygiene-clean, conformance-clean on local branch, un-pushed, un-PR-opened". Wave 3 of v0.29.0 complete; Phase 138 (NIP-5D in-repo amendment + docs) unblocked.*
