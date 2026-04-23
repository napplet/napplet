---
phase: 136-empirical-csp-injection-block-verification
verified: 2026-04-23T16:00:00Z
status: passed
score: 7/7 must-haves verified
re_verification: false
---

# Phase 136: Empirical CSP Injection-Block Verification — Verification Report

**Phase Goal:** Empirically prove on Chromium that a test napplet served under the NUB-CLASS-1 CSP posture blocks a simulated legacy `<script>`-tag content-script injection AND fires a `securitypolicyviolation` event the shell can receive. Lock the observed shape of `world: 'MAIN'` extension-API residual honestly. Produce a Phase 137-consumable artifact.

**Verified:** 2026-04-23T16:00:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Playwright CJS fixture running Chromium headless with `--ozone-platform=wayland` loads a NUB-CLASS-1 CSP-locked test page | VERIFIED | `/tmp/napplet-136-injection-block.cjs` exists (129 lines), uses `require('/usr/lib/node_modules/playwright')` and `args: ['--ozone-platform=wayland']` |
| 2 | Simulated legacy `<script>`-tag injection (no nonce) is blocked — `window.nostr` stays `undefined` | VERIFIED | Log reports `"windowNostrDefined":false`, `"pass":true` |
| 3 | `securitypolicyviolation` fires with `violatedDirective` starting with `script-src` | VERIFIED | Log reports `"violatedDirective":"script-src-elem"` which satisfies `startsWith('script-src')` |
| 4 | 4-field violation-report shape captured (`violatedDirective`, `blockedURI`, `documentURI`, `sourceFile`) | VERIFIED | `/tmp/napplet-136-report-shape.log` contains all 4 fields; Chromium quirks (`documentURI:"data"`, `sourceFile:null`) documented |
| 5 | `world: 'MAIN'` residual honestly documented in PHASE-NOTES with `chrome.scripting.executeScript` named and `connect-src 'none'` structural mitigation explained | VERIFIED | Section 4 of `136-PHASE-NOTES.md` satisfies DETECT-04; all 7 required literal strings grep-verified PASS |
| 6 | Shell policy latitude documented (3 MAY statements: refuse-to-serve, reject `identity.decrypt`, surface to user) | VERIFIED | Section 3 of `136-PHASE-NOTES.md`; `MAY refuse-to-serve` and `shell MAY reject` present verbatim |
| 7 | Zero source changes to `packages/`, `specs/`, or `skills/` trees | VERIFIED | `git diff 4acb2ef..HEAD -- packages/ specs/ skills/` returns empty; phase is empirical-only |

**Score:** 7/7 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `/tmp/napplet-136-injection-block.cjs` | Playwright fixture, min 60 lines | VERIFIED | 129 lines; `require('/usr/lib/node_modules/playwright')` wired; Wayland flag present |
| `/tmp/napplet-136-injection-block.log` | JSON evidence + `VER04_EXIT=0` | VERIFIED | `{"cspViolation":true,"windowNostrDefined":false,"violationCount":1,"violatedDirective":"script-src-elem","effectiveDirective":"script-src-elem","pass":true}` + `VER04_EXIT=0` |
| `/tmp/napplet-136-report-shape.log` | 4-field report shape + `VER04_EXIT=0` | VERIFIED | `{"reportShape":{"violatedDirective":"script-src-elem","blockedURI":"inline","documentURI":"data","sourceFile":null}}` + `VER04_EXIT=0` |
| `.planning/phases/136-empirical-csp-injection-block-verification/136-PHASE-NOTES.md` | Phase 137-consumable artifact, min 80 lines, contains `world: 'MAIN'` | VERIFIED | 93 lines; all 5 required section headings present; all 7 literal strings grep-verified |
| `/tmp/napplet-136-phase-notes-grep.log` | 7 PASS lines + `GREP_EXIT=0` | VERIFIED | 7 PASS, 0 FAIL, `ALL 7 LITERAL STRINGS PRESENT`, `GREP_EXIT=0` |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `/tmp/napplet-136-injection-block.cjs` | `/usr/lib/node_modules/playwright` | `require()` absolute path | VERIFIED | `require('/usr/lib/node_modules/playwright')` present on line 1 of fixture |
| fixture stdout | `/tmp/napplet-136-injection-block.log` | shell redirect + `VER04_EXIT=$?` | VERIFIED | `VER04_EXIT=0` confirmed in log file |
| fixture stderr | `/tmp/napplet-136-report-shape.log` | stderr redirect + `violatedDirective` | VERIFIED | `violatedDirective` confirmed in log file |
| `136-PHASE-NOTES.md` | `/tmp/napplet-136-injection-block.log` | verbatim citation in Section 1 | VERIFIED | Exact JSON snapshot cited in Section 1 |
| `136-PHASE-NOTES.md` | `/tmp/napplet-136-report-shape.log` | verbatim citation in Section 2 | VERIFIED | Exact JSON snapshot cited in Section 2 |
| `/tmp/napplet-136-phase-notes-grep.log` | `136-PHASE-NOTES.md` | `grep -q` on 7 literal strings | VERIFIED | `GREP_EXIT=0` stamped; all 7 PASS |

