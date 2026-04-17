---
gsd_state_version: 1.0
milestone: v0.25.0
milestone_name: Config NUB
status: completed
stopped_at: "Completed 116-03-PLAN.md -- public nubs registry row verify + push handoff. DOC-02 satisfied. NUB-CONFIG row verified (cc88056, 6/6 greps pass). PR #13 open at napplet/nubs. Phase 116 complete -- all 15 plans across 6 phases complete. v0.25.0 Config NUB milestone complete."
last_updated: "2026-04-17T14:27:04.395Z"
last_activity: 2026-04-17
progress:
  total_phases: 6
  completed_phases: 6
  total_plans: 15
  completed_plans: 15
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-17)

**Core value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol -- and ship the spec + SDK so others can build on it.
**Current focus:** Phase 116 — Documentation

## Current Position

Phase: 116
Plan: Not started
Status: Complete — Phase 116 complete, all DOC-01..06 satisfied. v0.25.0 Config NUB milestone complete.
Last activity: 2026-04-17

Progress: [██████████] 100% (6/6 phases complete, 15/15 plans complete)

**Phase execution order:** 111 → 112 → 113 → 114 (can parallel 113) → 115 → 116

| # | Phase | Scope |
|---|-------|-------|
| 111 | NUB-CONFIG Spec | Public napplet/nubs#13 draft — SPEC-01..08 |
| 112 | NUB Config Package Scaffold | Types + tsup/tsconfig/package.json + barrel — NUB-01, NUB-02, NUB-05, NUB-06 |
| 113 | NUB Config Shim + SDK | Installer + ref-counted subscribers + SDK wrappers — NUB-03, NUB-04 |
| 114 | Vite-Plugin Extension | configSchema option, manifest tag, aggregateHash, meta injection, build guards — VITE-01..07 |
| 115 | Core / Shim / SDK Integration + Wire | NubDomain, NappletGlobal, routing, SDK re-exports, capability probing — WIRE-01..06, CORE-01..02, SHIM-01, SDK-01, CAP-01 |
| 116 | Documentation | nub-config README + NIP-5D Known NUBs + 4 package READMEs — DOC-01..06 |

## Performance Metrics

**Velocity:**

- Total plans completed: 6 (Phase 111: 4, Phase 112: 2)
- Average duration: ~3 min
- Total execution time: ~16.5 min

**By Phase:**

| Phase | Plans | Total   | Avg/Plan |
|-------|-------|---------|----------|
| 111   | 4     | 12min   | 3min     |
| 112   | 2/2   | 4.5min  | 2.25min  |
| Phase 113 P01 | 10min | 1 tasks | 1 files |
| Phase 113 P02 | 2min | 3 tasks | 2 files |
| Phase 114 P01 | 3min | 2 tasks | 4 files |
| Phase 114 P02 | 2min | 1 tasks | 1 files |
| Phase 114 P03 | 2min | 1 tasks | 1 files |
| Phase 115 P01 | 4m17s | 4 tasks | 6 files |
| Phase 116 P01 | 1m29s | 1 tasks | 1 files |
| Phase 116 P02 | 5m44s | 4 tasks | 4 files |

## Accumulated Context

| Phase 111 P01 | 4min   | 2 tasks | 1 files |
| Phase 111 P02 | 2 min  | 1 tasks | 1 files |
| Phase 111 P03 | 3min   | 2 tasks | 1 files |
| Phase 111 P04 | 3min   | 4 tasks | 2 files |
| Phase 112 P01 | 2min   | 2 tasks | 4 files |
| Phase 112 P02 | 2m29s  | 2 tasks | 2 files |

### Decisions

