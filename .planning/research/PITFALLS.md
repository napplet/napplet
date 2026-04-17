# Domain Pitfalls: Adding NUB-CONFIG (Declarative Schema-Driven Config) to a Sandboxed Iframe Protocol

**Domain:** Per-napplet declarative configuration over postMessage (napplet ↔ shell), schema = JSON Schema draft-07+
**Researched:** 2026-04-17
**Overall confidence:** HIGH (grounded in JSON Schema draft-07 specification, documented validator CVEs, the NIP-5D wire model, existing NUB modular architecture, and the `feedback_nub_scope_boundary` / `feedback_no_implementations` / `feedback_no_private_refs_commits` constraint set)

---

## Orientation: What NUB-CONFIG Is — and What It Is NOT

NUB-CONFIG is a **protocol surface**. It defines:

- Wire messages (`config.registerSchema`, `config.get`, `config.subscribe`, `config.values`, `config.openSettings`)
- A schema contract (JSON Schema draft-07+, plus `x-napplet-*` extension keys)
- MUST/SHOULD/MAY guarantees that shells promise to napplet authors
- Potentialities (`$version`, `x-napplet-secret`, `x-napplet-section`, `x-napplet-order`) that shells MAY act on

NUB-CONFIG does NOT dictate:

- Which validator library the shell uses
- Which UI paradigm the shell renders (native prefs window, modal, in-chrome drawer, CLI…)
- Migration UX (clamp, drop, ask-user, cold-start…)
- Secret storage backend (OS keychain, encrypted localStorage, in-memory only…)

