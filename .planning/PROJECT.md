# Napplet Protocol SDK

## What This Is

A portable SDK for the napplet protocol — sandboxed Nostr mini-apps that run in restrictive iframes and delegate functionality (signing, storage, relay access) to a host shell via JSON envelope postMessage wire format defined by NIP-5D.

## Core Value

Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.

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

### Active

(No active milestone — ready for `/gsd:new-milestone`)

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

- **Current state**: v0.16.0 shipped (Wire Format & NUB Architecture). JSON envelope wire format, modular NUB packages, dispatch infrastructure. 8 packages (4 core + 4 NUB). Protocol version 4.0.0. 16 milestones shipped.
- **Package architecture**: @napplet: core(0 deps) | shim(core) | sdk(core) | vite-plugin | nub-relay | nub-signer | nub-storage | nub-ifc. Shell runtime packages in a separate repo.
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
| window.napplet.shell.supports() for NUBs + sandbox permissions | Single flat namespace, no collision between NUB names and browser tokens | ✓ Good — simple API |
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
*Last updated: 2026-04-07 after v0.16.0 milestone*
