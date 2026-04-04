# Phase 54: Data Layer - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-04
**Phase:** 54-data-layer
**Areas discussed:** Role mapping, Cross-cutting constants, Demo globals
**Mode:** --auto (all decisions auto-selected)

---

## Role Mapping

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit relevantRoles array | Each ConstantDef gets a TopologyNodeRole[] field | ✓ |
| Derive from pkg field | Map pkg names to roles automatically | |
| Hybrid (derive + override) | Derive from pkg, allow per-entry overrides | |

**User's choice:** [auto] Explicit relevantRoles array (recommended default)
**Notes:** Research unanimously recommended explicit mapping. The pkg-to-role mapping is lossy (e.g., core.REPLAY_WINDOW_SECONDS is in core pkg but relevant to runtime+acl).

---

## Cross-Cutting Constants

| Option | Description | Selected |
|--------|-------------|----------|
| Multi-role array | List all relevant roles, empty = global | ✓ |
| Primary role only | Each constant maps to exactly one role | |
| Role + "also relevant" | Primary role + secondary roles distinction | |

**User's choice:** [auto] Multi-role array (recommended default)
**Notes:** Some constants genuinely span multiple roles. Empty array for globals is clean and simple.

---

## Demo Globals

| Option | Description | Selected |
|--------|-------------|----------|
| Global (empty array) | Demo timing constants shown for all nodes | ✓ |
| Map to closest role | Flash duration → service, toast → shell, etc. | |
| Separate "demo" role | New TopologyNodeRole for demo chrome | |

**User's choice:** [auto] Global (empty array) (recommended default)
**Notes:** Demo UI constants affect the chrome, not specific protocol nodes. Forcing them into roles would be misleading.

---

## Claude's Discretion

- getKindsDefs() convenience method
- Sort order within query results
- TopologyNodeRole import strategy

## Deferred Ideas

None
