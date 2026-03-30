# Feature Landscape

**Domain:** Sandboxed iframe app protocol SDK (Nostr-native)
**Researched:** 2026-03-30
**Mode:** Ecosystem research -- what a complete demo and behavioral test matrix needs

## Context

This is a brownfield project. The protocol is built. The question is: what does a complete demo + test suite need to cover for the decoupled SDK to be credible? Research draws from comparable sandboxed app platforms (Figma plugins, Telegram Mini Apps, Farcaster Mini Apps, Web Extensions MV3, Tauri v2) and maps their tested capabilities back to what the napplet protocol already implements.

---

## Table Stakes

Features users (SDK consumers and protocol reviewers) expect. Missing = the demo/tests feel incomplete and the protocol is not credible.

### Demo Capabilities

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| AUTH handshake success path | Every sandboxed platform demos identity establishment first. Figma shows plugin registration; Farcaster shows `signin`; Telegram shows `initData` validation. Without this, nothing else works. | Low | Existing code handles this. Needs visual demo showing challenge-response flow. |
| AUTH handshake failure paths | Telegram patched an iframe isolation vulnerability in Dec 2025 because they missed failure-path testing. Every platform that ships without rejection demos ships insecure. | Med | Test: bad signature, expired timestamp, challenge mismatch, relay tag mismatch. At least 4 negative scenarios. |
| Single napplet relay pub/sub | Core value proposition. Analogous to Figma plugin reading/writing scene data, or Farcaster Mini App calling `composeCast`. If subscribe/publish does not work end-to-end, nothing else matters. | Low | Existing code. Demo: napplet subscribes to a kind, publishes an event, sees it delivered back via shell relay routing. |
| Multi-napplet inter-pane messaging | Unique to this protocol vs most competitors. Figma has no inter-plugin messaging. Farcaster Mini Apps are single-instance. This is a protocol differentiator but it must work to be credible. | Med | Demo: Napplet A emits topic event, Napplet B receives it. Visual message flow in debugger. |
| ACL enforcement (allow/block) | Every comparable platform has permissions. Web Extensions MV3 has granular manifest permissions. Tauri v2's entire security model is ACL capabilities. Farcaster declares `requiredCapabilities` in manifest. | Med | Demo: grant relay:write, publish succeeds. Revoke relay:write, publish is denied with visible error. Block napplet entirely, all operations fail. |
| Storage proxy round-trip | Telegram has 3 storage tiers (device, secure, cloud). Figma plugins use `figma.clientStorage`. Every sandboxed platform provides some storage. | Low | Demo: setItem, getItem, removeItem, keys, clear. Show scoped isolation between napplets. |
| Signer delegation (NIP-07 proxy) | This is the Nostr-specific equivalent of Farcaster's wallet provider or Telegram's biometric auth. The napplet asks the shell to sign on its behalf. | Med | Demo: napplet calls `window.nostr.signEvent()`, shell proxies to host signer, signed event returned. |
| Consent prompt for destructive kinds | Analogous to Android runtime permissions, Web Extension `activeTab` activation, or Tauri capability prompts. Destructive operations (kind 0, 3, 5, 10002) must gate on user approval. | Med | Demo: napplet tries to sign kind 0 (metadata), shell raises consent prompt, user approves/denies, napplet gets result. |
| Message debugger / visual inspector | Farcaster has Frame Playground. Figma has Plugin Console. Telegram has test environment. Without a way to see what is happening, the protocol is a black box. | Med | This is NOT a standalone tool -- it is a napplet that subscribes to all message types and displays them. Think "relay inspector" as a napplet. |
| Napplet lifecycle (load, auth, ready, teardown) | Every platform defines lifecycle. Figma: plugin opens, runs, calls `closePlugin()`. Farcaster: Mini App calls `ready()` to dismiss splash. Telegram: `initData` validation on load. | Low | Demo: shell loads iframe, sends challenge, napplet auths, shell confirms OK, napplet is "ready". On close: subscriptions cleaned up, storage persisted. |

