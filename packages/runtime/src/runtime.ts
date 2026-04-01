/**
 * runtime.ts — The napplet protocol engine factory.
 *
 * createRuntime(hooks) creates the complete protocol engine that handles
 * all five NIP-01 verbs (EVENT, REQ, CLOSE, COUNT, AUTH), subscription
 * lifecycle, AUTH handshake, signer proxying, and shell command routing.
 *
 * No browser APIs. No DOM. No localStorage. No postMessage.
 * All I/O is delegated to RuntimeAdapter.
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
  RuntimeAdapter, SessionEntry, ConsentRequest, ConsentHandler,
  ServiceHandler, ServiceRegistry, CompatibilityReport, ServiceInfo,
} from './types.js';
import { routeServiceMessage, notifyServiceWindowDestroyed } from './service-dispatch.js';
import { handleDiscoveryReq, isDiscoveryReq, createServiceDiscoveryEvent } from './service-discovery.js';
import type { DiscoverySubscription } from './service-discovery.js';
import { createSessionRegistry } from './session-registry.js';
import type { SessionRegistry } from './session-registry.js';
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

  /**
   * Register a service handler dynamically after runtime creation.
   * If a handler is already registered for this name, it is replaced.
   *
   * @param name - Service name (e.g., 'audio', 'notifications')
   * @param handler - The service handler implementation
   */
  registerService(name: string, handler: ServiceHandler): void;

  /**
   * Unregister a service handler by name. No-op if the name is not registered.
   *
   * @param name - Service name to remove
   */
  unregisterService(name: string): void;

  /**
   * Clean up all state associated with a napplet window.
   * Removes subscriptions, pending state, and notifies service handlers.
   *
   * @param windowId - The window to clean up
   */
  destroyWindow(windowId: string): void;

  /** Access the identity registry (for shell adapter to read napplet session state). */
  readonly sessionRegistry: SessionRegistry;

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
 * @returns A Runtime instance ready to handle napplet messages
 *
 * @example
 * ```ts
 * const runtime = createRuntime(hooks);
 * // On incoming message from napplet:
 * runtime.handleMessage(windowId, msg);
 * ```
 */
