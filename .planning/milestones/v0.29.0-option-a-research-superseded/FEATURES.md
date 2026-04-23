# Feature Research

**Domain:** Napplet NUB-RELAY amendment — receive-side shell-mediated NIP-17 / NIP-59 / NIP-44 decrypt surface (`relay.subscribeEncrypted`)
**Researched:** 2026-04-23
**Confidence:** HIGH on spec shape (NIPs 01/17/44/59 are authoritative and unambiguous), HIGH on mirror-shape of `relay.publishEncrypted` precedent in-repo, MEDIUM on cross-client UX (clients don't publish their consent batching strategies; claims below based on NIP-07/NIP-46 primitives + client release notes, not source audits)

## Scope Framing

This milestone ships **one new message surface**: `relay.subscribeEncrypted` on NUB-RELAY, with its `.event` / `.eose` / `.closed` / `.error` result envelopes, plus the SDK helper and the NIP-5D Security Considerations amendment documenting the NIP-07 `all_frames: true` leak as a known non-mitigation. The "feature landscape" below is scoped accordingly: features of the **wire surface**, not features of a DM product.

NUB scope boundary (per `feedback_nub_scope_boundary` memory): the spec defines the **protocol surface and potentialities**; per-event signer prompt UX, batched consent UI, trust-for-duration dialogs, and "don't ask again" toggles are **shell concerns** and stay out of the NUB. The research below captures what the shell *can* do so the wire surface doesn't preclude any of it — not what it *must* do.

## Feature Landscape

### Table Stakes (Must Ship in v0.29.0)

Features the surface is broken without. Each one corresponds to a REQ-ID in the requirements phase.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| `relay.subscribeEncrypted` request envelope | Entire point of milestone — mirror of `relay.publishEncrypted` (v0.24.0) | LOW | New discriminated-union variant in `packages/nub/src/relay/types.ts`; shape parallels `RelaySubscribeMessage` (`id`, `subId`, `filters`, optional `relay?`) plus encryption/unwrap fields |
| `relay.subscribeEncrypted.event` result envelope | Napplet needs a distinct channel so it doesn't have to sniff whether a `relay.event` payload is ciphertext or plaintext | LOW | Mirror of `RelayEventMessage` but carries `rumor` (unsigned `Rumor = UnsignedEvent & { id }`) instead of a signed `event`. Sender is separate field to make impersonation check explicit |
| `relay.subscribeEncrypted.eose` | Lifecycle parity with `relay.subscribe` | LOW | Trivial; same shape as `RelayEoseMessage` (subId only) |
| `relay.subscribeEncrypted.closed` | Lifecycle parity; napplet needs to know when the subscription is torn down (signer denial, relay close, shell policy, auth loss) | LOW | Mirror of `RelayClosedMessage`; `reason?` string carries disambiguation |
| `relay.subscribeEncrypted.error` result envelope | Separate from `.closed` because errors can be per-event (one rumor failed MAC check) or per-subscription (signer denied). `.closed` means "stream over"; `.error` means "skip this one and keep going" OR "unrecoverable, expect .closed next" | LOW-MEDIUM | Needs a small reason-code vocabulary: `signer-denied`, `decrypt-failed`, `malformed-wrap`, `impersonation` (kind-13 seal pubkey ≠ kind-14 rumor pubkey — MUST per NIP-17), `unsupported-encryption`, `policy-denied`. Modeled on the 8-code vocabulary established by NUB-RESOURCE in v0.28.0 |
| `encryption?: 'nip44' \| 'nip04'` parameter | Defaults must be explicit. NIP-44 is the modern successor; NIP-04 is deprecated but still deployed (legacy kind-4 DMs dominate pre-NIP-17 history) | LOW | Default `'nip44'` — matches `RelayPublishEncryptedMessage` default; consistency is the whole argument |
| `unwrap?: 'gift-wrap' \| 'direct'` parameter | Two distinct modes are already in the wild. `gift-wrap` = NIP-17/NIP-59 three-layer (kind 1059 → kind 13 → kind 14 rumor). `direct` = single-hop NIP-44 (or NIP-04) encrypted content on an arbitrary kind — e.g., legacy kind-4 DMs, or app-specific encrypted content in custom kinds | LOW | Default should be `'gift-wrap'` — the whole point of this milestone is plugging the NIP-17 gap. `'direct'` mode is a future-proofing lever for legacy/custom use cases; spec includes it so the surface doesn't need re-versioning later |
| `RelaySubscribeEncryptedEvent.rumor` field shape | Napplets expect a familiar `Rumor = UnsignedEvent & { id: string }` — the nostr-tools convention. Includes `pubkey` (real sender), `kind`, `content` (plaintext), `tags`, `created_at` (rumor's own timestamp, not the wrap's randomized one), `id` (rumor hash). **Not signed** — there is no sig on a rumor, by NIP-59 definition | LOW | Napplet author can treat this structurally like a signed event minus sig; nostr-tools already exports `Rumor` type |
| `RelaySubscribeEncryptedEvent.sender` field | Extracted for convenience: `rumor.pubkey` after shell has verified the kind-13 seal's `pubkey === rumor.pubkey` impersonation check. Putting it at the envelope top level emphasizes **shell has validated this** — the napplet does not re-verify | LOW | Redundant with `rumor.pubkey`, but worth the bytes for API ergonomics and spec clarity |
| Teardown via `relay.close` reuse OR `relay.subscribeEncrypted.close` | Napplet needs a way to unsubscribe. Reusing existing `relay.close` with the same `subId` keeps the surface small (one close path for both plaintext and encrypted subs) | LOW | Recommend reuse — subId space is already unified. Spec MUST say so explicitly to prevent implementer divergence |
| SDK helper `subscribeEncrypted(filters, { encryption?, unwrap?, onEvent, onEose, onClosed, onError })` returning `{ close(): void }` | DX parity with existing `subscribe()` in `packages/nub/src/relay/sdk.ts` — callback-based pattern is already established convention | LOW | Mirror the existing function shape exactly; it's the only thing napplet authors should need to reach for |
| NUB-RELAY spec amendment (public `napplet/nubs`) | Shells need a conformance target; @napplet/* packages are the reference implementation but the **spec** is the contract | MEDIUM | Amendment lands on public repo; MUST strip `@napplet/*` / `kehto` / `hyprgate` references per `feedback_no_private_refs_commits` memory. Needs: message catalog, conformance table, security considerations (including NIP-07 non-mitigation), impersonation-check MUST, created_at leakage note |
| NIP-5D Security Considerations amendment | The NIP-07 `all_frames: true` content-script leak is the **reason this surface exists**. Spec must call it out so downstream shells know the browser-sandbox layer doesn't save them | LOW-MEDIUM | Add a subsection alongside the v0.28.0 Browser-Enforced Resource Isolation section. Point to `relay.subscribeEncrypted` as the spec-legal path. Keep guidance only — browser-extension hardening is out of NIP scope |

### Differentiators (Valuable, Defer Decision to Discuss-Milestone)

Features that could ship now or in a future amendment. Each one should be evaluated during `/gsd:discuss-milestone` for whether it's worth the surface-area cost in v0.29.0 vs. a v0.30.x follow-up.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| `rumorKinds?: number[]` filter parameter | NIP-17 by convention uses kinds 14 (text), 15 (file), 7 (reactions) inside rumors. NIP-59 admits **any** kind as a rumor. A chat napplet that only wants kind-14 doesn't want kind-15 file rumors spamming its `onEvent`. Without this, napplet must filter post-unwrap, wasting signer round-trips on irrelevant kinds | MEDIUM | **Recommendation: ship in v0.29.0.** Without it, napplets pay the decrypt cost for every rumor even if they throw it away. Shell-side filter lets the shell *skip decrypting* unwanted kinds. The cost is a single optional array field on the request envelope. Cheap, high leverage |
| Outer wrap event ID in `.event` envelope | Useful for "mark as read" / dedup on the napplet side — rumor `id` is the inner hash, but the gift-wrap `id` is what uniquely identifies the message on relays | LOW | **Recommendation: include as optional `wrapId?: string`.** Napplet can use `rumor.id` for dedup in practice, but some client logic (deletion, NIP-09 kind 5 targeting the wrap, relay-side mark-seen) needs the outer id. Trivial field, high optional value |
| Wrap `created_at` disclosure policy | NIP-59 **intentionally randomizes** the outer `created_at` ±2 days to defeat time-analysis. Exposing `wrap.created_at` to the napplet is a footgun — a naive napplet will sort by it and leak the randomization back to observers via UI timing. Rumor has its own `created_at` (real timestamp). Spec must either (a) never surface wrap time, or (b) surface both and document the pitfall loudly | LOW | **Recommendation: do NOT surface `wrap.created_at` in the minimum-viable envelope.** Rumor's own `created_at` is the canonical time; the randomized wrap timestamp is metadata-leak protection, not chronology. If we later need it (e.g., for relay-ordering heuristics), add `wrapCreatedAt?: number` with a SHOULD-document-the-footgun note. Default-privacy posture matches the v0.28.0 resource-sidecar default-OFF precedent |
| Seal pubkey surface | The kind-13 seal has a `pubkey` field = real sender (same as rumor pubkey per MUST). Post-unwrap, it's redundant with `sender` / `rumor.pubkey` and serves no napplet purpose | LOW (to leave out) | **Recommendation: do NOT surface.** Post-validation it's redundant; pre-validation is a shell concern. Keep it out to keep the API honest — the spec-mandated impersonation check (`seal.pubkey === rumor.pubkey`) is the shell's job; the napplet just gets the verified result |
| Sender profile prefetch sidecar | Like the `resources?: ResourceSidecarEntry[]` sidecar added to `relay.event` in v0.28.0: shell pre-resolves the sender's kind-0 metadata + avatar so the napplet can render a chat bubble with zero round-trip. Would be `senderProfile?: NostrEvent` or similar | MEDIUM-HIGH | **Recommendation: DEFER to future milestone.** Valuable but orthogonal — every chat-like napplet needs sender-profile data, but solving that properly likely requires NUB-IDENTITY integration and a privacy-default-OFF decision (pre-fetching profiles mirrors the resource-sidecar privacy concern). Not a blocker for the core decrypt surface. Pattern is already established (sidecar on `RelayEventMessage`), so adding it later is additive, not breaking |
| Batched-consent hint (`consentHint?: 'single-prompt' \| 'per-event'`) | Signal to the shell UI how the napplet expects consent to be batched. Shell can interpret as "trust this subscription's lifetime" vs "prompt per rumor." **Only a hint** — shell owns the actual UX per NUB scope boundary | LOW | **Recommendation: defer.** Adds surface for something the shell should decide based on its own UX + user trust-level, not per-napplet preference. The NUB-IDENTITY and NUB-RELAY precedents don't have hint fields; don't introduce the pattern here without stronger signal |
| Per-rumor decrypt fan-out for `unwrap: 'direct'` with mixed kinds | Some napplets might want to subscribe to kind 4 (legacy) AND kind 1059 (NIP-17) in one subscription. Current shape forces them to open two subscriptions (one `unwrap: 'direct'` + `encryption: 'nip04'`, one `unwrap: 'gift-wrap'`) | MEDIUM | **Recommendation: accept the two-subscription pattern.** The filters + unwrap-mode pair is already a coherent unit; fan-out mixing would require per-event unwrap-mode discrimination on the shell side. Keeping the unwrap mode per-subscription simplifies shell implementation and error semantics. Document as intentional in the spec |
| Rate-limiting / deny-throttling on repeated signer denials | If the user denies consent 5 times, keep asking? Close the subscription? Quiet-skip? | LOW (as spec guidance), HIGH (as normative MUST) | **Recommendation: SHOULD-guidance only in spec.** Shell-side UX concern; spec should document that shells SHOULD avoid prompt-fatigue loops but MUST NOT silently emit plaintext without consent. The `.error` channel with `signer-denied` reason gives shells a reporting path; policy is theirs |

### Anti-Features (Explicitly Out of Scope)

Features that look good on the surface but either belong elsewhere or actively harm the isolation model.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Rumor re-broadcast via `relay.subscribeEncrypted.rebroadcast` | "Forward this DM to another recipient" looks useful for chat UIs with forward-message buttons | Re-encrypts the rumor to a new recipient, which is a **send** operation. Belongs on the send side via `relay.publishEncrypted`, not the receive side. Mixing the two would bloat the encrypted surface and conflate read/write capability | Napplet calls `relay.publishEncrypted` with the rumor's content + new recipient. Two ops, one surface each |
| Rumor signing via shell | Rumors are unsigned by NIP-59 definition. But a napplet that wants to "save my draft" might ask the shell to sign the rumor into a real event | Signing is **exactly** what NIP-5D removed in v0.24.0. Re-introducing rumor-signing re-opens the signer surface the protocol worked to close. If the napplet wants to save a draft, it uses NUB-STORAGE | Use NUB-STORAGE for drafts. Use `relay.publishEncrypted` for sending. Rumor is a **received-plaintext** artifact, never outbound |
| Reply-composition helper (`composeReply(rumor) → EventTemplate`) | "It'd be so nice if the SDK just gave me a reply template with `e` / `p` tags pre-populated" | This is **napplet-author ergonomics**, not a protocol concern. Hard-coding NIP-17 reply conventions in the NUB surface locks the spec to today's chat patterns; every protocol update (new tag conventions, thread models, etc.) would need a NUB amendment. Shell can't validate helpers — they're pure napplet-side logic | Napplet-side helper in user-land, or a separate community library. The NUB surface stays protocol-primitive |
| Rumor content auto-rendering / markdown parsing / link preview | "Chat napplets all need this, just build it in" | Rendering is the napplet's job; napplets have different content policies (markdown? BIP-21? nostr:// links? embeds?). Building render logic into the SDK fragments the surface and forces opinions | Napplet-author concern. Ship `content` as a string; let the napplet render |
| Per-event `identity.decrypt` primitive | Could expose a lower-level decrypt so advanced napplets do their own unwrap | Option B from SEED-002, explicitly de-prioritized. Re-exposes the per-event round-trip cost (N decrypts = N signer prompts without centralized batching), loses the gift-wrap unwrap factoring, and fragments the surface. Available as a future lower-level primitive if a non-chat use case emerges, but **not** in v0.29.0 | `relay.subscribeEncrypted` handles the common case; defer `identity.decrypt` to a later milestone with a concrete use case |
| Exposing raw ciphertext alongside rumor | "Let the napplet decide when to decrypt" | Defeats the entire point — napplet can't decrypt (no signer access), so raw ciphertext is useless. Surfacing it is just protocol noise and an invitation to `window.nostr.nip44.decrypt` footguns | Shell either delivers decrypted rumor or `.error` with reason; no middle ground |
| Cross-subscription rumor cache / history backfill | "Re-deliver the last N rumors when a new subscription opens" | State management is a shell concern. The wire surface is stream-oriented; if a napplet wants history it re-subscribes with a higher `limit` and lets the relay deliver stored events. Caching is the shell's choice | Napplet uses filter `limit` parameter; shell decides whether to satisfy from cache or fan out to relays |
| NIP-07 `all_frames` detection and warning via shell | "Shell should warn napplets when it detects a NIP-07 extension is leaking" | Shells can't reliably detect content-script presence — that's the whole point of the leak. Even if they could, warning is UX, not protocol | Document the leak in NIP-5D Security Considerations as a **known non-mitigation**. Recommend (not require) that strict-CSP shells consider browser-level countermeasures out-of-band |
| Implicit kind 10050 resolution (auto-discover receive relays) | "Shell should auto-fetch the user's kind 10050 and subscribe to those relays" | Yes — but that's a shell implementation detail of its relay pool, not a wire-surface feature. The NUB surface takes filters + optional target relay; relay selection is below that line | Document in shell-implementation guidance that shells SHOULD honor the user's kind 10050 when opening NIP-17 subscriptions. Not a wire-surface field |

## Feature Dependencies

```
relay.subscribeEncrypted request envelope
    ├──requires──> RelaySubscribeEncryptedMessage type (new discriminated-union variant)
    ├──requires──> rumorKinds?: number[] OR filters [kinds: [1059]] convention
    └──produces──> one of:
                    ├── .event (with rumor + sender)
                    │       └──requires──> Rumor type re-export from @napplet/core
                    │                        (already present via nostr-tools conventions)
                    ├── .eose
                    ├── .closed (subscription teardown)
                    └── .error (per-event or per-sub, reason-coded)

relay.subscribeEncrypted.event
    ├──shell MUST verify──> outer wrap signature (kind 1059)
    ├──shell MUST decrypt──> NIP-44 layer 1 (wrap → seal)
    ├──shell MUST verify──> seal signature (kind 13)
    ├──shell MUST decrypt──> NIP-44 layer 2 (seal → rumor)
    ├──shell MUST check──> seal.pubkey === rumor.pubkey (NIP-17 impersonation MUST)
    └──shell MUST compute──> rumor.id = hash(serialized rumor, sig-less)
         └──then──> deliver as .event envelope

SDK helper subscribeEncrypted()
    └──requires──> request envelope + all result envelopes registered
                   in @napplet/nub/relay shim routing

NUB-RELAY spec amendment (napplet/nubs)
    ├──requires──> message catalog for subscribeEncrypted family
    ├──requires──> conformance table (which encryption modes / unwrap modes MUST be supported)
    ├──requires──> security considerations section (NIP-07 leak, impersonation MUST, time-leak SHOULD)
    └──requires──> public-repo hygiene sweep (no @napplet/* or downstream-shell refs)

NIP-5D Security Considerations amendment
    ├──adds subsection──> "NIP-07 extension content-script leak"
    ├──references──> subscribeEncrypted as spec-legal path
    └──references──> existing Browser-Enforced Resource Isolation subsection
                     (does not replace — complements)
```

### Dependency Notes

- **`rumorKinds` vs `filters[0].kinds`:** Two ways to express "I only want kind 14 rumors." The outer filter is always `{ kinds: [1059], "#p": [myPubkey], ... }` (that's what's on the relay). The rumor kind is inside the encrypted payload, so filtering happens **post-decrypt** on the shell side. Recommend `rumorKinds?` as a distinct field to make this unambiguous — conflating it with `filters.kinds` would mislead napplet authors into thinking they can pre-filter on the relay.
- **Rumor type dependency:** `Rumor = UnsignedEvent & { id: string }` is nostr-tools convention. `@napplet/core` already exports `UnsignedEvent`; export or re-export `Rumor` alongside `NostrEvent` to keep napplet-author imports clean.
- **`relay.close` reuse vs new close message:** Reusing `relay.close` is the right call — subId space is unified, and the shim already dispatches on subId. Document explicitly in the NUB amendment: *"To close an encrypted subscription, send `relay.close` with the same `subId` used in `relay.subscribeEncrypted`."*
- **Impersonation check is non-negotiable:** NIP-17 states the MUST explicitly: *"Clients MUST verify if pubkey of the `kind:13` is the same pubkey on the `kind:14`, otherwise any sender can impersonate others by simply changing the pubkey on `kind:14`."* The shell's `.error` envelope with reason `'impersonation'` is the wire surface for failing this check. **Napplet never re-verifies** — it trusts the shell.
- **`unwrap: 'direct'` without kind filter:** If a napplet uses `unwrap: 'direct'` with `encryption: 'nip04'` and filter `{ kinds: [4] }`, that's legacy NIP-04 DM reception. Keep this mode working so napplets can support users who haven't migrated to NIP-17 — but the spec SHOULD recommend `'gift-wrap'` + kind 1059 as the modern path.

## MVP Definition

### Launch With (v0.29.0)

The minimum surface required to close the SEED-002 gap. Matches the Table Stakes list above.

- [ ] `RelaySubscribeEncryptedMessage` request type — new discriminated-union variant
- [ ] `RelaySubscribeEncryptedEventMessage` result type with `{ subId, rumor, sender, wrapId? }`
- [ ] `RelaySubscribeEncryptedEoseMessage` — `{ subId }`
- [ ] `RelaySubscribeEncryptedClosedMessage` — `{ subId, reason? }`
- [ ] `RelaySubscribeEncryptedErrorMessage` — `{ subId, eventId?, reason, message? }` with reason-code vocabulary
- [ ] `encryption?: 'nip44' | 'nip04'` param, default `'nip44'`
- [ ] `unwrap?: 'gift-wrap' | 'direct'` param, default `'gift-wrap'`
- [ ] `rumorKinds?: number[]` param (recommended) — shell-side post-decrypt kind filter
- [ ] Optional `wrapId?: string` on `.event` envelope for outer-wrap id access
- [ ] SDK helper `subscribeEncrypted(filters, opts)` returning `{ close(): void }` matching existing `subscribe()` ergonomics
- [ ] Reuse of `relay.close` for teardown (documented in spec)
- [ ] Discriminated-union updates to `RelayOutboundMessage` / `RelayInboundMessage`
- [ ] NUB-RELAY spec amendment PR on `napplet/nubs` — message catalog + conformance table + security considerations + impersonation MUST + wrap-time SHOULD-not-surface
- [ ] NIP-5D Security Considerations amendment — NIP-07 `all_frames` leak subsection referencing `relay.subscribeEncrypted` as spec-legal path

### Add After Validation (v0.30.x+)

Differentiator items that shouldn't block v0.29.0 but have clear trigger conditions.

- [ ] Sender profile prefetch sidecar on `.event` — trigger: real-world chat napplet reports round-trip latency as a DX problem
- [ ] Consent hint field — trigger: shell implementations report diverging UX and spec guidance would reduce fragmentation
- [ ] Wrap `created_at` surface with footgun-SHOULD — trigger: a concrete use case needs it (relay-order debugging, storage-ordering heuristics)
- [ ] Rate-limit / throttle guidance as normative SHOULD — trigger: field reports of signer-prompt-fatigue anti-patterns

### Future Consideration (v0.31+)

- [ ] `identity.decrypt` as lower-level primitive — trigger: non-chat use case that legitimately needs per-event decrypt without the subscription abstraction (e.g., NIP-46 bunker coordination? NIP-28 channel ACLs?)
- [ ] Seal/wrap introspection fields for debugging — trigger: persistent interop issues across shells require wire-surface observability
- [ ] Cross-NUB composition with NUB-IDENTITY for auto-populated sender profile on DM rumors — trigger: NUB-IDENTITY amendment for profile-prefetch pattern

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Request envelope + 4 result envelopes | HIGH | LOW | P1 |
| `encryption` / `unwrap` params with defaults | HIGH | LOW | P1 |
| SDK helper mirroring `subscribe()` | HIGH | LOW | P1 |
| NUB-RELAY spec amendment (public repo) | HIGH | MEDIUM | P1 |
| NIP-5D Security Considerations amendment | HIGH | LOW-MEDIUM | P1 |
| `rumorKinds?` post-decrypt filter | MEDIUM-HIGH | LOW | P1 (recommended) |
| `wrapId?` optional on `.event` | MEDIUM | LOW | P1 (include — trivial cost) |
| `.error` reason-code vocabulary | HIGH | LOW | P1 |
| `relay.close` reuse (documented) | HIGH | TRIVIAL | P1 |
| Seal pubkey surface | LOW | LOW | P3 (keep out — redundant) |
| Wrap `created_at` surface | LOW | LOW | P3 (keep out — privacy footgun) |
| Sender profile prefetch sidecar | MEDIUM | MEDIUM-HIGH | P2 |
| Consent hint | LOW | LOW | P3 |
| `identity.decrypt` primitive | LOW (now) | MEDIUM | P3 (future milestone) |
| Rate-limit guidance as SHOULD | MEDIUM | LOW (spec only) | P2 |

**Priority key:**
- P1: Must ship in v0.29.0 — part of the core surface
- P2: Should ship if time permits, else clear deferral note in PROJECT.md future work
- P3: Future-consideration — document decision but don't ship

## Cross-Client Behavior Analysis (UX Sanity Check, Not Prescriptive)

NUB scope boundary: shell UX is a shell concern. This table exists only to confirm that the wire surface **doesn't preclude** any reasonable UX. Shells can implement any of these patterns on top of the `relay.subscribeEncrypted` wire surface without the NUB needing to know.

| UX Pattern | How It Works | Wire Surface Implication |
|------------|--------------|--------------------------|
| **Trust-subscription-lifetime consent** (Amethyst, 0xchat) | User approves once when opening a chat; shell batches signer calls through NIP-46 bunker for the subscription's lifetime | Envelope doesn't care; shell decides when to prompt. `.error` with `signer-denied` if user revokes mid-stream |
| **Per-event consent** (some NIP-07 extensions by default) | Browser extension prompts per `nip44.decrypt` call unless user ticks "don't ask again" | Same wire surface — just slower. Napplet doesn't see per-event latency as a distinct signal; events just arrive later |
| **Pre-unlock / background decrypt** (NoStrudel v0.45.0 reported pattern) | On app load, shell opens a long-lived subscription for `kind: 1059, #p: me` and decrypts as events arrive; user-visible chat list is populated opportunistically | Wire surface supports this natively — napplet just keeps its subscription open; shell batches however it wants |
| **Relay-list gated delivery** (NIP-17 kind 10050) | Shell reads user's kind 10050 DM-relay preference; only opens subscriptions on those relays | Encapsulated in shell's relay pool; wire surface takes optional `relay?` field if napplet has a preference but doesn't mandate |
| **Hybrid NIP-04 + NIP-17 inbox** (Coracle, Damus reported) | Display legacy kind-4 DMs alongside NIP-17 unwrapped rumors | Napplet opens TWO subscriptions: one `unwrap: 'gift-wrap'` for kind 1059, one `unwrap: 'direct' + encryption: 'nip04'` for kind 4. Wire surface handles both modes cleanly |

**Key UX takeaway for spec authors:** The `.error` channel with reason codes is what enables all these patterns. Without distinct reason codes (`signer-denied` vs `decrypt-failed` vs `impersonation` vs `policy-denied`), shells lose the ability to communicate *why* a rumor didn't arrive, and napplets lose the ability to render appropriate UI states (retry prompt? silent skip? block sender?).

## Cross-NUB Composition Notes

Per v0.28.0's `ResourceSidecarEntry` precedent on `RelayEventMessage`, cross-NUB type composition is an established pattern in this repo (NUB-RESOURCE owned the type; NUB-RELAY borrowed it via type-only import).

For v0.29.0, the `.event` envelope is self-contained (owns `rumor`, `sender`, optional `wrapId`). Potential future cross-NUB composition points:

- **NUB-IDENTITY profile sidecar** — pre-populated sender profile to save an `identity.getProfile()` round-trip per rumor. Follows the exact same borrow-don't-own pattern. **Deferred to a future milestone** per "differentiators" table.
- **NUB-RESOURCE attachment sidecar** — kind-15 file rumors reference encrypted attachment URLs (imeta tags with decryption-key). Pre-resolving the attachment bytes could work like the v0.28.0 avatar sidecar. **Deferred** — kind-15 file rumors are beyond MVP scope.

These compose *on top of* the MVP wire surface without requiring breaking changes — the pattern is purely additive optional fields.

## Sources

**Authoritative (HIGH confidence):**
- [NIP-17 — Private Direct Messages](https://github.com/nostr-protocol/nips/blob/master/17.md) — kind 14/15 conventions, impersonation MUST, kind 10050 relay list, three-layer gift-wrap structure, ±2-day created_at randomization
- [NIP-59 — Gift Wrap](https://github.com/nostr-protocol/nips/blob/master/59.md) — rumor/seal/wrap definitions, ephemeral keypair for wrap, any-kind rumors, time-analysis mitigation
- [NIP-44 — v2 Encryption](https://github.com/nostr-protocol/nips/blob/master/44.md) — ECDH + HKDF + ChaCha20 + HMAC, 65535-byte max plaintext, conversation-key derivation
- [NIP-07 — window.nostr Capability](https://github.com/nostr-protocol/nips/blob/master/07.md) — `nip44.encrypt/decrypt` signatures, content-script injection guidance
- [NIP-01 — Protocol Basic Flow](https://github.com/nostr-protocol/nips/blob/master/01.md) — underlying REQ/EVENT/CLOSE semantics (referenced indirectly via `relay.subscribe` precedent)
- [nostr-tools nip59.ts source](https://github.com/nbd-wtf/nostr-tools/blob/master/nip59.ts) — canonical `Rumor`, `wrapEvent`, `unwrapEvent`, `unwrapManyEvents` signatures
- [nostr-tools kinds.ts source](https://github.com/nbd-wtf/nostr-tools/blob/master/kinds.ts) — `Seal = 13`, `GiftWrap = 1059`, `PrivateDirectMessage = 14` constants

**In-repo precedent (HIGH confidence — authoritative for this milestone):**
- `packages/nub/src/relay/types.ts:136` — `RelayPublishEncryptedMessage` send-side analog
- `packages/nub/src/relay/types.ts:162` — `RelayPublishEncryptedResultMessage` result envelope shape
- `packages/nub/src/relay/types.ts:192` — `RelayEventMessage` with `ResourceSidecarEntry` cross-NUB borrow pattern
- `specs/NIP-5D.md` — transport spec with v0.28.0 Browser-Enforced Resource Isolation subsection as the pattern for the new security-considerations amendment
- `.planning/seeds/SEED-002-receive-side-decrypt-surface.md` — locked direction (Option A) and scope boundaries
- `PROJECT.md` Key Decisions — "relay.publishEncrypted added, NUB-RELAY updated" (v0.24.0), "Borrow-don't-own: relay NUB type-only imports `ResourceSidecarEntry`" (v0.28.0)

**Cross-client behavior (MEDIUM confidence — based on release notes and NIP discussions, not source audits):**
- [NoStrudel v0.45.0 announcement (OpenSats blog)](https://opensats.org/blog/advancements-in-nostr-clients) — NIP-17 + NIP-59 gift wrap support, dedicated inbox view
- [Amethyst v0.94.0 release notes](https://github.com/vitorpamplona/amethyst/releases/tag/v0.94.0) — encrypted media on DMs following 0xchat spec; implicit batch-decrypt UX (per screenshots)
- [Amethyst v0.74.3 Private DMs & Group Chats](https://www.nobsbitcoin.com/amethyst-v0-74-3/) — first-mover NIP-17 implementation
- [Welshman (Coracle) NIP-46 signer docs](https://welshman.coracle.social/signer/nip-46.html) — bunker-based remote signing; confirms NIP-46 as the common "batched consent" enabler across modern clients
- [Nostrability DM interop tracker #169](https://github.com/nostrability/nostrability/issues/169) — cross-client NIP-17 compat state
- [Damus NIP-17 metadata leak issue #2815](https://github.com/damus-io/damus/issues/2815) — confirms NIP-17 is the current state-of-the-art target; gives context for why `.error` reason codes matter

**Could not verify (LOW confidence — flagged for discuss-milestone follow-up):**
- Exact batch-consent patterns in Amethyst / 0xchat / Coracle source — release notes mention the feature but don't document the prompt cadence. Claims in the Cross-Client table are structural (these clients could implement any of these patterns on top of the wire surface) rather than prescriptive (this is what they do).
- Whether any existing client prompts per-event vs once-per-subscription is **not** established in public sources; discussing-milestone may want to pin one implementation to confirm the wire surface supports their pattern.

---
*Feature research for: v0.29.0 Receive-Side Decrypt Surface (SEED-002) — Option A `relay.subscribeEncrypted` on NUB-RELAY*
*Researched: 2026-04-23*
