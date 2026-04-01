# Naming and API Design Pitfalls

**Domain:** Ontology audit for a 7-package protocol SDK (@napplet/*)
**Researched:** 2026-04-01
**Overall confidence:** HIGH (findings grounded in actual codebase analysis + established API design literature)

---

## 1. Ecosystem Term Conflicts

When an SDK uses a term that means something different in the wider ecosystem, every reader (human or LLM) who encounters that term brings the wrong mental model. The damage compounds: documentation becomes ambiguous, search results return wrong context, and agents generate code using the ecosystem meaning rather than the SDK meaning.

### 1.1 The "napp" / "napplet" Collision (Known, Critical)

**The problem:** "Napp" is an established concept in the broader Nostr ecosystem -- it refers to a Nostr Application identifier (similar to how NIP numbers identify protocol extensions). In this SDK, "napp" is used as a shorthand for "napplet" (a sandboxed iframe mini-app). These are fundamentally different concepts: one is a protocol-level identifier, the other is a sandboxed runtime entity.

**Where it appears in this codebase (87+ occurrences across 19 files):**

| Pattern | Files | Example |
|---------|-------|---------|
| `NappKeypair` | shim | Interface for ephemeral keypair |
| `NappKeyEntry` | runtime, shell (DUPLICATED) | Registry entry for a napplet session |
| `NappKeyRegistry` | runtime, shell (DUPLICATED) | Bidirectional windowId-to-pubkey map |
| `nappType` | vite-plugin, runtime, shim | The napplet's type identifier |
| `nappClass` | services | Audio source's napplet class |
| `nappState` / `nappStorage` | shim | State API object |
| `napp-state:` prefix | runtime, shell | localStorage key prefix |
| `napp:state-response` | core/topics | Topic constant for state responses |
| `napp:audio-muted` | core/topics, services, shell | Topic constant for mute responses |
| `getNappType()` | shim | Function to read meta tag |
| `getNappUpdateBehavior()` | runtime | Config hook |
| `napplet-napp-type` | vite-plugin, shim, SPEC.md | HTML meta tag name |

**Why this is damaging:**
1. A developer searching for "napp" in Nostr contexts finds the wrong concept. An LLM asked to "explain what a napp is" in the Nostr ecosystem will give the wrong answer for this SDK.
2. The meta tag `napplet-napp-type` is a stuttering compound: "napplet's napp type" -- the word "napp" here MEANS "napplet" but is shortened in a confusing way within a tag that already says "napplet."
3. In comments like "napp-side localStorage-like API" or "forwarded hotkey from a napp" -- a new contributor or agent reads "napp" and must figure out from context that it means "napplet."

**How to detect during audit:**
- Grep for `napp[^l]` (matches "napp" but not "napplet") -- already yields 87+ hits.
- Check every meta tag, localStorage key prefix, topic string, interface name, function name, and comment.
- Check SPEC.md for "napp" used where "napplet" is meant.

**How to fix:**
- `NappKeypair` -> `NappletKeypair`
- `NappKeyEntry` -> `NappletKeyEntry`
- `NappKeyRegistry` -> `NappletKeyRegistry`
- `nappType` -> `nappletType`
- `nappClass` -> `nappletClass`
- `nappState` -> `nappletState` (keep `nappStorage` as deprecated alias if needed)
- `napp-state:` prefix -> `napplet-state:` (BREAKING for persisted data -- needs migration story)
- `napp:state-response` -> a topic within the napplet namespace
- `napplet-napp-type` meta -> `napplet-type` meta
- `getNappType()` -> `getNappletType()`
- `getNappUpdateBehavior()` -> `getNappletUpdateBehavior()`

**Migration risk for `napp-state:` localStorage prefix:** This prefix is used in persisted data. Changing it means existing napplet state becomes invisible. The audit should flag this as needing a migration utility or dual-read strategy.

### 1.2 "INTER_PANE" / "INTER-PANE" (Known, Being Fixed)

**The problem:** "Pane" is a UI term that implies a visual panel or window section. The actual mechanism is inter-process communication between sandboxed iframes. "Pane" suggests these are visual regions of the same window, not isolated security contexts communicating over a protocol boundary.

**Current state:** Already planned for rename to `IPC_PEER` / `"IPC-PEER"`. The `IPC-*` namespace follows Nostr hyphen conventions and correctly describes what the wire verb does.

**Audit scope:** 30+ occurrences of `INTER_PANE` and `"INTER-PANE"` across core, runtime, services, shell packages. Every `BusKind.INTER_PANE` reference, every `kind: 29003` comment that says "inter-pane."

### 1.3 Topic Prefix Direction Confusion

**The problem:** Topics use mixed directional prefixes that are inconsistent about who initiates vs. who responds:

| Topic | Prefix | Direction | Who initiates? |
|-------|--------|-----------|----------------|
| `shell:state-get` | `shell:` | napplet -> shell | Napplet |
| `shell:state-set` | `shell:` | napplet -> shell | Napplet |
| `napp:state-response` | `napp:` | shell -> napplet | Shell |
| `shell:audio-register` | `shell:` | napplet -> shell | Napplet |
| `napp:audio-muted` | `napp:` | shell -> napplet | Shell |
| `auth:identity-changed` | `auth:` | shell -> napplet | Shell |
| `notifications:create` | `notifications:` | napplet -> service | Napplet |
| `notifications:created` | `notifications:` | service -> napplet | Service |

The prefix convention is: `shell:` = "this message is addressed TO the shell" and `napp:` = "this message is addressed TO the napplet." But this is never documented, and the convention breaks for service topics (which use service-name prefix for both directions).

**Why this is damaging:** A new contributor sees `shell:state-get` and reads it as "the shell is getting state" (shell-initiated). But it means "hey shell, get me this state" (napplet-initiated). The `napp:state-response` prefix confirms the confusion -- it is shell-originated but prefixed with `napp:`.

**The actual convention being used:**
- `shell:*` = "shell handles this" (napplet-initiated command)
- `napp:*` = "napplet receives this" (shell-initiated response)
- `service:*` = "service handles this" (bidirectional, prefix matches service name)

**Audit action:** Document the convention explicitly in TOPICS comments. Consider whether `napp:` prefix should become `napplet:` as part of the rename. Evaluate whether the notification service pattern (same prefix for request and response, differentiated by verb tense: `create` vs `created`) is the better pattern to adopt consistently.

### 1.4 "shell" vs. "ShellBridge" vs. "Runtime" Abstraction Leak

**The problem:** Topic strings use `shell:` prefix, but the actual handler is the runtime (which is browser-agnostic). The shell is now a thin adapter. Topics like `shell:state-get` are handled by `state-handler.ts` in `@napplet/runtime`, not by `@napplet/shell`. The `shell:` prefix leaks an implementation detail that is no longer accurate.

**Audit action:** Flag all `shell:` prefixed topics for evaluation. The runtime handles them, not the shell. Whether to rename depends on whether "shell" means "the host environment" (conceptual) or "the @napplet/shell package" (concrete). If conceptual, document it. If concrete, the prefix is wrong.

---

## 2. Anti-patterns That Confuse Contributors

### 2.1 Function Names That Do Not Match Behavior

**`loadOrCreateKeypair(_nappType: string)`** in `shim/src/napp-keypair.ts`:
- The name says "load OR create" implying persistence (try to load from storage, create if not found).
- The implementation ALWAYS creates a fresh keypair. It never loads. The `_nappType` parameter is unused (prefixed with `_`).
- An agent reading this name will assume keypairs can be persistent. It will generate code that expects idempotent calls to return the same keypair.
- **Fix:** `createEphemeralKeypair()` -- no parameters, name matches behavior exactly.

**`installStorageShim()` / `installStateShim()` / `installKeyboardShim()` / `installNostrDb()`**:
- "Install" implies adding something to the system that can later be uninstalled.
- These functions just add event listeners. They never provide uninstall/cleanup.
- **Fix:** Either add teardown returns (`const cleanup = installStateShim(); cleanup()`) or rename to `initStateShim()` / `setupStateShim()` to signal one-time initialization.

**`emit(topic, extraTags, content)` in `shim/src/index.ts`**:
- "Emit" in the EventEmitter pattern means "fire an event locally." Here it means "sign a Nostr event and send it via postMessage to the shell for broadcast to other napplets."
- The name hides the async signing, network hop, and cross-process nature.
- **Tolerable because:** The shim aims for a simple event-bus-like API. But document that this is not local emission.

**`handleMessage()` in runtime**:
- Acceptable name, but `handleMessage` is overloaded in the JS ecosystem (Web Workers, Service Workers, postMessage handlers all use this name). Since this specifically handles NIP-01 protocol messages, `handleProtocolMessage()` or `handleNip01Message()` would be more precise.
- **Low priority:** Only rename if it aids agent disambiguation.

### 2.2 Parameter Names That Are Too Generic

**`data` in `RuntimeAclPersistence.persist(data: string)` and `RuntimeManifestPersistence.persist(data: string)`:**
- What is `data`? Is it JSON? Is it binary? What format?
- **Fix:** `serializedState: string` or `jsonPayload: string` -- signals both content and format.

**`options` parameter objects used inconsistently:**
- `subscribe()` has `options?: { relay?: string; group?: string }` -- acceptable, small surface.
- `publish()` has `options?: { relay?: boolean }` -- the `relay` property is a boolean here but a string (URL) in subscribe. Same name, different types across two sibling functions.
- **Fix:** In subscribe, rename to `scopedRelay?: { url: string; group?: string }`. In publish, rename to `{ viaScoped?: boolean }`.

**`content` in service handlers:**
- `handleMessage(windowId, message, send)` -- `message` is typed as `unknown[]`, which is correct but opaque. The parameter name is fine, but the type gives zero guidance.
- In the audio/notification services, the parsed content is accessed as `content.title`, `content.body`, etc. with runtime `typeof` checks everywhere.
- **Fix:** Add a parsed-content helper type or use branded types for common service message shapes.

### 2.3 Inconsistent Plurality

**`subscriptions` (Map) vs `Subscription` (interface):**
- Module-level state uses plural (`subscriptions`, `pendingChallenges`, `pendingRequests`).
- Return types use singular (`Subscription`).
- This is actually consistent and correct. Plural for collections, singular for individual instances.
- No fix needed -- this pattern is fine.

**`tags` vs `tag`:**
- NIP-01 uses `tags` (array of arrays). The SDK follows this consistently.
- But tag-finding operations use `find(t => t[0] === 'id')` where `t` is a single tag.
- The variable name `t` is too terse for readability. `tag` would be better in filter callbacks.
- **Low priority** but affects agent readability in grep results.

**`keys()` return:**
- `nappState.keys()` returns `Promise<string[]>` -- returns key names.
- `RuntimeStatePersistence.keys(prefix)` returns `string[]` -- returns full scoped keys including prefix.
- Same method name, different semantics at different abstraction layers. The shim strips the prefix, the persistence layer does not.
- **Fix:** Rename the persistence method to `scopedKeys(prefix)` or document the difference clearly.

### 2.4 Mixed Abstraction Levels in the Same API

**The `RuntimeHooks` interface mixes three levels:**

1. **Transport:** `sendToNapplet` (raw message delivery)
2. **Domain services:** `relayPool`, `cache`, `auth`, `dm` (feature-specific hooks)
3. **Infrastructure:** `crypto`, `aclPersistence`, `manifestPersistence`, `statePersistence` (plumbing)
4. **Configuration:** `config`, `strictMode` (behavior toggles)
5. **Callbacks:** `onAclCheck`, `onPendingUpdate`, `onCompatibilityIssue` (event handlers)

This is 14+ fields at the same level. A new implementor does not know which are essential vs. optional, or which categories they need to think about.

**Fix:** Group into sub-objects or document required vs. optional clearly. The current split where `relayPool` and `cache` are optional but `auth` and `config` are required is not obvious from reading the interface.

### 2.5 "Hooks" Suffix Overload

Every integration interface is suffixed with `Hooks`:
- `RuntimeRelayPoolHooks`, `RuntimeCacheHooks`, `RuntimeAuthHooks`, `RuntimeConfigHooks`, `RuntimeHotkeyHooks`, `RuntimeCryptoHooks`
- `ShellHooks`, `RelayPoolHooks`, `AuthHooks`, `ConfigHooks`, `HotkeyHooks`, `WorkerRelayHooks`, `CryptoHooks`, `DmHooks`

Two problems:
1. Shell and runtime have parallel interfaces with different names for the same concept (`AuthHooks` vs `RuntimeAuthHooks`, `CryptoHooks` vs `RuntimeCryptoHooks`).
2. "Hooks" means something specific in React. For contributors from the React ecosystem (the majority of JS developers), "hooks" implies `useState`/`useEffect` patterns, not dependency injection interfaces.

**Fix:** The `Runtime*` prefix is good for disambiguation. But consider whether `Adapter` or `Provider` would be clearer than `Hooks` for the concept being expressed (these are dependency injection contracts, not lifecycle hooks).

---

## 3. Cross-package Inconsistency Patterns

### 3.1 Duplicate Types Across Packages (Critical)

The following types are defined in BOTH `@napplet/runtime/types.ts` AND `@napplet/shell/types.ts`:

| Type | runtime definition | shell definition | Differences |
|------|-------------------|-----------------|-------------|
| `NappKeyEntry` | line 335 | line 30 | Identical fields |
| `AclEntry` | (as `AclEntryExternal`, line 378) | line 50 | Different field names: runtime has `capabilities`, shell has `capabilities` too, but runtime adds `stateQuota` |
| `ConsentRequest` | line 263 | line 68 | runtime has `type` discriminator and `serviceName`; shell does not |
| `AclCheckEvent` | line 26 | line 198 | Identical fields |

**Why this is dangerous:**
- An agent importing `NappKeyEntry` from `@napplet/shell` gets a different TypeScript type than importing from `@napplet/runtime`, even though they describe the same thing.
- The shell's `ConsentRequest` is MISSING the `type` discriminator field that the runtime version has. Code written against the shell type cannot discriminate consent types.
- If either type is updated independently, they silently diverge.

**Fix:** Canonical types should live in ONE place (`@napplet/core` or `@napplet/runtime`). Shell re-exports them. The shell should not define its own versions.

### 3.2 Parallel Hook Interfaces

Shell and runtime define parallel but incompatible hook interfaces:

| Shell | Runtime | Key Difference |
|-------|---------|----------------|
| `RelayPoolHooks` | `RuntimeRelayPoolHooks` | Shell uses `getRelayPool(): RelayPoolLike`, runtime uses `subscribe()/publish()` directly |
| `WorkerRelayHooks` | `RuntimeCacheHooks` | Completely different names for the same concept (local cache) |
| `AuthHooks` | `RuntimeAuthHooks` | Shell's `getSigner()` returns `any`, runtime's returns `RuntimeSigner` |
| `CryptoHooks` | `RuntimeCryptoHooks` | Runtime adds `randomUUID()` |
| `ConfigHooks` | `RuntimeConfigHooks` | Identical interface, different names |

This is intentional (shell is browser-facing, runtime is abstract), but the naming gives no signal about the relationship. A contributor does not know that `WorkerRelayHooks` IS `RuntimeCacheHooks` at a different abstraction level.

**Fix:** Document the mapping explicitly. Consider naming the shell interfaces to signal they are the browser-specific counterparts: `BrowserRelayPoolHooks` or keep current names but add a mapping table in the shell README.

### 3.3 Inconsistent State Terminology

The same concept is named differently across packages:

| Package | Term | Meaning |
|---------|------|---------|
| shim | `nappState` | Napplet-scoped key-value storage API |
| shim | `nappStorage` | Backwards-compat alias for `nappState` |
| core/topics | `STATE_GET`, `STATE_SET` | Topic constants for state operations |
| runtime | `statePersistence` | RuntimeHooks field for storage backend |
| runtime | `state-handler.ts` | Module handling state requests |
| shell | `state-proxy.ts` | Module handling state requests (DUPLICATE of runtime) |
| localStorage | `napp-state:` prefix | Storage key format |

"State" vs "storage" is used interchangeably. The rename from "storage" to "state" happened in v0.2.0 but left the alias `nappStorage` and the localStorage prefix `napp-state:` (not `napplet-state:`).

**Fix:** Pick one term and use it everywhere. "State" is the better choice (already more prevalent, and "storage" conflates with the persistence mechanism). Kill the `nappStorage` alias in a semver-major, or deprecate loudly.

### 3.4 Shell Contains Code That Duplicates Runtime

Both `packages/shell/src/state-proxy.ts` and `packages/runtime/src/state-handler.ts` implement the `napp-state:` key scoping logic:

```typescript
// shell/state-proxy.ts:15
return `napp-state:${pubkey}:${dTag}:${aggregateHash}:${userKey}`;

// runtime/state-handler.ts:15
return `napp-state:${pubkey}:${dTag}:${aggregateHash}:${userKey}`;
```

The shell version exists from before the runtime extraction (v0.3.0). It should have been removed when the runtime took over state handling. If both are reachable, a key format change in one but not the other causes data isolation failures.

**Audit action:** Verify that `shell/state-proxy.ts` is dead code. If it is still imported, the shell is bypassing the runtime for state operations.

---

## 4. Function Signature Anti-patterns

### 4.1 Positional Callback Arguments

**`subscribe(filters, onEvent, onEose, options?)`** in `shim/src/relay-shim.ts`:

Four positional arguments where the 2nd and 3rd are callbacks. Problems:
1. Easy to swap `onEvent` and `onEose` -- both are `() => void` compatible.
2. The `options` parameter is rarely used but forces all callers to provide the two callbacks first.
3. Agents generating code must remember the exact order. An LLM that puts callbacks in the wrong position gets a silent bug.

**Industry standard:** The options-object pattern.

```typescript
// Current (positional callbacks)
subscribe({ kinds: [1] }, (ev) => {}, () => {}, { relay: 'wss://...' })

// Better (options object)
subscribe({ kinds: [1] }, {
  onEvent: (ev) => {},
  onEose: () => {},
  relay: 'wss://...',
})

// Best (separate live vs one-shot)
// subscribe() for live streams
// query() for one-shot (already exists)
```

**Severity:** MEDIUM. The current API works and is small. But for a public SDK, the positional callback pattern is a known source of bugs, especially when LLMs generate the call site.

### 4.2 Overloaded Parameter Types

**`subscribe(filters: NostrFilter | NostrFilter[], ...)`:**
- Accepting both single filter and array forces internal normalization (`Array.isArray(filters) ? filters : [filters]`).
- Agents are uncertain which to pass. Some will always wrap in array, some will pass single.
- The NIP-01 wire format always uses arrays. The convenience of single-filter input adds implementation complexity for marginal developer ergonomics.

**Fix:** Accept only `NostrFilter[]`. Callers write `[filter]` -- trivial, explicit, no ambiguity.

### 4.3 Implicit Initialization via Import

**`packages/shim/src/index.ts`** runs initialization code at the module level:

```typescript
// Install relay message listener
window.addEventListener('message', handleRelayMessage);
installNostrDb();
installKeyboardShim();
_setInterPaneEventSender(emit);
installStateShim();
// Initialize keypair eagerly
keypair = loadOrCreateKeypair(nappType);
```

Importing `@napplet/shim` has side effects. This means:
1. The module cannot be imported in a test harness without triggering browser API calls.
2. The module cannot be tree-shaken -- importing any single export triggers all initialization.
3. An agent that imports a type from this module triggers full initialization.

**Fix:** Move side effects to an explicit `init()` function. Export individual APIs without requiring initialization. The init can be called once in the napplet's entry point.

**Counter-argument:** The shim is designed to be a single import that "just works" for napplet developers. Requiring manual init adds a step. This is a tradeoff between DX simplicity and testability.

### 4.4 `send` Callback in ServiceHandler.handleMessage

```typescript
handleMessage(windowId: string, message: unknown[], send: (msg: unknown[]) => void): void;
```

The `send` callback is provided per-call. The handler cannot store it (it might be different next call). But handlers that need to send delayed responses (e.g., after an async operation) must capture the callback in a closure. If the callback is invalid after the handler returns (e.g., the runtime re-creates it per call), delayed responses silently fail.

**Audit action:** Verify that the `send` callback is stable and can be used asynchronously. Document whether handlers can store and call it later.

---

## 5. Agent-readability Criteria

AI agents (LLMs assisting with development) process code fundamentally differently than humans. They lack persistent memory across sessions, rely on pattern matching rather than deep understanding, and are sensitive to naming consistency because they use token-level associations.

### 5.1 Properties That Help Agents

**Unambiguous names:** An agent reading `createEphemeralKeypair()` immediately knows:
- It creates (not loads, not gets).
- It is ephemeral (not persistent).
- It produces a keypair (known crypto concept).

Compare with `loadOrCreateKeypair()`: the agent must read the implementation to know it never loads.

**Consistent patterns across modules:**
- If every factory function is `create<Thing>()`, an agent learns the pattern and can predict APIs.
- If some factories are `create()`, some are `make()`, some are `build()`, the agent cannot rely on naming patterns.

**Self-documenting parameter names:**
- `windowId: string` -- the agent knows this is an identifier for a window.
- `id: string` -- the agent cannot distinguish this from event ID, subscription ID, correlation ID, etc.
- Always prefer qualified names: `windowId`, `subscriptionId`, `correlationId`, `nappletPubkey`.

**Enum-like constants with clear namespacing:**
- `BusKind.SIGNER_REQUEST` -- the agent can search for all `BusKind.*` uses.
- `29001` magic number -- the agent must grep for the number and loses semantic context.

**JSDoc with `@example` blocks:**
- Agents heavily weight code examples in JSDoc. An `@example` showing exact usage patterns is worth more than paragraphs of description.
- The current codebase does this well. Maintain this practice.

### 5.2 Properties That Hurt Agents

**Abbreviated names that conflict with ecosystem terms:**
- `napp` vs `napplet` (as documented in Section 1.1).
- An agent asked "what is a napp?" will retrieve Nostr ecosystem knowledge, not SDK knowledge.

**Same-name different-semantics across packages:**
- `NappKeyEntry` defined in both runtime and shell (Section 3.1).
- An agent importing the wrong one will not get a type error, just wrong behavior.

**Convention violations within the codebase:**
- If 90% of factories are `createFoo()` and one is `loadOrCreateFoo()`, the agent will generate `createKeypair()` calls that do not exist.

**Implicit side effects:**
- An agent importing `@napplet/shim` for type information will trigger side effects (Section 4.3).
- Agents cannot distinguish "safe to import for types" from "importing runs code."

**`any` types and `unknown[]` arrays:**
- `handleMessage(windowId: string, message: unknown[], send: (msg: unknown[]) => void)` -- the agent cannot generate correct message arrays without consulting examples.
- Adding branded types or string literal unions for message verbs would help: `type NIP01Message = ['EVENT', NostrEvent] | ['REQ', string, ...NostrFilter[]] | ['CLOSE', string]`.

### 5.3 Agent-readability Checklist

- [ ] Every exported function name is a verb-noun phrase that describes what it does (`createRuntime`, `handleMessage`, `discoverServices`)
- [ ] No function name contradicts its behavior (no "load" when it only "creates")
- [ ] Parameter names are qualified (no bare `id`, `data`, `type` without context)
- [ ] Constants are namespaced objects, not magic numbers (`BusKind.SIGNER_REQUEST`, not `29001`)
- [ ] Types used across packages are defined in exactly one place
- [ ] The same concept has the same name everywhere (not "state" in one package, "storage" in another)
- [ ] Side-effect-free imports for type-only usage
- [ ] JSDoc `@example` on every exported function
- [ ] No abbreviated names that collide with ecosystem terms

---

## 6. Audit Checklist

Use this checklist when reviewing each of the 7 packages during the ontology audit.

### Per-Symbol Checks (every exported name)

- [ ] **Ecosystem collision:** Does this name mean something different in Nostr, Web APIs, or JS ecosystem?
- [ ] **Accuracy:** Does the name describe what the thing IS or DOES? (Not what it was, or what it might do.)
- [ ] **Consistency:** Is this concept named the same way in every package that uses it?
- [ ] **Single source:** Is this type/interface defined in exactly one package? (Check for duplicates.)
- [ ] **Abbreviation check:** Any abbreviations that could be expanded for clarity? (`napp` -> `napplet`)
- [ ] **Parameter names:** Are all parameters self-documenting? (No bare `id`, `data`, `options`, `config` without qualification.)

### Per-Function Checks

- [ ] **Name matches behavior:** Does the function do exactly what its name says?
- [ ] **Signature ergonomics:** Fewer than 4 positional args? Callbacks in options objects? Required params before optional?
- [ ] **Return type clarity:** Does the return type match what the name implies? (`create*` returns the created thing, `is*` returns boolean, etc.)
- [ ] **Overload clarity:** If accepting union types, is the normalization justified?

### Per-Module Checks

- [ ] **Side effects:** Does importing this module run code? If yes, is this intentional and documented?
- [ ] **Naming pattern:** Do all exports follow the module's naming convention? (e.g., all factories are `create*`)
- [ ] **Re-exports:** Are re-exported types from other packages consistent with the canonical definition?

### Per-Package Checks

- [ ] **Type origin:** Are all types defined here, or properly imported from upstream (core/runtime)?
- [ ] **No duplicate types:** Check that types defined here are not also defined in another package.
- [ ] **Naming namespace:** Does the package use a consistent prefix/convention for its types? (`Runtime*` for runtime, no prefix for core, `Shell*` for shell if needed.)
- [ ] **Topics/constants:** Do wire-format strings follow the established convention? (hyphen-case for NIP-01 verbs, colon-separated for topics.)

### Cross-cutting Checks

- [ ] **`napp` -> `napplet`:** Zero remaining `napp[^l]` occurrences in production code (comments, strings, identifiers).
- [ ] **`INTER_PANE` -> `IPC_PEER`:** Zero remaining `INTER.PANE` occurrences.
- [ ] **Topic prefix consistency:** All topics follow `{namespace}:{action}` pattern with documented direction semantics.
- [ ] **Wire format strings:** No `napp:` prefix remaining in topic strings (should be `napplet:` if prefix is needed).
- [ ] **localStorage prefixes:** `napp-state:` updated to `napplet-state:` with migration story.
- [ ] **Meta tag names:** `napplet-napp-type` simplified to `napplet-type`.
- [ ] **Duplicate removal:** `shell/state-proxy.ts` dead code removed, `shell/types.ts` duplicate types removed.
- [ ] **Hook interface naming:** Consistent suffix convention documented (`*Hooks` or `*Provider` or `*Adapter`).

### Documentation Checks

- [ ] **SPEC.md:** All "napp" references updated to "napplet" where appropriate.
- [ ] **README.md (per package):** Terminology matches code.
- [ ] **JSDoc:** All exported symbols have JSDoc with accurate descriptions.
- [ ] **Skill files:** Updated to use correct terminology.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Severity | Mitigation |
|-------------|---------------|----------|------------|
| `napp` -> `napplet` rename | `napp-state:` localStorage prefix breaks persisted data | HIGH | Dual-read migration: try new prefix, fall back to old |
| `napp` -> `napplet` rename | Meta tag `napplet-napp-type` rename breaks existing napplets | MEDIUM | Vite plugin reads both old and new meta names for one version |
| `INTER_PANE` -> `IPC_PEER` rename | Wire verb change breaks cross-version compatibility | HIGH | Runtime accepts both old and new wire verb during transition |
| Topic prefix audit | Changing `shell:*` topics changes wire protocol | HIGH | Do NOT rename wire-format topic strings unless adding deprecation aliases |
| Duplicate type removal | Removing `ConsentRequest` from shell breaks shell consumers | MEDIUM | Re-export from runtime, keep import path working |
| Dead code removal | `shell/state-proxy.ts` might still be imported | LOW | Check import graph before deletion |
| localStorage prefix migration | Napplets lose stored state on upgrade | HIGH | Ship migration utility in runtime that copies old-prefix keys to new-prefix |
| Agent-readability pass | Renaming exported functions is semver-breaking | HIGH | Group renames into a single semver-major bump |

---

## Sources

- [The Art of Naming in API Design](https://moldstud.com/articles/p-the-art-of-naming-in-api-design-best-practices-explained-for-developers) -- naming best practices for APIs
- [API Design Anti-patterns](https://specmatic.io/appearance/how-to-identify-avoid-api-design-anti-patterns/) -- common anti-patterns in API design
- [SDK Design Best Practices](https://www.shakebugs.com/blog/sdk-design-best-practices/) -- SDK naming and structure guidelines
- [Google AIP-190: Naming Conventions](https://cloud.google.com/apis/design/naming_convention) -- Google's authoritative naming convention guide
- [How to Name Events in Event Driven Architecture](https://richygreat.medium.com/how-to-name-events-in-event-driven-architecture-cc962d93ed60) -- event naming conventions (past-tense for events, imperative for commands)
- [Message Naming Conventions](https://www.jimmybogard.com/message-naming-conventions/) -- distinguishing events from commands in message naming
- [Cosmos SDK ADR-023: Protocol Buffer Naming](https://docs.cosmos.network/main/build/architecture/adr-023-protobuf-naming) -- avoiding namespace collisions in protocol SDKs
- [Positional vs Named Arguments in TypeScript](https://medium.com/@soroushysf/positional-vs-named-arguments-in-typescript-when-to-use-each-9e533aa274a2) -- when to use options objects vs positional args
- [How to Write a Good Spec for AI Agents](https://www.oreilly.com/radar/how-to-write-a-good-spec-for-ai-agents/) -- designing APIs for LLM consumption
- [Formatting Tool Specifications for LLM Comprehension](https://apxml.com/courses/prompt-engineering-agentic-workflows/chapter-3-prompt-engineering-tool-use/formatting-tool-specifications-llm) -- tool naming for agent comprehension
- [Why You Need a Semantic Layer](https://www.cloudgeometry.com/blog/ai-coding-agents-semantic-layer) -- semantic naming for AI agent effectiveness
- [TypeScript Harmony in Monorepos](https://www.javacodegeeks.com/2024/11/typescript-harmony-in-monorepos-dependencies-consistency.html) -- centralized type management in monorepos
- [Topic Architecture Best Practices (Solace)](https://docs.solace.com/Messaging/Topic-Architecture-Best-Practices.htm) -- topic naming conventions for event-driven systems
- Local codebase analysis: `packages/*/src/*.ts`, `SPEC.md`, `CLAUDE.md`

---

*Pitfalls audit: 2026-04-01 (v0.7.0 Ontology Audit milestone research)*
*Confidence: HIGH for sections 1-4 (grounded in direct codebase analysis with exact line references). MEDIUM for section 5 (agent-readability is an emerging field with limited formal research). HIGH for section 6 (checklist derived from concrete findings).*
