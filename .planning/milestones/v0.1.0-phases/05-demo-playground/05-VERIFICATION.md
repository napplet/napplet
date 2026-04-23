---
status: human_needed
phase: 05-demo-playground
verifier: automated-inline
verified_at: 2026-03-30T18:40:00.000Z
---

# Phase 05 Verification: Demo Playground

## Phase Goal
An interactive vanilla TypeScript playground demonstrates every protocol capability visually, proving the SDK is usable and the developer experience is sound.

## Requirements Coverage

| Req ID | Description | Status |
|--------|-------------|--------|
| DEMO-01 | Shell host loads two napplet iframes with AUTH | VERIFIED (code) |
| DEMO-02 | Both napplets complete AUTH handshake | VERIFIED (code) |
| DEMO-03 | Visual message debugger with color coding + sequence diagram | VERIFIED (code) |
| DEMO-04 | Inter-pane communication visible | VERIFIED (code) |
| DEMO-05 | Interactive ACL controls | VERIFIED (code) |
| DEMO-06 | Signer delegation visible | VERIFIED (code) |
| DEMO-07 | Storage operations with scoped isolation | VERIFIED (code) |

## Must-Have Verification

### SC1: Shell host loads two iframes, AUTH completes
- [x] `main.ts` calls `loadNapplet('chat')` and `loadNapplet('bot')`
- [x] `shell-host.ts` creates sandboxed iframes with `allow-scripts`
- [x] `originRegistry.register()` and `relay.sendChallenge()` called on iframe load
- [x] Both napplets import `@napplet/shim` which handles AUTH automatically
- **Status**: PASS (code verified)

### SC2: Visual debugger with color coding
- [x] `<napplet-debugger>` custom element with Shadow DOM
- [x] VERB_COLORS maps all verbs (AUTH=purple, EVENT=green, REQ=blue, OK=gray, etc.)
- [x] Filter controls for verb type and direction
- [x] Pause/resume with message buffering
- **Status**: PASS (code verified)

### SC3: Napplet-to-napplet communication visible
- [x] Chat emits `chat:message` via `emit()`, bot listens via `on('chat:message')`
- [x] Bot emits `bot:response` via `emit()`, chat listens via `on('bot:response')`
- [x] `main.ts` logs inter-pane topic events as system messages in debugger
- [x] Sequence diagram shows arrows between Chat/Shell/Bot lanes
- **Status**: PASS (code verified)

### SC4: Interactive ACL controls
- [x] ACL panel renders toggles for relay:read, relay:write, sign:event, storage:read, storage:write
- [x] Toggle calls `aclStore.grant()`/`aclStore.revoke()` via shell-host
- [x] Block button calls `aclStore.block()`/`aclStore.unblock()`
- [x] Changes logged as SYSTEM messages in debugger
- [x] Scenario hints on each napplet panel
- **Status**: PASS (code verified)

### SC5: Signer delegation and storage visible
- [x] `signer-demo.ts` generates real keypair with nostr-tools
- [x] Shell host uses real signer (not null) via `createSignerHooks()`
- [x] Consent handler auto-approves destructive kinds after 500ms
- [x] Chat stores history via `nappStorage`, bot stores rules via `nappStorage`
- [x] Each napplet uses different nappStorage key (scoped by napp type)
- **Status**: PASS (code verified)

## Build Verification
- [x] `pnpm build` -- all 10 workspace packages build (0 errors)
- [x] `pnpm --filter @napplet/demo build` -- demo app builds
- [x] `pnpm --filter @napplet/demo-chat build` -- chat napplet builds
- [x] `pnpm --filter @napplet/demo-bot build` -- bot napplet builds

## Human Verification Items

The following items require visual/interactive testing in a browser:

1. **AUTH handshake visual flow**: Open demo, verify both napplet status indicators show "authenticated" with green color
2. **Chat/bot interaction**: Type a message in chat, verify bot responds and response appears in chat
3. **Debugger live log**: Verify AUTH, REQ, EVENT messages appear color-coded in debugger
4. **ACL toggle effect**: Revoke relay:write on chat, verify publish fails. Block bot, verify chat:message undeliverable.
5. **Sequence diagram**: Switch to Sequence tab, verify SVG renders with three lanes and arrows
6. **Storage persistence**: Type messages, verify history loads on page refresh. Use /teach command, verify rules persist.

## Score

**Automated: 5/5 must-haves verified (code analysis)**
**Human: 6 items pending visual testing**
