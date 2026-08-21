/**
 * Lazy, injectable Node adapters for the retained-asset optimizer.
 *
 * This module deliberately owns Node-only capabilities. It delegates NIP-46
 * session verification, protected persistence, discovery, endpoint policy,
 * and Blossom request semantics to @napplet/build-tools.
 */

import {
  BUILD_SIGNER_SESSION_KEY,
  createNetworkPolicy,
  createPlatformSecretStore,
  pairBuildSigner,
  RedactedSecret,
  reconnectBuildSigner,
} from '@napplet/build-tools';
import type {
  BlossomServices,
  BuildSigner,
  BuildSignerSession,
  Clock,
  DiscoveryServices,
  FileSystemAdapter,
  NetworkPolicy,
  ProcessAdapter,
  PublicAddressResolver,
  QrPairing,
  RelayClient,
  SafeLogger,
  SafeStatus,
  SecretStore,
  StoredSessionIdentity,
  TerminalAdapter,
} from '@napplet/build-tools';

/** The safe outcome of requesting a reusable or interactive build signer. */
export type NodeSignerResult =
  | { status: 'ready'; signer: BuildSigner; remotePubkey: string }
  | { status: 'unavailable' | 'failed'; reason: SafeStatus };

/** The safe outcome of one Node HTTP operation. */
export type NodeFetchResult =
  | { status: 'complete'; response: Response }
  | { status: 'failed'; reason: SafeStatus };

type NodeFetchInput = Parameters<typeof fetch>[0];

/** Node-specific pairing operations that preserve the shared NIP-46 contract. */
export interface NodePairingAdapter {
  parseStoredSession(secret: RedactedSecret): StoredSessionIdentity;
  reconnect(
    secret: RedactedSecret,
    identity: StoredSessionIdentity,
    signal: AbortSignal,
    relay: RelayClient | undefined,
  ): Promise<BuildSignerSession>;
  createQrPairing(signal: AbortSignal, relay: RelayClient | undefined): QrPairing | Promise<QrPairing>;
  connectBunker(
    bunker: RedactedSecret,
    signal: AbortSignal,
    relay: RelayClient | undefined,
  ): Promise<BuildSignerSession>;
}

/** Injectable Node boundaries required by live optimization after an over-target build. */
export interface NodeOptimizationOptions {
  terminal?: TerminalAdapter;
  qrRenderer?: (uri: string) => Promise<string>;
  isInteractive?: () => boolean;
  secretStore?: SecretStore;
  process?: ProcessAdapter;
  fileSystem?: FileSystemAdapter;
  os?: string;
  env?: Readonly<Record<string, string | undefined>>;
  relay?: RelayClient;
  discovery?: DiscoveryServices;
  resolve?: PublicAddressResolver['resolve'];
  fetch?: typeof fetch;
  clock?: Clock;
  signal?: AbortSignal;
  logger?: SafeLogger;
  pairing?: NodePairingAdapter;
}

/** Lazy Node services consumed by the later live optimizer orchestration. */
export interface NodeOptimizationServices {
  readonly discovery: DiscoveryServices;
  readonly networkPolicy: NetworkPolicy;
  readonly blossom: BlossomServices;
  getSigner(): Promise<NodeSignerResult>;
  fetch(input: NodeFetchInput, init?: RequestInit): Promise<NodeFetchResult>;
  dispose(): Promise<void>;
}

/**
 * Create Node adapters without touching the terminal, credential store,
 * process, filesystem, relay, DNS, fetch, clock, or environment.
 *
 * @param options - Optional injected runtime boundaries; production defaults are invoked lazily.
 * @returns Lazy services that return only redaction-safe statuses on unavailable paths.
 * @example
 * ```ts
 * const services = createNodeOptimizationServices({ secretStore, discovery, resolve });
 * const signer = await services.getSigner();
 * ```
 */
export function createNodeOptimizationServices(options: NodeOptimizationOptions = {}): NodeOptimizationServices {
  const signal = options.signal;
  const clock = options.clock ?? nodeClock();
  const networkPolicy = createNetworkPolicy({ resolve: options.resolve ?? nodeResolver() });
  const discovery = options.discovery ?? unavailableDiscovery();
  let activeSigner: BuildSigner | undefined;
  const getSigner = createGetSigner(options, signal, clock, (signer) => {
    activeSigner = signer;
  });

  const fetch = async (input: NodeFetchInput, init?: RequestInit): Promise<NodeFetchResult> => {
    if (isAborted(signal) || isAborted(init?.signal)) return fetchFailed('network-cancelled', 'Network request was cancelled');
    try {
      const response = await (options.fetch ?? globalThis.fetch)(input, init);
      return { status: 'complete', response };
    } catch {
      return isAborted(signal) || isAborted(init?.signal)
        ? fetchFailed('network-cancelled', 'Network request was cancelled')
        : fetchFailed('network-failed', 'Network request failed');
    }
  };

  return {
    discovery,
    networkPolicy,
    blossom: {
      networkPolicy,
      now: () => Math.floor(clock.now() / 1_000),
      signal,
      fetch: async (input, init) => {
        const result = await fetch(input, init);
        if (result.status === 'complete') return result.response;
        throw new Error(result.reason.message);
      },
    },
    getSigner,
    fetch,
    async dispose(): Promise<void> {
      try {
        await activeSigner?.close();
      } finally {
        activeSigner = undefined;
        await options.relay?.close();
      }
    },
  };
}

