# Napplet Protocol SDK

## What This Is

A portable SDK for the napplet protocol — sandboxed Nostr mini-apps that run in restrictive iframes and delegate functionality (signing, storage, relay access) to a host shell via NIP-01 postMessage wire format. Extracted from [hyprgate](https://github.com/sandwichfarm/hyprgate) into standalone `@napplet/*` npm packages. Includes a 66-test protocol conformance suite and an interactive Chat + Bot demo playground.

## Core Value

Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.

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

### Active

- [ ] Shell-assigned keypair handshake — napplet authenticates with shell-provided key (Phase 46, deferred to v0.9.0)
- [ ] All v0.7.0 deprecated aliases removed (RuntimeHooks, ShellHooks) — scheduled v0.9.0

### Out of Scope

- Mobile native wrapper — web-first protocol, native later
- Framework-specific bindings (Svelte/React components) — SDK is framework-agnostic by design
- Multi-shell federation — single shell per page for v1
- IndexedDB storage backend — localStorage sufficient for v1
- Key rotation for ephemeral keypairs — complexity not justified yet
- Rate limiting on signer requests — document expected behavior, don't enforce yet
- Restrictive ACL default mode — permissive default for developer adoption (v0.2.0 adds proper enforcement, restrictive mode later)
- Manifest signature verification in shell — deferred to post-v1 security hardening
- NIP PR submission — spec needs iterations before community submission
- Arbitrary custom napplet loading in the demo shell — defer until the built-in demo is architecture-accurate and trustworthy again

## Context

- **Current state**: Milestone v0.8.0 complete. All 4 phases (41-44) shipped. Shim is now a pure window installer, SDK provides named exports, demo and tests migrated, SPEC.md and all READMEs updated. 8 packages in the monorepo.
- **Package architecture**: core(0 deps) → acl(0 deps) → runtime(core+acl) → shell(core+runtime) | shim(core) | sdk(core) | services(runtime). Runtime is browser-agnostic via RuntimeAdapter DI. 8 packages total.
- **Demo purpose**: Teach the concept at a glance, provide a visual test harness for protocol behavior, let users tinker with values to see system effects, and eventually support loading custom napplets for shell/runtime testing.
- **Demo architecture gap**: The debugger and host metadata are now path-aware, but the main flow UI still flattens key layers (`shell / acl`) until Phase 28 splits shell, ACL, runtime, and services into distinct nodes.
- **Tech stack**: TypeScript 5.9, Vite 6.3, tsup 8.5, turborepo 2.5, pnpm 10.8, Vitest 4 + Playwright for testing, UnoCSS for demo styling.
- **Test coverage**: 122 Playwright e2e tests + 71 vitest unit/integration tests (~193 total, plus ~29 service/discovery tests added in v0.4.0). Coverage spans AUTH, routing, replay, lifecycle, ACL enforcement, storage, signer, inter-pane, core imports, runtime dispatch, service dispatch, service discovery, and compatibility.
- **Documentation**: All 8 packages have README.md. SPEC.md (41KB+) covers full protocol including Section 11 service discovery, shim/SDK split, and full 8-package reference. 3 portable skill files in skills/ directory.
- **Known remaining issues**: Permissive ACL default. postMessage origin '*' trust boundary. Fake event IDs on shell-injected events. Demo flow visualization currently conflates some protocol paths. npm publish blocked on human auth. nappState/nappStorage alias undocumented.
- **NIP-5A spec**: Refined SPEC.md at repo root (41KB+). References NIP-5A and nostr-protocol/nips#2287 for aggregate hash. Section 11 defines Service Discovery protocol (kind 29010).

## Constraints

- **ESM-only**: No CJS output — all packages are ESM
- **Zero framework deps**: No Svelte, React, Vue — framework-agnostic SDK
- **nostr-tools peer dep**: shim and shell depend on nostr-tools >=2.23.3 <3.0.0
- **iframe sandbox**: No allow-same-origin — everything proxied via postMessage
- **Monorepo tooling**: pnpm workspaces + turborepo + tsup + changesets

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Extract from hyprgate rather than rewrite | Proven protocol implementation, minimize risk | ✓ Good — packages working with targeted fixes |
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

After v0.6.0, likely next candidates:
- Load custom napplets into the demo shell for ad-hoc shell/ACL/runtime testing
- Publish all @napplet/* packages to npm (blocked on human npm auth)
- `@napplet/create` CLI / starter template
- Deploy demo as a production nsite
- Protocol hardening (aggregate hash revalidation, keypair derivation)
- Service ACL — per-service capability strings (service:audio, service:notifications)

---
*Last updated: 2026-04-02 — Phase 44 (Documentation) complete, v0.8.0 milestone complete*
