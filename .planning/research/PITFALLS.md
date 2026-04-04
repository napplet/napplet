# Domain Pitfalls: Side Panel Cleanup

**Domain:** Contextual filtering, tab reorganization, and editable/read-only separation in an existing developer tool panel
**Researched:** 2026-04-04
**Overall confidence:** HIGH (findings grounded in actual codebase analysis of demo source files)

---

## Critical Pitfalls

Mistakes that cause regressions, data loss, or require rework.

### Pitfall 1: innerHTML Re-render Destroys Active Input State

**What goes wrong:** The constants panel uses `innerHTML` assignment to re-render the entire panel on every change (search input, grouping toggle, tab switch). When `updateInspectorPane()` fires, any active `<input>` element (number input, slider, search box) is destroyed and recreated. The browser loses focus, cursor position, and any partially-typed value.

**Why it happens:** `node-inspector.ts` line 271 does `pane.innerHTML = ...` on every tab switch and re-render. The constants panel already has a workaround for search focus (lines 244-248 in `constants-panel.ts` restore focus after re-render), but this is fragile and does not cover number inputs mid-edit or slider drag state.

**Consequences:**
- User drags a slider, the 1500ms polling timer fires `updateInspectorPane()`, slider snaps back and focus is lost
- User types a multi-digit number in an input, polling re-render wipes partial input
- Adding more tabs multiplies the re-render surface where this can happen

**Prevention:**
- Do NOT re-render the constants panel tab content when the inspector polls for node state updates. The polling timer (line 410-412 in `node-inspector.ts`) calls `updateInspectorPane()` every 1500ms but should skip if the constants tab (or any new tab like Kinds or Editable) is active and has not changed.
- Use surgical DOM updates for the constants panel content instead of full innerHTML replacement. Update only the values that changed (e.g., sync `currentValue` into existing input elements) rather than rebuilding the entire HTML tree.
- Guard: if `_activeTab !== 'node'`, the polling timer should not trigger a full re-render. Only the Node tab shows live-updating data.

**Detection:** Open inspector, go to constants tab, start editing a slider. If it resets every 1.5 seconds, this pitfall has been hit.

### Pitfall 2: Contextual Filter Hides All Constants When No Node Selected

**What goes wrong:** If contextual filtering is implemented as "show only constants relevant to the selected node," then when no node is selected (common state -- user opens constants tab directly via `openConstantsTab()`), the filter produces an empty list. The panel appears broken.

**Why it happens:** The current constants tab is always accessible even without a selected node (line 266 in `node-inspector.ts` explicitly states this). The `_selectedNodeId` can be `null`. A naive contextual filter that maps `ConstantDef.pkg` to the selected node's role would return zero results for `null`.

**Consequences:**
- Constants tab shows "no matching constants" whenever user hasn't clicked a node
- The current behavior (show everything) silently regresses to showing nothing
- User who discovered constants via the tab bar (not via node selection) loses access to the panel's primary function

**Prevention:**
- Contextual filtering must have a fallback: when no node is selected, show ALL constants (current behavior). Only filter when a node IS selected.
- Make the filter opt-in, not opt-out: show a visible "filtering by: [node name]" indicator with a clear button so users understand why some constants disappeared.
- The "all constants" view should remain the default landing state for the tab. Contextual narrowing should feel like a convenience, not a gate.

**Detection:** Open inspector via constants tab button (no node selected). If the list is empty, this pitfall has been hit.

### Pitfall 3: Node-to-Constant Mapping Is Ambiguous for Cross-Cutting Constants

**What goes wrong:** Some constants don't map cleanly to a single topology node. The constant `core.REPLAY_WINDOW_SECONDS` is defined in `@napplet/core` (pkg: 'core'), used by the runtime for replay detection, but affects every napplet. Which node should it appear under? If the mapping is wrong, users can't find constants they're looking for.

**Why it happens:** The current `ConstantDef` has `pkg` and `domain` fields but no `relevantNodes` or `relevantRoles` field. The demo topology has 5 node roles: `napplet`, `shell`, `acl`, `runtime`, `service`. Many constants span multiple roles:

