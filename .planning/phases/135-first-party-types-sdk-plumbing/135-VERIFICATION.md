---
phase: 135-first-party-types-sdk-plumbing
verified: 2026-04-23T12:30:00Z
status: passed
score: 5/5 success criteria verified
re_verified: 2026-04-23T14:00:00Z
re_verification:
  previous_status: gaps_found
  previous_score: 4/5
  gaps_closed:
    - "Rumor + UnsignedEvent re-exported from @napplet/nub/identity barrel (commit 1e22fdd)"
    - "handleIdentityMessage refactored to exhaustive switch with assertNever fallback (commit 2ca2166)"
  gaps_remaining: []
  regressions: []
---

# Phase 135: First-Party Types + SDK Plumbing Verification Report

**Phase Goal:** The `@napplet/nub/identity` package ships the complete wire + SDK surface for `identity.decrypt` — type additions, shim handler, SDK helper, and central re-exports — so Phase 137 can cite a shipped first-party surface. Workspace type-check stays green and the identity-types-only tree-shake contract is preserved.

**Verified:** 2026-04-23T12:30:00Z
**Re-verified:** 2026-04-23T14:00:00Z
**Status:** passed
**Re-verification:** Yes — after gap closure plan 135-05

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | 3 new interfaces + IdentityDecryptErrorCode resolve from `@napplet/nub/identity`; discriminated unions include them | ✓ VERIFIED | `packages/nub/dist/identity/index.d.ts` exports all 4; `IdentityRequestMessage` = 10 members, `IdentityResultMessage` = 11 members |
| 2 | `type Rumor` resolves from `@napplet/nub/identity` (ROADMAP SC1 exact path) | ✓ VERIFIED | `packages/nub/dist/identity/index.d.ts` line 2: `export { Rumor, UnsignedEvent } from '@napplet/core'`; confirmed via grep |
| 3 | `never`-fallback assertion enforces exhaustiveness at compile time in shim handler | ✓ VERIFIED | `handleIdentityMessage` uses `switch (narrowed.type)` with `default: assertNever(narrowed)`; built chunk confirms `assertNever` at line 55; exhaustiveness proof log shows type-error on unknown type injection |
| 4 | `window.napplet.identity.decrypt(event)` resolves/rejects via correlation-ID promise (ROADMAP SC2) | ✓ VERIFIED | `shim.ts:89–93` handles `identity.decrypt.result` and `identity.decrypt.error` with dedicated switch cases; pending-map cleanup on both paths |
| 5 | `import { identityDecrypt } from '@napplet/sdk'` resolves; 4-surgical-edit pattern complete (ROADMAP SC3) | ✓ VERIFIED | SDK dist has `identityDecrypt`; 4 edits confirmed: namespace method, Rumor+UnsignedEvent core re-exports, 4 identity type re-exports, bare-name helper |
| 6 | `pnpm -r build` + `pnpm -r type-check` exit 0 across 14 packages (ROADMAP SC4 / VER-01) | ✓ VERIFIED | Re-verification run: `BUILD_EXIT:0`, `TYPE_CHECK_EXIT:0` across all 14 packages |
| 7 | Identity-types-only tree-shake bundle does NOT pull shim/sdk runtime symbols (ROADMAP SC5 / VER-05) | ✓ VERIFIED | 84-byte bundle; all 9 forbidden symbols (including `assertNever` and `decrypt`) COUNT=0 |

