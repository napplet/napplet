# Phase 49: Constants Panel - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-03
**Phase:** 49-constants-panel
**Areas discussed:** Panel placement, Constant grouping, Edit mechanics, Runtime plumbing

---

## Panel Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Inspector tab | Add a 'Constants' tab to the existing right-side inspector | ✓ |
| Toolbar/gear icon | Gear icon in top bar opens constants panel | |
| Dedicated sidebar section | Always-visible section below topology | |

**User's choice:** Inspector tab
**Notes:** Keeps UI consistent with existing Phase 29 inspector pattern.

### Follow-up: Tab Visibility

| Option | Description | Selected |
|--------|-------------|----------|
| Always visible tab | Constants tab always available alongside node tabs | |
| Default/home tab | Shows when no node selected, switches on node click | |
| You decide | Claude picks best UX approach | ✓ |

**User's choice:** You decide

---

## Constant Grouping

### Organization

| Option | Description | Selected |
|--------|-------------|----------|
| By domain | Group by function: Timeouts, Sizes/Limits, UI Timing, Protocol | |
| By package | Group by source: core, runtime, shell, services, acl, demo | |
| Flat with search | Single alphabetical list with filter | |

**User's choice:** By package by default, ability to switch grouping to domain or flat. Search filter for all (minisearch).
**Notes:** User wanted all three modes available with package as default.

### Editability

| Option | Description | Selected |
|--------|-------------|----------|
| Read-only for protocol | Protocol constants shown but not editable | ✓ |
| All editable with warning | Everything editable, warnings on protocol constants | |
| All editable, no guard | Full sandbox, no restrictions | |

**User's choice:** Read-only for protocol

---

## Edit Mechanics

### Input Controls

| Option | Description | Selected |
|--------|-------------|----------|
| Number inputs only | Simple number input fields with step buttons | |
| Number + slider | Number input with adjacent range slider for scrubbing | ✓ |
| Inline editable text | Click value to edit inline (contenteditable) | |

**User's choice:** Number + slider

### Reset Options

| Option | Description | Selected |
|--------|-------------|----------|
| Per-constant reset | Each constant has a small reset icon | |
| Global reset button | One 'Reset All' button at top | |
| Both | Per-constant reset + global Reset All | ✓ |

**User's choice:** Both

### Change Feedback

| Option | Description | Selected |
|--------|-------------|----------|
| Flash highlight | Changed row briefly flashes green | ✓ |
| Toast notification | Small toast with constant name and new value | |
| Badge on modified | Modified constants get colored dot | |
| You decide | Claude picks | |

**User's choice:** Flash highlight

### Modified Indicator

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, dot/badge | Persistent colored indicator for modified values | ✓ |
| No, flash is enough | Just the flash | |
| Yes, different color | Modified values in different text color | |

**User's choice:** Yes, dot/badge

---

## Runtime Plumbing

### Config Object Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Global config object | Demo creates mutable config, packages read via getConfig() | ✓ |
| Demo-only overrides | Monkey-patch at demo layer | |
| You decide | Claude picks | |

**User's choice:** Global config object

### Config Location

**User's choice:** Mutable config object in `@napplet/runtime` (not core — napplets don't need it). Shell and higher packages read from it.
**Notes:** User clarified: "This should not be in core because the napplets don't need it. However, it should be a mutable object, and we should be able to configure packages shell and higher."

---

## Claude's Discretion

- Inspector tab visibility behavior (always-visible vs default/home)
- Slider min/max bounds per constant
- Grouping labels and sort order
- RuntimeAdapter integration approach for config object

## Deferred Ideas

None — discussion stayed within phase scope
