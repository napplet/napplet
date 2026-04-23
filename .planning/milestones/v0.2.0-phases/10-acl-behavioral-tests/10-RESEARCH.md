# Phase 10: ACL Behavioral Tests - Research

**Researched:** 2026-03-30
**Phase:** 10 — ACL Behavioral Tests
**Requirement IDs:** TST-01, TST-02, TST-03, TST-04, TST-05, TST-06

## Research Question

What do I need to know to PLAN exhaustive behavioral tests that prove every capability-action combination is enforced by the ACL gate, and that no message path bypasses it?

---

## 1. Capability × Action Matrix Analysis

### All Capabilities (10 total, from types.ts)

| # | Capability | Bit | Description |
|---|-----------|-----|-------------|
| 1 | `relay:read` | 1 | Subscribe to events, receive deliveries |
| 2 | `relay:write` | 2 | Publish events to relays |
| 3 | `cache:read` | 4 | Read from local worker relay cache |
| 4 | `cache:write` | 8 | Write to local worker relay cache |
| 5 | `hotkey:forward` | 16 | Forward keyboard shortcuts to shell |
| 6 | `sign:event` | 32 | Request event signing |
| 7 | `sign:nip04` | 64 | Request NIP-04 encrypt/decrypt |
| 8 | `sign:nip44` | 128 | Request NIP-44 encrypt/decrypt |
| 9 | `state:read` | 256 | Read napplet-scoped state |
| 10 | `state:write` | 512 | Write napplet-scoped state |

### TST-01 Specifies 8 Capabilities

REQUIREMENTS.md TST-01 lists: `relay:read, relay:write, sign:event, sign:nip04, sign:nip44, state:read, state:write, hotkey:forward`

This is 8 capabilities. The missing two (`cache:read`, `cache:write`) are not exercised through the postMessage protocol in the current pseudo-relay implementation — they would be used if a worker relay is available, but the current ACL enforcement path doesn't check cache capabilities separately (cache reads/writes go through the worker relay hooks, not through explicit ACL checks in pseudo-relay.ts).

**Decision for testing:** Test the 8 capabilities listed in TST-01. Cache capabilities are not enforced by the current ShellBridge code path — they're implicit in relay:read/relay:write when a worker relay is present. Testing cache:read/cache:write would require separate infrastructure not yet built.

### All Action Types (8 total, from TST-01)

| # | Action | Protocol Message | Capability Required |
|---|--------|-----------------|---------------------|
| 1 | publish | `EVENT` (non-bus kind) | `relay:write` |
| 2 | subscribe | `REQ` | `relay:read` |
| 3 | deliver | Event delivery to subscriber | `relay:read` (recipient) |
| 4 | sign | `EVENT` kind 29001 (signer request) | `sign:event` |
| 5 | state-get | `EVENT` kind 29003 topic `shell:state-get` | `state:read` |
| 6 | state-set | `EVENT` kind 29003 topic `shell:state-set` | `state:write` |
| 7 | inter-pane emit | `EVENT` kind 29003 (non-shell topic) | `relay:write` |
| 8 | inter-pane receive | Delivery of kind 29003 to subscriber | `relay:read` (recipient) |

**Note:** `hotkey:forward` is checked on `EVENT` kind 29004, but it's not a separate action type in the list above. It should be covered as its own action.

### Expanded Action Types for Full Coverage

Adding hotkey forward as an action:

| # | Action | Description |
|---|--------|-------------|
| 1 | publish | Publish a regular event |
| 2 | subscribe | Create a REQ subscription |
| 3 | deliver | Receive an event via subscription |
| 4 | sign | Signer request (getPublicKey, signEvent) |
| 5 | state-get | Read from napp state |
| 6 | state-set | Write to napp state |
| 7 | inter-pane emit | Publish a bus event (kind 29003) |
| 8 | inter-pane receive | Receive a bus event via subscription |
| 9 | hotkey-forward | Forward a hotkey event (kind 29004) |

---

## 2. Full Test Matrix

### Which capability gates which action?

