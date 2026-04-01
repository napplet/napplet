---
status: diagnosed
trigger: "Investigate demo correctness issues: sessionStorage spec violation, ACL indicator logic, and topology edge routing"
created: 2026-04-01T00:00:00Z
updated: 2026-04-01T01:00:00Z
---

## Current Focus

hypothesis: Three distinct issues with three distinct root causes — all documented with evidence below
test: Full codebase trace completed for all three issues
expecting: N/A — documenting problem space for review
next_action: Present findings to user for review

## Symptoms

expected: |
  1. Napplets in sandboxed iframes must NEVER access sessionStorage/localStorage directly — all storage proxied via shell bridge.
  2. ACL indicators should reflect actual capability state (green = allowed, red = blocked). All enabled = all green.
  3. Topology edges should connect correctly with directional arrows, dynamically resolving node positions.

actual: |
  1. DOMException: "Window.sessionStorage getter: Forbidden in a sandboxed document without the 'allow-same-origin' flag."
  2. All capabilities enabled: most nodes RED. Chat relay:write disabled: services turn GREEN. Logic appears inverted.
  3. Edges not connecting correctly, no directional arrows, lines broken/misrouted.

errors: |
  DOMException: Window.sessionStorage getter: Forbidden in a sandboxed document without 'allow-same-origin' flag.

reproduction: |
  1. Open demo (pnpm dev), open console — error on iframe load.
  2. Load demo, enable all capabilities, observe node colors. Disable relay:write for chat, observe.
  3. Load topology view, observe line routing.

started: v0.6.0 milestone demo phases (27-31). Phase 31 introduced NIP-46 sessionStorage keypair persistence. Phase 28 introduced topology. Phase 27-28 added ACL indicator logic.

## Eliminated

- hypothesis: "Napplet code or @napplet/shim accesses sessionStorage directly"
  evidence: |
    grep for 'sessionStorage' across ALL .ts files in packages/ and apps/ returns ZERO code-level references.
    The shim's napp-keypair.ts was refactored to be ephemeral-only (generateSecretKey() on every load).
    The state-shim.ts routes all storage through postMessage to shell's state-proxy.ts.
    Neither chat/src/main.ts nor bot/src/main.ts reference sessionStorage or localStorage.
    The NIP-46 client (nip46-client.ts) uses in-memory state only.
  timestamp: 2026-04-01T00:30:00Z

- hypothesis: "The ACL panel toggleCapability() function has inverted boolean logic"
  evidence: |
    acl-panel.ts line 66-72: toggle logic is correct — reads current enabled state, inverts it,
    passes newState to toggleCapability(windowId, cap, newState). The shell-host.ts toggleCapability()
    correctly calls grant() when enabled=true and revoke() when enabled=false.
    The bug is NOT in the toggle/grant/revoke path.
  timestamp: 2026-04-01T00:40:00Z

## Evidence

- timestamp: 2026-04-01T00:15:00Z
  checked: "All .ts files in packages/ and apps/ for 'sessionStorage' references"
  found: "ZERO code-level references to sessionStorage. Only documentation files mention it."
  implication: "The sessionStorage DOMException is NOT caused by napplet/shim code. Source is a browser extension content script injected into the sandboxed iframe."

- timestamp: 2026-04-01T00:16:00Z
  checked: "Error trace in symptom report"
  found: "Error trace says 'moz-extension://' — this is a Firefox extension (likely a Nostr signer extension like nos2x or Alby) injecting content scripts into all pages including sandboxed iframes."
  implication: "The extension's content script tries to access sessionStorage inside the sandboxed iframe, which throws because allow-same-origin is not set. This is a browser extension bug, not a napplet code bug."

- timestamp: 2026-04-01T00:20:00Z
  checked: "packages/shim/src/napp-keypair.ts"
  found: "loadOrCreateKeypair() generates a fresh ephemeral keypair on every call (no persistence at all). The old CLAUDE.md description 'Stored in sessionStorage' is stale documentation from pre-refactor."
  implication: "CLAUDE.md line 235 documents outdated behavior. The code was correctly refactored to remove sessionStorage access."

