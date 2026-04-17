---
phase: 111-nub-config-spec
verified: 2026-04-17T00:00:00Z
status: passed
score: 11/11 must-haves verified
---

# Phase 111: NUB-CONFIG Spec Verification Report

**Phase Goal:** A public NUB-CONFIG specification exists in the napplet/nubs repo defining the JSON-Schema-driven configuration wire contract, MUST/SHOULD/MAY guarantees, anti-features, and error envelopes — with zero references to private packages.
**Verified:** 2026-04-17
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth                                                                                      | Status     | Evidence                                                                                                    |
|----|-------------------------------------------------------------------------------------------|------------|-------------------------------------------------------------------------------------------------------------|
| 1  | NUB-CONFIG.md exists on nub-config branch with setext header and `draft` status           | VERIFIED   | Lines 1-7: `NUB-CONFIG\n==========` + `` `draft` `` on line 7                                             |
| 2  | API Surface section declares `window.napplet.config` TypeScript interface                 | VERIFIED   | Lines 20-64: `## API Surface` with `interface NappletConfig`, `type ConfigSchema`, `type ConfigValues`     |
| 3  | Wire Protocol table lists all 8 message types (6 base + result/error)                    | VERIFIED   | Lines 82-91: all 8 rows present in table                                                                    |
| 4  | Schema Contract defines Core Subset, pattern exclusion with CVE, $version, extensions     | VERIFIED   | Lines 146-235: Core Subset, CVE-2025-69873, $version Potentiality, 5 x-napplet-* extensions               |
| 5  | Shell Guarantees has MUST/SHOULD/MAY tables with RFC 2119 preamble                        | VERIFIED   | Lines 237-278: RFC 2119 preamble + three labeled tables                                                     |
| 6  | Anti-Features explicitly rejects config.set, $ref/definitions, settings iframe, val code  | VERIFIED   | Lines 280-293: all four rejections named with rationale                                                     |
| 7  | Security Considerations covers 4 required topics                                          | VERIFIED   | Lines 296-318: Source-identity, Cleartext postMessage, additionalProperties:false, External $ref forbidden  |
| 8  | Error Envelopes catalogues all error codes and 3 required error cases                     | VERIFIED   | Lines 320-344: 9 error codes in table + Malformed schema, Undeclared section, Subscribe-before-schema cases |
| 9  | Zero occurrences of `@napplet/` in file, commit messages, and full diff from master       | VERIFIED   | grep returns no matches in file, in `git log nub-config ^master --format=%B`, or in `git diff master...nub-config` |
| 10 | README.md registry row for NUB-CONFIG links to napplet/nubs#13                            | VERIFIED   | Line 29 of README.md: `[NUB-CONFIG](https://github.com/napplet/nubs/pull/13)`                             |
| 11 | PR #13 opened at napplet/nubs                                                             | VERIFIED   | Confirmed out-of-band by user; README registry entry corroborates                                           |

**Score:** 11/11 truths verified

### Required Artifacts

| Artifact                                        | Expected                                        | Status     | Details                                                                 |
|-------------------------------------------------|-------------------------------------------------|------------|-------------------------------------------------------------------------|
| `/home/sandwich/Develop/nubs/NUB-CONFIG.md`    | Complete NUB-CONFIG spec on nub-config branch   | VERIFIED   | 349 lines, all required sections present, committed in 5 commits        |
| `/home/sandwich/Develop/nubs/README.md`        | Registry row for NUB-CONFIG linking to PR #13   | VERIFIED   | Line 29 contains correct PR URL and namespace                           |

### Key Link Verification

| From                  | To                   | Via                                   | Status   | Details                                                                 |
|-----------------------|----------------------|---------------------------------------|----------|-------------------------------------------------------------------------|
| nub-config branch     | NUB-CONFIG.md        | git commits on branch                 | WIRED    | 5 commits: 29baaac, 4a480d7, d7afd07, 15addd6, cc88056                 |
| README.md registry    | PR #13               | GitHub URL in table cell              | WIRED    | `https://github.com/napplet/nubs/pull/13` present in README            |
| config.schemaError    | error catalogue      | code values cross-referenced          | WIRED    | ConfigSchemaError interface codes match Error Envelopes table exactly   |

### Requirements Coverage

| Requirement | Source Plan      | Description                                                                                   | Status    | Evidence                                                                            |
|-------------|-----------------|-----------------------------------------------------------------------------------------------|-----------|-------------------------------------------------------------------------------------|
| SPEC-01     | 111-01, 111-04   | Draft NUB-CONFIG spec as napplet/nubs#13 with wire contract, Core Subset, security, NIP-5D   | SATISFIED | File exists on nub-config branch; PR #13 confirmed; **Parent:** NIP-5D line 12    |
| SPEC-02     | 111-02           | Core Subset locked — types, keywords, constraints, extensions, $version, pattern excluded      | SATISFIED | Schema Contract section lines 146-235; CVE-2025-69873 cited at line 218            |
| SPEC-03     | 111-03           | Shell MUSTs — validate before delivery, apply defaults, scope storage, sole writer, Tier 0    | SATISFIED | MUST table lines 242-254, 9 MUST rows                                              |
| SPEC-04     | 111-03           | Shell SHOULDs — group by section, sort by order, deprecationMessage, markdownDescription      | SATISFIED | SHOULD table lines 258-266, 7 SHOULD rows                                          |
| SPEC-05     | 111-03           | Shell MAYs — Tier 2+ secrets, richer format widgets, nested objects, NUB-STORAGE backend      | SATISFIED | MAY table lines 270-278, 7 MAY rows                                                |
| SPEC-06     | 111-03           | Anti-features — no config.set, no $ref/definitions, no settings iframe, no validation code    | SATISFIED | Anti-Features section lines 280-293                                                |
| SPEC-07     | 111-03           | Security — source-identity binding, cleartext postMessage, additionalProperties:false, $ref   | SATISFIED | Security Considerations lines 296-318; all 4 subsections present                  |
| SPEC-08     | 111-03           | Error envelopes — malformed schema, undeclared section, subscribe-before-schema               | SATISFIED | Error Envelopes lines 320-344; 9 error codes + 3 error cases                      |

All 8 requirement IDs (SPEC-01 through SPEC-08) are satisfied. No orphaned requirements.

### Anti-Patterns Found

No anti-patterns detected. The spec file contains no TODO/FIXME/placeholder markers, no implementation code, and no `@napplet/` references. The "Implementations: (none yet)" entry is intentional and correct for a draft spec.

### Human Verification Required

#### 1. PR #13 Open and Accessible

**Test:** Visit https://github.com/napplet/nubs/pull/13  
**Expected:** PR exists, is open (or merged), shows NUB-CONFIG.md diff, title references NUB-CONFIG  
**Why human:** GitHub API access not available in this environment; confirmed out-of-band by user but not programmatically verified

### Gaps Summary

No gaps. All must-haves pass automated verification. The spec is complete, substantive, and properly committed on the nub-config branch with zero private-package references across file content, commit messages, and the full diff from master.

---

_Verified: 2026-04-17_
_Verifier: Claude (gsd-verifier)_
