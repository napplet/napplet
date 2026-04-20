# Roadmap: Napplet Protocol SDK

## Milestones

- ✅ **v0.1.0 Alpha** — Phases 1-6 (shipped 2026-03-30) — [Archive](milestones/v0.1.0-ROADMAP.md)
- ✅ **v0.2.0 Shell Architecture Cleanup** — Phases 7-11 (shipped 2026-03-31) — [Archive](milestones/v0.2.0-ROADMAP.md)
- ✅ **v0.3.0 Runtime and Core** — Phases 12-17 (shipped 2026-03-31) — [Archive](milestones/v0.3.0-ROADMAP.md)
- ✅ **v0.4.0 Feature Negotiation & Service Discovery** — Phases 18-22.1 (shipped 2026-03-31) — [Archive](milestones/v0.4.0-ROADMAP.md)
- ✅ **v0.5.0 Documentation & Developer Skills** — Phases 23-26 (shipped 2026-04-01) — [Archive](milestones/v0.5.0-ROADMAP.md)
- ✅ **v0.6.0 Demo Upgrade** — Phases 27-33 (shipped 2026-04-01) — [Archive](milestones/v0.6.0-ROADMAP.md)
- ✅ **v0.7.0 Ontology Audit and Adjustments** — Phases 34-40 (shipped 2026-04-02) — [Archive](milestones/v0.7.0-ROADMAP.md)
- ✅ **v0.8.0 Shim/SDK Split** — Phases 41-44 (shipped 2026-04-02) — [Archive](milestones/v0.8.0-ROADMAP.md)
- ✅ **v0.9.0 Identity & Trust** — Phases 46-48 (shipped 2026-04-03) — [Archive](milestones/v0.9.0-ROADMAP.md)
- ✅ **v0.10.0 Demo Consistency and Usability Pass** — Phases 49-53 (shipped 2026-04-04) — [Archive](milestones/v0.10.0-ROADMAP.md)
- ✅ **v0.11.0 Clean up Side Panel** — Phases 54-56 (shipped 2026-04-05) — [Archive](milestones/v0.11.0-ROADMAP.md)
- ✅ **v0.12.0 Spec Packaging** — Phase 61 (shipped 2026-04-06) — [Archive](milestones/v0.12.0-ROADMAP.md)
- ✅ **v0.13.0 Runtime Decoupling & Publish** — Phases 62-67 (shipped 2026-04-06) — [Archive](milestones/v0.13.0-ROADMAP.md)
- ✅ **v0.14.0 Repo Cleanup & Audit** — Phases 68-69 (shipped 2026-04-06) — [Archive](milestones/v0.14.0-ROADMAP.md)
- ✅ **v0.15.0 Protocol Simplification** — Phases 70-73 (shipped 2026-04-07) — [Archive](milestones/v0.15.0-ROADMAP.md)
- ✅ **v0.16.0 Wire Format & NUB Architecture** — Phases 74-79 (shipped 2026-04-07) — [Archive](milestones/v0.16.0-ROADMAP.md)
- ✅ **v0.17.0 Capability Cleanup** — Phases 80-82 (shipped 2026-04-08) — [Archive](milestones/v0.17.0-ROADMAP.md)
- ✅ **v0.18.0 Spec Conformance Audit** — Phases 83-86 (shipped 2026-04-09) — [Archive](milestones/v0.18.0-ROADMAP.md)
- ✅ **v0.19.0 Spec Gap Drops** — Phase 87 (shipped 2026-04-09) — [Archive](milestones/v0.19.0-ROADMAP.md)
- ✅ **v0.20.0 Keys NUB** — Phases 88-92 (shipped 2026-04-09) — [Archive](milestones/v0.20.0-ROADMAP.md)
- ✅ **v0.21.0 NUB Modularization** — Phases 93-95 (shipped 2026-04-09) — [Archive](milestones/v0.21.0-ROADMAP.md)
- ✅ **v0.22.0 Media NUB + Kill Services** — Phases 96-100 (shipped 2026-04-09) — [Archive](milestones/v0.22.0-ROADMAP.md)
- ✅ **v0.23.0 Notify NUB** — Phases 101-104 (shipped 2026-04-09) — [Archive](milestones/v0.23.0-ROADMAP.md)
- ✅ **v0.24.0 Identity NUB + Kill NIP-07** — Phases 105-110 (shipped 2026-04-09) — [Archive](milestones/v0.24.0-ROADMAP.md)
- ✅ **v0.25.0 Config NUB** — Phases 111-116 (shipped 2026-04-17) — [Archive](milestones/v0.25.0-ROADMAP.md)
- ✅ **v0.26.0 Better Packages** — Phases 117-121 (shipped 2026-04-19) — [Archive](milestones/v0.26.0-ROADMAP.md)
- ✅ **v0.27.0 IFC Terminology Lock-In** — Phases 122-124 (shipped 2026-04-19) — [Archive](milestones/v0.27.0-ROADMAP.md)
- 🚧 **v0.28.0 Browser-Enforced Resource Isolation** — Phases 125-134 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Note: Phase 45 (IPC terminology cleanup) was completed as a quick task during v0.8.0 and is not part of the v0.9.0 roadmap.

<details>
<summary>v0.1.0 Alpha (Phases 1-6) — SHIPPED 2026-03-30</summary>

- [x] **Phase 1: Wiring Fixes** - Fix extraction breakage so packages work end-to-end
- [x] **Phase 2: Test Infrastructure** - Playwright e2e framework for protocol conformance
- [x] **Phase 3: Core Protocol Tests** - AUTH, routing, lifecycle, replay detection tests
- [x] **Phase 4: Capability Tests** - ACL, storage, signer, inter-pane tests
- [x] **Phase 5: Demo Playground** - Interactive Chat + Bot demo with protocol debugger
- [x] **Phase 6: Specification and Publish** - Refine NIP-5A spec and validate packages

</details>

