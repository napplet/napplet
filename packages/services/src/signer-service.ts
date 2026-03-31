/**
 * signer-service.ts — Signer service implementation.
 *
 * Extracts the signer request/response handling from the runtime into
 * a standalone ServiceHandler. Napplets send kind 29001 signer requests;
 * the service dispatches to the configured signer and responds with
 * kind 29002 result events.
 */

import type { NostrEvent } from '@napplet/core';
import { BusKind } from '@napplet/core';
import type { ServiceHandler, RuntimeSigner } from '@napplet/runtime';

/** Default kinds that require user consent before signing. */
const DEFAULT_CONSENT_KINDS = [0, 3, 5, 10002];

/**
 * Options for creating a signer service.
 *
 * @example
 * ```ts
 * const signerService = createSignerService({
 *   getSigner: () => window.nostr ?? null,
 *   onConsentNeeded: ({ event, resolve }) => {
 *     const allowed = confirm(`Allow signing kind ${event.kind}?`);
 *     resolve(allowed);
 *   },
 * });
 * ```
 */
export interface SignerServiceOptions {
  /**
   * Get the current signer instance. Returns null if no signer is available.
   * Called on every signer request — availability can change dynamically.
   */
  getSigner: () => RuntimeSigner | null;

  /**
   * Called when a napplet requests signing of a destructive kind.
   * The shell host should present a consent UI and call resolve(true/false).
   * If not provided, destructive kinds are signed without consent gating.
   *
   * @param request - Contains windowId, the event to sign, and a resolve callback
   */
  onConsentNeeded?: (request: {
    windowId: string;
    event: NostrEvent;
    resolve: (allowed: boolean) => void;
  }) => void;

  /**
   * Kinds that require user consent before signing.
   * Default: [0, 3, 5, 10002] (metadata, contacts, relay list, NIP-46 relay list).
   */
  consentKinds?: number[];
}

/**
 * Create a signer service that handles NIP-07 compatible signing requests.
 *
 * Napplets send kind 29001 events with method/params tags. The service
 * dispatches to the configured signer and responds with kind 29002
 * result events via the send callback.
 *
 * @param options - Signer configuration including getSigner and optional consent handler
 * @returns A ServiceHandler ready for runtime.registerService('signer', handler)
 *
 * @example
 * ```ts
 * import { createSignerService } from '@napplet/services';
 *
 * const signer = createSignerService({
 *   getSigner: () => mySignerAdapter,
 * });
 * runtime.registerService('signer', signer);
 * ```
 */
export function createSignerService(options: SignerServiceOptions): ServiceHandler {
  const consentKinds = new Set(options.consentKinds ?? DEFAULT_CONSENT_KINDS);

  return {
    descriptor: {
      name: 'signer',
      version: '1.0.0',
      description: 'NIP-07 compatible signer proxy',
    },

    handleMessage(windowId: string, message: unknown[], send: (msg: unknown[]) => void): void {
      if (message[0] !== 'EVENT') return;
      const event = message[1] as NostrEvent | undefined;
      if (!event || typeof event !== 'object') return;
      if (event.kind !== BusKind.SIGNER_REQUEST) return;

      const corrId = event.tags?.find((t) => t[0] === 'id')?.[1] ?? event.id;
      const method = event.tags?.find((t) => t[0] === 'method')?.[1];

      function sendOk(success: boolean, reason: string): void {
        send(['OK', event!.id, success, reason]);
      }

      const maybeSigner = options.getSigner();
      if (!maybeSigner) {
        sendOk(false, 'error: no signer configured');
        return;
      }
      const signer = maybeSigner;

      function dispatch(eventToSign: NostrEvent | null): void {
        const signerPromise: Promise<unknown> = (() => {
          switch (method) {
            case 'getPublicKey':
              return Promise.resolve(signer.getPublicKey?.());
            case 'signEvent':
              return eventToSign
                ? (signer.signEvent?.(eventToSign) ?? Promise.resolve(null))
                : Promise.resolve(null);
            case 'getRelays':
              return Promise.resolve(signer.getRelays?.() ?? {});
            case 'nip04.encrypt': {
              const p = event!.tags?.find((t) => t[0] === 'params');
              return signer.nip04?.encrypt(p?.[1] ?? '', p?.[2] ?? '') ?? Promise.resolve('');
            }
            case 'nip04.decrypt': {
              const p = event!.tags?.find((t) => t[0] === 'params');
              return signer.nip04?.decrypt(p?.[1] ?? '', p?.[2] ?? '') ?? Promise.resolve('');
            }
            case 'nip44.encrypt': {
              const p = event!.tags?.find((t) => t[0] === 'params');
              return signer.nip44?.encrypt(p?.[1] ?? '', p?.[2] ?? '') ?? Promise.resolve('');
            }
            case 'nip44.decrypt': {
              const p = event!.tags?.find((t) => t[0] === 'params');
              return signer.nip44?.decrypt(p?.[1] ?? '', p?.[2] ?? '') ?? Promise.resolve('');
            }
            default:
              return Promise.reject(new Error(`Unknown signer method: ${method}`));
          }
        })();

        signerPromise
          .then((result) => {
            const responseEvent: Partial<NostrEvent> = {
              kind: BusKind.SIGNER_RESPONSE,
              pubkey: '',
              created_at: Math.floor(Date.now() / 1000),
              tags: [
                ['id', corrId],
                ['method', method ?? ''],
                ['result', JSON.stringify(result)],
              ],
              content: '',
              id: '',
              sig: '',
            };
            send(['EVENT', '__signer__', responseEvent]);
            sendOk(true, '');
          })
          .catch((err: unknown) => {
            sendOk(false, `error: ${(err as Error).message ?? 'signing failed'}`);
          });
      }

      // Handle signEvent with consent gating for destructive kinds
      const eventTag = event.tags?.find((t) => t[0] === 'event')?.[1];
      if (method === 'signEvent' && eventTag) {
        let eventToSign: NostrEvent;
        try {
          eventToSign = JSON.parse(eventTag) as NostrEvent;
        } catch {
          sendOk(false, 'error: invalid event JSON');
          return;
        }

        if (consentKinds.has(eventToSign.kind) && options.onConsentNeeded) {
          new Promise<boolean>((resolve) => {
            options.onConsentNeeded!({
              windowId,
              event: eventToSign,
              resolve,
            });
          })
            .then((allowed) => {
              if (!allowed) {
                sendOk(false, 'error: user rejected');
                return;
              }
              dispatch(eventToSign);
            })
            .catch(() => {
              sendOk(false, 'error: consent check failed');
            });
          return;
        }

        dispatch(eventToSign);
        return;
      }

      dispatch(null);
    },

    // Signer has no per-window state to clean up
    onWindowDestroyed(_windowId: string): void {
      /* no-op */
    },
  };
}
