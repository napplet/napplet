---
status: awaiting_human_verify
trigger: "Two bugs in demo: Bot napplet stuck on loading, ACL control panel not visible"
created: 2026-03-30T00:00:00Z
updated: 2026-03-30T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - nappKeyRegistry.getByWindowId() does not exist, causing auth detection failure
test: Verified napp-key-registry.ts has no getByWindowId method; shell-host.ts calls it at line 302
expecting: Fix by using getPubkey(wid) then getEntry(pubkey) instead
next_action: Apply fix to shell-host.ts

## Symptoms

expected:
1. Bot napplet should display an interactive chat bot with teachable responses (/teach command). Should show bot personality and respond to messages from the chat napplet.
2. ACL controls should appear in the UI as per-napplet capability toggles (relay:read, relay:write, sign:event, storage:read, etc.) that can be toggled to grant/revoke capabilities with immediate visual effect.

actual:
1. Bot napplet shows "loading..." text indefinitely. Below it shows "0 rules" and partial text "ning for" and "sage" (likely "listening for message").
2. No ACL controls visible anywhere in the demo UI.

errors: No error messages visible in the screenshot. The Live Log and Sequence Diagram tabs appear to work correctly — protocol messages are flowing.

reproduction: Run `cd apps/demo && pnpm dev`, open the browser. Bot napplet iframe shows loading state. ACL panel not rendered.

started: First time running the demo after Phase 5 execution. Implementation bugs, not regressions.

## Eliminated

## Evidence

- timestamp: 2026-03-30T00:10:00Z
  checked: napp-key-registry.ts API surface
  found: No getByWindowId method exists. Available methods are: register, unregister, getPubkey(windowId), getEntry(pubkey), getWindowId(pubkey), isRegistered, getAllEntries, etc.
  implication: shell-host.ts line 302 calls nappKeyRegistry.getByWindowId(wid) which returns undefined, so info.authenticated is never set to true

- timestamp: 2026-03-30T00:11:00Z
  checked: ACL panel rendering logic in acl-panel.ts
  found: renderAclPanel() checks `if (!info.authenticated) continue;` on line 39 -- skips rendering for unauthenticated napplets
  implication: Since info.authenticated is never true (due to bug above), ACL panel renders nothing

- timestamp: 2026-03-30T00:12:00Z
  checked: main.ts status update logic (lines 35-42)
  found: Status updates check `if (botInfo.authenticated && botStatus)` -- also depends on info.authenticated
  implication: Both symptoms (loading status + missing ACL) share the same root cause

## Resolution

root_cause: shell-host.ts calls nappKeyRegistry.getByWindowId(wid) which does not exist as a method on nappKeyRegistry. The method returns undefined, so info.authenticated is never set to true, causing both the status indicator to stay "loading..." and the ACL panel to not render.
fix: Replace nappKeyRegistry.getByWindowId(wid) with the correct two-step lookup: nappKeyRegistry.getPubkey(wid) then nappKeyRegistry.getEntry(pubkey)
verification: TypeScript compiles clean (npx tsc --noEmit). Awaiting human verification that demo shows authenticated status and ACL controls.
files_changed: [apps/demo/src/shell-host.ts]
