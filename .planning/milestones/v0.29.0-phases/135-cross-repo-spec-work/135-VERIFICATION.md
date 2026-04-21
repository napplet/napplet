---
phase: 135-cross-repo-spec-work
verified: 2026-04-21T00:00:00Z
status: passed
score: 6/6 must-haves verified
re_verification: false
---

# Phase 135: Cross-Repo Spec Work Verification Report

**Phase Goal:** Four spec artifacts exist as public drafts in napplet/nubs — NUB-CONNECT (with `connect` tag surface, cites NUB-CLASS-2 by name), NUB-CLASS (establishes the class sub-track with wire `class.assigned` + runtime `window.napplet.class` + internal template/guidance for track members), NUB-CLASS-1 (strict posture), NUB-CLASS-2 (user-approved explicit-origin CSP posture). In-repo NIP-5D stays NUB-neutral (no NUB names, no class names inline).

**Verified:** 2026-04-21
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | All four drafts exist at `.planning/phases/135-cross-repo-spec-work/drafts/` with expected names | VERIFIED | `ls` lists `NUB-CLASS.md`, `NUB-CLASS-1.md`, `NUB-CLASS-2.md`, `NUB-CONNECT.md` |
| 2 | NUB-CLASS.md defines wire `class.assigned` with payload `{ class: number }`, runtime `window.napplet.class`, capability `nub:class`, plus internal sub-track template/authoring-guidance section | VERIFIED | `class.assigned` count=18; `window.napplet.class` count=8; `nub:class` count=5; `NUB-CLASS-$N` count=10; "Naming rules" + "Required content structure" + "Citation conventions" + "Adding a new class" subsections present (lines 71-101) |
| 3 | NUB-CLASS-1.md specifies the strict baseline posture (`connect-src 'none'`, no consent, `class: 1` wire value) | VERIFIED | `connect-src 'none'` count=7; `class: 1` count=2; "no consent prompt" prose present; zero NUB-CONNECT references |
| 4 | NUB-CLASS-2.md specifies the user-approved explicit-origin posture with grant keyed on `(dTag, aggregateHash)` | VERIFIED | `(dTag, aggregateHash)` count=8; `class: 2` count=2; `connect-src` count=9; "revocation" present; residual meta-CSP refuse-to-serve documented; origin-format rules (Punycode/xn--/default port/wildcard) NOT leaked |
| 5 | NUB-CONNECT.md cites NUB-CLASS-2 by file name ≥4 times, contains canonical aggregateHash fold + fixture + IDN vectors, and does not redefine class postures inline | VERIFIED | NUB-CLASS-2 count=10; NUB-CLASS-1 count=4; SHA-256 digest `cc7c1b1903fb23ecb909d2427e1dccd7d398a5c63dd65160edb0bb8b231aa742` present and independently verified via Python hashlib; `café.example.com` + `xn--caf-dma` + `日本` IDN vectors present; no `COMPUTE THIS VALUE` placeholder |
| 6 | specs/NIP-5D.md is NUB-neutral: zero NUB names, zero class names, zero NUB-flavored capability examples, zero inline CSP directive names | VERIFIED | All four greps returned zero matches; generic `Class-posture delegation` paragraph present; load-bearing sandbox prose (`allow-scripts`, `allow-same-origin`, `MessageEvent.source`) preserved; `## Security Considerations` + `## References` + "Non-Guarantees" intact |