---

### Data-Flow Trace (Level 4)

Not applicable — this is an empirical verification phase producing evidence files and a documentation artifact, not a component rendering dynamic data from a data store.

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Injection-block log exists and contains `VER04_EXIT=0` | `cat /tmp/napplet-136-injection-block.log` | `VER04_EXIT=0` confirmed | PASS |
| Report-shape log exists and contains `VER04_EXIT=0` | `cat /tmp/napplet-136-report-shape.log` | `VER04_EXIT=0` confirmed | PASS |
| `violatedDirective` starts with `script-src` in both logs | `grep -oE '"violatedDirective":"[^"]+"' /tmp/napplet-136-injection-block.log /tmp/napplet-136-report-shape.log` | `"script-src-elem"` in both (satisfies `startsWith('script-src')`) | PASS |
| Phase-notes grep log shows 7 PASS and `GREP_EXIT=0` | `cat /tmp/napplet-136-phase-notes-grep.log` | 7 PASS, 0 FAIL, `GREP_EXIT=0` | PASS |
| PHASE-NOTES has no spec-amendment prose ("Proposed Amendment Text") | `grep "Proposed Amendment Text" 136-PHASE-NOTES.md` | NOT FOUND | PASS |
| Zero source changes in `packages/` `specs/` `skills/` | `git diff 4acb2ef..HEAD --stat -- packages/ specs/ skills/` | empty (no output) | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| DETECT-01 | Plan 01 | CSP legacy-injection block mechanism empirically observed on Chromium | SATISFIED | `"cspViolation":true`, `"windowNostrDefined":false`, `"violatedDirective":"script-src-elem"` in injection-block log; `pass:true` |
| DETECT-02 | Plan 02 | Shell MUST correlate violation reports to napplet identity via `(dTag, aggregateHash)` through napplet HTML URL path | SATISFIED | PHASE-NOTES Section 2 documents 4-field shape; `(dTag, aggregateHash)` literal present and grep-verified |
| DETECT-03 | Plan 02 | Shell policy latitude defined — mechanism specified, response is shell UX discretion | SATISFIED | PHASE-NOTES Section 3 enumerates 3 MAY statements; `MAY refuse-to-serve` and `shell MAY reject` literal strings present and grep-verified |
| DETECT-04 | Plan 02 | `world: 'MAIN'` residual honestly acknowledged; `connect-src 'none'` named as structural mitigation | SATISFIED | PHASE-NOTES Section 4; `world: 'MAIN'`, `chrome.scripting.executeScript`, `connect-src 'none'` all present and grep-verified; no false claim of a fix |
| VER-04 | Plan 01 | Empirical Chromium verification stamp | SATISFIED | `VER04_EXIT=0` in both `/tmp/napplet-136-injection-block.log` and `/tmp/napplet-136-report-shape.log` |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (none) | — | — | — | — |

No stubs, placeholders, forbidden spec-amendment prose, or source-tree pollution detected. The single grep match on line 93 of PHASE-NOTES ("Phase 137 owns the amendment prose (MUST/SHOULD tables...)") is a negative statement attributing authorship to Phase 137 — not spec drafting by Phase 136.

---

### Human Verification Required

None. All phase success criteria are programmatically verifiable via log files and grep gates. The fixture is a headless Playwright run with no visual output requiring human judgment.

---

### Gaps Summary

No gaps. All 7 must-have truths verified, all 5 artifacts substantive and present, all key links wired, all 5 REQ-IDs satisfied, zero source-tree changes, zero forbidden prose.

One Chromium behavior note (not a gap — expected per phase context): `violatedDirective` emitted as `"script-src-elem"` rather than bare `"script-src"`. This is Chromium 144+ standard behavior; the plan gate uses `startsWith('script-src')` which matches; and PHASE-NOTES documents it explicitly so Phase 137 can draft directive-family rather than exact-string match language.

---

_Verified: 2026-04-23T16:00:00Z_
_Verifier: Claude (gsd-verifier)_
