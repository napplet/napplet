---
plan: 44-03
title: "Create @napplet/sdk README"
status: complete
started: 2026-04-02T16:40:00.000Z
completed: 2026-04-02T16:45:00.000Z
---

# Summary: 44-03 Create @napplet/sdk README

## What was built

New `packages/sdk/README.md` documenting the SDK as a thin delegation layer:

- Quick start with both shim import and SDK named imports
- All four namespace APIs (relay, ipc, services, storage) with method tables
- Namespace import pattern (`import * as napplet`)
- Type re-exports from `@napplet/core` (NostrEvent, NostrFilter, ServiceInfo, Subscription, EventTemplate)
- Runtime guard documentation (error when window.napplet not installed)
- SDK vs Shim comparison table
- Cross-references to shim and core packages

## Key files

- `packages/sdk/README.md` (created)

## Self-Check: PASSED
