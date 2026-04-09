# Phase 85: Stale Documentation Fixes - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning
**Mode:** Auto-generated (cleanup phase)

<domain>
## Phase Boundary

Fix every incorrect reference in READMEs, JSDoc, and NIP-5D. No code changes — documentation only. After this phase, every doc accurately reflects the current codebase state.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices at Claude's discretion — pure doc fix phase.

Specific fixes:

**DOC-01: Fix SDK README**
- File: `packages/sdk/README.md`
- Remove references to "services" namespace (line ~15 and elsewhere)
- The `services` namespace was removed — only `relay`, `ipc`, `storage`, `shell` exist

**DOC-02: Fix vite-plugin README**
- File: `packages/vite-plugin/README.md`
- Remove `window.napplet.services.has()` references (lines ~83, ~102, ~145-150)
- Replace with `window.napplet.shell.supports('svc:...')` where appropriate
- `services.has()` API no longer exists — everything is `shell.supports()`

**DOC-03: Fix core README**
- File: `packages/core/README.md`
- NubDomain table lists 4 domains but code has 5 (includes `theme`)
- Update table to show all 5: relay, signer, storage, ifc, theme

**DOC-04: Fix core envelope.ts JSDoc**
- File: `packages/core/src/envelope.ts`
- NubDomain JSDoc table (line ~44-60) lists 4 domains — add `theme`
- Remove references to nonexistent D-02/D-03 decision IDs (line ~90-91)
- Replace with plain language: "Bare strings are valid only for NUB domains" / "Permissions and services MUST use their prefix"

**DOC-05: Fix NIP-5D.md**
- File: `specs/NIP-5D.md`
- Remove `window.napplet.services.has('audio')` line (Section: Runtime Capability Query)
- The services.has() API is replaced by `shell.supports('svc:...')`
- Update to: `window.napplet.shell.supports('svc:audio')  // boolean`

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Files to edit
- `packages/sdk/README.md` — remove services namespace references
- `packages/vite-plugin/README.md` — replace services.has() with shell.supports()
- `packages/core/README.md` — add theme to NubDomain table
- `packages/core/src/envelope.ts` — fix JSDoc (5 domains, remove D-02/D-03)
- `specs/NIP-5D.md` — replace services.has() with shell.supports('svc:...')

### Reference for correct API
- `packages/core/src/envelope.ts` — NamespacedCapability type definition (source of truth)
- `packages/shim/src/index.ts` — window.napplet.shell.supports() implementation

</canonical_refs>

<code_context>
## Existing Code Insights

### Key facts
- The `services` namespace was fully removed in v0.17.0 Phase 81
- `shell.supports()` accepts `NamespacedCapability` = NubDomain | `nub:${NubDomain}` | `perm:${string}` | `svc:${string}`
- NubDomain in code is: `'relay' | 'signer' | 'storage' | 'ifc' | 'theme'`
- NUB_DOMAINS array in code includes all 5
- Theme NUB is spec-backed (draft PR in napplet/nubs repo)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — straightforward corrections.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 85-stale-documentation-fixes*
*Context gathered: 2026-04-08*
