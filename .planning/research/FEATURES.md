# Feature Landscape: Service Discovery & Capability Negotiation

**Domain:** Sandboxed app ecosystems -- service discovery, capability negotiation, compatibility checking, graceful degradation
**Researched:** 2026-03-31
**Mode:** Ecosystem research for v0.4.0 milestone (feature negotiation & service discovery)
**Overall confidence:** HIGH -- patterns are well-established across 6+ ecosystems

## Context

This research maps how real-world sandboxed app ecosystems handle the problems napplet v0.4.0 needs to solve: how does a sandboxed app discover what its host provides, declare what it needs, and handle missing capabilities? The napplet protocol already has SPEC.md Section 11 (kind 29010 service discovery) and typed interfaces (ServiceDescriptor/Handler/Registry) designed but not implemented. This research validates that design against proven patterns and identifies gaps.

### Ecosystems Analyzed

| Ecosystem | Sandbox Model | Relevance to Napplet |
|-----------|--------------|---------------------|
| Chrome Extensions MV3 | Process isolation + manifest permissions | Manifest-declared requirements, optional runtime permissions |
| Android Runtime Permissions | App sandbox + runtime permission requests | Graceful degradation UX when capabilities denied |
| VS Code Extensions | Extension host + contribution points | extensionDependencies, engines constraint, when-clause feature detection |
| Model Context Protocol (MCP) | JSON-RPC + capability handshake | Direct analog -- capability negotiation during initialization |
| Figma Plugins | iframe + WASM sandbox | Dual-sandbox capability model, API surface detection |
| Nostr NIP-11 | Relay information document | Native Nostr pattern for advertising supported features |
| Micro-frontend (Module Federation) | Runtime module discovery | Service discovery, version negotiation, capability flags |
| MCP Apps (ext-apps) | Sandboxed iframe in MCP host | Permission declaration, CSP negotiation, graceful degradation to text |

---

## Table Stakes

Features that napplet developers and shell implementors will expect from a service discovery system. Missing = the protocol feels half-baked and developers will build ad-hoc workarounds.

| Feature | Why Expected | Complexity | Ecosystem Precedent | Notes |
|---------|--------------|------------|-------------------|-------|
| Service enumeration (discovery query) | Every capability system starts with "what's available?" Chrome has `permissions.getAll()`. MCP has capability declaration in initialize handshake. NIP-11 has `supported_nips` array. Without this, napplets must guess. | Low | MCP initialize, NIP-11, Chrome `permissions.contains()` | Already designed: kind 29010 REQ/EVENT/EOSE flow. Implementation is the task. |
| Service descriptor with name + version | Every discoverable service needs an identity. MCP declares tools/resources with names. NIP-11 uses integer NIP identifiers. VS Code extensions use publisher.name. Versions enable compatibility checks. | Low | MCP server capabilities, VS Code `engines.vscode`, Obsidian `minAppVersion` | Already designed: ServiceDescriptor with `name`, `version`, `description`. Semver version string. |
| Post-AUTH discovery timing | Discovery must happen after authentication. Android permissions are checked at runtime. MCP negotiates during initialize (before operations). Chrome extensions check at runtime. The napplet must know the right time to query. | Low | MCP lifecycle (negotiate then operate), Android `checkSelfPermission()` at runtime | SPEC.md Section 11.4 specifies: "After AUTH completes, the napplet MAY send a REQ for kind 29010." Shim API should make this easy. |
| Shim-side discovery API | The napplet developer needs a simple function to call, not raw REQ/EVENT parsing. Figma provides `figma.*` globals. Chrome provides `chrome.permissions.*`. Android provides `ContextCompat.checkSelfPermission()`. | Med | Chrome `permissions.contains()`, Android `checkSelfPermission()`, Figma `figma.*` globals | Not yet designed. Needs a `discoverServices()` or `getAvailableServices()` function in @napplet/shim that returns a typed result. |
| Graceful behavior when no services registered | Shells that don't register services should still work. EOSE with no events = "no optional services." Chrome extensions work without optional_permissions. MCP sessions work if server declares no tools. | Low | MCP (empty capabilities = still functional), SPEC.md Section 11.7 | Already designed in spec: "Shells that do not register any services will not respond to kind 29010 REQs (the subscription receives EOSE immediately with no events)." Zero implementation cost -- this is the default. |
| Topic-prefix routing to service handlers | Once services are discovered, messages need to reach the right handler. Every plugin system has a dispatch mechanism. VS Code routes contribution points. MCP routes tool calls by name. Android routes intents by action. | Med | VS Code contribution points, MCP tool dispatch, Android intent routing | Already designed: INTER_PANE events with `{service-name}:{action}` topic prefix. Runtime needs to parse prefix and dispatch to ServiceRegistry. |
| Service cleanup on window destroy | When a napplet closes, service state must be cleaned up. Figma calls cleanup on plugin close. Android calls `onDestroy()`. VS Code deactivates extensions. Memory leaks are the alternative. | Low | Android Activity lifecycle, Figma `closePlugin()`, VS Code `deactivate()` | Already designed: `ServiceHandler.onWindowDestroyed?(windowId)` optional method. Runtime needs to call it on window teardown. |
| Compatibility surface for missing services | When a napplet needs a service the shell doesn't provide, the developer (and optionally the user) needs to know. Android shows "feature not available" UI. MCP clients conditionally disable UI. PWAs use feature detection with fallback. | Med | Android permission denial UX, MCP graceful degradation, PWA feature detection | Not yet designed. Needs: a way for napplets to check "does service X exist?" and a pattern for surfacing gaps. |

