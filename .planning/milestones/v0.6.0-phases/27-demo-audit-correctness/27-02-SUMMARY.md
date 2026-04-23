---
phase: 27-demo-audit-correctness
plan: "02"
subsystem: demo
tags: [demo, debugger, acl, inter-pane, state]
requires:
  - phase: 27-demo-audit-correctness
    provides: audited host path inventory and signer mode
provides:
  - path-accurate ACL labels and capability hints
  - debugger and sequence-diagram path classification for relay, state, signer, and inter-pane flows
  - chat and bot status wording that separates protocol paths instead of flattening them into "shell" failures
affects:
  - apps/demo/src/acl-panel.ts
  - apps/demo/src/debugger.ts
  - apps/demo/src/sequence-diagram.ts
  - apps/demo/napplets/chat/src/main.ts
  - apps/demo/napplets/bot/src/main.ts
tech-stack:
  patterns:
    - Debugger path classification as a pure helper exported for tests
    - Capability copy driven by label/hint maps instead of inline strings
key-files:
  modified:
    - apps/demo/src/acl-panel.ts
    - apps/demo/src/debugger.ts
    - apps/demo/src/sequence-diagram.ts
    - apps/demo/napplets/chat/src/main.ts
    - apps/demo/napplets/bot/src/main.ts
key-decisions:
  - "Kept exact runtime denial strings visible in debugger details instead of replacing them with simplified summaries"
  - "Shifted stable correctness assertions toward debugger path labels where napplet UI copy is still best-effort"
requirements-completed:
  - DEMO-02
  - DEMO-03
duration: "45 min"
completed: "2026-04-01"
---

# Phase 27 Plan 02: Demo denial paths made legible in UI and debugger

ACL controls, debugger entries, sequence labels, and napplet status copy now use path-specific language so relay publish, relay subscribe, inter-pane, signer, and state operations can be distinguished without reading the runtime source.

## Verification

- `pnpm --filter @napplet/demo build` — PASS
- `pnpm vitest run tests/unit/demo-host-audit.test.ts` — PASS

## Deviations from Plan

The debugger became the stable evidence surface for relay and state denials in automation, so the implementation preserved raw denial strings there and kept napplet-level copy as best-effort supplemental messaging.

## Issues Encountered

- Some napplet-visible denial messages still depend on async protocol timing, so automated assertions rely on debugger evidence for those cases.

## Self-Check: PASSED
