---
phase: 71-shim-simplification
verified: 2026-04-07T11:30:00Z
status: passed
score: 13/13 must-haves verified
re_verification: false
---

# Phase 71: Shim Simplification Verification Report

**Phase Goal:** Napplet developers include @napplet/shim with zero crypto dependencies -- the shim sends plain NIP-01 messages and never touches keys or signatures
**Verified:** 2026-04-07T11:30:00Z
**Status:** passed
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | napplet-keypair.ts does not exist in packages/shim/src/ | VERIFIED | `test -f packages/shim/src/napplet-keypair.ts` returns false |
| 2  | No shim file imports from nostr-tools (no generateSecretKey, getPublicKey, finalizeEvent, hexToBytes) | VERIFIED | `grep -r "nostr-tools" packages/shim/src/` returns empty; crypto function names return only proxy method string literals |
| 3  | No shim file references NappletKeypair type | VERIFIED | `grep -r "NappletKeypair\|napplet-keypair" packages/shim/src/` returns empty |
| 4  | nostr-tools is not in package.json peerDependencies or devDependencies | VERIFIED | packages/shim/package.json has no peerDependencies key and no nostr-tools in devDependencies |
| 5  | The shim message handler does not handle AUTH or IDENTITY verbs | VERIFIED | switch cases in handleRelayMessage: OK, EVENT, EOSE, CLOSED, NOTICE only |
| 6  | The shim does not send REGISTER to the shell | VERIFIED | `grep -r "REGISTER" packages/shim/src/` returns empty |
| 7  | subscribe(), publish(), query() have the same function signatures and return types as before | VERIFIED | relay-shim.ts exports all three with same signatures: subscribe(filters, onEvent, onEose, options?), publish(template, options?), query(filters) |
| 8  | emit() sends unsigned event templates via postMessage | VERIFIED | sendEvent() in index.ts builds {kind, created_at, tags, content} and calls window.parent.postMessage(['EVENT', event], '*') |
| 9  | keyboard-shim sends unsigned event templates via postMessage | VERIFIED | handleKeydown() builds hotkeyEvent template and calls window.parent.postMessage(['EVENT', hotkeyEvent], '*') |
| 10 | nipdb-shim sends unsigned event templates via postMessage | VERIFIED | sendNipdbRequestRaw() builds event template and calls window.parent.postMessage(['EVENT', event], '*') |
| 11 | Signer proxy (window.nostr) works without requiring a keypair | VERIFIED | window.nostr methods call sendSignerRequest() which uses crypto.randomUUID() as correlation id with no keypair dependency |
| 12 | pnpm build succeeds for all packages | VERIFIED | `pnpm build` exits 0; 4 tasks successful (all cached hit green) |
| 13 | pnpm type-check succeeds for all packages | VERIFIED | `pnpm type-check` exits 0; 5 tasks successful (all cached hit green) |

**Score:** 13/13 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/shim/src/types.ts` | Re-exports from @napplet/core only, no deprecated constants | VERIFIED | 7 lines: re-exports NostrEvent, NostrFilter, BusKind, SHELL_BRIDGE_URI, PROTOCOL_VERSION, BusKindValue; no AUTH_KIND, VERB_REGISTER, VERB_IDENTITY |
| `packages/shim/src/index.ts` | Shim installer with no crypto, no AUTH, no keypair | VERIFIED | No crypto imports; no keypair state; no AUTH/IDENTITY/REGISTER handlers; sendEvent() sends unsigned templates |
| `packages/shim/src/keyboard-shim.ts` | Keyboard forwarding with unsigned event templates | VERIFIED | No signing imports; builds unsigned hotkeyEvent template directly |
| `packages/shim/src/nipdb-shim.ts` | NIPDB proxy with unsigned event templates | VERIFIED | installNostrDb() takes no keypair parameter; sendNipdbRequestRaw() always sends unsigned template |
| `packages/shim/package.json` | Package manifest with no nostr-tools dependency | VERIFIED | dependencies: only @napplet/core; devDependencies: tsup and typescript only; no peerDependencies |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `packages/shim/src/index.ts` | `window.parent.postMessage` | sendEvent sends unsigned EventTemplate | VERIFIED | Line 120: `window.parent.postMessage(['EVENT', event], '*')` with unsigned template |
| `packages/shim/src/keyboard-shim.ts` | `window.parent.postMessage` | keydown handler sends unsigned event | VERIFIED | Line 71: `window.parent.postMessage(['EVENT', hotkeyEvent], '*')` |
| `packages/shim/src/nipdb-shim.ts` | `window.parent.postMessage` | sendNipdbRequestRaw sends unsigned event | VERIFIED | Line 50: `window.parent.postMessage(['EVENT', event], '*')` |

### Data-Flow Trace (Level 4)

Not applicable -- this phase produces protocol infrastructure (postMessage senders/receivers), not components that render dynamic data from a database.

### Behavioral Spot-Checks

| Behavior | Result | Status |
|----------|--------|--------|
| pnpm build (all packages) | 4 successful, 4 total; Time 21ms | PASS |
| pnpm type-check (all packages) | 5 successful, 5 total; Time 20ms | PASS |
| No nostr-tools in shim/src | grep returns empty | PASS |
| No AUTH/REGISTER/IDENTITY in shim/src | grep returns empty | PASS |
| message handler cases | OK, EVENT, EOSE, CLOSED, NOTICE -- no AUTH | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SHIM-01 | 71-01-PLAN.md | @napplet/shim removes all signing code (finalizeEvent, generateSecretKey, keypair storage) | SATISFIED | napplet-keypair.ts deleted; no finalizeEvent/generateSecretKey anywhere in packages/shim/src/ |
| SHIM-02 | 71-01-PLAN.md | @napplet/shim drops nostr-tools crypto imports | SATISFIED | package.json has no nostr-tools dependency; src/ has no nostr-tools imports |
| SHIM-03 | 71-01-PLAN.md | Shim no longer generates or stores ephemeral/delegated keypairs | SATISFIED | napplet-keypair.ts deleted; no keypair/Keypair state in any shim source file |
| SHIM-04 | 71-01-PLAN.md | subscribe(), publish(), query() APIs remain unchanged | SATISFIED | relay-shim.ts function signatures identical; all three still exported |

**Orphaned requirements check:** REQUIREMENTS.md traceability table maps SHIM-01, SHIM-02, SHIM-03, SHIM-04 to Phase 71 only. No additional requirement IDs are orphaned.

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `packages/shim/README.md` | "nostr-tools as a peer dependency" and `npm install @napplet/shim nostr-tools` | Info | README is stale; does not affect runtime or build. Covered by Phase 73 (DOC-03). |

No blockers. No warnings in runtime code.

**Commit discrepancy (info only):** SUMMARY.md claims three separate commits (14b4d9e, b0def7d, e84791e) but git log shows a single squash commit (59cf3c0) covering all changes. The work was completed atomically. This is a documentation inaccuracy in the SUMMARY, not a code issue.

### Human Verification Required

None. All success criteria are verifiable programmatically.

### Gaps Summary

No gaps. All 13 must-have truths verified, all 4 required artifacts verified at all applicable levels, all 3 key links confirmed wired, all 4 requirements satisfied. Build and type-check pass clean.

The README stale reference (nostr-tools install instruction) is informational only -- it is explicitly out of scope for Phase 71 and is assigned to Phase 73 (DOC-03).

---

_Verified: 2026-04-07T11:30:00Z_
_Verifier: Claude (gsd-verifier)_
