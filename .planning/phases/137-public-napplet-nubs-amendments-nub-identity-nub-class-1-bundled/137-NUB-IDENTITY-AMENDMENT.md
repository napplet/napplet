NUB-IDENTITY Amendment: Class-Gated Receive-Side Decrypt (identity.decrypt)
==========================================================================

`draft amendment`

**Amends:** NUB-IDENTITY (currently on `nub-identity` branch of napplet/nubs)
**Coordinated with:** NUB-CLASS-1 amendment (see 137-NUB-CLASS-1-AMENDMENT.md -- same PR)
**Wire change:** yes -- adds 3 new envelope types on the `identity` domain
**Branch in this work:** nub-identity-decrypt (bundled with NUB-CLASS-1 amendment per CLASS1-03)

## Summary

Adds `identity.decrypt(event) -> { rumor, sender }` to NUB-IDENTITY: the receive-side complement to NUB-RELAY's `relay.publishEncrypted()`. Accepts NIP-04, direct NIP-44, and NIP-17/59 gift-wrap events with shell-side shape auto-detection. Class-gated: shells MUST reject calls from napplets not assigned `class: 1` per `NUB-CLASS-1.md`. Introduces a typed 8-member `IdentityDecryptErrorCode` vocabulary and 4 shell-enforcement MUSTs.

## Diff Summary

Sections modified on NUB-IDENTITY.md (single commit `45cdf39` on `nub-identity-decrypt`, `1 file changed, 112 insertions(+), 2 deletions(-)` — the 2 deletions are documented paragraph/bullet replacements listed below):

1. **Description** -- refined paragraph 2: splits "cannot sign, encrypt, or decrypt" into "cannot sign + encryption delegated via relay.publishEncrypted + decryption delegated via identity.decrypt (class-gated)". Narrows the decrypt exclusion from absolute to class-conditional. Names `connect-src 'none'` as the rationale for class-gating.
2. **API Surface** -- new `decrypt(event: NostrEvent): Promise<{ rumor: Rumor; sender: string }>` method on `NappletIdentity`; companion `UnsignedEvent` / `Rumor` / `NostrEvent` type definitions colocated between existing `Badge` and `Subscription` interfaces; new descriptive paragraph covering shape auto-detection, sender-authentication semantics, and the `created_at` hiding rule, plus two blockquote notes explaining why `sender` is not read from `rumor.pubkey` and why the outer `created_at` is suppressed.
3. **Wire Protocol** -- 3 new rows in the envelope table: `identity.decrypt`, `identity.decrypt.result`, `identity.decrypt.error`. New "Key design notes" bullet documenting the typed error vocabulary (last bullet of the list, prior 5 bullets byte-identical).
4. **Wire Protocol / Examples** -- 3 new example envelope triplets inserted after the "Error case" example: gift-wrap decrypt success (kind 1059 -> rumor + sender), `class-forbidden` rejection, `malformed-wrap` rejection with populated `message?`.
5. **Wire Protocol / Error Handling + new Error Codes subsection** -- 1 new sentence appended to Error Handling noting `identity.decrypt` is the typed-error-envelope exception. New `### Error Codes` subsection with the full 8-member `IdentityDecryptErrorCode` TypeScript union + per-code failure-surface table + final paragraph on `message?` field discipline.
6. **Shell Behavior** -- replaces the existing absolute "no encrypt or decrypt" bullet with 6 new bullets covering: (a) encrypt still forbidden on this interface (points at NUB-RELAY), (b) class-gating MUST per `NUB-CLASS-1.md` with `class-forbidden` error + deterministic `message?` rules, (c) outer-signature-verify MUST before seal decrypt with `malformed-wrap` error on fail, (d) `seal.pubkey === rumor.pubkey` MUST with `impersonation` error on fail, (e) outer `created_at` hiding MUST preserving NIP-59 sender-anonymity, (f) SHOULD auto-detect encryption mode (napplets MUST NOT select mode).
7. **Security Considerations** -- new `### Receive-Side Decrypt Surface (identity.decrypt)` subsection appended at end (before `## Implementations`) covering 3 named concerns + 1 observability note: NIP-17/59 gift-wrap impersonation (+ the MUSTs that prevent it); NIP-07 `all_frames: true` content-script injection (+ nonce-based `script-src` CSP mitigation blocking legacy `<script>`-tag injection; documents BOTH `script-src-elem` and bare `script-src` sub-directive variants); `world: 'MAIN'` extension-API residual (+ `connect-src 'none'` structural mitigation per `NUB-CLASS-1.md`). Subsection (c) closes with a policy-latitude sentence using the verbatim phrases `MAY refuse-to-serve` and `shell MAY reject` (VER-03 Group E grep targets). Final paragraph explicitly labels shim-side `class !== 1` short-circuit as observability / defense-in-depth, NOT a trust boundary.

