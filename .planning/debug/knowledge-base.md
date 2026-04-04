# GSD Debug Knowledge Base

Resolved debug sessions. Used by `gsd-debugger` to surface known-pattern hypotheses at the start of new investigations.

---

## leader-lines-scroll-resize-break --- LeaderLine SVGs misalign on scroll/resize after layout change
- **Date:** 2026-04-04
- **Error patterns:** leader lines misaligned, scroll, resize, SVG displaced, broken arrows, topology nodes, overflow auto, LeaderLine position
- **Root cause:** Commit 7085aaa changed body to overflow:hidden with #topology-pane as the scroll container (overflow:auto). LeaderLine SVGs are appended to document.body and auto-reposition on window resize only, not on scroll events of internal containers. initTopologyEdges() had a ResizeObserver but no scroll listener on #topology-pane.
- **Fix:** Extracted a repositionAll() helper, added scroll event listener on #topology-pane and a window resize listener (both passive) that call repositionAll() to keep lines synced with node positions.
- **Files changed:** apps/demo/src/topology.ts
---
