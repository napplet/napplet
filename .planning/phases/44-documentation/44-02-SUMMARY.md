---
plan: 44-02
title: "Rewrite @napplet/shim README"
status: complete
started: 2026-04-02T16:40:00.000Z
completed: 2026-04-02T16:45:00.000Z
---

# Summary: 44-02 Rewrite @napplet/shim README

## What was built

Complete rewrite of `packages/shim/README.md` to document the post-Phase-41 reality:

- Side-effect-only import pattern (`import '@napplet/shim'`)
- Full `window.napplet` shape documentation with `relay`, `ipc`, `services`, `storage` sub-objects
- Method tables for each sub-object
- TypeScript Window type augmentation explanation
- Shim vs SDK comparison table
- Removed all references to old named exports (subscribe, publish, nappState, discoverServices, hasServiceVersion)

## Key files

- `packages/shim/README.md` (rewritten)

## Self-Check: PASSED
