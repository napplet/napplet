# Domain Pitfalls

**Domain:** Sandboxed Nostr app protocol SDK (iframe postMessage relay)
**Researched:** 2026-03-30

---

## Critical Pitfalls

Mistakes that cause security breaches, rewrites, or major breakage.

### Pitfall 1: Permissive-by-Default ACL Grants Full Capabilities to Unknown Napplets

**What goes wrong:** The `aclStore.check()` method returns `true` when no entry exists for a napplet identity (`if (!entry) return true`). This means any napplet that connects and completes AUTH automatically gets every capability: signing, storage, relay access. If ACL persistence fails (localStorage unavailable, corrupted data, parsing error in `load()`), all previously restricted napplets silently regain full permissions.

**Why it happens:** Development convenience. During extraction from hyprgate the permissive default made iteration faster. The decision was explicitly deferred in PROJECT.md.

**Consequences:**
- A malicious napplet iframe can sign arbitrary events with the user's key (kind 0 profile, kind 3 contact list, kind 5 deletion) if the consent handler is not registered or is poorly implemented.
- Storage quota is the only brake. Without ACL denial, any napplet can read/write to relay, encrypt/decrypt via NIP-04/NIP-44, and forward hotkeys.
- If `_onConsentNeeded` is null (shell implementor forgot to register it), destructive signing kinds bypass the consent check entirely -- the code at `pseudo-relay.ts:386` falls through to `dispatch(eventToSign)`.

**Prevention:**
1. Add a `defaultPolicy: 'permissive' | 'restrictive'` config option to `createPseudoRelay`. Default to `restrictive` before v1.0 publish.
2. In restrictive mode, `check()` returns `false` for unknown entries. Napplets must be explicitly granted capabilities.
3. Add a startup warning (console.warn) when running in permissive mode to make the risk visible during development.
4. Make `onConsentNeeded` registration mandatory -- throw if `handleSignerRequest` is called for a destructive kind without a consent handler registered.

**Detection:** Audit `aclStore.check()` return path for missing entries. Search for `_onConsentNeeded` null checks in signing flow. Test: what happens if you never call `onConsentNeeded()` and a napplet requests `signEvent` for kind 0?

**Phase:** Must be addressed before demo phase (ACL enforcement demo is meaningless if default is permissive). Should be phase 1 or 2.

---

### Pitfall 2: postMessage Origin Wildcard Leaks Messages to Any Listener

**What goes wrong:** Every `postMessage` call in both shell and shim uses `'*'` as targetOrigin: `sourceWindow.postMessage(['EVENT', subId, event], '*')`. While `event.source` (Window reference) is unforgeable and used for sender validation via `origin-registry.ts`, the *outbound* messages are broadcast to all origins. Any script on the page, browser extension, or injected iframe can listen to these messages.

**Why it happens:** Sandboxed iframes without `allow-same-origin` have opaque (`null`) origins. You cannot specify a meaningful targetOrigin because the iframe's effective origin is `null`, and `postMessage(msg, 'null')` does not work as a targeted origin -- it still behaves like a wildcard in most browsers. This is a fundamental architectural constraint of the sandbox model chosen.

**Consequences:**
- Signer responses (kind 29002) containing signed events or public keys are broadcast to all listeners. A malicious extension or injected script can intercept signed events.
- Storage responses containing napplet data are broadcast similarly.
- AUTH challenge strings are sent via wildcard, potentially allowing a competing listener to race against the legitimate napplet.

**Prevention:**
1. Accept the wildcard as unavoidable for sandboxed iframe communication, but add message-level authentication. Each message should include an HMAC or session token derived from the AUTH handshake, verifiable by the recipient.
2. Use a nonce-based session identifier established during AUTH that both sides validate on every message. Not a crypto signature (too expensive for every postMessage), but a shared secret from the handshake.
3. Document this trust boundary prominently. SDK consumers must understand that postMessage content is visible to extensions and same-page scripts.
4. For the shell side: validate `event.source` strictly (already done via origin registry). For the shim side: validate that `event.source === window.parent` (currently not checked in `handleRelayMessage` at `index.ts:159`).

