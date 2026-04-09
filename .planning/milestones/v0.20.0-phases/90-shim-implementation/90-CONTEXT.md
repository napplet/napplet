# Phase 90: Shim Implementation - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase)

<domain>
## Phase Boundary

Napplets get smart keyboard forwarding and action registration out of the box by importing the shim. Replace keyboard-shim.ts with keys-shim.ts implementing the NUB-KEYS wire protocol.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase with fully-specified behavioral requirements. Key constraints:

1. `keyboard-shim.ts` must be deleted; `keys-shim.ts` replaces it
2. Smart forwarding: suppress list from `keys.bindings`, local action triggers for bound combos
3. Never forward: IME composition, bare modifiers, Tab/Shift+Tab (reserved keys)
4. `window.napplet.keys` API: `registerAction()`, `unregisterAction()`, `onAction()`
5. Unbound keydown events → `keys.forward` postMessage to parent
6. Use inline structural types — no imports from @napplet/nub-keys

</decisions>

<code_context>
## Existing Code Insights

- `packages/shim/src/keys-shim.ts` already exists (from cross-phase commit 4e798d0)
- `packages/shim/src/keyboard-shim.ts` already deleted
- Shim follows file-per-concern pattern: `relay-shim.ts`, `storage-shim.ts`, `signer-shim.ts`, etc.
- Each shim installs on `window.napplet.*` namespace
- Entry point: `packages/shim/src/index.ts` imports all shims

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase with NUB-KEYS spec as source of truth.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>

---

*Phase: 90-shim-implementation*
*Context gathered: 2026-04-09*
