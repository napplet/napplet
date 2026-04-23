# Phase 57: NIP Resolution & Pre-Engagement - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-05
**Phase:** 57-nip-resolution-pre-engagement
**Areas discussed:** NIP number strategy, Engagement approach, Scope positioning, PR#2287 dependency

---

## NIP Number Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Use next available (5D) | Avoid conflict, pick 5D or whatever's free. Clean path, no politics. | ✓ |
| Contest 5C | Engage fiatjaf directly to negotiate the number. | |
| Different scheme entirely | Propose a new number range or naming convention. | |

**User's choice:** Use 5D
**Notes:** Quick decision, no interest in political negotiation over the number.

---

## Engagement Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Nostr DMs with outline | Send brief scope outline via nostr DMs. Casual, direct, async. | |
| GitHub PR comments | Comment on existing NIP-5A/5B PRs to announce intent and scope. | |
| Draft shared via gist/repo | Write a short scope document, share link. | |

**User's choice:** "I will handle that part"
**Notes:** User will manage stakeholder outreach personally. Phase deliverable is documenting that it occurred, not performing the outreach.

---

## Scope Positioning

| Option | Description | Selected |
|--------|-------------|----------|
| Communication protocol layer | NIP-5A = hosting, NIP-5B = discovery, NIP-5D = runtime communication. Clean orthogonal framing. | ✓ |
| Extension of NIP-5A | NIP-5D extends NIP-5A by defining what happens after an nsite loads. Direct lineage. | |
| Standalone with references | NIP-5D stands alone as 'Nostr Web Applets' and references 5A/5B where relevant. | |

**User's choice:** Communication protocol layer
**Notes:** Clean three-layer framing preferred.

---

## PR#2287 Dependency

| Option | Description | Selected |
|--------|-------------|----------|
| Reference as dependency | NIP-5D says 'requires aggregate hash as defined in NIP-5A' and notes PR#2287. | ✓ |
| Inline the algorithm | Define aggregate hash computation directly in NIP-5D. Self-contained. | |
| Make it optional | NIP-5D works without aggregate hashes. | |

**User's choice:** Reference as dependency
**Notes:** PR#2287 is already being adopted and will eventually be merged. Assume merge, reference as dependency, don't inline.

---

## Claude's Discretion

- Format of scope outline document
- How to document stakeholder feedback
- How to check and document PR statuses

## Deferred Ideas

None
