# Phase 57 Research: NIP Resolution & Pre-Engagement

**Researched:** 2026-04-05
**Confidence:** HIGH (live data from GitHub API, nostr-protocol/nips repo)

## 1. NIP Number Availability

### Current NIP-5x Landscape (Verified 2026-04-05)

| NIP | Status | PR | Author | Title |
|-----|--------|-----|--------|-------|
| 5A | **Merged** | #1538 | hzrd149 | Pubkey Static Websites |
| 5B | Open PR | #2282 | arthurfranca | Embeddable Nostr Web Apps |
| 5C | Open PR | #2281 | fiatjaf | Scrolls (WASM programs) |
| **5D** | **Available** | None | — | No file, no PR, no claim |
| 5E | Open PR | #1790 | v0l | Nostr Live Streams |
| 5F | Available | None | — | No file, no PR, no claim |

### Recommendation: NIP-5D

NIP-5D is the clear choice. It:
- Has no file in the repo (`5D.md` does not exist)
- Has no open PR claiming it
- Is not referenced in any open PR title or description
- Sits logically after NIP-5C (Scrolls) in the 5x sequence
- Avoids any conflict with fiatjaf's Scrolls PR

NIP-5F is also available but breaks the sequential pattern unnecessarily.

**Decision context note:** The project CONTEXT.md already locked decision D-01 to use NIP-5D. This research confirms that decision remains valid.

## 2. PR Status Check (Live as of 2026-04-05)

### PR#2281 — NIP-5C: Scrolls (WASM programs)

- **State:** OPEN
- **Author:** fiatjaf
- **Updated:** 2026-04-05 (active — comments from Apr 2)
- **Activity level:** HIGH — 14 comments, active discussion about WASM memory model, program capabilities
- **Files:** `5C.md`, `29.md`, `51.md`, `README.md`
- **Assessment:** This PR is actively being developed by fiatjaf. It is not stale and will not be abandoned. NIP-5C is definitively claimed. Contesting it would mean picking a fight with the most influential Nostr developer over a number — there is no strategic upside.

### PR#2282 — NIP-5B: Embeddable Nostr Web Apps

- **State:** OPEN
- **Author:** arthurfranca
- **Updated:** 2026-03-29
- **Activity level:** MODERATE — discussion around scope (app listing vs embedded apps), some friction with dskvr about defining "what is a nostr app"
- **Files:** `5B.md`
- **Key context:** arthurfranca is a key stakeholder who already has territory in the NIP-5x space. His NIP-5B focuses on app *listing/discovery* — how to advertise that an nsite is an embeddable app. Our NIP-5D fills the complementary gap: what happens *after* the iframe loads (the communication protocol). The differentiation is clean: 5B = discovery, 5D = runtime.
- **Engagement note:** arthurfranca is one of the three target stakeholders in D-03. In the PR#2282 thread he acknowledged he's not angry about competing approaches, just frustrated by miscommunication. Direct engagement with a clear scope outline should be well-received.

### PR#2287 — Aggregate Hash Extension to NIP-5A

- **State:** OPEN (draft)
- **Author:** hzrd149
- **Updated:** 2026-04-03
- **Activity level:** LOW — 3 comments, mostly from dskvr. hzrd149 opened it "as a draft for discussion."
- **Files:** `5A.md`, `README.md`
- **Key context:** This PR adds aggregate hash computation to NIP-5A manifests. Our protocol depends on aggregate hashes for version-specific ACL identity (per CONTEXT.md D-05). The NIP-5D spec should reference aggregate hashes "as defined in NIP-5A" and assume PR#2287 will be merged. If it is not merged, we can inline the algorithm as a fallback.
- **Risk:** PR#2287 is still a draft. If it stalls, NIP-5D will need to either define aggregate hashes itself or make them optional. Current assessment: low risk — hzrd149 is the NIP-5A author and maintainer of blossom; this is his domain.

## 3. Stakeholder Analysis

### Target Stakeholders (from CONTEXT.md D-03)

