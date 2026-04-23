# Phase 128: Central Shim Integration - Context

**Gathered:** 2026-04-20
**Status:** Ready for planning
**Mode:** Auto-generated (NUB integration phase — discuss skipped; 9-NUB pattern proven)

<domain>
## Phase Boundary

Wire the resource NUB into `@napplet/shim` following the established 9-NUB integration pattern:

1. Import `installResourceShim` from `@napplet/nub/resource/shim` and call it from the central shim installer
2. Mount `bytes` and `bytesAsObjectURL` from the resource NUB onto `window.napplet.resource`
3. Add `resource.*` envelope routing branch to the shim's central message handler (already covered by `installResourceShim` if it uses `registerNub`)
4. Ensure `shell.supports('nub:resource')` returns true (existing `shell.supports` mechanism handles this if the shell advertises support — shim just routes the query)
5. Ensure `shell.supports('resource:scheme:<name>')` per-scheme query routes correctly

Closes DEF-125-01 cascade — workspace-wide `pnpm -r type-check` should be green after this phase since `NappletGlobal.resource` is now actually populated by the shim.

NO sidecar policy changes (Phase 132 spec). NO SDK barrel changes (Phase 129). NO vite-plugin changes (Phase 130).

</domain>

<decisions>
## Implementation Decisions

### Integration Pattern (LOCKED — from prior 9 NUBs)

- `@napplet/shim/src/index.ts` calls `installResourceShim()` (Phase 126 deliverable) alongside the other 9 install calls
- Mount `window.napplet.resource = { bytes, bytesAsObjectURL }` matching the `NappletGlobal.resource` shape locked in Phase 125
- Use `import { bytes, bytesAsObjectURL, installResourceShim } from '@napplet/nub/resource/shim'` (or via the resource barrel — executor's discretion)
- `window.napplet.shell.supports()` is already a shell-side query; no shim wiring needed beyond the standard `nub:` and `perm:` prefix routing that already exists

### REQ Coverage (from REQUIREMENTS.md)

- **SHIM-01**: `resource.*` envelope routing branch — handled by `installResourceShim()` calling `registerNub('resource', handleResourceMessage)` from Phase 126
- **SHIM-02**: `window.napplet.resource` namespace mounted — explicit assignment
- **SHIM-03**: `installResourceShim()` called exactly once from central installer
- **CAP-01**: `shell.supports('nub:resource')` — standard NUB capability check (existing infra handles)
- **CAP-02**: `shell.supports('resource:scheme:<name>')` — per-scheme query passes through to shell

### Claude's Discretion

- Exact placement within `packages/shim/src/index.ts` (mirror identity/notify position)
- Whether to import individual functions or the whole shim namespace
- JSDoc on the new mount

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets

- `packages/shim/src/index.ts` — central shim installer; currently wires 9 NUBs (relay, identity, storage, ifc, theme, notify, keys, media, config). Add resource as the 10th.
- `packages/nub/src/resource/shim.ts` — exports `bytes`, `bytesAsObjectURL`, `installResourceShim`, `handleResourceMessage`, `hydrateResourceCache` (Phase 126 deliverable)
- `packages/nub/src/resource/index.ts` — barrel re-exporting the above
- `packages/core/src/types.ts` — `NappletGlobal.resource = { bytes, bytesAsObjectURL }` shape locked in Phase 125

### Established Pattern (study how identity / notify / config are wired)

Each NUB integration in `packages/shim/src/index.ts` follows roughly:
```ts
import { installXShim } from '@napplet/nub/x/shim';
// ...
installXShim();
window.napplet.x = { /* surface from nub */ };
```

The exact form may vary slightly per NUB. Read identity, notify, and config integrations as canonical references.

### Integration Points

- After this phase: `pnpm -r build` and `pnpm -r type-check` should both exit 0 across all 14 packages (DEF-125-01 closed)
- Downstream Phase 129 will mirror this in @napplet/sdk barrel
- Downstream Phase 130 will integrate vite-plugin CSP option (independent of this)

</code_context>

<specifics>
## Specific Ideas

Plan should fit in 1 plan with 2-3 tasks:
- Task 1: integrate resource NUB into `packages/shim/src/index.ts` (import + install + mount)
- Task 2: verify build + type-check pass across full monorepo (DEF-125-01 closure)
- Optionally Task 3: smoke test that `window.napplet.resource.bytes('data:...')` works end-to-end via the shim entry point (Node + JSDOM or simple stub)

Critical acceptance criterion: `pnpm -r type-check` exits 0 across ALL 14 packages (closes DEF-125-01).

</specifics>

<deferred>
## Deferred Ideas

- Per-scheme capability negotiation logic — the napplet just calls `shell.supports('resource:scheme:blossom')` and the shell answers; shim has no special knowledge here
- Sidecar opt-in (NUB-RELAY spec is Phase 132)

</deferred>
