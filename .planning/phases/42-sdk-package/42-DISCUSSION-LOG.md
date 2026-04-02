# Phase 42: SDK Package - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-02
**Phase:** 42-sdk-package
**Areas discussed:** Runtime guard behavior, Window type augmentation, Sub-path exports, nostr-tools peer dep

---

## Runtime Guard Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Throw with a clear error | Each method checks for window.napplet and throws: "window.napplet not installed — import @napplet/shim first". Immediate, actionable error. | ✓ |
| Caller's responsibility | SDK delegates unconditionally. Native TypeError on undefined. Cryptic error message. | |
| You decide | Claude picks the approach that best matches project conventions. | |

**User's choice:** Throw with a clear error
**Notes:** Best developer experience — immediate, actionable error message.

---

## Window Type Augmentation

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — SDK also augments Window | SDK's .d.ts includes `declare global { interface Window { napplet: NappletGlobal } }`. SDK-only consumers get full autocompletion. | ✓ |
| No — shim exclusively | Only `import '@napplet/shim'` activates window.napplet types. SDK-only users need manual type import. | |
| You decide | Claude decides based on ergonomics for SDK consumers. | |

**User's choice:** Yes — SDK also augments Window
**Notes:** Both shim and SDK point to the same @napplet/core NappletGlobal type — no duplication.

---

## Sub-path Exports

| Option | Description | Selected |
|--------|-------------|----------|
| Single entry point only | `import { relay, ipc } from '@napplet/sdk'` only. Simpler exports map, no maintenance overhead. | ✓ |
| Sub-path exports too | Also expose `@napplet/sdk/relay`, `@napplet/sdk/ipc`, etc. | |
| You decide | Claude picks based on package size and consumer patterns. | |

**User's choice:** Single entry point only
**Notes:** SDK is a thin delegation layer — sub-paths add complexity with no tree-shaking benefit since the whole bundle is tiny.

---

## nostr-tools Peer Dependency

| Option | Description | Selected |
|--------|-------------|----------|
| No peer dep | SDK delegates to window.napplet. Types from @napplet/core. No direct nostr-tools usage. | ✓ |
| Optional peer dep | Add as optional peer for consumer convenience. Signals ecosystem intent. | |
| You decide | Claude decides based on other @napplet packages. | |

**User's choice:** No peer dep
**Notes:** SDK has no direct nostr-tools usage — all nostr operations happen inside shim at runtime.

---

## Claude's Discretion

- **NappletGlobal reference:** Import from `@napplet/core` (carried from Phase 41 decision)
- **Wrapper implementation style:** Static objects with explicit per-method lazy access to window.napplet (simpler, matches codebase convention over Proxy approach)

## Deferred Ideas

None.
