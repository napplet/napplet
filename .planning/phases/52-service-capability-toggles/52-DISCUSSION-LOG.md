# Phase 52: Service & Capability Toggles - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-03
**Phase:** 52-service-capability-toggles
**Areas discussed:** Service toggle UI, Capability toggle UX, Live-reload behavior

---

## Service Toggle UI

### Location

| Option | Description | Selected |
|--------|-------------|----------|
| Policy modal | Services section in Phase 50's modal | |
| Topology node context | Toggle icon on service nodes | |
| Both | Modal + topology node icons | ✓ |

**User's choice:** Both places

### Topology Node Interaction

| Option | Description | Selected |
|--------|-------------|----------|
| Click node to toggle | Single click toggles on/off | |
| Toggle icon on node | Small icon overlay, click icon to toggle | ✓ |
| Inspector button | Toggle in inspector detail view | |

**User's choice:** Toggle icon on node (prevents conflict with inspector selection)

---

## Capability Toggle UX

### Grid Cell Interaction

| Option | Description | Selected |
|--------|-------------|----------|
| Clickable grid cells | Click to cycle granted/denied/default | ✓ |
| Edit mode toggle | View/edit mode switch | |
| You decide | Claude picks | |

**User's choice:** Clickable grid cells — direct inline editing

### Existing Inline Buttons

| Option | Description | Selected |
|--------|-------------|----------|
| Keep both | Inline buttons + modal | ✓ |
| Remove inline, modal only | Single source of truth | |
| You decide | Claude picks | |

**User's choice:** Keep both — inline for quick access, modal for full view
**Notes:** User needed clarification on what "inline toggle buttons" referred to (the small capability buttons rendered above each napplet iframe by acl-panel.ts).

---

## Live-Reload Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Topology + color | Disabled node dims, colors update on next message | ✓ |
| Topology + color + toast | Same plus toast notification | |
| You decide | Claude picks | |

**User's choice:** Topology + color only — no toasts

---

## Claude's Discretion

- Toggle icon design on service nodes
- Services section layout in policy modal
- Sync mechanism between inline buttons and modal cells
- Disabled service node visual treatment
- Grid cell click cycle order

## Deferred Ideas

None — discussion stayed within phase scope
