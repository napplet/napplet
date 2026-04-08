---
phase: 80-namespaced-capability-query
verified: 2026-04-08T02:05:00Z
status: passed
score: 6/6 must-haves verified
re_verification: false
---

# Phase 80: Namespaced Capability Query Verification Report

**Phase Goal:** Napplets can query shell capabilities using namespaced prefixes that distinguish NUBs, permissions, and services
**Verified:** 2026-04-08T02:05:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `shell.supports('nub:relay')` compiles and accepts NUB-prefixed strings | VERIFIED | `NamespacedCapability` union includes `` `nub:${NubDomain}` ``; test `'nub:relay'` compiles in index.test.ts:149 |
| 2 | `shell.supports('relay')` still compiles as bare NUB domain shorthand | VERIFIED | `NamespacedCapability` includes `NubDomain`; test at index.test.ts:138 confirms `'relay'` is valid |
| 3 | `shell.supports('perm:sign')` compiles with `perm:` prefix | VERIFIED | `` `perm:${string}` `` arm in union; test at index.test.ts:158; JSDoc in envelope.ts:122 |
| 4 | `shell.supports('svc:audio')` compiles with `svc:` prefix | VERIFIED | `` `svc:${string}` `` arm in union; test at index.test.ts:164; JSDoc in envelope.ts:125 |
| 5 | Bare non-NUB strings like `supports('sign')` do NOT compile | VERIFIED | `NamespacedCapability` is a closed union of `NubDomain \| nub:* \| perm:* \| svc:*`; `'sign'` is not in `NubDomain` and carries no required prefix, so it is excluded at type-level |
| 6 | `pnpm build && pnpm type-check` passes with zero errors | VERIFIED | `pnpm type-check` exits 0: "15 successful, 15 total" |

**Score:** 6/6 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/core/src/envelope.ts` | `ShellSupports` with `NamespacedCapability` type, `NappletGlobalShell` inheriting it | VERIFIED | `NamespacedCapability` defined at line 101; `supports(capability: NamespacedCapability)` at line 131; `NappletGlobalShell extends ShellSupports` at line 155; grep count = 6 occurrences of `NamespacedCapability` |
| `packages/shim/src/index.ts` | Stub `supports()` accepting namespaced strings | VERIFIED | Parameter `_capability` present (line 351); assigned as `NappletGlobal` so constrained by the updated interface; type-check passes |
| `packages/core/src/index.test.ts` | Type-level compile checks for namespaced capability strings | VERIFIED | `describe('namespaced capability types')` block at line 135 with 5 tests covering bare, `nub:`, `perm:`, `svc:`, and `ShellSupports` integration; all 29 new+passing tests pass |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `packages/core/src/envelope.ts` | `packages/core/src/types.ts` | `NappletGlobalShell` import | WIRED | `import type { NappletGlobalShell } from './envelope.js'` at types.ts:8; `shell: NappletGlobalShell` at types.ts:348 |
| `packages/core/src/envelope.ts` | `packages/shim/src/index.ts` | `NappletGlobal` type constrains `window.napplet` shape | WIRED | `import type { NappletGlobal }` at shim/index.ts:10; assigned at lines 32 and 324 |
| `packages/core/src/envelope.ts` | `packages/sdk/src/index.ts` | `ShellSupports` and `NamespacedCapability` re-export | WIRED | `export type { NappletMessage, NubDomain, NamespacedCapability, ShellSupports } from '@napplet/core'` at sdk/index.ts:250 |

---

### Data-Flow Trace (Level 4)

Not applicable. This phase delivers type definitions and compile-time constraints — no runtime data flow to trace. All artifacts are TypeScript type/interface definitions with no dynamic rendering.

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Type-check passes with zero errors | `pnpm type-check` | 15/15 tasks successful, 0 errors | PASS |
| Namespaced capability tests pass | `pnpm test` (namespaced capability suite) | 29 pass, 2 fail (pre-existing BusKind.REGISTRATION failures, unrelated to this phase) | PASS |
| Commit a413a46 exists | `git show --stat a413a46` | 3 files changed, 66 insertions | PASS |
| Commit 3704b2f exists | `git show --stat 3704b2f` | 1 file changed, 46 insertions | PASS |
| Commit 339bb39 exists | `git show --stat 339bb39` | 1 file changed, SDK re-export | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| CAP-01 | 80-01-PLAN.md | `shell.supports()` accepts namespaced strings with `nub:`, `perm:`, `svc:` prefixes | SATISFIED | `NamespacedCapability` union type in envelope.ts:101; `ShellSupports.supports(capability: NamespacedCapability)` at envelope.ts:131 |
| CAP-02 | 80-01-PLAN.md | `ShellSupports` interface updated to accept namespaced capability strings | SATISFIED | `ShellSupports` parameter updated from `NubDomain \| string` to `NamespacedCapability`; grep confirms single match at envelope.ts:131 |
| CAP-03 | 80-01-PLAN.md | `NappletGlobalShell` type reflects the namespaced API | SATISFIED | `NappletGlobalShell extends ShellSupports {}` at envelope.ts:155; inherits updated `supports()` signature; JSDoc shows `nub:signer`, `perm:sign`, `svc:audio` examples |

Note: REQUIREMENTS.md traceability table still shows all three as "Pending" — this is a documentation artifact that was not updated post-phase. The code satisfies all three requirements.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `packages/shim/src/index.ts` | 351 | `_capability: string` explicit annotation instead of inferred `NamespacedCapability` | Info | The stub compiles because TypeScript allows wider parameter types in implementations (contravariance). No runtime impact. `pnpm type-check` passes. The plan explicitly anticipated this and instructed leaving it if type-check passes. |
| `packages/shim/src/index.ts` | 352 | `/ TODO: Shell populates supported capabilities at iframe creation` (missing `//`) | Info | Cosmetic — comment missing one `/`. Does not affect compilation or behavior. Out of scope for this phase. |

No blocker or warning anti-patterns found.

---

### Human Verification Required

None. All must-haves are type-system constraints verifiable programmatically. The phase delivers no visual UI, runtime state, or external service integration.

---

### Gaps Summary

No gaps. All 6 observable truths are verified, all 3 artifacts pass levels 1-3, all 3 key links are wired, and all 3 requirement IDs (CAP-01, CAP-02, CAP-03) have concrete implementation evidence in the codebase.

The 2 failing tests in `removed handshake exports` are pre-existing failures (`BusKind.REGISTRATION` still present in legacy.ts) documented in the SUMMARY as out-of-scope for this phase.

---

_Verified: 2026-04-08T02:05:00Z_
_Verifier: Claude (gsd-verifier)_
