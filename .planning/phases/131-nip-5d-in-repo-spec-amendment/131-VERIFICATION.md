---
phase: 131-nip-5d-in-repo-spec-amendment
verified: 2026-04-20T22:00:00Z
status: passed
score: 7/7 must-haves verified
re_verification: false
---

# Phase 131: NIP-5D In-Repo Spec Amendment Verification Report

**Phase Goal:** `specs/NIP-5D.md` documents the v0.28.0 strict-CSP security posture so anyone reading the NIP understands the resource NUB is the canonical fetch path and `sandbox="allow-scripts"` (no `allow-same-origin`) is reaffirmed.
**Verified:** 2026-04-20T22:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | `specs/NIP-5D.md` contains a new subsection titled exactly "Browser-Enforced Resource Isolation" inside Security Considerations | VERIFIED | Line 115 of specs/NIP-5D.md: `### Browser-Enforced Resource Isolation`; placed between storage/ACL paragraph (line 113) and Non-Guarantees (line 132); heading count = 1 |
| 2  | The subsection states strict CSP enforcement SHOULD be applied by shells | VERIFIED | Line 117: "Shells SHOULD additionally enforce browser-level isolation"; line 119: "Shells SHOULD deliver napplet HTML under a strict Content Security Policy" |
| 3  | The subsection names the capability identifier `perm:strict-csp` literally | VERIFIED | Line 119: `perm:strict-csp` named literally; line 119 also includes the full runtime usage example `window.napplet.shell.supports('perm:strict-csp')` |
| 4  | The subsection reaffirms `sandbox="allow-scripts"` and that `allow-same-origin` MUST NOT be added | VERIFIED | Line 128: "napplet iframes MUST use `sandbox="allow-scripts"` and MUST NOT add `allow-same-origin`"; service-worker bypass reasoning provided |
| 5  | The subsection cross-references NUB-RESOURCE by name (no URL, no @napplet/* reference) | VERIFIED | Line 126: "See the napplet/nubs registry NUB-RESOURCE specification for the message catalog..." — name-only, no URL |
| 6  | Zero matches for `@napplet/` in `specs/NIP-5D.md` | VERIFIED | `grep -c "@napplet/" specs/NIP-5D.md` = 0 |
| 7  | Zero matches for `kehto` and `hyprgate` in `specs/NIP-5D.md` | VERIFIED | `grep -c "kehto" specs/NIP-5D.md` = 0; `grep -c "hyprgate" specs/NIP-5D.md` = 0 |

**Score:** 7/7 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `specs/NIP-5D.md` | NIP-5D spec amended with Browser-Enforced Resource Isolation subsection | VERIFIED | Subsection exists at line 115; 17 insertions added in commit 13fae17; no deletions |
| `specs/NIP-5D.md` | Capability identifier `perm:strict-csp` documented | VERIFIED | Present at line 119 with runtime usage example |
| `specs/NIP-5D.md` | Cross-reference to NUB-RESOURCE | VERIFIED | Present at line 126; name-only reference as required |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `specs/NIP-5D.md` (Security Considerations) | NUB-RESOURCE (cross-repo, by name only) | Prose cross-reference inside Browser-Enforced Resource Isolation subsection | VERIFIED | Pattern `NUB-RESOURCE` found at line 126 |
| `specs/NIP-5D.md` (Browser-Enforced Resource Isolation) | `perm:strict-csp` capability identifier | Literal mention of the capability string | VERIFIED | Pattern `perm:strict-csp` found at line 119; full `window.napplet.shell.supports('perm:strict-csp')` example present |
| `specs/NIP-5D.md` (Transport section sandbox token) | `specs/NIP-5D.md` (Browser-Enforced Resource Isolation) | Reaffirmation of `sandbox="allow-scripts"` with `allow-same-origin` prohibition | VERIFIED | Original prohibition at line 33 intact; new subsection reaffirms at line 128 with explicit service-worker bypass reasoning |

### Data-Flow Trace (Level 4)

Not applicable — this phase produces a documentation artifact (Markdown spec), not a component or API that renders dynamic data.

### Behavioral Spot-Checks

Not applicable — no runnable code produced; the sole output is a spec document amendment.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| SPEC-01 | 131-01-PLAN.md | NIP-5D Security Considerations amended with Browser-Enforced Resource Isolation subsection | SATISFIED | `### Browser-Enforced Resource Isolation` subsection present; all 12 plan acceptance criteria satisfied; SUMMARY frontmatter `requirements-completed: [SPEC-01]` confirmed |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | None | — | — |

No TODO/FIXME/placeholder comments found. No `@napplet/*`, `kehto`, or `hyprgate` references. No stubs. The amendment is substantive prose with a load-bearing subsection heading, normative language (SHOULD/MUST), a runtime capability example, and a 4-space indented CSP code block following spec conventions.

### Human Verification Required

None. All acceptance criteria for this phase are grep-verifiable against static file content. No visual rendering, runtime behavior, or external service integration is involved.

### Gaps Summary

No gaps. All 7 must-have truths verified, all 3 required artifacts confirmed substantive and correctly placed, all 3 key links wired. The commit 13fae17 shows 17 insertions and zero deletions in `specs/NIP-5D.md` only. Public-repo hygiene is clean. SPEC-01 is closed.

---

_Verified: 2026-04-20T22:00:00Z_
_Verifier: Claude (gsd-verifier)_
