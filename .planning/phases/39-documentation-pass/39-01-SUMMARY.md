# Phase 39-01 Summary — Documentation Pass

**Completed:** 2026-04-01
**Status:** Done

## Work Completed

### DOC-01 — Topic Prefix Conventions (packages/core/src/topics.ts)
Added `## Topic Prefix Conventions` section to the `TOPICS` const JSDoc block, after the existing `@example` block. The section contains a three-row markdown table:
- `shell:*` — napplet → shell (commands sent by napplet to shell)
- `napplet:*` — shell → napplet (responses/notifications)
- `{service}:*` — bidirectional, direction per-topic

Listed `auth:*`, `stream:*`, `profile:*`, `wm:*`, `keybinds:*`, `chat:*`, `audio:*` as examples of service-scoped prefixes.

### DOC-02 — Verify @deprecated annotations (packages/shim/src/state-shim.ts)
Verified at lines 168-178: both `nappState` and `nappStorage` already carry `@deprecated Use nappletState. Will be removed in v0.9.0.` annotations. No edits required.

## Quality Gates
- `pnpm type-check`: 14/14 tasks successful — no regressions
- Pure JSDoc change — zero runtime behavior altered