<details>
<summary>v0.2.0 Shell Architecture Cleanup (Phases 7-11) — SHIPPED 2026-03-31</summary>

- [x] **Phase 7: Nomenclature** - Rename PseudoRelay to ShellBridge across all packages
- [x] **Phase 8: ACL Pure Module** - Extract @napplet/acl as zero-dep pure module
- [x] **Phase 9: ACL Enforcement Gate** - Single enforce() gate in ShellBridge
- [x] **Phase 10: ACL Behavioral Tests** - Full capability x action matrix tests
- [x] **Phase 11: Shell Code Cleanup** - Verb-noun naming, JSDoc, clean internals

</details>

<details>
<summary>v0.3.0 Runtime and Core (Phases 12-17) — SHIPPED 2026-03-31</summary>

- [x] **Phase 12: Core Package** - Extract shared protocol types, constants, and message definitions into @napplet/core
- [x] **Phase 13: Runtime Package** - Extract protocol engine into @napplet/runtime
- [x] **Phase 14: Shell Adapter and Shim Rewire** - Slim shell to browser adapter over runtime; switch shim to core imports
- [x] **Phase 15: Service Extension Design** - Define RuntimeHooks.services interface and reserve kind 29010
- [x] **Phase 16: Verification** - Full test suite green with new structure
- [x] **Phase 17: Shell Export Cleanup** - Remove dead exports, deduplicate enforce, clean singletons

</details>

<details>
<summary>v0.4.0 Feature Negotiation & Service Discovery (Phases 18-22.1) — SHIPPED 2026-03-31</summary>

- [x] **Phase 18: Core Types & Runtime Dispatch** - ServiceDescriptor in core, ServiceHandler/ServiceRegistry in runtime, topic-prefix routing
- [x] **Phase 19: Service Discovery Protocol** - Kind 29010 REQ/EVENT/EOSE synthetic response flow
- [x] **Phase 20: Concrete Services** - @napplet/services package with audio and notification ServiceHandlers
- [x] **Phase 21: Shim Discovery API** - discoverServices(), hasService(), hasServiceVersion() on window.napplet global
- [x] **Phase 22: Negotiation & Compatibility** - Manifest requires tags, CompatibilityReport, strict/permissive mode, undeclared consent
- [x] **Phase 22.1: Core Infrastructure Services** (INSERTED) - Signer, relay pool, cache extracted as ServiceHandlers

</details>

<details>
<summary>v0.5.0 Documentation & Developer Skills (Phases 23-26) — SHIPPED 2026-04-01</summary>

- [x] **Phase 23: New Package READMEs** - Create READMEs for the four new packages: @napplet/acl, @napplet/core, @napplet/runtime, @napplet/services
- [x] **Phase 24: Root and Interface READMEs** - Update root README and existing package READMEs: shim, shell, vite-plugin to reflect v0.4.0 reality
- [x] **Phase 25: SPEC.md Updates** - Update SPEC.md Section 11, rename legacy identifiers, and document the requires/compat protocol
- [x] **Phase 26: Skills Directory** - Create agentskills.io-format skill files: build-napplet, integrate-shell, add-service

</details>

<details>
<summary>v0.6.0 Demo Upgrade (Phases 27-33) — SHIPPED 2026-04-01</summary>

- [x] **Phase 27: Demo Audit & Correctness** - Reconcile the demo with current packages, identify stale integrations, and verify whether observed failures are UI bugs or deeper protocol/runtime issues
- [x] **Phase 28: Architecture Topology View** - Separate shell, ACL, runtime, and service nodes into a flow that mirrors the actual host architecture
- [x] **Phase 29: Node Detail & Drill-Down** - Add node-specific status surfaces plus a right-side expanded panel that preserves the bottom debugger
- [x] **Phase 30: Notification Service UX** - Register notification service in the demo, surface it as a node, and drive toast UX through the real service path
- [x] **Phase 31: Signer Connection UX** - Replace the simplified signer demo with visible signer connection flows for NIP-07 and NIP-46, including configurable NIP-46 relay settings
- [x] **Phase 32: Fix Demo UI/UX Bugs** - Amber infrastructure-failure state, Leader Line SVG edges, ACL isAmber logic fix, signer error detection
- [x] **Phase 33: Polish Demo UI Layout** - Fix layout and interaction issues: iframe container filling, 90-degree line routing, endpoint offsets, orphan container lines, and service button click handling

</details>

<details>
<summary>v0.7.0 Ontology Audit and Adjustments (Phases 34-40) — SHIPPED 2026-04-02</summary>

- [x] **Phase 34: Terminology Rename** - Rename all napp* identifiers, types, topics, meta tags, localStorage prefix, and docs to napplet* across all 7 packages
- [x] **Phase 35: Wire Protocol Rename** - Rename BusKind.INTER_PANE to BusKind.IPC_PEER and update all 30+ call sites plus SPEC.md
- [x] **Phase 36: Type Correctness** - Consolidate ConsentRequest to runtime canonical definition and remove shell/state-proxy.ts dead code
- [x] **Phase 37: API Alignment** - Rename RuntimeHooks/ShellHooks to RuntimeAdapter/ShellAdapter with deprecated aliases for one release cycle
- [x] **Phase 38: Session Vocabulary** - Rename NappKeyEntry/NappKeyRegistry to SessionEntry/SessionRegistry
- [x] **Phase 39: Documentation Pass** - Document topic prefix direction semantics and mark nappStorage as deprecated
- [x] **Phase 40: Remaining Rename Gaps** - Close audit gaps: createEphemeralKeypair, vite-plugin nappletType, SPEC.md stale topic strings

</details>

<details>
<summary>v0.8.0 Shim/SDK Split (Phases 41-44) — SHIPPED 2026-04-02</summary>

