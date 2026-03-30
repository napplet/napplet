# Phase 6: Specification and Publish - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Refine SPEC.md based on implementation learnings from Phases 1-5. Validate ESM compatibility of all three packages. Publish @napplet/shim, @napplet/shell, and @napplet/vite-plugin to npm at v0.1.0-alpha.1. Write package READMEs with usage examples.

</domain>

<decisions>
## Implementation Decisions

### Spec Location & Format
- **D-01:** SPEC.md lives at the repo root. Already exists (41KB, NIP-formatted). Refined in-place based on implementation learnings.
- **D-02:** NIP PR submission is a future goal, NOT this milestone. Spec will require multiple iterations before submission.
- **D-03:** Spec references NIP-5A for manifest/hash details (does not duplicate the algorithm). References nostr-protocol/nips#2287 for the aggregate hash `x` tag since it's not yet merged into NIP-5A.

### Manifest Hash
- **D-04:** No chicken-and-egg problem. The aggregate hash is computed from the NIP-5A event's `path` tags per the algorithm in nostr-protocol/nips#2287: collect path tags → format as `<sha256> <path>\n` → sort → concatenate → SHA-256. The `x` tag on the event stores the result. The HTML meta tag is just a local convenience for the shim during development.
- **D-05:** Spec should document: shell uses the aggregate hash from the NIP-5A event's `x` tag as part of the ACL composite key (`pubkey:dTag:aggregateHash`). The meta tag in HTML is informational, not the source of truth.

### Vite Plugin Scope
- **D-06:** @napplet/vite-plugin is a **dev-only tool**. Its purpose is to make it possible to test napplets locally (injects aggregate hash meta tag during dev mode). Build-time manifest generation / NIP-5A event creation is out of scope — handled by community deploy tools (nsyte, etc.).
- **D-07:** Strip or clearly document that build-time manifest features are supplementary/dev-only. The plugin README must not imply it replaces deploy tools.

### Package Publishing
- **D-08:** Publish all 3 packages: @napplet/shim, @napplet/shell, @napplet/vite-plugin
- **D-09:** Version: v0.1.0-alpha.1 (explicit pre-release tag). npm install requires `--tag alpha`. Signals "not production ready."
- **D-10:** Demo playground NOT published as a package. It's deployed as an nsite, not installed via npm.

### Spec Refinements Needed (from implementation learnings)
- Relay URI changed to `shell://` (from `hyprgate://shell`)
- Meta tag prefix changed to `napplet-*` (from `hyprgate-*`)
- Storage keys() response uses repeated NIP `['key', name]` tags (not comma-join)
- AUTH failure sends OK false + NOTICE about dropped messages
- Missing type/aggregateHash tags cause AUTH failure (not permissive default)
- Pre-AUTH queue capped at 50 (configurable)
- Blocked napp gets CLOSED with `blocked:` prefix
- ACL persistence format documented and locked
- Storage quota uses UTF-8 byte count
- Sender exclusion only for kind 29003

### Claude's Discretion
- README structure and depth of API documentation
- Which implementation changes from Phases 1-4 warrant spec updates vs just implementation details
- publint and arethetypeswrong fix strategies

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Specifications
- `SPEC.md` — Current NIP draft at repo root (41KB). Primary artifact being refined.
- `https://raw.githubusercontent.com/nostr-protocol/nips/refs/heads/master/5A.md` — NIP-5A nsite spec (manifest format, gateway resolution)
- `https://github.com/nostr-protocol/nips/pull/2287` — Aggregate hash `x` tag PR (not yet merged). Defines the hash algorithm the shell uses.

### Prior Phase Context (all implementation decisions that affect the spec)
- `.planning/phases/01-wiring-fixes/01-CONTEXT.md` — D-01 through D-10: naming, storage format, AUTH behavior, validation
- `.planning/phases/02-test-infrastructure/02-CONTEXT.md` — NIP-5A gateway emulation details
- `.planning/phases/03-core-protocol-tests/03-CONTEXT.md` — NIP-01 error prefixes, missing tag behavior, queue limits, blocked prefix
- `.planning/phases/04-capability-tests/04-CONTEXT.md` — UTF-8 quota, ACL persistence format, consent behavior

### Package Validation
- publint (ESM validation) — run against all 3 packages
- @arethetypeswrong/cli (type export validation) — run against all 3 packages

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SPEC.md` — already NIP-formatted, 41KB. Needs updates to match implementation changes, not a rewrite.
- `.changeset/` directory — changesets already configured for versioning
- `package.json` scripts: `pnpm version-packages` and `pnpm publish-packages` — publish workflow exists

### Established Patterns
- ESM-only output from tsup
- JSDoc on all public API exports
- Package exports field in each package.json

### Integration Points
- changesets for version bumping
- npm registry for publishing
- Each package README for documentation

</code_context>

<specifics>
## Specific Ideas

- The spec refinement is a delta from implementation learnings, not a rewrite. Most changes are naming/format updates.
- The vite-plugin README is the most important to get right — it must clearly communicate "dev tool, not deploy tool" to avoid confusion.
- Pre-release alpha tag means we can iterate without semver pressure.

</specifics>

<deferred>
## Deferred Ideas

- **NIP PR submission** — Future milestone. Requires community feedback and multiple iterations.
- **@napplet/devtools package** — Extract debugger web component from demo. Future milestone.
- **@napplet/create CLI** — Scaffolding tool. Lives in hyprgate currently. Future consideration.

</deferred>

---

*Phase: 06-specification-and-publish*
*Context gathered: 2026-03-30*
