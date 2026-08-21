import { describe, expect, it } from 'vitest';
import { encodeBuildSignerSecret, RedactedSecret, type Clock } from '@napplet/build-tools';
import { finalizeEvent, generateSecretKey } from 'nostr-tools/pure';
import { createNodeDiscoveryServices, createNodePairingAdapter } from './node-nostr.js';

const clock: Clock = {
  now: () => 1_700_000_000_000,
  setTimeout: (callback, delayMs) => setTimeout(callback, delayMs),
  clearTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

describe('production Node Nostr adapters', () => {
  it('locally verifies relay candidates and rejects forged signatures', () => {
    const event = finalizeEvent({ kind: 10_002, created_at: 1_700_000_000, tags: [], content: '' }, generateSecretKey());
    const discovery = createNodeDiscoveryServices();
    const forged = {
      id: event.id,
      pubkey: event.pubkey,
      created_at: event.created_at,
      kind: event.kind,
      tags: event.tags,
      content: event.content,
      sig: '0'.repeat(128),
    };

    expect(discovery.verifyEvent?.(forged)).toBe(false);
    expect(discovery.verifyEvent?.(event)).toBe(true);
  });

  it('decodes stored nbunksec identity without opening a relay', () => {
    const remotePubkey = 'a'.repeat(64);
    const relays = ['wss://signer.example'];
    const encoded = encodeBuildSignerSecret({
      remotePubkey,
      clientSecretKey: 'b'.repeat(64),
      relays,
      secret: 'pair-secret',
    });

    const identity = createNodePairingAdapter(clock).parseStoredSession(new RedactedSecret(encoded));
    expect(identity).toEqual({ remotePubkey, relays });
  });
});
