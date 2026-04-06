# Phase 62: Kehto Repo Scaffold - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

Initialize ~/Develop/kehto as a pnpm monorepo with turborepo, TypeScript, and ESM-only configuration. Create @kehto/acl, @kehto/runtime, @kehto/shell, @kehto/services package directories with valid package.json files. Seed PROJECT.md and .planning/ directory with enough GSD context for future /gsd:new-project bootstrapping.

Target directory: ~/Develop/kehto (fresh repo, github.com/kehto/runtime)
NPM org: @kehto

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Use ROADMAP phase goal, success criteria, and @napplet codebase conventions to guide decisions.

Key conventions to mirror from @napplet:
- pnpm workspaces with turborepo orchestration
- TypeScript strict mode, ESM-only, ES2022 target
- tsup for building each package
- 2-space indentation
- changesets for versioning

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- @napplet monorepo structure (package.json, turbo.json, tsconfig.json) as template
- @napplet/core, @napplet/acl, @napplet/runtime, @napplet/shell, @napplet/services package.json files as reference

### Established Patterns
- pnpm 10.8+ with workspaces
- turborepo 2.5+ for build orchestration
- tsup 8.5+ for ESM bundling with .d.ts generation
- TypeScript 5.9+ with strict mode and bundler resolution

### Integration Points
- @kehto packages will depend on @napplet/core as peer dependency
- GSD .planning/ structure follows standard conventions

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase. Mirror @napplet's monorepo conventions.

</specifics>

<deferred>
## Deferred Ideas

None — infrastructure phase.

</deferred>