| Constant | pkg | Actually relevant to |
|----------|-----|---------------------|
| `core.REPLAY_WINDOW_SECONDS` | core | runtime, acl, all napplets |
| `acl.DEFAULT_QUOTA` | acl | acl node, all napplets |
| `demo.FLASH_DURATION_MS` | demo | all edges/nodes (UI-only) |
| `services.DEFAULT_MAX_PER_WINDOW` | services | notification service node, napplets |
| `shim.REQUEST_TIMEOUT_MS` | shim | napplet nodes only |
| `core.BusKind.*` (8 read-only) | core | runtime, shell, all napplets |

**Consequences:**
- If mapping is 1:1 (one constant -> one node), cross-cutting constants are arbitrarily assigned and confusing
- If mapping is 1:N (one constant -> many nodes), the "contextual" filter barely reduces the list for shell/runtime nodes
- If mapping is missing for some constants, they silently disappear from the filtered view

**Prevention:**
- Add a `relevantRoles: TopologyNodeRole[]` field to `ConstantDef` (or a parallel mapping object). Each constant explicitly declares which node roles it's relevant to.
- For constants relevant to 3+ roles, treat them as "global" and always show them (or show them in a separate "shared" group within the filtered view).
- Demo-specific UI timing constants (`demo.*`) should be visible regardless of selection since they affect the visual chrome, not a specific protocol node.
- Validate: after implementing the mapping, check that selecting EVERY node type shows at least some constants. An empty filtered view for any node type means the mapping is incomplete.

**Detection:** Select each of the 5+ node types in the topology. If any shows zero constants in the filtered view, the mapping needs fixing.

### Pitfall 4: Tab Proliferation Breaks the 280px Inspector Width

**What goes wrong:** The inspector pane is 280px wide (set in CSS: `#flow-area-inner.inspector-open #inspector-pane { width: 280px; }`). Currently there are 2 tabs ("Node" and "Constants"). Adding "Kinds" and "Editable" tabs (or splitting Constants into "Constants" + "Kinds" + "Editable") puts 4-5 tab labels in a 280px-wide tab bar. The tab labels overflow, wrap, or become unreadable.

**Why it happens:** The tab bar (`renderTabBar()` in `node-inspector.ts`) uses `display:flex` with no overflow handling. Each tab button has `padding:8px 14px` and uppercase text at `10px` with `0.15em` letter-spacing. With 4+ tabs, horizontal space runs out.

**Consequences:**
- Tab labels wrap to a second line, pushing content down and making the tab bar look broken
- Tab labels truncate mid-word without an ellipsis
- On 768px screens (mobile breakpoint), the inspector is already squeezed to 220px, making this worse
- The tab bar takes up a disproportionate fraction of the vertical space

**Prevention:**
- Measure first: 280px at 10px font with 28px padding per tab supports roughly 3 tabs comfortably (Node, Constants, Kinds). A 4th requires reducing padding or shortening labels.
- Use shorter tab labels: "Node", "Const", "Kinds", "Edit" (or icons with tooltips).
- Consider whether "Editable" and "Constants" should be sub-sections within a single tab rather than separate tabs. The milestone description says "read-only values displayed as Constants, editable values in a separate tab" but the implementation could be two sections within one scrollable view rather than separate tabs.
- If 4+ tabs are required, add `overflow-x: auto; white-space: nowrap` to the tab bar and scroll indicators.

**Detection:** Render the tab bar with all planned tabs. If any label wraps or the total width exceeds 280px, this pitfall applies.

---

## Moderate Pitfalls

Issues that cause confusion, friction, or require patches but not rewrites.

### Pitfall 5: Editable vs Read-Only Split Orphans the Grouping Controls

**What goes wrong:** The constants panel currently has grouping toggles ("package", "domain", "flat") and a search input. If editable constants move to one tab and read-only constants move to another, should both tabs have grouping toggles? If yes, do they share state? If no, users lose the ability to group read-only protocol constants by package (currently the most useful view for read-only kinds like `BusKind.*`).

