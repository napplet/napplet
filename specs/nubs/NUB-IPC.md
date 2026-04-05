NUB-IPC
=======

Inter-Napplet Pub/Sub
---------------------

`draft`

**NUB ID:** NUB-IPC
**Namespace:** `window.napplet.ipc`
**Discovery:** `shell.supports("NUB-IPC")`

## Description

NUB-IPC provides a topic-based publish/subscribe system for communication between napplets. Messages are routed through the shell using NIP-01 event subscriptions on kind 29003 (IPC_PEER). The sender publishes a signed event with a topic tag; any napplet subscribed to that topic receives the event. This is loose coupling -- the sender does not know who (if anyone) receives the message. The shell also uses IPC_PEER events internally for state operations, audio coordination, and configuration commands.

## API Surface

```typescript
interface NappletIpc {
  emit(topic: string, extraTags?: string[][], content?: string): void;
  on(topic: string, callback: (payload: unknown, event: NostrEvent) => void): Subscription;
}

interface Subscription {
  close(): void;
}
```

- **`emit(topic, extraTags?, content?)`** -- Broadcasts a message to all napplets subscribed to the given topic. Creates a signed kind 29003 event with a `['t', topic]` tag and posts it to the shell via postMessage. `extraTags` allows additional NIP-01 tags beyond the topic tag (default: `[]`). `content` is the event content string, typically JSON (default: `''`). The call is fire-and-forget -- there is no delivery confirmation.

- **`on(topic, callback)`** -- Subscribes to messages on a topic. Under the hood, opens a NIP-01 `REQ` subscription filtered by `{ kinds: [29003], '#t': [topic] }`. The callback receives `(payload, event)` where `payload` is the JSON-parsed `event.content` (or `{}` if parsing fails) and `event` is the raw `NostrEvent`. Returns a `Subscription` handle with a `close()` method to unsubscribe. Multiple subscriptions to the same topic are independent.

## Shell Behavior

- The shell MUST route kind 29003 events to all napplets with matching NIP-01 subscriptions.
- The shell MUST use NIP-01 filter matching on the `#t` (topic) tag for subscription routing.
- The shell MUST NOT deliver an event back to the sender (sender exclusion).
- The shell MUST support standard NIP-01 subscription lifecycle (REQ/EVENT/EOSE/CLOSE) for IPC subscriptions.
- The shell MAY enforce ACL checks on IPC capabilities.
- The shell MAY intercept specific topic prefixes (e.g., `shell:*`) for internal command handling rather than routing them to other napplets.

## Topic Conventions

Topics use a prefix convention to signal direction and scope:

| Prefix | Direction | Meaning |
|--------|-----------|---------|
| `shell:*` | napplet -> shell | Commands sent by a napplet to the shell (e.g., `shell:state-get`, `shell:audio-register`) |
| `napplet:*` | shell -> napplet | Responses/notifications from shell to napplet (e.g., `napplet:state-response`, `napplet:audio-muted`) |
| `{domain}:*` | bidirectional | Domain-scoped messages between napplets (e.g., `auth:identity-changed`, `chat:open-dm`, `stream:channel-switch`, `profile:open`) |

These conventions are advisory. The shell routes by NIP-01 filter match, not by prefix parsing. A napplet can subscribe to any topic regardless of prefix.

### Built-in Topics

The `@napplet/core` package exports a `TOPICS` constant with well-known topic strings. See `packages/core/src/topics.ts` for the full list. Examples:

| Topic | Direction | Purpose |
|-------|-----------|---------|
| `auth:identity-changed` | shell -> napplet | User identity changed |
| `shell:state-get` | napplet -> shell | Read scoped state value |
| `napplet:state-response` | shell -> napplet | State operation result |
| `shell:audio-register` | napplet -> shell | Register audio source |
| `stream:channel-switch` | napplet <-> napplet | Switch active stream channel |

## Event Kinds

| Kind | Name | Direction | Description |
|------|------|-----------|-------------|
| 29003 | IPC_PEER | bidirectional | Topic in `t` tag, payload in `content`. Shell routes by NIP-01 subscription filter matching. |

### Event Structure

An IPC_PEER event has the following structure:

```json
{
  "kind": 29003,
  "tags": [
    ["t", "profile:open"],
    ...extraTags
  ],
  "content": "{\"pubkey\":\"abc123...\"}"
}
```

The event is signed with the napplet's delegated session key before posting to the shell.

## Security Considerations

- IPC messages are signed with the napplet's delegated session key. The shell verifies signatures before routing.
- Topic namespaces are not enforced -- any napplet can emit on any topic. The shell MAY restrict topics via ACL.
- Content is a JSON-serializable string. The receiving napplet is responsible for validating the parsed payload. The `on()` helper catches JSON parse failures and falls back to `{}`.
- Sender exclusion prevents echo loops but does not prevent a malicious napplet from impersonating messages. Receivers should validate event pubkeys if sender identity matters.
- IPC is per-message authenticated (full NIP-01 event with Schnorr signature). For high-frequency communication where per-message signing overhead is unacceptable, use NUB-PIPES instead.

## Relationship to NUB-PIPES

NUB-IPC is for loose-coupled, topic-based pub/sub with per-message authentication. NUB-PIPES is for tight-coupled, point-to-point connections with auth-on-open semantics. Both coexist in the napplet protocol: IPC for infrequent coordination (UI commands, state sync, configuration), pipes for sustained data streams (real-time collaboration, media).

## Implementations

- [@napplet/shim](https://github.com/sandwichfarm/napplet) -- napplet-side (`emit()` and `on()` installed on `window.napplet.ipc`)
- [@napplet/shell](https://github.com/sandwichfarm/napplet) -- shell-side (IPC_PEER routing via ShellBridge subscription dispatch)
