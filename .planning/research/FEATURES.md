# Feature Landscape: NUB-CONFIG

**Domain:** Declarative per-extension configuration in sandboxed/hosted extension ecosystems
**Researched:** 2026-04-17
**Confidence:** HIGH (5 precedent ecosystems with first-party docs; consistent cross-ecosystem patterns)

## Precedent Survey

Five ecosystems were examined. Each has a different stance on "who owns the UI" and "who owns the schema," which directly informs what NUB-CONFIG can borrow, skip, or reject.

| Ecosystem | Schema declared where | UI owner | Schema format | Secrets model | Deep-link to settings | Change notifications |
|-----------|----------------------|----------|---------------|---------------|-----------------------|----------------------|
| **VSCode** | `contributes.configuration` in `package.json` | Host (Settings editor) | JSON Schema subset (no `$ref`) | Separate `SecretStorage` API (OS keychain) | `workbench.action.openSettings` with `@ext:publisher.name` filter | `workspace.onDidChangeConfiguration` live events |
| **Chrome MV3 `options_ui`** | n/a — HTML page | Extension (extension-rendered) | n/a — freeform HTML | Extension's own problem | `chrome.runtime.openOptionsPage()` | `chrome.storage.onChanged` live events |
| **Chrome MV3 `managed_schema`** | `storage.managed_schema` → JSON file | Admin/policy (no end-user UI) | JSON Schema (object, `properties`, `$ref`, `additionalProperties`) | N/A (admin-supplied) | N/A | `chrome.storage.onChanged` |
| **Raycast** | `preferences[]` in `package.json` | Host (Preferences editor) | Bespoke type enum (`textfield`, `password`, `checkbox`, `dropdown`, `appPicker`, `file`, `directory`) | `password` type → system Keychain on macOS | `openExtensionPreferences()` / `openCommandPreferences()` | **Snapshot only** — `getPreferenceValues()` at command launch |
| **Figma** | `parameters[]` (quick-action args only) | Extension for settings; Host for quick-action args | Bespoke (`name`, `key`, `description`, `optional`, `allowFreeform`, `data`) | Extension's own problem | None documented | N/A (no persistent settings mechanism) |
| **JetBrains** | `ConfigurableEP` extension point in `plugin.xml` | Host (Settings dialog) | Code-backed (plugin constructs UI component) | Plugin's own problem (`PasswordSafe` API separate) | `ShowSettingsUtil.showSettingsDialog(project, Configurable.class)` | Plugin implements `Configurable.apply()` |

**Only VSCode and Chrome's `managed_schema` use JSON Schema as the wire contract.** Raycast uses a bespoke type enum; Figma has no declarative settings UI at all; JetBrains is code-first. This matches our decision to use JSON Schema — it's the most cross-ecosystem-portable choice and the two precedents that use it agree on structure.

**Raycast is the closest structural match to NUB-CONFIG** (host-rendered UI, declarative-from-manifest, sandboxed extensions, `openExtensionPreferences` deep-link), but with a bespoke type enum instead of JSON Schema. We get the best of both: JSON Schema's ecosystem + Raycast's sandbox-host-UI-owns pattern.

**Figma is the counter-example.** It deliberately has no settings mechanism; plugins render their own UI if needed. This confirms that "just let the napplet render a config iframe" is a coherent design choice — but it's the one we're explicitly rejecting because the whole point of NUB-CONFIG is consistency across napplets (users find settings in one place).

## Consensus Across Ecosystems

Fields that appear in every ecosystem that declares schemas (VSCode, Raycast, Chrome `managed_schema`). These are the irreducible core of "declarative config":

| Field | VSCode | Raycast | Chrome `managed_schema` | Verdict |
|-------|:------:|:-------:|:----------------------:|---------|
| **type** (string/number/boolean/object/array) | ✓ | ✓ (via `type` enum) | ✓ | **Table stake** |
| **default** | ✓ | ✓ | ✓ (via `description` convention) | **Table stake** |
| **title / name / label** | ✓ | ✓ (`title`) | ✓ (`title`) | **Table stake** |
| **description** | ✓ | ✓ | ✓ | **Table stake** |
| **enum / dropdown options** | ✓ | ✓ (`dropdown.data`) | ✓ | **Table stake** |
| **required** | implicit (default means optional) | ✓ | ✓ | **Table stake** |

Fields that appear in two-of-three:

| Field | VSCode | Raycast | Chrome | Verdict |
|-------|:------:|:-------:|:------:|---------|
| **min / max** (numeric bounds) | ✓ (`minimum`/`maximum`) | — | ✓ | Differentiator |
| **minLength / maxLength / pattern** | ✓ | — | ✓ | Differentiator |
| **format** (email, uri, date-time) | ✓ | — | ✓ | Differentiator |
| **order** (display ordering) | ✓ (`order`) | ✓ (array order) | — | Differentiator (and trivial to implement) |
| **deprecation message** | ✓ (`deprecationMessage`) | — | — | Differentiator (VSCode-specific, but highly valued per search results) |
| **placeholder** | — | ✓ | — | Idiosyncratic |
| **markdownDescription** | ✓ | — | — | Idiosyncratic |
| **platform-specific defaults** | — | ✓ (`{ macOS: ..., Windows: ... }`) | — | Idiosyncratic (not our problem — napplets are web) |

