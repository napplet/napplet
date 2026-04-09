# Phase 84: Spec Gap Inventory - Research

**Researched:** 2026-04-08
**Question:** What do I need to know to document every spec gap in the napplet codebase?

## Summary

Phase 84 requires creating an exhaustive inventory of code not covered by NIP-5D or any NUB spec. This research maps every export, constant, type, and behavior in the codebase to determine spec coverage.

## NIP-5D Coverage Map

NIP-5D defines:
1. **Transport** — postMessage with `allow-scripts` sandbox, `MessageEvent.source` identity
2. **Wire Format** — `{ type: "domain.action", ...payload }` JSON envelope
3. **Identity** — Shell maps `MessageEvent.source` to `(dTag, aggregateHash)` at iframe creation
4. **Manifest** — `requires` tags for NUB negotiation (NIP-5A)
5. **Runtime Query** — `window.napplet.shell.supports()` for NUB/permission/service queries
6. **NUB Framework** — Extension specs define domain-specific message types
7. **Security** — Sandbox enforcement, source verification, aggregate hash checking

NIP-5D explicitly does NOT define:
- Specific message types (delegated to NUB specs)
- ACL/capability enforcement details
- Storage scoping rules
- Protocol versioning
- Any constants or magic values

## NUB Spec Coverage

Five NUB domains exist with typed message definitions:

| NUB | Package | Message Types | Spec Status |
|-----|---------|--------------|-------------|
| relay | @napplet/nub-relay | relay.subscribe, relay.event, relay.eose, relay.close, relay.closed, relay.publish, relay.publish.result, relay.query, relay.query.result | Draft NUB spec |
| signer | @napplet/nub-signer | signer.getPublicKey, signer.signEvent, signer.getRelays, signer.nip04.encrypt/decrypt, signer.nip44.encrypt/decrypt + results | Draft NUB spec |
| storage | @napplet/nub-storage | storage.get, storage.set, storage.remove, storage.keys + results | Draft NUB spec |
| ifc | @napplet/nub-ifc | ifc.emit, ifc.subscribe, ifc.subscribe.result, ifc.unsubscribe, ifc.event + 9 channel messages | Draft NUB spec |
| theme | @napplet/nub-theme | theme.get, theme.get.result, theme.changed | Draft NUB spec |

## Gap Analysis: File-by-File

### packages/core/src/types.ts

**Spec-backed:**
- `NostrEvent` — NIP-01 standard, referenced by NIP-5D
- `NostrFilter` — NIP-01 standard
- `Subscription` — Interface for NUB subscription handles
- `EventTemplate` — Used by relay and signer NUBs
- `NappletGlobal` — Defines window.napplet shape (NIP-5D section on runtime query)

**NOT spec-backed (GAP-01):**
- `Capability` type — String union of ACL capabilities (`relay:read`, `relay:write`, `cache:read`, `cache:write`, `hotkey:forward`, `sign:event`, `sign:nip04`, `sign:nip44`, `state:read`, `state:write`)
- `ALL_CAPABILITIES` constant — Array of all Capability values

Evidence: NIP-5D says "Storage isolation, signing safety, relay access control, and ACL enforcement are defined by their respective NUB specs" — but no NUB spec actually defines these capability strings. The ACL package was extracted to a separate repo in v0.13.0 but these types remain.

### packages/core/src/topics.ts

**NOT spec-backed (GAP-02):**
All 28 TOPICS entries. These are IPC-PEER topic constants from the pre-v4 kind 29003 era. NIP-5D says nothing about topic constants. The IFC NUB defines message types but not topic string constants.

Breakdown by category:
- **Future NUB**: `chat:open-dm`, `profile:open`, `stream:channel-switch`, `stream:current-context-get`, `stream:current-context` — These represent cross-napplet coordination patterns that could become NUB messages
- **Superseded**: `STATE_*` (6 topics) — Replaced by `storage.*` NUB messages; `AUTH_IDENTITY_CHANGED` — AUTH was removed in v0.15.0
- **Unknown**: `keybinds:*` (6 topics), `audio:*` (4 topics), `wm:focused-window-changed`, `shell:config-*` (3 topics), `relay:scoped-*` (3 topics)

### packages/core/src/constants.ts

**NOT spec-backed (GAP-03, GAP-04, GAP-05):**
- `SHELL_BRIDGE_URI = 'napplet://shell'` — JSDoc says "Used in NIP-42 AUTH relay tags to distinguish shell messages from real relays" but NIP-42 AUTH was removed in v0.15.0. NIP-5D does not define this URI.
- `REPLAY_WINDOW_SECONDS = 30` — Replay protection window. NIP-5D mentions nothing about replay detection.
- `PROTOCOL_VERSION = '4.0.0'` — NIP-5D does not define a version constant. The spec itself is versionless (Nostr NIP convention).

