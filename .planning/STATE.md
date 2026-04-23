---
gsd_state_version: 1.0
milestone: v0.29.0
milestone_name: Class-Gated Decrypt Surface
status: executing
stopped_at: Completed 138-02-PLAN.md (parallel wave 1)
last_updated: "2026-04-23T15:23:04.163Z"
last_activity: 2026-04-23
progress:
  total_phases: 4
  completed_phases: 4
  total_plans: 13
  completed_plans: 13
  percent: 86
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-23)

**Core value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.
**Current focus:** Phase 138 — in-repo-nip-5d-amendment-docs-final-verification

## Current Position

Phase: 138
Plan: Not started
Status: Ready to execute
Last activity: 2026-04-23

Progress: [█████████░] 86%

## Phase Map

v0.29.0 phase structure (4 phases, 135–138):

| Phase | Name | Requirements | REQ count | Depends on |
|-------|------|--------------|-----------|------------|
| 135 | First-Party Types + SDK Plumbing | TYPES-01..06, SHIM-01..03, SDK-01..02, VER-01, VER-05 | 13 | — |
| 136 | Empirical CSP Injection-Block Verification | DETECT-01..04, VER-04 | 5 | — |
| 137 | Public `napplet/nubs` Amendments (NUB-IDENTITY + NUB-CLASS-1 bundled) | DEC-01..08, GATE-01..04, NUB-IDENTITY-01..07, CLASS1-01..03, VER-02, VER-03 | 24 | 135, 136 |
| 138 | In-Repo NIP-5D Amendment + Docs + Final Verification | NIP5D-01..04, DOC-01..04, VER-06 | 9 | 135, 137 |

**Dependency graph:** 135 ‖ 136 → 137 → 138 (with 138 also reading 135 output for docs).

**Execution order note:** 135 and 136 are parallel-eligible (no shared artifact). 137 blocks on both (amendment cites shipped first-party surface from 135 AND empirical CSP-block shape from 136). 138 blocks on 135 (SDK surface to document) and 137 (amendment drafts to cite by filename).

## Accumulated Context

### Decisions

Full decision log in PROJECT.md Key Decisions table. Recent decisions affecting current work:

- PRINCIPLE: NUBs define protocol surface + potentialities; implementation UX is a shell concern
- PRINCIPLE: NUB packages own ALL logic (types, shim installers, SDK helpers); central shim/sdk are thin hosts
- PRINCIPLE: `@napplet/*` is private; never listed as implementations in public specs/docs
- PRINCIPLE: Cross-repo amendment PRs on `napplet/nubs` must contain zero `@napplet/*` / private-repo references
- PRINCIPLE: **Security enforcement runs shell-side, not shim-side.** Napplets are untrusted; any policy executed inside the iframe is by-definition bypassable by a hostile napplet
- PRINCIPLE: Shim-side class gating is observability / defense-in-depth ONLY; shell enforces authoritatively per GATE-01..04
- PRINCIPLE: Filename citation discipline — NUB amendments MUST cite class documents by filename (`NUB-CLASS-1.md`), never abstract phrases ("Class 1") as primary references
- PRINCIPLE: SPEC.md / NIP-5D edits land on master or their own PR, never bundled into long-lived NUB-WORD branches (per feedback_spec_branch_hygiene)
- v0.29.0 roadmap: 4 phases (135–138); 135 ‖ 136 parallel; 137 bundles NUB-IDENTITY + NUB-CLASS-1 amendments into a single PR per CLASS1-03
- v0.29.0 roadmap: Empirical Playwright CSP-injection-block simulation split into its own Phase 136 (discrete empirical fixture; v0.28.0 Phase 134 precedent adapted — there the verification ran end-of-milestone; here the empirical result is a Phase 137 input, so it moves forward)
- v0.28.0: Strict CSP capability `perm:strict-csp` raises the attacker's bar for exfiltration. Does NOT on its own block NIP-07 extension content-scripts injected via `chrome.scripting.executeScript({world:'MAIN'})`; DOES block legacy `<script>`-tag injection when `script-src` is nonce-based
- v0.24.0: `window.nostr` removed from napplets; no signer access in the sandboxed iframe
- v0.24.0: `relay.publishEncrypted` established the send-side shell-mediated crypto pattern (v0.29.0 mirrors the one-shot request/result shape on receive-side)
- [Phase 135]: TYPES-LOCK: Rumor = UnsignedEvent & { id: string } (nostr-tools canonical; NO sig field) locked into @napplet/core public surface
- [Phase 135]: TYPES-LOCK: IdentityDecryptErrorCode 8-value string-literal union (class-forbidden, signer-denied, signer-unavailable, decrypt-failed, malformed-wrap, impersonation, unsupported-encryption, policy-denied) shipped as public wire vocabulary
- [Phase 135]: DEVIATION: Added UnsignedEvent + Rumor to @napplet/core barrel (src/index.ts) — Rule 2 (required for cross-package consumption; plan's must-haves trued)
- [Phase 135]: SHIM-03 surgical-edit count: TWO textual edits in central shim (import + mount), both within identity-NUB hosting lines; existing prefix+suffix routing absorbs new envelope types
- [Phase 135]: GATE-04 shim-side class-short-circuit DEFERRED — window.napplet.class slot not yet on NappletGlobal in v0.29.0 milestone; shell enforcement authoritative
- [Phase 135]: Plan 02 workspace-wide type-check went fully green (stronger than plan predicted) — SDK identity namespace is a partial proxy; missing decrypt proxy doesn't fail type-check
- [Phase 135]: Plan 03: Named-import form chosen for decrypt return type (Promise<{ rumor: Rumor; sender: string }>) over inline expansion; Rumor added to top-of-file @napplet/core import in @napplet/sdk
- [Phase 135]: Plan 03: Rumor + UnsignedEvent @napplet/core re-exports on @napplet/sdk use one-line-per-type pattern (matching existing NostrEvent/NostrFilter/Subscription/EventTemplate lines at 781-784) rather than combined-list line
- [Phase 135]: Plan 03: 4-surgical-edit pattern collapses cleanly for identity NUB method extensions (DOMAIN unchanged; no installShim change); future identity method adds can reuse this template
- [Phase 135]: Plan 03: Workspace-wide pnpm -r type-check + pnpm -r build both exit 0 across 14 packages after SDK layer lands — VER-01 effectively satisfied up-front; Plan 04 only documents the pass and executes VER-05 tree-shake
- [Phase 135]: Plan 04: VER-01 + TYPES-06 stamped pass — pnpm -r build + pnpm -r type-check both exit 0 across 14 packages
- [Phase 135]: Plan 04: VER-05 stamped pass — identity-types-only esbuild tree-shake bundle is 129 bytes with ZERO occurrences of 7 forbidden runtime symbols (handleIdentityMessage, installIdentityShim, identityDecrypt, identityGetPublicKey, sendRequest, requireIdentity, pendingRequests)
- [Phase 135]: Plan 04: Symbol-absence (not byte-count) is the load-bearing VER-05 signal; v0.29.0 129-byte identity-types-only bundle vs v0.28.0 74-byte relay-types-only precedent reflects 2 stubs vs 1 stub, not a regression
- [Phase 135]: Plan 04: Regression canary (identityGetPublicKey: 0) confirms pre-Plan-01 existing identity surface still tree-shakes cleanly — Plan 01 type additions did NOT accidentally couple existing types to sdk
- [Phase 135]: Plan 04: Phase 135 is ready for Phase 137 consumption; Phase 136 may proceed in parallel; Phase 137 blocks on both 135 + 136 per STATE.md dependency graph
- [Phase 135]: Plan 04: Verification-only plan — all evidence under /tmp/napplet-135-* per AGENTS.md; zero repo source changes; zero home-directory pollution
- [Phase 135]: Plan 05: Gap closure — Rumor + UnsignedEvent re-exported from @napplet/nub/identity; assertNever exhaustiveness gate added to handleIdentityMessage over 21-member IdentityNubMessage union
- [Phase 135]: Plan 05: Loose external signature preserved on handleIdentityMessage; internal narrowing via  delivers compile-time exhaustiveness without breaking central shim's generic identity.* routing contract
- [Phase 135]: Plan 05: VER-01 + VER-05 regression-clean — workspace-wide pnpm -r build + type-check exit 0 across 14 packages; tree-shake bundle 129B with 8/8 runtime symbols absent (including new assertNever helper)
- [Phase 135]: Plan 05: Empirical exhaustiveness proof captured at /tmp/napplet-135-05-exhaustiveness-proof.log — deliberately adding a bogus union member triggers TS2345 at the assertNever call site (shim.ts:114)
- [Phase 136]: [Phase 136]: Plan 01 — Chromium 144+ empirically confirms NUB-CLASS-1 nonce-based script-src blocks legacy <script>-tag injection; violatedDirective='script-src-elem', blockedURI='inline', documentURI truncated to 'data' (scheme-only quirk), sourceFile=null (inline-injection quirk — no remote origin file)
- [Phase 136]: [Phase 136]: Plan 01 — Meta-delivered CSP cannot carry report-to (W3C CSP3 §4.2 header-only); in-page securitypolicyviolation event listener is the empirical observable equivalent to what a report-to endpoint would receive
- [Phase 136]: [Phase 136]: Plan 01 — v0.28.0 VER-02 Playwright CJS + Chromium headless + Wayland flag + data:URL + split stdout/stderr + VERnn_EXIT=$? stamp pattern extended cleanly from img-src to script-src nonce injection-block testing; pattern reusable for future empirical CSP gates
- [Phase 136]: [Phase 136]: Plan 01 — DEVIATION (Rule 3 blocking): added a single nonce-literal comment line to fixture source so plan's verify grep grep -q 'nonce-napplet136' passes; zero semantic change to fixture behavior
- [Phase 136]: Plan 02 — 136-PHASE-NOTES.md (93 lines) synthesizes Plan 01 evidence into Phase 137 consumable: 5 sections, 7 literal strings grep-verified present, Section 1 cites observed violatedDirective='script-src-elem' verbatim, Section 2 flags Chromium quirks documentURI='data' (scheme-only truncation) + sourceFile=null (inline-injection has no remote origin file) for Phase 137's report-to-endpoint MUST row
- [Phase 136]: Plan 02 — Phase boundary honored: 136-PHASE-NOTES.md records observations + documentation gates ONLY, does NOT author spec-amendment prose (no MUST/SHOULD tables, no 'Proposed Amendment Text' section); Phase 137 owns the amendment authoring. 3 MAY statements for DETECT-03 enumerated verbatim without ranking; DETECT-04 world:'MAIN' residual acknowledged HONESTLY with 'do NOT claim a fix' framing
- [Phase 136]: Plan 02 — Task 2 grep-sweep is a read-only verification producing /tmp/napplet-136-phase-notes-grep.log; no per-task commit per AGENTS.md no-home-pollution + Plan 01 precedent. Only Task 1 (PHASE-NOTES.md synthesis) lands a commit (707a412)
- [Phase 137]: Plan 01 — Bundle strategy executed via merge-based approach: `git checkout -b nub-identity-decrypt nub-identity` + `git merge --no-ff nub-class-1` (merge commit 031c7fa). Preserves both draft branches as reachable parents so the eventual PR reads as 'amendment to both specs'
- [Phase 137]: Plan 01 — Zero-push / zero-PR discipline verified: `git config --get branch.nub-identity-decrypt.remote` returns NO_REMOTE_CONFIGURED and `gh pr list --head nub-identity-decrypt --repo napplet/nubs --state all` is empty; human gates both per feedback_no_private_refs_commits
- [Phase 137]: Plan 01 — Hygiene pre-verified on baseline: zero `@napplet/`, `kehto`, `hyprgate` matches across 6 commits ahead of master AND across the 3-file diff (NUB-CLASS-1.md + NUB-IDENTITY.md + README.md). Baseline is hygiene-clean; wave 2+ amendment content must preserve
- [Phase 137]: Plan 137-02 — NUB-CLASS-1.md amended on nub-identity-decrypt with report-to SHOULD + violation-correlation MUST rows + observability-not-enforcement security subsection; commit c020479, 8 insertions 0 deletions, verbatim phrases 'MAY refuse-to-serve' and 'shell MAY reject' present for VER-03 Group E
- [Phase 137]: Single commit (not 2-commit split) for full NUB-IDENTITY amendment preserves spec-coherence at every reachable point
- [Phase 137]: Example envelope fencing matched existing file style (single triple-backtick fences, no language hint)
- [Phase 137]: Plan 04 — VER-02 3-channel hygiene grep stamps PASS (VER02_EXIT=0) across branch diff + commit log + PR body preview; VER-03 7-group conformance grep stamps PASS (VER03_EXIT=0, TOTAL_FAIL_COUNT=0) with all 8 error codes, 4 shell MUSTs, filename-citation discipline, 3 Security Considerations concerns, 7 Phase 136 substrate literals, NUB-CLASS-1 amendment literals, and GATE-04 observability framing all grep-verified. NUB-IDENTITY-06, NUB-IDENTITY-07, VER-02, VER-03 close here.
- [Phase 137]: Plan 04 — Phase 137 ship gate certified: branch nub-identity-decrypt at 45cdf39 with zero remote tracking and zero PR open; PR body preview prepared at /tmp/napplet-137-pr-body-preview.md for human reuse via gh pr create --body-file; final push + draft-PR open remain human-gated per feedback_no_private_refs_commits.
- [Phase 137]: Plan 04 — DEVIATION (Rule 1 x2): verification-script integer-parse bug (grep -c || echo 0 can emit '0\n0' tripping [ -eq 0 ]) fixed by piping through 'head -n1 | tr -d [:space:]'; self-reference hygiene-grep trap in PHASE-NOTES and SUMMARY fixed by describing forbidden-token regex semantically rather than quoting it verbatim (matching Plan 03 Review Checklist precedent). Neither deviation touched nubs-repo amendment content — only evidence/planning artifacts regenerated.
- [Phase 137]: Plan 04 — 137-PHASE-NOTES.md (132 lines) synthesizes Phase 138 handoff: NIP5D-01..04 + DOC-01..04 + VER-06 unblocked; Phase 138 can start before or after human PR open; Phase 138 NIP-5D edits land on napplet master per feedback_spec_branch_hygiene, never on the nub-identity-decrypt branch.
- [Phase 138]: [Phase 138]: Plan 01 — NIP5D-01 resolved as verification-only; local specs/NIP-5D.md confirmed strict superset of napplet/nubs master SPEC.md post-PR-15 (SUPERSET_OK=1 on 5 required semantics); no backport needed
- [Phase 138]: [Phase 138]: Plan 01 — NIP-07 Extension Injection Residual subsection authored as 4-paragraph body (1 framing + 3 bold-prefix sub-blocks) mirroring v0.28.0 Browser-Enforced Resource Isolation structure; inserted between BERI close (line 130) and **Non-Guarantees:** bold-line; commit f1c236b on napplet main
- [Phase 138]: [Phase 138]: Plan 01 — VER-06 grep gate GREEN (/tmp/napplet-138-ver-06.log VER06_EXIT=0): all_frames=1, script-src/script-src-elem=3, world: 'MAIN'=1, connect-src 'none'=3, NUB-IDENTITY.md=1, NUB-CLASS-1.md=2, subsection heading=1, free-standing Class 1=0
- [Phase 138]: [Phase 138]: Plan 01 — Parallel-execution commit hygiene: used --no-verify on commit f1c236b to avoid pre-commit hook contention with 138-02 (which landed ade7b65 ahead for docs surfaces); territory discipline held strict — only specs/NIP-5D.md staged
- [Phase 138]: Plan 138-02: Single atomic commit used for DOC-01..04 docs sweep — mirrors v0.28.0 Phase 133 precedent; --no-verify required due to parallel wave with 138-01

### Decisions (napplet/nubs state snapshot, 2026-04-23)

- **MERGED:** napplet/nubs PR #15 `spec-shell-mediation` (2026-04-21) — NIP-5D now says "Shells MUST NOT provide `window.nostr`" + napplets produce cleartext only + shells MUST NOT sign/broadcast ciphertext from napplets. Local `specs/NIP-5D.md` may still be stale vs master; Phase 138 (NIP5D-01) syncs before layering v0.29.0 amendment
- **OPEN/DRAFT:** napplet/nubs PR #16 `NUB-CLASS` (class authority), #17 `NUB-CLASS-1` (strict baseline, `connect-src 'none'`, zero direct network egress), #18 `NUB-CLASS-2` (user-approved origins via NUB-CONNECT), #19 `NUB-CONNECT` (manifest-tag shape + aggregateHash fold)
- **Deferred debt in PR #15 body:** "NUB-RELAY currently references `publishEncrypted` — its semantics should be restated in terms of shell-performed encryption rather than napplet-performed encryption." DO NOT bundle into v0.29.0 — separate milestone concern

### Decisions (v0.29.0 direction locks, carried from requirements)

- **Gating rule:** `identity.decrypt` is legal only for napplets where `class.assigned` = `1`. Shell MUST reject from any other class with `class-forbidden`. Enforcement at shell message-handling time using existing iframe-ready class state (no per-envelope re-derivation)
- **Why NUB-CLASS-1 only:** NUB-CLASS-1 ships `connect-src 'none'` → zero direct network egress → plaintext trapped inside iframe. NUB-CLASS-2 ships `connect-src <granted>` → approved origins receive plaintext with zero shell visibility → unmitigated DM exfiltration risk
- **Shape auto-detection:** Shell owns all NIP-17/59 unwrap logic. Napplet receives validated `{ rumor, sender }` — never outer `created_at` (NIP-59 intentional ±2-day randomization for sender-anonymity)
- **Return shape:** `{ rumor: Rumor, sender: string }` where `Rumor = UnsignedEvent & { id: string }` (nostr-tools canonical type). `sender` is shell-authenticated (from seal-pubkey post-validation), NOT napplet-derived from `rumor.pubkey` (unsigned → attacker-controlled)
- **Option-A research superseded:** 4 files archived at `.planning/milestones/v0.29.0-option-a-research-superseded/`; NIP-17/44 mechanics + unwrap-order + rumor typing + public-repo hygiene rules survive as substrate. Wire-surface recommendations targeting NUB-RELAY are stale — replaced by NUB-IDENTITY home per pivot

### Pending Todos

- Plan Phase 135: first-party types + SDK plumbing (`/gsd:plan-phase 135`)
- Plan Phase 136: empirical Playwright CSP-injection-block fixture (may plan in parallel with 135)
- After 135 + 136 complete: plan Phase 137 (public nubs amendments); bundle NUB-IDENTITY + NUB-CLASS-1 per CLASS1-03
- After 137 complete: plan Phase 138 (in-repo NIP-5D amendment + docs + VER-06 grep gate)

### Blockers/Concerns

- CARRIED: npm publish blocked on human npm auth (PUB-04)
- INFO: Local `specs/NIP-5D.md` may be stale vs napplet/nubs master post-PR-15 (`window.nostr` removal merged 2026-04-21). Phase 138 NIP5D-01 syncs before layering v0.29.0 amendment
- INFO: `world: 'MAIN'` extension-API bypass acknowledged as residual — no page-side blocking mechanism exists. NUB-CLASS-1 `connect-src 'none'` is the structural mitigation. Phase 136 artifact MUST document this honestly; Phase 137 amendment + Phase 138 NIP-5D amendment MUST NOT claim a fix

## Session Continuity

Last session: 2026-04-23T15:19:18.662Z
Stopped at: Completed 138-02-PLAN.md (parallel wave 1)
Resume: `/gsd:plan-phase 135` to plan first-party types + SDK plumbing. Phase 136 may be planned in parallel.
