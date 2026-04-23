# Phase 51: Accurate Color Routing - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-03
**Phase:** 51-accurate-color-routing
**Areas discussed:** Directional logic, Persistent state model, Node color derivation

---

## Directional Logic

| Option | Description | Selected |
|--------|-------------|----------|
| ACL node is always split | ACL enforce() is the only failure point | |
| Any node can fail | Track per-node pass/fail, services can fail too | ✓ |
| You decide | Claude determines | |

**User's choice:** Any node can fail. ACL is the primary failure point, but services can also fail (no signer, timeout, not wired). Future firewall nodes could also be failure points.
**Notes:** User emphasized that nodes can fail for different reasons — bugs, inaccessible services — not just ACL.

---

## Persistent State Model

| Option | Description | Selected |
|--------|-------------|----------|
| Rolling window | Last N messages, color = majority | |
| Decay over time | Color fades toward neutral over X seconds | |
| Last-message wins | Edge holds most recent message color | |

**User's choice:** All three as a configurable 3-way toggle. Default = rolling window.
**Notes:** User wanted all three modes available, not a single baked-in behavior.

### Follow-up: Default Mode

| Option | Description | Selected |
|--------|-------------|----------|
| Rolling window | Most informative, shows trends | ✓ |
| Decay over time | Most visually dynamic | |
| Last-message wins | Simplest mental model | |

**User's choice:** Rolling window as default

---

## Node Color Derivation

| Option | Description | Selected |
|--------|-------------|----------|
| Composite of in + out | Single color summarizing all edges | |
| Separate in/out indicators | Two colored dots on node | |
| You decide | Claude picks | |

**User's choice:** Split-border approach — two inner containers forming left/right halves (or top/bottom for vertical edges). Each half shows the accumulated state for its direction. Background-color simulates half-borders so the node looks unified but carries directional information.
**Notes:** User described the implementation approach in detail: container with two 50% width child containers, background-color instead of actual border. Future-proof for vertical edges (top/bottom halves).

---

## Claude's Discretion

- Split-border CSS implementation details
- Persistence mode toggle placement
- Color transition animations
- Multi-direction node handling (e.g. runtime with edges to ACL, services, shell)
- Rolling window size and decay duration default values

## Deferred Ideas

None — discussion stayed within phase scope
