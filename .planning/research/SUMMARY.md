# Project Research Summary

**Project:** v0.11.0 Side Panel Cleanup
**Domain:** Demo developer tool inspector panel — contextual filtering, tab reorganization, editable/read-only separation
**Researched:** 2026-04-04
**Confidence:** HIGH

## Executive Summary

The v0.11.0 milestone is a pure UI refactor within the demo application. It requires no new dependencies, no protocol changes, and no SDK package changes. The work is entirely contained in `apps/demo/src/` and `apps/demo/index.html`. Research confirms that all three goals — contextual constants filtering, Kinds tab separation, and editable/read-only split — are achievable by extending the existing data model (`ConstantDef`) and renderer architecture that is already in place. The recommended approach follows well-established patterns from Chrome DevTools, Blender, and React DevTools: context-sensitive tab content that changes with selection while keeping the tab bar stable.

The central design decision is to add an explicit `relevantRoles: TopologyNodeRole[]` field to each `ConstantDef`. This unlocks contextual filtering without ambiguity. Constants with `relevantRoles: []` are treated as "global" and always shown. Demo-specific UI timing constants fall into this global category. The editable/read-only separation is achieved as a side effect of tab splitting — a dedicated Kinds tab holds all 9 read-only protocol kind numbers, leaving the Constants tab as an all-editable surface. This is the same Styles/Computed split pattern that Chrome DevTools uses.

The main risks are implementation-order risks, not design risks. Three pre-existing fragilities will become worse with more tabs unless addressed proactively: (1) the 1500ms polling timer fires `updateInspectorPane()` even when a non-Node tab is active, destroying active input state; (2) event listeners accumulate if a DOM keep-alive optimization is added without event delegation; (3) the 280px inspector pane width is tight for 3 tab buttons. All three are understood and preventable by following the build order recommended in ARCHITECTURE.md and the mitigation strategies in PITFALLS.md.

## Key Findings

### Recommended Stack

No stack changes. The v0.11.0 scope is a demo UI refactor. TypeScript 5.9.3 strict mode will catch any missed `InspectorTab` union branches at compile time. UnoCSS 66.2.0 utility classes and existing CSS shortcuts cover new tab and kinds-row styling without any config changes. Playwright 1.58.2 supports `data-inspector-tab` attribute selectors used by existing tests; new tab tests follow the same pattern.

**Core technologies (all unchanged):**
- TypeScript 5.9.3: strict union type checking catches missed branches when `InspectorTab` is extended — compiler enforces completeness
- Vite 6.3.0: hot reload provides instant feedback on panel layout changes during development
- UnoCSS 66.2.0: existing `panel`, `btn`, `btn-primary` shortcuts cover new tab button states with no config changes
- Playwright 1.58.2: `[data-inspector-tab="kinds"]` selector works out of the box for new tab E2E tests

### Expected Features

The full feature inventory is 11 items ranked by priority. The MVP (P1) list is the minimum to ship v0.11.0. P2 items are low-effort polish that can be added if time permits within the milestone. P3 items are explicitly deferred.

**Must have (table stakes / P1):**
- Role-to-constants mapping (`relevantRoles` field on `ConstantDef`) — all contextual filtering depends on this data structure
- Contextual constants filtering — shows constants relevant to selected node's role, falls back to showing all when no node is selected
- "Show all" escape toggle — opt-out of contextual filter with a visible indicator showing the current filter state
- Kinds tab (third inspector tab) — 9 read-only protocol kind numbers in a clean reference-card layout with no sliders
- Tab state persistence — remove the `_activeTab = 'node'` reset in `showInspector()` so active tab stays stable across node selections
- Empty state — "no constants for [role]" message with "show all" link when contextual filter returns zero results

**Should have (polish / P2, add within v0.11.0 if time permits):**
- Filter badge count in tab labels — "Constants (3)" or "Kinds (8)" communicates filtered state without requiring a tab switch
- Kind NIP cross-references — static "NIP-42" label next to AUTH_KIND turns the Kinds tab into a protocol reference surface

**Defer (post-v0.11.0 / P3):**
- Kind cross-links from debugger — clicking a kind number in the message log navigates to the Kinds tab entry; requires event bus plumbing across two modules
- Role-specific constant descriptions — contextual description overrides per `(key, role)` pair; content authoring effort with maintenance burden