Sources: [VSCode contribution-points](https://code.visualstudio.com/api/references/contribution-points) · [Raycast manifest preferences](https://developers.raycast.com/information/manifest#preferences) · [Chrome managed_schema manifest](https://developer.chrome.com/docs/extensions/reference/manifest/storage)

## Table Stakes

Features users expect. Missing = NUB-CONFIG feels incomplete or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|:----------:|-------|
| **Declare schema in NIP-5A manifest** | Already decided. VSCode `package.json`, Raycast `package.json`, Chrome `managed_schema` all declare config at build time. Manifest-declared is the authoritative path. | LOW | vite-plugin injects schema into manifest JSON at build. |
| **Runtime schema declaration (escape hatch)** | Already decided. Napplets built without the vite-plugin (or hand-rolled) need a runtime call. No precedent has this — they're all manifest-only — but sandboxed iframe apps need the escape hatch because "run the napplet author's build tooling" is not always possible. | LOW | `config.registerSchema({ schema })` — shell validates and merges. |
| **Core JSON Schema types: `string`, `number`, `boolean`, `object`, `array`** | Every schema-driven ecosystem supports all five. `integer` is treated as a special `number`. | LOW | JSON Schema draft-07 natively. Shell must validate each type before delivery (spec MUST). |
| **`default` per property** | Every ecosystem. Without defaults, napplets ship in broken state until user visits settings. Shell MUST apply declared defaults (already a locked decision). | LOW | Pure JSON Schema. Shell fills in missing keys with declared defaults. |
| **`title` + `description`** | Every ecosystem. Title is the UI label; description is the hover/tooltip. Without these, the settings UI is unlabeled squares. | LOW | Standard JSON Schema keywords. |
| **`enum` with labels for dropdowns** | Every ecosystem. Users don't type `"foo-bar-baz"` — they pick from a list. `enum: ["a", "b"]` + `enumDescriptions: ["Option A", "Option B"]` is the VSCode convention. | LOW | JSON Schema `enum` + VSCode-style `enumDescriptions`. Optional: `enumItemLabels` for display-distinct-from-description. |
| **Shell validates values BEFORE delivering to napplet** | Already a locked MUST. Every precedent does this — VSCode rejects settings that fail schema, Chrome excludes non-conforming policy values, Raycast won't deliver until required fields are filled. Napplet should never receive an unvalidated value. | MED | Shell runs schema validator (ajv or similar) on each value before `config.values` push. |
| **Defaults applied by shell** | Already a locked MUST. Napplet receives fully-populated config object — missing keys filled from `default`, user overrides merged on top. | LOW | Standard defaulting semantics. |
| **Storage scoped by (dTag, aggregateHash)** | Already a locked MUST. Matches NUB-STORAGE scoping. Different napplet types and versions have isolated config. | LOW | Shell concern; existing scoping infrastructure. |
| **Shell is sole writer; napplet reads only** | Already a locked decision. Raycast, VSCode, JetBrains all enforce this — extension code cannot directly write to settings; only the user via the Settings UI. Napplets cannot mutate config over the wire. | LOW | Wire surface has no `config.set` message. Only `config.get`, `config.subscribe`, `config.openSettings`. |
| **`config.get()` — initial snapshot** | Raycast's `getPreferenceValues()` pattern. Sometimes napplets need a one-shot read (e.g., during a compute, not as a live subscription). | LOW | Correlation-ID request/result. Returns validated, defaulted config object. |
| **`config.subscribe()` — live updates (snapshot + push)** | Already a locked decision. VSCode's `onDidChangeConfiguration`, Chrome's `storage.onChanged`. Without live updates, a user changing a setting requires a napplet reload, which is ugly in a sandboxed iframe. | MED | Subscription on napplet side; shell pushes `config.values` on any change. |
| **`config.values` — shell→napplet push envelope** | The push half of subscribe-live. Shell delivers full validated config object (not diffs) on any change. | LOW | One message type. Matches theme NUB inverse-push pattern. |
| **`config.openSettings({ section? })` — deep-link** | Raycast (`openExtensionPreferences`), Chrome (`chrome.runtime.openOptionsPage`), VSCode (`workbench.action.openSettings @ext:id`), JetBrains (`showSettingsDialog`). **Every schema-driven precedent has this.** Napplet can say "you need to configure X" and take the user to the right place. | LOW | One wire message. Shell opens its own settings UI, optionally focused on a named section. |
| **`shell.supports('config')` capability probe** | All NUBs. Napplet checks before depending on config. Shells without NUB-CONFIG must signal absence, so napplet can fall back to built-in defaults. | LOW | Existing `shell.supports()` infra. |

## Differentiators

Features that set NUB-CONFIG apart from ad-hoc per-napplet settings. Not expected, but high value. Candidates for MAY/SHOULD (potentialities) in the spec.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|:----------:|-------|
| **`x-napplet-secret: true` property marker** | Password-type preferences in Raycast map to system Keychain on macOS. VSCode has a completely separate `SecretStorage` API (OS keychain — macOS Keychain, Windows Credential Manager, Linux Keyring). **We cannot use OS keychain from a web shell** — browsers don't have that access — but we CAN: (a) mark the field as secret in the UI (password input, never echoed), (b) keep the value out of `config.values` pushes unless the napplet explicitly requests it via a correlated `config.getSecret(key)` call, (c) redact from logs. Already a locked potentiality. | MED | JSON Schema extension (already decided). Shell decides storage strength; spec mandates UI masking + log redaction minimum. See "Secret Strength Gradient" section below. |
| **`x-napplet-section: "name"` for grouping** | VSCode has implicit sectioning via dotted setting keys (`editor.fontSize` → "Editor" group). Raycast just renders flat. For napplets with many settings, grouping is UX-critical. Already a locked potentiality. | LOW | Extension that the shell uses to render section headers. Napplet references the same section name in `openSettings({ section })`. |
| **`x-napplet-order: N` for explicit ordering** | VSCode has `order`. Array-declaration order is ambiguous once schemas are merged/split. Already a locked potentiality. | LOW | Trivial. |
| **`$version` field for migration signaling** | VSCode has no migration API — best practice is "read old setting, migrate, `deprecationMessage` the old one". Migration is hard and bespoke everywhere. Our locked decision is: napplet declares `$version` in schema; shell resolves migration entirely (reads old values, transforms, writes new, napplet never sees the old shape). Already a locked potentiality. | MED | Wire surface exposes `$version` in the schema; migration UX is shell-resolved. Shell's problem — spec only defines the signal. |
| **`format` keyword (email, uri, date-time, regex)** | VSCode supports. Chrome `managed_schema` supports. JSON Schema draft-07 native. Lets the shell render richer inputs (date picker vs text, email field with @-validation). Shell MAY render richer inputs; MUST at least accept standard JSON Schema validation. | MED | Shell renders best-effort UI; validation is on shell. |
| **`minimum`/`maximum`/`minLength`/`maxLength`/`pattern`** | Standard JSON Schema. Shell MUST enforce these before delivery (same validation pass as type check). | LOW | Trivial — validator handles it. |
| **`deprecationMessage` on properties** | VSCode has this. Community search results flag it as "your friend" for migration. Not strictly needed for v1 since `$version` handles shape migrations, but useful for soft-deprecating options the napplet author wants to phase out. | LOW | Add as a SHOULD in spec — shells SHOULD display the deprecation message next to the field. |
| **`markdownDescription` (vs plain `description`)** | VSCode has both. Lets schemas embed links to docs, code snippets. Shell MAY render markdown; MUST fall back to plain text. | LOW | Idiosyncratic to VSCode but cheap to support. |
| **Per-section titles (not just keys)** | `x-napplet-section: "advanced"` is just a key; UX wants "Advanced Settings". One approach: `x-napplet-section: { id: "advanced", title: "Advanced Settings" }`. Alternative: derive the title from the first property in the section, or let the shell generate titles from the ID. | LOW | Spec decision. Simplest: section is a bare string ID; shell title-cases or napplet supplies full object. |
| **Batch schema registration (one message)** | Already covered by the single manifest or single `registerSchema` call — not N individual calls. Whole-schema replace semantics. | LOW | No separate message needed; the register call IS the batch. |
| **`config.get(key)` — single-key read** | Some precedents (Raycast) return the whole object. VSCode lets you `get('editor.fontSize')` for a single value. For napplets, fetching the whole config and picking one key is cheap (configs are small), so single-key read is convenience, not necessity. | LOW | Spec could require either "return whole object" or allow "return key or whole object"; recommend whole-object for simplicity. |
| **Context/when-clause visibility (conditional fields)** | VSCode `menus` have `when` clauses; **VSCode `configuration` entries do NOT.** Idea: field A is visible only when field B has a certain value. None of the precedents support this for configuration. Too complex for v1. | HIGH | Defer — none of the precedents we studied actually support this for config. |

## Secret Strength Gradient

NUB-CONFIG lives in a web shell (browser), not a native app. This limits our secret-handling options compared to Raycast/VSCode. Strength tiers, from weakest to strongest, that a shell implementation could offer:

| Tier | Mechanism | Strength | Feasibility in web shell |
|------|-----------|----------|------------------------|
| **0: Just-masked** | UI renders `<input type="password">`; value still in normal shell storage. Not echoed in settings UI after entry. | Weakest | Trivially feasible. **Spec floor — MUST.** |
| **1: Kept out of logs** | Shell's debug/inspect views redact secret fields. Napplet never sees the secret in bulk `config.values` pushes — must request via `config.getSecret(key)` (correlated, one-off). | Weak+ | Feasible. **Spec SHOULD.** |
| **2: Encrypted at rest** | Shell encrypts the value in localStorage/IndexedDB with a user-derived key (passphrase, WebAuthn, etc.). | Medium | Feasible but requires shell-level key management. **Spec MAY.** |
| **3: OS-keychain-backed** | Value lives in macOS Keychain / Windows Credential Manager / Linux Keyring. Web shells cannot access these directly. | Strong | **Not feasible for browser-only shells.** A native host shell (Electron, Tauri, Rust binary) could offer this; a pure-web shell cannot. **Spec MAY for shells that can.** |

**Recommendation for v1:** Spec mandates Tier 0 (masked UI) as floor. Recommends Tier 1 (redacted logs, napplet must opt in to receiving secret via getSecret). Tiers 2 and 3 are shell-implementation choices. `x-napplet-secret: true` is the signal; strength is shell-decided.

Sources: [Raycast security](https://developers.raycast.com/information/security) · [VSCode SecretStorage](https://vscode-api.js.org/interfaces/vscode.SecretStorage.html) · [How to use SecretStorage in VSCode extensions](https://dev.to/kompotkot/how-to-use-secretstorage-in-your-vscode-extensions-2hco)

## Anti-Features

Features to explicitly NOT build. Tempting but wrong for this protocol.

| Anti-Feature | Why Requested | Why Problematic | Alternative |
|--------------|---------------|-----------------|-------------|
| **Napplet-rendered settings iframe** | Figma's model — plugins own their settings UI. "Flexible", "each napplet can theme/brand/layout however they want." | Violates the entire value proposition of NUB-CONFIG: users have ONE place to find settings, with consistent UX. Also puts the settings UI behind the same sandboxed iframe that napplets draw in, meaning secrets flow to the napplet. Spec becomes pointless — there's no wire contract to validate. | Shell renders the UI from the schema. Napplet calls `openSettings` to deep-link. |
| **Napplet-writable config (`config.set`)** | "It's annoying to tell users to open settings for a simple change." | Already a locked decision (shell is sole writer). If napplets can write, the schema becomes advisory, not enforced. Napplets can bypass validation, trigger storage quota attacks, write secrets into non-secret fields. | Napplet calls `config.openSettings({ section })`. User makes the change. Napplet receives update via `config.values` push. |
| **`$ref` / `definitions` (schema references)** | "JSON Schema supports it." Some big schemas reuse types. | Chrome `managed_schema` allows it, but VSCode explicitly bans it: "configuration schemas must be self-contained." Spec complexity explodes — $ref resolution, cycle detection, cross-schema references. Every shell implementation needs a full JSON Schema $ref resolver. | Napplet inlines types. Schemas are small (dozens of fields, not hundreds). |
| **Full JSON Schema draft 2020-12 support** | "We should support the latest spec." | Features like `if`/`then`/`else`, `unevaluatedProperties`, `dependentSchemas`, `$dynamicRef` add enormous validator complexity and UI-generation complexity. No precedent uses them for extension config. | Draft-07 subset. Specifically call out what IS supported (types, default, enum, format, min/max, minLength/maxLength, pattern, `$version`, `x-napplet-*`); everything else is best-effort or ignored. |
| **Arbitrary nested `object` / `array` depth** | "Users might want structured config." | UI generation for deeply-nested schemas is a research problem (how do you render `array<object<array<object>>>`?). VSCode gives up and shows JSON for complex types. Raycast doesn't allow nesting at all. | Spec allows top-level primitives + one level of `object` or `array`. Shell MAY render deep nesting but MUST render JSON fallback. |
| **Napplet-specified UI widget hints (`ui:widget: "color-picker"`)** | react-jsonschema-form pattern. "I want my color field to render as a color picker, not a text input." | Turns the spec into a UI framework. Shell implementations then have to support (or ignore) every widget name napplets ship. Becomes an ecosystem liability. | Use JSON Schema `format: "color"` (draft-07 doesn't have it, but we can add as a SHOULD convention). Shell picks the widget. Napplets don't dictate UI. |
| **Live two-way binding between napplet and settings UI** | "I want to see my typing in the settings UI reflected live in the napplet." | This already happens via `config.values` push after commit. Streaming uncommitted keystrokes creates validation flicker (shell would push invalid intermediate states) and storage churn. | Shell commits on blur / enter / debounce; pushes `config.values` once per commit. |
| **Napplet-defined validation functions (JS code in schema)** | "JSON Schema can't express my custom validation." | Executing napplet-supplied validation code ON THE SHELL is a sandbox violation (shell is trusted; napplet is not). Executing on the napplet means shell can't validate before delivery. Breaks the sole-writer model. | Napplet describes validation with JSON Schema primitives. If truly impossible, napplet validates its own inputs and presents an error in the settings UI via `openSettings` + its own logic — out of scope for v1. |
| **Config inheritance / layering (user > workspace > machine)** | VSCode has this (application/machine/window/resource/language scopes). Useful for "workspace-specific napplet config." | No "workspace" concept in Nostr-sandboxed iframes. Our scope is `(dTag, aggregateHash)` — per napplet instance. Adding layering now designs for a multi-dimensional space we don't have. | Single scope per napplet. If layering is ever needed, add a `scope` potentiality later. |
| **OS-keychain as MUST for secret fields** | "Secrets should be encrypted at rest in hardened storage." | Unimplementable in browser-only shells. Would block web-shell conformance. | Tiered strength: Tier 0 (masked) MUST, Tier 1 (redacted) SHOULD, Tier 2/3 MAY. See Secret Strength Gradient. |
| **Migration-as-napplet-code (shell invokes napplet's migrate fn)** | "Napplet knows best how to migrate its own data." | Shell would have to invoke napplet code, wait for response, then commit. Slow, fragile, creates a trust-inversion (shell depends on napplet behavior). Already decided: migration is shell-resolved from `$version` signal. | `$version` in schema + shell-defined migration hooks. Napplet never sees old-shape values. |

## Feature Dependencies

```
Schema declaration (manifest OR runtime register)
    │
    ├──> Shell-side validator (must type-check, range-check, pattern-check)
    │       │
    │       └──> Validation-before-delivery (MUST guarantee)
    │               │
    │               ├──> config.get — one-shot request
    │               │
    │               └──> config.subscribe + config.values — live push
    │
    ├──> x-napplet-secret marker
    │       │
    │       └──> Secret strength tiers (requires schema to know WHICH fields are secret)
    │               │
    │               └──> Optional: config.getSecret(key) correlated read
    │                       (gated by: shell chose not to include secrets in config.values)
    │
    ├──> x-napplet-section / x-napplet-order
    │       │
    │       └──> config.openSettings({ section }) — deep-link uses section IDs
    │
    ├──> $version in schema
    │       │
    │       └──> Shell-resolved migration (napplet never sees old values)
    │
    └──> Defaults applied (MUST guarantee)
            │
            └──> Napplet always receives a fully-populated validated config

shell.supports('config') ──> (independent; gate for napplet opt-in)

Vite-plugin schema injection ──> (depends on: schema in napplet source)
    │
    └──> NIP-5A manifest has `config` field
            │
            └──> Shell reads from manifest at napplet load (authoritative)

Runtime config.registerSchema ──> (escape hatch; replaces or augments manifest schema)
```

### Dependency Notes

- **Secret marker → secret strength:** `x-napplet-secret: true` is useless without at least Tier 0 UI masking. Shell must know which fields are secret to redact them, mask the input, and (optionally) exclude them from `config.values` pushes.
- **Section marker → openSettings deep-link:** Without `x-napplet-section`, `openSettings({ section })` has nothing to scroll/focus to. If we ship section support, we ship deep-link section support.
- **Validation → delivery:** The MUST-guarantee that napplet receives validated values is impossible without a schema validator running on the shell before the `config.values` push. This is the biggest implementation cost on the shell side.
- **$version → migration:** The signal has no teeth without shell-side migration logic. Spec says "napplet never sees old-shape values"; if shell doesn't implement migration, a version bump would deliver broken values. Shell MAY keep old values in storage; MUST NOT push un-migrated values to napplet.
- **Vite-plugin is not required:** Runtime `config.registerSchema` is the escape hatch. But manifest-declared is faster (schema known at napplet load, not after first message) and is the intended primary path.

## MVP Definition

### Launch With (v1) — spec + package + integration

**Schema wire contract:**
- [ ] JSON Schema draft-07 (subset)
- [ ] Types: `string`, `number` (incl. integer), `boolean`, `object` (top-level only), `array` (of primitives)
- [ ] Keywords: `default`, `title`, `description`, `enum`, `enumDescriptions`
- [ ] Constraints: `minimum`, `maximum`, `minLength`, `maxLength`, `pattern`
- [ ] `$version: number` for migration signaling (shell-resolved)
- [ ] Extensions: `x-napplet-secret`, `x-napplet-section`, `x-napplet-order`

**Wire messages (6 total):**
- [ ] `config.registerSchema` (napplet → shell, runtime escape hatch) — correlation ID, ACKs with validated-schema result
- [ ] `config.get` (napplet → shell) — correlation ID, returns current validated+defaulted config
- [ ] `config.subscribe` (napplet → shell) — no correlation ID, starts the push stream
- [ ] `config.unsubscribe` (napplet → shell) — no correlation ID, stops the push stream
- [ ] `config.values` (shell → napplet) — push of full config object on change or after subscribe
- [ ] `config.openSettings` (napplet → shell) — optional `section` payload

**Shell guarantees (MUST):**
- [ ] Values validate before any `config.values` delivery
- [ ] Declared defaults applied to missing keys
- [ ] Storage scoped by `(dTag, aggregateHash)`
- [ ] Napplet cannot mutate config over the wire (no `config.set` message exists)
- [ ] Tier 0 secret handling: fields with `x-napplet-secret: true` rendered with masked UI

**Shell SHOULDs:**
- [ ] Tier 1 secret handling: redact secret-marked fields from logs/debug surfaces
- [ ] Display `deprecationMessage` next to fields when present
- [ ] Group fields by `x-napplet-section`
- [ ] Sort within sections by `x-napplet-order`
- [ ] `openSettings({ section })` scrolls/focuses to the named section

**Shell MAYs:**
- [ ] Tier 2 or Tier 3 secret handling
- [ ] `markdownDescription` rendered as markdown
- [ ] `format` hints (email, uri, date-time) rendered as richer input widgets
- [ ] Nested `object` beyond one level (fall back to JSON input)
- [ ] Store values using NUB-STORAGE internally (implementation detail)

**Package surface (`@napplet/nub-config`):**
- [ ] Types: message interfaces, schema types, `NappletConfigSchema`, `ConfigValues`
- [ ] Shim installer: `installConfigShim()` — handles `config.values` pushes, manages subscribers
- [ ] SDK: `config.get()`, `config.subscribe(cb)`, `config.openSettings({ section? })`, `config.registerSchema(schema)`
- [ ] Vite-plugin extension: reads schema from a conventional location (e.g., `config.schema.json` in napplet root, or `napplet.config.ts` export), injects into NIP-5A manifest

**Core/shim/SDK integration:**
- [ ] `'config'` added to `NubDomain` union + `NUB_DOMAINS` array
- [ ] `window.napplet.config` namespace on `NappletGlobal`
- [ ] `shell.supports('config')` / `shell.supports('nub:config')` probing works

**Docs:**
- [ ] `nub-config` README
- [ ] NIP-5D "Known NUBs" table row
- [ ] Core/shim/SDK README updates
- [ ] napplet/nubs#13 draft spec

### Add After Validation (v1.x)

Features that make v1 better but aren't required for the protocol to function.

- [ ] **`config.getSecret(key)` one-off correlated read** — trigger: a real napplet needs to retrieve an API key without having it pushed on every `config.values` cycle. Design is straightforward once Tier 1 exists.
- [ ] **Richer `format` support** — trigger: the first napplet that wants a date picker or color picker.
- [ ] **Markdown description rendering** — trigger: a napplet author asks for links in descriptions.
- [ ] **Configuration change diffs** (push only changed keys instead of full object) — trigger: configs grow large enough that full-object pushes are wasteful. Not a concern at v1 scale.
- [ ] **Per-command / per-instance config layering** (if multi-instance napplets emerge) — trigger: a napplet type that spawns multiple instances with per-instance settings.
- [ ] **`examples` keyword** (from JSON Schema) — trigger: authors want to show example values without making them defaults.

### Future Consideration (v2+)

Features that require protocol changes or ecosystem maturity.

- [ ] **Encrypted-at-rest secrets (Tier 2)** — requires key management story in the shell (passphrase prompt, WebAuthn?). Non-trivial. Defer until a real use case.
- [ ] **Native-shell OS-keychain secrets (Tier 3)** — only for shells that can reach system keychains. Not web.
- [ ] **Schema conditional visibility (`when`-style clauses)** — no precedent supports it for config. Revisit if a napplet author makes a strong case.
- [ ] **Multi-scope layering** (user/workspace/machine) — only if multi-tenancy or workspaces become a thing.
- [ ] **Napplet-to-napplet config sharing** — explicitly out of scope; cross-napplet isolation is a security property.
- [ ] **Schema import / $ref resolution** — explicit anti-feature at v1.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|:----------:|:-------------------:|:--------:|
| JSON Schema draft-07 subset | HIGH | LOW | **P1** |
| `default` + defaults applied | HIGH | LOW | **P1** |
| `title`, `description`, `enum`, `enumDescriptions` | HIGH | LOW | **P1** |
| `minimum`/`maximum`/`minLength`/`maxLength`/`pattern` validation | HIGH | LOW | **P1** |
| Shell validates before delivery | HIGH | MED | **P1** |
| `config.get` + `config.subscribe` + `config.values` + `config.unsubscribe` | HIGH | MED | **P1** |
| `config.openSettings({ section? })` | HIGH | LOW | **P1** |
| `config.registerSchema` (runtime) | MED | LOW | **P1** |
| `x-napplet-secret` + Tier 0 masking | HIGH | LOW | **P1** |
| `x-napplet-section` + `x-napplet-order` | MED | LOW | **P1** |
| `$version` potentiality (spec signal only) | MED | LOW | **P1** |
| Vite-plugin schema injection | HIGH | MED | **P1** |
| `deprecationMessage` rendering | LOW | LOW | **P2** |
| Tier 1 secret (log redaction + `config.getSecret`) | MED | MED | **P2** |
| `markdownDescription` | LOW | LOW | **P2** |
| `format: "email"/"uri"/"date-time"` richer widgets | MED | MED | **P2** |
| Tier 2+ secrets | MED | HIGH | **P3** |
| Change diffs instead of full pushes | LOW | MED | **P3** |
| `when`-clause conditional visibility | LOW | HIGH | **P3** |
| Cross-napplet shared config | LOW | HIGH | **Out** |
| Napplet-writable config (`config.set`) | "HIGH" | — | **Anti-feature** |
| `$ref` / `definitions` | LOW | HIGH | **Anti-feature** |

**Priority key:**
- **P1** — Must have for v1 launch (spec + package + integration)
- **P2** — Should have, add in v1.x
- **P3** — Future consideration
- **Out / Anti-feature** — Explicitly not building

## Competitor Feature Analysis

How NUB-CONFIG compares to its closest precedents:

| Feature | VSCode | Raycast | Chrome `managed_schema` | Figma | **NUB-CONFIG v1** |
|---------|:------:|:-------:|:----------------------:|:-----:|:--------------------:|
| Declarative manifest schema | ✓ | ✓ | ✓ | — | **✓** |
| Runtime register (escape hatch) | — | — | — | — | **✓** (unique — necessary for hand-rolled napplets) |
| Host-rendered settings UI | ✓ | ✓ | (admin-only) | — | **✓** |
| JSON Schema format | ✓ (subset) | bespoke | ✓ | — | **✓ (draft-07 subset)** |
| Live change events | ✓ | snapshot | ✓ | — | **✓ (subscribe-live, locked decision)** |
| Deep-link to settings | ✓ (`@ext:id`) | ✓ (`openExtensionPreferences`) | — | — | **✓ (`openSettings({ section })`)** |
| Secret handling | separate `SecretStorage` API | `password` type + Keychain | — | — | **`x-napplet-secret` marker, tiered strength** |
| Migration mechanism | deprecationMessage (manual) | — | — | — | **`$version` signal, shell-resolved** |
| Section grouping | implicit (dotted keys) | — | — | — | **`x-napplet-section`** |
| Host-enforced validation before delivery | ✓ | ✓ | ✓ | — | **✓ (MUST)** |
| Cross-instance layering | ✓ (application/machine/window/resource) | — | — | — | **— (single scope per napplet)** |

**Summary of differentiation:**

1. **Runtime `registerSchema` escape hatch** is unique to NUB-CONFIG — no precedent has it because none of them allow running an extension without their build tooling. Napplets can be hand-rolled; we need the escape hatch.
2. **Shell-resolved migration** (not extension code, not shell-invokes-extension-code) is cleaner than VSCode's "extension handles it manually" and cleaner than what would otherwise require trusting napplet code. Napplet never sees old-shape values.
3. **Tiered secret strength with explicit gradient** is more honest than "we have password fields" — we call out what web shells can and cannot do.
4. **Structural purity: napplet is strictly read-only** is more strict than any precedent. VSCode extensions can write via `configuration.update()`; Raycast cannot (matching us). Our write-free design is the strongest version.

## Edge Cases and Open Questions

### Edge cases (resolved or resolvable in spec)

- **Schema declared in manifest AND at runtime:** Manifest is authoritative; runtime `registerSchema` replaces it entirely (or: shell rejects the runtime call with "schema already declared in manifest"). Spec should pick one. Recommend: runtime register REPLACES manifest schema (latest wins), with a shell warning.
- **Schema changes while napplet is subscribed:** Trigger a fresh `config.values` push with the new-shape validated object. Napplet's subscribe callback fires with new shape.
- **Napplet subscribes before registering schema:** Shell defers the push until a schema is available; or returns an empty config object. Recommend: deferred push (matches other NUBs' lazy-init patterns).
- **Secret field receives a value that fails validation:** Shell rejects the user's input in the settings UI (never persisted, never pushed). The napplet never sees invalid values — this is what validation-before-delivery guarantees.
- **Storage quota exceeded while saving config:** Shell concern (same as NUB-STORAGE). Shell returns an error to the user at the settings UI level; napplet's existing values continue to push. Spec doesn't need to cover this.
- **User clears the napplet's config:** Shell reverts all keys to their declared defaults and pushes a new `config.values`. Defaults-applied guarantee handles it.

### Open questions for the requirements phase to resolve

- **Does `config.openSettings` require a section to be declared in the schema, or is the napplet free to request any string?** Trade-off: strict (shell knows all sections from schema, napplet can only reference declared ones) vs. loose (napplet can request any section, shell interprets best-effort). Recommend strict — reduces runtime surprise.
- **Does the shell push `config.values` on `subscribe` even if nothing has changed, or only on change?** VSCode's `onDidChangeConfiguration` fires only on change; napplet gets initial via `get`. Raycast gives you the snapshot at command launch. Our locked decision says "initial snapshot + push updates" — so `subscribe` MUST include an immediate initial push. Confirm this in requirements.
- **Does `$version` migration run on every load, or only on version bump?** Version bump is sufficient — shell tracks the last-seen `$version` per `(dTag, aggregateHash)`; if it differs, run migration; otherwise skip. Requirements should lock this.
- **Do we expose a `config.unregisterSchema` for hot-reload scenarios?** Probably yes for dev ergonomics with vite-plugin HMR. Low cost; add to P1.
- **How does vite-plugin discover the schema in napplet source?** Options: (a) convention — `config.schema.json` at napplet root, (b) export from `napplet.config.ts`, (c) inline in `vite.config.ts` under the napplet plugin's `nip5aManifest({ configSchema })` option. Recommend (c) — consistent with existing `requires` injection pattern; schema is authored alongside other manifest metadata.

## Sources

**VSCode:**
- [VSCode contribution points: configuration](https://code.visualstudio.com/api/references/contribution-points) — schema fields, scopes, unsupported `$ref`
- [VS Code API reference](https://code.visualstudio.com/api/references/vscode-api) — `workspace.getConfiguration`, `onDidChangeConfiguration`
- [VSCode deep-link to settings (DevHack)](https://www.eliostruyf.com/devhack-open-vscode-extension-settings-code/) — `workbench.action.openSettings` with `@ext:id`
- [VSCode discussion: migrating settings](https://github.com/microsoft/vscode-discussions/discussions/862) — no built-in migration, `deprecationMessage` pattern
- [VSCode SecretStorage API](https://vscode-api.js.org/interfaces/vscode.SecretStorage.html) — separate from `configuration`, OS-keychain backed
- [How to use SecretStorage in VSCode extensions](https://dev.to/kompotkot/how-to-use-secretstorage-in-your-vscode-extensions-2hco) — implementation detail, platform keychain mapping

**Chrome/Chromium MV3:**
- [Chrome Extension Storage API](https://developer.chrome.com/docs/extensions/reference/api/storage) — `storage.managed`, `storage.onChanged`
- [Chrome `managed_schema` manifest reference](https://developer.chrome.com/docs/extensions/reference/manifest/storage) — JSON Schema subset (object top-level, properties, items, `$ref`, types)
- [Chrome options page guide](https://developer.chrome.com/docs/extensions/develop/ui/options-page) — HTML-owned by extension, `options_ui.page`/`open_in_tab`, `storage.sync` persistence pattern

**Raycast:**
- [Raycast manifest: preferences](https://developers.raycast.com/information/manifest#preferences) — types (textfield, password, checkbox, dropdown, appPicker, file, directory), per-extension + per-command scope
- [Raycast Preferences API](https://developers.raycast.com/api-reference/preferences) — `getPreferenceValues()` snapshot-at-launch, `openExtensionPreferences`, `openCommandPreferences`
- [Raycast security overview](https://developers.raycast.com/information/security) — local encrypted DB + Keychain integration for passwords

**Figma:**
- [Figma plugin manifest](https://developers.figma.com/docs/plugins/manifest/) — `parameters[]` for quick-action args, no declarative settings UI

**JetBrains (comparison):**
- [IntelliJ Platform: Settings Guide](https://plugins.jetbrains.com/docs/intellij/settings-guide.html) — `ConfigurableEP`, host-rendered dialog, plugin-constructed UI component

**JSON Schema form UIs (for understanding what's possible):**
- [react-jsonschema-form widgets](https://rjsf-team.github.io/react-jsonschema-form/docs/usage/widgets/) — `uiSchema` + `ui:widget` pattern (an anti-pattern for NUB-CONFIG)
- [react-jsonschema-form customization](https://rjsf-team.github.io/react-jsonschema-form/docs/advanced-customization/custom-widgets-fields/) — registered widgets, options merge

**Existing codebase:**
- `.planning/PROJECT.md` — locked v0.25.0 decisions
- `.planning/STATE.md` — decision log (JSON Schema draft-07+, manifest+runtime registration, `$version`, x-napplet-* extensions, subscribe-live, shell-sole-writer)
- `packages/nubs/theme/` — inverse-push pattern precedent (shell → napplet values delivery)
- `packages/nubs/storage/` — `(dTag, aggregateHash)` scoping precedent

---
*Feature research for: NUB-CONFIG (v0.25.0 milestone)*
*Researched: 2026-04-17*