export function createRuntime(hooks: RuntimeAdapter): Runtime {
  // ─── Module-level state ──────────────────────────────────────────────────

  const pendingChallenges = new Map<string, string>();
  const subscriptions = new Map<string, SubscriptionEntry>();
  const pendingAuthQueue = new Map<string, Array<{ msg: unknown[]; windowId: string }>>();
  const authInFlight = new Set<string>();
  let _consentHandler: ConsentHandler | null = null;

  // ─── Service Registry (static from hooks + dynamic from registerService) ──
  const serviceRegistry: ServiceRegistry = { ...(hooks.services ?? {}) };

  // ─── Registered Services (for compatibility checks) ───────────────────────
  // Tracks service name → ServiceInfo for compatibility checks (Phase 22).
  // Populated by registerService / unregisterService.
  const registeredServices = new Map<string, ServiceInfo>();
  // Pre-populate from static hooks.services
  for (const [name, handler] of Object.entries(serviceRegistry)) {
    registeredServices.set(name, {
      name: handler.descriptor.name,
      version: handler.descriptor.version,
      description: handler.descriptor.description,
    });
  }

  // ─── Undeclared Service Consent Cache (Phase 22) ──────────────────────────
  /** Tracks consented undeclared service usage per session: "windowId:serviceName" */
  const undeclaredServiceConsents = new Set<string>();

  // ─── Discovery Subscription Tracking ──────────────────────────────────────
  /** Open kind 29010 subscriptions that should receive live service updates. */
  const discoverySubscriptions = new Map<string, DiscoverySubscription>();

  // ─── Sub-module instances ────────────────────────────────────────────────

  const sessionRegistry = createSessionRegistry(hooks.onPendingUpdate);
  const aclState = createAclState(hooks.aclPersistence);
  const manifestCache = createManifestCache(hooks.manifestPersistence);
  const replayDetector = createReplayDetector();

  const enforce = createEnforceGate({
    checkAcl: (pubkey, dTag, aggregateHash, capability) =>
      aclState.check(pubkey, dTag, aggregateHash, capability),
    resolveIdentity: (pubkey) => {
      const entry = sessionRegistry.getEntry(pubkey);
      return entry ? { dTag: entry.dTag, aggregateHash: entry.aggregateHash } : undefined;
    },
    onAclCheck: hooks.onAclCheck,
  });

  const eventBuffer = createEventBuffer(
    hooks.sendToNapplet,
    sessionRegistry,
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
    const nappletType = typeTag[1];
    const dTag = parseInt(authEvent.pubkey.slice(0, 8), 16).toString(36) + nappletType;
    const hashTag = authEvent.tags?.find((t) => t[0] === 'aggregateHash');
    if (!hashTag) { rejectAuth('missing required aggregateHash tag'); return; }
    const aggregateHash = hashTag[1];

    // Helper: cache manifest entry while preserving any pre-populated requires.
    function cacheManifest(pubkey: string, dTag: string, hash: string): void {
      const existingRequires = manifestCache.getRequires(pubkey, dTag);
      manifestCache.set({
        pubkey, dTag, aggregateHash: hash, verifiedAt: Date.now(),
        requires: existingRequires.length > 0 ? existingRequires : undefined,
      });
    }

    const entry: SessionEntry = {
      pubkey: authEvent.pubkey, windowId, origin: '*',
      type: nappletType, dTag, aggregateHash, registeredAt: Date.now(),
    };

    // Check for napp updates
    const previousCacheEntry = manifestCache.get(authEvent.pubkey, dTag);
    const isUpdate = previousCacheEntry
      && previousCacheEntry.aggregateHash !== aggregateHash
      && previousCacheEntry.aggregateHash !== '';

    if (isUpdate) {
      const updateBehavior = hooks.config.getNappUpdateBehavior();
      if (updateBehavior === 'banner') {
        sessionRegistry.setPendingUpdate(windowId, {
          windowId, pubkey: authEvent.pubkey, dTag,
          oldHash: previousCacheEntry!.aggregateHash, newHash: aggregateHash,
          resolve: (action) => {
            if (action === 'accept') {
              cacheManifest(authEvent.pubkey, dTag, aggregateHash);
              sessionRegistry.register(windowId, entry);
              sessionRegistry.clearPendingUpdate(windowId);
              const queued = pendingAuthQueue.get(windowId);
              pendingAuthQueue.delete(windowId);
              if (queued) for (const { msg: qMsg } of queued) dispatchVerb(qMsg[0], qMsg, windowId);
            } else {
              pendingAuthQueue.delete(windowId);
              sessionRegistry.clearPendingUpdate(windowId);
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
      cacheManifest(authEvent.pubkey, dTag, aggregateHash);
    }

    if (aggregateHash && !manifestCache.has(authEvent.pubkey, dTag, aggregateHash)) {
      cacheManifest(authEvent.pubkey, dTag, aggregateHash);
    }

    sessionRegistry.register(windowId, entry);
    pendingChallenges.delete(windowId);

    // ─── Compatibility check (Phase 22) ─────────────────────────────────────
    const requires = manifestCache.getRequires(authEvent.pubkey, dTag);
    const isCompatible = checkCompatibility(requires, windowId, eventId);
    if (!isCompatible) {
      // Strict mode: blocked. Do not dispatch queued messages.
      pendingAuthQueue.delete(windowId);
      return;
    }

    hooks.sendToNapplet(windowId, ['OK', eventId, true, '']);

    const queued = pendingAuthQueue.get(windowId);
    pendingAuthQueue.delete(windowId);
    if (queued) for (const { msg: qMsg } of queued) dispatchVerb(qMsg[0], qMsg, windowId);

    const userPubkey = hooks.auth.getUserPubkey();
    if (userPubkey) runtimeInstance.injectEvent('auth:identity-changed', { pubkey: userPubkey });
  }

  // ─── Compatibility Check (Phase 22) ─────────────────────────────────────

  /**
   * Check if a napplet's declared service requirements are satisfied.
   * Called after AUTH succeeds but before queued messages are dispatched.
   *
   * Returns true if compatible (or permissive mode allows loading).
   * Returns false only in strict mode when required services are missing.
   */
  function checkCompatibility(
    requires: string[],
    windowId: string,
    eventId: string,
  ): boolean {
    if (requires.length === 0) return true;

    const available: ServiceInfo[] = Array.from(registeredServices.values());
    const registeredNames = new Set(registeredServices.keys());
    const missing = requires.filter((name) => !registeredNames.has(name));
    const compatible = missing.length === 0;

    if (!compatible) {
      const report: CompatibilityReport = { available, missing, compatible };
      hooks.onCompatibilityIssue?.(report);

      if (hooks.strictMode) {
        hooks.sendToNapplet(windowId, [
          'OK', eventId, false,
          `blocked: missing required services: ${missing.join(', ')}`,
        ]);
        return false;
      }
    }

    return true;
  }

  // ─── Undeclared Service Check (Phase 22) ──────────────────────────────────

  /**
   * Check if a napplet is using a service it did not declare in its manifest.
   * If undeclared, raises a consent request via the consent handler.
   *
   * Returns true if the service is declared or consent was previously granted.
   * Returns false if consent is needed (async — caller must wait for resolve).
   * Calls onApproved when consent is granted, allowing the caller to proceed.
   */
  function checkUndeclaredService(
    windowId: string,
    pubkey: string,
    serviceName: string,
    event: NostrEvent,
    onApproved: () => void,
  ): boolean {
    // If the service is not registered, this is not our concern — let normal dispatch handle it
    if (!registeredServices.has(serviceName)) return true;

    // Look up the napplet's declared requires via two-step registry lookup
    const nappletPubkey = sessionRegistry.getPubkey(windowId);
    if (!nappletPubkey) return true; // No identity yet — skip check
    const nappletEntry = sessionRegistry.getEntry(nappletPubkey);
    if (!nappletEntry) return true;

    const requires = manifestCache.getRequires(nappletEntry.pubkey, nappletEntry.dTag);

    // If the service IS declared in requires, no consent needed
    if (requires.includes(serviceName)) return true;

    // Check consent cache — already approved this session
    const consentKey = `${windowId}:${serviceName}`;
    if (undeclaredServiceConsents.has(consentKey)) return true;

    // Raise consent request
    if (_consentHandler) {
      _consentHandler({
        type: 'undeclared-service',
        windowId,
        pubkey,
        event,
        serviceName,
        resolve: (allowed: boolean) => {
          if (allowed) {
            undeclaredServiceConsents.add(consentKey);
            onApproved();
          }
          // If denied, event is silently dropped
        },
      });
      return false; // Async — caller should not proceed synchronously
    }

    // No consent handler registered — silently drop undeclared service usage
    return false;
  }

  function handleEvent(msg: unknown[], windowId: string): void {
    const event = msg[1] as NostrEvent | undefined;
    if (!event || typeof event !== 'object') return;
    const eventId = event.id ?? '';

    function sendOk(success: boolean, reason: string): void {
      hooks.sendToNapplet(windowId, ['OK', eventId, success, reason]);
    }

    const pubkey = sessionRegistry.getPubkey(windowId);
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
      case BusKind.SIGNER_REQUEST: {
        // Service path: dispatch to registered signer service if available
        const signerService = serviceRegistry['signer'];
        if (signerService) {
          signerService.handleMessage(
            windowId,
            ['EVENT', event],
            (msg) => hooks.sendToNapplet(windowId, msg),
          );
          return;
        }
        // Fallback: use internal signer handler (requires hooks.auth.getSigner)
        handleSignerRequest(event, windowId, pubkey);
        return;
      }
      case BusKind.HOTKEY_FORWARD:
        try { handleHotkeyForward(event); } catch { /* Best-effort hotkey forwarding */ }
        break;
      case BusKind.IPC_PEER: {
        const topic = event.tags?.find((t) => t[0] === 't')?.[1];
        if (topic?.startsWith('shell:state-')) {
          handleStateRequest(windowId, event, hooks.sendToNapplet, sessionRegistry, aclState, hooks.statePersistence);
          return;
        }
        if (topic?.startsWith('shell:') || topic === 'shell:create-window' || topic === 'shell:send-dm') {
          handleShellCommand(event, windowId, topic!);
          return;
        }

        // ─── Undeclared service consent check (Phase 22) ──────────────────────
        // Extract service name from topic prefix (e.g., 'audio:play' -> 'audio')
        if (topic && topic.includes(':')) {
          const serviceName = topic.split(':')[0];
          // Only check if this looks like a service topic (registered service prefix)
          if (registeredServices.has(serviceName)) {
            const pubkeyForCheck = sessionRegistry.getPubkey(windowId) ?? '';
            const allowed = checkUndeclaredService(
              windowId, pubkeyForCheck, serviceName, event,
              () => { eventBuffer.bufferAndDeliver(event, windowId); },
            );
            if (!allowed) return; // Waiting for consent or denied
            // If allowed (declared or cached consent), fall through to normal dispatch
          }
        }

        // Service dispatch — route by topic prefix to registered handlers
        if (topic && routeServiceMessage(windowId, event, topic, serviceRegistry, hooks.sendToNapplet)) {
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
    const pubkey = sessionRegistry.getPubkey(windowId);
    if (!pubkey) { hooks.sendToNapplet(windowId, ['CLOSED', subId, 'auth-required']); return; }
    {
      const result = enforce(pubkey, 'relay:read');
      if (!result.allowed) { hooks.sendToNapplet(windowId, ['CLOSED', subId, formatDenialReason(result.capability)]); return; }
    }

    // ─── Service Discovery Interception ──────────────────────────────────────
    if (isDiscoveryReq(filters)) {
      const send = (msg: unknown[]): void => hooks.sendToNapplet(windowId, msg);
      const generateId = (): string =>
        hooks.crypto.randomUUID().replace(/-/g, '').slice(0, 64).padEnd(64, '0');
      const sub = handleDiscoveryReq(windowId, subId, serviceRegistry, send, generateId);
      const discSubKey = `${windowId}:${subId}`;
      discoverySubscriptions.set(discSubKey, sub);
      // Also track in main subscriptions map for CLOSE handling
      subscriptions.set(discSubKey, { windowId, filters });
      return;
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

    // ─── Service dispatch path: route REQ to registered relay/cache services ──
    if (!isBusKind) {
      const relayService = serviceRegistry['relay'] ?? serviceRegistry['relay-pool'];
      const cacheService = !serviceRegistry['relay'] ? serviceRegistry['cache'] : undefined;

      if (relayService) {
        const send = (m: unknown[]): void => {
          if (subscriptions.has(subKey)) hooks.sendToNapplet(windowId, m);
        };
        relayService.handleMessage(windowId, msg, send);
        if (cacheService) {
          cacheService.handleMessage(windowId, msg, send);
        }
        return;
      }
    }

    // ─── Fallback: use internal relay pool + cache hooks ──────────────────────

    // Query local cache
    const cache = hooks.cache;
    if (cache?.isAvailable() && !isBusKind) {
      cache.query(filters)
        .then((cachedEvents) => { for (const event of cachedEvents) deliver(event); })
        .catch(() => { /* Cache query is best-effort */ });
    }

    // Subscribe to relay pool
    const pool = hooks.relayPool;
    if (pool?.isAvailable() && !isBusKind) {
      const relayUrls = pool.selectRelayTier(filters);
      let eoseSent = false;
      const eoseFallbackTimer = setTimeout(() => {
        if (!eoseSent) { eoseSent = true; hooks.sendToNapplet(windowId, ['EOSE', subId]); }
      }, 15_000);

      const subscription = pool.subscribe(filters, (item) => {
        if (item === 'EOSE') {
          clearTimeout(eoseFallbackTimer);
          if (!eoseSent) { eoseSent = true; hooks.sendToNapplet(windowId, ['EOSE', subId]); }
          return;
        }
        const event = item as NostrEvent;
        deliver(event);
        if (cache?.isAvailable() && !isBusKind) {
          try { cache.store(event); } catch { /* Cache write is best-effort */ }
        }
      }, relayUrls);

      pool.trackSubscription(subKey, () => {
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
    discoverySubscriptions.delete(subKey);

    // Service dispatch: forward CLOSE to registered relay service
    const relayService = serviceRegistry['relay'] ?? serviceRegistry['relay-pool'];
    if (relayService) {
      relayService.handleMessage(windowId, msg, () => { /* CLOSE has no response */ });
    }

    // Fallback: use internal relay pool hook (no-op if relayPool not provided)
    hooks.relayPool?.untrackSubscription(subKey);
  }

  function handleCount(msg: unknown[], windowId: string): void {
    const countId = msg[1] as string | undefined;
    if (typeof countId !== 'string') return;
    const filters = (msg.slice(2) as NostrFilter[]) ?? [];
    const pubkey = sessionRegistry.getPubkey(windowId);
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
        kind: BusKind.IPC_PEER, pubkey: '',
        created_at: Math.floor(Date.now() / 1000),
        tags: [['t', replyTopic]], content, id: '', sig: '',
      };
      hooks.sendToNapplet(windowId, ['EVENT', '__shell__', responseEvent]);
      sendOk(true, '');
    }

    switch (topic) {
      case 'shell:acl-get': {
        const aclEntries = aclState.getAllEntries();
        const nappletEntries = sessionRegistry.getAllEntries();
        const nappletInfoMap: Record<string, { type: string; registeredAt: number }> = {};
        for (const e of nappletEntries) nappletInfoMap[e.pubkey] = { type: e.type, registeredAt: e.registeredAt };
        const merged = [...aclEntries];
        for (const e of nappletEntries) {
          if (!merged.find((a) => a.pubkey === e.pubkey)) {
            merged.push({ pubkey: e.pubkey, capabilities: [...ALL_CAPABILITIES], blocked: false });
          }
        }
        const display = merged.map((e) => ({
          ...e, type: nappletInfoMap[e.pubkey]?.type ?? 'unknown',
          registeredAt: nappletInfoMap[e.pubkey]?.registeredAt ?? 0,
        }));
        sendInterPaneReply('shell:acl-current', JSON.stringify({ entries: display }));
        break;
      }
      case 'shell:acl-revoke': case 'shell:acl-grant': case 'shell:acl-block': case 'shell:acl-unblock': {
        const pk = event.tags?.find((t) => t[0] === 'pubkey')?.[1];
        const cap = event.tags?.find((t) => t[0] === 'cap')?.[1];
        if (!pk) { sendOk(false, 'error: missing pubkey tag'); break; }
        const ne = sessionRegistry.getEntry(pk);
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
          hooks.relayPool?.openScopedRelay(windowId, url, subId, filters, hooks.sendToNapplet);
          sendOk(true, '');
        } catch { sendOk(false, 'error: invalid filters'); }
        break;
      }
      case 'shell:relay-scoped-close':
        hooks.relayPool?.closeScopedRelay(windowId);
        sendOk(true, '');
        break;
      case 'shell:relay-scoped-publish': {
        const et = event.tags?.find((t) => t[0] === 'event')?.[1];
        if (!et) { sendOk(false, 'error: missing event tag'); break; }
        try {
          const signed = JSON.parse(et) as NostrEvent;
          const ok = hooks.relayPool?.publishToScopedRelay(windowId, signed) ?? false;
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
              kind: BusKind.IPC_PEER, pubkey: '',
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
    if (!sessionRegistry.getPubkey(windowId)) {
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
        kind: BusKind.IPC_PEER,
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
      discoverySubscriptions.clear();
      eventBuffer.clear();
      registeredServices.clear();
      undeclaredServiceConsents.clear();
    },

    registerConsentHandler(handler: ConsentHandler): void {
      _consentHandler = handler;
    },

    registerService(name: string, handler: ServiceHandler): void {
      serviceRegistry[name] = handler;
      // Populate registeredServices Map for compatibility checks (Phase 22)
      registeredServices.set(name, {
        name: handler.descriptor.name,
        version: handler.descriptor.version,
        description: handler.descriptor.description,
      });
      // Push discovery event to all open discovery subscriptions (D-10)
      if (discoverySubscriptions.size > 0) {
        const id = hooks.crypto.randomUUID().replace(/-/g, '').slice(0, 64).padEnd(64, '0');
        const event = createServiceDiscoveryEvent(handler, id);
        for (const [subKey, sub] of discoverySubscriptions) {
          // Only push if the subscription is still active
          if (subscriptions.has(subKey)) {
            hooks.sendToNapplet(sub.windowId, ['EVENT', sub.subId, event]);
          }
        }
      }
    },

    unregisterService(name: string): void {
      delete serviceRegistry[name];
      // Remove from registeredServices Map for compatibility checks (Phase 22)
      registeredServices.delete(name);
    },

    destroyWindow(windowId: string): void {
      // Clean up subscriptions for this window
      for (const [key] of subscriptions) {
        if (key.startsWith(`${windowId}:`)) {
          subscriptions.delete(key);
          hooks.relayPool?.untrackSubscription(key);
        }
      }
      // Clean up discovery subscriptions for this window
      for (const [key] of discoverySubscriptions) {
        if (key.startsWith(`${windowId}:`)) {
          discoverySubscriptions.delete(key);
        }
      }
      // Clean up pending auth state
      pendingChallenges.delete(windowId);
      pendingAuthQueue.delete(windowId);
      authInFlight.delete(windowId);
      // Notify service handlers
      notifyServiceWindowDestroyed(windowId, serviceRegistry);
    },

    get sessionRegistry() { return sessionRegistry; },
    get aclState() { return aclState; },
    get manifestCache() { return manifestCache; },
  };

  return runtimeInstance;
}
