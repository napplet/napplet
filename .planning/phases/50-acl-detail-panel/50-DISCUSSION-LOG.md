# Phase 50: ACL Detail Panel - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-03
**Phase:** 50-acl-detail-panel
**Areas discussed:** Event context gap, Panel integration, History & retention, Capability display

---

## Event Context Gap

| Option | Description | Selected |
|--------|-------------|----------|
| Full NIP-01 message | Include complete raw message array | |
| Summarized context | Include kind, topic tag, content preview | |
| You decide | Claude picks balance | |

**User's choice:** Summarized context by default, but with expandable detail view and "raw" toggle for the full message.
**Notes:** User wants both — summarized for scanning, raw for investigating. Store full message, render summary.

---

## Panel Integration

| Option | Description | Selected |
|--------|-------------|----------|
| Inspector tab | New 'ACL' tab in inspector | |
| Node drill-down | ACL node drill-down + napplet node drill-down | |
| Both places | ACL node = system-wide, napplet node = per-napplet | ✓ |

**User's choice:** Both places — ACL node = policy, napplet node = activity

### Follow-up: View Split

| Option | Description | Selected |
|--------|-------------|----------|
| ACL = policy, Napplet = activity | ACL shows capability policies, napplet shows rejection history | ✓ |
| ACL = all rejections, Napplet = its own | ACL shows global log, napplet shows filtered | |
| You decide | Claude picks | |

**User's choice:** ACL = policy, Napplet = activity

### Follow-up: Policy View Layout

**User's clarification:** Neither cards nor vertical lists fit in the narrow right-side inspector panel. The policy view needs a **modal** that can be opened from the panel and/or the ACL node itself.

| Option | Description | Selected |
|--------|-------------|----------|
| Grid/table in modal | Full permission matrix with room to breathe | ✓ |
| Cards in modal | Per-napplet collapsible cards | |
| You decide | Claude picks | |

**User's choice:** Grid/table in modal

---

## History & Retention

| Option | Description | Selected |
|--------|-------------|----------|
| Ring buffer (50) | Keep last 50 ACL events per napplet | |
| Ring buffer (100) | Keep last 100 per napplet | |
| Configurable via constants panel | Default 50, editable in Phase 49's constants panel | ✓ |

**User's choice:** Configurable via constants panel

---

## Capability Display

Resolved during Panel Integration discussion — policy modal uses grid/table format (rows=napplets, columns=capabilities, cells=granted/denied/default).

---

## Claude's Discretion

- Compact ACL summary in inspector when ACL node selected
- Napplet rejection history row layout
- Modal styling and transitions
- Modal trigger mechanism (click node, button in inspector, or both)

## Deferred Ideas

None — discussion stayed within phase scope
