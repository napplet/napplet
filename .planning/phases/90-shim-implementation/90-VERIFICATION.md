---
phase: 90-shim-implementation
verified: 2026-04-09T12:00:00Z
status: passed
score: 5/5 must-haves verified
re_verification: false
---

# Phase 90: Shim Implementation Verification Report

**Phase Goal:** Napplets get smart keyboard forwarding and action registration out of the box by importing the shim
**Verified:** 2026-04-09T12:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | keyboard-shim.ts is deleted; keys-shim.ts exists and is loaded by the shim entry point | VERIFIED | `packages/shim/src/keyboard-shim.ts` does not exist (ls returns ENOENT); `packages/shim/src/keys-shim.ts` is 287 lines; index.ts line 5 imports `installKeysShim, handleKeysMessage, registerAction, unregisterAction, onAction` from `./keys-shim.js` and line 354 calls `installKeysShim()` |
| 2  | Shell keys.bindings messages update the local suppress list; bound combos trigger local action handlers instead of forwarding | VERIFIED | `handleBindings()` clears then repopulates `suppressMap` from `msg.bindings` (keys-shim.ts lines 89-94); `handleKeydown()` at line 153 checks `!RESERVED_KEYS.has(combo) && suppressMap.has(combo)`, calls `preventDefault()` and fires local action handlers, returns early without forwarding |
| 3  | IME composition, bare modifier keys, and Tab/Shift+Tab are never forwarded or suppressed | VERIFIED | `if (event.isComposing) return` at line 147; `isModifierOnly()` guard at line 144; `RESERVED_KEYS = new Set(['Tab', 'Shift+Tab', 'Escape'])` at line 36 — all three excluded from both suppress path and forward path |
| 4  | window.napplet.keys exposes registerAction(), unregisterAction(), and onAction() | VERIFIED | index.ts lines 332-336 install the `keys:` namespace on `window.napplet` with all three functions; function signatures in keys-shim.ts match `NappletGlobal.keys` type in core/src/types.ts lines 204-230 exactly |
| 5  | Unbound keydown events outside text inputs produce keys.forward postMessage to the parent | VERIFIED | `handleKeydown()` falls through to lines 168-178 constructing `KeysForwardMessage { type: 'keys.forward', key, code, ctrl, alt, shift, meta }` and calling `window.parent.postMessage(msg, '*')` |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/shim/src/keys-shim.ts` | NUB-KEYS smart forwarding, suppress list, action API | VERIFIED | 287 lines; exports installKeysShim, handleKeysMessage, registerAction, unregisterAction, onAction — all 5 required exports present |
| `packages/shim/src/index.ts` | Shim entry point that loads keys-shim | VERIFIED | Imports all 5 exports from `./keys-shim.js`; calls `installKeysShim()` at line 354; installs `keys:` namespace at lines 332-336 |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `packages/shim/src/index.ts` | `packages/shim/src/keys-shim.ts` | `import { installKeysShim, handleKeysMessage, registerAction, unregisterAction, onAction }` | WIRED | Line 5 of index.ts — all 5 symbols imported and used (installKeysShim called line 354; handleKeysMessage called line 261; registerAction/unregisterAction/onAction installed on window.napplet.keys lines 333-335) |
| `packages/shim/src/keys-shim.ts` | `window.parent` | `postMessage` for keys.forward, keys.registerAction, keys.unregisterAction | WIRED | Three call sites: line 177 (keys.forward), line 218 (keys.registerAction), line 237 (keys.unregisterAction) |
| `packages/shim/src/index.ts` | `window.napplet.keys` | `keys: { registerAction, unregisterAction, onAction }` | WIRED | Lines 332-336 of index.ts install the keys namespace — verified present in window.napplet installation block |

### Data-Flow Trace (Level 4)

Not applicable. Phase 90 produces a side-effect installer module (postMessage wire protocol), not a component that renders dynamic data. Data flows over postMessage to/from the shell — not through a render pipeline.

### Behavioral Spot-Checks

Step 7b: SKIPPED (no runnable entry point — shim is a browser-side module that runs inside an iframe; cannot test postMessage behavior without a shell host). Build and type-check serve as the functional verification proxy.

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| pnpm build (10 packages) | `pnpm build` | 10 successful, 10 total — Exit 0 | PASS |
| pnpm type-check (17 tasks) | `pnpm type-check` | 17 successful, 17 total — Exit 0 | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| SHIM-01 | 90-01-PLAN.md | Delete `keyboard-shim.ts`, create `keys-shim.ts` implementing NUB-KEYS smart forwarding | SATISFIED | keyboard-shim.ts absent; keys-shim.ts exists at 287 lines with full smart forwarding logic |
| SHIM-02 | 90-01-PLAN.md | Maintain local suppress list from `keys.bindings` messages; suppress bound keys, forward unbound | SATISFIED | `handleBindings()` clears+rebuilds `suppressMap`; `handleKeydown()` checks map before forwarding |
| SHIM-03 | 90-01-PLAN.md | Safety guards: skip `isComposing`, skip bare modifiers, never suppress Tab/Shift+Tab | SATISFIED | All three guards present at lines 141, 144, 147 with RESERVED_KEYS set at line 36 |
| SHIM-04 | 90-01-PLAN.md | Install `window.napplet.keys` with `registerAction()`, `unregisterAction()`, `onAction()` | SATISFIED | index.ts lines 332-336; signatures match NappletGlobal.keys type in core/src/types.ts |

No orphaned requirements. REQUIREMENTS.md maps exactly SHIM-01 through SHIM-04 to Phase 90 — all four appear in the PLAN frontmatter and all four are satisfied.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `packages/shim/src/index.ts` | 339 | `// TODO: Shell populates supported capabilities at iframe creation` inside `shell.supports()` returning `false` | Info | Pre-existing; belongs to `shell` namespace, not `keys` namespace; outside Phase 90 scope |

The TODO in `shell.supports()` is not introduced by Phase 90 and does not affect any SHIM requirement. No blockers or warnings found in Phase 90 scope.

### Human Verification Required

None. All phase 90 requirements are fully verifiable via static code analysis and build tooling.

### Gaps Summary

No gaps. All five observable truths verified. All artifacts exist, are substantive, and are wired. All four SHIM requirements satisfied with direct code evidence. Build and type-check pass with zero errors across all 10 packages and 17 tasks.

---

_Verified: 2026-04-09T12:00:00Z_
_Verifier: Claude (gsd-verifier)_
