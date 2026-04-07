# Milestones

## v0.16.0 Wire Format & NUB Architecture (Shipped: 2026-04-07)

**Phases completed:** 6 phases, 10 plans, 20 tasks

**Key accomplishments:**

- NIP-5D v4 rewritten as transport+identity+manifest+NUB-negotiation spec with generic JSON envelope { type, ...payload } wire format -- zero protocol message definitions, 122 lines
- JSON envelope base types (NappletMessage, NubDomain, ShellSupports) added to @napplet/core with NIP-01 bus constants isolated in legacy.ts
- 4 NUB scaffold packages (relay, signer, storage, ifc) with domain-specific message types extending NappletMessage and template literal type constraints
- NUB dispatch infrastructure with factory-isolated registries, domain-prefix routing, and 12-test conformance suite
- Relay (9 messages) and signer (14 messages) NUB modules with full discriminated unions and core dispatch registration
- Storage (8 types) and IFC (14 types) NUB modules with full discriminated unions and core dispatch registration
- All 6 shim source files migrated from NIP-01 array wire format to JSON envelope messages using NUB module types, with window.napplet API signatures unchanged
- SDK re-exports all 62 NUB message types, 4 aliased domain constants, and core envelope types -- `import { RelaySubscribeMessage, relay } from '@napplet/sdk'` works
- @napplet/core and @napplet/shim READMEs rewritten for JSON envelope + NUB architecture with full wire format reference and deprecation notices
- Rewrote @napplet/sdk README and root README to reflect JSON envelope wire format and modular NUB architecture introduced in Phases 74-78.

---

## v0.15.0 Protocol Simplification (Shipped: 2026-04-07)

**Phases completed:** 4 phases, 4 plans, 8 tasks

**Key accomplishments:**

- Removed AUTH/handshake types and constants from @napplet/core, bumped protocol to v3.0.0, and updated EventTemplate to document unsigned-message contract
- Strip all signing code, keypair handling, AUTH flow, and nostr-tools dependency from @napplet/shim -- zero-crypto shim sends unsigned event templates via postMessage
- NIP-5D v3 rewritten for simplified wire protocol -- AUTH/REGISTER/IDENTITY removed, shell-assigned identity via MessageEvent.source, unsigned event templates
- All 5 package READMEs updated to reflect v0.15.0 no-crypto wire protocol: removed AUTH/keypair/nostr-tools/NIP-42 references, added message.source identity model, replaced RUNTIME-SPEC.md links with NIP-5D

---

## v0.14.0 Repo Cleanup & Audit (Shipped: 2026-04-06)

**Phases completed:** 2 phases, 3 plans, 5 tasks

**Key accomplishments:**

- Removed dead test:e2e turbo task, deleted stale Playwright artifacts and PRBODY.md, verified all 4 package exports and config files are clean
- Updated RUNTIME-SPEC.md, 3 skills, and 6 NUB specs to replace stale references
- Structured assessment of all remaining @napplet content with concrete stay/move/split recommendations

---

## v0.13.0 Runtime Decoupling & Publish (Shipped: 2026-04-06)

**Phases completed:** 6 phases, 11 plans, 18 tasks

**Key accomplishments:**

- Shell runtime packages extracted to separate repo with 4 packages (acl, runtime, shell, services)
- 40 source files migrated with import rewrites — full monorepo builds and type-checks clean
- Demo playground and test suite (252 unit + 127 e2e) migrated
- @napplet slimmed to 4-package SDK (core, shim, sdk, vite-plugin) — 29,500 lines removed
- GitHub Actions CI/CD workflows for @napplet npm publishing with changesets integration
- Root README and all package READMEs updated for 4-package SDK

### Known Gaps

- `PUB-04`: npm publish deferred — requires human npm auth (npm login + NPM_TOKEN GitHub secret)

---

## v0.12.0 Spec Packaging (Shipped: 2026-04-06)

**Phases completed:** 1 phase, 1 plan, 2 tasks

**Key accomplishments:**

- Renamed SPEC.md to RUNTIME-SPEC.md with internal-reference header distinguishing it from the NIP standard
- Finalized NIP-5D v2 with References section listing NIP-01, NIP-07, NIP-42, NIP-45, NIP-5A
- Updated 8 package READMEs and 4 source files to reference RUNTIME-SPEC.md
- NIP-5D at 199 lines — all nips format conventions met, ready for submission

### Known Gaps

- `RES-01`: NIP number conflict with Scrolls PR#2281 — unresolved, carry forward
- `NUB-01`, `NUB-02`, `NUB-03`: NUB governance and interface specs — descoped from v0.12.0, move to future milestone

---

## v0.11.0 Clean up Side Panel (Shipped: 2026-04-05)

**Phases completed:** 3 phases, 4 plans, 8 tasks

**Key accomplishments:**

