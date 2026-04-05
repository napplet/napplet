# Project Research Summary

**Project:** NIP-5C "Nostr Web Applets" Specification
**Domain:** Protocol specification + channel protocol implementation for sandboxed Nostr iframe applications
**Researched:** 2026-04-05
**Confidence:** HIGH

## Executive Summary

This milestone is fundamentally a specification authorship exercise paired with a targeted protocol implementation. The project must distill a 1520-line internal SPEC.md into a terse NIP (~300 lines of markdown, ~2800 words) that defines the postMessage wire protocol between sandboxed iframe "napplets" and a host "shell," then implement a new channel protocol for low-latency point-to-point inter-napplet communication. The NIP sits in the "NIP-5x" family alongside NIP-5A (file hosting, merged) and NIP-5B (app discovery, open PR), filling the gap for runtime communication -- what happens after the iframe loads. This orthogonality to existing proposals is a strategic advantage for acceptance.

The recommended approach is declarative-first capability negotiation: the shell advertises available features via kind 29010 service discovery events, the napplet declares requirements in its NIP-5A manifest `requires` tags at build time, and probes at runtime via `window.napplet.services.has()`. This pattern draws from LSP/MCP's layered requirements, NIP-11's flat capability advertisement, and WebExtensions' manifest permissions -- while avoiding the interactive negotiation round-trips the Nostr community explicitly rejected (NIP-91). The mandatory core is minimal: postMessage transport + NIP-01 wire format + AUTH handshake + service discovery. Everything else (relay proxy, signer, storage, IPC, channels, nostrdb) is MAY.

The primary risks are political rather than technical. The NIP-5x space has active territorial dynamics (hzrd149, arthurfranca, fiatjaf), and submitting without pre-engagement will invite jurisdictional debate that derails technical review. The top technical risk is overspecification -- the internal SPEC.md contains runtime implementation details (ACL persistence, hook interfaces, ring buffer sizing) that do not belong in a NIP and will trigger "too long and complex" rejection from fiatjaf. Additionally, "NIP-5C" is claimed by fiatjaf's "Scrolls" (WASM programs, PR#2281) -- the project must choose an alternative number (5D, 5E, 5F) or contest the claim.

## Key Findings

### Recommended Stack

This is a specification milestone. The "stack" is markdown, JSON examples, and RFC 2119 keywords -- all dictated by NIP conventions. No new dependencies are needed. The channel protocol implementation phase uses the existing monorepo toolchain (TypeScript 5.9, tsup, turborepo, vitest, playwright). See [STACK.md](STACK.md) for full details.

**Core technologies:**
- **Markdown (CommonMark)**: NIP document format -- all NIPs are plain markdown with setext headings
- **RFC 2119 keywords**: MUST/SHOULD/MAY requirement levels -- follow NIP-42 style (capitalized)
- **JSON (RFC 8259)**: Wire format examples -- NIP-01 events are JSON
- **TypeScript 5.9**: Channel protocol implementation -- existing codebase language
- **Vitest 4.x + Playwright**: Channel protocol testing -- existing test infrastructure

**Critical version note:** NIP-5A was merged 2026-03-25. PR#2287 (aggregate hash extension by hzrd149) is open and unmerged -- the project depends on this for version-specific ACL identity.

### Expected Features

Findings synthesized from [FEATURES.md](FEATURES.md) (NIP content scope) and [FEATURES-CHANNELS.md](FEATURES-CHANNELS.md) (channel protocol patterns).

**Must have (table stakes for the NIP):**
- Transport definition (postMessage + sandbox policy)
- Wire format tables (NIP-01 verbs + REGISTER/IDENTITY additions)
- AUTH handshake specification (REGISTER/IDENTITY/AUTH flow with key derivation formula)
- Capability model with MUST/MAY layering
- Service discovery mechanism (kind 29010)
- NIP-5A manifest integration (`requires` tag semantics)
- Security model (threat model, iframe sandbox guarantees)
- Event kind assignments (postMessage bus kinds, not relay kinds)
- Minimal implementation examples (~30 lines each for napplet and shell)

