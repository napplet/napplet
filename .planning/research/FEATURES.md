# Feature Research: v0.11.0 Side Panel Cleanup

**Domain:** Developer tool inspector panel -- contextual filtering, tab organization, editable vs read-only separation
**Researched:** 2026-04-04
**Confidence:** HIGH (patterns well-established in Chrome DevTools, Blender, Grafana, React DevTools, Kubernetes dashboards)

## Context

The demo inspector pane currently has two tabs: **Node** (selected-node details) and **Constants** (all 23 protocol magic numbers with live editing). The v0.11.0 milestone goal is: make the side panel contextual and better organized -- constants filter to the selected node, Kinds get their own tab, and editable values are separated from read-only constants.

### What Already Exists

| Component | File | Current Behavior |
|-----------|------|------------------|
| Inspector pane | `node-inspector.ts` | Two tabs (Node, Constants). Renders selected-node detail or constants panel. Polls for updates every 1.5s. |
| Constants panel | `constants-panel.ts` | Shows all 23 constants. Search filter, grouping modes (package/domain/flat), slider+input editing for editable values, read-only display for protocol kinds. |
| Constants data | `demo-config.ts` | `ConstantDef[]` with `key`, `pkg`, `domain`, `editable`, `min/max/step` fields. 14 editable + 9 read-only (protocol kinds). |
| Node details | `node-details.ts` | Role-specific detail builders for 5 roles: napplet, shell, acl, runtime, service. |
| Tab bar | `node-inspector.ts:renderTabBar()` | Type `InspectorTab = 'node' | 'constants'`. Two buttons with underline indicator. |

### Current Pain Points

1. **Information overload**: 23 constants shown regardless of which node is selected. Selecting the ACL node and seeing "Sequence Diagram Header Height" is noise.
2. **Mixed editability**: Read-only protocol kinds (AUTH_KIND=22242, BusKind.REGISTRATION=29000, etc.) sit alongside editable tunables (Replay Window, Ring Buffer Size). Different interaction models in one list.
3. **Tab reset on selection**: `showInspector()` resets `_activeTab = 'node'` every time. Users on the Constants tab get bounced back to Node tab when clicking a different topology node.

---

## Table Stakes (Users Expect These)

Features that any developer tool inspector panel with tabs and contextual content must have. Missing these makes the panel feel broken.

| Feature | Why Expected | Complexity | Depends On | Notes |
|---------|--------------|------------|------------|-------|
| Contextual constants filtering by selected node | Chrome DevTools Styles tab, Blender Properties Editor, React DevTools all change visible content based on selection. Showing 23 constants when 3 apply to the selected runtime node creates noise. | MEDIUM | Role-to-constants mapping (new data structure) | Requires a `Map<TopologyNodeRole, string[]>` mapping each of the 5 roles to relevant `ConstantDef.key` values. The `pkg` and `domain` fields on `ConstantDef` provide the grouping basis. When no node is selected, show all (current behavior). |
| Kinds tab separated from behavioral constants | Kinds (22242, 29000-29010) are protocol-fixed reference values. Mixing them with editable timeouts/sizes conflates "what the protocol defines" vs "what I can tune." Chrome DevTools separates Styles (editable) from Computed (read-only) into different tabs for exactly this reason. | LOW | Tab bar extension (add third tab option) | 9 constants have `domain: 'protocol'` and `editable: false`. They form a natural Kinds tab. The remaining 14 editable constants stay in Constants tab. The existing `editable` flag cleanly drives this split. |
| Editable vs read-only visual separation | Users must immediately distinguish interactive controls from informational displays. Chrome DevTools shows editable CSS values with hover states and cursor changes; computed values are visually lighter. | LOW (zero extra work) | Kinds tab separation | Once kinds live in their own tab, the Constants tab is all-editable (sliders/inputs) and the Kinds tab is all-read-only (monospace values). The tab split IS the visual separation. No within-tab mixed editability. |
| Tab state persistence across node selections | Switching topology nodes must not reset the active tab. Blender keeps the active Properties Editor tab stable on object change. Chrome DevTools keeps Styles/Computed sub-tab stable when selecting different DOM elements. | LOW | None (one-line fix) | Currently `showInspector()` sets `_activeTab = 'node'`. Remove that line. If the user is on Constants tab and clicks a new node, they stay on Constants with content filtered to the new node's role. |
| Empty state for contextual filter with zero results | When a selected node has no relevant constants (possible for future node types), the panel needs a clear "no constants for [role]" message. Nielsen Norman Group: "Empty states communicate system status and increase learnability." | LOW | Contextual filtering | Existing `renderConstantsPanel()` already has "no matching constants" for search queries. Extend for contextual filtering with a "show all" escape link. |

