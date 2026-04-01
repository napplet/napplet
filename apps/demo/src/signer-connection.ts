/**
 * signer-connection.ts — Demo signer connection state model.
 *
 * Owns the live signer connection state for the demo shell.
 * Supports NIP-07 (browser extension) and NIP-46 (bunker) connection flows.
 * The active signer ref is read by shell-host.ts via getSigner() on every
 * signer service request — no restart required when the signer changes.
 */

import type { RuntimeSigner } from '@napplet/runtime';

// ─── Public Types ────────────────────────────────────────────────────────────

export type SignerConnectionMethod = 'nip07' | 'nip46' | 'none';

export interface SignerRequestRecord {
  timestamp: number;
  method: string;     // 'signEvent', 'getPublicKey', 'nip04.encrypt', etc.
  kind?: number;      // for signEvent requests
  success: boolean;
}

export interface SignerConnectionState {
  method: SignerConnectionMethod;
  pubkey: string | null;
  relay: string | null;           // NIP-46 only; null for NIP-07
  recentRequests: SignerRequestRecord[];
  isConnecting: boolean;
  error: string | null;
}

/** Minimal NIP-07 window.nostr interface. */
export interface Nip07Signer {
  getPublicKey(): Promise<string>;
  signEvent(event: Record<string, unknown>): Promise<Record<string, unknown>>;
  getRelays?(): Promise<Record<string, { read: boolean; write: boolean }>>;
  nip04?: {
    encrypt(pubkey: string, plaintext: string): Promise<string>;
    decrypt(pubkey: string, ciphertext: string): Promise<string>;
  };
  nip44?: {
    encrypt(pubkey: string, plaintext: string): Promise<string>;
    decrypt(pubkey: string, ciphertext: string): Promise<string>;
  };
}

// ─── Module State ─────────────────────────────────────────────────────────────

const MAX_RECENT_REQUESTS = 20;

const _initialState: SignerConnectionState = {
  method: 'none',
  pubkey: null,
  relay: null,
  recentRequests: [],
  isConnecting: false,
  error: null,
};

let _state: SignerConnectionState = { ..._initialState };
let _activeSigner: RuntimeSigner | null = null;
const _listeners: Array<(state: SignerConnectionState) => void> = [];

// ─── Internal Helpers ─────────────────────────────────────────────────────────

function _setState(next: SignerConnectionState): void {
  _state = next;
  for (const cb of _listeners) {
    try { cb({ ...next }); } catch { /* ignore listener errors */ }
  }
}

/**
 * Build a RuntimeSigner-compatible adapter over window.nostr (NIP-07).
 * Forwards all available methods and returns null/undefined for unavailable ones.
 */
