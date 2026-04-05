# Architecture Research: NIP-5C Specification Structure and Capability Negotiation

**Domain:** Protocol specification design -- NIP structure, capability negotiation, normative vs informative separation
**Researched:** 2026-04-05
**Confidence:** HIGH (based on analysis of 6 real-world protocol specs + existing codebase + NIP conventions)

## The Core Question

How should NIP-5C be structured to cleanly separate the napplet-to-shell protocol standard from runtime implementation details? And how should optional capability negotiation work?

## Prior Art: How Other Specs Handle This

### 1. Existing Nostr NIPs

NIPs are terse. The typical NIP is 500-2000 words. Even complex ones like NIP-46 (Nostr Connect) fit in roughly 2000 words with clear sections: Rationale, Terminology, Overview, wire format, examples, appendix.

**Key NIP conventions observed:**

| Convention | Source | Implication for NIP-5C |
|-----------|--------|------------------------|
| `draft` `optional` status tags | Every NIP | NIP-5C uses these |
| Imperative language, not RFC 2119 | NIP-07 ("must define") | NIPs use MUST/SHOULD/MAY but informally -- NIP-42 uses them 11 times total |
| Short, self-contained | NIP-42 (~1200 words) | NIP-5C needs to be dramatically shorter than the 1520-line SPEC.md |
| Reference other NIPs by number only | NIP-5A, NIP-46 | "as defined in NIP-01" -- never reproduce their content |
| One JSON example per concept | NIP-42, NIP-46 | Minimal examples, not exhaustive |
| No implementation guidance sections | All NIPs | "Implementation Notes" is not a NIP section -- it's SDK documentation |

**NIP-11 (Relay Information Document)** is the closest Nostr precedent for capability advertisement. It defines a JSON document with `supported_nips` array and optional `limitation` objects. All fields are optional. Clients MUST ignore unknown fields. This is Nostr's pattern: advertise capabilities as a flat list, let consumers feature-detect.

