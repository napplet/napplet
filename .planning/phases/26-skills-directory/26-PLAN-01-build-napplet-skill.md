# Plan 01: Create `skills/build-napplet/SKILL.md`

**Phase:** 26 — Skills Directory
**Requirement:** SKILL-01
**Goal:** Produce an agentskills.io-format skill file that lets an AI agent (or developer) write a working napplet using `@napplet/shim` without reading the full spec first.

---

## Pre-flight checklist

Before starting, read these files:

- `packages/shim/src/index.ts` — all exported symbols and their signatures
- `packages/shim/src/relay-shim.ts` — `subscribe`, `publish`, `query` signatures
- `packages/shim/src/state-shim.ts` — `nappState`, `nappStorage` API
- `packages/shim/src/discovery-shim.ts` — `discoverServices`, `hasService`, `hasServiceVersion`
- `packages/vite-plugin/src/index.ts` — `nip5aManifest({ nappType, requires? })` options
- `/home/sandwich/.claude/plugins/cache/claude-plugins-official/superpowers/5.0.6/skills/using-git-worktrees/SKILL.md` — format reference (frontmatter structure, section order, tone)

---

## Output

Create the file: `skills/build-napplet/SKILL.md`

Parent directory `skills/build-napplet/` must be created if absent.

---

## Content specification

### Frontmatter (YAML)

```yaml
---
name: build-napplet
description: Use when writing a napplet (sandboxed Nostr iframe app) using @napplet/shim — covers Vite project setup, NIP-5A manifest plugin, subscribe/publish/query relay API, nappStorage, window.nostr NIP-07 proxy, inter-pane events, and service discovery
---
```

### Body structure

Follow this exact section order:

1. **Overview** — One paragraph. Explain what a napplet is (sandboxed iframe, postMessage NIP-01 wire format, delegates signing/storage/relay to host shell), what this skill produces (a working napplet), and the key constraint (no `allow-same-origin`; all host access is proxied).

2. **Prerequisites**
   - Node.js 18+, pnpm (or npm/yarn)
   - A Vite-based project (create with `pnpm create vite`)
   - Host shell running `@napplet/shell` (or test harness)

3. **Step 1 — Install dependencies**

   ```bash
   pnpm add @napplet/shim
   pnpm add -D @napplet/vite-plugin
   ```

4. **Step 2 — Configure the Vite plugin**

   Show `vite.config.ts` adding `nip5aManifest({ nappType: 'my-napplet' })`. Include the optional `requires` field with a comment. Use exact option names from `Nip5aManifestOptions` in `packages/vite-plugin/src/index.ts`.

   ```ts
   import { defineConfig } from 'vite';
   import { nip5aManifest } from '@napplet/vite-plugin';

   export default defineConfig({
     plugins: [
       nip5aManifest({
         nappType: 'my-napplet',
         // requires: ['audio', 'notifications'], // optional: declared service deps
       }),
     ],
   });
   ```

5. **Step 3 — Subscribe to relay events**

   Show importing `subscribe` from `@napplet/shim` and creating a subscription with a NostrFilter. Show the `close()` teardown. Include the `onEose` callback signature. Use realistic filter (e.g., `{ kinds: [1], authors: [pubkey], limit: 20 }`).

   ```ts
   import { subscribe } from '@napplet/shim';

   const sub = subscribe(
     { kinds: [1], authors: [myPubkey], limit: 20 },
     (event) => {
       console.log('received event:', event.id);
     },
     () => {
       console.log('EOSE — historical events loaded');
     },
   );

   // Teardown:
   sub.close();
   ```

6. **Step 4 — Publish an event**

   Show importing `publish` from `@napplet/shim` and calling it with an `EventTemplate`. Note that signing is delegated to the shell signer — the napplet does not hold keys.

   ```ts
   import { publish } from '@napplet/shim';

   const event = await publish({
     kind: 1,
     tags: [],
     content: 'hello from napplet',
     created_at: Math.floor(Date.now() / 1000),
   });
   console.log('published:', event.id);
   ```

