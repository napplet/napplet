# Phase 53: Per-Message Trace Mode - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-03
**Phase:** 53-per-message-trace-mode
**Areas discussed:** Animation mechanics, Toggle interaction, Message queue behavior

---

## Animation Mechanics

### Style

| Option | Description | Selected |
|--------|-------------|----------|
| Edge color sweep | Edge segments light up sequentially along the path | ✓ |
| Moving indicator dot | Small circle travels along LeaderLine curves | |
| Node pulse cascade | Nodes pulse in sequence with delay | |

**User's choice:** Edge color sweep

### Node Highlighting

| Option | Description | Selected |
|--------|-------------|----------|
| Edges + node flash | Nodes briefly highlight as sweep reaches them | |
| Edges only | Only edges animate, nodes stay in persistent state | ✓ |
| You decide | Claude picks | |

**User's choice:** Edges only

---

## Toggle Interaction

| Option | Description | Selected |
|--------|-------------|----------|
| 4th mode | Trace becomes 4th option in Phase 51's color toggle | ✓ |
| Separate toggle | Independent on/off overlaying persistence modes | |
| You decide | Claude picks | |

**User's choice:** 4th mode in the persistence toggle

---

## Message Queue Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Overlap gracefully | Multiple animations run simultaneously | ✓ |
| Queue and play sequentially | One at a time, queue the rest | |
| Drop older, show latest | Cancel old animation for new | |

**User's choice:** Overlap gracefully

---

## Claude's Discretion

- Sweep animation duration and easing per hop
- How overlapping animations blend on same edge
- Edge revert timing after sweep completes
- Toggle label text

## Deferred Ideas

None — discussion stayed within phase scope
