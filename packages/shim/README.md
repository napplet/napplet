# @napplet/shim

> Side-effect-only window installer for napplet iframes. Importing `@napplet/shim` installs the `window.napplet` global. No named exports. No cryptographic dependencies -- the shim sends JSON envelope messages and the shell handles identity.

## Getting Started

### Prerequisites

- A shell host running a napplet protocol shell implementation

### How It Works

1. Import `@napplet/shim` in your napplet's entry point (side-effect only -- no named exports)
2. The shim registers with the shell via postMessage -- the shell assigns identity based on the iframe's `message.source` Window reference
3. Once registered, `window.napplet` is populated with `relay`, `ipc`, `storage`, `keys`, `media`, `notify`, `identity`, and `shell` sub-objects
4. No `window.nostr` is installed -- signing and encryption are mediated by the shell via `relay.publish()` and `relay.publishEncrypted()`

### Installation

```bash
npm install @napplet/shim
```

## Quick Start

```ts
// Side-effect import -- installs window.napplet (no window.nostr)
import '@napplet/shim';

// Subscribe to kind 1 notes
const sub = window.napplet.relay.subscribe(
  { kinds: [1], limit: 20 },
  (event) => console.log('New note:', event.content),
  () => console.log('End of stored events'),
);

// Publish a note (shell signs it)
const signed = await window.napplet.relay.publish({
  kind: 1,
  content: 'Hello from my napplet!',
  tags: [],
  created_at: Math.floor(Date.now() / 1000),
});

// Listen for inter-pane events from other napplets
const ipcSub = window.napplet.ipc.on('profile:open', (payload) => {
  console.log('Profile requested:', payload);
});

// Use scoped storage (proxied through the shell)
await window.napplet.storage.setItem('theme', 'dark');
const theme = await window.napplet.storage.getItem('theme'); // 'dark'

// Register a keyboard action the shell can bind to a key
const result = await window.napplet.keys.registerAction({
  id: 'editor.save', label: 'Save', defaultKey: 'Ctrl+S',
});

// Listen for the bound key locally (zero-latency, no postMessage round-trip)
const keySub = window.napplet.keys.onAction('editor.save', () => {
  console.log('Save triggered!');
});

// Create a media session
const { sessionId } = await window.napplet.media.createSession({
  title: 'My Song', artist: 'The Artist',
});

// Report playback state
window.napplet.media.reportState(sessionId, {
  status: 'playing', position: 42.5, duration: 240,
});

// Listen for shell media commands
const mediaSub = window.napplet.media.onCommand(sessionId, (action, value) => {
  if (action === 'pause') player.pause();
});

// Send a notification
const { notificationId } = await window.napplet.notify.send({
  title: 'New message', body: 'Alice: hey!', priority: 'normal',
});

// Set badge count
window.napplet.notify.badge(3);

// Listen for notification interactions
const notifySub = window.napplet.notify.onAction((notifId, actionId) => {
  if (actionId === 'reply') openReply(notifId);
});

// Get user identity (read-only)
const pubkey = await window.napplet.identity.getPublicKey();
const profile = await window.napplet.identity.getProfile();

// Clean up
sub.close();
ipcSub.close();
keySub.close();
mediaSub.close();
notifySub.close();
```

## Wire Format

The shim communicates with the shell using JSON envelope messages (`{ type: "domain.action", ...payload }`) as defined by NIP-5D.

### Outbound (napplet → shell)

Messages sent via `window.parent.postMessage(msg, '*')`:

