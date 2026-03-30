/**
 * signer-demo.ts -- Mock signer for demonstrating NIP-07 proxy delegation.
 *
 * Provides a mock signer that the shell's AuthHooks.getSigner() returns.
 * When a napplet calls window.nostr.signEvent(), the request flows through
 * the shell's signer proxy, which calls this mock signer.
 *
 * The mock signer:
 * 1. Signs non-destructive kinds immediately (demonstrates sign:event flow)
 * 2. Both flows are visible in the debugger as kind 29001 request + kind 29002 response
 */

import { generateSecretKey, getPublicKey, finalizeEvent } from 'nostr-tools/pure';

// Generate a demo host keypair (this represents the "user's" key)
const hostSecretKey = generateSecretKey();
const hostPubkey = getPublicKey(hostSecretKey);

/**
 * Create ShellHooks auth overrides that provide a real signer.
 * The signer uses a demo keypair -- not a real user identity.
 */
export function createSignerHooks(): {
  getUserPubkey: () => string;
  getSigner: () => {
    getPublicKey: () => Promise<string>;
    signEvent: (event: Parameters<typeof finalizeEvent>[0]) => Promise<ReturnType<typeof finalizeEvent>>;
  };
} {
  return {
    getUserPubkey: () => hostPubkey,
    getSigner: () => ({
      getPublicKey: async () => hostPubkey,
      signEvent: async (event) => {
        // Sign with the demo host key
        return finalizeEvent(event, hostSecretKey);
      },
    }),
  };
}

/**
 * Get the demo host pubkey for display in the UI.
 */
export function getDemoHostPubkey(): string {
  return hostPubkey;
}
