import { assert, assertEquals } from "./assert.ts";

const CLI_DIR = new URL("..", import.meta.url);

async function run(command: string, args: string[], options: Deno.CommandOptions = {}) {
  return await new Deno.Command(command, {
    args,
    stdout: "piped",
    stderr: "piped",
    ...options,
  }).output();
}

function text(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

Deno.test("compiled napplet creates and installs skills without a package resolver", async () => {
  const root = await Deno.makeTempDir({ prefix: "napplet-resolver-free-" });
  try {
    const binary = `${root}/napplet`;
    const template = `${root}/template`;
    const created = `${root}/created`;
    const installed = `${root}/installed`;
    const emptyPath = `${root}/empty-path`;
    await Deno.mkdir(template);
    await Deno.mkdir(emptyPath);
    await Deno.writeTextFile(`${template}/package.json`, '{"name":"template","private":true}\n');

    const compiled = await run(Deno.execPath(), [
      "compile",
      "--allow-read",
      "--allow-write",
      "--allow-run",
      "--allow-env",
      "--allow-net",
      "--output",
      binary,
      "src/cli.ts",
    ], { cwd: new URL(".", CLI_DIR) });
    assertEquals(compiled.code, 0, text(compiled.stderr));

    const environment = {
      PATH: emptyPath,
      HTTP_PROXY: "http://127.0.0.1:9",
      HTTPS_PROXY: "http://127.0.0.1:9",
      NO_PROXY: "",
    };
    const create = await run(binary, ["create", created, "--template", template], { env: environment, cwd: root });
    assertEquals(create.code, 0, text(create.stderr));
    assertEquals(await Deno.readTextFile(`${created}/package.json`), '{"name":"created","private":true}\n');

    const listed = await run(binary, ["skills", "list"], { env: environment, cwd: root });
    assertEquals(listed.code, 0, text(listed.stderr));
    assert(text(listed.stdout).includes("make-napplet"));

    const install = await run(binary, ["skills", "install", "make-napplet", "--dir", installed], { env: environment, cwd: root });
    assertEquals(install.code, 0, text(install.stderr));
    assert((await Deno.readTextFile(`${installed}/make-napplet/SKILL.md`)).includes("Making A Napplet"));

    const invalidSkills = await run(binary, ["skills", "--unknown"], { env: environment, cwd: root });
    assertEquals(invalidSkills.code, 2);
    assert(text(invalidSkills.stderr).includes("unknown option: --unknown"));

    const invalidCreate = await run(binary, ["create", "--variant", "unsupported", "--yes"], { env: environment, cwd: root });
    assertEquals(invalidCreate.code, 1);
    assert(text(invalidCreate.stderr).includes("@napplet/boilerplate: Unsupported variant"));
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
