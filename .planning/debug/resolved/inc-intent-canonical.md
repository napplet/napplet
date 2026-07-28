---
status: resolved
trigger: "resolve napplet/web#190 and napplet/web#191"
created: 2026-07-28
updated: 2026-07-28
---

# INC and INTENT canonical contract alignment

## Symptoms

- Expected behavior: Published core, NAP, SDK, and shim surfaces match the canonical merged NAP-INC and NAP-INTENT documents.
- Actual behavior: INC exposes a fabricated two-argument Nostr-event callback and omits the symmetric channel binding; INTENT implements open draft napplet/naps#91 instead of the merged NAP-INTENT contract.
- Error messages: Canonical consumer examples fail type-checking, and the required INC channel operations are absent.
- Timeline: The affected public generation is 0.29.0 from source commit 60889f1c.
- Reproduction: Inspect the public declarations and runtime bindings identified in napplet/web#190 and napplet/web#191.

## Current Focus

- hypothesis: The 0.29.0 package generation copied an undocumented legacy INC projection and prematurely adopted an unmerged INTENT draft.
- test: Compare every public type, binding, message shape, validator, test, and document against the merged canonical NAP texts.
- expecting: INC requires a single IncEvent callback plus symmetric channel handles; INTENT must revert to the merged request/open/result contract until draft PR #91 is merged.
- next_action: Ship the verified correction.
- reasoning_checkpoint: Canonical authority is external. NAP-INC PR #89 is merged; NAP-INTENT PR #91 remains an open draft and cannot govern published package surface.
- tdd_checkpoint: false

## Evidence

- timestamp: 2026-07-28
  observation: packages/nap/src/inc/shim.ts constructs a synthetic NostrEvent and invokes callback(payload, syntheticEvent).
  implication: The public INC binding contradicts the canonical one-event callback contract.
- timestamp: 2026-07-28
  observation: packages/shim/src/runtime.ts installs only inc.emit and inc.on.
  implication: The canonical channel public surface is absent.
- timestamp: 2026-07-28
  observation: napplet/naps#91 remains open and marked draft.
  implication: Its INTENT shapes are not canonical authority for a published generation.
- timestamp: 2026-07-28
  observation: The living archetype registry defines `["archetype", slug, convention]` without draft `eventKinds` fields.
  implication: The draft-only CLI and Vite metadata extension must retire with the draft INTENT surface.

## Eliminated

- hypothesis: The synthetic NostrEvent is required legacy compatibility.
  reason: No canonical or intended public compatibility contract defines that legacy surface.

## Resolution

- root_cause: The 0.29 generation retained an undocumented INC compatibility projection and adopted unmerged napplet/naps#91 types, runtime messages, and manifest metadata as canonical.
- fix: Replaced INC topic callbacks with the canonical one-object event, added symmetric channel bindings and replay/teardown behavior, restored the merged NAP-INTENT request/open/result contract, removed `intent.deliver`/`onDelivery`, and retired draft-only archetype event-kind metadata.
- verification: `pnpm build`, `pnpm type-check`, and `pnpm -r test:unit` pass. Affected package suites cover sender provenance, absence of synthetic Nostr fields, exact topic routing, channel replay and terminal closure, canonical INTENT request/results, and canonical archetype tags. AI-slop reports no errors or strict AI-slop findings; only pre-existing changed-file complexity warnings remain.
- files_changed: Core, NAP, SDK, shim, conformance, CLI, Vite plugin, skills, package docs, site docs, tests, and release changeset.