### Test Matrix Capabilities

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| AUTH handshake test suite | Tests: valid auth, bad signature, expired timestamp, future timestamp, wrong challenge, wrong relay tag, missing type tag, missing aggregateHash tag. At minimum 8 scenarios. | Med | Pure unit tests against pseudo-relay `handleAuth`. Mock crypto.verifyEvent for speed. |
| ACL grant/revoke/block test suite | Tests: default permissive grant, explicit grant, revoke single capability, block napplet, unblock napplet, check after persist/load round-trip, overlapping roles. | Med | Unit tests against aclStore. No browser needed. |
| Storage proxy test suite | Tests: get/set/remove/keys/clear, quota enforcement, quota exceeded error, cross-napplet isolation (napp A cannot read napp B keys), scoped key format validation, malformed request handling. | Med | Needs localStorage mock or browser-mode vitest. |
| Replay attack detection tests | Tests: event with old timestamp rejected, event with future timestamp rejected, duplicate event ID rejected, event ID cleanup after window expires. | Low | Unit tests against `checkReplay`. |
| Subscription lifecycle tests | Tests: REQ creates subscription, CLOSE removes it, EOSE delivered after buffer scan, filter matching (kinds, authors, tags, since/until), subscription deduplication. | Med | Unit tests against pseudo-relay `handleReq`/`handleClose`. |
| Inter-pane delivery tests | Tests: event delivered to matching subscribers only, sender excluded from own delivery, p-tag targeted delivery, no delivery after CLOSE, delivery order consistency. | Med | Integration tests with multiple mock windows. |
| Signer request/response correlation | Tests: request with correlation ID, response matched by ID, timeout after 30s, error response handling, concurrent requests with different IDs. | Med | Unit tests on both shim and shell sides. |
| NIP-01 filter matching tests | Tests: kind filter, author filter, id prefix filter, tag filter, since/until filter, combined filters, empty filter matches all. | Low | Pure function tests against `matchesFilter`. |
| postMessage boundary tests | Tests: messages from non-registered windows ignored, messages without array format ignored, messages during auth-pending are queued, queued messages replayed after auth success, queued messages dropped on auth failure. | Med | Integration tests requiring real Window objects (browser-mode vitest or Playwright). |
| Storage persistence round-trip | Tests: ACL store persist/load, manifest cache persist/load, data survives page reload, corrupt JSON in localStorage handled gracefully. | Low | Unit tests with mocked localStorage. |

---

## Differentiators

Features that set the napplet protocol apart from comparable platforms. Not strictly required for v1 credibility, but high-value for positioning.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| NIP-01 wire format over postMessage | No other sandboxed platform uses an existing open protocol for its IPC. Figma uses proprietary message format. Farcaster uses custom SDK actions. Telegram uses `web_app_*` event types. Napplet reuses NIP-01 relay wire format -- any Nostr developer already knows how to read the messages. | Already built | Demonstrate this explicitly in docs and demo. Show a raw postMessage log that looks like relay traffic. |
| Aggregate hash versioning | Version-specific ACL tied to content hash of the napplet build. No other platform does this. Web Extensions use version strings. Farcaster uses domain-level identity. This enables per-build permission grants without trusting version strings. | Already built | Demo: deploy updated napplet build, shell detects hash change, triggers update behavior (auto-grant, banner, silent-reprompt). |
| Protocol-level inter-app messaging | Figma plugins cannot communicate with each other. Farcaster Mini Apps are single-instance. Telegram Mini Apps are isolated per bot. Napplets can pub/sub to each other via kind 29003 with topic-based routing. This enables compositor-style app ecosystems. | Already built | Demo: chat napplet emits `profile:open` topic, profile napplet responds. Show bidirectional flow. |
| Shell-injectable events | The shell can inject synthetic events into the subscription system. This enables shell-level state broadcasting (e.g., `auth:identity-changed`) without napplets needing to poll. No comparable platform does host-to-app broadcast via the same wire format. | Already built | Demo: user switches identity in shell, all napplets receive `auth:identity-changed` event automatically. |
| Scoped relay connections (NIP-29) | Napplets can request the shell to open a relay connection scoped to a specific relay URL with specific filters. This is like giving a plugin its own relay "channel" -- comparable to Farcaster's chain-specific providers but for relay-specific access. | Already built | Demo: napplet opens scoped connection to a NIP-29 group relay, receives group events. |
| NIP-5A manifest with cryptographic signing | The vite plugin generates a manifest with SHA-256 per-file hashes and an aggregate hash, then signs it as a kind 35128 Nostr event. Stronger than Farcaster's domain association or Web Extension's CRX signing because it uses the same Nostr identity infrastructure. | Already built | Demo: build a napplet, show generated manifest, verify signature matches author pubkey. |
| Keyboard hotkey forwarding | When a napplet iframe has focus, keyboard shortcuts need to reach the shell. The protocol forwards hotkeys as kind 29004 events. No comparable platform handles this -- Figma plugins capture all keyboard input themselves. | Already built | Demo: napplet has focus, user presses shell hotkey, shell receives and executes it. |
| Visual protocol debugger | See every postMessage in real-time with type coloring and filter inspection. No other Nostr tool has this. Farcaster has Frame Playground but it is external, not an in-protocol app. | New build | A napplet that subscribes to all message types and displays them. The debugger IS a napplet -- dogfooding the protocol. |
| Behavioral test matrix documentation | Published table of every capability x every scenario with test status. No comparable SDK publishes this level of protocol coverage transparency. | Low | Generated from test results, published in docs. |