**NIP-91 (Extension Negotiation, PR #1671)** proposed a `PN-OFFER`/`PN-REQUEST`/`PN-OK` flow for relay-client capability negotiation. Community pushback centered on "too structured/interactive for nostr" (Staab). The PR was contentious precisely because it added a negotiation round-trip. Lesson: Nostr community prefers declarative advertisement over interactive negotiation.

### 2. Language Server Protocol (LSP)

LSP uses **bidirectional capability exchange during initialization**:

1. Client sends `initialize` with `ClientCapabilities` object
2. Server responds with `ServerCapabilities` object
3. Client sends `initialized` notification
4. Both sides only use negotiated capabilities

Capabilities are nested objects. Missing property = feature absent. The client checks `server.capabilities.completionProvider` before requesting completions.

**Key insight:** LSP separates a small mandatory baseline (text document sync) from a large optional surface. Version 2.x features are mandatory; version 3.x features are truly optional. This layered approach prevents "must implement everything" while guaranteeing interoperability on the core.

### 3. Model Context Protocol (MCP)

MCP follows LSP's pattern closely:

1. Client sends `initialize` with `capabilities: { roots, sampling, elicitation, ... }`
2. Server responds with `capabilities: { prompts, resources, tools, logging, ... }`
3. Client sends `initialized` notification

Capabilities are **empty objects** (`{}`) when present, possibly with sub-capabilities like `{ listChanged: true }`. The key insight: presence of the key means support; absence means no support. No version negotiation per-capability -- just present/absent.

**Design principle from MCP:** "All implementations MUST support the base protocol and lifecycle management. Other components MAY be implemented based on the specific needs of the application."

### 4. WebExtensions (Browser Extensions)

WebExtensions uses a **manifest-declared** model:

- `permissions`: Required at install time -- extension won't work without these
- `optional_permissions`: Requested at runtime when needed
- `host_permissions`: URL pattern access

This is the closest analogy to the napplet model:
- The NIP-5A manifest `requires` tags = `permissions`
- Services discovered at runtime = `optional_permissions`
- The shell's service registry = the browser's permission system

### 5. W3C Permissions API

The web platform uses **feature detection + runtime query**:

```js
if (navigator.permissions) {
  const result = await navigator.permissions.query({ name: 'camera' });
  if (result.state === 'granted') { /* use camera */ }
}
```

Pattern: check if API exists, then query specific permission state. Graceful degradation is the norm.

### 6. WebRTC SDP Offer/Answer

WebRTC uses **offer/answer negotiation**: one side proposes capabilities (codecs, transport), the other accepts or counters. This is heavyweight and designed for media negotiation -- overkill for napplet-shell communication where the shell is authoritative (not a peer).

## Synthesis: The Right Pattern for NIP-5C

The napplet-shell relationship is **asymmetric**: the shell is authoritative, the napplet is sandboxed. This rules out peer negotiation (WebRTC SDP, NIP-91 PN-OFFER). The shell declares what it supports; the napplet adapts.

The right pattern combines:

1. **NIP-11 style capability advertisement** -- shell declares available features
2. **WebExtensions-style manifest declaration** -- napplet declares what it needs
3. **W3C-style feature detection** -- napplet probes at runtime and degrades gracefully
4. **LSP/MCP-style layered requirements** -- small mandatory core, large optional surface

### Recommended Capability Negotiation Model

```
Phase 1: Shell advertises (passive, no round-trip)
  Shell has a set of capabilities. Napplet discovers them post-AUTH.

Phase 2: Napplet declares requirements (manifest, build-time)
  NIP-5A manifest contains ["requires", "service-name"] tags.
  Shell checks requirements during AUTH. Mismatch = warning or rejection.

Phase 3: Napplet probes at runtime (active, per-feature)
  window.napplet.services.has('audio') → true/false
  Napplet adapts UI based on available capabilities.
```

No interactive negotiation round-trip. The shell's AUTH OK response implicitly confirms the environment. The napplet uses feature detection.

## Recommended NIP-5C Document Structure

### Structure Rationale

The current SPEC.md is 1520 lines (~41KB). A NIP should be 2000-4000 words maximum. The SPEC.md contains:

| Content | Lines | Belongs in NIP? |
|---------|-------|-----------------|
| Transport layer (postMessage, sandbox) | ~100 | YES -- normative |
| AUTH handshake (REGISTER/IDENTITY/AUTH) | ~200 | YES -- normative |
| NIP-01 message routing (REQ/EVENT/CLOSE) | ~150 | YES -- normative, but mostly "follows NIP-01" |
| Signer proxy (kinds 29001/29002) | ~80 | NO -- optional service, reference spec |
| Storage proxy | ~100 | NO -- optional service, reference spec |
| Audio management | ~60 | NO -- optional service, reference spec |
| Relay management | ~50 | NO -- optional service, reference spec |
| Window creation, shell commands | ~100 | NO -- implementation-specific |
| Cache proxy (NIPDB) | ~30 | NO -- optional service, reference spec |
| Hotkey forwarding | ~30 | NO -- optional service, reference spec |
| Service discovery | ~100 | YES -- normative (the mechanism) |
| Protocol layers | ~30 | YES -- informative overview |
| ACL capabilities | ~120 | PARTIAL -- capability strings normative, enforcement strategy informative |
| Security model | ~80 | YES -- normative |
| Kind numbers | ~60 | YES -- normative |
| Minimal implementation | ~80 | YES -- informative examples |
| Implementation notes | ~30 | NO -- SDK documentation |

### Proposed NIP-5C Sections

```
NIP-5C
======

Nostr Web Applets
-----------------

`draft` `optional`

This NIP defines a protocol for sandboxed web applications ("napplets") running in
iframes to communicate with a hosting application ("shell") via postMessage, using
the NIP-01 wire format. Extends NIP-5A.

## Terminology
  - Shell, Napplet, dTag, aggregate hash, composite key, delegated key
  - (~100 words, table format)

## 1. Transport
  - postMessage delivery mechanism
  - Sandbox policy (allow-scripts, NO allow-same-origin)
  - Sender identification via MessageEvent.source
  - Message format: NIP-01 JSON arrays
  - (~200 words)

## 2. Wire Format
  - Table: napplet-to-shell verbs (REGISTER, EVENT, REQ, CLOSE, AUTH, COUNT)
  - Table: shell-to-napplet verbs (IDENTITY, EVENT, OK, EOSE, CLOSED, AUTH, NOTICE, COUNT)
  - One example per direction
  - (~300 words)

## 3. Authentication
  - REGISTER → IDENTITY → AUTH flow
  - Key derivation: HMAC-SHA256(shellSecret, dTag + aggregateHash)
  - AUTH event structure (kind 22242)
  - Verification requirements
  - Post-AUTH hybrid model (Window reference identity)
  - Pre-AUTH message queueing
  - (~500 words -- this is the core of the protocol)

## 4. Relay Proxy
  - Shell acts as NIP-01 relay: REQ/EVENT/CLOSE/EOSE/OK/COUNT
  - Filter matching per NIP-01
  - Replay protection
  - Event delivery rules
  - (~300 words)

## 5. Capabilities
  - 5.1 MUST capabilities (transport, wire format, AUTH)
  - 5.2 MAY capabilities (discoverable, optional)
  - 5.3 Capability advertisement (service discovery mechanism)
  - 5.4 Napplet requirement declaration (NIP-5A requires tags)
  - 5.5 Feature detection pattern (window.napplet.services.has)
  - 5.6 Graceful degradation (MUST adapt or announce incompatibility)
  - (~400 words)

## 6. Standard Capabilities

  ### 6.1 NIP-07 Signer Proxy (window.nostr)
  - Shell MAY provide window.nostr via postMessage proxy
  - Methods: getPublicKey, signEvent, nip04.*, nip44.*
  - Destructive kind safety floor
  - (~200 words)

  ### 6.2 Napplet State Storage (window.napplet.storage)
  - Shell MAY provide scoped key-value storage
  - Scoping: dTag:aggregateHash:key
  - Quota enforcement
  - (~150 words)

  ### 6.3 IPC Pub/Sub (window.napplet.ipc)
  - Shell MAY provide inter-napplet messaging
  - Kind 29003 topic-based routing
  - Sender exclusion on IPC messages
  - (~100 words)

  ### 6.4 Channels (window.napplet.channels) [NEW]
  - Shell MAY provide authenticated point-to-point connections
  - Channel lifecycle: open → AUTH → data → close
  - Broadcast as channel operation
  - (~200 words)

  ### 6.5 Event Database (window.nostrdb)
  - Shell MAY provide a local event cache
  - Query interface
  - (~100 words)

## 7. Napplet API Surface
  - Table: MUST interfaces (window.napplet.services)
  - Table: MAY interfaces and their discovery names
  - (~150 words)

## 8. Security Considerations
  - Threat model (napplet untrusted, shell trusted)
  - Iframe sandbox guarantees
  - Delegated key confinement
  - Window reference identity after AUTH
  - (~200 words)

## 9. Event Kinds
  - Table of kinds used by this NIP
  - References to NIP-5A for manifest kinds
  - (~100 words)

## Appendix A: Minimal Napplet Example
  - (~30 lines of JS)

## Appendix B: Minimal Shell Example
  - (~30 lines of JS)
```

**Estimated total: ~2800 words.** Fits NIP conventions.

## Key Structural Decisions

### Decision 1: Section 5 (Capabilities) Is the Innovation

Most of the NIP is "we use NIP-01 over postMessage" which is straightforward. The novel contribution is the capability negotiation model. Section 5 deserves the most careful treatment.

**Recommended MUST/SHOULD/MAY allocation for capabilities:**

| Requirement Level | What It Covers |
|-------------------|----------------|
| MUST | postMessage transport, NIP-01 wire format, AUTH handshake, service discovery mechanism |
| MUST | Napplets MUST discover capabilities before using them |
| MUST | Napplets MUST degrade gracefully when a capability is absent |
| SHOULD | Shells SHOULD provide a relay proxy (most shells will, but a minimal shell could be offline-only) |
| SHOULD | Napplets SHOULD declare requirements via NIP-5A `requires` tags |
| MAY | All standard capabilities in Section 6 (signer, storage, IPC, channels, nostrdb) |
| MAY | Custom/non-standard capabilities following the same discovery pattern |

### Decision 2: NIP-5A Manifest Is the Declaration Mechanism

The `requires` tags in the NIP-5A manifest (kind 35128) are the build-time declaration. NIP-5C should reference this mechanism, not redefine it.

```
NIP-5C references NIP-5A for:
  - Manifest event structure (kind 35128)
  - Aggregate hash computation
  - Build integrity verification
  - requires tags for capability declaration

NIP-5C defines:
  - How the shell reads requires tags during AUTH
  - How the shell advertises capabilities (kind 29010 events)
  - How the napplet discovers capabilities at runtime
  - What happens when requirements are unmet
```

### Decision 3: Runtime Internals Are Explicitly Excluded

The NIP defines the **contract** (what goes over the wire), not the **implementation** (how the shell processes it).

| In the NIP (normative) | Out of the NIP (informative/runtime) |
|-------------------------|--------------------------------------|
| Wire format for all verbs | How the shell stores ACL entries internally |
| AUTH challenge-response flow | SessionRegistry, NappKeyRegistry data structures |
| Capability advertisement mechanism | ServiceHandler/ServiceRegistry implementation |
| Storage scoping key format | How the shell persists storage (localStorage, IndexedDB, etc.) |
| Replay protection requirements | Ring buffer size, eviction strategy |
| Security threat model | RuntimeAdapter/ShellAdapter hook interfaces |
| Ephemeral bus kind numbers | Internal dispatch routing, topic-prefix matching |

### Decision 4: `window.napplet` Namespace Is Normative

The NIP should define the napplet-facing API namespace as a standard:

```
window.napplet.relay      -- NIP-01 relay operations (SHOULD)
window.napplet.ipc        -- Inter-napplet pub/sub (MAY)
window.napplet.channels   -- Point-to-point channels (MAY)
window.napplet.services   -- Service discovery (MUST)
window.napplet.storage    -- Scoped state storage (MAY)
window.nostr              -- NIP-07 signer proxy (MAY)
window.nostrdb            -- Event database (MAY)
```

This is analogous to NIP-07 defining `window.nostr`. The namespace is the standard; implementations provide it.

### Decision 5: Capability Discovery Uses Existing Service Discovery

The kind 29010 service discovery mechanism (already in SPEC.md Section 11) becomes the normative capability advertisement mechanism in NIP-5C. Each optional capability registers as a service.

```json
["REQ", "cap-discovery", {"kinds": [29010]}]

["EVENT", "cap-discovery", {
  "kind": 29010,
  "tags": [["s", "relay"], ["v", "1.0.0"]],
  ...
}]
["EVENT", "cap-discovery", {
  "kind": 29010,
  "tags": [["s", "signer"], ["v", "1.0.0"]],
  ...
}]
["EVENT", "cap-discovery", {
  "kind": 29010,
  "tags": [["s", "storage"], ["v", "1.0.0"]],
  ...
}]
["EOSE", "cap-discovery"]
```

This is the NIP-11 pattern (flat list of supported features) adapted to the postMessage context.

## Component Boundaries

| Component | Responsibility | Defined Where |
|-----------|---------------|---------------|
| NIP-5C | Wire protocol contract, capability model, security requirements | nostr-protocol/nips PR |
| NIP-5A | Manifest format, aggregate hash, `requires` tags | Existing NIP (referenced) |
| NIP-01 | Event format, filter matching, subscription verbs | Existing NIP (referenced) |
| NIP-42 | AUTH event structure (kind 22242) | Existing NIP (referenced) |
| NIP-07 | `window.nostr` interface | Existing NIP (referenced) |
| SPEC.md (renamed) | Runtime implementation reference, internal architecture | napplet repo (not a NIP) |
| @napplet/core | Protocol constants, types, shared code | napplet repo (reference implementation) |
| @napplet/runtime | Protocol engine, message routing, ACL enforcement | napplet repo (reference implementation) |
| @napplet/shell | Browser-specific adapter | napplet repo (reference implementation) |

### Data Flow

```
Build time:
  Napplet dev → vite-plugin → NIP-5A manifest (kind 35128)
                              with requires tags + aggregate hash

Connection time:
  Napplet iframe loads
    ↓
  REGISTER (dTag, claimedHash)
    ↓
  Shell derives keypair, sends IDENTITY
    ↓
  Shell sends AUTH challenge
    ↓
  Napplet signs with delegated key, sends AUTH response
    ↓
  Shell verifies, checks requires vs registry
    ↓
  AUTH OK (or rejection)

Post-AUTH:
  Napplet → REQ kind 29010 → Shell
  Shell → EVENT per registered capability → EOSE → Napplet
  Napplet adapts UI based on discovered capabilities
  Napplet uses capabilities via window.napplet.* / window.nostr / window.nostrdb
```

## Patterns to Follow

### Pattern 1: Layered Requirements (from LSP/MCP)

**What:** Define a small mandatory core and a large optional surface. Every implementation speaks the same base language; extensions are discoverable.

**Why for NIP-5C:** The protocol has exactly one MUST-implement interaction (AUTH handshake over postMessage with NIP-01 format). Everything else -- relay proxy, signer, storage, IPC, channels -- is an optional capability that shells may or may not provide.

**Structure:**
```
Layer 0 (MUST): postMessage transport + NIP-01 wire format
Layer 1 (MUST): AUTH handshake (REGISTER → IDENTITY → AUTH)
Layer 2 (MUST): Service discovery (kind 29010 REQ/EVENT/EOSE)
Layer 3 (MAY):  All standard capabilities (relay, signer, storage, ipc, channels, nostrdb)
```

### Pattern 2: Declarative Advertisement, Not Interactive Negotiation (from NIP-11/NIP-91 lessons)

**What:** The shell declares what it supports; the napplet probes and adapts. No negotiation round-trip.

**Why for NIP-5C:** The Nostr community rejected NIP-91's interactive negotiation as "too structured." The shell is authoritative -- it doesn't negotiate, it announces. The napplet's only choice is to use what's available or display an incompatibility message.

**Example:**
```
// Napplet probes available capabilities after AUTH
const services = await window.napplet.services.list();
const hasRelay = services.some(s => s.name === 'relay');
const hasSigner = services.some(s => s.name === 'signer');

if (!hasRelay) {
  showMessage('This napplet requires relay access. Your shell does not provide it.');
}
```

### Pattern 3: Build-Time Declaration + Runtime Discovery (from WebExtensions)

**What:** The napplet manifest declares what the napplet needs (build-time). The shell checks declarations during AUTH (install-time equivalent). The napplet probes at runtime for anything undeclared.

**Why for NIP-5C:** This separates the "what do you need?" question (answered by the developer at build time) from the "what do you have?" question (answered by the shell at runtime). The manifest `requires` tags are the WebExtensions `permissions` key. Runtime service discovery is the `optional_permissions` query.

### Pattern 4: Terse Normative Text With Reference Implementation Pointer (from NIP conventions)

**What:** The NIP is the wire protocol contract. All implementation guidance, architecture details, and SDK documentation lives in the repo.

**Why for NIP-5C:** The current SPEC.md is 41KB. A NIP should be 5-10KB. Cut everything that describes _how_ the runtime works internally. Keep only what a second implementor needs to build a compatible shell or napplet from scratch.

**Test:** For each SPEC.md section, ask: "Would a second implementor need this to be interoperable?" If no, it's implementation documentation, not protocol specification.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Including ACL Enforcement Details in the NIP

**What goes wrong:** Specifying how ACL is stored (`localStorage` key format), how capabilities are checked (bitfield operations), or how consent prompts work.

**Why it's wrong:** Different shells will have different ACL storage, different consent UIs, different enforcement strategies. The NIP should say "the shell MUST enforce access control for signing operations" not "the shell MUST store ACL entries as `[compositeKey, entry]` tuples in localStorage under `napplet:acl`."

**What to specify instead:** The _observable behavior_ -- "a napplet MUST receive an error response when it attempts an operation for which it lacks the required capability" -- not the implementation mechanism.

**Exception:** The ACL persistence format is currently LOCKED in SPEC.md Section 13.8. This is over-specified for a NIP. Two different shell implementations should NOT need to share ACL storage. Move this to the runtime reference.

### Anti-Pattern 2: Defining Implementation-Specific Hooks

**What goes wrong:** Including `ShellAdapter`, `RuntimeAdapter`, `RelayPoolHooks`, `AuthHooks` etc. in the NIP.

**Why it's wrong:** These are dependency injection interfaces for the @napplet/runtime package. They are an implementation choice, not a protocol requirement. A shell written in Rust, Go, or Python wouldn't use these TypeScript interfaces.

### Anti-Pattern 3: Over-Specifying Ephemeral Kind Numbers

**What goes wrong:** Declaring specific kind numbers (29001, 29002, 29003, etc.) as THE kind numbers that all implementations must use.

**Why SPEC.md already acknowledges this:** Section 3.8 says "These kind numbers are implementation-specific. Other shell implementations MAY use different ephemeral kind ranges."

**What to do instead:** Define the _protocol patterns_ (request-response with correlation IDs, topic-prefixed routing) and note the reference implementation's kind numbers as one valid assignment. Or define them normatively if interoperability between different shell implementations and shared napplets matters (which it does -- a napplet built for one shell should work on another).

**Recommendation:** Define the kind numbers normatively. A napplet that sends kind 29001 for signer requests needs to work on any conforming shell. This is the whole point of standardization.

### Anti-Pattern 4: Reproducing NIP-01 or NIP-42 Content

**What goes wrong:** Re-explaining how NIP-01 filters work, how subscriptions work, or how NIP-42 AUTH events are structured.

**Why it's wrong:** NIP conventions say "reference, don't reproduce." A reader implementing NIP-5C is expected to have read NIP-01.

**What to specify instead:** Only the NIP-5C-specific additions to NIP-01/NIP-42 behavior. For example: "The shell acts as a NIP-01 relay over postMessage. AUTH uses kind 22242 per NIP-42 with the following additional tags: [type], [version], [aggregateHash]."

## Scalability Considerations

| Concern | Single napplet | 10 napplets | 100 napplets |
|---------|---------------|-------------|--------------|
| Service discovery | One REQ, N EVENTs, EOSE | Same per napplet, cached | Same, cached |
| AUTH handshake | ~4 messages | ~40 messages | ~400 messages |
| Pre-AUTH queueing | 50 msg cap | 50 per napplet | 50 per napplet |
| Window reference tracking | 1 Map entry | 10 Map entries | 100 Map entries |
| Kind 29010 events | N services * 1 napplet | N * 10 | N * 100 -- still small |

The capability model scales linearly. No combinatorial explosion. The service discovery response is the same regardless of how many capabilities exist -- just more EVENT messages before EOSE.

## What the NIP Should NOT Contain (Move to Runtime Reference)

1. **ACL persistence format** (Section 13.8) -- implementation detail
2. **Ring buffer sizing and eviction** -- implementation detail
3. **Topic-prefix routing internals** -- implementation detail (the topics themselves are normative)
4. **Hook/adapter interfaces** -- TypeScript-specific DI pattern
5. **Storage migration logic** (legacy format fallback) -- version-specific implementation
6. **Audio management details** -- service-specific, not core protocol
7. **Relay management details** -- service-specific
8. **Window creation details** -- shell-specific UX
9. **Keybinds protocol** -- application-specific
10. **DM send protocol** -- application-specific

## What the NIP MUST Contain

1. **Transport definition** -- postMessage, sandbox policy, sender identification
2. **Wire format** -- verb tables, message structure
3. **AUTH handshake** -- REGISTER/IDENTITY/AUTH flow, key derivation, verification
4. **Relay proxy contract** -- "shell acts as NIP-01 relay" with additions
5. **Capability model** -- MUST/MAY split, discovery mechanism, requirement declaration
6. **Standard capability definitions** -- each MAY capability's wire format
7. **Napplet API namespace** -- `window.napplet.*` standard
8. **Security model** -- threat model, guarantees, non-guarantees
9. **Event kinds** -- normative kind number assignments
10. **Minimal examples** -- napplet and shell

## Sources

### Protocol Specifications Analyzed

- [NIP-01: Basic Protocol Flow](https://github.com/nostr-protocol/nips/blob/master/01.md) -- NIP format conventions, event kinds, filter matching
- [NIP-07: window.nostr Capability](https://github.com/nostr-protocol/nips/blob/master/07.md) -- NIP defining a browser-side interface
- [NIP-11: Relay Information Document](https://github.com/nostr-protocol/nips/blob/master/11.md) -- Capability advertisement pattern (supported_nips array)
- [NIP-42: Authentication](https://github.com/nostr-protocol/nips/blob/master/42.md) -- MUST/SHOULD/MAY usage in NIPs (~1200 words)
- [NIP-46: Nostr Connect](https://github.com/nostr-protocol/nips/blob/master/46.md) -- Complex NIP structure with required/optional methods
- [NIP-5A: Nostr Sites](https://github.com/nostr-protocol/nips/blob/master/5A.md) -- Manifest format, referenced by NIP-5C
- [NIP-91 PR #1671: Extension Negotiation](https://github.com/nostr-protocol/nips/pull/1671) -- Community rejection of interactive negotiation

### Web Standards Analyzed

- [RFC 2119: Key Words for Requirement Levels](https://datatracker.ietf.org/doc/html/rfc2119) -- MUST/SHOULD/MAY semantics
- [W3C Permissions API](https://www.w3.org/TR/permissions/) -- Runtime capability query pattern
- [WebExtensions manifest.json permissions](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/permissions) -- Build-time declaration + runtime request pattern
- [Language Server Protocol 3.17](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/) -- Bidirectional capability exchange during initialization
- [Model Context Protocol 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25) -- Capability objects with presence/absence semantics, layered requirements

### Implementation References

- IMAP ENABLE Extension (RFC 5161) -- Client declares which extensions to activate
- WebRTC SDP Offer/Answer -- Heavyweight peer negotiation (anti-pattern for asymmetric relationships)

---
*Architecture research for: v0.12.0 NIP-5C Specification Structure*
*Researched: 2026-04-05*