**Why it happens:** The `_groupingMode` and `_searchQuery` are module-level singletons in `constants-panel.ts` (lines 14-15). They were designed for a single unified view. Splitting into two views means either duplicating this state or sharing it (which creates the confusion of toggling grouping in one tab and having it affect the other).

**Consequences:**
- If grouping state is shared: user sets grouping to "domain" in the constants tab, switches to editable tab, sees "domain" grouping there too (unexpected)
- If grouping state is per-tab: user must re-configure grouping every time they switch tabs
- If one tab drops grouping controls entirely: loss of a useful feature

**Prevention:**
- Keep grouping state per-tab with independent `_groupingMode` for each. Default read-only to "package" (best for protocol constants) and editable to "domain" (best for tuning related values).
- Search should filter across whichever tab is active. The search state can be shared since users expect global search behavior.
- If the Kinds tab is implemented as a separate view, it has a natural grouping: by kind number range. Don't force the same grouping modes on it.

### Pitfall 6: Tab Switch Resets Scroll Position

**What goes wrong:** Switching between tabs destroys and recreates the tab content via `innerHTML`. If the user scrolled deep into the constants list, switches to the Node tab briefly to check a value, and switches back, they lose their scroll position.

**Why it happens:** The current implementation rebuilds the entire panel HTML on every tab switch. There's no scroll position memory per tab.

**Consequences:**
- Frustrating UX when the constants list is long (23 items currently, will grow with Kinds separation)
- Users avoid switching tabs because they don't want to lose their place
- Particularly annoying with contextual filtering where the list is shorter but the scroll position into a specific group matters

**Prevention:**
- Cache scroll position per tab before switching. On return, restore `scrollTop` on the scrollable container (`flex:1;overflow-y:auto` div).
- Alternative: keep all tab content panels in the DOM simultaneously, toggle visibility with `display:none`. This eliminates scroll position loss, preserves input state, and avoids re-render overhead. The tradeoff is slightly more DOM elements, which is negligible for this UI.

### Pitfall 7: Kinds Tab Content Scope Is Unclear

**What goes wrong:** "Kinds" as a concept in Nostr is broad: NIP event kinds (0, 1, 3, 5, ...), BusKind protocol kinds (29000-29010), destructive kinds (0, 3, 5, 10002). Which kinds go in the Kinds tab? If it's only the `BusKind.*` constants, users expect to also see destructive kinds. If it's all of them, some overlap with the read-only constants tab.

**Why it happens:** The current constants panel already contains all 8 `BusKind.*` entries as read-only protocol constants in the "protocol" domain group. The `DESTRUCTIVE_KINDS` set (0, 3, 5, 10002) is defined in `@napplet/core` but NOT currently exposed in the constants panel at all. There's also `AUTH_KIND` (22242). The Kinds tab needs a clear scope.

**Consequences:**
- If Kinds tab only shows BusKind values: underwhelming, just 8 numbers
- If Kinds tab shows all event kinds the protocol cares about: need to add DESTRUCTIVE_KINDS and AUTH_KIND to `CONSTANT_DEFS` (currently missing)
- If items appear in both Kinds tab and Constants tab: user confusion about where to look

**Prevention:**
- Define Kinds tab as: ALL Nostr event kind numbers the protocol references, with context. This means BusKind.* (8), AUTH_KIND (1), DESTRUCTIVE_KINDS (4) = 13 items. Each gets a description explaining when the protocol uses it.
- Remove these kind-number entries from the read-only Constants tab to avoid duplication.
- In the Kinds tab, group by purpose: "bus protocol kinds (29000-29010)", "auth kinds (22242)", "consent-required kinds (0, 3, 5, 10002)".
- Add DESTRUCTIVE_KINDS to `CONSTANT_DEFS` before or during this work. They're missing from the panel today.

### Pitfall 8: Constants Panel Event Handlers Accumulate on Re-render

