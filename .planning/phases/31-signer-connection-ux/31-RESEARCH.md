# Phase 31: Signer Connection UX - Research

**Researched:** 2026-04-01
**Phase:** 31-signer-connection-ux
**Requirements:** SIGN-01, SIGN-02, SIGN-03, SIGN-04, SIGN-05

## Technical Approach

### Current State: The Demo Signer Is a Hidden Mock

`apps/demo/src/signer-demo.ts` generates an ephemeral keypair at boot time and exposes it through `createSignerHooks()`. `apps/demo/src/shell-host.ts` imports it and feeds it into `createDemoHooks()` as both the `auth.getSigner` hook and the backing source for `createSignerService(...)`.

This path is fully functional for protocol correctness tests — it signs events, responds to kind 29001 requests, and exercises the signer service dispatch path through the runtime. However, it is invisible to users and cannot represent a real identity:

- There is no UI surface that signals "who" the signer is or how it connects.
- The `DemoSignerMode` export (`'service' | 'fallback'`) was added in Phase 27 to make the mode observable, but that mode label still refers to a static mock, not a real connection model.
- A user visiting the demo sees napplet cards and service nodes in the topology, but finds no way to connect their own signer.

Phase 31 must replace this hidden mock experience with a real connection flow that accepts NIP-07 browser signers and NIP-46 bunker connections.

### NIP-07: Browser Extension Signer Path

NIP-07 defines `window.nostr` as the standard browser extension interface for Nostr signing. The interface provides:

- `getPublicKey() → Promise<string>`
- `signEvent(event) → Promise<signedEvent>`
- Optional `nip04`, `nip44`, `getRelays` methods

The demo shell already has an `auth.getSigner` hook in `ShellHooks`. For NIP-07, the connect action is:

1. Check whether `window.nostr` is available when the user clicks "Connect with Extension".
2. Call `window.nostr.getPublicKey()` to verify the extension is responsive and retrieve the pubkey.
3. Store the NIP-07 signer as the active signer in demo-level UI state.
4. Update `createDemoHooks()` to return the live NIP-07 signer instead of the mock.

Because `getSigner` is called per-request by the signer service, the demo can swap the signer reference at any time by closing over a mutable reference. The simplest wiring is a module-level signer ref that `getSigner` reads:

```ts
let activeSigner: RuntimeSigner | null = null;

function getSigner(): RuntimeSigner | null {
  return activeSigner;
}
```

NIP-07 availability should be detected at connect time rather than polled continuously. If `window.nostr` is absent, the NIP-07 option should show a clear "no extension detected" state rather than silently failing.

### NIP-46: Nostr Connect (Bunker) Path

NIP-46 defines a signer delegation protocol over Nostr relays. A user running a NIP-46 bunker (e.g., nsec.app, Nostrudel) connects with:

- a **bunker URI** in the form `bunker://<pubkey>?relay=<relay-url>&secret=<token>` or
- a **Nostr Connect QR code** that encodes the same bunker URI for mobile scan.

The requester (the demo) must:

1. Accept the bunker URI or QR scan result from the user.
2. Parse `pubkey` and `relay` from the URI.
3. Subscribe to the specified relay for NIP-46 response events from the bunker.
4. Send encrypted NIP-46 request events to the bunker and receive signed events in response.

This requires a real WebSocket relay connection on the demo side. The demo does not currently have a real relay pool; `createDemoHooks()` provides a stub `relayPool` that does nothing. Phase 31 must decide how to handle this gap.

#### NIP-46 Relay Handling Decision

The phase context (D-05, D-06) limits relay editing to the connect modal. The simplest correct path for Phase 31 is:

- Introduce a lightweight NIP-46 client in `apps/demo/src/` that opens a single WebSocket to the user-specified relay, handles NIP-46 request/response handshake, and exposes a `RuntimeSigner`-compatible interface.
- This client does not need to integrate with the full `RelayPool` hooks from the shell package — it only needs to send one WebSocket frame per signing request and await one response.
- The relay URL is editable only in the connect modal. After connection, show the active relay for visibility but do not expose an edit control in the topology node or inspector.

#### nostr-tools NIP-46 Support

`nostr-tools` (already a peer dependency) does not expose a high-level NIP-46 client API in the versions used by this project. The implementation should therefore use a minimal hand-rolled NIP-46 client in the demo rather than trying to import a library class that does not exist yet.

The minimal NIP-46 client needs:

- an ephemeral local keypair (for the requester side)
- a WebSocket connection to the specified relay
- NIP-04 encrypt/decrypt for the handshake frames
- event id and sig fields filled by nostr-tools `finalizeEvent`
- a `connect` call to establish the session and receive a `connect` response
- per-request `signEvent` / `getPublicKey` calls with a correlation id and a timeout

The client can be written as a class or factory function in `apps/demo/src/nip46-client.ts`.

### Connect Modal Design

The connect modal is the single surface that:

- presents NIP-07 and NIP-46 side by side as equal first-class options
- hosts the editable NIP-46 relay field (only here, per D-05/D-06)
- shows connection progress and errors
- triggers the successful connection that populates the signer node

Modal states per option:

| State | NIP-07 Display | NIP-46 Display |
|-------|----------------|----------------|
| idle | "Connect Extension" button | Relay input + bunker URI input + "Connect" button |
| connecting | spinner | spinner |
| connected | pubkey + checkmark | pubkey + active relay + checkmark |
| error | error message + retry | error message + retry |

The NIP-46 QR option shows a QR of the **nostrconnect://** URI — the counterpart bunker advertises by scanning it from the requesting app's side. For the demo, this means:

1. Generate an ephemeral local keypair.
2. Build a `nostrconnect://<localPubkey>?relay=<editableRelay>&metadata=...` URI.
3. Render it as a QR code in the modal so a mobile bunker app can scan and connect.

QR rendering can use a lightweight vanilla JS library (e.g., `qrcode` from npm) without adding framework dependencies.

### Signer Node in the Topology

After Phase 28, the topology renders service nodes that hang off runtime. The signer service is already registered in `shell-host.ts` and shows up as a service node.

For Phase 31, the signer service node should evolve from a minimal service card into a signer-specific surface:

- **Before connection:** show a "Not connected" state with a "Connect Signer" button that opens the modal.
- **After connection:** show connection method (NIP-07 or NIP-46), truncated pubkey, active relay (NIP-46 only), and a summary of recent signer requests.

The compact signer node card should stay at a glance-readable level per D-08/D-09. Full request history and consent log belong in the Phase 29 inspector panel.

### Post-Connect Signer State Model

The demo needs a `SignerConnectionState` object that both the modal and the signer node can read:

```ts
type SignerConnectionMethod = 'nip07' | 'nip46' | 'none';

interface SignerConnectionState {
  method: SignerConnectionMethod;
  pubkey: string | null;
  relay: string | null; // only for NIP-46
  recentRequests: SignerRequestRecord[];
  isConnecting: boolean;
  error: string | null;
}

interface SignerRequestRecord {
  timestamp: number;
  method: string;       // 'signEvent', 'getPublicKey', etc.
  kind?: number;        // for signEvent
  success: boolean;
}
```

This state can live in a simple `signer-connection.ts` module and be updated:

- when the user connects via NIP-07 or NIP-46
- when a signer request event flows through the message tap (kind 29001 signer-request path)
- when the user disconnects from the topology node

### Integration with Existing Demo Wire

`createDemoHooks()` in `shell-host.ts` currently calls `createSignerHooks()` which wraps the mock. Phase 31 should:

1. Replace `createSignerHooks()` with a module-level `SignerConnection` object that can be updated at runtime.
2. Pass `signerConnection.getSigner()` into `createSignerService(...)` so the service always uses the live signer.
3. Export a `connectNip07()` and `connectNip46(options)` API from `shell-host.ts` or a dedicated `signer-connection.ts` module.
4. Expose a `disconnect()` that resets the active signer to `null` and updates signer node state.

Because the signer service calls `getSigner()` per-request, swapping from mock to real to disconnected requires no restart of the runtime — only the signer ref changes.

### Remaining Demo Signer Mock Role

The mock signer in `signer-demo.ts` should NOT continue to act as a silent primary path. However, the demo should also not fail to render when no signer is connected. The correct behavior:

- Boot without a signer — `getSigner()` returns `null`.
- Signer service responds with `error: no signer configured` for any request before connection.
- The signer node in the topology clearly shows "Not connected".
- This is the desired behavior: the user can see the signer node is idle and knows to connect.

### Artifact Split

Three plan waves:

1. **NIP-07 connect flow and signer state model**
   - Introduce `SignerConnectionState`, the mutable signer ref, and `connectNip07()`.
   - Wire the signer node card to reflect connected/disconnected state.
   - Replace the mock signer as the hidden primary path.

