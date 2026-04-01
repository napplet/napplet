# Phase 37: API Alignment - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Rename the top-level integration interfaces (`RuntimeHooks` → `RuntimeAdapter`, `ShellHooks` → `ShellAdapter`) with deprecated aliases for one release cycle. Rename runtime sub-interfaces to drop the `Runtime` prefix. Shell sub-interfaces keep their `*Hooks` suffix unchanged.

Does NOT add new capabilities, change method signatures, or touch wire protocol.

</domain>

<decisions>
## Implementation Decisions

### Top-level renames — ship deprecated aliases
- **D-01:** `RuntimeHooks` → `RuntimeAdapter` in `@napplet/runtime`. Deprecated alias ships: `export type RuntimeHooks = RuntimeAdapter` with `@deprecated Use RuntimeAdapter` JSDoc. Removal scheduled for v0.9.0.
- **D-02:** `ShellHooks` → `ShellAdapter` in `@napplet/shell`. Deprecated alias ships: `export type ShellHooks = ShellAdapter` with `@deprecated Use ShellAdapter` JSDoc. Removal scheduled for v0.9.0.

### Runtime sub-interfaces — clean rename, no deprecated aliases
- **D-03:** All `Runtime*` prefixed sub-interfaces in `@napplet/runtime/src/types.ts` are renamed by dropping the `Runtime` prefix. For `*Hooks` suffix interfaces, `Hooks` is replaced with `Adapter`. For non-`Hooks` suffix interfaces, the existing suffix is preserved.
- **D-04:** No deprecated aliases for sub-interfaces — they are implementation details of `RuntimeHooks`/`RuntimeAdapter`. Code importing sub-interfaces directly is rare enough that clean rename is appropriate.

### Complete runtime sub-interface rename map
| Current | Renamed To |
|---------|-----------|
| `RuntimeRelayPoolHooks` | `RelayPoolAdapter` |
| `RuntimeCacheHooks` | `CacheAdapter` |
| `RuntimeAuthHooks` | `AuthAdapter` |
| `RuntimeConfigHooks` | `ConfigAdapter` |
| `RuntimeHotkeyHooks` | `HotkeyAdapter` |
| `RuntimeCryptoHooks` | `CryptoAdapter` |
| `RuntimeWindowManagerHooks` | `WindowManagerAdapter` |
| `RuntimeRelayConfigHooks` | `RelayConfigAdapter` |
| `RuntimeDmHooks` | `DmAdapter` |
| `RuntimeAclPersistence` | `AclPersistence` |
| `RuntimeManifestPersistence` | `ManifestPersistence` |
| `RuntimeStatePersistence` | `StatePersistence` |
| `RuntimeSigner` | `Signer` |

### Shell sub-interfaces — keep `*Hooks` suffix
- **D-05:** Shell sub-interfaces (`RelayPoolHooks`, `AuthHooks`, `ConfigHooks`, `HotkeyHooks`, `CryptoHooks`, `DmHooks`, `RelayConfigHooks`, `WindowManagerHooks`) keep their existing `*Hooks` suffix. They are NOT renamed to `*Adapter`.
- **D-06:** Rationale: shell sub-interfaces describe what the host app *provides* (injection points / callbacks). Runtime sub-interfaces describe what the protocol engine *requires* (environment abstraction contracts). Different semantic role → different suffix. Also prevents naming collision: `RelayPoolAdapter` (runtime) vs `RelayPoolHooks` (shell) are self-evidently from different packages.

### Deprecation schedule
- **D-07:** Deprecated aliases (`RuntimeHooks`, `ShellHooks`) are removed in v0.9.0. This must be documented in JSDoc on the alias AND in the CHANGELOG.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — API-01, API-02, API-03 define acceptance criteria for this phase

### Key Source Files
- `packages/runtime/src/types.ts` — `RuntimeHooks` interface (line 477) and all 13 `Runtime*` sub-interfaces (lines 60-224)
- `packages/runtime/src/runtime.ts` — `createRuntime(hooks: RuntimeHooks)` entry point (line 135); imports from types
- `packages/runtime/src/test-utils.ts` — `createMockRuntimeHooks()` and `MockRuntimeContext` type (lines 33, 175, 190)
- `packages/runtime/src/index.ts` — exports `RuntimeHooks` and sub-interfaces (line 5+)
- `packages/shell/src/types.ts` — `ShellHooks` interface (line 228) and shell sub-interfaces
- `packages/shell/src/hooks-adapter.ts` — imports all `Runtime*` sub-interfaces (lines 11-24); `adaptHooks(shellHooks: ShellHooks): RuntimeHooks` signature (line 73)
- `packages/shell/src/shell-bridge.ts` — `createShellBridge(hooks: ShellHooks)` (line 137)
- `packages/shell/src/index.ts` — exports `ShellHooks` and shell sub-interfaces (lines 22-33)

</canonical_refs>

<code_context>
## Existing Code Insights

### Established Patterns
- `export type RuntimeHooks = RuntimeAdapter` deprecated alias pattern — same TypeScript idiom already used in `packages/runtime/src/types.ts` for `NappKeyEntry = SessionEntry` (line 346); follow that exact pattern
- `@deprecated` JSDoc already used in shim (`nappState`, `nappStorage`) — use the same format

### Integration Points
- `hooks-adapter.ts` signature changes twice: parameter type `ShellHooks` → `ShellAdapter`, return type `RuntimeHooks` → `RuntimeAdapter`; also all local variable types (`const relayPool: RuntimeRelayPoolHooks` → `const relayPool: RelayPoolAdapter`)
- `test-utils.ts` function `createMockRuntimeHooks()` → `createMockRuntimeAdapter()` (or keep old name with deprecated alias — Claude's discretion)
- Sub-interface renames in `types.ts` ripple into `hooks-adapter.ts` (imports + local variable types) — update both in the same wave

</code_context>

<specifics>
## Specific Ideas

- The `NappKeyEntry = SessionEntry` pattern in `runtime/src/types.ts` line 346 is the exact template for deprecated aliases — `export type RuntimeHooks = RuntimeAdapter`.
- The split between "shell sub-interfaces keep Hooks" and "runtime sub-interfaces become Adapter" is intentional and semantic — it should be documented briefly in the types file so future contributors understand the distinction.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 37-api-alignment*
*Context gathered: 2026-04-01*
