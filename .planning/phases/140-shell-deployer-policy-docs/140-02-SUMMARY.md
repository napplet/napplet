---
phase: 140-shell-deployer-policy-docs
plan: 02
subsystem: specs
tags: [shell-policy, nub-class, nub-connect, csp, consent-ux, deployer-checklist]

requires:
  - phase: 135-cross-repo-spec-work
    provides: NUB-CLASS + NUB-CLASS-1 + NUB-CLASS-2 + NUB-CONNECT normative drafts
  - phase: 140-shell-deployer-policy-docs (plan 01)
    provides: SHELL-CONNECT-POLICY.md sibling structural template + cross-ref target
provides:
  - specs/SHELL-CLASS-POLICY.md — non-normative shell-deployer checklist for NUB-CLASS
  - Cross-NUB-invariant scenario table (7 rows) pinning class/connect.granted coherence
  - Revocation UX Option A (reload) vs Option B (refuse-to-serve) enumeration
  - Audit checklist with 14 sign-off checkboxes covering every POLICY-11..15 MUST
affects: [141-documentation-sweep, 142-verification-and-close, downstream-shell-repo]

tech-stack:
  added: []
  patterns:
    - "Mirror SHELL-RESOURCE-POLICY.md shape for every new SHELL-*-POLICY.md doc (status banner → why-this-exists → per-policy H2s → audit checklist → references)"
    - "Every MUST in prose gets a matching checkbox in the audit section; POLICY-N IDs cited on each checkbox"
    - "Cite class track members by file name (NUB-CLASS-2.md) per NUB-CLASS citation convention; abstract phrasing 'class 2' only in prose where binding to a spec file is unnecessary"
    - "Zero-grep hygiene: specs/ stays citation-safe for the public napplet/nubs repo (no @napplet/*, no kehto, no hyprgate)"

key-files:
  created:
    - specs/SHELL-CLASS-POLICY.md
  modified: []

key-decisions:
  - "Mirrored SHELL-RESOURCE-POLICY.md + SHELL-CONNECT-POLICY.md structural shape exactly: blockquote banner → Status → Why this exists → 4 policy sections → Audit Checklist → References (8 H2 sections total)"
  - "Expanded plan's prescribed audit checklist from 13 items to 14 by splitting the 'silence is not the same signal' MUST into its own checkbox — it's a distinct conformance gate separate from the at-most-one envelope rule, and deployers benefit from it being a discrete sign-off item"
  - "Revocation UX section enumerates both Option A (reload, recommended) and Option B (refuse-to-serve) as conformant outcomes, per plan spec; cross-refs SHELL-CONNECT-POLICY.md for the user-facing 'how to revoke' UX question so the two docs compose without duplication"

patterns-established:
  - "Cross-NUB invariant as a scenario table: enumerates every combination of (NUB-advertised × manifest-tags × user-decision) with the required (CSP + envelope + runtime-state) output — pins the class/granted coherence against silent disagreement"
  - "Revocation UX as a two-option pick with explicit cross-reference to the sibling deployer-policy doc that owns the user-facing revocation affordance"

requirements-completed: [POLICY-11, POLICY-12, POLICY-13, POLICY-14, POLICY-15, POLICY-16]

duration: 12min
completed: 2026-04-21
---

# Phase 140 Plan 02: SHELL-CLASS-POLICY.md Summary

**Non-normative shell-deployer checklist for NUB-CLASS surfacing class-determination authority, wire timing, cross-NUB invariant (with 7-row scenario table), and revocation UX as sign-offable MUSTs — parallel companion to SHELL-CONNECT-POLICY.md.**

## Performance

- **Duration:** ~12 min
- **Completed:** 2026-04-21T17:33:12Z
- **Tasks:** 2 (authoring + audit/commit)
- **Files created:** 1 (specs/SHELL-CLASS-POLICY.md, 114 lines)

## Accomplishments

