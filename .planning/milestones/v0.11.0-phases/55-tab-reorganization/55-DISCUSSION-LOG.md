# Phase 55: Tab Reorganization - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-04
**Phase:** 55-tab-reorganization
**Areas discussed:** Tab labels/layout, Kinds card design, Polling timer guard
**Mode:** --auto (all decisions auto-selected)

---

## Tab Labels and Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Node / Constants / Kinds | Standard 3-tab split | ✓ |
| Node / Editable / Reference | Alternative labels emphasizing editability | |
| Node / Config / Protocol | Alternative labels emphasizing domain | |

**User's choice:** [auto] Node / Constants / Kinds (recommended default)
**Notes:** Short labels fit 280px tab bar. "Constants" is already familiar from v0.10.0.

---

## Kinds Card Design

| Option | Description | Selected |
|--------|-------------|----------|
| Compact reference cards | Label + value + description, no edit controls | ✓ |
| Simple table | Rows with label and value columns | |
| Grouped by function | Cards grouped by protocol area (auth, bus, discovery) | |

**User's choice:** [auto] Compact reference cards (recommended default)
**Notes:** Consistent with existing inspector card-based styling.

---

## Polling Timer Guard

| Option | Description | Selected |
|--------|-------------|----------|
| Guard by active tab | Only re-render on Node tab, skip Constants/Kinds | ✓ |
| Debounce all tabs | Add debounce to all tab re-renders | |
| Remove polling entirely | Switch to event-driven updates only | |

**User's choice:** [auto] Guard by active tab (recommended default)
**Notes:** Simplest fix. Node tab needs polling for live data. Constants/Kinds are static until user edits.

---

## Claude's Discretion

- Kinds tab module structure (new file vs inline)
- CSS styling for reference cards
- Search/filter carry-over

## Deferred Ideas

None