---

## Anti-Features

Features to explicitly NOT build for v1. Each has a clear rationale.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Restrictive ACL default mode | The codebase currently defaults to permissive (unknown napplets get all capabilities). Switching to restrictive default would break the developer experience for v1. Telegram and Farcaster both ship permissive-first for developer adoption. | Document the permissive default prominently. Add `mode: 'restrictive'` config option as a follow-up, not a v1 blocker. |
| Manifest signature verification in shell | Shell currently loads napplets without verifying `.nip5a-manifest.json` signatures. Full supply-chain verification is important but adds complexity that blocks the demo. Figma did not add plugin review until years after launch. | Document that manifest verification is a security hardening feature for post-v1. The vite plugin generates signed manifests -- the verification side can wait. |
| Rate limiting on signer requests | A malicious napplet could spam signer requests. But rate limiting requires policy decisions (how many per second? per minute?) that should not block v1. Web Extensions defer abuse prevention to the review process. | Document expected behavior. Add rate limiting as a shell hook that implementors can provide. |
| IndexedDB storage backend | localStorage is 5-10 MB per origin. Sufficient for v1. IndexedDB would add async complexity to the storage proxy. Telegram uses localStorage-equivalent for device storage. | Keep localStorage. Document the limit. Add IndexedDB as a future storage backend option. |
| Multi-shell federation | Running multiple shell instances on the same page and routing between them. No comparable platform supports this. Complexity is enormous for zero user demand. | Document single-shell-per-page constraint. |
| Framework-specific bindings | React hooks, Svelte stores, Vue composables for the shim API. Every platform starts framework-agnostic. Figma's plugin API is vanilla JS. Farcaster's SDK is vanilla JS. Community builds the bindings. | Ship vanilla JS SDK. Let community build `@napplet/react`, `@napplet/svelte`. |
| Key rotation for ephemeral keypairs | Rotating compromised napplet session keys. Important for security but adds significant state management complexity. No comparable platform supports key rotation for embedded app sessions. | Document that keypair is session-scoped and non-rotatable. Recommend clearing sessionStorage if compromise suspected. |
| Real event ID computation for injected events | Shell-injected events currently use fake IDs (`crypto.randomUUID` padded to 64 chars). Computing real SHA-256 hashes would require importing more of nostr-tools into the shell. | Document that injected events are synthetic and should not be verified by ID. Add a `['synthetic', 'true']` tag to injected events so napplets can distinguish them. |
| Napplet-to-napplet direct communication | Bypassing the shell for napplet-to-napplet messages. Every sandboxed platform routes through the host for security. Direct iframe-to-iframe postMessage would bypass ACL. | Always route through shell. This is a security invariant, not a missing feature. |
| E2E tests against real Nostr relays | Flaky, slow, requires network. Tests should be deterministic and fast. | Mock relay responses in test harness. Use real relays only in manual integration testing. |
| Multi-browser CI matrix | Overkill for v0.1. Chromium is sufficient for initial validation. | Test on Chromium only. Add Firefox/WebKit in CI when user base grows. |
| Performance benchmarking suite | Premature optimization. Protocol correctness first. | Document known bottlenecks (CONCERNS.md already does this). Benchmark when performance is actually a problem. |
| Offline/PWA support | Running napplets without network. Adds service worker complexity. No comparable protocol-level SDK supports offline sandboxed apps. | v1 is online-only. |

