---
phase: 02-test-infrastructure
plan: 05
status: complete
started: 2026-03-30
completed: 2026-03-30
---

## Summary

Created the shell test harness -- a minimal web page that boots @napplet/shell with mock ShellHooks, loads test napplets into sandboxed iframes, and exposes message tap data for Playwright assertions.

## What was built

- `tests/e2e/harness/harness.ts` - Shell boot logic with mock hooks, message tap, and Playwright API
- `tests/e2e/harness/index.html` - Minimal HTML entry point
- `tests/e2e/harness/vite.config.ts` - Vite config with napplet-serving plugin and CORS headers
- `tests/e2e/harness/package.json` - Workspace package
- `tests/e2e/harness/tsconfig.json` - TypeScript config with @test/helpers path alias

## Key technical challenges solved

1. **Cross-origin postMessage interception**: Sandboxed iframes (no allow-same-origin) prevent monkey-patching Window.prototype.postMessage. Solved with Proxy-based wrapping of originRegistry.getIframeWindow and relay.handleMessage's event.source.
2. **CORS for sandboxed iframes**: Iframes with origin `null` need `Access-Control-Allow-Origin: *` headers to load scripts. Added to Vite server/preview config and napplet file middleware.
3. **Relative asset paths**: Napplets served at `/napplets/{name}/` need relative `./assets/...` paths, not absolute `/assets/...`. Fixed with `base: './'` in napplet vite configs.

## Playwright API exposed

- `window.__SHELL_READY__` - Boolean flag for shell initialization
- `window.__loadNapplet__(name, params)` - Load napplet into sandboxed iframe, returns windowId
- `window.__unloadNapplet__(windowId)` - Remove napplet iframe
- `window.__TEST_MESSAGES__` - Array of captured TappedMessage objects
- `window.__clearMessages__()` - Reset message buffer

## Key files

- `tests/e2e/harness/harness.ts` - Shell test harness
- `tests/e2e/harness/vite.config.ts` - Vite config with napplet serving

## Verification

- Harness builds and serves on port 4173
- Shell boots with real pseudo-relay and mock hooks
- Napplets load in sandboxed iframes and complete AUTH
- Message tap captures all protocol traffic in both directions
