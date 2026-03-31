/**
 * runtime.ts — The napplet protocol engine factory.
 *
 * createRuntime(hooks) creates the complete protocol engine that handles
 * all five NIP-01 verbs (EVENT, REQ, CLOSE, COUNT, AUTH), subscription
 * lifecycle, AUTH handshake, signer proxying, and shell command routing.
 *
 * No browser APIs. No DOM. No localStorage. No postMessage.
 * All I/O is delegated to RuntimeHooks.
 */

import type { NostrEvent, NostrFilter, Capability } from '@napplet/core';
import {
  AUTH_KIND, SHELL_BRIDGE_URI,
  BusKind, ALL_CAPABILITIES,
} from '@napplet/core';

// Timer globals are available in all JS runtimes (Node.js, Deno, Bun, browsers)
// but not included in the ES2022 lib. Declare them to avoid needing DOM lib.
declare function setTimeout(callback: () => void, ms: number): unknown;
declare function clearTimeout(id: unknown): void;
import type {
  RuntimeHooks, NappKeyEntry, ConsentRequest, ConsentHandler,
} from './types.js';
import { createNappKeyRegistry } from './napp-key-registry.js';
import type { NappKeyRegistry } from './napp-key-registry.js';
import { createAclState } from './acl-state.js';
import type { AclStateContainer } from './acl-state.js';
import { createManifestCache } from './manifest-cache.js';
import type { ManifestCache } from './manifest-cache.js';
import { createReplayDetector } from './replay.js';
import { createEventBuffer, matchesAnyFilter } from './event-buffer.js';
import type { SubscriptionEntry } from './event-buffer.js';
import { createEnforceGate, resolveCapabilities, formatDenialReason } from './enforce.js';
import { handleStateRequest } from './state-handler.js';

// ─── Runtime Interface ─────────────────────────────────────────────────────

/**
 * The napplet protocol engine — handles all NIP-01 verb dispatch,
 * AUTH handshake, ACL enforcement, subscription lifecycle.
 *
 * @example
 * ```ts
 * import { createRuntime } from '@napplet/runtime';
 *
 * const runtime = createRuntime(hooks);
 * runtime.handleMessage('window-1', ['REQ', 'sub1', { kinds: [1] }]);
 * ```
 */
export interface Runtime {
  /**
   * Handle an incoming NIP-01 message from a napplet.
   * The caller is responsible for identifying the source (windowId).
   *
   * @param windowId - The identifier of the napplet that sent the message
   * @param msg - The raw NIP-01 message array
   */
  handleMessage(windowId: string, msg: unknown[]): void;

  /**
   * Send a NIP-42 AUTH challenge to a napplet window.
   *
   * @param windowId - The window identifier
   */
  sendChallenge(windowId: string): void;

  /**
   * Inject a shell-originated event into subscription delivery.
   *
   * @param topic - The event topic tag value
   * @param payload - The event content
   */
  injectEvent(topic: string, payload: unknown): void;

  /** Destroy the runtime, persisting state and clearing all internal state. */
  destroy(): void;

  /** Register a handler for consent requests on destructive signing kinds. */
  registerConsentHandler(handler: ConsentHandler): void;

  /** Access the identity registry (for shell adapter to read napp state). */
  readonly nappKeyRegistry: NappKeyRegistry;

  /** Access the ACL state container. */
  readonly aclState: AclStateContainer;

  /** Access the manifest cache. */
  readonly manifestCache: ManifestCache;
}

// ─── Factory ───────────────────────────────────────────────────────────────

/**
 * Create a runtime instance with dependency injection via hooks.
 *
 * @param hooks - Host application provides relay pool, auth, config, etc.
 * @returns A Runtime instance ready to handle napp messages
 *
 * @example
 * ```ts
 * const runtime = createRuntime(hooks);
 * // On incoming message from napplet:
 * runtime.handleMessage(windowId, msg);
 * ```
 */
