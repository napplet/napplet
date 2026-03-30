# Phase 2: Test Infrastructure — Research

**Researched:** 2026-03-30
**Confidence:** HIGH
**Phase Goal:** A working test harness exists that can boot the real shell with mock hooks, load test napplets into sandboxed iframes, and programmatically assert on postMessage traffic

## Executive Summary

Phase 2 builds the test infrastructure that all behavioral test phases (3, 4) depend on. The architecture is well-defined by project-level research (STACK.md, ARCHITECTURE.md, PITFALLS.md) and phase context (02-CONTEXT.md). Key decisions: Vitest 4 for Node-mode unit tests, standalone Playwright for protocol tests, a transparent message tap on the shell side, mock ShellHooks with real crypto, and deterministic test napplets built with the real vite-plugin. A NIP-5A-compliant test gateway serves napplets on correct subdomains so the full resolution flow is exercised.

## Research Findings

### TEST-01: Vitest Configuration with Playwright Provider for Protocol Tests

**Recommendation: Use standalone Playwright Test for protocol tests, NOT Vitest browser mode.**

The project-level research (STACK.md) recommends Vitest browser mode with Playwright provider. However, after deeper analysis of the iframe-testing constraints, standalone Playwright Test is the better choice for protocol tests:

1. **Vitest browser mode runs tests inside an iframe itself** (using BroadcastChannel for communication). This creates a three-iframe situation: Vitest iframe → shell page → napplet iframe. The nesting adds complexity and potential for message leakage.

2. **Playwright Test gives direct `page` access** — tests run on the Node side with full control over the browser context. This is exactly what the shell harness needs: `page.goto()` to load the shell, `page.evaluate()` to set up the message tap, `frameLocator()` or `page.frames()` to interact with napplet iframes.

3. **CONTEXT.md decision D-08** leaves the tap access pattern (page.evaluate vs browser-side) as Claude's discretion. Playwright's `page.evaluate()` is the cleaner choice — all assertions happen in Node where test reporting works natively.

**Configuration approach:**
- Root `playwright.config.ts` for protocol tests (`tests/e2e/`)
- Per-package `vitest.config.ts` for Node-mode unit tests
- Both run via `pnpm test` through turborepo

**Affected files:**
- `playwright.config.ts` (new, root level)
- `vitest.config.ts` or `vitest.workspace.ts` (new, root level)
- `packages/shell/vitest.config.ts` (new)
- `packages/shim/vitest.config.ts` (new — future, not required for Phase 2)
- `turbo.json` (update test task)
- Root `package.json` (add test scripts, devDependencies)

**Risk:** LOW. Vitest Node-mode for unit tests and Playwright for e2e is a well-established split.

### TEST-02: Vitest Node-Mode for Unit Tests

**Current state:** No test runner configured anywhere in the monorepo.

**Approach:**
- Install vitest as root devDependency
- Create shared vitest config at root that packages extend
- Unit tests go in `packages/shell/src/__tests__/` (co-located with source, Vitest convention)
- Tests import from package names (`@napplet/shell`) not relative paths (per CONTEXT.md D-02)
- Test descriptions include requirement IDs (per CONTEXT.md D-04)

**Unit-testable functions in @napplet/shell:**
- `checkReplay()` — pure function, timestamp + dedup logic
- `matchesFilter()` — pure function, NIP-01 filter matching
- `matchesAnyFilter()` — pure function, multi-filter matching
- `aclStore.check()`, `grant()`, `revoke()`, `block()`, `unblock()` — state machine
- `nappKeyRegistry.register()`, `getEntry()`, `getByWindowId()` — registry operations
- `originRegistry.register()`, `getWindowId()` — registry operations

These are all testable with Vitest in Node mode — no browser needed.

**Risk:** LOW. Standard Vitest setup.

### TEST-03: Mock ShellHooks Implementation

**Current state:** `ShellHooks` interface in `packages/shell/src/types.ts` defines 9 hook interfaces. `createPseudoRelay(hooks)` is the only consumer.

**Mock design:**
- Create `tests/helpers/mock-hooks.ts` with `createMockHooks(overrides?)` factory
- Default implementations: in-memory relay pool (stores events in array), stub signer (returns canned pubkey), real crypto (use `nostr-tools/pure` verifyEvent), no-op window manager, auto-grant config
- Every mock method is a spy (or simple tracking array) so tests can assert on calls
- Real crypto via `nostr-tools` verifyEvent is critical — AUTH handshake must use real Schnorr signatures (per ARCHITECTURE.md Pattern 3: Mock ShellHooks with Real Crypto)