- timestamp: 2026-04-01T00:30:00Z
  checked: "flow-animator.ts — the ONLY code that applies 'active' (green border) and 'blocked' (red border) CSS classes to topology nodes"
  found: |
    flashNode() and flashEdge() apply either 'active' or 'blocked' CSS class for 500ms.
    The decision at line 141-144:
      isOkFalse = msg.verb === 'OK' && msg.raw?.[2] === false
      isClosedDenied = msg.verb === 'CLOSED' && (includes 'denied' or starts with 'blocked:')
      isBlocked = isOkFalse || isClosedDenied
      cls = isBlocked ? 'blocked' : 'active'
    This means: ALL messages that are NOT denials flash GREEN ('active'). Only explicit denial messages flash RED ('blocked').
  implication: "The animation logic itself is correct. If nodes are mostly flashing red when all capabilities are enabled, it means the protocol is actually generating OK:false or CLOSED:denied messages despite all capabilities being granted."

- timestamp: 2026-04-01T00:35:00Z
  checked: "ACL store default policy in packages/shell/src/acl-store.ts"
  found: |
    The ACL store has a PERMISSIVE default: getOrCreate() initializes new entries with ALL_CAPABILITIES granted.
    check() returns TRUE for unknown identities (line 79: if (!entry) return true).
    The demo hook config.getNappUpdateBehavior() returns 'auto-grant' (shell-host.ts line 323).
  implication: "With default permissive policy and all toggles enabled, capabilities should pass. Need to check if the ACTUAL protocol traffic generates denials for another reason."

