/**
 * shell-bridge.ts — Browser adapter over @napplet/runtime.
 *
 * Thin shell that converts browser MessageEvents into windowId-based
 * messages for the runtime engine. All protocol logic (AUTH, REQ, EVENT,
 * CLOSE, COUNT, signer proxying, shell commands) lives in @napplet/runtime.
 *
 * The only browser-specific concern here is extracting the source Window
 * from a MessageEvent and mapping it to a windowId via originRegistry.
 */

import { createRuntime } from '@napplet/runtime';
import type { Runtime, ConsentHandler } from '@napplet/runtime';
import { adaptHooks } from './hooks-adapter.js';
import { originRegistry } from './origin-registry.js';
import { nappKeyRegistry } from './napp-key-registry.js';
import { aclStore } from './acl-store.js';
import { manifestCache } from './manifest-cache.js';
import { audioManager } from './audio-manager.js';
import type { ShellHooks, ConsentRequest } from './types.js';

// ─── Public interface ────────────────────────────────────────────────────────

/**
 * Shell-side message bridge that handles NIP-01 communication with napplet iframes.
 *
 * The bridge acts as a browser adapter: it receives raw MessageEvents from
 * window.addEventListener('message', ...), extracts the source Window, resolves
 * it to a windowId via originRegistry, and delegates to the runtime engine.
 *
 * @example
 * ```ts
 * import { createShellBridge } from '@napplet/shell';
 *
 * const bridge = createShellBridge(hooks);
 * window.addEventListener('message', bridge.handleMessage);
 * bridge.sendChallenge('window-1');
 * ```
 */
export interface ShellBridge {
  /**
   * Handle an incoming postMessage from a napplet iframe.
   * Dispatches to the appropriate verb handler (EVENT, REQ, CLOSE, COUNT, AUTH).
   *
   * @param event - The raw MessageEvent from window.addEventListener('message', ...)
   * @example
   * ```ts
   * window.addEventListener('message', bridge.handleMessage);
   * ```
   */
  handleMessage(event: MessageEvent): void;

  /**
   * Send a NIP-42 AUTH challenge to a napplet window, initiating the handshake.
   *
   * @param windowId - The window identifier registered via originRegistry
   * @example
   * ```ts
   * bridge.sendChallenge('napp-window-1');
   * ```
   */
  sendChallenge(windowId: string): void;

  /**
   * Inject a shell-originated event into subscription delivery.
   * Used for broadcasting shell state changes (e.g., auth identity) to napplets.
   *
   * @param topic - The event topic tag value (e.g., 'auth:identity-changed')
   * @param payload - The event content, will be JSON.stringify'd
   * @example
   * ```ts
   * bridge.injectEvent('auth:identity-changed', { pubkey: userPubkey });
   * ```
   */
  injectEvent(topic: string, payload: unknown): void;

  /**
   * Destroy the bridge instance, cleaning up all internal state.
   * Persists manifest cache and clears all subscriptions, buffers, and registries.
   * Call when the shell is shutting down or the bridge is no longer needed.
   *
   * @example
   * ```ts
   * bridge.destroy();
   * ```
   */
  destroy(): void;

  /**
   * Register a handler for consent requests on destructive signing kinds.
   * Called when a napplet requests signing for kinds 0, 3, 5, or 10002.
   *
   * @param handler - Callback receiving the consent request with a resolve function
   * @example
   * ```ts
   * bridge.registerConsentHandler((request) => {
   *   const allowed = confirm(`Allow signing kind ${request.event.kind}?`);
   *   request.resolve(allowed);
   * });
   * ```
   */
  registerConsentHandler(handler: (request: ConsentRequest) => void): void;

  /**
   * Access the underlying runtime instance for advanced use cases.
   * Provides direct access to the runtime's nappKeyRegistry, aclState,
   * and manifestCache.
   */
  readonly runtime: Runtime;
}

/**
 * Create a ShellBridge instance with dependency injection via hooks.
 *
 * Internally creates a Runtime from @napplet/runtime and adapts the
 * browser-oriented ShellHooks into environment-agnostic RuntimeHooks.
 *
 * @param hooks - Host application provides relay pool, auth, config, etc.
 * @returns A ShellBridge instance ready to handle napp messages
 * @example
 * ```ts
 * import { createShellBridge, type ShellHooks } from '@napplet/shell';
 *
 * const hooks: ShellHooks = {
 *   relayPool: myRelayPoolHooks,
 *   relayConfig: myRelayConfigHooks,
 *   windowManager: myWindowManagerHooks,
 *   auth: myAuthHooks,
 *   config: myConfigHooks,
 *   hotkeys: myHotkeyHooks,
 *   workerRelay: myWorkerRelayHooks,
 *   crypto: myCryptoHooks,
 * };
 * const bridge = createShellBridge(hooks);
 * ```
 */
export function createShellBridge(hooks: ShellHooks): ShellBridge {
  const runtimeHooks = adaptHooks(hooks, {
    originRegistry,
    manifestCache,
    aclStore,
    audioManager,
    nappKeyRegistry,
  });

  const runtime: Runtime = createRuntime(runtimeHooks);

  return {
    handleMessage(event: MessageEvent): void {
      const sourceWindow = event.source as Window | null;
      if (!sourceWindow) return;
      const windowId = originRegistry.getWindowId(sourceWindow);
      if (!windowId) return;
      const msg = event.data;
      if (!Array.isArray(msg) || msg.length < 2) return;
      // Delegate to runtime — runtime handles verb dispatch, AUTH, queueing
      runtime.handleMessage(windowId, msg);
    },

    sendChallenge(windowId: string): void {
      runtime.sendChallenge(windowId);
    },

    injectEvent(topic: string, payload: unknown): void {
      runtime.injectEvent(topic, payload);
    },

    destroy(): void {
      runtime.destroy();
    },

    registerConsentHandler(handler: (request: ConsentRequest) => void): void {
      runtime.registerConsentHandler(handler as ConsentHandler);
    },

    get runtime() {
      return runtime;
    },
  };
}