---

## Differentiators (Competitive Advantage)

Features that make this panel feel polished beyond the basics. Not required, but they strengthen the demo's protocol-teaching mission.

| Feature | Value Proposition | Complexity | Depends On | Notes |
|---------|-------------------|------------|------------|-------|
| "Show all" toggle to escape contextual filter | Blender has a pin icon to lock properties and prevent context switching. An analogous "show all" toggle lets users opt out of filtering when they want the full picture. Prevents frustration when users know the constant name but don't know which node it belongs to. | LOW | Contextual filtering | Small toggle in constants tab header: "showing for: [role]" with clickable "[show all]". Module-state boolean. When toggled on, disables role-based filtering (search still works). |
| Filter badge count in tab labels | Show filtered count: "Constants (3)" or "Kinds (8)" as tab label badges. Chrome DevTools uses badge counts on tabs (e.g., "Issues (4)") to communicate content without requiring tab switch. | LOW | Contextual filtering | Computed from the filtered set length. Rendered in tab bar button text. Minimal effort, genuine polish. |
| Kind reference with NIP cross-links | The Kinds tab can include brief NIP references: "NIP-42" next to AUTH_KIND, "Ephemeral range" next to BusKind values. Turns a read-only number display into a protocol learning surface. | LOW | Kinds tab | Static metadata. Add an optional `nipRef` field to `ConstantDef` or hardcode in the kinds tab renderer. No runtime logic. |
| Linked navigation: kind in debugger links to Kinds tab | When a user sees kind 29001 in the debugger log, clicking it opens the Kinds tab filtered to that entry. Chrome DevTools computed values link to their Styles source rule. | MEDIUM | Kinds tab + debugger event bus | Requires a callback/event from debugger to inspector: "highlight constant X". Switch tab, scroll to entry, flash it. Uses existing `flashConstantRow()` pattern. |
| Role-specific constant descriptions | When filtering for a specific role, descriptions could add role context: for runtime, REPLAY_WINDOW_SECONDS says "events older than this are rejected by this node's replay checker." | MEDIUM | Contextual filtering | Requires a description override map keyed by `(key, role)`. More content to author. Makes the demo a better teaching tool but is maintenance burden. |

---

## Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Inline editing of protocol kind values | "Let users change BusKind.SIGNER_REQUEST from 29001 to see what happens" | Protocol kinds are baked into multiple packages at compile time. Changing them in the UI would silently break all message routing. The `editable: false` guard is correct. | Keep kinds read-only in their own tab. Teaching value comes from displaying them, not editing them. Behavioral constants (timeouts, sizes) are the correct editing surface. |
| Drag-to-reorder tabs | "Let users arrange Node/Constants/Kinds in preferred order" | Three tabs do not justify reorder complexity. Chrome DevTools offers this for 10+ panels. For 3 tabs it adds interaction cost for zero value. | Fixed tab order: Node, Constants, Kinds. Consistent layout aids muscle memory. |
| Persistent tab customization via localStorage | "Remember grouping mode, tab preferences across sessions" | This is a demo and teaching tool, not a daily-use IDE. Session-scoped state (current behavior) is correct -- each page load starts fresh. | Session-scoped only. Modified constants flash and show reset buttons. That's sufficient. |
| Multi-node selection with merged constants | "Select shell + runtime, see combined constants" | The topology has 7-8 nodes. Multi-select adds shift-click handling, selection indicators, merge/conflict display -- for a panel that would show at most 23 items anyway. Blender needs this for hundreds of objects. | Single-select only. "Show all" toggle covers the "I want everything" case. |
| Collapsible accordion sections within tabs | "Let users collapse 'timeouts' to focus on 'sizes'" | With contextual filtering, each tab will show 3-8 items. Collapsing a 4-item section saves zero cognitive load and adds click overhead. Collapsible sections shine at 20+ items per section. | Flat list within each tab. The tab split is the organizational layer. Grouping buttons (package/domain/flat) already exist for the "show all" view. |
| Auto-scroll inspector to modified constant on external change | "When runtime behavior changes a value, auto-scroll the Constants tab" | Constants are user-modified via sliders, not runtime-modified. No external changes occur. Auto-scroll would fight user scroll position. | Flash animation on edit (already implemented) is the correct feedback pattern. |

