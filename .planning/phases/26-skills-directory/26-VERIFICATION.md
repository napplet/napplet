---
phase: 26-skills-directory
status: passed
verified: 2026-04-01
verifier: inline (sonnet-4-6)
---

# Phase 26 Verification: Skills Directory

## Goal

Agents and developers can pull portable skill files to reliably build with napplet without reading the full spec or source code.

## Requirements Checked

| Requirement | Status | Evidence |
|-------------|--------|----------|
| SKILL-01 | PASS | `skills/build-napplet/SKILL.md` exists, covers all 9 API surfaces |
| SKILL-02 | PASS | `skills/integrate-shell/SKILL.md` exists, covers full shell integration |
| SKILL-03 | PASS | `skills/add-service/SKILL.md` exists, covers ServiceHandler implementation |

## Must-Haves Verification

### SKILL-01: skills/build-napplet/SKILL.md

- [x] File exists at `skills/build-napplet/SKILL.md`
- [x] Valid agentskills.io YAML frontmatter with `name: build-napplet` and `description:`
- [x] Covers all 9 API surfaces: vite-plugin setup (`nip5aManifest`), `subscribe`, `publish`, `query`, `nappStorage`, `window.nostr` NIP-07 proxy, `emit`, `on`, `discoverServices`/`hasService`/`hasServiceVersion`
- [x] All code blocks are TypeScript with realistic non-abstract examples grounded in actual source
- [x] Self-contained — no external README required to implement a working napplet
- [x] Common pitfalls section present (8 items)
- [x] No framework dependencies (React/Svelte/Vue absent)

### SKILL-02: skills/integrate-shell/SKILL.md

- [x] File exists at `skills/integrate-shell/SKILL.md`
- [x] Valid agentskills.io YAML frontmatter with `name: integrate-shell` and `description:`
- [x] Covers `createShellBridge(hooks)` with all 8 required hook groups
- [x] Shows `relayPool`, `relayConfig`, `auth`, `crypto`, `windowManager`, `config`, `hotkeys`, `workerRelay`
- [x] Shows `originRegistry.register()` and `bridge.sendChallenge()` in correct order
- [x] Shows `registerConsentHandler` for kinds 0/3/5/10002
- [x] Shows `bridge.runtime.registerService()` for dynamic service wiring
- [x] Shows `bridge.destroy()` teardown pattern
- [x] Common pitfalls section present (8 items including critical ordering note)
- [x] No framework dependencies (React/Svelte/Vue absent)

### SKILL-03: skills/add-service/SKILL.md

- [x] File exists at `skills/add-service/SKILL.md`
- [x] Valid agentskills.io YAML frontmatter with `name: add-service` and `description:`
- [x] Covers `ServiceDescriptor` with all 3 fields (name, version, description)
- [x] Covers `ServiceHandler` factory pattern with `handleMessage` and `onWindowDestroyed`
- [x] Shows topic extraction via `event.tags?.find((t) => t[0] === 't')?.[1]`
- [x] Shows `send()` for both `['OK', ...]` acknowledgment and `['EVENT', '__shell__', ...]` data responses
- [x] Shows both registration patterns: `hooks.services` and `runtime.registerService()`
- [x] Includes napplet-side verification step with `discoverServices` and `hasService`
- [x] References `audio-service.ts` as canonical reference implementation
- [x] Common pitfalls section present (8 items)
- [x] No framework dependencies (React/Svelte/Vue absent)

## Automated Checks

```
SKILL-01:
  test -f skills/build-napplet/SKILL.md → PASS
  grep "name: build-napplet" → PASS
  All 9 API terms present → PASS (all 9/9)
  No framework deps → PASS

SKILL-02:
  test -f skills/integrate-shell/SKILL.md → PASS
  grep "name: integrate-shell" → PASS
  All integration point terms present → PASS (all 10/10)
  No framework deps → PASS

SKILL-03:
  test -f skills/add-service/SKILL.md → PASS
  grep "name: add-service" → PASS
  All service terms present → PASS (all 8/8)
  No framework deps → PASS
```

## Regression Gate

Phase 26 creates documentation-only files (3 SKILL.md files). No source code was modified. No regression risk.

## Summary

All 3 skill files created and verified. Phase 26 goal achieved: agents and developers can use these portable skill files to reliably build with napplet without reading the full spec or source code first.
