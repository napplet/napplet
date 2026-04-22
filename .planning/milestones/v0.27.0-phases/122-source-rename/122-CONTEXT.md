# Phase 122: Source Rename - Context

**Gathered:** 2026-04-19
**Status:** Ready for planning
**Mode:** Infrastructure phase — smart discuss skipped

<domain>
## Phase Boundary

The developer-facing runtime API surface is IFC-named end-to-end — `window.napplet.ifc` resolves (and `.ipc` does not), `@napplet/sdk` exports `ifc`, and every surviving JSDoc / section comment in `@napplet/core` + `@napplet/nub/ifc` uses IFC-PEER / "inter-frame" phrasing.

**Maps to requirements:** API-01, API-02, SRC-01

**In scope (first-party source only):**
- `packages/core/src/types.ts` — `NappletGlobal` shape: `.ipc` namespace → `.ifc` + JSDoc "IPC-PEER" → "IFC-PEER"
- `packages/core/src/topics.ts` — JSDoc + section comments "IPC-PEER" → "IFC-PEER"
- `packages/core/src/envelope.ts` — JSDoc table row `(IPC peer bus)` → `(IFC peer bus)`
- `packages/shim/src/index.ts` — `ipc:` key on installed `window.napplet` object → `ifc:`
- `packages/sdk/src/index.ts` — section header `// ─── IPC namespace ───`, `export const ipc = { ... }` → `ifc`, JSDoc `@example` blocks
- `packages/nub/src/ifc/sdk.ts` — JSDoc references to `window.napplet.ipc` + helper name `requireIpc()` → `requireIfc()`; error message text
- Any internal callers of `window.napplet.ipc` / `requireIpc()` the rename surfaces

**Out of scope:**
- READMEs and `skills/` (Phase 123)
- Active planning docs (Phase 123 via PLAN-01)
- Archived `.planning/milestones/` and `.planning/quick/` (intentionally frozen history)
- Monorepo-wide build + type-check gate (Phase 124)
- Repo-wide zero-grep acceptance (Phase 124)
- NUB domain constant `'ifc'` — already correct, no change

</domain>

<decisions>
## Implementation Decisions

### Hard Break, No Alias
- Per milestone kickoff: `window.napplet.ipc` and `@napplet/sdk` `ipc` export are deleted outright, not aliased. Consumers must migrate to `.ifc` in one bump.

### Internal Naming Convention
- `ipc` → `ifc` everywhere as a lowercase identifier.
- `IPC` → `IFC` in uppercase tokens (e.g., `// ─── IPC namespace ───` → `// ─── IFC namespace ───`).
- `IPC-PEER` → `IFC-PEER` as the JSDoc phrase for the event bus.
- "inter-napplet" / "inter-pane" phrasing inside JSDoc → "inter-frame" (aligned with NUB-IFC = Inter-Frame Communication).
- `requireIpc()` → `requireIfc()` (symmetric with the renamed accessor).

### Phase 122 Build Gate
- Phase 122 only requires a localized build + type-check across the affected packages (`@napplet/core`, `@napplet/nub`, `@napplet/shim`, `@napplet/sdk`). Full monorepo gate + zero-grep is Phase 124's acceptance.

### Claude's Discretion
- Phase 122 is pure infrastructure (refactor/rename). All implementation choices — plan splits, identifier casing in new code, comment polish — are at Claude's discretion, bounded by the scope list above and the hard-break decision.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/nub/src/ifc/sdk.ts` and the NUB-IFC barrel already use `ifc` as the domain key — the rename aligns the runtime API with the NUB layer, not the other way around.
- `shell.supports('nub:ifc')` and `NubDomain = 'ifc' | ...` already exist in `@napplet/core`.

### Established Patterns
- `NappletGlobal` in `packages/core/src/types.ts` is the single source of truth for the `window.napplet` shape. Renaming the key there cascades to the shim installer and SDK named export.
- JSDoc section dividers use `// ─── Name ──────...` headers — preserve format, only swap the word.
- SDK exports are a `const` with JSDoc `@example` blocks showing bare-name usage. Renaming the const also renames every `@example` invocation.

### Integration Points
- `packages/shim/src/index.ts` assigns the installed namespace onto `window.napplet`; the key name is the one user code reads.
- `packages/sdk/src/index.ts` re-exports the namespace const by name; downstream imports use that name directly.
- `packages/nub/src/ifc/sdk.ts` reads through `window.napplet.ipc` via a guard helper — the guard must point at the new key.

</code_context>

<specifics>
## Specific Ideas

- No back-compat alias. `window.napplet.ipc = window.napplet.ifc` is explicitly rejected.
- No deprecation warning. Breaking change lands as a clean rename.
- Phase 122 leaves READMEs unchanged — fixing docs before shipping the rename would desync samples from the source. Docs follow the code in Phase 123.

</specifics>

<deferred>
## Deferred Ideas

- Renaming the NUB-IFC spec title or the `'ifc'` domain constant — already correct.
- Any touch to demo-repo consumers — demo lives outside this repo and migrates on its own schedule.
- Renaming `.planning/milestones/` or `.planning/quick/` historical artifacts — intentionally frozen history.

</deferred>
