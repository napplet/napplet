---
phase: 128-central-shim-integration
verified: 2026-04-20T15:10:00Z
status: passed
score: 5/5 must-haves verified
re_verification: false
---

# Phase 128: Central Shim Integration Verification Report

**Phase Goal:** Napplets that `import '@napplet/shim'` get `window.napplet.resource` mounted automatically and can detect resource-NUB + per-scheme support via `shell.supports()`.
**Verified:** 2026-04-20T15:10:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                                                                             | Status     | Evidence                                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| 1   | After `import '@napplet/shim'`, `window.napplet.resource.bytes` and `window.napplet.resource.bytesAsObjectURL` are both callable functions.       | ✓ VERIFIED | Smoke test T1-T3 pass; `resource: { bytes: resourceBytes, bytesAsObjectURL: resourceBytesAsObjectURL }` at index.ts:191-194 |
| 2   | Inbound envelopes with `type` starting `resource.` are routed to `handleResourceMessage` exactly once (no double-dispatch, no drop).              | ✓ VERIFIED | Smoke test T5 pass; routing branch at index.ts:97-101; `handleResourceMessage` at index.ts:99             |
| 3   | Shim central installer calls `installResourceShim()` exactly once, following the established 9-NUB pattern.                                       | ✓ VERIFIED | `installResourceShim();` standalone at index.ts:230; 2 occurrences total (1 import + 1 install)            |
| 4   | `shell.supports('nub:resource')` and `shell.supports('resource:scheme:<name>')` route through existing pass-through without shim-side hardcoding. | ✓ VERIFIED | Smoke test T6 pass; `shell.supports` at index.ts:195-200 is unchanged; returns `boolean` for any query    |
| 5   | Workspace-wide `pnpm -r type-check` exits 0 across all 14 packages — DEF-125-01 closed.                                                          | ✓ VERIFIED | `pnpm -r type-check` ran: 14 packages, all Done, exit 0; no TS2741 in @napplet/shim                       |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact                            | Expected                                                                                     | Status     | Details                                                                                                    |
| ----------------------------------- | -------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| `packages/shim/src/index.ts`        | Resource NUB integration: import block, install call, global mount, routing branch           | ✓ VERIFIED | +19 lines, 0 deletions; all 4 surgical edits confirmed by grep                                             |
| `packages/shim/dist/index.js`       | Built artifact containing resource integration                                               | ✓ VERIFIED | Exists; grep confirms `installResourceShim`, `handleResourceMessage`, `resourceBytes` present              |
| `packages/nub/dist/resource/shim.js`| Phase 126 deliverable providing `bytes`, `bytesAsObjectURL`, `installResourceShim`, `handleResourceMessage` | ✓ VERIFIED | File exists; exports confirmed by smoke test import chain resolving                              |

### Key Link Verification

| From                                              | To                                        | Via                                              | Status     | Details                                                           |
| ------------------------------------------------- | ----------------------------------------- | ------------------------------------------------ | ---------- | ----------------------------------------------------------------- |
| `packages/shim/src/index.ts` import block         | `@napplet/nub/resource/shim`              | `from '@napplet/nub/resource/shim'` at line 53   | ✓ WIRED    | Named imports confirmed: `installResourceShim`, `handleResourceMessage`, `bytes as resourceBytes`, `bytesAsObjectURL as resourceBytesAsObjectURL` |
| `handleEnvelopeMessage` central dispatcher        | `handleResourceMessage`                   | `type.startsWith('resource.')` at line 98        | ✓ WIRED    | Branch at lines 97-101; smoke test T5 proves routing settles pending Promise |
| `window.napplet` literal                          | `NappletGlobal.resource` shape (Phase 125) | `resource: { bytes: resourceBytes, bytesAsObjectURL: resourceBytesAsObjectURL }` at lines 191-194 | ✓ WIRED | Shape satisfies locked type; `pnpm --filter @napplet/shim type-check` exits 0 |
| Init sequence                                     | `installResourceShim()` call site          | Standalone call at line 230                      | ✓ WIRED    | Exactly 1 standalone call (grep: `^\s*installResourceShim\(\);\s*$` matches line 230) |

### Data-Flow Trace (Level 4)

