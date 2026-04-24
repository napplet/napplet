# Phase 137: `@napplet/nub/connect` + `@napplet/nub/class` Subpath Scaffolds - Context

**Gathered:** 2026-04-21
**Status:** Ready for planning
**Mode:** Smart discuss — 1 grey area (4 questions) resolved with user

<domain>
## Phase Boundary

Author two new NUB subpaths under `packages/nub/src/`: `connect/` (4 files + 4 subpath exports) and `class/` (4 files + 4 subpath exports). Each subpath follows the established v0.28.0 `@napplet/nub/resource` template: `types.ts` (DOMAIN const + interfaces), `shim.ts` (installer that populates `window.napplet.<domain>`), `sdk.ts` (thin named-export wrappers for bundler consumers), `index.ts` (barrel + `registerNub` side-effect on import).

**In scope:**
- `packages/nub/src/connect/{types,shim,sdk,index}.ts` — 4 new files
  - `types.ts`: `DOMAIN = 'connect'` const, `NappletConnect` interface matching `packages/core/src/types.ts` structural shape exactly, pure `normalizeConnectOrigin(origin: string): string` function (shared source of truth for build-side and shell-side; exported from types.ts so the vite-plugin can import it in Phase 138)
  - `shim.ts`: `installConnectShim()` reads `<meta name="napplet-connect-granted" content="origin1 origin2 ...">`, parses whitespace-separated origins, populates `window.napplet.connect` as readonly state with defaults `{granted: false, origins: []}`
  - `sdk.ts`: thin readonly-getter wrappers — `connectGranted(): boolean` and `connectOrigins(): readonly string[]`
  - `index.ts`: barrel re-exporting types + shim + sdk; `registerNub(DOMAIN, noop)` side-effect on import
- `packages/nub/src/class/{types,shim,sdk,index}.ts` — 4 new files
  - `types.ts`: `DOMAIN = 'class'` const, `ClassAssignedMessage` wire type (`{ type: 'class.assigned'; id: string; class: number }`), optional `NappletClass` interface for the runtime state shape
  - `shim.ts`: `installClassShim()` registers a dispatcher handler for `class.assigned` envelopes; on receipt, writes the assigned number to `window.napplet.class` (readonly getter); default `undefined` until wire arrives; idempotent re-assignment (last write wins) for future dynamic-class extension
  - `sdk.ts`: thin readonly-getter wrapper — `getClass(): number | undefined`
  - `index.ts`: barrel re-exporting types + shim + sdk; `registerNub(DOMAIN, handler)` side-effect registering the class.assigned handler
- `packages/nub/package.json` — add 8 new subpath exports (`./connect`, `./connect/types`, `./connect/shim`, `./connect/sdk`, `./class`, `./class/types`, `./class/shim`, `./class/sdk`)
- `packages/nub/tsup.config.ts` — add 8 new entry points matching the subpath structure

**Out of scope (future phases):**
- Central `@napplet/shim` integration (Phase 139 — installConnectShim/installClassShim bootstrap call; `window.napplet.{connect,class}` mount)
- Central `@napplet/sdk` integration (Phase 139 — re-exports)
- `@napplet/vite-plugin` changes (Phase 138 — imports `normalizeConnectOrigin` from nub/connect/types)
- Shell-side implementation (downstream shell repo)

</domain>

<decisions>
## Implementation Decisions

### Grey Area 1/1: Subpath Surface Decisions — RESOLVED

- **Q1 — `connect/sdk.ts` shape:** Include thin readonly getters (`connectGranted(): boolean`, `connectOrigins(): readonly string[]`). Parallel to `packages/nub/src/resource/sdk.ts`; lets `@napplet/sdk` consumers use named imports instead of reaching into `window.napplet.connect`. Very small surface (~10 LOC).
- **Q2 — `class/sdk.ts` shape:** Include thin readonly getter (`getClass(): number | undefined`). Same rationale as Q1.
- **Q3 — Shell-injected meta tag name:** `napplet-connect-granted` (verbose). Matches existing precedents (`napplet-aggregate-hash`, `napplet-config-schema`, `napplet-type`).
- **Q4 — IPv6/IPv4 literal policy in `normalizeConnectOrigin()`:** Accept IPv4 literals (including localhost `127.0.0.1` and any valid IPv4 in dotted-decimal form); **reject IPv6 literals** for v1 (bracket-notation edge cases deferred to v2 or follow-up issue). Cleartext `http://localhost` + `http://127.0.0.1` are secure-context exceptions per NUB-CONNECT draft.

### Additional locked decisions (carried from CONTEXT / design)

