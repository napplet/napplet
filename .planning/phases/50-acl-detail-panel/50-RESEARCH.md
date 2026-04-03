# Phase 50: ACL Detail Panel — Research

**Researched:** 2026-04-03
**Status:** Complete

## Research Questions

### Q1: How does onAclCheck flow from demo to runtime?

**Finding:** The `onAclCheck` callback is defined on both `ShellAdapter` (`packages/shell/src/types.ts:223`) and `RuntimeAdapter` (`packages/runtime/src/types.ts:616`). The shell's `hooks-adapter.ts:389` forwards it: `onAclCheck: shellHooks.onAclCheck`. The runtime's `createEnforceGate()` in `enforce.ts:164-184` calls it on every capability check (both allow and deny).

**Current state in demo:** `shell-host.ts:createDemoHooks()` (line 284-363) does NOT provide `onAclCheck`. The callback is available but unconnected.

**Wiring needed:** Add `onAclCheck` to the ShellAdapter returned by `createDemoHooks()`. This callback receives `AclCheckEvent` with `{ identity: { pubkey, dTag, hash }, capability, decision }`.

### Q2: What is the AclCheckEvent shape and what's missing?

**Current shape** (`packages/runtime/src/types.ts:26-33`):
```typescript
interface AclCheckEvent {
  identity: { pubkey: string; dTag: string; hash: string };
  capability: string;
  decision: 'allow' | 'deny';
}
```

**Missing per CONTEXT D-01:** The triggering NIP-01 message is not included. The `createEnforceGate()` in `enforce.ts` only receives `(pubkey, capability)` — it has no access to the raw message. The raw message is available at the call site in `runtime.ts` dispatch handlers where `enforce()` is called.

**Options:**
1. Extend `AclCheckEvent` interface to include optional `message?: unknown[]` field
2. Wrap the event at the call site before passing to onAclCheck
3. Create a demo-side wrapper that correlates ACL events with recent messages via timing

**Recommended:** Option 1 — extend `AclCheckEvent` with an optional `message` field. The enforce gate doesn't have the message, but the dispatch handler that calls enforce() does. We can pass it through a wrapper or extend the enforce gate signature.

### Q3: Where is enforce() called in the runtime dispatch?

**Locations in `packages/runtime/src/runtime.ts`** (searched for `enforce(`):

The enforce function is created at line 178-186 and called from dispatch handlers. Each call site has access to the original NIP-01 message array (`msg`). The pattern is:
```typescript
const result = enforce(pubkey, capability);
if (!result.allowed) { /* send denial */ }
```

To attach the message, we need to either:
- Change enforce signature to accept an optional message context
- Wrap at each call site to add message to the AclCheckEvent

**Recommended approach:** Modify `createEnforceGate` to accept an optional message parameter, forwarding it to `onAclCheck`. This keeps changes minimal — one signature change, one field added.

### Q4: How does the inspector panel work?

**Architecture** (`apps/demo/src/node-inspector.ts`):
- `initNodeInspector(getOptions, topology)` — sets up polling interval (1500ms)
- `setSelectedNodeId(id)` — opens/closes the inspector
- When open: renders `renderInspectorHeader()` + `renderInspectorContent()` from a `NodeDetail` object
- `NodeDetail` has `inspectorSections: InspectorSection[]` — each section has heading + items
- `recentActivity: NodeActivityEntry[]` — rendered as a list with direction/blocked indicators

**Extension pattern:** Add new sections to the `NodeDetail.inspectorSections` array in `node-details.ts:buildNappletDetail()` and `buildAclDetail()`.

### Q5: How does node-details.ts work for different roles?

**Pattern** (`apps/demo/src/node-details.ts`):
- `buildNodeDetails(node, options)` dispatches by `node.role`
- Each role has a dedicated builder: `buildNappletDetail()`, `buildAclDetail()`, etc.
- Builders return `NodeDetail` with `inspectorSections` and `recentActivity`
- Options provides live state: napplets map, serviceNames, hostPubkey, totalMessages, totalBlocked

**Current ACL node detail** (line 180-213): Shows `total denied`, `recent blocks`, `napplets under gate`. This is the place to add the "Open Policy" button reference.

**Current napplet detail** (line 97-141): Shows auth, pubkey, dTag, aggregateHash, capabilities (hardcoded "defaults"). This is where rejection history will go.

### Q6: What does the existing acl-panel.ts provide?

