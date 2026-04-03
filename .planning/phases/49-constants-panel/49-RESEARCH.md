# Phase 49: Constants Panel — Research

**Researched:** 2026-04-03
**Researcher:** Claude (autonomous)

## Objective

Determine what is needed to plan a Constants Panel that exposes and allows runtime editing of all protocol magic numbers in the demo UI.

## 1. Constants Inventory

All constants identified across the codebase, grouped by package:

### @napplet/core (`packages/core/src/constants.ts`)
| Constant | Value | Editable? | Notes |
|----------|-------|-----------|-------|
| `PROTOCOL_VERSION` | `'2.0.0'` | READ-ONLY | String, not a magic number |
| `SHELL_BRIDGE_URI` | `'napplet://shell'` | READ-ONLY | URI, not behavioral |
| `AUTH_KIND` | `22242` | READ-ONLY | Protocol-defined kind |
| `REPLAY_WINDOW_SECONDS` | `30` | YES | Behavioral: replay detection window |
| `BusKind.*` | 29000-29010 | READ-ONLY | Protocol-defined kinds |
| `DESTRUCTIVE_KINDS` | `Set([0,3,5,10002])` | READ-ONLY | Protocol-defined |
| `VERB_REGISTER` | `'REGISTER'` | READ-ONLY | Protocol verb |
| `VERB_IDENTITY` | `'IDENTITY'` | READ-ONLY | Protocol verb |

### @napplet/runtime (`packages/runtime/src/event-buffer.ts`)
| Constant | Value | Editable? | Notes |
|----------|-------|-----------|-------|
| `RING_BUFFER_SIZE` | `100` | YES | Behavioral: buffer capacity |

### @napplet/runtime (`packages/runtime/src/key-derivation.ts`)
| Constant | Value | Editable? | Notes |
|----------|-------|-----------|-------|
| `SECRET_LENGTH` | `32` | READ-ONLY | Cryptographic parameter |

### @napplet/shim (`packages/shim/src/state-shim.ts`)
| Constant | Value | Editable? | Notes |
|----------|-------|-----------|-------|
| `REQUEST_TIMEOUT_MS` | `5000` | YES | Behavioral: state request timeout |

### @napplet/services (`packages/services/src/coordinated-relay.ts`)
| Constant | Value | Editable? | Notes |
|----------|-------|-----------|-------|
| `DEFAULT_EOSE_TIMEOUT_MS` | `15000` | YES | Behavioral: EOSE wait |

### @napplet/services (`packages/services/src/relay-pool-service.ts`)
| Constant | Value | Editable? | Notes |
|----------|-------|-----------|-------|
| `EOSE_FALLBACK_MS` | `15000` | YES | Behavioral: EOSE fallback |

### @napplet/services (`packages/services/src/notification-service.ts`)
| Constant | Value | Editable? | Notes |
|----------|-------|-----------|-------|
| `DEFAULT_MAX_PER_WINDOW` | `100` | YES | Behavioral: notification limit |

### @napplet/acl (`packages/acl/src/types.ts`)
| Constant | Value | Editable? | Notes |
|----------|-------|-----------|-------|
| `DEFAULT_QUOTA` | `524288` (512KB) | YES | Behavioral: state quota |

### @napplet/shell (`packages/shell/src/acl-store.ts`)
| Constant | Value | Editable? | Notes |
|----------|-------|-----------|-------|
| `DEFAULT_STATE_QUOTA` | `524288` (512KB) | YES | Behavioral: same concept as acl DEFAULT_QUOTA |

### Demo (`apps/demo/src/flow-animator.ts`)
| Constant | Value | Editable? | Notes |
|----------|-------|-----------|-------|
| `FLASH_DURATION` | `500` | YES | UI timing: node/edge flash |

### Demo (`apps/demo/src/topology.ts`)
| Constant | Value | Editable? | Notes |
|----------|-------|-----------|-------|
| `FLASH_DURATION_MS` | `500` | YES | UI timing: leader line flash |
| `COLOR_ACTIVE` | `'#39ff14'` | READ-ONLY | Not a magic number |
| `COLOR_AMBER` | `'#ff9f0a'` | READ-ONLY | Not a magic number |
| `COLOR_BLOCKED` | `'#ff3b3b'` | READ-ONLY | Not a magic number |
| `COLOR_RESTING` | `'rgba(58,58,74,0.7)'` | READ-ONLY | Not a magic number |

### Demo (`apps/demo/src/main.ts`)
| Constant | Value | Editable? | Notes |
|----------|-------|-----------|-------|
| `TOAST_DISPLAY_MS` | `5000` | YES | UI timing: toast display |