**Hook stubs needed:**
```
relayPool: {
  getRelayPool: () => mockRelayPool (in-memory event store),
  trackSubscription: (key, cleanup) => { store in Map },
  untrackSubscription: (key) => { call cleanup, delete },
  openScopedRelay: () => {},
  closeScopedRelay: () => {},
  publishToScopedRelay: () => false,
  selectRelayTier: () => [],
}
relayConfig: { no-ops for all methods }
windowManager: { createWindow: () => null }
auth: {
  getUserPubkey: () => '0'.repeat(64),
  getSigner: () => mockSigner,
}
config: { getNappUpdateBehavior: () => 'auto-grant' }
hotkeys: { executeHotkeyFromForward: () => {} }
workerRelay: { getWorkerRelay: () => null }
crypto: {
  verifyEvent: async (event) => {
    const { verifyEvent } = await import('nostr-tools/pure');
    return verifyEvent(event);
  },
}
```

**Risk:** LOW. The interface is well-defined. No external dependencies beyond nostr-tools.

### TEST-04: Message Tap — postMessage Interceptor

**Design (per CONTEXT.md D-06, D-07, D-08):**

The message tap is **shell-side only**. It intercepts all postMessage traffic at the shell window level. The tap sits between `window.addEventListener('message', ...)` and the pseudo-relay's `handleMessage`.

**Implementation approach:** Wrap the pseudo-relay's message handling. Instead of monkey-patching `postMessage` (fragile), install a message event listener that runs before the pseudo-relay's listener, logs the message, then lets it propagate. For outbound (shell-to-napplet) messages, intercept at the point where pseudo-relay calls `sourceWindow.postMessage()`.

**Data structure:**
```typescript
interface TappedMessage {
  timestamp: number;
  direction: 'napplet→shell' | 'shell→napplet';
  windowId: string;
  verb: string;         // EVENT, REQ, CLOSE, AUTH, OK, EOSE, NOTICE, CLOSED
  raw: unknown[];       // Full NIP-01 message array
  parsed: {
    subId?: string;
    eventKind?: number;
    eventId?: string;
    topic?: string;
    success?: boolean;
    reason?: string;
  };
}
```

**Browser-to-test bridge:** The tap stores messages in `window.__TEST_MESSAGES__` array. Playwright tests access this via `page.evaluate()`. A `waitForMessage(criteria, timeout)` helper polls the array from the Playwright side.

**Risk:** MEDIUM. The outbound interception (shell→napplet) requires either monkey-patching postMessage on iframe contentWindow or wrapping the pseudo-relay's internal postMessage calls. The inbound direction (napplet→shell) is straightforward via message event listener.

### TEST-05: Test Napplets

**Minimum viable set (per ROADMAP success criteria 4):** auth-napplet and publish-napplet.

**auth-napplet:**
- Imports `@napplet/shim` — this automatically triggers AUTH handshake
- Signals completion by posting `['__TEST_DONE__', 'auth']` to parent after shim initializes
- Serves as the basic "does AUTH work" test napplet

**publish-napplet:**
- Imports `@napplet/shim` and calls `publish()` after AUTH
- Reads kind/content from URL query params for test configurability
- Signals completion by posting `['__TEST_DONE__', 'publish', eventId]`

**Build approach (per CONTEXT.md D-12):**
- Each test napplet is a tiny Vite app with the `@napplet/vite-plugin` for real manifest generation
- Built as part of test setup (or pre-built and served statically)
- Output goes to `tests/fixtures/napplets/{name}/dist/`

**Risk:** LOW for the napplets themselves. MEDIUM for the build pipeline integration.

### TEST-06: Shell Test Harness

**Design:** A static HTML page (`tests/e2e/harness/index.html`) that:
1. Imports `@napplet/shell` (createPseudoRelay)
2. Creates mock ShellHooks
3. Creates the pseudo-relay
4. Installs the message tap
5. Exposes `window.__loadNapplet__(name, params)` for Playwright to call
6. Exposes `window.__SHELL_READY__` flag for Playwright to wait on
7. Exposes `window.__TEST_MESSAGES__` for assertion access

**Napplet loading flow:**
1. Playwright calls `page.evaluate(() => window.__loadNapplet__('auth-napplet'))`
2. Harness creates a sandboxed iframe: `<iframe sandbox="allow-scripts" src="...">`
3. Harness registers the iframe in originRegistry
4. Harness calls `relay.sendChallenge(windowId)`
5. AUTH handshake proceeds through real postMessage
6. Messages accumulate in `window.__TEST_MESSAGES__`
7. Playwright asserts on message sequence

