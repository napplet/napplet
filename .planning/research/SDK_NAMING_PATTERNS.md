# SDK Naming Pattern Research

**Domain:** Naming conventions for iframe bridge / postMessage / protocol SDK libraries
**Researched:** 2026-04-01
**Overall confidence:** HIGH (first-party API references, multiple sources cross-verified)

---

## 1. Iframe Bridge SDK Patterns

### Penpal (v6+, ~500K weekly downloads)

**Vocabulary:** parent / child
**Factory functions:** `connectToChild(options)`, `connectToParent(options)`
**Connection object:** Returns `{ promise: Promise<Methods>, destroy: Function }`
**Options naming:** `{ iframe, methods, childOrigin, timeout, debug }` / `{ parentOrigin, methods, timeout, debug }`
**Type names:** `Connection`, `Methods`, `AsyncMethodReturns`, `CallSender`, `PenpalError`, `ErrorCode`
**Messenger types (v7):** `WindowMessenger`, `WorkerMessenger`, `PortMessenger` -- generic `connect(options)` with messenger injection

Key pattern: The factory function name encodes the caller's role -- `connectToChild` is called BY the parent, `connectToParent` is called BY the child. The returned object is a "connection" with a promise-based handshake.

Source: [Penpal GitHub](https://github.com/Aaronius/penpal)

### Comlink (Google Chrome Labs, ~1.5M weekly downloads)

**Vocabulary:** expose / wrap (no explicit host/client terminology)
**Factory functions:** `expose(value, endpoint)`, `wrap<T>(endpoint): Remote<T>`
**Type names:** `Remote<T>`, `Endpoint`, `ProxyMarked`, `LocalObject`
**Symbols:** `Comlink.createEndpoint`, `Comlink.releaseProxy`, `Comlink.finalizer`
**Helper:** `windowEndpoint(window, context?, targetOrigin?)` -- adapts Window to Endpoint interface

Key pattern: Comlink avoids role-specific naming entirely. `expose` puts something on a channel; `wrap` gives you a proxy to something exposed. The abstraction is symmetric -- both sides can expose and wrap. The bridge concept is replaced by "endpoint" (any postMessage-compatible interface).

Source: [Comlink GitHub](https://github.com/GoogleChromeLabs/comlink)

### Postmate (~200K weekly downloads, archived)

**Vocabulary:** parent / child / model / handshake
**Factory functions:** `new Postmate(options)` (parent-side), `new Postmate.Model(model)` (child-side)
**Connection methods:** `child.get(key)`, `child.call(key, data)`, `child.on(event, cb)`, `child.emit(event, data)`, `child.destroy()`
**Options naming:** `{ container, url, classListArray, model, name }`

Key pattern: The "model" concept is central -- the child exposes a model (an object with getters/functions), and the parent calls into it. Uses standard event emitter vocabulary (on/emit) for message passing alongside the RPC-style get/call.

Source: [Postmate GitHub](https://github.com/dollarshaveclub/postmate)

### Zoid (PayPal/Kraken, cross-domain components)

**Vocabulary:** parent / child / component / xprops
**Factory function:** `zoid.create({ tag, url, dimensions, props, ... })` -- returns a Component
**Render methods:** `Component.render(props, container)`, `Component.renderTo(win, props, container)`, `Component.init(props, context, container)`
**Data passing:** `window.xprops` -- child reads props set by parent
**Config options:** `tag`, `url`, `dimensions`, `props`, `containerTemplate`, `prerenderTemplate`, `allowedParentDomains`, `autoResize`, `exports`

Key pattern: Zoid treats iframes as "components" with a React-like data-down/actions-up model. The factory is `create()`, not `connect()`. Props flow parent-to-child; exports flow child-to-parent. The `xprops` global is the child's access point.

Source: [Zoid GitHub](https://github.com/krakenjs/zoid)

### Consensus and Fragmentation

| Aspect | Strong consensus | Notes |
|--------|-----------------|-------|
| Parent/child terminology | YES | Penpal, Postmate, Zoid, iframe-resizer all use parent/child |
| `connect*` factory naming | MODERATE | Penpal uses connectToChild/connectToParent; Comlink avoids it; Postmate uses constructor |
| `create*` factory naming | MODERATE | Zoid uses create(); Comlink avoids it |
| Connection as return type | YES | Penpal, Postmate both return a connection/child object |
| Methods/model exposed by child | YES | Penpal (methods), Postmate (model), Comlink (expose) |
| Promise-based handshake | YES | Universal across all libraries |
| "Endpoint" for transport | MODERATE | Comlink only, but influential pattern |

**Strong consensus:** parent/child for iframe relationships, promise-based connections, "methods" or "model" for exposed APIs.
**Fragmented:** Whether the factory is `connect*`, `create*`, or a constructor; whether the abstraction is symmetric (Comlink) or role-specific (Penpal).


---

## 2. Pubsub / Event SDK Naming (emit/broadcast/channel)

### Socket.IO (v4, dominant realtime framework)

**Emit taxonomy:**
| Pattern | Who receives | API |
|---------|-------------|-----|
| `socket.emit(event, data)` | Only the connected client | Direct send |
| `io.emit(event, data)` | ALL connected clients | Global broadcast |
| `socket.broadcast.emit(event, data)` | All EXCEPT sender | Broadcast minus self |
| `io.to("room").emit(event, data)` | All in named room | Targeted broadcast |
| `io.except("room").emit(event, data)` | All EXCEPT room members | Exclusion broadcast |
| `io.of("/namespace").emit(event, data)` | All in namespace | Namespace broadcast |

**Subscription:** `socket.on(event, callback)` -- standard EventEmitter pattern
**Acknowledgements:** `socket.emitWithAck(event, data)` -- returns Promise
**Modifiers chain:** `socket.timeout(5000).to("room1").to("room2").except("room3").emit("hello")`

Key pattern: `emit` is the universal verb. Targeting is done via chained modifiers (`to`, `except`, `of`), not by changing the verb. Rooms and namespaces are named groupings. Subscribe is always `on`.

Source: [Socket.IO Emit Cheatsheet](https://socket.io/docs/v4/emit-cheatsheet/)

### Minimal Event Emitters (mitt, nanoevents, EventEmitter3)

| Library | Subscribe | Unsubscribe | Fire | Wildcard |
|---------|-----------|-------------|------|----------|
| mitt | `on(type, handler)` | `off(type, handler)` | `emit(type, data)` | `on('*', handler)` |
| nanoevents | `on(event, cb)` returns unbind fn | call returned fn | `emit(event, data)` | No |
| EventEmitter3 | `on(event, fn)` | `off(event, fn)` / `removeListener` | `emit(event, ...args)` | No |
| Node EventEmitter | `on(event, fn)` / `addListener` | `off` / `removeListener` | `emit(event, ...args)` | No |

**Universal consensus:** `on` + `emit` is the standard pair. `off` for removal. Nanoevents returns an unbind function instead of requiring `off`, which is the more modern pattern.

Source: [npm-compare](https://npm-compare.com/eventemitter3,mitt,nanoevents)

### Ably (enterprise realtime)

**Channel operations:** `channel.subscribe(event?, callback)`, `channel.publish(name, data)`, `channel.unsubscribe()`
**Presence:** `channel.presence.subscribe()`, `channel.presence.enter()`, `channel.presence.leave()`, `channel.presence.update()`
**Channel access:** `ably.channels.get("channel-name")`
**Namespace convention:** Colon-delimited: `presence:channel-name`, `private:channel-name`

Source: [Ably Docs](https://ably.com/docs/channels)

### Pusher (enterprise realtime)

**Channel operations:** `pusher.subscribe("channel-name")`, `pusher.unsubscribe("channel-name")`
**Event handling:** `channel.bind("event-name", callback)`, `channel.trigger("client-event-name", data)`

Key distinction: Pusher uses `bind/trigger` instead of `on/emit`, but the pattern is the same. `subscribe/unsubscribe` is for channels (rooms), `bind/trigger` is for events within a channel.

Source: [Pusher Docs](https://pusher.com/docs/channels/getting_started/javascript/)

### Consensus and Fragmentation

| Aspect | Strong consensus | Notes |
|--------|-----------------|-------|
| `emit` for firing events | YES | Socket.IO, mitt, nanoevents, EventEmitter3, Postmate |
| `on` for subscribing | YES | All except Pusher (which uses `bind`) |
| `subscribe` for channels/rooms | YES | Ably, Pusher, Socket.IO (`.join()`) |
| `publish` for sending to channel | MODERATE | Ably uses `publish`; Socket.IO uses `emit` for everything |
| `broadcast` as modifier | LOW | Only Socket.IO uses `socket.broadcast.emit()` |
| Colon-delimited namespaces | YES | Ably, many conventions use `:` as separator |

**Strong consensus:** `emit` + `on` for point-to-point events. `subscribe`/`publish` for channel-based pubsub. Colon-delimited topic namespaces.
**Napplet relevance:** The current napplet SDK uses `emit` + `on` for IPC, which aligns perfectly. Topic prefixes use `:` (e.g., `audio:play`, `shell:storage-get`), which matches Ably convention.


---

## 3. Dependency Injection Interface Naming

### Naming Survey Across SDKs

| SDK / Framework | DI Interface Name | Pattern | What It Provides |
|----------------|-------------------|---------|-----------------|
| **Napplet (current)** | `RuntimeHooks`, `ShellHooks` | Hooks | Integration point for host to provide capabilities |
| **React** | `Provider`, `useContext` | Provider | Dependency injection via context tree |
| **Auth.js / NextAuth** | `Adapter` (database), `Provider` (auth) | Adapter + Provider | Database adapter implements storage contract; Provider describes auth source |
| **Prisma** | `DriverAdapter` (`SqlDriverAdapterFactory`) | Adapter | Pluggable database driver implementation |
| **tRPC** | `Adapter` (server), `Link` (client) | Adapter + Link | Server adapter maps to host (Express, Fastify); client link manages transport |
| **Capacitor** | `Plugin` (interface), `registerPlugin()` | Plugin | Native bridge implements TypeScript interface contract |
| **Electron** | `ipcMain.handle()`, `ipcRenderer.invoke()` | Handler | Main process registers handlers; renderer invokes them |
| **VSCode** | `ExtensionContext` | Context | Host provides capabilities via context object |
| **Shopify App Bridge** | `Host` (Shopify), `App` (embedded) | Host + App | Host dispatches actions to render UI elements |
| **MCP** | `McpServer`, `Client`, `Transport` | Server + Client + Transport | Transport is the pluggable layer; server/client are roles |
| **Cloudflare workerd** | `Binding` | Binding | Capability as API-and-permission-in-one |

### Pattern Categories

**"Hooks" pattern** -- Callback-based. The integrator provides an object of functions. Used when the SDK needs many fine-grained capabilities from the host.
- React hooks (`useState`, `useEffect`) -- per-feature hooks
- Napplet `RuntimeHooks` -- composite hooks object
- Strengths: Familiar to React developers, clearly signals "you provide the implementation"
- Risk: "Hooks" has strong React connotations that may confuse non-React developers

**"Adapter" pattern** -- Interface-based. The integrator implements a defined contract. Used when there is one clear abstraction boundary.
- Prisma `DriverAdapter` -- database driver abstraction
- Auth.js `Adapter` -- database/storage abstraction
- tRPC `Adapter` -- HTTP server framework abstraction
- Strengths: Clear enterprise DI semantics, well-understood in backend/ORM world
- Risk: Implies a thicker abstraction layer than simple callbacks

**"Provider" pattern** -- Component/service-based. Wraps capabilities for downstream consumption.
- React `Provider` -- makes context available to children
- Auth.js `Provider` -- describes an auth source (GitHub, Google, etc.)
- Strengths: Familiar to frontend developers, implies something that "provides" to others
- Risk: Heavily associated with React component tree

**"Bridge" pattern** -- Mediator-based. Stands between two systems and translates.
- Shopify App Bridge -- mediates between app and host
- Capacitor -- bridges web and native
- Napplet `ShellBridge` -- mediates between shell and napplet
- Strengths: Clear metaphor for cross-boundary communication
- Risk: Can be confused with the Gang of Four Bridge pattern (abstraction/implementation decoupling)

**"Transport" pattern** -- Communication layer abstraction.
- MCP `Transport` -- stdio, HTTP, WebSocket
- Socket.IO transports -- polling, WebSocket
- Strengths: Clear when the pluggable thing is HOW messages travel
- Risk: Too narrow for general DI

### Consensus and Fragmentation

| Name | When to use | Strong consensus? |
|------|------------|-------------------|
| `Adapter` | Pluggable implementation of a defined contract | YES -- Prisma, Auth.js, tRPC all use this consistently |
| `Provider` | Something that supplies a capability to consumers | YES -- but React-heavy connotation |
| `Hooks` | Object of callback functions provided by integrator | MODERATE -- React-specific connotation limits it |
| `Bridge` | Cross-boundary mediator between two systems | MODERATE -- Shopify, Capacitor use it; GoF confusion risk |
| `Transport` | Pluggable communication channel | YES -- but only for comm layers |
| `Binding` | Capability-as-API (permission + interface) | LOW -- Cloudflare-specific |
| `Delegate` | Object that receives forwarded calls | LOW -- more common in Apple/Cocoa ecosystems |

**Napplet relevance:** The current `RuntimeHooks` name follows the "Hooks" pattern, which works but carries React connotation. The composite object pattern (one big interface with sub-interfaces) is exactly what Prisma/Auth.js call an "Adapter" in the broader ecosystem. The `ShellBridge` name correctly uses "Bridge" for its cross-boundary mediator role.


---

## 4. Host/Client Role Vocabulary

### Survey of Dual-Role SDKs

| SDK | "Privileged side" | "Sandboxed/embedded side" | Notes |
|-----|-------------------|--------------------------|-------|
| **Penpal** | parent | child | Standard iframe hierarchy |
| **Comlink** | (no role names) | (no role names) | Symmetric -- both sides expose/wrap |
| **Postmate** | parent | child | Standard iframe hierarchy |
| **Zoid** | parent | child | Props down, exports up |
| **Figma Plugins** | sandbox (main thread) | iframe (UI) | Inverted! Sandbox has MORE access |
| **Shopify App Bridge** | host | app | Host = Shopify Admin, App = embedded |
| **Electron** | main | renderer | Process model terminology |
| **Chrome Extensions** | background / service worker | content script | Execution context terminology |
| **iframe-resizer** | parent / host (interchangeable) | child / content | Mixed terminology |
| **MCP** | server | client | Standard network model |
| **Capacitor** | native | web | Platform terminology |
| **VSCode** | host | extension | Extension model |
| **Napplet (current)** | shell / host | napplet / napp | Custom domain terminology |
| **Web Workers** | main thread | worker | Execution context |

### Pattern Categories

**parent/child** -- Most common for iframe relationships. Unambiguous hierarchy. Used by Penpal, Postmate, Zoid, and is the default mental model for iframes.
- Pro: Universally understood for iframes
- Con: Implies tight coupling; misleading when the "child" is autonomous

**host/app** -- Used when one side provides platform services and the other is an application. Shopify's model.
- Pro: Clearly separates platform from application
- Con: "App" is overloaded

**host/guest** -- Common in virtualization (VM host/guest). Not found in any major iframe SDK.
- Pro: Clear capability asymmetry
- Con: Not established in web SDK space

**host/extension** -- VSCode's model. The host provides APIs; extensions consume them.
- Pro: Clear capability boundary
- Con: "Extension" implies secondary/optional

**main/renderer** -- Electron's model. Based on process architecture.
- Pro: Precise for process model
- Con: Too implementation-specific for a protocol SDK

**server/client** -- MCP, traditional network model.
- Pro: Universally understood
- Con: Misleading when the "server" is in-browser

**shell/napplet** -- Napplet's current model.
- Pro: Domain-specific, unambiguous within the protocol
- Con: Requires learning new vocabulary; "shell" has Unix connotations

### Consensus

**For iframe-based SDKs:** parent/child is the overwhelming default. host/app is used when the relationship is platform/application rather than just containment.

**For protocol SDKs with clear authority asymmetry:** host is the most neutral term for the privileged side. The embedded side varies by domain (app, extension, plugin, napplet).

**Napplet relevance:** "Shell" is a meaningful choice because it's NOT just an iframe container -- it's a NIP-01 relay proxy, signer, ACL enforcer, and service host. "Parent" would understate its role. "Host" would be more conventional but less descriptive. The domain-specific "shell/napplet" pair is defensible if consistently applied. The key question is whether the learning curve is worth the precision.


---

## 5. Capability/Permission Naming

### Survey of Permission Systems

| System | Primary term | Type names | Grant/deny vocabulary | Model |
|--------|-------------|-----------|----------------------|-------|
| **Napplet (current)** | Capability | `Capability` (string union), `CAP_*` bitfields | `grant()`, `revoke()`, `has()`, `isBlocked()` | Capability-based |
| **Web Permissions API** | Permission | `PermissionDescriptor`, `PermissionStatus` | States: `"granted"`, `"denied"`, `"prompt"` | Permission query |
| **Android** | Permission | `PERMISSION_GRANTED`, `PERMISSION_DENIED` | `requestPermissions()`, `checkSelfPermission()` | Permission request |
| **Deno** | Permission | `Deno.permissions.query()`, `Deno.permissions.request()` | States: `"granted"`, `"denied"`, `"prompt"` | Capability-like (no ambient authority) |
| **AWS IAM** | Policy | `Policy`, `Statement`, `Effect`, `Action`, `Resource` | `"Allow"`, `"Deny"` effects | Policy-based ACL |
| **WASI** | Capability | Handles with attached permissions | Pass-by-reference (unforgeable tokens) | Pure capability |
| **Cloudflare workerd** | Capability / Binding | Bindings in wrangler.toml | Declared at deploy time | Capability-based |

### Terminology Distinctions

**"Capability"** -- An unforgeable token that grants access. The holder of the capability IS authorized. No ambient authority check needed. Used by: WASI, Cloudflare, capability-based security literature.
- Pro: Technically precise for systems where possession = authorization
- Con: Academic; confused with "Linux capabilities" (different concept)

**"Permission"** -- An authorization check against a policy/state. The system decides whether to allow. Used by: Web APIs, Android, Deno.
- Pro: Universally understood, intuitive
- Con: Implies runtime prompting; less precise than capability

**"ACL" (Access Control List)** -- A list attached to a resource specifying who can do what. Used by: filesystems, AWS IAM, traditional security.
- Pro: Well-established enterprise terminology
- Con: Resource-centric (the list is on the resource), not holder-centric

**"Policy"** -- A document describing allowed/denied actions on resources. Used by: AWS IAM, Azure RBAC.
- Pro: Rich expressiveness (conditions, resources, effects)
- Con: Heavyweight for simple grant/deny scenarios

**"Grant"** -- The act of giving access. Used as a verb across all systems.
- Pro: Universal
- Con: Only describes one operation, not the system

### Capability String Naming Conventions

| System | Format | Examples |
|--------|--------|---------|
| **Napplet** | `domain:action` | `relay:read`, `sign:event`, `state:write` |
| **AWS IAM** | `service:Action` | `s3:GetObject`, `iam:CreateUser` |
| **Android** | `platform.group.PERMISSION` | `android.permission.CAMERA`, `android.permission.READ_CONTACTS` |
| **OAuth scopes** | `resource:action` or `resource.action` | `repo:write`, `user:email` |
| **MCP** | Tool names | `tools/call`, `resources/read` |

**Strong consensus:** Colon-delimited `domain:action` is the most common format for fine-grained capability strings. Napplet's current format (`relay:read`, `sign:event`) matches this convention exactly.

### Napplet's Hybrid Model

Napplet currently uses a hybrid: it calls them "capabilities" (the type is `Capability`) but stores them in what is architecturally an ACL (keyed on identity, checked by the system, not held by the napplet). This is technically closer to a permission system than a pure capability system.

However, the term "capability" is defensible because:
1. The `@napplet/acl` package uses bitfield constants (`CAP_*`) for efficient checking
2. The protocol's mental model is "the napplet has capabilities" rather than "the resource has an access list"
3. The community (Cloudflare, WASI) uses "capability" for similar grant-check patterns

**Recommendation:** Keep `Capability` as the type name. The hybrid approach is common and understood. The `domain:action` format is industry-standard. The package name `@napplet/acl` is fine -- `acl` is recognized as a package concern even when the internal type is `Capability`.


---

## 6. Recommendations for Napplet SDK

### What Aligns With Ecosystem Conventions (Keep)

| Current Name | Convention Match | Verdict |
|-------------|-----------------|---------|
| `Capability` type | Matches WASI, Cloudflare naming | KEEP |
| `relay:read`, `sign:event` format | Matches AWS IAM, OAuth scopes `domain:action` | KEEP |
| `emit()` + `on()` for IPC | Universal consensus (mitt, Socket.IO, Postmate) | KEEP |
| `subscribe()`, `publish()`, `query()` | Matches Ably, Pusher channel patterns | KEEP |
| `ShellBridge` | Matches Shopify App Bridge, Capacitor Bridge pattern | KEEP |
| `ServiceDescriptor` | Standard microservices term | KEEP |
| `ServiceRegistry` | Standard microservices term | KEEP |
| `ServiceHandler` | Standard request handler pattern | KEEP |
| `ConsentRequest` | Matches Android permission request pattern | KEEP |
| `grant()` / `revoke()` / `has()` | Universal capability vocabulary | KEEP |
| Topic prefix with `:` (e.g., `audio:play`) | Matches Ably namespace convention | KEEP |

### What Departs From Conventions (Evaluate)

| Current Name | Convention Expectation | Risk Level | Recommendation |
|-------------|----------------------|------------|----------------|
| `RuntimeHooks` | `Adapter` or `Provider` (Prisma, Auth.js, tRPC) | MEDIUM | Consider `RuntimeAdapter`. "Hooks" carries strong React connotation and suggests per-feature callbacks, not a composite integration interface. An "adapter" is exactly what this is: the host environment adapts the runtime to its platform. |
| `ShellHooks` | Same issue as RuntimeHooks | MEDIUM | Consider `ShellAdapter` or keep as-is since shell is the thin browser layer. |
| `RuntimeRelayPoolHooks`, `RuntimeCacheHooks`, `RuntimeAuthHooks`, etc. | Sub-interface naming | LOW | If parent becomes `RuntimeAdapter`, these become `RelayPoolAdapter`, `CacheAdapter`, `AuthAdapter`. The `Runtime` prefix is redundant when nested. |
| `shell` / `napplet` vocabulary | `parent` / `child` or `host` / `app` | LOW | Defensible as domain-specific. "Shell" is more descriptive than "host" for this system. Document the choice. |
| `@napplet/acl` package name | `@napplet/capabilities` | LOW | `acl` is more recognizable as a package concern. The type inside being `Capability` is fine -- the package does ACL operations on capabilities. |
| `nappStorage` / `nappState` | `storage` / `state` (simpler) | LOW | The `napp` prefix avoids collision with browser globals (`localStorage`, `sessionStorage`). Standard practice in SDKs with isolated namespaces. |
| `SendToNapplet` type | `Transport` or `MessageSender` | LOW | Current name is descriptive and role-specific. `Transport` would be more generic but less clear about direction. |

### Key Insight: "Hooks" vs "Adapter"

The strongest naming tension in the napplet SDK is `*Hooks` for DI interfaces. In the broader TypeScript ecosystem:

- **"Hooks"** strongly implies React hooks (per-function, per-feature, composable). When developers see `RuntimeHooks`, many will expect `useRuntime()` semantics.
- **"Adapter"** is the established term for "implement this interface to plug your platform into our SDK" (Prisma, Auth.js, tRPC, database drivers).
- **"Provider"** would also work but has React `Context.Provider` connotation.

The napplet `RuntimeHooks` interface is a textbook adapter: it defines a contract that the host environment implements to integrate with the protocol engine. Prisma's `DriverAdapter`, Auth.js's `DatabaseAdapter`, and tRPC's server adapters all follow this exact pattern.

**Concrete suggestion:** `RuntimeHooks` -> `RuntimeAdapter`, with sub-interfaces dropping the `Runtime` prefix when accessed as properties:

```typescript
// Current
interface RuntimeHooks {
  relayPool?: RuntimeRelayPoolHooks;
  auth: RuntimeAuthHooks;
  crypto: RuntimeCryptoHooks;
}

// Proposed
interface RuntimeAdapter {
  relayPool?: RelayPoolAdapter;
  auth: AuthAdapter;
  crypto: CryptoAdapter;
}
```

This aligns with how Prisma uses `@prisma/adapter-pg` (not `@prisma/hooks-pg`).

### What Would Be Unconventional But Is Fine (Domain-Specific)

| Name | Why it's fine |
|------|---------------|
| `shell` / `napplet` | Domain-specific vocabulary is normal for protocol SDKs. Electron has main/renderer, Figma has sandbox/iframe. |
| `ShellBridge` | "Bridge" is used by Shopify App Bridge, Capacitor. Appropriate for a cross-boundary mediator. |
| `nappStorage` | Prefixed to avoid collision. Like Electron's `ipcRenderer` prefix. |
| `@napplet/core` for shared types | Standard monorepo pattern. |

### Summary Table

| Priority | Current | Suggested | Rationale |
|----------|---------|-----------|-----------|
| HIGH | `RuntimeHooks` | `RuntimeAdapter` | Matches Prisma/Auth.js/tRPC convention for platform integration contracts |
| HIGH | `ShellHooks` | `ShellAdapter` | Same rationale; shell adapts browser to runtime |
| MEDIUM | `RuntimeRelayPoolHooks` | `RelayPoolAdapter` | Drop redundant prefix when nested under RuntimeAdapter |
| MEDIUM | `RuntimeAuthHooks` | `AuthAdapter` | Same |
| MEDIUM | `RuntimeCacheHooks` | `CacheAdapter` | Same |
| MEDIUM | `RuntimeCryptoHooks` | `CryptoAdapter` | Same |
| MEDIUM | `RuntimeAclPersistence` | `AclPersistence` or `AclStore` | Drop prefix; "persistence" is clear enough |
| LOW | `SendToNapplet` | Keep or `NappletTransport` | Current name is clear |
| KEEP | `Capability`, `ServiceDescriptor`, `ServiceHandler`, `ServiceRegistry`, `ConsentRequest`, `ShellBridge`, `emit/on/subscribe/publish/query` | No change | Already match ecosystem conventions |

### Sources

- [Penpal GitHub](https://github.com/Aaronius/penpal)
- [Comlink GitHub](https://github.com/GoogleChromeLabs/comlink)
- [Postmate GitHub](https://github.com/dollarshaveclub/postmate)
- [Zoid GitHub](https://github.com/krakenjs/zoid)
- [Socket.IO Emit Cheatsheet](https://socket.io/docs/v4/emit-cheatsheet/)
- [Socket.IO Namespaces](https://socket.io/docs/v4/namespaces/)
- [Ably Channel Docs](https://ably.com/docs/channels)
- [Pusher JavaScript Quick Start](https://pusher.com/docs/channels/getting_started/javascript/)
- [mitt/nanoevents/EventEmitter3 comparison](https://npm-compare.com/eventemitter3,mitt,nanoevents)
- [Figma Plugin Architecture](https://developers.figma.com/docs/plugins/how-plugins-run/)
- [Shopify App Bridge](https://shopify.dev/docs/api/app-bridge)
- [Electron IPC Tutorial](https://www.electronjs.org/docs/latest/tutorial/ipc)
- [Chrome Extension Message Passing](https://developer.chrome.com/docs/extensions/develop/concepts/messaging)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Capacitor Plugin Development](https://capacitorjs.com/docs/plugins)
- [Prisma Driver Adapters](https://deepwiki.com/prisma/prisma/2.6-driver-adapter-system)
- [Auth.js Adapters](https://authjs.dev/guides/configuring-oauth-providers)
- [tRPC Adapters](https://trpc.io/docs/server/adapters)
- [Web Permissions API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API)
- [Android Permissions](https://developer.android.com/training/permissions/requesting)
- [Deno Permissions](https://docs.deno.com/runtime/fundamentals/security/)
- [AWS IAM Policies](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/iam-examples-policies.html)
- [WASI Capability-Based Security](https://hacks.mozilla.org/2019/03/standardizing-wasi-a-webassembly-system-interface/)
- [Cloudflare Workerd Capabilities](https://www.mintlify.com/cloudflare/workerd/concepts/capabilities)
- [Azure SDK TypeScript Guidelines](https://azure.github.io/azure-sdk/typescript_design.html)
