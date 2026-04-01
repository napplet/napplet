import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  parseBunkerUri,
  buildNostrConnectUri,
  createNip46Client,
} from '../../apps/demo/src/nip46-client.ts';

// ─── parseBunkerUri ───────────────────────────────────────────────────────────

describe('parseBunkerUri()', () => {
  const validPubkey = 'a'.repeat(64);
  const validRelay = 'wss://relay.nsec.app';

  it('parses a valid bunker:// URI with relay and secret', () => {
    const uri = `bunker://${validPubkey}?relay=${encodeURIComponent(validRelay)}&secret=mytoken`;
    const result = parseBunkerUri(uri);
    expect(result).not.toBeNull();
    expect(result?.pubkey).toBe(validPubkey);
    expect(result?.relay).toBe(validRelay);
    expect(result?.secret).toBe('mytoken');
  });

  it('parses a valid bunker:// URI without a secret', () => {
    const uri = `bunker://${validPubkey}?relay=${encodeURIComponent(validRelay)}`;
    const result = parseBunkerUri(uri);
    expect(result).not.toBeNull();
    expect(result?.pubkey).toBe(validPubkey);
    expect(result?.relay).toBe(validRelay);
    expect(result?.secret).toBeUndefined();
  });

  it('parses a valid nostrconnect:// URI', () => {
    const uri = `nostrconnect://${validPubkey}?relay=${encodeURIComponent(validRelay)}`;
    const result = parseBunkerUri(uri);
    expect(result).not.toBeNull();
    expect(result?.pubkey).toBe(validPubkey);
    expect(result?.relay).toBe(validRelay);
  });

  it('returns null for an empty string', () => {
    expect(parseBunkerUri('')).toBeNull();
  });

  it('returns null for an unknown scheme', () => {
    expect(parseBunkerUri(`https://${validPubkey}?relay=${validRelay}`)).toBeNull();
  });

  it('returns null for a pubkey with wrong length', () => {
    const shortPubkey = 'a'.repeat(32);
    expect(parseBunkerUri(`bunker://${shortPubkey}?relay=${validRelay}`)).toBeNull();
  });

  it('returns null when relay param is missing', () => {
    expect(parseBunkerUri(`bunker://${validPubkey}`)).toBeNull();
  });

  it('returns null for a pubkey with non-hex characters', () => {
    const badPubkey = 'z'.repeat(64);
    expect(parseBunkerUri(`bunker://${badPubkey}?relay=${validRelay}`)).toBeNull();
  });
});

// ─── buildNostrConnectUri ─────────────────────────────────────────────────────

describe('buildNostrConnectUri()', () => {
  const localPubkey = 'b'.repeat(64);
  const relayUrl = 'wss://relay.nsec.app';

  it('produces a nostrconnect:// URI', () => {
    const uri = buildNostrConnectUri(relayUrl, localPubkey);
    expect(uri).toMatch(/^nostrconnect:\/\//);
  });

  it('embeds the local pubkey in the URI', () => {
    const uri = buildNostrConnectUri(relayUrl, localPubkey);
    expect(uri).toContain(localPubkey);
  });

  it('encodes the relay URL as a query parameter', () => {
    const uri = buildNostrConnectUri(relayUrl, localPubkey);
    expect(uri).toContain('relay=');
    // The relay URL must be present somewhere in the URI (encoded or plain)
    expect(uri).toContain(encodeURIComponent(relayUrl));
  });

  it('is parseable by parseBunkerUri as nostrconnect:// scheme', () => {
    const localPub = 'c'.repeat(64);
    const uri = buildNostrConnectUri('wss://relay.example.com', localPub);
    const parsed = parseBunkerUri(uri);
    expect(parsed).not.toBeNull();
    expect(parsed?.pubkey).toBe(localPub);
    expect(parsed?.relay).toBe('wss://relay.example.com');
  });

  it('handles relay URLs with special characters by encoding them', () => {
    const specialRelay = 'wss://relay.example.com/path?token=abc&other=def';
    const uri = buildNostrConnectUri(specialRelay, localPubkey);
    expect(uri).toMatch(/^nostrconnect:\/\//);
    const parsed = parseBunkerUri(uri);
    expect(parsed?.relay).toBe(specialRelay);
  });
});

// ─── createNip46Client() — connectNip46 flow integration ──────────────────────

describe('createNip46Client() — signer connection integration via signer-connection.ts', () => {
  beforeEach(() => {
    // Mock WebSocket globally for tests
    vi.stubGlobal('WebSocket', class MockWebSocket {
      static OPEN = 1;
      static CLOSED = 3;
      readyState = 0;
      onopen: (() => void) | null = null;
      onmessage: ((event: { data: string }) => void) | null = null;
      onerror: (() => void) | null = null;
      onclose: (() => void) | null = null;
      private _url: string;
      constructor(url: string) { this._url = url; }
      send(_data: string): void { /* no-op */ }
      close(): void { this.readyState = 3; }
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('createNip46Client returns an object with connect, getSigner, and close methods', () => {
    const client = createNip46Client({
      relayUrl: 'wss://relay.nsec.app',
      bunkerPubkey: 'd'.repeat(64),
    });
    expect(typeof client.connect).toBe('function');
    expect(typeof client.getSigner).toBe('function');
    expect(typeof client.close).toBe('function');
  });

  it('getSigner() returns a RuntimeSigner with getPublicKey and signEvent', () => {
    const client = createNip46Client({
      relayUrl: 'wss://relay.nsec.app',
      bunkerPubkey: 'd'.repeat(64),
    });
    const signer = client.getSigner();
    expect(typeof signer.getPublicKey).toBe('function');
    expect(typeof signer.signEvent).toBe('function');
    expect(signer.nip04).toBeDefined();
    expect(signer.nip44).toBeDefined();
  });

  it('close() does not throw even if WebSocket was never opened', () => {
    const client = createNip46Client({
      relayUrl: 'wss://relay.nsec.app',
      bunkerPubkey: 'd'.repeat(64),
    });
    expect(() => client.close()).not.toThrow();
  });
});

// ─── connectNip46() state transitions via signer-connection.ts ────────────────

describe('connectNip46() state transitions', () => {
  beforeEach(() => {
    vi.resetModules();
    // Mock WebSocket to simulate a connection
    vi.stubGlobal('WebSocket', class MockWebSocket {
      static OPEN = 1;
      static CLOSED = 3;
      readyState = 0;
      onopen: (() => void) | null = null;
      onmessage: ((event: { data: string }) => void) | null = null;
      onerror: (() => void) | null = null;
      onclose: (() => void) | null = null;
      constructor() {
        // Simulate connection failure immediately for predictable test behavior
        setTimeout(() => {
          if (this.onerror) this.onerror();
        }, 10);
      }
      send(_data: string): void { /* no-op */ }
      close(): void { this.readyState = 3; }
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('connectNip46() sets error when WebSocket connection fails', async () => {
    const { connectNip46, getSignerConnectionState, disconnectSigner } = await import(
      '../../apps/demo/src/signer-connection.ts'
    );
    // Ensure clean state
    disconnectSigner();

    await connectNip46({
      relayUrl: 'wss://invalid.relay.test',
      bunkerPubkey: 'e'.repeat(64),
    });

    const state = getSignerConnectionState();
    expect(state.method).toBe('none');
    expect(state.isConnecting).toBe(false);
    expect(state.error).toBeTruthy();
    expect(state.error).toContain('NIP-46 connection failed');
  });
});