**Score:** 6/6 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `.planning/phases/135-cross-repo-spec-work/drafts/NUB-CLASS.md` | Track root + wire + runtime + template | VERIFIED | 131 lines; setext heading "NUB-CLASS\n========="; `draft` banner; 4 required sub-track subsections |
| `.planning/phases/135-cross-repo-spec-work/drafts/NUB-CLASS-1.md` | Strict baseline class | VERIFIED | 60 lines; setext heading "NUB-CLASS-1\n==========="; CSP posture; shell responsibilities; security considerations |
| `.planning/phases/135-cross-repo-spec-work/drafts/NUB-CLASS-2.md` | User-approved explicit-origin class | VERIFIED | 82 lines; setext heading; all required sub-sections (Description, CSP Posture, Manifest Prerequisites, Shell Responsibilities, Grant Persistence Semantics, Security Considerations, References) |
| `.planning/phases/135-cross-repo-spec-work/drafts/NUB-CONNECT.md` | Full NUB-CONNECT spec citing NUB-CLASS-2 | VERIFIED | 260 lines; all 15 required H2 sections present (Description, Motivation, Non-Goals, Architecture Overview, Posture Citation, Manifest Tag Shape, Origin Format, Canonical fold, Runtime API, Capability Advertisement, Shell Consent Flow, Grant Persistence, Security Considerations, Graceful Degradation, References) |
| `specs/NIP-5D.md` | NUB-neutral transport-only | VERIFIED | `Class-posture delegation` paragraph inserted after "Storage isolation…" line; v0.28.0 `Browser-Enforced Resource Isolation` subsection removed; mitigation #1 expanded with `allow-same-origin` rationale |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| NUB-CONNECT.md | NUB-CLASS-2.md | Posture Citation + Architecture Overview + Shell Consent Flow + Grant Persistence + Security Considerations + References | WIRED | `NUB-CLASS-2` appears 10 times (≥4 required) |
| NUB-CONNECT.md | NUB-CLASS-1.md | Posture Citation + Architecture Overview + References | WIRED | `NUB-CLASS-1` appears 4 times (≥1 required) |
| NUB-CLASS-1.md | NUB-CLASS.md | References section | WIRED | Last bullet cites `NUB-CLASS.md` as parent |
| NUB-CLASS-2.md | NUB-CLASS.md | References section | WIRED | First bullet cites `NUB-CLASS.md` as parent |
| NUB-CLASS.md | NUB-CLASS-1.md + NUB-CLASS-2.md | References section | WIRED | Both sub-track members cited by file name |
| specs/NIP-5D.md | NUBs track (abstract) | Security Considerations generic paragraph | WIRED | "NUB specs that define class-contributing capabilities" + "out of scope for this NIP" phrasing |

### Data-Flow Trace (Level 4)

