import type {
  ShellAdapter,
  RelayPoolHooks,
  RelayConfigHooks,
  WindowManagerHooks,
  AuthHooks,
  ConfigHooks,
  HotkeyHooks,
  WorkerRelayHooks,
  CryptoHooks,
  NostrEvent,
} from '@napplet/shell';
import { createMockRelayPool, type MockRelayPool } from './mock-relay-pool.js';

/** Call tracking for test assertions */
export interface MockCallLog {
  trackSubscription: Array<{ subKey: string }>;
  untrackSubscription: Array<{ subKey: string }>;
  published: NostrEvent[];
  hotkeyExecutions: Array<{ key: string; code: string }>;
}

export interface MockHooksResult {
  hooks: ShellAdapter;
  relayPool: MockRelayPool;
  callLog: MockCallLog;
  /** Override the signer returned by auth.getSigner() */
  setSigner(signer: unknown): void;
  /** Override the user pubkey returned by auth.getUserPubkey() */
  setUserPubkey(pubkey: string): void;
}

/**
 * Create a complete mock ShellAdapter object for testing.
 *
 * All hooks have sensible defaults. Crypto uses real nostr-tools verifyEvent
 * for genuine signature verification (critical for AUTH handshake testing).
 *
 * @param overrides - Partial ShellAdapter to override specific hooks
 */
export function createMockHooks(overrides?: Partial<ShellAdapter>): MockHooksResult {
  const mockRelayPool = createMockRelayPool();
  const subscriptionCleanups = new Map<string, () => void>();
  let userPubkey = '0'.repeat(64);
  let signer: unknown = null;

  const callLog: MockCallLog = {
    trackSubscription: [],
    untrackSubscription: [],
    published: [],
    hotkeyExecutions: [],
  };

  const relayPool: RelayPoolHooks = {
    getRelayPool: () => mockRelayPool,
    trackSubscription: (subKey: string, cleanup: () => void) => {
      callLog.trackSubscription.push({ subKey });
      subscriptionCleanups.set(subKey, cleanup);
    },
    untrackSubscription: (subKey: string) => {
      callLog.untrackSubscription.push({ subKey });
      const cleanup = subscriptionCleanups.get(subKey);
      if (cleanup) cleanup();
      subscriptionCleanups.delete(subKey);
    },
    openScopedRelay: () => {},
    closeScopedRelay: () => {},
    publishToScopedRelay: () => false,
    selectRelayTier: () => [],
    ...overrides?.relayPool,
  };

  const relayConfig: RelayConfigHooks = {
    addRelay: () => {},
    removeRelay: () => {},
    getRelayConfig: () => ({ discovery: [], super: [], outbox: [] }),
    getNip66Suggestions: () => null,
    ...overrides?.relayConfig,
  };

  const windowManager: WindowManagerHooks = {
    createWindow: () => null,
    ...overrides?.windowManager,
  };

  const auth: AuthHooks = {
    getUserPubkey: () => userPubkey,
    getSigner: () => signer,
    ...overrides?.auth,
  };

  const config: ConfigHooks = {
    getNappUpdateBehavior: () => 'auto-grant',
    ...overrides?.config,
  };

  const hotkeys: HotkeyHooks = {
    executeHotkeyFromForward: (event) => {
      callLog.hotkeyExecutions.push({ key: event.key, code: event.code });
    },
    ...overrides?.hotkeys,
  };

  const workerRelay: WorkerRelayHooks = {
    getWorkerRelay: () => null,
    ...overrides?.workerRelay,
  };

  const crypto: CryptoHooks = {
    verifyEvent: async (event: NostrEvent): Promise<boolean> => {
      // Use real nostr-tools verification -- critical for AUTH testing
      const { verifyEvent } = await import('nostr-tools/pure');
      return verifyEvent(event as Parameters<typeof verifyEvent>[0]);
    },
    ...overrides?.crypto,
  };

  const hooks: ShellAdapter = {
    relayPool,
    relayConfig,
    windowManager,
    auth,
    config,
    hotkeys,
    workerRelay,
    crypto,
  };

  return {
    hooks,
    relayPool: mockRelayPool,
    callLog,
    setSigner(s: unknown) { signer = s; },
    setUserPubkey(p: string) { userPubkey = p; },
  };
}
