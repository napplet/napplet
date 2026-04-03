# Quick Task 260403-lck: Fix Phase 51 split-border node implementation

**Completed:** 2026-04-03
**Commits:** a6ceeb9, 8a9360a, 8347912

## What Changed

Replaced the Phase 51 split-border color overlays from subtle background tints (6% opacity covering full node halves) to a **padding-frame approach** that simulates colored left/right border edges.

### CSS (`apps/demo/index.html`)
- `.topology-node` gets `padding: 4px` and solid dark fallback background (`#12121a`)
- New `.topology-node-content` class: opaque gradient background, `border-radius: 12px` (inner radius = 16px outer minus 4px padding), `z-index: 1`, `overflow: hidden`
- Color classes bumped from 6% to 55% opacity — clearly visible through the 4px padding gap

### DOM Structure (`apps/demo/src/topology.ts`)
- All node templates wrapped in `<div class="topology-node-content">` — content sits above overlays
- Overlay divs (z-index: 0) remain absolutely positioned at 50% width each
- Their background-color is visible only in the 4px padding gap — simulating colored border halves

### Deviation Fix (`apps/demo/src/main.ts`)
- `updateSignerNodeDisplay()` and `injectNotificationControls()` updated to target `.topology-node-content` wrapper instead of the article element, preventing overlay div removal during dynamic updates

## Result

Topology nodes now display visible colored left/right border frames reflecting inbound/outbound routing state, instead of nearly-invisible background tints. The approach simulates split-color borders using CSS that browsers actually support.
