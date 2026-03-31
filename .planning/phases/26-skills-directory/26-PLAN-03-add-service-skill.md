# Plan 03: Create `skills/add-service/SKILL.md`

**Phase:** 26 — Skills Directory
**Requirement:** SKILL-03
**Goal:** Produce an agentskills.io-format skill file that lets an AI agent (or developer) implement a `ServiceHandler` and register it with the napplet runtime — using the audio service as the reference implementation.

---

## Pre-flight checklist

Before starting, read these files:

- `packages/runtime/src/types.ts` — `ServiceHandler`, `ServiceRegistry`, `ServiceDescriptor`, `ConsentRequest`, `ServiceInfo`
- `packages/services/src/audio-service.ts` — complete reference implementation of `ServiceHandler` (study the full file: `handleMessage`, `onWindowDestroyed`, `descriptor`, topic parsing pattern)
- `packages/runtime/src/service-dispatch.ts` — how the runtime routes messages to services (`routeServiceMessage`)
- `packages/shim/src/index.ts` — `emit()` and `on()` signatures (napplet side of the inter-pane protocol that services receive)
- `/home/sandwich/.claude/plugins/cache/claude-plugins-official/superpowers/5.0.6/skills/using-git-worktrees/SKILL.md` — format reference

---

## Output

Create the file: `skills/add-service/SKILL.md`

Parent directory `skills/add-service/` must be created if absent.

---

## Content specification

### Frontmatter (YAML)

```yaml
---
name: add-service
description: Use when implementing a ServiceHandler and registering it with the napplet runtime — covers ServiceDescriptor, handleMessage(windowId, message, send), onWindowDestroyed cleanup, parsing INTER_PANE topic events, sending responses via send(), and wiring into RuntimeHooks.services or runtime.registerService()
---
```

### Body structure

Follow this exact section order:

1. **Overview** — One paragraph. Explain what a service is (a server-side handler that napplets communicate with via INTER_PANE topic events), how services are discovered (napplets call `discoverServices()` / `hasService()`), and how messages flow (napplet `emit('audio:register', ...)` → runtime dispatches to `ServiceHandler.handleMessage()`). State that the audio service is the canonical reference implementation.

2. **Prerequisites**
   - `@napplet/runtime` installed (or `@napplet/shell` which re-exports the types)
   - Working shell bridge (see `skills/integrate-shell/SKILL.md`)

3. **Step 1 — Define a ServiceDescriptor**

   Show the `ServiceDescriptor` shape and explain the fields. Note that `name` is the key used in `ServiceRegistry` and for discovery.

   ```ts
   import type { ServiceDescriptor } from '@napplet/core';

   const MY_SERVICE_VERSION = '1.0.0';

   const descriptor: ServiceDescriptor = {
     name: 'my-service',
     version: MY_SERVICE_VERSION,
     description: 'My custom service — describe what it does',
   };
   ```

4. **Step 2 — Implement ServiceHandler**

   Show the complete `ServiceHandler` interface implementation. Based on the audio service pattern: factory function that returns `ServiceHandler`. Include `handleMessage`, `onWindowDestroyed`, and `descriptor`.

   - Show how to extract the NIP-01 verb and event from `message[]`
   - Show topic extraction from `event.tags`
   - Show sending a response via `send()`
   - Show state cleanup in `onWindowDestroyed`

   ```ts
   import type { ServiceHandler } from '@napplet/runtime';
   import type { NostrEvent } from '@napplet/core';
   import { BusKind } from '@napplet/core';

   export function createMyService(): ServiceHandler {
     // Per-window state
     const windowState = new Map<string, { registered: boolean }>();

     return {
       descriptor,

       handleMessage(windowId: string, message: unknown[], send: (msg: unknown[]) => void): void {
         const [verb, ...rest] = message;

         // Services typically handle INTER_PANE events (kind 29003)
         if (verb !== 'EVENT') return;
         const event = rest[0] as NostrEvent;
         if (event.kind !== BusKind.INTER_PANE) return;

         // Extract topic from 't' tag
         const topic = event.tags?.find((t) => t[0] === 't')?.[1];
         if (!topic?.startsWith('my-service:')) return;

         const action = topic.slice('my-service:'.length);

         switch (action) {
           case 'register': {
             windowState.set(windowId, { registered: true });

             // Acknowledge back to the napplet
             send(['OK', event.id, true, '']);
             break;
           }

           case 'unregister': {
             windowState.delete(windowId);
             send(['OK', event.id, true, '']);
             break;
           }

           case 'get-data': {
             // Send a synthetic INTER_PANE event back as the response
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
         // Clean up any state associated with this window
         windowState.delete(windowId);
       },
     };
   }
   ```

