# Phase 4: Capability Tests - Research

**Researched:** 2026-03-30
**Domain:** Playwright behavioral tests for ACL, storage, signer, and IPC capabilities
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Signer consent mock at Claude's discretion (auto-resolve callback vs configurable per-test).
- **D-02:** Storage quota uses UTF-8 byte count: `new TextEncoder().encode(key + value).length`. This replaces the current Blob approach in `storage-proxy.ts`.
- **D-03:** Quota exceeded error uses NIP tag format: `['error', 'quota exceeded: 512KB limit']`.
- **D-04:** ACL persist/load tests assert on BOTH behavior (round-trip works) AND format (localStorage key name and JSON structure).
- **D-05:** All tests in Playwright, real Chromium (from Phase 3 D-04).
- **D-06:** REQ-IDs in test descriptions (from Phase 2 D-04).
- **D-07:** Shell-side message tap for assertions (from Phase 2 D-06).
- **D-08:** Blocked napp CLOSED prefix: `'blocked: capability denied'` (from Phase 3 D-09).
- **D-09:** NIP-01 error prefix convention (from Phase 3 D-01).
- **D-10:** Storage keys use repeated NIP tags (from Phase 1 D-05).

### Claude's Discretion
- Signer consent mock implementation approach
- Test file organization (grouping by capability area vs other)
- Which tests need multiple napplets (cross-napp isolation STR-06, multi-subscriber IPC-03)
- Whether to reuse Phase 3 test napplets or create capability-specific ones
</user_constraints>

## Technical Investigation

### 1. Test Infrastructure Available (from Phase 2/3)

**Shell test harness** (`tests/e2e/harness/harness.ts`):
- `__loadNapplet__(name, params?)` — loads napplet in sandboxed iframe, returns windowId
- `__unloadNapplet__(windowId)` — removes iframe and unregisters
- `__TEST_MESSAGES__` — all tapped messages (TappedMessage[])
- `__clearMessages__()` — resets tap buffer
- `__getRelay__()` — returns PseudoRelay instance
- `__getMockHooks__()` — returns MockHooksResult with hooks, relayPool, callLog, setSigner(), setUserPubkey()
- `__injectMessage__(windowId, data)` — inject raw NIP-01 message from a napplet
- `__createSubscription__(windowId, subId, filters)` — inject REQ
- `__publishEvent__(windowId, event)` — inject EVENT
- `__closeSubscription__(windowId, subId)` — inject CLOSE
- `__getChallenge__(windowId)` — get pending AUTH challenge string
- `__getNappletFrames__()` — list loaded windowIds

**Test napplets** (`tests/fixtures/napplets/`):
- `auth-napplet` — completes AUTH handshake only
- `publish-napplet` — completes AUTH then publishes event (configurable kind/content via query params)

**Helpers** (`tests/helpers/`):
- `createMockHooks(overrides?)` — complete mock ShellHooks with real nostr-tools verifyEvent
- `createMockRelayPool()` — relay pool mock
- `createMessageTap()` — postMessage interceptor
- `buildAuthEvent(options)` / `buildValidAuthEvent(challenge, secretKey)` — AUTH event factory (added in Phase 3)

### 2. ACL Store Analysis

**Source:** `packages/shell/src/acl-store.ts`

The ACL store is a module-scoped `Map<string, InternalAclEntry>` with these operations:
- `check(pubkey, dTag, aggregateHash, capability)` — returns `true` if no entry (permissive default), `false` if blocked, otherwise checks capability Set
- `grant(pubkey, dTag, aggregateHash, capability)` — getOrCreate + add to Set
- `revoke(pubkey, dTag, aggregateHash, capability)` — getOrCreate + delete from Set
- `block(pubkey, dTag, aggregateHash)` — getOrCreate + set blocked=true
- `unblock(pubkey, dTag, aggregateHash)` — getOrCreate + set blocked=false
- `persist()` — serializes to localStorage at key `'napplet:acl'`
- `load()` — deserializes from localStorage, rebuilding internal Set
- `clear()` — clears Map and removes localStorage key

