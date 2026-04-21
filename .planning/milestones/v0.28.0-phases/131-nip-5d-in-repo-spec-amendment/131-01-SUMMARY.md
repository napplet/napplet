---
phase: 131-nip-5d-in-repo-spec-amendment
plan: 01
subsystem: spec
tags: [nip-5d, csp, security, browser-isolation, nub-resource]

# Dependency graph
requires:
  - phase: 130-vite-plugin-strict-csp
    provides: perm:strict-csp capability identifier locked; vite-plugin strict CSP shipped
  - phase: 126-resource-nub-scaffold
    provides: resource NUB wire envelope contract locked; NUB-RESOURCE message catalog defined
provides:
  - NIP-5D Security Considerations amended with Browser-Enforced Resource Isolation subsection
  - perm:strict-csp capability identifier documented in public spec
  - NUB-RESOURCE cross-referenced by name in public spec
  - sandbox="allow-scripts" reaffirmed with allow-same-origin prohibition reasoning
affects:
  - 132-cross-repo-nubs-prs
  - 133-documentation-demo-coordination
  - 134-verification-milestone-close

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Public spec amendments cross-reference cross-repo NUBs by registry name only (no URL, no @napplet/* package)"
    - "Capability identifiers (perm:*) named in NIP-5D spec text match the runtime shell.supports() string exactly"

key-files:
  created: []
  modified:
    - specs/NIP-5D.md

key-decisions:
  - "Browser-Enforced Resource Isolation chosen as subsection heading (per CONTEXT discretion)"
  - "Strict CSP normative level: SHOULD (shells waive in permissive dev environments)"
  - "Minimal CSP meta example included (per CONTEXT recommendation: YES, one example)"
  - "NUB-RESOURCE referenced as 'napplet/nubs registry NUB-RESOURCE specification' — no URL since Phase 132 drafts it"
  - "Subsection placed between storage/ACL paragraph and Non-Guarantees (per plan anchor points)"

patterns-established:
  - "4-space indented code block for HTML/code examples (matches existing sandbox example at line 31)"
  - "Cross-repo NUB specs referenced by name only in NIP-5D — URL added only after spec exists"

requirements-completed: [SPEC-01]

# Metrics
duration: 10min
completed: 2026-04-20
---

# Phase 131 Plan 01: NIP-5D In-Repo Spec Amendment Summary

**NIP-5D Security Considerations amended with `### Browser-Enforced Resource Isolation` subsection documenting strict-CSP SHOULD posture, `perm:strict-csp` capability identifier, NUB-RESOURCE cross-reference, and `allow-same-origin` prohibition reasoning**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-04-20T19:41:52Z
- **Completed:** 2026-04-20
- **Tasks:** 2
- **Files modified:** 1 (specs/NIP-5D.md — additions only)

## Accomplishments

- Added `### Browser-Enforced Resource Isolation` subsection inside `## Security Considerations` (17 insertions, zero deletions)
- Documented strict-CSP SHOULD posture with minimal meta delivery example (4-space indented, matches spec convention)
- Named `perm:strict-csp` capability identifier and `window.napplet.shell.supports('perm:strict-csp')` usage verbatim
- Cross-referenced NUB-RESOURCE by name as "the napplet/nubs registry NUB-RESOURCE specification" (no URL, no @napplet/* leak)
- Reaffirmed `sandbox="allow-scripts"` with explicit service-worker bypass reasoning for `allow-same-origin` prohibition
- Composed the three isolation mechanisms: strict CSP + resource NUB canonical fetch path + opaque-origin sandbox
- All hygiene checks pass: zero @napplet/, zero kehto, zero hyprgate in specs/NIP-5D.md
- Workspace `pnpm -r type-check` exits 0 across all 14 packages (no source touched; DEF-125-01 stays closed)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Browser-Enforced Resource Isolation subsection** - `13fae17` (feat)
2. **Task 2: Workspace hygiene check + write SUMMARY** - _(this metadata commit)_

**Plan metadata:** _(final commit — includes this SUMMARY, STATE.md, ROADMAP.md)_

## Files Created/Modified

- `specs/NIP-5D.md` — 17 insertions only; new `### Browser-Enforced Resource Isolation` subsection between storage/ACL paragraph and `**Non-Guarantees:**` inside `## Security Considerations`

## Decisions Made

- **Heading text:** "Browser-Enforced Resource Isolation" — per CONTEXT discretion; captures both the mechanism (browser-level) and the concept (enforcement vs ambient trust)
- **Normative level:** SHOULD throughout new subsection — matches CONTEXT-locked decision; permissive dev shells may waive
- **CSP example:** Minimal meta tag delivery included (per CONTEXT recommendation YES); uses 4-space indentation to match existing spec convention at line 31
- **NUB-RESOURCE reference:** By name only ("napplet/nubs registry NUB-RESOURCE specification") — no URL because Phase 132 drafts the actual spec

## Deviations from Plan

None — plan executed exactly as written. All 12 acceptance criteria satisfied. Subsection text matches the plan verbatim. No other section of specs/NIP-5D.md was modified.

## Issues Encountered

None. Baseline hygiene was clean (zero pre-existing @napplet/, kehto, hyprgate matches). Edit landed cleanly in a single operation.

## Hygiene Verification (Post-Task 1, Post-Task 2)

All 9 grep checks pass:

1. `grep -c "### Browser-Enforced Resource Isolation" specs/NIP-5D.md` = 1
2. `grep -q "perm:strict-csp" specs/NIP-5D.md` = PASS
3. `grep -q "NUB-RESOURCE" specs/NIP-5D.md` = PASS
4. `grep -q 'sandbox="allow-scripts"' specs/NIP-5D.md` = PASS
5. `grep -E -q "allow-same-origin.*MUST NOT|MUST NOT.*allow-same-origin" specs/NIP-5D.md` = PASS
6. `grep -q "SHOULD" specs/NIP-5D.md` = PASS
7. `grep -c "@napplet/" specs/NIP-5D.md` = 0
8. `grep -c "kehto" specs/NIP-5D.md` = 0
9. `grep -c "hyprgate" specs/NIP-5D.md` = 0

Workspace: `pnpm -r type-check` exit 0 across all 14 packages.

## Requirement Closed

**SPEC-01** — NIP-5D Security Considerations amended with Browser-Enforced Resource Isolation subsection. Subsection states strict CSP enforcement is a SHOULD posture, names `perm:strict-csp`, cross-references NUB-RESOURCE by name, and reaffirms `sandbox="allow-scripts"` with allow-same-origin prohibition reasoning.

## Forward Links

- **Phase 132** will draft the NUB-RESOURCE specification in the public napplet/nubs repo. This amendment cross-references it by name only, deliberately ahead of its drafting — the cross-reference is intentionally forward-looking.
- **Phase 133** documentation sweep will reference this amendment as the canonical in-repo security posture statement.
- **Phase 134** milestone verification will confirm SPEC-01 closure as part of the v0.28.0 gate.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- SPEC-01 closed; Phase 131 complete
- Phase 132 (Cross-Repo Nubs PRs) is the next phase in the dependency chain after 126; NUB-RESOURCE cross-reference is now established in NIP-5D
- Phase 133 (Documentation + Demo Coordination) can reference this amendment
- Phase 134 (Verification & Milestone Close) can verify SPEC-01 as closed

---
*Phase: 131-nip-5d-in-repo-spec-amendment*
*Completed: 2026-04-20*
