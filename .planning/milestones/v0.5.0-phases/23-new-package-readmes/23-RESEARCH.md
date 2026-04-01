# Phase 23: New Package READMEs — Research

**Phase:** 23 — New Package READMEs
**Researched:** 2026-03-31
**Status:** RESEARCH COMPLETE

---

## Research Summary

This phase is purely documentation. No code changes. The four packages are feature-complete; their APIs, types, and JSDoc are the source of truth. Research confirmed that all required information exists in source files and can be lifted almost directly into READMEs.

---

## 1. Style Reference Analysis

### Shim README Pattern (229 lines — primary reference)
- H1: package name, italic tagline
- **Getting Started** → Prerequisites, How It Works (numbered list), Installation
- **Quick Start** — multi-feature code block
- **API Reference** — one `###` section per function, params table, returns sentence, code snippet
- **Types** — import block + table
- **Protocol Reference** — bullet links
- MIT license footer

### Shell README Pattern (189 lines — secondary reference)
- Same H1/tagline/Getting Started structure
- Quick Start shows full `hooks` object literal — realistic wiring
- API Reference: createShellBridge + method table for ShellBridge + ShellHooks table + Standalone Utilities table + Protocol Constants table
- Types: import block only (no table)
- Same footer

### Observations
- Both READMEs use `### ` for API sections, not `####`
- Code blocks: always ` ```ts `
- No nested subsections deeper than `###`
- Param tables: `| Parameter | Type | Description |` header row
- Returns: inline sentence after table, not a separate heading
- Shell README puts a full realistic hook object in Quick Start — right approach for runtime/services too

---

## 2. Package API Inventory

### @napplet/acl

**Exports confirmed from source:**

Types: `AclState`, `AclEntry`, `Identity`

Constants (all from `types.ts`):
- `CAP_RELAY_READ` (1), `CAP_RELAY_WRITE` (2)
- `CAP_CACHE_READ` (4), `CAP_CACHE_WRITE` (8)
- `CAP_HOTKEY_FORWARD` (16)
- `CAP_SIGN_EVENT` (32), `CAP_SIGN_NIP04` (64), `CAP_SIGN_NIP44` (128)
- `CAP_STATE_READ` (256), `CAP_STATE_WRITE` (512)
- `CAP_ALL` (1023), `CAP_NONE` (0)
- `DEFAULT_QUOTA` (524288 = 512 KB)

Functions:
- `check(state, identity, cap): boolean` — pure, no side effects
- `toKey(identity): string` — composite key helper
- `createState(policy?): AclState` — policy defaults to 'permissive'
- `grant(state, identity, cap): AclState`
- `revoke(state, identity, cap): AclState`
- `block(state, identity): AclState`
- `unblock(state, identity): AclState`
- `setQuota(state, identity, bytes): AclState`
- `getQuota(state, identity): number`
- `serialize(state): string`
- `deserialize(json): AclState`

**Key facts:**
- Zero dependencies, pure functions, designed for WASM compilation
- Immutable state — every mutation returns new AclState
- `block` flag is orthogonal to caps: blocked overrides all caps; unblock restores
- Decision tree for `check()`: no entry → defaultPolicy, blocked → false, else bitfield test
- `index.ts` already has a complete JSDoc `@example` block nearly ready for README

### @napplet/core

**Exports confirmed from source:**

Types: `NostrEvent`, `NostrFilter`, `Capability`, `ServiceDescriptor`, `BusKindValue`, `TopicKey`, `TopicValue`

Values:
- `ALL_CAPABILITIES` — readonly string array of all 10 capability strings
- `PROTOCOL_VERSION = '2.0.0'`
- `SHELL_BRIDGE_URI = 'napplet://shell'`
- `AUTH_KIND = 22242`
- `REPLAY_WINDOW_SECONDS = 30`
- `BusKind` — object with 9 entries (REGISTRATION=29000 … SERVICE_DISCOVERY=29010)
- `DESTRUCTIVE_KINDS = new Set([0, 3, 5, 10002])`
- `TOPICS` — 29 topic string constants across 10 categories

**Key facts:**
- Zero dependencies, zero DOM/browser APIs
- Single source of truth for protocol-level definitions; all other `@napplet/*` packages import from here
- `Capability` type is human-readable protocol-level; `@napplet/acl` uses bitfield constants for fast checks — this is worth a note in the README
- `BusKind.SERVICE_DISCOVERY = 29010` is the kind used by service discovery

### @napplet/runtime

**Exports confirmed from source:**

Primary entry point: `createRuntime(hooks: RuntimeHooks): Runtime`

`Runtime` interface methods:
- `handleMessage(windowId, msg)` — attach to postMessage handler
- `sendChallenge(windowId)` — send NIP-42 AUTH challenge
- `injectEvent(topic, payload)` — inject shell-originated event
- `destroy()` — teardown
- `registerConsentHandler(handler)` — consent for destructive signing
- `registerService(name, handler)` — dynamic service registration
- `unregisterService(name)` — remove a service

