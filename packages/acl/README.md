# @napplet/acl

> Pure, zero-dependency ACL module for the napplet protocol.

## Getting Started

### Prerequisites

`@napplet/acl` has no peer dependencies and no side effects. It works in browser, Node.js, Deno, Bun, and WASM contexts without modification.

### How It Works

1. Create an `AclState` with a default policy: `createState('permissive')` or `createState('restrictive')`
2. Use `check(state, identity, CAP_*)` to test whether an identity has a capability
3. Use `grant()`, `revoke()`, `block()`, `unblock()` to return new (immutable) states — the original is never modified
4. Use `serialize()`/`deserialize()` to persist state — the storage backend is the caller's responsibility

### Installation

```bash
npm install @napplet/acl
```

## Quick Start

```ts
import {
  createState, check, grant, revoke, block, unblock,
  CAP_RELAY_READ, CAP_SIGN_EVENT,
} from '@napplet/acl';

// Create state with restrictive default (deny unknown identities)
let state = createState('restrictive');

const id = { pubkey: 'abc...', dTag: 'chat', hash: 'ff00...' };

// Grant relay read access
state = grant(state, id, CAP_RELAY_READ);
check(state, id, CAP_RELAY_READ);  // true
check(state, id, CAP_SIGN_EVENT);  // false (not granted)

// Block the identity (overrides all caps)
state = block(state, id);
check(state, id, CAP_RELAY_READ);  // false (blocked)

// Unblock restores previous capabilities
state = unblock(state, id);
check(state, id, CAP_RELAY_READ);  // true (restored)
```

## API Reference

### State Creation

#### `createState(policy?)`

Create a new, empty ACL state.

| Parameter | Type | Description |
|-----------|------|-------------|
| `policy` | `'permissive' \| 'restrictive'` | Default policy for unknown identities. Defaults to `'permissive'`. |

Returns: `AclState`

```ts
const permissive = createState();            // unknown identities get all caps
const restrictive = createState('restrictive'); // unknown identities get no caps
```

### Capability Check

#### `check(state, identity, cap)`

Determine whether an identity has a specific capability.

| Parameter | Type | Description |
|-----------|------|-------------|
| `state` | `AclState` | Current ACL state |
| `identity` | `Identity` | Napplet identity composite key |
| `cap` | `number` | Capability bit constant (e.g., `CAP_RELAY_READ`) |

Returns: `boolean`

Decision logic:
1. If the identity has no entry: return based on `defaultPolicy` (`'permissive'` → `true`, `'restrictive'` → `false`)
2. If the identity is blocked: return `false` (blocked flag overrides all caps)
3. Otherwise: return `(entry.caps & cap) !== 0`

```ts
import { check, createState, grant } from '@napplet/acl';
import { CAP_RELAY_READ } from '@napplet/acl';

const state = createState('restrictive');
const id = { pubkey: 'abc', dTag: 'chat', hash: 'ff00' };

check(state, id, CAP_RELAY_READ); // false (restrictive, no entry)

const state2 = grant(state, id, CAP_RELAY_READ);
check(state2, id, CAP_RELAY_READ); // true
```

#### `toKey(identity)`

Compute the composite key string used internally as the entries map key.

| Parameter | Type | Description |
|-----------|------|-------------|
| `identity` | `Identity` | Napplet identity |

Returns: `string` — `'pubkey:dTag:hash'`

```ts
toKey({ pubkey: 'abc', dTag: 'chat', hash: 'ff00' }) // => 'abc:chat:ff00'
```

### Mutations

All mutations return a new `AclState`. The original is never modified.

#### `grant(state, identity, cap)`

Grant a capability to an identity.

| Parameter | Type | Description |
|-----------|------|-------------|
| `state` | `AclState` | Current ACL state |
| `identity` | `Identity` | Napplet identity |
| `cap` | `number` | Capability bit constant to grant |

Returns: `AclState`

```ts
state = grant(state, id, CAP_RELAY_READ);
```

#### `revoke(state, identity, cap)`

Revoke a capability from an identity.

| Parameter | Type | Description |
|-----------|------|-------------|
| `state` | `AclState` | Current ACL state |
| `identity` | `Identity` | Napplet identity |
| `cap` | `number` | Capability bit constant to revoke |

Returns: `AclState`

```ts
state = revoke(state, id, CAP_RELAY_WRITE);
```

#### `block(state, identity)`

Block an identity. A blocked identity fails all capability checks regardless of granted caps. The `caps` bitfield is preserved — `unblock()` restores the previous capabilities.