**Detection:** Grep for `postMessage(` calls across both packages. Count how many use `'*'`. Check whether `handleRelayMessage` validates `event.source`.

**Phase:** Phase 1 -- document the constraint. Phase 2 -- add shim-side source validation. Session token can be deferred to a security-focused phase.

---

### Pitfall 3: AUTH Race Condition Allows Pre-AUTH Messages to Execute After Rejection

**What goes wrong:** When a napplet sends REQ/EVENT before AUTH completes, messages queue in `pendingAuthQueue`. If AUTH fails (signature invalid, challenge mismatch), the queue is deleted in some paths but not all. Specifically:

- Signature invalid (`pseudo-relay.ts:155`): queue is deleted. Good.
- Challenge mismatch (`pseudo-relay.ts:143`): function returns without deleting queue. Queue persists.
- Relay tag mismatch (`pseudo-relay.ts:146`): function returns without deleting queue. Queue persists.
- Timestamp too old (`pseudo-relay.ts:149`): function returns without deleting queue. Queue persists.
- Kind not 22242 (`pseudo-relay.ts:139`): function returns without deleting queue. Queue persists.

In the non-signature failure paths, `sendOkFail()` is called but `pendingAuthQueue.delete(windowId)` is not. If the shell later receives a valid AUTH from the same windowId (legitimate retry or attacker manipulation), the stale queue executes.

**Why it happens:** Each early-return path was written independently. The queue cleanup was only added to the signature verification failure, not to the generic rejection paths.

**Consequences:**
- Pre-authenticated messages from a failed AUTH attempt execute under the credentials of a later successful AUTH attempt.
- In theory, a napplet could queue up REQ subscriptions or EVENT publications before AUTH, fail AUTH intentionally, then succeed on a second attempt with different credentials while the old messages still execute.

**Prevention:**
1. Add `pendingAuthQueue.delete(windowId)` to every early-return path in `handleAuth()`, not just the signature failure path.
2. Better: refactor `handleAuth()` to have a single cleanup point. Use a try/finally or early-exit pattern where the queue is always cleared on failure.
3. Add an integration test that verifies: send REQ, then send invalid AUTH, then send valid AUTH. The pre-invalid-AUTH REQ must not execute.

**Detection:** Read `handleAuth()` and trace every `return` statement. For each, check whether `pendingAuthQueue.delete(windowId)` is called before the return.

**Phase:** Phase 1 -- this is a security bug. Fix before any demo or test phase.

---

### Pitfall 4: Fake Event IDs on Shell-Injected Events Break Nostr Verification

**What goes wrong:** `injectEvent()` at `pseudo-relay.ts:600` generates fake event IDs: `crypto.randomUUID().replace(/-/g, '').slice(0, 64).padEnd(64, '0')`. These are not SHA-256 hashes of the event's serialized content (as NIP-01 requires). The signature is similarly fake: `'0'.repeat(128)`.

**Why it happens:** Shell-injected events (like `auth:identity-changed`) are internal bus messages, not relay-published events. The developer reasonably assumed napplets would not verify their IDs/signatures. But the same `deliverToSubscriptions` path delivers these to napplets as `['EVENT', subId, event]` -- identical to real relay events.

**Consequences:**
- Napplets using `nostr-tools.verifyEvent()` on incoming events will reject shell-injected events (ID hash mismatch, invalid signature).
- Any napplet that stores received events and later tries to verify integrity will find corruption.
- The protocol specification will be misleading if it claims all events are NIP-01 compliant but shell events break the standard.

**Prevention:**
1. Compute proper SHA-256 event IDs for injected events using `nostr-tools`'s event serialization. The pubkey can still be zeroed (system pubkey), but the ID must be a valid hash.
2. Alternatively, mark shell-injected events with a tag like `['_', 'system']` so napplets can distinguish them and skip verification.
3. Document clearly in the NIP-5A spec that shell-injected events have pubkey `0x00...00` and should not be verified.
4. Do NOT fake signatures. Either compute real ones with a shell keypair, or explicitly set `sig` to empty string and document this.

**Detection:** Search for `randomUUID` in pseudo-relay.ts. Verify whether any consumer calls `verifyEvent` on received events.

