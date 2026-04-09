# Phase 88: NUB Type Package - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via infrastructure phase)

<domain>
## Phase Boundary

Create `@napplet/nub-keys` package at `packages/nubs/keys/` with typed message definitions per the NUB-KEYS spec (napplet/nubs#9). Package follows the exact pattern of existing NUB packages (nub-relay, nub-signer, nub-storage, nub-ifc, nub-theme).

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices at Claude's discretion — follow existing NUB package patterns exactly.

The package must define:
- 6 message types: `keys.forward`, `keys.registerAction`, `keys.registerAction.result`, `keys.unregisterAction`, `keys.bindings`, `keys.action`
- Supporting types: `Action` (id, label, defaultKey?), `RegisterResult` (actionId, binding?), `KeyBinding` (actionId, key)
- `DOMAIN` constant: `'keys'`
- Discriminated union types for all messages
- Barrel export from index.ts

Follow the exact file structure of `packages/nubs/theme/` (simplest existing NUB).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### NUB Spec (source of truth for message types)
- `~/Develop/nubs/NUB-KEYS.md` — The NUB-KEYS spec (napplet/nubs#9)

### Pattern references (copy structure from these)
- `packages/nubs/theme/src/types.ts` — Simplest NUB type package
- `packages/nubs/theme/src/index.ts` — Barrel export pattern
- `packages/nubs/theme/package.json` — Package config pattern
- `packages/nubs/theme/tsup.config.ts` — Build config pattern
- `packages/nubs/theme/tsconfig.json` — TS config pattern

</canonical_refs>

<code_context>
## Existing Code Insights

### Key facts
- pnpm-workspace.yaml already covers `packages/nubs/*` — no workspace config change needed
- All NUB packages depend on `@napplet/core` for `NappletMessage` base type
- turbo.json build task covers all workspace packages automatically
- Existing NUBs use `type: 'domain.action'` template literal types on the `type` field

</code_context>

<specifics>
## Specific Ideas

No specific requirements — follow existing patterns.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>

---

*Phase: 88-nub-type-package*
*Context gathered: 2026-04-09*
