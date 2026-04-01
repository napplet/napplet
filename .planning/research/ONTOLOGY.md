# Protocol Ontology Research

**Domain:** Naming conventions in message-based, multi-layer protocol architectures
**Researched:** 2026-04-01
**Overall confidence:** HIGH (primary sources are RFCs, W3C specs, established protocol implementations)
**Purpose:** Inform v0.7.0 ontology audit of the @napplet/* SDK vocabulary

---

## 1. Layered Protocol Stack Naming

### Established Vocabulary Across Systems

| System | Bottom Layer | Middle Layer | Top Layer |
|--------|-------------|-------------|-----------|
| OSI Model | Physical / Data Link | Transport / Session | Presentation / Application |
| TCP/IP | Network Access | Transport (TCP/UDP) | Application |
| MCP | Transport (stdio, HTTP) | Protocol (JSON-RPC lifecycle) | Data (primitives: tools, resources, prompts) |
| LSP | Transport (stdio, pipe, socket) | Base Protocol (JSON-RPC framing) | Language Protocol (requests/notifications) |
| WebRTC | Transport (DTLS/SCTP) | Session (SDP signaling) | Data Channel / Media Stream |

**Consistent pattern across all systems:** The lowest layer is always called **transport** -- this is universal. The top layer is the **application** or **data** layer. The middle varies: "protocol," "session," or "base protocol."

### Layer Role Terminology

The following vocabulary recurs across protocol specifications:

- **Transport**: The how of message delivery. Agnostic of message semantics. Concerns: framing, encoding, connection establishment, reliability.
- **Protocol Engine** (or **Protocol Core**): The what of message processing. Handles verbs, state machines, lifecycle. MCP calls this the "data layer." LSP calls it the "base protocol." This is the layer that knows REQ/EVENT/AUTH but not postMessage vs WebSocket.
- **Application API** (or **SDK**): Developer-facing surface. Hides protocol details behind ergonomic functions (subscribe, publish, query). LSP SDKs expose `connection.onRequest()` rather than raw JSON-RPC parsing.
- **Adapter**: Bridges a protocol layer to a specific environment. Hexagonal architecture formalizes this as "Adapters plug into Ports." The adapter implements a technology-specific integration point.

### What Hexagonal Architecture Adds

The hexagonal (ports-and-adapters) pattern, formalized by Alistair Cockburn, provides the clearest vocabulary for the napplet architecture:

- **Port**: A technology-agnostic interface defining a purposeful conversation. In napplet terms, `RuntimeHooks` is a set of outgoing ports. `handleMessage()` is an incoming port.
- **Adapter**: A technology-specific implementation of a port. The `@napplet/shell` package is a browser adapter. A hypothetical CLI shell would be a different adapter for the same ports.
- **The hexagonal architecture explicitly avoids the word "hooks"** -- the standard terms are "port" (interface) and "adapter" (implementation).

### Assessment of Napplet Vocabulary

| Current Term | Standard Term | Assessment |
|-------------|--------------|------------|
| `@napplet/runtime` | Protocol Engine / Protocol Core | **Good.** "Runtime" is defensible -- it captures "the thing that runs the protocol." MCP uses "runtime" in its SDK. However, "engine" or "core" would be more precise for the protocol-processing layer specifically. Since `@napplet/core` already exists as the types/constants package, "runtime" avoids collision. |
| `RuntimeHooks` | Ports (hexagonal) / Adapters interface | **Deviates.** "Hooks" is a React-ism that has leaked into general JS vocabulary. In protocol architecture, these are **ports** -- abstract interfaces that adapters implement. However, "hooks" is widely understood in the JS/TS ecosystem as "injection points," so it may be pragmatically defensible. |
| `@napplet/shell` | Browser Adapter / Transport Adapter | **Good but imprecise.** "Shell" is the domain term (from the spec), and it accurately describes what the host application is. But architecturally, this package is a **browser adapter** that plugs into the runtime's ports. The name "shell" conflates the domain concept (host application) with the architectural role (adapter). |
| `ShellBridge` | Protocol Engine / Message Router / Relay Proxy | **Mixed.** See Section 3 below for detailed analysis of "bridge" vs alternatives. The current name carries over from when the shell and runtime were one package. Now that `@napplet/runtime` is the protocol engine, `ShellBridge` in the shell package is really a **browser adapter** that wires postMessage to the runtime. |
| `SendToNapplet` | Transport / Message Sender | **Good.** Clear, verb-oriented, self-documenting. Standard protocol stacks would call this a "send callback" or "message sink." |
| `createRuntime(hooks)` | Factory pattern | **Good.** Follows the factory pattern naming. MCP uses `ClientSession()`, LSP SDKs use `createConnection()`. The napplet choice of `createRuntime()` is clear. |

### Confidence: HIGH
Sources: OSI Model (ISO 7498), TCP/IP (RFC 1122), [MCP Architecture](https://modelcontextprotocol.io/docs/learn/architecture), [LSP Specification 3.17](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/), [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture), [WebRTC API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)

---

## 2. Command vs Event Vocabulary

### The Three-Part Taxonomy

Every major message-based protocol converges on the same three message types, though they name them differently:

| System | Client-to-Server (expects reply) | Server-to-Client (no reply expected) | Reply to a request |
|--------|----------------------------------|--------------------------------------|-------------------|
| JSON-RPC 2.0 | **Request** (has `id`) | **Notification** (no `id`) | **Response** |
| LSP | **Request** (method + id) | **Notification** (method, no id) | **Response** (result/error + id) |
| MCP | **Request** | **Notification** | **Response** |
| NIP-01 (relay) | `REQ`, `EVENT`, `CLOSE`, `AUTH`, `COUNT` (client verbs) | `EVENT`, `EOSE`, `NOTICE` (server pushes) | `OK`, `CLOSED`, `COUNT` (server replies) |
| WebSocket | Message (bidirectional) | -- | -- |
| CQRS | **Command** (write intent) | **Event** (fact that happened) | -- |

**Key insight:** JSON-RPC 2.0, LSP, and MCP all distinguish messages by whether they expect a response:

- **Request** = "I need an answer" (has correlation ID)
- **Notification** = "FYI, no reply needed" (no correlation ID)
- **Response** = "Here's your answer" (carries the request's correlation ID)

NIP-01 is unusual because it uses **verb-based dispatch** rather than request/response IDs. The verb itself determines whether a reply is expected (`EVENT` from client expects `OK`; `REQ` expects `EVENT` stream + `EOSE`). There is no general-purpose correlation ID -- subscription IDs serve this role for REQ/EVENT pairs, and event IDs serve it for EVENT/OK pairs.

### Command vs Event in CQRS

The CQRS (Command Query Responsibility Segregation) pattern provides a complementary vocabulary:

- **Command**: An intent to change state. Imperative. Directed at a specific handler. May be rejected. Examples: "PublishEvent," "GrantCapability," "RevokeAccess."
- **Event**: A fact that happened. Past tense. Broadcast to interested parties. Cannot be rejected (it already happened). Examples: "EventPublished," "CapabilityGranted," "SessionEstablished."
- **Query**: A request for data that does not change state.

### Assessment of Napplet Vocabulary

| Current Term | Standard Term | Assessment |
|-------------|--------------|------------|
| NIP-01 verbs (REQ, EVENT, CLOSE, AUTH, COUNT) | Verbs / Commands | **Correct.** These follow NIP-01 spec directly. No deviation. |
| `BusKind` (29001 SIGNER_REQUEST, 29002 SIGNER_RESPONSE) | Request/Response pair | **Good.** The REQUEST/RESPONSE suffix follows the standard pattern. |
| `BusKind.INTER_PANE` (29003) | IPC / Notification / Event | **Deviates.** "Inter-pane" describes the transport topology (between panes/iframes) rather than the message semantics. Standard vocabulary would call this **IPC** (inter-process communication) or **PeerEvent**. The planned rename to `IPC_PEER` is a significant improvement -- it names the semantic role (peer-to-peer IPC) rather than the physical topology (between panes). |
| `BusKind.SERVICE_DISCOVERY` (29010) | Discovery / Announce | **Good.** "Service discovery" is the standard term (mDNS, DNS-SD, Kubernetes service discovery, MCP tool discovery). |
| Topics like `shell:state-get`, `shell:state-set` | Commands | **Good pattern, mixed prefix.** The `shell:` prefix indicates direction (toward the shell), which is useful. The verb-noun pattern (`state-get`, `state-set`) follows LSP's `textDocument/completion` pattern of `resource/action`. |
| `napp:state-response` | Response / Reply | **Good.** The `napp:` prefix indicates the response direction. |

### Confidence: HIGH
Sources: [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification), [LSP Specification 3.17](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/), [MCP Architecture](https://modelcontextprotocol.io/docs/learn/architecture)

---

## 3. Storage Proxy/Adapter Naming

### What the Pattern Actually Is

The napplet storage proxy pattern involves:
1. A sandboxed app (napplet) that cannot access localStorage directly
2. A host (shell/runtime) that performs storage operations on behalf of the app
3. Communication via postMessage using NIP-01 event format
4. Scoped keys preventing cross-app data access

This is a well-known pattern in sandboxed architectures. Let me map it to established vocabulary:

### Established Systems and Their Terms

| System | Pattern | Term Used |
|--------|---------|-----------|
| Android | Cross-process data access | **ContentProvider** / **ContentResolver** |
| Chrome Extensions | Background script proxies storage for content scripts | **Storage API** (chrome.storage) |
| Web Workers | Main thread proxies DOM/storage for workers | **Proxy** (Comlink), **Bridge** (postMessage bridge) |
| Microservices | Service-to-service data delegation | **Gateway** (API Gateway), **Proxy** (sidecar proxy) |
| GoF Design Patterns | Remote resource access control | **Proxy** (controls access), **Adapter** (converts interface), **Bridge** (decouples abstraction from implementation) |
| Microsoft Power BI | Iframe-to-host data exchange | **PostMessageProxy** |
| MCP | Server provides data to client | **Resource** (read-only), **Tool** (read-write) |
| Electron | Renderer-to-main process delegation | **IPC** (ipcMain/ipcRenderer) |

### Distinguishing the GoF Patterns

The GoF patterns have precise definitions that matter here:

- **Proxy**: Same interface, controls access. The client thinks it is talking to the real thing. A storage proxy would expose the same API as localStorage but route operations through postMessage. **This is exactly what napplet does** -- `nappStorage` in the shim has get/set/remove/keys that look like localStorage but proxy through the shell.
- **Adapter**: Different interface, converts between them. An adapter would convert a `nappStorage` API call into a different storage backend's API.
- **Bridge**: Decouples abstraction from implementation so both can vary independently. A bridge would let you swap the napplet-side API independently from the shell-side storage backend.
- **Gateway**: Entry point to a network of services. More appropriate for API gateways routing to microservices.
- **Provider**: Supplies a resource or service. React's Context.Provider, Android's ContentProvider. Emphasizes the supplier role.

### Recommended Vocabulary for Napplet

The napplet pattern is most precisely a **Proxy** on the shim side (client-side facade that looks like the real API) and a **Handler** on the runtime side (processes proxied requests).

| Component | Current Name | Recommended | Rationale |
|-----------|-------------|-------------|-----------|
| Shim-side API | `nappStorage` / `nappState` | `stateProxy` or keep `nappState` | "nappState" names the domain concept (napplet-scoped state). A pure architectural name would be "stateProxy" since it proxies state operations. Either works. |
| Runtime-side processor | `state-handler.ts` / `handleStateRequest()` | **Handler** | Correct. "Handler" is the standard term for the server side of a proxied operation. |
| The overall pattern | "storage proxy" / "state proxy" | **State Proxy** | "Proxy" is the correct GoF pattern. "State" is more accurate than "storage" because it emphasizes scoped application state rather than raw key-value storage. |
| Topic prefix | `shell:state-*` | Keep | The `shell:` prefix indicates these are commands directed at the shell/runtime. |

### Assessment of Current Vocabulary

The v0.2.0 rename from `storage` to `state` was a good call -- it distinguishes napplet application state from raw localStorage. The `nappStorage` alias (still present) creates confusion because "storage" suggests persistence infrastructure while "state" suggests application-level scoped data.

The runtime-side `handleStateRequest()` and `state-handler.ts` naming is correct and follows standard server-side handler conventions.

### Confidence: HIGH
Sources: [GoF Design Patterns](https://en.wikipedia.org/wiki/Proxy_pattern), [Microsoft window-post-message-proxy](https://github.com/microsoft/window-post-message-proxy), [Comlink](https://github.com/GoogleChromeLabs/comlink), [Android ContentProvider docs](https://developer.android.com/reference/android/content/ContentProvider)

---

## 4. Signer/Key Provider Naming

### Established Vocabulary Across Systems

| System | Term for "thing that signs" | Term for "thing that holds keys" | Term for "thing that delegates signing" |
|--------|---------------------------|--------------------------------|---------------------------------------|
| NIP-07 (Nostr) | `window.nostr` (implicit signer) | -- | -- |
| NIP-46 (Nostr Connect) | **Remote Signer** / **Bunker** | -- | **Client** (the app requesting signatures) |
| Ethers.js v5 | **Signer** | **Wallet** | **Provider** (read-only node connection) |
| Viem (ethers successor) | **Account** | **Wallet Client** | **Public Client** |
| Web Crypto API | **CryptoKey** | **SubtleCrypto** | -- |
| Web3Signer (Consensys) | **Signer** | **Keystore** / **Vault** | -- |
| W3C WebAuthn | **Authenticator** | **Credential** | **Relying Party** |
| Java / JCA | **Signature** (operation) | **KeyStore** | **Provider** (cryptographic service provider) |
| PKCS#11 (HSM standard) | **Mechanism** | **Token** | **Slot** |
| Apple CryptoKit | **PrivateKey** (signs directly) | **Keychain** | -- |
| Android Keystore | -- | **KeyStore** | **KeyGenParameterSpec** |

### Key Distinctions

The vocabulary splits along a clear axis:

1. **Signer**: The entity that performs signing. It may hold the key or delegate to something that does. This is the most common term in JS/TS ecosystems (ethers.js, nostr-tools, NIP-07/46).

2. **Provider**: An entity that supplies a service or resource. Overloaded -- ethers.js uses "provider" for read-only blockchain connections, Java JCA uses it for cryptographic algorithm implementations, React uses it for dependency injection. Viem deliberately avoided "provider" because of this overload.

3. **Wallet**: A user-facing concept that manages keys and signs. More appropriate when the user is directly managing keys. In Viem, "Wallet Client" replaces ethers.js "Signer" to better align with Ethereum ecosystem terminology.

4. **Keystore / Vault**: The place where keys are stored. Separate from the signing operation. HashiCorp Vault, Azure Key Vault, Java KeyStore, Android Keystore all use this pattern. The store is passive; a signer pulls keys from it.

5. **Account**: Viem's choice -- represents an identity that can sign, abstracting over whether signing is local or remote. Good when the distinction between local and remote signing matters.

### The Napplet-Specific Problem

In napplet, the signing flow is:

```
Napplet (no keys) --[kind 29001 request]--> Runtime --[delegates to]--> Host Signer (NIP-07/NIP-46)
                  <--[kind 29002 response]--         <--[signed event]--
```

This is a **signer proxy**: the runtime acts as an intermediary between the napplet (which cannot access the host's signer) and the host's actual signer. The napplet sends a signing request; the runtime enforces ACL, obtains consent for destructive kinds, then delegates to the host's signer.

### Recommended Vocabulary

| Component | Current Name | Recommended | Rationale |
|-----------|-------------|-------------|-----------|
| The overall pattern | "signer proxy" | **Signer Proxy** | Correct. It is a proxy (same interface, controlled access) for signing operations. Consistent with NIP-07 which calls the interface a "signer." |
| Host-side signer interface | `RuntimeAuthHooks.getSigner()` | Keep `getSigner()` | Follows NIP-07 convention. The return type `RuntimeSigner` mirrors the NIP-07 `window.nostr` interface. |
| Request bus kind | `BusKind.SIGNER_REQUEST` (29001) | Keep | Clear and standard. |
| Response bus kind | `BusKind.SIGNER_RESPONSE` (29002) | Keep | Clear and standard. |
| The hooks interface | `RuntimeAuthHooks` | Consider **`RuntimeSignerHooks`** | "Auth" is ambiguous -- it could mean authentication (NIP-42 handshake) or authorization (ACL). The hooks are specifically about signing delegation, so `RuntimeSignerHooks` is more precise. However, `getUserPubkey()` is about identity, not signing, so maybe the current grouping is intentional. |

### Assessment

The napplet vocabulary is well-aligned with the Nostr ecosystem (NIP-07 "signer", NIP-46 "remote signer"). The term "signer proxy" accurately describes the pattern. The `RuntimeAuthHooks` name is the one area of mild imprecision -- it groups identity (`getUserPubkey`) with signing (`getSigner`), which is fine if you consider authentication as "proving identity and providing signing capability," but could be split for clarity.

### Confidence: HIGH
Sources: [NIP-07](https://github.com/nostr-protocol/nips/blob/master/07.md), [NIP-46](https://github.com/nostr-protocol/nips/blob/master/46.md), [Ethers.js Signer docs](https://docs.ethers.org/v5/api/signer/), [Viem migration guide](https://viem.sh/docs/ethers-migration), [W3C WebAuthn Level 3](https://www.w3.org/TR/webauthn-3/)

---

## 5. Session/Connection Concept Naming

### Established Vocabulary

| System | Per-Connection State | What It's Called | Key Properties |
|--------|---------------------|------------------|----------------|
| OSI Layer 5 | State between two endpoints | **Session** | Establishment, maintenance, teardown. Dialog control. |
| TLS | Negotiated crypto state | **Session** (TLS Session) | Session ID, cipher suite, master secret. Can be resumed. |
| SIP | Media exchange between parties | **Session** (via SDP) | Session Description Protocol describes the session. Initiated, active, terminated. |
| WebRTC | Media/data connection | **PeerConnection** (RTCPeerConnection) | Two peers, established via signaling, bidirectional. |
| HTTP | Stateless request-response | **Connection** (TCP), cookies for state | HTTP itself is stateless; sessions are application-level. |
| MCP | Client-server channel | **Session** (ClientSession) | Stateful JSON-RPC channel. Initialization, capability negotiation, teardown. |
| SSH | Encrypted channel | **Session** | Authenticated, encrypted, multiplexed channels. |
| WebSocket | Persistent bidirectional channel | **Connection** | Opened, messages sent/received, closed. |
| NIP-42 (Nostr relay) | Authenticated relay connection | (implicit) | Challenge-response per WebSocket connection. |

### The Semantic Distinctions

- **Session**: Implies statefulness, lifecycle (setup/active/teardown), identity binding, and temporal scope. A session has a beginning and an end. State is accumulated over the session's lifetime. **Best for:** authenticated, stateful interactions with lifecycle events.

- **Connection**: Implies a transport-level link between two points. More mechanical, less semantic. A connection carries data; a session gives that data meaning. **Best for:** raw transport channels.

- **Context**: Implies ambient state available to operations. Does not strongly imply lifecycle or transport. **Best for:** read-only state bags passed to operations (RequestContext, ExecutionContext).

- **Channel**: Implies a dedicated communication pathway, often multiplexed within a connection. gRPC channels, WebRTC data channels, Go channels. **Best for:** multiplexed streams within a connection.

- **Peer**: Implies the other party in a communication. **Best for:** identifying the remote endpoint, not the state between endpoints.

- **Handle**: An opaque token representing a resource. POSIX file handles, WASI handles, window handles. **Best for:** unforgeable references to managed resources.

### What a Napplet "Session" Actually Is

When a napplet loads, the following state is established:

1. Ephemeral keypair generated (`NappKeypair`)
2. AUTH challenge-response completed
3. Identity registered in `NappKeyRegistry` (pubkey, windowId, dTag, aggregateHash)
4. ACL entry resolved
5. Subscriptions tracked per windowId
6. State storage scoped by composite key

This is unambiguously a **session** in the protocol sense:
- It has a lifecycle (AUTH handshake establishes it, window destroy tears it down)
- It binds identity (ephemeral pubkey + dTag + aggregateHash)
- It accumulates state (subscriptions, ACL decisions, consent cache)
- It has temporal scope (one page load)

### Assessment of Napplet Vocabulary

| Current Term | Standard Term | Assessment |
|-------------|--------------|------------|
| `NappKeypair` | SessionKeypair / EphemeralKeypair | **Imprecise.** "NappKeypair" describes what owns it (a napp) but not what it is for (the session). "SessionKeypair" or "EphemeralSessionKeypair" would be more descriptive. The keypair's sole purpose is to authenticate a session. |
| `NappKeyEntry` | SessionEntry / SessionRecord | **Imprecise.** Same issue -- named for ownership rather than purpose. This is a session record: it contains the session identity (pubkey, dTag, hash), window binding (windowId), and timestamp (registeredAt). |
| `NappKeyRegistry` | SessionRegistry | **Imprecise.** This registry maps windowIds to session records. "NappKeyRegistry" suggests it is about keys (cryptographic material), but it actually stores session metadata. "SessionRegistry" would be clearer. |
| `windowId` | sessionId / connectionId | **Partially defensible.** In the browser adapter, the window IS the connection endpoint, so windowId identifies both the session and the transport endpoint. But at the runtime layer (which is browser-agnostic), "windowId" leaks browser transport concerns into the protocol engine. A more abstract term like `peerId` or `sessionId` would be cleaner in the runtime layer, with the shell adapter mapping windowId <-> peerId. |
| `pendingChallenges` | (no standard name) | **Fine.** Implementation detail, not protocol vocabulary. |
| `authInFlight` | (no standard name) | **Fine.** Clear and descriptive. |
| Composite key `(pubkey, dTag, aggregateHash)` | Session Identity | The composite key is the **session identity** -- it uniquely identifies a napplet session for ACL and state scoping purposes. The SPEC.md calls it "composite key" which is accurate but generic. "Session identity" would connect it to the session concept. |

### The windowId Problem

The most significant naming issue is `windowId` permeating the runtime layer. The runtime is designed to be browser-agnostic (no DOM types, no postMessage), yet its primary identifier for napplet sessions is called "windowId" -- a term that only makes sense in a browser context.

In the runtime layer, this identifier represents "which napplet session is this message from/to." Standard protocol terminology would call this a **peer ID**, **session ID**, or **endpoint ID**. The browser shell adapter would then map between its concrete window references and the abstract peer/session IDs.

However, renaming `windowId` to `sessionId` throughout the entire codebase is a large, high-risk change. A pragmatic approach might be to:
1. Alias the type: `type PeerId = string` in the runtime, with JSDoc noting it maps to windowId in browser shells
2. Use `peerId` in new runtime APIs while keeping `windowId` in shell-layer code

### Confidence: HIGH
Sources: [OSI Model (Wikipedia)](https://en.wikipedia.org/wiki/OSI_model), [SIP (Wikipedia)](https://en.wikipedia.org/wiki/Session_Initiation_Protocol), [MCP Architecture](https://modelcontextprotocol.io/docs/learn/architecture), [WebRTC API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API), [TLS 1.3 (RFC 8446)](https://datatracker.ietf.org/doc/html/rfc8446)

---

## 6. Capability Security Vocabulary

### Academic Foundations

Capability-based security was formalized by Dennis and Van Horn (1966). The core vocabulary:

- **Capability**: A communicable, unforgeable token of authority that references an object together with a set of access rights. Possession of a capability is sufficient to exercise the rights it represents -- no additional identity check is needed.
- **Rights / Permissions**: What operations the capability allows. Read, write, execute, etc.
- **Authority**: The ability to affect something. Capabilities are tokens of authority.
- **Ambient Authority**: Authority derived from identity alone (e.g., "root can do anything"). Capability systems explicitly avoid this -- you can only do what your capabilities allow.
- **Principle of Least Privilege**: Each entity should have only the capabilities it needs, nothing more.
- **Unforgeable**: Capabilities cannot be manufactured or guessed. They must be explicitly granted.
- **Transferable**: Capabilities can be passed from one entity to another.

### Capability Systems in Practice

| System | Capability Term | What It Controls | Granularity |
|--------|----------------|-----------------|-------------|
| WASI | **Capability** / Handle | File access, network access, clocks | Resource-typed (file, socket, clock) |
| Deno | **Permission** | --allow-read, --allow-net, --allow-env | Resource + path/host scoping |
| OAuth 2.0 | **Scope** | API access boundaries | String tokens ("read:user", "write:repo") |
| OIDC | **Claim** | Identity attributes | Key-value pairs in JWT |
| Android | **Permission** | Camera, location, storage, network | String identifiers in manifest |
| POSIX capabilities | **Capability** (CAP_*) | Kernel-level operations | Bitfield flags (CAP_NET_BIND_SERVICE) |
| AWS IAM | **Policy** / **Permission** | API actions on resources | Action + Resource + Condition |
| Macaroons | **Macaroon** (caveated capability) | Delegatable access with restrictions | Chained caveats |

### Key Terminology Distinctions

- **Capability vs Permission**: A capability is an unforgeable token you possess. A permission is a rule in a system that says what you are allowed to do. Capabilities are bearer tokens (having it = can use it). Permissions are checked against identity (who you are = what you can do). **ACL-based systems use permissions; capability-based systems use capabilities.** These are fundamentally different models.

- **Scope vs Capability**: OAuth 2.0 "scopes" are string-based access boundaries requested and granted during authorization. They are closer to permissions than true capabilities because they are checked against the token holder's identity.

- **Grant vs Revoke**: The lifecycle verbs. You **grant** a capability/permission to an entity. You **revoke** it when access should be removed. OAuth 2.0 uses "authorization grant" for the act of granting access.

- **Policy**: A set of rules that determine access decisions. AWS IAM policies, SELinux policies, ACL policies. A policy is the enforcement mechanism; capabilities and permissions are what gets enforced.

- **Claim**: An assertion about an entity (OIDC). "This user's email is X." Claims describe attributes, not access rights.

### The ACL vs Capability Distinction in Napplet

Napplet currently uses the word "capability" (`Capability` type, `CAP_*` constants) within what is structurally an **ACL system**:

- Access is checked against identity: `(pubkey, dTag, aggregateHash)` -> lookup entry -> check capability bits
- The "capabilities" are stored in a central registry (`AclState`) keyed by identity
- Capabilities are not bearer tokens -- a napplet cannot pass its capabilities to another napplet
- The system checks "does this identity have this capability?" not "does this entity possess this token?"

**This is an ACL with capability-style naming.** The napplet ACL system is closer to POSIX capabilities (bitfield flags checked against process identity) or Android permissions (declared in manifest, checked against app identity) than to true capability-based security (unforgeable tokens).

### Assessment of Napplet Vocabulary

| Current Term | Standard Equivalent | Assessment |
|-------------|--------------------|------------|
| `Capability` type (`'relay:read'`, `'sign:event'`, etc.) | **Permission** (ACL) or **Right** (capability) | **Defensible but technically imprecise.** The napplet `Capability` strings are structurally permissions in an ACL system (identity-based lookup). However, the `colon-separated` format (`resource:action`) follows OAuth scope conventions and is widely understood. POSIX also calls its bitfield flags "capabilities" despite being identity-checked. The naming is industry-standard even if not academically pure. |
| `AclState` / `AclEntry` | Keep | **Correct.** The ACL naming is honest about the access control model. `AclState` is an immutable snapshot of the access control list. `AclEntry` is one identity's record in that list. |
| `Identity` (`{ pubkey, dTag, hash }`) | **Principal** (security term) or **Subject** (ACL term) | **Slightly unusual.** In security terminology, the entity whose access is being controlled is called the **principal** or **subject**. "Identity" is accurate but could be confused with "user identity." The napplet identity is a session identity (ephemeral keypair + version hash), not a user identity. "Principal" would be more precise in security contexts. |
| `enforce()` / ACL check | **Authorize** / **Check** | **Good.** "Enforce" is clear and action-oriented. "Authorize" is the standard security term, but "enforce" emphasizes that this is a mandatory check, not an optional authorization flow. |
| `blocked` flag on AclEntry | **Deny** / **Block** | **Fine.** An orthogonal deny that overrides capabilities. This follows the "deny overrides allow" pattern common in XACML and AWS IAM. |
| `ConsentRequest` | **Authorization Prompt** / **Permission Request** | **Good domain term.** "Consent" is the user-facing term (GDPR consent, OAuth consent screen). It accurately describes the UX: the user is being asked to consent to a potentially dangerous action. |
| `DEFAULT_QUOTA` | (no standard term) | **Fine.** Resource quotas are common in capability/permission systems. |
| Capability string format `resource:action` | Follows OAuth/Kubernetes RBAC convention | **Good.** `relay:read`, `sign:event`, `state:write` follow the `resource:action` pattern used by OAuth scopes (`repo:read`), Kubernetes RBAC (`pods:get`), and AWS IAM (`s3:GetObject`). |

### Confidence: HIGH
Sources: [Capability-based security (Wikipedia)](https://en.wikipedia.org/wiki/Capability-based_security), [WASI Design Principles](https://github.com/WebAssembly/WASI/blob/main/docs/DesignPrinciples.md), [Deno Security](https://docs.deno.com/runtime/fundamentals/security/), [OAuth 2.0 Scopes (RFC 6749)](https://datatracker.ietf.org/doc/html/rfc6749), [OIDC Core](https://openid.net/specs/openid-connect-core-1_0.html), [Cornell CS 513 Capability-based Access Control](https://www.cs.cornell.edu/courses/cs513/2005fa/L08.html)

---

## 7. Assessment of Current Napplet Vocabulary

### Summary Table: All Terms

| Current Name | Domain | Standard Equivalent | Alignment | Action |
|-------------|--------|--------------------|-----------|----|
| `@napplet/runtime` | Layer naming | Protocol Engine | Good | Keep -- avoids collision with @napplet/core |
| `@napplet/shell` | Layer naming | Browser Adapter | Defensible | Keep -- domain term from spec, even if architecturally it is an adapter |
| `@napplet/core` | Layer naming | Protocol Types / Wire Format | Good | Keep |
| `@napplet/acl` | Layer naming | Access Control | Good | Keep |
| `@napplet/shim` | Layer naming | Client SDK / Client Library | Unusual | Consider: "shim" implies polyfill. Standard terms would be "client" or "sdk." But "shim" accurately reflects that it shims browser APIs (postMessage) into a relay-like interface. Defensible. |
| `RuntimeHooks` | Architecture | Ports (hexagonal) | Deviates | Low priority rename. "Hooks" is understood in JS ecosystem. If renaming, `RuntimePorts` or `RuntimeAdapterInterface` would be more precise. |
| `ShellBridge` | Architecture | Message Router / Browser Adapter | Stale | This name was correct when shell and runtime were one unit. Now the runtime is the message router and ShellBridge is a thin browser adapter. Consider `ShellAdapter` or simply keep the name since it is already in SPEC.md. |
| `NappKeypair` | Session | SessionKeypair | Imprecise | Rename to express purpose (session auth) not owner (napp). |
| `NappKeyEntry` | Session | SessionRecord / SessionEntry | Imprecise | Same issue -- name describes owner, not purpose. |
| `NappKeyRegistry` | Session | SessionRegistry | Imprecise | Same issue. |
| `windowId` | Session | peerId / sessionId | Leaks transport | In runtime layer, this should be transport-agnostic. Consider type alias. |
| `Capability` type | Security | Permission (ACL) / Right (capability) | Defensible | Matches POSIX and OAuth conventions. Keep. |
| `AclState` / `AclEntry` | Security | -- | Correct | Keep |
| `Identity` | Security | Principal / Subject | Slightly unusual | "Identity" works but "principal" is more precise in security contexts. Low priority. |
| `enforce()` | Security | authorize() / check() | Good | Keep -- "enforce" is clear and authoritative. |
| `ConsentRequest` | Security / UX | Authorization Prompt | Good | Keep -- "consent" is user-facing and accurate. |
| `BusKind.INTER_PANE` | Message types | IPC / PeerEvent | Deviates | Planned rename to `IPC_PEER` is an improvement. |
| `BusKind.SIGNER_REQUEST/RESPONSE` | Message types | -- | Correct | Standard request/response naming. |
| `nappStorage` / `nappState` | Storage proxy | State Proxy | Mixed | `nappState` is good (domain concept). `nappStorage` alias should be deprecated. |
| `handleStateRequest()` | Storage proxy | -- | Correct | Standard handler naming. |
| `ServiceDescriptor` | Service discovery | -- | Correct | Follows MCP and Kubernetes naming. |
| `ServiceHandler` | Service discovery | -- | Correct | Standard handler pattern. |
| `ServiceRegistry` | Service discovery | -- | Correct | Standard registry pattern. |
| `SendToNapplet` | Transport | MessageSink / Send callback | Good | Clear verb-oriented naming. |

### Tier 1: Rename Recommended (Semantically Incorrect or Misleading)

1. **`NappKeypair` -> `SessionKeypair`**: The keypair exists solely for session authentication. Naming it for the napp rather than its purpose obscures its role. Every protocol that uses ephemeral keys names them for their function: TLS "session keys," WebRTC "DTLS certificate."

2. **`NappKeyEntry` -> `SessionEntry`**: This is a session record, not a key record. It contains session metadata (windowId, dTag, aggregateHash, registeredAt). Renaming to `SessionEntry` or `SessionRecord` aligns with what it actually stores.

3. **`NappKeyRegistry` -> `SessionRegistry`**: Follows from the above. The registry maps sessions, not keys.

4. **`INTER_PANE` -> `IPC_PEER`**: Already planned. The current name describes physical topology; the new name describes semantic role.

5. **`nappStorage` alias -> deprecate**: If `nappState` is the correct name (which it is), the old alias creates confusion. Deprecate with runtime warning, remove in next major.

### Tier 2: Consider Renaming (Architecturally Imprecise but Functional)

6. **`windowId` in runtime layer**: At minimum, add a type alias `type PeerId = string` in runtime types, with JSDoc. Rename parameter names in runtime-internal code from `windowId` to `peerId`. The shell adapter maps between them.

7. **`RuntimeAuthHooks`**: Groups identity (`getUserPubkey`) and signing (`getSigner`). Could split into `RuntimeIdentityHooks` + `RuntimeSignerHooks`, or rename to `RuntimeSignerHooks` with identity as part of the signer interface.

8. **`ShellBridge`**: Now that runtime does the protocol processing, ShellBridge is a browser adapter. But "ShellBridge" is in SPEC.md and established. If the name stays, ensure documentation clarifies its role as adapter, not engine.

### Tier 3: Keep (Defensible Despite Non-Standard)

9. **`Capability` type**: Follows POSIX and OAuth conventions. Changing to "Permission" would be more academically correct but less recognizable in the JS/Nostr ecosystem.

10. **`RuntimeHooks`**: "Hooks" is universally understood in JS as "injection points." Changing to "Ports" would be more architecturally correct but less ergonomic.

11. **`@napplet/shim`**: "Shim" accurately describes what it does -- it shims postMessage into a relay-like API. Alternative names (client, sdk) would be less descriptive.

12. **`Identity`**: Works fine. "Principal" is more precise in security contexts but less approachable.

13. **`enforce()`**: Clear and authoritative. Better than the more ambiguous "authorize" for a mandatory check.

### Where Napplet Is Ahead of Convention

- **`resource:action` capability format**: The `relay:read`, `sign:event`, `state:write` format is well-designed, following OAuth/Kubernetes conventions. It is self-documenting and extensible.
- **`ConsentRequest` pattern**: Unifying destructive signing consent and undeclared service consent into one handler is elegant. Most systems have separate authorization flows for each.
- **`BusKind` constants**: Using NIP-01 ephemeral event kinds (29000-29999) for bus traffic is clever -- they naturally won't persist on real relays.
- **SPEC.md terminology table**: Defining terms upfront (Shell, Napplet, ShellBridge, Composite Key) is good practice that many protocol specs skip.

---

## Sources

### Protocol Specifications (PRIMARY)
- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification)
- [LSP Specification 3.17](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/)
- [MCP Architecture](https://modelcontextprotocol.io/docs/learn/architecture)
- [OAuth 2.0 (RFC 6749)](https://datatracker.ietf.org/doc/html/rfc6749)
- [OIDC Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [W3C WebAuthn Level 3](https://www.w3.org/TR/webauthn-3/)
- [NIP-07](https://github.com/nostr-protocol/nips/blob/master/07.md)
- [NIP-46](https://github.com/nostr-protocol/nips/blob/master/46.md)

### Architecture Patterns (PRIMARY)
- [Hexagonal Architecture - Alistair Cockburn](https://alistair.cockburn.us/hexagonal-architecture)
- [OSI Model (Wikipedia)](https://en.wikipedia.org/wiki/OSI_model)
- [Capability-based security (Wikipedia)](https://en.wikipedia.org/wiki/Capability-based_security)
- [Cornell CS 513 Capability-based Access Control](https://www.cs.cornell.edu/courses/cs513/2005fa/L08.html)
- [WASI Design Principles](https://github.com/WebAssembly/WASI/blob/main/docs/DesignPrinciples.md)

### Ecosystem Implementations (SECONDARY)
- [Ethers.js v5 Signer](https://docs.ethers.org/v5/api/signer/)
- [Viem Ethers Migration](https://viem.sh/docs/ethers-migration)
- [Comlink (Google Chrome Labs)](https://github.com/GoogleChromeLabs/comlink)
- [Microsoft window-post-message-proxy](https://github.com/microsoft/window-post-message-proxy)
- [Deno Security](https://docs.deno.com/runtime/fundamentals/security/)
- [Android Binder IPC](https://source.android.com/docs/core/architecture/ipc/binder-overview)
- [Chrome Extension Messaging](https://developer.chrome.com/docs/extensions/develop/concepts/messaging)
- [WebRTC API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