### Demo (`apps/demo/src/signer-connection.ts`)
| Constant | Value | Editable? | Notes |
|----------|-------|-----------|-------|
| `MAX_RECENT_REQUESTS` | `20` | YES | Behavioral: rolling window |

### Demo (`apps/demo/src/sequence-diagram.ts`)
| Constant | Value | Editable? | Notes |
|----------|-------|-----------|-------|
| `HEADER_HEIGHT` | `40` | YES | UI layout: diagram header |
| `ROW_HEIGHT` | `28` | YES | UI layout: diagram row |

## 2. Editable Constants Summary

11 editable behavioral constants:
1. `REPLAY_WINDOW_SECONDS` — 30 (seconds)
2. `RING_BUFFER_SIZE` — 100 (count)
3. `REQUEST_TIMEOUT_MS` — 5000 (ms)
4. `DEFAULT_EOSE_TIMEOUT_MS` — 15000 (ms)
5. `EOSE_FALLBACK_MS` — 15000 (ms)
6. `DEFAULT_MAX_PER_WINDOW` — 100 (count)
7. `DEFAULT_QUOTA` / `DEFAULT_STATE_QUOTA` — 524288 (bytes)
8. `FLASH_DURATION` — 500 (ms)
9. `FLASH_DURATION_MS` — 500 (ms)
10. `TOAST_DISPLAY_MS` — 5000 (ms)
11. `MAX_RECENT_REQUESTS` — 20 (count)
12. `HEADER_HEIGHT` — 40 (px)
13. `ROW_HEIGHT` — 28 (px)

Read-only protocol constants: ~15 (AUTH_KIND, PROTOCOL_VERSION, BusKind.*, DESTRUCTIVE_KINDS, SECRET_LENGTH, verbs, URI)

## 3. Runtime Config Plumbing Analysis

### Challenge: Constants are module-level `const`
All constants are `const` at module scope, often with `as const`. They can't be reassigned at runtime. The demo needs to read from a mutable config object instead.

### Approach: Mutable config object in the demo
Per CONTEXT.md D-11/D-12/D-13:
- Config object lives in demo scope (or a thin demo-config module)
- Demo creates the config, populating it with defaults from each package
- Packages that run at shell/runtime level are updated to optionally accept config overrides
- Shim and SDK are NOT affected (they run in iframe, not demo)

### Integration Strategy

For **demo-level constants** (FLASH_DURATION, TOAST_DISPLAY_MS, etc.):
- Straightforward: demo code reads from config object instead of module const
- The demo modules already use the values imperatively (in setTimeout calls, etc.)

For **runtime/shell constants** (RING_BUFFER_SIZE, REPLAY_WINDOW_SECONDS, etc.):
- These are used deep in @napplet/runtime and @napplet/shell
- Options: (a) thread config through RuntimeAdapter, (b) make the constants module-level `let` with a setter, or (c) use a getter function pattern
- Simplest: add optional config fields to RuntimeAdapter that runtime reads instead of module-level const when present
- The demo already creates RuntimeAdapter — adding config fields is non-disruptive

For **shim constants** (REQUEST_TIMEOUT_MS):
- Per D-13, shim is NOT affected. The shim runs in the napplet iframe.
- However, REQUEST_TIMEOUT_MS can still be shown read-only (or the demo could show it as "napplet-side, not configurable from shell")
- Since the user wants to "see every protocol magic number," showing it read-only is appropriate

### Recommended Config Architecture

```typescript
// apps/demo/src/demo-config.ts
export interface DemoConfig {
  // Runtime behavioral
  replayWindowSeconds: number;
  ringBufferSize: number;
  requestTimeoutMs: number;  // read-only display (shim-side)
  
  // Services
  defaultEoseTimeoutMs: number;
  eoseFallbackMs: number;
  defaultMaxPerWindow: number;
  defaultStateQuota: number;
  
  // Demo UI timing
  flashDuration: number;
  flashDurationMs: number;
  toastDisplayMs: number;
  maxRecentRequests: number;
  headerHeight: number;
  rowHeight: number;
}
```

A `createDefaultConfig()` function populates from the actual const values. The config is passed to modules that need it. Changed values are picked up on the next usage (timeouts pick up on next timeout creation, buffer size on next buffer operation, etc.).

## 4. Inspector Pane Integration

### Current Architecture
- `node-inspector.ts` renders a right-side panel for selected node details
- Panel opens when a node is clicked, shows `NodeDetail` sections
- No tab system exists — it's a single-content pane

