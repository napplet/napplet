# Phase 3: Core Protocol Tests — Research

**Researched:** 2026-03-30
**Confidence:** HIGH
**Phase Goal:** The fundamental protocol mechanics -- authentication, message routing, replay protection, and lifecycle management -- are proven correct by automated tests

## Executive Summary

Phase 3 writes 28 Playwright tests covering AUTH handshake (9 scenarios), message routing (9 scenarios), replay protection (5 scenarios), and lifecycle management (5 scenarios). All tests run in real Chromium using the Phase 2 test infrastructure: shell harness with mock hooks, message tap, and test napplets served via NIP-5A gateway.

The critical implementation insight is that most tests exercise `pseudo-relay.ts` functions through the full postMessage pipeline (harness → iframe → shell → back), but some (replay detection, filter matching) are pure functions testable in Node-mode Vitest for speed. The recommendation is to keep all 28 tests in Playwright for protocol fidelity, with optional Vitest unit tests for the pure functions as a bonus.

## Research Findings

### AUTH Test Architecture

**AUTH-01 through AUTH-09 share a common test pattern:**

1. Load shell harness, wait for `__SHELL_READY__`
2. For the happy path (AUTH-01): load auth-napplet, wait for OK with success=true
3. For rejection paths (AUTH-02 through AUTH-09): need a way to send malformed AUTH events

**Challenge: How to send malformed AUTH events from a sandboxed iframe**

The auth-napplet uses @napplet/shim which auto-generates valid AUTH responses. To test rejection paths, we need to either:

- **Option A: Create a "malicious-napplet" test fixture** that sends hand-crafted AUTH events with specific defects (bad signature, wrong challenge, expired timestamp, etc.). This requires a napplet that does NOT import @napplet/shim and instead manually constructs postMessages.
- **Option B: Bypass the iframe entirely** and call `relay.handleMessage()` directly via `page.evaluate()` with a mock MessageEvent. This tests the pseudo-relay logic but not the real postMessage boundary.
- **Option C: Use the harness to inject messages** by exposing a `__sendRawMessage__(windowId, msg)` function that constructs a MessageEvent and dispatches it.

**Recommendation: Option C (harness message injection).** This tests the real `handleMessage()` code path including the `event.source` and `Array.isArray(event.data)` checks, without needing separate malicious napplet builds for each failure mode. The harness can expose a function like:

```typescript
window.__injectMessage__ = (windowId: string, data: unknown[]) => {
  const iframe = nappletFrames.get(windowId);
  if (!iframe?.contentWindow) return;
  // Dispatch a MessageEvent as if it came from the iframe
  const event = new MessageEvent('message', {
    data,
    source: iframe.contentWindow,
    origin: 'null', // sandboxed iframe origin
  });
  window.dispatchEvent(event);
};
```

This approach:
- Reuses the existing auth-napplet for the happy path (AUTH-01)
- Tests all rejection paths through the same `handleMessage()` entry point
- Allows precise control over AUTH event fields (kind, challenge, relay tag, timestamp, signature)
- Does NOT require building separate malicious napplets for each rejection scenario

For AUTH-08 (missing type tag) and AUTH-09 (missing aggregateHash tag), the CONTEXT.md decision D-02 says these should now FAIL (changing from current permissive behavior). The tests will assert `OK false` responses, and if the current code doesn't match, implementation changes are needed.

**Generating valid-but-defective AUTH events:**

Tests need to create kind 22242 events with real Schnorr signatures but specific defects. Using `nostr-tools/pure` in the test code (Node side), we can:

1. Generate an ephemeral keypair
2. Create a kind 22242 event template with the desired defect
3. Sign it with `finalizeEvent()`
4. Inject it via the harness

For "bad signature" (AUTH-02), sign a valid event then corrupt the signature bytes.
For "expired timestamp" (AUTH-03), set `created_at` to 120 seconds ago.
For "wrong challenge" (AUTH-05), use a different challenge value than what the shell sent.
For "wrong relay tag" (AUTH-06), set relay tag to `wss://malicious.com`.
For "wrong kind" (AUTH-07), set kind to 1 instead of 22242.

