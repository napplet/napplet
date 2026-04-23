# Phase 5: Demo Playground - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Build an interactive vanilla TypeScript demo playground that visually demonstrates all napplet protocol capabilities. Two napplets (Chat + Bot) run in a shell host with a protocol debugger showing all message traffic. ACL controls let users toggle capabilities and see immediate effects on both inter-napplet and relay communication.

Requirements covered: DEMO-01..07.

</domain>

<decisions>
## Implementation Decisions

### Layout
- **D-01:** Two-column + bottom layout. Left: both napplet iframes stacked. Right: message debugger. Shell controls in a top bar.
- **D-02:** ACL controls are per-napplet capability toggles. Each napplet gets a panel with toggle switches for each capability (relay:read, relay:write, sign:event, storage:read, etc.). Toggle = instant grant/revoke.

### Styling & Aesthetics
- **D-03:** UnoCSS for utility CSS (Tailwind-compatible, Vite plugin, from Vite ecosystem). Enables easy stylistic changes in later milestones.
- **D-04:** Dark terminal/hacker aesthetic. Dark background, monospace fonts, neon accent colors. Fits protocol/relay inspector vibe.
- **D-05:** Demo should look like a polished product demo, not a developer test page.

### Server & Deployment
- **D-06:** Local development uses Vite dev server. Shell page is the Vite app at localhost, napplet iframes load from NIP-5A test gateway.
- **D-07:** Production deployment targets real infrastructure: blossom for blob storage, relay for events, NIP-5A gateway for serving. The demo itself is deployed as an nsite.

### Message Debugger
- **D-08:** Tabbed view with both a live log (scrolling, color-coded by message type, filterable) AND a sequence diagram (custom SVG swimlane renderer showing Shell ↔ Napplet 1 ↔ Napplet 2 flow).
- **D-09:** Debugger built as a `<napplet-debugger>` web component. Self-contained, extractable as @napplet/devtools later. Shell implementors could embed it in their own apps.
- **D-10:** ACL changes (grant/revoke/block) appear in the debugger log as system events with distinct styling. Shows cause and effect: "revoke relay:write" followed by "CLOSED blocked: capability denied".

### Demo Napplets: Chat + Bot
- **D-11:** Napplet 1 is a Chat app. Publishes messages to remote relays (relay:write + sign:event), subscribes to responses (relay:read), stores chat history (storage:read + storage:write).
- **D-12:** Napplet 2 is a Bot/auto-responder. Listens via inter-pane events, auto-responds with personality, needs its own signing permission (sign:event).
- **D-13:** Bot personality is teachable via chat commands (e.g., `/teach hello Hi there!`). Bot stores learned rules in nappStorage. Shows storage operations in debugger.
- **D-14:** Bot should be interactive and fun to play with — not just a scripted demo. Simple rule-based with editable personality.

### ACL Demonstration Scope
- **D-15:** Demo must show BOTH napp ↔ ACL ↔ napp (inter-pane gating) AND napp ↔ ACL ↔ remote relays (relay access gating). Key scenarios:
  - Revoke chat's relay:write → messages compose but never reach relays
  - Block bot → chat messages stop reaching it via inter-pane
  - Revoke bot's sign:event → bot can hear but can't respond
  - Revoke chat's relay:read → can't see incoming messages from relays
  - Consent prompt when bot attempts destructive signing kind

### Claude's Discretion
- Exact neon accent color palette
- Debugger filter UI design
- Custom SVG swimlane renderer implementation details
- Chat UI layout within the napplet iframe
- Bot default personality/responses before user teaches it
- Specific chat commands beyond `/teach`

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### NIP Specifications
- `https://raw.githubusercontent.com/nostr-protocol/nips/refs/heads/master/5A.md` — NIP-5A nsite spec (gateway format, deployment target)

### Protocol & Architecture
- `.planning/codebase/ARCHITECTURE.md` — Full architecture, ShellHooks interface, data flows
- `.planning/codebase/CONCERNS.md` — Known issues relevant to demo (permissive ACL default, postMessage origin)

### Prior Phase Context
- `.planning/phases/01-wiring-fixes/01-CONTEXT.md` — Relay URI `shell://`, meta tags `napplet-*`, storage NIP tags
- `.planning/phases/02-test-infrastructure/02-CONTEXT.md` — NIP-5A gateway, mock relay, message tap (reusable for debugger data source)
- `.planning/phases/03-core-protocol-tests/03-CONTEXT.md` — NIP-01 error prefixes, `blocked:` ACL prefix, sender exclusion rules
- `.planning/phases/04-capability-tests/04-CONTEXT.md` — UTF-8 quota calc, consent mock patterns, ACL format assertions

### Requirements
- `.planning/REQUIREMENTS.md` — DEMO-01 through DEMO-07 with success criteria

### Research
- `.planning/research/ARCHITECTURE.md` — Demo architecture recommendations, message tap as debugger data source
- `.planning/research/FEATURES.md` — Comparable platform demos (Farcaster Frame Playground, Figma Plugin Console)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Phase 2 message tap — data source for the debugger's live log and sequence diagram
- Phase 2 NIP-5A test gateway — can serve demo napplets
- Phase 2 test napplets — patterns for building napplet apps with @napplet/shim
- `packages/shell/src/pseudo-relay.ts` createPseudoRelay() — shell setup pattern for the demo host
- `packages/vite-plugin/src/index.ts` nip5aManifest() — build demo napplets with real manifests

### Established Patterns
- ShellHooks dependency injection for shell setup
- postMessage NIP-01 wire format for all communication
- ACL capabilities: relay:read, relay:write, sign:event, sign:nip04, sign:nip44, storage:read, storage:write
- Inter-pane: kind 29003 with ['t', topic] tag
- Storage: kind 29001 requests with scoped keys
- Signer: kind 29001 requests, kind 29002 responses

### Integration Points
- Demo shell page calls createPseudoRelay(hooks) with real relay pool hooks (not mocks)
- Demo napplets import @napplet/shim
- Debugger web component consumes message tap data
- ACL toggle UI calls aclStore.grant()/revoke()/block() on the live pseudo-relay instance

</code_context>

<specifics>
## Specific Ideas

- The debugger web component should be designed for extraction — clean API, no demo-specific dependencies. Could become @napplet/devtools in a future milestone.
- Production deployment as an nsite means the demo itself validates the NIP-5A publishing flow end-to-end.
- The `/teach` command pattern makes the demo self-documenting: users discover capabilities by chatting.

</specifics>

<deferred>
## Deferred Ideas

- **@napplet/devtools package** — Extract debugger web component as a standalone package. Future milestone.
- **Music production demo** — Alternative napplet pairing (two sequencers syncing BPM). Interesting but more complex than Chat + Bot.
- **Stream + Chat** — Borrowed from hyprgate. Practical but less novel than Chat + Bot.

</deferred>

---

*Phase: 05-demo-playground*
*Context gathered: 2026-03-30*