- ConstantDef extended with relevantRoles topology annotations and three query methods (getEditableDefs, getReadOnlyDefs, getByRole) for downstream tab reorganization and contextual filtering
- Read-only protocol kind reference cards in new kinds-panel.ts; Constants panel constrained to editable-only values with domain-based header update
- Three-tab inspector (Node/Constants/Kinds) with tab persistence across node selection and polling timer guard preventing slider/input destruction
- Constants tab filters by selected topology node role with show-all toggle and role-aware empty state

---

## v0.10.0 Demo Consistency and Usability Pass (Shipped: 2026-04-04)

**Phases completed:** 5 phases, 20 plans, 28 tasks

**Key accomplishments:**

- AclCheckEvent now carries the triggering NIP-01 message, and every enforce() decision is captured in a per-napplet ring buffer
- Full-screen capability matrix modal shows granted/revoked/default state for all napplets across all 10 ACL capabilities
- Inspector panel now shows per-capability status, denial history with expandable raw events, and a policy matrix button on the ACL node
- ACL ring buffer size wired to demo-config constants panel; full build and type-check pass clean
- Persistent handler store and toggleService()/isServiceEnabled() API in shell-host.ts for runtime service disable/re-enable
- Interactive capability grid cells and services toggle section in ACL policy modal with external refresh support
- Toggle icon overlay on topology service nodes with visual dimming for disabled state and callback-based event wiring
- Full bidirectional sync between topology toggles, ACL modal, and inline ACL panel for consistent state across all views
- Hop-by-hop edge color sweep animation engine with active animation counter and configurable 150ms hop duration
- Extended PersistenceMode to 4-way union with 'trace' — no-op recording and null queries for ephemeral animation mode
- Trace button added as 4th color mode option; flow animator dispatches hop-by-hop animateTrace on each message in trace mode
- Clean transitions between trace and other modes — cancels pending animations and clears node overlays

---

## v0.9.0 Identity & Trust (Shipped: 2026-04-03)

**Phases completed:** 3 phases, 7 plans, 15 tasks

**Key accomplishments:**

- Shell-delegated deterministic keypair handshake (REGISTER -> IDENTITY -> AUTH) replacing ephemeral keys — storage now survives page reloads
- Pubkey-free storage scoping (`dTag:aggregateHash:userKey`) with triple-read backward-compatible migration across 3 historical formats
- SEC-01 guard blocking delegated keys from external relay publishing — only the user's signer (NIP-07/NIP-46) signs events that leave the shell
- Aggregate hash verification with in-memory caching — warns on mismatch but does not block registration
- Permanent removal of deprecated RuntimeHooks/ShellHooks type aliases — importing old names now fails at compile time
- SPEC.md updated for new handshake (Section 2), storage model (Section 5), and delegated key security (Section 14)

---

## v0.8.0 Shim/SDK Split (Shipped: 2026-04-02)

**Phases completed:** 6 phases, 10 plans, 5 tasks

**Key accomplishments:**

- (none recorded)

---

## v0.7.0 Ontology Audit and Adjustments (Shipped: 2026-04-02)

**Phases completed:** 7 phases, 16 plans

**Key accomplishments:**

- Complete `napp→napplet` rename — 87+ identifiers across 19 files in all 7 packages; deprecated aliases ship for one release cycle (v0.9.0 removal)
- `BusKind.INTER_PANE → IPC_PEER` across 30+ call sites and SPEC.md; `IPC-*` namespace established for future `IPC-BROADCAST`/`IPC-CHANNEL` additions
- `ConsentRequest` consolidated to `@napplet/runtime` canonical with `type` discriminator; stale shell copy removed; shell re-exports from runtime
- `RuntimeAdapter`/`ShellAdapter` replace `RuntimeHooks`/`ShellHooks` — 13 public interfaces renamed to `*Adapter` convention; deprecated aliases for one release cycle
- `SessionEntry`/`SessionRegistry` replace `NappKeyEntry`/`NappKeyRegistry`; `createEphemeralKeypair()` (no params) replaces `loadOrCreateKeypair(_nappType)`
- Topic prefix direction semantics documented in `core/topics.ts` JSDoc; `nappStorage` marked `@deprecated`; SPEC.md fully corrected for all stale `napp:` strings

---

## v0.6.0 Demo Upgrade (Shipped: 2026-04-01)

**Phases completed:** 7 phases, 28 plans, 28 tasks

**Key accomplishments:**

- Layered topology model and generated demo architecture view that separates napplets, shell, ACL, runtime, and wired services
- Topology-aware message highlighting and responsive architecture layout that keep shell, ACL, runtime, and signer-service paths readable
- SignerConnectionState model with NIP-07 browser extension connect flow, signer node topology UX showing connected/disconnected state, and shell-host decoupled from mock signer as primary path
- NIP-46 WebSocket requester client, connect modal with NIP-07/NIP-46 side-by-side panes, QR code generation for nostrconnect://, and real connectNip46() implementation.
- Tap wiring for signer request recording, extended topology render tests, and end-to-end verification of all SIGN requirements.
- File:
- File:
- One-liner:
- Task 1: Add curve: 0 to Leader Line BASE_OPTIONS
- One-liner:
- Objective:
- Summary:
- Enabled 90-degree orthogonal topology edge routing by replacing invalid `curve: 0` with correct `path: 'grid'` in Leader Line BASE_OPTIONS
- One-liner:
- One-liner:
- One-liner:

---

## v0.5.0 Documentation & Developer Skills (Shipped: 2026-04-01)

**Phases completed:** 4 phases, 12 plans, 0 tasks

**Key accomplishments:**

- Created READMEs for 4 new packages (@napplet/acl, @napplet/core, @napplet/runtime, @napplet/services) — complete API documentation from source
- Updated root README and 3 existing package READMEs (shim, shell, vite-plugin) to reflect 7-package v0.4.0 SDK
- Rewrote SPEC.md Section 11 (service discovery), renamed all PseudoRelay → ShellBridge, documented requires/compat protocol (Sections 2.9, 2.10, 15.6)
- Created 3 agentskills.io-format portable skill files: build-napplet, integrate-shell, add-service — agents can build with napplet without reading the full spec

---

## v0.4.0 Feature Negotiation & Service Discovery (Shipped: 2026-03-31)

**Phases completed:** 6 phases, 19 plans, 43 tasks

**Key accomplishments:**

- Service dispatch backbone — `ServiceDescriptor` in @napplet/core; `ServiceHandler`, `ServiceRegistry`, and topic-prefix routing in @napplet/runtime
- Kind 29010 discovery protocol — runtime synthesizes one EVENT per registered service + EOSE; live subscriptions update dynamically when services register
- `@napplet/services` package — `createAudioService` and `createNotificationService` as first-class `ServiceHandler` implementations proving the pattern
- `window.napplet` global on shim — `discoverServices()`, `hasService()`, `hasServiceVersion()` with session-scoped cache; no import needed in napplet code
- Manifest compatibility system — vite-plugin injects `requires` tags; runtime checks at AUTH time; `CompatibilityReport` via `onCompatibilityIssue`; strict/permissive mode
- Core infra as services — signer, relay pool, and cache extracted as `ServiceHandler`s; `RuntimeHooks.relayPool`/`.cache` now optional; dual-path dispatch with hook fallback

---

## v0.3.0 Runtime and Core (Shipped: 2026-03-31)

**Phases completed:** 6 phases, 18 plans, 38 tasks

**Key accomplishments:**

- Zero-dep @napplet/core package with all shared protocol types, constants, and topic definitions
- Shell imports all protocol types from @napplet/core — 232 lines of duplicate definitions removed
- Shim imports all protocol types from @napplet/core — 55 lines of duplicate definitions removed
- createShellBridge() rewired to delegate to createRuntime(adaptHooks(hooks)) — shell-bridge.ts reduced from 746 to 180 lines
- Shim types already re-exported from @napplet/core — verified builds and public API unchanged
- Cross-package dependency graph verified clean — full monorepo builds and type-checks with core -> acl -> runtime -> shell DAG
- Removed 8 dead exports from @napplet/shell, deleted duplicate enforce.ts, re-pointed enforce re-exports to @napplet/runtime

---

## v0.2.0 Shell Architecture Cleanup (Shipped: 2026-03-31)

**Phases completed:** 5 phases, 11 plans, 25 tasks

**Key accomplishments:**

- Renamed all PseudoRelay/createPseudoRelay/PSEUDO_RELAY_URI references to ShellBridge/createShellBridge/SHELL_BRIDGE_URI across shell, shim, demo, tests, spec, and docs — hard cut, zero aliases
- @napplet/acl package created with zero dependencies, 10 capability bit constants, and immutable AclState/AclEntry/Identity types enforced by ES2022-only tsconfig
- Implemented pure check() with 3-path decision logic and 9 state mutation functions — all zero-side-effect, immutable-by-construction
- @napplet/acl builds and type-checks with zero errors — complete public API (27 exports) verified self-contained with zero external dependencies

---

## v0.1.0 Alpha (Shipped: 2026-03-30)

**Phases completed:** 6 phases, 30 plans, 12 tasks

**Key accomplishments:**

- Added event.source === window.parent guard clauses to all three shim message handlers to prevent message forgery from co-loaded scripts
- Replaced comma-joined storage key serialization with repeated NIP ['key', name] tags to prevent data corruption on keys containing commas
- Renamed all legacy protocol identifiers to napplet across all packages, spec, and plugin docs
- Added unified rejectAuth() helper to clear pending message queue and send NOTICE on all 5 AUTH rejection paths, fixing security race condition
- Playwright smoke test proves AUTH handshake completes between shell and napplet in real browser with sandboxed iframes and real Schnorr signatures

---