**Confirmed anti-features (do not build):**
- Inline editing of protocol kind values — kinds are compile-time baked into multiple packages; editing them in the UI silently breaks all message routing
- Drag-to-reorder tabs — unjustifiable complexity for 3 tabs
- Multi-node selection with merged constants — single-select plus "show all" covers the use case
- Collapsible accordion sections within tabs — 3-8 items per filtered tab makes collapsing overhead with no cognitive benefit

### Architecture Approach

The architecture extends the existing module graph without restructuring it. `demo-config.ts` gains the `relevantRoles` field on `ConstantDef` and three new query methods (`getEditableDefs()`, `getReadOnlyDefs()`, `getByRole()`). `node-inspector.ts` extends `InspectorTab` to include `'kinds'` and routes to a new `kinds-panel.ts` module. `constants-panel.ts` gains an optional `{ role?: TopologyNodeRole }` parameter that drives contextual filtering. The key architectural principle is "filtered rendering via context prop" — tab renderers are stateless functions that receive selection context and decide their own filtering logic; no view state is pushed into `DemoConfig`.

**Major components and changes:**

1. `demo-config.ts` (MODIFY) — Add `relevantRoles: TopologyNodeRole[]` to each of the 27 `ConstantDef` entries. Add `getEditableDefs()`, `getReadOnlyDefs()`, `getByRole(role)` methods. This is the data foundation; no downstream changes are possible without it.
2. `kinds-panel.ts` (NEW, ~60-80 lines) — Self-contained read-only renderer for protocol kind numbers. Imports `getReadOnlyDefs()` from `demo-config.ts`. No slider wiring, no event handlers beyond optional search. Isolated from the complexity of `constants-panel.ts`.
3. `node-inspector.ts` (MODIFY, medium scope) — Extend `InspectorTab` union, add third tab button to `renderTabBar()`, route 'kinds' tab to `renderKindsPanel()`, pass selected node's role to `renderConstantsPanel()`. Guard the 1500ms polling timer: only trigger full re-render when `_activeTab === 'node'`.
4. `constants-panel.ts` (MODIFY, small scope) — Accept optional `{ role?: TopologyNodeRole }` param in `renderConstantsPanel()`. Filter to `getEditableDefs()` only. Apply role filter when role is provided.
5. `index.html` (MODIFY, ~5 lines) — CSS for `.kinds-row` and `.kinds-value` — lighter styling than `.const-row`, no slider track or reset button.

**Recommended build order:** Data layer first → new Kinds panel module → tab system expansion → contextual filtering last. Each step is independently testable before the next depends on it.

### Critical Pitfalls

1. **Polling timer destroys active input state** — The 1500ms `updateInspectorPane()` timer fires regardless of active tab, replacing `innerHTML` and destroying slider/input focus mid-interaction. Guard: skip the full re-render when `_activeTab !== 'node'`. Only the Node tab shows live-updating data that requires the polling refresh.
2. **Contextual filter produces empty list with no node selected** — A naive role filter returns zero results when `_selectedNodeId` is null. The Constants tab must default to "show all" when no node is selected; contextual narrowing is a convenience when a node IS selected, not a gate to the feature.
3. **Ambiguous role mapping for cross-cutting constants** — `core.REPLAY_WINDOW_SECONDS` is in package 'core' but relevant to `runtime`. `demo.*` timing constants affect all nodes. Implicit `pkg`-to-role mapping produces wrong results. Explicit `relevantRoles: TopologyNodeRole[]` on each `ConstantDef` is the correct solution; `[]` means global/always-show.
4. **Tab overflow at 280px inspector width** — Two tabs fit the current pane comfortably; three is the maximum for 280px at the current font size and padding. "Node", "Const", "Kinds" are short enough. A fourth tab would require shorter labels, padding reduction, or horizontal scroll.
5. **Event listener accumulation if DOM keep-alive is added** — `wireConstantsPanelEvents()` assumes a fresh DOM each call. If tabs are kept in DOM for scroll-position preservation, listeners will accumulate on re-render. Use event delegation on the panel container rather than per-element `addEventListener` calls to prevent this.

## Implications for Roadmap

