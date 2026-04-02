---
status: passed
phase: 41
phase_name: shim-restructure
verified: 2026-04-02T10:55:00.000Z
verifier: inline (41-02-SUMMARY.md)
requirement_ids: [PKG-01, WIN-01, WIN-02, WIN-03, WIN-04, DEP-01, DEP-02]
---

# Phase 41: Shim Restructure — Verification

Reconstructed from 41-02-SUMMARY.md verification evidence.

## Goal Verification

**Phase Goal:** Developers importing @napplet/shim get a side-effect-only module that installs a fully namespaced window.napplet global with zero named exports

**Result:** PASSED

## Requirements

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|----------|
| PKG-01 | Shim zero named exports | Verified | Zero named export declarations in shim index.ts and dist/index.d.ts |
| WIN-01 | window.napplet.relay | Verified | relay sub-object present with subscribe/publish/query |
| WIN-02 | window.napplet.ipc | Verified | ipc sub-object present with emit/on |
| WIN-03 | window.napplet.services | Verified | services sub-object present with list/has |
| WIN-04 | window.napplet.storage | Verified | storage sub-object present with getItem/setItem/removeItem/keys |
| DEP-01 | discoverServices etc. removed | Verified | No discoverServices/hasService/hasServiceVersion exports |
| DEP-02 | nappState etc. removed | Verified | No nappletState/nappState/nappStorage exports |

## Build Verification

- All 7 core packages build clean (core, acl, runtime, shim, shell, services, vite-plugin)
- `pnpm type-check` passes with zero errors
- dist/index.d.ts contains `declare global { interface Window { napplet: NappletGlobal } }` and zero named exports
- NappletGlobal, Subscription, EventTemplate, ServiceInfo added to @napplet/core

## must_haves

- [x] Zero named exports from @napplet/shim
- [x] window.napplet with relay/ipc/services/storage sub-objects
- [x] NappletGlobal type in @napplet/core
- [x] Window type augmentation via declare global
- [x] Deprecated exports removed (discoverServices, hasService, hasServiceVersion, nappState, nappStorage, nappletState)
- [x] clear() method dropped from storage
- [x] All 7 core packages build and type-check
