---
status: resolved
trigger: "Leader Line SVG arrows connecting topology nodes become misaligned/broken when scrolling or resizing"
created: 2026-04-04T00:00:00Z
updated: 2026-04-04T00:00:00Z
---

## Current Focus

hypothesis: The #topology-pane has overflow:auto (scrollable), but LeaderLine's SVGs are appended to document.body — so they use viewport coordinates while the nodes use scroll-offset coordinates. The ResizeObserver in initTopologyEdges only repositions on resize, NOT on scroll. Missing scroll event listener on #topology-pane.
test: 1) Verify LeaderLine appends SVGs to body (outside scroll container), 2) Confirm no scroll listener exists, 3) Add scroll listener on #topology-pane to call line.position()
expecting: Adding scroll listener should fix the scroll case. For window resize, ResizeObserver should already handle it but may need additional window resize listener.
next_action: Implement fix — add scroll event listener on #topology-pane

## Symptoms

expected: Leader line SVG arrows should stay connected to their topology node elements when scrolling or resizing the browser window
actual: Leader lines become displaced from their connection points — arrows float away from nodes, creating visual artifacts and broken connections
errors: No console errors reported — this is a visual rendering issue
reproduction: Both scrolling the page AND resizing the browser window trigger the broken lines
started: Broke recently — used to work, broke in a recent milestone (likely v0.10.0 changes)

## Eliminated

## Evidence

- timestamp: 2026-04-04T00:10:00Z
  checked: initTopologyEdges() in topology.ts (lines 203-261)
  found: Only a ResizeObserver on topology-root and flow-area-inner calls line.position(). No scroll listener exists anywhere. No window resize listener.
  implication: Scrolling #topology-pane will displace LeaderLine SVGs because they are at body level and need manual position() calls on scroll.

- timestamp: 2026-04-04T00:12:00Z
  checked: index.html layout CSS (line 119)
  found: #topology-pane has overflow:auto — it IS the scroll container. body has overflow:hidden and height:100vh. LeaderLine's built-in positionByWindowResize handles window resize but NOT internal scroll containers.
  implication: Window resize changes flex layout which changes #topology-pane dimensions, but the built-in handler may fire before flex reflow completes. Scroll events are completely unhandled.

- timestamp: 2026-04-04T00:14:00Z
  checked: git diff of commit 7085aaa (the layout fix)
  found: This commit added "body { display:flex; flex-direction:column; height:100vh; overflow:hidden; }" and "#flow-area { flex:1; min-height:0; overflow:hidden; }". Before this commit, the body could scroll naturally. After, only #topology-pane scrolls internally.
  implication: This layout change is the proximate cause — it moved scrolling from window level (where LeaderLine auto-handles it) to #topology-pane level (where LeaderLine has no visibility).

- timestamp: 2026-04-04T00:15:00Z
  checked: Leader Line docs and GitHub issues (issues #79, #154, #165, #269)
  found: LeaderLine SVGs are always appended to document.body. The library auto-handles window resize but NOT scroll on internal containers. Fix is to add scroll event listener calling line.position().
  implication: This is a known LeaderLine limitation. The fix is straightforward — add scroll + resize listeners.

## Resolution

root_cause: Commit 7085aaa changed the page layout to body{overflow:hidden;height:100vh} with #topology-pane as the scroll container (overflow:auto). LeaderLine SVGs are appended to document.body and auto-reposition on window resize, but NOT on scroll events of internal containers. The initTopologyEdges() function only has a ResizeObserver — no scroll listener on #topology-pane. When the user scrolls, the nodes move inside the scroll container but the LeaderLine SVGs stay fixed at their original viewport positions.
fix: Add scroll event listener on #topology-pane that calls line.position() for all lines. Also add a window resize listener with a small debounce to catch flex-layout reflows that the ResizeObserver might miss.
verification: Type-check passes. Self-verified code change is minimal — adds scroll and resize listeners that call the same repositionAll() helper already used by the ResizeObserver. Awaiting human visual verification.
files_changed: [apps/demo/src/topology.ts]
