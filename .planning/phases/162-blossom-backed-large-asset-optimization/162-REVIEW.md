---
phase: 162-blossom-backed-large-asset-optimization
reviewed: 2026-08-21T18:43:30Z
depth: standard
files_reviewed: 49
files_reviewed_list:
  - packages/build-tools/src/blossom.test.ts
  - packages/build-tools/src/blossom.ts
  - packages/build-tools/src/contracts.ts
  - packages/build-tools/src/discovery.test.ts
  - packages/build-tools/src/discovery.ts
  - packages/build-tools/src/index.ts
  - packages/build-tools/src/network-policy.test.ts
  - packages/build-tools/src/network-policy.ts
  - packages/build-tools/src/secret-store.test.ts
  - packages/build-tools/src/secret-store.ts
  - packages/build-tools/src/signer.test.ts
  - packages/build-tools/src/signer.ts
  - packages/build-tools/src/terminal.test.ts
  - packages/build-tools/src/terminal.ts
  - packages/build-tools/tsup.config.ts
  - packages/cli/src/blossom-upload.ts
  - packages/cli/src/deploy-network.ts
  - packages/cli/src/deploy-signer-remote.ts
  - packages/cli/src/deploy-signer.ts
  - packages/cli/src/key-store.ts
  - packages/cli/src/nostr-connect-terminal.ts
  - packages/cli/src/nostr-connect.ts
  - packages/cli/src/output.ts
  - packages/cli/src/suggestions.ts
  - packages/cli/tests/deploy_network_test.ts
  - packages/cli/tests/deploy_signer_test.ts
  - packages/cli/tests/key_store_test.ts
  - packages/cli/tests/nostr_connect_test.ts
  - packages/cli/tests/output_test.ts
  - packages/cli/tests/suggestions_test.ts
  - packages/vite-plugin/src/html.ts
  - packages/vite-plugin/src/index.test.ts
  - packages/vite-plugin/src/index.ts
  - packages/vite-plugin/src/manifest.ts
  - packages/vite-plugin/src/optimizer/large-fixture.test.ts
  - packages/vite-plugin/src/optimizer/large-fixture.ts
  - packages/vite-plugin/src/optimizer/loader.test.ts
  - packages/vite-plugin/src/optimizer/loader.ts
  - packages/vite-plugin/src/optimizer/node-services.test.ts
  - packages/vite-plugin/src/optimizer/node-services.ts
  - packages/vite-plugin/src/optimizer/pipeline.test.ts
  - packages/vite-plugin/src/optimizer/pipeline.ts
  - packages/vite-plugin/src/optimizer/references.test.ts
  - packages/vite-plugin/src/optimizer/references.ts
  - packages/vite-plugin/src/optimizer/security.test.ts
  - packages/vite-plugin/src/requirements.ts
  - packages/vite-plugin/src/types.ts
  - scripts/check-build-secret-leaks.mjs
  - scripts/check-build-secret-leaks.test.mjs
findings:
  critical: 2
  warning: 3
  info: 0
  total: 5
status: issues_found
---

# Phase 162: Code Review Report

**Reviewed:** 2026-08-21T18:43:30Z
**Depth:** standard
**Files Reviewed:** 49
**Status:** issues_found

## Summary

This re-review verified the original findings against the repaired implementation. The deploy input is now hashed before upload, the automatic Node/global-fetch path is disabled without a connection-pinning adapter, and the private resource loader is limited to the existing resource domain rather than adding a wire protocol surface. EOF now rejects terminal input, and relay URL normalization preserves non-root paths. However, deployment can still always reject valid BUD-03 suggestions because it compares incompatible server spellings, and secrets are still sent in process argument vectors on supported macOS and CLI Windows paths. The phase also retains three robustness/test-reliability defects below.

The scoped unit suites were executed successfully:

- `pnpm --filter @napplet/build-tools test:unit` (23 passed)
- `pnpm --filter @napplet/vite-plugin test:unit` (75 passed)
- `pnpm --filter @napplet/cli test:unit` (122 passed)

## Narrative Findings (AI reviewer)

The earlier CR-01, CR-02, and relay-path portion of WR-02 are resolved in the reviewed code. CR-03's final output rewrite is present and does not invent NIP-5D/NAP protocol surface, but its claimed end-to-end fixture proof is not real execution. CR-04 is only partially addressed: Windows was disabled in the build-tools store, while secrets remain exposed by macOS build tooling and the actual CLI providers. The prior signer identity check exists in the terminal pairing path, but the separately exported build signer still does not bind its response to the configured remote public key.

