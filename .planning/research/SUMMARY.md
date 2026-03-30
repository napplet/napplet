# Project Research Summary

**Project:** napplet protocol SDK
**Domain:** Testing, demo, and specification tooling for a sandboxed iframe/postMessage protocol SDK
**Researched:** 2026-03-30
**Confidence:** HIGH

## Executive Summary

The napplet protocol SDK has three extracted packages (@napplet/shim, @napplet/shell, @napplet/vite-plugin) that build and type-check but have zero tests, no demo, and no published specification. The core protocol -- a NIP-01 relay wire format over postMessage between a parent shell and sandboxed iframes -- is already built and working. This research focuses on what tooling and fixes are needed to validate, demonstrate, and publish the SDK credibly.

The dominant finding across all research areas is that **real browser testing is non-negotiable**. jsdom sets `event.origin` to empty string on postMessage, happy-dom has incomplete postMessage semantics, and neither enforces iframe `sandbox` attribute restrictions. The protocol is fundamentally about cross-origin iframe communication -- a browser primitive that headless JS environments cannot faithfully replicate. The recommended stack is **Vitest 4 (Node mode) for pure-function unit tests** and **standalone Playwright Test for protocol integration tests**, running against a purpose-built shell test harness that boots the real @napplet/shell with mock ShellHooks and loads minimal single-purpose test napplets. This layered approach avoids iframe-nesting conflicts (Vitest browser mode runs tests inside its own iframe) while keeping pure logic tests fast and turborepo-cacheable.