function createGetSigner(
  options: NodeOptimizationOptions,
  signal: AbortSignal | undefined,
  clock: Clock,
  setActive: (signer: BuildSigner) => void,
): () => Promise<NodeSignerResult> {
  return async () => {
    if (isAborted(signal)) return report(options.logger, failed('cancelled', 'Signer operation was cancelled'));
    let store: SecretStore;
    try {
      store = await getStore(options);
    } catch {
      return report(options.logger, failed('secret-store-unavailable', 'No protected signer store is available'));
    }
    const pairing = options.pairing;
    let stored: RedactedSecret | undefined;
    try {
      stored = await store.get(BUILD_SIGNER_SESSION_KEY);
    } catch {
      return report(options.logger, failed('secret-store-unavailable', 'Stored signer session is unavailable'));
    }
    if (!stored && !pairing && !(options.isInteractive ?? defaultInteractive)()) {
      return report(options.logger, failed('noninteractive', 'Interactive signer pairing is unavailable'));
    }
    if (stored && pairing) {
      const reused = await reconnectBuildSigner({
        secretStore: cachedStore(store, stored),
        parseStoredSession: pairing.parseStoredSession,
        reconnect: (secret, identity, operationSignal) => pairing.reconnect(secret, identity, combinedSignal(operationSignal, signal), options.relay),
      });
      if (reused) {
        setActive(reused.signer);
        return { status: 'ready', signer: reused.signer, remotePubkey: reused.remotePubkey };
      }
    }
    if (!(options.isInteractive ?? defaultInteractive)()) return report(options.logger, failed('noninteractive', 'Interactive signer pairing is unavailable'));
    if (!pairing) return report(options.logger, failed('pairing-unavailable', 'Interactive signer pairing is unavailable'));
    return await pairFreshSigner(options, signal, clock, store, pairing, setActive);
  };
}

async function pairFreshSigner(
  options: NodeOptimizationOptions,
  signal: AbortSignal | undefined,
  clock: Clock,
  store: SecretStore,
  pairing: NonNullable<NodeOptimizationOptions['pairing']>,
  setActive: (signer: BuildSigner) => void,
): Promise<NodeSignerResult> {
  const terminal = options.terminal ?? nodeTerminal(options.qrRenderer ?? renderTerminalQr);
  try {
    const paired = await pairBuildSigner({
      terminal: abortableTerminal(terminal, signal),
      clock,
      secretStore: store,
      createQrPairing: async (operationSignal) => {
        const qr = await pairing.createQrPairing(combinedSignal(operationSignal, signal), options.relay);
        return { ...qr, waitForSession: (waitSignal) => {
          const joined = combinedSignal(waitSignal, signal);
          return joined.aborted ? Promise.reject(new Error('signer pairing cancelled')) : qr.waitForSession(joined);
        } };
      },
      connectBunker: (bunker, operationSignal) => pairing.connectBunker(bunker, combinedSignal(operationSignal, signal), options.relay),
    });
    setActive(paired.signer);
    return { status: 'ready', signer: paired.signer, remotePubkey: paired.remotePubkey };
  } catch {
    return report(options.logger, failed('signer-unavailable', 'Remote signer pairing was unavailable'));
  }
}

function failed(code: string, message: string): Extract<NodeSignerResult, { status: 'unavailable' | 'failed' }> {
  return { status: code === 'signer-unavailable' || code.startsWith('network-') ? 'failed' : 'unavailable', reason: { code, message } };
}

function fetchFailed(code: string, message: string): Extract<NodeFetchResult, { status: 'failed' }> {
  return { status: 'failed', reason: { code, message } };
}

function report(logger: SafeLogger | undefined, result: Extract<NodeSignerResult, { status: 'unavailable' | 'failed' }>): NodeSignerResult {
  logger?.warn(result.reason);
  return result;
}

async function getStore(options: NodeOptimizationOptions): Promise<SecretStore> {
  if (options.secretStore) return options.secretStore;
  return await createPlatformSecretStore({
    os: options.os ?? process.platform,
    env: options.env ?? process.env,
    process: options.process ?? nodeProcess(),
    fileSystem: options.fileSystem ?? nodeFileSystem(),
  });
}

function cachedStore(store: SecretStore, secret: RedactedSecret): SecretStore {
  return {
    get: async () => secret,
    set: (key, value) => store.set(key, value),
    delete: (key) => store.delete(key),
  };
}

function nodeClock(): Clock {
  return {
    now: () => Date.now(),
    setTimeout: (callback, delayMs) => setTimeout(callback, delayMs),
    clearTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
  };
}