---

## Feature Dependencies

```
AUTH Handshake
  (must succeed before any other operation)
  |
  +-- ACL Initialization
  |   (entry created on successful AUTH)
  |   |
  |   +-- ACL Enforcement
  |   |   (checked on every operation)
  |   |   |
  |   |   +-- Relay Pub/Sub (requires relay:read, relay:write)
  |   |   +-- Signer Delegation (requires sign:event, sign:nip04, sign:nip44)
  |   |   |   +-- Consent Prompt (destructive kinds only)
  |   |   +-- Inter-pane Messaging (requires relay:write for emit, relay:read for on)
  |   |   +-- Hotkey Forwarding (requires hotkey:forward)
  |   |
  |   +-- Storage Proxy (requires storage:read, storage:write)
  |
  +-- Subscription Lifecycle (REQ/CLOSE/EOSE depends on AUTH)
  +-- Message Debugger Napplet (is itself a napplet, needs AUTH)

Vite Plugin (manifest generation)
  +-- Independent of runtime; build-time only
      +-- Produces aggregateHash used by AUTH

Aggregate Hash Versioning
  +-- Depends on: Vite Plugin output + AUTH handshake
      +-- Feeds into: ACL composite key
```

### Critical Path for Demo

1. **AUTH handshake** -- nothing works without it
2. **Relay pub/sub** -- proves the core protocol works
3. **Multi-napplet + inter-pane messaging** -- proves the compositor model
4. **ACL enforcement** -- proves the security model
5. **Storage proxy** -- proves sandboxed persistence
6. **Signer delegation + consent** -- proves Nostr integration
7. **Message debugger** -- makes everything visible

### Critical Path for Tests

1. **NIP-01 filter matching** (pure function, no deps)
2. **Replay attack detection** (pure function, no deps)
3. **ACL store operations** (in-memory, no browser)
4. **AUTH handshake** (needs crypto mock)
5. **Subscription lifecycle** (needs mock windows)
6. **Storage proxy** (needs localStorage mock)
7. **Signer correlation** (needs mock windows)
8. **Inter-pane delivery** (needs multiple mock windows)
9. **postMessage boundary** (needs real browser -- Playwright or vitest browser mode)

---

## Behavioral Test Matrix (Complete)

The complete matrix below maps every protocol capability to its test scenarios. This is what "complete coverage" looks like for a sandboxed iframe app protocol. Derived from analysis of: the Iframe Sandbox Breakout Test Suite (9 categories), Tauri v2 ACL penetration test scenarios, Telegram Mini App vulnerability surface, and Web Extension MV3 permission model testing patterns.

### 1. Identity and Authentication

| Scenario | Input | Expected | Priority |
|----------|-------|----------|----------|
| Valid AUTH handshake | Correct challenge, valid sig, correct relay tag | OK true, napp registered | P0 |
| Bad signature | Valid challenge, invalid sig | OK false "invalid signature" | P0 |
| Expired timestamp | created_at > 60s ago | OK false "too far from now" | P0 |
| Future timestamp | created_at > now + 60s | OK false "too far from now" | P0 |
| Wrong challenge | Valid sig, wrong challenge value | OK false "challenge mismatch" | P0 |
| Wrong relay tag | Valid sig, relay tag != hyprgate://shell | OK false "relay tag" | P0 |
| Wrong event kind | kind != 22242 | OK false "kind must be 22242" | P1 |
| Missing type tag | No type tag in AUTH event | Defaults to 'unknown', succeeds | P1 |
| Missing aggregateHash | No hash tag | Empty string hash, succeeds | P1 |
| Duplicate AUTH from same window | Second AUTH after first succeeded | Re-registration, new entry | P2 |

### 2. Permission Enforcement

