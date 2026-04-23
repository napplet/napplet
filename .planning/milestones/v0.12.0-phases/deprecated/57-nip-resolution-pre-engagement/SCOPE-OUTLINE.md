# NIP-5D Scope Outline: Nostr Web Applets

**Purpose:** Share with stakeholders to distinguish NIP-5D scope from NIP-5A/5B before spec writing.

---

## Short Version (for nostr DMs)

I'm drafting NIP-5D -- a spec for the postMessage wire protocol between sandboxed iframe apps and a host shell.

NIP-5D fills the runtime gap in the NIP-5x family:
- **NIP-5A** = hosting (static web assets via Nostr events + blossom)
- **NIP-5B** = discovery (embeddable app listings)
- **NIP-5D** = runtime communication (what happens after the iframe loads)

The spec covers:
- AUTH handshake (NIP-42 challenge-response with ephemeral keypairs)
- Capability discovery (kind 29010 service advertisement)
- Standard optional capabilities: relay proxy, signer proxy (NIP-07), storage, IPC pub/sub

It imposes no classification on "apps" and does not compete with NIP-5B's app listing. Any iframe that speaks this protocol can participate.

NIP-5D references NIP-5A aggregate hashes (PR#2287) for version identity. Terse (<500 lines), focused only on the observable wire format.

Reference implementation: `@napplet/*` SDK (github.com/sandwichfarm/napplet)

Would appreciate your thoughts on scope and positioning before I start the spec draft.

---

## Long Version (for GitHub comments)

### What is NIP-5D?

NIP-5D defines a postMessage-based wire protocol for communication between sandboxed iframe applications and a host shell. It extends the NIP-5x family:

| Layer | NIP | What it defines |
|-------|-----|-----------------|
| Hosting | NIP-5A | How static web assets are stored and served |
| Discovery | NIP-5B | How embeddable apps are listed and found |
| **Runtime** | **NIP-5D** | **How embedded apps communicate with the host** |

### What NIP-5D covers

**MUST (mandatory for all implementations):**
- postMessage transport with NIP-01 wire format (REQ/EVENT/CLOSE/EOSE/NOTICE/CLOSED)
- AUTH handshake: REGISTER/IDENTITY/AUTH flow using NIP-42 challenge-response with ephemeral session keypairs
- Service/capability discovery via kind 29010

**MAY (optional capabilities, independently implementable):**
- Relay proxy: transparent relay access through the host
- NIP-07 signer proxy: `window.nostr` delegated to host signer
- Scoped storage: isolated key-value store per app version
- IPC pub/sub: inter-app event messaging
- Pipes: point-to-point named communication between embedded apps (planned)

### What NIP-5D does NOT cover

- App listing or discovery (that's NIP-5B)
- File hosting or serving (that's NIP-5A)
- What qualifies something as a "nostr app" -- NIP-5D imposes no classification
- Runtime internals (ACL engines, service registries, session management)

### NIP-5A dependency

NIP-5D references aggregate hashes from NIP-5A (PR#2287) for version-specific identity. The `requires` tag in NIP-5A manifests (kind 35128) declares which capabilities an embedded app needs.

### Implementation

Reference SDK: `@napplet/shim` + `@napplet/shell` (github.com/sandwichfarm/napplet)
Reference shell: hyprgate (github.com/sandwichfarm/hyprgate)

---

*This outline is for pre-engagement only. The full spec draft will follow after stakeholder feedback.*