**What goes wrong:** `wireConstantsPanelEvents()` attaches `input`, `click`, and other event listeners to DOM elements using `querySelectorAll` + `addEventListener`. Every call to `updateInspectorPane()` rebuilds the HTML and calls `wireConstantsPanelEvents()` again. The old DOM elements are garbage collected (since innerHTML replaced them), so their listeners are cleaned up. But if future changes keep DOM elements alive across re-renders (e.g., via the "keep all tabs in DOM" optimization from Pitfall 6), listeners will accumulate.

**Why it happens:** The wiring function doesn't check for existing listeners or use event delegation. It assumes a fresh DOM every time.

**Consequences:**
- If the "keep tabs in DOM" optimization is applied without updating event wiring: each re-render adds duplicate listeners
- Slider input fires handler N times after N re-renders
- Config values jump erratically, flash animation fires multiple times

**Prevention:**
- Use event delegation: attach a single `input`/`click` listener on the panel container that checks `event.target.dataset` to dispatch. This is safe regardless of how many times the content is rebuilt.
- Alternatively, use `AbortController` to cancel all previous listeners before re-wiring.
- The `wireTabHandlers()` function in `node-inspector.ts` has the same pattern and same risk. Any fix should cover both.

---

## Minor Pitfalls

Issues that cause small friction but are easy to fix once noticed.

### Pitfall 9: Active Tab State Does Not Persist Across Inspector Close/Open

**What goes wrong:** When the user closes the inspector (`hideInspector()`), `_selectedNodeId` is set to null but `_activeTab` retains its value. When the user clicks a different node, `showInspector()` forces `_activeTab = 'node'` (line 334). If the user was on the Constants tab (or any new tab), closing and reopening always resets to the Node tab.

**Why it happens:** `showInspector()` hardcodes `_activeTab = 'node'` because it's triggered by clicking a topology node, where showing the node details is the expected behavior.

**Consequences:**
- Minor friction: user who prefers the Constants/Kinds tab must re-click the tab every time they select a new node
- More significant with 3-4 tabs: the "wrong tab" experience happens more often

**Prevention:**
- When the user clicks a node, switch to Node tab (current behavior is correct for this case).
- When the user switches tabs manually, remember their preference. If they were on Constants tab and close/reopen via the Constants button, restore to Constants tab (this already works for `openConstantsTab()`).
- Consider: after a node click opens the Node tab, a subsequent click on the SAME node could toggle back to the previously active tab. This gives power users quick access.

### Pitfall 10: ConstantDef.editable Field Cannot Express "Editable in Some Contexts"

**What goes wrong:** The `editable` boolean on `ConstantDef` is a hard property. Some constants are editable in the demo context (e.g., `demo.FLASH_DURATION_MS`) but are not truly "protocol editable" -- they're demo-specific UI tuning knobs. The editable/read-only split might want to distinguish between "protocol constants you can't change" (BusKind values) and "demo parameters you shouldn't change in production but can tweak here."

**Why it happens:** The `editable` field was designed for the single constants panel where "can you edit it here?" was the only question. With a dedicated Editable tab, the semantics shift to "is this a tuning parameter?" which is a different question.

**Consequences:**
- The Editable tab might contain ONLY demo-specific UI timing values, since protocol constants like `REPLAY_WINDOW_SECONDS` are technically editable but feel out of place next to `TOAST_DISPLAY_MS`
- Users may not realize that the "editable" tab is the place to find timeout values that affect protocol behavior

**Prevention:**
- Consider renaming the Editable tab to "Tuning" or "Parameters" to signal intent.
- Add a `category` field to `ConstantDef`: `'protocol-tunable'` vs `'ui-tunable'` vs `'protocol-fixed'` (currently these map to: editable+non-demo, editable+demo, non-editable).
- In the Editable/Tuning tab, show protocol-tunable values (replay window, buffer sizes, quotas) in a separate group from UI-tunable values (flash durations, toast display time).

### Pitfall 11: No Visual Indicator of Which Tab Has Relevant Changes

**What goes wrong:** With 3-4 tabs, the user can't tell at a glance which tab has content worth looking at. The current modified-dot indicator (blue dot on individual constants) is only visible inside the Constants tab content. If a value is modified while the user is on the Node tab, there's no tab-level badge or indicator.

