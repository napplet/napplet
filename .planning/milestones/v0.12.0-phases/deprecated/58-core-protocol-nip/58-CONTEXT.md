# Phase 58: Core Protocol NIP - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Write the NIP-5D specification body: AUTH handshake, relay proxy, capability discovery, all 6 standard capabilities (relay, IPC, storage, NIP-07, nostrdb, services), MUST/MAY layering, and security considerations. The NIP should be under 500 lines, terse, and in nostr-protocol/nips markdown format. Channel protocol is NOT in this phase (Phase 59).

</domain>

<decisions>
## Implementation Decisions

### Wire Format Verbosity
- **D-01:** One concrete postMessage example per NIP-01 verb (REQ, EVENT, CLOSE). Reference NIP-01 for full format, don't reproduce the relay protocol. ~3-4 code blocks total for transport section.

### Capability Interface Depth
- **D-02:** Each MAY capability gets API surface (method signatures for window.napplet.*) PLUS behavioral requirements (what the shell MUST do). Target ~10 lines per capability section. Not TypeScript interfaces, not pure prose — the middle ground.

### AUTH Handshake Presentation
- **D-03:** ASCII sequence diagram showing the 3-step REGISTER/IDENTITY/AUTH flow, followed by prose explaining each step. Sequence diagram gives visual overview, prose provides the normative spec. ~30 lines for AUTH section.

### Security Section
- **D-04:** Defensive approach — honestly acknowledge that postMessage `*` origin is required because sandboxed iframes have opaque origins. List concrete mitigations: AUTH handshake as trust boundary, message validation, no allow-same-origin in sandbox attribute, delegated key confinement. Don't propose restrictions that aren't implementable given the sandbox constraint.

### MUST/MAY Layering (from Phase 57)
- **D-05:** MUST: AUTH handshake + service/feature discovery. MAY: relay proxy, IPC, storage, NIP-07 signer, nostrdb. Channels are MAY but defined in Phase 59.

### NIP Identity (from Phase 57)
- **D-06:** NIP number is 5D. Three-layer positioning: 5A=hosting, 5B=discovery, 5D=runtime communication.
- **D-07:** PR#2287 aggregate hash referenced as dependency on NIP-5A. Assume merge, don't inline.

### Claude's Discretion
- Exact section ordering within the NIP (transport → AUTH → discovery → capabilities → security is suggested by research but flexible)
- How to format the kind number table (follow existing NIP conventions)
- Whether to include a "Motivation" section or jump straight into the protocol
- RFC 2119 keyword usage style (formal vs informal — match existing NIPs)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Source Material
- `SPEC.md` — Current internal protocol specification (41KB+). The source being distilled into NIP-5D. Read sections: §2 (transport/wire), §3 (AUTH), §4 (relay proxy), §11 (services/discovery), §14 (security).

### NIP Format & Conventions
- `.planning/research/STACK.md` — NIP format conventions (setext headings, draft badge, kind table format), NIP-5A content summary, PR process
- `.planning/research/ARCHITECTURE.md` — Recommended NIP section structure, MUST/MAY layering model, capability negotiation patterns
- `.planning/research/PITFALLS.md` — NIP rejection patterns (overspecification, missing security section, stakeholder dynamics)

### Prior Phase Context
- `.planning/phases/57-nip-resolution-pre-engagement/57-CONTEXT.md` — NIP number decision (5D), positioning, PR#2287 strategy

### External References
- NIP-01 (referenced for relay wire format)
- NIP-5A (referenced for manifest/hosting)
- NIP-07 (referenced for signer interface)
- NIP-42 (referenced for AUTH challenge-response pattern)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SPEC.md` sections map directly to NIP sections — distillation source
- `packages/shim/src/index.ts` — window.napplet.* API surface (the actual interfaces being specified)
- `packages/core/src/index.ts` — BusKind constants, protocol types (kind numbers to reference)
- `packages/runtime/src/runtime.ts` — AUTH handshake implementation (source of truth for sequence)

### Established Patterns
- AUTH handshake: REGISTER → IDENTITY → AUTH (3-step, delegated keys)
- Capability advertisement via kind 29010 synthetic events
- window.napplet namespace: relay, ipc, services, storage
- window.nostr for NIP-07 signer proxy

### Integration Points
- NIP-5D intro should reference NIP-5A for nsite hosting
- Security section maps to SPEC.md §14 but must be terse
- Kind number table must follow nostr-protocol/nips README format

</code_context>

<specifics>
## Specific Ideas

- The three-layer framing (5A/5B/5D) should be the opening paragraph or abstract
- Keep total NIP under 500 lines (research says 300 is ideal, 500 is the max)
- Each capability section: 2-line description, method signatures, behavioral MUST/MAY, done
- Sequence diagram for AUTH is the visual hook — make it the centerpiece

</specifics>

<deferred>
## Deferred Ideas

- Channel protocol details (Phase 59)
- Channel implementation (Phase 60)
- Spec packaging and format finalization (Phase 61)

</deferred>

---

*Phase: 58-core-protocol-nip*
*Context gathered: 2026-04-05*