- [x] **Phase 41: Shim Restructure** - Reorganize @napplet/shim into a pure window installer with namespaced window.napplet API and zero named exports
- [x] **Phase 42: SDK Package** - Create @napplet/sdk as a standalone bundler-friendly package wrapping window.napplet
- [x] **Phase 43: Demo & Test Migration** - Update demo napplets and test suite for new window.napplet API shape
- [x] **Phase 44: Documentation** - Update SPEC.md and READMEs for shim/SDK split

</details>

<details>
<summary>v0.9.0 Identity & Trust (Phases 46-48) — SHIPPED 2026-04-03</summary>

- [x] **Phase 46: Shell-Assigned Keypair Handshake** - REGISTER/IDENTITY/AUTH handshake, storage rekeying, aggregate hash verification, instance GUIDs, delegated key security (completed 2026-04-02)
- [x] **Phase 47: Deprecation Cleanup** - Remove RuntimeHooks and ShellHooks deprecated aliases (completed 2026-04-02)
- [x] **Phase 48: Specification & Documentation** - Update SPEC.md Sections 2, 5, and 14 for new handshake, storage, and security models (completed 2026-04-02)

</details>

<details>
<summary>v0.10.0 Demo Consistency and Usability Pass (Phases 49-53) — SHIPPED 2026-04-04</summary>

- [x] **Phase 49: Constants Panel** - Expose and edit protocol magic numbers in a dedicated UI panel (completed 2026-04-03)
- [x] **Phase 50: ACL Detail Panel** - Show per-napplet restrictions, capabilities, and rejection reasons with full event context (completed 2026-04-03)
- [x] **Phase 51: Accurate Color Routing** - Directional edge coloring and composite node colors reflecting actual pass/fail/warn state (completed 2026-04-03)
- [x] **Phase 52: Service & Capability Toggles** - Enable/disable services and toggle individual ACL capabilities with live-reload (completed 2026-04-03)
- [x] **Phase 53: Per-Message Trace Mode** - Animated hop-by-hop message trace through the topology graph (completed 2026-04-03)

</details>

<details>
<summary>v0.11.0 Clean up Side Panel (Phases 54-56) — SHIPPED 2026-04-05</summary>

- [x] **Phase 54: Data Layer** - Add role annotations and query methods to ConstantDef for downstream filtering (completed 2026-04-04)
- [x] **Phase 55: Tab Reorganization** - Split Kinds into a read-only tab, constrain Constants to editable values, and fix tab persistence (completed 2026-04-04)
- [x] **Phase 56: Contextual Filtering** - Filter constants by selected node role with show-all fallback and toggle (completed 2026-04-04)

</details>

<details>
<summary>v0.12.0 Spec Packaging (Phase 61) — SHIPPED 2026-04-06</summary>

- [x] **Phase 61: Spec Packaging** - Rename SPEC.md to RUNTIME-SPEC.md, finalize NIP-5D v2 format (completed 2026-04-05)

</details>

<details>
<summary>v0.13.0 Runtime Decoupling & Publish (Phases 62-67) — SHIPPED 2026-04-06</summary>

- [x] **Phase 62: Runtime Repo Scaffold** - Initialize separate runtime repo (completed 2026-04-06)
- [x] **Phase 63: Package Migration** - Copy source, rewrite imports, build and type-check green (completed 2026-04-06)
- [x] **Phase 64: Demo & Test Migration** - Demo playground and test suite migrated (completed 2026-04-06)
- [x] **Phase 65: Napplet Cleanup** - Remove extracted packages and demo, reconfigure for 4-package monorepo (completed 2026-04-06)
- [x] **Phase 66: Publish Pipeline & Release** - GitHub Actions CI/CD and npm publish for @napplet packages (completed 2026-04-06)
- [x] **Phase 67: Cross-Repo Wiring & Docs** - Update all READMEs (completed 2026-04-06)

</details>

<details>
<summary>v0.14.0 Repo Cleanup & Audit (Phases 68-69) — SHIPPED 2026-04-06</summary>

- [x] **Phase 68: Audit & Clean** - Remove dead code, stale docs, and leftover config (completed 2026-04-06)
- [x] **Phase 69: Migration Evaluation** - Assess remaining content (completed 2026-04-06)

</details>

<details>
<summary>v0.15.0 Protocol Simplification (Phases 70-73) — SHIPPED 2026-04-07</summary>

- [x] **Phase 70: Core Protocol Types** - Remove AUTH/handshake types and constants from @napplet/core (completed 2026-04-07)
- [x] **Phase 71: Shim Simplification** - Strip signing, keypair, AUTH from shim; drop nostr-tools (completed 2026-04-07)
- [x] **Phase 72: NIP-5D Update** - Rewrite NIP-5D for simplified wire protocol (completed 2026-04-07)
- [x] **Phase 73: SDK & README Update** - Update all READMEs for no-crypto API (completed 2026-04-07)

</details>

<details>
<summary>v0.16.0 Wire Format & NUB Architecture (Phases 74-79) — SHIPPED 2026-04-07</summary>

- [x] **Phase 74: NIP-5D Rewrite** - JSON envelope, transport+identity+manifest+NUB-negotiation only (completed 2026-04-07)
- [x] **Phase 75: Package Architecture** - Envelope-only core + packages/nubs/ scaffold (completed 2026-04-07)
- [x] **Phase 76: Core Envelope Types** - NUB dispatch infrastructure + 12 tests (completed 2026-04-07)
- [x] **Phase 77: NUB Module Scaffold** - 52 typed message definitions across 4 NUBs (completed 2026-04-07)
- [x] **Phase 78: Shim & SDK Integration** - JSON envelope wire format + NUB type re-exports (completed 2026-04-07)
- [x] **Phase 79: Documentation Update** - All READMEs updated (completed 2026-04-07)

</details>

<details>
<summary>v0.17.0 Capability Cleanup (Phases 80-82) — SHIPPED 2026-04-08</summary>

