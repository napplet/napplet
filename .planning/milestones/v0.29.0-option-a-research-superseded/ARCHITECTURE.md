# Architecture Research — v0.29.0 Receive-Side Decrypt Surface

**Domain:** NUB-amendment milestone (adding `relay.subscribeEncrypted` to NUB-RELAY)
**Researched:** 2026-04-23
**Confidence:** HIGH (direct in-repo evidence; send-side precedent unambiguous; central shim/sdk pattern locked in v0.28.0 Phase 128/129)

## 1. Architectural Summary

v0.29.0 is a **direct mirror** of the v0.24.0 `relay.publishEncrypted` send-side addition, applied to the receive side. All new code lands inside the existing `@napplet/nub/relay` subpath (types + shim + sdk + barrel), and the central `@napplet/shim` / `@napplet/sdk` hosts pick it up via the same 4-surgical-edit pattern that `RelayPublishEncryptedMessage` / `publishEncrypted()` followed.

**There is exactly one architectural novelty:** the receive surface is a **streaming** surface (like `subscribe()`) rather than a request/response surface (like `publish()`). That means six new message shapes, not two — napplet→shell request + napplet→shell close + four shell→napplet lifecycle messages (`.event`, `.eose`, `.closed`, `.error`). The `relay.subscribeEncrypted.event` payload carries the **unwrapped rumor plus sender pubkey** — never ciphertext, never the signer surface.

**Integration footprint (minimum viable):**

| Layer | Files | Type | Edit count |
|-------|-------|------|------------|
| NUB package types | `packages/nub/src/relay/types.ts` | modify | 6 new interfaces + 2 union additions |
| NUB package shim | `packages/nub/src/relay/shim.ts` | modify | 1 new exported function (`subscribeEncrypted`) |
| NUB package sdk | `packages/nub/src/relay/sdk.ts` | modify | 1 new exported function (`relaySubscribeEncrypted`) |
| NUB package barrel | `packages/nub/src/relay/index.ts` | modify | 6 type re-exports + 2 value re-exports |
| Core types | `packages/core/src/types.ts` | modify | 1 new method signature on `NappletGlobal.relay` |
| Central shim | `packages/shim/src/index.ts` | modify | 2 edits (import + mount) |
| Central sdk | `packages/sdk/src/index.ts` | modify | 4 edits (type re-exports + namespace method + sdk helper re-export + namespace method wrapping) |
| In-repo spec | `specs/NIP-5D.md` | modify | 1 new Security Considerations subsection |
| Cross-repo spec | `~/Develop/nubs/NUB-RELAY.md` on new `nub-relay-subscribe-encrypted` branch | modify | 1 message-catalog section + 1 conformance-table update + 1 security-considerations paragraph + **1 policy-resolution decision** (see §7) |

## 2. System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        NAPPLET IFRAME (sandboxed)                            │
│                                                                              │
│  napplet code                                                                │
│    │                                                                         │
│    ▼                                                                         │
│  window.napplet.relay.subscribeEncrypted(filters, opts, onEvent, onEose)     │
│    │          (NEW — mounted by @napplet/shim from @napplet/nub/relay/shim)  │
│    ▼                                                                         │
│  @napplet/nub/relay/shim.ts :: subscribeEncrypted()                          │
│    │  · generates subId                                                      │
│    │  · installs message listener (filters by subId + type prefix)           │
│    │  · posts RelaySubscribeEncryptedMessage envelope                        │
│    │  · returns { close() } teardown                                         │
└────┼─────────────────────────────────────────────────────────────────────────┘
     │
     │ postMessage({ type: 'relay.subscribeEncrypted', id, subId, filters,
     │              encryption?, unwrap? })
     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SHELL (trusted, downstream repo)                     │
│  [not implemented in this milestone — contract only]                         │
│                                                                              │
│  · opens underlying relay subscription with filters                          │
│  · on each matching event:                                                   │
│      - invokes user signer (NIP-07 / NIP-46) to unwrap (NIP-17/NIP-59)       │
│      - validates outer wrap signature                                        │
│      - dispatches { type: 'relay.subscribeEncrypted.event', subId,           │
│                     rumor, sender } back to napplet                          │
│  · on relay EOSE: { type: 'relay.subscribeEncrypted.eose', subId }           │
│  · on close/error: .closed / .error lifecycle messages                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key points:**
- New wire surface lives entirely in the `relay.` domain namespace per NIP-5D (§"Wire Format").
- Napplet-side code runs unchanged through the existing shim/sdk plumbing — no new NubDomain value, no new `shell.supports()` capability branch (see §7 for rationale).
- Shell implementation is **out of scope** for this milestone and lives in the downstream shell repo (precedent: v0.28.0 DEMO-01 delegation).

## 3. Integration Points — File by File

### 3.1 `packages/nub/src/relay/types.ts` — Types (PRIMARY SURFACE)

**Insertion point:** Between the existing `RelayPublishEncryptedResultMessage` block (ends line 174) and the `// ─── Shell -> Napplet Messages ──` section header (line 176) for the request+close messages; between `RelayClosedMessage` (ends line 226) and `RelayPublishResultMessage` (line 232) for the lifecycle messages. Logical grouping: mirror the `relay.publishEncrypted` pair — keep request+result together on the "napplet -> shell" side, and lifecycle deliveries on the "shell -> napplet" side.

**Six new interfaces (exact shapes):**

