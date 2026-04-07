# @napplet/core

> Shared protocol types and constants for the napplet ecosystem.

## Getting Started

### Package Overview

This package is the single source of truth for all protocol-level definitions in the napplet ecosystem. All other `@napplet/*` packages import their protocol types and constants from here.

Zero dependencies. No DOM or browser APIs. Works in any JavaScript runtime.

### Installation

```bash
npm install @napplet/core
```

## Quick Start

```ts
import {
  type NostrEvent, type NostrFilter, type Capability,
  BusKind, AUTH_KIND, SHELL_BRIDGE_URI, PROTOCOL_VERSION,
  DESTRUCTIVE_KINDS, ALL_CAPABILITIES, TOPICS,
} from '@napplet/core';
```

## API Reference

### Protocol Types

Types shared by all napplet packages. These define the NIP-01 wire format and capability system.

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

Shell implementations use bitfield constants (`CAP_*`) for fast runtime ACL checks. `Capability` strings are the human-readable protocol-level representation.

#### `ServiceDescriptor`

Metadata describing a registered shell service.

```ts
interface ServiceDescriptor {
  name: string;       // e.g., 'audio', 'notifications'
  version: string;    // semver
  description?: string;
}
```

#### `ALL_CAPABILITIES`

`readonly Capability[]` containing all 10 capability strings.

```ts
for (const cap of ALL_CAPABILITIES) {
  console.log(cap); // 'relay:read', 'relay:write', ...
}
```

### Protocol Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `PROTOCOL_VERSION` | `'2.0.0'` | Current napplet-shell protocol version |
| `SHELL_BRIDGE_URI` | `'napplet://shell'` | URI identifying the shell bridge in NIP-42 AUTH relay tags |
| `AUTH_KIND` | `22242` | NIP-42 AUTH event kind |
| `REPLAY_WINDOW_SECONDS` | `30` | Maximum event age (seconds) for replay protection |
| `DESTRUCTIVE_KINDS` | `Set([0, 3, 5, 10002])` | Event kinds requiring explicit user consent before signing |

### Bus Event Kinds

All bus kinds are in the `29000–29999` ephemeral range. Ephemeral events are auto-discarded by real relays per NIP-01 — they never persist beyond the ShellBridge.

| `BusKind.*` | Value | Description |
|-------------|-------|-------------|
| `BusKind.REGISTRATION` | `29000` | Napplet registration events |
| `BusKind.SIGNER_REQUEST` | `29001` | Signer request from napplet to shell |
| `BusKind.SIGNER_RESPONSE` | `29002` | Signer response from shell to napplet |
| `BusKind.INTER_PANE` | `29003` | Inter-pane pubsub events between napplets |
| `BusKind.HOTKEY_FORWARD` | `29004` | Keyboard shortcut forwarding |
| `BusKind.METADATA` | `29005` | Napplet metadata events |
| `BusKind.NIPDB_REQUEST` | `29006` | NIP-DB request events |
| `BusKind.NIPDB_RESPONSE` | `29007` | NIP-DB response events |
| `BusKind.SERVICE_DISCOVERY` | `29010` | Service discovery — napplets query available shell services |

```ts
if (event.kind === BusKind.INTER_PANE) {
  // handle inter-pane message
}
if (DESTRUCTIVE_KINDS.has(event.kind)) {
  // prompt user for consent
}
```

### Topic Constants

The `TOPICS` object contains string constants for the napplet inter-pane event bus. Topics identify command and event types on `BusKind.INTER_PANE` (kind 29003) events.

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

Use topic constants to build type-safe subscriptions and publications:

```ts
// Subscribe to auth identity changes
shim.subscribe([{ kinds: [29003], '#t': [TOPICS.AUTH_IDENTITY_CHANGED] }]);
```

## Types

```ts
import type {
  NostrEvent, NostrFilter, Capability, ServiceDescriptor,
  BusKindValue, TopicKey, TopicValue,
} from '@napplet/core';
```

| Type | Description |
|------|-------------|
| `NostrEvent` | NIP-01 event structure |
| `NostrFilter` | NIP-01 subscription filter |
| `Capability` | Human-readable capability string union |
| `ServiceDescriptor` | Service metadata for discovery events |
| `BusKindValue` | Union of all `BusKind.*` values |
| `TopicKey` | Key of the `TOPICS` object |
| `TopicValue` | Value of the `TOPICS` object |

## Integration Note

`@napplet/core` is consumed by all other packages in the napplet ecosystem. `@napplet/shim`, `@napplet/sdk`, and `@napplet/vite-plugin` import protocol types and constants from here. Shell implementations also depend on `@napplet/core` as a peer dependency.

## Protocol Reference
- [NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md) — Basic protocol flow

## License

MIT
