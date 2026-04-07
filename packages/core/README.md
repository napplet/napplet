# @napplet/core

> JSON envelope types and NUB dispatch infrastructure for the napplet ecosystem.

## Getting Started

### Package Overview

This package is the single source of truth for all protocol-level definitions in the napplet ecosystem. All other `@napplet/*` and `@kehto/*` packages import their envelope types, dispatch infrastructure, and protocol constants from here.

Zero dependencies. No DOM or browser APIs. Works in any JavaScript runtime.

### Installation

```bash
npm install @napplet/core
```

## Quick Start

```ts
import {
  type NappletMessage, type NubDomain, type ShellSupports,
  type NubHandler, type NubDispatch,
  NUB_DOMAINS, SHELL_BRIDGE_URI, PROTOCOL_VERSION,
  createDispatch, registerNub, dispatch, getRegisteredDomains,
  ALL_CAPABILITIES, TOPICS,
} from '@napplet/core';
```

## API Reference

### Envelope Types

The JSON envelope wire format is the primary API introduced in NIP-5D v4. All messages between napplet and shell use a `type` field as a discriminant in `domain.action` format.

#### `NappletMessage`

Base interface for all messages exchanged between napplet and shell.

```ts
interface NappletMessage {
  /** Message type discriminant in "domain.action" format */
  type: string;
}
```

Concrete message types extend this interface with domain-specific payload fields:

```ts
// Example concrete message type:
interface RelaySubscribe extends NappletMessage {
  type: 'relay.subscribe';
  id: string;
  subId: string;
  filters: NostrFilter[];
}
```

The `type` field domain prefix (`relay`, `signer`, `storage`, `ifc`) routes messages to the correct NUB handler via `dispatch()`.

#### `NubDomain`

String literal union of the four NUB capability domains.

```ts
type NubDomain = 'relay' | 'signer' | 'storage' | 'ifc';
```

| Domain    | Scope                                    |
|-----------|------------------------------------------|
| `relay`   | NIP-01 relay proxy (subscribe, publish)  |
| `signer`  | NIP-07/NIP-44 signing delegation         |
| `storage` | Scoped key-value storage proxy           |
| `ifc`     | Inter-frame communication (IPC peer bus) |

#### `NUB_DOMAINS`

Runtime constant array of all NUB domain strings. Useful for iteration and validation.

```ts
const NUB_DOMAINS: readonly NubDomain[] = ['relay', 'signer', 'storage', 'ifc'];

for (const domain of NUB_DOMAINS) {
  console.log(`Checking support for: ${domain}`);
}
```

#### `ShellSupports`

Interface for the shell capability query API.

```ts
interface ShellSupports {
  supports(capability: NubDomain | string): boolean;
}
```

Napplets call `window.napplet.shell.supports(domain)` to check whether the shell declared support for a NUB domain before using that domain's API.

#### `NappletGlobalShell`

Type for the `window.napplet.shell` namespace. Extends `ShellSupports`.

```ts
interface NappletGlobalShell extends ShellSupports {}
```

---

### NUB Dispatch Infrastructure

The dispatch system allows NUB modules to self-register at import time. Inbound messages are routed to the correct NUB handler based on the domain prefix extracted from `message.type` (the part before the first `.`).

#### `createDispatch()`

Factory that returns an isolated `{ registerNub, dispatch, getRegisteredDomains }` backed by its own `Map<string, NubHandler>`. Use for testing or multi-instance scenarios.

```ts
function createDispatch(): NubDispatch;
```

```ts
import { createDispatch } from '@napplet/core';

const { registerNub, dispatch } = createDispatch();
registerNub('relay', handleRelayMessage);
dispatch({ type: 'relay.subscribe' }); // true
```

#### `registerNub(domain, handler)`

Register a handler for a NUB domain on the module-level singleton registry. NUB modules call this at import time.

```ts
const registerNub: (domain: string, handler: NubHandler) => void;
```

```ts
import { registerNub } from '@napplet/core';

registerNub('relay', (msg) => {
  // handles all relay.* messages
  console.log('relay message:', msg.type);
});
```

Throws if the domain is already registered.

#### `dispatch(message)`

Dispatch a message to the handler matching its domain prefix. Returns `true` if a handler was found and called.

```ts
const dispatch: (message: NappletMessage) => boolean;
```

