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
- ✅ **v0.28.0 Browser-Enforced Resource Isolation** — Phases 125-134 (shipped 2026-04-21) — [Archive](milestones/v0.28.0-ROADMAP.md)
- ⏳ **v0.29.0 NUB-CONNECT + Shell as CSP Authority** — Phases 135-142 (active)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Note: Phase 45 (IPC terminology cleanup) was completed as a quick task during v0.8.0 and is not part of the v0.9.0 roadmap.

### v0.29.0 NUB-CONNECT + Shell as CSP Authority (Phases 135-142) — ACTIVE

- [ ] **Phase 135: Cross-Repo Spec Work** - Draft NUB-CONNECT spec + NUBs-track class advisory in napplet/nubs public repo; amend in-repo NIP-5D to delegate class taxonomy
- [ ] **Phase 136: Core Type Surface** - Add `'connect'` to `NubDomain` + `NUB_DOMAINS`; add `connect` namespace to `NappletGlobal`; deprecate `perm:strict-csp` in JSDoc
- [ ] **Phase 137: `@napplet/nub/connect` Subpath Scaffold** - Create 4-file subpath (`types`/`shim`/`sdk`/`index`) with shared `normalizeConnectOrigin()`; add 4 subpath exports; prove tree-shake contract
- [ ] **Phase 138: `@napplet/vite-plugin` Surgery** - Drop production strictCsp machinery; add `connect?: string[]` option with normalizer, aggregateHash fold, manifest tag emission; add fail-loud inline-script diagnostic
- [ ] **Phase 139: Central Shim + SDK Integration** - Wire `installConnectShim` into `@napplet/shim`; mount `window.napplet.connect` with graceful-degradation defaults; re-export connect SDK surface
- [ ] **Phase 140: `specs/SHELL-CONNECT-POLICY.md`** - Author shell-deployer checklist parallel to SHELL-RESOURCE-POLICY.md; per-serving-mode pitfalls; residual-meta-CSP scan requirement; consent-UX language floor
- [ ] **Phase 141: Documentation Sweep** - Update root README + 4 package READMEs + skills/build-napplet/SKILL.md for two-class posture and NUB-RESOURCE-first guidance
- [ ] **Phase 142: Verification & Milestone Close** - `pnpm -r build` + `type-check` green across 14 packages; tree-shake + integration + cross-repo-zero-grep gates; changeset authored; downstream demo tracking confirmed

## Phase Details

### Phase 135: Cross-Repo Spec Work

**Goal**: The NUB-CONNECT spec + NUBs-track class advisory exist as public drafts in napplet/nubs, and in-repo NIP-5D delegates napplet-class taxonomy to the NUBs track

**Depends on**: Nothing (independent spec lane, can run in parallel with Phases 136/137/138)

**Requirements**: SPEC-01, SPEC-02, SPEC-03, SPEC-04, SPEC-05, NIP5D-01, NIP5D-02

**Success Criteria** (what must be TRUE):
1. `NUB-CONNECT.md` draft exists in a branch of napplet/nubs covering manifest tag shape, origin format rules, consent flow, runtime API, capability advertisement, grant lifecycle, security considerations, Class-1/Class-2 taxonomy, and test vectors
2. NUB-CONNECT draft includes a normative canonical aggregateHash fold procedure (lowercase → ASCII sort → `\n`-join → UTF-8 → SHA-256 → lowercase hex) with at least one copy-pasteable conformance fixture
3. A NUBs-track advisory document exists in napplet/nubs explaining how NUBs define napplet classes on top of existing NUB specs (Class 1 = no opt-in, Class 2 = `connect` tags trigger consent)
4. `grep -r -E '@napplet/|kehto|hyprgate' <napplet/nubs draft branch>` returns zero matches across the NUB-CONNECT draft and advisory document
5. `specs/NIP-5D.md` "Browser-Enforced Resource Isolation" subsection is softened to a forward-pointer at NUB-CONNECT; NIP-5D contains no class enumeration or CSP-emission implementation detail

**Plans**: TBD

### Phase 136: Core Type Surface

**Goal**: `@napplet/core` exposes the `connect` domain identifier and the `NappletConnect` shape so downstream packages can compile against the new type surface

**Depends on**: Nothing (minor touch; optionally sequenced after Phase 135 so spec field names are locked in)

**Requirements**: CORE-01, CORE-02, CORE-03

