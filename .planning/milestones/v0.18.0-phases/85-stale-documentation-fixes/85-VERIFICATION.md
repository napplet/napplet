---
phase: 85-stale-documentation-fixes
verified: 2026-04-08T15:10:00Z
status: passed
score: 5/5 must-haves verified
---

# Phase 85: Stale Documentation Fixes — Verification Report

**Phase Goal:** Every README, JSDoc block, and NIP-5D reference accurately reflects the current codebase.
**Verified:** 2026-04-08T15:10:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth                                                                                          | Status     | Evidence                                                                 |
|----|-----------------------------------------------------------------------------------------------|------------|--------------------------------------------------------------------------|
| 1  | SDK README does not reference a "services" namespace                                          | ✓ VERIFIED | Line 15: `relay`, `ipc`, `storage` only. Only "services" occurrence is the comment `// Permissions and services` at line 115, which describes the `shell.supports()` API — valid usage. |
| 2  | vite-plugin README uses `shell.supports('svc:...')` instead of `services.has()`              | ✓ VERIFIED | `services.has` and `discoverServices` produce zero grep matches. Line 150: `window.napplet.shell.supports('svc:audio')` is present. |
| 3  | core README NubDomain table lists all 5 domains (relay, signer, storage, ifc, theme)         | ✓ VERIFIED | Lines 64-83: type definition, table, and `NUB_DOMAINS` array all include `theme`. Text says "five NUB capability domains". |
| 4  | core envelope.ts JSDoc table lists all 5 domains and has no D-02/D-03 references             | ✓ VERIFIED | Lines 44-54: JSDoc table has all 5 rows including `theme`. No D-02 or D-03 strings found. Lines 91-92: plain language without decision ID refs. |
| 5  | NIP-5D.md uses `shell.supports()` for all capability queries including services               | ✓ VERIFIED | Zero matches for `services.has` or `services` keyword. Lines 76-78: three `shell.supports()` examples covering NUB, perm, and svc prefixes. Capability prefix table added. |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact                          | Expected                                              | Status     | Details                                                       |
|-----------------------------------|-------------------------------------------------------|------------|---------------------------------------------------------------|
| `packages/sdk/README.md`          | No "services" namespace in How It Works list          | ✓ VERIFIED | Line 15 lists `relay`, `ipc`, `storage` — no `services`      |
| `packages/vite-plugin/README.md`  | `shell.supports('svc:...')` replaces `services.has()` | ✓ VERIFIED | Line 150 uses `shell.supports('svc:audio')`; zero stale refs  |
| `packages/core/README.md`         | NubDomain table with 5 rows, "five NUB" text          | ✓ VERIFIED | Lines 64-83 show all 5 domains; "five" appears twice          |
| `packages/core/src/envelope.ts`   | JSDoc with 5-row table, no D-02/D-03 refs             | ✓ VERIFIED | Lines 44-92: theme row present, D-02/D-03 absent              |
| `specs/NIP-5D.md`                 | No `services.has()`, `shell.supports()` used throughout| ✓ VERIFIED | Lines 76-88: three examples + prefix table; zero services refs |

### Key Link Verification

No inter-component wiring to verify — this is a documentation-only phase. All files are standalone markdown or JSDoc edits.

### Data-Flow Trace (Level 4)

Not applicable — documentation-only phase. No dynamic data rendering involved.

### Behavioral Spot-Checks

Step 7b: SKIPPED — documentation-only phase. No runnable entry points added or modified.

### Requirements Coverage

| Requirement | Source Plan | Description                                                               | Status      | Evidence                                                    |
|-------------|-------------|---------------------------------------------------------------------------|-------------|-------------------------------------------------------------|
| DOC-01      | 85-01       | Fix SDK README — remove references to "services" namespace                | ✓ SATISFIED | `services` removed from How It Works list (line 15)         |
| DOC-02      | 85-01       | Fix vite-plugin README — remove `services.has()`, use `shell.supports()`  | ✓ SATISFIED | Zero `services.has`/`discoverServices` matches; svc: example present |
| DOC-03      | 85-01       | Fix core README — NubDomain table lists 4 domains but code has 5 (theme)  | ✓ SATISFIED | Table has 5 rows; type and array include `theme`            |
| DOC-04      | 85-01       | Fix envelope.ts JSDoc — 4-domain table, nonexistent D-02/D-03 refs        | ✓ SATISFIED | JSDoc table has 5 rows; D-02/D-03 refs removed              |
| DOC-05      | 85-01       | Remove `services.has()` from NIP-5D.md, replace with `shell.supports()`   | ✓ SATISFIED | Zero services matches; capability prefix table added        |

All 5 requirements marked complete in REQUIREMENTS.md. No orphaned requirements found.

### Anti-Patterns Found

None. Documentation-only changes — no code paths, stubs, or placeholder patterns to flag.

### Human Verification Required

None — all success criteria are mechanically verifiable via text search. No visual or behavioral testing needed for documentation changes.

### Gaps Summary

No gaps. All 5 success criteria from ROADMAP.md are satisfied by the actual file contents:

1. `packages/sdk/README.md` line 15 contains `relay`, `ipc`, `storage` — no `services`.
2. `packages/vite-plugin/README.md` uses `shell.supports('svc:audio')` at line 150; zero matches for `services.has` or `discoverServices`.
3. `packages/core/README.md` has a 5-row NubDomain table (lines 71-76) and uses "five NUB capability domains" in description.
4. `packages/core/src/envelope.ts` JSDoc at lines 44-54 has a 5-row table including `theme`; lines 91-92 use plain language with no D-02/D-03 artifacts.
5. `specs/NIP-5D.md` lines 76-88 use `shell.supports()` for all three capability categories (bare NUB, perm:, svc:) and include a capability prefix table; zero `services` keyword matches.

All 5 phase commits (feae3d0, 70da23d, 2725955, 3503fa1, 3771092) confirmed present in git log.

---

_Verified: 2026-04-08T15:10:00Z_
_Verifier: Claude (gsd-verifier)_