- [x] **Phase 80: Namespaced Capability Query** - shell.supports() accepts nub:/perm:/svc: prefixed strings with typed ShellSupports interface (completed 2026-04-08)
- [x] **Phase 81: Dead Code & Legacy Removal** - Delete discovery shim, services API, legacy re-exports, backward-compat fallbacks, and all associated types/tests (completed 2026-04-08)
- [x] **Phase 82: Documentation** - Update core/shim/sdk READMEs and NIP-5D to reflect cleanup (completed 2026-04-08)

</details>

<details>
<summary>v0.18.0 Spec Conformance Audit (Phases 83-86) — SHIPPED 2026-04-09</summary>

- [x] **Phase 83: Dead Code Removal** - Delete unreachable types, uncalled functions, and dead files across core and shim (completed 2026-04-08)
- [x] **Phase 84: Spec Gap Inventory** - Document every function, type, constant, and behavior not covered by NIP-5D or any NUB spec (completed 2026-04-08)
- [x] **Phase 85: Stale Documentation Fixes** - Fix incorrect references in READMEs, JSDoc, and NIP-5D (completed 2026-04-08)
- [x] **Phase 86: Decision Gate** - Present the complete gap inventory for drop-or-amend decisions (completed 2026-04-09)

</details>

<details>
<summary>v0.19.0 Spec Gap Drops (Phase 87) — SHIPPED 2026-04-09</summary>

- [x] **Phase 87: Spec Gap Code Drops** - Delete all unspecced types, constants, and topics from @napplet/core and verify clean build (completed 2026-04-09)

</details>

<details>
<summary>v0.20.0 Keys NUB (Phases 88-92) — SHIPPED 2026-04-09</summary>

- [x] **Phase 88: NUB Type Package** - Create @napplet/nub-keys with typed message definitions per NUB-KEYS spec (completed 2026-04-09)
- [x] **Phase 89: Core Integration** - Add 'keys' to NubDomain union and NappletGlobal type (completed 2026-04-09)
- [x] **Phase 90: Shim Implementation** - Replace keyboard-shim.ts with NUB-KEYS smart forwarding and action API (completed 2026-04-09)
- [x] **Phase 91: SDK Wrappers** - Add keys namespace to SDK with registerAction() convenience and NUB type re-exports (completed 2026-04-09)
- [x] **Phase 92: Documentation** - README for nub-keys, NIP-5D domain table update, core/shim/SDK README updates (completed 2026-04-09)

</details>

<details>
<summary>v0.21.0 NUB Modularization (Phases 93-95) — SHIPPED 2026-04-09</summary>

- [x] **Phase 93: NUB Package Refactor** - Move domain logic into all 5 NUB packages (shim installers + SDK helpers)
- [x] **Phase 94: Shim + SDK Thin Hosts** - Refactor shim/SDK to import from NUB packages, add named exports for cherry-picking
- [x] **Phase 95: Verification** - Build clean, API surface identical before and after

</details>

<details>
<summary>v0.22.0 Media NUB + Kill Services (Phases 96-100) — SHIPPED 2026-04-09</summary>

- [x] **Phase 96: Kill Services** - Remove svc: prefix, drop AUDIO_* TOPICS superseded by media NUB
- [x] **Phase 97: NUB-MEDIA Spec** - Draft NUB-MEDIA spec in nubs repo, PR to napplet/nubs
- [x] **Phase 98: NUB Media Package** - @napplet/nub-media with types, shim installer, SDK wrappers
- [x] **Phase 99: Core + Shim Integration** - Add 'media' to NubDomain, NappletGlobal, and shim entry point
- [x] **Phase 100: Documentation** - READMEs for nub-media, NIP-5D domain table update, core/shim/SDK docs

</details>

<details>
<summary>v0.23.0 Notify NUB (Phases 101-104) — SHIPPED 2026-04-09</summary>

- [x] **Phase 101: NUB-NOTIFY Spec** - Draft NUB-NOTIFY spec in nubs repo, PR to napplet/nubs
- [x] **Phase 102: NUB Notify Package** - @napplet/nub-notify with types, shim installer, SDK wrappers
- [x] **Phase 103: Core + Shim Integration** - Add 'notify' to NubDomain, NappletGlobal, and shim entry point
- [x] **Phase 104: Documentation** - READMEs for nub-notify, NIP-5D domain table update, core/shim/SDK docs

</details>

<details>
<summary>v0.24.0 Identity NUB + Kill NIP-07 (Phases 105-110) — SHIPPED 2026-04-09</summary>

- [x] **Phase 105: Kill NIP-07 + Signer** - Remove window.nostr, delete nub-signer, strip signer from core/shim/SDK
- [x] **Phase 106: NUB-IDENTITY Spec** - Draft NUB-IDENTITY spec in nubs repo, PR to napplet/nubs
- [x] **Phase 107: NUB Identity Package** - @napplet/nub-identity with types, shim installer, SDK wrappers
- [x] **Phase 108: Relay NUB Update** - Add publishEncrypted + shell-decrypts-incoming to relay NUB
- [x] **Phase 109: Core + Shim Integration** - Replace signer with identity in core/shim dispatch
- [x] **Phase 110: Documentation** - NIP-5D security rationale, nub-identity README, core/shim/SDK docs

</details>

<details>
<summary>v0.25.0 Config NUB (Phases 111-116) — SHIPPED 2026-04-17</summary>