**Why it happens:** The tab bar is static HTML with no reactive state binding. Modified-value tracking is inside `demoConfig` but nothing reflects it onto the tab label.

**Consequences:**
- User forgets they modified a value and doesn't know to check the Editable tab
- After a "Reset All," the tab still looks the same (no feedback at tab level)

**Prevention:**
- Add a dot/badge on the "Editable" (or "Constants") tab label when `demoConfig.getModifiedKeys().length > 0`. This is a small visual cue that's cheap to implement.
- On the Node tab, consider showing a badge when the selected node has recent activity or ACL denials.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Contextual filtering of constants by selected node | Pitfall 2 (empty list), Pitfall 3 (ambiguous mapping) | Implement fallback-to-all behavior first. Build explicit role-to-constant mapping. Test all 5 node roles. |
| Kinds tab separation | Pitfall 7 (scope unclear), Pitfall 4 (tab overflow) | Define scope as "all event kind numbers" including DESTRUCTIVE_KINDS. Add missing kinds to CONSTANT_DEFS. Measure tab bar width. |
| Editable vs read-only split | Pitfall 5 (orphaned grouping), Pitfall 10 (editable semantics) | Decide on sub-sections vs separate tabs BEFORE implementing. Add `category` field for finer-grained grouping. |
| Tab bar expansion (3+ tabs) | Pitfall 4 (width overflow), Pitfall 6 (scroll position lost), Pitfall 9 (tab state reset) | Use shorter labels. Cache scroll position or keep tabs in DOM. Respect user's tab preference on node re-selection. |
| Re-render architecture | Pitfall 1 (input state destroyed), Pitfall 8 (listener accumulation) | Guard polling timer against non-Node tabs. Use event delegation. Consider visibility toggling over innerHTML replacement. |

---

## Integration Risk Summary

The demo's side panel currently works because it has exactly 2 tabs and a simple re-render model. The planned changes (contextual filtering, Kinds separation, editable split) interact with each other through several shared mechanisms:

1. **Module-level state** (`_groupingMode`, `_searchQuery`, `_activeTab`, `_selectedNodeId`) -- all singletons that now must serve 3-4 contexts
2. **The polling timer** -- designed for live Node tab updates but runs regardless of active tab, causing Pitfall 1
3. **The `ConstantDef` schema** -- must grow to support node-role mapping and category tagging, affecting all render paths
4. **The tab bar layout** -- designed for 2 tabs in 280px, must accommodate 3-4 without overflow

The safest implementation order is:
1. Fix the polling timer guard (Pitfall 1 -- this is a latent bug even today)
2. Add `relevantRoles` to `ConstantDef` and build the mapping (Pitfall 3)
3. Separate Kinds into their own tab (Pitfall 7, define scope clearly)
4. Implement contextual filtering with fallback (Pitfall 2)
5. Split editable/read-only as last step (Pitfall 5, 10)

This order ensures each step builds on the previous one and the hardest design decision (what goes in which tab) is made explicitly before code is written.

## Sources

- Codebase analysis: `apps/demo/src/constants-panel.ts`, `node-inspector.ts`, `node-details.ts`, `demo-config.ts`, `topology.ts`, `acl-panel.ts`, `main.ts`, `index.html`
- [Microsoft Support: innerHTML replaces DIVs containing INPUT fields](https://support.microsoft.com/en-us/topic/webpage-loses-focus-when-innerhtml-replaces-divs-containing-input-fields-2eeee6e6-40fc-02ef-f822-a37648198317)
- [Chrome DevTools: Tab Reordering](https://developer.chrome.com/blog/devtools-digest-reordering-tabs-2)
- [Pencil & Paper: Filter UX Design Patterns](https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-filtering)
- [LogRocket: Filtering UX/UI Design Patterns](https://blog.logrocket.com/ux-design/filtering-ux-ui-design-patterns-best-practices/)
- [Chrome DevTools: Breakpoints Sidebar UX Redesign](https://developer.chrome.com/blog/breakpoint-ux-redesign)
