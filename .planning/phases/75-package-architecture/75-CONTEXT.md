# Phase 75: Package Architecture - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase)

<domain>
## Phase Boundary

Restructure @napplet packages for modular NUB architecture. Core becomes envelope-only. Create packages/nubs/ directory with the scaffold pattern for NUB modules. Shim/sdk become integration layers that compose NUB modules.

</domain>

<decisions>
## Implementation Decisions

### Directory Structure
- packages/nubs/ directory for modular NUB packages
- Each NUB gets its own subdirectory: packages/nubs/{relay,signer,storage,ifc}/
- Each NUB module exports: types, shim methods, and a domain registration
- Named imports: `import { subscribe } from '@napplet/nubs/relay'`

### Core Changes
- @napplet/core becomes envelope-only: message base type with `type` discriminant, transport types, identity types
- Remove NIP-01 verb constants (already partially done in v0.15.0)
- Add JSON envelope base types: `NappletMessage { type: string }` discriminated union pattern
- Add shell.supports() type infrastructure
- Core does NOT import or know about specific NUBs

### What This Phase Does NOT Do
- Does not implement NUB message types (Phase 77, blocked on specs)
- Does not update the shim message handler (Phase 78)
- Does not change window.napplet API (Phase 78)
- Sets up the PATTERN, not the content

### Package Relationship
```
@napplet/core          — envelope types, transport, identity (NUB-agnostic)
@napplet/nubs/relay    — relay domain types + shim methods (future)
@napplet/nubs/signer   — signer domain types + shim methods (future)
@napplet/nubs/storage  — storage domain types + shim methods (future)
@napplet/nubs/ifc      — ifc domain types + shim methods (future)
@napplet/shim          — window.napplet installer, wires NUB modules
@napplet/sdk           — named exports, re-exports from NUB modules
```

</decisions>

<code_context>
## Existing Code Insights

Current @napplet/core at packages/core/src/ exports:
- types.ts: NostrEvent, NostrFilter, EventTemplate, NappletGlobal, Subscription, etc.
- constants.ts: BusKind enum, PROTOCOL_VERSION, various topic/verb constants
- index.ts: barrel exports

The EventTemplate and NIP-01 types need to move to NUB-RELAY's scope eventually. For now, this phase sets up the scaffold and envelope base types.

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure scaffold phase.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
