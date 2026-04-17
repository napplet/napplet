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

### v0.25.0 Config NUB (In Progress)

**Milestone Goal:** Design and ship NUB-CONFIG — per-napplet declarative configuration. Napplet declares a JSON Schema; shell renders the settings UI, validates and persists values in a napplet-scoped config store, and delivers live values back to the napplet via snapshot + push.

- [x] **Phase 111: NUB-CONFIG Spec** - Draft NUB-CONFIG spec in the public nubs repo (PR #13) with Core Subset, MUSTs/SHOULDs/MAYs, anti-features, and wire surface (completed 2026-04-17)
- [x] **Phase 112: NUB Config Package Scaffold** - @napplet/nub-config types + tsup/tsconfig/package.json + barrel export (completed 2026-04-17)
- [x] **Phase 113: NUB Config Shim + SDK** - Shim installer with subscriber fan-out and manifest-meta schema read; SDK convenience wrappers (completed 2026-04-17)
- [x] **Phase 114: Vite-Plugin Extension** - configSchema option, convention-file/napplet.config.ts discovery, manifest tag injection, aggregateHash participation, meta-tag injection, build-time guards (completed 2026-04-17)
- [ ] **Phase 115: Core / Shim / SDK Integration + Wire** - 'config' in NubDomain, NappletGlobal.config namespace, shim mount, SDK re-exports, capability probing, wire surface tests
- [ ] **Phase 116: Documentation** - nub-config README, NIP-5D Known NUBs row, core/shim/SDK/vite-plugin README updates

## Phase Details

### Phase 111: NUB-CONFIG Spec
**Goal**: A public NUB-CONFIG specification exists in the napplet/nubs repo defining the JSON-Schema-driven configuration wire contract, MUST/SHOULD/MAY guarantees, anti-features, and error envelopes — with zero references to private packages.
**Depends on**: Nothing (first phase of v0.25.0 — spec must be locked before implementation)
**Requirements**: SPEC-01, SPEC-02, SPEC-03, SPEC-04, SPEC-05, SPEC-06, SPEC-07, SPEC-08
**Success Criteria** (what must be TRUE):
  1. A `NUB-CONFIG.md` spec document exists in the napplet/nubs PUBLIC repo following the structure of existing NUB specs (NUB-IDENTITY, NUB-NOTIFY, NUB-MEDIA); spec contains zero `@napplet/*` references.
  2. Core Subset is enumerated: supported JSON Schema types, keywords, constraints, and `x-napplet-*` extensions are listed; `$version` is specified as a potentiality; `pattern` is explicitly excluded from v1 Core Subset with ReDoS rationale (CVE-2025-69873).
  3. Shell MUST / SHOULD / MAY tables are enumerated: MUST (validate before delivery, apply defaults, scope storage by `(dTag, aggregateHash)`, be sole writer, mask `x-napplet-secret` Tier 0); SHOULD (section grouping, ordering, deprecation, markdownDescription); MAY (Tier 2+ secrets, richer formats, nested objects, NUB-STORAGE backing).
  4. Anti-features section explicitly rejects: `config.set` wire message, `$ref`/`definitions`, `pattern` in Core Subset, napplet-rendered settings iframe, napplet-supplied validation code.
  5. Six wire messages (`config.registerSchema`, `config.get`, `config.subscribe`, `config.unsubscribe`, `config.values`, `config.openSettings`) are specified with direction, payload shape, and correlation semantics; error envelopes catalogue malformed-schema, undeclared-section, and subscribe-before-schema cases.
  6. A PR is opened against napplet/nubs as issue/PR #13 following the pattern of NUB-IDENTITY (#12), NUB-NOTIFY (#11), NUB-MEDIA (#10).
**Plans:** 4/4 plans complete
- [x] 111-01-PLAN.md — Branch setup + NUB-CONFIG.md scaffold (header, description, API surface, wire protocol)
- [x] 111-02-PLAN.md — Schema Contract section (Core Subset, extensions, $version, pattern exclusion with CVE-2025-69873)
- [x] 111-03-PLAN.md — Shell Guarantees (MUST/SHOULD/MAY) + Anti-Features + Security Considerations + Error Envelopes
- [x] 111-04-PLAN.md — Registry update + final @napplet/ audit + PR handoff checkpoint

### Phase 112: NUB Config Package Scaffold
**Goal**: The `@napplet/nub-config` package exists with typed message interfaces, schema/values type aliases, discriminated unions, `DOMAIN` constant, and a barrel export — matching the `@napplet/nub-identity` template exactly.
**Depends on**: Phase 111 (types derive from the spec)
**Requirements**: NUB-01, NUB-02, NUB-05, NUB-06
**Success Criteria** (what must be TRUE):
  1. `packages/nubs/config/` directory exists with `package.json`, `tsconfig.json`, `tsup.config.ts` matching the `@napplet/nub-identity` template (ESM-only, dts + sourcemap, `@napplet/core` workspace dep).
  2. `src/types.ts` defines message interfaces for all six wire messages (`ConfigRegisterSchemaMessage`, `ConfigGetMessage`, `ConfigSubscribeMessage`, `ConfigUnsubscribeMessage`, `ConfigValuesMessage`, `ConfigOpenSettingsMessage`), plus `NappletConfigSchema`/`ConfigValues` type aliases and potentiality types for the `x-napplet-*` extensions.
  3. `src/index.ts` barrel re-exports all type definitions and the `DOMAIN` constant (`'config' as const`).
  4. `@types/json-schema@^7.0.15` is declared as devDependency (for JSON Schema type alias only); `json-schema-to-ts@^3.1.1` is declared as optional peerDependency for opt-in `FromSchema<typeof schema>` inference; no runtime dependencies beyond `@napplet/core`.
  5. `pnpm --filter @napplet/nub-config build && pnpm --filter @napplet/nub-config type-check` passes clean.
**Plans:** 2/2 plans complete
- [x] 112-01-PLAN.md — Scaffold packages/nubs/config/ directory + package.json (with JSON Schema deps) + tsconfig + tsup.config + stub barrel (completed 2026-04-17)
- [x] 112-02-PLAN.md — Write src/types.ts (all 8 wire messages + schema/values/extension types + DOMAIN) + full barrel + build/type-check gate

### Phase 113: NUB Config Shim + SDK
**Goal**: The `@napplet/nub-config` package exports `shim.ts` (installer + message handlers + subscriber ref-counting + manifest-meta schema read) and `sdk.ts` (named convenience wrappers), completing the modular NUB pattern.
**Depends on**: Phase 112 (shim + SDK import the types)
**Requirements**: NUB-03, NUB-04
**Success Criteria** (what must be TRUE):
  1. `src/shim.ts` exports `installConfigShim()` which mounts `window.napplet.config` with `registerSchema`, `get`, `subscribe`, `unsubscribe`, `openSettings`, `onSchemaError`, and a readonly `schema` accessor.
  2. The shim reads a `<meta name="napplet-config-schema">` tag at install time (if present) to populate the local schema cache synchronously, and maintains a ref-counted subscriber `Set` that sends `config.subscribe` only on first subscriber and `config.unsubscribe` only on last detach.
  3. `src/sdk.ts` exports named convenience wrappers — `get()`, `subscribe(cb)`, `openSettings({ section? })`, `registerSchema(schema, version?)`, `onSchemaError(cb)` — each delegating to `window.napplet.config` via the shared `requireNapplet()` pattern.
  4. `src/index.ts` barrel re-exports the shim installer, SDK helpers, types, and `DOMAIN` constant so consumers can cherry-pick (`import { installConfigShim } from '@napplet/nub-config'`).
  5. `pnpm --filter @napplet/nub-config build && pnpm --filter @napplet/nub-config type-check` passes clean.
**Plans:** 2/2 plans complete
- [x] 113-01-PLAN.md — Implement src/shim.ts (installConfigShim + handleConfigMessage + ref-counted subscribers + manifest-meta schema read + correlation-ID tracking for get/registerSchema + onSchemaError fan-out)
- [x] 113-02-PLAN.md — Write src/sdk.ts (5 bare-name wrappers + requireNapplet guard) + expand src/index.ts barrel + package build/type-check + monorepo type-check gate

### Phase 114: Vite-Plugin Extension
**Goal**: `@napplet/vite-plugin` accepts a `configSchema` option (with convention-file and `napplet.config.ts` discovery fallbacks), embeds the schema into the kind 35128 NIP-5A manifest as a `['config', …]` tag, includes the schema bytes in `aggregateHash` via a synthetic path prefix, injects a `<meta name="napplet-config-schema">` tag into `index.html`, and rejects malformed schemas at build time.
**Depends on**: Phase 111 (schema shape) and Phase 112 (type alias)
**Requirements**: VITE-01, VITE-02, VITE-03, VITE-04, VITE-05, VITE-06, VITE-07
**Success Criteria** (what must be TRUE):
  1. `Nip5aManifestOptions.configSchema?: JSONSchema7 | string` accepts an inline schema object or a file-path string; convention-file discovery reads `config.schema.json` at the project root when the option is absent; `napplet.config.ts`/`.js` exporting a `configSchema` is discovered when neither the option nor the convention file is present.
  2. The generated NIP-5A manifest (kind 35128 event) carries a single `['config', JSON.stringify(schema)]` tag; schema bytes participate in `aggregateHash` via a synthetic `config:schema` path prefix line so any schema change bumps the hash.
  3. The vite-plugin writes `<meta name="napplet-config-schema" content="{escaped JSON}">` into the built `index.html` head so shim-side schema read is synchronous at napplet startup.
  4. Build-time structural guards fire: schema MUST be a root object with `type: "object"`; external `$ref` triggers build error; presence of `pattern` triggers build error; `x-napplet-secret: true` combined with `default: ...` triggers build error.
  5. `pnpm --filter @napplet/vite-plugin build && pnpm --filter @napplet/vite-plugin type-check` passes clean; a fixture napplet with inline `configSchema` produces a manifest whose `['config', …]` tag round-trips through `JSON.parse` to the original schema.
**Plans:** 3/3 plans complete
- [x] 114-01-PLAN.md — configSchema option + 3-path discovery (inline / config.schema.json / napplet.config.*) + configResolved hook (VITE-01..03)
- [x] 114-02-PLAN.md — validateConfigSchema structural guard (root-type, pattern, external $ref, secret-with-default) + configResolved integration (VITE-07)
- [x] 114-03-PLAN.md — manifest [config, ...] tag + config:schema synthetic aggregateHash path + <meta name=napplet-config-schema> injection + monorepo type-check gate (VITE-04..06)

### Phase 115: Core / Shim / SDK Integration + Wire
**Goal**: `'config'` is a first-class NUB domain throughout the monorepo — registered in core, routed by shim, re-exported by SDK, probeable via `shell.supports()` — and the full wire surface round-trips cleanly.
**Depends on**: Phase 113 (package must export shim + SDK) and Phase 114 (for meta-tag integration at startup)
**Requirements**: WIRE-01, WIRE-02, WIRE-03, WIRE-04, WIRE-05, WIRE-06, CORE-01, CORE-02, SHIM-01, SDK-01, CAP-01
**Success Criteria** (what must be TRUE):
  1. `'config'` appears in the `NubDomain` union and `NUB_DOMAINS` readonly array in `packages/core/src/envelope.ts`; `NappletGlobal` in `packages/core/src/types.ts` declares a `config` namespace with `registerSchema()`, `get()`, `subscribe()`, `unsubscribe()`, `openSettings()`, `onSchemaError()`, and a readonly `schema` accessor (inline structural types — core does not import from `@napplet/nub-config`).
  2. `@napplet/shim` adds `@napplet/nub-config` as a workspace dep, imports `installConfigShim` + `handleConfigMessage`, mounts `window.napplet.config` at install time, and adds a `config.*` routing branch in the central envelope dispatcher.
  3. `@napplet/sdk` adds `@napplet/nub-config` as a workspace dep, re-exports `config` convenience wrappers, all nub-config message types, `CONFIG_DOMAIN`, and `installConfigShim` — so `import { config, CONFIG_DOMAIN } from '@napplet/sdk'` resolves.
  4. All six wire messages round-trip end-to-end in a test: `config.get` returns correlated `config.values`; `config.subscribe` triggers an immediate initial `config.values` push plus subsequent pushes on change; `config.unsubscribe` stops pushes; `config.openSettings({ section })` reaches the shell; `config.registerSchema` with malformed input surfaces `config.schemaError` on `onSchemaError` listeners.
  5. `shell.supports('config')` and `shell.supports('nub:config')` both resolve per the existing `NamespacedCapability` convention; `pnpm build && pnpm type-check` passes clean across all 13 packages.
**Plans:** 1 plan
- [ ] 115-01-PLAN.md — Add 'config' to NubDomain + NappletGlobal.config inline namespace + shim mount/routing + SDK re-exports + monorepo build gate

### Phase 116: Documentation
**Goal**: All repository documentation reflects the addition of NUB-CONFIG — package README, public NIP-5D Known NUBs reference, and four existing package READMEs (core, shim, SDK, vite-plugin).
**Depends on**: Phase 115 (final API shape locked)
**Requirements**: DOC-01, DOC-02, DOC-03, DOC-04, DOC-05, DOC-06
**Success Criteria** (what must be TRUE):
  1. `packages/nubs/config/README.md` documents package purpose, install, the `window.napplet.config` API surface, a minimal example schema, SDK usage, and (optional) `FromSchema` type inference via `json-schema-to-ts`.
  2. The NIP-5D "Known NUBs" table in the public napplet/nubs repo gains a `config` row referencing NUB-CONFIG by spec number only (no `@napplet/*` package references — public repo rule).
  3. `packages/core/README.md` lists `'config'` in the registered NubDomain table.
  4. `packages/shim/README.md` documents the `window.napplet.config` namespace.
  5. `packages/sdk/README.md` documents the `config` SDK exports and the `FromSchema` type-inference pattern.
  6. `packages/vite-plugin/README.md` documents the `configSchema` option, the `config.schema.json` convention-file path, and the `napplet.config.ts` export path.
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 111 → 112 → 113 → 114 (can parallel 113) → 115 → 116

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 111. NUB-CONFIG Spec | 4/4 | Complete    | 2026-04-17 |
| 112. NUB Config Package Scaffold | 2/2 | Complete    | 2026-04-17 |
| 113. NUB Config Shim + SDK | 2/2 | Complete    | 2026-04-17 |
| 114. Vite-Plugin Extension | 3/3 | Complete    | 2026-04-17 |
| 115. Core / Shim / SDK Integration + Wire | 0/1 | In progress | - |
| 116. Documentation | 0/0 | Not started | - |
