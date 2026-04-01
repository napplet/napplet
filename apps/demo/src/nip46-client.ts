/**
 * nip46-client.ts — Minimal NIP-46 (Nostr Connect) requester client.
 *
 * Implements the client/requester side of the NIP-46 bunker protocol.
 * Opens a WebSocket to the user-specified relay, completes the connect
 * handshake with the bunker, and exposes a RuntimeSigner-compatible
 * adapter for signing requests.
 *
 * Reference: https://github.com/nostr-protocol/nips/blob/master/46.md
 */

import {
  generateSecretKey,
  getPublicKey,
  finalizeEvent,
} from 'nostr-tools/pure';
import { nip04 } from 'nostr-tools';
import type { RuntimeSigner } from '@napplet/runtime';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Nip46ClientOptions {
  relayUrl: string;
  bunkerPubkey: string;
  secret?: string;
  timeout?: number; // ms, default 30000
}

export interface Nip46Client {
  /** Connect to the bunker and complete handshake. Returns the authorized pubkey. */
  connect(): Promise<string>;
  /** Returns a RuntimeSigner-compatible adapter over the bunker connection. */
  getSigner(): RuntimeSigner;
  /** Close the WebSocket and clean up. */
  close(): void;
}

// ─── URI Parsing ──────────────────────────────────────────────────────────────

/**
 * Parse a bunker:// URI into its components.
 *
 * Handles:
 * - `bunker://<pubkey>?relay=<url>&secret=<token>`
 * - `nostrconnect://<pubkey>?relay=<url>` (outbound QR form)
 *
 * @returns null for invalid or unparseable URIs
 */
export function parseBunkerUri(uri: string): { pubkey: string; relay: string; secret?: string } | null {
  if (!uri || typeof uri !== 'string') return null;

  let scheme: string;
  let rest: string;

  if (uri.startsWith('bunker://')) {
    scheme = 'bunker';
    rest = uri.slice('bunker://'.length);
  } else if (uri.startsWith('nostrconnect://')) {
    scheme = 'nostrconnect';
    rest = uri.slice('nostrconnect://'.length);
  } else {
    return null;
  }

  const questionMark = rest.indexOf('?');
  const pubkey = questionMark !== -1 ? rest.slice(0, questionMark) : rest;
  const queryString = questionMark !== -1 ? rest.slice(questionMark + 1) : '';

  if (!pubkey || pubkey.length !== 64 || !/^[0-9a-f]+$/.test(pubkey)) {
    return null;
  }

  const params = new URLSearchParams(queryString);
  const relay = params.get('relay');
  if (!relay) return null;

  const secret = params.get('secret') ?? undefined;
  void scheme; // scheme is validated implicitly by the prefix checks above
  return { pubkey, relay, secret };
}

/**
 * Build a nostrconnect:// URI for QR code display.
 * The remote bunker app scans this to initiate the connection.
 */
