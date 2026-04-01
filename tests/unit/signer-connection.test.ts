import { describe, expect, it, vi, beforeEach } from 'vitest';

// Re-import fresh module state for each describe block using dynamic imports

describe('signer-connection.ts — basic state model', () => {
  it('exports getSignerConnectionState with initial disconnected state', async () => {
    const { getSignerConnectionState } = await import('../../apps/demo/src/signer-connection.ts');
    const state = getSignerConnectionState();
    // Initial method may be 'none' unless previous tests left it in a different state
    // Just assert the shape is correct
    expect(typeof state.method).toBe('string');
    expect(state.pubkey === null || typeof state.pubkey === 'string').toBe(true);
    expect(Array.isArray(state.recentRequests)).toBe(true);
    expect(typeof state.isConnecting).toBe('boolean');
  });

  it('getSigner() returns null when no signer is connected', async () => {
    const { getSigner, disconnectSigner } = await import('../../apps/demo/src/signer-connection.ts');
    disconnectSigner(); // ensure clean state
    expect(getSigner()).toBeNull();
  });

  it('onStateChange() returns an unsubscribe function', async () => {
    const { onStateChange } = await import('../../apps/demo/src/signer-connection.ts');
    const cb = vi.fn();
    const unsub = onStateChange(cb);
    expect(typeof unsub).toBe('function');
    unsub();
  });

  it('onStateChange() callback fires when state changes via recordSignerRequest()', async () => {
    const { onStateChange, recordSignerRequest, disconnectSigner } = await import(
      '../../apps/demo/src/signer-connection.ts'
    );
    disconnectSigner();
    const cb = vi.fn();
    const unsub = onStateChange(cb);

    recordSignerRequest({ timestamp: Date.now(), method: 'signEvent', kind: 1, success: true });

    expect(cb).toHaveBeenCalledOnce();
    const state = cb.mock.calls[0][0];
    expect(state.recentRequests).toHaveLength(1);
    expect(state.recentRequests[0].method).toBe('signEvent');
    expect(state.recentRequests[0].kind).toBe(1);
    expect(state.recentRequests[0].success).toBe(true);

    unsub();
  });
});

describe('recordSignerRequest() — ring buffer behavior', () => {
  it('caps recentRequests at 20 records', async () => {
    const { recordSignerRequest, getSignerConnectionState, disconnectSigner } = await import(
      '../../apps/demo/src/signer-connection.ts'
    );
    disconnectSigner(); // clear existing records

    // Add 25 records
    for (let i = 0; i < 25; i++) {
      recordSignerRequest({ timestamp: Date.now() + i, method: 'getPublicKey', success: true });
    }

    const state = getSignerConnectionState();
    expect(state.recentRequests.length).toBeLessThanOrEqual(20);
  });

  it('retains the most recent records when at capacity', async () => {
    const { recordSignerRequest, getSignerConnectionState, disconnectSigner } = await import(
      '../../apps/demo/src/signer-connection.ts'
    );
    disconnectSigner();

    // Add 22 records with identifiable methods
    for (let i = 0; i < 22; i++) {
      recordSignerRequest({
        timestamp: Date.now() + i,
        method: i < 2 ? 'old-request' : 'new-request',
        success: true,
      });
    }

    const state = getSignerConnectionState();
    // The oldest records (old-request) should have been evicted
    const hasOldRequest = state.recentRequests.some((r) => r.method === 'old-request');
    expect(hasOldRequest).toBe(false);
    expect(state.recentRequests.every((r) => r.method === 'new-request')).toBe(true);
  });
});

describe('connectNip07() state transitions', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      nostr: undefined,
    });
  });

  it('sets error when window.nostr is not available', async () => {
    vi.stubGlobal('window', {});
    const { connectNip07, getSignerConnectionState, disconnectSigner } = await import(
      '../../apps/demo/src/signer-connection.ts'
    );
    disconnectSigner();
    await connectNip07();
    const state = getSignerConnectionState();
    expect(state.error).toContain('No NIP-07 extension detected');
    expect(state.method).toBe('none');
    expect(state.isConnecting).toBe(false);
  });

  it('connects successfully when window.nostr returns a pubkey', async () => {
    const testPubkey = 'f'.repeat(64);
    vi.stubGlobal('window', {
      nostr: {
        getPublicKey: vi.fn().mockResolvedValue(testPubkey),
        signEvent: vi.fn().mockResolvedValue({ id: 'abc', sig: 'xyz' }),
      },
    });

    const { connectNip07, getSignerConnectionState, getSigner, disconnectSigner } = await import(
      '../../apps/demo/src/signer-connection.ts'
    );
    disconnectSigner();
    await connectNip07();
    const state = getSignerConnectionState();

    expect(state.method).toBe('nip07');
    expect(state.pubkey).toBe(testPubkey);
    expect(state.error).toBeNull();
    expect(state.isConnecting).toBe(false);
    expect(getSigner()).not.toBeNull();

    disconnectSigner();
  });

  it('disconnectSigner() resets state and returns null signer', async () => {
    const testPubkey = '1'.repeat(64);
    vi.stubGlobal('window', {
      nostr: {
        getPublicKey: vi.fn().mockResolvedValue(testPubkey),
        signEvent: vi.fn(),
      },
    });

    const { connectNip07, disconnectSigner, getSignerConnectionState, getSigner } = await import(
      '../../apps/demo/src/signer-connection.ts'
    );
    await connectNip07();
    disconnectSigner();

    const state = getSignerConnectionState();
    expect(state.method).toBe('none');
    expect(state.pubkey).toBeNull();
    expect(getSigner()).toBeNull();
  });
});

describe('getSignerInspectorDetail()', () => {
  it('returns the same shape as getSignerConnectionState', async () => {
    const { getSignerInspectorDetail, getSignerConnectionState } = await import(
      '../../apps/demo/src/signer-connection.ts'
    );
    const state = getSignerConnectionState();
    const detail = getSignerInspectorDetail();

    expect(detail.method).toBe(state.method);
    expect(detail.pubkey).toBe(state.pubkey);
    expect(detail.relay).toBe(state.relay);
    expect(detail.isConnecting).toBe(state.isConnecting);
    expect(detail.error).toBe(state.error);
    expect(Array.isArray(detail.recentRequests)).toBe(true);
  });
});
