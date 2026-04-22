---
phase: 125-core-type-surface
verified: 2026-04-20T14:24:30Z
status: passed
score: 6/6 must-haves verified
re_verification: false
---

# Phase 125: Core Type Surface Verification Report

**Phase Goal:** The shared type vocabulary downstream packages need to compile against the resource NUB exists in `@napplet/core`.
**Verified:** 2026-04-20T14:24:30Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                     | Status     | Evidence                                                                                 |
| --- | ----------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------- |
| 1   | `NubDomain` union includes the literal `'resource'`                                       | ✓ VERIFIED | Line 67 of envelope.ts: union has `'resource'` as 10th member                           |
| 2   | `NUB_DOMAINS` runtime constant array includes the string `'resource'`                     | ✓ VERIFIED | Line 80 of envelope.ts: array includes `'resource'` as 10th entry                       |
| 3   | `NappletGlobal.resource` exposes `bytes` and `bytesAsObjectURL` method signatures         | ✓ VERIFIED | Lines 570-588 of types.ts: `resource: { bytes(url: string): Promise<Blob>; bytesAsObjectURL(url: string): { url: string; revoke: () => void }; }` |
| 4   | `NamespacedCapability` JSDoc documents `perm:strict-csp` as valid (type unchanged)        | ✓ VERIFIED | Lines 93-104 of envelope.ts: JSDoc table row and `@example` line present; type body at lines 107-110 unchanged (`\| NubDomain \| \`nub:${NubDomain}\` \| \`perm:${string}\``) |
| 5   | `pnpm --filter @napplet/core build` exits 0                                               | ✓ VERIFIED | Build produced `dist/index.d.ts` (33.91 KB) and `dist/index.js` (2.10 KB); exit 0       |
| 6   | `pnpm --filter @napplet/core type-check` exits 0                                          | ✓ VERIFIED | `tsc --noEmit` completed with no errors; exit 0                                          |

**Score:** 6/6 truths verified

### Required Artifacts

| Artifact                                  | Expected                                          | Status     | Details                                                                                                      |
| ----------------------------------------- | ------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------ |
| `packages/core/src/envelope.ts`           | NubDomain union, NUB_DOMAINS constant, NamespacedCapability type | ✓ VERIFIED | Contains `'resource'` in both union (line 67) and array (line 80); `perm:strict-csp` in JSDoc (lines 93, 104); JSDoc table row `\| \`resource\` \|` at line 59 |
| `packages/core/src/types.ts`              | NappletGlobal interface with resource namespace   | ✓ VERIFIED | `resource: {` at line 570 (single occurrence); `bytes(url: string): Promise<Blob>` at line 579; `bytesAsObjectURL(url: string): { url: string; revoke: () => void }` at line 587 |
| `packages/core/tsconfig.json`             | lib includes DOM for Blob global resolution       | ✓ VERIFIED | `"lib": ["ES2022", "DOM", "DOM.Iterable"]` — deviation from plan but principled fix (Blob is a DOM global; aligns core with all sibling packages) |
| `packages/core/dist/index.d.ts`           | Emitted declaration contains resource and perm:strict-csp | ✓ VERIFIED | `grep "'resource'"`, `grep "resource:"`, `grep "perm:strict-csp"`, and `grep "NappletGlobal"` all return matches |

### Key Link Verification

| From                                           | To                                           | Via                                          | Status     | Details                                                                       |
| ---------------------------------------------- | -------------------------------------------- | -------------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `envelope.ts` NubDomain union `'resource'`     | `envelope.ts` NUB_DOMAINS array              | matching string literal — must stay in sync  | ✓ WIRED    | Both line 67 (union) and line 80 (array) contain `'resource'`; grep count = 2 |
| `types.ts` NappletGlobal.resource namespace    | Phase 126 resource NUB scaffold              | type contract: `bytes(url): Promise<Blob>` and `bytesAsObjectURL(url): { url: string; revoke: () => void }` | ✓ WIRED | Signatures present verbatim; emitted in dist/index.d.ts for downstream consumption |

### Data-Flow Trace (Level 4)

