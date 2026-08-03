/** Deno workspace entry point for the built boilerplate CLI. */
// @ts-nocheck -- the Node-oriented implementation is checked by the package's TypeScript build.
export async function runCli(argv: string[]): Promise<number> {
  const { runCli: runNodeCli } = await import("./index.ts");
  return await runNodeCli(argv);
}
