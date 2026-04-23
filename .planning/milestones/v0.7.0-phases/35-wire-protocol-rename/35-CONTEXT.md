# Phase 35: Wire Protocol Rename - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace `BusKind.INTER_PANE` with `BusKind.IPC_PEER` across all 7 packages, all comments/JSDoc, and SPEC.md. Phase 35 also does the combined SPEC.md pass deferred from Phase 34: napp→napplet corrections + INTER-PANE→IPC-PEER + IPC-* namespace documentation, all in one edit.

Does NOT introduce any new protocol capabilities — correctness rename only.

</domain>

<decisions>
## Implementation Decisions

### BusKind.INTER_PANE Rename — No Deprecated Alias
- **D-01:** `BusKind.INTER_PANE` → `BusKind.IPC_PEER` as a clean rename. No deprecated alias shipped.
- **D-02:** Rationale: external consumers (e.g. hyprgate) are expected to self-migrate. If a consumer finds a gap, they will work around it or open an issue. No backwards-compatibility shim is warranted.

### Prose/Comment Terminology
- **D-03:** All instances of `"inter-pane"` in comments, JSDoc, and inline prose → `"IPC-PEER"` (exact term, not "IPC peer" or any other variant).
- **D-04:** Applies to all comment forms: `// inter-pane event`, `* inter-pane subscription`, `@example` blocks, README prose.

### IPC-* Namespace Documentation — Dual Location
- **D-05:** Canonical IPC-* family documentation lives in BOTH `constants.ts` JSDoc AND SPEC.md.
- **D-06:** `constants.ts` BusKind JSDoc: brief table with three entries — `IPC_PEER` (current), `IPC_BROADCAST` (reserved), `IPC_CHANNEL` (reserved) — pointing to SPEC.md for full semantics.
- **D-07:** SPEC.md: dedicated section (or sub-section) documenting the `IPC-*` namespace convention, listing `IPC-PEER` as the current member and `IPC-BROADCAST` / `IPC-CHANNEL` as reserved future members.

### SPEC.md Combined Pass (inherited from Phase 34 D-07)
- **D-08:** Phase 35 edits SPEC.md once with three changes applied together: (1) napp→napplet corrections (38 occurrences), (2) INTER-PANE→IPC-PEER substitution (10 occurrences), (3) IPC-* namespace section added.

### Complete Rename Map
| Current | Renamed To |
|---------|-----------|
| `BusKind.INTER_PANE` | `BusKind.IPC_PEER` |
| `INTER_PANE: 29003` (in BusKind object) | `IPC_PEER: 29003` |
| `"inter-pane"` in comments/JSDoc | `"IPC-PEER"` |
| `"INTER-PANE"` in SPEC.md | `"IPC-PEER"` |
| `"inter-pane"` prose in SPEC.md | `"IPC-PEER"` |
| `INTER_PANE` in SPEC.md code blocks | `IPC_PEER` |
| `INTER_PANE` in test files | `IPC_PEER` |

**Wire kind number stays the same:** `29003` — only the constant name and prose change.

### Success Verification
- `grep -r 'INTER.PANE\|INTER_PANE\|inter.pane' packages/` returns zero hits (excluding node_modules, dist)
- `pnpm type-check` passes across all 7 packages
- All existing tests pass

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — WIRE-01 and WIRE-02 define acceptance criteria for this phase

### Key Source Files (highest change density)
- `packages/core/src/constants.ts` — `BusKind.INTER_PANE` definition (rename here first; all consumers follow)
- `packages/core/src/topics.ts` — module header prose referencing "inter-pane"
- `packages/runtime/src/runtime.ts` — `case BusKind.INTER_PANE` switch arm (multiple sites)
- `packages/runtime/src/enforce.ts` — `BusKind.INTER_PANE` check
- `packages/runtime/src/service-dispatch.ts` — `INTER_PANE` in comments and function JSDoc
- `packages/runtime/src/dispatch.test.ts` — `BusKind.INTER_PANE` in 8+ test cases
- `packages/runtime/src/state-handler.ts` — `kind: BusKind.INTER_PANE`
- `packages/services/src/audio-service.ts` — `BusKind.INTER_PANE` check and synthetic event creation
- `packages/shell/src/audio-manager.ts` — `kind: BusKind.INTER_PANE`
- `packages/shell/src/state-proxy.ts` — `kind: BusKind.INTER_PANE`
- `packages/shim/src/index.ts` — `BusKind.INTER_PANE` in emit and subscribe, prose in JSDoc
- `SPEC.md` — 10 INTER-PANE occurrences + 38 napp (not napplet) occurrences; combined pass

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Phase 34 rename map pattern — comprehensive table of Before/After pairs, same structure used here

### Established Patterns
- BusKind constant is `as const` object — rename the key, numeric value (29003) is unchanged
- Test files use `BusKind.INTER_PANE` directly — update to `BusKind.IPC_PEER` in same pass

### Integration Points
- `packages/core/src/constants.ts` is the single source of truth for `BusKind`; all consumers import from there
- Re-exports via `packages/shell/src/index.ts` and `packages/shell/src/types.ts` — no change needed (they re-export `BusKind` by reference, not individual keys)

</code_context>

<specifics>
## Specific Ideas

- No deprecated alias for `BusKind.INTER_PANE` — clean break. Consumer migration is their responsibility.
- "IPC-PEER" (not "IPC peer" or "ipc-peer") is the exact prose form for comments and JSDoc.
- The IPC-* family table in `constants.ts` JSDoc should be concise: three rows, one-liner each, pointer to SPEC.md for semantics.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 35-wire-protocol-rename*
*Context gathered: 2026-04-01*