Sections NOT modified (preserved byte-identical from `nub-identity` branch baseline): NUB metadata header (ID / Namespace / Discovery), Description paragraph 1, all 9 existing getter paragraphs on API Surface, Resource resolution paragraph, existing ProfileData / ZapReceipt / Badge / Subscription interfaces (companion new types are inserted between Badge and Subscription without touching either), all 9 existing request/result rows in Wire Protocol, original 5 Key design notes bullets, existing Examples q1-q10, Error Handling paragraph (1 new sentence appended at end -- prior prose unchanged), original 9 Shell Behavior bullets (only the trailing "no encrypt or decrypt" bullet replaced), original 6 Security Considerations bullets.

## Rationale

Closes the NIP-17 / NIP-59 receive-side gap. NUB-RELAY ships `relay.publishEncrypted()` as the shell-mediated send side (napplets produce cleartext, shell encrypts+seals+signs+publishes); there has been no symmetric receive-side primitive until now. Napplets that need to read DMs or NIP-17 group messages must go through `identity.decrypt` -- any alternative (e.g., delivering plaintext via `relay.event`) would hand plaintext to napplets with direct-network egress (NUB-CLASS-2 via NUB-CONNECT) with zero shell visibility, which is unmitigated DM exfiltration.

Class-gating to `NUB-CLASS-1.md` is the architectural control: NUB-CLASS-1 napplets operate under `connect-src 'none'` (per NUB-CLASS-1's CSP Posture), which traps plaintext inside the frame regardless of how it was obtained. NUB-CLASS-2 napplets ship `connect-src <granted>` (direct-origin access via NUB-CONNECT); handing them plaintext breaks the structural mitigation. Class-gating is enforced shell-side at message-handling time using the `class.assigned` state the shell already determined at iframe-ready -- no per-envelope re-derivation.

The 4 shell MUSTs map to the NIP-17/59 attack surface: outer-sig-verify prevents the shell acting as a decrypt oracle against forged wraps; seal-pubkey/rumor-pubkey equality check prevents impersonation via the unsigned-rumor attack; outer-created_at hiding preserves NIP-59 sender-anonymity; class-gating prevents the entire decrypt surface being available where plaintext could be exfiltrated.

The Security Considerations subsection documents the NIP-07 extension injection vector + its mitigations without claiming a fix where one does not exist -- the `world: 'MAIN'` residual is acknowledged honestly because an honest residual acknowledgment is better security guidance than a false claim of protection. Downstream shell implementers and napplet authors both benefit from the spec being explicit about where the boundary actually sits. The closing policy-latitude sentence in subsection (c) names shell response options (refuse-to-serve; reject future envelopes; log-only; surface-to-user) without prescribing one -- consistent with NUB-CLASS-1's companion amendment framing.

## Backward Compatibility

The amendment is mostly additive:
- 3 new envelope types on the `identity` domain (shells implementing the prior NUB-IDENTITY without `identity.decrypt` continue to be conformant for the existing 9 getters, but do NOT implement the new receive-side decrypt surface).
- 1 new method on the `NappletIdentity` TypeScript interface.
- 1 new `### Error Codes` subsection (adjacent to existing `### Error Handling`).
- 1 new `### Receive-Side Decrypt Surface` subsection in Security Considerations.
- 6 new bullets in Shell Behavior; 1 existing bullet ("no encrypt or decrypt") is REPLACED with 1 refined bullet ("no encrypt -- see NUB-RELAY") + the 5 new decrypt-specific bullets. Shells relying on the absolute prior text to refuse-to-implement decrypt remain conformant as long as they emit `class-forbidden` (or `unsupported-encryption` for out-of-band modes) and implement the gating MUSTs; shells that never expect to serve NUB-CLASS-1 napplets remain conformant without implementing any decrypt logic since no class-1 napplet will ever send them an `identity.decrypt` envelope.

Description paragraph 2 is REFINED (not replaced wholesale) -- the change is semantically compatible with implementations that treated the prior "cannot decrypt" as "napplets cannot locally decrypt" (which remains true -- napplets cannot; only the shell can).

## Empirical Substrate (for the NIP-07 Security Considerations language)

The amendment's claim that NUB-CLASS-1's nonce-based `script-src` blocks legacy NIP-07 `<script>`-tag injection is empirically validated on Chromium 144+: a test fixture under the NUB-CLASS-1 posture observes the browser blocking the injected script and firing a `securitypolicyviolation` event with `violatedDirective: "script-src-elem"` -- the element-level sub-directive of the `script-src` family. The amendment phrasing uses the directive family (`script-src`) rather than pinning the exact sub-directive because older Chromium versions emit the bare `script-src` value. The `world: 'MAIN'` residual framing is preserved verbatim: `chrome.scripting.executeScript({world:'MAIN'})` bypasses page CSP by extension-API design; no report-to notification fires for main-world injections; `connect-src 'none'` is the structural backstop.

## Conformance

Conformance for a shell claiming support for the amended NUB-IDENTITY requires all of:

1. Accepts `identity.decrypt` envelopes with payload `{ id, event }`; returns exactly one of `identity.decrypt.result` or `identity.decrypt.error` keyed to the same `id`.
2. Rejects `identity.decrypt` from any napplet whose `class.assigned` state is not `1` with `{ error: 'class-forbidden' }`. MUST be emitted before any crypto attempt; MUST use the class state from iframe-ready lifecycle (no per-envelope re-derivation).
3. Verifies the outer `event.sig` against `event.pubkey` and canonical `event.id` before attempting seal decrypt for NIP-17 wraps; a bad or absent outer signature produces `{ error: 'malformed-wrap' }`.
4. For NIP-17 flows: decrypts the seal, verifies `seal.pubkey === rumor.pubkey`, and on mismatch emits `{ error: 'impersonation' }`. On match, emits `{ rumor, sender }` with `sender` derived from the seal signature, NOT from `rumor.pubkey`.
5. Does NOT surface the outer wrap's `created_at` on the result envelope.
6. Auto-detects encryption mode from event shape; emits `{ error: 'unsupported-encryption' }` for shapes matching none of NIP-04, direct NIP-44, NIP-17/59.
7. Uses only the 8-member `IdentityDecryptErrorCode` vocabulary for the `error` field (populates `message?` only for diagnostic detail, without exposing other napplets' or users' identifying data).

Non-compliance with any of 1-7 is a conformance failure; the spec does not define graceful-degradation behavior for partial implementations.

## Review Checklist (for the opening-PR human and reviewers)

Pre-merge verification items the PR reviewer should run against the amendment diff:

- [x] Filename-citation count: the NUB-CLASS-1 filename citation appears at least 3 times in the amended spec (observed: 7).
- [x] Filename-citation discipline: the bare class-label phrase (two tokens, capitalized, followed by a digit) does not appear as a stand-alone reference in the amended spec (observed: clean).
- [x] All 8 `IdentityDecryptErrorCode` values appear verbatim in the spec (class-forbidden, signer-denied, signer-unavailable, decrypt-failed, malformed-wrap, impersonation, unsupported-encryption, policy-denied).
- [x] VER-03 Group E verbatim phrases (policy-latitude sentence) both present: the refuse-to-serve phrase and the reject-subsequent-envelopes phrase (see Security Considerations subsection (c)).
- [x] Cross-repo public-repo hygiene grep (first-party private package names + legacy internal project identifiers) across NUB-IDENTITY.md, NUB-CLASS-1.md, and amendment-commit messages returns 0 matches.
- [x] Git diff of NUB-IDENTITY.md against master shows only additive/refinement content within the sections documented in Diff Summary above.
- [x] Filename-citation at the Shell Behavior class-gating MUST row is first-class (inline prose), not a parenthetical aside.

## Implementations

- (none yet)