Per `feedback_nub_scope_boundary`: every pitfall below is classified as either a **SPEC concern** (must appear in the NUB-CONFIG wire contract as MUST/SHOULD/MAY) or a **SHELL concern** (belongs in shell implementation docs and MUST NOT inflate NUB-CONFIG's MUST-level). This classification is the single most important output of this research — it tells the requirements phase which items become "MUST NOT" spec items and which get noted for downstream shell authors.

---

## Severity Legend

- **HIGH** — would break users (data loss, inescapable UX), exposes security vulnerability, or makes the spec unimplementable
- **MEDIUM** — produces inconsistent implementations across shells, causes ergonomic pain for napplet authors, or creates silent footguns
- **LOW** — cosmetic, recoverable, or rare-path

## Phase Legend (maps to target milestone roadmap)

- **SPEC** — NUB-CONFIG spec draft (napplet/nubs#13, public repo)
- **PACKAGE** — `nub-config` package scaffolding: types, shim installer, SDK wrappers (private @napplet repo)
- **INTEGRATION** — core dispatch, shim/SDK plumbing, vite-plugin manifest injection (private @napplet repo)
- **DOCS** — napplet repo READMEs, CLAUDE.md updates, NIP-5D table row

---

## Critical Pitfalls (HIGH severity)

### Pitfall 1: JSON Schema Feature Scope Creep → Napplets Use Features Shells Can't Render

**What goes wrong:** JSON Schema draft-07 is a huge surface: `oneOf`, `allOf`, `anyOf`, `not`, `$ref`, `if`/`then`/`else`, `dependencies`, `patternProperties`, tuple-typed arrays (`items: [schemaA, schemaB]`), negative schemas, format validators, `propertyNames`, etc. A napplet declares `oneOf: [{ type: "string" }, { type: "object", properties: { ... } }]`. Shell A (simple form renderer) shows nothing — it can't render a union. Shell B falls through silently and persists unvalidated data. Shell C throws at registerSchema time. Three shells, three behaviors. Napplet author has no idea which subset is safe.

**Why it happens:** "Use JSON Schema" is a one-line decision. "Use this subset of JSON Schema" is a 200-line spec. It is tempting to punt to "whatever draft-07 says" without carving a renderable subset.

**Scope classification:** **SPEC concern** — the wire contract must define the minimum subset shells MUST support and the maximum subset napplets SHOULD NOT exceed.

**Prevention (concrete, actionable):**
- NUB-CONFIG MUST define a **Core Subset** that every conformant shell MUST render and validate:
  - Top-level `type: "object"` with `properties`
  - Primitive types: `string`, `number`, `integer`, `boolean`
  - Array of primitives (homogeneous, NOT tuple-typed)
  - Nested objects (bounded depth — see Pitfall 2)
  - Constraints: `minimum`, `maximum`, `minLength`, `maxLength`, `enum`, `minItems`, `maxItems`, `pattern` (with caveats — see Pitfall 4)
  - `default`, `description`, `title`
  - `required` (array form)
  - `x-napplet-*` extension keys (treated as opaque metadata by shells that don't understand them)
- NUB-CONFIG SHOULD define an **Extended Subset** that shells MAY support: `oneOf` with a discriminator, `anyOf` with a discriminator, `format` as hints only, `if`/`then`/`else`
- NUB-CONFIG MUST forbid at wire level: `$ref` to external URIs, `$ref` outside the same schema document, tuple-typed arrays (`items: []`), `not`, recursive `$ref` without a depth bound
- Napplet queries capability: `window.napplet.shell.supports('nub:config:extended')` — if false, authoring tool (vite-plugin) should warn when schema uses extended features
- Vite-plugin SHOULD statically analyze the declared schema at build time and warn on non-Core features so napplet authors catch this BEFORE runtime

**Phase:** SPEC (define subset boundaries), PACKAGE (vite-plugin static analyzer)

**Confidence:** HIGH — the additionalProperties default-true behavior and $ref runtime-resolution risk are both documented JSON Schema pitfalls per official docs.

---

### Pitfall 2: Unbounded Schema Nesting / Recursive `$ref` → Stack Overflow or Render Hang

**What goes wrong:** A napplet declares a self-referential schema (e.g. a tree editor with `children: { type: "array", items: { $ref: "#" } }`). Shell's renderer recurses forever or blows the stack. Alternatively: a napplet declares 20-levels-deep nested objects "just because." Shell renders 20 nested collapsible panels — technically works, UX is dead.

**Why it happens:** JSON Schema has no built-in depth limit. Draft-07 allows `$ref: "#"` (self-reference). Validators handle it fine with cycle detection, but UI renderers don't automatically have cycle detection.

**Scope classification:** **SPEC concern** (the schema wire contract must carry a max-depth bound) + **SHELL concern** (enforcement mechanism).

**Prevention:**
- NUB-CONFIG MUST specify a maximum nesting depth (recommend: 4 levels) for the Core Subset
- NUB-CONFIG MUST forbid recursive `$ref` (any self-reference, direct or indirect) in the wire contract
- Shell MUST reject schemas exceeding the depth limit at `config.registerSchema` time with a structured error (`{ type: "config.registerSchema.error", code: "schema-too-deep", limit: 4 }`)
- Vite-plugin SHOULD validate depth at build time and refuse to emit the manifest

**Phase:** SPEC (declare depth limit + `$ref` rules), PACKAGE (vite-plugin enforcer)

**Confidence:** HIGH

---

### Pitfall 3: `$ref` Resolution — Network / Cross-Napplet / Filesystem

**What goes wrong:** A napplet declares `{ $ref: "https://evil.example/schema.json" }`. The shell's validator fetches that URL at registerSchema time (or at every validate call). This is:
1. A data exfiltration channel (the request URL itself can carry stolen values)
2. A denial-of-service vector (slow/hanging URLs block validation)
3. A TOCTOU surface (schema changes between validations)
4. A privacy leak (every validation reveals which napplet is installed + values to the remote server)

Even same-document `$ref: "#/definitions/foo"` is fine, but `$ref: "../other-napplet-schema.json"` or `$ref: "file:///etc/passwd"` is not.

**Why it happens:** Default validator behavior in many JSON Schema libraries is to auto-resolve `$ref`. Python `jsonschema` and others have documented this as a security concern when schemas are untrusted — which napplet-provided schemas always are.

**Scope classification:** **SPEC concern** (wire contract must forbid).

**Prevention:**
- NUB-CONFIG MUST forbid `$ref` with any scheme (`http://`, `https://`, `file://`, or scheme-less paths)
- NUB-CONFIG MAY allow `$ref` to the same document's `#/definitions/*` or `#/$defs/*` pointer only
- Shell MUST reject any schema with non-local `$ref` at registerSchema time
- Vite-plugin MUST reject at build time

**Phase:** SPEC (forbid external refs), PACKAGE (vite-plugin + shim-side validator), INTEGRATION (shell-side validator in reference shim)

**Confidence:** HIGH — this matches the JSON Schema official guidance to bundle refs at build time rather than resolve at runtime.

---

### Pitfall 4: `pattern` Regex → ReDoS (Regular Expression Denial of Service)

**What goes wrong:** A napplet declares `pattern: "^(a|a)*$"` (or similar catastrophic-backtracking regex) on a string field. The shell's form validates on every keystroke. User types "aaaaaaaaaaaaaaaaaaaaaaaaaaa" — the JS RegExp engine spends 44+ seconds in a single validation call, hanging the shell. Confirmed CVE territory: CVE-2025-69873 (ajv validator) demonstrates exactly this pattern — a 31-character payload causes ~44s of CPU blocking, doubling with each added character.

**Why it happens:** JSON Schema `pattern` uses ECMA-262 regex syntax. The JavaScript `RegExp` engine is backtracking-based and has exponential worst-case performance. Validators that pass `pattern` strings directly to `new RegExp()` inherit the vulnerability.

**Scope classification:** **SPEC concern** (must warn + require protection) + **SHELL concern** (pick a linear-time regex engine).

**Prevention:**
- NUB-CONFIG MUST require that shells validate `pattern` in a way that cannot hang the UI thread. Concrete guidance (SHOULD): run validation off the main thread (Web Worker) with a hard timeout, OR use a linear-time regex engine (e.g. RE2-WASM), OR disable `pattern` entirely in the Core Subset and treat it as Extended
- NUB-CONFIG MUST define a max pattern length (recommend: 512 chars) in the wire contract
- NUB-CONFIG MUST define a validation-call budget (recommend: 50ms per validate) after which the shell MUST treat the input as invalid
- The spec SHOULD explicitly name ReDoS as a risk so implementers don't have to discover it
- Vite-plugin MAY run declared patterns through a static analyzer (e.g. `safe-regex`) at build time and warn

**Phase:** SPEC (name the risk + budget), PACKAGE (build-time static analyzer), INTEGRATION (reference shim uses linear-time engine or Worker timeout)

**Confidence:** HIGH — CVE-2025-69873 is a documented real-world ReDoS in a popular JSON Schema validator.

---

### Pitfall 5: `additionalProperties` Default True → Silent Data Accretion

**What goes wrong:** JSON Schema default for `additionalProperties` is `true`. A napplet declares `{ properties: { apiKey: {...} } }`. A malicious or buggy napplet also sends `registerSchema` with an extra `{ properties: { apiKey: {...}, adminSecret: {...} } }` later — the shell's persisted store silently grows with `adminSecret` alongside user's `apiKey`. Or: legitimate napplet version 1 had `apiKey`, version 2 removes it. Shell's store still has `apiKey` (orphaned property) which now lacks a schema to validate against.

**Why it happens:** JSON Schema's default was chosen for forward compatibility in general-purpose data validation. It is the **wrong** default for a stored, persisted, user-facing settings schema.

**Scope classification:** **SPEC concern** (the wire contract must override the JSON Schema default for NUB-CONFIG's purpose).

**Prevention:**
- NUB-CONFIG MUST specify `additionalProperties: false` as the default for the top-level object when the napplet does not specify it explicitly. (Override the JSON Schema draft-07 default for NUB-CONFIG's scope.)
- NUB-CONFIG MUST specify that the shell drops (does not persist, does not deliver to napplet) any property in the stored store that is not in the current declared schema
- NUB-CONFIG SHOULD recommend shells retain unknown-property values in a "graveyard" scoped to `(dTag, aggregateHash)` for one session after schema change, in case the schema change is a bug the napplet author rolls back — but MUST not deliver them
- Napplets SHOULD always declare `additionalProperties: false` explicitly to be robust across shell implementations

**Phase:** SPEC (override the default), INTEGRATION (reference shim drops unknown props)

**Confidence:** HIGH — JSON Schema `additionalProperties` default is documented.

---

### Pitfall 6: Napplet Spoofs Another Napplet's Config via registerSchema

**What goes wrong:** Napplet A is a password manager; it registers a schema with an `x-napplet-secret: true` field for master password. Napplet B (malicious) sends `config.registerSchema` with what appears to be Napplet A's schema shape, hoping to read A's persisted secret.

**Why it happens:** Without source-identity enforcement, the shell would treat registerSchema as trust-no-one. But NIP-5D already establishes that the shell identifies senders via unforgeable `MessageEvent.source` at iframe creation — so this attack is blocked at the transport layer, NOT at NUB-CONFIG level. Still, the spec must explicitly call this out so implementers don't regress.

**Scope classification:** **SPEC concern** (reaffirm the NIP-5D source-identity guarantee in the NUB-CONFIG security considerations section).

**Prevention:**
- NUB-CONFIG Security Considerations section MUST state: "Storage is scoped by `(dTag, aggregateHash)` derived from the iframe's MessageEvent.source per NIP-5D §{X}. A napplet cannot register a schema or read values outside its own scope."
- NUB-CONFIG MUST forbid any wire message that carries a `dTag` or `aggregateHash` argument from the napplet side (prevents "I'm actually napplet-X" injection)
- The spec MUST explicitly reference NIP-5D as the parent spec

**Phase:** SPEC (security section + parent spec reference), INTEGRATION (reference shim derives scope from source only)

**Confidence:** HIGH — this is how the existing NUB family already works.

---

### Pitfall 7: Napplet Attempts to Mutate Config Directly Over the Wire

**What goes wrong:** A convenience-minded contributor adds `config.set({ key: "apiKey", value: "..." })` because "it's obvious, users will want it." Now the shell-sole-writer invariant is broken: napplet can write its own config bypassing any shell UI, consent, or validation-at-write checks.

**Why it happens:** "Of course you can write to your own config" is a seductive default. But the napplet model says: shell owns the UX, napplet is untrusted code. If napplet can write, then any compromise of the napplet silently corrupts user settings without any shell chrome showing a change occurred.

**Scope classification:** **SPEC concern** (the wire contract must MUST NOT define any napplet→shell write message).

**Prevention:**
- NUB-CONFIG wire messages napplet→shell MUST be limited to: `config.registerSchema` (schema declaration), `config.get` (one-shot read), `config.subscribe`/`config.unsubscribe` (live read), `config.openSettings` (request UI)
- NUB-CONFIG wire messages shell→napplet MUST be limited to: `config.values` (initial snapshot + push updates)
- The spec MUST explicitly state under MUST-level guarantees: "The napplet MUST NOT have any wire message that mutates persisted config values. Shell UI is the sole writer."
- If a future extension wants napplet-initiated mutation (e.g. "reset to defaults"), it MUST be gated by shell-rendered user confirmation and defined as a separate capability, NOT added to NUB-CONFIG's base surface

**Phase:** SPEC (explicit MUST NOT), PACKAGE (types do not expose a set method)

**Confidence:** HIGH — aligns with v0.25.0 design decisions in STATE.md.

---

### Pitfall 8: Secret Default Values → Baked-In Credentials

**What goes wrong:** Napplet author declares `{ apiKey: { type: "string", default: "sk-placeholder-123", "x-napplet-secret": true } }`. User installs the napplet; shell applies the default; now every user shares the same "secret" value until they change it. Or: default is legitimately empty-string but the shell renders it as placeholder text that leaks into screenshots.

**Why it happens:** Defaults + secrets are intuitively compatible ("start with this value"), but "default" + "secret" is logically incoherent — a secret with a hardcoded default is not a secret.

**Scope classification:** **SPEC concern** (the wire contract must forbid).

**Prevention:**
- NUB-CONFIG MUST specify: a property with `x-napplet-secret: true` MUST NOT have a `default` value. Shells MUST reject at registerSchema time with a structured error (`{ code: "secret-with-default" }`)
- NUB-CONFIG SHOULD recommend shells represent unset secrets as `undefined` (not empty string) in the `config.values` payload so napplet code can distinguish "secret not yet configured" from "secret is empty string"
- Vite-plugin MUST refuse to emit a manifest where `x-napplet-secret: true` coexists with `default`

**Phase:** SPEC (forbid), PACKAGE (vite-plugin enforcer)

**Confidence:** HIGH

---

### Pitfall 9: Secrets in Cleartext postMessage → Any Extension Can Read

**What goes wrong:** Shell stores secret in OS keychain (great). On `config.subscribe`, shell sends `config.values` with cleartext secret over `postMessage` into the iframe. Any browser extension with `webRequest` or content-script access to the host page sees the cleartext. Dev tools console.log of the event leaks it. Error reporting service captures it.

**Why it happens:** postMessage is not encrypted (and cannot be, since the iframe is sandboxed and has no way to do key exchange with the shell that isn't itself over postMessage — circular). The cleartext transfer is an unavoidable property of the sandbox model.

**Scope classification:** **SPEC concern** (must be called out as a known limitation and documented mitigations listed); **SHELL concern** (actual mitigations).

**Prevention:**
- NUB-CONFIG Security Considerations section MUST state: "Secret values are transmitted cleartext over postMessage to the napplet iframe at `config.values` delivery time. This is a property of the sandbox model — it is NOT a NUB-CONFIG-specific weakness. Shells and napplet authors MUST account for: browser extensions with script access, dev-tools inspection, crash reporters, analytics."
- NUB-CONFIG SHOULD recommend:
  - Shells clear console of `config.values` events that contain `x-napplet-secret: true` fields
  - Napplets SHOULD use secret values and never log them
  - Napplets SHOULD treat secrets as short-lived — read on demand via a short-TTL subscribe, don't hold in memory indefinitely
- NUB-CONFIG MUST NOT define a "decrypt in napplet" flow — there is no way to make this actually secret within the sandbox model
- Spec MUST NOT claim secrets are "secure" — the honest framing is "the shell decides when to deliver; napplet cannot enumerate without the shell's say-so"

**Phase:** SPEC (security section), DOCS (napplet author guidance)

**Confidence:** HIGH

---

## Moderate Pitfalls (MEDIUM severity)

### Pitfall 10: Subscribe-Live Race — registerSchema vs. First Snapshot

**What goes wrong:** Napplet starts; shim calls `config.registerSchema(schema)`, then `config.subscribe(callback)`. If the two messages are not serialized by the shell, the subscribe arrives first, shell has no schema, shell either: (a) sends empty `config.values`, (b) buffers forever, (c) sends an error. Napplet code that assumed defaults would be present now sees `{}` and breaks.

**Why it happens:** postMessage is ordered per-source-per-target, but shell's internal processing may still race if registerSchema triggers async work (reading from disk, decrypting secrets) before emitting values.

**Scope classification:** **SPEC concern** (the ordering guarantee must be stated).

**Prevention:**
- NUB-CONFIG MUST specify: "`config.subscribe` MUST produce its first `config.values` delivery AFTER the most recent `config.registerSchema` from the same napplet has been fully applied (defaults resolved, storage scoped, validation complete). The first delivery MUST contain all declared properties populated with either persisted values or declared defaults."
- NUB-CONFIG SHOULD specify: if `config.subscribe` is called before any `config.registerSchema`, the shell MUST return an error envelope (`{ code: "no-schema" }`) — NOT silently accept and deliver empty object later
- NUB-CONFIG MUST define: `config.registerSchema` returns a structured ack (`{ type: "config.registerSchema.result", ok: true, valuesReady: true }`) so napplets can synchronize deterministically

**Phase:** SPEC (ordering guarantee + ack message), PACKAGE (SDK wrapper should chain register→subscribe)

**Confidence:** HIGH

---

### Pitfall 11: Rapid Toggle / Debounce — Napplet Receives Every Keystroke

**What goes wrong:** User drags a slider from 0 to 100. Shell emits `config.values` on every frame. Napplet receives 60 updates/sec. If the napplet is expensive per-update (rebuilds a canvas, re-requests from a relay), the UI hangs.

**Why it happens:** "Subscribe-live" without any delivery-rate guidance invites shells to be too chatty (emit every keystroke) or too stingy (batch to 1Hz, napplet feels laggy). Napplet authors have no predictability.

**Scope classification:** Mostly **SHELL concern** (the debouncing policy) but NUB-CONFIG MUST provide a predictability contract so napplet authors aren't guessing.

**Prevention:**
- NUB-CONFIG SHOULD specify: shells SHOULD coalesce rapid value changes and deliver the terminal value only, with a soft deadline (recommend: 100ms settle time). Shells MUST NOT drop values silently — if a value is persisted, it MUST eventually appear in a `config.values` delivery.
- NUB-CONFIG MUST NOT mandate a specific debounce interval — that's shell UX
- NUB-CONFIG MUST define: every `config.values` delivery contains the CURRENT complete state (not a diff). No sequence numbers, no delta application — napplets treat each delivery as authoritative.
- NUB-CONFIG MAY define an optional `config.values` payload field `{ changed: ["key1", "key2"] }` as a HINT so napplets can skip reactions for unchanged keys — but MUST specify that the hint is non-authoritative (napplet code MUST still handle missing `changed`)

**Phase:** SPEC (state-snapshot guarantee, optional changed hint), DOCS (shell-author guidance on debouncing)

**Confidence:** MEDIUM — subscription debounce policy is a real source of inconsistency across implementations; calling it out in the spec prevents footguns.

---

### Pitfall 12: Iframe Unmount Leak — Orphaned Subscriptions

**What goes wrong:** Napplet's iframe is removed from DOM. Shell still has a subscription keyed on that window. On next value change, shell tries to postMessage to a dead window, gets an error, either logs-and-ignores (memory leak grows) or crashes its internal state.

**Why it happens:** The napplet has no chance to call `config.unsubscribe` — the unmount is abrupt.

**Scope classification:** **SHELL concern** (lifecycle cleanup). Mentioned here so NUB-CONFIG doesn't invent a bespoke heartbeat that isn't needed.

**Prevention:**
- NUB-CONFIG MUST NOT introduce heartbeats, keep-alives, or liveness probes — rely on the MessageEvent.source becoming invalid (`source.closed === true` OR `postMessage` throwing) as the unmount signal
- NUB-CONFIG spec MAY include a non-normative note: "Shells SHOULD remove subscriptions associated with a MessageEvent.source when that source becomes invalid, in line with NIP-5D lifecycle handling."
- The reference shim should demonstrate the pattern — but this is purely a shell implementation concern, not a MUST-level NUB-CONFIG rule

**Phase:** SPEC (non-normative note only), INTEGRATION (reference shim)

**Confidence:** HIGH — matches how other NUBs handle lifecycle (no heartbeat invented).

---

### Pitfall 13: Default at Property Level vs. Object Level → Ambiguous Resolution

**What goes wrong:** Schema declares an object field with both an object-level `default: { foo: "bar", baz: 1 }` AND a property-level `properties: { foo: { default: "quux" } }`. Which wins when the persisted value is missing? JSON Schema itself doesn't say; validators vary.

**Why it happens:** JSON Schema's `default` keyword is annotative — the spec does NOT normatively define how defaults are applied. Implementers have invented different behaviors.

**Scope classification:** **SPEC concern** (NUB-CONFIG must pick a rule and state it).

**Prevention:**
- NUB-CONFIG MUST specify a deterministic default resolution rule. Recommended rule:
  1. If a property value is present in persisted store AND validates, use it.
  2. Else if the property has its own `default` at property level, use that.
  3. Else if an ancestor object has a `default` that includes this property, use the ancestor's value for this property.
  4. Else the property is `undefined` in the delivered `config.values`.
- NUB-CONFIG MUST forbid defaults at nested depths greater than the nesting depth limit (Pitfall 2)
- NUB-CONFIG SHOULD prohibit recursive defaults (default object containing references to other defaults) — not expressible in JSON Schema anyway, but call out that the shell MUST NOT try to be clever

**Phase:** SPEC (resolution rule)

**Confidence:** MEDIUM — JSON Schema defaults are notoriously underspecified; picking a rule is essential for spec-level predictability.

---

### Pitfall 14: Schema Evolution — Tightened Constraints Orphan Valid User Values

**What goes wrong:** Napplet v1 declares `{ maxItems: 100 }`. User fills in 75 items. Napplet v2 changes to `{ maxItems: 50 }`. User launches v2. Shell's options:
- (a) Reject v2's registerSchema — version is unusable
- (b) Clamp the array to 50 — silent data loss
- (c) Keep 75 items, allow schema violation — the schema is a lie
- (d) Ask the user what to do — modal on every launch
- (e) Migrate via `$version` delta — napplet author writes a migrator

None of these is right for every case. The napplet author needs to know which will happen.

**Scope classification:** NUB-CONFIG defines the PROBLEM surface (`$version` as a potentiality, what the shell MAY do); the actual resolution is **SHELL concern**.

**Prevention:**
- NUB-CONFIG MUST specify that a schema MAY carry a `$version` integer field (potentiality). Shells MAY use it to run migrations; shells MAY ignore it.
- NUB-CONFIG MUST specify that napplets MUST NOT receive values that violate the currently-registered schema at `config.values` delivery time — the shell is responsible for guaranteeing this. If that means clamping, dropping, or asking the user, that is shell's choice.
- NUB-CONFIG MUST explicitly document (in a "Schema Evolution Notes" non-normative section) that:
  - Renaming a property is a schema-destructive change (old name is now unknown, additionalProperties:false drops it); napplet authors SHOULD avoid renames or provide a `$version` bump with migration expectations
  - Type changes are schema-destructive (`integer` → `string` cannot be coerced without loss)
  - Tightening constraints may cause out-of-bound values; napplet authors MUST accept that shells MAY clamp, drop, or refuse
  - Removing a property leaves orphaned values; with `additionalProperties:false` default, shells MUST drop them from delivery (Pitfall 5)
- NUB-CONFIG MUST NOT mandate a specific migration strategy — that's shell UX

**Phase:** SPEC (non-normative guidance + $version potentiality), DOCS (napplet author guidance)

**Confidence:** HIGH

---

### Pitfall 15: Orphaned Values After Property Removal — Privacy Bomb

**What goes wrong:** User configures `apiKey` in napplet v1. Napplet v2 removes `apiKey` from schema. Shell retains `apiKey` in persisted store "just in case." User thinks they've wiped their key by removing the napplet and reinstalling — it's still there. Or worse: a future napplet v3 re-adds `apiKey`; now they get the old key silently applied.

**Why it happens:** Cautious persistence feels safer, but for user-settings (especially secrets), "retain unknown" is a privacy violation.

**Scope classification:** **SPEC concern** (MUST define the retention policy).

**Prevention:**
- NUB-CONFIG MUST specify: upon `config.registerSchema`, the shell MUST NOT deliver any persisted value whose property is not in the current schema. (Already covered by Pitfall 5's `additionalProperties: false` default.)
- NUB-CONFIG SHOULD specify: shells SHOULD delete persisted values for properties not in the current schema after a grace period (e.g. one session), UNLESS the shell provides an explicit "recover orphaned values" UX
- NUB-CONFIG MUST specify: for properties marked `x-napplet-secret: true`, shells MUST delete orphaned values IMMEDIATELY on registerSchema (no grace period for secrets)
- NUB-CONFIG MUST specify: on napplet uninstall (if such a concept exists at the shell level), all persisted values for that `(dTag, aggregateHash)` scope MUST be deleted; shells MUST NOT orphan them

**Phase:** SPEC (retention MUSTs)

**Confidence:** HIGH

---

### Pitfall 16: aggregateHash-Coupled Storage — Non-Schema Changes Invalidate Values

**What goes wrong:** The `aggregateHash` changes on any napplet file change (README, a CSS file), not just schema changes. If storage is keyed on `(dTag, aggregateHash)`, a trivial build update orphans all user values. Shell has to migrate — but since values may not have changed meaning, migration is just "copy old to new" which defeats the point of hash-scoping.

Conversely: if storage is keyed on `dTag` alone (not hash), an older napplet version can read newer-version values (which may violate its older schema), leading to validation errors at load.

**Why it happens:** `aggregateHash` is already the shell's identity unit per v0.9.0 design. Using it as the storage key was the obvious choice. The tradeoff is: every build = new scope. That's a feature (isolation) AND a bug (value loss).

**Scope classification:** **SPEC concern** — the spec must make this tradeoff explicit so napplet authors aren't surprised.

**Prevention:**
- NUB-CONFIG MUST specify storage scope as `(dTag, aggregateHash)` — this aligns with v0.25.0 design decisions and existing NUB-STORAGE behavior
- NUB-CONFIG MUST document (in a "Storage Scope Notes" non-normative section):
  - Any change to the napplet's aggregate hash creates a new scope
  - Shells MAY implement cross-hash migration on `$version` bump as a potentiality
  - Shells MAY NOT migrate silently across `dTag` changes (different napplet identity = different user intent)
- Napplet authors SHOULD use stable `dTag` across versions and rely on shell-defined migration for value continuity
- NUB-CONFIG MUST NOT mandate any specific cross-hash behavior — that's shell UX

**Phase:** SPEC (scope rule + non-normative notes)

**Confidence:** HIGH

---

### Pitfall 17: `openSettings` Spam / Focus Steal

**What goes wrong:** A malicious or buggy napplet calls `config.openSettings({})` in a tight loop. Shell's settings modal/drawer opens, closes, opens, closes. Focus ping-pongs. User can't interact with anything else.

**Why it happens:** `openSettings` is a user-facing UX trigger controllable by untrusted napplet code. Same class of risk as focus-stealing in the keys NUB (Pitfall 5 in the v0.20.0 keys research).

**Scope classification:** The rate limiting is **SHELL concern** (shells decide their own UX); but NUB-CONFIG MUST permit shells to rate-limit and MUST NOT require shells to honor every call.

**Prevention:**
- NUB-CONFIG MUST specify: `config.openSettings` is a REQUEST, not a command. Shells MAY ignore, delay, batch, or rate-limit calls at their discretion. Napplets MUST NOT assume calling openSettings guarantees the settings UI appears.
- NUB-CONFIG MUST specify: shells SHOULD only honor `config.openSettings` when the calling napplet has (or would have) user focus — not for background napplets
- NUB-CONFIG MAY specify a soft rate-limit suggestion (non-normative): shells MAY ignore repeated calls within 1s of the previous
- NUB-CONFIG MUST NOT define a response/ack — the napplet cannot rely on confirmation

**Phase:** SPEC (non-normative guidance), INTEGRATION (reference shim rate-limits)

**Confidence:** MEDIUM — pattern observed in keys NUB research; protection principle transfers cleanly.

---

### Pitfall 18: `openSettings({ section })` Deep-Link to Nonexistent Section

**What goes wrong:** Napplet calls `config.openSettings({ section: "billing" })`. Shell's renderer has no "billing" section (napplet's schema uses different section names, OR the napplet is on an older/newer version than the shell expected). Shell either: shows an empty panel, shows the wrong panel, or silently ignores the request. Napplet author can't tell what happened.

**Why it happens:** `section` is a string that both sides must agree on — the napplet's schema declares `x-napplet-section: "billing"` on some property, and openSettings expects that string to match. If schema and code drift, deep-linking breaks.

**Scope classification:** **SPEC concern** (define the matching rule) + **SHELL concern** (error UX).

**Prevention:**
- NUB-CONFIG MUST specify: the `section` argument to openSettings matches the `x-napplet-section` value on one or more properties in the napplet's registered schema. If no property has that section, behavior is shell-defined (SHOULD show the top of settings; MAY silently ignore).
- NUB-CONFIG SHOULD specify: shells SHOULD NOT send an error back to the napplet for unknown section (to avoid leaking shell internals). If the spec allows an ack, it's a fire-and-forget ack ("request received," not "section found").
- NUB-CONFIG MUST specify: `section` is case-sensitive, trimmed, and not interpreted as HTML/path — just an opaque string matched against `x-napplet-section` values

**Phase:** SPEC (matching rule)

**Confidence:** MEDIUM

---

### Pitfall 19: `format` Validators — Inconsistent Support Across Shells

**What goes wrong:** Napplet declares `{ email: { type: "string", format: "email" } }`. Shell A uses `ajv` with `ajv-formats` — real validation. Shell B uses a minimal validator that treats `format` as a hint only. Shell C uses a regex for email that accepts "foo@bar" but rejects "foo@bar.co.uk" (notorious email regex bug).

**Why it happens:** JSON Schema `format` is annotative by default in draft-07+. Validators vary hugely on which formats they enforce and how strictly.

**Scope classification:** **SPEC concern** (declare `format` is hint-only in NUB-CONFIG).

**Prevention:**
- NUB-CONFIG MUST specify: `format` is a HINT for UI rendering (input type, autocomplete), NOT a validation requirement. Shells MUST NOT reject a value solely because it fails `format`.
- NUB-CONFIG SHOULD enumerate a list of recognized `format` hints that shells SHOULD render with appropriate UI: `email`, `uri`, `date`, `time`, `date-time`, `color`, `ipv4`, `ipv6`
- Napplets requiring strict validation MUST use `pattern` (with ReDoS protection per Pitfall 4), `minLength`, `maxLength`, or `enum` — not `format`
- NUB-CONFIG MUST NOT mandate any format validation library

**Phase:** SPEC (format as hint, enumerate known formats)

**Confidence:** HIGH — JSON Schema draft-07+ makes `format` annotative by default.

---

## Minor Pitfalls (LOW severity)

### Pitfall 20: Duplicate `config.registerSchema` Within a Session

**What goes wrong:** Napplet calls registerSchema twice, or three times, during its lifecycle (e.g. lazy-load of a feature that extends config). Each call potentially changes the schema. What happens to in-flight subscribe deliveries? What about user values already entered against the old schema?

**Why it happens:** Napplets may have dynamic features; schema may legitimately grow. But the spec could interpret "duplicate" either as "replace completely" or "merge."

**Scope classification:** **SPEC concern** (pick a semantic).

**Prevention:**
- NUB-CONFIG MUST specify: each `config.registerSchema` call REPLACES the previous schema completely for that napplet's scope. No merging.
- NUB-CONFIG MUST specify: replacement triggers the same orphan-value handling as schema evolution (Pitfalls 5 and 15)
- NUB-CONFIG SHOULD recommend napplets call registerSchema exactly once, at startup, immediately after shim initialization
- Manifest-declared schema (via vite-plugin) SHOULD take precedence and MAY prohibit runtime registerSchema entirely — that's a shell policy

**Phase:** SPEC (replace semantics)

**Confidence:** HIGH

---

### Pitfall 21: `x-napplet-order` Collision / Non-Integer / Missing

**What goes wrong:** Two properties both declare `x-napplet-order: 1`. Or a property declares `x-napplet-order: "first"` (string, not number). Or most properties omit it. Shell renderer has to pick an order — alphabetical? declaration order? object-key order (implementation-dependent)?

**Scope classification:** **SPEC concern** (state the rules).

**Prevention:**
- NUB-CONFIG MUST specify `x-napplet-order` is a finite non-negative number (integer or float; floats allow "insert between 1 and 2" as 1.5)
- NUB-CONFIG MUST specify ordering rule: properties with `x-napplet-order` set come first, sorted ascending. Ties broken by property key alphabetical order. Properties without `x-napplet-order` come after, sorted alphabetically.
- Shells MAY render in a different order for accessibility (e.g. grouping by section first) — `x-napplet-order` is a HINT within a section
- Vite-plugin MAY warn on ordering collisions at build time

**Phase:** SPEC (ordering rule)

**Confidence:** MEDIUM

---

### Pitfall 22: Clock-Synchronized Defaults / "Random" Defaults

**What goes wrong:** Napplet author wants a default that's `Date.now()` or a random UUID. JSON Schema has no way to express this. Napplet ends up either: (a) hardcoding a literal value (bad for UUID), (b) leaving `default` off and hoping user sets it, (c) treating "not yet set" as a special sentinel.

**Why it happens:** JSON Schema defaults are literal values, not expressions. There's no SQL-like DEFAULT NOW().

**Scope classification:** **SPEC concern** (state the limitation; don't invent a new expression language).

**Prevention:**
- NUB-CONFIG MUST state: `default` values are literal JSON values per JSON Schema draft-07 semantics. There is no expression evaluation.
- Napplets needing runtime-generated defaults MUST handle "value is undefined" in their own code — treat it as "compute a default on first use, and the user will see it as soon as they open settings."
- NUB-CONFIG MUST NOT invent syntactic sugar like `"default": "$now()"` — violates scope and creates a footgun

**Phase:** SPEC (explicit statement)

**Confidence:** HIGH

---

### Pitfall 23: i18n — Schema `title` / `description` Are String-Only

**What goes wrong:** Napplet wants to ship multi-language settings. JSON Schema `title` / `description` are single strings. Shells have no way to pick a locale. Napplet ships English only; Japanese users see English labels.

**Why it happens:** JSON Schema is not i18n-aware.

**Scope classification:** **SHELL concern** (renderer); NUB-CONFIG can mention but should NOT try to solve.

**Prevention:**
- NUB-CONFIG Non-normative section: acknowledge i18n is out of scope for v1
- NUB-CONFIG MAY reserve `x-napplet-i18n` as a future extension without defining it in v1
- NUB-CONFIG MUST NOT invent a locale-map schema extension in v1 — scope creep

**Phase:** SPEC (acknowledge out of scope)

**Confidence:** HIGH (by omission — deliberately deferred)

---

### Pitfall 24: Vite-Plugin Injects Invalid JSON Schema into Manifest

**What goes wrong:** Vite-plugin builds the NIP-5A manifest with a config schema. Napplet's schema has a typo (`{ type: "strng" }`). Manifest ships. Shell loads it, fails at registerSchema time with a cryptic error. Napplet author doesn't see the error until runtime.

**Scope classification:** **PACKAGE concern** (vite-plugin side).

**Prevention:**
- Vite-plugin MUST run the schema through a JSON-Schema-meta-schema validator at build time
- Vite-plugin MUST also run the NUB-CONFIG subset checker (Pitfalls 1-4 checks — forbidden features, depth limit, ReDoS-prone patterns, `$ref` URIs, additionalProperties default, secret+default coexistence)
- Build fails if schema is invalid — no shipping broken manifests
- Reference this in the nub-config package README

**Phase:** PACKAGE (vite-plugin)

**Confidence:** HIGH

---

### Pitfall 25: Public-Repo Leakage — Spec References @napplet/* Packages

**What goes wrong:** The NUB-CONFIG spec (napplet/nubs#13, PUBLIC repo) gets written with references like "See `@napplet/nub-config` package for reference implementation" or "Implementations: `@napplet/nub-config`." This violates the private-repo boundary per `feedback_no_implementations` and `feedback_no_private_refs_commits` memories.

**Why it happens:** The agent drafts spec and package in the same session. Cross-references feel natural. Memory compliance requires active vigilance.

**Scope classification:** **SPEC concern** + **DOCS concern** (process rule).

**Prevention:**
- NUB-CONFIG spec Implementations section MUST be `(none yet)` — no exceptions
- NUB-CONFIG spec body MUST NOT mention `@napplet/*`, "the reference shim," "the napplet package," or any private-repo artifact
- Commit messages in the napplet/nubs repo MUST describe the protocol change only — never reference private packages
- PR body in nubs repo MUST describe the wire contract — never link to the private @napplet repo
- Cross-references (private napplet repo → public nub spec) are fine — the napplet repo's own READMEs MAY link to napplet/nubs#13
- Reverse is NOT fine — nubs#13 MUST NOT link back

**Phase:** SPEC (discipline), DOCS (process)

**Confidence:** HIGH — matches explicit memory entries.

---

### Pitfall 26: Missing Error Envelopes — Protocol Undefined for Failure Paths

**What goes wrong:** Napplet calls `config.registerSchema` with an invalid schema. What comes back? Nothing? A promise rejection? An ack with `ok: false`? If not defined in the wire spec, every shell does something different — and napplet SDK can't provide a consistent error handling story.

**Scope classification:** **SPEC concern**.

**Prevention:**
- NUB-CONFIG MUST define, for EVERY napplet→shell message type, either:
  - "fire and forget" (napplet cannot observe success/failure) — and justify why
  - A matching `*.result` message type with `{ ok: boolean, code?: string, message?: string }` shape
- Enumerate error codes at spec level so napplets can match on them: `no-schema`, `schema-invalid`, `schema-too-deep`, `ref-not-allowed`, `secret-with-default`, `quota-exceeded`, `rate-limited`
- NUB-CONFIG MUST reference NIP-5D's envelope format (`{ type, ...payload }`) and not invent a new error shape

**Phase:** SPEC (error catalog)

**Confidence:** HIGH

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|---|---|---|---|
| "JSON Schema draft-07" with no subset defined | Fast spec draft | Every shell renders differently; napplet authors can't target a subset safely | Never — the subset MUST be defined in the initial spec |
| Allow `$ref` because "the validator handles it" | One less thing to forbid | Data exfiltration, DoS, privacy leak vectors | Never — same-document refs only |
| Let `format` be strict validation instead of hints | Napplets get "free" email validation | Shell-to-shell inconsistency; a working napplet on Shell A breaks on Shell B | Never — `format` is hint-only |
| Skip defining error envelopes — "just use try/catch" | Slightly smaller spec | SDK can't provide typed errors; each shell invents its own | Never — error shape MUST be in spec |
| Don't require vite-plugin schema validation | Faster plugin code | Napplet authors ship broken schemas and discover at runtime | Only if the reference shim runs the same checks at load time (belt-and-suspenders) |
| Treat `x-napplet-order` ties as implementation-defined | Less spec text | Properties reorder between builds for no visible reason | Never — deterministic rule required |
| Allow napplet→shell "config.set" for convenience | DX shortcut for napplet authors | Breaks shell-sole-writer invariant, bypasses user consent UX | Never — this is the core architectural line |
| Defer schema evolution notes to later milestone | Shorter v1 spec | First napplet upgrade breaks; authors have no guidance | Only if the milestone explicitly calls schema evolution "out of scope for v1" — otherwise non-normative note is cheap and prevents confusion |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|---|---|---|
| Vite-plugin → manifest | Silently drop invalid schemas | Fail the build with a clear error pointing at the offending property path |
| Shim → core dispatch | Register a `config` domain handler globally (not per-napplet-source) | Scope handlers by MessageEvent.source per NIP-5D; derive `(dTag, aggregateHash)` from source identity, never from napplet payload |
| SDK wrapper → subscribe | Call subscribe before register returns | Chain internally: `await registerSchema(); return subscribe(cb)` — SDK convenience over spec wire order |
| NIP-5D Known NUBs table | Add `@napplet/nub-config` as implementation | Leave "Implementations" column empty per public-repo rule |
| Reference shim → validator library | Bundle `ajv` @ default config | Disable `$data`, disable `$ref` auto-fetch, wrap `pattern` in Worker with timeout OR use RE2-WASM |
| Manifest parser (shell side) | Assume all `x-napplet-*` keys are known | Treat unknown `x-napplet-*` as opaque metadata; don't reject the schema |
| `openSettings` handler | Always open modal, even if napplet is backgrounded | Only honor for the focused napplet per Pitfall 17 |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|---|---|---|---|
| ReDoS via `pattern` on keystroke validate | Main thread hangs 5s+ on certain inputs | Worker-based validator with 50ms timeout, OR linear-time regex engine | Any napplet declaring a regex; exploitable by malicious napplet OR by careless regex author |
| Unbounded schema depth rendering | Render time balloons exponentially for deeply nested objects | Depth limit enforced at registerSchema | Schema with 10+ nesting levels |
| Per-keystroke `config.values` broadcast to all subscribers | postMessage flooding, napplets lag | Coalesce emits per Pitfall 11 | Any slider-style or high-frequency setting |
| No debounce between rapid `config.openSettings` calls | Settings UI flickers, user cannot use anything | Rate-limit per Pitfall 17 | Malicious or buggy napplet |
| Large default values (megabyte strings) re-sent on every subscribe update | Message channel saturation | Limit default value size in wire contract (recommend 64KB per property); shells MAY enforce quota per `(dTag, aggregateHash)` | Any napplet with base64-embedded assets in defaults |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---|---|---|
| External `$ref` resolution at registerSchema | Exfiltration of machine identity, DoS, cache poisoning | Forbid non-local `$ref` in wire contract (Pitfall 3) |
| Trusting napplet-supplied `dTag` / `aggregateHash` in messages | Cross-napplet scope escape | Derive scope from MessageEvent.source only (Pitfall 6) |
| Secret field with a declared default | Shared-credential leak to every user | Forbid (Pitfall 8) |
| Persist unknown properties "just in case" | Stale secrets remain after napplet drops them | Drop immediately for secret fields; grace period for non-secret (Pitfall 15) |
| Validate `pattern` on UI thread with default RegExp | ReDoS hangs the entire shell | Worker + timeout or linear-time engine (Pitfall 4) |
| Napplet can openSettings to steal focus | Focus ping-pong, keystroke hijack | Shell MAY ignore; rate limit (Pitfall 17) |
| Napplet writes its own config | Bypasses user consent, schema validation, shell UX | No napplet→shell write message exists (Pitfall 7) |
| postMessage secret values cleartext | Any extension with script access reads | Document as known limitation; don't pretend it's solved (Pitfall 9) |

---

## UX Pitfalls (flagged as shell-concern but worth calling out for DOCS)

| Pitfall | User Impact | Shell-Side Mitigation (non-normative in spec) |
|---|---|---|
| Settings open while typing a URL / editing another field | Lost focus, data loss | Shells SHOULD animate settings into a side drawer, not a modal |
| First-launch empty-settings state | User doesn't know where to begin | Shells SHOULD show declared descriptions prominently |
| Rebind UI pre-rendered before values arrive | Flash of default content then "correct" values swap in | SDK's subscribe wrapper exposes a `loading` state until first delivery |
| Secret field copy-paste | User copies value, pastes into shared doc | Shells SHOULD mask in UI AND block clipboard copy for `x-napplet-secret: true` fields |

These are documented to guide shell authors but MUST NOT appear as MUST-level requirements in NUB-CONFIG.

---

## "Looks Done But Isn't" Checklist

- [ ] **Wire messages:** `config.registerSchema.result` / `config.get.result` / etc. defined for EVERY napplet→shell request — verify error envelopes specified
- [ ] **JSON Schema subset:** Core Subset vs Extended Subset enumerated explicitly — verify forbidden features listed
- [ ] **`$ref` rules:** Wire contract forbids external/filesystem/cross-doc refs — verify with a test schema
- [ ] **Secret handling:** `x-napplet-secret: true` + `default` combination forbidden — verify at build time (vite-plugin) AND runtime (shell)
- [ ] **additionalProperties default:** NUB-CONFIG overrides JSON Schema default to `false` at top level — verify documented
- [ ] **Source identity:** Security considerations section references NIP-5D MessageEvent.source binding — verify parent spec cited
- [ ] **No napplet→shell write:** No `config.set` or `config.update` message exists in the type catalog — verify wire message list
- [ ] **Error codes:** Enumerated set of error codes, not ad-hoc strings — verify catalog exists
- [ ] **Public repo hygiene:** Spec `## Implementations` section is `(none yet)` and no `@napplet/*` mentions anywhere in spec, commits, or PR bodies — verify before submitting PR
- [ ] **Migration guidance:** Schema evolution non-normative notes present — verify it discusses rename, type change, constraint tightening, property removal
- [ ] **Ordering deterministic:** `x-napplet-order` rule plus tie-break rule stated — verify two-property collision test case documented
- [ ] **Depth limit:** Max nesting depth stated as a number — verify
- [ ] **Pattern protection:** ReDoS mitigation requirement stated — verify shell guidance exists
- [ ] **Format annotative:** `format` declared as hint-only — verify
- [ ] **Orphan values:** Retention rule defined — verify secrets drop immediate, non-secrets grace period
- [ ] **openSettings:** Non-binding semantics stated — verify shells MAY ignore
- [ ] **Vite-plugin enforcement:** Plugin runs schema through meta-schema + subset checker at build — verify in PACKAGE phase checklist
- [ ] **Subscribe ordering:** First `config.values` delivery happens AFTER registerSchema settles — verify explicit in spec

---

## Pitfall-to-Phase Mapping

| Pitfall | Severity | Prevention Phase | Verification |
|---|---|---|---|
| P1 — Feature subset scope creep | HIGH | SPEC | Read the subset definition section; look for enumerated Core/Extended lists |
| P2 — Unbounded nesting / recursive $ref | HIGH | SPEC + PACKAGE | Test schema with depth=5 (should reject if limit=4); test `$ref: "#"` (should reject) |
| P3 — External $ref resolution | HIGH | SPEC + PACKAGE | Test schema with `$ref: "https://..."` (should reject at build AND runtime) |
| P4 — pattern ReDoS | HIGH | SPEC + INTEGRATION | Test with `^(a|a)*$` and 31-char input against reference shim — must not hang main thread |
| P5 — additionalProperties default true | HIGH | SPEC | Read default resolution rule; test schema with no additionalProperties — verify shell treats top-level as `false` |
| P6 — Source identity scope spoof | HIGH | SPEC | Verify security considerations cites NIP-5D source binding |
| P7 — Napplet config write | HIGH | SPEC + PACKAGE | Inspect wire message catalog — no `config.set` anywhere |
| P8 — Secret + default | HIGH | SPEC + PACKAGE | Test schema with both (should reject at build AND runtime) |
| P9 — Cleartext secret over postMessage | HIGH | SPEC + DOCS | Read security considerations — must acknowledge as inherent |
| P10 — registerSchema/subscribe race | MEDIUM | SPEC + PACKAGE | SDK wrapper chains register→subscribe internally |
| P11 — Delivery debounce undefined | MEDIUM | SPEC + DOCS | Read subscribe semantics — value snapshot always current-complete |
| P12 — Orphaned subscriptions | MEDIUM | INTEGRATION | Reference shim shows source-death cleanup |
| P13 — Default precedence ambiguity | MEDIUM | SPEC | Read resolution rule section — property-level wins over object-level |
| P14 — Schema evolution orphans values | MEDIUM | SPEC + DOCS | Non-normative section enumerates rename/retype/tighten/remove cases |
| P15 — Orphaned persisted values | HIGH | SPEC | Retention rule stated; secrets drop immediate |
| P16 — aggregateHash scope churn | MEDIUM | SPEC + DOCS | Scope rule stated; cross-hash migration noted as shell concern |
| P17 — openSettings spam | MEDIUM | SPEC + INTEGRATION | Non-binding semantics stated; reference shim rate-limits |
| P18 — openSettings unknown section | MEDIUM | SPEC | Matching rule against `x-napplet-section`; behavior for unknown stated |
| P19 — format inconsistency | HIGH | SPEC | `format` annotative only; enumerated known hints |
| P20 — Duplicate registerSchema | LOW | SPEC | Replace-not-merge semantics stated |
| P21 — x-napplet-order collision | LOW | SPEC | Tie-break rule stated |
| P22 — Runtime-computed defaults | LOW | SPEC | Explicit note that defaults are literal |
| P23 — i18n unaddressed | LOW | SPEC | Explicit out-of-scope acknowledgement |
| P24 — Vite-plugin ships invalid schemas | LOW | PACKAGE | Plugin runs meta-schema + subset check at build |
| P25 — @napplet references in public spec | HIGH | SPEC + DOCS | Grep public spec for `@napplet/` — must return zero |
| P26 — Undefined error envelopes | HIGH | SPEC | Error code catalog present; every request has a result type |

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---|---|---|
| Spec shipped without subset definition | HIGH | Amend spec, tag as v1.1 in nubs repo, coordinate with any shell implementors, add subset-check to vite-plugin |
| External $ref allowed in v1 | HIGH | Emergency spec amendment; shell implementors must ship a fix; audit deployed napplets for external refs |
| Secret + default coexistence shipped | HIGH | Shell implementations add runtime rejection; napplet authors must rev their schemas |
| Napplet→shell write message shipped | HIGH | Protocol-level breaking change; bump NUB-CONFIG version; all shells must drop the message type |
| @napplet/* leaked into public spec or commit history | MEDIUM | Cannot remove from git history cleanly; amend future commits + PR bodies; note in PR that prior references are errata |
| Orphaned values retained after property removal | MEDIUM | Shell ships a migration that drops orphans; secrets forcibly purged |
| pattern ReDoS in production | HIGH | Emergency patch to shell's validator; disable pattern validation while fix ships; notify napplet authors |
| Subscribe race causing empty deliveries | MEDIUM | SDK wrapper adds internal serialization; no spec change needed |

---

## Sources

### JSON Schema Specification and Risks
- [JSON Schema draft-07 object keyword reference](https://json-schema.org/understanding-json-schema/reference/object) — additionalProperties defaults to true; confirms Pitfall 5
- [JSON Schema modular combination — $ref security warning](https://json-schema.org/understanding-json-schema/structuring) — official guidance to bundle refs rather than resolve at runtime; supports Pitfall 3
- [Learn JSON Schema — $ref (Draft 7)](https://www.learnjsonschema.com/draft7/core/ref/) — documents draft-07 sibling-keyword-ignored behavior
- [Python jsonschema referencing docs](https://python-jsonschema.readthedocs.io/en/latest/referencing/) — documents ref resolution security concerns with untrusted schemas
- [Understanding JSON Schema — Conditional validation](https://json-schema.org/understanding-json-schema/reference/conditionals) — context for Extended Subset conditionals

### ReDoS (Regular Expression Denial of Service)
- [CVE-2025-69873 — ajv ReDoS via pattern keyword](https://security.snyk.io/vuln/SNYK-JS-AJV-15274295) — concrete proof 31-char payload → 44s CPU blocking; supports Pitfall 4
- [GHSA-2g4f-4pwh-qvx6 — ajv ReDoS advisory](https://osv.dev/vulnerability/GHSA-2g4f-4pwh-qvx6) — independent confirmation
- [Ajv security considerations](https://ajv.js.org/security.html) — recommends linear-time regex engine; guidance cited in Pitfall 4 mitigation
- [Learn JSON Schema — pattern (2020-12)](https://www.learnjsonschema.com/2020-12/validation/pattern/) — documents ECMA-262 regex semantics

### NIP-5D / Napplet Context (internal — private repo, not cited in any public spec)
- `.planning/PROJECT.md` — milestone scope and existing NUB modular architecture
- `.planning/STATE.md` — v0.25.0 design decisions (JSON Schema draft-07+, shell-sole-writer, storage scope, $version potentiality)
- Existing v0.20.0 PITFALLS research (keys NUB) — focus-stealing pattern transfer (Pitfall 17)

### Internal Memory (constraint set)
- `feedback_nub_scope_boundary` — NUBs define protocol, not shell implementation (drives every scope classification above)
- `feedback_no_implementations` — no `@napplet/*` in NUB specs (drives Pitfall 25)
- `feedback_no_private_refs_commits` — public nubs repo must not reference private napplet repo (drives Pitfall 25)
- `feedback_nub_modular` — NUB packages own ALL logic (informs PACKAGE phase expectations)

---

*Pitfalls research for: NUB-CONFIG (v0.25.0 milestone)*
*Researched: 2026-04-17*
