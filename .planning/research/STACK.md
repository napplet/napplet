# Stack Research

**Domain:** Demo side panel reorganization (contextual filtering, tab separation, editable/read-only split)
**Researched:** 2026-04-04
**Confidence:** HIGH

## Verdict: No New Dependencies

The v0.11.0 side panel cleanup requires **zero new libraries, zero version changes, and zero new dev dependencies.** Every feature is achievable with the existing stack by restructuring the demo's own TypeScript modules and CSS.

This is a pure refactoring milestone. The data model (`ConstantDef` with `pkg`, `domain`, `editable` fields), the tab system (`InspectorTab` union type in `node-inspector.ts`), and the rendering pipeline (`renderConstantsPanel` -> `wireConstantsPanelEvents`) already contain all the primitives needed.

## Recommended Stack

### Core Technologies (Unchanged)

| Technology | Version | Purpose | Why No Change |
|------------|---------|---------|---------------|
| TypeScript | 5.9.3 | Demo source | Already used; strict mode catches tab-type union changes at compile time |
| Vite | 6.3.0 | Dev server + build | Hot reload gives instant feedback on panel layout changes |
| UnoCSS | 66.2.0 | Utility classes + theme | Existing shortcuts (`panel`, `btn`, `btn-primary`) cover new tab styling needs |

### Supporting Libraries (Unchanged)

| Library | Version | Purpose | Relevant to v0.11.0? |
|---------|---------|---------|----------------------|
| leader-line | 1.0.7 | Topology edges | No -- side panel only |
| nostr-tools | 2.23.3 | Protocol types | No -- panel is UI-only |
| qrcode | 1.5.4 | Signer modal | No -- side panel only |

### Development Tools (Unchanged)

| Tool | Purpose | Notes |
|------|---------|-------|
| Playwright | 1.58.2 | E2e tests for panel behavior | Existing `demo-node-inspector.spec.ts` covers inspector; extend for new tabs |
| Vitest | 4.1.2 | Unit tests | Existing `demo-config-model.test.ts` covers DemoConfig; extend for node-filtering |

## What Changes (Code, Not Stack)

### 1. Contextual Constants Filtering by Selected Node

**Current state:** `ConstantDef` already has a `pkg` field (`'core'`, `'runtime'`, `'shim'`, `'services'`, `'acl'`, `'demo'`). The `DemoConfig` class already has `getByPackage()` and `getByDomain()` grouping methods.

**What's needed:** A mapping from `TopologyNodeRole` (5 roles: `napplet`, `shell`, `acl`, `runtime`, `service`) to relevant `pkg` values. This is a pure data mapping -- no library needed.

| Node Role | Relevant Packages | Rationale |
|-----------|-------------------|-----------|
| `shell` | `core`, `runtime`, `demo` | Shell wraps runtime; sees all protocol constants and demo timing |
| `runtime` | `core`, `runtime` | Runtime engine constants only |
| `acl` | `acl`, `core` | ACL quota + protocol kinds it gates |
| `napplet` | `shim`, `core` | Shim request timeout + auth/bus kinds the napplet speaks |
| `service` | `services`, `core` | Service-specific timeouts + discovery kind |

**Implementation approach:** Add a `getByNodeRole(role: TopologyNodeRole): ConstantDef[]` method to `DemoConfig` (or a standalone function in `constants-panel.ts`). Filter `getAllDefs()` using the mapping above. When no node is selected, show all constants (current behavior).

### 2. Kinds Tab Separation

**Current state:** The `InspectorTab` type is `'node' | 'constants'`. Tab rendering is in `renderTabBar()`. Read-only protocol kinds (domain `'protocol'`, `editable: false`) are mixed with editable behavioral constants in the same "Constants" tab.

**What's needed:** Extend `InspectorTab` to `'node' | 'constants' | 'kinds'`. The `'kinds'` tab shows only `domain === 'protocol'` entries (the 9 read-only BusKind/AUTH_KIND/SECRET_LENGTH values). The `'constants'` tab shows only `editable === true` entries.

**No library needed.** The `domain` and `editable` fields on `ConstantDef` already discriminate these two sets perfectly.

### 3. Editable vs Read-Only Value Split

**Current state:** `renderConstantRow()` already branches on `def.editable` -- non-editable rows render as static text (no slider/input), editable rows render with number input + range slider + reset button.

**What's needed:** This is solved by feature #2 above. Once Kinds get their own tab, the Constants tab only contains editable values. The visual distinction already exists in the render code. No additional library or styling framework needed.

## Installation

