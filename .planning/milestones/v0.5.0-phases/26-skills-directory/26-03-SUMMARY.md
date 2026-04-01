---
plan: 26-03
status: complete
completed: 2026-04-01
---

# Plan 26-03: Create skills/add-service/SKILL.md

## What Was Built

Created `skills/add-service/SKILL.md` — an agentskills.io-format skill file covering full `ServiceHandler` implementation from descriptor through registration and napplet-side verification.

## Key Files

### Created
- `skills/add-service/SKILL.md` — Service author skill (agentskills.io format, 178 lines)

## Approach

Read `packages/runtime/src/types.ts` for exact `ServiceHandler`/`ServiceDescriptor` interfaces, `packages/services/src/audio-service.ts` as the canonical reference implementation pattern, and `packages/shim/src/discovery-shim.ts` for the napplet-side verification step. The factory function pattern and topic routing approach mirror the audio service implementation exactly.

## Self-Check: PASSED

All acceptance criteria verified:
- File exists with valid agentskills.io frontmatter (`name: add-service`)
- Coverage: ServiceDescriptor, ServiceHandler, handleMessage, onWindowDestroyed, event.tags?.find, registerService, discoverServices, reference to audio-service.ts
- Common pitfalls section present
- No framework dependencies (React/Svelte/Vue)
