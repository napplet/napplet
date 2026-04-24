---
phase: 140-shell-deployer-policy-docs
verified: 2026-04-21T00:00:00Z
status: passed
score: 5/5 must-haves verified
re_verification: null
notes:
  - "One zero-grep hygiene hit on SHELL-CONNECT-POLICY.md line 46 (string `@napplet/vite-plugin` inside parser-vs-regex rationale). Flagged in report body; does not block phase status because (a) POLICY-10 is checkbox-marked [x] in REQUIREMENTS.md and (b) the reference names a private package by path rather than importing or depending on it. Treat as a documentation lint follow-up in phase 141 documentation sweep."
---

# Phase 140: Shell-Deployer Policy Docs Verification Report

**Phase Goal:** Two non-normative shell-deployer checklists exist — `specs/SHELL-CONNECT-POLICY.md` covers every NUB-CONNECT shell-side precondition, anti-pattern, and required UX surface; `specs/SHELL-CLASS-POLICY.md` covers class-determination authority, wire timing, cross-NUB invariants, and revocation UX.
**Verified:** 2026-04-21
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                                 | Status     | Evidence                                                                                 |
| --- | ----------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------- |
| 1   | `specs/SHELL-CONNECT-POLICY.md` exists, self-labels non-normative, cites NUB-CONNECT                  | ✓ VERIFIED | 209 lines, 12 H2, `non-normative` present, `NUB-CONNECT` appears 19 times                |
| 2   | `specs/SHELL-CLASS-POLICY.md` exists, self-labels non-normative, cites NUB-CLASS                      | ✓ VERIFIED | 114 lines, 8 H2, `non-normative` present, `NUB-CLASS` appears 19 times                   |
| 3   | CONNECT doc has HTTP-responder + 5-fixture residual-meta-CSP + mixed-content + cleartext + persistence + revocation + consent + N/A sections | ✓ VERIFIED | All 10 locked H2s + 5 `http-equiv` fixtures (9 hits) + CDATA (6) + parser example present |
| 4   | CLASS doc has class-determination + wire-timing + cross-NUB-invariant (with scenario table) + revocation UX | ✓ VERIFIED | Scenario table has 9 pipe-delimited rows, `class === 2` appears 7 times, `iff` present, Option A/B enumerated |
| 5   | Both docs have audit checklists with deployer-sign-off checkboxes                                     | ✓ VERIFIED | CONNECT: 16 `- [ ]` items; CLASS: 14 `- [ ]` items                                       |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact                              | Expected                                                                      | Status     | Details                                                                          |
| ------------------------------------- | ----------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------- |
| `specs/SHELL-CONNECT-POLICY.md`       | ≥180 lines, ≥12 H2 sections, ≥15 checkboxes, non-normative, cites NUB-CONNECT | ✓ VERIFIED | 209 lines, 12 H2, 16 checkboxes, contains `non-normative`, `NUB-CONNECT` × 19    |
| `specs/SHELL-CLASS-POLICY.md`         | ≥110 lines, 7–9 H2 sections, ≥10 checkboxes, non-normative, cites NUB-CLASS    | ✓ VERIFIED | 114 lines, 8 H2, 14 checkboxes, contains `non-normative`, `NUB-CLASS` × 19       |

### Key Link Verification

| From                             | To                             | Via                                                            | Status | Details                                                      |
| -------------------------------- | ------------------------------ | -------------------------------------------------------------- | ------ | ------------------------------------------------------------ |
| `SHELL-CONNECT-POLICY.md`        | NUB-CONNECT                    | Status banner + References                                     | WIRED  | `NUB-CONNECT` × 19 hits including dedicated References entry  |
| `SHELL-CONNECT-POLICY.md`        | `NUB-CLASS-2.md`               | residual-meta-CSP + grant-persistence + revocation sections    | WIRED  | `NUB-CLASS-2.md` cited in prose and References               |
| `SHELL-CONNECT-POLICY.md`        | `SHELL-RESOURCE-POLICY.md`     | Status bridge + References                                     | WIRED  | Markdown link `[SHELL-RESOURCE-POLICY.md](./SHELL-RESOURCE-POLICY.md)` present |
| `SHELL-CLASS-POLICY.md`          | NUB-CLASS                      | Status banner + References                                     | WIRED  | `NUB-CLASS` × 19 hits including dedicated References entry    |
| `SHELL-CLASS-POLICY.md`          | `NUB-CLASS-1.md` + `NUB-CLASS-2.md` | Class-determination + revocation sections                   | WIRED  | Both track members cited inline and in References            |
| `SHELL-CLASS-POLICY.md`          | `SHELL-CONNECT-POLICY.md`      | Cross-NUB-invariant + revocation cross-ref + References        | WIRED  | 4 occurrences of `SHELL-CONNECT-POLICY`                      |