**Score:** 5/5 success criteria verified (all 7 truths pass; truths 2 and 3 closed by plan 135-05)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/core/src/types.ts` | UnsignedEvent + Rumor interfaces; `NappletGlobal.identity.decrypt` method type | ✓ VERIFIED | `UnsignedEvent` (5 fields, no `sig`), `Rumor extends UnsignedEvent { id: string }`, `decrypt(event: NostrEvent): Promise<{ rumor: Rumor; sender: string }>` all present |
| `packages/core/src/index.ts` | Barrel re-exports UnsignedEvent + Rumor | ✓ VERIFIED | Lines 41–42 export both types |
| `packages/nub/src/identity/types.ts` | IdentityDecryptMessage, IdentityDecryptResultMessage, IdentityDecryptErrorMessage, IdentityDecryptErrorCode (8 codes); union extensions | ✓ VERIFIED | All 4 type surfaces present; 8-code union confirmed; IdentityRequestMessage +1, IdentityResultMessage +2 |
| `packages/nub/src/identity/index.ts` | Type-only re-exports of 4 new decrypt types + Rumor + UnsignedEvent; runtime re-exports of `decrypt` (shim) + `identityDecrypt` (sdk) | ✓ VERIFIED | Type block: lines 47–51 include all 4 decrypt types; cross-package block: lines 55–58 export `Rumor, UnsignedEvent` from `@napplet/core`; shim block: `decrypt,`; sdk block: `identityDecrypt,` |
| `packages/nub/src/identity/shim.ts` | `decrypt(event)` public function + exhaustive `switch` with `assertNever` fallback | ✓ VERIFIED | `export function decrypt` at line 324; exhaustive `switch(narrowed.type)` at line 60; `assertNever(narrowed)` in default at line 114; `assertNever` defined at line 173 |
| `packages/shim/src/index.ts` | `decrypt` imported from `@napplet/nub/identity/shim`; mounted on `window.napplet.identity` | ✓ VERIFIED | Lines 37 (import) + 183 (mount) |
| `packages/nub/src/identity/sdk.ts` | `identityDecrypt(event)` helper with `requireIdentity()` guard | ✓ VERIFIED | `export function identityDecrypt` at line 187; delegates to `requireIdentity().decrypt(event)` |
| `packages/sdk/src/index.ts` | identity.decrypt namespace method; Rumor/UnsignedEvent core re-exports; 4 identity type re-exports; identityDecrypt bare-name re-export | ✓ VERIFIED | All 4 surgical edits confirmed at lines 664–665, 799–800, 858–861, 1045 |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `identity/shim.ts decrypt()` | `window.parent` | `sendRequest<T>` helper reuse | ✓ WIRED | `sendRequest<{ rumor: Rumor; sender: string }>(msg)` at line 330 |
| `identity/shim.ts handleIdentityMessage` | `.result` branch | `case 'identity.decrypt.result':` in exhaustive switch | ✓ WIRED | Lines 89–91; resolves with `{ rumor: narrowed.rumor, sender: narrowed.sender }` |
| `identity/shim.ts handleIdentityMessage` | `.error` branch | `case 'identity.decrypt.error':` in exhaustive switch | ✓ WIRED | Lines 92–94; rejects with `new Error(narrowed.error)`; pending-map cleanup |
| `identity/shim.ts handleIdentityMessage` | `never` fallback | `default: assertNever(narrowed)` | ✓ WIRED | Line 114; enforces compile-time exhaustiveness (TYPES-05) |
| `packages/shim/src/index.ts` | identity.decrypt.* routing | Pre-existing `startsWith('identity.') && endsWith('.result'/.error')` at line 105 | ✓ WIRED | No central-shim routing edit needed (SHIM-03 confirmed) |
| `packages/sdk/src/index.ts` identity.decrypt | `window.napplet.identity.decrypt` | `requireNapplet().identity.decrypt(event)` | ✓ WIRED | Line 665 |
| `packages/nub/src/identity/sdk.ts identityDecrypt` | `window.napplet.identity.decrypt` | `requireIdentity().decrypt(event)` | ✓ WIRED | Line 188 |
| `@napplet/nub/identity` barrel | `Rumor, UnsignedEvent` types | `export type { Rumor, UnsignedEvent } from '@napplet/core'` | ✓ WIRED | Lines 55–58 of `index.ts`; confirmed in `dist/identity/index.d.ts` line 2 |

---

### Data-Flow Trace (Level 4)

Not applicable for this phase — all artifacts are TypeScript type declarations and protocol plumbing (no dynamic data rendering). The shim functions are wired to `window.parent.postMessage` and pending-Promise resolution; the data flow is the postMessage wire protocol itself (unverifiable statically).

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `identityDecrypt` present in SDK dist | `grep identityDecrypt packages/sdk/dist/index.js` | Found | ✓ PASS |
| `decrypt` and `assertNever` in built identity shim chunk | `grep -n "assertNever\|switch" packages/nub/dist/chunk-WYDLJHJN.js` | switch at line 7, assertNever at line 55 | ✓ PASS |
| `Rumor` from `@napplet/nub/identity` barrel in dist | `grep Rumor packages/nub/dist/identity/index.d.ts` | Line 2: `export { Rumor, UnsignedEvent } from '@napplet/core'` | ✓ PASS |
| Workspace build exit 0 | `pnpm -r build; echo BUILD_EXIT:$?` | `BUILD_EXIT:0` | ✓ PASS |
| Workspace type-check exit 0 | `pnpm -r type-check; echo TYPE_CHECK_EXIT:$?` | `TYPE_CHECK_EXIT:0` | ✓ PASS |
| Tree-shake bundle VER05_EXIT: 9 symbols = 0 | esbuild identity/types.ts, check 9 forbidden symbols | All COUNT=0; bundle 84 bytes | ✓ PASS |
| assertNever not in types-only tree-shake | esbuild identity/types.ts bundle | `assertNever:COUNT=0 OK` | ✓ PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| TYPES-01 | 135-01 | 3 new message interfaces in `@napplet/nub/identity` | ✓ SATISFIED | `IdentityDecryptMessage`, `IdentityDecryptResultMessage`, `IdentityDecryptErrorMessage` in `types.ts` and barrel |
| TYPES-02 | 135-01 | `IdentityDecryptErrorCode` 8-value string-literal union | ✓ SATISFIED | 8 codes confirmed: class-forbidden, signer-denied, signer-unavailable, decrypt-failed, malformed-wrap, impersonation, unsupported-encryption, policy-denied |
| TYPES-03 | 135-01 | `Rumor` type `UnsignedEvent & { id: string }` in `@napplet/core` | ✓ SATISFIED | `packages/core/src/types.ts:147`; NO `sig` field; JSDoc warns against treating as signed |
| TYPES-04 | 135-01 | `NappletGlobal.identity.decrypt(event: NostrEvent)` method type | ✓ SATISFIED | `packages/core/src/types.ts:543`; return type `Promise<{ rumor: Rumor; sender: string }>` |
| TYPES-05 | 135-01 | Discriminated-union membership + `never`-fallback assertion | ✓ SATISFIED | Union membership extension DONE (IdentityRequestMessage +1, IdentityResultMessage +2); `assertNever(narrowed)` in `default` branch of exhaustive switch in `handleIdentityMessage`; exhaustiveness proof log confirms type-error on unknown type injection |
| TYPES-06 | 135-04 | Workspace-wide `pnpm -r type-check` green (discriminated-union exhaustiveness closure) | ✓ SATISFIED | Confirmed: `TYPE_CHECK_EXIT:0` in re-verification run |
| SHIM-01 | 135-02 | Handler routes `identity.decrypt.result` + `.error` via correlation ID | ✓ SATISFIED | Dedicated `case 'identity.decrypt.result':` at `shim.ts:89` and `case 'identity.decrypt.error':` at `shim.ts:92`; pending-map cleanup on both paths |
| SHIM-02 | 135-02 | `decrypt(event)` function bound to `window.napplet.identity.decrypt` | ✓ SATISFIED | `export function decrypt` in `identity/shim.ts`; mounted on `window.napplet.identity` in central shim |
| SHIM-03 | 135-02 | No central-shim edit required (pre-existing routing absorbs new envelopes) | ✓ SATISFIED | Existing `startsWith('identity.') && endsWith('.result'/.error')` at `shim/src/index.ts:105` absorbs both new envelope types; only 2 surgical edits needed (import + mount), not routing |
| SDK-01 | 135-03 | `identityDecrypt(event)` bare-name helper in `@napplet/nub/identity/sdk.ts` | ✓ SATISFIED | `export function identityDecrypt` at `sdk.ts:187`; uses `requireIdentity()` guard |
| SDK-02 | 135-03 | `@napplet/sdk` re-exports via 4-surgical-edit pattern | ✓ SATISFIED | All 4 edits confirmed in `packages/sdk/src/index.ts`; `identityDecrypt` in SDK dist |
| VER-01 | 135-04 | `pnpm -r build` + `pnpm -r type-check` exit 0 across 14 packages | ✓ SATISFIED | Re-verification run: `BUILD_EXIT:0`, `TYPE_CHECK_EXIT:0` |
| VER-05 | 135-04 | Identity-types-only tree-shake bundle contains zero runtime symbols | ✓ SATISFIED | 84-byte bundle; 9 forbidden symbols all COUNT=0 (expanded from 7 to include `assertNever` and `decrypt`) |

**Out-of-scope requirements (correctly deferred):**
- VER-02: Cross-repo hygiene grep → Phase 137
- VER-03: Spec conformance grep → Phase 137
- VER-04: Empirical CSP verification → Phase 136
- VER-06: NIP-5D amendment → Phase 138

---

### Anti-Patterns Found

No anti-patterns. The previous warning (`handleIdentityMessage` used dynamic string dispatch) is resolved: the handler now uses a typed `IdentityNubMessage` parameter with an exhaustive `switch` and `assertNever` default.

No TODOs, FIXMEs, placeholder returns, or hardcoded empty-data stubs found in Phase 135 source files.

---

### GATE-04 Deferral Assessment

Unchanged from initial verification. The shim-side class-short-circuit (checking `window.napplet.class !== 1` before calling decrypt) was deferred. The deferral rationale is SOUND: `NappletGlobal` has no `class` property slot in v0.29.0 — confirmed by reading `packages/core/src/types.ts`. The `NappletGlobal` interface exposes `relay`, `ifc`, `storage`, `keys`, `identity`, and `shell` but no `class` slot. Shell enforcement is the authoritative gate per v0.29.0 STATE.md; the shim-side check is observability-only per CONTEXT.md. Deferral is not a gap.

---

### Human Verification Required

No items require human verification for this phase. All runtime behaviors are TypeScript plumbing and can be fully verified statically and via type-check.

---

### Re-Verification Summary

Both gaps from the initial verification are closed:

**Gap 1 (CLOSED) — Rumor not re-exported from `@napplet/nub/identity`:**
Plan 135-05 commit 1e22fdd added `export type { Rumor, UnsignedEvent } from '@napplet/core'` as a dedicated cross-package type re-export block in `packages/nub/src/identity/index.ts` (lines 53–58). The built `dist/identity/index.d.ts` line 2 confirms the re-export is present and resolvable. `import { type Rumor } from '@napplet/nub/identity'` now resolves to the correct type.

**Gap 2 (CLOSED) — No `never`-fallback assertion in shim handler:**
Plan 135-05 commit 2ca2166 refactored `handleIdentityMessage` from a dynamic `{ type: string }` if/else dispatch to a typed `const narrowed = msg as unknown as IdentityNubMessage` cast followed by an exhaustive `switch(narrowed.type)` with `default: assertNever(narrowed)`. The `assertNever` function (lines 173–175) is a compile-time-only helper; it appears in the built shim chunk but NOT in the identity-types-only tree-shake bundle (COUNT=0 confirmed), preserving VER-05.

No regressions detected. `TYPE_CHECK_EXIT:0` and `BUILD_EXIT:0` confirmed across 14 packages.

---

_Initially verified: 2026-04-23T12:30:00Z_
_Re-verified: 2026-04-23T14:00:00Z_
_Verifier: Claude (gsd-verifier)_
