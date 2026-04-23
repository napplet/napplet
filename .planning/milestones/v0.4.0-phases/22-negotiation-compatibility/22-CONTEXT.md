# Phase 22: Negotiation & Compatibility - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement the declarative negotiation layer: vite plugin injects manifest requires tags, runtime reads them from the NIP-5A manifest, checks against ServiceRegistry, surfaces CompatibilityReport to the shell host, and handles undeclared service usage with consent warnings. After this phase, napplets declare what they need and the runtime handles the rest.

</domain>

<decisions>
## Implementation Decisions

### Manifest reading flow
- **D-01:** Shell reads requires tags from the NIP-5A manifest event (kind 35128), not from napplet self-reporting. The manifest is a signed Nostr event with cryptographic integrity. The shell already caches manifests for aggregate hash resolution — extend to include requires tags.
- **D-02:** The check happens BEFORE the napplet starts real work (COMPAT-03). The shell reads the manifest, extracts requires, checks against ServiceRegistry, and surfaces the CompatibilityReport before or during napplet load.
- **D-03:** Dev-mode: the vite plugin injects requires into the manifest meta tags in index.html. The shell reads from the same source it reads aggregate hash.

### Requires tag format
- **D-04:** Format is `["requires", "service-name"]` — name only, no version range. Consistent with Phase 18 D-07 (name-only matching).

### CompatibilityReport shape
- **D-05:** Minimal report:
  ```ts
  interface CompatibilityReport {
    available: ServiceInfo[];  // all services the shell provides
    missing: string[];         // service names in requires but not registered
    compatible: boolean;       // true if missing.length === 0
  }
  ```
  No `incompatible` array — name-only matching means a service is present or absent, never version-mismatched.

### Strict/permissive mode
- **D-06:** Carried from milestone scoping: strict mode blocks loading on missing required service. Permissive mode (default) loads with warning, shell host decides UX. Configurable via RuntimeHooks.
- **D-07:** The runtime raises `onCompatibilityIssue(report: CompatibilityReport)` hook when `report.compatible === false`. In strict mode, runtime does not proceed with AUTH. In permissive mode, runtime proceeds and the shell host handles the report.

### Undeclared service usage consent
- **D-08:** Claude's discretion: reuse existing ConsentRequest pattern with a type discriminator. The current ConsentRequest flow (onConsentNeeded callback with approve/deny) is well-established for destructive signing kinds. Adding a `type: 'undeclared-service'` field and a `serviceName: string` field to the consent request keeps the shell host integration consistent — one consent callback handles both signing consent and service consent. This avoids adding another hook for shell hosts to implement.

### Vite plugin changes
- **D-09:** The `@napplet/vite-plugin` gets a new `requires` option: `requires: ['audio', 'notifications']`. The plugin injects `["requires", "audio"]` and `["requires", "notifications"]` tags into the NIP-5A manifest event at build time.

### Claude's Discretion
- Exact timing of compatibility check in the napplet lifecycle (before iframe load vs after iframe load but before AUTH vs during AUTH processing)
- Whether the CompatibilityReport is also made available to the napplet (via discovery or injected event) or only to the shell host
- How the manifest cache extension works (additional fields on cached entry, or separate cache)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Manifest & Vite Plugin
- `packages/vite-plugin/src/index.ts` — Current vite plugin implementation (manifest generation, meta tag injection, SHA-256 hashing)
- `SPEC.md` Section 4 — NIP-5A manifest format (kind 35128, tag schema)

### Manifest Cache
- `packages/shell/src/manifest-cache.ts` — Current manifest cache (stores kind 35128 events by dTag, resolves aggregate hash)
- `packages/runtime/src/manifest-cache.ts` — Runtime-level manifest cache

### ConsentRequest Pattern
- `packages/runtime/src/runtime.ts` — Existing ConsentRequest handling for destructive signing kinds (search for ConsentRequest, onConsentNeeded)
- `packages/runtime/src/types.ts` — ConsentRequest and ConsentHandler type definitions

### Service Discovery
- `SPEC.md` Section 11 — Service Discovery protocol
- `.planning/phases/19-service-discovery-protocol/19-CONTEXT.md` — Discovery protocol decisions

### Prior Phase Contexts
- `.planning/phases/18-core-types-runtime-dispatch/18-CONTEXT.md` — Name-only matching (D-07), service dispatch model
- `.planning/phases/20-concrete-services/20-CONTEXT.md` — @napplet/services package, service implementations
- `.planning/phases/21-shim-discovery-api/21-CONTEXT.md` — window.napplet namespace, discovery API

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ConsentRequest` + `ConsentHandler` types in runtime/types.ts — extend for undeclared service consent
- `manifest-cache.ts` in both shell and runtime — extend to store requires tags from manifest events
- Vite plugin's `transformIndexHtml` hook — add requires tag injection alongside existing manifest injection
- `onConsentNeeded` callback pattern — proven pattern for shell host interaction

### Established Patterns
- RuntimeHooks callback pattern — `onCompatibilityIssue` follows same pattern as `onAclCheck`, `onConsentNeeded`
- NIP-5A manifest tags — `["requires", "service-name"]` follows existing tag convention
- Strict/permissive mode — same concept as ACL (permissive default for developer adoption)

### Integration Points
- Vite plugin config — add `requires: string[]` option
- RuntimeHooks — add `onCompatibilityIssue` callback and `strictMode?: boolean`
- Runtime AUTH flow — add compatibility check before or during AUTH processing
- Runtime service dispatch — add undeclared service check before dispatching to handler
- Manifest cache — extend to parse and store requires tags

</code_context>

<specifics>
## Specific Ideas

- The three-tier model from milestone scoping:
  - Tier 1 (Declared + Available): Just works. Zero napplet code needed.
  - Tier 2 (Declared + Missing): Runtime raises onCompatibilityIssue. Strict blocks, permissive warns.
  - Tier 3 (Undeclared + Available): Runtime raises consent warning at dispatch time. User acknowledges, service call goes through.
- The vite plugin `requires` option should mirror the existing `privateKey` option pattern — simple, documented, optional.

</specifics>

<deferred>
## Deferred Ideas

- CompatibilityReport available to the napplet (not just the shell host) — could be a future addition via window.napplet.getCompatibilityReport()
- Version-aware compatibility (semver ranges) — when version matching is added
- Per-service ACL gating combined with negotiation — v0.5.0
- Automatic service installation/provisioning — explicitly out of scope

</deferred>

---

*Phase: 22-negotiation-compatibility*
*Context gathered: 2026-03-31*