**Phase:** Phase 2 -- fix before publishing the spec. The fix is small but has spec implications.

---

### Pitfall 5: localStorage Dependency Creates Silent Failure Cascade

**What goes wrong:** ACL store, manifest cache, and storage proxy all depend on `localStorage`. Without `allow-same-origin`, the *napplet* cannot access localStorage (by design -- this is correct). But the *shell* also depends on localStorage for persistence. If the shell runs in a context where localStorage is unavailable (private browsing in some browsers, storage quota exceeded, iframe within another sandbox), the failure is silent:

- `aclStore.persist()` catches and ignores the error (`acl-store.ts:122-124`).
- `aclStore.load()` catches the error and clears the store (`acl-store.ts:153-156`), meaning all loaded ACL entries are lost.
- `manifestCache` similarly swallows errors.
- The napplet's keypair generation (now ephemeral per page load) no longer uses localStorage, but ACL and manifest persistence breaking means the shell forgets all permission decisions on every page load.

**Why it happens:** Silent try/catch is a common defensive pattern. But when the entire security model (ACL persistence) depends on the caught operation, silent failure is catastrophic.

**Consequences:**
- In private browsing mode, every page load resets ACL to defaults (permissive = full access for all). User revocations and blocks are never remembered.
- Storage proxy still works for the current session (shell writes to localStorage which may be available but ephemeral in private browsing), but data is lost on tab close.
- Manifest cache entries lost means every napplet AUTH triggers a "new napp" flow, never detecting updates.

**Prevention:**
1. Add a `storage.isAvailable()` check at `createPseudoRelay` initialization time. If localStorage is unavailable, log a prominent warning and expose a flag so the shell implementor can show a UI warning.
2. Add a `ShellHooks.storage` hook that abstracts the persistence layer. Default implementation uses localStorage. Shell implementors can provide IndexedDB, in-memory, or other backends.
3. In the shim, the keypair is already ephemeral -- document that this is by design, not a bug. Napplet identity comes from the aggregate hash, not the keypair.
4. Make `aclStore.load()` return a success/failure indicator so callers know whether persistence is working.

**Detection:** Run the shell in a browser with localStorage disabled (or Firefox private browsing). Check whether ACL decisions persist across page loads. They will not.

**Phase:** Phase 2 -- add detection and warning. Phase 3 -- add hooks for alternative storage.

---

## Moderate Pitfalls

### Pitfall 6: Storage Keys Containing Commas Corrupt `keys()` Response

**What goes wrong:** The `storage-keys` response at `storage-proxy.ts:130` joins all keys with commas: `['keys', userKeys.join(',')]`. The shim's `keys()` method at `storage-shim.ts:161` splits on commas: `raw.split(',')`. If a napplet stores a key containing a comma (e.g., `"data,backup"`), the key list is corrupted: one key becomes two.

**Why it happens:** Quick serialization without considering delimiter collision.

**Prevention:**
1. Use JSON serialization for the keys list: `['keys', JSON.stringify(userKeys)]`. Parse with `JSON.parse` on the shim side.
2. Alternatively, use a delimiter that is unlikely in key names (like `\x00`), but JSON is safer and more standard.

**Detection:** Write a test that stores a key containing a comma and verifies `keys()` returns it correctly.

**Phase:** Phase 1 -- trivial fix, should be caught by storage tests.

---

### Pitfall 7: nostr-tools Peer Dependency Range Is Too Wide

**What goes wrong:** Both shim and shell declare `"nostr-tools": ">=2.23.3 <3.0.0"` as peer dependency. The nostr-tools v2.x line has had breaking changes within minor versions (relay.ts and pool.ts were rewritten from scratch in v2.0.0). The `finalizeEvent` API, `verifyEvent`, and subpath imports (`nostr-tools/pure`, `nostr-tools/utils`) could change behavior in future 2.x releases.

**Why it happens:** Wide peer ranges are easier for users. But nostr-tools is a fast-moving library with occasional breaking changes in minor versions.

