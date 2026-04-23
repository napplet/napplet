---
phase: 44
title: "Documentation"
status: passed
verified: 2026-04-02T16:50:00.000Z
verifier: inline
---

# Verification: Phase 44 — Documentation

## Phase Goal

Developers reading the spec, shim README, and SDK README understand the new window.napplet shape, when to use shim vs SDK, and how to migrate.

## Requirements Verified

### ECO-03: SPEC.md window.napplet section updated

**Status: PASSED**

- Section 4.1 describes both `@napplet/shim` (side-effect-only window installer) and `@napplet/sdk` (named TypeScript exports)
- `window.napplet` global with `relay`, `ipc`, `services`, `storage` sub-objects documented in Section 4.1
- Section 16.1 raw wire protocol example preserved; convenience-layer note added after it
- Section 17.1 package list expanded from 3 to 8 packages with accurate descriptions
- `grep "side-effect-only module" SPEC.md` returns 2 matches (Section 4.1 + Section 17.1)
- `grep "@napplet/sdk" SPEC.md` returns 3 matches (Section 4.1, Section 16.1 note, Section 17.1)
- Old `(napplet-side SDK)` text no longer appears

### ECO-04: @napplet/shim README updated

**Status: PASSED**

- README documents `@napplet/shim` as side-effect-only with zero named exports
- `window.napplet` shape with all four sub-objects fully documented with method tables
- TypeScript Window augmentation explained with `NappletGlobal` reference
- Shim vs SDK comparison table present
- No references to old named exports (subscribe, publish, nappState, discoverServices, hasServiceVersion)
- `import '@napplet/shim'` is the primary import pattern (5 occurrences)
- Cross-references to `@napplet/sdk` (4 occurrences)

### ECO-05: @napplet/sdk README written

**Status: PASSED**

- README explains SDK provides named exports wrapping `window.napplet`
- Quick start shows both `import '@napplet/shim'` and `import { ... } from '@napplet/sdk'`
- All four namespaces (relay, ipc, services, storage) documented with method tables
- Namespace import (`import * as napplet`) documented
- All public types re-exported from `@napplet/core` listed (NostrEvent, NostrFilter, ServiceInfo, Subscription, EventTemplate)
- Runtime guard behavior documented (error when window.napplet not installed)
- SDK vs Shim comparison table present
- Cross-references to `@napplet/shim` and `@napplet/core`

## Must-Haves Checklist

### Plan 44-01
- [x] Section 4.1 mentions both `@napplet/shim` and `@napplet/sdk` with their distinct roles
- [x] `window.napplet` with `relay`, `ipc`, `services`, `storage` sub-objects is documented in SPEC.md
- [x] Section 16.1 raw wire protocol example is preserved unchanged
- [x] Section 16.1 has a note directing developers to convenience packages
- [x] Section 17.1 lists all 8 current @napplet packages including @napplet/sdk

### Plan 44-02
- [x] README documents `@napplet/shim` as side-effect-only with zero named exports
- [x] `window.napplet` shape with `relay`, `ipc`, `services`, `storage` sub-objects is fully documented
- [x] All method signatures for each sub-object are listed
- [x] TypeScript Window augmentation is explained
- [x] Relationship to `@napplet/sdk` is clear (Shim vs SDK comparison table)
- [x] No references to old named exports

### Plan 44-03
- [x] SDK README explains that `@napplet/sdk` provides named exports wrapping `window.napplet`
- [x] Quick Start shows both shim and SDK imports
- [x] All four namespaces documented with method tables
- [x] Namespace import documented per SDK-03
- [x] All public types listed
- [x] Runtime guard behavior documented
- [x] SDK vs Shim comparison table present
- [x] Cross-references to shim and core packages

## Automated Checks

- `pnpm type-check`: 16/16 tasks pass (no regressions)
- SPEC.md: Old `(napplet-side SDK)` text removed, new descriptions verified via grep
- Shim README: Zero old API references (nappState, discoverServices, hasServiceVersion)
- SDK README: File exists, all sections present

## Gaps

None identified.

## Score

3/3 requirements verified. All must-haves satisfied.
