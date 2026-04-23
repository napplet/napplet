# Pitfalls Research — v0.29.0 Receive-Side Decrypt Surface

**Domain:** NUB amendment + types + public-spec-repo coordination (adding `relay.subscribeEncrypted` to NUB-RELAY)
**Researched:** 2026-04-23
**Confidence:** HIGH (grounded in SEED-002, existing `relay.publishEncrypted` v0.24.0 precedent, `NUB-RELAY.md` on `~/Develop/nubs:nub-relay`, and v0.28.0 `ResourceSidecarEntry` cross-NUB borrow pattern)

All pitfalls below are specific to **adding a receive-side decrypt surface that mirrors an existing send-side surface** in a public-spec / private-impl ecosystem. Warning signs are grep-verifiable or type-system-verifiable where possible.

Phase numbering assumes the 3-phase shape from SEED-002:
- **Phase 135 — Spec Amendment** (`napplet/nubs` NUB-RELAY.md on a new branch)
- **Phase 136 — Types & SDK** (`@napplet/nub/relay` additions in this monorepo)
- **Phase 137 — NIP-5D Security Considerations + docs + VER gates**

---

## Critical Pitfalls

### Pitfall 1: Collision between existing `relay.event` auto-decrypt MUST and new `subscribeEncrypted`

**What goes wrong:**
The current `NUB-RELAY.md` (nubs/nub-relay branch, line 223) already says: *"The shell MUST decrypt incoming encrypted events (NIP-04/NIP-44) before delivering them to the napplet via `relay.event`."* If `relay.subscribeEncrypted` is added without reconciling this, the spec claims two contradictory truths simultaneously — that encrypted events arrive plaintext on any `relay.subscribe`, AND that a separate `relay.subscribeEncrypted` surface is required to receive plaintext. Implementors read both MUSTs, implement neither correctly, and the napplet sees ciphertext on `relay.event` while `subscribeEncrypted` silently returns nothing.

**Why it happens:**
The v0.24.0 NUB-RELAY update (when `relay.publishEncrypted` shipped) quietly added the "shell MUST decrypt on the way in" line as a plausible-sounding symmetry without thinking through NIP-17 gift-wrap (kind 1059) and the signer-access / consent gap. That line is now load-bearing for spec-legality of existing chat napplets, but it's also the thing that made receive-side feel "done" when it wasn't — it papers over the very leak SEED-002 exists to close.

**How to avoid:**
Phase 135 MUST either (a) remove the line entirely and replace it with "encrypted events delivered on `relay.subscribe` remain ciphertext; use `relay.subscribeEncrypted` to receive plaintext rumors", or (b) narrow the MUST to legacy NIP-04 kind 4 only and route NIP-17/NIP-59 through `subscribeEncrypted`. Pick (a) — SEED-002's NIP-07 leak argument applies equally to kind 4 auto-decrypt, and keeping two paths is a perennial footgun. Lock this as an explicit Key Decision in PROJECT.md.

**Warning signs:**
- Spec amendment adds `relay.subscribeEncrypted` rows but leaves line 223 untouched — grep the amendment diff for `shell MUST decrypt incoming` and verify it was edited.
- Conformance table lists both "auto-decrypt on relay.event" AND "subscribeEncrypted" without a precedence rule.
- Phase 135 plan does not name line 223 as a target edit.

**Phase to address:** Phase 135 (Spec Amendment). Must be resolved before any types are added in Phase 136.

---

### Pitfall 2: Outer wrap `created_at` leaked to napplet in the rumor envelope

**What goes wrong:**
NIP-59 gift-wrap intentionally randomizes the outer wrap's `created_at` by ±2 days so relay-layer timing analysis cannot correlate outer envelopes to the actual send-time of the inner rumor. If the shell's `relay.subscribeEncrypted.event` envelope exposes `outer` or `wrap` alongside `rumor`, or if it sets `rumor.created_at` from the wrap's `created_at` instead of the rumor's own `created_at`, the napplet now has both values — which undoes the ±2-day privacy floor for any napplet author who logs timestamps.

**Why it happens:**
Implementors think "returning both is more information; napplet can ignore what it doesn't need." The whole point of gift-wrap's random offset is that the inner timestamp is the *only* one the recipient should ever see. Leaking the outer is a backward-compat-safe-looking change with a silent privacy cost.

**How to avoid:**
- The `relay.subscribeEncrypted.event` envelope MUST carry the unwrapped rumor (kind, content, tags, created_at, pubkey) and an explicit `sender` pubkey — and nothing else about the wrap.
- Explicit spec text: **"Shells MUST NOT expose the outer wrap's `created_at`, `id`, `sig`, or `pubkey` to the napplet. Only the rumor and the verified sender are delivered."**
- Conformance table row: `MUST-05 (privacy): rumor envelope omits outer wrap metadata`.

**Warning signs:**
- Envelope type has fields like `wrap?`, `outerCreatedAt?`, `wrapId?`, `envelope?` on `RelaySubscribeEncryptedEventMessage`.
- JSDoc example shows both `event.created_at` and `rumor.created_at`.
- Shim test fixture includes a wrap object.

**Phase to address:** Phase 135 (spec MUST) + Phase 136 (type definition prevents carrying wrap by shape).

---

### Pitfall 3: Shell skips outer-wrap signature verification before unwrap

**What goes wrong:**
An attacker publishes a kind 1059 wrap with an invalid signature, containing a seal that claims to be from `alice`. If the shell unwraps without verifying the outer wrap signature first, the napplet receives `{ rumor: <attacker content>, sender: <alice's pubkey> }` — a successful impersonation attack that looks exactly like a legitimate message from Alice.

**Why it happens:**
The NIP-59 decrypt path is a sequence of operations; it's tempting to assume relays already validate signatures and the shell can skip ahead to the NIP-44 unwrap. Relays don't uniformly validate sigs. The shell is the trust anchor here.

**How to avoid:**
- Spec MUST: *"Shells MUST validate the outer wrap's Schnorr signature before attempting NIP-44 decryption. Wraps with invalid signatures MUST be dropped silently and MUST NOT produce a `relay.subscribeEncrypted.event` envelope."*
- Spec MUST: *"Shells MUST verify `rumor.pubkey === seal.author` (NIP-17 rumor-signer confusion attack). Rumors where the seal claims a different author than the rumor signer MUST be dropped."*
- Conformance table rows: `MUST-01: outer wrap sig validation`, `MUST-02: rumor–seal author binding`.