2. **NIP-46 client and connect modal**
   - Implement the minimal NIP-46 WebSocket client.
   - Build the connect modal with NIP-07 and NIP-46 side by side.
   - Wire `connectNip46()` and the editable relay field.
   - Generate and display the nostrconnect QR code.

3. **Signer node activity feed and post-connect UX**
   - Surface recent signer requests in the signer node compact summary.
   - Wire signer activity from the message tap to the `SignerConnectionState.recentRequests` list.
   - Ensure the inspector panel (from Phase 29) can show full signer request history.
   - Verify the NIP-07 and NIP-46 paths end-to-end.

## Validation Architecture

### Dimension 1: Functional Correctness
- NIP-07 connect flow detects `window.nostr`, retrieves pubkey, and makes the signer available to the signer service.
- NIP-46 client connects to the specified relay, performs the handshake, and signs events through the bunker.
- Signer node shows correct state (method, pubkey, relay) after successful connection.
- Signer requests made by napplets flow through the connected signer and produce correct responses.

### Dimension 2: Integration
- `getSigner()` in demo hooks returns the live NIP-46 or NIP-07 signer after connection, `null` before.
- The signer service and runtime continue to work without changes — only the signer ref changes.
- The connect modal and signer node both read from the same `SignerConnectionState`.
- Tapped signer-request messages (kind 29001) update the `recentRequests` list for signer node display.

### Dimension 3: Edge Cases
- NIP-07 not available: NIP-07 option shows "no extension detected".
- NIP-46 relay unreachable: connect attempt times out with a clear error message.
- Signer disconnected mid-session: signer service returns "no signer configured" error; signer node reverts to "Not connected".
- Bunker rejects a request: error is surfaced in the activity feed.

### Dimension 4: Performance
- NIP-46 WebSocket connection is opened on demand, not at boot.
- QR code generation is synchronous and adds no perceptible boot cost.
- Activity feed is bounded (e.g., last 20 requests) to avoid growing the DOM unboundedly.

### Dimension 5: Regression
- Existing signer delegation e2e tests in `tests/e2e/signer-delegation.spec.ts` must remain green.
- The signer node renders correctly with no signer connected (boot state).
- Connecting NIP-07 (testable with a mock `window.nostr` in unit tests) updates signer node correctly.
- `pnpm --filter @napplet/demo build` stays green.

### Dimension 6: Security
- The NIP-46 client does not expose the local ephemeral private key outside its module.
- NIP-46 relay editing is confined to the connect modal — not exposed in the topology node or inspector.
- NIP-04 encryption/decryption uses nostr-tools `nip04` utilities, not hand-rolled crypto.

### Dimension 7: Developer Experience
- The signer connection state is encapsulated in its own module.
- Swapping from mock to NIP-07 to NIP-46 requires only a call to `connectNip07()` or `connectNip46(opts)`.
- The connect modal is self-contained and can be opened from any surface without tight coupling to the topology.

### Dimension 8: Observability
- The signer node shows method, pubkey, and last N requests at a glance.
- The message tap continues to record all kind 29001 signer-request traffic.
- The connect flow logs to the demo debugger: "signer connected via NIP-07: <pubkey>".

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| NIP-46 WebSocket implementation diverges from spec | Medium | High | Test against a real bunker (nsec.app) during development; keep client minimal and spec-referenced |
| Demo signer mock silently remains as fallback after Phase 31 | Medium | High | Remove the `createSignerHooks()` import from shell-host and explicitly boot with `null` signer |
| QR code library adds unwanted bundle weight | Low | Medium | Use a zero-dependency QR encoder or add only as a dev/demo dependency |
| NIP-46 relay wiring grows complex and bleeds into Phase 29 topology | Medium | Medium | Keep NIP-46 relay URL as a string in `SignerConnectionState`; relay editing is modal-only |
| Inspector drill-down from Phase 29 not yet available | Low | Low | Signer node shows summary; inspector integration is additive in Phase 29's own wave |

## Build Order

1. **Wave 1 (Plan 01):** Signer connection state model, NIP-07 connect path, signer node UX
2. **Wave 2 (Plan 02):** NIP-46 minimal client, connect modal with dual-pane NIP-07 + NIP-46, QR support
3. **Wave 3 (Plan 03):** Signer activity feed, inspector integration, end-to-end verification

## RESEARCH COMPLETE

---

*Research: 2026-04-01*
*Phase: 31-signer-connection-ux*