```ts
// ─── Napplet -> Shell ──────────────────────────────────────────────────────

/**
 * Open an encrypted subscription. The shell opens the underlying relay
 * subscription, unwraps each matching event using the user's signer, validates
 * the outer wrap signature, and delivers the plaintext rumor to the napplet.
 * Napplets never see ciphertext and never gain access to the signer.
 *
 * Mirrors {@link RelaySubscribeMessage} shape + {@link RelayPublishEncryptedMessage}
 * crypto-parameter shape.
 */
export interface RelaySubscribeEncryptedMessage extends RelayMessage {
  type: 'relay.subscribeEncrypted';
  /** Correlation ID for the initial request (distinct from subId lifecycle). */
  id: string;
  /** Subscription ID for the encrypted-event stream lifecycle. */
  subId: string;
  /** NIP-01 filters — typically `{ kinds: [1059], '#p': [userPubkey] }` for NIP-17. */
  filters: NostrFilter[];
  /** Encryption scheme the shell should expect. Defaults to 'nip44'. */
  encryption?: 'nip44' | 'nip04';
  /** Unwrap strategy. 'gift-wrap' = NIP-17/NIP-59 two-step; 'direct' = single-hop NIP-44. Defaults to 'gift-wrap'. */
  unwrap?: 'gift-wrap' | 'direct';
  /** Optional: target a specific relay URL (mirrors RelaySubscribeMessage.relay). */
  relay?: string;
}

/**
 * Close an active encrypted subscription. Separate from {@link RelayCloseMessage}
 * so the shell's routing can cleanly distinguish plaintext and encrypted streams
 * (each may carry different book-keeping: decrypt error counters, signer prompt
 * throttling, etc.). See §1 of the tradeoff table below for rationale.
 */
export interface RelayCloseSubscribeEncryptedMessage extends RelayMessage {
  type: 'relay.subscribeEncrypted.close';
  id: string;
  subId: string;
}

// ─── Shell -> Napplet ──────────────────────────────────────────────────────

/**
 * A decrypted rumor delivered to an active encrypted subscription.
 * Payload is the **inner plaintext event** (the "rumor" per NIP-59 terminology),
 * plus the **sender pubkey** extracted from the outer seal. Napplet never sees
 * the outer wrap or ciphertext.
 */
export interface RelaySubscribeEncryptedEventMessage extends RelayMessage {
  type: 'relay.subscribeEncrypted.event';
  subId: string;
  /** The unwrapped inner event (rumor). Shape matches NostrEvent but MAY be unsigned per NIP-59. */
  rumor: NostrEvent;
  /** Hex-encoded pubkey of the original sender (from seal signature). Shell MUST validate wrap signature before populating. */
  sender: string;
}

/** End-of-stored-events for an encrypted subscription. */
export interface RelaySubscribeEncryptedEoseMessage extends RelayMessage {
  type: 'relay.subscribeEncrypted.eose';
  subId: string;
}

/** Encrypted subscription closed by shell or upstream relay. */
export interface RelaySubscribeEncryptedClosedMessage extends RelayMessage {
  type: 'relay.subscribeEncrypted.closed';
  subId: string;
  reason?: string;
}

/**
 * Per-event unwrap/signer/consent error. Distinct from `.closed` — the
 * subscription remains alive; the shell just couldn't unwrap THIS event.
 * Examples: user declined signer prompt, wrap signature invalid, ciphertext
 * malformed, encryption scheme mismatch, signer-unavailable.
 */
export interface RelaySubscribeEncryptedErrorMessage extends RelayMessage {
  type: 'relay.subscribeEncrypted.error';
  subId: string;
  /** Short machine-readable code — see NUB-RELAY amendment for canonical vocabulary. */
  code: 'signer-denied' | 'signer-unavailable' | 'wrap-invalid' | 'decrypt-failed' | 'scheme-mismatch' | 'rate-limited';
  /** Human-readable reason for debugging. */
  error?: string;
  /** Optional: outer wrap event id that failed, for napplet-side dedup. */
  eventId?: string;
}
```

**Discriminated-union updates (lines 261-279):**

```ts
export type RelayOutboundMessage =
  | RelaySubscribeMessage
  | RelayCloseMessage
  | RelayPublishMessage
  | RelayPublishEncryptedMessage
  | RelaySubscribeEncryptedMessage        // ← NEW
  | RelayCloseSubscribeEncryptedMessage   // ← NEW
  | RelayQueryMessage;

export type RelayInboundMessage =
  | RelayEventMessage
  | RelayEoseMessage
  | RelayClosedMessage
  | RelayPublishResultMessage
  | RelayPublishEncryptedResultMessage
  | RelaySubscribeEncryptedEventMessage   // ← NEW
  | RelaySubscribeEncryptedEoseMessage    // ← NEW
  | RelaySubscribeEncryptedClosedMessage  // ← NEW
  | RelaySubscribeEncryptedErrorMessage   // ← NEW
  | RelayQueryResultMessage;
```

(The `RelayNubMessage` master union automatically picks up both additions via the `RelayOutboundMessage | RelayInboundMessage` composition.)

### 3.2 `packages/nub/src/relay/shim.ts` — Runtime (MIRRORS `subscribe()`)

**New exported function** alongside the existing `subscribe` / `publish` / `publishEncrypted` / `query`. Insertion point: immediately after `subscribe()` closes (line 103) and before `publish()` begins (line 127), so the two subscription-class APIs sit adjacent for readability.

**Exact signature** (mirrors `subscribe` param ordering; options object carries encryption parameters):

