---
phase: 05-demo-playground
plan: 02
status: complete
started: 2026-03-30T18:10:00.000Z
completed: 2026-03-30T18:25:00.000Z
---

# Plan 05-02 Summary: Shell Host, Debugger, ACL Panel

## What was built
Implemented the shell host module with mock hooks, message tap, and napplet iframe management. Created the `<napplet-debugger>` web component with live log and tab structure. Built the ACL control panel with per-napplet capability toggles.

## Key files created
- `apps/demo/src/shell-host.ts` -- shell host with createPseudoRelay, message tap, proxy pattern
- `apps/demo/src/debugger.ts` -- `<napplet-debugger>` custom element with Shadow DOM
- `apps/demo/src/acl-panel.ts` -- ACL toggle panel with scenario hints
- `apps/demo/src/main.ts` -- entry point wiring shell, debugger, and ACL panel

## Key decisions
- Inlined message tap rather than importing from tests/helpers (not a published package)
- Used same proxy pattern as harness.ts for outbound message capture
- Debugger stores all messages for sequence diagram regardless of filter state
- ACL panel auto-re-renders until all napplets authenticated

## Verification
- [x] Shell host boots pseudo-relay with mock hooks
- [x] Debugger shows color-coded live log
- [x] ACL panel renders per-napplet toggles
- [x] pnpm --filter @napplet/demo build succeeds

## Self-Check: PASSED