---

## Feature Dependencies

```
[Role-to-Constants Mapping]  (pure data, no UI)
    |
    +-- enables --> [Contextual Constants Filtering]
    |                   |
    |                   +-- enables --> [Empty State for No Matches]
    |                   |                   (contextual filter may produce 0 results)
    |                   |
    |                   +-- enables --> [Filter Badge Count]
    |                   |                   (needs filtered count to display)
    |                   |
    |                   +-- enables --> ["Show All" Toggle]
    |                                      (escape hatch for contextual filtering)
    |
[Tab Bar Extension]  (InspectorTab = 'node' | 'constants' | 'kinds')
    |
    +-- enables --> [Kinds Tab Separation]
    |                   |
    |                   +-- achieves --> [Editable vs Read-Only Separation]
    |                   |                   (side effect: Constants = editable, Kinds = read-only)
    |                   |
    |                   +-- enables --> [Kind NIP Cross-References]
    |                   |
    |                   +-- enables --> [Kind Cross-Links from Debugger]
    |
[Tab State Persistence]  (independent, one-line fix)
```

### Dependency Notes

- **Role-to-Constants Mapping is the foundation.** It must exist before contextual filtering can work. This is a data structure, not a UI feature.
- **Kinds Tab Separation and Editable/Read-Only are the same feature.** Splitting kinds into their own tab automatically achieves editability separation. No additional visual distinction needed within a single tab.
- **Tab State Persistence is independent.** It's a bug fix (`_activeTab = 'node'` line removal), not a feature that depends on or enables other features.
- **Filter Badge Count requires Contextual Filtering.** The badge number comes from the filtered set size.
- **Kind Cross-Links from Debugger require both Kinds Tab and Contextual Filtering.** The debugger must switch to Kinds tab and potentially override an active role filter.

---

## Role-to-Constants Mapping (Implementation Reference)

Analysis of 23 constants in `demo-config.ts` mapped to topology node roles:

### Constants Tab (14 editable behavioral constants)

| Constant Key | Relevant Roles | Rationale |
|-------------|----------------|-----------|
| `core.REPLAY_WINDOW_SECONDS` | runtime, shell | Runtime enforces replay window; shell hosts the relay bridge |
| `runtime.RING_BUFFER_SIZE` | runtime | Ring buffer is a runtime data structure |
| `shim.REQUEST_TIMEOUT_MS` | napplet | Shim runs inside the napplet iframe |
| `services.DEFAULT_EOSE_TIMEOUT_MS` | runtime, service | EOSE timeout used by coordinated relay service |
| `services.EOSE_FALLBACK_MS` | runtime, service | Fallback EOSE timeout in relay pool service |
| `services.DEFAULT_MAX_PER_WINDOW` | service, napplet | Max notifications per napplet window |
| `acl.DEFAULT_QUOTA` | acl, napplet | ACL enforces quota; napplet experiences quota limit |
| `demo.FLASH_DURATION` | (all, via "show all") | Affects flow animator -- visual for all nodes |
| `demo.FLASH_DURATION_MS` | (all, via "show all") | Affects Leader Line edge flash -- visual for all nodes |
| `demo.TOAST_DISPLAY_MS` | service | Toast is a notification service UX element |
| `demo.MAX_RECENT_REQUESTS` | service | Signer service request history |
| `demo.ROLLING_WINDOW_SIZE` | (all, via "show all") | Color mode applies to all edges |
| `demo.DECAY_DURATION_MS` | (all, via "show all") | Color mode decay applies globally |
| `demo.TRACE_HOP_DURATION_MS` | (all, via "show all") | Trace animation applies to all edges |
| `demo.ACL_RING_BUFFER_SIZE` | acl | ACL denial history buffer size |
| `demo.HEADER_HEIGHT` | shell | Sequence diagram header (shell-level UI) |
| `demo.ROW_HEIGHT` | shell | Sequence diagram row height (shell-level UI) |

