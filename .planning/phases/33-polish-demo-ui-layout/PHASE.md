# Phase 33: Polish Demo UI Layout

**Goal**: Fix UI/UX layout and interaction issues in the demo visualization

**Depends on**: Phase 32
**Requirements**: None (bug fixes/polish only)

## Issues

1. **Iframe Container Filling** — Napplet iframes should fill the space of their container
2. **Topology Line Routing** — Lines connecting nodes should use 90-degree turns instead of curves
3. **Line Endpoint Offset** — Input/output line connection points should have visual offset instead of meeting at the same point
4. **Orphan Container Line** — Remove or fix the spurious input/output line to the parent container of napplets that doesn't connect to anything
5. **Service Button Click Handling** — Fix event propagation so service buttons (connect signer, notifications) are clickable without opening the node panel

## Success Criteria

1. Napplet iframe content fills its container without unused whitespace
2. All topology edges render with 90-degree rectilinear routing instead of curves
3. Input and output connection points are visually distinct and offset from each other on nodes
4. No orphan edges connecting to undefined container nodes
5. Service buttons respond to clicks without triggering the node panel open action
