# Phase 113: NUB Config Shim + SDK - Context

**Gathered:** 2026-04-17
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

Complete the `@napplet/nub-config` package by adding `shim.ts` (installer + message handlers + subscriber ref-counting + manifest-meta schema read) and `sdk.ts` (named convenience wrappers), matching the modular NUB pattern from `@napplet/nub-identity`.

Addresses requirements NUB-03, NUB-04. Does NOT wire into core/shim/SDK entry points (that is Phase 115).

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Mirror `packages/nubs/identity/src/shim.ts` and `packages/nubs/identity/src/sdk.ts` for structural conventions. For subscriber management, study `packages/nubs/keys/src/shim.ts` (similar fan-out + ref-counted pattern) if it exists; otherwise derive from identity's request-tracking Map pattern.

The `window.napplet.config` API per the merged NUB-CONFIG spec at /home/sandwich/Develop/nubs/NUB-CONFIG.md:
- `registerSchema(schema, version?): Promise<void>` — rejects with schemaError codes
- `get(): Promise<ConfigValues>`
- `subscribe(callback): Subscription` — immediate initial callback + push updates
- `openSettings({ section? }): void`
- `onSchemaError(callback): () => void` — async error listener
- readonly `schema: ConfigSchema | null`

Shim reads manifest-declared schema from `<meta name="napplet-config-schema" content="{json}">` at install time for synchronous initial state.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/nubs/identity/src/shim.ts` — request tracking Map + correlation ID pattern
- `packages/nubs/identity/src/sdk.ts` — `requireNapplet()` guard pattern + named wrappers
- `packages/nubs/notify/src/shim.ts` — fan-out listener Set pattern (if notify has listeners)
- `packages/nubs/config/src/types.ts` — the message types to import
- `packages/shim/src/index.ts` — where installConfigShim would be mounted in phase 115 (reference only)

### Established Patterns
- Shim file exports `install<Domain>Shim(): void` as the side-effect installer
- Correlation-ID requests tracked in `Map<string, { resolve, reject, timeout }>`
- SDK uses `requireNapplet()` guard throwing if `window.napplet` is absent
- DOMAIN constant imported from ./types.js
- Messages parsed by `type` string prefix matching

### Integration Points
- `window.parent.postMessage()` is the shell-side transport
- `window.addEventListener('message', ...)` handles shell→napplet messages
- Meta tag read via `document.querySelector('meta[name="napplet-config-schema"]')`
- Barrel (src/index.ts) gains re-exports of shim installer + SDK helpers

</code_context>

<specifics>
## Specific Ideas

- Ref-counted subscribers: local Set<callback> — send `config.subscribe` on first add, `config.unsubscribe` on last removal
- Initial-push delivery: on first subscriber, use last-known config (if cached from prior push or get) OR wait for shell's response to config.subscribe — shell MUST send immediate initial push per spec
- Error handling: onSchemaError listeners fire on config.schemaError messages
- readonly schema accessor reflects the most recently registered schema (from manifest or runtime registerSchema call)

</specifics>

<deferred>
## Deferred Ideas

None — this phase completes the package's internal surface. Phase 115 wires it into shim/SDK entry points and adds 'config' to NubDomain.

</deferred>
