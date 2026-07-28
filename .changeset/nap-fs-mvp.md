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

Ships the virtual filesystem operations — `info`, `pickFile`, `pickFiles`, `pickDirectory`, `pickSaveFile`, `stat`, `list`, `read`, `write`, `mkdir`, `remove`, `move`, `watch`, `unwatch` — plus the runtime-pushed `fs.changed` event, reachable through `window.napplet.fs`, `@napplet/nap/fs`, and `@napplet/sdk`. The runtime owns host paths, mounts, backing store, normalization, policy, and authorization; the napplet sees only virtual paths.

Byte transfer uses RFC 4648 standard padded base64 text for `fs.write.data` and `FsReadResult.data` on the JSON wire. `FsLimits.maxReadBytes`, `FsLimits.maxWriteBytes`, byte range options, and read/write result counts refer to decoded bytes.