```ts
export function subscribeEncrypted(
  filters: NostrFilter | NostrFilter[],
  onEvent: (rumor: NostrEvent, sender: string) => void,
  onEose: () => void,
  options?: {
    encryption?: 'nip44' | 'nip04';
    unwrap?: 'gift-wrap' | 'direct';
    relay?: string;
    onError?: (err: { code: string; error?: string; eventId?: string }) => void;
  },
): Subscription {
  const normalizedFilters = Array.isArray(filters) ? filters : [filters];
  const subId = crypto.randomUUID();

  function handleMessage(msgEvent: MessageEvent): void {
    if (msgEvent.source !== window.parent) return;
    const msg = msgEvent.data;
    if (typeof msg !== 'object' || msg === null || typeof msg.type !== 'string') return;
    if (!msg.type.startsWith('relay.subscribeEncrypted.')) return;
    if (!('subId' in msg) || (msg as { subId: string }).subId !== subId) return;

    if (msg.type === 'relay.subscribeEncrypted.event') {
      const m = msg as RelaySubscribeEncryptedEventMessage;
      onEvent(m.rumor, m.sender);
    } else if (msg.type === 'relay.subscribeEncrypted.eose') {
      onEose();
    } else if (msg.type === 'relay.subscribeEncrypted.closed') {
      window.removeEventListener('message', handleMessage);
    } else if (msg.type === 'relay.subscribeEncrypted.error') {
      const m = msg as RelaySubscribeEncryptedErrorMessage;
      options?.onError?.({ code: m.code, error: m.error, eventId: m.eventId });
    }
  }

  window.addEventListener('message', handleMessage);

  const openMsg: RelaySubscribeEncryptedMessage = {
    type: 'relay.subscribeEncrypted',
    id: crypto.randomUUID(),
    subId,
    filters: normalizedFilters,
    ...(options?.encryption ? { encryption: options.encryption } : {}),
    ...(options?.unwrap ? { unwrap: options.unwrap } : {}),
    ...(options?.relay ? { relay: options.relay } : {}),
  };
  window.parent.postMessage(openMsg, '*');

  return {
    close(): void {
      const closeMsg: RelayCloseSubscribeEncryptedMessage = {
        type: 'relay.subscribeEncrypted.close',
        id: crypto.randomUUID(),
        subId,
      };
      window.parent.postMessage(closeMsg, '*');
      window.removeEventListener('message', handleMessage);
    },
  };
}
```

**Reuse vs new registry:** No separate subscription registry is needed. Like `subscribe()`, the shim uses closure-scoped `subId` + per-subscription message listener. Each `subscribeEncrypted()` call manages its own listener lifecycle; `installRelayShim()` cleanup stays a no-op.

**Required imports to add to top of file:**

```ts
import type {
  // …existing imports…
  RelaySubscribeEncryptedMessage,
  RelayCloseSubscribeEncryptedMessage,
  RelaySubscribeEncryptedEventMessage,
  RelaySubscribeEncryptedEoseMessage,
  RelaySubscribeEncryptedClosedMessage,
  RelaySubscribeEncryptedErrorMessage,
} from './types.js';
```

**Note — no `hydrateResourceCache` coupling.** Encrypted rumors do not (yet) carry a `resources?:` sidecar. Keep this surface clean; a future milestone can add an encrypted-sidecar variant if demand emerges. This is the "NUB scope boundary" principle — don't mix concerns until required.

### 3.3 `packages/nub/src/relay/sdk.ts` — Named-export Wrapper

**New SDK helper** mirroring the existing `relaySubscribe` shape:

```ts
/**
 * Open an encrypted NIP-17 / NIP-44 subscription through the shell. Shell
 * unwraps each incoming event with the user's signer and delivers the inner
 * rumor plus sender pubkey. Napplet never sees ciphertext and never gains
 * access to the signer.
 *
 * @param filters   NIP-01 filters (typically `{ kinds: [1059], '#p': [pubkey] }` for NIP-17 DMs)
 * @param onEvent   Called with (rumor, sender) for each decrypted event
 * @param onEose    Called when the shell signals end of stored events
 * @param options   Optional: `{ encryption, unwrap, relay, onError }`
 * @returns Subscription handle with `close()`
 */
export function relaySubscribeEncrypted(
  filters: NostrFilter | NostrFilter[],
  onEvent: (rumor: NostrEvent, sender: string) => void,
  onEose: () => void,
  options?: {
    encryption?: 'nip44' | 'nip04';
    unwrap?: 'gift-wrap' | 'direct';
    relay?: string;
    onError?: (err: { code: string; error?: string; eventId?: string }) => void;
  },
): Subscription {
  const w = window as Window & { napplet?: NappletGlobal };
  if (!w.napplet?.relay?.subscribeEncrypted) {
    throw new Error('window.napplet.relay.subscribeEncrypted not installed -- import @napplet/shim first');
  }
  return w.napplet.relay.subscribeEncrypted(filters, onEvent, onEose, options);
}
```

Runtime guard follows the exact shape of `relayPublishEncrypted` (sdk.ts:121-125) — accesses the deep `publishEncrypted` property and throws a helpful error if not installed, rather than using the simple `requireRelay()` helper. This protects against a future partial installation where the base `relay` namespace exists but the encrypted methods don't (e.g., old shim, new sdk).

### 3.4 `packages/nub/src/relay/index.ts` — Barrel Exports

Two additions (type block + shim exports), following the existing pattern at lines 20-44:

```ts
// Type Exports — add to the list at line 20-36:
export type {
  // …existing 14 types…
  RelaySubscribeEncryptedMessage,           // NEW
  RelayCloseSubscribeEncryptedMessage,      // NEW
  RelaySubscribeEncryptedEventMessage,      // NEW
  RelaySubscribeEncryptedEoseMessage,       // NEW
  RelaySubscribeEncryptedClosedMessage,     // NEW
  RelaySubscribeEncryptedErrorMessage,      // NEW
} from './types.js';

// Shim Exports — line 40:
export { installRelayShim, subscribe, publish, publishEncrypted, subscribeEncrypted, query } from './shim.js';
//                                                               ↑ NEW

// SDK Exports — line 44:
export { relaySubscribe, relayPublish, relayPublishEncrypted, relaySubscribeEncrypted, relayQuery } from './sdk.js';
//                                                            ↑ NEW
```

### 3.5 `packages/core/src/types.ts` — `NappletGlobal.relay` Type Extension

**Critical change** (often missed — downstream consumers see `window.napplet.relay.subscribeEncrypted` as `any` if this is skipped). Insert between `publishEncrypted` (line 136) and `query` (line 142):

