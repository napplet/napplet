/**
 * pseudo-relay.ts — NIP-01 pseudo-relay message handler.
 *
 * Factory function that creates a framework-agnostic pseudo-relay instance.
 * All external dependencies are injected via ShellHooks.
 */

import type {
  NostrEvent, NostrFilter, NappKeyEntry, Capability,
  ShellHooks, ConsentRequest,
} from './types.js';
import {
  AUTH_KIND, PSEUDO_RELAY_URI, REPLAY_WINDOW_SECONDS,
  BusKind, ALL_CAPABILITIES, DESTRUCTIVE_KINDS,
} from './types.js';
import { originRegistry } from './origin-registry.js';
import { nappKeyRegistry } from './napp-key-registry.js';
import { aclStore } from './acl-store.js';
import { manifestCache } from './manifest-cache.js';
import { handleStorageRequest } from './storage-proxy.js';
import { audioManager } from './audio-manager.js';

// ─── Public interface ────────────────────────────────────────────────────────

export interface PseudoRelay {
  /** The main message handler — attach to window.addEventListener('message', ...) */
  handleMessage(event: MessageEvent): void;
  /** Send a NIP-42 AUTH challenge to a napp window. */
  sendChallenge(windowId: string): void;
  /** Inject a shell-created event into subscription delivery. */
  injectEvent(topic: string, payload: unknown): void;
  /** Clean up all state and remove listeners. */
  cleanup(): void;
  /** Register a consent handler for destructive signing kinds. */
  onConsentNeeded(handler: (request: ConsentRequest) => void): void;
}

/**
 * Create a pseudo-relay instance with dependency injection via hooks.
 *
 * @param hooks - Host application provides relay pool, auth, config, etc.
 * @returns A PseudoRelay instance ready to handle napp messages.
 */
