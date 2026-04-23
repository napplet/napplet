# Phase 17: Shell Export Cleanup - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Clean up shell's public API exports to remove dead code from the pre-runtime refactor. After Phase 14 rewired shell to delegate to @napplet/runtime, several exports became orphaned (pointing to old browser-coupled implementations) or duplicated (enforce.ts copied rather than re-exported). This phase removes those artifacts so integrators get a clean, correct API.

</domain>

<decisions>
## Implementation Decisions

### Dead Export Removal
- **D-01:** Remove `handleStateRequest` re-export from index.ts line 64. No consumer imports it from @napplet/shell. The runtime's version at `packages/runtime/src/state-handler.ts` is what actually executes.
- **D-02:** Remove `cleanupNappState` re-export from index.ts line 52. No consumer imports it from @napplet/shell. The runtime's version is the live code path.
- **D-03:** Keep `state-proxy.ts` file itself — it may be needed for shell-internal localStorage operations. Just stop re-exporting its functions publicly.

### Enforce.ts Deduplication
- **D-04:** Delete `packages/shell/src/enforce.ts` (duplicate of runtime's enforce.ts).
- **D-05:** Re-export `createEnforceGate`, `resolveCapabilities`, `formatDenialReason` from `@napplet/runtime` in shell's index.ts. This maintains backwards compatibility for any consumer importing these from `@napplet/shell`.
- **D-06:** Re-export the enforce types (`CapabilityResolution`, `EnforceResult`, `EnforceConfig`, `IdentityResolver`, `AclChecker`) from `@napplet/runtime` as well. These types must remain importable from `@napplet/shell` for backwards compat.

### Singleton Export Policy
- **D-07:** Keep `originRegistry` export — actively used by createShellBridge, e2e harness, and shell-host.html.
- **D-08:** Keep `audioManager` export — actively used by shell-bridge.ts for audio event handling.
- **D-09:** Remove `nappKeyRegistry` singleton export from index.ts. After Phase 14, registrations go to runtime's internal instance. The shell singleton is empty. Consumers should use `shellBridge.runtime.nappKeyRegistry` instead.
- **D-10:** Remove `aclStore` singleton export from index.ts. Same reasoning — runtime's aclState is the live instance. Shell's aclStore singleton is disconnected.
- **D-11:** Keep `manifestCache` export — used by hooks-adapter.ts in the ShellHooks→RuntimeHooks bridging.

### Claude's Discretion
- Whether to add deprecation JSDoc comments on removed items or just delete them outright (clean break preferred since this is pre-1.0)
- Whether state-proxy.ts itself should be deleted if truly unused after removing exports

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Audit findings
- `.planning/v0.3.0-MILESTONE-AUDIT.md` — Tech debt items driving this phase (SHELL-04, SHELL-06)

### Shell package
- `packages/shell/src/index.ts` — Current export surface to be modified
- `packages/shell/src/enforce.ts` — Duplicate to be deleted
- `packages/shell/src/state-proxy.ts` — Dead export source
- `packages/shell/src/hooks-adapter.ts` — Uses manifestCache, must not break
- `packages/shell/src/shell-bridge.ts` — Uses originRegistry, audioManager, must not break

### Runtime package (re-export source)
- `packages/runtime/src/enforce.ts` — Source of truth for enforce gate
- `packages/runtime/src/index.ts` — Verify enforce types are exported here

### Test files (must stay green)
- `tests/unit/shell-runtime-integration.test.ts` — Imports createEnforceGate from @napplet/runtime
- `tests/e2e/harness/harness.ts` — Uses relay.runtime.nappKeyRegistry (not shell singleton)
- `tests/e2e/shell-host.html` — Imports nappKeyRegistry from @napplet/shell (needs update)
- `apps/demo/src/shell-host.ts` — Imports from @napplet/shell

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Shell index.ts has clear section comments (`// ─── Public API`, `// ─── Internal re-exports`) that guide where to make changes
- Runtime already exports all enforce functions and types from its index.ts

### Established Patterns
- Re-export pattern: `export { X } from '@napplet/runtime'` — already used for core types
- Type re-exports use `export type { X } from '...'` with verbatimModuleSyntax

### Integration Points
- `tests/e2e/shell-host.html` imports `nappKeyRegistry` — this HTML file needs updating to use runtime's registry instead
- `apps/demo/src/shell-host.ts` imports from `@napplet/shell` — verify no removed exports are used

</code_context>

<specifics>
## Specific Ideas

No specific requirements — straightforward cleanup guided by audit findings. Pre-1.0 so clean breaks preferred over deprecation shims.

</specifics>

<deferred>
## Deferred Ideas

- SVC-01: Migrate `services` field from ShellHooks to RuntimeHooks — belongs in v0.4.0 when services are implemented
- Consider whether `state-proxy.ts` should be deleted entirely after this cleanup — evaluate after removing exports

</deferred>

---

*Phase: 17-shell-export-cleanup*
*Context gathered: 2026-03-31*
