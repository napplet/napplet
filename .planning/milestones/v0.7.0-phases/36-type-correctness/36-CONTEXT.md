# Phase 36: Type Correctness - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Two surgical fixes:
1. **TYPE-01** — Remove `ConsentRequest` from `packages/shell/src/types.ts` (stale, missing `type` discriminator and `serviceName` field); re-export the canonical definition from `@napplet/runtime` directly in shell's `index.ts`.
2. **TYPE-02** — Confirm `packages/shell/src/state-proxy.ts` is dead code (zero imports found) and remove it.

Does NOT rename any public API, add new fields, or change behavior.

</domain>

<decisions>
## Implementation Decisions

### ConsentRequest — type field stays optional
- **D-01:** The canonical `ConsentRequest.type` field in `@napplet/runtime` stays optional (`type?: 'destructive-signing' | 'undeclared-service'`). Absence is treated as `'destructive-signing'` by the runtime. No callsite changes required.
- **D-02:** Shell's locally-defined `ConsentRequest` (in `types.ts`) is removed entirely. The shell version was missing `type` and `serviceName` — stale divergence from the runtime canonical.

### Shell re-export — direct from runtime
- **D-03:** `packages/shell/src/index.ts` re-exports `ConsentRequest` directly from `@napplet/runtime`:
  ```ts
  export type { ConsentRequest } from '@napplet/runtime';
  ```
  This replaces the current re-export from `./types.js`. Same pattern as `ConsentHandler`, enforcement types already re-exported from upstream packages.
- **D-04:** `packages/shell/src/types.ts` import of `ConsentRequest` is removed. The `handler as ConsentHandler` cast in `registerConsentHandler` (shell-bridge.ts line 173) can be removed once shell and runtime `ConsentRequest` types are unified.

### state-proxy.ts — skip Phase 34 update, remove in Phase 36
- **D-05:** `packages/shell/src/state-proxy.ts` is confirmed dead code — zero import references found across all packages. It should be removed in Phase 36, not updated.
- **D-06:** Phase 34 executor must **skip** `state-proxy.ts` — do not apply the `napp-state:` → `napplet-state:` prefix update (D-09 from Phase 34 context). The file will be deleted in Phase 36; updating dead code first is wasted work.
- **D-07:** Phase 36 plan removes `state-proxy.ts` unconditionally after confirming it is not imported anywhere.

### Complete Change Map
| File | Change |
|------|--------|
| `packages/shell/src/types.ts` | Remove `ConsentRequest` interface definition |
| `packages/shell/src/shell-bridge.ts` | Remove `as ConsentHandler` cast in `registerConsentHandler`; ensure `ConsentRequest` import comes from runtime |
| `packages/shell/src/index.ts` | Change `ConsentRequest` re-export source from `./types.js` to `@napplet/runtime` |
| `packages/shell/src/state-proxy.ts` | **Delete file** |

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — TYPE-01 and TYPE-02 define acceptance criteria for this phase

### Key Source Files
- `packages/runtime/src/types.ts` — canonical `ConsentRequest` definition (lines 263-274); this is the source of truth
- `packages/runtime/src/index.ts` — confirms `ConsentRequest` and `ConsentHandler` are already exported from runtime
- `packages/shell/src/types.ts` — stale `ConsentRequest` definition to remove (lines 68-73)
- `packages/shell/src/shell-bridge.ts` — `registerConsentHandler` cast site (line 173); and `ConsentRequest` import from `./types.js` (line 20)
- `packages/shell/src/index.ts` — re-export site to update (line 34)
- `packages/shell/src/state-proxy.ts` — file to delete (confirmed zero imports)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/shell/src/index.ts` already re-exports from `@napplet/runtime` (enforcement types, lines 51-52) — exact pattern to follow for `ConsentRequest`

### Established Patterns
- Shell re-exports upstream types directly: `export type { X } from '@napplet/runtime'` — this is the established pattern for types that cross package boundaries

### Integration Points
- `shell-bridge.ts` imports `ConsentHandler` from `@napplet/runtime` (already correct); fix is to also import `ConsentRequest` from there instead of `./types.js`
- After TYPE-01 fix, `ConsentRequest` in shell and runtime are identical — the `as ConsentHandler` cast becomes unnecessary

</code_context>

<specifics>
## Specific Ideas

- D-06 is a cross-phase coordination note: Phase 34 executor must skip `state-proxy.ts`. The Phase 36 plan should document this assumption and verify the file still has zero imports before deletion.
- The `as ConsentHandler` cast removal is a bonus correctness fix — it was papering over the type divergence.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 36-type-correctness*
*Context gathered: 2026-04-01*
