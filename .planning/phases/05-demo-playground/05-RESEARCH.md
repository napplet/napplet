# Phase 5: Demo Playground - Research

**Researched:** 2026-03-30
**Phase:** 05-demo-playground
**Requirements:** DEMO-01, DEMO-02, DEMO-03, DEMO-04, DEMO-05, DEMO-06, DEMO-07

## Technical Approach

### App Structure: `apps/demo/` as Standalone Vite SPA

The demo playground lives in `apps/demo/` as a standalone Vite application, separate from the test infrastructure in `tests/`. This follows the architecture research recommendation (`.planning/research/ARCHITECTURE.md`) to separate demo from tests while sharing infrastructure.

**Key insight:** The demo is NOT a test harness with a UI bolted on. It is a purpose-built interactive application that uses the same SDK packages (`@napplet/shell`, `@napplet/shim`) that consumers would use. The test harness in `tests/e2e/harness/` provides reusable patterns (message tap, mock hooks, napplet loading) but the demo implements its own shell host with real-ish hooks and its own message debugger.

**Monorepo integration:**
- Add `apps/*` to `pnpm-workspace.yaml`
- Demo package at `apps/demo/` with its own `package.json`, `vite.config.ts`
- Demo napplets at `apps/demo/napplets/chat/` and `apps/demo/napplets/bot/`
- Each demo napplet is a separate Vite micro-app built with `@napplet/vite-plugin`

**Confidence:** HIGH -- follows established monorepo patterns and the test napplet structure at `tests/fixtures/napplets/`.

### Reuse from Test Infrastructure

The following test helpers can be directly reused or adapted:

1. **`tests/helpers/message-tap.ts`** (`createMessageTap`, `TappedMessage` interface) -- The demo's debugger consumes the same message tap. The `onMessage` callback and `filter` method are exactly what the live log needs.

2. **`tests/helpers/mock-hooks.ts`** (`createMockHooks`) -- The demo uses mock hooks for offline operation. The existing mock provides real crypto verification (nostr-tools `verifyEvent`), which is essential for the AUTH handshake demo to be genuine.

3. **`tests/e2e/harness/harness.ts`** -- The napplet loading pattern (`loadNapplet` function), origin registry setup, and postMessage proxy pattern are directly reusable. The demo's shell host follows the same pattern but adds UI controls.

4. **`tests/e2e/harness/vite.config.ts`** -- The `serveNapplets` Vite plugin pattern for serving pre-built napplet dist directories can be adapted for the demo's napplet serving.

**What must be new:**
- The debugger web component (`<napplet-debugger>`)
- The ACL control panel UI
- The demo napplets (chat + bot)
- The shell host page with dark terminal aesthetic
- The sequence diagram SVG renderer

### UnoCSS Integration

Per CONTEXT.md D-03, the demo uses UnoCSS for utility CSS (Tailwind-compatible, Vite plugin).

**Setup:**
```bash
pnpm add -D unocss @unocss/preset-uno @unocss/preset-icons --filter @napplet/demo
```

**Vite integration:**
```typescript
import UnoCSS from 'unocss/vite';
import { presetUno, presetIcons } from 'unocss';

export default defineConfig({
  plugins: [
    UnoCSS({
      presets: [presetUno(), presetIcons()],
      theme: {
        colors: {
          neon: { green: '#39ff14', blue: '#00f0ff', pink: '#ff00ff', amber: '#ffbf00' },
          surface: { dark: '#0a0a0f', mid: '#12121a', light: '#1a1a28' },
        },
        fontFamily: {
          mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        },
      },
    }),
  ],
});
```

**Confidence:** HIGH -- UnoCSS Vite plugin is well-documented and zero-config.

### Debugger Web Component Architecture

The `<napplet-debugger>` web component is the most complex new component. Per CONTEXT.md D-08, it has two views:

**1. Live Log Tab:**
- Scrolling list of `TappedMessage` entries
- Color-coded by verb: AUTH=purple, EVENT=green, REQ=blue, OK=gray, EOSE=yellow, CLOSED=red, NOTICE=amber
- Direction arrows: `-->` (napplet->shell), `<--` (shell->napplet)
- Filter controls: by verb, by direction, by napplet
- Auto-scroll with pause/resume
- ACL changes appear as system events with distinct styling (D-10)

**2. Sequence Diagram Tab:**
- Custom SVG swimlane renderer
- Three lanes: Napplet 1 (Chat) | Shell | Napplet 2 (Bot)
- Arrows between lanes for each message
- Color-coded matching the live log
- Auto-extends as new messages arrive

**Implementation approach:**
- Use Shadow DOM for style encapsulation (extractable as `@napplet/devtools` later)
- Internal state managed via simple reactive pattern (no framework)
- Consumes `MessageTap.onMessage()` for real-time updates
- Exposes `tap` property setter for connecting to the shell's message tap

**Confidence:** HIGH for live log, MEDIUM for sequence diagram (SVG layout is non-trivial but bounded in scope).

### Demo Napplets: Chat + Bot

**Chat Napplet (`apps/demo/napplets/chat/`):**
- Imports `@napplet/shim`
- UI: simple message input + message list
- On send: calls `publish()` to relay (exercises relay:write + sign:event)
- Subscribes to incoming messages via `subscribe()` (exercises relay:read)
- Stores chat history via `nappStorage.setItem()` (exercises storage:read + storage:write)
- Also emits messages via `emit('chat:message', ...)` for inter-pane delivery to bot