---

## Differentiators

Features that would set napplet's service discovery apart. Not expected by developers, but valuable when present.

| Feature | Value Proposition | Complexity | Ecosystem Precedent | Notes |
|---------|-------------------|------------|-------------------|-------|
| Manifest `requires` tags | Napplet manifest declares service dependencies at build time, not just runtime. Shell can pre-check compatibility before loading the napplet. Chrome has `permissions` in manifest.json. VS Code has `extensionDependencies`. MCP Apps declare permissions in `_meta.ui.permissions`. No other iframe-sandboxed protocol does build-time service dependency declaration. | Med | Chrome manifest `permissions`, VS Code `extensionDependencies`, MCP Apps `_meta.ui.permissions` | Listed in PROJECT.md active requirements. Vite plugin would inject `requires` tags into NIP-5A manifest. Shell reads them on load. |
| Pre-load compatibility check | Shell checks manifest `requires` before loading iframe, surfaces issues before AUTH. Android pre-checks `<uses-permission>` at install. Chrome blocks install if required permissions unavailable. This prevents the "load, auth, discover, fail" sequence. | Med | Chrome extension install-time permission check, Android install-time feature check | Requires manifest `requires` tags to be implemented first. Shell reads manifest, checks ServiceRegistry, surfaces report before or during napplet load. |
| Typed discovery result with version info | Discovery returns not just "service exists" but name + version + description in a typed object. Enables semver range checks client-side. NIP-11 returns `supported_nips` as integers only. MCP returns capability booleans. Napplet could return richer ServiceDescriptor. | Low | MCP (capability booleans), NIP-11 (integer array) -- napplet would go further | ServiceDescriptor already has name, version, description. Shim API should return these as typed objects, not raw events. |
| Version range compatibility checking | Napplet specifies "I need audio >= 1.0.0" and the shim checks if the shell's audio service version satisfies the range. No other sandboxed protocol does semver negotiation at the service level. Chrome uses version strings for the browser, not for individual APIs. | Med | npm semver resolution, VS Code `engines.vscode` range constraint | Would require a semver check utility in the shim. Could use a lightweight semver satisfies function (not the full `semver` npm package). |
| Compatibility report object | A structured report of "what's available, what's missing, what's incompatible" that the napplet can use for UI decisions. MCP Apps degrade to text-only when UI unavailable. Android returns PERMISSION_GRANTED/DENIED per capability. A napplet could get a full compatibility snapshot. | Med | Android `checkSelfPermission()` per-capability, MCP Apps text fallback | Combines discovery results with manifest `requires` to produce a developer-friendly report. |
| Service ACL capabilities | Per-service permission gating. A napplet with `service:audio` capability can use the audio service; without it, discovery shows the service but requests are denied. Extends the existing ACL model. Chrome has per-API permissions. Tauri v2 has per-command capabilities. | High | Chrome per-API permissions, Tauri v2 per-command ACL | SPEC.md Section 11.6 explicitly defers this: "Service-level ACL gating is NOT defined in this version." Good differentiator for v0.5.0+, not v0.4.0. |
| Hot-reload service registration | Shell can register/unregister services at runtime (not just startup). Napplets get notified of service availability changes. No other sandboxed protocol supports dynamic capability changes. | High | Module Federation runtime module discovery | Significant complexity. Would require subscription-based service change notifications. Defer. |

