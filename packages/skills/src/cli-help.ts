/** Display metadata for one supported skills installation target. */
export interface CliHelpTarget {
  id: string;
  label: string;
}

/**
 * Render the shared command help used by Node and standalone Deno entrypoints.
 *
 * @param targets Supported installation targets in display order.
 * @returns Complete skills CLI help text.
 */
export function renderCliHelp(targets: readonly CliHelpTarget[]): string {
  return `napplet-skills — install napplet build skills into your agent

Usage:
  napplet-skills list                       List shipped skills
  napplet-skills print [skill]              Print SKILL.md to stdout (all, or one)
  napplet-skills install [skill] [options]  Install skills into an agent location

Install options:
  --to <target>     Target agent/convention (default: claude)
  --dir <path>      Custom dir; writes <path>/<skill>/SKILL.md
  --out <file>      Custom doc; appends skills into <file>
  --symlink         Symlink instead of copy (skillDir targets only)
  -h, --help        Show this help

Targets (--to):
${
    targets.map((target) => `  ${target.id.padEnd(13)} ${target.label}`).join(
      "\n",
    )
  }

Examples:
  napplet-skills install --to claude        # .claude/skills/<skill>/SKILL.md
  napplet-skills install --to codex         # .codex/skills/<skill>/SKILL.md
  napplet-skills install --to cursor        # .cursor/rules/<skill>.mdc
  napplet-skills install --to agents        # append to ./AGENTS.md
  napplet-skills install build-napplet --to gemini
  napplet-skills print build-napplet > skill.md
`;
}
