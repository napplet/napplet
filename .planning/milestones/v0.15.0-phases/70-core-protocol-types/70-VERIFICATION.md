---
phase: 70-core-protocol-types
verified: 2026-04-07T10:46:00Z
status: gaps_found
score: 3/5 must-haves verified (success criteria) + WIRE-02, WIRE-03, RT-01 through RT-04 not addressed by this phase
re_verification: false
gaps:
  - truth: "RT-01 through RT-04 are assigned to Phase 70 in REQUIREMENTS.md traceability but are not addressed by the phase"
    status: partial
    reason: "The ROADMAP traceability table maps RT-01, RT-02, RT-03, RT-04 to Phase 70, but Phase 70's goal, ROADMAP success criteria, and PLAN all scope Phase 70 to type-level changes only. RT-01 (runtime derives identity at iframe creation), RT-02 (runtime stamps messages with derived pubkey), RT-03 (ACL via internal pubkey), and RT-04 (storage scoping, IPC, signer proxy with internal identity) are runtime behavior changes with no implementation in any existing package. packages/runtime and packages/shell do not exist on main branch."
    artifacts:
      - path: ".planning/REQUIREMENTS.md"
        issue: "RT-01, RT-02, RT-03, RT-04 mapped to Phase 70 but have no implementation. The runtime package is absent from the repository."
    missing:
      - "Clarify whether RT-01 through RT-04 are intended for a future phase or if the traceability table is wrong"
      - "If Phase 70 owns these: create packages/runtime or implement RT-01 through RT-04 in an existing package"
      - "If a later phase owns these: update REQUIREMENTS.md traceability table to map them to the correct phase"
  - truth: "WIRE-02 and WIRE-03 (shell identifies sender via message.source; identity established at iframe creation) are assigned to Phase 70 but have no implementing code"
    status: partial
    reason: "WIRE-02 and WIRE-03 are architectural claims about how the shell runtime operates. Phase 70 removes the old AUTH-based identity mechanism from core types, which is a necessary precondition, but no new implementation of Window-reference-based identity or pre-creation identity mapping exists in any package on main branch. These may be intended for a later phase."
    artifacts:
      - path: ".planning/REQUIREMENTS.md"
        issue: "WIRE-02 and WIRE-03 mapped to Phase 70 in traceability table but the phase goal and success criteria only cover type removals"
    missing:
      - "Clarify whether WIRE-02 and WIRE-03 are satisfied by type-level changes alone or require runtime implementation"
      - "If runtime implementation is required: update traceability to assign to the phase that implements the runtime"
human_verification: []
---

# Phase 70: Core Protocol Types Verification Report

**Phase Goal:** @napplet/core defines a wire protocol with no cryptographic identity requirement for napplets
**Verified:** 2026-04-07T10:46:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Summary

Phase 70's five ROADMAP success criteria are all verified against the codebase. The type package changes are complete, clean, and correctly wired. The gaps are not about missing or broken artifacts — they are a requirement traceability mismatch: `REQUIREMENTS.md` maps `RT-01` through `RT-04` and `WIRE-02`/`WIRE-03` to Phase 70, but those requirements describe runtime behavior that the phase goal and success criteria never claim to address.

---

## Goal Achievement

### Observable Truths (from ROADMAP success criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | RegisterPayload, IdentityPayload, VERB_REGISTER, VERB_IDENTITY, AUTH_KIND removed from @napplet/core exports | VERIFIED | `grep -c` returns 0 for all five names in core/src/types.ts, constants.ts, and index.ts |
| 2 | BusKind.REGISTRATION (29000) removed | VERIFIED | No `REGISTRATION` key in the BusKind object in constants.ts; test asserts `'REGISTRATION' in BusKind === false` |
| 3 | Core types package builds and type-checks clean | VERIFIED | `pnpm build` 4/4 success; `pnpm type-check` 5/5 success (all cached, no errors) |
| 4 | @napplet/core exported types express unsigned message template contract | VERIFIED | EventTemplate JSDoc at types.ts line 138-157 explicitly states "Napplets never sign events themselves. The shell identifies the sender..." |
| 5 | Downstream packages (@napplet/shim, @napplet/sdk) import from @napplet/core without type errors | VERIFIED | Both packages build and type-check clean; shim/src/types.ts imports BusKind, SHELL_BRIDGE_URI, PROTOCOL_VERSION from @napplet/core with 3 import-from lines |