**Persist format:** Array of `[compositeKey, { pubkey, dTag, aggregateHash, capabilities: string[], blocked: boolean, storageQuota: number }]` serialized as JSON.

**Testing approach:** ACL tests need to:
1. Load a napplet (AUTH completes, entry created with all capabilities)
2. Manipulate ACL via `page.evaluate()` calls to `aclStore.grant/revoke/block/unblock`
3. Have the napplet attempt operations
4. Assert on OK/CLOSED/error responses via message tap

**Challenge:** The `aclStore` is imported directly in pseudo-relay.ts as a module singleton. Tests can access it via `page.evaluate()` by importing from the harness page context — but the harness doesn't expose `aclStore` on window yet. Need to add `__getAclStore__()` to harness OR manipulate ACL through message injection.

**Better approach:** Expose ACL manipulation on the harness window:
```typescript
window.__aclRevoke__ = (pubkey, dTag, hash, cap) => aclStore.revoke(pubkey, dTag, hash, cap);
window.__aclGrant__ = (pubkey, dTag, hash, cap) => aclStore.grant(pubkey, dTag, hash, cap);
window.__aclBlock__ = (pubkey, dTag, hash) => aclStore.block(pubkey, dTag, hash);
window.__aclUnblock__ = (pubkey, dTag, hash) => aclStore.unblock(pubkey, dTag, hash);
window.__aclPersist__ = () => aclStore.persist();
window.__aclLoad__ = () => aclStore.load();
window.__aclClear__ = () => aclStore.clear();
window.__aclCheck__ = (pubkey, dTag, hash, cap) => aclStore.check(pubkey, dTag, hash, cap);
window.__aclGetEntry__ = (pubkey, dTag, hash) => aclStore.getEntry(pubkey, dTag, hash);
```

### 3. Storage Proxy Analysis

**Source:** `packages/shell/src/storage-proxy.ts`

Storage operations are triggered by kind 29001 events with specific topic tags:
- `shell:storage-get` — requires `storage:read` ACL, returns `['value', val], ['found', 'true'/'false']`
- `shell:storage-set` — requires `storage:write` ACL, checks quota, returns `['ok', 'true']`
- `shell:storage-remove` — requires `storage:write` ACL, returns `['ok', 'true']`
- `shell:storage-clear` — requires `storage:write` ACL, returns `['ok', 'true']`
- `shell:storage-keys` — requires `storage:read` ACL, returns `['key', k]` tags for each key

**Scoped key format:** `napp-storage:${pubkey}:${dTag}:${aggregateHash}:${userKey}`

**Quota calculation (current, BUGGY):** Uses `new Blob([key, value]).size` — this is the Blob constructor which creates a UTF-8 encoded blob. Actually, Blob size IS UTF-8 bytes for string data, so the behavior is already UTF-8. However, the decision D-02 says to change to `new TextEncoder().encode(key + value).length` for explicit UTF-8 encoding. The difference: Blob passes key and value as separate arguments (concatenated internally), while TextEncoder concatenates them first. For ASCII strings this is identical. The change is about explicitness and cross-platform consistency.

**Testing approach for storage:**
1. Need a napplet that can send storage request events to the shell
2. The existing `publish-napplet` doesn't use storage — need a storage-capable test napplet
3. OR: use `__injectMessage__` to craft raw storage request events from the test Node side

**Better approach:** Inject storage request events via `__injectMessage__` since we control the full event structure. This avoids needing a storage-specific napplet and lets tests be precise about request format.

However, the napplet must be AUTH'd first (pubkey must be in nappKeyRegistry). So: load auth-napplet, wait for AUTH, then inject storage requests using that napplet's windowId.

**Key insight:** Storage requests flow through `handleEvent()` in pseudo-relay which routes kind 29001 events with storage topics to `handleStorageRequest()`. The request must come from an AUTH'd window whose pubkey is in the nappKeyRegistry.

### 4. Signer Delegation Analysis

**Source:** `packages/shell/src/pseudo-relay.ts` lines 353-408

