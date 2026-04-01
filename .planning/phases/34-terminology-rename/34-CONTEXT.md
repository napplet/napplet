# Phase 34: Terminology Rename - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace every `napp*` identifier, topic string, meta attribute, localStorage prefix, and documentation reference that should say `napplet*` — across all 7 packages, demo/, skills/, and all READMEs. Does NOT touch SPEC.md (deferred to Phase 35).

</domain>

<decisions>
## Implementation Decisions

### NappKey* Rename — Skip Intermediate Step
- **D-01:** `NappKeyRegistry` → `SessionRegistry` directly (not via `NappletKeyRegistry`). Phase 38 no longer needs to rename these types.
- **D-02:** `NappKeyEntry` → `SessionEntry` directly (not via `NappletKeyEntry`). Same rationale.
- **D-03:** `NappKeypair` → `NappletKeypair` (this one stays in the napplet* namespace — it IS the napplet's session keypair, not a generic session concept).

### nappState Public API
- **D-04:** `nappletState` becomes the canonical named export from `@napplet/shim`.
- **D-05:** `nappState` is kept as a `@deprecated` alias: `export const nappState = nappletState` with JSDoc `@deprecated Use nappletState`. Consistent with the existing `nappStorage` pattern.
- **D-06:** `nappStorage` alias is also kept (already deprecated) — it aliases `nappletState` after the rename.

### SPEC.md — Deferred to Phase 35
- **D-07:** Phase 34 does NOT touch SPEC.md. Phase 35 will do one combined pass: napp→napplet + INTER_PANE→IPC-PEER + IPC-* namespace documentation all in one edit.

### localStorage Prefix Migration
- **D-08:** `napp-state:` prefix → `napplet-state:` in `packages/runtime/src/state-handler.ts`.
- **D-09:** `shell/src/state-proxy.ts` also has the `napp-state:` prefix (dead code candidate, but still present). Update it too as part of this pass; TYPE-02 in Phase 36 determines if the file is removed.
- **D-10:** Dual-read migration: when looking up a key, try `napplet-state:` prefix first; fall back to `napp-state:` if not found. Ship this in `state-handler.ts`. This is a one-release grace period for existing persisted state.

### Full Rename Scope
- **D-11:** Scope includes: `packages/` (all 7), `demo/`, `skills/`, `packages/*/README.md`, root `README.md`.
- **D-12:** SPEC.md excluded from Phase 34 scope (see D-07).
- **D-13:** Success verification: `grep -r 'napp[^l]' packages/ demo/ skills/ README.md packages/*/README.md` returns zero hits in production code (excluding node_modules, dist, test snapshots referencing old names).

### Topic Strings
- **D-14:** `"napp:state-response"` → `"napplet:state-response"` (in `packages/core/src/topics.ts` and any consumers).
- **D-15:** `"napp:audio-muted"` → `"napplet:audio-muted"` (in services package and any consumers).

### Meta Attribute
- **D-16:** `"napplet-napp-type"` → `"napplet-type"` in shim's `getNappType()` query selector AND in vite-plugin injection.
- **D-17:** Vite plugin reads BOTH `"napplet-type"` (new) and `"napplet-napp-type"` (old) for one release cycle backward compat.

### Complete Identifier Rename Map
| Current | Renamed To |
|---------|-----------|
| `NappKeyRegistry` | `SessionRegistry` |
| `NappKeyEntry` | `SessionEntry` |
| `NappKeypair` | `NappletKeypair` |
| `nappKeyRegistry` (variable) | `sessionRegistry` |
| `nappEntry` / `nappEntries` | `sessionEntry` / `sessionEntries` |
| `nappPubkey` | `nappletPubkey` |
| `nappInfoMap` | `nappletInfoMap` |
| `nappType` | `nappletType` |
| `nappClass` | `nappletClass` |
| `nappState` (export) | `nappletState` (canonical), `nappState` deprecated alias |
| `nappStorage` | keep as deprecated alias for `nappletState` |
| `getNappType()` | `getNappletType()` |
| `napp-state:` prefix | `napplet-state:` (with dual-read fallback) |
| `"napp:state-response"` topic | `"napplet:state-response"` |
| `"napp:audio-muted"` topic | `"napplet:audio-muted"` |
| `"napplet-napp-type"` attr | `"napplet-type"` |
| file `napp-keypair.ts` | `napplet-keypair.ts` |
| file `napp-key-registry.ts` | `session-registry.ts` |

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — TERM-01 through TERM-05 define acceptance criteria for this phase

### Key Source Files (highest change density)
- `packages/runtime/src/napp-key-registry.ts` — NappKeyRegistry/NappKeyEntry types (60+ occurrences)
- `packages/runtime/src/state-handler.ts` — napp-state: prefix, dual-read migration goes here
- `packages/runtime/src/types.ts` — runtime type definitions
- `packages/shell/src/napp-key-registry.ts` — shell copy (may be dead code, touch anyway)
- `packages/shell/src/state-proxy.ts` — also has napp-state: prefix
- `packages/shim/src/napp-keypair.ts` → rename to `napplet-keypair.ts`
- `packages/shim/src/state-shim.ts` — nappState export lives here
- `packages/shim/src/index.ts` — re-exports nappState/nappStorage
- `packages/core/src/topics.ts` — topic string constants
- `packages/vite-plugin/src/index.ts` — napplet-napp-type meta attribute

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `nappStorage` deprecated alias pattern (shim/src/state-shim.ts:169) — exact template for how to ship `nappState` as deprecated alias

### Established Patterns
- File naming: lowercase-hyphenated (`napp-keypair.ts` → `napplet-keypair.ts`, `napp-key-registry.ts` → `session-registry.ts`)
- `@deprecated` JSDoc with redirect: already used for `nappStorage`

### Integration Points
- `packages/runtime/src/napp-key-registry.ts` is imported by `runtime.ts` — file rename requires import update
- `packages/shell/src/napp-key-registry.ts` is imported by `shell-bridge.ts` — same
- `packages/shim/src/napp-keypair.ts` is imported by `index.ts` and `keyboard-shim.ts`

</code_context>

<specifics>
## Specific Ideas

- D-01/D-02: NappKey* → Session* directly was explicitly chosen to avoid a double-rename across Phase 34 and Phase 38. Phase 38 scope is now reduced to `loadOrCreateKeypair` → `createEphemeralKeypair` only.
- The `napps` (plural, 10 occurrences) in comments/docs should be renamed to `napplets` where they refer to the sandboxed iframe apps — but be careful not to rename Nostr ecosystem references where "napps" = Nostr apps.

</specifics>

<deferred>
## Deferred Ideas

- SPEC.md napp→napplet corrections — deferred to Phase 35 (combined pass with INTER_PANE→IPC-PEER)

</deferred>

---

*Phase: 34-terminology-rename*
*Context gathered: 2026-04-01*