| Scenario | Input | Expected | Priority |
|----------|-------|----------|----------|
| Default permissive: unknown napp publishes | No ACL entry exists | Publish succeeds (default allow) | P0 |
| Explicit grant: relay:write | Grant relay:write, then publish | Publish succeeds | P0 |
| Revoke: relay:write | Revoke relay:write, then publish | OK false "capability denied" | P0 |
| Block: entire napp | Block napp, then any operation | All operations denied | P0 |
| Unblock: previously blocked | Block then unblock, then publish | Publish succeeds | P0 |
| Revoke storage:read | Revoke, then getItem | Error "storage:read denied" | P1 |
| Revoke storage:write | Revoke, then setItem | Error "storage:write denied" | P1 |
| Revoke sign:event | Revoke, then signEvent request | Error "sign:event denied" | P1 |
| ACL persist/load round-trip | Persist, clear, load | Same entries restored | P1 |
| ACL corrupt data recovery | Load with invalid JSON | Store cleared, no crash | P2 |

### 3. Message Routing

| Scenario | Input | Expected | Priority |
|----------|-------|----------|----------|
| REQ creates subscription | REQ with valid subId and filters | Subscription active, buffer events delivered | P0 |
| EVENT matches subscription | Publish event matching filter | EVENT delivered to subscriber | P0 |
| EVENT no match | Publish event not matching filter | No delivery | P0 |
| CLOSE removes subscription | CLOSE with subId | No further events delivered | P0 |
| EOSE sent after buffer scan | REQ with buffer containing matches | EOSE sent after stored events | P0 |
| Sender excluded from delivery | Napp A publishes inter-pane | Napp A does NOT receive own event | P0 |
| p-tag targeted delivery | Event with p-tag matching Napp B | Only Napp B receives | P1 |
| REQ before AUTH | Send REQ before AUTH completes | Message queued, replayed after AUTH | P1 |
| REQ from blocked napp | Blocked napp sends REQ | CLOSED "relay:read denied" | P1 |
| COUNT returns buffer matches | COUNT with filters | COUNT response with correct count | P2 |

### 4. Replay and Integrity

| Scenario | Input | Expected | Priority |
|----------|-------|----------|----------|
| Event with old timestamp | created_at > 30s ago | Rejected "too old" | P0 |
| Event with future timestamp | created_at > now + 10s | Rejected "in the future" | P0 |
| Duplicate event ID | Same event.id sent twice | Second rejected "already processed" | P0 |
| Seen ID cleanup | Wait > 30s after first event | ID removed from seen set | P1 |
| Event from unregistered window | Message from unknown source | Ignored (no windowId match) | P1 |

### 5. Storage Isolation

| Scenario | Input | Expected | Priority |
|----------|-------|----------|----------|
| setItem + getItem | Set "key1" = "value1", get "key1" | Returns "value1" | P0 |
| getItem missing key | Get non-existent key | Returns null (found=false) | P0 |
| removeItem | Set then remove key | getItem returns null | P0 |
| keys() lists napp keys | Set 3 keys | Returns array of 3 keys | P0 |
| clear() removes all napp keys | Set 3 keys, clear | keys() returns [] | P0 |
| Cross-napp isolation | Napp A sets "key1", Napp B gets "key1" | Napp B gets null | P0 |
| Quota enforcement | Write > 512 KB | Error "quota exceeded" | P1 |
| Quota calculation accuracy | Write exactly at limit | Succeeds; one byte more fails | P1 |
| Storage persistence | setItem, reload shell | getItem still returns value | P1 |
| Malformed request (no key tag) | Send storage-get without key tag | Error "missing key tag" | P2 |
| Unregistered napp storage request | Request from unauthed window | Error "auth-required" | P2 |

### 6. Signer Delegation

| Scenario | Input | Expected | Priority |
|----------|-------|----------|----------|
| getPublicKey | signEvent('getPublicKey') | Returns host pubkey | P0 |
| signEvent (non-destructive) | Sign kind 1 event | Signed event returned | P0 |
| signEvent (destructive, approved) | Sign kind 0, user approves | Signed event returned | P0 |
| signEvent (destructive, denied) | Sign kind 0, user denies | Error "user rejected" | P0 |
| No signer configured | Request when shell has no signer | Error "no signer configured" | P1 |
| Request timeout | Signer never responds | Error "timed out" after 30s | P1 |
| Concurrent requests | 3 requests with different correlation IDs | Each resolved independently | P1 |
| NIP-44 encrypt/decrypt | Encrypt then decrypt | Round-trip produces original | P2 |
| NIP-04 encrypt/decrypt | Encrypt then decrypt | Round-trip produces original | P2 |

