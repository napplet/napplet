---
"@napplet/core": minor
"@napplet/nap": minor
"@napplet/shim": minor
"@napplet/sdk": minor
"@napplet/conformance": minor
"@napplet/vite-plugin": minor
"@napplet/cli": minor
"@napplet/skills": minor
---

Add the `fs` NAP domain — shell-mediated virtual filesystem access ([NAP-FS](https://github.com/napplet/naps/pull/88)).

Ships the eight byte-free operations — `info`, `stat`, `list`, `mkdir`, `remove`, `move`, `watch`, `unwatch` — plus the runtime-pushed `fs.changed` event, reachable through `window.napplet.fs`, `@napplet/nap/fs`, and `@napplet/sdk`. The runtime owns host paths, mounts, backing store, normalization, policy, and authorization; the napplet sees only virtual paths.

Byte transfer (`read` / `write`) is **blocked on an open spec question**, not unfinished work. NAP-FS declares those payloads as CBOR `bstr` but does not define how a `bstr` is encoded on NIP-5D's JSON envelope — the spec's own examples use a `<bytes>` placeholder rather than a concrete encoding. Choosing one here (base64, byte array, or otherwise) would invent wire surface that no other implementation could interoperate with, so the question is deferred upstream: <https://github.com/napplet/naps/pull/88#issuecomment-5083402723>. `FsLimits.maxReadBytes` and `FsLimits.maxWriteBytes` are still present, because the spec makes them required fields of `FsInfo` and they are advisory discovery data rather than operations.
