---
plan: 26-01
status: complete
completed: 2026-04-01
---

# Plan 26-01: Create skills/build-napplet/SKILL.md

## What Was Built

Created `skills/build-napplet/SKILL.md` — an agentskills.io-format skill file covering all 9 API surfaces of `@napplet/shim`. The skill enables an AI agent or developer to write a working napplet without reading the full spec or source code.

## Key Files

### Created
- `skills/build-napplet/SKILL.md` — Napplet author skill (agentskills.io format, 206 lines)

## Approach

Read the actual source files (`packages/shim/src/index.ts`, `relay-shim.ts`, `state-shim.ts`, `discovery-shim.ts`, `packages/vite-plugin/src/index.ts`) to extract exact API signatures and type names. All 9 steps use realistic TypeScript examples grounded in the real implementation.

## Self-Check: PASSED

All acceptance criteria verified:
- File exists with valid agentskills.io frontmatter (`name: build-napplet`)
- All 9 API surfaces covered: nip5aManifest, subscribe, publish, query, nappStorage, window.nostr, emit, discoverServices, hasService
- Common pitfalls section present
- No framework dependencies (React/Svelte/Vue)
