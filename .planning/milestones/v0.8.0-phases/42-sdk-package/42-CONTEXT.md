# Phase 42: SDK Package - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Create `@napplet/sdk` — a new standalone workspace package that provides named exports wrapping `window.napplet.*` for bundler-consuming developers. The package has no dependency on `@napplet/shim` in its package.json; it delegates to the `window.napplet` global at call time. All protocol types are re-exported from `@napplet/core`. This phase is new package scaffolding + thin wrapper code only — no changes to the shim, shell, or runtime.

</domain>

<decisions>
## Implementation Decisions

### Runtime Guard Behavior

- **D-01:** Each SDK method checks for `window.napplet` before delegating and throws a clear, actionable error if absent: `"window.napplet not installed — import @napplet/shim first"`. No silent stubs, no native TypeError from undefined property access. Developer experience is the priority.

### Window Type Augmentation

- **D-02:** `@napplet/sdk` includes `declare global { interface Window { napplet: NappletGlobal } }` in its `.d.ts` output — the same augmentation that shim provides. TypeScript consumers who import only SDK (not shim) get full `window.napplet.*` autocompletion. Both shim and SDK reference `NappletGlobal` from `@napplet/core` — no duplication.

### Export Surface

- **D-03:** Single entry point only — `import { relay, ipc, services, storage } from '@napplet/sdk'`. No sub-path exports (`@napplet/sdk/relay`, etc.). SDK is a thin delegation layer with a tiny bundle; sub-paths add maintenance overhead with no tree-shaking benefit.

### Package Dependencies

- **D-04:** `@napplet/sdk` depends on `@napplet/core` for protocol types. No dependency on `@napplet/shim` (PKG-03). No `nostr-tools` peer dependency — SDK has no direct nostr-tools usage; all nostr-tools operations happen inside the shim at runtime. Types (`NostrEvent`, `NostrFilter`, etc.) come from `@napplet/core`.

### Claude's Discretion

- **NappletGlobal reference:** SDK imports `NappletGlobal` from `@napplet/core` (decided in Phase 41 as Claude's Discretion — core is the authoritative types layer). The Window augmentation in SDK's `.d.ts` uses this same import.
- **Wrapper implementation style:** Claude decides whether each namespaced object is implemented as a static object with methods that lazily access `window.napplet.*` at call time, or as a `Proxy`. Static objects are simpler and match the codebase convention.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements

- `.planning/REQUIREMENTS.md` — PKG-02, PKG-03, SDK-01, SDK-02, SDK-03 define the exact package structure, export policy, and type requirements for this phase

### Prior Phase Context

- `.planning/phases/41-shim-restructure/41-CONTEXT.md` — Defines `NappletGlobal` in `@napplet/core`, shim Window augmentation is authoritative, SDK may also augment Window. D-02 and D-04 carry context for SDK's type dependencies.

### Existing Code Patterns to Mirror

- `packages/shim/package.json` — Reference for workspace package structure (type, exports map, files, sideEffects, publishConfig, scripts)
- `packages/shim/src/index.ts` — Existing named-export + window installation pattern; SDK mirrors the named-export surface without the window installation
- `packages/core/src/index.ts` — Where `NappletGlobal` will be added (Phase 41 work); SDK imports `NappletGlobal` from here

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `packages/shim/tsup.config.ts` — Tsup config to copy for SDK (same ESM-only, dts, sourcemap pattern)
- `packages/shim/tsconfig.json` — Tsconfig to copy and adapt for SDK
- `packages/core/src/types.ts` — `NostrEvent`, `NostrFilter`, `ServiceInfo` already live here; SDK re-exports them
- `packages/shim/src/relay-shim.ts` — `Subscription`, `EventTemplate` types to verify location after Phase 41 (may move to core)

### Established Patterns

- Workspace packages use `"type": "module"`, `"sideEffects": false` (SDK has no side effects unlike shim), `"exports"` map with types+import
- Per-package `tsup.config.ts` builds ESM-only with `dts: true`, `sourcemap: true`
- turborepo `turbo.json` pipeline: each package's `build` runs after its deps' `build`

### Integration Points

- `pnpm-workspace.yaml` — add `packages/sdk` to workspace packages list
- `turbo.json` — SDK build pipeline inherits from the existing pattern (no special config needed)
- `packages/sdk/package.json` — must declare `@napplet/core: workspace:*` as dependency

</code_context>

<specifics>
## Specific Ideas

- SDK wrapper style: `export const relay = { subscribe: (...args) => { if (!window.napplet) throw new Error('window.napplet not installed — import @napplet/shim first'); return window.napplet.relay.subscribe(...args); }, ... }` — explicit method-by-method, follows existing codebase function style
- `import * as napplet from '@napplet/sdk'` produces `{ relay, ipc, services, storage, ...types }` — structurally identical to `window.napplet` per SDK-03

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 42-sdk-package*
*Context gathered: 2026-04-02*