**Warning signs:**
- Spec says "shell unwraps the gift-wrap" without the word "validate" or "verify".
- No conformance row for signature checks.
- Example prose describes `subscribeEncrypted` as a "decrypt pipeline" rather than a "verify-then-decrypt pipeline".

**Phase to address:** Phase 135 (spec MUST rows). Shell-side enforcement is downstream per SEED-002 out-of-scope, but the spec **must** mandate it.

---

### Pitfall 4: NIP-07 extension leak misrepresented as mitigable by strict-CSP or sandbox

**What goes wrong:**
The Security Considerations amendment claims `perm:strict-csp` or `sandbox="allow-scripts"` mitigates the NIP-07 `all_frames: true` leak. This is false. NIP-07 extensions inject `window.nostr` via `content_scripts` running in an **isolated world** granted by the extension manifest — invisible to page CSP, invisible to iframe sandbox flags, invisible to the shell. A napplet with zero network access and full strict-CSP can still successfully call `window.nostr.nip44.decrypt` if the user has nos2x / Alby / Flamingo installed.

**Why it happens:**
It's tempting to write a clean narrative: "v0.28.0 added strict-CSP; v0.29.0 closes the decrypt gap; together they fully isolate the napplet." That narrative is wrong. Strict-CSP blocks network egress from the page; it does not touch isolated-world script injection. The two defenses are orthogonal.

**How to avoid:**
- NIP-5D Security Considerations amendment MUST state explicitly: *"Browser extensions implementing NIP-07 with `content_scripts.all_frames: true` inject `window.nostr` into the napplet iframe. This injection runs in the extension's isolated world and is **NOT** blocked by the iframe sandbox, the `allow-scripts` posture, strict Content Security Policy, or the `perm:strict-csp` capability. The NIP-5D protocol cannot mandate extension behavior; it can only provide a spec-legal alternative (`relay.subscribeEncrypted`) that napplets SHOULD use instead."*
- Add a second MUST on napplet authors (via documentation only, not enforcement): *"Napplets MUST NOT call `window.nostr.*` methods to decrypt events; they MUST use `relay.subscribeEncrypted`. Shell implementors SHOULD surface `window.nostr` usage as a lint finding during napplet review."*
- Ban from the amendment: phrasings like "strict-CSP blocks window.nostr", "iframe sandbox prevents NIP-07 access", "v0.28.0 closed the extension gap".

