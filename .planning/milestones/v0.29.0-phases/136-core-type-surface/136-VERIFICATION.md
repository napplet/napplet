---
phase: 136-core-type-surface
verified: 2026-04-21T15:25:45Z
status: passed
score: 7/7 must-haves verified
---

# Phase 136: Core Type Surface Verification Report

**Phase Goal:** `@napplet/core` exposes both `connect` and `class` domain identifiers plus `NappletConnect` and optional `class?: number` shapes on `NappletGlobal`, so downstream packages can compile against the expanded type surface.
**Verified:** 2026-04-21T15:25:45Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                                                          | Status     | Evidence                                                                                                                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `import { type NubDomain } from '@napplet/core'` resolves a union that includes both `'connect'` and `'class'` literals        | ✓ VERIFIED | `packages/core/src/envelope.ts:69` — union has 12 members ending in `\| 'connect' \| 'class'`; mirrored in `packages/core/dist/index.d.ts:63`                                                  |
| 2   | `NUB_DOMAINS` runtime constant array includes `'connect'` and `'class'` (12 entries total)                                     | ✓ VERIFIED | `packages/core/src/envelope.ts:82` — array literal has 12 entries, `'connect'` + `'class'` as final pair; `packages/core/dist/index.js:2` emits `["relay",…,"connect","class"]`                |
| 3   | `import { type NappletGlobal } from '@napplet/core'` resolves an interface whose `connect` property exposes `readonly granted: boolean` and `readonly origins: readonly string[]` | ✓ VERIFIED | `packages/core/src/types.ts:617,623,630` — namespace present with both readonly fields; `packages/core/dist/index.d.ts:886,892,899` carries them into the emitted declaration                   |
| 4   | `NappletGlobal` exposes an optional `class?: number` property (typed as `number`, not a literal union)                         | ✓ VERIFIED | `packages/core/src/types.ts:664` — `class?: number;`; `packages/core/dist/index.d.ts:933` — `class?: number;` (no `1 \| 2` narrowing; both grep-assertions negative)                            |
| 5   | JSDoc on `NamespacedCapability` marks `perm:strict-csp` as `@deprecated` with a pointer to `nub:connect` + `nub:class`         | ✓ VERIFIED | `packages/core/src/envelope.ts:95` — inline `**@deprecated (v0.29.0)**` table annotation; `envelope.ts:109` — dedicated `@deprecated` JSDoc tag pointing to `nub:connect` + `nub:class`          |
| 6   | `pnpm --filter @napplet/core build` exits 0                                                                                    | ✓ VERIFIED | tsup build completes: `ESM dist/index.js 2.12 KB`, `DTS dist/index.d.ts 38.14 KB`, exit 0                                                                                                       |
| 7   | `pnpm --filter @napplet/core type-check` exits 0                                                                               | ✓ VERIFIED | `tsc --noEmit` completes with zero errors, zero output, exit 0                                                                                                                                  |

**Score:** 7/7 truths verified

### Required Artifacts

