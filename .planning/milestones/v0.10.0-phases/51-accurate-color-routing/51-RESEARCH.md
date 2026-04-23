# Phase 51: Accurate Color Routing - Research

**Researched:** 2026-04-03
**Phase requirement IDs:** COLOR-01, COLOR-02

## Research Questions

### Q1: How does the current color system work and what needs to change?

**Current behavior (flow-animator.ts):**
- `tap.onMessage()` callback classifies every message as `active` (green), `amber`, or `blocked` (red)
- Classification logic at line 149-169:
  - `isBlocked` = OK with false status OR CLOSED with 'denied'/'blocked:' prefix
  - `isAmber` = OK false + infrastructure error (no signer, relay, timeout, not wired, mock)
  - Otherwise = `active` (green)
- `buildHighlightPath()` returns all nodes and edges in the message path
- **All** nodes and edges in the path get the **same** color class — no directional awareness
- Flash is transient: CSS class added then removed after `FLASH_DURATION` ms

**What needs to change:**
1. Flash-all-same must become directional: outbound leg before failure = green, failure node = red/amber, after failure = red/amber
2. `-out` and `-in` LeaderLine instances must be flashed independently (currently both get same color via `edgeFlasher.flash()`)
3. Node coloring must be derived from accumulated edge states, not per-message flash
4. Persistent state replaces flash-and-revert

### Q2: How are edges structured for directional control?

**topology.ts lines 229-248:**
- Each topology edge creates TWO LeaderLine instances:
  - `edge.id + '-out'` — from `fromOutPort` to `toOutPort` (top-to-bottom right side)
  - `edge.id + '-in'` — from `toInPort` to `fromInPort` (bottom-to-top left side)
- Lines stored in a `Map<string, any>` keyed by `edgeId-out` and `edgeId-in`
- Current `EdgeFlasher.flash()` iterates both `-out` and `-in` with the same color

**Implication:** The infrastructure for directional edge control already exists. We need to:
1. Expose directional flash: `flashDirection(edgeId, direction: 'out' | 'in', cls)` 
2. Keep `flash()` for backward compat or replace entirely

### Q3: How should persistent state be modeled?

**CONTEXT decisions D-05 through D-07 specify three modes:**
1. **Rolling window** (default): Last N messages per edge direction. Color = majority.
2. **Decay over time**: Each message sets color, gradually fades toward neutral over X seconds.
3. **Last-message wins**: Edge holds color of most recent message.

**Data model per edge direction:**
```typescript
interface EdgeDirectionState {
  edgeId: string;
  direction: 'out' | 'in';
  // Rolling window
  recentResults: Array<'active' | 'amber' | 'blocked'>;
  // Decay
  lastResultTimestamp: number;
  lastResult: 'active' | 'amber' | 'blocked' | null;
  // Last-message
  currentColor: 'active' | 'amber' | 'blocked' | null;
}
```

**Color derivation by mode:**
- Rolling window: count occurrences in window, majority wins. Ties: prefer amber > blocked > active.
- Decay: if `now - lastResultTimestamp < decayDuration`, return lastResult; else return null (resting).
- Last-message: return currentColor directly.

### Q4: How should the failure point be identified for directional coloring?

**Path structure from buildHighlightPath():**
The path is a linear chain: `[napplet, shell, acl, runtime, ?service]`

**Failure point identification:**
- ACL denials (reason starts with `denied:`) → ACL node is the failure point
- Infrastructure errors (no signer, timeout, not wired) → the relevant service or runtime is the failure point  
- For outbound messages (napplet->shell): edges before the failure point are green-out, failure node is red/amber, edges after are not reached (no color or resting)
- For inbound messages (shell->napplet): edges before the failure point are green-in, failure node is red/amber, edges after are not reached

**Algorithm:**
1. Build highlight path (existing)
2. Classify message (existing) 
3. If blocked/amber: find failure point index in path
4. For each node/edge before failure: flash outbound direction green
5. For failure node: flash failure color
6. For each node/edge after failure: don't flash (or flash return color)

### Q5: How should node composite color be derived?

**CONTEXT decisions D-08 through D-12 specify split-border approach:**
- Each node shows inbound and outbound state as separate halves
- Horizontal layout: left half = inbound, right half = outbound
- Two inner containers (50% width) with background-color

**For nodes with multiple edges (e.g., runtime has edges to ACL and each service):**
- Collect all connected edge states for each direction
- Compute composite: all green → green, all red → red, mixed → amber
- Apply to the relevant half of the node

**Implementation approach:**
- Each node gets two inner `<div>` elements as a "split-border" overlay
- Position: absolute, top/bottom/left/right spanning the border area
- Left div covers left half, right div covers right half
- Background-color reflects accumulated state for that direction
- Overlaid on top of the existing node-box border

### Q6: How should the persistence mode toggle integrate with the constants panel?

**Phase 49 created `demo-config.ts` with a `DemoConfig` class.** New constants to add:
- `demo.COLOR_PERSISTENCE_MODE`: Not a number — needs a string config or separate mechanism
- `demo.ROLLING_WINDOW_SIZE`: Number of recent messages per edge direction (default 10)
- `demo.DECAY_DURATION_MS`: Milliseconds before color fades to neutral (default 5000)

**Issue:** `DemoConfig` only handles numeric values. The persistence mode toggle (rolling/decay/last-message) needs either:
1. A separate string config mechanism
2. Numeric encoding (0=rolling, 1=decay, 2=last-message)
3. A standalone module-level variable managed by the UI toggle

**Recommendation:** Use option 3 — a module-level variable in the new color-state module, with a UI toggle button group. The numeric parameters (window size, decay duration) go into `demoConfig` as normal constants. This keeps DemoConfig purely numeric and avoids type system complications.

### Q7: Where should the persistence toggle UI live?

**Options:**
- Constants panel new section
- Topology pane header
- A small control bar above/below the topology

**Recommendation:** Small 3-way toggle in the topology region label area (above the napplets section). Keeps it visible and contextual without cluttering the constants panel with non-numeric config.

## Validation Architecture

### Test Strategy
1. **Directional edge independence:** After an ACL denial message, verify `-out` line has green color on pre-failure edges and `-in` line has appropriate color on the return path
2. **Node composite correctness:** After mixed messages (some pass, some fail), verify node split-border shows correct colors for each half
3. **Persistence modes:** Send 5 messages, verify rolling window shows majority color; wait for decay, verify color fades
4. **Mode toggle:** Switch between modes, verify color state updates correctly

### Risk Areas
- LeaderLine `setOptions()` performance with frequent color changes — may need debouncing
- Split-border CSS interacting with existing `node-box.active/blocked/amber` flash classes — need to ensure they don't conflict
- Rolling window memory for many edges over time — cap the array length

## RESEARCH COMPLETE

Key findings:
1. `-out` and `-in` LeaderLine instances already exist — directional control is infrastructure-ready
2. Failure point identification maps cleanly to the existing `buildHighlightPath()` output
3. Persistence state needs a new module (`color-state.ts`) separate from `flow-animator.ts`
4. Split-border CSS for nodes is achievable with two absolute-positioned inner divs
5. DemoConfig stays numeric-only; persistence mode is a module-level enum variable
6. Three new constants for demoConfig: ROLLING_WINDOW_SIZE, DECAY_DURATION_MS (FLASH_DURATION already exists for animation timing)
