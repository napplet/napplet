---
status: passed
phase: 82-documentation
verified: 2026-04-08
---

# Phase 82: Documentation - Verification

## Must-Haves

| # | Truth | Status |
|---|-------|--------|
| 1 | core/README.md documents namespaced supports() and does not mention BusKind | PASS |
| 2 | shim/README.md does not reference window.napplet.services or discovery API | PASS |
| 3 | sdk/README.md shows namespaced supports() examples with NamespacedCapability | PASS |
| 4 | NIP-5D does not reference old flat supports() or kind 29010 | N/A (not in repo) |

## Requirements Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| DOC-01 | PASS | BusKind table removed, ServiceDescriptor removed, NamespacedCapability added |
| DOC-02 | PASS | services section removed, supports() updated to namespaced examples |
| DOC-03 | PASS | services namespace removed, NamespacedCapability in types table, namespaced examples |
| DOC-04 | N/A | NIP-5D.md is in nostr-protocol/nips repo, not this monorepo |