### Tab System Needed
Per D-01: Constants panel is a new tab in the inspector pane. This requires:
1. A tab bar at the top of the inspector
2. Tab state management (which tab is active)
3. The existing node-detail content becomes the "Node" tab
4. The constants panel becomes the "Constants" tab
5. Tab visibility rules (D-02: Claude's discretion)

### Inspector DOM Structure
Current: `#inspector-pane` > header + content
Needed: `#inspector-pane` > tab-bar + (node-content | constants-content)

The `updateInspectorPane()` function currently replaces innerHTML wholesale. It needs to be refactored to only update the active tab's content area.

## 5. Constants Panel UI Design

### Input Controls (D-06)
- Number input + range slider side by side
- Slider min/max bounds per constant:
  - Timeouts: 0 to 60000ms (0 to 60s)
  - Counts (buffer, notifications): 1 to 1000
  - Seconds (replay): 1 to 300
  - Pixels (height): 10 to 100
  - Bytes (quota): 1024 to 10485760 (1KB to 10MB)

### Grouping (D-03, D-04)
Default: by package. Optional: by domain, flat. Search/filter across all modes.

Grouping modes:
1. **By package**: core, runtime, services, acl, shell, demo
2. **By domain**: timeouts, sizes/limits, UI timing, protocol (read-only)
3. **Flat**: alphabetical list

### Reset (D-07)
- Per-constant reset icon (visible only when value differs from default)
- Global "Reset All" button at top

### Visual Feedback (D-08, D-09)
- Green pulse on changed row (reuse flow-animator flash pattern)
- Persistent modified indicator (dot/badge) on rows that differ from default

### Session Persistence (D-10)
- Store edited values in a module-level Map (not localStorage — survives panel close/reopen but not page reload)
- On panel open, restore values from the Map

## 6. Existing Patterns to Reuse

1. **acl-panel.ts** — Inline styled toggle controls. Pattern for interactive buttons.
2. **flow-animator.ts** — Flash animation (add/remove CSS class with setTimeout).
3. **node-inspector.ts** — Panel lifecycle, header rendering, close button.
4. **topology.ts** — Inline styles for dynamic UI elements.

## 7. File Change Map

| File | Change Type | Description |
|------|-------------|-------------|
| `apps/demo/src/constants-panel.ts` | NEW | Constants panel UI rendering, search, grouping, edit handlers |
| `apps/demo/src/demo-config.ts` | NEW | Mutable config object with defaults, getter/setter, reset |
| `apps/demo/src/node-inspector.ts` | MODIFY | Add tab system, integrate constants tab |
| `apps/demo/src/main.ts` | MODIFY | Import and wire config, pass to modules |
| `apps/demo/src/flow-animator.ts` | MODIFY | Read FLASH_DURATION from config |
| `apps/demo/src/topology.ts` | MODIFY | Read FLASH_DURATION_MS from config |
| `apps/demo/src/signer-connection.ts` | MODIFY | Read MAX_RECENT_REQUESTS from config |
| `apps/demo/src/sequence-diagram.ts` | MODIFY | Read HEADER_HEIGHT, ROW_HEIGHT from config |
| `apps/demo/index.html` | MODIFY | Add CSS for constants panel |
| `packages/runtime/src/types.ts` | MODIFY | Add optional config overrides to RuntimeAdapter |
| `packages/runtime/src/runtime.ts` | MODIFY | Read config overrides for RING_BUFFER_SIZE, REPLAY_WINDOW_SECONDS |
| `packages/runtime/src/event-buffer.ts` | MODIFY | Accept optional buffer size parameter |

## 8. Risk Assessment

1. **RuntimeAdapter changes** — Adding optional fields is backward-compatible. No existing consumers break.
2. **Inspector refactor** — Tab system changes innerHTML rendering. Risk of breaking existing node-detail display. Mitigation: test that clicking a node still shows details.
3. **Config threading** — Demo-level constants are easy (module scope). Runtime constants require parameter threading through factory functions.
4. **Shim constants** — Cannot be edited from shell side. Display as read-only is correct per D-13.

## 9. Validation Architecture

### Dimension 1: Functional Correctness
- All 11+ editable constants appear in the panel with correct current values
- Editing a value and triggering the relevant operation uses the new value
- Read-only constants display but cannot be edited

### Dimension 2: Session Persistence
- Edit a value, close the panel, reopen — value preserved
- Reload the page — values reset to defaults

### Dimension 3: UI Completeness
- Tab system works (switch between Node and Constants tabs)
- Search filters constants
- Grouping modes switch correctly
- Reset All restores defaults
- Per-constant reset works
- Modified indicator visible on changed rows
- Flash animation on edit confirmation

### Dimension 4: Integration
- Runtime operations (replay check, buffer) use overridden values
- Demo animations (flash, toast) use overridden values
- No TypeScript errors introduced
- Build passes

---

## RESEARCH COMPLETE
