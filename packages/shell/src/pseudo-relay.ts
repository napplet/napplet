/**
 * pseudo-relay.ts — NIP-01 pseudo-relay message handler for napplet shell runtime.
 *
 * Framework-agnostic extraction of hyprgate's pseudo-relay. All host-app
 * dependencies are injected via the ShellHooks interface.
 *
 * Security model:
 *   - event.source validation via originRegistry (unforgeable Window reference)
 *   - NIP-42 AUTH handshake with full schnorr verification (via hooks.crypto)
 *   - After AUTH, hybrid verification: origin registry only (no schnorr per message)
 *   - Replay protection: stale timestamps and duplicate event IDs rejected
 *   - ACL enforcement via aclStore before any capability-gated operation
 */

import type {
  NostrEvent,
  NostrFilter,
  NappKeyEntry,
  Capability,
  ConsentRequest,
  ShellHooks,
} from './types.js';
import {
  AUTH_KIND,
  PSEUDO_RELAY_URI,
  REPLAY_WINDOW_SECONDS,
  BusKind,
  ALL_CAPABILITIES,
} from './types.js';
import { originRegistry } from './origin-registry.js';
import { nappKeyRegistry } from './napp-key-registry.js';
import { aclStore, DESTRUCTIVE_KINDS } from './acl-store.js';
import { handleStorageRequest } from './storage-proxy.js';
import { audioManager } from './audio-manager.js';

// ─── PseudoRelay return type ──────────────────────────────────────────────────

export interface PseudoRelay {
  /** The main message handler — attach to window.addEventListener('message', ...) */
  handleMessage(event: MessageEvent): void;
  /** Send a NIP-42 AUTH challenge to a napp window */
  sendChallenge(windowId: string): void;
  /** Inject a shell-created event into the subscription delivery system */
  injectEvent(topic: string, payload: unknown): void;
  /** Teardown — removes all state */
  cleanup(): void;
}

// ─── Filter matching ──────────────────────────────────────────────────────────

function matchesFilter(event: NostrEvent, filter: NostrFilter): boolean {
  if (filter.ids && !filter.ids.includes(event.id)) return false;
  if (filter.authors && !filter.authors.includes(event.pubkey)) return false;
  if (filter.kinds && !filter.kinds.includes(event.kind)) return false;
  if (filter.since && event.created_at < filter.since) return false;
  if (filter.until && event.created_at > filter.until) return false;

  // Tag filters (#e, #p, #t, etc.)
  for (const [key, values] of Object.entries(filter)) {
    if (!key.startsWith('#') || !values) continue;
    const tagName = key.slice(1);
    const eventTagValues = event.tags
      .filter(t => t[0] === tagName)
      .map(t => t[1]);
    if (!(values as string[]).some((v: string) => eventTagValues.includes(v))) return false;
  }

  return true;
}