---

## Anti-Features

Features to explicitly NOT build for v0.4.0. Each has a clear rationale based on ecosystem analysis.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Automatic service installation/provisioning | Chrome auto-downloads required permissions on install. Android auto-provisions system services. But in napplet, the shell is the authority -- napplets cannot force-install services. The shell is not an app store. | Shell declares what it provides. Napplet adapts or reports incompatibility. The shell implementor decides what services to register. |
| Capability negotiation during AUTH | MCP negotiates capabilities during initialize handshake. Tempting to add capabilities to the AUTH response. But AUTH is already complex (NIP-42 + ephemeral keypair + aggregate hash). Adding service negotiation to AUTH violates single responsibility and makes the handshake fragile. | Keep AUTH for identity only. Service discovery is a separate, optional post-AUTH step. This matches SPEC.md Section 11.4 design. |
| Complex dependency graphs between services | VS Code extensions can depend on other extensions, creating DAGs. Service A requires Service B. For an SDK with 1-5 services, this is over-engineering. No sandboxed iframe protocol has inter-service dependencies. | Services are independent. If a service needs another service internally, that is the shell implementor's concern, not the protocol's. |
| Permission prompt UX in the SDK | Android shows system permission dialogs. Chrome shows permission prompts. But napplet is an SDK, not a UI framework. The SDK should report "missing capability" and let the shell implementor decide how to present that to the user (toast, modal, banner, etc.). | Provide the compatibility data. Do not render UI. The shell hook or host app decides presentation. |
| Bilateral capability negotiation | MCP has both client and server declare capabilities. In napplet, the asymmetry is intentional: the shell is the authority, the napplet is the consumer. Napplets don't "offer" capabilities to the shell. Adding napplet-to-shell capability advertisement adds complexity for zero value. | Unidirectional: shell advertises services, napplet discovers and adapts. Napplet declares requirements in manifest (passive), shell checks them (active). |
| Service versioning with multiple simultaneous versions | Module Federation supports multiple versions of the same micro-frontend running simultaneously. For shell services, this is unnecessary complexity. One version of `audio` per shell instance. | Single version per service name. If the service API changes, bump the version. Napplets check version compatibility. |
| Generic extension/plugin system | MCP's 2025-11-25 update added a formal extension negotiation system. Napplet's service system is simpler: named services with topic-prefix routing. Don't build a generic extension registry when the service pattern is sufficient. | Services ARE the extension mechanism. The ServiceRegistry is the extension point. Don't add another layer of abstraction on top. |
| Offline service caching | Caching discovered services for offline use. Napplets run in iframes that require network. Service discovery is cheap (local in-process, no network). Caching adds state management for zero benefit. | Always discover fresh on each session. Services are registered in-memory at shell startup. |

---

## Feature Dependencies

```
Existing Protocol (Layers 0-2)
  |
  +-- AUTH Handshake (must complete first)
      |
      +-- Service Discovery Protocol (kind 29010)
      |   (napplet sends REQ, shell responds with descriptors)
      |   |
      |   +-- Shim Discovery API
      |   |   (developer-facing function that wraps the REQ/EVENT/EOSE flow)
      |   |   |
      |   |   +-- Compatibility Checking
      |   |       (compare discovered services against requirements)
      |   |       |
      |   |       +-- Compatibility Reporting
      |   |           (structured report for developer/user consumption)
      |   |
      |   +-- Runtime Service Dispatch
      |       (route INTER_PANE events to ServiceHandler by topic prefix)
      |       |
      |       +-- Audio Service Implementation
      |           (first concrete ServiceHandler, wraps audio-manager)
      |
      +-- Manifest `requires` Tags (build-time)
          (vite plugin injects service dependencies into NIP-5A manifest)
          |
          +-- Pre-load Compatibility Check (shell reads manifest before loading)
              (optional: shell can warn before napplet even loads)

ServiceRegistry Interface (already designed)
  +-- ServiceHandler.handleRequest() (dispatch target)
  +-- ServiceHandler.onWindowDestroyed() (cleanup hook)
  +-- ServiceDescriptor (name, version, description)
```

