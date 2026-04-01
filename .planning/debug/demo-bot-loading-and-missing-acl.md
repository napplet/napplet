---
status: resolved
trigger: "Two bugs in demo: Bot napplet stuck on loading, ACL control panel not visible"
created: 2026-03-30T00:00:00Z
updated: 2026-04-01T00:00:00Z
---

## Current Focus

hypothesis: RESOLVED
next_action: Human verification that demo shows authenticated status and ACL controls.

## Symptoms

expected:
1. Bot napplet should display an interactive chat bot with teachable responses (/teach command). Should show bot personality and respond to messages from the chat napplet.
2. ACL controls should appear in the UI as per-napplet capability toggles (relay:read, relay:write, sign:event, storage:read, etc.) that can be toggled to grant/revoke capabilities with immediate visual effect.

actual:
1. Bot napplet shows "loading..." text indefinitely. Below it shows "0 rules" and partial text "ning for" and "sage" (likely "listening for message").
2. No ACL controls visible anywhere in the demo UI.
3. (Phase 38 regression) AUTH header shows "pending" despite auth completing in logs.

errors: No error messages visible in the screenshot. The Live Log and Sequence Diagram tabs appear to work correctly — protocol messages are flowing.

reproduction: Run `cd apps/demo && pnpm dev`, open the browser. Bot napplet iframe shows loading state. ACL panel not rendered.

started: First time running the demo after Phase 5 execution. Phase 38 regression introduced second root cause.

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

- timestamp: 2026-04-01T00:00:00Z
  checked: Phase 38 rename — nappKeyRegistry → sessionRegistry in @napplet/runtime
  found: Runtime interface exposes `readonly sessionRegistry: SessionRegistry` only. No deprecated alias on the Runtime type (alias exists only in shell package). shell-host.ts still used relay.runtime.nappKeyRegistry (undefined at runtime).
  implication: After initial fix was applied (two-step lookup), Phase 38 renamed the runtime property name itself, breaking auth detection again.

- timestamp: 2026-04-01T00:00:00Z
  checked: acl-panel.ts DEMO_CAPABILITY_LABELS/HINTS Record<Capability, string>
  found: Capability type now has 10 members (cache:read, cache:write, sign:nip04, sign:nip44 added) but records only had 6. TS error.
  implication: TypeScript error only — Vite/JS runtime would still work, but labels incomplete.

## Resolution

root_cause_1: shell-host.ts originally called nappKeyRegistry.getByWindowId(wid) (fixed 2026-03-30).
root_cause_2: Phase 38 renamed nappKeyRegistry → sessionRegistry on the Runtime interface. shell-host.ts accessed relay.runtime.nappKeyRegistry which is undefined, causing info.authenticated to never be set to true.
root_cause_3: acl-panel.ts DEMO_CAPABILITY_LABELS/DEMO_CAPABILITY_HINTS Record<Capability, string> missing 4 new capabilities added in later phases.

fix_1: Replace relay.runtime.nappKeyRegistry with relay.runtime.sessionRegistry in shell-host.ts (lines 490, 492)
fix_2: Add cache:read, cache:write, sign:nip04, sign:nip44 entries to DEMO_CAPABILITY_LABELS and DEMO_CAPABILITY_HINTS in acl-panel.ts

verification: TypeScript compiles clean (no errors in shell-host.ts or acl-panel.ts). Awaiting human verification.
files_changed: [apps/demo/src/shell-host.ts, apps/demo/src/acl-panel.ts]

## Remaining Pre-Existing Issues (out of scope)

- debugger.ts, notification-demo.ts, sequence-diagram.ts: KINDS.INTER_PANE does not exist (should be BusKind.IPC_PEER)
- nip46-client.ts, signer-connection.ts: Cannot find module '@napplet/runtime'