**Consequences:**
- A user installing `nostr-tools@2.30.0` might get different `finalizeEvent` behavior or type signatures.
- The shim directly imports from `nostr-tools/pure` and `nostr-tools/utils` subpaths. If nostr-tools reorganizes subpath exports (which they have done before), the shim breaks.
- The vite-plugin dynamically imports `nostr-tools/pure` and `nostr-tools/utils` at build time. Silent failure means unsigned manifests ship without warning.

**Prevention:**
1. Tighten peer dependency to `~2.23.3` (patch-only) or `^2.23.3` (minor + patch) depending on risk tolerance.
2. Pin the exact version in the monorepo's `pnpm-lock.yaml` and test against that version.
3. Add a CI matrix that tests against the oldest and newest supported nostr-tools versions.
4. In the vite-plugin, make the nostr-tools import failure loud (throw with actionable error message) rather than falling through to unsigned manifests.

**Detection:** Check `peerDependencies` range in `package.json`. Run `npm info nostr-tools versions` to see how many versions fall within the range.

**Phase:** Phase 3 (publishing phase) -- tighten before npm publish.

---

### Pitfall 8: Shim Does Not Validate `event.source` on Incoming Messages

**What goes wrong:** The shim's `handleRelayMessage()` at `index.ts:159` and `handleStorageResponse()` at `storage-shim.ts:41` accept messages from any source without checking `event.source === window.parent`. A malicious sibling iframe or injected script could post fake `['AUTH', challenge]` or `['EVENT', subId, event]` messages to the napplet.

**Why it happens:** The shell correctly validates `event.source` via origin registry. But the shim side (running inside the napplet iframe) does not reciprocate.

**Consequences:**
- A co-loaded malicious napplet that gains script injection could forge relay responses to another napplet.
- Fake `AUTH` challenges could trick the shim into generating a signed AUTH event and posting it to an attacker-controlled window.
- Fake signer responses could resolve pending sign requests with attacker-controlled data.

**Prevention:**
1. Add `if (event.source !== window.parent) return;` as the first line of both `handleRelayMessage` and `handleStorageResponse`.
2. This is a one-line fix in each handler. No performance cost.
3. Document in the spec that napplets MUST validate message source is `window.parent`.

**Detection:** Read `handleRelayMessage()` and `handleStorageResponse()` -- look for `event.source` checks. There are none.

**Phase:** Phase 1 -- trivial security fix.

---

### Pitfall 9: Manifest Hash Race Between Build and Meta Tag Injection

**What goes wrong:** The vite-plugin computes the aggregate hash over all files in `dist/`, then rewrites `index.html` to inject the hash into the `<meta>` tag. But this rewrite changes the file content, meaning the hash in the meta tag does not match the hash of the file that contains it. The manifest's `x` tag for `index.html` has the pre-rewrite hash, but the file on disk has the post-rewrite content.

**Why it happens:** Chicken-and-egg: the hash must be in the file, but the file's hash changes when the hash is injected.

**Consequences:**
- Any integrity verification that re-computes file hashes will find `index.html`'s hash mismatches the manifest.
- If the shell ever implements manifest verification (currently missing), it will reject the napplet.
- The aggregate hash itself is technically incorrect because it was computed before the final `index.html` content was determined.

**Prevention:**
1. Exclude `index.html` from the aggregate hash computation and document this exception in the spec.
2. Or compute the hash in two passes: first pass computes all hashes, second pass injects the aggregate hash into `index.html` and recomputes only `index.html`'s hash, then recomputes the aggregate. This converges because the hash is a fixed-length string.
3. Or use a different injection mechanism: instead of modifying `index.html`, generate a separate file (e.g., `.nip5a-hash`) that the shim reads at runtime via fetch.

**Detection:** Build a napplet with the vite-plugin, then manually re-hash `index.html` and compare to the manifest's `x` tag for `index.html`. They will differ.

**Phase:** Phase 2 -- spec refinement phase. Must be resolved before the NIP-5A spec is finalized.

---

### Pitfall 10: Testing postMessage-Based Protocols Requires Real Browser Contexts

**What goes wrong:** Unit testing with jsdom or happy-dom cannot properly test the napplet protocol because:
- jsdom does not implement sandboxed iframe behavior. All iframes share the same origin.
- `postMessage` in jsdom is synchronous, masking async race conditions.
- `MessageEvent.source` is not properly set in jsdom, breaking origin registry validation.
- `crypto.randomUUID()` may not be available in Node.js test environments without polyfills.
- `localStorage` behaves differently in jsdom vs real browsers.

