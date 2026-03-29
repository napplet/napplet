# Testing Patterns

**Analysis Date:** 2026-03-29

## Test Framework

**Runner:**
- No test runner configured
- No vitest, Jest, or Mocha config files present in monorepo
- Turbo task `test` exists in `turbo.json` but no implementation

**Assertion Library:**
- Not detected

**Run Commands:**
```bash
pnpm test              # Defined in turbo.json but not implemented
pnpm type-check        # TypeScript validation only (primary verification method)
```

## Testing Status

**Current State:**
- The codebase has **no automated test files** (no `.test.ts`, `.spec.ts` files present)
- Testing relies entirely on **TypeScript strict mode validation** (`type-check` task)
- All verification is compile-time: `tsc --noEmit`

## Type Checking as Primary Verification

**Primary validation method:**
```bash
pnpm type-check        # Runs in all packages via turbo
```

**Configuration** (`tsconfig.json`):
- `"strict": true` — Enforces null checks, explicit types, function return types
- `"moduleResolution": "bundler"` — ESM module resolution
- `"verbatimModuleSyntax": true` — Requires explicit `import type` for types only
- `"isolatedModules": true` — Validates each file can be transpiled independently
- `"forceConsistentCasingInFileNames": true` — Case-sensitive file matching

## Test File Organization

**Status:** Not applicable (no tests)

**Recommendation for future testing:**
- Co-locate tests with source: `src/relay-shim.ts` would have `src/relay-shim.test.ts`
- Naming convention: `*.test.ts` or `*.spec.ts`
- Test directories: `tests/` or `__tests__/` at package root if separated

## Test Structure

No tests present. Below is the expected structure based on codebase patterns:

**Proposed unit test structure** for Promise-based APIs (following NIP-01 message patterns):
```typescript
describe('subscribe()', () => {
  it('should open a subscription and deliver events', () => {
    // Setup: Mock window.parent.postMessage
    // Call: subscribe(filters, onEvent, onEose)
    // Assert: Verify REQ message sent with correct subId
    // Simulate: postMessage(['EVENT', subId, event])
    // Assert: onEvent called with event
  });

  it('should handle EOSE and close', () => {
    // Similar structure: verify EOSE → cleanup
  });

  it('should timeout after 30 seconds for signer requests', () => {
    // Test timeout rejection for sendSignerRequest()
  });
});
```

## Mocking

**Framework:** Not detected (no mocking library configured)

**Patterns to establish for future tests:**

**What to Mock:**
- `window.parent.postMessage()` — Core IPC mechanism in shim
- `window.addEventListener()` — Event subscription in relay-shim and storage-shim
- `localStorage` — Required for ACL persistence and storage proxy
- `crypto.randomUUID()` — Subscription ID generation
- `nostr-tools` crypto functions — Key generation and signing
- `fetch()` or relay pool in shell-side tests

**What NOT to Mock:**
- TypeScript types and interfaces (compile-time only)
- Protocol constants (`BusKind`, `AUTH_KIND`)
- Core business logic (ACL checks, storage scoping, AUTH verification)
- Error handling paths (should test actual error behavior)

## Fixtures and Factories

**Test Data:**
No fixtures present. Recommended fixtures for future tests:

```typescript
// fixtures/nostr-events.ts
const mockEvent: NostrEvent = {
  id: 'abc123...',
  pubkey: 'def456...',
  created_at: Math.floor(Date.now() / 1000),
  kind: 1,
  tags: [],
  content: 'test',
  sig: 'valid-sig-hex',
};

const mockAuthEvent: NostrEvent = {
  ...mockEvent,
  kind: 22242,
  tags: [
    ['relay', 'hyprgate://shell'],
    ['challenge', 'test-challenge'],
    ['type', 'test-napp'],
  ],
};

const mockFilter: NostrFilter = {
  kinds: [1, 7],
  limit: 20,
};
```

**Location:**
- Recommend: `packages/shim/__tests__/fixtures/` and `packages/shell/__tests__/fixtures/`

## Coverage

**Requirements:** None enforced

**Target (recommended):** Minimum 80% for public API surface

**View Coverage (future setup):**
```bash
# Would be added once framework is chosen
pnpm test --coverage
```

## Test Types

