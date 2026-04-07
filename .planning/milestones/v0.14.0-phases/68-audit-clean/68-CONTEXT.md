# Phase 68: Audit & Clean - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

Audit @napplet repo for dead code, stale references to extracted packages (@napplet/shell, @napplet/runtime, @napplet/acl, @napplet/services), and leftover artifacts. Remove everything found. Verify build passes after cleanup.

Working directory: /home/sandwich/Develop/napplet/
Packages to audit: core, shim, sdk, vite-plugin

Known stale items from v0.13.0 integration check:
- Dead test:e2e task in turbo.json
- skills/ files reference @napplet/shell and @napplet/services
- RUNTIME-SPEC.md references extracted packages
- specs/nubs/ references extracted packages
- test-results/ directory with stale Playwright artifacts
- PRBODY.md at root
- vitest.config.ts may have stale aliases

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — cleanup phase.

Key rules:
- For RUNTIME-SPEC.md: Update references to point to @kehto equivalents, or note they've moved
- For skills/: Update imports from @napplet/shell → @kehto/shell etc.
- For specs/nubs/: Update package references to @kehto
- Delete test-results/ and PRBODY.md entirely
- For dead code: Only remove truly unused exports, not public API surface
- After all changes: pnpm build && pnpm type-check must pass

</decisions>

<code_context>
## Existing Code Insights

### Package Structure
- packages/core/src/ — shared types, constants, topics (zero deps)
- packages/shim/src/ — window installer (depends on core)
- packages/sdk/src/ — bundler-friendly wrapper (depends on core)
- packages/vite-plugin/src/ — manifest generation (depends on nostr-tools)

### Known Stale References
- skills/add-service/SKILL.md — imports from @napplet/shell
- skills/integrate-shell/SKILL.md — @napplet/shell integration guide
- skills/build-napplet/SKILL.md — references @napplet/shell
- RUNTIME-SPEC.md — lists @napplet/runtime, @napplet/acl, @napplet/services, @napplet/shell
- specs/nubs/*.md — some reference @napplet/shell package paths

</code_context>

<specifics>
## Specific Ideas

No specific requirements — cleanup phase.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
