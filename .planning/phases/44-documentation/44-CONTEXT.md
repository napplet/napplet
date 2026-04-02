# Phase 44: Documentation - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Update SPEC.md and package READMEs to reflect the shim/SDK split. SPEC.md gets surgical edits to existing sections (no new sections). Shim README is rewritten to document side-effect-only import and `window.napplet` shape. SDK README is written from scratch. No migration guide — no external consumers yet.

</domain>

<decisions>
## Implementation Decisions

### SPEC.md Update Strategy

- **D-01:** Surgical updates only — update Section 16.1 (Minimal Napplet) code examples and any other sections that reference old shim named exports (`subscribe()`, `nappState`, etc.). Replace with `window.napplet.relay.subscribe()` equivalents. No new dedicated section for `window.napplet` shape — the protocol spec describes wire format and behavior, not the JavaScript convenience API. The `window.napplet` shape is an SDK/README concern.

### Migration Guide

- **D-02:** No migration guide. v0.8.0 hasn't been published. There are no external consumers migrating from old to new — only hyprgate (same author). If needed later when external adoption exists, add it then.

### SDK README Depth

- **D-03:** Focused README matching existing @napplet package style. Contents: quick start, API overview (`relay`/`ipc`/`services`/`storage` sub-objects), type exports list, and a one-paragraph explanation of relationship to shim. SDK is a thin delegation layer — the README should be proportionally thin.

### Shim README Rewrite

- **D-04:** Full rewrite of `packages/shim/README.md`. Current README documents old named exports — entirely outdated after Phase 41. New README documents: side-effect-only import, `window.napplet.*` shape and sub-objects, Window type augmentation, relationship to SDK. Remove all old `import { subscribe, publish, ... }` code examples.

### Claude's Discretion

- **Section ordering in READMEs:** Claude decides section order and heading structure for both READMEs.
- **SPEC.md section discovery:** Claude identifies all sections beyond 16.1 that reference old API and updates them. The scope is "find and fix," not exhaustive rewrite.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements

- `.planning/REQUIREMENTS.md` — ECO-03 (SPEC.md update), ECO-04 (shim README), ECO-05 (SDK README)

### Prior Phase Context

- `.planning/phases/41-shim-restructure/41-CONTEXT.md` — Defines `window.napplet` shape and zero-export policy
- `.planning/phases/42-sdk-package/42-CONTEXT.md` — Defines SDK exports, Window augmentation, runtime guard
- `.planning/phases/43-demo-test-migration/43-CONTEXT.md` — Demos use SDK as recommended pattern (D-01)

### Files to Update

- `SPEC.md` — 1412 lines, 17 sections. Section 16.1 (Minimal Napplet) is primary target. Grep for old API references across all sections.
- `packages/shim/README.md` — Full rewrite. Currently describes old named exports.

### Files to Create

- `packages/sdk/README.md` — New file. SDK package will exist from Phase 42.

### Style Reference

- `packages/core/README.md` — Example of existing @napplet README style to match
- `packages/runtime/README.md` — Another style reference
- `packages/acl/README.md` — Shortest existing README for reference

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- Existing package READMEs (`packages/core/README.md`, `packages/runtime/README.md`, etc.) — established structure and tone to match
- SPEC.md Section 16.1 — "Minimal Napplet" code example is the primary update target

### Established Patterns

- Package READMEs follow: title > description > install > quick start > API reference > types > related packages
- SPEC.md uses markdown with section numbering, code fences, and `[OPEN]`/`[LOCKED]` status tags

### Integration Points

- Shim README links to SDK README and vice versa (cross-references)
- SPEC.md references implementation in the `@napplet/*` packages

</code_context>

<specifics>
## Specific Ideas

- SDK README should clearly state: "If you use a bundler (Vite, webpack, etc.), import from `@napplet/sdk`. If you're writing a vanilla napplet with no build step, use `@napplet/shim` directly for the `window.napplet` global."
- Shim README should open with: "Side-effect-only module. Importing `@napplet/shim` installs the `window.napplet` global. No named exports."

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 44-documentation*
*Context gathered: 2026-04-02*
