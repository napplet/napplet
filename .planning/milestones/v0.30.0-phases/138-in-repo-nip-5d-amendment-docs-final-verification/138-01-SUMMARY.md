---
phase: 138-in-repo-nip-5d-amendment-docs-final-verification
plan: 01
subsystem: spec
tags: [nip-5d, security-considerations, nip-07, csp, class-gated-decrypt, nub-identity, nub-class-1, v0.29.0, spec-amendment]

# Dependency graph
requires:
  - phase: 135-first-party-types-sdk-plumbing
    provides: Shipped first-party identity.decrypt surface (@napplet/core + @napplet/nub/identity + @napplet/sdk) — the spec-legal receive-side decrypt path cited in paragraph 4 of the new subsection
  - phase: 136-empirical-csp-injection-block-verification
    provides: Empirical Chromium 144+ observation `violatedDirective: "script-src-elem"` (captured at /tmp/napplet-136-injection-block.log) + `world: 'MAIN'` residual honest-framing — cited verbatim by paragraph 2 + paragraph 3 of the new subsection
  - phase: 137-public-napplet-nubs-amendments-nub-identity-nub-class-1-bundled
    provides: Authored NUB-IDENTITY.md + NUB-CLASS-1.md amendments on ~/Develop/nubs nub-identity-decrypt branch — the 2 spec filenames cited by paragraph 4 via filename-citation discipline
provides:
  - specs/NIP-5D.md v0.29.0 amendment: new `### NIP-07 Extension Injection Residual` subsection under `## Security Considerations` (lines 132-140)
  - Filename citations of `NUB-IDENTITY.md` + `NUB-CLASS-1.md` in the in-repo NIP-5D reference copy
  - VER-06 grep-gate evidence at /tmp/napplet-138-ver-06.log (VER06_EXIT=0, all 6 required literals present, zero free-standing Class 1 phrases)
  - NIP5D-01 superset-verification evidence at /tmp/napplet-138-nip5d-sync-check.log (SUPERSET_OK=1; local confirmed AHEAD of napplet/nubs master SPEC.md post-PR-15)
  - Independent in-repo commit f1c236b on napplet main (NOT bundled into any nub-* branch) — satisfies NIP5D-04 spec-branch-hygiene gate
affects: [138-02-docs-surfaces (parallel; unrelated files), milestone-audit-v0.29.0, milestone-close-v0.29.0]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - spec-amendment via surgical insertion between existing subsection + bold-line anchor (pattern reused from v0.28.0 Phase 133 Browser-Enforced Resource Isolation addition)
    - filename-citation discipline applied to in-repo spec text (NUB-CLASS §Citation discipline)
    - evidence logs in /tmp per AGENTS.md no-home-pollution rule; integer-safe grep count helper borrowed from Phase 137 (head -n1 | tr -d '[:space:]')
    - spec edits land on napplet master as independent in-repo commit; NOT bundled into cross-repo Phase 137 nubs PR branch (feedback_spec_branch_hygiene PRINCIPLE)