**Success Criteria** (what must be TRUE):
1. `packages/core/src/envelope.ts` exports `NubDomain` with `'connect'` in the union and `NUB_DOMAINS` containing 11 entries
2. `packages/core/src/types.ts` `NappletGlobal` interface has a `connect: NappletConnect` field, structurally mirroring the `resource:` block
3. `perm:strict-csp` is annotated `@deprecated` in JSDoc on `NamespacedCapability` with a pointer to `nub:connect`
4. `pnpm --filter @napplet/core build` and `pnpm --filter @napplet/core type-check` exit 0 against the updated type surface

**Plans**: TBD

### Phase 137: `@napplet/nub/connect` Subpath Scaffold

**Goal**: The `@napplet/nub/connect` subpath exists with types, shim installer, SDK helpers, and barrel — fully tree-shakable and ready for central shim/SDK integration

**Depends on**: Phase 136 (core `NubDomain` + `NappletGlobal.connect` must exist so the types/shim compile)

**Requirements**: NUB-01, NUB-02, NUB-03, NUB-04, NUB-05, NUB-06, NUB-07

**Success Criteria** (what must be TRUE):
1. Files `packages/nub/src/connect/{types,shim,sdk,index}.ts` exist; `types.ts` exports `DOMAIN = 'connect'`, `NappletConnect` interface, and the shared pure `normalizeConnectOrigin(origin: string): string` function
2. `shim.ts` exports `installConnectShim()` that reads `<meta name="napplet-connect-granted">`, parses whitespace-separated origins, and populates `window.napplet.connect` with readonly state (default `{granted: false, origins: []}` when meta absent)
3. `packages/nub/package.json` has four new subpath exports (`./connect`, `./connect/types`, `./connect/shim`, `./connect/sdk`) and `packages/nub/tsup.config.ts` has four matching entry points
4. `pnpm --filter @napplet/nub build` + `type-check` exit 0 and emit all four dist entry points
5. Tree-shake smoke: a consumer that imports only `@napplet/nub/connect/types` via `import type` produces a bundle with zero `installConnectShim` and zero `registerNub` emissions (matches v0.26.0 theme-NUB precedent)

**Plans**: TBD

### Phase 138: `@napplet/vite-plugin` Surgery

**Goal**: The vite-plugin stops emitting production strict CSP and starts emitting `connect` manifest tags, folding origins into aggregateHash, and failing loud on inline scripts

**Depends on**: Phase 136 (core types) and Phase 137 (shared `normalizeConnectOrigin()` import). Parallel-safe with Phase 139.

**Requirements**: VITE-01, VITE-02, VITE-03, VITE-04, VITE-05, VITE-06, VITE-07, VITE-08, VITE-09, VITE-10

**Success Criteria** (what must be TRUE):
1. Production builds no longer emit a `<meta http-equiv="Content-Security-Policy">` — `grep "Content-Security-Policy" dist/index.html` returns zero matches on a v0.29.0-built fixture (strictCsp machinery removed or dev-gated)
2. `Nip5aManifestOptions` accepts `connect?: string[]`; origin normalization throws with `[nip5a-manifest]` prefix on uppercase host, wildcard, path, query, fragment, default port, or non-Punycode IDN — backed by table-driven tests
3. Manifest emitted at `dist/.nip5a-manifest.json` contains one `['connect', origin]` tag per normalized origin, placed between `manifestXTags` and `configTags`; aggregateHash computation includes a synthetic `[hash, 'connect:origins']` xTag that is filtered out of the `['x', …]` projection
4. Synthetic xTag filter is driven by a shared `SYNTHETIC_XTAG_PATHS` constant (or equivalent) so both `config:schema` and `connect:origins` are excluded without duplicate string-literal filters
5. `closeBundle` fails the build when `dist/index.html` contains any `<script>` element without a `src` attribute, with a diagnostic referencing the shell-CSP `script-src 'self'` reason
6. Declaring an `http:` or `ws:` origin in `connect` emits an informational build-log warning explaining browser mixed-content rules; optional dev-mode-only `<meta name="napplet-connect-requires">` injection is distinct from the shell-authoritative `napplet-connect-granted` name

**Plans**: TBD

### Phase 139: Central Shim + SDK Integration

**Goal**: `window.napplet.connect` is present on every shim-installed napplet with the correct default (`{granted: false, origins: []}`) on pre-v0.29 shells, and `@napplet/sdk` re-exports the connect surface

**Depends on**: Phase 137 (`@napplet/nub/connect` subpath must export `installConnectShim` and types). Parallel-safe with Phase 138.

**Requirements**: SHIM-01, SHIM-02, SDK-01

