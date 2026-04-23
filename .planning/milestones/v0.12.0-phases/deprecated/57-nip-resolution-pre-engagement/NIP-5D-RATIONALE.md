# NIP-5D Number Resolution

**Date:** 2026-04-05
**Decision:** Use NIP-5D for the "Nostr Web Applets" specification

## Number Choice Rationale

NIP-5D is selected because:

1. **5D.md does not exist** in nostr-protocol/nips (verified via GitHub API 2026-04-05)
2. **No open PR** modifies or claims the `5D.md` filename (verified by scanning all 300 open PRs)
3. **NIP-5C is claimed** by fiatjaf's "Scrolls" (WASM programs) in PR#2281, which is actively developed (14+ comments, last activity 2026-04-05)
4. **NIP-5E is claimed** by v0l's "Nostr Live Streams" in PR#1790
5. NIP-5D sits logically in the 5x sequence after 5C, maintaining the alphabetic progression

### Alternatives Considered

| Number | Status | Why Not |
|--------|--------|---------|
| 5C | Claimed (PR#2281, fiatjaf) | Active PR by most influential Nostr developer; contesting provides no strategic value |
| 5E | Claimed (PR#1790, v0l) | Already taken by Nostr Live Streams |
| 5F | Available | Unnecessary -- 5D is available and sequential |

## Three-Layer Model

NIP-5D completes a three-layer architecture in the NIP-5x family:

| Layer | NIP | Scope | Status |
|-------|-----|-------|--------|
| Hosting | NIP-5A | Static website storage and serving via Nostr events + blossom | Merged |
| Discovery | NIP-5B | App listing and discovery for host applications | Open PR#2282 |
| Runtime | **NIP-5D** | postMessage wire protocol between sandboxed iframe app and host shell | This spec |

NIP-5D does not redefine hosting (5A) or discovery (5B). It specifies what happens after the iframe is loaded.

## Dependency PR Status

### PR#2281 -- NIP-5C: Scrolls (WASM programs)
- **State:** OPEN
- **Author:** fiatjaf
- **Last updated:** 2026-04-05
- **Impact on NIP-5D:** None -- different approach to in-Nostr apps (WASM vs iframe). NIP-5D is orthogonal, not competing.

### PR#2282 -- NIP-5B: Embeddable Nostr Web Apps
- **State:** OPEN
- **Author:** arthurfranca
- **Last updated:** 2026-03-29
- **Impact on NIP-5D:** Complementary. NIP-5B defines how apps are listed; NIP-5D defines how they communicate at runtime. NIP-5D references NIP-5B for discovery, NIP-5B benefits from NIP-5D for defining runtime behavior.

### PR#2287 -- Aggregate Hash Extension to NIP-5A
- **State:** OPEN (draft)
- **Author:** hzrd149
- **Last updated:** 2026-04-03
- **Impact on NIP-5D:** Direct dependency. NIP-5D references aggregate hashes "as defined in NIP-5A" for version-specific identity. If PR#2287 stalls, NIP-5D can inline the algorithm as fallback or make aggregate hashes MAY.

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Someone claims NIP-5D before submission | LOW | Submit draft PR early to claim filename |
| PR#2287 stalls | LOW | Inline aggregate hash as fallback |
| NIP-5D perceived as competing with NIP-5B | MEDIUM | Pre-engagement outline (see SCOPE-OUTLINE.md) |