key-files:
  created: []
  modified:
    - specs/NIP-5D.md (added lines 132-140: new ### NIP-07 Extension Injection Residual subsection — 5 paragraphs: 1 framing + 3 bold-prefix sub-blocks + Non-Guarantees unchanged)

key-decisions:
  - "[Phase 138]: Plan 01 — NIP5D-01 resolved as verification-only (no backport); local specs/NIP-5D.md confirmed strict superset of napplet/nubs master SPEC.md post-PR-15 (SUPERSET_OK=1 on all 5 required semantics: window.nostr removal, cleartext-only, no-sign-ciphertext, Browser-Enforced Resource Isolation subsection, perm:strict-csp capability)"
  - "[Phase 138]: Plan 01 — NIP-07 Extension Injection Residual subsection authored as 4-paragraph body (1 opening framing + 3 bold-prefix sub-blocks) mirroring v0.28.0 Browser-Enforced Resource Isolation structure; inserted between existing BERI subsection (line 130 close) and **Non-Guarantees:** bold-line (now at line 142); ## References heading unmodified at line 144"
  - "[Phase 138]: Plan 01 — Filename citations held strict: NUB-IDENTITY.md count=1, NUB-CLASS-1.md count=2 across the 9 added lines; zero free-standing 'Class 1' phrase (only 'class: 1' inside backticks — a TypeScript-literal reference, not a class abstraction; 'NUB-CLASS-1' appears only as spec ID)"
  - "[Phase 138]: Plan 01 — Empirical substrate citation honored: paragraph 2 names Chromium 144+ variant script-src-elem as the element-level sub-directive with parent script-src as fallback for older browsers (per 136-PHASE-NOTES §1 language: 'begins with script-src' directive-family match, not exact-string pin)"
  - "[Phase 138]: Plan 01 — Spec-branch-hygiene (NIP5D-04) satisfied: single commit f1c236b on napplet main, touches only specs/NIP-5D.md; ~/Develop/nubs working tree untouched (nub-identity-decrypt HEAD unchanged at 45cdf39); no push executed"
  - "[Phase 138]: Plan 01 — Parallel-execution coexistence: committed with --no-verify to avoid pre-commit hook contention with 138-02 (138-02 landed commit ade7b65 for docs surfaces just ahead of f1c236b); territory discipline held — this plan touched ONLY specs/NIP-5D.md, 138-02 touched ONLY README.md + packages/nub/README.md + packages/sdk/README.md + skills/build-napplet/SKILL.md"

patterns-established:
  - "Spec-amendment insertion anchor: a surrounding bold-prefix line (e.g., **Non-Guarantees:**) + a ## heading (e.g., ## References) provide a stable two-anchor insertion point that holds under Edit tool's exact-string match discipline across multi-paragraph insertions"
  - "VER-06 grep-gate structure: 6 required literals + 1 heading presence check + 1 negative-check (free-standing abstract phrase absent) composes a complete amendment-shape gate; evidence at /tmp/napplet-138-ver-06.log with VER06_EXIT=0 stamp — reusable template for future Security Considerations amendments"
  - "Integer-safe grep count helper pattern (head -n1 | tr -d '[:space:]') applied preventively; borrowed from Phase 137 §3 Deviations where the grep -c || echo 0 bug surfaced; Phase 138 inherited the fix without re-encountering the bug"

requirements-completed: [NIP5D-01, NIP5D-02, NIP5D-03, NIP5D-04, VER-06]

# Metrics
duration: 2min
completed: 2026-04-23
---

# Phase 138 Plan 01: In-Repo NIP-5D Amendment — NIP-07 Extension Injection Residual Summary

**specs/NIP-5D.md gains a 9-line v0.29.0 `### NIP-07 Extension Injection Residual` subsection documenting the `all_frames: true` injection vector, nonce-based `script-src` legacy-injection mitigation (Chromium 144+ `script-src-elem`), honest `world: 'MAIN'` residual acknowledgment, and `connect-src 'none'` structural mitigation pointing at `identity.decrypt` on NUB-IDENTITY as the spec-legal receive-side decrypt path for NUB-CLASS-1 napplets.**

## Performance

- **Duration:** ~2 min (152s)
- **Started:** 2026-04-23T15:13:43Z
- **Completed:** 2026-04-23T15:16:15Z
- **Tasks:** 4 (Task 1 verify-only, Task 2 edit, Task 3 grep-gate, Task 4 single-commit bundle)
- **Files modified:** 1 (specs/NIP-5D.md)

## Accomplishments

- **NIP5D-01 satisfied without backport** — SUPERSET_OK=1 stamped at /tmp/napplet-138-nip5d-sync-check.log; all 5 required post-PR-15 semantics present in local (Shells MUST NOT provide window.nostr, Napplets produce cleartext only, Shells MUST NOT sign or broadcast, ### Browser-Enforced Resource Isolation, perm:strict-csp)
- **NIP5D-02 subsection authored** — 4-paragraph body added under `## Security Considerations` between `### Browser-Enforced Resource Isolation` and `**Non-Guarantees:**`: (1) framing — NIP-07 extensions inject via all_frames: true; (2) legacy-injection mitigation — nonce-based script-src blocks <script>-tag injection, Chromium 144+ observed as script-src-elem; (3) world: 'MAIN' residual — honestly acknowledged, no page-side fix; (4) structural mitigation — connect-src 'none' traps plaintext, identity.decrypt on NUB-IDENTITY is spec-legal path gated to class: 1 napplets per NUB-CLASS-1.md
- **NIP5D-03 filename-citation discipline held** — NUB-IDENTITY.md cited once, NUB-CLASS-1.md cited twice; zero free-standing "Class 1" prose abstractions (only `class: 1` inside backticks as a TypeScript-literal reference, and `NUB-CLASS-1` as spec ID)
- **NIP5D-04 spec-branch-hygiene gate satisfied** — independent commit f1c236b on napplet main; ~/Develop/nubs working tree untouched; no push executed; commit body has zero references to the cross-repo Phase 137 PR, no references to ~/Develop/nubs, no references to any nub-* branch name
- **VER-06 grep gate GREEN** — /tmp/napplet-138-ver-06.log stamped VER06_EXIT=0; counts: all_frames=1, script-src/script-src-elem=3, world: 'MAIN'=1, connect-src 'none'=3, NUB-IDENTITY.md=1, NUB-CLASS-1.md=2, subsection heading=1, free-standing Class 1=0

## Task Commits

Task 1, Task 2, and Task 3 did NOT commit per plan structure — the plan explicitly defers the spec-edit commit to Task 4, which bundles Tasks 1-3's output into a single atomic commit.

- **Task 1: NIP5D-01 superset verification** — no commit (verification-only; no source change). Evidence log at /tmp/napplet-138-nip5d-sync-check.log with SUPERSET_OK=1 stamp
- **Task 2: NIP5D-02 + NIP5D-03 subsection authoring** — no commit (edit-in-working-tree only; Task 4 bundles the commit). specs/NIP-5D.md edited in place (125-line file → 145-line file; +10 insertions)
- **Task 3: VER-06 grep gate** — no commit (evidence-capture only). Evidence log at /tmp/napplet-138-ver-06.log with VER06_EXIT=0 stamp
- **Task 4: NIP5D-04 commit** — `f1c236b` (spec) — `spec(NIP-5D): add NIP-07 Extension Injection Residual subsection` — 1 file changed, 10 insertions, 0 deletions

## Files Created/Modified

- `specs/NIP-5D.md` — lines 132-140 added: new `### NIP-07 Extension Injection Residual` H3 subsection under `## Security Considerations` — 1 opening framing paragraph + 3 bold-prefix sub-blocks (Legacy `<script>`-tag injection; `world: 'MAIN'` extension-API residual; Structural mitigation and the spec-legal alternative). Existing `### Browser-Enforced Resource Isolation` subsection (lines 115-130) unmodified. Existing `**Non-Guarantees:**` bold-line (now at line 142) unmodified. Existing `## References` heading (now at line 144) unmodified.

## Evidence Logs (not tracked in repo — /tmp only per AGENTS.md)

- `/tmp/napplet-138-nip5d-sync-check.log` — NIP5D-01 superset-verification evidence (SUPERSET_OK=1)
- `/tmp/napplet-138-ver-06.log` — VER-06 grep-gate evidence (VER06_EXIT=0, 6 literals PASS, heading PASS, free-standing Class 1 = 0)
- `/tmp/napplet-138-01-start.txt` — plan start-time marker (duration calculation helper)

## Decisions Made

1. **Parallel-execution commit hygiene: --no-verify used.** Per the parallel_execution notice in the executor prompt, Plan 02 was simultaneously editing README.md, packages/nub/README.md, packages/sdk/README.md, and skills/build-napplet/SKILL.md. Committing with the pre-commit hook active risks hook-contention / stale index state across the two agents. `git commit --no-verify` sidesteps this cleanly; the spec-content edit needs no pre-commit linting (it's pure Markdown prose).
2. **Territory discipline held strict.** Only `specs/NIP-5D.md` was staged (via explicit `git add specs/NIP-5D.md`); `git status` before commit showed `M ` in first column for NIP-5D only and `M` (working-tree-only) for Plan 02's 4 files. No accidental cross-plan bleed.
3. **Filename-citation discipline resolved "class: 1" ambiguity.** The backtick expression `class: 1` is a TypeScript-literal reference (the `class` field of a ClassAssignment record has value `1`), not a prose-abstraction. The `NUB-CLASS-1` token is the spec ID, not an abstract class. Both are correct under filename-citation discipline; the VER-06 negative check confirmed zero free-standing `Class 1` prose matches.
4. **Empirical directive-family framing.** Paragraph 2 names Chromium 144+ `script-src-elem` as the OBSERVED variant and parent `script-src` as the family match, NOT pinning the exact sub-directive string as normative. Matches the 136-PHASE-NOTES §5 handoff language: "amendment should say 'shells SHOULD observe violatedDirective beginning with script-src' rather than pinning the exact sub-directive".

## Deviations from Plan

None — plan executed exactly as written.

The plan's prose was used verbatim (the 4-paragraph subsection body in Task 2's `<action>` block has the exact authoritative substance required). No deviations from the planner's substance decisions; no Rule 1-4 auto-fixes were needed. The only minor adaptation was using `--no-verify` on the Task 4 commit per the parallel_execution notice — which is a prompt-level override, not a deviation from the plan's task semantics.

## Issues Encountered

None. The pre-Phase-137 precedent (integer-parse grep-bug fixed there) prevented a repeat encounter here — the Task 3 VER-06 script used `head -n1 | tr -d '[:space:]'` from the start, and the gate was clean on first run.

## User Setup Required

None — no external service configuration required. This plan is pure spec-authoring work on in-repo Markdown.

## Next Phase Readiness

### Unblocked

- **Phase 138 Plan 02 (parallel):** 138-02 has completed ahead of this plan (commit ade7b65); both plans' commits now live on napplet main. Phase 138 is fully executed.
- **`/gsd:audit-milestone v0.29.0`:** All 5 Phase 138 Plan 01 requirements closed (NIP5D-01, NIP5D-02, NIP5D-03, NIP5D-04, VER-06). Combined with 138-02's DOC-01..04, the v0.29.0 milestone is ready for milestone-close audit per 138-CONTEXT.md §deferred.

### Blocking Concerns

None. The amendment commit stays on napplet main; no push needed (push / PR-open / merge are autonomous-workflow lifecycle actions gated separately).

### Cross-Repo State

- `~/Develop/nubs` working tree: clean
- `~/Develop/nubs` branch state: `nub-identity-decrypt` at HEAD 45cdf39 (unchanged from Phase 137 final state); master unchanged
- No nubs-repo commit or push occurred in Phase 138 — Phase 137 territory boundary held

## Self-Check: PASSED

File existence checks:
- `/home/sandwich/Develop/napplet/specs/NIP-5D.md` — FOUND (145 lines; new subsection lines 132-140)
- `/tmp/napplet-138-nip5d-sync-check.log` — FOUND (SUPERSET_OK=1)
- `/tmp/napplet-138-ver-06.log` — FOUND (VER06_EXIT=0)

Commit existence check:
- `f1c236b` (spec(NIP-5D): add NIP-07 Extension Injection Residual subsection) — FOUND in `git log` on napplet main

Structural check:
- specs/NIP-5D.md line 101 = `## Security Considerations` (unchanged)
- specs/NIP-5D.md line 115 = `### Browser-Enforced Resource Isolation` (unchanged)
- specs/NIP-5D.md line 132 = `### NIP-07 Extension Injection Residual` (new)
- specs/NIP-5D.md line 142 = `**Non-Guarantees:** ...` (unchanged position-shifted)
- specs/NIP-5D.md line 144 = `## References` (unchanged position-shifted)

Grep-gate check:
- all_frames present (count=1)
- script-src / script-src-elem present (count=3)
- world: 'MAIN' present (count=1)
- connect-src 'none' present (count=3)
- NUB-IDENTITY.md present (count=1)
- NUB-CLASS-1.md present (count=2)
- Free-standing abstract "Class 1" = 0 (expected)

Territory check:
- HEAD commit touches 1 file: specs/NIP-5D.md (verified)
- ~/Develop/nubs working tree clean (verified)
- No packages/*/src changes in HEAD (verified)

---
*Phase: 138-in-repo-nip-5d-amendment-docs-final-verification*
*Plan: 01*
*Completed: 2026-04-23*
