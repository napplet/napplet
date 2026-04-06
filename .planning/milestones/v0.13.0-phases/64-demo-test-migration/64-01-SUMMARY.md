---
phase: 64-demo-test-migration
plan: 01
subsystem: demo
tags: [vite, unocss, leader-line, cross-repo-links, pnpm-overrides]

requires:
  - phase: 63-package-migration
    provides: "@kehto/shell, @kehto/runtime, @kehto/services packages built and working"
provides:
  - "Demo playground in kehto/apps/demo/ with shell-side @kehto imports"
  - "Chat and bot napplets with preserved @napplet/shim and @napplet/sdk imports"
  - "Cross-repo pnpm overrides for @napplet/{core,shim,sdk,vite-plugin}"
  - "pnpm-workspace.yaml updated with apps/* and apps/demo/napplets/*"
affects: [64-demo-test-migration, kehto-demo]

tech-stack:
  added: [leader-line, qrcode, unocss, "@types/qrcode"]
  patterns: ["cross-repo link for @napplet packages via pnpm overrides"]

key-files:
  created:
    - "apps/demo/package.json"
    - "apps/demo/vite.config.ts"
    - "apps/demo/src/shell-host.ts"
    - "apps/demo/src/main.ts"
    - "apps/demo/napplets/chat/package.json"
    - "apps/demo/napplets/chat/src/main.ts"
    - "apps/demo/napplets/bot/package.json"
    - "apps/demo/napplets/bot/src/main.ts"
  modified:
    - "pnpm-workspace.yaml"
    - "package.json"
    - "pnpm-lock.yaml"

key-decisions:
  - "Removed @napplet/services Vite alias -- workspace resolution handles @kehto/services directly"
  - "Removed stale path aliases in chat/bot vite configs -- cross-repo linked packages resolve via node_modules"
  - "Removed @napplet/shim from demo's direct dependencies -- only chat/bot need it"

patterns-established:
  - "Cross-repo linking: napplet-side packages linked via pnpm overrides in kehto root package.json"
  - "Import boundary: apps/demo/src/ uses @kehto/*, apps/demo/napplets/*/src/ uses @napplet/*"

requirements-completed: [KEHTO-05]

duration: 4min
completed: 2026-04-06
---

# Phase 64 Plan 01: Demo Migration Summary

**Demo playground copied from napplet to kehto with all 21 shell-side TypeScript files rewritten from @napplet to @kehto imports, napplet-side code preserved, and all 3 apps building successfully**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-06T16:50:35Z
- **Completed:** 2026-04-06T16:54:42Z
- **Tasks:** 1
- **Files modified:** 39

## Accomplishments
- Copied entire demo directory tree (21 shell-side TS files, 2 napplet sub-apps, HTML, configs) from napplet to kehto
- Rewrote all shell-side imports from @napplet/{shell,runtime,services} to @kehto/{shell,runtime,services} (16 import statements across 12 files)
- Preserved all napplet-side imports (@napplet/shim, @napplet/sdk) in chat and bot sub-napplets
- Configured cross-repo pnpm overrides for @napplet/{core,shim,sdk,vite-plugin} with absolute link paths
- All three apps build with zero TypeScript errors: @kehto/demo, @kehto/demo-chat, @kehto/demo-bot

## Task Commits

Each task was committed atomically:

1. **Task 1: Copy demo, update workspace, rewrite shell-side imports** - `a6058a5` (feat) [in kehto repo]

**Plan metadata:** (tracked in napplet repo)

## Files Created/Modified
- `apps/demo/package.json` - Demo package renamed to @kehto/demo with @kehto/* shell-side deps
- `apps/demo/vite.config.ts` - Removed stale @napplet/services alias
- `apps/demo/src/shell-host.ts` - Imports from @kehto/shell and @kehto/services
- `apps/demo/src/main.ts` - Imports Capability type from @kehto/shell
- `apps/demo/src/debugger.ts` - Imports BusKind, TOPICS from @kehto/shell
- `apps/demo/src/nip46-client.ts` - Imports Signer type from @kehto/runtime
- `apps/demo/src/signer-connection.ts` - Imports Signer type from @kehto/runtime
- `apps/demo/src/notification-demo.ts` - Imports from @kehto/services and @kehto/shell
- `apps/demo/src/acl-history.ts` - Imports AclCheckEvent from @kehto/shell
- `apps/demo/src/acl-modal.ts` - Imports Capability from @kehto/shell
- `apps/demo/src/acl-panel.ts` - Imports Capability from @kehto/shell
- `apps/demo/src/flow-animator.ts` - Imports BusKind from @kehto/shell
- `apps/demo/src/node-details.ts` - Imports Capability from @kehto/shell
- `apps/demo/src/sequence-diagram.ts` - Imports BusKind, TOPICS from @kehto/shell
- `apps/demo/napplets/chat/package.json` - Renamed to @kehto/demo-chat with cross-repo links
- `apps/demo/napplets/chat/vite.config.ts` - Removed stale path aliases
- `apps/demo/napplets/chat/src/main.ts` - Preserved @napplet/shim and @napplet/sdk imports
- `apps/demo/napplets/bot/package.json` - Renamed to @kehto/demo-bot with cross-repo links
- `apps/demo/napplets/bot/vite.config.ts` - Removed stale path aliases
- `apps/demo/napplets/bot/src/main.ts` - Preserved @napplet/shim and @napplet/sdk imports
- `pnpm-workspace.yaml` - Added apps/* and apps/demo/napplets/*
- `package.json` - Added @napplet/{shim,sdk,vite-plugin} pnpm overrides

## Decisions Made
- Removed @napplet/services Vite alias since @kehto/services resolves via workspace dependency
- Removed path aliases in chat/bot vite configs since cross-repo linked packages resolve via node_modules
- Removed @napplet/shim from demo's direct dependencies since only chat/bot napplets import it

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed stale path aliases from chat/bot vite configs**
- **Found during:** Task 1 (vite config updates)
- **Issue:** Chat and bot vite configs had resolve aliases pointing to `../../../../packages/{shim,sdk}/src/index.ts` which resolved correctly in napplet repo but would resolve to non-existent kehto/packages/shim in kehto
- **Fix:** Removed the resolve.alias blocks entirely; cross-repo linked packages resolve correctly via node_modules
- **Files modified:** apps/demo/napplets/chat/vite.config.ts, apps/demo/napplets/bot/vite.config.ts
- **Verification:** Both napplet sub-apps build successfully
- **Committed in:** a6058a5 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential for correct cross-repo resolution. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Demo is building in kehto -- ready for e2e test migration (64-02)
- All cross-repo links verified working
- Napplet sub-apps (chat, bot) confirmed building with @napplet/shim and @napplet/sdk

## Self-Check: PASSED

- [x] apps/demo/package.json exists in kehto
- [x] apps/demo/src/shell-host.ts exists in kehto
- [x] apps/demo/napplets/chat/src/main.ts exists in kehto
- [x] apps/demo/napplets/bot/src/main.ts exists in kehto
- [x] apps/demo/dist/index.html exists (build output)
- [x] Commit a6058a5 verified in kehto repo
- [x] SUMMARY.md created

---
*Phase: 64-demo-test-migration*
*Completed: 2026-04-06*
