# Phase 23: New Package READMEs - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Create developer-facing README.md files for the four new packages introduced in v0.2.0–v0.4.0: @napplet/acl, @napplet/core, @napplet/runtime, and @napplet/services.

Each README must be sufficient for a developer to understand and use the package without reading the source code. Success is a developer being able to start integrating the package by reading only that package's README.

The phase covers documentation creation only — no code changes to the packages themselves.

</domain>

<decisions>
## Implementation Decisions

### Services Package Scope (README-08)

- **D-01:** Document all 6 exported factory functions: `createAudioService`, `createNotificationService`, `createSignerService`, `createRelayPoolService`, `createCacheService`, and `createCoordinatedRelay`.
- **D-02:** Each of the 6 factories gets the same documentation depth — a full code example showing wiring into `registerService()` or `RuntimeHooks.services`. No tiered treatment between user-facing and infrastructure services.
- **D-03:** Use a clear section split within the README to distinguish user-facing services (audio, notifications) from infrastructure services (signer, relay-pool, cache, coordinated-relay).

### Runtime README Depth (README-07)

- **D-04:** Document all 18 RuntimeHooks sub-interfaces in the README — the README should be the complete integration reference for shell host implementors.
- **D-05:** Exclude lower-level internal exports (`createEnforceGate`, `createNappKeyRegistry`, `createReplayDetector`, `createEventBuffer`) from the README. These are implementation details used internally by `createRuntime()`. Shell authors do not need them.
- **D-06:** The kind 29010 service discovery section gets both narrative (how the protocol works at a high level) and code (showing `createServiceDiscoveryEvent` and `handleDiscoveryReq` usage).

### Code Example Style

- **D-07:** `@napplet/runtime` and `@napplet/services` get realistic integration examples — showing how the API wires into a shell host, including partial `RuntimeHooks` implementations where relevant.
- **D-08:** `@napplet/acl` and `@napplet/core` get abstract API snippets focused on the API surface in isolation. These packages are pure/types-only; integration context belongs in the runtime or shell READMEs.

### README Structure

- **D-09:** All 4 READMEs follow the same Getting Started / How It Works / API Reference structure used by the existing shim and shell READMEs — even if Getting Started is short for acl and core. Consistency across all package READMEs is preferred.
- **D-10:** READMEs should cross-reference each other where it adds value (e.g., acl README can point to runtime for how the ACL is wired into the shell; core README can note that runtime and shell consume these types). No need to be fully standalone at the cost of unhelpful duplication.

### Claude's Discretion

- Exact section headings and ordering within each README — match shim/shell conventions but adapt to the package's needs.
- How much prose to use between code blocks — keep it tight, matching the existing READMEs' style.
- Whether to include a package dependency graph or architecture note in each README (e.g., "This package depends on @napplet/core").

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing READMEs (style reference)
- `packages/shim/README.md` — Primary style reference; 229 lines; Getting Started / How It Works / API pattern
- `packages/shell/README.md` — Secondary style reference; 189 lines; same pattern

### Source of truth for each package's public API
- `packages/acl/src/index.ts` — All ACL exports: types, CAP_* constants, check(), createState(), grant(), revoke(), block(), unblock(), setQuota(), getQuota(), serialize(), deserialize()
- `packages/acl/src/types.ts` — AclState, AclEntry, Identity interfaces; capability bit values with JSDoc
- `packages/acl/src/mutations.ts` — Mutation function signatures
- `packages/acl/src/check.ts` — check() and toKey() signatures
- `packages/core/src/index.ts` — All core exports: NostrEvent, NostrFilter, Capability, ServiceDescriptor, ALL_CAPABILITIES, BusKind, PROTOCOL_VERSION, SHELL_BRIDGE_URI, AUTH_KIND, REPLAY_WINDOW_SECONDS, DESTRUCTIVE_KINDS, TOPICS
- `packages/core/src/types.ts` — Type definitions with JSDoc
- `packages/core/src/constants.ts` — Protocol constants with JSDoc
- `packages/core/src/topics.ts` — TOPICS object
- `packages/runtime/src/index.ts` — All runtime exports: createRuntime(), RuntimeHooks (all sub-interfaces), ServiceHandler, ServiceRegistry, service discovery exports, enforce gate, key registry, etc.
- `packages/runtime/src/types.ts` — RuntimeHooks and all sub-interface definitions (the 18 interfaces)
- `packages/runtime/src/runtime.ts` — createRuntime() signature and Runtime interface
- `packages/runtime/src/service-discovery.ts` — createServiceDiscoveryEvent(), handleDiscoveryReq(), isDiscoveryReq()
- `packages/services/src/index.ts` — All service exports
- `packages/services/src/audio-service.ts` — createAudioService() with JSDoc
- `packages/services/src/notification-service.ts` — createNotificationService()
- `packages/services/src/signer-service.ts` — createSignerService()
- `packages/services/src/relay-pool-service.ts` — createRelayPoolService()
- `packages/services/src/cache-service.ts` — createCacheService()
- `packages/services/src/coordinated-relay.ts` — createCoordinatedRelay()
- `packages/services/src/types.ts` — AudioSource, Notification, and other service types

### Requirements
- `.planning/REQUIREMENTS.md` §README-05 through README-08 — acceptance criteria per package

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- JSDoc comments in each package's `index.ts` and `types.ts` already contain `@example` blocks — planner should extract these as starting points for README code examples rather than writing from scratch.
- The shim and shell READMEs are templates in everything except content — structure, heading levels, code block language tags, and prose density all apply.

### Established Patterns
- All packages are ESM-only with TypeScript. README examples should use `import` (not `require`) and show TypeScript types where helpful.
- The shim README uses a "How It Works" numbered list to explain the lifecycle before showing API details. This is the right pattern for runtime and services.
- The acl package's `index.ts` JSDoc already has a complete usage example — it's close to README-ready.

### Integration Points
- The 4 new READMEs cross-reference each other: acl → runtime (wiring), core → runtime/shell (consumers), services → runtime (`registerService`).
- Each README should link to the root README for the full package architecture picture.

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 23-new-package-readmes*
*Context gathered: 2026-03-31*
