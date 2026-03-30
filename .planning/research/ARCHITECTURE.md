# Architecture Patterns: Demo + Behavioral Test Suite for Napplet Protocol

**Domain:** Sandboxed iframe protocol SDK (demo playground + conformance tests)
**Researched:** 2026-03-30

## Recommended Architecture

### Core Insight: Separate Demo App from Test Runner, Share Test Napplets

The demo and test suite should be **separate applications that share a common library of test napplets and a protocol message tap**. This is the pattern used successfully by comparable SDK projects:

- **Figma** separates its plugin sandbox (QuickJS/WASM) from the developer playground (Figlet). The playground is interactive; the test suite runs in CI. Both exercise the same plugin API surface.
- **Telegram Mini Apps (tma.js)** separates demo apps (`apps/` directory) from the SDK test suite, but provides `mockTelegramEnv()` to simulate the host environment for testing outside Telegram. The mock bridges the gap between "run it for real" and "test it headlessly."
- **Shopify App Bridge** has a community `mock-bridge` project that provides a mock Shopify Admin iframe host for Playwright-based automated testing, separate from the real embedded app experience.
- **Nostr relay-tester** (mikedilger/relay-tester) runs as a standalone CLI tool that sends protocol messages and asserts responses, completely separate from any relay UI.

**Why separate, not combined:**

1. **Different audiences.** The demo is for SDK consumers evaluating the protocol. The test suite is for SDK maintainers verifying conformance. Forcing both into one app compromises both.
2. **Different lifecycles.** Tests run in CI headlessly (Playwright). The demo runs in a browser interactively. Combining them means the demo must work headlessly (fragile) or tests must work interactively (slow, flaky).
3. **Different assertion models.** Tests need programmatic pass/fail. The demo needs visual message flow. A combined app would need both, which creates UI complexity that distracts from either purpose.
4. **Shared napplets reduce duplication.** A `test-napplets/` package contains tiny single-purpose napplets (auth-only, publish-only, subscribe-only, storage-only, inter-pane-only). Both the demo and the test runner load these same napplets.

**Confidence:** HIGH -- this separation pattern is consistent across Figma, Telegram, Shopify, and Nostr relay testing ecosystems.

### Architecture Diagram

```
packages/
  shell/                    # @napplet/shell (existing)
  shim/                     # @napplet/shim (existing)
  vite-plugin/              # @napplet/vite-plugin (existing)

apps/
  demo/                     # Interactive playground (Vite app)
    src/
      shell-host.ts         # createPseudoRelay with mock ShellHooks
      message-tap.ts        # Protocol message interceptor/logger
      ui/                   # Visual message flow panel
      napplet-frames.ts     # iframe loader/manager
    public/
      index.html

  test-napplets/            # Tiny purpose-built napplets (each is a Vite app)
    auth-napplet/           # Only does AUTH handshake
    publish-napplet/        # Only publishes events
    subscribe-napplet/      # Only subscribes to events
    storage-napplet/        # Only uses nappStorage
    inter-pane-napplet/     # Only uses emit/on
    acl-probe-napplet/      # Tries operations across all capabilities
    signer-napplet/         # Only uses window.nostr proxy
    malicious-napplet/      # Intentionally violates protocol (replay, bad sig, etc.)

tests/
  protocol/                 # Behavioral test suite (Playwright + vitest)
    auth.spec.ts            # AUTH handshake conformance
    acl.spec.ts             # ACL enforcement scenarios
    storage.spec.ts         # Storage proxy conformance
    inter-pane.spec.ts      # Inter-pane pubsub conformance
    signer.spec.ts          # Signer proxy conformance
    replay.spec.ts          # Replay attack prevention
    lifecycle.spec.ts       # Subscription lifecycle (REQ/EVENT/EOSE/CLOSE)
    adversarial.spec.ts     # Malicious napplet rejection
    fixtures/
      shell-harness.ts      # Reusable Playwright test fixture
      message-collector.ts  # postMessage tap for assertions
```

### Component Boundaries