export function buildNostrConnectUri(relayUrl: string, localPubkey: string): string {
  const params = new URLSearchParams({ relay: relayUrl });
  return `nostrconnect://${localPubkey}?${params.toString()}`;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Create a NIP-46 requester client.
 *
 * @example
 * ```ts
 * const client = createNip46Client({
 *   relayUrl: 'wss://relay.nsec.app',
 *   bunkerPubkey: 'abc123...',
 *   secret: 'optional-token',
 * });
 * const pubkey = await client.connect();
 * const signer = client.getSigner();
 * ```
 */
export function createNip46Client(options: Nip46ClientOptions): Nip46Client {
  const { relayUrl, bunkerPubkey, secret, timeout = 30000 } = options;

  // Ephemeral requester keypair — never exposed outside this closure
  const localSecretKey = generateSecretKey();
  const localPubkey = getPublicKey(localSecretKey);

  let ws: WebSocket | null = null;
  let authorizedPubkey: string | null = null;

  // Pending request map: correlationId → { resolve, reject, timer }
  const pending = new Map<string, {
    resolve: (value: unknown) => void;
    reject: (reason: Error) => void;
    timer: ReturnType<typeof setTimeout>;
  }>();

  // Subscription to the relay
  const subId = `nip46-${localPubkey.substring(0, 8)}`;

  function cleanup(): void {
    for (const entry of pending.values()) {
      clearTimeout(entry.timer);
      entry.reject(new Error('NIP-46 client closed'));
    }
    pending.clear();
    if (ws && ws.readyState !== WebSocket.CLOSED) {
      ws.close();
    }
    ws = null;
  }

  async function encryptPayload(method: string, params: unknown[]): Promise<string> {
    const payload = JSON.stringify({ id: crypto.randomUUID(), method, params });
    return nip04.encrypt(localSecretKey, bunkerPubkey, payload);
  }

  async function decryptPayload(encryptedContent: string): Promise<{ id: string; result?: unknown; error?: string }> {
    const decrypted = await nip04.decrypt(localSecretKey, bunkerPubkey, encryptedContent);
    return JSON.parse(decrypted) as { id: string; result?: unknown; error?: string };
  }

  async function sendRequest(method: string, params: unknown[]): Promise<unknown> {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error('NIP-46 WebSocket not open');
    }

    const correlationId = crypto.randomUUID();
    const encryptedContent = await encryptPayload(method, params);

    // Build and sign the NIP-46 request event (kind 24133)
    const eventTemplate = {
      kind: 24133,
      created_at: Math.floor(Date.now() / 1000),
      tags: [['p', bunkerPubkey]],
      content: encryptedContent,
      pubkey: localPubkey,
    };
    const signedEvent = finalizeEvent(eventTemplate, localSecretKey);

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(correlationId);
        reject(new Error(`NIP-46 request timed out: ${method}`));
      }, timeout);

      // Store with a wrapper that decrypts the response
      pending.set(correlationId, {
        resolve: (encryptedResponse: unknown) => {
          clearTimeout(timer);
          pending.delete(correlationId);
          // Response content is already decrypted in the message handler
          resolve(encryptedResponse);
        },
        reject: (err: Error) => {
          clearTimeout(timer);
          pending.delete(correlationId);
          reject(err);
        },
        timer,
      });

      // The correlation ID for NIP-46 is embedded in the encrypted payload, not the outer event.
      // We use a separate map keyed by the inner payload id.
      // Update: re-key using the correlationId embedded in the payload.
      // To correlate responses, we need to match on the inner payload id.
      // Store an alias mapping: inner id (correlationId) → outer resolve/reject.
      // Since we control the inner payload id, use correlationId directly.
      pending.set(correlationId, {
        resolve: (result: unknown) => {
          clearTimeout(timer);
          pending.delete(correlationId);
          resolve(result);
        },
        reject: (err: Error) => {
          clearTimeout(timer);
          pending.delete(correlationId);
          reject(err);
        },
        timer,
      });

      // Override the correlationId embedded in the event by re-encrypting with it
      // We already encrypted above; instead, store correlationId as the inner "id".
      // The inner payload already uses correlationId as `id` because we set it in encryptPayload.
      // Actually we need to pass correlationId to encryptPayload — let's redo this properly.

      ws!.send(JSON.stringify(['EVENT', signedEvent]));
    });
  }

  // Re-implement sendRequest properly with explicit correlationId in payload
  async function sendRequestWithId(correlationId: string, method: string, params: unknown[]): Promise<unknown> {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error('NIP-46 WebSocket not open');
    }

    const payload = JSON.stringify({ id: correlationId, method, params });
    const encryptedContent = await nip04.encrypt(localSecretKey, bunkerPubkey, payload);

    const eventTemplate = {
      kind: 24133,
      created_at: Math.floor(Date.now() / 1000),
      tags: [['p', bunkerPubkey]],
      content: encryptedContent,
      pubkey: localPubkey,
    };
    const signedEvent = finalizeEvent(eventTemplate, localSecretKey);

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(correlationId);
        reject(new Error(`NIP-46 request timed out: ${method}`));
      }, timeout);

      pending.set(correlationId, {
        resolve,
        reject,
        timer,
      });

      ws!.send(JSON.stringify(['EVENT', signedEvent]));
    });
  }

  // Suppress the first (duplicate) sendRequest — use sendRequestWithId everywhere
  void sendRequest;

  async function handleRelayMessage(data: string): Promise<void> {
    let msg: unknown[];
    try {
      msg = JSON.parse(data) as unknown[];
    } catch {
      return;
    }

    if (!Array.isArray(msg) || msg[0] !== 'EVENT') return;

    const event = msg[2] as Record<string, unknown> | undefined;
    if (!event || event.kind !== 24133) return;

    // Decrypt response
    let response: { id: string; result?: unknown; error?: string };
    try {
      const decrypted = await nip04.decrypt(localSecretKey, bunkerPubkey, event.content as string);
      response = JSON.parse(decrypted) as { id: string; result?: unknown; error?: string };
    } catch {
      return;
    }

    const entry = pending.get(response.id);
    if (!entry) return;

    if (response.error) {
      entry.reject(new Error(response.error));
    } else {
      entry.resolve(response.result);
    }
  }

  function openWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      ws = new WebSocket(relayUrl);

      ws.onopen = () => {
        // Subscribe to responses addressed to our local pubkey
        const subMsg = JSON.stringify([
          'REQ',
          subId,
          { kinds: [24133], '#p': [localPubkey] },
        ]);
        ws!.send(subMsg);
        resolve();
      };

      ws.onmessage = (event: MessageEvent) => {
        handleRelayMessage(event.data as string).catch(() => { /* ignore */ });
      };

      ws.onerror = () => {
        reject(new Error(`NIP-46 WebSocket connection failed: ${relayUrl}`));
      };

      ws.onclose = () => {
        // Reject all pending requests on unexpected close
        for (const entry of pending.values()) {
          clearTimeout(entry.timer);
          entry.reject(new Error('NIP-46 WebSocket closed unexpectedly'));
        }
        pending.clear();
      };
    });
  }

  return {
    async connect(): Promise<string> {
      await openWebSocket();

      const connectParams: unknown[] = [bunkerPubkey];
      if (secret) connectParams.push(secret);
      else connectParams.push('');

      const correlationId = crypto.randomUUID();
      const result = await sendRequestWithId(correlationId, 'connect', connectParams);

      // The connect response contains the authorized pubkey
      if (typeof result === 'string') {
        authorizedPubkey = result;
      } else if (result && typeof result === 'object' && 'pubkey' in result) {
        authorizedPubkey = (result as { pubkey: string }).pubkey;
      } else {
        // Some bunkers return 'ack' on connect — get pubkey explicitly
        const pkCorrId = crypto.randomUUID();
        const pkResult = await sendRequestWithId(pkCorrId, 'get_public_key', []);
        authorizedPubkey = pkResult as string;
      }

      return authorizedPubkey!;
    },

    getSigner(): RuntimeSigner {
      return {
        getPublicKey: async (): Promise<string> => {
          if (authorizedPubkey) return authorizedPubkey;
          const corrId = crypto.randomUUID();
          const result = await sendRequestWithId(corrId, 'get_public_key', []);
          return result as string;
        },

        signEvent: async (event: Record<string, unknown>): Promise<Record<string, unknown>> => {
          const corrId = crypto.randomUUID();
          const result = await sendRequestWithId(corrId, 'sign_event', [JSON.stringify(event)]);
          if (typeof result === 'string') {
            return JSON.parse(result) as Record<string, unknown>;
          }
          return result as Record<string, unknown>;
        },

        nip04: {
          encrypt: async (pubkey: string, plaintext: string): Promise<string> => {
            const corrId = crypto.randomUUID();
            const result = await sendRequestWithId(corrId, 'nip04_encrypt', [pubkey, plaintext]);
            return result as string;
          },
          decrypt: async (pubkey: string, ciphertext: string): Promise<string> => {
            const corrId = crypto.randomUUID();
            const result = await sendRequestWithId(corrId, 'nip04_decrypt', [pubkey, ciphertext]);
            return result as string;
          },
        },

        nip44: {
          encrypt: async (pubkey: string, plaintext: string): Promise<string> => {
            const corrId = crypto.randomUUID();
            const result = await sendRequestWithId(corrId, 'nip44_encrypt', [pubkey, plaintext]);
            return result as string;
          },
          decrypt: async (pubkey: string, ciphertext: string): Promise<string> => {
            const corrId = crypto.randomUUID();
            const result = await sendRequestWithId(corrId, 'nip44_decrypt', [pubkey, ciphertext]);
            return result as string;
          },
        },
      };
    },

    close(): void {
      cleanup();
    },
  };
}
