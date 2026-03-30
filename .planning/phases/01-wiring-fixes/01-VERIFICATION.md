---
status: passed
phase: 01-wiring-fixes
verifier: inline
started: 2026-03-30T15:30:00Z
completed: 2026-03-30T15:32:00Z
---

# Phase 1: Wiring Fixes -- Verification Report

## Phase Goal
The extracted packages work end-to-end standalone with no known security bugs, correct namespacing, and trustworthy message handling.

## Requirements Coverage

| Req ID | Description | Status | Evidence |
|--------|-------------|--------|----------|
| FIX-01 | AUTH race condition fixed | PASS | rejectAuth() helper clears pendingAuthQueue on all 5 rejection paths (pseudo-relay.ts) |
| FIX-02 | Shim postMessage source validation | PASS | 3 guard clauses in index.ts, storage-shim.ts, relay-shim.ts |
| FIX-03 | Storage key comma bug fixed | PASS | Repeated NIP ['key', name] tags replace comma-join/split |
| FIX-04 | Hyprgate renamed to napplet | PASS | 0 'hyprgate' references in any *.ts under packages/ |
| FIX-05 | Packages work e2e standalone | PASS | Playwright smoke test completes AUTH in ~280ms |

## Success Criteria Verification

### 1. Shell creates pseudo-relay, napplet loads shim, AUTH completes, and a round-trip message flows without error
**Status: PASS**
- Evidence: `npx playwright test tests/e2e/smoke.spec.ts` passes in ~280ms
- Shell boots with mock hooks, iframe loads shim, AUTH challenge sent, napplet responds with signed event, shell verifies Schnorr signature, nappKeyRegistry confirms registration

### 2. All hyprgate references in URIs, meta tags, variable names, and localStorage keys are renamed to napplet
**Status: PASS**
- Evidence: `grep -r "hyprgate" packages/*/src/ --include='*.ts'` returns 0 matches
- PSEUDO_RELAY_URI = 'napplet://shell' in both shell and shim types
- Meta tags: napplet-napp-type, napplet-aggregate-hash
- localStorage: napplet:acl, napplet:manifest-cache
- CustomEvents: napplet:audio-changed, napplet:pending-update

### 3. Shim rejects postMessages whose event.source is not window.parent
**Status: PASS**
- Evidence: 3 files contain `event.source !== window.parent` guard clause
  - packages/shim/src/index.ts (handleRelayMessage)
  - packages/shim/src/storage-shim.ts (handleStorageResponse)
  - packages/shim/src/relay-shim.ts (handleMessage)

### 4. Storage proxy correctly handles keys containing commas without data corruption
**Status: PASS**
- Evidence: shell sends `userKeys.map(k => ['key', k])` -- no comma delimiter
- Evidence: shim filters `event.tags?.filter(t => t[0] === 'key')` -- no comma split
- No `join(',')` in storage-proxy.ts, no `split(',')` in storage-shim.ts

### 5. AUTH rejection on any path clears the pending message queue
**Status: PASS**
- Evidence: 5 calls to `rejectAuth()` in pseudo-relay.ts (wrong kind, challenge mismatch, wrong relay, timestamp, invalid sig)
- rejectAuth() does: pendingAuthQueue.delete(windowId), sendOkFail(reason), NOTICE if queue non-empty

## Automated Checks

| Check | Result |
|-------|--------|
| `pnpm build` | PASS -- all 3 packages build successfully |
| `npx playwright test` | PASS -- 1 test, 0 failures |
| `grep -r "hyprgate" packages/*/src/ --include='*.ts'` | 0 matches |
| `grep -c "source !== window.parent" packages/shim/src/*.ts` | 3 matches |
| `grep -c "rejectAuth(" packages/shell/src/pseudo-relay.ts` | 6 (1 def + 5 calls) |

## Summary

All 5 success criteria are met. Phase 1 is complete with:
- 5/5 plans executed
- 5/5 requirements (FIX-01 through FIX-05) verified
- Build passes
- E2E smoke test passes
- Zero known regressions