There are **five security-relevant bugs** that must be fixed before testing begins: an AUTH race condition where the pending message queue is not cleared on all rejection paths (Pitfall #3), missing `event.source` validation in the shim (Pitfall #8), the permissive-by-default ACL that grants all capabilities to unknown napplets (Pitfall #1), a comma delimiter collision in storage key serialization (Pitfall #6), and `hyprgate` naming remnants that will ship in the published wire format if not renamed now (Pitfall #16). Fixing these before writing tests prevents building on a broken foundation and ensures test results are trustworthy.

## Key Findings

### Recommended Stack

The existing stack (TypeScript 5.9.3, tsup 8.5.0, turborepo, pnpm workspaces, changesets, nostr-tools 2.23.3) is solid and requires no changes. The additions are all in the testing, demo, and documentation layers.

**Core additions:**
- **Vitest 4.1.2** (Node mode): Unit test runner for pure functions (filter matching, ACL checks, replay detection). Native TypeScript, ESM-first, turborepo-cacheable. Do NOT use jsdom/happy-dom for anything involving postMessage or iframes.
- **Playwright 1.58.2** (standalone): Integration test runner for protocol conformance. Real browser iframes with real postMessage semantics. Custom shell test harness serves as the system under test. Already installed system-wide on this machine.
- **@vitest/coverage-v8 4.1.2**: V8-native coverage across both Node and browser test modes.
- **Vite 6.3.0** (already a peer dep): Dev server for demo playground. Vanilla TypeScript, no framework. Multi-page app mode serves shell + napplet iframes.
- **Mermaid 11.13.0**: Runtime sequence diagram generation for the protocol debugger panel.
- **VitePress 1.6.4** (deferrable): Spec site for NIP-5A documentation. Same Vite ecosystem. Can ship raw markdown first.

**Why NOT alternatives:**
- Jest: Poor ESM support, broken postMessage in jsdom (open issue since 2018).
- Vitest browser mode for protocol tests: Runs tests inside its own iframe, creating iframe-nesting conflicts with the napplet protocol's iframe usage. Use standalone Playwright instead.
- WebContainers/StackBlitz: COEP headers are fundamentally incompatible with sandboxed iframe postMessage using wildcard origins.
- Framework-specific demos (Svelte/React): SDK is framework-agnostic by design. Hyprgate already covers Svelte.

### Expected Features

**Must have (table stakes) -- required for credible v1:**
- AUTH handshake success + failure paths (8 scenarios minimum: valid, bad sig, expired, future, wrong challenge, wrong relay tag, wrong kind, missing tags)
- Single napplet relay pub/sub (subscribe, publish, receive delivery)
- Multi-napplet inter-pane messaging (topic-based emit/on between napplets via shell routing)
- ACL enforcement demo (grant, revoke, block with visible effect in message flow)
- Storage proxy round-trip (setItem, getItem, removeItem, keys, clear with cross-napplet isolation)
- Signer delegation with consent prompt (NIP-07 proxy, destructive kind gating)
- Message debugger / protocol inspector (a napplet that subscribes to all message types -- dogfooding the protocol)
- Napplet lifecycle demo (load, auth, ready, teardown with cleanup)
- Behavioral test matrix: 35 P0 tests (minimum viable), 59 P0+P1 tests (target for v1), across 8 categories

**Should have (differentiators) -- already built, need demos:**
- NIP-01 wire format reuse (show raw postMessage logs that look like relay traffic)
- Aggregate hash versioning (per-build ACL with content-hash identity)
- Shell-injectable events (host-to-app broadcast via same wire format)
- NIP-5A signed manifest with cryptographic verification chain
- Keyboard hotkey forwarding (kind 29004 events)

**Defer (v2+):**
- Restrictive ACL default mode (add config option, do not make it the default yet)
- Manifest signature verification in shell (vite-plugin generates; verification can wait)
- IndexedDB storage backend (localStorage sufficient for v1 at 512KB)
- Framework-specific bindings (@napplet/react, @napplet/svelte -- let community build)
- Rate limiting on signer requests (document expected behavior, defer policy)
- Multi-browser CI matrix (Chromium only for v0.1)
- Performance benchmarking (correctness first)

### Architecture Approach

Separate the demo app from the test runner. Share test napplets and mock ShellHooks between them. This is the pattern used by Figma (plugin sandbox vs developer playground), Telegram tma.js (apps/ vs SDK tests with mockTelegramEnv), and the Nostr relay-tester project. The demo serves SDK evaluators interactively; the test suite serves SDK maintainers headlessly. Combining them compromises both.

**Major components:**

1. **Message Tap** -- Transparent postMessage interceptor that both logs and allows subscription. Monkey-patches `Window.prototype.postMessage` at the shell level. Consumed by both demo UI (visual panel) and test assertions (programmatic waitFor). This is the architectural lynchpin.
2. **Test Napplets** (`apps/test-napplets/`) -- One minimal Vite app per protocol capability (auth-only, publish-only, subscribe-only, storage-only, inter-pane-only, malicious-napplet). Deterministic behavior on load, configurable via URL query params, no user interaction needed. Enables headless Playwright testing.
3. **Shell Test Harness** (`tests/protocol/fixtures/`) -- Boots @napplet/shell with mock ShellHooks (real crypto, mock everything else), loads test napplets into sandboxed iframes, exposes message tap to Playwright via `window.__TEST_TAP__`. The system under test for all protocol specs.
4. **Protocol Test Suite** (`tests/protocol/`) -- Playwright specs organized by protocol area: auth, acl, storage, inter-pane, signer, replay, lifecycle, adversarial. Uses shell harness as fixture. AUTH tests run first (everything else depends on AUTH).
5. **Demo Playground** (`apps/demo/`) -- Vanilla TypeScript Vite SPA. Visual message flow panel, napplet frame manager, ACL control toggles. Reuses test napplets as demo content. NOT published to npm.
6. **Mock ShellHooks** (shared) -- Mock implementations of RelayPoolHooks, AuthHooks, ConfigHooks. Real `nostr-tools/pure.verifyEvent` for crypto (AUTH handshake requires real Schnorr verification to test meaningfully). Everything else mocked for determinism.

### Critical Pitfalls

1. **Permissive-by-default ACL** -- `aclStore.check()` returns `true` for unknown napplets, granting all capabilities including signing. If `_onConsentNeeded` is null, destructive signing kinds bypass consent entirely. **Fix:** Add `defaultPolicy: 'restrictive'` config option. Make `onConsentNeeded` registration mandatory for destructive kinds.

2. **AUTH queue race condition** -- Pending message queue is deleted on signature failure but NOT on challenge mismatch, relay tag mismatch, timestamp rejection, or wrong kind rejection. Pre-AUTH messages from a failed attempt can execute under a later successful AUTH. **Fix:** Add `pendingAuthQueue.delete(windowId)` to every early-return path in `handleAuth()`.

3. **postMessage origin wildcard** -- All postMessage calls use `'*'` as targetOrigin. This is unavoidable for sandboxed iframes (opaque null origins), but means messages are visible to extensions and injected scripts. The shim does not validate `event.source === window.parent` on incoming messages. **Fix:** Add source validation to shim handlers. Document the trust boundary. Session tokens are a future hardening step.

4. **Fake event IDs on shell-injected events** -- `injectEvent()` uses `crypto.randomUUID()` padded to 64 chars, not real SHA-256 hashes. Napplets using `verifyEvent()` on incoming events will reject these. **Fix:** Either compute proper IDs or tag injected events with `['_', 'system']` and document that they should not be verified.

5. **localStorage silent failure cascade** -- ACL store, manifest cache, and storage proxy all depend on localStorage. In private browsing mode, `aclStore.load()` catches errors and clears the store, silently resetting all permission decisions to permissive defaults. **Fix:** Add `storage.isAvailable()` check at initialization, expose warning flag, add `ShellHooks.storage` abstraction hook.

## Implications for Roadmap

### Phase 1: Wiring Fixes and Security Bugs

**Rationale:** Tests on broken code produce misleading results. Fix known bugs first so the test foundation is trustworthy. This phase has zero external dependencies and touches only existing packages.
**Delivers:** A codebase with no known security bugs, clean namespace, and correct serialization.
**Addresses:** AUTH handshake correctness, storage proxy correctness, shim-side message validation.
**Avoids:** Pitfall #3 (AUTH race condition), Pitfall #6 (comma-in-key), Pitfall #8 (missing source validation), Pitfall #16 (hyprgate naming remnants).

Work items:
- Fix `handleAuth()` queue cleanup on all rejection paths
- Add `event.source === window.parent` check to shim's `handleRelayMessage` and `handleStorageResponse`
- Fix storage key serialization to use JSON instead of comma-join
- Rename all `hyprgate` identifiers to `napplet` (URI, meta tags, localStorage keys)
- Add `defaultPolicy` config option to `createPseudoRelay` (implement restrictive mode)
- Make `onConsentNeeded` registration mandatory for destructive signing kinds

### Phase 2: Test Infrastructure

**Rationale:** Shared test harness must exist before any tests are written. Wrong foundation (jsdom) would waste all subsequent effort. This phase establishes the patterns that every test file follows.
**Delivers:** Working Vitest config, Playwright config, message tap utility, mock ShellHooks, shell test harness, and at least 2 test napplets (auth-napplet, publish-napplet) proving the harness works end-to-end.
**Uses:** Vitest 4.1.2 (Node mode), Playwright 1.58.2, @vitest/coverage-v8.
**Implements:** Message Tap, Shell Test Harness, Mock ShellHooks, first test napplets.
**Avoids:** Pitfall #10 (jsdom for protocol tests), anti-pattern of monolithic test napplet.

Work items:
- Add vitest, playwright, coverage dependencies to root
- Create shared vitest config extending to per-package configs
- Create `tests/protocol/fixtures/` with shell harness and message collector
- Build message tap utility (postMessage monkey-patch + observable interface)
- Build mock ShellHooks with real crypto (nostr-tools/pure.verifyEvent)
- Build `auth-napplet` and `publish-napplet` as minimal Vite apps
- Validate that Playwright can drive the harness, create sandboxed iframes, and observe postMessage traffic end-to-end (spike)

### Phase 3: Unit Tests (Node Mode)

**Rationale:** Pure function tests are fast (no browser startup), turborepo-cacheable, and catch logic bugs before adding browser complexity. These cover 4 of the 8 behavioral test categories without needing postMessage.
**Delivers:** Test coverage for ACL store operations, NIP-01 filter matching, replay attack detection, storage key scoping logic. Estimated 15-20 tests.
**Addresses:** ACL grant/revoke/block test suite, filter matching tests, replay detection tests, storage persistence round-trip tests.
**Avoids:** Over-reliance on browser mode for tests that do not need it.

Work items:
- ACL store unit tests: default permissive, explicit grant, revoke, block, unblock, persist/load round-trip, corrupt data recovery (7 tests)
- Filter matching unit tests: kind, author, id prefix, tag, since/until, combined, empty filter (7 tests)
- Replay detection unit tests: old timestamp, future timestamp, duplicate ID, seen ID cleanup (4 tests)
- Storage scoping unit tests: key format validation, cross-napplet isolation logic (3 tests)

### Phase 4: Integration Tests (Browser Mode)

**Rationale:** Protocol conformance can only be validated with real postMessage between real iframes. This phase uses the harness from Phase 2 to exercise every P0 scenario from the behavioral test matrix.
**Delivers:** Full protocol conformance test suite. 35 P0 tests minimum, targeting 59 P0+P1 tests. Covers all 8 behavioral categories.
**Uses:** Playwright standalone, shell test harness, all test napplets.
**Implements:** Protocol Test Suite organized by: auth (10), acl (10), routing (10), replay (5), storage (11), signer (9), inter-pane (7), lifecycle (7).
**Avoids:** Pitfall #10 (jsdom), false confidence from simulated environments.

Work items:
- Build remaining test napplets: subscribe-napplet, storage-napplet, inter-pane-napplet, acl-probe-napplet, signer-napplet, malicious-napplet
- Write auth.spec.ts: valid auth, bad sig, expired, future, wrong challenge, wrong relay, wrong kind, missing tags, duplicate AUTH (10 scenarios)
- Write routing.spec.ts: REQ/EVENT/CLOSE/EOSE lifecycle, filter matching, sender exclusion, p-tag targeting, pre-AUTH queuing (10 scenarios)
- Write acl.spec.ts: default permissive, grant, revoke, block, unblock, capability-specific denial (10 scenarios)
- Write storage.spec.ts: CRUD, cross-napplet isolation, quota enforcement (11 scenarios)
- Write signer.spec.ts: getPublicKey, signEvent, consent prompt, timeout, concurrent requests (9 scenarios)
- Write inter-pane.spec.ts: emit/on, topic filtering, multiple subscribers, unsubscribe, shell-injected events (7 scenarios)
- Write lifecycle.spec.ts: pre-AUTH queuing, AUTH rejection clears queue, cleanup, non-array postMessage ignored (7 scenarios)

### Phase 5: Demo Playground and Protocol Debugger

**Rationale:** Tests prove correctness; the demo proves usability. The demo should come after tests so protocol bugs are already fixed. The demo validates the developer experience and API ergonomics that tests cannot measure.
**Delivers:** Interactive vanilla TS playground with 2+ napplets, visual message flow panel, ACL control toggles, and a protocol debugger napplet (itself a napplet -- dogfooding).
**Addresses:** AUTH handshake demo, relay pub/sub demo, multi-napplet inter-pane demo, ACL enforcement demo, storage proxy demo, signer delegation + consent demo, message debugger napplet.
**Avoids:** Framework-specific demo (Svelte is in hyprgate), WebContainer incompatibility.

Work items:
- Create `apps/demo/` as Vite SPA with vanilla TypeScript
- Build shell host with mock ShellHooks and message tap
- Build visual message flow panel (scrollable log, color-coded by verb)
- Build napplet frame manager (load, unload, block/unblock controls)
- Build ACL control panel (toggle capabilities per napplet, show immediate effect)
- Build `<message-debugger>` web component (custom element, no framework dependency)
- Optionally add Mermaid sequence diagram toggle view

### Phase 6: Spec Refinement and npm Publish

**Rationale:** Publishing is informed by everything learned during testing and demo development. The NIP-5A spec, manifest hash issue, and ESM publishing gotchas are all resolved here with full context.
**Delivers:** Refined NIP-5A specification markdown, npm-published v0.1.0 packages, validated ESM compatibility.
**Avoids:** Pitfall #9 (manifest hash race), Pitfall #11 (ESM publishing gotchas), Pitfall #7 (nostr-tools peer dep range too wide), Pitfall #12 (changesets peer dep bumps).

Work items:
- Resolve manifest hash race condition (exclude index.html from hash, or two-pass hashing)
- Fix fake event IDs on shell-injected events (Pitfall #4)
- Fix vite-plugin silent unsigned manifest (Pitfall #15) -- add `required: true` option for prod builds
- Tighten nostr-tools peer dependency range to `^2.23.3`
- Add `"engines": { "node": ">=20" }` to all package.json files
- Add CJS require stub that throws clear ESM-only error
- Run `publint` and `@arethetypeswrong/cli` on each package
- Test with `npm pack` in a clean project
- Publish v0.1.0 via changesets
- Write NIP-5A spec in nostr-protocol/nips markdown format
- Optionally wrap spec in VitePress site

### Phase Ordering Rationale

- **Fixes before tests:** Building tests on known-broken behavior wastes effort and produces misleading results. The AUTH race condition alone would cause intermittent test failures that are hard to diagnose.
- **Test infra before tests:** The shared harness (message tap, mock hooks, shell harness) prevents duplication across 8 test spec files. Getting the harness right is worth a dedicated phase.
- **Unit tests before integration:** Faster feedback loop (no browser startup). Catches logic bugs in ACL, filters, and replay detection before adding the complexity of real iframes and postMessage.
- **Integration tests before demo:** Protocol bugs found in tests should be fixed before building visual demos that would mask them with UI polish.
- **Demo before publish:** The demo validates developer experience and API ergonomics. If the API is awkward to use in the demo, fix it before locking the public API with a published version.
- **Publish last:** The spec, package metadata, and ESM compatibility are all informed by the full development cycle.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Test Infrastructure):** The exact Playwright configuration for intercepting postMessage between a parent page and sandboxed (no allow-same-origin) iframes needs a spike/prototype. The `frameLocator` API only works for same-origin iframes; custom `page.evaluate()` patterns are needed. Budget 1-2 days for prototyping.
- **Phase 4 (Integration Tests):** The malicious-napplet test scenarios (adversarial.spec.ts) may require custom iframe construction without @napplet/shim. Research needed on how Playwright handles iframes that send raw postMessage without the shim's AUTH flow.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Wiring Fixes):** All fixes are to existing code with clear specifications. No research needed.
- **Phase 3 (Unit Tests):** Standard Vitest Node mode tests against pure functions. No research needed.
- **Phase 5 (Demo Playground):** Standard Vite SPA with vanilla TypeScript. Well-documented patterns.
- **Phase 6 (Publish):** ESM publishing is well-documented. Use `publint` and `@arethetypeswrong/cli` for automated validation.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Vitest 4 browser mode stable since Oct 2025, verified against official docs. Playwright is industry standard. All version recommendations verified. |
| Features | HIGH | Table stakes derived from 5 comparable platforms (Figma, Telegram, Farcaster, Tauri, Web Extensions). Test matrix is comprehensive at 69 scenarios across 8 categories. |
| Architecture | HIGH (overall) / MEDIUM (postMessage interception) | Separation pattern verified across Figma, Telegram, Shopify, and Nostr relay-tester ecosystems. The exact message tap mechanism for sandboxed iframes needs prototyping in Phase 2. |
| Pitfalls | HIGH | Security pitfalls #1-6, #8, #10-11, #16 verified against source code. Testing and publishing pitfalls verified against issue trackers and ecosystem documentation. |

**Overall confidence:** HIGH

### Gaps to Address

- **Sandboxed iframe postMessage interception in Playwright:** The pattern is well-established for same-origin iframes but the napplet-specific constraint (sandbox="allow-scripts" without allow-same-origin) adds complexity. Phase 2 must include a spike to validate. If Playwright cannot reliably intercept messages to/from opaque-origin iframes, the fallback is to use `page.evaluate()` to install message listeners on the parent window only (which is same-origin) and assert on messages received there.

- **Vitest browser mode vs standalone Playwright decision:** STACK.md recommends Vitest browser mode; ARCHITECTURE.md recommends standalone Playwright. The resolution is a layered approach: Vitest Node mode for pure functions, standalone Playwright for protocol integration tests. Vitest browser mode is reserved for any future component/DOM tests but is not needed for the current scope.

- **Manifest hash race condition (Pitfall #9):** Three possible solutions (exclude index.html from hash, two-pass hashing, separate hash file). The design decision should be made during Phase 6 planning, informed by whether the NIP-5A spec targets the nostr-protocol/nips repo (which would constrain the format) or remains a standalone specification.

- **VitePress spec site customization:** LOW confidence on NIP-specific rendering plugins. Research when that work is reached. Raw markdown is sufficient for v1.

## Sources

### Primary (HIGH confidence)
- [Vitest 4.0 Release Blog](https://vitest.dev/blog/vitest-4) -- browser mode stability, Playwright integration
- [Vitest Browser Mode Guide](https://vitest.dev/guide/browser/) -- configuration, providers, iframe architecture
- [Vitest Browser Commands API](https://vitest.dev/api/browser/commands) -- custom commands, Playwright context access
- [Playwright iframe Testing](https://playwright.dev/docs/api/class-frame) -- Frame API, frameLocator, evaluate
- [Figma Plugin Architecture](https://developers.figma.com/docs/plugins/how-plugins-run/) -- sandbox model, capability restrictions
- [Figma Plugin System Blog](https://www.figma.com/blog/how-we-built-the-figma-plugin-system/) -- architecture decisions, security tradeoffs
- [tma.js SDK Repository](https://github.com/Telegram-Mini-Apps/telegram-apps) -- monorepo structure, mockTelegramEnv pattern
- [mikedilger/relay-tester](https://github.com/mikedilger/relay-tester) -- NIP-01 relay conformance test suite pattern
- [MDN: Window.postMessage()](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) -- targetOrigin, security considerations
- [MDN: iframe sandbox attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe) -- sandbox token behavior, opaque origin
- [NIP-01 Specification](https://github.com/nostr-protocol/nips/blob/master/01.md) -- canonical NIP markdown format

### Secondary (MEDIUM confidence)
- [Farcaster Mini Apps Specification](https://miniapps.farcaster.xyz/docs/specification) -- SDK actions, manifest format, trust model
- [Tauri v2 Capabilities](https://v2.tauri.app/security/capabilities/) -- ACL-based IPC permission model
- [MSRC: PostMessaged and Compromised](https://msrc.microsoft.com/blog/2025/08/postmessaged-and-compromised/) -- real-world postMessage vulnerability patterns
- [Shopify mock-bridge](https://github.com/ctrlaltdylan/mock-bridge) -- mock App Bridge for Playwright testing
- [Turborepo Vitest Guide](https://turborepo.dev/docs/guides/tools/vitest) -- per-package configuration
- [TypeScript ESM publishing (2025)](https://lirantal.com/blog/typescript-in-2025-with-esm-and-cjs-npm-publishing) -- ESM-only publishing complexity
- [nostr-tools v2.0.0 release notes](https://github.com/nbd-wtf/nostr-tools/releases/tag/v2.0.0) -- breaking changes in v2 line

### Tertiary (LOW confidence)
- [VitePress](https://vitepress.dev/) -- spec site generator (deferrable, not deeply researched)
- [vitepress-plugin-mermaid](https://github.com/emersonbottero/vitepress-plugin-mermaid) -- diagram rendering in spec docs

---
*Research completed: 2026-03-30*
*Ready for roadmap: yes*
