# Phase 63: Package Migration - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

Copy source files from @napplet/{acl,runtime,shell,services} into @kehto/{acl,runtime,shell,services} and rewrite all internal imports from @napplet/* to @kehto/*. @napplet/core remains as a dependency (workspace-linked during development, switched to npm in Phase 67). pnpm build and pnpm type-check must succeed with zero errors across all four kehto packages.

Source: /home/sandwich/Develop/napplet/packages/{acl,runtime,shell,services}/src/
Target: /home/sandwich/Develop/kehto/packages/{acl,runtime,shell,services}/src/

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase.

Key rules:
- Copy src/ directories from each @napplet package to corresponding @kehto package
- Rewrite imports: @napplet/acl → @kehto/acl, @napplet/runtime → @kehto/runtime, @napplet/shell → @kehto/shell, @napplet/services → @kehto/services
- @napplet/core imports stay as @napplet/core (it's a peer dep from npm)
- Update package.json dependencies to reference workspace packages correctly
- Ensure tsup builds succeed for all 4 packages
- Ensure tsc type-checking passes

</decisions>

<code_context>
## Existing Code Insights

### Source Packages (in /home/sandwich/Develop/napplet/)
- packages/acl/src/ — Zero-dep ACL module (check(), capabilities, state mutations)
- packages/runtime/src/ — Protocol engine (depends on core + acl)
- packages/shell/src/ — Browser adapter over runtime (depends on core + runtime)
- packages/services/src/ — Audio + notification ServiceHandlers (depends on runtime)

### Established Patterns
- All packages use barrel export from src/index.ts
- TypeScript strict mode, ESM-only
- tsup for building (ESM format, source maps, declarations)
- Internal imports use @napplet/<package> not relative paths between packages

### Integration Points
- @kehto/acl has zero external deps
- @kehto/runtime depends on @napplet/core + @kehto/acl
- @kehto/shell depends on @napplet/core + @kehto/runtime
- @kehto/services depends on @kehto/runtime

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure migration phase.

</specifics>

<deferred>
## Deferred Ideas

None — migration phase.

</deferred>
