---
phase: quick
plan: 260401-obm
type: execute
wave: 1
depends_on: []
files_modified:
  - apps/demo/src/topology.ts
  - apps/demo/index.html
autonomous: false
requirements: []
must_haves:
  truths:
    - "Each topology edge renders exactly one line (not doubled)"
    - "Arrow direction on the single line indicates data flow from parent to child"
    - "Core stack nodes (napplet, shell, ACL, runtime) have increased vertical spacing matching runtime-to-services gap"
    - "Flash animation still works on topology edges"
  artifacts:
    - path: "apps/demo/src/topology.ts"
      provides: "Single-line edge rendering, flash still works"
    - path: "apps/demo/index.html"
      provides: "Increased layout gap for core topology regions"
  key_links:
    - from: "apps/demo/src/topology.ts"
      to: "LeaderLine constructor"
      via: "initTopologyEdges creates one line per edge"
      pattern: "new LeaderLine"
---

<objective>
Fix two visual issues in the demo topology view: (1) remove doubled lines per connection by eliminating the redundant inLine, and (2) increase vertical spacing between core stack nodes to match the runtime-to-services gap.

Purpose: Cleaner, more readable topology diagram.
Output: Updated topology.ts and index.html with visual fixes.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@apps/demo/src/topology.ts
@apps/demo/index.html
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove duplicate inLine and increase node spacing</name>
  <files>apps/demo/src/topology.ts, apps/demo/index.html</files>
  <action>
**In `apps/demo/src/topology.ts` -- `initTopologyEdges()` function (lines ~190-253):**

1. Remove the `inLine` creation block entirely (lines 217-224 that create `new LeaderLine(toEl, fromEl, ...)` and store it as `edge.id + '-in'`). Keep only the `outLine` block (lines 208-215).

2. Remove the `socketGravity` options from the remaining `outLine` since they were only needed to offset the paired lines. The outLine should use:
   ```
   const outLine = new LeaderLine(fromEl, toEl, {
     ...BASE_OPTIONS,
     startSocket: 'bottom',
     endSocket: 'top',
   });
   ```

3. In the `flash()` method (lines ~238-251), remove the `inLine` lookup and iteration. Simplify to only flash the single line:
   ```
   flash(edgeId: string, cls: 'active' | 'amber' | 'blocked'): void {
     const color = cls === 'active' ? COLOR_ACTIVE : cls === 'amber' ? COLOR_AMBER : COLOR_BLOCKED;
     const line = lines.get(edgeId);
     if (!line) return;
     try {
       line.setOptions({ color, size: 3 });
       setTimeout(() => {
         try { line.setOptions({ color: COLOR_RESTING, size: 2 }); } catch { /* best-effort */ }
       }, FLASH_DURATION_MS);
     } catch { /* best-effort */ }
   },
   ```

4. Update the `lines.set()` call to use just `edge.id` as the key (not `edge.id + '-out'`).

**In `apps/demo/index.html` -- CSS styles:**

5. Change `.topology-layout` gap from `12px` to `32px` to increase vertical spacing between core stack regions (napplet grid, shell layer, ACL layer, runtime layer). This brings the core stack spacing closer to the visual gap seen before the services region.

6. Change the `@media (max-width: 768px)` responsive override for `.topology-layout` gap from `10px` to `24px` to maintain proportional spacing on mobile.
  </action>
  <verify>
    <automated>cd /home/sandwich/Develop/napplet && pnpm type-check</automated>
  </verify>
  <done>
    - Each topology edge renders exactly one LeaderLine (no inLine created)
    - The flash() method references lines by edge.id (no '-out'/'-in' suffixes)
    - .topology-layout gap is 32px (24px on mobile)
    - TypeScript compiles without errors
  </done>
</task>

<task type="checkpoint:human-verify">
  <name>Task 2: Verify topology visual fixes</name>
  <files>apps/demo/src/topology.ts, apps/demo/index.html</files>
  <action>
User visually verifies the topology changes in a browser.
  </action>
  <verify>
    <automated>echo "Manual verification required"</automated>
  </verify>
  <done>
    - Each connection shows exactly one line with an arrow
    - Spacing between core stack nodes is visually balanced
    - Edge flash animations work correctly
  </done>
</task>

</tasks>

<verification>
- `pnpm type-check` passes
- No `'-in'` or `'-out'` suffixes in line map keys
- Only one `new LeaderLine` call per edge in the loop
- `.topology-layout` gap value is `32px`
</verification>

<success_criteria>
- Topology edges render as single lines with directional arrows
- Core stack vertical spacing is visually balanced with services gap
- Edge flash animations continue to work correctly
</success_criteria>

<output>
After completion, create `.planning/quick/260401-obm-fix-double-lines-and-increase-node-spaci/260401-obm-SUMMARY.md`
</output>
