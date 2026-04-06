# Phase 65: Napplet Cleanup - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

Remove extracted packages (acl, runtime, shell, services) and demo/ from the @napplet monorepo. Update pnpm workspace, turborepo config, root tsconfig to reference only 4 packages (core, shim, sdk, vite-plugin). Verify pnpm build and pnpm type-check succeed with the slimmed monorepo.

Working directory: /home/sandwich/Develop/napplet/

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure cleanup phase.

Key rules:
- Delete: packages/acl/, packages/runtime/, packages/shell/, packages/services/, demo/
- Update pnpm-workspace.yaml to only include packages/*
- Update turbo.json if it references specific package names
- Update root tsconfig.json references
- Remove any root package.json scripts that reference deleted packages
- Verify no remaining imports reference @napplet/acl, @napplet/runtime, @napplet/shell, @napplet/services in the kept packages
- Keep: packages/core/, packages/shim/, packages/sdk/, packages/vite-plugin/
- Keep: specs/, RUNTIME-SPEC.md, skills/, tests/ (if any remain relevant)

</decisions>

<code_context>
## Existing Code Insights

### Packages to remove
- packages/acl/ — moved to @kehto/acl
- packages/runtime/ — moved to @kehto/runtime
- packages/shell/ — moved to @kehto/shell
- packages/services/ — moved to @kehto/services
- demo/ — moved to kehto/apps/demo/

### Packages to keep
- packages/core/ — @napplet/core (zero deps, shared types)
- packages/shim/ — @napplet/shim (napplet-side window installer)
- packages/sdk/ — @napplet/sdk (bundler-friendly wrapper)
- packages/vite-plugin/ — @napplet/vite-plugin (manifest generation)

### Import dependencies in kept packages
- packages/shim/src/ imports from @napplet/core only
- packages/sdk/src/ imports from @napplet/core only
- packages/vite-plugin/src/ imports nostr-tools (direct dep), no @napplet imports
- packages/core/src/ has no internal @napplet imports

</code_context>

<specifics>
## Specific Ideas

No specific requirements — cleanup phase.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