Based on the dependency graph established in ARCHITECTURE.md and the build order validated by PITFALLS.md, the work decomposes into 4 phases. All phases are within a single milestone (v0.11.0) and span roughly 145 lines of new or modified code plus approximately 55 lines of new tests.

### Phase 1: Data Layer
**Rationale:** Every downstream UI change depends on `ConstantDef` having `relevantRoles`. Building this first means all subsequent phases can be independently tested and the data model is locked before renderers depend on it. No UI changes in this phase; zero regression risk.
**Delivers:** `getEditableDefs()` returns 17 items, `getReadOnlyDefs()` returns 10, `getByRole('runtime')` returns the correct subset. Unit test coverage for all three methods.
**Addresses:** Role-to-constants mapping (P1 table stakes prerequisite)
**Avoids:** Pitfall 3 (ambiguous mapping) — by building an explicit auditable mapping before writing any filter logic

### Phase 2: Kinds Panel
**Rationale:** A self-contained new module with no modifications to existing files. Can be built and verified in isolation. Establishes the Kinds tab rendering before wiring it into the tab system.
**Delivers:** `renderKindsPanel()` function that produces correct HTML for all 9 read-only protocol kind constants. CSS for `.kinds-row` in `index.html`. Module ready to be imported by the tab system.
**Addresses:** Kinds tab separation (P1 table stakes), editable vs read-only visual separation (P1, achieved as side effect of the tab split)
**Avoids:** Pitfall 7 (kinds scope unclear) — scope is defined as "all Nostr event kind numbers the protocol directly references": BusKind.* (8) + AUTH_KIND (1) = 9 total

### Phase 3: Tab System Expansion
**Rationale:** Wires the new Kinds panel into the inspector. Extends `InspectorTab` union type, adds the third tab button, routes 'kinds' to `renderKindsPanel()`. This is the integration step that makes the new tab visible. The polling timer guard belongs in this phase because it becomes significantly worse with 3 tabs.
**Delivers:** Three-tab inspector (Node, Constants, Kinds) with correct routing. Polling timer guarded to skip re-renders on non-Node tabs. Tab state persistence fixed (the `_activeTab = 'node'` line removed from `showInspector()`).
**Addresses:** Tab state persistence (P1 table stakes), polling timer pre-existing fragility
**Avoids:** Pitfall 1 (input state destroyed by polling), Pitfall 4 (tab overflow — verify "Node"/"Const"/"Kinds" label widths fit 280px before shipping), Pitfall 9 (tab state reset on node re-selection)

### Phase 4: Contextual Filtering
**Rationale:** The most complex phase, built last so that the 3-tab system is already stable. This phase only changes what the Constants and Kinds tabs display based on node selection context. Tests must cover all 5 node roles.
**Delivers:** Contextual filtering with fallback-to-all, role indicator in tab labels or header, "show all" toggle, empty state message. Badge counts in tab labels (P2) and NIP cross-references in Kinds tab (P2) if time permits within the milestone.
**Addresses:** Contextual constants filtering (P1), "show all" toggle (P1), empty state (P1), filter badge count (P2), NIP references (P2)
**Avoids:** Pitfall 2 (empty list when no node selected — implement fallback-to-all first, filtering second), Pitfall 5 (grouping state shared across tabs — decide per-tab defaults before implementing)

### Phase Ordering Rationale

- Data before rendering: `relevantRoles` must exist on `ConstantDef` before any filtering logic can be written or tested. Building renderers before the data model is ready means the filter logic must be patched immediately after.
- New module before wiring: `kinds-panel.ts` is a leaf node in the dependency graph. Building it first means the integration step (Phase 3) is only wiring — not simultaneous building and wiring.
- Tab structure before filtering: The tab routing must work correctly for all three tabs before adding context-dependent content changes. Otherwise filtering bugs and routing bugs are entangled during debugging.
- Polling timer guard moved to Phase 3: It becomes significantly worse with 3 tabs. If deferred to Phase 4, that entire phase is developed with the bug active, creating misleading test failures.

### Research Flags