### Critical Path for v0.4.0

1. **Runtime service dispatch** -- route INTER_PANE to ServiceHandler by topic prefix (enables everything else)
2. **Service discovery protocol** -- kind 29010 REQ/EVENT/EOSE in the runtime (shell advertises registered services)
3. **Audio service handler** -- first concrete ServiceHandler wrapping existing audio-manager (proves the pattern)
4. **Shim discovery API** -- `discoverServices()` function in @napplet/shim (developer ergonomics)
5. **Manifest `requires` tags** -- vite plugin injects, shell reads (build-time dependency declaration)
6. **Compatibility reporting** -- shim surfaces missing/incompatible services (graceful degradation)

### Critical Path Rationale

Dispatch first (not discovery first) because the audio-manager already exists and can be wrapped immediately. Discovery without dispatch means napplets can see services but not use them. Dispatch without discovery means services work but napplets must hard-code assumptions. Both are needed, but dispatch has more immediate value.

---

## Ecosystem Pattern Analysis

### Pattern 1: Declare-then-Discover (Most Common)

**Used by:** Chrome Extensions, Android, VS Code, MCP

The app declares what it needs in a manifest (build-time). The host checks the manifest and the app also checks at runtime.

```
Build time:  manifest declares requirements (permissions, dependencies, engine constraints)
Install time: host checks manifest, blocks if incompatible (Chrome, Android)
Runtime:     app queries host for current state (permissions.contains, checkSelfPermission)
```

**Napplet mapping:**
- Build time: NIP-5A manifest with `requires` tags (vite plugin)
- Load time: Shell reads manifest, checks ServiceRegistry
- Runtime: Shim calls `discoverServices()` after AUTH

**Verdict:** Adopt this pattern. It is the most battle-tested approach across all ecosystems studied.

### Pattern 2: Handshake Negotiation (MCP)

**Used by:** MCP (exclusive), SIP

Both sides declare capabilities during initialization. Session features are locked after handshake.

```
Client sends initialize with client capabilities
Server responds with server capabilities
Client sends initialized notification
Session begins -- only negotiated features may be used
```

**Napplet mapping:** This maps poorly to napplet because:
- AUTH is already the handshake and it handles identity, not capabilities
- Adding capability negotiation to AUTH makes the handshake do two things
- MCP is bidirectional (client and server both offer capabilities); napplet is asymmetric

**Verdict:** Do NOT merge capability negotiation into AUTH. Keep AUTH for identity and service discovery as a separate post-AUTH step. The MCP pattern is elegant but designed for a symmetric client-server relationship, not an asymmetric host-sandbox relationship.

### Pattern 3: Feature Detection (PWA, Web Platform)

**Used by:** PWAs, Web APIs, Modernizr

No manifest declaration. App checks for API existence at runtime.

```
if ('serviceWorker' in navigator) { ... }
if (typeof figma.clientStorage !== 'undefined') { ... }
```

**Napplet mapping:** This is what napplets do WITHOUT service discovery -- they try to use a service and see if it works. The whole point of v0.4.0 is to replace this pattern with explicit discovery.

**Verdict:** Feature detection is the fallback pattern for napplets that don't use service discovery. Not the primary mechanism.

### Pattern 4: Information Document (NIP-11)

**Used by:** Nostr relays

Host publishes a static document describing its capabilities. Client fetches it before connecting.

```
GET wss://relay.example.com with Accept: application/nostr+json
Response: { name, supported_nips: [1, 2, 4, 11], limitation: { ... } }
```

**Napplet mapping:** The kind 29010 discovery response is essentially a per-session NIP-11 for services. The napplet "fetches" service descriptors via REQ, the shell responds with EVENT per service + EOSE. This is conceptually the same pattern adapted to the postMessage transport.