**NIP-5A gateway (per CONTEXT.md D-09, D-10):**
The test server must serve napplets from NIP-5A-format subdomains. For tests, a simpler approach works:
- Use a Vite dev server or static file server that serves pre-built napplets
- The subdomain format requirement can be deferred to Phase 3+ if we use `localhost:port/napplet-name/` paths for Phase 2
- However, D-09 explicitly requires NIP-5A subdomain format. This means:
  - The test server binds to `*.localhost:port`
  - Each napplet is served at `<pubkeyB36><dTag>.localhost:port`
  - A custom server (small Node HTTP/HTTPS server) handles subdomain routing

**Risk:** MEDIUM for the NIP-5A gateway requirement. Subdomain-based routing on localhost adds complexity. Chrome and Firefox handle `*.localhost` differently. May need `/etc/hosts` entries or a custom DNS resolver for tests. This is the highest-risk item in Phase 2.

**Mitigation:** Start with path-based serving (`localhost:port/napplets/auth-napplet/`) for the initial harness. Add NIP-5A subdomain routing as an enhancement. The CONTEXT.md says "Claude's discretion on mock relay scope" (D-13), which gives flexibility on how much NIP-5A fidelity to implement in Phase 2 vs Phase 3+.

### Mock Relay for Manifest Resolution

**Per CONTEXT.md D-11, D-13:**
The mock relay serves kind 35128/15128 manifest events so the shell can query for aggregate hash.

**Approach:** An in-memory mock that implements the minimal relay pool interface:
- `subscription(urls, filters)` — if filter matches kind 35128/15128, return stored manifest events
- `publish(urls, event)` — store in memory
- `request(urls, filters)` — same as subscription but returns complete immediately

**Pre-seeded data:** Each test napplet's manifest (generated by vite-plugin during build) is loaded into the mock relay at test setup time.

**Risk:** LOW. The mock relay only needs to return canned manifest events.

## Validation Architecture

### Test Layers

| Layer | Tool | Scope | Coverage |
|-------|------|-------|----------|
| Unit tests | Vitest (Node mode) | Pure functions in @napplet/shell | checkReplay, matchesFilter, ACL logic, registry operations |
| Protocol tests | Playwright Test | Real browser, real postMessage | AUTH handshake, message routing, tap verification |
| Smoke test | Playwright + harness | End-to-end shell+napplet | Phase 1 E2E verification (from 01-CONTEXT.md D-09) |

### Verification Commands

- **Quick:** `pnpm test --filter=@napplet/shell` (Vitest unit tests, ~2s)
- **Full:** `pnpm test` (all unit tests + Playwright protocol tests, ~15-30s)
- **Protocol only:** `pnpm test:e2e` (Playwright protocol tests, ~10-20s)

### Key Risk: Sandboxed Iframe postMessage in Playwright

Playwright can access iframe content via `page.frames()` for same-origin iframes. For cross-origin sandboxed iframes (which napplets use), Playwright cannot evaluate code inside the iframe. This means:

1. We cannot inject spies into napplet iframes (expected — per CONTEXT.md D-06)
2. We can only observe from the shell side (the message tap approach)
3. We rely on the napplet's outbound postMessages being visible to the shell's message event listener

This is the correct architecture — the shell is the single point of truth for all protocol traffic. Tests observe the shell, not the napplets.

## Dependencies and Build Order

```
Wave 1 (no dependencies):
  - Vitest + Playwright install and config
  - Mock ShellHooks factory
  - Message tap utility

Wave 2 (depends on Wave 1):
  - Test napplets (auth-napplet, publish-napplet) — need vite-plugin for build
  - Shell test harness HTML page — needs mock hooks and message tap

Wave 3 (depends on Wave 2):
  - Integration verification — Playwright test that boots harness, loads auth-napplet, asserts AUTH
  - turborepo `pnpm test` wiring
```

## Sources

- `.planning/research/STACK.md` — Vitest 4, Playwright, configuration patterns
- `.planning/research/ARCHITECTURE.md` — Test harness architecture, message tap design, mock hooks pattern
- `.planning/research/PITFALLS.md` — Pitfall 10 (jsdom unusable), Pitfall 11 (ESM publishing)
- `.planning/phases/02-test-infrastructure/02-CONTEXT.md` — Phase decisions D-01 through D-13
- `packages/shell/src/types.ts` — ShellHooks interface definition
- `packages/shell/src/pseudo-relay.ts` — createPseudoRelay API, PseudoRelay interface
- [Playwright iframe testing](https://playwright.dev/docs/api/class-frame) — Frame API limitations
- [Vitest 4 browser mode](https://vitest.dev/guide/browser/) — BroadcastChannel architecture
- [Playwright sandboxed iframe issue #33343](https://github.com/microsoft/playwright/issues/33343) — Known limitations

---

*Phase-specific research: 2026-03-30*
*Synthesized from project-level research + source code analysis*