function defaultInteractive(): boolean {
  return process.stdin.isTTY === true && process.stdout.isTTY === true;
}

function nodeTerminal(renderQr: (uri: string) => Promise<string>): TerminalAdapter {
  return {
    async showQr(uri: string): Promise<void> {
      process.stdout.write(`${await renderQr(uri)}\n`);
      process.stdout.write('Scan the QR with a NIP-46 signer, or paste a bunker:// URL.\n');
    },
    readLine(prompt: string, signal: AbortSignal): Promise<string> {
      return new Promise((resolve, reject) => {
        void import('node:readline').then(({ createInterface }) => {
          if (signal.aborted) {
            reject(new Error('terminal input cancelled'));
            return;
          }
          const reader = createInterface({ input: process.stdin, output: process.stderr });
          const abort = () => {
            reader.close();
            reject(new Error('terminal input cancelled'));
          };
          signal.addEventListener('abort', abort, { once: true });
          reader.question(prompt, (value) => {
            signal.removeEventListener('abort', abort);
            reader.close();
            resolve(value);
          });
        }).catch(() => reject(new Error('terminal input is unavailable')));
      });
    },
    writeStatus(status: SafeStatus): void {
      process.stderr.write(`${status.message}\n`);
    },
  };
}

async function renderTerminalQr(uri: string): Promise<string> {
  const qrcode = await import('qrcode');
  return await qrcode.default.toString(uri, { type: 'terminal', small: true });
}

function nodeProcess(): ProcessAdapter {
  return {
    async run(command, args, input): Promise<{ code: number; stdout: string; stderr: string }> {
      const { spawn } = await import('node:child_process');
      const opaqueArgs = args.map((argument) => argument instanceof RedactedSecret ? argument.withValue((value) => value) : argument);
      return await new Promise((resolve) => {
        const child = spawn(command, opaqueArgs, { stdio: ['pipe', 'pipe', 'pipe'] });
        const output: Uint8Array[] = [];
        const errors: Uint8Array[] = [];
        child.stdout.on('data', (value: Uint8Array) => output.push(value));
        child.stderr.on('data', (value: Uint8Array) => errors.push(value));
        child.once('error', () => resolve({ code: 1, stdout: '', stderr: '' }));
        child.once('close', (code) => resolve({
          code: code ?? 1,
          stdout: Buffer.concat(output).toString('utf8'),
          stderr: Buffer.concat(errors).toString('utf8'),
        }));
        if (input) input.withValue((value) => child.stdin.end(value));
        else child.stdin.end();
      });
    },
  };
}

function nodeFileSystem(): FileSystemAdapter {
  return {
    async readText(path: string): Promise<string> {
      const fs = await import('node:fs/promises');
      return await fs.readFile(path, 'utf8');
    },
    async writeText(path: string, contents: string): Promise<void> {
      const fs = await import('node:fs/promises');
      await fs.writeFile(path, contents, 'utf8');
    },
    async exists(path: string): Promise<boolean> {
      const fs = await import('node:fs/promises');
      return await fs.access(path).then(() => true, () => false);
    },
  };
}

function nodeResolver(): PublicAddressResolver['resolve'] {
  return async (hostname, signal) => {
    if (signal.aborted) throw new Error('DNS resolution cancelled');
    const { Resolver } = await import('node:dns/promises');
    const resolver = new Resolver();
    const cancel = () => resolver.cancel();
    signal.addEventListener('abort', cancel, { once: true });
    try {
      const [v4, v6] = await Promise.allSettled([resolver.resolve4(hostname), resolver.resolve6(hostname)]);
      if (signal.aborted) throw new Error('DNS resolution cancelled');
      const answers = [
        ...(v4.status === 'fulfilled' ? v4.value : []),
        ...(v6.status === 'fulfilled' ? v6.value : []),
      ];
      if (answers.length === 0) throw new Error('DNS resolution failed');
      return answers;
    } finally {
      signal.removeEventListener('abort', cancel);
      resolver.cancel();
    }
  };
}

function unavailableDiscovery(): DiscoveryServices {
  return {
    async query(): Promise<readonly unknown[]> {
      throw new Error('Nostr relay discovery is unavailable');
    },
  };
}

function abortableTerminal(terminal: TerminalAdapter, outer: AbortSignal | undefined): TerminalAdapter {
  if (!outer) return terminal;
  return {
    showQr: (uri) => terminal.showQr(uri),
    readLine: (prompt, signal) => terminal.readLine(prompt, combinedSignal(signal, outer)),
    writeStatus: (status) => terminal.writeStatus(status),
  };
}

function combinedSignal(first: AbortSignal, second: AbortSignal | undefined): AbortSignal {
  if (!second) return first;
  const controller = new AbortController();
  const abort = () => controller.abort();
  first.addEventListener('abort', abort, { once: true });
  second.addEventListener('abort', abort, { once: true });
  if (first.aborted || second.aborted) controller.abort();
  return controller.signal;
}

function isAborted(signal: AbortSignal | null | undefined): boolean {
  return signal?.aborted === true;
}