function matchesAnyFilter(event: NostrEvent, filters: NostrFilter[]): boolean {
  return filters.some(f => matchesFilter(event, f));
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Create a pseudo-relay instance with hook-based dependency injection.
 *
 * @param hooks             Host app hooks for relay pool, auth, config, etc.
 * @param onConsentNeeded   Called for destructive signing kinds (0, 3, 5, 10002)
 * @returns PseudoRelay instance with handleMessage, sendChallenge, injectEvent, cleanup
 */
export function createPseudoRelay(
  hooks: ShellHooks,
  onConsentNeeded: (request: ConsentRequest) => void,
): PseudoRelay {
  // ─── Module-level state ──────────────────────────────────────────────────

  const pendingChallenges = new Map<string, string>();
  const seenEventIds = new Map<string, number>();
  const subscriptions = new Map<string, { windowId: string; filters: NostrFilter[] }>();
  const pendingAuthQueue = new Map<string, Array<{ msg: unknown[]; sourceWindow: Window }>>();
  const authInFlight = new Set<string>();

  const RING_BUFFER_SIZE = 100;
  const eventBuffer: NostrEvent[] = [];

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function checkAcl(pubkey: string, capability: Capability): boolean {
    const entry = nappKeyRegistry.getEntry(pubkey);
    return aclStore.check(pubkey, entry?.dTag ?? '', entry?.aggregateHash ?? '', capability);
  }

  function checkReplay(event: NostrEvent): string | null {
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - event.created_at) > REPLAY_WINDOW_SECONDS) {
      return 'invalid: event timestamp too far from now';
    }
    if (event.id && seenEventIds.has(event.id)) {
      return 'duplicate: already have this event';
    }
    if (event.id) {
      seenEventIds.set(event.id, now);
      // Evict old entries
      if (seenEventIds.size > 1000) {
        const cutoff = now - REPLAY_WINDOW_SECONDS;
        for (const [id, ts] of seenEventIds) {
          if (ts < cutoff) seenEventIds.delete(id);
        }
      }
    }
    return null;
  }

  function storeAndRoute(event: NostrEvent, senderWindowId: string | null): void {
    // Store in ring buffer
    eventBuffer.push(event);
    if (eventBuffer.length > RING_BUFFER_SIZE) {
      eventBuffer.shift();
    }

    // Deliver to matching subscriptions
    deliverToSubscriptions(event, senderWindowId);
  }

  function deliverToSubscriptions(event: NostrEvent, senderWindowId: string | null): void {
    for (const [subKey, sub] of subscriptions) {
      // Self-exclusion: don't deliver to the sender (except null = shell-originated)
      if (senderWindowId && sub.windowId === senderWindowId) continue;

      if (matchesAnyFilter(event, sub.filters)) {
        const [, subId] = subKey.split(':');
        const iframeWindow = originRegistry.getIframeWindow(sub.windowId);
        if (iframeWindow && subId) {
          iframeWindow.postMessage(['EVENT', subId, event], '*');
        }
      }
    }
  }

  // ─── Verb dispatch ────────────────────────────────────────────────────────

  function dispatchVerb(
    verb: unknown,
    msg: unknown[],
    windowId: string,
    sourceWindow: Window,
  ): void {
    switch (verb) {
      case 'EVENT':
        handleEvent(msg, windowId, sourceWindow);
        break;
      case 'REQ':
        handleReq(msg, windowId, sourceWindow);
        break;
      case 'CLOSE':
        handleClose(msg, windowId);
        break;
      case 'COUNT':
        handleCount(msg, windowId, sourceWindow);
        break;
      default:
        break;
    }
  }

  // ─── AUTH handler ─────────────────────────────────────────────────────────

  async function handleAuth(msg: unknown[], windowId: string, sourceWindow: Window): Promise<void> {
    const authEvent = msg[1] as NostrEvent | undefined;
    if (!authEvent || typeof authEvent !== 'object') return;

    const eventId = authEvent.id ?? '';

    function sendOkFail(reason: string): void {
      sourceWindow.postMessage(['OK', eventId, false, `auth-required: ${reason}`], '*');
    }

    if (authEvent.kind !== AUTH_KIND) { sendOkFail('event kind must be 22242'); return; }

    const challengeTag = authEvent.tags?.find((t) => t[0] === 'challenge');
    const pendingChallenge = pendingChallenges.get(windowId);
    if (!challengeTag || challengeTag[1] !== pendingChallenge) { sendOkFail('challenge mismatch'); return; }

    const relayTag = authEvent.tags?.find((t) => t[0] === 'relay');
    if (!relayTag || relayTag[1] !== PSEUDO_RELAY_URI) { sendOkFail('relay tag must be hyprgate://shell'); return; }

    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - authEvent.created_at) > 60) { sendOkFail('event created_at too far from now'); return; }

    // Full schnorr signature verification via hooks
    authInFlight.add(windowId);
    let sigValid: boolean;
    try {
      sigValid = await hooks.crypto.verifyEvent(authEvent);
    } finally {
      authInFlight.delete(windowId);
    }
    if (!sigValid) {
      pendingAuthQueue.delete(windowId);
      sendOkFail('invalid signature');
      return;
    }

    const typeTag = authEvent.tags?.find((t) => t[0] === 'type');
    const nappType = typeTag?.[1] ?? 'unknown';
    const dTag = parseInt(authEvent.pubkey.slice(0, 8), 16).toString(36) + nappType;

    const hashTag = authEvent.tags?.find((t) => t[0] === 'aggregateHash');
    const aggregateHash = hashTag?.[1] ?? '';

    const entry: NappKeyEntry = {
      pubkey: authEvent.pubkey,
      windowId,
      origin: '*',
      type: nappType,
      dTag,
      aggregateHash,
      registeredAt: Date.now(),
    };

    nappKeyRegistry.register(windowId, entry);
    pendingChallenges.delete(windowId);
    sourceWindow.postMessage(['OK', eventId, true, ''], '*');

    // Replay queued messages
    const queued = pendingAuthQueue.get(windowId);
    pendingAuthQueue.delete(windowId);
    if (queued) {
      for (const { msg: qMsg, sourceWindow: qWin } of queued) {
        dispatchVerb(qMsg[0], qMsg, windowId, qWin);
      }
    }

    // Broadcast current identity
    const userPubkey = hooks.auth.getUserPubkey();
    if (userPubkey) {
      injectEvent('auth:identity-changed', { pubkey: userPubkey });
    }
  }

  // ─── EVENT handler ────────────────────────────────────────────────────────

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
      case BusKind.SIGNER_REQUEST: {
        handleSignerRequest(event, windowId, pubkey, sourceWindow);
        return;
      }
      case BusKind.HOTKEY_FORWARD: {
        if (checkAcl(pubkey, 'hotkey:forward')) {
          try { handleHotkeyForward(event); } catch { /* non-fatal */ }
        }
        break;
      }
      case BusKind.INTER_PANE: {
        const topicTag = event.tags?.find((t) => t[0] === 't');
        const topic = topicTag?.[1];
        if (topic?.startsWith('shell:storage-')) {
          handleStorageRequest(windowId, sourceWindow, event);
          return;
        }
        if (topic?.startsWith('shell:audio-')) {
          handleAudioCommand(event, windowId);
          return;
        }
        if (topic?.startsWith('shell:relay-') || topic?.startsWith('shell:acl-') || topic?.startsWith('shell:config-') || topic === 'shell:create-window') {
          handleShellCommand(event, windowId, topic!, sourceWindow);
          return;
        }
        storeAndRoute(event, windowId);
        break;
      }
      default: {
        storeAndRoute(event, windowId);
        break;
      }
    }

    sendOk(true, '');
  }

  // ─── REQ handler ──────────────────────────────────────────────────────────

  function handleReq(msg: unknown[], windowId: string, sourceWindow: Window): void {
    const subId = msg[1] as string | undefined;
    if (typeof subId !== 'string') return;

    const filters = (msg.slice(2) as NostrFilter[]) ?? [];

    const pubkey = nappKeyRegistry.getPubkey(windowId);
    if (!pubkey) {
      sourceWindow.postMessage(['CLOSED', subId, 'auth-required: complete AUTH first'], '*');
      return;
    }

    if (!checkAcl(pubkey, 'relay:read')) {
      sourceWindow.postMessage(['CLOSED', subId, 'auth-required: relay:read capability denied'], '*');
      return;
    }

    const subKey = `${windowId}:${subId}`;
    subscriptions.set(subKey, { windowId, filters });

    const seenIds = new Set<string>();

    function deliver(event: NostrEvent): void {
      if (seenIds.has(event.id)) return;
      seenIds.add(event.id);
      if (subscriptions.has(subKey)) {
        sourceWindow.postMessage(['EVENT', subId, event], '*');
      }
    }

    // Deliver matching buffered events
    for (const bufferedEvent of eventBuffer) {
      if (matchesAnyFilter(bufferedEvent, filters)) {
        deliver(bufferedEvent);
      }
    }

    const isBusKind = filters.every((f) => f.kinds?.every((k) => k >= 29000 && k < 30000));

    // Source: Worker relay (OPFS cache)
    const workerRelay = hooks.workerRelay.getWorkerRelay();
    if (workerRelay && !isBusKind) {
      workerRelay.query(['REQ', crypto.randomUUID(), ...filters])
        .then((cachedEvents) => {
          for (const event of cachedEvents) {
            deliver(event);
          }
        })
        .catch(() => { /* cache unavailable */ });
    }

    // Source: Live relays
    const pool = hooks.relayPool.getRelayPool();
    let eoseSent = false;

    if (pool && !isBusKind) {
      const relayUrls = hooks.relayPool.selectRelayTier(filters);

      const eoseFallbackTimer = setTimeout(() => {
        if (!eoseSent) {
          eoseSent = true;
          sourceWindow.postMessage(['EOSE', subId], '*');
        }
      }, 15_000);

      const subscription = pool
        .subscription(relayUrls, filters)
        .subscribe((item) => {
          if (item === 'EOSE') {
            clearTimeout(eoseFallbackTimer);
            if (!eoseSent) {
              eoseSent = true;
              sourceWindow.postMessage(['EOSE', subId], '*');
            }
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

    if (isBusKind) {
      sourceWindow.postMessage(['EOSE', subId], '*');
    }
  }

  // ─── CLOSE handler ────────────────────────────────────────────────────────

  function handleClose(msg: unknown[], windowId: string): void {
    const subId = msg[1] as string | undefined;
    if (typeof subId !== 'string') return;

    const subKey = `${windowId}:${subId}`;
    subscriptions.delete(subKey);
    hooks.relayPool.untrackSubscription(subKey);
  }

  // ─── COUNT handler ────────────────────────────────────────────────────────

  function handleCount(msg: unknown[], windowId: string, sourceWindow: Window): void {
    const countId = msg[1] as string | undefined;
    if (typeof countId !== 'string') return;

    const filters = (msg.slice(2) as NostrFilter[]) ?? [];

    const pubkey = nappKeyRegistry.getPubkey(windowId);
    if (!pubkey) {
      sourceWindow.postMessage(['CLOSED', countId, 'auth-required: complete AUTH first'], '*');
      return;
    }

    let count = 0;
    for (const event of eventBuffer) {
      if (matchesAnyFilter(event, filters)) count++;
    }

    sourceWindow.postMessage(['COUNT', countId, { count }], '*');
  }

  // ─── Signer request handler ───────────────────────────────────────────────

  function handleSignerRequest(
    event: NostrEvent,
    windowId: string,
    pubkey: string,
    sourceWindow: Window,
  ): void {
    const corrId = event.tags?.find((t) => t[0] === 'id')?.[1] ?? event.id;
    const method = event.tags?.find((t) => t[0] === 'method')?.[1];

    function sendOk(success: boolean, reason: string): void {
      sourceWindow.postMessage(['OK', event.id, success, reason], '*');
    }

    const signer = hooks.auth.getSigner();
    if (!signer) { sendOk(false, 'error: no signer configured'); return; }
    if (!checkAcl(pubkey, 'sign:event')) { sendOk(false, 'auth-required: sign:event capability denied'); return; }

    if (method === 'signEvent') {
      const eventTag = event.tags?.find((t) => t[0] === 'param' && t[1] === 'event');
      if (!eventTag?.[2]) { sendOk(false, 'error: missing event param'); return; }

      let eventToSign: NostrEvent;
      try { eventToSign = JSON.parse(eventTag[2]) as NostrEvent; } catch { sendOk(false, 'error: invalid event JSON'); return; }

      if (aclStore.requiresPrompt(eventToSign.kind)) {
        new Promise<boolean>((resolve) => {
          onConsentNeeded({ windowId, pubkey, event: eventToSign, resolve });
        }).then((allowed) => {
          if (!allowed) { sendOk(false, 'error: user rejected signing request'); return; }
          dispatchToSigner(signer, method, eventToSign, corrId, pubkey, event, sourceWindow);
        }).catch(() => { sendOk(false, 'error: consent check failed'); });
        return;
      }

      dispatchToSigner(signer, method, eventToSign, corrId, pubkey, event, sourceWindow);
      return;
    }

    dispatchToSigner(signer, method ?? '', null, corrId, pubkey, event, sourceWindow);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function dispatchToSigner(
    signer: any,
    method: string,
    eventToSign: NostrEvent | null,
    corrId: string,
    pubkey: string,
    requestEvent: NostrEvent,
    sourceWindow: Window,
  ): void {
    function sendOk(success: boolean, reason: string): void {
      sourceWindow.postMessage(['OK', requestEvent.id, success, reason], '*');
    }

    const signerPromise: Promise<unknown> = (() => {
      switch (method) {
        case 'getPublicKey': return Promise.resolve(signer.getPublicKey?.());
        case 'signEvent': return signer.signEvent?.(eventToSign) ?? Promise.resolve(null);
        case 'getRelays': return Promise.resolve(signer.getRelays?.() ?? {});
        case 'nip04.encrypt': {
          const p = requestEvent.tags?.find((t) => t[0] === 'param' && t[1] === 'pubkey');
          const pt = requestEvent.tags?.find((t) => t[0] === 'param' && t[1] === 'plaintext');
          return signer.nip04?.encrypt(p?.[2] ? JSON.parse(p[2]) : '', pt?.[2] ? JSON.parse(pt[2]) : '') ?? Promise.resolve('');
        }
        case 'nip04.decrypt': {
          const p = requestEvent.tags?.find((t) => t[0] === 'param' && t[1] === 'pubkey');
          const ct = requestEvent.tags?.find((t) => t[0] === 'param' && t[1] === 'ciphertext');
          return signer.nip04?.decrypt(p?.[2] ? JSON.parse(p[2]) : '', ct?.[2] ? JSON.parse(ct[2]) : '') ?? Promise.resolve('');
        }
        case 'nip44.encrypt': {
          const p = requestEvent.tags?.find((t) => t[0] === 'param' && t[1] === 'pubkey');
          const pt = requestEvent.tags?.find((t) => t[0] === 'param' && t[1] === 'plaintext');
          return signer.nip44?.encrypt(p?.[2] ? JSON.parse(p[2]) : '', pt?.[2] ? JSON.parse(pt[2]) : '') ?? Promise.resolve('');
        }
        case 'nip44.decrypt': {
          const p = requestEvent.tags?.find((t) => t[0] === 'param' && t[1] === 'pubkey');
          const ct = requestEvent.tags?.find((t) => t[0] === 'param' && t[1] === 'ciphertext');
          return signer.nip44?.decrypt(p?.[2] ? JSON.parse(p[2]) : '', ct?.[2] ? JSON.parse(ct[2]) : '') ?? Promise.resolve('');
        }
        default: return Promise.reject(new Error(`Unknown signer method: ${method}`));
      }
    })();

    signerPromise
      .then((result) => {
        const responseEvent: Partial<NostrEvent> = {
          kind: BusKind.SIGNER_RESPONSE,
          pubkey,
          created_at: Math.floor(Date.now() / 1000),
          tags: [['id', corrId], ['method', method], ['result', JSON.stringify(result)]],
          content: '',
        };
        deliverToSubscriptions(responseEvent as NostrEvent, null);
        sendOk(true, '');
      })
      .catch((err: unknown) => {
        sendOk(false, `error: ${(err as Error).message ?? 'signing failed'}`);
      });
  }

  // ─── Hotkey forward handler ───────────────────────────────────────────────

  function handleHotkeyForward(event: NostrEvent): void {
    const keyTag = event.tags?.find((t) => t[0] === 'key');
    const codeTag = event.tags?.find((t) => t[0] === 'code');
    const ctrlTag = event.tags?.find((t) => t[0] === 'ctrl');
    const altTag = event.tags?.find((t) => t[0] === 'alt');
    const shiftTag = event.tags?.find((t) => t[0] === 'shift');
    const metaTag = event.tags?.find((t) => t[0] === 'meta');

    hooks.hotkeys.executeHotkeyFromForward({
      key: keyTag?.[1] ?? '',
      code: codeTag?.[1] ?? '',
      ctrlKey: ctrlTag?.[1] === '1',
      altKey: altTag?.[1] === '1',
      shiftKey: shiftTag?.[1] === '1',
      metaKey: metaTag?.[1] === '1',
    });
  }

  // ─── Shell command handler ────────────────────────────────────────────────

  function handleShellCommand(
    event: NostrEvent,
    windowId: string,
    topic: string,
    sourceWindow: Window,
  ): void {
    function sendOk(success: boolean, reason: string): void {
      sourceWindow.postMessage(['OK', event.id, success, reason], '*');
    }

    function sendInterPaneReply(replyTopic: string, content: string): void {
      const responseEvent: Partial<NostrEvent> = {
        kind: BusKind.INTER_PANE,
        pubkey: '',
        created_at: Math.floor(Date.now() / 1000),
        tags: [['t', replyTopic]],
        content,
        id: '',
        sig: '',
      };
      sourceWindow.postMessage(['EVENT', '__shell__', responseEvent], '*');
      sendOk(true, '');
    }

    switch (topic) {
      case 'shell:acl-get': {
        const aclEntries = aclStore.getAllEntries();
        const nappEntries = nappKeyRegistry.getAllEntries();
        const nappInfoMap: Record<string, { type: string; registeredAt: number }> = {};
        for (const nappEntry of nappEntries) {
          nappInfoMap[nappEntry.pubkey] = { type: nappEntry.type, registeredAt: nappEntry.registeredAt };
        }
        const mergedEntries = [...aclEntries];
        for (const nappEntry of nappEntries) {
          if (!mergedEntries.find((e) => e.pubkey === nappEntry.pubkey)) {
            mergedEntries.push({ pubkey: nappEntry.pubkey, capabilities: [...ALL_CAPABILITIES], blocked: false });
          }
        }
        const displayEntries = mergedEntries.map((e) => ({
          ...e,
          type: nappInfoMap[e.pubkey]?.type ?? 'unknown',
          registeredAt: nappInfoMap[e.pubkey]?.registeredAt ?? 0,
        }));
        sendInterPaneReply('shell:acl-current', JSON.stringify({ entries: displayEntries }));
        break;
      }

      case 'shell:acl-revoke':
      case 'shell:acl-grant': {
        const pubkeyTag = event.tags?.find((t) => t[0] === 'pubkey');
        const capTag = event.tags?.find((t) => t[0] === 'cap');
        if (pubkeyTag?.[1] && capTag?.[1]) {
          const nappEntry = nappKeyRegistry.getEntry(pubkeyTag[1]);
          if (topic === 'shell:acl-revoke') {
            aclStore.revoke(pubkeyTag[1], nappEntry?.dTag ?? '', nappEntry?.aggregateHash ?? '', capTag[1] as Capability);
          } else {
            aclStore.grant(pubkeyTag[1], nappEntry?.dTag ?? '', nappEntry?.aggregateHash ?? '', capTag[1] as Capability);
          }
          aclStore.persist();
          const aclEntry = aclStore.getEntry(pubkeyTag[1], nappEntry?.dTag ?? '', nappEntry?.aggregateHash ?? '');
          sendInterPaneReply('shell:acl-current', JSON.stringify({ entries: aclEntry ? [aclEntry] : [] }));
        } else {
          sendOk(false, 'error: missing pubkey or cap tag');
        }
        break;
      }

      case 'shell:acl-block':
      case 'shell:acl-unblock': {
        const pubkeyTag = event.tags?.find((t) => t[0] === 'pubkey');
        if (pubkeyTag?.[1]) {
          const nappEntry = nappKeyRegistry.getEntry(pubkeyTag[1]);
          if (topic === 'shell:acl-block') {
            aclStore.block(pubkeyTag[1], nappEntry?.dTag ?? '', nappEntry?.aggregateHash ?? '');
          } else {
            aclStore.unblock(pubkeyTag[1], nappEntry?.dTag ?? '', nappEntry?.aggregateHash ?? '');
          }
          aclStore.persist();
          const aclEntry = aclStore.getEntry(pubkeyTag[1], nappEntry?.dTag ?? '', nappEntry?.aggregateHash ?? '');
          sendInterPaneReply('shell:acl-current', JSON.stringify({ entries: aclEntry ? [aclEntry] : [] }));
        } else {
          sendOk(false, 'error: missing pubkey tag');
        }
        break;
      }

      case 'shell:relay-get': {
        const config = hooks.relayConfig.getRelayConfig();
        sendInterPaneReply('shell:relay-current', JSON.stringify(config));
        break;
      }

      case 'shell:relay-add': {
        const tierTag = event.tags?.find((t) => t[0] === 'tier');
        const urlTag = event.tags?.find((t) => t[0] === 'url');
        if (tierTag?.[1] && urlTag?.[1]) {
          hooks.relayConfig.addRelay(tierTag[1], urlTag[1]);
          sendInterPaneReply('shell:relay-current', JSON.stringify(hooks.relayConfig.getRelayConfig()));
        } else {
          sendOk(false, 'error: missing tier/url tag');
        }
        break;
      }

      case 'shell:relay-remove': {
        const tierTag = event.tags?.find((t) => t[0] === 'tier');
        const urlTag = event.tags?.find((t) => t[0] === 'url');
        if (tierTag?.[1] && urlTag?.[1]) {
          hooks.relayConfig.removeRelay(tierTag[1], urlTag[1]);
          sendInterPaneReply('shell:relay-current', JSON.stringify(hooks.relayConfig.getRelayConfig()));
        } else {
          sendOk(false, 'error: missing tier/url tag');
        }
        break;
      }

      case 'shell:relay-nip66': {
        const suggestions = hooks.relayConfig.getNip66Suggestions();
        sendInterPaneReply('shell:relay-nip66-data', JSON.stringify(suggestions));
        break;
      }

      case 'shell:relay-scoped-connect': {
        const urlTag = event.tags?.find((t) => t[0] === 'url');
        const subIdTag = event.tags?.find((t) => t[0] === 'sub-id');
        const filtersTag = event.tags?.find((t) => t[0] === 'filters');
        if (!urlTag?.[1] || !subIdTag?.[1] || !filtersTag?.[1]) {
          sendOk(false, 'error: missing url/sub-id/filters tag');
          return;
        }
        let filters: NostrFilter[];
        try { filters = JSON.parse(filtersTag[1]); } catch { sendOk(false, 'error: invalid filters JSON'); return; }
        hooks.relayPool.openScopedRelay(windowId, urlTag[1], subIdTag[1], filters, sourceWindow);
        sendOk(true, '');
        break;
      }

      case 'shell:relay-scoped-close': {
        hooks.relayPool.closeScopedRelay(windowId);
        sendOk(true, '');
        break;
      }

      case 'shell:relay-scoped-publish': {
        const eventTag = event.tags?.find((t) => t[0] === 'event');
        if (!eventTag?.[1]) { sendOk(false, 'error: missing event tag'); return; }
        let signedEvent: NostrEvent;
        try { signedEvent = JSON.parse(eventTag[1]); } catch { sendOk(false, 'error: invalid event JSON'); return; }
        const published = hooks.relayPool.publishToScopedRelay(windowId, signedEvent);
        sendOk(published, published ? '' : 'error: no active scoped relay');
        break;
      }

      case 'shell:create-window': {
        let payload: { title?: string; class?: string; iframeSrc?: string };
        try { payload = JSON.parse(event.content); } catch { sendOk(false, 'error: invalid JSON'); return; }
        if (!payload.title || !payload.class) { sendOk(false, 'error: requires title and class'); return; }
        const newWindowId = hooks.windowManager.createWindow({
          title: payload.title,
          class: payload.class,
          iframeSrc: payload.iframeSrc,
        });
        sendOk(!!newWindowId, newWindowId ? '' : 'error: window creation failed');
        break;
      }

      default:
        sendOk(true, '');
        break;
    }
  }

  // ─── Audio command handler ────────────────────────────────────────────────

  function handleAudioCommand(event: NostrEvent, windowId: string): void {
    const topicTag = event.tags?.find((t) => t[0] === 't');
    const topic = topicTag?.[1];

    switch (topic) {
      case 'shell:audio-register': {
        let title = '';
        try { const p = JSON.parse(event.content); title = p.title ?? ''; } catch { /* ignore */ }
        const pubkey = nappKeyRegistry.getPubkey(windowId);
        const nappEntry = pubkey ? nappKeyRegistry.getEntry(pubkey) : undefined;
        audioManager.register(windowId, nappEntry?.dTag ?? 'unknown', title);
        break;
      }
      case 'shell:audio-unregister': {
        audioManager.unregister(windowId);
        break;
      }
      case 'shell:audio-state-changed': {
        let update: { title?: string } = {};
        try { update = JSON.parse(event.content); } catch { /* ignore */ }
        audioManager.updateState(windowId, update);
        break;
      }
    }
  }

  // ─── Public interface ─────────────────────────────────────────────────────

  function handleMessage(msgEvent: MessageEvent): void {
    const sourceWindow = msgEvent.source as Window | null;
    if (!sourceWindow) return;

    const windowId = originRegistry.getWindowId(sourceWindow);
    if (!windowId) return;

    const msg = msgEvent.data;
    if (!Array.isArray(msg) || msg.length < 2) return;

    const [verb] = msg;

    if (verb === 'AUTH') {
      void handleAuth(msg, windowId, sourceWindow);
      return;
    }

    if (!nappKeyRegistry.getPubkey(windowId)) {
      let queue = pendingAuthQueue.get(windowId);
      if (!queue) { queue = []; pendingAuthQueue.set(windowId, queue); }
      queue.push({ msg, sourceWindow });
      return;
    }

    dispatchVerb(verb, msg, windowId, sourceWindow);
  }

  function sendChallenge(windowId: string): void {
    const win = originRegistry.getIframeWindow(windowId);
    if (!win) return;
    const challenge = crypto.randomUUID();
    pendingChallenges.set(windowId, challenge);
    win.postMessage(['AUTH', challenge], '*');
  }

  function injectEvent(topic: string, payload: unknown): void {
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
  }

  function cleanup(): void {
    pendingChallenges.clear();
    pendingAuthQueue.clear();
    authInFlight.clear();
    seenEventIds.clear();
    subscriptions.clear();
    eventBuffer.length = 0;
  }

  return { handleMessage, sendChallenge, injectEvent, cleanup };
}