| Action | Primary Capability | Denial Response |
|--------|-------------------|-----------------|
| publish | `relay:write` | `OK false "auth-required: relay:write capability denied"` |
| subscribe | `relay:read` | `CLOSED subId "relay:read denied"` |
| deliver | `relay:read` (recipient) | Silent skip (no delivery) |
| sign | `sign:event` | `OK false "sign:event capability denied"` |
| state-get | `state:read` | Error tag `["error", "state:read capability denied"]` |
| state-set | `state:write` | Error tag `["error", "state:write capability denied"]` |
| state-remove | `state:write` | Error tag `["error", "state:write capability denied"]` |
| state-clear | `state:write` | Error tag `["error", "state:write capability denied"]` |
| state-keys | `state:read` | Error tag `["error", "state:read capability denied"]` |
| inter-pane emit | `relay:write` | `OK false "auth-required: relay:write capability denied"` (goes through handleEvent which checks relay:write first) |
| inter-pane receive | `relay:read` (recipient) | Silent skip |
| hotkey-forward | `hotkey:forward` | Event is silently dropped (hotkey handler is just skipped) |

### Important: publish gates signer requests

Looking at `handleEvent()` in pseudo-relay.ts line 255:
```typescript
if (!checkAcl(pubkey, 'relay:write')) { sendOk(false, 'auth-required: relay:write capability denied'); return; }
```

This check happens BEFORE routing to `handleSignerRequest()`. So revoking `relay:write` also blocks signer requests. The `sign:event` check is a secondary check inside `handleSignerRequest()`.

To test `sign:event` denial independently, `relay:write` must remain granted.

### Important: publish gates inter-pane emit and state operations

State operations arrive as `EVENT` kind 29003 with `shell:state-*` topics. They pass through `handleEvent()` which checks `relay:write` first, then routes to `handleStateRequest()` which checks `state:read/state:write`.

Wait — looking more carefully at the code:

```typescript
case BusKind.INTER_PANE: {
  const topic = event.tags?.find((t) => t[0] === 't')?.[1];
  if (topic?.startsWith('shell:state-')) { handleStateRequest(windowId, sourceWindow, event); return; }
```

The state handler is called AFTER the `relay:write` check. So revoking `relay:write` also blocks state operations. The `state:read`/`state:write` checks in `handleStateRequest()` are secondary checks.

**This has test implications:** When testing `state:read` denial in isolation, `relay:write` must remain granted.

---

## 3. Existing Test Coverage Analysis

### Current ACL tests (tests/e2e/acl-enforcement.spec.ts)

9 tests covering:
- ACL-01: Default permissive — unknown napp operates
- ACL-02: Grant relay:write — publish succeeds
- ACL-03: Revoke relay:write — publish denied
- ACL-04: Block — all operations denied
- ACL-05: Unblock — operations resume
- ACL-06: Revoke state:read — getItem denied
- ACL-07: Revoke state:write — setItem denied
- ACL-08: Revoke sign:event — signer request denied
- ACL-09: Persist/load round-trip

### Gaps vs TST-01..06

| Requirement | Current Coverage | Gap |
|-------------|-----------------|-----|
| TST-01 (full matrix) | 4 of 8 capabilities tested | Missing: relay:read, sign:nip04, sign:nip44, hotkey:forward |
| TST-02 (grant/revoke per cell) | Partial — grant+revoke tested for relay:write, state:read, state:write, sign:event | Need grant+revoke for all 8 |
| TST-03 (block/unblock per action) | Block tested once (ACL-04), unblock tested once (ACL-05) | Need per-action type block testing |
| TST-04 (mid-session revoke) | Not tested — current tests revoke before action | Need test that subscribes, then revokes, then verifies next delivery blocked |
| TST-05 (revoke ALL = zero messages) | Partially tested via block (ACL-04) | Need explicit revoke-all-capabilities test |
| TST-06 (persistence) | ACL-09 covers persist/load | Need revoke-reload-verify pattern |

---

## 4. Test Infrastructure Assessment

### Current test setup (from harness.ts)

- Playwright e2e tests using real browser
- Shell boots with `createPseudoRelay(mockHooks)`
- Auth napplet loads, completes AUTH handshake, gets pubkey+dTag+hash
- Test controls exposed via `window.__aclRevoke__`, `__aclGrant__`, `__aclBlock__`, `__aclUnblock__`, `__aclCheck__`, etc.
- Message tap captures all napplet<->shell messages
- Tests use `page.evaluate()` to manipulate ACL and inject messages