| Stakeholder | Role | Engagement Vector | Key Concern |
|-------------|------|-------------------|-------------|
| **hzrd149** | NIP-5A author, blossom maintainer | GitHub (PR#2287 thread), nostr DMs | Aggregate hash dependency, manifest integration |
| **arthurfranca** | NIP-5B author | GitHub (PR#2282 thread), nostr DMs | Scope overlap with NIP-5B — must differentiate clearly |
| **fiatjaf** | NIP-5C (Scrolls) author, nips repo maintainer | GitHub, nostr DMs | Spec terseness, overspecification risk, NIP numbering |

### Three-Layer Positioning Narrative (from D-04)

The scope outline for stakeholders should use this framing:

> **NIP-5A** defines *hosting* — how static web assets are stored and served via Nostr events and blossom servers.
>
> **NIP-5B** defines *discovery* — how embeddable web apps are listed and found by host applications.
>
> **NIP-5D** defines *runtime communication* — the postMessage wire protocol between a sandboxed iframe app (napplet) and its host shell, including AUTH handshake, capability discovery, and standard optional capabilities.
>
> These three NIPs are complementary layers. NIP-5D does not redefine hosting (5A) or discovery (5B). It specifies what happens *after* the iframe is loaded: how the embedded app authenticates, discovers available services, and communicates with the host.

This framing should fit in a nostr DM or short GitHub comment, as suggested in CONTEXT.md specifics.

### Engagement Strategy Notes

- **hzrd149:** Most natural entry point is PR#2287. A comment acknowledging the aggregate hash work and explaining NIP-5D's dependency on it provides context and builds goodwill.
- **arthurfranca:** Can be reached via PR#2282 or DM. The key message: NIP-5D is complementary to NIP-5B, not competing. NIP-5D needs NIP-5B for discovery; NIP-5B benefits from NIP-5D for defining what embedded apps can actually do once loaded.
- **fiatjaf:** Trickiest engagement. He's actively building Scrolls (NIP-5C) which is a different approach to in-Nostr apps (WASM vs iframe). NIP-5D should be positioned as orthogonal — iframe sandboxed apps vs WASM programs serve different use cases. The outline should emphasize terseness and protocol-only scope to match his stated NIP quality preferences.

## 4. Validation Architecture

### What Must Be Verified in This Phase

1. **NIP number non-collision:** Confirmed above — NIP-5D is available with no open PR or file.
2. **PR status documentation:** All three PRs (#2281, #2282, #2287) checked and status recorded.
3. **Stakeholder outline quality:** The scope outline must clearly distinguish NIP-5D from NIP-5A and NIP-5B in under 150 words.
4. **Engagement completion:** At least two of three target stakeholders receive the outline (human-driven, not Claude-driven per D-02).

### Verification Commands

```bash
# Verify NIP-5D is still available (run before committing)
gh api repos/nostr-protocol/nips/contents/5D.md 2>&1 | grep -q "Not Found" && echo "5D available" || echo "5D TAKEN"
gh pr list --repo nostr-protocol/nips --state open --search "5D" --json number | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.length === 0 ? '5D: no competing PR' : '5D: COMPETING PR FOUND')"
```

## 5. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Someone claims NIP-5D before we submit | LOW | HIGH | Submit PR early (even as draft) to claim the filename |
| PR#2287 stalls and aggregate hash is not in NIP-5A | LOW | MEDIUM | Define aggregate hash inline as fallback, or make it MAY |
| arthurfranca perceives NIP-5D as competing with NIP-5B | MEDIUM | MEDIUM | Pre-engagement outline emphasizes complementary scope |
| fiatjaf objects to iframe-based app model vs WASM | LOW | LOW | Different use cases; Scrolls is computation, napplets are UI |

## 6. Summary

NIP-5D is the correct number choice. It is confirmed available with no competing claims. The three target PRs are all open with varying activity levels. The three-layer positioning narrative (5A=hosting, 5B=discovery, 5D=runtime) is the key message for stakeholder engagement. The user handles actual outreach (D-02); the phase deliverable is documenting decisions, creating the scope outline, and recording feedback.

---

## RESEARCH COMPLETE
