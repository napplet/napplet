---
phase: 140-shell-deployer-policy-docs
plan: 01
subsystem: infra
tags: [specs, csp, nub-connect, nub-class-2, deployer-policy]

requires:
  - phase: 135-cross-repo-spec-work
    provides: NUB-CONNECT draft + NUB-CLASS-1.md + NUB-CLASS-2.md normative sources
  - phase: 138-vite-plugin-additive-half
    provides: build-time connect option + cleartext warning path referenced by the policy doc

provides:
  - specs/SHELL-CONNECT-POLICY.md — non-normative shell-deployer checklist for NUB-CONNECT
  - Parser-based residual-meta-CSP scan recipe with a 5-fixture conformance bundle
  - Audit checklist with 16 deployer sign-off boxes covering POLICY-02..09
  - Public-repo-citable doc (zero-grep hygiene clean)

affects:
  - phase-141-documentation-sweep (README + SKILL.md cross-references to this doc)
  - phase-142-verification (VER-07 residual-meta-CSP test references the 5-fixture bundle)
  - downstream shell implementers (primary consumer of the checklist)

tech-stack:
  added: []
  patterns:
    - "Per-NUB SHELL-*-POLICY.md non-normative companion (parallel to SHELL-RESOURCE-POLICY.md)"
    - "Parser-based HTML scanning for shell-side author-HTML validation (vs regex at build-time)"
    - "5-fixture conformance bundle pattern for scanner correctness (4 reject + 1 CDATA negative)"

key-files:
  created:
    - specs/SHELL-CONNECT-POLICY.md
  modified: []

key-decisions:
  - "Structurally mirror SHELL-RESOURCE-POLICY.md exactly: blockquote banner, Status, Why this exists, per-policy MUST sections, Audit Checklist, References — ATX headings throughout"
  - "Cite Class-2 posture details (CSP shape, consent MUSTs, revocation, residual-meta-CSP refuse-to-serve) back to NUB-CLASS-2.md rather than redefining; cite NUB-CLASS-1.md for the residual-meta-CSP harmlessness distinction"
  - "Specify parse5/htmlparser2 (or equivalent WHATWG-compliant parser) as the required scanner substrate — regex is explicitly disallowed for shell-side scanning"
  - "Fixture bundle includes one negative case (CDATA) so accepting-all-cases trivially or rejecting-all-cases trivially both fail conformance"
  - "Consent UX language section includes an exemplar phrasing ('This napplet can talk with foo.com however it wants') but marks it as non-normative — semantics are load-bearing, exact copy is not"

patterns-established:
  - "SHELL-*-POLICY.md deployer-checklist pattern now has two exemplars (RESOURCE + CONNECT) that future NUBs with shell-visible posture requirements should follow"
  - "Checklist items carry explicit POLICY-NN trailer for traceability back to REQUIREMENTS.md"
  - "N/A items section explicitly enumerates what the doc does NOT require, with per-item rationale tracing back to the sibling NUB that does require it"

requirements-completed: [POLICY-01, POLICY-02, POLICY-03, POLICY-04, POLICY-05, POLICY-06, POLICY-07, POLICY-08, POLICY-09, POLICY-10]

duration: 14min
completed: 2026-04-21
---

# Phase 140 Plan 01: SHELL-CONNECT-POLICY.md Authoring Summary

**Non-normative shell-deployer checklist for NUB-CONNECT (209 lines, 12 H2 sections, parser-based residual-meta-CSP scan + 5-fixture conformance bundle, 16-box deployer audit checklist)**

## Performance

- **Duration:** ~14 min
- **Started:** 2026-04-21 (parallel wave 1 with plan 140-02)
- **Completed:** 2026-04-21
- **Tasks:** 2 (author + audit-and-commit, collapsed into one commit since same-file)
- **Files modified:** 1 (new file: specs/SHELL-CONNECT-POLICY.md)

## Accomplishments

- Authored `specs/SHELL-CONNECT-POLICY.md` as a non-normative, NUB-CONNECT-companion deployer checklist mirroring the shape of `specs/SHELL-RESOURCE-POLICY.md` exactly.
- Documented all 10 POLICY-NN requirements (POLICY-01..10) as both prose sections and audit-checklist sign-off boxes.
- Included a parser-based residual-meta-CSP scan recipe (parse5/htmlparser2) with a 5-fixture conformance bundle — 4 rejection fixtures (standard order, attribute reorder, comment-adjacent live meta, single-quoted case-variant) + 1 negative CDATA fixture that MUST be accepted to prove parser-not-regex implementation.
- Explicit N/A items section enumerates the four NUB-RESOURCE-only concerns (private-IP block, MIME sniffing, SVG rasterization, redirect chain limits) with per-item rationale for why NUB-CONNECT does not require them.
- Zero-grep hygiene clean: no `@napplet/*`, no `kehto`, no `hyprgate` — citation-safe for cross-reference from the public `napplet/nubs` repo.

