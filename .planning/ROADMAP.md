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
- 🚧 **v0.26.0 Better Packages** — Phases 117-121 (in progress)

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

### 🚧 v0.26.0 Better Packages (In Progress)

**Milestone Goal:** Consolidate the 9 separate `@napplet/nub-*` packages (relay, storage, ifc, keys, theme, media, notify, identity, config) into a single tree-shakable `@napplet/nub` package with per-domain barrel + granular subpath exports. Ship the old packages as 1-line deprecation re-export shims for one release cycle so every pinned consumer keeps working. Migrate internal consumers and all docs to the new paths.

- [x] **Phase 117: @napplet/nub Package Foundation** - Scaffold packages/nub/ with 9 domain subdirectories, exports map for all 36 entry points, tsup build, and sideEffects:false tree-shaking contract (completed 2026-04-19)
- [x] **Phase 118: Deprecation Re-Export Shims** - Convert the 9 `@napplet/nub-<domain>` packages into 1-line re-export shims with @deprecated markers and banner READMEs (completed 2026-04-19)
- [x] **Phase 119: Internal Consumer Migration** - Rewire @napplet/shim, @napplet/sdk, and in-repo demos/tests to import from `@napplet/nub/<domain>` paths (completed 2026-04-19)
- [ ] **Phase 120: Documentation Update** - New @napplet/nub README, updated package READMEs, NIP-5D example imports, and skills/ directory examples point at new subpaths
- [ ] **Phase 121: Verification & Sign-Off** - Full monorepo build + type-check green, tree-shaking smoke test proves per-domain isolation, deprecation shims import cleanly

## Phase Details

### Phase 117: @napplet/nub Package Foundation
**Goal**: A single `@napplet/nub` package exists at `packages/nub/`, contains all 9 domain subdirectories as source, builds cleanly, and exposes all 36 entry points (9 barrels + 27 granular) through a `package.json` `exports` map with types + import conditions. This is the load-bearing foundation — nothing downstream can migrate until `@napplet/nub/<domain>` paths are real and resolvable from inside the monorepo.
**Depends on**: Nothing (first phase of milestone)
**Requirements**: PKG-01, PKG-02, PKG-03, EXP-01, EXP-02, EXP-03, EXP-04, BUILD-01, BUILD-02
**Success Criteria** (what must be TRUE):
  1. `packages/nub/` exists with a 9-subdirectory source tree (one per domain: relay, storage, ifc, keys, theme, media, notify, identity, config), each containing the re-homed types + shim + sdk source
  2. `packages/nub/package.json` declares `@napplet/core` as its sole runtime dep, keeps `json-schema-to-ts` as an optional peerDep (config domain `FromSchema`), and sets `sideEffects: false`
  3. `packages/nub/package.json` `exports` field maps all 36 entry points — 9 `./` + `<domain>` barrels plus 27 `./<domain>/{types,shim,sdk}` granular paths — each with `types` and `import` conditions
  4. There is no root `.` export — a consumer writing `import ... from '@napplet/nub'` fails to resolve, forcing domain-specific subpath imports
  5. `pnpm --filter @napplet/nub build` exits 0 and emits one ESM `.js` + co-located `.d.ts` per entry point; `pnpm --filter @napplet/nub type-check` exits 0
**Plans:** 3/3 plans complete
  - [x] 117-01-PLAN.md — Scaffold packages/nub/ with package.json (36-entry exports map, no root export), tsconfig, tsup.config.ts (36 entry keys), and empty src/
  - [x] 117-02-PLAN.md — Copy all 9 NUB domains' source trees verbatim into packages/nub/src/<domain>/{index,types,shim,sdk}.ts (36 files total)
  - [x] 117-03-PLAN.md — Build @napplet/nub, type-check, verify every exports entry resolves + root @napplet/nub fails to resolve (EXP-04 runtime enforcement)

### Phase 118: Deprecation Re-Export Shims
**Goal**: Every one of the 9 existing `@napplet/nub-<domain>` packages is converted into a 1-line re-export shim that forwards to `@napplet/nub/<domain>`, is marked `@deprecated` in its `package.json`, and carries a top-of-README banner pointing at the new import path and stating the removal milestone. Pinned consumers of the old package names continue to work with zero behavioral change; existing imports do not need to be touched to keep building.
**Depends on**: Phase 117
**Requirements**: MIG-01, MIG-02, MIG-03
**Success Criteria** (what must be TRUE):
  1. Each of the 9 `packages/nubs/<domain>/src/index.ts` files is reduced to a single `export * from '@napplet/nub/<domain>';` (or equivalent barrel re-export) — zero domain-specific logic remains in the deprecated packages
  2. Every deprecated package's `package.json` description begins with `[DEPRECATED]` (or equivalent) so `@deprecated` surfaces in registry UIs and editor tooltips
  3. Every deprecated package's README starts with a deprecation banner naming `@napplet/nub/<domain>` as the replacement path and identifying the planned removal milestone
  4. Building any one of the 9 deprecated packages resolves the re-export through the new `@napplet/nub` package and emits a `.d.ts` that type-identically forwards the domain's types + shim + sdk exports
**Plans:** 3/3 plans complete
  - [x] 118-01-PLAN.md — Reduce 9 src/index.ts to re-export shims; delete redundant source files; add deprecation banner to all 9 READMEs
  - [x] 118-02-PLAN.md — Rewrite 9 package.json (DEPRECATED prefix + @napplet/nub dep); stage 0.3.0 minor bump via changeset
  - [x] 118-03-PLAN.md — Run pnpm -r build + type-check; verify export-shape parity between deprecated packages and @napplet/nub canonical barrels