**Assets** (`apps/demo/src/acl-panel.ts`):
- `DEMO_CAPABILITY_LABELS: Record<Capability, string>` — human-readable names for all 10 capabilities
- `DEMO_CAPABILITY_HINTS: Record<Capability, string>` — shorter tooltip hints
- `DEMO_CAPABILITIES` — subset array of 5 commonly toggled capabilities
- `renderAclPanels()` — renders toggle buttons per napplet (hardcoded to chat/bot)
- `toggleCapability()` / `toggleBlock()` — imported from shell-host

**Reuse:** `DEMO_CAPABILITY_LABELS` and `DEMO_CAPABILITY_HINTS` for the policy modal column headers and napplet drill-down labels. The grid must show ALL 10 capabilities, not just the subset of 5.

### Q7: What data store is needed for ACL event history?

**Ring buffer pattern** from `node-details.ts`:
```typescript
const ACTIVITY_RING_SIZE = 12;
const nodeActivityRings = new Map<string, NodeActivityEntry[]>();
function pushActivity(nodeId, entry) { ring.push(entry); if (ring.length > SIZE) ring.shift(); }
```

**Phase 50 needs:** Per-napplet ACL event ring buffer (not per-node). Size 50 per CONTEXT D-08. Buffer stores enriched ACL events (identity + capability + decision + full NIP-01 message). The ring buffer size should be configurable via Phase 49's constants panel.

**Storage model per CONTEXT D-03:** Full messages stored in memory. Summarization is a rendering concern. The ring buffer stores `AclCheckEvent` (extended with message) directly.

### Q8: What UI components need to be created?

Per CONTEXT decisions:

1. **ACL event ring buffer** — per-windowId Map storing enriched ACL events
2. **ACL summary in inspector** — when ACL node selected, show compact policy summary + "Open Policy" button
3. **Policy modal** (`acl-modal.ts`) — full grid/table: rows=napplets, columns=capabilities, cells=green/red/gray
4. **Napplet rejection history** — when napplet node selected, show rejection history with expandable raw event toggle
5. **Wire onAclCheck** in shell-host to capture events into the ring buffer

### Q9: How to handle the modal pattern?

**No existing modal in the demo.** Need to create one from scratch.

**Requirements per CONTEXT D-06:**
- Opens from ACL node click or "Open Policy" button in inspector
- Grid/table format: rows = napplets, columns = capabilities
- Cells: green check (granted), red cross (revoked), gray dash (default/permissive)
- Must not cover the debugger (already handled by being a modal overlay)

**Implementation:** Create `acl-modal.ts` with:
- Fixed position overlay with semi-transparent backdrop
- Centered container with the grid table
- Close button and ESC key handler
- Inline styles (matching existing pattern)

### Q10: How to get current capability state for each napplet?

**Via `relay.runtime.aclState`** (exposed on ShellBridge):
- `aclState.check(pubkey, dTag, hash, capability)` — returns boolean per capability
- `aclState.getEntry(pubkey, dTag, hash)` — returns `AclEntryExternal` with capabilities array and blocked flag
- `aclState.getAllEntries()` — returns all entries

**In the demo:** `shell-host.ts` exposes `relay` as an export. The napplets map has `pubkey`, `dTag`, `aggregateHash` for each napplet. So the modal can iterate napplets, check each capability, and render the grid.

## Validation Architecture

### Dimension 1: Functional Completeness
- ACL event capture via onAclCheck callback
- Ring buffer stores extended ACL events per napplet
- Policy modal shows all capabilities for all napplets
- Napplet inspector shows rejection history

### Dimension 2: Integration
- onAclCheck wired in shell-host.ts createDemoHooks()
- AclCheckEvent extended with optional message field in runtime types
- Ring buffer accessible from node-details and inspector

### Dimension 3: Data Integrity
- Ring buffer bounded (default 50, configurable)
- Events include full NIP-01 message context
- Policy grid reflects live ACL state (re-queries on open)

### Dimension 4: User Experience
- Compact ACL summary in inspector (not full grid)
- Modal for full policy view (too wide for inspector panel)
- Expandable raw toggle on rejection entries
- Green/red/gray visual encoding

### Dimension 5: Error Handling
- Graceful handling of napplets without pubkey (pre-auth)
- Empty states for no rejection history
- Modal close on ESC and backdrop click

### Dimension 6: Performance
- Ring buffer prevents unbounded memory growth
- Modal renders on demand (not continuous)
- Inspector polling reuses existing 1500ms interval

### Dimension 7: Code Quality
- New module acl-modal.ts follows existing inline style pattern
- Extends existing node-details.ts builders
- Reuses DEMO_CAPABILITY_LABELS from acl-panel.ts

### Dimension 8: Verification
- TRANS-03: verify rejection history shows capability + reason + event context
- TRANS-04: verify policy modal shows all capabilities per napplet

## RESEARCH COMPLETE