Signer request flow:
1. Napplet sends kind 29001 event with `['method', 'getPublicKey'|'signEvent'|etc]` and `['id', correlationId]`
2. Shell checks `sign:event` ACL capability
3. Shell calls `hooks.auth.getSigner()` — if null, returns error
4. For `signEvent` with destructive kinds (0, 3, 5, 10002): raises `_onConsentNeeded` callback
5. Consent callback resolves with true/false
6. On success: dispatches to signer method, sends response as kind 29002 event via `deliverToSubscriptions()`
7. On failure: sends `OK false 'error: reason'`

**Mock signer for tests:** The `createMockHooks()` has `setSigner(signer)` method. We need to provide a mock signer object with:
```typescript
{
  getPublicKey: () => hostPubkeyHex,
  signEvent: (event) => Promise.resolve({ ...event, sig: '...' }),
  getRelays: () => ({}),
}
```

For consent testing, the harness exposes `relay.onConsentNeeded(handler)`. Tests can register a handler that auto-approves or auto-denies.

**Timeout testing (SGN-06):** The 30s timeout is implemented on the shim side (`packages/shim/src/index.ts`), not the shell side. Since we're testing shell-side behavior, we'd need to either:
- Test from the napplet side (shim timeout behavior)
- OR test that the shell correctly handles signer promises that never resolve

Since Phase 4 is about proving shell capabilities, the timeout test should verify the shim-side behavior. But since D-05 says all tests in Playwright with real Chromium, we can test this end-to-end: configure a signer that never resolves, load a napplet that requests signing, and verify the napplet receives an error after timeout.

**Practical challenge:** 30s timeout is too long for test suite. We should mock the timeout duration or use a signer that immediately rejects vs one that hangs.

### 5. Inter-Pane Communication Analysis

**Source:** `packages/shell/src/pseudo-relay.ts` lines 96-112, 607-618

Inter-pane routing via `deliverToSubscriptions()`:
- Iterates all subscriptions
- Skips sender (`senderId === sub.windowId`)
- If event has p-tag, only delivers to napplet whose pubkey matches p-tag value
- Checks filter match
- Posts `['EVENT', subId, event]` to subscriber window

Shell-injected events via `injectEvent(topic, payload)`:
- Creates synthetic kind 29003 event with `['t', topic]` tag
- Calls `storeAndRoute(event, null)` — null senderId means no sender exclusion
- Event stored in ring buffer and delivered to matching subscriptions

**Testing approach:** Need 2+ napplets:
- Napplet A emits (publishes kind 29003 with topic tag)
- Napplet B subscribes (REQ with filter `{ kinds: [29003], '#t': [topic] }`)
- Verify B receives, A does not (sender exclusion)

For IPC-03 (multiple subscribers), need 3 napplets.

Can use `__injectMessage__` to simulate subscription creation and event publication without creating additional napplet types.

### 6. Quota Fix (D-02) Code Change Required

**Current code** (`storage-proxy.ts` line 31):
```typescript
totalBytes += new Blob([key, value]).size;
```

**Required change:**
```typescript
totalBytes += new TextEncoder().encode(key + value).length;
```

**Also line 87:**
```typescript
const newWriteBytes = new Blob([scopedKey(pubkey, dTag, aggregateHash, key), value]).size;
```
**Change to:**
```typescript
const newWriteBytes = new TextEncoder().encode(scopedKey(pubkey, dTag, aggregateHash, key) + value).length;
```

This code change needs to happen as part of or before the storage tests. The tests should assert the corrected behavior.

### 7. Test Napplet Strategy

**Options:**
A. Create new capability-specific napplets (storage-napplet, signer-napplet, ipc-napplet)
B. Reuse auth-napplet + __injectMessage__ for all capability tests
C. Create one general-purpose "capability-napplet" that responds to harness commands

**Recommendation: Option B** (auth-napplet + message injection) for most tests, supplemented by a **minimal IPC napplet** for inter-pane tests that need real shim-side `emit()`/`on()` behavior.

Rationale:
- ACL tests: Inject messages directly — we're testing shell ACL enforcement, not napplet behavior
- Storage tests: Inject storage request events — we're testing the storage proxy
- Signer tests: Need a napplet that calls `window.nostr.signEvent()` — but we can inject signer request events directly since we're testing shell signer handling
- IPC tests: Need at least 2 napplets with real subscriptions — auth-napplet + __injectMessage__ for subscriptions, plus either publish-napplet or direct injection for emitting

