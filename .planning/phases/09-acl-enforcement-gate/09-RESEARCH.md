# Phase 9: ACL Enforcement Gate - Research

**Researched:** 2026-03-30
**Phase Requirement IDs:** ENF-01, ENF-02, ENF-03, ENF-04, ENF-05

## Research Summary

This phase wires the pure `@napplet/acl` module (from Phase 8) into ShellBridge (renamed in Phase 7) as the single enforcement point for all message paths. The research maps every current ACL check site, identifies the enforcement architecture, and documents the concrete changes needed.

## Current ACL Check Architecture (Pre-Phase 9)

### Scattered Check Sites in pseudo-relay.ts

The current codebase has ACL checks spread across multiple handler functions with inconsistent patterns:

1. **`checkAcl()` helper (line 58-67)** — Private helper that wraps `aclStore.check()`. Resolves identity from `nappKeyRegistry.getEntry(pubkey)`, then calls `aclStore.check(pubkey, dTag, hash, capability)`. Logs denials to console. Returns boolean.

2. **`handleEvent()` (line 255)** — Checks `relay:write` before processing any EVENT verb. Sends `OK false` on denial.

3. **`handleSignerRequest()` (line 373)** — Checks `sign:event` before dispatching signer operations. Sends `OK false` on denial.

4. **`handleReq()` (line 289)** — Checks `relay:read` before creating subscription. Sends `CLOSED subId 'relay:read denied'` on denial.

5. **`handleEvent()` for HOTKEY_FORWARD (line 263)** — Checks `hotkey:forward` inline. No denial response sent (best-effort).

6. **`deliverToSubscriptions()` (line 109)** — Checks `relay:read` on recipient at delivery time. Silently skips delivery on denial.

### Scattered Check Sites in state-proxy.ts

7. **`handleStateRequest()` cases** — Each state operation independently calls `aclStore.check()`:
   - `shell:state-get` (line 70): checks `state:read`
   - `shell:state-set` (line 83): checks `state:write`
   - `shell:state-remove` (line 104): checks `state:write`
   - `shell:state-clear` (line 113): checks `state:write`
   - `shell:state-keys` (line 121): checks `state:read`

### Problems with Current Architecture

1. **No single chokepoint** — ACL checks are in 11+ separate locations across two files.
2. **Inconsistent denial messages** — `handleEvent` sends `'auth-required: relay:write capability denied'` but `handleReq` sends `'relay:read denied'`. No consistent prefix.
3. **Missing checks** — `handleCount()` checks pubkey exists but does NOT check any ACL capability. Audio commands, shell commands, and several inter-pane routes have no ACL checks.
4. **No audit logging** — Only `checkAcl()` logs denials via console.log. Allows are not logged. No structured audit trail.
5. **Direct aclStore dependency** — Both files import `aclStore` directly, not through the pure `@napplet/acl` module that Phase 8 creates.

## Message Type to Capability Mapping

This table maps every message type to the capability(ies) it requires:

| Message Path | Verb | Kind/Topic | Sender Capability | Recipient Capability |
|---|---|---|---|---|
| Publish regular event | EVENT | any non-bus kind | `relay:write` | `relay:read` (at delivery) |
| Publish inter-pane event | EVENT | 29003 (non-state, non-audio, non-shell) | `relay:write` | `relay:read` (at delivery) |
| Signer request | EVENT | 29001 | `sign:event` | N/A |
| Hotkey forward | EVENT | 29004 | `hotkey:forward` | N/A |
| State get/keys | EVENT | 29003 + `shell:state-get/keys` | `state:read` | N/A |
| State set/remove/clear | EVENT | 29003 + `shell:state-set/remove/clear` | `state:write` | N/A |
| Subscribe | REQ | - | `relay:read` | N/A |
| Count | COUNT | - | `relay:read` | N/A |
| Close subscription | CLOSE | - | None (always allowed) | N/A |
| AUTH | AUTH | - | None (pre-auth) | N/A |
| Delivery to recipient | - | - | N/A | `relay:read` |
| Audio commands | EVENT | 29003 + `shell:audio-*` | `relay:write` | N/A |
| Shell commands | EVENT | 29003 + `shell:*` | `relay:write` | N/A |

## Enforcement Architecture Design

### Single `enforce()` Function

```typescript
interface EnforceResult {
  allowed: boolean;
  capability: string;
  identity: Identity;
}

function enforce(
  aclState: AclState,
  identity: Identity,
  capability: number   // bitfield from @napplet/acl
): EnforceResult
```

