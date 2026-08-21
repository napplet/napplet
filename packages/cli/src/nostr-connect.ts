// nostr-connect.ts
//
// NIP-46 remote-signer onboarding for the napplet CLI signer.
//
// This module implements the standard Nostr Remote Signing handshake (NIP-46:
// nostrconnect:// QR + bunker:// paste) so a developer can pair a remote signer
// (e.g. a phone app) for CLI signing without pasting a raw nsec. The paired
// session is encoded as an `nbunksec` that the existing sign-time path
// (createNbunksecSigner in signing.ts) consumes.
//
// This is Nostr signer transport ONLY. It is entirely separate from the
// napplet <-> shell protocol (NIP-5D / NAPs). It MUST NOT touch, invent, or
// depend on any NIP-5D / NAP wire surface, `napplet-*` manifest tags, the
// iframe srcdoc/sandbox model, or the napplet artifact shape.

import { qrcode } from "@libs/qrcode";
import { TextLineStream } from "@std/streams";
import {
  type BuildSignerSession,
  type Clock,
  createBuildSigner,
  type Nip46Request,
  pairBuildSigner,
  type QrPairing,
  RedactedSecret,
  type RelayClient,
  type RelayRequest,
  type SafeStatus,
  type TerminalAdapter,
} from "@napplet/build-tools";
import { NostrConnectSigner, PrivateKeySigner } from "applesauce-signers";
import type { AbstractSimplePool } from "nostr-tools/abstract-pool";
import { generateSecretKey } from "nostr-tools/pure";
import { bytesToHex } from "nostr-tools/utils";
import { createApplesaucePool } from "./applesauce-pool.ts";
import { closeNostrConnectPool, ensureNostrConnectPool } from "./nostr-connect-pool.ts";
import { encodeNbunksec, type NbunksecInfo } from "./signing.ts";
import type { NostrEventTemplate } from "./types.ts";

/** Default relays used to reach a remote signer when none are supplied. */
export const DEFAULT_CONNECT_RELAYS = [
  "wss://bucket.coracle.social",
] as const;

/**
 * Event kinds the CLI asks a remote signer to authorize. Covers the NIP-5A
 * manifest events plus the Blossom upload-authorization kind used by deploy.
 */
export const DEFAULT_CONNECT_KINDS = [5129, 15129, 35129, 24242] as const;

/** Overall wait before the connect flow gives up (2 minutes). */
export const DEFAULT_CONNECT_TIMEOUT_MS = 120_000;

export interface ConnectOptions {
  /** Relays the client listens on for the remote signer's response. */
  relays: string[];
  /** Human-facing app name shown in the remote signer. */
  appName?: string;
  /** Event kinds to request `sign_event` permission for. */
  kinds?: number[];
  /** Overall timeout in milliseconds (default 120_000). */
  timeoutMs?: number;
  /** Injected nostr-tools pool for tests; real flows use the applesauce RelayPool. */
  pool?: AbstractSimplePool;
  /** Injected stdin for tests; Deno.stdin.readable is used when absent. */
  stdin?: ReadableStream<Uint8Array>;
  /** Sink for printed lines (QR + prompts); defaults to console.log. */
  print?: (line: string) => void;
  /** When true, ANSI-clear the QR after the flow settles. */
  clearOnDone?: boolean;
  /** Low-level writer used for ANSI clearing; defaults to Deno.stdout. */
  writeStdout?: (bytes: Uint8Array) => void;
}

export interface ConnectResult {
  /** Encoded nbunksec ready to store in the keychain. */
  nbunksec: string;
  /** Remote signer public key (hex). */
  pubkey: string;
  /** Relays the session was established on. */
  relays: string[];
}

/**
 * Build the NIP-46 permission list requested from a remote signer.
 *
 * @param kinds - Event kinds to request `sign_event` permission for.
 * @returns A leading `get_public_key` followed by one `sign_event:<kind>` per kind.
 * @example
 * ```ts
 * buildPerms([1, 24242]); // ["get_public_key", "sign_event:1", "sign_event:24242"]
 * ```
 */
export function buildPerms(kinds: number[]): string[] {
  return ["get_public_key", ...kinds.map((kind) => `sign_event:${kind}`)];
}