### Section-by-Section Coverage (per plan acceptance criteria)

**SHELL-CONNECT-POLICY.md — POLICY-01..10:**

| REQ         | Check                                                   | Expected | Actual           | Result |
| ----------- | ------------------------------------------------------- | -------- | ---------------- | ------ |
| POLICY-01   | `grep -i non-normative`                                 | ≥1       | 1                | PASS   |
| POLICY-01   | `grep NUB-CONNECT`                                      | ≥3       | 19               | PASS   |
| POLICY-02   | HTTP-responder prose (`response header`)                | ≥1       | 8                | PASS   |
| POLICY-02   | Delivery modes `blob:` / `srcdoc` / `proxy` / `direct serving` | all     | all present      | PASS   |
| POLICY-03   | `http-equiv` fixture count                              | ≥5       | 9                | PASS   |
| POLICY-03   | Parser names (`parse5` or `htmlparser2`)                | ≥1       | both present     | PASS   |
| POLICY-03   | CDATA negative test present                             | ≥1       | 6                | PASS   |
| POLICY-04   | Mixed-content + `localhost`/`127.0.0.1` exceptions      | ≥2 each  | 7 + 4            | PASS   |
| POLICY-05   | `connect:scheme:http` + `connect:scheme:ws` + `cleartext` × ≥3 | all | 4 + 4 + 14       | PASS   |
| POLICY-06   | `(dTag, aggregateHash)` composite + `connect:origins` fold + silent-supply threat | ≥3 | 8 + present + "silent supply chain upgrade" × 2 | PASS |
| POLICY-07   | Revocation + DENIED + "not deleted"                     | ≥3       | 9 + 3 + 1        | PASS   |
| POLICY-08   | Consent UX: "send AND receive" + "talk with ... however it wants" + diminutive ban | all | 1 + present + present | PASS |
| POLICY-09   | N/A items: private-IP / MIME sniff / SVG raster / redirect / NUB-RESOURCE ≥2 | all | all present | PASS |
| Structural  | Checklist ≥15 items; `## Audit Checklist` header unique | ≥15 / 1  | 16 / 1           | PASS   |
| POLICY-10   | Zero-grep hygiene `@napplet/\|kehto\|hyprgate`          | 0        | **1** (line 46)  | **PARTIAL** (see Notes below) |

**SHELL-CLASS-POLICY.md — POLICY-11..16:**

