# Phase 1: Wiring Fixes — Research

**Researched:** 2026-03-30
**Confidence:** HIGH
**Phase Goal:** The extracted packages work end-to-end standalone with no known security bugs, correct namespacing, and trustworthy message handling

## Executive Summary

Phase 1 addresses five known issues in the extracted codebase before any tests or demos are built. All fixes target existing code with clear specifications — no external research, new dependencies, or architectural changes needed. The scope is surgical: fix the AUTH race condition, add shim-side source validation, fix storage key serialization, rename hyprgate to napplet throughout, and verify end-to-end message flow.

## Research Findings

### FIX-01: AUTH Race Condition — pendingAuthQueue Not Cleared on All Rejection Paths

**Current state (pseudo-relay.ts lines 131-220):**

The `handleAuth()` function has 5 early-return paths for AUTH rejection:
1. **Wrong kind** (line 139): `sendOkFail('event kind must be 22242'); return;` — queue NOT cleared
2. **Challenge mismatch** (line 143): `sendOkFail('challenge mismatch'); return;` — queue NOT cleared
3. **Wrong relay tag** (line 146): `sendOkFail('relay tag must be hyprgate://shell'); return;` — queue NOT cleared
4. **Timestamp out of range** (line 149): `sendOkFail('event created_at too far from now'); return;` — queue NOT cleared
5. **Invalid signature** (line 155): `pendingAuthQueue.delete(windowId); sendOkFail('invalid signature'); return;` — queue IS cleared

Only the signature failure path (path 5) clears the queue. Paths 1-4 leave the queue intact.

**Fix approach:**
Add `pendingAuthQueue.delete(windowId)` before each early-return `sendOkFail()` call. Per CONTEXT.md decision D-06, after clearing the queue the shell should also send a NOTICE informing the napplet that queued messages were dropped.

**Affected files:**
- `packages/shell/src/pseudo-relay.ts` — `handleAuth()` function, lines 139-155

**Risk:** LOW. Each fix is a single-line addition. The queue cleanup at line 155 proves the pattern works.

### FIX-02: Shim-Side postMessage Source Validation

**Current state:**
- `packages/shim/src/index.ts` line 159: `handleRelayMessage(event: MessageEvent)` — no `event.source` check
- `packages/shim/src/storage-shim.ts` line 41: `handleStorageResponse(event: MessageEvent)` — no `event.source` check
- `packages/shim/src/relay-shim.ts` line 59: `handleMessage(msgEvent: MessageEvent)` — no `event.source` check

All three message handlers accept messages from any source window. A co-loaded malicious napplet or injected script could forge relay responses, fake AUTH challenges, or inject fake signer responses.

**Fix approach (per CONTEXT.md D-07):**
Add as the first line of each handler:
```typescript
if (event.source !== window.parent) return;
```

Also add `Array.isArray(event.data)` check and NIP-01 verb validation where not already present. The relay-shim's `handleMessage` already checks `Array.isArray(msg)` (line 61), but the other two need it.

**Affected files:**
- `packages/shim/src/index.ts` — `handleRelayMessage()`
- `packages/shim/src/storage-shim.ts` — `handleStorageResponse()`
- `packages/shim/src/relay-shim.ts` — `handleMessage()`

**Risk:** LOW. Adding source validation is a guard clause that cannot break existing behavior for legitimate messages (which always come from `window.parent`).

### FIX-03: Storage Key Serialization — Comma Delimiter Collision

**Current state:**
- `packages/shell/src/storage-proxy.ts` line 130: `sendResponse(sourceWindow, correlationId, [['keys', userKeys.join(',')]]);`
- `packages/shim/src/storage-shim.ts` line 162: `return raw === '' ? [] : raw.split(',');`

Keys containing commas (e.g., `"data,backup"`) corrupt the list: one key becomes two.

**Fix approach (per CONTEXT.md D-05):**
Replace the comma-joined string with repeated NIP tags. The shell sends one `['key', name]` tag per key instead of a single `['keys', joined]` tag.

Shell side (storage-proxy.ts line 130):
```typescript
// Before: sendResponse(sourceWindow, correlationId, [['keys', userKeys.join(',')]]);
// After:
sendResponse(sourceWindow, correlationId, userKeys.map(k => ['key', k]));
```

Shim side (storage-shim.ts line 156-163):
```typescript
// Before: const keysTag = event.tags?.find(...); return raw.split(',');
// After:
const keyTags = event.tags?.filter((t: string[]) => t[0] === 'key') ?? [];
return keyTags.map((t: string[]) => t[1]);
```

**Affected files:**
- `packages/shell/src/storage-proxy.ts` — `handleStorageRequest()`, storage-keys case
- `packages/shim/src/storage-shim.ts` — `nappStorage.keys()` method

**Risk:** LOW. This is a wire format change between shell and shim. Both sides must change simultaneously, but they are in the same monorepo and built together.

### FIX-04: Hyprgate References Renamed to Napplet

**Current state — all occurrences in source code (NOT docs/planning):**