```ts
/**
 * Open an encrypted-subscription stream. Shell unwraps NIP-17/NIP-59 gift-wrapped
 * or direct NIP-44 events and delivers plaintext rumors. Napplet never sees
 * ciphertext and never gains signer access.
 *
 * @param filters   NIP-01 filters
 * @param onEvent   Called with (rumor, sender) per decrypted event
 * @param onEose    Called at end-of-stored-events
 * @param options   Optional: `{ encryption, unwrap, relay, onError }`
 * @returns Subscription handle
 */
subscribeEncrypted(
  filters: NostrFilter | NostrFilter[],
  onEvent: (rumor: NostrEvent, sender: string) => void,
  onEose: () => void,
  options?: {
    encryption?: 'nip44' | 'nip04';
    unwrap?: 'gift-wrap' | 'direct';
    relay?: string;
    onError?: (err: { code: string; error?: string; eventId?: string }) => void;
  },
): Subscription;
```

### 3.6 `packages/shim/src/index.ts` — Central Shim Integration (2 surgical edits)

Matches the v0.28.0 Phase 128 pattern. Central shim is a thin host; domain logic stays in NUB package.

**Edit 1 — extend import block** (line 24):

```ts
import { subscribe, publish, publishEncrypted, subscribeEncrypted, query } from '@napplet/nub/relay/shim';
//                                            ↑ NEW
```

**Edit 2 — extend global mount** (lines 131-136):

```ts
relay: {
  subscribe,
  publish,
  publishEncrypted,
  subscribeEncrypted,   // ← NEW
  query,
},
```

**No new `handleEnvelopeMessage` branch required.** The relay shim does NOT route through the central envelope handler — each `subscribeEncrypted()` call installs its own per-subscription message listener (just like `subscribe()`). This is the existing pattern and it works cleanly for streaming subscriptions.

**No new install call required.** `installRelayShim()` remains a no-op and is already… well, it's never actually called in the current central shim (relay is unique — it relies only on per-call listeners). So the central shim has zero init-sequence changes.

### 3.7 `packages/sdk/src/index.ts` — Central SDK Integration (4 surgical edits)

Matches the v0.28.0 Phase 129 pattern (surgical re-exports + namespace method wrapping).

**Edit 1 — extend `relay` namespace** (lines 78-132, around `publishEncrypted` at line 116):

```ts
publishEncrypted(template, recipient, encryption = 'nip44'): Promise<NostrEvent> { … },

/** NEW */
subscribeEncrypted(
  filters: NostrFilter | NostrFilter[],
  onEvent: (rumor: NostrEvent, sender: string) => void,
  onEose: () => void,
  options?: { encryption?: 'nip44' | 'nip04'; unwrap?: 'gift-wrap' | 'direct'; relay?: string; onError?: (err: { code: string; error?: string; eventId?: string }) => void },
): Subscription {
  return requireNapplet().relay.subscribeEncrypted(filters, onEvent, onEose, options);
},
```

**Edit 2 — extend Relay NUB type re-exports** (lines 796-812):

```ts
export type {
  // …existing 14 types…
  RelaySubscribeEncryptedMessage,
  RelayCloseSubscribeEncryptedMessage,
  RelaySubscribeEncryptedEventMessage,
  RelaySubscribeEncryptedEoseMessage,
  RelaySubscribeEncryptedClosedMessage,
  RelaySubscribeEncryptedErrorMessage,
} from '@napplet/nub/relay';
```

**Edit 3 — extend NUB SDK Helper re-exports** (line 1024):

```ts
export { relaySubscribe, relayPublish, relayPublishEncrypted, relaySubscribeEncrypted, relayQuery } from '@napplet/nub/relay';
//                                                            ↑ NEW
```

**Edit 4 — none required for installer re-exports.** `installRelayShim` already re-exported at line 1011 — unchanged.

### 3.8 `specs/NIP-5D.md` — In-Repo Spec Amendment

**Insertion point:** Add a new subsection under `## Security Considerations` (line 102), ideally between the existing "Browser-Enforced Resource Isolation" subsection (line 115) and the `**Non-Guarantees:**` line (line 132). Logical grouping: both subsections describe browser/extension-level holes that napplet isolation relies on but cannot enforce alone.

**Subsection title:** `### NIP-07 Extension All-Frames Content-Script Leak`

**Content shape (~2-3 paragraphs):**
1. State the leak: NIP-07 browser extensions ship content-scripts with `"all_frames": true`, so `window.nostr` is injected into sandboxed napplet iframes despite the sandbox + CSP posture. This defeats the NIP-5D § Transport prohibition "Shells MUST NOT provide `window.nostr`" **as seen by the napplet**, because the browser injects it below the shell's visibility.
2. Name it as a **known non-mitigation** of strict CSP and `allow-scripts`-only sandbox. The `perm:strict-csp` posture from v0.28.0 raises the exfiltration bar but does not block content-script injection.
3. Point to the spec-legal receive path: `relay.subscribeEncrypted` (see NUB-RELAY amendment) and the already-shipped send path `relay.publishEncrypted`. Napplets using these surfaces avoid touching `window.nostr` at all.
4. **Recommendation (SHOULD-level, not MUST):** Shells that enforce strict-CSP MAY additionally advise users to disable NIP-07 extensions while interacting with napplet iframes, but enforcement lives in the browser/extension ecosystem and is outside this spec's reach.

### 3.9 Cross-repo `~/Develop/nubs/NUB-RELAY.md` — Amendment PR

**Branch:** `nub-relay-subscribe-encrypted` (new, branched from `nub-relay` or from `master` once `nub-relay` merges — decide based on current merge state; see Build Order §8).

**Four edits to NUB-RELAY.md** (existing spec on `nub-relay` branch, 242 lines):

1. **Message catalog** (lines ~62-74 of existing spec): Add 6 new rows to the type table.
2. **Examples block** (lines ~81-115 in existing spec): Add a "Subscribe encrypted" example mirroring the existing "Publish encrypted" example.
3. **Shell Behavior section** (lines 217-230 of existing spec): Add 4-5 new MUST/SHOULD clauses:
   - MUST unwrap each matching event using the user's signer before delivery
   - MUST validate outer wrap signature before populating `sender` field
   - MUST deliver only the inner rumor (never ciphertext, never outer wrap)
   - SHOULD deduplicate wrap event ids to avoid double-prompting the signer
   - MAY rate-limit signer prompts per napplet per session
