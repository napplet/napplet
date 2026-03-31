---
phase: 13
plan: 3
status: complete
started: 2026-03-31
completed: 2026-03-31
---

# Summary: Plan 13-03 — Move ACL State, Manifest Cache, Replay, and Event Buffer

## What was built

Four browser-agnostic modules:
- `acl-state.ts`: Wraps @napplet/acl's pure functions with RuntimeAclPersistence hooks. Includes capability string-to-bit mapping.
- `manifest-cache.ts`: Manifest cache factory using RuntimeManifestPersistence instead of localStorage.
- `replay.ts`: Standalone replay detection (extracted from shell-bridge closure).
- `event-buffer.ts`: Ring buffer + subscription delivery using sendToNapplet transport.

## Key decisions

- **capToBit mapping**: Created `CAP_MAP` to bridge @napplet/core's string Capability type to @napplet/acl's bitfield constants.
- **bitsToCapabilities inverse**: For `getAllEntries()` and `getEntry()` which need to convert bitfields back to string arrays.
- **Self-reference in ManifestCache**: Used `const self: ManifestCache` pattern to enable `this.persist()` in set/remove methods without binding issues.

## Key files

### Created
- `packages/runtime/src/acl-state.ts`
- `packages/runtime/src/manifest-cache.ts`
- `packages/runtime/src/replay.ts`
- `packages/runtime/src/event-buffer.ts`

## Self-Check: PASSED
- No localStorage references in any module
- All persistence delegated to hooks
- Package builds and type-checks cleanly
