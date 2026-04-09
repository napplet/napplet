# Phase 83: Dead Code Removal - Research

**Researched:** 2026-04-08
**Status:** Complete

## Objective

Verify that every deletion target in the CONTEXT.md is genuinely dead code, identify any hidden consumers, and document the exact edit operations needed.

## Findings

### DEAD-01: RegisterPayload and IdentityPayload

**Location:** `packages/core/src/types.ts` lines 95-138 (entire Handshake Message Payloads section)

**Evidence of dead code:**
- `grep -r` across all `.ts` source files (excluding `.planning/`) shows `RegisterPayload` and `IdentityPayload` only appear in:
  - `packages/core/src/types.ts` (definitions, lines 107 and 129)
  - `packages/core/src/index.ts` (re-exports, lines 44-45)
- Zero imports from any other package (shim, sdk, vite-plugin, or any NUB package)
- The handshake protocol was removed in v0.15.0 Phase 70, and Phase 70's verification confirmed these types were removed from core at that time -- but they were re-added or survived. The current codebase still has them.
- The test file `packages/core/src/index.test.ts` does NOT import or reference `RegisterPayload` or `IdentityPayload` -- no test changes needed for this requirement.

**Edit operations:**
1. Delete lines 95-138 from `packages/core/src/types.ts` (the entire `// --- Handshake Message Payloads` section including both interfaces)
2. Remove `RegisterPayload,` and `IdentityPayload,` from the type export block in `packages/core/src/index.ts` (lines 44-45)

### DEAD-02: getNappletType()

**Location:** `packages/shim/src/index.ts` lines 152-161

**Evidence of dead code:**
- Function is defined as `function getNappletType(): string { ... }` (local function, not exported)
- `grep -r getNappletType` across all source `.ts` files shows it is only defined in shim/index.ts and referenced nowhere else in source
- The function reads `<meta name="napplet-type">` but no code calls it -- the REGISTER handshake that used it was removed in Phase 71
- Phase 71 explicitly retained it "for future protocol versions" but Phase 81 removed the meta fallback, confirming it is truly dead

**Edit operations:**
1. Delete lines 152-161 from `packages/shim/src/index.ts` (the section comment + function definition)

### DEAD-03: shim/types.ts

**Location:** `packages/shim/src/types.ts` (7 lines total)

**Evidence of dead code:**
- File contains only re-exports: `export type { NostrEvent, NostrFilter } from '@napplet/core'` and `export { PROTOCOL_VERSION, SHELL_BRIDGE_URI } from '@napplet/core'`
- `grep -r "from.*shim.*types\|shim/src/types"` across all `.ts` files returns zero matches
- Nothing imports from this file -- consumers import directly from `@napplet/core`

**Edit operations:**
1. Delete `packages/shim/src/types.ts` entirely

### DEAD-04: nipdbSubscribeHandlers and nipdbSubscribeCancellers exports

**Location:** `packages/shim/src/nipdb-shim.ts` lines 41 and 46

**Evidence of internal-only use:**
- Both Maps are declared with `export const` but grep shows they are only referenced within `nipdb-shim.ts` itself:
  - `nipdbSubscribeHandlers`: used at lines 41, 104, 191, 210, 222
  - `nipdbSubscribeCancellers`: used at lines 46, 196, 211
- No file outside `nipdb-shim.ts` imports either Map
- They are used by `installNostrDb()` and the internal subscribe generator/cleanup

**Edit operations:**
1. Remove `export` keyword from line 41: `export const nipdbSubscribeHandlers` -> `const nipdbSubscribeHandlers`
2. Remove `export` keyword from line 46: `export const nipdbSubscribeCancellers` -> `const nipdbSubscribeCancellers`

### DEAD-05: Test Updates

**Current test file:** `packages/core/src/index.test.ts` (133 lines)

**Analysis:**
- The test file does NOT import `RegisterPayload` or `IdentityPayload` -- the type-level compile check test on line 80 only tests `NostrEvent`, `NostrFilter`, `Capability`, `TopicKey`, `TopicValue`
- No test references `getNappletType`
- No test references `nipdbSubscribeHandlers` or `nipdbSubscribeCancellers`
- No test references `shim/types.ts`

**Conclusion:** No test modifications are needed. The requirement is satisfied by verifying that `pnpm build && pnpm type-check` passes after the deletions. The existing tests will continue to work because they don't reference any of the deleted code.

## Risk Assessment

**Risk: None.** All five targets are confirmed dead code with zero consumers. The deletions are purely subtractive -- no API consumers exist, no tests reference them, and no runtime behavior depends on them.

## Validation Architecture

Not applicable -- this is a pure deletion phase. Validation is binary: `pnpm build && pnpm type-check` either passes or fails.

## RESEARCH COMPLETE