### Kinds Tab (9 read-only protocol constants)

| Constant Key | Display | NIP Reference |
|-------------|---------|---------------|
| `core.AUTH_KIND` | 22242 | NIP-42 |
| `core.BusKind.REGISTRATION` | 29000 | Napplet protocol |
| `core.BusKind.SIGNER_REQUEST` | 29001 | Napplet protocol |
| `core.BusKind.SIGNER_RESPONSE` | 29002 | Napplet protocol |
| `core.BusKind.IPC_PEER` | 29003 | Napplet protocol |
| `core.BusKind.HOTKEY_FORWARD` | 29004 | Napplet protocol |
| `core.BusKind.METADATA` | 29005 | Napplet protocol |
| `core.BusKind.SERVICE_DISCOVERY` | 29010 | Napplet protocol |
| `runtime.SECRET_LENGTH` | 32 | HMAC-SHA256 key derivation |

**Note:** Demo-specific UI timing constants (`demo.FLASH_DURATION`, `demo.ROLLING_WINDOW_SIZE`, `demo.DECAY_DURATION_MS`, `demo.TRACE_HOP_DURATION_MS`) affect visualization for all node types. They should appear when "show all" is active but not when filtering for a specific role, since they are demo chrome rather than protocol-relevant per-node values.

---

## MVP Definition

### Ship in v0.11.0 (required)

- [ ] **Role-to-Constants mapping** -- Data structure mapping `TopologyNodeRole` to relevant `ConstantDef.key[]`. Pure data, no UI.
- [ ] **Contextual constants filtering** -- Constants tab shows only constants relevant to selected node's role. No node selected = show all.
- [ ] **"Show all" escape** -- Toggle/link to bypass contextual filter and see all constants.
- [ ] **Kinds tab** -- Third inspector tab showing the 9 read-only protocol kind values in a clean reference-card layout (monospace values, no sliders, no inputs).
- [ ] **Tab state persistence** -- Remove `_activeTab = 'node'` in `showInspector()`. Active tab stays stable across node selections.
- [ ] **Empty state** -- "no constants for [role]" with "show all" link when contextual filter produces zero results.

### Add After Validation (within v0.11.0 if time permits)

- [ ] **Filter badge count** -- "Constants (3)" in tab label. Low effort, genuine polish.
- [ ] **Kind NIP cross-references** -- "NIP-42" label next to AUTH_KIND. Static data, no logic.

### Future Consideration (post v0.11.0)

- [ ] **Kind cross-links from debugger** -- Clicking kind number in message log navigates to Kinds tab entry. Requires event bus plumbing.
- [ ] **Role-specific constant descriptions** -- Enhanced descriptions when filtering by role. Content authoring effort.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Role-to-Constants mapping | HIGH | LOW | P1 |
| Contextual constants filtering | HIGH | MEDIUM | P1 |
| Kinds tab separation | HIGH | LOW | P1 |
| Tab state persistence | HIGH | LOW | P1 |
| Editable vs read-only separation | HIGH | ZERO (achieved via tab split) | P1 |
| Empty state for filtered results | MEDIUM | LOW | P1 |
| "Show all" toggle | MEDIUM | LOW | P1 |
| Filter badge count | MEDIUM | LOW | P2 |
| Kind NIP references | LOW | LOW | P2 |
| Kind cross-links from debugger | LOW | MEDIUM | P3 |
| Role-specific descriptions | LOW | MEDIUM | P3 |

