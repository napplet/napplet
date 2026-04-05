# Phase 58: Core Protocol NIP - Research

**Phase:** 58 — Core Protocol NIP
**Researched:** 2026-04-05
**Confidence:** HIGH (based on direct analysis of NIP-5A, NIP-42, NIP-07 specs, SPEC.md source material, and existing milestone research)

## Research Question

What do I need to know to PLAN writing a complete NIP-5D draft covering AUTH, relay proxy, capability discovery, standard capabilities, MUST/MAY layering, and security model?

## Key Findings

### 1. NIP Format Conventions (Verified Against NIP-5A, NIP-42, NIP-07)

**Structural pattern:**
- Setext headings: `NIP-5D\n======` then `Title\n------`
- Status badges: `` `draft` `optional` ``
- No YAML frontmatter, no author fields, no date fields
- Subsections use `###` ATX headings
- JSON examples in fenced code blocks with `jsonc` or `json` language
- Tags shown as arrays: `["tag", "value1", "value2"]`
- References as relative links: `[NIP-XX](XX.md)`
- RFC 2119 keywords: NIP-42 uses capitalized MUST/SHOULD/MAY; NIP-07 uses lowercase informally. Use capitalized form for NIP-5D since it is a protocol spec like NIP-42.

**Length targets:**
- NIP-07: ~150 words (minimal interface spec)
- NIP-42: ~800 words (protocol flow + verification)
- NIP-5A: ~2000 words (hosting + resolution + manifest)
- NIP-5D target: ~2500-3000 words / under 500 lines (complex protocol with capabilities)

### 2. Source Material Mapping (SPEC.md -> NIP-5D)

| SPEC.md Section | NIP-5D Section | Treatment |
|----------------|---------------|-----------|
| 1. Transport Layer | Transport | Distill: sandbox policy, postMessage delivery, sender ID |
| 1.4-1.5 Verb tables | Wire Format | Copy verb tables, trim examples to 1 per direction |
| 2. AUTH Handshake | Authentication | Full coverage: REGISTER/IDENTITY/AUTH sequence, key derivation |
| 3. NIP-01 Message Routing | Relay Proxy | Distill: "shell acts as NIP-01 relay" + additions |
| 4. Signer Proxy | Standard Capabilities (Signer) | Distill to interface + behavioral reqs |
| 5. Storage Proxy | Standard Capabilities (Storage) | Distill to scoping + operations |
| 6. Audio Management | OMIT | Application-specific, not protocol |
| 7. Relay Management | OMIT | Implementation detail |
| 8. Window/Shell Commands | OMIT | Shell-specific UX |
| 9. Cache Proxy (NIPDB) | Standard Capabilities (NostrDB) | Brief: query interface |
| 10. Hotkey Forwarding | OMIT | Application-specific |
| 11. Service Discovery | Capability Discovery | Full coverage: kind 29010 mechanism |
| 12. Protocol Layers | Fold into MUST/MAY section | Layer model as framing |
| 13. ACL Capabilities | OMIT internal details | Only observable behavior |
| 14. Security Model | Security Considerations | Distill: threat model + mitigations |
| 15. NIP-C4 Kinds | Event Kinds table | Kind table only |
| 16. Minimal Implementation | Appendix examples | Trim to ~20 lines each |

### 3. MUST vs MAY Layering (From Context Decisions)

**MUST (required for conformance):**
- Layer 0: postMessage transport with iframe sandbox (no allow-same-origin)
- Layer 1: NIP-01 wire format over postMessage
- Layer 2: AUTH handshake (REGISTER -> IDENTITY -> AUTH) with kind 22242
- Service/feature discovery via kind 29010 REQ/EVENT/EOSE

**MAY (optional capabilities):**
- Relay proxy (REQ/EVENT/CLOSE forwarding to real relays)
- IPC pub/sub (kind 29003 topic-based inter-napplet messaging)
- Napplet state storage (scoped key-value store)
- NIP-07 signer proxy (window.nostr via postMessage)
- Event database / nostrdb (kind 29006/29007 cache query)
- Channels/pipes (deferred to Phase 59, but slot reserved)

### 4. Critical Design Decisions From Context

- **D-01**: One concrete postMessage example per NIP-01 verb. ~3-4 code blocks for transport.
- **D-02**: Each MAY capability gets API surface (method signatures) PLUS behavioral requirements (~10 lines per capability).
- **D-03**: ASCII sequence diagram for AUTH handshake, followed by prose.
- **D-04**: Security section honestly acknowledges postMessage `*` origin requirement. Lists concrete mitigations.
- **D-05**: MUST/MAY layering per above.
- **D-06**: NIP number is 5D. Three-layer positioning: 5A=hosting, 5B=discovery, 5D=runtime.
- **D-07**: PR#2287 aggregate hash referenced as NIP-5A dependency, not inlined.

### 5. Wire Protocol Analysis

The NIP needs to define these message flows:

**Handshake (3 steps):**
```
Napplet                          Shell
  |--- REGISTER {dTag, hash} --->|
  |<-- IDENTITY {pub, priv} -----|
  |<-- AUTH <challenge> ----------|
  |--- AUTH <signed event> ----->|
  |<-- OK <event_id, true> ------|
```

