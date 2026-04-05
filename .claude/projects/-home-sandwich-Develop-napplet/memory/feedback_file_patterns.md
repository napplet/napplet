---
name: File pattern awareness
description: When presenting options about file placement, understand existing patterns before proposing "extend vs new file" — the codebase often has a clear convention
type: feedback
---

Don't present "extend existing files" vs "new dedicated files" as options when the codebase already has a clear file-per-concern pattern. In @napplet/shim, each concern has its own file (relay-shim.ts, state-shim.ts, nipdb-shim.ts). Adding a new concern means a new file — that IS the existing pattern. Read the file structure before proposing options.

**Why:** User found the options confusing because "extend existing" implied adding to index.ts, when the actual pattern is one file per concern.

**How to apply:** Before presenting file placement options, check the existing file structure. If there's a clear convention, note it and ask only if there's a genuine ambiguity.
