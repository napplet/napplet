# Phase 60: Channel Protocol Implementation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-05
**Phase:** 60-channel-protocol-implementation
**Areas discussed:** Shim API shape, Test strategy, Package placement

---

## Shim API Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Object per pipe | open() returns Pipe: { send, close, onMessage, onClose, id }. WebSocket-like. | ✓ |
| Callback-based | open(target, { onMessage, onClose }) returns { send, close, id }. Compact. | |
| You decide | Claude picks based on existing patterns. | |

**User's choice:** Object per pipe
**Notes:** Familiar WebSocket-like pattern.

---

## Test Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Playwright e2e focus | Two napplet iframes, full postMessage path. ~5-8 tests. | |
| Vitest unit + Playwright smoke | Unit test dispatch, one Playwright smoke test. | ✓ |
| You decide | Claude picks based on existing patterns. | |

**User's choice:** Vitest unit + Playwright smoke
**Notes:** "#2 first, #1 later because we need more napplets for the demo, and this will occur in separate milestones."

---

## Package Placement

**User's choice:** Follow existing file-per-concern pattern
**Notes:** User corrected initial framing — "extend existing files" was confusing because the shim already uses one-file-per-concern (relay-shim.ts, state-shim.ts, etc.). New files: pipes-shim.ts, pipe-handler.ts, pipes.ts.

---

## Claude's Discretion

- Pipe object TypeScript interface details
- Pipe registry storage in runtime
- Error handling specifics
- BusKind entries for pipe verbs
- Vitest test case scope

## Deferred Ideas

- Full e2e tests with multiple demo napplets
- MessagePort upgrade
- Binary/ArrayBuffer payloads