**Why it happens:** The protocol is fundamentally about cross-origin iframe communication -- a browser primitive that headless JS environments do not faithfully replicate.

**Consequences:**
- Tests pass in jsdom but fail in real browsers.
- Race conditions (AUTH timing, message ordering) are hidden by synchronous postMessage.
- Sandbox-related bugs (opaque origin behavior, storage unavailability) are not caught.
- False confidence in test coverage.

**Prevention:**
1. Use Playwright or Vitest browser mode for all protocol tests. Do NOT use jsdom for any test involving postMessage, iframes, or origin validation.
2. Create a minimal test harness: a static HTML page that loads the shell, creates a sandboxed iframe, loads the shim, and exercises the protocol. Playwright drives it.
3. For unit testing pure functions (filter matching, ACL checks, replay detection), jsdom/Node.js is fine. Draw a clear boundary: pure logic = node tests, protocol behavior = browser tests.
4. Use Vitest's browser mode (stable as of Vitest 4, released Feb 2026) for component-level tests that need real DOM/postMessage.

**Detection:** If tests exist that import `postMessage` or create iframes and run under `vitest` with jsdom, they are likely unreliable.

**Phase:** Phase 1 -- establish the test strategy before writing tests. Wrong foundation = wasted work.

---

### Pitfall 11: ESM-Only Publishing Without `"type": "module"` Verification

**What goes wrong:** The packages declare `"type": "module"` and export only ESM. But several gotchas can break consumers:
- The `exports` field in `package.json` only specifies `"import"` condition, no `"require"` fallback. CJS consumers get a hard error with no guidance.
- TypeScript consumers using `"moduleResolution": "node"` (old resolution) cannot resolve subpath exports. They need `"moduleResolution": "bundler"` or `"node16"`.
- The `types` field points to `./dist/index.d.ts`. If tsup generates `.d.mts` instead of `.d.ts`, TypeScript resolution fails silently for some configurations.
- No `"engines"` field specifying minimum Node.js version (ESM + subpath exports require Node 14+, but `crypto.randomUUID` requires Node 19+).

**Why it happens:** ESM-only publishing is still messy in the npm ecosystem. Even in 2026, consumer toolchains vary widely.

**Consequences:**
- Users with CJS projects cannot use the packages without a bundler.
- TypeScript users with older `tsconfig.json` settings get mysterious "cannot find module" errors.
- Missing `engines` field means users discover incompatibility at runtime, not install time.

**Prevention:**
1. Add `"engines": { "node": ">=20" }` to all `package.json` files. Node 20 is LTS and supports everything these packages use.
2. Verify the published package works by running `npm pack` and testing the tarball in a clean project before publishing. Use `publint` and `arethetypeswrong` CLI tools.
3. Add a `"require"` entry in exports that points to a CJS wrapper stub that throws a clear error: `throw new Error('@napplet/shim is ESM-only. Use import instead of require.')`.
4. Add a note in package README about required `tsconfig.json` settings.

**Detection:** Run `npx publint` and `npx @arethetypeswrong/cli --pack` on each package before publishing.

**Phase:** Phase 3 -- publishing phase.

---

### Pitfall 12: Changesets Treats Peer Dependency Bumps as Major Versions

**What goes wrong:** When using changesets for versioning in a monorepo, updating a peer dependency (like bumping `nostr-tools` range) triggers a major version bump in dependent packages. This is changesets' default behavior and is often surprising.

**Why it happens:** Changesets considers peer dependency changes as breaking because they change the compatibility contract. This is semantically correct but can lead to premature v2.0.0 before the packages are even stable.

**Consequences:**
- A minor `nostr-tools` range adjustment forces `@napplet/shim` and `@napplet/shell` to v2.0.0 even if the API is unchanged.
- Users see a major version bump and assume breaking API changes when there are none.
- Pre-1.0 packages (current state at v0.1.0) are somewhat protected because semver treats 0.x differently, but post-1.0 this becomes a real problem.

