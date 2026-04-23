# Phase 49: Constants Panel - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Expose all protocol magic numbers (buffer sizes, timeouts, quotas, replay window, flash durations) in the demo UI and let users edit behavioral constants at runtime with immediate effect. Session-only persistence (resets on page reload).

</domain>

<decisions>
## Implementation Decisions

### Panel Placement
- **D-01:** Constants panel lives as a new tab in the existing right-side inspector pane (from Phase 29's `node-inspector.ts` pattern).
- **D-02:** Claude's discretion on when the Constants tab is visible (always vs default-when-no-node-selected).

### Constant Grouping
- **D-03:** Default grouping is by package (core, runtime, shell, services, acl, demo). User can switch to domain grouping (timeouts, sizes/limits, UI timing, protocol) or flat view.
- **D-04:** Search/filter across all grouping modes (minisearch-style).
- **D-05:** Protocol constants (AUTH_KIND, PROTOCOL_VERSION, BusKind values) are read-only. Behavioral constants (timeouts, sizes, limits, durations) are editable.

### Edit Mechanics
- **D-06:** Editable constants use number input + adjacent range slider for quick scrubbing.
- **D-07:** Per-constant reset icon (restores default) plus global "Reset All" button at top of panel.
- **D-08:** Flash highlight (green pulse) on the changed row when a value is applied.
- **D-09:** Modified constants show a persistent dot/badge indicating they differ from default.
- **D-10:** Edited values persist for the session (survive panel close/reopen) but reset on page reload.

### Runtime Plumbing
- **D-11:** Mutable config object lives in `@napplet/runtime` (not core — napplets don't need it). Packages at shell level and higher read from it.
- **D-12:** Demo creates and populates the config object, passes it to runtime. Runtime and shell use config values instead of module-level `const` for overridable constants.
- **D-13:** Shim and SDK packages are not affected — they don't consume the config object.

### Claude's Discretion
- Inspector tab visibility behavior (always-visible tab vs default/home tab)
- Slider min/max bounds per constant
- Exact grouping labels and sort order within groups
- How the mutable config object integrates with RuntimeAdapter

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Demo UI Patterns
- `apps/demo/src/node-inspector.ts` — Right-side inspector pane pattern, tab rendering, selected-node state
- `apps/demo/src/node-details.ts` — Node detail data model and activity tracking
- `apps/demo/src/acl-panel.ts` — Existing capability toggle UI pattern with inline styles
- `apps/demo/src/flow-animator.ts` — Flash animation pattern (FLASH_DURATION, COLOR_ACTIVE)
- `apps/demo/src/main.ts` — Demo bootstrap, shell-host wiring, UI initialization

### Constants to Expose
- `packages/core/src/constants.ts` — REPLAY_WINDOW_SECONDS, AUTH_KIND, PROTOCOL_VERSION (read-only)
- `packages/runtime/src/event-buffer.ts` — RING_BUFFER_SIZE
- `packages/shim/src/state-shim.ts` — REQUEST_TIMEOUT_MS
- `packages/services/src/coordinated-relay.ts` — DEFAULT_EOSE_TIMEOUT_MS
- `packages/services/src/relay-pool-service.ts` — EOSE_FALLBACK_MS
- `packages/services/src/notification-service.ts` — DEFAULT_MAX_PER_WINDOW
- `packages/acl/src/types.ts` — DEFAULT_QUOTA
- `packages/shell/src/acl-store.ts` — DEFAULT_STATE_QUOTA
- `packages/runtime/src/key-derivation.ts` — SECRET_LENGTH (read-only)
- `apps/demo/src/flow-animator.ts` — FLASH_DURATION
- `apps/demo/src/topology.ts` — FLASH_DURATION_MS
- `apps/demo/src/main.ts` — TOAST_DISPLAY_MS
- `apps/demo/src/signer-connection.ts` — MAX_RECENT_REQUESTS
- `apps/demo/src/sequence-diagram.ts` — HEADER_HEIGHT, ROW_HEIGHT

### Runtime Architecture
- `packages/runtime/src/runtime.ts` — RuntimeAdapter interface, runtime creation, where config object would be consumed
- `packages/runtime/src/types.ts` — RuntimeAdapter type definition
- `packages/shell/src/index.ts` — Shell entry point, createShellBridge

### Phase 29 Context
- `.planning/phases/29-node-detail-drill-down/29-CONTEXT.md` — Inspector panel decisions (D-03, D-09: right-side, debugger stays accessible)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `node-inspector.ts` — Full inspector pane lifecycle (open, close, render, refresh timer). Can be extended with tab system.
- `acl-panel.ts` — Inline-styled toggle buttons and capability labels. Pattern for interactive controls.
- `flow-animator.ts` — Flash animation with color/duration. Reusable for edit-confirmation flash.

### Established Patterns
- Inline styles for dynamic UI (UnoCSS can't detect dynamically-assigned classes)
- Module-level state with exported getters/setters
- UPPER_SNAKE_CASE for constants throughout all packages
- Inspector uses `setInterval` for periodic refresh of displayed data

### Integration Points
- Inspector pane (`#inspector-pane` in `index.html`) — new tab added here
- `shell-host.ts` — wraps runtime methods, would wire config object into runtime creation
- RuntimeAdapter — config object could be passed as a new optional field

</code_context>

<specifics>
## Specific Ideas

- Slider + number input combo for quick experimentation ("feel the effect" of changing timeouts)
- Search/filter lets users find constants by name across any grouping mode
- Per-constant reset + global Reset All — power users can experiment freely without fear

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 49-constants-panel*
*Context gathered: 2026-04-03*
