# Phase 77: NUB Module Scaffold - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement typed message definitions and shim methods for all 4 NUB modules (relay, signer, storage, ifc) based on the NUB specs from napplet/nubs PRs #1-5. Each module exports types and methods. Named imports must work: `import { subscribe } from '@napplet/nub-relay'`.

</domain>

<decisions>
## Implementation Decisions

### NUB-RELAY (9 message types, PR #2)
- Domain: `relay`
- Napplet→Shell: `relay.subscribe`, `relay.close`, `relay.publish`, `relay.query`
- Shell→Napplet: `relay.event`, `relay.eose`, `relay.closed`, `relay.publish.result`, `relay.query.result`
- Correlation: `id` for requests, `subId` for subscription lifecycle
- Events are signed via window.nostr.signEvent() before publishing
- query is convenience: subscribe → collect → close

Payload shapes:
```typescript
{ type: "relay.subscribe", id: string, subId: string, filters: NostrFilter[], relay?: string }
{ type: "relay.close", id: string, subId: string }
{ type: "relay.publish", id: string, event: NostrEvent }
{ type: "relay.query", id: string, filters: NostrFilter[] }
{ type: "relay.event", subId: string, event: NostrEvent }
{ type: "relay.eose", subId: string }
{ type: "relay.closed", subId: string, reason?: string }
{ type: "relay.publish.result", id: string, ok: boolean, eventId?: string, error?: string }
{ type: "relay.query.result", id: string, events: NostrEvent[], error?: string }
```

### NUB-SIGNER (PR #1)
- Domain: `signer`
- Exposed via `window.nostr` (NIP-07 interface)
- Internal protocol: kind 29001 (request) / 29002 (response) — kept as-is from existing shim
- The shim already implements this via sendSignerRequest() — minimal changes needed
- Just needs typed message definitions for the envelope format

### NUB-STORAGE (8 message types, PR #3)
- Domain: `storage`
- Napplet→Shell: `storage.get`, `storage.set`, `storage.remove`, `storage.keys`
- Shell→Napplet: `storage.get.result`, `storage.set.result`, `storage.remove.result`, `storage.keys.result`
- All responses include optional `error` field
- Values are strings, null for missing keys
- Correlation via `id`

Payload shapes:
```typescript
{ type: "storage.get", id: string, key: string }
{ type: "storage.set", id: string, key: string, value: string }
{ type: "storage.remove", id: string, key: string }
{ type: "storage.keys", id: string }
{ type: "storage.get.result", id: string, value: string | null, error?: string }
{ type: "storage.set.result", id: string, error?: string }
{ type: "storage.remove.result", id: string, error?: string }
{ type: "storage.keys.result", id: string, keys: string[], error?: string }
```

### NUB-IFC (15 message types, PR #5)
- Domain: `ifc`
- Two modes: dispatch (topic pub/sub) and channel (point-to-point)

Topic pub/sub:
```typescript
{ type: "ifc.emit", topic: string, payload?: any }
{ type: "ifc.subscribe", id: string, topic: string }
{ type: "ifc.subscribe.result", id: string, error?: string }
{ type: "ifc.unsubscribe", topic: string }
{ type: "ifc.event", topic: string, sender: string, payload?: any }
```

Channel:
```typescript
{ type: "ifc.channel.open", id: string, target: string }
{ type: "ifc.channel.open.result", id: string, channelId?: string, peer?: string, error?: string }
{ type: "ifc.channel.emit", channelId: string, payload?: any }
{ type: "ifc.channel.event", channelId: string, sender: string, payload?: any }
{ type: "ifc.channel.broadcast", payload?: any }
{ type: "ifc.channel.list", id: string }
{ type: "ifc.channel.list.result", id: string, channels: { id: string, peer: string }[] }
{ type: "ifc.channel.close", channelId: string }
{ type: "ifc.channel.closed", channelId: string, reason?: string }
```

Dispatch: each message through ACL individually. Fire-and-forget (emit has no id).
Channel: ACL at open only. channelId is opaque. Sender exclusion on emit.

### Package Structure
Each NUB module at packages/nubs/{domain}/:
- src/types.ts — discriminated union of all message types for this domain
- src/index.ts — re-exports types, registers domain with core dispatch

</decisions>

<code_context>
## Existing Code Insights

Phase 75 created scaffold packages at packages/nubs/{relay,signer,storage,ifc}/ with stub types.
Phase 76 created packages/core/src/dispatch.ts with registerNub/dispatch infrastructure.
Each NUB module already has package.json, tsconfig, tsup.config from Phase 75.

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond the NUB spec payloads above.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
