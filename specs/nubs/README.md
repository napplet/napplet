NUB: Napplet Unified Blueprints
===============================

NUBs extend [NIP-5D](../NIP-5D.md) with interface and protocol specifications
for the napplet ecosystem. The core NIP defines transport, authentication, and
security. Everything else -- relay access, storage, signing, IPC, pipes, message
protocols -- is a NUB.

## Two Tracks

### NUB-WORD (Interface Specs)

Named by a single uppercase word. One canonical spec per name. Defines
shell-provided API contracts -- what shows up on `window.napplet.*` or
`window.nostr` or `window.nostrdb`. The shell implements these; napplets
consume them. Discovery: `shell.supports("NUB-RELAY")`.

| NUB ID | Namespace | Description | Status |
|--------|-----------|-------------|--------|
| [NUB-RELAY](NUB-RELAY.md) | `window.napplet.relay` | NIP-01 relay proxy | Draft |
| [NUB-STORAGE](NUB-STORAGE.md) | `window.napplet.storage` | Scoped key-value storage | Draft |
| [NUB-SIGNER](NUB-SIGNER.md) | `window.nostr` | NIP-07 signer proxy | Draft |
| [NUB-NOSTRDB](NUB-NOSTRDB.md) | `window.nostrdb` | Local event database | Draft |
| [NUB-IPC](NUB-IPC.md) | `window.napplet.ipc` | Inter-napplet pub/sub | Draft |
| [NUB-PIPES](NUB-PIPES.md) | `window.napplet.pipes` | Authenticated point-to-point connections | Draft |

### NUB-NN (Message Protocol Specs)

Numbered sequentially (NUB-01, NUB-02, etc.). Multiple competing specs allowed
per domain. Defines event semantics -- what napplets agree on with each other.
Napplets negotiate via `shell.supports("NUB-RELAY", "NUB-02")`. Example domains:
feed rendering, chat, collaborative editing.

## Boundary Rule

An interface (NUB-WORD) is **shell-provided** AND defines an **API surface**. A
protocol (NUB-NN) is **napplet-agreed** AND defines **event semantics**. Both
criteria must apply. Edge cases are judged pragmatically by the maintainer.

## Governance

NIP-style informal process:

- Fork this repo, add a markdown file following the appropriate template, open a
  PR.
- Community discusses via PR comments.
- Maintainer (dskvr) merges when the spec makes sense and has at least one
  implementation.
- No formal stages, review committees, or voting.
- NUB-WORD names are first-come-first-served but must be approved by the
  maintainer.
- NUB-NN numbers are assigned sequentially on merge.

## Templates

- Interface proposals: Use [TEMPLATE-WORD.md](TEMPLATE-WORD.md)
- Protocol proposals: Use [TEMPLATE-NN.md](TEMPLATE-NN.md)

## References

- Core protocol: [NIP-5D](../NIP-5D.md)
- Reference implementation: [@napplet packages](https://github.com/sandwichfarm/napplet)
- Reference shell: [hyprgate](https://github.com/sandwichfarm/hyprgate)
