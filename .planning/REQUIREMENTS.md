# Milestone v0.25.0 Requirements — Config NUB

**Defined:** 2026-04-17
**Core Value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.

**Goal:** Design and ship NUB-CONFIG — per-napplet declarative configuration. Napplet declares a JSON Schema; shell renders the settings UI, validates, persists in a napplet-scoped config store, and delivers live values back to the napplet.

**Milestone type:** Spec + SDK (follows v0.22 / v0.23 / v0.24 pattern). NOT a shell implementation milestone.

---

## v1 Requirements

### NUB-CONFIG Spec

Public NIP-style document drafted in the napplet/nubs repository (PR #13). No `@napplet/*` references; spec is implementation-agnostic.

- [x] **SPEC-01**: Draft NUB-CONFIG spec as napplet/nubs#13 with wire contract, Core Subset, security considerations, and NIP-5D parent reference
- [x] **SPEC-02**: Core Subset locked — types (`string`, `number`, `integer`, `boolean`, `object` top-level, `array` of primitives); keywords (`default`, `title`, `description`, `enum`, `enumDescriptions`); constraints (`minimum`, `maximum`, `minLength`, `maxLength`); extensions (`x-napplet-secret`, `x-napplet-section`, `x-napplet-order`, `deprecationMessage`, `markdownDescription`); `$version` potentiality. `pattern` is explicitly NOT in v1 Core Subset (ReDoS risk per CVE-2025-69873)
- [x] **SPEC-03**: Shell MUSTs enumerated — validate values before delivery, apply declared defaults, scope storage by `(dTag, aggregateHash)`, be sole writer, render Tier 0 secret masking for `x-napplet-secret: true` fields
- [x] **SPEC-04**: Shell SHOULDs enumerated — group by `x-napplet-section`, sort within section by `x-napplet-order`, display `deprecationMessage` next to affected fields, render `markdownDescription` as markdown (falling back to plain text)
- [x] **SPEC-05**: Shell MAYs enumerated — Tier 2+ secret handling (encrypted at rest, OS keychain), richer `format` widget rendering, nested-object rendering beyond one level (JSON fallback acceptable), back NUB-CONFIG storage with NUB-STORAGE internally
- [x] **SPEC-06**: Anti-features explicitly rejected in spec — no `config.set` wire message (napplet cannot mutate config), no `$ref`/`definitions` (schemas are self-contained), no `pattern` in Core Subset, no napplet-rendered settings iframe, no napplet-supplied validation code
- [x] **SPEC-07**: Security considerations section — source-identity scope binding, cleartext-secrets-over-postMessage limitation acknowledged, `additionalProperties: false` override for NUB-CONFIG top level, external `$ref` forbidden
- [x] **SPEC-08**: Error envelopes catalogued — malformed schema at registerSchema time, undeclared section in openSettings, subscribe-before-schema

### Wire Surface

Six wire messages; full JSON envelope `{ type: "config.action", ...payload }` per NIP-5D.

- [x] **WIRE-01**: `config.registerSchema` (napplet → shell) — runtime escape hatch; includes schema and optional `version`. Shell validates the schema itself and ACKs with a correlated result message (schema ok / schema rejected with reason)
- [x] **WIRE-02**: `config.get` (napplet → shell) — correlation-ID request; returns current validated+defaulted config object in a correlated `config.values` response
- [x] **WIRE-03**: `config.subscribe` (napplet → shell) — starts the live push stream. Shell MUST emit an immediate initial `config.values` push on subscription (snapshot delivery)
- [x] **WIRE-04**: `config.unsubscribe` (napplet → shell) — stops the live push stream. Reference shim tracks local subscriber count and only sends `config.unsubscribe` when the last local subscriber detaches
- [x] **WIRE-05**: `config.values` (shell → napplet) — dual-use message: correlated response to `config.get`, and push delivery on subscription. Always carries full validated config object (no diffs)
- [x] **WIRE-06**: `config.openSettings` (napplet → shell) — optional `section` payload. Shell opens its own settings UI, optionally deep-linking to the named section. Section MUST be declared via `x-napplet-section` somewhere in the schema (strict scope)

### @napplet/nub-config Package

9th NUB package, 13th @napplet package overall. Follows the modular NUB pattern (types + shim + sdk).

- [x] **NUB-01**: `@napplet/nub-config` scaffolded with package.json, tsup.config.ts, tsconfig.json matching the @napplet/nub-identity template
- [x] **NUB-02**: `src/types.ts` — message interface definitions for all 6 wire messages, `NappletConfigSchema` type (JSON Schema alias), `ConfigValues` type, plus potentiality types for `x-napplet-*` extensions
- [x] **NUB-03**: `src/shim.ts` — `installConfigShim()` mounts `window.napplet.config`, manages subscribers (fan-out Set with ref-counted subscribe/unsubscribe), reads manifest-declared schema from `<meta name="napplet-config-schema">` at install, handles `config.values` push routing
- [x] **NUB-04**: `src/sdk.ts` — named exports `get()`, `subscribe(cb)`, `openSettings({ section? })`, `registerSchema(schema, version?)` as convenience wrappers around `window.napplet.config`
- [x] **NUB-05**: `src/index.ts` barrel exports all types, shim installer, and SDK helpers
- [x] **NUB-06**: `@types/json-schema@^7.0.15` as devDependency (for type alias only); `json-schema-to-ts@^3.1.1` as optional peerDependency (opt-in `FromSchema<typeof schema>` inference); no runtime deps beyond `@napplet/core`

### Vite-Plugin Extension

Multiple schema-source paths supported; schema becomes part of the NIP-5A manifest and contributes to `aggregateHash`.

- [x] **VITE-01**: `Nip5aManifestOptions.configSchema?: JSONSchema7 | string` field accepts inline schema object
- [x] **VITE-02**: Convention-file discovery — if `config.schema.json` exists at napplet source root, vite-plugin reads it when `configSchema` option is absent
- [x] **VITE-03**: Config-file-export discovery — if `napplet.config.ts`/`.js` is present at napplet root and exports a `configSchema`, vite-plugin imports it when neither `configSchema` option nor `config.schema.json` is present
- [x] **VITE-04**: Schema is embedded as a `['config', JSON.stringify(schema)]` tag on the kind 35128 NIP-5A manifest event
- [x] **VITE-05**: Schema bytes included in `aggregateHash` computation via a synthetic `config:schema` path prefix — any schema change bumps `aggregateHash`
- [x] **VITE-06**: `<meta name="napplet-config-schema">` injected into `index.html` head at build time for synchronous shim-side read
- [x] **VITE-07**: Build-time structural guard — schema MUST be a root object with `type: "object"`; external `$ref` forbidden; presence of `pattern` triggers build error; `x-napplet-secret: true` combined with `default: ...` triggers build error

### Core / Shim / SDK Integration

Surgical edits to existing packages, following the v0.22-v0.24 integration pattern.

- [x] **CORE-01**: `'config'` added to `NubDomain` union and `NUB_DOMAINS` array in `packages/core/src/envelope.ts`
- [x] **CORE-02**: `config` namespace added to `NappletGlobal` in `packages/core/src/types.ts` with `get()`, `subscribe()`, `openSettings()`, `registerSchema()`, and readonly `schema` accessor
- [x] **SHIM-01**: `@napplet/shim` imports `installConfigShim` from `@napplet/nub-config/shim` and mounts at shim-install time
- [x] **SDK-01**: `@napplet/sdk` re-exports `config` convenience wrappers from `@napplet/nub-config/sdk` and all message types
- [x] **CAP-01**: `shell.supports('config')` and `shell.supports('nub:config')` probes work per the existing NamespacedCapability convention

### Documentation

- [x] **DOC-01**: `@napplet/nub-config` README — package purpose, install, window.napplet.config API surface, example schema, SDK usage
- [ ] **DOC-02**: NIP-5D "Known NUBs" table updated with a `config` row referencing napplet/nubs#13 (by NUB-CONFIG number only — no `@napplet/*` reference)
- [x] **DOC-03**: `@napplet/core` README lists `'config'` as a registered NubDomain
- [x] **DOC-04**: `@napplet/shim` README documents `window.napplet.config` namespace
- [x] **DOC-05**: `@napplet/sdk` README documents `config` SDK exports and `FromSchema` type inference pattern
- [x] **DOC-06**: `@napplet/vite-plugin` README documents `configSchema` option, convention-file discovery, and `napplet.config.ts` export path

---

## Future Requirements (deferred, not out-of-scope)

Candidates for v0.26.0 or later milestones. Re-evaluate when a real napplet drives the need.

- **FUT-01**: `config.unregisterSchema` wire message for vite-plugin HMR ergonomics
- **FUT-02**: `config.getSecret(key)` for Tier 1 secret handling — napplet opts in to receiving secret values one-off instead of in bulk pushes
- **FUT-03**: `pattern` keyword in Extended Subset once a shell-safe regex engine strategy (Web Worker + timeout, RE2-WASM, or equivalent) is specified
- **FUT-04**: Tier 2 secret handling — encrypted-at-rest in the shell with user-derived key material
- **FUT-05**: `format` keyword richer widget rendering (email, uri, date-time, color) as SHOULD
- **FUT-06**: Change-diff push envelope (delta `config.values`) once configs grow large enough to make full-object pushes wasteful
- **FUT-07**: `examples` JSON Schema keyword rendering
- **FUT-08**: Per-instance config layering if multi-instance napplets emerge

---

## Out of Scope (explicit exclusions with reasoning)

Not deferred — deliberately rejected as anti-features or outside NUB scope boundary.

- **Napplet-rendered settings iframe** — violates the value proposition of NUB-CONFIG (consistent UX across napplets) and puts the settings UI behind the same sandbox that renders the napplet
- **Napplet-writable config (`config.set` wire message)** — breaks the sole-writer guarantee; makes schema advisory rather than enforced; enables napplet-driven storage abuse
- **`$ref` / `definitions` in schema** — VSCode explicitly forbids; every shell would need a full JSON Schema reference resolver; spec complexity explodes
- **External `$ref` resolution (HTTP/filesystem)** — security catastrophe (SSRF, exfiltration, cache poisoning); forbidden by spec
- **JSON Schema draft 2020-12 features** (`if`/`then`/`else`, `unevaluatedProperties`, `dependentSchemas`, `$dynamicRef`) — enormous validator/UI complexity; no precedent uses them for extension config
- **Conditional visibility (when-clauses)** — no precedent for extension config; too complex for v1
- **Napplet-supplied validation functions (JS code)** — shell executing napplet code is a sandbox violation; breaks validation-before-delivery guarantee
- **Napplet-dictated UI widget hints (`ui:widget: "color-picker"`)** — turns NUB-CONFIG into a UI framework spec; ecosystem liability
- **OS-keychain secrets as MUST** — unimplementable in browser-only shells; would block web-shell conformance (kept as MAY for native host shells)
- **Migration-as-napplet-code** — already architecturally rejected; shell is the risk carrier; `$version` signal suffices
- **Config inheritance / multi-scope layering** — no "workspace" concept in Nostr-sandboxed iframes; adds a dimension we don't have
- **Cross-napplet config sharing** — violates per-napplet isolation (security property)
- **Live two-way binding (streaming uncommitted keystrokes to napplet)** — creates validation flicker and storage churn; shell debounces and pushes on commit instead
- **Shell-side implementation choices** — validator library, settings UI paradigm, migration UX, secret storage backend, debounce interval, `openSettings` rate-limiting. Per the NUB scope boundary rule, these are shell concerns, not spec concerns.

---

## Traceability

Each v1 REQ-ID maps to exactly one phase. Coverage is 100% across 38 requirements.

| REQ-ID   | Phase | Status  |
|----------|-------|---------|
| SPEC-01  | 111   | Complete |
| SPEC-02  | 111   | Complete |
| SPEC-03  | 111   | Complete |
| SPEC-04  | 111   | Complete |
| SPEC-05  | 111   | Complete |
| SPEC-06  | 111   | Complete |
| SPEC-07  | 111   | Complete |
| SPEC-08  | 111   | Complete |
| NUB-01   | 112   | Complete |
| NUB-02   | 112   | Complete |
| NUB-05   | 112   | Complete |
| NUB-06   | 112   | Complete |
| NUB-03   | 113   | Complete |
| NUB-04   | 113   | Complete |
| VITE-01  | 114   | Complete |
| VITE-02  | 114   | Complete |
| VITE-03  | 114   | Complete |
| VITE-04  | 114   | Complete |
| VITE-05  | 114   | Complete |
| VITE-06  | 114   | Complete |
| VITE-07  | 114   | Complete |
| WIRE-01  | 115   | Complete |
| WIRE-02  | 115   | Complete |
| WIRE-03  | 115   | Complete |
| WIRE-04  | 115   | Complete |
| WIRE-05  | 115   | Complete |
| WIRE-06  | 115   | Complete |
| CORE-01  | 115   | Complete |
| CORE-02  | 115   | Complete |
| SHIM-01  | 115   | Complete |
| SDK-01   | 115   | Complete |
| CAP-01   | 115   | Complete |
| DOC-01   | 116   | Complete |
| DOC-02   | 116   | Pending |
| DOC-03   | 116   | Complete |
| DOC-04   | 116   | Complete |
| DOC-05   | 116   | Complete |
| DOC-06   | 116   | Complete |