**Verdict:** The existing SPEC.md Section 11 design already follows this pattern. Validate that the implementation stays true to it.

---

## Detailed Feature Specifications

### 1. Shim Discovery API Design

Based on ecosystem analysis, the shim API should follow Android's `checkSelfPermission()` pattern: simple, synchronous-feeling, returns a clear result.

```typescript
// Proposed API
interface ServiceInfo {
  name: string;
  version: string;
  description?: string;
}

// Discover all available services (returns after EOSE)
function discoverServices(): Promise<ServiceInfo[]>;

// Check if a specific service is available
function hasService(name: string): Promise<boolean>;

// Check if a service satisfies a version range
function hasServiceVersion(name: string, range: string): Promise<boolean>;
```

**Rationale:**
- `discoverServices()` maps to Chrome's `permissions.getAll()`
- `hasService()` maps to Chrome's `permissions.contains()` / Android's `checkSelfPermission()`
- `hasServiceVersion()` maps to VS Code's `engines.vscode` range check
- All return Promises because they require postMessage round-trip

**Confidence:** MEDIUM -- the API shape is well-informed by precedent, but the exact function signatures need validation against the existing shim patterns (which use `subscribe`/`publish`/`query` naming).

### 2. Manifest `requires` Tags Design

Based on Chrome's `permissions` array and VS Code's `extensionDependencies`:

```json
{
  "tags": [
    ["requires", "audio", ">=1.0.0"],
    ["requires", "notifications", ">=1.0.0"]
  ]
}
```

**Rationale:**
- NIP tag format (array of strings) is consistent with Nostr conventions
- Service name + semver range gives enough info for compatibility checking
- Optional: shell treats as advisory (like NIP-11 limitations), not blocking

**Confidence:** MEDIUM -- tag format is sound, but whether shell should block loading on missing requirements or just warn needs a design decision. Chrome blocks; Android warns. Recommend: warn (log + report), don't block. Developers need to iterate fast.

### 3. Compatibility Report Design

Based on Android's per-capability GRANTED/DENIED pattern:

```typescript
interface CompatibilityReport {
  available: ServiceInfo[];
  missing: string[];        // service names in requires but not in shell
  incompatible: Array<{     // service exists but version doesn't satisfy range
    name: string;
    required: string;        // semver range from manifest
    actual: string;          // version from discovery
  }>;
  compatible: boolean;       // true if missing.length === 0 && incompatible.length === 0
}
```