---

## Competitor Pattern Analysis

| Pattern | Chrome DevTools | Blender | React DevTools | Grafana Node Graph | This Demo |
|---------|----------------|---------|----------------|-------------------|-----------|
| Context-sensitive content | Styles/Computed tabs change content based on selected DOM element | Properties Editor tabs change based on active object type (Mesh vs Light vs Camera) | Component panel shows props/state/hooks for selected component | Context menu with detail fields on node click | Constants and Kinds tabs filter to selected topology node role |
| Editable vs read-only | Styles tab = editable inline; Computed tab = read-only with links to source | White fields = editable; grey fields = read-only/computed | Props editable; profiler state read-only | All fields read-only in detail popup | Constants tab = slider+input; Kinds tab = monospace read-only |
| Tab persistence on selection | Sub-tabs (Styles/Computed/etc.) stay active when clicking different elements | Properties Editor tab stays stable when clicking different objects | Component tab stays on Props/Hooks when clicking different components | N/A (popup, not persistent panel) | Must fix: currently resets to Node tab |
| Empty state | "Select an element in the page to inspect it" | Shows only tabs applicable to object type; never empty | "Select a component to inspect its props and state" | No node selected = no popup | "select a node to inspect" for Node tab; extend to Constants |
| Filter within tab | Filter box in Styles and Computed tabs | Search filter in Properties Editor | Search/filter in component tree | N/A | Existing search input, now combined with contextual role filter |
| Badge/count in tabs | "Issues (4)" badge on console, "3 changes" in Sources | Count badges on collection properties | Component count in tree | N/A | Add "Constants (3)" badge to tab label |

---

## Sources

- [Chrome DevTools Elements Panel](https://developer.chrome.com/docs/devtools/elements) -- Styles vs Computed tab separation, editable vs read-only patterns
- [Chrome DevTools CSS Reference](https://developer.chrome.com/docs/devtools/css/reference) -- Inline editing UX, filter-within-panel pattern
- [Chrome DevTools Performance Panel Navigation and Filtering](https://developer.chrome.com/blog/devtools-navigate-and-filter) -- Context-aware filtering improvements
- [Blender Properties Editor](https://docs.blender.org/manual/en/latest/editors/properties_editor.html) -- Context-sensitive tabs that change with selected object type, pin icon to lock
- [Grafana Node Graph Panel](https://grafana.com/docs/grafana/latest/visualizations/panels-visualizations/visualizations/node-graph/) -- Node selection detail display, `detail__` prefix for context menus
- [Cambridge Intelligence Graph UX](https://cambridge-intelligence.com/graph-visualization-ux-how-to-avoid-wrecking-your-graph-visualization/) -- Progressive disclosure, detail-on-demand
- [Nielsen Norman Group Empty States](https://www.nngroup.com/articles/empty-state-interface-design/) -- Guidelines for empty state design in complex applications
- [React DevTools Component Filters](https://react-devtools-tutorial.vercel.app/component-filters) -- Selection-based content filtering, props editing
- [Vue DevTools](https://devtools.vuejs.org/) -- Component hierarchy with selection-based detail panel
- [Kubernetes Dashboard](https://kubernetes.io/docs/tasks/access-application-cluster/web-ui-dashboard/) -- Resource detail views with tabs (Details, Events, YAML)
- [Nostr NIP-01 Protocol](https://github.com/nostr-protocol/nips/blob/master/01.md) -- Event kinds reference
- [Computed Tab in Chrome](https://www.geeksforgeeks.org/techtips/computed-tab-in-google-chrome-browser/) -- Read-only computed values vs editable styles separation

---
*Feature research for: v0.11.0 Side Panel Cleanup*
*Researched: 2026-04-04*