- [x] **Phase 111: NUB-CONFIG Spec** - Draft NUB-CONFIG spec in public nubs repo (PR #13)
- [x] **Phase 112: NUB Config Package Scaffold** - @napplet/nub-config types + config + barrel
- [x] **Phase 113: NUB Config Shim + SDK** - Installer + ref-counted subscribers + SDK wrappers
- [x] **Phase 114: Vite-Plugin Extension** - configSchema option + discovery + manifest tag + aggregateHash + meta injection + guards
- [x] **Phase 115: Core / Shim / SDK Integration + Wire** - 'config' in NubDomain + NappletGlobal.config + shim mount + SDK re-exports
- [x] **Phase 116: Documentation** - nub-config README + NIP-5D registry row + 4 package READMEs

</details>

<details>
<summary>v0.26.0 Better Packages (Phases 117-121) — SHIPPED 2026-04-19</summary>

- [x] **Phase 117: @napplet/nub Package Foundation** - Scaffold packages/nub/ with 34 subpath entry points + sideEffects:false
- [x] **Phase 118: Deprecation Re-Export Shims** - 9 deprecated packages become 1-line re-exports with [DEPRECATED] metadata
- [x] **Phase 119: Internal Consumer Migration** - shim + sdk migrated to @napplet/nub/<domain> paths
- [x] **Phase 120: Documentation Update** - New @napplet/nub README + 4 updated package READMEs + spec/skills sweep
- [x] **Phase 121: Verification & Sign-Off** - Monorepo build/type-check green + tree-shake bundle (39 bytes) + 9 pinned-consumer smokes green

</details>

<details>
<summary>v0.27.0 IFC Terminology Lock-In (Phases 122-124) — SHIPPED 2026-04-19</summary>

- [x] **Phase 122: Source Rename** - Break `window.napplet.ipc` → `.ifc`, rename SDK `ipc` export → `ifc`, sweep core + nub/ifc JSDoc
- [x] **Phase 123: Documentation Sweep** - Purge IPC / inter-pane from 4 READMEs + skill + active planning docs
- [x] **Phase 124: Verification & Sign-Off** - Monorepo build + type-check green; first-party zero-grep clean

</details>

### 🚧 v0.28.0 Browser-Enforced Resource Isolation (In Progress)

**Milestone Goal:** Convert napplet iframe security from ambient trust ("napplets shouldn't fetch directly") to browser-enforced isolation ("napplets cannot fetch directly — the browser blocks it"). Ship one new NUB (`resource`) with `resource.bytes(url) → Blob`, scheme-pluggable URL space (`https:`, `blossom:`, `nostr:`, `data:`), optional sidecar pre-resolution on relay events, strict CSP enforcement at the iframe boundary via `@napplet/vite-plugin`, and the spec amendments needed to lock the model in (NIP-5D Security Considerations + NUB-RESOURCE new spec + NUB-RELAY/IDENTITY/MEDIA amendments in `napplet/nubs`).

- [x] **Phase 125: Core Type Surface** - Add `'resource'` to `NubDomain` + `NUB_DOMAINS`, add `resource` namespace to `NappletGlobal`, document `perm:strict-csp` (completed 2026-04-20)
- [x] **Phase 126: Resource NUB Scaffold + `data:` Scheme** - Create `packages/nub/src/resource/` triad, ship `data:` scheme decoded in-shim, implement single-flight cache, AbortSignal cancellation, blob URL lifecycle helpers (completed 2026-04-20)
- [x] **Phase 127: NUB-RELAY Sidecar Amendment** - Add optional `resources?: ResourceSidecarEntry[]` to `RelayEventMessage`; relay shim hydrates resource cache before `onEvent` (completed 2026-04-20)
- [x] **Phase 128: Central Shim Integration** - Wire resource NUB into `@napplet/shim`; mount `window.napplet.resource`; ship `nub:resource` and `resource:scheme:<name>` capability checks (completed 2026-04-20)
- [x] **Phase 129: Central SDK Integration** - Add `resource` namespace + `RESOURCE_DOMAIN` const + type re-exports to `@napplet/sdk` (completed 2026-04-20)
- [x] **Phase 130: Vite-Plugin Strict CSP** - Ship `strictCsp` option with first-`<head>`-child meta injection, header-only directive rejection, dev/prod split, nonce-based scripts, complete 10-directive baseline; ship `perm:strict-csp` capability (completed 2026-04-20)
- [x] **Phase 131: NIP-5D In-Repo Spec Amendment** - Add Security Considerations subsection to `specs/NIP-5D.md` (completed 2026-04-20)
- [ ] **Phase 132: Cross-Repo Nubs PRs** - Open 4 draft PRs to `napplet/nubs`: NUB-RESOURCE (new), NUB-RELAY sidecar amendment with default-OFF privacy, NUB-IDENTITY clarification, NUB-MEDIA clarification; lock SSRF + SVG MUSTs in spec; zero-grep clean of `@napplet/*`
- [ ] **Phase 133: Documentation + Demo Coordination** - Update 5 package READMEs + skills/build-napplet + shell-deployer policy checklist; PROJECT.md + NUB-RESOURCE coordination note delegating demos to downstream shell repo
- [ ] **Phase 134: Verification & Milestone Close** - Build + type-check green; positive CSP block assertion in Playwright; SVG bomb / `<foreignObject>` / recursive-`<use>` rejection; single-flight cache stampede dedup; sidecar default-OFF; cross-repo zero-grep; bundle tree-shake

## Phase Details

### Phase 125: Core Type Surface
**Goal**: The shared type vocabulary downstream packages need to compile against the resource NUB exists in `@napplet/core`.
**Depends on**: Nothing (first phase of milestone; v0.27.0 Phase 124 shipped)
**Requirements**: CORE-01, CORE-02, CORE-03
**Success Criteria** (what must be TRUE):
  1. `import { type NubDomain } from '@napplet/core'` resolves a union that includes `'resource'`, and `NUB_DOMAINS` array includes `'resource'`.
  2. `import { type NappletGlobal } from '@napplet/core'` resolves an interface whose `resource` property exposes `bytes` and `bytesAsObjectURL` method signatures.
  3. The `NamespacedCapability` type (or its JSDoc) documents `perm:strict-csp` as a valid permission identifier; a usage example appears in the core JSDoc/README.
  4. `pnpm --filter @napplet/core build` and `pnpm --filter @napplet/core type-check` exit 0.
**Plans**: 1
- [x] 125-01-PLAN.md — Add 'resource' to NubDomain + NUB_DOMAINS, NappletGlobal.resource namespace, perm:strict-csp JSDoc clarification

### Phase 126: Resource NUB Scaffold + `data:` Scheme
**Goal**: A complete, self-contained `@napplet/nub/resource` subpath exists with envelope types, single-flight shim, SDK helpers, and zero-network `data:` decoding — proving the full request / result / cancel / cache / lifecycle dispatch path before anything integrates.
**Depends on**: Phase 125
**Requirements**: RES-01, RES-02, RES-03, RES-04, RES-05, RES-06, RES-07, SCH-01
**Success Criteria** (what must be TRUE):
  1. `import { bytes } from '@napplet/nub/resource/shim'` resolves; calling `bytes('data:image/png;base64,...')` returns a `Promise<Blob>` that resolves with the decoded bytes without sending any postMessage.
  2. The result envelope union exposes a typed `error` discriminator with all 8 codes (`not-found`, `blocked-by-policy`, `timeout`, `too-large`, `unsupported-scheme`, `decode-failed`, `network-error`, `quota-exceeded`).
  3. `bytesAsObjectURL(url)` returns `{ url, revoke }`; calling `revoke()` invokes `URL.revokeObjectURL` exactly once.
  4. Calling `bytes(url, { signal })` with an already-aborted `AbortSignal` rejects with an `AbortError`-shaped error and sends a `resource.cancel` envelope to the parent window.
  5. The `Blob` field on `ResourceBytesResultMessage` is the type-system-enforced delivery shape — no `chunk`, `stream`, or partial-payload field exists anywhere in the result union (RES-07 single-Blob contract).
  6. `@napplet/nub` `package.json` declares 4 new `exports` entries (`./resource`, `./resource/types`, `./resource/shim`, `./resource/sdk`) and tsup builds 4 corresponding entries.
**Plans**: 1
- [x] 126-01-PLAN.md — Create @napplet/nub/resource subpath (4 source files + 4 exports + 4 tsup entries) with single-flight cache, AbortSignal cancellation, and zero-postMessage data: scheme decoding

### Phase 127: NUB-RELAY Sidecar Amendment
**Goal**: Shells that opt in can pre-resolve resources referenced by relay events; the napplet's `resource.bytes(url)` call resolves from cache without round-trip when the sidecar pre-populated the URL — invisibly to the napplet caller.
**Depends on**: Phase 126
**Requirements**: SIDE-01, SIDE-02, SIDE-03, SIDE-04
**Success Criteria** (what must be TRUE):
  1. `RelayEventMessage` accepts an optional `resources?: ResourceSidecarEntry[]` field; old shells that omit it produce envelopes that type-check and parse identically to pre-v0.28.0.
  2. `ResourceSidecarEntry` is exported from `@napplet/nub/resource/types` (resource NUB owns it); `@napplet/nub/relay/types` imports it as a type-only in-package reference (no runtime cross-domain dep).
  3. When a `relay.event` envelope arrives with a non-empty `resources` array, the relay shim invokes `hydrateResourceCache(entries)` from the resource shim before delivering the event to the caller's `onEvent` callback — verifiable by ordering: a synchronous `napplet.resource.bytes(sidecarUrl)` call inside `onEvent` resolves from cache without a postMessage.
  4. Concurrent `bytes(sameUrl)` calls share one in-flight Promise (single-flight `Map<canonicalURL, Promise<Blob>>`); N concurrent calls produce 1 fetch and N resolutions of the same Blob reference.
**Plans**: 1
- [x] 127-01-PLAN.md — Add optional resources?: ResourceSidecarEntry[] to RelayEventMessage (type-only sibling import) + wire relay shim to call hydrateResourceCache before onEvent (SIDE-01..04)

### Phase 128: Central Shim Integration
**Goal**: Napplets that `import '@napplet/shim'` get `window.napplet.resource` mounted automatically and can detect resource-NUB + per-scheme support via `shell.supports()`.
**Depends on**: Phase 126
**Requirements**: SHIM-01, SHIM-02, SHIM-03, CAP-01, CAP-02
**Success Criteria** (what must be TRUE):
  1. After `import '@napplet/shim'`, `window.napplet.resource.bytes` and `window.napplet.resource.bytesAsObjectURL` are callable functions.
  2. Inbound envelopes whose type prefix is `resource.` are routed by the central shim to the resource NUB's `handleResourceMessage` — verified by an end-to-end echo test against a mock shell.
  3. `window.napplet.shell.supports('nub:resource')` returns true when the shell has advertised resource support; `window.napplet.shell.supports('resource:scheme:blossom')` returns true when the shell has advertised that specific scheme.
  4. The shim init sequence calls `installResourceShim()` exactly once, following the established 9-NUB pattern.
**Plans**: 1
- [x] 128-01-PLAN.md — Integrate resource NUB into @napplet/shim central installer (import + route + mount + install) and close DEF-125-01 (workspace-wide pnpm -r type-check green across all 14 packages)

### Phase 129: Central SDK Integration
**Goal**: Bundler consumers that import from `@napplet/sdk` get the resource namespace, the domain constant, and all resource type re-exports without reaching into `@napplet/nub` subpaths.
**Depends on**: Phase 126
**Requirements**: SDK-01, SDK-02, SDK-03
**Success Criteria** (what must be TRUE):
  1. `import { resource } from '@napplet/sdk'` exposes `resource.bytes` and `resource.bytesAsObjectURL` as named functions.
  2. `import { RESOURCE_DOMAIN } from '@napplet/sdk'` resolves to the string `'resource'`.
  3. All resource NUB types (`ResourceBytesMessage`, `ResourceBytesResultMessage`, `ResourceSidecarEntry`, `ResourceScheme`, error code union, etc.) re-export from `@napplet/sdk` and round-trip through `tsc --isolatedModules`.
**Plans**: 1
- [x] 129-01-PLAN.md — Add resource NUB to @napplet/sdk barrel: namespace export, RESOURCE_DOMAIN, 11 type re-exports, installResourceShim + resourceBytes/resourceBytesAsObjectURL helpers (SDK-01..03)

### Phase 130: Vite-Plugin Strict CSP
**Goal**: Napplets developed with `@napplet/vite-plugin` ship under a 10-directive strict CSP baseline that survives meta placement, blocks header-only directive misuse, separates dev (HMR-relaxed) from prod (`connect-src 'none'`), and never permits `'unsafe-inline'` or `'unsafe-eval'` for scripts.
**Depends on**: Phase 125 (for `perm:strict-csp` capability JSDoc)
**Requirements**: CSP-01, CSP-02, CSP-03, CSP-04, CSP-05, CSP-06, CSP-07, CAP-03
**Success Criteria** (what must be TRUE):
  1. The vite-plugin accepts `strictCsp?: boolean | StrictCspOptions` on `Nip5aManifestOptions`; when enabled, the emitted napplet HTML has `<meta http-equiv="Content-Security-Policy">` as the literal first child of `<head>`, verifiable by post-build HTML walk (Pitfall 1 mitigation).
  2. Vite build fails with a clear diagnostic if any `<script>`, `<style>`, or `<link>` element appears before the CSP meta in `<head>`, or if the configured policy contains any of `frame-ancestors`, `sandbox`, `report-uri`, `report-to` (header-only directives that silently fail in meta delivery — Pitfall 2 mitigation).
  3. Dev mode emits a CSP that includes `connect-src 'self' ws://localhost:* wss://localhost:*` for HMR; production build emits `connect-src 'none'`; build-time assertion fails the build if any dev-relaxation appears in the production manifest.
  4. The default baseline policy emits 10 directives including `default-src 'none'`, `script-src 'nonce-...' 'self'` (never `'unsafe-inline'`, never `'unsafe-eval'`), `connect-src 'none'`, `img-src blob: data:`, `font-src blob: data:`, `style-src 'self'`, `worker-src 'none'`, `object-src 'none'`, `base-uri 'none'`, `form-action 'none'`.
  5. Shells that enforce this policy advertise `shell.supports('perm:strict-csp')`; the capability is documented as orthogonal to `nub:resource` (a permissive dev shell can implement the resource NUB without enforcing strict CSP).
**Plans**: 1
- [x] 130-01-PLAN.md — Add strictCsp option to vite-plugin: hand-rolled CspBuilder + first-head-child meta injection (transformIndexHtml order: 'pre' + injectTo: 'head-prepend') + closeBundle assertions for Pitfalls 1/2/18/19 + 7-case end-to-end smoke test (CSP-01..07 + CAP-03 JSDoc)
**UI hint**: yes

### Phase 131: NIP-5D In-Repo Spec Amendment
**Goal**: `specs/NIP-5D.md` documents the v0.28.0 strict-CSP security posture so anyone reading the NIP understands the resource NUB is the canonical fetch path and `sandbox="allow-scripts"` (no `allow-same-origin`) is reaffirmed.
**Depends on**: Phase 126 (wire shape stable), Phase 130 (`perm:strict-csp` capability shape locked)
**Requirements**: SPEC-01
**Success Criteria** (what must be TRUE):
  1. `specs/NIP-5D.md` contains a Security Considerations subsection describing strict-CSP posture as **SHOULD**, the `perm:strict-csp` capability identifier, the resource NUB as the canonical path for network-sourced bytes, and an explicit prohibition on `sandbox="allow-same-origin"` (closes the service-worker bypass vector — Pitfall 5 mitigation).
  2. The amendment cross-references NUB-RESOURCE in the public `napplet/nubs` repo without naming `@napplet/*` packages — public-repo hygiene preserved.
**Plans**: 1
- [x] 131-01-PLAN.md — Add Browser-Enforced Resource Isolation subsection to specs/NIP-5D.md (SPEC-01: strict-CSP SHOULD posture, perm:strict-csp capability, NUB-RESOURCE cross-reference, sandbox="allow-scripts" reaffirmation, public-repo hygiene)

### Phase 132: Cross-Repo Nubs PRs
**Goal**: Four draft PRs are open against `napplet/nubs` capturing the protocol-level surface for v0.28.0 — NUB-RESOURCE as a new spec, NUB-RELAY sidecar amendment with default-OFF privacy, NUB-IDENTITY and NUB-MEDIA clarifications routing picture / artwork URLs through the resource NUB. Every PR is `@napplet/*`-clean.
**Depends on**: Phase 126 (wire shape stable)
**Requirements**: SPEC-02, SPEC-03, SPEC-04, SPEC-05, SPEC-06, SCH-02, SCH-03, SCH-04, POL-01, POL-02, POL-03, POL-04, POL-05, POL-06, SVG-01, SVG-02, SVG-03, SIDE-05
**Success Criteria** (what must be TRUE):
  1. NUB-RESOURCE.md draft PR is open at `napplet/nubs`; spec contains the message catalog, the four canonical scheme protocol surfaces (`https:` with shell-side network policy, `blossom:` with canonical hash form, `nostr:` with single-hop NIP-19 bech32 resolution, `data:` per RFC 2397), the 8-code error vocabulary, and a MUST/SHOULD/MAY shell behavior contract.
  2. The default shell resource policy in NUB-RESOURCE locks: a private-IP block list as **MUST** at DNS-resolution time covering RFC1918 (10/8, 172.16/12, 192.168/16), loopback (127/8, ::1), link-local (169.254/16, fe80::/10), unique-local (fc00::/7), and cloud metadata (169.254.169.254); response size cap, fetch timeout, per-napplet concurrency / rate limit, and redirect chain cap with per-hop re-validation as **SHOULD** with recommended values; MIME byte-sniffing as **MUST** with explicit ban on upstream `Content-Type` passthrough (Pitfall 6 mitigation).
  3. SVG handling in NUB-RESOURCE locks: shell-side rasterization to PNG/WebP as **MUST**, prohibition on delivering `image/svg+xml` bytes to napplets as **MUST**, rasterization caps (max input bytes, max output dimensions, wall-clock budget) as **SHOULD** with sandboxed-Worker-no-network requirement (Pitfall 7 mitigation).
  4. NUB-RELAY amendment PR is open; sidecar field is documented as **OPTIONAL** with **default OFF** privacy rationale (shell pre-fetching reveals user activity to upstream avatar hosts before user has rendered the event); opt-in is per shell policy with per-event-kind allowlist guidance (Pitfall 10 mitigation).
  5. NUB-IDENTITY clarification PR is open noting `picture` / `banner` URLs flow through `resource.bytes()` (no wire change); NUB-MEDIA clarification PR is open noting `MediaArtwork.url` flows through `resource.bytes()` (no wire change).
  6. All 4 PR bodies, commit messages, and spec content are zero-grep clean of `@napplet/*` private package references — verified by manual sweep + grep before milestone close (also asserted by VER-06 in Phase 134 — Pitfall 8 mitigation).
**Plans**: TBD

### Phase 133: Documentation + Demo Coordination
**Goal**: Five package READMEs, the napplet-author skill, the root README, and a shell-deployer resource policy checklist all reflect the v0.28.0 surface; demo napplets are explicitly delegated to the downstream shell repo via a coordination note.
**Depends on**: Phases 126–130 (wire shape and CSP behavior stable)
**Requirements**: DOC-01, DOC-02, DOC-03, DOC-04, DOC-05, DOC-06, DOC-07, DEMO-01
**Success Criteria** (what must be TRUE):
  1. `@napplet/nub` README documents the new `/resource` subpath with the four-scheme overview; `@napplet/shim` README documents resource NUB integration; `@napplet/sdk` README documents the resource namespace + `RESOURCE_DOMAIN`; `@napplet/vite-plugin` README documents the `strictCsp` option with dev/prod CSP behavior; root README updated for v0.28.0 (resource NUB + browser-enforced isolation framing).
  2. `skills/build-napplet/SKILL.md` is updated so cold-reading agents write `napplet.resource.bytes(url)` instead of `<img src=externalUrl>` or `fetch()`.
  3. A shell-deployer resource policy checklist exists (location to be selected in Phase 133 plan; e.g. `specs/SHELL-RESOURCE-POLICY.md`) covering private-IP block ranges, sidecar opt-in semantics, SVG rasterization caps, MIME allowlist, and redirect chain limits.
  4. PROJECT.md and the NUB-RESOURCE spec both contain a coordination note explicitly delegating v0.28.0 demo napplets (profile viewer, feed-with-images, scheme-mixed consumer) to the downstream shell repo; this repo's responsibility ends at the wire + SDK surface.
**Plans**: TBD

### Phase 134: Verification & Milestone Close
**Goal**: Mechanical proof that the milestone is shippable — build / type-check green, CSP genuinely blocks (positive assertion, not absence-of-request), SVG attack vectors are rejected, cache stampede is prevented, sidecar opt-in default holds, public-repo hygiene is verified, and the resource NUB tree-shakes cleanly.
**Depends on**: Phases 125–133 (everything else)
**Requirements**: VER-01, VER-02, VER-03, VER-04, VER-05, VER-06, VER-07
**Success Criteria** (what must be TRUE):
  1. `pnpm -r build` and `pnpm -r type-check` exit 0 across all 14 workspace packages.
  2. A Playwright test correlates `page.on('console')` CSP violation messages with `page.on('requestfailed')` for the same URL and asserts the specific blocked URL was seen — proving CSP enforcement, not absence (Pitfall 21 mitigation).
  3. SVG bomb / `<foreignObject>` / recursive-`<use>` test inputs are rejected by the rasterization pipeline (or its spec-conformant simulation) under the documented caps; raw `image/svg+xml` bytes never reach the napplet.
  4. A single-flight cache stampede test fires N concurrent `resource.bytes(sameUrl)` calls and observes exactly 1 outbound fetch, with all N callers receiving the same Blob reference (Pitfall 13 mitigation).
  5. A relay event with a `resources` field is ignored by the relay shim unless the shell has explicitly opted in (sidecar default OFF) — verified by a test that constructs an opt-out shell and asserts no cache hydration.
  6. Cross-repo zero-grep sweep across all 4 `napplet/nubs` PR bodies, commit messages, and spec content returns zero `@napplet/*` private references.
  7. A consumer that imports only `@napplet/nub/relay/types` produces a tree-shaken bundle with zero bytes from `@napplet/nub/resource` (proven by bundle inspection, matching the v0.26.0 39-byte tree-shake precedent).
**Plans**: TBD

## Progress

**Execution Order:**
Phases 125 and 126 are blocking-sequential; Phases 127–130 are independent of each other after 126 and may be parallelized; Phase 131 follows 126 + 130; Phase 132 (cross-repo) opens drafts as soon as 126 stabilizes the wire shape and is gated by Phase 134 for final merge. Phase 133 follows the in-repo phases. Phase 134 closes the milestone.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 125. Core Type Surface | 1/1 | Complete    | 2026-04-20 |
| 126. Resource NUB Scaffold + `data:` Scheme | 1/1 | Complete    | 2026-04-20 |
| 127. NUB-RELAY Sidecar Amendment | 1/1 | Complete    | 2026-04-20 |
| 128. Central Shim Integration | 1/1 | Complete    | 2026-04-20 |
| 129. Central SDK Integration | 1/1 | Complete    | 2026-04-20 |
| 130. Vite-Plugin Strict CSP | 1/1 | Complete    | 2026-04-20 |
| 131. NIP-5D In-Repo Spec Amendment | 1/1 | Complete   | 2026-04-20 |
| 132. Cross-Repo Nubs PRs | 0/0 | Not started | - |
| 133. Documentation + Demo Coordination | 0/0 | Not started | - |
| 134. Verification & Milestone Close | 0/0 | Not started | - |
