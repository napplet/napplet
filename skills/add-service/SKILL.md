---
name: add-service
description: Use when implementing a ServiceHandler and registering it with the napplet runtime — covers ServiceDescriptor, handleMessage(windowId, message, send), onWindowDestroyed cleanup, parsing INTER_PANE topic events, sending responses via send(), and wiring into RuntimeHooks.services or runtime.registerService()
---

# Adding a Service to the Napplet Runtime

## Overview

A service is a shell-side handler that napplets communicate with via INTER_PANE topic events (kind 29003). Services are registered in the runtime's `ServiceRegistry` and discovered by napplets via kind 29010 `discoverServices()`. The message flow is: napplet calls `emit('my-service:action', ...)` → runtime dispatches `['EVENT', event]` to the matching `ServiceHandler.handleMessage()` → handler processes the event and optionally calls `send()` to respond. The audio service (`packages/services/src/audio-service.ts`) is the canonical reference implementation.

## Prerequisites

- `@kehto/shell` installed in the host project (re-exports all required types)
- A working shell bridge (see `skills/integrate-shell/SKILL.md`)

## Step 1 — Define a ServiceDescriptor

The `ServiceDescriptor` carries the metadata that napplets see when calling `discoverServices()`. All three fields are required.

```ts
import type { ServiceDescriptor } from '@kehto/shell';

const MY_SERVICE_VERSION = '1.0.0';

const descriptor: ServiceDescriptor = {
  name: 'my-service',          // key in ServiceRegistry — must be unique
  version: MY_SERVICE_VERSION, // semver string
  description: 'My custom service — brief description for napplet developers',
};
```

## Step 2 — Implement ServiceHandler

The `ServiceHandler` interface requires two methods: `handleMessage` and (optionally but recommended) `onWindowDestroyed`. Use the factory function pattern to encapsulate per-window state.

```ts
import type { ServiceHandler } from '@kehto/shell';
import type { NostrEvent } from '@kehto/shell';
import { BusKind } from '@kehto/shell';

export function createMyService(): ServiceHandler {
  // Per-window state — keyed by windowId
  const windowState = new Map<string, { registered: boolean }>();

  return {
    descriptor,

    handleMessage(windowId: string, message: unknown[], send: (msg: unknown[]) => void): void {
      // Runtime dispatches ['EVENT', event] for INTER_PANE events
      if (message[0] !== 'EVENT' || !message[1]) return;
      const event = message[1] as NostrEvent;

      // Only handle INTER_PANE kind
      if (event.kind !== BusKind.INTER_PANE) return;

      // Extract topic from 't' tag — use optional chaining for safety
      const topic = event.tags?.find((t) => t[0] === 't')?.[1];
      if (!topic?.startsWith('my-service:')) return;

      const action = topic.slice('my-service:'.length);

      switch (action) {
        case 'register': {
          windowState.set(windowId, { registered: true });
          // Acknowledge the event
          send(['OK', event.id, true, '']);
          break;
        }

        case 'unregister': {
          windowState.delete(windowId);
          send(['OK', event.id, true, '']);
          break;
        }

        case 'get-data': {
          // Respond with a synthetic INTER_PANE event
          const response: NostrEvent = {
            id: `svc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            pubkey: '__shell__',
            created_at: Math.floor(Date.now() / 1000),
            kind: BusKind.INTER_PANE,
            tags: [['t', 'my-service:data']],
            content: JSON.stringify({ value: 42 }),
            sig: '',
          };
          send(['EVENT', '__shell__', response]);
          break;
        }

        default:
          // Unknown action — ignore silently
          break;
      }
    },

    onWindowDestroyed(windowId: string): void {
      // Always clean up per-window state to prevent memory leaks
      windowState.delete(windowId);
    },
  };
}
```

Key patterns from the implementation above:

- Check `message[0] !== 'EVENT'` before casting to `NostrEvent` — services can receive other verb types.
- Use `event.tags?.find(...)` with optional chaining — tags may be undefined on malformed events.
- Acknowledge events with `send(['OK', event.id, true, ''])`.
- Respond with data using `send(['EVENT', '__shell__', responseEvent])` where `responseEvent` has `pubkey: '__shell__'` and `sig: ''`.

## Step 3 — Register the service

Two registration patterns are available.

**Option A — via hooks at creation time (static):**

Use when the service is always present and ready before any napplet connects.

```ts
import { createShellBridge } from '@kehto/shell';
import { createMyService } from './my-service.js';

const bridge = createShellBridge({
  // ... required hooks ...
  services: {
    'my-service': createMyService(),
  },
});
```

**Option B — via runtime after creation (dynamic):**

Use for lazy loading, post-login setup, or services that require async initialization.

```ts
const bridge = createShellBridge(hooks);

// Register after bridge creation — napplets that connect after this point can discover it
bridge.runtime.registerService('my-service', createMyService());
```

## Step 4 — Verify discovery from the napplet

After registering the service on the shell side, confirm it is visible to napplets using the `@napplet/shim` discovery API:

```ts
// In the napplet (uses @napplet/shim):
import { discoverServices, hasService, emit } from '@napplet/shim';

// List all services — should include 'my-service'
const services = await discoverServices();
// [{ name: 'my-service', version: '1.0.0', description: '...' }]

// Guard pattern before using service APIs
if (await hasService('my-service')) {
  emit('my-service:register', [], '');
}
```

## Reference implementation

See `packages/services/src/audio-service.ts` for a complete production-quality `ServiceHandler`.
It demonstrates: topic-based routing, per-window state management with `Map<string, AudioSource>`,
synthetic response events, and full `onWindowDestroyed` cleanup. The audio service uses the same
`BusKind.INTER_PANE` kind and `t` tag topic routing pattern shown above.

## Common pitfalls

- `handleMessage` receives raw `unknown[]` — always check `message[0]` is `'EVENT'` before casting. Never assume the verb.
- `event.tags` may be undefined on malformed events — always use optional chaining: `event.tags?.find(...)`.
- `send()` sends to the requesting napplet only. To broadcast to all connected napplets, use `bridge.injectEvent('topic', payload)`.
- `onWindowDestroyed` is optional in the TypeScript interface but REQUIRED if you store per-window state in a `Map`. Failing to implement it causes memory leaks on window close.
- The `descriptor.name` key must exactly match the string used in `ServiceRegistry` registration — case-sensitive. A mismatch means napplets cannot discover the service via `hasService()`.
- Services are not persisted across bridge restarts. Re-register on every `createShellBridge()` call (or pass them in `hooks.services` for automatic static wiring).
- Do NOT throw from `handleMessage`. Uncaught exceptions propagate into the runtime's message dispatch loop and may break subsequent messages from all napplets.
- `send()` is scoped to the calling napplet's `windowId`. Do not store the `send` callback — it may become stale after window destruction. Call it only within the current `handleMessage` invocation.
