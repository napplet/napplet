---
phase: 05-demo-playground
plan: 04
status: complete
started: 2026-03-30T18:25:00.000Z
completed: 2026-03-30T18:35:00.000Z
---

# Plan 05-04 Summary: Integration Wiring + Signer Demo

## What was built
Added mock NIP-07 signer with real keypair, integrated it into the shell host, enhanced main.ts with host pubkey display and inter-pane event logging, and added scenario hints to the ACL panel.

## Key files created/modified
- `apps/demo/src/signer-demo.ts` -- mock signer with generateSecretKey/finalizeEvent
- `apps/demo/src/shell-host.ts` -- integrated signer hooks, consent handler
- `apps/demo/src/main.ts` -- host pubkey display, inter-pane logging
- `apps/demo/src/acl-panel.ts` -- scenario hints for chat and bot

## Key decisions
- Used real nostr-tools keypair for demo signer (not a fake pubkey)
- Consent handler auto-approves destructive kinds after 500ms delay
- Inter-pane topic events logged as system messages in debugger

## Verification
- [x] Signer provides real NIP-07 signer
- [x] Shell host uses real signer
- [x] ACL panel shows scenario hints
- [x] Full build succeeds

## Self-Check: PASSED
