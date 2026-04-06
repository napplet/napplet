# Phase 64: Demo & Test Migration - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

Copy the demo playground and relevant test suite from @napplet to ~/Develop/kehto. Update demo imports to use @kehto/* packages. Verify demo launches and napplets complete AUTH handshake. Copy Playwright e2e and Vitest tests, update imports, verify tests pass.

Source demo: /home/sandwich/Develop/napplet/demo/
Source tests: /home/sandwich/Develop/napplet/packages/*/src/*.test.* and e2e tests
Target: /home/sandwich/Develop/kehto/demo/ and kehto test directories

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — migration phase.

Key rules:
- Demo must work with @kehto packages, not @napplet
- Demo imports of @napplet/shell, @napplet/runtime, @napplet/services, @napplet/acl → @kehto/*
- @napplet/core imports stay as @napplet/core
- Playwright tests that exercise shell/runtime behavior should pass
- Vitest unit tests for runtime/acl/shell/services should pass
- Demo napplets (chat, bot) import @napplet/shim — these stay as-is since shim remains in @napplet
  (napplet-side code uses shim, shell-side code uses @kehto)

</decisions>

<code_context>
## Existing Code Insights

### Demo Structure (in @napplet)
- demo/ contains the host shell demo with topology view, inspector, and napplet loading
- demo/src/ has shell-host.ts (creates ShellBridge), topology rendering, inspector panels
- demo/napplets/ has chat/ and bot/ napplet source (these use @napplet/shim)
- demo/ uses Vite for dev server, UnoCSS for styling

### Test Structure (in @napplet)
- Playwright e2e tests in tests/ or packages/*/tests/
- Vitest unit tests in packages/*/src/*.test.*
- Tests exercise AUTH, relay routing, ACL, storage, IPC, services

### Integration Points
- Demo shell-host.ts imports from @napplet/shell (→ @kehto/shell)
- Demo uses @napplet/runtime types (→ @kehto/runtime)
- Demo services use @napplet/services (→ @kehto/services)
- Napplet iframes import @napplet/shim — this stays as-is

</code_context>

<specifics>
## Specific Ideas

No specific requirements — migration phase.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