| Parameter | Type | Description |
|-----------|------|-------------|
| `state` | `AclState` | Current ACL state |
| `identity` | `Identity` | Napplet identity to block |

Returns: `AclState`

```ts
state = block(state, id);
check(state, id, CAP_RELAY_READ); // false (blocked overrides caps)
```

#### `unblock(state, identity)`

Unblock an identity, restoring capability checks to use the `caps` bitfield.

| Parameter | Type | Description |
|-----------|------|-------------|
| `state` | `AclState` | Current ACL state |
| `identity` | `Identity` | Napplet identity to unblock |

Returns: `AclState`

```ts
state = unblock(state, id);
check(state, id, CAP_RELAY_READ); // true (if cap was granted before blocking)
```

#### `setQuota(state, identity, bytes)`

Set the state storage quota for an identity.

| Parameter | Type | Description |
|-----------|------|-------------|
| `state` | `AclState` | Current ACL state |
| `identity` | `Identity` | Napplet identity |
| `bytes` | `number` | Quota in bytes |

Returns: `AclState`

The default quota is `DEFAULT_QUOTA` (512 KB = 524288 bytes).

```ts
state = setQuota(state, id, 1024 * 1024); // 1 MB
```

#### `getQuota(state, identity)`

Get the state storage quota for an identity. Returns `DEFAULT_QUOTA` (512 KB) if no entry exists.

| Parameter | Type | Description |
|-----------|------|-------------|
| `state` | `AclState` | Current ACL state |
| `identity` | `Identity` | Napplet identity |

Returns: `number` (bytes)

```ts
getQuota(state, id); // 524288 (default 512 KB)
```

### Serialization

#### `serialize(state)`

Serialize ACL state to a JSON string. Pass the result to your storage backend.

| Parameter | Type | Description |
|-----------|------|-------------|
| `state` | `AclState` | ACL state to serialize |

Returns: `string` (JSON)

```ts
const json = serialize(state);
localStorage.setItem('napplet:acl', json);
```

#### `deserialize(json)`

Deserialize ACL state from a JSON string. Returns a fresh permissive state on parse failure or invalid input — never throws.

| Parameter | Type | Description |
|-----------|------|-------------|
| `json` | `string` | JSON string to parse |

Returns: `AclState`

```ts
const json = localStorage.getItem('napplet:acl') ?? '';
const state = deserialize(json);
```

## Capability Constants

| Constant | Value | Capability |
|----------|-------|------------|
| `CAP_RELAY_READ` | `1 << 0` (1) | `relay:read` — subscribe to relay events |
| `CAP_RELAY_WRITE` | `1 << 1` (2) | `relay:write` — publish to relays |
| `CAP_CACHE_READ` | `1 << 2` (4) | `cache:read` — read from local cache |
| `CAP_CACHE_WRITE` | `1 << 3` (8) | `cache:write` — write to local cache |
| `CAP_HOTKEY_FORWARD` | `1 << 4` (16) | `hotkey:forward` — forward keyboard shortcuts |
| `CAP_SIGN_EVENT` | `1 << 5` (32) | `sign:event` — request event signing |
| `CAP_SIGN_NIP04` | `1 << 6` (64) | `sign:nip04` — NIP-04 encrypt/decrypt |
| `CAP_SIGN_NIP44` | `1 << 7` (128) | `sign:nip44` — NIP-44 encrypt/decrypt |
| `CAP_STATE_READ` | `1 << 8` (256) | `state:read` — read napplet-scoped state |
| `CAP_STATE_WRITE` | `1 << 9` (512) | `state:write` — write napplet-scoped state |
| `CAP_ALL` | `(1 << 10) - 1` (1023) | All capabilities granted |
| `CAP_NONE` | `0` | No capabilities granted |
| `DEFAULT_QUOTA` | `524288` | Default state storage quota (512 KB) |

## Types

```ts
import type { AclState, AclEntry, Identity } from '@napplet/acl';
```

| Type | Description |
|------|-------------|
| `AclState` | Complete ACL state — immutable, contains `defaultPolicy` and `entries` map |
| `AclEntry` | Entry for one identity — `caps` (bitfield), `blocked` (flag), `quota` (bytes) |
| `Identity` | Napplet identity composite key — `pubkey`, `dTag`, `hash` |

## Integration Note

`@napplet/runtime` uses this package internally. The `RuntimeAclPersistence` hooks in `@napplet/runtime` call `serialize()`/`deserialize()` to save and load state. Shell authors who need to inspect or customize ACL behavior can use these functions directly.

## Protocol Reference

- [Napplet Shell Protocol Specification](../../SPEC.md)

## License

MIT
