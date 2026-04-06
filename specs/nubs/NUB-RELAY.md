NUB-RELAY
=========

NIP-01 Relay Proxy
------------------

`draft`

**NUB ID:** NUB-RELAY
**Namespace:** `window.napplet.relay`
**Discovery:** `shell.supports("NUB-RELAY")`

## Description

NUB-RELAY provides napplets with NIP-01 relay access through the shell.
Sandboxed iframes cannot open WebSocket connections directly because the
`allow-same-origin` sandbox token is absent. The shell acts as a relay proxy,
forwarding REQ/EVENT/CLOSE messages to its connected relay pool and delivering
matching events back to the napplet. This is the most fundamental shell
capability -- without it, napplets have no way to read or write Nostr events.

## API Surface

```typescript
interface NappletRelay {
  subscribe(
    filters: NostrFilter | NostrFilter[],
    onEvent: (event: NostrEvent) => void,
    onEose: () => void,
    options?: { relay?: string; group?: string },
  ): Subscription;

  publish(
    template: EventTemplate,
    options?: { relay?: boolean },
  ): Promise<NostrEvent>;

  query(
    filters: NostrFilter | NostrFilter[],
  ): Promise<NostrEvent[]>;
}

interface Subscription {
  close(): void;
}
```

**`subscribe(filters, onEvent, onEose, options?)`** -- Opens a live NIP-01
subscription. The shell queries its local cache and connected relays, streaming
matching events back via `["EVENT", subId, event]`. Returns a handle with
`close()` to tear down the subscription. When `options.relay` is provided, the
subscription targets a specific relay (e.g., for NIP-29 group relays) instead
of the shared pool.

**`publish(template, options?)`** -- Signs the event template via
`window.nostr.signEvent()` (NUB-SIGNER) and posts it to the shell for relay
broadcast. When `options.relay` is true, publishes to the scoped relay instead
of the shared pool. Returns the signed event.

**`query(filters)`** -- Convenience wrapper: subscribes, collects events until
EOSE, then closes the subscription and resolves the Promise with the collected
events.

## Shell Behavior

- The shell MUST forward `["REQ", subId, ...filters]` to its relay pool and
  deliver matching events as `["EVENT", subId, event]`.
- The shell MUST send `["EOSE", subId]` when stored events are exhausted.
- The shell MUST honor `["CLOSE", subId]` by tearing down the subscription
  and ceasing event delivery.
- The shell MUST send `["OK", eventId, bool, msg]` after processing EVENT
  messages, per NIP-01 semantics.
- The shell MAY enforce ACL checks on `relay:read` and `relay:write`
  capabilities before processing REQ or EVENT messages.
- The shell MAY support scoped relay connections via kind 29001 events with
  topic `shell:relay-scoped-connect`. The scoped relay flow uses three topics:
  `shell:relay-scoped-connect` (open), `shell:relay-scoped-close` (tear down),
  and `shell:relay-scoped-publish` (send event to scoped relay).
- The shell MAY send `["CLOSED", subId, msg]` to indicate a subscription was
  closed by the shell (e.g., due to an error or policy).
- The shell MAY send `["NOTICE", msg]` for human-readable status messages.

## Event Kinds

This interface primarily uses NIP-01 wire format verbs (REQ, EVENT, CLOSE,
EOSE, OK, CLOSED, NOTICE) which are not custom event kinds. For scoped relay
operations, it uses:

| Kind | Name | Direction | Description |
|------|------|-----------|-------------|
| 29001 | Scoped relay connect | napplet -> shell | `t` tag: `shell:relay-scoped-connect`. Includes `url`, `group`, `sub-id`, `filters` tags. |
| 29001 | Scoped relay close | napplet -> shell | `t` tag: `shell:relay-scoped-close`. Tears down the scoped relay connection. |
| 29001 | Scoped relay publish | napplet -> shell | `t` tag: `shell:relay-scoped-publish`. Includes `event` tag with JSON-serialized signed event. |

All scoped relay commands use the IPC-PEER bus (kind 29001, same as signer
requests) with topic tags for routing.

## Security Considerations

- The shell controls which relays the napplet can access. Napplets cannot open
  arbitrary WebSocket connections.
- The shell MAY filter or reject subscriptions based on ACL capabilities
  (`relay:read` for REQ, `relay:write` for EVENT).
- Event signatures are verified by the shell before relay broadcast. Events
  signed with delegated keys MUST NOT be published to external relays per
  NIP-5D security requirements.
- Scoped relay URLs SHOULD be validated by the shell to prevent SSRF-like
  abuse (e.g., napplets targeting internal network addresses).
- Subscription filters SHOULD be validated to prevent resource exhaustion
  (e.g., unbounded subscriptions without `limit`).

## Implementations

- [@napplet/shim](https://github.com/sandwichfarm/napplet) (napplet-side: `packages/shim/src/relay-shim.ts`)
- [@kehto/shell](https://github.com/sandwichfarm/kehto) (shell-side: `packages/runtime/src/shell-bridge.ts`)