**Warning signs:**
- The amendment contains any sentence tying strict-CSP to window.nostr blocking.
- The amendment suggests "shells can remove window.nostr from the iframe" (they cannot — it's content-script-injected after page creation).
- Grep the amendment for "blocks window.nostr" or "prevents nostr injection" — both are wrong.

**Phase to address:** Phase 137 (NIP-5D Security Considerations amendment). This is the whole motivator of SEED-002; it deserves its own subsection with emphasis.

---

### Pitfall 5: Unbounded subscription via empty or overly-broad outer filter

**What goes wrong:**
A napplet sends `relay.subscribeEncrypted` with `filters: [{}]` or `filters: [{ kinds: [1059], limit: 10000 }]`. Under NIP-17, every kind-1059 wrap on every relay the shell connects to matches. The shell tries to decrypt each wrap with the user's key (most will fail silently). The napplet has now triggered potentially thousands of signer invocations, burned decryption CPU, and leaked the user's "attempted decryption" pattern to any monitoring attacker who can correlate timing.

**Why it happens:**
`relay.subscribe` accepts any NIP-01 filter. Reusing that permissive surface for `subscribeEncrypted` without narrowing it is the path of least resistance. Implementors think filter scoping is a shell-side policy concern (it isn't — the spec must set the floor).

**How to avoid:**
- Spec MUST: *"Napplets MUST provide at least one `kinds` constraint in every filter of a `relay.subscribeEncrypted` request. Shells MUST reject requests whose filters omit `kinds` or include `kinds` arrays that would match unencrypted event kinds. Recommended enforced set: `[4, 1059, 1060]` (NIP-04 legacy DM, NIP-17 gift-wrap, NIP-59 seal)."*
- Spec SHOULD: shells enforce a per-napplet concurrent-subscription cap and a per-subscription event-rate cap; exceeding either returns `relay.subscribeEncrypted.error` with `error: 'rate-limited'` or `'too-many-subscriptions'`.
- Do NOT mandate specific rate/cap numbers — that's implementation UX territory (see Pitfall 10).

**Warning signs:**
- Amendment examples show `filters: [{}]` as valid.
- Conformance table has no "kinds-required" row.
- No error vocabulary row for rate-limit or kind-rejection.

**Phase to address:** Phase 135 (MUST row). Phase 136 (type-level: consider `Filter & { kinds: number[] }` narrowed type for the `filters` field, though this may overconstrain at the TS level — document in spec instead).

---

### Pitfall 6: Missing dedicated `.error` envelope; failures overloaded on `.event` or `.closed`

**What goes wrong:**
A signer-consent-denied, wallet-locked, or key-unavailable failure is returned as `relay.subscribeEncrypted.closed` with `reason: 'consent-denied'`. Napplet authors treat `closed` as "subscription ended normally" and show an empty state instead of a retry prompt. Alternatively: failures come back as synthetic `relay.subscribeEncrypted.event` envelopes with `error?: string` fields, and napplet rendering code crashes on the missing rumor field.

**Why it happens:**
The existing `relay.publish.result` uses `ok: false` + `error?: string` on the same envelope type. It's tempting to copy that shape. But subscriptions are streaming — there's no single result envelope to attach ok=false to, so implementors reach for `closed` or overload `event`. Both are wrong.

**How to avoid:**
- Phase 136 MUST define `RelaySubscribeEncryptedErrorMessage` as a distinct wire type: `{ type: 'relay.subscribeEncrypted.error', subId, code, message, recoverable?: boolean }`.
- Specify error codes explicitly in the amendment — at minimum: `consent-denied`, `signer-unavailable`, `decrypt-failed`, `signature-invalid`, `rate-limited`, `too-many-subscriptions`, `unsupported-encryption`, `unsupported-unwrap`. Fixed vocabulary mirrors NUB-RESOURCE's 8-code pattern (v0.28.0).
- `closed` MUST remain reserved for normal-lifecycle end (napplet called close(), shell shutting down, relay disconnected).
- `error` is terminal for the subscription (same shape contract as NUB-RESOURCE); if shell wants to re-attempt after consent, it's a fresh subscription.

**Warning signs:**
- Amendment uses `closed` for failure cases.
- `RelaySubscribeEncryptedEventMessage` has an `error?` field.
- Error strings are free-form prose without a defined vocabulary.
- Grep the amendment for `reason:` vs `code:` — failures should be `code:` on `.error`, `reason:` on `.closed`.

**Phase to address:** Phase 135 (spec error vocabulary) + Phase 136 (type definition).

---

### Pitfall 7: `@napplet/*` / `kehto` / `hyprgate` references leaking into the public `napplet/nubs` amendment

**What goes wrong:**
Phase 135 amendment PR lands on `~/Develop/nubs` (public). It contains any of: `@napplet/nub/relay`, `@napplet/shim`, `@napplet/sdk`, `@napplet/core`, `@napplet/nub-relay` (deprecated name), `kehto#9`, `kehto`, `hyprgate`. The PR exposes the private package naming scheme and the private downstream shell repo to the world. Per memory rules `feedback_no_private_refs_commits`, `feedback_no_implementations`, `feedback_no_kehto_hyprgate`: **zero references. Ever.**

**Why it happens:**
SEED-002 itself contains all these references (legitimately — it's internal). When drafting the amendment, copy-paste from SEED-002 brings the private names along. Also tempting: write "see @napplet/nub/relay for the reference implementation" as a link back — forbidden.

**How to avoid:**
- Draft the amendment in this repo under `.planning/phases/135-*/drafts/NUB-RELAY.md` (matching v0.28.0 Phase 132 pattern). Apply to `~/Develop/nubs` only after grep-gate passes.
- Mandatory pre-push grep gate, all returning 0 matches:
  - `rg -i '@napplet/' ~/Develop/nubs/NUB-RELAY.md`
  - `rg -i 'kehto' ~/Develop/nubs/NUB-RELAY.md`
  - `rg -i 'hyprgate' ~/Develop/nubs/NUB-RELAY.md`
  - `rg -i 'napplet/napplet#' ~/Develop/nubs/NUB-RELAY.md` (issue refs leak repo topology)
- Same grep gate on the commit message and PR body (use `gh pr view --json body,commits` after creation).
- Same grep gate on any new file in `~/Develop/nubs/` (not just NUB-RELAY.md — avoid leaks into changelog, README, side files).

**Warning signs:**
- Any line in the amendment containing `@napplet`.
- Any mention of "the reference implementation at …".
- Implementor lists, changelog entries, "see also" sections mentioning package names.
- Commit message says "per SEED-002 context" — SEED-002 is private; never name it.

**Phase to address:** Phase 135 acceptance gate. Non-negotiable: zero-grep must be part of the phase's VER list, modeled on v0.28.0 Phase 134 `VER-06` (cross-repo zero-grep 0/0/0/0).

---

### Pitfall 8: Amendment narrates the downstream UAT diary ("we found that…") instead of describing the protocol surface

**What goes wrong:**
The spec amendment reads like a postmortem: *"During the chat napplet's UAT we discovered that NIP-07 extensions leak…"*, *"The downstream shell's Phase 14 observed…"*. Two problems: (1) It names a private downstream implicitly (the "downstream shell" phrase is a fingerprint). (2) It's the wrong register entirely — a spec describes the protocol surface, not the history that motivated it.

**Why it happens:**
SEED-002's "Why This Matters" section is written narratively (correctly — it's an internal seed). When drafting amendment prose, the narrative voice carries over.

**How to avoid:**
- Diary lives in SEED-002 and phase plans. The amendment describes the protocol in timeless imperative ("Shells MUST…", "Napplets SHOULD…").
- Ban from the amendment: "during UAT", "we found", "we observed", "in practice", "the downstream shell", "the reference implementation", "it was discovered that".
- Grep gate: `rg -i '(during|we found|we observed|in practice|downstream shell|reference implementation|it was discovered|UAT)' ~/Develop/nubs/NUB-RELAY.md` → 0 matches.

**Warning signs:**
- Past-tense verbs in the amendment body ("NIP-07 extensions leaked", "the napplet gained access").
- First-person plural ("we", "us", "our").
- Any sentence referencing a specific prior milestone or phase by number.

**Phase to address:** Phase 135 authoring + Phase 135 acceptance gate (second grep pass for diary-voice).

---

### Pitfall 9: Amendment prescribes signer consent UX, batching, or per-event prompts

**What goes wrong:**
The amendment says things like *"Shells MUST prompt the user on the first event per subscription"*, *"Shells SHOULD batch signer invocations in windows of 5 seconds"*, *"Shells MUST display a consent modal with sender identity and event preview"*. These are implementation UX decisions — shell policy territory per the `feedback_nub_scope_boundary` rule. Locking them in the spec forces every shell to the same UX, which (a) is not the spec's job and (b) creates upgrade churn when one shell innovates a better UX.

**Why it happens:**
SEED-002 mentions consent UX as a real concern. It's tempting to solve it at the spec layer "once and for all". But NUB specs define protocol surface + potentialities, not UX. v0.28.0 NUB-RESOURCE did the same discipline — it defined the byte-fetching contract and let shells choose their policy (allowlists, rate limits, user UX).

**How to avoid:**
- Amendment states only: shells MAY require user consent; shells MAY batch; shells MAY cache consent decisions; shells MAY display arbitrary UI. None of these are mandated.
- The ONLY MUST on consent behavior is the `consent-denied` error code: if the shell denies (for any reason including UX cancellation), it MUST surface `relay.subscribeEncrypted.error` with `code: 'consent-denied'`.
- Explicitly out-of-scope list in the amendment: consent UX, signer-request batching, per-event prompts, consent caching policy, cross-subscription consent inheritance.

**Warning signs:**
- Amendment contains words: "modal", "prompt", "dialog", "UI", "display", "notify the user", "batch window", "debounce", "throttle".
- Conformance rows mandate UX behaviors rather than wire behaviors.
- Grep: `rg -iw '(modal|prompt|dialog|user interface|UX)' ~/Develop/nubs/NUB-RELAY.md` → 0 matches on new content.

**Phase to address:** Phase 135 authoring discipline + Phase 135 acceptance gate.

---

### Pitfall 10: `identity.decrypt` accidentally re-surfaces in the milestone

**What goes wrong:**
Someone decides *"while we're here, let's also add `identity.decrypt` as a lower-level primitive — it's trivial, and the shell needs decryption anyway"*. Now the milestone has two new encrypted-receive surfaces. Every future chat napplet picks one or the other, fragmenting the ecosystem and re-opening the exact signer-surface gap (an `identity.decrypt` on the identity NUB IS a signer surface — it's `window.nostr.nip44.decrypt` by another name).

**Why it happens:**
Option B from SEED-002 is genuinely a reasonable lower-level primitive. Scope creep finds the easiest path in.

**How to avoid:**
- Phase 135/136/137 plan STATE sections explicitly list `identity.decrypt` under "Explicitly out of scope" with a link to SEED-002's rationale.
- PROJECT.md v0.29.0 milestone description lists `identity.decrypt` as out-of-scope (already done, but double-check).
- Any PR titled `identity.decrypt` in this milestone is closed without review.
- Name the deferral in the Security Considerations: *"An `identity.decrypt` primitive is deliberately not provided in this amendment; such a primitive would re-introduce the per-event signer surface this amendment exists to eliminate."*

**Warning signs:**
- Any phase plan mentions `identity.*` as a new message type.
- Git log contains commits touching `packages/nub/src/identity/types.ts` during v0.29.0 phases.
- Amendment references NUB-IDENTITY as "also updated" or "companion change".

**Phase to address:** Planning discipline across Phases 135/136/137. No code gate prevents this — human review at `/gsd:roadmap` and at each phase plan approval.

---

## Moderate Pitfalls

### Pitfall 11: Envelope shape drift from `relay.publishEncrypted`

**What goes wrong:**
`relay.publishEncrypted` uses `encryption?: 'nip44' | 'nip04'` defaulting to `'nip44'`. The new `relay.subscribeEncrypted` defines `encryption?: 'NIP-44' | 'NIP-04'` (different casing), or drops the default, or renames to `scheme`. Napplet authors writing both send and receive paths now juggle two different encryption-field shapes.

**Why it happens:**
Copy-paste drift, or a well-intentioned "cleaner" rename during review.

**How to avoid:**
- Phase 136 PR must exhibit byte-identical `encryption?: 'nip44' | 'nip04'` field on the new message type. Type-level check: `Parameters<typeof subscribeEncrypted>[1]['encryption']` must equal `RelayPublishEncryptedMessage['encryption']`.
- Amendment conformance table MUST use the same string literals (`'nip44'`, `'nip04'`) as the publishEncrypted row.
- Default is `'nip44'` — identical default.

**Warning signs:**
- Types file adds a new union type instead of reusing the send-side literal union.
- Different capitalization in JSON examples.
- Amendment defines a new error code like `unsupported-scheme` when publishEncrypted already uses `unsupported-encryption` (check what publishEncrypted actually uses — if absent, make both consistent in this milestone).

**Phase to address:** Phase 136 types + Phase 135 conformance table consistency review.

---

### Pitfall 12: `RelayInboundMessage` discriminated union not extended; shim's `handleMessage` type-narrow gap

**What goes wrong:**
`packages/nub/src/relay/types.ts:270` defines `RelayInboundMessage` as a closed union. If the new `RelaySubscribeEncryptedEventMessage`, `.eose`, `.closed`, `.error` types are added but not listed in the union, external callers using `switch(msg.type) { ... default: const _exhaustive: never = msg; }` patterns silently lose exhaustiveness — the new types fall through the default arm. Build stays green; runtime breaks are invisible.

**Why it happens:**
The union at line 270 is easy to miss when scrolling past the per-message interfaces. TS does not warn when a member of a discriminated union is not added to the union alias.

**How to avoid:**
- Phase 136 plan lists `RelayInboundMessage` and `RelayOutboundMessage` unions as required edits alongside the new interfaces.
- Add a compile-time exhaustiveness assertion in the shim: in `handleMessage`, after all `if (msg.type === '…')` branches, `const _exhaustive: never = msg as never;` with a comment stating the invariant. If a new type is added to the union but not handled, TS errors.
- Add a test-only file `packages/nub/src/relay/__exhaustive__.ts` (gitignored from dist via tsup `entry` selection, or excluded via a `__*` pattern) that imports `RelayInboundMessage` and discriminates with exhaustive switch + `never` fallback.

**Warning signs:**
- Diff includes new `export interface RelaySubscribeEncrypted*` but no change to lines 270–277.
- `pnpm -r type-check` green but shim doesn't handle the new types.
- `grep -n 'RelayInboundMessage\|RelayOutboundMessage' packages/nub/src/relay/types.ts` count stays at 2 after the Phase 136 diff (should be 2 references + list edits).

**Phase to address:** Phase 136 (types + shim + exhaustiveness assertion).

---

### Pitfall 13: Missing `Filter[]` / `NostrFilter[]` re-export in sdk.ts

**What goes wrong:**
`packages/nub/src/relay/sdk.ts` lines 8–14 import `NostrFilter` for internal signature use but does NOT re-export it. SDK callers writing `const filters: Filter[] = [...]` discover there's no `Filter` export from `@napplet/nub/relay/sdk`. They either import it from `@napplet/core` (tight coupling to core's location), or they write `any[]` (defeats typing), or they import from a deep subpath. The existing publishEncrypted SDK wrapper did NOT expose a typed filter helper either — repeating that gap compounds the problem.

**Why it happens:**
The existing SDK surface for subscribe/query also doesn't re-export Filter (line 48–54). Inertia: "we didn't need it before."

**How to avoid:**
- Phase 136 SDK edit: re-export `NostrFilter` from `@napplet/nub/relay/sdk` (and consider aliasing as `Filter` per the SEED-002 pseudo-code which used `Filter[]`). Double check that `index.ts` barrel also re-exports it.
- Conformance: SDK callers writing `import type { Filter } from '@napplet/nub/relay';` MUST succeed. Add a minimal type-smoke in `.planning/phases/136-*/plans/…` that compiles this import line against the built dist.

**Warning signs:**
- `index.ts` barrel does not contain `NostrFilter` in its `export type { … }` list.
- SDK caller writes `NostrFilter` with deep import from `@napplet/core`.
- SEED-002's pseudo-code uses `Filter[]` but the shipped types use `NostrFilter[]` — pick one name in the spec and the SDK, consistently.

**Phase to address:** Phase 136 (SDK + barrel edits).

---

### Pitfall 14: subId namespace collision with plain `relay.subscribe`

**What goes wrong:**
Napplet generates `subId = crypto.randomUUID()` for a plain `subscribe()` call. Later, it calls `subscribeEncrypted()` and the shim generates another UUID. The shell's internal subscription table uses `subId` as the primary key. If the shim accidentally reuses the outer subscription machinery (e.g., `relay.close` is spec-unclear whether it closes encrypted subs too), a `relay.close` for the encrypted sub sends the same envelope shape as a close for a plain sub. Shell can't disambiguate without a `mode` field or separate envelope.

**SEED-002 does not specify this.** It must be decided in Phase 135.

**Why it happens:**
The existing `relay.close` envelope (`{ type: 'relay.close', id, subId }`) has no `mode` field. Adding `subscribeEncrypted` without a corresponding `closeEncrypted` or a `mode` discriminator creates ambiguity.

**How to avoid:**
Pick one of two options and lock it in the amendment:
- **(a) Shared namespace + shared close:** `subId` is globally unique across plain and encrypted subs (UUIDv4 collision probability is negligible); `relay.close` closes whichever sub has that `subId`. Requires explicit spec text.
- **(b) Separate namespace + separate close:** New `relay.closeEncrypted` envelope with same shape but different `type`. More envelope surface but zero ambiguity.

Recommended: **(a)** — simpler, UUID uniqueness is strong, matches the existing `relay.close` shape. Document explicitly in the amendment: *"The `subId` namespace is shared between `relay.subscribe` and `relay.subscribeEncrypted`. A `relay.close` with a given `subId` terminates whichever subscription holds that ID."*

**Warning signs:**
- Amendment adds `subscribeEncrypted` but doesn't mention `close` semantics.
- Shim adds a separate close path inside `subscribeEncrypted()` that re-sends `relay.close` without a comment explaining it's the shared-namespace decision.
- Phase 136 diff adds `relay.closeEncrypted` type but Phase 135 spec doesn't define it.

**Phase to address:** Phase 135 (spec decision + prose) + Phase 136 (shim behavior matches).

---

### Pitfall 15: Sidecar `resources?` field accidentally added to encrypted-event envelope

**What goes wrong:**
Copy-paste the existing `RelayEventMessage` interface (which includes `resources?: ResourceSidecarEntry[]` per v0.28.0) for the new `RelaySubscribeEncryptedEventMessage`. Now the shell could pre-fetch URLs *referenced inside an encrypted rumor*, revealing rumor content indirectly via pre-fetch telemetry to upstream hosts. This entirely contradicts the privacy thesis of SEED-002.

**Why it happens:**
`RelayEventMessage` is the obvious template. The sidecar field was added defensively to the plain subscription path in v0.28.0 with default-OFF privacy posture; that rationale collapses entirely for encrypted rumors.

**How to avoid:**
- Phase 136 type definition for `RelaySubscribeEncryptedEventMessage` MUST NOT import `ResourceSidecarEntry`. Not even type-only.
- Phase 135 spec adds explicit MUST: *"Shells MUST NOT include the `resources` sidecar on `relay.subscribeEncrypted.event` envelopes. Resource pre-resolution is disabled on the encrypted path regardless of shell policy."*
- Grep gate on the types file post-Phase-136: `rg -n 'ResourceSidecarEntry' packages/nub/src/relay/types.ts` — expect exactly 1 match (the existing `RelayEventMessage` use), never 2.

**Warning signs:**
- Types file diff duplicates the `resources?:` field in the new interface.
- Amendment sidecar section mentions `subscribeEncrypted` at all.
- JSDoc example for the encrypted-event envelope shows `resources: [...]`.

**Phase to address:** Phase 135 (spec MUST against sidecar on encrypted path) + Phase 136 (types do not import `ResourceSidecarEntry` for the encrypted envelope).

---

### Pitfall 16: `relay.publish.error` phantom type referenced by shim but never defined

**What goes wrong:**
`packages/nub/src/relay/shim.ts:138` and `:144` reference a message type `'relay.publish.error'` that is **not** defined in `types.ts` or in any `@napplet/nub/relay/types` export. The shim handles an event type that no spec allows and no type system enforces. If `subscribeEncrypted` copies that pattern (adding a check for `'relay.subscribeEncrypted.error'` in the shim without defining the type), the same latent inconsistency ships again.

**Why it happens:**
Historical drift in the `publish()` shim — someone added the error-type branch as defensive code without back-filling the type. No test caught it because the shim's test path is behavioral, not type-level.

**How to avoid:**
- Phase 136 defines `RelaySubscribeEncryptedErrorMessage` as a first-class type (per Pitfall 6), adds it to `RelayInboundMessage` union (per Pitfall 12), and the shim handles exactly the spec-defined envelopes.
- Bonus: opportunistically clean up the `publish.error` phantom in `shim.ts:138/144` during Phase 136 — either define `RelayPublishErrorMessage` properly or delete the dead branch. Phase 136 plan should either call this out as in-scope cleanup or explicitly defer with a REMOVE-XX note.

**Warning signs:**
- Shim `handleMessage` checks a message type not present in `types.ts` exports.
- `grep -n 'relay\.\w*\.error' packages/nub/src/relay/` returns more matches in `shim.ts` than in `types.ts`.
- Phase 136 plan does not address the existing publish.error gap.

**Phase to address:** Phase 136 (types + shim, with opportunistic cleanup of existing `publish.error` dangling reference).

---

## Minor Pitfalls

### Pitfall 17: Bundle size creep breaks the v0.28.0 tree-shake invariant

**What goes wrong:**
v0.28.0 VER-07 proved a relay-types-only consumer bundles to 74 bytes with zero resource-shim symbols. If Phase 136 accidentally pulls in signer/identity types, or imports a runtime helper at module top-level, the bundle grows.

**How to avoid:** Phase 136 VER re-runs the tree-shake smoke with `@napplet/nub/relay/types` only → expect same-or-smaller than 74 bytes (new types are pure interfaces; should add 0 runtime code). Match v0.26.0 Phase 121 and v0.28.0 Phase 134 methodology.

**Warning signs:** Bundle size grows >10 bytes; new runtime imports appear at top level of `types.ts`.

**Phase to address:** Phase 137 (VER gate).

---

### Pitfall 18: Conformance table markdown formatting drift

**What goes wrong:** Existing NUB-RELAY conformance tables (nubs master) use a specific 3-column `| Requirement | Level | Notes |` format. New rows added in 2-column or different-casing format, or the `MUST-NN` numbering restarts, or doesn't continue from the last used number.

**How to avoid:** Phase 135 reads the existing conformance table structure first; new rows append in the same format with continuing `MUST-NN` / `SHOULD-NN` numbering.

**Warning signs:** `git diff NUB-RELAY.md` shows reformatted existing rows; new row count ≠ number of new MUSTs/SHOULDs from the phase plan.

**Phase to address:** Phase 135 authoring.

---

### Pitfall 19: README and SKILL.md not swept for the new surface

**What goes wrong:** `packages/nub/README.md`, `packages/sdk/README.md`, `packages/shim/README.md`, root `README.md`, and `skills/build-napplet/SKILL.md` mention `relay.subscribe` / `relay.publishEncrypted` but never `subscribeEncrypted`. New napplet authors following the skill don't know it exists; chat napplet examples silently use the leaky `window.nostr` path.

**How to avoid:** Phase 137 adds `subscribeEncrypted` to the same surfaces that listed `publishEncrypted` after v0.24.0. Use `rg -l 'publishEncrypted' packages/ skills/ README.md` to find the exact files to touch.

**Warning signs:** Phase 137 DOC list does not enumerate at least the 5 files above; `rg -c 'subscribeEncrypted' packages/ skills/` returns fewer matches than `rg -c 'publishEncrypted' packages/ skills/`.

**Phase to address:** Phase 137 (DOC sweep).

---

### Pitfall 20: Missing cross-reference between NIP-5D Security Considerations and NUB-RELAY amendment

**What goes wrong:** NIP-5D gains a "NIP-07 extension isolated-world leak" subsection that describes the problem but doesn't point at `relay.subscribeEncrypted` as the spec-legal alternative. Or NUB-RELAY amendment describes the surface without linking back to NIP-5D's security rationale. Future readers land on one and miss the other.

**How to avoid:** Phase 135 and Phase 137 bi-directional cross-references: NUB-RELAY cites NIP-5D Security Considerations § "NIP-07 Extension Isolated-World Leak"; NIP-5D cites NUB-RELAY § `relay.subscribeEncrypted`. Both phase plans list the cross-reference as a required artifact.

**Warning signs:** Phase plans don't mention cross-references; `rg 'NIP-5D' ~/Develop/nubs/NUB-RELAY.md` decreases vs. baseline; `rg 'subscribeEncrypted' specs/NIP-5D.md` → 0.

**Phase to address:** Phase 135 + Phase 137 joint.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Copy `RelayEventMessage` verbatim (incl. `resources?`) for encrypted envelope | Saves 5 min | Privacy regression on encrypted rumors (Pitfall 15) | **Never** |
| Overload `.closed` envelope with failure semantics (no `.error` type) | One fewer message type to define | Napplet authors mis-render failures as clean endings (Pitfall 6) | **Never** |
| Omit `kinds` constraint in filter spec | Matches `relay.subscribe` permissiveness | Unbounded signer invocation storms (Pitfall 5) | **Never** |
| Free-form `error: string` instead of fixed code vocabulary | Flexible for implementors | Each shell invents its own strings; napplets branch on prose (Pitfall 6) | **Never** — learned from NUB-RESOURCE |
| Leave `publish.error` phantom branch unaddressed in shim | Out of milestone scope | Compounding dead branches; new pattern copies the rot (Pitfall 16) | Only if explicitly deferred with a REMOVE-XX marker |
| Skip the type-level exhaustiveness assertion | One fewer file | Missing union members go unnoticed (Pitfall 12) | Never for a public NUB's discriminated union |
| Phrase the NIP-07 leak as "mitigated by strict-CSP" | Simpler narrative | Actively misleads implementors; makes the whole milestone counterproductive (Pitfall 4) | **Never** |
| Mention private package/repo names in the public spec | Easier copy from SEED-002 | Public surface of private names; violates project rule (Pitfall 7) | **Never** |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| NIP-07 browser extensions (nos2x, Alby, Flamingo) | Assuming strict-CSP or iframe sandbox blocks `window.nostr` injection | They don't. Content scripts run in an isolated world. NIP-5D can only document + provide `relay.subscribeEncrypted` as the spec-legal path. |
| NIP-17 gift-wrap (kind 1059) | Unwrapping the wrap without validating its Schnorr sig first | Spec MUST: validate outer wrap signature before NIP-44 decryption (Pitfall 3). |
| NIP-17 rumor–seal author binding | Trusting the seal's claimed author without checking against rumor pubkey | Spec MUST: `rumor.pubkey === seal.author` or drop (Pitfall 3). |
| NIP-59 `created_at` randomization | Passing outer wrap `created_at` to the napplet | Spec MUST: strip all outer wrap metadata from the rumor envelope (Pitfall 2). |
| NIP-44 v2 vs NIP-04 legacy | Letting napplet specify encryption but not enforcing shell support | `encryption?: 'nip44' \| 'nip04'` mirrors `publishEncrypted`; shell that can't do the requested scheme returns `code: 'unsupported-encryption'` on `.error`. |
| Resource sidecar (NUB-RESOURCE) | Adding `resources?` to encrypted-event envelope | Explicit MUST against it in the encrypted path (Pitfall 15). |
| nostr-tools | Using `nostr-tools` NIP-44 / NIP-59 helpers inside the shim (napplet side) | **Never** — napplet-side crypto is the entire thing SEED-002 exists to prevent. Shim handles only envelope routing; all crypto is shell-side. Keep `nostr-tools` off `@napplet/nub/relay`'s dep list. |
| `@napplet/nub/relay` package.json `exports` | Forgetting to add a new subpath | **Not applicable** — all 4 subpaths (`./relay`, `./relay/types`, `./relay/shim`, `./relay/sdk`) already exist in `packages/nub/package.json:7-22`. No new subpath needed; verify no spurious addition sneaks in. |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Unbounded kind-1059 subscription | Shell CPU spikes on wrap decrypt attempts; signer spam | Spec MUST require `kinds` constraint (Pitfall 5) | Any napplet that runs in a relay-rich environment (≥5 connected relays × any DM traffic) |
| N signer round-trips for N events | Latency per rumor = signer RTT; visible as jittery chat | Spec SHOULD (not MUST — UX is shell territory): shells SHOULD batch per-subscription signer invocations | Typical chat napplet after ~10 messages/sec |
| Pre-fetch inside encrypted rumor URLs | Timing side channel reveals rumor activity | MUST against `resources?` on encrypted envelope (Pitfall 15) | Always — any napplet with any encrypted subscription |
| Per-event postMessage round-trip (Option B pathology) | Each rumor crosses the boundary twice (ciphertext in, rumor out) | Option A chosen; Option B deliberately deferred | If anyone tries to shortcut with `identity.decrypt` (Pitfall 10) |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Spec doesn't mandate outer wrap sig validation | Attacker-controlled rumors appear signed-by-victim | MUST-01 in conformance table (Pitfall 3) |
| Spec doesn't mandate rumor–seal author check | NIP-17 rumor-signer confusion attack | MUST-02 in conformance table (Pitfall 3) |
| Leaking outer `created_at` to napplet | Undoes ±2-day timing randomization | MUST-05 omits outer wrap from rumor envelope (Pitfall 2) |
| Allowing non-kind-encrypted filters | DoS via forced-decrypt storm | MUST require `kinds` constraint (Pitfall 5) |
| Sidecar on encrypted path | Pre-fetch reveals rumor content indirectly | MUST against sidecar on encrypted envelope (Pitfall 15) |
| Overloading failures on `.closed` | Napplet can't distinguish cancel from failure | Dedicated `.error` envelope with fixed code vocabulary (Pitfall 6) |
| Over-scoping consent UX in spec | Locks every shell to one UX choice | Amendment states MAY, never MUST, on consent UX (Pitfall 9) |
| Misrepresenting strict-CSP as blocking NIP-07 | Implementors ship broken defense-in-depth stories | NIP-5D Security Considerations MUST say strict-CSP does NOT block content-script injection (Pitfall 4) |

---

## "Looks Done But Isn't" Checklist

- [ ] **Amendment MUSTs:** outer wrap sig validation row present — verify `rg -i 'outer wrap.*signature' NUB-RELAY.md` finds a MUST row.
- [ ] **Amendment MUSTs:** rumor–seal author binding row present — verify `rg -i 'rumor.*pubkey.*seal' NUB-RELAY.md`.
- [ ] **Amendment MUSTs:** outer metadata stripped from rumor envelope row — verify `rg -i 'MUST NOT.*(wrap|outer).*(created_at|sig|id)' NUB-RELAY.md`.
- [ ] **Amendment MUSTs:** `kinds` constraint required row — verify `rg -i 'MUST.*kinds' NUB-RELAY.md`.
- [ ] **Amendment MUSTs:** no `resources` sidecar on encrypted path row — verify `rg -i 'MUST NOT.*(resources|sidecar)' NUB-RELAY.md`.
- [ ] **Amendment error vocabulary:** 8 codes listed explicitly (consent-denied / signer-unavailable / decrypt-failed / signature-invalid / rate-limited / too-many-subscriptions / unsupported-encryption / unsupported-unwrap).
- [ ] **Amendment line 223 (current auto-decrypt MUST) addressed** — removed or narrowed (Pitfall 1).
- [ ] **Cross-ref:** NIP-5D Security Considerations ↔ NUB-RELAY amendment (Pitfall 20).
- [ ] **Zero-grep public-repo hygiene:** `rg -i '@napplet|kehto|hyprgate|napplet/napplet#|downstream shell|we found|during UAT' ~/Develop/nubs/NUB-RELAY.md` → 0 matches.
- [ ] **Zero-grep on commit/PR body** (after `gh pr view`): same set → 0.
- [ ] **`identity.decrypt` out-of-scope statement** present in amendment and in at least one phase plan (Pitfall 10).
- [ ] **Types: `RelayInboundMessage` union extended** — verify the union alias at `types.ts:270` lists all 4 new types.
- [ ] **Types: exhaustiveness assertion added** somewhere in the shim `handleMessage` for the new sub-flow (Pitfall 12).
- [ ] **Types: `RelaySubscribeEncryptedErrorMessage` defined** as first-class type, not phantom like `relay.publish.error` (Pitfall 16).
- [ ] **Types: `encryption?: 'nip44' | 'nip04'` byte-identical** to `RelayPublishEncryptedMessage` (Pitfall 11).
- [ ] **Types: `ResourceSidecarEntry` NOT imported** by the encrypted envelope type (Pitfall 15).
- [ ] **SDK: `Filter` / `NostrFilter` re-exported** from `@napplet/nub/relay` barrel + sdk (Pitfall 13).
- [ ] **package.json exports unchanged** — no spurious new subpath; all 4 relay subpaths already present.
- [ ] **Tree-shake bundle ≤ 74 bytes** for relay-types-only consumer (Pitfall 17; matches v0.28.0 VER-07).
- [ ] **READMEs swept** for `subscribeEncrypted` — at least 5 files updated (Pitfall 19).
- [ ] **`pnpm -r build` and `pnpm -r type-check`** exit 0 across all 14 packages.
- [ ] **subId namespace decision** explicitly stated in amendment — shared vs separate (Pitfall 14).

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| `@napplet/*` leaked into merged public PR | HIGH | Force-push amend with grep-cleaned content; open errata PR; note in commit that history on the nubs repo is now public. Consider the leak permanent once pushed. |
| Pitfall 1 (collision with line 223) merged as-is | MEDIUM | Follow-up amendment PR resolves the collision; napplet docs clarify precedence; implementors who wrote to the ambiguous version update. |
| Pitfall 2 (outer `created_at` leaked) ships to types | MEDIUM | v0.29.1 patch: remove the field from envelope, call the type change breaking for shells that populated it, publish a `CHANGELOG` entry. |
| Pitfall 3 (no sig validation MUST) ships | HIGH | Amendment follow-up adding the MUST; document the interim risk; inform shell implementors explicitly. |
| Pitfall 4 (strict-CSP claimed to block NIP-07) ships | HIGH | Errata on NIP-5D; blog post-style update in repo explaining the correction; cannot undo implementor beliefs already formed. |
| Pitfall 10 (`identity.decrypt` added) ships | MEDIUM | Deprecate the new surface in v0.30.x with `@deprecated` + deletion scheduled; keep subscribeEncrypted as canonical. |
| Pitfall 12 (union not extended) merged | LOW | Patch release extending the union; no wire impact. |
| Pitfall 15 (sidecar on encrypted envelope) merged | HIGH | Types patch release removing the field; spec correction; shells that populated it must stop immediately. |
| Pitfall 16 (phantom `.error` type) persists | LOW | Opportunistic cleanup in a later pass; add types alongside. |

---

## Pitfall-to-Phase Mapping

| # | Pitfall | Prevention Phase | Verification |
|---|---------|------------------|--------------|
| 1 | line 223 collision with `subscribeEncrypted` | 135 | `rg 'shell MUST decrypt incoming' NUB-RELAY.md` → 0 matches after diff |
| 2 | outer wrap `created_at` leak | 135 (spec) + 136 (types) | Envelope type has no `wrap` / `outer*` fields; spec MUST-05 present |
| 3 | wrap sig + rumor–seal binding | 135 | MUST-01 + MUST-02 rows present in conformance table |
| 4 | NIP-07 leak misrepresented | 137 | NIP-5D has an explicit "strict-CSP does NOT block window.nostr" sentence |
| 5 | unbounded filter | 135 | MUST row requiring `kinds`; spec enumerates recommended kinds `[4, 1059, 1060]` |
| 6 | missing `.error` envelope | 135 (spec) + 136 (types) | Dedicated `RelaySubscribeEncryptedErrorMessage`; 8-code vocabulary in spec |
| 7 | private names leaked to public PR | 135 | Phase VER step: 3-way grep gate (`@napplet`, `kehto`, `hyprgate`) returns 0/0/0 on file, commit, PR body |
| 8 | diary-voice in amendment | 135 | Second grep gate: `(during|we found|we observed|UAT|downstream shell)` → 0 |
| 9 | UX prescribed in spec | 135 | Grep `(modal|prompt|dialog|UI)` on new content → 0; conformance rows describe wire behavior only |
| 10 | `identity.decrypt` scope creep | 135/136/137 planning | All phase plans list `identity.decrypt` under "Explicitly out of scope" |
| 11 | envelope shape drift | 136 | Type-level equivalence: `encryption?` field literal-identical to publishEncrypted |
| 12 | union not extended | 136 | `RelayInboundMessage` includes all 4 new types; exhaustiveness assertion present |
| 13 | `Filter` not re-exported | 136 | `import type { NostrFilter } from '@napplet/nub/relay'` compiles |
| 14 | subId namespace collision | 135 (decision) + 136 (shim) | Amendment states shared/separate decision; shim matches |
| 15 | sidecar on encrypted path | 135 (spec MUST) + 136 (no import) | `rg 'ResourceSidecarEntry' types.ts` → 1 match (the existing use, not the new interface) |
| 16 | `publish.error` phantom propagated | 136 | No new message type referenced in shim without a corresponding type definition |
| 17 | bundle size regression | 137 | Tree-shake smoke ≤ 74 bytes (v0.28.0 VER-07 baseline) |
| 18 | conformance table format drift | 135 | Diff review — new rows in existing format, `MUST-NN` numbering continues |
| 19 | READMEs not swept | 137 | `rg -l subscribeEncrypted packages/ skills/ README.md` ≥ `rg -l publishEncrypted packages/ skills/ README.md` |
| 20 | missing cross-reference | 135 + 137 | NIP-5D → NUB-RELAY link; NUB-RELAY → NIP-5D link |

---

## Sources

- SEED-002 at `.planning/seeds/SEED-002-receive-side-decrypt-surface.md` (direction Option A locked 2026-04-23, planted during v0.28.0 Phase 134)
- `packages/nub/src/relay/types.ts` lines 120–175 (existing `relay.publishEncrypted` precedent, line 137 type def)
- `packages/nub/src/relay/shim.ts` lines 183–219 (existing `publishEncrypted` shim pattern), lines 138/144 (phantom `relay.publish.error` reference)
- `packages/nub/src/relay/sdk.ts` lines 116–126 (existing `relayPublishEncrypted` SDK wrapper)
- `packages/nub/src/relay/index.ts` (barrel exports — `NostrFilter` NOT re-exported)
- `packages/nub/package.json` lines 7–22 (`./relay*` subpath exports already present)
- `~/Develop/nubs/` public repo, branch `nub-relay`, `NUB-RELAY.md` lines 65–71 (existing conformance table rows), line 223 (existing "shell MUST decrypt incoming" line — Pitfall 1 target)
- `~/Develop/nubs/` exists as a PUBLIC repo — per memory `feedback_no_private_refs_commits`: zero `@napplet/*` / `kehto` / `hyprgate` references allowed
- `specs/NIP-5D.md` lines 37, 111, 115–130 (existing Security Considerations + Browser-Enforced Resource Isolation subsection — Phase 137 adds the NIP-07 subsection next to these)
- `.planning/PROJECT.md` v0.28.0 shipped summary + v0.29.0 Active section (out-of-scope list confirms `identity.decrypt`, demo napplets, NIP-07 extension hardening deferred)
- v0.28.0 `ResourceSidecarEntry` cross-NUB borrow pattern (Key Decision: "Borrow-don't-own")
- v0.28.0 Phase 132 cross-repo PR drafting pattern (`.planning/phases/132-cross-repo-nubs-prs/drafts/`) — Phase 135 should follow the same pattern
- v0.28.0 Phase 134 VER-06 zero-grep gate (precedent for Pitfall 7/8 enforcement)
- v0.26.0 Phase 121 tree-shake smoke (39-byte baseline) and v0.28.0 Phase 134 VER-07 (74-byte baseline) — Pitfall 17 comparison point
- Memories consulted: `feedback_no_private_refs_commits`, `feedback_no_implementations`, `feedback_no_kehto_hyprgate`, `feedback_nub_scope_boundary`, `feedback_spec_branch_hygiene`, `feedback_nub_state_independence`
- NIP-17 / NIP-44 / NIP-59 specs (public nostr-protocol/nips, confidence HIGH — stable published NIPs)

---
*Pitfalls research for: v0.29.0 Receive-Side Decrypt Surface (SEED-002)*
*Researched: 2026-04-23*