4. **Security Considerations section** (lines 232-242): Add paragraph on signer never being exposed; rumor provenance validation; rate-limiting as DoS mitigation; interaction with the NIP-07 `all_frames` leak described in NIP-5D.
5. **POLICY RESOLUTION** (this is the material decision — see §7 below): The existing `nub-relay` branch already contains a MUST that "the shell MUST decrypt incoming encrypted events (NIP-04/NIP-44) before delivering them to the napplet via `relay.event`" (line 223). This contract is **ambient/implicit** — it says decrypt magically happens without a typed opt-in. The amendment MUST choose one of:
   - **(A) Replace** — delete the ambient clause; encrypted receive ONLY through `relay.subscribeEncrypted`. Clean, explicit, but removes a capability from `relay.subscribe`.
   - **(B) Downgrade to MAY + recommend subscribeEncrypted** — "the shell MAY decrypt incoming encrypted events delivered via `relay.event`; however shells and napplets SHOULD prefer `relay.subscribeEncrypted` because its typed surface signals intent, enables per-event error handling, and supports NIP-17 gift-wrap unwrap".
   - **(C) Keep both as peers** — `relay.subscribe` auto-decrypts if the shell chooses; `relay.subscribeEncrypted` is the explicit path.

   **Recommendation:** **(B) Downgrade**. (A) is a clean break but unnecessarily aggressive since the ambient path is a draft-only contract that no shell has implemented yet. (C) leaves two paths with identical semantics — confusion tax. (B) lets existing shells (when they exist) keep simple auto-decrypt for NIP-04 legacy flows while giving napplets the typed surface they need.

**README.md changes on nubs repo:** likely none — the spec registry table probably already lists NUB-RELAY; no new NUB is being added.

## 4. Integration Points — What Does NOT Change

The following files are **unchanged**, verified against the mapped code:

- `packages/nub/src/relay/types.ts` `DOMAIN` constant (line 18) — still `'relay'`.
- `packages/core/src/envelope.ts` `NubDomain` union — no new domain.
- `packages/core/src/dispatch.ts` — no new dispatch entry (`relay` already registered).
- `packages/nub/src/relay/index.ts` `registerNub(DOMAIN, …)` call (line 56) — unchanged; the no-op placeholder handler is fine.
- Central `@napplet/shim` `handleEnvelopeMessage` routing (lines 72-121) — no new `relay.*` branch; relay uses per-call listeners, not central routing.
- No new `install*Shim()` call in central shim init sequence.
- `shell.supports()` capability vocabulary in NIP-5D (§ Runtime Capability Query) — no new capability string (see §7).
- All 9 other NUB packages — completely untouched.
- `@napplet/vite-plugin` — completely untouched (no manifest-tag changes; no new build-time emission).

## 5. Wire-Level Data Flow

### 5.1 Open subscription + receive rumor

```
napplet                               shell
  │                                     │
  │  { type: 'relay.subscribeEncrypted',│
  │    id: 'r1', subId: 's1',           │
  │    filters: [{ kinds:[1059],        │
  │                '#p':[userPk] }],    │
  │    encryption: 'nip44',             │
  │    unwrap: 'gift-wrap' }            │
  ├────────────────────────────────────►│
  │                                     │ (opens underlying relay sub
  │                                     │  with filters internally)
  │                                     │
  │                                     │ ← wrap event arrives
  │                                     │ ← shell asks signer to unwrap
  │                                     │ ← shell validates wrap sig
  │                                     │
  │ { type: 'relay.subscribeEncrypted   │
  │        .event',                     │
  │   subId: 's1',                      │
  │   rumor: { /* plaintext */ },       │
  │   sender: '<hex pubkey>' }          │
  │◄────────────────────────────────────┤
  │                                     │
  │ { type: 'relay.subscribeEncrypted   │
  │        .eose', subId: 's1' }        │
  │◄────────────────────────────────────┤
```

### 5.2 Unwrap failure (signer denied)

```
napplet                               shell
  │                                     │
  │                                     │ ← wrap event arrives
  │                                     │ ← shell asks signer
  │                                     │ ← user clicks "deny"
  │                                     │
  │ { type: 'relay.subscribeEncrypted   │
  │        .error',                     │
  │   subId: 's1',                      │
  │   code: 'signer-denied',            │
  │   eventId: '<wrap-id>' }            │
  │◄────────────────────────────────────┤
  │                                     │
  │ (subscription REMAINS OPEN —        │
  │  .error is per-event, not terminal. │
  │  Napplet's onError callback fires;  │
  │  .eose/.closed NOT emitted.)        │
```

### 5.3 Close

```
napplet                               shell
  │                                     │
  │  sub.close()                        │
  │                                     │
  │  { type: 'relay.subscribeEncrypted  │
  │         .close',                    │
  │    id: 'r2', subId: 's1' }          │
  ├────────────────────────────────────►│
  │                                     │
  │  { type: 'relay.subscribeEncrypted  │
  │         .closed', subId: 's1' }     │
  │◄────────────────────────────────────┤
  │  (shim removes local listener)      │
```

## 6. Design Tradeoffs Analysis

### 6.1 Namespaced close (`relay.subscribeEncrypted.close`) vs reusing `relay.close`

| Criterion | Namespaced close (CHOSEN) | Reuse `relay.close` |
|-----------|---------------------------|---------------------|
| Shell routing complexity | Clean — `type.startsWith('relay.subscribeEncrypted.')` one branch | Shell must dedupe subIds across two subscription types; an id collision across types would be a silent bug |
| Napplet-side shim code | Per-call listener stays scoped to encrypted stream | Per-call listener must filter by type AND subId; conflicts if same `subId` used (possible if napplet uses `crypto.randomUUID()` but possible if it chose a deterministic id) |
| Wire footprint | +1 message type | 0 new message types |
| Future extensibility | Independent error codes + lifecycle messages per subscription kind | Error-code namespace has to handle both plaintext and encrypted concerns |
| Symmetry with rest of NUB | Matches: each subscription KIND gets its own lifecycle vocabulary | Breaks symmetry: every other shell-mediated stream has dedicated close |

