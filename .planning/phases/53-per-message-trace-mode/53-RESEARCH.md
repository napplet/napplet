# Phase 53: Per-Message Trace Mode - Research

**Researched:** 2026-04-03
**Requirement IDs:** COLOR-03

## Research Question

What do we need to know to plan per-message trace mode — hop-by-hop edge color sweep animations overlaid on the existing topology graph?

## 1. Existing Animation Infrastructure

### Edge Architecture (topology.ts)

Each topology edge has **two separate LeaderLine instances**:
- `${edgeId}-out` — source-to-target direction (from `fromOutPort` to `toOutPort`)
- `${edgeId}-in` — target-to-source direction (from `toInPort` to `fromInPort`)

Lines stored in: `const lines = new Map<string, any>()` keyed by `${edgeId}-${direction}`.

Color mutation: `line.setOptions({ color, size })` — LeaderLine exposes `setOptions()` for live color changes.

Constants:
```ts
const COLOR_ACTIVE  = '#39ff14';   // green
const COLOR_AMBER   = '#ff9f0a';   // amber
const COLOR_BLOCKED = '#ff3b3b';   // red
const COLOR_RESTING = 'rgba(58,58,74,0.7)';
```

### EdgeFlasher Interface (topology.ts:180-187)

```ts
export interface EdgeFlasher {
  flash(edgeId: string, cls: 'active' | 'amber' | 'blocked'): void;
  flashDirection(edgeId: string, direction: 'out' | 'in', cls: 'active' | 'amber' | 'blocked'): void;
  setColor(edgeId: string, direction: 'out' | 'in', cls: 'active' | 'amber' | 'blocked' | null): void;
}
```

The `flash()` and `flashDirection()` methods set a color then revert after `FLASH_DURATION_MS`. The `setColor()` method sets persistent color (no auto-revert). **Trace mode needs a new method** or a sequential animation wrapper around existing `setColor` calls.

### Message Flow (flow-animator.ts)

`tap.onMessage(callback)` fires for every protocol message. The callback receives a `TappedMessage` with `verb`, `direction`, `parsed`, `raw`, `windowId`, and `timestamp`.

`buildHighlightPath(topology, msg)` returns `{ nodes: string[], edges: string[] }` — an **ordered list** of node IDs and edge IDs along the message's routing path. This is exactly the sequence needed for hop-by-hop animation.

### Failure Point (flow-animator.ts:89-119)

`identifyFailureNode(nodes, msg)` returns the index of the node that caused the failure. Edges before the failure index get `'active'` color; edges at/after get `cls` (blocked or amber). This directional split logic must be preserved in trace mode.

### Color State Module (color-state.ts)

Tracks persistent per-edge-direction state with three modes: `'rolling' | 'decay' | 'last-message'`. Trace mode is the 4th option per CONTEXT.md D-04. When trace is active, the persistent state modes should NOT apply — edges are driven entirely by per-message animations.

Key API:
- `recordEdgeColor(edgeId, direction, color)` — records a color result
- `getEdgeColor(edgeId, direction)` — resolves current color per persistence mode
- `onColorStateChange(callback)` — notifies when color state changes
- `setPersistenceMode(mode)` — switches mode, clears accumulated state

### Color Mode Toggle (topology.ts:424-430)

Rendered in `renderDemoTopology()`:
```html
<div class="color-mode-toggle">
  <button class="color-mode-btn color-mode-active" data-color-mode="rolling">rolling</button>
  <button class="color-mode-btn" data-color-mode="decay">decay</button>
  <button class="color-mode-btn" data-color-mode="last-message">last</button>
</div>
```

Click handler in main.ts (line 449-461) reads `data-color-mode` and calls `setPersistenceMode()`. Adding a 4th "trace" button is straightforward.

### Demo Config (demo-config.ts)

Mutable runtime config with `demoConfig.get(key)` / `demoConfig.set(key, value)`. Current timing constants:
- `demo.FLASH_DURATION` — 500ms (node flash)
- `demo.FLASH_DURATION_MS` — 500ms (edge flash)

Trace mode needs a new constant for per-hop sweep duration (e.g., `demo.TRACE_HOP_DURATION_MS`).

## 2. Animation Design Analysis

### Hop-by-Hop Edge Sweep

Per CONTEXT.md D-01, animation is **edge color sweep** — each edge in the path lights up sequentially. Given `buildHighlightPath()` returns an ordered edge list, the sweep is:

```
for each edge[i] in path:
  wait i * HOP_DURATION
  set edge color based on failure point position
  after HOP_DURATION, revert to resting (D-05)
```

Per D-03, color at each hop follows directional logic:
- Before failure point: green (COLOR_ACTIVE)
- At/after failure point: red (COLOR_BLOCKED) or amber (COLOR_AMBER)

Per D-02, nodes do NOT flash during trace animation. Only edges animate.

### Overlapping Animations (D-06, D-07)

Multiple animations overlap — no queue, no drop. Each message gets its own independent setTimeout cascade. This means:
- On the same edge, multiple sweeps can be active simultaneously
- "Latest color wins" is the simplest visual blending: whichever setTimeout fires last determines the visible color
- Each animation independently reverts its edges after completion