export function createRuntime(hooks: RuntimeHooks): Runtime {
  // ─── Module-level state ──────────────────────────────────────────────────

  const pendingChallenges = new Map<string, string>();
  const subscriptions = new Map<string, SubscriptionEntry>();
  const pendingAuthQueue = new Map<string, Array<{ msg: unknown[]; windowId: string }>>();
  const authInFlight = new Set<string>();
  let _consentHandler: ConsentHandler | null = null;

  // ─── Sub-module instances ────────────────────────────────────────────────

  const nappKeyRegistry = createNappKeyRegistry(hooks.onPendingUpdate);
  const aclState = createAclState(hooks.aclPersistence);
  const manifestCache = createManifestCache(hooks.manifestPersistence);
  const replayDetector = createReplayDetector();

  const enforce = createEnforceGate({
    checkAcl: (pubkey, dTag, aggregateHash, capability) =>
      aclState.check(pubkey, dTag, aggregateHash, capability),
    resolveIdentity: (pubkey) => {
      const entry = nappKeyRegistry.getEntry(pubkey);
      return entry ? { dTag: entry.dTag, aggregateHash: entry.aggregateHash } : undefined;
    },
    onAclCheck: hooks.onAclCheck,
  });

  const eventBuffer = createEventBuffer(
    hooks.sendToNapplet,
    nappKeyRegistry,
    enforce,
    subscriptions,
  );

  // Load persisted state
  aclState.load();
  manifestCache.load();

  // ─── Verb handlers ───────────────────────────────────────────────────────

  function dispatchVerb(verb: unknown, msg: unknown[], windowId: string): void {
    switch (verb) {
      case 'EVENT': handleEvent(msg, windowId); break;
      case 'REQ': handleReq(msg, windowId); break;
      case 'CLOSE': handleClose(msg, windowId); break;
      case 'COUNT': handleCount(msg, windowId); break;
    }
  }

  async function handleAuth(msg: unknown[], windowId: string): Promise<void> {
    const authEvent = msg[1] as NostrEvent | undefined;
    if (!authEvent || typeof authEvent !== 'object') return;
    const eventId = authEvent.id ?? '';

    function sendOkFail(reason: string): void {
      hooks.sendToNapplet(windowId, ['OK', eventId, false, `auth-required: ${reason}`]);
    }

    function rejectAuth(reason: string): void {
      const queue = pendingAuthQueue.get(windowId);
      const queueSize = queue?.length ?? 0;
      pendingAuthQueue.delete(windowId);
      sendOkFail(reason);
      if (queueSize > 0) {
        hooks.sendToNapplet(windowId, ['NOTICE', `${queueSize} queued message(s) dropped due to auth failure`]);
      }
    }

    if (authEvent.kind !== AUTH_KIND) { rejectAuth('event kind must be 22242'); return; }

    const challengeTag = authEvent.tags?.find((t) => t[0] === 'challenge');
    const pendingChallenge = pendingChallenges.get(windowId);
    if (!challengeTag || challengeTag[1] !== pendingChallenge) { rejectAuth('challenge mismatch'); return; }

    const relayTag = authEvent.tags?.find((t) => t[0] === 'relay');
    if (!relayTag || relayTag[1] !== SHELL_BRIDGE_URI) { rejectAuth('relay tag must be napplet://shell'); return; }

    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - authEvent.created_at) > 60) { rejectAuth('event created_at too far from now'); return; }

    authInFlight.add(windowId);
    let sigValid: boolean;
    try { sigValid = await hooks.crypto.verifyEvent(authEvent); }
    finally { authInFlight.delete(windowId); }
    if (!sigValid) { rejectAuth('invalid signature'); return; }

    const typeTag = authEvent.tags?.find((t) => t[0] === 'type');
    if (!typeTag) { rejectAuth('missing required type tag'); return; }
    const nappType = typeTag[1];
    const dTag = parseInt(authEvent.pubkey.slice(0, 8), 16).toString(36) + nappType;
    const hashTag = authEvent.tags?.find((t) => t[0] === 'aggregateHash');
    if (!hashTag) { rejectAuth('missing required aggregateHash tag'); return; }
    const aggregateHash = hashTag[1];

    const entry: NappKeyEntry = {
      pubkey: authEvent.pubkey, windowId, origin: '*',
      type: nappType, dTag, aggregateHash, registeredAt: Date.now(),
    };

    // Check for napp updates
    const previousCacheEntry = manifestCache.get(authEvent.pubkey, dTag);
    const isUpdate = previousCacheEntry
      && previousCacheEntry.aggregateHash !== aggregateHash
      && previousCacheEntry.aggregateHash !== '';

    if (isUpdate) {
      const updateBehavior = hooks.config.getNappUpdateBehavior();
      if (updateBehavior === 'banner') {
        nappKeyRegistry.setPendingUpdate(windowId, {
          windowId, pubkey: authEvent.pubkey, dTag,
          oldHash: previousCacheEntry!.aggregateHash, newHash: aggregateHash,
          resolve: (action) => {
            if (action === 'accept') {
              manifestCache.set({ pubkey: authEvent.pubkey, dTag, aggregateHash, verifiedAt: Date.now() });
              nappKeyRegistry.register(windowId, entry);
              nappKeyRegistry.clearPendingUpdate(windowId);
              const queued = pendingAuthQueue.get(windowId);
              pendingAuthQueue.delete(windowId);
              if (queued) for (const { msg: qMsg } of queued) dispatchVerb(qMsg[0], qMsg, windowId);
            } else {
              pendingAuthQueue.delete(windowId);
              nappKeyRegistry.clearPendingUpdate(windowId);
              hooks.sendToNapplet(windowId, ['OK', eventId, false, 'blocked: update rejected']);
            }
          },
        });
        pendingChallenges.delete(windowId);
        hooks.sendToNapplet(windowId, ['OK', eventId, true, '']);
        return;
      }
      if (updateBehavior === 'auto-grant') {
        const oldAcl = aclState.getEntry(authEvent.pubkey, dTag, previousCacheEntry!.aggregateHash);
        if (oldAcl) for (const cap of oldAcl.capabilities) aclState.grant(authEvent.pubkey, dTag, aggregateHash, cap as Capability);
      }
      manifestCache.set({ pubkey: authEvent.pubkey, dTag, aggregateHash, verifiedAt: Date.now() });
    }

    if (aggregateHash && !manifestCache.has(authEvent.pubkey, dTag, aggregateHash)) {
      manifestCache.set({ pubkey: authEvent.pubkey, dTag, aggregateHash, verifiedAt: Date.now() });
    }

    nappKeyRegistry.register(windowId, entry);
    pendingChallenges.delete(windowId);
    hooks.sendToNapplet(windowId, ['OK', eventId, true, '']);

    const queued = pendingAuthQueue.get(windowId);
    pendingAuthQueue.delete(windowId);
    if (queued) for (const { msg: qMsg } of queued) dispatchVerb(qMsg[0], qMsg, windowId);

    const userPubkey = hooks.auth.getUserPubkey();
    if (userPubkey) runtimeInstance.injectEvent('auth:identity-changed', { pubkey: userPubkey });
  }

  function handleEvent(msg: unknown[], windowId: string): void {
    const event = msg[1] as NostrEvent | undefined;
    if (!event || typeof event !== 'object') return;
    const eventId = event.id ?? '';

    function sendOk(success: boolean, reason: string): void {
      hooks.sendToNapplet(windowId, ['OK', eventId, success, reason]);
    }

    const pubkey = nappKeyRegistry.getPubkey(windowId);
    if (!pubkey) { sendOk(false, 'auth-required: complete AUTH first'); return; }

    const replayResult = replayDetector.check(event);
    if (replayResult !== null) { sendOk(false, replayResult); return; }

    // Resolve and enforce the required capability for this message
    const caps = resolveCapabilities(msg);
    if (caps.senderCap) {
      const result = enforce(pubkey, caps.senderCap);
      if (!result.allowed) { sendOk(false, formatDenialReason(result.capability)); return; }
    }

    switch (event.kind) {
      case BusKind.SIGNER_REQUEST:
        handleSignerRequest(event, windowId, pubkey);
        return;
      case BusKind.HOTKEY_FORWARD:
        try { handleHotkeyForward(event); } catch { /* Best-effort hotkey forwarding */ }
        break;
      case BusKind.INTER_PANE: {
        const topic = event.tags?.find((t) => t[0] === 't')?.[1];
        if (topic?.startsWith('shell:state-')) {
          handleStateRequest(windowId, event, hooks.sendToNapplet, nappKeyRegistry, aclState, hooks.statePersistence);
          return;
        }
        if (topic?.startsWith('shell:audio-')) {
          // Audio events are forwarded as inter-pane events — the runtime
          // does not manage audio state (that stays in the shell adapter)
          eventBuffer.bufferAndDeliver(event, windowId);
          break;
        }
        if (topic?.startsWith('shell:') || topic === 'shell:create-window' || topic === 'shell:send-dm') {
          handleShellCommand(event, windowId, topic!);
          return;
        }
        eventBuffer.bufferAndDeliver(event, windowId);
        break;
      }
      default:
        eventBuffer.bufferAndDeliver(event, windowId);
        break;
    }
    sendOk(true, '');
  }

  function handleReq(msg: unknown[], windowId: string): void {
    const subId = msg[1] as string | undefined;
    if (typeof subId !== 'string') return;
    const filters = (msg.slice(2) as NostrFilter[]) ?? [];
    const pubkey = nappKeyRegistry.getPubkey(windowId);
    if (!pubkey) { hooks.sendToNapplet(windowId, ['CLOSED', subId, 'auth-required']); return; }
    {
      const result = enforce(pubkey, 'relay:read');
      if (!result.allowed) { hooks.sendToNapplet(windowId, ['CLOSED', subId, formatDenialReason(result.capability)]); return; }
    }

    const subKey = `${windowId}:${subId}`;
    subscriptions.set(subKey, { windowId, filters });

    const seenIds = new Set<string>();
    function deliver(event: NostrEvent): void {
      if (seenIds.has(event.id)) return;
      seenIds.add(event.id);
      if (subscriptions.has(subKey)) hooks.sendToNapplet(windowId, ['EVENT', subId, event]);
    }

    // Replay buffered events
    for (const bufferedEvent of eventBuffer.getBufferedEvents()) {
      if (matchesAnyFilter(bufferedEvent, filters)) deliver(bufferedEvent);
    }

    const isBusKind = filters.every((f) => f.kinds?.every((k) => k >= 29000 && k < 30000));

    // Query local cache
    if (hooks.cache.isAvailable() && !isBusKind) {
      hooks.cache.query(filters)
        .then((cachedEvents) => { for (const event of cachedEvents) deliver(event); })
        .catch(() => { /* Cache query is best-effort */ });
    }

    // Subscribe to relay pool
    if (hooks.relayPool.isAvailable() && !isBusKind) {
      const relayUrls = hooks.relayPool.selectRelayTier(filters);
      let eoseSent = false;
      const eoseFallbackTimer = setTimeout(() => {
        if (!eoseSent) { eoseSent = true; hooks.sendToNapplet(windowId, ['EOSE', subId]); }
      }, 15_000);

      const subscription = hooks.relayPool.subscribe(filters, (item) => {
        if (item === 'EOSE') {
          clearTimeout(eoseFallbackTimer);
          if (!eoseSent) { eoseSent = true; hooks.sendToNapplet(windowId, ['EOSE', subId]); }
          return;
        }
        const event = item as NostrEvent;
        deliver(event);
        if (hooks.cache.isAvailable() && !isBusKind) {
          try { hooks.cache.store(event); } catch { /* Cache write is best-effort */ }
        }
      }, relayUrls);

      hooks.relayPool.trackSubscription(subKey, () => {
        clearTimeout(eoseFallbackTimer);
        subscription.unsubscribe();
      });
    } else if (!isBusKind) {
      hooks.sendToNapplet(windowId, ['EOSE', subId]);
    }
  }

  function handleClose(msg: unknown[], windowId: string): void {
    const subId = msg[1] as string | undefined;
    if (typeof subId !== 'string') return;
    const subKey = `${windowId}:${subId}`;
    subscriptions.delete(subKey);
    hooks.relayPool.untrackSubscription(subKey);
  }

  function handleCount(msg: unknown[], windowId: string): void {
    const countId = msg[1] as string | undefined;
    if (typeof countId !== 'string') return;
    const filters = (msg.slice(2) as NostrFilter[]) ?? [];
    const pubkey = nappKeyRegistry.getPubkey(windowId);
    if (!pubkey) { hooks.sendToNapplet(windowId, ['CLOSED', countId, 'auth-required']); return; }
    {
      const result = enforce(pubkey, 'relay:read');
      if (!result.allowed) { hooks.sendToNapplet(windowId, ['CLOSED', countId, formatDenialReason(result.capability)]); return; }
    }
    let count = 0;
    for (const event of eventBuffer.getBufferedEvents()) {
      if (matchesAnyFilter(event, filters)) count++;
    }
    hooks.sendToNapplet(windowId, ['COUNT', countId, { count }]);
  }

  // ─── Signer Request Handler ──────────────────────────────────────────────

  function handleSignerRequest(event: NostrEvent, windowId: string, pubkey: string): void {
    const corrId = event.tags?.find((t) => t[0] === 'id')?.[1] ?? event.id;
    const method = event.tags?.find((t) => t[0] === 'method')?.[1];

    function sendOk(success: boolean, reason: string): void {
      hooks.sendToNapplet(windowId, ['OK', event.id, success, reason]);
    }

    const maybeSigner = hooks.auth.getSigner();
    if (!maybeSigner) { sendOk(false, 'error: no signer configured'); return; }
    const signer = maybeSigner;

    function dispatch(eventToSign: NostrEvent | null): void {
      const signerPromise: Promise<unknown> = (() => {
        switch (method) {
          case 'getPublicKey': return Promise.resolve(signer.getPublicKey?.());
          case 'signEvent': return eventToSign ? (signer.signEvent?.(eventToSign) ?? Promise.resolve(null)) : Promise.resolve(null);
          case 'getRelays': return Promise.resolve(signer.getRelays?.() ?? {});
          case 'nip04.encrypt': { const p = event.tags?.find((t) => t[0] === 'params'); return signer.nip04?.encrypt(p?.[1] ?? '', p?.[2] ?? '') ?? Promise.resolve(''); }
          case 'nip04.decrypt': { const p = event.tags?.find((t) => t[0] === 'params'); return signer.nip04?.decrypt(p?.[1] ?? '', p?.[2] ?? '') ?? Promise.resolve(''); }
          case 'nip44.encrypt': { const p = event.tags?.find((t) => t[0] === 'params'); return signer.nip44?.encrypt(p?.[1] ?? '', p?.[2] ?? '') ?? Promise.resolve(''); }
          case 'nip44.decrypt': { const p = event.tags?.find((t) => t[0] === 'params'); return signer.nip44?.decrypt(p?.[1] ?? '', p?.[2] ?? '') ?? Promise.resolve(''); }
          default: return Promise.reject(new Error(`Unknown signer method: ${method}`));
        }
      })();

      signerPromise.then((result) => {
        const responseEvent: Partial<NostrEvent> = {
          kind: BusKind.SIGNER_RESPONSE, pubkey,
          created_at: Math.floor(Date.now() / 1000),
          tags: [['id', corrId], ['method', method ?? ''], ['result', JSON.stringify(result)]],
          content: '',
        };
        eventBuffer.deliverToSubscriptions(responseEvent as NostrEvent, null);
        sendOk(true, '');
      }).catch((err: unknown) => {
        sendOk(false, `error: ${(err as Error).message ?? 'signing failed'}`);
      });
    }

    const eventTag = event.tags?.find((t) => t[0] === 'event')?.[1];
    if (method === 'signEvent' && eventTag) {
      let eventToSign: NostrEvent;
      try { eventToSign = JSON.parse(eventTag) as NostrEvent; } catch { sendOk(false, 'error: invalid event JSON'); return; }
      if (aclState.requiresPrompt(eventToSign.kind) && _consentHandler) {
        new Promise<boolean>((resolve) => {
          _consentHandler!({ windowId, pubkey, event: eventToSign, resolve });
        }).then((allowed) => {
          if (!allowed) { sendOk(false, 'error: user rejected'); return; }
          dispatch(eventToSign);
        }).catch(() => { sendOk(false, 'error: consent check failed'); });
        return;
      }
      dispatch(eventToSign);
      return;
    }
    dispatch(null);
  }

  // ─── Hotkey Forward Handler ──────────────────────────────────────────────

  function handleHotkeyForward(event: NostrEvent): void {
    const keyData = {
      key: event.tags?.find((t) => t[0] === 'key')?.[1] ?? '',
      code: event.tags?.find((t) => t[0] === 'code')?.[1] ?? '',
      ctrlKey: event.tags?.find((t) => t[0] === 'ctrl')?.[1] === '1',
      altKey: event.tags?.find((t) => t[0] === 'alt')?.[1] === '1',
      shiftKey: event.tags?.find((t) => t[0] === 'shift')?.[1] === '1',
      metaKey: event.tags?.find((t) => t[0] === 'meta')?.[1] === '1',
    };
    hooks.hotkeys.executeHotkeyFromForward(keyData);
  }

  // ─── Shell Command Handler ───────────────────────────────────────────────

  function handleShellCommand(event: NostrEvent, windowId: string, topic: string): void {
    function sendOk(success: boolean, reason: string): void {
      hooks.sendToNapplet(windowId, ['OK', event.id, success, reason]);
    }

    function sendInterPaneReply(replyTopic: string, content: string): void {
      const responseEvent: Partial<NostrEvent> = {
        kind: BusKind.INTER_PANE, pubkey: '',
        created_at: Math.floor(Date.now() / 1000),
        tags: [['t', replyTopic]], content, id: '', sig: '',
      };
      hooks.sendToNapplet(windowId, ['EVENT', '__shell__', responseEvent]);
      sendOk(true, '');
    }

    switch (topic) {
      case 'shell:acl-get': {
        const aclEntries = aclState.getAllEntries();
        const nappEntries = nappKeyRegistry.getAllEntries();
        const nappInfoMap: Record<string, { type: string; registeredAt: number }> = {};
        for (const e of nappEntries) nappInfoMap[e.pubkey] = { type: e.type, registeredAt: e.registeredAt };
        const merged = [...aclEntries];
        for (const e of nappEntries) {
          if (!merged.find((a) => a.pubkey === e.pubkey)) {
            merged.push({ pubkey: e.pubkey, capabilities: [...ALL_CAPABILITIES], blocked: false });
          }
        }
        const display = merged.map((e) => ({
          ...e, type: nappInfoMap[e.pubkey]?.type ?? 'unknown',
          registeredAt: nappInfoMap[e.pubkey]?.registeredAt ?? 0,
        }));
        sendInterPaneReply('shell:acl-current', JSON.stringify({ entries: display }));
        break;
      }
      case 'shell:acl-revoke': case 'shell:acl-grant': case 'shell:acl-block': case 'shell:acl-unblock': {
        const pk = event.tags?.find((t) => t[0] === 'pubkey')?.[1];
        const cap = event.tags?.find((t) => t[0] === 'cap')?.[1];
        if (!pk) { sendOk(false, 'error: missing pubkey tag'); break; }
        const ne = nappKeyRegistry.getEntry(pk);
        if (topic === 'shell:acl-revoke' && cap) aclState.revoke(pk, ne?.dTag ?? '', ne?.aggregateHash ?? '', cap as Capability);
        else if (topic === 'shell:acl-grant' && cap) aclState.grant(pk, ne?.dTag ?? '', ne?.aggregateHash ?? '', cap as Capability);
        else if (topic === 'shell:acl-block') aclState.block(pk, ne?.dTag ?? '', ne?.aggregateHash ?? '');
        else if (topic === 'shell:acl-unblock') aclState.unblock(pk, ne?.dTag ?? '', ne?.aggregateHash ?? '');
        aclState.persist();
        const ae = aclState.getEntry(pk, ne?.dTag ?? '', ne?.aggregateHash ?? '');
        sendInterPaneReply('shell:acl-current', JSON.stringify({ entries: ae ? [ae] : [] }));
        break;
      }
      case 'shell:relay-get':
        sendInterPaneReply('shell:relay-current', JSON.stringify(hooks.relayConfig.getRelayConfig()));
        break;
      case 'shell:relay-add': {
        const tier = event.tags?.find((t) => t[0] === 'tier')?.[1];
        const url = event.tags?.find((t) => t[0] === 'url')?.[1];
        if (tier && url) { hooks.relayConfig.addRelay(tier, url); sendInterPaneReply('shell:relay-current', JSON.stringify(hooks.relayConfig.getRelayConfig())); }
        else sendOk(false, 'error: missing tier/url');
        break;
      }
      case 'shell:relay-remove': {
        const tier = event.tags?.find((t) => t[0] === 'tier')?.[1];
        const url = event.tags?.find((t) => t[0] === 'url')?.[1];
        if (tier && url) { hooks.relayConfig.removeRelay(tier, url); sendInterPaneReply('shell:relay-current', JSON.stringify(hooks.relayConfig.getRelayConfig())); }
        else sendOk(false, 'error: missing tier/url');
        break;
      }
      case 'shell:relay-nip66':
        sendInterPaneReply('shell:relay-nip66-data', JSON.stringify(hooks.relayConfig.getNip66Suggestions()));
        break;
      case 'shell:relay-scoped-connect': {
        const url = event.tags?.find((t) => t[0] === 'url')?.[1];
        const subId = event.tags?.find((t) => t[0] === 'sub-id')?.[1];
        const filtersTag = event.tags?.find((t) => t[0] === 'filters')?.[1];
        if (!url || !subId || !filtersTag) { sendOk(false, 'error: missing tags'); break; }
        try {
          const filters = JSON.parse(filtersTag) as NostrFilter[];
          hooks.relayPool.openScopedRelay(windowId, url, subId, filters, hooks.sendToNapplet);
          sendOk(true, '');
        } catch { sendOk(false, 'error: invalid filters'); }
        break;
      }
      case 'shell:relay-scoped-close':
        hooks.relayPool.closeScopedRelay(windowId);
        sendOk(true, '');
        break;
      case 'shell:relay-scoped-publish': {
        const et = event.tags?.find((t) => t[0] === 'event')?.[1];
        if (!et) { sendOk(false, 'error: missing event tag'); break; }
        try {
          const signed = JSON.parse(et) as NostrEvent;
          const ok = hooks.relayPool.publishToScopedRelay(windowId, signed);
          sendOk(ok, ok ? '' : 'error: no active scoped relay');
        } catch { sendOk(false, 'error: invalid event JSON'); }
        break;
      }
      case 'shell:create-window': {
        try {
          const payload = JSON.parse(event.content) as { title?: string; class?: string; iframeSrc?: string };
          if (!payload.title || !payload.class) { sendOk(false, 'error: requires title and class'); break; }
          const id = hooks.windowManager.createWindow({ title: payload.title, class: payload.class, iframeSrc: payload.iframeSrc });
          sendOk(!!id, id ? '' : 'error: window creation failed');
        } catch { sendOk(false, 'error: invalid JSON'); }
        break;
      }
      case 'shell:send-dm': {
        if (hooks.dm) {
          const corrId = event.tags?.find((t) => t[0] === 'id')?.[1] ?? '';
          const recipient = event.tags?.find((t) => t[0] === 'p')?.[1];
          let message: string | undefined;
          try { message = JSON.parse(event.content).message; } catch { /* Malformed DM content */ }
          if (!recipient || !message) { sendOk(false, 'error: missing recipient or message'); break; }
          hooks.dm.sendDm(recipient, message).then((result) => {
            const payload = result.success
              ? { success: true, ...(result.eventId ? { eventId: result.eventId } : {}) }
              : { success: false, error: result.error ?? 'unknown error' };
            const response: Partial<NostrEvent> = {
              kind: BusKind.INTER_PANE, pubkey: '',
              created_at: Math.floor(Date.now() / 1000),
              tags: [['t', 'shell:send-dm-result'], ['id', corrId]],
              content: JSON.stringify(payload), id: '', sig: '',
            };
            hooks.sendToNapplet(windowId, ['EVENT', '__shell__', response]);
            sendOk(result.success, result.success ? '' : `error: ${result.error}`);
          }).catch(() => { sendOk(false, 'error: DM send failed'); });
        } else sendOk(false, 'error: DM hooks not configured');
        break;
      }
      default:
        sendOk(true, '');
        break;
    }
  }

  // ─── Main message handler ────────────────────────────────────────────────

  function handleMessage(windowId: string, msg: unknown[]): void {
    if (!Array.isArray(msg) || msg.length < 2) return;
    const [verb] = msg;
    if (verb === 'AUTH') { void handleAuth(msg, windowId); return; }
    if (!nappKeyRegistry.getPubkey(windowId)) {
      let queue = pendingAuthQueue.get(windowId);
      if (!queue) { queue = []; pendingAuthQueue.set(windowId, queue); }
      queue.push({ msg, windowId });
      return;
    }
    dispatchVerb(verb, msg, windowId);
  }

  // ─── Public interface ────────────────────────────────────────────────────

  const runtimeInstance: Runtime = {
    handleMessage,

    sendChallenge(windowId: string): void {
      const challenge = hooks.crypto.randomUUID();
      pendingChallenges.set(windowId, challenge);
      hooks.sendToNapplet(windowId, ['AUTH', challenge]);
    },

    injectEvent(topic: string, payload: unknown): void {
      const uuid = hooks.crypto.randomUUID().replace(/-/g, '').slice(0, 64).padEnd(64, '0');
      const event: NostrEvent = {
        id: uuid,
        pubkey: '0'.repeat(64),
        created_at: Math.floor(Date.now() / 1000),
        kind: BusKind.INTER_PANE,
        tags: [['t', topic]],
        content: JSON.stringify(payload),
        sig: '0'.repeat(128),
      };
      eventBuffer.bufferAndDeliver(event, null);
    },

    destroy(): void {
      manifestCache.persist();
      aclState.persist();
      pendingChallenges.clear();
      pendingAuthQueue.clear();
      authInFlight.clear();
      replayDetector.clear();
      subscriptions.clear();
      eventBuffer.clear();
    },

    registerConsentHandler(handler: ConsentHandler): void {
      _consentHandler = handler;
    },

    get nappKeyRegistry() { return nappKeyRegistry; },
    get aclState() { return aclState; },
    get manifestCache() { return manifestCache; },
  };

  return runtimeInstance;
}
