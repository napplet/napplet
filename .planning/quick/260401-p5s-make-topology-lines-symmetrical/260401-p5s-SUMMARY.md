---
quick_id: 260401-p5s
status: complete
date: 2026-04-01
---

# Summary: Make Topology Lines Symmetrical

## What Changed

**`apps/demo/src/topology.ts`** — `initTopologyEdges()` socket gravity values:

- `outLine`: `startSocketGravity`/`endSocketGravity` changed from `[-20, 0]` to `[+60, 0]`
- `inLine`: `startSocketGravity`/`endSocketGravity` changed from `[-55, 0]` to `[-60, 0]`

## Why

Both lines previously used negative X gravity, making them both curve left (same direction).
Mirroring to `+60` / `-60` makes the out/in lines symmetric around the node vertical axis,
and increases the total separation from 35px to 120px for clear visual distinction.
