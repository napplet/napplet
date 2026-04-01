# Phase 24: Root and Interface READMEs - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Update four existing documentation files to accurately reflect the 7-package v0.4.0 SDK:
- `README.md` (root) — 7-package table + architecture diagrams
- `packages/shim/README.md` — add window.napplet / service discovery API, update nappState
- `packages/shell/README.md` — add RuntimeHooks section + service registry section
- `packages/vite-plugin/README.md` — add requires option documentation

No new code changes to any package. Documentation accuracy work only.

**Carries forward from Phase 23:**
- Same Getting Started / How It Works structure across all READMEs
- Cross-reference between packages where it adds value

</domain>

<decisions>
## Implementation Decisions

### Root README Architecture (README-01)

- **D-01:** Update the packages table to list all 7 packages (`@napplet/shim`, `@napplet/shell`, `@napplet/acl`, `@napplet/core`, `@napplet/runtime`, `@napplet/services`, `@napplet/vite-plugin`) with accurate descriptions.
- **D-02:** Replace the single current ASCII diagram with **two small diagrams**:
  1. **Package dependency graph** — shows how the 7 packages depend on each other (`@napplet/core` at base, `@napplet/acl` and `@napplet/core` → `@napplet/runtime` → `@napplet/shell` layering; `@napplet/shim` and `@napplet/services` on their own paths).
  2. **Runtime communication flow** — shows Shell (host page) ↔ postMessage ↔ Napplet (iframe) with package labels at each side. Same style as the current diagram, updated for 7-package reality.
- **D-03:** Remove stale `createPseudoRelay` references. Update the architecture description to use `createShellBridge` and `ShellBridge`.

### Shim README — nappState Naming (README-02)

- **D-04:** Document `nappState` as the canonical API name throughout. Do not mention `nappStorage` in the README (it is an exported alias, not the documented name).
- **D-05:** Add a new **Service Discovery** section documenting `window.napplet` global and the three discovery functions: `discoverServices()`, `hasService()`, `hasServiceVersion()`. These were added in v0.4.0 (Phase 21) and are entirely absent from the current README.
- **D-06:** Update the Quick Start example and Types table to reflect current v0.4.0 exports including the discovery functions.

### Shell README — RuntimeHooks + Service Registry (README-03)

- **D-07:** Keep `ShellHooks` as the primary integration interface for `createShellBridge()` — this is the correct browser-facing API. The existing ShellHooks Quick Start and API reference stay.
- **D-08:** Add a **full RuntimeHooks section** for advanced integrators who want to bypass `@napplet/shell` and use `@napplet/runtime` directly. This section covers `createRuntime()`, the RuntimeHooks interface, and the `adaptHooks()` export that converts `ShellHooks → RuntimeHooks` (showing the relationship).
- **D-09:** Add a dedicated **Services section** showing `registerService()` wiring: how to import from `@napplet/services`, create a service handler, and register it. This section should include a code example (not just the Quick Start).
- **D-10:** Add an architecture callout explaining: `@napplet/shell` is a browser adapter over `@napplet/runtime`. `ShellHooks` is the browser-facing interface; `adaptHooks()` converts it to `RuntimeHooks` internally.

### Vite-plugin — requires Option (README-04)

- **D-11:** Add a dedicated **"Service Dependencies"** section (not just an options table row) covering:
  - What `requires` does (injects `<meta name="napplet-requires">` into HTML, adds `["requires", "service-name"]` tags to the kind 35128 manifest event)
  - When to use it (when a napplet requires specific shell services like audio or notifications)
  - Full code example showing `nappType + requires` together in `vite.config.ts`
  - What gets injected into the HTML output
- **D-12:** Also update the `Nip5aManifestOptions` interface documentation in the options table to include `requires`.

### Claude's Discretion

- Exact wording of package descriptions in the 7-package table.
- Which packages appear on which side of the communication flow diagram.
- Whether to add version badges (v0.4.0 / v0.5.0) to the root README.
- The precise ASCII art style for the two new diagrams — match the current monospace style.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Files being updated
- `README.md` — current root README (3-package, stale API names)
- `packages/shim/README.md` — current shim README (missing discovery API)
- `packages/shell/README.md` — current shell README (missing RuntimeHooks, service registry)
- `packages/vite-plugin/README.md` — current vite-plugin README (missing requires option)

### Source of truth for APIs being documented

#### Shim discovery API
- `packages/shim/src/index.ts` — exports: `discoverServices`, `hasService`, `hasServiceVersion`, `ServiceInfo` type, `nappState`, `nappStorage`
- `packages/shim/src/discovery-shim.ts` — `discoverServices()`, `hasService()`, `hasServiceVersion()` implementations + JSDoc

#### Shell RuntimeHooks + service registry
- `packages/shell/src/index.ts` — all shell exports including `adaptHooks`, `BrowserDeps`
- `packages/shell/src/shell-bridge.ts` — `createShellBridge(hooks: ShellHooks)` signature
- `packages/shell/src/hooks-adapter.ts` — `adaptHooks(shellHooks, deps): RuntimeHooks` (the conversion layer)
- `packages/shell/src/types.ts` — `ShellHooks` interface definition
- `packages/runtime/src/types.ts` — `RuntimeHooks` and all sub-interfaces (for the RuntimeHooks section)
- `packages/runtime/src/runtime.ts` — `createRuntime()` signature

#### Vite-plugin requires option
- `packages/vite-plugin/src/index.ts` — `requires?: string[]` in `Nip5aManifestOptions`, full injection logic

### Style references (Phase 23 decision)
- `packages/shim/README.md` — primary style reference
- `packages/shell/README.md` — secondary style reference

### Requirements
- `.planning/REQUIREMENTS.md` §README-01 through README-04 — acceptance criteria per file

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/shim/src/discovery-shim.ts` has JSDoc with `@example` blocks for `discoverServices`, `hasService`, `hasServiceVersion` — use these as the basis for the new Service Discovery section.
- `packages/shell/src/shell-bridge.ts` has a `@example` block for `createShellBridge` — already close to the README Quick Start format.
- `packages/shell/src/hooks-adapter.ts` JSDoc on `adaptHooks()` explains the ShellHooks → RuntimeHooks conversion — useful for the architecture callout.

### Established Patterns
- Current root README uses a Markdown table for packages — extend, don't replace.
- Current ASCII diagrams use box-drawing chars and `◄──►` arrows — keep consistent.
- All package READMEs use `## Protocol Reference` at the bottom linking to SPEC.md and NIPs — maintain this pattern.

### Integration Points
- Root README links to each package subfolder (`packages/shim`, `packages/shell`, etc.) — extend to link all 7.
- Shell README needs to cross-reference `@napplet/runtime` (for the RuntimeHooks section) and `@napplet/services` (for the Services section).

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 24-root-and-interface-readmes*
*Context gathered: 2026-03-31*