/**
 * Detect whether a stdin line is a pasted `bunker://` connection string.
 *
 * @param line - A single line read from stdin.
 * @returns The trimmed `bunker://` string, or null when the line is not one.
 * @example
 * ```ts
 * detectBunkerLine("  bunker://abc "); // "bunker://abc"
 * detectBunkerLine("noise");           // null
 * ```
 */
export function detectBunkerLine(line: string): string | null {
  const trimmed = line.trim();
  return trimmed.startsWith("bunker://") ? trimmed : null;
}

/**
 * Render a QR module matrix to terminal lines using half-block characters,
 * two QR rows per printed line, wrapped in a quiet-zone border.
 *
 * @param matrix - Boolean matrix where true = dark module.
 * @param border - Quiet-zone size in modules (default 2).
 * @returns One string per printed terminal row.
 * @example
 * ```ts
 * renderQrMatrix([[true, false], [false, true]]).length; // > 0
 * ```
 */
export function renderQrMatrix(matrix: boolean[][], border = 2): string[] {
  if (!matrix || matrix.length === 0) return [];
  const UPPER_HALF = "▀";
  const LOWER_HALF = "▄";
  const FULL_BLOCK = "█";
  const SPACE = " ";
  const width = matrix[0].length;
  const totalWidth = width + 2 * border;
  const lines: string[] = [];

  for (let i = 0; i < Math.ceil(border / 2); i += 1) lines.push(SPACE.repeat(totalWidth));

  for (let row = 0; row < matrix.length; row += 2) {
    const top = matrix[row];
    const bottom = row + 1 < matrix.length ? matrix[row + 1] : null;
    let line = SPACE.repeat(border);
    for (let col = 0; col < width; col += 1) {
      const topDark = top[col];
      const bottomDark = bottom ? bottom[col] : false;
      if (topDark && bottomDark) line += FULL_BLOCK;
      else if (topDark && !bottomDark) line += UPPER_HALF;
      else if (!topDark && bottomDark) line += LOWER_HALF;
      else line += SPACE;
    }
    line += SPACE.repeat(border);
    lines.push(line);
  }

  for (let i = 0; i < Math.ceil(border / 2); i += 1) lines.push(SPACE.repeat(totalWidth));
  return lines;
}

/**
 * Render a nostrconnect:// URI as a scannable QR code for the terminal.
 *
 * @param uri - The nostrconnect:// URI to encode.
 * @param border - Quiet-zone size in modules (default 2).
 * @returns One string per printed terminal row.
 * @example
 * ```ts
 * renderQrLines("nostrconnect://pubkey?relay=wss://r").length; // > 0
 * ```
 */
export function renderQrLines(uri: string, border = 2): string[] {
  const matrix = qrcode(uri, { output: "array" }) as boolean[][];
  return renderQrMatrix(matrix, border);
}

function clearLines(count: number, write: (bytes: Uint8Array) => void): void {
  if (count <= 0) return;
  const encoder = new TextEncoder();
  write(encoder.encode(`\x1b[${count}A`));
  for (let i = 0; i < count; i += 1) write(encoder.encode("\x1b[2K\x1b[B"));
  write(encoder.encode(`\x1b[${count}A`));
}

/** Print the QR + prompt block; returns the number of terminal lines written. */
function printConnectPrompt(
  uri: string,
  qrLines: string[],
  timeoutMs: number,
  print: (line: string) => void,
): number {
  print("Scan this QR with a NIP-46 signer, or paste a bunker:// URL and press Enter:");
  for (const line of qrLines) print(line);
  print("");
  print(uri);
  print(`Waiting for a remote signer (timeout ${Math.round(timeoutMs / 1000)}s)...`);
  return qrLines.length + 4;
}

/**
 * Run the NIP-46 remote-signer login flow. Prints a nostrconnect QR and races
 * a scan against a pasted bunker:// URL on stdin. Whichever completes first
 * wins, the loser is cancelled, and the QR is cleared. On success the paired
 * session is encoded as an nbunksec.
 *
 * @param options - Relays, app name, timeout, and optional injected pool/stdin.
 * @returns The encoded nbunksec, remote pubkey, and session relays.
 * @example
 * ```ts
 * const { nbunksec, pubkey } = await connectRemoteSigner({
 *   relays: DEFAULT_CONNECT_RELAYS.slice(),
 *   appName: "napplet CLI",
 * });
 * ```
 */