Sub-interfaces of `RuntimeHooks` (18 total):
1. `sendToNapplet: SendToNapplet` — required, function type
2. `relayPool?: RuntimeRelayPoolHooks` — optional (if relay service used instead)
3. `cache?: RuntimeCacheHooks` — optional
4. `auth: RuntimeAuthHooks` — required
5. `config: RuntimeConfigHooks` — required
6. `hotkeys: RuntimeHotkeyHooks` — required
7. `crypto: RuntimeCryptoHooks` — required
8. `aclPersistence: RuntimeAclPersistence` — required
9. `manifestPersistence: RuntimeManifestPersistence` — required
10. `statePersistence: RuntimeStatePersistence` — required
11. `windowManager: RuntimeWindowManagerHooks` — required
12. `relayConfig: RuntimeRelayConfigHooks` — required
13. `dm?: RuntimeDmHooks` — optional
14. `onAclCheck?: AclCheckEvent callback` — optional audit hook
15. `onPendingUpdate?: PendingUpdateNotifier` — optional
16. `onCompatibilityIssue?: CompatibilityReport callback` — optional
17. `strictMode?: boolean` — optional
18. `services?: ServiceRegistry` — optional

Service discovery:
- `createServiceDiscoveryEvent(handler, randomId): NostrEvent` — creates synthetic kind 29010
- `handleDiscoveryReq(windowId, subId, services, send, generateId): DiscoverySubscription`
- `isDiscoveryReq(filters): boolean`

Other exports (internal/advanced — CONTEXT.md D-05 says exclude from README):
- `createEnforceGate`, `createNappKeyRegistry`, `createReplayDetector`, `createEventBuffer`

**Key facts for README:**
- No browser APIs, no DOM, no localStorage — all I/O delegated to RuntimeHooks
- `handleMessage` is the single entry point for all napplet messages
- `registerService` allows dynamic service extension after creation
- `RuntimeHooks.services` allows static initialization at creation time
- Kind 29010 discovery is handled by the runtime internally — shell doesn't need to do anything
- Per D-06: discovery section needs both narrative (how it works) and code examples

### @napplet/services

**Exports confirmed from source:**

Factory functions:
1. `createAudioService(options?)` — audio source registry
2. `createNotificationService(options?)` — notification state registry
3. `createSignerService(options)` — signer request/response handler
4. `createRelayPoolService(options)` — relay pool as ServiceHandler
5. `createCacheService(options)` — local event cache as ServiceHandler
6. `createCoordinatedRelay(options)` — composite relay+cache ServiceHandler

Types: `AudioSource`, `AudioServiceOptions`, `Notification`, `NotificationServiceOptions`, `SignerServiceOptions`, `RelayPoolServiceOptions`, `CacheServiceOptions`, `CoordinatedRelayOptions`

**User-facing services (audio, notifications):**
- `createAudioService`: `onChange(sources: Map<string, AudioSource>)` callback for UI updates
- Audio topics: `audio:register`, `audio:unregister`, `audio:state-changed`, `audio:mute`
- Shell sends mute command back via `napp:audio-muted` topic
- `createNotificationService`: `onChange(list: readonly Notification[])` callback
- Notification topics: `notifications:create`, `notifications:dismiss`, `notifications:read`, `notifications:list`
- Shell sends `notifications:created` (with ID) back to napplet

**Infrastructure services (signer, relay-pool, cache, coordinated-relay):**
- `createSignerService`: needs `getSigner` callback, optional `onConsentNeeded` for destructive kinds
- `createRelayPoolService`: wraps subscribe/publish interface
- `createCacheService`: wraps query/store interface
- `createCoordinatedRelay`: composite of both — handles REQ from both, deduplicates by event ID

**Key facts:**
- Per D-01/D-02: all 6 factories get equal documentation depth with full code examples
- Per D-03: README uses section split to distinguish user-facing from infrastructure services
- All return `ServiceHandler` from `@napplet/runtime`
- All are browser-agnostic — no DOM, no window

---

## 3. Cross-Reference Map

| README | Cross-references |
|--------|-----------------|
| acl | → runtime "how ACL is wired into runtime via aclPersistence" |
| core | → runtime and shell (consumers of these types) |
| runtime | → services "see @napplet/services for pre-built service handlers" |
| services | → runtime "registerService() and RuntimeHooks.services" |

---

## 4. Structural Decisions

All 4 READMEs follow the shim/shell convention:
1. H1 + tagline
2. Getting Started → Prerequisites, How It Works, Installation
3. Quick Start code block
4. API Reference (function-by-function with params tables)
5. Types section
6. Protocol Reference links
7. License

**acl**: Getting Started is short (pure lib, no host needed). API Reference groups: State Creation, Capability Check, Mutations, Serialization.

**core**: No "How It Works" lifecycle needed — it's a types-only package. Instead, brief "Package Overview" explains the single source of truth role. API groups: Protocol Types, Protocol Constants, Bus Event Kinds, Topic Constants.

**runtime**: Full "How It Works" lifecycle (same pattern as shim). API groups: createRuntime(), Runtime interface, RuntimeHooks (full table of all 18), Service Discovery. Cross-ref to services.

**services**: "How It Works" explains the ServiceHandler contract and registerService() wiring. API groups: User-Facing Services (audio, notifications), Infrastructure Services (signer, relay-pool, cache, coordinated-relay). Each factory gets its own `###` section.

---

## 5. Wave Strategy

This phase is purely documentation — 4 READMEs, no dependencies between them. All 4 can be written in parallel in Wave 1.

---

## Validation Architecture

No automated tests apply to README content. Acceptance is verified by grep for required sections/strings as specified in the plan acceptance_criteria.

---

## RESEARCH COMPLETE