### 7. Inter-Pane Communication

| Scenario | Input | Expected | Priority |
|----------|-------|----------|----------|
| emit() + on() basic | Napp A emits topic, Napp B listens | Napp B callback fires with payload | P0 |
| Topic filtering | Napp B listens to "profile:open", Napp A emits "chat:message" | Napp B callback does NOT fire | P0 |
| Multiple subscribers | Napp B and C both listen to same topic | Both receive event | P0 |
| Unsubscribe (close) | Napp B closes subscription, Napp A emits | Napp B does NOT receive | P1 |
| Malformed content | emit with non-JSON content | on() callback receives {} | P1 |
| Shell-injected events | Shell calls injectEvent() | All matching subscribers receive | P1 |
| Empty subscriber set | emit with no listeners | No error, event stored in buffer | P2 |

### 8. Lifecycle and Edge Cases

| Scenario | Input | Expected | Priority |
|----------|-------|----------|----------|
| Messages queued during AUTH | Send REQ before AUTH completes | Queued, replayed after AUTH OK | P0 |
| AUTH rejection clears queue | AUTH fails after messages queued | Queue cleared, messages not processed | P0 |
| Cleanup removes all state | Call cleanup() | All subscriptions, buffers, registries cleared | P1 |
| Non-array postMessage ignored | Send string via postMessage | Silently ignored | P1 |
| Null source window | MessageEvent with null source | Silently ignored | P1 |
| Ring buffer overflow | Publish > 100 inter-pane events | Oldest events dropped, newest retained | P2 |
| Manifest cache collision | Same pubkey:dTag, different hash | New hash overwrites old | P2 |

### Test Count Summary

| Category | P0 | P1 | P2 | Total |
|----------|----|----|----| ------|
| Identity and Authentication | 6 | 3 | 1 | 10 |
| Permission Enforcement | 5 | 4 | 1 | 10 |
| Message Routing | 6 | 3 | 1 | 10 |
| Replay and Integrity | 3 | 2 | 0 | 5 |
| Storage Isolation | 6 | 3 | 2 | 11 |
| Signer Delegation | 4 | 3 | 2 | 9 |
| Inter-Pane Communication | 3 | 3 | 1 | 7 |
| Lifecycle and Edge Cases | 2 | 3 | 2 | 7 |
| **Total** | **35** | **24** | **10** | **69** |

P0 tests (35) are the minimum viable test suite. P0+P1 (59) is the target for v1.

---

## MVP Recommendation

### Prioritize (required for credible v1)

1. **AUTH handshake demo + tests** -- 8 scenarios minimum (success + 7 failure paths). This is the front door of the protocol. Every comparable platform leads with identity.
2. **Relay pub/sub demo + tests** -- single napplet subscribes, publishes, receives. Filter matching tests. This is the core value.
3. **Multi-napplet inter-pane demo** -- 2 napplets + shell. Topic-based pub/sub. This is the unique differentiator.
4. **ACL enforcement demo + tests** -- grant, revoke, block visible in debugger. Full ACL store unit test suite.
5. **Storage proxy demo + tests** -- CRUD operations, quota enforcement, cross-napplet isolation.
6. **Signer delegation demo + tests** -- signEvent, getPublicKey, consent prompt flow.
7. **Message debugger napplet** -- subscribe to all kinds, display message flow. This IS the visual test runner.
8. **Lifecycle tests** -- load, auth, ready, cleanup. Queue behavior during auth pending.

### Defer (post-v1)

- **Hotkey forwarding demo**: Works but is a UX concern, not a protocol concern. Test with unit tests only.
- **Audio management demo**: Niche feature. Unit test only.
- **Scoped relay connections demo**: Complex to set up (needs NIP-29 relay). Document and unit test.
- **Aggregate hash update flow demo**: Important but secondary to basic auth. Unit test the 3 update behaviors.
- **DM proxy demo**: Optional hook. Unit test only.
- **Napplet boilerplate/starter template**: Useful but not protocol validation. Build after demo is working.
- **Interactive playground**: Requires working demo first. Phase 2+ feature.
- **VitePress spec site**: Can ship raw markdown first, build site later.

---