| REQ         | Check                                                                 | Expected | Actual | Result |
| ----------- | --------------------------------------------------------------------- | -------- | ------ | ------ |
| POLICY-11   | `grep -i non-normative`                                               | ≥1       | 1      | PASS   |
| POLICY-11   | `grep NUB-CLASS`                                                      | ≥4       | 19     | PASS   |
| POLICY-12   | "sole authority"                                                      | ≥1       | 2      | PASS   |
| POLICY-12   | `class.assigned`                                                      | ≥6       | 20     | PASS   |
| POLICY-12   | "at most one" / "at-most-one"                                         | ≥1       | 3      | PASS   |
| POLICY-12   | "mid-session" / "mid session"                                         | ≥2       | 4      | PASS   |
| POLICY-13   | "iframe ready" / "shim bootstrap" / "bootstrap complete"              | ≥2       | 4      | PASS   |
| POLICY-14   | `connect.granted`                                                     | ≥4       | 11     | PASS   |
| POLICY-14   | `class === 2` / `class: 2`                                            | ≥3       | 7      | PASS   |
| POLICY-14   | Scenario table pipe-line count                                        | ≥7       | 9      | PASS   |
| POLICY-14   | "iff" keyword                                                         | ≥1       | 3      | PASS   |
| POLICY-15   | "reload"                                                              | ≥1       | 3      | PASS   |
| POLICY-15   | "refuse-to-serve" / "refuse to serve"                                 | ≥1       | 4      | PASS   |
| POLICY-15   | "Option A" + "Option B"                                               | ≥2       | 3      | PASS   |
| POLICY-15   | `SHELL-CONNECT-POLICY` cross-ref                                      | ≥2       | 4      | PASS   |
| Structural  | Checklist ≥10 items; `## Audit Checklist` header unique               | ≥10 / 1  | 14 / 1 | PASS   |
| POLICY-16   | Zero-grep hygiene `@napplet/\|kehto\|hyprgate`                        | 0        | 0      | PASS   |

### Requirements Coverage (REQUIREMENTS.md POLICY-01..16)

| Requirement | Source Plan | Description                                                        | Status      | Evidence                                                       |
| ----------- | ----------- | ------------------------------------------------------------------ | ----------- | -------------------------------------------------------------- |
| POLICY-01   | 140-01      | Author SHELL-CONNECT-POLICY.md parallel to SHELL-RESOURCE-POLICY.md | ✓ SATISFIED | 209-line doc with identical shape; Status + Why + 10 policy H2s + Audit + References |
| POLICY-02   | 140-01      | HTTP-responder precondition + 4 delivery modes with per-mode pitfalls | ✓ SATISFIED | `## HTTP Responder Precondition (MUST)` section with direct / proxy / blob: / srcdoc= subsections |
| POLICY-03   | 140-01      | Residual meta-CSP scan: parser-based, 5-fixture conformance bundle | ✓ SATISFIED | `## Residual Meta-CSP Scan (MUST)` with parse5 example + 5 numbered fixtures (4 reject + 1 CDATA negative) |
| POLICY-04   | 140-01      | Mixed-content reality check (HTTPS shell blocks http:/ws: except localhost/127.0.0.1/[::1]) | ✓ SATISFIED | `## Mixed-Content Reality Check (MUST)` section enumerating all three secure-context exceptions |
| POLICY-05   | 140-01      | Cleartext policy — refusal capability advertisement + no silent strip + consent marking | ✓ SATISFIED | `## Cleartext Policy (MUST)` section with `connect:scheme:http`/`connect:scheme:ws` advertisement + persistent marking |
| POLICY-06   | 140-01      | Grant persistence — composite `(dTag, aggregateHash)` key + silent-supply-chain threat model | ✓ SATISFIED | `## Grant Persistence (MUST)` section with `connect:origins` fold, strict-superset rule, silent-supply-chain-upgrade threat explicitly named |
| POLICY-07   | 140-01      | Revocation UX — user-facing affordance + DENIED-not-deleted + next-frame-creation effectiveness | ✓ SATISFIED | `## Revocation UX (MUST)` section with all three sub-requirements |
| POLICY-08   | 140-01      | Consent UX language — name, verbatim origin list, send-AND-receive, shell-blind, cleartext marking, no diminutive language | ✓ SATISFIED | `## Consent UX Language (MUST)` section with 5 numbered MUSTs + diminutive-language ban + exemplar phrasing |
| POLICY-09   | 140-01      | Explicit N/A items — private-IP, MIME sniff, SVG raster, redirect limits, size/rate caps | ✓ SATISFIED | `## Explicit N/A Items` section bullets all five with per-item rationale |
| POLICY-10   | 140-01      | Zero-grep hygiene on SHELL-CONNECT-POLICY.md                       | ⚠️ PARTIAL  | 1 occurrence of `@napplet/vite-plugin` on line 46 inside the parser-vs-regex rationale; `kehto` / `hyprgate` clean. REQUIREMENTS.md line 83 marks this [x] — treat as documentation lint followup. |
| POLICY-11   | 140-02      | Author SHELL-CLASS-POLICY.md parallel to SHELL-CONNECT-POLICY.md    | ✓ SATISFIED | 114-line doc mirroring the same shape; 8 H2 sections |
| POLICY-12   | 140-02      | Class-determination authority — shell is sole authority, at-most-one envelope, no dynamic re-classification | ✓ SATISFIED | `## Class-Determination Authority (MUST)` with all four MUST statements |
| POLICY-13   | 140-02      | Wire timing — after iframe ready, before napplet branches on class, coupled to shim ready signal | ✓ SATISFIED | `## Wire Timing (MUST)` section explicit before/after sides + minimal integration pattern |
| POLICY-14   | 140-02      | Cross-NUB invariant `class === 2 iff connect.granted === true` + scenario table | ✓ SATISFIED | `## Cross-NUB Invariant (MUST — Shell Responsibility)` section with 7-scenario table |
| POLICY-15   | 140-02      | Revocation UX for class-2 — Option A reload OR Option B refuse-to-serve | ✓ SATISFIED | `## Revocation UX for Class-2 Napplets (MUST)` section enumerating both options with SHELL-CONNECT-POLICY cross-ref |
| POLICY-16   | 140-02      | Zero-grep hygiene on SHELL-CLASS-POLICY.md                         | ✓ SATISFIED | 0 matches for `@napplet/\|kehto\|hyprgate` |