**Should have (differentiators):**
- Declarative capability negotiation (no round-trip)
- Build-time requirement declaration via NIP-5A `requires` tags
- Delegated key identity model (HMAC-SHA256 derivation)
- `window.napplet` namespace standard (analogous to NIP-07's `window.nostr`)
- Channel protocol: named channels, auth-on-open, `["CH", id, payload]` wire format, broadcast

**Defer (v2+ / follow-up NIP):**
- `window.nostrdb` (may warrant its own NIP)
- MessagePort upgrade path for channels (high complexity, spec as MAY only)
- Transferable ArrayBuffer support for binary channel data
- Channel groups for selective broadcast
- Backpressure/flow control

### Architecture Approach

NIP-5C should be structured as a ~2800-word specification with layered requirements: a small MUST core (transport + AUTH + service discovery) and a large MAY surface (all standard capabilities). The capability negotiation model combines NIP-11-style passive advertisement, WebExtensions-style manifest declaration, and W3C-style runtime feature detection. The channel protocol follows the consensus state machine observed across five frameworks (WebExtensions, Electron, Figma, SharedWorker, VST/DAW): `CLOSED -> OPENING -> AUTH_CHECK -> OPEN -> CLOSING -> CLOSED`. See [ARCHITECTURE.md](ARCHITECTURE.md) and [FEATURES-CHANNELS.md](FEATURES-CHANNELS.md) for full analysis.

**Major components of the NIP:**

1. **Core protocol (Sections 1-3)** -- Transport, wire format, AUTH handshake. The mandatory foundation every shell and napplet must implement.
2. **Capability framework (Sections 4-5)** -- Relay proxy contract, capability model with MUST/MAY split, service discovery mechanism. The architectural innovation that makes the protocol extensible.
3. **Standard capabilities (Section 6)** -- Signer proxy, storage, IPC pub/sub, channels, nostrdb. All MAY. Each independently discoverable and implementable.
4. **API surface standard (Section 7)** -- Normative `window.napplet.*` namespace, analogous to NIP-07.
5. **Security model (Section 8)** -- Threat model, sandbox guarantees, wildcard origin justification, delegated key confinement.

**Key architectural decisions:**
- Runtime internals (ACL persistence, hook interfaces, ring buffer sizing, topic-prefix routing) are explicitly EXCLUDED from the NIP
- Kind numbers 29001-29010 are normative (required for cross-shell napplet portability) but documented as postMessage-channel-only identifiers, never relay-destined
- The NIP references NIP-5A for manifests, NIP-01 for wire format, NIP-42 for AUTH structure, NIP-07 for signer interface -- never reproduces their content

### Critical Pitfalls

Top 5 from [PITFALLS.md](PITFALLS.md), ordered by severity:

1. **Overspecification of runtime internals** -- The 41KB SPEC.md contains ACL bitfields, service registry internals, session management details. None of this belongs in the NIP. Hard rule: if it is not observable on the postMessage wire, it does not belong. Target under 300 lines. Detection: if the NIP references internal data structures or class names, it is overspecified.

2. **Defining "what is a napp"** -- Do NOT create a prescriptive classification of "nostr app" vs "static website." dskvr filed CHANGES_REQUESTED on NIP-5B for exactly this. A napplet is anything that speaks this protocol. Period. The embedding relationship is the defining characteristic, not feature support.

3. **Territorial conflict with NIP-5B/NIP-C4** -- Three related proposals already exist. NIP-5C must be framed as complementary (5A = file storage, 5B = discovery, 5C = runtime communication). Pre-engage hzrd149, arthurfranca, and fiatjaf before submitting the PR.

4. **Ephemeral kind range confusion** -- Kinds 29001-29010 fall in the 20000-29999 "ephemeral events" range per NIP-01, but they carry persistent semantic weight. The NIP must make crystal clear these are postMessage bus identifiers that never touch relays.

5. **postMessage `*` origin without security analysis** -- Sandboxed iframes require wildcard target origin. A proactive Security Considerations section must address this, explaining that `allow-same-origin` exclusion creates opaque origins, and sender authentication uses `MessageEvent.source` + AUTH cryptographic challenge-response, not `event.origin`.

## Implications for Roadmap

Based on the combined research, the milestone decomposes into 5 phases with clear dependency ordering.

### Phase 1: NIP Number Resolution and Stakeholder Pre-Engagement

**Rationale:** The NIP-5C filename is claimed (PR#2281). This must be resolved before any spec writing begins. Stakeholder engagement is the single highest-leverage activity for NIP acceptance and must happen before the PR is submitted.
**Delivers:** Confirmed NIP number (5D/5E/5F or contested 5C), preliminary buy-in from hzrd149/arthurfranca/fiatjaf on scope differentiation.
**Addresses:** Pitfall 3 (territorial conflict), Pitfall 8 (no pre-engagement), STACK.md NIP number finding.
**Avoids:** Submitting a PR that immediately triggers jurisdictional debate.

### Phase 2: NIP Spec Authorship (Core Protocol)

**Rationale:** The NIP is the deliverable that matters most for the Nostr ecosystem. The spec must be written before channel implementation because the channel protocol section needs to be designed at the spec level first, then implemented.
**Delivers:** Complete NIP markdown file (~300 lines) covering Sections 1-5 (transport, wire format, AUTH, relay proxy, capability model) plus Section 7 (API surface), Section 8 (security), Section 9 (event kinds), and appendices.
**Addresses:** All FEATURES.md table stakes, ARCHITECTURE.md structure decisions, Pitfalls 1/2/4/5/6/9/11/12.
**Avoids:** Overspecification by using the "is it observable on the wire?" test for every paragraph.

### Phase 3: Channel Protocol Design and Spec Section

**Rationale:** The channel protocol is the only feature that needs both design and implementation. The spec section (Section 6.4) should be written before implementation so the wire format is locked.
**Delivers:** NIP Section 6.4 (channels), channel wire format definition (`CH_OPEN/CH_ACCEPT/CH_CLOSE/CH_CLOSED/CH_ERROR/CH/CH_BROADCAST`), shim API surface design (`window.napplet.channels`).
**Addresses:** FEATURES-CHANNELS.md table stakes and differentiators, FEATURES.md channel protocol entry.
**Avoids:** Pitfall 10 (terminology collision with NIP-28/NIP-29 "channels" -- consider alternative naming).

### Phase 4: Channel Protocol Implementation

**Rationale:** Implementation validates the spec and provides the reference implementation needed for NIP acceptance ("fully implemented in at least two clients").
**Delivers:** Channel protocol in `@napplet/shim` and `@napplet/shell` packages, test suite covering open/close/data/broadcast lifecycle, integration with existing ACL system.
**Uses:** TypeScript 5.9, vitest, existing monorepo toolchain (no new dependencies).
**Implements:** FEATURES-CHANNELS.md MVP: named channels, auth-on-open, minimal post-auth wire format, broadcast as channel operation, shim API on `window.napplet.channels`.
**Avoids:** Pitfall 7 (no working implementations at submission time).

### Phase 5: NIP Submission and Standard Capabilities Sections

**Rationale:** Submit after implementation validates the protocol. Include the full standard capabilities section (6.1-6.5) and Implementations section listing napplet SDK + hyprgate.
**Delivers:** Completed NIP PR to nostr-protocol/nips with README.md updates, Implementations section, all standard capability definitions finalized.
**Addresses:** Pitfall 7 (reference implementations), Pitfall 11 (README updates), NIP acceptance criteria.
**Avoids:** Submitting a theoretical spec without implementation proof.

### Phase Ordering Rationale

- **Stakeholder engagement first** because political acceptance is the highest risk. Technical work done before engagement may need to be reworked based on community feedback.
- **Core spec before channels** because the channel protocol depends on the transport, AUTH, and capability framework being designed first (FEATURES.md dependency graph).
- **Channel spec before implementation** because implementing without a locked wire format leads to spec-implementation divergence.
- **Implementation before submission** because NIP acceptance criteria require working implementations, and implementation validates the spec design.
- **Submission last** because it incorporates all prior work and includes the README.md updates that are easy to forget (Pitfall 11).

### Research Flags

Phases likely needing deeper research during planning:

- **Phase 1 (NIP Number + Stakeholders):** Needs live research -- check current state of PR#2281, PR#2282, PR#2287 at planning time. The political landscape may have shifted.
- **Phase 3 (Channel Protocol Design):** MEDIUM -- the FEATURES-CHANNELS.md research is thorough but the naming decision (channels vs pipes vs connections to avoid NIP-28/29 collision) needs finalization.

Phases with standard patterns (skip deep research):

- **Phase 2 (NIP Spec Authorship):** The ARCHITECTURE.md research provides a complete document structure with section-by-section word counts. The PITFALLS.md gives a clear checklist of what to avoid. Well-documented pattern.
- **Phase 4 (Channel Implementation):** Standard TypeScript implementation using existing monorepo toolchain. The wire format and API surface are defined in Phase 3. No new technologies.
- **Phase 5 (Submission):** Mechanical -- fork, branch, add file, update README, open PR. Process documented in STACK.md.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | NIP format is fully deterministic (markdown, JSON). Implementation stack is the existing monorepo. No choices to make. |
| Features (NIP content) | HIGH | Grounded in analysis of 6+ existing NIPs and the 1520-line SPEC.md. Clear table stakes/differentiators/anti-features separation. |
| Features (Channels) | MEDIUM-HIGH | Analyzed 5 real-world channel/port frameworks with convergent lifecycle patterns. Performance data is benchmark-quality. MessagePort upgrade path has lower confidence (browser-specific). |
| Architecture | HIGH | Analyzed 6 protocol specs (NIP-11, LSP, MCP, WebExtensions, W3C Permissions, WebRTC SDP). Clear convergence on declarative advertisement pattern. Concrete document structure with word-count estimates. |
| Pitfalls | HIGH | All critical pitfalls grounded in actual NIP PR review history (PR#1538, #2274, #2277, #2282). fiatjaf's feedback directly observed. postMessage security backed by CVE references. |

**Overall confidence:** HIGH

### Gaps to Address

- **NIP number availability:** "5C" is claimed by fiatjaf's Scrolls (PR#2281). Must decide: use 5D/5E/5F or contest. Cannot be resolved by research alone -- requires stakeholder discussion.
- **PR#2287 (aggregate hash) status:** The project depends on this unmerged NIP-5A extension for version-specific ACL. If it stalls, NIP-5C must either inline the algorithm or note the dependency. Check status at Phase 2 planning.
- **Kind number strategy:** Research recommends normative assignment for cross-shell interoperability, but SPEC.md Section 3.8 says "implementation-specific." Decision needed: normative (all shells use 29001 for signer requests) or informative. Recommendation: normative.
- **Channel naming:** "Channels" collides with NIP-28 "Public Chat Channels" and NIP-29 "Relay-based Groups." Consider "pipes," "links," or "connections." Decide during Phase 3.
- **Second implementation for NIP acceptance:** NIP merge criteria want "two clients." The napplet SDK + hyprgate is arguably one ecosystem. Engaging arthurfranca's 44billion.net as a second shell would strengthen the submission. Assess during Phase 1.

## Sources

### Primary (HIGH confidence)
- nostr-protocol/nips repo (verified 2026-04-05) -- NIP format conventions, kind registry, PR history
- NIP-5A merged spec (PR#1538) -- base layer specification, 5-month review history
- NIP-5B open PR (#2282) -- app discovery proposal, fiatjaf/dskvr review comments
- NIP-5C/Scrolls open PR (#2281) -- filename conflict, fiatjaf authorship
- Chrome Extension Message Passing docs -- Port lifecycle, named channels, disconnect semantics
- Electron MessagePorts tutorial -- Broker pattern, port transfer optimization
- LSP 3.17 specification -- Bidirectional capability exchange, layered requirements
- MCP specification (2025-11-25) -- Capability objects, presence/absence semantics

### Secondary (MEDIUM confidence)
- Jeff Kaufman: MessageChannel overhead benchmarks -- Chrome/Firefox/Safari comparison
- Figma plugin architecture docs -- Message queuing, two-environment model
- Chrome Blog: Transferable Objects -- 302ms clone vs 6.6ms transfer benchmarks
- Mozilla bugzilla: postMessage startup latency (#1164539), WebRTC DataChannel latency (#976115)
- PostMessage CVE references (CVE-2024-49038, MSRC analysis)

### Tertiary (LOW confidence)
- Surma: postMessage performance analysis (from training data, 403 on direct access)
- Nolan Lawson: Web Worker message performance (2016, may be outdated)
- Community forum discussions on VST/MIDI timing patterns

---
*Research completed: 2026-04-05*
*Ready for roadmap: yes*