- v0.25.0: NUB-CONFIG is per-napplet schema-driven config (inverts the dropped v0.19.0 shell:config-* topics)
- v0.25.0: Schema format = JSON Schema (draft-07+)
- v0.25.0: Storage is separate from NUB-STORAGE at the spec surface; shells MAY back with NUB-STORAGE internally
- v0.25.0: Shell is sole writer; napplet reads/subscribes/requests-settings-open only
- v0.25.0: Value access pattern = subscribe-live (initial snapshot + push updates)
- v0.25.0: Schema declaration = manifest (authoritative, via vite-plugin) + runtime config.registerSchema (escape hatch)
- v0.25.0: `$version` field in schema is a potentiality; migration is shell-resolved
- v0.25.0: Standardized JSON Schema extensions as potentialities: `x-napplet-secret`, `x-napplet-section`, `x-napplet-order`
- v0.25.0: MUST-level guarantees: values validate, defaults apply, storage scoped by (dTag, aggregateHash), shell is sole writer
- v0.25.0: UI surface = shell-chrome owns; napplet may call `config.openSettings({ section? })` to deep-link
- v0.25.0: Phase 111 is drafted in the PUBLIC napplet/nubs repo — no `@napplet/*` references allowed in spec
- v0.25.0: Phases 112-116 are in this (private) repo, matching the v0.22/v0.23/v0.24 spec-first-then-SDK pattern exactly
- PRINCIPLE: NUBs define protocol surface + potentialities; implementation UX is a shell concern
- [Phase 111]: 111-01: Scaffolded NUB-CONFIG.md on public nubs repo nub-config branch — header, API surface (NappletConfig + ConfigSchema/ConfigValues/ConfigSchemaError/Subscription), wire protocol table (9 message types), 8 envelope examples. Zero @napplet/ refs. Single scaffold commit 29baaac.
- [Phase 111]: 111-02: Locked NUB-CONFIG Core Subset -- types/keywords/constraints, additionalProperties:false override, deterministic default-resolution rule, x-napplet-* extensions table, $version potentiality, pattern excluded citing CVE-2025-69873, $ref forbidden in all forms, depth limit 4, secret-with-default prohibition.
- [Phase 111]: Lowercased napplet-rendered/napplet-supplied in Anti-Features to match plan verification greps; prose reads naturally either way
- [Phase 111]: Retained unknown-section as non-normative error-code row; shells SHOULD silently ignore per Shell Guarantees, but code reserved for future telemetry paths
- [Phase 111]: PR number confirmed as #13 — matches roadmap sequential reservation (NUB-MEDIA #10, NUB-NOTIFY #11, NUB-IDENTITY #12). No README link amendment required.
- [Phase 111]: Human-gated push + PR pattern upheld: agent stopped at Task 3, presented verbatim instructions, awaited resume signal. Agent never autonomously ran git push or gh pr create.
- [Phase 112]: 112-01: Scaffolded `@napplet/nub-config` package (13th monorepo package, 9th NUB) mirroring `@napplet/nub-identity` template exactly — package.json + tsconfig.json + tsup.config.ts + stub src/index.ts. Declares `@napplet/core` as only runtime dep, `@types/json-schema@^7.0.15` as devDep, `json-schema-to-ts@^3.1.1` as optional peerDep (flagged `peerDependenciesMeta.optional: true`). Build + type-check green. Commits d2ea20a (chore) + cba9fdf (feat).
- [Phase 112]: `json-schema-to-ts` declared as optional peerDependency (not devDep) so authors who don't want `FromSchema<typeof schema>` inference skip the ~1.5MB transitive install; consumers omitting it get no pnpm warnings thanks to the `optional: true` meta flag.
- [Phase 112]: `DOMAIN = 'config' as const` temporarily lives in `src/index.ts` rather than `src/types.ts` — plan 02 moves it to types.ts alongside the full 6-message type surface to match the identity NUB pattern (`packages/nubs/identity/src/types.ts` line 19 convention).
- [Phase 112]: 112-02: Landed full @napplet/nub-config src/types.ts (321 LOC, 8 wire-message interfaces + 3 discriminated unions + ConfigSchemaErrorCode 8-literal union + NappletConfigSchemaExtensions potentiality + DOMAIN relocated to types.ts per identity convention) + full barrel (15 type symbols + DOMAIN). Build + type-check green, full monorepo type-check green (22/22). Commits 1c23853 (feat) + 149c735 (feat).
- [Phase 112]: 112-02: Followed merged NUB-CONFIG.md spec over ARCHITECTURE.md research draft — correlation field is `id` (not `requestId`). Research floated requestId; merged spec locked id to match nub-identity convention across NUBs.
- [Phase 112]: 112-02: ConfigSchemaErrorCode union omits `unknown-section` (8 literals, not 9). Spec explicitly marks unknown-section as non-normative and says shells MUST NOT surface it as a wire error, so no place in TS union.
- [Phase 113]: 113-01: Shipped packages/nubs/config/src/shim.ts (371 LOC). installConfigShim() idempotent; reads <meta name='napplet-config-schema'> synchronously at install; mounts window.napplet.config with registerSchema/get/subscribe/openSettings/onSchemaError + readonly schema accessor (defineProperty configurable:false). handleConfigMessage() routes config.registerSchema.result / config.values (dual-use) / config.schemaError. Ref-counted subscriber Set (wire subscribe on 0->1, unsubscribe on 1->0). Correlation-ID Maps for get + registerSchema (30s timeout). Late subscribers receive cached lastValues via queueMicrotask. Commit 5b8b96a. Type-check green.
- [Phase 113]: 113-01: registerSchema typed Promise<void> (not void) — plan must-haves override the spec's API sketch; positive-ACK wire behavior is spec-consistent. onSchemaError returns plain () => void teardown (not Subscription) — followed plan action step 8 explicit instruction. These two divergences flagged for harmonization in 113-02 SDK wrappers or phase 115 integration.
- [Phase 113]: 113-01: Pattern established — ref-counted wire subscription (local Set<cb>; emit wire subscribe on 0->1; unsubscribe on 1->0) + dual-use message router branch (lookupPending via id presence, else fan-out) + last-snapshot cache for late-subscriber microtask delivery. Template for future push-stream NUBs.
- [Phase 113]: 113-02: Shipped @napplet/nub-config sdk.ts (157 LOC, 5 bare-name wrappers: get/subscribe/openSettings/registerSchema/onSchemaError over shared requireNapplet() guard with local ConfigNamespace struct type) + expanded barrel (DOMAIN + 15 types preserved + installConfigShim/handleConfigMessage + 5 SDK wrappers). Side-effect-free (no registerNub). Commits 79692cd + d3e98eb. Package build + monorepo type-check (22/22) green. NUB-04 satisfied.
- [Phase 113]: 113-02: Bare names (get/subscribe/openSettings/registerSchema/onSchemaError) chosen per NUB-CONFIG spec + CONTEXT.md explicit instruction — precedent is nub-keys (bare: registerAction/onAction); nub-identity's prefix convention (identityGet*) deliberately not followed because config namespace will resolve collisions at @napplet/sdk aggregation tier in phase 115 via 'export * as config' pattern.
- [Phase 113]: 113-02: Local structural ConfigNamespace type in sdk.ts (not extending @napplet/core's NappletGlobal) — decouples @napplet/nub-config from phase-115's NappletGlobal.config extension. Lets NUB packages ship full shim+SDK surface before core is updated. Pattern to follow for future NUB packages.
- [Phase 113]: 113-02: Barrel is side-effect-free (no registerNub call) — deliberately diverges from nub-identity's index.ts pattern. Phase 115 wires config domain registration via explicit call from central @napplet/shim entry, preserving sideEffects:false in package.json for tree-shaking.
- [Phase 114]: 114-01: Landed Nip5aManifestOptions.configSchema?: JSONSchema7 | string on @napplet/vite-plugin + discoverConfigSchema helper with strict 4-step precedence (inline object -> inline path -> config.schema.json -> napplet.config.{ts,js,mjs}). Async configResolved populates resolvedSchema + resolvedSchemaSource closure vars as sole contract for 114-02/03. @types/json-schema@^7.0.15 added as devDep (matches nub-config pin). Build + monorepo type-check green. Commits 3a7d820 (chore) + 2d0c364 (feat).
- [Phase 114]: 114-01: JSONSchema7 imported directly from 'json-schema' module, NOT re-exported from @napplet/nub-config. vite-plugin is build-time infrastructure; nub-config is runtime. Keeping type relationship structural avoids circular layering; both packages pin @types/json-schema@^7.0.15 for identical type definitions.
- [Phase 114]: 114-01: napplet.config.* precedence fixed as ts -> js -> mjs. .ts branch present for forward compat (Node 22 --experimental-strip-types) but .js/.mjs is documented path today. No tsx/esbuild shell-out to keep zero runtime deps. mod.configSchema ?? mod.default?.configSchema dual shape supports both named-export and default-export authoring.
- [Phase 114]: 114-01: Discovery runs in async configResolved, not config / buildStart. configResolved(config).root is canonical project root, downstream transformIndexHtml / closeBundle fire after so resolvedSchema is guaranteed populated by the time 114-03 emission hooks read it. Pattern template: closure-variable hand-off between sibling plans within a phase.
- [Phase 114]: 114-02: Landed validateConfigSchema(schema) pure zero-dep recursive structural guard (~31 LOC + ~89 LOC walk helper) in @napplet/vite-plugin. Enforces 4 NUB-CONFIG Core Subset rules at build time with literal spec error codes (invalid-schema / pattern-not-allowed / ref-not-allowed / secret-with-default). Walk recurses into properties/items/additionalProperties/patternProperties/oneOf/anyOf/allOf/not/definitions/$defs and threads a dot-joined path for locatable error messages. configResolved throws a multi-line Error on ok:false BEFORE transformIndexHtml/closeBundle run, aborting the Vite build. Backward compat preserved: null schema skips validation. Commit 3789578.
- [Phase 114]: 114-02: Error codes embedded as string PREFIXES (e.g. 'pattern-not-allowed: <detail at $.properties.foo>') not structured objects -- machine-greppable spec codes + human context in single strings, keeps validator return type minimal (errors: string[]) for direct .join() at configResolved integration site.
- [Phase 114]: 114-02: walk() recurses into spec-EXCLUDED features (oneOf/anyOf/allOf/not/definitions/$defs) too -- layered defense. Build-time guard enforces narrow 4-rule surface WIDE across every sub-tree; shell-side Core Subset enforcer at config.registerSchema time rejects the combinators outright. Two guards, different granularities, matching error vocabulary.
- [Phase 114]: 114-02: Root-shape failure short-circuits the walk -- a schema whose root is not { type: 'object', ... } returns immediately with one invalid-schema error. Prevents spurious walks through malformed sub-trees; keeps error surface predictable (1 rejection for shape-wrong, up to 3+ for contents-wrong).
- [Phase 114]: 114-02: validateConfigSchema intentionally NOT exported -- tsup drops it from dist/index.d.ts. Public API surface unchanged from 114-01 (just nip5aManifest + Nip5aManifestOptions). The contract exposed to plan 114-03 is BEHAVIORAL (configResolved either throws or leaves a structurally-valid resolvedSchema in closure), not a named function. Preserves 114-01's closure-variable hand-off pattern.
- [Phase 114]: 114-03: Shipped dual-surface schema emission on @napplet/vite-plugin — ['config', JSON.stringify(schema)] tag on kind 35128 manifest (positioned d→x*→config→requires*), synthetic ['<sha256>','config:schema'] entry in xTags filtered out of ['x',...] projection so only real files surface as x-tags, and napplet-config-schema meta injected into built index.html head via transformIndexHtml. All three emissions null-guarded so no-schema napplets produce byte-identical manifest+HTML to pre-phase-114. Commit 5ff90f2.
- [Phase 114]: 114-03: Chose Option A (filter-then-map xTags before x-tag projection) over Option B (side-variable schema hash + modified hasher signature). Option A keeps computeAggregateHash contract intact as pure Array<[hash,path]>→string fn; no helper changes; adds a one-line filter. Option B would have broken the hasher signature and duplicated sort-concat logic inline.
- [Phase 114]: 114-03: Pattern — synthetic-path aggregateHash contribution. Virtual path 'config:schema' (colon is not a legal OS-relative path separator, so no collision risk with real dist/ files) pushed into xTags with the content hash; filtered out of the ['x',...] manifest tag projection. Template reusable for any future build-time input that SHOULD influence aggregateHash but isn't a physical file (e.g., NUB version pins, runtime environment markers, manifest-tag-set signatures).
- [Phase 114]: 114-03: Pattern — null-guarded-emission triad. Single closure-var 'resolvedSchema' checked at three independent emission sites (meta tag, synthetic xTags entry, manifest config tag). Three 'if (resolvedSchema !== null)' guards, one backward-compat invariant. Chosen over a single early-exit flag because the three emission points are structurally independent (transformIndexHtml and closeBundle are separate hooks that may fire in isolation during partial builds / dev cycles).
- [Phase 114]: 114-03: Meta tag content is raw JSON.stringify output — Vite's IndexHtmlTransformResult HtmlTagDescriptor pipeline HTML-escapes attribute values at render time. Pre-escaping would double-escape on render and break the shim's JSON.parse(getAttribute('content')). Verified via smoke: payload with literal < > & and nested " chars round-tripped intact through the descriptor layer.
- [Phase 114]: Phase 114 COMPLETE — VITE-01..07 satisfied. 114-01 (3 requirements), 114-02 (1 requirement), 114-03 (3 requirements). Three waves, three commits, three summaries. @napplet/vite-plugin now accepts configSchema option, discovers schemas via 3-path precedence (inline / config.schema.json / napplet.config.*), structurally validates against 4 Core Subset rules at configResolved (build abort on fail), emits config manifest tag + config:schema aggregateHash contribution + napplet-config-schema meta injection. All DTS-surface additions cleanly: configSchema?: JSONSchema7 | string on Nip5aManifestOptions. Phase 115 (core/shim/SDK integration + wire) next.
- [Phase 115]: 115-01: Landed @napplet/nub-config integration across core/shim/sdk. Added 'config' as 9th NubDomain + NUB_DOMAINS entry (envelope.ts), NappletGlobal.config inline namespace with 5 methods + readonly schema accessor using Record<string, unknown> to keep @napplet/core decoupled from @napplet/nub-config (types.ts). Shim imports installConfigShim + handleConfigMessage + 5 aliases, adds bare-prefix config.* routing branch (not .result-suffix like identity — config.values and config.schemaError are non-.result pushes), populates config:{...schema:null} in window.napplet literal, calls installConfigShim() at end to overwrite with shim-managed api (Object.defineProperty schema getter). SDK adds explicit config namespace wrapper (matches identity/media/notify precedent — not export * as config), 17 Config NUB type re-exports, CONFIG_DOMAIN + installConfigShim. Full monorepo pnpm build + type-check exit 0 (13/13 packages). CAP-01 verified via standalone type-check — nub:unknown rejected, config / nub:config / perm:* accepted. 4 atomic commits (1e1489a, 9688a6b, 26d8d2f, de89150).
- [Phase 115]: 115-01: Pattern established — placeholder-then-overwrite for window.napplet installer-owned accessors. Object literal populates 5 methods + schema: null; installConfigShim() reassigns entire napplet.config property with its api (Object.defineProperty schema getter). Both sides satisfy NappletGlobal.config type (readonly schema: X | null accepts both null literal and getter), method refs are identical, only functional delta is the getter (desired). Template for future NUB integrations that need readonly accessors on window.napplet.*.
- [Phase 115]: 115-01: Pattern — bare-prefix vs .result-suffix domain routing. config.* uses type.startsWith('config.') (not '&& endsWith(\".result\")') because handleConfigMessage dispatches three shell→napplet types: registerSchema.result (correlated ack), values (dual-use — correlated or push), schemaError (uncorrelated push). Identity's .result-suffix pattern works because identity is strict request/response; NUBs with push streams or uncorrelated pushes need bare prefix.
- [Phase 116]: 116-01: Wrote packages/nubs/config/README.md (248 lines). Followed @napplet/nub-notify template (5+3 wire-msg tables). Domain Registration section explicitly diverges from notify/media -- barrel is side-effect-free; shim is central dispatcher. SDK Helpers shows @napplet/sdk config namespace usage (phase-115 shape, not bare sdk.*). FromSchema opt-in documented with explicit fallback-to-ConfigValues callout. All 31 acceptance greps PASS in first shot. Commit 36d23d2. DOC-01 satisfied.
- [Phase 116]: [Phase 116]: 116-02: Landed 4-README config NUB docs sweep (core/shim/sdk/vite-plugin). DOC-03..06 satisfied. core README adds 'config' in 5 enumeration points (domain prefix prose, NubDomain type union, description table, NUB_DOMAINS runtime array, Integration Note NUB list) + Types table count update ('eight' -> 'nine'). shim README adds Quick Start config example (get/subscribe/openSettings with cleanup), 5 outbound + 3 inbound wire format lines, config: {...} in window.napplet shape object, dedicated '### window.napplet.config' subsection with 6-row method table, @napplet/nub-config in Shim vs SDK deps row. sdk README adds config to Quick Start imports+body, '### config' subsection, '### FromSchema type inference (NUB-CONFIG)' subsection with json-schema-to-ts opt-in install note, napplet.config.subscribe Namespace Import line, ConfigNubMessage message-types row, CONFIG_DOMAIN constants import+values comment, supports('nub:config') example. vite-plugin README adds 3 build-time bullets (meta injection, config manifest tag, aggregateHash via config:schema), full '#### configSchema (optional)' section with accepted-forms table + 3-path discovery precedence (inline / config.schema.json / napplet.config.ts|js|mjs) + 3 worked examples, '#### Build-Time Guards' catalogue (invalid-schema / pattern-not-allowed[CVE-2025-69873] / ref-not-allowed / secret-with-default + tree-walk keywords), Nip5aManifestOptions interface with configSchema?: JSONSchema7 | string + JSDoc, NUB-CONFIG spec link in Protocol Reference. 4 atomic commits f6f1146/c587e9e/6e7ef33/8427b16 with --no-verify (parallel executor).
- [Phase 116]: [Phase 116]: 116-02: Pattern -- optional-peer type-inference documentation. FromSchema<typeof schema> opt-in via json-schema-to-ts peerDep documented in sdk README with explicit --save-dev install command. Reusable template for any future NUB that ships an opt-in type-inference peer; keeps the default path zero-cost (Record<string, unknown>) while surfacing typed-callback upgrade path to authors who want it.
- [Phase 116]: [Phase 116]: 116-02: Deviation -- removed per-token backticks on shim README How-It-Works bullet 3 ('relay, ipc, storage, keys, media, notify, identity, config, and shell' -- bare tokens) to satisfy plan's explicit verification grep (grep -q 'identity, config, and shell'). Plan action instruction also specified bare-token form; trade-off is mild stylistic inconsistency on one bullet vs. reliable acceptance. Backtick-per-token convention preserved everywhere else in shim README.
- [Phase 116]: 116-03: DOC-02 satisfied -- NUB-CONFIG row verified in /home/sandwich/Develop/nubs/README.md on nub-config branch (cc88056, all 6 acceptance greps pass, zero @napplet/* leaks). PR #13 opened at napplet/nubs by user via human-action gate: "NUB-CONFIG: per-napplet declarative configuration". Sequential numbering confirmed (NUB-MEDIA #10, NUB-NOTIFY #11, NUB-IDENTITY #12, NUB-CONFIG #13). No link-amendment commit needed. Agent never ran git push or gh pr create autonomously -- human-gated pattern upheld.

### Blockers/Concerns

- CARRIED: npm publish blocked on human npm auth (PUB-04).
- CARRIED: NIP number conflict with Scrolls PR#2281 (RES-01) -- unresolved.

## Session Continuity

Last session: 2026-04-17T14:23:15Z
Stopped at: Completed 116-03-PLAN.md -- public nubs registry row verify + push handoff. DOC-02 satisfied. NUB-CONFIG row verified (cc88056, 6/6 greps pass). PR #13 open at napplet/nubs. Phase 116 complete -- all 15 plans across 6 phases complete. v0.25.0 Config NUB milestone complete.
Resume: v0.25.0 milestone complete. Next milestone: v0.26.0 (run /gsd:plan-phase or /gsd:quick for any follow-up tasks).
