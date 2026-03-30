/**
 * auth-event-builder.ts -- Factory for constructing AUTH events for testing.
 *
 * Generates kind 22242 AUTH events with real nostr-tools signatures.
 * Supports configurable defects for testing rejection paths:
 * - Bad signature (signed then corrupted)
 * - Expired timestamp
 * - Future timestamp
 * - Wrong challenge value
 * - Wrong relay tag
 * - Wrong event kind
 * - Missing type tag
 * - Missing aggregateHash tag
 *
 * Usage (in Playwright test, Node side):
 *   const { event, secretKey } = buildAuthEvent({
 *     challenge: challengeFromShell,
 *     defect: 'expired-timestamp',
 *   });
 *   await page.evaluate((e) => window.__injectMessage__(windowId, ['AUTH', e]), event);
 */

import { generateSecretKey, getPublicKey, finalizeEvent } from 'nostr-tools/pure';

export interface AuthEventOptions {
  /** The AUTH challenge string from the shell (from __getChallenge__) */
  challenge: string;
  /** The relay URI to include in the relay tag. Default: 'napplet://shell' */
  relayUri?: string;
  /** The nappType to include in the type tag. Default: 'auth-test' */
  nappType?: string;
  /** The aggregateHash to include. Default: '' (empty string) */
  aggregateHash?: string;
  /** Optional: provide a specific secret key instead of generating one */
  secretKey?: Uint8Array;
  /** The defect to introduce. 'none' creates a valid AUTH event. */
  defect?:
    | 'none'
    | 'bad-signature'
    | 'expired-timestamp'
    | 'future-timestamp'
    | 'wrong-challenge'
    | 'wrong-relay'
    | 'wrong-kind'
    | 'missing-type-tag'
    | 'missing-aggregate-hash-tag';
}

export interface AuthEventResult {
  /** The constructed (and possibly defective) AUTH event */
  event: Record<string, unknown>;
  /** The secret key used (for potential re-signing or pubkey extraction) */
  secretKey: Uint8Array;
  /** The public key (hex) of the signer */
  pubkey: string;
}

/**
 * Build a kind 22242 AUTH event with an optional defect.
 *
 * The event is signed with a real Schnorr signature via nostr-tools,
 * then the specified defect is applied (e.g., corrupting the signature,
 * changing the timestamp, etc.).
 *
 * @param options - Configuration for the AUTH event
 * @returns The constructed event, secret key, and pubkey
 *
 * @example
 * ```ts
 * const { event } = buildAuthEvent({
 *   challenge: 'abc123',
 *   defect: 'bad-signature',
 * });
 * ```
 */
export function buildAuthEvent(options: AuthEventOptions): AuthEventResult {
  const {
    challenge,
    relayUri = 'napplet://shell',
    nappType = 'auth-test',
    aggregateHash = '',
    defect = 'none',
  } = options;

  const secretKey = options.secretKey ?? generateSecretKey();
  const pubkey = getPublicKey(secretKey);

  // Build tags
  const tags: string[][] = [
    ['relay', defect === 'wrong-relay' ? 'wss://malicious-relay.example.com' : relayUri],
    ['challenge', defect === 'wrong-challenge' ? 'wrong-challenge-value-' + crypto.randomUUID() : challenge],
  ];

  // Add type tag unless defect is missing-type-tag
  if (defect !== 'missing-type-tag') {
    tags.push(['type', nappType]);
  }

  // Add aggregateHash tag unless defect is missing-aggregate-hash-tag
  if (defect !== 'missing-aggregate-hash-tag') {
    tags.push(['aggregateHash', aggregateHash]);
  }

  // Build unsigned event template
  const eventTemplate = {
    kind: defect === 'wrong-kind' ? 1 : 22242,
    created_at: defect === 'expired-timestamp'
      ? Math.floor(Date.now() / 1000) - 120  // 120 seconds ago (>60s limit)
      : defect === 'future-timestamp'
        ? Math.floor(Date.now() / 1000) + 120  // 120 seconds in future (>60s limit)
        : Math.floor(Date.now() / 1000),
    tags,
    content: '',
  };

  // Sign with nostr-tools (produces real Schnorr signature)
  const signed = finalizeEvent(eventTemplate, secretKey);

  // Apply post-signing defects
  let event: Record<string, unknown> = { ...signed };

  if (defect === 'bad-signature') {
    // Corrupt the signature by flipping the last 4 hex chars
    const sigHex = signed.sig;
    const corrupted = sigHex.slice(0, -4) + 'ffff';
    event = { ...signed, sig: corrupted };
  }

  return {
    event,
    secretKey,
    pubkey,
  };
}

/**
 * Build a valid AUTH event (convenience wrapper).
 *
 * @param challenge - The challenge string from the shell
 * @param secretKey - Optional: reuse an existing key
 * @returns The valid AUTH event, secret key, and pubkey
 */
export function buildValidAuthEvent(
  challenge: string,
  secretKey?: Uint8Array
): AuthEventResult {
  return buildAuthEvent({ challenge, defect: 'none', secretKey });
}