**Exception: Signer timeout (SGN-06)** needs shim-side behavior testing. If we inject events directly, we bypass the shim timeout. For this test, we could either:
- Accept testing only shell-side behavior (signer promise rejection)
- Create a signer-napplet that calls window.nostr methods

### 8. Harness Extensions Needed

The harness needs additional window globals for Phase 4:

```typescript
// ACL manipulation
window.__aclRevoke__: (pubkey, dTag, hash, cap) => void;
window.__aclGrant__: (pubkey, dTag, hash, cap) => void;
window.__aclBlock__: (pubkey, dTag, hash) => void;
window.__aclUnblock__: (pubkey, dTag, hash) => void;
window.__aclPersist__: () => void;
window.__aclLoad__: () => void;
window.__aclClear__: () => void;
window.__aclCheck__: (pubkey, dTag, hash, cap) => boolean;
window.__aclGetEntry__: (pubkey, dTag, hash) => AclEntry | undefined;

// Storage inspection (for verifying scoped keys in localStorage)
window.__getLocalStorageKeys__: () => string[];
window.__getLocalStorageItem__: (key: string) => string | null;
window.__setLocalStorageItem__: (key: string, value: string) => void;
window.__clearLocalStorage__: () => void;

// Signer configuration
window.__setSigner__: (signer) => void;
window.__setConsentHandler__: (handler: 'auto-approve' | 'auto-deny' | 'timeout') => void;

// NappKey registry access (for getting napplet pubkey/dTag/hash after AUTH)
window.__getNappKeyEntry__: (pubkey: string) => NappKeyEntry | undefined;
window.__getNappPubkey__: (windowId: string) => string | undefined;
```

### 9. Validation Architecture

**Dimension 1 — Unit vs Integration:** All Phase 4 tests are integration tests (Playwright, real browser). No pure unit tests in this phase.

**Dimension 2 — Happy vs Error Paths:** Each capability area has both:
- Happy: ACL grant → operation succeeds (ACL-01, ACL-02, ACL-05)
- Error: ACL revoke → operation denied (ACL-03, ACL-06, ACL-07, ACL-08), block → all denied (ACL-04)

**Dimension 3 — Edge Cases:** Quota boundary (STR-08), concurrent signer requests (SGN-07), malformed IPC content (IPC-05)

**Dimension 4 — Cross-Component:** Storage isolation (STR-06) tests cross-napp boundary. IPC multi-subscriber (IPC-03) tests cross-napp delivery.

**Dimension 5 — State Persistence:** ACL persist/load (ACL-09), storage persistence (STR-09)

**Dimension 6 — Coverage Metric:** 31 requirements = 31 test cases minimum. Each maps 1:1 to a REQ-ID.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Storage quota Blob→TextEncoder change breaks existing behavior | Tests may pass on new code but not match old behavior | Apply code fix before running tests; test asserts new behavior |
| Signer timeout test takes 30s | Slow test suite | Mock timeout duration OR test only that signer-never-resolves produces error |
| Multi-napplet IPC tests are flaky due to timing | Intermittent failures | Use polling assertions (expect.poll) with generous timeouts |
| ACL module singleton state leaks between tests | False passes/failures | Reset ACL store in test.beforeEach via __aclClear__ |
| localStorage persistence tests need page reload | Complex Playwright setup | Use page.reload() and re-wait for __SHELL_READY__ |

## Implementation Approach

### Wave 1: Harness Extensions + Code Fix
1. Extend harness with ACL, storage, signer, and registry access globals
2. Apply storage quota TextEncoder fix
3. Create any needed test napplets (IPC napplet at minimum)

### Wave 2: Capability Test Files (can be parallel)
1. ACL enforcement tests (ACL-01 through ACL-09)
2. Storage isolation tests (STR-01 through STR-09)
3. Signer delegation tests (SGN-01 through SGN-07)
4. Inter-pane communication tests (IPC-01 through IPC-06)

## RESEARCH COMPLETE

---

*Phase: 04-capability-tests*
*Research completed: 2026-03-30*