export async function connectRemoteSigner(options: ConnectOptions): Promise<ConnectResult> {
  const relays = options.relays.length > 0 ? options.relays : DEFAULT_CONNECT_RELAYS.slice();
  const kinds = options.kinds ?? DEFAULT_CONNECT_KINDS.slice();
  const timeoutMs = options.timeoutMs ?? DEFAULT_CONNECT_TIMEOUT_MS;
  const print = options.print ?? ((line: string) => console.log(line));
  const writeStdout = options.writeStdout ??
    ((bytes: Uint8Array) => Deno.stdout.writeSync(bytes));
  const injectedPool = options.pool;
  if (!injectedPool) ensureNostrConnectPool();

  const clientSk = generateSecretKey();
  const permissions = buildPerms(kinds);
  const terminal = createDenoTerminalAdapter({
    input: options.stdin ?? Deno.stdin.readable,
    print,
    timeoutMs,
  });
  let closeQrPairing = (): void => {};
  let session: BuildSignerSession | undefined;
  try {
    session = await pairBuildSigner({
      terminal,
      clock: denoClock,
      timeoutMs,
      createQrPairing: (signal) => {
        const pairing = createDenoQrPairing({
          appName: options.appName ?? "napplet CLI",
          clientSk,
          injectedPool,
          permissions,
          relays,
          signal,
        });
        closeQrPairing = () => {
          void pairing.close();
        };
        return pairing;
      },
      connectBunker: (bunker, signal) =>
        connectDenoBunker({
          bunker,
          closeQrPairing,
          clientSk,
          injectedPool,
          permissions,
          relays,
          signal,
        }),
    });
    const nbunksec = session.clientSecret.withValue((value) => value);
    return {
      nbunksec,
      pubkey: await session.signer.getPublicKey(),
      relays: [...session.relays],
    };
  } finally {
    await session?.signer.close();
    await terminal.close();
    if (options.clearOnDone) clearLines(terminal.linesPrinted, writeStdout);
    if (injectedPool) injectedPool.close(relays);
    else closeNostrConnectPool();
  }
}

