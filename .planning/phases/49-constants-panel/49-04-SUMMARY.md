---
phase: 49
plan: 4
status: complete
started: 2026-04-03
completed: 2026-04-03
---

# Summary: 49-04 Runtime Config Overrides and Final Integration

## What was built
1. Added `RuntimeConfigOverrides` interface to `@napplet/runtime` with optional `replayWindowSeconds` and `ringBufferSize` fields.
2. Added optional `getConfigOverrides()` method to both `RuntimeAdapter` (runtime) and `ShellAdapter` (shell) interfaces.
3. Modified `createReplayDetector()` to accept an optional `getReplayWindow` getter — the replay window is read lazily on every check.
4. Modified `createEventBuffer()` to accept an optional `getBufferSize` getter — the buffer max is read lazily on every `bufferAndDeliver`.
5. Threaded the overrides through `adaptHooks()` in `@napplet/shell`.
6. Wired `demoConfig` into the demo's shell adapter to provide live config values.
7. Added `demoConfig.subscribe()` in `main.ts` to log config changes to the debugger.

## Key files
- **modified:** `packages/runtime/src/types.ts` — RuntimeConfigOverrides, getConfigOverrides on RuntimeAdapter
- **modified:** `packages/runtime/src/replay.ts` — lazy replay window getter
- **modified:** `packages/runtime/src/event-buffer.ts` — lazy buffer size getter
- **modified:** `packages/runtime/src/runtime.ts` — thread overrides to sub-modules
- **modified:** `packages/runtime/src/index.ts` — export RuntimeConfigOverrides
- **modified:** `packages/shell/src/types.ts` — getConfigOverrides on ShellAdapter
- **modified:** `packages/shell/src/hooks-adapter.ts` — thread getConfigOverrides
- **modified:** `apps/demo/src/shell-host.ts` — wire demoConfig into adapter
- **modified:** `apps/demo/src/main.ts` — subscribe to config changes

## Deviations
- Used lazy getter functions (called on every check/push) rather than static values, giving true live override behavior without runtime recreation. This is a better approach than the plan's initial suggestion of reading once at creation.

## Self-Check: PASSED
- `RuntimeConfigOverrides` exported from `@napplet/runtime`
- `getConfigOverrides` optional on both RuntimeAdapter and ShellAdapter
- Replay detector uses override when provided
- Event buffer uses override when provided
- Demo shell-host provides live values from demoConfig
- All existing parameters remain optional — zero breaking changes
- `pnpm build` and `pnpm type-check` succeed
- 193/196 unit tests pass (3 pre-existing failures unrelated to this phase)