**Score:** 5/5 ROADMAP success criteria verified

### Plan Must-Haves (from PLAN frontmatter)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | RegisterPayload, IdentityPayload, VERB_REGISTER, VERB_IDENTITY, AUTH_KIND not exported from @napplet/core | VERIFIED | 0 occurrences in core src |
| 2 | BusKind.REGISTRATION removed | VERIFIED | Not present in constants.ts |
| 3 | @napplet/core types express unsigned message template contract | VERIFIED | EventTemplate JSDoc; file header updated |
| 4 | pnpm build succeeds across all packages with zero type errors | VERIFIED | 4/4 build, 5/5 type-check, 14/14 core unit tests pass |
| 5 | @napplet/shim and @napplet/sdk build without type errors after removals | VERIFIED | Both pass build and type-check |

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/core/src/types.ts` | Protocol types without handshake payloads; EventTemplate JSDoc | VERIFIED | RegisterPayload and IdentityPayload absent; EventTemplate JSDoc at lines 138-157 documents unsigned-message contract |
| `packages/core/src/constants.ts` | Constants without AUTH_KIND, VERB_REGISTER, VERB_IDENTITY, BusKind.REGISTRATION | VERIFIED | All four removed; PROTOCOL_VERSION = '3.0.0' |
| `packages/core/src/index.ts` | Barrel exports without handshake types or AUTH constants | VERIFIED | Export lists match expected; no handshake names present |
| `packages/core/src/index.test.ts` | Updated test suite reflecting removed exports | VERIFIED | AUTH_KIND removed from imports; `removed handshake exports` describe block present with REGISTRATION assertions |
| `packages/shim/src/types.ts` | Re-exports from @napplet/core without removed constants; local deprecated constants | VERIFIED | 3 import-from lines to @napplet/core; AUTH_KIND, VERB_REGISTER, VERB_IDENTITY defined locally with @deprecated JSDoc (3 occurrences each) |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `packages/shim/src/types.ts` | `@napplet/core` | re-export statements | VERIFIED | 3 `from '@napplet/core'` lines present |
| `packages/sdk/src/index.ts` | `@napplet/core` | type re-exports | VERIFIED | `import type { NappletGlobal, NostrEvent, ... } from '@napplet/core'` plus 5 type re-export lines at bottom |
| `packages/core/src/index.ts` | `packages/core/src/types.ts` | barrel re-exports | VERIFIED | `from './types.js'` present for both type exports and ALL_CAPABILITIES value export |

---

## Data-Flow Trace (Level 4)

Not applicable — this phase produces type definitions and protocol constants only. No components rendering dynamic data.

---

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Core unit tests pass (14 tests) | `pnpm test` | 14/14 passed | PASS |
| Full build succeeds | `pnpm build` | 4/4 packages, 0 errors | PASS |
| Type-check clean | `pnpm type-check` | 5/5 packages, 0 errors | PASS |
| PROTOCOL_VERSION is 3.0.0 | Read constants.ts | `export const PROTOCOL_VERSION = '3.0.0' as const;` | PASS |
| BusKind has no REGISTRATION key | Grep constants.ts | 0 matches | PASS |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| WIRE-01 | 70-01-PLAN.md | Napplets send raw NIP-01 messages without signing — no crypto in wire protocol | SATISFIED | Core no longer exports handshake types; EventTemplate defines unsigned message; protocol contract updated |
| WIRE-02 | 70-01-PLAN.md | Shell identifies napplet sender via unforgeable message.source Window reference | NEEDS HUMAN / PARTIAL | Phase 70 removes the old AUTH-based identification from core types (necessary condition), but no code implementing Window-reference-based sender identification exists on main branch. The traceability table maps this to Phase 70 but the ROADMAP success criteria do not claim to implement it. |
| WIRE-03 | 70-01-PLAN.md | Identity established at iframe creation — shell maps Window → (dTag, aggregateHash) before first message | NEEDS HUMAN / PARTIAL | Same as WIRE-02: the AUTH handshake approach is removed from types, but pre-creation identity mapping is not implemented. packages/runtime and packages/shell do not exist on main branch. |
| WIRE-04 | 70-01-PLAN.md | REGISTER/IDENTITY/AUTH three-phase handshake removed from the protocol | SATISFIED | VERB_REGISTER, VERB_IDENTITY, AUTH_KIND, RegisterPayload, IdentityPayload, BusKind.REGISTRATION all removed from @napplet/core. |
| RT-01 | 70-01-PLAN.md | Shell/runtime derives identity pubkey at iframe creation, not at AUTH | NOT SATISFIED | No runtime or shell package exists on main branch. This is a runtime behavior requirement with no type-level evidence. |
| RT-02 | 70-01-PLAN.md | Runtime stamps inbound napplet messages with derived pubkey internally | NOT SATISFIED | No runtime or shell package exists on main branch. |
| RT-03 | 70-01-PLAN.md | ACL enforcement continues via internally-assigned pubkey | NOT SATISFIED | No runtime or shell package exists on main branch. |
| RT-04 | 70-01-PLAN.md | Storage scoping, IPC routing, signer proxy continue with internal identity | NOT SATISFIED | No runtime or shell package exists on main branch. |

**Note:** The REQUIREMENTS.md traceability table maps RT-01 through RT-04 and WIRE-02/WIRE-03 to Phase 70, but Phase 70's ROADMAP goal, success criteria, and PLAN all scope Phase 70 exclusively to type-level changes. The phase delivers exactly what its success criteria require. The traceability mismatch appears to be a planning artifact — these runtime requirements presumably belong to a later phase.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `packages/shim/src/types.ts` | 17-23 | `AUTH_KIND`, `VERB_REGISTER`, `VERB_IDENTITY` defined locally with `@deprecated` | Info | Intentional — explicitly flagged for removal in Phase 71, co-located with the code that will be deleted. Not a blocker. |

No blockers found. The deprecated constants are an intentional bridge to Phase 71.

---

## Human Verification Required

None for the type-level changes. The RT-01 through RT-04 requirements cannot be verified against this codebase because the runtime package does not exist on main — these require either clarification that they belong to a later phase, or implementation.

---

## Gaps Summary

Phase 70 fully achieves its stated ROADMAP goal and all five success criteria. All type-level changes are complete, correct, and verified.

The gap is a **traceability mismatch** in `REQUIREMENTS.md`: RT-01, RT-02, RT-03, RT-04, WIRE-02, and WIRE-03 are mapped to Phase 70 in the traceability table, but:

1. Phase 70's ROADMAP goal is "core types package" scope only
2. Phase 70's ROADMAP success criteria make no mention of RT-01 through RT-04 or of implementing WIRE-02/WIRE-03
3. The `packages/runtime` and `packages/shell` packages that would implement these requirements do not exist on main branch

**Recommended resolution:** Update `REQUIREMENTS.md` to re-map RT-01 through RT-04 (and possibly WIRE-02, WIRE-03) to the phase that will implement the runtime (a future phase after Phase 71). No changes to the Phase 70 codebase are needed — the implementation is correct for what the phase was designed to deliver.

---

_Verified: 2026-04-07T10:46:00Z_
_Verifier: Claude (gsd-verifier)_
