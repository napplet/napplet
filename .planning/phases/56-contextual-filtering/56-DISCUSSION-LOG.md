# Phase 56: Contextual Filtering - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-04
**Phase:** 56-contextual-filtering
**Areas discussed:** Filter integration, Show-all toggle UX, Empty state
**Mode:** --auto (all decisions auto-selected)

---

## Filter Integration

| Option | Description | Selected |
|--------|-------------|----------|
| getByRole() in constants-panel | Filter using existing query method | ✓ |
| Filter in node-inspector | Keep constants-panel unaware of roles | |
| Duplicate filter in both | Redundant but explicit | |

**User's choice:** [auto] getByRole() in constants-panel (recommended default)
**Notes:** getByRole() already includes globals. Filter to editable-only on top.

---

## Show-All Toggle UX

| Option | Description | Selected |
|--------|-------------|----------|
| Toggle at top of Constants tab | Small button/link that bypasses filtering | ✓ |
| Pin icon (Blender style) | Icon toggle next to tab label | |
| Persistent preference | Remember across sessions | |

**User's choice:** [auto] Toggle at top of Constants tab (recommended default)
**Notes:** Session-scoped, resets on node change. Hidden when no node selected.

---

## Empty State

| Option | Description | Selected |
|--------|-------------|----------|
| Message + Show all link | "No editable constants for [node]" with escape hatch | ✓ |
| Show nearest role's constants | Fall back to parent/related role | |
| Always show globals | Never truly empty | |

**User's choice:** [auto] Message + Show all link (recommended default)
**Notes:** Globals are already included by getByRole(), so truly empty states are rare.

---

## Claude's Discretion

- Toggle visual style
- Count badge on tab
- Role parameter passing mechanism

## Deferred Ideas

None
