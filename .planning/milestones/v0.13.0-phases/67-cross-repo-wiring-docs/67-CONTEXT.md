# Phase 67: Cross-Repo Wiring & Docs - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

Update kehto to declare @napplet/core as a peer dependency (currently workspace-linked — npm switch deferred until PUB-04 completed). Update @napplet root README for 4-package SDK. Update package READMEs to reference @kehto for runtime/shell needs.

Two repos:
- /home/sandwich/Develop/napplet/ — update README and package READMEs
- /home/sandwich/Develop/kehto/ — update peer dep declaration (keep workspace link for now)

</domain>

<decisions>
## Implementation Decisions

### KEHTO-04 Partial
Since PUB-04 (npm publish) was deferred, kehto can't switch to npm-sourced @napplet/core yet. Instead:
- Declare @napplet/core as a peerDependency in @kehto/runtime and @kehto/shell package.json
- Keep the pnpm override linking to the local napplet repo for development
- When @napplet/core is published to npm, remove the override and it will resolve from npm

### Claude's Discretion
All other implementation choices are at Claude's discretion — documentation phase.

Key rules for README updates:
- Root README should describe the 4-package @napplet SDK: core, shim, sdk, vite-plugin
- Explain the split: @napplet is the napplet-side SDK, @kehto is the shell/runtime
- Package READMEs should direct users to @kehto for runtime/shell integration
- Keep existing README structure/style conventions

</decisions>

<code_context>
## Existing Code Insights

### Current @napplet README
- Describes 8-package monorepo (outdated)
- Has sections for shim, shell, vite-plugin (shell section needs removal/redirect)

### Package READMEs
- packages/core/README.md, packages/shim/README.md, packages/sdk/README.md, packages/vite-plugin/README.md
- These reference @napplet/shell, @napplet/runtime etc. in examples/docs

</code_context>

<specifics>
## Specific Ideas

No specific requirements — documentation phase.

</specifics>

<deferred>
## Deferred Ideas

- Full npm switch for KEHTO-04 — blocked on PUB-04 (npm publish)

</deferred>
