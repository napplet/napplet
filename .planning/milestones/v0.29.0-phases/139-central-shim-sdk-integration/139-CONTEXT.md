# Phase 139: Central Shim + SDK Integration - Context

**Gathered:** 2026-04-21
**Status:** Ready for planning
**Mode:** Smart discuss — decisions locked via established NUB integration precedents

<domain>
## Phase Boundary

Wire `installConnectShim` and `installClassShim` from the Phase 137 subpaths into the central `@napplet/shim` package so `window.napplet.connect` and `window.napplet.class` are populated on every shim-installed napplet. Re-export both surfaces from `@napplet/sdk` for bundler consumers. Closes the Phase 136 pre-existing TS2741 gap (`NappletGlobal.connect` required but shim's `window.napplet` literal missing it).

**In scope:**
- `packages/shim/src/index.ts`:
  - Import `installConnectShim` from `@napplet/nub/connect/shim`
  - Import `installClassShim` from `@napplet/nub/class/shim`
  - Add `connect: { granted: false, origins: [] }` default block to the `window.napplet` literal (required field — this closes TS2741)
  - Add `class: undefined` default (as readonly getter or direct property — whichever matches `window.napplet.class` shape from the class shim)
  - Call `installConnectShim()` at bootstrap (reads meta tag, re-populates connect state)
  - Call `installClassShim()` at bootstrap (registers dispatcher handler via the barrel import side-effect)
- `packages/sdk/src/index.ts`:
  - Re-export types from `@napplet/nub/connect`: `NappletConnect`, `normalizeConnectOrigin`
  - Re-export types from `@napplet/nub/class`: `ClassAssignedMessage`, `NappletClass`
  - Export `DOMAIN as CONNECT_DOMAIN` and `DOMAIN as CLASS_DOMAIN`
  - Export `installConnectShim` and `installClassShim`
  - Export connect SDK helpers (`connectGranted`, `connectOrigins`, `getClass`)

**Out of scope:**
- Shell-deployer policy docs (Phase 140)
- Documentation sweep (Phase 141)
- Verification tests (Phase 142)

</domain>

<decisions>
## Implementation Decisions

### Grey Area 1/1: Central Integration Surface — RESOLVED

- **Q1 registerNub timing:** Eager import at module-init time — matches existing NUB pattern (resource/config/etc.). The barrel `@napplet/nub/class` import registers the handler as a side-effect on load. No lazy state machinery.
- **Q2 SDK re-export shape:** Parallel to resource. Named `installConnectShim`, `installClassShim`, plus `CONNECT_DOMAIN` + `CLASS_DOMAIN` constants, plus all types and helper getters.

### Additional locked decisions

- `window.napplet.connect` defaults to `{ granted: false, origins: [] }` (never undefined) — SHIM-02 graceful-degradation contract. If shell doesn't inject `<meta name="napplet-connect-granted">`, installConnectShim leaves the defaults in place.
- `window.napplet.class` defaults to `undefined` (never 0, never null) — SHIM-04 graceful-degradation contract. If shell doesn't send `class.assigned` envelope, the value stays undefined and napplet must check `shell.supports('nub:class')` before depending on it.
- The shim's dispatcher (existing central routing logic) picks up `class.assigned` envelopes automatically once `@napplet/nub/class` is imported — the barrel's `registerNub(DOMAIN, handleClassMessage as unknown as NubHandler)` side-effect handles registration.
- No central-dispatch router entry needed for NUB-CONNECT (no wire protocol).
- `@napplet/shim` type-check must exit 0 after this phase (closes the TS2741 gap that has been the known gating issue since Phase 136).
- `@napplet/sdk` re-exports mirror `@napplet/shim`'s imports so bundler consumers can choose named-import style over window-property access.
- `pnpm -r type-check` must exit 0 across ALL workspace packages after this phase — no pre-existing gaps remaining.

### Claude's Discretion

All code-level naming (local variable names, import aliases, exact JSDoc wording) at Claude's discretion during planning/execution. The shapes and API surface above are locked.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets

- `packages/shim/src/index.ts` — current state includes `resource`, `relay`, `identity`, `storage`, `ifc`, `theme`, `notify`, `media`, `keys`, `config` namespace blocks on the `window.napplet` literal plus their installer calls. Add `connect` + `class` following the same pattern.
- `packages/sdk/src/index.ts` — current state has `resource` namespace + re-exports. Add `connect` + `class` blocks following the same pattern.
- `packages/nub/src/connect/{index,shim,sdk,types}.ts` — Phase 137 artifacts (available at `@napplet/nub/connect/*`)
- `packages/nub/src/class/{index,shim,sdk,types}.ts` — Phase 137 artifacts (available at `@napplet/nub/class/*`)
- v0.28.0 Phase 128 (Central Shim Integration for resource NUB) and Phase 129 (Central SDK Integration for resource NUB) are structural precedents

### Established Patterns

- `@napplet/shim` is a pure side-effect window installer — zero named exports; populates `window.napplet` at module-init time
- `@napplet/sdk` is a framework-agnostic bundler-facing package — named exports for every user-facing capability
- Each NUB's barrel import side-effect calls `registerNub(DOMAIN, handler)` to register its dispatcher handler
- Default values on `window.napplet.*` namespaces must be set BEFORE calling the installer (the installer conditionally overrides defaults based on runtime state)

### Integration Points

- `packages/shim/src/index.ts` — imports two new shims, adds two namespace blocks to window.napplet, calls two new installers
- `packages/sdk/src/index.ts` — re-exports from two new subpaths
- After this phase: Phase 140 can reference the actual SDK surface in SHELL-CLASS-POLICY.md; Phase 141 can document the window.napplet surface in READMEs

</code_context>

<specifics>
## Specific Ideas

- Import order in `packages/shim/src/index.ts`: keep alphabetical or grouped by domain complexity (runtime-heavy first). Match existing pattern.
- `class` property on window.napplet literal: since the shim installer owns the runtime state, use `Object.defineProperty` with a getter OR a plain `class: undefined` field that the installer overwrites. Check class/shim.ts to see which pattern it assumes.
- SDK re-export grouping: group by NUB (all connect exports together, all class exports together) with a section comment marker — matches resource section in existing SDK.

</specifics>

<deferred>
## Deferred Ideas

- Shell-deployer policy docs (Phase 140)
- Documentation sweep — READMEs need to document the new `window.napplet.connect` / `window.napplet.class` surface (Phase 141)
- Verification tests — integration tests for the wire handlers and graceful degradation (Phase 142 VER-11/12/13)

</deferred>