| File | Line | Current | Target |
|------|------|---------|--------|
| `packages/shell/src/types.ts` | 8 | `'hyprgate://shell'` | `'napplet://shell'` |
| `packages/shell/src/types.ts` | 2 | comment: `@hyprgate/types` | `@napplet/shell types` |
| `packages/shell/src/pseudo-relay.ts` | 146 | `'relay tag must be hyprgate://shell'` | `'relay tag must be napplet://shell'` |
| `packages/shell/src/acl-store.ts` | 13 | `'hyprgate:acl'` | `'napplet:acl'` |
| `packages/shell/src/manifest-cache.ts` | 12 | `'hyprgate:manifest-cache'` | `'napplet:manifest-cache'` |
| `packages/shell/src/audio-manager.ts` | 24 | `'hyprgate:audio-changed'` | `'napplet:audio-changed'` |
| `packages/shell/src/napp-key-registry.ts` | 65, 77 | `'hyprgate:pending-update'` | `'napplet:pending-update'` |
| `packages/shim/src/types.ts` | 1-2 | comment: `@hyprgate/types`, `hyprgate shell` | `@napplet/shell types`, `napplet shell` |
| `packages/shim/src/types.ts` | 27 | comment: `hyprgate bus` | `napplet bus` |
| `packages/shim/src/types.ts` | 48 | `'hyprgate://shell'` | `'napplet://shell'` |
| `packages/shim/src/index.ts` | 111 | `'meta[name="hyprgate-napp-type"]'` | `'meta[name="napplet-napp-type"]'` |
| `packages/shim/src/index.ts` | 194 | `'meta[name="hyprgate-aggregate-hash"]'` | `'meta[name="napplet-aggregate-hash"]'` |
| `packages/vite-plugin/src/index.ts` | 4 | comment: `hyprgate-aggregate-hash` | `napplet-aggregate-hash` |
| `packages/vite-plugin/src/index.ts` | 80 | `name: 'hyprgate-aggregate-hash'` | `name: 'napplet-aggregate-hash'` |
| `packages/vite-plugin/src/index.ts` | 164 | regex: `hyprgate-aggregate-hash` | `napplet-aggregate-hash` |
| `packages/vite-plugin/src/index.ts` | 165 | template: `hyprgate-aggregate-hash` | `napplet-aggregate-hash` |
| `packages/vite-plugin/README.md` | 31 | `hyprgate-aggregate-hash` | `napplet-aggregate-hash` |
| `SPEC.md` | 127, 145, 159, 163, 856 | various `hyprgate` references | `napplet` equivalents |

**Fix approach (per CONTEXT.md D-03, D-04):**
Full sweep rename. Hard cut — no backward compatibility aliases. The rename is a string replacement in each file. The PSEUDO_RELAY_URI constant change propagates through all code that references it.

**Affected files:** All files listed above. The `SPEC.md` file should also be updated, but it's a documentation file so it's lower priority.

**Risk:** LOW for code changes (mechanical rename, no logic change). MEDIUM for SPEC.md (need to be careful about context — some `hyprgate` references are about the hyprgate project, not protocol identifiers).

### FIX-05: End-to-End Standalone Verification

**Current state:** No test or verification that the three packages work together standalone. The packages build and type-check, but no one has verified that a shell can create a pseudo-relay, a napplet can load the shim, AUTH can complete, and a round-trip message can flow outside of the hyprgate reference implementation.

**Fix approach (per CONTEXT.md D-09, D-10):**
Create a minimal HTML smoke test page in `tests/e2e/` and an automated Playwright script. The smoke test:
1. Loads a shell host page that imports `@napplet/shell` and calls `createPseudoRelay(mockHooks)`
2. Creates a sandboxed iframe that loads a minimal napplet page importing `@napplet/shim`
3. Shell sends AUTH challenge, napplet responds, AUTH completes
4. Napplet publishes a kind 29003 inter-pane event, shell receives and routes it
5. Shell sends EOSE, napplet receives it

The Playwright script asserts:
- AUTH OK is received by the napplet
- Round-trip message flows without error
- No console errors in either shell or napplet page

This is disposable verification — NOT a seed for the Phase 5 demo (D-10).

**Affected files:** New files in `tests/e2e/` (shell-host.html, test-napplet.html, smoke.spec.ts or similar)

**Risk:** MEDIUM. Requires mock ShellHooks to be minimal but functional. The real crypto hook (nostr-tools verifyEvent) is needed for AUTH to work. This is the most complex deliverable in Phase 1.

## Dependencies and Ordering

```
FIX-04 (rename) ──┐
                    ├──→ FIX-01 (AUTH queue) ──┐
FIX-03 (storage) ──┘                           ├──→ FIX-05 (e2e verify)
FIX-02 (source validation) ────────────────────┘
```

**Wave 1 (parallel):** FIX-02, FIX-03, FIX-04 — independent changes to different files
**Wave 2:** FIX-01 — depends on FIX-04 completing (rename changes the relay URI error message)
**Wave 3:** FIX-05 — depends on all fixes being in place (verifies the whole stack)

## Validation Architecture

### What to verify
1. AUTH queue is cleared on all 5 rejection paths (grep for `pendingAuthQueue.delete` in handleAuth)
2. All 3 shim message handlers check `event.source === window.parent` (grep for source check)
3. Storage keys() uses repeated NIP tags, not comma-join (grep for `['key',` pattern)
4. Zero `hyprgate` occurrences in `packages/*/src/**/*.ts` (grep sweep)
5. E2E smoke test passes in Playwright (AUTH completes, message round-trips)

### How to verify
- `pnpm build` succeeds (TypeScript compilation)
- `pnpm type-check` succeeds (strict type checking)
- `grep -r 'hyprgate' packages/*/src/ --include='*.ts'` returns empty
- Playwright smoke test exits 0
- Manual code review of handleAuth() confirms all early-returns have queue cleanup

## RESEARCH COMPLETE
