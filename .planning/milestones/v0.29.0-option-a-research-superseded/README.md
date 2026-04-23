# Superseded Option-A Research (v0.29.0)

**Status:** SUPERSEDED — direction pivoted 2026-04-23 before requirements lock.

These 4 research files were written against SEED-002's original "Option A locked" direction: add `relay.subscribeEncrypted` (+ `.event` / `.eose` / `.closed` / `.error` result envelopes) to NUB-RELAY as a parallel-subscription mirror of `relay.publishEncrypted`.

That direction was rejected after user review once the napplet/nubs state on 2026-04-23 was consulted:

- napplet/nubs PR #15 (merged 2026-04-21) removed `window.nostr` at the protocol level — napplets produce cleartext only
- napplet/nubs PRs #16/#17/#18 (OPEN/DRAFT) introduced the **NUB-CLASS authority framework** with two concrete postures: NUB-CLASS-1 (`connect-src 'none'`, zero direct network egress) and NUB-CLASS-2 (`connect-src <granted-origins>`, user-approved direct-origin access)

Plaintext decrypt is only safe where the frame has no direct network egress (NUB-CLASS-1). A CLASS-2 napplet receiving plaintext can silently POST DMs to approved origins with zero shell visibility. An ambient wire-level `relay.subscribeEncrypted` cannot express per-class gating cleanly (the gate is about the napplet's posture, not the subscription's shape).

The replacement direction is `identity.decrypt(event) → Promise<Rumor>` on NUB-IDENTITY, **gated shell-side** to napplets assigned `class: 1`.

## What survives as substrate

The NIP-17 / NIP-44 / NIP-59 mechanics in these files are still correct:

- Unwrap order (outer wrap → seal decrypt → rumor; sig-verify outer, impersonation check seal-pubkey-vs-rumor-pubkey)
- Rumor type (`UnsignedEvent & { id: string }`, nostr-tools canonical)
- Anti-features list (rumor re-broadcast, rumor signing, reply-composition helpers)
- NIP-07 extension `all_frames: true` leak analysis
- Public-repo hygiene rules
- NUB scope-boundary discipline

## What is wrong

Wire-surface recommendations are wire-WRONG for the pivoted direction:

- `RelaySubscribeEncryptedMessage` (+ 4–5 siblings) — replaced by `IdentityDecryptMessage` (+ result + error) on NUB-IDENTITY, not NUB-RELAY
- `subscribeEncrypted(filters, opts, onEvent, onEose)` SDK helper — replaced by `decrypt(event)` one-shot Promise helper
- Namespace home `packages/nub/src/relay/*` — replaced by `packages/nub/src/identity/*`
- Central shim/sdk integration surgical-edit pattern — same template but targets identity namespace
- `shell.supports('relay:encrypted-subscribe')` / capability-split analysis — replaced by implicit `nub:identity` advertisement plus class-gating enforcement; no new capability string
- Missing: class-gating MUST row; missing: CSP `report-to` shell-enforced detection; missing: NUB-CLASS-1 citation discipline

Requirements drafters: read these files for substrate only; do NOT carry wire-surface recommendations forward.

## Files

- `STACK.md` — nostr-tools version + Filter compatibility + napplet-side dependency stance (still correct; no stack change for pivoted direction either)
- `FEATURES.md` — NIP-17 mechanics, feature ladder (table-stakes / differentiators / anti-features); wire-shape sections are stale
- `ARCHITECTURE.md` — integration-point mapping; targets wrong files (`packages/nub/src/relay/*` instead of `packages/nub/src/identity/*`). Replace path references; the 4-surgical-edit pattern description still applies
- `PITFALLS.md` — 20-pitfall catalog; NIP-07 leak / public-repo / scope-boundary / type-build categories still apply. Spec-design pitfalls targeting NUB-RELAY line 223 are stale — NUB-RELAY ambient-decrypt is not the v0.29.0 concern