| Artifact                     | Data Variable          | Source                              | Produces Real Data | Status      |
| ---------------------------- | ---------------------- | ----------------------------------- | ------------------ | ----------- |
| `window.napplet.resource.bytes` | `resourceBytes` (alias) | `@napplet/nub/resource/shim` (Phase 126) | Yes — Phase 126 builds real fetch + data: decode logic | ✓ FLOWING |
| `window.napplet.resource.bytesAsObjectURL` | `resourceBytesAsObjectURL` (alias) | `@napplet/nub/resource/shim` (Phase 126) | Yes — Phase 126 produces real object-URL wrapping | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior                                                         | Command                                         | Result                                             | Status  |
| ---------------------------------------------------------------- | ----------------------------------------------- | -------------------------------------------------- | ------- |
| `window.napplet.resource.{bytes,bytesAsObjectURL}` callable      | Node smoke test (dynamic import built dist)     | "PASS [T1-T3]: window.napplet.resource.{bytes,bytesAsObjectURL} are callable functions" | ✓ PASS |
| `bytes('data:...')` resolves Blob with correct bytes             | Node smoke test T4                              | "PASS [T4]: bytes(data:) resolves Blob with "hello"" | ✓ PASS |
| `resource.bytes.result` envelope routed to `handleResourceMessage` via central dispatcher (SHIM-01) | Node smoke test T5 | "PASS [T5]: resource.bytes.result routed by handleEnvelopeMessage to handleResourceMessage; Promise settled" | ✓ PASS |
| `shell.supports('nub:resource')` returns boolean (pass-through) | Node smoke test T6                              | "PASS [T6]: shell.supports("nub:resource") returns boolean" | ✓ PASS |
| Per-package type-check                                           | `pnpm --filter @napplet/shim type-check`        | Exit 0, no errors                                  | ✓ PASS |
| Workspace-wide type-check (DEF-125-01)                          | `pnpm -r type-check`                            | 14 packages, all Done, exit 0                      | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description                                                                     | Status      | Evidence                                                                                              |
| ----------- | ----------- | ------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------- |
| SHIM-01     | 128-01-PLAN | `handleEnvelopeMessage` contains `resource.*` routing branch calling `handleResourceMessage` | ✓ SATISFIED | index.ts:97-101; smoke test T5 proves end-to-end routing settles pending Promise                     |
| SHIM-02     | 128-01-PLAN | `window.napplet.resource` namespace mounted with `bytes` and `bytesAsObjectURL`  | ✓ SATISFIED | index.ts:191-194; smoke tests T1-T3 confirm both callable through built entry point                  |
| SHIM-03     | 128-01-PLAN | `installResourceShim()` called exactly once from central shim init sequence      | ✓ SATISFIED | index.ts:230; standalone grep returns exactly 1 line; idempotent per Phase 126 `installed` guard     |
| CAP-01      | 128-01-PLAN | `shell.supports('nub:resource')` routes through existing pass-through, no shim hardcoding | ✓ SATISFIED | `shell.supports` at index.ts:195-200 is unchanged; smoke test T6 confirms boolean return             |
| CAP-02      | 128-01-PLAN | `shell.supports('resource:scheme:<name>')` routes through existing pass-through   | ✓ SATISFIED | Same pass-through; shim does not enumerate or pre-judge schemes; shell answers downstream            |

### Anti-Patterns Found

| File                              | Line | Pattern                                                       | Severity | Impact                                                                                             |
| --------------------------------- | ---- | ------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------- |
| `packages/shim/src/index.ts`      | 197  | `// TODO: Shell populates supported capabilities at iframe creation` | Info | Pre-existing; intentional by design — `shell.supports` is a pass-through stub awaiting shell-side population. Explicitly documented in plan (CAP-01/CAP-02 design note). Not a stub in the sense of blocking any phase goal. |

No blockers. No warnings. The single TODO is pre-existing, intentional, and documented.

### Human Verification Required

None. All success criteria are fully verifiable programmatically. Behavioral spot-checks cover all runtime behaviors through the built dist artifact.

### Gaps Summary

No gaps. All 5 must-have truths verified. All 4 key links wired. Both artifacts substantive and data-flowing. Workspace-wide `pnpm -r type-check` exits 0 (14/14 packages). Atomic commit `70c7b85` lands with full per-REQ traceability footer. DEF-125-01 is closed.

---

_Verified: 2026-04-20T15:10:00Z_
_Verifier: Claude (gsd-verifier)_
