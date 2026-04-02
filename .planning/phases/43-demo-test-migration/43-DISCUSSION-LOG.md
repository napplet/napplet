# Phase 43: Demo & Test Migration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-02
**Phase:** 43-demo-test-migration
**Areas discussed:** Demo API pattern, Test fixture approach, Type import source

---

## Demo API Pattern

| Option | Description | Selected |
|--------|-------------|----------|
| SDK imports | `import { relay, ipc, storage } from '@napplet/sdk'`. Showcases the bundler developer path. Demos teach by example. | ✓ |
| Raw window.napplet globals | `import '@napplet/shim'` + `window.napplet.relay.publish()`. More verbose, shows underlying mechanism. | |
| You decide | Claude picks best teaching approach. | |

**User's choice:** SDK imports
**Notes:** Demos are teaching tools — SDK imports are what most developers will actually use.

---

## Test Fixture Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Raw window.napplet globals | Test fixtures test protocol, not ergonomics. Minimal, avoids SDK as a test variable. auth-napplet already side-effect-only. | ✓ |
| SDK imports (same as demo) | Consistent with demos. All napplet code uses SDK. | |
| You decide | Claude picks per-fixture. | |

**User's choice:** Raw window.napplet globals
**Notes:** Test fixtures are about protocol conformance, not developer API showcase.

---

## Type Import Source

| Option | Description | Selected |
|--------|-------------|----------|
| @napplet/sdk | Types from same package as runtime API. Single import source. Simpler for developers reading demo as template. | ✓ |
| @napplet/core | Types from canonical layer. Technically more correct but adds second import source. | |
| You decide | Claude picks based on import cleanliness. | |

**User's choice:** @napplet/sdk
**Notes:** Single import source alongside runtime API keeps demo code clean.

---

## Claude's Discretion

- **Vite config aliases:** Added by Claude following existing pattern
- **Test assertion text:** Updated by Claude to match any changed demo UI strings

## Deferred Ideas

None.
