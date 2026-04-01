# Research Summary: v0.7.0 Ontology Audit

**Project:** Napplet Protocol SDK
**Milestone:** v0.7.0 Ontology Audit and Adjustments
**Synthesized:** 2026-04-01
**Research files:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md, ONTOLOGY.md, SDK_NAMING_PATTERNS.md, SDK_NAMING_PITFALLS.md
**Overall confidence:** HIGH

---

## Executive Summary

Research across 7 files confirms the napplet SDK has two known naming correctness bugs and a third category of naming deviations from ecosystem conventions that, while non-blocking, introduce friction for new contributors and AI agents. The `napp` vs `napplet` collision is real: "napp" is an established Nostr ecosystem term (NIP-C4 PR#2274, meaning "Nostr app — a static site deployed on Nostr") while napplet's codebase uses "napp" to mean "napplet" (the sandboxed iframe entity). This creates a semantic collision that will cause permanent confusion in docs, search results, and LLM context. The `INTER_PANE` / `"INTER-PANE"` rename to `IPC_PEER` / `"IPC-PEER"` is confirmed correct: it replaces a UI-topology term with a protocol-semantic one and follows the NIP-77 `NEG-*` namespace convention exactly.

Beyond the two known fixes, research surfaced two additional tiers of naming issues. The first is structural: `NappKeypair`, `NappKeyEntry`, and `NappKeyRegistry` name these types for their owner ("napp") rather than their purpose ("session"). They are session management types — the keypair exists solely to authenticate a session, the entry IS a session record, the registry maps sessions. This is ontologically wrong at the protocol layer. The second tier is ecosystem alignment: `RuntimeHooks` and `ShellHooks` use a term ("hooks") that carries strong React connotations in the TypeScript ecosystem; every established SDK that implements this pattern (Prisma, Auth.js, tRPC) uses "Adapter" instead. This is lower urgency but creates a persistent onboarding question about whether the SDK is React-specific.

The research also confirmed substantial areas that should NOT be changed: the `resource:action` capability string format (`relay:read`, `sign:event`) is industry-standard (AWS IAM, OAuth scopes, Kubernetes RBAC); the `emit`/`on`/`subscribe`/`publish`/`query` API surface matches universal consensus across every comparable SDK; topic naming with colon-delimited prefixes (`shell:state-get`, `audio:register`) aligns with Ably, Pusher, and NIP-01 reason string conventions; and `ServiceDescriptor`, `ServiceHandler`, `ServiceRegistry`, and `ConsentRequest` all match established ecosystem patterns. Changing these would trade correct naming for incorrect naming.

---

## Confirmed Fixes (must do)

### Fix 1: `napp` → `napplet` everywhere

**Why confirmed:** "Napp" is documented in NIP-C4 PR#2274 ("Nostr Apps — aka napps or nsites v3") as a static Nostr site deployed via Blossom/nsite. It is not a sandboxed iframe app. The SDK's use of `napp` for the sandboxed entity is a direct semantic collision with an established term. The meta tag `napplet-napp-type` is a stuttering contradiction: it uses "napp" to mean "napplet" inside a tag that already says "napplet."

**Scope:** 87+ occurrences across 19 files.

| Pattern | Current | Corrected |
|---------|---------|-----------|
| Interface | `NappKeypair` | `NappletKeypair` |
| Interface | `NappKeyEntry` | `NappletKeyEntry` |
| Interface | `NappKeyRegistry` | `NappletKeyRegistry` |
| Config field | `nappType` | `nappletType` |
| Audio field | `nappClass` | `nappletClass` |
| Shim API | `nappState` (canonical), `nappStorage` (alias) | `nappletState` (canonical), deprecate `nappStorage` |
| localStorage prefix | `napp-state:` | `napplet-state:` |
| Topic | `napp:state-response` | `napplet:state-response` |
| Topic | `napp:audio-muted` | `napplet:audio-muted` |
| HTML meta | `napplet-napp-type` | `napplet-type` |
| Function | `getNappType()` | `getNappletType()` |
| Function | `getNappUpdateBehavior()` | `getNappletUpdateBehavior()` |
| SPEC.md | all "napp" where "napplet" is meant | correct throughout |

**Migration risk:** The `napp-state:` localStorage prefix is persisted data. Changing it causes existing napplet state to become invisible on upgrade. Requires a migration utility or dual-read strategy (try `napplet-state:`, fall back to `napp-state:` for one release).

### Fix 2: `INTER_PANE` / `"INTER-PANE"` → `IPC_PEER` / `"IPC-PEER"`

**Why confirmed:** "Pane" is a UI term. The mechanism is inter-process communication between isolated security contexts communicating over a protocol boundary. NIP-77 establishes the `NEG-*` prefix namespace pattern for multi-word verbs. `IPC-PEER` follows this exactly: UPPER_CASE, hyphen separator, prefix namespace (`IPC-`). The TypeScript constant `IPC_PEER` (UPPER_SNAKE_CASE) is a valid JS constant name; the conceptual name in docs is `IPC-PEER` (NIP hyphen convention). These are different concerns.

**Scope:** 30+ occurrences across core, runtime, services, shell packages.

**Migration risk:** HIGH if wire-format strings are changing. The current `BusKind.INTER_PANE` is a kind number (29003), not a wire-format verb string. The constant rename does not break wire compatibility. However, any code that compares against the string literal `"INTER-PANE"` would break — verify whether that string appears in wire messages or only in TypeScript constants.

---

## Discovered Issues (found by research)

### Issue 1: `NappKeyEntry` / `NappKeyRegistry` name the owner, not the purpose (HIGH priority)

**Finding:** `NappKeyEntry` is a session record (windowId, pubkey, dTag, aggregateHash, registeredAt). `NappKeyRegistry` is a session registry (maps windowId ↔ session). These types are named for their owner ("napp") and for the secondary concern (key management) rather than their primary purpose (session lifecycle tracking). Standard protocol vocabulary calls these `SessionEntry`/`SessionRecord` and `SessionRegistry`. This is a separate concern from the `napp` → `napplet` rename — even after renaming to `NappletKeyEntry`, the name still describes the owner rather than the purpose.

**Recommended names:** `SessionEntry`, `SessionRegistry` — or if staying owner-named, at minimum `NappletKeyEntry`, `NappletKeyRegistry` as part of the napp→napplet pass.

**Impact:** Medium. Affects readability for protocol contributors and LLM agents. Low blast radius — these are internal runtime types.

### Issue 2: `RuntimeHooks` / `ShellHooks` carry a React connotation (MEDIUM priority)

**Finding:** 20+ comparable SDKs surveyed (Prisma, Auth.js, tRPC, Capacitor, MCP). Every SDK that implements "implement this interface to integrate your platform with our protocol engine" uses the term **Adapter**, not Hooks. "Hooks" is understood in the JS ecosystem as React-style composable stateful functions (`useState`, `useEffect`). Seeing `RuntimeHooks` in a framework-agnostic SDK creates a persistent onboarding question about React coupling.

**Recommended names:** `RuntimeAdapter`, `ShellAdapter`. Sub-interfaces drop the redundant `Runtime` prefix when nested: `RelayPoolAdapter`, `AuthAdapter`, `CacheAdapter`, `CryptoAdapter`. The outer composite is `RuntimeAdapter`.

**Impact:** Medium. This is a semver-breaking rename of public API. Worth doing once in a dedicated pass. Ship with `@deprecated` aliases for one release cycle and remove them in v0.9.0. Highest-value cosmetic change in the audit.

### Issue 3: `loadOrCreateKeypair()` does not match its behavior (HIGH priority)

**Finding:** The function in `shim/src/napp-keypair.ts` always creates a fresh keypair. It never loads. The `_nappType` parameter is unused (prefixed with `_`). The name implies idempotency (load if exists, create if not), but the behavior is always-create. An agent or contributor reading the name will write code that assumes the function is idempotent, which it is not.

**Fix:** Rename to `createEphemeralKeypair()`. No parameters. Name matches behavior exactly. This is part of the `napp` → `napplet` rename pass anyway (`loadOrCreateKeypair` → `createEphemeralNappletKeypair()` or simply `createEphemeralKeypair()`).

**Impact:** Low blast radius (shim-internal). High agent-readability impact.

### Issue 4: Duplicate types across `@napplet/runtime` and `@napplet/shell` (HIGH priority)

**Finding (from PITFALLS.md):** The following types are defined independently in both packages:

| Type | Divergence |
|------|-----------|
| `NappKeyEntry` | Identical in both — silent drift risk |
| `AclEntry` / `AclEntryExternal` | Different field names between packages |
| `ConsentRequest` | Shell version **missing the `type` discriminator field** that runtime version has |
| `AclCheckEvent` | Identical — silent drift risk |

The shell's `ConsentRequest` missing the `type` discriminator is an active bug: code written against the shell type cannot discriminate consent types (undeclared-service vs destructive-sign).

**Fix:** Canonical types live in `@napplet/core` or `@napplet/runtime`. Shell re-exports them. Shell must not define its own versions.

**Impact:** High correctness impact. The `ConsentRequest` divergence is a real type-safety gap, not just cosmetics.

### Issue 5: Dead code — `shell/state-proxy.ts` duplicates `runtime/state-handler.ts` (MEDIUM priority)

**Finding:** Both files implement the `napp-state:` key scoping logic with identical code:
- `shell/state-proxy.ts:15` — `napp-state:${pubkey}:${dTag}:${aggregateHash}:${userKey}`
- `runtime/state-handler.ts:15` — same pattern

The shell version predates the runtime extraction (v0.3.0). If both are reachable, a key format change in one but not the other causes data isolation failures silently.

**Audit action:** Verify `shell/state-proxy.ts` is dead code (not imported). If still imported, the shell is bypassing the runtime for state operations. Delete or route through the runtime.

### Issue 6: `windowId` leaks browser-transport concerns into the browser-agnostic runtime (LOW priority)

**Finding (from ONTOLOGY.md):** The runtime is designed to be browser-agnostic, but its primary session identifier is called `windowId` — a term that only makes sense in a browser context. Standard protocol vocabulary would call this `peerId`, `sessionId`, or `endpointId`. The browser shell adapter would map concrete window references to abstract session IDs.

**Fix (pragmatic):** Add a type alias `type PeerId = string` in runtime types with JSDoc noting it maps to windowId in browser shells. Use `peerId` in new runtime APIs. Do not mass-rename `windowId` in existing APIs — that is a large, high-risk change with unclear benefit.

### Issue 7: Topic prefix direction is undocumented (MEDIUM priority)

**Finding:** The topic prefix convention is:
- `shell:*` = commands addressed TO the shell (napplet-initiated)
- `napplet:*` (currently `napp:*`) = responses addressed TO the napplet (shell-initiated)
- `{service-name}:*` = bidirectional service messages

This is internally consistent but never documented. New contributors and agents read `shell:state-get` as "the shell is getting state" (shell-initiated), when it means "hey shell, get state for me" (napplet-initiated). After the `napp:` → `napplet:` rename, the prefix semantics should be documented explicitly in TOPICS constants comments.

### Issue 8: `nappStorage` / `nappState` alias relationship is undocumented (LOW priority)

**Finding:** `nappStorage` (introduced in v0.1.0) was renamed to `nappState` in v0.2.0 but the alias was kept with zero documentation about the relationship. Developers do not know if they are the same thing, different things, or which to use. After the `napp` → `napplet` rename, there will be: `nappletState` (canonical), `nappStorage` (deprecated old alias). The deprecation story must be explicit.

**Fix:** Pick one canonical name (`nappletState`). Deprecate `nappStorage` with a `@deprecated` JSDoc pointing to the canonical name. Add it to the deprecation schedule for removal in v0.9.0.

---

## Naming That's Already Correct

The following should NOT be changed. Research confirmed alignment with ecosystem conventions.

**API surface (shim):**
- `emit()`, `on()` — universal consensus (mitt, Socket.IO, nanoevents, EventEmitter3, Postmate)
- `subscribe()`, `publish()`, `query()` — matches Ably, Pusher channel pattern
- `Capability` type — matches POSIX capabilities and OAuth scope conventions
- `relay:read`, `sign:event`, `state:write` format — matches AWS IAM, OAuth scopes, Kubernetes RBAC

**Service types:**
- `ServiceDescriptor` — standard microservices/MCP term
- `ServiceHandler` — standard request handler pattern
- `ServiceRegistry` — standard registry pattern

**Protocol types:**
- `ConsentRequest` — matches Android permission request pattern; "consent" is the correct user-facing term
- `AclState`, `AclEntry` — correct. The ACL naming is honest about the access model
- `BusKind.SIGNER_REQUEST`, `BusKind.SIGNER_RESPONSE` — standard request/response naming
- `BusKind.SERVICE_DISCOVERY` — matches mDNS, DNS-SD, MCP tool discovery vocabulary
- `enforce()` — clear, authoritative. Better than `authorize()` for a mandatory gate
- `ShellBridge` — correct use of the Bridge pattern (Shopify App Bridge, Capacitor)
- `createRuntime()` — standard factory naming (MCP uses `ClientSession()`, LSP uses `createConnection()`)

**Topic strings:**
- Colon-delimited topic namespaces (`shell:state-get`, `audio:register`) — matches Ably conventions
- Lowercase hyphenated suffix format (`state-get`, `state-set`) — matches LSP `textDocument/completion` pattern and NIP-01 reason strings

**Package names:**
- `@napplet/acl` — `acl` is recognizable as a package concern even when the internal type is `Capability`
- `@napplet/shim` — "shim" accurately describes shimming postMessage into a relay-like API
- `@napplet/core` — standard monorepo pattern for shared types/constants

**Role vocabulary:**
- `shell` / `napplet` — defensible domain-specific vocabulary. Every protocol SDK with asymmetric roles uses custom terms (Electron: main/renderer, Figma: sandbox/iframe, Shopify: host/app). "Shell" is more descriptive than "host" for this system — it is a NIP-01 relay proxy, signer, ACL enforcer, and service host simultaneously.

---

## Migration Concerns

These items touch wire-format or persisted data and require backwards-compat handling.

| Item | Risk Level | Required Handling |
|------|-----------|-------------------|
| `napp-state:` localStorage prefix | HIGH | Ship a migration utility in `@napplet/runtime` that copies old-prefix keys to new-prefix. Dual-read for one release: try `napplet-state:`, fall back to `napp-state:`. |
| `napplet-napp-type` HTML meta tag | MEDIUM | Vite plugin reads both old (`napplet-napp-type`) and new (`napplet-type`) meta names for one version cycle. Document deprecation. |
| `nappStorage` API alias | MEDIUM | Mark `@deprecated` with JSDoc pointing to `nappletState`. Do NOT remove in v0.7.0. Set removal target for v0.9.0. |
| `INTER_PANE` / `IPC_PEER` constant | LOW for kind 29003 wire compat | The kind NUMBER (29003) does not change. Only the TypeScript constant name changes. Verify no code compares against the string `"INTER-PANE"` in wire messages — if none exists, there is no wire compatibility concern. |
| `shell:audio-*` topic prefix | LOW (already handled) | The v0.4.0 decision was to drop `shell:audio-*` entirely (alpha, no external consumers). Verify no external code references `shell:audio-*` before removing. |
| `ConsentRequest` shell type removal | MEDIUM | Remove the locally-defined shell type, re-export from runtime. Keep the import path (`@napplet/shell` → `ConsentRequest`) working via re-export. |
| `RuntimeHooks` → `RuntimeAdapter` | HIGH (public API) | Ship `RuntimeHooks = RuntimeAdapter` deprecated alias for one release. Remove in v0.9.0. Update hyprgate reference implementation in same PR. |

---

## Audit Checklist for v0.7.0

### Phase A: `napp` → `napplet` Rename Pass

- [ ] Grep `napp[^l]` in all packages — catalog all 87+ occurrences
- [ ] Rename all TypeScript identifiers: `NappKeypair`, `NappKeyEntry`, `NappKeyRegistry`, `nappType`, `nappClass`, `nappState` (canonical keep), `nappStorage` (deprecate alias)
- [ ] Rename all function names: `getNappType()` → `getNappletType()`, `getNappUpdateBehavior()` → `getNappletUpdateBehavior()`, `loadOrCreateKeypair()` → `createEphemeralKeypair()`
- [ ] Update localStorage key prefix: `napp-state:` → `napplet-state:` + write migration utility
- [ ] Update topic strings: `napp:state-response` → `napplet:state-response`, `napp:audio-muted` → `napplet:audio-muted`
- [ ] Update HTML meta tag: `napplet-napp-type` → `napplet-type`; vite plugin reads both for one version
- [ ] Update SPEC.md: all "napp" references where "napplet" is meant
- [ ] Update skills files and README files
- [ ] Update JSDoc across all packages
- [ ] Zero `napp[^l]` occurrences in production code after pass (grep to verify)

### Phase B: `INTER_PANE` → `IPC_PEER` Rename Pass

- [ ] Verify `"INTER-PANE"` string does NOT appear in wire messages (only in constants) — if it does, add dual-accept logic to runtime
- [ ] Rename `BusKind.INTER_PANE` → `BusKind.IPC_PEER` in `@napplet/core/constants.ts`
- [ ] Update all `BusKind.INTER_PANE` call sites across core, runtime, services, shell (30+ occurrences)
- [ ] Update SPEC.md references from `INTER-PANE` / `inter-pane` to `IPC-PEER` / `ipc-peer`
- [ ] Update comments in runtime.ts that describe "inter-pane" events
- [ ] Zero `INTER.PANE` occurrences after pass (grep to verify)

### Phase C: Duplicate Type Removal

- [ ] Audit `shell/types.ts` for types also defined in `runtime/types.ts`
- [ ] Identify divergence in `ConsentRequest` — shell is missing `type` discriminator field
- [ ] Migrate canonical types to `@napplet/core` or `@napplet/runtime`
- [ ] Replace shell definitions with re-exports from canonical location
- [ ] Verify shell import paths still work (`@napplet/shell` → `ConsentRequest` must resolve)
- [ ] Verify `shell/state-proxy.ts` is dead code — if imported anywhere, file a separate fix
- [ ] Add type tests confirming shell re-exported types match runtime canonical types

### Phase D: Session Vocabulary (NappKey* → Session*)

- [ ] Evaluate scope: `NappletKeyEntry` → `SessionEntry`, `NappletKeyRegistry` → `SessionRegistry`
- [ ] Determine whether to do this in v0.7.0 or defer to v0.8.0 (add blast-radius estimate)
- [ ] If doing now: add `@deprecated` aliases, update internally, update hyprgate
- [ ] Add type alias `type PeerId = string` to runtime types with JSDoc

### Phase E: `*Hooks` → `*Adapter` (Public API)

- [ ] Rename `RuntimeHooks` → `RuntimeAdapter`
- [ ] Rename `ShellHooks` → `ShellAdapter`
- [ ] Rename sub-interfaces: drop `Runtime` prefix from nested adapters (`RuntimeRelayPoolHooks` → `RelayPoolAdapter`, etc.)
- [ ] Add deprecated type aliases: `export type RuntimeHooks = RuntimeAdapter` with `@deprecated` JSDoc
- [ ] Log removal target in deprecation schedule (v0.9.0)
- [ ] Update `createRuntime(hooks)` signature → `createRuntime(adapter)` (or keep arg name)
- [ ] Update hyprgate reference implementation
- [ ] Update skills files and READMEs

### Phase F: Documentation and Topic Direction

- [ ] Add JSDoc section to `core/topics.ts` explaining direction semantics: `shell:*` = napplet-to-shell commands, `napplet:*` = shell-to-napplet responses, `{service}:*` = bidirectional service messages
- [ ] Resolve `nappStorage` / `nappletState` aliasing: document canonical name, add `@deprecated` to alias
- [ ] Verify `@napplet/shim` module-level side effects are documented (importing shim triggers initialization — document or move to explicit `init()`)

### Cross-Cutting Verification

- [ ] Run `grep -r 'napp[^l]' packages/` — zero hits expected after Phase A
- [ ] Run `grep -r 'INTER.PANE\|INTER_PANE' packages/` — zero hits expected after Phase B
- [ ] Run `grep -r 'napp-state:' packages/` — should only appear in migration utility after Phase A
- [ ] Run type-check across all 7 packages
- [ ] All existing tests pass (193+ tests)
- [ ] SPEC.md terminology matches codebase terminology
- [ ] hyprgate reference implementation updated to use new names

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|-----------|-------|
| `napp` vs `napplet` distinction | HIGH | NIP-C4 PR#2274 directly establishes "napp" as a separate Nostr ecosystem term |
| `INTER_PANE` → `IPC_PEER` correctness | HIGH | NIP-77 `NEG-*` precedent is the only multi-word verb example in NIPs; pattern is clear |
| `*Hooks` → `*Adapter` recommendation | HIGH | 20+ SDKs surveyed; Prisma, Auth.js, tRPC uniformly use "Adapter" for this pattern |
| Session vocabulary (`NappKey*` → `Session*`) | HIGH | Standard protocol terminology (MCP, TLS, LSP all use "session" for this concept) |
| Duplicate type divergence | HIGH | Direct code analysis; `ConsentRequest` missing discriminator is verified |
| localStorage migration risk | HIGH | Functional impact confirmed — state loss without migration |
| What NOT to change | HIGH | Confirmed against 20+ sources across Nostr NIPs, SDK patterns, protocol specs |
| `windowId` as `peerId` in runtime | MEDIUM | Architecturally correct; pragmatic cost of full rename is high |

**Overall confidence:** HIGH. All major findings are grounded in primary sources (official NIP specifications, first-party SDK documentation, direct codebase analysis). The one medium-confidence area (`windowId` rename) is flagged as lower priority for that reason.

---

## Sources (aggregated)

### Official NIP Specifications
- NIP-01, NIP-42, NIP-44, NIP-45, NIP-46, NIP-47, NIP-77, NIP-07, NIP-17, NIP-89, NIP-90, NIP-29
- NIP-C4 PR#2274 — establishes "napp" as "Nostr app" ecosystem term
- NIP-5A PR#2287 — aggregate hash spec referenced by napplet protocol

### Protocol Architecture Specifications
- JSON-RPC 2.0 specification
- LSP Specification 3.17 (Microsoft)
- MCP Architecture (Model Context Protocol)
- OAuth 2.0 RFC 6749, OIDC Core 1.0
- W3C WebAuthn Level 3
- OSI Model, TLS 1.3 RFC 8446
- Hexagonal Architecture — Alistair Cockburn

### SDK and Library References
- Penpal, Comlink, Postmate, Zoid (iframe bridge SDKs)
- Socket.IO, mitt, nanoevents, EventEmitter3, Ably, Pusher (event/pubsub SDKs)
- Prisma Driver Adapters, Auth.js Adapters, tRPC Adapters (DI "Adapter" convention)
- Figma Plugin Architecture, Shopify App Bridge, Electron IPC, Capacitor
- MCP TypeScript SDK, VSCode Extension Model
- Chrome Extensions MV3, Android Runtime Permissions
- Ethers.js v5 Signer, Viem migration guide
- nostr-tools JavaScript library

### Codebase (direct analysis)
- All 7 packages: `packages/core`, `packages/acl`, `packages/runtime`, `packages/shell`, `packages/shim`, `packages/services`, `packages/vite-plugin`
- `SPEC.md` — protocol specification
- `CLAUDE.md` — project conventions

---

*Synthesis completed: 2026-04-01*
*Ready for roadmap: yes*
