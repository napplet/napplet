# Phase 111: NUB-CONFIG Spec - Context

**Gathered:** 2026-04-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Draft the public NUB-CONFIG specification in the `napplet/nubs` PUBLIC repository (at `/home/sandwich/Develop/nubs/`) defining the JSON-Schema-driven per-napplet configuration wire contract. Spec must contain zero `@napplet/*` references (PUBLIC repo rule per memory `feedback_no_private_refs_commits` and `feedback_no_implementations`). Downstream phases (112-116) implement the spec in this private repo.

The spec defines: Core Subset of JSON Schema; six wire messages; shell MUST/SHOULD/MAY guarantees; anti-features explicitly rejected; security considerations; error envelopes. Implementation patterns, validator libraries, and settings UI choices are OUT of scope (shell concerns per `feedback_nub_scope_boundary`).

Addresses requirements SPEC-01 through SPEC-08.

</domain>

<decisions>
## Implementation Decisions

### Spec Conventions (locked via smart discuss 2026-04-17)
- Correlation-ID field name is `id` (matches NUB-IDENTITY / NUB-STORAGE convention)
- `config.values` is dual-use: same message type for both `config.get` response and subscription push; distinguished by presence (`id` set → response) vs absence (`id` omitted → push)
- `config.registerSchema` uses positive-ACK pattern: `config.registerSchema.result` with `{ id, ok: boolean, error? }` on every call (not error-only). Matches prior NUB convention.
- Spec includes one minimal example JSON postMessage envelope per wire message type (matches NUB-NOTIFY / NUB-IDENTITY layout)

### Spec Structure (follows nubs/NUB-IDENTITY.md template)
- Header: `draft` status, NUB ID, Namespace (`window.napplet.config`), Discovery (`shell.supports("config")`)
- Description: 1-2 paragraph overview of the per-napplet declarative config model
- API Surface: TypeScript interfaces for `NappletConfig`, `ConfigSchema`, `ConfigValues`
- Schema Contract: Core Subset enumeration (types, keywords, constraints, extensions, `$version`); explicit non-inclusion of `pattern` with ReDoS rationale
- Wire Protocol: table of the six message types + `.result` responses; example envelopes
- Shell Guarantees: MUST / SHOULD / MAY tables
- Anti-Features: explicitly rejected with one-line rationale each
- Security Considerations: source-identity binding, cleartext-postMessage limitation, `additionalProperties: false` override, external `$ref` forbidden
- Error Envelopes: malformed schema, undeclared section in openSettings, subscribe-before-schema
- References: parent NIP-5D by number only (no implementation links)

### Locked (from milestone-level decisions, do NOT re-litigate)
- JSON Schema draft-07+ (subset)
- `$version` as potentiality (shells decide migration behavior)
- Extensions: `x-napplet-secret`, `x-napplet-section`, `x-napplet-order`, `deprecationMessage`, `markdownDescription`
- `pattern` NOT in Core Subset (ReDoS risk, CVE-2025-69873)
- Shell is sole writer; napplet only reads/subscribes/requests-settings-open
- Storage scoped by `(dTag, aggregateHash)`
- Six wire messages: `config.registerSchema`, `config.get`, `config.subscribe`, `config.unsubscribe`, `config.values`, `config.openSettings`
- `config.openSettings` section must be declared via `x-napplet-section` (strict scope)
- `config.subscribe` MUST trigger an immediate initial `config.values` push
- Anti-features: no `config.set`, no `$ref`/`definitions`, no napplet-rendered settings iframe, no napplet-supplied validation code

### Claude's Discretion
- Exact prose wording of MUST / SHOULD / MAY clauses
- Table column layouts and section ordering within the overall structure
- Whether to inline one TypeScript interface block or split by concern
- Choice of example schema shape (simple theme/notify napplet config)
- Footnote format for RFC-2119 terminology

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `/home/sandwich/Develop/nubs/TEMPLATE-NN.md` — canonical template for new NUB specs
- `/home/sandwich/Develop/nubs/NUB-IDENTITY.md` (on `nub-identity` branch) — most recent exemplar for shape
- `/home/sandwich/Develop/nubs/NUB-NOTIFY.md` (on `nub-notify` branch) — similar structure with action-rich API
- `/home/sandwich/Develop/nubs/NUB-MEDIA.md` (on `nub-media` branch) — shell-side UI delegation precedent

### Established Patterns
- Each NUB spec lives on its own branch (e.g., `nub-identity`), not on master — per nubs repo CLAUDE.md convention
- Spec files use setext headings (`======` / `------`) in the header like NIPs
- Wire Protocol section uses `|` tables with Type / Direction / Payload fields columns
- TypeScript interfaces use ESM-friendly syntax, no implementation details
- `draft` label at top; PR to napplet/nubs with branch name matching NUB slug

### Integration Points
- New branch `nub-config` cut from `master` in `/home/sandwich/Develop/nubs/`
- `NUB-CONFIG.md` written on that branch
- PR opened to `napplet/nubs` as issue/PR #13 (only after human confirmation — push is a shared-state action)
- `napplet/nubs` README.md registry table updated on the same branch to list NUB-CONFIG

</code_context>

<specifics>
## Specific Ideas

- Cite CVE-2025-69873 by number when explaining `pattern` exclusion (grounds the decision in a concrete vulnerability)
- Reference NIP-5D by spec number only for transport-layer context — do not link any `@napplet/*` package
- Include `additionalProperties: false` as an explicit MUST override (JSON Schema default is `true`, which is wrong for a user-settings contract)
- Error-envelope section should match existing nub-error pattern (`{ code: string, message: string }`) to keep shell-side handling uniform

</specifics>

<deferred>
## Deferred Ideas

- `pattern` keyword readmission in a future Extended Subset (once a shell-safe regex engine strategy is specified) — tracked as FUT-03 in REQUIREMENTS.md
- `config.getSecret(key)` correlated read for Tier 1 secret handling — tracked as FUT-02
- `config.unregisterSchema` for HMR ergonomics — tracked as FUT-01

</deferred>
