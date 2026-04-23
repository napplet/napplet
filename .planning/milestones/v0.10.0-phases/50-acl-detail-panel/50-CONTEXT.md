# Phase 50: ACL Detail Panel - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Show per-napplet restrictions, capabilities, and rejection reasons with full event context. Users can inspect exactly what ACL enforcement does — what is allowed, what is denied, and why a specific message was rejected. Two views: system-wide policy (ACL node) and per-napplet activity (napplet node).

</domain>

<decisions>
## Implementation Decisions

### Event Context Gap
- **D-01:** Extend `AclCheckEvent` (or a wrapper) to capture the full triggering NIP-01 message alongside the existing identity/capability/decision fields.
- **D-02:** UI shows summarized context by default (kind number, topic tag if IPC, content preview truncated). Expandable to full detail with a "raw" toggle showing the complete message.
- **D-03:** Full messages are stored in memory for the raw toggle — summarization is a rendering concern, not a storage concern.

### Panel Integration
- **D-04:** Two views: ACL node drill-down shows system-wide policy. Napplet node drill-down shows that napplet's rejection history and event details.
- **D-05:** ACL node = policy view (all napplets and their capability states). Napplet node = activity view (rejection history with expandable events).
- **D-06:** The full policy view requires a **modal** (not the narrow inspector panel) — opened from the ACL node or from a button in the inspector. Grid/table format: rows = napplets, columns = capabilities, cells = granted (green) / denied (red) / default (gray).
- **D-07:** The inspector panel shows a compact ACL summary + "Open Policy" button when ACL node is selected. The napplet inspector shows rejection history inline (fits in narrow panel).

### History & Retention
- **D-08:** Ring buffer for ACL events per napplet. Default size 50, exposed as an editable constant in Phase 49's runtime config / constants panel.
- **D-09:** Old entries drop off when buffer is full. No export or clear button needed for v0.10.0.

### Capability Display
- **D-10:** Policy modal uses a full grid/table — rows are napplets, columns are capabilities. Cells show green check (granted), red cross (revoked), gray dash (default/permissive).
- **D-11:** The existing `DEMO_CAPABILITY_LABELS` from `acl-panel.ts` should be reused for column headers.

### Claude's Discretion
- Compact ACL summary content when ACL node selected in inspector (before opening modal)
- Napplet rejection history row layout (timestamp, capability, result, expand toggle)
- Modal styling, open/close transitions
- How to trigger modal (click ACL node directly, button in inspector, or both)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### ACL Enforcement (runtime layer)
- `packages/runtime/src/enforce.ts` — `createEnforceGate()`, `resolveCapabilities()`, `EnforceResult`, `AclCheckEvent` audit callback, `formatDenialReason()`
- `packages/runtime/src/types.ts:26-33` — `AclCheckEvent` interface (identity, capability, decision — needs message extension)
- `packages/runtime/src/runtime.ts:185` — Where `onAclCheck` is wired from RuntimeAdapter
- `packages/runtime/src/acl-state.ts` — ACL state mutations (grant, revoke, block, unblock, check)

### Demo ACL UI
- `apps/demo/src/acl-panel.ts` — Existing capability toggle buttons, `DEMO_CAPABILITY_LABELS`, `DEMO_CAPABILITY_HINTS`, inline style pattern
- `apps/demo/src/shell-host.ts:590-613` — `toggleCapability()` and `toggleBlock()` functions, ACL state wiring
- `apps/demo/src/node-inspector.ts` — Right-side inspector pane pattern, tab system to extend
- `apps/demo/src/node-details.ts` — Node detail data model and activity tracking

### Demo Flow & Color
- `apps/demo/src/flow-animator.ts:150-170` — Color classification logic (green/amber/red based on denial reason)
- `apps/demo/src/debugger.ts` — Bottom debugger for reference (inspector must not cover it)

### Phase 49 Context
- `.planning/phases/49-constants-panel/49-CONTEXT.md` — Inspector tab pattern, runtime config object in `@napplet/runtime`, constants panel decisions

### Phase 29 Context
- `.planning/phases/29-node-detail-drill-down/29-CONTEXT.md` — Inspector panel decisions (D-03: right-side, D-09: debugger stays accessible, D-05: all nodes support drill-down)

### ACL Package
- `packages/acl/src/types.ts` — Capability type, bitmask constants (CAP_SIGN_NIP44, CAP_STATE_READ, etc.), DEFAULT_QUOTA

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `acl-panel.ts` — `DEMO_CAPABILITY_LABELS` and `DEMO_CAPABILITY_HINTS` maps for all 10 capabilities. Reuse for modal column headers and napplet drill-down labels.
- `node-inspector.ts` — Inspector pane lifecycle, tab rendering. Extend with ACL summary tab content.
- `node-details.ts` — `NodeActivityEntry` pattern with direction, path, blocked, timestamp. ACL events follow same shape.
- `shell-host.ts` — `toggleCapability()` already wired. `onAclCheck` callback available on RuntimeAdapter but not connected in demo.

### Established Patterns
- `onAclCheck` audit callback fires on every enforce() call (allow AND deny). Just needs to be wired in `shell-host.ts`.
- Inline styles for dynamic UI (UnoCSS can't detect dynamically-assigned classes).
- Node details use `getNodeActivity()` for recent-activity projection — ACL events could feed into this.

### Integration Points
- `shell-host.ts` — Wire `onAclCheck` in RuntimeAdapter to capture events into a ring buffer per napplet.
- `node-inspector.ts` — Add ACL summary content when ACL node is selected, plus "Open Policy" button.
- `node-details.ts` — Extend napplet drill-down with rejection history section.
- New `acl-modal.ts` — Modal for full policy grid/table view.
- Phase 49's runtime config — ACL ring buffer size as configurable constant.

</code_context>

<specifics>
## Specific Ideas

- Summarized context by default, expandable to full detail with raw toggle — user wants to quickly scan rejections but drill into the full NIP-01 message when investigating.
- Policy modal is a deliberate choice because the inspector panel is too narrow for a capability matrix table.
- Ring buffer size configurable via Phase 49's constants panel — ties the two transparency features together.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 50-acl-detail-panel*
*Context gathered: 2026-04-03*
