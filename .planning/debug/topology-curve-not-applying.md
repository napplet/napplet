---
status: resolved
trigger: "Test 2 failed — topology edges still render as curves/diagonals instead of orthogonal 90-degree lines. Plan 33-02 added curve: 0 to BASE_OPTIONS but it's not taking effect."
created: 2026-04-01T16:30:00Z
updated: 2026-04-01T16:35:00Z
---

## Current Focus

hypothesis: CONFIRMED — `curve: 0` is not a valid Leader Line option; the correct option is `path: 'grid'` for orthogonal routing
test: Read Leader Line README.md (official documentation at node_modules)
expecting: Found that `path` option controls routing style (straight, arc, fluid, magnet, grid); `grid` provides orthogonal 90-degree paths
next_action: Replace `curve: 0` with `path: 'grid'` in BASE_OPTIONS

## Symptoms

expected: All topology edges render as straight 90-degree orthogonal paths
actual: Edges still rendering as curves/diagonals despite curve: 0 in BASE_OPTIONS
errors: None — no JavaScript errors observed
reproduction: Open demo app in browser, observe topology edges
started: After plan 33-02 executed (curve: 0 added to BASE_OPTIONS)

## Eliminated

(none yet)

## Evidence

- timestamp: 2026-04-01T16:30:00Z
  checked: apps/demo/src/topology.ts BASE_OPTIONS definition
  found: "curve: 0 is present at line 197 in BASE_OPTIONS"
  implication: "The property is being set, but `curve` is NOT a valid Leader Line option"

- timestamp: 2026-04-01T16:30:00Z
  checked: LeaderLine README.md (node_modules/.pnpm/leader-line@1.0.8/node_modules/leader-line/README.md) section 353
  found: "Leader Line has `path` option (not `curve`) that controls routing style. Valid values: straight, arc, fluid (default), magnet, grid. Grid provides orthogonal 90-degree rectilinear paths."
  implication: "CONFIRMED ROOT CAUSE: Plan 33-02 used wrong property name. Should be `path: 'grid'` instead of `curve: 0`"

- timestamp: 2026-04-01T16:30:00Z
  checked: Socket gravity configuration in BASE_OPTIONS
  found: "startSocketGravity: [12, -8] and endSocketGravity: [12, -8] for forward edge; [-12, 8] for reverse"
  implication: "Socket gravity controls pull direction at attachment points (not the path routing algorithm). These are compatible with any path option."

## Resolution

root_cause: "Plan 33-02 added `curve: 0` to BASE_OPTIONS in apps/demo/src/topology.ts, but `curve` is not a valid Leader Line configuration option. The correct property is `path`, and the value for orthogonal 90-degree routing is `'grid'` (not 0). Leader Line documentation (README section 353) specifies that `path` accepts: 'straight', 'arc', 'fluid' (default), 'magnet', or 'grid'."
fix: "Replace `curve: 0` with `path: 'grid'` in BASE_OPTIONS constant at line 197 of apps/demo/src/topology.ts"
verification: "After fix, all topology edges should render as orthogonal 90-degree rectilinear paths. Manual verification in browser dev server should show cardinal-direction lines instead of curves."
files_changed: ["apps/demo/src/topology.ts"]
