# Plan 02: Create `skills/integrate-shell/SKILL.md`

**Phase:** 26 — Skills Directory
**Requirement:** SKILL-02
**Goal:** Produce an agentskills.io-format skill file that lets an AI agent (or developer) integrate `@napplet/shell` into a host application — wiring the bridge, implementing minimum viable hooks, handling consent, and registering a service.

---

## Pre-flight checklist

Before starting, read these files:

- `packages/shell/src/index.ts` — all exported symbols
- `packages/shell/src/shell-bridge.ts` — `ShellBridge` interface, `createShellBridge()` signature
- `packages/shell/src/types.ts` — `ShellHooks`, `RelayPoolHooks`, `WindowManagerHooks`, `AuthHooks`, `CryptoHooks`, `ConsentRequest`, `ServiceDescriptor`, `ServiceHandler`, `ServiceRegistry`
- `packages/runtime/src/types.ts` — `RuntimeHooks` and all sub-interfaces (read the full file; it is the authoritative source for hook shapes)
- `packages/shell/src/origin-registry.ts` — `originRegistry.register()`, `originRegistry.getWindowId()`
- `/home/sandwich/.claude/plugins/cache/claude-plugins-official/superpowers/5.0.6/skills/using-git-worktrees/SKILL.md` — format reference

---

## Output

Create the file: `skills/integrate-shell/SKILL.md`

Parent directory `skills/integrate-shell/` must be created if absent.

---

## Content specification

### Frontmatter (YAML)

```yaml
---
name: integrate-shell
description: Use when hosting napplets using @napplet/shell — covers createShellBridge(hooks) wiring, minimum viable RuntimeHooks implementation, iframe registration via originRegistry, NIP-42 AUTH challenge, consent handling for destructive signing kinds, and registering a custom service
---
```

### Body structure

Follow this exact section order:

1. **Overview** — One paragraph. Explain what the shell does (acts as a NIP-01 relay to sandboxed napplet iframes, proxies signing/storage/relay, enforces ACL) and what this skill produces (a working `createShellBridge()` integration with minimum viable hooks).

2. **Prerequisites**
   - Node.js 18+, pnpm
   - `nostr-tools` >=2.23.3 available in the host project
   - A Nostr relay pool (e.g., `@nostr-dev-kit/ndk`, `nostr-tools/pool`)
   - A NIP-07 compatible signer (e.g., `window.nostr`, NDK signer, or test signer)

3. **Step 1 — Install**

   ```bash
   pnpm add @napplet/shell nostr-tools
   ```

4. **Step 2 — Implement minimum viable hooks**

   Show the minimum required `ShellHooks` object. Use inline comments to mark which sub-hooks are required vs optional. Base on the `ShellHooks` type from `packages/shell/src/types.ts`.

   Include these required hook groups:
   - `relayPool` — `getRelayPool()`, `trackSubscription()`, `untrackSubscription()`, `openScopedRelay()`, `closeScopedRelay()`, `publishToScopedRelay()`, `isAvailable()`
   - `auth` — `getUserPubkey()`, `getSigner()`
   - `crypto` — `verifyEvent()`, `randomUUID()`
   - `windowManager` — `createWindow()`
   - `config` — `getNappUpdateBehavior()`

   Note that `hotkeys`, `workerRelay`, `relayConfig`, `dm`, persistence hooks, and `services` are optional — point to `packages/shell/src/types.ts` for the full interface.

   Show a realistic stub implementation (not abstract):

   ```ts
   import { createShellBridge, type ShellHooks } from '@napplet/shell';
   import { verifyEvent as _verifyEvent } from 'nostr-tools/pure';

   const hooks: ShellHooks = {
     relayPool: {
       getRelayPool: () => myNdkInstance,        // wrap your relay pool
       trackSubscription: (key, cleanup) => {
         subscriptions.set(key, cleanup);
       },
       untrackSubscription: (key) => {
         subscriptions.get(key)?.();
         subscriptions.delete(key);
       },
       openScopedRelay: (windowId, relayUrl, subId, filters, sourceWindow) => {
         // open NIP-29 scoped relay connection — implement if needed
       },
       closeScopedRelay: (windowId) => {
         // close NIP-29 scoped relay connection
       },
       publishToScopedRelay: (windowId, event) => false, // stub
       isAvailable: () => true,
     },

     auth: {
       getUserPubkey: () => currentUser?.pubkey ?? null,
       getSigner: () => window.nostr ?? null,
     },

     crypto: {
       verifyEvent: async (event) => _verifyEvent(event),
       randomUUID: () => crypto.randomUUID(),
     },

     windowManager: {
       createWindow: (opts) => {
         // open iframe, return windowId string or null
         return openIframe(opts.iframeSrc ?? '') ?? null;
       },
     },

     config: {
       getNappUpdateBehavior: () => 'banner',
     },

     // Optional hooks — omit to disable:
     // hotkeys: { executeHotkeyFromForward: (e) => handleHotkey(e) },
     // workerRelay: { ... },
     // relayConfig: { ... },
     // services: { audio: audioHandler },
   };
   ```