N/A — spec-authoring phase. Artifacts are Markdown documents, not components rendering dynamic data. Data-flow tracing does not apply.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| SHA-256 digest in NUB-CONNECT conformance fixture matches independent computation | `python3 -c "import hashlib; print(hashlib.sha256(b'https://api.example.com\nhttps://xn--caf-dma.example.com\nwss://events.example.com').hexdigest())"` | `cc7c1b1903fb23ecb909d2427e1dccd7d398a5c63dd65160edb0bb8b231aa742` (matches fixture byte-for-byte) | PASS |
| Zero-grep across all four drafts | `grep -r -E '@napplet/|kehto|hyprgate|packages/(nub\|shim\|sdk\|vite-plugin)' drafts/` | Zero matches (exit=1) | PASS |
| NIP-5D NUB-name absence | `grep -E "NUB-(CLASS\|CONNECT\|RESOURCE\|IDENTITY\|MEDIA\|NOTIFY\|RELAY\|KEYS\|CONFIG\|IFC\|STORAGE\|THEME)" specs/NIP-5D.md` | Zero matches (exit=1) | PASS |
| NIP-5D class-number absence | `grep -E "Class [12]\|class: [12]\|NUB-CLASS-[0-9]" specs/NIP-5D.md` | Zero matches (exit=1) | PASS |
| NIP-5D NUB-flavored capability absence | `grep -E "perm:strict-csp\|nub:connect\|nub:class" specs/NIP-5D.md` | Zero matches (exit=1) | PASS |
| NIP-5D CSP-directive absence | `grep -E "connect-src\|script-src\|default-src\|img-src\|style-src\|object-src\|base-uri\|form-action" specs/NIP-5D.md` | Zero matches (exit=1) | PASS |
| NUB-CLASS free of NUB-CONNECT | `grep "NUB-CONNECT" NUB-CLASS.md` | Zero matches (exit=1) | PASS |
| NUB-CLASS-1 free of NUB-CONNECT | `grep "NUB-CONNECT" NUB-CLASS-1.md` | Zero matches (exit=1) | PASS |
| NUB-CLASS-2 free of NUB-CONNECT | `grep "NUB-CONNECT" NUB-CLASS-2.md` | Zero matches (exit=1) | PASS |
| NUB-CLASS-2 free of origin-format leakage | `grep -E "Punycode\|xn--\|default port\|wildcard" NUB-CLASS-2.md` | Zero matches (exit=1) | PASS |
| No placeholder in NUB-CONNECT fixture | `grep "COMPUTE THIS VALUE" NUB-CONNECT.md` | Zero matches (exit=1) | PASS |
| Real 64-char hex digest present | `grep -E "[a-f0-9]{64}" NUB-CONNECT.md` | `cc7c1b1903fb23ecb909d2427e1dccd7d398a5c63dd65160edb0bb8b231aa742` present (≥2 occurrences: fold prose + fixture) | PASS |
| All four drafts carry `draft` banner | `grep -c "^\`draft\`$"` on each file | 1/1/1/1 | PASS |
| All four drafts use setext headings | First 2 lines per file | `NUB-CLASS\n=========` + three `NUB-CLASS-1/-2/CONNECT\n===========` | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| SPEC-01 | 135-03 | NUB-CONNECT draft: manifest tag shape, origin format, consent flow, runtime API, capability advertisement, grant lifecycle, security considerations, NUB-CLASS-2 reference, test vectors | SATISFIED | NUB-CONNECT.md has all 15 required sections; `["connect", "<origin>"]` manifest tag shape documented; 7-rule origin format; NappletConnect interface with granted + origins; nub:connect + connect:scheme:http + connect:scheme:ws capabilities; (dTag, aggregateHash) grant key |
| SPEC-02 | 135-03 | Canonical aggregateHash fold procedure for `connect:origins` at byte level | SATISFIED | 6-step normative pseudocode block (lines 124-131); SHA-256 digest `cc7c1b1903fb23ecb909d2427e1dccd7d398a5c63dd65160edb0bb8b231aa742` independently verified |
| SPEC-03 | 135-03 | IDN handling direction of authority (build → Punycode, shell rejects non-Punycode) with test vectors | SATISFIED | Origin Format rule "Punycode IDN" present; conformance table rows include `café.example.com → xn--caf-dma.example.com`, already-Punycode accept, uppercase-IDN reject, and `日本.example.com → xn--wgv71a.example.com` |
| SPEC-04 | 135-01 | NUB-CLASS.md track definition with wire `class.assigned`, runtime `window.napplet.class`, capability `nub:class`, plus sub-track template/authoring guidance | SATISFIED | NUB-CLASS.md contains Wire Protocol section with `class.assigned` table + example, `window.napplet.class` API Surface with TypeScript interface block, `shell.supports('nub:class')` capability, and NUB-CLASS-$N Sub-Track section with Naming rules + Required content structure + Citation conventions + Adding a new class subsections |
| SPEC-05 | 135-04 | Zero-grep hygiene across the four drafts (no `@napplet/`, `kehto`, `hyprgate`, private package paths) | SATISFIED | `grep -r -E '@napplet/\|kehto\|hyprgate\|packages/(nub\|shim\|sdk\|vite-plugin)' drafts/` returns zero matches |
| SPEC-06 | 135-01 | NUB-CLASS-1.md strict baseline posture (connect-src 'none', no consent, class: 1) | SATISFIED | NUB-CLASS-1.md has CSP Posture (`connect-src 'none'`), Manifest Prerequisites (default posture), Shell Responsibilities (emit CSP header + no consent + class:1 wire + residual meta-CSP tolerance), Security Considerations |
| SPEC-07 | 135-01 | NUB-CLASS-2.md user-approved explicit-origin posture (connect-src `<granted>`, consent, (dTag, aggregateHash), class: 2/1) | SATISFIED | NUB-CLASS-2.md has CSP Posture (`connect-src <granted-origins>`), Manifest Prerequisites (abstract class-contributing NUB reference), Shell Responsibilities (consent prompt + CSP header + class:2/1 wire + refuse-to-serve on meta-CSP + revocation), Grant Persistence Semantics (dTag+aggregateHash composite), Security Considerations (6 subsections including denied-equals-class-1 non-coercion property) |
| SPEC-08 | 135-03 | NUB-CONNECT cites NUB-CLASS-2 by file name; does NOT inline-redefine Class 1/Class 2 | SATISFIED | `NUB-CLASS-2` appears 10 times (≥4 required); `NUB-CLASS-1` appears 4 times; no `^Class [12] is ` or `^### Class [12]` headings that would indicate inline redefinition; Posture Citation section explicitly delegates |
| NIP5D-01 | 135-02 | Remove/generalize "Browser-Enforced Resource Isolation" subsection; replace with generic NUB-neutral paragraph | SATISFIED | Subsection absent (grep returns zero matches); `**Class-posture delegation.**` paragraph present (line 115); phrasing contains "NUBs MAY define napplet classes" + "out of scope for this NIP"; no NUB names, no class names, no CSP directives |
| NIP5D-02 | 135-02 | Remove `perm:strict-csp` capability-advertisement example; keep generic `shell.supports(...)` table | SATISFIED | `perm:strict-csp` absent from NIP-5D (grep returns zero matches); Runtime Capability Query table retained with generic `nub:/perm:` prefix examples only (`'relay'`, `'nub:identity'`, `'perm:popups'`) |

