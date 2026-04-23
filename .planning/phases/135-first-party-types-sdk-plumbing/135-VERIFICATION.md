---
phase: 135-first-party-types-sdk-plumbing
verified: 2026-04-23T12:30:00Z
status: gaps_found
score: 4/5 success criteria verified
gaps:
  - truth: "import { type IdentityDecryptMessage, type IdentityDecryptResultMessage, type IdentityDecryptErrorMessage, type IdentityDecryptErrorCode, type Rumor } from '@napplet/nub/identity' resolves"
    status: partial
    reason: "The 4 IdentityDecrypt* types resolve from @napplet/nub/identity. Rumor does NOT — it is exported from @napplet/core and @napplet/sdk but is not re-exported by the @napplet/nub/identity barrel (neither types.ts nor index.ts re-exports it). ROADMAP SC1 names @napplet/nub/identity as the import source; the actual implementation places Rumor only in @napplet/core."
    artifacts:
      - path: "packages/nub/src/identity/index.ts"
        issue: "Missing export type { Rumor } from './types.js' (or re-export from '@napplet/core'). Rumor is imported in types.ts for internal use but not re-exported."
    missing:
      - "Add Rumor (and optionally UnsignedEvent) to the type-only re-export block in packages/nub/src/identity/index.ts so that 'import { type Rumor } from @napplet/nub/identity' resolves."
  - truth: "A never-fallback assertion in the shim handler enforces exhaustiveness at compile time"
    status: failed
    reason: "No assertNever / switch-with-never-fallback pattern exists anywhere in identity/shim.ts or the broader nub/shim codebase. handleIdentityMessage takes { type: string; [key: string]: unknown } — a dynamically-typed dispatch. ROADMAP SC1 and REQUIREMENTS.md TYPES-05 both describe this assertion; the Plan-02 must_haves did not include it and the implementation omits it. Discriminated-union membership extension IS correct and type-check passes, but the handler itself is not exhaustively typed."
    artifacts:
      - path: "packages/nub/src/identity/shim.ts"
        issue: "handleIdentityMessage(msg: { type: string; [key: string]: unknown }) uses string-based if/else dispatch. No switch(msg.type) with a never-fallback default. Changing the parameter to IdentityNubMessage and using a switch with a never default would enforce compile-time exhaustiveness."
    missing:
      - "Add a never-fallback assertion — either change handleIdentityMessage to accept a typed IdentityNubMessage parameter with an exhaustive switch, or add an assertNever(msg) call in the default branch. The relay and other NUB shims share the same loose-dispatch pattern so this is a cross-NUB pattern gap, not identity-specific."
---

# Phase 135: First-Party Types + SDK Plumbing Verification Report

**Phase Goal:** The `@napplet/nub/identity` package ships the complete wire + SDK surface for `identity.decrypt` — type additions, shim handler, SDK helper, and central re-exports — so Phase 137 can cite a shipped first-party surface. Workspace type-check stays green and the identity-types-only tree-shake contract is preserved.

**Verified:** 2026-04-23T12:30:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | 3 new interfaces + IdentityDecryptErrorCode resolve from `@napplet/nub/identity`; discriminated unions include them | ✓ VERIFIED | `packages/nub/dist/identity/index.d.ts` exports all 4; `IdentityRequestMessage` = 10 members, `IdentityResultMessage` = 11 members |
| 2 | `type Rumor` resolves from `@napplet/nub/identity` (ROADMAP SC1 exact path) | ✗ FAILED | Rumor is in `@napplet/core` and re-exported by `@napplet/sdk` but NOT by `@napplet/nub/identity` barrel |
| 3 | `never`-fallback assertion enforces exhaustiveness at compile time in shim handler | ✗ FAILED | `handleIdentityMessage` takes `{ type: string }` — no exhaustive switch, no assertNever; PLAN-02 must_haves did not require this |
| 4 | `window.napplet.identity.decrypt(event)` resolves/rejects via correlation-ID promise (ROADMAP SC2) | ✓ VERIFIED | `shim.ts:95–97` handles `identity.decrypt.result` with `resolvePending(id, { rumor, sender })`; generic `.error` branch rejects; pending-map cleanup on both paths |
| 5 | `import { identityDecrypt } from '@napplet/sdk'` resolves; 4-surgical-edit pattern complete (ROADMAP SC3) | ✓ VERIFIED | SDK dist has `identityDecrypt`; 4 edits confirmed: namespace method, Rumor+UnsignedEvent core re-exports, 4 identity type re-exports, bare-name helper |
| 6 | `pnpm -r build` + `pnpm -r type-check` exit 0 across 14 packages (ROADMAP SC4 / VER-01) | ✓ VERIFIED | Live run: `BUILD_EXIT:0`, `EXIT:0` across all 14 packages (confirmed in this verification session) |
| 7 | Identity-types-only tree-shake bundle does NOT pull shim/sdk runtime symbols (ROADMAP SC5 / VER-05) | ✓ VERIFIED | 129-byte bundle; all 7 forbidden symbols `COUNT=0` per `/tmp/napplet-135-ver-05-treeshake.log`; `VER05_EXIT=0` |

