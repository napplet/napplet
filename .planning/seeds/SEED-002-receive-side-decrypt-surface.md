---
id: SEED-002
status: dormant
planted: 2026-04-23
planted_during: v0.28.0 Phase 134 (Verification & Milestone Close) — plan-complete, awaiting execution
trigger_when: Next milestone (v0.29.0) — surface on the first /gsd:new-milestone invocation after v0.28.0 closes
scope: Medium
source_issue: napplet/napplet#3
---

# SEED-002: NIP-5D receive-side NIP-44 decrypt gap — Option A `relay.subscribeEncrypted`

Amend NUB-RELAY so napplets can receive NIP-17 gift-wrapped / NIP-44 encrypted events as plaintext rumors **without** re-introducing signer access to the iframe. Send-side is already covered by `relay.publishEncrypted` (shipped in v0.24.0); this closes the receive-side half.

## Why This Matters

NIP-5D deliberately removed `sign:event` / `sign:nip04` / `sign:nip44` from the capability list — napplets must not touch the user's private key. Send-side is shell-mediated (napplet ships plaintext + recipient, shell encrypts and signs). **Receive-side is a gap:** a napplet subscribing to kind 1059 (NIP-17 gift-wrapped DMs) has no spec-legal way to get plaintext. Two non-options today:

1. Duplicate the user's private key into the napplet → defeats iframe isolation.
2. Call `window.nostr.nip44.decrypt` directly → re-introduces exactly the signer surface NIP-5D forbids.

**The architectural intent is sound; the end-to-end enforcement is leaky in practice.** NIP-07 browser extensions (nos2x, Alby, Flamingo, …) ship content-scripts with `"all_frames": true`, so the browser injects `window.nostr` into every frame — including cross-origin sandboxed napplet iframes. Shell CSP + iframe sandbox flags don't block content scripts; they run in an isolated world granted by the extension manifest. Result: a napplet that calls `window.nostr.nip44.decrypt(…)` succeeds whenever the user has any NIP-07 extension installed, even though the NIP forbids it. Observed in the wild during a downstream shell's Phase 14 UAT — a chat napplet's receive-path leaked a signer permission dialog and gained read access to the user's private DMs.

Until the spec offers a shell-mediated receive path, every chat-like napplet has to either stay broken (display ciphertext) or silently break the isolation guarantee. The v0.28.0 strict-CSP work raises the attacker's bar for exfiltration, but does not address the NIP-07 extension leak — this seed does.

## When to Surface

**Trigger:** Next milestone (v0.29.0) — this is the chosen v0.29.0 scope, captured at 2026-04-23 alongside the decision to close v0.28.0 first.

Surface during `/gsd:new-milestone` when:
- The user is starting v0.29.0 (first new milestone after v0.28.0 ships), OR
- A milestone scope mentions: receive-side decrypt, NIP-17, NIP-59, gift-wrap, chat napplets, DMs, or NIP-07 isolation leak, OR
- A milestone touches NUB-RELAY or NUB-IDENTITY encryption surfaces

## Chosen Direction (locked 2026-04-23)