| Component | Responsibility | Communicates With | Package Type |
|-----------|---------------|-------------------|-------------|
| **Demo Shell** (`apps/demo/`) | Interactive playground. Hosts 2+ napplets, shows message flow, ACL controls | Test napplets via postMessage; user via UI | Vite SPA |
| **Test Napplets** (`apps/test-napplets/`) | Minimal napplets exercising one capability each | Shell host via postMessage | Multiple Vite micro-apps |
| **Protocol Tests** (`tests/protocol/`) | Headless behavioral tests asserting protocol conformance | Demo shell (or standalone harness) via Playwright page | Vitest + Playwright |
| **Message Tap** (shared utility) | Intercepts all postMessage traffic for logging/assertion | Sits between shell and napplets | TypeScript module |
| **Shell Harness** (test fixture) | Boots a shell with mock hooks, loads napplets, exposes message tap | Used by Playwright tests | TypeScript module |

## Component Details

### 1. Message Tap (the critical shared abstraction)

The message tap is the architectural lynchpin. Both the demo UI and the test assertions need to observe protocol messages without modifying them. This is a **transparent interceptor** pattern.

**Design:**

```typescript
// message-tap.ts
export interface TappedMessage {
  timestamp: number;
  direction: 'napplet-to-shell' | 'shell-to-napplet';
  windowId: string;
  verb: string;             // EVENT, REQ, CLOSE, AUTH, OK, EOSE, etc.
  raw: unknown[];           // The full NIP-01 message array
  parsed: {
    subId?: string;
    eventKind?: number;
    eventId?: string;
    topic?: string;         // For inter-pane events
    success?: boolean;      // For OK responses
    reason?: string;        // For OK/CLOSED reasons
  };
}

export interface MessageTap {
  /** All captured messages in order */
  messages: TappedMessage[];
  /** Wait for a message matching a predicate */
  waitFor(predicate: (msg: TappedMessage) => boolean, timeoutMs?: number): Promise<TappedMessage>;
  /** Filter messages by direction, verb, windowId */
  filter(criteria: Partial<Pick<TappedMessage, 'direction' | 'verb' | 'windowId'>>): TappedMessage[];
  /** Clear captured messages */
  clear(): void;
  /** Subscribe to messages in real-time */
  onMessage(callback: (msg: TappedMessage) => void): () => void;
}
```

**Implementation approach:** Monkey-patch `Window.prototype.postMessage` at the shell host level before any iframes load. Every call goes through the tap, which logs and then calls the original. For shell-to-napplet direction, wrap the `postMessage` calls in the pseudo-relay similarly.