7. **Step 5 — Query cached events**

   Show `query()` returning `Promise<NostrEvent[]>` from the local cache.

   ```ts
   import { query } from '@napplet/shim';

   const events = await query({ kinds: [1], limit: 50 });
   ```

8. **Step 6 — Use nappStorage (scoped key-value)**

   Show `nappStorage.getItem`, `nappStorage.setItem`, `nappStorage.removeItem`. Note that storage is scoped by `nappType:aggregateHash` — different napplet versions have isolated storage.

   ```ts
   import { nappStorage } from '@napplet/shim';

   await nappStorage.setItem('prefs', JSON.stringify({ theme: 'dark' }));
   const raw = await nappStorage.getItem('prefs');
   const prefs = raw ? JSON.parse(raw) : {};
   ```

9. **Step 7 — Use window.nostr (NIP-07 proxy)**

   Show that `window.nostr` is installed automatically by `@napplet/shim`. Demonstrate `getPublicKey()` and `signEvent()`. Note that signing calls are proxied to the shell signer — the napplet never sees the private key.

   ```ts
   // window.nostr is installed automatically by @napplet/shim
   const pubkey = await window.nostr.getPublicKey();
   const signed = await window.nostr.signEvent({
     kind: 1,
     tags: [],
     content: 'hello',
     created_at: Math.floor(Date.now() / 1000),
   });
   ```

10. **Step 8 — Inter-pane events (`emit` / `on`)**

    Show broadcasting a topic event to sibling napplets and subscribing to one.

    ```ts
    import { emit, on } from '@napplet/shim';

    // Broadcast to all napplets listening on 'profile:open'
    emit('profile:open', [], JSON.stringify({ pubkey }));

    // Subscribe to a topic from any napplet
    const sub = on('profile:open', (payload) => {
      console.log('Profile open requested:', payload.pubkey);
    });
    sub.close(); // teardown
    ```

11. **Step 9 — Service discovery**

    Show importing and calling `discoverServices`, `hasService`, `hasServiceVersion`. Note that these query the shell and return a Promise.

    ```ts
    import { discoverServices, hasService, hasServiceVersion } from '@napplet/shim';

    const services = await discoverServices();
    // [{ name: 'audio', version: '1.0.0', description: '...' }, ...]

    if (await hasService('audio')) {
      console.log('audio service available');
    }

    if (await hasServiceVersion('audio', '1.0.0')) {
      emit('audio:register', [], JSON.stringify({ nappClass: 'music', title: 'My Player' }));
    }
    ```

12. **Common pitfalls**
    - Do not call `window.nostr` before the shim initializes — it is available synchronously on load, but signer requests are async.
    - `nappStorage` is scoped by version hash — clearing storage requires the exact same build.
    - Do not use `localStorage` directly — there is no `allow-same-origin`, so it will throw.
    - The Vite plugin requires `VITE_DEV_PRIVKEY_HEX` for signed manifests in CI. Dev builds work without it (no-op).
    - `publish()` returns a `Promise<NostrEvent>` — always await it. Errors surface as rejections.

---

## Verification criteria (SKILL-01 acceptance)

- [ ] File exists at `skills/build-napplet/SKILL.md`
- [ ] YAML frontmatter present with `name` and `description` fields
- [ ] All 9 API surfaces covered: vite-plugin, subscribe, publish, query, nappStorage, window.nostr, emit, on, discoverServices/hasService/hasServiceVersion
- [ ] All code blocks use TypeScript with realistic (non-abstract) examples
- [ ] Common pitfalls section present with at least 3 items
- [ ] No broken API references — all function names match actual exports from `packages/shim/src/index.ts`
- [ ] No framework dependencies in the code examples (no Svelte/React/Vue)
- [ ] File is self-contained — agent can implement a napplet from this file alone without reading READMEs

---

*Plan created: 2026-03-31*
*Phase: 26-skills-directory*
