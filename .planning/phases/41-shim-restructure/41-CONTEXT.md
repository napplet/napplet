# Phase 41: Shim Restructure - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Convert `@napplet/shim` from a named-export library into a pure side-effect-only window installer. The package gains zero named exports — importing it is a side-effect that installs a fully namespaced `window.napplet` global with `relay`, `ipc`, `services`, and `storage` sub-objects. Remove all deprecated symbols. The `window.nostr` NIP-07 installation and keyboard/nostrdb shims are unchanged — only `window.napplet` shape and export policy are in scope.

</domain>

<decisions>
## Implementation Decisions

### Export Policy

- **D-01:** `@napplet/shim` has zero named exports including `export type` — PKG-01 applies to all exports, not just runtime value exports. Importing the shim is strictly a side-effect operation. TypeScript's `import type { X } from '@napplet/shim'` must produce a compiler error after this phase.
- **D-02:** Protocol types (`NostrEvent`, `NostrFilter`, `ServiceInfo`, `Subscription`, `EventTemplate`) are no longer re-exported from shim. TypeScript consumers must import them from `@napplet/sdk` (Phase 42 will ensure SDK re-exports them).

### window.napplet TypeScript Types

- **D-03:** `@napplet/shim`'s `.d.ts` output includes `declare global { interface Window { napplet: NappletGlobal } }` so that `import '@napplet/shim'` activates IDE autocompletion for `window.napplet.*` without requiring the SDK package.
- **D-04:** Shim owns the global Window augmentation. SDK (Phase 42) may also augment the Window interface for the same type coverage, but shim is the authoritative source for it.

### Claude's Discretion

- **NappletGlobal interface location:** Claude decides. Given that `@napplet/core` is already the zero-dep shared types layer (imported by shim), the `NappletGlobal` type should be defined in `@napplet/core` so both shim (for the Window augmentation) and SDK (Phase 42, for its exports) can reference the same canonical interface without creating a cross-dependency between sibling packages.

### window.napplet.storage API Surface

- **D-05:** `window.napplet.storage` exposes exactly `{ getItem, setItem, removeItem, keys }` per WIN-04 — no `clear()`. The existing `nappletState.clear()` implementation is dropped without replacement. If `clear()` is needed in future it goes through a requirements update.

### Deprecation Removal

- **D-06:** `discoverServices`, `hasService`, `hasServiceVersion` removed from all shim exports and from the `window.napplet` object shape. Replaced exclusively by `window.napplet.services.list()` and `window.napplet.services.has(name, version?)`.
- **D-07:** `nappState`, `nappStorage`, `nappletState` named exports removed from shim. Replaced exclusively by `window.napplet.storage.*`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements

- `.planning/REQUIREMENTS.md` — PKG-01, WIN-01–04, DEP-01–02 define the exact API shape and export policy for this phase

### Protocol Specification

- No external NIP referenced for this phase — requirements are fully captured in REQUIREMENTS.md and decisions above

### Existing Code to Transform

- `packages/shim/src/index.ts` — current shim entry point; exports and window.napplet shape to restructure
- `packages/shim/src/state-shim.ts` — `nappletState` / `nappState` / `nappStorage` exports to remove; object becomes `window.napplet.storage` internals
- `packages/shim/src/discovery-shim.ts` — `discoverServices` / `hasService` / `hasServiceVersion` to replace with `window.napplet.services.list()` / `.has()`
- `packages/shim/src/relay-shim.ts` — `subscribe` / `publish` / `query` named exports removed; functions become `window.napplet.relay.*` internals
- `packages/core/src/` — where `NappletGlobal` type interface should be added (zero-dep shared types layer)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `relay-shim.ts`: `subscribe`, `publish`, `query` functions — same behavior, just stop being named exports; wire into `window.napplet.relay`
- `state-shim.ts`: `nappletState` object — `getItem/setItem/removeItem/keys` methods become `window.napplet.storage`; `clear()` dropped
- `discovery-shim.ts`: `discoverServices`, `hasService`, `hasServiceVersion` — replace with `list()` / `has(name, version?)` wrappers or renames on `window.napplet.services`
- `index.ts`: `emit()` and `on()` functions — move to `window.napplet.ipc.emit` / `.on`; same implementation, just reassigned to the global object

### Established Patterns

- The `window.nostr` NIP-07 installer in `index.ts` is the existing pattern for installing globals — `window.napplet` follows the same pattern but is fully namespaced
- Module-level state (keypair, pendingRequests, etc.) stays private in `index.ts` — no change to internal wiring
- The `_setInterPaneEventSender` / circular-dependency break pattern can remain for `window.napplet.ipc.emit` → storage wiring

### Integration Points

- `window.napplet` object is assigned at module initialization (bottom of index.ts) — same initialization location, expanded shape
- `window.nostr` and `window.nostrdb` installations are unchanged — this phase only touches `window.napplet`
- `@napplet/core` package gets a new `NappletGlobal` type interface exported from its `index.ts`

</code_context>

<specifics>
## Specific Ideas

- The shim's global type augmentation activates on `import '@napplet/shim'` (side-effect import), giving TypeScript napplet authors full `window.napplet.*` autocompletion without needing `@napplet/sdk`
- `window.napplet.services.has(name, version?)` merges old `hasService(name)` and `hasServiceVersion(name, version)` into a single optional-parameter function

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 41-shim-restructure*
*Context gathered: 2026-04-02*
