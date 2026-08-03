#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env --allow-net

/**
 * Standalone release-binary entrypoint.
 *
 * This file is excluded from the JSR package. Release compilation resolves and
 * embeds the maintained workspace package CLIs so create and skills need no
 * Node.js process or package resolver at runtime.
 */

import { runCli as runBoilerplateCli } from "@napplet/boilerplate";
import { runCli as runSkillsCli } from "@napplet/skills/cli";
import { main } from "./cli.ts";

if (import.meta.main) {
  Deno.exit(
    await main(Deno.args, {
      runCreate: (args) => runBoilerplateCli([...args]),
      runSkills: (args) => runSkillsCli([...args]),
    }),
  );
}