const denoClock: Clock = {
  now: () => Date.now(),
  setTimeout: (callback, delayMs) => setTimeout(callback, delayMs),
  clearTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

function createDenoTerminalAdapter(options: {
  input: ReadableStream<Uint8Array>;
  print: (line: string) => void;
  timeoutMs: number;
}): TerminalAdapter & { close(): Promise<void>; linesPrinted: number } {
  let reader: ReadableStreamDefaultReader<string> | undefined;
  let linesPrinted = 0;
  return {
    get linesPrinted(): number {
      return linesPrinted;
    },
    async showQr(uri: string): Promise<void> {
      const qrLines = renderQrLines(uri);
      linesPrinted = printConnectPrompt(uri, qrLines, options.timeoutMs, options.print);
    },
    async readLine(_prompt: string, signal: AbortSignal): Promise<string> {
      const lines = options.input
        .pipeThrough(new TextDecoderStream() as unknown as TransformStream<Uint8Array, string>)
        .pipeThrough(new TextLineStream());
      reader = lines.getReader();
      signal.addEventListener("abort", () => {
        void reader?.cancel();
      }, { once: true });
      for (;;) {
        const { value, done } = await reader.read();
        if (done) return await new Promise<never>(() => {});
        const bunker = value === undefined ? null : detectBunkerLine(value);
        if (bunker) return bunker;
      }
    },
    writeStatus(_status: SafeStatus): void {
      // The existing CLI prompt owns these stable status lines.
    },
    async close(): Promise<void> {
      try {
        await reader?.cancel();
      } catch { /* best-effort */ }
    },
  };
}

function createDenoQrPairing(options: {
  appName: string;
  clientSk: Uint8Array;
  injectedPool?: AbstractSimplePool;
  permissions: string[];
  relays: string[];
  signal: AbortSignal;
}): QrPairing {
  const signer = new NostrConnectSigner({
    relays: options.relays,
    signer: new PrivateKeySigner(options.clientSk),
    ...(options.injectedPool ? { pool: createApplesaucePool(options.injectedPool) } : {}),
  });
  return {
    uri: signer.getNostrConnectURI({ name: options.appName, permissions: options.permissions }),
    waitForSession: async (signal) => {
      await signer.waitForSigner(signal);
      if (!signer.remote) throw new Error("Remote signer did not identify itself");
      return createDenoBuildSignerSession(
        signer,
        signer.remote,
        signer.relays,
        options.clientSk,
        signer.secret,
      );
    },
    close: () => signer.close(),
  };
}

async function connectDenoBunker(options: {
  bunker: RedactedSecret;
  closeQrPairing(): void;
  clientSk: Uint8Array;
  injectedPool?: AbstractSimplePool;
  permissions: string[];
  relays: string[];
  signal: AbortSignal;
}): Promise<BuildSignerSession> {
  return await options.bunker.withValue(async (bunker) => {
    const pointer = NostrConnectSigner.parseBunkerURI(bunker);
    // A valid pasted bunker URI chooses the legacy paste path before it emits
    // its own `connect` acknowledgement on the shared client public key.
    options.closeQrPairing();
    const signer = await NostrConnectSigner.fromBunkerURI(bunker, {
      signer: new PrivateKeySigner(options.clientSk),
      permissions: options.permissions,
      ...(options.injectedPool ? { pool: createApplesaucePool(options.injectedPool) } : {}),
    });
    if (options.signal.aborted) {
      await signer.close();
      throw new Error("Remote signer pairing cancelled");
    }
    return createDenoBuildSignerSession(
      signer,
      pointer.remote,
      pointer.relays.length > 0 ? pointer.relays : options.relays,
      options.clientSk,
      pointer.secret,
    );
  });
}

function createDenoBuildSignerSession(
  signer: NostrConnectSigner,
  remotePubkey: string,
  relays: string[],
  clientSk: Uint8Array,
  secret?: string,
): BuildSignerSession {
  const clientSecret = new RedactedSecret(encodeNbunksec(
    {
      pubkey: remotePubkey,
      localKey: bytesToHex(clientSk),
      relays,
      secret,
    } satisfies NbunksecInfo,
  ));
  return {
    clientSecret,
    remotePubkey,
    relays,
    signer: createBuildSigner({
      clock: denoClock,
      relay: createDenoRelayClient(signer),
      remotePubkey,
      requestId: () => crypto.randomUUID(),
    }),
  };
}

function createDenoRelayClient(signer: NostrConnectSigner): RelayClient {
  let closed = false;
  const close = async (): Promise<void> => {
    if (closed) return;
    closed = true;
    await signer.close();
  };
  return {
    openRequest(request, signal): RelayRequest {
      const response = runDenoRequest(signer, request).then(
        (result) => ({ id: request.id, result }),
        () => Promise.reject(new Error("Remote signer request failed")),
      );
      signal.addEventListener("abort", () => {
        void close();
      }, { once: true });
      return { response, close };
    },
    close,
  };
}

async function runDenoRequest(
  signer: NostrConnectSigner,
  request: Nip46Request,
): Promise<string> {
  if (request.method === "get_public_key") return await signer.getPublicKey();
  if (request.method !== "sign_event") throw new Error("Unsupported signer request");
  const template: unknown = JSON.parse(request.params[0] ?? "");
  if (!isNostrEventTemplate(template)) throw new Error("Invalid signer request");
  return JSON.stringify(await signer.signEvent(template));
}

function isNostrEventTemplate(value: unknown): value is NostrEventTemplate {
  if (!value || typeof value !== "object") return false;
  const template = value as Partial<NostrEventTemplate>;
  return typeof template.kind === "number" && typeof template.created_at === "number" &&
    typeof template.content === "string" && Array.isArray(template.tags) &&
    template.tags.every((tag) =>
      Array.isArray(tag) && tag.every((part) => typeof part === "string")
    );
}
