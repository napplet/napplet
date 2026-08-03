/** Deno workspace entry point for the skills CLI. */
import { install, listSkills, readSkill, type InstallOptions } from "./index.ts";

const HELP = `napplet-skills — install napplet build skills into your agent

Usage:
  napplet-skills list                       List shipped skills
  napplet-skills print [skill]              Print SKILL.md to stdout (all, or one)
  napplet-skills install [skill] [options]  Install skills into an agent location
`;

function parse(argv: string[]): { cmd?: string; positional: string[]; opts: InstallOptions } {
  const positional: string[] = [];
  const opts: InstallOptions = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "-h" || arg === "--help") continue;
    if (arg === "--symlink") opts.symlink = true;
    else if (arg === "--to") opts.to = argv[++index];
    else if (arg === "--dir") opts.dir = argv[++index];
    else if (arg === "--out") opts.out = argv[++index];
    else if (arg.startsWith("--")) throw new Error(`unknown option: ${arg}`);
    else positional.push(arg);
  }
  return { cmd: positional.shift(), positional, opts };
}

/** Run the maintained skills command contract in a Deno workspace build. */
export function runCli(argv: string[]): number {
  let parsed;
  try {
    parsed = parse(argv);
  } catch (error) {
    console.error(String((error as Error).message));
    return 2;
  }
  const { cmd, positional, opts } = parsed;
  if (!cmd || cmd === "help" || argv.includes("--help") || argv.includes("-h")) {
    console.log(HELP);
    return 0;
  }
  try {
    if (cmd === "list") {
      for (const skill of listSkills()) console.log(`${skill.name.padEnd(16)} ${skill.description}`);
      return 0;
    }
    if (cmd === "print") {
      const names = positional.length ? positional : listSkills().map((skill) => skill.name);
      console.log(names.map((name) => readSkill(name)).join("\n\n---\n\n"));
      return 0;
    }
    if (cmd === "install") {
      const skills = positional.length ? positional : undefined;
      const target = opts.dir ? `dir ${opts.dir}` : opts.out ? `file ${opts.out}` : (opts.to ?? "claude");
      const results = install({ ...opts, skills, to: opts.dir || opts.out ? undefined : (opts.to ?? "claude") });
      for (const result of results) console.log(`${result.action.padEnd(10)} ${result.skill.padEnd(16)} → ${result.dest}`);
      console.log(`\n${results.length} file(s) for ${results.map((result) => result.skill).filter((value, index, all) => all.indexOf(value) === index).length} skill(s) → ${target}`);
      return 0;
    }
    console.error(`unknown command: ${cmd}\n`);
    console.log(HELP);
    return 2;
  } catch (error) {
    console.error(`error: ${(error as Error).message}`);
    return 1;
  }
}