```ts
import { dispatch } from '@napplet/core';

dispatch({ type: 'relay.subscribe' });  // true (if relay handler registered)
dispatch({ type: 'unknown.action' });   // false
dispatch({ type: 'malformed' });         // false (no dot)
```

The domain is extracted by splitting `message.type` on the first `.`. A type with no `.` or an empty domain prefix returns `false` without throwing.

#### `getRegisteredDomains()`

Return all currently registered domain strings from the singleton registry.

```ts
const getRegisteredDomains: () => string[];
```

```ts
import { getRegisteredDomains } from '@napplet/core';

getRegisteredDomains(); // ['relay', 'signer', 'storage']
```

#### `NubHandler`

Callback type for NUB message handlers.

```ts
type NubHandler = (message: NappletMessage) => void;
```

#### `NubDispatch`

Interface returned by `createDispatch()`.

```ts
interface NubDispatch {
  registerNub: (domain: string, handler: NubHandler) => void;
  dispatch: (message: NappletMessage) => boolean;
  getRegisteredDomains: () => string[];
}
```

---

### Protocol Types

Types shared by all napplet packages for NIP-01 structures and the capability system.

#### `NostrEvent`

Standard NIP-01 Nostr event structure.

```ts
interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}
```

#### `NostrFilter`

NIP-01 subscription filter.

```ts
interface NostrFilter {
  ids?: string[];
  authors?: string[];
  kinds?: number[];
  since?: number;
  until?: number;
  limit?: number;
  [key: `#${string}`]: string[] | undefined; // tag filters, e.g. '#t', '#e'
}
```

#### `Capability`

String union type listing all 10 protocol capability strings.

```ts
type Capability =
  | 'relay:read' | 'relay:write'
  | 'cache:read' | 'cache:write'
  | 'hotkey:forward'
  | 'sign:event' | 'sign:nip04' | 'sign:nip44'
  | 'state:read' | 'state:write';
```

The [`@kehto/acl`](https://github.com/sandwichfarm/kehto) package uses bitfield constants (`CAP_*`) for fast runtime checks. `Capability` strings are the human-readable protocol-level representation.

#### `ALL_CAPABILITIES`

`readonly Capability[]` containing all 10 capability strings.

```ts
for (const cap of ALL_CAPABILITIES) {
  console.log(cap); // 'relay:read', 'relay:write', ...
}
```

#### `ServiceDescriptor`

Metadata describing a registered shell service.

```ts
interface ServiceDescriptor {
  name: string;       // e.g., 'audio', 'notifications'
  version: string;    // semver
  description?: string;
}
```

#### `Subscription`

Handle returned by `relay.subscribe()` and `ipc.on()`.

```ts
interface Subscription {
  close(): void;
}
```

#### `EventTemplate`

Unsigned event template passed to `relay.publish()`.

```ts
interface EventTemplate {
  kind: number;
  content: string;
  tags: string[][];
  created_at: number;
}
```

---

### Protocol Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `PROTOCOL_VERSION` | `'4.0.0'` | Current napplet-shell protocol version (JSON envelope era, NIP-5D v4) |
| `SHELL_BRIDGE_URI` | `'napplet://shell'` | URI identifying the shell bridge in relay tags |
| `REPLAY_WINDOW_SECONDS` | `30` | Maximum event age (seconds) for replay protection |

---

### Topic Constants

The `TOPICS` object contains string constants for the napplet inter-pane event bus. Topics identify command and event types on IFC envelope messages.

```ts
import { TOPICS } from '@napplet/core';

// Auth
TOPICS.AUTH_IDENTITY_CHANGED    // 'auth:identity-changed'

// State operations
TOPICS.STATE_GET                // 'shell:state-get'
TOPICS.STATE_SET                // 'shell:state-set'
TOPICS.STATE_REMOVE             // 'shell:state-remove'
TOPICS.STATE_RESPONSE           // 'napplet:state-response'

// Shell config
TOPICS.SHELL_CONFIG_GET         // 'shell:config-get'
TOPICS.SHELL_CONFIG_UPDATE      // 'shell:config-update'

// Audio
TOPICS.AUDIO_REGISTER           // 'shell:audio-register'
TOPICS.AUDIO_UNREGISTER         // 'shell:audio-unregister'
TOPICS.AUDIO_MUTED              // 'napplet:audio-muted'

// Window manager
TOPICS.WM_FOCUSED_WINDOW_CHANGED // 'wm:focused-window-changed'

