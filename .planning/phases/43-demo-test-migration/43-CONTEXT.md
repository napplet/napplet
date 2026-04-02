# Phase 43: Demo & Test Migration - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Update all demo napplets (chat, bot) and test suite (e2e + unit fixtures) to use the new namespaced `window.napplet` API shape from Phase 41 and the `@napplet/sdk` exports from Phase 42. Remove all references to old top-level shim named exports (`subscribe`, `publish`, `emit`, `on`, `nappState`, `nappStorage`, `discoverServices`, etc.). Confirm everything passes end-to-end in a real browser.

</domain>

<decisions>
## Implementation Decisions

### Demo API Pattern

- **D-01:** Demo napplets (chat, bot) use SDK imports: `import { relay, ipc, storage } from '@napplet/sdk'` then `relay.publish()`, `ipc.emit()`, `storage.getItem()`. Demos are teaching tools — SDK imports are the recommended developer path and what most users will copy as a template.
- **D-02:** Demo napplets still need `import '@napplet/shim'` as a side-effect import to install the `window.napplet` global that SDK delegates to. Both imports appear: shim for window installation, SDK for API access.

### Test Fixture Approach

- **D-03:** Test napplets (auth-napplet, publish-napplet) use raw `window.napplet.*` globals, not SDK imports. Test fixtures test protocol behavior, not developer ergonomics. `auth-napplet` already uses side-effect-only `import '@napplet/shim'` and stays as-is. `publish-napplet` changes from `import { publish } from '@napplet/shim'` to `import '@napplet/shim'` + `window.napplet.relay.publish()`.

### Type Import Source

- **D-04:** Demo code imports protocol types from `@napplet/sdk` — the same package they import runtime API from. `import { relay, type EventTemplate } from '@napplet/sdk'`. Single import source keeps demo code clean and simple for developers reading it as a template.
- **D-05:** Test fixture code that needs types imports from `@napplet/core` (since fixtures don't use SDK).

### Claude's Discretion

- **Vite config aliases:** Claude decides how to update `tests/e2e/vite.config.ts` to alias `@napplet/sdk` alongside the existing `@napplet/shim` alias. Straightforward addition following the existing pattern.
- **Test assertion text:** If demo UI strings change (e.g., log messages), Claude updates corresponding e2e test assertions to match.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements

- `.planning/REQUIREMENTS.md` — ECO-01 (demo update), ECO-02 (test update) define the migration scope

### Prior Phase Context

- `.planning/phases/41-shim-restructure/41-CONTEXT.md` — Defines the `window.napplet` shape: `relay`, `ipc`, `services`, `storage` sub-objects; zero named exports from shim
- `.planning/phases/42-sdk-package/42-CONTEXT.md` — Defines SDK exports: `import { relay, ipc, services, storage } from '@napplet/sdk'`; runtime guard throws if window.napplet absent

### Files to Migrate

- `apps/demo/napplets/chat/src/main.ts` — Chat napplet: uses `publish`, `subscribe`, `emit`, `on`, `nappState`, `EventTemplate` from shim
- `apps/demo/napplets/bot/src/main.ts` — Bot napplet: uses `emit`, `on`, `nappState` from shim
- `tests/fixtures/napplets/publish-napplet/src/main.ts` — Test fixture: uses `publish` from shim
- `tests/fixtures/napplets/auth-napplet/src/main.ts` — Test fixture: already side-effect-only import (no change needed)
- `tests/e2e/test-napplet.html` — Already side-effect-only import (verify still works)

### Build/Config Files

- `tests/e2e/vite.config.ts` — Has `@napplet/shim` alias; needs `@napplet/sdk` alias added
- `apps/demo/napplets/chat/vite.config.ts` — May need SDK alias
- `apps/demo/napplets/bot/vite.config.ts` — May need SDK alias

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `tests/e2e/harness/harness.ts` — E2e test harness sends raw postMessage; doesn't use shim API. No migration needed for harness itself.
- `tests/e2e/vite.config.ts` — Existing alias pattern: `'@napplet/shim': path.resolve(__dirname, '../../packages/shim/src/index.ts')` — copy pattern for SDK alias

### Established Patterns

- Demo napplets are standalone Vite apps in `apps/demo/napplets/{name}/` with their own `vite.config.ts`, `package.json`, `src/main.ts`, and `index.html`
- Test fixtures are standalone napplets in `tests/fixtures/napplets/{name}/` — same structure
- E2e tests use Playwright with a shared harness that sets up shell + napplet iframes
- Unit tests in `tests/unit/` test demo components (topology, node details, etc.) — may not reference shim API directly

### Integration Points

- Demo napplet `package.json` files need `@napplet/sdk` added as a dependency (workspace:*)
- Demo napplet vite configs need `@napplet/sdk` alias pointing to source for dev mode
- E2e vite config needs matching alias so test-napplet and fixture builds resolve SDK

</code_context>

<specifics>
## Specific Ideas

- Chat napplet migration example: `import { relay, ipc, storage, type EventTemplate } from '@napplet/sdk'; import '@napplet/shim';` then `relay.publish(template)`, `ipc.emit('chat:message', ...)`, `storage.getItem(HISTORY_KEY)`
- Bot napplet: `import { ipc, storage } from '@napplet/sdk'; import '@napplet/shim';` then `ipc.emit('bot:response', ...)`, `storage.getItem(RULES_KEY)`

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 43-demo-test-migration*
*Context gathered: 2026-04-02*
