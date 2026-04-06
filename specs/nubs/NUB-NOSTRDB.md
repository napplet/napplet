NUB-NOSTRDB
============

Local Event Database
--------------------

`draft`

**NUB ID:** NUB-NOSTRDB
**Namespace:** `window.nostrdb`
**Discovery:** `shell.supports("NUB-NOSTRDB")`

## Description

NUB-NOSTRDB provides napplets with access to a local Nostr event database maintained by the shell. This enables napplets to query cached events, add events to the local store, look up events by ID, retrieve replaceable events, count matching events, and subscribe to live updates. The shell typically backs this with an OPFS-based worker relay or similar persistent event store. Because napplet iframes run without `allow-same-origin`, they cannot access IndexedDB or OPFS directly -- all database access is proxied through the shell via postMessage.

## API Surface

```typescript
interface NostrDb {
  query(filters: NostrFilter | NostrFilter[]): Promise<NostrEvent[]>;
  add(event: NostrEvent): Promise<boolean>;
  event(id: string): Promise<NostrEvent | undefined>;
  replaceable(kind: number, author: string, identifier?: string): Promise<NostrEvent | undefined>;
  count(filters: NostrFilter | NostrFilter[]): Promise<number>;
  supports(): Promise<string[]>;
  subscribe(filters: NostrFilter | NostrFilter[]): AsyncGenerator<NostrEvent>;
}
```

- **`query(filters)`** -- Returns events matching NIP-01 filters from the local database. Accepts a single filter or an array of filters.

- **`add(event)`** -- Inserts an event into the local database. Returns `true` on success, `false` if the event was rejected (duplicate, invalid signature, etc.).

- **`event(id)`** -- Retrieves a single event by its hex ID. Returns `undefined` if not found.

- **`replaceable(kind, author, identifier?)`** -- Retrieves the latest replaceable event (NIP-33 semantics) for a given kind, author pubkey, and optional `d` tag identifier. Returns `undefined` if no match exists.

- **`count(filters)`** -- Returns the number of events matching the filters, following NIP-45 COUNT semantics.

- **`supports()`** -- Returns the list of supported method names. The reference implementation returns `['query', 'add', 'event', 'replaceable', 'count', 'subscribe']`.

- **`subscribe(filters)`** -- Returns an `AsyncGenerator` that yields new events matching the filters as they arrive in the database. The generator runs indefinitely until the caller breaks out of the iteration loop, at which point an unsubscribe message is sent and resources are cleaned up automatically via the generator's `finally` block.

## Shell Behavior

- The shell MUST route NIPDB_REQUEST events (kind 29006) to its local event database implementation.
- The shell MUST respond with NIPDB_RESPONSE events (kind 29007) containing the result as JSON in the `content` field.
- The shell MUST match responses to requests using the correlation `id` tag.
- The shell MUST support the `method` tag to distinguish between `query`, `add`, `event`, `replaceable`, `count`, `subscribe`, and `unsubscribe` operations.
- The shell MAY implement `subscribe` by pushing `event-push` method responses with matching `sub-id` tags when new events arrive in the database.
- The shell MAY enforce ACL checks on database access (e.g., restricting which kinds a napplet can query).
- The shell SHOULD persist the database across page reloads using OPFS, IndexedDB, or an equivalent persistent storage mechanism.

## Event Kinds

| Kind | Name | Direction | Description |
|------|------|-----------|-------------|
| 29006 | NIPDB_REQUEST | napplet -> shell | `method` tag identifies the operation. Correlation `id` tag for response matching. Request payload in `content`. |
| 29007 | NIPDB_RESPONSE | shell -> napplet | Matching `id` tag for correlation. Result payload in `content`. For subscriptions: `method: event-push` with `sub-id` tag. |

### Request Tags

All NIPDB_REQUEST events include:

| Tag | Required | Description |
|-----|----------|-------------|
| `method` | Yes | Operation name: `query`, `add`, `event`, `replaceable`, `count`, `subscribe`, `unsubscribe` |
| `id` | Yes | Correlation ID (UUID) for matching the response |
| `sub-id` | Only for `subscribe`/`unsubscribe` | Subscription identifier for live event delivery |

### Response Tags

All NIPDB_RESPONSE events include:

| Tag | Required | Description |
|-----|----------|-------------|
| `id` | Yes (except `event-push`) | Correlation ID matching the request |
| `method` | Only for `event-push` | Set to `event-push` for subscription pushes |
| `sub-id` | Only for `event-push` | Subscription ID for routing to the correct handler |

## Security Considerations

- The shell controls what data the napplet can see. The local database MAY contain events from multiple users; the shell MAY filter results based on the napplet's ACL.
- `add()` allows napplets to insert events into the shared database. The shell SHOULD validate event signatures before storing.
- The database is shared across napplets. Events added by one napplet are visible to others with database access. This is intentional (shared cache), but the shell MAY scope access per napplet if needed.
- The `subscribe` method creates long-lived connections. The shell SHOULD clean up subscriptions when the napplet's iframe is removed or when the napplet disconnects.
- Request timeouts are enforced client-side (10 seconds in the reference implementation). The shell SHOULD respond promptly to avoid timeout-induced rejections.

## Implementations

- [@napplet/shim](https://github.com/sandwichfarm/napplet) -- napplet-side (`window.nostrdb` installation via `installNostrDb()`)
- [@kehto/shell](https://github.com/sandwichfarm/kehto) -- shell-side (NIPDB request routing to WorkerRelay)