### Phase 119: Internal Consumer Migration
**Goal**: Every internal consumer inside this monorepo — `@napplet/shim`, `@napplet/sdk`, and any demo/test code — imports from the new `@napplet/nub/<domain>` paths instead of the deprecated `@napplet/nub-<domain>` package names. The shim uses `/shim` granular subpaths; the SDK uses domain barrels to preserve its `export * as <domain>` pattern. After this phase, no first-party code depends on the deprecated package names (those names exist solely for external pinned consumers).
**Depends on**: Phase 117, Phase 118
**Requirements**: CONS-01, CONS-02, CONS-03
**Success Criteria** (what must be TRUE):
  1. `@napplet/shim` source imports installers from `@napplet/nub/<domain>/shim` for every NUB domain it mounts; there are zero `@napplet/nub-<domain>` imports remaining anywhere in `packages/shim/`
  2. `@napplet/sdk` source imports from `@napplet/nub/<domain>` barrels for every domain it re-exports, and its public `export * as <domain>` pattern remains byte-identical as seen by consumers
  3. `grep -r "@napplet/nub-" packages/` returns only matches inside `packages/nubs/<domain>/` (the deprecated shim packages themselves) — no first-party code outside those directories references the deprecated names
  4. `pnpm build` across the full monorepo completes 0 errors with only the new-path imports in first-party code
**Plans:** 2/2 plans complete
  - [x] 119-01-PLAN.md — Migrate source imports + JSDoc in packages/shim/src/index.ts (/shim granular subpaths + /ifc/types for IfcEventMessage) and packages/sdk/src/index.ts (/<domain> barrels); package.json left untouched so Phase 118 deprecation shims keep builds green mid-migration
  - [x] 119-02-PLAN.md — Rewrite packages/shim/package.json + packages/sdk/package.json deps to {@napplet/core, @napplet/nub}; refresh pnpm-lock.yaml; prove pnpm -r build + pnpm -r type-check exit 0 monorepo-wide + inspect emitted dist for correct @napplet/nub/* refs

### Phase 120: Documentation Update
**Goal**: All human-facing documentation — the new `@napplet/nub` README, the four updated package READMEs, the NIP-5D example blocks, and the `skills/` directory — references the stable `@napplet/nub/<domain>` subpath pattern. Documentation runs late so every example can name the final, real, resolvable import path rather than a transient one.
**Depends on**: Phase 117, Phase 119
**Requirements**: DOC-01, DOC-02, DOC-03, DOC-04
**Success Criteria** (what must be TRUE):
  1. `packages/nub/README.md` exists and documents install, the 9-domain layout, the barrel-vs-granular subpath pattern, and the tree-shaking contract (`sideEffects: false` + per-domain isolation)
  2. Root README plus `@napplet/core`, `@napplet/shim`, and `@napplet/sdk` READMEs reference `@napplet/nub/<domain>` in every NUB-related example; no remaining `@napplet/nub-<domain>` references except where explicitly calling out deprecation
  3. NIP-5D (wherever it shows example imports for NUB domains) uses `@napplet/nub/<domain>` paths
  4. Every file under `skills/` that contains a NUB-related example import uses `@napplet/nub/<domain>` paths
**Plans:** 3 plans
  - [ ] 120-01-PLAN.md — Create packages/nub/README.md with install + 9-domain table + subpath patterns + tree-shaking contract + theme exception + migration table + optional peer dep + protocol reference + license (DOC-01)
  - [ ] 120-02-PLAN.md — Update root README.md (table + dep graph, remove defunct nub-signer), packages/core/README.md line 353, packages/shim/README.md line 426, packages/sdk/README.md lines 178 + 296-303 (DOC-02)
  - [ ] 120-03-PLAN.md — Verify specs/NIP-5D.md + skills/build-napplet/SKILL.md (grep + file-content sanity) + phase-level cross-file grep gate (DOC-03, DOC-04)

### Phase 121: Verification & Sign-Off
**Goal**: The milestone's final gate — prove that the new package builds clean, the subpath tree-shaking contract holds in a real bundler, and the deprecated re-export shims still resolve and type-check for pinned consumers. This phase adds no new artifacts; it verifies the three truths that prior phases committed to.
**Depends on**: Phase 117, Phase 118, Phase 119, Phase 120
**Requirements**: VER-01, VER-02, VER-03
**Success Criteria** (what must be TRUE):
  1. `pnpm build` and `pnpm type-check` across the full monorepo (the new `@napplet/nub`, the 9 deprecated shim packages, and all unchanged packages) both exit 0
  2. A minimal isolated consumer that imports only `@napplet/nub/relay/types` produces a bundle whose output contains zero bytes originating from the other 8 domains' source files (verified by grep on the bundle output)
  3. For each of the 9 deprecated `@napplet/nub-<domain>` packages, a smoke test that does `import { /* any legacy symbol */ } from '@napplet/nub-<domain>'` both resolves and type-checks without error
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 117 → 118 → 119 → 120 → 121

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 117. @napplet/nub Package Foundation | 3/3 | Complete    | 2026-04-19 |
| 118. Deprecation Re-Export Shims | 3/3 | Complete    | 2026-04-19 |
| 119. Internal Consumer Migration | 2/2 | Complete    | 2026-04-19 |
| 120. Documentation Update | 0/3 | Not started | - |
| 121. Verification & Sign-Off | 0/TBD | Not started | - |