### packages/core/src/envelope.ts

**Spec-backed:**
- `NappletMessage` — Base interface with `type` field (NIP-5D wire format)
- `NubDomain` — String union of NUB domains (NIP-5D NUB framework)
- `NUB_DOMAINS` — Runtime constant array
- `NamespacedCapability` — Type for `shell.supports()` (NIP-5D runtime query)
- `ShellSupports` — Interface for `supports()` (NIP-5D runtime query)
- `NappletGlobalShell` — Shell namespace type

### packages/core/src/dispatch.ts

**Partially spec-backed:**
- `createDispatch()`, `registerNub()`, `dispatch()`, `getRegisteredDomains()` — NIP-5D says "Messages with an unrecognized type MUST be silently ignored" and "NUB specs define the valid type strings." The dispatch infrastructure is the SDK's implementation of this routing. It's an SDK convenience, not a spec requirement.

Category: **shell-only** — Implementation detail of how the SDK routes messages. Any implementation could handle this differently.

### packages/shim/src/nipdb-shim.ts

**NOT spec-backed (GAP-06):**
The entire file. Installs `window.nostrdb` with methods: `query`, `add`, `event`, `replaceable`, `count`, `supports`, `subscribe`. Uses `nostrdb.*` envelope messages (`nostrdb.request`, `nostrdb.result`, `nostrdb.event-push`). This is a parallel protocol for NIP-DB local cache access — not a NUB, not in NIP-5D, no spec of any kind.

### packages/shim/src/keyboard-shim.ts

**NOT spec-backed (GAP-07):**
The entire file. Sends `keyboard.forward` envelope messages to the parent shell for hotkey forwarding. Not a NUB domain, not in NIP-5D. Related to the `hotkey:forward` capability in the ACL system (also unspecified).

### packages/nubs/ifc/src/types.ts

**Partially spec-backed (GAP-09):**
- Topic pub/sub messages (5 types): `ifc.emit`, `ifc.subscribe`, `ifc.subscribe.result`, `ifc.unsubscribe`, `ifc.event` — These ARE implemented in the shim and used
- Channel messages (9 types): `ifc.channel.open`, `ifc.channel.open.result`, `ifc.channel.emit`, `ifc.channel.event`, `ifc.channel.broadcast`, `ifc.channel.list`, `ifc.channel.list.result`, `ifc.channel.close`, `ifc.channel.closed` — Types defined but NO shim implementation exists. The shim's index.ts only imports topic-related IFC types.

### packages/shim/src/relay-shim.ts

**Spec-backed:** Uses relay NUB message types correctly. The `options` parameter with `{ relay, group }` for scoped relay subscriptions is the only potential gap — this maps to GAP-02's `relay:scoped-*` TOPICS entries.

### packages/shim/src/state-shim.ts

**Spec-backed:** Uses storage NUB message types correctly. `REQUEST_TIMEOUT_MS = 5000` is a local implementation constant, not a gap (it's not exported or protocol-level).

### packages/shim/src/index.ts

**Mostly spec-backed:** The main installer correctly wires up NUB-backed APIs. Potential gaps:
- `extraTags` parameter on `emit()` — Legacy parameter from kind 29003 era, ignored in envelope format
- Synthetic `NostrEvent` construction in `on()` — Creates fake NostrEvent objects for backward compat with the NappletGlobal type

## Additional Gaps Found During Audit

### GAP-10 (New): NappletGlobal type discrepancies

The `NappletGlobal` interface in `types.ts` defines the shape of `window.napplet` but includes some elements not in any spec:
- `relay.subscribe` `options` parameter with `{ relay, group }` — The relay NUB spec `RelaySubscribeMessage` does include `relay?: string` but NOT `group?: string`. The `group` field is for NIP-29 groups, which is not part of any NUB spec.
- `ipc.emit` `extraTags` parameter — Legacy NIP-01 array format parameter, meaningless in JSON envelope era

### GAP-11 (New): Dispatch infrastructure as exported API

`createDispatch`, `registerNub`, `dispatch`, `getRegisteredDomains` are exported from `@napplet/core` as public API. These are shell-side implementation helpers — napplets never call them. NIP-5D doesn't prescribe any dispatch mechanism.

## Validation Architecture

### Completeness Check
- Every exported symbol from core/index.ts has been categorized
- Every file in shim/src/ has been reviewed
- Every NUB type file has been cross-referenced
- NIP-5D has been read in full (116 lines)

### Evidence Standards
Each gap entry needs:
1. File path and line numbers
2. What the code does (functional description)
3. Why it's not spec-backed (cross-reference to NIP-5D and NUB specs)
4. Recommendation category with reasoning

## RESEARCH COMPLETE
