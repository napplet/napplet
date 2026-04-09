// @napplet/nub-signer -- Signer NUB shim
// NIP-07 window.nostr proxy over postMessage to the shell.

import type { EventTemplate } from '@napplet/core';
import type {
  SignerGetPublicKeyMessage,
  SignerSignEventMessage,
  SignerGetRelaysMessage,
  SignerNip04EncryptMessage,
  SignerNip04DecryptMessage,
  SignerNip44EncryptMessage,
  SignerNip44DecryptMessage,
} from './types.js';

// ─── Pending signer requests ────────────────────────────────────────────────

const pendingRequests = new Map<string, {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
}>();

// ─── Signer request helper ──────────────────────────────────────────────────

/**
 * Send a signer request as a typed signer.* envelope message.
 */
function sendSignerRequest(method: string, params?: Record<string, unknown>): Promise<unknown> {
  const id = crypto.randomUUID();

  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });

    // Build typed signer message based on method
    let msg: SignerGetPublicKeyMessage | SignerSignEventMessage | SignerGetRelaysMessage |
      SignerNip04EncryptMessage | SignerNip04DecryptMessage |
      SignerNip44EncryptMessage | SignerNip44DecryptMessage;

    switch (method) {
      case 'getPublicKey':
        msg = { type: 'signer.getPublicKey', id };
        break;
      case 'signEvent':
        msg = { type: 'signer.signEvent', id, event: params!.event as EventTemplate };
        break;
      case 'getRelays':
        msg = { type: 'signer.getRelays', id };
        break;
      case 'nip04.encrypt':
        msg = { type: 'signer.nip04.encrypt', id, pubkey: params!.pubkey as string, plaintext: params!.plaintext as string };
        break;
      case 'nip04.decrypt':
        msg = { type: 'signer.nip04.decrypt', id, pubkey: params!.pubkey as string, ciphertext: params!.ciphertext as string };
        break;
      case 'nip44.encrypt':
        msg = { type: 'signer.nip44.encrypt', id, pubkey: params!.pubkey as string, plaintext: params!.plaintext as string };
        break;
      case 'nip44.decrypt':
        msg = { type: 'signer.nip44.decrypt', id, pubkey: params!.pubkey as string, ciphertext: params!.ciphertext as string };
        break;
      default:
        reject(new Error(`Unknown signer method: ${method}`));
        return;
    }

    window.parent.postMessage(msg, '*');

    setTimeout(() => {
      if (pendingRequests.delete(id)) {
        reject(new Error('Signer request timed out'));
      }
    }, 30_000);
  });
}

// ─── Signer response handler ──────────────────────────────────────────────────

/**
 * Handle signer.*.result envelope messages.
 * Extracts the result field from the type-specific response.
 */
export function handleSignerResponse(msg: { type: string; id: string; error?: string; [key: string]: unknown }): void {
  const pending = pendingRequests.get(msg.id);
  if (!pending) return;

  pendingRequests.delete(msg.id);

  if (msg.error) {
    pending.reject(new Error(msg.error));
    return;
  }

  // Extract the result value based on the message type
  const type = msg.type;
  if (type === 'signer.getPublicKey.result') {
    pending.resolve(msg.pubkey);
  } else if (type === 'signer.signEvent.result') {
    pending.resolve(msg.event);
  } else if (type === 'signer.getRelays.result') {
    pending.resolve(msg.relays);
  } else if (type === 'signer.nip04.encrypt.result' || type === 'signer.nip44.encrypt.result') {
    pending.resolve(msg.ciphertext);
  } else if (type === 'signer.nip04.decrypt.result' || type === 'signer.nip44.decrypt.result') {
    pending.resolve(msg.plaintext);
  } else {
    // Generic fallback: resolve with undefined
    pending.resolve(undefined);
  }
}

// ─── window.nostr NIP-07 object ─────────────────────────────────────────────

/**
 * The NIP-07 window.nostr object that proxies all signing operations
 * to the shell via postMessage.
 */
export const nostrProxy = {
  async getPublicKey(): Promise<string> {
    return sendSignerRequest('getPublicKey') as Promise<string>;
  },

  async signEvent(event: object): Promise<object> {
    return sendSignerRequest('signEvent', { event }) as Promise<object>;
  },

  async getRelays(): Promise<Record<string, object>> {
    return sendSignerRequest('getRelays') as Promise<Record<string, object>>;
  },

  nip04: {
    async encrypt(pubkey: string, plaintext: string): Promise<string> {
      return sendSignerRequest('nip04.encrypt', { pubkey, plaintext }) as Promise<string>;
    },
    async decrypt(pubkey: string, ciphertext: string): Promise<string> {
      return sendSignerRequest('nip04.decrypt', { pubkey, ciphertext }) as Promise<string>;
    },
  },

  nip44: {
    async encrypt(pubkey: string, plaintext: string): Promise<string> {
      return sendSignerRequest('nip44.encrypt', { pubkey, plaintext }) as Promise<string>;
    },
    async decrypt(pubkey: string, ciphertext: string): Promise<string> {
      return sendSignerRequest('nip44.decrypt', { pubkey, ciphertext }) as Promise<string>;
    },
  },
};

// ─── Shim installer ────────────────────────────────────────────────────────

/**
 * Install the signer shim: sets up window.nostr NIP-07 proxy and
 * registers the signer response handler.
 *
 * Called by @napplet/shim during initialization.
 *
 * @returns cleanup function
 */
export function installSignerShim(): () => void {
  (window as unknown as { nostr: unknown }).nostr = nostrProxy;

  return () => {
    pendingRequests.clear();
  };
}