**Rationale:**
- `compatible` boolean for quick checks (like Android's `PERMISSION_GRANTED`)
- Structured `missing` and `incompatible` arrays for detailed UI (like Android's "feature not available" messaging)
- Shell implementors use this to decide presentation (toast, modal, banner)
- Napplet developers use this to disable features gracefully

**Confidence:** HIGH -- this pattern is universal across Android, Chrome, MCP, and PWA ecosystems.

---

## Comparison: Napplet vs Comparable Service Discovery Patterns

| Aspect | Chrome MV3 | MCP | NIP-11 | Napplet (v0.4.0) |
|--------|-----------|-----|--------|------------------|
| Discovery trigger | Install-time + runtime | Initialize handshake | HTTP request pre-connect | Post-AUTH REQ (runtime) |
| Declaration format | manifest.json permissions array | JSON capabilities object | JSON document | NIP-5A manifest `requires` tags |
| Discovery response | Boolean (has/hasn't) | Capability booleans | Integer array (supported_nips) | ServiceDescriptor events (name + version + description) |
| Version negotiation | Browser version string | Protocol version string | Software version string | Per-service semver range |
| Graceful degradation | Extension works, feature disabled | Client disables UI for missing capabilities | Client avoids unsupported features | Napplet adapts based on CompatibilityReport |
| Runtime permission request | `permissions.request()` with user gesture | Not applicable | Not applicable | Not applicable (shell authority model) |

---

## MVP Recommendation

### Prioritize (required for v0.4.0)

1. **Runtime service dispatch** -- route INTER_PANE events to ServiceHandler by topic prefix. This is the plumbing that makes services work. Without it, the ServiceRegistry is dead code.
   - Depends on: existing ServiceRegistry interface, existing INTER_PANE routing
   - Complexity: Medium (parse topic prefix, lookup handler, dispatch)

2. **Kind 29010 discovery protocol** -- implement REQ/EVENT/EOSE for service discovery in the runtime.
   - Depends on: ServiceRegistry being populated
   - Complexity: Low (enumerate registry, emit events, send EOSE)

3. **Audio ServiceHandler** -- wrap existing audio-manager.ts as a ServiceHandler. Proves the pattern with real code.
   - Depends on: service dispatch working
   - Complexity: Low (adapter pattern around existing code)

4. **Shim discovery API** -- `discoverServices()` and `hasService()` functions in @napplet/shim.
   - Depends on: kind 29010 working
   - Complexity: Medium (async postMessage round-trip, promise resolution on EOSE)

5. **Manifest `requires` tags** -- vite plugin injects tags, shell reads them.
   - Depends on: vite plugin, NIP-5A manifest format
   - Complexity: Medium (vite plugin modification + shell manifest reader)

6. **Compatibility reporting** -- shim generates CompatibilityReport from discovery + requires.
   - Depends on: discovery API + requires tags
   - Complexity: Low (compare two arrays)

### Defer (post-v0.4.0)

- **Service ACL capabilities (`service:audio`, `service:notifications`)**: SPEC.md explicitly defers this. Good for v0.5.0 after the discovery pattern is proven.
- **Pre-load compatibility check**: Nice-to-have. Currently the napplet loads, then discovers. Checking before load requires manifest fetching infrastructure.
- **Version range compatibility checking with semver**: Start with exact name matching. Add semver range checks when there are multiple service versions in the wild.
- **Hot-reload service registration**: Zero user demand. Services are registered at shell startup.
- **Service change notifications**: Subscription-based updates when services come/go. Complex for no current use case.

---

## Sources

### Primary (HIGH confidence)
- [MCP Architecture & Capability Negotiation](https://modelcontextprotocol.io/specification/2025-06-18/architecture) -- capability-based negotiation during initialization, session lifecycle
- [Chrome Extensions Permissions API](https://developer.chrome.com/docs/extensions/reference/api/permissions) -- runtime permission checking, `permissions.contains()`, `permissions.request()`
- [Chrome Extensions Declare Permissions](https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions) -- manifest-declared vs optional permissions
- [Android Runtime Permissions](https://developer.android.com/training/permissions/requesting) -- `checkSelfPermission()`, graceful degradation pattern
- [Android Permissions Best Practices](https://developer.android.com/training/permissions/usage-notes) -- minimize functionality loss, guide user attention
- [VS Code Extension Manifest](https://code.visualstudio.com/api/references/extension-manifest) -- `extensionDependencies`, `engines.vscode`, capability declarations
- [NIP-11: Relay Information Document](https://nips.nostr.com/11) -- `supported_nips` array, limitation declaration, feature detection
- [MCP Apps Extension Specification](https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/draft/apps.mdx) -- permission declaration, CSP negotiation, graceful degradation to text

### Secondary (MEDIUM confidence)
- [Figma: How Plugins Run](https://developers.figma.com/docs/plugins/how-plugins-run/) -- dual-sandbox model, API surface
- [VS Code When Clause Contexts](https://code.visualstudio.com/api/references/when-clause-contexts) -- runtime feature detection via context keys
- [AWS Frontend Discovery](https://github.com/awslabs/frontend-discovery) -- micro-frontend registration and discovery schema
- [Chrome Optional Permissions](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/optional_permissions) -- runtime permission request pattern
- [Obsidian Plugin Development](https://deepwiki.com/obsidianmd/obsidian-api/3-plugin-development) -- `minAppVersion`, `requireApiVersion()` feature detection

### Tertiary (LOW confidence -- patterns only, not verified against official docs)
- [Microkernel Architecture Pattern](https://dev.to/kishalay_pandey_d5d0cae01f00/microkernel-architecture-design-pattern-n79) -- plugin registry contract pattern
- [MCP 2025-11-25 Extension Negotiation](https://workos.com/blog/mcp-2025-11-25-spec-update) -- extension capability negotiation
- [Module Federation Capability Flags](https://www.elysiate.com/blog/micro-frontends-architecture-module-federation-2025) -- runtime negotiation with semver