### Test helpers available

- `__publishEvent__(windowId, event)` — inject EVENT
- `__createSubscription__(windowId, subId, filters)` — inject REQ
- `__closeSubscription__(windowId, subId)` — inject CLOSE
- `__injectMessage__(windowId, data)` — inject raw message
- `__setSigner__(signer)` — configure mock signer
- `__setConsentHandler__(mode)` — auto-approve or auto-deny consent
- `__injectShellEvent__(topic, payload)` — inject shell event into subscriptions
- `__clearMessages__()` — reset message tap
- `__aclPersist__()` / `__aclLoad__()` — persistence controls
- `__clearLocalStorage__()` — wipe localStorage

### What's needed for new tests

1. **sign:nip04 and sign:nip44 tests** — Need to send signer requests with `method: 'nip04.encrypt'` and `method: 'nip44.encrypt'`. Currently, these route through `handleSignerRequest()` which only checks `sign:event`. The current code does NOT check `sign:nip04` or `sign:nip44` separately — it only checks `sign:event` for all signer requests.

   **Critical finding:** The current codebase does not differentiate between `sign:event`, `sign:nip04`, and `sign:nip44` at the ACL level. The `handleSignerRequest()` function only calls `checkAcl(pubkey, 'sign:event')` regardless of the method. Testing `sign:nip04` and `sign:nip44` as separate capabilities would fail because the enforcement doesn't distinguish them yet.

   **This means Phase 9 (ACL Enforcement Gate) needs to add separate capability checks for NIP-04 and NIP-44 signer methods.** Phase 10 tests would then verify those checks. If Phase 9 hasn't been executed yet, the tests should be written to expect the correct behavior (separate checks per signer method) since they'll run against the Phase 9 output.

2. **hotkey:forward tests** — Need to send kind 29004 events. The check is in `handleEvent()` after the relay:write check.

3. **Delivery-time relay:read tests** — Need two napplets: one sender (keeps relay:write), one receiver (relay:read revoked). Verify the receiver doesn't get deliveries.

4. **Mid-session revoke tests (TST-04)** — Subscribe, verify delivery works, revoke capability, verify next delivery blocked.

---

## 5. Test Organization Strategy

### File structure options

**Option A: Single large test file**
- All matrix tests in one `acl-behavioral-matrix.spec.ts`
- Pros: Single file for the complete matrix
- Cons: Long file, slow serial execution

**Option B: Multiple focused files**
- `acl-matrix-relay.spec.ts` — relay:read, relay:write actions
- `acl-matrix-signer.spec.ts` — sign:event, sign:nip04, sign:nip44 actions
- `acl-matrix-state.spec.ts` — state:read, state:write actions
- `acl-matrix-hotkey.spec.ts` — hotkey:forward actions
- `acl-lifecycle.spec.ts` — mid-session revoke, revoke-all, block/unblock, persistence
- Pros: Parallel execution, focused files
- Cons: More files to maintain

**Recommendation:** Option B — multiple focused files. The lifecycle tests (TST-04, TST-05, TST-06) are conceptually different from the matrix tests (TST-01, TST-02, TST-03).

### Test pattern for matrix cells

Each cell in the matrix should test:
1. **Grant → action succeeds** (TST-02)
2. **Revoke → action denied with correct error** (TST-02)
3. **Block → action denied** (TST-03)
4. **Unblock → action succeeds again** (TST-03)

Template for a matrix cell test:
```typescript
test('relay:write × publish — grant succeeds', async ({ page }) => {
  // Ensure capability is granted (default permissive should cover this)
  // Perform action
  // Assert success
});

test('relay:write × publish — revoke denies', async ({ page }) => {
  // Revoke capability
  // Perform action
  // Assert denial with correct error message
});
```

---

## 6. Dependency on Phase 9 Output

Phase 9 (ACL Enforcement Gate) restructures the code to use a single `enforce()` function. The tests should be written against the Phase 9 API, not the current code. Key changes Phase 9 makes:

1. Single `enforce()` chokepoint instead of scattered `checkAcl()` calls
2. `resolveCapabilities(message)` pure function for capability mapping
3. Denial response format: `denied: capability-name` prefix
4. Separate NIP-04/NIP-44 capability checks (currently all signer requests only check `sign:event`)
5. Audit logging via hooks callback

