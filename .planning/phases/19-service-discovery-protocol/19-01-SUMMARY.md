---
plan: 19-01
phase: 19-service-discovery-protocol
title: "Kind 29010 discovery — intercept, synthesize, track"
status: complete
completed: 2026-03-31
---

# Summary: Plan 19-01

## What Was Built

Implemented the kind 29010 service discovery protocol in `@napplet/runtime`.

## Key Files Created/Modified

- **packages/runtime/src/service-discovery.ts** (new) — Discovery event synthesis module
  - `createServiceDiscoveryEvent(handler, randomId)` — Creates synthetic kind 29010 events with sentinel pubkey/sig and s/v/d tags per SPEC.md Section 11.2
  - `handleDiscoveryReq(windowId, subId, services, send, generateId)` — Enumerates registry, sends one EVENT per service, then EOSE. Returns DiscoverySubscription for live tracking
  - `isDiscoveryReq(filters)` — Detects pure kind 29010 filter REQs
  - `DiscoverySubscription` interface for tracking live subscriptions

- **packages/runtime/src/runtime.ts** (modified) — Five integration points:
  1. Imports from service-discovery.ts
  2. `discoverySubscriptions` Map for tracking live subscriptions
  3. `handleReq()` intercepts kind 29010 REQs BEFORE relay pool (routes to handleDiscoveryReq)
  4. `registerService()` pushes synthetic EVENT to all open discovery subscriptions
  5. `handleClose()`, `destroyWindow()`, `destroy()` all clean up discovery subscriptions

- **packages/runtime/src/index.ts** (modified) — Exports all discovery symbols

## Requirements Satisfied

- DISC-01: Runtime responds to kind 29010 REQ with EVENT per service + EOSE
- DISC-02: Discovery events have s/v/d tags, sentinel pubkey/sig
- DISC-03: All serviceRegistry entries appear in same unified response
- DISC-04: Empty registry sends EOSE immediately with zero EVENTs
- D-09: Discovery handled by runtime, not a service
- D-10: Live subscriptions receive updates when registerService() is called
- D-11: Sentinel values for synthetic events

## Self-Check: PASSED

- pnpm build: exit 0 (all 13 packages)
- pnpm type-check: exit 0 (12 packages)
- dist/index.d.ts: contains createServiceDiscoveryEvent, handleDiscoveryReq, isDiscoveryReq, DiscoverySubscription

## Key-Files Created

```yaml
key-files:
  created:
    - packages/runtime/src/service-discovery.ts
  modified:
    - packages/runtime/src/runtime.ts
    - packages/runtime/src/index.ts
```
