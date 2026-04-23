# Phase 9: ACL Enforcement Gate - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire the pure `@napplet/acl` module into ShellBridge as the single enforcement point for all message paths. After this phase, no message reaches a napplet iframe or exits to a relay without an ACL check.

</domain>

<decisions>
## Implementation Decisions

### Enforcement Architecture: Pre-dispatch gate + capability resolver
- **D-01:** Single `enforce()` function called before any handler acts. One chokepoint. Handlers never call ACL directly.
- **D-02:** A separate pure `resolveCapabilities(message) → { sender?: cap, recipient?: cap }` function maps each message type to the capabilities it requires. This is testable independently.
- **D-03:** Flow: `message → resolveCapabilities(message) → enforce(state, identity, caps) → allow → handler` or `→ deny → sendDenial()`.
- **D-04:** Delivery-time recipient checks also go through enforce() — when ShellBridge delivers an event to a napplet, it calls enforce() with the recipient's identity and `relay:read`.

### Denial Response Format: Verb-appropriate + standard `denied:` prefix
- **D-05:** EVENT denied → `['OK', eventId, false, 'denied: relay:write']`
- **D-06:** REQ denied → `['CLOSED', subId, 'denied: relay:read']`
- **D-07:** State ops denied → error tag `['error', 'denied: state:write']` or `['error', 'denied: state:read']`
- **D-08:** Delivery denied (recipient lacks relay:read) → message silently not delivered. No response to sender (sender doesn't know about recipient's ACL state).
- **D-09:** All denial reasons use the `denied:` prefix followed by the capability name. Machine-parseable and consistent.

### Audit Logging: Hooks callback + event emitter
- **D-10:** ShellBridge hooks get an `onAclCheck(identity, capability, decision)` callback. Shell implementor decides what to do (log, ignore, alert).
- **D-11:** ShellBridge also emits `acl:check` events that in-app consumers (like the demo debugger) can subscribe to.
- **D-12:** Every check is logged — both allows and denials. Identity, capability, and decision are included.

### Claude's Discretion
- How to restructure the existing handler functions to call enforce() instead of checkAcl()
- Whether resolveCapabilities needs sub-routing for EVENT kinds (storage events need state:write, inter-pane events need relay:write)
- Internal implementation of the event emitter (custom or existing pattern)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Source Files
- `packages/shell/src/pseudo-relay.ts` (will be `shell-bridge.ts` after Phase 7) — current handler structure with scattered ACL checks
- `packages/shell/src/acl-store.ts` (will be replaced by @napplet/acl after Phase 8) — current check() implementation
- `packages/shell/src/state-proxy.ts` — state request handler with its own ACL checks

### Prior Phase Context
- `.planning/phases/07-nomenclature/07-CONTEXT.md` — ShellBridge rename
- `.planning/phases/08-acl-pure-module/08-CONTEXT.md` — Pure ACL module design: bitfield caps, check(state, identity, cap) → boolean, @napplet/acl package

### Requirements
- `.planning/REQUIREMENTS.md` — ENF-01 through ENF-05

</canonical_refs>

<code_context>
## Existing Code Insights

### Current ACL Check Sites (all need consolidation into enforce())
1. `pseudo-relay.ts` line 246: `checkAcl(pubkey, 'relay:write')` — before publishing
2. `pseudo-relay.ts` line 280: `checkAcl(pubkey, 'relay:read')` — before creating subscription
3. `pseudo-relay.ts` line ~106: `checkAcl(recipientPubkey, 'relay:read')` — delivery-time check (recently added)
4. `pseudo-relay.ts` line 364: `checkAcl(pubkey, 'sign:event')` — before signer request
5. `state-proxy.ts` lines 70,83,104,113,121: `aclStore.check(pubkey, dTag, hash, 'state:read/write')` — multiple state operation checks

### Message Types That Need Capability Resolution
- `EVENT` (kind 29001 signer) → `sign:event`
- `EVENT` (kind 29003 inter-pane, topic shell:state-*) → `state:read` or `state:write`
- `EVENT` (kind 29003 inter-pane, other topics) → `relay:write`
- `EVENT` (any other kind) → `relay:write`
- `REQ` → `relay:read`
- `CLOSE` → no capability needed (always allowed)
- `AUTH` → no capability needed (pre-auth)
- Delivery to recipient → `relay:read` on recipient

</code_context>

<specifics>
## Specific Ideas

- The `resolveCapabilities` function is essentially a routing table that maps (verb, event kind, topic) to capability bits. It should be a pure function in @napplet/acl or in @napplet/shell — wherever makes more sense.
- For state operations, the resolve function needs to look at the topic tag to distinguish read vs write. This means it needs access to parsed message content, not just the verb.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 09-acl-enforcement-gate*
*Context gathered: 2026-03-30*