All four phases follow standard, well-documented patterns directly grounded in the codebase. No phases require `/gsd:research-phase`.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Data Layer):** Straightforward TypeScript interface extension and method additions. Patterns are fully established within the existing codebase.
- **Phase 2 (Kinds Panel):** New module following the exact same rendering pattern as the existing `constants-panel.ts`. No novel patterns required.
- **Phase 3 (Tab System):** Extending a union type and a tab router is a well-understood refactor. The polling timer guard is a one-line conditional.
- **Phase 4 (Contextual Filtering):** The filtering logic is specified in full detail in ARCHITECTURE.md with explicit TypeScript code examples. No further research needed before implementation.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All findings derived from direct codebase inspection of first-party source files. No external dependencies involved. |
| Features | HIGH | Patterns benchmarked against Chrome DevTools, Blender, and React DevTools — well-documented domains with established UX precedent. Feature count is small and well-scoped. |
| Architecture | HIGH | All component boundaries, data flow, and integration points verified against actual source code with line-number citations. Build order validated against dependency graph. |
| Pitfalls | HIGH | All pitfalls grounded in actual source analysis. Three pitfalls (polling timer, listener accumulation, tab overflow) are observable in the current codebase today. |

**Overall confidence:** HIGH

### Gaps to Address

- **`shim.REQUEST_TIMEOUT_MS` categorization:** This constant has `editable: false` but `domain: 'timeouts'` (not 'protocol'). It is read-only because the shim runs inside the iframe and cannot be changed from the shell side. In Phase 1, decide whether it belongs in the Kinds tab alongside BusKind values or as a "read-only tunable" in the Constants tab with static-value styling. ARCHITECTURE.md recommends displaying it in the Constants tab as a read-only entry, not in the Kinds tab.
- **Demo global constants in contextual filter:** `demo.FLASH_DURATION`, `demo.ROLLING_WINDOW_SIZE`, `demo.DECAY_DURATION_MS`, `demo.TRACE_HOP_DURATION_MS`, `demo.HEADER_HEIGHT`, and `demo.ROW_HEIGHT` have `relevantRoles: []` (global). This means selecting any node will still show these 6 demo constants. Validate during Phase 4 that the filtered view for a specific role such as 'napplet' is meaningfully reduced from 17 to feel contextual — if most constants survive the filter, the feature is less useful than expected.
- **DESTRUCTIVE_KINDS in Kinds tab:** PITFALLS.md notes that `DESTRUCTIVE_KINDS` (0, 3, 5, 10002) are protocol-relevant but not currently in `CONSTANT_DEFS`. The Kinds tab scope in FEATURES.md does not include them (the 9-entry count matches only BusKind.* and AUTH_KIND). Confirm scope in Phase 1 before adding `relevantRoles` annotations — adding DESTRUCTIVE_KINDS later would require a data model update and additional test coverage.

## Sources

### Primary (HIGH confidence — direct codebase inspection)
- `apps/demo/src/node-inspector.ts` — tab system, inspector lifecycle, polling timer, `InspectorTab` type
- `apps/demo/src/constants-panel.ts` — current panel renderer, `_groupingMode`, `_searchQuery`, `wireConstantsPanelEvents()`
- `apps/demo/src/demo-config.ts` — `ConstantDef` model with `pkg`, `domain`, `editable` fields; 27 total constants (17 editable, 10 read-only)
- `apps/demo/src/topology.ts` — `TopologyNodeRole` type (5 roles: napplet, shell, acl, runtime, service)
- `apps/demo/src/node-details.ts` — role-specific detail builders, data-only module
- `apps/demo/src/main.ts` — initialization and wiring flow, `openConstantsTab()` entry point
- `apps/demo/index.html` — layout, CSS, UnoCSS theme

### Secondary (MEDIUM confidence — established UI/UX patterns)
- [Chrome DevTools Elements Panel](https://developer.chrome.com/docs/devtools/elements) — Styles/Computed tab separation, editable vs read-only, tab persistence on selection change
- [Blender Properties Editor](https://docs.blender.org/manual/en/latest/editors/properties_editor.html) — Context-sensitive tabs by object type, pin/lock icon to bypass context filtering
- [React DevTools Component Filters](https://react-devtools-tutorial.vercel.app/component-filters) — Selection-based content filtering
- [Nielsen Norman Group Empty States](https://www.nngroup.com/articles/empty-state-interface-design/) — Empty state design guidelines for complex applications

---
*Research completed: 2026-04-04*
*Ready for roadmap: yes*
