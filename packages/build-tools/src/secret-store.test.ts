/// <reference lib="deno.ns" />

import {
  createPlatformSecretStore,
  RedactedSecret,
  type FileSystemAdapter,
  type ProcessAdapter,
  type ProcessResult,
} from "./index.ts";

const SESSION_KEY = "napplet-build-signer";
const NBUNKSEC = "nbunksec1test-session-material";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

class FakeProcess implements ProcessAdapter {
  readonly calls: Array<{ command: string; args: readonly (string | RedactedSecret)[]; input?: RedactedSecret }> = [];
  readonly responses = new Map<string, ProcessResult>();

  async run(command: string, args: readonly (string | RedactedSecret)[], input?: RedactedSecret): Promise<ProcessResult> {
    this.calls.push({ command, args, input });
    return this.responses.get(`${command} ${args.map(String).join(" ")}`) ?? { code: 0, stdout: "", stderr: "" };
  }
}

class FakeFileSystem implements FileSystemAdapter {
  readonly files = new Map<string, string>();

  async readText(path: string): Promise<string> {
    const value = this.files.get(path);
    if (value === undefined) throw new Error("missing file");
    return value;
  }

  async writeText(path: string, contents: string): Promise<void> {
    this.files.set(path, contents);
  }

  async exists(path: string): Promise<boolean> {
    return this.files.has(path);
  }
}

Deno.test("reconnect lookup leaves a missing stable record untouched", async () => {
  const process = new FakeProcess();
  process.responses.set("which security", { code: 0, stdout: "/usr/bin/security", stderr: "" });
  process.responses.set(
    `security find-generic-password -a ${SESSION_KEY} -s napplet -w`,
    { code: 44, stdout: "", stderr: "not found" },
  );
  const store = await createPlatformSecretStore({ os: "darwin", process });

  assert(await store.get(SESSION_KEY) === undefined, "missing session should be undefined");
  assert(
    !process.calls.some(({ command, args }) => command === "security" && args[0] === "add-generic-password"),
    "lookup must not write a missing session",
  );
});

Deno.test("platform stores keep CLI provider commands behind injected adapters", async () => {
  const cases = [
    { os: "darwin" as const, availabilityCommand: "which", availabilityArg: "security", command: "security" },
    { os: "linux" as const, availabilityCommand: "which", availabilityArg: "secret-tool", command: "secret-tool" },
    { os: "windows" as const, availabilityCommand: "where", availabilityArg: "cmdkey", command: "cmdkey" },
  ];

  for (const testCase of cases) {
    const process = new FakeProcess();
    process.responses.set(`${testCase.availabilityCommand} ${testCase.availabilityArg}`, {
      code: 0,
      stdout: "available",
      stderr: "",
    });
    const store = await createPlatformSecretStore({
      os: testCase.os,
      env: testCase.os === "linux" ? { DBUS_SESSION_BUS_ADDRESS: "session" } : {},
      process,
    });
    await store.set(SESSION_KEY, new RedactedSecret(NBUNKSEC));
    assert(process.calls.some((call) => call.command === testCase.command), `${testCase.os} provider should run`);
  }

  const fileSystem = new FakeFileSystem();
  const fallback = await createPlatformSecretStore({
    os: "unknown",
    process: new FakeProcess(),
    fileSystem,
    fallbackFile: "/tmp/napplet-secrets.json",
  });
  await fallback.set(SESSION_KEY, new RedactedSecret(NBUNKSEC));
  assert(await fileSystem.exists("/tmp/napplet-secrets.json"), "explicit fallback should persist its record");
});

Deno.test("provider failures preserve prior secrets and every observable stays redacted", async () => {
  const process = new FakeProcess();
  process.responses.set("which security", { code: 0, stdout: "available", stderr: "" });
  process.responses.set("security add-generic-password -a napplet-build-signer -s napplet -w [REDACTED] -U", {
    code: 1,
    stdout: "",
    stderr: NBUNKSEC,
  });
  const store = await createPlatformSecretStore({ os: "darwin", process });
  const prior = new RedactedSecret(NBUNKSEC);
  const snapshots: string[] = [];
  try {
    await store.set(SESSION_KEY, prior);
  } catch (error) {
    snapshots.push(String(error), JSON.stringify(error), Deno.inspect(error));
  }
  snapshots.push(JSON.stringify(process.calls));
  for (const snapshot of snapshots) {
    assert(!snapshot.includes(NBUNKSEC), "secret must not reach errors or snapshots");
  }
  assert(
    !process.calls.some(({ command, args }) => command === "security" && args[0] === "delete-generic-password"),
    "failed writes must not delete a previous secret",
  );
});
