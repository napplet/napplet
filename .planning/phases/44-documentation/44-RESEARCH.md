# Phase 44: Documentation - Research

**Researched:** 2026-04-02
**Status:** Complete

## Research Questions

### Q1: What sections of SPEC.md reference old shim API and need updating?

**Findings:**

1. **Section 4.1 (line 466):** References `@napplet/shim` as "napplet-side SDK" — needs update to mention both shim and SDK.
2. **Section 16.1 (lines 1249-1305):** "Minimal Napplet" example uses raw postMessage — this is a protocol-level example, NOT a shim/SDK API example. It shows keypair generation, AUTH handshake, REQ/EVENT/EOSE handling at the wire level. This does NOT need to change — it correctly documents the protocol layer. However, the context (44-CONTEXT.md D-01) says to update Section 16.1 code examples. Reviewing: the code is protocol-level (no shim imports), so the update should ADD a convenience example showing `window.napplet.*` usage alongside the raw wire example, or add a note pointing to the shim/SDK.
3. **Section 17.1 (lines 1384-1388):** Implementation notes list packages — needs `@napplet/sdk` added and description updated.
4. **No `window.napplet` reference exists in SPEC.md at all** — the namespaced API shape needs to be documented somewhere. Per 44-CONTEXT.md D-01, no new dedicated section is needed; existing sections get surgical updates.

**Key insight:** Section 16.1 is raw wire protocol — no shim imports present. The old named exports (`subscribe`, `publish`, etc.) are NOT in SPEC.md. The SPEC documents protocol behavior, not the JavaScript convenience API. The updates needed are:
- Section 4.1: Mention both `@napplet/shim` and `@napplet/sdk`
- Section 16.1: Add a convenience-layer example or note about `window.napplet.*`
- Section 17.1: Add `@napplet/sdk` to package list

### Q2: What is the current state of packages/shim/README.md?

**Findings:**

The current README (303 lines) documents the OLD API extensively:
- Quick Start uses `import { subscribe, publish, on, nappState, discoverServices, hasService } from '@napplet/shim'`
- Full API Reference for: `subscribe()`, `publish()`, `query()`, `emit()`, `on()`, `discoverServices()`, `hasService()`, `hasServiceVersion()`, `nappState` (with `.getItem`, `.setItem`, `.removeItem`, `.clear()`, `.keys()`)
- Types section imports from `@napplet/shim`
- `window.napplet` section exists but describes old shape (service discovery only, not the full namespaced API)

**This entire README needs rewriting per 44-CONTEXT.md D-04.** The new README should document:
- Side-effect-only import: `import '@napplet/shim'`
- `window.napplet.*` shape with `relay`, `ipc`, `services`, `storage` sub-objects
- Window type augmentation
- Zero named exports
- Relationship to `@napplet/sdk`

### Q3: Does packages/sdk/ exist yet?

**Finding:** No — `packages/sdk/` does not exist. Phase 42 creates it. The SDK README (ECO-05) will be created as a new file `packages/sdk/README.md` once Phase 42 has been executed.

**Implication for planning:** Phase 44 plans must account for the SDK package potentially not existing at plan creation time but will exist by execution time (Phase 42 runs before Phase 44). The plan should reference the expected path.

### Q4: What README style/structure do existing @napplet packages follow?

**Findings from reading packages/core/README.md, packages/acl/README.md, packages/runtime/README.md:**

Common structure:
1. `# @napplet/{name}` — title
2. `> {one-line description}` — blockquote tagline
3. `## Getting Started` with subsections: Prerequisites, How It Works, Installation
4. `## Quick Start` — code example
5. `## API Reference` — organized by category with tables for parameters
6. `## Types` — import example + table
7. `## Integration Note` or `## Protocol Reference` — links
8. `## License` — MIT

Style conventions:
- Parameter tables use: `| Parameter | Type | Description |`
- Code examples in TypeScript (`ts` fence)
- Returns documented inline after parameter tables
- Types section has import example then table of types

### Q5: What is the `window.napplet` shape from Phase 41 context?

From 41-CONTEXT.md:
```
window.napplet = {
  relay: { subscribe, publish, query },
  ipc: { emit, on },
  services: { list, has },
  storage: { getItem, setItem, removeItem, keys }
}
```

Key details:
- `services.has(name, version?)` merges old `hasService` + `hasServiceVersion`
- `storage` has no `clear()` (D-05)
- NappletGlobal type defined in `@napplet/core`
- Window augmentation in shim `.d.ts` output

## Validation Architecture

### Dimension 8: Verification Strategy

For a documentation-only phase, verification is:
1. **SPEC.md grep checks:** Old API references removed/updated, new references present
2. **Shim README content checks:** Zero mentions of old named exports, `window.napplet.*` documented
3. **SDK README content checks:** Named exports documented, relationship to shim explained
4. **Cross-reference checks:** Shim README links to SDK, SDK README links to shim
5. **Build verification:** `pnpm build` still passes (no code changes, but ensures docs don't break anything)

## RESEARCH COMPLETE