**Success Criteria** (what must be TRUE):
1. `packages/shim/src/index.ts` imports `installConnectShim` from `@napplet/nub/connect/shim`, calls it at bootstrap, and declares a `connect: { granted, origins }` block on the `window.napplet` literal with no new central-dispatch router entry
2. On a mock shell advertising `shell.supports('nub:connect') === false` and injecting no grant meta, `window.napplet.connect` resolves to `{granted: false, origins: []}` — never `undefined` (verified by a shim smoke test)
3. `packages/sdk/src/index.ts` re-exports the connect SDK surface parallel to `resource`: types from `@napplet/nub/connect`, `DOMAIN as CONNECT_DOMAIN`, and `installConnectShim`
4. `pnpm --filter @napplet/shim build` and `pnpm --filter @napplet/sdk build` exit 0; `type-check` green across both

**Plans**: TBD

### Phase 140: `specs/SHELL-CONNECT-POLICY.md`

**Goal**: A non-normative shell-deployer checklist exists that covers every shell-side precondition, anti-pattern, and required UX surface for shipping NUB-CONNECT

**Depends on**: Phase 135 (spec prose establishes the normative language this document maps to deployer actions). Parallel-safe with Phases 136-139.

**Requirements**: POLICY-01, POLICY-02, POLICY-03, POLICY-04, POLICY-05, POLICY-06, POLICY-07, POLICY-08, POLICY-09, POLICY-10

**Success Criteria** (what must be TRUE):
1. `specs/SHELL-CONNECT-POLICY.md` exists, is structured in parallel to `specs/SHELL-RESOURCE-POLICY.md` (Status → Why-this-exists → per-policy sections → Audit checklist → References), and labels itself non-normative with citation pointer to NUB-CONNECT in napplet/nubs
2. Document contains dedicated sections for: HTTP-responder precondition (with per-delivery-mode pitfalls for direct / proxy / `blob:` / `srcdoc`), residual meta-CSP scan (parser-based example + 5-fixture conformance bundle), mixed-content reality check, cleartext policy + `connect:scheme:http` advertisement, grant-persistence composite key `(dTag, aggregateHash)`, revocation UI requirement with DENIED-not-deleted semantics, consent-prompt language (send AND receive + shell-blind), and explicit N/A items (private-IP block, MIME sniff, SVG raster caps, redirect limits)
3. `grep -E '@napplet/' specs/SHELL-CONNECT-POLICY.md` returns zero matches (this file is in the private SDK repo but must remain citation-safe for future use by the NUBs track)
4. Audit checklist at end of document enumerates every MUST item above as a bullet with a "tested" checkbox for deployer sign-off

**Plans**: TBD

**UI hint**: yes

### Phase 141: Documentation Sweep

**Goal**: Every user-facing doc reflects the two-class posture, the `connect` API surface, and the "default to NUB-RESOURCE" architectural guidance — without rewriting historical changelog bullets

**Depends on**: Phase 139 (central shim/SDK shape must be locked) and Phase 138 (vite-plugin option names finalized). Terminal doc phase.

**Requirements**: DOC-01, DOC-02, DOC-03, DOC-04, DOC-05, DOC-06, DOC-07

**Success Criteria** (what must be TRUE):
1. Root `README.md` documents the two-class posture, cites `window.napplet.connect`, and includes the "default to NUB-RESOURCE; reach for NUB-CONNECT only when resource NUB can't express what you need" guidance
2. `packages/nub/README.md` has a `connect` row in its NUB domain table; `packages/vite-plugin/README.md` has strict-CSP documentation removed and `connect` + inline-script-diagnostic documentation added; `packages/shim/README.md` documents the `window.napplet.connect` surface and its graceful-degradation defaults; `packages/sdk/README.md` documents the `connect` namespace, `CONNECT_DOMAIN` const, and `installConnectShim` export
3. `skills/build-napplet/SKILL.md` is updated for two classes, the connect API, "default to NUB-RESOURCE" guidance, and a cleartext / mixed-content warning
4. `git diff` on `.planning/PROJECT.md` shows the v0.28.0 "Shipped" bullet is byte-identical before and after this phase (historical changelog preservation per v0.27.0 precedent)

**Plans**: TBD

### Phase 142: Verification & Milestone Close

**Goal**: Every v0.29.0 REQ is observably satisfied; the monorepo is green across all 14 packages; cross-repo hygiene is clean; changeset + downstream-shell tracking items are landed

**Depends on**: Every prior phase (Phases 135-141). Terminal verification gate.

**Requirements**: VER-01, VER-02, VER-03, VER-04, VER-05, VER-06, VER-07, VER-08, VER-09, VER-10

