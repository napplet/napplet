---
"@napplet/core": minor
"@napplet/nap": minor
"@napplet/sdk": minor
"@napplet/shim": minor
"@napplet/conformance": minor
"@napplet/vite-plugin": minor
"@napplet/cli": minor
"@napplet/skills": patch
---

Align INC and INTENT with their merged canonical contracts.

INC topic subscriptions now receive one `IncEvent` containing the exact topic, runtime-attested sender, and optional payload. The runtime no longer fabricates a Nostr event. INC also exposes the symmetric channel API through `channel.open`, `channel.onOpened`, `channel.list`, and `channel.broadcast`; channel handles support `emit`, `on`, `onClosed`, and `close`, including bounded early-notification replay and terminal close retention.

INTENT now accepts `invoke(request)` and `open(archetype, payload?, opts?)`, supports `behavior.newWindow`, and returns the canonical structured result with required `ok`, `archetype`, `action`, and `handled` fields. Remove the unmerged URI invocation, `onDelivery`, `intent.deliver`, and acceptance-only result model.

Archetype metadata now emits only the canonical `["archetype", slug, convention]` shape. Remove the draft-only `eventKinds` option and trailing `kind:<number>` fields.