**Option A — `relay.subscribeEncrypted` on NUB-RELAY** (preferred per issue #3).

Parallel to `relay.publishEncrypted`. Napplet requests a subscription; shell opens the underlying relay subscription internally, invokes the user's signer (NIP-07 / NIP-46) for each incoming event, and dispatches the **unwrapped rumor** — never ciphertext, never the signer surface — back to the napplet.

```ts
// @napplet/nub/relay — proposed addition
export interface RelaySubscribeEncryptedMessage {
  type: 'relay.subscribeEncrypted';
  id: string;
  filters: Filter[];
  encryption?: 'nip44' | 'nip04';   // default 'nip44'
  unwrap?: 'gift-wrap' | 'direct';  // NIP-17 two-step vs single-hop NIP-44
}

// Shell → napplet:
// { type: 'relay.subscribeEncrypted.event', id, rumor, sender }
// { type: 'relay.subscribeEncrypted.eose', id }
// { type: 'relay.subscribeEncrypted.closed', id, reason? }
```

**Why Option A over Option B (`identity.decrypt` per-event):**
- Centralizes NIP-17 / NIP-59 gift-wrap unwrap logic in one place (shell) — every chat-like napplet doesn't re-implement it.
- Avoids per-event postMessage round-trip cost (one subscription vs. N decrypts).
- Napplet orchestration is trivial (subscribe with filter → receive rumors) and mirrors the existing `relay.subscribe` shape.
- Option B stays available as a lower-level primitive if a later use case needs it, but is not the primary surface.

## Scope Estimate

**Medium** — 2–3 phases, following the NUB-amendment milestone pattern established by v0.22–v0.25:

Likely phase shape (subject to /gsd:discuss-milestone refinement):

1. **Spec amendment PR on napplet/nubs** — edit `NUB-RELAY.md`: add `relay.subscribeEncrypted` (+ `.event` / `.eose` / `.closed` / `.error` result envelopes), conformance table, security considerations (signer never exposed; shell MUST validate rumor provenance against outer wrap signature), interaction with NIP-07 isolation leak.
2. **Type additions in `@napplet/nub/relay`** — new message type literals, discriminated unions, SDK helper `subscribeEncrypted(filters, { encryption, unwrap })` returning teardown `{ close(): void }`. Matches existing `subscribe()` ergonomics.
3. **NIP-5D Security Considerations amendment** — document the NIP-07 `all_frames: true` leak explicitly as a known non-mitigation of the iframe sandbox; point to `relay.subscribeEncrypted` as the spec-legal path; consider whether strict-CSP (v0.28.0 `perm:strict-csp`) should RECOMMEND blocking `window.nostr` at the frame-extension boundary (spec guidance only; enforcement is a browser/extension concern).
4. *(optional / deferred)* — `identity.decrypt` as a lower-level primitive if an identity-NUB use case emerges; not required for this milestone.

**Not in scope for this seed:**
- Shell implementation of the subscribe/unwrap logic (downstream — tracked at `kehto#9` per issue #3).
- Demo napplets exercising NIP-17 DMs (shell-repo concern like v0.28.0 DEMO-01).
- NIP-07 extension hardening itself (browser/extension ecosystem concern; spec can only document and recommend).

## Breadcrumbs

**In-repo — existing send-side precedent to mirror:**
- `packages/nub/src/relay/types.ts:137` — `RelayPublishEncryptedMessage` (the send-side analog this seed mirrors on the receive side)
- `packages/nub/src/relay/types.ts:163` — `RelayPublishEncryptedResultMessage`
- `packages/nub/src/relay/shim.ts` — relay shim routing; new receive-side handler will live here next to `handleMessage`'s `relay.event` branch
- `packages/nub/src/relay/sdk.ts` — SDK convenience wrappers; add `subscribeEncrypted()` alongside `subscribe()`
- `packages/nub/src/relay/index.ts` — barrel re-export

**In-repo — spec surfaces touched:**
- `specs/NIP-5D.md` — transport spec; already documents "no signer access in napplets"; add Security Considerations amendment referencing the NIP-07 leak + Option A as the spec-legal path

**External — PR destination:**
- `~/Develop/nubs/` (public napplet/nubs clone) — NUB-RELAY.md amendment lands as a new branch / PR here; `napplet/napplet` issue #3 tracks the gap upstream because `napplet/nubs` has issues disabled

**Downstream tracker (shell-impl, not this repo):**
- `kehto#9` — shell implementation of `relay.subscribeEncrypted` waits on this upstream surface

**Related prior decisions (from PROJECT.md Key Decisions):**
- "Replace NIP-01 arrays with JSON envelope" (v0.16.0) — wire shape for new message types follows `{ type: "domain.action", ...payload }` convention
- "NUBs own protocol messages, NIP-5D is transport-only" (v0.16.0) — amendment is on NUB-RELAY, not NIP-5D core
- "window.nostr removed, nub-signer deleted" (v0.24.0) — removed the send-side signer surface; this seed closes the matching receive-side hole
- "relay.publishEncrypted added, NUB-RELAY updated" (v0.24.0) — direct precedent for the message shape and negotiation pattern

## Notes

- **Do not batch with v0.28.0.** v0.28.0 scope is resource isolation (strict CSP + resource.bytes). This is a separate concern — the NIP-07 leak is orthogonal to resource fetching, and the fix is a spec amendment + types, not a CSP-posture change. Keep milestones focused.
- **Public-repo hygiene:** per `feedback_no_private_refs_commits` memory, the spec amendment PR on `napplet/nubs` must not reference `@napplet/*` packages or `kehto` / `hyprgate` by name. Kept here for internal context only.
- **NUB scope boundary:** per `feedback_nub_scope_boundary` memory, the NUB spec defines the protocol surface and potentialities; UX of shell-side consent, per-event signer prompts, signer batching, etc. is a shell concern and stays out of the spec.
- **The issue body includes downstream workaround context** (stripping `window.nostr.nip44.decrypt` call path in the downstream chat napplet so DMs display as ciphertext until this ships). That's the diary, not the map — don't copy it into the spec PR.
