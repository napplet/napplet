# Phase 69: Migration Evaluation - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning
**Mode:** Auto-generated (analytical phase — discuss skipped)

<domain>
## Phase Boundary

Produce a written assessment of remaining @napplet content that may belong elsewhere:
1. General audit: any code/docs that should migrate to @kehto
2. specs/nubs/ evaluation: stay in @napplet, move to ~/Develop/nubs (github.com/napplet/nubs), or other
3. skills/ evaluation: keep in @napplet, move to @kehto, or split

Output: A MIGRATION-EVAL.md report at repo root (or .planning/) with recommendations.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All decisions at Claude's discretion — analytical/documentation phase.

Key context:
- NUB specs governance repo: ~/Develop/nubs (github.com/napplet/nubs) — already exists
- @kehto repo: ~/Develop/kehto — shell/runtime packages live here
- @napplet now has: core, shim, sdk, vite-plugin
- skills/ has 3 files: build-napplet, integrate-shell, add-service
- specs/ has NIP-5D.md and nubs/ directory (6 interface specs + templates + README)
- RUNTIME-SPEC.md is the internal runtime reference (41KB+)

Evaluation criteria:
- Does it teach napplet-side development? → stays in @napplet
- Does it teach shell/runtime integration? → @kehto
- Is it a protocol standard? → stays in @napplet or goes to nubs repo
- Is it implementation-specific? → @kehto

</decisions>

<code_context>
## Existing Code Insights

### Remaining Content to Evaluate
- RUNTIME-SPEC.md — 41KB+ internal runtime reference
- specs/NIP-5D.md — NIP standard draft
- specs/nubs/ — 6 interface specs (RELAY, STORAGE, SIGNER, NOSTRDB, IPC, PIPES) + governance
- skills/build-napplet/ — how to build a napplet (napplet-side)
- skills/integrate-shell/ — how to integrate @kehto/shell (shell-side, already updated to @kehto refs)
- skills/add-service/ — how to add a service (shell-side, already updated to @kehto refs)

</code_context>

<specifics>
## Specific Ideas

No specific requirements.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
