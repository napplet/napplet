---
phase: 162-blossom-backed-large-asset-optimization
plan: "06"
subsystem: cli
tags: [cli, blossom, nip-65, bud-01, bud-02, bud-03, bud-11, deno]
dependency_graph:
  requires: [162-04, 162-05]
  provides: [cli-verified-discovery-adapter, cli-exact-byte-upload-adapter]
  affects: [vite-plugin, deployment, asset-optimization]
tech_stack:
  added: []
  patterns: [deno-relay-adapter, deno-network-policy-adapter, fail-closed-upload-reporting]
key_files:
  created: []
  modified:
    - packages/cli/src/suggestions.ts
    - packages/cli/tests/suggestions_test.ts
    - packages/cli/src/blossom-upload.ts
    - packages/cli/src/deploy-network.ts
    - packages/cli/tests/deploy_network_test.ts
    - packages/cli/src/output.ts
    - packages/cli/tests/output_test.ts
key-decisions:
  - "Use the shared verified kind-10002-to-write-relay-to-kind-10063 service; a missing verified list yields no automatic server suggestion."
  - "Adapt the CLI signer to the narrow shared BuildSigner contract and keep all BUD request, authorization, descriptor, redirect, and retry logic in build-tools."
  - "Treat every incomplete direct-upload batch as a failed CLI deployment, while retaining redacted origin-and-hash-only evidence."
requirements-completed: []
coverage:
  - id: D1
    description: "CLI Blossom suggestions use verified NIP-65 write relays and ordered BUD-03 servers without default-server substitution."
    verification:
      - kind: unit
        ref: "packages/cli/tests/suggestions_test.ts#getBlossomServerSuggestions follows verified directory, write-relay, and ordered BUD-03 stages"
        status: pass
    human_judgment: false
  - id: D2
    description: "CLI deployment uploads exact bytes through the shared Blossom client and rejects partial upload batches."
    verification:
      - kind: unit
        ref: "packages/cli/tests/deploy_network_test.ts"
        status: pass
      - kind: unit
        ref: "deno test --allow-all packages/cli/tests"
        status: pass
    human_judgment: false
metrics:
  duration: 8min
  tasks_completed: 2
  files_modified: 7
  completed_date: 2026-08-21
status: complete
---

# Phase 162 Plan 06: CLI Shared Discovery and Upload Migration Summary

The Deno CLI now presents verified NIP-65/BUD-03 discovery and delegates exact-byte Blossom uploads to the same bounded shared client intended for the Vite integration.

## Performance

- **Duration:** 8 min
- **Started:** 2026-08-21T16:43:00Z
- **Completed:** 2026-08-21T16:51:10Z
- **Tasks:** 2/2
- **Files modified:** 7

## Accomplishments

- Replaced the CLI's kind-10063 frequency traversal with a Deno `SimplePool` adapter for verified two-stage discovery: directory relays, newest verified kind 10002, only write/unmarked relays, then newest verified ordered kind 10063.
- Removed CLI-only default Blossom-server substitution; absent verified user discovery now leaves the existing manual selection path in control.
- Replaced duplicate BUD request/auth/descriptor parsing with a Deno DNS/fetch adapter for `uploadExactBlobs`, retaining exact emitted bytes, scoped short-lived authorization, redirect/retry bounds, and redacted evidence.
- Made partial upload batches fail both relay publication and human-readable CLI reporting; a failed redundant relay publish remains only a redundancy warning after complete upload evidence.

## Task Commits

1. **Task 1: Route CLI suggestions through verified two-stage discovery** — `f9e425c1` (TDD regression) and `2dea8ff8` (shared-service adapter).
2. **Task 2: Route CLI deployment uploads through the shared Blossom client** — `1bffafd4` (TDD regression) and `2df10f60` (Deno upload adapter).
3. **Reporting correctness deviation** — `e1909773` (incomplete batch failure reporting).

## Verification

- `deno test --allow-env --allow-read --allow-net packages/cli/tests/suggestions_test.ts` — 5 passed.
- `deno test --allow-all packages/cli/tests/deploy_network_test.ts packages/cli/tests/deploy_plan_test.ts` — 16 passed.
- `deno test --allow-all packages/cli/tests` — 120 passed.
- `deno check --no-lock packages/cli/src/cli.ts` — passed.
- Source/test-output secret scan and `git diff --check` — passed; failure output contains only safe server origins, file paths, hashes, and generic evidence messages.

## Decisions Made

- Preserve the user-controlled manual server choice when the CLI does not have a public key or a verified BUD-03 list; do not invent a default server.
- Inject Deno DNS resolution into the shared public-network policy, which validates all configured endpoints before upload authorization or bytes are sent.
- Keep BUD-04 out of the CLI flow: every configured secondary receives its own direct exact-byte upload.

## Deviations from Plan

### Auto-fixed Issues

1. **[Rule 2 - Missing critical functionality] Report partial uploads as deployment failures**
- **Found during:** Task 2 full CLI suite verification.
- **Issue:** The existing reporting layer still called an incomplete direct-upload batch a redundancy warning, contradicting the new shared batch result and allowing a failed deployment to look complete.
- **Fix:** Required every configured Blossom server to have complete verified evidence before success and updated the terminal report regression.
- **Files modified:** `packages/cli/src/output.ts`, `packages/cli/tests/output_test.ts`, `packages/cli/src/deploy-network.ts`.
- **Verification:** `deno test --allow-all packages/cli/tests` — 120 passed.
- **Committed in:** `e1909773`.

**Total deviations:** 1 auto-fixed (Rule 2).

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Vite integration can use the same `discoverBlossomServers`, `createNetworkPolicy`, and `uploadExactBlobs` services without recreating NIP-65 or BUD behavior.
- CLI deployment now exposes nonfatal discovery absence and fail-closed upload evidence without leaking authorization, response, DNS, or signer/session material.

## Self-Check: PASSED

All seven modified implementation/test files exist and all five 162-06 task commits resolve in repository history.