**Score:** 4/5 success criteria verified (truths 1, 4, 5, 6, 7 — 5 truths pass; truths 2 and 3 fail, both relate to SC1)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/core/src/types.ts` | UnsignedEvent + Rumor interfaces; `NappletGlobal.identity.decrypt` method type | ✓ VERIFIED | `UnsignedEvent` (5 fields, no `sig`), `Rumor extends UnsignedEvent { id: string }`, `decrypt(event: NostrEvent): Promise<{ rumor: Rumor; sender: string }>` all present |
| `packages/core/src/index.ts` | Barrel re-exports UnsignedEvent + Rumor | ✓ VERIFIED | Lines 41–42 export both types |
| `packages/nub/src/identity/types.ts` | IdentityDecryptMessage, IdentityDecryptResultMessage, IdentityDecryptErrorMessage, IdentityDecryptErrorCode (8 codes); union extensions | ✓ VERIFIED | All 4 type surfaces present; 8-code union confirmed; IdentityRequestMessage +1, IdentityResultMessage +2 |
| `packages/nub/src/identity/index.ts` | Type-only re-exports of 4 new decrypt types; runtime re-exports of `decrypt` (shim) + `identityDecrypt` (sdk) | ✓ VERIFIED | Type block: lines 47–50 include all 4; shim block: line 67 has `decrypt,`; sdk block: line 82 has `identityDecrypt,` |
| `packages/nub/src/identity/shim.ts` | `decrypt(event)` public function + `identity.decrypt.result` handler branch | ✓ VERIFIED | `export function decrypt` at line 292; `.decrypt.result` branch at line 95–97; pending-map cleanup on both resolve/reject |
| `packages/shim/src/index.ts` | `decrypt` imported from `@napplet/nub/identity/shim`; mounted on `window.napplet.identity` | ✓ VERIFIED | Lines 37 (import) + 183 (mount) |
| `packages/nub/src/identity/sdk.ts` | `identityDecrypt(event)` helper with `requireIdentity()` guard | ✓ VERIFIED | `export function identityDecrypt` at line 187; delegates to `requireIdentity().decrypt(event)` |
| `packages/sdk/src/index.ts` | identity.decrypt namespace method; Rumor/UnsignedEvent core re-exports; 4 identity type re-exports; identityDecrypt bare-name re-export | ✓ VERIFIED | All 4 surgical edits confirmed at lines 664–665, 799–800, 858–861, 1045 |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `identity/shim.ts decrypt()` | `window.parent` | `sendRequest<T>` helper reuse | ✓ WIRED | `sendRequest<{ rumor: Rumor; sender: string }>(msg)` at line 298 |
| `identity/shim.ts handleIdentityMessage` | `.result` branch | `type === 'identity.decrypt.result'` | ✓ WIRED | Line 95–97; resolves with `{ rumor: result.rumor, sender: result.sender }` |
| `identity/shim.ts handleIdentityMessage` | `.error` branch | `type.endsWith('.error')` generic branch | ✓ WIRED | Lines 59–65; rejects with `new Error(errorCode)`; cleans pending-map |
| `packages/shim/src/index.ts` | identity.decrypt.* routing | Pre-existing `startsWith('identity.') && endsWith('.result'/.error')` at line 105 | ✓ WIRED | No central-shim routing edit needed (SHIM-03 confirmed) |
| `packages/sdk/src/index.ts` identity.decrypt | `window.napplet.identity.decrypt` | `requireNapplet().identity.decrypt(event)` | ✓ WIRED | Line 665 |
| `packages/nub/src/identity/sdk.ts identityDecrypt` | `window.napplet.identity.decrypt` | `requireIdentity().decrypt(event)` | ✓ WIRED | Line 188 |
| `@napplet/nub/identity` barrel | `Rumor` type | NOT re-exported | ✗ NOT WIRED | Rumor is imported internally in `types.ts` but not re-exported; breaks SC1 import path |

---

### Data-Flow Trace (Level 4)

Not applicable for this phase — all artifacts are TypeScript type declarations and protocol plumbing (no dynamic data rendering). The shim functions are wired to `window.parent.postMessage` and pending-Promise resolution; the data flow is the postMessage wire protocol itself (unverifiable statically).

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `identityDecrypt` present in SDK dist | `grep identityDecrypt packages/sdk/dist/index.js` | Found | ✓ PASS |
| `decrypt` function present in built identity shim chunk | `grep 'function decrypt' packages/nub/dist/chunk-LZJPDDFV.js` | Line 147 | ✓ PASS |
| Workspace build exit 0 | `pnpm -r build; echo BUILD_EXIT:$?` | `BUILD_EXIT:0` | ✓ PASS |
| Workspace type-check exit 0 | `pnpm -r type-check; echo EXIT:$?` | `EXIT:0` | ✓ PASS |
| Tree-shake bundle VER05_EXIT=0 | `/tmp/napplet-135-ver-05-treeshake.log` tail | `VER05_EXIT=0` | ✓ PASS |
| `Rumor` from `@napplet/nub/identity` barrel | `grep Rumor packages/nub/dist/identity/index.d.ts` | 0 matches | ✗ FAIL |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| TYPES-01 | 135-01 | 3 new message interfaces in `@napplet/nub/identity` | ✓ SATISFIED | `IdentityDecryptMessage`, `IdentityDecryptResultMessage`, `IdentityDecryptErrorMessage` in `types.ts` and barrel |
| TYPES-02 | 135-01 | `IdentityDecryptErrorCode` 8-value string-literal union | ✓ SATISFIED | 8 codes confirmed: class-forbidden, signer-denied, signer-unavailable, decrypt-failed, malformed-wrap, impersonation, unsupported-encryption, policy-denied |
| TYPES-03 | 135-01 | `Rumor` type `UnsignedEvent & { id: string }` in `@napplet/core` | ✓ SATISFIED | `packages/core/src/types.ts:147`; NO `sig` field; JSDoc warns against treating as signed |
| TYPES-04 | 135-01 | `NappletGlobal.identity.decrypt(event: NostrEvent)` method type | ✓ SATISFIED | `packages/core/src/types.ts:543`; return type `Promise<{ rumor: Rumor; sender: string }>` |
| TYPES-05 | 135-01 | Discriminated-union membership + `never`-fallback assertion | ✗ BLOCKED | Union membership extension DONE (IdentityRequestMessage +1, IdentityResultMessage +2); `never`-fallback assertion NOT implemented. REQUIREMENTS.md also references wrong union names (IdentityInbound/IdentityOutbound — these don't exist; the actual extended types are IdentityRequestMessage/IdentityResultMessage). |
| TYPES-06 | 135-04 | Workspace-wide `pnpm -r type-check` green (discriminated-union exhaustiveness closure) | ✓ SATISFIED | Confirmed: `EXIT:0` in this session |
| SHIM-01 | 135-02 | Handler routes `identity.decrypt.result` + `.error` via correlation ID | ✓ SATISFIED | `.result` branch at `shim.ts:95`; generic `.error` branch at `:59`; pending-map cleanup on both paths |
| SHIM-02 | 135-02 | `decrypt(event)` function bound to `window.napplet.identity.decrypt` | ✓ SATISFIED | `export function decrypt` in `identity/shim.ts`; mounted on `window.napplet.identity` in central shim |
| SHIM-03 | 135-02 | No central-shim edit required (pre-existing routing absorbs new envelopes) | ✓ SATISFIED | Existing `startsWith('identity.') && endsWith('.result'/.error')` at `shim/src/index.ts:105` absorbs both new envelope types; only 2 surgical edits needed (import + mount), not routing |
| SDK-01 | 135-03 | `identityDecrypt(event)` bare-name helper in `@napplet/nub/identity/sdk.ts` | ✓ SATISFIED | `export function identityDecrypt` at `sdk.ts:187`; uses `requireIdentity()` guard |
| SDK-02 | 135-03 | `@napplet/sdk` re-exports via 4-surgical-edit pattern | ✓ SATISFIED | All 4 edits confirmed in `packages/sdk/src/index.ts`; `identityDecrypt` in SDK dist |
| VER-01 | 135-04 | `pnpm -r build` + `pnpm -r type-check` exit 0 across 14 packages | ✓ SATISFIED | Live verification: `BUILD_EXIT:0`, `EXIT:0` |
| VER-05 | 135-04 | Identity-types-only tree-shake bundle contains zero runtime symbols | ✓ SATISFIED | 129-byte bundle; 7 forbidden symbols all `COUNT=0`; `VER05_EXIT=0` |

**Out-of-scope requirements (correctly deferred):**
- VER-02: Cross-repo hygiene grep → Phase 137
- VER-03: Spec conformance grep → Phase 137
- VER-04: Empirical CSP verification → Phase 136
- VER-06: NIP-5D amendment → Phase 138

---

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `packages/nub/src/identity/shim.ts` (line 53) | `handleIdentityMessage(msg: { type: string; [key: string]: unknown })` — dynamic string dispatch prevents compile-time exhaustiveness | ⚠️ Warning | Exhaustiveness cannot be statically verified for this handler; same pattern exists in relay, storage, ifc shimds — this is a codebase-wide pattern, not a regression from Phase 135 |

No TODOs, FIXMEs, placeholder returns, or hardcoded empty-data stubs found in Phase 135 source files.

---

### GATE-04 Deferral Assessment

The shim-side class-short-circuit (checking `window.napplet.class !== 1` before calling decrypt) was deferred. The deferral rationale is SOUND: `NappletGlobal` has no `class` property slot in v0.29.0 — confirmed by reading `packages/core/src/types.ts`. The `NappletGlobal` interface exposes `relay`, `ifc`, `storage`, `keys`, `identity`, and `shell` but no `class` slot. Shell enforcement is the authoritative gate per v0.29.0 STATE.md; the shim-side check is observability-only per CONTEXT.md. Deferral is not a gap.

---

### Human Verification Required

No items require human verification for this phase. All runtime behaviors are TypeScript plumbing and can be fully verified statically and via type-check.

---

### Gaps Summary

Two gaps block SC1 of the ROADMAP success criteria. Both relate to the same criterion:

**Gap 1 — Rumor not re-exported from `@napplet/nub/identity`:**

ROADMAP SC1 specifies the exact import path: `import { ..., type Rumor } from '@napplet/nub/identity'`. The implementation correctly placed `Rumor` in `@napplet/core` (TYPES-03) and re-exports it from `@napplet/sdk`, but did not add it to the `@napplet/nub/identity` barrel. This is a 1-line fix (`export type { Rumor } from '@napplet/core'` or from `./types.js` after adding a re-export in types.ts). The PLAN-01 must_haves described the correct import path as `from '@napplet/core'`, which means the PLAN completed correctly against its own must_haves — but the ROADMAP SC1 expected a wider re-export surface.

**Gap 2 — No `never`-fallback assertion in shim handler:**

ROADMAP SC1 and REQUIREMENTS.md TYPES-05 describe a `never`-fallback assertion that enforces exhaustiveness at compile time. This pattern does not exist in `handleIdentityMessage` or anywhere in the identity NUB source. The handler uses dynamic `{ type: string }` dispatch — the same pattern used by all other NUB shims (relay, storage, ifc). Union membership extension (SC1's other component) IS correctly implemented and the workspace type-check passes. Adding an `assertNever` would require changing the handler's parameter type from `{ type: string }` to `IdentityNubMessage` and adding an exhaustive switch.

Both gaps are in the type-surface layer. All runtime functionality (shim handler routing, SDK helpers, workspace build, tree-shake) is verified and working.

---

_Verified: 2026-04-23T12:30:00Z_
_Verifier: Claude (gsd-verifier)_
