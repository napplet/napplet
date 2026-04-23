---
phase: 01-wiring-fixes
plan: 05
subsystem: testing
tags: [playwright, e2e, smoke-test, AUTH, iframe, postMessage]

requires:
  - phase: 01-wiring-fixes
    provides: source validation (01-01), storage fix (01-02), napplet namespace (01-03), AUTH queue fix (01-04)
provides:
  - E2E smoke test proving standalone shell-shim AUTH handshake
  - Playwright test infrastructure (config, vite dev server, mock hooks)
  - Proof that sandboxed iframe postMessage flow works end-to-end
affects: [02-test-infrastructure]

tech-stack:
  added: ["@playwright/test", "vite (root devDep)", "nostr-tools (root devDep)"]
  patterns: [vite dev server with CORS for sandboxed iframe testing, nappKeyRegistry polling for async AUTH detection]

key-files:
  created:
    - tests/e2e/shell-host.html
    - tests/e2e/test-napplet.html
    - tests/e2e/smoke.spec.ts
    - tests/e2e/vite.config.ts
    - playwright.config.ts
  modified:
    - package.json

key-decisions:
  - "Used nappKeyRegistry.isRegistered() getter to detect AUTH completion instead of intercepting OK messages (OK is sent to iframe, not parent)"
  - "Configured Vite with Access-Control-Allow-Origin: * to allow sandboxed iframe (null origin) to load module scripts"
  - "Did not create separate mock-hooks.ts file -- inline hooks in shell-host.html are simpler for a minimal smoke test"

patterns-established:
  - "E2E test pattern: Vite dev server with CORS headers, shell host HTML with inline mock hooks, sandboxed iframe napplet"
  - "AUTH detection pattern: poll nappKeyRegistry.isRegistered() via Playwright evaluate since AUTH is async"

requirements-completed: [FIX-05]

duration: 10min
completed: 2026-03-30
---

# Plan 01-05: E2E Smoke Test Summary

**Playwright smoke test proves AUTH handshake completes between shell and napplet in real browser with sandboxed iframes and real Schnorr signatures**

## Performance

- **Duration:** 10 min
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Shell host page boots pseudo-relay with mock hooks, creates sandboxed iframe, sends AUTH challenge
- Test napplet loads @napplet/shim, auto-initializes ephemeral keypair, responds to AUTH with signed event
- Shell verifies Schnorr signature via nostr-tools, registers napp in nappKeyRegistry
- Playwright test confirms AUTH completion in ~280ms
- All three packages proven to work standalone without hyprgate reference implementation

## Task Commits

1. **Task 1-3: Create test infrastructure and smoke test** - `39d02b5` (test)

## Files Created/Modified
- `tests/e2e/shell-host.html` - Minimal shell host with inline mock hooks
- `tests/e2e/test-napplet.html` - Minimal napplet with napplet-napp-type meta tag
- `tests/e2e/smoke.spec.ts` - Playwright test asserting AUTH completion
- `tests/e2e/vite.config.ts` - Vite config with CORS and package aliases
- `playwright.config.ts` - Playwright config with Vite webServer
- `package.json` - Added @playwright/test, vite, nostr-tools devDeps and test:e2e script

## Decisions Made
- Used inline mock hooks instead of separate mock-hooks.ts (simpler for minimal smoke test)
- Configured CORS headers on Vite server to allow null-origin sandboxed iframes to load modules
- Used nappKeyRegistry.isRegistered() getter instead of intercepting OK messages (OK goes to iframe not parent)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] CORS configuration for sandboxed iframes**
- **Found during:** Task 3 (Playwright test execution)
- **Issue:** Sandboxed iframe without allow-same-origin has null origin, blocked by Vite's default CORS
- **Fix:** Added `cors: true` and `Access-Control-Allow-Origin: *` headers to Vite config
- **Files modified:** tests/e2e/vite.config.ts
- **Verification:** Test passes, no CORS errors in console
- **Committed in:** 39d02b5

**2. [Rule 3 - Blocking] AUTH completion detection mechanism**
- **Found during:** Task 2 (shell-host.html creation)
- **Issue:** Shell relay sends OK to iframe's contentWindow, not to parent -- parent can't detect AUTH completion via message listener
- **Fix:** Used nappKeyRegistry.isRegistered() getter on window.__TEST__ to poll from Playwright
- **Files modified:** tests/e2e/shell-host.html
- **Verification:** Test reliably detects AUTH completion
- **Committed in:** 39d02b5

**3. [Rule 3 - Blocking] nostr-tools not available at root**
- **Found during:** Task 1 (test infrastructure setup)
- **Issue:** nostr-tools only in workspace packages, not resolvable from tests/e2e/ root
- **Fix:** Added nostr-tools as root devDependency
- **Files modified:** package.json
- **Verification:** Vite resolves import successfully
- **Committed in:** 39d02b5

---

**Total deviations:** 3 auto-fixed (3 blocking)
**Impact on plan:** All fixes necessary for test to work in sandboxed iframe environment. No scope creep.

## Issues Encountered
None beyond the blocking issues above which were resolved inline.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- E2E smoke test proves packages work standalone
- Test infrastructure ready to be extended in Phase 2
- Note: This smoke test is intentionally minimal and disposable per CONTEXT.md D-10

---
*Phase: 01-wiring-fixes*
*Completed: 2026-03-30*