**Bot Napplet (`apps/demo/napplets/bot/`):**
- Imports `@napplet/shim`
- UI: status display + learned rules list
- Listens via `on('chat:message', callback)` for inter-pane events
- Auto-responds with personality (exercises sign:event for response signing)
- Supports `/teach hello Hi there!` command stored in `nappStorage` (exercises storage operations)
- Responds based on simple rule matching

**Confidence:** HIGH -- both napplets follow the established test napplet pattern (import shim, use API, signal via DOM).

### ACL Control Panel

Per CONTEXT.md D-02 and D-15, the ACL panel provides per-napplet capability toggles with immediate visual effect.

**Implementation:**
- Import `aclStore` from `@napplet/shell` (already exported in shell's `index.ts`)
- For each loaded napplet, display toggles for: `relay:read`, `relay:write`, `sign:event`, `storage:read`, `storage:write`
- Toggle calls `aclStore.grant(pubkey, dTag, hash, capability)` or `aclStore.revoke(pubkey, dTag, hash, capability)`
- Block/unblock button calls `aclStore.block()` / `aclStore.unblock()`
- Changes take effect immediately on the next operation (ACL is checked per-operation in pseudo-relay)

**Key demo scenarios (D-15):**
1. Revoke chat's `relay:write` -> messages compose but never reach relays (visible in debugger as CLOSED/OK false)
2. Block bot -> chat messages stop reaching it via inter-pane
3. Revoke bot's `sign:event` -> bot can hear but can't respond (visible in debugger)
4. Revoke chat's `relay:read` -> can't see incoming messages from relays

**Confidence:** HIGH -- aclStore API is straightforward, effects are immediate.

### Shell Host Page Layout

Per CONTEXT.md D-01:
```
+--------------------------------------------------+
| napplet playground                    [controls]  |
+--------------------------------------------------+
| [Shell Controls: Load/Unload/Block ACL toggles]  |
+-------------------+------------------------------+
|                   |                              |
|  Chat Napplet     |  Protocol Debugger           |
|  [iframe]         |  [Live Log | Sequence]       |
|                   |                              |
|  Bot Napplet      |                              |
|  [iframe]         |                              |
|                   |                              |
+-------------------+------------------------------+
```

Dark terminal aesthetic (D-04): dark backgrounds (`#0a0a0f`), monospace fonts, neon accent colors for message types.

### Vite Dev Server Configuration

The demo's Vite config needs to:
1. Serve the main demo shell page
2. Serve demo napplet dist directories at `/napplets/chat/` and `/napplets/bot/`
3. Set CORS headers for sandboxed iframe loading (same pattern as test harness)
4. Configure UnoCSS plugin

This follows the same pattern as `tests/e2e/harness/vite.config.ts` with the `serveNapplets` custom plugin.

### Production Deployment (Future)

Per CONTEXT.md D-07, production deployment targets nsite infrastructure. This is NOT in Phase 5 scope -- the demo runs locally via Vite dev server. However, the architecture should not preclude future nsite deployment:
- Demo shell page is a static SPA
- Demo napplets are separate static builds
- No server-side logic required

## Validation Architecture

### Dimension 1: Functional Correctness
- Both napplets load and complete AUTH (DEMO-01, DEMO-02)
- Message debugger shows traffic (DEMO-03)
- Inter-pane communication works (DEMO-04)
- ACL toggles produce visible effects (DEMO-05)
- Signer and storage operations visible (DEMO-06, DEMO-07)

### Dimension 2: Integration
- Demo uses published package APIs (@napplet/shell, @napplet/shim, @napplet/vite-plugin)
- Demo napplets built with real vite plugin (real manifests)
- Message tap integration between shell and debugger

### Dimension 3: Edge Cases
- ACL revocation mid-operation
- Bot receives message while chat is blocked
- Storage operations after quota changes
- Multiple rapid ACL toggles

### Dimension 4: Performance
- Message debugger handles 100+ messages without lag
- Sequence diagram renders efficiently
- Napplet iframes load within 2 seconds

### Dimension 5: Regression
- `pnpm build` still works with new apps/ directory
- Existing tests still pass
- No workspace conflicts

### Dimension 6: Security
- Napplet iframes use sandbox="allow-scripts" (no allow-same-origin)
- ACL enforcement verified visually
- Mock hooks don't expose real credentials

### Dimension 7: Developer Experience
- `pnpm dev --filter @napplet/demo` starts the playground
- Hot reload works for shell host changes
- Clear error messages when napplets fail to load

### Dimension 8: Observability
- Message debugger IS the observability tool
- All protocol operations visible in real-time
- ACL state changes logged as system events

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| SVG sequence diagram complexity | Medium | Low | Can ship with live log only, add sequence diagram as enhancement |
| UnoCSS build integration issues | Low | Medium | UnoCSS Vite plugin is mature, well-documented |
| Sandboxed iframe CORS issues | Low | Low | Already solved in test harness |
| Web component browser compat | Low | Low | Shadow DOM v1 is universally supported |
| Demo napplet complexity creep | Medium | Medium | Keep chat/bot simple, resist feature additions |

## Build Order

1. **Wave 1:** Project scaffolding (demo app structure, workspace config, Vite config, UnoCSS setup)
2. **Wave 2:** Shell host + debugger web component (parallel: shell host page, `<napplet-debugger>` live log)
3. **Wave 3:** Demo napplets (parallel: chat napplet, bot napplet) + ACL control panel + sequence diagram
4. **Wave 4:** Integration + polish (wire everything together, dark theme refinement, demo scenarios)

## RESEARCH COMPLETE

---

*Research: 2026-03-30*
*Phase: 05-demo-playground*