**Decision: namespaced close.** The +1 wire type is cheap; the shell-routing hygiene and lifecycle-independence win.

### 6.2 Separate `.error` vs merging into `.closed` with reason

| Criterion | Separate `.error` (CHOSEN) | Merge into `.closed` |
|-----------|---------------------------|----------------------|
| Semantic clarity | `.closed` = terminal, `.error` = per-event | Both are one message; napplet has to check `reason` to decide if sub is still live |
| Per-event failure handling | Napplet can show "couldn't decrypt message X" without closing UI | Napplet must guess whether sub is still alive |
| Signer-denied UX | "User denied one event" doesn't tear down the subscription | Tearing down the sub on signer deny is hostile UX |
| Multiple failures | Napplet sees N error events, sub stays alive | Shell has to either tear down on first error or invent non-terminal-close semantics |

**Decision: separate `.error`.** Per-event unwrap failures are EXPECTED for NIP-17 (users regularly decline prompts, wraps get malformed, etc.). Mixing terminal close with per-event failure is a category error.

### 6.3 `sender` in event payload vs napplet deriving from rumor

| Criterion | Include `sender` (CHOSEN) | Napplet derives from rumor |
|-----------|---------------------------|----------------------------|
| Provenance integrity | Shell-validated from outer seal signature — unforgeable | Rumor `pubkey` field is attacker-controlled (rumor is unsigned per NIP-59) |
| Napplet code complexity | None — napplet just uses `sender` | Napplet must know to IGNORE `rumor.pubkey` and look elsewhere, but NIP-59 specifies that authoritative sender IS the seal's pubkey — which napplet never sees |
| Security posture | Shell guarantees napplet can trust `sender` | Napplet could accidentally trust `rumor.pubkey` — spoofing vector |

**Decision: include `sender` explicitly.** Providing the validated sender outside the rumor shields napplet authors from the NIP-59 subtlety. The rumor's `pubkey` field is cosmetically present but should be DOCUMENTED in the NUB amendment as "informational only — trust the outer `sender` field for authentication".

## 7. Capability Negotiation — No New `shell.supports()` String

**Verdict: reuse `nub:relay`. Do NOT split.**

### Precedent (v0.28.0)

v0.28.0 introduced `perm:strict-csp` as a capability **separate** from `nub:resource` because they answer orthogonal questions:
- `nub:resource` — "do you implement the `resource.*` message catalog?"
- `perm:strict-csp` — "are you running under strict CSP posture?"

A shell could implement `resource.*` without strict-CSP (permissive dev shell), or enforce strict-CSP without implementing `resource.*` (minimal shell with local-only data). These are independent decisions, so they got independent capability strings.

### Why v0.29.0 does NOT match that shape

`relay.subscribeEncrypted` is not an orthogonal posture — it's an **additional message type** within the already-declared `relay` domain. A shell that declares `shell.supports('nub:relay')` is declaring it implements NUB-RELAY, and after this amendment the spec SAYS `subscribeEncrypted` is part of NUB-RELAY. Splitting would mean a shell could declare `nub:relay` but NOT implement half its wire surface — that's exactly the fragmentation `shell.supports()` exists to prevent.

### Counter-argument: backwards compatibility

What if an existing shell declares `nub:relay` today but hasn't implemented `subscribeEncrypted`? The answer is: that shell predates the amendment and will send no `.result` / stream messages back. The napplet's `onError` callback never fires, the `.eose` never arrives, and the sub hangs silently. This IS a worse failure mode than a capability check.

