# Phase 78: Shim & SDK Integration - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase)

<domain>
## Phase Boundary

Shim sends/receives JSON envelope messages (not NIP-01 arrays). SDK re-exports NUB methods as named exports. window.napplet API signatures unchanged.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — infrastructure phase. Key changes:

**Shim (packages/shim/src/index.ts):**
- Replace NIP-01 array postMessage calls with JSON envelope objects
- Replace NIP-01 array parsing in handleRelayMessage with envelope type dispatch
- Current: `window.parent.postMessage(['REQ', subId, ...filters], '*')` → New: `window.parent.postMessage({ type: 'relay.subscribe', id: uuid, subId, filters }, '*')`
- Current: `window.parent.postMessage(['EVENT', event], '*')` → New: `window.parent.postMessage({ type: 'relay.publish', id: uuid, event }, '*')`
- Inbound: switch from `msg[0]` verb to `msg.type` string dispatch
- Signer requests: continue using kind 29001/29002 internally (NUB-SIGNER spec preserves this)
- Storage: replace IPC-based storage ops with `storage.*` envelope messages
- IFC: replace IPC emit/on with `ifc.*` envelope messages
- window.napplet API: same function signatures, same return types

**SDK (packages/sdk/src/index.ts):**
- Re-export NUB module types alongside window.napplet wrappers
- Add per-NUB named exports: `import { RelaySubscribeMessage } from '@napplet/sdk'`

**relay-shim.ts:**
- subscribe() sends `{ type: 'relay.subscribe', ... }` instead of `['REQ', ...]`
- publish() sends `{ type: 'relay.publish', ... }` instead of `['EVENT', ...]`
- close sends `{ type: 'relay.close', ... }` instead of `['CLOSE', ...]`

**state-shim.ts:**
- Replace IPC-based storage with `storage.*` envelope messages

</decisions>

<code_context>
## Existing Code Insights

Current shim at packages/shim/src/ uses NIP-01 arrays everywhere. The relay-shim.ts, index.ts, state-shim.ts, keyboard-shim.ts, nipdb-shim.ts all need updating. The NUB message types from Phase 77 are available in packages/nubs/{relay,signer,storage,ifc}/src/types.ts.

</code_context>

<specifics>
## Specific Ideas

No specific requirements.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