Not applicable — this phase delivers pure TypeScript type declarations only. No runtime rendering, no data fetching, no state. Level 4 trace is skipped.

### Behavioral Spot-Checks

| Behavior                                       | Command                                             | Result                              | Status  |
| ---------------------------------------------- | --------------------------------------------------- | ----------------------------------- | ------- |
| `@napplet/core type-check` exits 0             | `pnpm --filter @napplet/core type-check`            | exit 0 (tsc --noEmit, no errors)    | ✓ PASS  |
| `@napplet/core build` exits 0                  | `pnpm --filter @napplet/core build`                 | exit 0; 33.91 KB d.ts emitted       | ✓ PASS  |
| Existing test suite passes (19/19)             | `pnpm --filter @napplet/core test:unit`             | 19 passed (2 test files)            | ✓ PASS  |
| `dist/index.d.ts` exports `NappletGlobal` with `resource` | `grep "resource:" dist/index.d.ts`        | Match found                         | ✓ PASS  |
| `dist/index.d.ts` contains `perm:strict-csp`   | `grep "perm:strict-csp" dist/index.d.ts`           | Match found                         | ✓ PASS  |

### Requirements Coverage

| Requirement | Source Plan     | Description                                                                                       | Status      | Evidence                                                                                     |
| ----------- | --------------- | ------------------------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------- |
| CORE-01     | 125-01-PLAN.md  | `'resource'` added to `NubDomain` union and `NUB_DOMAINS` constant in `packages/core/src/envelope.ts` | ✓ SATISFIED | Union and array both verified at lines 67 and 80; grep count = 2 in envelope.ts              |
| CORE-02     | 125-01-PLAN.md  | `resource: { bytes, bytesAsObjectURL }` namespace added to `NappletGlobal` in `packages/core/src/types.ts` | ✓ SATISFIED | Namespace at line 570; both method signatures verified; one occurrence (no duplicate)         |
| CORE-03     | 125-01-PLAN.md  | `perm:strict-csp` documented as valid `NamespacedCapability` (JSDoc clarification only, type unchanged) | ✓ SATISFIED | JSDoc table row and `@example` line in envelope.ts; type body at lines 107-110 is unchanged  |

No orphaned requirements — REQUIREMENTS.md maps CORE-01, CORE-02, CORE-03 to Phase 125 and marks all three complete.

### Anti-Patterns Found

No anti-patterns found. Both modified files contain only type declarations and JSDoc. No `TODO`, `FIXME`, placeholder comments, empty implementations, or hardcoded empty data were detected. The `resource` namespace is fully declared (not stubbed — it's a type-only phase by design; the runtime wiring is deferred to Phases 126-128 per the milestone plan).

### Human Verification Required

None. All success criteria for this phase are mechanically verifiable via type-check, build, and grep.

### Noted Deviations (Non-Blocking)

**DEF-125-01 (Documented, intentional):** The workspace-wide `pnpm -r type-check` fails in `@napplet/shim` because `NappletGlobal.resource` is now required but the shim's `window.napplet` object literal does not yet implement it (TS2741). This is expected, planned, and explicitly scoped out of Phase 125. Phase 128 (Central Shim Integration) will close it. Per-package validation for `@napplet/core` only is the gating signal for this phase. Tracked in `.planning/phases/125-core-type-surface/deferred-items.md`.

**tsconfig.json DOM lib addition:** `packages/core/tsconfig.json` was updated from `["ES2022"]` to `["ES2022", "DOM", "DOM.Iterable"]` to resolve `TS2304: Cannot find name 'Blob'`. This is a consistency fix — every other sibling package already uses these libs. The plan assumed DOM was available ("Blob is a global DOM type"); the fix honors the plan's intent.

### Gaps Summary

No gaps. All 6 must-have truths are verified. All artifacts exist, are substantive (not stubs), and are wired (emitted into `dist/index.d.ts`). All three requirement IDs (CORE-01, CORE-02, CORE-03) are satisfied with evidence. Build, type-check, and test suite all exit 0.

---

_Verified: 2026-04-20T14:24:30Z_
_Verifier: Claude (gsd-verifier)_
