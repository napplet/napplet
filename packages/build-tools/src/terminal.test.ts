/// <reference lib="deno.ns" />

import {
  pairBuildSigner,
  reconnectBuildSigner,
  RedactedSecret,
  type BuildSigner,
  type BuildSignerSession,
  type Clock,
  type SafeStatus,
  type SecretStore,
  type TerminalAdapter,
} from "./index.ts";

const REMOTE_PUBKEY = "a".repeat(64);
const USER_PUBKEY = "b".repeat(64);
const NBUNKSEC = "nbunksec1do-not-print";
const BUNKER_URI = `bunker://${REMOTE_PUBKEY}?secret=do-not-print`;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });
  return { promise, resolve, reject };
}

class FakeClock implements Clock {
  readonly timers = new Map<number, () => void>();
  #id = 0;

  now(): number {
    return 1;
  }

  setTimeout(callback: () => void): number {
    const id = this.#id++;
    this.timers.set(id, callback);
    return id;
  }

  clearTimeout(handle: unknown): void {
    this.timers.delete(handle as number);
  }
}

class FakeTerminal implements TerminalAdapter {
  readonly statuses: SafeStatus[] = [];
  readonly qr: string[] = [];
  readonly prompts: AbortSignal[] = [];
  readonly input = deferred<string>();

  async showQr(value: string): Promise<void> {
    this.qr.push(value);
  }

  readLine(_prompt: string, signal: AbortSignal): Promise<string> {
    this.prompts.push(signal);
    return this.input.promise;
  }

  writeStatus(message: SafeStatus): void {
    this.statuses.push(message);
  }
}

class FakeStore implements SecretStore {
  value: RedactedSecret | undefined;
  writes = 0;

  get(_key: string): Promise<RedactedSecret | undefined> {
    return Promise.resolve(this.value);
  }

  set(_key: string, value: RedactedSecret): Promise<void> {
    this.writes += 1;
    this.value = value;
    return Promise.resolve();
  }

  delete(_key: string): Promise<void> {
    this.value = undefined;
    return Promise.resolve();
  }
}

function session(secret = NBUNKSEC): BuildSignerSession {
  const signer: BuildSigner = {
    getPublicKey: () => Promise.resolve(USER_PUBKEY),
    signEvent: () => Promise.reject(new Error("not used")),
    close: () => Promise.resolve(),
  };
  return { signer, clientSecret: new RedactedSecret(secret), remotePubkey: REMOTE_PUBKEY, relays: ["wss://relay.test"] };
}

Deno.test("QR and pasted bunker pairing race to one verified stored session", async () => {
  const clock = new FakeClock();
  const terminal = new FakeTerminal();
  const store = new FakeStore();
  const qr = deferred<BuildSignerSession>();
  let qrClosed = 0;
  let pastedAborted = false;
  const result = pairBuildSigner({
    clock,
    terminal,
    secretStore: store,
    createQrPairing: () => ({
      uri: "nostrconnect://public?secret=do-not-print",
      waitForSession: () => qr.promise,
      close: () => { qrClosed += 1; },
    }),
    connectBunker: (_bunker, signal) => {
      signal.addEventListener("abort", () => { pastedAborted = true; }, { once: true });
      return Promise.resolve(session());
    },
  });
  terminal.input.resolve(BUNKER_URI);
  const winner = await result;

  assert(winner.remotePubkey === REMOTE_PUBKEY, "pasted path should pair");
  assert(store.writes === 1, "only the verified winner should persist");
  assert(qrClosed === 1, "losing QR work should close");
  assert(terminal.prompts[0].aborted || pastedAborted, "losing work should be aborted");
  void qr;
});

Deno.test("failed pairing paths preserve a stored session and redact every safe surface", async () => {
  const clock = new FakeClock();
  const terminal = new FakeTerminal();
  const store = new FakeStore();
  store.value = new RedactedSecret(NBUNKSEC);
  const pending = pairBuildSigner({
    clock,
    terminal,
    secretStore: store,
    createQrPairing: () => ({
      uri: "nostrconnect://public?secret=do-not-print",
      waitForSession: () => Promise.reject(new Error(BUNKER_URI)),
      close: () => {},
    }),
    connectBunker: () => Promise.reject(new Error(NBUNKSEC)),
  });
  terminal.input.resolve(BUNKER_URI);
  await pending.catch(() => {});

  const snapshots = [JSON.stringify(terminal.statuses), Deno.inspect(terminal.statuses), String(store.value)];
  for (const snapshot of snapshots) {
    assert(!snapshot.includes(NBUNKSEC), "nbunksec must stay out of terminal snapshots");
    assert(!snapshot.includes(BUNKER_URI), "bunker URI must stay out of terminal snapshots");
  }
  assert(store.writes === 0, "failed pairing must not replace prior material");
});

Deno.test("reconnect reads the stable key before pairing and validates the returned identity", async () => {
  const store = new FakeStore();
  store.value = new RedactedSecret(NBUNKSEC);
  let parsed = 0;
  const restored = await reconnectBuildSigner({
    secretStore: store,
    parseStoredSession: (secret) => {
      parsed += 1;
      assert(secret.withValue((value) => value === NBUNKSEC), "stored value should be provided only in parser callback");
      return { remotePubkey: REMOTE_PUBKEY, relays: ["wss://relay.test"] };
    },
    reconnect: () => Promise.resolve(session()),
  });
  assert(restored?.remotePubkey === REMOTE_PUBKEY, "validated session should reconnect");
  assert(parsed === 1, "stored session should parse before reconnecting");
});