```ts
{ type: 'relay.subscribe', id: string, subId: string, filters: NostrFilter[] }
{ type: 'relay.publish', id: string, event: EventTemplate }
{ type: 'relay.publishEncrypted', id: string, event: EventTemplate, recipient: string, encryption?: 'nip44' | 'nip04' }
{ type: 'relay.query', id: string, filters: NostrFilter[] }
{ type: 'relay.unsubscribe', subId: string }

{ type: 'identity.getPublicKey', id: string }
{ type: 'identity.getRelays', id: string }
{ type: 'identity.getProfile', id: string }
{ type: 'identity.getFollows', id: string }
{ type: 'identity.getList', id: string, listType: string }
{ type: 'identity.getZaps', id: string }
{ type: 'identity.getMutes', id: string }
{ type: 'identity.getBlocked', id: string }
{ type: 'identity.getBadges', id: string }

{ type: 'ifc.emit', topic: string, payload?: unknown }
{ type: 'ifc.subscribe', id: string, topic: string }
{ type: 'ifc.unsubscribe', topic: string }

{ type: 'storage.get', id: string, key: string }
{ type: 'storage.set', id: string, key: string, value: string }
{ type: 'storage.remove', id: string, key: string }
{ type: 'storage.keys', id: string }

{ type: 'keys.forward', key: string, code: string, ctrl: boolean, alt: boolean, shift: boolean, meta: boolean }
{ type: 'keys.registerAction', id: string, action: { id: string, label: string, defaultKey?: string } }
{ type: 'keys.unregisterAction', actionId: string }

{ type: 'media.session.create', id: string, sessionId: string, metadata?: object }
{ type: 'media.session.update', sessionId: string, metadata: object }
{ type: 'media.session.destroy', sessionId: string }
{ type: 'media.state', sessionId: string, status: string, position?: number, duration?: number, volume?: number }
{ type: 'media.capabilities', sessionId: string, actions: string[] }

{ type: 'notify.send', id: string, title: string, body?: string, icon?: string, actions?: object[], channel?: string, priority?: string }
{ type: 'notify.dismiss', notificationId: string }
{ type: 'notify.badge', count: number }
{ type: 'notify.channel.register', channelId: string, label: string, description?: string, defaultPriority?: string }
{ type: 'notify.permission.request', id: string, channel?: string }
```

### Inbound (shell → napplet)

Messages received via `window.addEventListener('message', ...)`:

```ts
{ type: 'relay.event', subId: string, event: NostrEvent }
{ type: 'relay.eose', subId: string }
{ type: 'relay.publish.result', id: string, ok: boolean, event?: NostrEvent, error?: string }
{ type: 'relay.publishEncrypted.result', id: string, ok: boolean, event?: NostrEvent, error?: string }
{ type: 'relay.query.result', id: string, events: NostrEvent[], error?: string }

{ type: 'identity.getPublicKey.result', id: string, pubkey: string }
{ type: 'identity.getRelays.result', id: string, relays: Record<string, { read: boolean, write: boolean }>, error?: string }
{ type: 'identity.getProfile.result', id: string, profile: object | null, error?: string }
{ type: 'identity.getFollows.result', id: string, pubkeys: string[], error?: string }
{ type: 'identity.getList.result', id: string, entries: string[], error?: string }
{ type: 'identity.getZaps.result', id: string, zaps: object[], error?: string }
{ type: 'identity.getMutes.result', id: string, pubkeys: string[], error?: string }
{ type: 'identity.getBlocked.result', id: string, pubkeys: string[], error?: string }
{ type: 'identity.getBadges.result', id: string, badges: object[], error?: string }

{ type: 'ifc.event', topic: string, payload?: unknown, sender: string }

{ type: 'storage.get.result', id: string, value?: string | null, error?: string }
{ type: 'storage.set.result', id: string, error?: string }
{ type: 'storage.remove.result', id: string, error?: string }
{ type: 'storage.keys.result', id: string, keys?: string[], error?: string }

{ type: 'keys.registerAction.result', id: string, actionId: string, binding?: string, error?: string }
{ type: 'keys.bindings', bindings: Array<{ actionId: string, key: string }> }
{ type: 'keys.action', actionId: string }

{ type: 'media.session.create.result', id: string, sessionId: string, error?: string }
{ type: 'media.command', sessionId: string, action: string, value?: number }
{ type: 'media.controls', controls: string[] }

{ type: 'notify.send.result', id: string, notificationId?: string, error?: string }
{ type: 'notify.permission.result', id: string, granted: boolean }
{ type: 'notify.action', notificationId: string, actionId: string }
{ type: 'notify.clicked', notificationId: string }
{ type: 'notify.dismissed', notificationId: string, reason?: string }
{ type: 'notify.controls', controls: string[] }
```

All request/response pairs are correlated by the `id` field. Identity request timeouts after 30 seconds.

## `window.napplet` Shape

After `import '@napplet/shim'`, the global `window.napplet` object has the following structure:

```ts
window.napplet = {
  relay: {
    subscribe(filters, onEvent, onEose, options?): Subscription;
    publish(template, options?): Promise<NostrEvent>;
    publishEncrypted(template, recipient, encryption?): Promise<NostrEvent>;
    query(filters): Promise<NostrEvent[]>;
  },
  ipc: {
    emit(topic, extraTags?, content?): void;
    on(topic, callback): { close(): void };
  },
  storage: {
    getItem(key): Promise<string | null>;
    setItem(key, value): Promise<void>;
    removeItem(key): Promise<void>;
    keys(): Promise<string[]>;
  },
  keys: {
    registerAction(action): Promise<{ actionId: string; binding?: string }>;
    unregisterAction(actionId): void;
    onAction(actionId, callback): { close(): void };
  },
  media: {
    createSession(metadata?): Promise<{ sessionId: string }>;
    updateSession(sessionId, metadata): void;
    destroySession(sessionId): void;
    reportState(sessionId, state): void;
    reportCapabilities(sessionId, actions): void;
    onCommand(sessionId, callback): { close(): void };
    onControls(sessionId, callback): { close(): void };
  },
  notify: {
    send(notification): Promise<{ notificationId: string }>;
    dismiss(notificationId): void;
    badge(count): void;
    registerChannel(channel): void;
    requestPermission(channel?): Promise<{ granted: boolean }>;
    onAction(callback): { close(): void };
    onClicked(callback): { close(): void };
    onDismissed(callback): { close(): void };
    onControls(callback): { close(): void };
  },
  identity: {
    getPublicKey(): Promise<string>;
    getRelays(): Promise<Record<string, { read: boolean; write: boolean }>>;
    getProfile(): Promise<object | null>;
    getFollows(): Promise<string[]>;
    getList(listType): Promise<string[]>;
    getZaps(): Promise<object[]>;
    getMutes(): Promise<string[]>;
    getBlocked(): Promise<string[]>;
    getBadges(): Promise<object[]>;
  },
  shell: {
    supports(capability: NamespacedCapability): boolean;
  },
};
```

### `window.napplet.relay`

Relay operations through the shell's relay pool via JSON envelope (relay.subscribe, relay.publish, relay.query messages).

| Method | Returns | Description |
|--------|---------|-------------|
| `subscribe(filters, onEvent, onEose, options?)` | `Subscription` | Open a relay subscription via JSON envelope. `options.relay` and `options.group` for NIP-29 scoped relays. |
| `publish(template, options?)` | `Promise<NostrEvent>` | Send an event template to the shell for signing and broadcast. |
| `publishEncrypted(template, recipient, encryption?)` | `Promise<NostrEvent>` | Send an event template to the shell for encryption, signing, and broadcast. NIP-44 default. |
| `query(filters)` | `Promise<NostrEvent[]>` | One-shot query: sends a relay.query envelope, resolves when results arrive. |

### `window.napplet.ipc`

Inter-pane communication between napplets via the shell.

| Method | Returns | Description |
|--------|---------|-------------|
| `emit(topic, extraTags?, content?)` | `void` | Send an `ifc.emit` JSON envelope to the shell for delivery to matching topic subscribers. |
| `on(topic, callback)` | `{ close(): void }` | Subscribe to `ifc.event` JSON envelopes on a topic. Callback receives `(payload, event)`. |

### `window.napplet.storage`

Sandboxed key-value storage proxied through the shell. Scoped by napplet identity -- napplets cannot read each other's data. 512 KB quota per napplet.

| Method | Returns | Description |
|--------|---------|-------------|
| `getItem(key)` | `Promise<string \| null>` | Retrieve a stored value. Returns `null` if key does not exist. |
| `setItem(key, value)` | `Promise<void>` | Store a key-value pair. Throws on quota exceeded. |
| `removeItem(key)` | `Promise<void>` | Remove a stored key. |
| `keys()` | `Promise<string[]>` | List all keys stored by this napplet. |

### `window.napplet.keys`

Keyboard forwarding and action keybindings. The shim installs a capture-phase keydown listener that implements smart forwarding: unbound keys are forwarded to the shell via `keys.forward`, while bound keys are handled locally with zero latency.

| Method | Returns | Description |
|--------|---------|-------------|
| `registerAction(action)` | `Promise<{ actionId, binding? }>` | Declare a named action the shell can bind to a key. `defaultKey` is a hint. |
| `unregisterAction(actionId)` | `void` | Remove a previously registered action. Fire-and-forget. |
| `onAction(actionId, callback)` | `{ close(): void }` | Register a local handler for a bound key. NOT a wire message -- zero latency. |

Smart forwarding rules:
- Text inputs (`<input>`, `<textarea>`, `contenteditable`) are never forwarded (prevents credential leakage)
- Bare modifier keys are never forwarded
- IME composition events are never forwarded
- Reserved keys (`Tab`, `Shift+Tab`, `Escape`) are never suppressed
- Bound keys: `preventDefault()` + local action handler, no `keys.forward`
- Unbound keys: forwarded to shell via `keys.forward`

