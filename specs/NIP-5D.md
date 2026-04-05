NIP-5D
======

Nostr Web Applets
-----------------

`draft` `optional`

This NIP defines a protocol for sandboxed web applications ("napplets") running
in iframes to communicate with a hosting application ("shell") via postMessage,
using [NIP-01](01.md) wire format. It extends [NIP-5A](5A.md) with a runtime
communication layer for embedded interactive applications.

[NIP-5A](5A.md) defines how static web content is hosted on Nostr.
[NIP-5B](5B.md) defines how applications are discovered. This NIP defines what
happens after the iframe loads: how the embedded application authenticates,
discovers shell capabilities, and communicates.

## Terminology

| Term | Definition |
|------|------------|
| Shell | A web application hosting napplet iframes and acting as a NIP-01 relay proxy |
| Napplet | A sandboxed iframe application communicating with the shell via postMessage |
| dTag | The napplet type identifier from the [NIP-5A](5A.md) manifest `d` tag |
| Aggregate hash | A SHA-256 hash of the napplet's build files per [NIP-5A](5A.md), proving build integrity |
| Delegated key | A deterministic secp256k1 keypair derived by the shell and sent to the napplet for AUTH signing |
| Composite key | The tuple `(dTag, aggregateHash)` uniquely identifying a napplet version |
