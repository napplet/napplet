# Phase 7: Nomenclature - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Rename pseudo-relay → ShellBridge and complete the storage → state rename across all packages, tests, spec, and demo. Mechanical rename phase — no behavioral changes, all existing tests must pass with new names.

</domain>

<decisions>
## Implementation Decisions

### ShellBridge Rename
- **D-01:** `createPseudoRelay()` → `createShellBridge()`. Hard cut, no deprecated alias.
- **D-02:** `PseudoRelay` type → `ShellBridge` type. Hard cut, no deprecated alias.
- **D-03:** `pseudo-relay.ts` file → `shell-bridge.ts`
- **D-04:** `PSEUDO_RELAY_URI` constant → `SHELL_BRIDGE_URI`. Value stays `'napplet://shell'` (namespaced, can't collide with real relay URLs).
- **D-05:** Hard cut on all old names — no backwards compat exports. Pre-v1, no external consumers.

### Storage → State (completion)
- **D-06:** The storage → state rename is already done in shell package, shim package, demo, and spec. Remaining work is test files only.
- **D-07:** `storage-isolation.spec.ts` → `state-isolation.spec.ts`
- **D-08:** All `storage:read`/`storage:write` capability strings in tests → `state:read`/`state:write`
- **D-09:** All `shell:storage-*` topic strings in tests → `shell:state-*`

### Claude's Discretion
- Grep for any remaining `pseudo-relay`, `PseudoRelay`, `createPseudoRelay`, `PSEUDO_RELAY_URI` references and rename them
- Update any comments or JSDoc that reference old names
- Ensure demo app imports are updated

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Source Files (primary targets for ShellBridge rename)
- `packages/shell/src/pseudo-relay.ts` — main file to rename to `shell-bridge.ts`
- `packages/shell/src/index.ts` — exports `createPseudoRelay`, `PseudoRelay`, `PSEUDO_RELAY_URI`
- `packages/shell/src/types.ts` — defines `PSEUDO_RELAY_URI` constant
- `packages/shim/src/types.ts` — also defines `PSEUDO_RELAY_URI`
- `apps/demo/src/shell-host.ts` — imports `createPseudoRelay`, `PseudoRelay`
- `tests/e2e/harness/harness.ts` — imports from `@napplet/shell`
- `SPEC.md` — references "pseudo-relay" throughout

### Source Files (state rename completion)
- `tests/e2e/storage-isolation.spec.ts` — needs rename to `state-isolation.spec.ts`
- `tests/e2e/acl-enforcement.spec.ts` — may have remaining `storage:` capability strings

</canonical_refs>

<code_context>
## Existing Code Insights

### Current State of Rename
- Shell package: `pseudo-relay.ts` still uses old name, exports old API names
- Shell types: `PSEUDO_RELAY_URI = 'napplet://shell'` defined in both shell and shim types.ts
- Shim package: imports `PSEUDO_RELAY_URI` from its own types.ts
- Demo: imports `createPseudoRelay` and `PseudoRelay` type from `@napplet/shell`
- Tests: import from `@napplet/shell` — will need updated after package rebuild
- Storage → state: already done in source packages, needs test file updates only

</code_context>

<specifics>
## Specific Ideas

None — mechanical rename.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 07-nomenclature*
*Context gathered: 2026-03-30*
