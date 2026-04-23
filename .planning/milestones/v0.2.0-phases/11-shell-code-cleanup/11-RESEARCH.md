# Phase 11: Shell Code Cleanup - Research

**Researched:** 2026-03-30
**Phase:** 11 — Shell Code Cleanup
**Requirement IDs:** CLN-01, CLN-02, CLN-03, CLN-04, CLN-05

## Research Question

What do we need to know to plan the shell code cleanup well?

## 1. Current State Audit

### CLN-01: Method Naming Inconsistencies

**NOTE:** By the time Phase 11 executes, Phases 7-10 will have already transformed the codebase significantly (ShellBridge rename, ACL pure module extraction, enforcement gate). The research below identifies issues in the *current* code, but plans must account for the post-Phase-10 state.

Current public API on `PseudoRelay` (will be `ShellBridge` after Phase 7):
- `handleMessage(event: MessageEvent)` — verb-noun, consistent
- `sendChallenge(windowId: string)` — verb-noun, consistent
- `injectEvent(topic: string, payload: unknown)` — verb-noun, consistent
- `cleanup()` — verb only, acceptable but could be `cleanupState()`
- `onConsentNeeded(handler)` — event registration pattern, not verb-noun

Internal handlers in `pseudo-relay.ts`:
- `checkAcl` — verb-noun, OK
- `checkReplay` — verb-noun, OK
- `matchesFilter` / `matchesAnyFilter` — predicate pattern, OK (not verb-noun but clear)
- `deliverToSubscriptions` — verb-preposition-noun, slightly inconsistent
- `storeAndRoute` — compound verb, could be clearer
- `dispatchVerb` — verb-noun, OK
- `handleAuth` / `handleEvent` / `handleReq` / `handleClose` / `handleCount` — verb-noun, consistent
- `handleSignerRequest` — verb-noun, OK
- `handleHotkeyForward` — verb-noun, OK
- `handleAudioCommand` — verb-noun, OK
- `handleShellCommand` — verb-noun, OK

Exported standalone utilities in index.ts:
- `originRegistry` — noun (object with methods), fine
- `nappKeyRegistry` — noun (object with methods), fine
- `aclStore` — noun (object with methods), fine
- `audioManager` — noun (object with methods), fine
- `manifestCache` — noun (object with methods), fine
- `handleStateRequest(windowId, sourceWindow, event)` — verb-noun function, fine
- `cleanupNappState(pubkey, dTag, aggregateHash)` — verb-noun function, fine

**Issues identified:**
1. `onConsentNeeded` doesn't follow verb-noun — should be something like `registerConsentHandler` or stay as event-style `onConsentNeeded` (common JS pattern)
2. `deliverToSubscriptions` is wordy — could be `deliverEvent` (the "to subscriptions" is implicit)
3. `storeAndRoute` is a compound verb — could be `bufferAndDeliver` or split into two calls
4. `cleanup()` is bare verb — `cleanupState()` or `destroy()` would be more descriptive

### CLN-02: JSDoc Coverage Gaps

**Functions/exports WITH JSDoc (has @param/@returns):**
- `createPseudoRelay(hooks)` — has @param and @returns (only function with proper JSDoc)

**Functions/exports WITH module-level doc comments but NO @param/@returns/@example:**
- `PseudoRelay` interface — has per-method `/** */` comments but no @param/@returns
- All types in `types.ts` — have `/** description */` but no @param/@returns/@example
- `originRegistry` — module comment only
- `nappKeyRegistry` — module comment only
- `aclStore` — module comment only
- `audioManager` — module comment only
- `manifestCache` — module comment only
- `handleStateRequest` — no JSDoc at all on the function
- `cleanupNappState` — no JSDoc at all on the function
- `TOPICS` — module comment only
- `BusKind`, `AUTH_KIND`, `PSEUDO_RELAY_URI`, `PROTOCOL_VERSION`, etc. — no individual JSDoc

**Total JSDoc work needed:** ~30+ exported symbols need @param/@returns/@example annotations.

### CLN-03: Internal Helpers Exposed

Functions exported from individual modules but NOT re-exported from index.ts (correctly private at package level):
- `aclKey()` in `acl-store.ts` — exported but not in index.ts
- `getPendingUpdateVersion()` in `napp-key-registry.ts` — exported but not in index.ts

Functions that ARE re-exported from index.ts but could be considered internal:
- `handleStateRequest` — only used by the pseudo-relay internally, but also exported for potential external use
- `cleanupNappState` — used by shell host to clean up on window close, legitimate export
- `aclStore` — full mutable store exposed, potentially too much API surface (but needed until Phase 8 ACL redesign)
- `DEFAULT_STATE_QUOTA` — constant, fine to export
- `DESTRUCTIVE_KINDS` — re-exported from both types.ts and acl-store.ts (duplicate export path)