5. **Step 3 — Create the bridge and wire message listener**

   ```ts
   const bridge = createShellBridge(hooks);

   // Wire the global message listener — all postMessage traffic passes through here
   window.addEventListener('message', bridge.handleMessage);
   ```

6. **Step 4 — Register a napplet iframe via originRegistry**

   Show importing `originRegistry` and calling `register()` when an iframe loads. Explain that `windowId` is an arbitrary string the host assigns (e.g., a UUID or element ID).

   ```ts
   import { originRegistry } from '@napplet/shell';

   // Called when your iframe element is ready
   function onIframeLoad(iframe: HTMLIFrameElement, windowId: string) {
     if (!iframe.contentWindow) return;
     originRegistry.register(iframe.contentWindow, windowId);

     // Initiate NIP-42 AUTH handshake
     bridge.sendChallenge(windowId);
   }
   ```

7. **Step 5 — Handle consent for destructive signing kinds**

   Show registering a consent handler for kinds 0, 3, 5, 10002 (metadata, contacts, relay list, NIP-46 relay list). The `resolve` callback approves or denies.

   ```ts
   bridge.registerConsentHandler((request) => {
     const { event, pubkey, resolve } = request;
     // Show a confirmation dialog to the user
     const allowed = confirm(
       `Napplet (${pubkey.slice(0, 8)}...) wants to sign kind ${event.kind}. Allow?`
     );
     resolve(allowed);
   });
   ```

8. **Step 6 — Register a service (optional)**

   Show calling `bridge.runtime.registerService()` with a minimal service descriptor. Point to `skills/add-service/SKILL.md` for full service implementation guidance.

   ```ts
   import { createAudioService } from '@napplet/services';

   // Register audio service so napplets can discover and use it
   bridge.runtime.registerService('audio', createAudioService({
     onChange: (sources) => updateAudioUI(sources),
   }));
   ```

   Note: services can also be provided in `hooks.services` at construction time.

9. **Step 7 — Teardown**

   Show calling `bridge.destroy()` on component unmount / page unload and removing the message listener.

   ```ts
   window.removeEventListener('message', bridge.handleMessage);
   bridge.destroy();
   ```

10. **Common pitfalls**
    - `originRegistry.register()` must be called before `bridge.sendChallenge()`. If the napplet sends messages before registration, the runtime drops them silently.
    - The `relayPool.getRelayPool()` return type must implement the `RelayPoolLike` interface — not the raw NDK or nostr-tools pool object directly. Wrap it with an adapter.
    - `bridge.handleMessage` is an arrow function — pass it directly, do not wrap in another arrow or `this` binding will fail.
    - `crypto.verifyEvent` must return `Promise<boolean>` — wrap synchronous implementations with `Promise.resolve()`.
    - Calling `bridge.destroy()` does not remove the `window.message` listener — always remove it manually before destroying.
    - Consent handler fires for kinds 0, 3, 5, 10002 only. Other signing kinds are approved automatically unless the napplet's ACL denies `sign:event`.

---

## Verification criteria (SKILL-02 acceptance)

- [ ] File exists at `skills/integrate-shell/SKILL.md`
- [ ] YAML frontmatter present with `name` and `description` fields
- [ ] `createShellBridge(hooks)` wiring shown end-to-end
- [ ] All five required hook groups present: `relayPool`, `auth`, `crypto`, `windowManager`, `config`
- [ ] Optional hooks noted with a comment — skill does not over-specify
- [ ] `originRegistry.register()` + `sendChallenge()` pattern shown
- [ ] Consent handler pattern shown with `resolve(boolean)`
- [ ] `registerService()` example present (can be brief)
- [ ] Teardown step present
- [ ] All code blocks use TypeScript with realistic examples
- [ ] File is self-contained — agent can integrate the shell from this file alone

---

*Plan created: 2026-03-31*
*Phase: 26-skills-directory*
