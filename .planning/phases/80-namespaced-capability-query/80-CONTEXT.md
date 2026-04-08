# Phase 80: Namespaced Capability Query - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Update `shell.supports()` to accept namespaced capability strings with `nub:`, `perm:`, `svc:` prefixes. This phase changes the type signature and stub implementation only — the shell runtime populates actual capabilities (separate repo).

</domain>

<decisions>
## Implementation Decisions

### Type signature
- **D-01:** `ShellSupports.supports()` accepts a union type: `NubDomain | \`nub:${NubDomain}\` | \`perm:${string}\` | \`svc:${string}\``
- **D-02:** Bare NUB domain strings (`'relay'`, `'signer'`) remain valid as shorthand for `'nub:relay'`, `'nub:signer'`
- **D-03:** Permissions and services MUST use prefixes — `'perm:popups'`, `'svc:audio'`. No bare strings for those.

### Implementation scope
- **D-04:** The stub in shim still returns `false` — this phase changes the type contract, not the runtime behavior. Shell populates capabilities at iframe creation (shell runtime repo's concern).
- **D-05:** Update all JSDoc examples that show `shell.supports('signer')` to also show the namespaced form `shell.supports('nub:signer')`.

### Claude's Discretion
- Whether to export the `NamespacedCapability` type alias or keep it inline
- JSDoc example ordering and formatting

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Type definitions
- `packages/core/src/envelope.ts` — `ShellSupports` interface (lines 95-98), `NubDomain` type (line 61), `NappletGlobalShell` (line 114)

### Shim implementation
- `packages/shim/src/index.ts` — `shell.supports()` stub (lines 350-355)

### Type surface
- `packages/core/src/types.ts` — `NappletGlobal.shell` type definition (lines 331-342)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `NubDomain` type already exists as `'relay' | 'signer' | 'storage' | 'ifc' | 'theme'`
- `NUB_DOMAINS` constant array for runtime validation

### Established Patterns
- Template literal types used elsewhere in the codebase (NUB message type discriminants)
- `ShellSupports` interface is the single source — `NappletGlobalShell` extends it

### Integration Points
- `core/src/envelope.ts` — type definition
- `core/src/types.ts` — `NappletGlobal` interface references `NappletGlobalShell`
- `shim/src/index.ts` — runtime stub
- `sdk/` — re-exports from core (verify what's re-exported)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 80-namespaced-capability-query*
*Context gathered: 2026-04-08*