**Unit Tests (to implement):**
- Scope: Individual functions like `subscribe()`, `publish()`, `query()`, `emit()`, `on()`
- Approach: Mock postMessage and verify message format and callback invocation
- Files: `src/__tests__/relay-shim.test.ts`, `src/__tests__/storage-shim.test.ts`

**Integration Tests (to implement):**
- Scope: Napplet ↔ Shell IPC via pseudo-relay
- Approach: Full pseudo-relay with mock relay pool; verify end-to-end message flow
- Test: AUTH handshake, REQ→EVENT delivery, ACL enforcement, storage proxy
- Files: `packages/shell/__tests__/pseudo-relay.test.ts`

**E2E Tests (out of scope for this library):**
- Would test in hyprgate reference implementation
- Framework: Playwright or Puppeteer
- Scope: Full browser iframe + shell communication

## Common Patterns to Test

**Async Testing:**
The codebase heavily uses Promises. Recommended test pattern:

```typescript
it('should resolve signer request', async () => {
  const promise = sendSignerRequest('getPublicKey');
  // Simulate shell response
  window.parent.postMessage(['EVENT', SIGNER_SUB_ID, {
    kind: BusKind.SIGNER_RESPONSE,
    tags: [['id', correlationId], ['result', JSON.stringify(pubkey)]],
    ...
  }], '*');
  const result = await promise;
  expect(result).toEqual(pubkey);
});

it('should reject on timeout', async () => {
  const promise = sendSignerRequest('getPublicKey');
  // Don't send response
  await expect(promise).rejects.toThrow('Signer request timed out');
});
```

**Error Testing:**
Protocol validation returns errors without throwing:

```typescript
it('should return auth-required error before AUTH', () => {
  const result = handleEvent(['EVENT', mockEvent], windowId, sourceWindow);
  expect(sourceWindow.postMessage).toHaveBeenCalledWith(
    ['OK', mockEvent.id, false, 'auth-required: complete AUTH first'],
    '*'
  );
});

it('should catch storage write errors gracefully', () => {
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('QuotaExceededError');
  });
  // Should call sendError, not throw
  expect(() => handleStorageRequest(...)).not.toThrow();
});
```

**Message Protocol Testing:**
Core behavior is message-based (NIP-01 wire format):

```typescript
describe('Pseudo-relay message handling', () => {
  it('handles REQ and delivers events to matching subscriptions', () => {
    // Setup: subscribe with filter
    handleMessage(createMessageEvent(['REQ', subId, { kinds: [1] }]));

    // Inject event
    const event = createMockEvent({ kind: 1 });
    handleMessage(createMessageEvent(['EVENT', subId, event]));

    // Assert: callback received event
    expect(onEvent).toHaveBeenCalledWith(event);
  });

  it('rejects events before AUTH challenge', () => {
    const event = createMockEvent();
    handleMessage(createMessageEvent(['EVENT', event]));
    expect(sourceWindow.postMessage).toHaveBeenCalledWith(
      ['OK', event.id, false, expect.stringContaining('auth-required')]
    );
  });
});
```

## Current State Summary

| Aspect | Status | Notes |
|--------|--------|-------|
| Unit tests | ❌ Not implemented | No test files present |
| Integration tests | ❌ Not implemented | Pseudo-relay test suite needed |
| E2E tests | ❌ Out of scope | Belongs in hyprgate repo |
| Type checking | ✅ Implemented | Primary verification method |
| Coverage tracking | ❌ Not configured | No coverage metrics |
| Test framework | ⚠️ Not chosen | Recommendation: vitest (ESM-native, fast) |
| Mocking library | ⚠️ Not chosen | Recommendation: vitest built-in mocks + @testing-library/dom |

## Recommendations for Implementation

**Phase 1: Unit tests**
1. Add `vitest` and `@vitest/ui` to devDependencies
2. Create `packages/shim/__tests__/` and `packages/shell/__tests__/`
3. Test public APIs: `subscribe()`, `publish()`, `query()`, `emit()`, `on()` in shim
4. Test registries and ACL store in shell

**Phase 2: Integration tests**
1. Test `createPseudoRelay()` with mock hooks
2. Full AUTH flow: challenge → response → registry update
3. Storage proxy request/response cycle
4. Event delivery with ACL enforcement

**Phase 3: Coverage**
1. Configure coverage thresholds (80%+ for public APIs)
2. Set up CI to enforce minimum coverage
3. Exclude internal helpers and one-off utilities

---

*Testing analysis: 2026-03-29*
