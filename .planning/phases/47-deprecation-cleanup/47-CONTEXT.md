# Phase 47: Deprecation Cleanup - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Remove `RuntimeHooks` and `ShellHooks` deprecated type aliases from `@napplet/runtime` and `@napplet/shell`. These were deprecated in v0.7.0 Phase 37 with `RuntimeAdapter`/`ShellAdapter` as canonical replacements. One full release cycle (v0.8.0) has passed. Update all references in READMEs, test utilities, and test files.

</domain>

<decisions>
## Implementation Decisions

- **D-01:** Pure deletion — remove `RuntimeHooks` and `ShellHooks` type aliases and all re-exports. No replacement needed (already exists as `RuntimeAdapter`/`ShellAdapter`).
- **D-02:** Update all 11 files that reference the old names: exports, type declarations, README examples, test utilities, test files.

### Claude's Discretion

- File ordering and commit granularity

</decisions>

<canonical_refs>
## Canonical References

- `.planning/REQUIREMENTS.md` — DEP-03, DEP-04
- `packages/runtime/src/types.ts` — RuntimeHooks alias definition
- `packages/shell/src/types.ts` — ShellHooks alias definition
- `packages/runtime/src/index.ts` — RuntimeHooks re-export
- `packages/shell/src/index.ts` — ShellHooks re-export

</canonical_refs>

<code_context>
## Existing Code Insights

### Files to modify (11 total)
- `packages/runtime/src/types.ts` — remove RuntimeHooks type alias
- `packages/runtime/src/index.ts` — remove RuntimeHooks re-export
- `packages/runtime/src/test-utils.ts` — update any RuntimeHooks usage
- `packages/runtime/src/dispatch.test.ts` — update test types
- `packages/runtime/src/discovery.test.ts` — update test types
- `packages/runtime/README.md` — update examples
- `packages/shell/src/types.ts` — remove ShellHooks type alias
- `packages/shell/src/index.ts` — remove ShellHooks re-export
- `packages/shell/src/hooks-adapter.ts` — update references
- `packages/shell/README.md` — update examples
- `packages/services/README.md` — update references if any

</code_context>

<specifics>
## Specific Ideas

No specific requirements — straightforward find-and-delete.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>

---

*Phase: 47-deprecation-cleanup*
*Context gathered: 2026-04-02*
