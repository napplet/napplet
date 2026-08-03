/** Deno workspace entry point for the built skills CLI. */
// @ts-nocheck -- the Node-oriented implementation is checked by the package's TypeScript build.
export async function runCli(argv: string[]): Promise<number> {
  const { runCli: runNodeCli } = await import("./cli.ts");
  return runNodeCli(argv);
}
