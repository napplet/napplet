// @napplet/shim — NIP-DB window.nostrdb proxy
// Proxies query, add, event, replaceable, count, supports, subscribe through postMessage
// to the ShellBridge, which dispatches to WorkerRelayService (OPFS cache).

import { finalizeEvent } from 'nostr-tools/pure';
import { BusKind } from './types.js';
import type { NostrEvent, NostrFilter } from './types.js';
import type { NappletKeypair } from './napplet-keypair.js';

// ─── Module-level state ────────────────────────────────────────────────────────

/** Pending NIPDB requests: correlationId -> { resolve, reject } */
const nipdbPending = new Map<string, {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
}>();

/** Subscription ID used for NIPDB response routing. */
const NIPDB_SUB_ID = '__nipdb__';

/**
 * Active subscribe handlers: subId -> event callback.
 */
export const nipdbSubscribeHandlers = new Map<string, (event: NostrEvent) => void>();

/**
 * Subscribe cancellers: subId -> function that unblocks the waiting generator.
 */
export const nipdbSubscribeCancellers = new Map<string, () => void>();

/** Current keypair — set when installNostrDb is called. */
let _keypair: NappletKeypair | null = null;

// ─── Outbound helper ──────────────────────────────────────────────────────────

function sendNipdbRequestRaw(
  method: string,
  content: string,
  extraTags: string[][] = [],
): string {
  const correlationId = crypto.randomUUID();

  const tags: string[][] = [
    ['method', method],
    ['id', correlationId],
    ...extraTags,
  ];

  if (_keypair) {
    const event = finalizeEvent({
      kind: BusKind.NIPDB_REQUEST,
      created_at: Math.floor(Date.now() / 1000),
      tags,
      content,
    }, _keypair.privkey);
    window.parent.postMessage(['EVENT', event], '*');
  } else {
    const event = {
      kind: BusKind.NIPDB_REQUEST,
      created_at: Math.floor(Date.now() / 1000),
      tags,
      content,
      id: crypto.randomUUID(),
      pubkey: '',
      sig: '',
    };
    window.parent.postMessage(['EVENT', event], '*');
  }

  return correlationId;
}

function sendNipdbRequest(
  method: string,
  content: string,
  extraTags: string[][] = [],
): Promise<unknown> {
  return new Promise<unknown>((resolve, reject) => {
    const correlationId = sendNipdbRequestRaw(method, content, extraTags);

    nipdbPending.set(correlationId, { resolve, reject });

    setTimeout(() => {
      if (nipdbPending.delete(correlationId)) {
        reject(new Error(`NIPDB request '${method}' timed out`));
      }
    }, 10_000);
  });
}

// ─── Inbound response handler ─────────────────────────────────────────────────

export function handleNipdbResponse(event: NostrEvent): void {
  const methodTag = event.tags.find(t => t[0] === 'method');
  const method = methodTag?.[1];

  if (method === 'event-push') {
    const subIdTag = event.tags.find(t => t[0] === 'sub-id');
    const subId = subIdTag?.[1];
    if (!subId) return;

    const handler = nipdbSubscribeHandlers.get(subId);
    if (handler) {
      try {
        const pushedEvent = JSON.parse(event.content) as NostrEvent;
        handler(pushedEvent);
      } catch {
        // Malformed push — ignore
      }
    }
    return;
  }

  const idTag = event.tags.find(t => t[0] === 'id');
  const correlationId = idTag?.[1];
  if (!correlationId) return;

  const pending = nipdbPending.get(correlationId);
  if (!pending) return;

  nipdbPending.delete(correlationId);

  try {
    const result = event.content ? JSON.parse(event.content) : undefined;
    pending.resolve(result);
  } catch {
    pending.resolve(undefined);
  }
}

// ─── NIP-DB spec interface ────────────────────────────────────────────────────

const SUPPORTED_METHODS = ['query', 'add', 'event', 'replaceable', 'count', 'subscribe'] as const;

function handleNipdbMessage(msgEvent: MessageEvent): void {
  const msg = msgEvent.data;
  if (!Array.isArray(msg) || msg.length < 3) return;
  const [verb, subId, event] = msg;
  if (verb !== 'EVENT' || subId !== NIPDB_SUB_ID) return;
  handleNipdbResponse(event as NostrEvent);
}

/**
 * Install window.nostrdb with the full NIP-DB spec surface.
 *
 * @param keypair - Optional keypair for signing NIPDB_REQUEST events.
 * @returns cleanup function that removes window.nostrdb.
 */
export function installNostrDb(keypair?: NappletKeypair): () => void {
  if (keypair) {
    _keypair = keypair;
  }

  window.addEventListener('message', handleNipdbMessage);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).nostrdb = {
    async query(filters: NostrFilter | NostrFilter[]): Promise<NostrEvent[]> {
      const normalizedFilters = Array.isArray(filters) ? filters : [filters];
      const result = await sendNipdbRequest('query', JSON.stringify(normalizedFilters));
      return (result as NostrEvent[]) ?? [];
    },

    async add(event: NostrEvent): Promise<boolean> {
      const result = await sendNipdbRequest('add', JSON.stringify(event));
      return result === true;
    },

    async event(id: string): Promise<NostrEvent | undefined> {
      const result = await sendNipdbRequest('event', JSON.stringify({ id }));
      return result == null ? undefined : (result as NostrEvent);
    },

    async replaceable(kind: number, author: string, identifier?: string): Promise<NostrEvent | undefined> {
      const payload: { kind: number; author: string; identifier?: string } = { kind, author };
      if (identifier !== undefined) payload.identifier = identifier;
      const result = await sendNipdbRequest('replaceable', JSON.stringify(payload));
      return result == null ? undefined : (result as NostrEvent);
    },

    async count(filters: NostrFilter | NostrFilter[]): Promise<number> {
      const normalizedFilters = Array.isArray(filters) ? filters : [filters];
      const result = await sendNipdbRequest('count', JSON.stringify(normalizedFilters));
      return typeof result === 'number' ? result : 0;
    },

    async supports(): Promise<string[]> {
      return [...SUPPORTED_METHODS];
    },

    async *subscribe(filters: NostrFilter | NostrFilter[]): AsyncGenerator<NostrEvent> {
      const subId = crypto.randomUUID();
      const normalizedFilters = Array.isArray(filters) ? filters : [filters];

      sendNipdbRequestRaw('subscribe', JSON.stringify(normalizedFilters), [['sub-id', subId]]);

      const queue: NostrEvent[] = [];
      let wakeResolve: (() => void) | null = null;

      function wake(): void {
        if (wakeResolve) {
          const r = wakeResolve;
          wakeResolve = null;
          r();
        }
      }

      nipdbSubscribeHandlers.set(subId, (event: NostrEvent) => {
        queue.push(event);
        wake();
      });

      nipdbSubscribeCancellers.set(subId, wake);

      try {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          if (queue.length > 0) {
            yield queue.shift()!;
          } else {
            await new Promise<void>(resolve => {
              wakeResolve = resolve;
            });
          }
        }
      } finally {
        nipdbSubscribeHandlers.delete(subId);
        nipdbSubscribeCancellers.delete(subId);
        sendNipdbRequestRaw('unsubscribe', JSON.stringify({ subId }), [['sub-id', subId]]);
      }
    },
  };

  return () => {
    window.removeEventListener('message', handleNipdbMessage);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).nostrdb;
    nipdbPending.clear();
    nipdbSubscribeHandlers.clear();
  };
}
