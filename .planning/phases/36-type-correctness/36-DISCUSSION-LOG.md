# Phase 36: Type Correctness - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-01
**Phase:** 36-type-correctness
**Areas discussed:** ConsentRequest type field, Shell re-export approach, state-proxy.ts + Phase 34 coordination

---

## ConsentRequest type field

| Option | Description | Selected |
|--------|-------------|----------|
| Keep optional with default | type? stays optional — absence treated as 'destructive-signing'. No callsite changes needed. | ✓ |
| Make required | type becomes required — all creation sites must pass discriminator explicitly. | |
| You decide | Claude picks based on callsite analysis | |

**User's choice:** Keep optional with default.
**Notes:** Backwards-compatible. No existing callsites need to be updated.

---

## Shell re-export approach

| Option | Description | Selected |
|--------|-------------|----------|
| Direct from runtime in index.ts | export type { ConsentRequest } from '@napplet/runtime' | ✓ |
| Route through types.ts | types.ts imports from runtime and re-exports | |

**User's choice:** Direct from runtime in index.ts.
**Notes:** Consistent with how ConsentHandler and enforcement types are already re-exported from upstream packages.

---

## state-proxy.ts + Phase 34 coordination

| Option | Description | Selected |
|--------|-------------|----------|
| Phase 36 just removes it | Phase 34 updates state-proxy.ts per D-09; Phase 36 then removes it | |
| Note in Phase 36 context to skip in Phase 34 | Phase 34 executor skips state-proxy.ts; Phase 36 removes it directly | ✓ |

**User's choice:** Note in Phase 36 context to skip state-proxy.ts in Phase 34.
**Notes:** Avoids updating dead code. Phase 36 CONTEXT.md D-06 documents this coordination explicitly.

---

## Claude's Discretion

- Removal of `as ConsentHandler` cast in `registerConsentHandler` — follows automatically from type unification.

## Deferred Ideas

None.