### Message Routing Test Architecture

**MSG-01 through MSG-09 test the subscription and event delivery system.**

These tests need at least two authenticated napplets to verify inter-pane routing (sender exclusion, p-tag targeting). The test pattern:

1. Boot harness
2. Load two napplets (auth-napplet instances with different windowIds)
3. Wait for both to complete AUTH
4. Use `__injectMessage__` or napplet actions to create subscriptions and publish events
5. Assert on message tap captures

**Key test helper needed: `__createSubscription__(windowId, subId, filters)`**

Rather than relying on napplets to create subscriptions (which couples tests to shim behavior), the harness can expose a function that simulates a REQ from a specific windowId:

```typescript
window.__createSubscription__ = (windowId: string, subId: string, filters: NostrFilter[]) => {
  const iframe = nappletFrames.get(windowId);
  if (!iframe?.contentWindow) return;
  const event = new MessageEvent('message', {
    data: ['REQ', subId, ...filters],
    source: iframe.contentWindow,
    origin: 'null',
  });
  window.dispatchEvent(event);
};
```

Similarly: `__publishEvent__(windowId, event)` and `__closeSubscription__(windowId, subId)`.

**MSG-06 (Sender exclusion):** CONTEXT.md D-07 clarifies this applies ONLY to kind 29003 (inter-pane topic events). The test must verify:
- Kind 29003 events: sender excluded from own delivery
- Normal events: sender CAN receive their own event via subscription

**MSG-08 (Pre-AUTH message queue):** CONTEXT.md D-08 specifies a 50-message cap. The current code has no cap — this is a new behavior that may need implementation changes. The test should:
- Send REQ before AUTH completes
- Complete AUTH
- Verify the queued REQ is replayed

**MSG-09 (Blocked napp REQ):** CONTEXT.md D-09 specifies the CLOSED reason is `blocked: capability denied`. The current code sends `relay:read denied`. Tests should assert the format from CONTEXT.md, and implementation should be updated if needed.

### Replay Detection Test Architecture

**RPL-01 through RPL-05 test the `checkReplay()` function.**

These are the most "unit-testable" of the 28 scenarios. `checkReplay()` is a pure function (depends only on `seenEventIds` map and system time). However, CONTEXT.md D-04 says all tests run in Playwright for real-browser validation.

**Test approach:** Use `__publishEvent__()` with events having specific timestamps and IDs:

- RPL-01: Event with `created_at` = `now - 31` seconds → rejected "too old"
- RPL-02: Event with `created_at` = `now + 11` seconds → rejected "in the future"
- RPL-03: Same event ID published twice → second rejected "already processed"
- RPL-04: Publish event, wait > 30 seconds, check if ID is cleaned from seen set (may need to mock time or use a shorter window for testing)
- RPL-05: Message from unregistered window → ignored (no windowId match in origin registry)

**RPL-04 concern:** Waiting 30+ seconds in a test is slow. Options:
1. Accept the wait (30s is tolerable for one test)
2. Expose `REPLAY_WINDOW_SECONDS` as configurable via hooks
3. Mock `Date.now()` in the browser via `page.addInitScript()`

Recommendation: Option 3 (mock Date.now) for the cleanup test. Use `page.addInitScript()` to override `Date.now()` with a controllable clock.

### Lifecycle Test Architecture

**LCY-01 through LCY-05 test edge cases and cleanup.**

- LCY-01: Same as MSG-08 (messages queued during AUTH). May be tested together.
- LCY-02: AUTH rejection clears queue. Send REQ before AUTH, then send invalid AUTH event. Verify REQ is NOT replayed and NOTICE about dropped messages is sent.
- LCY-03: `cleanup()` removes all state. After AUTH + subscriptions + buffered events, call `relay.cleanup()` via `page.evaluate(() => window.__getRelay__().cleanup())`. Verify subscriptions map is empty, event buffer is empty, etc.
- LCY-04: Non-array postMessage. Send `window.postMessage('not-an-array', '*')` from an iframe. Verify no error, no crash, message is silently ignored.
- LCY-05: Null source window. Create a MessageEvent with `source: null`. Verify it's silently ignored. This tests the `if (!sourceWindow) return;` guard.

