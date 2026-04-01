---
status: investigating
trigger: "Service buttons are opening inspector panels when they should not. Test 5 failed."
created: 2026-04-01T13:45:00Z
updated: 2026-04-01T13:45:00Z
---

## Current Focus

hypothesis: The notification node's service buttons are being dynamically added AFTER the node's static summary is rendered. The node-summary element may be a sibling rather than a child of the buttons, or the buttons are being added in a way that bypasses the event handler chain.

test: Determine if the notification buttons are inside or outside the `[data-node-id]` element, and whether stopPropagation() is actually being called when buttons are clicked.

expecting: Discovery of:
1. The actual DOM structure showing where buttons sit relative to the node card
2. Whether stopPropagation() is present in ALL button handlers or if some are missing
3. Whether there's a timing issue with dynamic button injection

next_action: Verify actual DOM structure by checking injectNotificationControls() and how notification buttons are rendered vs how signer buttons are rendered

## Symptoms

expected: Clicking service buttons (signer connect, notification controls) executes the action WITHOUT opening inspector
actual: Buttons open inspector panels (node selection occurs despite stopPropagation)
errors: None visible — silent failure
reproduction: Click "Connect Signer" button or "Create Notification" button in demo
started: After implementing plan 33-05 (stopPropagation was added but didn't work)

## Eliminated

## Evidence

- timestamp: 2026-04-01T13:45:00Z
  checked: main.ts lines 318-395 (all service button handlers)
  found: All 9 button handler blocks DO contain e.stopPropagation() as first statement
  implication: stopPropagation() is present in the code, so the issue is NOT missing calls

- timestamp: 2026-04-01T13:45:30Z
  checked: node-inspector.ts setSelectedNodeId() and showInspector()
  found: showInspector() calls event handler to setSelectedNodeId when an node is clicked
  implication: node selection is being triggered somehow, but not by the buttons themselves

- timestamp: 2026-04-01T13:46:00Z
  checked: main.ts wireNodeSelection() function (lines 524-549)
  found: Node selection handler is registered with: `el.addEventListener('click', (event) => { ... setSelectedNodeId(nodeId) })`
  implication: The handler is attached to the node element itself via `for (const el of allNodes)` where `allNodes = document.querySelectorAll('[data-node-id]')`

- timestamp: 2026-04-01T13:46:30Z
  checked: HTML structure in index.html and topology.ts rendering
  found: Service buttons are injected INTO the node card via template.importNode() or added to updateSignerNodeDisplay()
  implication: Buttons ARE children of the [data-node-id] element, so stopPropagation() should work

- timestamp: 2026-04-01T13:47:00Z
  checked: wireNodeSelection() and document click handler registration order
  found: wireNodeSelection() adds listener to [data-node-id] elements AFTER document listener is registered
  implication: Event listeners are registered in this order: 1) document click handler, 2) individual node handlers. Both will fire if event bubbles.

- timestamp: 2026-04-01T13:48:00Z
  checked: Actual HTML hierarchy - is the button INSIDE the node element with [data-node-id]?
  found: Signer buttons are inserted into signerNode via `signerNode.insertBefore(child, nodeSummary)` or innerHTML. Notification buttons are injected via template.importNode() into `notifServiceNode.appendChild(clone)`. Both nodes have [data-node-id] attribute.
  implication: Buttons ARE nested inside the node element. When clicked, event bubbles to node element listener.

- timestamp: 2026-04-01T13:49:00Z
  checked: Can stopPropagation() prevent bubbling from button to node listener?
  found: Yes, it works according to DOM spec. BUT there's a timing issue: the document listener calls stopPropagation(), so node listeners shouldn't fire.
  implication: The problem may be that node listeners were registered BEFORE buttons were created, or handlers are being re-registered.

- timestamp: 2026-04-01T13:50:00Z
  checked: When is wireNodeSelection() called vs when are buttons dynamically added?
  found: wireNodeSelection() is called once on line 549 (after all static HTML is rendered). Signer buttons are added DYNAMICALLY in onStateChange callback. Notification buttons are injected in IIFE on line 190 (before wireNodeSelection).
  implication: Signer buttons may not have node selection handlers at all! The buttons are added to signerNode AFTER wireNodeSelection() runs.

- timestamp: 2026-04-01T13:52:00Z
  checked: Actual test 5 in demo-notification-service.spec.ts (line 128-145)
  found: Test clicks "#notification-node-dismiss" button and expects notification-list item count to decrease. Test is specifically testing that the dismiss action executes WITHOUT opening any inspector.
  implication: The issue is that clicking "dismiss latest" button is opening the signer or runtime node inspector, not the notification inspector.

- timestamp: 2026-04-01T13:53:00Z
  checked: DOM structure after signer button insertion via updateSignerNodeDisplay()
  found: Signer buttons are inserted via innerHTML into the signerNode via insertBefore(). The buttons are children of the #topology-node-service-signer element (which has [data-node-id]). Since this happens AFTER wireNodeSelection(), the node's click listener is already registered and WILL fire when button is clicked.
  implication: The stopPropagation() call in the document listener MUST fire BEFORE the node listener. Since document is an ancestor of the node, and both use addEventListener() without useCapture, both fire during the bubbling phase. Document listener fires AFTER the node listener during bubbling.

**ACTUAL ROOT CAUSE IDENTIFIED:**

Event bubbling with nested listeners:
```
DOM: <article [data-node-id]>
       <button>...</button>
     </article>
```

When button is clicked during BUBBLING phase:
1. Article listener fires first (closest ancestor)
2. Article listener calls setSelectedNodeId(nodeId) and then e.stopPropagation()
3. Propagation STOPS
4. Document listener never fires
5. Button's actual handler (in document listener) never executes
6. Inspector opens due to node selection (side effect)

The problem is the **node listener calls stopPropagation() UNCONDITIONALLY**. It should skip buttons entirely.

## Resolution

root_cause: The wireNodeSelection() function (line 527-544) registers click listeners on [data-node-id] elements that call setSelectedNodeId() and stopPropagation() for ALL clicks, including clicks on buttons inside the node. This prevents the document listener (which has the actual button action handlers) from executing.

The plan 33-05 attempted to fix this by adding stopPropagation() to document listener button handlers, but this doesn't work because the node listener fires first and already stopped propagation.

fix: Add a button check in the wireNodeSelection() node listener. If the click target is a button (or inside a button), return early without calling setSelectedNodeId(). This allows the click to bubble to the document listener where the button handler will call stopPropagation() if needed.

The fix should be in main.ts lines 527-544, changing:
```typescript
el.addEventListener('click', (event) => {
  event.stopPropagation();
  const nodeId = el.getAttribute('data-node-id');
  if (nodeId) {
    setSelectedNodeId(nodeId);
    ...
  }
});
```

To:
```typescript
el.addEventListener('click', (event) => {
  // Skip button clicks - let document listener handle them
  if ((event.target as HTMLElement).closest('button')) {
    return; // Don't select node; let click bubble to document listener
  }
  event.stopPropagation();
  const nodeId = el.getAttribute('data-node-id');
  if (nodeId) {
    setSelectedNodeId(nodeId);
    ...
  }
});
```

verification: [PENDING - needs manual test]
files_changed: [apps/demo/src/main.ts - wireNodeSelection() function]
