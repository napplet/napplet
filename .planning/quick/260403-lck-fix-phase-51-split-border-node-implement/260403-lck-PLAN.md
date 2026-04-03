---
phase: quick
plan: 260403-lck
type: execute
wave: 1
depends_on: []
files_modified:
  - apps/demo/index.html
  - apps/demo/src/topology.ts
autonomous: true
must_haves:
  truths:
    - "Split-border color overlays are clearly visible as colored left/right border frames around topology nodes"
    - "Node content remains fully readable with opaque background on top of overlays"
    - "Color transitions still animate smoothly at 0.4s ease"
  artifacts:
    - path: "apps/demo/index.html"
      provides: "Updated CSS for split-border overlay approach using padding + inner backgrounds"
    - path: "apps/demo/src/topology.ts"
      provides: "Updated renderColorOverlays() and topology node structure for the new approach"
  key_links:
    - from: "apps/demo/src/main.ts"
      to: "apps/demo/index.html"
      via: "classList.add('node-color-active') applies visible background-color"
      pattern: "node-color-active|node-color-blocked|node-color-amber"
---

<objective>
Fix the split-border directional color overlay implementation on topology nodes.

The current approach uses two absolutely positioned overlay divs with 6% opacity rgba backgrounds — resulting in a nearly invisible faint tint. The intended approach: the `.topology-node` container has padding that creates a visible gap (the "frame"). Two inner overlay divs fill the full node area at low z-index. Content children sit above with an opaque background. The padding gap between the content's opaque area and the node's outer edge exposes the overlay colors underneath, simulating thick colored left/right borders.

Purpose: Make directional message flow colors (inbound/outbound) clearly visible on each topology node, not hidden behind a subtle 6% tint.
Output: Updated CSS and HTML structure so overlays produce a visible colored border frame effect.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@apps/demo/index.html (CSS rules for .node-color-overlay, .node-color-inbound, .node-color-outbound, .topology-node)
@apps/demo/src/topology.ts (renderColorOverlays() function, renderDemoTopology() node structure)
@apps/demo/src/color-state.ts (color state module — no changes needed, but read for understanding)
@apps/demo/src/main.ts (lines 210-234: onColorStateChange listener that applies CSS classes — no changes needed)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update CSS for split-border frame effect</name>
  <files>apps/demo/index.html</files>
  <action>
In `apps/demo/index.html`, update the CSS rules for the split-border overlay system:

1. **Add padding to `.topology-node`** to create the visible frame gap:
   - Add `padding: 4px` (the "frame width" — the colored area visible around content)
   - Keep existing `background`, `border-radius: 16px`, `overflow: hidden`, `position: relative`

2. **Add a content wrapper class `.topology-node-content`** that will wrap all content children inside each node:
   ```css
   .topology-node-content {
     position: relative;
     z-index: 1;
     background: linear-gradient(180deg, rgba(18,18,26,0.95), rgba(10,10,15,0.98));
     border-radius: 12px;
     overflow: hidden;
   }
   ```
   The inner border-radius is 12px (outer 16px minus 4px padding) so the content fits snugly inside the frame. The opaque background hides the overlay colors everywhere except the padding gap. z-index: 1 ensures content sits above the z-index: 0 overlays.

3. **Update `.topology-node` background** — remove (or set to `transparent`) the existing `background: linear-gradient(...)` on `.topology-node` itself. The gradient background now lives on `.topology-node-content` instead. If the node has NO active color overlays, the default appearance should still look essentially the same (dark background, no colored frame). To achieve this, give `.topology-node` a fallback: `background: #12121a` (the approximate solid equivalent of the gradient start). The overlays will paint over this when active. When no overlay class is set, the fallback background blends with the content background, making the 4px frame appear as just a dark edge — nearly invisible until colored.

4. **Update `.node-color-overlay`** rules — keep the existing positioning and transition but no changes needed since the approach is CSS-class-based colors.

5. **Update the color state classes** to use clearly visible colors (NOT 6% opacity):
   ```css
   .node-color-active  { background-color: rgba(57,255,20,0.55); }
   .node-color-blocked { background-color: rgba(255,59,59,0.55); }
   .node-color-amber   { background-color: rgba(255,159,10,0.55); }
   ```
   These are visible at 55% opacity — bold enough to clearly see through the 4px padding gap, but not fully opaque. The `transition: background-color 0.4s ease` already on `.node-color-overlay` handles smooth color changes.