// ... and more (see source for full list)
```

---

### Legacy (deprecated)

> **Deprecated:** The following constants are from the NIP-01 array wire format era. They will be removed in a future major version. Migrate to JSON envelope message types from `@napplet/nub-relay`, `@napplet/nub-signer`, etc.

#### `BusKind`

NIP-01 bus event kind numbers (29000–29999 ephemeral range).

```ts
// DEPRECATED -- use JSON envelope message types instead
if (event.kind === BusKind.IPC_PEER) {
  // handle IPC peer message
}
```

| `BusKind.*` | Value | Description |
|-------------|-------|-------------|
| `BusKind.REGISTRATION` | `29000` | Napplet registration events |
| `BusKind.SIGNER_REQUEST` | `29001` | Signer request from napplet to shell |
| `BusKind.SIGNER_RESPONSE` | `29002` | Signer response from shell to napplet |
| `BusKind.IPC_PEER` | `29003` | Inter-napplet IPC peer events |
| `BusKind.HOTKEY_FORWARD` | `29004` | Keyboard shortcut forwarding |
| `BusKind.METADATA` | `29005` | Napplet metadata events |
| `BusKind.NIPDB_REQUEST` | `29006` | NIP-DB request events |
| `BusKind.NIPDB_RESPONSE` | `29007` | NIP-DB response events |
| `BusKind.SERVICE_DISCOVERY` | `29010` | Service discovery events |

#### `DESTRUCTIVE_KINDS`

`Set([0, 3, 5, 10002])` — event kinds requiring user consent. Deprecated: will move to the signer NUB module.

#### `VERB_REGISTER` / `VERB_IDENTITY`

NIP-01 handshake verbs from the v0.9.0 era. Deprecated: replaced by JSON envelope handshake messages.

#### `AUTH_KIND`

NIP-42 AUTH event kind (`22242`). Deprecated: will move to the auth/handshake NUB module.

---

## Types

```ts
import type {
  NappletMessage, NubDomain, ShellSupports, NappletGlobalShell,
  NubHandler, NubDispatch,
  NostrEvent, NostrFilter, Capability, ServiceDescriptor,
  Subscription, EventTemplate, ServiceInfo, NappletGlobal,
  RegisterPayload, IdentityPayload,
  BusKindValue, TopicKey, TopicValue,
} from '@napplet/core';
```

| Type | Description |
|------|-------------|
| `NappletMessage` | Base interface for all JSON envelope messages |
| `NubDomain` | Union of the four NUB domain strings |
| `ShellSupports` | Interface with `supports()` capability query method |
| `NappletGlobalShell` | Type for `window.napplet.shell` (extends `ShellSupports`) |
| `NubHandler` | Callback type for NUB domain handlers |
| `NubDispatch` | Interface returned by `createDispatch()` |
| `NostrEvent` | NIP-01 event structure |
| `NostrFilter` | NIP-01 subscription filter |
| `Capability` | Human-readable capability string union |
| `ServiceDescriptor` | Service metadata for discovery events |
| `Subscription` | Handle with `close()` returned by subscribe/on |
| `EventTemplate` | Unsigned event template for publishing |
| `BusKindValue` | Union of all `BusKind.*` values (deprecated) |
| `TopicKey` | Key of the `TOPICS` object |
| `TopicValue` | Value of the `TOPICS` object |

## Integration Note

`@napplet/core` is consumed by all packages in the napplet ecosystem for envelope types and NUB dispatch — not just BusKind and TOPICS.

- **In this repo:** `@napplet/shim`, `@napplet/sdk`, and `@napplet/vite-plugin` import `NappletMessage`, `NubDomain`, `ShellSupports`, and all shared protocol types from `@napplet/core`.
- **In [@kehto](https://github.com/sandwichfarm/kehto):** `@kehto/runtime`, `@kehto/shell`, and `@kehto/services` depend on `@napplet/core` for envelope types, `createDispatch`, and protocol constants.
- **NUB packages** (`@napplet/nub-relay`, `@napplet/nub-signer`, `@napplet/nub-storage`, `@napplet/nub-ifc`): extend `NappletMessage` for their domain-specific message types and call `registerNub` at import time.

## Protocol Reference

- [NIP-5D](../../specs/NIP-5D.md) -- Napplet-shell protocol specification
- [NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md) -- Basic protocol flow

## License

MIT