export function createPseudoRelay(hooks: ShellHooks): PseudoRelay {
  // ─── Module-level state ──────────────────────────────────────────────────

  const pendingChallenges = new Map<string, string>();
  const subscriptions = new Map<string, { windowId: string; filters: NostrFilter[] }>();
  const seenEventIds = new Map<string, number>();
  const pendingAuthQueue = new Map<string, Array<{ msg: unknown[]; sourceWindow: Window }>>();
  const authInFlight = new Set<string>();
  const RING_BUFFER_SIZE = 100;
  const eventBuffer: NostrEvent[] = [];
  let _onConsentNeeded: ((request: ConsentRequest) => void) | null = null;

  // ─── Helpers ─────────────────────────────────────────────────────────────

  function checkAcl(pubkey: string, capability: Capability): boolean {
    const entry = nappKeyRegistry.getEntry(pubkey);
    return aclStore.check(pubkey, entry?.dTag ?? '', entry?.aggregateHash ?? '', capability);
  }

  function checkReplay(event: NostrEvent): string | null {
    const now = Math.floor(Date.now() / 1000);
    if (now - event.created_at > REPLAY_WINDOW_SECONDS) return 'invalid: event created_at too old';
    if (event.created_at - now > 10) return 'invalid: event created_at in the future';
    if (seenEventIds.has(event.id)) return 'duplicate: already processed';
    seenEventIds.set(event.id, now);
    for (const [id, timestamp] of seenEventIds) {
      if (now - timestamp > REPLAY_WINDOW_SECONDS) seenEventIds.delete(id);
    }
    return null;
  }

  function matchesFilter(event: NostrEvent, filter: NostrFilter): boolean {
    if (filter.ids !== undefined && !filter.ids.some((id) => event.id.startsWith(id))) return false;
    if (filter.authors !== undefined && !filter.authors.some((a) => event.pubkey.startsWith(a))) return false;
    if (filter.kinds !== undefined && !filter.kinds.includes(event.kind)) return false;
    if (filter.since !== undefined && event.created_at < filter.since) return false;
    if (filter.until !== undefined && event.created_at > filter.until) return false;
    for (const [key, values] of Object.entries(filter)) {
      if (!key.startsWith('#') || values === undefined) continue;
      const tagName = key.slice(1);
      const tagValues = values as string[];
      const eventTagValues = event.tags.filter((t) => t[0] === tagName).map((t) => t[1]);
      if (!tagValues.some((v) => eventTagValues.includes(v))) return false;
    }
    return true;
  }

  function matchesAnyFilter(event: NostrEvent, filters: NostrFilter[]): boolean {
    if (filters.length === 0) return true;
    return filters.some((filter) => matchesFilter(event, filter));
  }

  function deliverToSubscriptions(event: NostrEvent, senderId: string | null): void {
    const pTag = event.tags?.find((t) => t[0] === 'p');
    const targetPubkey = pTag?.[1];
    for (const [subKey, sub] of subscriptions) {
      if (senderId !== null && sub.windowId === senderId) continue;
      if (targetPubkey) {
        const subPubkey = nappKeyRegistry.getPubkey(sub.windowId);
        if (subPubkey !== targetPubkey) continue;
      }
      if (!matchesAnyFilter(event, sub.filters)) continue;
      const prefix = `${sub.windowId}:`;
      if (!subKey.startsWith(prefix)) continue;
      const subId = subKey.slice(prefix.length);
      const win = originRegistry.getIframeWindow(sub.windowId);
      if (win) win.postMessage(['EVENT', subId, event], '*');
    }
  }

  function storeAndRoute(event: NostrEvent, senderId: string | null): void {
    if (eventBuffer.length >= RING_BUFFER_SIZE) eventBuffer.shift();
    eventBuffer.push(event);
    deliverToSubscriptions(event, senderId);
  }

  // ─── Verb handlers ───────────────────────────────────────────────────────

  function dispatchVerb(verb: unknown, msg: unknown[], windowId: string, sourceWindow: Window): void {
    switch (verb) {
      case 'EVENT': handleEvent(msg, windowId, sourceWindow); break;
      case 'REQ': handleReq(msg, windowId, sourceWindow); break;
      case 'CLOSE': handleClose(msg, windowId); break;
      case 'COUNT': handleCount(msg, windowId, sourceWindow); break;
    }
  }

  async function handleAuth(msg: unknown[], windowId: string, sourceWindow: Window): Promise<void> {
    const authEvent = msg[1] as NostrEvent | undefined;
    if (!authEvent || typeof authEvent !== 'object') return;
    const eventId = authEvent.id ?? '';
    function sendOkFail(reason: string): void {
      sourceWindow.postMessage(['OK', eventId, false, `auth-required: ${reason}`], '*');
    }
    function rejectAuth(reason: string): void {
      const queue = pendingAuthQueue.get(windowId);
      const queueSize = queue?.length ?? 0;
      pendingAuthQueue.delete(windowId);
      sendOkFail(reason);
      if (queueSize > 0) {
        sourceWindow.postMessage(['NOTICE', `${queueSize} queued message(s) dropped due to auth failure`], '*');
      }
    }

    if (authEvent.kind !== AUTH_KIND) { rejectAuth('event kind must be 22242'); return; }

    const challengeTag = authEvent.tags?.find((t) => t[0] === 'challenge');
    const pendingChallenge = pendingChallenges.get(windowId);
    if (!challengeTag || challengeTag[1] !== pendingChallenge) { rejectAuth('challenge mismatch'); return; }

    const relayTag = authEvent.tags?.find((t) => t[0] === 'relay');
    if (!relayTag || relayTag[1] !== PSEUDO_RELAY_URI) { rejectAuth('relay tag must be napplet://shell'); return; }

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
              if (queued) for (const { msg: qMsg, sourceWindow: qWin } of queued) dispatchVerb(qMsg[0], qMsg, windowId, qWin);
            } else {
              pendingAuthQueue.delete(windowId);
              nappKeyRegistry.clearPendingUpdate(windowId);
              sourceWindow.postMessage(['OK', eventId, false, 'blocked: update rejected'], '*');
            }
          },
        });
        pendingChallenges.delete(windowId);
        sourceWindow.postMessage(['OK', eventId, true, ''], '*');
        return;
      }
      if (updateBehavior === 'auto-grant') {
        const oldAcl = aclStore.getEntry(authEvent.pubkey, dTag, previousCacheEntry!.aggregateHash);
        if (oldAcl) for (const cap of oldAcl.capabilities) aclStore.grant(authEvent.pubkey, dTag, aggregateHash, cap as Capability);
      }
      manifestCache.set({ pubkey: authEvent.pubkey, dTag, aggregateHash, verifiedAt: Date.now() });
    }

    if (aggregateHash && !manifestCache.has(authEvent.pubkey, dTag, aggregateHash)) {
      manifestCache.set({ pubkey: authEvent.pubkey, dTag, aggregateHash, verifiedAt: Date.now() });
    }

    nappKeyRegistry.register(windowId, entry);
    pendingChallenges.delete(windowId);
    sourceWindow.postMessage(['OK', eventId, true, ''], '*');

    const queued = pendingAuthQueue.get(windowId);
    pendingAuthQueue.delete(windowId);
    if (queued) for (const { msg: qMsg, sourceWindow: qWin } of queued) dispatchVerb(qMsg[0], qMsg, windowId, qWin);

    const userPubkey = hooks.auth.getUserPubkey();
    if (userPubkey) relay.injectEvent('auth:identity-changed', { pubkey: userPubkey });
  }

  function handleEvent(msg: unknown[], windowId: string, sourceWindow: Window): void {
    const event = msg[1] as NostrEvent | undefined;
    if (!event || typeof event !== 'object') return;
    const eventId = event.id ?? '';
    function sendOk(success: boolean, reason: string): void {
      sourceWindow.postMessage(['OK', eventId, success, reason], '*');
    }

    const pubkey = nappKeyRegistry.getPubkey(windowId);
    if (!pubkey) { sendOk(false, 'auth-required: complete AUTH first'); return; }

    const replayResult = checkReplay(event);
    if (replayResult !== null) { sendOk(false, replayResult); return; }
    if (!checkAcl(pubkey, 'relay:write')) { sendOk(false, 'auth-required: relay:write capability denied'); return; }

    switch (event.kind) {
      case BusKind.SIGNER_REQUEST:
        handleSignerRequest(event, windowId, pubkey, sourceWindow);
        return;
      case BusKind.HOTKEY_FORWARD:
        if (checkAcl(pubkey, 'hotkey:forward')) {
          try { handleHotkeyForward(event); } catch { /* best-effort */ }
        }
        break;
      case BusKind.INTER_PANE: {
        const topic = event.tags?.find((t) => t[0] === 't')?.[1];
        if (topic?.startsWith('shell:storage-')) { handleStorageRequest(windowId, sourceWindow, event); return; }
        if (topic?.startsWith('shell:audio-')) { handleAudioCommand(event, windowId); return; }
        if (topic?.startsWith('shell:') || topic === 'shell:create-window' || topic === 'shell:send-dm') {
          handleShellCommand(event, windowId, topic!, sourceWindow); return;
        }
        storeAndRoute(event, windowId);
        break;
      }
      default:
        storeAndRoute(event, windowId);
        break;
    }
    sendOk(true, '');
  }

  function handleReq(msg: unknown[], windowId: string, sourceWindow: Window): void {
    const subId = msg[1] as string | undefined;
    if (typeof subId !== 'string') return;
    const filters = (msg.slice(2) as NostrFilter[]) ?? [];
    const pubkey = nappKeyRegistry.getPubkey(windowId);
    if (!pubkey) { sourceWindow.postMessage(['CLOSED', subId, 'auth-required'], '*'); return; }
    if (!checkAcl(pubkey, 'relay:read')) { sourceWindow.postMessage(['CLOSED', subId, 'relay:read denied'], '*'); return; }

    const subKey = `${windowId}:${subId}`;
    subscriptions.set(subKey, { windowId, filters });

    const seenIds = new Set<string>();
    function deliver(event: NostrEvent): void {
      if (seenIds.has(event.id)) return;
      seenIds.add(event.id);
      if (subscriptions.has(subKey)) sourceWindow.postMessage(['EVENT', subId, event], '*');
    }

    for (const bufferedEvent of eventBuffer) {
      if (matchesAnyFilter(bufferedEvent, filters)) deliver(bufferedEvent);
    }

    const isBusKind = filters.every((f) => f.kinds?.every((k) => k >= 29000 && k < 30000));
    const workerRelay = hooks.workerRelay.getWorkerRelay();
    let eoseSent = false;

    if (workerRelay && !isBusKind) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      workerRelay.query(['REQ', crypto.randomUUID(), ...(filters as any[])])
        .then((cachedEvents) => { for (const event of cachedEvents) deliver(event); })
        .catch(() => {});
    }

    const pool = hooks.relayPool.getRelayPool();
    if (pool && !isBusKind) {
      const relayUrls = hooks.relayPool.selectRelayTier(filters);
      const eoseFallbackTimer = setTimeout(() => {
        if (!eoseSent) { eoseSent = true; sourceWindow.postMessage(['EOSE', subId], '*'); }
      }, 15_000);

      const subscription = pool.subscription(relayUrls, filters).subscribe((item) => {
        if (item === 'EOSE') {
          clearTimeout(eoseFallbackTimer);
          if (!eoseSent) { eoseSent = true; sourceWindow.postMessage(['EOSE', subId], '*'); }
          return;
        }
        const event = item as NostrEvent;
        deliver(event);
        if (workerRelay && !isBusKind) {
          try { workerRelay.event(event)?.catch?.(() => {}); } catch { /* ignore */ }
        }
      });

      hooks.relayPool.trackSubscription(subKey, () => {
        clearTimeout(eoseFallbackTimer);
        subscription.unsubscribe();
      });
    } else if (!isBusKind) {
      sourceWindow.postMessage(['EOSE', subId], '*');
    }
  }

  function handleClose(msg: unknown[], windowId: string): void {
    const subId = msg[1] as string | undefined;
    if (typeof subId !== 'string') return;
    const subKey = `${windowId}:${subId}`;
    subscriptions.delete(subKey);
    hooks.relayPool.untrackSubscription(subKey);
  }

  function handleCount(msg: unknown[], windowId: string, sourceWindow: Window): void {
    const countId = msg[1] as string | undefined;
    if (typeof countId !== 'string') return;
    const filters = (msg.slice(2) as NostrFilter[]) ?? [];
    const pubkey = nappKeyRegistry.getPubkey(windowId);
    if (!pubkey) { sourceWindow.postMessage(['CLOSED', countId, 'auth-required'], '*'); return; }
    let count = 0;
    for (const event of eventBuffer) if (matchesAnyFilter(event, filters)) count++;
    sourceWindow.postMessage(['COUNT', countId, { count }], '*');
  }

  function handleSignerRequest(event: NostrEvent, windowId: string, pubkey: string, sourceWindow: Window): void {
    const corrId = event.tags?.find((t) => t[0] === 'id')?.[1] ?? event.id;
    const method = event.tags?.find((t) => t[0] === 'method')?.[1];
    function sendOk(success: boolean, reason: string): void {
      sourceWindow.postMessage(['OK', event.id, success, reason], '*');
    }

    const signer = hooks.auth.getSigner();
    if (!signer) { sendOk(false, 'error: no signer configured'); return; }
    if (!checkAcl(pubkey, 'sign:event')) { sendOk(false, 'sign:event capability denied'); return; }

    function dispatch(eventToSign: NostrEvent | null): void {
      const signerPromise: Promise<unknown> = (() => {
        switch (method) {
          case 'getPublicKey': return Promise.resolve(signer.getPublicKey?.());
          case 'signEvent': return signer.signEvent?.(eventToSign) ?? Promise.resolve(null);
          case 'getRelays': return Promise.resolve(signer.getRelays?.() ?? {});
          case 'nip04.encrypt': { const p = event.tags?.find((t) => t[0] === 'params'); return signer.nip04?.encrypt(p?.[1], p?.[2]) ?? Promise.resolve(''); }
          case 'nip04.decrypt': { const p = event.tags?.find((t) => t[0] === 'params'); return signer.nip04?.decrypt(p?.[1], p?.[2]) ?? Promise.resolve(''); }
          case 'nip44.encrypt': { const p = event.tags?.find((t) => t[0] === 'params'); return signer.nip44?.encrypt(p?.[1], p?.[2]) ?? Promise.resolve(''); }
          case 'nip44.decrypt': { const p = event.tags?.find((t) => t[0] === 'params'); return signer.nip44?.decrypt(p?.[1], p?.[2]) ?? Promise.resolve(''); }
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
        deliverToSubscriptions(responseEvent as NostrEvent, null);
        sendOk(true, '');
      }).catch((err: unknown) => {
        sendOk(false, `error: ${(err as Error).message ?? 'signing failed'}`);
      });
    }

    const eventTag = event.tags?.find((t) => t[0] === 'event')?.[1];
    if (method === 'signEvent' && eventTag) {
      let eventToSign: NostrEvent;
      try { eventToSign = JSON.parse(eventTag) as NostrEvent; } catch { sendOk(false, 'error: invalid event JSON'); return; }
      if (aclStore.requiresPrompt(eventToSign.kind) && _onConsentNeeded) {
        new Promise<boolean>((resolve) => {
          _onConsentNeeded!({ windowId, pubkey, event: eventToSign, resolve });
        }).then((allowed) => {
          if (!allowed) { sendOk(false, 'error: user rejected'); return; }
          dispatch(eventToSign);
        }).catch(() => sendOk(false, 'error: consent check failed'));
        return;
      }
      dispatch(eventToSign);
      return;
    }
    dispatch(null);
  }

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

  function handleAudioCommand(event: NostrEvent, windowId: string): void {
    const topic = event.tags?.find((t) => t[0] === 't')?.[1];
    switch (topic) {
      case 'shell:audio-register': {
        let title = '';
        try { title = JSON.parse(event.content).title ?? ''; } catch { /* ignore */ }
        const pubkey = nappKeyRegistry.getPubkey(windowId);
        const nappEntry = pubkey ? nappKeyRegistry.getEntry(pubkey) : undefined;
        audioManager.register(windowId, nappEntry?.dTag ?? 'unknown', title);
        break;
      }
      case 'shell:audio-unregister': audioManager.unregister(windowId); break;
      case 'shell:audio-state-changed': {
        let update: { title?: string } = {};
        try { update = JSON.parse(event.content); } catch { /* ignore */ }
        audioManager.updateState(windowId, update);
        break;
      }
    }
  }

  function handleShellCommand(event: NostrEvent, windowId: string, topic: string, sourceWindow: Window): void {
    function sendOk(success: boolean, reason: string): void {
      sourceWindow.postMessage(['OK', event.id, success, reason], '*');
    }
    function sendInterPaneReply(replyTopic: string, content: string): void {
      const responseEvent: Partial<NostrEvent> = {
        kind: BusKind.INTER_PANE, pubkey: '',
        created_at: Math.floor(Date.now() / 1000),
        tags: [['t', replyTopic]], content, id: '', sig: '',
      };
      sourceWindow.postMessage(['EVENT', '__shell__', responseEvent], '*');
      sendOk(true, '');
    }

    switch (topic) {
      case 'shell:acl-get': {
        const aclEntries = aclStore.getAllEntries();
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
        if (topic === 'shell:acl-revoke' && cap) aclStore.revoke(pk, ne?.dTag ?? '', ne?.aggregateHash ?? '', cap as Capability);
        else if (topic === 'shell:acl-grant' && cap) aclStore.grant(pk, ne?.dTag ?? '', ne?.aggregateHash ?? '', cap as Capability);
        else if (topic === 'shell:acl-block') aclStore.block(pk, ne?.dTag ?? '', ne?.aggregateHash ?? '');
        else if (topic === 'shell:acl-unblock') aclStore.unblock(pk, ne?.dTag ?? '', ne?.aggregateHash ?? '');
        aclStore.persist();
        const ae = aclStore.getEntry(pk, ne?.dTag ?? '', ne?.aggregateHash ?? '');
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
          hooks.relayPool.openScopedRelay(windowId, url, subId, filters, sourceWindow);
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
          try { message = JSON.parse(event.content).message; } catch { /* */ }
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
            sourceWindow.postMessage(['EVENT', '__shell__', response], '*');
            sendOk(result.success, result.success ? '' : `error: ${result.error}`);
          }).catch(() => sendOk(false, 'error: DM send failed'));
        } else sendOk(false, 'error: DM hooks not configured');
        break;
      }
      default:
        sendOk(true, '');
        break;
    }
  }

  // ─── Main message handler ────────────────────────────────────────────────

  function handleMessage(event: MessageEvent): void {
    const sourceWindow = event.source as Window | null;
    if (!sourceWindow) return;
    const windowId = originRegistry.getWindowId(sourceWindow);
    if (!windowId) return;
    const msg = event.data;
    if (!Array.isArray(msg) || msg.length < 2) return;
    const [verb] = msg;
    if (verb === 'AUTH') { void handleAuth(msg, windowId, sourceWindow); return; }
    if (!nappKeyRegistry.getPubkey(windowId)) {
      let queue = pendingAuthQueue.get(windowId);
      if (!queue) { queue = []; pendingAuthQueue.set(windowId, queue); }
      queue.push({ msg, sourceWindow });
      return;
    }
    dispatchVerb(verb, msg, windowId, sourceWindow);
  }

  // ─── Public interface ────────────────────────────────────────────────────

  const relay: PseudoRelay = {
    handleMessage,

    sendChallenge(windowId: string): void {
      const win = originRegistry.getIframeWindow(windowId);
      if (!win) return;
      const challenge = crypto.randomUUID();
      pendingChallenges.set(windowId, challenge);
      win.postMessage(['AUTH', challenge], '*');
    },

    injectEvent(topic: string, payload: unknown): void {
      const event: NostrEvent = {
        id: crypto.randomUUID().replace(/-/g, '').slice(0, 64).padEnd(64, '0'),
        pubkey: '0'.repeat(64),
        created_at: Math.floor(Date.now() / 1000),
        kind: BusKind.INTER_PANE,
        tags: [['t', topic]],
        content: JSON.stringify(payload),
        sig: '0'.repeat(128),
      };
      storeAndRoute(event, null);
    },

    cleanup(): void {
      manifestCache.persist();
      pendingChallenges.clear();
      pendingAuthQueue.clear();
      authInFlight.clear();
      seenEventIds.clear();
      subscriptions.clear();
      eventBuffer.length = 0;
    },

    onConsentNeeded(handler: (request: ConsentRequest) => void): void {
      _onConsentNeeded = handler;
    },
  };

  return relay;
}