### Test assertions should use Phase 9 denial format

From Phase 9 CONTEXT.md:
- EVENT denied → `['OK', eventId, false, 'denied: relay:write']`
- REQ denied → `['CLOSED', subId, 'denied: relay:read']`
- State denied → error tag `['error', 'denied: state:write']`
- Delivery denied → silent (no message to sender)

Current code uses different strings:
- `'auth-required: relay:write capability denied'`
- `'relay:read denied'`
- `'state:read capability denied'`

**The Phase 10 tests should use the Phase 9 format (`denied: capability-name`)** since tests are written against the new architecture.

---

## 7. Harness Enhancements Needed

### For delivery-time tests (two-napplet setup)

Currently the existing tests use a single napplet. For testing delivery-time `relay:read` checks, we need:
- Load two auth-napplets
- Both complete AUTH
- One subscribes, sender publishes
- Revoke `relay:read` on receiver
- Sender publishes again
- Verify receiver doesn't get the second event

This requires loading two napplets and tracking which messages go to which. The harness already supports multiple napplets via `loadNapplet()`.

### For NIP-04/NIP-44 signer tests

Need a mock signer with nip04 and nip44 methods:
```typescript
{
  getPublicKey: () => 'a'.repeat(64),
  signEvent: (e) => Promise.resolve(e),
  getRelays: () => ({}),
  nip04: {
    encrypt: (pubkey, plaintext) => Promise.resolve('encrypted'),
    decrypt: (pubkey, ciphertext) => Promise.resolve('decrypted'),
  },
  nip44: {
    encrypt: (pubkey, plaintext) => Promise.resolve('encrypted'),
    decrypt: (pubkey, ciphertext) => Promise.resolve('decrypted'),
  },
}
```

The existing `__setSigner__` harness function can accept this.

---

## 8. Validation Architecture

### Test Strategy

**Framework:** Playwright Test (existing)
**Config:** tests/e2e/vite.config.ts (existing)
**Quick run:** `npx playwright test acl-matrix` (glob match)
**Full run:** `npx playwright test tests/e2e/acl-*.spec.ts`

### Per-requirement verification

| Requirement | Test File(s) | What Passes |
|-------------|-------------|-------------|
| TST-01 | acl-matrix-*.spec.ts | All 8×8+ matrix cells have at least one test |
| TST-02 | acl-matrix-*.spec.ts | Each cell has grant-succeeds AND revoke-denies test |
| TST-03 | acl-lifecycle.spec.ts | Block/unblock tested for every action type |
| TST-04 | acl-lifecycle.spec.ts | Mid-session revoke test shows next message blocked |
| TST-05 | acl-lifecycle.spec.ts | Revoke ALL capabilities → zero messages |
| TST-06 | acl-lifecycle.spec.ts | Persist → reload → verify still revoked |

---

## 9. Risk Assessment

### Medium Risk
- **Phase 9 dependency** — Tests are designed for Phase 9's enforcement model. If Phase 9 changes denial format or capability resolution, tests need updating.
- **NIP-04/NIP-44 separate checks** — Current code doesn't distinguish. Phase 9 must add this. Tests should be written for the expected behavior.
- **Two-napplet delivery tests** — More complex setup, potential timing issues with two AUTH handshakes.

### Low Risk
- **Matrix test completeness** — Well-defined, systematic approach
- **Harness capabilities** — Existing harness supports all needed operations
- **Block/unblock** — Already partially tested, extending is straightforward

### Mitigated by Design
- **Test isolation** — Each test clears ACL state in beforeEach
- **Timing** — Use `expect.poll()` for async assertions (already proven in existing tests)
- **Mock signer** — Already supported by harness

---

## RESEARCH COMPLETE

Research covers all requirements (TST-01 through TST-06). Key findings:
1. Current code has 9 ACL tests covering ~40% of the required matrix
2. Missing: relay:read subscribe/deliver, sign:nip04, sign:nip44, hotkey:forward
3. Phase 9 must add separate sign:nip04/sign:nip44 checks — current code only checks sign:event
4. Tests should use Phase 9's denial format (`denied: capability-name`)
5. Delivery-time tests need two-napplet setup (supported by harness)
6. Recommend multiple focused test files over single monolith