- NUB-CONNECT has ZERO wire protocol. `connect/shim.ts` does NOT register an envelope handler — it's a pure meta-tag reader.
- NUB-CLASS has a wire. `class/shim.ts` registers exactly one envelope handler (`class.assigned`). Shell sends one terminal envelope per lifecycle; idempotent re-assignment supports future dynamic-class extension without breaking the v1 contract.
- `window.napplet.connect` defaults to `{granted: false, origins: []}` (never undefined) — shim graceful-degradation contract.
- `window.napplet.class` defaults to `undefined` (never 0, never null) — shim graceful-degradation contract.
- Shared `normalizeConnectOrigin(origin: string): string` lives in `packages/nub/src/connect/types.ts` and is imported by both vite-plugin (Phase 138) and shell implementations. Single source of truth.
- Tree-shaking contract: both `./connect/types` and `./class/types` are types-only entrypoints — zero runtime code emission for pure `import type` consumers.
- Subpath exports added to `packages/nub/package.json`: total count goes from 38 (v0.28.0) → 46 (add 8 for connect + class).

### Claude's Discretion

All implementation details not covered above (internal helper function names, exact JSDoc wording, error-message strings, test fixture values) are at Claude's discretion during planning/execution. The shapes above are locked.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets

- `packages/nub/src/resource/` (v0.28.0 Phase 126) — STRUCTURAL TEMPLATE for both connect and class subpaths. Same file layout (types/shim/sdk/index), same barrel pattern with `registerNub` side-effect, same tree-shake contract.
- `packages/nub/src/config/shim.ts` — meta-tag-reader precedent for NUB-CONNECT (reads `<meta name="napplet-config-schema">`)
- `packages/nub/src/relay/shim.ts` or other wire-handler NUB — dispatcher-handler precedent for NUB-CLASS
- `packages/core/src/types.ts` — `NappletGlobal.connect` structural type; `NappletConnect` in this package must match exactly (verifiable via structural equality test)
- `packages/nub/package.json` — current subpath exports map (38 entries before this phase)
- `packages/nub/tsup.config.ts` — current entry points
- `.planning/milestones/v0.28.0-phases/126-resource-nub-scaffold-data-scheme/` — 4-file NUB subpath structural precedent

### Established Patterns

- NUB packages own ALL logic — types, shim code, SDK helpers (per memory `feedback_nub_modular.md`)
- Shim installers are named `install<Name>Shim` (e.g., `installResourceShim`, now `installConnectShim`, `installClassShim`)
- Barrel `index.ts` re-exports from its siblings and calls `registerNub(DOMAIN, handler)` at module-evaluation time; for NUBs with no wire protocol, the handler is a noop function
- SDK files export thin named wrappers — no heavy logic, just typed getters around `window.napplet.<domain>` access

### Integration Points

- **Produces:** 8 new files under `packages/nub/src/` + 2 config files updated (`package.json`, `tsup.config.ts`)
- **Consumed by (future phases):** Phase 138 imports `normalizeConnectOrigin` from `@napplet/nub/connect/types`; Phase 139 imports `installConnectShim` + `installClassShim` into `@napplet/shim`
- **Structural dependency on:** Phase 136's core type-surface additions (already landed) — `NubDomain` contains `'connect'` + `'class'`, `NappletGlobal` has `connect` + `class?` fields

</code_context>

<specifics>
## Specific Ideas

- `normalizeConnectOrigin(origin)` should throw on invalid origins with a `[@napplet/nub/connect]` error-message prefix so callers (vite-plugin Phase 138; shell implementations) produce actionable diagnostics. Error cases to cover: unknown scheme; uppercase host; wildcard; path/query/fragment present; default port (443/80 by scheme); non-Punycode IDN (e.g., `café.example.com` should throw — caller is expected to convert to `xn--caf-dma.example.com` before calling).
- IPv4 acceptance: accept any valid dotted-decimal IPv4 including `127.0.0.1`, `10.0.0.1`, etc. Validation logic: split on `.`, expect 4 octets each 0-255. Do not accept shortened or mixed forms.
- IPv6 rejection: if the host starts with `[` or contains `:` (post-port-strip), throw with a clear error mentioning v1 scope.
- Tree-shake verification — Phase 142 VER-03 extends the existing v0.26.0/v0.28.0 harness with two new types-only consumer cases (one for `@napplet/nub/connect/types`, one for `@napplet/nub/class/types`). Authored in Phase 142, not Phase 137. Phase 137's task set should produce emit-sizes that will make the Phase 142 test pass (by keeping types.ts runtime-empty).
- ClassAssignedMessage id field: follow NIP-5D convention (correlation id is optional for terminal envelopes, but keeping `id: string` required matches existing NUB envelope types and makes replay/correlation trivial for implementers).

</specifics>

<deferred>
## Deferred Ideas

- IPv6 literal support in `normalizeConnectOrigin()` — follow-up issue or v2
- Dynamic mid-session class re-assignment — out of v0.29.0 entirely (NUB-CLASS wire explicitly "at-most-one terminal envelope per lifecycle"); idempotent handler is scaffolding for future extensibility but behavior is locked at v1
- Central shim/SDK integration — Phase 139 scope
- Vite-plugin consumption of `normalizeConnectOrigin` — Phase 138 scope

</deferred>