6. **IMPORTANT**: Do not change the `node-box` border styles (`.node-box`, `.node-box.active`, etc.) — those are the outer 3px border used for node state indication (active/blocked/amber). The split-border frame effect is a SEPARATE visual layer inside the border.
  </action>
  <verify>
    <automated>cd /home/sandwich/Develop/napplet && grep -c 'rgba(57,255,20,0.55)' apps/demo/index.html && grep -c 'topology-node-content' apps/demo/index.html && grep -c 'padding: 4px' apps/demo/index.html</automated>
  </verify>
  <done>CSS updated: .topology-node has 4px padding, .topology-node-content class defined with opaque background and z-index:1, color classes use 55% opacity instead of 6%.</done>
</task>

<task type="auto">
  <name>Task 2: Wrap node content in .topology-node-content divs</name>
  <files>apps/demo/src/topology.ts</files>
  <action>
In `apps/demo/src/topology.ts`, update `renderDemoTopology()` and related render functions to wrap all node content (everything after the overlay divs) inside a `<div class="topology-node-content">...</div>` wrapper. This is necessary because the overlays need to sit behind the content area, and the content needs an opaque background to mask the overlays except in the padding gap.

For each `<article>` node in the topology:

1. **Napplet cards** — In the napplet card template, after `${renderColorOverlays(...)}`, wrap everything else in `<div class="topology-node-content">`:
   ```
   <article id="..." class="node-box topology-node topology-napplet-card" ...>
     ${renderColorOverlays(getNappletNodeId(napplet.name))}
     <div class="topology-node-content">
       <div class="topology-node-header">...</div>
       <div class="topology-node-title">...</div>
       <div class="node-summary" ...></div>
       <div id="${napplet.aclId}" class="topology-acl-slot"></div>
       <div id="${napplet.frameContainerId}" class="topology-frame-slot"></div>
     </div>
   </article>
   ```

2. **Shell node** — Same pattern: overlays outside, everything else inside `.topology-node-content`.

3. **ACL node** — Same pattern.

4. **Runtime node** — Same pattern (includes the flow log section).

5. **Service cards** — Same pattern. Note: the service toggle button (`.service-toggle-icon`) with `position:absolute;z-index:10` should remain OUTSIDE the content wrapper (alongside the overlays) since it's absolutely positioned relative to the article. Actually, since it already has z-index:10, it will be above everything regardless. Keep it outside the content wrapper for simplicity.

The `renderColorOverlays()` function itself does NOT change — it still returns two overlay divs. The change is purely in `renderDemoTopology()` where we add the content wrapper after the overlays.

Do NOT change the existing `data-color-overlay` attributes, `data-color-direction` attributes, or any IDs. The `main.ts` code that applies color classes via `querySelector('[data-color-overlay=...]')` must continue to work without changes.
  </action>
  <verify>
    <automated>cd /home/sandwich/Develop/napplet && pnpm type-check 2>&1 | tail -5</automated>
  </verify>
  <done>All topology node articles have content wrapped in `.topology-node-content` div. Overlay divs remain direct children of the article (outside the content wrapper). Type check passes.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Split-border color overlays now use a padding-frame approach: the node has 4px padding, content has an opaque background, and the overlay colors (at 55% opacity) show through the padding gap as visible colored border frames. Left half = inbound color, right half = outbound color.</what-built>
  <how-to-verify>
    1. Run `cd /home/sandwich/Develop/napplet && pnpm dev --filter=demo` to start the demo
    2. Open the playground in a browser
    3. Look at the topology nodes — they should have a thin dark frame (4px) around content when idle
    4. Interact with napplets (send a chat message, trigger bot responses) to generate message flow
    5. Observe that node frames light up with clearly visible colors:
       - Green (left/right halves) for successful message flow
       - Red for blocked messages
       - Amber for mixed/warning states
    6. Verify the color transitions are smooth (0.4s ease)
    7. Verify node content text is fully readable (opaque background covers overlays)
    8. Try switching color modes (rolling/decay/last/trace) — all should work with the new visual
  </how-to-verify>
  <resume-signal>Type "approved" or describe visual issues to fix</resume-signal>
</task>

</tasks>

<verification>
- `pnpm type-check` passes with no errors
- CSS has `.topology-node { padding: 4px }` and `.topology-node-content` class
- Color classes use 55% opacity, not 6%
- All topology nodes have the content wrapper div in the DOM
- `data-color-overlay` query selectors in main.ts still find their targets (no attribute changes)
</verification>

<success_criteria>
- Split-border overlays are clearly visible as colored left/right frame edges around topology nodes
- Color visibility is a significant improvement over the previous 6% opacity tint
- Content remains fully readable with opaque background
- Smooth 0.4s transitions preserved
- No regressions in node clicking, inspector, service toggles, or edge lines
</success_criteria>

<output>
After completion, create `.planning/quick/260403-lck-fix-phase-51-split-border-node-implement/260403-lck-SUMMARY.md`
</output>