Implementation: Each animation creates its own set of timeouts. No global lock or queue needed. The natural setTimeout ordering handles overlap — the most recent animation's revert will be the last to fire.

### Edge Revert After Sweep (D-05)

When trace mode is active, edges revert to resting color after the sweep animation completes. No persistent state accumulates. This differs from rolling/decay/last-message where state persists.

### Integration with Persistent State

When trace mode is active (D-04):
- `recordEdgeColor()` should NOT be called (no persistent accumulation)
- `onColorStateChange` listener still fires but the rendered persistent colors should be cleared/ignored
- When switching away from trace mode, accumulated state starts fresh (same as existing mode-switch behavior)

## 3. Technical Approach

### New Module: trace-animator.ts

Create a dedicated module for trace animation logic:

```ts
export function animateTrace(
  edgeFlasher: EdgeFlasher,
  edges: string[],
  nodes: string[],
  cls: 'active' | 'amber' | 'blocked',
  failureNodeIndex: number,
  direction: 'out' | 'in',
  hopDuration: number,
): void;
```

This function creates a cascade of `setTimeout` calls that sequentially sweep edge colors. Each hop:
1. Sets edge color (green before failure, red/amber at/after)
2. After `hopDuration`, reverts that edge to resting

Total animation duration: `edges.length * hopDuration`.

### PersistenceMode Extension

Extend `PersistenceMode` type:
```ts
export type PersistenceMode = 'rolling' | 'decay' | 'last-message' | 'trace';
```

When mode is `'trace'`:
- `recordEdgeColor()` becomes a no-op
- `getEdgeColor()` returns null (all edges at resting state by default)
- The flow-animator dispatch branch for trace mode calls `animateTrace()` instead of persistent state recording

### Toggle Button Addition

Add a 4th button to the color mode toggle bar:
```html
<button class="color-mode-btn" data-color-mode="trace">trace</button>
```

### Configurable Constant

Add to demo-config.ts:
```ts
{
  key: 'demo.TRACE_HOP_DURATION_MS',
  label: 'Trace Hop Duration',
  defaultValue: 150,
  currentValue: 150,
  unit: 'ms',
  min: 30,
  max: 1000,
  step: 10,
  pkg: 'demo',
  domain: 'ui-timing',
  editable: true,
  description: 'Duration of each hop in per-message trace animation',
}
```

150ms per hop is a good default: fast enough to not block rapid messages, slow enough to be perceptible. A 4-edge path would animate over 600ms total.

## 4. Edge Cases and Risks

### Risk: Animation Pile-Up

With rapid messages (e.g., bot sending 5 messages/second), many overlapping animations could fire simultaneously. Each creates `edges.length` timeouts. With 4 edges and 150ms/hop:
- 5 msg/s = 20 active timeouts at peak
- This is lightweight for the browser — no performance concern

### Risk: Mode Switch During Animation

If user switches from trace to rolling while animations are in-progress, pending timeouts could interfere. Mitigation: on mode switch, clear all pending trace timeouts (track them in an array, clearTimeout all).

### Risk: Edge Color Flicker

Overlapping animations on the same edge could cause flicker as one animation reverts while another is active. Mitigation: use a per-edge-direction animation counter. Only revert to resting when the counter drops to zero (no active animations on that edge).

### Node Behavior in Trace Mode

Per D-02, nodes do NOT flash during trace. The existing `flashNode()` calls in the success and failure branches of the flow-animator dispatch need to be skipped when trace mode is active. Node color overlays (persistent split-border colors) should also be cleared/hidden in trace mode since there's no persistent state.

## 5. File Change Summary

| File | Change |
|------|--------|
| `apps/demo/src/trace-animator.ts` | **NEW** — Hop-by-hop sweep animation logic |
| `apps/demo/src/color-state.ts` | Add `'trace'` to PersistenceMode, make recordEdgeColor a no-op when trace active |
| `apps/demo/src/flow-animator.ts` | Branch on trace mode: call `animateTrace()` instead of persistent dispatch, skip node flashing |
| `apps/demo/src/topology.ts` | Add 4th "trace" button to color mode toggle HTML |
| `apps/demo/src/demo-config.ts` | Add `demo.TRACE_HOP_DURATION_MS` constant |
| `apps/demo/src/main.ts` | Wire trace mode toggle, cleanup on mode switch |

## 6. Validation Architecture

### Dimension 1: Functional Correctness
- Toggle trace mode on, send a message, verify edges light up sequentially (not all at once)
- Toggle trace mode off, verify persistent color modes resume

### Dimension 2: Edge Behavior
- Success message: all edges animate green in sequence
- Failure message: edges before failure point animate green, at/after animate red/amber
- After animation completes, edges revert to resting color

### Dimension 3: Overlap Handling
- Send two messages in rapid succession, verify both animate independently
- No message is dropped or queued — each gets its own animation

### Dimension 4: Mode Switching
- Switch from trace to rolling during an animation, verify no lingering trace timeouts affect rolling mode colors
- Switch from rolling to trace, verify persistent colors clear

### Dimension 5: Configuration
- Change `demo.TRACE_HOP_DURATION_MS` via constants panel, verify next trace animation uses new duration
- Reset to default, verify 150ms behavior

---

## RESEARCH COMPLETE

*Phase: 53-per-message-trace-mode*
*Researched: 2026-04-03*
