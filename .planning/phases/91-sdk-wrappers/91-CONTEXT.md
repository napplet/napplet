# Phase 91: SDK Wrappers - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase)

<domain>
## Phase Boundary

Bundler consumers can import typed keys functions and all NUB message types from @napplet/sdk. Add keys convenience wrappers and re-export @napplet/nub-keys types.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Key constraints:

1. `import { keys } from '@napplet/sdk'` provides registerAction(), unregisterAction(), onAction() wrapping window.napplet.keys
2. registerAction() convenience auto-wires an onAction() listener and returns a cleanup handle
3. All @napplet/nub-keys message types and DOMAIN constant re-exported from @napplet/sdk

</decisions>

<code_context>
## Existing Code Insights

- SDK keys wrapper already exists in `packages/sdk/src/index.ts` (from cross-phase commit 4e798d0)
- SDK pattern: each namespace is an exported const object wrapping window.napplet.* calls
- @napplet/nub-keys types re-exported via barrel export
- Existing SDK wrappers: relay, storage, ipc, theme

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase following established SDK pattern.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>

---

*Phase: 91-sdk-wrappers*
*Context gathered: 2026-04-09*