**Success Criteria** (what must be TRUE):
1. `pnpm -r build` and `pnpm -r type-check` both exit 0 across all 14 workspace packages with the connect subpath present
2. Tree-shake harness (extending v0.26.0 VER-03 / v0.28.0 VER-01) includes a "types-only connect consumer" case; asserted bundle output contains zero `installConnectShim` and zero `registerNub` emissions
3. Playwright smokes pass for both grant states: approved → `fetch(granted-url)` succeeds and `fetch(other-url)` emits `securitypolicyviolation`; denied → emitted CSP header has `connect-src 'none'` and `window.napplet.connect.granted === false`
4. Integration tests pass for aggregateHash content-addressing: `connect` origin list changed with dist files unchanged → aggregateHash flips via the `connect:origins` fold → prior grant auto-invalidated; Class-2 napplet with residual meta CSP → shell refuses to serve with the prescribed diagnostic while Class-1 residual meta CSP is harmless
5. `grep -r -E '@napplet/|kehto|hyprgate|packages/(nub\|shim\|sdk\|vite-plugin)' <napplet/nubs draft branch>` returns zero matches across NUB-CONNECT + advisory drafts
6. A changeset exists calling out the v0.29.0 breaking change loudly (strictCsp production path removed/deprecated); downstream-shell-repo tracking issue for v0.29.0 demo napplets exists (Option B carried forward from v0.28.0)

**Plans**: TBD

---

## Summary Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 135. Cross-Repo Spec Work | 0/? | Not started | - |
| 136. Core Type Surface | 0/? | Not started | - |
| 137. `@napplet/nub/connect` Subpath Scaffold | 0/? | Not started | - |
| 138. `@napplet/vite-plugin` Surgery | 0/? | Not started | - |
| 139. Central Shim + SDK Integration | 0/? | Not started | - |
| 140. `specs/SHELL-CONNECT-POLICY.md` | 0/? | Not started | - |
| 141. Documentation Sweep | 0/? | Not started | - |
| 142. Verification & Milestone Close | 0/? | Not started | - |

---

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

<details>
<summary>v0.28.0 Browser-Enforced Resource Isolation (Phases 125-134) — SHIPPED 2026-04-21</summary>

- [x] **Phase 125: Core Type Surface** - Add `'resource'` to `NubDomain` + `NUB_DOMAINS`, add `resource` namespace to `NappletGlobal`, document `perm:strict-csp` (completed 2026-04-20)
- [x] **Phase 126: Resource NUB Scaffold + `data:` Scheme** - Create `packages/nub/src/resource/` triad, ship `data:` scheme decoded in-shim, single-flight cache, AbortSignal cancellation, blob URL lifecycle (completed 2026-04-20)
- [x] **Phase 127: NUB-RELAY Sidecar Amendment** - Optional `resources?: ResourceSidecarEntry[]` on `RelayEventMessage`; relay shim hydrates resource cache before `onEvent` (completed 2026-04-20)
- [x] **Phase 128: Central Shim Integration** - Wire resource NUB into `@napplet/shim`; mount `window.napplet.resource`; `nub:resource` and `resource:scheme:<name>` capability checks (completed 2026-04-20; closes DEF-125-01)
- [x] **Phase 129: Central SDK Integration** - Add `resource` namespace + `RESOURCE_DOMAIN` const + 11 type re-exports to `@napplet/sdk` (completed 2026-04-20)
- [x] **Phase 130: Vite-Plugin Strict CSP** - `strictCsp` option with first-`<head>`-child meta injection, header-only directive rejection, dev/prod split, nonce-based scripts, 10-directive baseline; ships `perm:strict-csp` (completed 2026-04-20)
- [x] **Phase 131: NIP-5D In-Repo Spec Amendment** - Browser-Enforced Resource Isolation subsection added to `specs/NIP-5D.md` (completed 2026-04-20)
- [x] **Phase 132: Cross-Repo Nubs PRs** - 4 draft specs at `.planning/phases/132/drafts/`: NUB-RESOURCE (new), NUB-RELAY sidecar with default-OFF privacy, NUB-IDENTITY/MEDIA clarifications; manual cross-repo PR opening deferred (completed 2026-04-20)
- [x] **Phase 133: Documentation + Demo Coordination** - 5 READMEs + skill + `specs/SHELL-RESOURCE-POLICY.md` + PROJECT.md/NUB-RESOURCE coordination notes delegating demos to downstream shell repo (completed 2026-04-20)
- [x] **Phase 134: Verification & Milestone Close** - All 7 VER gates green; NUB-RESOURCE.md spec/impl drift resolved (19 substitutions); milestone audit passed 65/65 (completed 2026-04-21)

</details>
