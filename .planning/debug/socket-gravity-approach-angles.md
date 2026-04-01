---
status: awaiting_human_verify
trigger: "socket-gravity-approach-angles: edges approach nodes from sides instead of top/bottom"
created: 2026-04-01T00:00:00Z
updated: 2026-04-01T17:22:00Z
---

## Current Focus

hypothesis: CONFIRMED — path:'grid' + bottom/top sockets creates S/Z-shapes. Switching to path:'fluid' with reduced gravity [4,30] produces clean smooth curves for all edge types.
test: Playwright visual verification at 1400x1400 viewport — all edge types inspected via zoomed screenshots.
expecting: Clean bidirectional curves between all topology nodes.
next_action: Awaiting user visual verification.

## Symptoms

expected: Edges in the vertical topology diagram should exit from the BOTTOM of source nodes and enter the TOP of target nodes, with clean vertical routing between stacked nodes.
actual: Edges still approach nodes from the sides (left/right) with horizontal-first routing. Screenshot shows a line entering the "shell" node from the left side at a right angle.
errors: No runtime errors — purely visual/layout issue.
reproduction: Start demo app (pnpm dev from apps/demo), open browser, observe topology edges.
started: Plan 33-07 fixed socket gravity Y-offset symmetry. Plan 33-09 (commit aa67c9f) changed from [+/-12, +/-8] to [+/-8, +/-20]. Still not fixed.

## Eliminated

- hypothesis: socketGravity Y-offset of +/-8 was too small compared to X-offset +/-12 (X-dominant)
  evidence: Plan 33-09 changed to Y-dominant [+/-8, +/-20] but issue persists — socketGravity does not control socket side selection at all
  timestamp: 2026-04-01T00:00:00Z

- hypothesis: socketGravity [x, y] selects the socket side by biasing toward a gravity point offset from element center
  evidence: LeaderLine README clearly states socketGravity is "The force of gravity at a socket" that controls pull direction/curvature of the line AFTER it leaves the socket. The separate startSocket/endSocket option (defaulting to 'auto') controls which SIDE of the element the line connects to. These are independent properties.
  timestamp: 2026-04-01T00:00:00Z

- hypothesis: Forced startSocket/endSocket (bottom/top) with grid path would solve the visual issue
  evidence: User verified after initial fix: socket sides are now correct (top/bottom), but path:'grid' creates S/Z-shapes when napplets are horizontally offset from centered shell. Grid path makes right-angle turns to align.
  timestamp: 2026-04-01T17:10:00Z

## Evidence

- timestamp: 2026-04-01T00:00:00Z
  checked: LeaderLine README.md — startSocket/endSocket section (line 368-379)
  found: "The string to indicate which side of the element the leader line connects. It can be 'top', 'right', 'bottom', 'left' or 'auto'. If 'auto' (default) is specified, the closest side is chosen automatically."
  implication: Socket side is controlled by startSocket/endSocket, NOT socketGravity. Current code does not set these, so 'auto' is used.

- timestamp: 2026-04-01T00:00:00Z
  checked: LeaderLine README.md — startSocketGravity/endSocketGravity section (line 381-406)
  found: "The force of gravity at a socket. If an Array that is coordinates [x, y] is specified, the leader line is pulled in the direction of the coordinates." This controls path CURVATURE, not socket SELECTION.
  implication: All previous gravity tuning attempts (plans 33-07, 33-09) were adjusting the wrong property. They changed path curvature but never controlled which side the line connects to.

- timestamp: 2026-04-01T00:00:00Z
  checked: topology.ts initTopologyEdges() — current code at lines 208-219
  found: outLine sets startSocketGravity/endSocketGravity but NOT startSocket/endSocket. inLine same. Both leave socket side at 'auto'.
  implication: LeaderLine auto-selects closest side. For horizontally-offset napplet cards relative to the shell node, the closest side may be left or right, causing horizontal approach.

- timestamp: 2026-04-01T00:00:00Z
  checked: index.html CSS layout — topology-layout (line 22)
  found: Layout is flex-direction: column with gap: 12px. Napplet grid is repeat(auto-fit, minmax(220px, 1fr)). Shell/acl/runtime are centered with width min(100%, 420px). This means napplets at edges of the grid are horizontally offset from the centered core cards.
  implication: With 'auto' socket selection, horizontally-offset nodes get left/right sockets chosen instead of bottom/top.

- timestamp: 2026-04-01T17:10:00Z
  checked: User visual verification of startSocket/endSocket fix
  found: NOT FIXED. Shell node now connects at TOP and BOTTOM (progress), but S/Z-shape routing is evident for horizontally-offset napplets. Grid path goes down from napplet -> right/left to align -> up into shell top. Additionally, socketGravity [-8,-20] on inLine startSocket='top' pulls reverse path LEFT from shell's top socket, creating extra horizontal segments.
  implication: Forced bottom/top socket selection is correct for the vertical axis, but 'grid' path creates ugly S-shapes when source and target are not vertically aligned. Need different path type or per-edge socket logic.

- timestamp: 2026-04-01T17:16:00Z
  checked: LeaderLine README — path options (line 353-364)
  found: Five path types available: straight, arc, fluid (default), magnet, grid. Current code uses 'grid' which creates right-angle paths. 'fluid' creates smooth Bezier curves that naturally handle horizontal offsets.
  implication: Switching from 'grid' to 'fluid' would eliminate the S/Z-shape right-angle routing while keeping the visual connection semantics.

- timestamp: 2026-04-01T17:18:00Z
  checked: Playwright screenshot with path:'fluid', gravity [8, 50] — napplet-to-shell edges
  found: Smooth Bezier curves from bot/chat bottom to shell top. No S/Z shapes. Dual lines (out/in) show clear separation. Slight outward bow from 50px gravity.
  implication: Fluid path fixes the S-shape issue. Gravity values could be tightened.

- timestamp: 2026-04-01T17:20:00Z
  checked: Playwright screenshot with path:'fluid', gravity [4, 30] — all edge types
  found: Tighter curves, less outward bow. Core vertical stack (shell->acl->runtime) shows clean dual parallel lines. Napplet->shell shows smooth arcs. Runtime->services shows clean fan-out. All edges look intentional and professional.
  implication: [4, 30] gravity with fluid path is the optimal setting. Fix confirmed via automated visual testing.

## Resolution

root_cause: Two compounding issues: (1) startSocket/endSocket was never set, so LeaderLine auto-selected the closest side (left/right for offset nodes instead of bottom/top). (2) path:'grid' creates right-angle routing, which produces S/Z-shapes when source and target are not vertically aligned. The first fix (adding startSocket/endSocket) fixed socket-side selection but revealed the grid path S-shape issue.
fix: Changed path from 'grid' to 'fluid' (smooth Bezier curves). Kept explicit startSocket/endSocket (bottom/top for out, top/bottom for in). Reduced socketGravity from [8,20] to [4,30] for tighter curves with slight dual-line separation. Fluid curves naturally handle horizontal offsets between napplet grid and centered core cards.
verification: Vite production build succeeds. Type-check passes (14/14 tasks). Playwright automated screenshots confirm clean smooth curves for all edge types: napplet->shell (offset), shell->acl->runtime (aligned), runtime->services (offset). No S/Z shapes, no horizontal-first routing.
files_changed: [apps/demo/src/topology.ts]