**Prevention:**
1. Pin the nostr-tools peer dependency range and avoid changing it casually.
2. Configure changesets to handle peer dependency updates as minor changes if the API surface is unchanged: use the `ignore` config or manual changeset overrides.
3. Stay at 0.x until the peer dependency relationship is stable. Reaching 1.0 with a wide peer range creates upgrade pressure.

**Detection:** Run `npx changeset` after modifying peer dependencies. Check proposed version bump level.

**Phase:** Phase 3 -- before publishing to npm.

---

## Minor Pitfalls

### Pitfall 13: Subscription Cleanup Leaks on Napplet Navigation/Reload

**What goes wrong:** When a napplet iframe navigates away or reloads, the shell's `subscriptions` Map retains entries for the old windowId. The relay pool subscriptions tracked via `hooks.relayPool.trackSubscription` are not cleaned up. Event listeners accumulate.

**Prevention:**
1. Listen for iframe `beforeunload` or use `MutationObserver` to detect when iframes are removed from DOM.
2. Add a `cleanup(windowId)` method to PseudoRelay that removes all subscriptions, pending auth, and origin registry entries for a given window.
3. The shell implementor must call this on iframe removal -- document this in the SDK.

**Phase:** Phase 2 -- demo will involve loading/unloading napplets.

---

### Pitfall 14: Storage Key Serialization Through NIP-01 Tags Limits Key/Value Characters

**What goes wrong:** Storage keys and values are passed as NIP-01 tag values: `['key', userKey]`, `['value', storedValue]`. NIP-01 tags are JSON arrays of strings. If a key or value contains characters that break JSON serialization (though this is unlikely since JSON handles most strings), or if the value is very large, the postMessage payload becomes unwieldy.

More practically: the `value` tag is a single string. Binary data or large JSON blobs must be string-encoded. There is no chunking mechanism for values larger than the browser's postMessage size limit (varies by browser, typically 16MB but can be as low as 256KB in some mobile contexts).

**Prevention:**
1. Document maximum value size in the SDK (aligned with the 512KB quota).
2. Consider base64 encoding for binary data and document this pattern.
3. Add a size check in the shim before sending storage requests to fail fast with a clear error.

**Phase:** Phase 2 -- documentation and demo phase.

---

### Pitfall 15: Vite Plugin Silently Produces Unsigned Manifests

**What goes wrong:** When `VITE_DEV_PRIVKEY_HEX` is not set, the plugin prints a log message and returns. When it is set but `nostr-tools` import fails, the plugin writes an unsigned manifest. In both cases, the build succeeds. The napplet ships without integrity verification and the developer may not notice.

**Prevention:**
1. Add a `required: boolean` option (default `false` in dev, `true` in prod). When `required` is true and signing fails, throw and fail the build.
2. Differentiate between "intentionally unsigned" (dev mode, no key) and "accidentally unsigned" (key set but nostr-tools unavailable). The latter should always be an error.
3. nostr-tools is already a direct dependency of the vite-plugin package. The dynamic import at line 130 is unnecessary -- use a static import instead.

**Phase:** Phase 2 -- fix before spec finalization.

---

### Pitfall 16: `hyprgate` Naming Remnants in Published SDK

**What goes wrong:** Several identifiers use `hyprgate` naming:
- `PSEUDO_RELAY_URI = 'hyprgate://shell'`
- Meta tag names: `hyprgate-aggregate-hash`, `hyprgate-napp-type`
- localStorage key: `hyprgate:acl`
- `getNappType()` reads `meta[name="hyprgate-napp-type"]`

These are internal protocol identifiers that ship in the published packages. The SDK is called `@napplet/*` but the wire format references `hyprgate`.

**Prevention:**
1. Rename to `napplet://shell`, `napplet-aggregate-hash`, `napplet-napp-type`, `napplet:acl`.
2. Do this before v1.0 publish. After publish, these become breaking changes.
3. Update the NIP-5A spec simultaneously.

**Phase:** Phase 1 or 2 -- rename before any public demo or spec publication. This is branding/identity debt that compounds if deferred.

---

### Pitfall 17: No Message Versioning for Protocol Evolution