| Artifact                             | Expected                                                                                                                    | Status     | Details                                                                                                                                                                                  |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/core/src/envelope.ts`      | `NubDomain` union + `NUB_DOMAINS` constant both contain `'connect'` + `'class'`; `NamespacedCapability` JSDoc `@deprecated` | ✓ VERIFIED | 12-member union at line 69; 12-entry array at line 82; `@deprecated` annotations at lines 95 + 109; prose updated `ten` → `twelve` at line 45                                              |
| `packages/core/src/types.ts`         | `NappletGlobal.connect: { readonly granted; readonly origins }` (required) + `class?: number` (optional)                    | ✓ VERIFIED | `connect: {` at line 617 with `readonly granted: boolean` (623) + `readonly origins: readonly string[]` (630); `class?: number;` at line 664; placement between `resource` and `shell`    |

### Key Link Verification

| From                                                 | To                                              | Via                                                                     | Status  | Details                                                                                                                              |
| ---------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `envelope.ts` NubDomain union                        | `envelope.ts` NUB_DOMAINS array                 | matching string literals `'connect'` + `'class'`                        | ✓ WIRED | Both symbols contain the same 12 literals in the same order; `as const` keeps the array typed as `readonly NubDomain[]`              |
| `types.ts` NappletGlobal.connect shape               | Phase 137 `@napplet/nub/connect/types` (future) | structural type equivalence (zero-dep core principle)                   | ✓ WIRED | Inline shape `{ readonly granted: boolean; readonly origins: readonly string[] }` matches the Phase 135-locked NappletConnect contract |
| `types.ts` NappletGlobal.class                       | Phase 137 `@napplet/nub/class/shim.ts` (future) | runtime surface contract (`number` written on `class.assigned` wire)    | ✓ WIRED | Optional `number` field; structural contract lets Phase 137 write directly to `window.napplet.class` without widening                 |

### Data-Flow Trace (Level 4)

Not applicable — Phase 136 is pure type-surface work. No components render dynamic data; no fetches, stores, or props. Types are consumed structurally by downstream phases (137+) which will carry their own Level 4 verification when they ship runtime behavior.

### Behavioral Spot-Checks

| Behavior                                         | Command                                              | Result                                                   | Status  |
| ------------------------------------------------ | ---------------------------------------------------- | -------------------------------------------------------- | ------- |
| `@napplet/core` compiles (type-check)            | `pnpm --filter @napplet/core type-check`             | exit 0, zero errors                                      | ✓ PASS  |
| `@napplet/core` builds (tsup)                    | `pnpm --filter @napplet/core build`                  | exit 0, ESM 2.12 KB, DTS 38.14 KB                        | ✓ PASS  |
| `@napplet/core` unit tests pass (no regression)  | `pnpm --filter @napplet/core test:unit`              | 2 test files, 19 tests passed, 0 failed, 138ms            | ✓ PASS  |
| Runtime `NUB_DOMAINS` contains 12 entries        | `grep '\["relay",.*"class"\]' dist/index.js`         | match — array literal has 12 string entries ending in `"class"` | ✓ PASS  |
| Dist declarations expose new symbols             | `grep -E "'connect'\|'class'\|connect:\|class\\?:\|@deprecated" dist/index.d.ts` | 5/5 expected patterns present                            | ✓ PASS  |

### Requirements Coverage

| Requirement | Source Plan                                     | Description                                                                                                       | Status       | Evidence                                                                                                                             |
| ----------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| CORE-01     | 136-01-PLAN.md                                  | Add `'connect'` to `NubDomain` union in `envelope.ts` and to `NUB_DOMAINS` array                                  | ✓ SATISFIED  | `envelope.ts:69` union + `envelope.ts:82` array both contain `'connect'`; REQUIREMENTS.md marks `[x]` Phase 136                       |
| CORE-02     | 136-01-PLAN.md                                  | Add `connect: NappletConnect` field to `NappletGlobal`, mirroring the `resource:` block pattern                   | ✓ SATISFIED  | `types.ts:617-631` — inline `connect: { readonly granted: boolean; readonly origins: readonly string[] }`; structurally compatible    |
| CORE-03     | 136-01-PLAN.md                                  | Mark `perm:strict-csp` as `@deprecated` in JSDoc on `NamespacedCapability`; document supersession                 | ✓ SATISFIED  | `envelope.ts:95` inline table annotation + `envelope.ts:109` dedicated `@deprecated` tag citing `nub:connect` + `nub:class`            |
| CORE-04     | 136-01-PLAN.md                                  | Add `'class'` to `NubDomain` union in `envelope.ts` and to `NUB_DOMAINS` array (12 total)                         | ✓ SATISFIED  | `envelope.ts:69` union + `envelope.ts:82` array both contain `'class'` (12 entries total)                                              |
| CORE-05     | 136-01-PLAN.md                                  | Add `class?: number` field to `NappletGlobal` — optional bare `number`, not a literal union                       | ✓ SATISFIED  | `types.ts:664` — `class?: number;`; `grep class?: 1 \| 2` returns no matches (anti-pattern narrowing avoided)                          |

**Orphaned requirements:** None. All 5 CORE-IDs mapped to Phase 136 in REQUIREMENTS.md are claimed by the plan's `requirements` frontmatter and verified here.

### Anti-Patterns Found

Scanned modified files (`packages/core/src/envelope.ts`, `packages/core/src/types.ts`) for TODO/FIXME/placeholder/stub indicators:

| File                                 | Line | Pattern | Severity    | Impact                                                                                                                      |
| ------------------------------------ | ---- | ------- | ----------- | --------------------------------------------------------------------------------------------------------------------------- |
| —                                    | —    | —       | —           | No TODO/FIXME/XXX/HACK/PLACEHOLDER/stub patterns found. No `return null`/`return {}`/`return []` stub-shaped implementations. No hardcoded-empty-prop patterns. File is pure type surface with complete JSDoc. |

Note: The `@deprecated` annotations on `perm:strict-csp` (lines 95, 109) are intentional and scoped (CORE-03); they do not indicate incomplete work. The deprecation-window hard removal is tracked as `REMOVE-STRICTCSP-CAP` in REQUIREMENTS.md "Future Requirements".

### Human Verification Required

None. Phase 136 is a pure type-surface addition with no UI, no runtime behavior, no external services, and no real-time concerns. All verification is programmatically tractable via `tsc`/`tsup`/`vitest` exit codes and file-content grep assertions. Phase 137+ will introduce runtime behavior (wire handlers, shim installers) that may warrant human verification.

### Gaps Summary

None. All seven must-haves passed, all five CORE-IDs are satisfied, both emitted dist files (`dist/index.js`, `dist/index.d.ts`) carry the new symbols, and the pre-existing 19-test unit suite continues to pass without modification.

The SUMMARY.md's self-reported "Observation 2" (downstream `@napplet/shim` TS2741 error on `pnpm -r type-check`) is **out of scope for Phase 136** by explicit plan design (`tasks[2].action` anticipates this as "Phase 137+ consumption gap") and by ROADMAP.md Phase 139 ownership (SHIM-01 + SHIM-02 will populate `window.napplet.connect` on the shim's literal). Verified per the verifier prompt instruction: "Do NOT treat the shim failure as a Phase 136 gap — it's a pre-documented integration gap for Phase 139."

The SUMMARY.md's "Observation 1" (`dist/envelope.d.ts` + `dist/types.d.ts` vs. single `dist/index.d.ts`) is a verification-language mismatch in the plan's Task 3 block, not a scope deviation — tsup emits a single bundled `.d.ts` per its config, and all required symbols (`'connect'`, `'class'`, `connect:`, `class?:`, `@deprecated`) are present in that bundled declaration (verified at lines 63, 85, 99, 886, 933, 892, 899).

---

_Verified: 2026-04-21T15:25:45Z_
_Verifier: Claude (gsd-verifier)_
