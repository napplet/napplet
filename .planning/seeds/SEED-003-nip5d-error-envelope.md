---
id: SEED-003
status: dormant
planted: 2026-04-24
planted_during: post-v0.30.0 (between milestones, no active focus)
trigger_when: Next NIP-5D amendment cycle
scope: small
---

# SEED-003: Define a normative error envelope shape in NIP-5D

## Why This Matters

**Primary concern: interop.**

NIP-5D currently constrains only the envelope shape (`{ type: "<domain>.<action>", ...payload }`) and the success-message naming. It says nothing about how a request that fails should be shaped on the wire. That gap is fine while there is one shell implementation, but the moment a second shell ships, two things will diverge:

1. **The error suffix.** The repo has already organically invented `<action>.error` (e.g. `identity.decrypt.error`, `resource.bytes.error`, `relay.publish.error`) alongside `<action>.result` for the success path. A different shell could just as easily put the error inside the `.result` envelope (`{ ok: false, error: '...' }` shape — already used by `relay.publish.result`), or invent `<action>.failed`, or emit a top-level `error.<code>` envelope. All three are spec-conformant today; none of them interop.
2. **The error payload fields.** Some current handlers expect `{ error: string }`, some expect `{ ok: false, error }`, identity uses a typed `IdentityDecryptErrorCode` string-literal union. Without a normative shape, every NUB will reinvent the field names.

A small NIP-5D amendment that pins one shape (probably `<action>.error` with `{ id, code, error }` to match the existing IdentityDecryptErrorCode pattern) prevents the divergence cheaply, before there are multiple shells in the wild.

**Original observation:** noted during the NIP-5D conformance review (post-v0.30.0). Specifically `packages/shim/src/index.ts:114` routes both `.result` and `.error` to the identity shim — the `.error` suffix is allowed by the spec (it's just an `<action>` string) but isn't *defined* by it.

## When to Surface

**Trigger:** Next NIP-5D amendment cycle.

This seed should be presented during `/gsd:new-milestone` when the milestone scope matches any of these conditions:
- A milestone touches NIP-5D directly (any phase that opens `specs/NIP-5D.md` or amends napplet/nubs SPEC.md)
- A milestone introduces a new NUB request/result envelope (the new NUB should land *with* the error contract, not after)
- A milestone formalizes conformance gates for shells (error-envelope conformance is a natural sibling)

Per `feedback_spec_branch_hygiene`: the actual edit should land on `master` or its own short-lived PR — not bundled into a long-lived NUB-WORD branch.

## Scope Estimate

**Small** — Spec-only. No code changes required:

- Amend NIP-5D with a normative section: "Error envelope shape" — pin `<action>.error` as the suffix, define minimal required fields (`id` correlation, `code` machine-readable, `error` human-readable), say something about whether `<action>.result` with `ok: false` is a SHOULD-NOT or a MAY.
- Optionally define a tiny shared error-code vocabulary at the NIP-5D layer (e.g. `unsupported`, `invalid`, `denied`, `timeout`) that NUBs can extend.
- A follow-up sweep of the existing shims to align them is *not* in scope of this seed — that is a Medium milestone, capture separately if the spec amendment passes.

The amendment is roughly the same surface area as the v0.29.0 NUB-CONNECT meta-tag normalization sub-section: ~1 page of normative text plus a conformance fixture row.

## Breadcrumbs

Existing in-repo error-envelope shapes the amendment must reconcile (or grandfather):

- `packages/nub/src/identity/types.ts:574-582` — `identity.decrypt.error` envelope; carries `IdentityDecryptErrorCode` string-literal union (8 values: `class-forbidden` / `signer-denied` / `signer-unavailable` / `decrypt-failed` / `malformed-wrap` / `impersonation` / `unsupported-encryption` / `policy-denied`). This is the most mature pattern — likely the template for the spec.
- `packages/nub/src/resource/types.ts:170-178` — `resource.bytes.error` envelope.
- `packages/nub/src/relay/shim.ts:138-144` — `relay.publish.error` AND `{ ok: false, error }` inside `relay.publish.result` both handled — the spec needs to pick one.
- `packages/nub/src/identity/shim.ts:92` — `identity.decrypt.error` dispatch case.
- `packages/nub/src/resource/shim.ts:51` — `resource.bytes.error` dispatch case.
- `packages/shim/src/index.ts:114` — central router branch that hard-codes both `.result` and `.error` suffixes.

Spec to amend:

- `specs/NIP-5D.md` — local copy.
- Upstream: `dskvr/nips@nip/5d/5D.md` (NIP-5D canonical).
- Possibly co-amend `napplet/nubs` SPEC.md to point at the new section (per recent PR-15 precedent for cross-repo NIP-5D edits).

Related decisions in STATE.md:

- "PRINCIPLE: SPEC.md / NIP-5D edits land on master or their own PR, never bundled into long-lived NUB-WORD branches" — applies to this amendment.
- v0.30.0 IdentityDecryptErrorCode lock — if this amendment generalizes that pattern, cite the v0.30.0 milestone as prior art.

## Notes

The conformance review that surfaced this also surfaced two other spec-shape observations that are NOT being seeded (they were judged non-issues):
- `shell.supports()` having no shipped default → already addressed in quick task `260424-o1k` (commit `5ad9cdb`).
- Topic strings using `colon:separated` form vs envelope's `dot.separated` form → these are `t`-tag values inside `ifc.event` payloads, not envelope `type` strings; no spec conflict.

This seed should not block on either of those.