function buildNip07Adapter(nostr: Nip07Signer): RuntimeSigner {
  const adapter: RuntimeSigner = {
    getPublicKey: () => nostr.getPublicKey(),
    signEvent: (event) => nostr.signEvent(event as Record<string, unknown>) as ReturnType<NonNullable<RuntimeSigner['signEvent']>>,
  };

  if (typeof nostr.getRelays === 'function') {
    adapter.getRelays = () => nostr.getRelays!();
  }

  if (nostr.nip04) {
    adapter.nip04 = {
      encrypt: (pubkey, plaintext) => nostr.nip04!.encrypt(pubkey, plaintext),
      decrypt: (pubkey, ciphertext) => nostr.nip04!.decrypt(pubkey, ciphertext),
    };
  }

  if (nostr.nip44) {
    adapter.nip44 = {
      encrypt: (pubkey, plaintext) => nostr.nip44!.encrypt(pubkey, plaintext),
      decrypt: (pubkey, ciphertext) => nostr.nip44!.decrypt(pubkey, ciphertext),
    };
  }

  return adapter;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Get a shallow copy of the current signer connection state.
 */
export function getSignerConnectionState(): SignerConnectionState {
  return { ..._state, recentRequests: [..._state.recentRequests] };
}

/**
 * Get the active signer, or null if no signer is connected.
 * Suitable for passing directly to createSignerService({ getSigner }).
 */
export function getSigner(): RuntimeSigner | null {
  return _activeSigner;
}

/**
 * Record a signer request event (called from message tap).
 * Maintains a rolling window of MAX_RECENT_REQUESTS records.
 */
export function recordSignerRequest(record: SignerRequestRecord): void {
  const requests = [..._state.recentRequests, record];
  if (requests.length > MAX_RECENT_REQUESTS) {
    requests.splice(0, requests.length - MAX_RECENT_REQUESTS);
  }
  _setState({ ..._state, recentRequests: requests });
}

/**
 * Connect to a NIP-07 browser extension signer.
 * Sets isConnecting, retrieves the pubkey, and stores the adapter.
 * On failure, sets the error field and clears isConnecting.
 */
export async function connectNip07(): Promise<void> {
  const nostr = (window as unknown as Record<string, unknown>).nostr as Nip07Signer | undefined;
  if (!nostr || typeof nostr.getPublicKey !== 'function') {
    _setState({ ..._state, error: 'No NIP-07 extension detected', isConnecting: false });
    return;
  }
  _setState({ ..._state, isConnecting: true, error: null });
  try {
    const pubkey = await nostr.getPublicKey();
    _activeSigner = buildNip07Adapter(nostr);
    _setState({
      ..._state,
      method: 'nip07',
      pubkey,
      relay: null,
      isConnecting: false,
      error: null,
    });
  } catch (err) {
    _activeSigner = null;
    _setState({
      ..._state,
      isConnecting: false,
      error: `Connection failed: ${(err as Error).message ?? 'unknown error'}`,
    });
  }
}

/**
 * Disconnect the active signer and reset connection state.
 * Calls close() on any NIP-46 client if one is active.
 */
export function disconnectSigner(): void {
  // NIP-46 client cleanup is handled by connectNip46 below (module-level ref)
  _cleanupNip46();
  _activeSigner = null;
  _setState({ ..._initialState, recentRequests: [] });
}

/**
 * Subscribe to signer connection state changes.
 * The callback receives a shallow copy of the new state.
 * Returns an unsubscribe function.
 */
export function onStateChange(cb: (state: SignerConnectionState) => void): () => void {
  _listeners.push(cb);
  return () => {
    const i = _listeners.indexOf(cb);
    if (i !== -1) _listeners.splice(i, 1);
  };
}

// ─── NIP-46 Extension (added in Plan 31-02) ──────────────────────────────────

export interface Nip46ConnectOptions {
  relayUrl: string;
  bunkerPubkey: string;
  secret?: string;
}

/** Module-level NIP-46 client ref for cleanup in disconnectSigner(). */
let _nip46Client: { close(): void } | null = null;

function _cleanupNip46(): void {
  if (_nip46Client) {
    try { _nip46Client.close(); } catch { /* best-effort */ }
    _nip46Client = null;
  }
}

/**
 * Connect to a NIP-46 bunker.
 * Creates a NIP-46 client, performs the connect handshake, and wires
 * the resulting signer into the active signer ref.
 */
export async function connectNip46(options: Nip46ConnectOptions): Promise<void> {
  const { createNip46Client } = await import('./nip46-client.js');

  _cleanupNip46();
  _setState({ ..._state, isConnecting: true, error: null });

  try {
    const client = createNip46Client({
      relayUrl: options.relayUrl,
      bunkerPubkey: options.bunkerPubkey,
      secret: options.secret,
    });

    const pubkey = await client.connect();

    _nip46Client = client;
    _activeSigner = client.getSigner();
    _setState({
      ..._state,
      method: 'nip46',
      pubkey,
      relay: options.relayUrl,
      isConnecting: false,
      error: null,
    });
  } catch (err) {
    _activeSigner = null;
    _nip46Client = null;
    _setState({
      ..._state,
      isConnecting: false,
      error: `NIP-46 connection failed: ${(err as Error).message ?? 'unknown error'}`,
    });
  }
}

// ─── Inspector Detail (Phase 29 surface) ─────────────────────────────────────

export interface SignerInspectorDetail {
  method: SignerConnectionMethod;
  pubkey: string | null;
  relay: string | null;
  recentRequests: SignerRequestRecord[];
  isConnecting: boolean;
  error: string | null;
}

/**
 * Get full signer state for the inspector panel.
 * Includes the complete recentRequests history (up to 20 records).
 */
export function getSignerInspectorDetail(): SignerInspectorDetail {
  return { ...getSignerConnectionState() };
}