This is the same approach used by [chrome-postMessage-debugger](https://github.com/bdo/chrome-postMessage-debugger) and the general `monitorEvents(window, 'message')` pattern documented in Chrome DevTools.

**Confidence:** HIGH -- postMessage monkey-patching is well-established and reliable.

### 2. Demo Shell (`apps/demo/`)

A standalone Vite SPA that serves as an interactive protocol playground. Not published to npm -- it lives in the monorepo for development and documentation.

**Key design decisions:**

- **Mock ShellHooks, not real relays.** The demo provides stub implementations of `RelayPoolHooks`, `AuthHooks`, etc. that simulate relay behavior with canned data. This means the demo works offline, without a Nostr identity, and without connecting to real relays. This follows the `mockTelegramEnv` pattern from tma.js -- fake the host environment so the SDK works standalone.

- **Visual message flow panel.** A scrolling log showing every protocol message with direction arrows, color-coded by verb (AUTH=purple, EVENT=green, REQ=blue, OK=gray, etc.). This panel consumes the Message Tap's `onMessage` callback.

- **Napplet frame manager.** A UI panel showing loaded napplets with controls: load, unload, block (ACL), unblock. Each napplet gets a labeled iframe with a unique windowId.

- **ACL control panel.** Toggle capabilities per napplet in real-time. Show the effect immediately in the message flow (e.g., revoke `relay:write`, see the next EVENT get `OK false`).

**UI layout:**

```
+--------------------------------------------------+
|  Napplet Protocol Playground                      |
+--------------------------------------------------+
| [Load Napplet v] [Clear Log] [Pause/Resume]       |
+-------------------+------------------------------+
|                   |                              |
|  Napplet A        |   Protocol Message Flow      |
|  [iframe]         |   ========================   |
|                   |   <- AUTH challenge #a1       |
|  Napplet B        |   -> AUTH response #a1       |
|  [iframe]         |   <- OK #a1 true             |
|                   |   -> REQ sub_1 {kinds:[1]}   |
|  ACL Controls     |   <- EOSE sub_1              |
|  [ ] relay:read   |   -> EVENT {kind:29003}      |
|  [ ] relay:write  |   <- EVENT sub_2 {kind:...}  |
|  [ ] sign:event   |                              |
|  [ ] storage:*    |                              |
+-------------------+------------------------------+
```

**Not a framework app.** The demo should be vanilla TypeScript + minimal DOM manipulation (or at most a tiny reactive library like lit-html). No React, no Svelte. This is an SDK playground -- it should demonstrate the SDK, not a framework.

**Confidence:** HIGH -- this is a standard pattern for SDK playgrounds. Figma's plugin console, Telegram's templates, and Shopify's mock-bridge all follow this model.

### 3. Test Napplets (`apps/test-napplets/`)

Each test napplet is a minimal Vite app that imports `@napplet/shim` and exercises exactly one protocol capability. They are built separately and served as static HTML during tests.

**Design principles:**

- **One napplet per capability.** `auth-napplet` only does AUTH. `publish-napplet` only publishes. This isolation makes test failures unambiguous -- if `publish.spec.ts` fails, the problem is in publish handling, not auth.
- **Deterministic behavior.** Each napplet performs a fixed sequence of operations on load (after AUTH). No user interaction needed. This enables headless Playwright testing.
- **Configurable via query params or meta tags.** Tests can control napplet behavior by varying the URL query string (e.g., `?action=publish&kind=1&content=hello`). The napplet reads these params and acts accordingly.

**Example: `auth-napplet`**

```typescript
// auth-napplet/src/main.ts
import '@napplet/shim';
// That's it. Importing shim triggers AUTH handshake automatically.
// The test asserts that AUTH messages were exchanged correctly.
```

**Example: `publish-napplet`**

```typescript
// publish-napplet/src/main.ts
import { publish } from '@napplet/shim';

const params = new URLSearchParams(location.search);
const kind = parseInt(params.get('kind') ?? '1');
const content = params.get('content') ?? 'test';

// Wait for AUTH to complete (shim handles this internally)
setTimeout(async () => {
  await publish({ kind, content, tags: [], created_at: Math.floor(Date.now() / 1000) });
  // Signal completion to test harness
  window.parent.postMessage(['__TEST_DONE__', 'publish'], '*');
}, 500);
```

**Example: `malicious-napplet`**

```typescript
// malicious-napplet/src/main.ts
// Does NOT import @napplet/shim -- crafts raw messages
const params = new URLSearchParams(location.search);
const attack = params.get('attack');

switch (attack) {
  case 'skip-auth':
    // Send REQ without completing AUTH
    window.parent.postMessage(['REQ', 'sub_1', { kinds: [1] }], '*');
    break;
  case 'replay':
    // Send same event twice with same id
    const event = { /* ... */ };
    window.parent.postMessage(['EVENT', event], '*');
    window.parent.postMessage(['EVENT', event], '*');
    break;
  case 'bad-verb':
    window.parent.postMessage(['INVALID_VERB', 'data'], '*');
    break;
}
```

**Confidence:** HIGH -- purpose-built test apps are the standard pattern for protocol testing. The nostr relay-tester does exactly this.

### 4. Protocol Test Suite (`tests/protocol/`)

Playwright-based behavioral tests that spin up a real browser, load the demo shell (or a stripped-down shell harness), embed test napplets, and assert protocol conformance by observing messages through the message tap.

**Why Playwright, not jsdom/happy-dom:**

- The protocol relies on real `postMessage` between real iframes. jsdom and happy-dom do not support real iframe `contentWindow` references, cross-origin postMessage delivery, or the `MessageEvent.source` property that `originRegistry` depends on.
- Playwright provides real browser iframes with real postMessage semantics. This is the only way to test the actual protocol behavior.
- Vitest browser mode runs tests inside an iframe itself (using BroadcastChannel), which conflicts with testing iframe-to-parent communication.

**Test structure:**

```typescript
// tests/protocol/auth.spec.ts
import { test, expect } from '@playwright/test';
import { ShellHarness } from './fixtures/shell-harness';

test.describe('AUTH handshake', () => {
  let harness: ShellHarness;

  test.beforeEach(async ({ page }) => {
    harness = new ShellHarness(page);
    await harness.boot();
  });

  test('completes AUTH with valid signature', async () => {
    const napplet = await harness.loadNapplet('auth-napplet');

    // Assert: shell sent AUTH challenge
    const challenge = await harness.tap.waitFor(
      m => m.verb === 'AUTH' && m.direction === 'shell-to-napplet'
    );
    expect(challenge.raw[1]).toBeTruthy(); // challenge string

    // Assert: napplet responded with AUTH event
    const response = await harness.tap.waitFor(
      m => m.verb === 'AUTH' && m.direction === 'napplet-to-shell'
    );
    expect(response.parsed.eventKind).toBe(22242);

    // Assert: shell accepted with OK true
    const ok = await harness.tap.waitFor(
      m => m.verb === 'OK' && m.direction === 'shell-to-napplet'
    );
    expect(ok.parsed.success).toBe(true);
  });

  test('rejects AUTH with wrong challenge', async () => {
    // Load a napplet that sends AUTH with a mismatched challenge
    const napplet = await harness.loadNapplet('malicious-napplet', {
      attack: 'wrong-challenge'
    });

    const ok = await harness.tap.waitFor(
      m => m.verb === 'OK' && m.direction === 'shell-to-napplet'
    );
    expect(ok.parsed.success).toBe(false);
    expect(ok.parsed.reason).toContain('challenge mismatch');
  });
});
```

**Shell Harness fixture:**

```typescript
// tests/protocol/fixtures/shell-harness.ts
export class ShellHarness {
  private page: Page;
  tap: MessageCollector;

  constructor(page: Page) {
    this.page = page;
    this.tap = new MessageCollector();
  }

  async boot(): Promise<void> {
    // Navigate to a minimal HTML page that:
    // 1. Imports @napplet/shell
    // 2. Creates mock ShellHooks
    // 3. Calls createPseudoRelay(hooks)
    // 4. Installs message tap on window
    // 5. Exposes tap data via window.__TEST_TAP__
    await this.page.goto('http://localhost:5173/test-harness.html');
    await this.page.waitForFunction(() => (window as any).__SHELL_READY__);
  }

  async loadNapplet(name: string, params?: Record<string, string>): Promise<string> {
    const windowId = await this.page.evaluate(
      ([name, params]) => (window as any).__loadNapplet__(name, params),
      [name, params ?? {}]
    );
    return windowId;
  }
}
```

**Message Collector (Playwright side):**

The message collector bridges browser-side postMessage interception to Playwright test assertions. The browser-side tap pushes messages to `window.__TEST_TAP__`, and the Playwright test polls or subscribes to this array.

```typescript
// tests/protocol/fixtures/message-collector.ts
export class MessageCollector {
  constructor(private page: Page) {}

  async waitFor(
    predicate: (msg: TappedMessage) => boolean,
    timeoutMs = 5000
  ): Promise<TappedMessage> {
    return this.page.evaluate(
      ([predFn, timeout]) => {
        return new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('waitFor timeout')), timeout);
          // Check existing messages
          for (const msg of (window as any).__TEST_MESSAGES__) {
            if (predFn(msg)) { clearTimeout(timer); resolve(msg); return; }
          }
          // Subscribe to new messages
          (window as any).__onTestMessage__ = (msg) => {
            if (predFn(msg)) { clearTimeout(timer); resolve(msg); }
          };
        });
      },
      // Note: predicate must be serializable for page.evaluate
      // In practice, pass filter criteria as data, not functions
      [predicate, timeoutMs]
    );
  }
}
```

**Important constraint:** `page.evaluate` cannot pass closures. The actual implementation should pass filter criteria as plain objects (verb, direction, etc.) and evaluate the predicate inside the browser context.

**Confidence:** HIGH for Playwright as the test runner. MEDIUM for the exact message collection mechanism (may need iteration on the browser-to-test-process bridge).

### 5. Mock ShellHooks

Both the demo and test harness need mock implementations of `ShellHooks`. This should be a shared utility.

```typescript
// shared/mock-hooks.ts
export function createMockHooks(overrides?: Partial<ShellHooks>): ShellHooks {
  return {
    relayPool: {
      getRelayPool: () => mockRelayPool,   // In-memory event store
      trackSubscription: (key, cleanup) => { /* store */ },
      untrackSubscription: (key) => { /* cleanup */ },
      openScopedRelay: () => {},
      closeScopedRelay: () => {},
      publishToScopedRelay: () => false,
      selectRelayTier: () => [],
    },
    auth: {
      getUserPubkey: () => '0'.repeat(64),
      getSigner: () => mockSigner,          // In-memory signer
    },
    crypto: {
      verifyEvent: async (event) => {
        // Use nostr-tools verifyEvent for real signature verification
        const { verifyEvent } = await import('nostr-tools/pure');
        return verifyEvent(event);
      },
    },
    config: {
      getNappUpdateBehavior: () => 'auto-grant',
    },
    // ... other hooks with no-op defaults
    ...overrides,
  };
}
```

**Confidence:** HIGH -- the existing `ShellHooks` interface is already designed for dependency injection.

## Data Flow

### Demo Mode Data Flow

```
User clicks "Load Napplet"
  |
  v
Demo Shell creates iframe, registers in originRegistry
  |
  v
Shell calls sendChallenge(windowId)
  |
  v
postMessage ['AUTH', challenge] --> napplet iframe
  |                                    |
  |  Message Tap intercepts            |  @napplet/shim handles challenge
  |  Logs to visual panel              |  Signs AUTH event
  |                                    |
  v                                    v
                            postMessage ['AUTH', authEvent] --> shell
                                       |
                           Shell verifies, registers nappkey
                                       |
                            postMessage ['OK', id, true, ''] --> napplet
                                       |
                           Message Tap logs all 3 messages
                           Visual panel shows AUTH flow complete
```

### Test Mode Data Flow

```
Playwright test starts
  |
  v
page.goto('test-harness.html')
  |
  v
Shell boots with mock hooks, installs message tap
  |
  v
Test calls harness.loadNapplet('publish-napplet', { kind: '1' })
  |
  v
Shell creates iframe, sends AUTH challenge
  |
  v
AUTH handshake completes (same as demo flow)
  |
  v
publish-napplet sends ['EVENT', signedEvent]
  |
  v
Message tap captures event, pushes to window.__TEST_MESSAGES__
  |
  v
Playwright test calls waitFor({ verb: 'OK', direction: 'shell-to-napplet' })
  |
  v
Assertion: OK.success === true, event was routed to mock relay pool
  |
  v
Test passes/fails
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Testing postMessage with jsdom
**What:** Using vitest with jsdom/happy-dom to test the protocol
**Why bad:** jsdom does not implement real iframe contentWindow, MessageEvent.source, or cross-origin postMessage. The originRegistry depends on `event.source` (Window reference), which jsdom fakes as `null`. Tests would pass on mocks but fail in real browsers.
**Instead:** Use Playwright for all protocol tests. Reserve vitest+jsdom for pure-function unit tests (filter matching, replay check, ACL logic) that don't involve postMessage.

### Anti-Pattern 2: Combined demo+test app
**What:** A single app that is both the interactive demo and the test runner
**Why bad:** The demo needs user interaction (click to load napplet, toggle ACL). The tests need deterministic automation. Making both work in one app means either (a) the demo has test-specific UI clutter, or (b) the tests are brittle because they depend on demo UI elements.
**Instead:** Share test napplets and mock hooks. Keep the demo and test harness as separate entry points.

### Anti-Pattern 3: Testing against real relays
**What:** Connecting the demo/test shell to real Nostr relays
**Why bad:** Flaky tests (relay downtime, network latency, relay-specific behavior differences). Pollutes real relays with test events. Requires a Nostr identity/signer.
**Instead:** Mock relay pool that stores events in memory. Tests for relay integration belong in hyprgate (the reference implementation), not the SDK.

### Anti-Pattern 4: Monolithic test napplet
**What:** One big test napplet that exercises all capabilities via query param routing
**Why bad:** A failure in AUTH handling makes all subsequent tests fail. Test isolation is lost. Hard to attribute failures to specific protocol areas.
**Instead:** One napplet per capability. Each test file loads only the napplet(s) it needs.

## Patterns to Follow

### Pattern 1: Message Tap as Observable
**What:** A transparent message interceptor that both logs and allows subscription
**When:** Always, for both demo and tests
**Why:** Decouples observation from the protocol. Neither the shell nor the napplet needs to know they're being observed.

### Pattern 2: Deterministic Test Napplets
**What:** Napplets that perform a fixed sequence of operations on load, with no user interaction
**When:** All test napplets
**Why:** Enables headless Playwright testing. No `page.click()` needed inside iframes (which Playwright handles poorly for sandboxed iframes).

### Pattern 3: Mock ShellHooks with Real Crypto
**What:** Mock everything except `CryptoHooks.verifyEvent`
**When:** Always in tests and demo
**Why:** AUTH handshake requires real Schnorr signature verification to test meaningfully. Mocking `verifyEvent` to always return `true` would mask signature bugs. Use `nostr-tools/pure.verifyEvent` for real crypto.

### Pattern 4: Test Completion Signaling
**What:** Napplets post a special `__TEST_DONE__` message when they finish their test operations
**When:** All test napplets
**Why:** Playwright tests need to know when the napplet has finished its work before asserting. Without this, tests race against napplet initialization.

## Suggested Build Order

Dependencies flow downward. Each layer depends on the layer above it being complete.

```
Phase 1: Message Tap + Mock ShellHooks
   |  No dependencies beyond existing @napplet/shell
   |  Can be tested with minimal manual verification
   |
Phase 2: Test Napplets (auth, publish, subscribe first)
   |  Depends on: @napplet/shim working end-to-end
   |  Each is a trivial Vite app importing the shim
   |
Phase 3: Shell Test Harness (test-harness.html)
   |  Depends on: Message Tap, Mock ShellHooks
   |  Boots shell, loads napplets, exposes tap to Playwright
   |
Phase 4: Protocol Test Suite (Playwright specs)
   |  Depends on: Shell Harness, Test Napplets
   |  AUTH tests first (everything else depends on AUTH)
   |  Then: subscribe/publish, storage, inter-pane, ACL, adversarial
   |
Phase 5: Demo Playground
   |  Depends on: Message Tap, Mock ShellHooks, Test Napplets
   |  Can reuse test napplets as demo content
   |  Adds visual UI layer on top of shell harness
   |
Phase 6: CI Integration
   |  Depends on: Protocol Test Suite passing locally
   |  Playwright in CI (GitHub Actions)
```

**Phase ordering rationale:**

1. **Message Tap first** because both demo and tests depend on it. It's also the simplest component (pure function, no dependencies).
2. **Test napplets before test harness** because napplets validate that `@napplet/shim` works. If shim is broken, discover it here before building the harness.
3. **Shell harness before tests** because tests can't run without a shell host.
4. **Tests before demo** because the demo is a nice-to-have; the tests are the deliverable. Also, any protocol bugs found during test development should be fixed before building the demo (which would mask them with visual distraction).
5. **Demo last** because it consumes everything else and adds a visual layer. If time is short, the test suite alone proves protocol conformance. The demo can be deferred.

## Scalability Considerations

| Concern | 5 napplets (demo) | 20 test napplets | 50+ napplets |
|---------|-------------------|-------------------|-------------|
| iframe overhead | Negligible | Noticeable in Playwright CI (~2s per iframe) | Slow. Batch tests, reuse shell instances. |
| Message tap buffer | Hundreds of msgs, fine | Thousands, needs periodic clear | Needs ring buffer or streaming |
| Playwright parallelism | Single test file | `test.describe.parallel` across spec files | Workers per spec file, shared test server |
| Build time | Sub-second per napplet | 10-20s total | Pre-build all, cache in CI |

## Sources

- [Figma Plugin Architecture](https://developers.figma.com/docs/plugins/how-plugins-run/) -- sandbox model, iframe UI, message passing (HIGH confidence)
- [Figma Plugin System Blog](https://www.figma.com/blog/how-we-built-the-figma-plugin-system/) -- QuickJS sandbox architecture (HIGH confidence)
- [tma.js SDK Repository](https://github.com/Telegram-Mini-Apps/telegram-apps) -- monorepo structure, apps/ directory, mockTelegramEnv pattern (HIGH confidence)
- [Shopify mock-bridge](https://github.com/ctrlaltdylan/mock-bridge) -- mock App Bridge for Playwright testing of iframe apps (MEDIUM confidence)
- [mikedilger/relay-tester](https://github.com/mikedilger/relay-tester) -- NIP-01 relay conformance test suite pattern (HIGH confidence)
- [chrome-postMessage-debugger](https://github.com/bdo/chrome-postMessage-debugger) -- postMessage interception for debugging (HIGH confidence)
- [Playwright iframe testing](https://debbie.codes/blog/testing-iframes-with-playwright/) -- FrameLocator API, iframe interaction patterns (HIGH confidence)
- [Vitest browser mode](https://vitest.dev/guide/browser/) -- BroadcastChannel limitations, not suitable for iframe protocol testing (HIGH confidence)
- [Chrome Extension End-to-End Testing](https://developer.chrome.com/docs/extensions/mv3/end-to-end-testing/) -- behavioral test patterns for sandboxed extension APIs (MEDIUM confidence)
- [postMessage debugging techniques](https://dev.to/arthurdenner/how-to-debug-postmessages-58p7) -- monitorEvents, event inspection (HIGH confidence)

---

*Architecture research: 2026-03-30*