- timestamp: 2026-04-01T00:40:00Z
  checked: "The full message flow: chat napplet sends messages, runtime dispatches, generates OK responses"
  found: |
    The chat napplet does several things after AUTH:
    1. emit('chat:message', ...) — sends kind 29003 INTER_PANE event (requires relay:write)
    2. publish() — sends kind 1 event via relay-shim (requires relay:write + sign:event)
    3. subscribe() — sends REQ (requires relay:read)
    4. nappState.getItem() / setItem() — sends kind 29003 with state topics (requires state:read/write)

    The demo hooks have MOCK relay pool that does nothing — relayPool.getRelayPool() returns a stub.
    But the chat napplet's publish() call goes through the relay-shim which sends ['EVENT', {...}] with kind=1.
    The runtime's handleEvent() for kind 1 (default case) calls eventBuffer.bufferAndDeliver() then sendOk(true, '').

    HOWEVER: The signer request flow generates an event with kind 29001. If no signer is connected
    (getSigner() returns null), the signer service handler or fallback may return OK:false.
    Also: nappState operations (state:read/state:write) go through state-handler.ts which generates
    OK-like responses via the state response flow.
  implication: |
    The likely cause of "mostly red" is that signer requests are failing (no signer connected by default)
    AND/OR mock relay pool responses are being interpreted as failures. Each failed signer request or
    failed relay operation generates an OK:false or CLOSED message that triggers the RED flash.
    When relay:write is REVOKED, the chat napplet's publish() and emit() are denied at the ACL gate,
    generating explicit "denied: relay:write" CLOSED/OK messages. But crucially, the signer request
    and other paths that would have generated DIFFERENT failures are never reached — so fewer total
    red flashes occur while the green ones from relay:read subscriptions still happen.

    The "inversion" is actually a misinterpretation: it's not that the ACL logic is inverted, it's that
    the demo has structural failures (no real signer, mock relays that don't respond, state proxy timing)
    that generate failure responses. Revoking relay:write PREVENTS those downstream failures from being
    reached, paradoxically making the UI appear "greener."

- timestamp: 2026-04-01T00:45:00Z
  checked: "topology.ts renderDemoTopology() — edge rendering"
  found: |
    Edges are rendered as simple <div> elements with class 'topology-edge':
      renderNodeEdge() returns: <div id="${edgeId}" class="topology-edge" ...></div>
    CSS for .topology-edge (index.html line 14):
      width: 3px; min-height: 28px; margin: 0 auto; border-radius: 999px;
      background: linear-gradient(180deg, #2a2a3a, #202033);
    These are CSS-only vertical bars positioned by flexbox flow, NOT dynamic SVG/canvas lines
    connecting actual node positions. They sit between topology layers in the flex column layout.
  implication: |
    The current edge implementation is purely CSS flexbox — thin vertical bars placed between
    topology sections. They do NOT dynamically connect node positions. They have no directional
    arrows. They cannot "route" between nodes because they're just decorative vertical separators.
    For napplet-to-shell edges in the napplet branch, the bar appears below each napplet card.
    For service edges, the bar appears above each service card.
    The visual connection only works because the layout is a strict vertical column.
    Any layout change (horizontal, grid, etc.) would break the visual connection entirely.

- timestamp: 2026-04-01T00:50:00Z
  checked: "Whether issues are in core packages or demo-only code"
  found: |
    Issue 1 (sessionStorage): NOT in any napplet package code. External browser extension.
    Issue 2 (ACL indicators): The indicator LOGIC is in apps/demo/src/flow-animator.ts (demo-only).
      The underlying protocol failures are from mock hooks in apps/demo/src/shell-host.ts (demo-only).
      The ACL store itself (packages/shell/src/acl-store.ts) is correct.
      The enforce gate (packages/runtime/src/enforce.ts) is correct.
    Issue 3 (topology edges): Entirely in apps/demo/src/topology.ts and apps/demo/index.html (demo-only).
  implication: "All three issues are demo-layer concerns, NOT core/runtime/acl package bugs. The CLAUDE.md stale documentation about sessionStorage is the only thing touching package-level files."

- timestamp: 2026-04-01T00:55:00Z
  checked: "Signer service response when no signer connected — packages/services/src/signer-service.ts"
  found: |
    Line 101-104: const maybeSigner = options.getSigner(); if (!maybeSigner) { sendOk(false, 'error: no signer configured'); return; }
    This confirms: every signer request from chat's publish() flow generates OK:false when no signer is connected.
    The chat napplet's publish() calls window.nostr.signEvent() (NIP-07 proxy in shim/index.ts)
    -> sendSignerRequest('signEvent', {...}) -> kind 29001 event to shell -> signer service
    -> getSigner() returns null -> sendOk(false, 'error: no signer configured')
    -> flow-animator sees OK with raw[2] === false -> RED flash.
  implication: |
    This is the SPECIFIC mechanism causing red flashes with all capabilities enabled:
    1. Chat sends a message via publish()
    2. publish() calls window.nostr.signEvent() (NIP-07 proxy -> kind 29001 signer request)
    3. Shell's signer service calls getSigner() -> null (no signer connected)
    4. Signer service sends OK:false 'error: no signer configured'
    5. Message tap captures OK:false -> flow-animator applies 'blocked' class -> RED flash
    When relay:write is REVOKED: step 2 never happens (the emit() that precedes publish() is
    denied at the ACL gate), so the signer service never receives the request, and no
    'error: no signer configured' OK:false is generated. The relay:read subscription's EOSE
    still generates OK:true -> GREEN flash. This fully explains the apparent "inversion."

## Resolution

root_cause: |
  ISSUE 1 — sessionStorage DOMException:
    NOT A BUG IN NAPPLET CODE. The error originates from a Firefox browser extension
    (moz-extension://) that injects content scripts into sandboxed iframes. The napplet
    shim and all napplet code have ZERO sessionStorage references. The napp-keypair.ts
    was correctly refactored to ephemeral-only in-memory keypairs. The CLAUDE.md
    documentation at line 235 is stale and should be updated to reflect the current
    behavior ("Ephemeral in-memory keypair per page load" not "Stored in sessionStorage").

  ISSUE 2 — ACL indicator inversion:
    NOT AN INVERSION OF ACL LOGIC. The flow-animator.ts correctly colors messages:
    green for OK:true, red for OK:false or CLOSED:denied. The apparent "inversion" is
    caused by STRUCTURAL FAILURES in the demo's mock environment:
    - No real signer connected by default -> signer requests fail -> red flashes
    - Mock relay pool stubs don't respond -> relay operations may timeout/fail -> red flashes
    - When relay:write is REVOKED, the failing paths are never reached (denied at ACL gate
      before hitting signer/relay stubs), so downstream failures don't generate additional
      red flashes. The surviving relay:read subscription path generates green flashes.
    FIX DIRECTION: The demo needs to either (a) suppress red indicator flashes for
    expected demo-environment failures (mock relay/signer not-connected), or (b) provide
    a mock signer and relay that return OK:true, or (c) add a distinct visual state for
    "not applicable" vs "denied."

  ISSUE 3 — Topology edges:
    ARCHITECTURAL LIMITATION. Edges are CSS-only vertical divs (3px wide bars) placed
    by flexbox flow between topology layers. They are NOT dynamic lines connecting node
    positions. They have no directional arrows. The visual "connection" only works
    because the layout is a strict top-to-bottom flex column. Any layout variation
    (side-by-side nodes, grid repositioning) breaks the illusion.
    FIX DIRECTION: Replace CSS bar edges with a proper edge rendering solution:
    - SVG overlay with calculated paths between node element positions
    - A library like Leader Line, jsPlumb, or d3-force for dynamic edge routing
    - CSS-only approach: use CSS lines with arrow pseudo-elements, recalculated on resize
    The topology data model (edges array in buildDemoTopology) is correct and complete;
    only the RENDERING needs replacement.

fix: "Not yet applied — documenting problem space first per user request"
verification: 
files_changed: []
