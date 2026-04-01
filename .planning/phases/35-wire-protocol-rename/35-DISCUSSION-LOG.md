# Phase 35: Wire Protocol Rename - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-01
**Phase:** 35-wire-protocol-rename
**Areas discussed:** Deprecated alias, Prose rename target, IPC-* namespace docs

---

## Deprecated Alias

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — ship deprecated alias | BusKind.INTER_PANE stays as a readonly alias pointing to 29003. Same pattern as RuntimeHooks → RuntimeAdapter in Phase 37. Removal in v0.9.0. Safe for hyprgate and any other consumers. | |
| No — clean rename only | Hard rename, no alias. Simpler diff. Justified if BusKind.INTER_PANE is only consumed inside this monorepo and hyprgate can be updated in the same pass. | ✓ |
| You decide | Claude determines alias strategy based on consumer analysis | |

**User's choice:** No deprecated alias — clean rename.
**Notes:** User clarified: hyprgate's migration is not this repo's concern. If hyprgate hits a gap it will self-migrate or open an issue. No backwards-compat shim warranted.

---

## Prose Rename Target

| Option | Description | Selected |
|--------|-------------|----------|
| IPC peer (lowercase, readable) | "IPC peer event", "IPC peer subscription" — natural in sentence flow. | |
| IPC-PEER (exact term) | "IPC-PEER event", "IPC-PEER subscription" — mechanical copy of constant name. | ✓ |
| You decide | Claude picks the most readable form per context | |

**User's choice:** IPC-PEER (exact term).
**Notes:** Consistency with the constant name preferred over prose readability.

---

## IPC-* Namespace Docs

| Option | Description | Selected |
|--------|-------------|----------|
| SPEC.md only | Single canonical location; constants.ts keeps brief JSDoc note pointing to SPEC.md. | |
| constants.ts JSDoc + SPEC.md | Full IPC-* family table in both places. | ✓ |
| constants.ts only | Expand BusKind JSDoc, skip SPEC.md section. | |

**User's choice:** constants.ts JSDoc + SPEC.md (dual location).

**Follow-up — detail level in constants.ts JSDoc:**

| Option | Description | Selected |
|--------|-------------|----------|
| Brief table | IPC_PEER (current) \| IPC_BROADCAST (reserved) \| IPC_CHANNEL (reserved) — one-liner each. Points to SPEC.md. | ✓ |
| Full description | Each entry gets a sentence explaining what it will do when implemented. | |

**User's choice:** Brief table.

---

## Claude's Discretion

- SPEC.md combined pass scope (inherited from Phase 34 D-07) — already locked, not re-discussed.

## Deferred Ideas

None.