**What goes wrong:** The protocol uses NIP-01 wire format directly with no version envelope. The shim sends `PROTOCOL_VERSION = '2.0.0'` in the AUTH event's tags, but subsequent messages carry no version marker. If the protocol evolves (new verbs, changed tag schemas), there is no way for shell and shim to negotiate or detect version mismatch.

**Prevention:**
1. The AUTH handshake already exchanges version. Use this to set a per-session protocol version.
2. If shell and shim versions are incompatible, reject AUTH with a clear error: `"auth-required: protocol version mismatch (shell supports 2.x, napp sent 3.x)"`.
3. Do not add version tags to every message -- that is overhead. The AUTH handshake is the right place for version negotiation.

**Phase:** Phase 2 -- spec refinement.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Build fixes / wiring | hyprgate naming remnants (#16) leak into published API surface | Rename before any demo or consumer-facing output |
| ACL enforcement demo | Permissive default (#1) makes demo meaningless -- everything is allowed | Implement restrictive mode before demo |
| AUTH handshake tests | Race condition (#3) causes intermittent test failures | Fix queue cleanup before writing tests |
| Storage tests | Comma-in-key bug (#6) causes subtle test failures | Fix serialization before writing storage tests |
| Inter-napplet demo | Fake event IDs (#4) cause verification failures if demo napplets use nostr-tools verification | Fix or document before demo |
| Behavioral test setup | Using jsdom (#10) wastes effort on unreliable tests | Establish Playwright/browser-mode strategy first |
| NIP-5A spec refinement | Manifest hash race (#9) makes spec unimplementable for verifiers | Resolve chicken-and-egg hash problem before spec publication |
| npm publish | ESM gotchas (#11), changesets peer dep bumps (#12), nostr-tools range (#7) | Run publint/arethetypeswrong, test with npm pack |
| Security hardening | postMessage wildcard (#2), missing source validation (#8) | Add source validation to shim, document trust boundary |
| localStorage reliance | Silent persistence failure (#5) undermines security model in private browsing | Add detection, warning, and abstraction hooks |

---

## Sources

- [MDN: Window.postMessage()](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) -- authoritative reference on targetOrigin, security considerations
- [MDN: iframe sandbox attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe) -- sandbox token behavior, opaque origin
- [MSRC: PostMessaged and Compromised](https://msrc.microsoft.com/blog/2025/08/postmessaged-and-compromised/) -- real-world postMessage vulnerability patterns
- [Excalidraw postMessage wildcard issue](https://github.com/excalidraw/excalidraw/issues/9651) -- comparable project facing same wildcard origin challenge
- [Iframe Sandbox Bypass (2026)](https://medium.com/@renwa/iframe-sandbox-bypass-cross-origin-drag-drop-unvalidated-postmessage-origin-cookie-bomb-to-21357a4d94f5) -- current attack techniques
- [Chrome Storage Partitioning](https://developers.google.com/privacy-sandbox/cookies/storage-partitioning) -- iframe storage isolation changes
- [TypeScript ESM publishing (2025)](https://lirantal.com/blog/typescript-in-2025-with-esm-and-cjs-npm-publishing) -- ESM-only publishing complexity
- [2ality: Publishing ESM packages](https://2ality.com/2025/02/typescript-esm-packages.html) -- authoritative TypeScript ESM guide
- [Changesets monorepo guide (2025)](https://jsdev.space/complete-monorepo-guide/) -- peer dependency versioning behavior
- [nostr-tools v2.0.0 release notes](https://github.com/nbd-wtf/nostr-tools/releases/tag/v2.0.0) -- breaking changes in v2 line
- [nostr-protocol/nips](https://github.com/nostr-protocol/nips) -- NIP process and requirements
- [Vitest Browser Mode](https://vitest.dev/guide/browser/) -- stable browser testing for Vitest 4
- [Playwright iframe testing](https://debbie.codes/blog/testing-iframes-with-playwright/) -- practical iframe test patterns

---

*Pitfalls audit: 2026-03-30*
*Confidence: HIGH for pitfalls 1-6, 8, 10-11, 16 (verified against source code). MEDIUM for pitfalls 7, 9, 12-15, 17 (verified against documentation and ecosystem patterns).*
