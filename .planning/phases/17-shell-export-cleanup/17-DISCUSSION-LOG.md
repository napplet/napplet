# Phase 17: Shell Export Cleanup - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-31
**Phase:** 17-shell-export-cleanup
**Areas discussed:** Dead export removal, Enforce.ts deduplication, Singleton export policy
**Mode:** Auto (--auto flag)

---

## Dead Export Removal

| Option | Description | Selected |
|--------|-------------|----------|
| Remove re-exports only | Remove from index.ts, keep state-proxy.ts for internal use | ✓ |
| Delete state-proxy.ts entirely | Remove the file and all its functions | |
| Deprecate with JSDoc | Add @deprecated tags and keep exports for one version | |

**User's choice:** [auto] Remove re-exports only (recommended default)
**Notes:** No consumer imports handleStateRequest or cleanupNappState from @napplet/shell. Runtime's versions are the live code paths.

---

## Enforce.ts Deduplication

| Option | Description | Selected |
|--------|-------------|----------|
| Re-export from runtime | Delete shell's enforce.ts, re-export from @napplet/runtime | ✓ |
| Keep duplicate, add tests | Keep both copies but add tests to shell's version | |
| Merge differences | Compare copies and merge any unique logic | |

**User's choice:** [auto] Re-export from runtime (recommended default)
**Notes:** Shell's enforce.ts is a verbatim copy of runtime's. Integration tests already import from @napplet/runtime. No reason to maintain two copies.

---

## Singleton Export Policy

| Option | Description | Selected |
|--------|-------------|----------|
| Keep active, remove empty | Keep originRegistry/audioManager/manifestCache, remove nappKeyRegistry/aclStore | ✓ |
| Remove all singletons | Force consumers to access everything through ShellBridge | |
| Keep all, add docs | Keep exports but add JSDoc warnings about empty state | |

**User's choice:** [auto] Keep active, remove empty (recommended default)
**Notes:** originRegistry and audioManager are actively used. nappKeyRegistry and aclStore are empty after Phase 14 rewire — runtime owns those instances.

## Claude's Discretion

- Clean break preferred (delete, don't deprecate) since this is pre-1.0
- Evaluate state-proxy.ts deletion after removing exports

## Deferred Ideas

- SVC-01 migration to RuntimeHooks (v0.4.0 scope)
