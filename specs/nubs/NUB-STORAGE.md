NUB-STORAGE
===========

Scoped Key-Value Storage
------------------------

`draft`

**NUB ID:** NUB-STORAGE
**Namespace:** `window.napplet.storage`
**Discovery:** `shell.supports("NUB-STORAGE")`

## Description

NUB-STORAGE provides napplets with an async localStorage-like API. Without
`allow-same-origin`, iframes have opaque origins and cannot access localStorage
directly. This interface routes storage operations through the shell via
postMessage, which scopes data by napplet identity -- a composite key of
`(dTag, aggregateHash)` -- to enforce isolation between napplets. Different
napplet types and different versions of the same napplet have completely
separate storage namespaces.

## API Surface

```typescript
interface NappletStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  keys(): Promise<string[]>;
}
```

**`getItem(key)`** -- Retrieves a stored value by key. Returns `null` if the
key does not exist, matching localStorage semantics.

**`setItem(key, value)`** -- Stores a key-value pair. Throws if the napplet
exceeds its storage quota.

**`removeItem(key)`** -- Deletes a stored key. No-op if the key does not exist.

**`keys()`** -- Lists all keys stored by this napplet.

All methods are async because they cross the postMessage boundary. Each request
includes a correlation ID; the shell responds with a matching ID so the shim
can resolve the correct Promise.

## Shell Behavior

- The shell MUST scope storage by composite key `(dTag, aggregateHash)`.
  Different napplet types and different versions of the same napplet MUST have
  isolated storage.
- The shell MUST enforce a per-napplet storage quota. The reference
  implementation uses 512 KB measured in UTF-8 byte count.
- The shell MUST persist storage to the host's localStorage (or equivalent)
  so data survives page reloads.
- The shell MUST respond to storage requests within a reasonable timeout. The
  reference implementation uses 5 seconds.
- The shell MUST return structured error responses for quota violations
  (`"quota exceeded: ..."`) and invalid requests (`"missing key tag"`).
- The shell MUST validate storage key prefixes to prevent scope escape (a
  napplet MUST NOT be able to read or write another napplet's data).
- The shell SHOULD support backward-compatible migration across storage key
  format changes (the reference implementation reads three historical formats).

## Event Kinds

Storage operations use IPC-PEER events (kind 29003) with topic tags for
routing:

| Kind | Name | Direction | Description |
|------|------|-----------|-------------|
| 29003 | Storage get | napplet -> shell | `t` tag: `shell:state-get`. Includes `id` (correlation) and `key` tags. |
| 29003 | Storage set | napplet -> shell | `t` tag: `shell:state-set`. Includes `id`, `key`, and `value` tags. |
| 29003 | Storage remove | napplet -> shell | `t` tag: `shell:state-remove`. Includes `id` and `key` tags. |
| 29003 | Storage keys | napplet -> shell | `t` tag: `shell:state-keys`. Includes `id` tag. |
| 29003 | Storage response | shell -> napplet | `t` tag: `napplet:state-response`. Includes `id` tag matching request, plus `value`/`found`/`error`/`key` tags as appropriate. |

### Response Tags

| Tag | Usage |
|-----|-------|
| `id` | Correlation ID matching the request |
| `found` | `"true"` or `"false"` -- whether the key exists (getItem) |
| `value` | The stored value (getItem response) |
| `key` | Repeated tag, one per key (keys response) |
| `error` | Error reason string (quota exceeded, missing key, etc.) |

## Security Considerations

- Storage is scoped by composite key `(dTag, aggregateHash)`. A napplet MUST
  NOT be able to read or write another napplet's data.
- The shell MUST validate storage key prefixes to prevent scope escape.
- Storage quota enforcement (512 KB reference default) prevents a single
  napplet from consuming unbounded host storage.
- Storage values are strings only. The shell SHOULD NOT attempt to parse or
  execute stored content.
- The shell MAY enforce ACL checks on `storage:read` and `storage:write`
  capabilities before processing storage requests.
- Storage keys and values are visible to the shell. Napplets that need
  confidential storage should encrypt values before storing.

## Implementations

- [@napplet/shim](https://github.com/sandwichfarm/napplet) (napplet-side: `packages/shim/src/state-shim.ts`)
- [@napplet/shell](https://github.com/sandwichfarm/napplet) (shell-side: `packages/runtime/src/state-handler.ts`)
