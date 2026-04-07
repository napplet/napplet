# Phase 80: Namespaced Capability Query - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-08
**Phase:** 80-namespaced-capability-query
**Areas discussed:** Bare string handling

---

## Bare String Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Force prefix always | Only `nub:relay` works. Clean, unambiguous, no guessing. | |
| Allow bare NUB shorthand | Both `'relay'` and `'nub:relay'` accepted. Ergonomic but two ways to do same thing. | ✓ |

**User's choice:** Allow bare NUB shorthand
**Notes:** Bare strings only for known NUB domains. Permissions and services always require prefix.

---

## Claude's Discretion

- Whether to export the `NamespacedCapability` type alias or keep it inline
- JSDoc example ordering and formatting

## Deferred Ideas

None — discussion stayed within phase scope.