**Relay proxy (standard NIP-01):**
```
Napplet                          Shell                     Relays
  |--- REQ <sub, filter> ------->|--- REQ to relays ------->|
  |<-- EVENT <sub, event> -------|<-- EVENT from relays -----|
  |<-- EOSE <sub> ---------------|                           |
  |--- EVENT <event> ----------->|--- EVENT to relays ------>|
  |<-- OK <id, bool, msg> -------|                           |
  |--- CLOSE <sub> ------------->|--- unsub from relays ---->|
```

**Service discovery:**
```
Napplet                          Shell
  |--- REQ "svc" {kinds:[29010]}->|
  |<-- EVENT "svc" {kind:29010} --|  (one per service)
  |<-- EOSE "svc" ----------------|
```

### 6. Kind Numbers for the NIP

The NIP should define these as postMessage bus kinds (never on relays):

| Kind | Name | Section |
|------|------|---------|
| 22242 | AUTH | Per NIP-42 (reused) |
| 29001 | SIGNER_REQUEST | Signer capability |
| 29002 | SIGNER_RESPONSE | Signer capability |
| 29003 | IPC_PEER | IPC + Storage + Services |
| 29006 | NIPDB_REQUEST | NostrDB capability |
| 29007 | NIPDB_RESPONSE | NostrDB capability |
| 29010 | SERVICE_DISCOVERY | Discovery (MUST) |

Decision: Define kind numbers normatively. A napplet built for one conforming shell must work on another. This is the point of standardization. But make crystal clear these never touch relay WebSockets.

### 7. window.napplet Namespace (Normative)

| Namespace | MUST/MAY | Discovery Name | Description |
|-----------|----------|---------------|-------------|
| `window.napplet.services` | MUST | (always present) | Service discovery |
| `window.napplet.relay` | MAY | `relay` | NIP-01 relay operations |
| `window.napplet.ipc` | MAY | `ipc` | Inter-napplet pub/sub |
| `window.napplet.storage` | MAY | `storage` | Scoped state storage |
| `window.nostr` | MAY | `signer` | NIP-07 signer proxy |
| `window.nostrdb` | MAY | `nostrdb` | Event database |

### 8. Security Section Requirements

Must address:
1. Threat model: napplet untrusted, shell trusted
2. iframe sandbox: no allow-same-origin, opaque origins
3. postMessage `*` origin: required due to opaque origins, not a vulnerability
4. MessageEvent.source: unforgeable Window reference for sender ID
5. AUTH handshake: cryptographic trust establishment (one-time Schnorr verify)
6. Hybrid model: verify once, trust Window reference thereafter
7. Delegated key confinement: never published to relays
8. Storage scoping: isolated by composite key
9. What the protocol does NOT protect against

### 9. Pitfall Avoidance Checklist

From PITFALLS.md research:
- [ ] No internal implementation details (ACL bitfields, hook interfaces, ring buffer sizing)
- [ ] No definition of "what is a napp/napplet" beyond "speaks this protocol"
- [ ] Clear differentiation from NIP-5A (hosting) and NIP-5B (discovery)
- [ ] Ephemeral kind numbers clearly labeled as postMessage-only
- [ ] Security section addresses `*` origin proactively
- [ ] Minimal MUSTs (AUTH + discovery only)
- [ ] Under 500 lines of markdown

## Validation Architecture

### Success Criteria Verification

| Criterion | How to Verify |
|-----------|--------------|
| SC-1: NIP draft file with all sections | File exists at `specs/NIP-5D.md`; grep for section headings |
| SC-2: Every capability has MUST/MAY | grep for each capability name + "MUST\|MAY" in same section |
| SC-3: No implementation details | grep for banned terms: "ring buffer", "RuntimeAdapter", "ShellAdapter", "SessionRegistry", "localStorage" |
| SC-4: Under 500 lines | `wc -l specs/NIP-5D.md` < 500 |
| SC-5: MUST/MAY split explicit | grep confirms AUTH + discovery are MUST; relay/IPC/storage/signer/nostrdb are MAY |

### Requirement Coverage

| Req ID | Verification |
|--------|-------------|
| SPEC-01 | AUTH section exists with REGISTER/IDENTITY/AUTH wire format |
| SPEC-02 | Relay proxy section defines REQ/EVENT/CLOSE forwarding |
| SPEC-03 | Capability discovery section defines kind 29010 |
| SPEC-04 | Manifest section references NIP-5A requires tags |
| SPEC-05 | Security section addresses postMessage `*`, sandbox, delegated keys |
| SPEC-06 | Explicit MUST/MAY classification for all features |
| CAP-01 | Relay proxy capability section with window.napplet.relay |
| CAP-02 | IPC section with window.napplet.ipc |
| CAP-03 | Storage section with window.napplet.storage |
| CAP-04 | Signer section with window.nostr, referencing NIP-07 |
| CAP-05 | NostrDB section with window.nostrdb |
| CAP-06 | Service discovery section with window.napplet.services as MUST |

## RESEARCH COMPLETE