## Critical Issues

### CR-01: [BLOCKER] Valid Blossom server URLs never satisfy upload completeness

**File:** `packages/cli/src/blossom-upload.ts:116-123,186-192`; `packages/cli/src/deploy-network.ts:155-161`; `packages/cli/src/suggestions.ts:98-107`

**Issue:** Upload evidence is converted to `new URL(server).origin`, while completion compares that value with the original configured string. The normal BUD-03 discovery/suggestion path returns a URL serialization such as `https://one.example/`, but evidence becomes `https://one.example`; therefore no successful evidence matches that server and `serversFullyUploaded` remains zero. Relay publication is then skipped for a fully successful batch. This also loses any configured endpoint path before reporting/evidence matching, contrary to the per-server/path/hash completeness requirement.

**Fix:** Define one canonical endpoint identity that retains the full URL (for example, `new URL(value).toString()`) and apply it consistently when accepting config, validating endpoints, recording evidence, and summarizing it. Add a deployment test using a trailing-slash discovery suggestion and a non-root endpoint path when those are supported by the uploader; verify every required `file + sha256` is counted once for each server and publishing proceeds.

### CR-02: [BLOCKER] NIP-46 session secrets are still exposed through process arguments

**File:** `packages/build-tools/src/secret-store.ts:86-90`; `packages/vite-plugin/src/optimizer/node-services.ts:300-318`; `packages/cli/src/key-store.ts:120-131,177-184`

**Issue:** The macOS build-tools provider passes the `RedactedSecret` to `security ... -w`; the Node adapter then unwraps it into the spawned argument list. Independently, the CLI’s macOS provider passes `secret.secret` to `security -w`, and its Windows provider passes it as `cmdkey /pass:<secret>`. Those command-line arguments are observable by other local processes. Disabling only the build-tools Windows provider did not resolve the cross-platform secret/process-argv vulnerability.

**Fix:** Do not invoke `security -w` or `cmdkey /pass:` with a secret in argv. Use a native credential/keychain API that accepts a protected input channel, or mark the affected write providers unavailable until one exists. Add tests that inspect the actual command adapter calls and assert no argument contains the session secret for every supported platform.

## Warnings

### WR-01: [WARNING] The large fixture does not execute the final rewritten application

**File:** `packages/vite-plugin/src/optimizer/large-fixture.ts:275-284`

**Issue:** The fixture extracts private-loader callsites from `finalHtml` using a regular expression and invokes a local `response` stub. It never runs the generated final script, `window.__nappletPrivateResourceLoader.response`, or `window.napplet.resource.bytes`. A broken rewrite, missing loader injection, or runtime mismatch can therefore pass while the assertion claims every final resource callsite executed.

**Fix:** Execute the final inline module/script in a browser-like or VM harness with a fake `window.napplet.resource`, then assert that the generated loader requested every expected Blossom URI and that the real rewritten callsites received verified responses. Keep the source/hash assertions as a separate structural test.

### WR-02: [WARNING] A verified signer session leaks when persistence or status output fails

**File:** `packages/build-tools/src/terminal.ts:94-117`

**Issue:** After `Promise.any` returns a verified session, a failure in `secretStore.set` or `terminal.writeStatus` is converted to a generic failure. The session has no reference available to the `finally` block, so it is not closed. For a QR winner, `pairing.close()` is intentionally skipped; for a pasted winner, only the QR pairing is closed. The user receives no signer but its remote connection can remain live.

**Fix:** Retain the verified session in an outer variable and, when any post-pairing step fails before return, close that session exactly once before throwing the redacted error. Add tests for a failing secret store and failing status writer for both QR and pasted flows.

### WR-03: [WARNING] The exported build signer accepts an identity different from its configured remote signer

**File:** `packages/build-tools/src/signer.ts:77-107`

**Issue:** `createBuildSigner` validates that a `get_public_key` response looks like a hex public key, then uses that returned key as the expected signing key. It never compares it with `services.remotePubkey`. Callers that use this public API directly can bind uploads to an arbitrary responding signer even though they supplied the intended remote identity. The terminal pairing wrapper checks this separately, but it does not protect other callers.

**Fix:** Require `response.result === services.remotePubkey` in `getPublicKey()` and reject mismatches with the existing safe error path. Add a signer test where a syntactically valid but different key is returned and ensure both `getPublicKey` and `signEvent` fail.

---

_Reviewed: 2026-08-21T18:43:30Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