The enforce function:
1. Calls `@napplet/acl`'s pure `check(state, identity, cap)` function
2. Logs the decision via hooks callback (`onAclCheck`) and event emission (`acl:check`)
3. Returns the result

### `resolveCapabilities()` Pure Function

```typescript
interface CapabilityResolution {
  senderCap: number | null;    // null = no check needed (CLOSE, AUTH)
  recipientCap: number | null; // null = no recipient check needed
}

function resolveCapabilities(msg: unknown[]): CapabilityResolution
```

This function maps each message to the capability bits it requires. It's a pure function — no side effects, no state access. It examines:
- Verb (EVENT, REQ, CLOSE, COUNT, AUTH)
- For EVENT: the event kind
- For kind 29003: the topic tag to distinguish state ops from inter-pane

### Flow: Message -> resolveCapabilities -> enforce -> handler

```
handleMessage(event)
  → identify sender (nappKeyRegistry)
  → resolveCapabilities(msg) → { senderCap, recipientCap }
  → if senderCap: enforce(state, senderIdentity, senderCap) → deny? → sendDenial()
  → handler(msg) → produces response/delivery
  → if delivery: enforce(state, recipientIdentity, recipientCap) → deny? → skip delivery
```

### Denial Response Format

Per CONTEXT.md decisions D-05 through D-09:

| Message Type | Denial Response |
|---|---|
| EVENT (publish) | `['OK', eventId, false, 'denied: relay:write']` |
| EVENT (signer) | `['OK', eventId, false, 'denied: sign:event']` |
| EVENT (state) | `['error', 'denied: state:read']` or `['error', 'denied: state:write']` |
| REQ (subscribe) | `['CLOSED', subId, 'denied: relay:read']` |
| COUNT | `['CLOSED', countId, 'denied: relay:read']` |
| Delivery | Silent skip (no response to sender) |

All use `denied:` prefix + capability name. Machine-parseable and consistent.

## Audit Logging Architecture

Per CONTEXT.md decisions D-10 through D-12:

1. **ShellHooks extension** — Add `onAclCheck?: (identity: Identity, capability: string, decision: 'allow' | 'deny') => void` to ShellHooks.
2. **Event emission** — ShellBridge emits `acl:check` events via `injectEvent('acl:check', { identity, capability, decision })` (or a lighter internal emitter to avoid polluting the event buffer with audit events).
3. **Both allows and denials logged** — Every enforce() call triggers both the hook and the emission.

## Migration Strategy

### What Changes in ShellBridge (pseudo-relay.ts / shell-bridge.ts)

1. **Remove `checkAcl()` helper** — replaced by `enforce()`.
2. **Remove direct `aclStore` import** — replaced by `@napplet/acl` import. The shell maintains an `AclState` instance.
3. **Add `resolveCapabilities()` function** — either in shell-bridge.ts or as a separate `enforce.ts` file.
4. **Add `enforce()` function** — calls `check()` from `@napplet/acl`, logs via hooks.
5. **Modify `handleEvent()`** — replace inline `checkAcl()` calls with `enforce()`.
6. **Modify `handleReq()`** — replace inline `checkAcl()` call with `enforce()`.
7. **Add ACL check to `handleCount()`** — currently missing.
8. **Modify `deliverToSubscriptions()`** — replace inline `checkAcl()` call with `enforce()`.

### What Changes in state-proxy.ts

9. **Accept enforce function as parameter** — Instead of importing `aclStore` directly, `handleStateRequest()` receives the enforce function (or the full ACL state + check function) as a parameter.
10. **Replace all `aclStore.check()` calls** — Use the passed-in enforce function.

### What Changes in types.ts

11. **Extend ShellHooks** — Add `onAclCheck` callback.

## Dependencies and Ordering

- Phase 7 (Nomenclature) must complete first — file is `shell-bridge.ts`, function is `createShellBridge()`.
- Phase 8 (ACL Pure Module) must complete first — `@napplet/acl` package provides `check()`, `AclState`, `Identity`, capability constants.
- This phase produces the enforcement layer that Phase 10 tests against.

## Validation Architecture

### How to Verify Enforcement Completeness

1. **Grep audit** — After implementation, `grep -r 'aclStore\.' packages/shell/src/` should return zero results (all checks go through enforce()).
2. **Single entry point** — `grep -c 'enforce(' packages/shell/src/shell-bridge.ts` should show enforce() called at every handler entry point.
3. **Denial format** — All denial messages in tests should match `denied: {capability}` pattern.
4. **Audit logging** — Test that every enforce() call triggers the hooks callback with correct identity, capability, and decision.

## RESEARCH COMPLETE