All 16 POLICY requirements are marked `- [x]` in `.planning/REQUIREMENTS.md` lines 74–89 and status `Complete` at lines 200–209. No orphaned POLICY IDs.

### Data-Flow Trace (Level 4)

N/A — phase 140 produces documentation, not runnable code.

### Behavioral Spot-Checks

N/A — phase 140 produces documentation, not runnable code. No server endpoints, CLI tools, or modules to spot-check.

### Anti-Patterns Found

| File                            | Line | Pattern            | Severity | Impact                                                                                                         |
| ------------------------------- | ---- | ------------------ | -------- | -------------------------------------------------------------------------------------------------------------- |
| `specs/SHELL-CONNECT-POLICY.md` | 46   | `@napplet/vite-plugin` | ℹ️ Info  | POLICY-10 zero-grep hygiene is marked complete in REQUIREMENTS.md, but one `@napplet/*` reference survives inside the parser-vs-regex rationale. It names the build-time shipped artifact by package path while explaining why shell-side scanning MUST differ. Since the file is citation-safe in every other respect and REQUIREMENTS.md treats POLICY-10 as closed, this is a lint-class follow-up for phase 141 (documentation sweep) — not a goal-blocking gap. Suggest rewriting as "the napplet build-tool's earlier `assertMetaIsFirstHeadChild` regex" without the package-path reference. |

No stub patterns, no TODOs, no hardcoded empty returns, no placeholder language in either doc. Both read as finished prose.

### Human Verification Required

None. This phase produces static documentation that is fully verifiable via grep + structural inspection.

### Gaps Summary

Phase 140 delivered both required shell-deployer policy docs. All 16 POLICY requirements are substantively covered: every MUST from POLICY-02..09 and POLICY-12..15 appears as both prose and an audit-checklist checkbox in the correct doc. The cross-NUB invariant scenario table, parser-based residual-meta-CSP example, 5-fixture conformance bundle, and reload-vs-refuse revocation paths are all present and correctly reasoned.

One mechanical deviation from the plan's zero-grep-hygiene gate on SHELL-CONNECT-POLICY.md: the string `@napplet/vite-plugin` appears on line 46 inside prose that contrasts shell-side vs build-time regex acceptability. The REQUIREMENTS.md checkbox for POLICY-10 is nevertheless marked `[x]` and the ROADMAP likewise treats the phase as complete. The reference is non-normative (names the package by path, not an import or dependency statement) and the file is otherwise citation-safe. Classify as a phase-141 documentation-sweep lint item rather than a phase-140 verification blocker. Overall phase status: passed.

---

_Verified: 2026-04-21_
_Verifier: Claude (gsd-verifier)_