## Comparison to Comparable Platforms

| Capability | Napplet | Figma Plugin | Telegram Mini App | Farcaster Mini App | Web Extension MV3 |
|-----------|---------|-------------|-------------------|--------------------|--------------------|
| Sandbox mechanism | iframe no allow-same-origin | iframe + QuickJS WASM VM | iframe | iframe / WebView | Separate process |
| Communication | NIP-01 postMessage | postMessage (proprietary) | postMessage (web_app_*) | postMessage (SDK) | chrome.runtime messaging |
| Identity | Ephemeral Schnorr keypair | Plugin ID | Bot token + initData | Farcaster FID + domain | Extension ID |
| Permissions | Composite ACL (pubkey:dTag:hash) | Network manifest | Bot-level | Manifest capabilities | Manifest permissions |
| Storage | Proxied localStorage (512 KB) | clientStorage (async) | 3 tiers: device (5 MB), secure (10 items), cloud (1024 items) | None built-in | chrome.storage (10 MB+) |
| Inter-app comms | Kind 29003 topic events | None | None | None | Limited (externally_connectable) |
| Signing delegation | NIP-07 proxy to host signer | N/A | N/A | EIP-1193 wallet provider | N/A |
| Manifest/integrity | NIP-5A signed manifest | CRX signature | None | Domain association | CRX3 signature |
| Lifecycle | AUTH challenge-response | closePlugin() required | initData validation | ready() to dismiss splash | Background service worker |

---

## Sources

- [Figma: How Plugins Run](https://developers.figma.com/docs/plugins/how-plugins-run/) -- sandbox model, Realms-to-QuickJS evolution, capability restrictions
- [Figma: How We Built the Plugin System](https://www.figma.com/blog/how-we-built-the-figma-plugin-system/) -- architecture decisions, security tradeoffs
- [Figma: Plugin Security Update](https://www.figma.com/blog/an-update-on-plugin-security/) -- sandbox breakout vulnerabilities, VM migration
- [Telegram Mini Apps Docs](https://core.telegram.org/bots/webapps) -- storage tiers, postMessage events, capabilities
- [Telegram Mini Apps Methods](https://docs.telegram-mini-apps.com/platform/methods) -- SDK method reference
- [Telegram Mini Apps Vulnerability (Dec 2025)](https://www.linkedin.com/posts/luis-oria-seidel-%F0%9F%87%BB%F0%9F%87%AA-301a758a_cybersecurity-vulnerabilities-telegram-activity-7405155878124908544-tPm4) -- iframe isolation bypass, patched in 24h
- [Farcaster Mini Apps Specification](https://miniapps.farcaster.xyz/docs/specification) -- SDK actions, manifest format, trust model
- [Farcaster Frames v2 Spec](https://docs.farcaster.xyz/developers/frames/v2/spec) -- capabilities, wallet provider
- [Iframe Sandbox Breakout Test Suite](https://www.storbeck.dev/posts/iframe-sandbox-test-suite) -- 9-category test matrix for iframe sandbox capabilities
- [PostMessage Security Testing](https://cyb3rlant3rn.medium.com/postmessage-security-testing-6dddc200bf2c) -- origin validation, wildcard risks
- [Building a Secure Code Sandbox](https://medium.com/@muyiwamighty/building-a-secure-code-sandbox-what-i-learned-about-iframe-isolation-and-postmessage-a6e1c45966df) -- iframe isolation patterns
- [Tauri v2 Capabilities](https://v2.tauri.app/security/capabilities/) -- ACL-based IPC permission model
- [Tauri v2 Permissions](https://v2.tauri.app/security/permissions/) -- fine-grained command-level permissions
- [Tauri v2 Penetration Test Report](https://fossies.org/linux/tauri/audits/Radically_Open_Security-v2-report.pdf) -- ACL bypass scenarios tested
- [Web Extension MV3 Security](https://developer.chrome.com/docs/extensions/develop/migrate/improve-security) -- CSP restrictions, permission model
- [Vitest Browser Mode](https://vitest.dev/guide/browser/) -- iframe-based test runner for postMessage testing
- [Sunpeak MCP App Framework](https://sunpeak.ai/blogs/what-is-an-mcp-app/) -- simulation-based testing for sandboxed iframe apps