- Authored `specs/SHELL-CLASS-POLICY.md` (114 lines) mirroring the SHELL-RESOURCE-POLICY.md / SHELL-CONNECT-POLICY.md structural shape
- Surfaced every POLICY-11..15 MUST as both prose AND an audit checkbox (14 checkboxes total)
- Encoded the cross-NUB invariant `class === 2 iff connect.granted === true` with a 7-row scenario table covering: approve, deny, no-connect-tags, shell-lacks-connect, shell-has-class-no-connect, shell-has-connect-no-class, and future class-contributing NUBs
- Documented both conformant revocation outcomes (Option A: reload with `class: 1`, recommended; Option B: refuse-to-serve until re-approval)
- Cross-referenced the sibling `SHELL-CONNECT-POLICY.md` 4 times (the revocation UX section, the cross-NUB invariant section, the audit checklist line, and the References section) so shells implementing both NUBs have a clear navigation path
- Kept zero-grep hygiene clean: no `@napplet/*`, no `kehto`, no `hyprgate`

## H2 Section Inventory

8 H2 sections (within the plan's `[7, 9]` range):
1. `## Status`
2. `## Why this exists`
3. `## Class-Determination Authority (MUST)`
4. `## Wire Timing (MUST)`
5. `## Cross-NUB Invariant (MUST — Shell Responsibility)`
6. `## Revocation UX for Class-2 Napplets (MUST)`
7. `## Audit Checklist (one-page summary)`
8. `## References`

## Task Commits

1. **Task 1: Author specs/SHELL-CLASS-POLICY.md with all 6 required H2 sections + audit checklist + references** — `d675a5c` (docs)
2. **Task 2: Final audit + commit** — (included in `d675a5c`; the file was audited before commit so a single atomic commit landed the authored file after every grep check passed)

**Plan metadata commit:** _(created at end of execution with SUMMARY.md + STATE.md + ROADMAP.md + REQUIREMENTS.md)_

## Grep Audit Results (every POLICY-N mapped)

All checks executed against the committed `specs/SHELL-CLASS-POLICY.md`. All PASSED.

| Check | Requirement | Threshold | Actual | Result |
|-------|-------------|-----------|--------|--------|
| `wc -l` | structural | ≥ 110 | 114 | PASS |
| `grep -c "^## "` | structural | [7, 9] | 8 | PASS |
| `grep -qi "non-normative"` | POLICY-11 | ≥ 1 | present | PASS |
| `grep -c "NUB-CLASS"` | POLICY-11 | ≥ 4 | 19 | PASS |
| `grep -qi "sole authority"` | POLICY-12 | ≥ 1 | present | PASS |
| `grep -c "class.assigned"` | POLICY-12 | ≥ 6 | 20 | PASS |
| `grep -qiE "at most one\|at-most-one"` | POLICY-12 | ≥ 1 | present | PASS |
| `grep -ciE "mid.session\|mid-session"` | POLICY-12 | ≥ 2 | 5 | PASS |
| `grep -ciE "iframe ready\|shim bootstrap\|bootstrap complete"` | POLICY-13 | ≥ 2 | 4 | PASS |
| `grep -c "connect.granted"` | POLICY-14 | ≥ 4 | 11 | PASS |
| `grep -cE "class === 2\|class: 2"` | POLICY-14 | ≥ 3 | 7 | PASS |
| `grep -c "^|"` (scenario table rows) | POLICY-14 | ≥ 7 | 9 | PASS |
| `grep -qi "iff"` | POLICY-14 | ≥ 1 | present | PASS |
| `grep -qiE "reload"` | POLICY-15 | ≥ 1 | present | PASS |
| `grep -qiE "refuse.to.serve\|refuse-to-serve"` | POLICY-15 | ≥ 1 | present | PASS |
| `grep -ci "option a\|option b"` | POLICY-15 | ≥ 2 | 3 | PASS |
| `grep -c "SHELL-CONNECT-POLICY"` | POLICY-15 | ≥ 2 | 4 | PASS |
| `grep -cE "^- \[ \]"` (checklist) | POLICY-11..15 | ≥ 10 | 14 | PASS |
| `grep -qiE "^## audit checklist"` | structural | = 1 | present | PASS |
| `! grep -qE "@napplet/\|kehto\|hyprgate"` | POLICY-16 | 0 matches | 0 matches | PASS |
| `grep -q "NUB-CLASS-1"` | references | ≥ 1 | present | PASS |
| `grep -q "NUB-CLASS-2"` | references | ≥ 1 | present | PASS |
| `grep -c "NUB-CONNECT"` | references | ≥ 2 | 7 | PASS |
| `grep -q "SHELL-RESOURCE-POLICY"` | references | ≥ 1 | present | PASS |
| `grep -q "NIP-5D"` | references | ≥ 1 | present | PASS |

**Zero-grep hygiene:** CLEAN. `grep -E '@napplet/|kehto|hyprgate' specs/SHELL-CLASS-POLICY.md` returns 0 matches.

## Files Created

- `specs/SHELL-CLASS-POLICY.md` — Non-normative shell-deployer checklist for NUB-CLASS. Mirrors SHELL-RESOURCE-POLICY.md + SHELL-CONNECT-POLICY.md structure. Covers class-determination authority, wire timing (shim-ready-signal coupling), cross-NUB invariant with 7-row scenario table, and revocation UX (Option A reload / Option B refuse-to-serve). 14 sign-off checkboxes. Cites NUB-CLASS as normative source, NUB-CLASS-1.md and NUB-CLASS-2.md as concrete track members, NUB-CONNECT as the class-contributing NUB, SHELL-CONNECT-POLICY.md as sibling deployer doc.

## Decisions Made

- **Expanded audit checklist from 13 plan-prescribed items to 14**: Split the "silence is not the same signal" MUST from POLICY-12 into its own checkbox — deployers benefit from it being a discrete sign-off item rather than embedded inside a broader "Shell is sole authority" check. It remains a POLICY-12 item; no new requirements introduced.
- **Revocation UX section cross-refs SHELL-CONNECT-POLICY.md for the "how does the user revoke" UX question rather than duplicating that content here**: This document owns the "what happens to the running napplet on revocation" enforcement question; SHELL-CONNECT-POLICY owns the "expose an affordance, move to DENIED, take effect at next load" UX question. The two compose without overlap.
- **Scenario table includes two implementation-gap rows (shell-has-class-no-connect, shell-has-connect-no-class) plus a future-extensibility row** — the plan prescribed 7 rows total, and the gap rows are where cross-signal disagreement is most likely to sneak in during partial-NUB deployments. The future row documents that the scenario table is extensible as the class track grows.

## Deviations from Plan

None - plan executed exactly as written. The audit bundle Task 2 prescribed passed on first run after authoring.

The decision to split one audit checkbox into two (14 items vs the plan's enumerated 13) is a prose-level expansion within Claude's discretion per the `<action>` block ("prose is Claude's discretion but MUST surface every MUST item listed"), not a plan deviation.

## Issues Encountered

None.

## User Setup Required

None — spec authoring only.

## Next Phase Readiness

- Phase 140 policy-docs work complete: both SHELL-CONNECT-POLICY.md (plan 01) and SHELL-CLASS-POLICY.md (plan 02) are in specs/
- POLICY-01..16 all closed; phase 140 is ready to mark complete in ROADMAP.md
- Phase 141 (documentation sweep) can now cite both deployer-policy docs from README.md / SKILL.md
- Phase 142 (verification) has the audit checklists to drive conformance fixtures against

---
*Phase: 140-shell-deployer-policy-docs*
*Plan: 02*
*Completed: 2026-04-21*

## Self-Check: PASSED

- specs/SHELL-CLASS-POLICY.md — FOUND
- Commit d675a5c — FOUND
- Zero-grep hygiene (`@napplet/|kehto|hyprgate`) — 0 matches, CLEAN
- H2 count: 8 (within [7, 9])
- Line count: 114 (≥ 110)
- Audit checkboxes: 14 (≥ 10)