### `window.napplet.media`

Media session control. Create sessions, report playback state and metadata, declare capabilities, and receive commands from the shell.

| Method | Returns | Description |
|--------|---------|-------------|
| `createSession(metadata?)` | `Promise<{ sessionId }>` | Create a new media session with optional metadata. |
| `updateSession(sessionId, metadata)` | `void` | Update metadata for an existing session. Fire-and-forget. |
| `destroySession(sessionId)` | `void` | Destroy a session. Fire-and-forget. |
| `reportState(sessionId, state)` | `void` | Report playback state (status, position, duration, volume). |
| `reportCapabilities(sessionId, actions)` | `void` | Declare supported media actions (dynamic). |
| `onCommand(sessionId, callback)` | `{ close(): void }` | Listen for shell media commands (play, pause, seek, volume, etc.). |
| `onControls(sessionId, callback)` | `{ close(): void }` | Listen for the shell's supported control list. |

### `window.napplet.notify`

Shell-rendered notifications. Send notifications, set badge counts, register channels, request permission, and listen for user interaction.

| Method | Returns | Description |
|--------|---------|-------------|
| `send(notification)` | `Promise<{ notificationId }>` | Send a notification to the shell. |
| `dismiss(notificationId)` | `void` | Dismiss a notification. Fire-and-forget. |
| `badge(count)` | `void` | Set badge count (0 to clear). Fire-and-forget. |
| `registerChannel(channel)` | `void` | Register a notification channel. Fire-and-forget. |
| `requestPermission(channel?)` | `Promise<{ granted }>` | Request permission to send notifications. |
| `onAction(callback)` | `{ close(): void }` | Listen for action button clicks. |
| `onClicked(callback)` | `{ close(): void }` | Listen for notification body clicks. |
| `onDismissed(callback)` | `{ close(): void }` | Listen for dismissals (user/timeout/replaced). |
| `onControls(callback)` | `{ close(): void }` | Listen for shell's notification capabilities. |

### `window.napplet.shell`

Namespaced capability query. `supports()` checks whether the shell declared support for a NUB domain or permission.

```ts
// NUB domains (bare shorthand or nub: prefix)
window.napplet.shell.supports('relay');         // bare shorthand
window.napplet.shell.supports('nub:identity');  // explicit prefix

// Permissions
window.napplet.shell.supports('perm:popups');
```

Currently returns `false` until the shell populates it at iframe creation time. Use as a feature gate before calling APIs that depend on a specific capability.

## TypeScript Support

Importing `@napplet/shim` activates a global Window type augmentation:

```ts
// This side-effect import gives TypeScript full autocompletion for window.napplet.*
import '@napplet/shim';

// TypeScript knows about window.napplet.relay, .ipc, .storage, .keys, .media, .notify, .identity, .shell
window.napplet.relay.subscribe({ kinds: [1] }, (event) => {
  // event is typed as NostrEvent
});

window.napplet.shell.supports('identity'); // typed as (capability: string) => boolean
```

The `NappletGlobal` interface is defined in `@napplet/core` and augmented onto `Window` by the shim's type declarations.

**Note:** `@napplet/shim` has zero named exports -- `import { anything } from '@napplet/shim'` is a TypeScript error. For named imports, use `@napplet/sdk`.

## Shim vs SDK

| | `@napplet/shim` | `@napplet/sdk` |
|---|---|---|
| **Import style** | `import '@napplet/shim'` (side-effect) | `import { relay, ipc } from '@napplet/sdk'` |
| **What it does** | Installs `window.napplet` global + shell registration | Named exports wrapping `window.napplet` |
| **Dependencies** | `@napplet/nub-relay`, `@napplet/nub-identity`, `@napplet/nub-ifc`, `@napplet/nub-keys`, `@napplet/nub-media`, `@napplet/nub-notify` | `@napplet/core` (types only) |
| **When to use** | Always -- required to install the runtime | When you want typed imports in a bundler |
| **Named exports** | None | `relay`, `ipc`, `storage`, `keys`, `identity`, plus types |

**Typical usage:** Import both -- shim for window installation, SDK for typed API access:

```ts
import '@napplet/shim';
import { relay, ipc, storage, keys, identity } from '@napplet/sdk';
```

## Protocol Reference

- [NIP-5D](../../specs/NIP-5D.md) -- Napplet-shell protocol specification

## License

MIT
