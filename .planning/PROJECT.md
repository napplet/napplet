# Napplet Protocol SDK

## Current Milestone: v0.29.0 NUB-CONNECT + Shell as CSP Authority

**Goal:** Introduce a new NUB (`connect`) letting napplets declare required network origins for user-gated `fetch`/`WebSocket`/`SSE` access, and shift CSP emission entirely to the shell at runtime — moving the SDK from build-baked strict CSP to shell-authoritative runtime CSP for every napplet.

**Target features:**
- NUB-CONNECT spec drafted in `napplet/nubs` public repo (connect manifest tag, origin-format rules, consent flow, runtime API, capability advertisement, security considerations)
- NIP-5D amendment delegating napplet-class distinctions (Class 1 / Class 2) to the NUBs track
- NUBs-track advisory on how to define napplet classes on top of existing NUB specs
- `@napplet/nub/connect` subpath (types + shim installer exposing `window.napplet.connect.{granted, origins}` + SDK helpers)
- `@napplet/vite-plugin` production CSP removal (meta builder, nonce generator, four CSP assertions move to dev-only or drop); new `connect?: string[]` option that emits `connect` manifest tags and folds into `aggregateHash` via a synthetic `connect:origins` entry; new fail-loud inline-script diagnostic
- `@napplet/shim` + `@napplet/sdk` central integration of the connect NUB (parallel to resource NUB wiring in v0.28.0)
- `specs/SHELL-CONNECT-POLICY.md` shell-deployer checklist (parallel to `specs/SHELL-RESOURCE-POLICY.md`), including mixed-content reality check, cleartext warnings, and the Class-2 residual-meta-CSP scan requirement
- Documentation sweep: root README + affected package READMEs + `skills/build-napplet/SKILL.md` updated for the two classes, the connect API, and "default to NUB-RESOURCE; reach for NUB-CONNECT only when resource NUB can't express what you need"

**Key context:**
- Full design: `docs/superpowers/specs/2026-04-21-napplet-network-permission-design.md` (committed `9f77c29`)
- Breaking change: deprecates v0.28.0's vite-plugin `strictCsp` production path; `perm:strict-csp` capability superseded (kept true for back-compat, marked deprecated)
- Demo napplets remain downstream-shell-repo's concern (Option B carried forward from v0.28.0)
- Cross-repo coordination: NUB-CONNECT is a new spec in `napplet/nubs`; human opens the PR following established manual flow

## Shipped: v0.28.0 Browser-Enforced Resource Isolation

Converted napplet iframe security from ambient trust to browser-enforced isolation. Single new NUB (`resource`) with `resource.bytes(url) → Blob` primitive, scheme-pluggable URL space (4 canonical schemes: `https:`, `blossom:`, `nostr:`, `data:`). `data:` decoded inline (zero shell round-trip); other schemes route via `postMessage` envelopes through the host shell. Single-flight cache (N concurrent same-URL calls share 1 fetch), AbortSignal cancellation with `resource.cancel` envelope, `bytesAsObjectURL(url)` lifecycle helper. Optional sidecar pre-resolution on `relay.event` envelopes (`resources?: ResourceSidecarEntry[]`) with default-OFF privacy posture per NUB-RELAY amendment. Strict CSP enforcement at the iframe boundary via `@napplet/vite-plugin` `strictCsp` option: 10-directive baseline, first-`<head>`-child meta injection, header-only directive rejection, dev/prod connect-src split, nonce-based scripts. NIP-5D Security Considerations subsection added in-repo; 4 cross-repo draft PRs authored for `napplet/nubs` (NUB-RESOURCE new spec; NUB-RELAY/IDENTITY/MEDIA amendments). Acceptance gates: `pnpm -r build` + `pnpm -r type-check` green across all 14 packages; CSP positive-blocking Playwright simulation; single-flight stampede against built dist; sidecar default-OFF + SVG-bomb spec conformance; cross-repo zero-grep clean; tree-shake bundle (zero resource-shim symbols in relay-types-only consumer). Demo napplets explicitly delegated to downstream shell repo (Option B). 10 phases, 10 plans shipped 2026-04-21. See [archive](milestones/v0.28.0-ROADMAP.md).

## Shipped: v0.27.0 IFC Terminology Lock-In

Completed the `ipc` → `ifc` rename end-to-end. Hard break with no backward-compat alias: `window.napplet.ipc` renamed to `window.napplet.ifc` in `@napplet/core`, `@napplet/shim`, `@napplet/sdk`, and `@napplet/nub/ifc`; the `@napplet/sdk` `ipc` named export deleted and replaced with `ifc`; every JSDoc / section comment updated to `IFC-PEER` / "inter-frame" phrasing. Public docs aligned: root README + four package READMEs + `skills/build-napplet/SKILL.md` + active `.planning/` docs swept to IFC terminology with historical changelog bullets preserved as records. Acceptance gate passed: `pnpm -r build` + `pnpm -r type-check` green across all 14 workspace packages; first-party-surface zero-grep across `packages/`, `specs/`, `skills/`, root README, and `.planning/codebase/` returns zero matches (with one documented `INTEGRATIONS.md:168` `INTER_PANE` historical-constant exception). 3 phases, 5 plans shipped 2026-04-19. See [archive](milestones/v0.27.0-ROADMAP.md).

## Shipped: v0.26.0 Better Packages

Consolidated the 9 separate `@napplet/nub-<domain>` packages into a single tree-shakable `@napplet/nub` with 34 subpath entry points (9 barrel + 9 types + 8 shim + 8 sdk — theme is types-only). The 9 old packages became 1-line `export * from '@napplet/nub/<domain>'` re-export shims with `[DEPRECATED]` metadata + README banners (one-release deprecation cycle; removal deferred to a future milestone via `REMOVE-01..03`). `@napplet/shim` migrated to `/shim` granular subpaths; `@napplet/sdk` migrated to `/<domain>` barrels; 0 `@napplet/nub-` specifiers remain in first-party source. Root + 4 package READMEs rewritten; defunct `@napplet/nub-signer` references purged. Tree-shaking contract proven (39-byte bundle for types-only consumer, 0 `registerNub`, 0 cross-domain leakage). 5 phases, 12 plans shipped 2026-04-19. See [archive](milestones/v0.26.0-ROADMAP.md).

## What This Is

