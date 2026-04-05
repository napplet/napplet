# Feature Landscape: NIP-5C Specification

**Domain:** Protocol specification for sandboxed Nostr web applets
**Researched:** 2026-04-05

## Table Stakes

Features that MUST be in the NIP for it to be a useful, implementable specification. Missing any of these = the NIP is incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Transport definition (postMessage + sandbox) | Foundation -- without this, nothing else works | Low | Mostly prose, one table |
| Wire format tables (verbs, message structure) | Implementors need exact message formats | Low | Reference NIP-01, add REGISTER/IDENTITY |
| AUTH handshake (REGISTER/IDENTITY/AUTH) | The protocol's core innovation -- identity establishment | Medium | Key derivation formula is critical |
| Capability model (MUST/MAY split) | The NIP's architectural contribution | Medium | Novel section, needs careful design |
| Service discovery mechanism | How napplets learn what's available | Low | Already implemented (kind 29010) |
| NIP-5A manifest integration | How napplets declare requirements | Low | Reference NIP-5A, define `requires` semantics |
| Security model | Required for any sandboxing protocol | Medium | Threat model, guarantees, non-guarantees |
| Event kind assignments | Normative kind numbers for interoperability | Low | Table of kinds |
| Minimal implementation examples | NIP convention -- show a working napplet + shell | Low | ~30 lines each |

## Differentiators

Features that set NIP-5C apart from "just iframe postMessage."

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Declarative capability negotiation | Napplets adapt to available features without negotiation round-trips | Medium | Key architectural decision |
| Build-time requirement declaration (NIP-5A requires tags) | Shells know what napplets need before loading them | Low | Already implemented in vite-plugin |
| Delegated key identity model | Deterministic keypairs without napplet-side secret storage | Medium | HMAC-SHA256 derivation -- novel |
| Channel protocol (point-to-point) | Enables low-latency inter-napplet communication beyond pub/sub | High | NEW -- needs design + implementation |
| Hybrid verification model (verify once, trust source) | Per-message crypto overhead eliminated | Low | Novel security insight |
| `window.napplet` namespace standard | Cross-shell napplet portability | Medium | Like NIP-07 but for napplet API surface |

## Anti-Features

Features to explicitly NOT put in the NIP.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| ACL persistence format | Implementation-specific storage choice | Define observable behavior ("napplet receives error when capability denied") |
| Hook/adapter interface definitions | TypeScript-specific DI pattern | Define the wire protocol, not the code structure |
| Ring buffer sizing / eviction strategy | Performance tuning, not protocol | Mention replay protection requirement, leave implementation open |
| Topic-prefix routing internals | Implementation of service dispatch | Define topic format convention, not routing code |
| Audio management service details | Application-specific service | Document as example custom service, not normative |
| Keybinds protocol | Application-specific feature | Omit from NIP entirely |
| DM send protocol | Application-specific feature | Omit from NIP entirely |
| Window creation commands | Shell-specific UX | Omit from NIP entirely |
| Storage migration logic | Version-specific implementation detail | Omit from NIP |
| Consent prompt UX | Shell-specific UI decision | Specify requirement for consent, not how to prompt |

## Feature Dependencies

```
Transport (Section 1)
  |
Wire Format (Section 2)
  |
AUTH Handshake (Section 3)
  |
Relay Proxy (Section 4) <-- depends on AUTH being done
  |
Capability Model (Section 5) <-- depends on AUTH + relay proxy being defined
  |
Standard Capabilities (Section 6) <-- depends on capability model
  +-- 6.1 Signer (window.nostr)
  +-- 6.2 Storage (window.napplet.storage)
  +-- 6.3 IPC (window.napplet.ipc)
  +-- 6.4 Channels (window.napplet.channels) <-- NEW, needs IPC as foundation
  +-- 6.5 NostrDB (window.nostrdb)
```

## MVP Recommendation

The minimum NIP that is worth submitting:

1. **Transport + Wire Format + AUTH** -- the mandatory core
2. **Capability model** -- the architectural contribution
3. **Service discovery** -- the discovery mechanism (already implemented)
4. **Relay proxy + Signer proxy + Storage** -- the most-used capabilities
5. **Security model** -- required for sandboxing spec
6. **Minimal examples** -- NIP convention

**Defer to a follow-up NIP or amendment:**
- Channel protocol (needs design + implementation first)
- `window.nostrdb` (may warrant its own NIP if it standardizes a general-purpose event DB API)

## Sources

- Analysis of NIP-01, NIP-07, NIP-11, NIP-42, NIP-46 structure and content
- SPEC.md current content (1520 lines) audited for normative vs informative content
- WebExtensions manifest.json permission model (MDN documentation)
- MCP specification lifecycle and capability negotiation