**Resolution:** document in the NUB-RELAY amendment that conformant shells MUST implement the full `relay.*` message catalog; shells that predate the amendment SHOULD be updated. If a napplet needs runtime detection before the ecosystem catches up, it can use a **timeout fallback** pattern (wait N seconds for any delivery; if nothing arrives, assume shell doesn't implement it). This is the same pattern used for any new optional NUB message type.

**If timeouts prove too brittle in practice** (future signal, not now), a narrow escape hatch would be `shell.supports('relay:subscribeEncrypted')` as a sub-capability string — but that's a future amendment, not part of v0.29.0 scope.

### Decision

Ship v0.29.0 with **no new capability string**. Document the "full relay.* surface required for NUB-RELAY conformance" expectation clearly in the amendment's Shell Behavior section.

## 8. Suggested Build Order

### Phase A — In-repo types + SDK helper (START HERE)

**Why first:** Pure additive TypeScript. Workspace `pnpm -r build` and `pnpm -r type-check` must stay green every step. Nothing downstream depends on this landing before the spec PR (spec docs don't check out the monorepo).

**Files touched (in order):**
1. `packages/nub/src/relay/types.ts` — 6 new interfaces + 2 union additions
2. `packages/core/src/types.ts` — 1 new `NappletGlobal.relay.subscribeEncrypted` signature
3. `packages/nub/src/relay/shim.ts` — `subscribeEncrypted()` function
4. `packages/nub/src/relay/sdk.ts` — `relaySubscribeEncrypted()` helper
5. `packages/nub/src/relay/index.ts` — barrel re-exports (types + value)
6. `packages/shim/src/index.ts` — 2 edits (import + mount)
7. `packages/sdk/src/index.ts` — 4 edits (namespace method + type re-exports + helper re-export)

**Verification gate:** `pnpm -r build && pnpm -r type-check` exits 0 across all 14 packages. Tree-shake smoke test: a consumer importing only `RelaySubscribeEncryptedMessage` from `@napplet/nub/relay` should bundle with zero shim code (mirrors v0.28.0 VER-07).

### Phase B — NIP-5D Security Considerations amendment (in-repo)

**Why second:** Independent change, zero code dependencies, and the spec amendment PR on the public repo (Phase C) can cross-reference the in-repo NIP-5D version. Landing Phase B first gives Phase C a stable reference.

**Files touched:** `specs/NIP-5D.md` — new `### NIP-07 Extension All-Frames Content-Script Leak` subsection under `## Security Considerations`.

**Verification gate:** Markdown structure intact; setext headings preserved; existing "Browser-Enforced Resource Isolation" subsection unaffected; cross-reference to NUB-RELAY amendment uses the public napplet/nubs URL (not a `@napplet/*` package reference).

### Phase C — Cross-repo NUB-RELAY amendment draft PR

**Why last:** Benefits from Phase A's concrete types (the spec can reference real field shapes with confidence) and Phase B's in-repo security subsection (cross-referenceable). Also: public-repo PR is the highest-stakes step — best to have the in-repo surface battle-tested first.

**Files touched:** `~/Develop/nubs/NUB-RELAY.md` on branch `nub-relay-subscribe-encrypted`.

**Critical decision within Phase C:** branch base. Current `nub-relay` branch has the full spec; it's not merged to master. Options:
- **Branch from `nub-relay`** — single spec evolves linearly; easier to diff. Risk: if `nub-relay` gets force-pushed or rebased, your amendment branch has to follow.
- **Branch from `master`** — amendment stands alone; if it lands first, `nub-relay` rebases on it. Risk: two PRs with overlapping scope on the same file.

**Recommendation:** Branch from `nub-relay`. The v0.24.0 amendment pattern established `publishEncrypted` within the existing draft, and the next amendment should layer on top, not fork.

**Verification gate:** per `feedback_no_private_refs_commits` and `feedback_no_implementations`:
- Zero `@napplet/*` mentions in PR body or NUB-RELAY.md diff
- Zero `kehto` / `hyprgate` mentions anywhere
- Zero references to the private monorepo — if the spec needs to point at a reference implementation, it MUST point at the public `specs/NIP-5D.md` or future public implementation, not the private `@napplet/shim`
- Branch base decision recorded in PR description

### Optional Phase C.5 — Parallelize B+C as single milestone phase

If phase-count pressure matters (SEED-002 suggests 2-3 phases), fold Phases B and C into one "spec-amendments" phase. The in-repo NIP-5D edit and the cross-repo NUB-RELAY draft are both pure documentation and have no code interdependencies. Two phases total, not three:

- **Phase 135 — Receive-Side Types + SDK Surface** (Phase A above)
- **Phase 136 — Receive-Side Spec Amendments** (Phase B + Phase C)

This matches the v0.24.0 phase density (Phase 108 RELAY-01..03 covered spec + types together).

### Not recommended: landing Phase A after Phase C

Landing the public spec PR before the in-repo types exposes a window where the published spec describes a surface that no implementation carries. Keeps spec honest: ship wire code first, spec second.

## 9. Explicit Out-of-Scope (Deferred)

The following are explicitly documented as **NOT part of v0.29.0**:

| Scope-out | Lives Where | Why Deferred |
|-----------|-------------|--------------|
| Shell implementation of `relay.subscribeEncrypted` unwrap loop | Downstream shell repo (tracked at `kehto#9` per issue #3; do not reference in public specs) | v0.13.0 decoupling — this monorepo ships wire + SDK only |
| Demo napplets exercising NIP-17 DMs | Downstream shell repo (precedent: v0.28.0 DEMO-01 Option B) | Demos require a full shell; shell lives downstream |
| `identity.decrypt` as lower-level per-event primitive (SEED-002 Option B) | Future NUB-IDENTITY amendment if a concrete use case emerges | Option A centralizes NIP-17/NIP-59 unwrap shell-side — one subscription vs. N decrypts is the ergonomic win; Option B stays available as a future escape hatch |
| NIP-07 extension hardening (blocking `window.nostr` at frame/extension boundary) | Browser + extension ecosystem | Spec can document the leak (Phase B) and point to the spec-legal path (`relay.subscribeEncrypted`); enforcement is not a NIP-5D concern |
| Automated e2e tests for encrypted receive path | Deferred — existing CARRIED issue (no automated e2e for REGISTER/IDENTITY either) | Shell impl lives downstream; e2e needs a real shell |
| Storage of unwrapped rumors / signer rate-limiting UX | Shell concern (per `feedback_nub_scope_boundary`) | NUBs define protocol surface + potentialities; implementation UX is a shell concern |
| `resources?:` sidecar support on encrypted events | Future milestone if demand emerges | Keep v0.29.0 surface clean; sidecar adds a cross-NUB dependency that isn't justified yet |

## 10. Risks & Anti-Patterns

### 10.1 Risk: NIP-07 leak not closed by this milestone

**Nature:** This milestone delivers the SPEC-LEGAL path for encrypted receive. It does NOT prevent a napplet from still calling `window.nostr.nip44.decrypt(…)` directly if the user has a NIP-07 extension installed. The extension injection is orthogonal to the shell's postMessage discipline.

**Mitigation in scope:** NIP-5D Security Considerations amendment NAMES the leak (Phase B) so implementers understand the gap. Beyond that, mitigation is browser/extension ecosystem work (out of scope).

**Document:** `.planning/research/PITFALLS.md` should capture this as the primary "milestone outcome boundary" gotcha — the amendment provides the path but cannot force napplets to take it.

### 10.2 Anti-Pattern: Collapsing `.error` into `.closed`

**What it looks like:** "Simpler to have one message; use a `code` field on `.closed` to distinguish terminal vs recoverable."

**Why wrong:** Per-event signer denial is EXPECTED UX (users decline prompts all the time). Treating every denial as a subscription close forces napplets to re-subscribe constantly — thrashing the signer and the user. See §6.2.

### 10.3 Anti-Pattern: Skipping the `NappletGlobal.relay` core-types update

**What it looks like:** "The shim adds `subscribeEncrypted`; consumers will see it at runtime."

**Why wrong:** Without `packages/core/src/types.ts` updated, `window.napplet.relay.subscribeEncrypted` is typed as `any` (or errors outright under `verbatimModuleSyntax`). Downstream consumers using the SDK get no autocomplete, no param hints, no return-type safety. Always update core alongside shim/sdk (§3.5 in this doc).

### 10.4 Anti-Pattern: Private-repo references in the public PR

**What it looks like:** "See `@napplet/nub/relay/shim.ts` for the reference implementation."

**Why wrong:** `napplet/nubs` is PUBLIC; `@napplet/*` packages are PRIVATE. Per `feedback_no_private_refs_commits` and `feedback_no_implementations`, the public spec cannot reference private implementations. Phase C verification gate enforces this with grep.

### 10.5 Risk: "Shell auto-decrypt" ambiguity on existing `relay.subscribe`

**Nature:** Current NUB-RELAY draft contains MUST "shell decrypts incoming encrypted events before delivering via `relay.event`" — ambient, no typed surface. After this amendment, the two paths would coexist unless the amendment addresses it.

**Resolution:** Amendment picks policy-resolution option **(B) Downgrade to MAY + recommend subscribeEncrypted** — see §3.9 item 5.

## 11. Integration Verification Checklist

For the roadmap's per-phase completion gates:

### Phase A (Types + SDK)

- [ ] `pnpm -r build` exits 0 across 14 packages
- [ ] `pnpm -r type-check` exits 0 across 14 packages
- [ ] `window.napplet.relay.subscribeEncrypted` has full autocomplete in a consumer TypeScript project
- [ ] SDK named export `relaySubscribeEncrypted` importable from `@napplet/sdk`
- [ ] Subpath import `RelaySubscribeEncryptedMessage` importable from `@napplet/nub/relay`
- [ ] Tree-shake smoke: a consumer importing only `RelaySubscribeEncryptedMessage` bundles < 100 bytes (mirrors v0.28.0 VER-07)
- [ ] `grep -r 'relay.subscribeEncrypted' packages/nub/src/relay/ packages/core/src/ packages/shim/src/ packages/sdk/src/` shows expected usage sites and no stragglers

### Phase B (NIP-5D amendment)

- [ ] `### NIP-07 Extension All-Frames Content-Script Leak` subsection appears under `## Security Considerations`
- [ ] Cross-reference to NUB-RELAY amendment uses public `napplet/nubs` URL (not `@napplet/*`)
- [ ] Existing `### Browser-Enforced Resource Isolation` subsection byte-identical
- [ ] Markdown linter (if any in repo) passes

### Phase C (cross-repo NUB-RELAY amendment)

- [ ] 6 new wire types in message catalog
- [ ] At least one "Subscribe encrypted" wire example
- [ ] Shell Behavior section extended with unwrap + validate + dedup + rate-limit clauses
- [ ] Security Considerations extended with signer-never-exposed + rumor provenance
- [ ] Policy resolution (Option B downgrade) applied to existing ambient-decrypt clause
- [ ] PR body + diff: zero `@napplet/*` mentions (`rg -n '@napplet/' ~/Develop/nubs/NUB-RELAY.md` returns empty)
- [ ] PR body + diff: zero `kehto` / `hyprgate` mentions
- [ ] Branch base documented in PR description
- [ ] Issue napplet/napplet#3 links to the PR once opened

## 12. Sources

- In-repo: `packages/nub/src/relay/types.ts:137-174` — `RelayPublishEncryptedMessage` precedent (HIGH confidence, directly verified)
- In-repo: `packages/nub/src/relay/shim.ts:45-103` — `subscribe()` streaming-subscription pattern (HIGH confidence, directly verified)
- In-repo: `packages/nub/src/relay/shim.ts:183-219` — `publishEncrypted()` request-response pattern (HIGH confidence, directly verified)
- In-repo: `packages/nub/src/relay/sdk.ts:116-126` — `relayPublishEncrypted()` deep-property runtime guard pattern (HIGH confidence, directly verified)
- In-repo: `packages/core/src/types.ts:106-143` — `NappletGlobal.relay` interface shape (HIGH confidence, directly verified)
- In-repo: `packages/shim/src/index.ts:24,131-136` — central shim 4-edit integration pattern (HIGH confidence, directly verified)
- In-repo: `packages/sdk/src/index.ts:78-132,796-812,1024` — central sdk 4-edit integration pattern (HIGH confidence, directly verified)
- In-repo: `specs/NIP-5D.md:102-132` — Security Considerations section shape (HIGH confidence, directly verified)
- In-repo: `.planning/seeds/SEED-002-receive-side-decrypt-surface.md` — milestone direction (HIGH confidence, locked 2026-04-23)
- In-repo: `.planning/STATE.md` — decisions carried from SEED-002 (HIGH confidence)
- In-repo: `.planning/PROJECT.md:265-274` — v0.28.0 integration-pattern precedent (Phase 128-129) (HIGH confidence)
- Cross-repo: `~/Develop/nubs/` on `nub-relay` branch — existing NUB-RELAY draft including current "shell MUST auto-decrypt" ambient clause at line 223 (HIGH confidence, directly read via git show)
- Memory: `feedback_no_private_refs_commits` — public nubs repo zero-grep rule (HIGH)
- Memory: `feedback_nub_modular` — NUB packages own ALL logic (HIGH)
- Memory: `feedback_nub_scope_boundary` — NUBs define protocol surface, not UX (HIGH)
- Memory: `project_shim_design_rule` — central shim installs `window.*` only; thin host pattern (HIGH)

---
*Architecture research for: NUB-RELAY amendment adding `relay.subscribeEncrypted` (v0.29.0 Receive-Side Decrypt Surface)*
*Researched: 2026-04-23*