## Task Commits

Tasks 1 (authoring) and 2 (audit-and-commit) were collapsed into a single atomic commit since both tasks operate on the same file and the audit bundle passed on the first authoring pass without requiring an amendment round:

1. **Task 1 + 2: Author + audit specs/SHELL-CONNECT-POLICY.md** — `6d9af8b` (docs)

## Files Created/Modified

- `specs/SHELL-CONNECT-POLICY.md` — new 209-line non-normative shell-deployer checklist for NUB-CONNECT; 12 H2 sections + 16-box audit checklist + References

## H2 Section Inventory

All 12 H2 sections present as required by the plan:

1. `## Status` — self-labels non-normative; cites NUB-CONNECT as normative source; points at NUB-CLASS-2.md for posture details; bridges to sibling SHELL-RESOURCE-POLICY.md
2. `## Why this exists` (POLICY-01) — silent-failure framing; points at the audit checklist
3. `## HTTP Responder Precondition (MUST)` (POLICY-02) — 4 delivery modes (direct / HTTP proxy / blob: / srcdoc=) each with per-mode pitfalls
4. `## Residual Meta-CSP Scan (MUST)` (POLICY-03) — parser-not-regex rationale + parse5 example + 5-fixture conformance bundle (4 reject + 1 CDATA negative)
5. `## Mixed-Content Reality Check (MUST)` (POLICY-04) — browser-level enforcement below CSP; localhost/127.0.0.1/[::1] secure-context exceptions
6. `## Cleartext Policy (MUST)` (POLICY-05) — `connect:scheme:http` / `connect:scheme:ws` capability advertisement; no silent strip
7. `## Grant Persistence (MUST)` (POLICY-06) — `(dTag, aggregateHash)` composite key; silent-supply-chain-upgrade threat model; strict-superset extended-key hygiene
8. `## Revocation UX (MUST)` (POLICY-07) — DENIED-not-deleted; effective-at-next-frame-creation
9. `## Consent UX Language (MUST)` (POLICY-08) — 5 semantic MUSTs + diminutive-language ban + exemplar "talk with foo.com however it wants" phrasing
10. `## Explicit N/A Items` (POLICY-09) — private-IP block / MIME sniff / SVG raster / redirect limits / size-rate caps, each with per-item rationale
11. `## Audit Checklist (one-page summary)` — 16 sign-off checkboxes
12. `## References` — NUB-CONNECT, NUB-CLASS-2.md, NUB-CLASS-1.md, NUB-CLASS.md, NUB-RESOURCE, NIP-5D, SHELL-RESOURCE-POLICY.md, WHATWG Mixed Content, WHATWG HTML Parser

## Grep Audit Results

Every POLICY-NN requirement has a corresponding grep-verifiable hit:

| REQ-ID | Check | Count | Status |
|--------|-------|-------|--------|
| POLICY-01 | `grep -i non-normative` | 1+ | PASS |
| POLICY-01 | `grep NUB-CONNECT` | 19 | PASS (>=3) |
| POLICY-02 | `grep -i "response header"` | 4+ | PASS |
| POLICY-02 | `grep -E "blob:\|srcdoc\|proxy\|direct serving"` | all present | PASS |
| POLICY-03 | `grep -i parser` | 7+ | PASS (>=2) |
| POLICY-03 | `grep -E "parse5\|htmlparser2"` | both | PASS |
| POLICY-03 | `grep http-equiv` | 9 | PASS (>=5) |
| POLICY-03 | `grep -iE "cdata\|<!\[CDATA"` | 3+ | PASS |
| POLICY-03 | `grep -iE "comment\|<!--"` | 2+ | PASS |
| POLICY-04 | `grep -iE "mixed.content"` | 5+ | PASS |
| POLICY-04 | `grep -E "localhost\|127.0.0.1"` | 4+ | PASS |
| POLICY-05 | `grep connect:scheme:http` | 3+ | PASS |
| POLICY-05 | `grep connect:scheme:ws` | 3+ | PASS |
| POLICY-05 | `grep -ci cleartext` | 14 | PASS (>=3) |
| POLICY-06 | `grep -c "(dTag, aggregateHash)"` | 8 | PASS (>=3) |
| POLICY-06 | `grep connect:origins` | 2 | PASS |
| POLICY-06 | `grep -i "silent supply"` | 2 | PASS |
| POLICY-07 | `grep -ciE "revok\|revocation"` | 9 | PASS (>=3) |
| POLICY-07 | `grep -i denied` | 3+ | PASS |
| POLICY-07 | `grep -i "not deleted"` | 1 | PASS |
| POLICY-08 | `grep -i "send AND receive"` | 2+ | PASS |
| POLICY-08 | `grep -iE "however it wants\|talk with"` | 2+ | PASS |
| POLICY-08 | `grep -iE "just\|only\|simply"` | diminutive warning present | PASS |
| POLICY-09 | `grep -iE "private.ip"` | 2+ | PASS |
| POLICY-09 | `grep -iE "mime.sniff"` | 1+ | PASS |
| POLICY-09 | `grep -iE "svg raster"` | 2+ | PASS |
| POLICY-09 | `grep -i redirect` | 2+ | PASS |
| POLICY-09 | `grep NUB-RESOURCE` | 10 | PASS (>=2) |
| POLICY-10 | `! grep -E "@napplet/\|kehto\|hyprgate"` | 0 matches | PASS |
| Structural | `grep -cE "^- \[ \]"` | 16 | PASS (>=15) |
| Structural | `grep -c "^## "` | 12 | PASS (in {12,13,14}) |
| Structural | `wc -l` | 209 | PASS (>=170, within 180-220 target band) |
| References | `grep SHELL-RESOURCE-POLICY` | 4+ | PASS |
| References | `grep NIP-5D` | 1+ | PASS |
| References | `grep NUB-CLASS-2` | 8 | PASS (>=4) |
| References | `grep NUB-CLASS-1` | 2 | PASS (>=1) |

## Zero-Grep Hygiene Confirmation

```
$ grep -E '@napplet/|kehto|hyprgate' specs/SHELL-CONNECT-POLICY.md
$ echo $?
1   # no matches → clean
```

Confirmed: the file contains zero `@napplet/*` references, zero `kehto` references, zero `hyprgate` references. The doc is citation-safe for cross-reference from the public `napplet/nubs` repo.

## Decisions Made

- **Collapsed Task 1 and Task 2 into a single commit.** The plan authored Task 2 as a distinct audit-pass-and-commit step so that if authoring produced a file with gaps, the agent could fix-in-place before committing. First-pass authoring passed every acceptance-criterion grep on the first run — no fix-in-place round was needed — so emitting two commits on the same file would have been noise. The commit message covers both tasks' scope.
- **Exemplar phrasing "This napplet can talk with foo.com however it wants" is included verbatim.** The plan flagged it as a worked-exemplar; including it gives deployers a concrete reference point for the send-AND-receive framing while the prose around it clarifies that wording is non-normative.
- **Used `--no-verify` on the commit per the parallel-execution note.** Plan 140-02 runs concurrently on a disjoint file; skipping pre-commit hooks avoided hook-contention without affecting correctness (the audit bundle ran manually and passed before commit).

## Deviations from Plan

None — plan executed exactly as written. All acceptance-criteria greps passed on first-pass authoring; the full audit bundle exits 0; file is committed; working tree clean.

## Issues Encountered

None.

## User Setup Required

None — this plan authored a spec document. No external services, no environment variables, no dashboard configuration.

## Next Phase Readiness

- **Plan 140-02** (SHELL-CLASS-POLICY.md authoring) runs in parallel on a disjoint file. No cross-plan contention expected.
- **Phase 141** (documentation sweep) can reference `specs/SHELL-CONNECT-POLICY.md` from READMEs and SKILL.md.
- **Phase 142** (verification) can consume the 5-fixture conformance bundle directly for the residual-meta-CSP integration test (VER-07).

## Self-Check: PASSED

- [x] `specs/SHELL-CONNECT-POLICY.md` exists (209 lines, 12 H2 sections)
- [x] Commit `6d9af8b` present in git log: `6d9af8b docs(140-01): add specs/SHELL-CONNECT-POLICY.md shell-deployer checklist`
- [x] Working tree clean for the created file
- [x] Zero-grep hygiene verified (0 matches for `@napplet/|kehto|hyprgate`)
- [x] All POLICY-01..10 grep checks pass

---
*Phase: 140-shell-deployer-policy-docs*
*Plan: 01*
*Completed: 2026-04-21*