5. **Step 3 — Register the service at bridge creation time**

   Show two wiring patterns: via `hooks.services` at construction, and via `runtime.registerService()` after construction.

   **Option A — via hooks (at creation time):**

   ```ts
   import { createShellBridge } from '@napplet/shell';
   import { createMyService } from './my-service.js';

   const bridge = createShellBridge({
     // ... other hooks ...
     services: {
       'my-service': createMyService(),
     },
   });
   ```

   **Option B — via runtime after creation:**

   ```ts
   const bridge = createShellBridge(hooks);
   bridge.runtime.registerService('my-service', createMyService());
   ```

   Note: Option B allows dynamic service registration (e.g., after user login).

6. **Step 4 — Verify discovery from the napplet**

   Show the napplet-side code that verifies the service is discoverable. This is the acceptance test pattern for new services.

   ```ts
   // In the napplet (uses @napplet/shim):
   import { discoverServices, hasService } from '@napplet/shim';

   const services = await discoverServices();
   console.log(services); // [{ name: 'my-service', version: '1.0.0', description: '...' }]

   if (await hasService('my-service')) {
     emit('my-service:register', [], '');
   }
   ```

7. **Common pitfalls**
   - `handleMessage` receives raw NIP-01 `unknown[]` — always check the verb and cast safely. Do not assume `message[0]` is `'EVENT'`.
   - The `event.tags` array may be undefined on malformed events — use optional chaining: `event.tags?.find(...)`.
   - `send()` sends directly to the requesting napplet only — it does not broadcast. Use `bridge.injectEvent()` for broadcast.
   - `onWindowDestroyed` is optional but critical for services that store per-window state. Always implement it if you use a Map keyed by `windowId`.
   - The `descriptor.name` string must exactly match the key used in `ServiceRegistry` and in discovery responses. Case-sensitive.
   - Services are not persisted across bridge restarts — re-register on each `createShellBridge()` call.
   - Do not throw from `handleMessage` — exceptions escape silently and break message processing for that window.

8. **Reference implementation**

   Point to the audio service for a complete, production-quality example:

   ```
   See packages/services/src/audio-service.ts for the canonical ServiceHandler implementation.
   It demonstrates: topic-based routing, per-window state management, synthetic response events,
   and full onWindowDestroyed cleanup.
   ```

---

## Verification criteria (SKILL-03 acceptance)

- [ ] File exists at `skills/add-service/SKILL.md`
- [ ] YAML frontmatter present with `name` and `description` fields
- [ ] `ServiceDescriptor` shape shown with all three fields (`name`, `version`, `description`)
- [ ] `ServiceHandler` implementation shown with `handleMessage`, `onWindowDestroyed`, and `descriptor`
- [ ] Topic extraction pattern shown (`event.tags?.find(t => t[0] === 't')?.[1]`)
- [ ] `send()` callback usage demonstrated (both `OK` and synthetic `EVENT` response patterns)
- [ ] Both registration patterns shown: `hooks.services` and `runtime.registerService()`
- [ ] Napplet-side discovery verification step included
- [ ] `onWindowDestroyed` cleanup pattern present
- [ ] Reference to audio service (`packages/services/src/audio-service.ts`) included
- [ ] Common pitfalls section present with at least 5 items
- [ ] No framework dependencies in code examples
- [ ] File is self-contained — agent can implement a service from this file alone

---

*Plan created: 2026-03-31*
*Phase: 26-skills-directory*