### Harness Extensions Required

The Phase 2 harness needs several extensions for Phase 3 tests:

1. **`__injectMessage__(windowId, data)`** — Construct and dispatch a MessageEvent as if from the specified iframe
2. **`__createSubscription__(windowId, subId, filters)`** — Shorthand for injecting a REQ message
3. **`__publishEvent__(windowId, event)`** — Shorthand for injecting an EVENT message
4. **`__closeSubscription__(windowId, subId)`** — Shorthand for injecting a CLOSE message
5. **`__getRelay__()`** — Already exists, returns the PseudoRelay instance
6. **`__getChallenge__(windowId)`** — Returns the pending challenge string for a windowId (needed to construct valid AUTH events)

These helpers should be added to `tests/e2e/harness/harness.ts` as part of this phase.

### Test File Organization

**Recommendation: 4 test files matching the 4 requirement categories:**

1. `tests/e2e/auth.spec.ts` — AUTH-01 through AUTH-09
2. `tests/e2e/routing.spec.ts` — MSG-01 through MSG-09
3. `tests/e2e/replay.spec.ts` — RPL-01 through RPL-05
4. `tests/e2e/lifecycle.spec.ts` — LCY-01 through LCY-05

Each file uses `test.describe()` with the requirement ID in the description (per Phase 2 D-04).

### Implementation Changes Required

Some tests will expose behavior differences between current code and CONTEXT.md decisions:

1. **AUTH-08/AUTH-09:** Current code accepts missing type/aggregateHash tags with defaults. CONTEXT.md D-02 says these should fail. Either update `pseudo-relay.ts` `handleAuth()` or note as a test-discovered issue.

2. **MSG-08 queue cap:** Current code has no queue size limit. CONTEXT.md D-08 specifies 50 messages. This may need implementation.

3. **MSG-09 CLOSED reason:** Current code sends `relay:read denied`. CONTEXT.md D-09 says `blocked: capability denied`. This needs implementation update.

The recommendation is: **write tests asserting the CONTEXT.md behavior, then fix the implementation to match.** Tests drive the spec.

### Risk Assessment

| Area | Risk | Mitigation |
|------|------|------------|
| Sandboxed iframe postMessage timing | Medium | Use `expect.poll()` with generous timeouts (15s) |
| AUTH event construction in Node | Low | nostr-tools `finalizeEvent()` is well-tested |
| Message tap missing outbound messages | Medium | Verify tap.recordOutbound wrapper works for injected messages |
| RPL-04 time-based cleanup | Medium | Mock Date.now() via page.addInitScript |
| Harness extensions breaking existing tests | Low | Extensions are additive (new functions on window) |

## Validation Architecture

### Dimension 1: Functional Correctness
- Every requirement ID (AUTH-01..09, MSG-01..09, RPL-01..05, LCY-01..05) has at least one test assertion
- Tests assert on specific NIP-01 message content (verb, success, reason strings)

### Dimension 2: Edge Case Coverage
- Boundary timestamps (exactly 60s, exactly 10s future)
- Empty filter arrays (match all)
- Missing tags (AUTH-08, AUTH-09)
- Null/undefined source windows

### Dimension 3: Integration Points
- Tests use real pseudo-relay (not mocked)
- Tests use real message tap (not mocked)
- Tests use real Chromium postMessage (not jsdom)

### Dimension 4: Regression Protection
- Each test is independent (cleanup between tests)
- No shared state between test files
- Deterministic — no random data in assertions

---

*Phase: 03-core-protocol-tests*
*Research completed: 2026-03-30*