**Issues identified:**
1. `DESTRUCTIVE_KINDS` is exported from both `types.ts` and `acl-store.ts` (the latter re-exports it)
2. `handleStateRequest` is exported but may not need to be after Phase 9's enforcement gate consolidation
3. Individual module files export symbols that aren't needed outside the package (e.g., `aclKey`, `getPendingUpdateVersion`)

### CLN-04: Debug console.log Statements

**Found exactly 1 debug statement:**
- `packages/shell/src/pseudo-relay.ts:64` — `console.log(\`[checkAcl] DENIED ...\`)` inside `checkAcl()` helper

No `console.warn`, `console.error`, `console.debug`, or `console.info` statements found anywhere in the shell package.

### CLN-05: Error Handling Inconsistencies

**Silent catch blocks (no comment explaining why):**
- `manifest-cache.ts:46` — `catch { cache.clear(); }` — destructive fallback, no explanation
- `manifest-cache.ts:52` — `catch { /* silent */ }` — has minimal comment
- `manifest-cache.ts:57` — `catch { /* ignore */ }` — has minimal comment
- `pseudo-relay.ts:263` — `catch { /* best-effort */ }` — has minimal comment
- `pseudo-relay.ts:332` — `catch { /* ignore */ }` — has minimal comment
- `pseudo-relay.ts:561` — `catch { /* */ }` — empty comment, should explain
- `acl-store.ts:122-124` — `catch { // localStorage unavailable }` — has comment
- `acl-store.ts:154-155` — `catch { store.clear(); }` — destructive, no explanation
- `acl-store.ts:168-170` — `catch { // Ignore }` — has comment
- `state-proxy.ts:97-98` — `catch { sendError(...'state write failed'); }` — proper error response

**Pattern:** Most catch blocks either swallow silently or have minimal 1-word comments. Phase 11 should ensure every catch block has a comment explaining why the error is swallowed or handled that way.

## 2. Post-Phase-10 State Prediction

By the time Phase 11 executes:
- **Phase 7:** `pseudo-relay.ts` renamed to `shell-bridge.ts`, `PseudoRelay` → `ShellBridge`, `createPseudoRelay` → `createShellBridge`, `PSEUDO_RELAY_URI` → `SHELL_BRIDGE_URI`
- **Phase 8:** ACL logic extracted to `@napplet/acl` package, `acl-store.ts` becomes a thin persistence adapter
- **Phase 9:** Single `enforce()` gate in ShellBridge, `checkAcl()` calls replaced
- **Phase 10:** Exhaustive test matrix added

**Implication for cleanup:**
- Method names in ShellBridge may already be partially cleaned up by Phase 9 (enforce gate changes handler signatures)
- `acl-store.ts` will be significantly different (thin adapter over @napplet/acl)
- The public API surface may have changed (new @napplet/acl exports, modified ShellBridge interface)
- Plans should target the *post-Phase-10 file layout* but work from *current file paths* for `read_first`

## 3. Recommended Plan Structure

### Plan 11-01: Method Naming and API Cleanup (wave 1)
- Rename inconsistent public methods on ShellBridge interface
- Rename internal helpers for consistency
- Review and minimize public API surface in index.ts
- Remove duplicate export paths (DESTRUCTIVE_KINDS)
- Make internal-only exports truly private (remove `export` from module-internal helpers)

### Plan 11-02: JSDoc and Error Handling (wave 1, parallel)
- Add @param, @returns, @example to all exported functions and types
- Add explanatory comments to all silent catch blocks
- Remove debug console.log statement(s)
- Verify build and type-check pass after all changes

**Both plans can run in wave 1** because they target different concerns (naming/API vs documentation/error-handling) on the same files, but don't create conflicting edits if tasks are scoped to different files or different sections of the same file.

## 4. Validation Architecture

**Dimension 1 — Naming consistency:** `grep -rn 'function\|method' packages/shell/src/` should show only verb-noun patterns
**Dimension 2 — JSDoc completeness:** Every `export` in index.ts should have corresponding JSDoc with @param/@returns/@example
**Dimension 3 — No debug artifacts:** `grep -rn 'console\.' packages/shell/src/` returns zero results
**Dimension 4 — Internal helpers private:** Symbols exported from module files but not from index.ts should be audited — if not used externally, remove `export` keyword
**Dimension 5 — Error handling:** Every `catch` block has a comment explaining the handling strategy
**Dimension 6 — Build verification:** `pnpm build` and `pnpm type-check` pass after all changes

## RESEARCH COMPLETE