**Coverage:** 10/10 REQ-IDs satisfied. All IDs listed in the phase scope accounted for exactly once across the four plans' frontmatter. No orphans in REQUIREMENTS.md traceability table (SPEC-01..08, NIP5D-01, NIP5D-02 all map to Phase 135 and are marked Complete).

### Anti-Patterns Found

None.

Scanned all four drafts + specs/NIP-5D.md for TODO/FIXME/PLACEHOLDER markers, `COMPUTE THIS VALUE` placeholder, empty return values, and stub indicators. Zero blocker/warning/info anti-patterns found. Every MUST/SHOULD/MAY clause is attached to a concrete normative behavior. The SHA-256 placeholder was replaced with the independently-verified real value before commit.

### Human Verification Required

None.

This is a spec-authoring phase with pure Markdown deliverables. All verification is mechanically checkable:

- File existence and structural shape: grep-verifiable
- Content semantics (wire message, runtime surface, CSP directive strings, citation file names): grep-verifiable
- Conformance fixture correctness: Python hashlib-verifiable (executed inline; matched byte-for-byte)
- NUB-neutrality hygiene: grep-verifiable (all four absence checks returned zero matches)

The cross-repo PR submission to `napplet/nubs` is a downstream human action tracked in STATE.md as a carried blocker, explicitly out-of-scope for this phase per the plans' objectives.

### Gaps Summary

No gaps. Phase 135 goal achieved in full.

- All four draft files exist with correct names, setext headings, `draft` banners, metadata blocks, and the required section shapes.
- NUB-CLASS.md establishes the track with wire `class.assigned` (table + constraints + example), runtime `window.napplet.class`, capability `nub:class`, and the complete sub-track authoring template (Naming rules, Required content structure, Citation conventions, Adding a new class).
- NUB-CLASS-1.md documents the strict baseline posture (`connect-src 'none'`, no consent prompt, `class: 1` wire value) with all required subsections.
- NUB-CLASS-2.md documents the user-approved explicit-origin posture (`connect-src <granted-origins>`, `(dTag, aggregateHash)` composite key, revocation affordance, residual meta-CSP refuse-to-serve, denied-equals-Class-1 non-coercion property). Correctly avoids leaking NUB-CONNECT's origin-format rules.
- NUB-CONNECT.md is a complete, self-contained spec citing NUB-CLASS-2 by file name 10 times (≥4 required), with normative canonical fold pseudocode, independently-verified SHA-256 conformance fixture (`cc7c1b1903fb23ecb909d2427e1dccd7d398a5c63dd65160edb0bb8b231aa742`), multi-byte-UTF-8 IDN test vectors (`café.example.com` / `日本.example.com` → Punycode), and the 3-capability advertisement surface (`nub:connect`, `connect:scheme:http`, `connect:scheme:ws`).
- specs/NIP-5D.md passes full NUB-neutrality audit: zero NUB names (across all 12 namespaces), zero concrete class numbers, zero CSP directive names (across all 8 directives), zero NUB-flavored capability examples. The `Class-posture delegation` paragraph delegates class taxonomy to the NUBs track using only abstract language.
- Zero-grep hygiene (`@napplet/`, `kehto`, `hyprgate`, `packages/(nub|shim|sdk|vite-plugin)`) is clean across all four public drafts.
- All 10 phase REQ-IDs (SPEC-01..08, NIP5D-01, NIP5D-02) are accounted for in plan frontmatter, distributed across the four plans exactly once, and each has concrete implementation evidence in the draft files or the NIP-5D amendment.

Phase 135 is ready to proceed. Downstream phases (136-142) are unblocked on spec field names and wire shapes — all locked in the drafts.

---

_Verified: 2026-04-21_
_Verifier: Claude (gsd-verifier)_
