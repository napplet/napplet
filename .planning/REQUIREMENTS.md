# Milestone v0.27.0 Requirements — IFC Terminology Lock-In

**Goal:** Finish the IPC→IFC rename across first-party source, published READMEs, specs, and skills. The NUB domain is already named `ifc` (`@napplet/nub/ifc`, `shell.supports('nub:ifc')`, NUB-IFC spec), but the developer-facing runtime API surface and documentation still say `ipc` / "IPC-PEER" / "inter-pane". This milestone closes that gap — one hard break, no backward-compat alias.

**Version:** v0.27.0 (breaking pre-1.0 minor)

**Phase numbering:** continues from v0.26.0 (last phase shipped: 121 → new phases start at 122).

## Current Milestone Requirements

### API Rename (breaking)

- [ ] **API-01**: `window.napplet.ipc` namespace renamed to `window.napplet.ifc` across `packages/core/src/types.ts` (NappletGlobal shape) and `packages/shim/src/index.ts` (installer/routing). No backward-compat alias; `window.napplet.ipc` no longer resolves.
- [ ] **API-02**: `@napplet/sdk` exports `ifc` (not `ipc`) as the named namespace export. `packages/sdk/src/index.ts` section header, JSDoc `@example` blocks, and the exported `const` identifier all renamed; any downstream type re-exports updated.

### Source Cleanup

- [ ] **SRC-01**: `@napplet/core` JSDoc + section comments in `packages/core/src/types.ts`, `packages/core/src/topics.ts`, and `packages/core/src/envelope.ts` use IFC-PEER / "inter-frame" phrasing — zero IPC-PEER leakage. `packages/nub/src/ifc/sdk.ts` JSDoc references `window.napplet.ifc` (not `.ipc`).

### Public Documentation

- [ ] **DOC-01**: Root `README.md` + `packages/core/README.md` + `packages/shim/README.md` + `packages/sdk/README.md` updated — no `ipc` / `IPC-PEER` / "inter-pane" / "inter-napplet" (except historical "shipped" changelog lines where renaming would distort history). Sample code in code fences uses `ifc`.
- [ ] **DOC-02**: `skills/build-napplet/SKILL.md` updated — description frontmatter, body prose, and all code samples aligned with `ifc` / "inter-frame" terminology.

### Active Planning Sweep

- [ ] **PLAN-01**: Active planning docs — `PROJECT.md`, `STATE.md`, `ROADMAP.md`, `.planning/codebase/*.md`, `.planning/research/*.md`, `.planning/SPEC-GAPS.md` — reflect IFC terminology. Archived `.planning/milestones/` and `.planning/quick/` directories are intentionally left as historical record.

### Verification

- [ ] **VER-01**: `pnpm -r build` and `pnpm -r type-check` both exit 0 across all 14 workspace packages with the IFC-renamed API surface.
- [ ] **VER-02**: Repo-wide grep for `\bIPC\b`, `\bipc\b`, `IPC-PEER`, and `inter-pane` returns zero matches under `packages/`, `specs/`, `skills/`, root `README.md`, and active `.planning/` docs (historical archives excluded).

## Future Requirements (deferred)

(none for this milestone — deferred items from v0.26.0 remain in PROJECT.md's Future Requirements section)

## Out of Scope

- **Renaming the NUB spec title or domain key** — the NUB is already named "IFC" (nubs/NUB-IFC) and the domain constant is `'ifc'`. No spec-level change needed.
- **Rewriting archived milestone artifacts** — `.planning/milestones/*` and `.planning/quick/*` describe what shipped at the time; rewriting them would distort history for ~1000 references with no consumer benefit.
- **Backward-compat alias on `window.napplet.ipc`** — explicitly rejected; this is a hard break (confirmed at milestone kickoff).
- **Demo repo updates** — the napplet repo is SDK-only; demo consumers live in a separate repo and will migrate on their own schedule when they bump `@napplet/shim` / `@napplet/sdk` past v0.27.0.
- **Historical changelog line edits in READMEs** — "Shipped: v0.7.0" bullet points that mention `IPC_PEER` as a past decision are history, not current docs.

## Traceability

Every requirement maps to exactly one phase. Coverage: 8/8.

| Requirement | Phase | Status |
|-------------|-------|--------|
| API-01 | Phase 122 (Source Rename) | Pending |
| API-02 | Phase 122 (Source Rename) | Pending |
| SRC-01 | Phase 122 (Source Rename) | Pending |
| DOC-01 | Phase 123 (Documentation Sweep) | Pending |
| DOC-02 | Phase 123 (Documentation Sweep) | Pending |
| PLAN-01 | Phase 123 (Documentation Sweep) | Pending |
| VER-01 | Phase 124 (Verification & Sign-Off) | Pending |
| VER-02 | Phase 124 (Verification & Sign-Off) | Pending |
