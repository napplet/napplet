/**
 * signer-demo.ts -- Mock signer for demonstrating NIP-07 proxy delegation.
 *
 * Provides a mock signer that the shell's AuthHooks.getSigner() returns.
 * The demo host now registers a signer service, and that service delegates
 * to this mock signer through runtime hooks. The hook remains available as a
 * fallback path if the service is removed, but the demo should label that
 * runtime fallback explicitly instead of implying it is the primary topology.
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
 * Create auth hook overrides that provide a demo signer implementation.
 * The signer uses a demo keypair, not a real end-user identity.
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