```bash
# No changes needed. Existing install is sufficient:
pnpm install
```

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| Extend `InspectorTab` union type | Use a sub-tab or accordion within Constants tab | Separate tabs are cleaner UX; the union type pattern is already proven; sub-tabs would add nesting complexity for 3 clear categories |
| Node-role-to-package mapping in demo code | Add `relevantRoles` field to `ConstantDef` | The mapping is a demo-only concern; polluting the data model with UI routing belongs in the panel renderer, not the config registry |
| Static mapping object `Record<TopologyNodeRole, string[]>` | Dynamic tagging system | 5 roles, 6 packages -- a simple lookup object is more maintainable than infrastructure for a 30-entry dataset |
| Keep `DemoConfig` class as-is, add filtering in panel | Add filter methods to `DemoConfig` | Filtering by node role is presentation logic; `DemoConfig` should stay focused on get/set/subscribe. Put the filter in `constants-panel.ts` |

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Tab UI library (e.g., headless-ui, radix-ui) | The demo is zero-framework by design constraint; adding a UI library for 3 tabs is unjustifiable overhead | Extend the existing `renderTabBar()` pattern -- it's 20 lines of HTML string template |
| State management library | The tab state is 2 module-level variables (`_activeTab`, `_selectedNodeId`); no store needed | Keep module-level state pattern consistent with all other demo modules |
| CSS-in-JS or styled-components | Demo uses UnoCSS utilities + `<style>` in index.html; mixing paradigms hurts consistency | Add new tab classes to existing `<style>` block in index.html |
| Virtual scrolling library | 26 constants total across 3 tabs; even "all" view fits without scrolling | `overflow-y: auto` on the tab content div is sufficient |
| Search/filter library (fuse.js, etc.) | The existing `matchesSearch()` function does substring matching on 3 fields; 26 items don't need fuzzy matching | Keep the existing 5-line filter function |

## Stack Patterns by Feature

**Contextual filtering when node is selected:**
- Read `_selectedNodeId` from `node-inspector.ts` module state
- Look up node role from topology
- Pass role to `constants-panel.ts` render function
- Filter defs by role-to-package mapping
- Show "showing constants for: [node label]" indicator + "show all" button

**Tab separation (3 tabs instead of 2):**
- Extend `InspectorTab` type: `'node' | 'constants' | 'kinds'`
- `renderTabBar()` adds third button
- `updateInspectorPane()` adds third branch for `_activeTab === 'kinds'`
- Create `renderKindsPanel()` in constants-panel.ts (reuses `renderConstantRow` for non-editable rows)
- Kinds panel is read-only -- no `wireConstantsPanelEvents` needed for it

**Editable/read-only split:**
- Constants tab: `getAllDefs().filter(d => d.editable)` -- shows sliders, inputs, reset
- Kinds tab: `getAllDefs().filter(d => d.domain === 'protocol')` -- shows static values only
- Both tabs support search filtering (reuse `matchesSearch`)
- Both tabs support grouping modes (reuse `getGroupedDefs` with pre-filtered set)

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| TypeScript 5.9.3 | All existing code | Union type extension is a safe refactor; `tsc --strict` catches any missed branches |
| UnoCSS 66.2.0 | Vite 6.3.0 | No changes to UnoCSS config needed; existing theme colors and shortcuts cover new tab states |
| Playwright 1.58.2 | New tab selectors | Tab buttons use `data-inspector-tab` attribute; Playwright locator `[data-inspector-tab="kinds"]` works out of the box |

## Files That Change (Not Stack, But Useful for Roadmap)

| File | Change Type | Scope |
|------|-------------|-------|
| `apps/demo/src/node-inspector.ts` | Extend `InspectorTab`, add `'kinds'` branch, pass node role to constants panel | ~30 lines added |
| `apps/demo/src/constants-panel.ts` | Add `renderKindsPanel()`, add node-role filtering, accept optional role param in `renderConstantsPanel()` | ~60 lines added |
| `apps/demo/src/demo-config.ts` | Possibly add `getByEditable()` convenience method (optional -- filtering can live in panel) | ~10 lines |
| `apps/demo/index.html` | Add CSS for kinds tab styling (if different from constants tab) | ~5 lines |
| `tests/e2e/demo-node-inspector.spec.ts` | Add tests for 3-tab behavior, contextual filtering | ~40 lines |
| `tests/unit/demo-config-model.test.ts` | Add tests for filtering by editability | ~15 lines |

## Sources

- Direct codebase inspection (HIGH confidence -- these are first-party source files)
  - `apps/demo/src/constants-panel.ts` -- current panel renderer with search, grouping, edit/reset
  - `apps/demo/src/node-inspector.ts` -- current 2-tab system (`InspectorTab = 'node' | 'constants'`)
  - `apps/demo/src/demo-config.ts` -- `ConstantDef` model with `pkg`, `domain`, `editable` fields; 26 total constants (17 editable, 9 read-only protocol kinds)
  - `apps/demo/src/topology.ts` -- `TopologyNodeRole` type: 5 roles (`napplet`, `shell`, `acl`, `runtime`, `service`)
  - `apps/demo/src/node-details.ts` -- node detail adapter with role-specific builders
  - `apps/demo/package.json` -- current dependency versions confirmed
  - `apps/demo/uno.config.ts` -- UnoCSS theme and shortcut configuration
  - `apps/demo/index.html` -- existing CSS classes for constants panel and inspector tabs

---
*Stack research for: v0.11.0 Side Panel Cleanup*
*Researched: 2026-04-04*