A portable SDK for the napplet protocol — sandboxed Nostr mini-apps that run in restrictive iframes and delegate functionality (signing, storage, relay access) to a host shell via JSON envelope postMessage wire format defined by NIP-5D.

## Core Value

Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.

## Shipped: v0.25.0 Config NUB

NUB-CONFIG spec (napplet/nubs#13) for per-napplet declarative configuration. `@napplet/nub-config` (9th NUB, 13th package) with 8 wire message types (registerSchema, get, subscribe, unsubscribe, openSettings, values, registerSchema.result, schemaError). JSON Schema draft-07 Core Subset (`pattern` excluded per CVE-2025-69873). Shell is sole writer; subscribe-live value delivery with ref-counted subscribers. Vite-plugin extension: `configSchema` option with 3-path discovery (inline / config.schema.json / napplet.config.ts), `['config', ...]` manifest tag, `config:schema` synthetic aggregateHash prefix, `<meta name="napplet-config-schema">` injection, build-time structural guards. `x-napplet-secret`/`-section`/`-order` + `deprecationMessage` + `markdownDescription` as potentialities. FromSchema type inference via json-schema-to-ts optional peer. All docs updated. 6 phases shipped 2026-04-17. See [archive](milestones/v0.25.0-ROADMAP.md).

## Shipped: v0.24.0 Identity NUB + Kill NIP-07

Removed `window.nostr` (NIP-07) from napplets — napplets can no longer sign or encrypt. Deleted `@napplet/nub-signer` entirely. Created `@napplet/nub-identity` (read-only user queries: getPublicKey, getRelays, getProfile, getFollows, getList, getZaps, getMutes, getBlocked, getBadges). Added `relay.publishEncrypted` for shell-mediated crypto (NIP-44 default). Shell auto-decrypts incoming encrypted events. NIP-5D updated with security rationale. NUB-IDENTITY spec: napplet/nubs#12. 6 phases shipped 2026-04-09. See [archive](milestones/v0.24.0-ROADMAP.md).

## Shipped: v0.23.0 Notify NUB

NUB-NOTIFY spec (napplet/nubs#11) for shell-rendered notifications. `@napplet/nub-notify` (8th NUB, 12th package) with 11 message types covering send/dismiss, permissions, actions, channels, badges, priority levels, and shell capability detection. Types + shim + SDK per modular pattern. Core/shim/SDK integrated. All docs updated. 4 phases shipped 2026-04-09. See [archive](milestones/v0.23.0-ROADMAP.md).

## Shipped: v0.22.0 Media NUB + Kill Services

Killed the `svc:` capability namespace — everything is a NUB. Dropped 4 deferred AUDIO_* TOPICS. Drafted NUB-MEDIA spec (napplet/nubs#10) for media session delegation: explicit sessions, multiple per napplet, dynamic capabilities, dual volume, shell control list, full metadata with blossom hash artwork. Created `@napplet/nub-media` (7th NUB, 11th package) with types + shim + SDK per modular pattern. Core/shim/SDK integrated. All docs updated. 5 phases shipped 2026-04-09. See [archive](milestones/v0.22.0-ROADMAP.md).

## Shipped: v0.21.0 NUB Modularization

Moved ALL domain-specific logic from `@napplet/shim` and `@napplet/sdk` into the 5 NUB packages. Each NUB now exports `shim.ts` (installer + message handlers) and `sdk.ts` (convenience wrappers) alongside its type definitions. Shim went from 19KB to 5.75KB — now a thin host that imports NUB installers. Old domain files (`relay-shim.ts`, `state-shim.ts`, `keys-shim.ts`) deleted. DX unchanged: `import '@napplet/shim'` installs all NUBs; named exports allow cherry-picking. 3 phases shipped 2026-04-09. See [archive](milestones/v0.21.0-ROADMAP.md).

## Shipped: v0.20.0 Keys NUB

New `@napplet/nub-keys` package (6th NUB, 10th package) implementing the NUB-KEYS spec (napplet/nubs#9). Bidirectional keyboard protocol: napplet registers named actions, shell binds keys and pushes binding updates, shim suppresses bound keys locally and triggers actions with zero latency. Replaced one-way `keyboard-shim.ts` with full `keys-shim.ts` smart forwarding. SDK convenience wrappers. All READMEs and NIP-5D updated. 5 phases, 2 plans shipped 2026-04-09. See [archive](milestones/v0.20.0-ROADMAP.md).

## Shipped: v0.19.0 Spec Gap Drops

Executed all 7 "drop" verdicts from the v0.18.0 spec conformance audit. Deleted `Capability` type, `ALL_CAPABILITIES`, 13 TOPICS entries (superseded/config/relay), `SHELL_BRIDGE_URI`, `REPLAY_WINDOW_SECONDS`, `PROTOCOL_VERSION`, and `constants.ts` entirely. `@napplet/core` now exports only spec-backed artifacts. 1 phase, 1 plan shipped 2026-04-09. See [archive](milestones/v0.19.0-ROADMAP.md).

## Shipped: v0.18.0 Spec Conformance Audit

Audited entire codebase against NIP-5D and NUB specs. Removed dead code (handshake types, unused functions, dead re-exports). Created exhaustive spec gap inventory (SPEC-GAPS.md) documenting every unspecced artifact. Fixed stale documentation across 5 files. Captured drop/defer/amend decisions for all gaps: 7 items to drop in v0.19.0, 5 deferred, 1 for spec amendment (keyboard forwarding). Corrected inventory: IFC channels and nostrdb are spec-backed via draft NUB PRs. 4 phases, 4 plans shipped 2026-04-09. See [archive](milestones/v0.18.0-ROADMAP.md).

## Shipped: v0.17.0 Capability Cleanup

Namespaced `shell.supports()` with `nub:`/`perm:`/`svc:` prefixes replacing flat `NubDomain | string`. Deleted `legacy.ts`, `discovery-shim.ts`, `ServiceDescriptor`/`ServiceInfo` types, `window.napplet.services` API, and `napplet-napp-type` backward compat. All READMEs updated. 3 phases, 3 plans shipped 2026-04-08. See [archive](milestones/v0.17.0-ROADMAP.md).

## Shipped: v0.16.0 Wire Format & NUB Architecture

Replaced NIP-01 array wire format with generic JSON envelope `{ type: "domain.action", ...payload }`. NIP-5D v4 is now transport+identity+manifest+NUB-negotiation only — zero protocol messages. 4 NUB packages (@napplet/nub-relay, nub-signer, nub-storage, nub-ifc) with 52 typed message definitions. Core dispatch infrastructure with registerNub/dispatch. Shim fully migrated to JSON envelope. SDK re-exports 62 NUB types. Protocol version 4.0.0. 6 phases, 10 plans shipped 2026-04-07. See [archive](milestones/v0.16.0-ROADMAP.md).

## Shipped: v0.15.0 Protocol Simplification

Removed cryptographic identity from the napplet wire protocol. Napplets now send plain unsigned NIP-01 messages; shell identifies senders via unforgeable MessageEvent.source at iframe creation. AUTH handshake (REGISTER/IDENTITY/AUTH) eliminated. @napplet/shim dropped nostr-tools dependency. Protocol version bumped to 3.0.0. NIP-5D and all READMEs updated. 4 phases, 4 plans shipped 2026-04-07. See [archive](milestones/v0.15.0-ROADMAP.md).

## Shipped: v0.14.0 Repo Cleanup & Audit

Dead code, stale docs, and leftover artifacts from v0.13.0 extraction cleaned up. 2 phases, 3 plans shipped 2026-04-06. See [archive](milestones/v0.14.0-ROADMAP.md).

## Shipped: v0.13.0 Runtime Decoupling & Publish

Runtime, shell, ACL, services, and demo extracted to a separate repo. @napplet slimmed to 4-package SDK (core, shim, sdk, vite-plugin). GitHub Actions CI/CD with changesets. 6 phases, 11 plans shipped 2026-04-06. See [archive](milestones/v0.13.0-ROADMAP.md).

## Shipped: v0.12.0 Spec Packaging

SPEC.md renamed to RUNTIME-SPEC.md as internal reference with header linking to NIP-5D. NIP-5D v2 finalized at 199 lines with References section (5 cited NIPs) and Implementations section. 8 package READMEs and 4 source files updated to reference RUNTIME-SPEC.md. 1 phase, 1 plan shipped 2026-04-06. See [archive](milestones/v0.12.0-ROADMAP.md).

## Shipped: v0.11.0 Clean up Side Panel

Inspector side panel reorganized into 3 tabs (Node/Constants/Kinds) with contextual filtering. Data layer extended with role annotations and query methods. Constants tab shows only editable values filtered by selected topology node. Kinds tab shows read-only protocol references. Tab persistence across node selection. Show-all toggle escape hatch. 3 phases, 4 plans shipped 2026-04-05. See [archive](milestones/v0.11.0-ROADMAP.md).

## Shipped: v0.10.0 Demo Consistency and Usability Pass

Constants panel exposing all 23 protocol magic numbers with live editing. ACL detail panel with per-napplet capability status, rejection history, and full-screen policy matrix. Directional edge/node coloring with 5 persistence modes (flash, rolling, decay, last-message, trace). Service enable/disable toggles and individual capability toggles with cross-view sync. Hop-by-hop trace animation mode. 5 phases, 20 plans shipped 2026-04-04. See [archive](milestones/v0.10.0-ROADMAP.md).

## Shipped: v0.9.0 Identity & Trust

Shell-delegated keypair handshake (REGISTER → IDENTITY → AUTH) with deterministic key derivation via HMAC-SHA256. Storage rekeyed to `dTag:aggregateHash` (pubkey removed) — persists across reloads. Shell-side aggregate hash verification with caching. Per-iframe persistent GUID. Delegated keys confined to protocol auth only. RuntimeHooks/ShellHooks deprecated aliases removed. SPEC.md §2, §5, §14 updated. 3 phases, 7 plans shipped 2026-04-02. See [archive](milestones/v0.9.0-ROADMAP.md).

## Shipped: v0.8.0 Shim/SDK Split

`@napplet/shim` is now a pure side-effect window installer (zero named exports). `window.napplet` is fully namespaced (`relay`, `ipc`, `services`, `storage`). New `@napplet/sdk` package provides typed named exports for bundler consumers. All deprecated v0.7.0 symbols removed. 4 phases, 10 plans shipped 2026-04-02. See [archive](milestones/v0.8.0-ROADMAP.md).

## Shipped: v0.6.0 Demo Upgrade

The demo is now an architecture-accurate teaching and testing surface. 7 phases, 28 plans shipped 2026-04-01. See [archive](milestones/v0.6.0-ROADMAP.md).

## Requirements

### Validated

- ✓ Pseudo-relay message router (NIP-01 REQ/EVENT/CLOSE/COUNT dispatch) — existing
- ✓ NIP-42 AUTH handshake with ephemeral session keypairs — existing
- ✓ ACL capability system (relay:read, relay:write, sign:*, storage:*) — existing
- ✓ NIP-07/NIP-44 signer proxy (napplet requests signatures from shell) — existing
- ✓ Storage proxy with scoped keys (pubkey:dTag:aggregateHash isolation) — existing
- ✓ Inter-pane pubsub via kind 29003 topic events — existing
- ✓ Napplet-side SDK (subscribe, publish, query, emit, on, nappStorage) — existing
- ✓ Shell-side runtime (createShellBridge factory, ShellHooks DI) — existing
- ✓ Vite plugin for NIP-5A dev-mode manifest injection — existing
- ✓ Replay attack detection on incoming events — existing
- ✓ ConsentRequest flow for destructive signing kinds — existing
- ✓ Decoupled packages working end-to-end with wiring fixes — v0.1.0
- ✓ 66 behavioral tests covering full protocol surface (AUTH, routing, replay, lifecycle, ACL, storage, signer, IPC) — v0.1.0
- ✓ Interactive Chat + Bot demo with visual protocol debugger — v0.1.0
- ✓ Refined NIP-5A specification with implementation learnings — v0.1.0
- ✓ Packages validated (publint + arethetypeswrong) at v0.1.0-alpha.1 — v0.1.0
- ✓ ShellBridge rename (pseudo-relay → ShellBridge), storage → state rename — v0.2.0
- ✓ @napplet/acl pure module — bitfield caps, immutable state, zero deps, WASM-ready — v0.2.0
- ✓ Single enforce() gate in ShellBridge — all messages through one ACL checkpoint — v0.2.0
- ✓ 56 ACL behavioral tests (122 total) — full capability × action matrix — v0.2.0
- ✓ Shell code cleanup — verb-noun naming, JSDoc, clean internals — v0.2.0
- ✓ @napplet/core — zero-dep shared protocol types, constants, topics — v0.3.0
- ✓ @napplet/runtime — browser-agnostic protocol engine with RuntimeHooks — v0.3.0
- ✓ Shell slimmed to thin browser adapter (746→180 lines), shim rewired to core — v0.3.0
- ✓ Service extension design — ServiceRegistry types, kind 29010, SPEC.md Section 11 — v0.3.0
- ✓ 180 tests green across four-package structure (core, runtime, integration, e2e) — v0.3.0
- ✓ Shell export cleanup — dead code removed, enforce deduplicated, singletons cleaned — v0.3.0
- ✓ ServiceDescriptor in @napplet/core, ServiceHandler/ServiceRegistry in @napplet/runtime, topic-prefix dispatch — v0.4.0 Phase 18
- ✓ Service discovery protocol — kind 29010 REQ/EVENT/EOSE flow, synthetic events from registry, live subscriptions — v0.4.0 Phase 19
- ✓ Shim-side discovery API — window.napplet global with discoverServices/hasService/hasServiceVersion, session cache, ServiceInfo type — v0.4.0 Phase 21
- ✓ @napplet/services package — createAudioService and createNotificationService as ServiceHandlers, audio:* prefix only, browser-agnostic — v0.4.0 Phase 20
- ✓ Manifest requires tags — vite plugin injects ["requires","service-name"] into NIP-5A manifest, <meta napplet-requires> into index.html — v0.4.0 Phase 22 (COMPAT-01)
- ✓ Compatibility check at AUTH — runtime reads manifest requires, checks ServiceRegistry, builds CompatibilityReport, fires onCompatibilityIssue; strict mode blocks load — v0.4.0 Phase 22 (NEG-01..04, COMPAT-02, COMPAT-03)
- ✓ Undeclared service consent — checkUndeclaredService fires at INTER_PANE dispatch time; ConsentRequest type discriminator 'undeclared-service'; per-session consent cache — v0.4.0 Phase 22 (NEG-05)
- ✓ strictMode configurable via RuntimeHooks — permissive default, strict blocks napplet loading on missing services — v0.4.0 Phase 22 (NEG-06)
- ✓ Core infra as registered services — signer, relay pool, cache extractable as ServiceHandlers; RuntimeHooks.relayPool/.cache now optional; dual-path dispatch with hook fallback — v0.4.0 Phase 22.1 (SVC-04)
- ✓ Package READMEs for all 7 packages — shim, shell, vite-plugin, core, runtime, acl, services — v0.5.0 Phases 23-24
- ✓ SPEC.md updated for v0.4.0 — Section 11 service discovery, ShellBridge rename, requires/compat protocol — v0.5.0 Phase 25
- ✓ Skills directory — 3 agentskills.io-format skill files: build-napplet, integrate-shell, add-service — v0.5.0 Phase 26 (SKILL-01, SKILL-02, SKILL-03)
- ✓ Demo audit and correctness pass — host path inventory, signer service wiring, path-aware debugger labels, and regression coverage for relay/state/signer denials — v0.6.0 Phase 27 (DEMO-01, DEMO-02, DEMO-03)
- ✓ Demo flow view separates napplets, shell, ACL, runtime, and service nodes in distinct topology nodes with hierarchy edges and animation — v0.6.0 Phase 28 (ARCH-01, ARCH-02)
- ✓ Node detail adapter and compact summary surfaces — role-specific summaryFields on every topology node, live from host/runtime state — v0.6.0 Phase 29 (NODE-01)
- ✓ Right-side inspector pane with selected-node state, recent-activity projection, and debugger coexistence — v0.6.0 Phase 29 (NODE-02)
- ✓ Notification service as first-class topology node with toast UX, protocol activity visibility, and service state panel — v0.6.0 Phase 30 (NOTF-01, NOTF-02, NOTF-03)
- ✓ Signer connection UX with NIP-07/NIP-46 flows, QR code, configurable relay, and signer topology node — v0.6.0 Phase 31 (SIGN-01..05)
- ✓ Demo UI/UX bug fixes — amber state, Leader Line SVG edges, ACL isAmber logic, signer error detection — v0.6.0 Phase 32
- ✓ Polish pass — iframe fill, perpendicular topology edges, separated in/out ports, orphan edge removal, button isolation — v0.6.0 Phase 33
- ✓ BusKind.INTER_PANE renamed to BusKind.IPC_PEER across all 7 packages and SPEC.md — v0.7.0 Phase 35 (WIRE-01)
- ✓ ConsentRequest consolidated to @napplet/runtime canonical (type? + serviceName? fields); shell/types.ts stale copy removed; shell re-exports from runtime — v0.7.0 Phase 36 (TYPE-01)
- ✓ shell/state-proxy.ts dead code deleted (superseded by runtime/state-handler.ts in Phase 13) — v0.7.0 Phase 36 (TYPE-02)
- ✓ RuntimeAdapter/ShellAdapter canonical; RuntimeHooks/ShellHooks @deprecated aliases for one release cycle — v0.7.0 Phase 37 (API-01, API-02)
- ✓ SessionEntry/SessionRegistry replace NappKeyEntry/NappKeyRegistry — v0.7.0 Phase 38 (SESS-01, SESS-02)
- ✓ napplet: topic prefix direction semantics documented; nappStorage @deprecated — v0.7.0 Phase 39 (DOC-01)
- ✓ createEphemeralKeypair() (no params) replaces loadOrCreateKeypair(_nappType) in @napplet/shim — v0.7.0 Phase 40 (SESS-03)
- ✓ Nip5aManifestOptions.nappletType replaces nappType as public API field in @napplet/vite-plugin — v0.7.0 Phase 40 (TERM-01)
- ✓ SPEC.md stale napp: topic strings replaced with napplet: (state-response, audio-muted, napplet-state:) — v0.7.0 Phase 40 (TERM-04, WIRE-02)
- ✓ `@napplet/shim` is a pure window installer with zero named exports — v0.8.0 Phase 41 (PKG-01, DEP-01, DEP-02)
- ✓ `window.napplet` is fully namespaced (`relay`, `ipc`, `services`, `storage`) — v0.8.0 Phase 41 (WIN-01, WIN-02, WIN-03, WIN-04)

- ✓ `@napplet/sdk` exists as a standalone bundler-friendly package (thin wrappers + helpers) — v0.8.0 Phase 42 (PKG-02, PKG-03, SDK-01, SDK-02, SDK-03)
- ✓ Demo napplets and test fixtures migrated to window.napplet namespaced API — v0.8.0 Phase 43 (ECO-01, ECO-02)
- ✓ SPEC.md, shim README, and SDK README updated for shim/SDK split — v0.8.0 Phase 44 (ECO-03, ECO-04, ECO-05)
- ✓ Shell-delegated keypair handshake (REGISTER/IDENTITY/AUTH) with deterministic key derivation — v0.9.0 Phase 46 (AUTH-01..04)
- ✓ Shell-side aggregate hash verification with caching — v0.9.0 Phase 46 (VERIFY-01..03)
- ✓ Storage rekeyed to `dTag:aggregateHash` (pubkey removed), persists across reloads — v0.9.0 Phase 46 (STORE-01..03)
- ✓ Per-iframe persistent GUID for instance identity — v0.9.0 Phase 46 (INST-01)
- ✓ Delegated keys confined to protocol auth, blocked from relay publishing — v0.9.0 Phase 46 (SEC-01, SEC-02)
- ✓ RuntimeHooks/ShellHooks deprecated aliases removed — v0.9.0 Phase 47 (DEP-03, DEP-04)
- ✓ SPEC.md Sections 2, 5, 14 updated for v0.9.0 handshake, storage, and security models — v0.9.0 Phase 48 (DOC-01..03)
- ✓ Protocol magic numbers exposed in constants panel with live editing — v0.10.0 Phase 49 (TRANS-01, TRANS-02)
- ✓ ACL detail panel with per-napplet capabilities, rejection history, and full-screen policy matrix — v0.10.0 Phase 50 (TRANS-03, TRANS-04)
- ✓ Directional edge/node coloring with 5 persistence modes (flash, rolling, decay, last, trace) — v0.10.0 Phase 51 (COLOR-01, COLOR-02)
- ✓ Per-message hop-by-hop trace animation mode — v0.10.0 Phase 53 (COLOR-03)
- ✓ Service enable/disable toggles with cross-view sync (topology, modal, inline panel) — v0.10.0 Phase 52 (TOGL-01, TOGL-03)
- ✓ Individual ACL capability toggles per napplet with live-reload — v0.10.0 Phase 52 (TOGL-02)
- ✓ ConstantDef extended with relevantRoles topology annotations and query methods — v0.11.0 Phase 54 (DATA-01, DATA-02)
- ✓ Kinds tab with read-only protocol kind reference cards — v0.11.0 Phase 55 (TAB-01)
- ✓ Constants tab constrained to editable-only values — v0.11.0 Phase 55 (TAB-02)
- ✓ Tab persistence across node selection — v0.11.0 Phase 55 (TAB-03)
- ✓ Contextual filtering by selected node role with show-all fallback — v0.11.0 Phase 56 (FILT-01, FILT-02)
- ✓ Show-all toggle to bypass contextual filtering — v0.11.0 Phase 56 (FILT-03)
- ✓ SPEC.md renamed to RUNTIME-SPEC.md as internal reference — v0.12.0 Phase 61 (PKG-01)
- ✓ NIP-5D v2 in nostr-protocol/nips markdown format (<200 lines, setext headings) — v0.12.0 Phase 61 (PKG-02)
- ✓ NIP-5D lists @napplet/shim as reference implementation — v0.12.0 Phase 61 (PKG-03)

- ✓ Shell runtime packages extracted to separate repo — v0.13.0 Phases 62-64
- ✓ @napplet slimmed to 4 packages, build clean — v0.13.0 Phase 65 (CLEAN-01..04)
- ✓ GitHub Actions CI/CD workflows for @napplet — v0.13.0 Phase 66 (PUB-01..03)
- ✓ READMEs updated for 4-package SDK — v0.13.0 Phase 67 (DOC-01, DOC-02)

- ✓ Handshake types (RegisterPayload, IdentityPayload, AUTH_KIND, VERB_REGISTER, VERB_IDENTITY) removed from @napplet/core — v0.15.0 Phase 70 (WIRE-01..04, RT-01..04)
- ✓ @napplet/shim stripped of all signing, keypair, AUTH code; nostr-tools dependency dropped — v0.15.0 Phase 71 (SHIM-01..04)
- ✓ NIP-5D v3 rewritten for simplified wire protocol (no AUTH, shell-assigned identity via MessageEvent.source) — v0.15.0 Phase 72 (DOC-02)
- ✓ All package READMEs updated for no-crypto API surface — v0.15.0 Phase 73 (DOC-03)

- ✓ NIP-5D v4: JSON envelope `{ type, ...payload }`, transport+identity+manifest+NUB-negotiation only — v0.16.0 Phase 74 (SPEC-01..04)
- ✓ Core envelope types (NappletMessage, NubDomain, ShellSupports) + NUB dispatch infrastructure — v0.16.0 Phases 75-76 (CORE-01, CORE-02)
- ✓ 4 NUB packages with 52 typed message definitions (relay 13, signer 14, storage 10, ifc 15) — v0.16.0 Phase 77 (NUB-01..04)
- ✓ Shim fully migrated to JSON envelope wire format, window.napplet API unchanged — v0.16.0 Phase 78 (SHIM-01..03)
- ✓ SDK re-exports 62 NUB types + domain constants; all READMEs updated — v0.16.0 Phases 78-79 (DOC-01)

- ✓ Namespaced `shell.supports()` with `nub:`/`perm:`/`svc:` prefixes — v0.17.0 Phase 80 (CAP-01..03)
- ✓ Dead service discovery code removed (discovery-shim, ServiceDescriptor, legacy.ts, services API) — v0.17.0 Phase 81 (DEAD-01..07, COMPAT-01..02)
- ✓ READMEs updated for cleaned-up API surface — v0.17.0 Phase 82 (DOC-01..04)

- ✓ Dead code removed (RegisterPayload, IdentityPayload, getNappletType, shim/types.ts, leaked exports) — v0.18.0 Phase 83 (DEAD-01..05)
- ✓ Spec gap inventory created (SPEC-GAPS.md) with 10 entries across 8 GAP IDs — v0.18.0 Phase 84 (GAP-01..09)
- ✓ Stale documentation fixed (services.has→shell.supports, theme NUB in tables, D-02/D-03 removed) — v0.18.0 Phase 85 (DOC-01..05)
- ✓ Drop/defer/amend decisions captured for all spec gaps — v0.18.0 Phase 86 (DECIDE-01)

- ✓ All 7 drop-verdict artifacts deleted from @napplet/core — v0.19.0 Phase 87 (DROP-01..09)

- ✓ @napplet/nub-keys package with 6 typed message definitions — v0.20.0 Phase 88 (NUB-01, NUB-02)
- ✓ 'keys' in NubDomain + NappletGlobal.keys namespace — v0.20.0 Phase 89 (CORE-01, CORE-02)
- ✓ Smart forwarding shim with suppress list, safety guards, action registration — v0.20.0 Phase 90 (SHIM-01..04)
- ✓ SDK keys namespace + convenience registerAction() + type re-exports — v0.20.0 Phase 91 (SDK-01..03)
- ✓ nub-keys README, NIP-5D keys row, core/shim/SDK README updates — v0.20.0 Phase 92 (DOC-01..03)

- ✓ All 5 NUB packages export shim installers + SDK helpers — v0.21.0 Phase 93 (NUB-01..07)
- ✓ Shim/SDK refactored to thin hosts importing from NUB packages — v0.21.0 Phase 94 (SHIM-01..04, SDK-01..03)
- ✓ Build clean, API surface identical — v0.21.0 Phase 95 (VER-01..02)

- ✓ svc: namespace removed from NamespacedCapability + all docs — v0.22.0 Phase 96 (SVC-01..03)
- ✓ NUB-MEDIA spec drafted → napplet/nubs#10 — v0.22.0 Phase 97 (SPEC-01)
- ✓ @napplet/nub-media package (types + shim + SDK) — v0.22.0 Phase 98 (NUB-01..02)
- ✓ 'media' in NubDomain + NappletGlobal + shim integration — v0.22.0 Phase 99 (CORE-01..02, SHIM-01)
- ✓ All docs updated for media NUB and svc: removal — v0.22.0 Phase 100 (DOC-01..03)

- ✓ NUB-NOTIFY spec drafted → napplet/nubs#11 — v0.23.0 Phase 101 (SPEC-01)
- ✓ @napplet/nub-notify package (types + shim + SDK, 11 message types) — v0.23.0 Phase 102 (NUB-01..02)
- ✓ 'notify' in NubDomain + NappletGlobal + shim/SDK integration — v0.23.0 Phase 103 (CORE-01..02, SHIM-01)
- ✓ All docs updated for notify NUB — v0.23.0 Phase 104 (DOC-01..03)

- ✓ window.nostr removed, nub-signer deleted — v0.24.0 Phase 105 (KILL-01..04)
- ✓ NUB-IDENTITY spec → napplet/nubs#12 — v0.24.0 Phase 106 (SPEC-01)
- ✓ @napplet/nub-identity package (9 query types + shim + SDK) — v0.24.0 Phase 107 (NUB-01..02)
- ✓ relay.publishEncrypted added, NUB-RELAY updated — v0.24.0 Phase 108 (RELAY-01..03)
- ✓ 'identity' in NubDomain + core/shim/SDK integration — v0.24.0 Phase 109 (CORE-01..02, SHIM-01)
- ✓ NIP-5D updated (no NIP-07, security rationale), all READMEs — v0.24.0 Phase 110 (DOC-01..03)

- ✓ NUB-CONFIG spec drafted and published as napplet/nubs#13 — v0.25.0 Phase 111 (SPEC-01..08)
- ✓ @napplet/nub-config package scaffolded (types + barrel, JSON Schema dep edges) — v0.25.0 Phase 112 (NUB-01, NUB-02, NUB-05, NUB-06)
- ✓ @napplet/nub-config shim + SDK (installConfigShim, ref-counted subscribers, 5 SDK wrappers, meta-tag schema read) — v0.25.0 Phase 113 (NUB-03, NUB-04)
- ✓ @napplet/vite-plugin configSchema option with 3-path discovery, manifest tag, aggregateHash participation, meta injection, build-time structural guards — v0.25.0 Phase 114 (VITE-01..07)
- ✓ 'config' in NubDomain + NappletGlobal.config + shim mount/routing + SDK re-exports + shell.supports('config') — v0.25.0 Phase 115 (WIRE-01..06, CORE-01..02, SHIM-01, SDK-01, CAP-01)
- ✓ @napplet/nub-config README + NIP-5D Known NUBs row + 4 package READMEs (core/shim/sdk/vite-plugin) — v0.25.0 Phase 116 (DOC-01..06)

- ✓ New `@napplet/nub` package with 34 subpath entry points (9 barrel + 9 types + 8 shim + 8 sdk), zero-dep (core-only), `sideEffects: false`, no root `.` export — v0.26.0 Phase 117 (PKG-01..03, EXP-01..04, BUILD-01..02)
- ✓ 9 deprecated `@napplet/nub-<domain>` packages converted to 1-line re-export shims with `[DEPRECATED]` description + README banners + 0.3.0 changeset — v0.26.0 Phase 118 (MIG-01..03)
- ✓ `@napplet/shim` + `@napplet/sdk` migrated off deprecated package names: shim uses `/shim` granular subpaths, sdk uses `/<domain>` barrels — v0.26.0 Phase 119 (CONS-01..03)
- ✓ New `@napplet/nub` README + root + core + shim + sdk READMEs updated; defunct `@napplet/nub-signer` references purged; spec/skills sweep clean — v0.26.0 Phase 120 (DOC-01..04)
- ✓ Monorepo build + type-check green across 14 packages; tree-shaking bundle = 39 bytes with 0 cross-domain leakage; 9 pinned-consumer type-check smokes green — v0.26.0 Phase 121 (VER-01..03)

- ✓ `window.napplet.ipc` renamed to `window.napplet.ifc` across `@napplet/core` types + `@napplet/shim` installer, no backward-compat alias — v0.27.0 Phase 122 (API-01)
- ✓ `@napplet/sdk` named export renamed `ipc` → `ifc` with JSDoc + section header updates — v0.27.0 Phase 122 (API-02)
- ✓ `@napplet/core` JSDoc + `packages/nub/src/ifc/sdk.ts` identifiers and JSDoc aligned to IFC-PEER / "inter-frame"; `requireIpc` → `requireIfc` — v0.27.0 Phase 122 (SRC-01)
- ✓ Root README + `@napplet/{core,shim,sdk}` READMEs swept to IFC terminology in current-API sections with historical changelog bullets preserved — v0.27.0 Phase 123 (DOC-01)
- ✓ `skills/build-napplet/SKILL.md` frontmatter, body prose, and code samples aligned with IFC / "inter-frame" terminology — v0.27.0 Phase 123 (DOC-02)
- ✓ Active `.planning/codebase/*.md` + research docs swept to IFC / accurate transport terminology; `TESTING.md` lines 83/152 rewritten to `postMessage`; 7 dated files preserved byte-identical — v0.27.0 Phase 123 (PLAN-01)
- ✓ `pnpm -r build` + `pnpm -r type-check` exit 0 across all 14 workspace packages with renamed API surface — v0.27.0 Phase 124 (VER-01)
- ✓ Repo-wide first-party-surface zero-grep clean (`packages/`, `specs/`, `skills/`, root README, `.planning/codebase/`) with `INTEGRATIONS.md:168` historical-constant exception and Option (a) path-exclusion for self-describing planning docs — v0.27.0 Phase 124 (VER-02)

### Active

- v0.29.0 NUB-CONNECT + Shell as CSP Authority — NUB-CONNECT spec, NIP-5D class-delegation amendment, `@napplet/nub/connect`, vite-plugin CSP removal + `connect` option + aggregateHash fold, central shim/SDK integration, `SHELL-CONNECT-POLICY.md`, doc sweep

### Future Requirements (deferred from v0.26.0)

- REMOVE-01: Delete the 9 deprecated `@napplet/nub-<domain>` packages from the repo
- REMOVE-02: Remove the deprecated packages from the publish workflow and pnpm-workspace.yaml
- REMOVE-03: Remove deprecation banners / `@deprecated` metadata references

### Out of Scope

- Mobile native wrapper — web-first protocol, native later
- Framework-specific bindings (Svelte/React components) — SDK is framework-agnostic by design
- Multi-shell federation — single shell per page for v1
- IndexedDB storage backend — localStorage sufficient for v1
- Key rotation for delegated keypairs — complexity not justified yet
- Rate limiting on signer requests — document expected behavior, don't enforce yet
- Restrictive ACL default mode — permissive default for developer adoption (v0.2.0 adds proper enforcement, restrictive mode later)
- Manifest signature verification in shell — deferred to post-v1 security hardening
- Arbitrary custom napplet loading in the demo shell — defer until the built-in demo is architecture-accurate and trustworthy again
- DAW implementation or audio-specific protocols — NIP-5C only designs the channel primitive that could support it

## Context

- **Current state**: v0.28.0 shipped (Browser-Enforced Resource Isolation). 14 packages: 4 core SDK (core, shim, sdk, vite-plugin) + consolidated `@napplet/nub` with 38 subpath entry points (now includes `/resource/{index,types,shim,sdk}`) + 9 deprecated `@napplet/nub-<domain>` re-export shims (slated for removal in a future milestone). Runtime API surface adds `window.napplet.resource` namespace, `nub:resource` + `resource:scheme:<name>` + `perm:strict-csp` capability identifiers, optional `relay.event.resources?` sidecar field. 28 milestones shipped.
- **Package architecture**: @napplet: core(0 deps) | nub(core) | shim(core+nub) | sdk(core+nub) | vite-plugin. Deprecated `@napplet/nub-<domain>` (×9) re-export `@napplet/nub/<domain>` and are kept for one release cycle. Shell runtime packages in a separate repo.
- **Spec status**: NIP-5D v2 at 199 lines covers AUTH handshake, relay proxy, capability discovery, and NUB extension reference. Ready for PR submission to nostr-protocol/nips.
- **NUB specs**: 6 interface specs drafted in `specs/nubs/` (RELAY, STORAGE, SIGNER, NOSTRDB, IPC, PIPES). Governance framework defined but not formalized (NUB-01/02/03 deferred).
- **Demo architecture**: Full topology view with distinct shell, ACL, runtime, and service nodes. Inspector has 3 tabs (Node, Constants, Kinds) with contextual filtering.
- **Tech stack**: TypeScript 5.9, Vite 6.3, tsup 8.5, turborepo 2.5, pnpm 10.8, Vitest 4 + Playwright for testing, UnoCSS for demo styling.
- **Test coverage**: 122 Playwright e2e tests + 71 vitest unit/integration tests (~193 total). Coverage spans AUTH, routing, replay, lifecycle, ACL enforcement, storage, signer, inter-pane, core imports, runtime dispatch, service dispatch, service discovery, and compatibility.
- **Documentation**: All 8 packages have README.md. RUNTIME-SPEC.md (41KB+) covers full protocol. NIP-5D.md is the terse external spec. 3 portable skill files in skills/ directory.
- **Known remaining issues**: Permissive ACL default. postMessage origin '*' trust boundary. Fake event IDs on shell-injected events. npm publish blocked on human auth. NIP number conflict with Scrolls PR#2281 (RES-01). No automated e2e tests for REGISTER/IDENTITY step (covered by UAT only).

## Constraints

- **ESM-only**: No CJS output — all packages are ESM
- **Zero framework deps**: No Svelte, React, Vue — framework-agnostic SDK
- **nostr-tools peer dep**: shim and shell depend on nostr-tools >=2.23.3 <3.0.0
- **iframe sandbox**: No allow-same-origin — everything proxied via postMessage
- **Monorepo tooling**: pnpm workspaces + turborepo + tsup + changesets

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Extract from reference implementation rather than rewrite | Proven protocol implementation, minimize risk | ✓ Good — packages working with targeted fixes |
| Behavioral tests over unit tests first | Visually confirm protocol works end-to-end before testing internals | ✓ Good — 66 Playwright tests prove the protocol |
| Refine existing NIP-5A spec, not write new | Spec already captures protocol; implementation surfaced 11 needed changes | ✓ Good — SPEC.md refined with all implementation learnings |
| Permissive ACL default kept for v0.1 | Ease of development; document risk, add restrictive mode later | ✓ Good — tests verify permissive behavior, restrictive mode deferred |
| Relay URI `shell://` | Clear direction signal (napplet → shell) | ✓ Good |
| Storage keys() uses repeated NIP tags | Follows Nostr convention, eliminates comma-join delimiter bug | ✓ Good |
| Missing AUTH tags fail (strict) | Napplets must build correctly; prevents misconfigured apps | ✓ Good — AUTH-08/09 tests verify |
| Pre-AUTH queue capped at 50 | Prevents memory abuse, configurable globally and per-napp | ✓ Good |
| Vite plugin is dev-only | Community deploy tools handle production manifests | ✓ Good — clear separation of concerns |
| Chat + Bot demo napplets | Interactive, demonstrates all capabilities, teachable bot | ✓ Good |
| UnoCSS for demo styling | Tailwind-compatible, Vite ecosystem, easy to modify | ✓ Good |
| UTF-8 byte count for storage quota | Consistent cross-platform, replaces inconsistent Blob approach | ✓ Good |
| @napplet/acl as separate package | Package boundary enforces zero deps, WASM-ready | ✓ Good — Phase 8 delivered zero-dep pure module |
| Target architecture: acl → core → runtime → shell | Multi-shell support. Third-party shells depend on @napplet/runtime, not @napplet/shell. Runtime extraction when second shell exists. | ✓ Good — Phase 13 delivered browser-agnostic runtime with RuntimeHooks interface |
| ServiceDescriptor in @napplet/core, ServiceHandler/Registry in @napplet/runtime | Shared types need no dependency on runtime; handler interface lives where it's consumed | ✓ Good — clean layering across all 7 packages |
| handleMessage(windowId, message, send) interface for ServiceHandler | Services receive raw NIP-01 arrays + send callback; decoupled from runtime internals | ✓ Good — consistent across all concrete services |
| Dual-path dispatch for core infra (service → hook fallback) | Backwards-compatible migration; shell hosts using RuntimeHooks directly still work | ✓ Good — zero breaking changes, SVC-04 satisfied |
| audio:* topic prefix only (shell:audio-* dropped) | Alpha — no external consumers; clean break prevents legacy accumulation | ✓ Good — no compatibility burden |
| Undeclared service consent reuses ConsentRequest pattern | Same hook, same UX flow as destructive signing kinds — shell hosts get one integration point | ✓ Good — minimal API surface growth |
| Demo must mirror actual runtime architecture | The demo is now a teaching tool and debugger; flattening shell/ACL/runtime hides the protocol model and misleads users | Phase 27 established the audited host/debugger truth; Phase 28 will finish the topology UI |
| Custom napplet loading deferred until after demo refresh | First make the built-in demo accurate and debuggable before opening a generic test harness | Pending post-v0.6.0 review |
| HMAC-SHA256(shellSecret, dTag+aggregateHash) for key derivation | Deterministic, standard primitive, shell secret never exposed to napplet | ✓ Good — same napplet always gets same keypair |
| Hash mismatch warns but doesn't block registration | Adoption-friendly — developers aren't locked out during development | ✓ Good — onHashMismatch callback gives host apps flexibility |
| Triple-read storage migration across 3 historical formats | Zero data loss on upgrade — reads new format, then legacy with pubkey, then old napp-state: prefix | ✓ Good — backward compat with no user action |
| SEC-01 explicit BusKind allowlist (not 29000-29999 range) | Principle of least privilege — future bus kinds must opt in | ✓ Good — though SPEC.md says range (known debt) |
| SPEC.md → RUNTIME-SPEC.md with internal-reference header | Distinguishes internal reference from NIP standard; header links to NIP-5D | ✓ Good — no confusion between runtime spec and protocol NIP |
| Historical PROJECT.md SPEC.md references left as-is | These are milestone descriptions, not active cross-references | ✓ Good — avoids rewriting history |
| Remove crypto from napplet wire protocol | message.source is unforgeable; napplet can't hash itself; shell knows identity at iframe creation | ✓ Good — simpler spec, thinner shim, crypto is runtime impl detail |
| Protocol version 2.0.0 → 3.0.0 | Breaking change to handshake; downstream shell must update | ✓ Good — clean break |
| Replace NIP-01 arrays with JSON envelope | NIP-5D should describe transport, not relay semantics; simpler for NIP reviewers and shell implementors | ✓ Good — spec is 120 lines, 5-minute read |
| NUBs own protocol messages, NIP-5D is transport-only | Composable: shells implement only the NUBs they support | ✓ Good — modular spec architecture |
| Sandbox: allow-scripts only | Minimal trust; everything else is shell-granted privilege | ✓ Good — follows principle of least privilege |
| Namespaced shell.supports() with nub:/perm:/svc: prefixes | Flat NubDomain\|string caused collision risk; three namespaces with explicit prefixes; bare NUB shorthand kept for ergonomics | ✓ Good — replaced v0.16.0 flat API |
| NUB-IFC merges IPC + PIPES | dispatch (per-msg ACL) and channel (ACL at open) are modes, not separate specs | ✓ Good — one NUB, two patterns |
| Protocol version 3.0.0 → 4.0.0 | JSON envelope replaces NIP-01 arrays; breaking wire format change | ✓ Good — clean break |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check -- still the right priority?
3. Audit Out of Scope -- reasons still valid?
4. Update Context with current state

## Future Milestone Candidates

Likely next candidates:
- Submit NIP-5D PR to nostr-protocol/nips
- Formalize NUB governance (NUB-01/02/03) and create napplets org/repo
- Publish all @napplet/* packages to npm (blocked on human npm auth)
- Package alignment with NIP-5D (remove signer proxy kinds 29001/29002, rename internal interfaces)
- Load custom napplets into the demo shell for ad-hoc shell/ACL/runtime testing
- `@napplet/create` CLI / starter template
- Deploy demo as a production nsite
- Channel/pipe protocol implementation in packages (NUB-PIPES)
- Automated e2e tests for REGISTER/IDENTITY handshake step

---
*Last updated: 2026-04-21 — v0.29.0 NUB-CONNECT + Shell as CSP Authority started*
